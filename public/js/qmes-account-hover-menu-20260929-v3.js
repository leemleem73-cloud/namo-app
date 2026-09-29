/* QMES account hover menu V3 - 2026-09-29
 * ADD-ONLY / NO OVERWRITE.
 * Robust body-level owner for the visible user-name button.
 * Exactly two actions: 비밀번호 변경 / 로그아웃.
 */
(function(){
  "use strict";
  if(window.__QMES_ACCOUNT_HOVER_MENU_20260929_V3__)return;
  window.__QMES_ACCOUNT_HOVER_MENU_20260929_V3__=true;

  const MENU_ID="qmes-account-hover-menu-20260929-v3";
  const MODAL_ID="qmes-account-password-modal-20260929-v3";
  const STYLE_ID="qmes-account-hover-menu-style-20260929-v3";
  let closeTimer=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      html body #qmes-user-dropdown,
      html body #qmes-erp-header .qmes-erp-account-menu{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #${MENU_ID}{
        display:none;position:fixed;z-index:50000;width:184px;padding:6px;
        border:1px solid #cbd8e2;border-radius:8px;background:#fff;
        box-shadow:0 10px 26px rgba(37,76,105,.20);
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif
      }
      #${MENU_ID}.is-open{display:block!important}
      #${MENU_ID} button{
        display:flex;width:100%;height:38px;align-items:center;justify-content:flex-start;
        padding:0 12px;margin:0;border:0;border-radius:6px;background:#fff;
        color:#334e62;font-size:12px;font-weight:800;cursor:pointer
      }
      #${MENU_ID} button:hover{background:#edf6fb;color:#1e5d88}
      #${MENU_ID} button+button{margin-top:3px;border-top:1px solid #edf1f4;color:#a53a34}
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:60000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.58)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${MODAL_ID} .card{width:min(430px,calc(100vw - 32px))!important;background:#fff!important;border:1px solid #d5e0e8!important;border-radius:12px!important;box-shadow:0 22px 60px rgba(15,23,42,.28)!important;overflow:hidden!important}
      #${MODAL_ID} .head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:16px 18px!important;border-bottom:1px solid #e4ebf0!important;background:#f8fbfd!important}
      #${MODAL_ID} .head b{font-size:17px!important;color:#1f415a!important}
      #${MODAL_ID} .x{width:30px!important;height:30px!important;border:1px solid #cbd8e2!important;border-radius:7px!important;background:#fff!important;font-size:18px!important;cursor:pointer!important}
      #${MODAL_ID} form{display:block!important;position:static!important;margin:0!important;padding:17px 18px 18px!important;transform:none!important;background:#fff!important}
      #${MODAL_ID} label{display:block!important;margin:0 0 12px!important;color:#40586b!important;font-size:12px!important;font-weight:800!important}
      #${MODAL_ID} input{display:block!important;width:100%!important;height:40px!important;margin-top:5px!important;padding:0 10px!important;border:1px solid #bccbd6!important;border-radius:7px!important;font-size:13px!important}
      #${MODAL_ID} .error{min-height:18px!important;color:#b42318!important;font-size:11px!important;font-weight:750!important}
      #${MODAL_ID} .actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:9px!important}
      #${MODAL_ID} .actions button{height:36px!important;min-width:88px!important;padding:0 13px!important;border-radius:7px!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}
      #${MODAL_ID} .cancel{border:1px solid #cbd8e2!important;background:#fff!important;color:#4a6274!important}
      #${MODAL_ID} .save{border:1px solid #2f78b7!important;background:#2f78b7!important;color:#fff!important}
    `;
    document.head.appendChild(s);
  }

  function accountButton(){
    return document.querySelector("#qmes-erp-header .qmes-erp-header-account")
      ||document.querySelector('#qmes-erp-header button[aria-label="사용자 메뉴"]')
      ||document.querySelector('#qmes-erp-header button[aria-label="계정 설정 열기"]');
  }

  function ensureMenu(){
    ensureStyle();
    document.querySelectorAll("#qmes-user-dropdown").forEach(el=>el.remove());
    let m=document.getElementById(MENU_ID);
    if(!m){
      m=document.createElement("div");
      m.id=MENU_ID;
      m.setAttribute("role","menu");
      m.setAttribute("aria-label","사용자 메뉴");
      m.innerHTML='<button type="button" role="menuitem" data-qmes-v3-action="password">비밀번호 변경</button><button type="button" role="menuitem" data-qmes-v3-action="logout">로그아웃</button>';
      document.body.appendChild(m);
      m.addEventListener("mouseenter",()=>{if(closeTimer){clearTimeout(closeTimer);closeTimer=null}});
      m.addEventListener("mouseleave",scheduleClose);
    }
    return m;
  }

  function positionMenu(){
    const b=accountButton(),m=ensureMenu();
    if(!b||!m)return false;
    const r=b.getBoundingClientRect();
    const width=184;
    const left=Math.max(8,Math.min(window.innerWidth-width-8,r.right-width));
    m.style.left=Math.round(left)+"px";
    m.style.top=Math.round(r.bottom+4)+"px";
    return true;
  }
  function openMenu(){
    if(closeTimer){clearTimeout(closeTimer);closeTimer=null}
    const b=accountButton(),m=ensureMenu();
    if(!b||!m)return;
    positionMenu();
    m.classList.add("is-open");
    b.setAttribute("aria-expanded","true");
  }
  function closeMenu(){
    document.getElementById(MENU_ID)?.classList.remove("is-open");
    accountButton()?.setAttribute("aria-expanded","false");
  }
  function scheduleClose(){
    if(closeTimer)clearTimeout(closeTimer);
    closeTimer=setTimeout(closeMenu,320);
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove()}
  function openPassword(){
    closeMenu();ensureStyle();closeModal();
    const o=document.createElement("div");
    o.id=MODAL_ID;
    o.innerHTML='<div class="card"><div class="head"><b>비밀번호 변경</b><button type="button" class="x">×</button></div><form><label>현재 비밀번호<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>새 비밀번호<input name="newPassword" type="password" autocomplete="new-password" minlength="4" required></label><label>새 비밀번호 확인<input name="confirmPassword" type="password" autocomplete="new-password" minlength="4" required></label><div class="error"></div><div class="actions"><button type="button" class="cancel">취소</button><button type="submit" class="save">변경 저장</button></div></form></div>';
    document.body.appendChild(o);
    o.querySelector(".x").onclick=closeModal;
    o.querySelector(".cancel").onclick=closeModal;
    o.addEventListener("mousedown",e=>{if(e.target===o)closeModal()});
    const form=o.querySelector("form"),err=o.querySelector(".error");
    form.addEventListener("submit",async e=>{
      e.preventDefault();err.textContent="";
      const currentPassword=String(form.elements.currentPassword.value||"");
      const newPassword=String(form.elements.newPassword.value||"");
      const confirmPassword=String(form.elements.confirmPassword.value||"");
      if(newPassword.length<4){err.textContent="새 비밀번호는 4자 이상 입력하세요.";return}
      if(newPassword!==confirmPassword){err.textContent="새 비밀번호 확인이 일치하지 않습니다.";return}
      const btn=form.querySelector(".save");btn.disabled=true;btn.textContent="변경 중...";
      try{
        const r=await fetch("/api/auth/password",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword,newPassword})});
        const j=await r.json().catch(()=>({}));
        if(!r.ok||!j.success){err.textContent=j.message||"비밀번호 변경에 실패했습니다.";return}
        closeModal();alert("비밀번호가 변경되었습니다.");
      }catch(_){err.textContent="비밀번호 변경 요청 중 오류가 발생했습니다."}
      finally{if(btn&&btn.isConnected){btn.disabled=false;btn.textContent="변경 저장"}}
    });
    setTimeout(()=>form.elements.currentPassword.focus(),0);
  }

  async function logout(){
    closeMenu();
    try{await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin"})}catch(_){}
    try{
      sessionStorage.removeItem("qmes-current-user-v1");
      sessionStorage.removeItem("qmes_current_tab");
      sessionStorage.removeItem("qmes_open_menu");
      sessionStorage.removeItem("qmes_erp_active_label");
    }catch(_){}
    window.location.replace("/?_qmesLogout="+Date.now());
  }

  document.addEventListener("mouseover",e=>{
    const b=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-header-account, #qmes-erp-header button[aria-label='사용자 메뉴'], #qmes-erp-header button[aria-label='계정 설정 열기']"):null;
    const m=e.target instanceof Element?e.target.closest("#"+MENU_ID):null;
    if(b||m)openMenu();
  },true);
  document.addEventListener("mouseout",e=>{
    const b=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-header-account, #qmes-erp-header button[aria-label='사용자 메뉴'], #qmes-erp-header button[aria-label='계정 설정 열기']"):null;
    const m=e.target instanceof Element?e.target.closest("#"+MENU_ID):null;
    if(b||m)scheduleClose();
  },true);
  document.addEventListener("click",e=>{
    const action=e.target instanceof Element?e.target.closest("[data-qmes-v3-action]"):null;
    if(action){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      action.dataset.qmesV3Action==="password"?openPassword():logout();
      return;
    }
    const b=e.target instanceof Element?e.target.closest("#qmes-erp-header .qmes-erp-header-account, #qmes-erp-header button[aria-label='사용자 메뉴'], #qmes-erp-header button[aria-label='계정 설정 열기']"):null;
    if(b){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const m=ensureMenu();
      m.classList.contains("is-open")?closeMenu():openMenu();
      return;
    }
    if(!e.target.closest?.("#"+MENU_ID))closeMenu();
  },true);

  const obs=new MutationObserver(()=>{ensureMenu();positionMenu()});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  ["qmes:auth-bootstrap-settled","qmes:authenticated","qmes:login-success","qmes:user-changed"].forEach(n=>window.addEventListener(n,()=>{setTimeout(ensureMenu,0);setTimeout(positionMenu,100);setTimeout(positionMenu,500)}));
  window.addEventListener("resize",()=>{if(document.getElementById(MENU_ID)?.classList.contains("is-open"))positionMenu()});
  window.addEventListener("pageshow",ensureMenu);
  ensureMenu();
})();