/* QMES auth logout recovery - 2026-09-29
 * Single-purpose fix: after a successful server logout, force a clean login entry.
 * Does not modify page layout, ERP modules, or user data.
 */
(function installQmesLogoutRecovery(global){
  "use strict";
  if(global.__QMES_LOGOUT_RECOVERY_20260929_V1__) return;
  global.__QMES_LOGOUT_RECOVERY_20260929_V1__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const upstreamFetch=global.fetch.bind(global);

  function isLogoutRequest(input){
    try{
      const raw=typeof input==="string"?input:(input&&input.url)||"";
      const url=new URL(raw,global.location.href);
      return url.origin===global.location.origin && url.pathname==="/api/auth/logout";
    }catch(_error){
      return false;
    }
  }

  function clearClientAuth(){
    try{sessionStorage.removeItem(SESSION_KEY);}catch(_error){}
    try{sessionStorage.removeItem("qmes_open_menu");}catch(_error){}
    delete global.__QMES_CURRENT_USER__;
    delete global.__QMES_USER__;
    global.__QMES_AUTH_BOOTSTRAP_STATE__="anonymous";
  }

  global.fetch=async function qmesLogoutRecoveryFetch(input,init){
    if(!isLogoutRequest(input)) return upstreamFetch(input,init);

    const response=await upstreamFetch(input,init);
    if(response && response.ok){
      clearClientAuth();
      setTimeout(function(){
        try{
          const target=new URL(global.location.href);
          target.pathname="/";
          target.search="";
          target.hash="";
          target.searchParams.set("_qmesLogout",String(Date.now()));
          global.location.replace(target.toString());
        }catch(_error){
          global.location.replace("/?_qmesLogout="+Date.now());
        }
      },0);
    }
    return response;
  };
})(window);
