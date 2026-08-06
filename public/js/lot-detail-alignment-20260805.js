(function(){
  "use strict";
  if(window.__QMES_LOT_DETAIL_LINK_V20__) return;
  window.__QMES_LOT_DETAIL_LINK_V20__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,small,strong,td,th,button,a"));
  const setStore=(key,value)=>{try{sessionStorage.setItem(key,value);}catch(error){}};
  const getStore=key=>{try{return sessionStorage.getItem(key)||"";}catch(error){return "";}};
  const removeStore=key=>{try{sessionStorage.removeItem(key);}catch(error){}};

  window.qmesOpenLotLinkedModule=function(tab,query,meta={}){
    setStore("qmes_current_tab",tab);
    setStore("qmes_lot_link_tab",tab);
    setStore("qmes_lot_link_query",String(query||"").trim());
    setStore("qmes_lot_link_material_lot",String(meta.materialLot||query||"").trim());
    setStore("qmes_lot_link_material_name",String(meta.materialName||"").trim());
    setStore("qmes_lot_link_supplier",String(meta.supplier||"").trim());
    window.location.reload();
  };

  const style=document.createElement("style");
  style.id="qmes-lot-detail-link-v20-style";
  style.textContent=`
    .qmes-lot-detail-centered{min-width:0!important;overflow:hidden!important;}
    .qmes-lot-detail-centered table{width:100%!important;table-layout:fixed!important;}
    .qmes-lot-detail-centered th,.qmes-lot-detail-centered td{box-sizing:border-box!important;padding:10px 8px!important;text-align:center!important;vertical-align:middle!important;line-height:20px!important;}
    .qmes-lot-detail-centered th{font-weight:700!important;white-space:nowrap!important;}
    .qmes-lot-detail-centered td>*{margin-left:auto!important;margin-right:auto!important;text-align:center!important;justify-content:center!important;}

    .qmes-lot-production-panel{min-width:0!important;overflow:hidden!important;}
    .qmes-lot-production-panel .qmes-lot-detail-row{
      display:grid!important;
      grid-template-columns:120px minmax(0,1fr) 128px!important;
      align-items:center!important;
      gap:12px!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
      padding:11px 12px!important;
      overflow:hidden!important;
    }
    .qmes-lot-production-panel .qmes-lot-detail-row>*{
      min-width:0!important;
      max-width:100%!important;
      margin:0!important;
      box-sizing:border-box!important;
      text-align:center!important;
      justify-self:center!important;
      overflow-wrap:anywhere!important;
    }
    .qmes-lot-production-panel .qmes-lot-detail-row>.qmes-workorder-issue-cell{
      grid-column:3!important;
      width:118px!important;
      max-width:118px!important;
      justify-self:end!important;
      white-space:nowrap!important;
      text-align:center!important;
    }
    .qmes-lot-production-panel .qmes-lot-detail-row>.qmes-workorder-issue-cell>*{
      width:100%!important;
      min-height:30px!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      padding:5px 9px!important;
      box-sizing:border-box!important;
      white-space:nowrap!important;
    }
    .qmes-lot-production-hidden{display:none!important;}

    .qmes-lot-linked-target{cursor:pointer!important;}
    .qmes-lot-linked-target:hover{text-decoration:underline!important;text-underline-offset:3px!important;}
    .qmes-lot-linked-badge{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      margin-left:7px!important;
      padding:2px 7px!important;
      border:1px solid #475569!important;
      border-radius:999px!important;
      background:#0f172a!important;
      color:#cbd5e1!important;
      font-size:10px!important;
      font-weight:700!important;
      line-height:16px!important;
      vertical-align:middle!important;
      white-space:nowrap!important;
    }
    .qmes-lot-shipment-grid{align-items:stretch!important;gap:10px!important;}
    .qmes-lot-shipment-grid>div{display:flex!important;min-height:68px!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:9px 8px!important;text-align:center!important;}
    .qmes-linked-material-context{display:flex!important;align-items:center!important;justify-content:center!important;gap:18px!important;flex-wrap:wrap!important;margin:0 0 14px!important;padding:11px 16px!important;border:1px solid #334155!important;border-radius:10px!important;background:#0f172a!important;color:#e2e8f0!important;}
    .qmes-linked-material-context strong{color:#7dd3fc!important;font-weight:800!important;}
    .qmes-linked-material-context span{font-size:13px!important;}

    @media(max-width:760px){
      .qmes-lot-production-panel .qmes-lot-detail-row{grid-template-columns:96px minmax(0,1fr) 110px!important;gap:7px!important;padding:9px 7px!important;}
      .qmes-lot-production-panel .qmes-lot-detail-row>.qmes-workorder-issue-cell{width:104px!important;max-width:104px!important;}
    }
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
    const pattern=/품질부\s*박현아\s*\(U-0010\)/g;
    all(scope).forEach(node=>{
      if(node.children.length) return;
      const original=String(node.textContent||"");
      if(!pattern.test(original)){pattern.lastIndex=0;return;}
      pattern.lastIndex=0;
      const next=clean(original.replace(pattern,"").replace(/^담당\s*:?\s*$/,""));
      if(next&&next!=="담당") node.textContent=next;
      else node.classList.add("qmes-lot-production-hidden");
    });
  }

  function hideTime(scope){
    const pattern=/^(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}\s*)?\d{1,2}:\d{2}(?::\d{2})?$/;
    all(scope).filter(node=>!node.children.length&&pattern.test(clean(node.textContent))).forEach(node=>node.classList.add("qmes-lot-production-hidden"));
  }

  function arrangeProductionRow(row){
    hideTime(row);
    hideOwner(row);
    const children=Array.from(row.children);
    const issue=children.find(child=>/작업지시/.test(clean(child.textContent))&&/발행/.test(clean(child.textContent)));
    if(issue){
      issue.classList.add("qmes-workorder-issue-cell");
      row.appendChild(issue);
    }
  }

  function currentLotFromPage(){
    const body=clean(document.body.textContent);
    const title=body.match(/Lot\s*이력\s*[—-]\s*([A-Z0-9_-]{4,})/i)||body.match(/완제품\s*LOT\s*[—-]\s*([A-Z0-9_-]{4,})/i);
    return title?.[1]||"";
  }

  function addLink(node,tab,query,label,options={}){
    if(!node||node.dataset.qmesLotLinked) return;
    node.dataset.qmesLotLinked="1";
    node.classList.add("qmes-lot-linked-target");
    node.setAttribute("role","button");
    node.setAttribute("tabindex","0");
    node.title=`${label} 화면에서 ${query} 조회`;
    const open=event=>{
      event.preventDefault();
      event.stopPropagation();
      window.qmesOpenLotLinkedModule(tab,query,options.meta||{});
    };
    node.addEventListener("click",open,true);
    node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" ")open(event);});
    if(options.showBadge&&!node.querySelector(":scope > .qmes-lot-linked-badge")){
      const badge=document.createElement("span");
      badge.className="qmes-lot-linked-badge";
      badge.textContent="바로가기";
      node.appendChild(badge);
    }
  }

  function renameMaterialHeaders(panel){
    Array.from(panel.querySelectorAll("thead th")).forEach(th=>{
      const text=clean(th.textContent);
      if(text==="원료 Lot"||text==="원료 LOT") th.textContent="LOT No.";
      else if(text==="품명") th.textContent="원재료명";
      else if(text==="공급사") th.textContent="업체명";
    });
  }

  function linkRawMaterials(){
    const headings=all().filter(node=>/투입 원재료|Backward Trace|투입원료/.test(clean(node.textContent)));
    headings.forEach(heading=>{
      const panel=panelOf(heading);if(!panel)return;
      renameMaterialHeaders(panel);
      Array.from(panel.querySelectorAll("tbody tr")).forEach(row=>{
        const cells=Array.from(row.querySelectorAll("td"));if(!cells.length)return;
        const lot=clean(cells[0]?.textContent).replace(/바로가기/g,"").trim();
        const name=clean(cells[1]?.textContent).replace(/바로가기/g,"").trim();
        const supplier=clean(cells[5]?.textContent).replace(/바로가기/g,"").trim();
        const meta={materialLot:lot,materialName:name,supplier};

        cells.forEach((cell,index)=>{
          if(index!==cells.length-1){
            cell.classList.remove("qmes-lot-linked-target");
            cell.removeAttribute("role");
            cell.removeAttribute("tabindex");
            cell.querySelectorAll(":scope > .qmes-lot-linked-badge").forEach(badge=>badge.remove());
          }
        });

        const iqcCell=cells.find(cell=>/수입검사|합격|불합격|미검사/.test(clean(cell.textContent)))||cells[cells.length-1];
        if(iqcCell&&lot) addLink(iqcCell,"iqc",lot,"수입검사",{showBadge:true,meta});
      });
    });
  }

  function linkProcessPanels(){
    const lot=currentLotFromPage();if(!lot)return;
    all().forEach(node=>{
      if(node.children.length) return;
      const text=clean(node.textContent);
      if(/작업지시\s*발행/.test(text)) addLink(node,"woIssue",lot,"작업지시서");
      else if(/공정검사|PQC/.test(text)) addLink(node,"pqc",lot,"공정검사");
      else if(/출하검사|OQC/.test(text)) addLink(node,"oqc",lot,"출하검사");
      else if(/출하정보/.test(text)) addLink(node,"oqc",lot,"출하검사");
    });
  }

  function markDetails(){
    const titles=["투입원료","생산실적","공정검사(PQC) 결과","출하정보"];
    all().forEach(element=>{
      const title=clean(element.textContent);if(!titles.includes(title))return;
      const panel=panelOf(element);if(!panel)return;
      panel.classList.add("qmes-lot-detail-centered");
      if(title==="생산실적"||title==="공정검사(PQC) 결과"){
        Array.from(panel.querySelectorAll("div.grid")).forEach(row=>{
          if(row.children.length<2)return;
          row.classList.add("qmes-lot-detail-row");
          if(title==="생산실적")arrangeProductionRow(row);
        });
      }
      if(title==="생산실적"){
        panel.classList.add("qmes-lot-production-panel");
        hideTime(panel);
        hideOwner(panel);
      }
      if(title==="출하정보"){
        const grid=Array.from(panel.querySelectorAll("div.grid")).find(node=>node.children.length>=2&&node.children.length<=5);
        if(grid)grid.classList.add("qmes-lot-shipment-grid");
      }
    });
    linkRawMaterials();
    linkProcessPanels();
  }

  function showLinkedMaterialContext(){
    if(getStore("qmes_current_tab")!=="iqc") return;
    const lot=getStore("qmes_lot_link_material_lot");
    const name=getStore("qmes_lot_link_material_name");
    const supplier=getStore("qmes_lot_link_supplier");
    if(!lot&&!name&&!supplier)return;
    let box=document.getElementById("qmes-linked-material-context");
    const searchInput=Array.from(document.querySelectorAll("input[type='text'],input:not([type])")).find(item=>/LOT|원재료|입고번호|검색/.test(String(item.placeholder||"")));
    if(!searchInput)return;
    if(!box){
      let anchor=searchInput.parentElement;
      while(anchor?.parentElement&&anchor.getBoundingClientRect().width<450)anchor=anchor.parentElement;
      box=document.createElement("div");
      box.id="qmes-linked-material-context";
      box.className="qmes-linked-material-context";
      anchor.parentElement?.insertBefore(box,anchor);
    }
    box.innerHTML=`<span>LOT No. <strong>${lot||"-"}</strong></span><span>원재료명 <strong>${name||"-"}</strong></span><span>업체명 <strong>${supplier||"-"}</strong></span>`;
  }

  function applyLinkedSearch(){
    const tab=getStore("qmes_lot_link_tab"),query=getStore("qmes_lot_link_query");
    if(!tab||!query||getStore("qmes_current_tab")!==tab){showLinkedMaterialContext();return;}
    const placeholders={iqc:/LOT|원재료|입고번호/,pqc:/LOT|배치|작업지시/,oqc:/LOT|출하|고객/,woIssue:/LOT|작업지시/};
    const candidates=Array.from(document.querySelectorAll("input[type='text'],input:not([type])"));
    const input=candidates.find(item=>placeholders[tab]?.test(String(item.placeholder||"")))||candidates.find(item=>/검색/.test(String(item.placeholder||"")));
    if(!input)return;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    if(setter)setter.call(input,query);else input.value=query;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    input.focus();
    showLinkedMaterialContext();
    removeStore("qmes_lot_link_tab");
    removeStore("qmes_lot_link_query");
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      queued=false;
      markDetails();
      applyLinkedSearch();
    }));
  }
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("load",schedule);
  window.addEventListener("resize",schedule);
  schedule();
})();