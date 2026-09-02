/* NAMO QMES reference main shell — 2026-09-02
 * Layout target: attached Douzone-style HTML main screen.
 * Safety: this script does nothing to the login screen and installs once after QMES shell mounts.
 * Current NAMO Chemical logo asset is preserved.
 */
(function(){
  'use strict';
  if(window.__QMES_REFERENCE_MAIN_SHELL_SAFE_20260902__) return;
  window.__QMES_REFERENCE_MAIN_SHELL_SAFE_20260902__=true;

  const STYLE_ID='qmes-reference-main-shell-20260902';
  document.getElementById('qmes-douzone-final-theme-20260902')?.remove();
  document.getElementById('qmes-namo-talk-header-contrast')?.remove();
  document.getElementById(STYLE_ID)?.remove();

  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    :root{
      --qmes-ref-sidebar:248px;
      --qmes-ref-header:64px;
      --qmes-ref-pagehead:72px;
      --qmes-ref-blue:#2f78b7;
      --qmes-ref-blue2:#2f76ad;
      --qmes-ref-blue-dark:#235f8e;
      --qmes-ref-bg:#edf2f6;
      --qmes-ref-panel:#fff;
      --qmes-ref-line:#cbd8e2;
      --qmes-ref-ink:#22384a;
      --qmes-ref-muted:#687c8d;
      --qmes-bg:#edf2f6!important;
      --qmes-surface:#fff!important;
      --qmes-soft:#f6f8fa!important;
      --qmes-line:#cbd8e2!important;
      --qmes-text:#22384a!important;
      --qmes-muted:#687c8d!important;
      --qmes-blue:#2f78b7!important;
      --qmes-green:#58a842!important;
      --qmes-orange:#eea32f!important;
      --qmes-red:#df5151!important;
    }
    *{box-sizing:border-box}
    body.qmes-reference-shell{margin:0!important;overflow-x:hidden!important;background:#edf2f6!important;color:#22384a!important;}

    /* one fixed top bar */
    body.qmes-reference-shell #root>div>header{
      position:fixed!important;inset:0 0 auto 0!important;height:64px!important;min-height:64px!important;z-index:12500!important;
      background:linear-gradient(180deg,#3d87bd 0%,#2d70a5 100%)!important;color:#fff!important;
      border:0!important;border-bottom:1px solid #235f8e!important;box-shadow:0 2px 6px rgba(30,73,105,.24)!important;backdrop-filter:none!important;
    }
    body.qmes-reference-shell #root>div>header>div:first-child{
      width:100%!important;height:64px!important;min-height:64px!important;padding:0 18px 0 0!important;display:flex!important;align-items:center!important;gap:12px!important;background:transparent!important;border:0!important;
    }
    body.qmes-reference-shell #root>div>header>div:first-child>button:first-child{
      flex:0 0 var(--qmes-ref-sidebar)!important;width:var(--qmes-ref-sidebar)!important;height:64px!important;min-height:64px!important;margin:0!important;padding:0 18px!important;
      justify-content:flex-start!important;border:0!important;border-right:1px solid #b9c9d5!important;border-radius:0!important;
      background:linear-gradient(180deg,#f8fafb 0%,#e5ebf0 100%)!important;box-shadow:none!important;
    }
    body.qmes-reference-shell #root>div>header>div:first-child>button:first-child img{
      display:block!important;width:auto!important;height:30px!important;max-width:205px!important;object-fit:contain!important;filter:none!important;opacity:1!important;
    }
    body.qmes-reference-shell .qmes-top-menu-bar,
    body.qmes-reference-shell .qmes-top-menu,
    body.qmes-reference-shell .qmes-submenu-row{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;overflow:hidden!important;border:0!important;}
    body.qmes-reference-shell #qmes-sync-sidebar,
    body.qmes-reference-shell #qmes-sync-hamburger{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}

    #qmes-ref-menu-toggle{
      flex:0 0 38px!important;width:38px!important;height:38px!important;display:grid!important;place-items:center!important;border:0!important;border-radius:6px!important;
      background:transparent!important;color:#fff!important;font-size:23px!important;line-height:1!important;cursor:pointer!important;
    }
    #qmes-ref-menu-toggle:hover{background:rgba(255,255,255,.14)!important;}

    #qmes-ref-global-search{position:relative!important;width:min(390px,36vw)!important;flex:0 1 390px!important;}
    #qmes-ref-global-search input{
      width:100%!important;height:36px!important;border:1px solid rgba(255,255,255,.42)!important;background:rgba(255,255,255,.94)!important;border-radius:7px!important;
      padding:0 36px 0 13px!important;color:#263d4f!important;-webkit-text-fill-color:#263d4f!important;outline:0!important;font-size:13px!important;font-weight:600!important;box-shadow:none!important;
    }
    #qmes-ref-global-search input::placeholder{color:#7c8e9d!important;-webkit-text-fill-color:#7c8e9d!important;}
    #qmes-ref-global-search input:focus{background:#fff!important;border-color:#d9edf9!important;box-shadow:0 0 0 2px rgba(255,255,255,.18)!important;}
    #qmes-ref-search-icon{position:absolute!important;right:11px!important;top:8px!important;color:#5f7e94!important;font-size:17px!important;line-height:20px!important;pointer-events:none!important;}

    #qmes-ref-date-chip{
      flex:0 0 auto!important;height:34px!important;display:flex!important;align-items:center!important;padding:0 11px!important;border:1px solid rgba(255,255,255,.38)!important;border-radius:6px!important;
      background:rgba(0,0,0,.08)!important;color:#fff!important;font-size:12px!important;font-weight:750!important;white-space:nowrap!important;
    }
    body.qmes-reference-shell .qmes-header-clock{display:none!important;}
    body.qmes-reference-shell #root>div>header button[aria-label^="NAMO Talk 열기"],
    body.qmes-reference-shell #root>div>header button[aria-label^="NAMO Talk 닫기"]{display:none!important;}
    body.qmes-reference-shell #root>div>header button[aria-label*="NAMO Talk 알림"]{
      width:38px!important;height:38px!important;display:grid!important;place-items:center!important;padding:0!important;border:0!important;background:transparent!important;color:#fff!important;border-radius:6px!important;
    }
    body.qmes-reference-shell #root>div>header button[aria-label*="NAMO Talk 알림"]:hover{background:rgba(255,255,255,.14)!important;}
    body.qmes-reference-shell #root>div>header button[aria-label*="NAMO Talk 알림"] svg{color:#fff!important;stroke:#fff!important;}
    body.qmes-reference-shell .qmes-header-controls{display:flex!important;align-items:center!important;gap:8px!important;color:#fff!important;}
    body.qmes-reference-shell .qmes-header-controls>button[aria-label^="계정 설정"]{
      display:flex!important;align-items:center!important;gap:9px!important;height:46px!important;padding:0 2px 0 14px!important;
      border:0!important;border-left:1px solid rgba(255,255,255,.30)!important;border-radius:0!important;background:transparent!important;color:#fff!important;box-shadow:none!important;
    }
    body.qmes-reference-shell .qmes-header-controls>button[aria-label^="계정 설정"]>div:first-of-type{
      width:34px!important;height:34px!important;border-radius:50%!important;background:#f4f8fb!important;color:#2f6f9f!important;-webkit-text-fill-color:#2f6f9f!important;
      border:1px solid rgba(255,255,255,.5)!important;font-size:12px!important;
    }
    body.qmes-reference-shell .qmes-header-controls>button[aria-label^="계정 설정"]>div:nth-of-type(2){color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:12px!important;font-weight:800!important;line-height:1.25!important;}
    body.qmes-reference-shell .qmes-header-controls>button[aria-label^="계정 설정"]>span{color:#d9e8f2!important;-webkit-text-fill-color:#d9e8f2!important;}
    body.qmes-reference-shell .qmes-header-action{display:none!important;}

    /* fixed left sidebar */
    #qmes-ref-sidebar{
      position:fixed!important;left:0!important;top:64px!important;bottom:0!important;width:var(--qmes-ref-sidebar)!important;z-index:12400!important;overflow-y:auto!important;overflow-x:hidden!important;
      background:linear-gradient(180deg,#f8fafb 0%,#edf2f6 100%)!important;color:#344d60!important;border-right:1px solid #bfcdd8!important;box-shadow:2px 0 5px rgba(51,82,103,.08)!important;
      transition:width .2s ease!important;
    }
    .qmes-ref-company{padding:16px 10px 13px!important;border-bottom:1px solid #cbd7e0!important;background:#eef4f8!important;}
    .qmes-ref-company-pill{height:42px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;background:#fff!important;border:1px solid #c9d8e3!important;border-radius:8px!important;padding:0 11px!important;font-size:12px!important;color:#2d4b61!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)!important;}
    .qmes-ref-company-pill b{font-size:11px!important;color:#4d9140!important;background:#eef7eb!important;border:1px solid #cde4c6!important;padding:3px 6px!important;border-radius:12px!important;white-space:nowrap!important;}
    .qmes-ref-group-label{font-size:10px!important;color:#2f6f9f!important;background:#dfeaf2!important;border-top:1px solid #c7d7e2!important;border-bottom:1px solid #c7d7e2!important;padding:8px 10px!important;letter-spacing:.7px!important;font-weight:900!important;white-space:nowrap!important;}
    .qmes-ref-menu-item{width:calc(100% - 14px)!important;margin:1px 7px!important;min-height:40px!important;display:flex!important;align-items:center!important;gap:11px!important;border:0!important;border-radius:2px!important;padding:9px 10px!important;background:transparent!important;color:#3d5264!important;-webkit-text-fill-color:#3d5264!important;text-align:left!important;font-size:13px!important;font-weight:700!important;cursor:pointer!important;}
    .qmes-ref-menu-item:hover{background:#e2edf5!important;color:#1d5681!important;-webkit-text-fill-color:#1d5681!important;}
    .qmes-ref-menu-item.is-active{background:linear-gradient(180deg,#3d8ac0,#2f76ad)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22)!important;}
    .qmes-ref-menu-icon{width:22px!important;height:22px!important;display:grid!important;place-items:center!important;flex:0 0 22px!important;background:#dfe9f0!important;color:#356f99!important;border:1px solid #c5d4df!important;border-radius:3px!important;font-size:10px!important;font-weight:900!important;}
    .qmes-ref-menu-item.is-active .qmes-ref-menu-icon{background:rgba(255,255,255,.18)!important;color:#fff!important;border-color:rgba(255,255,255,.35)!important;}
    .qmes-ref-menu-text{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}
    .qmes-ref-sidebar-foot{padding:14px 10px 20px!important;border-top:1px solid #d5dfe7!important;background:#f6f8fa!important;}
    .qmes-ref-util-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;margin-bottom:10px!important;}
    .qmes-ref-util{height:31px!important;border:1px solid #b7c8d4!important;border-radius:3px!important;background:linear-gradient(180deg,#fff 0%,#e8eef3 100%)!important;color:#365269!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important;}
    .qmes-ref-foot-note{font-size:9px!important;line-height:1.55!important;color:#708596!important;}.qmes-ref-foot-note b{color:#3c6684!important;}

    /* fixed page title bar */
    #qmes-ref-pagehead{
      position:fixed!important;left:var(--qmes-ref-sidebar)!important;right:0!important;top:64px!important;height:72px!important;z-index:12300!important;
      display:flex!important;align-items:center!important;padding:0 26px!important;background:linear-gradient(180deg,#fff 0%,#f4f7f9 100%)!important;
      border-bottom:1px solid #becdd8!important;box-shadow:0 1px 3px rgba(42,76,99,.05)!important;transition:left .2s ease!important;
    }
    .qmes-ref-page-breadcrumb{font-size:11px!important;color:#718696!important;margin-bottom:5px!important;}
    .qmes-ref-page-title{margin:0!important;font-size:20px!important;line-height:1.2!important;font-weight:900!important;letter-spacing:-.4px!important;color:#244f70!important;}
    .qmes-ref-page-actions{margin-left:auto!important;display:flex!important;align-items:center!important;gap:8px!important;}
    .qmes-ref-page-btn{height:36px!important;border:1px solid #b7c8d4!important;background:linear-gradient(180deg,#fff 0%,#e8eef3 100%)!important;color:#365269!important;border-radius:3px!important;padding:0 13px!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important;}
    .qmes-ref-page-btn:hover{border-color:#7fa8c4!important;background:linear-gradient(180deg,#f8fcff,#dcebf5)!important;color:#205e8c!important;}

    body.qmes-reference-shell #root>div>main{
      margin-left:var(--qmes-ref-sidebar)!important;width:calc(100% - var(--qmes-ref-sidebar))!important;min-height:100vh!important;
      padding:158px 26px 40px!important;background:#edf2f6!important;color:#22384a!important;transition:margin-left .2s ease,width .2s ease!important;box-sizing:border-box!important;
    }

    /* reference content styling */
    body.qmes-reference-shell #root main :is(.qmes-hybrid-kpi-card,.qmes-text-kpi-card,.qmes-iqc-kpi-card,.qmes-process-card,.qmes-panel,.qpp-card,.panel,.kpi,.mini-kpi,.filterbar),
    body.qmes-reference-shell #root main [class~="bg-slate-950"],body.qmes-reference-shell #root main [class~="bg-slate-900"],body.qmes-reference-shell #root main [class~="bg-slate-800"]{
      background:#fff!important;color:#22384a!important;border-color:#c7d5df!important;border-radius:4px!important;box-shadow:0 2px 7px rgba(47,91,124,.12)!important;background-image:none!important;
    }
    body.qmes-reference-shell #root main [class~="bg-slate-700"],body.qmes-reference-shell #root main [class~="bg-slate-800/70"],body.qmes-reference-shell #root main [class~="bg-slate-800/60"],body.qmes-reference-shell #root main [class~="bg-slate-800/50"],body.qmes-reference-shell #root main [class~="bg-slate-800/40"]{background:#f6f8fa!important;color:#344d60!important;background-image:none!important;}
    body.qmes-reference-shell #root main :is(h1,h2,h3,h4,h5,h6){color:#244f70!important;}
    body.qmes-reference-shell #root main :is(.text-slate-100,.text-slate-200,.text-slate-300){color:#22384a!important;}
    body.qmes-reference-shell #root main :is(.text-slate-400,.text-slate-500,.text-slate-600){color:#687c8d!important;}
    body.qmes-reference-shell #root main table{background:#fff!important;border-color:#cbd8e2!important;}
    body.qmes-reference-shell #root main table thead,body.qmes-reference-shell #root main table thead tr,body.qmes-reference-shell #root main table thead th{background:linear-gradient(180deg,#3d87bd 0%,#2e72a9 100%)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#225f8e!important;text-shadow:0 1px 0 rgba(0,0,0,.12)!important;}
    body.qmes-reference-shell #root main table tbody td{background:#fff!important;color:#2e4557!important;-webkit-text-fill-color:#2e4557!important;border-color:#dce5eb!important;}
    body.qmes-reference-shell #root main table tbody tr:nth-child(even) td{background:#f7fafc!important;}body.qmes-reference-shell #root main table tbody tr:hover td{background:#eaf4fb!important;}
    body.qmes-reference-shell #root main input:not([type="checkbox"]):not([type="radio"]),body.qmes-reference-shell #root main select,body.qmes-reference-shell #root main textarea,
    body.qmes-reference-shell [role="dialog"] input:not([type="checkbox"]):not([type="radio"]),body.qmes-reference-shell [role="dialog"] select,body.qmes-reference-shell [role="dialog"] textarea{
      background:#fff!important;color:#2e4557!important;-webkit-text-fill-color:#2e4557!important;border-color:#b9c9d5!important;border-radius:2px!important;box-shadow:none!important;
    }
    body.qmes-reference-shell #root main input:focus,body.qmes-reference-shell #root main select:focus,body.qmes-reference-shell #root main textarea:focus{border-color:#4d91c2!important;box-shadow:0 0 0 2px rgba(47,120,183,.12)!important;outline:0!important;}
    body.qmes-reference-shell #root main button[class*="bg-blue"],body.qmes-reference-shell #root main button[class*="bg-sky"],body.qmes-reference-shell #root main button[class*="bg-indigo"],body.qmes-reference-shell #root main .qmes-primary-button{
      background:linear-gradient(180deg,#4a93c7 0%,#2f78b7 100%)!important;border-color:#286b9e!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-radius:3px!important;
    }

    body.qmes-ref-collapsed{--qmes-ref-sidebar:76px;}
    body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-company-pill span,body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-company-pill b,body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-group-label,body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-menu-text,body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-sidebar-foot{display:none!important;}
    body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-company{height:58px!important;padding:12px 8px!important;}
    body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-company-pill{justify-content:center!important;padding:0!important;}
    body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-company-pill:before{content:'N';width:30px;height:30px;border-radius:7px;background:linear-gradient(145deg,#63a4cf,#2f78b7);color:#fff;display:grid;place-items:center;font-weight:900;font-size:15px;}
    body.qmes-ref-collapsed #qmes-ref-sidebar .qmes-ref-menu-item{justify-content:center!important;padding:9px!important;width:60px!important;margin:3px 8px!important;}
    body.qmes-ref-collapsed #root>div>header>div:first-child>button:first-child{flex-basis:76px!important;width:76px!important;padding:0!important;justify-content:center!important;}
    body.qmes-ref-collapsed #root>div>header>div:first-child>button:first-child img{display:none!important;}
    body.qmes-ref-collapsed #root>div>header>div:first-child>button:first-child:before{content:'N';width:34px;height:34px;border-radius:9px;background:linear-gradient(145deg,#63a4cf,#2f78b7);color:#fff;display:grid;place-items:center;font-weight:900;font-size:18px;box-shadow:0 2px 6px rgba(47,120,183,.28);}

    @media(max-width:980px){#qmes-ref-global-search{width:260px!important;flex-basis:260px!important}.qmes-header-controls>button[aria-label^="계정 설정"]>div:nth-of-type(2){display:none!important;}}
    @media(max-width:760px){
      body.qmes-reference-shell{--qmes-ref-sidebar:0px;}#qmes-ref-sidebar{transform:translateX(-248px)!important;width:248px!important;transition:transform .2s ease!important;}body.qmes-ref-mobile-open #qmes-ref-sidebar{transform:none!important;}
      body.qmes-reference-shell #root>div>header>div:first-child>button:first-child{display:none!important;}#qmes-ref-global-search{display:none!important;}#qmes-ref-pagehead{left:0!important;padding:0 14px!important;}
      body.qmes-reference-shell #root>div>main{margin-left:0!important;width:100%!important;padding-left:12px!important;padding-right:12px!important;}
    }
    @media print{#qmes-ref-sidebar,#qmes-ref-pagehead,#qmes-ref-menu-toggle,#qmes-ref-global-search,#qmes-ref-date-chip{display:none!important;}body.qmes-reference-shell #root>div>header{display:none!important;}body.qmes-reference-shell #root>div>main{margin:0!important;width:100%!important;padding:0!important;background:#fff!important;}}
  `;
  document.head.appendChild(style);

  const groups=[
    {label:'WORKSPACE',items:[{tab:'dash',label:'통합 대시보드',icon:'D'}]},
    {label:'ERP',items:[
      {tab:'erpSales',label:'수주·영업관리',icon:'S'},
      {tab:'erpPlan',label:'생산계획·MRP',icon:'P'},
      {tab:'erpPurchase',label:'구매·발주관리',icon:'B'},
      {tab:'inv',label:'재고·물류관리',icon:'I',section:'overview'},
      {tab:'partners',label:'거래처 관리',icon:'C'},
      {tab:'erpShipping',label:'출하·납품관리',icon:'O'}
    ]},
    {label:'MES · QMS',items:[
      {tab:'prod',label:'생산 진행',icon:'M'},{tab:'woIssue',label:'작업지시서',icon:'W'},{tab:'prodProcess',label:'생산공정 관리',icon:'R'},
      {tab:'iqc',label:'수입검사 (IQC)',icon:'Q'},{tab:'pqc',label:'공정검사 (PQC)',icon:'P'},{tab:'oqc',label:'출하검사 (OQC)',icon:'O'},
      {tab:'trace',label:'LOT 통합추적',icon:'L'},{tab:'coa',label:'출하성적서',icon:'C'},{tab:'pop',label:'현장 입력 (iPad)',icon:'T'}
    ]},
    {label:'SYSTEM',items:[
      {tab:'eq',label:'설비관리',icon:'E'},{tab:'spc',label:'SPC (Cpk)',icon:'S'},{tab:'lock',label:'품질 인터락',icon:'Q'},
      {tab:'ncr',label:'부적합 (8D)',icon:'N'},{tab:'cc',label:'고객불만 (GQMS)',icon:'G'},{tab:'4m',label:'4M 변경관리',icon:'4'},
      {tab:'members',label:'권한·시스템관리',icon:'A',adminOnly:true}
    ]}
  ];

  const pageMeta={
    dash:['통합 경영 대시보드','홈 〉 통합 대시보드'],erpSales:['수주·영업관리','ERP 〉 수주·영업관리'],erpPlan:['생산계획·MRP','ERP 〉 생산계획 · MRP'],
    erpPurchase:['구매·발주관리','ERP 〉 구매관리 〉 발주현황'],inv:['재고·물류 현황','ERP 〉 재고·물류관리'],partners:['거래처 관리','ERP 〉 거래처 관리'],
    erpShipping:['출하·납품관리','ERP · MES 〉 출하·납품관리'],prod:['생산진행 현황','MES 〉 생산관리 〉 생산진행'],woIssue:['작업지시서','MES 〉 생산관리 〉 작업지시서'],
    prodProcess:['생산공정 관리','MES 〉 생산관리 〉 생산공정'],iqc:['수입검사 등록현황','MES · QMS 〉 품질관리 〉 수입검사'],pqc:['공정검사 현황','MES · QMS 〉 품질관리 〉 공정검사'],
    oqc:['출하검사 현황','MES · QMS 〉 품질관리 〉 출하검사'],trace:['LOT 통합추적','MES · QMS 〉 LOT 추적'],coa:['출하성적서','MES · QMS 〉 품질관리 〉 출하성적서'],
    pop:['현장 입력','MES 〉 현장 입력 (iPad)'],eq:['설비관리','SYSTEM 〉 설비관리'],spc:['SPC (Cpk)','QMS 〉 통계적 공정관리'],lock:['품질 인터락','QMS 〉 품질 인터락'],
    ncr:['부적합 관리','QMS 〉 부적합 (8D)'],cc:['고객불만 관리','QMS 〉 고객불만 (GQMS)'],'4m':['4M 변경관리','QMS 〉 4M 변경관리'],members:['권한·시스템관리','SYSTEM 〉 권한 · 시스템관리']
  };

  let activeTab='dash';
  const sessionTab=()=>{try{return sessionStorage.getItem('qmes_current_tab')||'dash';}catch(_){return'dash';}};

  function updateActive(tab){
    activeTab=tab||sessionTab();
    document.querySelectorAll('#qmes-ref-sidebar [data-qmes-ref-tab]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.qmesRefTab===activeTab));
    const meta=pageMeta[activeTab]||['QMES','홈 〉 QMES'];
    const head=document.getElementById('qmes-ref-pagehead');
    if(head){
      const title=head.querySelector('.qmes-ref-page-title');
      const crumb=head.querySelector('.qmes-ref-page-breadcrumb');
      if(title&&title.textContent!==meta[0]) title.textContent=meta[0];
      if(crumb&&crumb.textContent!==meta[1]) crumb.textContent=meta[1];
    }
  }

  function go(item){
    if(!item)return;
    if(item.section){try{sessionStorage.setItem('qmes_inventory_section',item.section);}catch(_){ }window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:item.section}}));}
    updateActive(item.tab);
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:item.tab}}));
  }

  function buildSidebar(){
    if(document.getElementById('qmes-ref-sidebar')) return;
    const side=document.createElement('aside');side.id='qmes-ref-sidebar';
    const user=window.__QMES_CURRENT_USER__||{};
    const menuHtml=groups.map(group=>{
      const items=group.items.filter(item=>!item.adminOnly||user.role==='admin');if(!items.length)return'';
      return `<div class="qmes-ref-group-label">${group.label}</div>${items.map(item=>`<button type="button" class="qmes-ref-menu-item" data-qmes-ref-tab="${item.tab}"${item.section?` data-qmes-ref-section="${item.section}"`:''}><span class="qmes-ref-menu-icon">${item.icon}</span><span class="qmes-ref-menu-text">${item.label}</span></button>`).join('')}`;
    }).join('');
    side.innerHTML=`<div class="qmes-ref-company"><div class="qmes-ref-company-pill"><span>㈜나모케미칼</span><b>정상운영</b></div></div>${menuHtml}<div class="qmes-ref-sidebar-foot"><div class="qmes-ref-util-row"><button type="button" class="qmes-ref-util" data-qmes-ref-util="backup">백업</button><button type="button" class="qmes-ref-util" data-qmes-ref-util="restore">복원</button></div><div class="qmes-ref-foot-note"><b>나모케미칼 QMES</b><br>ERP · MES · QMS 통합 운영 시스템</div></div>`;
    side.addEventListener('click',event=>{
      const button=event.target.closest('[data-qmes-ref-tab]');
      if(button){go({tab:button.dataset.qmesRefTab,section:button.dataset.qmesRefSection||''});if(innerWidth<=760)document.body.classList.remove('qmes-ref-mobile-open');return;}
      const util=event.target.closest('[data-qmes-ref-util]');if(!util)return;
      const wanted=util.dataset.qmesRefUtil==='backup'?'백업':'복원';
      Array.from(document.querySelectorAll('.qmes-header-action')).find(btn=>String(btn.textContent||'').trim()===wanted)?.click();
    });
    document.body.appendChild(side);
  }

  function buildHeaderTools(header){
    const row=header?.firstElementChild;if(!row)return;
    let menu=document.getElementById('qmes-ref-menu-toggle');
    if(!menu){menu=document.createElement('button');menu.id='qmes-ref-menu-toggle';menu.type='button';menu.setAttribute('aria-label','메뉴 접기');menu.textContent='☰';menu.addEventListener('click',()=>{if(innerWidth<=760)document.body.classList.toggle('qmes-ref-mobile-open');else document.body.classList.toggle('qmes-ref-collapsed');});row.children[0]?.after(menu);}
    if(!document.getElementById('qmes-ref-global-search')){
      const search=document.createElement('div');search.id='qmes-ref-global-search';search.innerHTML='<input type="search" aria-label="통합검색" placeholder="메뉴, 발주번호, LOT, 거래처 통합검색"><span id="qmes-ref-search-icon">⌕</span>';menu.after(search);
      const input=search.querySelector('input');input.addEventListener('input',()=>{const q=String(input.value||'').trim().toLowerCase();document.querySelectorAll('#qmes-ref-sidebar .qmes-ref-menu-item').forEach(btn=>{btn.style.display=!q||String(btn.textContent||'').toLowerCase().includes(q)?'flex':'none';});});
      input.addEventListener('keydown',event=>{if(event.key==='Enter')Array.from(document.querySelectorAll('#qmes-ref-sidebar .qmes-ref-menu-item')).find(btn=>btn.style.display!=='none')?.click();});
    }
    if(!document.getElementById('qmes-ref-date-chip')){
      const chip=document.createElement('div');chip.id='qmes-ref-date-chip';const now=new Date();chip.textContent=`기준일 ${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
      const bell=row.querySelector('button[aria-label*="NAMO Talk 알림"]');if(bell)row.insertBefore(chip,bell);else row.appendChild(chip);
    }
  }

  function buildPageHead(){
    if(document.getElementById('qmes-ref-pagehead'))return;
    const head=document.createElement('section');head.id='qmes-ref-pagehead';
    head.innerHTML='<div><div class="qmes-ref-page-breadcrumb"></div><h1 class="qmes-ref-page-title"></h1></div><div class="qmes-ref-page-actions"><button type="button" class="qmes-ref-page-btn" data-qmes-ref-refresh>↻ 새로고침</button><button type="button" class="qmes-ref-page-btn" data-qmes-ref-print>▣ 화면 인쇄</button></div>';
    head.querySelector('[data-qmes-ref-refresh]').addEventListener('click',()=>window.location.reload());head.querySelector('[data-qmes-ref-print]').addEventListener('click',()=>window.print());document.body.appendChild(head);
  }

  function installOnce(){
    if(document.body.classList.contains('qmes-reference-shell'))return true;
    const app=document.querySelector('#root>div');const header=app?.querySelector(':scope>header');const main=app?.querySelector(':scope>main');
    if(!header||!main)return false;
    document.body.classList.remove('qmes-side-open');
    document.body.classList.add('qmes-reference-shell');
    buildSidebar();buildHeaderTools(header);buildPageHead();updateActive(sessionTab());
    /* Old sidebar may be created by a later legacy script. CSS hides it; remove the layout class a few finite times only. */
    [0,250,800,1800].forEach(delay=>setTimeout(()=>document.body.classList.remove('qmes-side-open'),delay));
    return true;
  }

  let observer=null;
  const tryInstall=()=>{
    if(installOnce()&&observer){observer.disconnect();observer=null;}
  };

  /* Observe only until the authenticated QMES shell first appears, then disconnect permanently. */
  if(!installOnce()){
    observer=new MutationObserver(tryInstall);
    observer.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
  }
  document.addEventListener('DOMContentLoaded',tryInstall,{once:true});
  window.addEventListener('load',tryInstall,{once:true});
  window.addEventListener('qmes:navigate-tab',event=>{const tab=String(event?.detail?.tab||'').trim();if(tab)setTimeout(()=>updateActive(tab),0);});
})();
