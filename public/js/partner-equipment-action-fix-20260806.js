(function(){
  "use strict";
  if(window.__QMES_PARTNER_EQUIPMENT_ACTION_FIX_V2__) return;
  window.__QMES_PARTNER_EQUIPMENT_ACTION_FIX_V2__=true;

  const style=document.createElement("style");
  style.id="qmes-partner-equipment-action-fix-style";
  style.textContent=`
    .qmes-repair-action-wide{grid-column:1 / -1!important;width:100%!important;max-width:none!important;display:block!important}
    .qmes-repair-action-wide textarea{display:block!important;width:100%!important;min-width:100%!important;max-width:none!important;min-height:130px!important;box-sizing:border-box!important;resize:vertical!important}
    [role="dialog"] .qmes-repair-form-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important}
  `;
  document.head.appendChild(style);

  function widenRepairAction(){
    document.querySelectorAll('[role="dialog"]').forEach(dialog=>{
      if(!/고장[·ㆍ]?수리 이력 신규등록/.test(String(dialog.textContent||"")))return;
      const grid=Array.from(dialog.querySelectorAll("div")).find(node=>String(node.className||"").includes("grid")&&node.querySelector("textarea"));
      if(grid)grid.classList.add("qmes-repair-form-grid");
      dialog.querySelectorAll("label").forEach(label=>{
        if(!String(label.textContent||"").replace(/\s+/g," ").trim().startsWith("조치 내용"))return;
        label.classList.remove("md:col-span-2","lg:col-span-2");
        label.classList.add("qmes-repair-action-wide");
      });
    });
  }

  let queued=false;
  const apply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;widenRepairAction();});};
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("load",apply);
  apply();
})();