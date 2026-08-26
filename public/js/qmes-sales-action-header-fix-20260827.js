/* NAMO QMES — sales action column guard — 2026-08-27 stable hotfix */
(function(){
  "use strict";
  if(window.__QMES_SALES_ACTION_HEADER_FIX_20260827__) return;
  window.__QMES_SALES_ACTION_HEADER_FIX_20260827__=true;

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();

  function apply(){
    const root=Array.from(document.querySelectorAll(".qerp")).find(el=>clean(el.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리");
    if(!root) return;
    const table=Array.from(root.querySelectorAll("table.qerp-table")).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)));
    if(!table) return;
    const head=table.querySelector("thead tr");if(!head)return;

    let actionHead=head.querySelector('[data-qmes-sales-action-head="1"]');
    if(!actionHead){actionHead=document.createElement("th");actionHead.dataset.qmesSalesActionHead="1";head.appendChild(actionHead);}
    if(actionHead.textContent!=="비고")actionHead.textContent="비고";
    if(actionHead.getAttribute("aria-label")!=="비고")actionHead.setAttribute("aria-label","비고");

    table.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);if(!id)return;
      let cell=tr.querySelector('[data-qmes-sales-action-cell="1"]');
      if(!cell){cell=document.createElement("td");cell.dataset.qmesSalesActionCell="1";cell.className="qmes-sales-action-cell";tr.appendChild(cell);}
      let wrap=cell.querySelector(".qmes-sales-action-wrap");
      if(!wrap){cell.innerHTML="";wrap=document.createElement("div");wrap.className="qmes-sales-action-wrap";cell.appendChild(wrap);}
      let edit=wrap.querySelector(".qmes-sales-edit-btn");
      if(!edit){edit=document.createElement("button");edit.type="button";edit.className="qmes-sales-edit-btn";edit.textContent="수정";wrap.appendChild(edit);}
      if(edit.dataset.qmesSalesEdit!==id)edit.dataset.qmesSalesEdit=id;
      let del=wrap.querySelector(".qmes-sales-delete-btn");
      if(!del){del=document.createElement("button");del.type="button";del.className="qmes-sales-delete-btn";del.textContent="삭제";wrap.appendChild(del);}
      if(del.dataset.salesId!==id)del.dataset.salesId=id;
    });
  }

  const run=()=>setTimeout(apply,0);
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated","qmes:mes-master-ready","qmes:enterprise-ui-ready"].forEach(name=>window.addEventListener(name,run));
  const boot=()=>[0,300,900,1800].forEach(ms=>setTimeout(apply,ms));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
