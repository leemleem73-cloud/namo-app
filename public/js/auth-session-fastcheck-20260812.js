/* QMES auth/session + first-paint bootstrap
 * Keep the login screen visually stable. QMES shell/theme styles are loaded
 * only after the server confirms a valid session or a login succeeds.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  let authMeInFlight=null;
  let uiStylesPromise=null;

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

  function fieldInputFirstPaint(){
    try{return sessionStorage.getItem("qmes_current_tab")==="pop";}catch(_error){return false;}
  }

  function waitForStyle(link){
    if(link.sheet) return Promise.resolve();
    return new Promise(resolve=>{
      let done=false;
      const finish=()=>{
        if(done) return;
        done=true;
        link.removeEventListener("load",finish);
        link.removeEventListener("error",finish);
        resolve();
      };
      link.addEventListener("load",finish,{once:true});
      link.addEventListener("error",finish,{once:true});
      global.setTimeout(finish,900);
    });
  }

  function installCurrentUiBeforeRender(){
    if(global.__QMES_CURRENT_UI_BOOTSTRAP_20260826__) return Promise.resolve();
    if(uiStylesPromise) return uiStylesPromise;

    uiStylesPromise=Promise.all(styles.map(([id,href,keepDuringField])=>{
      let link=document.getElementById(id);
      if(!link){
        link=document.createElement("link");
        link.id=id;
        link.rel="stylesheet";
        link.href=href;
        if(fieldInputFirstPaint()&&!keepDuringField) link.media="not all";
        document.head.appendChild(link);
      }else if(String(link.getAttribute("href")||"")!==href){
        link.href=href;
      }
      return waitForStyle(link);
    })).then(()=>{
      global.__QMES_CURRENT_UI_BOOTSTRAP_20260826__=true;
    }).catch(error=>{
      console.warn("[QMES] UI style bootstrap warning",error);
      global.__QMES_CURRENT_UI_BOOTSTRAP_20260826__=true;
    });

    return uiStylesPromise;
  }

  global.__QMES_INSTALL_CURRENT_UI_STYLES__=installCurrentUiBeforeRender;

  function authOptions(init){
    const options={...(init||{})};
    if(!options.credentials) options.credentials="same-origin";
    options.cache="no-store";
    return options;
  }

  global.fetch=function(input,init){
    const url=typeof input==="string"?input:(input&&input.url)||"";

    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      const options=authOptions(init);
      if(!authMeInFlight){
        authMeInFlight=nativeFetch(input,options)
          .then(async response=>{
            if(response.ok) await installCurrentUiBeforeRender();
            return response;
          })
          .finally(()=>{global.setTimeout(()=>{authMeInFlight=null;},0);});
      }
      return authMeInFlight.then(response=>response.clone());
    }

    if(/\/api\/auth\/login(?:\?|$)/.test(url)){
      return nativeFetch(input,authOptions(init)).then(async response=>{
        if(response.ok) await installCurrentUiBeforeRender();
        return response;
      });
    }

    return nativeFetch(input,init);
  };
})(window);
