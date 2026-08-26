/* NAMO QMES — keep sales table compact: print from sales-order number, no extra print column */
(function(){
  "use strict";
  if(window.__QMES_SALES_PRINT_LINK_CLEAN_20260826__) return;
  window.__QMES_SALES_PRINT_LINK_CLEAN_20260826__=true;

  const style=document.createElement("style");
  style.id="qmes-sales-print-link-clean-style-20260826";
  style.textContent=`
    [data-qmes-sales-print-head="1"],
    [data-qmes-sales-print-cell="1"]{display:none!important}
    .qmes-sales-order-print-link{display:inline!important;border:0!important;background:transparent!important;padding:0!important;margin:0!important;color:#0f172a!important;font:inherit!important;font-weight:900!important;cursor:pointer!important;text-decoration:none!important}
    .qmes-sales-order-print-link:hover{color:#1d4ed8!important;text-decoration:underline!important;text-underline-offset:3px!important}
  `;
  document.head.appendChild(style);

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  function salesRoot(){
    return Array.from(document.querySelectorAll(".qerp")).find(root=>clean(root.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;
  }
  function apply(){
    const root=salesRoot();
    if(!root)return;
    const table=Array.from(root.querySelectorAll("table.qerp-table")).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)));
    if(!table)return;
    table.querySelectorAll("tbody tr").forEach(tr=>{
      const cell=tr.children[0];
      if(!cell)return;
      const id=clean(cell.textContent);
      if(!/^SO-/.test(id))return;
      let button=cell.querySelector(".qmes-sales-order-print-link");
      if(!button){
        cell.textContent="";
        button=document.createElement("button");
        button.type="button";
        button.className="qmes-sales-order-print-link";
        button.title="수주확인서 열기";
        cell.appendChild(button);
      }
      button.textContent=id;
      button.onclick=()=>{
        if(window.qmesSalesPrint?.printOneById){window.qmesSalesPrint.printOneById(id);return;}
        window.alert("출력 모듈을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      };
    });
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
