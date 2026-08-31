/* QMES authentication boundary - stable login 2026-08-31
 * One server-session verification promise is shared by app.jsx and qmes-sync.
 * No fake empty data and no automatic page reloads.
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
  const authOptions=init=>({
    ...(init||{}),
    credentials:"same-origin",
    cache:"no-store",
    headers:{"Accept":"application/json",...((init&&init.headers)||{})}
  });

  async function payloadOf(response){
    try{return await response.clone().json();}catch(_error){return null;}
  }

  function setVerified(value,user){
    verified=Boolean(value);
    global.__QMES_AUTH_VERIFIED__=verified;
    if(verified) global.__QMES_AUTH_VERIFIED_USER__=user||null;
    else delete global.__QMES_AUTH_VERIFIED_USER__;
  }

  async function verifyServerSession(force=false){
    if(verified&&!force) return global.__QMES_AUTH_VERIFIED_USER__||null;
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

    if(/\/api\/auth\/login(?:\?|$)/.test(url)){
      setVerified(false);
      const response=await nativeFetch(input,authOptions(init));
      const payload=await payloadOf(response);
      if(response.ok&&payload?.success&&payload?.data?.user){
        /* Login response is authoritative. Do not perform a second /auth/me
           request here; app.jsx will enter the authenticated UI immediately. */
        setVerified(true,payload.data.user);
      }
      return response;
    }

    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      /* Reuse an already-running verification instead of issuing a competing
         request during first paint. */
      if(verifyInFlight){
        try{
          const user=await verifyInFlight;
          return new Response(JSON.stringify({success:true,message:"OK",data:user}),{
            status:200,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
          });
        }catch(_error){
          return nativeFetch(input,authOptions(init));
        }
      }
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
      if(!verified){
        try{await verifyServerSession(false);}catch(_error){
          return nativeFetch(input,authOptions(init));
        }
      }
      let response=await nativeFetch(input,authOptions(init));
      if(response.status!==401) return response;
      try{
        await verifyServerSession(true);
        response=await nativeFetch(input,authOptions(init));
      }catch(_error){}
      if(response.status===401){
        setVerified(false);
        try{global.dispatchEvent(new CustomEvent("qmes:auth-expired"));}catch(_error){}
      }
      return response;
    }

    return nativeFetch(input,init);
  };

  global.qmesVerifyServerSession=verifyServerSession;
  setVerified(false);

  /* Single early check. app.jsx can reuse this promise through the wrapped
     /api/auth/me path, avoiding login/dashboard/login paint races. */
  Promise.resolve().then(()=>verifyServerSession(false)).catch(()=>{});
})(window);
