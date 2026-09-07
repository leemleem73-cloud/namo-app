/* Work-order legacy artifact cleanup — 2026-09-07.
 * Removes only stale DOM mutations left by older cached work-order patches.
 * Native production.jsx remains the owner of row data and layout.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_LEGACY_ARTIFACT_CLEANUP_20260907__) return;
  window.__QMES_WORKORDER_LEGACY_ARTIFACT_CLEANUP_20260907__=true;

  function cleanRow(row){
    const cells=row?.querySelectorAll?.("td");
    if(!cells||cells.length<5) return;

    const itemButton=cells[1]?.querySelector("button");
    if(itemButton){
      const text=String(itemButton.textContent||"").trim();
      if(text==="절연슬러리(NBA20-HM01) / DBA1501"||text==="절연슬러리(NBA20-HM01)"){
        itemButton.textContent="DBA1501";
        itemButton.title="DBA1501";
      }
    }

    const actual=String(cells[4]?.textContent||"").trim();
    if(actual==="실적 미입력"){
      cells[4].textContent="—";
      cells[4].removeAttribute("title");
    }
  }

  function cleanup(){
    document.querySelectorAll(".qmes-issued-table-v2 tbody tr").forEach(cleanRow);
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;cleanup();});
  }

  function start(){
    cleanup();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener("qmes:data-updated",schedule);
    window.addEventListener("focus",schedule);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
