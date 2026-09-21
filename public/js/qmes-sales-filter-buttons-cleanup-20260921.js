/* QMES Sales filter button cleanup - 2026-09-21
 * ADD-ONLY patch.
 * - Removes the leading symbol from the Search button.
 * - Hides the Reset button.
 * - Reflows the filter grid so no empty button column remains.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FILTER_BUTTONS_CLEANUP_20260921__) return;
  window.__QMES_SALES_FILTER_BUTTONS_CLEANUP_20260921__=true;

  const STYLE_ID="qmes-sales-filter-buttons-cleanup-20260921-style";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Remove the Reset button from the current Sales filter bar. */
      .qmes-sales-ledger-v4 .qrl-grid > button:not(.primary){
        display:none!important;
      }

      /* Seven visible columns: period + 5 filters + search button. */
      @media (min-width:1281px){
        .qmes-sales-ledger-v4 .qrl-grid{
          grid-template-columns:
            minmax(310px,1.35fr)
            minmax(115px,.55fr)
            minmax(175px,.85fr)
            minmax(110px,.55fr)
            minmax(110px,.55fr)
            minmax(200px,1.15fr)
            64px!important;
        }
      }

      @media (min-width:761px) and (max-width:1280px){
        .qmes-sales-ledger-v4 .qrl-grid{
          grid-template-columns:
            minmax(280px,1.25fr)
            minmax(105px,.55fr)
            minmax(165px,.85fr)
            minmax(105px,.55fr)
            minmax(105px,.55fr)
            minmax(185px,1.1fr)
            64px!important;
        }
      }

      .qmes-sales-ledger-v4 .qrl-grid > button.primary{
        width:64px!important;
      }
    `;
    document.head.appendChild(style);
  }

  function cleanSearchButton(){
    document.querySelectorAll(".qmes-sales-ledger-v4 .qrl-grid > button.primary").forEach(button=>{
      if(button.textContent!=="조회") button.textContent="조회";
      button.setAttribute("aria-label","조회");
    });
  }

  let queued=false;
  function apply(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      ensureStyle();
      cleanSearchButton();
    });
  }

  function boot(){
    apply();

    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==="childList"||record.type==="characterData")) apply();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});

    ["qmes:navigate-tab","qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(apply,0)));

    [200,700,1500,3000].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();