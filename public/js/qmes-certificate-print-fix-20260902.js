/* NAMO QMES - IQC/PQC/OQC certificate live-DOM print fix - 2026-09-02 */
(function installCertificatePrintFix(global){
  "use strict";
  if(global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V3__) return;
  global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V3__=true;

  const STYLE_ID="qmes-cert-print-live-style-20260902-v3";
  const SELECTOR=".qmes-iqc-doc:not(.qmes-wo-cert),.qmes-pqc-doc,.qmes-oqc-doc";
  let hidden=[];
  let kept=[];
  let target=null;

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
@media print{
  @page{size:A4 portrait;margin:5mm;}
  html,body{margin:0!important;padding:0!important;min-width:0!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;}
  body.qmes-cert-print-live .qmes-cert-print-hide{display:none!important;}
  body.qmes-cert-print-live .qmes-cert-print-keep{
    position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
    transform:none!important;float:none!important;
    width:100%!important;max-width:none!important;min-width:0!important;
    height:auto!important;min-height:0!important;max-height:none!important;
    margin:0 auto!important;padding:0!important;overflow:visible!important;background:#fff!important;
    box-sizing:border-box!important;
  }
  body.qmes-cert-print-live .qmes-cert-print-target{
    position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
    float:none!important;clear:both!important;
    width:calc(100% - 8mm)!important;max-width:202mm!important;min-width:0!important;
    height:auto!important;min-height:0!important;max-height:none!important;
    margin:5mm auto 0 auto!important;
    overflow:visible!important;box-shadow:none!important;
    box-sizing:border-box!important;
  }
  body.qmes-cert-print-live .qmes-cert-print-target .qmes-wo-viewer-head,
  body.qmes-cert-print-live .qmes-cert-print-target button,
  body.qmes-cert-print-live .qmes-cert-print-target .no-print{display:none!important;}
  body.qmes-cert-print-live .qmes-cert-print-target table{page-break-inside:auto!important;}
  body.qmes-cert-print-live .qmes-cert-print-target tr{page-break-inside:avoid!important;page-break-after:auto!important;}
  body.qmes-cert-print-live .qmes-cert-print-target .qmes-iqc2-sec,
  body.qmes-cert-print-live .qmes-cert-print-target .qmes-iqc2-auth-row{break-inside:avoid!important;page-break-inside:avoid!important;}
}
`;
    document.head.appendChild(style);
  }

  function visible(el){
    if(!el) return false;
    const r=el.getBoundingClientRect();
    const s=global.getComputedStyle(el);
    return s.display!=="none" && s.visibility!=="hidden" && r.width>0 && r.height>0;
  }

  function findActiveCertificate(){
    const docs=Array.from(document.querySelectorAll(SELECTOR));
    return docs.find(visible) || docs[docs.length-1] || null;
  }

  function markSiblings(node,parent){
    Array.from(parent.children||[]).forEach(child=>{
      if(child===node) return;
      child.classList.add("qmes-cert-print-hide");
      hidden.push(child);
    });
  }

  function prepare(){
    cleanup();
    installStyle();
    target=findActiveCertificate();
    if(!target) return;

    target.classList.add("qmes-cert-print-target");
    let node=target;
    let parent=node.parentElement;
    while(parent){
      if(parent===document.body){
        markSiblings(node,parent);
        break;
      }
      markSiblings(node,parent);
      parent.classList.add("qmes-cert-print-keep");
      kept.push(parent);
      node=parent;
      parent=node.parentElement;
    }
    document.body.classList.add("qmes-cert-print-live");
  }

  function cleanup(){
    document.body.classList.remove("qmes-cert-print-live");
    hidden.forEach(el=>el&&el.classList&&el.classList.remove("qmes-cert-print-hide"));
    kept.forEach(el=>el&&el.classList&&el.classList.remove("qmes-cert-print-keep"));
    hidden=[];kept=[];
    if(target&&target.classList)target.classList.remove("qmes-cert-print-target");
    target=null;
  }

  installStyle();
  global.addEventListener("beforeprint",prepare);
  global.addEventListener("afterprint",cleanup);
})(window);
