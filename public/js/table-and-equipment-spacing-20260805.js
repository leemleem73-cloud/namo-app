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

    /* 고객사/공급업체 제목+검색+등록 행 */
    .qmes-partner-header-card{margin-bottom:20px!important;}
    .qmes-partner-header-row{
      display:flex!important;
      align-items:center!important;
      justify-content:space-between!important;
      gap:16px!important;
      min-height:52px!important;
      padding-top:8px!important;
      padding-bottom:8px!important;
    }
    .qmes-partner-header-actions{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      gap:8px!important;
      margin-left:auto!important;
      width:auto!important;
    }
    .qmes-partner-header-actions>button{align-self:center!important;margin-top:0!important;margin-bottom:0!important;}
    .qmes-partner-search-row{
      display:flex!important;
      align-items:center!important;
      gap:6px!important;
      width:auto!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }
    .qmes-partner-search-row input{
      width:290px!important;
      min-width:220px!important;
      max-width:290px!important;
      flex:0 0 290px!important;
      margin:0!important;
      text-align:center!important;
    }
    .qmes-partner-search-row input::placeholder{text-align:center!important;}
    .qmes-partner-search-row select{margin:0!important;flex:0 0 auto!important;}
    .qmes-partner-search-button{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:38px!important;
      min-width:38px!important;
      height:38px!important;
      padding:0!important;
      margin:0!important;
      flex:0 0 38px!important;
    }
    .qmes-partner-search-button svg{width:17px!important;height:17px!important;pointer-events:none!important;}
    .qmes-partner-old-search-card{display:none!important;}

    /* 설비 현황 상단에 겹쳐 보이는 중복 선 제거 */
    .qmes-equipment-register-panel,
    .qmes-equipment-register-header,
    .qmes-equipment-table-wrap,
    .qmes-equipment-table-wrap>table,
    .qmes-equipment-table-wrap>div:first-child{
      border-top:0!important;
      box-shadow:none!important;
    }
    .qmes-equipment-register-panel::before,
    .qmes-equipment-register-header::before,
    .qmes-equipment-table-wrap::before{display:none!important;content:none!important;}

    .qmes-ncr-action-pair{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;
      width:auto!important;margin:0 auto!important;white-space:nowrap!important;
    }
    .qmes-ncr-action-pair>button{flex:0 0 auto!important;margin:0!important;min-height:34px!important;}

    @media(max-width:900px){
      .qmes-partner-header-row{align-items:flex-start!important;flex-direction:column!important;}
      .qmes-partner-header-actions{width:100%!important;justify-content:flex-start!important;margin-left:0!important;}
      .qmes-partner-search-row input{flex:1 1 auto!important;width:auto!important;max-width:none!important;min-width:0!important;}
    }
  `;
  document.head.appendChild(style);

  function findHeader(titleEl,registerText,panel){
    let node=titleEl.parentElement;
    while(node&&node!==panel){
      if(Array.from(node.querySelectorAll("button")).some(btn=>clean(btn.textContent)===registerText)) return node;
      node=node.parentElement;
    }
    return null;
  }

  function findSearchInput(header){
    const selector='input[type="search"],input[placeholder*="검색"],input[placeholder*="고객사명"],input[placeholder*="공급업체명"],input[placeholder*="원료명"],input[placeholder*="LOT"]';
    const headerTop=header.getBoundingClientRect().top;
    return Array.from(document.querySelectorAll(selector)).find(input=>{
      const rect=input.getBoundingClientRect();
      return rect.top<headerTop&&headerTop-rect.bottom>=0&&headerTop-rect.bottom<420;
    });
  }

  function makeSearchButton(searchRow,searchInput){
    let button=Array.from(searchRow.querySelectorAll("button")).find(btn=>/검색/.test(clean(btn.textContent))||btn.getAttribute("aria-label")==="검색");
    if(!button){
      button=document.createElement("button");
      button.type="button";
      button.addEventListener("click",()=>{
        const form=searchInput.closest("form");
        if(form?.requestSubmit){form.requestSubmit();return;}
        searchInput.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true}));
        searchInput.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter",code:"Enter",bubbles:true}));
        searchInput.dispatchEvent(new Event("change",{bubbles:true}));
      });
      searchRow.appendChild(button);
    }
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>';
    button.setAttribute("aria-label","검색");
    button.setAttribute("title","검색");
    button.classList.add("qmes-partner-search-button");
    return button;
  }

  function movePartnerSearch(){
    [
      {title:"고객사 목록",register:"고객사 등록"},
      {title:"공급업체 목록",register:"공급업체 등록"}
    ].forEach(cfg=>{
      const titleEl=texts().find(el=>clean(el.textContent)===cfg.title);
      if(!titleEl) return;
      const panel=panelOf(titleEl);
      if(!panel) return;
      panel.classList.add("qmes-partner-header-card");
      panel.querySelectorAll("table").forEach(table=>table.classList.add("qmes-partner-centered-table"));

      const header=findHeader(titleEl,cfg.register,panel);
      if(!header) return;
      header.classList.add("qmes-partner-header-row");

      let actions=header.querySelector(":scope > .qmes-partner-header-actions");
      if(!actions){
        actions=document.createElement("div");
        actions.className="qmes-partner-header-actions";
        header.appendChild(actions);
      }

      const registerButton=Array.from(header.querySelectorAll("button")).find(btn=>clean(btn.textContent)===cfg.register);
      let searchInput=header.querySelector('input[type="search"],input[placeholder*="검색"],input[placeholder*="고객사명"],input[placeholder*="공급업체명"],input[placeholder*="원료명"],input[placeholder*="LOT"]');
      if(!searchInput) searchInput=findSearchInput(header);
      if(!searchInput) return;

      let searchRow=searchInput.parentElement;
      while(searchRow&&searchRow!==document.body){
        const count=searchRow.querySelectorAll("input,select,button").length;
        if(count>=1&&count<=8) break;
        searchRow=searchRow.parentElement;
      }
      if(!searchRow) return;

      let oldCard=searchRow;
      while(oldCard&&oldCard!==document.body){
        const cls=String(oldCard.className||"");
        if(/rounded/.test(cls)&&/border/.test(cls)) break;
        oldCard=oldCard.parentElement;
      }

      searchRow.classList.add("qmes-partner-search-row");
      makeSearchButton(searchRow,searchInput);
      actions.appendChild(searchRow);
      if(registerButton) actions.appendChild(registerButton);
      searchInput.dataset.qmesMovedPartnerSearch="true";
      if(oldCard&&oldCard!==searchRow&&oldCard!==header&&oldCard.childElementCount===0) oldCard.classList.add("qmes-partner-old-search-card");
    });
  }

  function markEquipmentTables(){
    const names=["설비대장","설비대장 현황","정기점검·교정","정기점검 현황","고장·수리 이력","고장·수리 현황"];
    texts().forEach(el=>{
      if(!names.includes(clean(el.textContent))) return;
      const panel=panelOf(el);
      if(!panel) return;
      panel.classList.add("qmes-equipment-register-panel");
      panel.querySelectorAll("table").forEach(table=>{
        table.classList.add("qmes-equipment-centered-table");
        const wrap=table.parentElement;
        if(wrap) wrap.classList.add("qmes-equipment-table-wrap");
      });
      let header=el.parentElement;
      while(header&&header!==panel){
        if(header.querySelector("button")){
          header.classList.add("qmes-equipment-register-header");
          const next=header.nextElementSibling;
          if(next) next.classList.add("qmes-equipment-table-wrap");
          break;
        }
        header=header.parentElement;
      }
    });
  }

  function alignNcrButtons(){
    const title=texts().find(el=>clean(el.textContent)==="부적합 현황");
    const table=panelOf(title)?.querySelector("table");
    if(!table) return;
    table.querySelectorAll("tbody tr").forEach(row=>{
      const last=row.lastElementChild;
      const buttons=Array.from(last?.querySelectorAll("button")||[]).filter(btn=>["수정","조치 완료"].includes(clean(btn.textContent)));
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
  const apply=()=>{scheduled=false;movePartnerSearch();markEquipmentTables();alignNcrButtons();};
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(apply);};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  schedule();
})();
