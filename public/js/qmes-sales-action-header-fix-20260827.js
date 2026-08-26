/* NAMO QMES — sales action column guard — 2026-08-27
 * Keeps Edit/Delete visible and places them in the final "비고" column.
 */
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

    const head=table.querySelector("thead tr");
    if(!head) return;

    let actionHead=head.querySelector('[data-qmes-sales-action-head="1"]');
    if(!actionHead){
      actionHead=document.createElement("th");
      actionHead.dataset.qmesSalesActionHead="1";
      head.appendChild(actionHead);
    }
    actionHead.textContent="비고";
    actionHead.setAttribute("aria-label","비고");
    actionHead.style.setProperty("display","table-cell","important");
    actionHead.style.setProperty("text-align","center","important");
    actionHead.style.setProperty("min-width","104px","important");
    actionHead.style.setProperty("width","104px","important");
    actionHead.style.setProperty("white-space","nowrap","important");

    table.querySelectorAll("tbody tr").forEach(tr=>{
      const id=clean(tr.children[0]?.textContent);
      if(!id) return;

      let cell=tr.querySelector('[data-qmes-sales-action-cell="1"]');
      if(!cell){
        cell=document.createElement("td");
        cell.dataset.qmesSalesActionCell="1";
        cell.className="qmes-sales-action-cell";
        tr.appendChild(cell);
      }
      cell.style.setProperty("display","table-cell","important");
      cell.style.setProperty("text-align","center","important");
      cell.style.setProperty("min-width","104px","important");
      cell.style.setProperty("width","104px","important");
      cell.style.setProperty("white-space","nowrap","important");

      let wrap=cell.querySelector(".qmes-sales-action-wrap");
      if(!wrap){
        cell.innerHTML="";
        wrap=document.createElement("div");
        wrap.className="qmes-sales-action-wrap";
        cell.appendChild(wrap);
      }
      wrap.style.setProperty("display","flex","important");
      wrap.style.setProperty("align-items","center","important");
      wrap.style.setProperty("justify-content","center","important");
      wrap.style.setProperty("gap","6px","important");
      wrap.style.setProperty("white-space","nowrap","important");

      let edit=wrap.querySelector(".qmes-sales-edit-btn");
      if(!edit){
        edit=document.createElement("button");
        edit.type="button";
        edit.className="qmes-sales-edit-btn";
        edit.textContent="수정";
        wrap.appendChild(edit);
      }
      edit.dataset.qmesSalesEdit=id;

      let del=wrap.querySelector(".qmes-sales-delete-btn");
      if(!del){
        del=document.createElement("button");
        del.type="button";
        del.className="qmes-sales-delete-btn";
        del.textContent="삭제";
        wrap.appendChild(del);
      }
      del.dataset.salesId=id;
    });
  }

  let queued=false;
  const schedule=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated","qmes:mes-master-ready","qmes:enterprise-ui-ready"].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
})();
