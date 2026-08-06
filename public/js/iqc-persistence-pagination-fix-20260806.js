(function(){
  "use strict";
  if(window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX_V6__) return;
  window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX_V6__=true;

  const PAGE_SIZE=5;
  let currentPage=1;
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const rowKey=row=>clean(row?.inNo)||[clean(row?.recv),clean(row?.lot),clean(row?.name),clean(row?.supplier)].join("|");
  const dateValue=row=>clean(row?.recv||row?.inspectedAt||"");
  const datePattern=/^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/;

  const style=document.createElement("style");
  style.id="qmes-iqc-table-native-fix-v6";
  style.textContent=`
    .qmes-iqc-inno-row{display:grid!important;grid-template-columns:92px minmax(0,1fr)!important;gap:8px!important;align-items:center!important}
    .qmes-iqc-inno-row select{width:92px!important;min-width:92px!important;padding-left:12px!important;padding-right:28px!important;text-align:left!important;text-overflow:clip!important;white-space:nowrap!important;overflow:visible!important}
    .qmes-iqc-inno-row option{white-space:nowrap!important}
    .qmes-iqc-ledger-table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
    .qmes-iqc-ledger-table col:nth-child(1){width:13%!important}
    .qmes-iqc-ledger-table col:nth-child(2){width:15%!important}
    .qmes-iqc-ledger-table col:nth-child(3){width:14%!important}
    .qmes-iqc-ledger-table col:nth-child(4){width:16%!important}
    .qmes-iqc-ledger-table col:nth-child(5){width:10%!important}
    .qmes-iqc-ledger-table col:nth-child(6){width:9%!important}
    .qmes-iqc-ledger-table col:nth-child(7){width:23%!important}
    .qmes-iqc-ledger-table th,.qmes-iqc-ledger-table td{box-sizing:border-box!important;text-align:center!important;vertical-align:middle!important;padding:10px 8px!important;line-height:20px!important;letter-spacing:0!important;white-space:nowrap!important}
    .qmes-iqc-ledger-table th{font-weight:700!important}
    .qmes-iqc-ledger-table td{overflow:hidden!important;text-overflow:ellipsis!important}
    .qmes-iqc-manage-inline{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;white-space:nowrap!important}
    .qmes-iqc-native-pager{display:flex;justify-content:center;align-items:center;gap:7px;margin:14px 0 2px;position:relative;z-index:9999;pointer-events:auto!important}
    .qmes-iqc-native-pager button{pointer-events:auto!important;position:relative!important;z-index:10000!important}
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
  function headerMap(table){
    const headers=[...(table.tHead?.rows?.[0]?.cells||[])].map(cell=>clean(cell.textContent));
    const find=pattern=>headers.findIndex(text=>pattern.test(text));
    return {headers,date:find(/검사일|입고일자/),name:find(/원재료명/),supplier:find(/업체명/),lot:find(/LOT No\./i),inspector:find(/검사자/),judge:find(/판정/),manage:find(/관리/)};
  }

  function captureDate(row,dateIndex){
    if(row.dataset.qmesRecvDate)return row.dataset.qmesRecvDate;
    const visible=clean(row.cells[dateIndex]?.textContent).slice(0,10);
    if(datePattern.test(visible)){
      row.dataset.qmesRecvDate=visible.replace(/[./]/g,"-");
      return row.dataset.qmesRecvDate;
    }
    const lot=clean([...row.cells].find(cell=>/^[A-Za-z0-9_.\/-]{2,}$/.test(clean(cell.textContent))&&!datePattern.test(clean(cell.textContent)))?.textContent);
    const record=(Array.isArray(window.DB?.iqc)?window.DB.iqc:[]).find(item=>lot&&clean(item.lot)===lot);
    const stored=clean(record?.recv||record?.inspectedAt||"").slice(0,10);
    if(stored){row.dataset.qmesRecvDate=stored;return stored;}
    return visible||"-";
  }

  function normalizeLedger(table){
    const headerRow=table.tHead?.rows?.[0];
    const tbody=table.tBodies?.[0];
    if(!headerRow||!tbody)return;
    const map=headerMap(table);
    if([map.date,map.name,map.supplier,map.lot,map.inspector,map.judge,map.manage].some(i=>i<0))return;

    [...tbody.rows].forEach(row=>{
      if(row.querySelector(".qmes-iqc-empty-row"))return;
      captureDate(row,map.date);
    });

    const targetTitles=["입고일자","원재료명","업체명","LOT No.","검사자","판정","관리"];
    if(map.headers.join("|")!==targetTitles.join("|")){
      const order=[map.date,map.name,map.supplier,map.lot,map.inspector,map.judge,map.manage];
      const headerCells=[...headerRow.cells];
      order.forEach((index,position)=>{const cell=headerCells[index];cell.textContent=targetTitles[position];headerRow.appendChild(cell);});
      [...tbody.rows].forEach(row=>{
        if(row.querySelector(".qmes-iqc-empty-row"))return;
        const cells=[...row.cells];
        order.forEach(index=>row.appendChild(cells[index]));
      });
    }

    [...tbody.rows].forEach(row=>{
      if(row.querySelector(".qmes-iqc-empty-row"))return;
      const date=row.dataset.qmesRecvDate||"-";
      if(row.cells[0])row.cells[0].textContent=date;
    });
  }

  function ensurePager(){
    const table=findLedger();
    if(!table)return;
    normalizeLedger(table);
    const tbody=table.tBodies?.[0];
    if(!tbody)return;
    const rows=[...tbody.rows].filter(row=>!row.querySelector(".qmes-iqc-empty-row"));
    const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    currentPage=Math.min(Math.max(1,currentPage),totalPages);
    rows.forEach((row,index)=>{
      const visible=index>=(currentPage-1)*PAGE_SIZE&&index<currentPage*PAGE_SIZE;
      row.style.setProperty("display",visible?"table-row":"none","important");
    });

    const container=table.closest(".qmes-iqc-ledger-container")||table.parentElement;
    let pager=container?.querySelector(":scope > .qmes-iqc-native-pager");
    if(!pager&&container){pager=document.createElement("div");pager.className="qmes-iqc-native-pager";container.appendChild(pager);}
    if(!pager)return;
    pager.replaceChildren();
    pager.style.display=totalPages>1?"flex":"none";
    if(totalPages<=1)return;

    const make=(label,page,disabled,active)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=label;button.dataset.qmesIqcPage=String(page);button.disabled=disabled;
      button.style.cssText=`min-width:34px;height:32px;padding:0 10px;border:1px solid ${active?"#38bdf8":"#475569"};border-radius:7px;background:${active?"#0c4a6e":"#172033"};color:#e2e8f0;font-size:12px;font-weight:800;cursor:${disabled?"default":"pointer"};opacity:${disabled?".45":"1"};`;
      return button;
    };
    pager.appendChild(make("이전",Math.max(1,currentPage-1),currentPage===1,false));
    for(let page=1;page<=totalPages;page++)pager.appendChild(make(String(page),page,false,page===currentPage));
    pager.appendChild(make("다음",Math.min(totalPages,currentPage+1),currentPage===totalPages,false));
  }

  function handlePager(event){
    const button=event.target?.closest?.("[data-qmes-iqc-page]");
    if(!button||button.disabled)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    currentPage=Number(button.dataset.qmesIqcPage)||1;
    requestAnimationFrame(ensurePager);
  }
  window.addEventListener("pointerdown",handlePager,true);
  window.addEventListener("click",handlePager,true);

  document.addEventListener("click",event=>{
    if(!event.target.closest?.(".qmes-iqc-modal-save"))return;
    currentPage=1;
    setTimeout(()=>{try{typeof window.dbSave==="function"&&window.dbSave();}catch(_){}ensurePager();},150);
  },true);

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;installPullMerge();ensurePager();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",schedule);
  installPullMerge();schedule();
})();
