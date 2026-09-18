/* NAMO QMES - Sales/Due React component lock
 * 2026-09-18
 * ADD-ONLY.
 * Keeps the early stable Sales/Due React component from being replaced later
 * by delayed ERP runtime modules. No DOM observer and no data mutation.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_REACT_COMPONENT_LOCK_20260918__) return;
  const stable=window.QMESErpSalesTab;
  if(typeof stable!=='function') return;
  window.__QMES_SALES_REACT_COMPONENT_LOCK_20260918__=true;

  try{
    Object.defineProperty(window,'QMESErpSalesTab',{
      configurable:true,
      enumerable:true,
      get:function(){return stable;},
      set:function(next){window.__QMES_SALES_LATE_COMPONENT_IGNORED_20260918__=next;}
    });
  }catch(_error){
    window.QMESErpSalesTab=stable;
  }
})();