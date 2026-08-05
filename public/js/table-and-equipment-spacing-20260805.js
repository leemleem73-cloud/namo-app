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

    /* 검색창 아래 목록과의 간격을 확실히 유지 */
    .qmes-partner-search-row{margin-bottom:22px!important;}
    .qmes-partner-table-spaced{margin-top:22px!important;}
    .qmes-partner-table-wrap-spaced{padding-top:22px!important;}

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
    const titles=["고객사 목록","공급업체 목록"];
    allText().forEach(element=>{
      if(!titles.includes(clean(element.textContent))) return;
      const panel=panelOf(element);
      if(!panel) return;
      const table=panel.querySelector("table");
      if(table){
        table.classList.add("qmes-partner-centered-table","qmes-partner-table-spaced");
        const wrap=table.parentElement;
        if(wrap&&wrap!==panel) wrap.classList.add("qmes-partner-table-wrap-spaced");
      }

      const searchInput=panel.querySelector('input[type="search"], input[placeholder*="검색"], input[placeholder*="고객"], input[placeholder*="공급"]');
      if(searchInput){
        let row=searchInput.parentElement;
        while(row&&row.parentElement!==panel&&row.parentElement){
          if(row.nextElementSibling&&(row.nextElementSibling.matches?.("table")||row.nextElementSibling.querySelector?.("table"))) break;
          row=row.parentElement;
        }
        row?.classList.add("qmes-partner-search-row");
      }
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
