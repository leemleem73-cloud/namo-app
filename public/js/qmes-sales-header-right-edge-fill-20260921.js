/* QMES Sales header right-edge fill - 2026-09-21
 * ADD-ONLY visual patch.
 * Extends the existing header blue behind any small right-side gap after the last column.
 * Does not change table data, column sizing, or drag-resize behavior.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_HEADER_RIGHT_EDGE_FILL_20260921__) return;
  window.__QMES_SALES_HEADER_RIGHT_EDGE_FILL_20260921__=true;

  function ensureStyle(){
    if(document.getElementById("qmes-sales-header-right-edge-fill-20260921-style")) return;

    const style=document.createElement("style");
    style.id="qmes-sales-header-right-edge-fill-20260921-style";
    style.textContent=`
      .qmes-sales-ledger-v4 .qrl-wrap{
        background-color:#fff!important;
        background-image:linear-gradient(180deg,#74afd3 0%,#5e99c0 100%)!important;
        background-repeat:no-repeat!important;
        background-position:0 0!important;
        background-size:100% 40px!important;
      }

      .qmes-sales-ledger-v4 thead th:last-child{
        border-right:0!important;
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