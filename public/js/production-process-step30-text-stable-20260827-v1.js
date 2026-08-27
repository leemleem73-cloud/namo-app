/* NAMO QMES - Production process step 30 wording stable patch - 2026-08-27
 * ADD-ONLY patch. Existing production process source is not replaced.
 * Required display/data for process 30:
 * 30 | 원재료 준비 / 계량 · 투입 | 원재료 창고 · 드라이룸
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_STEP30_TEXT_STABLE_20260827_V1__) return;
  window.__QMES_PROCESS_STEP30_TEXT_STABLE_20260827_V1__=true;

  const EXPECTED_NAME="원재료 준비 / 계량 · 투입";
  const EXPECTED_EQUIPMENT="원재료 창고 · 드라이룸";
  const API="/api/qmes-sync/workorder";
  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();

  function processCard(){
    return Array.from(document.querySelectorAll(".qpp-card")).find(card=>
      clean(card.querySelector(".qpp-card-head b")?.textContent)==="공정 진행 현황"
    )||null;
  }

  function row30(){
    const table=processCard()?.querySelector("table.qpp-table");
    if(!table) return null;
    return Array.from(table.querySelectorAll("tbody tr")).find(row=>clean(row.children?.[0]?.textContent)==="30")||null;
  }

  function normalizeDom(){
    const row=row30();
    if(!row||row.children.length<3) return false;
    if(clean(row.children[1].textContent)!==EXPECTED_NAME) row.children[1].textContent=EXPECTED_NAME;
    if(clean(row.children[2].textContent)!==EXPECTED_EQUIPMENT) row.children[2].textContent=EXPECTED_EQUIPMENT;
    row.children[1].title=EXPECTED_NAME;
    row.children[2].title=EXPECTED_EQUIPMENT;
    return true;
  }

  function currentLot(){
    const root=document.querySelector(".qmes-prod-process");
    const info=root?.querySelector(".qpp-info");
    if(!info) return "";
    for(const box of Array.from(info.children||[])){
      const label=clean(box.querySelector("small")?.textContent).toUpperCase().replace(/[\s.]/g,"");
      if(label!=="LOTNO") continue;
      const lot=clean(box.querySelector("strong")?.textContent);
      if(lot&&lot!=="-") return lot;
    }
    return "";
  }

  let syncBusy=false;
  const syncedLots=new Set();
  async function normalizeShared(){
    const lot=currentLot();
    if(!lot||syncBusy||syncedLots.has(lot)) return;
    syncBusy=true;
    try{
      const response=await fetch(API,{credentials:"same-origin"});
      const data=await response.json().catch(()=>({success:false,data:[]}));
      if(!response.ok||data.success===false) return;
      const rows=Array.isArray(data.data)?data.data:[];
      const record=rows.find(row=>clean(row?.record_key)===`process:${lot}`);
      const payload=record?.payload&&typeof record.payload==="object"?record.payload:null;
      if(!payload||!Array.isArray(payload.steps)){
        syncedLots.add(lot);
        return;
      }
      const index=payload.steps.findIndex(step=>Number(step?.no)===30);
      if(index<0){
        syncedLots.add(lot);
        return;
      }
      const step=payload.steps[index]||{};
      if(clean(step.name)===EXPECTED_NAME&&clean(step.equipment)===EXPECTED_EQUIPMENT){
        syncedLots.add(lot);
        return;
      }
      const steps=payload.steps.map((item,i)=>i===index?{
        ...item,
        no:30,
        name:EXPECTED_NAME,
        equipment:EXPECTED_EQUIPMENT
      }:item);
      const next={
        ...payload,
        steps,
        updatedAt:new Date().toISOString(),
        updatedBy:"PROCESS 30 TEXT NORMALIZE"
      };
      const save=await fetch(API,{
        method:"POST",
        credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({key:`process:${lot}`,payload:next})
      });
      const saved=await save.json().catch(()=>({success:false}));
      if(!save.ok||saved.success===false) return;
      syncedLots.add(lot);
      try{
        if(window.DB){
          DB.productionProcesses=DB.productionProcesses||{};
          DB.productionProcesses[lot]=next;
        }
        if(typeof window.dbSave==="function") window.dbSave();
      }catch(_error){}
      try{window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot,source:"step30-text-normalize"}}));}catch(_error){}
    }catch(error){
      console.warn("[QMES 생산공정] 30번 공정 문구 정규화 실패",error?.message||error);
    }finally{
      syncBusy=false;
    }
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      normalizeDom();
      normalizeShared();
    });
  }

  function start(){
    normalizeDom();
    normalizeShared();
    const observer=new MutationObserver(schedule);
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    ["qmes:production-process-updated","qmes:data-updated","qmes:mes-master-ready","qmes:workorder-synced"].forEach(name=>window.addEventListener(name,schedule));
    window.addEventListener("focus",schedule);
    [50,150,350,700,1200,2500,5000].forEach(delay=>setTimeout(schedule,delay));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
