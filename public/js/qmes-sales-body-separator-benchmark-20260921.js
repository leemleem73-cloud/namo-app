/* QMES Sales body separator benchmark style - 2026-09-21
 * ADD-ONLY visual patch.
 * Adds subtle vertical separators through tbody cells so header/body columns read as one grid.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_BODY_SEPARATOR_BENCHMARK_20260921__) return;
  window.__QMES_SALES_BODY_SEPARATOR_BENCHMARK_20260921__=true;

  function ensureStyle(){
    if(document.getElementById("qmes-sales-body-separator-benchmark-20260921-style")) return;

    const style=document.createElement("style");
    style.id="qmes-sales-body-separator-benchmark-20260921-style";
    style.textContent=`
      .qmes-sales-ledger-v4 tbody td{
        border-right:1px solid rgba(110,142,166,.22)!important;
      }

      .qmes-sales-ledger-v4 tbody td:last-child{
        border-right:0!important;
      }

      .qmes-sales-ledger-v4 tbody tr:hover td{
        border-right-color:rgba(110,142,166,.28)!important;
      }

      .qmes-sales-ledger-v4 tbody tr:hover td:last-child{
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