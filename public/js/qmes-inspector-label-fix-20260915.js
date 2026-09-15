/* NAMO QMES - field inspection header inspector label fix (2026-09-15)
 * Removes the duplicate synthetic "검사자 :" label added by the visual patch.
 * Existing inspector/department/name controls remain unchanged.
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

    .qmes-field-mode-unify .qmes-ipad-inspector,
    .qmes-field-redesign .qmes-ipad-inspector,
    .qmes-iqc-redesign .qmes-ipad-inspector{
      justify-content:flex-end!important;
      gap:0!important;
      width:auto!important;
      min-width:190px!important;
      padding-left:10px!important;
      padding-right:10px!important;
    }
  `;
  document.head.appendChild(style);
})();
