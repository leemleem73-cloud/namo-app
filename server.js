'use strict';

// NAMO Chemical ERP/MES enterprise dashboard server entry - 2026-09-03.
// Original production server is preserved verbatim in server-legacy-20260903.js.
const fs = require('fs');
const path = require('path');
const express = require('express');

require('./attendance-core-safe.js');
require('./attendance-correction-safe.js');
require('./attendance-leave-cancel-safe.js');
require('./attendance-review-safe.js');
require('./attendance-mail-direct-safe.js');
require('./attendance-admin-overview-safe.js');
require('./attendance-qmes-redesign-preload.js');
require('./mobile-hard-entry-preload.js');
require('./mobile-static-preload.js');
require('./member-email-sync-preload.js');
require('./access-permissions-safe.js');

const publicIndex = path.resolve(__dirname, 'public', 'index.html');
const publicRouter = path.resolve(__dirname, 'public', 'js', 'router.jsx');
const publicShellMenu = path.resolve(__dirname, 'public', 'js', 'qmes-collapsible-side-menu-20260921-v2.js');
const legacyDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard.jsx');
const enterpriseDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
const originalReadFile = fs.readFile.bind(fs);

// Attendance app only: replace the old robot-like clock-in/out artwork at response time.
// No QMES desktop, purchasing, production, quality, inventory, approval, or other assets are changed.
const NAMO_ATTENDANCE_CLOCKIN_ART_20260917 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 150" role="img" aria-labelledby="title desc">
<title id="title">출근하는 직원</title><desc id="desc">나모케미칼 모바일 출퇴근 앱 전용 오리지널 직원 일러스트</desc>
<defs><linearGradient id="glassIn" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#eaf7ff"/><stop offset="1" stop-color="#9ecdf3" stop-opacity=".55"/></linearGradient><linearGradient id="shirtIn" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fcff"/><stop offset="1" stop-color="#cfe9ff"/></linearGradient></defs>
<g opacity=".9"><rect x="125" y="18" width="56" height="120" rx="5" fill="#0e5fae" opacity=".22"/><rect x="132" y="26" width="40" height="104" rx="3" fill="url(#glassIn)"/><path d="M143 31v94m17-94v94" stroke="#fff" stroke-width="4" opacity=".7"/><rect x="158" y="77" width="18" height="31" rx="4" fill="#173b62"/><circle cx="167" cy="92" r="6" fill="#35a6ff"/><circle cx="167" cy="92" r="3" fill="#d8f3ff"/></g>
<g transform="translate(67 6)"><ellipse cx="42" cy="41" rx="16" ry="17" fill="#f5c7a4"/><path d="M26 39c1-13 10-20 20-20 11 0 19 8 18 20-6-5-11-7-17-7-7 0-13 3-21 7z" fill="#172d4d"/><path d="M29 36c3-10 10-15 19-15 8 0 14 4 18 11-7-3-14-4-20-2-6 1-11 3-17 6z" fill="#213a62"/><circle cx="37" cy="42" r="1.5" fill="#25364b"/><circle cx="50" cy="42" r="1.5" fill="#25364b"/><path d="M39 49c4 3 8 3 12 0" fill="none" stroke="#b95d4b" stroke-width="1.8" stroke-linecap="round"/><path d="M38 56h10l2 9H36z" fill="#f0bc98"/><path d="M26 63c6-6 12-8 18-8 8 0 16 3 22 9l-4 40H26z" fill="url(#shirtIn)"/><path d="M31 62l10 11 10-11" fill="none" stroke="#7fb4e6" stroke-width="2"/><path d="M42 66v28" stroke="#1d4f83" stroke-width="2"/><rect x="39" y="78" width="9" height="13" rx="1.5" fill="#fff" stroke="#8fb1d0"/><path d="M28 68C17 72 12 80 8 91l8 4c4-8 8-13 15-16" fill="#f5c7a4"/><path d="M62 67c11 5 18 11 27 18l-5 7c-9-5-16-9-25-12" fill="#f5c7a4"/><path d="M87 84l12-3 2 8-13 3z" fill="#fff" stroke="#b9d2e8"/><path d="M26 101l-7 40h14l11-31 11 31h14l-8-40z" fill="#233c62"/><path d="M28 70c-7 10-8 22-5 39l-9 2c-4-20-1-36 8-47z" fill="#263b5a" opacity=".9"/><path d="M18 72c-7 8-8 23-4 38l-8 2C1 94 3 78 13 66z" fill="#1d2e49" opacity=".9"/></g>
</svg>`;

const NAMO_ATTENDANCE_CLOCKOUT_ART_20260917 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 150" role="img" aria-labelledby="title desc">
<title id="title">퇴근하는 직원</title><desc id="desc">나모케미칼 모바일 출퇴근 앱 전용 오리지널 직원 일러스트</desc>
<defs><linearGradient id="glassOut" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e6f4fc"/><stop offset="1" stop-color="#6fa4cb" stop-opacity=".42"/></linearGradient><linearGradient id="jacketOut" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#385f83"/><stop offset="1" stop-color="#163b5f"/></linearGradient></defs>
<g opacity=".86"><rect x="126" y="17" width="55" height="121" rx="5" fill="#173f64" opacity=".3"/><rect x="133" y="26" width="39" height="104" rx="3" fill="url(#glassOut)"/><path d="M144 31v94m17-94v94" stroke="#eff9ff" stroke-width="4" opacity=".6"/><rect x="159" y="77" width="17" height="31" rx="4" fill="#203c57"/><circle cx="167.5" cy="92" r="5.5" fill="#7dc3ee" opacity=".85"/></g>
<g transform="translate(66 7)"><ellipse cx="42" cy="40" rx="16" ry="17" fill="#f1c39f"/><path d="M26 38c2-13 10-20 20-20 11 0 19 8 18 20-6-5-12-7-18-7-7 0-13 3-20 7z" fill="#162b44"/><path d="M31 31c5-8 12-11 20-9 7 1 12 6 15 12-8-4-15-5-22-3-4 1-8 2-13 4z" fill="#243b55"/><circle cx="37" cy="41" r="1.5" fill="#263649"/><circle cx="50" cy="41" r="1.5" fill="#263649"/><path d="M39 48c4 2 8 2 12-1" fill="none" stroke="#ad5b4e" stroke-width="1.8" stroke-linecap="round"/><path d="M38 55h10l2 9H36z" fill="#edb995"/><path d="M25 64c6-6 13-9 19-9 8 0 16 3 22 10l-4 40H27z" fill="url(#jacketOut)"/><path d="M39 62l5 12 6-12" fill="#e8f2fa"/><path d="M44 64v26" stroke="#b8d3e7" stroke-width="1.8"/><rect x="40" y="78" width="9" height="13" rx="1.5" fill="#edf5fb" stroke="#87a8c1"/><path d="M28 70c-11 4-17 11-22 21l8 5c5-8 10-12 17-16" fill="#f1c39f"/><path d="M62 68c10 5 17 10 26 17l-5 7c-8-4-16-8-24-12" fill="#f1c39f"/><path d="M84 84l13-3 2 8-14 3z" fill="#eef4f7" stroke="#a9bccb"/><path d="M28 102l-5 39h14l8-30 12 30h14l-10-39z" fill="#132c45"/><path d="M63 79l15 4-2 24-17-3z" fill="#6c4333"/><path d="M65 80c1-7 4-11 8-11 5 0 8 5 8 12" fill="none" stroke="#b78667" stroke-width="2.5"/></g>
</svg>`;

