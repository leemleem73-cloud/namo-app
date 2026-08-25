/* QMES: DOM row reordering disabled.
   Directly moving React-rendered table rows breaks button event/state mapping.
   List ordering must be handled inside pqc.jsx before rendering. */
(function(global){
  "use strict";
  global.__QMES_PQC_ORDER_MATCH_WO_20260811_DISABLED__ = true;
})(window);

/* Quality inspection edit-button guard.
   Prevent IQC/PQC/OQC edit controls from acting as implicit form submit buttons. */
(function(){
  "use strict";
  const selector = [
    'button[title="수정"]',
    '.qmes-iqc-action-edit',
    '.qmes-inspection-action-edit',
    '.qmes-manage-btn.edit'
  ].join(',');

  function normalize(root){
    const scope = root && root.querySelectorAll ? root : document;
    if (root && root.matches && root.matches(selector) && root.tagName === 'BUTTON') {
      root.setAttribute('type','button');
    }
    scope.querySelectorAll(selector).forEach((button)=>{
      if (button.tagName === 'BUTTON') button.setAttribute('type','button');
    });
  }

  normalize(document);
  document.addEventListener('pointerdown',(event)=>{
    const button = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (button && button.tagName === 'BUTTON') button.setAttribute('type','button');
  },true);

  const observer = new MutationObserver((mutations)=>{
    mutations.forEach((mutation)=>mutation.addedNodes.forEach((node)=>{
      if (node && node.nodeType === 1) normalize(node);
    }));
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
