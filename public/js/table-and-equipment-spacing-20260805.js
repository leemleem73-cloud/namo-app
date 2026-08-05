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
    table.qmes-partner-centered-table,
    table.qmes-equipment-centered-table{width:100%!important;table-layout:fixed!important;}

    table.qmes-partner-centered-table th,
    table.qmes-partner-centered-table td,
    table.qmes-equipment-centered-table th,
    table.qmes-equipment-centered-table td{
      box-sizing:border-box!important;
      padding:10px 8px!important;
      text-align:center!important;
      vertical-align:middle!important;
      line-height:20px!important;
    }
    table.qmes-partner-centered-table th,
    table.qmes-equipment-centered-table th{
      font-weight:700!important;
      white-space:nowrap!important;
    }
    table.qmes-partner-centered-table td button,
    table.qmes-partner-centered-table td select,
    table.qmes-partner-centered-table td input,
    table.qmes-equipment-centered-table td button,
    table.qmes-equipment-centered-table td select,
    table.qmes-equipment-centered-table td input{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
      text-align-last:center!important;
    }

    /* 검색 컨트롤 폭과 입력 글자 정렬 */
    .qmes-partner-search-inline{
      display:flex!important;
      flex-direction:row!important;
      flex-wrap:nowrap!important;
      align-items:center!important;
      justify-content:flex-start!important;
      gap:8px!important;
      width:fit-content!important;
      max-width:100%!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
    }
    .qmes-partner-search-inline input{
      flex:0 0 320px!important;
      width:320px!important;
      max-width:320px!important;
      min-width:240px!important;
      text-align:center!important;
    }
    .qmes-partner-search-inline input::placeholder{text-align:center!important;}
    .qmes-partner-search-inline button,
    .qmes-partner-search-inline select{flex:0 0 auto!important;}

    /* 검색 박스 테두리와 목록 박스 테두리 사이의 바깥 여백 */
    .qmes-partner-search-card{
      margin-bottom:24px!important;
    }
    .qmes-partner-header-spaced{
      margin-top:0!important;
      padding-top:0!important;
    }

    @media (max-width:760px){
      .qmes-partner-search-inline{width:100%!important;}
      .qmes-partner-search-inline input{
        flex:1 1 auto!important;
        width:auto!important;
        max-width:none!important;
        min-width:0!important;
      }
    }

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
    const selector='input[type="search"], input[placeholder*="검색"], input[placeholder*="고객사명"], input[placeholder*="공급업체명"], input[placeholder*="원료명"], input[placeholder*="LOT"]';

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

        const headerTop=header?.getBoundingClientRect().top??Infinity;
        const searchInput=Array.from(document.querySelectorAll(selector)).find(input=>{
          const rect=input.getBoundingClientRect();
          return rect.top<headerTop&&headerTop-rect.bottom>=0&&headerTop-rect.bottom<260;
        });
        if(!searchInput) return;

        let row=searchInput.parentElement;
        while(row&&row!==document.body){
          const controls=row.querySelectorAll?.("input,select,button").length||0;
          if(controls>=1&&controls<=8) break;
          row=row.parentElement;
        }
        row?.classList.add("qmes-partner-search-inline");

        let searchCard=searchInput.parentElement;
        while(searchCard&&searchCard!==document.body){
          const cls=String(searchCard.className||"");
          if(/rounded/.test(cls)&&/border/.test(cls)) break;
          searchCard=searchCard.parentElement;
        }
        if(searchCard&&searchCard!==document.body) searchCard.classList.add("qmes-partner-search-card");
        else row?.classList.add("qmes-partner-search-card");
      });
    });
  }

  function markEquipmentTables(){
    const titles=["설비대장","정기점검·교정","고장·수리 이력","고장·수리 현황"];
    allText().forEach(element=>{
      if(!titles.includes(clean(element.textContent))) return;
      const panel=panelOf(element);
      if(!panel) return;
      panel.querySelectorAll("table").forEach(table=>table.classList.add("qmes-equipment-centered-table"));
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
  const apply=()=>{
    scheduled=false;
    markPartnerTables();
    markEquipmentTables();
    alignNcrButtons();
    markEquipmentSpacing();
  };
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(apply);};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
