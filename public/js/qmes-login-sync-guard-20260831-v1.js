/* NAMO QMES - pre-login shared-sync guard - 2026-08-31
 * ADD-ONLY patch.
 * Prevent background modules from calling protected shared DB endpoints before
 * the React login flow has established a real server session.
 */
(function installQmesLoginSyncGuard(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__) return;
  global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__=true;

  const nativeFetch=global.fetch.bind(global);
  let serverVerified=false;

  const urlOf=input=>typeof input==="string"?input:String(input?.url||"");
  const methodOf=(input,init)=>String(init?.method||input?.method||"GET").toUpperCase();
  const clientUser=()=>{
    const user=global.__QMES_CURRENT_USER__;
    return !!(user&&typeof user==="object"&&(user.id||user.uid||user.name));
  };
  const jsonResponse=(status,payload)=>new Response(JSON.stringify(payload),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
  });

  async function verifyWithServer(){
    try{
      const response=await nativeFetch("/api/auth/me",{
        method:"GET",
        credentials:"same-origin",
        cache:"no-store",
        headers:{"Accept":"application/json"}
      });
      const payload=await response.clone().json().catch(()=>null);
      serverVerified=!!(response.ok&&payload?.success&&payload?.data);
      global.__QMES_AUTH_VERIFIED__=serverVerified;
      return serverVerified;
    }catch(_error){
      serverVerified=false;
      global.__QMES_AUTH_VERIFIED__=false;
      return false;
    }
  }

  global.fetch=async function qmesLoginSyncGuardFetch(input,init){
    const url=urlOf(input);
    const method=methodOf(input,init);

    if(/\/api\/auth\/login(?:\?|$)/.test(url)){
      serverVerified=false;
      global.__QMES_AUTH_VERIFIED__=false;
      return nativeFetch(input,init);
    }

    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      const response=await nativeFetch(input,init);
      try{
        const payload=await response.clone().json();
        serverVerified=!!(response.ok&&payload?.success&&payload?.data);
        global.__QMES_AUTH_VERIFIED__=serverVerified;
      }catch(_error){
        serverVerified=false;
        global.__QMES_AUTH_VERIFIED__=false;
      }
      return response;
    }

    if(/\/api\/auth\/logout(?:\?|$)/.test(url)){
      try{return await nativeFetch(input,init);}
      finally{
        serverVerified=false;
        global.__QMES_AUTH_VERIFIED__=false;
      }
    }

    if(/\/api\/qmes-sync\//.test(url)){
      /* Before login: do not hit protected routes at all. Older background modules
         interpret 401 as an expired session and can reload the whole page. */
      if(!clientUser()&&!serverVerified&&!global.__QMES_AUTH_VERIFIED__){
        if(method==="GET") return jsonResponse(200,{success:true,message:"LOGIN_PENDING",data:[]});
        return jsonResponse(503,{success:false,message:"로그인 확인 후 저장할 수 있습니다.",data:null});
      }

      let response=await nativeFetch(input,init);
      if(response.status!==401) return response;

      /* A client user exists but the protected endpoint says 401. Re-check /auth/me
         once. If the server session is valid, retry the original request once. */
      const valid=await verifyWithServer();
      if(valid){
        response=await nativeFetch(input,init);
        return response;
      }

      /* Do not reload from here. Let the login app remain visible/stable. */
      try{global.dispatchEvent(new CustomEvent("qmes:auth-expired"));}catch(_error){}
      return response;
    }

    return nativeFetch(input,init);
  };
})(window);
