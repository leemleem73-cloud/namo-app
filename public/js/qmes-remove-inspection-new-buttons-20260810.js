/* QMES inspection controls: keep native 신규등록 and add a separate 현장입력 바로가기. */
(function installInspectionFieldShortcut(global){
  'use strict';
  if(global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__) return;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__=true;
  const TARGET_KEY='qmes_field_shortcut_mode';

  function openTargetMode(mode){
    const target=String(mode||'').toUpperCase();
    if(!['IQC','PQC','OQC'].includes(target)) return;
    try{sessionStorage.setItem(TARGET_KEY,target);}catch(error){}
    if(global.__QMES_FIELD_NAVIGATION_READY__){
      global.dispatchEvent(new CustomEvent('qmes:open-field-inspection',{detail:{mode:target}}));
      return;
    }
    const top=Array.from(document.querySelectorAll('.qmes-top-menu-button')).find(btn=>String(btn.textContent||'').replace(/\s+/g,'').includes('현장입력'));
    if(top) top.click();
  }

  function addShortcut(nativeButton,mode){
    if(!nativeButton||!nativeButton.parentElement) return;
    const parent=nativeButton.parentElement;
    if(parent.querySelector(`[data-qmes-field-shortcut="${mode}"]`)) return;
    const shortcut=nativeButton.cloneNode(false);
    shortcut.type='button';
    shortcut.className=nativeButton.className;
    shortcut.dataset.qmesFieldShortcut=mode;
    shortcut.textContent='현장입력 바로가기';
    shortcut.title=`${mode==='IQC'?'수입검사':mode==='PQC'?'공정검사':'출하검사'} 현장입력으로 이동`;
    shortcut.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openTargetMode(mode);});
    nativeButton.insertAdjacentElement('afterend',shortcut);
  }

  function restoreReplacedButton(button){
    if(!button||button.dataset.qmesFieldShortcut!=='true') return null;
    const mode=String(button.dataset.qmesFieldMode||'').toUpperCase();
    const native=document.createElement('button');
    native.type='button';native.className=button.className;native.textContent='신규등록';
    button.replaceWith(native);
    return {native,mode};
  }

  function install(){
    document.querySelectorAll('[data-qmes-field-shortcut="true"]').forEach(old=>restoreReplacedButton(old));
    document.querySelectorAll('.qmes-iqc-page .qmes-iqc-new-btn').forEach(btn=>{
      if(btn.dataset.qmesFieldShortcut) return;
      const text=String(btn.textContent||'').replace(/\s+/g,'');
      if(text.includes('신규등록')) addShortcut(btn,'IQC');
    });
    document.querySelectorAll('.qmes-pqc-page .qmes-inspection-new-btn').forEach(btn=>{
      if(btn.dataset.qmesFieldShortcut) return;
      const text=String(btn.textContent||'').replace(/\s+/g,'');
      if(text.includes('신규등록')) addShortcut(btn,'PQC');
    });
    document.querySelectorAll('.qmes-oqc-page .qmes-inspection-new-btn').forEach(btn=>{
      if(btn.dataset.qmesFieldShortcut) return;
      const text=String(btn.textContent||'').replace(/\s+/g,'');
      if(text.includes('신규등록')) addShortcut(btn,'OQC');
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;install();});
  }
  const observer=new MutationObserver(schedule);
  function start(){install();observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  global.qmesOpenFieldInputShortcut=openTargetMode;
})(window);