if (!express.__NAMO_ATTENDANCE_HUMAN_ART_20260917__) {
  express.__NAMO_ATTENDANCE_HUMAN_ART_20260917__ = true;
  const attendanceBaseStatic = express.static;
  express.static = function namoAttendanceHumanArtworkStatic(root, options) {
    const staticMiddleware = attendanceBaseStatic(root, options);
    return function namoAttendanceHumanArtworkMiddleware(req, res, next) {
      const pathname = String(req.path || '').toLowerCase();
      if (pathname === '/attendance-enterprise-clockin-20260909.svg' || pathname === '/attendance-enterprise-clockout-20260909.svg') {
        const svg = pathname.includes('clockout') ? NAMO_ATTENDANCE_CLOCKOUT_ART_20260917 : NAMO_ATTENDANCE_CLOCKIN_ART_20260917;
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.send(svg);
      }
      if (pathname === '/attendance.html') {
        const filePath = path.join(root, 'attendance-v5.html');
        return originalReadFile(filePath, 'utf8', (error, source) => {
          if (error) return staticMiddleware(req, res, next);
          const humanArtStyle = `<style id="namo-attendance-human-art-20260917">html[data-namo-attendance-full-ui="v4"] .clock-btn.in:after{background-image:url('/attendance-enterprise-clockin-20260909.svg?v=20260917-human1')!important}html[data-namo-attendance-full-ui="v4"] .clock-btn.out:after{background-image:url('/attendance-enterprise-clockout-20260909.svg?v=20260917-human1')!important}</style>`;
          let html = String(source);
          if (!html.includes('namo-attendance-human-art-20260917')) html = html.replace('</head>', `${humanArtStyle}\n</head>`);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.send(html);
        });
      }
      return staticMiddleware(req, res, next);
    };
  };
}

