/* QMES work-order issued list: explicit status save + stable alignment, 2026-08-24 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_STATUS_SAVE_ALIGN_20260824__) return;
  window.__QMES_WORKORDER_STATUS_SAVE_ALIGN_20260824__=true;

  const pending=new Map();
  const clean=v=>String(v==null?"":v).trim();

  function lotFromRow(row){
    return clean(row?.querySelector("td:first-child")?.textContent).split(/\s+/)[0];
  }

  function statusCellFor(select){
    return select?.closest("td")||null;
  }

  function saveButtonFor(select){
    return statusCellFor(select)?.querySelector(".qmes-wo-status-save-btn")||null;
  }

  function markPending(select,lot,status){
    pending.set(lot,status);
    select.dataset.qmesPendingStatus=status;
    const button=saveButtonFor(select);
    if(button){
      button.classList.add("is-dirty");
      button.textContent="저장";
      button.disabled=false;
      button.title=`${lot} 상태 저장`;
    }
  }

  function addSaveButton(row){
    const select=row.querySelector(".qmes-status-select");
    if(!select) return;
    const lot=lotFromRow(row);
    if(!lot) return;
    const cell=statusCellFor(select);
    if(!cell) return;

    let button=cell.querySelector(".qmes-wo-status-save-btn");
    if(!button){
      button=document.createElement("button");
      button.type="button";
      button.className="qmes-wo-status-save-btn";
      button.textContent="저장";
      button.dataset.lot=lot;
      button.title=`${lot} 상태 저장`;
      cell.appendChild(button);
    }else{
      button.dataset.lot=lot;
    }

    if(pending.has(lot)){
      const next=pending.get(lot);
      if(clean(select.value)!==next) select.value=next;
      select.dataset.qmesPendingStatus=next;
      button.classList.add("is-dirty");
    }else{
      button.classList.remove("is-dirty");
    }
  }

  function apply(){
    document.querySelectorAll(".qmes-issued-table-v2 tbody tr").forEach(addSaveButton);
  }

  async function persistStatus(button){
    const row=button.closest("tr");
    const select=row?.querySelector(".qmes-status-select");
    const lot=button.dataset.lot||lotFromRow(row);
    const status=clean(pending.get(lot)||select?.value);
    if(!lot||!status) return;

    button.disabled=true;
    button.textContent="저장중";
    try{
      if(typeof window.saveWoManualStatus!=="function" && typeof saveWoManualStatus!=="function"){
        throw new Error("작업지시 상태 저장 기능을 찾지 못했습니다.");
      }
      const saveFn=typeof window.saveWoManualStatus==="function"?window.saveWoManualStatus:saveWoManualStatus;
      saveFn(lot,status);

      /* 기존 함수도 공용 동기화를 호출하지만, 저장 버튼은 완료 여부를 직접 확인한다. */
      const syncFn=typeof window.qmesSyncWorkOrder==="function"?window.qmesSyncWorkOrder:(typeof qmesSyncWorkOrder==="function"?qmesSyncWorkOrder:null);
      if(syncFn) await syncFn(lot);

      pending.delete(lot);
      if(select) delete select.dataset.qmesPendingStatus;
      button.classList.remove("is-dirty");
      button.classList.add("is-saved");
      button.textContent="저장됨";
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{type:"workorder-status",lot,status}}));
      setTimeout(()=>{
        button.classList.remove("is-saved");
        button.textContent="저장";
        button.disabled=false;
      },900);
    }catch(error){
      button.disabled=false;
      button.classList.add("is-dirty");
      button.textContent="저장";
      console.error("[QMES 작업지시] 상태 저장 실패",error);
      window.alert(`상태는 이 PC에 반영됐지만 공용 DB 저장을 확인하지 못했습니다.\n${error?.message||error}`);
    }
  }

  /* React의 기존 즉시저장 onChange보다 먼저 잡아서, 선택 후 [저장]을 눌러 확정한다. */
  document.addEventListener("change",event=>{
    const select=event.target?.closest?.(".qmes-issued-table-v2 .qmes-status-select");
    if(!select) return;
    const row=select.closest("tr");
    const lot=lotFromRow(row);
    if(!lot) return;
    event.stopPropagation();
    markPending(select,lot,clean(select.value));
  },true);

  document.addEventListener("click",event=>{
    const button=event.target?.closest?.(".qmes-wo-status-save-btn");
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    persistStatus(button);
  },true);

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  }

  const observer=new MutationObserver(schedule);
  const start=()=>{
    apply();
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("qmes:data-updated",schedule);
    window.addEventListener("focus",schedule);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
