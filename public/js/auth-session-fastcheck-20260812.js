/* QMES auth session fast-check - 2026-08-12
 * Prevent a stale browser session from keeping the login screen hidden for ~2 seconds.
 * Only /api/auth/me is given a reasonable startup timeout; normal API calls are untouched.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;
  const nativeFetch=global.fetch.bind(global);
  global.fetch=function(input,init){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    if(!/\/api\/auth\/me(?:\?|$)/.test(url)) return nativeFetch(input,init);
    const options={...(init||{})};
    if(options.signal) return nativeFetch(input,options);
    const controller=new AbortController();
    const timer=global.setTimeout(()=>controller.abort(),5000);
    options.signal=controller.signal;
    return nativeFetch(input,options).finally(()=>global.clearTimeout(timer));
  };
})(window);

/* Critical first-paint layout + full light palette.
 * This stylesheet is installed before React/Babel modules render. High-specificity
 * selectors beat the old premium-dark rules that are still present in common.css.
 */
(function installQmesPreviewCriticalTheme(){
  if(document.getElementById("qmes-preview-critical-theme-20260826")) return;
  const style=document.createElement("style");
  style.id="qmes-preview-critical-theme-20260826";
  style.textContent=`
    :root{
      --qmes-light-bg:#f5f7fb;
      --qmes-light-panel:#ffffff;
      --qmes-light-soft:#f8fafc;
      --qmes-light-line:#d7dee8;
      --qmes-light-line2:#e5eaf0;
      --qmes-light-text:#111827;
      --qmes-light-muted:#64748b;
      --qmes-light-blue:#2563eb;
      --qmes-light-blue-soft:#eef6ff;
    }

    html{color-scheme:light!important;background:var(--qmes-light-bg)!important}
    html body{background:var(--qmes-light-bg)!important;color:var(--qmes-light-text)!important}
    html body #root>div{background:var(--qmes-light-bg)!important;color:var(--qmes-light-text)!important}

    /* Header */
    html body #root>div>header{
      background:#fff!important;color:#111827!important;border-color:#d7dee8!important;
      box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
    }
    html body #root>div>header>div:first-child{
      height:68px!important;min-height:68px!important;max-height:68px!important;
      padding:0 20px!important;background:#fff!important;border-color:#d7dee8!important;
      box-sizing:border-box!important;transition:none!important;
    }
    html body #root>div>header img[alt="NAMO Chemical"]{
      filter:none!important;height:44px!important;max-height:44px!important;max-width:270px!important;
      width:auto!important;object-fit:contain!important;transition:none!important;
    }
    html body #root>div>header .qmes-header-clock,
    html body #root>div>header .qmes-header-clock span,
    html body #root>div>header .qmes-header-controls,
    html body #root>div>header .qmes-header-controls *{color:#334155!important}
    html body #root>div>header .qmes-header-action{
      background:#fff!important;color:#111827!important;border:1px solid #cbd5e1!important;
      border-radius:8px!important;min-height:34px!important;padding:6px 10px!important;
      font-size:12px!important;font-weight:800!important;box-shadow:none!important;transition:none!important;
    }
    html body #root>div>header button[aria-label*="NAMO Talk"]{
      background:#fff!important;color:#111827!important;border:1px solid #cbd5e1!important;
      border-radius:8px!important;box-shadow:none!important;
    }
    html body #root>div>header button[aria-label^="계정 설정"]{background:#fff!important;color:#111827!important}
    html body #root>div>header button[aria-label^="계정 설정"]>div:first-of-type{background:#eef2f7!important;color:#111827!important}
    html body #root>div>header button[aria-label^="계정 설정"] div,
    html body #root>div>header button[aria-label^="계정 설정"] span{color:#111827!important}

    /* Top navigation */
    html body #root .qmes-top-menu-bar{
      height:46px!important;min-height:46px!important;max-height:46px!important;
      background:#fff!important;border-top:1px solid #d7dee8!important;border-bottom:1px solid #d7dee8!important;
      box-shadow:none!important;box-sizing:border-box!important;transition:none!important;
    }
    html body #root .qmes-top-menu{
      height:46px!important;min-height:46px!important;max-height:46px!important;
      padding-left:10px!important;background:#fff!important;align-items:stretch!important;
      overflow-x:auto!important;overflow-y:hidden!important;flex-wrap:nowrap!important;
      transform:none!important;width:100%!important;box-sizing:border-box!important;transition:none!important;
    }
    html body #root .qmes-top-menu-item{
      height:46px!important;min-height:46px!important;max-height:46px!important;
      flex:0 0 auto!important;transition:none!important;
    }
    html body #root .qmes-top-menu .qmes-top-menu-item:first-child,
    html body #root .qmes-top-menu .qmes-top-menu-item:first-child .qmes-top-menu-button{min-width:0!important}
    html body #root .qmes-top-menu-button{
      height:46px!important;min-height:46px!important;max-height:46px!important;
      padding:0 14px!important;border:0!important;border-bottom:3px solid transparent!important;
      border-radius:0!important;background:#fff!important;color:#111827!important;
      font-size:13px!important;font-weight:800!important;white-space:nowrap!important;
      box-shadow:none!important;transition:none!important;
    }
    html body #root .qmes-top-menu-button span,
    html body #root .qmes-top-menu-button svg,
    html body #root .qmes-top-menu-button i,
    html body #root .qmes-top-menu-button b{color:currentColor!important}
    html body #root .qmes-top-menu-button:hover,
    html body #root .qmes-top-menu-button:focus-visible{background:#f1f5f9!important;color:#111827!important;outline:none!important}
    html body #root .qmes-top-menu-button.is-active,
    html body #root .qmes-top-menu-button[aria-current="page"]{background:#eef6ff!important;color:#174ea6!important;border-bottom-color:#2563eb!important}

    /* Dropdowns */
    html body .qmes-submenu-row,
    html body #qmes-all-menu-dropdown,
    html body #qmes-user-dropdown{
      background:#fff!important;color:#111827!important;border-color:#d7dee8!important;
      box-shadow:0 10px 28px rgba(15,23,42,.10)!important;
    }
    html body .qmes-submenu-title,
    html body #qmes-all-menu-dropdown .qmes-hover-title{background:#fff!important;color:#64748b!important;border-color:#e5eaf0!important}
    html body .qmes-submenu-button,
    html body #qmes-all-menu-dropdown button,
    html body #qmes-user-dropdown button{background:#fff!important;color:#334155!important;border-color:#e5eaf0!important}
    html body .qmes-submenu-button:hover,
    html body #qmes-all-menu-dropdown button:hover,
    html body #qmes-user-dropdown button:hover{background:#f1f5f9!important;color:#111827!important}
    html body .qmes-submenu-button.is-active{background:#eaf3ff!important;color:#1554b6!important}

    /* Left navigation */
    html body #qmes-sync-sidebar{
      background:#fff!important;color:#334155!important;border-right:1px solid #d7dee8!important;
      box-shadow:none!important;filter:none!important;
    }
    html body #qmes-sync-sidebar .qmes-side-search,
    html body #qmes-sync-sidebar .qmes-side-head{background:#fff!important;border-color:#e5eaf0!important}
    html body #qmes-sync-sidebar .qmes-side-search-box{background:#f8fafc!important;border-color:#d8e0ea!important}
    html body #qmes-sync-sidebar .qmes-side-search-input{background:#f8fafc!important;color:#334155!important}
    html body #qmes-sync-sidebar .qmes-side-title{color:#94a3b8!important}
    html body #qmes-sync-sidebar .qmes-side-item{background:transparent!important;color:#334155!important}
    html body #qmes-sync-sidebar .qmes-side-item:hover{background:#f1f5f9!important;color:#111827!important}
    html body #qmes-sync-sidebar .qmes-side-item.is-active{background:#eaf3ff!important;color:#1554b6!important}
    html body #qmes-sync-hamburger{background:#fff!important;color:#263548!important;border-color:#d8dee7!important;box-shadow:none!important}

    /* Main canvas */
    html body #root>div>main{
      background:#f5f7fb!important;color:#111827!important;
    }

    /* Convert the old dark Tailwind palette only inside application content. */
    html body #root>div>main .bg-slate-950,
    html body #root>div>main .bg-slate-900,
    html body #root>div>main .bg-slate-900\/80{
      background:#fff!important;background-color:#fff!important;background-image:none!important;
      color:#111827!important;border-color:#d7dee8!important;
      box-shadow:0 5px 16px rgba(15,23,42,.07)!important;
    }
    html body #root>div>main .bg-slate-800,
    html body #root>div>main .bg-slate-800\/60,
    html body #root>div>main .bg-slate-800\/50,
    html body #root>div>main .bg-slate-800\/40,
    html body #root>div>main .bg-slate-700{
      background:#f8fafc!important;background-color:#f8fafc!important;background-image:none!important;
      color:#334155!important;
    }
    html body #root>div>main .border-slate-900,
    html body #root>div>main .border-slate-800,
    html body #root>div>main .border-slate-800\/60,
    html body #root>div>main .border-slate-700,
    html body #root>div>main .border-slate-700\/60,
    html body #root>div>main .border-slate-600{
      border-color:#d7dee8!important;
    }
    html body #root>div>main .divide-slate-800\/60>:not([hidden])~:not([hidden]){border-color:#e5eaf0!important}
    html body #root>div>main .text-slate-100,
    html body #root>div>main .text-slate-200,
    html body #root>div>main .text-slate-300{color:#334155!important}
    html body #root>div>main .text-slate-400{color:#64748b!important}
    html body #root>div>main .text-slate-500,
    html body #root>div>main .text-slate-600{color:#64748b!important}
    html body #root>div>main .bg-slate-950 .text-white,
    html body #root>div>main .bg-slate-900 .text-white,
    html body #root>div>main .bg-slate-800 .text-white{color:#111827!important}
    html body #root>div>main .hover\:bg-slate-800:hover,
    html body #root>div>main .hover\:bg-slate-800\/30:hover{background:#eef2f7!important}
    html body #root>div>main .hover\:text-white:hover,
    html body #root>div>main .hover\:text-slate-200:hover{color:#111827!important}

    /* Shared Panel primitive and its headings. */
    html body #root>div>main div.bg-slate-900.border.border-slate-800.rounded-lg{
      background:#fff!important;border-color:#d7dee8!important;color:#111827!important;
      box-shadow:0 5px 16px rgba(15,23,42,.07)!important;
    }
    html body #root>div>main div.bg-slate-900.border.border-slate-800.rounded-lg>div.border-b{
      border-color:#e5eaf0!important;background:#fff!important;
    }
    html body #root>div>main div.bg-slate-900.border.border-slate-800.rounded-lg h3{color:#111827!important}

    /* Shared KPI cards: remove navy gradients but keep their accent color. */
    html body #root>div>main .qmes-hybrid-kpi-card,
    html body #root>div>main .qmes-text-kpi-card,
    html body #root>div>main .qmes-iqc-kpi-card,
    html body #root>div>main .qmes-pqc-kpi-grid>div,
    html body #root>div>main .qmes-oqc-kpi-grid>div{
      background:#fff!important;background-color:#fff!important;background-image:none!important;
      color:#111827!important;border-color:#d7dee8!important;
      box-shadow:0 5px 16px rgba(15,23,42,.07)!important;
      clip-path:none!important;border-radius:12px!important;
    }
    html body #root>div>main .qmes-hybrid-kpi-card::before,
    html body #root>div>main .qmes-hybrid-kpi-card .qmes-hybrid-copy::after,
    html body #root>div>main .qmes-hybrid-kpi-card .qmes-hybrid-copy::before{display:none!important}
    html body #root>div>main .qmes-hybrid-ring-inner{background:#fff!important;border-color:#dbe3ec!important;box-shadow:none!important}
    html body #root>div>main .qmes-hybrid-label,
    html body #root>div>main .qmes-text-kpi-card .qmes-hybrid-label{color:#475569!important;text-shadow:none!important}
    html body #root>div>main .qmes-hybrid-value,
    html body #root>div>main .qmes-text-kpi-card .qmes-hybrid-value{color:#111827!important;text-shadow:none!important}
    html body #root>div>main .qmes-hybrid-unit,
    html body #root>div>main .qmes-text-kpi-card .qmes-hybrid-unit,
    html body #root>div>main .qmes-hybrid-caption,
    html body #root>div>main .qmes-text-kpi-caption{color:#64748b!important}

    /* Forms, search fields and table controls in old dark pages. */
    html body #root>div>main input:not([type="checkbox"]):not([type="radio"]),
    html body #root>div>main select,
    html body #root>div>main textarea{
      background:#fff!important;color:#111827!important;border-color:#cbd5e1!important;
      box-shadow:none!important;
    }
    html body #root>div>main input::placeholder,
    html body #root>div>main textarea::placeholder{color:#94a3b8!important}
    html body #root>div>main table{color:#334155!important}
    html body #root>div>main thead,
    html body #root>div>main thead tr{background:#f8fafc!important;color:#475569!important}
    html body #root>div>main tbody tr{border-color:#e5eaf0!important}

    /* LOT / NCR / GQMS / 4M / equipment dark feature panels. */
    html body #root>div>main [class*="qmes-"][class*="panel"],
    html body #root>div>main [class*="qmes-"][class*="section"]{
      border-color:#d7dee8!important;
    }
    html body #root>div>main .qmes-equipment-alarm-panel,
    html body #root>div>main .qmes-equipment-management-summary>div,
    html body #root>div>main .qmes-iqc-ledger-panel,
    html body #root>div>main .qmes-iqc-quickbar,
    html body #root>div>main .qmes-iqc-ledger-section,
    html body #root>div>main .qmes-iqc-chart-panel{
      background:#fff!important;color:#111827!important;border-color:#d7dee8!important;
    }

    /* Keep semantic status colors, but on light backgrounds. */
    html body #root>div>main .bg-emerald-500\/10,
    html body #root>div>main .bg-emerald-500\/20{background:rgba(16,185,129,.10)!important}
    html body #root>div>main .bg-red-500\/10,
    html body #root>div>main .bg-red-500\/20{background:rgba(239,68,68,.10)!important}
    html body #root>div>main .bg-amber-500\/10,
    html body #root>div>main .bg-amber-500\/5{background:rgba(245,158,11,.10)!important}
    html body #root>div>main .bg-sky-500\/10,
    html body #root>div>main .bg-sky-500\/15,
    html body #root>div>main .bg-sky-500\/20{background:rgba(37,99,235,.09)!important}

    /* Prevent late sidebar setup from shifting the top menu on load. */
    html body:not(.qmes-side-open) #root .qmes-top-menu{transform:none!important;width:100%!important;padding-left:10px!important}

    @media(max-width:900px){
      html body #root>div>header>div:first-child{height:60px!important;min-height:60px!important;max-height:60px!important;padding:0 14px!important}
      html body #root>div>header img[alt="NAMO Chemical"]{height:36px!important;max-height:36px!important;max-width:190px!important}
    }
  `;
  document.head.appendChild(style);
})();
