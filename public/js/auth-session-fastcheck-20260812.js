/* QMES auth session fast-check - 2026-08-12
 * Keeps /api/auth/me from blocking startup and installs the single enterprise
 * stylesheet before React/Babel modules render. No legacy theme CSS is injected here.
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

(function installEnterpriseUiBeforeRender(){
  const id="qmes-enterprise-ui-20260826";
  const href="./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise2";
  let link=document.getElementById(id);
  if(!link){
    link=document.createElement("link");
    link.id=id;
    link.rel="stylesheet";
    link.href=href;
    document.head.appendChild(link);
  }else if(!String(link.getAttribute("href")||"").includes("enterprise2")){
    link.href=href;
  }
  document.documentElement.style.setProperty("color-scheme","light");
})();
