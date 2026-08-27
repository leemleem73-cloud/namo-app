/* NAMO QMES - Worker picker readability / neutral borders - 2026-08-27
 * Patch-only module. Does not replace the production process component.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKER_PICKER_READABLE_20260827__) return;
  window.__QMES_WORKER_PICKER_READABLE_20260827__=true;

  const clean=value=>String(value==null?"":value).trim();

  function dialogTitle(dialog){
    return clean(dialog?.querySelector(".qpp-dialog-head b")?.textContent);
  }

  function forceStyle(node,styles){
    if(!node) return;
    Object.entries(styles).forEach(([name,value])=>node.style.setProperty(name,value,"important"));
  }

  function removeOuterBorder(dialog){
    forceStyle(dialog,{
      "border-style":"none",
      "border-width":"0",
      "border-color":"transparent",
      "outline":"none",
      "box-shadow":"0 28px 90px rgba(0,0,0,.42)"
    });
  }

  function decorateWorkerSelect(dialog){
    removeOuterBorder(dialog);
    const cards=Array.from(dialog.querySelectorAll(".qpp-worker-item"));
    cards.forEach(card=>{
      const checked=!!card.querySelector('input[type="checkbox"]:checked');
      forceStyle(card,{
        "background":checked?"#173b59":"#142c47",
        "border-color":"#2d4c67",
        "box-shadow":"none",
        "outline":"none",
        "opacity":"1"
      });
      const span=card.querySelector("span");
      forceStyle(span,{"display":"block","color":"#f8fafc","-webkit-text-fill-color":"#f8fafc","opacity":"1","visibility":"visible"});
      const name=card.querySelector("b");
      forceStyle(name,{
        "display":"block",
        "color":"#ffffff",
        "-webkit-text-fill-color":"#ffffff",
        "font-size":"14px",
        "font-weight":"900",
        "line-height":"1.4",
        "opacity":"1",
        "visibility":"visible",
        "filter":"none",
        "text-shadow":"none"
      });
      const dept=card.querySelector("small");
      forceStyle(dept,{
        "display":"block",
        "margin-top":"4px",
        "color":"#9fb6ca",
        "-webkit-text-fill-color":"#9fb6ca",
        "font-size":"11px",
        "font-weight":"700",
        "opacity":"1",
        "visibility":"visible"
      });
      const checkbox=card.querySelector('input[type="checkbox"]');
      forceStyle(checkbox,{"accent-color":"#0ea5e9","opacity":"1","visibility":"visible"});
    });
  }

  function decorateWorkerRegister(dialog){
    /* Remove the colored outer border from the add-worker dialog too. */
    removeOuterBorder(dialog);
    const head=dialog.querySelector(".qpp-dialog-head");
    const foot=dialog.querySelector(".qpp-dialog-foot");
    forceStyle(head,{"border-bottom-color":"#28445e"});
    forceStyle(foot,{"border-top-color":"#28445e"});

    dialog.querySelectorAll(".qpp-form input").forEach(input=>{
      forceStyle(input,{
        "border-color":"#35516b",
        "box-shadow":"none",
        "outline":"none"
      });
      if(input.dataset.qmesNeutralFocus!=="1"){
        input.dataset.qmesNeutralFocus="1";
        input.addEventListener("focus",()=>forceStyle(input,{"border-color":"#35516b","box-shadow":"none","outline":"none"}));
        input.addEventListener("blur",()=>forceStyle(input,{"border-color":"#35516b","box-shadow":"none","outline":"none"}));
      }
    });
  }

  function decorate(){
    const dialogs=Array.from(document.querySelectorAll(".qpp-dialog"));
    dialogs.forEach(dialog=>{
      const title=dialogTitle(dialog);
      if(title==="작업자 선택") decorateWorkerSelect(dialog);
      if(title==="추가 작업자 등록") decorateWorkerRegister(dialog);
    });
  }

  function decorateSoon(){[0,40,100,220,450].forEach(delay=>setTimeout(decorate,delay));}

  document.addEventListener("click",event=>{
    const button=event.target?.closest?.("button");
    const text=clean(button?.textContent);
    if(["작업자 선택","추가 작업자 등록","전체해제","선택 적용","작업자 등록","닫기"].includes(text)) decorateSoon();
  },true);

  document.addEventListener("change",event=>{
    if(event.target?.closest?.(".qpp-worker-item,.qpp-form")) decorateSoon();
  },true);

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(mutation=>Array.from(mutation.addedNodes||[]).some(node=>
      node?.nodeType===1 && (node.matches?.(".qpp-modal,.qpp-dialog,.qpp-worker-item,.qpp-form") || node.querySelector?.(".qpp-dialog,.qpp-worker-item,.qpp-form"))
    ))) decorateSoon();
  });

  function start(){
    observer.observe(document.body,{childList:true,subtree:true});
    decorateSoon();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();
