(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_LAYOUT_REFINEMENT_20260805__) return;
  window.__QMES_EQUIPMENT_LAYOUT_REFINEMENT_20260805__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const style=document.createElement("style");
  style.id="qmes-equipment-layout-refinement-20260805-style";
  style.textContent=`
    /* 설비관리 제목 아래 중복 구분선 제거 */
    .qmes-equipment-main-title{
      border-bottom:0!important;
      padding-bottom:0!important;
    }

    /* 등록 설비 카드와 하단 메뉴 사이를 아래 콘텐츠 간격만큼 분리 */
    .qmes-equipment-kpi-block{
      margin-bottom:24px!important;
    }
    .qmes-equipment-nav-block{
      margin-top:0!important;
      margin-bottom:24px!important;
    }

    /* 설비대장·정기점검·고장수리 신규등록 버튼 세로 중앙 정렬 */
    .qmes-equipment-section-title{
      align-items:center!important;
      min-height:54px!important;
      padding-top:8px!important;
      padding-bottom:8px!important;
    }
    .qmes-equipment-section-title>div:last-child,
    .qmes-equipment-section-title>button{
      align-self:center!important;
      margin-top:0!important;
      margin-bottom:0!important;
    }
    .qmes-equipment-section-title button{
      position:relative!important;
      top:0!important;
      transform:none!important;
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

    /* 최상단 설비관리 제목 행의 하단선만 제거 */
    let mainTitleRow=equipmentTitle.parentElement;
    while(mainTitleRow&&mainTitleRow!==root){
      const classes=String(mainTitleRow.className||"");
      if(classes.includes("border-b")){
        mainTitleRow.classList.add("qmes-equipment-main-title");
        break;
      }
      mainTitleRow=mainTitleRow.parentElement;
    }

    const navButtons=Array.from(root.querySelectorAll("button")).filter(button=>["일일점검","설비대장","정기점검·교정","고장·수리 이력"].includes(clean(button.textContent)));
    if(navButtons.length>=4){
      const nav=navButtons[0].parentElement;
      nav?.classList.add("qmes-equipment-nav-block");

      /* 메뉴 바로 위에서 '등록 설비' 수치를 포함하는 KPI 카드 묶음을 직접 찾음 */
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
  schedule();
})();
