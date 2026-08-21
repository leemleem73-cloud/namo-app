/* QMES inventory production packaging + QR print hotfix, 2026-08-21 */
(function(){
  'use strict';
  if(window.__QMES_INV_PACK_PRINT_HOTFIX_20260821__)return;
  window.__QMES_INV_PACK_PRINT_HOTFIX_20260821__=true;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const upper=v=>clean(v).toUpperCase();
  const esc=v=>String(v??'-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const typeLabels={RECEIPT:'입고',ISSUE:'출고',MOVE:'이동',ADJUSTMENT:'조정',PRODUCTION_ISSUE:'생산투입',PRODUCTION_RECEIPT:'생산완료',SHIPMENT:'출하',RETURN:'반품',HOLD:'보류',RELEASE:'보류해제'};
  let txCache=[],txAt=0,repairBusy=false;

  async function loadTx(force=false){
    if(!force&&txCache.length&&Date.now()-txAt<10000)return txCache;
    try{
      const r=await fetch('/api/inventory/transactions?limit=2000',{credentials:'same-origin'});
      const p=await r.json().catch(()=>({}));
      if(r.ok&&p?.success&&Array.isArray(p.data)){txCache=p.data;txAt=Date.now();}
    }catch(e){console.warn('[QMES hotfix] 거래 조회 실패',e?.message||e);}
    return txCache;
  }

  function workOrderFor(tx){
    let db=window.DB||{};try{if(typeof DB!=='undefined'&&DB)db=DB;}catch(e){}
    const lot=upper(tx?.production_lot||tx?.work_order_no||tx?.lot_no);
    const doc=db?.woDocs?.[lot]||{};
    const batch=(Array.isArray(db?.batches)?db.batches:[]).find(row=>upper(row?.no||row?.lot||row?.lotNo)===lot)||{};
    return {...batch,...doc};
  }

  function packagingFor(tx){
    const wo=workOrderFor(tx);
    const type=clean(wo?.packagingType||wo?.packaging_type||wo?.packageType||wo?.package_type||wo?.packType||wo?.packingType||wo?.containerType||tx?.packaging_type||tx?.packagingType);
    const other=clean(wo?.packagingTypeOther||wo?.packaging_type_other||wo?.packageTypeOther||wo?.packagingOther||tx?.packaging_type_other||tx?.packagingTypeOther);
    const qty=Math.max(1,Math.trunc(Number(wo?.packageQty||wo?.package_qty||wo?.packQty||tx?.package_qty||tx?.packageQty||1)||1));
    return {type:type||'드럼',other,qty};
  }

  async function patchProductionPackaging(){
    if(repairBusy)return;
    repairBusy=true;
    try{
      const rows=await loadTx(true);
      const targets=rows.filter(tx=>upper(tx?.transaction_type)==='PRODUCTION_RECEIPT'&&clean(tx?.id)&&!clean(tx?.packaging_type||tx?.packagingType));
      for(const tx of targets){
        const pack=packagingFor(tx);
        try{
          const r=await fetch(`/api/inventory/transactions/${encodeURIComponent(tx.id)}/packaging`,{
            method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({packagingType:pack.type,packagingTypeOther:pack.other,packageQty:pack.qty,barcodeQty:pack.qty})
          });
          const p=await r.json().catch(()=>({}));
          if(r.ok&&p?.success!==false){
            tx.packaging_type=pack.type;tx.packaging_type_other=pack.other;tx.package_qty=pack.qty;tx.barcode_qty=pack.qty;
          }
        }catch(e){console.warn('[QMES hotfix] 생산완료 포장형태 저장 실패',tx?.lot_no,e?.message||e);}
      }
      if(targets.length){txAt=Date.now();document.dispatchEvent(new CustomEvent('qmes:inventory-qr-ready'));}
    }finally{repairBusy=false;}
  }

  function field(sheet,label){return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(n=>clean(n.querySelector('dt')?.textContent)===label)||null;}
  function value(sheet,label){return clean(field(sheet,label)?.querySelector('dd')?.textContent)||'-';}
  function countOf(sheet,tx){
    const values=[value(sheet,'입고 포장수량'),tx?.package_qty,tx?.packageQty,tx?.barcode_qty,tx?.barcodeQty];
    for(const v of values){const m=clean(v).replace(/,/g,'').match(/\d+/);if(m&&Number(m[0])>0)return Math.min(500,Number(m[0]));}
    return 1;
  }
  function txForSheet(sheet){
    if(sheet.__qmesTx?.id)return sheet.__qmesTx;
    const lot=upper(value(sheet,'LOT')),material=upper(value(sheet,'원료명'));
    return txCache.find(tx=>upper(tx?.lot_no)===lot&&upper(tx?.item_name||tx?.item_code)===material)||txCache.find(tx=>upper(tx?.lot_no)===lot)||null;
  }
  function qrUrl(txId,index,total){const u=new URL(location.href);u.hash='';u.searchParams.set('inventoryTx',txId);u.searchParams.set('pkg',String(index));u.searchParams.set('total',String(total));return u.toString();}

  async function qrData(url){
    const QR=window.QRCode;
    if(typeof QR==='function'){
      const holder=document.createElement('div');
      holder.style.cssText='position:fixed;left:-10000px;top:-10000px;width:360px;height:360px;overflow:hidden;';
      document.body.appendChild(holder);
      try{
        new QR(holder,{text:url,width:360,height:360,colorDark:'#111827',colorLight:'#ffffff',correctLevel:QR.CorrectLevel?.M});
        const canvas=holder.querySelector('canvas');if(canvas?.toDataURL)return canvas.toDataURL('image/png');
        const image=holder.querySelector('img');if(image?.src)return image.src;
      }finally{holder.remove();}
    }
    throw new Error('QR 생성 모듈을 확인해 주세요.');
  }

  async function prepare(sheet){
    if(!sheet||sheet.__qmesPrintPreparing)return;
    sheet.__qmesPrintPreparing=true;
    try{
      await loadTx(false);
      const tx=txForSheet(sheet);if(!tx?.id)return;
      const count=countOf(sheet,tx);
      const signature=`${tx.id}|${count}|${value(sheet,'원료명')}|${value(sheet,'LOT')}|${value(sheet,'포장형태')}`;
      if(sheet.__qmesPreparedPrint?.signature===signature)return;
      const labels=[];
      for(let i=1;i<=count;i++)labels.push({no:i,qr:await qrData(qrUrl(tx.id,i,count))});
      sheet.__qmesPreparedPrint={signature,tx,count,labels};
      const button=sheet.querySelector('.inv-tx-detail-actions .primary');
      if(button){button.dataset.qmesHotPrint='1';button.disabled=false;button.title='QR 라벨 인쇄';}
    }catch(e){console.warn('[QMES hotfix] QR 사전 준비 실패',e?.message||e);}
    finally{sheet.__qmesPrintPreparing=false;}
  }

  function printNow(sheet){
    const prepared=sheet.__qmesPreparedPrint;
    const tx=prepared?.tx||txForSheet(sheet);
    if(!tx?.id){alert('입출고 거래정보를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.');return;}
    let labels=prepared?.labels;
    let count=prepared?.count||countOf(sheet,tx);
    if(!labels?.length){
      const preview=sheet.querySelector('.inv-tx-barcode img');
      if(count===1&&preview?.src)labels=[{no:1,qr:preview.src}];
    }
    if(!labels?.length){alert('QR 라벨을 준비 중입니다. 잠시 후 다시 눌러 주세요.');void prepare(sheet);return;}
    const material=value(sheet,'원료명')!=='-'?value(sheet,'원료명'):clean(tx?.item_name||tx?.item_code);
    const lot=value(sheet,'LOT')!=='-'?value(sheet,'LOT'):clean(tx?.lot_no);
    const pack=value(sheet,'포장형태')!=='-'?value(sheet,'포장형태'):clean(tx?.packaging_type)||'드럼';
    const direction=value(sheet,'이동 방향');
    const location=clean(tx?.to_location||tx?.from_location)||(direction.split('→').map(clean).filter(Boolean).at(-1)||'-');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(material)} QR 라벨</title><style>@page{size:60mm 40mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;font-family:Arial,'Noto Sans KR',sans-serif;color:#111827}.label{width:60mm;height:40mm;padding:2mm;border:.25mm solid #cbd5e1;page-break-after:always;overflow:hidden}.label:last-child{page-break-after:auto}.head{display:flex;justify-content:space-between;align-items:center;border-bottom:.25mm solid #111827;padding-bottom:1mm;font-size:8px;font-weight:900}.body{display:grid;grid-template-columns:1fr 24mm;gap:1.5mm;height:29mm;padding-top:1.2mm}.meta{display:flex;flex-direction:column;justify-content:center;min-width:0}.meta small{font-size:5.5px;color:#64748b;font-weight:700;margin-top:.45mm}.meta strong{font-size:8.5px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qr{display:flex;align-items:center;justify-content:center}.qr img{width:24mm;height:24mm;object-fit:contain}.foot{font-size:5px;color:#64748b;font-weight:700}</style></head><body>${labels.map(l=>`<section class="label"><div class="head"><span>NAMO Chemical</span><span>${l.no} / ${count}</span></div><div class="body"><div class="meta"><small>원료명</small><strong>${esc(material)}</strong><small>LOT</small><strong>${esc(lot)}</strong><small>포장형태</small><strong>${esc(pack)}</strong><small>위치</small><strong>${esc(location)}</strong></div><div class="qr"><img src="${l.qr}"></div></div><div class="foot">QR 스캔 → 입출고 상세정보</div></section>`).join('')}</body></html>`;
    document.getElementById('qmes-hot-print-frame')?.remove();
    const frame=document.createElement('iframe');
    frame.id='qmes-hot-print-frame';frame.setAttribute('aria-hidden','true');
    frame.style.cssText='position:fixed;left:0;bottom:0;width:1px;height:1px;border:0;opacity:.01;pointer-events:none;';
    document.body.appendChild(frame);
    const doc=frame.contentDocument||frame.contentWindow?.document;
    if(!doc){frame.remove();alert('인쇄 화면을 만들 수 없습니다.');return;}
    doc.open();doc.write(html);doc.close();
    try{frame.contentWindow.focus();frame.contentWindow.print();}
    catch(e){alert('인쇄 기능을 실행하지 못했습니다. 브라우저 인쇄 설정을 확인해 주세요.');}
    setTimeout(()=>frame.remove(),3000);
  }

  function scan(){
    document.querySelectorAll('.inv-tx-detail-sheet').forEach(sheet=>{
      const button=sheet.querySelector('.inv-tx-detail-actions .primary');
      if(button){button.dataset.qmesHotPrint='1';button.setAttribute('aria-label','QR 라벨 인쇄');button.setAttribute('title','QR 라벨 인쇄');}
      void prepare(sheet);
    });
  }

  window.addEventListener('click',event=>{
    const button=event.target?.closest?.('.inv-tx-detail-sheet .inv-tx-detail-actions .primary');
    if(!button)return;
    const sheet=button.closest('.inv-tx-detail-sheet');if(!sheet)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    printNow(sheet);
  },true);

  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('qmes:inventory-auto-linked',()=>{txAt=0;void patchProductionPackaging().then(scan);});
  document.addEventListener('qmes:data-updated',()=>{txAt=0;void patchProductionPackaging().then(scan);});
  window.setTimeout(()=>{void patchProductionPackaging().then(scan);},500);
  window.setInterval(()=>{void patchProductionPackaging();},15000);
  scan();
})();