/* Inventory QR runtime + public read-only mobile detail, 2026-08-21. */
(function(){
  'use strict';

  document.getElementById('qmes-inventory-hover-menu')?.remove();
  if(window.__QMES_INV_PUBLIC_QR_DETAIL_V1__)return;
  window.__QMES_INV_PUBLIC_QR_DETAIL_V1__=true;

  const QR_PRIMARY='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  const QR_FALLBACK='https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js';
  const MAIN_LOGO='https://namochemical.com/img/svg/img_logo.svg';
  const FALLBACK_LOGO='/assets/namo-header-logo.svg';
  const MODULE_ERROR='QR 생성 모듈을 불러오지 못했습니다.';
  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  const qrReady=()=>Boolean(window.QRCode&&(typeof window.QRCode.toDataURL==='function'||typeof window.QRCode==='function'));

  function loadScript(src,key){
    return new Promise((resolve,reject)=>{
      if(qrReady()){resolve(window.QRCode);return;}
      const selector=`script[data-qmes-inventory-qr-source="${key}"]`;
      const existing=document.querySelector(selector);
      if(existing){
        const verify=()=>qrReady()?resolve(window.QRCode):reject(new Error(`QR 모듈 형식 오류: ${key}`));
        existing.addEventListener('load',verify,{once:true});
        existing.addEventListener('error',()=>reject(new Error(`QR 모듈 요청 실패: ${key}`)),{once:true});
        window.setTimeout(verify,1200);
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.crossOrigin='anonymous';
      script.dataset.qmesInventoryQrSource=key;
      script.onload=()=>qrReady()?resolve(window.QRCode):reject(new Error(`QR 모듈 형식 오류: ${key}`));
      script.onerror=()=>reject(new Error(`QR 모듈 요청 실패: ${key}`));
      document.head.appendChild(script);
    });
  }

  async function ensureQrLibrary(){
    if(qrReady())return window.QRCode;
    try{await loadScript(QR_PRIMARY,'cdnjs-qrcodejs-1.0.0');}
    catch(error){console.warn('[QMES QR] 기본 모듈 로드 실패',error.message);}
    if(qrReady())return window.QRCode;
    try{await loadScript(QR_FALLBACK,'jsdelivr-qrcodejs');}
    catch(error){console.warn('[QMES QR] 예비 모듈 로드 실패',error.message);}
    if(qrReady())return window.QRCode;
    throw new Error(MODULE_ERROR);
  }

  let qrPromise=null;
  window.qmesInventoryQrReady=qrReady;
  window.qmesEnsureInventoryQr=()=>{
    if(qrReady())return Promise.resolve(window.QRCode);
    if(!qrPromise){
      qrPromise=ensureQrLibrary().catch(error=>{qrPromise=null;throw error;});
    }
    return qrPromise;
  };

  async function qrData(text,width=420){
    const QR=await window.qmesEnsureInventoryQr();
    if(QR&&typeof QR.toDataURL==='function'){
      return QR.toDataURL(text,{errorCorrectionLevel:'M',margin:1,width,color:{dark:'#111827',light:'#ffffff'}});
    }
    if(typeof QR==='function'){
      const holder=document.createElement('div');
      holder.style.cssText=`position:fixed;left:-10000px;top:-10000px;width:${width}px;height:${width}px;overflow:hidden;pointer-events:none;`;
      document.body.appendChild(holder);
      try{
        new QR(holder,{text,width,height:width,colorDark:'#111827',colorLight:'#ffffff',correctLevel:QR.CorrectLevel?.M});
        const canvas=holder.querySelector('canvas');
        if(canvas&&typeof canvas.toDataURL==='function')return canvas.toDataURL('image/png');
        const image=holder.querySelector('img');
        if(image?.src)return image.src;
      }finally{holder.remove();}
    }
    throw new Error(MODULE_ERROR);
  }

  function findDetailCell(sheet,label){
    return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;
  }
  function detailValue(sheet,label){return clean(findDetailCell(sheet,label)?.querySelector('dd')?.textContent)||'-';}
  function parseCount(value){const match=clean(value).replace(/,/g,'').match(/\d+/);return match&&Number(match[0])>0?Math.min(500,Math.trunc(Number(match[0]))):1;}
  function destination(direction){const parts=clean(direction).split('→').map(clean).filter(Boolean);return parts.at(-1)||'-';}

  function cleanDetailLayout(sheet){
    const grid=sheet.querySelector('.inv-tx-detail-grid');
    if(!grid)return;
    Array.from(grid.children).forEach(node=>{
      const label=clean(node.querySelector('dt')?.textContent);
      const value=clean(node.querySelector('dd')?.textContent);
      if(!label&&!value)node.remove();
    });
    ['이동 방향','비고'].forEach(label=>{
      const field=findDetailCell(sheet,label);
      if(field){field.classList.add('wide');field.style.setProperty('grid-column','1 / -1','important');}
    });
    const header=sheet.querySelector('.inv-tx-detail-head>div>span');
    if(header&&header.querySelector('img')){
      header.replaceChildren(document.createTextNode('INVENTORY TRANSACTION'));
      header.removeAttribute('style');
    }
  }

  function encodePayload(payload){
    const json=JSON.stringify(payload);
    const bytes=new TextEncoder().encode(json);
    let binary='';
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk){binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));}
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function detailSnapshot(sheet,index=1,total=null){
    const packageCount=total||parseCount(detailValue(sheet,'입고 포장수량'));
    const movement=detailValue(sheet,'이동 방향');
    const tx=sheet.__qmesTx||{};
    return {
      v:1,
      x:clean(tx.id||''),
      m:detailValue(sheet,'원료명'),
      t:detailValue(sheet,'구분'),
      l:detailValue(sheet,'LOT'),
      p:detailValue(sheet,'포장형태'),
      rd:detailValue(sheet,'입고일자'),
      id:detailValue(sheet,'검사일자'),
      q:detailValue(sheet,'총 수량'),
      pc:detailValue(sheet,'입고 포장수량'),
      d:movement,
      loc:destination(movement),
      r:detailValue(sheet,'비고'),
      at:clean(sheet.querySelector('.inv-tx-detail-status span')?.textContent),
      n:index,
      total:packageCount
    };
  }

  function publicDetailUrl(sheet,index=1,total=null){
    const url=new URL('/inventory-qr-detail.html',location.origin);
    url.hash=`d=${encodePayload(detailSnapshot(sheet,index,total))}`;
    return url.toString();
  }

  async function renderPublicPreview(sheet){
    const wrap=sheet.querySelector('.inv-tx-barcode');
    if(!wrap)return;
    if(wrap.querySelector('[data-qmes-public-preview-content="1"]'))return;
    wrap.replaceChildren();
    const content=document.createElement('div');
    content.dataset.qmesPublicPreviewContent='1';
    const info=document.createElement('div');
    const title=document.createElement('b');
    const sub=document.createElement('span');
    title.textContent='입출고 상세 QR';
    sub.textContent='휴대폰 카메라로 스캔하면 로그인 없이 읽기 전용 상세화면이 열립니다.';
    info.append(title,sub);
    const loading=document.createElement('div');
    loading.textContent='QR을 생성하는 중입니다.';
    loading.style.cssText='padding:18px;text-align:center;color:#64748b;font-weight:700;';
    content.append(info,loading);
    wrap.appendChild(content);
    try{
      const image=document.createElement('img');
      image.src=await qrData(publicDetailUrl(sheet,1),420);
      image.alt=`${detailValue(sheet,'원료명')} ${detailValue(sheet,'LOT')} 입출고 상세 QR`;
      image.style.cssText='display:block;width:180px;height:180px;object-fit:contain;margin:12px auto 0';
      loading.replaceWith(image);
    }catch(error){loading.textContent=error?.message||MODULE_ERROR;}
  }

  function escapeHtml(value){return String(value??'-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  async function printPublicLabels(sheet){
    const count=parseCount(detailValue(sheet,'입고 포장수량'));
    const material=detailValue(sheet,'원료명');
    const lot=detailValue(sheet,'LOT');
    const movement=detailValue(sheet,'이동 방향');
    const locationCode=destination(movement);
    let labels;
    try{
      labels=await Promise.all(Array.from({length:count},async(_,offset)=>{
        const no=offset+1;
        return {no,qr:await qrData(publicDetailUrl(sheet,no,count),420)};
      }));
    }catch(error){alert(error?.message||MODULE_ERROR);return;}

    const win=window.open('','_blank','width=780,height=780');
    if(!win)return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(material)} QR 라벨</title><style>@page{size:60mm 40mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;font-family:Arial,'Noto Sans KR',sans-serif;color:#111827}.label{position:relative;width:60mm;height:40mm;padding:2.2mm;border:.25mm solid #d0d5dd;overflow:hidden;page-break-after:always}.label:last-child{page-break-after:auto}.top{height:6mm;display:flex;align-items:center;justify-content:space-between;border-bottom:.25mm solid #111827;padding-bottom:1mm}.top img{display:block;width:auto;height:4.8mm;max-width:33mm;object-fit:contain}.pkg{font-size:8px;font-weight:900}.body{display:grid;grid-template-columns:1fr 25mm;gap:1.5mm;height:29mm;padding-top:1.5mm}.meta{display:flex;min-width:0;flex-direction:column;justify-content:center}.meta small{font-size:6px;color:#64748b;font-weight:700;margin-top:.7mm}.meta strong{font-size:9px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qr{display:flex;align-items:center;justify-content:center}.qr img{width:25mm;height:25mm;object-fit:contain}.scan{position:absolute;left:2.2mm;bottom:1.3mm;font-size:5.5px;color:#475467;font-weight:700}@media print{.label{break-inside:avoid}}</style></head><body>${labels.map(label=>`<section class="label"><div class="top"><img src="${MAIN_LOGO}" alt="NAMO Chemical" onerror="this.onerror=null;this.src='${FALLBACK_LOGO}'"><div class="pkg">${label.no} / ${count}</div></div><div class="body"><div class="meta"><small>원료명</small><strong>${escapeHtml(material)}</strong><small>LOT</small><strong>${escapeHtml(lot)}</strong><small>위치</small><strong>${escapeHtml(locationCode)}</strong></div><div class="qr"><img src="${label.qr}" alt="입출고 상세 QR"></div></div><div class="scan">휴대폰 카메라로 QR을 스캔해 상세정보 확인</div></section>`).join('')}</body></html>`);
    win.document.close();
    let printed=false;
    const print=()=>{if(printed)return;printed=true;setTimeout(()=>{win.focus();win.print();},180);};
    const pending=Array.from(win.document.images).filter(image=>!image.complete);
    if(!pending.length)print();
    else{
      let left=pending.length;
      const settled=()=>{left-=1;if(left<=0)print();};
      pending.forEach(image=>{image.addEventListener('load',settled,{once:true});image.addEventListener('error',settled,{once:true});});
      setTimeout(print,1800);
    }
  }

  function replacePrintButton(sheet){
    const current=sheet.querySelector('.inv-tx-detail-actions .primary');
    if(!current)return;
    const count=parseCount(detailValue(sheet,'입고 포장수량'));
    if(current.dataset.qmesPublicQrPrint==='1'){
      current.textContent=`QR 라벨 ${count}매 인쇄`;
      return;
    }
    const button=current.cloneNode(true);
    button.type='button';
    button.textContent=`QR 라벨 ${count}매 인쇄`;
    button.dataset.qmesQrPrint='1';
    button.dataset.qmesPublicQrPrint='1';
    current.replaceWith(button);
  }

  function repairSheet(sheet){
    cleanDetailLayout(sheet);
    replacePrintButton(sheet);
    void renderPublicPreview(sheet);
  }

  let scheduled=false;
  function repairOpenDetails(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      document.querySelectorAll('.inv-tx-detail-sheet').forEach(repairSheet);
    });
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-qmes-public-qr-print="1"]');
    if(!button)return;
    const sheet=button.closest('.inv-tx-detail-sheet');
    if(!sheet)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void printPublicLabels(sheet);
  },true);

  new MutationObserver(repairOpenDetails).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('qmes:inventory-qr-ready',repairOpenDetails);
  window.addEventListener('load',repairOpenDetails,{once:true});

  window.qmesEnsureInventoryQr()
    .then(()=>{document.dispatchEvent(new CustomEvent('qmes:inventory-qr-ready'));repairOpenDetails();})
    .catch(error=>console.error('[QMES QR]',error.message));

  repairOpenDetails();
})();
