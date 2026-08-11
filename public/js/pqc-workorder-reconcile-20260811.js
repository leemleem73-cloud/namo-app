/* QMES: keep work orders and PQC records in latest date order and normalize PQC process numbers. */
(function reconcileWorkOrderPqc(global){
  "use strict";
  if(global.__QMES_PQC_WO_RECONCILE_20260811_V8__) return;
  global.__QMES_PQC_WO_RECONCILE_20260811_V8__=true;

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

  function pqcGroupKey(row,index){
    const explicit=String(row?.groupId||"").trim();
    if(explicit) return explicit;
    const lot=String(row?.lot||"").trim();
    const date=String(row?.date||row?.shipDate||"").slice(0,10);
    if(lot||date) return `${lot}|${date}`;
    return String(row?.id||`ROW-${index}`).replace(/-\d+$/,"");
  }

  function normalizePqcProcessNumbers(rows){
    if(!Array.isArray(rows)||!rows.length) return rows;
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
        group.rows.forEach((row)=>{ row.groupId=nextGroupId; });
      });
    });
    return rows;
  }

  function sortWorkOrdersNow(){
    if(typeof DB === "undefined" || !Array.isArray(DB.batches)) return false;
    const sorted=sortRowsByDate(DB.batches,(row)=>row?.due,(row)=>row?.no);
    const before=DB.batches.map((row)=>String(row.no||"")).join("|");
    const after=sorted.map((row)=>String(row.no||"")).join("|");
    if(before===after) return false;
    DB.batches=sorted;
    return true;
  }

  function normalizeAndSortPqcRows(rows){
    normalizePqcProcessNumbers(rows);
    return sortRowsByDate(rows,(row)=>row?.date||row?.shipDate,(row)=>row?.groupId||row?.id);
  }

  function sortPqcNow(){
    if(typeof DB === "undefined" || !DB.insp || !Array.isArray(DB.insp.PQC)) return false;
    const before=DB.insp.PQC.map((row)=>`${String(row.groupId||"")}|${String(row.id||"")}`).join("|");
    const sorted=normalizeAndSortPqcRows(DB.insp.PQC);
    const after=sorted.map((row)=>`${String(row.groupId||"")}|${String(row.id||"")}`).join("|");
    DB.insp.PQC=sorted;
    return before!==after;
  }

  function sortAllNow(){
    const workChanged=sortWorkOrdersNow();
    const pqcChanged=sortPqcNow();
    return workChanged||pqcChanged;
  }
  try{ sortAllNow(); }catch(error){ console.warn("초기 최신순 정렬 실패:",error); }

  if(typeof global.qmesSyncPullWorkOrders==="function" && !global.qmesSyncPullWorkOrders.__qmesDateSorted){
    const original=global.qmesSyncPullWorkOrders;
    const wrapped=async function(){ const result=await original.apply(this,arguments); sortWorkOrdersNow(); return result; };
    wrapped.__qmesDateSorted=true; global.qmesSyncPullWorkOrders=wrapped;
  }

  if(typeof global.qmesSyncPullInspection==="function" && !global.qmesSyncPullInspection.__qmesDateSorted){
    const original=global.qmesSyncPullInspection;
    const wrapped=async function(type){
      const rows=await original.apply(this,arguments);
      if(String(type||"").toLowerCase()!=="pqc") return rows;
      return normalizeAndSortPqcRows(rows);
    };
    wrapped.__qmesDateSorted=true; global.qmesSyncPullInspection=wrapped;
  }

  async function reconcile(){
    if(typeof DB === "undefined" || !DB.woDocs || !DB.insp) return;
    DB.insp.PQC=Array.isArray(DB.insp.PQC)?DB.insp.PQC:[];
    let changed=false;
    for(const lotNo of Object.keys(DB.woDocs||{}).filter(Boolean)){
      if(DB.insp.PQC.some((row)=>String(row.lot||"").trim()===String(lotNo).trim())) continue;
      const created=typeof qmesCreatePqcDraftForIssuedWorkOrder==="function"?qmesCreatePqcDraftForIssuedWorkOrder(lotNo):null;
      if(!created) continue;
      changed=true;
      try{
        if(typeof qmesSyncUpsert==="function"){
          await qmesSyncUpsert(created.type,created.key,created.payload);
          created.rows.forEach((row)=>{row.sharedSync=true;});
        }
      }catch(error){console.warn("작업지시 공정검사 자동 보정 공용 DB 동기화 실패:",lotNo,error.message);}
    }
    if(sortWorkOrdersNow()) changed=true;
    if(sortPqcNow()) changed=true;
    if(changed&&typeof dbSave==="function") dbSave();
  }

  function schedule(){setTimeout(()=>{reconcile().catch((e)=>console.warn("PQC 자동 보정 실패:",e));},300);}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true}); else schedule();
  global.addEventListener("focus",schedule);
  global.addEventListener("qmes:data-updated",schedule);
})(window);
