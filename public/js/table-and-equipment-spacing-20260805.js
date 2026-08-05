(function(){
  "use strict";
  if(window.__QMES_TABLE_EQUIPMENT_SPACING_20260805__) return;
  window.__QMES_TABLE_EQUIPMENT_SPACING_20260805__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const allText=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"));
  const panelOf=element=>{
    let node=element;
    while(node&&node!==document.body){
      const cls=String(node.className||"");
      if(/rounded/.test(cls)&&/border/.test(cls)) return node;
      node=node.parentElement;
    }
    return null;
  };

  const style=document.createElement("style");
  style.id="qmes-table-equipment-spacing-20260805-style";
  style.textContent=`
    table.qmes-partner-centered-table{width:100%!important;table-layout:fixed!important;}
    table.qmes-partner-centered-table th,
    table.qmes-partner-centered-table td{
      box-sizing:border-box!important;padding:10px 8px!important;text-align:center!important;
      vertical-align:middle!important;line-height:20px!important;
    }
    table.qmes-partner-centered-table th{font-weight:700!important;white-space:nowrap!important;}
    table.qmes-partner-centered-table td button,
    table.qmes-partner-centered-table td select,
    table.qmes-partner-centered-table td input{
      margin-left:auto!important;margin-right:auto!important;text-align:center!important;text-align-last:center!important;
    }

    /* 위쪽 검색 영역의 큰 박스를 없애고 한 줄 검색 영역으로 정리 */
    .qmes-partner-search-inline{
      display:flex!important;
      flex-direction:row!important;
      flex-wrap:nowrap!important;
      align-items:center!important;
      gap:8px!important;
      width:100%!important;
      min-height:0!important;
      margin:0 0 18px 0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }
    .qmes-partner-search-inline input,
    .qmes-partner-search-inline select,
    .qmes-partner-search-inline button{
      margin-top:0!important;
      margin-bottom:0!important;
    }
    .qmes-partner-search-inline input{
      flex:1 1 auto!important;
      min-width:0!important;
    }
    .qmes-partner-search-inline button,
    .qmes-partner-search-inline select{
      flex:0 0 auto!important;
    }
    .qmes-partner-header-spaced{margin-top:0!important;margin-bottom:0!important;}

    .qmes-ncr-action-pair{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;
      width:auto!important;margin:0 auto!important;white-space:nowrap!important;
    }
    .qmes-ncr-action-pair>button{flex:0 0 auto!important;margin:0!important;min-height:34px!important;}

    .qmes-equipment-kpi-block{margin-bottom:20px!important;}
    .qmes-equipment-daily-block{margin-top:20px!important;margin-bottom:20px!important;}
    .qmes-equipment-plan-block{margin-top:20px!important;}
  `;
  document.head.appendChild(style);

  function markPartnerTables(){
    const configs=[
      {title:"고객사 목록",button:"고객사 등록"},
      {title:"공급업체 목록",button:"공급업체 등록"}
    ];

    configs.forEach(({title,button})=>{
      allText().forEach(element=>{
        if(clean(element.textContent)!==title) return;
        const panel=panelOf(element);
        if(!panel) return;

        const table=panel.querySelector("table");
        if(table) table.classList.add("qmes-partner-centered-table");

        let header=element.parentElement;
        while(header&&header!==panel){
          const hasRegister=Array.from(header.querySelectorAll("button")).some(btn=>clean(btn.textContent)===button);
          if(hasRegister){
            header.classList.add("qmes-partner-header-spaced");
            break;
          }
          header=header.parentElement;
        }

        if(!header||header===panel) return;

        /* 제목칸 위쪽에서 검색 input을 포함한 가장 가까운 형제 영역을 찾아 큰 박스 스타일 제거 */
        let candidate=header.previousElementSibling;
        while(candidate){
          const searchInput=candidate.querySelector?.('input[type="search"], input[placeholder*="검색"], input[placeholder*="고객"], input[placeholder*="공급"]');
          if(searchInput){
            candidate.classList.add("qmes-partner-search-inline");
            break;
          }
          candidate=candidate.previousElementSibling;
        }

        /* 같은 패널 안에 검색 영역이 중첩된 구조도 대응 */
        if(!candidate){
          const searchInput=panel.querySelector('input[type="search"], input[placeholder*="검색"], input[placeholder*="고객"], input[placeholder*="공급"]');
          if(searchInput){
            let row=searchInput.parentElement;
            while(row&&row!==panel&&row.parentElement!==panel){
              if(row.querySelectorAll("input,select,button").length>=1) break;
              row=row.parentElement;
            }
            row?.classList.add("qmes-partner-search-inline");
          }
        }
      });
    });
  }

  function alignNcrButtons(){
    const title=allText().find(element=>clean(element.textContent)==="부적합 현황");
    const table=panelOf(title)?.querySelector("table");
    if(!table) return;
    table.querySelectorAll("tbody tr").forEach(row=>{
      const last=row.lastElementChild;
      if(!last) return;
      const buttons=Array.from(last.querySelectorAll("button")).filter(button=>["수정","조치 완료"].includes(clean(button.textContent)));
      if(buttons.length<2) return;
      let wrap=buttons[0].parentElement;
      if(!wrap||wrap===last){
        wrap=document.createElement("div");
        buttons[0].before(wrap);
        buttons.forEach(button=>wrap.appendChild(button));
      }
      wrap.classList.add("qmes-ncr-action-pair");
    });
  }

  function markEquipmentSpacing(){
    const texts=allText();
    const equipmentTitle=texts.find(element=>clean(element.textContent)==="설비 관리");
    if(!equipmentTitle) return;
    const root=equipmentTitle.closest("div.flex.flex-col")||equipmentTitle.parentElement?.parentElement;
    if(!root) return;

    const children=Array.from(root.children||[]);
    const kpi=children.find(node=>/등록 설비/.test(clean(node.textContent))&&/30일 이내 일정/.test(clean(node.textContent)));
    if(kpi) kpi.classList.add("qmes-equipment-kpi-block");

    const dailyTitle=texts.find(element=>clean(element.textContent)==="일일점검");
    const dailyBlock=dailyTitle?panelOf(dailyTitle)||dailyTitle.parentElement:null;
    if(dailyBlock) dailyBlock.classList.add("qmes-equipment-daily-block");

    const planTitle=texts.find(element=>/관리계획서/.test(clean(element.textContent))&&clean(element.textContent).length<40);
    const planBlock=planTitle?panelOf(planTitle)||planTitle.parentElement:null;
    if(planBlock) planBlock.classList.add("qmes-equipment-plan-block");
  }

  let scheduled=false;
  const apply=()=>{scheduled=false;markPartnerTables();alignNcrButtons();markEquipmentSpacing();};
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(apply);};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
