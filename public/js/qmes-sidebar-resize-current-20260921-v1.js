/* QMES CURRENT sidebar resize owner - 2026-09-21
 * Adds a real draggable right boundary to the current left sidebar.
 * Keeps header brand and main content aligned with sidebar width.
 * Min 64px / Max 420px. No helper text/tooltips.
 */
(function(){
  "use strict";
  if(window.__QMES_SIDEBAR_RESIZE_CURRENT_20260921_V1__) return;
  window.__QMES_SIDEBAR_RESIZE_CURRENT_20260921_V1__=true;

  const KEY="qmes-current-sidebar-width-v1";
  const HANDLE_ID="qmes-current-sidebar-resize-handle";
  const STYLE_ID="qmes-current-sidebar-resize-style";
  const MIN=64,MAX=420,DEFAULT=236;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function width(){
    try{
      const v=Number(localStorage.getItem(KEY));
      return Number.isFinite(v)&&v>=MIN&&v<=MAX?v:DEFAULT;
    }catch(_){return DEFAULT;}
  }
  function save(v){try{localStorage.setItem(KEY,String(Math.round(v)));}catch(_){}}

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      :root{--qmes-shell-sidebar-width:${DEFAULT}px}
      html body #qmes-erp-sidebar{
        width:var(--qmes-shell-sidebar-width)!important;
        border-right:1px solid #9fb4c3!important;
      }
      html body #qmes-erp-header .qmes-erp-header-brand{
        width:var(--qmes-shell-sidebar-width)!important;
        flex:0 0 var(--qmes-shell-sidebar-width)!important;
      }
      html body #root>div>main{
        margin-left:var(--qmes-shell-sidebar-width)!important;
        width:calc(100% - var(--qmes-shell-sidebar-width))!important;
      }
      html body.qmes-erp-menu-closed #root>div>main{
        margin-left:0!important;
        width:100%!important;
      }
      #${HANDLE_ID}{
        position:fixed!important;
        top:58px!important;
        bottom:0!important;
        width:10px!important;
        margin-left:-5px!important;
        z-index:13040!important;
        cursor:col-resize!important;
        touch-action:none!important;
        user-select:none!important;
        background:transparent!important;
      }
      #${HANDLE_ID}::after{
        content:""!important;
        position:absolute!important;
        top:0!important;
        bottom:0!important;
        left:4px!important;
        width:1px!important;
        background:#9fb4c3!important;
      }
      #${HANDLE_ID}:hover::after,
      body.qmes-sidebar-resizing #${HANDLE_ID}::after{
        width:2px!important;
        background:#4f88ad!important;
      }
      html body.qmes-erp-menu-closed #${HANDLE_ID}{display:none!important}
      body.qmes-sidebar-resizing,
      body.qmes-sidebar-resizing *{cursor:col-resize!important;user-select:none!important}
    `;
    document.head.appendChild(s);
  }

  function apply(v){
    const px=clamp(Math.round(v),MIN,MAX);
    document.documentElement.style.setProperty("--qmes-shell-sidebar-width",px+"px");
    const h=document.getElementById(HANDLE_ID);
    if(h) h.style.left=px+"px";
    return px;
  }

  function ensureHandle(){
    ensureStyle();
    let h=document.getElementById(HANDLE_ID);
    if(!h){
      h=document.createElement("div");
      h.id=HANDLE_ID;
      h.setAttribute("role","separator");
      h.setAttribute("aria-orientation","vertical");
      h.setAttribute("aria-label","왼쪽 메뉴 너비 조절");
      document.body.appendChild(h);

      h.addEventListener("pointerdown",event=>{
        if(event.button!==0) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const startX=event.clientX;
        const start=width();
        document.body.classList.add("qmes-sidebar-resizing");
        try{h.setPointerCapture(event.pointerId);}catch(_){}

        const move=e=>{
          const next=apply(start+(e.clientX-startX));
          save(next);
        };
        const stop=e=>{
          document.body.classList.remove("qmes-sidebar-resizing");
          try{h.releasePointerCapture(event.pointerId);}catch(_){}
          window.removeEventListener("pointermove",move,true);
          window.removeEventListener("pointerup",stop,true);
          window.removeEventListener("pointercancel",stop,true);
        };

        window.addEventListener("pointermove",move,true);
        window.addEventListener("pointerup",stop,true);
        window.addEventListener("pointercancel",stop,true);
      },true);

      h.addEventListener("dblclick",event=>{
        event.preventDefault();
        event.stopPropagation();
        const next=apply(DEFAULT);
        save(next);
      },true);
    }
    apply(width());
  }

  function boot(){
    ensureHandle();
    const observer=new MutationObserver(()=>ensureHandle());
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("resize",()=>apply(width()),{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();