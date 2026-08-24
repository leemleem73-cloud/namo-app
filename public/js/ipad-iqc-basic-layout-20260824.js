/* QMES IPAD IQC basic-info layout: requested fixed order */
(function(){
  "use strict";
  if(window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__) return;
  window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__=true;

  const clean=(value)=>String(value||"").replace(/\s+/g," ").trim();

  const style=document.createElement("style");
  style.id="qmes-ipad-iqc-basic-layout-style-20260824";
  style.textContent=`
    .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-top-row,
    .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-pack-row{
      grid-column:1 / -1!important;
      display:grid!important;
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:12px!important;
      width:100%!important;
      min-width:0!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-top-row > *,
    .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-pack-row > *{
      box-sizing:border-box!important;
      min-width:0!important;
      width:100%!important;
      margin:0!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-top-row > .qmes-iqc-pack-title{
      display:flex!important;
      align-items:center!important;
      min-height:100%!important;
      padding:14px 16px!important;
      border-top:2px solid #0ea5e9!important;
      font-weight:800!important;
      color:#0f3b62!important;
    }
    @media(max-width:900px){
      .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-top-row,
      .qmes-ipad-pop .qmes-ipad-form-grid > .qmes-iqc-pack-row{
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
      }
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function labelByText(grid,text){
    return Array.from(grid?.querySelectorAll(":scope > label, :scope > .qmes-iqc-top-row label, :scope > .qmes-iqc-pack-row label")||[])
      .find(label=>clean(label.querySelector("span")?.textContent).startsWith(text));
  }

  function childByText(grid,text){
    return Array.from(grid?.children||[]).find(el=>clean(el.textContent).startsWith(text));
  }

  function apply(){
    const root=document.querySelector(".qmes-ipad-pop");
    if(!root) return;
    const title=clean(root.querySelector(".qmes-ipad-inspection-head h1")?.textContent);
    if(!title.includes("수입검사")) return;

    const grid=root.querySelector(".qmes-ipad-section .qmes-ipad-form-grid");
    if(!grid) return;

    let topRow=grid.querySelector(":scope > .qmes-iqc-top-row");
    let packRow=grid.querySelector(":scope > .qmes-iqc-pack-row");

    let packTitle=topRow?.querySelector(".qmes-iqc-pack-title")||childByText(grid,"포장·바코드 정보");
    let calculated=topRow?.querySelector("label:nth-of-type(1)")||labelByText(grid,"계산중량");
    let barcodeQty=topRow?.querySelector("label:nth-of-type(2)")||labelByText(grid,"바코드 발행수량");

    let recvDate=packRow?.querySelector("label:nth-child(1)")||labelByText(grid,"입고일자");
    let packageQty=packRow?.querySelector("label:nth-child(2)")||labelByText(grid,"입고 포장수량");
    let unitWeight=packRow?.querySelector("label:nth-child(3)")||labelByText(grid,"용기당 중량");

    if(packTitle&&calculated&&barcodeQty){
      if(!topRow){
        topRow=document.createElement("div");
        topRow.className="qmes-iqc-top-row";
      }
      packTitle.classList.add("qmes-iqc-pack-title");
      topRow.append(packTitle,calculated,barcodeQty);
      if(grid.firstElementChild!==topRow) grid.insertBefore(topRow,grid.firstElementChild);
    }

    if(recvDate&&packageQty&&unitWeight){
      if(!packRow){
        packRow=document.createElement("div");
        packRow.className="qmes-iqc-pack-row";
      }
      packRow.append(recvDate,packageQty,unitWeight);
      if(topRow){
        if(topRow.nextElementSibling!==packRow) topRow.insertAdjacentElement("afterend",packRow);
      }else if(grid.firstElementChild!==packRow){
        grid.insertBefore(packRow,grid.firstElementChild);
      }
    }

    /* 아래 항목은 기존 요청 순서 유지: 불량수량 옆 포장형태, 다음 줄 비고 */
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
