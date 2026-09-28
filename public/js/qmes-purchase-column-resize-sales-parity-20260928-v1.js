/* Purchase column resize = Sales/Delivery parity V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Adds the same left/right column drag behavior used by Sales/Delivery.
 * Does not change purchase data, filters, KPI, DB, save/edit/delete logic.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_COLUMN_RESIZE_SALES_PARITY_V1__) return;
  window.__QMES_PURCHASE_COLUMN_RESIZE_SALES_PARITY_V1__=true;

  const KEY="qmes-purchase-column-widths-v1";
  const HANDLE_CLASS="qmes-purchase-stable-resizer";
  const MIN=[42,88,115,128,160,74,48,92,92,92,92,74,74,86,74,70,80,80,80,90,110,110];
  const MAX=600;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function style(){
    if(document.getElementById("qmes-purchase-column-resize-sales-parity-v1-style")) return;
    const s=document.createElement("style");
    s.id="qmes-purchase-column-resize-sales-parity-v1-style";
    s.textContent=`
      .qmes-purchase-ledger-v1 .qpo-table-scroll{position:relative!important;}
      .qmes-purchase-ledger-v1 .${HANDLE_CLASS}{
        position:absolute!important;top:0!important;bottom:0!important;width:10px!important;margin-left:-5px!important;
        z-index:18!important;cursor:col-resize!important;touch-action:none!important;user-select:none!important;
        background:transparent!important;border:0!important;
      }
      .qmes-purchase-ledger-v1 .${HANDLE_CLASS}::after{
        content:""!important;position:absolute!important;top:0!important;bottom:0!important;left:4px!important;width:1px!important;
        background:transparent!important;pointer-events:none!important;
      }
      .qmes-purchase-ledger-v1 .${HANDLE_CLASS}:hover::after,
      body.qmes-purchase-stable-resizing .qmes-purchase-ledger-v1 .${HANDLE_CLASS}.active::after{
        background:rgba(46,105,145,.62)!important;
      }
      body.qmes-purchase-stable-resizing,
      body.qmes-purchase-stable-resizing *{cursor:col-resize!important;user-select:none!important;}
    `;
    document.head.appendChild(s);
  }

  function info(){
    const root=document.querySelector(".qmes-purchase-ledger-v1");
    const wrap=root&&root.querySelector(".qpo-table-scroll");
    const table=wrap&&wrap.querySelector(".qpo-table");
    const headers=table?[...table.querySelectorAll("thead th")]:[];
    if(!root||!wrap||!table||headers.length<2) return null;
    return {root,wrap,table,headers};
  }

  function read(){
    try{
      const v=JSON.parse(localStorage.getItem(KEY)||"null");
      return Array.isArray(v)?v.map(Number):null;
    }catch(_){return null;}
  }
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch(_){}}

  function natural(headers){
    return headers.map((th,i)=>clamp(Math.round(th.getBoundingClientRect().width)||MIN[i]||52,MIN[i]||52,MAX));
  }

  function normalized(headers){
    const v=read();
    if(!v||v.length!==headers.length||v.some(x=>!Number.isFinite(x)||x<=0)) return null;
    return v.map((x,i)=>clamp(x,MIN[i]||52,MAX));
  }

  function apply(i,widths){
    if(!i||!Array.isArray(widths)||widths.length!==i.headers.length) return;
    const w=widths.map((x,idx)=>clamp(Number(x)||MIN[idx]||52,MIN[idx]||52,MAX));
    const total=Math.round(w.reduce((a,b)=>a+b,0));
    i.table.style.setProperty("table-layout","fixed","important");
    i.table.style.setProperty("width",total+"px","important");
    i.table.style.setProperty("min-width",total+"px","important");
    i.table.style.setProperty("max-width","none","important");
    w.forEach((px,idx)=>{
      const th=i.headers[idx];
      th.style.setProperty("width",Math.round(px)+"px","important");
      th.style.setProperty("min-width",Math.round(px)+"px","important");
      th.style.setProperty("max-width",Math.round(px)+"px","important");
    });
  }

  function place(i){
    if(!i)return;
    i.wrap.querySelectorAll("."+HANDLE_CLASS).forEach(h=>{
      const idx=Number(h.dataset.index);
      const th=i.headers[idx];
      if(th)h.style.left=Math.round(th.offsetLeft+th.offsetWidth)+"px";
    });
  }

  function install(){
    style();
    const i=info(); if(!i)return false;

    const existing=i.wrap.querySelectorAll("."+HANDLE_CLASS);
    if(existing.length===i.headers.length-1){place(i);return true;}
    existing.forEach(x=>x.remove());

    const saved=normalized(i.headers);
    if(saved)apply(i,saved);

    for(let idx=0;idx<i.headers.length-1;idx++){
      const h=document.createElement("div");
      h.className=HANDLE_CLASS;
      h.dataset.index=String(idx);
      h.setAttribute("role","separator");
      h.setAttribute("aria-orientation","vertical");
      h.setAttribute("aria-label",(i.headers[idx].textContent||("열 "+(idx+1)))+" 너비 조절");
      i.wrap.appendChild(h);

      h.addEventListener("pointerdown",e=>{
        if(e.button!==0)return;
        e.preventDefault();e.stopPropagation();
        const cur=info(); if(!cur)return;
        let widths=normalized(cur.headers)||natural(cur.headers);
        const col=Number(h.dataset.index);
        const startX=e.clientX;
        const startW=widths[col];
        document.body.classList.add("qmes-purchase-stable-resizing");
        h.classList.add("active");
        h.setPointerCapture?.(e.pointerId);

        const move=ev=>{
          widths[col]=Math.round(clamp(startW+(ev.clientX-startX),MIN[col]||52,MAX));
          save(widths);
          apply(cur,widths);
          place(cur);
        };
        const stop=ev=>{
          document.body.classList.remove("qmes-purchase-stable-resizing");
          h.classList.remove("active");
          h.releasePointerCapture?.(ev.pointerId);
          window.removeEventListener("pointermove",move,true);
          window.removeEventListener("pointerup",stop,true);
          window.removeEventListener("pointercancel",stop,true);
        };
        window.addEventListener("pointermove",move,true);
        window.addEventListener("pointerup",stop,true);
        window.addEventListener("pointercancel",stop,true);
      });

      h.addEventListener("dblclick",e=>{
        e.preventDefault();e.stopPropagation();
        try{localStorage.removeItem(KEY);}catch(_){}
        const cur=info(); if(!cur)return;
        cur.table.style.removeProperty("width");
        cur.table.style.removeProperty("min-width");
        cur.table.style.removeProperty("max-width");
        cur.headers.forEach(th=>{
          th.style.removeProperty("width");
          th.style.removeProperty("min-width");
          th.style.removeProperty("max-width");
        });
        requestAnimationFrame(()=>place(cur));
      });
    }
    requestAnimationFrame(()=>place(info()));
    return true;
  }

  let frame=0;
  function schedule(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;install();});
  }

  function boot(){
    install();
    new MutationObserver(records=>{
      for(const r of records){
        for(const n of r.addedNodes||[]){
          if(!(n instanceof Element))continue;
          if(n.matches?.(".qmes-purchase-ledger-v1,.qpo-table,.qpo-table-scroll")||n.querySelector?.(".qmes-purchase-ledger-v1,.qpo-table,.qpo-table-scroll")){
            schedule();return;
          }
        }
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("qmes:navigate-tab",()=>setTimeout(schedule,0));
    window.addEventListener("resize",()=>setTimeout(()=>place(info()),120),{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();