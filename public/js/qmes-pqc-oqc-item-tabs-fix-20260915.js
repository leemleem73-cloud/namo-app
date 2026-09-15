/* NAMO QMES - PQC/OQC inspection item tab layout fix (2026-09-15)
 * Keeps IQC styling unchanged. Restores readable label/status alignment for PQC/OQC.
 */
(function(){
  'use strict';
  if(window.__QMES_PQC_OQC_ITEM_TABS_FIX_20260915__) return;
  window.__QMES_PQC_OQC_ITEM_TABS_FIX_20260915__=true;

  const STYLE_ID='qmes-pqc-oqc-item-tabs-fix-20260915';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:10px!important;
        margin-bottom:10px!important;
      }

      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button{
        position:relative!important;
        display:grid!important;
        grid-template-columns:26px minmax(0,1fr) auto!important;
        grid-template-rows:1fr!important;
        align-items:center!important;
        column-gap:9px!important;
        width:100%!important;
        min-width:0!important;
        height:56px!important;
        min-height:56px!important;
        padding:8px 10px!important;
        border:1px solid #d0dce5!important;
        border-radius:10px!important;
        background:#fff!important;
        color:#344e61!important;
        overflow:hidden!important;
        box-shadow:none!important;
      }

      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button>span,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button>span{
        position:static!important;
        display:grid!important;
        place-items:center!important;
        grid-column:1!important;
        grid-row:1!important;
        width:24px!important;
        height:24px!important;
        min-width:24px!important;
        margin:0!important;
        padding:0!important;
        border-radius:6px!important;
        background:#e8eef3!important;
        color:#365268!important;
        -webkit-text-fill-color:#365268!important;
        font-size:10px!important;
        font-weight:900!important;
        line-height:1!important;
      }

      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button strong,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button strong{
        position:static!important;
        display:block!important;
        grid-column:2!important;
        grid-row:1!important;
        min-width:0!important;
        width:auto!important;
        margin:0!important;
        padding:0!important;
        color:#213e53!important;
        -webkit-text-fill-color:#213e53!important;
        font-size:12.5px!important;
        font-weight:850!important;
        line-height:1.2!important;
        text-align:left!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }

      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button small,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button small{
        position:static!important;
        display:block!important;
        grid-column:3!important;
        grid-row:1!important;
        justify-self:end!important;
        align-self:center!important;
        min-width:28px!important;
        margin:0!important;
        padding:0!important;
        color:#6f8393!important;
        -webkit-text-fill-color:#6f8393!important;
        font-size:9.5px!important;
        font-weight:800!important;
        line-height:1!important;
        text-align:right!important;
        white-space:nowrap!important;
      }

      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button.is-active,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button.is-active{
        border-color:#32a7dc!important;
        background:#eef9fe!important;
        box-shadow:inset 0 0 0 1px rgba(50,167,220,.14)!important;
      }
      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button.is-active>span,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button.is-active>span{
        background:#d9f0fb!important;
        color:#117eaf!important;
        -webkit-text-fill-color:#117eaf!important;
      }
      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button.is-active strong,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button.is-active strong{
        color:#0c6f9f!important;
        -webkit-text-fill-color:#0c6f9f!important;
      }

      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button.is-합격 small,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button.is-합격 small{
        color:#168653!important;
        -webkit-text-fill-color:#168653!important;
      }
      .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs button.is-불합격 small,
      .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs button.is-불합격 small{
        color:#c43f49!important;
        -webkit-text-fill-color:#c43f49!important;
      }

      @media(max-width:980px){
        .qmes-field-mode-unify[data-qmes-mode='PQC'] .qmes-ipad-item-tabs,
        .qmes-field-mode-unify[data-qmes-mode='OQC'] .qmes-ipad-item-tabs{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function apply(){
    const root=document.querySelector('.qmes-ipad-pop.qmes-field-mode-unify');
    if(!root) return;
    const mode=root.dataset.qmesMode||'';
    if(mode==='PQC'||mode==='OQC') ensureStyle();
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      apply();
      setTimeout(apply,40);
    });
  }

  document.addEventListener('click',event=>{
    if(event.target instanceof Element&&event.target.closest('.qmes-ipad-mode-tabs button,.qmes-ipad-item-tabs button')) setTimeout(schedule,0);
  },true);
  window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  const start=()=>{if(!document.body)return;new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-qmes-mode']});schedule();};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
