/* NAMO QMES - Integrated order step navigation hotfix V13 - 2026-09-01
 * Allow users to review every wizard step before required fields are complete.
 * Required-field validation remains active on final ERP/MES creation.
 */
(function(){
  'use strict';
  if(window.__QMES_INTEGRATED_ORDER_STEP_NAV_V13__)return;
  window.__QMES_INTEGRATED_ORDER_STEP_NAV_V13__=true;
  const ROOT='#qmes-sales-new-order-integrated-v11';

  function move(modal,next){
    const step=Math.max(1,Math.min(4,Number(next)||1));
    modal.dataset.step=String(step);
    modal.querySelector('[data-v11-error]')?.classList.remove('show');
    modal.querySelectorAll('[data-v11-page]').forEach(page=>{
      page.classList.toggle('active',Number(page.dataset.v11Page)===step);
    });
    modal.querySelectorAll('[data-v11-step]').forEach(button=>{
      const number=Number(button.dataset.v11Step);
      button.classList.toggle('active',number===step);
      button.classList.toggle('done',number<step);
    });
    const previous=modal.querySelector('[data-v11-prev]');
    const nextButton=modal.querySelector('[data-v11-next]');
    const save=modal.querySelector('[data-v11-save]');
    if(previous)previous.hidden=step===1;
    if(nextButton)nextButton.hidden=step===4;
    if(save)save.hidden=step!==4;
  }

  document.addEventListener('click',event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const modal=target.closest(ROOT);
    if(!modal)return;
    const next=target.closest('[data-v11-next]');
    const previous=target.closest('[data-v11-prev]');
    const stepButton=target.closest('[data-v11-step]');
    if(!next&&!previous&&!stepButton)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if(next)move(modal,Number(modal.dataset.step||1)+1);
    else if(previous)move(modal,Number(modal.dataset.step||1)-1);
    else move(modal,Number(stepButton.dataset.v11Step));
  },true);
})();
