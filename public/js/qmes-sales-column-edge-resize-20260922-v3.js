/* QMES Sales direct column-edge resize V3 - 2026-09-22
 * ADD-ONLY, sales table only.
 * Restores grabbing the header boundary itself and dragging left/right.
 * Does not alter sales data, calendar, filters, KPI, or other QMES screens.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COLUMN_EDGE_RESIZE_20260922_V3__) return;
  window.__QMES_SALES_COLUMN_EDGE_RESIZE_20260922_V3__=true;

  const KEY="qmes-sales-final-column-widths-20260922-v2";
  const MIN=[38,76,92,100,115,54,42,72,72,52,52,58,94,82,70,74,76,66,54,120,72];
  const MAX=520;
  const EDGE=10;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function read(){
    try{
      const v=JSON.parse(localStorage.getItem(KEY)||"null");
      return Array.isArray(v)?v:null;
    }catch(_){return null}
  }
  function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}}

  function info(){
    const root=document.querySelector(".qmes-sales-delivery-dashboard-v2");
    const table=root&&root.querySelector(".qsd-table");
    const shell=root&&root.querySelector(".qsd-table-shell");
    if(!table||!shell) return null;
    const headers=[...table.querySelectorAll("thead th")];
    if(headers.length!==21) return null;
    return {root,table,shell,headers};
  }

  function widthsOf(headers){
    return headers.map((th,i)=>clamp(Math.round(th.getBoundingClientRect().width),MIN[i]||44,MAX));
  }

  function apply(widths){
    const x=info();
    if(!x||!Array.isArray(widths)||widths.length!==21) return;
    const normalized=widths.map((w,i)=>clamp(Number(w)||MIN[i]||44,MIN[i]||44,MAX));
    const total=Math.round(normalized.reduce((a,b)=>a+b,0));

    x.shell.style.setProperty("overflow-x","auto","important");
    x.table.style.setProperty("table-layout","fixed","important");
    x.table.style.setProperty("width",total+"px","important");
    x.table.style.setProperty("min-width",total+"px","important");
    x.table.style.setProperty("max-width","none","important");

    normalized.forEach((w,i)=>{
      x.table.querySelectorAll("tr > *:nth-child("+(i+1)+")").forEach(cell=>{
        cell.style.setProperty("width",Math.round(w)+"px","important");
        cell.style.setProperty("min-width",Math.round(w)+"px","important");
        cell.style.setProperty("max-width",Math.round(w)+"px","important");
      });
    });
  }

  function edgeAt(event){
    const x=info();
    if(!x) return null;

    // Find the closest header boundary to the pointer, independent of child elements.
    let best=null;
    x.headers.forEach((th,index)=>{
      const r=th.getBoundingClientRect();
      if(event.clientY<r.top||event.clientY>r.bottom) return;
      const distance=Math.abs(event.clientX-r.right);
      if(distance<=EDGE && (!best||distance<best.distance)){
        best={x,index,th,distance};
      }
    });
    return best;
  }

  function startDrag(event,hit){
    if(!hit||event.button!==0) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const x=hit.x;
    let widths=read();
    if(!Array.isArray(widths)||widths.length!==21) widths=widthsOf(x.headers);

    const startX=event.clientX;
    const startWidth=widths[hit.index];

    document.body.classList.add("qmes-sales-column-resizing");

    const move=e=>{
      const next=clamp(startWidth+(e.clientX-startX),MIN[hit.index]||44,MAX);
      widths[hit.index]=Math.round(next);
      apply(widths);
    };

    const stop=()=>{
      document.body.classList.remove("qmes-sales-column-resizing");
      write(widths);
      window.removeEventListener("pointermove",move,true);
      window.removeEventListener("pointerup",stop,true);
      window.removeEventListener("pointercancel",stop,true);
    };

    window.addEventListener("pointermove",move,true);
    window.addEventListener("pointerup",stop,true);
    window.addEventListener("pointercancel",stop,true);
  }

  document.addEventListener("pointerdown",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target||!target.closest(".qmes-sales-delivery-dashboard-v2")) return;
    // Existing separator handles keep their own listener.
    if(target.closest(".qmes-sales-col-resizer")) return;
    const hit=edgeAt(event);
    if(hit) startDrag(event,hit);
  },true);

  document.addEventListener("pointermove",event=>{
    if(document.body.classList.contains("qmes-sales-column-resizing")) return;
    const target=event.target instanceof Element?event.target:null;
    if(!target||!target.closest(".qmes-sales-delivery-dashboard-v2")) return;
    const hit=edgeAt(event);
    const th=target.closest("th");
    if(th) th.style.cursor=hit?"col-resize":"";
  },true);

  function restoreSaved(){
    const saved=read();
    if(saved&&saved.length===21) apply(saved);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(restoreSaved,100),{once:true});
  else setTimeout(restoreSaved,100);
  ["qmes:navigate-tab","qmes:data-updated","qmes:erp-data-changed"].forEach(name=>
    window.addEventListener(name,()=>setTimeout(restoreSaved,50))
  );
})();