/* NAMO QMES - Sales/Due remove duplicate delivery-place column
 * 2026-09-18
 * ADD-ONLY.
 * In the current Sales/Due ledger, 거래처명 is kept as the single customer/delivery display.
 * Underlying deliveryPlace data is preserved for detail/edit screens.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_HIDE_DELIVERY_COLUMN_20260918__) return;
  window.__QMES_SALES_HIDE_DELIVERY_COLUMN_20260918__ = true;

  const id='qmes-sales-hide-delivery-column-20260918-style';
  if(document.getElementById(id)) return;

  const style=document.createElement('style');
  style.id=id;
  style.textContent=
    '.qmes-sales-stable.qrl-owner table thead th:nth-child(11),' +
    '.qmes-sales-stable.qrl-owner table tbody td:nth-child(11){display:none!important;}';
  document.head.appendChild(style);
})();