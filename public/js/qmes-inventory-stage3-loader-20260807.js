/* QMES inventory stage 3 loader */
(function(){
  const files=[
    "./js/inventory-live-20260807.js?v=20260807-1",
    "./js/finished-goods-inventory-20260807.js?v=20260807-1",
    "./js/inventory-lot-validation-20260807.js?v=20260807-1",
    "./js/inventory-final-validation-20260807.js?v=20260807-1",
    "./js/inventory-stage3-view-20260807.js?v=20260807-2",
    "./js/inventory-final-validation-ui-20260807.js?v=20260807-1",
    "./js/inventory-ui-final-safe-20260807-v3.js?v=20260807-1",
    "./js/inventory-iqc-sync-refresh-20260807.js?v=20260807-1"
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
  const start=()=>next(0);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();