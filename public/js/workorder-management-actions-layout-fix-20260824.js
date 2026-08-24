/* QMES work-order management action layout fix - 2026-08-24
 * Keeps Preview / Print / Delete / Result buttons on one line.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_MANAGEMENT_ACTIONS_LAYOUT_FIX_20260824__) return;
  window.__QMES_WORKORDER_MANAGEMENT_ACTIONS_LAYOUT_FIX_20260824__=true;

  const style=document.createElement("style");
  style.id="qmes-workorder-management-actions-layout-fix-20260824";
  style.textContent=`
    .qmes-issued-table-v2 th:last-child,
    .qmes-issued-table-v2 td:last-child,
    .qmes-wo-list-table th:last-child,
    .qmes-wo-list-table td:last-child{
      width:250px!important;
      min-width:250px!important;
      max-width:250px!important;
      padding-left:6px!important;
      padding-right:6px!important;
      white-space:nowrap!important;
      overflow:visible!important;
      text-overflow:clip!important;
      text-align:center!important;
    }

    .qmes-issued-table-v2 td:last-child button,
    .qmes-wo-list-table td:last-child button{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      vertical-align:middle!important;
      min-width:auto!important;
      width:auto!important;
      min-height:28px!important;
      height:28px!important;
      margin:0 3px!important;
      padding:0 8px!important;
      line-height:1!important;
      white-space:nowrap!important;
      float:none!important;
    }

    .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut,
    .qmes-wo-list-table td:last-child .qmes-production-result-shortcut{
      display:inline-flex!important;
      min-height:28px!important;
      height:28px!important;
      margin:0 3px!important;
      padding:0 8px!important;
    }

    @media(max-width:1500px){
      .qmes-issued-table-v2 th:last-child,
      .qmes-issued-table-v2 td:last-child,
      .qmes-wo-list-table th:last-child,
      .qmes-wo-list-table td:last-child{
        width:230px!important;
        min-width:230px!important;
        max-width:230px!important;
      }
      .qmes-issued-table-v2 td:last-child button,
      .qmes-wo-list-table td:last-child button{
        margin:0 2px!important;
        padding:0 6px!important;
        font-size:11px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
