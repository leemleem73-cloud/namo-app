/* ============================================================================
   NAMO QMES WORK ORDER PRINT FIT — 2026-08-26
   Work-order-only print wrapper.
   The shared printDoc() scales most documents by width only. A work order can be
   taller than A4, so its barcode/approval/footer is clipped by the global 296mm
   one-page guard. This wrapper fits BOTH width and height and removes the extra
   12mm inspection-report top offset for work orders only.
   Other IQC/PQC/OQC/CoA printing continues to use the original printDoc().
   ============================================================================ */
(function installWorkOrderPrintFit(global){
  "use strict";
  if(global.__QMES_WORKORDER_PRINT_FIT_20260826__) return;
  global.__QMES_WORKORDER_PRINT_FIT_20260826__=true;

  const MM_TO_PX=96/25.4;
  const PAGE_W=210*MM_TO_PX;
  const PAGE_H_SAFE=296*MM_TO_PX; // matches public/css/print.css one-page guard
  const MARGIN=5*MM_TO_PX;
  const BOTTOM_SAFETY=3*MM_TO_PX;

  function isElement(value){
    return typeof Element!=="undefined" && value instanceof Element;
  }

  function resolveSource(sourceEl){
    if(isElement(sourceEl)) return sourceEl;
    return Array.from(document.querySelectorAll(".doc-paper"))
      .find(el=>el.offsetParent!==null && el.id!=="qmes-label-print-root") || null;
  }

  function cloneWithScreenStyles(source){
    if(typeof global.qmesCloneWithScreenStyles==="function"){
      try{return global.qmesCloneWithScreenStyles(source);}catch(_error){}
    }
    const clone=source.cloneNode(true);
    const sourceNodes=[source,...source.querySelectorAll("*")];
    const cloneNodes=[clone,...clone.querySelectorAll("*")];
    sourceNodes.forEach((node,index)=>{
      const cloned=cloneNodes[index];
      if(!cloned || node.nodeType!==1) return;
      try{
        const computed=global.getComputedStyle(node);
        for(let i=0;i<computed.length;i+=1){
          const prop=computed[i];
          cloned.style.setProperty(prop,computed.getPropertyValue(prop),"important");
        }
      }catch(_error){}
    });
    clone.setAttribute("data-qmes-screen-print","true");
    return clone;
  }

  function copyCanvasPixels(source,clone){
    const src=source.querySelectorAll("canvas");
    const dst=clone.querySelectorAll("canvas");
    src.forEach((canvas,index)=>{
      const target=dst[index];
      if(!target) return;
      try{
        target.width=canvas.width;
        target.height=canvas.height;
        target.getContext("2d").drawImage(canvas,0,0);
      }catch(_error){}
    });
  }

  function printWorkOrder(source){
    const printRoot=document.getElementById("qmes-print-root");
    if(!source || !printRoot){
      global.alert("인쇄할 작업지시서 내용을 찾을 수 없습니다.");
      return;
    }

    const rect=source.getBoundingClientRect();
    if(!rect.width || !rect.height) return false;

    const clone=cloneWithScreenStyles(source);
    clone.classList.add("qmes-a4-preview-clone","qmes-workorder-a4-fit");
    copyCanvasPixels(source,clone);

    clone.querySelectorAll("button, .qmes-modal-close, .qmes-print-actions, [data-no-print='true']")
      .forEach(el=>el.remove());

    [clone,...clone.querySelectorAll("*")].forEach(el=>{
      try{
        el.style.setProperty("-webkit-print-color-adjust","exact","important");
        el.style.setProperty("print-color-adjust","exact","important");
      }catch(_error){}
    });

    const availW=PAGE_W-(MARGIN*2);
    const availH=PAGE_H_SAFE-(MARGIN*2)-BOTTOM_SAFETY;
    const scale=Math.min(availW/rect.width,availH/rect.height,1);

    /* zoom changes the actual layout box, unlike transform, so Chrome print
       pagination sees the reduced work-order size instead of clipping it. */
    clone.style.setProperty("width",rect.width+"px","important");
    clone.style.setProperty("max-width",rect.width+"px","important");
    clone.style.setProperty("margin","0","important");
    clone.style.setProperty("box-shadow","none","important");
    clone.style.setProperty("transform","none","important");
    clone.style.setProperty("transform-origin","top left","important");
    clone.style.setProperty("zoom",String(scale),"important");
    clone.style.setProperty("page-break-inside","avoid","important");
    clone.style.setProperty("break-inside","avoid-page","important");

    const stage=document.createElement("div");
    stage.className="qmes-screen-print-stage qmes-workorder-print-stage";
    stage.style.setProperty("width",(rect.width*scale)+"px","important");
    stage.style.setProperty("height",(rect.height*scale)+"px","important");
    stage.style.setProperty("max-height",availH+"px","important");
    stage.style.setProperty("margin",MARGIN+"px auto 0","important");
    stage.style.setProperty("padding","0","important");
    stage.style.setProperty("overflow","visible","important");
    stage.style.setProperty("break-inside","avoid-page","important");
    stage.style.setProperty("page-break-inside","avoid","important");
    stage.appendChild(clone);

    printRoot.innerHTML="";
    printRoot.appendChild(stage);

    document.body.classList.remove("print-label","print-doc");
    document.body.classList.add("qmes-screen-exact-print","qmes-workorder-print-active");

    let cleaned=false;
    const cleanup=()=>{
      if(cleaned) return;
      cleaned=true;
      document.body.classList.remove("qmes-screen-exact-print","qmes-workorder-print-active");
      printRoot.innerHTML="";
      global.removeEventListener("afterprint",cleanup);
    };

    global.addEventListener("afterprint",cleanup);
    global.requestAnimationFrame(()=>global.requestAnimationFrame(()=>{
      global.print();
      global.setTimeout(cleanup,1800);
    }));
    return true;
  }

  function install(){
    const current=global.printDoc;
    if(typeof current!=="function") return false;
    if(current.__qmesWorkOrderFitWrapper) return true;

    const original=current;
    const wrapped=function(sourceEl){
      const source=resolveSource(sourceEl);
      if(source && source.classList.contains("qmes-wo-cert")){
        return printWorkOrder(source);
      }
      return original.apply(this,arguments);
    };
    wrapped.__qmesWorkOrderFitWrapper=true;
    wrapped.__qmesOriginalPrintDoc=original;

    global.printDoc=wrapped;
    try{ printDoc=wrapped; }catch(_error){}
    return true;
  }

  /* This file can load before common.jsx. Keep checking until the shared printDoc
     function exists, and re-wrap if another late script replaces it. */
  let ticks=0;
  const timer=global.setInterval(()=>{
    ticks+=1;
    install();
    if(ticks>=120) global.clearInterval(timer);
  },100);
  if(document.readyState!=="loading") install();
  else document.addEventListener("DOMContentLoaded",install,{once:true});
})(window);
