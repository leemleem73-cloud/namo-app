/* QMES production worklog date/retry fix, 2026-08-24 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_WORKLOG_DATE_RETRY_20260824__) return;
  window.__QMES_PRODUCTION_WORKLOG_DATE_RETRY_20260824__=true;

  const clean=v=>String(v==null?"":v).trim();
  const pad=n=>String(n).padStart(2,"0");
  function toDate(value,fallback=""){
    if(value instanceof Date && !Number.isNaN(value.getTime())){
      return `${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())}`;
    }
    const text=clean(value);
    const iso=text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    if(/\b\d{4}\b/.test(text)){
      const parsed=new Date(text);
      if(!Number.isNaN(parsed.getTime())) return `${parsed.getFullYear()}-${pad(parsed.getMonth()+1)}-${pad(parsed.getDate())}`;
    }
    return fallback || new Date().toISOString().slice(0,10);
  }

  /* The original component used String(new Date()).slice(0,10), producing "Mon Aug 24". */
  try{window.qmesProcessDate=value=>toDate(value);}catch(_error){}
  try{if(typeof qmesProcessDate!=="undefined")qmesProcessDate=value=>toDate(value);}catch(_error){}

  /* Keep future completion calls on the real work-order production date. */
  try{
    const original=window.qmesProcessCreateWorklog;
    if(typeof original==="function" && !original.__qmesDateFixed){
      const wrapped=async function(lot,workOrder,workers,process){
        const local=window.DB?.woDocs?.[lot]||{};
        const base={...(workOrder||{}),...local};
        const date=toDate(local.date||local.productionDate||base.date||base.productionDate||process?.productionDate);
        return original(lot,{...base,date,productionDate:date},workers,{...(process||{}),productionDate:date});
      };
      wrapped.__qmesDateFixed=true;
      window.qmesProcessCreateWorklog=wrapped;
      try{qmesProcessCreateWorklog=wrapped;}catch(_error){}
    }
  }catch(_error){}

  const inFlight=new Set();
  async function jsonFetch(url,options){
    const response=await fetch(url,{credentials:"same-origin",...(options||{})});
    const data=await response.json().catch(()=>({success:false}));
    if(!response.ok||!data.success) throw new Error(data.message||`${response.status} ${response.statusText}`);
    return data;
  }

  async function retryCompletedWorklogs(){
    let records=[];
    try{
      const data=await jsonFetch("/api/qmes-sync/workorder");
      records=Array.isArray(data.data)?data.data:[];
    }catch(_error){return;}
    const byKey=new Map(records.map(row=>[clean(row.record_key),row]));
    for(const row of records){
      const key=clean(row.record_key);
      if(!key.startsWith("process:")) continue;
      const lot=key.slice(8);
      if(!lot||inFlight.has(lot)) continue;
      const process=row.payload&&typeof row.payload==="object"?row.payload:{};
      const steps=Array.isArray(process.steps)?process.steps:[];
      const completed=clean(process.status)==="완료" || (steps.length>0&&steps.every(step=>clean(step.status)==="완료"));
      if(!completed||process.worklogId) continue;
      const snapshot=byKey.get(lot)?.payload||{};
      if(snapshot.deleted) continue;
      const doc=snapshot.doc||window.DB?.woDocs?.[lot]||{};
      const batch=snapshot.batch||(Array.isArray(window.DB?.batches)?window.DB.batches.find(item=>clean(item.no)===lot):null)||{};
      if(!doc||typeof doc!=="object") continue;
      const workDate=toDate(doc.date||doc.productionDate||batch.due||batch.date||process.productionDate);
      const workerNames=(Array.isArray(process.workers)?process.workers:[]).map(worker=>clean(worker?.name||worker)).filter(Boolean);
      const materials=(Array.isArray(doc.inputs)?doc.inputs:[]).map((item,index)=>({
        seq:index+1,
        material:clean(item?.name||item?.material),
        supName:clean(item?.supplier||item?.supName),
        lotNo:clean(item?.lot||item?.materialLot),
        inputQty:clean(item?.act??item?.std??""),
        inputTime:""
      }));
      const planQty=Number(doc.plan??doc.planQty??batch.plan??process.planQty??0)||0;
      const lastDone=steps.slice().reverse().find(step=>clean(step.status)==="완료");
      const prodQty=clean(lastDone?.resultQty||doc.productionActual||batch.done||planQty);
      const failQty=String(steps.reduce((sum,step)=>sum+(Number(step?.defectQty)||0),0));
      inFlight.add(lot);
      try{
        const saved=await jsonFetch("/api/worklog",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            workDate,
            finishedLot:lot,
            worker:workerNames.join(", ")||clean(doc.workers)||"생산작업자",
            planQty:planQty?String(planQty):"",
            prodQty,
            failQty,
            remark:"생산공정 관리 자동 완료 등록",
            materials
          })
        });
        const next={...process,worklogId:saved.data?.id||"saved",worklogLinkedAt:new Date().toISOString(),workDate,updatedAt:new Date().toISOString(),updatedBy:"WORKLOG DATE RETRY"};
        await jsonFetch("/api/qmes-sync/workorder",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({key:`process:${lot}`,payload:next})
        });
        const refresh=Array.from(document.querySelectorAll(".qmes-prod-process button")).find(button=>clean(button.textContent)==="새로고침");
        if(refresh&&!refresh.disabled) setTimeout(()=>refresh.click(),80);
        console.info(`[QMES 생산공정] ${lot} 작업일지 연동 복구 완료 (${workDate})`);
      }catch(error){
        console.warn(`[QMES 생산공정] ${lot} 작업일지 재연동 실패`,error?.message||error);
      }finally{
        inFlight.delete(lot);
      }
    }
  }

  const start=()=>{
    retryCompletedWorklogs();
    setTimeout(retryCompletedWorklogs,1500);
    window.addEventListener("focus",retryCompletedWorklogs);
    window.addEventListener("qmes:production-process-updated",retryCompletedWorklogs);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
