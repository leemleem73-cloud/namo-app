/* NAMO QMES - purchase terminology fix - 2026-09-01 */
(function installPurchaseTerminologyFix(global){
  "use strict";
  if(global.__QMES_PURCHASE_TERMINOLOGY_FIX_20260901__) return;
  global.__QMES_PURCHASE_TERMINOLOGY_FIX_20260901__=true;

  function isPurchaseContext(el){
    if(!el || !el.closest) return false;
    return Boolean(el.closest('.qerp, .qp-modal, [class*="purchase"], [class*="Purchase"]'));
  }

  function renamePurchaseLabels(root){
    const scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('label,b,strong,th,div,span').forEach(el=>{
      if(!isPurchaseContext(el)) return;
      if(String(el.textContent||'').trim()==='특기사항' && el.children.length===0){
        el.textContent='특이사항';
      }
    });
  }

  renamePurchaseLabels(document);
  const root=document.getElementById('root')||document.body;
  new MutationObserver(mutations=>{
    for(const mutation of mutations){
      mutation.addedNodes.forEach(node=>{
        if(node&&node.nodeType===1) renamePurchaseLabels(node);
      });
    }
  }).observe(root,{childList:true,subtree:true});

  const nativeOpen=global.open;
  if(typeof nativeOpen==='function'&&!global.__QMES_PURCHASE_PRINT_TERM_PATCHED__){
    global.__QMES_PURCHASE_PRINT_TERM_PATCHED__=true;
    global.open=function patchedOpen(){
      const win=nativeOpen.apply(this,arguments);
      try{
        if(win&&win.document&&typeof win.document.write==='function'){
          const nativeWrite=win.document.write.bind(win.document);
          win.document.write=function(html){
            let text=String(html==null?'':html);
            if(text.includes('구매 발주서')&&text.includes('특기사항')) text=text.replace(/특기사항/g,'특이사항');
            return nativeWrite(text);
          };
        }
      }catch(_error){}
      return win;
    };
  }
})(window);
