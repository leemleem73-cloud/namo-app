/* NAMO QMES unified Douzone iCUBE palette — 2026-09-02
 * Reference: namochemical_douzone_erp_mes_douzone_color(1).html
 * Scope: shell + menus + main content colors only.
 * IMPORTANT: NAMO Chemical logo styling is intentionally NOT changed here.
 */
(function(){
  'use strict';
  if(window.__QMES_NAMO_TALK_HEADER_CONTRAST_20260814__) return;
  window.__QMES_NAMO_TALK_HEADER_CONTRAST_20260814__=true;

  const style=document.createElement('style');
  style.id='qmes-namo-talk-header-contrast';
  style.textContent=`
    :root{
      --qmes-bg:#edf2f6!important;
      --qmes-surface:#ffffff!important;
      --qmes-soft:#f6f8fa!important;
      --qmes-soft-blue:#e7f2fa!important;
      --qmes-line:#cbd8e2!important;
      --qmes-line-soft:#dce5eb!important;
      --qmes-text:#22384a!important;
      --qmes-text-2:#344d60!important;
      --qmes-muted:#687c8d!important;
      --qmes-muted-2:#8ba0b0!important;
      --qmes-blue:#2f78b7!important;
      --qmes-blue-2:#2f6f9f!important;
      --qmes-green:#58a842!important;
      --qmes-orange:#eea32f!important;
      --qmes-red:#df5151!important;
      --qmes-shadow:0 2px 7px rgba(47,91,124,.12)!important;
      --qmes-shell-line:#cbd8e2!important;
      --qmes-shell-text:#3d5264!important;
      --qmes-shell-blue:#2f78b7!important;
      --qmes-shell-blue-dark:#2f6f9f!important;
    }

    html,html body,
    html body #root#root#root#root#root,
    html body #root#root#root#root#root>div{
      background:#edf2f6!important;
      color:#22384a!important;
    }

    /* ===== 1. TOP UTILITY HEADER ===== */
    html body #root#root#root#root#root>div>header,
    html body #root#root#root#root#root>div>header>div:first-child{
      background:linear-gradient(180deg,#3d87bd 0%,#2d70a5 100%)!important;
      border-color:#235f8e!important;
      color:#fff!important;
      box-shadow:0 2px 6px rgba(30,73,105,.24)!important;
    }

    /* Logo intentionally untouched. */

    html body #root#root#root#root#root .qmes-header-clock,
    html body #root#root#root#root#root .qmes-header-clock span{
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      opacity:1!important;
      font-weight:750!important;
      text-shadow:0 1px 0 rgba(0,0,0,.12)!important;
    }
    html body #root#root#root#root#root .qmes-header-clock .animate-pulse{
      background:#7fda9e!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root .qmes-header-controls{
      color:#fff!important;
    }
    html body #root#root#root#root#root .qmes-header-action,
    html body #root#root#root#root#root button[aria-label*="NAMO Talk"],
    html body #root#root#root#root#root button[aria-label^="계정 설정"]{
      background:rgba(0,0,0,.08)!important;
      border:1px solid rgba(255,255,255,.38)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;
      opacity:1!important;
      text-shadow:none!important;
    }
    html body #root#root#root#root#root .qmes-header-action *,
    html body #root#root#root#root#root button[aria-label*="NAMO Talk"] *,
    html body #root#root#root#root#root button[aria-label^="계정 설정"] span,
    html body #root#root#root#root#root button[aria-label^="계정 설정"] div:not(:first-of-type){
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root button[aria-label^="계정 설정"]>div:first-of-type{
      background:#f4f8fb!important;
      color:#2f6f9f!important;
      -webkit-text-fill-color:#2f6f9f!important;
      border:1px solid rgba(255,255,255,.55)!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root .qmes-header-action:hover,
    html body #root#root#root#root#root button[aria-label*="NAMO Talk"]:hover,
    html body #root#root#root#root#root button[aria-label^="계정 설정"]:hover,
    html body #root#root#root#root#root .qmes-header-action:focus-visible,
    html body #root#root#root#root#root button[aria-label*="NAMO Talk"]:focus-visible,
    html body #root#root#root#root#root button[aria-label^="계정 설정"]:focus-visible{
      background:rgba(255,255,255,.15)!important;
      border-color:rgba(255,255,255,.62)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }

    /* ===== 2. SECOND TOP MENU BAR ===== */
    html body #root#root#root#root#root .qmes-top-menu-bar,
    html body #root#root#root#root#root .qmes-top-menu{
      background:linear-gradient(180deg,#f8fafb 0%,#edf2f6 100%)!important;
      border-color:#bfcdd8!important;
      box-shadow:0 1px 3px rgba(42,76,99,.06)!important;
    }
    html body #root#root#root#root#root .qmes-top-menu-button{
      background:transparent!important;
      color:#3d5264!important;
      border-color:transparent!important;
      text-shadow:none!important;
    }
    html body #root#root#root#root#root .qmes-top-menu-button span{
      color:inherit!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root .qmes-top-menu-button svg{
      color:#356f99!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root .qmes-top-menu-button:hover,
    html body #root#root#root#root#root .qmes-top-menu-button:focus-visible{
      background:#e2edf5!important;
      color:#1d5681!important;
    }
    html body #root#root#root#root#root .qmes-top-menu-button.is-active,
    html body #root#root#root#root#root .qmes-top-menu-button[aria-current="page"]{
      background:linear-gradient(180deg,#3d8ac0,#2f76ad)!important;
      color:#fff!important;
      border-bottom-color:#235f8e!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important;
    }
    html body #root#root#root#root#root .qmes-top-menu-button.is-active svg,
    html body #root#root#root#root#root .qmes-top-menu-button[aria-current="page"] svg{
      color:#fff!important;
    }

    /* ===== 3. TOP DROPDOWNS ===== */
    html body #qmes-all-menu-dropdown#qmes-all-menu-dropdown,
    html body #qmes-user-dropdown#qmes-user-dropdown{
      background:#fff!important;
      color:#344d60!important;
      border-color:#bfcdd8!important;
      box-shadow:0 10px 28px rgba(47,91,124,.18)!important;
    }
    html body #qmes-all-menu-dropdown#qmes-all-menu-dropdown .qmes-hover-title{
      background:#dfeaf2!important;
      color:#2f6f9f!important;
      border-bottom-color:#c7d7e2!important;
    }
    html body #qmes-all-menu-dropdown#qmes-all-menu-dropdown button,
    html body #qmes-user-dropdown#qmes-user-dropdown button{
      background:#fff!important;
      color:#3d5264!important;
      -webkit-text-fill-color:#3d5264!important;
    }
    html body #qmes-all-menu-dropdown#qmes-all-menu-dropdown button:hover,
    html body #qmes-all-menu-dropdown#qmes-all-menu-dropdown button:focus-visible,
    html body #qmes-user-dropdown#qmes-user-dropdown button:hover,
    html body #qmes-user-dropdown#qmes-user-dropdown button:focus-visible{
      background:#e2edf5!important;
      color:#1d5681!important;
      -webkit-text-fill-color:#1d5681!important;
    }
    html body #qmes-user-dropdown#qmes-user-dropdown .qmes-dropdown-logout{
      color:#b54242!important;
      -webkit-text-fill-color:#b54242!important;
      border-top-color:#dce5eb!important;
    }

    /* ===== 4. LEFT SIDEBAR ===== */
    html body #qmes-sync-sidebar#qmes-sync-sidebar{
      background:linear-gradient(180deg,#f8fafb 0%,#edf2f6 100%)!important;
      color:#344d60!important;
      border-right:1px solid #bfcdd8!important;
      box-shadow:2px 0 5px rgba(51,82,103,.08)!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-search,
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-head,
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-head.is-group-active{
      background:#eef4f8!important;
      border-color:#cbd7e0!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-search-box{
      background:#fff!important;
      border-color:#c9d8e3!important;
      border-radius:4px!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-search-input{
      background:#fff!important;
      color:#2d4b61!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-search-input::placeholder{
      color:#7c8e9d!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-title,
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-head.is-group-active .qmes-side-title{
      color:#2f6f9f!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-close{
      color:#688196!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item{
      background:transparent!important;
      color:#3d5264!important;
      border-radius:3px!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item:before{
      background:#c5d4df!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item:hover{
      background:#e2edf5!important;
      color:#1d5681!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item:hover:before{
      background:#7fa8c4!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item.is-active{
      background:linear-gradient(180deg,#3d8ac0,#2f76ad)!important;
      color:#fff!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item.is-active:before{
      background:#fff!important;
    }
    html body #qmes-sync-hamburger{
      background:#2f76ad!important;
      border-color:#286b9e!important;
      color:#fff!important;
    }

    /* ===== 5. MAIN CONTENT BACKGROUND ===== */
    html body:not(.qmes-iqc-preview-open):not(.qmes-cert-print-pqc):not(.qmes-cert-print-oqc) #root#root#root#root#root>div>main,
    html body:not(.qmes-iqc-preview-open) main:has(.qmes-dashboard-process-grid),
    html body:not(.qmes-iqc-preview-open) .qmes-main:has(.qmes-dashboard-process-grid),
    html body:not(.qmes-iqc-preview-open) .qmes-content:has(.qmes-dashboard-process-grid){
      background:#edf2f6!important;
      color:#22384a!important;
    }

    /* ===== 6. CARDS / PANELS / COMMON SURFACES ===== */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(
      .qmes-hybrid-kpi-card,
      .qmes-text-kpi-card,
      .qmes-iqc-kpi-card,
      .qmes-process-card,
      .qmes-panel,
      .qpp-card,
      .qmes-equipment-master-screen,
      .qmes-equipment-schedule-screen,
      .qmes-equipment-repair-screen
    ){
      background:#fff!important;
      color:#22384a!important;
      border-color:#c7d5df!important;
      box-shadow:0 2px 7px rgba(47,91,124,.10)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-950"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-900"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-800"]{
      background:#fff!important;
      background-image:none!important;
      color:#22384a!important;
      border-color:#c7d5df!important;
      box-shadow:0 2px 7px rgba(47,91,124,.10)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-700"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-800/70"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-800/60"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-800/50"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main [class~="bg-slate-800/40"]{
      background:#f6f8fa!important;
      color:#344d60!important;
    }

    /* Dashboard panel heading tone */
    html body:not(.qmes-iqc-preview-open) :where(main,.qmes-main,.qmes-content):has(.qmes-dashboard-process-grid) .qmes-dashboard-kpi-grid+.grid>*,
    html body:not(.qmes-iqc-preview-open) :where(main,.qmes-main,.qmes-content):has(.qmes-dashboard-process-grid) .qmes-dashboard-kpi-grid+.grid+.grid>*{
      background:#fff!important;
      border-color:#c7d5df!important;
    }
    html body:not(.qmes-iqc-preview-open) :where(main,.qmes-main,.qmes-content):has(.qmes-dashboard-process-grid) .qmes-dashboard-kpi-grid+.grid>*>:first-child,
    html body:not(.qmes-iqc-preview-open) :where(main,.qmes-main,.qmes-content):has(.qmes-dashboard-process-grid) .qmes-dashboard-kpi-grid+.grid+.grid>*>:first-child{
      background:linear-gradient(180deg,#fbfdfe 0%,#edf4f8 100%)!important;
      color:#244f70!important;
      border-color:#c7d5df!important;
    }

    /* ===== 7. TYPOGRAPHY ===== */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(h1,h2,h3,h4,h5,h6){
      color:#244f70!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.text-slate-100,.text-slate-200,.text-slate-300){
      color:#22384a!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.text-slate-400,.text-slate-500,.text-slate-600){
      color:#687c8d!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.text-sky-400,.text-blue-400,.text-blue-500){color:#2f78b7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.text-cyan-400){color:#4f9bc7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.text-emerald-400,.text-green-400){color:#4e8b3c!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.text-amber-400,.text-orange-400){color:#a46b10!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.text-red-400,.text-rose-400){color:#b54242!important;}

    /* ===== 8. TABLES ===== */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main table{
      border-color:#cbd8e2!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main table thead,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main table thead tr{
      background:linear-gradient(180deg,#3d87bd 0%,#2e72a9 100%)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main table thead th{
      background:linear-gradient(180deg,#3d87bd 0%,#2e72a9 100%)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      border-color:#225f8e!important;
      text-shadow:0 1px 0 rgba(0,0,0,.12)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main table tbody td{
      color:#2e4557!important;
      border-color:#dce5eb!important;
      background:#fff!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main table tbody tr:nth-child(even) td{
      background:#f7fafc!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main table tbody tr:hover td{
      background:#eaf4fb!important;
    }

    /* ===== 9. INPUT / SEARCH / SELECT / TEXTAREA ===== */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main input:not([type="checkbox"]):not([type="radio"]),
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main select,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main textarea{
      background:#fff!important;
      color:#2e4557!important;
      -webkit-text-fill-color:#2e4557!important;
      border-color:#b9c9d5!important;
      box-shadow:none!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main input::placeholder,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main textarea::placeholder{
      color:#7c8e9d!important;
      -webkit-text-fill-color:#7c8e9d!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main input:focus,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main select:focus,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main textarea:focus{
      border-color:#4d91c2!important;
      box-shadow:0 0 0 2px rgba(47,120,183,.12)!important;
      outline:none!important;
    }

    /* ===== 10. COMMON BUTTONS ===== */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main button:not([class*="status"]):not([aria-label*="닫기"]),
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main a[role="button"]{
      border-color:#b7c8d4!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main button[class*="bg-blue"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main button[class*="bg-sky"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main button[class*="bg-indigo"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main .qmes-primary-button{
      background:linear-gradient(180deg,#4a93c7 0%,#2f78b7 100%)!important;
      border-color:#286b9e!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 1px 2px rgba(45,99,138,.18)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main button[class*="bg-blue"] *,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main button[class*="bg-sky"] *,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main button[class*="bg-indigo"] *{
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }

    /* ===== 11. STATUS / KPI ACCENTS ===== */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.bg-blue-500,.bg-blue-600,.bg-sky-500,.bg-sky-600){background:#2f78b7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.bg-cyan-400,.bg-cyan-500){background:#4f9bc7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.bg-emerald-400,.bg-emerald-500,.bg-green-400,.bg-green-500){background:#58a842!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.bg-amber-400,.bg-amber-500,.bg-orange-400,.bg-orange-500){background:#eea32f!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root main :is(.bg-red-400,.bg-red-500,.bg-rose-400,.bg-rose-500){background:#df5151!important;}

    /* ===== 12. MODALS / DRAWERS / DIALOGS ===== */
    html body:not(.qmes-iqc-preview-open) [role="dialog"]:not([aria-label="계정 설정"]),
    html body:not(.qmes-iqc-preview-open) .qmes-modal,
    html body:not(.qmes-iqc-preview-open) .qmes-drawer{
      color:#22384a!important;
    }
    html body:not(.qmes-iqc-preview-open) [role="dialog"]:not([aria-label="계정 설정"]) :is(input,select,textarea){
      background:#fff!important;
      color:#2e4557!important;
      -webkit-text-fill-color:#2e4557!important;
      border-color:#b9c9d5!important;
    }
    html body:not(.qmes-iqc-preview-open) [role="dialog"]:not([aria-label="계정 설정"]) table thead th{
      background:linear-gradient(180deg,#3d87bd 0%,#2e72a9 100%)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      border-color:#225f8e!important;
    }

    /* ===== 13. NAMO TALK INTERNAL HEADER ===== */
    section[aria-label="NAMO Talk"] > header{
      color:#244f70!important;
    }
    section[aria-label="NAMO Talk"] > header > div:first-child,
    section[aria-label="NAMO Talk"] > header > div:first-child > div,
    section[aria-label="NAMO Talk"] > header > div:nth-of-type(2){
      color:#244f70!important;
      -webkit-text-fill-color:#244f70!important;
      text-shadow:none!important;
      opacity:1!important;
    }
    section[aria-label="NAMO Talk"] > header button,
    section[aria-label="NAMO Talk"] > header button svg,
    section[aria-label="NAMO Talk"] > header button span{
      color:#356f99!important;
      fill:currentColor!important;
      opacity:1!important;
    }

    /* ===== 14. PRINT / CERTIFICATE SAFETY ===== */
    @media print{
      html body,
      html body #root,
      html body #root main{
        background:#fff!important;
      }
      html body #root main table thead,
      html body #root main table thead tr,
      html body #root main table thead th{
        background:#fff!important;
        color:#111!important;
        -webkit-text-fill-color:#111!important;
        text-shadow:none!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
