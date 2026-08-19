/* QMES inventory auto-link patch - IQC + Work Order, 2026-08-19 */
(function(){
  'use strict';
  if(window.__QMES_INV_AUTO_LINK_IQC_WO_20260819__) return;
  window.__QMES_INV_AUTO_LINK_IQC_WO_20260819__=true;

  const text=v=>String(v==null?'':v).trim();
  const upper=v=>text(v).toUpperCase();
  const numberOf=v=>{const m=text(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0;};

  function hideManualInventoryButton(){
    document.querySelectorAll('.inv-shell .inv-actions button').forEach(btn=>{
      if(text(btn.textContent)==='재고처리') btn.remove();
    });
  }

  function iqcRows(){
    const db=window.DB||{};
    return [db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].find(Array.isArray)||[];
  }

  function workOrderRows(){
    const db=window.DB||{};
    const map=new Map();
    (Array.isArray(db.batches)?db.batches:[]).forEach(row=>{
      const lot=upper(row?.no||row?.lot||row?.lotNo);
      if(lot) map.set(lot,{...row,lot});
    });
    Object.entries(db.woDocs||{}).forEach(([key,row])=>{
      const lot=upper(key||row?.lot||row?.lotNo||row?.no);
      if(!lot) return;
      map.set(lot,{...(map.get(lot)||{}),...row,lot});
    });
    return Array.from(map.values());
  }

  function inventoryReference(tx){
    return upper(tx?.reference_no||tx?.referenceNo||tx?.work_order_no||tx?.workOrderNo||'');
  }

  async function postTransaction(form){
    return invApi('/transactions',{method:'POST',body:JSON.stringify(form)});
  }

  async function autoLinkInventory(){
    if(window.__QMES_INV_AUTO_LINK_RUNNING__) return;
    window.__QMES_INV_AUTO_LINK_RUNNING__=true;
    try{
      const transactions=await invApi('/transactions?limit=1000').catch(()=>[]);
      const refs=new Set((transactions||[]).map(inventoryReference).filter(Boolean));

      for(const row of iqcRows()){
        if(text(row?.judge)!=='합격') continue;
        const lot=upper(row?.lot||row?.lotNo);
        const qty=numberOf(row?.qty||row?.incomingQty||row?.incoming_qty);
        if(!lot||!(qty>0)) continue;
        const ref=`IQC:${upper(row?.inNo||row?.in_no||lot)}`;
        if(refs.has(ref)) continue;
        try{
          await postTransaction({
            transactionType:'RECEIPT',
            itemCode:text(row?.code&&row.code!=='-'?row.code:row?.name)||'RM',
            itemName:text(row?.name||row?.material||row?.item),
            category:'RM',
            lotNo:lot,
            quantity:qty,
            unit:'kg',
            fromLocation:'',
            toLocation:'RM',
            fromStatus:'AVAILABLE',
            toStatus:'AVAILABLE',
            workOrderNo:'',
            productionLot:'',
            referenceNo:ref,
            supplier:text(row?.supplier&&row.supplier!=='-'?row.supplier:''),
            receivedAt:text(row?.recv||row?.inspectedAt||row?.date).slice(0,10),
            expiryDate:'',
            reason:'수입검사 합격 자동입고',
            remark:'IQC 연동 자동 생성'
          });
          refs.add(ref);
        }catch(err){console.warn('IQC→재고 자동연동 실패:',lot,err.message);}
      }

      for(const row of workOrderRows()){
        const lot=upper(row?.lot||row?.no||row?.lotNo);
        const status=text(row?.status);
        const qty=numberOf(row?.done||row?.prodQty||row?.productionQty||row?.actualQty||row?.plan||row?.planQty);
        const completed=status==='완료'||row?.completed===true||(qty>0&&numberOf(row?.plan||row?.planQty)>0&&qty>=numberOf(row?.plan||row?.planQty));
        if(!lot||!completed||!(qty>0)) continue;
        const ref=`WO:${lot}`;
        if(refs.has(ref)) continue;
        try{
          await postTransaction({
            transactionType:'PRODUCTION_RECEIPT',
            itemCode:text(row?.itemCode||row?.code||row?.item)||'FG',
            itemName:text(row?.itemName||row?.item||row?.product),
            category:'FG',
            lotNo:lot,
            quantity:qty,
            unit:text(row?.unit)||'kg',
            fromLocation:'PRODUCTION',
            toLocation:'FG',
            fromStatus:'AVAILABLE',
            toStatus:'OQC_PENDING',
            workOrderNo:lot,
            productionLot:lot,
            referenceNo:ref,
            supplier:'',
            receivedAt:text(row?.date||row?.due).slice(0,10),
            expiryDate:'',
            reason:'작업지시 완료 자동입고',
            remark:'작업지시서 연동 자동 생성'
          });
          refs.add(ref);
        }catch(err){console.warn('작업지시→재고 자동연동 실패:',lot,err.message);}
      }

      document.dispatchEvent(new CustomEvent('qmes:inventory-auto-linked'));
    }finally{
      window.__QMES_INV_AUTO_LINK_RUNNING__=false;
    }
  }

  function installStatusHint(){
    document.querySelectorAll('.inv-shell .inv-title-row').forEach(row=>{
      if(row.querySelector('[data-qmes-inv-auto-link="1"]')) return;
      const p=document.createElement('div');
      p.dataset.qmesInvAutoLink='1';
      p.style.cssText='font-size:12px;color:#64748b;margin-top:6px;font-weight:700;';
      p.textContent='자동연동: 수입검사 합격 → 원료재고 / 작업지시 완료 → 완제품재고';
      row.querySelector('div')?.appendChild(p);
    });
  }

  let timer=0;
  function syncUi(){
    clearTimeout(timer);
    timer=setTimeout(()=>{hideManualInventoryButton();installStatusHint();},30);
  }

  document.addEventListener('DOMContentLoaded',()=>{syncUi();setTimeout(autoLinkInventory,700);},{once:true});
  document.addEventListener('qmes:data-updated',()=>{syncUi();setTimeout(autoLinkInventory,200);});
  document.addEventListener('qmes:data-changed',()=>{syncUi();setTimeout(autoLinkInventory,200);});
  document.addEventListener('qmes:inventory-auto-linked',syncUi);
  new MutationObserver(syncUi).observe(document.documentElement,{childList:true,subtree:true});
  window.setInterval(()=>{syncUi();autoLinkInventory();},10000);
})();
