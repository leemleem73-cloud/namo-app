(function(){
  "use strict";
  if(window.__QMES_NCR_SEPARATE_ACTION_BUTTONS__) return;
  window.__QMES_NCR_SEPARATE_ACTION_BUTTONS__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();

  const style=document.createElement("style");
  style.id="qmes-ncr-separate-action-buttons-style";
  style.textContent=`
    .qmes-ncr-action-cell{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
      white-space:nowrap!important;
    }
    .qmes-ncr-native-complete{display:none!important;}
    .qmes-ncr-edit-button,
    .qmes-ncr-complete-button{
      display:inline-flex!important;
      width:auto!important;
      min-width:0!important;
      height:34px!important;
      align-items:center!important;
      justify-content:center!important;
      margin:0!important;
      padding:0 10px!important;
      border-radius:8px!important;
      font-size:12px!important;
      font-weight:900!important;
      line-height:1!important;
      white-space:nowrap!important;
      cursor:pointer!important;
    }
    .qmes-ncr-edit-button{
      border:1px solid rgba(14,165,233,.55)!important;
      background:rgba(14,165,233,.08)!important;
      color:#7dd3fc!important;
    }
    .qmes-ncr-complete-button{
      border:1px solid rgba(16,185,129,.55)!important;
      background:rgba(16,185,129,.08)!important;
      color:#6ee7b7!important;
    }
  `;
  document.head.appendChild(style);

  function configureEditor(editOnly){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const modal=document.getElementById("qmes-ncr-edit-modal");
      if(!modal) return;
      const title=modal.querySelector(".qmes-ncr-edit-title");
      const description=title?.parentElement?.querySelector("div:nth-child(2)");
      const complete=modal.querySelector(".qmes-complete");
      if(editOnly){
        if(title) title.textContent=title.textContent.replace("조치 확인 및 수정","내용 수정");
        if(description) description.textContent="수정할 내용을 확인한 뒤 저장하세요.";
        if(complete) complete.style.setProperty("display","none","important");
      }else{
        if(description) description.textContent="내용을 최종 확인한 뒤 조치 완료하세요.";
        if(complete) complete.style.removeProperty("display");
      }
    }));
  }

  function decorate(){
    document.querySelectorAll("table.qmes-ncr-refined-table tbody tr").forEach(row=>{
      const nativeButton=Array.from(row.querySelectorAll("button")).find(button=>clean(button.textContent)==="조치 완료"&&!button.classList.contains("qmes-ncr-complete-button"));
      if(!nativeButton) return;
      const cell=nativeButton.closest("td");
      if(!cell||cell.dataset.qmesNcrActionsReady==="true") return;
      cell.dataset.qmesNcrActionsReady="true";
      cell.classList.add("qmes-ncr-action-cell");
      nativeButton.classList.add("qmes-ncr-native-complete");

      const editButton=document.createElement("button");
      editButton.type="button";
      editButton.className="qmes-ncr-edit-button";
      editButton.textContent="수정";
      editButton.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        nativeButton.click();
        configureEditor(true);
      });

      const completeButton=document.createElement("button");
      completeButton.type="button";
      completeButton.className="qmes-ncr-complete-button";
      completeButton.textContent="조치 완료";
      completeButton.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        nativeButton.click();
        configureEditor(false);
      });

      cell.insertBefore(editButton,nativeButton);
      cell.insertBefore(completeButton,nativeButton);
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorate();});
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("qmes:data-updated",schedule);
  document.addEventListener("click",schedule,true);
  schedule();
})();
