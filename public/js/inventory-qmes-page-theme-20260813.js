/* Inventory page visual alignment with current QMES design — 2026-08-13 */
(function(){
  "use strict";
  if(document.getElementById("qmes-inventory-page-theme-20260813")) return;
  const style=document.createElement("style");
  style.id="qmes-inventory-page-theme-20260813";
  style.textContent=`
    #root [data-stage3-version]{
      width:min(1580px,calc(100vw - 28px));
      max-width:1580px;
      margin:0 auto;
      gap:12px!important;
      font-family:'Pretendard','Noto Sans KR',system-ui,sans-serif;
    }
    #root [data-stage3-version] > div,
    #root [data-stage3-version] > section{
      min-width:0;
    }

    /* QMES 공통 카드 톤 */
    #root [data-stage3-version] .rounded-xl,
    #root [data-stage3-version] .rounded-lg{
      border-radius:10px!important;
    }
    #root [data-stage3-version] .border-slate-700,
    #root [data-stage3-version] .border-slate-800,
    #root [data-stage3-version] .border-slate-800\/60{
      border-color:#203d58!important;
    }
    #root [data-stage3-version] .bg-slate-900\/50,
    #root [data-stage3-version] .bg-slate-900{
      background:#0d2237!important;
    }

    /* 완제품 KPI 카드 */
    #root [data-stage3-version] > .grid{
      gap:10px!important;
    }
    #root [data-stage3-version] > .grid > .rounded-xl{
      min-height:92px!important;
      padding:15px 16px!important;
      border:1px solid #284761!important;
      background:#0d2237!important;
      box-shadow:none!important;
    }
    #root [data-stage3-version] > .grid > .rounded-xl .text-xs{
      color:#8da6bb!important;
      font-size:11px!important;
      font-weight:650!important;
    }
    #root [data-stage3-version] > .grid > .rounded-xl .text-2xl{
      margin-top:7px!important;
      color:#f1f5f9!important;
      font-size:24px!important;
      line-height:1.15!important;
      font-weight:850!important;
    }
    #root [data-stage3-version] > .grid > .rounded-xl .text-emerald-300{color:#6ee7b7!important;}

    /* Panel 컴포넌트: 다른 QMES 관리화면과 같은 밀도 */
    #root [data-stage3-version] > div:not(.grid),
    #root [data-stage3-version] > div > div:not(.grid):not(.overflow-x-auto){
      border-radius:10px;
    }
    #root [data-stage3-version] h2,
    #root [data-stage3-version] h3{
      letter-spacing:-.02em;
    }

    /* 표 */
    #root [data-stage3-version] .overflow-x-auto{
      border-radius:8px!important;
      overflow:auto!important;
    }
    #root [data-stage3-version] table{
      width:100%!important;
      border-collapse:separate!important;
      border-spacing:0!important;
      font-size:12px!important;
    }
    #root [data-stage3-version] table thead th{
      height:40px!important;
      padding:9px 10px!important;
      background:#142b42!important;
      border-top:1px solid #28435b!important;
      border-bottom:1px solid #28435b!important;
      color:#9ab2c7!important;
      font-size:11px!important;
      font-weight:750!important;
      white-space:nowrap!important;
      vertical-align:middle!important;
    }
    #root [data-stage3-version] table thead th:first-child{border-left:1px solid #28435b!important;border-radius:7px 0 0 0!important;}
    #root [data-stage3-version] table thead th:last-child{border-right:1px solid #28435b!important;border-radius:0 7px 0 0!important;}
    #root [data-stage3-version] table tbody td{
      min-height:42px!important;
      padding:10px!important;
      border-bottom:1px solid #173149!important;
      color:#dbe8f3;
      vertical-align:middle!important;
      white-space:nowrap;
    }
    #root [data-stage3-version] table tbody tr:hover td{background:#10263c!important;}
    #root [data-stage3-version] table .text-sky-300{color:#7dd3fc!important;}
    #root [data-stage3-version] table .text-emerald-300{color:#6ee7b7!important;}
    #root [data-stage3-version] table .text-amber-300{color:#fcd34d!important;}
    #root [data-stage3-version] table .text-rose-300{color:#fda4af!important;}
    #root [data-stage3-version] table .text-slate-400{color:#8da6bb!important;}
    #root [data-stage3-version] table .text-slate-300{color:#c6d4df!important;}

    /* 출고 입력 영역 */
    #root [data-stage3-version] label{
      color:#9ab2c7!important;
      font-size:11px!important;
      font-weight:700!important;
    }
    #root [data-stage3-version] input,
    #root [data-stage3-version] select{
      height:38px!important;
      margin-top:6px!important;
      padding:0 10px!important;
      border:1px solid #334b65!important;
      border-radius:6px!important;
      background:#12263c!important;
      color:#e2e8f0!important;
      font-size:12px!important;
      outline:none!important;
    }
    #root [data-stage3-version] input:focus,
    #root [data-stage3-version] select:focus{
      border-color:#3b82f6!important;
      box-shadow:0 0 0 2px rgba(59,130,246,.12)!important;
    }
    #root [data-stage3-version] button.bg-sky-600{
      height:38px!important;
      border-radius:6px!important;
      background:#2563eb!important;
      font-size:12px!important;
      font-weight:800!important;
      box-shadow:none!important;
    }
    #root [data-stage3-version] button.bg-sky-600:hover{background:#1d4ed8!important;}
    #root [data-stage3-version] button.border-rose-700{
      min-height:28px!important;
      padding:0 9px!important;
      border-color:#7f1d1d!important;
      border-radius:6px!important;
      background:#2b1720!important;
      color:#fda4af!important;
    }

    /* 안내/검증 박스 */
    #root [data-stage3-version] .bg-emerald-950\/20{
      border-color:#166b55!important;
      background:#0d2e2a!important;
      color:#8ff0cf!important;
    }
    #root [data-stage3-version] .bg-amber-950\/20{
      border-color:#785d1c!important;
      background:#302812!important;
      color:#fde68a!important;
    }
    #root [data-stage3-version] .bg-rose-950\/20{
      border-color:#7f1d1d!important;
      background:#321921!important;
      color:#fecdd3!important;
    }

    @media(max-width:1180px){
      #root [data-stage3-version]{width:calc(100vw - 20px);}
    }
    @media(max-width:720px){
      #root [data-stage3-version]{width:calc(100vw - 12px);gap:9px!important;}
      #root [data-stage3-version] > .grid{grid-template-columns:1fr!important;}
      #root [data-stage3-version] table{font-size:11px!important;}
    }
  `;
  document.head.appendChild(style);
})();
