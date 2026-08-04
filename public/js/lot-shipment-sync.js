(function(){
  "use strict";
  if(window.__QMES_LOT_SHIPMENT_SYNC__) return;
  window.__QMES_LOT_SHIPMENT_SYNC__=true;

  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const lotKey=value=>clean(value).toUpperCase();
  const holdLike=value=>/홀드|격리|차단/.test(clean(value));
  const first=(...values)=>values.map(clean).find(Boolean)||"";
  const sameLot=(value,lotNo)=>lotKey(value)===lotKey(lotNo);
  const dateKey=row=>[
    row?.shipDate,row?.shipmentDate,row?.outDate,row?.deliveryDate,row?.date,row?.time
  ].map(clean).join(" ");

  const getDb=()=>{
    try{
      if(typeof DB!=="undefined") return DB;
    }catch(_error){}
    return window.DB||null;
  };

  const numberValue=value=>{
    if(typeof value==="number") return Number.isFinite(value)?value:null;
    const match=clean(value).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);
    return match?Number(match[0]):null;
  };

  const equalRecord=(left,right)=>{
    const keys=["no","shipNo","date","shipDate","customer","qty","shipQty","dest","destination","invoice"];
    return keys.every(key=>clean(left?.[key])===clean(right?.[key]));
  };

  function shipmentFrom(db,lotNo,lot){
    const batch=(db.batches||[]).find(row=>
      [row?.no,row?.lot,row?.lotNo,row?.workOrder].some(value=>sameLot(value,lotNo))
    )||{};
    const batchShip=batch.ship||{};
    const current=lot.ship||{};
    const coa=db.coa?.[lotNo]||{};
    const rows=(Array.isArray(db.insp?.OQC)?db.insp.OQC:[])
      .filter(row=>sameLot(row?.lot,lotNo))
      .sort((a,b)=>dateKey(b).localeCompare(dateKey(a)));
    const representative=rows.find(row=>first(
      row?.shipDate,row?.shipmentDate,row?.outDate,row?.deliveryDate,
      row?.customer,row?.shipQty,row?.shipNo,row?.shipmentStatus,row?.shipStatus
    ))||rows[0]||{};

    const shipNo=first(
      current.shipNo,current.no,batchShip.shipNo,batchShip.no,
      coa.shipNo,representative.shipNo,representative.groupId
    );
    const shipDate=first(
      current.shipDate,current.date,batchShip.shipDate,batchShip.date,
      coa.ship,representative.shipDate,representative.shipmentDate,
      representative.outDate,representative.deliveryDate
    );
    const customer=first(
      current.customer,batchShip.customer,coa.customer,
      representative.customer,representative.client,representative.cust
    );
    const destination=first(
      current.destination,current.dest,batchShip.destination,batchShip.dest,
      coa.destination,representative.destination,representative.dest
    );
    const invoice=first(
      current.invoice,batchShip.invoice,coa.invoice,representative.invoice
    );
    const qty=numberValue(
      current.shipQty??current.qty??batchShip.shipQty??batchShip.qty??
      coa.qty??representative.shipQty??representative.qty
    );
    const statusText=[
      current.status,batchShip.status,lot.status,batch.status,
      representative.shipmentStatus,representative.shipStatus,representative.status
    ].map(clean).join(" ");
    const explicitComplete=/출하완료|출고완료|납품완료|배송완료/.test(statusText);
    const storedShipment=Boolean(first(
      current.shipNo,current.customer,current.shipDate,current.date,
      batchShip.shipNo,batchShip.customer,batchShip.shipDate,batchShip.date,
      coa.shipNo,coa.customer,coa.ship
    ));
    const oqcShipment=Boolean(first(
      representative.shipDate,representative.shipmentDate,
      representative.outDate,representative.deliveryDate
    ))||/출하완료|출고완료|납품완료|배송완료/.test([
      representative.shipmentStatus,representative.shipStatus,representative.status
    ].map(clean).join(" "));
    const hasShipment=explicitComplete||storedShipment||oqcShipment;

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
        qty:qty??current.qty??"",
        shipQty:qty??current.shipQty??"",
        dest:destination||current.dest||"",
        destination:destination||current.destination||"",
        invoice:invoice||current.invoice||""
      }
    };
  }

  let syncing=false;
  function syncShipmentData(){
    if(syncing) return false;
    const db=getDb();
    if(!db?.lots) return false;
    syncing=true;
    let changed=false;

    try{
      Object.entries(db.lots).forEach(([lotNo,lot])=>{
        if(!lot) return;
        const result=shipmentFrom(db,lotNo,lot);
        if(!result) return;

        if(!equalRecord(lot.ship,result.shipment)){
          lot.ship=result.shipment;
          changed=true;
        }
        if(lot.stage!=="출하"){
          lot.stage="출하";
          changed=true;
        }
        if(holdLike(lot.status)){
          if(lot.statusBeforeHold!=="출하완료"){
            lot.statusBeforeHold="출하완료";
            changed=true;
          }
        }else if(lot.status!=="출하완료"){
          lot.status="출하완료";
          changed=true;
        }

        const batch=result.batch;
        if(batch&&Object.keys(batch).length){
          if(!equalRecord(batch.ship,result.shipment)){
            batch.ship={...(batch.ship||{}),...result.shipment};
            changed=true;
          }
          if(!holdLike(batch.status)&&batch.status!=="출하완료"){
            batch.status="출하완료";
            changed=true;
          }
        }
      });

      if(changed&&typeof dbSave==="function") dbSave();
      return changed;
    }finally{
      syncing=false;
    }
  }

  const panelOf=element=>{
    let node=element;
    while(node&&node!==document.body){
      const classes=String(node.className||"");
      if(/rounded/.test(classes)&&/border/.test(classes)) return node;
      node=node.parentElement;
    }
    return null;
  };

  function removeDuplicatePanels(){
    document.getElementById("qmes-lot-completeness-panel")?.remove();

    const legacyTitle=Array.from(document.querySelectorAll("h1,h2,h3,h4,div,span"))
      .find(element=>clean(element.textContent)==="출하 정보 (Forward Trace)");
    const legacyPanel=panelOf(legacyTitle);
    if(legacyPanel){
      legacyPanel.style.display="none";
      legacyPanel.setAttribute("aria-hidden","true");
      legacyPanel.dataset.qmesDuplicateHidden="true";
    }
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      const changed=syncShipmentData();
      removeDuplicatePanels();
      if(changed){
        setTimeout(()=>{
          try{document.dispatchEvent(new CustomEvent("qmes:data-updated"));}
          catch(_error){}
        },0);
      }
    });
  }

  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("storage",schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});

  let attempts=0;
  const readyTimer=setInterval(()=>{
    attempts+=1;
    if(getDb()?.lots||attempts>=400){
      clearInterval(readyTimer);
      schedule();
    }
  },50);
})();
