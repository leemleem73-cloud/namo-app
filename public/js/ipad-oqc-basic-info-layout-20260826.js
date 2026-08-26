/* OQC field input: stable layout-only order. Does not move/clone React DOM nodes. */
(function(){
  'use strict';
  if(document.getElementById('qmes-oqc-basic-info-layout-20260826')) return;
  const style=document.createElement('style');
  style.id='qmes-oqc-basic-info-layout-20260826';
  style.textContent=`
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;grid-auto-flow:row!important;align-items:stretch!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label{min-width:0!important;max-width:none!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(3){order:1!important;grid-column:auto!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(1){order:2!important;grid-column:auto!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(2){order:3!important;grid-column:auto!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(5){order:4!important;grid-column:auto!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(6){order:5!important;grid-column:auto!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(4){order:6!important;grid-column:auto!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(7){display:none!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(8){order:7!important;grid-column:auto!important;}
    .qmes-ipad-pop:has(.qmes-ipad-mode-tabs button:nth-child(3).is-active) .qmes-ipad-form-grid>label:nth-of-type(9){order:8!important;grid-column:1/-1!important;}
  `;
  document.head.appendChild(style);
})();
