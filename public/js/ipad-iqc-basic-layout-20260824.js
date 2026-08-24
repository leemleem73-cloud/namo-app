/* QMES IPAD IQC basic-info layout: fixed visual order without DOM reparenting */
(function(){
  "use strict";
  if(window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__) return;
  window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__=true;

  const clean=(value)=>String(value||"").replace(/\s+/g," ").trim();

  const style=document.createElement("style");
  style.id="qmes-ipad-iqc-basic-layout-style-20260824";
  style.textContent=`
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-ipad-form-grid{
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      align-items:end!important;
    }
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-ipad-form-grid > *{min-width:0!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-order-top-title{order:1!important;grid-column:1!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-order-calculated{order:1!important;grid-column:2!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-order-barcode{order:1!important;grid-column:3!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-order-recv{order:2!important;grid-column:1!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-order-packageqty{order:2!important;grid-column:2!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-order-unitweight{order:2!important;grid-column:3!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-rest{order:10!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-defect{grid-column:auto!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-packaging{grid-column:auto!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-remarks{grid-column:1 / -1!important;width:100%!important;}
    .qmes-ipad-pop.qmes-iqc-layout-ready .qmes-iqc-order-top-title{
      display:flex!important;align-items:center!important;min-height:48px!important;
      padding:14px 16px!important;border-top:2px solid #0ea5e9!important;
      font-weight:800!important;color:#0f3b62!important;
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function labelByText(grid,text){
    return Array.from(grid?.querySelectorAll(":scope > label")||[])
      .find(label=>clean(label.querySelector("span")?.textContent).startsWith(text));
  }

  function childByText(grid,text){
    return Array.from(grid?.children||[]).find(el=>clean(el.textContent).startsWith(text));
  }

  function mark(el,cls){if(el&&!el.classList.contains(cls))el.classList.add(cls);}

  function apply(){
    const root=document.querySelector(".qmes-ipad-pop");
    if(!root) return;
    const title=clean(root.querySelector(".qmes-ipad-inspection-head h1")?.textContent);
    if(!title.includes("수입검사")){root.classList.remove("qmes-iqc-layout-ready");return;}

    const grid=root.querySelector(".qmes-ipad-section .qmes-ipad-form-grid");
    if(!grid) return;

    Array.from(grid.children).forEach(el=>mark(el,"qmes-iqc-rest"));

    const packTitle=childByText(grid,"포장·바코드 정보");
    const calculated=labelByText(grid,"계산중량");
    const barcodeQty=labelByText(grid,"바코드 발행수량");
    const recvDate=labelByText(grid,"입고일자");
    const packageQty=labelByText(grid,"입고 포장수량");
    const unitWeight=labelByText(grid,"용기당 중량");
    const defect=labelByText(grid,"불량수량");
    const packaging=labelByText(grid,"포장형태");
    const remarks=labelByText(grid,"비고");

    mark(packTitle,"qmes-iqc-order-top-title");
    mark(calculated,"qmes-iqc-order-calculated");
    mark(barcodeQty,"qmes-iqc-order-barcode");
    mark(recvDate,"qmes-iqc-order-recv");
    mark(packageQty,"qmes-iqc-order-packageqty");
    mark(unitWeight,"qmes-iqc-order-unitweight");
    mark(defect,"qmes-iqc-defect");
    mark(packaging,"qmes-iqc-packaging");
    mark(remarks,"qmes-iqc-remarks");

    [packTitle,calculated,barcodeQty,recvDate,packageQty,unitWeight].forEach(el=>el?.classList.remove("qmes-iqc-rest"));
    if(remarks) remarks.classList.add("wide");
    root.classList.add("qmes-iqc-layout-ready");
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
