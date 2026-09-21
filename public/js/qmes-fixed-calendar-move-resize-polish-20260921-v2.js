/* QMES FIXED CALENDAR MOVE/RESIZE POLISH V2 - CURRENT UI ONLY - 2026-09-21
 * Works with qmes-fixed-calendar-reference-20260921-v3.js.
 * - Drag from calendar border OR empty header area.
 * - Existing four corner resize remains active.
 * - Calendar does not close when border drag starts.
 * - Re-applies saved position after month/year re-render.
 * - Removes thick focus/active outlines.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_MOVE_RESIZE_POLISH_20260921_V2__) return;
  window.__QMES_FIXED_CALENDAR_MOVE_RESIZE_POLISH_20260921_V2__=true;

  const POP_ID="qmes-fixed-calendar-reference-20260921-v3-pop";
  const STYLE_ID="qmes-fixed-calendar-move-resize-polish-20260921-v2-style";
  const POS_KEY="qmes-fixed-calendar-reference-v3-position";
  const EDGE_CLASS="qf-move-edge";
  let drag=null;
  let suppressClickUntil=0;
  let applying=false;

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

      #${POP_ID}.qmes-calendar-moving{
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
      #${POP_ID} .qf-head select,
      #${POP_ID} .qf-day,
      #${POP_ID} .qf-today{
        cursor:pointer!important;
      }

      #${POP_ID} .qf-resize-handle{
        pointer-events:auto!important;
        outline:none!important;
      }

      #${POP_ID} .qf-resize-handle::before,
      #${POP_ID} .qf-resize-handle::after{
        opacity:.30!important;
        background:#8fb4ca!important;
      }

      #${POP_ID} .${EDGE_CLASS}{
        position:absolute!important;
        z-index:2147483645!important;
        display:block!important;
        background:transparent!important;
        border:0!important;
        padding:0!important;
        margin:0!important;
        pointer-events:auto!important;
        touch-action:none!important;
        user-select:none!important;
        cursor:move!important;
      }
      #${POP_ID} .${EDGE_CLASS}[data-edge="top"]{
        left:18px!important;right:18px!important;top:-6px!important;height:12px!important;
      }
      #${POP_ID} .${EDGE_CLASS}[data-edge="bottom"]{
        left:18px!important;right:18px!important;bottom:-6px!important;height:12px!important;
      }
      #${POP_ID} .${EDGE_CLASS}[data-edge="left"]{
        left:-6px!important;top:18px!important;bottom:18px!important;width:12px!important;
      }
      #${POP_ID} .${EDGE_CLASS}[data-edge="right"]{
        right:-6px!important;top:18px!important;bottom:18px!important;width:12px!important;
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
    const r=pop.getBoundingClientRect();
    const w=r.width||282;
    const h=r.height||248;
    return {
      left:clamp(left,8,Math.max(8,window.innerWidth-w-8)),
      top:clamp(top,8,Math.max(8,window.innerHeight-h-8))
    };
  }

  function applySaved(pop){
    if(!pop||drag||applying) return;
    const saved=readSaved();
    if(!saved) return;
    const p=fit(pop,saved.left,saved.top);
    applying=true;
    pop.style.setProperty("left",Math.round(p.left)+"px","important");
    pop.style.setProperty("top",Math.round(p.top)+"px","important");
    requestAnimationFrame(()=>{applying=false;});
  }

  function stop(event){
    if(!drag) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    const state=drag;
    drag=null;
    suppressClickUntil=Date.now()+450;

    document.body.classList.remove("qmes-fixed-calendar-moving");
    state.pop.classList.remove("qmes-calendar-moving");
    try{state.capture.releasePointerCapture?.(state.pointerId);}catch(_){}

    window.removeEventListener("pointermove",move,true);
    window.removeEventListener("pointerup",stop,true);
    window.removeEventListener("pointercancel",stop,true);
    window.removeEventListener("blur",stop,true);

    save(state.pop);
  }

  function move(event){
    if(!drag) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const p=fit(
      drag.pop,
      drag.startLeft+(event.clientX-drag.startX),
      drag.startTop+(event.clientY-drag.startY)
    );
    drag.pop.style.setProperty("left",Math.round(p.left)+"px","important");
    drag.pop.style.setProperty("top",Math.round(p.top)+"px","important");
  }

  function start(event,capture,pop){
    if(event.pointerType!=="touch" && event.button!==0) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const r=pop.getBoundingClientRect();
    drag={
      pop,
      capture,
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      startLeft:r.left,
      startTop:r.top
    };

    document.body.classList.add("qmes-fixed-calendar-moving");
    pop.classList.add("qmes-calendar-moving");
    try{capture.setPointerCapture?.(event.pointerId);}catch(_){}

    window.addEventListener("pointermove",move,true);
    window.addEventListener("pointerup",stop,true);
    window.addEventListener("pointercancel",stop,true);
    window.addEventListener("blur",stop,true);
  }

  function installEdges(pop){
    ["top","right","bottom","left"].forEach(edge=>{
      let el=pop.querySelector("."+EDGE_CLASS+'[data-edge="'+edge+'"]');
      if(el) return;
      el=document.createElement("span");
      el.className=EDGE_CLASS;
      el.dataset.edge=edge;
      el.setAttribute("aria-hidden","true");
      pop.appendChild(el);
    });
  }

  function patch(pop){
    if(!(pop instanceof Element)||pop.id!==POP_ID) return;
    addStyle();
    installEdges(pop);

    // Existing V3 corner resize handles keep priority over move edges.
    pop.querySelectorAll(".qf-resize-handle").forEach(handle=>{
      handle.style.pointerEvents="auto";
      handle.tabIndex=-1;
    });

    requestAnimationFrame(()=>applySaved(pop));
  }

  document.addEventListener("pointerdown",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;

    const pop=target.closest("#"+POP_ID);
    if(!pop) return;

    // Corner resize remains owned by V3.
    if(target.closest(".qf-resize-handle")) return;

    const edge=target.closest("."+EDGE_CLASS);
    if(edge){
      start(event,edge,pop);
      return;
    }

    const head=target.closest(".qf-head");
    if(head && !target.closest("button,select")){
      start(event,head,pop);
    }
  },true);

  document.addEventListener("click",event=>{
    if(Date.now()>=suppressClickUntil) return;
    const target=event.target instanceof Element?event.target:null;
    if(target?.closest("#"+POP_ID)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  },true);

  addStyle();

  const observer=new MutationObserver(records=>{
    let found=false;
    for(const record of records){
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1) continue;
        if(node.id===POP_ID||node.querySelector?.("#"+POP_ID)){found=true;break;}
      }
      if(found) break;

      // V3 re-renders inside the same popup on month/year change.
      if(record.target instanceof Element && record.target.closest?.("#"+POP_ID)){
        found=true;break;
      }
    }

    const pop=document.getElementById(POP_ID);
    if(pop && (found || !pop.querySelector("."+EDGE_CLASS))) patch(pop);
  });

  observer.observe(document.documentElement,{childList:true,subtree:true});

  const initial=document.getElementById(POP_ID);
  if(initial) patch(initial);

  window.addEventListener("resize",()=>{
    const pop=document.getElementById(POP_ID);
    if(!pop||drag) return;
    const r=pop.getBoundingClientRect();
    const p=fit(pop,r.left,r.top);
    pop.style.setProperty("left",Math.round(p.left)+"px","important");
    pop.style.setProperty("top",Math.round(p.top)+"px","important");
    save(pop);
  });
})();