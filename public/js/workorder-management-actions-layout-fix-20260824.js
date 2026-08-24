/* QMES work-order status/management responsive layout - 2026-08-24
 * Keep the issued work-order table inside the available content width even when
 * the left menu is expanded. Avoid fixed minimum widths that force horizontal scroll.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_MANAGEMENT_ACTIONS_RESPONSIVE_20260824__) return;
  window.__QMES_WORKORDER_MANAGEMENT_ACTIONS_RESPONSIVE_20260824__=true;

  const style=document.createElement("style");
  style.id="qmes-workorder-management-actions-layout-fix-20260824";
  style.textContent=`
    .qmes-issued-table-wrap,
    .qmes-wo-list-table-wrap{
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      overflow-x:hidden!important;
    }

    .qmes-issued-table-v2,
    .qmes-wo-list-table{
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      table-layout:fixed!important;
    }

    /* 10 = 상태 */
    .qmes-issued-table-v2 th:nth-child(10),
    .qmes-issued-table-v2 td:nth-child(10),
    .qmes-wo-list-table th:nth-child(10),
    .qmes-wo-list-table td:nth-child(10){
      width:7%!important;
      min-width:0!important;
      max-width:none!important;
      padding-left:3px!important;
      padding-right:3px!important;
      text-align:center!important;
      white-space:nowrap!important;
    }

    .qmes-issued-table-v2 td:nth-child(10) select,
    .qmes-wo-list-table td:nth-child(10) select{
      display:block!important;
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      max-width:78px!important;
      height:28px!important;
      margin:0 auto!important;
      padding-left:4px!important;
      padding-right:17px!important;
      text-align:center!important;
      font-size:10px!important;
    }

    /* 11 = 관리: fixed 250~270px removed so sidebar-open layout can shrink */
    .qmes-issued-table-v2 th:last-child,
    .qmes-issued-table-v2 td:last-child,
    .qmes-wo-list-table th:last-child,
    .qmes-wo-list-table td:last-child{
      width:16%!important;
      min-width:0!important;
      max-width:none!important;
      padding-left:2px!important;
      padding-right:2px!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:clip!important;
      text-align:center!important;
      vertical-align:middle!important;
    }

    .qmes-workorder-actions{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      flex-wrap:nowrap!important;
      gap:2px!important;
      width:100%!important;
      min-width:0!important;
      white-space:nowrap!important;
    }

    .qmes-issued-table-v2 td:last-child button,
    .qmes-wo-list-table td:last-child button,
    .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
    .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      box-sizing:border-box!important;
      width:auto!important;
      min-width:0!important;
      max-width:100%!important;
      height:27px!important;
      min-height:27px!important;
      margin:0!important;
      padding:0 4px!important;
      line-height:1!important;
      white-space:nowrap!important;
      float:none!important;
      font-size:9px!important;
      flex:0 1 auto!important;
    }

    @media(max-width:1500px){
      .qmes-issued-table-v2 th:last-child,
      .qmes-issued-table-v2 td:last-child,
      .qmes-wo-list-table th:last-child,
      .qmes-wo-list-table td:last-child{width:17%!important;}
      .qmes-issued-table-v2 th:nth-child(10),
      .qmes-issued-table-v2 td:nth-child(10),
      .qmes-wo-list-table th:nth-child(10),
      .qmes-wo-list-table td:nth-child(10){width:7.5%!important;}
      .qmes-issued-table-v2 td:last-child button,
      .qmes-wo-list-table td:last-child button,
      .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
      .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{padding:0 3px!important;font-size:8.5px!important;}
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);
})();
