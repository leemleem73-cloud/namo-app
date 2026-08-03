(function(){
  "use strict";
  if(window.__QMES_WORKORDER_PRINT_CLEANUP__) return;
  window.__QMES_WORKORDER_PRINT_CLEANUP__=true;

  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const style=document.createElement("style");
  style.textContent=`
    .qmes-workorder-material-clean th:first-child,
    .qmes-workorder-material-clean td:first-child{
      box-sizing:border-box!important;width:26px!important;min-width:26px!important;max-width:26px!important;
      padding-left:1px!important;padding-right:1px!important;white-space:nowrap!important;word-break:keep-all!important;
      writing-mode:horizontal-tb!important;text-orientation:mixed!important;text-align:center!important;font-size:10px!important;
    }
    .qmes-workorder-material-clean col:first-child{width:26px!important}
    .qmes-workorder-basic-clean{width:100%!important;table-layout:fixed!important}
    .qmes-workorder-basic-clean th,.qmes-workorder-basic-clean td{
      box-sizing:border-box!important;width:25%!important;text-align:center!important;vertical-align:middle!important;
      padding-left:8px!important;padding-right:8px!important;
    }
    .qmes-workorder-basic-clean col{width:25%!important}
    @media print{
      .qmes-workorder-material-clean th:first-child,
      .qmes-workorder-material-clean td:first-child{
        width:26px!important;min-width:26px!important;max-width:26px!important;padding-left:1px!important;padding-right:1px!important;
        writing-mode:horizontal-tb!important;white-space:nowrap!important;
      }
      .qmes-workorder-basic-clean{width:100%!important;table-layout:fixed!important}
      .qmes-workorder-basic-clean th,.qmes-workorder-basic-clean td{width:25%!important;text-align:center!important}
    }
  `;
  document.head.appendChild(style);

  function isMaterialTable(table){
    const headers=Array.from(table.querySelectorAll("thead th,tr:first-child th")).map(th=>clean(th.textContent)).join("|");
    return /원재료명|원료명/.test(headers)||(/LOT/.test(headers)&&/투입량|기준량|실투입/.test(headers));
  }

  function isBasicInfoTable(table){
    const headers=Array.from(table.querySelectorAll("thead th,tr:first-child th")).map(th=>clean(th.textContent));
    return headers.includes("작업지시번호")&&headers.some(text=>text==="LOT"||text==="LOT No.")&&headers.includes("제품명");
  }

  function removePlan(root){
    root.querySelectorAll(".qmes-iqc2-sec").forEach(section=>{
      if(clean(section.querySelector(".qmes-iqc2-sec-title")?.textContent)==="원재료 투입 계획") section.remove();
    });
    Array.from(root.querySelectorAll("div,section,h1,h2,h3,h4,h5,th,td")).forEach(title=>{
      if(clean(title.textContent)!=="원재료 투입 계획") return;
      let block=title.closest(".qmes-detail-only,.qmes-iqc2-sec,[data-qmes-material-plan]");
      if(!block){
        let node=title.parentElement;
        while(node&&node!==root&&node!==document.body){
          if(node.querySelector?.("table")&&clean(node.textContent).startsWith("원재료 투입 계획")){block=node;break;}
          node=node.parentElement;
        }
      }
      if(!block) block=title.parentElement;
      if(block&&block!==root) block.remove();
    });
  }

  function cleanBasicInfoTable(table){
    if(table.dataset.qmesBasicInfoCleaned!=="1"){
      const headers=Array.from(table.querySelectorAll("thead th,tr:first-child th"));
      const workOrderIndex=headers.findIndex(header=>clean(header.textContent)==="작업지시번호");
      if(workOrderIndex>=0){
        headers[workOrderIndex]?.remove();
        table.querySelectorAll("tbody tr").forEach(row=>row.children[workOrderIndex]?.remove());
        table.querySelector("colgroup")?.children[workOrderIndex]?.remove();
      }
      table.dataset.qmesBasicInfoCleaned="1";
    }
    table.classList.add("qmes-workorder-basic-clean");
    Array.from(table.querySelectorAll("thead th,tr:first-child th")).forEach(header=>{
      if(clean(header.textContent)==="LOT") header.textContent="LOT No.";
    });
    table.querySelectorAll("colgroup col").forEach(col=>{col.style.width="25%";});
  }

  function cleanMaterialTable(table){
    table.classList.add("qmes-workorder-material-clean");
    const firstHeader=table.querySelector("thead th:first-child,tr:first-child th:first-child");
    if(firstHeader) firstHeader.textContent="NO";
    const firstCol=table.querySelector("colgroup col:first-child");
    if(firstCol) firstCol.style.width="26px";
    table.querySelectorAll("small,span,div").forEach(element=>{
      const text=clean(element.textContent);
      if(text==="일반원료"||text==="중간재") element.remove();
    });
    table.querySelectorAll("td").forEach(cell=>{
      Array.from(cell.childNodes).forEach(node=>{
        if(node.nodeType===Node.TEXT_NODE&&/^(일반원료|중간재)$/.test(clean(node.nodeValue))) node.remove();
      });
    });
  }

  function cleanup(){
    const roots=Array.from(document.querySelectorAll(".qmes-wo-viewer,.qmes-wo-cert,[id^='qmes-issued-cert-'],#qmes-print-root"));
    roots.forEach(root=>{
      removePlan(root);
      root.querySelectorAll("table").forEach(table=>{
        if(isBasicInfoTable(table)) cleanBasicInfoTable(table);
        if(isMaterialTable(table)) cleanMaterialTable(table);
      });
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;cleanup();});
  };

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("button");
    if(!button||!/작업지시서\s*(출력|인쇄)|^(출력|인쇄)$/.test(clean(button.textContent))) return;
    cleanup();
    queueMicrotask(cleanup);
    requestAnimationFrame(cleanup);
  },true);

  if(!window.__QMES_WORKORDER_PRINT_WRAPPED__){
    window.__QMES_WORKORDER_PRINT_WRAPPED__=true;
    const previousPrint=window.print.bind(window);
    window.print=function(){cleanup();return previousPrint();};
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  schedule();
})();
