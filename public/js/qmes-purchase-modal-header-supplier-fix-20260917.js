/* NAMO QMES - purchase modal final visual match + supplier bridge
 * 2026-09-17
 * Additive-only patch. Existing purchase/order/partner data and save logic are preserved.
 * Scope is strictly the purchase-order registration modal.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__) return;
  window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__ = true;

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
/* ===== Purchase modal: approved wide reference layout ===== */
.qmes-purchase-live .qpx-form-card.qpdz-target-modal,
.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{
  left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;
  width:min(1760px,92vw)!important;max-width:none!important;max-height:92vh!important;
  margin:0!important;padding:0 18px 0!important;overflow:auto!important;
  border:1px solid #d7e3ee!important;border-radius:12px!important;background:#fff!important;
  box-shadow:0 24px 70px rgba(10,35,58,.30)!important;
}
.qmes-purchase-live .qpx-form-card.qpdz-target-modal .qpx-modal-head,
.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"] .qpx-modal-head{
  position:sticky!important;top:0!important;z-index:12!important;
  min-height:72px!important;box-sizing:border-box!important;
  margin:0 -18px 10px!important;padding:12px 18px 12px 20px!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;gap:22px!important;
  border-radius:12px 12px 0 0!important;
  background:linear-gradient(100deg,#0d6da9 0%,#0b79bc 54%,#0877b5 100%)!important;
  color:#fff!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-title-left{
  display:flex!important;align-items:center!important;gap:13px!important;min-width:0!important;flex:1 1 auto!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-title-left>div{min-width:0!important}
.qmes-purchase-live .qpx-form-card .qpdz-cart{
  width:40px!important;height:40px!important;display:grid!important;place-items:center!important;flex:none!important;
  color:#d8efff!important;opacity:1!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-cart svg{width:31px!important;height:31px!important;display:block!important}
.qmes-purchase-live .qpx-form-card .qpx-modal-head h3{
  margin:0!important;color:#fff!important;opacity:1!important;
  font-size:20px!important;line-height:1.15!important;font-weight:950!important;letter-spacing:-.25px!important;
  text-shadow:0 1px 1px rgba(0,0,0,.12)!important;white-space:nowrap!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head p{
  margin:4px 0 0!important;color:rgba(255,255,255,.96)!important;opacity:1!important;
  font-size:10px!important;line-height:1.25!important;font-weight:750!important;white-space:nowrap!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-steps{
  display:flex!important;align-items:center!important;justify-content:flex-end!important;
  gap:0!important;flex:0 0 auto!important;flex-wrap:nowrap!important;margin-left:auto!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step{
  display:inline-flex!important;align-items:center!important;gap:6px!important;
  color:#fff!important;opacity:1!important;font-size:10px!important;font-weight:850!important;white-space:nowrap!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step b{
  width:25px!important;height:25px!important;margin:0!important;border:1px solid rgba(255,255,255,.72)!important;
  border-radius:50%!important;background:transparent!important;color:#fff!important;
  display:grid!important;place-items:center!important;font-size:10px!important;font-weight:950!important;box-shadow:none!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step:first-child b{
  background:#fff!important;color:#1179ba!important;border-color:#fff!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-head .qpx-step:not(:last-of-type)::after{
  content:""!important;width:34px!important;height:1px!important;background:rgba(255,255,255,.48)!important;
  display:block!important;margin:0 10px!important;
}
.qmes-purchase-live .qpx-form-card .qpx-modal-close{
  width:36px!important;height:36px!important;margin-left:18px!important;padding:0!important;flex:none!important;
  border:1px solid rgba(255,255,255,.72)!important;border-radius:7px!important;background:#fff!important;
  color:#244763!important;font-size:21px!important;font-weight:800!important;line-height:1!important;box-shadow:0 1px 2px rgba(0,0,0,.06)!important;
}

/* ===== Section / form proportions matching the approved reference ===== */
.qmes-purchase-live .qpx-form-card .qerp-form.qpdz-target-form{
  display:block!important;position:relative!important;padding:4px 2px 68px!important;margin:0!important;min-height:0!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-target-ui{display:flex!important;flex-direction:column!important;gap:10px!important;color:#18344f!important}
.qmes-purchase-live .qpx-form-card .qpdz-section{border:1px solid #dce6ef!important;border-radius:8px!important;overflow:hidden!important;background:#fff!important}
.qmes-purchase-live .qpx-form-card .qpdz-section-head{
  height:39px!important;display:flex!important;align-items:center!important;gap:10px!important;padding:0 12px!important;
  background:linear-gradient(90deg,#f4f8fb,#edf4f9)!important;border-bottom:1px solid #e0e8ef!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-section-num{
  width:29px!important;height:29px!important;border-radius:50%!important;display:grid!important;place-items:center!important;
  background:#0c79b8!important;color:#fff!important;font-size:15px!important;font-weight:950!important;flex:none!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-section-title{font-size:14px!important;font-weight:950!important;color:#18344f!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-form-card .qpdz-section-help{font-size:10px!important;color:#73879b!important;font-weight:650!important;margin-left:4px!important}
.qmes-purchase-live .qpx-form-card .qpdz-section-body{padding:10px 11px 11px!important}
.qmes-purchase-live .qpx-form-card .qpdz-basic-grid{display:grid!important;grid-template-columns:1.08fr 1.08fr 1fr 1.48fr 1fr!important;gap:10px 18px!important;align-items:end!important}
.qmes-purchase-live .qpx-form-card .qpdz-field label{margin-bottom:5px!important;color:#314f69!important;font-size:10px!important;font-weight:850!important}
.qmes-purchase-live .qpx-form-card .qpdz-field input,
.qmes-purchase-live .qpx-form-card .qpdz-field select,
.qmes-purchase-live .qpx-form-card .qpdz-field textarea{height:35px!important;border-color:#cbd9e6!important;border-radius:5px!important;background:#fff!important;color:#263f58!important;font-size:11px!important}
.qmes-purchase-live .qpx-form-card .qpdz-field input[readonly]{background:#eef2f5!important;color:#526d84!important}
.qmes-purchase-live .qpx-form-card .qpdz-icon-btn,
.qmes-purchase-live .qpx-form-card .qpdz-soft-btn,
.qmes-purchase-live .qpx-form-card .qpdz-blue-btn,
.qmes-purchase-live .qpx-form-card .qpdz-red-btn{height:35px!important;font-size:10px!important;font-weight:850!important;border-radius:5px!important}
.qmes-purchase-live .qpx-form-card .qpdz-blue-btn{background:#1488d0!important;border-color:#1488d0!important;color:#fff!important}
.qmes-purchase-live .qpx-form-card .qpdz-target-table{width:100%!important;min-width:1290px!important;border-collapse:collapse!important;table-layout:fixed!important}
.qmes-purchase-live .qpx-form-card .qpdz-target-table th{height:34px!important;background:#edf4f9!important;color:#38536c!important;font-size:10px!important;font-weight:900!important}
.qmes-purchase-live .qpx-form-card .qpdz-target-table td{height:39px!important;color:#29445d!important;font-size:10px!important;background:#fff!important}
.qmes-purchase-live .qpx-form-card .qpdz-target-table input,
.qmes-purchase-live .qpx-form-card .qpdz-target-table select{height:29px!important;font-size:10px!important;border-radius:4px!important}
.qmes-purchase-live .qpx-form-card .qpdz-totalbox.grand{background:#123e64!important}
.qmes-purchase-live .qpx-form-card .qpdz-quality-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px 18px!important;align-items:center!important}
.qmes-purchase-live .qpx-form-card .qpdz-quality-check{min-height:48px!important}
.qmes-purchase-live .qpx-form-card .qpdz-footer{
  position:sticky!important;bottom:-1px!important;z-index:11!important;margin:0 -20px -1px!important;padding:10px 18px!important;
  background:#fff!important;border-top:1px solid #dce6ef!important;display:flex!important;justify-content:flex-end!important;gap:8px!important;
  box-shadow:0 -3px 10px rgba(23,53,78,.05)!important;
}
.qmes-purchase-live .qpx-form-card .qpdz-footer button{height:38px!important;min-width:92px!important;font-size:11px!important;font-weight:900!important}
.qmes-purchase-live .qpx-form-card .qpdz-footer .submit{background:#0c8be1!important;border-color:#0c8be1!important;color:#fff!important;min-width:112px!important}

/* Supplier register popup must stay above purchase modal. */
#qmes-partner-register-modal-v2{z-index:2147483646!important}

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
  .qmes-purchase-live .qpx-form-card.qpdz-target-modal,.qmes-purchase-live .qpx-form-card[data-qmes-purchase-modal-adopted="20260916"]{width:96vw!important}
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
      const h=first.querySelector('h3');
      if(h) h.textContent='신규 구매 발주 등록';
      const p=first.querySelector('p');
      if(p) p.textContent='MRP·작업지시·협력사·IQC를 하나의 발주번호로 연결합니다.';
      if(!first.querySelector('.qpdz-cart')){
        first.insertAdjacentHTML('afterbegin','<span class="qpdz-cart" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M3 5h4l3.2 14.2h13.9l3-10.2H9"/><circle cx="13" cy="25.5" r="1.7"/><circle cx="23" cy="25.5" r="1.7"/></svg></span>');
      }
    }

    const steps=[...head.querySelectorAll('.qpx-step')];
    const labels=['기본정보','품목등록','품질요구사항','결재상신'];
    steps.slice(0,4).forEach((step,i)=>{
      let b=step.querySelector('b');
      if(!b){b=document.createElement('b');step.insertBefore(b,step.firstChild);}
      b.textContent=String(i+1);
      [...step.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());
      step.appendChild(document.createTextNode(labels[i]));
    });
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
      try{
        proxy.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true}));
      }catch(_){ }
      if(!document.getElementById('qmes-partner-register-modal-v2')) proxy.click();
      proxy.remove();
    };

    fire();
    if(!document.getElementById('qmes-partner-register-modal-v2')){
      setTimeout(()=>{if(!document.getElementById('qmes-partner-register-modal-v2')) fire();},120);
    }
  }

  function handleClick(event){
    const target=event.target instanceof Element ? event.target : null;
    if(!target) return;
    const button=target.closest('.qmes-purchase-live .qpdz-target-ui [data-action="new-supplier"]');
    if(!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openSupplierRegister();
  }

  function apply(){
    queued=false;
    ensureStyle();
    normalizeHeader();
  }

  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(apply);
  }

  function start(){
    apply();
    document.addEventListener('click',handleClick,true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
