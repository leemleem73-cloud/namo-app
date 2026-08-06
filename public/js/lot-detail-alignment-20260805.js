(function(){
  "use strict";
  if(window.__QMES_LOT_DETAIL_LINK_V17__) return;
  window.__QMES_LOT_DETAIL_LINK_V17__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,small,strong,td,th,button,a"));
  const setStore=(key,value)=>{try{sessionStorage.setItem(key,value);}catch(error){}};
  const getStore=key=>{try{return sessionStorage.getItem(key)||"";}catch(error){return "";}};
  const removeStore=key=>{try{sessionStorage.removeItem(key);}catch(error){}};

  window.qmesOpenLotLinkedModule=function(tab,query){
    setStore("qmes_current_tab",tab);
    setStore("qmes_lot_link_tab",tab);
    setStore("qmes_lot_link_query",String(query||"").trim());
    window.location.reload();
  };

  const style=document.createElement("style");
  style.id="qmes-lot-detail-link-v17-style";
  style.textContent=`
    .qmes-production-table tbody td:last-child{text-align:center!important;white-space:nowrap!important;}
    .qmes-production-table tbody td:last-child>*{display:inline-flex!important;width:fit-content!important;max-width:100%!important;min-height:24px!important;margin:0 auto!important;padding:3px 7px!important;align-items:center!important;justify-content:center!important;}
    .qmes-lot-detail-centered{min-width:0!important;overflow:hidden!important;}
    .qmes-lot-detail-centered table{width:100%!important;table-layout:fixed!important;}
    .qmes-lot-detail-centered th,.qmes-lot-detail-centered td{box-sizing:border-box!important;padding:10px 8px!important;text-align:center!important;vertical-align:middle!important;line-height:20px!important;}
    .qmes-lot-detail-centered th{font-weight:700!important;white-space:nowrap!important;}
    .qmes-lot-detail-centered td>*{margin-left:auto!important;margin-right:auto!important;text-align:center!important;justify-content:center!important;}
    .qmes-lot-detail-centered .qmes-lot-detail-row{grid-template-columns:120px minmax(0,1fr) auto!important;align-items:center!important;gap:12px!important;padding:11px 8px!important;text-align:center!important;}
    .qmes-lot-production-horizontal{min-width:0!important;overflow:hidden!important;}
    .qmes-lot-production-horizontal .qmes-lot-detail-row{display:flex!important;flex-direction:row!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-start!important;gap:8px 14px!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:11px 12px!important;overflow:hidden!important;}
    .qmes-lot-production-horizontal .qmes-lot-detail-row>*{width:auto!important;min-width:0!important;max-width:100%!important;flex:0 1 auto!important;margin:0!important;text-align:left!important;white-space:normal!important;overflow-wrap:anywhere!important;}
    .qmes-lot-production-horizontal .qmes-lot-detail-row>*:last-child{flex:1 1 240px!important;}
    .qmes-lot-production-hidden{display:none!important;}
    .qmes-lot-linked-target{cursor:pointer!important;position:relative!important;}
    .qmes-lot-linked-target:hover{text-decoration:underline!important;text-underline-offset:3px!important;}
    .qmes-lot-linked-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;margin-left:7px!important;padding:2px 7px!important;border:1px solid #475569!important;border-radius:999px!important;background:#0f172a!important;color:#cbd5e1!important;font-size:10px!important;font-weight:700!important;line-height:16px!important;vertical-align:middle!important;}
    .qmes-lot-shipment-grid{align-items:stretch!important;gap:10px!important;}
    .qmes-lot-shipment-grid>div{display:flex!important;min-height:68px!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:9px 8px!important;text-align:center!important;}
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

  function sanitizeOwner(scope){
    all(scope).filter(node=>!node.children.length).forEach(node=>{
      const text=clean(node.textContent);
      if(!/품질부\s*박현아\s*\(U-0010\)/.test(text)) return;
      if(/^담당\s*:/.test(text)||/^담당\s*품질부/.test(text)) node.textContent="담당:";
      else node.classList.add("qmes-lot-production-hidden");
    });
  }

  function hideTime(scope){
    const pattern=/^(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}\s*)?\d{1,2}:\d{2}(?::\d{2})?$/;
    all(scope).filter(node=>!node.children.length&&pattern.test(clean(node.textContent))).forEach(node=>node.classList.add("qmes-lot-production-hidden"));
  }

  function arrangeProductionRow(row){
    hideTime(row);
    const children=Array.from(row.children);
    const issue=children.find(child=>/작업지시/.test(clean(child.textContent))&&/발행/.test(clean(child.textContent)));
    if(issue) row.insertBefore(issue,row.firstElementChild);
    sanitizeOwner(row);
  }

  function currentLotFromPage(){
    const body=clean(document.body.textContent);
    const title=body.match(/Lot\s*이력\s*[—-]\s*([A-Z0-9_-]{4,})/i)||body.match(/완제품\s*LOT\s*[—-]\s*([A-Z0-9_-]{4,})/i);
    return title?.[1]||"";
  }

  function addLink(node,tab,query,label){
    if(!node||node.dataset.qmesLotLinked) return;
    node.dataset.qmesLotLinked="1";
    node.classList.add("qmes-lot-linked-target");
    node.setAttribute("role","button");
    node.setAttribute("tabindex","0");
    node.title=`${label} 화면에서 ${query} 조회`;
    const open=event=>{event.preventDefault();event.stopPropagation();window.qmesOpenLotLinkedModule(tab,query);};
    node.addEventListener("click",open,true);
    node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" ")open(event);});
    if(!node.querySelector(":scope > .qmes-lot-linked-badge")){
      const badge=document.createElement("span");badge.className="qmes-lot-linked-badge";badge.textContent="바로가기";node.appendChild(badge);
    }
  }

  function linkRawMaterials(){
    const headings=all().filter(node=>/투입 원재료|Backward Trace|투입원료/.test(clean(node.textContent)));
    headings.forEach(heading=>{
      const panel=panelOf(heading);if(!panel)return;
      Array.from(panel.querySelectorAll("tbody tr")).forEach(row=>{
        const cells=Array.from(row.querySelectorAll("td"));if(!cells.length)return;
        const lotCell=cells.find(cell=>/^[A-Z0-9_-]{4,}$/i.test(clean(cell.textContent).replace(/바로가기/g,"")))||cells[0];
        const lot=clean(lotCell?.textContent).replace(/바로가기/g,"").trim();
        if(lot) addLink(lotCell,"iqc",lot,"수입검사");
        const iqcCell=cells.find(cell=>/수입검사|합격|불합격|미검사/.test(clean(cell.textContent)));
        if(iqcCell&&lot) addLink(iqcCell,"iqc",lot,"수입검사");
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
        Array.from(panel.querySelectorAll("div.grid")).forEach(row=>{if(row.children.length>=2){row.classList.add("qmes-lot-detail-row");if(title==="생산실적")arrangeProductionRow(row);}});
      }
      if(title==="생산실적"){panel.classList.add("qmes-lot-production-horizontal");hideTime(panel);sanitizeOwner(panel);}
      if(title==="출하정보"){
        const grid=Array.from(panel.querySelectorAll("div.grid")).find(node=>node.children.length>=2&&node.children.length<=5);if(grid)grid.classList.add("qmes-lot-shipment-grid");
      }
    });
    linkRawMaterials();linkProcessPanels();
  }

  function applyLinkedSearch(){
    const tab=getStore("qmes_lot_link_tab"),query=getStore("qmes_lot_link_query");
    if(!tab||!query||getStore("qmes_current_tab")!==tab)return;
    const placeholders={iqc:/LOT|원재료|입고번호/,pqc:/LOT|배치|작업지시/,oqc:/LOT|출하|고객/,woIssue:/LOT|작업지시/};
    const candidates=Array.from(document.querySelectorAll("input[type='text'],input:not([type])"));
    const input=candidates.find(item=>placeholders[tab]?.test(String(item.placeholder||"")))||candidates.find(item=>/검색/.test(String(item.placeholder||"")));
    if(!input)return;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    if(setter)setter.call(input,query);else input.value=query;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    input.focus();
    removeStore("qmes_lot_link_tab");removeStore("qmes_lot_link_query");
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;markDetails();applyLinkedSearch();}));}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("load",schedule);
  schedule();
})();
