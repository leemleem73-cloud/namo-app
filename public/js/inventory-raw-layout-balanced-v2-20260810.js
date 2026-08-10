/* QMES raw inventory balanced layout v2 - full-width distribution, additive patch */
(function installBalancedRawInventoryLayoutV2(global) {
  "use strict";
  if (global.__QMES_RAW_INVENTORY_BALANCED_LAYOUT_V2__) return;
  global.__QMES_RAW_INVENTORY_BALANCED_LAYOUT_V2__ = true;

  const style = document.createElement("style");
  style.id = "qmes-raw-inventory-balanced-layout-v2";
  style.textContent = `
    .qmes-raw-inventory-balanced-wrap {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
    }
    table.qmes-raw-inventory-balanced {
      width: 100% !important;
      min-width: 1120px !important;
      table-layout: fixed !important;
      margin: 0 !important;
    }
    table.qmes-raw-inventory-balanced col:nth-child(1) { width: 7% !important; }
    table.qmes-raw-inventory-balanced col:nth-child(2) { width: 18% !important; }
    table.qmes-raw-inventory-balanced col:nth-child(3) { width: 8% !important; }
    table.qmes-raw-inventory-balanced col:nth-child(4) { width: 8% !important; }
    table.qmes-raw-inventory-balanced col:nth-child(5) { width: 14% !important; }
    table.qmes-raw-inventory-balanced col:nth-child(6) { width: 17% !important; }
    table.qmes-raw-inventory-balanced col:nth-child(7) { width: 20% !important; }
    table.qmes-raw-inventory-balanced col:nth-child(8) { width: 8% !important; }
    .qmes-raw-inventory-balanced-footer {
      width: 100% !important;
      max-width: none !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
  `;
  document.head.appendChild(style);
})(window);
