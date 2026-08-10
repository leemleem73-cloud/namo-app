/* QMES raw inventory column spacing v3 - additive patch, 2026-08-10
 * Moves current-stock slightly left and preserves full-width balance.
 */
(function installRawInventoryColumnSpacingV3(global){
  "use strict";
  if(global.__QMES_RAW_INVENTORY_COLUMN_SPACING_V3__) return;
  global.__QMES_RAW_INVENTORY_COLUMN_SPACING_V3__=true;

  const style=document.createElement("style");
  style.id="qmes-raw-inventory-column-spacing-v3";
  style.textContent=`
    table.qmes-raw-inventory-balanced col:nth-child(1){width:8% !important;}
    table.qmes-raw-inventory-balanced col:nth-child(2){width:14% !important;}
    table.qmes-raw-inventory-balanced col:nth-child(3){width:10% !important;}
    table.qmes-raw-inventory-balanced col:nth-child(4){width:10% !important;}
    table.qmes-raw-inventory-balanced col:nth-child(5){width:17% !important;}
    table.qmes-raw-inventory-balanced col:nth-child(6){width:18% !important;}
    table.qmes-raw-inventory-balanced col:nth-child(7){width:15% !important;}
    table.qmes-raw-inventory-balanced col:nth-child(8){width:8% !important;}
  `;
  document.head.appendChild(style);
})(window);
