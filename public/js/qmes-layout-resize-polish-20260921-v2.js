/* QMES layout resize polish V2 - 2026-09-21
 * ADD-ONLY replacement patch. Original V1 file remains untouched.
 * - One-time migration to 120px sidebar width.
 * - Preserves subsequent user drag width across refreshes.
 * - Keeps resize handles visually clean.
 */
(function(){
  "use strict";
  if(window.__QMES_LAYOUT_RESIZE_POLISH_20260921_V2__) return;
  window.__QMES_LAYOUT_RESIZE_POLISH_20260921_V2__=true;

  const SIDE_KEY="qmes-erp-sidebar-width-v1";
  const MIGRATION_KEY="qmes-erp-sidebar-width-120-migrated-v1";
  const INITIAL_WIDTH=120;

  function ensureStyle(){
    if(document.getElementById("qmes-layout-resize-polish-20260921-v2-style")) return;
    const s=document.createElement("style");
    s.id="qmes-layout-resize-polish-20260921-v2-style";
    s.textContent=`
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer::after,
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer:hover::after,
      body.qmes-sales-column-resizing .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer.active::after{
        width:0!important;
        background:transparent!important;
        opacity:0!important;
      }
      .qmes-sales-ledger-v4 thead th .qmes-sales-col-resizer{
        background:transparent!important;
        border:0!important;
      }
      #qmes-sidebar-resizer-20260921{
        background:transparent!important;
      }
    `;
    document.head.appendChild(s);
  }

  function applyWidth(width){
    const side=document.getElementById("qmes-erp-sidebar");
    const main=document.querySelector("#root>div>main");
    const brand=document.querySelector("#qmes-erp-header .qmes-erp-header-brand");
    document.documentElement.style.setProperty("--qmes-shell-sidebar-width",width+"px");
    if(side) side.style.setProperty("width",width+"px","important");
    if(brand){
      brand.style.setProperty("width",width+"px","important");
      brand.style.setProperty("min-width",width+"px","important");
      brand.style.setProperty("max-width",width+"px","important");
      brand.style.setProperty("flex","0 0 "+width+"px","important");
    }
    if(main&&!document.body.classList.contains("qmes-erp-menu-closed")){
      main.style.setProperty("margin-left",width+"px","important");
      main.style.setProperty("width","calc(100% - "+width+"px)","important");
    }
  }

  function migrateOnce(){
    try{
      if(localStorage.getItem(MIGRATION_KEY)!=="1"){
        localStorage.setItem(SIDE_KEY,String(INITIAL_WIDTH));
        localStorage.setItem(MIGRATION_KEY,"1");
        applyWidth(INITIAL_WIDTH);
      }
    }catch(_){}
  }

  function clearResizeTitle(){
    document.getElementById("qmes-sidebar-resizer-20260921")?.removeAttribute("title");
  }

  function boot(){
    ensureStyle();
    migrateOnce();
    clearResizeTitle();
    [150,500,1200,2500].forEach(ms=>setTimeout(()=>{
      ensureStyle();
      clearResizeTitle();
    },ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();