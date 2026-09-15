/* NAMO QMES - field inspection header inspector layout fix (2026-09-15)
 * Keeps one inspector label and aligns department/name controls cleanly.
 * Applies consistently to IQC/PQC/OQC field input headers.
 */
(function(){
  'use strict';
  if(window.__QMES_INSPECTOR_LABEL_FIX_20260915__) return;
  window.__QMES_INSPECTOR_LABEL_FIX_20260915__=true;

  const STYLE_ID='qmes-inspector-label-fix-style-20260915';
  if(document.getElementById(STYLE_ID)) return;

  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .qmes-field-mode-unify .qmes-ipad-inspector::before,
    .qmes-field-redesign .qmes-ipad-inspector::before,
    .qmes-iqc-redesign .qmes-ipad-inspector::before{
      content:none!important;
      display:none!important;
    }

    .qmes-field-mode-unify .qmes-ipad-work-head,
    .qmes-field-redesign .qmes-ipad-work-head,
    .qmes-iqc-redesign .qmes-ipad-work-head{
      grid-template-columns:180px minmax(0,1fr) 320px!important;
      column-gap:18px!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector,
    .qmes-field-redesign .qmes-ipad-inspector,
    .qmes-iqc-redesign .qmes-ipad-inspector{
      justify-self:end!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      gap:8px!important;
      width:300px!important;
      min-width:300px!important;
      min-height:42px!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:#203b50!important;
      font-size:12px!important;
      font-weight:850!important;
      white-space:nowrap!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector>span:first-child,
    .qmes-field-mode-unify .qmes-ipad-inspector>label:first-child,
    .qmes-field-redesign .qmes-ipad-inspector>span:first-child,
    .qmes-field-redesign .qmes-ipad-inspector>label:first-child,
    .qmes-iqc-redesign .qmes-ipad-inspector>span:first-child,
    .qmes-iqc-redesign .qmes-ipad-inspector>label:first-child{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      flex:0 0 auto!important;
      margin:0 2px 0 0!important;
      padding:0!important;
      color:#203b50!important;
      -webkit-text-fill-color:#203b50!important;
      font-size:12px!important;
      font-weight:900!important;
      line-height:1!important;
      white-space:nowrap!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector strong,
    .qmes-field-redesign .qmes-ipad-inspector strong,
    .qmes-iqc-redesign .qmes-ipad-inspector strong{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      flex:0 0 82px!important;
      min-width:82px!important;
      width:82px!important;
      height:36px!important;
      margin:0!important;
      padding:0 10px!important;
      border:1px solid #d2dee7!important;
      border-radius:9px!important;
      background:#f6f9fb!important;
      color:#263f52!important;
      -webkit-text-fill-color:#263f52!important;
      font-size:12px!important;
      font-weight:850!important;
      box-sizing:border-box!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector input,
    .qmes-field-redesign .qmes-ipad-inspector input,
    .qmes-iqc-redesign .qmes-ipad-inspector input{
      flex:1 1 132px!important;
      width:132px!important;
      min-width:0!important;
      max-width:150px!important;
      height:36px!important;
      min-height:36px!important;
      margin:0!important;
      padding:0 12px!important;
      border:1px solid #cbd8e2!important;
      border-radius:9px!important;
      background:#fff!important;
      color:#263f52!important;
      -webkit-text-fill-color:#263f52!important;
      font-size:12px!important;
      font-weight:700!important;
      text-align:left!important;
      box-shadow:none!important;
      box-sizing:border-box!important;
    }

    .qmes-field-mode-unify .qmes-ipad-inspector input::placeholder,
    .qmes-field-redesign .qmes-ipad-inspector input::placeholder,
    .qmes-iqc-redesign .qmes-ipad-inspector input::placeholder{
      color:#8ba0b2!important;
      opacity:1!important;
    }

    @media(max-width:900px){
      .qmes-field-mode-unify .qmes-ipad-work-head,
      .qmes-field-redesign .qmes-ipad-work-head,
      .qmes-iqc-redesign .qmes-ipad-work-head{
        grid-template-columns:150px minmax(0,1fr) 280px!important;
        column-gap:10px!important;
      }
      .qmes-field-mode-unify .qmes-ipad-inspector,
      .qmes-field-redesign .qmes-ipad-inspector,
      .qmes-iqc-redesign .qmes-ipad-inspector{
        width:270px!important;
        min-width:270px!important;
      }
    }

    @media(max-width:760px){
      .qmes-field-mode-unify .qmes-ipad-work-head,
      .qmes-field-redesign .qmes-ipad-work-head,
      .qmes-iqc-redesign .qmes-ipad-work-head{
        grid-template-columns:1fr!important;
      }
      .qmes-field-mode-unify .qmes-ipad-inspector,
      .qmes-field-redesign .qmes-ipad-inspector,
      .qmes-iqc-redesign .qmes-ipad-inspector{
        justify-self:stretch!important;
        justify-content:center!important;
        width:100%!important;
        min-width:0!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
