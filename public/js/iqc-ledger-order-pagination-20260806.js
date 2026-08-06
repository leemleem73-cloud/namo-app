(function(){
  "use strict";
  if(window.__QMES_IQC_LEDGER_ORDER_PAGINATION_20260806__) return;
  window.__QMES_IQC_LEDGER_ORDER_PAGINATION_20260806__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const PAGE_SIZE=10;
  let currentPage=1;

  function forceIqcNavigation(button){
    try{
      sessionStorage.setItem("qmes_lot_link_pending","1");
      sessionStorage.setItem("qmes_lot_link_material_lot",button.dataset.lot||"");
      sessionStorage.setItem("qmes_lot_link_material_name",button.dataset.name||"");
      sessionStorage.setItem("qmes_lot_link_supplier",button.dataset.supplier||"");
      sessionStorage.setItem("qmes_current_tab","iqc");
      sessionStorage.setItem("qmes_open_menu","qualityMenu");
    }catch(_){}
    window.location.reload();
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.(".qmes-lot-iqc-link-btn");
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    forceIqcNavigation(button);
  },true);

  function findLedgerTable(){
    return Array.from(document.querySelectorAll("table")).find(table=>{
      const headers=Array.from(table.querySelectorAll("thead th")).map(th=>clean(th.textContent));
      return headers.some(text=>/LOT No\.|LOT번호|원료 LOT/i.test(text))&&headers.some(text=>/업체명|공급사/.test(text))&&headers.some(text=>/원재료명|품명/.test(text));
    });
  }

  function reorderRow(row,indexes,orderedIndexes){
    const cells=Array.from(row.children);
    if(!cells.length) return;
    const ordered=orderedIndexes.map(i=>cells[i]).filter(Boolean);
    const rest=cells.filter((_,i)=>!orderedIndexes.includes(i));
    [...ordered,...rest].forEach(cell=>row.appendChild(cell));
  }

  function reorderLedger(table){
    const headers=Array.from(table.querySelectorAll("thead th")).map(th=>clean(th.textContent));
    const idxDate=headers.findIndex(text=>/입고일자|입고일|입고일시/.test(text));
    const idxName=headers.findIndex(text=>/원재료명|^품명$/.test(text));
    const idxSupplier=headers.findIndex(text=>/업체명|공급사/.test(text));
    const idxLot=headers.findIndex(text=>/LOT No\.|LOT번호|원료 LOT/i.test(text));
    if([idxDate,idxName,idxSupplier,idxLot].some(i=>i<0)) return;
    const ordered=[idxDate,idxName,idxSupplier,idxLot];
    reorderRow(table.querySelector("thead tr"),headers,ordered);
    Array.from(table.querySelectorAll("tbody tr")).forEach(row=>reorderRow(row,headers,ordered));
    table.dataset.qmesIqcOrderApplied="1";
  }

  function ensurePager(table){
    const rows=Array.from(table.querySelectorAll("tbody tr"));
    const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    if(currentPage>totalPages) currentPage=totalPages;
    rows.forEach((row,index)=>{row.style.display=(index>=(currentPage-1)*PAGE_SIZE&&index<currentPage*PAGE_SIZE)?"":"none";});

    let pager=table.parentElement?.querySelector(":scope > .qmes-iqc-pager");
    if(!pager){
      pager=document.createElement("div");
      pager.className="qmes-iqc-pager";
      pager.style.cssText="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;";
      table.parentElement?.appendChild(pager);
    }
    pager.innerHTML="";
    if(totalPages<=1){pager.style.display="none";return;}
    pager.style.display="flex";

    const make=(label,page,disabled=false)=>{
      const button=document.createElement("button");
      button.type="button";
      button.textContent=label;
      button.disabled=disabled;
      button.style.cssText="min-width:34px;height:32px;padding:0 10px;border:1px solid #475569;border-radius:7px;background:#172033;color:#e2e8f0;font-size:12px;font-weight:800;cursor:pointer;";
      if(disabled) button.style.opacity=".45";
      if(page===currentPage&&!disabled){button.style.background="#0f3b5c";button.style.borderColor="#38bdf8";}
      button.onclick=()=>{currentPage=page;ensurePager(table);};
      return button;
    };

    pager.appendChild(make("이전",Math.max(1,currentPage-1),currentPage===1));
    for(let page=1;page<=totalPages;page++) pager.appendChild(make(String(page),page,false));
    pager.appendChild(make("다음",Math.min(totalPages,currentPage+1),currentPage===totalPages));
  }

  function apply(){
    const table=findLedgerTable();
    if(!table) return;
    if(table.dataset.qmesIqcOrderApplied!=="1") reorderLedger(table);
    ensurePager(table);
  }

  let queued=false;
  const schedule=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",schedule);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
