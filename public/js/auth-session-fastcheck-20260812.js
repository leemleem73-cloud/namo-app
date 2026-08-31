/* QMES authentication boundary - 2026-08-31
 * Prevents first-paint flicker and transient 401s by verifying the server
 * session before shared QMES synchronization is allowed to reach the UI.
 */
(function installQmesAuthBoundary(global){
  "use strict";
  if(global.__QMES_AUTH_BOUNDARY_20260831__) return;
  global.__QMES_AUTH_BOUNDARY_20260831__=true;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  let verified=false;
  let verifyInFlight=null;
  let initialCheckDone=false;

  const urlOf=input=>typeof input==="string"?input:String(input?.url||"");
  const methodOf=(input,init)=>String(init?.method||input?.method||"GET").toUpperCase();
  const authOptions=init=>({
    ...(init||{}),
    credentials:"same-origin",
    cache:"no-store",
    headers:{"Accept":"application/json",...((init&&init.headers)||{})}
  });

  function setVerified(value,user){
    verified=Boolean(value);
    global.__QMES_AUTH_VERIFIED__=verified;
    if(verified) global.__QMES_AUTH_VERIFIED_USER__=user||null;
    else delete global.__QMES_AUTH_VERIFIED_USER__;
  }

  async function payloadOf(response){
    try{return await response.clone().json();}catch(_error){return null;}
  }

  async function verifyServerSession(force){
    if(verified&&!force) return global.__QMES_AUTH_VERIFIED_USER__||null;
    if(verifyInFlight) return verifyInFlight;

    verifyInFlight=(async()=>{
      const response=await nativeFetch("/api/auth/me",authOptions({method:"GET"}));
      const payload=await payloadOf(response);
      initialCheckDone=true;

      if(!response.ok||!payload?.success||!payload?.data){
        setVerified(false);
        const error=new Error(payload?.message||"로그인 세션을 확인할 수 없습니다.");
        error.status=response.status;
        throw error;
      }

      setVerified(true,payload.data);
      try{
        global.__QMES_CURRENT_USER__=payload.data;
        global.__QMES_USER__=payload.data;
      }catch(_error){}
      try{global.dispatchEvent(new CustomEvent("qmes:auth-verified",{detail:{user:payload.data}}));}catch(_error){}
      return payload.data;
    })().finally(()=>{verifyInFlight=null;});

    return verifyInFlight;
  }

  async function waitForInitialAuth(){
    if(verified) return true;
    try{
      await verifyServerSession(false);
      return true;
    }catch(_error){
      return false;
    }
  }

  global.fetch=async function qmesAuthSafeFetch(input,init){
    const url=urlOf(input);
    const method=methodOf(input,init);

    if(/\/api\/auth\/login(?:\?|$)/.test(url)){
      setVerified(false);
      const response=await nativeFetch(input,authOptions(init));
      const payload=await payloadOf(response);
      if(!response.ok||!payload?.success||!payload?.data?.user) return response;
      try{
        await verifyServerSession(true);
        return response;
      }catch(error){
        console.error("[QMES AUTH] 로그인 직후 서버 세션 검증 실패",error);
        return response;
      }
    }

    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      const response=await nativeFetch(input,authOptions(init));
      const payload=await payloadOf(response);
      initialCheckDone=true;
      setVerified(Boolean(response.ok&&payload?.success&&payload?.data),payload?.data);
      return response;
    }

    if(/\/api\/auth\/logout(?:\?|$)/.test(url)){
      try{return await nativeFetch(input,authOptions(init));}
      finally{setVerified(false);initialCheckDone=true;}
    }

    if(/\/api\/qmes-sync\//.test(url)){
      /* Do not return a fake empty 200 while authentication is pending.
         That temporary [] made React render empty inventory/workorder data and
         repaint it again after authentication, which looked like screen flicker. */
      if(!verified){
        const authenticated=await waitForInitialAuth();
        if(!authenticated){
          return nativeFetch(input,authOptions(init));
        }
      }

      let response=await nativeFetch(input,authOptions(init));
      if(response.status!==401) return response;

      /* One forced session re-check handles a transient session-store race.
         Retry the original request only once; never reload the page. */
      try{
        await verifyServerSession(true);
        response=await nativeFetch(input,authOptions(init));
        if(response.status!==401) return response;
      }catch(_error){}

      setVerified(false);
      try{sessionStorage.removeItem("qmes-current-user-v1");}catch(_error){}
      delete global.__QMES_CURRENT_USER__;
      delete global.__QMES_USER__;
      try{global.dispatchEvent(new CustomEvent("qmes:auth-expired"));}catch(_error){}
      return response;
    }

    return nativeFetch(input,init);
  };

  global.qmesVerifyServerSession=verifyServerSession;
  setVerified(false);

  /* Start verification immediately, before qmes-sync.js begins its first load.
     Failure is intentionally silent here: the normal login UI owns that state. */
  Promise.resolve().then(()=>verifyServerSession(false)).catch(()=>{
    initialCheckDone=true;
  });
})(window);
