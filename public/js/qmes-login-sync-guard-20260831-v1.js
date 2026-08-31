/* NAMO QMES - isolated login gate - 2026-08-31
 * This is the first local script in index.html.
 * Unauthenticated users never load the QMES runtime: the current document is
 * replaced with a small login-only document. After server authentication is
 * verified, exactly one full-app navigation is allowed.
 */
(function installQmesIsolatedLoginGate(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__) return;
  global.__QMES_LOGIN_SYNC_GUARD_20260831_V1__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const PASS_KEY="qmes-auth-pass-once-v4";
  const nativeFetch=global.fetch.bind(global);
  const currentUrl=new URL(global.location.href);
  const fullRequested=currentUrl.searchParams.get("qmes_full")==="1";
  let pass=false;
  try{pass=sessionStorage.getItem(PASS_KEY)==="1";}catch(_error){}

  /* The login gate grants this marker only after /api/auth/me succeeds. Consume
     it once and let the normal QMES document continue loading without another
     navigation. */
  if(fullRequested&&pass){
    try{sessionStorage.removeItem(PASS_KEY);}catch(_error){}
    currentUrl.searchParams.delete("qmes_full");
    try{global.history.replaceState(null,"",currentUrl.pathname+currentUrl.search+currentUrl.hash);}catch(_error){}
    global.__QMES_LOGIN_GATE_PASSED__=true;
    return;
  }

  if(fullRequested){
    currentUrl.searchParams.delete("qmes_full");
    try{global.history.replaceState(null,"",currentUrl.pathname+currentUrl.search+currentUrl.hash);}catch(_error){}
  }

  function normalizeUser(user){
    return {
      id:user?.id||"",
      uid:user?.uid||"",
      name:user?.name||"",
      email:user?.email||"",
      dept:user?.department||user?.dept||"",
      position:user?.title||user?.position||"",
      role:user?.role||"user",
      mustChangePassword:Boolean(user?.mustChangePassword)
    };
  }

  function saveUser(user){
    const normalized=normalizeUser(user);
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(normalized));}catch(_error){}
    return normalized;
  }

  function clearUser(){
    try{
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(PASS_KEY);
    }catch(_error){}
  }

  function readJson(response){
    return response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
  }

  function loginHtml(){
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>나모케미칼 QMES 로그인</title>
<style>
*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0}body{font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;background:linear-gradient(135deg,#07162b,#0c3156);color:#0f172a;overflow:hidden}.qmes-login-page{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#07162b,#0c3156)}.qmes-login-card{width:min(420px,100%);padding:36px 32px;border:0;border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.32)}.qmes-login-title{text-align:center;color:#0f2740;font-size:25px;font-weight:900;margin-bottom:7px}.qmes-login-sub{text-align:center;color:#64748b;font-size:12px;font-weight:700;margin-bottom:24px}.qmes-login-fields[hidden]{display:none}.qmes-login-label{display:block;margin-top:14px;color:#334155;font-size:12px;font-weight:800}.qmes-login-input{display:block;width:100%;height:46px;margin-top:6px;padding:0 13px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;color:#0f172a;font-size:14px;outline:none}.qmes-login-input:focus{border-color:#0f5d8f;box-shadow:0 0 0 3px rgba(15,93,143,.12)}.qmes-login-error{display:none;margin-top:12px;padding:10px 11px;border-radius:9px;background:#fef2f2;color:#b91c1c;font-size:12px;font-weight:800;line-height:1.45}.qmes-login-error.show{display:block}.qmes-login-btn{width:100%;height:48px;margin-top:20px;border:0;border-radius:11px;background:#0f5d8f;color:#fff;font-size:15px;font-weight:900;cursor:pointer}.qmes-login-btn:disabled{opacity:.65;cursor:wait}.qmes-login-check{text-align:center;color:#475569;font-size:13px;font-weight:800;padding:16px 0 4px}.qmes-login-foot{text-align:center;color:#64748b;font-size:11px;font-weight:700;margin-top:14px}
</style>
</head>
<body>
<div class="qmes-login-page">
  <form class="qmes-login-card" id="qmes-login-form" autocomplete="on">
    <div class="qmes-login-title">나모케미칼 QMES</div>
    <div class="qmes-login-sub" id="qmes-login-sub">로그인 상태를 확인하고 있습니다.</div>
    <div class="qmes-login-fields" id="qmes-login-fields" hidden>
      <label class="qmes-login-label">아이디 또는 사번
        <input class="qmes-login-input" id="qmes-login-id" autocomplete="username" placeholder="성명 또는 사번">
      </label>
      <label class="qmes-login-label">비밀번호
        <input class="qmes-login-input" id="qmes-login-pw" type="password" autocomplete="current-password" placeholder="비밀번호">
      </label>
      <div class="qmes-login-error" id="qmes-login-error" role="alert"></div>
      <button class="qmes-login-btn" id="qmes-login-btn" type="submit">로그인</button>
      <div class="qmes-login-foot">로그인 후 QMES를 불러옵니다.</div>
    </div>
    <div class="qmes-login-check" id="qmes-login-check">로그인 상태 확인 중...</div>
  </form>
</div>
</body>
</html>`;
  }

  /* Stop parsing/loading the remaining QMES resources now. Unlike the previous
     overlay approach, no production, sync, ERP, MutationObserver or React app
     code can run behind the login screen. */
  try{global.stop();}catch(_error){}
  document.open();
  document.write(loginHtml());
  document.close();

  const form=document.getElementById("qmes-login-form");
  const fields=document.getElementById("qmes-login-fields");
  const check=document.getElementById("qmes-login-check");
  const sub=document.getElementById("qmes-login-sub");
  const idInput=document.getElementById("qmes-login-id");
  const pwInput=document.getElementById("qmes-login-pw");
  const errorBox=document.getElementById("qmes-login-error");
  const button=document.getElementById("qmes-login-btn");

  function showLogin(message){
    fields.hidden=false;
    check.hidden=true;
    sub.textContent="계정 정보를 입력해 주세요.";
    if(message){errorBox.textContent=String(message);errorBox.classList.add("show");}
    else{errorBox.textContent="";errorBox.classList.remove("show");}
    global.setTimeout(()=>idInput.focus(),0);
  }

  function enterQmes(user){
    saveUser(user);
    try{sessionStorage.setItem(PASS_KEY,"1");}catch(_error){}
    const target=new URL(global.location.origin+"/");
    target.searchParams.set("qmes_full","1");
    global.location.replace(target.pathname+target.search);
  }

  async function verifyExistingSession(){
    try{
      const response=await nativeFetch("/api/auth/me",{
        method:"GET",credentials:"same-origin",cache:"no-store",headers:{"Accept":"application/json"}
      });
      const payload=await readJson(response);
      if(response.ok&&payload?.success&&payload?.data){
        enterQmes(payload.data);
        return;
      }
    }catch(_error){}
    clearUser();
    showLogin("");
  }

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const loginId=String(idInput.value||"").trim();
    const password=String(pwInput.value||"").trim();
    if(!loginId||!password){showLogin("아이디와 비밀번호를 입력해 주세요.");return;}

    button.disabled=true;
    button.textContent="로그인 확인 중...";
    errorBox.classList.remove("show");
    try{
      const loginResponse=await nativeFetch("/api/auth/login",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({loginId,password})
      });
      const loginPayload=await readJson(loginResponse);
      if(!loginResponse.ok||!loginPayload?.success||!loginPayload?.data?.user){
        throw new Error(loginPayload?.message||`로그인에 실패했습니다. (${loginResponse.status})`);
      }

      const verifyResponse=await nativeFetch("/api/auth/me",{
        method:"GET",credentials:"same-origin",cache:"no-store",headers:{"Accept":"application/json"}
      });
      const verifyPayload=await readJson(verifyResponse);
      if(!verifyResponse.ok||!verifyPayload?.success||!verifyPayload?.data){
        throw new Error(verifyPayload?.message||"로그인 세션을 확인할 수 없습니다.");
      }

      button.textContent="로그인 완료";
      enterQmes(verifyPayload.data);
    }catch(error){
      clearUser();
      showLogin(error?.message||"서버에 연결할 수 없습니다.");
      button.disabled=false;
      button.textContent="로그인";
      try{pwInput.select();}catch(_error){}
    }
  });

  verifyExistingSession();
})(window);
