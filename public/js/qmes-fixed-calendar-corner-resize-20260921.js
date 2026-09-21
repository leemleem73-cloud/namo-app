/* QMES fixed calendar corner-resize guard - 2026-09-21
 * ADD-ONLY patch. Does not replace the approved calendar owner.
 * Fixes calendar disappearing while resizing and provides four-corner
 * proportional shrink/expand without changing the calendar's internal layout.
 */
(function(){
  "use strict";
  if(window.__QMES_FIXED_CALENDAR_CORNER_RESIZE_20260921__) return;
  window.__QMES_FIXED_CALENDAR_CORNER_RESIZE_20260921__=true;

  const POP_ID="qmes-fixed-calendar-reference-20260921-v2-pop";
  const STYLE_ID="qmes-fixed-calendar-corner-resize-20260921-style";
  const SCALE_KEY="qmes-fixed-calendar-scale-v1";
  const MIN_SCALE=.72;
  const MAX_SCALE=1.35;
  const HANDLE_CLASS="qf-corner-resize";
  let dragging=false;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const readScale=()=>{
    try{
      const n=Number(localStorage.getItem(SCALE_KEY));
      return Number.isFinite(n)?clamp(n,MIN_SCALE,MAX_SCALE):1;
    }catch(_){return 1;}
  };
  const saveScale=n=>{try{localStorage.setItem(SCALE_KEY,String(n));}catch(_){}};

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${POP_ID}{
        transform-origin:top left!important;
        will-change:transform,left,top!important;
      }
      #${POP_ID} .${HANDLE_CLASS}{
        position:absolute!important;
        width:16px!important;
        height:16px!important;
        z-index:2147483647!important;
        background:transparent!important;
        border:0!important;
        padding:0!important;
        margin:0!important;
        touch-action:none!important;
        user-select:none!important;
      }
      #${POP_ID} .${HANDLE_CLASS}[data-corner="nw"]{left:-2px!important;top:-2px!important;cursor:nwse-resize!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="ne"]{right:-2px!important;top:-2px!important;cursor:nesw-resize!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="sw"]{left:-2px!important;bottom:-2px!important;cursor:nesw-resize!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="se"]{right:-2px!important;bottom:-2px!important;cursor:nwse-resize!important;}
      #${POP_ID} .${HANDLE_CLASS}::before,
      #${POP_ID} .${HANDLE_CLASS}::after{
        content:""!important;
        position:absolute!important;
        background:#8eb8d3!important;
        opacity:.9!important;
        pointer-events:none!important;
      }
      #${POP_ID} .${HANDLE_CLASS}::before{width:8px!important;height:2px!important;}
      #${POP_ID} .${HANDLE_CLASS}::after{width:2px!important;height:8px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="nw"]::before{left:1px!important;top:1px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="nw"]::after{left:1px!important;top:1px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="ne"]::before{right:1px!important;top:1px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="ne"]::after{right:1px!important;top:1px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="sw"]::before{left:1px!important;bottom:1px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="sw"]::after{left:1px!important;bottom:1px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="se"]::before{right:1px!important;bottom:1px!important;}
      #${POP_ID} .${HANDLE_CLASS}[data-corner="se"]::after{right:1px!important;bottom:1px!important;}
      body.qmes-calendar-corner-resizing,
      body.qmes-calendar-corner-resizing *{
        user-select:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function clampPosition(pop){
    if(!pop||dragging) return;
    const rect=pop.getBoundingClientRect();
    let left=parseFloat(pop.style.left)||rect.left;
    let top=parseFloat(pop.style.top)||rect.top;
    if(rect.right>window.innerWidth-8) left-=rect.right-(window.innerWidth-8);
    if(rect.bottom>window.innerHeight-8) top-=rect.bottom-(window.innerHeight-8);
    if(rect.left<8) left+=8-rect.left;
    if(rect.top<8) top+=8-rect.top;
    pop.style.setProperty("left",Math.round(left)+"px","important");
    pop.style.setProperty("top",Math.round(top)+"px","important");
  }

  function applySavedScale(pop){
    if(!pop)return;
    const scale=readScale();
    pop.dataset.qmesCalendarScale=String(scale);
    pop.style.setProperty("transform","scale("+scale+")","important");
    requestAnimationFrame(()=>clampPosition(pop));
  }

  function startResize(event,handle,pop){
    if(event.button!==0 && event.pointerType!=="touch") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const corner=handle.dataset.corner||"se";
    const startRect=pop.getBoundingClientRect();
    const baseW=Math.max(1,pop.offsetWidth);
    const baseH=Math.max(1,pop.offsetHeight);
    const startX=event.clientX;
    const startY=event.clientY;
    const anchorRight=startRect.right;
    const anchorBottom=startRect.bottom;
    const anchorLeft=startRect.left;
    const anchorTop=startRect.top;
    let lastScale=readScale();

    dragging=true;
    document.body.classList.add("qmes-calendar-corner-resizing");
    handle.setPointerCapture?.(event.pointerId);

    const move=e=>{
      e.preventDefault();
      e.stopPropagation();

      const dx=e.clientX-startX;
      const dy=e.clientY-startY;
      const sx=(corner==="nw"||corner==="sw")
        ? (startRect.width-dx)/baseW
        : (startRect.width+dx)/baseW;
      const sy=(corner==="nw"||corner==="ne")
        ? (startRect.height-dy)/baseH
        : (startRect.height+dy)/baseH;

      /* Use the dominant intended movement while preserving proportions. */
      let next=Math.abs(sx-lastScale)>=Math.abs(sy-lastScale)?sx:sy;
      next=clamp(next,MIN_SCALE,MAX_SCALE);
      lastScale=next;

      const w=baseW*next;
      const h=baseH*next;
      let left=anchorLeft;
      let top=anchorTop;
      if(corner==="nw"||corner==="sw") left=anchorRight-w;
      if(corner==="nw"||corner==="ne") top=anchorBottom-h;

      left=clamp(left,8,Math.max(8,window.innerWidth-w-8));
      top=clamp(top,8,Math.max(8,window.innerHeight-h-8));

      pop.dataset.qmesCalendarScale=String(next);
      pop.style.setProperty("transform","scale("+next+")","important");
      pop.style.setProperty("left",Math.round(left)+"px","important");
      pop.style.setProperty("top",Math.round(top)+"px","important");
    };

    const stop=e=>{
      e?.preventDefault?.();
      e?.stopPropagation?.();
      dragging=false;
      document.body.classList.remove("qmes-calendar-corner-resizing");
      handle.releasePointerCapture?.(event.pointerId);
      window.removeEventListener("pointermove",move,true);
      window.removeEventListener("pointerup",stop,true);
      window.removeEventListener("pointercancel",stop,true);
      const scale=Number(pop.dataset.qmesCalendarScale)||1;
      saveScale(clamp(scale,MIN_SCALE,MAX_SCALE));
      requestAnimationFrame(()=>clampPosition(pop));
    };

    window.addEventListener("pointermove",move,true);
    window.addEventListener("pointerup",stop,true);
    window.addEventListener("pointercancel",stop,true);
  }

  function install(pop){
    if(!pop)return;
    ensureStyle();
    applySavedScale(pop);

    ["nw","ne","sw","se"].forEach(corner=>{
      if(pop.querySelector('.'+HANDLE_CLASS+'[data-corner="'+corner+'"]')) return;
      const h=document.createElement("span");
      h.className=HANDLE_CLASS;
      h.dataset.corner=corner;
      h.setAttribute("role","separator");
      h.setAttribute("aria-label","달력 크기 조절");
      h.addEventListener("pointerdown",e=>startResize(e,h,pop),true);
      h.addEventListener("click",e=>{
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      },true);
      pop.appendChild(h);
    });
  }

  function ensure(){
    const pop=document.getElementById(POP_ID);
    if(pop) install(pop);
  }

  const observer=new MutationObserver(records=>{
    let needed=false;
    for(const record of records){
      if(record.target instanceof Element && (record.target.id===POP_ID || record.target.closest?.("#"+POP_ID))){
        needed=true;break;
      }
      for(const node of record.addedNodes||[]){
        if(!(node instanceof Element)) continue;
        if(node.id===POP_ID || node.querySelector?.("#"+POP_ID)){
          needed=true;break;
        }
      }
      if(needed)break;
    }
    if(needed) requestAnimationFrame(ensure);
  });

  function boot(){
    ensureStyle();
    ensure();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener("pointerdown",event=>{
      const target=event.target instanceof Element?event.target:null;
      if(target?.closest("#"+POP_ID+" ."+HANDLE_CLASS)){
        event.stopPropagation();
      }
    },true);
    window.addEventListener("resize",()=>setTimeout(ensure,0),{passive:true});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();