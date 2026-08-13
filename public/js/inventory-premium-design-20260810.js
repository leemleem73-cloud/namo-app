/* QMES premium inventory design - current inventory screens */
(function installPremiumInventoryDesign(global) {
  "use strict";
  if (global.__QMES_PREMIUM_INVENTORY_DESIGN_V5__) return;
  global.__QMES_PREMIUM_INVENTORY_DESIGN_V5__ = true;

  const style = document.createElement("style");
  style.id = "qmes-premium-inventory-design-v5";
  style.textContent = `
    .qmes-inventory-premium-scope{color:#fff!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card{border:0!important;border-radius:14px!important;background:linear-gradient(145deg,#10243d 0%,#0b1b30 100%)!important;box-shadow:none!important;color:#fff!important;overflow:hidden!important;position:relative!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card:before{display:none!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card,.qmes-inventory-premium-scope .qmes-premium-kpi-card *{color:#fff!important}

    .qmes-inventory-premium-scope table.qmes-premium-inventory-table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;background:#0c1e33!important;border:0!important;border-radius:0!important;overflow:hidden!important;box-shadow:none!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead,.qmes-inventory-premium-scope table.qmes-premium-inventory-table thead tr{background:linear-gradient(180deg,#173858 0%,#122d49 100%)!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead th{color:#fff!important;font-weight:800!important;border:0!important;padding-top:13px!important;padding-bottom:13px!important;text-shadow:none!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr{background:#0d2138!important;transition:background .15s ease!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr:nth-child(even){background:#10263f!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr:hover{background:#163451!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td{color:#fff!important;border:0!important;padding-top:14px!important;padding-bottom:14px!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td:first-child{color:#fff!important;font-weight:800!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table input,.qmes-inventory-premium-scope table.qmes-premium-inventory-table select{background:#07192b!important;border:0!important;color:#fff!important;border-radius:8px!important;box-shadow:none!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-gray-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-sky-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-emerald-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-amber-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-rose-"]{color:#fff!important}

    .qmes-inventory-premium-scope .qmes-premium-panel{border:0!important;border-radius:14px!important;background:linear-gradient(145deg,#102139 0%,#0b1b2e 100%)!important;box-shadow:none!important;overflow:hidden!important}
    .qmes-inventory-premium-scope .qmes-premium-panel *{border-color:transparent!important}
    .qmes-inventory-premium-scope .qmes-premium-panel h1,.qmes-inventory-premium-scope .qmes-premium-panel h2,.qmes-inventory-premium-scope .qmes-premium-panel h3,.qmes-inventory-premium-scope .qmes-premium-panel p{color:#fff!important}
    .qmes-inventory-premium-scope .qmes-premium-danger-cell{background:rgba(127,29,29,.20)!important;color:#fff!important;border:0!important}
  `;
  document.head.appendChild(style);

  const text = (node) => String(node?.textContent || "").replace(/\s+/g, " ").trim();

  function isInventoryPage(main) {
    if (!main) return false;
    const bodyText = text(main);
    if (bodyText.includes("원재료·부자재 재고") || bodyText.includes("완제품 재고 현황") || bodyText.includes("완제품 출고관리") || bodyText.includes("완제품 출고내역")) return true;
    const inventoryTop = Array.from(document.querySelectorAll('.qmes-top-menu-button, nav button, header button')).find(btn => text(btn) === '재고관리');
    if (inventoryTop && (inventoryTop.classList.contains('active') || inventoryTop.classList.contains('is-active') || inventoryTop.getAttribute('aria-current') === 'page')) return true;
    return false;
  }

  function markPanel(node) {
    let cur = node?.parentElement;
    for (let i = 0; cur && cur !== document.body && i < 7; i += 1, cur = cur.parentElement) {
      const r = cur.getBoundingClientRect?.();
      if (r && r.width > 500 && r.height > 80) { cur.classList.add("qmes-premium-panel"); return cur; }
    }
    return null;
  }

  function alignInventoryDropdown() {
    const top = Array.from(document.querySelectorAll('.qmes-top-menu-button')).find(btn => text(btn) === '재고관리');
    const dropdown = document.getElementById('qmes-all-menu-dropdown');
    if (!top || !dropdown) return;
    const r = top.getBoundingClientRect();
    dropdown.style.setProperty('position','fixed','important');
    dropdown.style.setProperty('left',Math.round(r.left)+'px','important');
    dropdown.style.setProperty('top',Math.round(r.bottom+2)+'px','important');
    dropdown.style.setProperty('right','auto','important');
    dropdown.style.setProperty('transform','none','important');
  }

  function apply() {
    const main = document.querySelector("#root>div>main") || document.querySelector("main");
    if (main && isInventoryPage(main)) {
      main.classList.add("qmes-inventory-premium-scope");
      const tables = Array.from(main.querySelectorAll("table"));
      tables.forEach((table) => {
        const head = text(table.tHead);
        if ((head.includes("자재코드") && head.includes("안전재고")) || (head.includes("완제품 LOT") && head.includes("현재고")) || head.includes("출고번호")) {
          table.classList.add("qmes-premium-inventory-table");
          markPanel(table);
          Array.from(table.querySelectorAll("tbody td")).forEach((td) => { if (text(td) === "부족") td.classList.add("qmes-premium-danger-cell"); });
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
    alignInventoryDropdown();
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    global.requestAnimationFrame(() => { queued = false; apply(); });
  }

  document.addEventListener('mouseover', (event) => {
    const top = event.target.closest?.('.qmes-top-menu-button');
    if (top && text(top) === '재고관리') {
      setTimeout(alignInventoryDropdown,0);
      setTimeout(alignInventoryDropdown,50);
      setTimeout(alignInventoryDropdown,150);
    }
  }, true);
  document.addEventListener('click', (event) => {
    const top = event.target.closest?.('.qmes-top-menu-button');
    if (top && text(top) === '재고관리') {
      setTimeout(alignInventoryDropdown,0);
      setTimeout(alignInventoryDropdown,80);
      setTimeout(alignInventoryDropdown,220);
    }
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true }); else schedule();
  [0,50,150,300,600,1000,1800].forEach(ms => setTimeout(schedule, ms));
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter:['class','aria-current','style'] });
  ["qmes:data-updated","qmes:inventory-stage3-ready","qmes:finished-goods-inventory-ready","qmes:inventory-view","load","pageshow","focus","resize"].forEach(name => global.addEventListener(name, schedule));
})(window);
