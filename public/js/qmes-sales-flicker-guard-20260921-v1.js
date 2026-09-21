/* QMES Sales flicker guard - CURRENT UI - 2026-09-21
 * Prevents the Sales ledger from flashing/blanking when React remounts the root.
 * Keeps the existing resize/layout owner; only removes the temporary visibility hide.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FLICKER_GUARD_20260921_V1__) return;
  window.__QMES_SALES_FLICKER_GUARD_20260921_V1__=true;

  const STYLE_ID="qmes-sales-flicker-guard-20260921-v1-style";

  function style(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      .qmes-sales-ledger-v4,
      .qmes-sales-ledger-v4:not([data-qmes-layout-stable-ready="1"]){
        visibility:visible!important;
        opacity:1!important;
      }

      .qmes-sales-ledger-v4,
      .qmes-sales-ledger-v4 .qrl-wrap,
      .qmes-sales-ledger-v4 table{
        animation:none!important;
        transition:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function mark(root){
    if(!(root instanceof Element)) return;
    if(root.matches(".qmes-sales-ledger-v4")){
      root.dataset.qmesLayoutStableReady="1";
      return;
    }
    root.querySelectorAll?.(".qmes-sales-ledger-v4").forEach(el=>{
      el.dataset.qmesLayoutStableReady="1";
    });
  }

  style();
  mark(document.documentElement);

  new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes||[]){
        if(node.nodeType===1) mark(node);
      }
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
})();