/* QMES IPAD IQC basic-info layout: packaging next to defect, wide remarks below */
(function(){
  "use strict";
  if(window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__) return;
  window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__=true;

  const clean=(value)=>String(value||"").replace(/\s+/g," ").trim();

  const style=document.createElement("style");
  style.id="qmes-ipad-iqc-basic-layout-style-20260824";
  style.textContent=`
    .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-weight-pair{
      grid-column:1 / -1!important;
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      gap:12px!important;
      width:100%!important;
      min-width:0!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-weight-pair > label{
      min-width:0!important;
      width:100%!important;
      margin:0!important;
    }
    @media(max-width:700px){
      .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-weight-pair{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;}
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function labelByText(grid,text){
    return Array.from(grid?.querySelectorAll(":scope > label")||[]).find(label=>clean(label.querySelector("span")?.textContent).startsWith(text));
  }

  function apply(){
    const root=document.querySelector(".qmes-ipad-pop");
    if(!root) return;
    const title=clean(root.querySelector(".qmes-ipad-inspection-head h1")?.textContent);
    if(!title.includes("수입검사")) return;

    const grid=root.querySelector(".qmes-ipad-section .qmes-ipad-form-grid");
    if(!grid) return;

    const defect=labelByText(grid,"불량수량");
    const packaging=labelByText(grid,"포장형태");
    const remarks=labelByText(grid,"비고");
    if(defect&&packaging&&defect.nextElementSibling!==packaging){
      defect.insertAdjacentElement("afterend",packaging);
    }
    if(remarks){
      remarks.classList.add("wide");
      if(packaging&&packaging.nextElementSibling!==remarks){
        packaging.insertAdjacentElement("afterend",remarks);
      }
    }

    let pair=grid.querySelector(":scope > .qmes-iqc-weight-pair");
    let calculated=pair?.querySelector("label:first-child")||labelByText(grid,"계산중량");
    let barcodeQty=pair?.querySelector("label:last-child")||labelByText(grid,"바코드 발행수량");
    if(calculated&&barcodeQty){
      if(!pair){
        pair=document.createElement("div");
        pair.className="qmes-iqc-weight-pair";
        calculated.parentNode.insertBefore(pair,calculated);
        pair.appendChild(calculated);
        pair.appendChild(barcodeQty);
      }else{
        if(calculated.parentElement!==pair) pair.appendChild(calculated);
        if(barcodeQty.parentElement!==pair) pair.appendChild(barcodeQty);
      }
    }
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  const observer=new MutationObserver(schedule);
  const start=()=>{
    apply();
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener("qmes:data-updated",schedule);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
