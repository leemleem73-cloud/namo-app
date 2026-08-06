(function(){
  "use strict";
  if(window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX_V3__) return;
  window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX_V3__=true;

  const PAGE_SIZE=5;
  let currentPage=1;
  const clean=value=>String(value||"").trim();
  const rowKey=row=>clean(row?.inNo)||[clean(row?.recv),clean(row?.lot),clean(row?.name),clean(row?.supplier)].join("|");
  const dateValue=row=>clean(row?.recv||row?.inspectedAt||"");

  const style=document.createElement("style");
  style.id="qmes-iqc-auto-select-width-fix";
  style.textContent=`
    .qmes-iqc-inno-row{display:grid!important;grid-template-columns:92px minmax(0,1fr)!important;gap:8px!important;align-items:center!important}
    .qmes-iqc-inno-row select{width:92px!important;min-width:92px!important;padding-left:12px!important;padding-right:28px!important;text-align:left!important;text-overflow:clip!important;white-space:nowrap!important;overflow:visible!important}
    .qmes-iqc-inno-row option{white-space:nowrap!important}
    .qmes-iqc-ledger-table tr.qmes-page-hidden{display:none!important}
  `;
  document.head.appendChild(style);

  function mergeRows(remoteRows,localRows){
    const map=new Map();
    [...(Array.isArray(remoteRows)?remoteRows:[]),...(Array.isArray(localRows)?localRows:[])].forEach(row=>{
      const key=rowKey(row);
      if(!key)return;
      map.set(key,{...(map.get(key)||{}),...row});
    });
    return [...map.values()].sort((a,b)=>dateValue(b).localeCompare(dateValue(a))||rowKey(b).localeCompare(rowKey(a)));
  }

  function installPullMerge(){
    const original=window.qmesSyncPullInspection;
    if(typeof original!=="function"||original.__qmesIqcMergeWrapped)return false;
    const wrapped=async function(type,localRows){
      const remote=await original.apply(this,arguments);
      if(String(type).toLowerCase()!=="iqc")return remote;
      const current=Array.isArray(window.DB?.iqc)?window.DB.iqc:[];
      const merged=mergeRows(remote,mergeRows(localRows,current));
      if(window.DB)window.DB.iqc=merged;
      try{typeof window.dbSave==="function"&&window.dbSave();}catch(_){}
      return merged;
    };
    wrapped.__qmesIqcMergeWrapped=true;
    window.qmesSyncPullInspection=wrapped;
    return true;
  }

  function findLedger(){
    return document.querySelector(".qmes-iqc-ledger-table");
  }

  function findRecordByRow(row){
    const cells=[...row.cells];
    const lot=clean(cells.find(cell=>/^[A-Za-z0-9_.\/-]{2,}$/.test(clean(cell.textContent))&&clean(cell.textContent)!=="합격"&&clean(cell.textContent)!=="불합격")?.textContent);
    const records=Array.isArray(window.DB?.iqc)?window.DB.iqc:[];
    return records.find(record=>clean(record.lot)===lot)||records.find(record=>row.textContent.includes(clean(record.lot))&&clean(record.lot));
  }

  function reorderLedger(table){
    const headerRow=table.tHead?.rows?.[0];
    if(!headerRow)return;
    const headers=[...headerRow.cells].map(cell=>clean(cell.textContent));
    if(headers.join("|")==="입고일자|원재료명|업체명|LOT No.|검사자|판정|관리")return;

    const indexOf=pattern=>headers.findIndex(text=>pattern.test(text));
    const idxDate=indexOf(/검사일|입고일자/);
    const idxLot=indexOf(/LOT No\./i);
    const idxSupplier=indexOf(/업체명/);
    const idxName=indexOf(/원재료명/);
    const idxJudge=indexOf(/판정/);
    const idxInspector=indexOf(/검사자/);
    const idxManage=indexOf(/관리/);
    const order=[idxDate,idxName,idxSupplier,idxLot,idxInspector,idxJudge,idxManage];
    if(order.some(index=>index<0))return;

    const newTitles=["입고일자","원재료명","업체명","LOT No.","검사자","판정","관리"];
    const headerCells=[...headerRow.cells];
    order.forEach((index,position)=>{
      const cell=headerCells[index];
      cell.textContent=newTitles[position];
      headerRow.appendChild(cell);
    });

    [...table.tBodies[0].rows].forEach(row=>{
      if(row.querySelector(".qmes-iqc-empty-row"))return;
      const cells=[...row.cells];
      const record=findRecordByRow(row);
      if(record&&cells[idxDate])cells[idxDate].textContent=clean(record.recv||record.inspectedAt||"-").slice(0,10);
      order.forEach(index=>row.appendChild(cells[index]));
    });
  }

  function ensurePager(){
    const table=findLedger();
    if(!table)return;
    reorderLedger(table);
    const tbody=table.tBodies?.[0];
    if(!tbody)return;
    const rows=[...tbody.rows].filter(row=>!row.querySelector(".qmes-iqc-empty-row"));
    const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    if(currentPage>totalPages)currentPage=totalPages;

    rows.forEach((row,index)=>{
      const visible=index>=(currentPage-1)*PAGE_SIZE&&index<currentPage*PAGE_SIZE;
      row.classList.toggle("qmes-page-hidden",!visible);
    });

    const container=table.closest(".qmes-iqc-ledger-container")||table.parentElement;
    let pager=container?.querySelector(":scope > .qmes-iqc-native-pager");
    if(!pager&&container){
      pager=document.createElement("div");
      pager.className="qmes-iqc-native-pager";
      pager.style.cssText="display:flex;justify-content:center;align-items:center;gap:7px;margin:14px 0 2px;position:relative;z-index:20;";
      container.appendChild(pager);
    }
    if(!pager)return;
    pager.replaceChildren();
    pager.style.display=totalPages>1?"flex":"none";
    if(totalPages<=1)return;

    const make=(label,page,disabled,active)=>{
      const button=document.createElement("button");
      button.type="button";
      button.textContent=label;
      button.dataset.page=String(page);
      button.disabled=disabled;
      button.style.cssText=`min-width:34px;height:32px;padding:0 10px;border:1px solid ${active?"#38bdf8":"#475569"};border-radius:7px;background:${active?"#0c4a6e":"#172033"};color:#e2e8f0;font-size:12px;font-weight:800;cursor:${disabled?"default":"pointer"};opacity:${disabled?".45":"1"};pointer-events:auto;`;
      button.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if(disabled)return;
        currentPage=page;
        ensurePager();
      },true);
      return button;
    };

    pager.appendChild(make("이전",Math.max(1,currentPage-1),currentPage===1,false));
    for(let page=1;page<=totalPages;page++)pager.appendChild(make(String(page),page,false,page===currentPage));
    pager.appendChild(make("다음",Math.min(totalPages,currentPage+1),currentPage===totalPages,false));
  }

  function persistAfterSave(event){
    const button=event.target.closest?.(".qmes-iqc-modal-save");
    if(!button)return;
    currentPage=1;
    setTimeout(()=>{
      try{typeof window.dbSave==="function"&&window.dbSave();}catch(_){}
      ensurePager();
    },120);
  }

  document.addEventListener("click",persistAfterSave,true);
  const observer=new MutationObserver(()=>{installPullMerge();requestAnimationFrame(ensurePager);});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",()=>{installPullMerge();ensurePager();});
  installPullMerge();
  ensurePager();
})();
