/* NAMO QMES - Process remark edit click hotfix - 2026-08-27
 * Capture-phase owner for the inline '수정' buttons in 공정 진행 현황.
 * Opens the edit modal before React row-click handlers or stale per-node listeners can interfere.
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_REMARK_CLICK_HOTFIX_20260827__) return;
  window.__QMES_PROCESS_REMARK_CLICK_HOTFIX_20260827__=true;

  const API="/api/qmes-sync/workorder";
  const STORE_KEY="qmes-process-step-remarks-v1";
  const MODAL_ID="qmes-process-remark-modal-20260827";
  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const norm=value=>clean(value).toUpperCase().replace(/[\s._-]+/g,"");
  const esc=value=>String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  function readStore(){
    try{const value=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");return value&&typeof value==="object"?value:{};}catch(_error){return {};}
  }
  function writeStore(value){try{localStorage.setItem(STORE_KEY,JSON.stringify(value));}catch(_error){}}
  function saveLocalNote(lot,stepKey,note){
    const store=readStore();
    store[lot]=store[lot]&&typeof store[lot]==="object"?store[lot]:{};
    store[lot][String(stepKey)]=clean(note);
    writeStore(store);
  }

  function knownLots(){
    const result=[];
    try{Object.keys(window.DB?.woDocs||{}).forEach(value=>{if(clean(value))result.push(clean(value));});}catch(_error){}
    try{Object.keys(window.DB?.lots||{}).forEach(value=>{if(clean(value))result.push(clean(value));});}catch(_error){}
    try{(window.DB?.batches||[]).forEach(row=>{const value=clean(row?.no);if(value)result.push(value);});}catch(_error){}
    return Array.from(new Set(result));
  }

  function resolveCurrentLot(){
    const scope=document.querySelector(".qmes-prod-process")||document;
    const info=scope.querySelector(".qpp-info")||document.querySelector(".qpp-info");

    if(info){
      const labelNodes=Array.from(info.querySelectorAll("small,label,span,div"));
      for(const label of labelNodes){
        const labelText=norm(label.textContent);
        if(labelText!=="LOTNO"&&!labelText.startsWith("LOTNO")) continue;
        const box=label.closest("div")||label.parentElement;
        const strong=box?.querySelector("strong");
        const value=clean(strong?.textContent);
        if(value&&value!=="-") return value;
      }

      const lots=knownLots();
      const strongValues=Array.from(info.querySelectorAll("strong")).map(node=>clean(node.textContent)).filter(Boolean);
      for(const value of strongValues){
        const exact=lots.find(lot=>lot===value);
        if(exact) return exact;
      }
    }

    const lots=knownLots();
    const visibleText=clean(scope.textContent);
    const visibleMatches=lots.filter(lot=>lot&&visibleText.includes(lot));
    if(visibleMatches.length===1) return visibleMatches[0];

    const selects=Array.from(scope.querySelectorAll("select"));
    for(const select of selects){
      const value=clean(select.value);
      if(value&&lots.includes(value)) return value;
    }
    return "";
  }

  function ensureStyle(){
    if(document.getElementById("qmes-process-remark-click-hotfix-style-20260827")) return;
    const style=document.createElement("style");
    style.id="qmes-process-remark-click-hotfix-style-20260827";
    style.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.42)!important}
      #${MODAL_ID} .qpr-card{width:min(560px,94vw)!important;border:0!important;outline:0!important;border-radius:12px!important;background:#fff!important;box-shadow:0 24px 70px rgba(15,23,42,.28)!important;overflow:hidden!important;color:#0f172a!important}
      #${MODAL_ID} .qpr-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:15px 17px!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important}
      #${MODAL_ID} .qpr-head b{color:#0f172a!important;font-size:16px!important;font-weight:900!important}
      #${MODAL_ID} .qpr-head button{border:0!important;background:transparent!important;color:#64748b!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
      #${MODAL_ID} .qpr-body{padding:17px!important}
      #${MODAL_ID} .qpr-meta{margin-bottom:9px!important;color:#475569!important;font-size:11px!important;font-weight:800!important}
      #${MODAL_ID} textarea{box-sizing:border-box!important;width:100%!important;min-height:120px!important;padding:11px 12px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:13px!important;line-height:1.5!important;resize:vertical!important;outline:none!important;box-shadow:none!important}
      #${MODAL_ID} .qpr-error{display:none!important;margin-top:9px!important;color:#b91c1c!important;font-size:11px!important;font-weight:800!important}
      #${MODAL_ID} .qpr-error.show{display:block!important}
      #${MODAL_ID} .qpr-foot{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:12px 17px!important;border-top:1px solid #e2e8f0!important;background:#f8fafc!important}
      #${MODAL_ID} .qpr-foot button{height:36px!important;min-width:76px!important;padding:0 14px!important;border-radius:7px!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
      #${MODAL_ID} .qpr-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}
      #${MODAL_ID} .qpr-save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
    `;
    document.head.appendChild(style);
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove();}

  async function fetchProcess(lot){
    const response=await fetch(API,{credentials:"same-origin"});
    const payload=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||payload.success===false) throw new Error(payload.message||"공정 데이터를 불러오지 못했습니다.");
    const rows=Array.isArray(payload.data)?payload.data:[];
    return rows.find(row=>clean(row?.record_key)===`process:${lot}`)?.payload||null;
  }

  async function saveRemark(lot,rowIndex,remark){
    const current=await fetchProcess(lot);
    if(!current||!Array.isArray(current.steps)) throw new Error("저장된 생산공정 데이터를 찾지 못했습니다.");
    if(!current.steps[rowIndex]) throw new Error("선택한 공정 행을 찾지 못했습니다.");
    const steps=current.steps.map((step,index)=>index===rowIndex?{...step,remark:clean(remark)}:step);
    const stepKey=String(steps[rowIndex]?.no??rowIndex+1);
    saveLocalNote(lot,stepKey,remark);
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    const next={...current,steps,updatedAt:new Date().toISOString(),updatedBy:clean(user?.name||user?.uid)||"사용자"};
    const response=await fetch(API,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:`process:${lot}`,payload:next})});
    const result=await response.json().catch(()=>({success:false}));
    if(!response.ok||result.success===false) throw new Error(result.message||"비고 저장에 실패했습니다.");
    return {next,stepKey};
  }

  function updateCell(cell,note,lot){
    if(!cell) return;
    const value=clean(note);
    cell.dataset.remark=value;
    if(lot) cell.dataset.qmesLot=lot;
    cell.title=value;
    const text=cell.querySelector(".qmes-process-remark-text");
    if(text){text.textContent=value;text.classList.toggle("is-empty",!value);}
  }

  function openForButton(button){
    ensureStyle();
    const cell=button.closest(".qmes-process-remark-cell");
    const row=button.closest("tbody tr");
    const table=button.closest("table.qpp-table")||button.closest("table");
    const card=button.closest(".qpp-card");
    const rows=Array.from(table?.querySelectorAll("tbody tr")||[]);
    const rowIndex=rows.indexOf(row);
    if(rowIndex<0||!row){window.alert("수정할 공정 행을 찾지 못했습니다.");return;}

    const lot=clean(cell?.dataset.qmesLot)||resolveCurrentLot();
    if(cell&&lot) cell.dataset.qmesLot=lot;
    const stepNo=clean(row.children?.[0]?.textContent)||String(rowIndex+1);
    const stepName=clean(row.children?.[1]?.textContent)||"공정";
    const current=clean(cell?.dataset.remark);

    closeModal();
    const modal=document.createElement("div");
    modal.id=MODAL_ID;
    modal.innerHTML=`<div class="qpr-card" role="dialog" aria-modal="true" aria-label="공정 비고 수정"><div class="qpr-head"><b>비고 수정</b><button type="button" class="qpr-close">닫기</button></div><div class="qpr-body"><div class="qpr-meta">${esc(lot||"LOT 확인 필요")} · ${esc(stepNo)} · ${esc(stepName)}</div><textarea maxlength="500" placeholder="공정 비고를 입력하세요.">${esc(current)}</textarea><div class="qpr-error${lot?"":" show"}">${lot?"":"LOT No.를 확인하지 못했습니다. 화면의 LOT 정보를 확인하세요."}</div></div><div class="qpr-foot"><button type="button" class="qpr-cancel">취소</button><button type="button" class="qpr-save"${lot?"":" disabled"}>저장</button></div></div>`;
    modal.addEventListener("click",event=>{if(event.target===modal||event.target.closest(".qpr-close,.qpr-cancel"))closeModal();});
    modal.querySelector(".qpr-save")?.addEventListener("click",async()=>{
      const saveButton=modal.querySelector(".qpr-save");
      const textarea=modal.querySelector("textarea");
      const error=modal.querySelector(".qpr-error");
      if(!lot) return;
      saveButton.disabled=true;saveButton.textContent="저장 중";error.classList.remove("show");
      try{
        const note=clean(textarea.value);
        await saveRemark(lot,rowIndex,note);
        updateCell(cell,note,lot);
        try{window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{lot,type:"remark",stepNo}}));}catch(_error){}
        closeModal();
      }catch(saveError){
        error.textContent=saveError?.message||"비고 저장에 실패했습니다.";
        error.classList.add("show");
        saveButton.disabled=false;saveButton.textContent="저장";
      }
    });
    document.body.appendChild(modal);
    setTimeout(()=>modal.querySelector("textarea")?.focus(),0);
  }

  /* Capture phase: this runs before row React handlers and before old button listeners. */
  document.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element)) return;
    const button=target.closest(".qmes-process-remark-inline-btn");
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openForButton(button);
  },true);

  function stampLots(){
    const lot=resolveCurrentLot();
    if(!lot) return;
    document.querySelectorAll(".qpp-card .qmes-process-remark-cell").forEach(cell=>{cell.dataset.qmesLot=lot;});
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(stampLots));
  function start(){ensureStyle();stampLots();observer.observe(document.body,{childList:true,subtree:true});setTimeout(stampLots,300);setTimeout(stampLots,900);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
