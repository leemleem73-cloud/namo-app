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
  const getDb=()=>{try{return typeof DB!=="undefined"?DB:window.DB}catch(_){return window.DB}};

  const style=document.createElement("style");
  style.id="qmes-ui-refinement-20260805-style";
  style.textContent=`
    .qmes-lot-mode-row{
      width:max-content!important;
      max-width:100%!important;
      box-sizing:border-box!important;
      margin-left:0!important;
      margin-right:0!important;
    }
    .qmes-lot-mode-row button{
      min-height:36px!important;
      padding:7px 12px!important;
    }
    .qmes-lot-search-row{
      max-width:100%!important;
      min-height:36px!important;
      box-sizing:border-box!important;
      margin-left:0!important;
      margin-right:0!important;
      padding:7px 12px!important;
    }
    .qmes-lot-search-row input{width:100%!important;min-width:0!important;}

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

    #qmes-ncr-edit-overlay{
      position:fixed!important;inset:0!important;z-index:31000!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      padding:18px!important;background:rgba(2,6,23,.78)!important;backdrop-filter:blur(3px)!important;
    }
    #qmes-ncr-edit-modal{
      width:min(760px,100%)!important;max-height:92vh!important;overflow:auto!important;
      border:1px solid #475569!important;border-radius:16px!important;background:#0f172a!important;
      box-shadow:0 24px 70px rgba(0,0,0,.55)!important;color:#f8fafc!important;
    }
    #qmes-ncr-edit-modal .qmes-ncr-edit-head{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      padding:16px 18px!important;border-bottom:1px solid #334155!important;
    }
    #qmes-ncr-edit-modal .qmes-ncr-edit-title{font-size:16px!important;font-weight:900!important;}
    #qmes-ncr-edit-modal .qmes-ncr-edit-body{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:14px!important;padding:18px!important;
    }
    #qmes-ncr-edit-modal label{display:block!important;color:#94a3b8!important;font-size:12px!important;font-weight:800!important;}
    #qmes-ncr-edit-modal label.qmes-wide{grid-column:1/-1!important;}
    #qmes-ncr-edit-modal input,
    #qmes-ncr-edit-modal textarea{
      width:100%!important;box-sizing:border-box!important;margin-top:6px!important;
      border:1px solid #475569!important;border-radius:9px!important;background:#111c2f!important;
      padding:10px 11px!important;color:#f8fafc!important;font:inherit!important;outline:none!important;
    }
    #qmes-ncr-edit-modal textarea{min-height:92px!important;resize:vertical!important;}
    #qmes-ncr-edit-modal .qmes-ncr-edit-foot{
      display:flex!important;justify-content:flex-end!important;gap:8px!important;
      padding:14px 18px!important;border-top:1px solid #334155!important;
    }
    #qmes-ncr-edit-modal button{
      min-height:38px!important;border-radius:9px!important;padding:8px 14px!important;
      font-size:12px!important;font-weight:900!important;cursor:pointer!important;
    }
    #qmes-ncr-edit-modal .qmes-cancel{border:1px solid #475569!important;background:#1e293b!important;color:#cbd5e1!important;}
    #qmes-ncr-edit-modal .qmes-save{border:1px solid #0284c7!important;background:#075985!important;color:#fff!important;}
    #qmes-ncr-edit-modal .qmes-complete{border:1px solid #059669!important;background:#047857!important;color:#fff!important;}
    @media(max-width:640px){#qmes-ncr-edit-modal .qmes-ncr-edit-body{grid-template-columns:1fr!important;}}
  `;
  document.head.appendChild(style);

  function markLotLayout(){
    const title=findShortText("LOT 통합 추적");
    const panel=panelOf(title);
    if(!panel) return;
    const buttons=Array.from(panel.querySelectorAll("button"));
    const finished=buttons.find(button=>clean(button.textContent)==="완제품 LOT 조회");
    const raw=buttons.find(button=>clean(button.textContent)==="원료 LOT 역추적"||clean(button.textContent)==="완료 LOT 역추적");
    const searchInput=panel.querySelector('input[placeholder*="LOT"]');
    const searchWrap=searchInput?.parentElement;
    if(finished&&raw&&finished.parentElement===raw.parentElement){
      const row=finished.parentElement;
      row.classList.add("qmes-lot-mode-row");
      const width=Math.ceil(raw.getBoundingClientRect().right-finished.getBoundingClientRect().left);
      if(width>0&&searchWrap){
        searchWrap.classList.add("qmes-lot-search-row");
        searchWrap.style.setProperty("width",`${width}px`,"important");
      }
    }
  }

  function markNcrTable(){
    const title=findShortText("부적합 현황");
    const panel=panelOf(title);
    const table=panel?.querySelector("table");
    if(table) table.classList.add("qmes-ncr-refined-table");
  }

  function closeNcrEditor(){document.getElementById("qmes-ncr-edit-overlay")?.remove();}
  let allowOriginalAction=false;

  function openNcrEditor(button){
    closeNcrEditor();
    const row=button.closest("tr");
    const no=clean(row?.querySelector("td")?.textContent);
    const store=getDb();
    const record=(store?.ncrs||[]).find(item=>clean(item?.no)===no);
    if(!record) return;

    const overlay=document.createElement("div");
    overlay.id="qmes-ncr-edit-overlay";
    overlay.innerHTML=`
      <div id="qmes-ncr-edit-modal" role="dialog" aria-modal="true" aria-label="부적합 조치 확인 및 수정">
        <div class="qmes-ncr-edit-head">
          <div><div class="qmes-ncr-edit-title">${no} 조치 확인 및 수정</div><div style="margin-top:4px;color:#64748b;font-size:11px">내용을 확인하거나 수정한 뒤 조치 완료하세요.</div></div>
          <button type="button" class="qmes-cancel" data-action="close">닫기</button>
        </div>
        <div class="qmes-ncr-edit-body">
          <label>담당자<input data-field="owner" value="${String(record.owner||"").replace(/"/g,"&quot;")}"></label>
          <label>격리 위치<input data-field="rack" value="${String(record.rack||"").replace(/"/g,"&quot;")}"></label>
          <label class="qmes-wide">발생 내용<input data-field="item" value="${String(record.item||"").replace(/"/g,"&quot;")}"></label>
          <label class="qmes-wide">임시조치<textarea data-field="temporaryAction">${String(record.temporaryAction||"").replace(/</g,"&lt;")}</textarea></label>
          <label class="qmes-wide">원인 및 시정조치<textarea data-field="rootCause">${String(record.rootCause||record.correctiveAction||"").replace(/</g,"&lt;")}</textarea></label>
        </div>
        <div class="qmes-ncr-edit-foot">
          <button type="button" class="qmes-cancel" data-action="close">취소</button>
          <button type="button" class="qmes-save" data-action="save">수정내용 저장</button>
          <button type="button" class="qmes-complete" data-action="complete">저장 후 조치 완료</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const applyFields=()=>{
      overlay.querySelectorAll("[data-field]").forEach(input=>{record[input.dataset.field]=input.value.trim();});
      record.correctiveAction=record.rootCause||record.correctiveAction||"";
      try{typeof dbSave==="function"&&dbSave();}catch(_){}
    };

    overlay.addEventListener("click",event=>{
      if(event.target===overlay){closeNcrEditor();return;}
      const action=event.target.closest("button[data-action]")?.dataset.action;
      if(action==="close") closeNcrEditor();
      if(action==="save"){
        applyFields();
        closeNcrEditor();
        try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{type:"ncr-edit"}}));}catch(_){}
      }
      if(action==="complete"){
        applyFields();
        allowOriginalAction=true;
        closeNcrEditor();
        button.click();
        allowOriginalAction=false;
      }
    });
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("button");
    if(!button||clean(button.textContent)!=="조치 완료"||allowOriginalAction) return;
    const table=button.closest("table.qmes-ncr-refined-table");
    if(!table) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openNcrEditor(button);
  },true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeNcrEditor();});

  let scheduled=false;
  const apply=()=>{scheduled=false;markLotLayout();markNcrTable();};
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(apply);};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("qmes:data-updated",schedule);
  document.addEventListener("click",schedule,true);
  window.addEventListener("resize",schedule);
  schedule();
})();
