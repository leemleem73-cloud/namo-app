(function(){
  "use strict";
  if(window.__QMES_LOT_DETAIL_LINK_V21__) return;
  window.__QMES_LOT_DETAIL_LINK_V21__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,small,strong,td,th,button,a"));
  const setStore=(key,value)=>{try{sessionStorage.setItem(key,String(value||""));}catch(error){}};
  const getStore=key=>{try{return sessionStorage.getItem(key)||"";}catch(error){return "";}};
  const removeStores=()=>{
    ["qmes_lot_link_tab","qmes_lot_link_query","qmes_lot_link_material_lot","qmes_lot_link_material_name","qmes_lot_link_supplier"].forEach(key=>{try{sessionStorage.removeItem(key);}catch(error){}});
  };

  window.qmesOpenLotLinkedModule=function(tab,query,meta={}){
    setStore("qmes_current_tab",tab);
    setStore("qmes_lot_link_tab",tab);
    setStore("qmes_lot_link_query",query);
    setStore("qmes_lot_link_material_lot",meta.materialLot||query);
    setStore("qmes_lot_link_material_name",meta.materialName);
    setStore("qmes_lot_link_supplier",meta.supplier);
    window.location.reload();
  };

  const style=document.createElement("style");
  style.id="qmes-lot-detail-link-v21-style";
  style.textContent=`
    .qmes-lot-detail-centered{min-width:0!important;overflow:hidden!important}
    .qmes-lot-detail-centered table{width:100%!important;table-layout:fixed!important}
    .qmes-lot-detail-centered th,.qmes-lot-detail-centered td{box-sizing:border-box!important;padding:10px 8px!important;text-align:center!important;vertical-align:middle!important;line-height:20px!important}
    .qmes-lot-detail-centered th{font-weight:700!important;white-space:nowrap!important}
    .qmes-lot-production-panel .qmes-lot-detail-row{display:grid!important;grid-template-columns:120px minmax(0,1fr) 128px!important;align-items:center!important;gap:12px!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:11px 12px!important;box-sizing:border-box!important;overflow:hidden!important}
    .qmes-lot-production-panel .qmes-lot-detail-row>*{min-width:0!important;max-width:100%!important;margin:0!important;text-align:center!important;justify-self:center!important;overflow-wrap:anywhere!important}
    .qmes-lot-production-panel .qmes-workorder-issue-cell{grid-column:3!important;width:118px!important;max-width:118px!important;justify-self:end!important;white-space:nowrap!important}
    .qmes-lot-production-panel .qmes-workorder-issue-cell>*{display:inline-flex!important;width:100%!important;min-height:30px!important;align-items:center!important;justify-content:center!important;padding:5px 9px!important;box-sizing:border-box!important;white-space:nowrap!important}
    .qmes-lot-production-hidden{display:none!important}
    .qmes-lot-linked-target{cursor:pointer!important}
    .qmes-lot-linked-target:hover{text-decoration:underline!important;text-underline-offset:3px!important}
    .qmes-lot-linked-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:7px!important;padding:2px 7px!important;border:1px solid #475569!important;border-radius:999px!important;background:#0f172a!important;color:#cbd5e1!important;font-size:10px!important;font-weight:700!important;line-height:16px!important;white-space:nowrap!important}
    .qmes-linked-material-context{display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;flex-wrap:wrap!important;margin:0 0 14px!important;padding:11px 16px!important;border:1px solid #334155!important;border-radius:10px!important;background:#0f172a!important;color:#e2e8f0!important}
    .qmes-linked-material-context strong{color:#7dd3fc!important;font-weight:800!important}
    .qmes-linked-material-context span{font-size:13px!important}
    .qmes-linked-material-actions{display:inline-flex!important;gap:7px!important;margin-left:4px!important}
    .qmes-linked-material-actions button{min-width:58px!important;height:30px!important;padding:4px 11px!important;border:1px solid #475569!important;border-radius:7px!important;background:#1e293b!important;color:#f1f5f9!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
    @media(max-width:760px){.qmes-lot-production-panel .qmes-lot-detail-row{grid-template-columns:96px minmax(0,1fr) 110px!important;gap:7px!important;padding:9px 7px!important}.qmes-lot-production-panel .qmes-workorder-issue-cell{width:104px!important;max-width:104px!important}}
  `;
  document.head.appendChild(style);

  function panelOf(element){
    let node=element;
    while(node&&node!==document.body){
      const cls=String(node.className||"");
      const rect=node.getBoundingClientRect();
      if((/rounded/.test(cls)&&/border/.test(cls))||(rect.width>400&&node.querySelector("h1,h2,h3,h4,h5"))) return node;
      node=node.parentElement;
    }
    return null;
  }

  function hideOwner(scope){
    all(scope).forEach(node=>{
      if(node.children.length)return;
      const text=String(node.textContent||"");
      if(!/품질부\s*박현아(?:\s*\(U-0010\))?/i.test(text))return;
      const next=clean(text.replace(/품질부\s*박현아(?:\s*\(U-0010\))?/ig,"").replace(/^담당\s*:?\s*$/,""));
      if(next&&next!=="담당")node.textContent=next;else node.classList.add("qmes-lot-production-hidden");
    });
  }

  function hideTime(scope){
    const pattern=/^(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}\s*)?\d{1,2}:\d{2}(?::\d{2})?$/;
    all(scope).filter(node=>!node.children.length&&pattern.test(clean(node.textContent))).forEach(node=>node.classList.add("qmes-lot-production-hidden"));
  }

  function arrangeProductionRow(row){
    hideTime(row);hideOwner(row);
    const issue=Array.from(row.children).find(child=>/작업지시/.test(clean(child.textContent))&&/발행/.test(clean(child.textContent)));
    if(issue){issue.classList.add("qmes-workorder-issue-cell");row.appendChild(issue);}
  }

  function currentLotFromPage(){
    const body=clean(document.body.textContent);
    const match=body.match(/Lot\s*이력\s*[—-]\s*([A-Z0-9_-]{4,})/i)||body.match(/완제품\s*LOT\s*[—-]\s*([A-Z0-9_-]{4,})/i);
    return match?.[1]||"";
  }

  function addLink(node,tab,query,label,meta={}){
    if(!node||node.dataset.qmesLotLinked)return;
    node.dataset.qmesLotLinked="1";
    node.classList.add("qmes-lot-linked-target");
    node.setAttribute("role","button");node.setAttribute("tabindex","0");
    const open=event=>{event.preventDefault();event.stopPropagation();window.qmesOpenLotLinkedModule(tab,query,meta);};
    node.addEventListener("click",open,true);
    node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" ")open(event);});
    const badge=document.createElement("span");badge.className="qmes-lot-linked-badge";badge.textContent="바로가기";node.appendChild(badge);
  }

  function renameMaterialHeaders(panel){
    Array.from(panel.querySelectorAll("thead th")).forEach(th=>{
      const text=clean(th.textContent);
      if(/원료\s*Lot/i.test(text)||text==="원료 LOT")th.textContent="LOT No.";
      else if(text==="품명")th.textContent="원재료명";
      else if(text==="공급사")th.textContent="업체명";
    });
  }

  function headerIndex(row,patterns,fallback){
    const heads=Array.from(row.closest("table")?.querySelectorAll("thead th")||[]).map(th=>clean(th.textContent));
    const index=heads.findIndex(text=>patterns.some(pattern=>pattern.test(text)));
    return index>=0?index:fallback;
  }

  function linkRawMaterials(){
    all().filter(node=>/투입 원재료|Backward Trace|투입원료/.test(clean(node.textContent))).forEach(heading=>{
      const panel=panelOf(heading);if(!panel)return;
      renameMaterialHeaders(panel);
      Array.from(panel.querySelectorAll("tbody tr")).forEach(row=>{
        const cells=Array.from(row.querySelectorAll("td"));if(!cells.length)return;
        row.querySelectorAll(".qmes-lot-linked-badge").forEach(badge=>badge.remove());
        const lotIndex=headerIndex(row,[/LOT No\./i,/원료\s*LOT/i],0);
        const nameIndex=headerIndex(row,[/원재료명/,/^품명$/],1);
        const supplierIndex=headerIndex(row,[/업체명/,/공급사/],5);
        const iqcIndex=headerIndex(row,[/수입검사/],cells.length-1);
        const lot=clean(cells[lotIndex]?.textContent);
        const name=clean(cells[nameIndex]?.textContent);
        const supplier=clean(cells[supplierIndex]?.textContent);
        const iqcCell=cells[iqcIndex]||cells[cells.length-1];
        if(iqcCell&&lot)addLink(iqcCell,"iqc",lot,"수입검사",{materialLot:lot,materialName:name,supplier});
      });
    });
  }

  function linkProcessPanels(){
    const lot=currentLotFromPage();if(!lot)return;
    all().forEach(node=>{
      if(node.children.length)return;
      const text=clean(node.textContent);
      if(/작업지시\s*발행/.test(text))addLink(node,"woIssue",lot,"작업지시서");
      else if(/공정검사|PQC/.test(text))addLink(node,"pqc",lot,"공정검사");
      else if(/출하검사|OQC|출하정보/.test(text))addLink(node,"oqc",lot,"출하검사");
    });
  }

  function markDetails(){
    const titles=["투입원료","생산실적","공정검사(PQC) 결과","출하정보"];
    all().forEach(element=>{
      const title=clean(element.textContent);if(!titles.includes(title))return;
      const panel=panelOf(element);if(!panel)return;
      panel.classList.add("qmes-lot-detail-centered");
      if(title==="생산실적"){
        panel.classList.add("qmes-lot-production-panel");
        Array.from(panel.querySelectorAll("div.grid")).forEach(row=>{if(row.children.length>=2){row.classList.add("qmes-lot-detail-row");arrangeProductionRow(row);}});
        hideTime(panel);hideOwner(panel);
      }
    });
    linkRawMaterials();linkProcessPanels();
  }

  function findIqcRow(lot){
    return Array.from(document.querySelectorAll("tbody tr")).find(row=>Array.from(row.querySelectorAll("td")).some(cell=>clean(cell.textContent).includes(lot)));
  }

  function clickIqcAction(lot,label){
    const row=findIqcRow(lot);
    const button=Array.from(row?.querySelectorAll("button")||[]).find(item=>clean(item.textContent).includes(label));
    if(button)button.click();else window.alert(`${label} 버튼을 찾을 수 없습니다.`);
  }

  function showLinkedMaterialContext(){
    if(getStore("qmes_current_tab")!=="iqc")return false;
    const lot=getStore("qmes_lot_link_material_lot");
    const name=getStore("qmes_lot_link_material_name");
    const supplier=getStore("qmes_lot_link_supplier");
    if(!lot)return false;
    const searchInput=Array.from(document.querySelectorAll("input[type='text'],input[type='search'],input:not([type])")).find(item=>/LOT|원재료|입고번호|검색/.test(String(item.placeholder||"")));
    if(!searchInput)return false;
    if(document.getElementById("qmes-linked-material-context"))return true;
    let anchor=searchInput.parentElement;
    while(anchor?.parentElement&&anchor.getBoundingClientRect().width<450)anchor=anchor.parentElement;
    const box=document.createElement("div");box.id="qmes-linked-material-context";box.className="qmes-linked-material-context";
    box.innerHTML=`<span>LOT No. <strong>${lot}</strong></span><span>원재료명 <strong>${name||"-"}</strong></span><span>업체명 <strong>${supplier||"-"}</strong></span><span class="qmes-linked-material-actions"><button type="button" data-action="출력">출력</button><button type="button" data-action="라벨">라벨</button></span>`;
    box.querySelector('[data-action="출력"]').addEventListener("click",()=>clickIqcAction(lot,"출력"));
    box.querySelector('[data-action="라벨"]').addEventListener("click",()=>clickIqcAction(lot,"라벨"));
    anchor.parentElement?.insertBefore(box,anchor);
    removeStores();
    return true;
  }

  function applyLinkedSearch(){
    const tab=getStore("qmes_lot_link_tab"),query=getStore("qmes_lot_link_query");
    if(!tab||!query||getStore("qmes_current_tab")!==tab)return;
    const patterns={iqc:/LOT|원재료|입고번호|검색/,pqc:/LOT|배치|작업지시|검색/,oqc:/LOT|출하|고객|검색/,woIssue:/LOT|작업지시|검색/};
    const inputs=Array.from(document.querySelectorAll("input[type='text'],input[type='search'],input:not([type])"));
    const input=inputs.find(item=>patterns[tab]?.test(String(item.placeholder||"")))||inputs.find(item=>/검색/.test(String(item.placeholder||"")));
    if(!input)return;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    if(setter)setter.call(input,query);else input.value=query;
    input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));
    if(tab==="iqc")showLinkedMaterialContext();else removeStores();
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;markDetails();applyLinkedSearch();}));}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener("click",schedule,true);document.addEventListener("qmes:data-updated",schedule);window.addEventListener("load",schedule);schedule();
})();