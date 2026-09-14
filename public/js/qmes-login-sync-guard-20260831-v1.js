/* NAMO QMES - auth/sync coordinator only. No visual/theme injection. */
/* Customer showcase is guest-only. Admin/member accounts always use the live QMES data path. */
(function installGuestOnlyDemoGate(global){
  "use strict";
  const SESSION_KEY="qmes-current-user-v1";
  const DEMO_GATE_KEY="qmes-customer-demo-guest-only-v1";
  const DEMO_SCRIPT="./js/qmes-guest-demo-20260914.js?v=20260914-guest-only5";
  const parse=value=>{try{return JSON.parse(String(value||""));}catch(_error){return null;}};
  const isExactGuest=user=>Boolean(user&&[
    user.role,user.id,user.uid,user.loginId,user.username,user.account
  ].some(value=>String(value||"").trim().toLowerCase()==="guest"));
  const getSessionUser=()=>{try{return parse(sessionStorage.getItem(SESSION_KEY));}catch(_error){return null;}};
  const demoLoaded=()=>Boolean(global.__QMES_CUSTOMER_SHOWCASE_20260914__||document.documentElement.getAttribute("data-qmes-demo")==="true");
  let reloadQueued=false;
  const reload=()=>{if(reloadQueued)return;reloadQueued=true;setTimeout(()=>global.location.reload(),0);};

  function setGateForUser(user,shouldReload=true){
    const guest=isExactGuest(user);
    try{
      if(guest)sessionStorage.setItem(DEMO_GATE_KEY,"1");
      else sessionStorage.removeItem(DEMO_GATE_KEY);
    }catch(_error){}
    if(shouldReload&&((guest&&!demoLoaded())||(!guest&&demoLoaded())))reload();
    return guest;
  }
  global.__QMES_IS_EXACT_GUEST__=isExactGuest;
  global.__QMES_SET_GUEST_DEMO_GATE__=setGateForUser;

  /* If the current stored user is not guest, remove any old demo gate immediately. */
  try{
    const storedUser=getSessionUser();
    if(!isExactGuest(storedUser))sessionStorage.removeItem(DEMO_GATE_KEY);
  }catch(_error){}

  /* Preload demo data only for an exact guest session with the dedicated gate. */
  try{
    const storedUser=getSessionUser();
    const gateOn=sessionStorage.getItem(DEMO_GATE_KEY)==="1";
    if(document.readyState==="loading"&&gateOn&&isExactGuest(storedUser)&&!global.__QMES_CUSTOMER_SHOWCASE_20260914__&&!document.querySelector("script[data-qmes-customer-demo-preload]")){
      document.write(`<script data-qmes-customer-demo-preload src="${DEMO_SCRIPT}"><\/script>`);
    }
  }catch(error){console.warn("[QMES] guest-only demo preload skipped",error);}

  /* Login code may write the authenticated user to sessionStorage. Track that change:
   * guest => enter isolated demo after one reload
   * admin/member => remove demo gate and reload back to the original live QMES */
  try{
    if(global.Storage&&global.Storage.prototype&&!global.__QMES_GUEST_ONLY_SESSION_WATCH_20260914__){
      global.__QMES_GUEST_ONLY_SESSION_WATCH_20260914__=true;
      const proto=global.Storage.prototype;
      const rawSet=proto.setItem;
      const rawRemove=proto.removeItem;

      proto.setItem=function(key,value){
        const name=String(key==null?"":key);
        const result=rawSet.call(this,key,value);
        if(this===global.sessionStorage&&name===SESSION_KEY){
          const user=parse(value);
          const guest=isExactGuest(user);
          try{if(guest)rawSet.call(global.sessionStorage,DEMO_GATE_KEY,"1");else rawRemove.call(global.sessionStorage,DEMO_GATE_KEY);}catch(_error){}
          if((guest&&!demoLoaded())||(!guest&&demoLoaded()))reload();
        }
        return result;
      };

      proto.removeItem=function(key){
        const name=String(key==null?"":key);
        const wasDemo=demoLoaded();
        const result=rawRemove.call(this,key);
        if(this===global.sessionStorage&&name===SESSION_KEY){
          try{rawRemove.call(global.sessionStorage,DEMO_GATE_KEY);}catch(_error){}
          if(wasDemo)reload();
        }
        return result;
      };
    }
  }catch(error){console.warn("[QMES] guest-only session watcher skipped",error);}
})(window);

