/* QMES Sales date field width fix - 2026-09-21
 * ADD-ONLY visual patch.
 * Ensures YYYY-MM-DD is fully visible in both period date inputs.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DATE_FIELD_WIDTH_FIX_20260921__) return;
  window.__QMES_SALES_DATE_FIELD_WIDTH_FIX_20260921__=true;

  function ensureStyle(){
    if(document.getElementById("qmes-sales-date-field-width-fix-20260921-style")) return;

    const style=document.createElement("style");
    style.id="qmes-sales-date-field-width-fix-20260921-style";
    style.textContent=`
      /* Give the period area enough room for two full YYYY-MM-DD values. */
      @media (min-width:1281px){
        .qmes-sales-ledger-v4 .qrl-grid{
          grid-template-columns:
            minmax(310px,1.35fr)
            minmax(115px,.55fr)
            minmax(175px,.85fr)
            minmax(110px,.55fr)
            minmax(110px,.55fr)
            minmax(200px,1.15fr)
            64px
            64px!important;
        }
      }

      .qmes-sales-ledger-v4 .qrl-date{
        grid-template-columns:minmax(138px,1fr) 14px minmax(138px,1fr)!important;
        gap:5px!important;
        overflow:visible!important;
      }

      .qmes-sales-ledger-v4 .qrl-date input[type="date"]{
        width:100%!important;
        min-width:138px!important;
        max-width:none!important;
        padding-left:9px!important;
        padding-right:7px!important;
        font-size:10px!important;
        line-height:34px!important;
        font-variant-numeric:tabular-nums!important;
        letter-spacing:0!important;
        overflow:visible!important;
        text-overflow:clip!important;
        white-space:nowrap!important;
      }

      .qmes-sales-ledger-v4 .qrl-date>b{
        width:14px!important;
        min-width:14px!important;
        max-width:14px!important;
      }

      @media (max-width:1280px){
        .qmes-sales-ledger-v4 .qrl-date{
          grid-template-columns:minmax(132px,1fr) 14px minmax(132px,1fr)!important;
        }
        .qmes-sales-ledger-v4 .qrl-date input[type="date"]{
          min-width:132px!important;
        }
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