/* QMES Workorder Calendar Sales Parity V1 - 2026-09-28
 * CALENDAR ONLY. No other workorder UI/data/save logic changes.
 * Workorder date fields reuse the exact Sales/Delivery fixed calendar owner.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_CALENDAR_SALES_PARITY_V1__)return;
  window.__QMES_WORKORDER_CALENDAR_SALES_PARITY_V1__=true;

  function apply(){
    var root=document.querySelector(".qwo1");
    if(!root)return;

    /* Make only the workorder date inputs eligible for the shared Sales/Delivery calendar owner. */
    root.classList.add("qmes-sales-ledger-v4");

    var selectors=[
      ".qwo1-period input",
      '.qwo1-form-field input[type="date"]',
      '.qwo1-form-field input[placeholder="YYYY-MM-DD"]'
    ];

    root.querySelectorAll(selectors.join(",")).forEach(function(input){
      if(!(input instanceof HTMLInputElement))return;
      var wrap=input.closest(".qwo1-field,.qwo1-form-field");
      if(wrap)wrap.classList.add("qrl-date");
      try{
        if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.patch==="function"){
          window.qmesFixedCalendar.patch(input);
        }
      }catch(_){}
    });

    try{
      if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
        window.qmesFixedCalendar.scan(root);
      }
    }catch(_){}
  }

  var queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;apply();});
  }

  function boot(){
    apply();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("qmes:navigate-tab",schedule);
    window.addEventListener("qmes:workorder-owner-ready",schedule);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();