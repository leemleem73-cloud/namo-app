/* QMES Sales column resize restore V2 - 2026-09-22
 * ADD-ONLY.
 * - Drag a header separator left/right to shrink/enlarge that column.
 * - Widths are saved per browser.
 * - Double-click any separator to restore the approved fit-to-screen layout.
 * - Does not modify the sidebar or any other QMES screen.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COLUMN_RESIZE_RESTORE_20260922_V2__) return;
  window.__QMES_SALES_COLUMN_RESIZE_RESTORE_20260922_V2__=true;

  const KEY="qmes-sales-final-column-widths-20260922-v2";
  const HANDLE="qmes-sales-col-resizer";
  const MIN=[38,76,92,100,115,54,42,72,72,52,52,58,94,82,70,74,76,66,54,120,72];
  const MAX=520;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function read(){
    try{
      const v=JSON.parse(localStorage.getItem(KEY)||"null");
      return Array.isArray(v)?v:null;
    }catch(_){return null;}
  }

  function write(v){
    try{localStorage.setItem(KEY,JSON.stringify(v));}catch(_){}
  }

  function info(){
    const root=document.querySelector(".qmes-sales-delivery-dashboard-v2");
    const table=root?.querySelector(".qsd-table");
    const shell=root?.querySelector(".qsd-table-shell");
    if(!table||!shell) return null;
    const headers=[...table.querySelectorAll("thead th")];
    if(headers.length!==21) return null;
    return {root,table,shell,headers};
  }

  function clearInline(table){
    if(!table) return;
    ["width","min-width","max-width"].forEach(p=>table.style.removeProperty(p));
    table.querySelectorAll("th,td").forEach(cell=>{
      ["width","min-width","max-width"].forEach(p=>cell.style.removeProperty(p));
    });
  }

  function currentWidths(headers){
    return headers.map((th,i)=>{
      const w=Math.round(th.getBoundingClientRect().width);
      return clamp(w,MIN[i]||44,MAX);
    });
  }

  function applyWidths(widths){
    const x=info();
    if(!x||!Array.isArray(widths)||widths.length!==x.headers.length) return;

    const normalized=widths.map((w,i)=>clamp(Number(w)||MIN[i]||44,MIN[i]||44,MAX));
    const total=Math.round(normalized.reduce((a,b)=>a+b,0));

    x.table.style.setProperty("table-layout","fixed","important");
    x.table.style.setProperty("width",total+"px","important");
    x.table.style.setProperty("min-width",total+"px","important");
    x.table.style.setProperty("max-width","none","important");

    normalized.forEach((width,index)=>{
      x.table.querySelectorAll("tr > *:nth-child("+(index+1)+")").forEach(cell=>{
        cell.style.setProperty("width",Math.round(width)+"px","important");
        cell.style.setProperty("min-width",Math.round(width)+"px","important");
        cell.style.setProperty("max-width",Math.round(width)+"px","important");
      });
    });
  }

  function reset(){
    try{localStorage.removeItem(KEY);}catch(_){}
    const x=info();
    if(x) clearInline(x.table);
  }

  function install(){
    const x=info();
    if(!x) return;

    x.headers.forEach((th,index)=>{
      let handle=[...th.children].find(el=>el.classList?.contains(HANDLE));
      if(handle && handle.dataset.qmesResizeV2==="1") return;
      if(handle) handle.remove();

      handle=document.createElement("span");
      handle.dataset.qmesResizeV2="1";
      handle.className=HANDLE;
      handle.setAttribute("role","separator");
      handle.setAttribute("aria-orientation","vertical");
      handle.setAttribute("aria-label",(th.textContent||("열 "+(index+1)))+" 너비 조절");
      th.appendChild(handle);

      handle.addEventListener("pointerdown",event=>{
        if(event.button!==0) return;
        event.preventDefault();
        event.stopPropagation();

        const latest=info();
        if(!latest) return;

        let widths=read();
        if(!Array.isArray(widths)||widths.length!==latest.headers.length){
          widths=currentWidths(latest.headers);
        }

        const startX=event.clientX;
        const startWidth=widths[index];
        document.body.classList.add("qmes-sales-column-resizing");
        handle.classList.add("active");
        try{handle.setPointerCapture?.(event.pointerId);}catch(_){}

        const move=e=>{
          const next=clamp(startWidth+(e.clientX-startX),MIN[index]||44,MAX);
          widths[index]=Math.round(next);
          write(widths);
          applyWidths(widths);
        };

        const stop=e=>{
          document.body.classList.remove("qmes-sales-column-resizing");
          handle.classList.remove("active");
          try{handle.releasePointerCapture?.(event.pointerId);}catch(_){}
          window.removeEventListener("pointermove",move,true);
          window.removeEventListener("pointerup",stop,true);
          window.removeEventListener("pointercancel",stop,true);
        };

        window.addEventListener("pointermove",move,true);
        window.addEventListener("pointerup",stop,true);
        window.addEventListener("pointercancel",stop,true);
      });

      handle.addEventListener("click",event=>{
        if(event.detail!==1) return;
        event.preventDefault();
        event.stopPropagation();

        const latest=info();
        if(!latest) return;

        let widths=read();
        if(!Array.isArray(widths)||widths.length!==latest.headers.length){
          widths=currentWidths(latest.headers);
        }

        const delta=event.shiftKey?-12:12;
        widths[index]=Math.round(clamp((widths[index]||latest.headers[index].getBoundingClientRect().width)+delta,MIN[index]||44,MAX));
        write(widths);
        applyWidths(widths);
      });

      handle.addEventListener("dblclick",event=>{
        event.preventDefault();
        event.stopPropagation();
        reset();
      });
    });

    const saved=read();
    if(saved&&saved.length===x.headers.length) applyWidths(saved);
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      install();
    });
  }

  function boot(){
    install();

    const observer=new MutationObserver(records=>{
      if(records.some(r=>r.addedNodes&&r.addedNodes.length)) schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    ["qmes:navigate-tab","qmes:erp-data-changed","qmes:data-updated","qmes:erp-integrated-ready"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(schedule,0)));

    window.addEventListener("resize",()=>setTimeout(schedule,0),{passive:true});
    [200,600,1200,2500].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();