(function(){
  "use strict";
  if(window.__QMES_WORKORDER_PRINT_CLEANUP__) return;
  window.__QMES_WORKORDER_PRINT_CLEANUP__=true;

  /*
   * 작업지시서 미리보기는 React가 직접 관리한다.
   * 미리보기 내부의 표·구역을 삭제하거나 변경하면 다음 렌더링에서
   * 내용 전체가 사라질 수 있으므로 이 파일에서는 DOM을 조작하지 않는다.
   */
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
  `;
  document.head.appendChild(style);
})();
