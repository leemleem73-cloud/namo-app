(function(){
  "use strict";
  if(window.__QMES_PARTNER_EQUIPMENT_FIX_20260805__) return;
  window.__QMES_PARTNER_EQUIPMENT_FIX_20260805__=true;

  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  const all=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span,button"));

  const style=document.createElement("style");
  style.id="qmes-partner-equipment-fix-20260805-style";
  style.textContent=`
    /* 위쪽 고객사/공급업체 탭 묶음과 아래 목록 카드 사이의 실제 바깥 간격 */
    .qmes-partner-tabs-separated{
      margin-bottom:20px!important;
    }

    /* 검색창 내부 돋보기 */
    .qmes-partner-search-row{position:relative!important;}
    .qmes-partner-search-row input{
      padding-right:40px!important;
      text-align:center!important;
    }
    .qmes-partner-search-row input::placeholder{text-align:center!important;}
    .qmes-partner-search-button{
      position:absolute!important;
      right:4px!important;
      top:50%!important;
      transform:translateY(-50%)!important;
      width:32px!important;
      min-width:32px!important;
      height:32px!important;
      padding:0!important;
      margin:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      z-index:3!important;
    }
    .qmes-partner-search-button svg{width:17px!important;height:17px!important;}

    /* 설비대장 현황의 둥근 카드 위에 따로 남은 선 제거 */
    .qmes-equipment-panel-parent-line-off,
    .qmes-equipment-panel-parent-line-off::before,
    .qmes-equipment-panel-parent-line-off::after{
      border-top:0!important;
      box-shadow:none!important;
    }
    .qmes-equipment-panel-parent-line-off::before,
    .qmes-equipment-panel-parent-line-off::after{
      display:none!important;
      content:none!important;
    }
    .qmes-equipment-extra-line-hidden{
      display:none!important;
      border:0!important;
      box-shadow:none!important;
      height:0!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      overflow:hidden!important;
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
    const customerCandidates=all().filter(el=>clean(el.textContent)==="고객사 목록");
    const supplierCandidates=all().filter(el=>clean(el.textContent)==="공급업체 목록");

    let best=null;
    customerCandidates.forEach(customer=>{
      supplierCandidates.forEach(supplier=>{
        const common=nearestCommonParent(customer,supplier);
        if(!common) return;
        const rect=common.getBoundingClientRect();
        const customerRect=customer.getBoundingClientRect();
        const supplierRect=supplier.getBoundingClientRect();
        const sameRow=Math.abs(customerRect.top-supplierRect.top)<12;
        const compact=rect.height>25&&rect.height<180;
        if(sameRow&&compact&&!best) best=common;
      });
    });

    if(best) best.classList.add("qmes-partner-tabs-separated");
  }

  function fixEquipmentLine(){
    const titles=all().filter(el=>clean(el.textContent)==="설비대장 현황");
    titles.forEach(title=>{
      let panel=title;
      while(panel&&panel!==document.body){
        const cls=String(panel.className||"");
        if(/rounded/.test(cls)&&/border/.test(cls)) break;
        panel=panel.parentElement;
      }
      if(!panel||panel===document.body) return;

      /* 카드 자체의 둥근 테두리는 유지하고 바깥 부모의 위 선만 제거 */
      const parent=panel.parentElement;
      if(parent) parent.classList.add("qmes-equipment-panel-parent-line-off");

      /* 카드 직전에 별도 구분선 노드가 있으면 그 노드만 숨김 */
      let prev=panel.previousElementSibling;
      if(prev){
        const text=clean(prev.textContent);
        const rect=prev.getBoundingClientRect();
        const style=getComputedStyle(prev);
        const lineLike=!text&&(
          rect.height<=16||
          parseFloat(style.borderTopWidth)>0||
          parseFloat(style.borderBottomWidth)>0
        );
        if(lineLike) prev.classList.add("qmes-equipment-extra-line-hidden");
      }

      /* 바깥 부모의 첫 번째 빈 구분선도 제거 */
      if(parent){
        Array.from(parent.children).forEach(child=>{
          if(child===panel) return;
          const rect=child.getBoundingClientRect();
          const text=clean(child.textContent);
          if(!text&&rect.bottom<=panel.getBoundingClientRect().top&&rect.height<=16){
            child.classList.add("qmes-equipment-extra-line-hidden");
          }
        });
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
