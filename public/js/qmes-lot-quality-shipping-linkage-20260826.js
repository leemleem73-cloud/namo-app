/* NAMO QMES — end-to-end LOT quality/shipping linkage — 2026-08-26
 * Exact LOT linkage:
 * IQC raw-material LOT -> Work Order inputs -> PQC finished LOT -> OQC finished LOT -> CoA -> actual shipment.
 * OQC pass means "출하검사 완료"; actual shipment is confirmed separately in 출하·납품관리.
 */
(function(){
  "use strict";
  if(window.__QMES_LOT_QUALITY_SHIPPING_LINKAGE_20260826__) return;
  window.__QMES_LOT_QUALITY_SHIPPING_LINKAGE_20260826__=true;

  const SHIPPING_LOCAL_KEY="qmes-erp-shipping-v1";
  const SYNC_TYPE="inventory";
  const SHIPPING_RECORD_KEY="erp:shipping";
  const PQC_ITEMS=["점도","고형분","입도(Dmax)","외관"];
  const OQC_ITEMS=["외관","입도(Dmax)","점도","고형분","접착력","절연저항","수분","전해액 안정성"];
  let running=false;
  let sharedTimer=null;

  const text=value=>String(value==null?"":value).trim();
  const number=value=>{const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const exactLot=value=>text(value);
  const isoDate=value=>{
    const s=text(value);
    const m=s.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
    return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";
  };
  const compactDate=value=>isoDate(value).replace(/-/g,"");
  const canonicalCheck=value=>text(value)==="입도"?"입도(Dmax)":text(value);

  function getDb(){
    try{if(typeof DB!=="undefined"&&DB&&typeof DB==="object")return DB;}catch(_error){}
    return window.DB&&typeof window.DB==="object"?window.DB:null;
  }
  function currentUser(){
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return text(user?.name||user?.uid||user)||"SYSTEM";
  }
  function workOrderStatus(lot,doc,batch){
    try{if(typeof getAutoWoStatus==="function")return text(getAutoWoStatus(lot));}catch(_error){}
    return text(doc?.manualStatus||doc?.status||batch?.status||"발행");
  }
  function isIntermediate(row){
    const name=text(row?.name);
    const type=text(row?.materialType);
    try{if(typeof qmesMaterialType==="function")return qmesMaterialType(name)==="중간재";}catch(_error){}
    return /중간재|중간배치|바인더 솔루션/.test(`${type} ${name}`);
  }
  function latestIqc(db,lot){
    const key=exactLot(lot);
    if(!key)return null;
    return (Array.isArray(db.iqc)?db.iqc:[])
      .filter(row=>exactLot(row?.lot)===key)
      .sort((a,b)=>`${text(b?.inspectedAt||b?.recv)} ${text(b?.inNo)}`.localeCompare(`${text(a?.inspectedAt||a?.recv)} ${text(a?.inNo)}`))[0]||null;
  }
  function inspectionRows(db,kind,lot){
    const key=exactLot(lot);
    const rows=Array.isArray(db?.insp?.[kind])?db.insp[kind]:[];
    return rows.filter(row=>exactLot(row?.lot)===key);
  }
  function groupKey(row){
    return text(row?.groupId)||`${exactLot(row?.lot)}|${isoDate(row?.date||row?.shipDate)}|${text(row?.id).replace(/-\d+$/,"")}`;
  }
  function latestGroup(rows){
    const groups=new Map();
    rows.forEach(row=>{const key=groupKey(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);});
    return Array.from(groups.entries()).sort((a,b)=>{
      const ar=a[1][0]||{},br=b[1][0]||{};
      return `${isoDate(br.date||br.shipDate)} ${text(br.time)} ${text(br.id)}`.localeCompare(`${isoDate(ar.date||ar.shipDate)} ${text(ar.time)} ${text(ar.id)}`);
    })[0]||null;
  }
  function inspectionState(db,kind,lot,required){
    const all=inspectionRows(db,kind,lot);
    const latest=latestGroup(all);
    if(!latest)return {status:"검사대기",groupId:"",rows:[],date:"",inspector:""};
    const [key,rows]=latest;
    const byCheck=new Map();
    rows.forEach(row=>byCheck.set(canonicalCheck(row?.check),row));
    const anyFail=rows.some(row=>/불합격|NG|FAIL/i.test(text(row?.judge)));
    const allPass=required.every(check=>{
      const row=byCheck.get(check);
      return row&&/합격|PASS|OK/i.test(text(row?.judge));
    });
    const hasMeasured=rows.some(row=>text(row?.value)||Array.isArray(row?.measurements)&&row.measurements.some(v=>text(v))||/합격|불합격/.test(text(row?.judge)));
    return {
      status:anyFail?"불합격":allPass?"합격":hasMeasured?"검사중":"검사대기",
      groupId:key,
      rows,
      date:isoDate(rows[0]?.date||rows[0]?.shipDate),
      inspector:text(rows.find(row=>text(row?.inspector))?.inspector||rows[0]?.inspector)
    };
  }
  function actualShipment(ship){
    return Boolean(ship&&(ship.actualShipment===true||text(ship.source)==="ERP_SHIPPING"||text(ship.source)==="SHIPPING_MODULE"||text(ship.invoice)||text(ship.deliveryNo)));
  }
  function pseudoOqcShipment(db,lot,ship){
    if(!ship||actualShipment(ship))return false;
    const shipNo=text(ship.shipNo||ship.no);
    if(!shipNo)return false;
    return inspectionRows(db,"OQC",lot).some(row=>groupKey(row)===shipNo||text(row?.groupId)===shipNo);
  }
  function hasActiveHold(db,lot){
    return (Array.isArray(db.holds)?db.holds:[]).some(row=>exactLot(row?.target)===lot&&!/해제|완료|종결/.test(text(row?.status)));
  }
  function orderMap(db){
    const docs=db.woDocs&&typeof db.woDocs==="object"?db.woDocs:{};
    const batches=Array.isArray(db.batches)?db.batches:[];
    const ids=[];
    Object.keys(docs).forEach(id=>{const key=exactLot(id);if(key&&!ids.includes(key))ids.push(key);});
    batches.forEach(row=>{const key=exactLot(row?.no);if(key&&!ids.includes(key))ids.push(key);});
    const raw=ids.map(lot=>{
      const doc=docs[lot]||{};
      const batch=batches.find(row=>exactLot(row?.no)===lot)||{};
      const lotRow=db.lots?.[lot]||{};
      const productionDate=isoDate(doc.date||doc.productionDate||batch.date||batch.productionDate||lotRow.date);
      const due=isoDate(doc.due||doc.deliveryDate||batch.due||batch.deliveryDate);
      return {lot,doc,batch,lotRow,productionDate,due};
    }).sort((a,b)=>String(a.productionDate||a.due||"").localeCompare(String(b.productionDate||b.due||""))||a.lot.localeCompare(b.lot));
    const counters={};
    raw.forEach(row=>{
      const dateKey=compactDate(row.productionDate)||compactDate(row.due)||new Date().toISOString().slice(0,10).replace(/-/g,"");
      counters[dateKey]=(counters[dateKey]||0)+1;
      row.sales=`SO-${dateKey}-${String(counters[dateKey]).padStart(3,"0")}`;
    });
    return raw;
  }

  function syncOneLot(db,entry){
    const {lot,doc,batch}=entry;
    db.lots=db.lots&&typeof db.lots==="object"?db.lots:{};
    const current=db.lots[lot]||{};
    const next={...current};
    next.wo=text(current.wo||lot)||lot;
    next.workOrder=lot;
    next.itemName=text(doc.item||batch.item||current.itemName||current.item)||"NBA20-HM01";
    if(current.qty==null||current.qty==="")next.qty=number(doc.plan??doc.qty??batch.plan??batch.qty);
    next.productionDate=entry.productionDate||text(current.productionDate);

    const inputs=Array.isArray(doc.inputs)?doc.inputs:[];
    if(inputs.length){
      const materials=inputs.filter(row=>exactLot(row?.lot||row?.materialLot)).map(row=>{
        const materialLot=exactLot(row.lot||row.materialLot);
        const previous=(Array.isArray(current.materials)?current.materials:[]).find(m=>exactLot(m?.lot)===materialLot&&text(m?.name)===text(row?.name))||{};
        const intermediate=isIntermediate(row);
        const iqc=intermediate?null:latestIqc(db,materialLot);
        return {
          ...previous,
          lot:materialLot,
          code:text(row.code||previous.code)||"-",
          name:text(row.name||previous.name)||"-",
          materialType:text(row.materialType||previous.materialType)||(intermediate?"중간재":"원재료"),
          containerNo:text(row.containerNo||previous.containerNo),
          inputStatus:text(row.inputStatus||previous.inputStatus)||"신규",
          remainingQty:Number(row.remaining??previous.remainingQty??0),
          supplier:intermediate?"사내 중간배치":text(iqc?.supplier||previous.supplier)||"-",
          qty:`${number(row.act??row.std??previous.usedQty??0).toLocaleString()} ${text(row.unit)||"kg"}`,
          recv:intermediate?entry.productionDate||"-":text(iqc?.recv||iqc?.inspectedAt||previous.recv)||"-",
          iqc:intermediate?"중간배치 추적":text(iqc?.judge)||"미검사",
          iqcInNo:intermediate?"":text(iqc?.inNo),
          exactLotMatch:true
        };
      });
      next.materials=materials;
    }

    const pqc=inspectionState(db,"PQC",lot,PQC_ITEMS);
    const oqc=inspectionState(db,"OQC",lot,OQC_ITEMS);
    const rawIqc=(next.materials||[]).filter(row=>row.materialType!=="중간재");
    next.qualityLink={
      workOrder:lot,
      exactLotMatch:true,
      iqc:{status:rawIqc.length&&rawIqc.every(row=>row.iqc==="합격")?"합격":rawIqc.some(row=>row.iqc==="불합격")?"불합격":"검사대기",matched:rawIqc.filter(row=>row.iqc&&row.iqc!=="미검사").length,total:rawIqc.length},
      pqc:{status:pqc.status,groupId:pqc.groupId,date:pqc.date,inspector:pqc.inspector},
      oqc:{status:oqc.status,groupId:oqc.groupId,date:oqc.date,inspector:oqc.inspector},
      coa:{status:db.coa?.[lot]?"발행":"미발행",no:text(db.coa?.[lot]?.no)}
    };

    if(pseudoOqcShipment(db,lot,next.ship)){
      const pseudo=next.ship||{};
      next.oqcCompletion={
        groupId:text(pseudo.shipNo||pseudo.no)||oqc.groupId,
        customer:text(pseudo.customer)||text(oqc.rows.find(row=>text(row?.customer))?.customer),
        qty:number(pseudo.shipQty??pseudo.qty??oqc.rows.find(row=>number(row?.shipQty)>0)?.shipQty),
        plannedShipDate:isoDate(pseudo.shipDate||pseudo.date||oqc.rows.find(row=>row?.shipDate)?.shipDate),
        destination:text(pseudo.destination||oqc.rows.find(row=>text(row?.destination))?.destination),
        inspector:text(pseudo.inspector)||oqc.inspector,
        completedAt:text(pseudo.confirmedAt)||new Date().toISOString(),
        source:"OQC"
      };
      next.ship=null;
      if(batch.ship)batch.ship=null;
      if(text(batch.status)==="출하완료")batch.status="완료";
    }

    const actual=actualShipment(next.ship);
    const activeHold=hasActiveHold(db,lot);
    const productionStatus=workOrderStatus(lot,doc,batch);
    if(actual){
      next.stage="출하";
      next.status="출하완료";
    }else if(!activeHold){
      if(oqc.status==="불합격"){
        next.stage="생산";
        next.status="출하차단 — 출하검사 불합격";
      }else if(oqc.status==="합격"){
        next.stage="생산";
        next.status="출하검사 완료";
      }else if(pqc.status==="불합격"){
        next.stage="생산";
        next.status="공정검사 불합격 — 홀드";
      }else if(pqc.status==="합격"){
        next.stage="생산";
        next.status="출하검사 대기";
      }else if(/완료/.test(productionStatus)){
        next.stage="생산";
        next.status=pqc.status==="검사중"?"공정검사 중":"생산완료 — 공정검사 대기";
      }else if(/생산중|진행중|실적/.test(productionStatus)){
        next.stage="생산";
        next.status="생산중";
      }
    }

    if(!same(current,next)){
      db.lots[lot]=next;
      return true;
    }
    return false;
  }

  function buildShippingRows(db,entries){
    return entries.map(entry=>{
      const lot=entry.lot;
      const doc=entry.doc||{};
      const batch=entry.batch||{};
      const lotRow=db.lots?.[lot]||{};
      const oqc=inspectionState(db,"OQC",lot,OQC_ITEMS);
      const oqcRow=oqc.rows[0]||{};
      const actual=actualShipment(lotRow.ship);
      const coa=db.coa?.[lot]||{};
      const customer=text(lotRow.ship?.customer||lotRow.oqcCompletion?.customer||oqcRow.customer||doc.customer||doc.customerName||batch.customer||batch.customerName)||"현대자동차";
      const product=text(doc.item||batch.item||lotRow.itemName||lotRow.item)||"NBA20-HM01";
      const qty=number(lotRow.ship?.shipQty??lotRow.ship?.qty??lotRow.oqcCompletion?.qty??oqcRow.shipQty??doc.plan??batch.plan??lotRow.qty);
      const date=isoDate(lotRow.ship?.shipDate||lotRow.ship?.date||lotRow.oqcCompletion?.plannedShipDate||coa.ship||doc.due||batch.due);
      const delivery=actual?"납품완료":oqc.status==="불합격"?"출하차단":oqc.status==="합격"&&db.coa?.[lot]?"출하대기":"-";
      return {
        date,
        sales:entry.sales,
        customer,
        product,
        lot,
        qty,
        oqc:oqc.status,
        coa:db.coa?.[lot]?"발행":"-",
        delivery,
        source:"WORK_ORDER_QUALITY",
        workOrder:lot
      };
    }).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||String(b.lot).localeCompare(String(a.lot)));
  }

  function writeShippingLocal(rows){
    try{
      const raw=localStorage.getItem(SHIPPING_LOCAL_KEY)||"";
      const next=JSON.stringify(rows);
      if(raw===next)return false;
      localStorage.setItem(SHIPPING_LOCAL_KEY,next);
      return true;
    }catch(_error){return false;}
  }
  function scheduleSharedShipping(rows){
    if(sharedTimer)clearTimeout(sharedTimer);
    sharedTimer=setTimeout(async()=>{
      sharedTimer=null;
      if(typeof window.qmesSyncUpsert!=="function")return;
      try{
        await window.qmesSyncUpsert(SYNC_TYPE,SHIPPING_RECORD_KEY,{
          module:"erp",schema:2,kind:"shipping",rows,source:"WORK_ORDER_QUALITY",
          updatedAt:new Date().toISOString(),updatedBy:currentUser()
        });
      }catch(error){console.warn("[QMES] shipping linkage shared sync failed",error);}
    },120);
  }

  function persistDb(){
    try{if(typeof dbSave==="function")dbSave();}catch(error){console.warn("[QMES] LOT linkage dbSave failed",error);}
  }

  function reconcile(){
    if(running)return;
    running=true;
    try{
      const db=getDb();
      if(!db)return;
      db.insp=db.insp||{};
      db.coa=db.coa||{};
      const entries=orderMap(db);
      let changed=false;
      entries.forEach(entry=>{if(syncOneLot(db,entry))changed=true;});
      const shippingRows=buildShippingRows(db,entries);
      const shippingChanged=writeShippingLocal(shippingRows);
      if(shippingChanged)scheduleSharedShipping(shippingRows);
      if(changed){
        persistDb();
        window.dispatchEvent(new CustomEvent("qmes:quality-linkage-updated",{detail:{lots:entries.length}}));
        window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"QUALITY_LINKAGE"}}));
      }
      if(shippingChanged){
        window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"shipping",source:"WORK_ORDER_QUALITY",rows:shippingRows.length}}));
      }
    }finally{running=false;}
  }

  function nextShipmentNo(db,date){
    const key=compactDate(date)||new Date().toISOString().slice(0,10).replace(/-/g,"");
    const prefix=`SHP-${key}-`;
    const used=Object.values(db.lots||{}).map(lot=>text(lot?.ship?.shipNo||lot?.ship?.no)).filter(no=>no.startsWith(prefix));
    let seq=1;
    while(used.includes(`${prefix}${String(seq).padStart(3,"0")}`))seq+=1;
    return `${prefix}${String(seq).padStart(3,"0")}`;
  }
  function confirmActualShipment(lotNo){
    const db=getDb();
    const lot=exactLot(lotNo);
    const lotRow=db?.lots?.[lot];
    if(!db||!lotRow)return;
    const oqc=inspectionState(db,"OQC",lot,OQC_ITEMS);
    if(oqc.status!=="합격"){window.alert("출하검사(OQC) 합격 후 출하완료 처리할 수 있습니다.");return;}
    if(!db.coa?.[lot]){window.alert("출하성적서(CoA) 발행 후 출하완료 처리할 수 있습니다.");return;}
    if(actualShipment(lotRow.ship)){window.alert("이미 출하완료 처리된 LOT입니다.");return;}
    if(!window.confirm(`${lot} LOT를 실제 출하완료 처리하시겠습니까?`))return;

    const entries=orderMap(db);
    const entry=entries.find(row=>row.lot===lot)||{doc:{},batch:{},sales:""};
    const row=buildShippingRows(db,entries).find(item=>item.lot===lot)||{};
    const shipDate=isoDate(row.date)||new Date().toISOString().slice(0,10);
    const shipNo=nextShipmentNo(db,shipDate);
    const ship={
      shipNo,no:shipNo,customer:text(row.customer)||"현대자동차",
      qty:number(row.qty),shipQty:number(row.qty),shipDate,date:shipDate,
      destination:text(lotRow.oqcCompletion?.destination||db.coa?.[lot]?.destination),
      inspector:text(lotRow.oqcCompletion?.inspector||oqc.inspector),
      source:"ERP_SHIPPING",actualShipment:true,confirmedAt:new Date().toISOString(),confirmedBy:currentUser()
    };
    lotRow.ship=ship;
    lotRow.stage="출하";
    lotRow.status="출하완료";
    lotRow.steps=Array.isArray(lotRow.steps)?lotRow.steps:[];
    if(!lotRow.steps.some(step=>text(step?.shipNo)===shipNo)){
      lotRow.steps.push({stage:"출하",name:"제품 출하확정",time:shipDate,detail:`출하번호 ${shipNo} · 고객사 ${ship.customer} · 출하수량 ${ship.qty.toLocaleString()} kg`,result:"출하완료",by:ship.confirmedBy,shipNo});
    }
    const batch=(Array.isArray(db.batches)?db.batches:[]).find(item=>exactLot(item?.no)===lot);
    if(batch){batch.status="출하완료";batch.ship=ship;}
    persistDb();
    reconcile();
  }

  function decorateShippingUi(){
    const roots=Array.from(document.querySelectorAll(".qerp")).filter(root=>/출하\s*·\s*납품관리/.test(text(root.querySelector(".qerp-title")?.textContent)));
    roots.forEach(root=>{
      const table=Array.from(root.querySelectorAll("table")).find(t=>/완제품 LOT/.test(text(t.querySelector("thead")?.textContent)));
      if(!table)return;
      table.querySelectorAll("tbody tr").forEach(tr=>{
        const cells=tr.querySelectorAll("td");
        if(cells.length<9)return;
        const lot=exactLot(cells[4]?.textContent);
        const db=getDb();
        const lotRow=db?.lots?.[lot];
        if(!lotRow)return;
        cells[8].querySelectorAll("[data-qmes-ship-complete]").forEach(button=>button.remove());
        const oqc=inspectionState(db,"OQC",lot,OQC_ITEMS);
        if(oqc.status!=="합격"||!db.coa?.[lot]||actualShipment(lotRow.ship))return;
        const button=document.createElement("button");
        button.type="button";
        button.dataset.qmesShipComplete=lot;
        button.textContent="출하완료 처리";
        button.style.cssText="margin-left:6px;border:0;border-radius:6px;background:#16a34a;color:#fff;padding:5px 8px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap";
        cells[8].appendChild(button);
      });
    });
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("[data-qmes-ship-complete]");
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    confirmActualShipment(button.dataset.qmesShipComplete||"");
  },true);

  let uiQueued=false;
  new MutationObserver(()=>{
    if(uiQueued)return;
    uiQueued=true;
    requestAnimationFrame(()=>{uiQueued=false;decorateShippingUi();});
  }).observe(document.documentElement,{childList:true,subtree:true});

  ["qmes:workorder-saved","qmes:workorder-synced","qmes:workorder-updated","qmes:data-updated","qmes:erp-data-changed","qmes:mes-master-ready"].forEach(name=>{
    window.addEventListener(name,event=>{
      if(event?.detail?.source==="QUALITY_LINKAGE"||event?.detail?.source==="WORK_ORDER_QUALITY")return;
      setTimeout(()=>{reconcile();decorateShippingUi();},0);
    });
  });
  window.addEventListener("storage",()=>setTimeout(reconcile,0));

  let attempts=0;
  const boot=setInterval(()=>{
    attempts+=1;
    if(getDb()){
      clearInterval(boot);
      reconcile();
      decorateShippingUi();
      setInterval(()=>{reconcile();decorateShippingUi();},2000);
    }else if(attempts>=100)clearInterval(boot);
  },100);

  window.qmesLotQualityLinkage={reconcile,confirmActualShipment,inspectionState};
})();
