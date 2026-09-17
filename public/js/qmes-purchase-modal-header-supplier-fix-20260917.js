/* NAMO QMES - benchmark-style movable/resizable windows
 * 2026-09-17
 * Additive UI patch only. Existing save/data/business logic is preserved.
 * Window behavior follows common desktop/dialog patterns:
 * - drag by title/header
 * - resize from outer borders and all 4 corners
 * - double click title/header to maximize/restore
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__) return;
  window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__=true;

  const STYLE_ID='qmes-purchase-header-supplier-fix-20260917-style';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const handlesByBox=new Map();
  const DIRECTIONS=['n','s','e','w','ne','nw','se','sw'];
  let queued=false;

  function ensureStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
/* Purchase registration initial position. */
.qmes-purchase-live .qpx-form-card.qpdz-target-modal,
.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{
  position:fixed!important;
  left:50%!important;top:14px!important;right:auto!important;bottom:auto!important;
  transform:translateX(-50%)!important;
  width:min(1760px,92vw)!important;
  max-width:calc(100vw - 12px)!important;
  max-height:calc(100vh - 28px)!important;
  min-width:520px!important;min-height:300px!important;
  margin:0!important;padding:0 18px 0!important;overflow:auto!important;
  border:1px solid #d7e3ee!important;border-radius:12px!important;background:#fff!important;
  box-shadow:0 24px 70px rgba(10,35,58,.30)!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head{
  position:sticky!important;top:0!important;z-index:12!important;
  min-height:72px!important;box-sizing:border-box!important;
  margin:0 -18px 10px!important;padding:12px 18px 12px 20px!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;gap:22px!important;
  border-radius:12px 12px 0 0!important;background:linear-gradient(100deg,#0d6da9 0%,#0b79bc 54%,#0877b5 100%)!important;
  color:#fff!important;-webkit-text-fill-color:#fff!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-title-left{display:flex!important;align-items:center!important;gap:13px!important;min-width:0!important;flex:1 1 auto!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
.qmes-purchase-live .qpx-form-card .qpdz-title-left h3,
.qmes-purchase-live .qpx-form-card .qpdz-title-left h3 *{color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important}
.qmes-purchase-live .qpx-form-card .qpdz-cart{width:40px!important;height:40px!important;display:grid!important;place-items:center!important;flex:none!important;color:#d8efff!important;opacity:1!important;-webkit-text-fill-color:initial!important}
.qmes-purchase-live .qpx-form-card .qpdz-cart svg{width:31px!important;height:31px!important;display:block!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head h3{margin:0!important;color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important;font-size:20px!important;line-height:1.15!important;font-weight:950!important;letter-spacing:-.25px!important;text-shadow:0 1px 1px rgba(0,0,0,.12)!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head p{margin:4px 0 0!important;color:rgba(255,255,255,.96)!important;-webkit-text-fill-color:rgba(255,255,255,.96)!important;opacity:1!important;font-size:10px!important;font-weight:750!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-steps{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:0!important;flex:0 0 auto!important;flex-wrap:nowrap!important;margin-left:auto!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step{display:inline-flex!important;align-items:center!important;gap:6px!important;color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important;font-size:10px!important;font-weight:850!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step b{width:25px!important;height:25px!important;margin:0!important;border:1px solid rgba(255,255,255,.72)!important;border-radius:50%!important;background:transparent!important;color:#fff!important;-webkit-text-fill-color:#fff!important;display:grid!important;place-items:center!important;font-size:10px!important;font-weight:950!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step:first-child b{background:#fff!important;color:#1179ba!important;-webkit-text-fill-color:#1179ba!important;border-color:#fff!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step:not(:last-of-type)::after{content:""!important;width:34px!important;height:1px!important;background:rgba(255,255,255,.48)!important;display:block!important;margin:0 10px!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-close{width:36px!important;height:36px!important;margin-left:18px!important;padding:0!important;flex:none!important;border:1px solid rgba(255,255,255,.72)!important;border-radius:7px!important;background:#fff!important;color:#244763!important;-webkit-text-fill-color:#244763!important;font-size:21px!important;font-weight:800!important;line-height:1!important}
.qmes-purchase-live .qpx-form-card .qpdz-basic-grid{grid-template-columns:1.08fr 1.08fr 1fr 1.48fr 1fr!important;gap:10px 18px!important}
#qmes-partner-register-modal-v2{z-index:2147483646!important}

/* Global title-bar behavior. */
.qpx-modal-head,.qpr-head,.modal-header,.qmes-modal-header,.qerp-modal-head,.qmes-dialog-header,[data-qmes-drag-handle="1"]{cursor:move!important}
.qpx-modal-head button,.qpr-head button,.modal-header button,.qmes-modal-header button,.qerp-modal-head button,.qmes-dialog-header button,[data-qmes-drag-handle="1"] button,[data-qmes-drag-handle="1"] input,[data-qmes-drag-handle="1"] select,[data-qmes-drag-handle="1"] textarea,[data-qmes-drag-handle="1"] a{cursor:pointer!important}
body.qmes-modal-dragging,body.qmes-modal-resizing,body.qmes-modal-dragging *,body.qmes-modal-resizing *{user-select:none!important}

/* Benchmark-style resize hit areas are centered on the OUTER window border, not inside content. */
.qmes-window-resize-handle{position:fixed!important;background:transparent!important;touch-action:none!important;box-sizing:border-box!important}
.qmes-window-resize-handle[data-dir="n"],.qmes-window-resize-handle[data-dir="s"]{cursor:ns-resize!important}
.qmes-window-resize-handle[data-dir="e"],.qmes-window-resize-handle[data-dir="w"]{cursor:ew-resize!important}
.qmes-window-resize-handle[data-dir="ne"],.qmes-window-resize-handle[data-dir="sw"]{cursor:nesw-resize!important}
.qmes-window-resize-handle[data-dir="nw"],.qmes-window-resize-handle[data-dir="se"]{cursor:nwse-resize!important}
.qmes-window-resize-handle[data-dir="ne"]::after,
.qmes-window-resize-handle[data-dir="nw"]::after,
.qmes-window-resize-handle[data-dir="se"]::after,
.qmes-window-resize-handle[data-dir="sw"]::after{
  content:"";position:absolute;width:9px;height:9px;opacity:.38;pointer-events:none;
}
.qmes-window-resize-handle[data-dir="se"]::after{right:2px;bottom:2px;border-right:2px solid #4d7898;border-bottom:2px solid #4d7898}
.qmes-window-resize-handle[data-dir="sw"]::after{left:2px;bottom:2px;border-left:2px solid #4d7898;border-bottom:2px solid #4d7898}
.qmes-window-resize-handle[data-dir="ne"]::after{right:2px;top:2px;border-right:2px solid #4d7898;border-top:2px solid #4d7898}
.qmes-window-resize-handle[data-dir="nw"]::after{left:2px;top:2px;border-left:2px solid #4d7898;border-top:2px solid #4d7898}
.qmes-window-resize-handle:hover::after{opacity:.95!important;border-color:#0e75ba!important}

@media(max-width:1200px){
  .qmes-purchase-live .qpx-form-card .qpx-modal-head p{display:none!important}
  .qmes-purchase-live .qpx-form-card .qpdz-basic-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}
@media(max-width:850px){
  .qmes-purchase-live .qpx-form-card.qpdz-target-modal,.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{width:96vw!important;top:8px!important;max-height:calc(100vh - 16px)!important;min-width:280px!important}
  .qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-steps .qpx-step{display:none!important}
  .qmes-purchase-live .qpx-form-card .qpdz-basic-grid,.qmes-purchase-live .qpx-form-card .qpdz-quality-grid{grid-template-columns:1fr!important}
}
`;
  }

  function visible(el){
    if(!el||!el.isConnected) return false;
    const s=getComputedStyle(el);
    if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0) return false;
    const r=el.getBoundingClientRect();
    return r.width>120&&r.height>70;
  }

  function findPurchaseModal(){
    const cards=[...document.querySelectorAll('.qmes-purchase-live .qpx-form-card')].filter(visible);
    return cards.find(card=>/신규\s*구매\s*발주\s*등록/.test(clean(card.textContent)))||cards[0]||null;
  }

  function normalizePurchaseHeader(){
    const modal=findPurchaseModal();
    if(!modal) return;
    const head=modal.querySelector('.qpx-modal-head');
    if(!head) return;
    head.dataset.qmesDragHandle='1';

    const first=head.firstElementChild;
    if(first){
      first.classList.add('qpdz-title-left');
      const h=first.querySelector('h3');
      if(h){
        h.textContent='신규 구매 발주 등록';
        h.style.setProperty('color','#fff','important');
        h.style.setProperty('-webkit-text-fill-color','#fff','important');
        h.style.setProperty('opacity','1','important');
      }
      const p=first.querySelector('p');
      if(p) p.textContent='MRP·작업지시·협력사·IQC를 하나의 발주번호로 연결합니다.';
      if(!first.querySelector('.qpdz-cart')) first.insertAdjacentHTML('afterbegin','<span class="qpdz-cart" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M3 5h4l3.2 14.2h13.9l3-10.2H9"/><circle cx="13" cy="25.5" r="1.7"/><circle cx="23" cy="25.5" r="1.7"/></svg></span>');
    }

    const steps=[...head.querySelectorAll('.qpx-step')];
    ['기본정보','품목등록','품질요구사항','결재상신'].forEach((label,i)=>{
      const step=steps[i]; if(!step) return;
      let b=step.querySelector('b');
      if(!b){b=document.createElement('b');step.insertBefore(b,step.firstChild);}
      b.textContent=String(i+1);
      [...step.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());
      step.appendChild(document.createTextNode(label));
    });

    if(!modal.dataset.qmesWindowMoved&&!modal.dataset.qmesWindowResized&&!modal.dataset.qmesWindowMaximized){
      modal.style.setProperty('top','14px','important');
      modal.style.setProperty('left','50%','important');
      modal.style.setProperty('right','auto','important');
      modal.style.setProperty('bottom','auto','important');
      modal.style.setProperty('transform','translateX(-50%)','important');
      modal.style.setProperty('max-height','calc(100vh - 28px)','important');
    }
  }

  function openSupplierRegister(){
    const fire=()=>{
      const proxy=document.createElement('button');
      proxy.type='button';proxy.textContent='공급업체 등록';proxy.tabIndex=-1;proxy.setAttribute('aria-hidden','true');
      proxy.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(proxy);
      try{proxy.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'mouse'}));}catch(_){}
      if(!document.getElementById('qmes-partner-register-modal-v2')) proxy.click();
      proxy.remove();
    };
    fire();
    if(!document.getElementById('qmes-partner-register-modal-v2')) setTimeout(()=>{if(!document.getElementById('qmes-partner-register-modal-v2')) fire();},120);
  }

  function handlePurchaseClick(event){
    const t=event.target instanceof Element?event.target:null;
    const button=t&&t.closest('.qmes-purchase-live .qpdz-target-ui [data-action="new-supplier"]');
    if(!button) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openSupplierRegister();
  }

  const KNOWN_BOXES='.qpx-form-card,.qpr-box,.modal-content,.qmes-modal-content,.qerp-modal-card,.qmes-dialog-card,.dialog-content,[class*="modal-card"],[class*="dialog-card"],[class*="popup-card"]';
  const KNOWN_HEADERS='.qpx-modal-head,.qpr-head,.modal-header,.qmes-modal-header,.qerp-modal-head,.qmes-dialog-header,[class*="modal-header"],[class*="dialog-header"],[class*="popup-header"]';

  function boxFromRoleDialog(dialog){
    if(!visible(dialog)) return null;
    const r=dialog.getBoundingClientRect();
    if(r.width<window.innerWidth*.97&&r.height<window.innerHeight*.97) return dialog;
    const children=[...dialog.children].filter(visible);
    return children.find(ch=>{
      const cr=ch.getBoundingClientRect();
      return cr.width>220&&cr.height>100&&cr.width<window.innerWidth*.97&&cr.height<window.innerHeight*.97;
    })||null;
  }

  function collectWindows(){
    const set=new Set();
    document.querySelectorAll(KNOWN_BOXES).forEach(el=>{if(visible(el)) set.add(el);});
    document.querySelectorAll('[role="dialog"],[aria-modal="true"]').forEach(dialog=>{
      const box=boxFromRoleDialog(dialog);if(box) set.add(box);
    });
    document.querySelectorAll('[class*="modal"],[class*="dialog"],[class*="popup"]').forEach(el=>{
      if(!visible(el)) return;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      if(!['fixed','absolute'].includes(s.position)) return;
      if(r.width<220||r.height<100||r.width>=window.innerWidth*.98||r.height>=window.innerHeight*.98) return;
      set.add(el);
    });
    return [...set].filter(box=>{
      const r=box.getBoundingClientRect();
      return r.width>=220&&r.height>=100&&!(r.width>=window.innerWidth*.995&&r.height>=window.innerHeight*.995);
    });
  }

  function findHeader(box){
    const known=box.querySelector(KNOWN_HEADERS);
    if(known){known.dataset.qmesDragHandle='1';return known;}
    const first=box.firstElementChild;
    if(first){
      const title=first.querySelector('h1,h2,h3,h4,h5,strong,[class*="title"]');
      const close=first.querySelector('button,[aria-label*="닫기"],[aria-label*="close" i]');
      const fr=first.getBoundingClientRect();
      if((title||close)&&fr.height>24&&fr.height<150){first.dataset.qmesDragHandle='1';return first;}
    }
    return null;
  }

  function effectiveZ(box){
    let z=1000,node=box;
    while(node&&node!==document.body){
      const n=parseInt(getComputedStyle(node).zIndex,10);
      if(Number.isFinite(n)) z=Math.max(z,n);
      node=node.parentElement;
    }
    return Math.min(2147483640,z+3);
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

  function createHandle(box,dir){
    const h=document.createElement('div');
    h.className='qmes-window-resize-handle';
    h.dataset.dir=dir;
    h._qmesResizeBox=box;
    h.title='창 크기 조절';
    document.body.appendChild(h);
    return h;
  }

  function ensureHandles(box){
    let map=handlesByBox.get(box);
    if(!map){
      map={};
      DIRECTIONS.forEach(dir=>map[dir]=createHandle(box,dir));
      handlesByBox.set(box,map);
    }
    syncHandles(box,map);
  }

  function syncHandles(box,map){
    if(!visible(box)){
      Object.values(map).forEach(h=>h.style.display='none');
      return;
    }
    const r=box.getBoundingClientRect();
    const t=10,c=18,halfT=t/2,halfC=c/2,z=effectiveZ(box);
    const edgeW=Math.max(0,r.width-c*2),edgeH=Math.max(0,r.height-c*2);
    const pos={
      n:[r.left+c,r.top-halfT,edgeW,t],s:[r.left+c,r.bottom-halfT,edgeW,t],
      w:[r.left-halfT,r.top+c,t,edgeH],e:[r.right-halfT,r.top+c,t,edgeH],
      nw:[r.left-halfC,r.top-halfC,c,c],ne:[r.right-halfC,r.top-halfC,c,c],
      sw:[r.left-halfC,r.bottom-halfC,c,c],se:[r.right-halfC,r.bottom-halfC,c,c]
    };
    Object.entries(map).forEach(([dir,h])=>{
      const [x,y,w,hh]=pos[dir];
      h.style.display='block';
      h.style.left=Math.round(x)+'px';h.style.top=Math.round(y)+'px';h.style.width=Math.round(w)+'px';h.style.height=Math.round(hh)+'px';h.style.zIndex=String(z);
    });
  }

  function cleanupHandles(){
    for(const [box,map] of handlesByBox){
      if(!box.isConnected||!visible(box)){
        Object.values(map).forEach(h=>h.remove());
        handlesByBox.delete(box);
      }
    }
  }

  function registerWindows(){
    collectWindows().forEach(box=>{
      box.dataset.qmesManagedWindow='1';
      findHeader(box);
      ensureHandles(box);
    });
    cleanupHandles();
  }

  function interactive(el){return !!el.closest('button,a,input,select,textarea,label,[contenteditable="true"],[data-no-drag]');}

  function onMoveStart(event){
    if(event.button!==0) return;
    const t=event.target instanceof Element?event.target:null;
    if(!t||interactive(t)||t.closest('.qmes-window-resize-handle')) return;
    const handle=t.closest('[data-qmes-drag-handle="1"]');
    const box=handle&&handle.closest('[data-qmes-managed-window="1"]');
    if(!box) return;

    event.preventDefault();
    const r=freezeBox(box);
    box.dataset.qmesWindowMoved='1';delete box.dataset.qmesWindowMaximized;
    const sx=event.clientX,sy=event.clientY,sl=r.left,st=r.top;
    document.body.classList.add('qmes-modal-dragging');

    const move=e=>{
      const nr=box.getBoundingClientRect();
      const minLeft=Math.min(80-nr.width,0),maxLeft=Math.max(0,window.innerWidth-80);
      const maxTop=Math.max(0,window.innerHeight-44);
      box.style.setProperty('left',Math.round(clamp(sl+e.clientX-sx,minLeft,maxLeft))+'px','important');
      box.style.setProperty('top',Math.round(clamp(st+e.clientY-sy,0,maxTop))+'px','important');
      const map=handlesByBox.get(box);if(map) syncHandles(box,map);
    };
    const end=()=>{
      document.body.classList.remove('qmes-modal-dragging');
      window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',end,true);window.removeEventListener('pointercancel',end,true);
      schedule();
    };
    window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);
  }

  function minSize(box){
    return box.classList.contains('qpx-form-card')?{w:520,h:300}:{w:300,h:180};
  }

  function onResizeStart(event){
    const h=event.target instanceof Element?event.target.closest('.qmes-window-resize-handle'):null;
    if(!h||event.button!==0) return;
    const box=h._qmesResizeBox,dir=h.dataset.dir||'se';
    if(!box||!box.isConnected) return;

    event.preventDefault();event.stopPropagation();
    const r=freezeBox(box),mins=minSize(box);
    box.dataset.qmesWindowResized='1';delete box.dataset.qmesWindowMaximized;
    const sx=event.clientX,sy=event.clientY;
    const start={l:r.left,t:r.top,w:r.width,h:r.height,right:r.right,bottom:r.bottom};
    document.body.classList.add('qmes-modal-resizing');

    const move=e=>{
      const dx=e.clientX-sx,dy=e.clientY-sy;
      let l=start.l,t=start.t,w=start.w,hh=start.h;

      if(dir.includes('e')) w=clamp(start.w+dx,mins.w,window.innerWidth-Math.max(0,start.l)-4);
      if(dir.includes('s')) hh=clamp(start.h+dy,mins.h,window.innerHeight-Math.max(0,start.t)-4);
      if(dir.includes('w')){
        const maxL=start.right-mins.w;
        l=clamp(start.l+dx,4,maxL);
        w=start.right-l;
      }
      if(dir.includes('n')){
        const maxT=start.bottom-mins.h;
        t=clamp(start.t+dy,4,maxT);
        hh=start.bottom-t;
      }

      box.style.setProperty('left',Math.round(l)+'px','important');
      box.style.setProperty('top',Math.round(t)+'px','important');
      box.style.setProperty('width',Math.round(w)+'px','important');
      box.style.setProperty('height',Math.round(hh)+'px','important');
      box.style.setProperty('max-width','none','important');
      box.style.setProperty('max-height','none','important');
      box.style.setProperty('transform','none','important');
      const map=handlesByBox.get(box);if(map) syncHandles(box,map);
    };
    const end=()=>{
      document.body.classList.remove('qmes-modal-resizing');
      window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',end,true);window.removeEventListener('pointercancel',end,true);
      schedule();
    };
    window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);
  }

  function onHeaderDoubleClick(event){
    const t=event.target instanceof Element?event.target:null;
    if(!t||interactive(t)) return;
    const handle=t.closest('[data-qmes-drag-handle="1"]');
    const box=handle&&handle.closest('[data-qmes-managed-window="1"]');
    if(!box) return;
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
      const r=freezeBox(box);
      box.dataset.qmesRestoreRect=JSON.stringify({l:r.left,t:r.top,w:r.width,h:r.height});
      box.dataset.qmesWindowMaximized='1';
      box.style.setProperty('left','6px','important');
      box.style.setProperty('top','6px','important');
      box.style.setProperty('width','calc(100vw - 12px)','important');
      box.style.setProperty('height','calc(100vh - 12px)','important');
      box.style.setProperty('max-width','none','important');
      box.style.setProperty('max-height','none','important');
      box.style.setProperty('transform','none','important');
    }
    const map=handlesByBox.get(box);if(map) requestAnimationFrame(()=>syncHandles(box,map));
  }

  function syncAllHandles(){for(const [box,map] of handlesByBox) syncHandles(box,map);}

  function apply(){queued=false;ensureStyle();normalizePurchaseHeader();registerWindows();syncAllHandles();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}

  function start(){
    apply();
    document.addEventListener('click',handlePurchaseClick,true);
    document.addEventListener('pointerdown',onResizeStart,true);
    document.addEventListener('pointerdown',onMoveStart,true);
    document.addEventListener('dblclick',onHeaderDoubleClick,true);
    window.addEventListener('resize',schedule);
    window.addEventListener('scroll',syncAllHandles,true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
