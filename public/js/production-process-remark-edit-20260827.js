/* NAMO QMES - Production process remarks persistent inline edit - 2026-08-27
 * Keeps the '비고' column and per-row '수정' button attached even when the
 * original React production-process table re-renders its native 7 columns.
 * The click/save modal is owned by production-process-remark-click-hotfix-20260827.js.
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_REMARK_EDIT_20260827__) return;
  window.__QMES_PROCESS_REMARK_EDIT_20260827__=true;

  const STORE_KEY="qmes-process-step-remarks-v1";
  const API="/api/qmes-sync/workorder";
  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const norm=value=>clean(value).toUpperCase().replace(/[\s._-]+/g,"");
  const nativeFetch=window.fetch.bind(window);

  function readStore(){try{const value=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");return value&&typeof value==="object"?value:{};}catch(_error){return {};}}
  function writeStore(value){try{localStorage.setItem(STORE_KEY,JSON.stringify(value));}catch(_error){}}
  function notesForLot(lot){if(!lot)return {};const store=readStore();return store[lot]&&typeof store[lot]==="object"?store[lot]:{};}
  function setNotesForLot(lot,notes){if(!lot)return;const store=readStore();store[lot]={...(store[lot]||{}),...notes};writeStore(store);}

  /* Preserve remarks when the original React process screen saves its process payload later. */
  window.fetch=async function(input,init){
    try{
      const url=typeof input==="string"?input:String(input?.url||"");
      const method=String(init?.method||input?.method||"GET").toUpperCase();
      if(method==="POST"&&url.includes(API)&&typeof init?.body==="string"){
        const body=JSON.parse(init.body);
        const key=clean(body?.key),lot=key.startsWith("process:")?key.slice(8):"";
        if(lot&&Array.isArray(body?.payload?.steps)){
          const saved=notesForLot(lot);
          body.payload={...body.payload,steps:body.payload.steps.map((step,index)=>{
            const stepKey=String(step?.no??index+1);
            return Object.prototype.hasOwnProperty.call(saved,stepKey)?{...step,remark:clean(saved[stepKey])}:step;
          })};
          init={...init,body:JSON.stringify(body)};
        }
      }
    }catch(_error){}
    return nativeFetch(input,init);
  };

  function processCard(){
    return Array.from(document.querySelectorAll(".qpp-card")).find(card=>clean(card.querySelector(".qpp-card-head b")?.textContent)==="공정 진행 현황")||null;
  }

  function knownLots(){
    const result=[];
    try{Object.keys(window.DB?.woDocs||{}).forEach(value=>{value=clean(value);if(value)result.push(value);});}catch(_error){}
    try{Object.keys(window.DB?.lots||{}).forEach(value=>{value=clean(value);if(value)result.push(value);});}catch(_error){}
    try{(window.DB?.batches||[]).forEach(row=>{const value=clean(row?.no);if(value)result.push(value);});}catch(_error){}
    return Array.from(new Set(result));
  }

  function currentLot(){
    const scope=document.querySelector(".qmes-prod-process")||document;
    const info=scope.querySelector(".qpp-info")||document.querySelector(".qpp-info");
    if(info){
      for(const label of Array.from(info.querySelectorAll("small,label,span,div"))){
        const text=norm(label.textContent);
        if(text!=="LOTNO"&&!text.startsWith("LOTNO")) continue;
        const box=label.closest("div")||label.parentElement;
        const value=clean(box?.querySelector("strong")?.textContent);
        if(value&&value!=="-") return value;
      }
      const lots=knownLots();
      for(const strong of Array.from(info.querySelectorAll("strong"))){
        const value=clean(strong.textContent);
        if(value&&lots.includes(value)) return value;
      }
    }
    const lots=knownLots(),visible=clean(scope.textContent),matches=lots.filter(lot=>lot&&visible.includes(lot));
    return matches.length===1?matches[0]:"";
  }

  async function refreshLot(lot){
    if(!lot)return;
    try{
      const response=await nativeFetch(API,{credentials:"same-origin"});
      const data=await response.json().catch(()=>({success:false,data:[]}));
      if(!response.ok||data.success===false)return;
      const record=(Array.isArray(data.data)?data.data:[]).find(row=>clean(row?.record_key)===`process:${lot}`);
      const payload=record?.payload;
      if(!payload||!Array.isArray(payload.steps))return;
      const notes={};
      payload.steps.forEach((step,index)=>{notes[String(step?.no??index+1)]=clean(step?.remark??step?.note);});
      setNotesForLot(lot,notes);
      repairNow();
    }catch(_error){}
  }

  function ensureStyle(){
    if(document.getElementById("qmes-process-remark-edit-style-20260827"))return;
    const style=document.createElement("style");
    style.id="qmes-process-remark-edit-style-20260827";
    style.textContent=`
      .qmes-process-remark-head,.qmes-process-remark-cell{width:15%!important;min-width:170px!important;max-width:260px!important}
      .qmes-process-remark-cell{color:#475569!important;font-size:12px!important}
      .qmes-process-remark-inline{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-width:0!important}
      .qmes-process-remark-text{max-width:150px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#64748b!important}
      .qmes-process-remark-text.is-empty{display:none!important}
      .qmes-process-remark-inline-btn{height:30px!important;min-width:54px!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#fff!important;color:#334155!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important;box-shadow:none!important;outline:none!important}
      .qmes-process-remark-inline-btn:hover{background:#f8fafc!important}
      .qmes-process-remark-actions{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function renderRows(card,lot){
    const table=card?.querySelector("table.qpp-table");
    if(!table)return;
    const head=table.querySelector("thead tr");
    if(head&&!head.querySelector(".qmes-process-remark-head")){
      const th=document.createElement("th");
      th.className="qmes-process-remark-head";
      th.textContent="비고";
      head.appendChild(th);
    }
    card.querySelector(".qmes-process-remark-actions")?.remove();
    const notes=notesForLot(lot);
    Array.from(table.querySelectorAll("tbody tr")).forEach((row,index)=>{
      let cell=row.querySelector(".qmes-process-remark-cell");
      if(!cell){cell=document.createElement("td");cell.className="qmes-process-remark-cell";row.appendChild(cell);}
      const stepKey=clean(row.children?.[0]?.textContent)||String(index+1);
      const note=lot&&Object.prototype.hasOwnProperty.call(notes,stepKey)?clean(notes[stepKey]):clean(cell.dataset.remark);
      cell.dataset.remark=note;
      if(lot)cell.dataset.qmesLot=lot;
      cell.title=note;
      if(!cell.querySelector(".qmes-process-remark-inline")){
        cell.innerHTML='<div class="qmes-process-remark-inline"><span class="qmes-process-remark-text is-empty"></span><button type="button" class="qmes-process-remark-inline-btn">수정</button></div>';
      }
      const text=cell.querySelector(".qmes-process-remark-text");
      if(text){text.textContent=note;text.classList.toggle("is-empty",!note);}
    });
  }

  function needsRepair(){
    const card=processCard(),table=card?.querySelector("table.qpp-table");
    if(!table)return false;
    const rows=table.querySelectorAll("tbody tr").length;
    return !table.querySelector(".qmes-process-remark-head")||table.querySelectorAll(".qmes-process-remark-cell").length!==rows;
  }

  let repairing=false,lastLot="",loadingLot="";
  function repairNow(){
    if(repairing)return;
    repairing=true;
    try{
      ensureStyle();
      const card=processCard();
      if(!card)return;
      const lot=currentLot();
      /* IMPORTANT: render even while LOT lookup is temporarily unavailable during React commit. */
      renderRows(card,lot||"");
      if(lot&&lot!==lastLot&&lot!==loadingLot){
        loadingLot=lot;
        refreshLot(lot).finally(()=>{lastLot=lot;loadingLot="";});
      }
    }finally{repairing=false;}
  }

  function repairBurst(){[0,16,45,100,180].forEach(delay=>setTimeout(repairNow,delay));}

  function start(){
    repairNow();
    const observer=new MutationObserver(mutations=>{
      if(repairing)return;
      if(mutations.some(m=>m.addedNodes?.length||m.removedNodes?.length)){
        /* MutationObserver fires before paint: repair synchronously so the native 7-column table is not visible. */
        if(needsRepair())repairNow();
        repairBurst();
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    const watchdog=setInterval(()=>{if(needsRepair())repairNow();},600);
    window.addEventListener("beforeunload",()=>clearInterval(watchdog),{once:true});
    ["qmes:production-process-updated","qmes:data-updated","qmes:workorder-synced","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,()=>{lastLot="";repairBurst();}));
    [100,250,500,900,1500,2500].forEach(delay=>setTimeout(repairNow,delay));
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
