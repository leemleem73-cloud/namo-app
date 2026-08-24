(function(){
  'use strict';
  if(window.__QMES_PROD_PROCESS_WIDTH_GUARD__) return;
  window.__QMES_PROD_PROCESS_WIDTH_GUARD__=true;

  const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
  const originalRemoveProperty = CSSStyleDeclaration.prototype.removeProperty;

  function isProductionMain(styleDecl){
    const owner = styleDecl && styleDecl._qmesOwnerElement;
    const main = owner || document.querySelector('#root>div>main');
    return !!(main && main === document.querySelector('#root>div>main') && document.querySelector('.qmes-prod-process'));
  }

  function markMain(){
    const main=document.querySelector('#root>div>main');
    if(main && main.style) main.style._qmesOwnerElement=main;
    return main;
  }

  CSSStyleDeclaration.prototype.setProperty=function(name,value,priority){
    const prop=String(name||'').toLowerCase();
    if((prop==='margin-left'||prop==='width') && isProductionMain(this)){
      if(prop==='margin-left') return originalSetProperty.call(this,'margin-left','0px','important');
      if(prop==='width') return originalSetProperty.call(this,'width','100%','important');
    }
    return originalSetProperty.call(this,name,value,priority);
  };

  function keepFullWidth(){
    const main=markMain();
    if(!main || !document.querySelector('.qmes-prod-process')) return;
    originalSetProperty.call(main.style,'margin-left','0px','important');
    originalSetProperty.call(main.style,'width','100%','important');
    originalSetProperty.call(main.style,'max-width','none','important');
    originalSetProperty.call(main.style,'transition','none','important');
  }

  const observer=new MutationObserver(keepFullWidth);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',keepFullWidth);
  window.addEventListener('resize',keepFullWidth);
  document.addEventListener('click',()=>queueMicrotask(keepFullWidth),true);
  requestAnimationFrame(keepFullWidth);
})();
