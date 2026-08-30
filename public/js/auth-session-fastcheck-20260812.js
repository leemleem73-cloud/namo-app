/* QMES authentication boundary - 2026-08-31
 * Loads before qmes-sync.js and owns the login/session boundary.
 * Shared DB calls are NEVER allowed until /api/auth/me has verified the
 * cookie-backed server session. This also protects against stale sessionStorage.
 */
(function installQmesAuthBoundary(global){
  "use strict";
  if(global.__QMES_AUTH_BOUNDARY_20260831__) return;
  global.__QMES_AUTH_BOUNDARY_20260831__=true;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  let verified=false;
  let verifyInFlight=null;

  const urlOf=input=>typeof input==="string"?input:String(input?.url||"");
  const methodOf=(input,init)=>String(init?.method||input?.method||"GET").toUpperCase();
  const jsonResponse=(status,payload)=>new Response(JSON.stringify(payload),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
  });
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

  async function verifyServerSession(){
    if(verifyInFlight) return verifyInFlight;
    verifyInFlight=(async()=>{
      const response=await nativeFetch("/api/auth/me",authOptions({method:"GET"}));
      const payload=await payloadOf(response);
      if(!response.ok||!payload?.success||!payload?.data){
        setVerified(false);
        const error=new Error(payload?.message||"로그인 세션을 확인할 수 없습니다.");
        error.status=response.status;
        throw error;
      }
      setVerified(true,payload.data);
      try{global.dispatchEvent(new CustomEvent("qmes:auth-verified",{detail:{user:payload.data}}));}catch(_error){}
      return payload.data;
    })().finally(()=>{verifyInFlight=null;});
    return verifyInFlight;
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
        await verifyServerSession();
        return response;
      }catch(error){
        console.error("[QMES AUTH] 로그인 직후 서버 세션 검증 실패",error);
        return jsonResponse(503,{success:false,message:"로그인 세션 저장에 실패했습니다. 다시 로그인해 주세요.",data:null});
      }
    }

    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      const response=await nativeFetch(input,authOptions(init));
      const payload=await payloadOf(response);
      setVerified(Boolean(response.ok&&payload?.success&&payload?.data),payload?.data);
      return response;
    }

    if(/\/api\/auth\/logout(?:\?|$)/.test(url)){
      try{return await nativeFetch(input,authOptions(init));}
      finally{setVerified(false);}
    }

    if(/\/api\/qmes-sync\//.test(url)){
      /* Critical: stale browser session data must not count as authentication. */
      if(!verified&&!global.__QMES_AUTH_VERIFIED__){
        if(method==="GET") return jsonResponse(200,{success:true,message:"AUTH_PENDING",data:[]});
        return jsonResponse(503,{success:false,message:"로그인 확인 후 저장할 수 있습니다.",data:null});
      }

      const response=await nativeFetch(input,init);
      if(response.status!==401) return response;

      /* A 401 after verification means the server session itself was lost. Do not
         reload in a loop; downgrade to unauthenticated and let QMESApp show login. */
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
})(window);
