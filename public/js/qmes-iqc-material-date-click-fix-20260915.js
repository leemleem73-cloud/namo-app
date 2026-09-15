/* NAMO QMES - IQC raw-material click/date-picker collision fix (2026-09-15)
 * Keeps the raw-material field above date controls and blocks stray native date picker hits.
 * UI-only: no QMES data/storage changes.
 */
(function(){
  'use strict';
  if(window.__QMES_IQC_MATERIAL_DATE_CLICK_FIX_20260915__) return;
  window.__QMES_IQC_MATERIAL_DATE_CLICK_FIX_20260915__=true;

  const STYLE_ID='qmes-iqc-material-date-click-fix-style-20260915';
  const ROOT_SELECTOR='.qmes-ipad-pop.qmes-field-mode-unify[data-qmes-mode="IQC"]';
  let scheduled=false;

  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #root ${ROOT_SELECTOR} .qmes-ipad-form-grid label[data-qmes-iqc-material-field='1']{
        position:relative!important;
        z-index:30!important;
        isolation:isolate!important;
        pointer-events:auto!important;
      }
      html body #root ${ROOT_SELECTOR} .qmes-ipad-form-grid label[data-qmes-iqc-material-field='1']>input{
        position:relative!important;
        inset:auto!important;
        transform:none!important;
        z-index:31!important;
        pointer-events:auto!important;
        width:100%!important;
        max-width:100%!important;
        box-sizing:border-box!important;
      }
      html body #root ${ROOT_SELECTOR} .qmes-ipad-form-grid label[data-qmes-iqc-date-field='1']{
        position:relative!important;
        z-index:1!important;
        overflow:hidden!important;
        isolation:isolate!important;
        contain:layout paint!important;
      }
      html body #root ${ROOT_SELECTOR} .qmes-ipad-form-grid label[data-qmes-iqc-date-field='1']>input[type='date']{
        position:relative!important;
        inset:auto!important;
        left:auto!important;
        right:auto!important;
        top:auto!important;
        bottom:auto!important;
        transform:none!important;
        z-index:1!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        height:39px!important;
        min-height:39px!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
      }
      html body #root ${ROOT_SELECTOR} .qmes-ipad-form-grid label[data-qmes-iqc-date-field='1']>input[type='date']::-webkit-calendar-picker-indicator{
        position:absolute!important;
        left:auto!important;
        right:8px!important;
        top:50%!important;
        bottom:auto!important;
        transform:translateY(-50%)!important;
        width:18px!important;
        min-width:18px!important;
        max-width:18px!important;
        height:18px!important;
        min-height:18px!important;
        max-height:18px!important;
        margin:0!important;
        padding:0!important;
        opacity:.9!important;
        cursor:pointer!important;
      }
    `;
    document.head.appendChild(style);
  }

  function fieldLabelByText(root,text){
    return Array.from(root.querySelectorAll('.qmes-ipad-form-grid label')).find(label=>{
      const caption=label.querySelector(':scope>span');
      return caption&&clean(caption.textContent).replace(/\s*\*\s*$/,'')===text;
    })||null;
  }

  function tagFields(){
    ensureStyle();
    const root=document.querySelector(ROOT_SELECTOR);
    if(!root) return null;

    const materialLabel=fieldLabelByText(root,'원자재명');
    const materialInput=materialLabel?.querySelector(':scope>input:not([type="date"])')||null;
    if(materialLabel) materialLabel.dataset.qmesIqcMaterialField='1';
    if(materialInput){
      materialInput.dataset.qmesIqcMaterialInput='1';
      materialInput.setAttribute('autocomplete','off');
    }

    ['입고일자','검사일자'].forEach(text=>{
      const label=fieldLabelByText(root,text);
      if(label&&label.querySelector(':scope>input[type="date"]')) label.dataset.qmesIqcDateField='1';
    });

    root.querySelectorAll('.qmes-ipad-form-grid input[type="date"]').forEach(input=>{
      const label=input.closest('label');
      if(label) label.dataset.qmesIqcDateField='1';
      input.dataset.qmesIqcDateInput='1';
    });

    return {root,materialLabel,materialInput};
  }

  function pointInside(rect,x,y){
    return Boolean(rect)&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
  }

  function closeDatePickers(root){
    if(!root) return;
    root.querySelectorAll('input[type="date"]').forEach(input=>{
      if(document.activeElement===input){
        try{ input.blur(); }catch(_error){}
      }
    });
  }

  function focusMaterial(materialInput){
    if(!materialInput) return;
    closeDatePickers(materialInput.closest(ROOT_SELECTOR));
    try{
      materialInput.focus({preventScroll:true});
    }catch(_error){
      try{ materialInput.focus(); }catch(_ignored){}
    }
  }

  function guardDateCollision(event){
    const fields=tagFields();
    if(!fields?.materialInput) return;
    const rect=fields.materialInput.getBoundingClientRect();
    if(!pointInside(rect,event.clientX,event.clientY)) return;

    const target=event.target instanceof Element?event.target:null;
    const strayDate=target?.matches?.('input[type="date"]')||target?.closest?.('label[data-qmes-iqc-date-field="1"]');
    if(!strayDate) return;

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==='function') event.stopImmediatePropagation();
    setTimeout(()=>focusMaterial(fields.materialInput),0);
  }

  function handleMaterialIntent(event){
    const target=event.target instanceof Element?event.target:null;
    const materialInput=target?.closest?.('input[data-qmes-iqc-material-input="1"]');
    if(!materialInput) return;
    closeDatePickers(materialInput.closest(ROOT_SELECTOR));
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      tagFields();
    });
  }

  function start(){
    ensureStyle();
    tagFields();

    document.addEventListener('pointerdown',guardDateCollision,true);
    document.addEventListener('mousedown',guardDateCollision,true);
    document.addEventListener('click',guardDateCollision,true);
    document.addEventListener('pointerdown',handleMaterialIntent,true);
    document.addEventListener('focusin',handleMaterialIntent,true);

    if(document.body){
      new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-qmes-mode']});
    }
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
