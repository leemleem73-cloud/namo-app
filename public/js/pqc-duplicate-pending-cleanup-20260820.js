/* QMES: remove only duplicate empty PQC pending rows when the same item already has measurements. */
(function cleanDuplicatePqcPendingRows(global){
  "use strict";
  if(global.__QMES_PQC_DUPLICATE_PENDING_CLEANUP_20260820__) return;
  global.__QMES_PQC_DUPLICATE_PENDING_CLEANUP_20260820__=true;

  const REQUIRED_ITEMS=["외관","입도(Dmax)","점도","고형분"];
  const ITEM_ALIASES=new Map([
    ["외관","외관"],
    ["입도","입도(Dmax)"],
    ["입도(dmax)","입도(Dmax)"],
    ["입도 dmax","입도(Dmax)"],
    ["점도","점도"],
    ["고형분","고형분"]
  ]);

  function canonicalItem(value){
    const text=String(value||"").trim();
    return ITEM_ALIASES.get(text.toLowerCase())||ITEM_ALIASES.get(text)||text;
  }

  function groupKey(row,index){
    const explicit=String(row?.groupId||"").trim();
    if(explicit) return explicit;
    const lot=String(row?.lot||"").trim();
    const date=String(row?.date||row?.shipDate||"").slice(0,10);
    if(lot||date) return `${lot}|${date}`;
    return String(row?.id||`ROW-${index}`).replace(/-\d+$/,"");
  }

  function measurements(row){
    if(!row) return [];
    const source=Array.isArray(row.measurements)
      ? row.measurements
      : String(row.value||"").split("/");
    return source.map((value)=>String(value||"").trim()).filter(Boolean);
  }

  function isEmptyPending(row){
    const judge=String(row?.judge||"").trim();
    return measurements(row).length===0
      && !String(row?.value||"").trim()
      && !String(row?.inspector||"").trim()
      && judge!=="불합격";
  }

  function cleanRows(rows){
    if(!Array.isArray(rows)||rows.length===0) return {rows:rows||[],removed:[]};

    const entries=rows.map((row,index)=>({row,index,group:groupKey(row,index),item:canonicalItem(row?.check)}));
    const measuredKeys=new Set();
    entries.forEach((entry)=>{
      if(REQUIRED_ITEMS.includes(entry.item) && measurements(entry.row).length>0){
        measuredKeys.add(`${entry.group}\u0000${entry.item}`);
      }
    });

    const removed=[];
    const kept=entries.filter((entry)=>{
      const duplicateKey=`${entry.group}\u0000${entry.item}`;
      const shouldRemove=REQUIRED_ITEMS.includes(entry.item)
        && measuredKeys.has(duplicateKey)
        && isEmptyPending(entry.row);
      if(shouldRemove) removed.push(entry.row);
      return !shouldRemove;
    }).map((entry)=>entry.row);

    return {rows:kept,removed};
  }

  function recordPayload(record){
    const payload=record?.payload;
    if(payload&&typeof payload==="object") return payload;
    if(typeof payload==="string"){
      try{return JSON.parse(payload);}catch(_error){return {};}
    }
    return {};
  }

  let remoteRepairPromise=null;
  async function repairRemoteRecords(){
    if(remoteRepairPromise) return remoteRepairPromise;
    if(typeof global.qmesSyncList!=="function" || typeof global.qmesSyncUpsert!=="function") return 0;

    remoteRepairPromise=(async()=>{
      const records=await global.qmesSyncList("pqc");
      let repaired=0;
      for(const record of (records||[])){
        const payload=recordPayload(record);
        if(payload.deleted || !Array.isArray(payload.rows)) continue;
        const cleaned=cleanRows(payload.rows);
        if(cleaned.removed.length===0) continue;
        const recordKey=String(record?.record_key||payload.rows[0]?.groupId||"").trim();
        if(!recordKey) continue;
        await global.qmesSyncUpsert("pqc",recordKey,{
          ...payload,
          rows:cleaned.rows,
          duplicatePendingRowsRemoved:cleaned.removed.length,
          duplicatePendingRowsRemovedAt:new Date().toISOString()
        });
        repaired+=cleaned.removed.length;
      }
      if(repaired>0) console.info(`[QMES] 공용 DB PQC 중복 검사대기 ${repaired}개 삭제 완료`);
      return repaired;
    })().catch((error)=>{
      console.warn("PQC 중복 검사대기 공용 DB 정리 실패:",error?.message||error);
      return 0;
    }).finally(()=>{remoteRepairPromise=null;});
    return remoteRepairPromise;
  }

  function cleanLocalRows(){
    if(typeof DB==="undefined" || !DB.insp || !Array.isArray(DB.insp.PQC)) return 0;
    const cleaned=cleanRows(DB.insp.PQC);
    if(cleaned.removed.length===0) return 0;
    DB.insp.PQC=cleaned.rows;
    if(typeof dbSave==="function") dbSave();
    console.info(`[QMES] 이 PC의 PQC 중복 검사대기 ${cleaned.removed.length}개 삭제 완료`);
    return cleaned.removed.length;
  }

  global.qmesCleanDuplicatePqcPendingRows=cleanRows;
  global.qmesRepairDuplicatePqcPendingRows=repairRemoteRecords;
  try{cleanLocalRows();}catch(error){console.warn("PQC 초기 중복 검사대기 정리 실패:",error);}

  if(typeof global.qmesSyncPullInspection==="function" && !global.qmesSyncPullInspection.__qmesDuplicatePendingCleanup){
    const original=global.qmesSyncPullInspection;
    const wrapped=async function(type){
      const rows=await original.apply(this,arguments);
      if(String(type||"").toLowerCase()!=="pqc") return rows;
      const cleaned=cleanRows(rows);
      if(cleaned.removed.length>0){
        if(typeof DB!=="undefined" && DB.insp) DB.insp.PQC=cleaned.rows;
        if(typeof dbSave==="function") dbSave();
        await repairRemoteRecords();
      }
      return cleaned.rows;
    };
    wrapped.__qmesDuplicatePendingCleanup=true;
    global.qmesSyncPullInspection=wrapped;
  }
})(window);
