(function(){
  'use strict';
  if(window.__QMES_ACCESS_ME_REQUEST_GUARD_20260911__)return;
  window.__QMES_ACCESS_ME_REQUEST_GUARD_20260911__=true;

  const originalFetch=window.fetch.bind(window);
  let accessInflight=null;
  let accessCached=null;
  let accessCachedAt=0;
  const CACHE_MS=5000;

  function pathOf(input){
    try{
      const raw=typeof input==='string'?input:(input&&input.url)||'';
      return new URL(raw,window.location.origin).pathname;
    }catch(_error){return '';}
  }

  function methodOf(input,init){
    return String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
  }

  function clearAccessCache(){
    accessCached=null;
    accessCachedAt=0;
  }

  window.fetch=function qmesGuardedFetch(input,init){
    const path=pathOf(input);
    const method=methodOf(input,init);

    if(path==='/api/auth/login'||path==='/api/auth/logout'||path==='/api/auth/password'){
      clearAccessCache();
      return originalFetch(input,init);
    }

    if(method==='GET'&&path==='/api/access/me'){
      const now=Date.now();
      if(accessCached&&now-accessCachedAt<CACHE_MS){
        return Promise.resolve(accessCached.clone());
      }
      if(accessInflight){
        return accessInflight.then(response=>response.clone());
      }
      accessInflight=originalFetch(input,init)
        .then(response=>{
          accessCached=response.clone();
          accessCachedAt=Date.now();
          return response;
        })
        .finally(()=>{accessInflight=null;});
      return accessInflight;
    }

    return originalFetch(input,init);
  };
})();
