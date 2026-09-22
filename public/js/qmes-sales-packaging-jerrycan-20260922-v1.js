/* QMES Sales new-order packaging option - 2026-09-22
 * ADD-ONLY.
 * Adds only "20L 제리캔" to the existing packagingUnit dropdown.
 * No other new-order fields or workflows are changed.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_PACKAGING_JERRYCAN_20260922_V1__) return;
  window.__QMES_SALES_PACKAGING_JERRYCAN_20260922_V1__=true;

  const VALUE="20L 제리캔";

  function apply(root=document){
    const selects=[];
    if(root instanceof Element && root.matches('select[name="packagingUnit"]')) selects.push(root);
    root.querySelectorAll?.('select[name="packagingUnit"]').forEach(s=>selects.push(s));

    selects.forEach(select=>{
      if([...select.options].some(opt=>String(opt.value||opt.textContent).trim()===VALUE)) return;
      const option=document.createElement("option");
      option.value=VALUE;
      option.textContent=VALUE;

      const first=select.options[0]||null;
      if(first && (String(first.value||"").trim()==="" || String(first.textContent||"").trim()==="선택")){
        first.insertAdjacentElement("afterend",option);
      }else{
        select.insertBefore(option,select.firstChild);
      }
    });
  }

  function boot(){
    apply();
    const observer=new MutationObserver(records=>{
      for(const record of records){
        record.addedNodes.forEach(node=>{
          if(node instanceof Element) apply(node);
        });
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    ["qmes:erp-integrated-ready","qmes:navigate-tab","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(apply,0)));
    [100,350,800,1500].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();