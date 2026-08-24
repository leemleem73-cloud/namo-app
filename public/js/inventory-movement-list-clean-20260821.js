/* Inventory table first-paint styles v16: React owns sequence and pagination. */
(function(){
  'use strict';
  if(window.__QMES_INV_TABLE_FIRST_PAINT_V16_20260824__)return;
  window.__QMES_INV_TABLE_ALIGNMENT_V15_20260824__=true;

  const PAGE_SIZE=20;
  let page=1;
  let timer=0;
  let lastTable=null;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();

  function ensureStyle(){
    let style=document.getElementById('qmes-inv-table-alignment-style-v15');
    if(style)return;
    style=document.createElement('style');
    style.id='qmes-inv-table-alignment-style-v15';
    style.textContent=`
      #qmes-inventory-host .inv-movement-panel{padding-left:10px!important;padding-right:18px!important;overflow-x:hidden!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table{width:100%!important;min-width:0!important;margin-left:auto!important;margin-right:auto!important;table-layout:fixed!important;border-collapse:collapse!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table col{width:12.5%!important;min-width:0!important;max-width:none!important}
      #qmes-inventory-host .inv-movement-table thead th{height:42px!important;padding:8px 12px!important;line-height:1.3!important;letter-spacing:0!important;vertical-align:middle!important;border-bottom:1px solid #cbd5e1!important}
      #qmes-inventory-host .inv-movement-table tbody td{height:44px!important;padding:8px 12px!important;line-height:1.3!important;letter-spacing:0!important;vertical-align:middle!important;border-bottom:1px solid #e2e8f0!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table th,#qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table td{box-sizing:border-box!important;text-align:center!important;text-indent:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table th:first-child,#qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table td:first-child,#qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table th:last-child,#qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table td:last-child{padding-left:12px!important;padding-right:12px!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table .inv-tx-detail-link{text-align:center!important}
      #qmes-inventory-host .inv-movement-table th.qmes-inv-seq,#qmes-inventory-host .inv-movement-table td.qmes-inv-seq{text-align:center!important}
      #qmes-inventory-host .inv-movement-table input,#qmes-inventory-host .inv-movement-table select,#qmes-inventory-host .inv-movement-table textarea{width:100%!important;max-width:100%!important;margin:0!important;box-sizing:border-box!important}
      #qmes-inventory-host .inv-movement-table td:nth-child(6){font-variant-numeric:tabular-nums}

      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table{width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important}
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table col{width:11.111111%!important;min-width:0!important;max-width:none!important}

      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table{width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important}
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table:not(.inv-movement-table) th{width:16.666667%!important}
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table.inv-movement-table col{width:14.285714%!important;min-width:0!important;max-width:none!important}
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table th{width:12.5%!important}

      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table th,
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table td,
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table td.num,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table th,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table td,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table td.num,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table th,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table td,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table td.num{box-sizing:border-box!important;height:44px!important;padding:8px 10px!important;line-height:1.3!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-stock-table input,
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-stock-table select,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table input,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table select,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table input,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table select{width:100%!important;max-width:100%!important;margin:0!important;box-sizing:border-box!important;text-align:center!important}

      #qmes-inventory-host .inv-tx-detail-link{display:block!important;width:100%!important;text-align:left!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.35!important}
      #qmes-inventory-host .qmes-inv-pager{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px 8px 4px}
      #qmes-inventory-host .qmes-inv-pager button{min-width:38px;height:34px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;font-weight:800;cursor:pointer}
      #qmes-inventory-host .qmes-inv-pager button.is-active{background:#0ea5e9;border-color:#0ea5e9;color:#fff}
      #qmes-inventory-host .qmes-inv-pager button:disabled{opacity:.4;cursor:default}
      #qmes-inventory-host .qmes-inv-pager .qmes-inv-page-info{margin-left:8px;color:#64748b;font-size:12px;font-weight:700}
    `;
    document.head.appendChild(style);
  }


  ensureStyle();
})();
