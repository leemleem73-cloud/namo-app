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
    .qauth-menu{position:absolute;right:0;top:44px;width:170px;background:#fff;border:1px solid #d8e1ea;border-radius:8px;box-shadow:0 14px 34px rgba(15,23,42,.16);padding:6px;display:none;z-index:9000}
    #currentUser.qauth-open .qauth-menu{display:block}
    .qauth-menu button{width:100%;height:34px;border:0;border-radius:6px;background:#fff;text-align:left;padding:0 10px;font-size:11px;font-weight:800;color:#334155;cursor:pointer}
    .qauth-menu button:hover{background:#f4f7fb}.qauth-menu .danger{color:#c24141}
    .qauth-overlay,.qauth-modal-bg{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;z-index:100000}
    .qauth-overlay{background:linear-gradient(135deg,#07162b,#0c3156)}
    .qauth-modal-bg{background:rgba(15,23,42,.34)}
    .qauth-card,.qauth-modal{width:min(420px,100%);background:#fff;border-radius:16px;padding:26px;box-shadow:0 24px 64px rgba(0,0,0,.28)}
    .qauth-card h2,.qauth-modal h3{margin:0 0 18px;color:#172033}
    .qauth-card h2{text-align:center;font-size:23px}.qauth-modal h3{font-size:17px}
    .qauth-card label,.qauth-modal label{display:block;font-size:11px;font-weight:800;color:#475569;margin:10px 0 6px}
    .qauth-card input,.qauth-modal input{width:100%;height:42px;border:1px solid #cbd5e1;border-radius:8px;padding:0 11px;font:inherit;font-size:12px;outline:none}
    .qauth-error{min-height:18px;margin-top:8px;font-size:11px;font-weight:700;color:#dc2626}
    .qauth-primary{width:100%;height:44px;margin-top:14px;border:0;border-radius:8px;background:#174d7e;color:#fff;font-weight:900;cursor:pointer}
    .qauth-actions{display:flex;gap:8px;margin-top:14px}.qauth-actions button{flex:1;height:40px;border-radius:8px;font-weight:850;cursor:pointer}
    .qauth-cancel{border:1px solid #d8e1ea;background:#fff;color:#475569}.qauth-save{border:1px solid #2563eb;background:#2563eb;color:#fff}
    `; document.head.appendChild(el);
  }

  function norm(a){return {id:a?.id||"",uid:a?.uid||"",name:a?.name||"사용자",email:a?.email||"",dept:a?.department||a?.dept||"",position:a?.title||a?.position||"",role:a?.role||"user",mustChangePassword:Boolean(a?.mustChangePassword)}}
  function save(u){try{sessionStorage.setItem(KEY,JSON.stringify(u))}catch(_){} window.__QMES_CURRENT_USER__=u;}
  function clear(){try{sessionStorage.removeItem(KEY)}catch(_){} delete window.__QMES_CURRENT_USER__;}

  function apply(u){
    save(u);
    const box=$("#currentUser"); if(!box) return;
    const av=$(".avatar",box), meta=$(".user-meta",box);
    if(av) av.textContent=(u.name||"사").slice(0,1);
    if(meta) meta.innerHTML=`<b>${esc(u.name)}${u.position?" "+esc(u.position):""}</b><br><small>${esc(u.dept)}</small>`;
    if(!$(".qauth-arrow",box)){const a=document.createElement("span");a.className="qauth-arrow";a.textContent="▼";box.appendChild(a);}
    if(!$(".qauth-menu",box)){const m=document.createElement("div");m.className="qauth-menu";m.innerHTML='<button type="button" data-auth="password">비밀번호 변경</button><button type="button" class="danger" data-auth="logout">로그아웃</button>';box.appendChild(m);}
    const admin=String(u.role||"").toLowerCase()==="admin"||u.role==="관리자";
    document.querySelectorAll("[data-admin-only]").forEach(el=>el.style.display=admin?"":"none");
  }

  function loginScreen(msg=""){
    $("#qauth-login")?.remove();
    const o=document.createElement("div");o.id="qauth-login";o.className="qauth-overlay";
    o.innerHTML=`<form class="qauth-card"><h2>나모케미칼 QMES</h2><label>아이디 또는 사번</label><input id="qa-id" autocomplete="username"><label>비밀번호</label><input id="qa-pw" type="password" autocomplete="current-password"><div id="qa-err" class="qauth-error">${esc(msg)}</div><button class="qauth-primary" type="submit">로그인</button></form>`;
    document.body.appendChild(o);
    $("form",o).addEventListener("submit",async e=>{
      e.preventDefault();const id=$("#qa-id",o).value.trim(),pw=$("#qa-pw",o).value,err=$("#qa-err",o),btn=$("button",o);
      if(!id||!pw){err.textContent="아이디와 비밀번호를 입력해 주세요.";return;}
      btn.disabled=true;btn.textContent="로그인 확인 중...";
      try{const r=await fetch("/api/auth/login",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({loginId:id,password:pw})});const p=await r.json().catch(()=>({success:false}));if(!r.ok||!p.success||!p.data?.user)throw new Error(p.message||"로그인에 실패했습니다.");const u=norm(p.data.user);apply(u);o.remove();if(u.mustChangePassword) passwordModal(true);}
      catch(x){err.textContent=x.message||"로그인에 실패했습니다."}finally{btn.disabled=false;btn.textContent="로그인";}
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
    const box=$("#currentUser");if(!box)return;
    box.addEventListener("mouseenter",()=>box.classList.add("qauth-open"));box.addEventListener("mouseleave",()=>box.classList.remove("qauth-open"));box.addEventListener("click",e=>{const a=e.target.closest("[data-auth]")?.dataset.auth;if(a==="password"){e.stopPropagation();box.classList.remove("qauth-open");passwordModal(false);return;}if(a==="logout"){e.stopPropagation();logout();return;}box.classList.add("qauth-open");});
    document.addEventListener("click",e=>{if(box&&!box.contains(e.target))box.classList.remove("qauth-open")});
  }

  async function boot(){
    style();wire();
    try{const r=await fetch("/api/auth/me",{credentials:"same-origin",cache:"no-store"});const p=await r.json().catch(()=>({success:false}));if(!r.ok||!p.success||!p.data)throw 0;const u=norm(p.data);apply(u);if(u.mustChangePassword)passwordModal(true);}
    catch(_){clear();loginScreen();}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();