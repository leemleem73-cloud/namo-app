(function(){
  "use strict";
  if(window.__NAMO_QMES_LOGIN_UI_PATCH_V1__) return;
  window.__NAMO_QMES_LOGIN_UI_PATCH_V1__=true;

  const STYLE_ID="qmes-login-ui-patch-20261007-v1-style";
  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
#qauth-login.qmes-login-pro{
  background:linear-gradient(135deg,#fbfcff 0%,#f6f8ff 58%,#f3f1ff 100%) !important;
  padding:0 !important;
  overflow:auto !important;
}
#qauth-login.qmes-login-pro .qauth-card{
  width:min(1540px,97vw) !important;
  min-height:100vh !important;
  margin:0 auto !important;
  padding:32px 44px !important;
  box-sizing:border-box !important;
  display:grid !important;
  grid-template-columns:minmax(0,1.72fr) minmax(390px,.68fr) !important;
  gap:54px !important;
  align-items:center !important;
  background:transparent !important;
  border:0 !important;
  border-radius:0 !important;
  box-shadow:none !important;
  overflow:visible !important;
}
#qauth-login.qmes-login-pro .qauth-login-photo{
  display:block !important;
  width:100% !important;
  height:min(820px,calc(100vh - 64px)) !important;
  min-height:600px !important;
  background-image:linear-gradient(180deg,rgba(255,255,255,.02),rgba(28,35,62,.08)),url('https://images.unsplash.com/photo-1696541681346-b8787dbed51c?auto=format&fit=crop&fm=jpg&q=88&w=2400') !important;
  background-size:cover !important;
  background-repeat:no-repeat !important;
  background-position:center center !important;
  border-radius:22px !important;
  box-shadow:0 24px 60px rgba(32,42,72,.14) !important;
  border:0 !important;
  border-radius:0 !important;
  box-shadow:none !important;
}
#qauth-login.qmes-login-pro .qauth-login-photo-inner{display:none !important}
#qauth-login.qmes-login-pro .qauth-login-panel{
  width:min(420px,100%) !important;
  min-height:560px !important;
  justify-self:center !important;
  box-sizing:border-box !important;
  padding:44px 32px !important;
  display:flex !important;
  flex-direction:column !important;
  justify-content:center !important;
  background:rgba(255,255,255,.94) !important;
  border:1px solid rgba(222,226,242,.76) !important;
  border-radius:26px !important;
  box-shadow:0 22px 60px rgba(49,54,100,.10) !important;
}
#qauth-login.qmes-login-pro .qmes-login-brandline{
  width:52px;height:2px;margin:0 0 23px;background:#6658f5;border-radius:4px;
}
#qauth-login.qmes-login-pro h2{
  margin:0 !important;
  text-align:left !important;
  color:#121a3a !important;
  font-size:34px !important;
  line-height:1.12 !important;
  font-weight:950 !important;
  letter-spacing:-1.5px !important;
}
#qauth-login.qmes-login-pro h2 em{font-style:normal;color:#5b4df4}
#qauth-login.qmes-login-pro .qmes-login-subtitle{
  margin:14px 0 30px;
  color:#858da5;
  font-size:14px;
  font-weight:650;
  letter-spacing:-.25px;
}
#qauth-login.qmes-login-pro .qauth-login-panel>label:not(.qauth-id-save){display:none !important}
#qauth-login.qmes-login-pro #qa-id,
#qauth-login.qmes-login-pro #qa-pw{
  width:100% !important;
  height:54px !important;
  box-sizing:border-box !important;
  margin:0 0 14px !important;
  padding:0 17px !important;
  border:1px solid #d9deeb !important;
  border-radius:13px !important;
  background:#fff !important;
  color:#27324a !important;
  font-size:13px !important;
  outline:none !important;
  box-shadow:none !important;
}
#qauth-login.qmes-login-pro #qa-id:focus,
#qauth-login.qmes-login-pro #qa-pw:focus{
  border-color:#7567ff !important;
  box-shadow:0 0 0 3px rgba(105,88,246,.10) !important;
}
#qauth-login.qmes-login-pro .qauth-error{
  min-height:16px !important;
  margin:-3px 0 5px !important;
  font-size:11px !important;
}
#qauth-login.qmes-login-pro .qauth-login-options{
  margin:2px 0 3px !important;
}
#qauth-login.qmes-login-pro .qauth-id-save{
  display:flex !important;
  align-items:center !important;
  gap:7px !important;
  margin:0 !important;
  color:#515a73 !important;
  font-size:12px !important;
  font-weight:800 !important;
}
#qauth-login.qmes-login-pro .qauth-id-save input{
  width:15px !important;height:15px !important;margin:0 !important;accent-color:#6656f5;
}
#qauth-login.qmes-login-pro .qauth-primary{
  width:100% !important;
  height:55px !important;
  margin:16px 0 0 !important;
  border:0 !important;
  border-radius:13px !important;
  background:linear-gradient(90deg,#795fff 0%,#4936ef 100%) !important;
  color:#fff !important;
  font-size:15px !important;
  font-weight:900 !important;
  box-shadow:0 12px 26px rgba(85,65,239,.22) !important;
}
#qauth-login.qmes-login-pro .qauth-signup-link{
  width:100% !important;
  height:49px !important;
  margin:12px 0 0 !important;
  border:1px solid #9d91ff !important;
  border-radius:13px !important;
  background:#fff !important;
  color:#4036bc !important;
  font-size:14px !important;
  font-weight:900 !important;
}
@media(max-width:980px){
  #qauth-login.qmes-login-pro .qauth-card{
    grid-template-columns:1fr !important;
    width:min(480px,96vw) !important;
    padding:20px !important;
  }
  #qauth-login.qmes-login-pro .qauth-login-photo{display:none !important}
  #qauth-login.qmes-login-pro .qauth-login-panel{width:100% !important;min-height:auto !important;padding:32px 24px !important}
  #qauth-login.qmes-login-pro h2{text-align:center !important;font-size:29px !important}
  #qauth-login.qmes-login-pro .qmes-login-brandline{margin-left:auto;margin-right:auto}
  #qauth-login.qmes-login-pro .qmes-login-subtitle{text-align:center}
}
`;
    document.head.appendChild(s);
  }

  function patchLogin(){
    const root=document.getElementById("qauth-login");
    if(!root) return;
    ensureStyle();
    root.classList.add("qmes-login-pro");
    const panel=root.querySelector(".qauth-login-panel");
    if(!panel) return;

    const h2=panel.querySelector("h2");
    if(h2){
      h2.innerHTML='나모케미칼 <em>QMES</em>';
      if(!panel.querySelector(".qmes-login-brandline")){
        const line=document.createElement("div");
        line.className="qmes-login-brandline";
        panel.insertBefore(line,h2);
      }
      if(!panel.querySelector(".qmes-login-subtitle")){
        const sub=document.createElement("div");
        sub.className="qmes-login-subtitle";
        sub.textContent="품질로 더 나은 가치를 만드는 스마트 제조 혁신";
        h2.insertAdjacentElement("afterend",sub);
      }
    }

    const id=panel.querySelector("#qa-id");
    const pw=panel.querySelector("#qa-pw");
    if(id) id.placeholder="아이디 또는 사번";
    if(pw) pw.placeholder="비밀번호";

    const login=panel.querySelector(".qauth-primary");
    if(login && !login.disabled) login.innerHTML="로그인&nbsp;&nbsp;→";
  }

  ensureStyle();
  patchLogin();
  new MutationObserver(patchLogin).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("DOMContentLoaded",patchLogin,{once:true});
})();