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

    .qmes-equipment-nav-block{
      display:flex!important;width:max-content!important;max-width:100%!important;
      align-items:center!important;gap:8px!important;margin-top:0!important;margin-bottom:24px!important;
      padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;
    }
    .qmes-equipment-nav-block>button{
      width:auto!important;min-width:92px!important;min-height:36px!important;height:36px!important;
      padding:7px 14px!important;border-radius:8px!important;font-size:12px!important;
      line-height:20px!important;flex:none!important;
    }

    .qmes-equipment-section-title{
      display:flex!important;min-height:52px!important;align-items:center!important;
      justify-content:space-between!important;gap:16px!important;padding-top:8px!important;padding-bottom:8px!important;
      border-bottom:0!important;
    }
    .qmes-equipment-section-title>div,
    .qmes-equipment-section-title>h1,
    .qmes-equipment-section-title>h2,
    .qmes-equipment-section-title>h3,
    .qmes-equipment-section-title>h4{
      margin-top:0!important;margin-bottom:0!important;align-self:center!important;
    }
    .qmes-equipment-section-title button{
      position:static!important;top:auto!important;align-self:center!important;
      margin:0!important;transform:none!important;flex:none!important;
    }

    /* 신규등록 아래 콘텐츠 위에 겹쳐 보이는 중복 선 제거 */
    .qmes-equipment-content-no-top-line,
    .qmes-equipment-content-no-top-line>div:first-child,
    .qmes-equipment-content-no-top-line table{
      border-top:0!important;
    }

    /* 설비대장·정기점검·고장수리 표의 제목/내용 여백과 정렬 통일 */
    table.qmes-equipment-centered-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    table.qmes-equipment-centered-table th,
    table.qmes-equipment-centered-table td{
      box-sizing:border-box!important;
      padding:10px 8px!important;
      text-align:center!important;
      vertical-align:middle!important;
      line-height:20px!important;
    }
    table.qmes-equipment-centered-table th{
      font-weight:700!important;
      white-space:nowrap!important;
    }
    table.qmes-equipment-centered-table td>*{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
      justify-content:center!important;
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

          const content=row.nextElementSibling;
          if(content){
            content.classList.add("qmes-equipment-content-no-top-line");
            const table=content.matches?.("table")?content:content.querySelector?.("table");
            table?.classList.add("qmes-equipment-centered-table");
          }
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
