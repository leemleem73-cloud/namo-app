/* Inventory menu bridge v3.4: detail without logo + print-only main NAMO logo, 2026-08-21. */
(function(){
  let root=null,host=null,current='overview';
  const sections=[['overview','재고현황'],['movement','입출고 관리'],['lot','LOT별 재고'],['production','생산투입/완료'],['count','재고실사']];
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const upper=v=>clean(v).toUpperCase();
  const PRINT_LOGO='https://namochemical.com/img/svg/img_logo.svg';

  function iqcRows(){
    const db=window.DB||{};
    const candidates=[db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC];
    const rows=[];
    candidates.forEach(list=>{if(Array.isArray(list))list.forEach(row=>{if(row&&!rows.includes(row))rows.push(row);});});
    return rows;
  }
  function cell(sheet,label){return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;}
  function value(sheet,label){return clean(cell(sheet,label)?.querySelector('dd')?.textContent)||'-';}
  function makeCell(label,val,wide=false){
    const div=document.createElement('div');if(wide)div.className='wide';
    const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=val||'-';div.append(dt,dd);return div;
  }
  function normalizeDoc(v){return upper(v).replace(/^IQC:/,'').trim();}
  function findIqc(sheet){
    const doc=normalizeDoc(value(sheet,'문서번호'));
    const lot=upper(value(sheet,'LOT'));
    const name=upper(value(sheet,'원료명'));
    const rows=iqcRows();
    return rows.find(row=>normalizeDoc(row?.inNo||row?.in_no||row?.receiptNo||row?.receipt_no)===doc&&doc&&doc!=='-')
      ||rows.find(row=>upper(row?.lot||row?.lotNo||row?.lot_no)===lot&&lot&&lot!=='-'&&upper(row?.name||row?.material||row?.item||row?.itemName||row?.item_name)===name)
      ||rows.find(row=>upper(row?.lot||row?.lotNo||row?.lot_no)===lot&&lot&&lot!=='-')
      ||null;
  }
  function packaging(row){
    if(!row)return'';
    const type=clean(row.packagingType||row.packaging_type||row.packageType||row.package_type||row.packType||row.pack_type||row.packingType||row.packing_type||row.containerType||row.container_type||row.packaging||row.package);
    const other=clean(row.packagingTypeOther||row.packaging_type_other||row.packageTypeOther||row.package_type_other||row.packagingOther||row.packaging_other);
    return type==='기타'&&other?`기타(${other})`:type;
  }
  function dateOnly(v){const s=clean(v);const m=s.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:(s&&s!=='-'?s:'-');}
  function firstDate(row,keys){for(const key of keys){const v=row?.[key];if(clean(v))return dateOnly(v);}return'-';}
  function buildData(sheet){
    const iqc=findIqc(sheet);
    let packageQty=value(sheet,'입고 포장수량');
    if((!packageQty||packageQty==='-')&&iqc){const n=iqc.packageQty??iqc.package_qty??iqc.packQty??iqc.pack_qty;if(n!==undefined&&n!==null&&clean(n))packageQty=`${clean(n)} EA`;}
    return {
      material:value(sheet,'원료명'),
      type:value(sheet,'구분'),
      lot:value(sheet,'LOT'),
      packaging:packaging(iqc)||value(sheet,'포장형태'),
      received:firstDate(iqc,['recv','recvDate','recv_date','receivedAt','received_at','inDate','in_date','receiptDate','receipt_date']),
      inspected:firstDate(iqc,['inspectedAt','inspected_at','inspectDate','inspect_date','inspectionDate','inspection_date','examDate','exam_date']),
      quantity:value(sheet,'총 수량'),
      packageQty:packageQty||'-',
      direction:value(sheet,'이동 방향'),
      operator:value(sheet,'작업자'),
      remark:value(sheet,'비고')
    };
  }
  function escapeHtml(v){return String(v??'-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function printSheet(sheet){
    const d=sheet.__qmesInventoryDetailData||buildData(sheet);
    const barcode=sheet.querySelector('.inv-tx-barcode svg')?.outerHTML||'<div class="barcode-missing">BARCODE</div>';
    const rows=[['원료명',d.material],['구분',d.type],['LOT',d.lot],['포장형태',d.packaging],['입고일자',d.received],['검사일자',d.inspected],['총 수량',d.quantity],['입고 포장수량',d.packageQty],['이동 방향',d.direction],['작업자',d.operator],['비고',d.remark]];
    const win=window.open('','_blank','width=930,height=900');if(!win)return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(d.material)} 바코드</title><style>
      @page{size:A4 portrait;margin:11mm}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#111827;font-family:Arial,'Noto Sans KR',sans-serif;background:#fff}.sheet{width:100%;border:1.2px solid #cbd5e1;border-radius:10px;padding:9mm}.head{display:flex;align-items:center;justify-content:space-between;gap:8mm;border-bottom:2px solid #111827;padding-bottom:4mm;margin-bottom:5mm}.brand{display:flex;align-items:center;min-width:0}.brand img{display:block;width:auto;height:12mm;max-width:70mm;object-fit:contain;object-position:left center}.brand-fallback{display:none;font-size:24px;font-weight:900;white-space:nowrap}.title{text-align:right}.title b{display:block;font-size:20px}.title span{display:block;margin-top:1mm;font-size:12px;color:#64748b}.grid{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #cbd5e1;border-left:1px solid #cbd5e1}.field{min-height:18mm;padding:3mm;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1}.field.wide{grid-column:1/-1}.field small{display:block;margin-bottom:1.5mm;color:#64748b;font-size:10px;font-weight:700}.field strong{font-size:15px;line-height:1.25;overflow-wrap:anywhere}.barcode{margin-top:6mm;border:1px dashed #94a3b8;border-radius:8px;padding:4mm;text-align:center}.barcode h3{margin:0 0 3mm;font-size:14px}.barcode svg{display:block!important;width:100%!important;height:38mm!important;max-width:none!important;max-height:none!important}.barcode-missing{padding:12mm;font-weight:800}.footer{margin-top:3mm;text-align:right;font-size:10px;color:#64748b}@media print{.sheet{break-inside:avoid}}
    </style></head><body><section class="sheet"><div class="head"><div class="brand"><img src="${PRINT_LOGO}" alt="NAMO Chemical" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="brand-fallback">NAMO Chemical</div></div><div class="title"><b>입출고 처리 상세</b><span>원료 바코드 라벨</span></div></div><div class="grid">${rows.map((row,index)=>`<div class="field${index===10?' wide':''}"><small>${escapeHtml(row[0])}</small><strong>${escapeHtml(row[1])}</strong></div>`).join('')}</div><div class="barcode"><h3>원료 · LOT · 위치 바코드 (CODE128)</h3>${barcode}</div><div class="footer">ERP 연동용 · ${escapeHtml(new Date().toLocaleString('ko-KR'))}</div></section></body></html>`);
    win.document.close();
    let printed=false;const run=()=>{if(printed)return;printed=true;setTimeout(()=>{win.focus();win.print();},180);};
    const image=win.document.querySelector('.brand img');if(image&&!image.complete){image.onload=run;image.onerror=run;setTimeout(run,1200);}else run();
  }

  function replacePrintButton(sheet){
    const original=sheet.querySelector('.inv-tx-detail-actions .primary');if(!original)return;
    if(original.dataset.qmesFinalPrint==='1')return;
    const button=original.cloneNode(true);button.textContent='바코드 인쇄';button.dataset.qmesFinalPrint='1';button.removeAttribute('onclick');
    original.replaceWith(button);
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();printSheet(sheet);},true);
  }
  function upgrade(sheet){
    if(!sheet)return;const grid=sheet.querySelector('.inv-tx-detail-grid');if(!grid)return;
    if(sheet.dataset.qmesDetailFinal!=='1'){
      const d=buildData(sheet);sheet.__qmesInventoryDetailData=d;
      grid.replaceChildren(makeCell('원료명',d.material),makeCell('구분',d.type),makeCell('LOT',d.lot),makeCell('포장형태',d.packaging),makeCell('입고일자',d.received),makeCell('검사일자',d.inspected),makeCell('총 수량',d.quantity),makeCell('입고 포장수량',d.packageQty),makeCell('이동 방향',d.direction),makeCell('작업자',d.operator),makeCell('비고',d.remark,true));
      const head=sheet.querySelector('.inv-tx-detail-head>div');if(head){const span=head.querySelector('span');if(span){span.textContent='INVENTORY TRANSACTION';span.removeAttribute('style');}const h3=head.querySelector('h3');if(h3)h3.textContent='입출고 처리 상세';}
      const svg=sheet.querySelector('.inv-tx-barcode svg');if(svg){svg.style.setProperty('height','110px','important');svg.style.setProperty('width','100%','important');}
      sheet.dataset.qmesDetailFinal='1';
    }
    replacePrintButton(sheet);
  }

  function paginate(){
    if(current!=='movement'||!host)return;
    host.querySelectorAll('table').forEach(table=>{
      if(table.dataset.qmesPaged==='1')return;const body=table.tBodies?.[0];if(!body||body.rows.length<=10)return;
      table.dataset.qmesPaged='1';let page=1;const size=10,rows=Array.from(body.rows),pages=Math.ceil(rows.length/size),nav=document.createElement('div');
      nav.className='qmes-inv-pagination';nav.style.cssText='display:flex;gap:6px;justify-content:center;align-items:center;padding:16px 0;flex-wrap:wrap';
      function render(){rows.forEach((row,index)=>row.style.display=index>=(page-1)*size&&index<page*size?'':'none');nav.replaceChildren();const add=(label,target,disabled,active=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.style.cssText=`min-width:34px;padding:7px 10px;border:1px solid #d0d5dd;border-radius:7px;background:${active?'#111827':'#fff'};color:${active?'#fff':'#344054'};cursor:${disabled?'default':'pointer'};opacity:${disabled?'.45':'1'}`;b.onclick=()=>{page=target;render();};nav.appendChild(b);};add('이전',Math.max(1,page-1),page===1);for(let p=1;p<=pages;p++)add(String(p),p,false,p===page);add('다음',Math.min(pages,page+1),page===pages);}
      table.after(nav);render();
    });
  }
  function cleanMovementButton(){if(current!=='movement'||!host)return;host.querySelectorAll('button').forEach(button=>{if(clean(button.textContent)==='입출고 처리'&&!button.closest('.inv-tx-detail-sheet'))button.remove();});}
  function watch(){document.querySelectorAll('.inv-tx-detail-sheet').forEach(upgrade);paginate();cleanMovementButton();}
  new MutationObserver(watch).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',event=>{const button=event.target.closest?.('.inv-tx-detail-actions .primary[data-qmes-final-print="1"]');if(!button)return;const sheet=button.closest('.inv-tx-detail-sheet');if(!sheet)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();printSheet(sheet);},true);

  function restore(){if(root){try{root.unmount();}catch(error){}root=null;}host?.remove();host=null;const main=document.querySelector('#root>div>main');if(main)Array.from(main.children).forEach(node=>{if(node.dataset.invHidden==='1'){node.style.removeProperty('display');delete node.dataset.invHidden;}});}
  function side(){const sidebar=document.getElementById('qmes-sync-sidebar'),wrap=sidebar?.querySelector('.qmes-side-items');if(!wrap)return;const title=sidebar.querySelector('.qmes-side-title');if(title)title.textContent='재고관리';wrap.replaceChildren();sections.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='qmes-side-item'+(current===id?' is-active':'');b.textContent=label;b.onclick=event=>{event.stopPropagation();open(id);};wrap.appendChild(b);});}
  function component(){if(typeof window.InventoryEnterpriseTab==='function')return window.InventoryEnterpriseTab;try{if(typeof InventoryEnterpriseTab==='function')return InventoryEnterpriseTab;}catch(error){}return null;}
  function open(section='overview'){current=sections.some(item=>item[0]===section)?section:'overview';const main=document.querySelector('#root>div>main'),Component=component();if(!main||!Component)return;Array.from(main.children).forEach(node=>{if(node!==host){node.dataset.invHidden='1';node.style.setProperty('display','none','important');}});if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}if(root){try{root.unmount();}catch(error){}}host.replaceChildren();root=ReactDOM.createRoot(host);root.render(React.createElement(Component,{section:current}));try{sessionStorage.setItem('qmes_inventory_section',current);}catch(error){}if(typeof window.qmesSetGlobalSidebarGroup==='function')window.qmesSetGlobalSidebarGroup('재고관리');setTimeout(()=>{side();watch();},100);}
  function install(){const nav=document.querySelector('.qmes-top-menu');if(!nav||nav.querySelector('[data-qmes-inventory-menu]'))return false;const item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qmesInventoryMenu='1';const button=document.createElement('button');button.type='button';button.className='qmes-top-menu-button';button.innerHTML='<span>▣</span><span>재고관리</span><span>›</span>';button.onclick=()=>{let saved='overview';try{saved=sessionStorage.getItem('qmes_inventory_section')||saved;}catch(error){}open(saved);};item.appendChild(button);const trace=Array.from(nav.children).find(node=>clean(node.textContent).includes('LOT 추적'));trace?trace.after(item):nav.appendChild(item);document.addEventListener('click',event=>{const target=event.target.closest?.('.qmes-top-menu-button');if(target&&target!==button&&!target.closest('[data-qmes-inventory-menu]')&&host)restore();},true);window.qmesOpenInventorySection=open;return true;}
  watch();const timer=setInterval(()=>{if(install())clearInterval(timer);},250);setTimeout(()=>clearInterval(timer),15000);
})();
