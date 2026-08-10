/* QMES premium inventory design - additive visual patch only */
(function installPremiumInventoryDesign(global) {
  "use strict";
  if (global.__QMES_PREMIUM_INVENTORY_DESIGN__) return;
  global.__QMES_PREMIUM_INVENTORY_DESIGN__ = true;

  const style = document.createElement("style");
  style.id = "qmes-premium-inventory-design";
  style.textContent = `
    .qmes-premium-summary {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(96, 165, 250, 0.34) !important;
      border-radius: 14px !important;
      background:
        radial-gradient(circle at 92% -20%, rgba(14, 165, 233, 0.15), transparent 34%),
        linear-gradient(145deg, #0d1d31 0%, #081526 100%) !important;
      box-shadow: 0 18px 44px rgba(2, 8, 23, 0.2), inset 0 1px 0 rgba(255,255,255,0.035);
    }
    .qmes-premium-summary::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: linear-gradient(180deg, #38bdf8, #2563eb);
    }
    .qmes-premium-summary .qf-title,
    .qmes-premium-summary > div:first-child {
      color: #7dd3fc !important;
      font-weight: 800 !important;
      letter-spacing: 0.025em !important;
    }
    .qmes-premium-summary .qf-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(96, 165, 250, 0.27) !important;
      border-radius: 11px !important;
      background: linear-gradient(145deg, rgba(22, 43, 68, 0.96), rgba(12, 28, 48, 0.96)) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.035), 0 8px 20px rgba(2,8,23,0.13);
    }
    .qmes-premium-summary .qf-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #38bdf8, #2563eb);
      opacity: 0.8;
    }
    .qmes-premium-summary .qf-label,
    .qmes-premium-summary .qf-card > div:first-child {
      color: #b9d7ee !important;
      font-size: 12px !important;
      font-weight: 700 !important;
    }
    .qmes-premium-summary .qf-value,
    .qmes-premium-summary .qf-card > div:last-child {
      color: #f8fbff !important;
      font-size: 19px !important;
      font-weight: 800 !important;
      text-shadow: 0 1px 10px rgba(125,211,252,0.08);
    }
    .qmes-premium-summary .qf-foot,
    .qmes-premium-summary .qf-foot span {
      color: #9fb9cf !important;
      font-size: 12px !important;
    }

    .qmes-premium-panel {
      overflow: hidden;
      border: 1px solid rgba(96, 165, 250, 0.24) !important;
      border-radius: 14px !important;
      background:
        radial-gradient(circle at 100% 0%, rgba(37,99,235,0.055), transparent 30%),
        linear-gradient(145deg, #102139 0%, #0c1a2d 100%) !important;
      box-shadow: 0 16px 38px rgba(2, 8, 23, 0.18), inset 0 1px 0 rgba(255,255,255,0.028);
    }
    .qmes-premium-panel > div:first-child {
      min-height: 48px;
      border-bottom-color: rgba(96,165,250,0.18) !important;
      background: linear-gradient(90deg, rgba(30,64,105,0.3), rgba(15,31,52,0.12)) !important;
    }
    .qmes-premium-panel > div:first-child h3 {
      color: #f3f8ff !important;
      font-size: 15px !important;
      font-weight: 800 !important;
      letter-spacing: 0.015em !important;
    }
    .qmes-premium-panel > div:first-child span {
      color: #9fc5e4 !important;
      font-weight: 700 !important;
    }

    table.qmes-raw-inventory-balanced thead,
    table.qmes-finished-inventory-uniform thead {
      background: linear-gradient(90deg, rgba(30, 64, 105, 0.48), rgba(20, 43, 72, 0.28)) !important;
    }
    table.qmes-raw-inventory-balanced thead th,
    table.qmes-finished-inventory-uniform thead th {
      color: #d6e7f5 !important;
      border-bottom: 1px solid rgba(125, 211, 252, 0.24) !important;
      text-shadow: 0 1px 8px rgba(2,8,23,0.24);
    }
    table.qmes-raw-inventory-balanced tbody tr,
    table.qmes-finished-inventory-uniform tbody tr {
      transition: background-color 150ms ease, transform 150ms ease;
    }
    table.qmes-raw-inventory-balanced tbody tr:nth-child(even),
    table.qmes-finished-inventory-uniform tbody tr:nth-child(even) {
      background: rgba(30, 64, 105, 0.10);
    }
    table.qmes-raw-inventory-balanced tbody tr:hover,
    table.qmes-finished-inventory-uniform tbody tr:hover {
      background: rgba(56, 189, 248, 0.075) !important;
    }
    table.qmes-raw-inventory-balanced tbody td:not(:last-child),
    table.qmes-finished-inventory-uniform tbody td:not(:last-child) {
      color: #e5f1fb !important;
      border-bottom-color: rgba(96, 165, 250, 0.10) !important;
    }
    table.qmes-raw-inventory-balanced tbody td:first-child {
      color: #7dd3fc !important;
    }
    table.qmes-raw-inventory-balanced tbody td:last-child span {
      border-color: rgba(245, 158, 11, 0.58) !important;
      background: rgba(245, 158, 11, 0.15) !important;
      color: #ffd166 !important;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.08);
    }
    .qmes-premium-panel p {
      color: #8facbf !important;
    }
  `;
  document.head.appendChild(style);

  function panelOf(table) {
    let node = table?.parentElement;
    while (node && node !== document.body) {
      const classes = String(node.className || "");
      if (classes.includes("bg-slate-900") && classes.includes("rounded-lg")) return node;
      node = node.parentElement;
    }
    return null;
  }

  function apply() {
    const tables = Array.from(document.querySelectorAll("table"));
    const raw = tables.find((table) => {
      const text = String(table.tHead?.textContent || "");
      return text.includes("자재코드") && text.includes("안전재고") && text.includes("보관위치");
    });
    const finished = tables.find((table) => {
      const text = String(table.tHead?.textContent || "");
      return text.includes("완제품 LOT") && text.includes("생산량") && text.includes("보관구역");
    });
    [panelOf(raw), panelOf(finished)].filter(Boolean).forEach((panel) => panel.classList.add("qmes-premium-panel"));

    const summary = Array.from(document.querySelectorAll("section")).find((section) => {
      const text = String(section.textContent || "");
      return text.includes("실시간 재고 요약") && text.includes("현재고 합계") && text.includes("재고 LOT 수");
    });
    if (summary) summary.classList.add("qmes-premium-summary");
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
  ["qmes:data-updated", "qmes:inventory-stage3-ready", "qmes:finished-goods-inventory-ready"].forEach((eventName) => {
    global.addEventListener(eventName, schedule);
  });
})(window);
