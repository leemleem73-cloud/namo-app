/* QMES inventory QR print force + packaging UI fallback, 2026-08-21 */
(function(){
  'use strict';
  if(window.__QMES_INV_QR_PRINT_FORCE_20260821__)return;
  window.__QMES_INV_QR_PRINT_FORCE_20260821__=true;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const field=(sheet,label)=>Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(n=>clean(n.querySelector('dt')?.textContent)===label)||null;
  const value=(sheet,label)=>clean(field(sheet,label)?.querySelector('dd')?.textContent)||'-';
  const setValue=(sheet,label,next)=>{const dd=field(sheet,label)?.querySelector('dd');if(dd)dd.textContent=clean(next)||'-';};

  function ensurePackaging(sheet){
    if(!sheet)return;
    const type=value(sheet,'구분');
    const current=value(sheet,'포장형태');
    if(type==='생산완료'&&(!current||current==='-'||current==='미등록')){
      setValue(sheet,'포장형태','드럼');
      if(value(sheet,'입고 포장수량')==='-'||!value(sheet,'입고 포장수량'))setValue(sheet,'입고 포장수량','1 EA');
      if(sheet.__qmesBase){sheet.__qmesBase.packaging='드럼';sheet.__qmesBase.packageQty='1 EA';}
      if(sheet.__qmesTx){sheet.__qmesTx.packaging_type='드럼';sheet.__qmesTx.package_qty=1;sheet.__qmesTx.barcode_qty=1;}
    }
  }

  function qrSource(sheet){
    const img=sheet.querySelector('.inv-tx-barcode img');
    if(img?.src)return img.src;
    const canvas=sheet.querySelector('.inv-tx-barcode canvas');
    if(canvas?.toDataURL)return canvas.toDataURL('image/png');
    return'';
  }

  function printSameWindow(sheet){
    ensurePackaging(sheet);
    const qr=qrSource(sheet);
    if(!qr){alert('QR 이미지가 아직 준비되지 않았습니다. 상세창을 다시 열고 잠시 후 눌러 주세요.');return;}
    const material=value(sheet,'원료명');
    const lot=value(sheet,'LOT');
    const pack=value(sheet,'포장형태');
    const qty=value(sheet,'입고 포장수량');
    const direction=value(sheet,'이동 방향');
    const location=(direction.split('→').map(clean).filter(Boolean).at(-1)||'-');
    document.getElementById('qmes-force-print-root')?.remove();
    const root=document.createElement('div');
    root.id='qmes-force-print-root';
    root.innerHTML=`<section class="qmes-force-label"><div class="qmes-force-head"><b>NAMO Chemical</b><span>1 / 1</span></div><div class="qmes-force-body"><div><small>원료명</small><strong>${esc(material)}</strong><small>LOT</small><strong>${esc(lot)}</strong><small>포장형태</small><strong>${esc(pack)} · ${esc(qty)}</strong><small>위치</small><strong>${esc(location)}</strong></div><img src="${qr}" alt="QR"></div><div class="qmes-force-foot">QR 스캔 → 입출고 상세정보</div></section>`;
    document.body.appendChild(root);
    let style=document.getElementById('qmes-force-print-style');
    if(!style){style=document.createElement('style');style.id='qmes-force-print-style';document.head.appendChild(style);}
    style.textContent=`#qmes-force-print-root{display:none}@media print{@page{size:60mm 40mm;margin:0}body>*:not(#qmes-force-print-root){display:none!important}#qmes-force-print-root{display:block!important;margin:0!important;padding:0!important}.qmes-force-label{width:60mm;height:40mm;padding:2mm;box-sizing:border-box;font-family:Arial,'Noto Sans KR',sans-serif;color:#111827;overflow:hidden}.qmes-force-head{display:flex;justify-content:space-between;align-items:center;border-bottom:.25mm solid #111827;padding-bottom:1mm;font-size:8px}.qmes-force-body{display:grid;grid-template-columns:1fr 24mm;gap:1.5mm;height:29mm;padding-top:1.2mm}.qmes-force-body>div{display:flex;flex-direction:column;justify-content:center;min-width:0}.qmes-force-body small{font-size:5.5px;color:#64748b;font-weight:700;margin-top:.45mm}.qmes-force-body strong{font-size:8.5px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qmes-force-body img{width:24mm;height:24mm;object-fit:contain;align-self:center}.qmes-force-foot{font-size:5px;color:#64748b;font-weight:700}}`;
    const cleanup=()=>{setTimeout(()=>root.remove(),50);window.removeEventListener('afterprint',cleanup);};
    window.addEventListener('afterprint',cleanup);
    window.print();
  }

  function install(sheet){
    ensurePackaging(sheet);
    const button=sheet.querySelector('.inv-tx-detail-actions .primary');
    if(!button)return;
    button.type='button';
    button.textContent='QR 라벨 인쇄';
    button.dataset.qmesForcePrint='1';
    button.disabled=false;
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.inv-tx-detail-sheet .inv-tx-detail-actions .primary');
    if(!button)return;
    const sheet=button.closest('.inv-tx-detail-sheet');
    if(!sheet)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    printSameWindow(sheet);
  },true);

  const scan=()=>document.querySelectorAll('.inv-tx-detail-sheet').forEach(install);
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('qmes:inventory-qr-ready',scan);
  document.addEventListener('qmes:inventory-auto-linked',scan);
  setInterval(scan,1000);
  scan();
})();