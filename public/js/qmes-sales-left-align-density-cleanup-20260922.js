/* QMES Sales left-align + row-density label cleanup - 2026-09-22
 * ADD-ONLY patch. Existing Sales files remain untouched.
 * - Hides the "줄간격" control requested for removal.
 * - Keeps the Sales main area aligned to the ACTUAL visible sidebar width.
 *   This prevents the ledger from staying shifted right when the sidebar is resized.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_LEFT_ALIGN_DENSITY_CLEANUP_20260922__) return;
  window.__QMES_SALES_LEFT_ALIGN_DENSITY_CLEANUP_20260922__=true;

  const STYLE_ID="qmes-sales-left-align-density-cleanup-20260922-style";
  const MARK="qmesSalesLeftAlign20260922";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      /* Requested removal: do not show the row-spacing wording/button. */
      #qmes-sales-row-density-20260921-v1{
        display:none!important;
        visibility:hidden!important;
      }

      /* Sales ledger should use the full main workspace after sidebar alignment. */
      .qmes-sales-ledger-v4{
        width:100%!important;
        max-width:none!important;
        margin-left:0!important;
        margin-right:0!important;
      }
    `;
    document.head.appendChild(s);
  }

  function sidebarWidth(){
    if(document.body.classList.contains("qmes-erp-menu-closed")) return 0;
    const side=document.getElementById("qmes-erp-sidebar");
    if(!side || side.hidden) return 0;
    const cs=getComputedStyle(side);
    const rect=side.getBoundingClientRect();
    if(cs.display==="none" || cs.visibility==="hidden" || rect.width<=0) return 0;
    return Math.max(0,Math.round(rect.width));
  }

  function restoreMain(main){
    if(!main || main.dataset[MARK]!=="1") return;
    main.style.removeProperty("margin-left");
    main.style.removeProperty("width");
    delete main.dataset[MARK];
  }

  function apply(){
    ensureStyle();

    const main=document.querySelector("#root>div>main");
    const sales=document.querySelector(".qmes-sales-ledger-v4");
    if(!main) return;

    if(!sales){
      restoreMain(main);
      return;
    }

    const width=sidebarWidth();
    main.style.setProperty("margin-left",width+"px","important");
    main.style.setProperty("width",width>0 ? "calc(100% - "+width+"px)" : "100%","important");
    main.dataset[MARK]="1";
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;apply();});
  }

  function boot(){
    apply();

    const side=document.getElementById("qmes-erp-sidebar");
    if(side && "ResizeObserver" in window){
      try{new ResizeObserver(schedule).observe(side);}catch(_){}
    }

    const observer=new MutationObserver(records=>{
      let relevant=false;
      for(const record of records){
        if(record.type==="attributes"){
          const target=record.target;
          if(target===document.body || target===document.getElementById("qmes-erp-sidebar")){
            relevant=true;break;
          }
        }
        for(const node of record.addedNodes||[]){
          if(!(node instanceof Element)) continue;
          if(node.matches?.(".qmes-sales-ledger-v4,#qmes-erp-sidebar") ||
             node.querySelector?.(".qmes-sales-ledger-v4,#qmes-erp-sidebar")){
            relevant=true;break;
          }
        }
        for(const node of record.removedNodes||[]){
          if(!(node instanceof Element)) continue;
          if(node.matches?.(".qmes-sales-ledger-v4") ||
             node.querySelector?.(".qmes-sales-ledger-v4")){
            relevant=true;break;
          }
        }
        if(relevant) break;
      }
      if(relevant) schedule();
    });

    observer.observe(document.documentElement,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:["class","style","hidden"]
    });

    window.addEventListener("resize",schedule,{passive:true});
    ["qmes:navigate-tab","qmes:erp-integrated-ready","qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(schedule,0)));

    [100,300,700,1500].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();