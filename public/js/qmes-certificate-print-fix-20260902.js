/* NAMO QMES - IQC/PQC/OQC certificate print isolation - 2026-09-02 */
(function installCertificatePrintFix(global){
  "use strict";
  if(global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V1__) return;
  global.__QMES_CERTIFICATE_PRINT_FIX_20260902_V1__=true;

  const ROOT_ID="qmes-cert-print-only-root";
  const STYLE_ID="qmes-cert-print-only-style-20260902-v1";
  const SELECTOR=".qmes-iqc-doc:not(.qmes-wo-cert),.qmes-pqc-doc,.qmes-oqc-doc";

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
#${ROOT_ID}{display:none;}
@media print{
  @page{size:A4 portrait;margin:5mm;}
  html,body{margin:0!important;padding:0!important;width:auto!important;min-width:0!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;}
  body.qmes-cert-print-isolated > *:not(#${ROOT_ID}){display:none!important;}
  body.qmes-cert-print-isolated #${ROOT_ID}{display:block!important;position:static!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;}
  body.qmes-cert-print-isolated #${ROOT_ID} > .doc-paper,
  body.qmes-cert-print-isolated #${ROOT_ID} > .qmes-iqc-doc,
  body.qmes-cert-print-isolated #${ROOT_ID} > .qmes-pqc-doc,
  body.qmes-cert-print-isolated #${ROOT_ID} > .qmes-oqc-doc{
    position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
    transform:none!important;float:none!important;clear:both!important;
    width:100%!important;max-width:none!important;min-width:0!important;
    height:auto!important;min-height:0!important;max-height:none!important;
    margin:0!important;padding:4mm 5mm!important;box-sizing:border-box!important;
    overflow:visible!important;box-shadow:none!important;border-radius:0!important;
    page-break-before:auto!important;page-break-after:auto!important;
  }
  body.qmes-cert-print-isolated #${ROOT_ID} .qmes-modal-backdrop,
  body.qmes-cert-print-isolated #${ROOT_ID} .qmes-wo-viewer-head,
  body.qmes-cert-print-isolated #${ROOT_ID} button,
  body.qmes-cert-print-isolated #${ROOT_ID} .no-print{display:none!important;}
  body.qmes-cert-print-isolated #${ROOT_ID} table{page-break-inside:auto!important;}
  body.qmes-cert-print-isolated #${ROOT_ID} tr{page-break-inside:avoid!important;page-break-after:auto!important;}
  body.qmes-cert-print-isolated #${ROOT_ID} .qmes-iqc2-sec,
  body.qmes-cert-print-isolated #${ROOT_ID} .qmes-iqc2-auth-row{break-inside:avoid!important;page-break-inside:avoid!important;}
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

  function prepare(){
    installStyle();
    const source=findActiveCertificate();
    if(!source) return;
    let root=document.getElementById(ROOT_ID);
    if(!root){root=document.createElement("div");root.id=ROOT_ID;document.body.appendChild(root);}
    root.innerHTML="";
    const clone=source.cloneNode(true);
    clone.removeAttribute("id");
    root.appendChild(clone);
    document.body.classList.add("qmes-cert-print-isolated");
  }

  function cleanup(){
    document.body.classList.remove("qmes-cert-print-isolated");
    const root=document.getElementById(ROOT_ID);
    if(root) root.innerHTML="";
  }

  installStyle();
  global.addEventListener("beforeprint",prepare);
  global.addEventListener("afterprint",cleanup);
})(window);
