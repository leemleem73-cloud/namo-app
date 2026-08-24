/* QMES production worker live-name sync, 2026-08-24
 * Keeps work-order/result display names aligned with the current server user name
 * by using the stable worker IDs saved in process:<LOT> records.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_WORKER_LIVE_NAME_SYNC_20260824__) return;
  window.__QMES_PRODUCTION_WORKER_LIVE_NAME_SYNC_20260824__=true;

  const clean=v=>String(v==null?"":v).trim();
  let running=false;
  let rerunTimer=0;

  async function getJson(url){
    const response=await fetch(url,{credentials:"same-origin"});
    const data=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||data.success===false) throw new Error(data.message||`조회 실패 (${response.status})`);
    return Array.isArray(data.data)?data.data:[];
  }

  async function putSync(key,payload){
    const response=await fetch("/api/qmes-sync/workorder",{
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({key,payload})
    });
    const data=await response.json().catch(()=>({success:false}));
    if(!response.ok||data.success===false) throw new Error(data.message||`저장 실패 (${response.status})`);
    return data.data;
  }

  function payloadOf(record){
    const value=record?.payload;
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){
      try{return JSON.parse(value)}catch(_error){return {}}
    }
    return {};
  }

  function resolveWorkers(processPayload,userById){
    const ids=Array.isArray(processPayload?.workerIds)?processPayload.workerIds.map(clean).filter(Boolean):[];
    const snapshots=Array.isArray(processPayload?.workers)?processPayload.workers:[];
    if(!ids.length) return null;
    const snapshotById=new Map(snapshots.map(worker=>[clean(worker?.id||worker?.uid),worker]));
    const workers=ids.map(id=>{
      const live=userById.get(id);
      const old=snapshotById.get(id)||{};
      if(live){
        return {
          ...old,
          id,
          uid:clean(old.uid||live.uid),
          name:clean(live.name),
          dept:clean(live.department||live.dept)||clean(old.dept)||"생산부",
          role:clean(live.title)||clean(old.role)||"작업자"
        };
      }
      return old&&clean(old.name)?{...old,id}:{id,name:"",dept:"생산부",role:"작업자"};
    }).filter(worker=>clean(worker.name));
    if(!workers.length) return null;
    return {ids,workers,text:workers.map(worker=>clean(worker.name)).filter(Boolean).join(",")};
  }

  function updateOpenResultModal(lot,workerText){
    const modal=document.querySelector('#qmes-production-result-modal-root [aria-label="생산실적 입력"]');
    if(!modal||!workerText) return;
    const title=clean(modal.querySelector("h3")?.textContent);
    if(lot&&!title.includes(lot)) return;
    const label=Array.from(modal.querySelectorAll("label")).find(node=>clean(node.textContent).includes("최종 작업자"));
    const input=label?.querySelector("input");
    if(!input||clean(input.value)===workerText) return;
    const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
    descriptor?.set?.call(input,workerText);
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }

  async function syncNames(){
    if(running) return;
    running=true;
    let changed=false;
    try{
      const [users,records]=await Promise.all([
        getJson("/api/users/signable"),
        getJson("/api/qmes-sync/workorder")
      ]);
      const userById=new Map();
      users.forEach(user=>{
        const id=clean(user?.id||user?.uid);
        if(id) userById.set(id,user);
      });
      const recordByKey=new Map(records.map(record=>[clean(record?.record_key),record]));
      const processRecords=records.filter(record=>clean(record?.record_key).startsWith("process:"));

      for(const record of processRecords){
        const key=clean(record.record_key);
        const lot=key.slice("process:".length);
        if(!lot) continue;
        const processPayload=payloadOf(record);
        const resolved=resolveWorkers(processPayload,userById);
        if(!resolved?.text) continue;

        const oldProcessText=(Array.isArray(processPayload.workers)?processPayload.workers:[]).map(worker=>clean(worker?.name||worker)).filter(Boolean).join(",");
        if(oldProcessText!==resolved.text){
          await putSync(key,{
            ...processPayload,
            workerIds:resolved.ids,
            workers:resolved.workers,
            updatedAt:new Date().toISOString(),
            updatedBy:"WORKER NAME LIVE SYNC"
          });
          changed=true;
        }

        const baseRecord=recordByKey.get(lot);
        const basePayload=payloadOf(baseRecord);
        if(basePayload?.deleted||!basePayload?.doc) {
          updateOpenResultModal(lot,resolved.text);
          continue;
        }

        const doc={...basePayload.doc};
        const batch=basePayload.batch?{...basePayload.batch}:null;
        const lotRecord=basePayload.lotRecord?{...basePayload.lotRecord}:null;
        const currentText=clean(doc.workers||doc.worker||batch?.worker);
        const result=doc.productionResult&&typeof doc.productionResult==="object"?{...doc.productionResult}:null;
        const resultNeeds=result&&(clean(result.worker)!==resolved.text||clean(result.finalWorker)!==resolved.text);

        if(currentText!==resolved.text||resultNeeds){
          doc.workers=resolved.text;
          doc.worker=resolved.text;
          doc.workerIds=resolved.ids;
          if(result){
            result.worker=resolved.text;
            result.finalWorker=resolved.text;
            result.workerIds=resolved.ids;
            doc.productionResult=result;
            doc.finalWorker=resolved.text;
          }
          if(batch){
            batch.worker=resolved.text;
            batch.workerIds=resolved.ids;
            if(batch.productionResult&&typeof batch.productionResult==="object"){
              batch.productionResult={...batch.productionResult,worker:resolved.text,finalWorker:resolved.text,workerIds:resolved.ids};
            }
          }
          if(lotRecord?.productionResult&&typeof lotRecord.productionResult==="object"){
            lotRecord.productionResult={...lotRecord.productionResult,worker:resolved.text,finalWorker:resolved.text,workerIds:resolved.ids};
          }
          await putSync(lot,{...basePayload,doc,batch,lotRecord,savedAt:new Date().toISOString(),savedBy:"WORKER NAME LIVE SYNC"});
          changed=true;
        }

        try{
          if(window.DB?.woDocs?.[lot]){
            DB.woDocs[lot]={...DB.woDocs[lot],workers:resolved.text,worker:resolved.text,workerIds:resolved.ids};
            if(DB.woDocs[lot].productionResult){
              DB.woDocs[lot].productionResult={...DB.woDocs[lot].productionResult,worker:resolved.text,finalWorker:resolved.text,workerIds:resolved.ids};
              DB.woDocs[lot].finalWorker=resolved.text;
            }
          }
          if(Array.isArray(window.DB?.batches)){
            DB.batches=DB.batches.map(item=>clean(item?.no)===lot?{
              ...item,
              worker:resolved.text,
              workerIds:resolved.ids,
              productionResult:item.productionResult?{...item.productionResult,worker:resolved.text,finalWorker:resolved.text,workerIds:resolved.ids}:item.productionResult
            }:item);
          }
          if(window.DB?.productionProcesses?.[lot]){
            DB.productionProcesses[lot]={...DB.productionProcesses[lot],workerIds:resolved.ids,workers:resolved.workers};
          }
        }catch(_error){}
        updateOpenResultModal(lot,resolved.text);
      }

      if(changed){
        try{if(typeof window.dbSave==="function")window.dbSave();else if(typeof dbSave==="function")dbSave();}catch(_error){}
        window.dispatchEvent(new CustomEvent("qmes:worker-name-sync-complete"));
        window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{type:"worker-name-sync"}}));
      }
    }catch(error){
      console.warn("[QMES 생산] 작업자 이름 동기화 실패",error?.message||error);
    }finally{
      running=false;
    }
  }

  function schedule(delay=120){
    clearTimeout(rerunTimer);
    rerunTimer=setTimeout(syncNames,delay);
  }

  const start=()=>{
    schedule(50);
    window.addEventListener("focus",()=>schedule(50));
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule(100)});
    window.addEventListener("qmes:production-process-updated",()=>schedule(120));
    window.addEventListener("qmes:shared-sync-complete",()=>schedule(250));
    document.addEventListener("click",event=>{
      const button=event.target.closest?.("button");
      const text=clean(button?.textContent);
      if(text==="실적입력"||text==="실적수정") schedule(0);
    },true);
    setInterval(()=>{if(!document.hidden)schedule(0)},30000);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
