/* NAMO QMES - purchase order registration action (2026-09-16)
 * Makes the existing purchase create workflow explicit as "구매 발주 등록".
 * Reuses the live purchase form/save logic so registered orders continue to sync to the shared QMES data and IQC flow.
 * Adds an explicit "수정" action to the premium purchase list and reuses the existing React edit modal/save flow.
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
      .qmes-purchase-live .qpc-table th.qpc-edit-head{
        width:76px!important;
        min-width:76px!important;
        text-align:center!important;
      }
      .qmes-purchase-live .qpc-table td.qpc-edit-cell{
        width:76px!important;
        min-width:76px!important;
        text-align:center!important;
        padding-left:7px!important;
        padding-right:7px!important;
      }
      .qmes-purchase-live .qpc-edit-btn{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        min-width:52px!important;
        height:27px!important;
        padding:0 10px!important;
        border:1px solid #8fc4e6!important;
        border-radius:7px!important;
        background:#eef8ff!important;
        color:#0d6eaf!important;
        font-size:10px!important;
        font-weight:900!important;
        line-height:1!important;
        cursor:pointer!important;
        box-shadow:0 2px 5px rgba(8,127,189,.07)!important;
      }
      .qmes-purchase-live .qpc-edit-btn:hover{
        background:#087fbd!important;
        border-color:#087fbd!important;
        color:#fff!important;
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

  function patchPremiumEditButtons(root){
    const table=root.querySelector('.qmes-purchase-capture-host .qpc-table');
    if(!table) return;

    const headerRow=table.querySelector('thead tr');
    if(headerRow&&!headerRow.querySelector('.qpc-edit-head')){
      const th=document.createElement('th');
      th.className='qpc-edit-head';
      th.textContent='관리';
      headerRow.appendChild(th);
    }

    table.querySelectorAll('tbody tr.qpc-detail').forEach(row=>{
      const dateLink=row.querySelector('.qpc-date-link[data-purchase-no]');
      if(!dateLink) return;
      const purchaseNo=clean(dateLink.dataset.purchaseNo);
      let cell=row.querySelector('.qpc-edit-cell');
      if(!cell){
        cell=document.createElement('td');
        cell.className='qpc-edit-cell';
        row.appendChild(cell);
      }
      let button=cell.querySelector('.qpc-edit-btn');
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='qpc-edit-btn';
        button.textContent='수정';
        button.title='구매 발주 수정';
        cell.appendChild(button);
      }
      button.dataset.purchaseNo=purchaseNo;
    });

    table.querySelectorAll('tbody tr.qpc-month, tbody tr.qpc-total').forEach(row=>{
      if(row.querySelector('.qpc-edit-cell')) return;
      const cell=document.createElement('td');
      cell.className='qpc-edit-cell';
      row.appendChild(cell);
    });

    table.querySelectorAll('tbody .qpc-empty').forEach(cell=>cell.setAttribute('colspan','9'));
  }

  function nativeSetValue(input,value){
    if(!input) return false;
    const prototype=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:input instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    const descriptor=Object.getOwnPropertyDescriptor(prototype,'value');
    if(descriptor&&descriptor.set) descriptor.set.call(input,value); else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  function findOriginalEditLink(root,purchaseNo){
    return Array.from(root.querySelectorAll('.qp-po-link')).find(link=>clean(link.textContent)===purchaseNo)||null;
  }

  function openOriginalEdit(root,purchaseNo){
    let link=findOriginalEditLink(root,purchaseNo);
    if(link){
      link.click();
      return true;
    }

    // The legacy/live table is paginated. Narrow its hidden search field to the
    // selected purchase number, then click the matching original React edit link.
    const searchInputs=Array.from(root.querySelectorAll('.qp-toolbar input[type="search"]'));
    const search=searchInputs.find(input=>/발주번호|협력사|품목|MRP/.test(clean(input.placeholder)))||searchInputs[0];
    if(!search) return false;
    nativeSetValue(search,purchaseNo);

    let attempts=0;
    const timer=setInterval(()=>{
      attempts+=1;
      const next=findOriginalEditLink(root,purchaseNo);
      if(next){
        clearInterval(timer);
        next.click();
        return;
      }
      if(attempts>=12){
        clearInterval(timer);
        window.alert('수정 화면을 불러오지 못했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.');
      }
    },50);
    return true;
  }

  function handlePremiumEdit(event){
    const target=event.target instanceof Element?event.target:null;
    const button=target?.closest?.('.qpc-edit-btn[data-purchase-no]');
    if(!button) return;
    const root=button.closest('.qmes-purchase-live')||findPurchaseRoot();
    if(!root) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==='function') event.stopImmediatePropagation();
    const purchaseNo=clean(button.dataset.purchaseNo);
    if(!purchaseNo) return;
    if(!openOriginalEdit(root,purchaseNo)){
      window.alert('해당 발주번호의 수정 데이터를 찾지 못했습니다: '+purchaseNo);
    }
  }

  function apply(){
    scheduled=false;
    ensureStyle();
    const root=findPurchaseRoot();
    if(!root) return;
    patchHeader(root);
    patchForm(root);
    patchPremiumEditButtons(root);
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
    document.addEventListener('click',handlePremiumEdit,true);
    document.addEventListener('click',event=>{
      if(event.target instanceof Element&&event.target.closest('.qmes-purchase-live')) setTimeout(schedule,0);
    },true);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    window.addEventListener('qmes:erp-data-changed',event=>{
      if(!event?.detail?.kind||event.detail.kind==='purchase') setTimeout(schedule,60);
    });
    schedule();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
