/* QMES fixed calendar footer drag - 2026-09-21
 * ADD-ONLY patch for the current V3 fixed calendar.
 * Drag the "오늘" footer area to move the calendar.
 * A normal click on "오늘" still selects today.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_FOOTER_DRAG_20260921_V1__) return;
  window.__QMES_FIXED_CALENDAR_FOOTER_DRAG_20260921_V1__=true;

  const POP_ID="qmes-fixed-calendar-reference-20260921-v3-pop";
  const STYLE_ID="qmes-fixed-calendar-footer-drag-20260921-v1-style";
  const DRAG_THRESHOLD=4;

  let state=null;
  let suppressClickUntil=0;
  let activePopup=null;
  let draggedPosition=null;
  let restoring=false;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${POP_ID} .qf-foot,
      #${POP_ID} .qf-today{
        cursor:move!important;
      }
      #${POP_ID} .qf-today{
        touch-action:none!important;
      }
      body.qmes-fixed-calendar-moving,
      body.qmes-fixed-calendar-moving *{
        user-select:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function popup(){
    return document.getElementById(POP_ID);
  }

  function syncPopupIdentity(){
    const pop=popup();
    if(pop!==activePopup){
      activePopup=pop;
      draggedPosition=null;
    }
    return pop;
  }

  function clampPosition(pop,left,top){
    const r=pop.getBoundingClientRect();
    const width=r.width||282;
    const height=r.height||248;
    return {
      left:clamp(left,8,Math.max(8,window.innerWidth-width-8)),
      top:clamp(top,8,Math.max(8,window.innerHeight-height-8))
    };
  }

  function applyDraggedPosition(){
    if(restoring) return;
    const pop=syncPopupIdentity();
    if(!pop||!draggedPosition||state) return;

    restoring=true;
    try{
      const next=clampPosition(pop,draggedPosition.left,draggedPosition.top);
      draggedPosition=next;
      pop.style.setProperty("left",Math.round(next.left)+"px","important");
      pop.style.setProperty("top",Math.round(next.top)+"px","important");
    }finally{
      restoring=false;
    }
  }

  function move(event){
    if(!state) return;

    const dx=event.clientX-state.startX;
    const dy=event.clientY-state.startY;

    if(!state.moved){
      if(Math.hypot(dx,dy)<DRAG_THRESHOLD) return;
      state.moved=true;
      document.body.classList.add("qmes-fixed-calendar-moving");
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const next=clampPosition(
      state.pop,
      state.startLeft+dx,
      state.startTop+dy
    );

    draggedPosition=next;
    state.pop.style.setProperty("left",Math.round(next.left)+"px","important");
    state.pop.style.setProperty("top",Math.round(next.top)+"px","important");
  }

  function stop(event){
    if(!state) return;

    const finished=state;
    state=null;

    try{finished.target.releasePointerCapture?.(finished.pointerId);}catch(_){}

    window.removeEventListener("pointermove",move,true);
    window.removeEventListener("pointerup",stop,true);
    window.removeEventListener("pointercancel",stop,true);
    window.removeEventListener("blur",stop,true);

    document.body.classList.remove("qmes-fixed-calendar-moving");

    if(finished.moved){
      suppressClickUntil=Date.now()+550;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      requestAnimationFrame(applyDraggedPosition);
    }
  }

  window.addEventListener("pointerdown",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;

    const footer=target.closest("#"+POP_ID+" .qf-foot");
    if(!footer) return;
    if(target.closest(".qf-resize-handle")) return;
    if(event.pointerType!=="touch"&&event.button!==0) return;

    const pop=footer.closest("#"+POP_ID);
    if(!pop) return;

    syncPopupIdentity();

    const rect=pop.getBoundingClientRect();
    const left=parseFloat(pop.style.left);
    const top=parseFloat(pop.style.top);

    state={
      pop,
      target,
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      startLeft:Number.isFinite(left)?left:rect.left,
      startTop:Number.isFinite(top)?top:rect.top,
      moved:false
    };

    try{target.setPointerCapture?.(event.pointerId);}catch(_){}

    window.addEventListener("pointermove",move,true);
    window.addEventListener("pointerup",stop,true);
    window.addEventListener("pointercancel",stop,true);
    window.addEventListener("blur",stop,true);
  },true);

  // After an actual drag, block the synthetic click BEFORE the calendar owner's
  // document click handler can interpret it as "오늘".
  window.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    if(Date.now()<suppressClickUntil && target.closest("#"+POP_ID)){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  },true);

  function boot(){
    ensureStyle();
    syncPopupIdentity();

    const observer=new MutationObserver(records=>{
      let relevant=false;
      for(const record of records){
        for(const node of record.addedNodes||[]){
          if(!(node instanceof Element)) continue;
          if(node.id===POP_ID||node.querySelector?.("#"+POP_ID)){
            relevant=true;
            break;
          }
        }
        const target=record.target instanceof Element?record.target:null;
        if(target&&(target.id===POP_ID||target.closest?.("#"+POP_ID))){
          relevant=true;
        }
        if(relevant) break;
      }

      if(relevant){
        requestAnimationFrame(()=>{
          const pop=syncPopupIdentity();
          if(pop&&draggedPosition) applyDraggedPosition();
        });
      }else if(activePopup&&!activePopup.isConnected){
        activePopup=null;
        draggedPosition=null;
      }
    });

    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("resize",()=>requestAnimationFrame(applyDraggedPosition),{passive:true});
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();