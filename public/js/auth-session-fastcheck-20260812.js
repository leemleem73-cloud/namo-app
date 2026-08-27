/* QMES auth/session + first-paint bootstrap
 * One owner for current global UI assets before React/Babel renders.
 * Field Input keeps the shared shell from the first paint while page-content themes stay isolated.
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
    if(!options.credentials) options.credentials="same-origin";
    options.cache="no-store";

    return nativeFetch(input,options).catch((firstError)=>
      new Promise((resolve)=>global.setTimeout(resolve,700))
        .then(()=>nativeFetch(input,options))
        .catch(()=>Promise.reject(firstError))
    );
  };
})(window);

/* Load the same shell/content ownership before application components render.
 * qmes_current_tab is persisted by the router, so Field Input can isolate only
 * page-content themes without changing header/top-nav/sidebar typography.
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
    ["qmes-shared-shell-final-20260827","./css/qmes-shared-shell-final-20260827.css?v=20260827-1",true]
  ];

  styles.forEach(([id,href,keepDuringField])=>{
    let link=document.getElementById(id);
    if(!link){
      link=document.createElement("link");
      link.id=id;
      link.rel="stylesheet";
      link.href=href;
      document.head.appendChild(link);
    }else if(String(link.getAttribute("href")||"")!==href){
      link.href=href;
    }
    link.media=fieldInputFirstPaint&&!keepDuringField?"not all":"all";
  });
})();