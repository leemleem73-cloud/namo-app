/* QMES FIXED CALENDAR MOVE/RESIZE POLISH - CURRENT UI ONLY - 2026-09-21
 * ADD-ONLY patch for qmes-fixed-calendar-reference-20260921-v3.js
 * - Header drag/move
 * - Keeps existing corner resize working
 * - Removes thick focus/active outlines
 * - Keeps popup inside viewport
 * - Persists moved position for the current browser
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_MOVE_RESIZE_POLISH_20260921_V1__) return;
  window.__QMES_FIXED_CALENDAR_MOVE_RESIZE_POLISH_20260921_V1__=true;

  const POP_ID="qmes-fixed-calendar-reference-20260921-v3-pop";
  const STYLE_ID="qmes-fixed-calendar-move-resize-polish-20260921-v1-style";
  const POS_KEY="qmes-fixed-calendar-reference-v3-position";
  let drag=null;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${POP_ID},
      #${POP_ID}:focus,
      #${POP_ID}:focus-visible,
      #${POP_ID}:active,
      #${POP_ID} *,
      #${POP_ID} *:focus,
      #${POP_ID} *:focus-visible,
      #${POP_ID} *:active{
        outline:none!important;
      }

      #${POP_ID}{
        border:1px solid #dfe5ea!important;
        box-shadow:0 8px 24px rgba(25,45,65,.14)!important;
        pointer-events:auto!important;
      }

      #${POP_ID}.qmes-calendar-moving,
      #${POP_ID}.qmes-calendar-resizing{
        border:1px solid #dfe5ea!important;
        outline:none!important;
        box-shadow:0 8px 24px rgba(25,45,65,.14)!important;
      }

      #${POP_ID} .qf-head{
        cursor:move!important;
        touch-action:none!important;
        user-select:none!important;
      }

      #${POP_ID} .qf-head button,
      #${POP_ID} .qf-head select{
        cursor:pointer!important;
      }

      #${POP_ID} .qf-resize-handle{
        pointer-events:auto!important;
        outline:none!important;
      }

      /* Keep resize hit-area, but remove the heavy visible corner marks. */
      #${POP_ID} .qf-resize-handle::before,
      #${POP_ID} .qf-resize-handle::after{
        opacity:.28!important;
        background:#8fb4ca!important;
      }

      body.qmes-fixed-calendar-moving,
      body.qmes-fixed-calendar-moving *{
        user-select:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function readSaved(){
    try{
      const v=JSON.parse(localStorage.getItem(POS_KEY)||"null");
      if(!v||!Number.isFinite(v.left)||!Number.isFinite(v.top)) return null;
      return v;
    }catch(_){return null;}
  }

  function save(pop){
    if(!pop) return;
    const r=pop.getBoundingClientRect();
    try{localStorage.setItem(POS_KEY,JSON.stringify({left:r.left,top:r.top}));}catch(_){}
  }

  function fit(pop,left,top){
    if(!pop) return {left,top};
    const r=pop.getBoundingClientRect();
    const w=r.width||282;
    const h=r.height||248;
    return {
      left:clamp(left,8,Math.max(8,window.innerWidth-w-8)),
      top:clamp(top,8,Math.max(8,window.innerHeight-h-8))
    };
  }

  function restorePosition(pop){
    if(!pop||pop.dataset.qmesMovePositionApplied==="1") return;
    const saved=readSaved();
    if(!saved) return;
    const p=fit(pop,saved.left,saved.top);
    pop.style.setProperty("left",Math.round(p.left)+"px","important");
    pop.style.setProperty("top",Math.round(p.top)+"px","important");
    pop.dataset.qmesMovePositionApplied="1";
  }

  function stop(event){
    if(!drag) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const s=drag;
    drag=null;
    document.body.classList.remove("qmes-fixed-calendar-moving");
    s.pop.classList.remove("qmes-calendar-moving");
    try{s.head.releasePointerCapture?.(s.pointerId);}catch(_){}
    window.removeEventListener("pointermove",move,true);
    window.removeEventListener("pointerup",stop,true);
    window.removeEventListener("pointercancel",stop,true);
    window.removeEventListener("blur",stop,true);
    save(s.pop);
  }

  function move(event){
    if(!drag) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const dx=event.clientX-drag.startX;
    const dy=event.clientY-drag.startY;
    const p=fit(drag.pop,drag.left+dx,drag.top+dy);
    drag.pop.style.setProperty("left",Math.round(p.left)+"px","important");
    drag.pop.style.setProperty("top",Math.round(p.top)+"px","important");
  }

  function start(event,head,pop){
    if(event.pointerType!=="touch" && event.button!==0) return;
    const target=event.target instanceof Element?event.target:null;

    // Navigation and year/month selectors keep their normal click behavior.
    if(target?.closest("button,select,.qf-resize-handle")) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const r=pop.getBoundingClientRect();
    drag={
      pop,
      head,
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      left:r.left,
      top:r.top
    };

    document.body.classList.add("qmes-fixed-calendar-moving");
    pop.classList.add("qmes-calendar-moving");
    try{head.setPointerCapture?.(event.pointerId);}catch(_){}

    window.addEventListener("pointermove",move,true);
    window.addEventListener("pointerup",stop,true);
    window.addEventListener("pointercancel",stop,true);
    window.addEventListener("blur",stop,true);
  }

  function patch(pop){
    if(!(pop instanceof Element)||pop.id!==POP_ID) return;
    addStyle();

    const head=pop.querySelector(".qf-head");
    if(head && head.dataset.qmesMoveBound!=="1"){
      head.dataset.qmesMoveBound="1";
      head.addEventListener("pointerdown",event=>start(event,head,pop),true);
    }

    // Existing V3 resize code adds the handles. Ensure they stay clickable.
    pop.querySelectorAll(".qf-resize-handle").forEach(h=>{
      h.style.pointerEvents="auto";
      h.tabIndex=-1;
    });

    restorePosition(pop);
  }

  function scan(){
    const pop=document.getElementById(POP_ID);
    if(pop) patch(pop);
  }

  addStyle();
  scan();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1) continue;
        if(node.id===POP_ID) patch(node);
        node.querySelector?.("#"+POP_ID) && patch(node.querySelector("#"+POP_ID));
      }
    }
    scan();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener("resize",()=>{
    const pop=document.getElementById(POP_ID);
    if(!pop||drag) return;
    const r=pop.getBoundingClientRect();
    const p=fit(pop,r.left,r.top);
    pop.style.setProperty("left",Math.round(p.left)+"px","important");
    pop.style.setProperty("top",Math.round(p.top)+"px","important");
  });
})();