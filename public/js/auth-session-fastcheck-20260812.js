/* QMES auth/session bootstrap - isolated login document
 * When authentication is not already verified for this navigation, stop the
 * rest of the QMES page from loading. This prevents background sync/UI modules
 * from repainting the login screen or resetting its inputs.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  const SESSION_KEY="qmes-current-user-v1";
  const PASS_KEY="qmes-auth-pass-once-v3";
  const PASS_TTL=15000;

  function saveUser(user){
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(user));}catch(_error){}
  }
  function clearUser(){
    try{
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(PASS_KEY);
    }catch(_error){}
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
  function markPass(){
    try{sessionStorage.setItem(PASS_KEY,String(Date.now()));}catch(_error){}
  }
  function consumePass(){
    try{
      const raw=Number(sessionStorage.getItem(PASS_KEY)||0);
      sessionStorage.removeItem(PASS_KEY);
      return raw>0&&(Date.now()-raw)<PASS_TTL;
    }catch(_error){return false;}
  }

  function disableOldWorkersAndCaches(){
    try{
      if("serviceWorker" in navigator){
        navigator.serviceWorker.getRegistrations().then(list=>list.forEach(reg=>reg.unregister())).catch(()=>{});
      }
      if(global.caches&&typeof global.caches.keys==="function"){
        global.caches.keys().then(keys=>Promise.all(keys.map(key=>global.caches.delete(key)))).catch(()=>{});
      }
    }catch(_error){}
  }
  disableOldWorkersAndCaches();

  /* The previous navigation already proved that /api/auth/me works. Let the
     normal QMES document finish loading exactly once. */
  if(consumePass()){
    return;
  }

  function pageHtml(){
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>나모케미칼 QMES 로그인</title>
<style>
*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0}body{font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;background:linear-gradient(135deg,#07162b,#0c3156);color:#0f172a;overflow:hidden}.qmes-auth-page{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#07162b,#0c3156)}.qmes-auth-card{width:min(420px,100%);background:#fff;border-radius:22px;padding:36px 32px;box-shadow:0 24px 70px rgba(0,0,0,.34)}.qmes-auth-title{font-size:25px;font-weight:900;color:#0f2740;text-align:center;margin-bottom:28px}.qmes-auth-label{display:block;font-size:12px;font-weight:800;color:#334155;margin:0 0 6px}.qmes-auth-label.pw{margin-top:15px}.qmes-auth-input{display:block;width:100%;height:46px;border:1px solid #cbd5e1;border-radius:10px;padding:0 13px;font-size:14px;outline:none;background:#fff;color:#0f172a}.qmes-auth-input:focus{border-color:#2777aa;box-shadow:0 0 0 3px rgba(39,119,170,.12)}.qmes-auth-error{display:none;font-size:12px;color:#dc2626;font-weight:750;margin-top:10px;line-height:1.5}.qmes-auth-btn{width:100%;height:48px;border:0;border-radius:10px;background:#145f91;color:#fff;font-size:15px;font-weight:900;margin-top:20px;cursor:pointer}.qmes-auth-btn:disabled{opacity:.62;cursor:wait}.qmes-auth-foot{font-size:12px;color:#64748b;text-align:center;margin-top:16px}.qmes-auth-link{text-align:center;margin-top:10px}.qmes-auth-link a{color:#0f5d8f;font-size:13px;font-weight:750;text-decoration:none}.qmes-auth-check{font-size:14px;color:#475569;text-align:center;font-weight:750;line-height:1.6}.qmes-auth-spinner{width:30px;height:30px;margin:0 auto 18px;border:3px solid #dbeafe;border-top-color:#145f91;border-radius:50%;animation:qspin .75s linear infinite}@keyframes qspin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="qmes-auth-page">
  <div class="qmes-auth-card">
    <div class="qmes-auth-title">나모케미칼 QMES</div>
    <div id="qmes-auth-checking">
      <div class="qmes-auth-spinner"></div>
      <div class="qmes-auth-check">로그인 상태를 확인하고 있습니다.</div>
    </div>
    <form id="qmes-auth-form" autocomplete="on" style="display:none">
      <label class="qmes-auth-label" for="qmes-auth-id">아이디 또는 사번</label>
      <input class="qmes-auth-input" id="qmes-auth-id" autocomplete="username" placeholder="예: 임흥배 또는 U-0009">
      <label class="qmes-auth-label pw" for="qmes-auth-pw">비밀번호</label>
      <input class="qmes-auth-input" id="qmes-auth-pw" type="password" autocomplete="current-password" placeholder="초기 비밀번호 1234">
      <div class="qmes-auth-error" id="qmes-auth-error"></div>
      <button class="qmes-auth-btn" id="qmes-auth-button" type="submit">로그인</button>
      <div class="qmes-auth-foot">초기 비밀번호 : 1234</div>
      <div class="qmes-auth-link"><a href="https://namochemical.com/" target="_blank" rel="noopener noreferrer">🌐 나모케미칼 홈페이지</a></div>
    </form>
  </div>
</div>
</body>
</html>`;
  }

  /* Stop every later QMES script on this unauthenticated navigation. */
  try{global.stop();}catch(_error){}
  document.open();
  document.write(pageHtml());
  document.close();

  const checking=document.getElementById("qmes-auth-checking");
  const form=document.getElementById("qmes-auth-form");
  const idInput=document.getElementById("qmes-auth-id");
  const pwInput=document.getElementById("qmes-auth-pw");
  const errorBox=document.getElementById("qmes-auth-error");
  const button=document.getElementById("qmes-auth-button");

  function showError(message){
    errorBox.textContent=String(message||"로그인에 실패했습니다.");
    errorBox.style.display="block";
  }
  function showForm(message){
    checking.style.display="none";
    form.style.display="block";
    if(message) showError(message); else errorBox.style.display="none";
    global.setTimeout(()=>idInput.focus(),0);
  }
  function reloadIntoQmes(){
    markPass();
    global.location.reload();
  }
  async function readJson(response){
    return response.json().catch(()=>({success:false,message:"서버 응답을 확인할 수 없습니다."}));
  }
  async function verifySession(){
    const response=await nativeFetch("/api/auth/me",{
      method:"GET",
      credentials:"same-origin",
      cache:"no-store",
      headers:{"Accept":"application/json"}
    });
    const payload=await readJson(response);
    if(!response.ok||!payload.success||!payload.data){
      const error=new Error(payload.message||"로그인 세션을 확인할 수 없습니다.");
      error.status=response.status;
      throw error;
    }
    const user=normalizeUser(payload.data);
    saveUser(user);
    return user;
  }

  /* First check the cookie-backed server session. A valid session goes through
     one controlled reload; an invalid session shows the isolated login form. */
  verifySession()
    .then(()=>reloadIntoQmes())
    .catch(()=>{
      clearUser();
      showForm();
    });

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const loginId=String(idInput.value||"").trim();
    const password=String(pwInput.value||"").trim();
    if(!loginId||!password){
      showError("아이디와 비밀번호를 입력해 주세요.");
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
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({loginId,password})
      });
      const payload=await readJson(response);
      if(!response.ok||!payload.success||!payload.data?.user){
        throw new Error(payload.message||"로그인에 실패했습니다.");
      }

      saveUser(normalizeUser(payload.data.user));
      button.textContent="세션 확인 중...";

      /* Do not reload until the cookie is actually readable by the server. */
      await verifySession();
      button.textContent="로그인 성공";
      reloadIntoQmes();
    }catch(error){
      clearUser();
      showError(error?.message||"서버에 연결할 수 없습니다.");
      button.disabled=false;
      button.textContent="로그인";
      pwInput.select();
    }
  });
})(window);
