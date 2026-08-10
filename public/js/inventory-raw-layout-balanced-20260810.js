/* QMES raw inventory balanced layout - additive patch, 2026-08-10 */
(function installBalancedRawInventoryLayout(global) {
  "use strict";
  if (global.__QMES_RAW_INVENTORY_BALANCED_LAYOUT__) return;
  global.__QMES_RAW_INVENTORY_BALANCED_LAYOUT__ = true;

  const style = document.createElement("style");
  style.id = "qmes-raw-inventory-balanced-layout";
  style.textContent = `
    .qmes-raw-inventory-balanced-wrap {
      width: 1460px !important;
      max-width: none !important;
      margin: 0 !important;
    }
    table.qmes-raw-inventory-balanced {
      width: 1460px !important;
      min-width: 1460px !important;
      table-layout: fixed !important;
      margin: 0 !important;
    }
    table.qmes-raw-inventory-balanced col:nth-child(1) { width: 130px !important; }
    table.qmes-raw-inventory-balanced col:nth-child(2) { width: 220px !important; }
    table.qmes-raw-inventory-balanced col:nth-child(3) { width: 100px !important; }
    table.qmes-raw-inventory-balanced col:nth-child(4) { width: 100px !important; }
    table.qmes-raw-inventory-balanced col:nth-child(5) { width: 210px !important; }
    table.qmes-raw-inventory-balanced col:nth-child(6) { width: 260px !important; }
    table.qmes-raw-inventory-balanced col:nth-child(7) { width: 350px !important; }
    table.qmes-raw-inventory-balanced col:nth-child(8) { width: 90px !important; }
    table.qmes-raw-inventory-balanced th,
    table.qmes-raw-inventory-balanced td {
      padding-left: 8px !important;
      padding-right: 8px !important;
      white-space: nowrap;
    }
    .qmes-raw-inventory-balanced-footer {
      width: 1460px !important;
      max-width: none !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
  `;
  document.head.appendChild(style);

  function applyLayout() {
    const tables = Array.from(document.querySelectorAll("table"));
    const table = tables.find((candidate) => {
      const header = String(candidate.tHead?.textContent || candidate.textContent || "");
      return header.includes("자재코드")
        && header.includes("품명")
        && header.includes("현재고")
        && header.includes("안전재고")
        && header.includes("보관위치")
        && header.includes("보관조건");
    });
    if (!table) return false;

    table.classList.add("qmes-raw-inventory-balanced");
    const inner = table.parentElement;
    if (inner) inner.classList.add("qmes-raw-inventory-balanced-wrap");
    const outer = inner?.parentElement;
    const footer = outer?.nextElementSibling;
    if (footer?.tagName === "P") footer.classList.add("qmes-raw-inventory-balanced-footer");
    return true;
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    global.requestAnimationFrame(() => {
      queued = false;
      applyLayout();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  global.addEventListener("qmes:inventory-stage3-ready", schedule);
  global.addEventListener("qmes:data-updated", schedule);
})(window);
