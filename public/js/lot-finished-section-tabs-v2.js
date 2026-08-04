(function(){
  "use strict";
  if(window.__QMES_LOT_FINISHED_SECTION_TABS_V2__) return;
  window.__QMES_LOT_FINISHED_SECTION_TABS_V2__=true;

  const NAV_ID="qmes-lot-finished-section-tabs";
  const STYLE_ID="qmes-lot-finished-section-tabs-v2-style";
  const STORE_KEY="qmes-lot-finished-section-v2";
  const clean=v=>String(v??"").replace(/\s+/g," ").trim();
  const sections=[
    ["materials","투입원료"],
    ["production","생산실적"],
    ["pqc","공정검사(PQC)"],
    ["oqc","출하검사(OQC)"],
    ["quality","부적합 이력"]
  ];

  function active(){
    try{return sections.some(([key])=>key===sessionStorage.getItem(STORE_KEY))?sessionStorage.getItem(STORE_KEY):"materials";}
    catch(_){return "materials";}
  }
  function save(key){try{sessionStorage.setItem(STORE_KEY,key);}catch(_){}}

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${NAV_ID}{width:100%;margin:18px 0 4px;padding:10px;border:1px solid #334155;border-radius:12px;background:#0f1d31;box-sizing:border-box}
      #${NAV_ID} .qmes-lot-tab-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
      #${NAV_ID} button{min-height:44px;padding:9px 8px;border:1px solid #475569;border-radius:8px;background:#1e293b;color:#94a3b8;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}
      #${NAV_ID} button:hover{border-color:#38bdf8;color:#e0f2fe}
      #${NAV_ID} button.is-active{border-color:#38bdf8;background:rgba(14,165,233,.18);color:#fff;box-shadow:inset 0 0 0 1px rgba(56,189,248,.15)}
      @media(max-width:980px){#${NAV_ID} .qmes-lot-tab-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  const titleNodes=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"));
  function panelOf(node){
    let current=node;
    while(current&&current!==document.body){
      const cls=String(current.className||"");
      if(/rounded/.test(cls)&&/border/.test(cls)) return current;
      current=current.parentElement;
    }
    return null;
  }
  function panelsMatching(test){
    const result=[];
    titleNodes().forEach(node=>{
      const text=clean(node.textContent);
      if(!test(text)) return;
      const panel=panelOf(node);
      if(panel&&!result.includes(panel)) result.push(panel);
    });
    return result;
  }
  function firstPanel(test){return panelsMatching(test)[0]||null;}
  function show(element,visible){
    if(!element) return;
    element.dataset.qmesLotTabManaged="1";
    if(visible){element.style.removeProperty("display");element.removeAttribute("aria-hidden");}
    else{element.style.setProperty("display","none","important");element.setAttribute("aria-hidden","true");}
  }
  function restore(){
    document.querySelectorAll('[data-qmes-lot-tab-managed="1"]').forEach(el=>{
      el.style.removeProperty("display");el.removeAttribute("aria-hidden");delete el.dataset.qmesLotTabManaged;
    });
  }

  function makeNav(){
    const nav=document.createElement("div");
    nav.id=NAV_ID;
    nav.innerHTML='<div class="qmes-lot-tab-grid"></div>';
    const grid=nav.firstElementChild;
    sections.forEach(([key,label])=>{
      const button=document.createElement("button");
      button.type="button";
      button.dataset.section=key;
      button.textContent=label;
      button.addEventListener("click",()=>{save(key);apply();});
      grid.appendChild(button);
    });
    return nav;
  }

  function apply(){
    installStyle();
    const finishedTitle=titleNodes().find(node=>/^완제품 LOT\s*[—–-]/.test(clean(node.textContent)));
    const summary=panelOf(finishedTitle);
    if(!summary){document.getElementById(NAV_ID)?.remove();restore();return;}

    const rawTitle=titleNodes().find(node=>/^원료 LOT 역추적\s*[—–-]/.test(clean(node.textContent)));
    if(rawTitle){document.getElementById(NAV_ID)?.remove();restore();return;}

    const materials=panelsMatching(text=>text==="투입 원료"||text==="중간재 연결");
    const production=panelsMatching(text=>/^생산실적 상세\s*[—–-]/.test(text));
    const pqc=panelsMatching(text=>text==="공정검사(PQC) 결과");
    const oqc=panelsMatching(text=>/^출하검사\(OQC\)·출하정보\s*[—–-]/.test(text));
    const quality=panelsMatching(text=>/^품질 상태·부적합 이력\s*[—–-]/.test(text));
    const monthly=panelsMatching(text=>text==="월별 데이터");
    monthly.forEach(panel=>show(panel,false));

    const firstDetail=[...materials,...production,...pqc,...oqc,...quality][0];
    let nav=document.getElementById(NAV_ID)||makeNav();
    const parent=firstDetail?.parentElement||summary.parentElement;
    if(firstDetail&&parent){parent.insertBefore(nav,firstDetail);}
    else if(summary.parentElement){summary.insertAdjacentElement("afterend",nav);}

    const selected=active();
    nav.querySelectorAll("button[data-section]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.section===selected));
    materials.forEach(panel=>show(panel,selected==="materials"));
    production.forEach(panel=>show(panel,selected==="production"));
    pqc.forEach(panel=>show(panel,selected==="pqc"));
    oqc.forEach(panel=>show(panel,selected==="oqc"));
    quality.forEach(panel=>show(panel,selected==="quality"));

    document.querySelectorAll("[data-qmes-lot-production-detail]").forEach(wrapper=>show(wrapper,selected==="production"||selected==="pqc"));
    production.forEach(panel=>show(panel,selected==="production"));
    pqc.forEach(panel=>show(panel,selected==="pqc"));
    document.querySelectorAll("[data-qmes-lot-oqc-shipment]").forEach(wrapper=>show(wrapper,selected==="oqc"));
    document.querySelectorAll("[data-qmes-lot-quality-hold]").forEach(wrapper=>show(wrapper,selected==="quality"));
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }
  document.addEventListener("click",()=>setTimeout(schedule,0),true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("storage",schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  let tries=0;
  const timer=setInterval(()=>{tries++;schedule();if(document.getElementById(NAV_ID)||tries>400)clearInterval(timer);},50);
})();
