/* Inventory page visual alignment with current QMES design — 2026-08-13
   raw-material inventory intentionally keeps the previous screen styling. */
(function(){
  "use strict";
  if(document.getElementById("qmes-inventory-page-theme-20260813")) return;
  const style=document.createElement("style");
  style.id="qmes-inventory-page-theme-20260813";
  style.textContent=`
    /* The QMES redesign is applied only to finished-goods / shipment / history views.
       The raw-material view is marked data-inventory-theme="legacy" by the view module
       and therefore remains on the pre-redesign styling. */
    #root [data-stage3-version][data-inventory-theme="qmes"]{
      width:min(1580px,calc(100vw - 28px));
      max-width:1580px;
      margin:0 auto;
      gap:12px!important;
      font-family:'Pretendard','Noto Sans KR',system-ui,sans-serif;
    }
    #root [data-stage3-version][data-inventory-theme="qmes"] > div,
    #root [data-stage3-version][data-inventory-theme="qmes"] > section{min-width:0;}
    #root [data-stage3-version][data-inventory-theme="qmes"] .rounded-xl,
    #root [data-stage3-version][data-inventory-theme="qmes"] .rounded-lg{border-radius:10px!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] .border-slate-700,
    #root [data-stage3-version][data-inventory-theme="qmes"] .border-slate-800,
    #root [data-stage3-version][data-inventory-theme="qmes"] .border-slate-800\/60{border-color:#203d58!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] .bg-slate-900\/50,
    #root [data-stage3-version][data-inventory-theme="qmes"] .bg-slate-900{background:#0d2237!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] > .grid{gap:10px!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] > .grid > .rounded-xl{min-height:92px!important;padding:15px 16px!important;border:1px solid #284761!important;background:#0d2237!important;box-shadow:none!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] > .grid > .rounded-xl .text-xs{color:#8da6bb!important;font-size:11px!important;font-weight:650!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] > .grid > .rounded-xl .text-2xl{margin-top:7px!important;color:#f1f5f9!important;font-size:24px!important;line-height:1.15!important;font-weight:850!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] > .grid > .rounded-xl .text-emerald-300{color:#6ee7b7!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] h2,
    #root [data-stage3-version][data-inventory-theme="qmes"] h3{letter-spacing:-.02em;}
    #root [data-stage3-version][data-inventory-theme="qmes"] .overflow-x-auto{border-radius:8px!important;overflow:auto!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;font-size:12px!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table thead th{height:40px!important;padding:9px 10px!important;background:#142b42!important;border-top:1px solid #28435b!important;border-bottom:1px solid #28435b!important;color:#9ab2c7!important;font-size:11px!important;font-weight:750!important;white-space:nowrap!important;vertical-align:middle!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table thead th:first-child{border-left:1px solid #28435b!important;border-radius:7px 0 0 0!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table thead th:last-child{border-right:1px solid #28435b!important;border-radius:0 7px 0 0!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table tbody td{min-height:42px!important;padding:10px!important;border-bottom:1px solid #173149!important;color:#dbe8f3;vertical-align:middle!important;white-space:nowrap;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table tbody tr:hover td{background:#10263c!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table .text-sky-300{color:#7dd3fc!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table .text-emerald-300{color:#6ee7b7!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table .text-amber-300{color:#fcd34d!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table .text-rose-300{color:#fda4af!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table .text-slate-400{color:#8da6bb!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] table .text-slate-300{color:#c6d4df!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] label{color:#9ab2c7!important;font-size:11px!important;font-weight:700!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] input,
    #root [data-stage3-version][data-inventory-theme="qmes"] select{height:38px!important;margin-top:6px!important;padding:0 10px!important;border:1px solid #334b65!important;border-radius:6px!important;background:#12263c!important;color:#e2e8f0!important;font-size:12px!important;outline:none!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] input:focus,
    #root [data-stage3-version][data-inventory-theme="qmes"] select:focus{border-color:#3b82f6!important;box-shadow:0 0 0 2px rgba(59,130,246,.12)!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] button.bg-sky-600{height:38px!important;border-radius:6px!important;background:#2563eb!important;font-size:12px!important;font-weight:800!important;box-shadow:none!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] button.bg-sky-600:hover{background:#1d4ed8!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] button.border-rose-700{min-height:28px!important;padding:0 9px!important;border-color:#7f1d1d!important;border-radius:6px!important;background:#2b1720!important;color:#fda4af!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] .bg-emerald-950\/20{border-color:#166b55!important;background:#0d2e2a!important;color:#8ff0cf!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] .bg-amber-950\/20{border-color:#785d1c!important;background:#302812!important;color:#fde68a!important;}
    #root [data-stage3-version][data-inventory-theme="qmes"] .bg-rose-950\/20{border-color:#7f1d1d!important;background:#321921!important;color:#fecdd3!important;}
    @media(max-width:1180px){#root [data-stage3-version][data-inventory-theme="qmes"]{width:calc(100vw - 20px);}}
    @media(max-width:720px){#root [data-stage3-version][data-inventory-theme="qmes"]{width:calc(100vw - 12px);gap:9px!important;}#root [data-stage3-version][data-inventory-theme="qmes"] > .grid{grid-template-columns:1fr!important;}#root [data-stage3-version][data-inventory-theme="qmes"] table{font-size:11px!important;}}
  `;
  document.head.appendChild(style);
})();
