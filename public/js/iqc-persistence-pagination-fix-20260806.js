(function(){
  "use strict";
  if(window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX__) return;
  window.__QMES_IQC_PERSISTENCE_PAGINATION_FIX__=true;

  const PAGE_SIZE=10;
  const clean=value=>String(value||"").trim();
  const rowKey=row=>clean(row?.inNo)||[clean(row?.recv),clean(row?.lot),clean(row?.name),clean(row?.supplier)].join("|");
  const dateValue=row=>clean(row?.recv||row?.inspectedAt||"");

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

  function ensurePager(){
    const table=findLedger();
    if(!table)return;
    const tbody=table.tBodies?.[0];
    if(!tbody)return;
    const rows=[...tbody.rows].filter(row=>!row.querySelector(".qmes-iqc-empty-row"));
    if(!rows.length)return;

    const state=table.__qmesPagerState||(table.__qmesPagerState={page:1});
    const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    if(state.page>totalPages)state.page=totalPages;
    rows.forEach((row,index)=>{row.hidden=!(index>=(state.page-1)*PAGE_SIZE&&index<state.page*PAGE_SIZE);});

    const container=table.closest(".qmes-iqc-ledger-container")||table.parentElement;
    let pager=container?.querySelector(":scope > .qmes-iqc-native-pager");
    if(!pager&&container){
      pager=document.createElement("div");
      pager.className="qmes-iqc-native-pager";
      pager.style.cssText="display:flex;justify-content:center;align-items:center;gap:7px;margin:14px 0 2px;";
      container.appendChild(pager);
    }
    if(!pager)return;
    pager.replaceChildren();
    pager.style.display=totalPages>1?"flex":"none";
    if(totalPages<=1)return;

    const make=(label,page,disabled,active)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=label;button.disabled=disabled;
      button.style.cssText=`min-width:34px;height:32px;padding:0 10px;border:1px solid ${active?"#38bdf8":"#475569"};border-radius:7px;background:${active?"#0c4a6e":"#172033"};color:#e2e8f0;font-size:12px;font-weight:800;cursor:${disabled?"default":"pointer"};opacity:${disabled?".45":"1"};`;
      button.onclick=()=>{if(disabled)return;state.page=page;ensurePager();};
      return button;
    };
    pager.appendChild(make("이전",Math.max(1,state.page-1),state.page===1,false));
    for(let page=1;page<=totalPages;page++)pager.appendChild(make(String(page),page,false,page===state.page));
    pager.appendChild(make("다음",Math.min(totalPages,state.page+1),state.page===totalPages,false));
  }

  function persistAfterSave(event){
    const button=event.target.closest?.(".qmes-iqc-modal-save");
    if(!button)return;
    setTimeout(()=>{
      try{typeof window.dbSave==="function"&&window.dbSave();}catch(_){}
      ensurePager();
    },100);
  }

  document.addEventListener("click",persistAfterSave,true);
  const observer=new MutationObserver(()=>{installPullMerge();requestAnimationFrame(ensurePager);});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",()=>{installPullMerge();ensurePager();});
  installPullMerge();
  ensurePager();
})();
