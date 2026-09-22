/* QMES Sales top title patch - 2026-09-22
 * ADD-ONLY. Adds the requested title above the Sales filter area.
 * Existing Sales dashboard source is not overwritten.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_TOP_TITLE_20260922_V1__) return;
  window.__QMES_SALES_TOP_TITLE_20260922_V1__=true;

  const ID="qmes-sales-top-title-20260922-v1";
  const STYLE_ID=ID+"-style";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${ID}{
        width:100%!important;
        margin:0 0 10px!important;
        padding:0 2px!important;
        box-sizing:border-box!important;
      }
      #${ID} .qmes-sales-top-title-text{
        margin:0!important;
        color:#123b58!important;
        font-size:19px!important;
        line-height:1.25!important;
        font-weight:950!important;
        letter-spacing:-.2px!important;
      }
    `;
    document.head.appendChild(s);
  }

  function apply(){
    ensureStyle();
    const root=document.querySelector(".qmes-sales-ledger-v4");
    if(!root) return;

    let title=document.getElementById(ID);
    if(!title){
      title=document.createElement("div");
      title.id=ID;
      title.innerHTML='<h1 class="qmes-sales-top-title-text">수주·납기 관리대장</h1>';
    }

    const filter=root.querySelector(".qrl-filter");
    const kpis=root.querySelector(".qsd-kpis");
    const target=filter||kpis||root.firstElementChild;

    if(title.parentElement!==root){
      if(target) root.insertBefore(title,target);
      else root.prepend(title);
    }else if(target&&title.nextElementSibling!==target){
      root.insertBefore(title,target);
    }
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  function boot(){
    apply();
    const observer=new MutationObserver(schedule);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    ["qmes:navigate-tab","qmes:erp-integrated-ready","qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(schedule,0)));
    [100,300,700,1500].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();