/* QMES authentication boundary - 2026-08-31
 * This file loads before qmes-sync.js and owns the login/session boundary.
 * Goals:
 * 1) Do not let background QMES sync requests force a reload while the login screen is active.
 * 2) After POST /api/auth/login, verify the cookie-backed server session with /api/auth/me
 *    before the React app is allowed to enter the main QMES screen.
 * 3) Keep the login first paint stable by avoiding theme/style mutations here.
 */
(function installQmesAuthBoundary(global){
  "use strict";
  if(global.__QMES_AUTH_BOUNDARY_20260831__) return;
  global.__QMES_AUTH_BOUNDARY_20260831__=true;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  let verified=false;
  let verifyInFlight=null;

  function urlOf(input){
    return typeof input==="string" ? input : String(input?.url||"");
  }

  function methodOf(input,init){
    return String(init?.method || input?.method || "GET").toUpperCase();
  }

  function authOptions(init){
    return {
      ...(init||{}),
      credentials:"same-origin",
      cache:"no-store",
      headers:{"Accept":"application/json",...((init&&init.headers)||{})}
    };
  }

  function markVerified(user){
    verified=true;
    global.__QMES_AUTH_VERIFIED__=true;
    global.__QMES_AUTH_VERIFIED_USER__=user||null;
    try{global.dispatchEvent(new CustomEvent("qmes:auth-verified",{detail:{user:user||null}}));}catch(_error){}
  }

  function markUnverified(){
    verified=false;
    global.__QMES_AUTH_VERIFIED__=false;
    delete global.__QMES_AUTH_VERIFIED_USER__;
  }

  async function parseClone(response){
    try{return await response.clone().json();}catch(_error){return null;}
  }

  async function verifyServerSession(){
    if(verifyInFlight) return verifyInFlight;
    verifyInFlight=(async()=>{
      const response=await nativeFetch("/api/auth/me",authOptions({method:"GET"}));
      const payload=await parseClone(response);
      if(!response.ok || !payload?.success || !payload?.data){
        markUnverified();
        const error=new Error(payload?.message||"로그인 세션을 확인할 수 없습니다.");
        error.status=response.status;
        throw error;
      }
      markVerified(payload.data);
      return payload.data;
    })().finally(()=>{verifyInFlight=null;});
    return verifyInFlight;
  }

  function jsonResponse(status,payload){
    return new Response(JSON.stringify(payload),{
      status,
      headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
    });
  }

  global.fetch=async function qmesAuthSafeFetch(input,init){
    const url=urlOf(input);
    const method=methodOf(input,init);

    if(/\/api\/auth\/login(?:\?|$)/.test(url)){
      markUnverified();
      let loginResponse;
      try{
        loginResponse=await nativeFetch(input,authOptions(init));
      }catch(error){
        markUnverified();
        throw error;
      }
      const loginPayload=await parseClone(loginResponse);
      if(!loginResponse.ok || !loginPayload?.success || !loginPayload?.data?.user){
        markUnverified();
        return loginResponse;
      }

      try{
        await verifyServerSession();
        return loginResponse;
      }catch(error){
        console.error("[QMES AUTH] 로그인 응답 후 서버 세션 확인 실패",error);
        return jsonResponse(503,{
          success:false,
          message:"로그인은 확인되었지만 서버 세션이 유지되지 않습니다. 잠시 후 다시 로그인해 주세요.",
          data:null
        });
      }
    }

    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      try{
        const response=await nativeFetch(input,authOptions(init));
        const payload=await parseClone(response);
        if(response.ok && payload?.success && payload?.data) markVerified(payload.data);
        else markUnverified();
        return response;
      }catch(error){
        markUnverified();
        throw error;
      }
    }

    if(/\/api\/auth\/logout(?:\?|$)/.test(url)){
      try{return await nativeFetch(input,authOptions(init));}
      finally{markUnverified();}
    }

    if(/\/api\/qmes-sync\//.test(url) && !verified && !global.__QMES_AUTH_VERIFIED__){
      if(method==="GET"){
        return jsonResponse(200,{success:true,message:"AUTH_PENDING",data:[]});
      }
      return jsonResponse(503,{success:false,message:"로그인 확인 후 저장할 수 있습니다.",data:null});
    }

    return nativeFetch(input,init);
  };

  global.qmesVerifyServerSession=verifyServerSession;
  global.__QMES_AUTH_VERIFIED__=false;
})(window);
