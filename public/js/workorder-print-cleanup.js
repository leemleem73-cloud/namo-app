(function(){
  "use strict";
  if(window.__QMES_WORKORDER_PRINT_CLEANUP__) return;
  window.__QMES_WORKORDER_PRINT_CLEANUP__=true;

  const style=document.createElement("style");
  style.id="qmes-workorder-list-alignment-style";
  style.textContent=`
    .qmes-issued-table-v2{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
    .qmes-issued-table-v2 th,.qmes-issued-table-v2 td{box-sizing:border-box!important;height:46px!important;padding:8px 6px!important;text-align:center!important;vertical-align:middle!important;line-height:20px!important;letter-spacing:0!important;white-space:nowrap!important;font-variant-numeric:tabular-nums!important}
    .qmes-issued-table-v2 th{font-size:12px!important;font-weight:700!important}
    .qmes-issued-table-v2 td{font-size:13px!important}
    .qmes-issued-table-v2 td button,.qmes-issued-table-v2 td select{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:auto!important;margin-right:auto!important;text-align:center!important}
    .qmes-wo-cert .qmes-wo-basic-info-table,[id^="qmes-issued-cert-"] .qmes-wo-basic-info-table{width:100%!important;table-layout:fixed!important}
    .qmes-wo-cert .qmes-wo-basic-info-table th,.qmes-wo-cert .qmes-wo-basic-info-table td,[id^="qmes-issued-cert-"] .qmes-wo-basic-info-table th,[id^="qmes-issued-cert-"] .qmes-wo-basic-info-table td{box-sizing:border-box!important;width:25%!important;text-align:center!important;vertical-align:middle!important;padding-left:8px!important;padding-right:8px!important}
    .qmes-wo-cert .qmes-wo-basic-info-table th:first-child,[id^="qmes-issued-cert-"] .qmes-wo-basic-info-table th:first-child{display:table-cell!important;font-size:15px!important;font-weight:700!important}
    .qmes-wo-cert-material-table{width:100%!important;table-layout:fixed!important}
    .qmes-wo-cert-material-table th:first-child,.qmes-wo-cert-material-table td:first-child{box-sizing:border-box!important;width:4%!important;min-width:4%!important;max-width:4%!important;padding-left:2px!important;padding-right:2px!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;writing-mode:horizontal-tb!important;text-transform:uppercase!important;font-size:15px!important}
    .qmes-wo-cert-material-table th:first-child{font-weight:700!important}.qmes-wo-cert-material-table td:first-child{font-weight:400!important}
    .qmes-wo-cert-material-table th:nth-child(2){width:17.125%!important}.qmes-wo-cert-material-table th:nth-child(3){width:17.125%!important}.qmes-wo-cert-material-table th:nth-child(4){width:7.125%!important}.qmes-wo-cert-material-table th:nth-child(5){width:10.125%!important}.qmes-wo-cert-material-table th:nth-child(6){width:10.125%!important}.qmes-wo-cert-material-table th:nth-child(7){width:12.125%!important}.qmes-wo-cert-material-table th:nth-child(8){width:8.125%!important}.qmes-wo-cert-material-table th:nth-child(9){width:14.125%!important}
    @media print{
      body.print-doc #qmes-print-root > .qmes-screen-print-copy.qmes-wo-cert{position:absolute!important;top:50%!important;left:50%!important;margin:0!important;transform:translate(-50%,-50%) scale(.82)!important;transform-origin:center center!important}
      .qmes-wo-cert-material-table th:first-child,.qmes-wo-cert-material-table td:first-child{width:4%!important;min-width:4%!important;max-width:4%!important;padding-left:2px!important;padding-right:2px!important;text-align:center!important;white-space:nowrap!important;writing-mode:horizontal-tb!important;text-transform:uppercase!important;font-size:15px!important}
    }
  `;
  document.head.appendChild(style);

  if(!document.querySelector('script[data-qmes-lot-shipment-sync]')){
    const script=document.createElement("script");
    script.src="./js/lot-shipment-sync.js?v=20260804-3";
    script.async=false;
    script.dataset.qmesLotShipmentSync="true";
    document.head.appendChild(script);
  }

  document.querySelector('script[data-qmes-lot-finished-section-tabs]')?.remove();
  if(!document.querySelector('script[data-qmes-lot-finished-section-tabs-v2]')){
    const script=document.createElement("script");
    script.src="./js/lot-finished-section-tabs-v2.js?v=20260804-1512";
    script.async=false;
    script.dataset.qmesLotFinishedSectionTabsV2="true";
    document.head.appendChild(script);
  }
})();
