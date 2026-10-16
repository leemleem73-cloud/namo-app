/* Approved NAMO scene; preserve the auth bridge's form, controls and listeners. */
(function(){
  "use strict";
  if(window.__NAMO_QMES_LOGIN_UI_PATCH_V1__) return;
  window.__NAMO_QMES_LOGIN_UI_PATCH_V1__=true;
  const style=document.createElement("style");
  style.id="qmes-login-ui-patch-20261007-v1-style";
  style.textContent=`
/* Artwork fits the viewport; form dimensions are independent of image scaling. */
#qauth-login.qmes-login-pro{
 background-color:#eaf0f8!important;
 background-image:url('/qmes-login-factory-responsive-20261016.png'),linear-gradient(145deg,#f4f7fc,#e1e9f4)!important;
 background-size:contain,cover!important;background-position:center,center!important;background-repeat:no-repeat!important;
 padding:0!important;overflow:auto!important;align-items:flex-start!important;color:#071c46;
}
#qauth-login.qmes-login-pro .qauth-card{
 position:relative;width:100%!important;min-height:100vh!important;min-height:100dvh!important;height:auto!important;
 margin:0!important;padding:24px 16px!important;box-sizing:border-box!important;
 display:flex!important;align-items:center!important;justify-content:center!important;
 background:transparent!important;border:0!important;box-shadow:none!important;
}
#qauth-login.qmes-login-pro .qauth-login-photo{display:none!important}
#qauth-login.qmes-login-pro .qmes-company-home{position:absolute;top:20px;left:24px;z-index:2;display:inline-flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid #ffffff99;border-radius:8px;background:#ffffffeb;color:#29376b;text-decoration:none;font-size:13px;font-weight:800;line-height:20px;box-shadow:0 2px 10px #243a5d12}
#qauth-login.qmes-login-pro .qmes-company-home img{display:block;width:190px;height:auto;flex-shrink:0}
#qauth-login.qmes-login-pro .qmes-company-home span{font-size:12px;white-space:nowrap}
#qauth-login.qmes-login-pro .qmes-company-home:hover{text-decoration:underline;background:#fff}
#qauth-login.qmes-login-pro .qmes-company-home:focus-visible{outline:3px solid #0864ff;outline-offset:3px}
@media(max-width:640px){#qauth-login.qmes-login-pro .qmes-company-home{top:12px;left:12px;font-size:12px;padding:8px 10px;gap:8px}#qauth-login.qmes-login-pro .qmes-company-home img{width:150px}#qauth-login.qmes-login-pro .qmes-company-home span{font-size:11px}}
#qauth-login.qmes-login-pro .qauth-login-panel{
 position:relative!important;left:auto!important;top:auto!important;transform:none!important;
 width:clamp(320px,22vw,442px)!important;max-width:100%!important;min-height:0!important;height:auto!important;
 padding:clamp(28px,2.5vw,48px) clamp(24px,2vw,42px) clamp(26px,2vw,38px)!important;
 box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;
 background:rgba(255,255,255,.98)!important;border:1px solid #e5ebf2!important;border-radius:24px!important;
 box-shadow:0 12px 38px #243a5d16!important;
}
#qauth-login.qmes-login-pro h2{margin:0 0 clamp(24px,2.2vw,44px)!important;white-space:nowrap;text-align:center!important;font-size:clamp(23px,1.5vw,30px)!important;line-height:1.25!important;letter-spacing:-1px!important;font-weight:900!important;color:#071c46!important}
#qauth-login.qmes-login-pro h2 em{font-style:normal;color:#0864ff}
#qauth-login.qmes-login-pro .qmes-login-subtitle,#qauth-login.qmes-login-pro .qmes-login-brandline{display:none!important}
#qauth-login.qmes-login-pro .qauth-login-panel>label{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important}
#qauth-login.qmes-login-pro #qa-id,#qauth-login.qmes-login-pro #qa-pw{
 width:100%!important;height:clamp(44px,2.5vw,50px)!important;min-height:44px;flex-shrink:0;box-sizing:border-box!important;margin:0!important;
 padding:0 45px!important;border:1px solid #dce3ed!important;border-radius:10px!important;background-color:#fff!important;
 color:#101a5c!important;font-size:14px!important;outline:none!important;box-shadow:0 1px 2px #12345605!important;
}
#qauth-login.qmes-login-pro #qa-id{margin-bottom:calc(var(--scene-h)*.01405)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%23828fa8' stroke-width='1.8'%3E%3Ccircle cx='10' cy='6' r='3'/%3E%3Cpath d='M3 18v-2a7 7 0 0 1 14 0v2'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:15px center!important}
#qauth-login.qmes-login-pro #qa-pw{background-image:none!important}
#qauth-login.qmes-login-pro .qmes-password-lock{position:absolute;left:15px;top:50%;transform:translateY(-50%);width:20px;height:20px;color:#828fa8;pointer-events:none}
#qauth-login.qmes-login-pro #qa-id{margin-bottom:10px!important}
#qauth-login.qmes-login-pro .qmes-password-field{position:relative;flex-shrink:0}
#qauth-login.qmes-login-pro input:focus-visible{border-color:#0864ff!important;outline:3px solid #0864ff26!important}
#qauth-login.qmes-login-pro .qmes-password-toggle{position:absolute;right:6px;top:0;height:100%;width:38px;padding:0;display:grid;place-items:center;border:0;background:transparent;color:#8997ad;cursor:pointer}
#qauth-login.qmes-login-pro .qauth-error{flex-shrink:0!important;min-height:0!important;margin:7px 0 0!important;font-size:11px!important;line-height:1.4!important;overflow-wrap:anywhere}
#qauth-login.qmes-login-pro .qauth-error:empty{display:none!important}
#qauth-login.qmes-login-pro .qauth-login-options{position:relative;flex-shrink:0;margin:12px 0 0!important}
#qauth-login.qmes-login-pro .qauth-login-password-link{position:absolute;right:0;top:0;height:16px;margin:0;padding:0;border:0;background:transparent;color:#000!important;font-family:inherit;font-size:12px!important;font-weight:800!important;line-height:16px;cursor:pointer}
#qauth-login.qmes-login-pro .qauth-login-password-link:hover{text-decoration:underline}
#qauth-login-password .qauth-modal{box-sizing:border-box;max-height:calc(100dvh - 40px);overflow-y:auto}
#qauth-login.qmes-login-pro .qauth-id-save{display:flex!important;align-items:center!important;gap:8px!important;margin:0!important;font-size:12px!important;color:#29376b!important}
#qauth-login.qmes-login-pro .qauth-id-save input{width:16px!important;height:16px!important;margin:0!important;accent-color:#0864ff}
#qauth-login.qmes-login-pro .qauth-primary{width:100%!important;min-height:44px;height:clamp(44px,2.5vw,50px)!important;flex-shrink:0;margin:16px 0 0!important;border:1px solid #0054ff!important;border-radius:10px!important;background:linear-gradient(110deg,#0867ff,#004cf0)!important;color:#fff!important;font-size:15px!important;font-weight:800!important;box-shadow:0 6px 12px #0864ff30!important;cursor:pointer}
#qauth-login.qmes-login-pro .qauth-primary:disabled{opacity:.65;cursor:wait}
#qauth-login.qmes-login-pro .qauth-signup-link{width:100%!important;min-height:44px;height:clamp(44px,2.5vw,50px)!important;flex-shrink:0;margin:10px 0 0!important;border:1px solid #527cff!important;border-radius:10px!important;background:#fff!important;color:#0864ff!important;font-size:15px!important;font-weight:800!important;cursor:pointer}
#qauth-login.qmes-login-pro button:focus-visible{outline:3px solid #518dff!important;outline-offset:3px}
#qauth-login.qmes-login-pro .qauth-signup-link:hover{background:#f1f6ff!important}
@media(max-width:640px){
 #qauth-login.qmes-login-pro{background-position:center top,center!important;background-size:100% auto,cover!important}
 #qauth-login.qmes-login-pro .qauth-card{padding:calc(39.01345vw + 16px) 16px 28px!important;justify-content:flex-start!important;flex-direction:column!important}
 #qauth-login.qmes-login-pro .qauth-login-panel{width:min(360px,100%)!important;padding:28px 24px!important;border-radius:20px!important}
 #qauth-login.qmes-login-pro h2{font-size:25px!important;margin-bottom:26px!important}
 #qauth-login.qmes-login-pro #qa-id,#qauth-login.qmes-login-pro #qa-pw{font-size:16px!important}
}
@media(max-height:520px) and (min-width:641px){
 #qauth-login.qmes-login-pro .qauth-card{padding:16px!important}
 #qauth-login.qmes-login-pro .qauth-login-panel{padding:22px 26px!important}
 #qauth-login.qmes-login-pro h2{margin-bottom:18px!important;font-size:24px!important}
}

/* Fill every screen without coupling the form size to the artwork. */
#qauth-login.qmes-login-pro{
 background-image:url('/qmes-login-factory-responsive-20261016.png')!important;
 background-size:cover!important;background-position:center!important;
}
@media(max-aspect-ratio:21/10){
 #qauth-login.qmes-login-pro{background-image:url('/qmes-login-factory-laptop-20261016.png')!important}
}
@media(max-aspect-ratio:1/1){
 #qauth-login.qmes-login-pro{background-image:url('/qmes-login-factory-phone-20261016.png')!important}
}
@media(max-width:640px){
 #qauth-login.qmes-login-pro .qauth-card{padding:24px 16px!important;justify-content:center!important}
}
`;
  document.head.appendChild(style);
  function patchLogin(){
    const root=document.getElementById("qauth-login");
    if(!root) return;
    root.classList.add("qmes-login-pro");
    root.setAttribute("aria-label","로그인");
    if(!root.querySelector(".qmes-company-home")){
      const home=document.createElement("a");home.className="qmes-company-home";
      home.href="https://www.namochemical.com/";home.target="_blank";home.rel="noopener noreferrer";
      home.innerHTML='<img src="/assets/namo-login-company-logo-20261016.svg" alt="나모케미칼(주) NAMO Chemical Co., Ltd." width="464" height="96"><span>홈페이지 바로가기 ↗</span>';home.setAttribute("aria-label","나모케미칼 홈페이지 (새 탭에서 열기)");
      root.appendChild(home);
    }
    const panel=root.querySelector(".qauth-login-panel");
    if(!panel || panel.dataset.approvedScene) return;
    panel.dataset.approvedScene="1";
    const h2=panel.querySelector("h2");
    if(h2){
      h2.innerHTML='나모케미칼 <em>QMES</em>';
      const sub=document.createElement("p");sub.className="qmes-login-subtitle";
      sub.textContent="품질로 더 나은 가치를 만드는 스마트 제조 혁신";h2.after(sub);
    }
    panel.querySelector(".qmes-login-brandline")?.remove();
    const id=panel.querySelector("#qa-id"),pw=panel.querySelector("#qa-pw");
    if(id){id.placeholder="아이디 또는 사번";id.setAttribute("aria-label","아이디 또는 사번");}
    if(pw){
      pw.placeholder="비밀번호";pw.setAttribute("aria-label","비밀번호");
      const wrap=document.createElement("div");wrap.className="qmes-password-field";pw.before(wrap);wrap.appendChild(pw);
      const lock=document.createElement("span");lock.className="qmes-password-lock";lock.setAttribute("aria-hidden","true");
      lock.innerHTML='<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="8" width="12" height="10" rx="2"/><path d="M7 8V5a3 3 0 0 1 6 0v3m-3 4v3"/></svg>';
      wrap.appendChild(lock);
      const toggle=document.createElement("button");toggle.type="button";toggle.className="qmes-password-toggle";
      toggle.setAttribute("aria-label","비밀번호 표시");toggle.setAttribute("aria-pressed","false");
      toggle.innerHTML='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
      toggle.addEventListener("click",()=>{const show=pw.type==="password";pw.type=show?"text":"password";toggle.setAttribute("aria-pressed",String(show));toggle.setAttribute("aria-label",show?"비밀번호 숨기기":"비밀번호 표시");});
      wrap.appendChild(toggle);
    }
    const err=panel.querySelector(".qauth-error");if(err){err.setAttribute("role","status");err.setAttribute("aria-live","polite");}
    const login=panel.querySelector(".qauth-primary");if(login&&!login.disabled)login.textContent="로그인 →";
  }
  patchLogin();
  new MutationObserver(patchLogin).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("DOMContentLoaded",patchLogin,{once:true});
})();
