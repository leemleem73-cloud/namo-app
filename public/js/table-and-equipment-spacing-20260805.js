(function(){
  "use strict";
  if(window.__QMES_TABLE_EQUIPMENT_SPACING_20260805__) return;
  window.__QMES_TABLE_EQUIPMENT_SPACING_20260805__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const texts=()=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"));
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
    table.qmes-equipment-centered-table th{font-weight:700!important;white-space:nowrap!important;}
    table.qmes-partner-centered-table td>*,
    table.qmes-equipment-centered-table td>*{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
      text-align-last:center!important;
      justify-content:center!important;
    }

    .qmes-ncr-action-pair{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
      width:auto!important;
      margin:0 auto!important;
      white-space:nowrap!important;
    }
    .qmes-ncr-action-pair>button{
      flex:0 0 auto!important;
      margin:0!important;
      min-height:34px!important;
    }
  `;
  document.head.appendChild(style);

  function markPartnerTables(){
    ["고객사 목록","공급업체 목록"].forEach(titleText=>{
      texts().forEach(element=>{
        if(clean(element.textContent)!==titleText) return;
        const panel=panelOf(element);
        if(!panel) return;
        panel.querySelectorAll("table").forEach(table=>table.classList.add("qmes-partner-centered-table"));
      });
    });
  }

  function markEquipmentTables(){
    const names=["설비대장","설비대장 현황","정기점검·교정","정기점검 현황","고장·수리 이력","고장·수리 현황"];
    texts().forEach(element=>{
      if(!names.includes(clean(element.textContent))) return;
      const panel=panelOf(element);
      if(!panel) return;
      panel.querySelectorAll("table").forEach(table=>table.classList.add("qmes-equipment-centered-table"));
    });
  }

  function alignNcrButtons(){
    const title=texts().find(element=>clean(element.textContent)==="부적합 현황");
    const table=panelOf(title)?.querySelector("table");
    if(!table) return;
    table.querySelectorAll("tbody tr").forEach(row=>{
      const last=row.lastElementChild;
      const buttons=Array.from(last?.querySelectorAll("button")||[])
        .filter(button=>["수정","조치 완료"].includes(clean(button.textContent)));
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

  let scheduled=false;
  const apply=()=>{
    scheduled=false;
    markPartnerTables();
    markEquipmentTables();
    alignNcrButtons();
  };
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(apply);
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
