'use strict';

// NAMO Chemical ERP/MES enterprise dashboard server entry - 2026-09-03.
// Original production server is preserved verbatim in server-legacy-20260903.js.
const fs = require('fs');
const path = require('path');

require('./attendance-core-safe.js');
require('./attendance-correction-safe.js');
require('./attendance-leave-cancel-safe.js');
require('./attendance-admin-overview-safe.js');
require('./mobile-hard-entry-preload.js');
require('./mobile-static-preload.js');
require('./member-email-sync-preload.js');
require('./access-permissions-safe.js');

const publicIndex = path.resolve(__dirname, 'public', 'index.html');
const publicRouter = path.resolve(__dirname, 'public', 'js', 'router.jsx');
const publicShellMenu = path.resolve(__dirname, 'public', 'js', 'qmes-collapsible-side-menu.js');
const legacyDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard.jsx');
const enterpriseDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
const originalReadFile = fs.readFile.bind(fs);
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
html body #root>div>main{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;margin-left:236px!important;margin-top:58px!important;width:calc(100% - 236px)!important;height:auto!important;min-height:calc(100vh - 58px)!important;max-height:none!important;overflow:visible!important;box-sizing:border-box!important;}
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
      main.style.setProperty("margin-left",document.body.classList.contains("qmes-erp-menu-closed")?"0":"236px","important");
      main.style.setProperty("width",document.body.classList.contains("qmes-erp-menu-closed")?"100%":"calc(100% - 236px)","important");
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
    .replace(/qmes-collapsible-side-menu\.js\?v=[^"']+/g, `qmes-collapsible-side-menu.js?v=${SHELL_BUILD}`)
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
require('./server-legacy-20260903.js');