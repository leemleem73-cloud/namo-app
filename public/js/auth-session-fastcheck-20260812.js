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

/* Critical first-paint menu palette.
 * This is intentionally loaded before the React/Babel modules so F5 never paints
 * the previous dark QMES navigation while the late runtime helpers are loading.
 */
(function installQmesPreviewCriticalTheme(){
  if(document.getElementById("qmes-preview-critical-theme-20260826")) return;
  const style=document.createElement("style");
  style.id="qmes-preview-critical-theme-20260826";
  style.textContent=`
    html{color-scheme:light!important;background:#f5f7fb!important}
    body{background:#f5f7fb!important;color:#111827!important}
    #root>div{background:#f5f7fb!important;color:#111827!important}
    #root>div>header{background:#fff!important;color:#111827!important;border-color:#d7dee8!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    #root>div>header>div:first-child{background:#fff!important;border-color:#d7dee8!important}
    #root>div>header img[alt="NAMO Chemical"]{filter:none!important}
    .qmes-top-menu-bar,.qmes-top-menu{background:#fff!important;border-color:#d7dee8!important;box-shadow:none!important}
    .qmes-top-menu-button{background:#fff!important;color:#111827!important;border-color:transparent!important;box-shadow:none!important}
    .qmes-top-menu-button span,.qmes-top-menu-button svg,.qmes-top-menu-button i,.qmes-top-menu-button b{color:currentColor!important}
    .qmes-top-menu-button:hover,.qmes-top-menu-button:focus-visible{background:#f1f5f9!important;color:#111827!important}
    .qmes-top-menu-button.is-active{background:#eef6ff!important;color:#174ea6!important;border-bottom-color:#2563eb!important}
    .qmes-submenu-row,#qmes-all-menu-dropdown,#qmes-user-dropdown{background:#fff!important;color:#111827!important;border-color:#d7dee8!important}
    .qmes-submenu-button,#qmes-all-menu-dropdown button,#qmes-user-dropdown button{background:#fff!important;color:#334155!important}
    .qmes-submenu-button.is-active{background:#eaf3ff!important;color:#1554b6!important}
    #qmes-sync-sidebar{background:#fff!important;color:#334155!important;border-right:1px solid #d7dee8!important;box-shadow:none!important}
    #qmes-sync-sidebar .qmes-side-item{background:transparent!important;color:#334155!important}
    #qmes-sync-sidebar .qmes-side-item:hover{background:#f1f5f9!important;color:#111827!important}
    #qmes-sync-sidebar .qmes-side-item.is-active{background:#eaf3ff!important;color:#1554b6!important}
    #qmes-sync-hamburger{background:#fff!important;color:#263548!important;border-color:#d8dee7!important;box-shadow:none!important}
  `;
  document.head.appendChild(style);
})();
