/* NAMO QMES FINAL Douzone iCUBE unified theme — 2026-09-02
 * Reference: namochemical_douzone_erp_mes_douzone_color(2).html
 * Scope: every on-screen QMES shell/menu/content color.
 * IMPORTANT: current NAMO Chemical logo styling is intentionally preserved.
 */
(function(){
  'use strict';
  if(window.__QMES_DOUZONE_FINAL_THEME_20260902__) return;
  window.__QMES_DOUZONE_FINAL_THEME_20260902__=true;

  const STYLE_ID='qmes-douzone-final-theme-20260902';
  const previous=document.getElementById('qmes-namo-talk-header-contrast');
  if(previous) previous.remove();
  const old=document.getElementById(STYLE_ID);
  if(old) old.remove();

  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    :root{
      --qmes-dz-navy:#eef3f7;
      --qmes-dz-navy2:#2f76ad;
      --qmes-dz-blue:#2f78b7;
      --qmes-dz-blue-soft:#e7f2fa;
      --qmes-dz-cyan:#4f9bc7;
      --qmes-dz-green:#58a842;
      --qmes-dz-green-soft:#edf7e9;
      --qmes-dz-orange:#eea32f;
      --qmes-dz-orange-soft:#fff4df;
      --qmes-dz-red:#df5151;
      --qmes-dz-red-soft:#fdeaea;
      --qmes-dz-purple:#7188b6;
      --qmes-dz-ink:#22384a;
      --qmes-dz-muted:#687c8d;
      --qmes-dz-line:#cbd8e2;
      --qmes-dz-panel:#ffffff;
      --qmes-dz-bg:#edf2f6;
      --qmes-dz-shadow:0 2px 7px rgba(47,91,124,.12);
      --qmes-bg:#edf2f6!important;
      --qmes-surface:#fff!important;
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
    html body #root#root#root#root#root#root,
    html body #root#root#root#root#root#root>div{
      background:#edf2f6!important;
      color:#22384a!important;
    }

    /* 1) TOP HEADER — exact reference blue family. Logo is intentionally not selected. */
    html body #root#root#root#root#root#root>div>header,
    html body #root#root#root#root#root#root>div>header>div:first-child{
      background:linear-gradient(180deg,#3d87bd 0%,#2d70a5 100%)!important;
      border-color:#235f8e!important;
      color:#fff!important;
      box-shadow:0 2px 6px rgba(30,73,105,.24)!important;
    }
    html body #root#root#root#root#root#root .qmes-header-clock,
    html body #root#root#root#root#root#root .qmes-header-clock span,
    html body #root#root#root#root#root#root .qmes-header-controls{
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root#root .qmes-header-clock{font-weight:750!important;}
    html body #root#root#root#root#root#root .qmes-header-clock .animate-pulse{background:#7fda9e!important;opacity:1!important;}
    html body #root#root#root#root#root#root>div>header .qmes-header-controls button,
    html body #root#root#root#root#root#root>div>header .qmes-header-action,
    html body #root#root#root#root#root#root>div>header button[aria-label*="NAMO Talk"],
    html body #root#root#root#root#root#root>div>header button[aria-label^="계정 설정"]{
      background:rgba(0,0,0,.08)!important;
      border:1px solid rgba(255,255,255,.38)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;
      opacity:1!important;
      text-shadow:none!important;
    }
    html body #root#root#root#root#root#root>div>header .qmes-header-controls button span,
    html body #root#root#root#root#root#root>div>header .qmes-header-controls button div,
    html body #root#root#root#root#root#root>div>header .qmes-header-controls button svg,
    html body #root#root#root#root#root#root>div>header .qmes-header-action *,
    html body #root#root#root#root#root#root>div>header button[aria-label*="NAMO Talk"] *{
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      fill:currentColor!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root#root>div>header button[aria-label^="계정 설정"]>div:first-of-type{
      background:#f4f8fb!important;
      color:#2f6f9f!important;
      -webkit-text-fill-color:#2f6f9f!important;
      border:1px solid rgba(255,255,255,.55)!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root#root>div>header button[aria-label^="계정 설정"]>div:first-of-type *{
      color:#2f6f9f!important;
      -webkit-text-fill-color:#2f6f9f!important;
    }
    html body #root#root#root#root#root#root>div>header .qmes-header-controls button:hover,
    html body #root#root#root#root#root#root>div>header .qmes-header-controls button:focus-visible{
      background:rgba(255,255,255,.15)!important;
      border-color:rgba(255,255,255,.62)!important;
      color:#fff!important;
    }

    /* 2) COMPLETE TOP MENU BAR — same blue as header, no remaining white/gray strip. */
    html body #root#root#root#root#root#root .qmes-top-menu-bar,
    html body #root#root#root#root#root#root .qmes-top-menu{
      background:linear-gradient(180deg,#3d87bd 0%,#2d70a5 100%)!important;
      border-top-color:#4d91c2!important;
      border-bottom-color:#235f8e!important;
      box-shadow:0 2px 5px rgba(30,73,105,.18)!important;
    }
    html body #root#root#root#root#root#root .qmes-top-menu-button{
      background:transparent!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      border-color:transparent!important;
      text-shadow:none!important;
    }
    html body #root#root#root#root#root#root .qmes-top-menu-button span,
    html body #root#root#root#root#root#root .qmes-top-menu-button svg{
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      opacity:1!important;
    }
    html body #root#root#root#root#root#root .qmes-top-menu-button:hover,
    html body #root#root#root#root#root#root .qmes-top-menu-button:focus-visible{
      background:rgba(255,255,255,.14)!important;
      color:#fff!important;
    }
    html body #root#root#root#root#root#root .qmes-top-menu-button.is-active,
    html body #root#root#root#root#root#root .qmes-top-menu-button[aria-current="page"]{
      background:rgba(0,0,0,.14)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      border-bottom-color:#fff!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.18)!important;
      font-weight:800!important;
    }

    /* 3) ALL TOP DROPDOWNS */
    html body #qmes-all-menu-dropdown#qmes-all-menu-dropdown,
    html body #qmes-user-dropdown#qmes-user-dropdown{
      background:#fff!important;
      color:#344d60!important;
      border:1px solid #bfcdd8!important;
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

    /* 4) LEFT MENU — exact light gray/blue reference family. */
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
      border:1px solid #c9d8e3!important;
      border-radius:3px!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-search-input{
      background:#fff!important;
      color:#2d4b61!important;
      -webkit-text-fill-color:#2d4b61!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-search-input::placeholder{color:#7c8e9d!important;}
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-title,
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-head.is-group-active .qmes-side-title{
      color:#2f6f9f!important;
      -webkit-text-fill-color:#2f6f9f!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-close{color:#688196!important;}
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item{
      background:transparent!important;
      color:#3d5264!important;
      -webkit-text-fill-color:#3d5264!important;
      border-radius:2px!important;
      box-shadow:none!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item:before{background:#c5d4df!important;}
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item:hover{
      background:#e2edf5!important;
      color:#1d5681!important;
      -webkit-text-fill-color:#1d5681!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item.is-active{
      background:linear-gradient(180deg,#3d8ac0,#2f76ad)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important;
    }
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item.is-active *{color:#fff!important;-webkit-text-fill-color:#fff!important;}
    html body #qmes-sync-sidebar#qmes-sync-sidebar .qmes-side-item.is-active:before{background:#fff!important;}
    html body #qmes-sync-hamburger{
      background:#2f76ad!important;
      border-color:#286b9e!important;
      color:#fff!important;
    }

    /* 5) MAIN PAGE BACKGROUND + GENERAL TEXT */
    html body:not(.qmes-iqc-preview-open):not(.qmes-cert-print-pqc):not(.qmes-cert-print-oqc) #root#root#root#root#root#root>div>main{
      background:#edf2f6!important;
      color:#22384a!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(h1,h2,h3,h4,h5,h6){color:#244f70!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-slate-100,.text-slate-200,.text-slate-300,.text-gray-100,.text-gray-200,.text-gray-300){color:#22384a!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-slate-400,.text-slate-500,.text-slate-600,.text-gray-400,.text-gray-500,.text-gray-600){color:#687c8d!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-sky-400,.text-sky-500,.text-blue-400,.text-blue-500,.text-blue-600){color:#2f78b7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .text-cyan-400{color:#4f9bc7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-emerald-400,.text-green-400,.text-green-500){color:#4e8b3c!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-amber-400,.text-orange-400,.text-orange-500){color:#a46b10!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-red-400,.text-red-500,.text-rose-400,.text-rose-500){color:#b54242!important;}

    /* 6) ALL MAIN SURFACES / PANELS / KPI / CARDS */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(
      .qmes-hybrid-kpi-card,.qmes-text-kpi-card,.qmes-iqc-kpi-card,.qmes-process-card,.qmes-panel,.qpp-card,
      .qmes-equipment-master-screen,.qmes-equipment-schedule-screen,.qmes-equipment-repair-screen,
      .qmes-iqc-ledger-panel,.qmes-dashboard-card,.qmes-card,.panel,.kpi,.mini-kpi,.filterbar
    ){
      background:#fff!important;
      color:#22384a!important;
      border-color:#c7d5df!important;
      border-radius:4px!important;
      box-shadow:0 2px 7px rgba(47,91,124,.12)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-950"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-900"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-800"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-gray-900"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-gray-800"]{
      background:#fff!important;
      background-image:none!important;
      color:#22384a!important;
      border-color:#c7d5df!important;
      box-shadow:0 2px 7px rgba(47,91,124,.10)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-700"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-800/70"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-800/60"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-800/50"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-slate-800/40"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class~="bg-gray-700"]{
      background:#f6f8fa!important;
      background-image:none!important;
      color:#344d60!important;
      border-color:#cbd8e2!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class*="border-slate"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [class*="border-gray"]{border-color:#cbd8e2!important;}

    /* 7) PANEL / SECTION HEADERS — reference light blue-gray gradient. */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.panel-head,.qmes-panel-head,.qmes-card-head,.qmes-section-head),
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-dashboard-kpi-grid+.grid>*>:first-child,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-dashboard-kpi-grid+.grid+.grid>*>:first-child{
      background:linear-gradient(180deg,#fbfdfe 0%,#edf4f8 100%)!important;
      color:#244f70!important;
      border-color:#c7d5df!important;
    }

    /* 8) DASHBOARD KPI / FLOW */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-dashboard-kpi-grid>*{
      background:#fff!important;
      color:#22384a!important;
      border:1px solid #c7d5df!important;
      border-radius:4px!important;
      box-shadow:0 2px 7px rgba(47,91,124,.12)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-dashboard-kpi-grid>* *{text-shadow:none!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-process-card{
      background:#fff!important;
      border-color:#c7d5df!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-process-name{color:#244f70!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-process-no,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-process-key{color:#687c8d!important;}

    /* 9) TABLES — all data lists use the exact reference header blue. */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] table{
      border-color:#cbd8e2!important;
      background:#fff!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table thead,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table thead tr,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] table thead,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] table thead tr{
      background:linear-gradient(180deg,#3d87bd 0%,#2e72a9 100%)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table thead th,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] table thead th{
      background:linear-gradient(180deg,#3d87bd 0%,#2e72a9 100%)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      border-color:#225f8e!important;
      text-shadow:0 1px 0 rgba(0,0,0,.12)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table tbody td,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] table tbody td{
      color:#2e4557!important;
      -webkit-text-fill-color:#2e4557!important;
      border-color:#dce5eb!important;
      background:#fff!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table tbody tr:nth-child(even) td,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] table tbody tr:nth-child(even) td{background:#f7fafc!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table tbody tr:hover td,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] table tbody tr:hover td{background:#eaf4fb!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main table a{color:#1267a6!important;-webkit-text-fill-color:#1267a6!important;}

    /* 10) FILTERS / INPUTS / SELECTS / TEXTAREAS */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main input:not([type="checkbox"]):not([type="radio"]),
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main select,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main textarea,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] input:not([type="checkbox"]):not([type="radio"]),
    html body:not(.qmes-iqc-preview-open) [role="dialog"] select,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] textarea{
      background:#fff!important;
      color:#2e4557!important;
      -webkit-text-fill-color:#2e4557!important;
      border-color:#b9c9d5!important;
      border-radius:2px!important;
      box-shadow:none!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main input::placeholder,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main textarea::placeholder,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] input::placeholder,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] textarea::placeholder{
      color:#7c8e9d!important;
      -webkit-text-fill-color:#7c8e9d!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main input:focus,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main select:focus,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main textarea:focus,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] input:focus,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] select:focus,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] textarea:focus{
      border-color:#4d91c2!important;
      box-shadow:0 0 0 2px rgba(47,120,183,.12)!important;
      outline:none!important;
    }

    /* 11) BUTTONS — neutral / primary / danger follow the reference. */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button:not([class*="bg-blue"]):not([class*="bg-sky"]):not([class*="bg-indigo"]):not([class*="bg-red"]):not([class*="bg-rose"]),
    html body:not(.qmes-iqc-preview-open) [role="dialog"] button:not([class*="bg-blue"]):not([class*="bg-sky"]):not([class*="bg-indigo"]):not([class*="bg-red"]):not([class*="bg-rose"]){
      border-color:#b7c8d4!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-blue"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-sky"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-indigo"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-primary-button,
    html body:not(.qmes-iqc-preview-open) [role="dialog"] button[class*="bg-blue"],
    html body:not(.qmes-iqc-preview-open) [role="dialog"] button[class*="bg-sky"],
    html body:not(.qmes-iqc-preview-open) [role="dialog"] button[class*="bg-indigo"]{
      background:linear-gradient(180deg,#4a93c7 0%,#2f78b7 100%)!important;
      border-color:#286b9e!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 1px 2px rgba(45,99,138,.18)!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-blue"] *,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-sky"] *,
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-indigo"] *{color:#fff!important;-webkit-text-fill-color:#fff!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-red"],
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main button[class*="bg-rose"],
    html body:not(.qmes-iqc-preview-open) [role="dialog"] button[class*="bg-red"],
    html body:not(.qmes-iqc-preview-open) [role="dialog"] button[class*="bg-rose"]{
      background:#fff!important;
      border-color:#d8a5a5!important;
      color:#c84444!important;
      -webkit-text-fill-color:#c84444!important;
    }

    /* 12) STATUS / BADGE COLORS */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-blue-50,.bg-blue-100,.bg-sky-50,.bg-sky-100){background:#e8f3fa!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-green-50,.bg-green-100,.bg-emerald-50,.bg-emerald-100){background:#edf7e9!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-amber-50,.bg-amber-100,.bg-orange-50,.bg-orange-100){background:#fff4df!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-red-50,.bg-red-100,.bg-rose-50,.bg-rose-100){background:#fdeaea!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-violet-50,.bg-violet-100,.bg-purple-50,.bg-purple-100){background:#edf0f8!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-blue-500,.bg-blue-600,.bg-sky-500,.bg-sky-600){background:#2f78b7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-cyan-400,.bg-cyan-500){background:#4f9bc7!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-emerald-400,.bg-emerald-500,.bg-green-400,.bg-green-500){background:#58a842!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-amber-400,.bg-amber-500,.bg-orange-400,.bg-orange-500){background:#eea32f!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.bg-red-400,.bg-red-500,.bg-rose-400,.bg-rose-500){background:#df5151!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-blue-600,.text-sky-600){color:#1f699d!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-green-600,.text-emerald-600){color:#4e8b3c!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-amber-600,.text-orange-600){color:#a46b10!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main :is(.text-red-600,.text-rose-600){color:#b54242!important;}

    /* 13) MODALS / DRAWERS / POPOVERS / DETAIL CARDS */
    html body:not(.qmes-iqc-preview-open) [role="dialog"]:not([aria-label="계정 설정"]),
    html body:not(.qmes-iqc-preview-open) .qmes-modal,
    html body:not(.qmes-iqc-preview-open) .qmes-drawer,
    html body:not(.qmes-iqc-preview-open) [class*="qmes-modal"],
    html body:not(.qmes-iqc-preview-open) [class*="qmes-drawer"]{
      color:#22384a!important;
    }
    html body:not(.qmes-iqc-preview-open) [role="dialog"]>div,
    html body:not(.qmes-iqc-preview-open) [role="dialog"]>form,
    html body:not(.qmes-iqc-preview-open) .qmes-modal>div,
    html body:not(.qmes-iqc-preview-open) .qmes-drawer>div{
      border-color:#c7d5df!important;
    }
    html body:not(.qmes-iqc-preview-open) [class*="detail-card"],
    html body:not(.qmes-iqc-preview-open) [class*="qmes-detail"]{
      border-color:#c7d5df!important;
    }

    /* 14) TABS / SUBNAV / CHIPS */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [role="tab"]{
      color:#365269!important;
      border-color:#b7c8d4!important;
    }
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main [role="tab"][aria-selected="true"]{
      background:linear-gradient(180deg,#4a93c7 0%,#2f78b7 100%)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      border-color:#286b9e!important;
    }

    /* 15) LINKS / ICONS / SVG DEFAULT ACCENT */
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main a:not([class*="text-red"]){color:#1267a6!important;}
    html body:not(.qmes-iqc-preview-open) #root#root#root#root#root#root main .qmes-link{color:#1267a6!important;}

    /* 16) NAMO TALK CONTENT */
    section[aria-label="NAMO Talk"]{
      background:#fff!important;
      color:#22384a!important;
      border-color:#c7d5df!important;
    }
    section[aria-label="NAMO Talk"]>header{
      background:linear-gradient(180deg,#fbfdfe 0%,#edf4f8 100%)!important;
      color:#244f70!important;
      border-color:#c7d5df!important;
    }
    section[aria-label="NAMO Talk"]>header *,
    section[aria-label="NAMO Talk"]>header button,
    section[aria-label="NAMO Talk"]>header button svg,
    section[aria-label="NAMO Talk"]>header button span{
      color:#356f99!important;
      -webkit-text-fill-color:#356f99!important;
      fill:currentColor!important;
      opacity:1!important;
    }

    /* 17) PRINT / CERTIFICATE SAFETY — visual theme never contaminates printed forms. */
    @media print{
      html body,html body #root,html body #root main{background:#fff!important;color:#111!important;}
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

  const mount=()=>{
    if(!document.head) return;
    document.head.appendChild(style);
  };
  mount();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mount,{once:true});
  }
  window.addEventListener('load',()=>{
    mount();
    setTimeout(mount,0);
    setTimeout(mount,600);
    setTimeout(mount,1600);
  },{once:true});
})();
