/* QMES fixed calendar corner resize V2 - 2026-09-21
 * ADD-ONLY current UI patch.
 * Keeps the approved fixed calendar owner unchanged.
 * Fixes corner resize so the popup does not disappear and the first drag works.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_CORNER_RESIZE_20260921_V2__) return;
  window.__QMES_FIXED_CALENDAR_CORNER_RESIZE_20260921_V2__=true;

  const POP_ID="qmes-fixed-calendar-reference-20260921-v2-pop";
  const STYLE_ID="qmes-fixed-calendar-corner-resize-20260921-v2-style";
  const HANDLE_CLASS="qf-corner-resize-v2";
  const SCALE_KEY="qmes-fixed-calendar-scale-v2";
  const MIN_SCALE=.72;
  const MAX_SCALE=1.35;

  let drag=null;
  let installing=false;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function readScale(){
    try{
      const n=Number(localStorage.getItem(SCALE_KEY));
      return Number.isFinite(n)?clamp(n,MIN_SCALE,MAX_SCALE):1;
    }catch(_){return 1;}
  }

  function saveScale(n){
    try{localStorage.setItem(SCALE_KEY,String(clamp(n,MIN_SCALE,MAX_SCALE)));}catch(_){}
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${POP_ID}{
        transform-origin:top left!important;
        will-change:transform,left,top!important;
        overflow:visible!important;
      }

      #${POP_ID} .${HANDLE_CLASS}{
        position:absolute!important;
        width:18px!important;
        height:18px!important;
        z-index:2147483647!important;
        padding:0!important;
        margin:0!important;
        border:0!important;
        background:transparent!important;
        touch-action:none!important;
        user-select:none!important;
      }

      #${POP_ID} .${HANDLE_CLASS}[data-corner="nw"]{
        left:-4px!important;top:-4px!important;cursor:nwse-resize!important;
      }
      #${POP_ID} .${HANDLE_CLASS}[data-corner="ne"]{
        right:-4px!important;top:-4px!important;cursor:nesw-resize!important;
      }
      #${POP_ID} .${HANDLE_CLASS}[data-corner="sw"]{
        left:-4px!important;bottom:-4px!important;cursor:nesw-resize!important;
      }
      #${POP_ID} .${HANDLE_CLASS}[data-corner="se"]{
        right:-4px!important;bottom:-4px!important;cursor:nwse-resize!important;
      }

      #${POP_ID} .${HANDLE_CLASS}::before,
      #${POP_ID} .${HANDLE_CLASS}::after{
        content:""!important;
        position:absolute!important;
        background:#7faac7!important;
        opacity:.9!important;
        pointer-events:none!important;
      }
      #${POP_ID} .${HANDLE_CLASS}::before{width:8px!important;height:2px!important}
      #${POP_ID} .${HANDLE_CLASS}::after{width:2px!important;height:8px!important}

      #${POP_ID} .${HANDLE_CLASS}[data-corner="nw"]::before,
      #${POP_ID} .${HANDLE_CLASS}[data-corner="nw"]::after{left:2px!important;top:2px!important}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="ne"]::before,
      #${POP_ID} .${HANDLE_CLASS}[data-corner="ne"]::after{right:2px!important;top:2px!important}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="sw"]::before,
      #${POP_ID} .${HANDLE_CLASS}[data-corner="sw"]::after{left:2px!important;bottom:2px!important}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="se"]::before,
      #${POP_ID} .${HANDLE_CLASS}[data-corner="se"]::after{right:2px!important;bottom:2px!important}

      body.qmes-calendar-resizing-v2,
      body.qmes-calendar-resizing-v2 *{
        user-select:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function popup(){
    return document.getElementById(POP_ID);
  }

  function currentScale(pop){
    const n=Number(pop?.dataset?.qmesCalendarScaleV2);
    return Number.isFinite(n)?clamp(n,MIN_SCALE,MAX_SCALE):readScale();
  }

  function clampPopup(pop){
    if(!pop||drag) return;
    const r=pop.getBoundingClientRect();
    let left=parseFloat(pop.style.left);
    let top=parseFloat(pop.style.top);
    if(!Number.isFinite(left)) left=r.left;
    if(!Number.isFinite(top)) top=r.top;

    if(r.left<8) left+=8-r.left;
    if(r.top<8) top+=8-r.top;
    if(r.right>window.innerWidth-8) left-=r.right-(window.innerWidth-8);
    if(r.bottom>window.innerHeight-8) top-=r.bottom-(window.innerHeight-8);

    pop.style.setProperty("left",Math.round(left)+"px","important");
    pop.style.setProperty("top",Math.round(top)+"px","important");
  }

  function applyScale(pop,scale){
    if(!pop) return;
    const next=clamp(scale,MIN_SCALE,MAX_SCALE);
    pop.dataset.qmesCalendarScaleV2=String(next);
    pop.style.setProperty("transform","scale("+next+")","important");
  }

  function stopDrag(event){
    if(!drag) return;

    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    const {handle,pop,pointerId}=drag;
    const scale=currentScale(pop);

    try{handle.releasePointerCapture?.(pointerId);}catch(_){}

    drag=null;
    document.body.classList.remove("qmes-calendar-resizing-v2");

    window.removeEventListener("pointermove",onMove,true);
    window.removeEventListener("pointerup",stopDrag,true);
    window.removeEventListener("pointercancel",stopDrag,true);
    window.removeEventListener("blur",stopDrag,true);

    saveScale(scale);
    requestAnimationFrame(()=>clampPopup(pop));
  }

  function onMove(event){
    if(!drag) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const d=drag;
    const dx=event.clientX-d.startX;
    const dy=event.clientY-d.startY;

    const widthDelta=(d.corner==="nw"||d.corner==="sw")?-dx:dx;
    const heightDelta=(d.corner==="nw"||d.corner==="ne")?-dy:dy;

    // Use the stronger gesture axis, preserving the popup proportions.
    const sx=(d.startRect.width+widthDelta)/d.baseW;
    const sy=(d.startRect.height+heightDelta)/d.baseH;
    const deltaX=Math.abs(sx-d.startScale);
    const deltaY=Math.abs(sy-d.startScale);
    const next=clamp(deltaX>=deltaY?sx:sy,MIN_SCALE,MAX_SCALE);

    const w=d.baseW*next;
    const h=d.baseH*next;

    let left=d.anchorLeft;
    let top=d.anchorTop;

    if(d.corner==="nw"||d.corner==="sw") left=d.anchorRight-w;
    if(d.corner==="nw"||d.corner==="ne") top=d.anchorBottom-h;

    left=clamp(left,8,Math.max(8,window.innerWidth-w-8));
    top=clamp(top,8,Math.max(8,window.innerHeight-h-8));

    applyScale(d.pop,next);
    d.pop.style.setProperty("left",Math.round(left)+"px","important");
    d.pop.style.setProperty("top",Math.round(top)+"px","important");
  }

  function startDrag(event,handle,pop){
    if(event.pointerType!=="touch"&&event.button!==0) return;

    // Important: stop only here at the actual corner target.
    // Do NOT stop pointerdown at document capture level; that prevented
    // the handle itself from receiving the first drag.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const startRect=pop.getBoundingClientRect();
    const baseW=Math.max(1,pop.offsetWidth);
    const baseH=Math.max(1,pop.offsetHeight);
    const startScale=currentScale(pop);

    drag={
      handle,
      pop,
      pointerId:event.pointerId,
      corner:handle.dataset.corner||"se",
      startX:event.clientX,
      startY:event.clientY,
      startRect,
      startScale,
      baseW,
      baseH,
      anchorLeft:startRect.left,
      anchorTop:startRect.top,
      anchorRight:startRect.right,
      anchorBottom:startRect.bottom
    };

    document.body.classList.add("qmes-calendar-resizing-v2");

    try{handle.setPointerCapture?.(event.pointerId);}catch(_){}

    window.addEventListener("pointermove",onMove,true);
    window.addEventListener("pointerup",stopDrag,true);
    window.addEventListener("pointercancel",stopDrag,true);
    window.addEventListener("blur",stopDrag,true);
  }

  function makeHandle(corner,pop){
    const h=document.createElement("span");
    h.className=HANDLE_CLASS;
    h.dataset.corner=corner;
    h.setAttribute("role","separator");
    h.setAttribute("aria-label","달력 크기 조절");

    h.addEventListener("pointerdown",event=>startDrag(event,h,pop),true);

    // Suppress the synthetic mouse/click tail without closing the calendar.
    ["mousedown","mouseup","click","dblclick"].forEach(type=>{
      h.addEventListener(type,event=>{
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      },true);
    });

    return h;
  }

  function install(pop){
    if(!pop||installing) return;
    installing=true;
    try{
      ensureStyle();

      // Remove any old resize handles if a cached page left them behind.
      pop.querySelectorAll(".qf-corner-resize,.qf-corner-resize-v2").forEach(el=>el.remove());

      applyScale(pop,readScale());

      ["nw","ne","sw","se"].forEach(corner=>{
        pop.appendChild(makeHandle(corner,pop));
      });

      requestAnimationFrame(()=>clampPopup(pop));
    }finally{
      installing=false;
    }
  }

  function ensure(){
    const pop=popup();
    if(!pop) return;

    const count=pop.querySelectorAll("."+HANDLE_CLASS).length;
    if(count!==4) install(pop);
    else applyScale(pop,currentScale(pop));
  }

  function boot(){
    ensureStyle();
    ensure();

    // The calendar owner re-renders innerHTML when month/year changes.
    // Reinstall corner handles after that render.
    const observer=new MutationObserver(records=>{
      if(drag) return;
      let relevant=false;
      for(const record of records){
        const target=record.target instanceof Element?record.target:null;
        if(target&&(target.id===POP_ID||target.closest?.("#"+POP_ID))){relevant=true;break;}
        for(const node of record.addedNodes||[]){
          if(!(node instanceof Element)) continue;
          if(node.id===POP_ID||node.querySelector?.("#"+POP_ID)){relevant=true;break;}
        }
        if(relevant) break;
      }
      if(relevant) requestAnimationFrame(ensure);
    });

    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("resize",()=>{
      if(drag) return;
      setTimeout(()=>{
        ensure();
        clampPopup(popup());
      },0);
    },{passive:true});
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();