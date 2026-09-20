/* QMES layout resize polish - 2026-09-21
 * ADD-ONLY patch.
 * - Starts the left ERP menu at the current minimum width (180px).
 * - Keeps drag resizing available.
 * - Hides white column separator lines while preserving invisible drag handles.
 */
(function(){
  "use strict";
  if(window.__QMES_LAYOUT_RESIZE_POLISH_20260921__) return;
  window.__QMES_LAYOUT_RESIZE_POLISH_20260921__=true;

  const SIDE_KEY="qmes-erp-sidebar-width-v1";
  const SIDE_WIDTH=180;

  function ensureStyle(){
    if(document.getElementById("qmes-layout-resize-polish-20260921-style")) return;
    const s=document.createElement("style");
    s.id="qmes-layout-resize-polish-20260921-style";
    s.textContent=`
      /* Header column dividers: hidden for a cleaner ledger appearance. */
      .qmes-sales-ledger-v4 thead th{
        border-right:0!important;
      }
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer::after,
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer:hover::after,
      body.qmes-sales-column-resizing .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer.active::after{
        width:0!important;
        background:transparent!important;
        opacity:0!important;
      }

      /* Keep the hit-area for drag resize without showing a white line. */
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer{
        background:transparent!important;
        border:0!important;
      }
    `;
    document.head.appendChild(s);
  }

  function applySidebarMinimum(){
    try{localStorage.setItem(SIDE_KEY,String(SIDE_WIDTH));}catch(_){}

    const side=document.getElementById("qmes-erp-sidebar");
    const main=document.querySelector("#root>div>main");
    const brand=document.querySelector("#qmes-erp-header .qmes-erp-header-brand");

    document.documentElement.style.setProperty("--qmes-shell-sidebar-width",SIDE_WIDTH+"px");

    if(side){
      side.style.setProperty("width",SIDE_WIDTH+"px","important");
    }
    if(brand){
      brand.style.setProperty("width",SIDE_WIDTH+"px","important");
      brand.style.setProperty("min-width",SIDE_WIDTH+"px","important");
      brand.style.setProperty("max-width",SIDE_WIDTH+"px","important");
      brand.style.setProperty("flex","0 0 "+SIDE_WIDTH+"px","important");
    }
    if(main&&!document.body.classList.contains("qmes-erp-menu-closed")){
      main.style.setProperty("margin-left",SIDE_WIDTH+"px","important");
      main.style.setProperty("width","calc(100% - "+SIDE_WIDTH+"px)","important");
    }
  }

  function boot(){
    ensureStyle();
    applySidebarMinimum();

    [150,500,1200,2500].forEach(ms=>setTimeout(()=>{
      ensureStyle();
      applySidebarMinimum();
    },ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();