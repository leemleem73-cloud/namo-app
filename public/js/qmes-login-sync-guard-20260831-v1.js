/* NAMO QMES - login/sync bootstrap coordinator - 2026-09-01 */
(function installQmesLoginSyncCoordinator(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_COORDINATOR_20260901__) return;
  global.__QMES_LOGIN_SYNC_COORDINATOR_20260901__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const SIDEBAR_GUARD="__QMES_SYNC_SIDEBAR_V12_11__";
  const SIDEBAR_SRC="./js/qmes-collapsible-side-menu.js?v=20260901-authgate1";
  const QUALITY_UI_SRC="./js/qmes-quality-inspection-ui-20260901.js?v=20260901-quality28-output-frame-86vw";
  const nativeFetch=global.fetch.bind(global);

  const LOGIN_THEME_STYLE_ID="qmes-login-theme-isolation-20260901";
  if(!document.getElementById(LOGIN_THEME_STYLE_ID)){
    const style=document.createElement("style");
    style.id=LOGIN_THEME_STYLE_ID;
    style.textContent=`
      html body:not(:has(#root > div > header)){background:#07162b!important;}
      html body:not(:has(#root > div > header)) #root#root#root#root,
      html body:not(:has(#root > div > header)) #root#root#root#root > div{min-height:100vh!important;background:linear-gradient(135deg,#07162b,#0c3156)!important;}
      html,body,#root,select,option,optgroup{color-scheme:light!important;}
      html body #root select,html body #root select:hover,html body #root select:focus,html body #root select:focus-visible,html body #root select:active{-webkit-appearance:none!important;appearance:none!important;color-scheme:light!important;forced-color-adjust:none!important;background-color:#fff!important;background-image:linear-gradient(45deg,transparent 50%,#64748b 50%),linear-gradient(135deg,#64748b 50%,transparent 50%)!important;background-position:calc(100% - 12px) 50%,calc(100% - 7px) 50%!important;background-size:5px 5px,5px 5px!important;background-repeat:no-repeat!important;color:#111827!important;border-color:#cbd5e1!important;outline:none!important;box-shadow:none!important;filter:none!important;transition:none!important;-webkit-text-fill-color:#111827!important;padding-right:28px!important;}
      html body #root select::-ms-expand{display:none!important;}
      html body #root select option,html body #root select optgroup{color-scheme:light!important;background:#fff!important;background-color:#fff!important;color:#111827!important;-webkit-text-fill-color:#111827!important;}
      html body #root select option:checked{background:#eaf3ff!important;background-color:#eaf3ff!important;color:#111827!important;}
      html body #root select:disabled,html body #root select:disabled option{background-color:#f1f5f9!important;color:#64748b!important;-webkit-text-fill-color:#64748b!important;}
    `;
    document.head.appendChild(style);
  }

  let hasSavedSession=false;try{hasSavedSession=Boolean(sessionStorage.getItem(SESSION_KEY));}catch(_error){}
  let sidebarDeferred=true;global[SIDEBAR_GUARD]=true;
  function currentUserReady(){const user=global.__QMES_CURRENT_USER__;return Boolean(user&&typeof user==="object"&&(user.id||user.uid||user.name));}
  function loadQualityInspectionUi(){
    const current=Array.from(document.scripts).find(script=>String(script.src||"").includes("qmes-quality-inspection-ui-20260901.js"));
    if(current&&String(current.src||"").includes("quality28-output-frame-86vw")) return;
    if(current) current.remove();
    const script=document.createElement("script");script.src=QUALITY_UI_SRC;script.async=false;document.head.appendChild(script);
  }
  function releaseSidebarAfterLogin(){if(!sidebarDeferred) return;let attempts=0;const release=()=>{if(!sidebarDeferred)return;attempts+=1;if(!currentUserReady()){if(attempts<200)global.setTimeout(release,50);return;}sidebarDeferred=false;loadQualityInspectionUi();try{delete global[SIDEBAR_GUARD];}catch(_error){global[SIDEBAR_GUARD]=false;}if(Array.from(document.scripts).some(script=>String(script.src||"").includes("20260901-authgate1")))return;const script=document.createElement("script");script.src=SIDEBAR_SRC;script.async=false;document.head.appendChild(script);};global.setTimeout(release,0);}
  let authState=hasSavedSession?"pending":"anonymous",authCheckPromise=null,authCheckResponse=null;
  function urlOf(input){try{if(typeof input==="string")return new URL(input,global.location.href);if(input&&input.url)return new URL(input.url,global.location.href);}catch(_error){}return null;}
  function isSameOrigin(url){return Boolean(url&&url.origin===global.location.origin);}function isAuthMe(url){return isSameOrigin(url)&&url.pathname==="/api/auth/me";}function isAuthLogin(url){return isSameOrigin(url)&&url.pathname==="/api/auth/login";}function isAuthLogout(url){return isSameOrigin(url)&&url.pathname==="/api/auth/logout";}function isQmesSync(url){return isSameOrigin(url)&&url.pathname.startsWith("/api/qmes-sync/");}
  async function inspectAuthResponse(response){let payload=null;try{payload=await response.clone().json();}catch(_error){}authState=(response.ok&&payload?.success&&payload?.data)?"authenticated":"anonymous";global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;if(authState==="authenticated")releaseSidebarAfterLogin();try{global.dispatchEvent(new CustomEvent("qmes:auth-bootstrap-settled",{detail:{state:authState}}));}catch(_error){}return response;}
  function ensureAuthCheck(){if(authCheckResponse)return Promise.resolve(authCheckResponse.clone());if(!authCheckPromise){authCheckPromise=nativeFetch("/api/auth/me",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}}).then(inspectAuthResponse).then(response=>{authCheckResponse=response.clone();return response;}).catch(error=>{authState="anonymous";global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;throw error;}).finally(()=>{authCheckPromise=null;});}return authCheckPromise.then(response=>response.clone());}
  global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
  global.fetch=async function coordinatedFetch(input,init){const url=urlOf(input);if(isAuthMe(url)){if(authState==="anonymous"&&!hasSavedSession)return nativeFetch(input,{...(init||{}),credentials:(init&&init.credentials)||"same-origin",cache:"no-store"});return ensureAuthCheck();}if(isQmesSync(url)&&authState==="pending"){try{await ensureAuthCheck();}catch(_error){}}const response=await nativeFetch(input,init);if(isAuthLogin(url)&&response.ok){authState="authenticated";hasSavedSession=true;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;releaseSidebarAfterLogin();}else if(isAuthLogout(url)&&response.ok){authState="anonymous";hasSavedSession=false;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;document.getElementById("qmes-sync-sidebar")?.remove();document.getElementById("qmes-sync-hamburger")?.remove();document.body?.classList.remove("qmes-side-open");}return response;};
})(window);