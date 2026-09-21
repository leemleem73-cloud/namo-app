/* QMES current sidebar SPC cleanup V4 - 2026-09-21
 * CURRENT UI ONLY.
 * Removes only WORKSPACE > "SPC 대시보드".
 * Keeps MES · QMS > "SPC (Cpk)".
 * Contains NO calendar logic.
 */
(function(){
  "use strict";
  if(window.__QMES_SPC_WORKSPACE_REMOVE_20260921_V4__) return;
  window.__QMES_SPC_WORKSPACE_REMOVE_20260921_V4__=true;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

  function removeWorkspaceSpc(){
    const sidebar=document.getElementById("qmes-erp-sidebar");
    if(!sidebar) return;

    const sections=[...sidebar.querySelectorAll(".qmes-erp-section")];
    const workspace=sections.find(el=>clean(el.textContent)==="WORKSPACE");
    if(workspace){
      let node=workspace.nextElementSibling;
      while(node && !node.classList.contains("qmes-erp-section")){
        const next=node.nextElementSibling;
        if((node.matches("button,.qmes-erp-item") || node.querySelector?.("button,.qmes-erp-item"))
          && clean(node.textContent)==="SPC 대시보드"){
          node.remove();
        }
        node=next;
      }
    }

    sidebar.querySelectorAll("button,.qmes-erp-item").forEach(el=>{
      if(clean(el.textContent)==="SPC 대시보드") el.remove();
    });
  }

  removeWorkspaceSpc();

  const observer=new MutationObserver(()=>removeWorkspaceSpc());
  observer.observe(document.documentElement,{childList:true,subtree:true});

  [100,300,700,1500,3000].forEach(ms=>setTimeout(removeWorkspaceSpc,ms));
})();