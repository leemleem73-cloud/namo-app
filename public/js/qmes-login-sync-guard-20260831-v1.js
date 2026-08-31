/* NAMO QMES - early authentication / sync guard - 2026-08-31
 * ADD-ONLY patch. This must be the FIRST local script loaded by index.html.
 *
 * Purpose
 * - stop every protected background API call before server login is verified
 * - prevent qmes-sync.js 401 reload loops on the login screen
 * - verify POST /api/auth/login with GET /api/auth/me before React receives success
 * - keep the existing QMES feature files untouched
 */
(function installQmesLoginSyncGuard(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__) return;
  global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__=true;

  /* Own authentication before the older auth-session-fastcheck file loads. */
  global.__QMES_AUTH_BOUNDARY_20260831__=true;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;
  global.__QMES_AUTH_RELOAD_PENDING__=true;

  const nativeFetch=global.fetch.bind(global);
  let serverVerified=false;
  let verifyPromise=null;
  let expiryReloadScheduled=false;

  const urlOf=input=>typeof input==="string"?input:String(input?.url||"");
  const methodOf=(input,init)=>String(init?.method||input?.method||"GET").toUpperCase();
  const sameOriginOptions=init=>({
    ...(init||{}),
    credentials:"same-origin",
    cache:"no-store"
  });
  const jsonResponse=(status,payload)=>new Response(JSON.stringify(payload),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
  });
  const readJson=async response=>{
    try{return await response.clone().json();}catch(_error){return null;}
  };

  function setVerified(value,user){
    serverVerified=Boolean(value);
    global.__QMES_AUTH_VERIFIED__=serverVerified;
    if(serverVerified){
      global.__QMES_AUTH_VERIFIED_USER__=user||null;
    }else{
      delete global.__QMES_AUTH_VERIFIED_USER__;
    }
  }

  function clearBrowserAuth(){
    try{sessionStorage.removeItem("qmes-current-user-v1");}catch(_error){}
    delete global.__QMES_CURRENT_USER__;
    delete global.__QMES_USER__;
    setVerified(false);
  }

  async function verifyWithServer(){
    if(verifyPromise) return verifyPromise;
    verifyPromise=(async()=>{
      const response=await nativeFetch("/api/auth/me",sameOriginOptions({
        method:"GET",
        headers:{"Accept":"application/json"}
      }));
      const payload=await readJson(response);
      const valid=Boolean(response.ok&&payload?.success&&payload?.data);
      setVerified(valid,payload?.data||null);
      if(!valid){
        const error=new Error(payload?.message||"로그인 세션을 확인할 수 없습니다.");
        error.status=response.status;
        throw error;
      }
      try{global.dispatchEvent(new CustomEvent("qmes:auth-verified",{detail:{user:payload.data}}));}catch(_error){}
      return payload.data;
    })().finally(()=>{verifyPromise=null;});
    return verifyPromise;
  }

  function isAuthApi(url){return /\/api\/auth\//.test(url);}
  function isPublicApi(url){return /\/api\/(?:auth\/|test-db(?:\?|$))/.test(url);}
  function isProtectedApi(url){return /\/api\//.test(url)&&!isPublicApi(url);}

  function scheduleStableLoginReload(){
    if(expiryReloadScheduled) return;
    expiryReloadScheduled=true;
    clearBrowserAuth();
    try{global.dispatchEvent(new CustomEvent("qmes:auth-expired"));}catch(_error){}
    /* One controlled reload only. On the next boot this guard blocks every protected
       API until a fresh login, so the old reload loop cannot restart. */
    global.setTimeout(()=>global.location.reload(),120);
  }

  global.fetch=async function qmesEarlyAuthFetch(input,init){
    const url=urlOf(input);
    const method=methodOf(input,init);

    if(/\/api\/auth\/login(?:\?|$)/.test(url)){
      clearBrowserAuth();
      const response=await nativeFetch(input,sameOriginOptions(init));
      const payload=await readJson(response);
      if(!response.ok||!payload?.success||!payload?.data?.user){
        setVerified(false);
        return response;
      }
      try{
        await verifyWithServer();
        return response;
      }catch(error){
        console.error("[QMES AUTH GUARD] 로그인 성공 응답 후 세션 검증 실패",error);
        clearBrowserAuth();
        return jsonResponse(503,{
          success:false,
          message:"로그인 정보는 확인됐지만 서버 세션이 유지되지 않습니다. 서버 세션 설정을 확인해 주세요.",
          data:null
        });
      }
    }

    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      const response=await nativeFetch(input,sameOriginOptions(init));
      const payload=await readJson(response);
      setVerified(Boolean(response.ok&&payload?.success&&payload?.data),payload?.data||null);
      return response;
    }

    if(/\/api\/auth\/logout(?:\?|$)/.test(url)){
      try{return await nativeFetch(input,sameOriginOptions(init));}
      finally{clearBrowserAuth();}
    }

    /* The login page needs no protected business API. Returning a local empty result
       prevents old modules from reaching Express requireLogin before authentication. */
    if(isProtectedApi(url)&&!serverVerified&&!global.__QMES_AUTH_VERIFIED__){
      if(method==="GET") return jsonResponse(200,{success:true,message:"LOGIN_PENDING",data:[]});
      return jsonResponse(503,{success:false,message:"로그인 확인 후 사용할 수 있습니다.",data:null});
    }

    const response=await nativeFetch(input,sameOriginOptions(init));

    if(isProtectedApi(url)&&response.status===401){
      /* If a protected request loses its session, verify once. A real session expiry
         gets one controlled return to login; qmes-sync.js is never allowed to loop. */
      try{
        await verifyWithServer();
        return await nativeFetch(input,sameOriginOptions(init));
      }catch(_error){
        scheduleStableLoginReload();
        return jsonResponse(503,{success:false,message:"로그인 세션이 만료되었습니다.",data:null});
      }
    }

    return response;
  };

  global.qmesVerifyServerSession=verifyWithServer;
  setVerified(false);
})(window);
