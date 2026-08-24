/* QMES IPAD IQC basic-info layout: packaging next to defect, wide remarks below */
(function(){
  "use strict";
  if(window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__) return;
  window.__QMES_IPAD_IQC_BASIC_LAYOUT_20260824__=true;

  const clean=(value)=>String(value||"").replace(/\s+/g," ").trim();

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
    const calculated=labelByText(grid,"계산중량");
    const barcodeQty=labelByText(grid,"바코드 발행수량");
    if(!defect||!packaging||!remarks) return;

    /* 불량수량 바로 다음 칸 = 포장형태 */
    if(defect.nextElementSibling!==packaging){
      defect.insertAdjacentElement("afterend",packaging);
    }

    /* 그 아래 한 줄 전체 폭 = 비고 */
    remarks.classList.add("wide");
    if(packaging.nextElementSibling!==remarks){
      packaging.insertAdjacentElement("afterend",remarks);
    }

    /* 계산중량 바로 오른쪽 칸 = 바코드 발행수량 */
    if(calculated&&barcodeQty&&calculated.nextElementSibling!==barcodeQty){
      calculated.insertAdjacentElement("afterend",barcodeQty);
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
