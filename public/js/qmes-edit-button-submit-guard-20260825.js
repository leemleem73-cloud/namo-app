/* QMES edit button submit guard — isolates edit buttons from accidental form submission. */
(function(){
  "use strict";
  if(window.__QMES_EDIT_BUTTON_SUBMIT_GUARD_20260825__) return;
  window.__QMES_EDIT_BUTTON_SUBMIT_GUARD_20260825__ = true;

  const selector = [
    'button[title="수정"]',
    '.qmes-iqc-action-edit',
    '.qmes-inspection-action-edit',
    '.qmes-manage-btn.edit'
  ].join(',');

  function normalize(root){
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(selector).forEach((button)=>{
      if(button.tagName === 'BUTTON') button.setAttribute('type','button');
    });
    if(root && root.matches && root.matches(selector) && root.tagName === 'BUTTON'){
      root.setAttribute('type','button');
    }
  }

  normalize(document);

  document.addEventListener('pointerdown',(event)=>{
    const button = event.target && event.target.closest ? event.target.closest(selector) : null;
    if(button && button.tagName === 'BUTTON') button.setAttribute('type','button');
  },true);

  const observer = new MutationObserver((mutations)=>{
    mutations.forEach((mutation)=>{
      mutation.addedNodes.forEach((node)=>{
        if(node && node.nodeType === 1) normalize(node);
      });
    });
  });

  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
