/* Rebuild only edit buttons while preserving each React row edit handler. */
(function(){
  "use strict";
  if(window.__QMES_EDIT_BUTTON_REBUILD_20260825__) return;
  window.__QMES_EDIT_BUTTON_REBUILD_20260825__ = true;

  const selector = [
    'button[title="수정"]',
    '.qmes-iqc-action-edit',
    '.qmes-inspection-action-edit',
    '.qmes-manage-btn.edit'
  ].join(',');

  function reactClickOf(button){
    const key = Object.keys(button).find((name)=>name.indexOf('__reactProps$')===0);
    const props = key ? button[key] : null;
    return props && typeof props.onClick === 'function' ? props.onClick : null;
  }

  function rebuild(button){
    if(!button || button.nodeType!==1 || button.dataset.qmesEditRebuilt==='1') return;
    const reactClick = reactClickOf(button);
    if(!reactClick) return;

    const fresh = button.cloneNode(true);
    fresh.type = 'button';
    fresh.dataset.qmesEditRebuilt = '1';
    fresh.removeAttribute('onclick');
    fresh.addEventListener('click', function(event){
      event.preventDefault();
      event.stopPropagation();
      try {
        reactClick({
          type:'click', target:fresh, currentTarget:fresh,
          preventDefault:function(){}, stopPropagation:function(){},
          nativeEvent:event
        });
      } catch(error) {
        console.error('[QMES] rebuilt edit button failed', error);
      }
    });
    button.replaceWith(fresh);
  }

  function scan(root){
    if(root && root.matches && root.matches(selector)) rebuild(root);
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(selector).forEach(rebuild);
  }

  scan(document);
  new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
      mutation.addedNodes.forEach(function(node){
        if(node && node.nodeType===1) scan(node);
      });
    });
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
