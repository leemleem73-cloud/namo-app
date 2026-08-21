/* Inventory detail stable controller: one modal, one QR, one print path. */
(function(){
  'use strict';
  if(window.__QMES_INV_DETAIL_STABLE_20260821__)return;
  window.__QMES_INV_DETAIL_STABLE_20260821__=true;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const upper=v=>clean(v).toUpperCase();
  let txCache=[],txLoadedAt=0;

  function field(sheet,label){return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;}
  function value(sheet,label){return clean(field(sheet,label)?.querySelector('dd')?.textContent)||'-';}
  function removeLegacyFields(sheet){
    ['문서번호','용기당 중량','바코드 발행수량','작업자','비고'].forEach(label=>field(sheet,label)?.remove());
    const grid=sheet.querySelector('.inv-tx-detail-grid');
    if(grid)grid.style.gridTemplateColumns='1fr 1fr';
  }

  async function loadTx(){
    if(txCache.length&&Date.now()-txLoadedAt<15000)return txCache;
    try{
      const r=await fetch('/api/inventory/transactions?limit=1000',{credentials:'same-origin'});
      const p=await r.json().catch(()=>({}));
      if(r.ok&&p?.success&&Array.isArray(p.data)){txCache=p.data;txLoadedAt=Date.now();}
    }catch(error){console.warn('[QMES inventory detail] 거래 조회 실패',error);}
    return txCache;
  }

  async function findTx(sheet){
    if(sheet.__qmesStableTx)return sheet.__qmesStableTx;
    const lot=upper(value(sheet,'LOT'));
    const material=upper(value(sheet,'원료명'));
    const rows=await loadTx();
    const tx=rows.find(r=>upper(r?.lot_no)===lot&&upper(r?.item_name||r?.item_code)===material)||rows.find(r=>upper(r?.lot_no)===lot)||null;
    if(tx)sheet.__qmesStableTx=tx;
    return tx;
  }

  function qrUrl(tx){
    const url=new URL(location.href);
    url.hash='';
    if(tx?.id)url.searchParams.set('inventoryTx',String(tx.id));
    return url.toString();
  }

  async function makeQrData(text){
    const QR=window.QRCode;
    if(!QR)throw new Error('QR 모듈이 없습니다.');
    if(typeof QR.toDataURL==='function')return QR.toDataURL(text,{width:420,margin:1,errorCorrectionLevel:'M'});
    const holder=document.createElement('div');
    holder.style.cssText='position:fixed;left:-10000px;top:-10000px;width:420px;height:420px;';
    document.body.appendChild(holder);
    try{
      new QR(holder,{text,width:420,height:420,colorDark:'#111827',colorLight:'#ffffff',correctLevel:QR.CorrectLevel?.M});
      const canvas=holder.querySelector('canvas');
      if(canvas?.toDataURL)return canvas.toDataURL('image/png');
      const img=holder.querySelector('img');
      if(img?.src)return img.src;
      throw new Error('QR 생성 실패');
    }finally{holder.remove();}
  }

  async function ensureQr(sheet){
    const wrap=sheet.querySelector('.inv-tx-barcode');
    if(!wrap)return'';
    if(wrap.dataset.qmesStableQr==='ready')return wrap.querySelector('img')?.src||'';
    wrap.dataset.qmesStableQr='loading';
    wrap.innerHTML='<div><b>입출고 상세 QR</b><span>휴대폰 카메라로 스캔하면 상세정보를 확인할 수 있습니다.</span></div><div data-qmes-qr-loading style="padding:18px;text-align:center;color:#64748b;font-weight:700">QR 생성 중...</div>';
    try{
      const tx=await findTx(sheet);
      const src=await makeQrData(qrUrl(tx));
      const img=document.createElement('img');
      img.src=src;img.alt='입출고 상세 QR';img.style.cssText='display:block;width:180px;height:180px;object-fit:contain;margin:12px auto 0';
      wrap.querySelector('[data-qmes-qr-loading]')?.replaceWith(img);
      wrap.dataset.qmesStableQr='ready';
      return src;
    }catch(error){
      const loading=wrap.querySelector('[data-qmes-qr-loading]');
      if(loading)loading.textContent='QR 생성 실패';
      wrap.dataset.qmesStableQr='error';
      console.warn('[QMES inventory detail] QR 생성 실패',error);
      return'';
    }
  }

  function esc(v){return String(v??'-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  async function printQr(sheet,button){
    button.disabled=true;const old=button.textContent;button.textContent='인쇄 준비 중...';
    try{
      const qr=await ensureQr(sheet);
      if(!qr){alert('QR 생성 후 다시 인쇄해 주세요.');return;}
      const material=value(sheet,'원료명'),lot=value(sheet,'LOT'),pack=value(sheet,'포장형태'),qty=value(sheet,'입고 포장수량'),direction=value(sheet,'이동 방향');
      document.getElementById('qmes-stable-print-root')?.remove();
      const root=document.createElement('div');root.id='qmes-stable-print-root';
      root.innerHTML=`<section class="qmes-stable-label"><div class="top"><b>NAMO Chemical</b><span>${esc(qty)}</span></div><div class="body"><div class="meta"><small>원료명</small><strong>${esc(material)}</strong><small>LOT</small><strong>${esc(lot)}</strong><small>포장형태</small><strong>${esc(pack)}</strong><small>이동 방향</small><strong>${esc(direction)}</strong></div><img src="${qr}" alt="QR"></div></section>`;
      document.body.appendChild(root);
      let style=document.getElementById('qmes-stable-print-style');if(!style){style=document.createElement('style');style.id='qmes-stable-print-style';document.head.appendChild(style);}
      style.textContent=`#qmes-stable-print-root{display:none}@media print{@page{size:60mm 40mm;margin:0}body>*:not(#qmes-stable-print-root){display:none!important}#qmes-stable-print-root{display:block!important}.qmes-stable-label{width:60mm;height:40mm;padding:2mm;box-sizing:border-box;font-family:Arial,'Noto Sans KR',sans-serif;color:#111827}.qmes-stable-label .top{display:flex;justify-content:space-between;border-bottom:.25mm solid #111827;padding-bottom:1mm;font-size:8px}.qmes-stable-label .body{display:grid;grid-template-columns:1fr 24mm;gap:1.5mm;height:30mm;padding-top:1mm}.qmes-stable-label .meta{display:flex;flex-direction:column;justify-content:center;min-width:0}.qmes-stable-label small{font-size:5.5px;color:#64748b;font-weight:700;margin-top:.4mm}.qmes-stable-label strong{font-size:8px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qmes-stable-label img{width:24mm;height:24mm;object-fit:contain;align-self:center}}`;
      const cleanup=()=>{setTimeout(()=>root.remove(),100);window.removeEventListener('afterprint',cleanup);};window.addEventListener('afterprint',cleanup);
      window.print();
    }finally{button.disabled=false;button.textContent=old||'QR 라벨 인쇄';}
  }

  function installSheet(sheet){
    if(!sheet||sheet.dataset.qmesStableDetail==='1')return;
    sheet.dataset.qmesStableDetail='1';
    removeLegacyFields(sheet);
    const button=sheet.querySelector('.inv-tx-detail-actions .primary');
    if(button){
      button.textContent='QR 라벨 인쇄';button.type='button';
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void printQr(sheet,button);},true);
    }
    void ensureQr(sheet);
  }

  function scan(root=document){
    if(root.matches?.('.inv-tx-detail-sheet'))installSheet(root);
    root.querySelectorAll?.('.inv-tx-detail-sheet').forEach(installSheet);
  }
  const observer=new MutationObserver(mutations=>mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);})));observer.observe(document.body,{childList:true,subtree:true});
  scan();
})();