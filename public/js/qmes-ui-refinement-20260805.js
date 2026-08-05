(function(){
  "use strict";
  if(window.__QMES_UI_REFINEMENT_20260805__) return;
  window.__QMES_UI_REFINEMENT_20260805__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const panelOf=element=>{
    let node=element;
    while(node&&node!==document.body){
      const classes=String(node.className||"");
      if(/rounded/.test(classes)&&/border/.test(classes)) return node;
      node=node.parentElement;
    }
    return null;
  };
  const findShortText=text=>Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"))
    .find(element=>clean(element.textContent)===text&&clean(element.textContent).length<80);

  const style=document.createElement("style");
  style.id="qmes-ui-refinement-20260805-style";
  style.textContent=`
    /* LOT 통합 조회: 상단 버튼 영역과 검색창 폭·높이를 동일하게 맞춤 */
    .qmes-lot-mode-row,
    .qmes-lot-search-row{
      width:100%!important;
      max-width:none!important;
      box-sizing:border-box!important;
      margin-left:0!important;
      margin-right:0!important;
    }
    .qmes-lot-mode-row button{
      min-height:36px!important;
      padding:7px 12px!important;
    }
    .qmes-lot-search-row{
      min-height:36px!important;
      padding:7px 12px!important;
    }
    .qmes-lot-search-row input{width:100%!important;min-width:0!important;}

    /* 생산실적 상태 배지: '발행' 글자 폭에 맞게만 표시 */
    .qmes-production-table tbody td:last-child > span,
    .qmes-production-table tbody td:last-child > div,
    .qmes-production-table tbody td:last-child [class*="rounded"]{
      width:auto!important;
      min-width:0!important;
      max-width:max-content!important;
      display:inline-flex!important;
      padding-left:8px!important;
      padding-right:8px!important;
      white-space:nowrap!important;
    }
    .qmes-production-table tbody td:last-child{text-align:center!important;}

    /* 부적합 현황: 제목과 데이터의 좌우 여백·정렬 통일 */
    table.qmes-ncr-refined-table{
      table-layout:fixed!important;
      width:100%!important;
      min-width:1040px!important;
    }
    table.qmes-ncr-refined-table th,
    table.qmes-ncr-refined-table td{
      box-sizing:border-box!important;
      padding:10px 8px!important;
      text-align:center!important;
      vertical-align:middle!important;
      line-height:1.45!important;
    }
    table.qmes-ncr-refined-table th{font-weight:700!important;white-space:nowrap!important;}
    table.qmes-ncr-refined-table td{word-break:keep-all!important;}
    table.qmes-ncr-refined-table td:nth-child(4),
    table.qmes-ncr-refined-table td:nth-child(5){word-break:break-word!important;}
    table.qmes-ncr-refined-table td:last-child button{margin:0 auto!important;}

    #qmes-ncr-action-picker{
      position:fixed!important;
      z-index:30000!important;
      width:180px!important;
      padding:10px!important;
      border:1px solid #475569!important;
      border-radius:10px!important;
      background:#0f172a!important;
      box-shadow:0 18px 45px rgba(0,0,0,.45)!important;
    }
    #qmes-ncr-action-picker label{display:block;margin-bottom:7px;color:#94a3b8;font-size:11px;font-weight:800;}
    #qmes-ncr-action-picker select{
      width:100%!important;height:38px!important;padding:0 10px!important;
      border:1px solid #475569!important;border-radius:8px!important;
      background:#1e293b!important;color:#f8fafc!important;font-size:12px!important;font-weight:800!important;
      outline:none!important;
    }
  `;
  document.head.appendChild(style);

  function markLotLayout(){
    const title=findShortText("LOT 통합 추적");
    const panel=panelOf(title);
    if(!panel) return;
    const buttons=Array.from(panel.querySelectorAll("button"));
    const finished=buttons.find(button=>clean(button.textContent)==="완제품 LOT 조회");
    const raw=buttons.find(button=>clean(button.textContent)==="원료 LOT 역추적");
    if(finished&&raw&&finished.parentElement===raw.parentElement) finished.parentElement.classList.add("qmes-lot-mode-row");
    const searchInput=panel.querySelector('input[placeholder*="LOT"]');
    if(searchInput?.parentElement) searchInput.parentElement.classList.add("qmes-lot-search-row");
  }

  function markNcrTable(){
    const title=findShortText("부적합 현황");
    const panel=panelOf(title);
    const table=panel?.querySelector("table");
    if(table) table.classList.add("qmes-ncr-refined-table");
  }

  function removePicker(){document.getElementById("qmes-ncr-action-picker")?.remove();}
  let allowOriginalAction=false;

  function openActionPicker(button){
    removePicker();
    const rect=button.getBoundingClientRect();
    const picker=document.createElement("div");
    picker.id="qmes-ncr-action-picker";
    picker.innerHTML='<label>관리 작업 선택</label><select aria-label="부적합 관리 작업"><option value="">선택해 주세요</option><option value="complete">조치 완료</option><option value="cancel">취소</option></select>';
    document.body.appendChild(picker);
    const left=Math.max(8,Math.min(window.innerWidth-188,rect.right-180));
    const top=Math.min(window.innerHeight-80,rect.bottom+6);
    picker.style.left=left+"px";
    picker.style.top=top+"px";
    const select=picker.querySelector("select");
    select.addEventListener("change",()=>{
      if(select.value==="complete"){
        allowOriginalAction=true;
        removePicker();
        button.click();
        allowOriginalAction=false;
      }else if(select.value==="cancel") removePicker();
    });
    select.focus();
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("button");
    if(!button||clean(button.textContent)!=="조치 완료"||allowOriginalAction) return;
    const table=button.closest("table.qmes-ncr-refined-table");
    if(!table) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openActionPicker(button);
  },true);
  document.addEventListener("click",event=>{
    const picker=document.getElementById("qmes-ncr-action-picker");
    if(picker&&!picker.contains(event.target)&&clean(event.target?.textContent)!=="조치 완료") removePicker();
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape")removePicker();});
  window.addEventListener("scroll",removePicker,true);
  window.addEventListener("resize",removePicker);

  let scheduled=false;
  const apply=()=>{scheduled=false;markLotLayout();markNcrTable();};
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(apply);};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("qmes:data-updated",schedule);
  document.addEventListener("click",schedule,true);
  schedule();
})();
