/* QMES raw inventory material-code typography - additive patch */
(function installMaterialCodeTypography(global) {
  "use strict";
  if (global.__QMES_MATERIAL_CODE_TYPOGRAPHY__) return;
  global.__QMES_MATERIAL_CODE_TYPOGRAPHY__ = true;

  const style = document.createElement("style");
  style.id = "qmes-material-code-typography";
  style.textContent = `
    table.qmes-raw-inventory-balanced th:first-child {
      font-size: 13px !important;
      font-weight: 700 !important;
      letter-spacing: 0.01em !important;
    }
    table.qmes-raw-inventory-balanced td:first-child {
      font-size: 14px !important;
      font-weight: 700 !important;
      letter-spacing: 0.015em !important;
      line-height: 1.35 !important;
    }
  `;
  document.head.appendChild(style);
})(window);
