(function(){
  "use strict";
  if(window.__QMES_PARTNER_EQUIPMENT_ACTION_FIX__) return;
  window.__QMES_PARTNER_EQUIPMENT_ACTION_FIX__=true;

  const style=document.createElement("style");
  style.id="qmes-partner-equipment-action-fix-style";
  style.textContent=`
    .qmes-partner-new-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:7px 12px;border:1px solid rgba(56,189,248,.55);border-radius:8px;background:rgba(14,165,233,.12);color:#7dd3fc;font-size:12px;font-weight:800;cursor:pointer}
    .qmes-partner-new-btn:hover{background:rgba(14,165,233,.2);color:#fff}
    .qmes-repair-action-wide{grid-column:1 / -1!important;width:100%!important;max-width:none!important}
    .qmes-repair-action-wide textarea{width:100%!important;min-height:110px!important;box-sizing:border-box!important}
  `;
  document.head.appendChild(style);

  function fixPartnerButtons(){
    document.querySelectorAll("button.qmes-iqc-new-btn").forEach(button=>{
      const text=String(button.textContent||"").replace(/\s+/g," ").trim();
      if(!/고객사 등록|공급업체 등록/.test(text)) return;
      button.classList.remove("qmes-iqc-new-btn");
      button.classList.add("qmes-partner-new-btn");
    });
  }

  function widenRepairAction(){
    document.querySelectorAll("label").forEach(label=>{
      const text=String(label.textContent||"").replace(/\s+/g," ").trim();
      if(!text.startsWith("조치 내용")) return;
      const dialog=label.closest('[role="dialog"]');
      if(!dialog||!String(dialog.textContent||"").includes("고장·수리 이력 신규등록")) return;
      label.classList.add("qmes-repair-action-wide");
    });
  }

  let queued=false;
  function apply(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      fixPartnerButtons();
      widenRepairAction();
    });
  }

  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",apply);
  document.addEventListener("click",apply,true);
  apply();
})();
