(function(){
  'use strict';

  const STYLE_ID='qmes-enterprise-header-polish-20260910';
  const MODAL_ID='qmes-password-modal-fix-20260910';
  const MOBILE_URL='/mobile.html?v=20260903-mobile-dedicated1';

  const ensureStyle=()=>{
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #qmes-erp-header{gap:7px!important;padding-right:14px!important;overflow:visible!important}
      html body #qmes-erp-header .qmes-erp-header-spacer{min-width:10px!important}
      html body #qmes-erp-header .qmes-erp-header-clock{width:92px!important;flex:0 0 92px!important;font-size:11.5px!important;font-weight:800!important;letter-spacing:.1px!important}
      html body #qmes-erp-header .qmes-erp-header-mobile{width:92px!important;flex:0 0 92px!important;height:36px!important;padding:0 10px!important;gap:6px!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#2d5f82!important;box-shadow:0 1px 2px rgba(34,70,95,.08)!important;font-size:11.5px!important;font-weight:800!important}
      html body #qmes-erp-header .qmes-erp-header-mobile svg{width:16px!important;height:16px!important}
      html body #qmes-erp-header .qmes-visible-notice-button{width:76px!important;min-width:76px!important;flex:0 0 76px!important;height:36px!important;padding:0 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#2d5f82!important;box-shadow:0 1px 2px rgba(34,70,95,.08)!important;font-size:11.5px!important;font-weight:800!important;line-height:1!important;white-space:nowrap!important}
      html body #qmes-erp-header .qmes-visible-notice-button svg{width:16px!important;height:16px!important;flex:none!important}
      html body #qmes-erp-header .qmes-visible-notice-button span{display:inline-block!important;line-height:1!important;white-space:nowrap!important}
      html body #qmes-erp-header .qmes-erp-account-wrap{position:relative!important;width:150px!important;min-width:150px!important;flex:0 0 150px!important;height:36px!important;overflow:visible!important;z-index:13120!important}
      html body #qmes-erp-header .qmes-erp-account-wrap::after{content:""!important;position:absolute!important;left:0!important;right:0!important;top:34px!important;height:10px!important;background:transparent!important;pointer-events:auto!important;z-index:13140!important}
      html body #qmes-erp-header .qmes-erp-header-account{width:150px!important;max-width:150px!important;min-width:150px!important;height:36px!important;padding:0 12px!important;display:flex!important;align-items:center!important;justify-content:center!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#29485f!important;box-shadow:0 1px 2px rgba(34,70,95,.08)!important;font-size:12px!important;font-weight:850!important;letter-spacing:-.15px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      html body #qmes-erp-header .qmes-erp-header-account svg,html body #qmes-erp-header .qmes-erp-account-caret{display:none!important}
      html body #qmes-erp-header .qmes-erp-account-text{display:block!important;width:100%!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;text-align:center!important}
      html body #qmes-erp-header .qmes-erp-account-menu{display:none!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:absolute!important;top:36px!important;right:0!important;width:184px!important;min-width:184px!important;padding:6px!important;margin:0!important;border:1px solid #cbd8e2!important;border-radius:8px!important;background:#fff!important;box-shadow:0 10px 26px rgba(37,76,105,.20)!important;z-index:13150!important;overflow:hidden!important}
      html body #qmes-erp-header .qmes-erp-account-wrap.is-open .qmes-erp-account-menu{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      html body #qmes-erp-header .qmes-erp-account-menu button{width:100%!important;height:40px!important;min-height:40px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;padding:0 12px!important;margin:0!important;border:0!important;border-radius:6px!important;background:#fff!important;color:#334e62!important;box-shadow:none!important;font-size:12px!important;font-weight:750!important;line-height:1!important;text-align:left!important;white-space:nowrap!important;cursor:pointer!important}
      html body #qmes-erp-header .qmes-erp-account-menu button:hover{background:#edf6fb!important;color:#1e5d88!important}
      html body #qmes-erp-header .qmes-erp-account-menu button+button{margin-top:3px!important;border-top:1px solid #edf1f4!important;color:#a53a34!important}
      html body #qmes-erp-header .qmes-erp-header-backup,html body #qmes-erp-header .qmes-erp-header-restore{width:56px!important;flex:0 0 56px!important;height:36px!important;padding:0 10px!important;border:1px solid #c6d5df!important;border-radius:6px!important;background:#fff!important;color:#29485f!important;box-shadow:0 1px 2px rgba(34,70,95,.08)!important;font-size:11.5px!important;font-weight:800!important}
      html body #qmes-erp-header :is(.qmes-erp-header-mobile,.qmes-visible-notice-button,.qmes-erp-header-account,.qmes-erp-header-backup,.qmes-erp-header-restore):hover{background:#eef6fb!important;border-color:#9fbfd4!important}
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:30000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.58)!important;font-family:Pretendard,'Noto Sans KR','Malgun Gothic',Arial,sans-serif!important}
      #${MODAL_ID} .qmes-pw-card{width:min(430px,calc(100vw - 32px))!important;max-height:calc(100vh - 40px)!important;overflow:auto!important;background:#fff!important;border:1px solid #d5e0e8!important;border-radius:12px!important;box-shadow:0 22px 60px rgba(15,23,42,.28)!important;color:#263d4f!important}
      #${MODAL_ID} .qmes-pw-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:18px 20px 14px!important;border-bottom:1px solid #e4ebf0!important;background:#f8fbfd!important}
      #${MODAL_ID} .qmes-pw-head b{font-size:18px!important;font-weight:900!important;color:#1f415a!important}
      #${MODAL_ID} .qmes-pw-close{width:32px!important;height:32px!important;border:1px solid #cbd8e2!important;border-radius:7px!important;background:#fff!important;color:#526b7d!important;font-size:20px!important;cursor:pointer!important}
      #${MODAL_ID} form{display:block!important;position:static!important;width:auto!important;height:auto!important;max-height:none!important;margin:0!important;padding:18px 20px 20px!important;transform:none!important;overflow:visible!important;background:#fff!important}
      #${MODAL_ID} label{display:block!important;margin:0 0 13px!important;color:#40586b!important;font-size:12px!important;font-weight:800!important}
      #${MODAL_ID} input{display:block!important;width:100%!important;height:42px!important;margin-top:6px!important;padding:0 11px!important;box-sizing:border-box!important;border:1px solid #bccbd6!important;border-radius:7px!important;background:#fff!important;color:#263d4f!important;font-size:13px!important;outline:none!important}
      #${MODAL_ID} input:focus{border-color:#4b91bf!important;box-shadow:0 0 0 3px rgba(75,145,191,.12)!important}
      #${MODAL_ID} .qmes-pw-error{min-height:18px!important;margin-top:4px!important;color:#b42318!important;font-size:11px!important;font-weight:750!important;line-height:1.45!important}
      #${MODAL_ID} .qmes-pw-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:10px!important}
      #${MODAL_ID} .qmes-pw-actions button{height:38px!important;min-width:92px!important;padding:0 14px!important;border-radius:7px!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}
      #${MODAL_ID} .qmes-pw-cancel{border:1px solid #cbd8e2!important;background:#fff!important;color:#4a6274!important}
      #${MODAL_ID} .qmes-pw-save{border:1px solid #2f78b7!important;background:#2f78b7!important;color:#fff!important}
      #${MODAL_ID} .qmes-pw-save:disabled{opacity:.6!important;cursor:wait!important}
      @media (max-width:1280px){html body #qmes-erp-header .qmes-erp-header-search{flex:0 1 260px!important;width:260px!important;min-width:180px!important;max-width:260px!important}html body #qmes-erp-header .qmes-erp-header-clock{width:82px!important;flex-basis:82px!important}}
    `;
    document.head.appendChild(style);
  };

  function closePasswordModal(){document.getElementById(MODAL_ID)?.remove();}

  function openPasswordModal(){
    ensureStyle();
    closePasswordModal();
    const overlay=document.createElement('div');
    overlay.id=MODAL_ID;
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','비밀번호 변경 창');
    overlay.innerHTML=`<div class="qmes-pw-card"><div class="qmes-pw-head"><b>비밀번호 변경</b><button type="button" class="qmes-pw-close" aria-label="닫기">×</button></div><form><label>현재 비밀번호<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>새 비밀번호<input name="newPassword" type="password" autocomplete="new-password" minlength="4" required></label><label>새 비밀번호 확인<input name="confirmPassword" type="password" autocomplete="new-password" minlength="4" required></label><div class="qmes-pw-error" aria-live="polite"></div><div class="qmes-pw-actions"><button type="button" class="qmes-pw-cancel">취소</button><button type="submit" class="qmes-pw-save">변경 저장</button></div></form></div>`;
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

  const forceProductionMobile=event=>{
    const target=event.target instanceof Element?event.target.closest('#qmes-erp-header .qmes-erp-header-mobile'):null;
    if(!target)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.location.assign(MOBILE_URL);
  };
  document.addEventListener('click',forceProductionMobile,true);

  function ensureAccountMenu(header){
    const wrap=header.querySelector('.qmes-erp-account-wrap');
    const account=header.querySelector('.qmes-erp-header-account');
    if(!wrap||!account)return;

    let menu=wrap.querySelector('.qmes-erp-account-menu');
    if(!menu){
      menu=document.createElement('div');
      menu.className='qmes-erp-account-menu';
      menu.setAttribute('role','menu');
      menu.setAttribute('aria-label','사용자 메뉴');
      menu.innerHTML='<button type="button" role="menuitem" data-qmes-account-action="password">비밀번호 변경</button><button type="button" role="menuitem" data-qmes-account-action="logout">로그아웃</button>';
      wrap.appendChild(menu);
    }

    let password=menu.querySelector('[data-qmes-account-action="password"]');
    let logout=menu.querySelector('[data-qmes-account-action="logout"]');
    if(!password){password=document.createElement('button');password.type='button';password.dataset.qmesAccountAction='password';password.textContent='비밀번호 변경';menu.prepend(password);}
    if(!logout){logout=document.createElement('button');logout.type='button';logout.dataset.qmesAccountAction='logout';logout.textContent='로그아웃';menu.appendChild(logout);}
    password.textContent='비밀번호 변경';
    logout.textContent='로그아웃';

    if(!account.dataset.qmesAccountToggleFix){
      account.dataset.qmesAccountToggleFix='1';
      account.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const open=!wrap.classList.contains('is-open');
        wrap.classList.toggle('is-open',open);
        account.setAttribute('aria-expanded',String(open));
        menu.style.setProperty('display',open?'block':'none','important');
      },true);
    }

    if(!menu.dataset.qmesAccountMenuFix){
      menu.dataset.qmesAccountMenuFix='1';
      menu.addEventListener('click',event=>{
        const target=event.target instanceof Element?event.target.closest('[data-qmes-account-action]'):null;
        if(!target)return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        wrap.classList.remove('is-open');
        account.setAttribute('aria-expanded','false');
        menu.style.setProperty('display','none','important');
        if(target.dataset.qmesAccountAction==='password')openPasswordModal();
        else if(target.dataset.qmesAccountAction==='logout')logoutNow();
      },true);
    }
  }

  const refineHeader=()=>{
    ensureStyle();
    const header=document.getElementById('qmes-erp-header');
    if(!header)return false;

    const mobile=header.querySelector('.qmes-erp-header-mobile');
    if(mobile){
      const span=mobile.querySelector('span');
      if(span)span.textContent='모바일 전용';
      mobile.setAttribute('aria-label','모바일 전용 화면 열기');
      mobile.removeAttribute('title');
      mobile.dataset.qmesMobileTarget=MOBILE_URL;
    }

    const notice=header.querySelector('.qmes-visible-notice-button');
    if(notice){
      let span=notice.querySelector('span');
      if(!span){span=document.createElement('span');notice.appendChild(span);}
      span.textContent='알림';
      notice.setAttribute('aria-label','알림');
      notice.removeAttribute('title');
    }

    const account=header.querySelector('.qmes-erp-header-account');
    if(account){
      account.setAttribute('aria-label','사용자 메뉴');
      account.removeAttribute('title');
      account.querySelectorAll('[title]').forEach(node=>node.removeAttribute('title'));
      const label=account.querySelector('.qmes-erp-account-text');
      const current=window.__QMES_CURRENT_USER__||(()=>{try{return JSON.parse(sessionStorage.getItem('qmes-current-user-v1')||'null');}catch(_){return null;}})();
      const rawName=String(current?.name||'').replace(/\s+/g,'').trim();
      if(label&&/^임+흥배$/.test(rawName))label.textContent='임흥배(품질부)';
    }

    ensureAccountMenu(header);
    return true;
  };

  document.addEventListener('mousedown',event=>{
    const wrap=document.querySelector('#qmes-erp-header .qmes-erp-account-wrap');
    if(!wrap||wrap.contains(event.target))return;
    wrap.classList.remove('is-open');
    const account=wrap.querySelector('.qmes-erp-header-account');
    const menu=wrap.querySelector('.qmes-erp-account-menu');
    account?.setAttribute('aria-expanded','false');
    menu?.style.setProperty('display','none','important');
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    closePasswordModal();
    const wrap=document.querySelector('#qmes-erp-header .qmes-erp-account-wrap');
    wrap?.classList.remove('is-open');
  });

  if(!refineHeader()){
    const observer=new MutationObserver(()=>{if(refineHeader())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }
  setTimeout(refineHeader,250);
  setTimeout(refineHeader,900);
})();