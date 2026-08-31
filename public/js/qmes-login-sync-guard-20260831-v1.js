/* NAMO QMES - login/sync bootstrap coordinator - 2026-09-01
 *
 * Keep app.jsx as the single UI/auth owner. This guard only coordinates network
 * ordering and stabilizes the very first browser paint before React mounts.
 *
 * Rules:
 * 1) A saved browser login is verified exactly once with /api/auth/me.
 * 2) Concurrent /api/auth/me callers share that one response.
 * 3) Authenticated QMES sync waits for the initial auth verdict before starting.
 * 4) A non-interactive first-paint placeholder lives only inside #root and is
 *    automatically replaced by React. No overlay/login owner is introduced.
 */
(function installQmesLoginSyncCoordinator(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_COORDINATOR_20260901__) return;
  global.__QMES_LOGIN_SYNC_COORDINATOR_20260901__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const nativeFetch=global.fetch.bind(global);

  let hasSavedSession=false;
  try{hasSavedSession=Boolean(sessionStorage.getItem(SESSION_KEY));}catch(_error){}

  function installFirstPaint(){
    const root=document.getElementById("root");
    if(!root||root.childNodes.length) return;

    document.documentElement.style.background="#07162b";
    document.body.style.margin="0";
    document.body.style.background="#07162b";
    document.body.style.minHeight="100vh";

    const shell=document.createElement("div");
    shell.id="qmes-auth-first-paint-20260901";
    shell.setAttribute("aria-hidden","true");
    shell.style.cssText="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#07162b,#0c3156);font-family:Pretendard,'Noto Sans KR',sans-serif;padding:20px;box-sizing:border-box;";

    if(hasSavedSession){
      shell.innerHTML='<div style="color:#fff;font-size:14px;font-weight:800;letter-spacing:-.02em">로그인 상태 확인 중...</div>';
    }else{
      shell.innerHTML='<div style="width:min(420px,100%);background:#fff;border-radius:22px;padding:36px 32px;box-shadow:0 24px 70px rgba(0,0,0,.32);box-sizing:border-box"><div style="font-size:25px;font-weight:950;color:#0f2740;text-align:center;margin-bottom:28px">나모케미칼 QMES</div><div style="font-size:12px;font-weight:800;color:#334155;margin-bottom:6px">아이디 또는 사번</div><div style="height:46px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;box-sizing:border-box"></div><div style="font-size:12px;font-weight:800;color:#334155;margin-top:15px;margin-bottom:6px">비밀번호</div><div style="height:46px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;box-sizing:border-box"></div><div style="height:48px;border-radius:11px;background:#0f5d8f;margin-top:20px"></div><div style="font-size:12px;color:#64748b;text-align:center;margin-top:16px">초기 비밀번호 : 1234</div></div>';
    }

    root.appendChild(shell);
  }

  installFirstPaint();

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
