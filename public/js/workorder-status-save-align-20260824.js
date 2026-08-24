/* QMES work-order issued list: remove explicit status save button, 2026-08-24 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_STATUS_SAVE_REMOVE_20260824__) return;
  window.__QMES_WORKORDER_STATUS_SAVE_REMOVE_20260824__=true;

  const style=document.createElement("style");
  style.id="qmes-workorder-status-save-remove-style-20260824";
  style.textContent=`
    .qmes-wo-status-save-btn{display:none!important;}
    .qmes-issued-table-v2{table-layout:fixed!important;width:100%!important;min-width:0!important;max-width:100%!important;}
    .qmes-issued-table-v2 th:nth-child(10),.qmes-issued-table-v2 td:nth-child(10){
      width:82px!important;min-width:0!important;max-width:82px!important;
      padding-left:3px!important;padding-right:3px!important;text-align:center!important;overflow:hidden!important;
    }
    .qmes-issued-table-v2 td:nth-child(10) .qmes-status-select{
      display:block!important;box-sizing:border-box!important;width:74px!important;min-width:0!important;max-width:100%!important;
      height:28px!important;margin:0 auto!important;padding:0 18px 0 5px!important;font-size:10px!important;line-height:26px!important;text-align:center!important;
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function cleanup(){
    document.querySelectorAll(".qmes-wo-status-save-btn").forEach(button=>button.remove());
    document.querySelectorAll(".qmes-issued-table-v2 tbody tr").forEach(row=>{
      row.querySelectorAll(".qmes-manage-btn.view").forEach(button=>button.remove());
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;cleanup();});
  }
  const observer=new MutationObserver(schedule);
  const start=()=>{cleanup();observer.observe(document.body,{childList:true,subtree:true});window.addEventListener("qmes:data-updated",schedule);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
