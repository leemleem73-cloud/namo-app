/* QMES production-process initial sync - 2026-08-24 v2
 * Ensures the first production-process view uses the same normalized work-order
 * list as the manual Refresh button. It waits for the linkage helper and, if a
 * stale raw load wins a race, refreshes again until '품목 미지정' rows disappear.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_PROCESS_INITIAL_SYNC_20260824_V2__) return;
  window.__QMES_PRODUCTION_PROCESS_INITIAL_SYNC_20260824_V2__=true;

  const clean=value=>String(value==null?"":value).trim();
  const stateByRoot=new WeakMap();
  let scheduled=false;

  function findRefresh(root){
    return Array.from(root.querySelectorAll(".qpp-toolbar button")).find(button=>clean(button.textContent)==="새로고침")||null;
  }

  function findSelect(root){
    return root.querySelector(".qpp-toolbar .qpp-select");
  }

  function hasStaleOptions(root){
    const select=findSelect(root);
    if(!select) return true;
    return Array.from(select.options||[]).some(option=>clean(option.textContent).includes("품목 미지정"));
  }

  function markDone(root){
    const state=stateByRoot.get(root)||{};
    state.done=true;
    state.running=false;
    stateByRoot.set(root,state);
    root.removeAttribute("data-qmes-initial-syncing");
    try{root.dispatchEvent(new CustomEvent("qmes:production-process-initial-sync-complete",{bubbles:true}));}catch(_error){}
  }

  function waitForIdle(root,callback,limit=160){
    let count=0;
    const tick=()=>{
      if(!document.documentElement.contains(root)) return;
      const refresh=findRefresh(root);
      if(refresh&&!refresh.disabled){callback(refresh);return;}
      if(count++<limit){setTimeout(tick,25);return;}
      callback(refresh||null);
    };
    tick();
  }

  function normalizeRoot(root){
    if(!root) return;
    const existing=stateByRoot.get(root)||{attempts:0,running:false,done:false};
    if(existing.running||existing.done) return;
    if(!findSelect(root)||!findRefresh(root)) return;

    existing.running=true;
    stateByRoot.set(root,existing);
    root.setAttribute("data-qmes-initial-syncing","1");

    const waitForLinkFix=()=>{
      const state=stateByRoot.get(root)||existing;
      if(!document.documentElement.contains(root)) return;
      if(window.__QMES_PRODUCTION_PROCESS_LINK_FIX_20260824__||state.linkWait>=120){
        runAttempt();
        return;
      }
      state.linkWait=(state.linkWait||0)+1;
      stateByRoot.set(root,state);
      setTimeout(waitForLinkFix,25);
    };

    const runAttempt=()=>{
      waitForIdle(root,refresh=>{
        if(!refresh){markDone(root);return;}
        const state=stateByRoot.get(root)||existing;
        state.attempts=(state.attempts||0)+1;
        stateByRoot.set(root,state);

        /* This is intentionally the exact same React onClick path as the user's
         * manual Refresh button, but performed automatically after the helper is ready. */
        refresh.click();

        waitForIdle(root,()=>{
          if(!document.documentElement.contains(root)) return;
          const stale=hasStaleOptions(root);
          const latest=stateByRoot.get(root)||state;
          if(stale&&latest.attempts<5){
            /* A previous raw request may have completed after our first refresh.
             * Retry after a short settle; this removes the need for a manual click. */
            setTimeout(runAttempt,180);
            return;
          }
          markDone(root);
        },200);
      },200);
    };

    waitForLinkFix();
  }

  function scan(){
    scheduled=false;
    document.querySelectorAll(".qmes-prod-process").forEach(root=>{
      const state=stateByRoot.get(root);
      /* If a finished root somehow receives stale options again, allow one new cycle. */
      if(state?.done&&hasStaleOptions(root)) stateByRoot.set(root,{attempts:0,running:false,done:false});
      normalizeRoot(root);
    });
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
    window.addEventListener("qmes:mes-master-ready",schedule);
    window.addEventListener("qmes:production-process-updated",schedule);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
