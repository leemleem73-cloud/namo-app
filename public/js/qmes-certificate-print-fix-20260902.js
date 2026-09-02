/* NAMO QMES - certificate print isolation - 2026-09-02 */
(function(global){
'use strict';
if(global.__QMES_CERT_PRINT_V23__)return;global.__QMES_CERT_PRINT_V23__=true;
var id='qmes-cert-print-v23',sel='.qmes-iqc-doc:not(.qmes-wo-cert),.qmes-pqc-doc,.qmes-oqc-doc',target=null;
function install(){if(document.getElementById(id))return;var s=document.createElement('style');s.id=id;s.textContent=`
html body #root .qmes-pqc-doc .qmes-iqc-centered-title{transform:translateY(-16px)!important;}
html body #root .qmes-oqc-doc .qmes-iqc-centered-title{position:relative!important;top:-16px!important;transform:none!important;z-index:5!important;visibility:visible!important;opacity:1!important;}
@media print{
@page{size:A4 portrait;margin:5mm;}
html,body,#root{margin:0!important;padding:0!important;width:100%!important;background:#fff!important;overflow:visible!important;}
body.qmes-cert-print-live *{visibility:hidden!important;}
body.qmes-cert-print-live .qmes-cert-print-path,body.qmes-cert-print-live .qmes-cert-print-path *{visibility:visible!important;}
body.qmes-cert-print-live #qmes-sync-sidebar,body.qmes-cert-print-live #qmes-sync-hamburger,body.qmes-cert-print-live .qmes-top-menu,body.qmes-cert-print-live .qmes-top-menu-bar{display:none!important;visibility:hidden!important;}
body.qmes-cert-print-live #root>div>main{margin-left:0!important;left:0!important;width:100%!important;max-width:none!important;padding-left:0!important;}
body.qmes-cert-print-live .qmes-cert-print-target{margin-left:auto!important;margin-right:auto!important;box-shadow:none!important;overflow:visible!important;}
body.qmes-cert-print-live,body.qmes-cert-print-live #root,body.qmes-cert-print-live #root>div,body.qmes-cert-print-live #root>div>main,body.qmes-cert-print-live .qmes-cert-print-path:not(.qmes-cert-print-target){background:#fff!important;background-color:#fff!important;background-image:none!important;box-shadow:none!important;filter:none!important;opacity:1!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
body.qmes-cert-print-live .qmes-cert-print-path:not(.qmes-cert-print-target)::before,body.qmes-cert-print-live .qmes-cert-print-path:not(.qmes-cert-print-target)::after{content:none!important;display:none!important;background:none!important;box-shadow:none!important;}
body.qmes-cert-print-iqc .qmes-cert-print-iqc-stage{width:200mm!important;min-height:287mm!important;margin:0 auto!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#fff!important;box-sizing:border-box!important;}
body.qmes-cert-print-iqc .qmes-cert-print-target{width:100%!important;max-width:100%!important;margin:auto!important;transform:translateY(4mm)!important;}
body.qmes-cert-print-pqc .qmes-cert-print-target{transform:translateY(36mm)!important;}
body.qmes-cert-print-pqc .qmes-cert-print-target .qmes-iqc-centered-title{transform:translateY(-16px)!important;}
body.qmes-cert-print-oqc .qmes-cert-print-target .qmes-iqc-centered-title{position:relative!important;top:-16px!important;transform:none!important;z-index:5!important;visibility:visible!important;opacity:1!important;}
body.qmes-cert-print-live .qmes-cert-print-target .qmes-wo-viewer-head,body.qmes-cert-print-live .qmes-cert-print-target button,body.qmes-cert-print-live .qmes-cert-print-target .no-print{display:none!important;visibility:hidden!important;}
body.qmes-cert-print-live .qmes-cert-print-target tr{page-break-inside:avoid!important;}
}`;document.head.appendChild(s);}
function visible(e){if(!e)return false;var r=e.getBoundingClientRect(),c=global.getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;}
function active(){var a=Array.prototype.slice.call(document.querySelectorAll(sel));return a.find(visible)||a[a.length-1]||null;}
function clear(){Array.prototype.forEach.call(document.querySelectorAll('.qmes-cert-print-path,.qmes-cert-print-target,.qmes-cert-print-iqc-stage'),function(e){e.classList.remove('qmes-cert-print-path','qmes-cert-print-target','qmes-cert-print-iqc-stage');});document.body.classList.remove('qmes-cert-print-live','qmes-cert-print-iqc','qmes-cert-print-pqc','qmes-cert-print-oqc');}
function prep(){clear();target=active();if(!target)return;target.classList.add('qmes-cert-print-target','qmes-cert-print-path');var n=target.parentElement;while(n&&n!==document.body){n.classList.add('qmes-cert-print-path');n=n.parentElement;}document.body.classList.add('qmes-cert-print-live');if(target.classList.contains('qmes-iqc-doc')){document.body.classList.add('qmes-cert-print-iqc');if(target.parentElement)target.parentElement.classList.add('qmes-cert-print-iqc-stage');}else if(target.classList.contains('qmes-pqc-doc'))document.body.classList.add('qmes-cert-print-pqc');else document.body.classList.add('qmes-cert-print-oqc');}
function done(){clear();target=null;}install();global.addEventListener('beforeprint',prep);global.addEventListener('afterprint',done);
})(window);
