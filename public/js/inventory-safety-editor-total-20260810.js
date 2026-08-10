/* QMES manual safety-stock editor and total quantity - additive patch, 2026-08-10 */
(function installInventorySafetyEditor(global){
  "use strict";
  if(global.__QMES_INVENTORY_SAFETY_EDITOR_20260810__) return;
  global.__QMES_INVENTORY_SAFETY_EDITOR_20260810__=true;

  const RECORD_KEY="safety-stock-v1";
  let wrappedBuilder=null;
  let pullStarted=false;
  let queued=false;

  function text(value){return String(value??"").trim();}
  function number(value){
    const parsed=Number(text(value).replace(/,/g,""));
    return Number.isFinite(parsed)?parsed:0;
  }
  function format(value){
    return number(value).toLocaleString("ko-KR",{maximumFractionDigits:3});
  }
  function settings(){
    if(!global.DB) return {};
    if(!global.DB.inventorySafety||typeof global.DB.inventorySafety!=="object") global.DB.inventorySafety={};
    return global.DB.inventorySafety;
  }
  function emit(){
    const detail={source:"inventory-safety-editor"};
    try{global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
  }
  function persistLocal(){
    try{if(typeof global.dbSave==="function") global.dbSave();}catch(_error){}
  }
  function payloadOf(record){
    const payload=record?.payload;
    if(payload&&typeof payload==="object") return payload;
    if(typeof payload==="string"){
      try{return JSON.parse(payload);}catch(_error){return {};}
    }
    return {};
  }

  function installBuilderOverride(){
    if(typeof global.qmesBuildInventoryRows!=="function") return false;
    if(global.qmesBuildInventoryRows.__qmesSafetyOverride) return true;
    const original=global.qmesBuildInventoryRows;
    const next=function buildRowsWithManualSafety(){
      const rows=original()||[];
      const saved=settings();
      return rows.map((row)=>{
        const has=Object.prototype.hasOwnProperty.call(saved,row.code);
        const safety=has?Math.max(0,number(saved[row.code])):number(row.safety);
        const available=number(row.availableStock);
        return {...row,safety,status:available<safety?"부족":"정상"};
      });
    };
    next.__qmesSafetyOverride=true;
    next.__qmesOriginal=original;
    wrappedBuilder=next;
    global.qmesBuildInventoryRows=next;
    return true;
  }

  async function saveShared(code,value,input){
    const nextValue=Math.max(0,number(value));
    settings()[code]=nextValue;
    persistLocal();
    if(input){
      input.value=String(nextValue);
      input.dataset.state="saving";
    }
    emit();
    schedule();

    try{
      if(typeof global.qmesSyncUpsert!=="function") throw new Error("공용 저장 기능을 불러오지 못했습니다.");
      await global.qmesSyncUpsert("inventory",RECORD_KEY,{
        settings:{...settings()},
        savedAt:new Date().toISOString(),
        savedBy:text(global.__QMES_USER__?.name||global.__QMES_USER__)
      });
      if(input){
        input.dataset.state="saved";
        global.setTimeout(()=>{if(input.isConnected) input.dataset.state="";},1200);
      }
    }catch(error){
      if(input){
        input.dataset.state="error";
        input.title="이 PC에는 저장됐지만 공용 저장에 실패했습니다: "+text(error?.message||error);
      }
      console.warn("[QMES] 안전재고 공용 저장 실패",error?.message||error);
    }
  }

  async function pullShared(){
    if(pullStarted||typeof global.qmesSyncList!=="function") return;
    if(!global.__QMES_CURRENT_USER__&&!global.__QMES_USER__) return;
    pullStarted=true;
    try{
      const records=await global.qmesSyncList("inventory");
      const record=(records||[]).find((item)=>text(item?.record_key)===RECORD_KEY);
      const remote=payloadOf(record)?.settings;
      if(remote&&typeof remote==="object"){
        global.DB.inventorySafety={...settings(),...remote};
        persistLocal();
        emit();
      }
    }catch(error){
      pullStarted=false;
      console.warn("[QMES] 안전재고 공용 설정 조회 실패",error?.message||error);
    }
    schedule();
  }

  function findRawTable(){
    return Array.from(document.querySelectorAll("table")).find((table)=>{
      const labels=Array.from(table.querySelectorAll("thead th")).map((th)=>text(th.textContent));
      return labels.includes("자재코드")&&labels.includes("현재고")&&labels.includes("안전재고");
    })||null;
  }

  function enhanceSafetyCells(){
    const table=findRawTable();
    if(!table) return;
    const labels=Array.from(table.querySelectorAll("thead th")).map((th)=>text(th.textContent));
    const safetyIndex=labels.indexOf("안전재고");
    if(safetyIndex<0) return;

    const rows=typeof global.qmesBuildInventoryRows==="function"?global.qmesBuildInventoryRows():[];
    const byCode=new Map(rows.map((row)=>[text(row.code),row]));
    table.querySelectorAll("tbody tr").forEach((tr)=>{
      const cells=Array.from(tr.cells||[]);
      const code=text(cells[0]?.textContent);
      const cell=cells[safetyIndex];
      const row=byCode.get(code);
      if(!cell||!row) return;
      let input=cell.querySelector("input.qmes-safety-stock-input");
      if(!input){
        cell.textContent="";
        input=document.createElement("input");
        input.type="number";
        input.min="0";
        input.step="1";
        input.inputMode="decimal";
        input.className="qmes-safety-stock-input";
        input.setAttribute("aria-label",row.name+" 안전재고");
        input.addEventListener("keydown",(event)=>{
          if(event.key==="Enter"){event.preventDefault();input.blur();}
        });
        input.addEventListener("change",()=>void saveShared(code,input.value,input));
        cell.appendChild(input);
      }
      if(document.activeElement!==input) input.value=String(number(row.safety));
    });
  }

  function updateTotal(){
    const table=findRawTable();
    if(!table||typeof global.qmesBuildInventoryRows!=="function") return;
    const rows=global.qmesBuildInventoryRows()||[];
    const total=rows.reduce((sum,row)=>sum+number(row.stock),0);
    const heading=Array.from(document.querySelectorAll("h1,h2,h3,h4,div")).find((node)=>
      text(node.textContent)==="원재료 · 부자재 재고 현황"
    );
    const header=heading?.parentElement;
    if(!header) return;
    let target=Array.from(header.children).find((node)=>node!==heading&&node.matches?.("span,div"));
    if(!target){
      target=document.createElement("span");
      header.appendChild(target);
    }
    target.classList.add("qmes-inventory-total");
    const label=`총 ${rows.length}개 품목 · 총 ${format(total)} kg`;
    if(text(target.textContent)!==label) target.textContent=label;
  }

  function apply(){
    queued=false;
    installBuilderOverride();
    enhanceSafetyCells();
    updateTotal();
  }
  function schedule(){
    if(queued) return;
    queued=true;
    global.requestAnimationFrame(apply);
  }

  const style=document.createElement("style");
  style.id="qmes-inventory-safety-editor-style";
  style.textContent=`
    .qmes-safety-stock-input{
      width:92px;max-width:100%;padding:5px 8px;border:1px solid rgba(125,211,252,.34);
      border-radius:7px;background:#0a192b;color:#f8fbff;font:700 14px/1.2 inherit;
      text-align:right;font-variant-numeric:tabular-nums;outline:none;
    }
    .qmes-safety-stock-input:focus{border-color:#38bdf8;box-shadow:0 0 0 2px rgba(56,189,248,.16)}
    .qmes-safety-stock-input[data-state="saving"]{border-color:#fbbf24}
    .qmes-safety-stock-input[data-state="saved"]{border-color:#34d399}
    .qmes-safety-stock-input[data-state="error"]{border-color:#fb7185}
    .qmes-inventory-total{color:#7dd3fc!important;font-size:12px!important;font-weight:800!important}
  `;
  document.head.appendChild(style);

  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  ["qmes:inventory-stage3-ready","qmes:data-updated","qmes:auth-ready","focus"].forEach((eventName)=>{
    global.addEventListener(eventName,()=>{
      installBuilderOverride();
      if(eventName!=="qmes:data-updated") void pullShared();
      schedule();
    });
  });
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{schedule();void pullShared();},{once:true});
  }else{
    schedule();
    void pullShared();
  }
})(window);
