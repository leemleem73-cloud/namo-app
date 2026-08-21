/* Inventory menu bridge v4.1: stable QR labels, mobile detail link and complete detail layout, 2026-08-21. */
(function(){
  'use strict';

  let root=null,host=null,current='overview',txCache=[],txCacheAt=0,pendingCriteria=null,directOpening=false;
  const sections=[['overview','재고현황'],['movement','입출고 관리'],['lot','LOT별 재고'],['production','생산투입/완료'],['count','재고실사']];
  const typeLabels={RECEIPT:'입고',ISSUE:'출고',MOVE:'이동',ADJUSTMENT:'조정',PRODUCTION_ISSUE:'생산투입',PRODUCTION_RECEIPT:'생산완료',SHIPMENT:'출하',RETURN:'반품',HOLD:'보류',RELEASE:'보류해제'};
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const upper=v=>clean(v).toUpperCase();
  const MAIN_LOGO='https://namochemical.com/img/svg/img_logo.svg';
  const FALLBACK_LOGO='/assets/namo-header-logo.svg';
  const QR_KEY='inventoryTx';
  const QR_ERROR='QR 생성 모듈을 불러오지 못했습니다.';

  function directId(){try{return clean(new URL(location.href).searchParams.get(QR_KEY));}catch(error){return'';}}
  function clearDirectUrl(){try{const url=new URL(location.href);url.searchParams.delete(QR_KEY);url.searchParams.delete('pkg');url.searchParams.delete('total');history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`);}catch(error){}}
  function iqcRows(){const db=window.DB||{},rows=[];[db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].forEach(list=>{if(Array.isArray(list))list.forEach(row=>{if(row&&!rows.includes(row))rows.push(row);});});return rows;}
  function detailCell(sheet,label){return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;}
  function detailValue(sheet,label){return clean(detailCell(sheet,label)?.querySelector('dd')?.textContent)||'-';}
  function makeCell(label,value,wide=false){const div=document.createElement('div');if(wide){div.className='wide';div.style.setProperty('grid-column','1 / -1','important');}const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value||'-';div.append(dt,dd);return div;}
  function normDoc(value){return upper(value).replace(/^IQC:/,'');}
  function firstDate(row,keys){for(const key of keys){const source=clean(row?.[key]);const match=source.match(/\d{4}-\d{2}-\d{2}/);if(match)return match[0];if(source)return source;}return'-';}
  function packaging(row,tx){const type=clean(row?.packagingType||row?.packaging_type||row?.packageType||row?.package_type||row?.packType||row?.packingType||row?.containerType||tx?.packaging_type||tx?.packagingType),other=clean(row?.packagingTypeOther||row?.packaging_type_other||row?.packageTypeOther||tx?.packaging_type_other||tx?.packagingTypeOther);return type==='기타'&&other?`기타(${other})`:(type||'-');}
  function findIqc(base,tx){const doc=normDoc(base.documentNo||tx?.reference_no),lot=upper(base.lot||tx?.lot_no),name=upper(base.material||tx?.item_name||tx?.item_code),rows=iqcRows();return rows.find(row=>doc&&doc!=='-'&&normDoc(row?.inNo||row?.in_no||row?.receiptNo)===doc)||rows.find(row=>upper(row?.lot||row?.lotNo||row?.lot_no)===lot&&upper(row?.name||row?.material||row?.item||row?.itemName)===name)||rows.find(row=>upper(row?.lot||row?.lotNo||row?.lot_no)===lot)||null;}
  function direction(tx,baseValue){if(clean(baseValue)&&baseValue!=='-')return clean(baseValue);const from=clean(tx?.from_location||tx?.fromLocation)||'외부입고',to=clean(tx?.to_location||tx?.toLocation)||'외부출고';return`${from} → ${to}`;}
  function reference(tx,baseValue){if(clean(baseValue)&&baseValue!=='-')return clean(baseValue);const ref=clean(tx?.reference_no||tx?.referenceNo);if(/^IQC:/i.test(ref))return'수입검사 자동입고';if(/^WOISSUE:/i.test(ref))return'생산투입 자동처리';if(/^WO:/i.test(ref))return'생산완료 자동입고';return clean(tx?.work_order_no||tx?.production_lot||ref)||'-';}
  function locationOf(tx,directionValue){const location=clean(tx?.to_location||tx?.toLocation||tx?.from_location||tx?.fromLocation);if(location)return location;const parts=clean(directionValue).split('→').map(clean).filter(Boolean);return parts.at(-1)||'-';}
  function countOf(value,tx,iqc){const candidates=[value,tx?.package_qty,tx?.packageQty,tx?.barcode_qty,tx?.barcodeQty,iqc?.packageQty,iqc?.package_qty];for(const candidate of candidates){const match=clean(candidate).replace(/,/g,'').match(/\d+/);if(match&&Number(match[0])>0)return Math.min(500,Math.trunc(Number(match[0])));}return 1;}

  function captureBase(sheet){if(sheet.__qmesBase)return sheet.__qmesBase;sheet.__qmesBase={documentNo:detailValue(sheet,'문서번호'),material:detailValue(sheet,'원료명'),type:detailValue(sheet,'구분'),lot:detailValue(sheet,'LOT'),packaging:detailValue(sheet,'포장형태'),received:detailValue(sheet,'입고일자'),inspected:detailValue(sheet,'검사일자'),quantity:detailValue(sheet,'총 수량'),packageQty:detailValue(sheet,'입고 포장수량'),direction:detailValue(sheet,'이동 방향'),remark:detailValue(sheet,'비고'),created:clean(sheet.querySelector('.inv-tx-detail-status span')?.textContent)};return sheet.__qmesBase;}
  function dataFor(sheet,tx){const base=captureBase(sheet),iqc=findIqc(base,tx),packageCount=countOf(base.packageQty,tx,iqc),packageQty=base.packageQty!=='-'?base.packageQty:`${packageCount} EA`;return{material:base.material!=='-'?base.material:(clean(tx?.item_name||tx?.item_code)||'-'),type:base.type!=='-'?base.type:(typeLabels[upper(tx?.transaction_type)]||clean(tx?.transaction_type)||'-'),lot:base.lot!=='-'?base.lot:(clean(tx?.lot_no)||'-'),packaging:packaging(iqc,tx)||base.packaging,received:firstDate(iqc,['recv','recvDate','recv_date','receivedAt','received_at','inDate','in_date','receiptDate','receipt_date']),inspected:firstDate(iqc,['inspectedAt','inspected_at','inspectDate','inspect_date','inspectionDate','inspection_date','examDate','exam_date']),quantity:base.quantity!=='-'?base.quantity:`${clean(tx?.quantity)||'-'} ${clean(tx?.unit)}`.trim(),packageQty,direction:direction(tx,base.direction),remark:reference(tx,base.remark),location:locationOf(tx,base.direction),packageCount,txId:clean(tx?.id)};}
  function renderFields(sheet,data){const grid=sheet.querySelector('.inv-tx-detail-grid');if(!grid)return;grid.replaceChildren(makeCell('원료명',data.material),makeCell('구분',data.type),makeCell('LOT',data.lot),makeCell('포장형태',data.packaging),makeCell('입고일자',data.received),makeCell('검사일자',data.inspected),makeCell('총 수량',data.quantity),makeCell('입고 포장수량',data.packageQty),makeCell('이동 방향',data.direction,true),makeCell('비고',data.remark,true));}
  function normalizeHeader(sheet){const head=sheet.querySelector('.inv-tx-detail-head>div');if(!head)return;const small=head.querySelector('span');if(small){small.textContent='INVENTORY TRANSACTION';small.removeAttribute('style');}const title=head.querySelector('h3');if(title)title.textContent='입출고 처리 상세';}

  async function loadTransactions(force=false){if(!force&&txCache.length&&Date.now()-txCacheAt<15000)return txCache;try{const response=await fetch('/api/inventory/transactions?limit=2000',{credentials:'same-origin'}),payload=await response.json();if(response.ok&&payload?.success&&Array.isArray(payload.data)){txCache=payload.data;txCacheAt=Date.now();}}catch(error){console.warn('[QMES QR] 거래 조회 실패',error);}return txCache;}
  function localeDate(tx){try{return new Date(tx.created_at).toLocaleString('ko-KR');}catch(error){return'';}}
  async function matchTx(sheet){if(sheet.__qmesTx)return sheet.__qmesTx;const base=captureBase(sheet),rows=await loadTransactions(false),id=directId();let tx=id?rows.find(row=>clean(row?.id)===id):null;if(!tx&&pendingCriteria){tx=rows.find(row=>upper(row?.lot_no)===pendingCriteria.lot&&upper(row?.item_name||row?.item_code)===pendingCriteria.material&&clean(localeDate(row))===pendingCriteria.created)||rows.find(row=>upper(row?.lot_no)===pendingCriteria.lot&&upper(row?.item_name||row?.item_code)===pendingCriteria.material);pendingCriteria=null;}if(!tx){const doc=upper(base.documentNo);tx=rows.find(row=>doc&&doc!=='-'&&[row?.reference_no,row?.work_order_no,row?.production_lot,row?.id?`TX-${row.id}`:''].map(upper).includes(doc));}if(!tx){const lot=upper(base.lot),material=upper(base.material);tx=rows.find(row=>upper(row?.lot_no)===lot&&upper(row?.item_name||row?.item_code)===material&&(!base.created||clean(localeDate(row))===base.created))||rows.find(row=>upper(row?.lot_no)===lot&&upper(row?.item_name||row?.item_code)===material);}if(tx)sheet.__qmesTx=tx;return tx||null;}

  function qrUrl(txId,index,total){const url=new URL(location.href);url.hash='';url.searchParams.set(QR_KEY,txId);url.searchParams.set('pkg',String(index));url.searchParams.set('total',String(total));return url.toString();}
  function qrLibraryReady(){return Boolean(window.QRCode&&(typeof window.QRCode.toDataURL==='function'||typeof window.QRCode==='function'));}
  async function ensureQrLibrary(){if(qrLibraryReady())return window.QRCode;if(typeof window.qmesEnsureInventoryQr==='function')return window.qmesEnsureInventoryQr();throw new Error(QR_ERROR);}
  async function qrData(url){
    const QR=await ensureQrLibrary();
    if(QR&&typeof QR.toDataURL==='function'){
      return QR.toDataURL(url,{errorCorrectionLevel:'M',margin:1,width:420,color:{dark:'#111827',light:'#ffffff'}});
    }
    if(typeof QR==='function'){
      const holder=document.createElement('div');
      holder.setAttribute('aria-hidden','true');
      holder.style.cssText='position:fixed;left:-10000px;top:-10000px;width:420px;height:420px;overflow:hidden;pointer-events:none;';
      document.body.appendChild(holder);
      try{
        new QR(holder,{text:url,width:420,height:420,colorDark:'#111827',colorLight:'#ffffff',correctLevel:QR.CorrectLevel?.M});
        const canvas=holder.querySelector('canvas');
        if(canvas&&typeof canvas.toDataURL==='function')return canvas.toDataURL('image/png');
        const image=holder.querySelector('img');
        if(image?.src)return image.src;
      }finally{
        holder.remove();
      }
    }
    throw new Error(QR_ERROR);
  }

  async function renderPreview(sheet,tx,data){
    const wrap=sheet.querySelector('.inv-tx-barcode');
    if(!wrap)return true;
    wrap.replaceChildren();
    const info=document.createElement('div'),title=document.createElement('b'),sub=document.createElement('span');
    title.textContent='입출고 상세 QR';
    sub.textContent=tx?.id?'휴대폰 카메라로 스캔하면 해당 상세화면이 열립니다.':'거래번호를 확인하지 못했습니다.';
    info.append(title,sub);
    wrap.appendChild(info);
    if(!tx?.id)return true;
    const loading=document.createElement('div');
    loading.textContent='QR을 생성하는 중입니다.';
    loading.style.cssText='padding:18px;text-align:center;color:#64748b;font-weight:700;';
    wrap.appendChild(loading);
    try{
      const image=document.createElement('img');
      image.src=await qrData(qrUrl(tx.id,1,data.packageCount));
      image.alt=`${data.material} ${data.lot} 상세 QR`;
      image.style.cssText='display:block;width:180px;height:180px;object-fit:contain;margin:12px auto 0';
      loading.replaceWith(image);
      wrap.dataset.qmesQrState='ready';
      return true;
    }catch(error){
      loading.textContent=error?.message||QR_ERROR;
      loading.dataset.qmesQrError='1';
      wrap.dataset.qmesQrState='error';
      return false;
    }
  }

  function htmlEscape(value){return String(value==null?'-':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  async function printLabels(sheet){
    const tx=await matchTx(sheet);
    if(!tx?.id){alert('입출고 거래번호를 찾지 못해 QR을 만들 수 없습니다. 새로고침 후 다시 시도해 주세요.');return;}
    const data=dataFor(sheet,tx),count=data.packageCount;
    let labels;
    try{
      labels=await Promise.all(Array.from({length:count},async(_,index)=>({no:index+1,qr:await qrData(qrUrl(tx.id,index+1,count))})));
    }catch(error){alert(error?.message||QR_ERROR);return;}
    const win=open('','_blank','width=780,height=780');
    if(!win)return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${htmlEscape(data.material)} QR 라벨</title><style>@page{size:60mm 40mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;font-family:Arial,'Noto Sans KR',sans-serif;color:#111827}.label{position:relative;width:60mm;height:40mm;padding:2.2mm;border:.25mm solid #d0d5dd;overflow:hidden;page-break-after:always}.label:last-child{page-break-after:auto}.top{height:6mm;display:flex;align-items:center;justify-content:space-between;border-bottom:.25mm solid #111827;padding-bottom:1mm}.top img{display:block;width:auto;height:4.8mm;max-width:33mm;object-fit:contain}.pkg{font-size:8px;font-weight:900}.body{display:grid;grid-template-columns:1fr 25mm;gap:1.5mm;height:29mm;padding-top:1.5mm}.meta{display:flex;min-width:0;flex-direction:column;justify-content:center}.meta small{font-size:6px;color:#64748b;font-weight:700;margin-top:.7mm}.meta strong{font-size:9px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qr{display:flex;align-items:center;justify-content:center}.qr img{width:25mm;height:25mm;object-fit:contain}.scan{position:absolute;left:2.2mm;bottom:1.3mm;font-size:5.5px;color:#475467;font-weight:700}@media print{.label{break-inside:avoid}}</style></head><body>${labels.map(label=>`<section class="label"><div class="top"><img src="${MAIN_LOGO}" alt="NAMO Chemical" onerror="this.onerror=null;this.src='${FALLBACK_LOGO}'"><div class="pkg">${label.no} / ${count}</div></div><div class="body"><div class="meta"><small>원료명</small><strong>${htmlEscape(data.material)}</strong><small>LOT</small><strong>${htmlEscape(data.lot)}</strong><small>위치</small><strong>${htmlEscape(data.location)}</strong></div><div class="qr"><img src="${label.qr}" alt="입출고 상세 QR"></div></div><div class="scan">휴대폰 카메라로 QR을 스캔해 상세정보 확인</div></section>`).join('')}</body></html>`);
    win.document.close();
    let done=false;
    const run=()=>{if(done)return;done=true;setTimeout(()=>{win.focus();win.print();},180);};
    const images=Array.from(win.document.images),waiting=images.filter(image=>!image.complete);
    if(!waiting.length)run();
    else{
      let left=waiting.length;
      const one=()=>{left-=1;if(left<=0)run();};
      waiting.forEach(image=>{image.addEventListener('load',one,{once:true});image.addEventListener('error',one,{once:true});});
      setTimeout(run,1800);
    }
  }

  function ensurePrintButton(sheet,data){const currentButton=sheet.querySelector('.inv-tx-detail-actions .primary');if(!currentButton)return;if(currentButton.dataset.qmesQrPrint==='1'){currentButton.textContent=`QR 라벨 ${data.packageCount}매 인쇄`;return;}const button=currentButton.cloneNode(true);button.type='button';button.textContent=`QR 라벨 ${data.packageCount}매 인쇄`;button.dataset.qmesQrPrint='1';currentButton.replaceWith(button);button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void printLabels(sheet);},true);}
  async function upgrade(sheet){
    if(!sheet||sheet.dataset.qmesQrBusy==='1')return;
    const grid=sheet.querySelector('.inv-tx-detail-grid');
    if(!grid)return;
    if(sheet.dataset.qmesQrDone==='1'&&!detailCell(sheet,'작업자')&&sheet.querySelector('[data-qmes-qr-print="1"]'))return;
    if(sheet.dataset.qmesQrDone==='error'&&!qrLibraryReady())return;
    sheet.dataset.qmesQrBusy='1';
    try{
      normalizeHeader(sheet);
      const immediate=dataFor(sheet,null);
      renderFields(sheet,immediate);
      ensurePrintButton(sheet,immediate);
      const tx=await matchTx(sheet),data=dataFor(sheet,tx);
      sheet.__qmesData=data;
      renderFields(sheet,data);
      ensurePrintButton(sheet,data);
      const previewReady=await renderPreview(sheet,tx,data);
      sheet.dataset.qmesQrDone=previewReady?'1':'error';
    }finally{
      sheet.dataset.qmesQrBusy='0';
    }
  }

  function paginate(){if(current!=='movement'||!host)return;host.querySelectorAll('table').forEach(table=>{if(table.dataset.qmesPaged==='1')return;const body=table.tBodies?.[0];if(!body||body.rows.length<=10)return;table.dataset.qmesPaged='1';let page=1;const rows=Array.from(body.rows),size=10,pages=Math.ceil(rows.length/size),nav=document.createElement('div');nav.className='qmes-inv-pagination';nav.style.cssText='display:flex;gap:6px;justify-content:center;align-items:center;padding:16px 0;flex-wrap:wrap';function render(){rows.forEach((row,index)=>row.style.display=index>=(page-1)*size&&index<page*size?'':'none');nav.replaceChildren();const add=(label,target,disabled,active=false)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=disabled;button.style.cssText=`min-width:34px;padding:7px 10px;border:1px solid #d0d5dd;border-radius:7px;background:${active?'#111827':'#fff'};color:${active?'#fff':'#344054'};opacity:${disabled?'.45':'1'}`;button.onclick=()=>{page=target;render();};nav.appendChild(button);};add('이전',Math.max(1,page-1),page===1);for(let number=1;number<=pages;number++)add(String(number),number,false,number===page);add('다음',Math.min(pages,page+1),page===pages);}table.after(nav);render();});}
  function cleanMovement(){if(current!=='movement'||!host)return;host.querySelectorAll('button').forEach(button=>{if(clean(button.textContent)==='입출고 처리'&&!button.closest('.inv-tx-detail-sheet'))button.remove();});}
  function watch(){document.querySelectorAll('.inv-tx-detail-sheet').forEach(sheet=>void upgrade(sheet));paginate();cleanMovement();}

  function customDirectModal(tx){document.querySelector('.inv-tx-detail-overlay[data-qmes-direct="1"]')?.remove();const overlay=document.createElement('div');overlay.className='inv-tx-detail-overlay';overlay.dataset.qmesDirect='1';const sheet=document.createElement('section');sheet.className='inv-tx-detail-sheet';sheet.__qmesTx=tx;sheet.innerHTML=`<div class="inv-tx-detail-head"><div><span>INVENTORY TRANSACTION</span><h3>입출고 처리 상세</h3></div><button type="button" aria-label="닫기">×</button></div><div class="inv-tx-detail-status"><b>처리 완료</b><span>${htmlEscape(localeDate(tx))}</span></div><dl class="inv-tx-detail-grid"><div><dt>문서번호</dt><dd>${htmlEscape(tx.reference_no||tx.id)}</dd></div><div><dt>구분</dt><dd>${htmlEscape(typeLabels[upper(tx.transaction_type)]||tx.transaction_type)}</dd></div><div><dt>원료명</dt><dd>${htmlEscape(tx.item_name||tx.item_code)}</dd></div><div><dt>LOT</dt><dd>${htmlEscape(tx.lot_no)}</dd></div><div><dt>총 수량</dt><dd>${htmlEscape(`${tx.quantity||'-'} ${tx.unit||''}`)}</dd></div><div><dt>포장형태</dt><dd>${htmlEscape(tx.packaging_type||'-')}</dd></div><div><dt>입고 포장수량</dt><dd>${htmlEscape(tx.package_qty?`${tx.package_qty} EA`:'-')}</dd></div><div class="wide" style="grid-column:1 / -1"><dt>이동 방향</dt><dd>${htmlEscape(direction(tx,'-'))}</dd></div><div class="wide" style="grid-column:1 / -1"><dt>비고</dt><dd>${htmlEscape(reference(tx,'-'))}</dd></div></dl><div class="inv-tx-barcode"></div><div class="inv-tx-detail-actions"><button type="button" class="qmes-direct-close">닫기</button><button type="button" class="primary">QR 라벨 인쇄</button></div>`;overlay.appendChild(sheet);document.body.appendChild(overlay);const close=()=>{overlay.remove();clearDirectUrl();};sheet.querySelector('.inv-tx-detail-head>button').onclick=close;sheet.querySelector('.qmes-direct-close').onclick=close;overlay.onmousedown=event=>{if(event.target===overlay)close();};void upgrade(sheet);}
  async function openDirect(){const id=directId();if(!id||directOpening)return;directOpening=true;const rows=await loadTransactions(true),tx=rows.find(row=>clean(row?.id)===id);if(!tx){alert('QR에 연결된 입출고 기록을 찾지 못했습니다.');clearDirectUrl();directOpening=false;return;}customDirectModal(tx);}

  function restore(){if(root){try{root.unmount();}catch(error){}root=null;}host?.remove();host=null;const main=document.querySelector('#root>div>main');if(main)Array.from(main.children).forEach(node=>{if(node.dataset.invHidden==='1'){node.style.removeProperty('display');delete node.dataset.invHidden;}});}
  function sidebar(){const side=document.getElementById('qmes-sync-sidebar'),wrap=side?.querySelector('.qmes-side-items');if(!wrap)return;const title=side.querySelector('.qmes-side-title');if(title)title.textContent='재고관리';wrap.replaceChildren();sections.forEach(([id,label])=>{const button=document.createElement('button');button.type='button';button.className=`qmes-side-item${current===id?' is-active':''}`;button.textContent=label;button.onclick=event=>{event.stopPropagation();openInventory(id);};wrap.appendChild(button);});}
  function component(){if(typeof window.InventoryEnterpriseTab==='function')return window.InventoryEnterpriseTab;try{if(typeof InventoryEnterpriseTab==='function')return InventoryEnterpriseTab;}catch(error){}return null;}
  function openInventory(section='overview'){current=sections.some(item=>item[0]===section)?section:'overview';const main=document.querySelector('#root>div>main'),Component=component();if(!main||!Component)return;Array.from(main.children).forEach(node=>{if(node!==host){node.dataset.invHidden='1';node.style.setProperty('display','none','important');}});if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}if(root){try{root.unmount();}catch(error){}}host.replaceChildren();root=ReactDOM.createRoot(host);root.render(React.createElement(Component,{section:current}));try{sessionStorage.setItem('qmes_inventory_section',current);}catch(error){}if(typeof window.qmesSetGlobalSidebarGroup==='function')window.qmesSetGlobalSidebarGroup('재고관리');setTimeout(()=>{sidebar();watch();if(directId())void openDirect();},120);}
  function install(){const nav=document.querySelector('.qmes-top-menu');if(!nav)return false;const existing=nav.querySelector('[data-qmes-inventory-menu]');if(existing){if(directId()&&!host)openInventory('movement');return true;}const item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qmesInventoryMenu='1';const button=document.createElement('button');button.type='button';button.className='qmes-top-menu-button';button.innerHTML='<span>▣</span><span>재고관리</span><span>›</span>';button.onclick=()=>{let saved='overview';try{saved=sessionStorage.getItem('qmes_inventory_section')||saved;}catch(error){}openInventory(saved);};item.appendChild(button);const trace=Array.from(nav.children).find(node=>clean(node.textContent).includes('LOT 추적'));trace?trace.after(item):nav.appendChild(item);document.addEventListener('click',event=>{const target=event.target.closest?.('.qmes-top-menu-button');if(target&&target!==button&&!target.closest('[data-qmes-inventory-menu]')&&host)restore();},true);window.qmesOpenInventorySection=openInventory;if(directId())openInventory('movement');return true;}

  document.addEventListener('qmes:inventory-qr-ready',()=>{
    document.querySelectorAll('.inv-tx-detail-sheet').forEach(sheet=>{
      if(sheet.dataset.qmesQrDone==='error'){
        sheet.dataset.qmesQrDone='0';
        sheet.dataset.qmesQrBusy='0';
      }
    });
    watch();
  });
  document.addEventListener('click',event=>{const link=event.target.closest?.('.inv-tx-detail-link');if(link){const cells=link.closest('tr')?.querySelectorAll('td');if(cells?.length>=4)pendingCriteria={created:clean(link.textContent),material:upper(cells[2].textContent),lot:upper(cells[3].textContent)};}const print=event.target.closest?.('[data-qmes-qr-print="1"]');if(print){const sheet=print.closest('.inv-tx-detail-sheet');if(sheet){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void printLabels(sheet);}}},true);
  new MutationObserver(()=>{install();watch();}).observe(document.documentElement,{childList:true,subtree:true});
  install();
  watch();
})();
