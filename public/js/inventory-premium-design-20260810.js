/* QMES premium inventory design - current inventory screens */
(function installPremiumInventoryDesign(global) {
  "use strict";
  if (global.__QMES_PREMIUM_INVENTORY_DESIGN_V2__) return;
  global.__QMES_PREMIUM_INVENTORY_DESIGN_V2__ = true;

  const style = document.createElement("style");
  style.id = "qmes-premium-inventory-design-v2";
  style.textContent = `
    .qmes-inventory-premium-scope{color:#e7f0fa!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card{
      border:1px solid rgba(82,145,194,.34)!important;
      border-radius:14px!important;
      background:linear-gradient(145deg,#10243d 0%,#0b1b30 100%)!important;
      box-shadow:0 14px 30px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.035)!important;
      color:#edf6ff!important;
      overflow:hidden!important;
      position:relative!important;
    }
    .qmes-inventory-premium-scope .qmes-premium-kpi-card:before{
      content:"";position:absolute;left:0;right:0;top:0;height:2px;
      background:linear-gradient(90deg,#38bdf8,#2563eb);opacity:.85
    }
    .qmes-inventory-premium-scope .qmes-premium-kpi-card *{color:#eaf4fe!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card [class*="text-slate-"],
    .qmes-inventory-premium-scope .qmes-premium-kpi-card [class*="text-gray-"]{color:#a9bfd3!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card [class*="text-sky-"]{color:#67c8ff!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card [class*="text-rose-"]{color:#fb8fa5!important}

    .qmes-inventory-premium-scope table.qmes-premium-inventory-table{
      width:100%!important;border-collapse:separate!important;border-spacing:0!important;
      background:#0c1e33!important;border:1px solid #234866!important;border-radius:14px!important;
      overflow:hidden!important;box-shadow:0 16px 34px rgba(0,0,0,.20)!important
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead tr{
      background:linear-gradient(180deg,#173858 0%,#122d49 100%)!important
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead th{
      color:#b8d8f1!important;font-weight:800!important;border-bottom:1px solid #315b7c!important;
      padding-top:13px!important;padding-bottom:13px!important;text-shadow:none!important
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr{
      background:#0d2138!important;transition:background .15s ease!important
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr:nth-child(even){background:#10263f!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr:hover{background:#163451!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td{
      color:#dce9f5!important;border-bottom:1px solid rgba(49,86,116,.55)!important;
      padding-top:14px!important;padding-bottom:14px!important
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr:last-child td{border-bottom:0!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td:first-child{
      color:#69c9ff!important;font-weight:800!important
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table input,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table select{
      background:#07192b!important;border:1px solid #35617f!important;color:#f1f7fd!important;
      border-radius:8px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-100"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-200"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-300"]{color:#dce9f5!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-400"],
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-500"]{color:#93abc0!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-sky-"]{color:#69c9ff!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-emerald-"]{color:#4de1ae!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-amber-"]{color:#ffd168!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-rose-"]{color:#fb8da4!important}

    .qmes-inventory-premium-scope .qmes-premium-panel{
      border:1px solid rgba(82,145,194,.28)!important;border-radius:14px!important;
      background:linear-gradient(145deg,#102139 0%,#0b1b2e 100%)!important;
      box-shadow:0 14px 30px rgba(0,0,0,.17),inset 0 1px 0 rgba(255,255,255,.025)!important;
      overflow:hidden!important
    }
    .qmes-inventory-premium-scope .qmes-premium-panel *{border-color:rgba(82,145,194,.22)!important}
    .qmes-inventory-premium-scope .qmes-premium-panel h1,
    .qmes-inventory-premium-scope .qmes-premium-panel h2,
    .qmes-inventory-premium-scope .qmes-premium-panel h3{color:#f1f7fd!important}
    .qmes-inventory-premium-scope .qmes-premium-panel p{color:#8fa8bd!important}

    .qmes-inventory-premium-scope .qmes-premium-danger-cell{
      background:rgba(127,29,29,.20)!important;color:#fb9aae!important;border-color:rgba(244,63,94,.34)!important
    }
  `;
  document.head.appendChild(style);

  const text = (node) => String(node?.textContent || "").replace(/\s+/g, " ").trim();

  function markPanel(node) {
    let cur = node?.parentElement;
    for (let i = 0; cur && cur !== document.body && i < 7; i += 1, cur = cur.parentElement) {
      const r = cur.getBoundingClientRect?.();
      if (r && r.width > 500 && r.height > 80) {
        cur.classList.add("qmes-premium-panel");
        return cur;
      }
    }
    return null;
  }

  function apply() {
    const sideTitle = text(document.querySelector("#qmes-sync-sidebar .qmes-side-title"));
    if (sideTitle !== "재고관리") return;

    const main = document.querySelector("#root>div>main") || document.querySelector("main");
    if (!main) return;
    main.classList.add("qmes-inventory-premium-scope");

    const tables = Array.from(main.querySelectorAll("table"));
    tables.forEach((table) => {
      const head = text(table.tHead);
      if ((head.includes("자재코드") && head.includes("안전재고")) || (head.includes("완제품 LOT") && head.includes("현재고")) || head.includes("출고번호")) {
        table.classList.add("qmes-premium-inventory-table");
        markPanel(table);
        Array.from(table.querySelectorAll("tbody td")).forEach((td) => {
          if (text(td) === "부족") td.classList.add("qmes-premium-danger-cell");
        });
      }
    });

    Array.from(main.querySelectorAll("div")).forEach((div) => {
      const t = text(div);
      if (!t || t.length > 80) return;
      if (t.includes("관리 품목") || t.includes("가용재고 합계") || t.includes("안전재고 부족") || t.includes("완제품 총 현재고") || t.includes("출고 가능 LOT")) {
        const r = div.getBoundingClientRect?.();
        if (r && r.width > 180 && r.height > 50) div.classList.add("qmes-premium-kpi-card");
      }
    });
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    global.requestAnimationFrame(() => { queued = false; apply(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  ["qmes:data-updated","qmes:inventory-stage3-ready","qmes:finished-goods-inventory-ready","qmes:inventory-view"].forEach(name => global.addEventListener(name, schedule));
})(window);
