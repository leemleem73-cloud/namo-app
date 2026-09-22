/* QMES Purchase form calendar bridge V1 - 2026-09-22
 * ADD-ONLY.
 * Forces Purchase new/edit date fields to use the same fixed calendar as Sales/Delivery.
 * Existing purchase/calendar sources are not overwritten.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_FORM_CALENDAR_BRIDGE_20260922_V1__) return;
  window.__QMES_PURCHASE_FORM_CALENDAR_BRIDGE_20260922_V1__=true;

  const SELECTOR=[
    '.qmes-purchase-ledger-v1 form[data-role] input[name="orderDate"]',
    '.qmes-purchase-ledger-v1 form[data-role] input[name="requested"]',
    '.qmes-purchase-ledger-v1 form[data-role] input[name="confirmed"]'
  ].join(",");

  function patchInput(input){
    if(!(input instanceof HTMLInputElement)) return;
    if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.patch==="function"){
      window.qmesFixedCalendar.patch(input);
      return;
    }
    try{input.type="text";}catch(_){input.setAttribute("type","text");}
    input.setAttribute("autocomplete","off");
    input.setAttribute("aria-haspopup","dialog");
  }

  function scan(root){
    const node=root||document;
    if(node instanceof HTMLInputElement&&node.matches(SELECTOR)) patchInput(node);
    node.querySelectorAll?.(SELECTOR).forEach(patchInput);
  }

  function openSameCalendar(input,event){
    if(!(input instanceof HTMLInputElement)||!input.matches(SELECTOR)) return false;
    patchInput(input);
    if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.open==="function"){
      if(event){
        event.preventDefault();
        event.stopPropagation();
      }
      window.qmesFixedCalendar.open(input);
      return true;
    }
    return false;
  }

  document.addEventListener("pointerdown",function(event){
    const input=event.target instanceof HTMLInputElement?event.target:null;
    if(!input||!input.matches(SELECTOR)) return;
    patchInput(input);
  },true);

  document.addEventListener("click",function(event){
    const input=event.target instanceof HTMLInputElement?event.target:null;
    if(!input||!input.matches(SELECTOR)) return;
    openSameCalendar(input,event);
  },true);

  const observer=new MutationObserver(function(records){
    for(const record of records){
      record.addedNodes.forEach(function(node){
        if(!(node instanceof Element)) return;
        if(node.matches(".qpo-modal-bg")||node.querySelector?.(".qpo-modal-bg")||node.matches(SELECTOR)||node.querySelector?.(SELECTOR)){
          scan(node);
        }
      });
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  scan(document);
})();