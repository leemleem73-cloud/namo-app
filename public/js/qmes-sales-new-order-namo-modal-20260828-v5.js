/* NAMO QMES - Sales new-order single owner bridge - 2026-08-31
 * ADD-ONLY compatibility owner. Original historical implementations remain in Git.
 *
 * Fixes the current conflict where the visible '+ 신규 수주' button can still be
 * handled by a legacy/simple modal even though V6 is loaded. The V6 click handler
 * only owned buttons inside .qmes-sales-stable, while the current Sales page can be
 * rendered by a different root. This bridge captures every real '신규 수주' button
 * before the legacy owners and always opens V6.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_SINGLE_OWNER_20260831__)return;
  window.__QMES_SALES_NEW_ORDER_SINGLE_OWNER_20260831__=true;
  window.__QMES_SALES_NEW_ORDER_V5_TO_V6_BRIDGE_20260831__=true;

  const TARGET="./js/qmes-sales-new-order-namo-modal-20260831-v6.js?v=20260831-owner4";
  const CLASSIFICATION="./js/qmes-sales-order-classification-20260831-v2.js?v=20260831-owner1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  let loadPromise=null;

  function bindAliases(){
    const api=window.qmesSalesNewOrderNamoV6;
    if(!api||typeof api.open!=="function")return false;
    window.qmesSalesNewOrderNamoV5=api;
    window.qmesSalesNewOrderNamoV4=api;
    window.qmesSalesNewOrderNamoV3=api;
    window.qmesSalesNewOrderNamo=api;
    window.qmesSalesNewOrderEnterprise=api;
    return true;
  }

  function ensureClassification(){
    if(window.__QMES_SALES_ORDER_CLASSIFICATION_20260831_V2__){
      try{window.qmesSalesOrderClassificationV2?.scan?.();}catch(_){ }
      return;
    }
    if(document.querySelector('script[data-qmes-sales-classification-v2="1"]'))return;
    const script=document.createElement("script");
    script.src=CLASSIFICATION;
    script.async=false;
    script.dataset.qmesSalesClassificationV2="1";
    script.onload=()=>{try{window.qmesSalesOrderClassificationV2?.scan?.();}catch(_){ }};
    document.head.appendChild(script);
  }

  function ensureV6(){
    if(bindAliases())return Promise.resolve(window.qmesSalesNewOrderNamoV6);
    if(loadPromise)return loadPromise;
    loadPromise=new Promise((resolve,reject)=>{
      const existing=Array.from(document.scripts).find(script=>{
        const src=String(script.getAttribute("src")||"").split("?")[0];
        return /qmes-sales-new-order-namo-modal-20260831-v6\.js$/.test(src);
      });
      const done=()=>{
        if(bindAliases())resolve(window.qmesSalesNewOrderNamoV6);
        else reject(new Error("V6 신규 수주 화면 API가 준비되지 않았습니다."));
      };
      if(existing){
        if(window.qmesSalesNewOrderNamoV6)done();
        else{
          existing.addEventListener("load",done,{once:true});
          [60,180,450,900].forEach(ms=>setTimeout(()=>{if(window.qmesSalesNewOrderNamoV6)done();},ms));
        }
        return;
      }
      const script=document.createElement("script");
      script.src=TARGET;
      script.async=false;
      script.dataset.qmesSalesSingleOwner="v6";
      script.onload=done;
      script.onerror=()=>reject(new Error("V6 신규 수주 화면을 불러오지 못했습니다."));
      document.head.appendChild(script);
    }).finally(()=>{loadPromise=null;});
    return loadPromise;
  }

  function removeLegacyModals(){
    const ids=[
      "qmes-sales-new-order-modal-v5",
      "qmes-sales-new-order-namo-20260828-v4",
      "qmes-sales-new-order-namo-20260828-v3",
      "qmes-sales-new-order-namo-20260828-v2",
      "qmes-sales-new-order-enterprise-20260828-v1"
    ];
    ids.forEach(id=>document.getElementById(id)?.remove());

    Array.from(document.querySelectorAll('[role="dialog"][aria-label="신규 수주 등록"]')).forEach(dialog=>{
      if(dialog.closest("#qmes-sales-new-order-modal-v6"))return;
      let root=dialog;
      for(let i=0;i<3&&root.parentElement;i++){
        if(root.parentElement===document.body)break;
        root=root.parentElement;
      }
      try{(root.parentElement===document.body?root:dialog).remove();}catch(_){ }
    });
  }

  function isNewOrderButton(button){
    if(!button||button.closest("[role='dialog']"))return false;
    const text=clean(button.textContent).replace(/^\+\s*/,"");
    return text==="신규 수주";
  }

  async function openV6(){
    try{
      removeLegacyModals();
      const api=await ensureV6();
      bindAliases();
      api.open();
      ensureClassification();
      requestAnimationFrame(()=>{try{window.qmesSalesOrderClassificationV2?.scan?.();}catch(_){ }});
      setTimeout(()=>{try{window.qmesSalesOrderClassificationV2?.scan?.();}catch(_){ }},80);
    }catch(error){
      console.error("[QMES Sales New Order Owner]",error);
      alert("신규 수주 화면을 열지 못했습니다. 새로고침 후 다시 시도해 주세요.");
    }
  }

  /* Capture on window runs before document-level legacy handlers. */
  window.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const button=target.closest("button");
    if(!isNewOrderButton(button))return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openV6();
  },true);

  /* Keep all legacy public APIs pointing to V6 even if later modules rewrite them. */
  const rebind=()=>{bindAliases();ensureClassification();};
  [0,80,220,600,1200,2200].forEach(ms=>setTimeout(rebind,ms));
  ["qmes:erp-runtime-loaded","qmes:enterprise-ui-ready","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,rebind));
  ensureV6().then(()=>{bindAliases();ensureClassification();}).catch(error=>console.warn("[QMES Sales New Order Owner] preload",error?.message||error));
})();
