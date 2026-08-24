/* QMES work-order status/management column alignment - 2026-08-24
 * Narrows the Status column and gives Management enough fixed space so the
 * result button aligns with Preview / Print / Delete on one row.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_MANAGEMENT_ACTIONS_LAYOUT_FIX_20260824_V2__) return;
  window.__QMES_WORKORDER_MANAGEMENT_ACTIONS_LAYOUT_FIX_20260824_V2__=true;

  const style=document.createElement("style");
  style.id="qmes-workorder-management-actions-layout-fix-20260824";
  style.textContent=`
    /* 10 = 상태, 11 = 관리 */
    .qmes-issued-table-v2 th:nth-child(10),
    .qmes-issued-table-v2 td:nth-child(10),
    .qmes-wo-list-table th:nth-child(10),
    .qmes-wo-list-table td:nth-child(10){
      width:105px!important;
      min-width:105px!important;
      max-width:105px!important;
      padding-left:5px!important;
      padding-right:5px!important;
      text-align:center!important;
      white-space:nowrap!important;
    }

    .qmes-issued-table-v2 td:nth-child(10) select,
    .qmes-wo-list-table td:nth-child(10) select{
      display:block!important;
      box-sizing:border-box!important;
      width:88px!important;
      min-width:88px!important;
      max-width:88px!important;
      height:30px!important;
      margin:0 auto!important;
      padding-left:8px!important;
      padding-right:22px!important;
      text-align:center!important;
    }

    .qmes-issued-table-v2 th:last-child,
    .qmes-issued-table-v2 td:last-child,
    .qmes-wo-list-table th:last-child,
    .qmes-wo-list-table td:last-child{
      width:270px!important;
      min-width:270px!important;
      max-width:270px!important;
      padding-left:5px!important;
      padding-right:5px!important;
      white-space:nowrap!important;
      overflow:visible!important;
      text-overflow:clip!important;
      text-align:center!important;
      vertical-align:middle!important;
    }

    .qmes-issued-table-v2 td:last-child button,
    .qmes-wo-list-table td:last-child button,
    .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
    .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      vertical-align:middle!important;
      box-sizing:border-box!important;
      width:auto!important;
      min-width:0!important;
      min-height:28px!important;
      height:28px!important;
      margin:0 2px!important;
      padding:0 7px!important;
      line-height:1!important;
      white-space:nowrap!important;
      float:none!important;
    }

    .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
    .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{
      margin-top:0!important;
      margin-bottom:0!important;
    }

    @media(max-width:1500px){
      .qmes-issued-table-v2 th:nth-child(10),
      .qmes-issued-table-v2 td:nth-child(10),
      .qmes-wo-list-table th:nth-child(10),
      .qmes-wo-list-table td:nth-child(10){
        width:92px!important;
        min-width:92px!important;
        max-width:92px!important;
      }
      .qmes-issued-table-v2 td:nth-child(10) select,
      .qmes-wo-list-table td:nth-child(10) select{
        width:78px!important;
        min-width:78px!important;
        max-width:78px!important;
      }
      .qmes-issued-table-v2 th:last-child,
      .qmes-issued-table-v2 td:last-child,
      .qmes-wo-list-table th:last-child,
      .qmes-wo-list-table td:last-child{
        width:250px!important;
        min-width:250px!important;
        max-width:250px!important;
      }
      .qmes-issued-table-v2 td:last-child button,
      .qmes-wo-list-table td:last-child button,
      .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
      .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{
        margin:0 1px!important;
        padding:0 5px!important;
        font-size:11px!important;
      }
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);
})();
