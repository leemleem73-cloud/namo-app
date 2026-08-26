/* QMES Stage 12 operational loader v13
 * Enterprise visual layers stay inactive while the field-input page is mounted.
 * Field layout and production LOT controls are owned by ipad-pop.jsx; legacy
 * post-render LOT/remarks correction scripts are intentionally not loaded.
 */
(function(){
  const STYLE_DEFS=[
    ["qmes-enterprise-ui-20260826","./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise3"],
    ["qmes-shell-offset-fix-20260826","./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1"],
    ["qmes-enterprise-readable-size-20260826","./css/qmes-enterprise-readable-size-20260826.css?v=20260826-readable2"],
    ["qmes-modern-corporate-ui-20260826","./css/qmes-modern-corporate-ui-20260826.css?v=20260826-modern2"],
    ["qmes-sidebar-line-align-20260826","./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2"],
    ["qmes-production-process-corporate-fix-20260826","./css/qmes-production-process-corporate-fix-20260826.css?v=20260826-process2"],
    ["qmes-workorder-issued-clean-20260826","./css/qmes-workorder-issued-clean-20260826.css?v=20260826-workorder1"],
    ["qmes-text-sharpness-20260826","./css/qmes-text-sharpness-20260826.css?v=20260826-sharp1"],
    ["qmes-spc-readability-fix-20260826","./css/qmes-spc-readability-fix-20260826.css?v=20260826-spc1"]
  ];

  function fieldInputActive(){return !!document.querySelector('.qmes-ipad-pop');}
  function ensureStyle(id,href){
    let link=document.getElementById(id);
    if(!link){link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=href;document.head.appendChild(link);}
    else if(String(link.getAttribute('href')||'')!==href)link.href=href;
    return link;
  }
  function syncThemeState(){
    const disabled=fieldInputActive();
    STYLE_DEFS.forEach(([id,href])=>{const link=ensureStyle(id,href);link.media=disabled?'not all':'all';});
  }

  syncThemeState();

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
    "./js/workorder-status-save-align-20260824.js?v=20260824-4",
    "./js/workorder-management-actions-layout-fix-20260824.js?v=20260824-sidebar-fit1",
    "./js/qmes-side-search-topbar-enhancement.js?v=20260807-1",
    "./js/qmes-erp-sidebar-sync-20260826.js?v=20260826-1",
    "./js/qmes-scroll-layer-guard-20260807.js?v=20260807-1",
    "./js/qmes-ncr-delete-completed-20260810.js?v=20260810-2",
    "./js/partners-register-modal-recovery-20260814.js?v=20260814-click-layer-v4",
    "./js/inventory-api-fallback-20260819.js?v=20260819-fallback1",
    "./js/inventory-qmes-integration-20260819.js?v=20260819-flow1",
    "./js/inventory-movement-action-restore-20260821.js?v=20260821-1"
  ];
  function exists(src){const base=src.split('?')[0];return Array.from(document.scripts).some(s=>(s.getAttribute('src')||'').split('?')[0]===base);}
  function finish(){
    document.getElementById('qmes-global-menu-preview-theme-20260826')?.remove();
    syncThemeState();
    window.dispatchEvent(new CustomEvent('qmes:enterprise-ui-ready'));
    window.dispatchEvent(new CustomEvent('qmes:mes-master-ready'));
  }
  function load(i){
    if(i>=files.length){finish();return;}
    const src=files[i];
    if(exists(src)){load(i+1);return;}
    const script=document.createElement('script');script.src=src;script.async=false;
    script.onload=()=>load(i+1);
    script.onerror=()=>{console.error('[QMES] MES 마스터 모듈 로드 실패',src);load(i+1);};
    document.head.appendChild(script);
  }

  const root=document.getElementById('root');
  if(root){
    let queued=false;
    new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;syncThemeState();});}).observe(root,{childList:true,subtree:true});
  }

  const start=()=>load(0);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
