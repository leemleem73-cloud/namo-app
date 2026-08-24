/* QMES: keep work orders and PQC records aligned by production LOT.
 * Production completion and PQC inspection are separate states:
 * - Work-order production status is authoritative for production completion.
 * - PQC may start/save only after production is complete.
 * - PQC result must never erase a manually saved production completion.
 * - Missing PQC pending certificates are restored from issued work orders.
 */
(function reconcileWorkOrderPqc(global){
  "use strict";
  if(global.__QMES_PQC_WO_RECONCILE_20260824_V11__) return;
  global.__QMES_PQC_WO_RECONCILE_20260824_V11__=true;

  const REQUIRED_ITEMS=["점도","고형분","입도(Dmax)","외관"];
  const clean=value=>String(value==null?"":value).trim();

  function sortRowsByDate(rows,dateGetter,idGetter){
    if(!Array.isArray(rows)) return rows;
    return rows.map((row,index)=>({row,index})).sort((a,b)=>{
      const ad=clean(dateGetter(a.row)).slice(0,10);
      const bd=clean(dateGetter(b.row)).slice(0,10);
      if(ad!==bd) return bd.localeCompare(ad);
      const ai=clean(idGetter(a.row));
      const bi=clean(idGetter(b.row));
      if(ai!==bi) return ai.localeCompare(bi);
      return a.index-b.index;
    }).map(entry=>entry.row);
  }

  function canonicalItem(value){
    const text=clean(value);
    const lower=text.toLowerCase();
    if(lower==="입도"||lower==="입도(dmax)"||lower==="입도 dmax") return "입도(Dmax)";
    return text;
  }

  function measurements(row){
    if(!row) return [];
    const source=Array.isArray(row.measurements)&&row.measurements.length
      ? row.measurements
      : clean(row.value).split("/");
    return source.map(clean).filter(Boolean);
  }

  function pqcGroupKey(row,index){
    const explicit=clean(row?.groupId);
    if(explicit) return explicit;
    const lot=clean(row?.lot);
    const date=clean(row?.date||row?.shipDate).slice(0,10);
    if(lot||date) return `${lot}|${date}`;
    return clean(row?.id||`ROW-${index}`).replace(/-\d+$/,"");
  }

  function groupComplete(rows){
    return REQUIRED_ITEMS.every(item=>{
      const row=(rows||[]).find(entry=>canonicalItem(entry?.check)===item);
      const values=measurements(row);
      return item==="외관"?values.length>=1:values.length>=3;
    });
  }

  function groupPass(rows){
    if(!groupComplete(rows)) return false;
    return REQUIRED_ITEMS.every(item=>{
      const row=(rows||[]).find(entry=>canonicalItem(entry?.check)===item);
      return row&&["합격","OK","PASS","적합"].includes(clean(row.judge).toUpperCase());
    });
  }

  function pqcLotState(lotNo,sourceRows){
    const key=clean(lotNo);
    const rows=(Array.isArray(sourceRows)?sourceRows:((typeof DB!=="undefined"&&DB.insp?.PQC)||[]))
      .filter(row=>clean(row?.lot)===key);
    if(!rows.length) return {exists:false,complete:false,pass:false,status:"검사대기",rows:[]};

    const groups=new Map();
    rows.forEach((row,index)=>{
      const group=pqcGroupKey(row,index);
      if(!groups.has(group)) groups.set(group,[]);
      groups.get(group).push(row);
    });
    const ordered=Array.from(groups.entries()).map(([group,groupRows])=>({
      group,
      rows:groupRows,
      date:clean(groupRows[0]?.date||groupRows[0]?.shipDate).slice(0,10),
      complete:groupComplete(groupRows),
      pass:groupPass(groupRows)
    })).sort((a,b)=>{
      if(a.date!==b.date) return b.date.localeCompare(a.date);
      return clean(b.group).localeCompare(clean(a.group));
    });

    const passed=ordered.find(group=>group.pass);
    if(passed) return {exists:true,complete:true,pass:true,status:"합격",rows:passed.rows,group:passed.group};
    const latest=ordered[0];
    return {
      exists:true,
      complete:!!latest?.complete,
      pass:false,
      status:latest?.complete?"검사완료":"검사대기",
      rows:latest?.rows||rows,
      group:latest?.group||""
    };
  }

  function productionStatus(lotNo){
    if(typeof DB==="undefined") return "발행";
    const key=clean(lotNo);
    const doc=DB.woDocs?.[key]||{};
    const batch=(DB.batches||[]).find(row=>clean(row?.no)===key)||{};
    const manual=clean(doc.manualStatus);
    if(["발행","생산중","검사중","완료"].includes(manual)) return manual;

    const result=doc.productionResult||batch.productionResult||DB.lots?.[key]?.productionResult||{};
    if(
      clean(doc.status)==="완료"||clean(batch.status)==="완료"||
      result.completedAt||result.completeAt||result.finishedAt||
      doc.completedAt||batch.completedAt
    ) return "완료";

    const inputs=Array.isArray(doc.inputs)?doc.inputs:[];
    if(inputs.some(item=>Number(item?.act)>0)||Number(doc.productionActual)>0||Number(batch.done)>0) return "생산중";
    return "발행";
  }

  /* Work-order status is production status only. PQC is a downstream inspection. */
  global.getAutoWoStatus=productionStatus;
  global.qmesUnifiedWorkOrderStatus=productionStatus;
  global.qmesPqcLotState=pqcLotState;

  function sortWorkOrdersNow(){
    if(typeof DB==="undefined"||!Array.isArray(DB.batches)) return false;
    const sorted=sortRowsByDate(DB.batches,row=>row?.due,row=>row?.no);
    const before=DB.batches.map(row=>clean(row?.no)).join("|");
    const after=sorted.map(row=>clean(row?.no)).join("|");
    if(before===after) return false;
    DB.batches=sorted;
    return true;
  }

  function sortPqcNow(){
    if(typeof DB==="undefined"||!DB.insp) return false;
    DB.insp.PQC=Array.isArray(DB.insp.PQC)?DB.insp.PQC:[];
    const before=DB.insp.PQC.map((row,index)=>`${pqcGroupKey(row,index)}|${clean(row?.id)}`).join("|");
    const sorted=sortRowsByDate(DB.insp.PQC,row=>row?.date||row?.shipDate,row=>row?.groupId||row?.id);
    const after=sorted.map((row,index)=>`${pqcGroupKey(row,index)}|${clean(row?.id)}`).join("|");
    DB.insp.PQC=sorted;
    return before!==after;
  }

  function syncProductionStatuses(){
    if(typeof DB==="undefined"||!DB.woDocs) return false;
    let changed=false;
    Object.keys(DB.woDocs||{}).filter(Boolean).forEach(lotNo=>{
      const doc=DB.woDocs[lotNo]||{};
      const status=productionStatus(lotNo);

      /* Critical: never delete doc.manualStatus because PQC exists. */
      if(clean(doc.status)!==status){
        doc.status=status;
        changed=true;
      }

      const batch=(DB.batches||[]).find(row=>clean(row?.no)===clean(lotNo));
      if(batch){
        const batchStatus=status==="생산중"||status==="검사중"?"진행중":status;
        if(clean(batch.status)!==batchStatus){
          batch.status=batchStatus;
          changed=true;
        }
      }

      const lot=DB.lots?.[lotNo];
      if(lot&&!clean(lot.status).includes("홀드")){
        const pqc=pqcLotState(lotNo);
        const lotStatus=status==="완료"
          ? (pqc.pass?"생산완료 — PQC 합격":"생산완료 — 검사 대기")
          : status==="검사중"?"공정검사 진행중"
          : status==="생산중"?"생산중"
          : "발행 — 생산 대기";
        if(clean(lot.status)!==lotStatus){
          lot.status=lotStatus;
          changed=true;
        }
      }
    });
    return changed;
  }

  async function ensureMissingPqcDrafts(){
    if(typeof DB==="undefined"||!DB.woDocs||!DB.insp) return false;
    DB.insp.PQC=Array.isArray(DB.insp.PQC)?DB.insp.PQC:[];
    let changed=false;
    for(const lotNo of Object.keys(DB.woDocs||{}).filter(Boolean)){
      const key=clean(lotNo);
      if(DB.insp.PQC.some(row=>clean(row?.lot)===key)) continue;
      const createFn=typeof global.qmesCreatePqcDraftForIssuedWorkOrder==="function"
        ? global.qmesCreatePqcDraftForIssuedWorkOrder
        : (typeof qmesCreatePqcDraftForIssuedWorkOrder==="function"?qmesCreatePqcDraftForIssuedWorkOrder:null);
      if(!createFn) continue;
      const created=createFn(key);
      if(!created) continue;
      changed=true;
      try{
        if(typeof global.qmesSyncUpsert==="function"){
          await global.qmesSyncUpsert(created.type,created.key,created.payload);
          created.rows.forEach(row=>{row.sharedSync=true;});
        }
      }catch(error){
        console.warn("작업지시 공정검사 자동 보정 공용 DB 동기화 실패:",key,error?.message||error);
      }
    }
    return changed;
  }

  let reconciling=false;
  async function reconcile(options={}){
    if(reconciling||typeof DB==="undefined"||!DB.insp) return;
    reconciling=true;
    try{
      if(options.pullWorkOrders&&typeof global.qmesSyncPullWorkOrders==="function"){
        try{await global.qmesSyncPullWorkOrders();}
        catch(error){console.warn("작업지시 공용 동기화 후 PQC 보정 실패:",error?.message||error);}
      }
      let changed=await ensureMissingPqcDrafts();
      if(sortPqcNow()) changed=true;
      if(sortWorkOrdersNow()) changed=true;
      if(syncProductionStatuses()) changed=true;
      if(changed&&typeof global.dbSave==="function") global.dbSave();
    }finally{
      reconciling=false;
    }
  }

  if(typeof global.qmesSyncPullWorkOrders==="function"&&!global.qmesSyncPullWorkOrders.__qmesProductionStatusV11){
    const original=global.qmesSyncPullWorkOrders;
    const wrapped=async function(){
      const result=await original.apply(this,arguments);
      sortWorkOrdersNow();
      syncProductionStatuses();
      if(typeof global.dbSave==="function") global.dbSave();
      return result;
    };
    wrapped.__qmesProductionStatusV11=true;
    global.qmesSyncPullWorkOrders=wrapped;
  }

  if(typeof global.qmesSyncPullInspection==="function"&&!global.qmesSyncPullInspection.__qmesProductionStatusV11){
    const original=global.qmesSyncPullInspection;
    const wrapped=async function(type){
      const rows=await original.apply(this,arguments);
      if(clean(type).toLowerCase()!=="pqc") return rows;
      if(typeof DB!=="undefined"){
        DB.insp=DB.insp||{};
        DB.insp.PQC=Array.isArray(rows)?rows:[];
        await ensureMissingPqcDrafts();
        sortPqcNow();
        /* Do not derive or erase production completion from PQC. */
        syncProductionStatuses();
        if(typeof global.dbSave==="function") global.dbSave();
        return DB.insp.PQC;
      }
      return rows;
    };
    wrapped.__qmesProductionStatusV11=true;
    global.qmesSyncPullInspection=wrapped;
  }

  let timer=null;
  function schedule(options={}){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      reconcile(options).catch(error=>console.warn("작업지시/PQC 자동 보정 실패:",error));
    },250);
  }

  try{
    if(typeof DB!=="undefined"){
      sortPqcNow();
      sortWorkOrdersNow();
      syncProductionStatuses();
      if(typeof global.dbSave==="function") global.dbSave();
    }
  }catch(error){
    console.warn("초기 작업지시/PQC 상태 보정 실패:",error);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>schedule({pullWorkOrders:true}),{once:true});
  else schedule({pullWorkOrders:true});
  global.addEventListener("focus",()=>schedule({pullWorkOrders:true}));
  global.addEventListener("qmes-pqc-record-updated",()=>schedule());
  global.addEventListener("qmes:data-updated",()=>schedule());
})(window);
