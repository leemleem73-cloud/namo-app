/* NAMO QMES - quantity control box-size fix (2026-09-15)
 * IQC: 입고중량 / 검사수량 / 불량수량
 * OQC: 출하수량
 * Box size only. Text size/weight/color are left to the original QMES styles.
 */
(function(){
  'use strict';
  if(window.__QMES_FIELD_QUANTITY_BOX_FIX_20260915__) return;
  window.__QMES_FIELD_QUANTITY_BOX_FIX_20260915__=true;

  const STYLE_ID='qmes-field-quantity-box-fix-style-20260915';
  const TARGETS=new Set(['입고중량 (kg)','검사수량 (EA)','불량수량 (EA)','출하수량 (kg)']);
  let scheduled=false;
  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').replace(/\s*\*\s*$/,'').trim();

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* IQC uses the same 44px control height as the rest of the aligned IQC basic form. */
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] > input,
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control,
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > input{
        box-sizing:border-box!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        height:44px!important;
        min-height:44px!important;
        max-height:44px!important;
        margin:0!important;
      }

      /* OQC/PQC basic inputs are 39px in the unified field layout. */
      html body #root .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] > input,
      html body #root .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control,
      html body #root .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > input,
      html body #root .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] > input,
      html body #root .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control,
      html body #root .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > input{
        box-sizing:border-box!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        height:39px!important;
        min-height:39px!important;
        max-height:39px!important;
        margin:0!important;
      }

      /* If a quantity stepper wrapper is present, keep its arrow column inside the same control height. */
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control{
        position:relative!important;
        display:block!important;
        padding:0!important;
        overflow:hidden!important;
        border-radius:8px!important;
      }
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > input{
        padding-right:40px!important;
      }
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > button{
        position:absolute!important;
        right:0!important;
        width:38px!important;
        min-width:38px!important;
        max-width:38px!important;
        margin:0!important;
        padding:0!important;
        border-left:1px solid #c7d5df!important;
        border-radius:0!important;
        box-shadow:none!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > button{
        height:22px!important;
        min-height:22px!important;
        max-height:22px!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > button,
      html body #root .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > button{
        height:19.5px!important;
        min-height:19.5px!important;
        max-height:19.5px!important;
      }
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > button:first-of-type{
        top:0!important;
        bottom:auto!important;
        border-bottom:1px solid #c7d5df!important;
        border-top-right-radius:8px!important;
      }
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control > button:last-of-type{
        top:auto!important;
        bottom:0!important;
        border-bottom-right-radius:8px!important;
      }
    `;
    document.head.appendChild(style);
  }

  function restoreOriginalTextStyle(input){
    if(!input) return;
    /* Undo only the inline text overrides from the previous quantity-font patch. */
    input.style.removeProperty('font-size');
    input.style.removeProperty('line-height');
    input.style.removeProperty('font-weight');
    input.style.removeProperty('letter-spacing');
    input.style.removeProperty('color');
    input.style.removeProperty('-webkit-text-fill-color');
  }

  function apply(){
    scheduled=false;
    ensureStyle();
    const root=document.querySelector('.qmes-ipad-pop.qmes-field-mode-unify');
    if(!root) return;

    root.querySelectorAll('.qmes-ipad-form-grid label').forEach(label=>{
      const caption=clean(label.querySelector(':scope > span')?.textContent);
      const isTarget=TARGETS.has(caption);
      if(!isTarget){
        delete label.dataset.qmesQuantityField;
        return;
      }

      label.dataset.qmesQuantityField='1';
      const input=label.querySelector('input');
      if(!input) return;
      restoreOriginalTextStyle(input);

      if(input.parentElement&&input.parentElement!==label){
        input.parentElement.classList.add('qmes-quantity-control');
      }
    });
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{apply();setTimeout(apply,40);});
  }

  const start=()=>{
    if(!document.body) return;
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-qmes-mode']});
    document.addEventListener('click',event=>{
      if(event.target instanceof Element&&event.target.closest('.qmes-ipad-pop')) setTimeout(schedule,0);
    },true);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    schedule();
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
