/* NAMO QMES - early authentication / stable login guard - 2026-08-31
 * ADD-ONLY recovery patch. Loaded first by index.html.
 * Keeps the login screen fixed, blocks protected background APIs before auth,
 * verifies the server session, and never allows a 401 reload loop.
 */
(function installQmesLoginSyncGuard(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__) return;
  global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__=true;

  global.__QMES_AUTH_BOUNDARY_20260831__=true;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;
  global.__QMES_AUTH_RELOAD_PENDING__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const SHELL_ID="qmes-stable-login-20260831";
  const nativeFetch=global.fetch.bind(global);
  let serverVerified=false;
  let verifyPromise=null;

  const clean=value=>String(value==null?"":value).trim();
  const urlOf=input=>typeof input==="string"?input:String(input?.url||"");
  const methodOf=(input,init)=>String(init?.method||input?.method||"GET").toUpperCase();
  const sameOriginOptions=init=>({...(init||{}),credentials:"same-origin",cache:"no-store"});
  const jsonResponse=(status,payload)=>new Response(JSON.stringify(payload),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
  const readJson=async response=>{try{return await response.clone().json();}catch(_error){return null;}};

  function normalizeUser(user){
    return {
      id:user?.id||"",uid:user?.uid||"",name:user?.name||"",email:user?.email||"",
      dept:user?.department||user?.dept||"",position:user?.title||user?.position||"",
      role:user?.role||"user",mustChangePassword:Boolean(user?.mustChangePassword)
    };
  }

  function setVerified(value,user){
    serverVerified=Boolean(value);
    global.__QMES_AUTH_VERIFIED__=serverVerified;
    if(serverVerified){
      global.__QMES_AUTH_VERIFIED_USER__=user||null;
      if(user){
        const normalized=normalizeUser(user);
        try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(normalized));}catch(_error){}
        global.__QMES_CURRENT_USER__=normalized;
        global.__QMES_USER__=`${normalized.dept||""} ${normalized.name||""} (${normalized.uid||""})`;
      }
    }else{
      delete global.__QMES_AUTH_VERIFIED_USER__;
    }
  }

  function clearBrowserAuth(){
    try{sessionStorage.removeItem(SESSION_KEY);}catch(_error){}
    delete global.__QMES_CURRENT_USER__;
    delete global.__QMES_USER__;
    setVerified(false);
  }

  function ensureLoginStyle(){
    if(document.getElementById(`${SHELL_ID}-style`)) return;
    const style=document.createElement("style");
    style.id=`${SHELL_ID}-style`;
    style.textContent=`
      #${SHELL_ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:linear-gradient(135deg,#07162b,#0c3156)!important;font-family:Pretendard,'Noto Sans KR',sans-serif!important;box-sizing:border-box!important}
      #${SHELL_ID} .qs-card{width:min(420px,100%)!important;padding:36px 32px!important;border-radius:22px!important;background:#fff!important;box-shadow:0 24px 70px rgba(0,0,0,.32)!important;box-sizing:border-box!important}
      #${SHELL_ID} .qs-title{text-align:center!important;color:#0f2740!important;font-size:25px!important;font-weight:950!important;margin-bottom:7px!important}
      #${SHELL_ID} .qs-sub{text-align:center!important;color:#64748b!important;font-size:12px!important;font-weight:700!important;margin-bottom:24px!important}
      #${SHELL_ID} label{display:block!important;margin-top:14px!important;color:#334155!important;font-size:12px!important;font-weight:800!important}
      #${SHELL_ID} input{display:block!important;width:100%!important;height:46px!important;margin-top:6px!important;padding:0 13px!important;border:1px solid #cbd5e1!important;border-radius:11px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:14px!important;box-sizing:border-box!important;outline:none!important}
      #${SHELL_ID} input:focus{border-color:#0f5d8f!important;box-shadow:0 0 0 3px rgba(15,93,143,.12)!important}
      #${SHELL_ID} .qs-error{display:none!important;margin-top:12px!important;padding:10px 11px!important;border-radius:9px!important;background:#fef2f2!important;color:#b91c1c!important;font-size:12px!important;font-weight:800!important;line-height:1.45!important}
      #${SHELL_ID} .qs-error.show{display:block!important}
      #${SHELL_ID} .qs-login{width:100%!important;height:48px!important;margin-top:20px!important;border:0!important;border-radius:11px!important;background:#0f5d8f!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:15px!important;font-weight:900!important;cursor:pointer!important}
      #${SHELL_ID} .qs-login:disabled{opacity:.65!important;cursor:wait!important}
      #${SHELL_ID} .qs-check{text-align:center!important;color:#475569!important;font-size:13px!important;font-weight:800!important;padding:16px 0 4px!important}
    `;
    document.head.appendChild(style);
  }

  function ensureLoginShell(){
    let layer=document.getElementById(SHELL_ID);
    if(layer) return layer;
    ensureLoginStyle();
    layer=document.createElement("div");
    layer.id=SHELL_ID;
    layer.innerHTML=`<form class="qs-card"><div class="qs-title">나모케미칼 QMES</div><div class="qs-sub">로그인 상태를 확인하고 있습니다.</div><div class="qs-fields" hidden><label>아이디 또는 사번<input name="loginId" autocomplete="username" placeholder="성명 또는 사번"></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" placeholder="비밀번호"></label><div class="qs-error" role="alert"></div><button type="submit" class="qs-login">로그인</button></div><div class="qs-check">로그인 상태 확인 중...</div></form>`;
    document.body.appendChild(layer);
    bindShell(layer);
    return layer;
  }

  function showLogin(message){
    const layer=ensureLoginShell();
    layer.querySelector(".qs-fields").hidden=false;
    layer.querySelector(".qs-check").hidden=true;
    layer.querySelector(".qs-sub").textContent="계정 정보를 입력해 주세요.";
    const error=layer.querySelector(".qs-error");
    if(message){error.textContent=message;error.classList.add("show");}
    else{error.textContent="";error.classList.remove("show");}
  }

  function hideLoginShell(){document.getElementById(SHELL_ID)?.remove();}

  function bindShell(layer){
    const form=layer.querySelector(".qs-card");
    if(!form||form.dataset.bound==="1") return;
    form.dataset.bound="1";
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const id=clean(form.elements.loginId?.value);
      const password=clean(form.elements.password?.value);
      const button=form.querySelector(".qs-login");
      if(!id||!password){showLogin("아이디와 비밀번호를 입력해 주세요.");return;}
      button.disabled=true;button.textContent="로그인 확인 중...";
      try{
        const response=await global.fetch("/api/auth/login",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({loginId:id,password})});
        const payload=await readJson(response);
        if(!response.ok||!payload?.success||!payload?.data?.user){showLogin(payload?.message||`로그인에 실패했습니다. (${response.status})`);return;}
        setVerified(true,payload.data.user);
        button.textContent="로그인 완료";
        /* One deliberate reload only after a verified login. The next boot begins with
           a valid cookie/session and the fixed shell disappears after /auth/me. */
        setTimeout(()=>global.location.replace(global.location.href),120);
      }catch(error){
        console.error("[QMES STABLE LOGIN]",error);
        showLogin("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }finally{
        button.disabled=false;
        if(button.textContent!=="로그인 완료")button.textContent="로그인";
      }
    });
  }

  async function verifyWithServer(){
    if(verifyPromise) return verifyPromise;
    verifyPromise=(async()=>{
      const response=await nativeFetch("/api/auth/me",sameOriginOptions({method:"GET",headers:{"Accept":"application/json"}}));
      const payload=await readJson(response);
      const valid=Boolean(response.ok&&payload?.success&&payload?.data);
      if(!valid){
        setVerified(false);
        const error=new Error(payload?.message||"로그인 세션을 확인할 수 없습니다.");
        error.status=response.status;
        throw error;
      }
      setVerified(true,payload.data);
      try{global.dispatchEvent(new CustomEvent("qmes:auth-verified",{detail:{user:payload.data}}));}catch(_error){}
      return payload.data;
    })().finally(()=>{verifyPromise=null;});
    return verifyPromise;
  }

  function isPublicApi(url){return /\/api\/(?:auth\/|test-db(?:\?|$))/.test(url);}
  function isProtectedApi(url){return /\/api\//.test(url)&&!isPublicApi(url);}

  global.fetch=async function qmesEarlyAuthFetch(input,init){
    const url=urlOf(input);
    const method=methodOf(input,init);

    if(/\/api\/auth\/login(?:\?|$)/.test(url)){
      clearBrowserAuth();
      const response=await nativeFetch(input,sameOriginOptions(init));
      const payload=await readJson(response);
      if(!response.ok||!payload?.success||!payload?.data?.user){setVerified(false);return response;}
      try{await verifyWithServer();return response;}
      catch(error){
        console.error("[QMES AUTH] login session verification failed",error);
        clearBrowserAuth();
        return jsonResponse(503,{success:false,message:"로그인 정보는 맞지만 서버 세션이 유지되지 않습니다. 서버 세션 설정을 확인해 주세요.",data:null});
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
      finally{clearBrowserAuth();showLogin("");}
    }

    if(isProtectedApi(url)&&!serverVerified&&!global.__QMES_AUTH_VERIFIED__){
      if(method==="GET") return jsonResponse(200,{success:true,message:"LOGIN_PENDING",data:[]});
      return jsonResponse(503,{success:false,message:"로그인 확인 후 사용할 수 있습니다.",data:null});
    }

    const response=await nativeFetch(input,sameOriginOptions(init));
    if(isProtectedApi(url)&&response.status===401){
      /* Never reload here. This is the key fix for the visible flicker loop. */
      clearBrowserAuth();
      showLogin("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
      return jsonResponse(503,{success:false,message:"로그인 세션이 만료되었습니다.",data:null});
    }
    return response;
  };

  function bootStableLogin(){
    ensureLoginShell();
    verifyWithServer().then(()=>hideLoginShell()).catch(()=>{clearBrowserAuth();showLogin("");});
  }

  global.qmesVerifyServerSession=verifyWithServer;
  setVerified(false);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootStableLogin,{once:true});
  else bootStableLogin();
})(window);
