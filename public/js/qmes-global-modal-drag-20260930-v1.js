(function(){
  "use strict";
  if(window.__QMES_GLOBAL_MODAL_DRAG_V1__) return;
  window.__QMES_GLOBAL_MODAL_DRAG_V1__=true;

  const DIALOG_SELECTORS=[
    ".qmes-wo-viewer",
    ".qmes-modal",
    ".modal",
    "[role='dialog']"
  ];
  const HANDLE_SELECTORS=[
    ".qmes-wo-viewer-head",
    ".qmes-modal-head",
    ".qmes-modal-header",
    ".modal-header",
    "[data-modal-header]"
  ];
  const INTERACTIVE="button,input,select,textarea,a,label,[contenteditable='true']";
  const state=new WeakMap();

  function isDialog(el){
    if(!(el instanceof HTMLElement)) return false;
    if(DIALOG_SELECTORS.some(s=>el.matches(s))) return true;
    return false;
  }

  function findDialog(node){
    if(!(node instanceof Element)) return null;
    return node.closest(DIALOG_SELECTORS.join(","));
  }

  function getHandle(dialog,target){
    const explicit=HANDLE_SELECTORS.map(s=>dialog.querySelector(s)).find(Boolean);
    if(explicit){
      if(explicit.contains(target) && !target.closest(INTERACTIVE)) return explicit;
      return null;
    }
    const r=dialog.getBoundingClientRect();
    const y=(target.ownerDocument.defaultView.event&&target.ownerDocument.defaultView.event.clientY)||0;
    if(y>=r.top && y<=r.top+56 && !target.closest(INTERACTIVE)) return dialog;
    return null;
  }

  function prepare(dialog){
    if(!isDialog(dialog) || state.has(dialog)) return;
    const cs=getComputedStyle(dialog);
    if(cs.position==="static") dialog.style.position="relative";
    dialog.style.willChange="transform";
    const handles=HANDLE_SELECTORS.map(s=>dialog.querySelector(s)).filter(Boolean);
    handles.forEach(h=>h.style.cursor="move");
    state.set(dialog,{x:0,y:0});
  }

  function scan(root=document){
    DIALOG_SELECTORS.forEach(sel=>{
      root.querySelectorAll(sel).forEach(prepare);
    });
  }

  let drag=null;

  document.addEventListener("pointerdown",function(e){
    if(e.button!==0) return;
    const dialog=findDialog(e.target);
    if(!dialog) return;
    prepare(dialog);

    const explicit=HANDLE_SELECTORS.map(s=>dialog.querySelector(s)).find(Boolean);
    let canDrag=false;
    if(explicit){
      canDrag=explicit.contains(e.target) && !e.target.closest(INTERACTIVE);
    }else{
      const r=dialog.getBoundingClientRect();
      canDrag=e.clientY>=r.top && e.clientY<=r.top+56 && !e.target.closest(INTERACTIVE);
    }
    if(!canDrag) return;

    const st=state.get(dialog)||{x:0,y:0};
    drag={dialog,startX:e.clientX,startY:e.clientY,baseX:st.x,baseY:st.y,pointerId:e.pointerId};
    try{dialog.setPointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();
  },true);

  document.addEventListener("pointermove",function(e){
    if(!drag || e.pointerId!==drag.pointerId) return;
    const dx=e.clientX-drag.startX;
    const dy=e.clientY-drag.startY;
    const x=drag.baseX+dx;
    const y=drag.baseY+dy;
    drag.dialog.style.setProperty("transform",`translate(${x}px,${y}px)`,"important");
    const st=state.get(drag.dialog)||{};
    st.x=x;st.y=y;state.set(drag.dialog,st);
    e.preventDefault();
  },true);

  function endDrag(e){
    if(!drag) return;
    if(e && e.pointerId!==undefined && e.pointerId!==drag.pointerId) return;
    try{drag.dialog.releasePointerCapture(drag.pointerId);}catch(_){}
    drag=null;
  }
  document.addEventListener("pointerup",endDrag,true);
  document.addEventListener("pointercancel",endDrag,true);

  document.addEventListener("dblclick",function(e){
    const dialog=findDialog(e.target);
    if(!dialog) return;
    const explicit=HANDLE_SELECTORS.map(s=>dialog.querySelector(s)).find(Boolean);
    if(explicit && !explicit.contains(e.target)) return;
    if(e.target.closest(INTERACTIVE)) return;
    dialog.style.removeProperty("transform");
    state.set(dialog,{x:0,y:0});
  },true);

  const observer=new MutationObserver(()=>scan());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();