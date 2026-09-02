/* NAMO QMES - IQC/PQC/OQC certificate live-DOM print fix - 2026-09-02 */
(function installCertificatePrintFix(global){
  "use strict";
  if(global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V6__) return;
  global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V6__=true;

  const STYLE_ID="qmes-cert-print-live-style-20260902-v6";
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
  html,body{margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important;}
  body.qmes-cert-print-live .qmes-cert-print-hide{display:none!important;}

  /* PQC/OQC: keep the certificate itself as-is; only remove surrounding UI/sidebar. */
  body.qmes-cert-print-pqo .qmes-cert-print-keep{
    position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
    transform:none!important;float:none!important;
    width:100%!important;max-width:none!important;min-width:0!important;
    height:auto!important;min-height:0!important;max-height:none!important;
    margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important;
  }
  body.qmes-cert-print-pqo .qmes-cert-print-target{
    margin-left:auto!important;margin-right:auto!important;
    overflow:visible!important;box-shadow:none!important;
  }

  /* IQC: center on the A4 printable area and compensate the visual high bias. */
  body.qmes-cert-print-iqc{width:200mm!important;height:287mm!important;min-height:287mm!important;display:flex!important;align-items:center!important;justify-content:center!important;}
  body.qmes-cert-print-iqc .qmes-cert-print-keep{
    position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
    transform:none!important;float:none!important;
    width:200mm!important;max-width:200mm!important;min-width:200mm!important;
    height:287mm!important;min-height:287mm!important;max-height:287mm!important;
    margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important;
    box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;
  }
  body.qmes-cert-print-iqc .qmes-cert-print-target{
    position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
    float:none!important;clear:both!important;
    width:100%!important;max-width:100%!important;min-width:0!important;
    height:auto!important;min-height:0!important;max-height:none!important;
    margin:auto!important;overflow:visible!important;box-shadow:none!important;box-sizing:border-box!important;
    transform:translateY(4mm)!important;
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
      if(parent===document.body){markSiblings(node,parent);break;}
      markSiblings(node,parent);
      parent.classList.add("qmes-cert-print-keep");
      kept.push(parent);
      node=parent;
      parent=node.parentElement;
    }
    document.body.classList.add("qmes-cert-print-live");
    if(target.classList.contains("qmes-iqc-doc")) document.body.classList.add("qmes-cert-print-iqc");
    else document.body.classList.add("qmes-cert-print-pqo");
  }

  function cleanup(){
    document.body.classList.remove("qmes-cert-print-live","qmes-cert-print-iqc","qmes-cert-print-pqo");
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
