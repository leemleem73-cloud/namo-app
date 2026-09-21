/* QMES Sales layout stability - 2026-09-21
 * ADD-ONLY patch. Original files remain untouched.
 *
 * Purpose:
 * - Stop the sales ledger width oscillation caused by multiple legacy resize
 *   controllers re-applying different widths on timers.
 * - Keep one stable owner for sales column sizing and ERP sidebar sizing.
 * - Preserve drag resizing without background setInterval loops.
 * - Hide the sales ledger only until its initial stable layout is applied.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_LAYOUT_STABILITY_20260921__) return;
  window.__QMES_SALES_LAYOUT_STABILITY_20260921__=true;

  /* Pre-lock legacy width owners BEFORE their scripts load. */
  window.__QMES_LAYOUT_RESIZABLE_20260921_V2__=true;
  window.__QMES_LAYOUT_RESIZE_POLISH_20260921_V2__=true;
  window.__QMES_SALES_FULLHEIGHT_COLUMN_RESIZE_20260921__=true;
  window.__QMES_SALES_RIGHT_EDGE_FIT_FIX_20260921__=true;

  const COL_KEY="qmes-sales-ledger-v4-column-widths-v1";
  const SIDE_KEY="qmes-erp-sidebar-width-v1";
  const SIDE_HANDLE_ID="qmes-sidebar-resizer-20260921";
  const HANDLE_CLASS="qmes-sales-stable-resizer";
  const MIN_COL=[46,88,110,120,150,76,54,88,88,88,88,86];
  const MAX_COL=600;
  const MIN_SIDE=120;
  const MAX_SIDE=420;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const readWidths=()=>{
    try{
      const v=JSON.parse(localStorage.getItem(COL_KEY)||"null");
      return Array.isArray(v)?v.map(Number):null;
    }catch(_){return null;}
  };
  const saveWidths=v=>{try{localStorage.setItem(COL_KEY,JSON.stringify(v));}catch(_){}};
  const readSide=()=>{
    const n=Number(localStorage.getItem(SIDE_KEY));
    return Number.isFinite(n)?clamp(n,MIN_SIDE,MAX_SIDE):120;
  };
  const saveSide=v=>{try{localStorage.setItem(SIDE_KEY,String(Math.round(v)));}catch(_){}};

  function ensureStyle(){
    if(document.getElementById("qmes-sales-layout-stability-20260921-style")) return;
    const s=document.createElement("style");
    s.id="qmes-sales-layout-stability-20260921-style";
    s.textContent=`
      .qmes-sales-ledger-v4:not([data-qmes-layout-stable-ready="1"]){
        visibility:hidden!important;
      }
      .qmes-sales-ledger-v4 .qrl-wrap{
        position:relative!important;
      }
      .qmes-sales-ledger-v4 .${HANDLE_CLASS}{
        position:absolute!important;
        top:0!important;
        bottom:0!important;
        width:10px!important;
        margin-left:-5px!important;
        z-index:18!important;
        cursor:col-resize!important;
        touch-action:none!important;
        user-select:none!important;
        background:transparent!important;
        border:0!important;
      }
      .qmes-sales-ledger-v4 .${HANDLE_CLASS}::after{
        content:""!important;
        position:absolute!important;
        top:0!important;
        bottom:0!important;
        left:4px!important;
        width:1px!important;
        background:transparent!important;
        pointer-events:none!important;
      }
      .qmes-sales-ledger-v4 .${HANDLE_CLASS}:hover::after,
      body.qmes-sales-stable-resizing .qmes-sales-ledger-v4 .${HANDLE_CLASS}.active::after{
        background:rgba(46,105,145,.62)!important;
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
      body.qmes-sales-stable-resizing,
      body.qmes-sales-stable-resizing *{
        cursor:col-resize!important;
        user-select:none!important;
      }
      body.qmes-sidebar-stable-resizing,
      body.qmes-sidebar-stable-resizing *{
        cursor:ew-resize!important;
        user-select:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function salesInfo(){
    const root=document.querySelector(".qmes-sales-ledger-v4");
    const wrap=root&&root.querySelector(".qrl-wrap");
    const table=wrap&&wrap.querySelector("table");
    const headers=table?[...table.querySelectorAll("thead th")]:[];
    if(!root||!wrap||!table||headers.length<2) return null;
    return {root,wrap,table,headers};
  }

  function naturalWidths(headers){
    return headers.map((th,i)=>{
      const w=Math.round(th.getBoundingClientRect().width);
      return clamp(w||MIN_COL[i]||52,MIN_COL[i]||52,MAX_COL);
    });
  }

  function normalizedSaved(headers){
    const saved=readWidths();
    if(!saved||saved.length!==headers.length||saved.some(v=>!Number.isFinite(v)||v<=0)) return null;
    return saved.map((w,i)=>clamp(w,MIN_COL[i]||52,MAX_COL));
  }

  function applyWidths(info,widths){
    if(!info||!Array.isArray(widths)||widths.length!==info.headers.length) return;
    const normalized=widths.map((w,i)=>clamp(Number(w)||MIN_COL[i]||52,MIN_COL[i]||52,MAX_COL));
    const baseTotal=Math.round(normalized.reduce((a,b)=>a+b,0));
    const available=Math.max(0,Math.floor(info.wrap.clientWidth));
    const rendered=normalized.slice();

    /* Fill free space once, deterministically, using only the final column. */
    if(available>baseTotal) rendered[rendered.length-1]+=available-baseTotal;

    const total=Math.round(rendered.reduce((a,b)=>a+b,0));
    info.table.style.setProperty("table-layout","fixed","important");
    info.table.style.setProperty("width",total+"px","important");
    info.table.style.setProperty("min-width",total+"px","important");
    info.table.style.setProperty("max-width","none","important");

    rendered.forEach((width,index)=>{
      const th=info.headers[index];
      if(!th)return;
      th.style.setProperty("width",Math.round(width)+"px","important");
      th.style.setProperty("min-width",Math.round(width)+"px","important");
      th.style.setProperty("max-width",Math.round(width)+"px","important");
    });
  }

  function positionHandles(info){
    if(!info)return;
    info.wrap.querySelectorAll("."+HANDLE_CLASS).forEach(handle=>{
      const i=Number(handle.dataset.index);
      const th=info.headers[i];
      if(!th)return;
      handle.style.left=Math.round(th.offsetLeft+th.offsetWidth)+"px";
    });
  }

  function installSales(){
    const info=salesInfo();
    if(!info)return false;
    if(info.root.dataset.qmesLayoutStableReady==="1"){
      positionHandles(info);
      return true;
    }

    const saved=normalizedSaved(info.headers);
    if(saved) applyWidths(info,saved);

    for(let i=0;i<info.headers.length-1;i++){
      const handle=document.createElement("div");
      handle.className=HANDLE_CLASS;
      handle.dataset.index=String(i);
      handle.setAttribute("role","separator");
      handle.setAttribute("aria-orientation","vertical");
      handle.setAttribute("aria-label",(info.headers[i].textContent||("열 "+(i+1)))+" 너비 조절");
      info.wrap.appendChild(handle);

      handle.addEventListener("pointerdown",event=>{
        if(event.button!==0)return;
        event.preventDefault();
        event.stopPropagation();

        const latest=salesInfo();
        if(!latest)return;
        let widths=normalizedSaved(latest.headers)||naturalWidths(latest.headers);
        const index=Number(handle.dataset.index);
        const startX=event.clientX;
        const startWidth=widths[index];

        document.body.classList.add("qmes-sales-stable-resizing");
        handle.classList.add("active");
        handle.setPointerCapture?.(event.pointerId);

        const move=e=>{
          widths[index]=Math.round(clamp(startWidth+(e.clientX-startX),MIN_COL[index]||52,MAX_COL));
          saveWidths(widths);
          applyWidths(latest,widths);
          positionHandles(latest);
        };
        const stop=e=>{
          document.body.classList.remove("qmes-sales-stable-resizing");
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
        const latest=salesInfo();
        if(!latest)return;
        latest.table.style.removeProperty("width");
        latest.table.style.removeProperty("min-width");
        latest.table.style.removeProperty("max-width");
        latest.headers.forEach(th=>{
          th.style.removeProperty("width");
          th.style.removeProperty("min-width");
          th.style.removeProperty("max-width");
        });
        requestAnimationFrame(()=>positionHandles(latest));
      });
    }

    requestAnimationFrame(()=>{
      const latest=salesInfo();
      if(!latest)return;
      positionHandles(latest);
      latest.root.dataset.qmesLayoutStableReady="1";
    });
    return true;
  }

  function applySidebar(){
    const side=document.getElementById("qmes-erp-sidebar");
    const main=document.querySelector("#root>div>main");
    const brand=document.querySelector("#qmes-erp-header .qmes-erp-header-brand");
    if(!side)return false;

    const closed=document.body.classList.contains("qmes-erp-menu-closed")||side.hidden;
    if(closed){
      if(main){
        main.style.setProperty("margin-left","0","important");
        main.style.setProperty("width","100%","important");
      }
      return true;
    }

    const width=readSide();
    document.documentElement.style.setProperty("--qmes-shell-sidebar-width",width+"px");
    side.style.setProperty("width",width+"px","important");
    if(brand){
      brand.style.setProperty("width",width+"px","important");
      brand.style.setProperty("min-width",width+"px","important");
      brand.style.setProperty("max-width",width+"px","important");
      brand.style.setProperty("flex","0 0 "+width+"px","important");
    }
    if(main){
      main.style.setProperty("margin-left",width+"px","important");
      main.style.setProperty("width","calc(100% - "+width+"px)","important");
    }
    return true;
  }

  function installSidebar(){
    const side=document.getElementById("qmes-erp-sidebar");
    if(!side)return false;
    applySidebar();

    let handle=document.getElementById(SIDE_HANDLE_ID);
    if(handle)return true;
    handle=document.createElement("div");
    handle.id=SIDE_HANDLE_ID;
    handle.setAttribute("role","separator");
    handle.setAttribute("aria-orientation","vertical");
    handle.setAttribute("aria-label","왼쪽 메뉴 너비 조절");
    side.appendChild(handle);

    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0)return;
      event.preventDefault();
      event.stopPropagation();

      const startX=event.clientX;
      const startWidth=side.getBoundingClientRect().width||readSide();
      document.body.classList.add("qmes-sidebar-stable-resizing");
      handle.setPointerCapture?.(event.pointerId);

      const move=e=>{
        const next=clamp(startWidth+(e.clientX-startX),MIN_SIDE,MAX_SIDE);
        saveSide(next);
        applySidebar();
        const info=salesInfo();
        if(info){
          const saved=normalizedSaved(info.headers);
          if(saved)applyWidths(info,saved);
          positionHandles(info);
        }
      };
      const stop=e=>{
        document.body.classList.remove("qmes-sidebar-stable-resizing");
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
      saveSide(120);
      applySidebar();
    });
    return true;
  }

  let frame=0;
  function schedule(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      ensureStyle();
      installSidebar();
      installSales();
    });
  }

  let resizeTimer=0;
  function stableResize(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      applySidebar();
      const info=salesInfo();
      if(info){
        const saved=normalizedSaved(info.headers);
        if(saved)applyWidths(info,saved);
        positionHandles(info);
      }
    },180);
  }

  function boot(){
    ensureStyle();
    schedule();

    /* Only watch for a newly mounted Sales root; no continuous width re-apply. */
    const observer=new MutationObserver(records=>{
      let needs=false;
      for(const record of records){
        for(const node of record.addedNodes||[]){
          if(!(node instanceof Element))continue;
          if(node.matches?.(".qmes-sales-ledger-v4")||node.querySelector?.(".qmes-sales-ledger-v4")||node.id==="qmes-erp-sidebar"){
            needs=true;break;
          }
        }
        if(needs)break;
      }
      if(needs)schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("qmes:navigate-tab",()=>setTimeout(schedule,0));
    window.addEventListener("resize",stableResize,{passive:true});
    document.addEventListener("click",event=>{
      if(event.target instanceof Element&&event.target.closest("#qmes-erp-header .qmes-erp-header-menu")){
        setTimeout(()=>{applySidebar();stableResize();},0);
      }
    },true);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();