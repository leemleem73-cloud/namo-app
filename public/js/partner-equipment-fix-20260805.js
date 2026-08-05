(function(){
  "use strict";
  if(window.__QMES_PARTNER_EQUIPMENT_FIX_20260805__) return;
  window.__QMES_PARTNER_EQUIPMENT_FIX_20260805__=true;

  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  const all=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span,button"));

  const style=document.createElement("style");
  style.id="qmes-partner-equipment-fix-20260805-style";
  style.textContent=`
    .qmes-partner-tabs-separated{margin-bottom:20px!important;}

    .qmes-partner-search-row{position:relative!important;}
    .qmes-partner-search-row input{padding-right:40px!important;text-align:center!important;}
    .qmes-partner-search-row input::placeholder{text-align:center!important;}
    .qmes-partner-search-button{
      position:absolute!important;right:4px!important;top:50%!important;
      transform:translateY(-50%)!important;width:32px!important;min-width:32px!important;
      height:32px!important;padding:0!important;margin:0!important;border:0!important;
      background:transparent!important;box-shadow:none!important;z-index:3!important;
    }
    .qmes-partner-search-button svg{width:17px!important;height:17px!important;}

    /* 둥근 현황 카드는 유지하고, 그 위쪽 레이아웃에서 발생하는 선만 제거 */
    .qmes-equipment-line-source-off{
      border-top-width:0!important;
      border-bottom-width:0!important;
      box-shadow:none!important;
      background-image:none!important;
    }
    .qmes-equipment-line-source-off::before,
    .qmes-equipment-line-source-off::after{
      display:none!important;
      content:none!important;
      border:0!important;
      box-shadow:none!important;
      background:none!important;
    }
    .qmes-equipment-extra-line-hidden{
      display:none!important;border:0!important;box-shadow:none!important;
      height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;
    }
  `;
  document.head.appendChild(style);

  function nearestCommonParent(a,b){
    const parents=new Set();
    let node=a;
    while(node&&node!==document.body){parents.add(node);node=node.parentElement;}
    node=b;
    while(node&&node!==document.body){if(parents.has(node)) return node;node=node.parentElement;}
    return null;
  }

  function fixPartnerTabGap(){
    const customers=all().filter(el=>clean(el.textContent)==="고객사 목록");
    const suppliers=all().filter(el=>clean(el.textContent)==="공급업체 목록");
    let best=null;
    customers.forEach(customer=>suppliers.forEach(supplier=>{
      const common=nearestCommonParent(customer,supplier);
      if(!common) return;
      const rect=common.getBoundingClientRect();
      const a=customer.getBoundingClientRect();
      const b=supplier.getBoundingClientRect();
      if(Math.abs(a.top-b.top)<12&&rect.height>25&&rect.height<180&&!best) best=common;
    }));
    if(best) best.classList.add("qmes-partner-tabs-separated");
  }

  function isVisibleLineSource(node,targetTop){
    if(!node||node===document.body) return false;
    const rect=node.getBoundingClientRect();
    const css=getComputedStyle(node);
    const near=rect.bottom<=targetTop+3&&targetTop-rect.bottom<45;
    const hasLine=parseFloat(css.borderTopWidth)>0||parseFloat(css.borderBottomWidth)>0||css.boxShadow!=="none";
    return near&&hasLine;
  }

  function fixEquipmentLine(){
    all().filter(el=>clean(el.textContent)==="설비대장 현황").forEach(title=>{
      let panel=title;
      while(panel&&panel!==document.body){
        const cls=String(panel.className||"");
        if(/rounded/.test(cls)&&/border/.test(cls)) break;
        panel=panel.parentElement;
      }
      if(!panel||panel===document.body) return;

      const panelTop=panel.getBoundingClientRect().top;

      /* 카드 바로 위 형제 또는 얇은 빈 노드 제거 */
      let level=panel;
      for(let depth=0;depth<5&&level&&level!==document.body;depth+=1){
        const prev=level.previousElementSibling;
        if(prev){
          const rect=prev.getBoundingClientRect();
          const empty=!clean(prev.textContent);
          if(empty&&rect.height<=18){
            prev.classList.add("qmes-equipment-extra-line-hidden");
          }else if(isVisibleLineSource(prev,panelTop)){
            prev.classList.add("qmes-equipment-line-source-off");
          }
        }

        const parent=level.parentElement;
        if(parent&&parent!==document.body){
          const css=getComputedStyle(parent);
          if(parseFloat(css.borderTopWidth)>0||parseFloat(css.borderBottomWidth)>0||css.boxShadow!=="none"){
            parent.classList.add("qmes-equipment-line-source-off");
          }
          Array.from(parent.children).forEach(child=>{
            if(child===level||child.contains(panel)||panel.contains(child)) return;
            const rect=child.getBoundingClientRect();
            if(rect.bottom<=panelTop+3&&panelTop-rect.bottom<45&&isVisibleLineSource(child,panelTop)){
              child.classList.add("qmes-equipment-line-source-off");
            }
          });
        }
        level=parent;
      }
    });
  }

  let queued=false;
  const run=()=>{queued=false;fixPartnerTabGap();fixEquipmentLine();};
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(run);};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("resize",schedule);
  schedule();
})();
