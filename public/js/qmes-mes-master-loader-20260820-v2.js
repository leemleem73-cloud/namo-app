/* QMES Stage 12 operational loader v11
 * Loads stable runtime helpers and enterprise visual layers.
 * The original field-input stylesheet stack is restored once, after all global themes.
 * Global MAIN-content themes are scoped away from the field-input page so its
 * established 8/24 layout can render without enterprise form overrides.
 * No MutationObserver or click-time stylesheet reordering is used here.
 */
(function(){
  const ENTERPRISE_STYLE="./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise2";
  const SHELL_OFFSET_STYLE="./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1";
  const READABLE_SIZE_STYLE="./css/qmes-enterprise-readable-size-20260826.css?v=20260826-readable2";
  const MODERN_CORPORATE_STYLE="./css/qmes-modern-corporate-ui-20260826.css?v=20260826-modern1";
  const SIDEBAR_LINE_STYLE="./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2";
  const PROCESS_CORPORATE_STYLE="./css/qmes-production-process-corporate-fix-20260826.css?v=20260826-process2";
  const WORKORDER_ISSUED_STYLE="./css/qmes-workorder-issued-clean-20260826.css?v=20260826-workorder1";
  const TEXT_SHARPNESS_STYLE="./css/qmes-text-sharpness-20260826.css?v=20260826-sharp1";
  const SPC_READABILITY_STYLE="./css/qmes-spc-readability-fix-20260826.css?v=20260826-spc1";
  const FIELD_STYLES=[
    ["qmes-ipad-pop-original","./css/ipad-pop.css?v=20260824-field-original1"],
    ["qmes-ipad-pop-tweaks-original","./css/ipad-pop-tweaks-20260810.css?v=20260824-field-original1"],
    ["qmes-ipad-pqc-order-original","./css/ipad-pqc-order-fix-20260810.css?v=20260824-field-original1"],
    ["qmes-ipad-equipment-original","./css/ipad-equipment-light-20260810.css?v=20260824-field-original1"],
    ["qmes-ipad-pop-final-original","./css/ipad-pop-final-20260810.css?v=20260824-field-original2"]
  ];

  function ensureStyle(id,href,moveToEnd){
    let link=document.getElementById(id);
    if(!link){link=document.createElement("link");link.id=id;link.rel="stylesheet";link.href=href;document.head.appendChild(link);return link;}
    if(String(link.getAttribute("href")||"")!==href)link.href=href;
    if(moveToEnd&&link.parentNode===document.head)document.head.appendChild(link);
    return link;
  }
  function ensureFinalStyles(moveToEnd){
    ensureStyle("qmes-enterprise-ui-20260826",ENTERPRISE_STYLE,moveToEnd);
    ensureStyle("qmes-shell-offset-fix-20260826",SHELL_OFFSET_STYLE,moveToEnd);
    ensureStyle("qmes-enterprise-readable-size-20260826",READABLE_SIZE_STYLE,moveToEnd);
    ensureStyle("qmes-modern-corporate-ui-20260826",MODERN_CORPORATE_STYLE,moveToEnd);
    ensureStyle("qmes-sidebar-line-align-20260826",SIDEBAR_LINE_STYLE,moveToEnd);
    ensureStyle("qmes-production-process-corporate-fix-20260826",PROCESS_CORPORATE_STYLE,moveToEnd);
    ensureStyle("qmes-workorder-issued-clean-20260826",WORKORDER_ISSUED_STYLE,moveToEnd);
    ensureStyle("qmes-text-sharpness-20260826",TEXT_SHARPNESS_STYLE,moveToEnd);
    ensureStyle("qmes-spc-readability-fix-20260826",SPC_READABILITY_STYLE,moveToEnd);
  }
  function restoreOriginalFieldStyles(){
    FIELD_STYLES.forEach(([id,href])=>ensureStyle(id,href,true));
  }
  ensureFinalStyles(false);
  const files=[
    "./js/qmes-erp-runtime-loader-20260826.js?v=20260826-2",
    "./js/production-downtime-edit-recovery-20260824.js?v=20260824-hard1",
    "./js/production-downtime-history-20260824.js?v=20260824-edit4",
    "./js/partner-equipment-fix-20260805.js?v=20260814-partner-click-restore1",
    "./js/item-recipe-master-20260807.js?v=20260807-1",
    "./js/workorder-recipe-bridge-20260807.js?v=20260807-1",
    "./js/workorder-recipe-ui-bridge-20260807.js?v=20260807-1",
    "./js/qmes-top-submenu-restore-20260820-v2.js?v=20260826-enterprise2",
    "./js/production-process-link-fix-20260824.js?v=20260824-1",
    "./js/production-process-initial-sync-20260824.js?v=20260824-2",
    "./js/production-worklog-date-retry-20260824.js?v=20260824-1",
    "./js/production-top-submenu-hide-20260824.js?v=20260824-1",
    "./js/production-worker-normalize-delete-20260824.js?v=20260824-safe2",
    "./js/production-worker-live-name-sync-20260824.js?v=20260824-1",
    "./js/ipad-pqc-oqc-date-field-sanitize-20260824.js?v=20260824-1",
    "./js/ipad-pqc-lot-completion-label-20260824.js?v=20260824-8",
    "./js/ipad-pqc-oqc-lot-overlap-cleanup-20260824.js?v=20260824-1",
    "./js/workorder-status-save-align-20260824.js?v=20260824-4",
    "./js/workorder-management-actions-layout-fix-20260824.js?v=20260824-sidebar-fit1",
    "./js/qmes-side-search-topbar-enhancement.js?v=20260807-1",
    "./js/qmes-scroll-layer-guard-20260807.js?v=20260807-1",
    "./js/qmes-ncr-delete-completed-20260810.js?v=20260810-2",
    "./js/partners-register-modal-recovery-20260814.js?v=20260814-click-layer-v4",
    "./js/inventory-api-fallback-20260819.js?v=20260819-fallback1",
    "./js/inventory-qmes-integration-20260819.js?v=20260819-flow1",
    "./js/inventory-movement-action-restore-20260821.js?v=20260821-1",
    "./js/qmes-field-input-theme-scope-20260826.js?v=20260826-scope1"
  ];
  function exists(src){const base=src.split("?")[0];return Array.from(document.scripts).some((s)=>(s.getAttribute("src")||"").split("?")[0]===base);}
  function finish(){
    document.getElementById("qmes-global-menu-preview-theme-20260826")?.remove();
    ensureFinalStyles(true);
    restoreOriginalFieldStyles();
    window.dispatchEvent(new CustomEvent("qmes:enterprise-ui-ready"));
    window.dispatchEvent(new CustomEvent("qmes:mes-master-ready"));
  }
  function load(i){if(i>=files.length){finish();return;}const src=files[i];if(exists(src)){ensureFinalStyles(true);load(i+1);return;}const script=document.createElement("script");script.src=src;script.async=false;script.onload=()=>{ensureFinalStyles(true);load(i+1);};script.onerror=()=>{console.error("[QMES] MES 마스터 모듈 로드 실패",src);ensureFinalStyles(true);load(i+1);};document.head.appendChild(script);}
  const start=()=>load(0);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
