/* Emergency guard: coalesce duplicate /api/purchase-orders GET calls to prevent ERR_INSUFFICIENT_RESOURCES. */
(function installPurchaseFetchThrottle(global){
  'use strict';
  if(global.__QMES_PURCHASE_FETCH_THROTTLE_20260903__) return;
  global.__QMES_PURCHASE_FETCH_THROTTLE_20260903__=true;
  const upstream=global.fetch.bind(global);
  let inflight=null;
  let cached=null;
  let cachedAt=0;
  const TTL=1500;
  function urlOf(input){try{return new URL(typeof input==='string'?input:input?.url,location.href);}catch(_){return null;}}
  function methodOf(input,init){return String(init?.method||input?.method||'GET').toUpperCase();}
  global.fetch=function qmesFetchGuard(input,init){
    const url=urlOf(input);
    if(!url||url.origin!==location.origin||url.pathname!=='/api/purchase-orders'||methodOf(input,init)!=='GET') return upstream(input,init);
    const now=Date.now();
    if(cached&&now-cachedAt<TTL){try{return Promise.resolve(cached.clone());}catch(_){cached=null;}}
    if(inflight) return inflight.then(r=>r.clone());
    inflight=upstream(input,init).then(response=>{
      try{cached=response.clone();cachedAt=Date.now();}catch(_){cached=null;}
      return response;
    }).finally(()=>{inflight=null;});
    return inflight.then(r=>r.clone());
  };
})(window);
