/* NAMO QMES - Purchase ledger owner lock V2 - 2026-09-22
 * ADD-ONLY / NO OVERWRITE.
 * Guarantees the approved uploaded Purchase ledger is the only purchase route UI.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_LEDGER_OWNER_LOCK_20260922_V2__) return;
  window.__QMES_PURCHASE_LEDGER_OWNER_LOCK_20260922_V2__=true;

  function currentOwner(){
    return typeof window.__QMES_CURRENT_PURCHASE_LEDGER_COMPONENT__==="function"
      ? window.__QMES_CURRENT_PURCHASE_LEDGER_COMPONENT__
      : null;
  }

  function lockOwner(){
    const owner=currentOwner();
    if(!owner) return false;

    try{
      const previous=window.QMESErpPurchaseTab;
      if(typeof previous==="function" && previous!==owner){
        window.__QMES_LEGACY_PURCHASE_COMPONENT__=previous;
      }

      const getter=function(){ return currentOwner()||owner; };
      getter.__QMES_PURCHASE_OWNER_GETTER__=true;

      Object.defineProperty(window,"QMESErpPurchaseTab",{
        configurable:true,
        enumerable:true,
        get:getter,
        set:function(value){
          if(value===currentOwner()) return;
          if(typeof value==="function"){
            window.__QMES_LEGACY_PURCHASE_COMPONENT__=value;
          }
        }
      });
    }catch(error){
      window.QMESErpPurchaseTab=owner;
    }

    window.dispatchEvent(new CustomEvent("qmes:erp-integrated-ready"));
    return true;
  }

  function retry(){
    if(lockOwner()) return;
    setTimeout(retry,50);
  }

  retry();
  window.addEventListener("qmes:erp-runtime-loaded",function(){setTimeout(lockOwner,0);});
  [100,300,800,1500,3000].forEach(function(ms){setTimeout(lockOwner,ms);});
})();