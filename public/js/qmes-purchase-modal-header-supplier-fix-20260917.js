/* NAMO QMES - purchase modal top-position fix + supplier bridge + global dialog dragging
 * 2026-09-17
 * Additive-only patch. Existing data/save logic is preserved.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__) return;
  window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__=true;

  const STYLE_ID='qmes-purchase-header-supplier-fix-20260917-style';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  let queued=false;

  function ensureStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=`
/* Purchase modal must always open inside the viewport. */
.qmes-purchase-live .qpx-form-card.qpdz-target-modal,
.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{
  position:fixed!important;
  left:50%!important;
  top:14px!important;
  right:auto!important;
  bottom:auto!important;
  transform:translateX(-50%)!important;
  width:min(1760px,92vw)!important;
  max-width:none!important;
  max-height:calc(100vh - 28px)!important;
  margin:0!important;
  padding:0 18px 0!important;
  overflow:auto!important;
  border:1px solid #d7e3ee!important;
  border-radius:12px!important;
  background:#fff!important;
  box-shadow:0 24px 70px rgba(10,35,58,.30)!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head{
  position:sticky!important;top:0!important;z-index:12!important;
  min-height:72px!important;box-sizing:border-box!important;
  margin:0 -18px 10px!important;padding:12px 18px 12px 20px!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;gap:22px!important;
  border-radius:12px 12px 0 0!important;
  background:linear-gradient(100deg,#0d6da9 0%,#0b79bc 54%,#0877b5 100%)!important;
  color:#fff!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-title-left{display:flex!important;align-items:center!important;gap:13px!important;min-width:0!important;flex:1 1 auto!important}
.qmes-purchase-live .qpx-form-card .qpdz-cart{width:40px!important;height:40px!important;display:grid!important;place-items:center!important;flex:none!important;color:#d8efff!important;opacity:1!important}
.qmes-purchase-live .qpx-form-card .qpdz-cart svg{width:31px!important;height:31px!important;display:block!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head h3{margin:0!important;color:#fff!important;opacity:1!important;font-size:20px!important;line-height:1.15!important;font-weight:950!important;letter-spacing:-.25px!important;text-shadow:0 1px 1px rgba(0,0,0,.12)!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head p{margin:4px 0 0!important;color:rgba(255,255,255,.96)!important;opacity:1!important;font-size:10px!important;line-height:1.25!important;font-weight:750!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-steps{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:0!important;flex:0 0 auto!important;flex-wrap:nowrap!important;margin-left:auto!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step{display:inline-flex!important;align-items:center!important;gap:6px!important;color:#fff!important;opacity:1!important;font-size:10px!important;font-weight:850!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step b{width:25px!important;height:25px!important;margin:0!important;border:1px solid rgba(255,255,255,.72)!important;border-radius:50%!important;background:transparent!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:10px!important;font-weight:950!important;box-shadow:none!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step:first-child b{background:#fff!important;color:#1179ba!important;border-color:#fff!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step:not(:last-of-type)::after{content:""!important;width:34px!important;height:1px!important;background:rgba(255,255,255,.48)!important;display:block!important;margin:0 10px!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-close{width:36px!important;height:36px!important;margin-left:18px!important;padding:0!important;flex:none!important;border:1px solid rgba(255,255,255,.72)!important;border-radius:7px!important;background:#fff!important;color:#244763!important;font-size:21px!important;font-weight:800!important;line-height:1!important;box-shadow:0 1px 2px rgba(0,0,0,.06)!important}
.qmes-purchase-live .qpx-form-card .qpdz-basic-grid{grid-template-columns:1.08fr 1.08fr 1fr 1.48fr 1fr!important;gap:10px 18px!important}
.qmes-purchase-live .qpx-form-card .qpdz-section-head{height:39px!important}
.qmes-purchase-live .qpx-form-card .qpdz-footer{z-index:11!important}
#qmes-partner-register-modal-v2{z-index:2147483646!important}

/* Every QMES dialog with a title/header can be moved with the mouse. */
.qpx-modal-head,.qpr-head,.modal-header,.qmes-modal-header,.qerp-modal-head,.qmes-dialog-header,
[role="dialog"]>div:first-child{cursor:move}
.qpx-modal-head button,.qpr-head button,.modal-header button,.qmes-modal-header button,.qerp-modal-head button,.qmes-dialog-header button,
[role="dialog"]>div:first-child button,
[role="dialog"]>div:first-child input,
[role="dialog"]>div:first-child select,
[role="dialog"]>div:first-child textarea,
[role="dialog"]>div:first-child a{cursor:pointer}
body.qmes-modal-dragging,body.qmes-modal-dragging *{user-select:none!important}

@media(max-width:1500px){
  .qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step:not(:last-of-type)::after{width:20px!important;margin:0 7px!important}
  .qmes-purchase-live .qpx-form-card .qpdz-basic-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:10px 12px!important}
}
@media(max-width:1200px){
  .qmes-purchase-live .qpx-form-card .qpx-modal-head p{display:none!important}
  .qmes-purchase-live .qpx-form-card .qpdz-basic-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
  .qmes-purchase-live .qpx-form-card .qpdz-quality-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:850px){
  .qmes-purchase-live .qpx-form-card.qpdz-target-modal,.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{width:96vw!important;top:8px!important;max-height:calc(100vh - 16px)!important}
  .qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-steps .qpx-step{display:none!important}
  .qmes-purchase-live .qpx-form-card .qpx-modal-close{margin-left:0!important}
  .qmes-purchase-live .qpx-form-card .qpdz-basic-grid,.qmes-purchase-live .qpx-form-card .qpdz-quality-grid{grid-template-columns:1fr!important}
}
`;
  }

  function findPurchaseModal(){
    const cards=[...document.querySelectorAll('.qmes-purchase-live .qpx-form-card')];
    return cards.find(card=>/신규\s*구매\s*발주\s*등록/.test(clean(card.textContent)))||cards[0]||null;
  }

  function normalizeHeader(){
    const modal=findPurchaseModal();
    if(!modal) return;
    const head=modal.querySelector('.qpx-modal-head');
    if(!head) return;

    const first=head.firstElementChild;
    if(first){
      first.classList.add('qpdz-title-left');
      const h=first.querySelector('h3'); if(h) h.textContent='신규 구매 발주 등록';
      const p=first.querySelector('p'); if(p) p.textContent='MRP·작업지시·협력사·IQC를 하나의 발주번호로 연결합니다.';
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

    /* New purchase forms always start from the visible top edge, never above it. */
    if(!modal.dataset.qmesDragMoved){
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
      proxy.type='button';
      proxy.textContent='공급업체 등록';
      proxy.setAttribute('aria-hidden','true');
      proxy.tabIndex=-1;
      proxy.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(proxy);
      try{proxy.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'mouse'}));}catch(_){}
      if(!document.getElementById('qmes-partner-register-modal-v2')) proxy.click();
      proxy.remove();
    };
    fire();
    if(!document.getElementById('qmes-partner-register-modal-v2')) setTimeout(()=>{if(!document.getElementById('qmes-partner-register-modal-v2')) fire();},120);
  }

  function handleClick(event){
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    const button=target.closest('.qmes-purchase-live .qpdz-target-ui [data-action="new-supplier"]');
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openSupplierRegister();
  }

  /* ---------- Global mouse-drag support for QMES modal windows ---------- */
  const EXACT_HANDLES='.qpx-modal-head,.qpr-head,.modal-header,.qmes-modal-header,.qerp-modal-head,.qmes-dialog-header';
  const EXACT_BOXES='.qpx-form-card,.qpr-box,.modal-content,.qmes-modal-content,.qerp-modal-card,.qmes-dialog-card,.dialog-content';

  function isInteractive(el){
    return !!el.closest('button,a,input,select,textarea,label,[contenteditable="true"],[data-no-drag]');
  }

  function roleDialogHandle(target){
    const dialog=target.closest('[role="dialog"]');
    if(!dialog) return null;
    const first=dialog.firstElementChild;
    if(first&&first.contains(target)){
      const hasTitle=!!first.querySelector('h1,h2,h3,h4,h5,strong,[class*="title"]');
      const hasClose=!!first.querySelector('button,[aria-label*="닫기"],[aria-label*="close" i]');
      if(hasTitle||hasClose) return first;
    }
    return null;
  }

  function findDragHandle(target){
    return target.closest(EXACT_HANDLES)||roleDialogHandle(target);
  }

  function findDragBox(handle){
    if(!handle) return null;
    const exact=handle.closest(EXACT_BOXES);
    if(exact) return exact;

    const dialog=handle.closest('[role="dialog"]');
    if(dialog){
      const r=dialog.getBoundingClientRect();
      if(r.width<window.innerWidth*.985||r.height<window.innerHeight*.985) return dialog;
    }
    return null;
  }

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

  function positionBoxForDrag(box){
    const rect=box.getBoundingClientRect();
    box.dataset.qmesDragMoved='1';
    box.style.setProperty('position','fixed','important');
    box.style.setProperty('left',rect.left+'px','important');
    box.style.setProperty('top',Math.max(0,rect.top)+'px','important');
    box.style.setProperty('right','auto','important');
    box.style.setProperty('bottom','auto','important');
    box.style.setProperty('margin','0','important');
    box.style.setProperty('transform','none','important');
    return box.getBoundingClientRect();
  }

  function onDragStart(event){
    if(event.button!==0) return;
    if(event.pointerType&&event.pointerType!=='mouse') return;
    const target=event.target instanceof Element?event.target:null;
    if(!target||isInteractive(target)) return;

    const handle=findDragHandle(target);
    if(!handle) return;
    const box=findDragBox(handle);
    if(!box||!box.isConnected) return;

    const initial=box.getBoundingClientRect();
    if(initial.width<220||initial.height<80) return;
    if(initial.width>=window.innerWidth*.995&&initial.height>=window.innerHeight*.995) return;

    event.preventDefault();
    const rect=positionBoxForDrag(box);
    const startX=event.clientX;
    const startY=event.clientY;
    const startLeft=rect.left;
    const startTop=rect.top;
    const visibleX=Math.min(140,Math.max(70,rect.width*.20));
    const visibleTop=44;
    document.body.classList.add('qmes-modal-dragging');

    const move=e=>{
      if(e.pointerType&&e.pointerType!=='mouse') return;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      const minLeft=visibleX-rect.width;
      const maxLeft=window.innerWidth-visibleX;
      const minTop=0;
      const maxTop=Math.max(0,window.innerHeight-visibleTop);
      const left=clamp(startLeft+dx,minLeft,maxLeft);
      const top=clamp(startTop+dy,minTop,maxTop);
      box.style.setProperty('left',Math.round(left)+'px','important');
      box.style.setProperty('top',Math.round(top)+'px','important');
    };

    const end=()=>{
      document.body.classList.remove('qmes-modal-dragging');
      window.removeEventListener('pointermove',move,true);
      window.removeEventListener('pointerup',end,true);
      window.removeEventListener('pointercancel',end,true);
    };

    window.addEventListener('pointermove',move,true);
    window.addEventListener('pointerup',end,true);
    window.addEventListener('pointercancel',end,true);
  }

  function keepDraggedBoxesVisible(){
    document.querySelectorAll('[data-qmes-drag-moved="1"]').forEach(box=>{
      const r=box.getBoundingClientRect();
      const visibleX=Math.min(140,Math.max(70,r.width*.20));
      const left=clamp(r.left,visibleX-r.width,window.innerWidth-visibleX);
      const top=clamp(r.top,0,Math.max(0,window.innerHeight-44));
      box.style.setProperty('left',Math.round(left)+'px','important');
      box.style.setProperty('top',Math.round(top)+'px','important');
    });
  }

  function apply(){
    queued=false;
    ensureStyle();
    normalizeHeader();
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}

  function start(){
    apply();
    document.addEventListener('click',handleClick,true);
    document.addEventListener('pointerdown',onDragStart,true);
    window.addEventListener('resize',keepDraggedBoxesVisible);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
