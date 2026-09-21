/* QMES Sales full-height column resize - 2026-09-21
 * ADD-ONLY patch.
 * Makes every vertical column boundary draggable through the full table body.
 * Columns can shrink to near-hidden width or expand up to 600px.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FULLHEIGHT_COLUMN_RESIZE_20260921__) return;
  window.__QMES_SALES_FULLHEIGHT_COLUMN_RESIZE_20260921__=true;

  const WIDTH_KEY="qmes-sales-ledger-v4-column-widths-v1";
  const HANDLE_CLASS="qmes-sales-fullheight-resizer";
  const MIN_WIDTH=18;
  const MAX_WIDTH=600;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const readWidths=()=>{
    try{
      const v=JSON.parse(localStorage.getItem(WIDTH_KEY)||"null");
      return Array.isArray(v)?v:null;
    }catch(_){return null;}
  };
  const saveWidths=widths=>{
    try{localStorage.setItem(WIDTH_KEY,JSON.stringify(widths));}catch(_){}
  };

  function info(){
    const root=document.querySelector(".qmes-sales-ledger-v4");
    const wrap=root&&root.querySelector(".qrl-wrap");
    const table=wrap&&wrap.querySelector("table");
    const headers=table?[...table.querySelectorAll("thead th")]:[];
    if(!root||!wrap||!table||headers.length<2) return null;
    return {root,wrap,table,headers};
  }

  function actualWidths(headers){
    return headers.map(th=>Math.max(MIN_WIDTH,Math.round(th.getBoundingClientRect().width)));
  }

  function applyWidths(widths){
    const x=info();
    if(!x||!Array.isArray(widths)||widths.length!==x.headers.length) return;

    const normalized=widths.map(w=>clamp(Number(w)||MIN_WIDTH,MIN_WIDTH,MAX_WIDTH));
    const total=Math.round(normalized.reduce((a,b)=>a+b,0));

    x.table.style.setProperty("table-layout","fixed","important");
    x.table.style.setProperty("width",total+"px","important");
    x.table.style.setProperty("min-width",total+"px","important");
    x.table.style.setProperty("max-width","none","important");

    normalized.forEach((width,index)=>{
      x.table.querySelectorAll(`tr > *:nth-child(${index+1})`).forEach(cell=>{
        cell.style.setProperty("width",Math.round(width)+"px","important");
        cell.style.setProperty("min-width",Math.round(width)+"px","important");
        cell.style.setProperty("max-width",Math.round(width)+"px","important");
      });
    });

    positionHandles();
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-fullheight-column-resize-20260921-style")) return;
    const style=document.createElement("style");
    style.id="qmes-sales-fullheight-column-resize-20260921-style";
    style.textContent=`
      .qmes-sales-ledger-v4 .qrl-wrap{
        position:relative!important;
      }

      .qmes-sales-ledger-v4 .${HANDLE_CLASS}{
        position:absolute!important;
        top:0!important;
        bottom:0!important;
        width:10px!important;
        margin-left:-5px!important;
        z-index:15!important;
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
      body.qmes-sales-fullheight-resizing .qmes-sales-ledger-v4 .${HANDLE_CLASS}.active::after{
        background:rgba(46,105,145,.62)!important;
      }

      body.qmes-sales-fullheight-resizing,
      body.qmes-sales-fullheight-resizing *{
        cursor:col-resize!important;
        user-select:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  function positionHandles(){
    const x=info();
    if(!x) return;

    const wrapRect=x.wrap.getBoundingClientRect();
    x.wrap.querySelectorAll("."+HANDLE_CLASS).forEach((handle,index)=>{
      const th=x.headers[index];
      if(!th) return;
      const thRect=th.getBoundingClientRect();
      const left=(thRect.right-wrapRect.left)+x.wrap.scrollLeft;
      handle.style.left=Math.round(left)+"px";
    });
  }

  function installHandles(){
    const x=info();
    if(!x) return;

    ensureStyle();

    let widths=readWidths();
    if(!Array.isArray(widths)||widths.length!==x.headers.length){
      widths=actualWidths(x.headers);
      saveWidths(widths);
    }
    applyWidths(widths);

    for(let index=0;index<x.headers.length-1;index++){
      let handle=x.wrap.querySelector(`.${HANDLE_CLASS}[data-index="${index}"]`);
      if(!handle){
        handle=document.createElement("div");
        handle.className=HANDLE_CLASS;
        handle.dataset.index=String(index);
        handle.setAttribute("role","separator");
        handle.setAttribute("aria-orientation","vertical");
        handle.setAttribute("aria-label",(x.headers[index].textContent||("열 "+(index+1)))+" 너비 조절");
        handle.title="좌우로 드래그: 최소 18px ~ 최대 600px / 더블클릭: 기본 폭";
        x.wrap.appendChild(handle);

        handle.addEventListener("pointerdown",event=>{
          if(event.button!==0) return;
          event.preventDefault();
          event.stopPropagation();

          const latest=info();
          if(!latest) return;

          let current=readWidths();
          if(!Array.isArray(current)||current.length!==latest.headers.length){
            current=actualWidths(latest.headers);
          }

          const i=Number(handle.dataset.index);
          const startX=event.clientX;
          const startWidth=current[i];
          document.body.classList.add("qmes-sales-fullheight-resizing");
          handle.classList.add("active");
          handle.setPointerCapture?.(event.pointerId);

          const move=e=>{
            const next=clamp(startWidth+(e.clientX-startX),MIN_WIDTH,MAX_WIDTH);
            current[i]=Math.round(next);
            saveWidths(current);
            applyWidths(current);
          };

          const stop=e=>{
            document.body.classList.remove("qmes-sales-fullheight-resizing");
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

          const latest=info();
          if(!latest) return;

          const defaults=actualWidths(latest.headers);
          const saved=readWidths();
          const next=Array.isArray(saved)&&saved.length===defaults.length?saved.slice():defaults.slice();
          const i=Number(handle.dataset.index);

          latest.table.querySelectorAll(`tr > *:nth-child(${i+1})`).forEach(cell=>{
            cell.style.removeProperty("width");
            cell.style.removeProperty("min-width");
            cell.style.removeProperty("max-width");
          });

          requestAnimationFrame(()=>{
            const natural=Math.max(MIN_WIDTH,Math.round(latest.headers[i].getBoundingClientRect().width));
            next[i]=natural;
            saveWidths(next);
            applyWidths(next);
          });
        });
      }
    }

    positionHandles();
  }

  let queued=false;
  function ensure(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      installHandles();
      positionHandles();
    });
  }

  function boot(){
    ensure();

    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.addedNodes&&m.addedNodes.length)) ensure();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    ["qmes:navigate-tab","qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(ensure,0)));

    window.addEventListener("resize",()=>setTimeout(ensure,0));

    const x=info();
    x?.wrap?.addEventListener("scroll",positionHandles,{passive:true});

    [300,900,1800,3500,6000].forEach(ms=>setTimeout(ensure,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();