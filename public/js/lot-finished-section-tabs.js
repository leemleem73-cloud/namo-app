(function(){
  "use strict";
  if(window.__QMES_LOT_FINISHED_SECTION_TABS__) return;
  window.__QMES_LOT_FINISHED_SECTION_TABS__=true;

  const NAV_ID="qmes-lot-finished-section-tabs";
  const STYLE_ID="qmes-lot-finished-section-tabs-style";
  const STORAGE_KEY="qmes-lot-finished-section";
  const VALID_KEYS=["materials","production","pqc","quality"];

  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const titleElements=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"))
    .filter(element=>!element.closest(`#${NAV_ID}`));
  const titleMatches=(text,prefix)=>prefix.endsWith("—")
    ? text.startsWith(prefix)&&text.length<=prefix.length+80
    : text===prefix;

  const panelOf=element=>{
    let node=element;
    while(node&&node!==document.body){
      const classes=String(node.className||"");
      if(/rounded/.test(classes)&&/border/.test(classes)) return node;
      node=node.parentElement;
    }
    return null;
  };

  const panelsByPrefix=prefixes=>{
    const found=[];
    titleElements().forEach(element=>{
      const text=clean(element.textContent);
      if(!prefixes.some(prefix=>titleMatches(text,prefix))) return;
      const panel=panelOf(element);
      if(panel&&!found.includes(panel)) found.push(panel);
    });
    return found;
  };

  const activeSection=()=>{
    try{
      const stored=sessionStorage.getItem(STORAGE_KEY);
      return VALID_KEYS.includes(stored)?stored:"materials";
    }catch(_error){
      return "materials";
    }
  };

  const saveSection=key=>{
    try{sessionStorage.setItem(STORAGE_KEY,key);}
    catch(_error){}
  };

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${NAV_ID}{
        box-sizing:border-box;
        width:100%;
        margin-top:16px;
        padding:12px;
        border:1px solid rgba(51,65,85,.95);
        border-radius:12px;
        background:rgba(15,23,42,.78);
      }
      #${NAV_ID} .qmes-lot-finished-section-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:8px;
      }
      #${NAV_ID} [role="button"]{
        box-sizing:border-box;
        display:flex;
        min-height:46px;
        align-items:center;
        justify-content:center;
        padding:10px 12px;
        border:1px solid rgba(71,85,105,.95);
        border-radius:9px;
        background:#1e293b;
        color:#94a3b8;
        font-size:13px;
        font-weight:800;
        line-height:1.3;
        text-align:center;
        cursor:pointer;
        user-select:none;
        transition:border-color .12s ease,background .12s ease,color .12s ease;
      }
      #${NAV_ID} [role="button"]:hover,
      #${NAV_ID} [role="button"]:focus-visible{
        border-color:rgba(56,189,248,.75);
        color:#e0f2fe;
        outline:none;
      }
      #${NAV_ID} [role="button"].is-active{
        border-color:#38bdf8;
        background:rgba(14,165,233,.16);
        color:#fff;
        box-shadow:inset 0 0 0 1px rgba(56,189,248,.16);
      }
      @media(max-width:900px){
        #${NAV_ID} .qmes-lot-finished-section-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
      }
      @media(max-width:520px){
        #${NAV_ID}{padding:9px;}
        #${NAV_ID} [role="button"]{min-height:43px;padding:9px 7px;font-size:12px;}
      }
    `;
    document.head.appendChild(style);
  }

  const setVisible=(element,visible)=>{
    if(!element) return;
    element.dataset.qmesFinishedTabManaged="true";
    if(visible){
      element.style.removeProperty("display");
      element.removeAttribute("aria-hidden");
    }else{
      element.style.setProperty("display","none","important");
      element.setAttribute("aria-hidden","true");
    }
  };

  const restoreManaged=()=>{
    document.querySelectorAll('[data-qmes-finished-tab-managed="true"]').forEach(element=>{
      element.style.removeProperty("display");
      element.removeAttribute("aria-hidden");
      delete element.dataset.qmesFinishedTabManaged;
    });
  };

  function createNav(){
    const nav=document.createElement("div");
    nav.id=NAV_ID;
    nav.setAttribute("aria-label","완제품 LOT 상세 구간");

    const grid=document.createElement("div");
    grid.className="qmes-lot-finished-section-grid";
    const items=[
      ["materials","투입원료"],
      ["production","생산실적 상세"],
      ["pqc","공정검사(PQC)"],
      ["quality","품질상태·부적합 이력"]
    ];

    items.forEach(([key,label])=>{
      const item=document.createElement("div");
      item.setAttribute("role","button");
      item.setAttribute("tabindex","0");
      item.dataset.section=key;
      item.textContent=label;
      const activate=()=>{
        saveSection(key);
        applyFinishedSections();
      };
      item.addEventListener("click",activate);
      item.addEventListener("keydown",event=>{
        if(event.key!=="Enter"&&event.key!==" ") return;
        event.preventDefault();
        activate();
      });
      grid.appendChild(item);
    });

    nav.appendChild(grid);
    return nav;
  }

  function ensureNav(summaryPanel,firstDetailPanel){
    let nav=document.getElementById(NAV_ID);
    if(!nav) nav=createNav();

    const parent=firstDetailPanel?.parentElement||summaryPanel?.parentElement;
    if(!parent) return nav;
    if(firstDetailPanel){
      if(nav.parentElement!==parent||nav.nextElementSibling!==firstDetailPanel){
        parent.insertBefore(nav,firstDetailPanel);
      }
    }else if(summaryPanel&&nav.previousElementSibling!==summaryPanel){
      summaryPanel.insertAdjacentElement("afterend",nav);
    }
    return nav;
  }

  function applyFinishedSections(){
    installStyle();

    const summaryPanels=panelsByPrefix(["완제품 LOT —"]);
    const summaryPanel=summaryPanels[0]||null;
    if(!summaryPanel){
      document.getElementById(NAV_ID)?.remove();
      restoreManaged();
      return;
    }

    const materialPanels=panelsByPrefix(["투입 원료","중간재 연결"]);
    const productionPanels=panelsByPrefix(["생산실적 상세 —"]);
    const pqcPanels=panelsByPrefix(["공정검사(PQC) 결과"]);
    const oqcPanels=panelsByPrefix(["출하검사(OQC)·출하정보 —"]);
    const qualityPanels=panelsByPrefix(["품질 상태·부적합 이력 —"]);
    const firstDetailPanel=[
      ...materialPanels,...productionPanels,...pqcPanels,...oqcPanels,...qualityPanels
    ].find(Boolean)||null;
    const nav=ensureNav(summaryPanel,firstDetailPanel);
    const selected=activeSection();

    nav?.querySelectorAll('[role="button"][data-section]').forEach(item=>{
      const current=item.dataset.section===selected;
      item.classList.toggle("is-active",current);
      item.setAttribute("aria-pressed",current?"true":"false");
    });

    materialPanels.forEach(panel=>setVisible(panel,selected==="materials"));
    productionPanels.forEach(panel=>setVisible(panel,selected==="production"));
    pqcPanels.forEach(panel=>setVisible(panel,selected==="pqc"));
    oqcPanels.forEach(panel=>setVisible(panel,selected==="quality"));
    qualityPanels.forEach(panel=>setVisible(panel,selected==="quality"));

    document.querySelectorAll("[data-qmes-lot-production-detail]").forEach(wrapper=>{
      setVisible(wrapper,selected==="production"||selected==="pqc");
      productionPanels.forEach(panel=>setVisible(panel,selected==="production"));
      pqcPanels.forEach(panel=>setVisible(panel,selected==="pqc"));
    });
    document.querySelectorAll("[data-qmes-lot-oqc-shipment]").forEach(wrapper=>setVisible(wrapper,selected==="quality"));
    document.querySelectorAll("[data-qmes-lot-quality-hold]").forEach(wrapper=>setVisible(wrapper,selected==="quality"));
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      applyFinishedSections();
    });
  };

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("button");
    if(!button) return;
    const text=clean(button.textContent);
    if(text==="완제품 LOT 조회"||text==="원료 LOT 역추적"||text==="LOT 보기"){
      setTimeout(schedule,0);
    }
  },true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("storage",schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});

  let attempts=0;
  const readyTimer=setInterval(()=>{
    attempts+=1;
    schedule();
    if(document.querySelector('[data-qmes-lot-quality-hold]')||attempts>=400){
      clearInterval(readyTimer);
    }
  },50);
})();
