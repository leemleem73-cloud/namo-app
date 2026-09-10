(function(){
  'use strict';
  if(window.__QMES_ACCOUNT_PORTAL_STABLE5__)return;
  window.__QMES_ACCOUNT_PORTAL_STABLE5__=true;

  const STYLE_ID='qmes-account-portal-style-20260910';
  const MENU_ID='qmes-account-portal-menu-20260910';
  const MODAL_ID='qmes-password-modal-fix-20260910';
  const MOBILE_URL='/mobile.html?v=20260903-mobile-dedicated1';
  let closeTimer=null;
  let boundAccount=null;

  function currentUser(){
    if(window.__QMES_CURRENT_USER__&&typeof window.__QMES_CURRENT_USER__==='object')return window.__QMES_CURRENT_USER__;
    try{return JSON.parse(sessionStorage.getItem('qmes-current-user-v1')||'null');}catch(_error){return null;}
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #qmes-erp-header{overflow:visible!important}
      html body #qmes-erp-header .qmes-erp-account-wrap{position:relative!important;overflow:visible!important;z-index:32000!important}
      html body #qmes-erp-header .qmes-erp-header-account{cursor:pointer!important}
      html body #qmes-erp-header .qmes-erp-account-menu{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #${MENU_ID}{position:fixed!important;z-index:45000!important;width:190px!important;padding:7px!important;box-sizing:border-box!important;border:1px solid #cbd8e2!important;border-radius:9px!important;background:#fff!important;box-shadow:0 14px 34px rgba(29,61,84,.24)!important;font-family:Pretendard,'Noto Sans KR','Malgun Gothic',Arial,sans-serif!important}
      #${MENU_ID}[hidden]{display:none!important}
      #${MENU_ID} button{display:flex!important;align-items:center!important;width:100%!important;height:42px!important;margin:0!important;padding:0 12px!important;box-sizing:border-box!important;border:0!important;border-radius:6px!important;background:#fff!important;color:#334e62!important;font-size:12.5px!important;font-weight:800!important;text-align:left!important;white-space:nowrap!important;cursor:pointer!important}
      #${MENU_ID} button:hover,#${MENU_ID} button:focus{background:#eaf4fb!important;color:#1e5d88!important;outline:0!important}
      #${MENU_ID} .qmes-account-portal-logout{margin-top:4px!important;border-top:1px solid #e8eef2!important;color:#a53a34!important}
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:50000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;background:rgba(15,23,42,.58)!important;font-family:Pretendard,'Noto Sans KR','Malgun Gothic',Arial,sans-serif!important}
      #${MODAL_ID} .qmes-pw-card{width:min(430px,calc(100vw - 32px))!important;max-height:calc(100vh - 40px)!important;overflow:auto!important;background:#fff!important;border:1px solid #d5e0e8!important;border-radius:12px!important;box-shadow:0 22px 60px rgba(15,23,42,.28)!important;color:#263d4f!important}
      #${MODAL_ID} .qmes-pw-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:18px 20px 14px!important;border-bottom:1px solid #e4ebf0!important;background:#f8fbfd!important}
      #${MODAL_ID} .qmes-pw-head b{font-size:18px!important;font-weight:900!important;color:#1f415a!important}
      #${MODAL_ID} .qmes-pw-close{width:32px!important;height:32px!important;border:1px solid #cbd8e2!important;border-radius:7px!important;background:#fff!important;color:#526b7d!important;font-size:20px!important;cursor:pointer!important}
      #${MODAL_ID} form{display:block!important;position:static!important;width:auto!important;height:auto!important;margin:0!important;padding:18px 20px 20px!important;transform:none!important;background:#fff!important}
      #${MODAL_ID} label{display:block!important;margin:0 0 13px!important;color:#40586b!important;font-size:12px!important;font-weight:800!important}
      #${MODAL_ID} input{display:block!important;width:100%!important;height:42px!important;margin-top:6px!important;padding:0 11px!important;box-sizing:border-box!important;border:1px solid #bccbd6!important;border-radius:7px!important;background:#fff!important;color:#263d4f!important;font-size:13px!important;outline:none!important}
      #${MODAL_ID} input:focus{border-color:#4b91bf!important;box-shadow:0 0 0 3px rgba(75,145,191,.12)!important}
      #${MODAL_ID} .qmes-pw-error{min-height:18px!important;margin-top:4px!important;color:#b42318!important;font-size:11px!important;font-weight:750!important;line-height:1.45!important}
      #${MODAL_ID} .qmes-pw-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:10px!important}
      #${MODAL_ID} .qmes-pw-actions button{height:38px!important;min-width:92px!important;padding:0 14px!important;border-radius:7px!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}
      #${MODAL_ID} .qmes-pw-cancel{border:1px solid #cbd8e2!important;background:#fff!important;color:#4a6274!important}
      #${MODAL_ID} .qmes-pw-save{border:1px solid #2f78b7!important;background:#2f78b7!important;color:#fff!important}
      #${MODAL_ID} .qmes-pw-save:disabled{opacity:.6!important;cursor:wait!important}
    `;
    document.head.appendChild(style);
  }

  function cancelClose(){if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}}
  function scheduleClose(delay=650){cancelClose();closeTimer=setTimeout(hideMenu,delay);}

  function accountButton(){return document.querySelector('#qmes-erp-header .qmes-erp-header-account');}

  function ensureMenu(){
    let menu=document.getElementById(MENU_ID);
    if(menu)return menu;
    menu=document.createElement('div');
    menu.id=MENU_ID;
    menu.hidden=true;
    menu.setAttribute('role','menu');
    menu.setAttribute('aria-label','사용자 메뉴');
    menu.innerHTML='<button type="button" role="menuitem" data-qmes-portal-action="password">비밀번호 변경</button><button type="button" role="menuitem" class="qmes-account-portal-logout" data-qmes-portal-action="logout">로그아웃</button>';
    document.body.appendChild(menu);
    menu.addEventListener('mouseenter',cancelClose);
    menu.addEventListener('mouseleave',()=>scheduleClose(650));
    menu.addEventListener('click',event=>{
      const action=event.target instanceof Element?event.target.closest('[data-qmes-portal-action]'):null;
      if(!action)return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      hideMenu();
      if(action.dataset.qmesPortalAction==='password')openPasswordModal();
      if(action.dataset.qmesPortalAction==='logout')logoutNow();
    },true);
    return menu;
  }

  function positionMenu(){
    const button=accountButton();
    const menu=document.getElementById(MENU_ID);
    if(!button||!menu||menu.hidden)return;
    const rect=button.getBoundingClientRect();
    const width=190;
    const left=Math.max(8,Math.min(window.innerWidth-width-8,rect.right-width));
    menu.style.setProperty('left',Math.round(left)+'px','important');
    menu.style.setProperty('top',Math.round(rect.bottom+5)+'px','important');
  }

  function showMenu(){
    if(!currentUser())return;
    cancelClose();
    ensureStyle();
    const menu=ensureMenu();
    menu.hidden=false;
    menu.style.setProperty('display','block','important');
    menu.style.setProperty('visibility','visible','important');
    menu.style.setProperty('opacity','1','important');
    menu.style.setProperty('pointer-events','auto','important');
    accountButton()?.setAttribute('aria-expanded','true');
    positionMenu();
  }

  function hideMenu(){
    cancelClose();
    const menu=document.getElementById(MENU_ID);
    if(menu){
      menu.hidden=true;
      menu.style.setProperty('display','none','important');
    }
    accountButton()?.setAttribute('aria-expanded','false');
  }

  function closePasswordModal(){document.getElementById(MODAL_ID)?.remove();}

  function openPasswordModal(){
    ensureStyle();
    closePasswordModal();
    const overlay=document.createElement('div');
    overlay.id=MODAL_ID;
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','비밀번호 변경 창');
    overlay.innerHTML='<div class="qmes-pw-card"><div class="qmes-pw-head"><b>비밀번호 변경</b><button type="button" class="qmes-pw-close" aria-label="닫기">×</button></div><form><label>현재 비밀번호<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>새 비밀번호<input name="newPassword" type="password" autocomplete="new-password" minlength="4" required></label><label>새 비밀번호 확인<input name="confirmPassword" type="password" autocomplete="new-password" minlength="4" required></label><div class="qmes-pw-error" aria-live="polite"></div><div class="qmes-pw-actions"><button type="button" class="qmes-pw-cancel">취소</button><button type="submit" class="qmes-pw-save">변경 저장</button></div></form></div>';
    document.body.appendChild(overlay);
    const form=overlay.querySelector('form');
    const errorBox=overlay.querySelector('.qmes-pw-error');
    const close=()=>closePasswordModal();
    overlay.querySelector('.qmes-pw-close')?.addEventListener('click',close);
    overlay.querySelector('.qmes-pw-cancel')?.addEventListener('click',close);
    overlay.addEventListener('mousedown',event=>{if(event.target===overlay)close();});
    form?.addEventListener('submit',async event=>{
      event.preventDefault();
      errorBox.textContent='';
      const currentPassword=String(form.elements.currentPassword?.value||'');
      const newPassword=String(form.elements.newPassword?.value||'');
      const confirmPassword=String(form.elements.confirmPassword?.value||'');
      if(!currentPassword){errorBox.textContent='현재 비밀번호를 입력하세요.';return;}
      if(newPassword.length<4){errorBox.textContent='새 비밀번호는 4자 이상 입력하세요.';return;}
      if(newPassword!==confirmPassword){errorBox.textContent='새 비밀번호 확인이 일치하지 않습니다.';return;}
      const submit=form.querySelector('.qmes-pw-save');
      submit.disabled=true;
      submit.textContent='변경 중...';
      try{
        const response=await fetch('/api/auth/password',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});
        const payload=await response.json().catch(()=>({}));
        if(!response.ok||!payload.success){errorBox.textContent=payload.message||'비밀번호 변경에 실패했습니다.';return;}
        close();
        alert('비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
      }catch(error){
        console.error('[QMES] password change failed',error);
        errorBox.textContent='비밀번호 변경 요청 중 오류가 발생했습니다.';
      }finally{
        if(submit&&submit.isConnected){submit.disabled=false;submit.textContent='변경 저장';}
      }
    });
    setTimeout(()=>form?.elements.currentPassword?.focus(),0);
  }

  async function logoutNow(){
    try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});}catch(_error){}
    try{
      sessionStorage.removeItem('qmes-current-user-v1');
      sessionStorage.removeItem('qmes_current_tab');
      sessionStorage.removeItem('qmes_open_menu');
      sessionStorage.removeItem('qmes_erp_active_label');
    }catch(_error){}
    window.location.replace('/');
  }

  function refineHeader(){
    ensureStyle();
    const header=document.getElementById('qmes-erp-header');
    const account=accountButton();
    if(!header||!account)return false;

    const mobile=header.querySelector('.qmes-erp-header-mobile');
    if(mobile){
      const span=mobile.querySelector('span');
      if(span)span.textContent='모바일 전용';
      mobile.setAttribute('aria-label','모바일 전용 화면 열기');
      if(!mobile.dataset.qmesStableMobile){
        mobile.dataset.qmesStableMobile='1';
        mobile.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
          window.location.assign(MOBILE_URL);
        },true);
      }
    }

    const notice=header.querySelector('.qmes-visible-notice-button');
    if(notice){let span=notice.querySelector('span');if(span)span.textContent='알림';notice.setAttribute('aria-label','알림');}

    const label=account.querySelector('.qmes-erp-account-text');
    const user=currentUser();
    if(label&&user){
      const name=String(user.name||user.uid||'사용자').replace(/^임+흥배$/,'임흥배').trim();
      const dept=String(user.department||user.dept||'').trim();
      label.textContent=dept?`${name}(${dept})`:name;
    }

    if(account!==boundAccount){
      boundAccount=account;
      account.addEventListener('mouseenter',showMenu);
      account.addEventListener('pointerenter',showMenu,{passive:true});
      account.addEventListener('mouseleave',()=>scheduleClose(650));
      account.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        const menu=ensureMenu();
        if(menu.hidden)showMenu();else hideMenu();
      },true);
      account.addEventListener('focus',showMenu);
      account.addEventListener('blur',()=>scheduleClose(650));
    }
    return true;
  }

  document.addEventListener('mousedown',event=>{
    const menu=document.getElementById(MENU_ID);
    const account=accountButton();
    if(menu&&!menu.hidden&&(menu.contains(event.target)||account?.contains(event.target)))return;
    hideMenu();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){hideMenu();closePasswordModal();}});
  window.addEventListener('resize',positionMenu);
  window.addEventListener('scroll',positionMenu,true);

  refineHeader();
  const observer=new MutationObserver(()=>refineHeader());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  let tries=0;
  const timer=setInterval(()=>{refineHeader();tries+=1;if(tries>=80)clearInterval(timer);},125);
})();