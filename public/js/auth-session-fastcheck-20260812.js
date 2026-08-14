/* QMES auth session fast-check - 2026-08-12
 * Prevent a stale browser session from keeping the login screen hidden for ~2 seconds.
 * Only /api/auth/me is given a reasonable startup timeout; normal API calls are untouched.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;
  const nativeFetch=global.fetch.bind(global);
  global.fetch=function(input,init){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    if(!/\/api\/auth\/me(?:\?|$)/.test(url)) return nativeFetch(input,init);
    const options={...(init||{})};
    if(options.signal) return nativeFetch(input,options);
    const controller=new AbortController();
    const timer=global.setTimeout(()=>controller.abort(),5000);
    options.signal=controller.signal;
    return nativeFetch(input,options).finally(()=>global.clearTimeout(timer));
  };
})(window);
