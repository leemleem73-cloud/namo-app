/* NAMO QMES - global desktop-style window manager + purchase safeguards
 * 2026-09-17
 * Additive UI patch only. Existing save/data/business logic is preserved.
 * Applies to dynamically opened QMES modal/popup/dialog windows:
 * - move by title/header
 * - resize from all four OUTER edges and four OUTER corners
 * - double-click title/header to maximize/restore
 */
(function(){
  'use strict';
  if(window.__QMES_GLOBAL_WINDOW_MANAGER_20260917__) return;
  window.__QMES_GLOBAL_WINDOW_MANAGER_20260917__=true;

  const STYLE_ID='qmes-global-window-manager-20260917-style';
  const MANAGED='qmesManagedWindow';
  const HANDLE='qmesDragHandle';
  const dirs=['n','s','e','w','ne','nw','se','sw'];
  const handlesByBox=new Map();
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  let queued=false;

  const BOX_SELECTOR=[
    '.qpx-form-card','.qpr-box','.modal-content','.modal-dialog','.qmes-modal-content','.qerp-modal-card','.qmes-dialog-card','.dialog-content',
    '[class*="modal-card"]','[class*="dialog-card"]','[class*="popup-card"]','[class*="modal__content"]','[class*="dialog__content"]','[class*="popup__content"]',
    '[class*="modal-panel"]','[class*="dialog-panel"]','[class*="popup-panel"]'
  ].join(',');
  const HEADER_SELECTOR=[
    '.qpx-modal-head','.qpr-head','.modal-header','.qmes-modal-header','.qerp-modal-head','.qmes-dialog-header',
    '[class*="modal-header"]','[class*="dialog-header"]','[class*="popup-header"]','[class*="modal__header"]','[class*="dialog__header"]','[class*="popup__header"]'
  ].join(',');

  function ensureStyle(){
    let s=document.getElementById(STYLE_ID);
    if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s);}
    s.textContent=`
/* Purchase registration stays visible on open. */
.qmes-purchase-live .qpx-form-card.qpdz-target-modal,
.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{
  position:fixed!important;left:50%!important;top:14px!important;right:auto!important;bottom:auto!important;
  transform:translateX(-50%)!important;width:min(1760px,92vw)!important;max-width:calc(100vw - 12px)!important;
  max-height:calc(100vh - 28px)!important;min-width:520px!important;min-height:300px!important;
  margin:0!important;padding:0 18px 0!important;overflow:auto!important;border:1px solid #d7e3ee!important;
  border-radius:12px!important;background:#fff!important;box-shadow:0 24px 70px rgba(10,35,58,.30)!important;
}
/* Purchase title must remain white. */
.qmes-purchase-live .qpx-form-card .qpx-modal-head{color:#fff!important;-webkit-text-fill-color:#fff!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head h1,
.qmes-purchase-live .qpx-form-card .qpx-modal-head h2,
.qmes-purchase-live .qpx-form-card .qpx-modal-head h3,
.qmes-purchase-live .qpx-form-card .qpx-modal-head h4,
.qmes-purchase-live .qpx-form-card .qpx-modal-head h1 *,
.qmes-purchase-live .qpx-form-card .qpx-modal-head h2 *,
.qmes-purchase-live .qpx-form-card .qpx-modal-head h3 *,
.qmes-purchase-live .qpx-form-card .qpx-modal-head h4 *{color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important}
#qmes-partner-register-modal-v2{z-index:2147483646!important}

/* All managed QMES windows: title/header moves the window. */
[data-qmes-drag-handle="1"]{cursor:move!important}
[data-qmes-drag-handle="1"] button,[data-qmes-drag-handle="1"] a,[data-qmes-drag-handle="1"] input,
[data-qmes-drag-handle="1"] select,[data-qmes-drag-handle="1"] textarea,[data-qmes-drag-handle="1"] label{cursor:pointer!important}
body.qmes-modal-dragging,body.qmes-modal-resizing,body.qmes-modal-dragging *,body.qmes-modal-resizing *{user-select:none!important}

/* Desktop-style OUTER resize hit areas. */
.qmes-window-resize-handle{position:fixed!important;background:transparent!important;touch-action:none!important;box-sizing:border-box!important}
.qmes-window-resize-handle[data-dir="n"],.qmes-window-resize-handle[data-dir="s"]{cursor:ns-resize!important}
.qmes-window-resize-handle[data-dir="e"],.qmes-window-resize-handle[data-dir="w"]{cursor:ew-resize!important}
.qmes-window-resize-handle[data-dir="ne"],.qmes-window-resize-handle[data-dir="sw"]{cursor:nesw-resize!important}
.qmes-window-resize-handle[data-dir="nw"],.qmes-window-resize-handle[data-dir="se"]{cursor:nwse-resize!important}
.qmes-window-resize-handle[data-dir="ne"]::after,.qmes-window-resize-handle[data-dir="nw"]::after,
.qmes-window-resize-handle[data-dir="se"]::after,.qmes-window-resize-handle[data-dir="sw"]::after{
  content:"";position:absolute;width:10px;height:10px;opacity:.42;pointer-events:none
}
.qmes-window-resize-handle[data-dir="se"]::after{right:2px;bottom:2px;border-right:2px solid #4d7898;border-bottom:2px solid #4d7898}
.qmes-window-resize-handle[data-dir="sw"]::after{left:2px;bottom:2px;border-left:2px solid #4d7898;border-bottom:2px solid #4d7898}
.qmes-window-resize-handle[data-dir="ne"]::after{right:2px;top:2px;border-right:2px solid #4d7898;border-top:2px solid #4d7898}
.qmes-window-resize-handle[data-dir="nw"]::after{left:2px;top:2px;border-left:2px solid #4d7898;border-top:2px solid #4d7898}
.qmes-window-resize-handle:hover::after{opacity:1!important;border-color:#0e75ba!important}

@media(max-width:850px){
  .qmes-purchase-live .qpx-form-card.qpdz-target-modal,
  .qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{width:96vw!important;top:8px!important;max-height:calc(100vh - 16px)!important;min-width:280px!important}
}
`;
  }

  function visible(el){
    if(!el||!el.isConnected) return false;
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0) return false;
    const r=el.getBoundingClientRect();
    return r.width>180&&r.height>90;
  }

  function isFullScreenLike(el){
    const r=el.getBoundingClientRect();
    return r.width>=window.innerWidth*.975&&r.height>=window.innerHeight*.975;
  }

  function panelFromDialog(dialog){
    if(!visible(dialog)) return null;
    if(!isFullScreenLike(dialog)) return dialog;
    const queue=[...dialog.children];
    let depth=0;
    while(queue.length&&depth<30){
      const el=queue.shift();depth++;
      if(!(el instanceof Element)||!visible(el)) continue;
      const r=el.getBoundingClientRect();
      if(r.width>=240&&r.height>=120&&r.width<window.innerWidth*.965&&r.height<window.innerHeight*.965) return el;
      queue.push(...el.children);
    }
    return null;
  }

  function looksLikeFloatingWindow(el){
    if(!visible(el)||isFullScreenLike(el)) return false;
    const r=el.getBoundingClientRect();
    if(r.width<220||r.height<100) return false;
    const cs=getComputedStyle(el);
    const key=((el.className&&String(el.className))||'')+' '+(el.id||'');
    const named=/modal|dialog|popup|window|sheet/i.test(key);
    const semantic=el.matches('[role="dialog"],[aria-modal="true"]');
    const floating=['fixed','absolute'].includes(cs.position);
    return semantic||named||(floating&&!!el.querySelector('h1,h2,h3,h4,h5,[class*="title"],[aria-label*="닫기"],button'));
  }

  function collectWindows(){
    const raw=new Set();
    document.querySelectorAll(BOX_SELECTOR).forEach(el=>{if(looksLikeFloatingWindow(el)) raw.add(el);});
    document.querySelectorAll('[role="dialog"],[aria-modal="true"]').forEach(dialog=>{
      const panel=panelFromDialog(dialog);if(panel&&looksLikeFloatingWindow(panel)) raw.add(panel);
    });
    document.querySelectorAll('[class*="modal"],[class*="dialog"],[class*="popup"],[class*="window"]').forEach(el=>{
      if(looksLikeFloatingWindow(el)) raw.add(el);
    });

    /* Prefer the innermost real panel, not its fullscreen/dimming wrapper. */
    const sorted=[...raw].sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      return ar.width*ar.height-br.width*br.height;
    });
    const chosen=[];
    sorted.forEach(el=>{
      if(chosen.some(inner=>el.contains(inner))) return;
      chosen.push(el);
    });
    return chosen;
  }

  function findHeader(box){
    let h=box.querySelector(HEADER_SELECTOR);
    if(h&&visible(h)){h.dataset.qmesDragHandle='1';return h;}

    const direct=[...box.children].slice(0,5);
    h=direct.find(el=>{
      if(!visible(el)) return false;
      const r=el.getBoundingClientRect();
      if(r.height<24||r.height>160) return false;
      return !!el.querySelector('h1,h2,h3,h4,h5,strong,[class*="title"],[aria-label*="닫기"],[aria-label*="close" i]');
    });
    if(h){h.dataset.qmesDragHandle='1';return h;}

    const title=box.querySelector('h1,h2,h3,h4,h5,[class*="title"]');
    if(title){
      let node=title.parentElement;
      const br=box.getBoundingClientRect();
      while(node&&node!==box){
        const r=node.getBoundingClientRect();
        if(r.top<=br.top+8&&r.height>=24&&r.height<=160){node.dataset.qmesDragHandle='1';return node;}
        node=node.parentElement;
      }
    }
    return null;
  }

  function effectiveZ(box){
    let z=1000,node=box;
    while(node&&node!==document.body){
      const n=parseInt(getComputedStyle(node).zIndex,10);if(Number.isFinite(n)) z=Math.max(z,n);
      node=node.parentElement;
    }
    return Math.min(2147483630,z+4);
  }

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

  function freezeBox(box){
    const r=box.getBoundingClientRect();
    box.style.setProperty('position','fixed','important');
    box.style.setProperty('left',Math.round(r.left)+'px','important');
    box.style.setProperty('top',Math.round(Math.max(0,r.top))+'px','important');
    box.style.setProperty('right','auto','important');
    box.style.setProperty('bottom','auto','important');
    box.style.setProperty('transform','none','important');
    box.style.setProperty('margin','0','important');
    box.style.setProperty('width',Math.round(r.width)+'px','important');
    box.style.setProperty('height',Math.round(r.height)+'px','important');
    box.style.setProperty('max-width','none','important');
    box.style.setProperty('max-height','none','important');
    box.style.setProperty('box-sizing','border-box','important');
    box.style.setProperty('overflow','auto','important');
    return box.getBoundingClientRect();
  }

  function createResizeHandle(box,dir){
    const h=document.createElement('div');
    h.className='qmes-window-resize-handle';h.dataset.dir=dir;h._qmesBox=box;h.title='창 크기 조절';
    document.body.appendChild(h);return h;
  }

  function ensureHandles(box){
    let map=handlesByBox.get(box);
    if(!map){map={};dirs.forEach(d=>map[d]=createResizeHandle(box,d));handlesByBox.set(box,map);}
    syncHandles(box,map);
  }

  function syncHandles(box,map){
    if(!visible(box)){Object.values(map).forEach(h=>h.style.display='none');return;}
    const r=box.getBoundingClientRect();
    const edge=12,corner=22,e2=edge/2,c2=corner/2,z=effectiveZ(box);
    const pos={
      n:[r.left+corner,r.top-e2,Math.max(0,r.width-corner*2),edge],
      s:[r.left+corner,r.bottom-e2,Math.max(0,r.width-corner*2),edge],
      w:[r.left-e2,r.top+corner,edge,Math.max(0,r.height-corner*2)],
      e:[r.right-e2,r.top+corner,edge,Math.max(0,r.height-corner*2)],
      nw:[r.left-c2,r.top-c2,corner,corner],ne:[r.right-c2,r.top-c2,corner,corner],
      sw:[r.left-c2,r.bottom-c2,corner,corner],se:[r.right-c2,r.bottom-c2,corner,corner]
    };
    Object.entries(map).forEach(([dir,h])=>{
      const [x,y,w,hh]=pos[dir];h.style.display='block';h.style.left=Math.round(x)+'px';h.style.top=Math.round(y)+'px';
      h.style.width=Math.round(w)+'px';h.style.height=Math.round(hh)+'px';h.style.zIndex=String(z);
    });
  }

  function cleanupHandles(){
    for(const [box,map] of handlesByBox){
      if(!box.isConnected||!visible(box)){Object.values(map).forEach(h=>h.remove());handlesByBox.delete(box);}
    }
  }

  function registerWindows(){
    collectWindows().forEach(box=>{
      box.dataset[MANAGED]='1';findHeader(box);ensureHandles(box);
    });
    cleanupHandles();
  }

  function interactive(el){return !!el.closest('button,a,input,select,textarea,label,[contenteditable="true"],[data-no-drag]');}

  function managedBoxFromTarget(target){
    return target&&target.closest('[data-qmes-managed-window="1"]');
  }

  function onMoveStart(event){
    if(event.button!==0) return;
    const t=event.target instanceof Element?event.target:null;
    if(!t||interactive(t)||t.closest('.qmes-window-resize-handle')) return;
    const handle=t.closest('[data-qmes-drag-handle="1"]');
    let box=handle&&managedBoxFromTarget(handle);
    if(!box){
      box=managedBoxFromTarget(t);if(!box) return;
      const r=box.getBoundingClientRect();
      if(event.clientY>r.top+54) return;
    }

    event.preventDefault();
    const r=freezeBox(box);box.dataset.qmesWindowMoved='1';delete box.dataset.qmesWindowMaximized;
    const sx=event.clientX,sy=event.clientY,sl=r.left,st=r.top;
    document.body.classList.add('qmes-modal-dragging');

    const move=e=>{
      const nr=box.getBoundingClientRect();
      const minLeft=Math.min(90-nr.width,0),maxLeft=Math.max(0,window.innerWidth-90),maxTop=Math.max(0,window.innerHeight-44);
      box.style.setProperty('left',Math.round(clamp(sl+e.clientX-sx,minLeft,maxLeft))+'px','important');
      box.style.setProperty('top',Math.round(clamp(st+e.clientY-sy,0,maxTop))+'px','important');
      const map=handlesByBox.get(box);if(map) syncHandles(box,map);
    };
    const end=()=>{
      document.body.classList.remove('qmes-modal-dragging');
      window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',end,true);window.removeEventListener('pointercancel',end,true);schedule();
    };
    window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);
  }

  function minimumSize(box){
    if(box.classList.contains('qpx-form-card')) return {w:520,h:300};
    const r=box.getBoundingClientRect();
    return {w:Math.min(360,Math.max(260,r.width*.42)),h:Math.min(240,Math.max(160,r.height*.35))};
  }

  function onResizeStart(event){
    const h=event.target instanceof Element?event.target.closest('.qmes-window-resize-handle'):null;
    if(!h||event.button!==0) return;
    const box=h._qmesBox,dir=h.dataset.dir||'se';if(!box||!box.isConnected) return;
    event.preventDefault();event.stopImmediatePropagation();

    const r=freezeBox(box),min=minimumSize(box),sx=event.clientX,sy=event.clientY;
    const start={l:r.left,t:r.top,w:r.width,h:r.height,right:r.right,bottom:r.bottom};
    box.dataset.qmesWindowResized='1';delete box.dataset.qmesWindowMaximized;
    document.body.classList.add('qmes-modal-resizing');

    const move=e=>{
      const dx=e.clientX-sx,dy=e.clientY-sy;let l=start.l,t=start.t,w=start.w,hh=start.h;
      if(dir.includes('e')) w=clamp(start.w+dx,min.w,Math.max(min.w,window.innerWidth-Math.max(0,start.l)-4));
      if(dir.includes('s')) hh=clamp(start.h+dy,min.h,Math.max(min.h,window.innerHeight-Math.max(0,start.t)-4));
      if(dir.includes('w')){l=clamp(start.l+dx,4,start.right-min.w);w=start.right-l;}
      if(dir.includes('n')){t=clamp(start.t+dy,4,start.bottom-min.h);hh=start.bottom-t;}
      box.style.setProperty('left',Math.round(l)+'px','important');box.style.setProperty('top',Math.round(t)+'px','important');
      box.style.setProperty('width',Math.round(w)+'px','important');box.style.setProperty('height',Math.round(hh)+'px','important');
      box.style.setProperty('max-width','none','important');box.style.setProperty('max-height','none','important');box.style.setProperty('transform','none','important');
      const map=handlesByBox.get(box);if(map) syncHandles(box,map);
    };
    const end=()=>{
      document.body.classList.remove('qmes-modal-resizing');
      window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',end,true);window.removeEventListener('pointercancel',end,true);schedule();
    };
    window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);
  }

  function onHeaderDoubleClick(event){
    const t=event.target instanceof Element?event.target:null;if(!t||interactive(t)) return;
    const handle=t.closest('[data-qmes-drag-handle="1"]');const box=handle&&managedBoxFromTarget(handle);if(!box) return;
    event.preventDefault();
    if(box.dataset.qmesWindowMaximized==='1'){
      try{
        const r=JSON.parse(box.dataset.qmesRestoreRect||'{}');
        if(Number.isFinite(r.l)) box.style.setProperty('left',r.l+'px','important');
        if(Number.isFinite(r.t)) box.style.setProperty('top',r.t+'px','important');
        if(Number.isFinite(r.w)) box.style.setProperty('width',r.w+'px','important');
        if(Number.isFinite(r.h)) box.style.setProperty('height',r.h+'px','important');
      }catch(_){}
      delete box.dataset.qmesWindowMaximized;
    }else{
      const r=freezeBox(box);box.dataset.qmesRestoreRect=JSON.stringify({l:r.left,t:r.top,w:r.width,h:r.height});box.dataset.qmesWindowMaximized='1';
      box.style.setProperty('left','6px','important');box.style.setProperty('top','6px','important');
      box.style.setProperty('width','calc(100vw - 12px)','important');box.style.setProperty('height','calc(100vh - 12px)','important');
      box.style.setProperty('max-width','none','important');box.style.setProperty('max-height','none','important');box.style.setProperty('transform','none','important');
    }
    const map=handlesByBox.get(box);if(map) requestAnimationFrame(()=>syncHandles(box,map));
  }

  function normalizePurchase(){
    const modal=[...document.querySelectorAll('.qmes-purchase-live .qpx-form-card')].find(el=>visible(el)&&/신규\s*구매\s*발주\s*등록/.test(clean(el.textContent)));
    if(!modal) return;
    const head=modal.querySelector('.qpx-modal-head');
    if(head){
      head.dataset.qmesDragHandle='1';
      const title=[...head.querySelectorAll('h1,h2,h3,h4')].find(el=>/신규\s*구매\s*발주\s*등록/.test(clean(el.textContent)));
      if(title){title.style.setProperty('color','#fff','important');title.style.setProperty('-webkit-text-fill-color','#fff','important');title.style.setProperty('opacity','1','important');}
    }
    if(!modal.dataset.qmesWindowMoved&&!modal.dataset.qmesWindowResized&&!modal.dataset.qmesWindowMaximized){
      modal.style.setProperty('top','14px','important');modal.style.setProperty('left','50%','important');modal.style.setProperty('right','auto','important');modal.style.setProperty('bottom','auto','important');modal.style.setProperty('transform','translateX(-50%)','important');
    }
  }

  function openSupplierRegister(){
    const fire=()=>{
      const proxy=document.createElement('button');proxy.type='button';proxy.textContent='공급업체 등록';proxy.tabIndex=-1;proxy.setAttribute('aria-hidden','true');
      proxy.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;';document.body.appendChild(proxy);proxy.click();proxy.remove();
    };
    fire();if(!document.getElementById('qmes-partner-register-modal-v2')) setTimeout(()=>{if(!document.getElementById('qmes-partner-register-modal-v2')) fire();},120);
  }

  function handlePurchaseClick(event){
    const t=event.target instanceof Element?event.target:null;
    const button=t&&t.closest('.qmes-purchase-live .qpdz-target-ui [data-action="new-supplier"]');if(!button) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openSupplierRegister();
  }

  function syncAllHandles(){for(const [box,map] of handlesByBox) syncHandles(box,map);}
  function apply(){queued=false;ensureStyle();normalizePurchase();registerWindows();syncAllHandles();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}

  function start(){
    apply();
    document.addEventListener('click',handlePurchaseClick,true);
    document.addEventListener('pointerdown',onResizeStart,true);
    document.addEventListener('pointerdown',onMoveStart,true);
    document.addEventListener('dblclick',onHeaderDoubleClick,true);
    window.addEventListener('resize',schedule);
    window.addEventListener('scroll',syncAllHandles,true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','role','aria-modal']});
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
