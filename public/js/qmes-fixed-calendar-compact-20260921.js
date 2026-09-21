/* QMES fixed calendar compact size - 2026-09-21
 * Size only. No drag / no movement feature. Keeps qmesDatePickerStable behavior unchanged.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_COMPACT_20260921__) return;
  window.__QMES_FIXED_CALENDAR_COMPACT_20260921__=true;
  const id="qmes-fixed-calendar-compact-20260921-style";
  if(document.getElementById(id)) return;
  const s=document.createElement("style");
  s.id=id;
  s.textContent=`
    #qmes-date-picker-stable-pop-20260831-v3{
      width:280px!important;
      padding:10px 12px!important;
      border-radius:12px!important;
    }
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-head{margin-bottom:7px!important}
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-title{font-size:13px!important}
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-nav{width:30px!important;height:30px!important;font-size:17px!important}
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-week span{height:22px!important;font-size:10px!important}
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-day,
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-empty{height:30px!important}
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-day{font-size:10.5px!important}
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-actions{margin-top:7px!important;padding-top:7px!important;gap:6px!important}
    #qmes-date-picker-stable-pop-20260831-v3 .qdp-action{height:29px!important;padding:0 9px!important;font-size:9.5px!important}
  `;
  document.head.appendChild(s);
})();