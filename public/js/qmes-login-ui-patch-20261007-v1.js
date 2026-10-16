/* Approved NAMO scene; preserve the auth bridge's form, controls and listeners. */
(function(){
  "use strict";
  if(window.__NAMO_QMES_LOGIN_UI_PATCH_V1__) return;
  window.__NAMO_QMES_LOGIN_UI_PATCH_V1__=true;
  const style=document.createElement("style");
  style.id="qmes-login-ui-patch-20261007-v1-style";
  style.textContent=`
#qauth-login.qmes-login-pro{
 --scene-w:max(100vw,256.32184vh);--scene-h:max(39.01345vw,100vh);
 background:#e9eff8 url('/qmes-login-factory-approved-20261016.png') center/cover no-repeat!important;
 padding:0!important;overflow:auto!important;color:#071c46;
}
#qauth-login.qmes-login-pro .qauth-card{position:relative;width:100%!important;min-height:100vh!important;margin:0!important;padding:0!important;display:block!important;background:transparent!important;border:0!important;box-shadow:none!important}
#qauth-login.qmes-login-pro .qauth-login-photo{display:none!important}
#qauth-login.qmes-login-pro .qauth-login-panel{
 position:absolute;left:50%;top:calc(50% - var(--scene-h)*.02107);transform:translate(-50%,-50%);
 width:calc(var(--scene-w)*.22073)!important;min-height:calc(var(--scene-h)*.57727)!important;height:auto!important;
 padding:calc(var(--scene-h)*.08174) calc(var(--scene-w)*.02142) calc(var(--scene-h)*.04853)!important;
 box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;
 background:#fff!important;border:0!important;border-radius:calc(var(--scene-w)*.01345)!important;box-shadow:0 16px 45px #243a5d12!important;
}
#qauth-login.qmes-login-pro h2{margin:0 0 calc(var(--scene-h)*.05875)!important;white-space:nowrap;text-align:center!important;font-size:calc(var(--scene-w)*.01495)!important;line-height:1.25!important;letter-spacing:-1px!important;font-weight:900!important;color:#071c46!important}
#qauth-login.qmes-login-pro h2 em{font-style:normal;color:#0864ff}
#qauth-login.qmes-login-pro .qmes-login-subtitle,#qauth-login.qmes-login-pro .qmes-login-brandline{display:none!important}
#qauth-login.qmes-login-pro .qauth-login-panel>label{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important}
#qauth-login.qmes-login-pro #qa-id,#qauth-login.qmes-login-pro #qa-pw{
 width:100%!important;height:calc(var(--scene-h)*.06386)!important;min-height:42px;flex-shrink:0;box-sizing:border-box!important;margin:0!important;
 padding:0 calc(var(--scene-w)*.0274)!important;border:1px solid #dce3ed!important;border-radius:11px!important;background-color:#fff!important;
 color:#101a5c!important;font-size:calc(var(--scene-w)*.00747)!important;outline:none!important;box-shadow:0 1px 2px #12345605!important;
}
#qauth-login.qmes-login-pro #qa-id{margin-bottom:calc(var(--scene-h)*.01405)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%23828fa8' stroke-width='1.8'%3E%3Ccircle cx='10' cy='6' r='3'/%3E%3Cpath d='M3 18v-2a7 7 0 0 1 14 0v2'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:15px center!important}
#qauth-login.qmes-login-pro #qa-pw{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%23152f61' stroke-width='1.8'%3E%3Crect x='4' y='8' width='12' height='10' rx='2'/%3E%3Cpath d='M7 8V5a3 3 0 0 1 6 0v3m-3 4v3'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:15px center!important}
#qauth-login.qmes-login-pro #qa-id{margin-bottom:calc(var(--scene-h)*.01277)!important}
#qauth-login.qmes-login-pro .qmes-password-field{position:relative;flex-shrink:0}
#qauth-login.qmes-login-pro input:focus-visible{border-color:#0864ff!important;outline:3px solid #0864ff26!important}
#qauth-login.qmes-login-pro .qmes-password-toggle{position:absolute;right:6px;top:0;height:100%;width:38px;padding:0;display:grid;place-items:center;border:0;background:transparent;color:#8997ad;cursor:pointer}
#qauth-login.qmes-login-pro .qauth-error{flex-shrink:0!important;min-height:0!important;margin:7px 0 0!important;font-size:12px!important;line-height:1.4!important}
#qauth-login.qmes-login-pro .qauth-error:empty{display:none!important}
#qauth-login.qmes-login-pro .qauth-login-options{flex-shrink:0;margin:calc(var(--scene-h)*.01916) 0 0!important}
#qauth-login.qmes-login-pro .qauth-id-save{display:flex!important;align-items:center!important;gap:10px!important;margin:0!important;font-size:calc(var(--scene-w)*.00598)!important;color:#29376b!important}
#qauth-login.qmes-login-pro .qauth-id-save input{width:16px!important;height:16px!important;margin:0!important;accent-color:#0864ff}
#qauth-login.qmes-login-pro .qauth-primary{width:100%!important;min-height:42px;height:calc(var(--scene-h)*.06258)!important;flex-shrink:0;margin:calc(var(--scene-h)*.02171) 0 0!important;border:1px solid #0054ff!important;border-radius:11px!important;background:linear-gradient(110deg,#0867ff,#004cf0)!important;color:#fff!important;font-size:calc(var(--scene-w)*.00747)!important;font-weight:800!important;box-shadow:0 6px 12px #0864ff30!important;cursor:pointer}
#qauth-login.qmes-login-pro .qauth-primary:disabled{opacity:.65;cursor:wait}
#qauth-login.qmes-login-pro .qauth-signup-link{width:100%!important;min-height:42px;height:calc(var(--scene-h)*.06258)!important;flex-shrink:0;margin:calc(var(--scene-h)*.01149) 0 0!important;border:1px solid #527cff!important;border-radius:11px!important;background:#fff!important;color:#0864ff!important;font-size:calc(var(--scene-w)*.00747)!important;font-weight:800!important;cursor:pointer}
#qauth-login.qmes-login-pro button:focus-visible{outline:3px solid #518dff!important;outline-offset:3px}
#qauth-login.qmes-login-pro .qauth-signup-link:hover{background:#f1f6ff!important}
@media(max-width:1100px),(max-height:580px){
 #qauth-login.qmes-login-pro{background:linear-gradient(145deg,#edf3fa,#fff 58%,#dae7f8)!important;--scene-w:2007px;--scene-h:783px}
 #qauth-login.qmes-login-pro .qauth-card{display:flex!important;align-items:center!important;justify-content:center!important;padding:24px 16px!important;min-height:100vh!important;min-height:100dvh!important}
 #qauth-login.qmes-login-pro .qauth-login-panel{position:relative;left:auto;top:auto;transform:none;width:min(442px,100%)!important;min-height:450px!important;padding:50px 30px 38px!important;border-radius:26px!important}
 #qauth-login.qmes-login-pro h2{font-size:clamp(22px,6vw,30px)!important}
}
`;
  document.head.appendChild(style);
  function patchLogin(){
    const root=document.getElementById("qauth-login");
    if(!root) return;
    root.classList.add("qmes-login-pro");
    root.setAttribute("aria-label","로그인");
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
