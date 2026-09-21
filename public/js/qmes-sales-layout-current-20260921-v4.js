/* QMES Sales layout CURRENT owner V4 - 2026-09-21
 * CURRENT Sales/Due screen only.
 * - Table always fills the usable width: no blank right-side area.
 * - Every vertical boundary is draggable through the full table body.
 * - Drag resizes adjacent columns while preserving the total table width.
 * - Column range: 18px ~ 600px.
 * - Uses a fixed compact row spacing; no row-spacing toggle is rendered.
 * - No legacy Sales UI restoration and no periodic screen replacement.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_LAYOUT_CURRENT_20260921_V4__) return;
  window.__QMES_SALES_LAYOUT_CURRENT_20260921_V4__=true;

  const KEY="qmes-sales-ledger-v4-column-widths-v4";
  const HANDLE="qmes-sales-v4-resizer";
  const STYLE_ID="qmes-sales-layout-current-20260921-v4-style";
  const MIN=18, MAX=600;
  const WEIGHTS=[4.5,8.5,11.5,13,17,7,5,8,7.5,7.5,7.5,8];

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function getInfo(){
    const root=document.querySelector(".qmes-sales-ledger-v4");
    const wrap=root?.querySelector(".qrl-wrap");
    const table=wrap?.querySelector("table");
    const headers=table?[...table.querySelectorAll("thead th")]:[];
    if(!root||!wrap||!table||headers.length!==12) return null;
    return {root,wrap,table,headers};
  }

  function readWidths(){
    try{
      const v=JSON.parse(localStorage.getItem(KEY)||"null");
      return Array.isArray(v)&&v.length===12&&v.every(x=>Number.isFinite(Number(x))&&Number(x)>0)
        ? v.map(Number):null;
    }catch(_){return null;}
  }

  function saveWidths(v){
    try{localStorage.setItem(KEY,JSON.stringify(v.map(x=>Math.round(x))));}catch(_){}
  }

  function distribute(target,source){
    target=Math.max(MIN*12,Math.floor(target||1200));
    const src=(source&&source.length===12?source:WEIGHTS).map(Number);
    const total=src.reduce((a,b)=>a+b,0)||1;
    let out=src.map(v=>clamp(target*(v/total),MIN,MAX));

    for(let pass=0;pass<8;pass++){
      const sum=out.reduce((a,b)=>a+b,0);
      const diff=target-sum;
      if(Math.abs(diff)<0.5) break;
      const indexes=[];
      for(let i=0;i<out.length;i++){
        if(diff>0 ? out[i]<MAX-.5 : out[i]>MIN+.5) indexes.push(i);
      }
      if(!indexes.length) break;
      const share=diff/indexes.length;
      indexes.forEach(i=>{out[i]=clamp(out[i]+share,MIN,MAX);});
    }

    out=out.map(x=>Math.round(x));
    let remainder=target-out.reduce((a,b)=>a+b,0);
    const order=[4,3,2,1,7,8,9,10,5,6,0,11];
    for(const i of order){
      if(!remainder) break;
      const next=clamp(out[i]+remainder,MIN,MAX);
      const used=next-out[i];
      out[i]=Math.round(next);
      remainder-=used;
    }
    return out;
  }

  function widthsFor(info){
    const available=Math.max(MIN*12,Math.floor(info.wrap.clientWidth||info.root.clientWidth||1200));
    const saved=readWidths();
    const result=saved ? distribute(available,saved) : distribute(available,WEIGHTS);
    saveWidths(result);
    return result;
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      .qmes-sales-ledger-v4 .qrl-wrap{
        position:relative!important;
        width:100%!important;
        max-width:100%!important;
        overflow-x:hidden!important;
      }
      .qmes-sales-ledger-v4 table,
      .qmes-sales-ledger-v4 th,
      .qmes-sales-ledger-v4 td{box-sizing:border-box!important}
      .qmes-sales-ledger-v4 th,
      .qmes-sales-ledger-v4 td{
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      .qmes-sales-ledger-v4 .qrl-actions{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:4px!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        overflow:hidden!important;
        flex-wrap:nowrap!important;
      }
      .qmes-sales-ledger-v4 .qrl-actions button{flex:0 0 auto!important}

      .qmes-sales-ledger-v4 .${HANDLE}{
        position:absolute!important;
        width:12px!important;
        margin-left:-6px!important;
        z-index:60!important;
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
      body.qmes-sales-v4-resizing .qmes-sales-ledger-v4 .${HANDLE}.active::after{
        width:2px!important;
        background:rgba(34,101,145,.72)!important;
      }
      body.qmes-sales-v4-resizing,
      body.qmes-sales-v4-resizing *{
        cursor:col-resize!important;
        user-select:none!important;
      }

      .qmes-sales-ledger-v4.qmes-sales-density-compact tbody td{
        height:31px!important;
        padding-top:3px!important;
        padding-bottom:3px!important;
      }
      .qmes-sales-ledger-v4.qmes-sales-density-compact .qrl-actions button{
        height:22px!important;
      }
      .qmes-sales-ledger-v4.qmes-sales-density-compact .qrl-badge{
        height:18px!important;
      }
    `;
    document.head.appendChild(s);
  }

  function apply(info,widths){
    if(!info||!Array.isArray(widths)||widths.length!==12) return;
    const total=widths.reduce((a,b)=>a+b,0);

    info.table.style.setProperty("table-layout","fixed","important");
    info.table.style.setProperty("width",total+"px","important");
    info.table.style.setProperty("min-width",total+"px","important");
    info.table.style.setProperty("max-width",total+"px","important");

    widths.forEach((px,i)=>{
      const n=Math.round(clamp(Number(px)||MIN,MIN,MAX));
      info.table.querySelectorAll("tr > *:nth-child("+(i+1)+")").forEach(cell=>{
        cell.style.setProperty("width",n+"px","important");
        cell.style.setProperty("min-width",n+"px","important");
        cell.style.setProperty("max-width",n+"px","important");
      });
    });
    position(info);
  }

  function position(info){
    info=info||getInfo();
    if(!info) return;
    const wr=info.wrap.getBoundingClientRect();
    const top=info.table.offsetTop;
    const height=info.table.offsetHeight;
    info.wrap.querySelectorAll("."+HANDLE).forEach(h=>{
      const i=Number(h.dataset.index);
      const th=info.headers[i];
      if(!th) return;
      const r=th.getBoundingClientRect();
      h.style.left=Math.round(r.right-wr.left+info.wrap.scrollLeft)+"px";
      h.style.top=Math.round(top)+"px";
      h.style.height=Math.round(height)+"px";
    });
  }

  function makeHandle(index){
    const h=document.createElement("div");
    h.className=HANDLE;
    h.dataset.index=String(index);
    h.setAttribute("role","separator");
    h.setAttribute("aria-orientation","vertical");
    h.setAttribute("aria-label","열 너비 조절");

    h.addEventListener("pointerdown",event=>{
      if(event.button!==0) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const info=getInfo();
      if(!info) return;
      const widths=widthsFor(info);
      const left=index,right=index+1;
      const startX=event.clientX;
      const left0=widths[left],right0=widths[right];

      document.body.classList.add("qmes-sales-v4-resizing");
      h.classList.add("active");
      try{h.setPointerCapture(event.pointerId);}catch(_){}

      const move=e=>{
        e.preventDefault();
        const raw=e.clientX-startX;
        const minDelta=Math.max(MIN-left0,right0-MAX);
        const maxDelta=Math.min(MAX-left0,right0-MIN);
        const delta=clamp(raw,minDelta,maxDelta);
        widths[left]=Math.round(left0+delta);
        widths[right]=Math.round(right0-delta);
        saveWidths(widths);
        apply(info,widths);
      };

      const stop=e=>{
        document.body.classList.remove("qmes-sales-v4-resizing");
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
      const info=getInfo();
      if(!info) return;
      const fresh=distribute(info.wrap.clientWidth,WEIGHTS);
      saveWidths(fresh);
      apply(info,fresh);
    },true);

    return h;
  }

  function handles(info){
    info.wrap.querySelectorAll(".qmes-sales-stable-resizer,.qmes-sales-fullheight-resizer,.qmes-sales-current-v3-resizer,.qmes-sales-col-resizer").forEach(el=>el.remove());
    let hs=[...info.wrap.querySelectorAll("."+HANDLE)];
    if(hs.length!==11){
      hs.forEach(el=>el.remove());
      for(let i=0;i<11;i++) info.wrap.appendChild(makeHandle(i));
    }
  }


  function install(){
    ensureStyle();
    const info=getInfo();
    if(!info) return;
    handles(info);
    apply(info,widthsFor(info));
    info.root.classList.add("qmes-sales-density-compact");
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;install();});
  }

  function boot(){
    install();

    const observer=new MutationObserver(records=>{
      let relevant=false;
      for(const record of records){
        for(const node of record.addedNodes||[]){
          if(!(node instanceof Element)) continue;
          if(node.matches?.(".qmes-sales-ledger-v4,.qrl-wrap,table,thead,tbody") ||
             node.querySelector?.(".qmes-sales-ledger-v4,.qrl-wrap,table")){
            relevant=true;break;
          }
        }
        if(relevant) break;
      }
      if(relevant) schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("resize",schedule,{passive:true});
    ["qmes:navigate-tab","qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(schedule,0)));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();