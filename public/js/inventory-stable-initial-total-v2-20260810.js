/* QMES inventory initial-render gate + safety editor v2 + total row, 2026-08-10 */
(function installInventoryStableInitialView(global){
  "use strict";
  if(global.__QMES_INVENTORY_STABLE_INITIAL_VIEW_20260810__) return;
  global.__QMES_INVENTORY_STABLE_INITIAL_VIEW_20260810__=true;

  const CACHE_KEY="qmes-inventory-safety-cache-v1";
  const RECORD_KEY="safety-stock-v1";
  let sharedReady=false;
  let revealTimer=0;
  let queued=false;

  function text(value){return String(value??"").trim();}
  function number(value){
    const parsed=Number(text(value).replace(/,/g,""));
    return Number.isFinite(parsed)?parsed:0;
  }
  function format(value){return number(value).toLocaleString("ko-KR",{maximumFractionDigits:3});}
  function database(){
    try{
      const value=global.eval("typeof DB !== 'undefined' ? DB : null");
      if(value&&typeof value==="object") return value;
    }catch(_error){}
    return global.DB&&typeof global.DB==="object"?global.DB:null;
  }
  function saveDatabase(){
    try{global.eval("if (typeof dbSave === 'function') dbSave()");return;}catch(_error){}
    try{if(typeof global.dbSave==="function") global.dbSave();}catch(_error){}
  }
  function readCache(){
    try{
      const value=JSON.parse(global.localStorage.getItem(CACHE_KEY)||"{}");
      return value&&typeof value==="object"?value:{};
    }catch(_error){return {};}
  }
  function writeCache(value){
    try{global.localStorage.setItem(CACHE_KEY,JSON.stringify(value||{}));}catch(_error){}
  }
  function settings(){
    const db=database();
    const cached=readCache();
    if(!db) return cached;
    if(!db.inventorySafety||typeof db.inventorySafety!=="object") db.inventorySafety={...cached};
    else if(Object.keys(cached).length) db.inventorySafety={...cached,...db.inventorySafety};
    return db.inventorySafety;
  }
  function emit(){
    const detail={source:"inventory-safety-stable-v2"};
    try{global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail}));}catch(_error){}
  }
  function payloadOf(record){
    const payload=record?.payload;
    if(payload&&typeof payload==="object") return payload;
    if(typeof payload==="string"){try{return JSON.parse(payload);}catch(_error){}}
    return {};
  }

  function wrapBuilder(){
    if(typeof global.qmesBuildInventoryRows!=="function") return false;
    if(global.qmesBuildInventoryRows.__qmesSafetyStableV2) return true;
    const original=global.qmesBuildInventoryRows;
    const wrapped=function(){
      const saved=settings();
      return (original()||[]).map((row)=>{
        const has=Object.prototype.hasOwnProperty.call(saved,row.code);
        const safety=has?Math.max(0,number(saved[row.code])):number(row.safety);
        return {...row,safety,status:number(row.availableStock)<safety?"부족":"정상"};
      });
    };
    wrapped.__qmesSafetyStableV2=true;
    wrapped.__qmesOriginal=original;
    global.qmesBuildInventoryRows=wrapped;
    return true;
  }

  async function pullSettings(){
    if(typeof global.qmesSyncList!=="function") return;
    try{
      const records=await global.qmesSyncList("inventory");
      const record=(records||[]).find((item)=>text(item?.record_key)===RECORD_KEY);
      const remote=payloadOf(record)?.settings;
      if(remote&&typeof remote==="object"){
        const merged={...settings(),...remote};
        const db=database();
        if(db) db.inventorySafety=merged;
        writeCache(merged);
        saveDatabase();
      }
    }catch(error){
      console.warn("[QMES] 안전재고 초기 동기화 실패",error?.message||error);
    }finally{
      sharedReady=true;
      emit();
      schedule();
    }
  }

  async function saveSafety(code,value,input){
    const next=Math.max(0,number(value));
    const saved={...settings(),[code]:next};
    const db=database();
    if(db) db.inventorySafety=saved;
    writeCache(saved);
    saveDatabase();
    if(input){input.value=String(next);input.dataset.state="saving";}
    emit();
    schedule();
    try{
      await global.qmesSyncUpsert("inventory",RECORD_KEY,{
        settings:saved,
        savedAt:new Date().toISOString(),
        savedBy:text(global.__QMES_USER__?.name||global.__QMES_USER__)
      });
      if(input){
        input.dataset.state="saved";
        global.setTimeout(()=>{if(input.isConnected) input.dataset.state="";},1000);
      }
    }catch(error){
      if(input){input.dataset.state="error";input.title="공용 저장 실패: "+text(error?.message||error);}
      console.warn("[QMES] 안전재고 저장 실패",error?.message||error);
    }
  }

  function findRawTable(){
    return Array.from(document.querySelectorAll("table")).find((table)=>{
      if(table.closest(".qmes-inventory-v2")) return false;
      const labels=Array.from(table.querySelectorAll("thead th")).map((th)=>text(th.textContent));
      return labels.includes("자재코드")&&labels.includes("현재고")&&labels.includes("안전재고");
    })||null;
  }
  function rawRows(){
    wrapBuilder();
    return typeof global.qmesBuildInventoryRows==="function"?(global.qmesBuildInventoryRows()||[]):[];
  }
  function enhanceTable(){
    const table=findRawTable();
    if(!table) return false;
    const labels=Array.from(table.querySelectorAll("thead th")).map((th)=>text(th.textContent));
    const safetyIndex=labels.indexOf("안전재고");
    const currentIndex=labels.indexOf("현재고");
    const statusIndex=labels.indexOf("상태");
    const rows=rawRows();
    const byCode=new Map(rows.map((row)=>[text(row.code),row]));

    if(safetyIndex>=0){
      table.querySelectorAll("tbody tr").forEach((tr)=>{
        const cells=Array.from(tr.cells||[]);
        const code=text(cells[0]?.textContent);
        const row=byCode.get(code);
        const cell=cells[safetyIndex];
        if(!row||!cell) return;
        let input=cell.querySelector("input.qmes-safety-stock-input-v2");
        if(!input){
          cell.textContent="";
          input=document.createElement("input");
          input.type="number";input.min="0";input.step="1";input.inputMode="decimal";
          input.className="qmes-safety-stock-input-v2";
          input.setAttribute("aria-label",row.name+" 안전재고");
          input.addEventListener("keydown",(event)=>{if(event.key==="Enter"){event.preventDefault();input.blur();}});
          input.addEventListener("change",()=>void saveSafety(code,input.value,input));
          cell.appendChild(input);
        }
        if(document.activeElement!==input) input.value=String(number(row.safety));
      });
    }

    if(statusIndex>=0){
      table.querySelectorAll("tbody tr").forEach((tr)=>{
        const cell=tr.cells?.[statusIndex];
        if(!cell) return;
        const value=text(cell.textContent);
        cell.classList.toggle("qmes-status-normal",value==="정상");
        cell.classList.toggle("qmes-status-shortage",value==="부족");
      });
    }

    const total=rows.reduce((sum,row)=>sum+number(row.stock),0);
    let foot=table.querySelector("tfoot.qmes-inventory-total-foot");
    if(!foot){
      foot=document.createElement("tfoot");
      foot.className="qmes-inventory-total-foot";
      table.appendChild(foot);
    }
    const count=Math.max(1,labels.length);
    const before=Math.max(1,currentIndex);
    const after=Math.max(1,count-before-1);
    const totalMarkup=`<tr><td colspan="${before}" class="qmes-total-label">총 합계</td><td class="qmes-total-value">${format(total)} kg</td><td colspan="${after}"></td></tr>`;
    if(foot.innerHTML!==totalMarkup) foot.innerHTML=totalMarkup;

    const heading=Array.from(document.querySelectorAll("h1,h2,h3,h4")).find((node)=>text(node.textContent).includes("원재료")&&text(node.textContent).includes("재고 현황"));
    const header=heading?.parentElement;
    const right=header?Array.from(header.children).find((node)=>node!==heading):null;
    if(right){
      const label=`총 ${rows.length}개 품목 · 총 ${format(total)} kg`;
      if(text(right.textContent)!==label) right.textContent=label;
    }
    return true;
  }

  function inventoryRoot(table){
    let node=table?.parentElement;
    while(node&&node.parentElement&&node.parentElement!==document.body){
      const value=text(node.textContent);
      if(value.includes("실시간 재고 요약")&&value.includes("원재료")&&value.includes("재고 현황")) return node;
      node=node.parentElement;
    }
    return table?.parentElement||null;
  }
  function applyGate(){
    const table=findRawTable();
    if(!table) return;
    const root=inventoryRoot(table);
    if(!root) return;
    root.classList.add("qmes-inventory-stable-root");
    if(sharedReady){
      root.classList.add("qmes-inventory-stable-ready");
      root.classList.remove("qmes-inventory-stable-wait");
    }else{
      root.classList.add("qmes-inventory-stable-wait");
    }
  }
  function apply(){
    queued=false;
    wrapBuilder();
    enhanceTable();
    applyGate();
  }
  function schedule(){
    if(queued) return;
    queued=true;
    global.requestAnimationFrame(apply);
  }

  const style=document.createElement("style");
  style.id="qmes-inventory-stable-initial-style";
  style.textContent=`
    .qmes-inventory-stable-root{position:relative}
    .qmes-inventory-stable-root.qmes-inventory-stable-wait>*{visibility:hidden!important}
    .qmes-inventory-stable-root.qmes-inventory-stable-wait::after{
      content:"재고 데이터 동기화 중…";visibility:visible;display:flex;align-items:center;justify-content:center;
      min-height:260px;border:1px solid rgba(96,165,250,.25);border-radius:14px;
      color:#7dd3fc;background:linear-gradient(145deg,#102139,#0c1a2d);font-size:14px;font-weight:800
    }
    .qmes-inventory-stable-ready{animation:qmesInventoryReady .12s ease-out both}
    @keyframes qmesInventoryReady{from{opacity:.82}to{opacity:1}}
    .qmes-safety-stock-input-v2{
      width:94px;max-width:100%;padding:5px 8px;border:1px solid rgba(125,211,252,.4);
      border-radius:7px;background:#091a2d;color:#f8fbff;font:800 14px/1.2 inherit;
      text-align:right;font-variant-numeric:tabular-nums;outline:none
    }
    .qmes-safety-stock-input-v2:focus{border-color:#38bdf8;box-shadow:0 0 0 2px rgba(56,189,248,.16)}
    .qmes-safety-stock-input-v2[data-state="saving"]{border-color:#fbbf24}
    .qmes-safety-stock-input-v2[data-state="saved"]{border-color:#34d399}
    .qmes-safety-stock-input-v2[data-state="error"]{border-color:#fb7185}
    table.qmes-raw-inventory-balanced td.qmes-status-normal span,
    td.qmes-status-normal span{
      color:#6ee7b7!important;background:rgba(16,185,129,.16)!important;
      border-color:rgba(52,211,153,.62)!important;box-shadow:0 0 14px rgba(16,185,129,.1)!important
    }
    table.qmes-raw-inventory-balanced td.qmes-status-shortage span,
    td.qmes-status-shortage span{
      color:#fda4af!important;background:rgba(225,29,72,.17)!important;
      border-color:rgba(251,113,133,.68)!important;box-shadow:0 0 14px rgba(225,29,72,.1)!important
    }
    .qmes-inventory-total-foot td{padding:11px 8px;border-top:1px solid rgba(125,211,252,.35);background:rgba(30,64,105,.2)}
    .qmes-inventory-total-foot .qmes-total-label{color:#d6e7f5;font-size:14px;font-weight:900;text-align:right}
    .qmes-inventory-total-foot .qmes-total-value{color:#7dd3fc;font-size:15px;font-weight:900;text-align:right;white-space:nowrap}
  `;
  document.head.appendChild(style);

  global.addEventListener("qmes:data-updated",(event)=>{
    if(event?.detail?.source==="inventory-shared-sync") sharedReady=true;
    schedule();
  });
  global.addEventListener("qmes:inventory-stage3-ready",()=>{schedule();void pullSettings();});
  global.addEventListener("qmes:auth-ready",()=>void pullSettings());
  global.addEventListener("focus",schedule);
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});

  revealTimer=global.setTimeout(()=>{sharedReady=true;schedule();},4500);
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  if(global.__QMES_CURRENT_USER__||global.__QMES_USER__) void pullSettings();
})(window);
