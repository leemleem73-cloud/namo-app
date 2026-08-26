/* ============================================================================
   NAMO QMES GLOBAL PRINT RESTORE — 2026-08-26
   Restores the original concept: print a clean DOM clone and let common.css /
   print.css @media print rules create the output. Do NOT copy computed screen
   styles into the print clone. Applies to work orders and all inspection reports.
   ============================================================================ */
(function(global){
  "use strict";
  if(global.__QMES_GLOBAL_PRINT_RESTORE_20260826__) return;
  global.__QMES_GLOBAL_PRINT_RESTORE_20260826__=true;

  function copyCanvas(source, clone){
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

  function resolveSource(sourceEl){
    if(sourceEl instanceof Element) return sourceEl;
    return Array.from(document.querySelectorAll(".doc-paper"))
      .find(el=>el.offsetParent!==null && el.id!=="qmes-label-print-root") || null;
  }

  function legacyPrintDoc(sourceEl){
    const source=resolveSource(sourceEl);
    const printRoot=document.getElementById("qmes-print-root");
    if(!source||!printRoot){
      global.alert("인쇄할 문서를 찾을 수 없습니다.");
      return;
    }

    const clone=source.cloneNode(true);
    clone.classList.add("qmes-print-clean-clone");
    clone.classList.remove("qmes-screen-print-copy","qmes-a4-preview-clone","qmes-workorder-a4-fit");
    clone.removeAttribute("data-qmes-screen-print");

    /* Never print modal/action controls. */
    clone.querySelectorAll("button,.qmes-modal-close,.qmes-print-actions,[data-no-print='true']")
      .forEach(el=>el.remove());

    /* Screen-only inline geometry should not leak into print layout. */
    [clone,...clone.querySelectorAll("*")].forEach(el=>{
      if(!(el instanceof HTMLElement)) return;
      ["transform","zoom","position","left","right","top","bottom","max-height","overflow"].forEach(prop=>{
        try{el.style.removeProperty(prop);}catch(_error){}
      });
    });

    copyCanvas(source,clone);
    printRoot.innerHTML="";
    printRoot.appendChild(clone);

    document.body.classList.remove("print-label","qmes-screen-exact-print","qmes-workorder-print-active","qmes-direct-workorder-print-pending");
    document.body.classList.add("print-doc","qmes-legacy-print-active");

    let cleaned=false;
    const cleanup=()=>{
      if(cleaned) return;
      cleaned=true;
      document.body.classList.remove("print-doc","qmes-legacy-print-active","qmes-direct-workorder-print-pending");
      printRoot.innerHTML="";
      global.removeEventListener("afterprint",cleanup);
    };
    global.addEventListener("afterprint",cleanup);

    global.requestAnimationFrame(()=>global.requestAnimationFrame(()=>{
      global.print();
      global.setTimeout(cleanup,2500);
    }));
  }

  legacyPrintDoc.__qmesLegacyRestore=true;

  function install(){
    if(global.printDoc===legacyPrintDoc) return true;
    global.printDoc=legacyPrintDoc;
    try{printDoc=legacyPrintDoc;}catch(_error){}
    return true;
  }

  /* common.jsx and late patches can replace printDoc. Re-assert this implementation. */
  let ticks=0;
  const timer=global.setInterval(()=>{
    ticks+=1;
    install();
    if(ticks>=180) global.clearInterval(timer);
  },100);
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();

  /* Work-order list: hide intermediate preview and automatically press its internal
     print button after React renders it. The explicit Preview button is hidden by CSS. */
  document.addEventListener("click",event=>{
    const btn=event.target.closest?.(".qmes-workorder-actions .qmes-manage-btn.print");
    if(!btn) return;
    document.body.classList.add("qmes-direct-workorder-print-pending");
    let tries=0;
    const wait=global.setInterval(()=>{
      tries+=1;
      const modal=document.querySelector(".qmes-wo-output-preview");
      if(modal){
        const printButton=Array.from(modal.querySelectorAll("button")).find(b=>String(b.textContent||"").trim().includes("인쇄"));
        if(printButton){
          global.clearInterval(wait);
          printButton.click();
          /* close the hidden React modal after print has been initiated */
          global.setTimeout(()=>{
            const close=modal.querySelector(".qmes-modal-close");
            close?.click();
            document.body.classList.remove("qmes-direct-workorder-print-pending");
          },500);
          return;
        }
      }
      if(tries>=40){
        global.clearInterval(wait);
        document.body.classList.remove("qmes-direct-workorder-print-pending");
      }
    },50);
  },true);
})(window);
