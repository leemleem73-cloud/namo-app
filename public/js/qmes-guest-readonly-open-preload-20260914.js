/* NAMO QMES guest full-sandbox event preload - 2026-09-14
 * Guest must be fully operable inside the demo sandbox.
 * Suppress only the legacy guest read-only click/submit guards before they register.
 */
(function installGuestFullSandboxEventPreload(){
  'use strict';
  if(window.__QMES_GUEST_FULL_SANDBOX_EVENT_PRELOAD_20260914__)return;
  window.__QMES_GUEST_FULL_SANDBOX_EVENT_PRELOAD_20260914__=true;

  var originalAdd=document.addEventListener;
  var restored=false;

  document.addEventListener=function(type,listener,options){
    if((type==='click'||type==='submit')&&typeof listener==='function'){
      var source='';
      try{source=Function.prototype.toString.call(listener);}catch(_error){}
      if(source.indexOf('guestActive')>=0&&(source.indexOf('isWriteControl')>=0||source.indexOf('readonlyAlert')>=0)){
        return;
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
