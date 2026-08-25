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

/* Critical first-paint menu layout + palette.
 * High-specificity selectors intentionally beat later runtime-injected menu styles,
 * so F5 cannot paint one navigation size and then jump to another after scripts settle.
 */
(function installQmesPreviewCriticalTheme(){
  if(document.getElementById("qmes-preview-critical-theme-20260826")) return;
  const style=document.createElement("style");
  style.id="qmes-preview-critical-theme-20260826";
  style.textContent=`
    html{color-scheme:light!important;background:#f5f7fb!important}
    html body{background:#f5f7fb!important;color:#111827!important}
    html body #root>div{background:#f5f7fb!important;color:#111827!important}

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
    html body #root .qmes-top-menu .qmes-top-menu-item:first-child{
      min-width:0!important;
    }
    html body #root .qmes-top-menu .qmes-top-menu-item:first-child .qmes-top-menu-button{
      min-width:0!important;
    }
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
    html body #root .qmes-top-menu-button[aria-current="page"]{
      background:#eef6ff!important;color:#174ea6!important;border-bottom-color:#2563eb!important;
    }

    html body .qmes-submenu-row,
    html body #qmes-all-menu-dropdown,
    html body #qmes-user-dropdown{
      background:#fff!important;color:#111827!important;border-color:#d7dee8!important;
      box-shadow:0 10px 28px rgba(15,23,42,.10)!important;
    }
    html body .qmes-submenu-button,
    html body #qmes-all-menu-dropdown button,
    html body #qmes-user-dropdown button{background:#fff!important;color:#334155!important}
    html body .qmes-submenu-button.is-active{background:#eaf3ff!important;color:#1554b6!important}

    html body #qmes-sync-sidebar{
      background:#fff!important;color:#334155!important;border-right:1px solid #d7dee8!important;
      box-shadow:none!important;filter:none!important;
    }
    html body #qmes-sync-sidebar .qmes-side-item{background:transparent!important;color:#334155!important}
    html body #qmes-sync-sidebar .qmes-side-item:hover{background:#f1f5f9!important;color:#111827!important}
    html body #qmes-sync-sidebar .qmes-side-item.is-active{background:#eaf3ff!important;color:#1554b6!important}
    html body #qmes-sync-hamburger{background:#fff!important;color:#263548!important;border-color:#d8dee7!important;box-shadow:none!important}

    /* Prevent late sidebar setup from shifting the top menu on load. */
    html body:not(.qmes-side-open) #root .qmes-top-menu{transform:none!important;width:100%!important;padding-left:10px!important}

    @media(max-width:900px){
      html body #root>div>header>div:first-child{height:60px!important;min-height:60px!important;max-height:60px!important;padding:0 14px!important}
      html body #root>div>header img[alt="NAMO Chemical"]{height:36px!important;max-height:36px!important;max-width:190px!important}
    }
  `;
  document.head.appendChild(style);
})();
