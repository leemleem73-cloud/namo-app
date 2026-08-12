/* QMES inventory stage 3 loader */
(function(){
  const files=[
    "./js/inventory-shared-sync-20260807.js?v=20260807-1",
    "./js/inventory-live-20260807.js?v=20260812-sbs-remark1",
    "./js/finished-goods-inventory-20260807.js?v=20260807-1",
    "./js/inventory-lot-validation-20260807.js?v=20260807-1",
    "./js/inventory-final-validation-20260807.js?v=20260807-1",
    "./js/inventory-stage3-view-20260807.js?v=20260807-2",
    "./js/inventory-final-validation-ui-20260807.js?v=20260807-1",
    "./js/inventory-ui-final-safe-20260807-v3.js?v=20260807-1",
    "./js/dashboard-inventory-unified-sync-20260807.js?v=20260810-dashboard-stable1",
    "./js/inventory-workorder-delete-link-20260812.js?v=20260812-2"
  ];
  function exists(src){
    const base=src.split("?")[0];
    return Array.from(document.scripts).some(s=>(s.getAttribute("src")||"").split("?")[0]===base);
  }
  function next(i){
    if(i>=files.length){window.dispatchEvent(new CustomEvent("qmes:inventory-stage3-ready"));return;}
    const src=files[i];
    if(exists(src)){next(i+1);return;}
    const s=document.createElement("script");
    s.src=src;s.async=false;
    s.onload=()=>next(i+1);
    s.onerror=()=>console.error("[QMES] 재고 모듈 로드 실패",src);
    document.head.appendChild(s);
  }
  let started=false;
  function authenticated(){
    return Boolean(window.__QMES_CURRENT_USER__ || window.__QMES_USER__);
  }
  function start(){
    if(started || !authenticated()) return;
    started=true;
    next(0);
  }
  function waitForLogin(){
    start();
    if(started) return;
    const timer=setInterval(()=>{
      start();
      if(started) clearInterval(timer);
    },250);
    window.addEventListener("qmes:auth-ready",start,{once:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",waitForLogin,{once:true});else waitForLogin();
})();