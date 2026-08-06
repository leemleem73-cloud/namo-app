(function(){
  "use strict";
  if(window.__QMES_LOT_IQC_LINK_V30__) return;
  window.__QMES_LOT_IQC_LINK_V30__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const setStore=(key,value)=>{try{sessionStorage.setItem(key,String(value||""));}catch(_){}};
  const getStore=key=>{try{return sessionStorage.getItem(key)||"";}catch(_){return "";}};
  const clearLink=()=>["qmes_lot_link_pending","qmes_lot_link_material_lot","qmes_lot_link_material_name","qmes_lot_link_supplier"].forEach(key=>{try{sessionStorage.removeItem(key);}catch(_){}});

  const style=document.createElement("style");
  style.textContent=`
    .qmes-lot-iqc-cell-inner{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;white-space:nowrap!important;width:100%!important}
    .qmes-lot-iqc-link-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important;height:26px!important;padding:0 9px!important;border:1px solid #475569!important;border-radius:7px!important;background:#172033!important;color:#dbe7f3!important;font-size:10px!important;font-weight:800!important;cursor:pointer!important}
    .qmes-lot-iqc-link-btn:hover{background:#1e293b!important;color:#fff!important}
    .qmes-linked-material-context{display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;flex-wrap:wrap!important;margin:0 0 14px!important;padding:11px 16px!important;border:1px solid #334155!important;border-radius:10px!important;background:#0f172a!important;color:#e2e8f0!important}
    .qmes-linked-material-context strong{color:#7dd3fc!important;font-weight:800!important}
    .qmes-linked-material-actions{display:inline-flex!important;gap:7px!important}
    .qmes-linked-material-actions button{height:30px!important;padding:4px 11px!important;border:1px solid #475569!important;border-radius:7px!important;background:#1e293b!important;color:#fff!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
    .qmes-lot-material-table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
    .qmes-lot-material-table th,.qmes-lot-material-table td{box-sizing:border-box!important;text-align:center!important;vertical-align:middle!important;padding:10px 8px!important;line-height:20px!important;white-space:nowrap!important}
    .qmes-lot-material-table th{font-weight:700!important}
    .qmes-lot-material-table td>*{margin-left:auto!important;margin-right:auto!important;text-align:center!important;justify-content:center!important}
    .qmes-lot-pqc-result{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:64px!important;height:28px!important;padding:0 10px!important;border-radius:999px!important;font-size:12px!important;font-weight:800!important}
    .qmes-lot-pqc-result.is-pass{background:#052e2b!important;color:#6ee7b7!important;border:1px solid #047857!important}
    .qmes-lot-pqc-result.is-fail{background:#3f0d12!important;color:#fca5a5!important;border:1px solid #b91c1c!important}
    .qmes-lot-pqc-result.is-wait{background:#2a2110!important;color:#fcd34d!important;border:1px solid #a16207!important}
  `;
  document.head.appendChild(style);

  function panelOf(element){let node=element;while(node&&node!==document.body){const classes=String(node.className||"");if(/rounded/.test(classes)&&/border/.test(classes))return node;node=node.parentElement;}return null;}
  function indexes(row){const headers=Array.from(row.closest("table")?.querySelectorAll("thead th")||[]).map(th=>clean(th.textContent));const find=(pattern,fallback)=>{const i=headers.findIndex(text=>pattern.test(text));return i>=0?i:fallback;};return{lot:find(/LOT No\.|원료\s*LOT/i,0),name:find(/원재료명|^품명$/,1),supplier:find(/업체명|공급사/,2),iqc:find(/수입검사/,row.cells.length-1)};}

  function normalizeMaterialTables(){
    const headings=Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span")).filter(node=>/투입 원재료|Backward Trace|투입원료/.test(clean(node.textContent)));
    headings.forEach(heading=>{
      const panel=panelOf(heading);const table=panel?.querySelector("table");if(!table)return;
      table.classList.add("qmes-lot-material-table");
      const headers=Array.from(table.querySelectorAll("thead th"));
      headers.forEach(th=>{
        const text=clean(th.textContent);
        if(/원료\s*LOT/i.test(text))th.textContent="LOT No.";
        else if(text==="공급사")th.textContent="업체명";
      });
      const count=headers.length||1;
      let colgroup=table.querySelector("colgroup");
      if(!colgroup){colgroup=document.createElement("colgroup");table.insertBefore(colgroup,table.firstChild);}
      while(colgroup.children.length<count)colgroup.appendChild(document.createElement("col"));
      Array.from(colgroup.children).forEach(col=>col.style.width=`${100/count}%`);
    });
  }

  function goToIqc(button){
    setStore("qmes_lot_link_pending","1");
    setStore("qmes_lot_link_material_lot",button.dataset.lot);
    setStore("qmes_lot_link_material_name",button.dataset.name);
    setStore("qmes_lot_link_supplier",button.dataset.supplier);
    const qualityButton=Array.from(document.querySelectorAll(".qmes-top-menu-button")).find(node=>clean(node.textContent).includes("품질검사"));
    if(qualityButton){qualityButton.click();return;}
    setStore("qmes_current_tab","iqc");window.location.reload();
  }

  function addLinks(){
    const headings=Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span")).filter(node=>/투입 원재료|Backward Trace|투입원료/.test(clean(node.textContent)));
    headings.forEach(heading=>{
      const panel=panelOf(heading);if(!panel)return;
      Array.from(panel.querySelectorAll("tbody tr")).forEach(row=>{
        const cells=Array.from(row.cells||[]);if(!cells.length)return;
        const idx=indexes(row);const lot=clean(cells[idx.lot]?.textContent);const name=clean(cells[idx.name]?.textContent);const supplier=clean(cells[idx.supplier]?.textContent);const cell=cells[idx.iqc]||cells[cells.length-1];
        if(!lot||!cell)return;
        let inner=cell.querySelector(":scope > .qmes-lot-iqc-cell-inner");
        if(!inner){inner=document.createElement("span");inner.className="qmes-lot-iqc-cell-inner";while(cell.firstChild)inner.appendChild(cell.firstChild);cell.appendChild(inner);}
        let button=inner.querySelector(".qmes-lot-iqc-link-btn");
        if(!button){button=document.createElement("button");button.type="button";button.className="qmes-lot-iqc-link-btn";button.textContent="바로가기";inner.appendChild(button);}
        button.dataset.lot=lot;button.dataset.name=name;button.dataset.supplier=supplier;
        button.onclick=event=>{event.preventDefault();event.stopPropagation();goToIqc(button);};
      });
    });
  }

  function currentLot(){
    const text=clean(document.body.textContent);
    const match=text.match(/Lot\s*이력\s*[—-]\s*([A-Z0-9_.-]{4,})/i)||text.match(/완제품\s*LOT\s*[—-]\s*([A-Z0-9_.-]{4,})/i);
    return match?.[1]||"";
  }

  function pqcRowsFor(lot){
    const store=window.DB||{};
    const rows=[...(Array.isArray(store.insp?.PQC)?store.insp.PQC:[]),...(Array.isArray(store.pqc)?store.pqc:[])];
    return rows.filter(row=>clean(row.lot||row.lotNo||row.batchLot||row.workOrder)===clean(lot));
  }

  function syncPqcResult(){
    const lot=currentLot();if(!lot)return;
    const rows=pqcRowsFor(lot);
    const result=rows.length?(rows.every(row=>/합격|적합|OK|PASS/i.test(clean(row.judge||row.result||row.status)))?"합격":"불합격"):"미검사";
    const nodes=Array.from(document.querySelectorAll("div,span,p,strong,td")).filter(node=>node.children.length===0&&/^공정검사\s*[:：]?/.test(clean(node.textContent)));
    nodes.forEach(node=>{
      const base=clean(node.textContent).replace(/^공정검사\s*[:：]?\s*/,"");
      if(!base||/미검사|결과없음|-/.test(base)||node.dataset.qmesPqcSynced){
        node.dataset.qmesPqcSynced="1";
        node.textContent="공정검사 ";
        const badge=document.createElement("span");
        badge.className=`qmes-lot-pqc-result ${result==="합격"?"is-pass":result==="불합격"?"is-fail":"is-wait"}`;
        badge.textContent=result;node.appendChild(badge);
      }
    });
    const panels=Array.from(document.querySelectorAll("div,section,article")).filter(node=>/공정검사/.test(clean(node.textContent))&&node.querySelector("table"));
    panels.forEach(panel=>{
      const tbody=panel.querySelector("tbody");if(!tbody||tbody.rows.length||!rows.length)return;
      rows.forEach(row=>{
        const tr=document.createElement("tr");
        const values=[row.date||row.inspectedAt||"-",row.item||row.name||row.testItem||"-",row.value??row.resultValue??"-",row.spec||row.standard||"-",row.judge||row.result||row.status||"-"];
        values.forEach(value=>{const td=document.createElement("td");td.textContent=clean(value)||"-";td.style.textAlign="center";td.style.padding="10px 8px";tr.appendChild(td);});
        tbody.appendChild(tr);
      });
    });
  }

  function searchInput(){return Array.from(document.querySelectorAll("input[type='search'],input[type='text'],input:not([type])")).find(node=>/검색/.test(String(node.placeholder||"")));}
  function setSearch(lot){const input=searchInput();if(!input)return false;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;if(setter)setter.call(input,lot);else input.value=lot;input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));return true;}
  function findRow(lot){return Array.from(document.querySelectorAll(".qmes-iqc-ledger-table tbody tr,table tbody tr")).find(row=>clean(row.textContent).includes(lot));}
  function clickAction(lot,label){const row=findRow(lot);const action=Array.from(row?.querySelectorAll("button")||[]).find(node=>clean(node.textContent).includes(label));if(action)action.click();}

  function showContext(){
    if(getStore("qmes_lot_link_pending")!=="1")return false;
    const lot=getStore("qmes_lot_link_material_lot");const input=searchInput();if(!lot||!input)return false;
    setSearch(lot);document.getElementById("qmes-linked-material-context")?.remove();
    let anchor=input.parentElement;while(anchor?.parentElement&&anchor.getBoundingClientRect().width<450)anchor=anchor.parentElement;
    const name=getStore("qmes_lot_link_material_name");const supplier=getStore("qmes_lot_link_supplier");
    const box=document.createElement("div");box.id="qmes-linked-material-context";box.className="qmes-linked-material-context";
    box.innerHTML=`<span>LOT No. <strong>${lot}</strong></span><span>원재료명 <strong>${name||"-"}</strong></span><span>업체명 <strong>${supplier||"-"}</strong></span><span class="qmes-linked-material-actions"><button type="button" data-action="출력">출력</button><button type="button" data-action="라벨">라벨</button></span>`;
    box.querySelector('[data-action="출력"]').onclick=()=>clickAction(lot,"출력");box.querySelector('[data-action="라벨"]').onclick=()=>clickAction(lot,"라벨");
    anchor.parentElement?.insertBefore(box,anchor);clearLink();return true;
  }

  let queued=false;function apply(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;normalizeMaterialTables();addLinks();syncPqcResult();showContext();});}
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",apply);document.addEventListener("qmes:data-updated",apply);apply();
})();
