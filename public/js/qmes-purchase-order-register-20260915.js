/* NAMO QMES - purchase order registration action (2026-09-15)
 * Makes the existing purchase create workflow explicit as "구매 발주 등록".
 * Reuses the live purchase form/save logic so registered orders continue to sync to the shared QMES data and IQC flow.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_ORDER_REGISTER_20260915__) return;
  window.__QMES_PURCHASE_ORDER_REGISTER_20260915__=true;

  const STYLE_ID='qmes-purchase-order-register-style-20260915';
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  let scheduled=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-purchase-live .qmes-purchase-register-btn{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        min-width:150px!important;
        height:40px!important;
        padding:0 18px!important;
        border-radius:8px!important;
        font-size:13px!important;
        font-weight:900!important;
        white-space:nowrap!important;
      }
      .qmes-purchase-live .qmes-purchase-register-form{
        position:relative!important;
        margin-bottom:16px!important;
        padding-top:52px!important;
        border:1px solid #cbd9e3!important;
        border-radius:10px!important;
        background:#fff!important;
      }
      .qmes-purchase-live .qmes-purchase-register-title{
        position:absolute!important;
        left:0!important;
        right:0!important;
        top:0!important;
        height:42px!important;
        display:flex!important;
        align-items:center!important;
        padding:0 16px!important;
        border-bottom:1px solid #dfe7ed!important;
        border-radius:10px 10px 0 0!important;
        background:#f7fafc!important;
        color:#183f5b!important;
        font-size:14px!important;
        font-weight:900!important;
      }
      .qmes-purchase-live .qmes-purchase-register-form .qerp-field label{
        font-weight:800!important;
      }
      .qmes-purchase-live .qmes-purchase-register-submit{
        min-width:126px!important;
        font-weight:900!important;
      }
    `;
    document.head.appendChild(style);
  }

  function findPurchaseRoot(){
    return document.querySelector('.qmes-purchase-live');
  }

  function patchHeader(root){
    const actions=root.querySelector('.qmes-purchase-page-head .qerp-head-actions');
    if(!actions) return;
    const buttons=Array.from(actions.querySelectorAll('button'));
    const createButton=buttons.find(button=>/신규\s*발주|발주서\s*생성|구매\s*발주\s*등록|입력\s*닫기|등록\s*닫기/.test(clean(button.textContent)));
    if(!createButton) return;

    createButton.classList.add('qmes-purchase-register-btn');
    const formVisible=!!root.querySelector('.qerp-card .qerp-form');
    const desired=formVisible?'등록 닫기':'+ 구매 발주 등록';
    if(clean(createButton.textContent)!==desired) createButton.textContent=desired;
    createButton.setAttribute('aria-label',formVisible?'구매 발주 등록 닫기':'구매 발주 등록');
  }

  function patchForm(root){
    const form=root.querySelector('.qerp-card .qerp-form');
    if(!form) return;
    form.classList.add('qmes-purchase-register-form');

    if(!form.querySelector('.qmes-purchase-register-title')){
      const title=document.createElement('div');
      title.className='qmes-purchase-register-title';
      title.textContent='구매 발주 등록';
      form.insertBefore(title,form.firstChild);
    }

    const submit=form.querySelector('button[type="submit"]');
    if(submit){
      submit.classList.add('qmes-purchase-register-submit');
      if(clean(submit.textContent)!=='구매 발주 등록') submit.textContent='구매 발주 등록';
    }

    const cancel=Array.from(form.querySelectorAll('button[type="button"]')).find(button=>clean(button.textContent)==='취소');
    if(cancel) cancel.setAttribute('aria-label','구매 발주 등록 취소');
  }

  function apply(){
    scheduled=false;
    ensureStyle();
    const root=findPurchaseRoot();
    if(!root) return;
    patchHeader(root);
    patchForm(root);
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      apply();
      setTimeout(apply,40);
    });
  }

  function start(){
    ensureStyle();
    if(document.body){
      new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
    }
    document.addEventListener('click',event=>{
      if(event.target instanceof Element&&event.target.closest('.qmes-purchase-live')) setTimeout(schedule,0);
    },true);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    schedule();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
