(function(){
  'use strict';
  if(window.__QMES_PRODUCTION_ADJUST_20260910__)return;
  window.__QMES_PRODUCTION_ADJUST_20260910__=true;
  const sessionKey='qmes-current-user-v1';
  const loggedIn=()=>{try{return Boolean(window.__QMES_CURRENT_USER__||JSON.parse(sessionStorage.getItem(sessionKey)||'null'));}catch(_){return Boolean(window.__QMES_CURRENT_USER__);}};
  const sync=()=>{
    const visible=loggedIn();
    const header=document.getElementById('qmes-erp-header');
    const side=document.getElementById('qmes-erp-sidebar');
    if(header)header.style.setProperty('display',visible?'flex':'none','important');
    if(side)side.style.setProperty('display',visible?'block':'none','important');
    const note=document.querySelector('#qmes-test-password-modal .qmes-test-password-note');
    if(note)note.textContent='현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.';
  };

  const PASSWORD_MODAL_ID='qmes-password-modal-fix-20260910';

  function closePasswordMenus(){
    document.getElementById('qmes-test-password-modal')?.remove();
    document.getElementById('qmes-user-dropdown')?.classList.remove('is-open');
    const wrap=document.querySelector('#qmes-erp-header .qmes-erp-account-wrap');
    const account=wrap?.querySelector('.qmes-erp-header-account');
    const menu=wrap?.querySelector('.qmes-erp-account-menu');
    wrap?.classList.remove('is-open');
    account?.setAttribute('aria-expanded','false');
    menu?.style.setProperty('display','none','important');
  }

  function closePasswordModal(){document.getElementById(PASSWORD_MODAL_ID)?.remove();}

  function openPasswordModalImmediate(){
    closePasswordMenus();
    closePasswordModal();

    const overlay=document.createElement('div');
    overlay.id=PASSWORD_MODAL_ID;
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

    requestAnimationFrame(()=>form?.elements.currentPassword?.focus());
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const passwordButton=target.closest('#qmes-erp-header [data-qmes-account-action="password"],#qmes-user-dropdown .qmes-dropdown-password');
    if(!passwordButton)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openPasswordModalImmediate();
  },true);

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);
  window.addEventListener('storage',sync);
  setInterval(sync,500);
})();