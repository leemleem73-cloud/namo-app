/* QMES auth/session first-paint gate
 * Keep the login screen isolated from the large QMES UI bundle.
 * After a successful login, allow exactly one full-app navigation via
 * ?qmes_auth=1 so the page cannot bounce between login and QMES repeatedly.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  const SESSION_KEY="qmes-current-user-v1";
  const url=new URL(global.location.href);
  const allowFullApp=url.searchParams.get("qmes_auth")==="1";

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

  function saveUser(user){
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(user));}catch(_error){}
  }

  function clearUser(){
    try{sessionStorage.removeItem(SESSION_KEY);}catch(_error){}
  }

  /* A successful login arrives here once. Remove the marker immediately and
     let the normal React app finish booting without another navigation. */
  if(allowFullApp){
    url.searchParams.delete("qmes_auth");
    try{global.history.replaceState(null,"",url.pathname+url.search+url.hash);}catch(_error){}
    return;
  }

  global.__QMES_LOGIN_GATE_ACTIVE__=true;

  function pageHtml(){
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>나모케미칼 QMES 로그인</title>
<style>
*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0}body{font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;background:linear-gradient(135deg,#07162b,#0c3156);color:#0f172a;overflow:hidden}.qmes-auth-page{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#07162b,#0c3156)}.qmes-auth-card{width:min(420px,100%);background:#fff;border-radius:22px;padding:36px 32px;box-shadow:0 24px 70px rgba(0,0,0,.34)}.qmes-auth-title{font-size:25px;font-weight:900;color:#0f2740;text-align:center;margin-bottom:28px}.qmes-auth-label{display:block;font-size:12px;font-weight:800;color:#334155;margin:0 0 6px}.qmes-auth-label.pw{margin-top:15px}.qmes-auth-input{display:block;width:100%;height:46px;border:1px solid #cbd5e1;border-radius:10px;padding:0 13px;font-size:14px;outline:none;background:#fff;color:#0f172a}.qmes-auth-input:focus{border-color:#2777aa;box-shadow:0 0 0 3px rgba(39,119,170,.12)}.qmes-auth-error{display:none;font-size:12px;color:#dc2626;font-weight:750;margin-top:10px;line-height:1.5}.qmes-auth-btn{width:100%;height:48px;border:0;border-radius:10px;background:#145f91;color:#fff;font-size:15px;font-weight:900;margin-top:20px;cursor:pointer}.qmes-auth-btn:disabled{opacity:.62;cursor:wait}.qmes-auth-foot{font-size:12px;color:#64748b;text-align:center;margin-top:16px}.qmes-auth-link{text-align:center;margin-top:10px}.qmes-auth-link a{color:#0f5d8f;font-size:13px;font-weight:750;text-decoration:none}
</style>
</head>
<body>
<div class="qmes-auth-page">
  <form class="qmes-auth-card" id="qmes-auth-form" autocomplete="on">
    <div class="qmes-auth-title">나모케미칼 QMES</div>
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
</body>
</html>`;
  }

  /* Stop the remaining index.html resources before they can repaint login. */
  try{global.stop();}catch(_error){}
  document.open();
  document.write(pageHtml());
  document.close();

  const form=document.getElementById("qmes-auth-form");
  const idInput=document.getElementById("qmes-auth-id");
  const pwInput=document.getElementById("qmes-auth-pw");
  const errorBox=document.getElementById("qmes-auth-error");
  const button=document.getElementById("qmes-auth-button");

  function showError(message){
    errorBox.textContent=String(message||"로그인에 실패했습니다.");
    errorBox.style.display="block";
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
    if(!response.ok||!payload.success||!payload.data) throw new Error(payload.message||"로그인 세션을 확인할 수 없습니다.");
    const user=normalizeUser(payload.data);
    saveUser(user);
    return user;
  }

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
      if(!response.ok||!payload.success||!payload.data?.user) throw new Error(payload.message||"로그인에 실패했습니다.");

      saveUser(normalizeUser(payload.data.user));
      await verifySession();
      button.textContent="로그인 성공";
      global.location.replace("/?qmes_auth=1");
    }catch(error){
      clearUser();
      showError(error?.message||"서버에 연결할 수 없습니다.");
      button.disabled=false;
      button.textContent="로그인";
      pwInput.select();
    }
  });

  global.setTimeout(()=>idInput.focus(),0);
})(window);

/* Keep the already-confirmed first-paint stylesheet ownership rules for the
 * full app only. Never run them inside the isolated login document. */
(function installCurrentUiBeforeRender(){
  "use strict";
  if(window.__QMES_LOGIN_GATE_ACTIVE__) return;
  if(window.__QMES_CURRENT_UI_BOOTSTRAP_20260826__) return;
  window.__QMES_CURRENT_UI_BOOTSTRAP_20260826__=true;

  let fieldInputFirstPaint=false;
  try{fieldInputFirstPaint=sessionStorage.getItem("qmes_current_tab")==="pop";}catch(_error){}

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

  styles.forEach(([id,href,keepDuringField])=>{
    let link=document.getElementById(id);
    if(!link){
      link=document.createElement("link");
      link.id=id;
      link.rel="stylesheet";
      link.href=href;
      if(fieldInputFirstPaint&&!keepDuringField) link.media="not all";
      document.head.appendChild(link);
      return;
    }
    if(String(link.getAttribute("href")||"")!==href) link.href=href;
  });
})();