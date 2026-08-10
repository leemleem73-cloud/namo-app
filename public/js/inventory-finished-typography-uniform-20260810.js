/* QMES finished-goods inventory typography uniformity - additive patch */
(function installFinishedInventoryTypography(global) {
  "use strict";
  if (global.__QMES_FINISHED_INVENTORY_TYPOGRAPHY__) return;
  global.__QMES_FINISHED_INVENTORY_TYPOGRAPHY__ = true;

  const style = document.createElement("style");
  style.id = "qmes-finished-inventory-typography";
  style.textContent = `
    table.qmes-finished-inventory-uniform thead th {
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
      letter-spacing: 0 !important;
      color: #93a9c2 !important;
    }
    table.qmes-finished-inventory-uniform tbody td {
      font-size: 14px !important;
      line-height: 1.35 !important;
      letter-spacing: 0 !important;
    }
    table.qmes-finished-inventory-uniform tbody td:not(:last-child),
    table.qmes-finished-inventory-uniform tbody td:not(:last-child) > span,
    table.qmes-finished-inventory-uniform tbody td[colspan] {
      color: #dbeafe !important;
      font-size: 14px !important;
    }
  `;
  document.head.appendChild(style);

  function apply() {
    const table = Array.from(document.querySelectorAll("table")).find((candidate) => {
      const header = String(candidate.tHead?.textContent || "");
      return header.includes("완제품 LOT")
        && header.includes("품목")
        && header.includes("생산량")
        && header.includes("출하량")
        && header.includes("보관구역");
    });
    if (!table) return false;
    table.classList.add("qmes-finished-inventory-uniform");
    return true;
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    global.requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  global.addEventListener("qmes:data-updated", schedule);
  global.addEventListener("qmes:finished-goods-inventory-ready", schedule);
})(window);
