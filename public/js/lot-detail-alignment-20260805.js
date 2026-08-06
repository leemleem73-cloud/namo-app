(function(){
  "use strict";
  if(window.__QMES_LOT_IQC_LINK_V29__) return;
  window.__QMES_LOT_IQC_LINK_V29__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const setStore=(key,value)=>{try{sessionStorage.setItem(key,String(value||""));}catch(_){}};
  const getStore=key=>{try{return sessionStorage.getItem(key)||"";}catch(_){return "";}};
  const clearLink=()=>["qmes_lot_link_pending","qmes_lot_link_material_lot","qmes_lot_link_material_name","qmes_lot_link_supplier"].forEach(key=>{try{sessionStorage.removeItem(key);}catch(_){}});

  const style=document.createElement("style");
  style.textContent=`
    .qmes-lot-iqc-cell-inner{display:inline-flex!important;align-items:center!important;gap:7px!important;white-space:nowrap!important}
    .qmes-lot-iqc-link-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important;height:26px!important;padding:0 9px!important;border:1px solid #475569!important;border-radius:7px!important;background:#172033!important;color:#dbe7f3!important;font-size:10px!important;font-weight:800!important;cursor:pointer!important}
    .qmes-lot-iqc-link-btn:hover{background:#1e293b!important;color:#fff!important}
    .qmes-linked-material-context{display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;flex-wrap:wrap!important;margin:0 0 14px!important;padding:11px 16px!important;border:1px solid #334155!important;border-radius:10px!important;background:#0f172a!important;color:#e2e8f0!important}
    .qmes-linked-material-context strong{color:#7dd3fc!important;font-weight:800!important}
    .qmes-linked-material-actions{display:inline-flex!important;gap:7px!important}
    .qmes-linked-material-actions button{height:30px!important;padding:4px 11px!important;border:1px solid #475569!important;border-radius:7px!important;background:#1e293b!important;color:#fff!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
  `;
  document.head.appendChild(style);

  function panelOf(element){let node=element;while(node&&node!==document.body){const classes=String(node.className||"");if(/rounded/.test(classes)&&/border/.test(classes))return node;node=node.parentElement;}return null;}
  function indexes(row){const headers=Array.from(row.closest("table")?.querySelectorAll("thead th")||[]).map(th=>clean(th.textContent));const find=(pattern,fallback)=>{const i=headers.findIndex(text=>pattern.test(text));return i>=0?i:fallback;};return{lot:find(/LOT No\.|원료\s*LOT/i,0),name:find(/원재료명|^품명$/,1),supplier:find(/업체명|공급사/,2),iqc:find(/수입검사/,row.cells.length-1)};}

  function goToIqc(button){
    setStore("qmes_lot_link_pending","1");
    setStore("qmes_lot_link_material_lot",button.dataset.lot);
    setStore("qmes_lot_link_material_name",button.dataset.name);
    setStore("qmes_lot_link_supplier",button.dataset.supplier);

    const qualityButton=Array.from(document.querySelectorAll(".qmes-top-menu-button"))
      .find(node=>clean(node.textContent).includes("품질검사"));
    if(qualityButton){
      qualityButton.click();
      return;
    }

    setStore("qmes_current_tab","iqc");
    window.location.reload();
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
    box.querySelector('[data-action="출력"]').onclick=()=>clickAction(lot,"출력");
    box.querySelector('[data-action="라벨"]').onclick=()=>clickAction(lot,"라벨");
    anchor.parentElement?.insertBefore(box,anchor);clearLink();return true;
  }

  let queued=false;function apply(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addLinks();showContext();});}
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",apply);document.addEventListener("qmes:data-updated",apply);apply();
})();
