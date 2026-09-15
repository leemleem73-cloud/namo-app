/* QMES auth/session + first-paint bootstrap
 * Keep auth handling minimal and avoid repeated fetch retries that can
 * bounce the login state or trigger visible first-paint flicker.
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
    if(!options.credentials) options.credentials="same-origin";
    options.cache="no-store";

    // Do not auto-retry auth/me here. A delayed second auth request can race
    // the initial app bootstrap and make the login/main screen flash or bounce.
    return nativeFetch(input,options);
  };
})(window);

/* Purchase authoritative sync bridge — installs before qmes-sync.js.
 * The ERP purchase React component reads erp:purchase during its first mount.
 * Make that very first inventory sync include the authoritative purchase_orders rows.
 */
(function installPurchaseSyncBridge(global){
  "use strict";
  if(global.__QMES_PURCHASE_SYNC_BRIDGE_EARLY_20260915__) return;
  global.__QMES_PURCHASE_SYNC_BRIDGE_EARLY_20260915__=true;

  const key="qmesSyncList";
  const existing=Object.getOwnPropertyDescriptor(global,key);
  if(existing&&existing.configurable===false) return;

  let currentValue=existing&&typeof existing.value==="function"?existing.value:undefined;
  const nativeFetch=global.fetch.bind(global);

  function readPayload(value){
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){
      try{return JSON.parse(value);}catch(_error){}
    }
    return {};
  }

  async function authoritativePurchaseRows(){
    try{
      const response=await nativeFetch("/api/purchase-orders?_qmesFresh="+Date.now(),{
        credentials:"same-origin",
        cache:"no-store",
        headers:{
          "Accept":"application/json",
          "Cache-Control":"no-cache, no-store, max-age=0",
          "Pragma":"no-cache"
        }
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok||!payload||payload.success===false) return [];
      const data=Object.prototype.hasOwnProperty.call(payload,"data")?payload.data:payload;
      return Array.isArray(data)?data:(data&&Array.isArray(data.rows)?data.rows:[]);
    }catch(error){
      console.warn("[QMES purchase bridge] authoritative read failed",error);
      return [];
    }
  }

  function mergePurchase(records,rows){
    const list=Array.isArray(records)?records.slice():[];
    if(!rows.length) return list;
    const index=list.findIndex(row=>String(row&&row.record_key||"")==="erp:purchase");
    const previous=index>=0?list[index]:{};
    const previousPayload=readPayload(previous&&previous.payload);
    const record={
      ...previous,
      record_type:"inventory",
      record_key:"erp:purchase",
      payload:{
        ...previousPayload,
        module:"erp",
        kind:"purchase",
        schema:3,
        rows,
        updatedAt:new Date().toISOString(),
        updatedBy:"purchase_orders"
      }
    };
    if(index>=0) list[index]=record;
    else list.push(record);
    try{localStorage.setItem("qmes-erp-purchase-v1",JSON.stringify(rows));}catch(_error){}
    return list;
  }

  function wrap(fn){
    if(typeof fn!=="function") return fn;
    if(fn.__QMES_PURCHASE_SYNC_BRIDGE_WRAPPED__) return fn;
    const wrapped=async function(type,...args){
      const records=await fn.call(this,type,...args);
      if(String(type||"").trim().toLowerCase()!=="inventory") return records;
      const rows=await authoritativePurchaseRows();
      return rows.length?mergePurchase(records,rows):records;
    };
    wrapped.__QMES_PURCHASE_SYNC_BRIDGE_WRAPPED__=true;
    wrapped.__QMES_PURCHASE_SYNC_BRIDGE_SOURCE__=fn;
    return wrapped;
  }

  currentValue=wrap(currentValue);
  Object.defineProperty(global,key,{
    configurable:true,
    enumerable:true,
    get(){return currentValue;},
    set(value){currentValue=wrap(value);}
  });
})(window);

/* Restore the confirmed Field Input ownership model without toggling styles
 * that are already present in the document. This keeps the shared shell
 * stable during first paint and avoids visible stylesheet on/off flashes.
 */
(function installCurrentUiBeforeRender(){
  "use strict";
  if(window.__QMES_CURRENT_UI_BOOTSTRAP_20260826__) return;
  window.__QMES_CURRENT_UI_BOOTSTRAP_20260826__=true;

  let fieldInputFirstPaint=false;
  try{fieldInputFirstPaint=sessionStorage.getItem("qmes_current_tab")==="pop";}catch(_error){}

  const styles=[
    ["qmes-enterprise-ui-20260826","./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise3",false],
    ["qmes-shell-offset-fix-20260826","./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1",true],
    ["qmes-shell-readable-size-20260827","./css/qmes-shell-readable-size-20260827.css?v=20260827-2",true],
    ["qmes-enterprise-readable-size-20260826","./css/qmes-enterprise-readable-size-20260826.css?v=20260826-readable2",false],
    ["qmes-modern-corporate-ui-20260826","./css/qmes-modern-corporate-ui-20260826.css?v=20260826-modern2",false],
    ["qmes-sidebar-line-align-20260826","./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2",true],
    ["qmes-production-process-corporate-fix-20260826","./css/qmes-production-process-corporate-fix-20260826.css?v=20260826-process2",false],
    ["qmes-workorder-issued-clean-20260826","./css/qmes-workorder-issued-clean-20260826.css?v=20260826-workorder1",false],
    ["qmes-text-sharpness-20260826","./css/qmes-text-sharpness-20260826.css?v=20260826-sharp1",false],
    ["qmes-spc-readability-fix-20260826","./css/qmes-spc-readability-fix-20260826.css?v=20260826-spc1",false],
    ["qmes-shared-shell-final-20260827","./css/qmes-shared-shell-final-20260827.css?v=20260827-1",true],
    ["qmes-responsive-main-layout-20260827","./css/qmes-responsive-main-layout-20260827.css?v=20260827-1",false],
    ["qmes-header-stable-20260827","./css/qmes-header-stable-20260827.css?v=20260827-1",true]
  ];

  styles.forEach(([id,href,keepDuringField])=>{
    let link=document.getElementById(id);
    if(!link){
      link=document.createElement("link");
      link.id=id;
      link.rel="stylesheet";
      link.href=href;
      if(fieldInputFirstPaint&&!keepDuringField) link.media="not all";
      document.head.appendChild(link);
      return;
    }

    // Existing styles are left untouched during bootstrap so the browser does
    // not repaint the whole app because of media/disabled flips.
    if(String(link.getAttribute("href")||"")!==href) link.href=href;
  });
})();