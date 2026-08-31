/* NAMO QMES - login-first shell - 2026-08-31
 * ADD-ONLY recovery patch.
 * A fixed login layer is rendered before legacy QMES modules execute. This keeps
 * login usable even while old feature scripts initialise behind it.
 */
(function installQmesLoginFirstShell(global){
  "use strict";
  if(global.__QMES_LOGIN_FIRST_SHELL_20260831_V1__) return;
  global.__QMES_LOGIN_FIRST_SHELL_20260831_V1__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const ID="qmes-login-first-shell-20260831-v1";
  const clean=value=>String(value==null?"":value).trim();

  function normalize(user){
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

  function save(user){
    const normalized=normalize(user);
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(normalized));}catch(_error){}
    global.__QMES_CURRENT_USER__=normalized;
    global.__QMES_USER__=`${normalized.dept||""} ${normalized.name||""} (${normalized.uid||""})`;
    return normalized;
  }

  function clear(){
    try{sessionStorage.removeItem(SESSION_KEY);}catch(_error){}
    delete global.__QMES_CURRENT_USER__;
    delete global.__QMES_USER__;
  }

  function ensureStyle(){
    if(document.getElementById(`${ID}-style`)) return;
    const style=document.createElement("style");
    style.id=`${ID}-style`;
    style.textContent=`
      #${ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:linear-gradient(135deg,#07162b,#0c3156)!important;font-family:Pretendard,'Noto Sans KR',sans-serif!important;box-sizing:border-box!important}
      #${ID}[data-state="checking"] .qlfs-form{opacity:.94!important}
      #${ID} .qlfs-form{width:min(420px,100%)!important;padding:36px 32px!important;border:0!important;border-radius:22px!important;background:#fff!important;box-shadow:0 24px 70px rgba(0,0,0,.32)!important;box-sizing:border-box!important}
      #${ID} .qlfs-title{text-align:center!important;margin-bottom:7px!important;color:#0f2740!important;font-size:25px!important;font-weight:950!important}
      #${ID} .qlfs-sub{text-align:center!important;margin-bottom:26px!important;color:#64748b!important;font-size:12px!important;font-weight:700!important}
      #${ID} label{display:block!important;margin-top:14px!important;color:#334155!important;font-size:12px!important;font-weight:800!important}
      #${ID} input{display:block!important;width:100%!important;height:46px!important;margin-top:6px!important;padding:0 13px!important;border:1px solid #cbd5e1!important;border-radius:11px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:14px!important;box-sizing:border-box!important;outline:none!important}
      #${ID} input:focus{border-color:#0f5d8f!important;box-shadow:0 0 0 3px rgba(15,93,143,.12)!important}
      #${ID} .qlfs-error{display:none!important;margin-top:12px!important;padding:10px 11px!important;border-radius:9px!important;background:#fef2f2!important;color:#b91c1c!important;font-size:12px!important;font-weight:800!important;line-height:1.45!important}
      #${ID} .qlfs-error.show{display:block!important}
      #${ID} .qlfs-login{width:100%!important;height:48px!important;margin-top:20px!important;border:0!important;border-radius:11px!important;background:#0f5d8f!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:15px!important;font-weight:900!important;cursor:pointer!important}
      #${ID} .qlfs-login:disabled{opacity:.65!important;cursor:wait!important}
      #${ID} .qlfs-foot{margin-top:15px!important;text-align:center!important;color:#64748b!important;font-size:11px!important;font-weight:700!important}
      #${ID} .qlfs-check{padding:22px 0 5px!important;text-align:center!important;color:#475569!important;font-size:13px!important;font-weight:800!important}
    `;
    document.head.appendChild(style);
  }

  function build(){
    if(document.getElementById(ID)) return document.getElementById(ID);
    ensureStyle();
    const layer=document.createElement("div");
    layer.id=ID;
    layer.dataset.state="checking";
    layer.innerHTML=`<form class="qlfs-form" autocomplete="on"><div class="qlfs-title">나모케미칼 QMES</div><div class="qlfs-sub">로그인 상태를 확인하고 있습니다.</div><div class="qlfs-fields" hidden><label>아이디 또는 사번<input name="loginId" autocomplete="username" placeholder="성명 또는 사번"></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" placeholder="비밀번호"></label><div class="qlfs-error" role="alert"></div><button class="qlfs-login" type="submit">로그인</button><div class="qlfs-foot">로그인 후 QMES 공용 DB가 연결됩니다.</div></div><div class="qlfs-check">로그인 상태 확인 중...</div></form>`;
    document.body.appendChild(layer);
    return layer;
  }

  function showLogin(message){
    const layer=build();
    layer.dataset.state="login";
    layer.querySelector(".qlfs-fields").hidden=false;
    layer.querySelector(".qlfs-check").hidden=true;
    layer.querySelector(".qlfs-sub").textContent="계정 정보를 입력해 주세요.";
    const error=layer.querySelector(".qlfs-error");
    if(message){error.textContent=message;error.classList.add("show");}
    else{error.textContent="";error.classList.remove("show");}
    setTimeout(()=>layer.querySelector('input[name="loginId"]')?.focus(),0);
  }

  function hide(){
    const layer=document.getElementById(ID);
    if(layer) layer.remove();
  }

  async function json(response){try{return await response.json();}catch(_error){return null;}}

  async function checkExisting(){
    build();
    try{
      const response=await fetch("/api/auth/me",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}});
      const payload=await json(response);
      if(response.ok&&payload?.success&&payload?.data){
        save(payload.data);
        hide();
        try{global.dispatchEvent(new CustomEvent("qmes:auth-shell-ready",{detail:{user:payload.data}}));}catch(_error){}
        return;
      }
    }catch(_error){}
    clear();
    showLogin("");
  }

  function bind(){
    const layer=build();
    const form=layer.querySelector(".qlfs-form");
    if(form.dataset.bound==="1") return;
    form.dataset.bound="1";
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const id=clean(form.elements.loginId?.value);
      const password=clean(form.elements.password?.value);
      const button=form.querySelector(".qlfs-login");
      const error=form.querySelector(".qlfs-error");
      if(!id||!password){showLogin("아이디와 비밀번호를 입력해 주세요.");return;}
      button.disabled=true;button.textContent="로그인 확인 중...";
      error.classList.remove("show");
      try{
        const response=await fetch("/api/auth/login",{
          method:"POST",
          credentials:"same-origin",
          cache:"no-store",
          headers:{"Content-Type":"application/json","Accept":"application/json"},
          body:JSON.stringify({loginId:id,password})
        });
        const payload=await json(response);
        if(!response.ok||!payload?.success||!payload?.data?.user){
          showLogin(payload?.message||`로그인에 실패했습니다. (${response.status})`);
          return;
        }
        save(payload.data.user);
        button.textContent="로그인 완료";
        /* One intentional reload starts QMES with a verified cookie + browser session.
           The early auth guard prevents any background 401 reload loop. */
        global.setTimeout(()=>global.location.replace(`${global.location.pathname}${global.location.search}${global.location.hash}`),80);
      }catch(err){
        console.error("[QMES LOGIN FIRST]",err);
        showLogin("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }finally{
        button.disabled=false;
        if(button.textContent!=="로그인 완료")button.textContent="로그인";
      }
    });
  }

  function start(){build();bind();checkExisting();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(window);
