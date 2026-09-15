/* NAMO QMES - unify quantity control text size (2026-09-15)
 * IQC: 입고중량 / 검사수량 / 불량수량
 * OQC: 출하수량
 * Visual-only patch. No data or validation logic changes.
 */
(function(){
  'use strict';
  if(window.__QMES_FIELD_QUANTITY_FONT_FIX_20260915__) return;
  window.__QMES_FIELD_QUANTITY_FONT_FIX_20260915__=true;

  const STYLE_ID='qmes-field-quantity-font-fix-style-20260915';
  const TARGETS=new Set(['입고중량 (kg)','검사수량 (EA)','불량수량 (EA)','출하수량 (kg)']);
  let scheduled=false;
  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').replace(/\s*\*\s*$/,'').trim();

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] input,
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control input{
        font-size:12px!important;
        line-height:1!important;
        font-weight:650!important;
        letter-spacing:0!important;
        color:#294459!important;
        -webkit-text-fill-color:#294459!important;
      }

      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control,
      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] .qmes-quantity-control :not(button):not(svg):not(path){
        font-size:12px!important;
        line-height:1!important;
        font-weight:650!important;
        letter-spacing:0!important;
      }

      html body #root .qmes-field-mode-unify .qmes-ipad-form-grid label[data-qmes-quantity-field='1'] button{
        font-size:10px!important;
        font-weight:800!important;
      }
    `;
    document.head.appendChild(style);
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

      input.style.setProperty('font-size','12px','important');
      input.style.setProperty('line-height','1','important');
      input.style.setProperty('font-weight','650','important');
      input.style.setProperty('letter-spacing','0','important');

      if(input.parentElement&&input.parentElement!==label){
        input.parentElement.classList.add('qmes-quantity-control');
      }
    });
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      apply();
      setTimeout(apply,40);
    });
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
