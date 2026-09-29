/* QMES persistent account menu - 2026-09-29
 * ADD-ONLY / NO OVERWRITE.
 * Keeps password/logout menu alive across login/logout and SPA header remounts.
 */
(function(){
  "use strict";
  if(window.__QMES_PERSISTENT_ACCOUNT_MENU_20260929_V1__)return;
  window.__QMES_PERSISTENT_ACCOUNT_MENU_20260929_V1__=true;

  var STYLE_ID="qmes-persistent-account-menu-style-20260929-v1";
  var MODAL_ID="qmes-persistent-password-modal-20260929-v1";
  var closeTimer=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=
      'html body #qmes-erp-header .qmes-erp-account-wrap{position:relative!important;overflow:visible!important;z-index:16000!important}'+
      'html body #qmes-erp-header .qmes-erp-account-menu.qmes-persistent-account-menu{display:none!important;position:absolute!important;top:36px!important;right:0!important;width:184px!important;min-width:184px!important;padding:6px!important;margin:0!important;border:1px solid #cbd8e2!important;border-radius:8px!important;background:#fff!important;box-shadow:0 10px 26px rgba(37,76,105,.20)!important;z-index:16050!important;pointer-events:auto!important}'+
      'html body #qmes-erp-header .qmes-erp-account-wrap.is-open>.qmes-erp-account-menu.qmes-persistent-account-menu{display:block!important}'+
      'html body #qmes-erp-header .qmes-erp-account-menu.qmes-persistent-account-menu button{display:flex!important;width:100%!important;height:38px!important;align-items:center!important;justify-content:flex-start!important;padding:0 12px!important;border:0!important;border-radius:6px!important;background:#fff!important;color:#334e62!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}'+
      'html body #qmes-erp-header .qmes-erp-account-menu.qmes-persistent-account-menu button:hover{background:#edf6fb!important;color:#1e5d88!important}'+
      'html body #qmes-erp-header .qmes-erp-account-menu.qmes-persistent-account-menu button+button{margin-top:3px!important;border-top:1px solid #edf1f4!important;color:#a53a34!important}'+
      '#'+MODAL_ID+'{position:fixed!important;inset:0!important;z-index:30000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.58)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}'+
      '#'+MODAL_ID+' .card{width:min(430px,calc(100vw - 32px))!important;background:#fff!important;border:1px solid #d5e0e8!important;border-radius:12px!important;box-shadow:0 22px 60px rgba(15,23,42,.28)!important;overflow:hidden!important}'+
      '#'+MODAL_ID+' .head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:16px 18px!important;border-bottom:1px solid #e4ebf0!important;background:#f8fbfd!important}'+
      '#'+MODAL_ID+' .head b{font-size:17px!important;color:#1f415a!important}'+
      '#'+MODAL_ID+' .x{width:30px!important;height:30px!important;border:1px solid #cbd8e2!important;border-radius:7px!important;background:#fff!important;font-size:18px!important;cursor:pointer!important}'+
      '#'+MODAL_ID+' form{display:block!important;position:static!important;margin:0!important;padding:17px 18px 18px!important;transform:none!important;background:#fff!important}'+
      '#'+MODAL_ID+' label{display:block!important;margin:0 0 12px!important;color:#40586b!important;font-size:12px!important;font-weight:800!important}'+
      '#'+MODAL_ID+' input{display:block!important;width:100%!important;height:40px!important;margin-top:5px!important;padding:0 10px!important;border:1px solid #bccbd6!important;border-radius:7px!important;font-size:13px!important}'+
      '#'+MODAL_ID+' .error{min-height:18px!important;color:#b42318!important;font-size:11px!important;font-weight:750!important}'+
      '#'+MODAL_ID+' .actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:9px!important}'+
      '#'+MODAL_ID+' .actions button{height:36px!important;min-width:88px!important;padding:0 13px!important;border-radius:7px!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}'+
      '#'+MODAL_ID+' .cancel{border:1px solid #cbd8e2!important;background:#fff!important;color:#4a6274!important}'+
      '#'+MODAL_ID+' .save{border:1px solid #2f78b7!important;background:#2f78b7!important;color:#fff!important}';
    document.head.appendChild(s);
  }

  function wrap(){
    return document.querySelector("#qmes-erp-header .qmes-erp-account-wrap");
  }
  function account(){
    return document.querySelector("#qmes-erp-header .qmes-erp-header-account");
  }
  function closeMenu(){
    var w=wrap(),a=account();
    if(w)w.classList.remove("is-open");
    if(a)a.setAttribute("aria-expanded","false");
  }
  function openMenu(){
    ensure();
    var w=wrap(),a=account();
    if(!w||!a)return;
    if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
    w.classList.add("is-open");
    a.setAttribute("aria-expanded","true");
  }
  function scheduleClose(){
    if(closeTimer)clearTimeout(closeTimer);
    closeTimer=setTimeout(closeMenu,300);
  }

  function ensure(){
    ensureStyle();
    var w=wrap(),a=account();
    if(!w||!a)return false;
    a.setAttribute("aria-label","사용자 메뉴");
    a.setAttribute("aria-haspopup","menu");
    var m=w.querySelector(".qmes-erp-account-menu");
    if(!m){
      m=document.createElement("div");
      m.className="qmes-erp-account-menu qmes-persistent-account-menu";
      m.setAttribute("role","menu");
      w.appendChild(m);
    }
    m.classList.add("qmes-persistent-account-menu");
    if(!m.querySelector('[data-qmes-persistent-action="password"]')){
      var p=document.createElement("button");
      p.type="button";p.setAttribute("role","menuitem");
      p.dataset.qmesPersistentAction="password";
      p.textContent="비밀번호 변경";
      m.appendChild(p);
    }
    if(!m.querySelector('[data-qmes-persistent-action="logout"]')){
      var l=document.createElement("button");
      l.type="button";l.setAttribute("role","menuitem");
      l.dataset.qmesPersistentAction="logout";
      l.textContent="로그아웃";
      m.appendChild(l);
    }
    return true;
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove();}
  function openPassword(){
    ensureStyle();closeModal();closeMenu();
    var o=document.createElement("div");
    o.id=MODAL_ID;
    o.innerHTML='<div class="card"><div class="head"><b>비밀번호 변경</b><button type="button" class="x">×</button></div><form><label>현재 비밀번호<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>새 비밀번호<input name="newPassword" type="password" autocomplete="new-password" minlength="4" required></label><label>새 비밀번호 확인<input name="confirmPassword" type="password" autocomplete="new-password" minlength="4" required></label><div class="error"></div><div class="actions"><button type="button" class="cancel">취소</button><button type="submit" class="save">변경 저장</button></div></form></div>';
    document.body.appendChild(o);
    o.querySelector(".x").onclick=closeModal;
    o.querySelector(".cancel").onclick=closeModal;
    o.addEventListener("mousedown",function(e){if(e.target===o)closeModal();});
    var form=o.querySelector("form"),err=o.querySelector(".error");
    form.addEventListener("submit",async function(e){
      e.preventDefault();err.textContent="";
      var currentPassword=String(form.elements.currentPassword.value||"");
      var newPassword=String(form.elements.newPassword.value||"");
      var confirmPassword=String(form.elements.confirmPassword.value||"");
      if(newPassword.length<4){err.textContent="새 비밀번호는 4자 이상 입력하세요.";return;}
      if(newPassword!==confirmPassword){err.textContent="새 비밀번호 확인이 일치하지 않습니다.";return;}
      var b=form.querySelector(".save");b.disabled=true;b.textContent="변경 중...";
      try{
        var r=await fetch("/api/auth/password",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:currentPassword,newPassword:newPassword})});
        var j=await r.json().catch(function(){return{};});
        if(!r.ok||!j.success){err.textContent=j.message||"비밀번호 변경에 실패했습니다.";return;}
        closeModal();alert("비밀번호가 변경되었습니다.");
      }catch(_){err.textContent="비밀번호 변경 요청 중 오류가 발생했습니다.";}
      finally{if(b&&b.isConnected){b.disabled=false;b.textContent="변경 저장";}}
    });
    setTimeout(function(){form.elements.currentPassword.focus();},0);
  }

  async function logout(){
    closeMenu();
    try{await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin"});}catch(_){}
    try{
      sessionStorage.removeItem("qmes-current-user-v1");
      sessionStorage.removeItem("qmes_current_tab");
      sessionStorage.removeItem("qmes_open_menu");
      sessionStorage.removeItem("qmes_erp_active_label");
    }catch(_){}
    window.location.replace("/?_qmesLogout="+Date.now());
  }

  document.addEventListener("mouseover",function(e){
    var a=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-header-account"):null;
    var m=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-account-menu"):null;
    if(a||m)openMenu();
  },true);
  document.addEventListener("mouseout",function(e){
    var a=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-header-account"):null;
    var m=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-account-menu"):null;
    if(a||m)scheduleClose();
  },true);
  document.addEventListener("click",function(e){
    var t=e.target instanceof Element?e.target.closest("[data-qmes-persistent-action]"):null;
    if(t){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(t.dataset.qmesPersistentAction==="password")openPassword();else logout();
      return;
    }
    var a=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-header-account"):null;
    if(a){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      var w=wrap();if(w&&w.classList.contains("is-open"))closeMenu();else openMenu();
      return;
    }
    var w=wrap();if(w&&!w.contains(e.target))closeMenu();
  },true);

  var observer=new MutationObserver(function(){ensure();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ["qmes:auth-bootstrap-settled","qmes:authenticated","qmes:login-success","qmes:user-changed"].forEach(function(n){
    window.addEventListener(n,function(){setTimeout(ensure,0);setTimeout(ensure,100);setTimeout(ensure,500);});
  });
  window.addEventListener("pageshow",ensure);
  window.addEventListener("focus",ensure);
  ensure();
  setInterval(ensure,1500);
})();