/* NAMO QMES - shell runtime stability hotfix - 2026-09-02 */
(function(global){
'use strict';
if(global.__QMES_SHELL_RUNTIME_FIX_20260902_V3__)return;
global.__QMES_SHELL_RUNTIME_FIX_20260902_V3__=true;
const STYLE_ID='qmes-shell-runtime-fix-20260902-v3';
function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
body.qmes-iqc-preview-open{overflow:hidden!important;}
body.qmes-iqc-preview-open #qmes-sync-sidebar,body.qmes-iqc-preview-open #qmes-sync-hamburger,body.qmes-iqc-preview-open .qmes-top-menu,body.qmes-iqc-preview-open .qmes-top-menu-bar,body.qmes-iqc-preview-open #qmes-all-menu-dropdown{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}
body.qmes-iqc-preview-open #root>div>main{margin-left:0!important;left:0!important;width:100%!important;max-width:none!important;}
html body.qmes-iqc-preview-open #root .qmes-modal-backdrop:has(.qmes-wo-viewer .qmes-iqc-doc){position:fixed!important;inset:0!important;z-index:2147483200!important;padding:10px 20px!important;margin:0!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;overflow:hidden!important;background:#0b1728!important;}
html body.qmes-iqc-preview-open #root .qmes-wo-viewer:has(.qmes-iqc-doc){position:relative!important;z-index:2147483201!important;width:68vw!important;max-width:1060px!important;height:calc(100vh - 20px)!important;max-height:calc(100vh - 20px)!important;min-height:0!important;margin:0 auto!important;display:block!important;overflow-x:hidden!important;overflow-y:auto!important;background:#0b1728!important;}
html body.qmes-iqc-preview-open #root .qmes-wo-viewer:has(.qmes-iqc-doc)>.qmes-wo-viewer-head{display:flex!important;visibility:visible!important;opacity:1!important;position:sticky!important;top:0!important;z-index:2147483205!important;min-height:58px!important;flex:0 0 auto!important;align-items:center!important;justify-content:space-between!important;background:#0b1728!important;overflow:visible!important;}
html body.qmes-iqc-preview-open #root .qmes-wo-viewer:has(.qmes-iqc-doc)>.qmes-wo-viewer-head>div{visibility:visible!important;opacity:1!important;}
html body.qmes-iqc-preview-open #root .qmes-wo-viewer:has(.qmes-iqc-doc)>.qmes-wo-viewer-head button{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:relative!important;z-index:2147483206!important;}
html body.qmes-iqc-preview-open #root .qmes-wo-viewer:has(.qmes-iqc-doc)>.qmes-iqc-doc{position:relative!important;z-index:1!important;margin-top:16px!important;overflow:visible!important;}
.qmes-top-menu-button,#qmes-all-menu-dropdown,.qmes-submenu-row,.qmes-submenu-button{transition-delay:0s!important;animation-delay:0s!important;}
@media print{#qmes-sync-hamburger,#qmes-sync-sidebar,[id*="hamburger"],[class*="hamburger"],[class*="menu-toggle"],[class*="sidebar-toggle"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}body.qmes-cert-print-pqc #root>div>main,body.qmes-cert-print-oqc #root>div>main{margin-left:0!important;width:100%!important;left:0!important;}}
`;
  document.head.appendChild(s);
}
function bindImmediateTopHover(button){
  if(!button||button.dataset.qmesImmediateHoverV3==='1')return;
  button.dataset.qmesImmediateHoverV3='1';
  const openSubmenuOnly=()=>{
    if(!button.dataset.qmesHoverDispatching){
      button.dataset.qmesHoverDispatching='1';
      try{button.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,cancelable:false,view:global}));}catch(_error){}
      delete button.dataset.qmesHoverDispatching;
    }
  };
  button.addEventListener('pointerenter',openSubmenuOnly,{passive:true});
  button.addEventListener('mouseenter',openSubmenuOnly,{passive:true});
}
function bindTopMenus(scope=document){scope.querySelectorAll?.('.qmes-top-menu-button').forEach(bindImmediateTopHover);}
function syncIqcPreviewState(){
  const open=Boolean(document.querySelector('#root .qmes-wo-viewer .qmes-iqc-doc'));
  document.body.classList.toggle('qmes-iqc-preview-open',open);
  if(open)document.body.classList.remove('qmes-side-open');
}
let printHidden=[];
function hidePrintShellControls(){
  printHidden=[];
  const selectors=['#qmes-sync-hamburger','#qmes-sync-sidebar','[id*="hamburger"]','[class*="hamburger"]','[class*="menu-toggle"]','[class*="sidebar-toggle"]'];
  document.querySelectorAll(selectors.join(',')).forEach(el=>{if(printHidden.some(x=>x.el===el))return;printHidden.push({el,style:el.getAttribute('style')});el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');el.style.setProperty('opacity','0','important');});
}
function restorePrintShellControls(){printHidden.forEach(({el,style})=>{try{if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);}catch(_error){}});printHidden=[];}
installStyle();bindTopMenus(document);syncIqcPreviewState();
let raf=0;
new MutationObserver(ms=>{
  for(const m of ms){for(const n of m.addedNodes||[]){if(!(n instanceof Element))continue;if(n.matches?.('.qmes-top-menu-button'))bindImmediateTopHover(n);bindTopMenus(n);}}
  if(!raf)raf=global.requestAnimationFrame(()=>{raf=0;syncIqcPreviewState();});
}).observe(document.documentElement,{childList:true,subtree:true});
global.addEventListener('beforeprint',hidePrintShellControls);
global.addEventListener('afterprint',restorePrintShellControls);
})(window);
