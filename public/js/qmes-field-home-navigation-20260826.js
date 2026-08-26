/* QMES field input: direct top-menu click always opens the POP home screen. */
(function(){
  'use strict';
  if(window.__QMES_FIELD_HOME_NAVIGATION_20260826__) return;
  window.__QMES_FIELD_HOME_NAVIGATION_20260826__=true;

  document.addEventListener('click',function(event){
    const button=event.target.closest?.('.qmes-top-menu-button');
    if(!button) return;
    const label=String(button.textContent||'').replace(/\s+/g,' ').trim();
    if(label!=='현장입력') return;
    try{
      sessionStorage.removeItem('qmes_field_input_mode');
      sessionStorage.removeItem('qmes_field_shortcut_mode');
    }catch(_error){}
  },true);
})();
