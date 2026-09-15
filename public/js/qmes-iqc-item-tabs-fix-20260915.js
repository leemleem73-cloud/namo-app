/* NAMO QMES - IQC inspection item tabs hard alignment fix (2026-09-15)
 * Restores visible IQC labels (외관/라벨/중량/COA 확인) and prevents number 4 overlap.
 */
(function(){
  'use strict';
  if(window.__QMES_IQC_ITEM_TABS_FIX_20260915__) return;
  window.__QMES_IQC_ITEM_TABS_FIX_20260915__=true;

  const STYLE_ID='qmes-iqc-item-tabs-fix-style-20260915';
  const LABELS=['외관','라벨','중량','COA 확인'];
  let scheduled=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:10px!important;
        margin-bottom:10px!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs>button{
        position:relative!important;
        display:grid!important;
        grid-template-columns:30px minmax(0,1fr) 38px!important;
        grid-template-rows:56px!important;
        align-items:center!important;
        column-gap:10px!important;
        width:100%!important;
        min-width:0!important;
        height:56px!important;
        min-height:56px!important;
        max-height:56px!important;
        margin:0!important;
        padding:0 12px!important;
        overflow:hidden!important;
        border:1px solid #d0dce5!important;
        border-radius:10px!important;
        background:#fff!important;
        box-shadow:none!important;
        box-sizing:border-box!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs>button>span{
        position:static!important;
        inset:auto!important;
        transform:none!important;
        display:grid!important;
        grid-column:1!important;
        grid-row:1!important;
        place-items:center!important;
        width:28px!important;
        min-width:28px!important;
        max-width:28px!important;
        height:28px!important;
        min-height:28px!important;
        max-height:28px!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        border:0!important;
        border-radius:7px!important;
        background:#e8eef3!important;
        color:#365268!important;
        -webkit-text-fill-color:#365268!important;
        font-size:11px!important;
        line-height:28px!important;
        font-weight:900!important;
        text-align:center!important;
        white-space:nowrap!important;
        box-sizing:border-box!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs>button>strong{
        position:static!important;
        inset:auto!important;
        transform:none!important;
        display:block!important;
        grid-column:2!important;
        grid-row:1!important;
        align-self:center!important;
        justify-self:stretch!important;
        width:auto!important;
        min-width:0!important;
        max-width:none!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        color:#213e53!important;
        -webkit-text-fill-color:#213e53!important;
        opacity:1!important;
        visibility:visible!important;
        font-size:13px!important;
        line-height:1.2!important;
        font-weight:850!important;
        text-align:left!important;
        white-space:nowrap!important;
        text-overflow:ellipsis!important;
        box-sizing:border-box!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs>button>small{
        position:static!important;
        inset:auto!important;
        transform:none!important;
        display:block!important;
        grid-column:3!important;
        grid-row:1!important;
        align-self:center!important;
        justify-self:end!important;
        width:38px!important;
        min-width:38px!important;
        max-width:38px!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        color:#6f8393!important;
        -webkit-text-fill-color:#6f8393!important;
        opacity:1!important;
        visibility:visible!important;
        font-size:10px!important;
        line-height:1.1!important;
        font-weight:800!important;
        text-align:right!important;
        white-space:nowrap!important;
        box-sizing:border-box!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs>button.is-active{
        border-color:#32a7dc!important;
        background:#eef9fe!important;
        box-shadow:inset 0 0 0 1px rgba(50,167,220,.14)!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs>button.is-active>span{
        background:#d9f0fb!important;
        color:#117eaf!important;
        -webkit-text-fill-color:#117eaf!important;
      }
      html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs>button.is-active>strong{
        color:#0c6f9f!important;
        -webkit-text-fill-color:#0c6f9f!important;
      }
      @media(max-width:980px){
        html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
      }
      @media(max-width:560px){
        html body #root .qmes-field-mode-unify[data-qmes-mode='IQC'] .qmes-ipad-item-tabs{grid-template-columns:1fr!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function hardAlign(){
    ensureStyle();
    const root=document.querySelector('.qmes-ipad-pop.qmes-field-mode-unify[data-qmes-mode="IQC"]');
    if(!root) return;
    const buttons=Array.from(root.querySelectorAll('.qmes-ipad-item-tabs>button')).slice(0,4);
    buttons.forEach((button,index)=>{
      const number=button.querySelector(':scope>span');
      const label=button.querySelector(':scope>strong');
      const status=button.querySelector(':scope>small');
      if(number){
        number.textContent=String(index+1);
        number.style.setProperty('position','static','important');
        number.style.setProperty('transform','none','important');
        number.style.setProperty('display','grid','important');
        number.style.setProperty('grid-column','1','important');
        number.style.setProperty('grid-row','1','important');
        number.style.setProperty('place-items','center','important');
        number.style.setProperty('width','28px','important');
        number.style.setProperty('height','28px','important');
      }
      if(label){
        label.textContent=LABELS[index]||label.textContent;
        label.style.setProperty('position','static','important');
        label.style.setProperty('transform','none','important');
        label.style.setProperty('display','block','important');
        label.style.setProperty('grid-column','2','important');
        label.style.setProperty('grid-row','1','important');
        label.style.setProperty('color','#213e53','important');
        label.style.setProperty('-webkit-text-fill-color','#213e53','important');
        label.style.setProperty('font-size','13px','important');
        label.style.setProperty('font-weight','850','important');
        label.style.setProperty('opacity','1','important');
        label.style.setProperty('visibility','visible','important');
        label.style.setProperty('white-space','nowrap','important');
        label.style.setProperty('overflow','hidden','important');
        label.style.setProperty('text-overflow','ellipsis','important');
      }
      if(status){
        status.style.setProperty('position','static','important');
        status.style.setProperty('transform','none','important');
        status.style.setProperty('display','block','important');
        status.style.setProperty('grid-column','3','important');
        status.style.setProperty('grid-row','1','important');
        status.style.setProperty('justify-self','end','important');
        status.style.setProperty('font-size','10px','important');
        status.style.setProperty('opacity','1','important');
        status.style.setProperty('visibility','visible','important');
      }
    });
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      hardAlign();
      setTimeout(hardAlign,50);
    });
  }

  const start=()=>{
    if(!document.body) return;
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-qmes-mode']});
    document.addEventListener('click',event=>{
      if(event.target instanceof Element&&event.target.closest('.qmes-ipad-mode-tabs button,.qmes-ipad-item-tabs button')) setTimeout(schedule,0);
    },true);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    schedule();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
