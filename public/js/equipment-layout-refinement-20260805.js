(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_LAYOUT_REFINEMENT_20260805__) return;
  window.__QMES_EQUIPMENT_LAYOUT_REFINEMENT_20260805__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const style=document.createElement("style");
  style.id="qmes-equipment-layout-refinement-20260805-style";
  style.textContent=`
    .qmes-equipment-main-title{border-bottom:0!important;padding-bottom:0!important;}
    .qmes-equipment-kpi-block{margin-bottom:24px!important;}

    /* 큰 카드형 메뉴를 낮고 심플한 탭으로 축소 */
    .qmes-equipment-nav-block{
      display:flex!important;
      width:max-content!important;
      max-width:100%!important;
      align-items:center!important;
      gap:8px!important;
      margin-top:0!important;
      margin-bottom:24px!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }
    .qmes-equipment-nav-block>button{
      width:auto!important;
      min-width:92px!important;
      min-height:36px!important;
      height:36px!important;
      padding:7px 14px!important;
      border-radius:8px!important;
      font-size:12px!important;
      line-height:20px!important;
      flex:none!important;
    }

    /* 제목과 신규등록 버튼을 같은 행의 정확한 중앙에 배치 */
    .qmes-equipment-section-title{
      display:flex!important;
      min-height:52px!important;
      align-items:center!important;
      justify-content:space-between!important;
      gap:16px!important;
      padding-top:8px!important;
      padding-bottom:8px!important;
    }
    .qmes-equipment-section-title>div,
    .qmes-equipment-section-title>h1,
    .qmes-equipment-section-title>h2,
    .qmes-equipment-section-title>h3,
    .qmes-equipment-section-title>h4{
      margin-top:0!important;
      margin-bottom:0!important;
      align-self:center!important;
    }
    .qmes-equipment-section-title button{
      position:static!important;
      top:auto!important;
      align-self:center!important;
      margin:0!important;
      transform:none!important;
      flex:none!important;
    }
  `;
  document.head.appendChild(style);

  function mark(){
    const all=Array.from(document.querySelectorAll("h1,h2,h3,h4,div,span,button"));
    const equipmentTitle=all.find(el=>clean(el.textContent)==="설비 관리");
    if(!equipmentTitle) return;
    let root=equipmentTitle;
    while(root&&root!==document.body){
      if(String(root.className||"").includes("flex-col")&&root.querySelectorAll("button").length>=4) break;
      root=root.parentElement;
    }
    if(!root||root===document.body) return;

    let mainTitleRow=equipmentTitle.parentElement;
    while(mainTitleRow&&mainTitleRow!==root){
      if(String(mainTitleRow.className||"").includes("border-b")){
        mainTitleRow.classList.add("qmes-equipment-main-title");
        break;
      }
      mainTitleRow=mainTitleRow.parentElement;
    }

    const names=["일일점검","설비대장","정기점검·교정","고장·수리 이력"];
    const navButtons=Array.from(root.querySelectorAll("button")).filter(button=>names.includes(clean(button.textContent)));
    if(navButtons.length>=4){
      const nav=navButtons[0].parentElement;
      nav?.classList.add("qmes-equipment-nav-block");
      let previous=nav?.previousElementSibling;
      while(previous&&previous!==equipmentTitle.parentElement){
        if(clean(previous.textContent).includes("등록 설비")){
          previous.classList.add("qmes-equipment-kpi-block");
          break;
        }
        previous=previous.previousElementSibling;
      }
    }

    ["설비대장","정기점검·교정","고장·수리 이력"].forEach(titleText=>{
      const title=all.find(el=>clean(el.textContent)===titleText);
      if(!title) return;
      let row=title.parentElement;
      while(row&&row!==root){
        const button=Array.from(row.querySelectorAll("button")).find(btn=>clean(btn.textContent)==="신규등록");
        if(button){
          row.classList.add("qmes-equipment-section-title");
          break;
        }
        row=row.parentElement;
      }
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;mark();});
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  window.addEventListener("resize",schedule);
  schedule();
})();
