(function(){
  "use strict";
  if(window.__QMES_LOT_SHIPMENT_SYNC__) return;
  window.__QMES_LOT_SHIPMENT_SYNC__=true;

  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const compact=value=>clean(value).replace(/[\s·\-_/()[\]{}:：]/g,"").toLowerCase();
  const lotKey=value=>clean(value).toUpperCase();
  const holdLike=value=>/홀드|격리|차단/.test(clean(value));
  const first=(...values)=>values.map(clean).find(Boolean)||"";
  const sameLot=(value,lotNo)=>lotKey(value)===lotKey(lotNo);
  const dateKey=row=>[
    row?.shipDate,row?.shipmentDate,row?.outDate,row?.deliveryDate,
    row?.receivedDate,row?.receiptDate,row?.claimDate,row?.returnDate,
    row?.date,row?.createdAt,row?.updatedAt,row?.time
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

  const findExactText=text=>Array.from(document.querySelectorAll("h1,h2,h3,h4,div,span"))
    .find(element=>clean(element.textContent)===text);

  function removeDuplicatePanels(){
    document.getElementById("qmes-lot-completeness-panel")?.remove();

    const legacyTitle=findExactText("출하 정보 (Forward Trace)");
    const legacyPanel=panelOf(legacyTitle);
    if(legacyPanel){
      legacyPanel.style.display="none";
      legacyPanel.setAttribute("aria-hidden","true");
      legacyPanel.dataset.qmesDuplicateHidden="true";
    }
  }

  const SECTION_BUTTONS=["투입원료","생산실적","공정검사","출하정보"];
  const isSectionButton=button=>{
    const text=compact(button?.textContent);
    return SECTION_BUTTONS.some(label=>text===label||text.startsWith(label));
  };

  function removeTraceSectionButtons(){
    const traceTitle=findExactText("LOT 통합 추적");
    const tracePanel=panelOf(traceTitle);
    const traceRoot=tracePanel?.parentElement||tracePanel;
    if(!traceRoot) return;

    const hiddenButtons=[];
    traceRoot.querySelectorAll("button").forEach(button=>{
      if(!isSectionButton(button)) return;
      button.hidden=true;
      button.style.setProperty("display","none","important");
      button.setAttribute("aria-hidden","true");
      button.dataset.qmesLotSectionHidden="true";
      hiddenButtons.push(button);
    });

    hiddenButtons.forEach(button=>{
      const parent=button.parentElement;
      if(!parent||parent===traceRoot) return;
      const directButtons=Array.from(parent.children).filter(child=>child.tagName==="BUTTON");
      const otherContent=Array.from(parent.children).some(child=>
        child.tagName!=="BUTTON"&&(child.matches?.("input,select,textarea,table")||clean(child.textContent))
      );
      if(directButtons.length&&!otherContent&&directButtons.every(isSectionButton)){
        parent.style.setProperty("display","none","important");
        parent.setAttribute("aria-hidden","true");
        parent.dataset.qmesLotSectionGroupHidden="true";
      }
    });
  }

  const CUSTOMER_STORE_KEYS=[
    "complaints","customerComplaints","customerClaims","claims","cc",
    "returns","returnRecords","recalls","customerIssues"
  ];

  const toRows=value=>{
    if(Array.isArray(value)) return value;
    if(value&&typeof value==="object") return Object.values(value);
    return [];
  };

  const recordLots=record=>{
    const arrayFields=["affectedLots","relatedLots","lots","lotList","targetLots","returnLots"];
    return Array.from(new Set([
      record?.lot,record?.lotNo,record?.productLot,record?.sourceLot,
      record?.targetLot,record?.affectedLot,record?.batch,record?.batchNo,
      record?.returnLot,record?.shipmentLot,
      ...arrayFields.flatMap(key=>Array.isArray(record?.[key])?record[key]:[])
    ].map(lotKey).filter(Boolean)));
  };

  function customerIssueRows(db){
    return CUSTOMER_STORE_KEYS.flatMap(key=>
      toRows(db?.[key]).map(row=>({...row,__qmesSource:key}))
    );
  }

  function renderCustomerIssueNotes(){
    const db=getDb();
    if(!db) return;
    const rows=customerIssueRows(db);

    document.querySelectorAll("[data-qmes-lot-quality-hold]").forEach(wrapper=>{
      const lotNo=lotKey(wrapper.dataset.qmesLotQualityHold);
      const matched=rows
        .filter(row=>recordLots(row).includes(lotNo))
        .sort((a,b)=>dateKey(b).localeCompare(dateKey(a)));
      let note=wrapper.querySelector(".qmes-lot-customer-issue-note");

      if(!matched.length){
        note?.remove();
        return;
      }

      const latest=matched[0]||{};
      const status=first(
        latest.status,latest.state,latest.result,latest.progress,latest.disposition
      )||"확인 필요";
      const issueNo=first(
        latest.no,latest.id,latest.claimNo,latest.complaintNo,latest.returnNo
      );
      const customer=first(
        latest.customer,latest.client,latest.company,latest.partner
      );

      if(!note){
        note=document.createElement("div");
        note.className="qmes-lot-customer-issue-note";
        wrapper.appendChild(note);
      }
      note.style.cssText="box-sizing:border-box;margin-top:10px;padding:10px 12px;border:1px solid rgba(244,63,94,.38);border-radius:8px;background:rgba(244,63,94,.08);font-size:12px;line-height:1.55;color:#cbd5e1";
      note.replaceChildren();

      const title=document.createElement("div");
      title.style.cssText="font-weight:800;color:#fda4af";
      title.textContent=`고객불만·반품 이력 ${matched.length}건`;

      const detail=document.createElement("div");
      detail.style.cssText="margin-top:3px;color:#94a3b8";
      detail.textContent=[
        issueNo?`최근 번호 ${issueNo}`:"",
        customer?`고객사 ${customer}`:"",
        `상태 ${status}`
      ].filter(Boolean).join(" · ");

      note.append(title,detail);
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      const changed=syncShipmentData();
      removeDuplicatePanels();
      removeTraceSectionButtons();
      renderCustomerIssueNotes();
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
