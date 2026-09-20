/* QMES Sales header separator benchmark style - 2026-09-21
 * ADD-ONLY visual patch.
 * Refines the sales ledger header separators to a subtle ERP/MES-style divider.
 * Drag resize hit areas remain active.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_HEADER_SEPARATOR_BENCHMARK_20260921__) return;
  window.__QMES_SALES_HEADER_SEPARATOR_BENCHMARK_20260921__=true;

  function ensureStyle(){
    if(document.getElementById("qmes-sales-header-separator-benchmark-20260921-style")) return;

    const style=document.createElement("style");
    style.id="qmes-sales-header-separator-benchmark-20260921-style";
    style.textContent=`
      .qmes-sales-ledger-v4 thead th{
        border-right:1px solid rgba(255,255,255,.22)!important;
        border-bottom:1px solid rgba(60,110,145,.50)!important;
        box-shadow:inset -1px 0 0 rgba(55,100,132,.20)!important;
      }

      .qmes-sales-ledger-v4 thead th:last-child{
        border-right:0!important;
        box-shadow:none!important;
      }

      /* Keep drag-resize available without drawing a second visible line. */
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer{
        background:transparent!important;
        border:0!important;
        opacity:1!important;
      }

      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer::after,
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer:hover::after,
      body.qmes-sales-column-resizing .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer.active::after{
        width:0!important;
        background:transparent!important;
        opacity:0!important;
      }
    `;

    document.head.appendChild(style);
  }

  function boot(){
    ensureStyle();
    [200,700,1500,3000].forEach(ms=>setTimeout(ensureStyle,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();