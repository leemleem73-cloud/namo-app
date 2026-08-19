/* Prevent inventory UI from waiting forever on an unavailable /api/inventory route.
   Inventory fallback will take over after the short timeout. */
(function(){
  'use strict';
  if(window.__QMES_INV_TIMEOUT_FIX__) return;
  window.__QMES_INV_TIMEOUT_FIX__=true;
  const previousFetch=window.fetch.bind(window);
  window.fetch=function(input,init={}){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!url.startsWith('/api/inventory')) return previousFetch(input,init);
    const external=init&&init.signal;
    if(external) return previousFetch(input,init);
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),1800);
    return previousFetch(input,{...init,signal:controller.signal}).finally(()=>clearTimeout(timer));
  };
})();
