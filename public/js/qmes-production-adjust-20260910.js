(function(){
  'use strict';
  if(window.__QMES_PRODUCTION_ADJUST_20260910__)return;
  window.__QMES_PRODUCTION_ADJUST_20260910__=true;

  const sessionKey='qmes-current-user-v1';
  const loggedIn=()=>{
    try{return Boolean(window.__QMES_CURRENT_USER__||window.__QMES_USER__||JSON.parse(sessionStorage.getItem(sessionKey)||'null'));}
    catch(_error){return Boolean(window.__QMES_CURRENT_USER__||window.__QMES_USER__);}
  };

  const sync=()=>{
    const visible=loggedIn();
    const header=document.getElementById('qmes-erp-header');
    const side=document.getElementById('qmes-erp-sidebar');

    if(header)header.style.setProperty('display',visible?'flex':'none','important');
    if(side){
      side.style.setProperty('display',visible?'flex':'none','important');
      side.style.setProperty('flex-direction','column','important');
      side.style.setProperty('top','58px','important');
      side.style.setProperty('bottom','0','important');
      side.style.setProperty('height','calc(100vh - 58px)','important');
      side.style.setProperty('min-height','0','important');
      side.style.setProperty('max-height','calc(100vh - 58px)','important');
      side.style.setProperty('overflow','hidden','important');
    }

    const note=document.querySelector('#qmes-test-password-modal .qmes-test-password-note');
    if(note)note.textContent='TEST 보호모드에서는 운영 계정 비밀번호가 실제로 변경되지 않도록 저장 요청이 차단될 수 있습니다.';
  };

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);
  window.addEventListener('storage',sync);
  window.addEventListener('resize',sync);
  setInterval(sync,700);
})();