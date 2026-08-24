/* QMES: keep work orders and PQC records aligned by production LOT.
 * - Work-order status follows the actual PQC state for the same LOT.
 * - Missing PQC pending certificates are restored from issued work orders.
 * - PQC pull returns restored pending rows immediately, so F5/navigation stays consistent.
 */
(function reconcileWorkOrderPqc(global){
  "use strict";
  if(global.__QMES_PQC_WO_RECONCILE_20260824_V10__) return;
  global.__QMES_PQC_WO_RECONCILE_20260824_V10__=true;

  const REQUIRED_ITEMS=["점도","고형분","입도(Dmax)","외관"];

  function sortRowsByDate(rows,dateGetter,idGetter){
    if(!Array.isArray(rows)) return rows;
    return rows.map((row,index)=>({row,index})).sort((a,b)=>{
      const ad=String(dateGetter(a.row)||"").slice(0,10);
      const bd=String(dateGetter(b.row)||"").slice(0,10);
      if(ad!==bd) return bd.localeCompare(ad);
      const ai=String(idGetter(a.row)||"");
      const bi=String(idGetter(b.row)||"");
      if(ai!==bi) return ai.localeCompare(bi);
      return a.index-b.index;
    }).map((entry)=>entry.row);
  }

  function canonicalItem(value){
    const text=String(value||"").trim();
    const lower=text.toLowerCase();
    if(lower==="입도" || lower==="입도(dmax)" || lower==="입도 dmax") return "입도(Dmax)";
    return text;
  }

  function measurements(row){
    if(!row) return [];
    const source=Array.isArray(row.measurements) && row.measurements.length
      ? row.measurements
      : String(row.value||"").split("/");
    return source.map((value)=>String(value||"").trim()).filter(Boolean);
  }

  function pqcGroupKey(row,index){
    const explicit=String(row?.groupId||"").trim();
    if(explicit) return explicit;
    const lot=String(row?.lot||"").trim();
    const date=String(row?.date||row?.shipDate||"").slice(0,10);
    if(lot||date) return `${lot}|${date}`;
    return String(row?.id||`ROW-${index}`).replace(/-\d+$/,"");
  }

  function isPendingGroup(rows){
    if(!Array.isArray(rows)||rows.length===0) return false;
    return rows.every((row)=>measurements(row).length===0 && !String(row?.inspector||"").trim());
  }

  function groupComplete(rows){
    return REQUIRED_ITEMS.every((item)=>{
      const row=(rows||[]).find((entry)=>canonicalItem(entry?.check)===item);
      const values=measurements(row);
      return item==="외관" ? values.length>=1 : values.length>=3;
    });
  }

  function groupPass(rows){
    if(!groupComplete(rows)) return false;
    return REQUIRED_ITEMS.every((item)=>{
      const row=(rows||[]).find((entry)=>canonicalItem(entry?.check)===item);
      return row && ["합격","OK","PASS","적합"].includes(String(row.judge||"").trim().toUpperCase());
    });
  }

  function pqcLotState(lotNo,sourceRows){
    const key=String(lotNo||"").trim();
    const rows=(Array.isArray(sourceRows)?sourceRows:((typeof DB!=="undefined"&&DB.insp?.PQC)||[]))
      .filter((row)=>String(row?.lot||"").trim()===key);
    if(!rows.length) return {exists:false,complete:false,pass:false,status:null,rows:[]};

    const groups=new Map();
    rows.forEach((row,index)=>{
      const group=pqcGroupKey(row,index);
      if(!groups.has(group)) groups.set(group,[]);
      groups.get(group).push(row);
    });
    const ordered=Array.from(groups.entries()).map(([group,groupRows])=>({
      group,
      rows:groupRows,
      date:String(groupRows[0]?.date||groupRows[0]?.shipDate||"").slice(0,10),
      complete:groupComplete(groupRows),
      pass:groupPass(groupRows)
    })).sort((a,b)=>{
      if(a.date!==b.date) return b.date.localeCompare(a.date);
      return String(b.group).localeCompare(String(a.group));
    });

    const passed=ordered.find((group)=>group.pass);
    if(passed) return {exists:true,complete:true,pass:true,status:"완료",rows:passed.rows,group:passed.group};
    const latest=ordered[0];
    return {
      exists:true,
      complete:!!latest?.complete,
      pass:false,
      status:"검사중",
      rows:latest?.rows||rows,
      group:latest?.group||""
    };
  }

  function oqcPassed(lotNo){
    const key=String(lotNo||"").trim();
    const rows=(typeof DB!=="undefined"&&Array.isArray(DB.insp?.OQC))?DB.insp.OQC:[];
    return rows.some((row)=>String(row?.lot||"").trim()===key && ["합격","OK","PASS","적합"].includes(String(row?.judge||"").trim().toUpperCase()));
  }

  function unifiedWoStatus(lotNo){
    if(typeof DB==="undefined") return "발행";
    const key=String(lotNo||"").trim();
    const doc=DB.woDocs?.[key]||{};
    const pqcState=pqcLotState(key);

    /* Once inspection data exists, inspection is the authoritative status source. */
    if(oqcPassed(key)) return "완료";
    if(pqcState.exists) return pqcState.pass ? "완료" : "검사중";

    /* Manual status is still allowed before an inspection record exists. */
    if(doc.manualStatus) return doc.manualStatus;
    const inputs=Array.isArray(doc.inputs)?doc.inputs:[];
    if(inputs.some((item)=>Number(item?.act)>0)) return "생산중";
    return "발행";
  }

  /* Override the older work-order rule that kept every PQC LOT at 검사중 until OQC. */
  global.getAutoWoStatus=unifiedWoStatus;
  global.qmesUnifiedWorkOrderStatus=unifiedWoStatus;
  global.qmesPqcLotState=pqcLotState;

  function dedupePqcByLot(rows){
    if(!Array.isArray(rows)||rows.length===0) return rows||[];
    const groups=new Map();
    rows.forEach((row,index)=>{
      const key=pqcGroupKey(row,index);
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(row);
    });

    const byLot=new Map();
    groups.forEach((groupRows,key)=>{
      const lot=String(groupRows[0]?.lot||"").trim();
      if(!lot) return;
      if(!byLot.has(lot)) byLot.set(lot,[]);
      byLot.get(lot).push({key,rows:groupRows,pending:isPendingGroup(groupRows)});
    });

    const drop=new Set();
    byLot.forEach((lotGroups)=>{
      const completed=lotGroups.filter((group)=>!group.pending);
      const pending=lotGroups.filter((group)=>group.pending);
      if(completed.length>0){
        pending.forEach((group)=>drop.add(group.key));
        return;
      }
      if(pending.length>1){
        pending.sort((a,b)=>{
          const ad=String(a.rows[0]?.date||"");
          const bd=String(b.rows[0]?.date||"");
          if(ad!==bd) return bd.localeCompare(ad);
          return String(a.key).localeCompare(String(b.key));
        });
        pending.slice(1).forEach((group)=>drop.add(group.key));
      }
    });

    if(drop.size===0) return rows;
    console.info("[QMES] 중복 PQC 검사대기 제거:",Array.from(drop));
    return rows.filter((row,index)=>!drop.has(pqcGroupKey(row,index)));
  }

  function normalizePqcProcessNumbers(rows){
    if(!Array.isArray(rows)||!rows.length) return rows||[];
    const groups=new Map();
    rows.forEach((row,index)=>{
      const key=pqcGroupKey(row,index);
      if(!groups.has(key)) groups.set(key,{key,date:String(row?.date||row?.shipDate||"").slice(0,10),rows:[],firstIndex:index});
      groups.get(key).rows.push(row);
    });
    const byDate=new Map();
    groups.forEach((group)=>{
      const date=group.date||"0000-00-00";
      if(!byDate.has(date)) byDate.set(date,[]);
      byDate.get(date).push(group);
    });
    byDate.forEach((dateGroups,date)=>{
      dateGroups.sort((a,b)=>{
        const am=String(a.key).match(/^PQC-\d{6}-(\d{4})$/i);
        const bm=String(b.key).match(/^PQC-\d{6}-(\d{4})$/i);
        if(am&&bm&&Number(am[1])!==Number(bm[1])) return Number(am[1])-Number(bm[1]);
        if(am&&!bm) return -1;
        if(!am&&bm) return 1;
        return a.firstIndex-b.firstIndex;
      });
      const yymmdd=String(date).replace(/-/g,"").slice(2,8);
      dateGroups.forEach((group,index)=>{
        const nextGroupId=`PQC-${yymmdd}-${String(index+1).padStart(4,"0")}`;
        group.rows.forEach((row,rowIndex)=>{
          row.groupId=nextGroupId;
          if(!String(row.id||"").trim() || /^PQC-/.test(String(row.id||""))) row.id=`${nextGroupId}-${rowIndex+1}`;
        });
      });
    });
    return rows;
  }

  function normalizeAndSortPqcRows(rows){
    const deduped=dedupePqcByLot(Array.isArray(rows)?rows:[]);
    normalizePqcProcessNumbers(deduped);
    return sortRowsByDate(deduped,(row)=>row?.date||row?.shipDate,(row)=>row?.groupId||row?.id);
  }

  function sortWorkOrdersNow(){
    if(typeof DB==="undefined" || !Array.isArray(DB.batches)) return false;
    const sorted=sortRowsByDate(DB.batches,(row)=>row?.due,(row)=>row?.no);
    const before=DB.batches.map((row)=>String(row.no||"")).join("|");
    const after=sorted.map((row)=>String(row.no||"")).join("|");
    if(before===after) return false;
    DB.batches=sorted;
    return true;
  }

  function sortPqcNow(){
    if(typeof DB==="undefined" || !DB.insp) return false;
    DB.insp.PQC=Array.isArray(DB.insp.PQC)?DB.insp.PQC:[];
    const before=DB.insp.PQC.map((row)=>`${String(row.groupId||"")}|${String(row.id||"")}`).join("|");
    const sorted=normalizeAndSortPqcRows(DB.insp.PQC);
    const after=sorted.map((row)=>`${String(row.groupId||"")}|${String(row.id||"")}`).join("|");
    DB.insp.PQC=sorted;
    return before!==after;
  }

  function syncDerivedWorkOrderStatuses(){
    if(typeof DB==="undefined" || !DB.woDocs) return false;
    let changed=false;
    Object.keys(DB.woDocs||{}).filter(Boolean).forEach((lotNo)=>{
      const doc=DB.woDocs[lotNo]||{};
      const inspectionExists=pqcLotState(lotNo).exists || ((DB.insp?.OQC||[]).some((row)=>String(row?.lot||"").trim()===String(lotNo).trim()));
      const status=unifiedWoStatus(lotNo);

      if(inspectionExists && doc.manualStatus){
        delete doc.manualStatus;
        changed=true;
      }
      if(doc.status!==status){
        doc.status=status;
        changed=true;
      }

      const batch=(DB.batches||[]).find((row)=>String(row?.no||"").trim()===String(lotNo).trim());
      if(batch){
        const batchStatus=status==="완료" ? "완료" : status==="발행" ? "발행" : "진행중";
        if(batch.status!==batchStatus){ batch.status=batchStatus; changed=true; }
      }

      const lot=DB.lots?.[lotNo];
      if(lot && !String(lot.status||"").includes("홀드")){
        const lotStatus=status==="완료" ? "생산완료 — PQC 합격"
          : status==="검사중" ? "공정검사 진행중"
          : status==="생산중" ? "생산중"
          : "발행 — 생산 대기";
        if(lot.status!==lotStatus){ lot.status=lotStatus; changed=true; }
      }
    });
    return changed;
  }

  async function ensureMissingPqcDrafts(){
    if(typeof DB==="undefined" || !DB.woDocs || !DB.insp) return false;
    DB.insp.PQC=Array.isArray(DB.insp.PQC)?DB.insp.PQC:[];
    let changed=false;

    for(const lotNo of Object.keys(DB.woDocs||{}).filter(Boolean)){
      const key=String(lotNo).trim();
      if(DB.insp.PQC.some((row)=>String(row?.lot||"").trim()===key)) continue;
      const created=typeof global.qmesCreatePqcDraftForIssuedWorkOrder==="function"
        ? global.qmesCreatePqcDraftForIssuedWorkOrder(key)
        : (typeof qmesCreatePqcDraftForIssuedWorkOrder==="function" ? qmesCreatePqcDraftForIssuedWorkOrder(key) : null);
      if(!created) continue;
      changed=true;
      try{
        if(typeof global.qmesSyncUpsert==="function"){
          await global.qmesSyncUpsert(created.type,created.key,created.payload);
          created.rows.forEach((row)=>{ row.sharedSync=true; });
        }
      }catch(error){
        console.warn("작업지시 공정검사 자동 보정 공용 DB 동기화 실패:",key,error?.message||error);
      }
    }
    return changed;
  }

  let reconciling=false;
  async function reconcile(options={}){
    if(reconciling || typeof DB==="undefined" || !DB.insp) return;
    reconciling=true;
    try{
      if(options.pullWorkOrders && typeof global.qmesSyncPullWorkOrders==="function"){
        try{ await global.qmesSyncPullWorkOrders(); }catch(error){ console.warn("작업지시 공용 동기화 후 PQC 보정 실패:",error?.message||error); }
      }
      DB.insp.PQC=normalizeAndSortPqcRows(Array.isArray(DB.insp.PQC)?DB.insp.PQC:[]);
      let changed=await ensureMissingPqcDrafts();
      if(sortPqcNow()) changed=true;
      if(sortWorkOrdersNow()) changed=true;
      if(syncDerivedWorkOrderStatuses()) changed=true;
      if(changed && typeof global.dbSave==="function") global.dbSave();
    } finally {
      reconciling=false;
    }
  }

  if(typeof global.qmesSyncPullWorkOrders==="function" && !global.qmesSyncPullWorkOrders.__qmesDateSortedV10){
    const original=global.qmesSyncPullWorkOrders;
    const wrapped=async function(){
      const result=await original.apply(this,arguments);
      sortWorkOrdersNow();
      syncDerivedWorkOrderStatuses();
      if(typeof global.dbSave==="function") global.dbSave();
      return result;
    };
    wrapped.__qmesDateSortedV10=true;
    global.qmesSyncPullWorkOrders=wrapped;
  }

  if(typeof global.qmesSyncPullInspection==="function" && !global.qmesSyncPullInspection.__qmesWorkOrderAlignedV10){
    const original=global.qmesSyncPullInspection;
    const wrapped=async function(type){
      const rows=await original.apply(this,arguments);
      if(String(type||"").toLowerCase()!=="pqc") return rows;

      /* Make work orders available even on a fresh PC before deriving missing PQC rows. */
      if(typeof global.qmesSyncPullWorkOrders==="function"){
        try{ await global.qmesSyncPullWorkOrders(); }catch(error){ console.warn("PQC 조회 전 작업지시 동기화 실패:",error?.message||error); }
      }

      if(typeof DB!=="undefined"){
        DB.insp=DB.insp||{};
        DB.insp.PQC=normalizeAndSortPqcRows(rows);
        await ensureMissingPqcDrafts();
        DB.insp.PQC=normalizeAndSortPqcRows(DB.insp.PQC);
        syncDerivedWorkOrderStatuses();
        if(typeof global.dbSave==="function") global.dbSave();
        return DB.insp.PQC;
      }
      return normalizeAndSortPqcRows(rows);
    };
    wrapped.__qmesWorkOrderAlignedV10=true;
    global.qmesSyncPullInspection=wrapped;
  }

  let scheduleTimer=null;
  function schedule(options={}){
    clearTimeout(scheduleTimer);
    scheduleTimer=setTimeout(()=>{
      reconcile(options).catch((error)=>console.warn("작업지시/PQC 자동 보정 실패:",error));
    },250);
  }

  try{
    if(typeof DB!=="undefined"){
      sortPqcNow();
      sortWorkOrdersNow();
      syncDerivedWorkOrderStatuses();
    }
  }catch(error){ console.warn("초기 작업지시/PQC 상태 정렬 실패:",error); }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>schedule({pullWorkOrders:true}),{once:true});
  else schedule({pullWorkOrders:true});
  global.addEventListener("focus",()=>schedule({pullWorkOrders:true}));
  global.addEventListener("qmes-pqc-record-updated",()=>schedule());
  global.addEventListener("qmes:data-updated",()=>schedule());
})(window);
