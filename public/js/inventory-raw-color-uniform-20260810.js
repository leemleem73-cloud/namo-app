/* QMES raw inventory color uniformity - additive patch */
(function installRawInventoryColorUniformity(global) {
  "use strict";
  if (global.__QMES_RAW_INVENTORY_COLOR_UNIFORMITY__) return;
  global.__QMES_RAW_INVENTORY_COLOR_UNIFORMITY__ = true;

  const style = document.createElement("style");
  style.id = "qmes-raw-inventory-color-uniformity";
  style.textContent = `
    table.qmes-raw-inventory-balanced thead th {
      color: #93a9c2 !important;
    }
    table.qmes-raw-inventory-balanced tbody td:not(:last-child),
    table.qmes-raw-inventory-balanced tbody td:not(:last-child) > span {
      color: #dbeafe !important;
    }
  `;
  document.head.appendChild(style);
})(window);
