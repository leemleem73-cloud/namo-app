/* Loads the live inventory integration after React/QMES modules are ready. */
(function(){
  function load(){
    if (window.qmesBuildInventoryRows) return;
    const script=document.createElement("script");
    script.src="./js/inventory-live-20260807.js?v=20260807-1";
    script.async=false;
    script.onerror=()=>console.error("[QMES] 실시간 재고 연동 모듈 로드 실패");
    document.head.appendChild(script);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, {once:true});
  else load();
})();
