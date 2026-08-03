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

    /* 기본정보: LOT No.·제품명·설비명·작업자 4칸 균등 배치 */
    .qmes-wo-cert .qmes-wo-basic-info-table,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-wo-cert .qmes-wo-basic-info-table th,
    .qmes-wo-cert .qmes-wo-basic-info-table td,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table th,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table td{
      box-sizing:border-box!important;
      width:25%!important;
      text-align:center!important;
      vertical-align:middle!important;
      padding-left:8px!important;
      padding-right:8px!important;
    }
    .qmes-wo-cert .qmes-wo-basic-info-table th:first-child,
    [id^="qmes-issued-cert-"] .qmes-wo-basic-info-table th:first-child{
      display:table-cell!important;
      font-size:15px!important;
      font-weight:700!important;
    }

    /* 원재료 표: NO·1~7은 크게, 첫 열은 좁게, 줄인 폭은 나머지 열에 균등 분배 */
    .qmes-wo-cert-material-table{
      width:100%!important;
      table-layout:fixed!important;
    }
    .qmes-wo-cert-material-table th:first-child,
    .qmes-wo-cert-material-table td:first-child{
      box-sizing:border-box!important;
      width:4%!important;
      min-width:4%!important;
      max-width:4%!important;
      padding-left:2px!important;
      padding-right:2px!important;
      text-align:center!important;
      vertical-align:middle!important;
      white-space:nowrap!important;
      writing-mode:horizontal-tb!important;
      text-transform:uppercase!important;
      font-size:15px!important;
    }
    .qmes-wo-cert-material-table th:first-child{font-weight:700!important;}
    .qmes-wo-cert-material-table td:first-child{font-weight:400!important;}
    .qmes-wo-cert-material-table th:nth-child(2){width:17.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(3){width:17.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(4){width:7.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(5){width:10.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(6){width:10.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(7){width:12.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(8){width:8.125%!important;}
    .qmes-wo-cert-material-table th:nth-child(9){width:14.125%!important;}

    @media print{
      .qmes-wo-cert-material-table th:first-child,
      .qmes-wo-cert-material-table td:first-child{
        width:4%!important;
        min-width:4%!important;
        max-width:4%!important;
        padding-left:2px!important;
        padding-right:2px!important;
        text-align:center!important;
        white-space:nowrap!important;
        writing-mode:horizontal-tb!important;
        text-transform:uppercase!important;
        font-size:15px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
