/* QMES refresh layout prelock - 2026-09-21
 * ADD-ONLY startup stabilizer.
 * Prevents F5 from briefly/incorrectly using the old 236px shell width
 * while the saved ERP sidebar width is already smaller.
 * Does not reset the user's saved sidebar width.
 */
(function(){
  "use strict";
  if(window.__QMES_REFRESH_LAYOUT_PRELOCK_20260921_V1__) return;
  window.__QMES_REFRESH_LAYOUT_PRELOCK_20260921_V1__=true;

  const SIDE_KEY="qmes-erp-sidebar-width-v1";
  const STYLE_ID="qmes-refresh-layout-prelock-20260921-v1-style";
  const MIN_SIDE=120;
  const MAX_SIDE=420;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function savedWidth(){
    try{
      const n=Number(localStorage.getItem(SIDE_KEY));
      return Number.isFinite(n)?clamp(Math.round(n),MIN_SIDE,MAX_SIDE):120;
    }catch(_){
      return 120;
    }
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar{
        width:var(--qmes-shell-sidebar-width,120px)!important;
      }
      html body:not(.qmes-erp-menu-closed) #qmes-erp-header .qmes-erp-header-brand{
        width:var(--qmes-shell-sidebar-width,120px)!important;
        min-width:var(--qmes-shell-sidebar-width,120px)!important;
        max-width:var(--qmes-shell-sidebar-width,120px)!important;
        flex:0 0 var(--qmes-shell-sidebar-width,120px)!important;
      }
      html body:not(.qmes-erp-menu-closed) #root>div>main{
        margin-left:var(--qmes-shell-sidebar-width,120px)!important;
        width:calc(100% - var(--qmes-shell-sidebar-width,120px))!important;
      }
      html body.qmes-erp-menu-closed #root>div>main{
        margin-left:0!important;
        width:100%!important;
      }
    `;
    document.head.appendChild(s);
  }

  function apply(){
    ensureStyle();
    const width=savedWidth();
    document.documentElement.style.setProperty("--qmes-shell-sidebar-width",width+"px");

    const side=document.getElementById("qmes-erp-sidebar");
    const brand=document.querySelector("#qmes-erp-header .qmes-erp-header-brand");
    const main=document.querySelector("#root>div>main");
    const closed=document.body?.classList?.contains("qmes-erp-menu-closed");

    if(side&&!closed){
      side.style.setProperty("width",width+"px","important");
    }

    if(brand&&!closed){
      brand.style.setProperty("width",width+"px","important");
      brand.style.setProperty("min-width",width+"px","important");
      brand.style.setProperty("max-width",width+"px","important");
      brand.style.setProperty("flex","0 0 "+width+"px","important");
    }

    if(main){
      if(closed){
        main.style.setProperty("margin-left","0","important");
        main.style.setProperty("width","100%","important");
      }else{
        main.style.setProperty("margin-left",width+"px","important");
        main.style.setProperty("width","calc(100% - "+width+"px)","important");
      }
    }
  }

  ensureStyle();
  document.documentElement.style.setProperty("--qmes-shell-sidebar-width",savedWidth()+"px");

  function boot(){
    apply();

    const observer=new MutationObserver(records=>{
      let relevant=false;
      for(const record of records){
        for(const node of record.addedNodes||[]){
          if(!(node instanceof Element)) continue;
          if(
            node.id==="qmes-erp-sidebar" ||
            node.id==="qmes-erp-header" ||
            node.matches?.("#root>div>main") ||
            node.querySelector?.("#qmes-erp-sidebar,#qmes-erp-header,#root>div>main")
          ){
            relevant=true;
            break;
          }
        }
        if(relevant) break;
      }
      if(relevant) requestAnimationFrame(apply);
    });

    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("pageshow",()=>requestAnimationFrame(apply),{passive:true});
    window.addEventListener("load",()=>requestAnimationFrame(apply),{once:true});
    window.addEventListener("storage",event=>{
      if(event.key===SIDE_KEY) requestAnimationFrame(apply);
    });

    [0,80,200,500,1200].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();