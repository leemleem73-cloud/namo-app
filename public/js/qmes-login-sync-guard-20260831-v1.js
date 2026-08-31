/* NAMO QMES - login/sync bootstrap coordinator - 2026-09-01
 *
 * Keep app.jsx as the single UI/auth owner. This guard only coordinates network
 * ordering so background QMES sync cannot race the initial /api/auth/me check.
 *
 * Rules:
 * 1) A saved browser login is verified exactly once with /api/auth/me.
 * 2) Concurrent /api/auth/me callers share that one response.
 * 3) Authenticated QMES sync waits for the initial auth verdict before starting.
 * 4) This file never renders, removes, or replaces the React login screen.
 */
(function installQmesLoginSyncCoordinator(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_COORDINATOR_20260901__) return;
  global.__QMES_LOGIN_SYNC_COORDINATOR_20260901__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const nativeFetch=global.fetch.bind(global);

  let hasSavedSession=false;
  try{hasSavedSession=Boolean(sessionStorage.getItem(SESSION_KEY));}catch(_error){}

  let authState=hasSavedSession?"pending":"anonymous";
  let authCheckPromise=null;
  let authCheckResponse=null;

  function urlOf(input){
    try{
      if(typeof input==="string") return new URL(input,global.location.href);
      if(input&&input.url) return new URL(input.url,global.location.href);
    }catch(_error){}
    return null;
  }

  function isSameOrigin(url){
    return Boolean(url&&url.origin===global.location.origin);
  }

  function isAuthMe(url){return isSameOrigin(url)&&url.pathname==="/api/auth/me";}
  function isAuthLogin(url){return isSameOrigin(url)&&url.pathname==="/api/auth/login";}
  function isAuthLogout(url){return isSameOrigin(url)&&url.pathname==="/api/auth/logout";}
  function isQmesSync(url){return isSameOrigin(url)&&url.pathname.startsWith("/api/qmes-sync/");}

  async function inspectAuthResponse(response){
    let payload=null;
    try{payload=await response.clone().json();}catch(_error){}
    authState=(response.ok&&payload?.success&&payload?.data)?"authenticated":"anonymous";
    global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
    try{global.dispatchEvent(new CustomEvent("qmes:auth-bootstrap-settled",{detail:{state:authState}}));}catch(_error){}
    return response;
  }

  function ensureAuthCheck(){
    if(authCheckResponse) return Promise.resolve(authCheckResponse.clone());
    if(!authCheckPromise){
      authCheckPromise=nativeFetch("/api/auth/me",{
        credentials:"same-origin",
        cache:"no-store",
        headers:{Accept:"application/json"}
      })
        .then(inspectAuthResponse)
        .then(response=>{
          authCheckResponse=response.clone();
          return response;
        })
        .catch(error=>{
          authState="anonymous";
          global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
          throw error;
        })
        .finally(()=>{authCheckPromise=null;});
    }
    return authCheckPromise.then(response=>response.clone());
  }

  global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;

  global.fetch=async function coordinatedFetch(input,init){
    const url=urlOf(input);

    if(isAuthMe(url)){
      if(authState==="anonymous"&&!hasSavedSession){
        return nativeFetch(input,{...(init||{}),credentials:(init&&init.credentials)||"same-origin",cache:"no-store"});
      }
      return ensureAuthCheck();
    }

    if(isQmesSync(url)&&authState==="pending"){
      try{await ensureAuthCheck();}catch(_error){}
    }

    const response=await nativeFetch(input,init);

    if(isAuthLogin(url)&&response.ok){
      authState="authenticated";
      hasSavedSession=true;
      authCheckResponse=null;
      global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
    }else if(isAuthLogout(url)&&response.ok){
      authState="anonymous";
      hasSavedSession=false;
      authCheckResponse=null;
      global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
    }

    return response;
  };
})(window);
