/* QMES Sales column resize CURRENT owner V3 - 2026-09-21
 * Current Sales/Due ledger only.
 * Fixes lost resize handles after React table re-render.
 * Every body separator can be dragged left/right; min 18px, max 600px.
 * Add-only patch. Does not restore any retired UI.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COLUMN_RESIZE_CURRENT_20260921_V3__) return;
  window.__QMES_SALES_COLUMN_RESIZE_CURRENT_20260921_V3__=true;

  const KEY="qmes-sales-ledger-v4-column-widths-v1";
  const HANDLE="qmes-sales-current-v3-resizer";
  const STYLE="qmes-sales-current-v3-resizer-style";
  const MIN=18, MAX=600;

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const read=()=>{
    try{
      const v=JSON.parse(localStorage.getItem(KEY)||"null");
      return Array.isArray(v)?v.map(Number):null;
    }catch(_){return null;}
  };
  const save=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));}catch(_){}};

  function get(){
    const root=document.querySelector(".qmes-sales-ledger-v4");
    const wrap=root?.querySelector(".qrl-wrap");
    const table=wrap?.querySelector("table");
    const headers=table?[...table.querySelectorAll("thead th")]:[];
    if(!root||!wrap||!table||headers.length<2) return null;
    return {root,wrap,table,headers};
  }

  function addStyle(){
    if(document.getElementById(STYLE)) return;
    const s=document.createElement("style");
    s.id=STYLE;
    s.textContent=`
      .qmes-sales-ledger-v4 .qrl-wrap{position:relative!important}
      .qmes-sales-ledger-v4 table,
      .qmes-sales-ledger-v4 th,
      .qmes-sales-ledger-v4 td{box-sizing:border-box!important}
      .qmes-sales-ledger-v4 th,
      .qmes-sales-ledger-v4 td{
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      .qmes-sales-ledger-v4 .${HANDLE}{
        position:absolute!important;
        width:12px!important;
        margin-left:-6px!important;
        z-index:40!important;
        cursor:col-resize!important;
        touch-action:none!important;
        user-select:none!important;
        background:transparent!important;
        border:0!important;
      }
      .qmes-sales-ledger-v4 .${HANDLE}::after{
        content:""!important;
        position:absolute!important;
        top:0!important;
        bottom:0!important;
        left:5px!important;
        width:1px!important;
        background:transparent!important;
        pointer-events:none!important;
      }
      .qmes-sales-ledger-v4 .${HANDLE}:hover::after,
      body.qmes-sales-current-v3-dragging .qmes-sales-ledger-v4 .${HANDLE}.active::after{
        width:2px!important;
        background:rgba(34,101,145,.72)!important;
      }
      body.qmes-sales-current-v3-dragging,
      body.qmes-sales-current-v3-dragging *{
        cursor:col-resize!important;
        user-select:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  function widths(info){
    let v=read();
    if(!v||v.length!==info.headers.length||v.some(x=>!Number.isFinite(x)||x<=0)){
      v=info.headers.map(th=>clamp(Math.round(th.getBoundingClientRect().width)||MIN,MIN,MAX));
      save(v);
    }
    return v.map(x=>clamp(Number(x)||MIN,MIN,MAX));
  }

  function apply(info,v){
    if(!info||!Array.isArray(v)||v.length!==info.headers.length) return;
    const w=v.map(x=>clamp(Number(x)||MIN,MIN,MAX));
    const total=Math.round(w.reduce((a,b)=>a+b,0));

    info.table.style.setProperty("table-layout","fixed","important");
    info.table.style.setProperty("width",total+"px","important");
    info.table.style.setProperty("min-width",total+"px","important");
    info.table.style.setProperty("max-width","none","important");

    w.forEach((px,i)=>{
      info.table.querySelectorAll("tr > *:nth-child("+(i+1)+")").forEach(cell=>{
        cell.style.setProperty("width",Math.round(px)+"px","important");
        cell.style.setProperty("min-width",Math.round(px)+"px","important");
        cell.style.setProperty("max-width",Math.round(px)+"px","important");
      });
    });
    position(info);
  }

  function position(info){
    if(!info) info=get();
    if(!info) return;
    const wr=info.wrap.getBoundingClientRect();
    const height=Math.max(info.table.offsetHeight,info.wrap.clientHeight);
    info.wrap.querySelectorAll("."+HANDLE).forEach(h=>{
      const i=Number(h.dataset.index);
      const th=info.headers[i];
      if(!th) return;
      const tr=th.getBoundingClientRect();
      h.style.left=Math.round(tr.right-wr.left+info.wrap.scrollLeft)+"px";
      h.style.top=Math.round(info.table.offsetTop)+"px";
      h.style.height=Math.round(height)+"px";
    });
  }

  function makeHandle(info,i){
    const h=document.createElement("div");
    h.className=HANDLE;
    h.dataset.index=String(i);
    h.setAttribute("role","separator");
    h.setAttribute("aria-orientation","vertical");
    h.setAttribute("aria-label",(info.headers[i].textContent||("열 "+(i+1)))+" 너비 조절");

    h.addEventListener("pointerdown",event=>{
      if(event.button!==0) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const latest=get();
      if(!latest) return;
      let v=widths(latest);
      const index=Number(h.dataset.index);
      const startX=event.clientX;
      const startWidth=v[index];

      document.body.classList.add("qmes-sales-current-v3-dragging");
      h.classList.add("active");
      try{h.setPointerCapture(event.pointerId);}catch(_){}

      const move=e=>{
        e.preventDefault();
        const next=clamp(startWidth+(e.clientX-startX),MIN,MAX);
        v[index]=Math.round(next);
        save(v);
        apply(latest,v);
      };
      const stop=e=>{
        document.body.classList.remove("qmes-sales-current-v3-dragging");
        h.classList.remove("active");
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
      event.stopImmediatePropagation();
      try{localStorage.removeItem(KEY);}catch(_){}
      const latest=get();
      if(!latest) return;
      latest.table.style.removeProperty("width");
      latest.table.style.removeProperty("min-width");
      latest.table.style.removeProperty("max-width");
      latest.table.querySelectorAll("th,td").forEach(cell=>{
        cell.style.removeProperty("width");
        cell.style.removeProperty("min-width");
        cell.style.removeProperty("max-width");
      });
      latest.root.removeAttribute("data-qmes-layout-stable-ready");
      requestAnimationFrame(install);
    },true);

    return h;
  }

  function install(){
    addStyle();
    const info=get();
    if(!info) return;

    /* Remove stale resize handles from previous owners. */
    info.wrap.querySelectorAll(".qmes-sales-stable-resizer,.qmes-sales-fullheight-resizer").forEach(el=>el.remove());

    const expected=info.headers.length-1;
    let existing=[...info.wrap.querySelectorAll("."+HANDLE)];

    /* React can replace the table while keeping the same Sales root.
       Rebuild handles whenever count/table ownership no longer matches. */
    if(existing.length!==expected){
      existing.forEach(el=>el.remove());
      for(let i=0;i<expected;i++) info.wrap.appendChild(makeHandle(info,i));
    }

    apply(info,widths(info));
    position(info);
  }

  let frame=0;
  function schedule(){
    if(frame) return;
    frame=requestAnimationFrame(()=>{frame=0;install();});
  }

  function boot(){
    install();

    const observer=new MutationObserver(records=>{
      if(records.some(r=>r.addedNodes&&r.addedNodes.length)) schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("resize",schedule,{passive:true});
    window.addEventListener("qmes:navigate-tab",()=>setTimeout(schedule,0));
    window.addEventListener("qmes:erp-data-changed",()=>setTimeout(schedule,0));
    window.addEventListener("qmes:data-updated",()=>setTimeout(schedule,0));

    document.addEventListener("scroll",event=>{
      if(event.target instanceof Element && event.target.closest?.(".qmes-sales-ledger-v4 .qrl-wrap")) position();
    },true);

    [100,350,900,1800].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();