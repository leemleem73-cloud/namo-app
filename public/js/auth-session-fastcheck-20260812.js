/* QMES auth/session + first-paint bootstrap
 * Keep auth handling minimal and avoid repeated fetch retries that can
 * bounce the login state or trigger visible first-paint flicker.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  /* qmes-sync.js reloads the whole page on any 401. Several shared modules are
     loaded before React decides whether the user is authenticated, so a normal
     pre-login 401 can otherwise become a reload loop. Keep that reload guard on
     until QMESApp has actually published a verified current user. */
  global.__QMES_AUTH_RELOAD_PENDING__=true;
  const authReadyTimer=global.setInterval(()=>{
    const user=global.__QMES_CURRENT_USER__;
    if(!user||typeof user!=="object"||!(user.id||user.uid||user.name)) return;
    delete global.__QMES_AUTH_RELOAD_PENDING__;
    global.clearInterval(authReadyTimer);
  },100);

  const nativeFetch=global.fetch.bind(global);
  global.fetch=function(input,init){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    if(!/\/api\/auth\/me(?:\?|$)/.test(url)) return nativeFetch(input,init);

    const options={...(init||{})};
    if(!options.credentials) options.credentials="same-origin";
    options.cache="no-store";

    // Do not auto-retry auth/me here. A delayed second auth request can race
    // the initial app bootstrap and make the login/main screen flash or bounce.
    return nativeFetch(input,options);
  };
})(window);

/* Restore the confirmed Field Input ownership model without toggling styles
 * that are already present in the document. This keeps the shared shell
 * stable during first paint and avoids visible stylesheet on/off flashes.
 */
(function installCurrentUiBeforeRender(){
  "use strict";
  if(window.__QMES_CURRENT_UI_BOOTSTRAP_20260826__) return;
  window.__QMES_CURRENT_UI_BOOTSTRAP_20260826__=true;

  let fieldInputFirstPaint=false;
  try{fieldInputFirstPaint=sessionStorage.getItem("qmes_current_tab")==="pop";}catch(_error){}

  const styles=[
    ["qmes-enterprise-ui-20260826","./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise3",false],
    ["qmes-shell-offset-fix-20260826","./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1",true],
    ["qmes-shell-readable-size-20260827","./css/qmes-shell-readable-size-20260827.css?v=20260827-2",true],
    ["qmes-enterprise-readable-size-20260826","./css/qmes-enterprise-readable-size-20260826.css?v=20260826-readable2",false],
    ["qmes-modern-corporate-ui-20260826","./css/qmes-modern-corporate-ui-20260826.css?v=20260826-modern2",false],
    ["qmes-sidebar-line-align-20260826","./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2",true],
    ["qmes-production-process-corporate-fix-20260826","./css/qmes-production-process-corporate-fix-20260826.css?v=20260826-process2",false],
    ["qmes-workorder-issued-clean-20260826","./css/qmes-workorder-issued-clean-20260826.css?v=20260826-workorder1",false],
    ["qmes-text-sharpness-20260826","./css/qmes-text-sharpness-20260826.css?v=20260826-sharp1",false],
    ["qmes-spc-readability-fix-20260826","./css/qmes-spc-readability-fix-20260826.css?v=20260826-spc1",false],
    ["qmes-shared-shell-final-20260827","./css/qmes-shared-shell-final-20260827.css?v=20260827-1",true],
    ["qmes-responsive-main-layout-20260827","./css/qmes-responsive-main-layout-20260827.css?v=20260827-1",false],
    ["qmes-header-stable-20260827","./css/qmes-header-stable-20260827.css?v=20260827-1",true]
  ];

  styles.forEach(([id,href,keepDuringField])=>{
    let link=document.getElementById(id);
    if(!link){
      link=document.createElement("link");
      link.id=id;
      link.rel="stylesheet";
      link.href=href;
      if(fieldInputFirstPaint&&!keepDuringField) link.media="not all";
      document.head.appendChild(link);
      return;
    }

    // Existing styles are left untouched during bootstrap so the browser does
    // not repaint the whole app because of media/disabled flips.
    if(String(link.getAttribute("href")||"")!==href) link.href=href;
  });
})();