/* QMES Sales right-edge fit fix - 2026-09-21
 * ADD-ONLY correction patch.
 * Removes the fake header-edge fill and lets the real last "관리" column
 * absorb only the remaining free width, preventing overlap/gap at the right edge.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_RIGHT_EDGE_FIT_FIX_20260921__) return;
  window.__QMES_SALES_RIGHT_EDGE_FIT_FIX_20260921__=true;

  const WIDTH_KEY="qmes-sales-ledger-v4-column-widths-v1";

  function readWidths(){
    try{
      const v=JSON.parse(localStorage.getItem(WIDTH_KEY)||"null");
      return Array.isArray(v)?v.map(Number):null;
    }catch(_){return null;}
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-right-edge-fit-fix-20260921-style")) return;
    const style=document.createElement("style");
    style.id="qmes-sales-right-edge-fit-fix-20260921-style";
    style.textContent=`
      /* Cancel the earlier cosmetic background-fill workaround. */
      .qmes-sales-ledger-v4 .qrl-wrap{
        background:#fff!important;
        background-image:none!important;
      }

      .qmes-sales-ledger-v4 thead th:last-child{
        border-top-right-radius:8px!important;
        overflow:hidden!important;
      }

      .qmes-sales-ledger-v4 tbody td:last-child{
        overflow:hidden!important;
      }

      .qmes-sales-ledger-v4 .qrl-actions{
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
        flex-wrap:nowrap!important;
      }

      .qmes-sales-ledger-v4 .qrl-actions button{
        flex:0 0 auto!important;
      }
    `;
    document.head.appendChild(style);
  }

  function fit(){
    const root=document.querySelector(".qmes-sales-ledger-v4");
    const wrap=root&&root.querySelector(".qrl-wrap");
    const table=wrap&&wrap.querySelector("table");
    if(!wrap||!table) return;

    const headers=[...table.querySelectorAll("thead th")];
    if(!headers.length) return;

    const saved=readWidths();
    if(!saved||saved.length!==headers.length||saved.some(v=>!Number.isFinite(v)||v<=0)) return;

    const base=saved.map(v=>Math.max(18,Math.min(600,v)));
    const baseTotal=base.reduce((sum,v)=>sum+v,0);
    const available=Math.floor(wrap.clientWidth);

    const rendered=base.slice();
    if(available>baseTotal){
      rendered[rendered.length-1]+=available-baseTotal;
    }

    const total=rendered.reduce((sum,v)=>sum+v,0);
    table.style.setProperty("table-layout","fixed","important");
    table.style.setProperty("width",total+"px","important");
    table.style.setProperty("min-width",total+"px","important");
    table.style.setProperty("max-width","none","important");

    rendered.forEach((width,index)=>{
      table.querySelectorAll(`tr > *:nth-child(${index+1})`).forEach(cell=>{
        cell.style.setProperty("width",Math.round(width)+"px","important");
        cell.style.setProperty("min-width",Math.round(width)+"px","important");
        cell.style.setProperty("max-width",Math.round(width)+"px","important");
      });
    });
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      ensureStyle();
      fit();
    });
  }

  function boot(){
    ensureStyle();
    schedule();

    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.addedNodes&&m.addedNodes.length)) schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("resize",schedule);
    ["qmes:navigate-tab","qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(schedule,0)));

    [250,700,1400,3000,6000].forEach(ms=>setTimeout(schedule,ms));
    setInterval(schedule,1200);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();