(function installQmesLoginSyncCoordinator(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_COORDINATOR_CORE_20260903__) return;
  global.__QMES_LOGIN_SYNC_COORDINATOR_CORE_20260903__=true;
  const SESSION_KEY="qmes-current-user-v1";
  const DEMO_GATE_KEY="qmes-customer-demo-guest-only-v1";
  const nativeFetch=global.fetch.bind(global);
  let hasSavedSession=false;try{hasSavedSession=Boolean(sessionStorage.getItem(SESSION_KEY));}catch(_error){}
  let authState=hasSavedSession?"pending":"anonymous",authCheckPromise=null,authCheckResponse=null;
  let optionalBackendDownUntil=0;
  let gateReloadQueued=false;
  function queueGateReload(){if(gateReloadQueued)return;gateReloadQueued=true;setTimeout(()=>global.location.reload(),0);}
  function urlOf(input){try{if(typeof input==="string")return new URL(input,global.location.href);if(input&&input.url)return new URL(input.url,global.location.href);}catch(_error){}return null;}
  function isSameOrigin(url){return Boolean(url&&url.origin===global.location.origin);}
  function isAuthMe(url){return isSameOrigin(url)&&url.pathname==="/api/auth/me";}
  function isAuthLogin(url){return isSameOrigin(url)&&url.pathname==="/api/auth/login";}
  function isAuthLogout(url){return isSameOrigin(url)&&url.pathname==="/api/auth/logout";}
  function isQmesSync(url){return isSameOrigin(url)&&url.pathname.startsWith("/api/qmes-sync/");}
  function isPurchaseOrders(url){return isSameOrigin(url)&&url.pathname==="/api/purchase-orders";}
  function isOptionalBackend(url,method){return method==="GET"&&(isPurchaseOrders(url)||isQmesSync(url));}
  function sessionUser(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null")||null;}catch(_error){return null;}}
  function isGuestUser(user){return Boolean(user&&[
    user.role,user.id,user.uid,user.loginId,user.username,user.account
  ].some(value=>String(value||"").trim().toLowerCase()==="guest"));}
  function demoLoaded(){return Boolean(global.__QMES_CUSTOMER_SHOWCASE_20260914__||document.documentElement.getAttribute("data-qmes-demo")==="true");}
  function applyAuthoritativeUser(user){
    const guest=isGuestUser(user);
    try{if(guest)sessionStorage.setItem(DEMO_GATE_KEY,"1");else sessionStorage.removeItem(DEMO_GATE_KEY);}catch(_error){}
    if((guest&&!demoLoaded())||(!guest&&demoLoaded()))queueGateReload();
    return guest;
  }
  function canAccessCommercialErp(){const user=sessionUser()||{};if(isGuestUser(user))return true;const name=String(user.name||"").replace(/\s+/g,"").trim();const dept=String(user.department||user.dept||"").replace(/\s+/g,"").trim();return dept==="영업부"||["김종혁","김세희","정영기"].includes(name);}
  function emptyJsonResponse(){return new Response(JSON.stringify({success:true,message:"OK",data:[]}),{status:200,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
  async function inspectAuthResponse(response){
    let payload=null;try{payload=await response.clone().json();}catch(_error){}
    const authenticated=Boolean(response.ok&&payload?.success&&payload?.data);
    authState=authenticated?"authenticated":"anonymous";
    global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
    if(authenticated){applyAuthoritativeUser(payload?.data?.user||payload?.data||null);}
    else{try{sessionStorage.removeItem(DEMO_GATE_KEY);}catch(_error){}}
    return response;
  }
  function ensureAuthCheck(){if(authCheckResponse)return Promise.resolve(authCheckResponse.clone());if(!authCheckPromise){authCheckPromise=nativeFetch("/api/auth/me",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}}).then(inspectAuthResponse).then(response=>{authCheckResponse=response.clone();return response;}).finally(()=>{authCheckPromise=null;});}return authCheckPromise.then(response=>response.clone());}
  let purchaseGetInFlight=null,purchaseGetCache=null,purchaseGetCacheAt=0;
  function purchaseGet(input,init){const now=Date.now();if(purchaseGetCache&&now-purchaseGetCacheAt<1500){try{return Promise.resolve(purchaseGetCache.clone());}catch(_error){purchaseGetCache=null;}}if(purchaseGetInFlight)return purchaseGetInFlight.then(response=>response.clone());purchaseGetInFlight=nativeFetch(input,init).then(response=>{try{purchaseGetCache=response.clone();purchaseGetCacheAt=Date.now();}catch(_error){purchaseGetCache=null;}return response;}).finally(()=>{purchaseGetInFlight=null;});return purchaseGetInFlight.then(response=>response.clone());}
  global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
  global.fetch=async function coordinatedFetch(input,init){
    const url=urlOf(input);const method=String((init&&init.method)||(input&&input.method)||"GET").toUpperCase();
    if(isAuthMe(url)){if(authState==="anonymous"&&!hasSavedSession)return nativeFetch(input,{...(init||{}),credentials:(init&&init.credentials)||"same-origin",cache:"no-store"});return ensureAuthCheck();}
    if(isPurchaseOrders(url)&&method==="GET"&&!canAccessCommercialErp())return emptyJsonResponse();
    if(isOptionalBackend(url,method)&&Date.now()<optionalBackendDownUntil)return emptyJsonResponse();
    if(isQmesSync(url)&&authState==="pending"){try{await ensureAuthCheck();}catch(_error){}}
    let response;
    if(isPurchaseOrders(url)&&method==="GET")response=await purchaseGet(input,init);else response=await nativeFetch(input,init);
    if(isOptionalBackend(url,method)&&response.status>=500){optionalBackendDownUntil=Date.now()+60000;return emptyJsonResponse();}
    if(isAuthLogin(url)&&response.ok){
      authState="authenticated";hasSavedSession=true;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
      try{const payload=await response.clone().json();applyAuthoritativeUser(payload?.data?.user||payload?.data||null);}catch(_error){}
    }else if(isAuthLogout(url)&&response.ok){
      authState="anonymous";hasSavedSession=false;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
      try{sessionStorage.removeItem(DEMO_GATE_KEY);}catch(_error){}
    }
    return response;
  };
})(window);
