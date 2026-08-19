/* QMES Stage 12 operational loader
 * Loads stable runtime helpers. Partner click-layer repair is loaded first so
 * customer/supplier registration cannot be blocked by later UI refinements.
 */
(function(){
  const files=[
    "./js/partner-equipment-fix-20260805.js?v=20260814-partner-click-restore1",
    "./js/item-recipe-master-20260807.js?v=20260807-1",
    "./js/workorder-recipe-bridge-20260807.js?v=20260807-1",
    "./js/workorder-recipe-ui-bridge-20260807.js?v=20260807-1",
    "./js/qmes-top-submenu-restore.js?v=20260819-unified-topmenu1",
    "./js/qmes-side-search-topbar-enhancement.js?v=20260807-1",
    "./js/qmes-scroll-layer-guard-20260807.js?v=20260807-1",
    "./js/qmes-ncr-delete-completed-20260810.js?v=20260810-2",
    "./js/partners-register-modal-recovery-20260814.js?v=20260814-click-layer-v4",
    "./js/inventory-api-fallback-20260819.js?v=20260819-fallback1",
    "./js/inventory-qmes-integration-20260819.js?v=20260819-flow1",
    "./js/inventory-menu-bridge.js?v=20260819-unified-topmenu1"
  ];
  function exists(src){
    const base=src.split("?")[0];
    return Array.from(document.scripts).some((s)=>(s.getAttribute("src")||"").split("?")[0]===base);
  }
  function load(i){
    if(i>=files.length){window.dispatchEvent(new CustomEvent("qmes:mes-master-ready"));return;}
    const src=files[i];if(exists(src)){load(i+1);return;}
    const script=document.createElement("script");script.src=src;script.async=false;script.onload=()=>load(i+1);script.onerror=()=>{console.error("[QMES] MES 마스터 모듈 로드 실패",src);load(i+1);};document.head.appendChild(script);
  }
  const start=()=>load(0);if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
