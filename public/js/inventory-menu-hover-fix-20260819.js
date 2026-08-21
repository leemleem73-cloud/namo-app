/* Inventory hover cleanup + transaction detail click fallback, 2026-08-21. */
(function(){
  'use strict';
  document.getElementById('qmes-inventory-hover-menu')?.remove();
  if(window.__QMES_INV_TX_CLICK_FALLBACK__)return;
  window.__QMES_INV_TX_CLICK_FALLBACK__=true;

  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function findIqc(lot,name){
    const db=window.DB||{};
    const rows=[db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].find(Array.isArray)||[];
    const L=clean(lot).toUpperCase(),N=clean(name).toUpperCase();
    return rows.find(r=>clean(r?.lot||r?.lotNo).toUpperCase()===L&&(!N||clean(r?.name||r?.material||r?.item).toUpperCase()===N))||null;
  }
  function packaging(row){
    if(!row)return'-';
    const type=clean(row.packagingType||row.packaging_type||row.packageType||row.package_type)||'-';
    const other=clean(row.packagingTypeOther||row.packaging_type_other||row.packageTypeOther||row.package_type_other);
    return type==='기타'&&other?`기타(${other})`:type;
  }
  function fmtDate(v){const s=clean(v);return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):(s||'-');}
  function openFallbackFromRow(row){
    if(document.querySelector('.inv-tx-detail-overlay'))return;
    const tds=row.querySelectorAll('td');
    if(tds.length<7)return;
    const created=clean(tds[0].textContent),type=clean(tds[1].textContent),name=clean(tds[2].textContent),lot=clean(tds[3].textContent),qty=clean(tds[4].textContent),direction=clean(tds[5].textContent),remark=clean(tds[6].textContent);
    const iqc=findIqc(lot,name);
    const pack=packaging(iqc);
    const packageQty=iqc?.packageQty??iqc?.package_qty??1;
    const recv=fmtDate(iqc?.recv||iqc?.recvDate||iqc?.receivedAt);
    const inspect=fmtDate(iqc?.inspectedAt||iqc?.inspectDate||iqc?.inspectionDate);
    const overlay=document.createElement('div');overlay.className='inv-tx-detail-overlay';
    const sheet=document.createElement('div');sheet.className='inv-tx-detail-sheet';sheet.innerHTML=`
      <div class="inv-tx-detail-head"><div><span><img src="/logo.png" alt="NAMO Chemical" style="display:block;height:28px;max-width:240px;object-fit:contain;object-position:left center"></span><h3>입출고 처리 상세</h3></div><button type="button" aria-label="닫기">×</button></div>
      <div class="inv-tx-detail-status"><b>처리 완료</b><span>${esc(created)}</span></div>
      <dl class="inv-tx-detail-grid">
        <div><dt>원료명</dt><dd>${esc(name)}</dd></div><div><dt>구분</dt><dd>${esc(type)}</dd></div>
        <div><dt>LOT</dt><dd>${esc(lot)}</dd></div><div><dt>포장형태</dt><dd>${esc(pack)}</dd></div>
        <div><dt>입고일자</dt><dd>${esc(recv)}</dd></div><div><dt>검사일자</dt><dd>${esc(inspect)}</dd></div>
        <div><dt>총 수량</dt><dd>${esc(qty)}</dd></div><div><dt>입고 포장수량</dt><dd>${esc(packageQty)} EA</dd></div>
        <div><dt>이동 방향</dt><dd>${esc(direction)}</dd></div><div><dt>작업자</dt><dd>관리부 관리자 (U-0001)</dd></div>
        <div class="wide"><dt>비고</dt><dd>${esc(remark)}</dd></div>
      </dl>
      <div class="inv-tx-barcode"><div><b>원료·LOT·위치·용기 바코드</b><span>ERP 연동용 CODE128</span></div><svg class="qmes-fallback-barcode"></svg></div>
      <div class="inv-tx-detail-actions"><button type="button" class="qmes-fallback-close">닫기</button><button type="button" class="primary qmes-fallback-print">바코드 인쇄</button></div>`;
    overlay.appendChild(sheet);document.body.appendChild(overlay);
    const close=()=>overlay.remove();sheet.querySelector('.inv-tx-detail-head>button').onclick=close;sheet.querySelector('.qmes-fallback-close').onclick=close;overlay.addEventListener('mousedown',e=>{if(e.target===overlay)close();});
    const code=`ITEM:${name}|LOT:${lot}|LOC:${direction.split('→').pop()?.trim()||'LOCATION'}`;
    try{if(typeof JsBarcode==='function')JsBarcode(sheet.querySelector('.qmes-fallback-barcode'),code,{format:'CODE128',displayValue:true,height:74,margin:4,fontSize:11});}catch(e){}
    sheet.querySelector('.qmes-fallback-print').onclick=()=>window.print();
  }

  document.addEventListener('click',e=>{
    const link=e.target.closest?.('.inv-tx-detail-link');if(!link)return;
    const row=link.closest('tr');if(!row)return;
    setTimeout(()=>{if(!document.querySelector('.inv-tx-detail-overlay'))openFallbackFromRow(row);},80);
  },true);
})();
