/* QMES Stage 12 operational loader v2
 * Loads stable runtime helpers. Partner click-layer repair is loaded first so
 * customer/supplier registration cannot be blocked by later UI refinements.
 */
(function(){
  /* Apply final work-order column sizes immediately. Previously this CSS was
   * loaded after several helper scripts, so Status appeared wide for about a
   * second and then shrank. Keep the first paint and final paint identical. */
  if(!document.getElementById("qmes-workorder-layout-first-paint-20260824")){
    const style=document.createElement("style");
    style.id="qmes-workorder-layout-first-paint-20260824";
    style.textContent=`
      .qmes-issued-table-v2 th:nth-child(10),
      .qmes-issued-table-v2 td:nth-child(10),
      .qmes-wo-list-table th:nth-child(10),
      .qmes-wo-list-table td:nth-child(10){
        width:105px!important;min-width:105px!important;max-width:105px!important;
        padding-left:5px!important;padding-right:5px!important;text-align:center!important;white-space:nowrap!important;
      }
      .qmes-issued-table-v2 td:nth-child(10) select,
      .qmes-wo-list-table td:nth-child(10) select{
        display:block!important;box-sizing:border-box!important;
        width:88px!important;min-width:88px!important;max-width:88px!important;height:30px!important;
        margin:0 auto!important;padding-left:8px!important;padding-right:22px!important;text-align:center!important;
      }
      .qmes-issued-table-v2 th:last-child,
      .qmes-issued-table-v2 td:last-child,
      .qmes-wo-list-table th:last-child,
      .qmes-wo-list-table td:last-child{
        width:270px!important;min-width:270px!important;max-width:270px!important;
        padding-left:5px!important;padding-right:5px!important;white-space:nowrap!important;
        overflow:visible!important;text-overflow:clip!important;text-align:center!important;vertical-align:middle!important;
      }
      .qmes-issued-table-v2 td:last-child button,
      .qmes-wo-list-table td:last-child button,
      .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
      .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;
        box-sizing:border-box!important;width:auto!important;min-width:0!important;min-height:28px!important;height:28px!important;
        margin:0 2px!important;padding:0 7px!important;line-height:1!important;white-space:nowrap!important;float:none!important;
      }
      @media(max-width:1500px){
        .qmes-issued-table-v2 th:nth-child(10),.qmes-issued-table-v2 td:nth-child(10),
        .qmes-wo-list-table th:nth-child(10),.qmes-wo-list-table td:nth-child(10){
          width:92px!important;min-width:92px!important;max-width:92px!important;
        }
        .qmes-issued-table-v2 td:nth-child(10) select,.qmes-wo-list-table td:nth-child(10) select{
          width:78px!important;min-width:78px!important;max-width:78px!important;
        }
        .qmes-issued-table-v2 th:last-child,.qmes-issued-table-v2 td:last-child,
        .qmes-wo-list-table th:last-child,.qmes-wo-list-table td:last-child{
          width:250px!important;min-width:250px!important;max-width:250px!important;
        }
        .qmes-issued-table-v2 td:last-child button,.qmes-wo-list-table td:last-child button,
        .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
        .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{
          margin:0 1px!important;padding:0 5px!important;font-size:11px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const files=[
    "./js/partner-equipment-fix-20260805.js?v=20260814-partner-click-restore1",
    "./js/item-recipe-master-20260807.js?v=20260807-1",
    "./js/workorder-recipe-bridge-20260807.js?v=20260807-1",
    "./js/workorder-recipe-ui-bridge-20260807.js?v=20260807-1",
    "./js/qmes-top-submenu-restore-20260820-v2.js?v=20260820-5",
    "./js/production-process-link-fix-20260824.js?v=20260824-1",
    "./js/production-worklog-date-retry-20260824.js?v=20260824-1",
    "./js/production-top-submenu-hide-20260824.js?v=20260824-1",
    "./js/production-worker-normalize-delete-20260824.js?v=20260824-safe2",
    "./js/production-worker-live-name-sync-20260824.js?v=20260824-1",
    "./js/ipad-pqc-lot-completion-label-20260824.js?v=20260824-2",
    "./js/qmes-side-search-topbar-enhancement.js?v=20260807-1",
    "./js/qmes-scroll-layer-guard-20260807.js?v=20260807-1",
    "./js/qmes-ncr-delete-completed-20260810.js?v=20260810-2",
    "./js/partners-register-modal-recovery-20260814.js?v=20260814-click-layer-v4",
    "./js/inventory-api-fallback-20260819.js?v=20260819-fallback1",
    "./js/inventory-qmes-integration-20260819.js?v=20260819-flow1",
    "./js/inventory-menu-bridge-20260820-v2.js?v=20260820-5",
    "./js/inventory-movement-action-restore-20260821.js?v=20260821-1"
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
