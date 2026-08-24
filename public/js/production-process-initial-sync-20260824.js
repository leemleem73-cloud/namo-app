/* QMES production-process initial sync - 2026-08-24
 * The production-process React screen can mount before the linkage helper is loaded.
 * In that case the first LOT list is built from raw shared workorder rows and can
 * briefly show old LOTs as '품목 미지정'. Once the linkage helper has replaced
 * qmesProcessFetchSyncRows, refresh the screen exactly once so the first usable
 * view already uses the normalized/deleted-filtered work-order data.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_PROCESS_INITIAL_SYNC_20260824__) return;
  window.__QMES_PRODUCTION_PROCESS_INITIAL_SYNC_20260824__=true;

  const clean=value=>String(value==null?"":value).trim();
  const syncedRoots=new WeakSet();
  let scheduled=false;

  function findRefresh(root){
    return Array.from(root.querySelectorAll(".qpp-toolbar button")).find(button=>clean(button.textContent)==="새로고침")||null;
  }

  function finish(root){
    root.removeAttribute("data-qmes-initial-syncing");
    root.dispatchEvent(new CustomEvent("qmes:production-process-initial-sync-complete",{bubbles:true}));
  }

  function refreshOnce(root){
    if(!root||syncedRoots.has(root)) return;
    const select=root.querySelector(".qpp-toolbar .qpp-select");
    const refresh=findRefresh(root);
    if(!select||!refresh) return;

    /* Mark before clicking so React re-renders cannot schedule a duplicate refresh. */
    syncedRoots.add(root);
    root.setAttribute("data-qmes-initial-syncing","1");

    let waitCount=0;
    const waitUntilReady=()=>{
      const liveRefresh=findRefresh(root);
      if(!document.documentElement.contains(root)){return;}
      if(!liveRefresh){
        if(waitCount++<80) return setTimeout(waitUntilReady,25);
        finish(root);
        return;
      }
      if(liveRefresh.disabled){
        if(waitCount++<120) return setTimeout(waitUntilReady,25);
        finish(root);
        return;
      }

      liveRefresh.click();

      /* Let React finish the normalized load. No second manual click is required. */
      let settleCount=0;
      const settle=()=>{
        if(!document.documentElement.contains(root)) return;
        const currentRefresh=findRefresh(root);
        const currentSelect=root.querySelector(".qpp-toolbar .qpp-select");
        const stillBusy=!!currentRefresh?.disabled;
        const hasUnknown=Array.from(currentSelect?.options||[]).some(option=>clean(option.textContent).includes("품목 미지정"));
        if((stillBusy||hasUnknown)&&settleCount++<100){
          setTimeout(settle,30);
          return;
        }
        finish(root);
      };
      setTimeout(settle,30);
    };
    waitUntilReady();
  }

  function scan(){
    scheduled=false;
    document.querySelectorAll(".qmes-prod-process").forEach(refreshOnce);
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(scan);
  }

  const observer=new MutationObserver(schedule);
  const start=()=>{
    scan();
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("focus",schedule);
    window.addEventListener("qmes:production-process-ready",schedule);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
