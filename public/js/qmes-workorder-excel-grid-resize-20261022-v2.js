/* NAMO QMES Work Order Excel Grid Resize V2
 * 2026-10-22 / ADD-ONLY / #work scoped
 * Header separator only. Existing work-order data/actions are untouched.
 */
(function(){
  'use strict';
  if(window.__NAMO_WORKORDER_EXCEL_GRID_RESIZE_20261022_V2__) return;
  window.__NAMO_WORKORDER_EXCEL_GRID_RESIZE_20261022_V2__=true;

  const KEY='namo-work-grid-widths-20261022-v2';
  const HANDLE='namo-work-grid-resizer-20261022';
  const MIN=46, MAX=720;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function getInfo(){
    const root=document.getElementById('work');
    if(!root) return null;
    const wrap=root.querySelector('.module-body');
    const table=wrap?.querySelector('table.work-list-table');
    const headers=table?[...table.querySelectorAll('thead th')]:[];
    if(!wrap||!table||headers.length<2) return null;
    let group=table.querySelector('colgroup');
    if(!group){
      group=document.createElement('colgroup');
      headers.forEach(()=>group.appendChild(document.createElement('col')));
      table.insertBefore(group,table.firstChild);
    }
    while(group.children.length<headers.length) group.appendChild(document.createElement('col'));
    return {root,wrap,table,headers,cols:[...group.children].slice(0,headers.length)};
  }

  function labels(info){return info.headers.map(th=>(th.textContent||'').trim());}
  function natural(info){
    return info.headers.map((th,i)=>{
      const w=Math.round(th.getBoundingClientRect().width)||80;
      return clamp(w,i===0?34:MIN,MAX);
    });
  }
  function read(info){
    try{
      const data=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!data||!Array.isArray(data.widths)||JSON.stringify(data.labels)!==JSON.stringify(labels(info))) return null;
      return data.widths.map((w,i)=>clamp(Number(w)||80,i===0?34:MIN,MAX));
    }catch(_){return null;}
  }
  function save(info,widths){
    try{localStorage.setItem(KEY,JSON.stringify({labels:labels(info),widths:widths.map(Math.round)}));}catch(_){}
  }
  function apply(info,widths){
    if(!info||!Array.isArray(widths)||widths.length!==info.headers.length) return;
    const clean=widths.map((w,i)=>clamp(Number(w)||80,i===0?34:MIN,MAX));
    const total=clean.reduce((a,b)=>a+b,0);
    info.table.style.setProperty('table-layout','fixed','important');
    info.table.style.setProperty('width',total+'px','important');
    info.table.style.setProperty('min-width',total+'px','important');
    info.table.style.setProperty('max-width','none','important');
    clean.forEach((w,i)=>{
      if(info.cols[i]) info.cols[i].style.setProperty('width',Math.round(w)+'px','important');
    });
  }

  function install(){
    const info=getInfo(); if(!info) return false;
    const saved=read(info);
    if(saved) apply(info,saved);

    info.headers.forEach((th,index)=>{
      if(index===info.headers.length-1) return;
      if(th.querySelector('.'+HANDLE)) return;
      th.style.setProperty('position','relative','important');
      const h=document.createElement('span');
      h.className=HANDLE;
      h.setAttribute('role','separator');
      h.setAttribute('aria-orientation','vertical');
      h.setAttribute('aria-label',(th.textContent||('열 '+(index+1)))+' 열 너비 조절');
      h.title='좌우로 드래그하여 열 너비 조절';
      th.appendChild(h);

      h.addEventListener('pointerdown',e=>{
        if(e.button!==0) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const cur=getInfo(); if(!cur) return;
        let widths=read(cur)||natural(cur);
        apply(cur,widths);
        const startX=e.clientX, startWidth=widths[index];
        document.body.classList.add('namo-work-grid-resizing-20261022');
        h.classList.add('active');
        h.setPointerCapture?.(e.pointerId);

        const move=ev=>{
          if(ev.pointerId!==e.pointerId) return;
          widths[index]=clamp(startWidth+(ev.clientX-startX),index===0?34:MIN,MAX);
          apply(cur,widths);
        };
        const stop=ev=>{
          if(ev.pointerId!==e.pointerId) return;
          save(cur,widths);
          document.body.classList.remove('namo-work-grid-resizing-20261022');
          h.classList.remove('active');
          try{h.releasePointerCapture?.(e.pointerId);}catch(_){}
          window.removeEventListener('pointermove',move,true);
          window.removeEventListener('pointerup',stop,true);
          window.removeEventListener('pointercancel',stop,true);
        };
        window.addEventListener('pointermove',move,true);
        window.addEventListener('pointerup',stop,true);
        window.addEventListener('pointercancel',stop,true);
      },true);

      h.addEventListener('dblclick',e=>{
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        const cur=getInfo();if(!cur)return;
        const widths=natural(cur);
        save(cur,widths);apply(cur,widths);
      },true);
    });
    return true;
  }

  let queued=false;
  function ensure(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;install();});
  }
  const obs=new MutationObserver(ensure);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  ['qmes:navigate-tab','qmes:data-updated','qmes:erp-data-changed'].forEach(n=>window.addEventListener(n,ensure));
  document.addEventListener('click',e=>{if(e.target.closest('.sidebar .menu[data-page="work"]'))setTimeout(ensure,50);});
  [0,200,700,1500,3000].forEach(ms=>setTimeout(ensure,ms));
})();
