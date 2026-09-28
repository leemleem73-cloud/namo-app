/* QMES Workorder Calendar Sales Parity V2 - period field fix only
 * Keeps all workorder UI/data logic unchanged.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_CALENDAR_SALES_PARITY_V2__)return;
  window.__QMES_WORKORDER_CALENDAR_SALES_PARITY_V2__=true;

  function ensureStyle(){
    if(document.getElementById("qmes-workorder-period-fix-v2"))return;
    var s=document.createElement("style");
    s.id="qmes-workorder-period-fix-v2";
    s.textContent=
      '.qwo1 .qwo1-period{display:flex!important;align-items:center!important;gap:6px!important;width:100%!important;}'+
      '.qwo1 .qwo1-period>input{display:block!important;flex:1 1 0!important;width:0!important;min-width:0!important;height:38px!important;}'+
      '.qwo1 .qwo1-period>span{flex:0 0 auto!important;width:auto!important;}';
    document.head.appendChild(s);
  }

  function apply(){
    ensureStyle();
    var root=document.querySelector(".qwo1");
    if(!root)return;

    root.classList.add("qmes-sales-ledger-v4");

    /* Remove the old wrapper marker that distorted the period field. */
    root.querySelectorAll(".qwo1-field.qrl-date,.qwo1-form-field.qrl-date").forEach(function(el){
      el.classList.remove("qrl-date");
    });

    /* Put the calendar marker on the date input itself only. */
    root.querySelectorAll('.qwo1-period input,.qwo1-form-field input[type="date"],.qwo1-form-field input[placeholder="YYYY-MM-DD"]').forEach(function(input){
      if(!(input instanceof HTMLInputElement))return;
      input.classList.add("qrl-date");
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