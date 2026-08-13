/* QMES inventory visual refinement - borderless + unified white text - 2026-08-13 */
(function(global){
  "use strict";
  if(global.__QMES_INVENTORY_BORDERLESS_WHITE_V1__) return;
  global.__QMES_INVENTORY_BORDERLESS_WHITE_V1__=true;

  const style=document.createElement("style");
  style.id="qmes-inventory-borderless-white-v1";
  style.textContent=`
    .qmes-inventory-premium-scope .qmes-premium-kpi-card{
      border:0!important;
      box-shadow:none!important;
    }
    .qmes-inventory-premium-scope .qmes-premium-kpi-card:before{display:none!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card,
    .qmes-inventory-premium-scope .qmes-premium-kpi-card *{color:#fff!important}

    .qmes-inventory-premium-scope .qmes-premium-panel{
      border:0!important;
      box-shadow:none!important;
    }
    .qmes-inventory-premium-scope .qmes-premium-panel *{border-color:transparent!important}

    .qmes-inventory-premium-scope table.qmes-premium-inventory-table{
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead th,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td:first-child,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-gray-"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-sky-"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-emerald-"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-amber-"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-rose-"]{color:#fff!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead th,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td{border:0!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table input,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table select{
      color:#fff!important;
      border:0!important;
      box-shadow:none!important;
    }
    .qmes-inventory-premium-scope .qmes-premium-danger-cell{
      color:#fff!important;
      border:0!important;
    }
  `;
  document.head.appendChild(style);
})(window);
