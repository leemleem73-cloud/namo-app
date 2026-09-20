/* QMES Sales header separator strong visibility patch - 2026-09-21
 * ADD-ONLY visual patch.
 * Keeps column resize dragging but makes header separators clearly visible.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_HEADER_SEPARATOR_STRONG_20260921__) return;
  window.__QMES_SALES_HEADER_SEPARATOR_STRONG_20260921__=true;

  function ensureStyle(){
    if(document.getElementById("qmes-sales-header-separator-strong-20260921-style")) return;

    const style=document.createElement("style");
    style.id="qmes-sales-header-separator-strong-20260921-style";
    style.textContent=`
      .qmes-sales-ledger-v4 thead th{
        border-right:2px solid rgba(45,95,130,.92)!important;
        box-shadow:inset -1px 0 0 rgba(255,255,255,.12)!important;
      }

      .qmes-sales-ledger-v4 thead th:last-child{
        border-right:0!important;
        box-shadow:none!important;
      }

      /* Resize hit area remains active, but no extra white line is drawn. */
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer,
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer::after,
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer:hover::after,
      body.qmes-sales-column-resizing .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer.active::after{
        background:transparent!important;
        border:0!important;
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