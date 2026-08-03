(function(){
  "use strict";
  if(window.__QMES_WORKORDER_PRINT_CLEANUP__) return;
  window.__QMES_WORKORDER_PRINT_CLEANUP__=true;

  /* 작업지시서 화면은 React 구조를 변경하지 않고 CSS로만 정리한다. */
  const style=document.createElement("style");
  style.id="qmes-workorder-list-alignment-style";
  style.textContent=`
    .qmes-issued-table-v2{
      width:100%!important;
      table-layout:fixed!important;
      border-collapse:collapse!important;
    }
    .qmes-issued-table-v2 th,
    .qmes-issued-table-v2 td{
      box-sizing:border-box!important;
      height:46px!important;
      padding:8px 6px!important;
      text-align:center!important;
      vertical-align:middle!important;
      line-height:20px!important;
      letter-spacing:0!important;
      white-space:nowrap!important;
      font-variant-numeric:tabular-nums!important;
    }
    .qmes-issued-table-v2 th{
      font-size:12px!important;
      font-weight:700!important;
    }
    .qmes-issued-table-v2 td{
      font-size:13px!important;
    }
    .qmes-issued-table-v2 td button,
    .qmes-issued-table-v2 td select{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
    }

    /* 기본정보: 작업지시번호 숨김, LOT No. 표기, 나머지 4칸 균등 배치 */
    .qmes-wo-cert .qmes-iqc2-first .qmes-iqc2-table,
    [id^="qmes-issued-cert-"] .qmes-iqc2-first .qmes-iqc2-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-wo-cert .qmes-iqc2-first .qmes-iqc2-table th:first-child,
    .qmes-wo-cert .qmes-iqc2-first .qmes-iqc2-table td:first-child,
    [id^="qmes-issued-cert-"] .qmes-iqc2-first .qmes-iqc2-table th:first-child,
    [id^="qmes-issued-cert-"] .qmes-iqc2-first .qmes-iqc2-table td:first-child{
      display:none!important;
    }
    .qmes-wo-cert .qmes-iqc2-first .qmes-iqc2-table th:not(:first-child),
    .qmes-wo-cert .qmes-iqc2-first .qmes-iqc2-table td:not(:first-child),
    [id^="qmes-issued-cert-"] .qmes-iqc2-first .qmes-iqc2-table th:not(:first-child),
    [id^="qmes-issued-cert-"] .qmes-iqc2-first .qmes-iqc2-table td:not(:first-child){
      box-sizing:border-box!important;
      width:25%!important;
      text-align:center!important;
      vertical-align:middle!important;
      padding-left:8px!important;
      padding-right:8px!important;
    }
    .qmes-wo-cert .qmes-iqc2-first .qmes-iqc2-table th:nth-child(2),
    [id^="qmes-issued-cert-"] .qmes-iqc2-first .qmes-iqc2-table th:nth-child(2){
      font-size:0!important;
    }
    .qmes-wo-cert .qmes-iqc2-first .qmes-iqc2-table th:nth-child(2)::after,
    [id^="qmes-issued-cert-"] .qmes-iqc2-first .qmes-iqc2-table th:nth-child(2)::after{
      content:"LOT No.";
      font-size:11px!important;
      font-weight:700!important;
      line-height:1.4!important;
    }

    /* 미리보기: NO 및 숫자 1~7 첫 열 축소 */
    .qmes-wo-viewer.qmes-wo-detail-preview .qmes-wo-cert-material-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-wo-viewer.qmes-wo-detail-preview .qmes-wo-cert-material-table th:first-child,
    .qmes-wo-viewer.qmes-wo-detail-preview .qmes-wo-cert-material-table td:first-child{
      box-sizing:border-box!important;
      width:22px!important;
      min-width:22px!important;
      max-width:22px!important;
      padding-left:0!important;
      padding-right:0!important;
      text-align:center!important;
      vertical-align:middle!important;
      white-space:nowrap!important;
      writing-mode:horizontal-tb!important;
      text-transform:uppercase!important;
      font-size:10px!important;
    }

    /* 인쇄 버튼 화면과 실제 인쇄물: NO 첫 열을 미리보기보다 조금 넓게 */
    .qmes-wo-viewer:not(.qmes-wo-detail-preview) .qmes-wo-cert-material-table,
    #qmes-print-root .qmes-wo-cert-material-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-wo-viewer:not(.qmes-wo-detail-preview) .qmes-wo-cert-material-table th:first-child,
    .qmes-wo-viewer:not(.qmes-wo-detail-preview) .qmes-wo-cert-material-table td:first-child,
    #qmes-print-root .qmes-wo-cert-material-table th:first-child,
    #qmes-print-root .qmes-wo-cert-material-table td:first-child{
      box-sizing:border-box!important;
      width:34px!important;
      min-width:34px!important;
      max-width:34px!important;
      padding-left:3px!important;
      padding-right:3px!important;
      text-align:center!important;
      vertical-align:middle!important;
      white-space:nowrap!important;
      writing-mode:horizontal-tb!important;
      text-transform:uppercase!important;
      font-size:10px!important;
    }

    @media print{
      .qmes-wo-cert-material-table th:first-child,
      .qmes-wo-cert-material-table td:first-child{
        width:34px!important;
        min-width:34px!important;
        max-width:34px!important;
        padding-left:3px!important;
        padding-right:3px!important;
        text-align:center!important;
        white-space:nowrap!important;
        writing-mode:horizontal-tb!important;
        text-transform:uppercase!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
