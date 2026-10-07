/* NAMO QMES static V40 auth bridge */
(function(){
  "use strict";
  if(window.__NAMO_QMES_STATIC_AUTH_BRIDGE__) return;
  window.__NAMO_QMES_STATIC_AUTH_BRIDGE__=true;
  const KEY="qmes-current-user-v1";
  const $=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function style(){
    if($("#qmes-auth-style")) return;
    const el=document.createElement("style"); el.id="qmes-auth-style";
    el.textContent=`
    #currentUser{position:relative;cursor:pointer;user-select:none}
    #currentUser .qauth-arrow{font-size:10px;color:#94a3b8;margin-left:2px}
    .qauth-menu{position:absolute;right:0;top:calc(100% + 4px);width:180px;background:#fff;border:1px solid #d8e1ea;border-radius:8px;box-shadow:0 14px 34px rgba(15,23,42,.16);padding:6px;display:none;z-index:9000}
    #currentUser.qauth-open .qauth-menu{display:block}#currentUser.qauth-open:after{content:"";position:absolute;right:0;top:100%;width:190px;height:8px;z-index:8999}
    .qauth-menu button{width:100%;height:34px;border:0;border-radius:6px;background:#fff;text-align:left;padding:0 10px;font-size:11px;font-weight:800;color:#334155;cursor:pointer}
    .qauth-menu button:hover{background:#f4f7fb}.qauth-menu .danger{color:#c24141}
    .qauth-overlay,.qauth-modal-bg{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;z-index:100000}
    .qauth-overlay{background:linear-gradient(135deg,#fbfcff 0%,#f6f8ff 58%,#f1efff 100%);padding:0}
    .qauth-modal-bg{background:rgba(15,23,42,.34)}
    .qauth-card{width:min(1900px,98vw);min-height:100vh;background:transparent;border-radius:0;padding:24px 36px;box-shadow:none;display:grid;grid-template-columns:minmax(0,1.8fr) minmax(390px,.62fr);gap:38px;overflow:visible;align-items:center;box-sizing:border-box}
    .qauth-modal{width:min(460px,100%);background:#fff;border-radius:16px;padding:26px;box-shadow:0 24px 64px rgba(0,0,0,.28)}
    .qauth-login-photo{height:min(760px,calc(100vh - 56px));min-height:620px;background-image:url('/qmes-login-illustration-pro.svg?v=20261007-pro4');background-size:contain;background-repeat:no-repeat;background-position:center center;position:relative}
    .qauth-login-photo-inner{display:none}
    .qauth-login-photo-inner span{display:block;font-size:13px;font-weight:800;letter-spacing:2px;opacity:.92}.qauth-login-photo-inner strong{display:block;font-size:38px;line-height:1.05;margin-top:7px}.qauth-login-photo-inner small{display:block;margin-top:10px;font-size:12px;font-weight:700;opacity:.9}
    .qauth-login-panel{width:min(430px,100%);justify-self:center;padding:48px 44px;display:flex;flex-direction:column;justify-content:center;background:rgba(255,255,255,.96);border-radius:22px;box-shadow:0 18px 50px rgba(31,41,55,.08);min-height:600px;box-sizing:border-box}
    .qauth-card h2,.qauth-modal h3{margin:0 0 18px;color:#172033}
    .qauth-card h2{text-align:center;font-size:23px}.qauth-modal h3{font-size:17px}
    .qauth-card label,.qauth-modal label{display:block;font-size:11px;font-weight:800;color:#475569;margin:10px 0 6px}
    .qauth-card input,.qauth-modal input,.qauth-modal select{width:100%;height:42px;border:1px solid #cbd5e1;border-radius:8px;padding:0 11px;font:inherit;font-size:12px;outline:none;background:#fff}
    .qauth-error{min-height:18px;margin-top:8px;font-size:11px;font-weight:700;color:#dc2626}
    .qauth-primary{width:100%;height:44px;margin-top:14px;border:0;border-radius:8px;background:#174d7e;color:#fff;font-weight:900;cursor:pointer}
    .qauth-signup-link{width:100%;height:40px;margin-top:8px;border:1px solid #b9c8d6;border-radius:8px;background:#fff;color:#174d7e;font-weight:900;cursor:pointer}
    .qauth-signup-link:hover{background:#f3f7fb}.qauth-login-options{display:flex;align-items:center;justify-content:space-between;margin:2px 0 2px}.qauth-id-save{display:flex!important;align-items:center;gap:7px;margin:0!important;font-size:11px!important;font-weight:800!important;color:#475569!important;cursor:pointer}.qauth-id-save input{width:15px!important;height:15px!important;margin:0!important;accent-color:#2563eb}
    .qauth-actions{display:flex;gap:8px;margin-top:14px}.qauth-actions button{flex:1;height:40px;border-radius:8px;font-weight:850;cursor:pointer}
    .qauth-cancel{border:1px solid #d8e1ea;background:#fff;color:#475569}.qauth-save{border:1px solid #2563eb;background:#2563eb;color:#fff}
    @media(max-width:900px){.qauth-card{grid-template-columns:1fr;width:min(460px,94vw)}.qauth-login-photo{display:none}.qauth-login-panel{padding:28px;min-height:auto}}
    `; document.head.appendChild(el);
  }

  function norm(a){return {id:a?.id||"",uid:a?.uid||"",name:a?.name||"사용자",email:a?.email||"",dept:a?.department||a?.dept||"",position:a?.title||a?.position||"",role:a?.role||"user",mustChangePassword:Boolean(a?.mustChangePassword)}}
  function save(u){try{sessionStorage.setItem(KEY,JSON.stringify(u))}catch(_){} window.__QMES_CURRENT_USER__=u;}
  function load(){try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");return v&&typeof v==="object"?norm(v):null;}catch(_){return null;}}
  function clear(){try{sessionStorage.removeItem(KEY)}catch(_){} delete window.__QMES_CURRENT_USER__;const box=$("#currentUser");if(box){box.style.visibility="visible";const av=$(".avatar",box),meta=$(".user-meta",box);if(av)av.textContent="";if(meta)meta.innerHTML="<b></b><br><small></small>";}}

  function apply(u){
    save(u);
    const box=$("#currentUser"); if(!box) return;
    box.style.visibility="visible";
    const av=$(".avatar",box), meta=$(".user-meta",box);
    if(av) av.textContent=(u.name||"사").slice(0,1);
    if(meta){const pos=String(u.position||"").trim();const name=String(u.name||"").trim();const same=pos&&name&&pos.replace(/\s+/g,"")===name.replace(/\s+/g,"");const suffix=pos&&!same?" "+esc(pos):"";meta.innerHTML=`<b>${esc(name)}${suffix}</b><br><small>${esc(u.dept)}</small>`;}
    if(!$(".qauth-arrow",box)){const a=document.createElement("span");a.className="qauth-arrow";a.textContent="▼";box.appendChild(a);}
    if(!$(".qauth-menu",box)){const m=document.createElement("div");m.className="qauth-menu";m.innerHTML='<button type="button" data-auth="password">비밀번호 변경</button><button type="button" class="danger" data-auth="logout">로그아웃</button>';box.appendChild(m);}
    const admin=String(u.role||"").toLowerCase()==="admin"||u.role==="관리자";
    document.querySelectorAll("[data-admin-only]").forEach(el=>el.style.display=admin?"":"none");
  }

  function loginScreen(msg=""){
    $("#qauth-login")?.remove();
    const o=document.createElement("div");o.id="qauth-login";o.className="qauth-overlay";
    o.innerHTML=`<form class="qauth-card"><div class="qauth-login-photo"><div class="qauth-login-photo-inner"><span>NAMO CHEMICAL</span><strong>QMES</strong><small>Quality & Manufacturing Execution System</small></div></div><div class="qauth-login-panel"><h2>나모케미칼 QMES</h2><label>아이디 또는 사번</label><input id="qa-id" autocomplete="username"><label>비밀번호</label><input id="qa-pw" type="password" autocomplete="current-password"><div id="qa-err" class="qauth-error">${esc(msg)}</div><div class="qauth-login-options"><label class="qauth-id-save"><input id="qa-save-id" type="checkbox"><span>ID 저장</span></label></div><button class="qauth-primary" type="submit">로그인</button><button class="qauth-signup-link" type="button">회원가입</button></div></form>`;
    document.body.appendChild(o);
    try{const savedId=localStorage.getItem("qmes-saved-login-id-v1")||"";if(savedId){$("#qa-id",o).value=savedId;$("#qa-save-id",o).checked=true;}}catch(_){}
    $(".qauth-signup-link",o)?.addEventListener("click",()=>signupModal());
    $("form",o).addEventListener("submit",async e=>{
      e.preventDefault();const id=$("#qa-id",o).value.trim(),pw=$("#qa-pw",o).value,err=$("#qa-err",o),btn=$(".qauth-primary",o),saveId=Boolean($("#qa-save-id",o)?.checked);
      if(!id||!pw){err.textContent="아이디와 비밀번호를 입력해 주세요.";return;}
      btn.disabled=true;btn.textContent="로그인 확인 중...";
      try{const r=await fetch("/api/auth/login",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({loginId:id,password:pw})});const p=await r.json().catch(()=>({success:false}));if(!r.ok||!p.success||!p.data?.user)throw new Error(p.message||"로그인에 실패했습니다.");const u=norm(p.data.user);try{if(saveId)localStorage.setItem("qmes-saved-login-id-v1",id);else localStorage.removeItem("qmes-saved-login-id-v1");}catch(_){}apply(u);o.remove();if(u.mustChangePassword) passwordModal(true);}
      catch(x){err.textContent=x.message||"로그인에 실패했습니다."}finally{btn.disabled=false;btn.textContent="로그인";}
    });
  }

  function signupModal(){
    $("#qauth-signup")?.remove();
    const b=document.createElement("div");b.id="qauth-signup";b.className="qauth-modal-bg";
    b.innerHTML=`<div class="qauth-modal"><h3>회원가입</h3><label>성명</label><input id="qs-name" autocomplete="name"><label>부서</label><select id="qs-dept"><option>대표</option><option>연구소</option><option>생산부</option><option>영업부</option><option>품질부</option><option>관리부</option></select><label>직급</label><select id="qs-title"><option>사원</option><option>주임</option><option>대리</option><option>과장</option><option>차장</option><option>부장</option><option>이사</option><option>대표이사</option></select><label>이메일</label><input id="qs-email" type="email" autocomplete="email" placeholder="name@namochemical.com"><label>비밀번호</label><input id="qs-pw" type="password" autocomplete="new-password"><label>비밀번호 확인</label><input id="qs-pw2" type="password" autocomplete="new-password"><div id="qs-err" class="qauth-error"></div><div class="qauth-actions"><button class="qauth-cancel" type="button">취소</button><button class="qauth-save" type="button">가입 신청</button></div></div>`;
    document.body.appendChild(b);
    $(".qauth-cancel",b)?.addEventListener("click",()=>b.remove());
    $(".qauth-save",b)?.addEventListener("click",async()=>{
      const name=$("#qs-name",b).value.trim(),department=$("#qs-dept",b).value,title=$("#qs-title",b).value,email=$("#qs-email",b).value.trim().toLowerCase(),pw=$("#qs-pw",b).value,pw2=$("#qs-pw2",b).value,err=$("#qs-err",b),btn=$(".qauth-save",b);
      if(!name||!email||!pw){err.textContent="성명, 이메일, 비밀번호를 입력해 주세요.";return;}
      if(pw.length<4){err.textContent="비밀번호는 4자 이상 입력해 주세요.";return;}
      if(pw!==pw2){err.textContent="비밀번호 확인이 일치하지 않습니다.";return;}
      btn.disabled=true;btn.textContent="가입 신청 중...";
      try{
        const r=await fetch("/api/auth/signup",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password:pw,department,title})});
        const p=await r.json().catch(()=>({success:false}));
        if(!r.ok||!p.success)throw new Error(p.message||"회원가입 신청에 실패했습니다.");
        b.remove();
        const errBox=$("#qa-err");
        if(errBox){errBox.style.color="#16724a";errBox.textContent=p.message||"회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.";}
      }catch(x){err.textContent=x.message||"회원가입 신청에 실패했습니다."}
      finally{btn.disabled=false;btn.textContent="가입 신청";}
    });
  }

  function passwordModal(required){
    $("#qauth-pass")?.remove();
    const b=document.createElement("div");b.id="qauth-pass";b.className="qauth-modal-bg";
    b.innerHTML=`<div class="qauth-modal"><h3>${required?"초기 비밀번호 변경":"비밀번호 변경"}</h3><label>현재 비밀번호</label><input id="qa-cur" type="password"><label>새 비밀번호</label><input id="qa-new" type="password"><label>새 비밀번호 확인</label><input id="qa-conf" type="password"><div id="qa-perr" class="qauth-error"></div><div class="qauth-actions">${required?"":'<button class="qauth-cancel" type="button">취소</button>'}<button class="qauth-save" type="button">변경</button></div></div>`;
    document.body.appendChild(b);
    $(".qauth-cancel",b)?.addEventListener("click",()=>b.remove());
    $(".qauth-save",b)?.addEventListener("click",async()=>{
      const cur=$("#qa-cur",b).value,n=$("#qa-new",b).value,c=$("#qa-conf",b).value,err=$("#qa-perr",b);
      if(n.length<4){err.textContent="새 비밀번호는 4자 이상 입력해 주세요.";return;}if(n!==c){err.textContent="새 비밀번호 확인이 일치하지 않습니다.";return;}
      try{const r=await fetch("/api/auth/password",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:cur,newPassword:n})});const p=await r.json().catch(()=>({success:false}));if(!r.ok||!p.success)throw new Error(p.message||"비밀번호 변경에 실패했습니다.");const u=norm(window.__QMES_CURRENT_USER__||{});u.mustChangePassword=false;apply(u);b.remove();if(typeof toast==="function")toast("비밀번호가 변경되었습니다.");}
      catch(x){err.textContent=x.message||"비밀번호 변경에 실패했습니다."}
    });
  }

  async function logout(){
    try{await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin"})}catch(_){}
    clear();$("#currentUser")?.classList.remove("qauth-open");loginScreen("로그아웃되었습니다.");
  }

  function wire(){
    const box=$("#currentUser");if(!box||box.dataset.qauthWired==="1")return;
    box.dataset.qauthWired="1";
    box.addEventListener("mouseenter",()=>box.classList.add("qauth-open"));
    box.addEventListener("click",e=>{
      const a=e.target.closest("[data-auth]")?.dataset.auth;
      if(a==="password"){e.preventDefault();e.stopPropagation();box.classList.remove("qauth-open");passwordModal(false);return;}
      if(a==="logout"){e.preventDefault();e.stopPropagation();logout();return;}
      e.stopPropagation();
      box.classList.add("qauth-open");
    });
    document.addEventListener("click",e=>{if(!box.contains(e.target))box.classList.remove("qauth-open")});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")box.classList.remove("qauth-open")});
  }

  async function boot(){
    style();wire();
    const cached=load();
    if(cached) apply(cached);
    try{
      const r=await fetch("/api/auth/me",{credentials:"same-origin",cache:"no-store"});
      const p=await r.json().catch(()=>({success:false}));
      if(!r.ok||!p.success||!p.data)throw 0;
      const u=norm(p.data);
      apply(u);
      if(u.mustChangePassword)passwordModal(true);
    }catch(_){
      if(cached){
        apply(cached);
        return;
      }
      clear();
      loginScreen();
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();