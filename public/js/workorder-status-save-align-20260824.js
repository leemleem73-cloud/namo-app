/* QMES work-order issued list: explicit status save + stable alignment, 2026-08-24 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_STATUS_SAVE_ALIGN_20260824_V2__) return;
  window.__QMES_WORKORDER_STATUS_SAVE_ALIGN_20260824_V2__=true;

  const style=document.createElement("style");
  style.id="qmes-workorder-status-save-align-style-20260824-v2";
  style.textContent=`
    .qmes-issued-table-v2{table-layout:fixed!important;}
    .qmes-issued-table-v2 th:nth-child(10),.qmes-issued-table-v2 td:nth-child(10){width:118px!important;min-width:118px!important;max-width:118px!important;padding-left:4px!important;padding-right:4px!important;text-align:center!important;overflow:visible!important;}
    .qmes-issued-table-v2 td:nth-child(10){white-space:nowrap!important;}
    .qmes-issued-table-v2 td:nth-child(10) .qmes-status-select{display:inline-block!important;vertical-align:middle!important;box-sizing:border-box!important;width:72px!important;min-width:72px!important;max-width:72px!important;height:28px!important;min-height:28px!important;margin:0 3px 0 0!important;padding:0 20px 0 7px!important;font-size:10px!important;line-height:26px!important;border-radius:6px!important;text-align:center!important;}
    .qmes-wo-status-save-btn{display:inline-flex!important;vertical-align:middle!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:38px!important;min-width:38px!important;max-width:38px!important;height:28px!important;min-height:28px!important;margin:0!important;padding:0 3px!important;border:1px solid #475569!important;border-radius:6px!important;background:#17263a!important;color:#cbd5e1!important;font-size:9px!important;font-weight:700!important;line-height:1!important;cursor:pointer!important;}
    .qmes-wo-status-save-btn.is-dirty{border-color:#0ea5e9!important;background:#075985!important;color:#fff!important;}
    .qmes-wo-status-save-btn.is-saved{border-color:#10b981!important;background:#065f46!important;color:#d1fae5!important;}
    .qmes-issued-table-v2 th:nth-child(11),.qmes-issued-table-v2 td:nth-child(11){width:176px!important;min-width:176px!important;max-width:176px!important;padding-left:4px!important;padding-right:4px!important;text-align:center!important;overflow:visible!important;}
    .qmes-workorder-actions{display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:4px!important;width:100%!important;white-space:nowrap!important;}
    .qmes-workorder-actions .qmes-manage-btn,.qmes-workorder-actions .qmes-production-result-shortcut{flex:0 0 auto!important;height:28px!important;min-height:28px!important;margin:0!important;padding:0 6px!important;font-size:10px!important;line-height:1!important;}
    .qmes-issued-table-v2 .qmes-manage-btn.view{display:none!important;}
    @media(max-width:1450px){
      .qmes-issued-table-v2 th:nth-child(10),.qmes-issued-table-v2 td:nth-child(10){width:108px!important;min-width:108px!important;max-width:108px!important;}
      .qmes-issued-table-v2 td:nth-child(10) .qmes-status-select{width:66px!important;min-width:66px!important;max-width:66px!important;font-size:9px!important;}
      .qmes-wo-status-save-btn{width:36px!important;min-width:36px!important;max-width:36px!important;font-size:8px!important;}
      .qmes-issued-table-v2 th:nth-child(11),.qmes-issued-table-v2 td:nth-child(11){width:160px!important;min-width:160px!important;max-width:160px!important;}
      .qmes-workorder-actions .qmes-manage-btn,.qmes-workorder-actions .qmes-production-result-shortcut{padding:0 4px!important;font-size:9px!important;}
    }
  `;
  document.head.appendChild(style);

  const pending=new Map();
  const clean=v=>String(v==null?"":v).trim();
  function lotFromRow(row){return clean(row?.querySelector("td:first-child")?.textContent).split(/\s+/)[0];}
  function statusCellFor(select){return select?.closest("td")||null;}
  function saveButtonFor(select){return statusCellFor(select)?.querySelector(".qmes-wo-status-save-btn")||null;}

  function markPending(select,lot,status){
    pending.set(lot,status);select.dataset.qmesPendingStatus=status;
    const button=saveButtonFor(select);
    if(button){button.classList.add("is-dirty");button.textContent="저장";button.disabled=false;button.title=`${lot} 상태 저장`;}
  }

  function addSaveButton(row){
    const select=row.querySelector(".qmes-status-select");if(!select)return;
    const lot=lotFromRow(row);if(!lot)return;
    const cell=statusCellFor(select);if(!cell)return;
    let button=cell.querySelector(".qmes-wo-status-save-btn");
    if(!button){button=document.createElement("button");button.type="button";button.className="qmes-wo-status-save-btn";button.textContent="저장";button.dataset.lot=lot;button.title=`${lot} 상태 저장`;cell.appendChild(button);}else button.dataset.lot=lot;
    if(pending.has(lot)){const next=pending.get(lot);if(clean(select.value)!==next)select.value=next;select.dataset.qmesPendingStatus=next;button.classList.add("is-dirty");}else button.classList.remove("is-dirty");
  }

  function removeDuplicatePreview(row){
    row.querySelectorAll(".qmes-manage-btn.view").forEach(button=>button.remove());
  }

  function apply(){document.querySelectorAll(".qmes-issued-table-v2 tbody tr").forEach(row=>{addSaveButton(row);removeDuplicatePreview(row);});}

  function saveLocalStatus(lot,status){
    if(typeof DB==="undefined") return;
    DB.woDocs=DB.woDocs||{};
    const current=DB.woDocs[lot]||{};
    const batch=(DB.batches||[]).find(item=>clean(item?.no)===lot);
    const plan=Math.max(0,Number(current.plan??batch?.plan??0));
    const actual=status==="완료"?plan:Math.max(0,Number(current.productionActual??batch?.done??0));
    DB.woDocs[lot]={...current,manualStatus:status,status,productionActual:actual,productionProgress:status==="완료"?100:(current.productionProgress||0),statusSavedAt:new Date().toISOString()};
    if(batch){batch.status=status==="생산중"||status==="검사중"?"진행중":status;if(status==="완료")batch.done=plan;batch.updatedAt=new Date().toISOString();}
    if(typeof window.dbSave==="function")window.dbSave();else if(typeof dbSave==="function")dbSave();
  }

  async function persistStatus(button){
    const row=button.closest("tr");const select=row?.querySelector(".qmes-status-select");const lot=button.dataset.lot||lotFromRow(row);const status=clean(pending.get(lot)||select?.value);if(!lot||!status)return;
    button.disabled=true;button.textContent="저장중";
    try{
      saveLocalStatus(lot,status);
      const saveFn=typeof window.saveWoManualStatus==="function"?window.saveWoManualStatus:(typeof saveWoManualStatus==="function"?saveWoManualStatus:null);
      if(saveFn)saveFn(lot,status);
      const syncFn=typeof window.qmesSyncWorkOrder==="function"?window.qmesSyncWorkOrder:(typeof qmesSyncWorkOrder==="function"?qmesSyncWorkOrder:null);
      if(syncFn)await syncFn(lot);
      pending.delete(lot);if(select)delete select.dataset.qmesPendingStatus;
      button.classList.remove("is-dirty");button.classList.add("is-saved");button.textContent="저장됨";
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{type:"workorder-status",lot,status}}));
      setTimeout(()=>{button.classList.remove("is-saved");button.textContent="저장";button.disabled=false;},900);
    }catch(error){
      /* 공용 DB가 502여도 로컬 완료 상태는 유지한다. */
      saveLocalStatus(lot,status);
      pending.delete(lot);if(select)delete select.dataset.qmesPendingStatus;
      button.disabled=false;button.classList.remove("is-dirty");button.classList.add("is-saved");button.textContent="로컬저장";
      console.warn("[QMES 작업지시] 공용 DB 상태 저장 실패 - 로컬 상태 유지",error?.message||error);
      setTimeout(()=>{button.classList.remove("is-saved");button.textContent="저장";},1200);
    }
  }

  document.addEventListener("change",event=>{const select=event.target?.closest?.(".qmes-issued-table-v2 .qmes-status-select");if(!select)return;const row=select.closest("tr");const lot=lotFromRow(row);if(!lot)return;event.stopPropagation();markPending(select,lot,clean(select.value));},true);
  document.addEventListener("click",event=>{const button=event.target?.closest?.(".qmes-wo-status-save-btn");if(!button)return;event.preventDefault();event.stopPropagation();persistStatus(button);},true);

  let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});}
  const observer=new MutationObserver(schedule);
  const start=()=>{apply();observer.observe(document.body,{childList:true,subtree:true});window.addEventListener("qmes:data-updated",schedule);window.addEventListener("focus",schedule);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
