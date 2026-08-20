/* QMES inventory full auto-link v4 - physical rack locations, 2026-08-20 */
(function(){
  'use strict';
  if(window.__QMES_INV_AUTO_LINK_ALL_V4__) return;
  window.__QMES_INV_AUTO_LINK_ALL_V4__=true;

  const locationMap=window.qmesInventoryPhysicalLocations;
  if(!locationMap){console.error('[QMES inventory] physical location map is missing');return;}
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
  function rememberStock(stock,row){stock.push({item_code:row.itemCode,item_name:row.itemName,lot_no:row.lotNo,location_code:row.toLocation,quality_status:row.toStatus,quantity:row.quantity,available_qty:row.quantity});}
  function debitStock(stock,location,lotNo,amount){
    const row=stock.find(entry=>upper(entry?.location_code||entry?.locationCode)===upper(location)&&upper(entry?.lot_no||entry?.lotNo)===upper(lotNo)&&upper(entry?.quality_status||entry?.qualityStatus)==='AVAILABLE');
    if(!row) return;
    const remaining=Math.max(0,num(row.available_qty??row.quantity)-amount);
    row.available_qty=remaining;
    row.quantity=Math.max(0,num(row.quantity)-amount);
  }

  async function syncInventory(){
    if(window.__QMES_INV_AUTO_LINK_ALL_RUNNING__) return;
    if(typeof window.invApi!=='function'&&typeof invApi!=='function') return;
    window.__QMES_INV_AUTO_LINK_ALL_RUNNING__=true;
    try{
      const [txs,stock]=await Promise.all([
        invApi('/transactions?limit=2000').catch(()=>[]),
        invApi('/stock').catch(()=>[])
      ]);
      const refs=new Set((txs||[]).map(refOf).filter(Boolean));
      const stockRows=Array.isArray(stock)?stock:[];

      for(const row of iqcRows()){
        if(text(row?.judge)!=='합격') continue;
        const lot=upper(row?.lot||row?.lotNo);
        const qty=num(row?.qty||row?.incomingQty||row?.incoming_qty);
        const itemName=text(row?.name||row?.material||row?.item);
        if(!lot||qty<=0) continue;
        const ref=`IQC:${upper(row?.inNo||row?.in_no||lot)}`;
        if(refs.has(ref)) continue;
        const toLocation=locationMap.chooseRawReceiptLocation(`${text(row?.code)} ${itemName}`,stockRows);
        if(!toLocation){console.warn('IQC 자동입고 보류 - 지정 가능한 실제 A구역 위치 없음',lot,itemName);continue;}
        const form={transactionType:'RECEIPT',itemCode:text(row?.code&&row.code!=='-'?row.code:row?.name)||'RM',itemName,category:'RM',lotNo:lot,quantity:qty,unit:'kg',fromLocation:'',toLocation,fromStatus:'AVAILABLE',toStatus:'AVAILABLE',workOrderNo:'',productionLot:'',referenceNo:ref,supplier:text(row?.supplier&&row.supplier!=='-'?row.supplier:''),receivedAt:text(row?.recv||row?.inspectedAt||row?.date).slice(0,10),expiryDate:'',reason:`수입검사 합격 자동입고 (${toLocation})`,remark:'IQC 자동연동 · 실제 랙 위치'};
        try{await post(form);refs.add(ref);rememberStock(stockRows,form);}catch(e){console.warn('IQC 자동입고 실패',lot,e.message);}
      }

      for(const wo of workOrders()){
        const productionLot=upper(wo?.lot||wo?.no||wo?.lotNo);
        if(!productionLot) continue;
        const inputs=Array.isArray(wo?.inputs)?wo.inputs:[];

        for(let i=0;i<inputs.length;i+=1){
          const input=inputs[i]||{};
          const materialLot=upper(input?.lot||input?.materialLot);
          const used=num(input?.act||input?.actualQty||input?.usedQty);
          const itemName=text(input?.name||input?.itemName);
          if(!materialLot||used<=0) continue;
          const ref=`WOISSUE:${productionLot}:${i+1}:${materialLot}`;
          if(refs.has(ref)) continue;
          const fromLocation=locationMap.chooseRawIssueLocation(`${text(input?.code||input?.itemCode)} ${itemName}`,materialLot,used,stockRows);
          if(!fromLocation){console.warn('원료 자동차감 보류 - LOT의 실제 A구역 위치/재고 확인 필요',productionLot,materialLot);continue;}
          try{
            await post({transactionType:'PRODUCTION_ISSUE',itemCode:text(input?.code||input?.itemCode||input?.name)||'RM',itemName,category:'RM',lotNo:materialLot,quantity:used,unit:text(input?.unit)||'kg',fromLocation,toLocation:'',fromStatus:'AVAILABLE',toStatus:'AVAILABLE',workOrderNo:productionLot,productionLot,referenceNo:ref,supplier:'',receivedAt:'',expiryDate:'',reason:`작업지시 실투입 자동차감 (${fromLocation} → 생산사용)`,remark:'작업지시서 실투입량 자동연동 · 실제 랙 위치'});
            refs.add(ref);
            debitStock(stockRows,fromLocation,materialLot,used);
          }catch(e){console.warn('원료 자동차감 실패',productionLot,materialLot,e.message);}
        }

        const status=text(wo?.status);
        const plan=num(wo?.plan||wo?.planQty);
        const done=num(wo?.done||wo?.prodQty||wo?.productionQty||wo?.actualQty||plan);
        const completed=status==='완료'||wo?.completed===true||(done>0&&plan>0&&done>=plan);
        if(!completed||done<=0) continue;
        const ref=`WO:${productionLot}`;
        if(refs.has(ref)) continue;
        const itemCode=text(wo?.itemCode||wo?.code||wo?.item)||'FG';
        const itemName=text(wo?.itemName||wo?.item||wo?.product);
        const toLocation=locationMap.chooseFinishedLocation(`${itemCode} ${itemName}`,stockRows);
        if(!toLocation){console.warn('완제품 자동입고 보류 - 비어 있는 B구역 위치 확인 필요',productionLot,itemName);continue;}
        const form={transactionType:'PRODUCTION_RECEIPT',itemCode,itemName,category:'FG',lotNo:productionLot,quantity:done,unit:text(wo?.unit)||'kg',fromLocation:'',toLocation,fromStatus:'AVAILABLE',toStatus:'OQC_PENDING',workOrderNo:productionLot,productionLot,referenceNo:ref,supplier:'',receivedAt:text(wo?.date||wo?.due).slice(0,10),expiryDate:'',reason:`작업지시 완료 자동입고 (생산완료 → ${toLocation})`,remark:'작업지시서 완료 자동연동 · 실제 랙 위치'};
        try{await post(form);refs.add(ref);rememberStock(stockRows,form);}catch(e){console.warn('완제품 자동입고 실패',productionLot,e.message);}
      }

      document.dispatchEvent(new CustomEvent('qmes:inventory-auto-linked'));
    }finally{
      window.__QMES_INV_AUTO_LINK_ALL_RUNNING__=false;
    }
  }

  function installHint(){
    document.querySelectorAll('.inv-shell .inv-title-row').forEach(row=>{
      let hint=row.querySelector('[data-qmes-inv-auto-v4="1"]');
      if(!hint){hint=document.createElement('div');hint.dataset.qmesInvAutoV4='1';hint.style.cssText='font-size:12px;color:#64748b;margin-top:6px;font-weight:700;';row.querySelector('div')?.appendChild(hint);}
      hint.textContent='실제 랙 자동연동 · 원재료 A-1-1~A-6-2 · 완제품 B-1-1~B-3-2 · 미확인 원료는 위치확인';
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
