/* NAMO QMES - IQC/PQC/OQC certificate print isolation - 2026-09-02 */
(function installCertificatePrintFix(global){
  "use strict";
  if(global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V15__) return;
  global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V15__=true;
  const STYLE_ID="qmes-cert-print-isolation-20260902-v15",SELECTOR=".qmes-iqc-doc:not(.qmes-wo-cert),.qmes-pqc-doc,.qmes-oqc-doc";let target=null;
  function installStyle(){if(document.getElementById(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
/* PQC title remains higher; OQC keeps approved title position. */
html body #root .qmes-pqc-doc .qmes-iqc-centered-title{transform:translateY(-16px)!important;}
html body #root .qmes-oqc-doc .qmes-iqc-centered-title{transform:translateY(-10px)!important;}
@media print{
 @page{size:A4 portrait;margin:5mm;}
 html,body,#root{margin:0!important;padding:0!important;width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;}
 body.qmes-cert-print-live *{visibility:hidden!important;}
 body.qmes-cert-print-live .qmes-cert-print-path,body.qmes-cert-print-live .qmes-cert-print-path *{visibility:visible!important;}
 body.qmes-cert-print-live #qmes-sync-sidebar,body.qmes-cert-print-live #qmes-sync-sidebar *,body.qmes-cert-print-live #qmes-sync-hamburger,body.qmes-cert-print-live .qmes-top-menu,body.qmes-cert-print-live .qmes-top-menu *,body.qmes-cert-print-live .qmes-top-menu-bar,body.qmes-cert-print-live .qmes-top-menu-bar *{display:none!important;visibility:hidden!important;}
 body.qmes-cert-print-live.qmes-side-open #root>div>main,body.qmes-cert-print-live #root>div>main{margin-left:0!important;left:0!important;transform:none!important;width:100%!important;max-width:none!important;padding-left:0!important;}
 body.qmes-cert-print-live .qmes-cert-print-path{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;float:none!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;}
 body.qmes-cert-print-live .qmes-cert-print-target{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;float:none!important;clear:both!important;margin-left:auto!important;margin-right:auto!important;overflow:visible!important;box-shadow:none!important;}
 body.qmes-cert-print-iqc,body.qmes-cert-print-pqc,body.qmes-cert-print-iqc #root,body.qmes-cert-print-pqc #root,body.qmes-cert-print-iqc #root>div,body.qmes-cert-print-pqc #root>div,body.qmes-cert-print-iqc #root>div>main,body.qmes-cert-print-pqc #root>div>main,body.qmes-cert-print-iqc .qmes-cert-print-path:not(.qmes-cert-print-target),body.qmes-cert-print-pqc .qmes-cert-print-path:not(.qmes-cert-print-target){background:#fff!important;background-color:#fff!important;background-image:none!important;box-shadow:none!important;filter:none!important;opacity:1!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
 body.qmes-cert-print-iqc .qmes-cert-print-path:not(.qmes-cert-print-target)::before,body.qmes-cert-print-iqc .qmes-cert-print-path:not(.qmes-cert-print-target)::after,body.qmes-cert-print-pqc .qmes-cert-print-path:not(.qmes-cert-print-target)::before,body.qmes-cert-print-pqc .qmes-cert-print-path:not(.qmes-cert-print-target)::after{content:none!important;display:none!important;background:none!important;box-shadow:none!important;}
 body.qmes-cert-print-iqc{width:200mm!important;min-height:287mm!important;}
 body.qmes-cert-print-iqc .qmes-cert-print-iqc-stage{width:200mm!important;min-height:287mm!important;margin:0 auto!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;background:#fff!important;}
 body.qmes-cert-print-iqc .qmes-cert-print-target{width:100%!important;max-width:100%!important;min-height:0!important;height:auto!important;margin:auto!important;transform:translateY(4mm)!important;}
 /* PQC only: preview-measured vertical correction. 24mm -> 33mm. */
 body.qmes-cert-print-pqc .qmes-cert-print-target{transform:translateY(33mm)!important;}
 body.qmes-cert-print-pqc .qmes-cert-print-target .qmes-iqc-centered-title{transform:translateY(-16px)!important;}
 body.qmes-cert-print-oqc .qmes-cert-print-target .qmes-iqc-centered-title{transform:translateY(-10px)!important;}
 body.qmes-cert-print-live .qmes-cert-print-target .qmes-wo-viewer-head,body.qmes-cert-print-live .qmes-cert-print-target button,body.qmes-cert-print-live .qmes-cert-print-target .no-print{display:none!important;visibility:hidden!important;}
 body.qmes-cert-print-live .qmes-cert-print-target table{page-break-inside:auto!important;}
 body.qmes-cert-print-live .qmes-cert-print-target tr{page-break-inside:avoid!important;page-break-after:auto!important;}
 body.qmes-cert-print-live .qmes-cert-print-target .qmes-iqc2-sec,body.qmes-cert-print-live .qmes-cert-print-target .qmes-iqc2-auth-row{break-inside:avoid!important;page-break-inside:avoid!important;}
}`;document.head.appendChild(style);}
 function visible(el){if(!el)return false;const r=el.getBoundingClientRect(),s=global.getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0;}
 function findActiveCertificate(){const docs=Array.from(document.querySelectorAll(SELECTOR));return docs.find(visible)||docs[docs.length-1]||null;}
 function clearMarks(){document.querySelectorAll(".qmes-cert-print-path,.qmes-cert-print-target,.qmes-cert-print-iqc-stage").forEach(el=>el.classList.remove("qmes-cert-print-path","qmes-cert-print-target","qmes-cert-print-iqc-stage"));document.body.classList.remove("qmes-cert-print-live","qmes-cert-print-iqc","qmes-cert-print-pqc","qmes-cert-print-oqc");}
 function prepare(){clearMarks();installStyle();target=findActiveCertificate();if(!target)return;target.classList.add("qmes-cert-print-target","qmes-cert-print-path");let node=target.parentElement;while(node&&node!==document.body){node.classList.add("qmes-cert-print-path");node=node.parentElement;}document.body.classList.add("qmes-cert-print-live");if(target.classList.contains("qmes-iqc-doc")){document.body.classList.add("qmes-cert-print-iqc");const parent=target.parentElement;if(parent)parent.classList.add("qmes-cert-print-iqc-stage");}else if(target.classList.contains("qmes-pqc-doc")){document.body.classList.add("qmes-cert-print-pqc");}else{document.body.classList.add("qmes-cert-print-oqc");}}
 function cleanup(){clearMarks();target=null;}
 installStyle();global.addEventListener("beforeprint",prepare);global.addEventListener("afterprint",cleanup);
})(window);
