/* QMES inventory full auto-link v2 - 2026-08-19
 * Removes manual '재고처리' entry points from inventory screens.
 * Auto stock events:
 * 1) IQC 합격 -> 원료 입고
 * 2) 작업지시 실투입 -> 원료 생산투입 차감
 * 3) 작업지시 완료 -> 완제품 생산완료 입고
 * PQC/OQC remain quality gates displayed automatically by existing LOT flow.
 */
(function(){
  'use strict';
  if(window.__QMES_INV_AUTO_LINK_ALL_V2__) return;
  window.__QMES_INV_AUTO_LINK_ALL_V2__=true;

  const text=v=>String(v==null?'':v).trim();
  const upper=v=>text(v).toUpperCase();
  const num=v=>{const m=text(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0;};

  function removeManualInventoryUi(){
    document.querySelectorAll('.inv-shell button, .inv-modal button').forEach(btn=>{
      if(text(btn.textContent)==='재고처리') btn.remove();
    });
    document.querySelectorAll('.inv-modal').forEach(modal=>{
      if(/재고\s*Transaction\s*등록|재고처리/.test(text(modal.textContent))) modal.remove();
    });
  }

  function iqcRows(){
    const db=window.DB||{};
    return [db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].find(Array.isArray)||[];
  }

  function workOrders(){
    const db=window.DB||{};
    const map=new Map();
    (Array.isArray(db.batches)?db.batches:[]).forEach(row=>{
      const lot=upper(row?.no||row?.lot||row?.lotNo);
      if(lot) map.set(lot,{...row,lot});
    });
    Object.entries(db.woDocs||{}).forEach(([key,row])=>{
      const lot=upper(key||row?.lot||row?.lotNo||row?.no);
      if(lot) map.set(lot,{...(map.get(lot)||{}),...row,lot});
    });
    return Array.from(map.values());
  }

  function refOf(tx){return upper(tx?.reference_no||tx?.referenceNo||'');}
  async function post(form){return invApi('/transactions',{method:'POST',body:JSON.stringify(form)});}

  async function syncInventory(){
    if(window.__QMES_INV_AUTO_LINK_ALL_RUNNING__) return;
    if(typeof window.invApi!=='function'&&typeof invApi!=='function') return;
    window.__QMES_INV_AUTO_LINK_ALL_RUNNING__=true;
    try{
      const txs=await invApi('/transactions?limit=2000').catch(()=>[]);
      const refs=new Set((txs||[]).map(refOf).filter(Boolean));

      // IQC 합격 -> 원료 입고
      for(const row of iqcRows()){
        if(text(row?.judge)!=='합격') continue;
        const lot=upper(row?.lot||row?.lotNo);
        const qty=num(row?.qty||row?.incomingQty||row?.incoming_qty);
        if(!lot||qty<=0) continue;
        const ref=`IQC:${upper(row?.inNo||row?.in_no||lot)}`;
        if(refs.has(ref)) continue;
        try{
          await post({transactionType:'RECEIPT',itemCode:text(row?.code&&row.code!=='-'?row.code:row?.name)||'RM',itemName:text(row?.name||row?.material||row?.item),category:'RM',lotNo:lot,quantity:qty,unit:'kg',fromLocation:'',toLocation:'RM',fromStatus:'AVAILABLE',toStatus:'AVAILABLE',workOrderNo:'',productionLot:'',referenceNo:ref,supplier:text(row?.supplier&&row.supplier!=='-'?row.supplier:''),receivedAt:text(row?.recv||row?.inspectedAt||row?.date).slice(0,10),expiryDate:'',reason:'수입검사 합격 자동입고',remark:'IQC 자동연동'});
          refs.add(ref);
        }catch(e){console.warn('IQC 자동입고 실패',lot,e.message);}
      }

      for(const wo of workOrders()){
        const productionLot=upper(wo?.lot||wo?.no||wo?.lotNo);
        if(!productionLot) continue;
        const inputs=Array.isArray(wo?.inputs)?wo.inputs:[];

        // 작업지시 실투입 -> 원료 차감
        for(let i=0;i<inputs.length;i+=1){
          const input=inputs[i]||{};
          const materialLot=upper(input?.lot||input?.materialLot);
          const used=num(input?.act||input?.actualQty||input?.usedQty);
          if(!materialLot||used<=0) continue;
          const ref=`WOISSUE:${productionLot}:${i+1}:${materialLot}`;
          if(refs.has(ref)) continue;
          try{
            await post({transactionType:'PRODUCTION_ISSUE',itemCode:text(input?.code||input?.itemCode||input?.name)||'RM',itemName:text(input?.name||input?.itemName),category:'RM',lotNo:materialLot,quantity:used,unit:text(input?.unit)||'kg',fromLocation:'RM',toLocation:'PRODUCTION',fromStatus:'AVAILABLE',toStatus:'AVAILABLE',workOrderNo:productionLot,productionLot,referenceNo:ref,supplier:'',receivedAt:'',expiryDate:'',reason:'작업지시 실투입 자동차감',remark:'작업지시서 실투입량 자동연동'});
            refs.add(ref);
          }catch(e){console.warn('원료 자동차감 실패',productionLot,materialLot,e.message);}
        }

        // 작업지시 완료 -> 완제품 입고
        const status=text(wo?.status);
        const plan=num(wo?.plan||wo?.planQty);
        const done=num(wo?.done||wo?.prodQty||wo?.productionQty||wo?.actualQty||plan);
        const completed=status==='완료'||wo?.completed===true||(done>0&&plan>0&&done>=plan);
        if(!completed||done<=0) continue;
        const ref=`WO:${productionLot}`;
        if(refs.has(ref)) continue;
        try{
          await post({transactionType:'PRODUCTION_RECEIPT',itemCode:text(wo?.itemCode||wo?.code||wo?.item)||'FG',itemName:text(wo?.itemName||wo?.item||wo?.product),category:'FG',lotNo:productionLot,quantity:done,unit:text(wo?.unit)||'kg',fromLocation:'PRODUCTION',toLocation:'FG',fromStatus:'AVAILABLE',toStatus:'OQC_PENDING',workOrderNo:productionLot,productionLot,referenceNo:ref,supplier:'',receivedAt:text(wo?.date||wo?.due).slice(0,10),expiryDate:'',reason:'작업지시 완료 자동입고',remark:'작업지시서 완료 자동연동'});
          refs.add(ref);
        }catch(e){console.warn('완제품 자동입고 실패',productionLot,e.message);}
      }

      document.dispatchEvent(new CustomEvent('qmes:inventory-auto-linked'));
    }finally{
      window.__QMES_INV_AUTO_LINK_ALL_RUNNING__=false;
    }
  }

  function installHint(){
    document.querySelectorAll('.inv-shell .inv-title-row').forEach(row=>{
      let hint=row.querySelector('[data-qmes-inv-auto-v2="1"]');
      if(!hint){hint=document.createElement('div');hint.dataset.qmesInvAutoV2='1';hint.style.cssText='font-size:12px;color:#64748b;margin-top:6px;font-weight:700;';row.querySelector('div')?.appendChild(hint);}
      hint.textContent='자동 재고연동 · IQC 합격 입고 → 작업지시 실투입 차감 → 작업지시 완료 입고';
    });
  }

  let uiTimer=0;
  function syncUi(){clearTimeout(uiTimer);uiTimer=setTimeout(()=>{removeManualInventoryUi();installHint();},30);}
  function trigger(){syncUi();setTimeout(syncInventory,150);}

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{syncUi();setTimeout(syncInventory,700);},{once:true});
  else {syncUi();setTimeout(syncInventory,700);}
  document.addEventListener('qmes:data-updated',trigger);
  document.addEventListener('qmes:data-changed',trigger);
  document.addEventListener('qmes:inventory-auto-linked',syncUi);
  window.addEventListener('storage',trigger);
  new MutationObserver(syncUi).observe(document.documentElement,{childList:true,subtree:true});
  window.setInterval(()=>{syncUi();syncInventory();},10000);
})();
