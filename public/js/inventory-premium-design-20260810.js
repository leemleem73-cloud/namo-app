/* QMES premium inventory design - current inventory screens */
(function installPremiumInventoryDesign(global) {
  "use strict";
  if (global.__QMES_PREMIUM_INVENTORY_DESIGN_V11__) return;
  global.__QMES_PREMIUM_INVENTORY_DESIGN_V11__ = true;

  const style = document.createElement("style");
  style.id = "qmes-premium-inventory-design-v11";
  style.textContent = `
    .qmes-inventory-premium-scope{color:#fff!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card{border:0!important;border-radius:8px!important;background:#10243a!important;box-shadow:none!important;color:#fff!important;overflow:hidden!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card:before{display:none!important}
    .qmes-inventory-premium-scope .qmes-premium-kpi-card,.qmes-inventory-premium-scope .qmes-premium-kpi-card *{color:#fff!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table{width:100%!important;border-collapse:collapse!important;border-spacing:0!important;background:#10243a!important;border:0!important;border-radius:0!important;overflow:hidden!important;box-shadow:none!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead,.qmes-inventory-premium-scope table.qmes-premium-inventory-table thead tr{background:#f4f6f8!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead th{color:#111827!important;font-weight:700!important;border:0!important;padding-top:12px!important;padding-bottom:12px!important;text-shadow:none!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr,.qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr:nth-child(even){background:#10243a!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody tr:hover{background:#142a43!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td{color:#fff!important;background:transparent!important;border:0!important;padding-top:13px!important;padding-bottom:13px!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td:first-child{color:#fff!important;font-weight:700!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table input,.qmes-inventory-premium-scope table.qmes-premium-inventory-table select{background:#0b1d30!important;border:0!important;color:#fff!important;border-radius:6px!important;box-shadow:none!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-slate-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-gray-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-sky-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-emerald-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-amber-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table [class*="text-rose-"]{color:#fff!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table thead [class*="text-slate-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table thead [class*="text-gray-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table thead [class*="text-sky-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table thead [class*="text-emerald-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table thead [class*="text-amber-"],.qmes-inventory-premium-scope table.qmes-premium-inventory-table thead [class*="text-rose-"]{color:#111827!important}
    .qmes-inventory-premium-scope .qmes-premium-panel{border:0!important;border-radius:8px!important;background:#10243a!important;box-shadow:none!important;overflow:hidden!important}
    .qmes-inventory-premium-scope .qmes-premium-panel *{border-color:transparent!important}
    .qmes-inventory-premium-scope .qmes-premium-panel h1,.qmes-inventory-premium-scope .qmes-premium-panel h2,.qmes-inventory-premium-scope .qmes-premium-panel h3,.qmes-inventory-premium-scope .qmes-premium-panel p{color:#fff!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td.qmes-premium-danger-cell{background:transparent!important;background-color:transparent!important;color:#ff7f8f!important;border:0!important;box-shadow:none!important;font-weight:700!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td.qmes-premium-danger-cell *{background:transparent!important;background-color:transparent!important;color:#ff7f8f!important;border:0!important;box-shadow:none!important}
    .qmes-fg-empty-card{display:none!important}
    .qmes-fg-two-kpi{grid-template-columns:repeat(2,minmax(0,1fr))!important}

    /* 2026-08-13 inventory four-page visual normalization */
    .qmes-inventory-premium-scope [data-inventory-page] > div:nth-child(2) > div{
      background:#10243a!important;color:#fff!important;border:0!important;box-shadow:none!important;
    }
    .qmes-inventory-premium-scope [data-inventory-page] > div:nth-child(2) > div > div,
    .qmes-inventory-premium-scope [data-inventory-page] > div:nth-child(2) > div > div *{
      color:#fff!important;
    }
    .qmes-inventory-premium-scope [data-inventory-page="ship"] > div:nth-child(2){
      background:#10243a!important;border:0!important;box-shadow:none!important;
    }
    .qmes-inventory-premium-scope [data-inventory-page="ship"] input,
    .qmes-inventory-premium-scope [data-inventory-page="ship"] select{
      background:#fff!important;color:#111827!important;border:1px solid #d7dee7!important;box-shadow:none!important;
    }
    .qmes-inventory-premium-scope [data-inventory-page="ship"] input::placeholder{color:#94a3b8!important}
    .qmes-inventory-premium-scope [data-inventory-page="ship"] > div:nth-child(2) > div:last-child{
      background:#0b1d30!important;color:#cbd5e1!important;border:0!important;
    }
    .qmes-inventory-premium-scope [data-inventory-page="ship"] > div:nth-child(2) > div:last-child *{color:#cbd5e1!important}
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td.qmes-premium-danger-cell{
      background:transparent!important;color:#ff8795!important;
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tbody td.qmes-premium-danger-cell::before{
      content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#ff8795;margin-right:7px;vertical-align:2px;
    }
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tfoot,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tfoot tr,
    .qmes-inventory-premium-scope table.qmes-premium-inventory-table tfoot td{
      background:#10243a!important;color:#fff!important;border:0!important;box-shadow:none!important;
    }
  `;
  document.head.appendChild(style);

  const text = (node) => String(node?.textContent || "").replace(/\s+/g, " ").trim();
  let lastTopMenuButton = null;
  function isInventoryPage(main) {
    if (!main) return false;
    const bodyText = text(main);
    if (bodyText.includes("원재료·부자재 재고") || bodyText.includes("완제품 재고 현황") || bodyText.includes("완제품 출고관리") || bodyText.includes("완제품 출고내역")) return true;
    const inventoryTop = Array.from(document.querySelectorAll('.qmes-top-menu-button, nav button, header button')).find(btn => text(btn) === '재고관리');
    return !!(inventoryTop && (inventoryTop.classList.contains('active') || inventoryTop.classList.contains('is-active') || inventoryTop.getAttribute('aria-current') === 'page'));
  }
  function markPanel(node) {
    let cur = node?.parentElement;
    for (let i = 0; cur && cur !== document.body && i < 7; i += 1, cur = cur.parentElement) {
      const r = cur.getBoundingClientRect?.();
      if (r && r.width > 500 && r.height > 80) { cur.classList.add("qmes-premium-panel"); return cur; }
    }
    return null;
  }
  function hideEmptyCardsBeforeTable(main, pageNeedle, tableMatcher) {
    if (!main || !text(main).includes(pageNeedle)) return;
    const table = Array.from(main.querySelectorAll('table')).find(tableMatcher);
    if (!table) return;
    const tableRect = table.getBoundingClientRect();
    const candidates = Array.from(main.querySelectorAll('div')).filter(div => {
      if (div === main || div.contains(table) || table.contains(div) || text(div) !== '') return false;
      const r = div.getBoundingClientRect?.();
      if (!r) return false;
      if (!(r.top < tableRect.top && r.bottom <= tableRect.top && r.width > 250 && r.height > 55 && r.height < 180)) return false;
      const cs = getComputedStyle(div);
      return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
    });
    candidates.forEach(div => {
      div.classList.add('qmes-fg-empty-card');
      const parent = div.parentElement;
      if (parent && Array.from(parent.children).some(el => text(el).includes('완제품 총 현재고')) && Array.from(parent.children).some(el => text(el).includes('출고 가능 LOT'))) parent.classList.add('qmes-fg-two-kpi');
    });
  }
  function alignTopDropdown(button) {
    const dropdown = document.getElementById('qmes-all-menu-dropdown');
    const top = button && document.contains(button) ? button : lastTopMenuButton;
    if (!top || !dropdown) return;
    const r = top.getBoundingClientRect();
    dropdown.style.setProperty('position','fixed','important'); dropdown.style.setProperty('left',Math.round(r.left)+'px','important'); dropdown.style.setProperty('top',Math.round(r.bottom+2)+'px','important'); dropdown.style.setProperty('right','auto','important'); dropdown.style.setProperty('transform','none','important');
  }
  function apply() {
    const main = document.querySelector("#root>div>main") || document.querySelector("main");
    if (main && isInventoryPage(main)) {
      main.classList.add("qmes-inventory-premium-scope");
      Array.from(main.querySelectorAll("table")).forEach((table) => {
        const head = text(table.tHead);
        if ((head.includes("자재코드") && head.includes("안전재고")) || (head.includes("완제품 LOT") && head.includes("현재고")) || head.includes("출고번호")) {
          table.classList.add("qmes-premium-inventory-table"); markPanel(table);
          Array.from(table.querySelectorAll("tbody td")).forEach((td) => { if (text(td) === "부족") td.classList.add("qmes-premium-danger-cell"); });
        }
      });
      Array.from(main.querySelectorAll("div")).forEach((div) => {
        const t = text(div); if (!t || t.length > 80) return;
        if (t.includes("관리 품목") || t.includes("가용재고 합계") || t.includes("안전재고 부족") || t.includes("재고 LOT") || t.includes("완제품 총 현재고") || t.includes("출고 가능 LOT")) {
          const r = div.getBoundingClientRect?.(); if (r && r.width > 180 && r.height > 50) div.classList.add("qmes-premium-kpi-card");
        }
      });
      hideEmptyCardsBeforeTable(main,'완제품 출고내역',t => text(t.tHead).includes('출고번호') && text(t.tHead).includes('LOT'));
      hideEmptyCardsBeforeTable(main,'완제품 재고 현황',t => text(t.tHead).includes('완제품 LOT') && text(t.tHead).includes('현재고'));
    }
    alignTopDropdown();
  }
  let queued = false;
  function schedule() { if (queued) return; queued = true; global.requestAnimationFrame(() => { queued = false; apply(); }); }
  function rememberTopMenu(event) { const top = event.target.closest?.('.qmes-top-menu-button'); if (!top) return; lastTopMenuButton = top; [0,30,80,160,260].forEach(ms => setTimeout(() => alignTopDropdown(top), ms)); }
  document.addEventListener('mouseover', rememberTopMenu, true); document.addEventListener('mouseenter', rememberTopMenu, true); document.addEventListener('click', rememberTopMenu, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true }); else schedule();
  [0,50,150,300,600,1000,1800].forEach(ms => setTimeout(schedule, ms));
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter:['class','aria-current','style'] });
  ["qmes:data-updated","qmes:inventory-stage3-ready","qmes:finished-goods-inventory-ready","qmes:inventory-view","load","pageshow","focus","resize","scroll"].forEach(name => global.addEventListener(name, schedule));
})(window);
