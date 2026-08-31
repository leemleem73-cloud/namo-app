/* QMES Stage 12 operational loader v65
 * Login-safe runtime gate - 2026-08-31.
 * F5 optimization: only one New Sales Order implementation is loaded.
 * V9 force-owns the New Sales Order click and replaces any legacy/demo popup.
 */
(function(){
  "use strict";
  if(window.__QMES_STAGE12_RUNTIME_V65__) return;
  window.__QMES_STAGE12_RUNTIME_V65__=true;

  const STYLE_DEFS=[
    ["qmes-enterprise-ui-20260826","./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise3",false],
    ["qmes-shell-offset-fix-20260826","./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1",true],
    ["qmes-shell-readable-size-20260827","./css/qmes-shell-readable-size-20260827.css?v=20260827-3",true],
    ["qmes-enterprise-readable-size-20260826","./css/qmes-enterprise-readable-size-20260826.css?v=20260826-readable2",false],
    ["qmes-modern-corporate-ui-20260826","./css/qmes-modern-corporate-ui-20260826.css?v=20260827-docscope1",false],
    ["qmes-sidebar-line-align-20260826","./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2",true],
    ["qmes-production-process-corporate-fix-20260826","./css/qmes-production-process-corporate-fix-20260826.css?v=20260826-process2",false],
    ["qmes-workorder-issued-clean-20260826","./css/qmes-workorder-issued-clean-20260826.css?v=20260826-workorder1",false],
    ["qmes-text-sharpness-20260826","./css/qmes-text-sharpness-20260826.css?v=20260826-sharp1",false],
    ["qmes-spc-readability-fix-20260826","./css/qmes-spc-readability-fix-20260826.css?v=20260826-spc1",false],
    ["qmes-sales-spacious-layout-20260826","./css/qmes-sales-spacious-layout-20260826.css?v=20260826-enterprise5",false],
    ["qmes-sales-table-stable-20260827","./css/qmes-sales-table-stable-20260827.css?v=20260827-grid1",false],
    ["qmes-shared-shell-final-20260827","./css/qmes-shared-shell-final-20260827.css?v=20260827-1",true],
    ["qmes-responsive-main-layout-20260827","./css/qmes-responsive-main-layout-20260827.css?v=20260827-1",false],
    ["qmes-header-stable-20260827","./css/qmes-header-stable-20260827.css?v=20260827-1",true],
    ["qmes-document-final-restore-20260827","./css/qmes-document-final-restore-20260827.css?v=20260827-final1",false],
    ["qmes-inspection-search-single-field-20260827","./css/qmes-inspection-search-single-field-20260827.css?v=20260827-1",false],
    ["qmes-production-worker-name-visible-20260827","./css/qmes-production-worker-name-visible-20260827.css?v=20260827-2",false]
  ];

  const files=[
    "./js/qmes-sales-new-order-namo-modal-20260831-v9.js?v=20260831-force1",
    "./js/qmes-sales-new-order-grid-layout-20260831-v1.js?v=20260831-grid1",
    "./js/qmes-sales-bootstrap-stability-20260828-v1.js?v=20260828-1",
    "./js/qmes-sales-detail-drawer-safe-20260828-v2.js?v=20260828-1",
    "./js/qmes-sales-workorder-view-bridge-20260831-v1.js?v=20260831-1",
    "./js/qmes-sales-detail-drawer-20260828-v1.js?v=20260828-1",
    "./js/qmes-erp-runtime-loader-20260826.js?v=20260827-manual-product2",
    "./js/qmes-sales-enterprise-module-20260828-v2.js?v=20260828-2",
    "./js/qmes-sales-enterprise-polish-20260828-v1.js?v=20260828-2",
    "./js/qmes-sales-font-unify-20260828-v1.js?v=20260828-query3",
    "./js/qmes-sales-order-number-rule-20260827-v1.js?v=20260827-1",
    "./js/qmes-sales-product-workorder-link-20260827.js?v=20260827-1",
    "./js/qmes-sales-full-edit-20260827.js?v=20260827-full-edit1",
    "./js/qmes-sales-edit-modal-force-20260827-v2.js?v=20260827-force2",
    "./js/qmes-sales-workorder-oqc-traceability-20260827.js?v=20260827-trace1",
    "./js/qmes-sales-delete-so-260826-01-once.js?v=20260826-1",
    "./js/qmes-lot-quality-shipping-linkage-20260826.js?v=20260826-1",
    "./js/qmes-shipping-enterprise-module-20260828-v1.js?v=20260828-2",
    "./js/qmes-shipping-html-match-20260828-v2.js?v=20260828-1",
    "./js/production-downtime-edit-recovery-20260824.js?v=20260824-hard1",
    "./js/production-downtime-history-20260824.js?v=20260824-edit4",
    "./js/production-downtime-audit-fix-20260827-v1.js?v=20260827-1",
    "./js/partner-equipment-fix-20260805.js?v=20260814-partner-click-restore1",
    "./js/item-recipe-master-20260807.js?v=20260807-1",
    "./js/workorder-recipe-bridge-20260807.js?v=20260807-1",
    "./js/workorder-recipe-ui-bridge-20260807.js?v=20260807-1",
    "./js/workorder-material-iqc-sync-20260827.js?v=20260827-pai-add2",
    "./js/workorder-iqc-lot-strict-20260813.js?v=20260827-all-iqc-strict1",
    "./js/qmes-top-submenu-restore-20260820-v2.js?v=20260827-erp-hover1",
    "./js/qmes-field-home-navigation-20260826.js?v=20260826-1",
    "./js/production-process-screen-stability-20260827-v1.js?v=20260827-1",
    "./js/production-process-link-fix-20260824.js?v=20260824-1",
    "./js/production-process-initial-sync-20260824.js?v=20260824-2",
    "./js/production-process-step30-text-stable-20260827-v1.js?v=20260827-1",
    "./js/production-worklog-date-retry-20260824.js?v=20260824-1",
    "./js/production-top-submenu-hide-20260824.js?v=20260824-1",
    "./js/production-worker-normalize-delete-20260824.js?v=20260824-safe2",
    "./js/production-worker-live-name-sync-20260824.js?v=20260824-1",
    "./js/production-worker-picker-readable-20260827.js?v=20260827-force3",
    "./js/production-process-remark-edit-20260827.js?v=20260827-remark4",
    "./js/production-process-remark-click-hotfix-20260827.js?v=20260827-click1",
    "./js/production-process-row-edit-20260827-v1.js?v=20260827-1",
    "./js/ipad-pqc-oqc-date-field-sanitize-20260824.js?v=20260824-1",
    "./js/workorder-status-save-align-20260824.js?v=20260824-4",
    "./js/workorder-management-actions-layout-fix-20260824.js?v=20260824-sidebar-fit1",
    "./js/qmes-erp-sidebar-sync-20260826.js?v=20260827-active-lifecycle1",
    "./js/qmes-sales-order-detail-progress-20260826.js?v=20260827-direct-render1",
    "./js/qmes-sales-order-detail-owner-20260827-v2.js?v=20260827-1",
    "./js/qmes-scroll-layer-guard-20260807.js?v=20260827-preview-only1",
    "./js/qmes-ncr-delete-completed-20260810.js?v=20260810-2",
    "./js/partners-register-modal-recovery-20260814.js?v=20260814-click-layer-v4",
    "./js/inventory-api-fallback-20260819.js?v=20260819-fallback1",
    "./js/inventory-qmes-integration-20260819.js?v=20260819-flow1",
    "./js/inventory-movement-list-clean-20260821.js?v=20260824-firstpaint1"
  ];

  function authenticated(){
    const user=window.__QMES_CURRENT_USER__;
    return !!(user&&typeof user==='object'&&(user.id||user.uid||user.name));
  }

  function fieldInputActive(){return !!document.querySelector('.qmes-ipad-pop');}
  function ensureStyle(id,href){
    let link=document.getElementById(id);
    if(!link){link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=href;document.head.appendChild(link);}
    else if(String(link.getAttribute('href')||'')!==href)link.href=href;
    link.disabled=false;
    return link;
  }
  function syncThemeState(){
    if(!authenticated())return;
    document.getElementById('qmes-coa-current-final-20260827')?.remove();
    const field=fieldInputActive();
    STYLE_DEFS.forEach(([id,href,keepDuringField])=>{const link=ensureStyle(id,href);link.media=field&&!keepDuringField?'not all':'all';});
  }
  function exists(src){const base=src.split('?')[0];return Array.from(document.scripts).some(s=>(s.getAttribute('src')||'').split('?')[0]===base);}
  function finish(){syncThemeState();window.dispatchEvent(new CustomEvent('qmes:enterprise-ui-ready'));window.dispatchEvent(new CustomEvent('qmes:mes-master-ready'));}
  function load(i){
    if(i>=files.length){finish();return;}
    const src=files[i];if(exists(src)){load(i+1);return;}
    const script=document.createElement('script');script.src=src;script.async=false;script.onload=()=>load(i+1);script.onerror=()=>{console.error('[QMES] MES master module load failed',src);load(i+1);};document.head.appendChild(script);
  }

  let runtimeStarted=false,rootObserver=null;
  function startRuntime(){
    if(runtimeStarted)return;
    if(!authenticated()){window.setTimeout(startRuntime,150);return;}
    runtimeStarted=true;syncThemeState();
    const root=document.getElementById('root');
    if(root&&!rootObserver){let queued=false;rootObserver=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;syncThemeState();});});rootObserver.observe(root,{childList:true,subtree:true});}
    load(0);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startRuntime,{once:true});else startRuntime();
})();
