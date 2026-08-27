/* NAMO QMES - Worker picker readability FORCE - 2026-08-27
 * Patch-only module. Does not replace the production process component.
 * Makes the worker-selection modal readable and forces worker names visible,
 * including WebKit text-fill overrides from global theme layers.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKER_PICKER_READABLE_20260827__) return;
  window.__QMES_WORKER_PICKER_READABLE_20260827__=true;

  const clean=value=>String(value==null?"":value).trim();

  function isWorkerDialog(dialog){
    return !!dialog && clean(dialog.querySelector(".qpp-dialog-head b")?.textContent)==="작업자 선택";
  }

  function forceStyle(node,styles){
    if(!node) return;
    Object.entries(styles).forEach(([name,value])=>node.style.setProperty(name,value,"important"));
  }

  function decorate(){
    const dialog=Array.from(document.querySelectorAll(".qpp-dialog")).find(isWorkerDialog);
    if(!dialog) return false;

    const modal=dialog.closest(".qpp-modal");
    forceStyle(modal,{"background":"rgba(15,23,42,.38)"});
    forceStyle(dialog,{
      "background":"#ffffff",
      "border-color":"#cbd5e1",
      "box-shadow":"0 24px 70px rgba(15,23,42,.26)",
      "color":"#0f172a"
    });

    const head=dialog.querySelector(".qpp-dialog-head");
    forceStyle(head,{"background":"#f8fafc","border-bottom-color":"#dbe4ee","color":"#0f172a"});
    const title=head?.querySelector("b");
    forceStyle(title,{"color":"#0f172a","-webkit-text-fill-color":"#0f172a","opacity":"1","visibility":"visible"});
    const subtitle=head?.querySelector("div div");
    if(subtitle) forceStyle(subtitle,{"color":"#64748b","-webkit-text-fill-color":"#64748b"});

    const body=dialog.querySelector(".qpp-dialog-body");
    forceStyle(body,{"background":"#ffffff"});
    const foot=dialog.querySelector(".qpp-dialog-foot");
    forceStyle(foot,{"background":"#f8fafc","border-top-color":"#dbe4ee"});

    const cards=Array.from(dialog.querySelectorAll(".qpp-worker-item"));
    cards.forEach(card=>{
      const checked=!!card.querySelector('input[type="checkbox"]:checked');
      forceStyle(card,{
        "background":checked?"#eff6ff":"#ffffff",
        "border-color":"#cbd5e1",
        "box-shadow":"none",
        "outline":"none",
        "color":"#0f172a",
        "opacity":"1"
      });
      const span=card.querySelector("span");
      forceStyle(span,{"display":"block","color":"#0f172a","-webkit-text-fill-color":"#0f172a","opacity":"1","visibility":"visible"});
      const name=card.querySelector("b");
      forceStyle(name,{
        "display":"block",
        "color":"#0f172a",
        "-webkit-text-fill-color":"#0f172a",
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
        "color":"#475569",
        "-webkit-text-fill-color":"#475569",
        "font-size":"11px",
        "font-weight":"700",
        "opacity":"1",
        "visibility":"visible"
      });
      const checkbox=card.querySelector('input[type="checkbox"]');
      forceStyle(checkbox,{"accent-color":"#2563eb","opacity":"1","visibility":"visible"});
    });

    dialog.querySelectorAll("button").forEach(button=>{
      const label=clean(button.textContent);
      if(label==="선택 적용"){
        forceStyle(button,{"background":"#2563eb","border-color":"#2563eb","color":"#ffffff","-webkit-text-fill-color":"#ffffff"});
      }else{
        forceStyle(button,{"background":"#ffffff","border-color":"#cbd5e1","color":"#334155","-webkit-text-fill-color":"#334155"});
      }
    });
    return true;
  }

  function decorateSoon(){
    [0,40,100,220,450].forEach(delay=>setTimeout(decorate,delay));
  }

  document.addEventListener("click",event=>{
    const button=event.target?.closest?.("button");
    const text=clean(button?.textContent);
    if(text==="작업자 선택"||text==="전체해제"||text==="선택 적용"||text==="닫기") decorateSoon();
  },true);

  document.addEventListener("change",event=>{
    if(event.target?.closest?.(".qpp-worker-item")) decorateSoon();
  },true);

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(mutation=>Array.from(mutation.addedNodes||[]).some(node=>
      node?.nodeType===1 && (node.matches?.(".qpp-modal,.qpp-dialog,.qpp-worker-item") || node.querySelector?.(".qpp-dialog,.qpp-worker-item"))
    ))) decorateSoon();
  });

  function start(){
    observer.observe(document.body,{childList:true,subtree:true});
    decorateSoon();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();
