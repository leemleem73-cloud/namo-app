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

const SHELL_BUILD = '20260910-scroll-hardfix2';
const MEMBERS_ASSET_BUILD = '20260910-access-permissions1';
const MEMBER_FALLBACK_BUILD = '20260904-pc-edit-hard5';
const MEMBER_LINK_BUILD = '20260904-native2';
const DASHBOARD_ASSET_BUILD = '20260904-enterprise-only12';

const QMES_SCROLL_FIX_STYLE = `<style id="qmes-scroll-fix-20260910">
html,body{height:100%!important;min-height:100%!important;}
html body{overflow:hidden!important;}
html body #root,html body #root>div{height:100%!important;min-height:0!important;overflow:hidden!important;}
html body #root>div>main{position:fixed!important;top:58px!important;bottom:0!important;left:236px!important;right:0!important;margin:0!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;overflow-y:scroll!important;overflow-x:auto!important;overscroll-behavior:contain!important;scrollbar-gutter:stable!important;touch-action:pan-y!important;}
html body.qmes-erp-menu-closed #root>div>main{left:0!important;width:auto!important;}
html body #qmes-erp-sidebar{overflow:hidden!important;}
html body #qmes-erp-sidebar .qmes-erp-nav{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:scroll!important;overflow-x:hidden!important;scrollbar-width:thin!important;-ms-overflow-style:auto!important;overscroll-behavior:contain!important;touch-action:pan-y!important;}
html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{display:block!important;width:8px!important;height:8px!important;}
html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-thumb{background:#aebfcb!important;border-radius:8px!important;}
html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-track{background:#edf2f6!important;}
</style>`;

const QMES_SCROLL_FIX_SCRIPT = `<script id="qmes-scroll-wheel-fix-20260910">
(function(){
  "use strict";
  if(window.__QMES_SCROLL_HARDFIX_20260910__)return;
  window.__QMES_SCROLL_HARDFIX_20260910__=true;

  function deltaPixels(event){
    let delta=Number(event.deltaY)||0;
    if(event.deltaMode===1)delta*=32;
    else if(event.deltaMode===2)delta*=window.innerHeight||800;
    return delta;
  }

  function getTargets(){
    const main=document.querySelector("#root>div>main");
    const sidebar=document.getElementById("qmes-erp-sidebar");
    const nav=sidebar&&sidebar.querySelector(".qmes-erp-nav");
    return {main,sidebar,nav};
  }

  function enforce(){
    const {main,nav}=getTargets();
    if(main){
      main.style.setProperty("position","fixed","important");
      main.style.setProperty("top","58px","important");
      main.style.setProperty("bottom","0","important");
      main.style.setProperty("left",document.body.classList.contains("qmes-erp-menu-closed")?"0":"236px","important");
      main.style.setProperty("right","0","important");
      main.style.setProperty("margin","0","important");
      main.style.setProperty("width","auto","important");
      main.style.setProperty("height","auto","important");
      main.style.setProperty("min-height","0","important");
      main.style.setProperty("max-height","none","important");
      main.style.setProperty("overflow-y","scroll","important");
      main.style.setProperty("overflow-x","auto","important");
    }
    if(nav){
      nav.style.setProperty("overflow-y","scroll","important");
      nav.style.setProperty("overflow-x","hidden","important");
      nav.style.setProperty("min-height","0","important");
    }
    document.documentElement.style.setProperty("height","100%","important");
    document.body.style.setProperty("height","100%","important");
    document.body.style.setProperty("overflow","hidden","important");
  }

  window.addEventListener("wheel",function(event){
    const {main,sidebar,nav}=getTargets();
    if(!main&&!nav)return;
    const target=event.target instanceof Node?event.target:null;
    const scroller=sidebar&&nav&&target&&sidebar.contains(target)?nav:main;
    if(!scroller)return;
    const delta=deltaPixels(event);
    if(!delta)return;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max<=0)return;
    const before=scroller.scrollTop;
    const next=Math.max(0,Math.min(max,before+delta));
    if(next===before)return;
    event.preventDefault();
    scroller.scrollTop=next;
  },{capture:true,passive:false});

  document.addEventListener("keydown",function(event){
    if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
    const {main}=getTargets();
    if(!main)return;
    let delta=0;
    if(event.key==="PageDown")delta=main.clientHeight*.9;
    else if(event.key==="PageUp")delta=-main.clientHeight*.9;
    else if(event.key==="Home")delta=-main.scrollHeight;
    else if(event.key==="End")delta=main.scrollHeight;
    if(!delta)return;
    event.preventDefault();
    main.scrollTop=Math.max(0,Math.min(main.scrollHeight-main.clientHeight,main.scrollTop+delta));
  },true);

  const boot=function(){enforce();setTimeout(enforce,0);setTimeout(enforce,250);setTimeout(enforce,1000);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.addEventListener("resize",enforce);
  window.addEventListener("qmes:navigate-tab",function(){requestAnimationFrame(enforce);setTimeout(enforce,100);});
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
    .replace(/qmes-collapsible-side-menu\.js\?v=[^"']+/g, `qmes-collapsible-side-menu.js?v=${SHELL_BUILD}`);

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
  const patched = source.replace(oldLabel, newLabel).replace(oldHandler, newHandler);
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