(function(){
  const style=document.createElement('style');
  style.id='qmes-ipad-lot-firstpaint-guard';
  style.textContent=`
    .qmes-ipad-pop .qmes-ipad-form-grid input.lot[list="qmes-ipad-lots"]{display:none!important;}
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);
})();

(function(){
  function evaluateInput(input){
    if(!input || !input.closest('.qmes-ipad-pop')) return;
    const wrap=input.closest('.qmes-ipad-triple,.qmes-ipad-repeat-choice');
    if(!wrap) return;
    const card=input.closest('.qmes-ipad-measure-card');
    const key=card&&card.querySelector('.qmes-ipad-measure-head span')?.textContent?.trim();
    const value=String(input.value||'').trim();
    input.classList.remove('is-spec-ng');
    if(!key||!value||value.toLowerCase()==='overflow'||typeof window.autoJudge!=='function') return;
    try{
      if(window.autoJudge(key,value)==='불합격') input.classList.add('is-spec-ng');
    }catch(error){}
  }
  function refresh(root){
    (root||document).querySelectorAll('.qmes-ipad-triple input,.qmes-ipad-repeat-choice input').forEach(evaluateInput);
  }
  document.addEventListener('input',function(event){evaluateInput(event.target);},true);
  document.addEventListener('change',function(event){evaluateInput(event.target);},true);
  const observer=new MutationObserver(function(){refresh(document);});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){refresh(document);});
  else refresh(document);
})();

/* Direct IQC/PQC/OQC entry: consume the shortcut request from inside the POP component lifecycle. */
(function installFieldShortcutModeConsumer(){
  'use strict';
  if(window.__QMES_FIELD_SHORTCUT_MODE_CONSUMER__ || typeof FieldInputTab !== 'function') return;
  window.__QMES_FIELD_SHORTCUT_MODE_CONSUMER__=true;
  const OriginalFieldInputTab=FieldInputTab;
  FieldInputTab=function QmesFieldInputTabWithDirectMode(){
    React.useEffect(function(){
      let mode='';
      try{mode=String(sessionStorage.getItem('qmes_field_shortcut_mode')||'').toUpperCase();}catch(error){}
      if(!['IQC','PQC','OQC'].includes(mode)) return;
      const card=document.querySelector('.qmes-ipad-home-card.is-'+mode.toLowerCase());
      if(!card) return;
      try{sessionStorage.removeItem('qmes_field_shortcut_mode');}catch(error){}
      card.click();
    },[]);
    return React.createElement(OriginalFieldInputTab);
  };
})();
