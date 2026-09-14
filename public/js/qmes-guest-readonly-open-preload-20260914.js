/* NAMO QMES guest read-only open-control preload - 2026-09-14
 * Guest demo is read-only, but navigation/open controls must still work.
 * This wraps only the guest demo capture click guard before it is registered.
 */
(function installGuestReadonlyOpenPreload(){
  'use strict';
  if(window.__QMES_GUEST_READONLY_OPEN_PRELOAD_20260914__)return;
  window.__QMES_GUEST_READONLY_OPEN_PRELOAD_20260914__=true;

  var originalAdd=document.addEventListener;
  var restored=false;

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function isSafeOpenControl(control){
    if(!control)return false;
    if(control.matches('[data-tab],[data-menu]'))return true;
    if(control.classList.contains('qmes-iqc-new-btn'))return true;

    var text=clean(control.textContent||control.value||control.getAttribute('aria-label')||control.getAttribute('title'));
    if(!text)return false;

    return /^(구매발주|구매현황 보기|전체보기|신규 발주|신규 발행|작업지시 발행|작업지시서 발행|작업지시서|발행 내역|상세보기|조회|열기)$/i.test(text);
  }

  document.addEventListener=function(type,listener,options){
    if(type==='click'&&typeof listener==='function'){
      var source='';
      try{source=Function.prototype.toString.call(listener);}catch(_error){}
      if(source.indexOf('guestActive')>=0&&source.indexOf('isWriteControl')>=0){
        var wrapped=function(event){
          var target=event&&event.target instanceof Element?event.target:null;
          var control=target&&target.closest('button,input[type="button"],input[type="submit"],a');
          if(isSafeOpenControl(control))return;
          return listener.call(this,event);
        };
        return originalAdd.call(document,type,wrapped,options);
      }
    }
    return originalAdd.call(document,type,listener,options);
  };

  function restore(){
    if(restored)return;
    restored=true;
    document.addEventListener=originalAdd;
  }
  setTimeout(restore,0);
})();
