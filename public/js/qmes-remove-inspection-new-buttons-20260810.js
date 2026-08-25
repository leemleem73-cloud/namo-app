/* QMES inspection controls — safe version.
   Keep IQC 신규등록, hide PQC/OQC native 신규등록, and add 현장입력 바로가기.
   No prototype overrides and no MutationObserver. */
(function installInspectionFieldShortcut(global){
  'use strict';
  if(global.__QMES_INSPECTION_FIELD_SHORTCUTS_SAFE_READY__) return;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_SAFE_READY__=true;
  const TARGET_KEY='qmes_field_shortcut_mode';

  function textOf(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim();}

  function installStyles(){
    if(document.getElementById('qmes-inspection-control-safe-style')) return;
    document.getElementById('qmes-inspection-control-recovery-style')?.remove();
    const style=document.createElement('style');
    style.id='qmes-inspection-control-safe-style';
    style.textContent=`
      .qmes-iqc-page .qmes-iqc-new-btn,
      .qmes-iqc-page .qmes-iqc-action-btn,
      .qmes-pqc-page .qmes-iqc-action-btn,
      .qmes-oqc-page .qmes-iqc-action-btn{
        visibility:visible!important;opacity:1!important;pointer-events:auto!important;
      }
      .qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]),
      .qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]){
        display:none!important;
      }
      [data-qmes-field-shortcut]{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}
    `;
    document.head.appendChild(style);
  }

  function openTargetMode(mode){
    const target=String(mode||'').toUpperCase();
    if(!['IQC','PQC','OQC'].includes(target)) return;
    try{sessionStorage.setItem(TARGET_KEY,target);}catch(error){}
    if(global.__QMES_FIELD_NAVIGATION_READY__){
      global.dispatchEvent(new CustomEvent('qmes:open-field-inspection',{detail:{mode:target}}));
      return;
    }
    const top=Array.from(document.querySelectorAll('.qmes-top-menu-button')).find(btn=>textOf(btn).replace(/\s+/g,'').includes('현장입력'));
    top?.click();
  }

  function ensureShortcut(nativeButton,mode){
    if(!nativeButton?.parentElement) return;
    const parent=nativeButton.parentElement;
    if(parent.querySelector(`[data-qmes-field-shortcut="${mode}"]`)) return;
    const shortcut=document.createElement('button');
    shortcut.type='button';
    shortcut.className=nativeButton.className;
    shortcut.dataset.qmesFieldShortcut=mode;
    shortcut.textContent='현장입력 바로가기';
    shortcut.title=`${mode==='IQC'?'수입검사':mode==='PQC'?'공정검사':'출하검사'} 현장입력으로 이동`;
    shortcut.addEventListener('click',()=>openTargetMode(mode));
    nativeButton.insertAdjacentElement('afterend',shortcut);
  }

  function scan(){
    installStyles();
    document.querySelectorAll('.qmes-iqc-page .qmes-iqc-new-btn').forEach(btn=>{
      if(textOf(btn).includes('신규등록')) ensureShortcut(btn,'IQC');
    });
    document.querySelectorAll('.qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut])').forEach(btn=>{
      if(textOf(btn).includes('신규등록')) ensureShortcut(btn,'PQC');
    });
    document.querySelectorAll('.qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut])').forEach(btn=>{
      if(textOf(btn).includes('신규등록')) ensureShortcut(btn,'OQC');
    });
  }

  function scheduleScan(){requestAnimationFrame(()=>{scan();setTimeout(scan,80);});}
  function start(){scan();setTimeout(scan,150);setTimeout(scan,500);}

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.addEventListener('qmes:navigate-tab',scheduleScan);
  window.addEventListener('qmes:mes-master-ready',scheduleScan);
  window.addEventListener('qmes:open-field-inspection',scheduleScan);
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('.qmes-top-menu-button,.qmes-submenu-button')) scheduleScan();
  },false);

  global.qmesOpenFieldInputShortcut=openTargetMode;
})(window);
