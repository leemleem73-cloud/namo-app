/* QMES Purchase New/Edit modal stability V1 - 2026-09-22
 * ADD-ONLY / NO OVERWRITE.
 * Keeps Purchase 신규 발주 / 수정 modal alive when the ledger re-renders
 * because loadRows/loadUser/shared refresh replaces host.innerHTML.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_NEW_MODAL_STABILITY_20260922_V1__) return;
  window.__QMES_PURCHASE_NEW_MODAL_STABILITY_20260922_V1__=true;

  var armed=false;
  var expectOpen=false;
  var heldModal=null;
  var restoring=false;
  var expiresAt=0;

  function host(){
    return document.querySelector(".qmes-purchase-ledger-v1");
  }

  function liveModal(){
    var h=host();
    return h?h.querySelector(".qpo-modal-bg"):null;
  }

  function isPurchaseFormModal(node){
    if(!(node instanceof Element)) return false;
    var modal=node.matches(".qpo-modal-bg")?node:node.querySelector&&node.querySelector(".qpo-modal-bg");
    if(!modal) return false;
    return !!modal.querySelector('form[data-role="new-form"],form[data-role="edit-form"]');
  }

  function modalFromNode(node){
    if(!(node instanceof Element)) return null;
    if(node.matches(".qpo-modal-bg")&&node.querySelector('form[data-role="new-form"],form[data-role="edit-form"]')) return node;
    var m=node.querySelector&&node.querySelector(".qpo-modal-bg");
    if(m&&m.querySelector('form[data-role="new-form"],form[data-role="edit-form"]')) return m;
    return null;
  }

  function arm(modal){
    if(!modal) return;
    armed=true;
    expectOpen=false;
    heldModal=modal;
    expiresAt=Date.now()+60000;
  }

  function disarm(){
    armed=false;
    expectOpen=false;
    heldModal=null;
    expiresAt=0;
  }

  function restore(){
    if(restoring||!armed||!heldModal||Date.now()>expiresAt) return;
    var h=host();
    if(!h||liveModal()) return;
    restoring=true;
    try{
      h.appendChild(heldModal);
      if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
        try{window.qmesFixedCalendar.scan(heldModal);}catch(_){}
      }
    }finally{
      restoring=false;
    }
  }

  document.addEventListener("click",function(event){
    var el=event.target instanceof Element?event.target:null;
    if(!el) return;

    var open=el.closest('.qmes-purchase-ledger-v1 [data-action="new"],.qmes-purchase-ledger-v1 [data-action="edit"]');
    if(open){
      expectOpen=true;
      expiresAt=Date.now()+60000;
      return;
    }

    if(el.closest('.qmes-purchase-ledger-v1 [data-action="close-modal"]')){
      disarm();
      return;
    }

    if(el.classList.contains("qpo-modal-bg")){
      disarm();
      return;
    }
  },true);

  document.addEventListener("submit",function(event){
    var form=event.target instanceof Element?event.target.closest('form[data-role="new-form"],form[data-role="edit-form"]'):null;
    if(form&&form.closest(".qmes-purchase-ledger-v1")){
      // Successful save intentionally closes the modal; do not restore it.
      disarm();
    }
  },true);

  var observer=new MutationObserver(function(records){
    var removedHeld=false;

    records.forEach(function(record){
      record.addedNodes.forEach(function(node){
        var modal=modalFromNode(node);
        if(modal&&(expectOpen||isPurchaseFormModal(modal))) arm(modal);
      });

      record.removedNodes.forEach(function(node){
        if(!armed) return;
        if(node===heldModal || (node instanceof Element&&heldModal&&node.contains(heldModal))){
          removedHeld=true;
        }
      });
    });

    if(removedHeld&&armed){
      requestAnimationFrame(function(){
        restore();
        setTimeout(restore,0);
        setTimeout(restore,80);
        setTimeout(restore,250);
      });
    }
  });

  observer.observe(document.documentElement,{childList:true,subtree:true});
})();