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
      body.print-doc #qmes-print-root > .qmes-screen-print-copy.qmes-wo-cert{
        position:absolute!important;
        top:50%!important;
        left:50%!important;
        margin:0!important;
        transform:translate(-50%,-50%) scale(.82)!important;
        transform-origin:center center!important;
      }
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

      /* 출하성적서: 출력 버튼 화면의 크기·간격·테두리를 그대로 인쇄 복제본에 사용 */
      body.print-doc #qmes-print-root > .qmes-coa-unified-doc,
      body.print-doc #qmes-print-root > .qmes-screen-print-copy.qmes-coa-unified-doc{
        box-sizing:border-box!important;
        width:960px!important;
        max-width:calc(100% - 32px)!important;
        min-height:auto!important;
        margin:16px auto!important;
        padding:34px 38px!important;
        box-shadow:none!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-unified-doc > .qmes-coa-header{
        min-height:88px!important;
        padding:4px 0 16px!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-unified-doc > .qmes-coa-header > *{
        transform:translateY(-8px)!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-unified-doc > div:nth-child(2){
        margin-top:18px!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-unified-doc > div:nth-child(2) > div:nth-last-child(-n+2){
        border-bottom:1px solid #94a3b8!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-unified-doc > table{
        margin-top:46px!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-footer{
        grid-template-columns:minmax(0,1fr) 470px!important;
        gap:34px!important;
        margin-top:56px!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-sign-table{
        width:470px!important;
      }
      body.print-doc #qmes-print-root .qmes-coa-sign-table td{
        height:96px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
