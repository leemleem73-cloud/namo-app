(function(){
  "use strict";
  if(!document.querySelector('script[data-qmes-ui-refinement-20260805]')){
    const script=document.createElement("script");
    script.src="./js/qmes-ui-refinement-20260805.js?v=20260805-5";
    script.async=false;
    script.dataset.qmesUiRefinement20260805="true";
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-qmes-lot-detail-alignment-20260805]')){
    const script=document.createElement("script");
    script.src="./js/lot-detail-alignment-20260805.js?v=20260806-1";
    script.async=false;
    script.dataset.qmesLotDetailAlignment20260805="true";
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-qmes-ncr-separate-action-buttons]')){
    const script=document.createElement("script");
    script.src="./js/ncr-separate-action-buttons.js?v=20260805-1";
    script.async=false;
    script.dataset.qmesNcrSeparateActionButtons="true";
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-qmes-table-equipment-spacing-20260805]')){
    const script=document.createElement("script");
    script.src="./js/table-and-equipment-spacing-20260805.js?v=20260805-10";
    script.async=false;
    script.dataset.qmesTableEquipmentSpacing20260805="true";
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-qmes-equipment-layout-refinement-20260805]')){
    const script=document.createElement("script");
    script.src="./js/equipment-layout-refinement-20260805.js?v=20260805-4";
    script.async=false;
    script.dataset.qmesEquipmentLayoutRefinement20260805="true";
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-qmes-partner-equipment-fix-20260805]')){
    const script=document.createElement("script");
    script.src="./js/partner-equipment-fix-20260805.js?v=20260805-4";
    script.async=false;
    script.dataset.qmesPartnerEquipmentFix20260805="true";
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-qmes-equipment-complaint-summary-refinement-20260805]')){
    const script=document.createElement("script");
    script.src="./js/equipment-complaint-summary-refinement-20260805.js?v=20260806-11";
    script.async=false;
    script.dataset.qmesEquipmentComplaintSummaryRefinement20260805="true";
    document.head.appendChild(script);
  }
})();

(function(){
  "use strict";
  if(window.__QMES_LOT_SHIPMENT_STATUS_SYNC__) return;
  window.__QMES_LOT_SHIPMENT_STATUS_SYNC__=true;

  const clean=value=>String(value??"").trim();
  const lotKey=value=>clean(value).toUpperCase();
  const sameLot=(value,lot)=>lotKey(value)===lotKey(lot);
  const first=(...values)=>values.map(clean).find(Boolean)||"";
  const holdLike=value=>/홀드|격리|차단/.test(clean(value));
  const db=()=>{try{return typeof DB!=="undefined"?DB:window.DB}catch(_){return window.DB}};

  function shipmentFor(store,lotNo,lot){
    const batch=(store.batches||[]).find(row=>[row?.no,row?.lot,row?.lotNo,row?.workOrder].some(value=>sameLot(value,lotNo)))||{};
    const batchShip=batch.ship||{};
    const current=lot.ship||{};
    const coa=store.coa?.[lotNo]||{};
    const oqcRows=(Array.isArray(store.insp?.OQC)?store.insp.OQC:[]).filter(row=>sameLot(row?.lot||row?.lotNo,lotNo));
    const oqc=oqcRows.find(row=>first(row?.shipDate,row?.shipmentDate,row?.outDate,row?.deliveryDate,row?.shipNo,row?.customer,row?.shipmentStatus,row?.shipStatus))||oqcRows[0]||{};

    const statusText=[lot.status,batch.status,current.status,batchShip.status,oqc.status,oqc.shipmentStatus,oqc.shipStatus].map(clean).join(" ");
    const shipDate=first(current.shipDate,current.date,batchShip.shipDate,batchShip.date,coa.ship,coa.shipDate,oqc.shipDate,oqc.shipmentDate,oqc.outDate,oqc.deliveryDate);
    const shipNo=first(current.shipNo,current.no,batchShip.shipNo,batchShip.no,coa.shipNo,oqc.shipNo,oqc.groupId);
    const customer=first(current.customer,batchShip.customer,coa.customer,oqc.customer,oqc.client,oqc.cust);
    const explicit=/출하완료|출고완료|납품완료|배송완료/.test(statusText);
    const hasShipment=explicit||Boolean(first(shipDate,shipNo,customer));
    if(!hasShipment) return null;

    return {
      batch,
      shipment:{
        ...current,
        no:shipNo||current.no||"",
        shipNo:shipNo||current.shipNo||"",
        date:shipDate||current.date||"",
        shipDate:shipDate||current.shipDate||"",
        customer:customer||current.customer||"",
        dest:first(current.dest,current.destination,batchShip.dest,batchShip.destination,coa.destination,oqc.dest,oqc.destination),
        destination:first(current.destination,current.dest,batchShip.destination,batchShip.dest,coa.destination,oqc.destination,oqc.dest),
        invoice:first(current.invoice,batchShip.invoice,coa.invoice,oqc.invoice),
        qty:current.qty??current.shipQty??batchShip.qty??batchShip.shipQty??coa.qty??oqc.shipQty??oqc.qty??"",
        shipQty:current.shipQty??current.qty??batchShip.shipQty??batchShip.qty??coa.qty??oqc.shipQty??oqc.qty??""
      }
    };
  }

  let running=false;
  function sync(){
    if(running) return;
    const store=db();
    if(!store?.lots) return;
    running=true;
    let changed=false;
    try{
      Object.entries(store.lots).forEach(([lotNo,lot])=>{
        if(!lot) return;
        const result=shipmentFor(store,lotNo,lot);
        if(!result) return;
        const next=JSON.stringify(result.shipment);
        if(JSON.stringify(lot.ship||{})!==next){lot.ship=result.shipment;changed=true;}
        if(lot.stage!=="출하"){lot.stage="출하";changed=true;}
        if(holdLike(lot.status)){
          if(lot.statusBeforeHold!=="출하완료"){lot.statusBeforeHold="출하완료";changed=true;}
        }else if(lot.status!=="출하완료"){
          lot.status="출하완료";changed=true;
        }
        const batch=result.batch;
        if(batch&&Object.keys(batch).length){
          if(JSON.stringify(batch.ship||{})!==next){batch.ship={...(batch.ship||{}),...result.shipment};changed=true;}
          if(!holdLike(batch.status)&&batch.status!=="출하완료"){batch.status="출하완료";changed=true;}
        }
      });
      if(changed){
        try{typeof dbSave==="function"&&dbSave();}catch(_){}
        try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{type:"shipment-status-sync"}}));}catch(_){}
      }
    }finally{running=false;}
  }

  document.addEventListener("click",()=>setTimeout(sync,0),true);
  document.addEventListener("qmes:data-updated",()=>setTimeout(sync,0));
  window.addEventListener("storage",sync);
  new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.documentElement,{childList:true,subtree:true});
  const timer=setInterval(()=>{if(db()?.lots){clearInterval(timer);sync();}},50);
})();
