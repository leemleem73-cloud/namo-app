/* QMES Purchase Edit Due-Date Default V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * When legacy purchase rows have no requested/confirmed due dates,
 * default both fields to the order date in the edit modal.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_EDIT_DUE_DEFAULT_20260928_V1__) return;
  window.__QMES_PURCHASE_EDIT_DUE_DEFAULT_20260928_V1__=true;

  function clean(v){return String(v==null?"":v).trim();}
  function isDate(v){return /^20\d{2}-\d{2}-\d{2}$/.test(clean(v));}

  function patchModal(root){
    var scope=root&&root.querySelectorAll?root:document;
    var forms=scope.matches&&scope.matches('form[data-pe5-form],form[data-pe4-form],form[data-qpo-force-form],form[data-qpo-edit-form]')
      ? [scope]
      : Array.from(scope.querySelectorAll('form[data-pe5-form],form[data-pe4-form],form[data-qpo-force-form],form[data-qpo-edit-form]'));

    forms.forEach(function(form){
      var order=form.querySelector('input[name="orderDate"]');
      var requested=form.querySelector('input[name="requested"]');
      var confirmed=form.querySelector('input[name="confirmed"]');
      var base=isDate(order&&order.value)?clean(order.value):"";
      if(!base)return;

      if(requested&&!isDate(requested.value)){
        requested.value=base;
        requested.dispatchEvent(new Event("input",{bubbles:true}));
        requested.dispatchEvent(new Event("change",{bubbles:true}));
      }
      if(confirmed&&!isDate(confirmed.value)){
        confirmed.value=base;
        confirmed.dispatchEvent(new Event("input",{bubbles:true}));
        confirmed.dispatchEvent(new Event("change",{bubbles:true}));
      }

      [order,requested,confirmed].forEach(function(input){
        if(!input)return;
        try{
          if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.patch==="function"){
            window.qmesFixedCalendar.patch(input);
          }
        }catch(_){}
      });

      try{
        if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
          window.qmesFixedCalendar.scan(form);
        }
      }catch(_){}
    });
  }

  document.addEventListener("submit",function(event){
    var form=event.target&&event.target.matches&&event.target.matches('form[data-pe5-form],form[data-pe4-form],form[data-qpo-force-form],form[data-qpo-edit-form]')
      ? event.target:null;
    if(!form)return;
    var order=form.querySelector('input[name="orderDate"]');
    var requested=form.querySelector('input[name="requested"]');
    var confirmed=form.querySelector('input[name="confirmed"]');
    var base=isDate(order&&order.value)?clean(order.value):"";
    if(base){
      if(requested&&!isDate(requested.value)) requested.value=base;
      if(confirmed&&!isDate(confirmed.value)) confirmed.value=base;
    }
  },true);

  var observer=new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var nodes=records[i].addedNodes||[];
      for(var j=0;j<nodes.length;j++){
        var node=nodes[j];
        if(!(node instanceof Element))continue;
        if(
          node.matches('#qmes-purchase-edit-owner-v5,#qmes-purchase-edit-force-v4,#qmes-purchase-edit-force-v3,#qmes-purchase-edit-force-20260928-v2') ||
          node.querySelector('form[data-pe5-form],form[data-pe4-form],form[data-qpo-force-form],form[data-qpo-edit-form]')
        ){
          patchModal(node);
          setTimeout(function(){patchModal(document);},0);
          setTimeout(function(){patchModal(document);},80);
          return;
        }
      }
    }
  });

  function boot(){
    patchModal(document);
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();