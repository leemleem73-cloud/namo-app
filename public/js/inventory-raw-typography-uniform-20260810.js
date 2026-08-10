/* QMES raw inventory typography uniformity - additive patch */
(function installRawInventoryTypographyUniformity(global) {
  "use strict";
  if (global.__QMES_RAW_INVENTORY_TYPOGRAPHY_UNIFORMITY__) return;
  global.__QMES_RAW_INVENTORY_TYPOGRAPHY_UNIFORMITY__ = true;

  const style = document.createElement("style");
  style.id = "qmes-raw-inventory-typography-uniformity";
  style.textContent = `
    table.qmes-raw-inventory-balanced thead th {
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
      letter-spacing: 0 !important;
    }
    table.qmes-raw-inventory-balanced tbody td {
      font-size: 14px !important;
      line-height: 1.35 !important;
      letter-spacing: 0 !important;
    }
    table.qmes-raw-inventory-balanced tbody td > span {
      font-size: 14px !important;
      line-height: 1.35 !important;
    }
  `;
  document.head.appendChild(style);
})(window);
