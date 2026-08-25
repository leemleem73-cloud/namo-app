/* QMES inspection controls: keep native 신규등록 and add a separate 현장입력 바로가기. */
(function installInspectionFieldShortcut(global){
  'use strict';
  if(global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__) return;
  global.__QMES_INSPECTION_FIELD_SHORTCUTS_READY__=true;
  const TARGET_KEY='qmes_field_shortcut_mode';

  function installStyles(){
    if(document.getElementById('qmes-inspection-control-recovery-style')) return;
    const style=document.createElement('style');
    style.id='qmes-inspection-control-recovery-style';
    style.textContent=`
      body:has(.qmes-preview-dashboard),
      #root:has(.qmes-preview-dashboard),
      main:has(.qmes-preview-dashboard){background:#f5f7fb!important;}
      .qmes-preview-dashboard{background:#f5f7fb!important;}
      .qmes-iqc-new-btn,.qmes-inspection-new-btn,
      .qmes-iqc-action-btn,.qmes-iqc-action-print,.qmes-iqc-action-label,
      .qmes-iqc-action-edit,.qmes-iqc-action-delete{
        display:inline-flex!important;
        visibility:visible!important;
        opacity:1!important;
        pointer-events:auto!important;
      }
      .qmes-iqc-manage-cell,.qmes-iqc-manage-inline,
      .qmes-iqc-page td:last-child,.qmes-pqc-page td:last-child,.qmes-oqc-page td:last-child{
        visibility:visible!important;
        opacity:1!important;
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

  function install(){
    installStyles();
    document.querySelectorAll('.qmes-iqc-page .qmes-iqc-new-btn').forEach(btn=>{
      const text=String(btn.textContent||'').replace(/\s+/g,'');
      if(text.includes('신규등록')) addShortcut(btn,'IQC');
    });
    document.querySelectorAll('.qmes-pqc-page .qmes-inspection-new-btn').forEach(btn=>{
      const text=String(btn.textContent||'').replace(/\s+/g,'');
      if(text.includes('신규등록')) addShortcut(btn,'PQC');
    });
    document.querySelectorAll('.qmes-oqc-page .qmes-inspection-new-btn').forEach(btn=>{
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
