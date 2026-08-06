(function(){
  "use strict";
  if(window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX_V4__) return;
  window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX_V4__=true;

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
    .qmes-iqc-ledger-table{width:100%!important;table-layout:fixed!important}
    .qmes-iqc-ledger-table th,.qmes-iqc-ledger-table td{box-sizing:border-box!important;padding:11px 10px!important;text-align:center!important;vertical-align:middle!important;line-height:20px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .qmes-iqc-ledger-table th{font-weight:700!important;letter-spacing:0!important}
    .qmes-iqc-ledger-table th:nth-child(1),.qmes-iqc-ledger-table td:nth-child(1){width:12%!important}
    .qmes-iqc-ledger-table th:nth-child(2),.qmes-iqc-ledger-table td:nth-child(2){width:15%!important}
    .qmes-iqc-ledger-table th:nth-child(3),.qmes-iqc-ledger-table td:nth-child(3){width:14%!important}
    .qmes-iqc-ledger-table th:nth-child(4),.qmes-iqc-ledger-table td:nth-child(4){width:17%!important}
    .qmes-iqc-ledger-table th:nth-child(5),.qmes-iqc-ledger-table td:nth-child(5){width:10%!important}
    .qmes-iqc-ledger-table th:nth-child(6),.qmes-iqc-ledger-table td:nth-child(6){width:9%!important}
    .qmes-iqc-ledger-table th:nth-child(7),.qmes-iqc-ledger-table td:nth-child(7){width:23%!important}
    .qmes-iqc-ledger-table .qmes-iqc-manage-inline{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;white-space:nowrap!important}
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

  function findLedger(){return document.querySelector(".qmes-iqc-ledger-table");}

  function findRecordByRow(row){
    const records=Array.isArray(window.DB?.iqc)?window.DB.iqc:[];
    return records.find(record=>clean(record.lot)&&clean(row.textContent).includes(clean(record.lot)));
  }

  function reorderLedger(table){
    const headerRow=table.tHead?.rows?.[0];
    const tbody=table.tBodies?.[0];
    if(!headerRow||!tbody)return;
    const headers=[...headerRow.cells].map(cell=>clean(cell.textContent));
    const desired="입고일자|원재료명|업체명|LOT No.|검사자|판정|관리";
    if(headers.join("|")===desired)return;

    const indexOf=pattern=>headers.findIndex(text=>pattern.test(text));
    const order=[indexOf(/검사일|입고일자/),indexOf(/원재료명/),indexOf(/업체명/),indexOf(/LOT No\./i),indexOf(/검사자/),indexOf(/판정/),indexOf(/관리/)];
    if(order.some(index=>index<0))return;

    const titles=desired.split("|");
    const headerCells=[...headerRow.cells];
    order.forEach((index,position)=>{const cell=headerCells[index];cell.textContent=titles[position];headerRow.appendChild(cell);});

    [...tbody.rows].forEach(row=>{
      if(row.querySelector(".qmes-iqc-empty-row"))return;
      const cells=[...row.cells];
      const record=findRecordByRow(row);
      if(record&&cells[order[0]])cells[order[0]].textContent=clean(record.recv||record.inspectedAt||"-").slice(0,10);
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
    currentPage=Math.min(Math.max(1,currentPage),totalPages);
    rows.forEach((row,index)=>row.classList.toggle("qmes-page-hidden",!(index>=(currentPage-1)*PAGE_SIZE&&index<currentPage*PAGE_SIZE)));

    const container=table.closest(".qmes-iqc-ledger-container")||table.parentElement;
    let pager=container?.querySelector(":scope > .qmes-iqc-native-pager");
    if(!pager&&container){pager=document.createElement("div");pager.className="qmes-iqc-native-pager";pager.style.cssText="display:flex;justify-content:center;align-items:center;gap:7px;margin:14px 0 2px;position:relative;z-index:50;pointer-events:auto;";container.appendChild(pager);}
    if(!pager)return;
    pager.replaceChildren();
    pager.style.display=totalPages>1?"flex":"none";
    if(totalPages<=1)return;

    const make=(label,page,disabled,active)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=label;button.disabled=disabled;
      button.style.cssText=`min-width:34px;height:32px;padding:0 10px;border:1px solid ${active?"#38bdf8":"#475569"};border-radius:7px;background:${active?"#0c4a6e":"#172033"};color:#e2e8f0;font-size:12px;font-weight:800;cursor:${disabled?"default":"pointer"};opacity:${disabled?".45":"1"};pointer-events:auto;`;
      button.onpointerdown=event=>{event.preventDefault();event.stopPropagation();};
      button.onclick=event=>{event.preventDefault();event.stopPropagation();if(disabled)return;currentPage=page;ensurePager();};
      return button;
    };
    pager.appendChild(make("이전",currentPage-1,currentPage===1,false));
    for(let page=1;page<=totalPages;page++)pager.appendChild(make(String(page),page,false,page===currentPage));
    pager.appendChild(make("다음",currentPage+1,currentPage===totalPages,false));
  }

  document.addEventListener("click",event=>{if(!event.target.closest?.(".qmes-iqc-modal-save"))return;currentPage=1;setTimeout(()=>{try{typeof window.dbSave==="function"&&window.dbSave();}catch(_){}ensurePager();},120);},true);
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;installPullMerge();ensurePager();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",schedule);
  installPullMerge();ensurePager();
})();
