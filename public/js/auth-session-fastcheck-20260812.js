/* QMES auth/session bootstrap - stable pre-React login gate
 * The login surface is owned here before React/Babel modules mount.
 * This prevents background QMES modules from remounting or resetting inputs.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  const SESSION_KEY="qmes-current-user-v1";
  let authMeInFlight=null;
  let uiStylesPromise=null;

  const styles=[
    ["qmes-enterprise-ui-20260826","./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise3",false],
    ["qmes-shell-offset-fix-20260826","./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1",true],
    ["qmes-shell-readable-size-20260827","./css/qmes-shell-readable-size-20260827.css?v=20260827-2",true],
    ["qmes-enterprise-readable-size-20260826","./css/qmes-enterprise-readable-size-20260826.css?v=20260826-readable2",false],
    ["qmes-modern-corporate-ui-20260826","./css/qmes-modern-corporate-ui-20260826.css?v=20260826-modern2",false],
    ["qmes-sidebar-line-align-20260826","./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2",true],
    ["qmes-production-process-corporate-fix-20260826","./css/qmes-production-process-corporate-fix-20260826.css?v=20260826-process2",false],
    ["qmes-workorder-issued-clean-20260826","./css/qmes-workorder-issued-clean-20260826.css?v=20260826-workorder1",false],
    ["qmes-text-sharpness-20260826","./css/qmes-text-sharpness-20260826.css?v=20260826-sharp1",false],
    ["qmes-spc-readability-fix-20260826","./css/qmes-spc-readability-fix-20260826.css?v=20260826-spc1",false],
    ["qmes-shared-shell-final-20260827","./css/qmes-shared-shell-final-20260827.css?v=20260827-1",true],
    ["qmes-responsive-main-layout-20260827","./css/qmes-responsive-main-layout-20260827.css?v=20260827-1",false],
    ["qmes-header-stable-20260827","./css/qmes-header-stable-20260827.css?v=20260827-1",true]
  ];

  function readSavedUser(){
    try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");}catch(_error){return null;}
  }
  function saveUser(user){
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(user));}catch(_error){}
  }
  function clearUser(){
    try{sessionStorage.removeItem(SESSION_KEY);}catch(_error){}
  }
  function normalizeUser(authenticated){
    return {
      id:authenticated?.id,
      uid:authenticated?.uid||"",
      name:authenticated?.name||"",
      email:authenticated?.email||"",
      dept:authenticated?.department||authenticated?.dept||"",
      position:authenticated?.title||authenticated?.position||"",
      role:authenticated?.role||"user",
      mustChangePassword:Boolean(authenticated?.mustChangePassword)
    };
  }

  function fieldInputFirstPaint(){
    try{return sessionStorage.getItem("qmes_current_tab")==="pop";}catch(_error){return false;}
  }
  function waitForStyle(link){
    if(link.sheet) return Promise.resolve();
    return new Promise(resolve=>{
      let done=false;
      const finish=()=>{
        if(done) return;
        done=true;
        link.removeEventListener("load",finish);
        link.removeEventListener("error",finish);
        resolve();
      };
      link.addEventListener("load",finish,{once:true});
      link.addEventListener("error",finish,{once:true});
      global.setTimeout(finish,700);
    });
  }
  function installCurrentUiBeforeRender(){
    if(global.__QMES_CURRENT_UI_BOOTSTRAP_20260826__) return Promise.resolve();
    if(uiStylesPromise) return uiStylesPromise;
    uiStylesPromise=Promise.all(styles.map(([id,href,keepDuringField])=>{
      let link=document.getElementById(id);
      if(!link){
        link=document.createElement("link");
        link.id=id;
        link.rel="stylesheet";
        link.href=href;
        if(fieldInputFirstPaint()&&!keepDuringField) link.media="not all";
        document.head.appendChild(link);
      }else if(String(link.getAttribute("href")||"")!==href){
        link.href=href;
      }
      return waitForStyle(link);
    })).then(()=>{
      global.__QMES_CURRENT_UI_BOOTSTRAP_20260826__=true;
    }).catch(()=>{
      global.__QMES_CURRENT_UI_BOOTSTRAP_20260826__=true;
    });
    return uiStylesPromise;
  }
  global.__QMES_INSTALL_CURRENT_UI_STYLES__=installCurrentUiBeforeRender;

  function rootElement(){return document.getElementById("root");}
  function hideRoot(){const root=rootElement();if(root){root.style.visibility="hidden";root.style.pointerEvents="none";}}
  function showRoot(){const root=rootElement();if(root){root.style.visibility="visible";root.style.pointerEvents="";}}

  function ensureGate(){
    let gate=document.getElementById("qmes-stable-login-gate");
    if(gate) return gate;
    gate=document.createElement("div");
    gate.id="qmes-stable-login-gate";
    gate.style.cssText="position:fixed;inset:0;z-index:2147483647;background:#020617;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Pretendard,'Noto Sans KR',sans-serif;box-sizing:border-box;";
    gate.innerHTML=`
      <div style="width:min(420px,100%);background:#fff;border-radius:20px;padding:36px 32px;box-sizing:border-box;box-shadow:0 24px 70px rgba(0,0,0,.45)">
        <div style="font-size:25px;font-weight:900;color:#17243b;text-align:center;margin-bottom:28px">나모케미칼 QMES</div>
        <form id="qmes-stable-login-form" autocomplete="on">
          <label style="display:block;font-size:12px;font-weight:800;color:#334155;margin-bottom:6px">아이디 또는 사번</label>
          <input id="qmes-stable-login-id" autocomplete="username" placeholder="예: 임흥배 또는 U-0009" style="width:100%;height:46px;border:1px solid #cbd5e1;border-radius:10px;padding:0 13px;font-size:14px;box-sizing:border-box;outline:none;background:#fff;color:#0f172a" />
          <label style="display:block;font-size:12px;font-weight:800;color:#334155;margin-top:15px;margin-bottom:6px">비밀번호</label>
          <input id="qmes-stable-login-pw" type="password" autocomplete="current-password" placeholder="초기 비밀번호 1234" style="width:100%;height:46px;border:1px solid #cbd5e1;border-radius:10px;padding:0 13px;font-size:14px;box-sizing:border-box;outline:none;background:#fff;color:#0f172a" />
          <div id="qmes-stable-login-error" style="display:none;font-size:12px;color:#dc2626;font-weight:700;margin-top:10px"></div>
          <button id="qmes-stable-login-button" type="submit" style="width:100%;height:48px;border:0;border-radius:10px;background:#145f91;color:white;font-size:15px;font-weight:900;margin-top:20px;cursor:pointer">로그인</button>
        </form>
        <div style="font-size:12px;color:#64748b;text-align:center;margin-top:16px">초기 비밀번호 : 1234</div>
        <div style="text-align:center;margin-top:10px"><a href="https://namochemical.com/" target="_blank" rel="noopener noreferrer" style="color:#0f5d8f;font-size:13px;font-weight:700;text-decoration:none">🌐 나모케미칼 홈페이지</a></div>
      </div>`;
    document.body.appendChild(gate);
    return gate;
  }

  function showLoginGate(message){
    hideRoot();
    const gate=ensureGate();
    gate.style.display="flex";
    const error=gate.querySelector("#qmes-stable-login-error");
    if(error){
      error.textContent=message||"";
      error.style.display=message?"block":"none";
    }
    const form=gate.querySelector("#qmes-stable-login-form");
    if(form&&!form.__qmesBound){
      form.__qmesBound=true;
      form.addEventListener("submit",async event=>{
        event.preventDefault();
        const id=String(gate.querySelector("#qmes-stable-login-id")?.value||"").trim();
        const password=String(gate.querySelector("#qmes-stable-login-pw")?.value||"").trim();
        const button=gate.querySelector("#qmes-stable-login-button");
        const errorBox=gate.querySelector("#qmes-stable-login-error");
        if(!id||!password){
          errorBox.textContent="아이디와 비밀번호를 입력해 주세요.";
          errorBox.style.display="block";
          return;
        }
        button.disabled=true;
        button.textContent="로그인 확인 중...";
        errorBox.style.display="none";
        try{
          const response=await nativeFetch("/api/auth/login",{
            method:"POST",
            credentials:"same-origin",
            cache:"no-store",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({loginId:id,password})
          });
          const payload=await response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
          if(!response.ok||!payload.success||!payload.data?.user){
            throw new Error(payload.message||"로그인에 실패했습니다.");
          }
          saveUser(normalizeUser(payload.data.user));
          button.textContent="로그인 성공";
          global.location.reload();
        }catch(error){
          errorBox.textContent=error?.message||"서버에 연결할 수 없습니다.";
          errorBox.style.display="block";
          button.disabled=false;
          button.textContent="로그인";
        }
      });
    }
    global.setTimeout(()=>gate.querySelector("#qmes-stable-login-id")?.focus(),0);
  }

  function releaseGate(){
    const gate=document.getElementById("qmes-stable-login-gate");
    if(gate) gate.remove();
    showRoot();
  }

  function bootAuthGate(){
    hideRoot();
    const saved=readSavedUser();
    if(!saved){
      showLoginGate();
      return;
    }

    nativeFetch("/api/auth/me",{credentials:"same-origin",cache:"no-store"})
      .then(async response=>{
        const payload=await response.json().catch(()=>({success:false}));
        if(!response.ok||!payload.success||!payload.data) throw new Error("SESSION_EXPIRED");
        saveUser(normalizeUser(payload.data));
        await installCurrentUiBeforeRender();
        releaseGate();
      })
      .catch(()=>{
        clearUser();
        showLoginGate("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
      });
  }

  function authOptions(init){
    const options={...(init||{})};
    if(!options.credentials) options.credentials="same-origin";
    options.cache="no-store";
    return options;
  }

  global.fetch=function(input,init){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    if(/\/api\/auth\/me(?:\?|$)/.test(url)){
      const options=authOptions(init);
      if(!authMeInFlight){
        authMeInFlight=nativeFetch(input,options)
          .finally(()=>{global.setTimeout(()=>{authMeInFlight=null;},0);});
      }
      return authMeInFlight.then(response=>response.clone());
    }
    return nativeFetch(input,init);
  };

  bootAuthGate();
})(window);
