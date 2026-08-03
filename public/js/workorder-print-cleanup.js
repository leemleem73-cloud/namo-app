(function(){
  "use strict";
  if(window.__QMES_WORKORDER_PRINT_CLEANUP__) return;
  window.__QMES_WORKORDER_PRINT_CLEANUP__=true;

  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const style=document.createElement("style");
  style.id="qmes-workorder-print-cleanup-style";
  style.textContent=`
    .qmes-workorder-material-clean{table-layout:fixed!important;width:100%!important}
    .qmes-workorder-material-clean th:first-child,
    .qmes-workorder-material-clean td:first-child{
      box-sizing:border-box!important;
      width:22px!important;min-width:22px!important;max-width:22px!important;
      padding-left:0!important;padding-right:0!important;
      white-space:nowrap!important;word-break:keep-all!important;
      writing-mode:horizontal-tb!important;text-orientation:mixed!important;
      text-align:center!important;vertical-align:middle!important;
      font-size:10px!important;line-height:1!important;
    }
    .qmes-workorder-material-clean col:first-child{width:22px!important}

    .qmes-workorder-basic-clean{width:100%!important;table-layout:fixed!important}
    .qmes-workorder-basic-clean th:first-child,
    .qmes-workorder-basic-clean td:first-child,
    .qmes-workorder-basic-clean col:first-child{display:none!important}
    .qmes-workorder-basic-clean th:not(:first-child),
    .qmes-workorder-basic-clean td:not(:first-child){
      box-sizing:border-box!important;width:25%!important;
      text-align:center!important;vertical-align:middle!important;
      padding-left:8px!important;padding-right:8px!important;
    }
    .qmes-workorder-basic-clean col:not(:first-child){width:25%!important}

    .qmes-issued-table-v2{
      width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;
    }
    .qmes-issued-table-v2 th,
    .qmes-issued-table-v2 td{
      box-sizing:border-box!important;
      height:46px!important;
      padding:8px 6px!important;
      text-align:center!important;
      vertical-align:middle!important;
      line-height:20px!important;
      letter-spacing:0!important;
      white-space:nowrap!important;
      font-variant-numeric:tabular-nums!important;
    }
    .qmes-issued-table-v2 th{font-size:12px!important;font-weight:700!important}
    .qmes-issued-table-v2 td{font-size:13px!important}
    .qmes-issued-table-v2 td>*{margin-left:auto!important;margin-right:auto!important}
    .qmes-issued-table-v2 td button,
    .qmes-issued-table-v2 td select{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      text-align:center!important;
    }

    @media print{
      .qmes-workorder-material-clean th:first-child,
      .qmes-workorder-material-clean td:first-child{
        width:22px!important;min-width:22px!important;max-width:22px!important;
        padding-left:0!important;padding-right:0!important;
        writing-mode:horizontal-tb!important;white-space:nowrap!important;
      }
      .qmes-workorder-basic-clean{width:100%!important;table-layout:fixed!important}
      .qmes-workorder-basic-clean th:first-child,
      .qmes-workorder-basic-clean td:first-child,
      .qmes-workorder-basic-clean col:first-child{display:none!important}
      .qmes-workorder-basic-clean th:not(:first-child),
      .qmes-workorder-basic-clean td:not(:first-child){width:25%!important;text-align:center!important}
    }
  `;
  document.head.appendChild(style);

  function isMaterialTable(table){
    const headers=Array.from(table.querySelectorAll("thead th,tr:first-child th"))
      .map(th=>clean(th.textContent)).join("|");
    return /원재료명|원료명/.test(headers)||(/LOT/.test(headers)&&/투입량|기준량|실투입/.test(headers));
  }

  function isBasicInfoTable(table){
    const headers=Array.from(table.querySelectorAll("thead th,tr:first-child th"))
      .map(th=>clean(th.textContent));
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
          if(node.querySelector?.("table")&&clean(node.textContent).startsWith("원재료 투입 계획")){
            block=node;
            break;
          }
          node=node.parentElement;
        }
      }
      if(!block) block=title.parentElement;
      if(block&&block!==root) block.remove();
    });
  }

  function cleanBasicInfoTable(table){
    table.classList.add("qmes-workorder-basic-clean");
    Array.from(table.querySelectorAll("thead th,tr:first-child th")).forEach(header=>{
      if(clean(header.textContent)==="LOT") header.textContent="LOT No.";
    });
  }

  function cleanMaterialTable(table){
    table.classList.add("qmes-workorder-material-clean");
    const firstHeader=table.querySelector("thead th:first-child,tr:first-child th:first-child");
    if(firstHeader) firstHeader.textContent="NO";
    const firstCol=table.querySelector("colgroup col:first-child");
    if(firstCol) firstCol.style.setProperty("width","22px","important");
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
    document.querySelectorAll(".qmes-issued-table-v2").forEach(table=>table.classList.add("qmes-issued-table-aligned"));
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
    requestAnimationFrame(()=>{
      scheduled=false;
      cleanup();
    });
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
    window.print=function(){
      cleanup();
      return previousPrint();
    };
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  schedule();
})();
