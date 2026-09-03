/* NAMO QMES - auth/sync coordinator only. No visual/theme injection. */
(function installQmesLoginSyncCoordinator(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_COORDINATOR_CORE_20260903__) return;
  global.__QMES_LOGIN_SYNC_COORDINATOR_CORE_20260903__=true;
  const SESSION_KEY="qmes-current-user-v1";
  const nativeFetch=global.fetch.bind(global);
  let hasSavedSession=false;try{hasSavedSession=Boolean(sessionStorage.getItem(SESSION_KEY));}catch(_error){}
  let authState=hasSavedSession?"pending":"anonymous",authCheckPromise=null,authCheckResponse=null;
  let optionalBackendDownUntil=0;
  function urlOf(input){try{if(typeof input==="string")return new URL(input,global.location.href);if(input&&input.url)return new URL(input.url,global.location.href);}catch(_error){}return null;}
  function isSameOrigin(url){return Boolean(url&&url.origin===global.location.origin);}
  function isAuthMe(url){return isSameOrigin(url)&&url.pathname==="/api/auth/me";}
  function isAuthLogin(url){return isSameOrigin(url)&&url.pathname==="/api/auth/login";}
  function isAuthLogout(url){return isSameOrigin(url)&&url.pathname==="/api/auth/logout";}
  function isQmesSync(url){return isSameOrigin(url)&&url.pathname.startsWith("/api/qmes-sync/");}
  function isPurchaseOrders(url){return isSameOrigin(url)&&url.pathname==="/api/purchase-orders";}
  function isOptionalBackend(url,method){return method==="GET"&&(isPurchaseOrders(url)||isQmesSync(url));}
  function emptyJsonResponse(){return new Response(JSON.stringify({success:true,message:"OK",data:[]}),{status:200,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
  async function inspectAuthResponse(response){let payload=null;try{payload=await response.clone().json();}catch(_error){}authState=(response.ok&&payload?.success&&payload?.data)?"authenticated":"anonymous";global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;return response;}
  function ensureAuthCheck(){if(authCheckResponse)return Promise.resolve(authCheckResponse.clone());if(!authCheckPromise){authCheckPromise=nativeFetch("/api/auth/me",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}}).then(inspectAuthResponse).then(response=>{authCheckResponse=response.clone();return response;}).finally(()=>{authCheckPromise=null;});}return authCheckPromise.then(response=>response.clone());}
  let purchaseGetInFlight=null,purchaseGetCache=null,purchaseGetCacheAt=0;
  function purchaseGet(input,init){const now=Date.now();if(purchaseGetCache&&now-purchaseGetCacheAt<1500){try{return Promise.resolve(purchaseGetCache.clone());}catch(_error){purchaseGetCache=null;}}if(purchaseGetInFlight)return purchaseGetInFlight.then(response=>response.clone());purchaseGetInFlight=nativeFetch(input,init).then(response=>{try{purchaseGetCache=response.clone();purchaseGetCacheAt=Date.now();}catch(_error){purchaseGetCache=null;}return response;}).finally(()=>{purchaseGetInFlight=null;});return purchaseGetInFlight.then(response=>response.clone());}
  global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
  global.fetch=async function coordinatedFetch(input,init){const url=urlOf(input);const method=String((init&&init.method)||(input&&input.method)||"GET").toUpperCase();if(isAuthMe(url)){if(authState==="anonymous"&&!hasSavedSession)return nativeFetch(input,{...(init||{}),credentials:(init&&init.credentials)||"same-origin",cache:"no-store"});return ensureAuthCheck();}if(isOptionalBackend(url,method)&&Date.now()<optionalBackendDownUntil)return emptyJsonResponse();if(isQmesSync(url)&&authState==="pending"){try{await ensureAuthCheck();}catch(_error){}}let response;if(isPurchaseOrders(url)&&method==="GET")response=await purchaseGet(input,init);else response=await nativeFetch(input,init);if(isOptionalBackend(url,method)&&response.status>=500){optionalBackendDownUntil=Date.now()+60000;return emptyJsonResponse();}if(isAuthLogin(url)&&response.ok){authState="authenticated";hasSavedSession=true;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;}else if(isAuthLogout(url)&&response.ok){authState="anonymous";hasSavedSession=false;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;}return response;};
})(window);
