/* QMES draggable layout sizing V2 - 2026-09-21
 * ADD-ONLY patch.
 * 1) Sales/Due ledger columns can be resized by dragging header separators.
 * 2) ERP left sidebar can be resized by dragging its right edge.
 * Widths are stored per browser and restored on refresh.
 */
(function(){
  "use strict";
  if(window.__QMES_LAYOUT_RESIZABLE_20260921_V2__) return;
  window.__QMES_LAYOUT_RESIZABLE_20260921_V2__=true;

  const COL_KEY="qmes-sales-ledger-v4-column-widths-v1";
  const SIDE_KEY="qmes-erp-sidebar-width-v1";
  const HANDLE_CLASS="qmes-sales-col-resizer";
  const SIDE_HANDLE_ID="qmes-sidebar-resizer-20260921";
  const MIN_COL=[46,88,110,120,150,76,54,88,88,88,88,86];
  const MAX_COL=520;
  const MIN_SIDE=120;
  const MAX_SIDE=420;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const readJson=(key,fallback)=>{
    try{
      const v=JSON.parse(localStorage.getItem(key)||"null");
      return v==null?fallback:v;
    }catch(_){return fallback;}
  };
  const writeJson=(key,value)=>{
    try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}
  };
  const readSide=()=>{
    const n=Number(localStorage.getItem(SIDE_KEY));
    return Number.isFinite(n)?clamp(n,MIN_SIDE,MAX_SIDE):120;
  };
  const writeSide=value=>{
    try{localStorage.setItem(SIDE_KEY,String(Math.round(value)));}catch(_){}
  };

  function ensureStyle(){
    if(document.getElementById("qmes-layout-resizable-20260921-style")) return;
    const s=document.createElement("style");
    s.id="qmes-layout-resizable-20260921-style";
    s.textContent=`
      .qmes-sales-ledger-v4 thead th{
        position:relative!important;
      }
      .qmes-sales-ledger-v4 thead th .${HANDLE_CLASS}{
        position:absolute!important;
        top:0!important;
        right:-4px!important;
        width:9px!important;
        height:100%!important;
        z-index:8!important;
        cursor:col-resize!important;
        touch-action:none!important;
        user-select:none!important;
      }
      .qmes-sales-ledger-v4 thead th .${HANDLE_CLASS}::after{
        content:""!important;
        position:absolute!important;
        top:18%!important;
        bottom:18%!important;
        left:4px!important;
        width:1px!important;
        background:rgba(255,255,255,.45)!important;
      }
      .qmes-sales-ledger-v4 thead th .${HANDLE_CLASS}:hover::after,
      body.qmes-sales-column-resizing .qmes-sales-ledger-v4 thead th .${HANDLE_CLASS}.active::after{
        width:2px!important;
        background:rgba(255,255,255,.95)!important;
      }
      #${SIDE_HANDLE_ID}{
        position:absolute!important;
        top:0!important;
        right:-5px!important;
        bottom:0!important;
        width:10px!important;
        z-index:20!important;
        cursor:ew-resize!important;
        touch-action:none!important;
        user-select:none!important;
        background:transparent!important;
      }
      #${SIDE_HANDLE_ID}::after{
        content:""!important;
        position:absolute!important;
        top:0!important;
        bottom:0!important;
        left:4px!important;
        width:1px!important;
        background:rgba(91,120,142,.30)!important;
      }
      #${SIDE_HANDLE_ID}:hover::after,
      body.qmes-sidebar-resizing #${SIDE_HANDLE_ID}::after{
        width:2px!important;
        background:rgba(47,120,183,.75)!important;
      }
      body.qmes-sales-column-resizing,
      body.qmes-sales-column-resizing *{
        cursor:col-resize!important;
        user-select:none!important;
      }
      body.qmes-sidebar-resizing,
      body.qmes-sidebar-resizing *{
        cursor:ew-resize!important;
        user-select:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function tableInfo(){
    const table=document.querySelector(".qmes-sales-ledger-v4 .qrl-wrap table, .qmes-sales-ledger-v4 table");
    if(!table) return null;
    const headers=[...table.querySelectorAll("thead th")];
    if(!headers.length) return null;
    return {table,headers};
  }

  function clearColumnInline(table){
    if(!table) return;
    table.style.removeProperty("width");
    table.style.removeProperty("min-width");
    table.style.removeProperty("max-width");
    [...table.querySelectorAll("th,td")].forEach(cell=>{
      cell.style.removeProperty("width");
      cell.style.removeProperty("min-width");
      cell.style.removeProperty("max-width");
    });
  }

  function currentColumnWidths(headers){
    return headers.map((th,i)=>{
      const w=Math.round(th.getBoundingClientRect().width);
      return clamp(w,MIN_COL[i]||52,MAX_COL);
    });
  }

  function applyColumnWidths(){
    const info=tableInfo();
    if(!info) return;
    const saved=readJson(COL_KEY,null);
    if(!Array.isArray(saved)||saved.length!==info.headers.length) return;

    const widths=saved.map((w,i)=>clamp(Number(w)||MIN_COL[i]||52,MIN_COL[i]||52,MAX_COL));
    const total=widths.reduce((a,b)=>a+b,0);
    info.table.style.setProperty("table-layout","fixed","important");
    info.table.style.setProperty("width",total+"px","important");
    info.table.style.setProperty("min-width",total+"px","important");
    info.table.style.setProperty("max-width","none","important");

    widths.forEach((width,index)=>{
      info.table.querySelectorAll(`tr > *:nth-child(${index+1})`).forEach(cell=>{
        cell.style.setProperty("width",width+"px","important");
        cell.style.setProperty("min-width",width+"px","important");
        cell.style.setProperty("max-width",width+"px","important");
      });
    });
  }

  function installColumnHandles(){
    const info=tableInfo();
    if(!info) return;

    info.headers.forEach((th,index)=>{
      let handle=[...th.children].find(el=>el.classList&&el.classList.contains(HANDLE_CLASS));
      if(handle) return;

      handle=document.createElement("span");
      handle.className=HANDLE_CLASS;
      handle.setAttribute("role","separator");
      handle.setAttribute("aria-orientation","vertical");
      handle.setAttribute("aria-label",(th.textContent||("열 "+(index+1)))+" 너비 조절");
      th.appendChild(handle);

      handle.addEventListener("pointerdown",event=>{
        if(event.button!==0) return;
        event.preventDefault();
        event.stopPropagation();

        const latest=tableInfo();
        if(!latest) return;
        let widths=readJson(COL_KEY,null);
        if(!Array.isArray(widths)||widths.length!==latest.headers.length){
          widths=currentColumnWidths(latest.headers);
        }

        const startX=event.clientX;
        const startWidth=widths[index];
        document.body.classList.add("qmes-sales-column-resizing");
        handle.classList.add("active");
        handle.setPointerCapture?.(event.pointerId);

        const move=e=>{
          const next=clamp(startWidth+(e.clientX-startX),MIN_COL[index]||52,MAX_COL);
          widths[index]=Math.round(next);
          writeJson(COL_KEY,widths);
          applyColumnWidths();
        };
        const stop=e=>{
          document.body.classList.remove("qmes-sales-column-resizing");
          handle.classList.remove("active");
          handle.releasePointerCapture?.(event.pointerId);
          window.removeEventListener("pointermove",move,true);
          window.removeEventListener("pointerup",stop,true);
          window.removeEventListener("pointercancel",stop,true);
        };

        window.addEventListener("pointermove",move,true);
        window.addEventListener("pointerup",stop,true);
        window.addEventListener("pointercancel",stop,true);
      });

      handle.addEventListener("dblclick",event=>{
        event.preventDefault();
        event.stopPropagation();
        try{localStorage.removeItem(COL_KEY);}catch(_){}
        clearColumnInline(info.table);
      });
    });

    applyColumnWidths();
  }

  function applySidebarWidth(width){
    const side=document.getElementById("qmes-erp-sidebar");
    const main=document.querySelector("#root>div>main");
    const brand=document.querySelector("#qmes-erp-header .qmes-erp-header-brand");
    if(!side) return;

    const w=clamp(Math.round(Number(width)||236),MIN_SIDE,MAX_SIDE);
    document.documentElement.style.setProperty("--qmes-shell-sidebar-width",w+"px");

    side.style.setProperty("width",w+"px","important");

    if(brand){
      brand.style.setProperty("width",w+"px","important");
      brand.style.setProperty("min-width",w+"px","important");
      brand.style.setProperty("max-width",w+"px","important");
      brand.style.setProperty("flex","0 0 "+w+"px","important");
    }

    if(main && !document.body.classList.contains("qmes-erp-menu-closed")){
      main.style.setProperty("margin-left",w+"px","important");
      main.style.setProperty("width","calc(100% - "+w+"px)","important");
    }
  }

  function installSidebarHandle(){
    const side=document.getElementById("qmes-erp-sidebar");
    if(!side) return;
    applySidebarWidth(readSide());

    if(document.getElementById(SIDE_HANDLE_ID)) return;
    const handle=document.createElement("div");
    handle.id=SIDE_HANDLE_ID;
    handle.setAttribute("role","separator");
    handle.setAttribute("aria-orientation","vertical");
    handle.setAttribute("aria-label","왼쪽 메뉴 너비 조절");
    side.appendChild(handle);

    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0) return;
      event.preventDefault();
      event.stopPropagation();

      const startX=event.clientX;
      const startWidth=side.getBoundingClientRect().width||readSide();
      document.body.classList.add("qmes-sidebar-resizing");
      handle.setPointerCapture?.(event.pointerId);

      const move=e=>{
        const next=clamp(startWidth+(e.clientX-startX),MIN_SIDE,MAX_SIDE);
        writeSide(next);
        applySidebarWidth(next);
      };
      const stop=e=>{
        document.body.classList.remove("qmes-sidebar-resizing");
        handle.releasePointerCapture?.(event.pointerId);
        window.removeEventListener("pointermove",move,true);
        window.removeEventListener("pointerup",stop,true);
        window.removeEventListener("pointercancel",stop,true);
      };

      window.addEventListener("pointermove",move,true);
      window.addEventListener("pointerup",stop,true);
      window.addEventListener("pointercancel",stop,true);
    });

    handle.addEventListener("dblclick",event=>{
      event.preventDefault();
      event.stopPropagation();
      try{localStorage.removeItem(SIDE_KEY);}catch(_){}
      writeSide(120);
      applySidebarWidth(120);
    });
  }

  let queued=false;
  function ensure(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      ensureStyle();
      installSidebarHandle();
      installColumnHandles();
      applySidebarWidth(readSide());
      applyColumnWidths();
    });
  }

  function boot(){
    ensure();

    const observer=new MutationObserver(mutations=>{
      const relevant=mutations.some(m=>m.addedNodes&&m.addedNodes.length);
      if(relevant) ensure();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    ["qmes:navigate-tab","qmes:erp-data-changed","qmes:data-updated","qmes:enterprise-ui-ready","qmes:mes-master-ready"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(ensure,0)));

    window.addEventListener("resize",()=>setTimeout(ensure,0));
    [250,800,1600,3000,6000].forEach(ms=>setTimeout(ensure,ms));
    setInterval(()=>{
      const savedSide=Number(localStorage.getItem(SIDE_KEY));
      if(Number.isFinite(savedSide)) applySidebarWidth(savedSide);
      if(readJson(COL_KEY,null)) applyColumnWidths();
    },1500);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();