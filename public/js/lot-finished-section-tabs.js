(function(){
  "use strict";
  const NAV_ID="qmes-lot-equipment-style-tabs";
  const STYLE_ID="qmes-lot-equipment-style-tabs-style";
  const STORE_KEY="qmes-lot-detail-view";
  const ITEMS=[
    ["materials","투입원료"],
    ["production","생산실적"],
    ["pqc","공정검사"],
    ["oqc","출하검사"],
    ["quality","부적합 이력"]
  ];
  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const allTextElements=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,div,span"));
  const exactOrStarts=(element,labels)=>{
    const text=clean(element.textContent);
    if(text.length>120) return false;
    return labels.some(label=>text===label||text.startsWith(label));
  };
  const findTitle=labels=>allTextElements().find(element=>exactOrStarts(element,labels));
  const panelOf=element=>{
    let node=element;
    while(node&&node!==document.body){
      const classes=String(node.className||"");
      if(/rounded/.test(classes)&&/border/.test(classes)) return node;
      node=node.parentElement;
    }
    return element?.parentElement||null;
  };
  const findPanels=labels=>{
    const panels=[];
    allTextElements().forEach(element=>{
      if(!exactOrStarts(element,labels)) return;
      const panel=panelOf(element);
      if(panel&&!panels.includes(panel)) panels.push(panel);
    });
    return panels;
  };
  const setVisible=(element,visible)=>{
    if(!element) return;
    element.dataset.qmesLotTabManaged="true";
    element.style.setProperty("display",visible?"":"none",visible?"":"important");
    if(visible){element.style.removeProperty("display");element.removeAttribute("aria-hidden");}
    else element.setAttribute("aria-hidden","true");
  };
  const currentKey=()=>{
    try{return ITEMS.some(([key])=>key===sessionStorage.getItem(STORE_KEY))?sessionStorage.getItem(STORE_KEY):"materials";}
    catch(_error){return "materials";}
  };
  const saveKey=key=>{try{sessionStorage.setItem(STORE_KEY,key);}catch(_error){}};

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${NAV_ID}{width:100%;margin:16px 0 0;padding:0;border-bottom:1px solid #334155;}
      #${NAV_ID} .qmes-lot-tab-row{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;}
      #${NAV_ID} button{min-width:118px;padding:11px 16px;border:1px solid #334155;border-bottom:0;border-radius:9px 9px 0 0;background:#172033;color:#94a3b8;font-size:13px;font-weight:800;cursor:pointer;}
      #${NAV_ID} button:hover{background:#1e293b;color:#e2e8f0;}
      #${NAV_ID} button.is-active{background:#26364e;border-color:#475569;color:#fff;box-shadow:inset 0 3px 0 #38bdf8;}
      @media(max-width:760px){#${NAV_ID} .qmes-lot-tab-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}#${NAV_ID} button{min-width:0;border-bottom:1px solid #334155;border-radius:8px;}}
    `;
    document.head.appendChild(style);
  }

  function createNav(){
    const nav=document.createElement("div");
    nav.id=NAV_ID;
    nav.setAttribute("aria-label","완제품 LOT 상세 메뉴");
    const row=document.createElement("div");
    row.className="qmes-lot-tab-row";
    ITEMS.forEach(([key,label])=>{
      const button=document.createElement("button");
      button.type="button";
      button.dataset.key=key;
      button.textContent=label;
      button.addEventListener("click",()=>{saveKey(key);apply();});
      row.appendChild(button);
    });
    nav.appendChild(row);
    return nav;
  }

  function apply(){
    installStyle();
    const summaryTitle=findTitle(["완제품 LOT —","완제품 LOT -","완제품 LOT –","Lot 이력 —","LOT 이력 —"]);
    const summaryPanel=panelOf(summaryTitle);
    if(!summaryPanel){
      document.getElementById(NAV_ID)?.remove();
      document.querySelectorAll('[data-qmes-lot-tab-managed="true"]').forEach(element=>setVisible(element,true));
      return;
    }

    const materials=findPanels(["투입 원료","투입원료","중간재 연결","중간재 포장·잔량 추적","투입 원재료 역추적"]);
    const production=findPanels(["생산실적 상세 —","생산실적 상세","생산실적"]);
    const pqc=findPanels(["공정검사(PQC) 결과","공정검사(PQC)","공정검사"]);
    const oqc=findPanels(["출하검사(OQC)·출하정보 —","출하검사(OQC)","출하검사"]);
    const quality=findPanels(["품질 상태·부적합 이력 —","품질상태·부적합 이력","부적합 이력"]);
    const details=[...materials,...production,...pqc,...oqc,...quality];
    const firstDetail=details.find(Boolean);
    let nav=document.getElementById(NAV_ID)||createNav();
    const parent=firstDetail?.parentElement||summaryPanel.parentElement;
    if(parent&&firstDetail&&(nav.parentElement!==parent||nav.nextElementSibling!==firstDetail)) parent.insertBefore(nav,firstDetail);
    else if(summaryPanel&&nav.previousElementSibling!==summaryPanel) summaryPanel.insertAdjacentElement("afterend",nav);

    const selected=currentKey();
    nav.querySelectorAll("button[data-key]").forEach(button=>button.classList.toggle("is-active",button.dataset.key===selected));
    materials.forEach(panel=>setVisible(panel,selected==="materials"));
    production.forEach(panel=>setVisible(panel,selected==="production"));
    pqc.forEach(panel=>setVisible(panel,selected==="pqc"));
    oqc.forEach(panel=>setVisible(panel,selected==="oqc"));
    quality.forEach(panel=>setVisible(panel,selected==="quality"));
    document.querySelectorAll("[data-qmes-lot-production-detail]").forEach(wrapper=>setVisible(wrapper,selected==="production"||selected==="pqc"));
    document.querySelectorAll("[data-qmes-lot-oqc-shipment]").forEach(wrapper=>setVisible(wrapper,selected==="oqc"));
    document.querySelectorAll("[data-qmes-lot-quality-hold]").forEach(wrapper=>setVisible(wrapper,selected==="quality"));
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  };
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("storage",schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(schedule,1000);
  schedule();
})();
