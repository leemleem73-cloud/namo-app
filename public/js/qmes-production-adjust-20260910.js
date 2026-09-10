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

      const nav=side.querySelector('.qmes-erp-nav');
      if(nav){
        nav.style.setProperty('flex','1 1 auto','important');
        nav.style.setProperty('min-height','0','important');
        nav.style.setProperty('overflow-y','auto','important');
        nav.style.setProperty('overflow-x','hidden','important');
        nav.style.setProperty('overscroll-behavior','contain','important');
        nav.style.setProperty('touch-action','pan-y','important');
      }
    }

    const note=document.querySelector('#qmes-test-password-modal .qmes-test-password-note');
    if(note)note.textContent='현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.';
  };

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);
  window.addEventListener('storage',sync);
  window.addEventListener('resize',sync);
  setInterval(sync,500);
})();