const retiredWorkorderUi = path.resolve(__dirname, 'public', 'js', 'workorder-ui-refinement.js');
try {
  fs.writeFileSync(retiredWorkorderUi, `/* Retired legacy workorder UI refinement — startup enforced. */
(function(){
  "use strict";
  window.__QMES_WORKORDER_UI_REFINEMENT__ = true;
})();
`, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to retire legacy workorder UI refinement:', error);
  process.exit(1);
}

const SHELL_BUILD = '20260910-account-stable4';
const ACCOUNT_ASSET_BUILD = '20260910-account-stable4';
const MEMBERS_ASSET_BUILD = '20260910-access-permissions1';
const MEMBER_FALLBACK_BUILD = '20260904-pc-edit-hard5';
const MEMBER_LINK_BUILD = '20260904-native2';
const DASHBOARD_ASSET_BUILD = '20260904-enterprise-only12';

const QMES_SCROLL_FIX_STYLE = `<style id="qmes-scroll-fix-20260910">
html{min-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important;}
html body{height:auto!important;min-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important;}
html body #root,html body #root>div{height:auto!important;min-height:100vh!important;overflow:visible!important;}
html body #root>div>main{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;margin-left:var(--qmes-shell-sidebar-width,236px)!important;margin-top:58px!important;width:calc(100% - var(--qmes-shell-sidebar-width,236px))!important;height:auto!important;min-height:calc(100vh - 58px)!important;max-height:none!important;overflow:visible!important;box-sizing:border-box!important;}
html body.qmes-erp-menu-closed #root>div>main{margin-left:0!important;width:100%!important;}
html body #qmes-erp-sidebar{overflow:hidden!important;}
html body #qmes-erp-sidebar .qmes-erp-nav{flex:0 0 auto!important;height:calc(100vh - 154px)!important;min-height:0!important;max-height:calc(100vh - 154px)!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:thin!important;-ms-overflow-style:auto!important;overscroll-behavior:contain!important;touch-action:pan-y!important;}
html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{display:block!important;width:8px!important;height:8px!important;}
html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-thumb{background:#aebfcb!important;border-radius:8px!important;}
html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-track{background:#edf2f6!important;}
</style>`;

const QMES_SCROLL_FIX_SCRIPT = `<script id="qmes-scroll-wheel-fix-20260910">
(function(){
  "use strict";
  if(window.__QMES_NATIVE_WHEEL_SCOPE3__)return;
  window.__QMES_NATIVE_WHEEL_SCOPE3__=true;

  function deltaPixels(event){
    let delta=Number(event.deltaY)||0;
    if(event.deltaMode===1)delta*=32;
    else if(event.deltaMode===2)delta*=window.innerHeight||800;
    return delta;
  }

  function targets(){
    const sidebar=document.getElementById("qmes-erp-sidebar");
    const nav=sidebar&&sidebar.querySelector(".qmes-erp-nav");
    const main=document.querySelector("#root>div>main");
    const header=document.getElementById("qmes-erp-header");
    return {sidebar,nav,main,header};
  }

  function enforce(){
    const {nav,main}=targets();
    document.documentElement.style.setProperty("overflow-y","auto","important");
    document.documentElement.style.setProperty("overflow-x","hidden","important");
    document.body.style.setProperty("height","auto","important");
    document.body.style.setProperty("min-height","100%","important");
    document.body.style.setProperty("overflow-y","auto","important");
    document.body.style.setProperty("overflow-x","hidden","important");
    const root=document.getElementById("root");
    if(root){root.style.setProperty("height","auto","important");root.style.setProperty("min-height","100vh","important");root.style.setProperty("overflow","visible","important");}
    const shell=root&&root.firstElementChild;
    if(shell){shell.style.setProperty("height","auto","important");shell.style.setProperty("min-height","100vh","important");shell.style.setProperty("overflow","visible","important");}
    if(main){
      main.style.setProperty("position","relative","important");
      main.style.removeProperty("top");main.style.removeProperty("bottom");main.style.removeProperty("left");main.style.removeProperty("right");
      main.style.setProperty("margin-top","58px","important");
      const closed=document.body.classList.contains("qmes-erp-menu-closed");
      const sidebar=document.getElementById("qmes-erp-sidebar");
      const measured=sidebar&&!closed?Math.round(sidebar.getBoundingClientRect().width):0;
      const cssWidth=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--qmes-shell-sidebar-width"))||236;
      const sideWidth=closed?0:(measured>0?measured:cssWidth);
      main.style.setProperty("margin-left",sideWidth+"px","important");
      main.style.setProperty("width",closed?"100%":"calc(100% - "+sideWidth+"px)","important");
      main.style.setProperty("height","auto","important");
      main.style.setProperty("min-height","calc(100vh - 58px)","important");
      main.style.setProperty("max-height","none","important");
      main.style.setProperty("overflow","visible","important");
    }
    if(nav){
      nav.style.setProperty("height","calc(100vh - 154px)","important");
      nav.style.setProperty("max-height","calc(100vh - 154px)","important");
      nav.style.setProperty("min-height","0","important");
      nav.style.setProperty("overflow-y","auto","important");
      nav.style.setProperty("overflow-x","hidden","important");
    }
  }

  function scrollElement(element,delta){
    if(!element)return false;
    const max=Math.max(0,element.scrollHeight-element.clientHeight);
    if(max<=0)return false;
    const before=element.scrollTop;
    const next=Math.max(0,Math.min(max,before+delta));
    if(next===before)return false;
    element.scrollTop=next;
    return true;
  }

  function nearestScrollable(start,boundary,delta){
    let node=start instanceof Element?start:null;
    while(node&&node!==boundary&&node!==document.body){
      const style=getComputedStyle(node);
      if(/auto|scroll/.test(style.overflowY)&&scrollElement(node,delta))return true;
      node=node.parentElement;
    }
    return false;
  }

  window.addEventListener("wheel",function(event){
    const delta=deltaPixels(event);
    if(!delta)return;
    const {sidebar,nav,main,header}=targets();
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    if(sidebar&&sidebar.contains(target)){
      if(scrollElement(nav,delta)){
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if(header&&header.contains(target))return;

    if(main&&(main.contains(target)||target===document.body||target===document.documentElement)){
      if(nearestScrollable(target,main,delta)){
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const root=document.scrollingElement||document.documentElement;
      const max=Math.max(0,root.scrollHeight-root.clientHeight);
      if(max>0){
        const before=root.scrollTop;
        const next=Math.max(0,Math.min(max,before+delta));
        if(next!==before){
          root.scrollTop=next;
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }
  },{capture:true,passive:false});

  const boot=function(){enforce();requestAnimationFrame(enforce);setTimeout(enforce,250);setTimeout(enforce,1000);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.addEventListener("resize",enforce);
  window.addEventListener("qmes:navigate-tab",function(){requestAnimationFrame(enforce);setTimeout(enforce,80);});
})();
</script>`;

if (!fs.existsSync(enterpriseDashboard)) {
  console.error('[QMES] Enterprise dashboard module is missing:', enterpriseDashboard);
  process.exit(1);
}

try {
  const source = fs.readFileSync(publicIndex, 'utf8');
  let normalized = source
    .replace(/qmes-shell-layer-base-20260827\.css\?v=[^"']+/g, `qmes-shell-layer-base-20260827.css?v=${SHELL_BUILD}`)
    .replace(/router\.jsx\?v=[^"']+/g, `router.jsx?v=${SHELL_BUILD}`)
    .replace(/app\.jsx\?v=[^"']+/g, `app.jsx?v=${SHELL_BUILD}`)
    .replace(/dashboard\.jsx\?v=[^"']+/g, `dashboard.jsx?v=${DASHBOARD_ASSET_BUILD}`)
    .replace(/member-management-patch\.jsx\?v=[^"']+/g, `member-management-patch.jsx?v=${MEMBERS_ASSET_BUILD}`)
    .replace(/admin\/members-bootstrap\.jsx\?v=[^"']+/g, `admin/members-bootstrap.jsx?v=${MEMBERS_ASSET_BUILD}`)
    .replace(/admin\/members\.jsx\?v=[^"']+/g, `admin/members.jsx?v=${MEMBERS_ASSET_BUILD}`)
    .replace(/qmes-collapsible-side-menu\.js\?v=[^"']+/g, `qmes-collapsible-side-menu-20260921-v2.js?v=${SHELL_BUILD}`)
    .replace(/qmes-enterprise-header-polish-20260910\.js\?v=[^"']+/g, `qmes-enterprise-header-polish-20260910.js?v=${ACCOUNT_ASSET_BUILD}`)
    .replace(/qmes-ui-recovery-20260910\.js\?v=[^"']+/g, `qmes-ui-recovery-20260910.js?v=${ACCOUNT_ASSET_BUILD}`);

  normalized = normalized.replace(/\n\s*<style id="qmes-scroll-fix-20260910">[\s\S]*?<\/style>/g, '');
  normalized = normalized.replace(/\n\s*<script id="qmes-scroll-wheel-fix-20260910">[\s\S]*?<\/script>/g, '');
  normalized = normalized.replace('</head>', `  ${QMES_SCROLL_FIX_STYLE}\n  ${QMES_SCROLL_FIX_SCRIPT}\n</head>`);

  normalized = normalized.replace(/\n\s*<script type="text\/babel" data-presets="react" src="\.\/js\/qmes-members-edit-fix-20260904\.jsx\?v=[^"']+"><\/script>/g, '');
  normalized = normalized.replace(
    /(<script type="text\/babel" data-presets="react" src="\.\/js\/admin\/members\.jsx\?v=[^"']+"><\/script>)/,
    `$1\n  <script type="text/babel" data-presets="react" src="./js/qmes-members-edit-fix-20260904.jsx?v=${MEMBERS_ASSET_BUILD}"></script>`
  );

  normalized = normalized.replace(/\n\s*<script src="\.\/js\/qmes-members-pc-edit-fallback-20260904\.js\?v=[^"']+"><\/script>/g, '');
  normalized = normalized.replace(
    /(<script type="text\/babel" data-presets="react" src="\.\/js\/qmes-members-edit-fix-20260904\.jsx\?v=[^"']+"><\/script>)/,
    `$1\n  <script src="./js/qmes-members-pc-edit-fallback-20260904.js?v=${MEMBER_FALLBACK_BUILD}"></script>`
  );

  normalized = normalized.replace(/\n\s*<script src="\.\/js\/qmes-members-pc-edit-link-20260904\.js\?v=[^"']+"><\/script>/g, '');
  normalized = normalized.replace(
    /(<script src="\.\/js\/qmes-members-pc-edit-fallback-20260904\.js\?v=[^"']+"><\/script>)/,
    `$1\n  <script src="./js/qmes-members-pc-edit-link-20260904.js?v=${MEMBER_LINK_BUILD}"></script>`
  );

  if (normalized !== source) fs.writeFileSync(publicIndex, normalized, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to normalize shell asset URLs:', error);
  process.exit(1);
}

try {
  const source = fs.readFileSync(publicRouter, 'utf8');
  const oldMobileButton = '<button type="button" onClick={()=>window.location.assign("/mobile.html?v=20260903-mobile-button1")} className="relative flex items-center gap-2 px-3.5 py-2 rounded border text-sm font-bold" style={{background:"#fff",borderColor:"#bfd0dc",color:"#29485f"}} aria-label="모바일용 화면 열기"><span aria-hidden="true">📱</span><span>모바일용</span></button>';
  const mobileButton = '<button type="button" onClick={()=>window.location.assign("/mobile.html?v=20260903-mobile-dedicated1")} className="relative flex items-center gap-2 px-3.5 py-2 rounded border text-sm font-bold" style={{background:"#fff",borderColor:"#bfd0dc",color:"#29485f"}} aria-label="모바일 전용 화면 열기"><span aria-hidden="true">📱</span><span>모바일 전용</span></button>';
  const previousMobileButton = '<button type="button" onClick={()=>window.location.assign("/mobile.html?v=20260903-mobile-button2")} className="relative flex items-center gap-2 px-3.5 py-2 rounded border text-sm font-bold" style={{background:"#fff",borderColor:"#bfd0dc",color:"#29485f"}} aria-label="모바일 전용 화면 열기"><span aria-hidden="true">📱</span><span>모바일 전용</span></button>';
  const talkButton = '<button type="button" onClick={()=>setTalkOpen(value=>!value)} className="relative flex items-center gap-2 px-3.5 py-2 rounded border text-sm font-bold" style={{background:talkOpen?"#e7f2fa":"#fff",borderColor:talkOpen?"#8cb8d4":"#bfd0dc",color:"#29485f"}} aria-label={talkOpen?"NAMO Talk 닫기":"NAMO Talk 열기"} aria-expanded={talkOpen}><span aria-hidden="true">💬</span><span>NAMO Talk</span></button>';
  let patched = source.replace(oldMobileButton, mobileButton).replace(previousMobileButton, mobileButton);
  if (!patched.includes(mobileButton)) patched = patched.replace(talkButton, `${mobileButton}\n          ${talkButton}`);
  if (patched !== source) fs.writeFileSync(publicRouter, patched, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to install mobile header shortcut:', error);
  process.exit(1);
}

try {
  const source = fs.readFileSync(publicShellMenu, 'utf8');
  const oldLabel = 'aria-label="모바일 화면" title="모바일 화면">${mobileSvg}<span>모바일</span>';
  const newLabel = 'aria-label="모바일 전용" title="모바일 전용">${mobileSvg}<span>모바일 전용</span>';
  const oldHandler = "header.querySelector('.qmes-erp-header-mobile').addEventListener('click',()=>{const mobileTarget=findTop('현장입력')||findTop('현장 입력');if(mobileTarget){mobileTarget.click();return;}window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'fieldInput',openMenu:null}}));});";
  const newHandler = "header.querySelector('.qmes-erp-header-mobile').addEventListener('click',()=>{window.location.assign('/mobile.html?v=20260903-mobile-dedicated1');});";
  const oldSetAccountOpen = "const setAccountOpen=open=>{accountWrap.classList.toggle('is-open',Boolean(open));accountButton.setAttribute('aria-expanded',String(Boolean(open)));};";
  const newSetAccountOpen = "const setAccountOpen=open=>{const visible=Boolean(open);accountWrap.classList.toggle('is-open',visible);accountButton.setAttribute('aria-expanded',String(visible));accountMenu.style.setProperty('display',visible?'block':'none','important');accountMenu.style.setProperty('visibility',visible?'visible':'hidden','important');accountMenu.style.setProperty('opacity',visible?'1':'0','important');accountMenu.style.setProperty('pointer-events',visible?'auto':'none','important');};";
  const oldAccountEnter = "accountWrap.addEventListener('mouseenter',()=>setAccountOpen(true));";
  const newAccountEnter = "let qmesAccountCloseTimer=null;const cancelAccountClose=()=>{if(qmesAccountCloseTimer){clearTimeout(qmesAccountCloseTimer);qmesAccountCloseTimer=null;}};const scheduleAccountClose=()=>{cancelAccountClose();qmesAccountCloseTimer=setTimeout(()=>setAccountOpen(false),420);};accountWrap.addEventListener('mouseenter',()=>{cancelAccountClose();setAccountOpen(true);});";
  const oldAccountLeave = "accountWrap.addEventListener('mouseleave',()=>setAccountOpen(false));";
  const newAccountLeave = "accountWrap.addEventListener('mouseleave',scheduleAccountClose);accountMenu.addEventListener('mouseenter',()=>{cancelAccountClose();setAccountOpen(true);});accountMenu.addEventListener('mouseleave',scheduleAccountClose);";
  const oldAccountClick = "accountButton.addEventListener('click',event=>{event.stopPropagation();setAccountOpen(!accountWrap.classList.contains('is-open'));});";
  const newAccountClick = "accountButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();cancelAccountClose();setAccountOpen(!accountWrap.classList.contains('is-open'));});";
  let patched = source.replace(oldLabel, newLabel).replace(oldHandler, newHandler);
  patched = patched.replace(oldSetAccountOpen, newSetAccountOpen).replace(oldAccountEnter, newAccountEnter).replace(oldAccountLeave, newAccountLeave).replace(oldAccountClick, newAccountClick);
  if (patched !== source) fs.writeFileSync(publicShellMenu, patched, 'utf8');
} catch (error) {
  console.warn('[QMES] Sidebar UI normalization skipped:', error.message);
}

fs.readFile = function qmesEnterpriseDashboardReadFile(file, ...args) {
  let target = file;
  try {
    if (path.resolve(String(file)) === legacyDashboard) target = enterpriseDashboard;
  } catch (_error) {}

  const callbackIndex = args.findIndex(arg => typeof arg === 'function');
  if (callbackIndex < 0 || target !== enterpriseDashboard) return originalReadFile(target, ...args);

  const callback = args[callbackIndex];
  const nextArgs = args.slice();
  nextArgs[callbackIndex] = (error, source) => {
    if (error) return callback(error);
    let patched = String(source);
    patched = patched.replace(
      '["INV","재고입고", data.inventoryLotCount + " LOT","inventory","inventoryMenu"]',
      '["INV","재고입고", data.inventoryLotCount + " LOT","inv",""]'
    );
    patched = patched.replace(
      '.namo-enterprise-dashboard *{box-sizing:border-box}',
      '.namo-enterprise-dashboard *{box-sizing:border-box}.qmes-ref-brand-mark{display:none!important}'
    );
    callback(null, patched);
  };
  return originalReadFile(target, ...nextArgs);
};

process.env.QMES_DASHBOARD_BUILD = process.env.QMES_DASHBOARD_BUILD || `20260903-enterprise-v5-${SHELL_BUILD}`;

// Generate the PAD PC compatibility build only after all startup shell/router
// normalization has been applied. This keeps PAD PC mode visually and
// functionally aligned with the exact desktop QMES source while serving
// pre-transpiled JavaScript to older tablet browsers.
try {
  require('./build-pad-compat.js');
} catch (error) {
  console.error('[PAD-COMPAT] build failed:', error);
  process.exit(1);
}

// Import approved historical incoming-inspection ledger rows into the shared IQC store.
// The importer is idempotent and never overwrites an existing matching inspection.
require('./iqc-history-seed-20260915.js');

// Ensure the 18 approved legacy purchase rows are present in purchase_orders.
// Missing rows are inserted; only SYSTEM-created legacy rows may be refreshed.
// User-created purchase orders are never overwritten.
require('./purchase-history-repair-20260915.js');

// Ensure NAMO Talk standalone API routes are registered before the legacy server creates/listens on the Express app.
require('./namo-talk-standalone-server.js');
require('./server-legacy-20260903.js');