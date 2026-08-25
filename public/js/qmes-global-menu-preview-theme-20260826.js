/* QMES global menu theme — match integrated preview light menu palette */
(function(){
  "use strict";
  if(window.__QMES_GLOBAL_MENU_PREVIEW_THEME_20260826__) return;
  window.__QMES_GLOBAL_MENU_PREVIEW_THEME_20260826__=true;

  const style=document.createElement("style");
  style.id="qmes-global-menu-preview-theme-20260826";
  style.textContent=`
    :root{
      --qmes-preview-bg:#f5f7fb;
      --qmes-preview-panel:#ffffff;
      --qmes-preview-line:#d7dee8;
      --qmes-preview-line2:#e5eaf0;
      --qmes-preview-text:#111827;
      --qmes-preview-muted:#64748b;
      --qmes-preview-blue:#2563eb;
      --qmes-preview-blue-soft:#eef6ff;
    }

    /* Header bar */
    #root>div>header{
      background:#fff!important;
      color:#111827!important;
      border-color:#d7dee8!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      box-shadow:none!important;
    }
    #root>div>header>div:first-child{
      min-height:68px!important;
      height:68px!important;
      padding:0 20px!important;
      background:#fff!important;
      border-color:#d7dee8!important;
    }
    #root>div>header img[alt="NAMO Chemical"]{
      filter:none!important;
      height:44px!important;
      max-width:270px!important;
      width:auto!important;
      object-fit:contain!important;
    }
    #root>div>header .qmes-header-clock,
    #root>div>header .qmes-header-clock span,
    #root>div>header .qmes-header-controls,
    #root>div>header .qmes-header-controls *{
      color:#334155!important;
    }
    #root>div>header .qmes-header-action{
      background:#fff!important;
      color:#111827!important;
      border:1px solid #cbd5e1!important;
      border-radius:8px!important;
      min-height:34px!important;
      padding:6px 10px!important;
      font-size:12px!important;
      font-weight:800!important;
      box-shadow:none!important;
    }
    #root>div>header button[aria-label*="NAMO Talk"]{
      background:#fff!important;
      color:#111827!important;
      border:1px solid #cbd5e1!important;
      border-radius:8px!important;
      box-shadow:none!important;
    }
    #root>div>header button[aria-label^="계정 설정"]{
      background:#fff!important;
      color:#111827!important;
    }
    #root>div>header button[aria-label^="계정 설정"]>div:first-of-type{
      background:#eef2f7!important;
      color:#111827!important;
    }
    #root>div>header button[aria-label^="계정 설정"] div,
    #root>div>header button[aria-label^="계정 설정"] span{
      color:#111827!important;
    }

    /* Top menu bar — exact preview palette */
    .qmes-top-menu-bar{
      height:46px!important;
      min-height:46px!important;
      background:#fff!important;
      border-top:1px solid #d7dee8!important;
      border-bottom:1px solid #d7dee8!important;
      box-shadow:none!important;
    }
    .qmes-top-menu{
      height:46px!important;
      min-height:46px!important;
      padding-left:10px!important;
      background:#fff!important;
      align-items:stretch!important;
      overflow-x:auto!important;
      overflow-y:hidden!important;
      flex-wrap:nowrap!important;
    }
    .qmes-top-menu-item{
      height:46px!important;
      min-height:46px!important;
      flex:0 0 auto!important;
    }
    .qmes-top-menu-button{
      height:46px!important;
      min-height:46px!important;
      padding:0 14px!important;
      border:0!important;
      border-bottom:3px solid transparent!important;
      border-radius:0!important;
      background:#fff!important;
      color:#111827!important;
      font-size:13px!important;
      font-weight:800!important;
      white-space:nowrap!important;
      box-shadow:none!important;
    }
    .qmes-top-menu-button span,
    .qmes-top-menu-button svg,
    .qmes-top-menu-button i,
    .qmes-top-menu-button b{
      color:currentColor!important;
    }
    .qmes-top-menu-button:hover,
    .qmes-top-menu-button:focus-visible{
      background:#f1f5f9!important;
      color:#111827!important;
      outline:none!important;
    }
    .qmes-top-menu-button.is-active,
    .qmes-top-menu-button[aria-current="page"]{
      background:#eef6ff!important;
      border-bottom-color:#2563eb!important;
      color:#174ea6!important;
    }
    .qmes-top-menu-button.is-active span,
    .qmes-top-menu-button.is-active svg{
      color:#174ea6!important;
    }

    /* Hidden/hover submenu and all-menu dropdown */
    #qmes-all-menu-dropdown,
    #qmes-user-dropdown,
    .qmes-submenu-row{
      background:#fff!important;
      color:#111827!important;
      border:1px solid #d7dee8!important;
      box-shadow:0 10px 28px rgba(15,23,42,.10)!important;
    }
    #qmes-all-menu-dropdown .qmes-hover-title,
    .qmes-submenu-title{
      background:#fff!important;
      color:#64748b!important;
      border-color:#e5eaf0!important;
      font-weight:900!important;
    }
    #qmes-all-menu-dropdown button,
    #qmes-user-dropdown button,
    .qmes-submenu-button{
      background:#fff!important;
      color:#334155!important;
      border-color:#e5eaf0!important;
      font-size:13px!important;
      font-weight:800!important;
    }
    #qmes-all-menu-dropdown button:hover,
    #qmes-all-menu-dropdown button:focus-visible,
    #qmes-user-dropdown button:hover,
    #qmes-user-dropdown button:focus-visible,
    .qmes-submenu-button:hover,
    .qmes-submenu-button:focus-visible{
      background:#f1f5f9!important;
      color:#111827!important;
      outline:none!important;
    }
    .qmes-submenu-button.is-active,
    #qmes-all-menu-dropdown button.is-active{
      background:#eaf3ff!important;
      color:#1554b6!important;
    }
    #qmes-user-dropdown .qmes-dropdown-logout{
      color:#b91c1c!important;
      border-top:1px solid #e5eaf0!important;
    }

    /* Collapsible left menu */
    #qmes-sync-sidebar{
      width:220px!important;
      background:#fff!important;
      color:#334155!important;
      border-right:1px solid #d7dee8!important;
      box-shadow:none!important;
      filter:none!important;
    }
    #qmes-sync-sidebar .qmes-side-search{
      background:#fff!important;
      border-bottom:1px solid #d7dee8!important;
      padding:10px!important;
    }
    #qmes-sync-sidebar .qmes-side-search-box{
      height:36px!important;
      border:1px solid #d8e0ea!important;
      border-radius:8px!important;
      background:#f8fafc!important;
      padding:0 8px 0 10px!important;
    }
    #qmes-sync-sidebar .qmes-side-search-input{
      background:#f8fafc!important;
      color:#334155!important;
      font-size:12px!important;
      font-weight:600!important;
    }
    #qmes-sync-sidebar .qmes-side-search-input::placeholder{
      color:#94a3b8!important;
    }
    #qmes-sync-sidebar .qmes-side-search-icon{
      color:#64748b!important;
      background:transparent!important;
    }
    #qmes-sync-sidebar .qmes-side-head,
    #qmes-sync-sidebar .qmes-side-head.is-group-active{
      background:#fff!important;
      border-bottom:1px solid #e5eaf0!important;
      min-height:44px!important;
      padding:8px 12px!important;
      margin:0 -10px 8px!important;
    }
    #qmes-sync-sidebar .qmes-side-head.is-group-active:before{
      display:none!important;
    }
    #qmes-sync-sidebar .qmes-side-title,
    #qmes-sync-sidebar .qmes-side-head.is-group-active .qmes-side-title{
      color:#94a3b8!important;
      font-size:10px!important;
      font-weight:950!important;
      letter-spacing:.8px!important;
      text-transform:none!important;
    }
    #qmes-sync-sidebar .qmes-side-close{
      color:#64748b!important;
      background:#fff!important;
      border:0!important;
    }
    #qmes-sync-sidebar .qmes-side-item{
      min-height:42px!important;
      margin:2px 0!important;
      padding:10px 9px!important;
      border:0!important;
      border-radius:8px!important;
      background:transparent!important;
      color:#334155!important;
      font-size:13px!important;
      font-weight:800!important;
      box-shadow:none!important;
    }
    #qmes-sync-sidebar .qmes-side-item:hover{
      background:#f1f5f9!important;
      color:#111827!important;
    }
    #qmes-sync-sidebar .qmes-side-item.is-active{
      background:#eaf3ff!important;
      color:#1554b6!important;
    }
    #qmes-sync-sidebar .qmes-side-item.is-active:before{
      display:none!important;
    }
    #qmes-sync-sidebar .qmes-side-empty{
      color:#94a3b8!important;
    }

    /* Hamburger matches preview controls */
    #qmes-sync-hamburger{
      width:32px!important;
      height:32px!important;
      border:1px solid #d8dee7!important;
      border-radius:7px!important;
      background:#fff!important;
      color:#263548!important;
      box-shadow:none!important;
    }
    #qmes-sync-hamburger:hover,
    #qmes-sync-hamburger:focus-visible,
    #qmes-sync-hamburger:active{
      background:#f8fafc!important;
      color:#111827!important;
      border-color:#cbd5e1!important;
    }

    /* Keep top bar readable while left menu is open */
    body.qmes-side-open .qmes-top-menu{
      background:#fff!important;
    }

    @media(max-width:900px){
      #root>div>header>div:first-child{height:60px!important;min-height:60px!important;padding:0 14px!important}
      #root>div>header img[alt="NAMO Chemical"]{height:36px!important;max-width:190px!important}
      #qmes-sync-sidebar{width:190px!important}
    }
  `;

  document.head.appendChild(style);

  function refresh(){
    document.documentElement.style.setProperty("color-scheme","light");
    document.body?.classList.add("qmes-preview-menu-theme");
  }
  refresh();
  window.addEventListener("load",refresh,{once:true});
  window.addEventListener("qmes:erp-runtime-loaded",refresh);
  window.addEventListener("qmes:mes-master-ready",refresh);
})();
