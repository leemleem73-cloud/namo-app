/* Production process read-only summary. Scoped to .qmes-prod-process only. */
(function () {
  const ID = "qpp-production-summary";
  const STYLE_ID = "qpp-production-summary-style";
  const LAYOUT_STYLE_ID = "qpp-production-layout-stable-style";

  function productionRoot() {
    return document.querySelector(".qmes-prod-process");
  }

  function stabilizeProductionLayout() {
    const root = productionRoot();
    if (!root) return;
    const main = root.closest("main") || document.querySelector("#root > div > main");
    if (!main) return;

    if (main.style.getPropertyValue("margin-left") !== "0px" || main.style.getPropertyPriority("margin-left") !== "important") {
      main.style.setProperty("margin-left", "0px", "important");
    }
    if (main.style.getPropertyValue("width") !== "100%" || main.style.getPropertyPriority("width") !== "important") {
      main.style.setProperty("width", "100%", "important");
    }
    if (main.style.getPropertyValue("max-width") !== "none" || main.style.getPropertyPriority("max-width") !== "important") {
      main.style.setProperty("max-width", "none", "important");
    }
    if (main.style.getPropertyValue("transition") !== "none" || main.style.getPropertyPriority("transition") !== "important") {
      main.style.setProperty("transition", "none", "important");
    }
    main.dataset.qppFullWidth = "1";
  }

  if (!document.getElementById(LAYOUT_STYLE_ID)) {
    const layoutStyle = document.createElement("style");
    layoutStyle.id = LAYOUT_STYLE_ID;
    layoutStyle.textContent = `
      body.qmes-side-open:has(.qmes-prod-process) #root > div > main {
        margin-left: 0 !important;
        width: 100% !important;
        max-width: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(layoutStyle);
  }

  function clean(v) { return String(v == null ? "" : v).trim(); }
  function num(v) {
    const n = Number(String(v == null ? "" : v).replace(/[^0-9+-.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  function fmt(v, suffix) {
    return `${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix || ""}`;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .qmes-prod-process #${ID}{margin-top:14px;border:1px solid #243d58;border-radius:13px;background:#0d1f33;overflow:hidden;color:#e2e8f0}
      .qmes-prod-process #${ID} .qpp-summary-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #213b56}
      .qmes-prod-process #${ID} .qpp-summary-head b{font-size:16px}.qmes-prod-process #${ID} .qpp-summary-head span{color:#7895af;font-size:11px}
      .qmes-prod-process #${ID} .qpp-summary-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;background:#28435e}
      .qmes-prod-process #${ID} .qpp-summary-cell{min-width:0;padding:12px;background:#112942}
      .qmes-prod-process #${ID} small{display:block;margin-bottom:5px;color:#7895af;font-size:10px}
      .qmes-prod-process #${ID} strong{display:block;overflow:hidden;color:#f1f5f9;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
      .qmes-prod-process #${ID} .good{color:#6ee7b7}.qmes-prod-process #${ID} .warn{color:#fde68a}.qmes-prod-process #${ID} .bad{color:#fda4af}
      @media(max-width:1100px){.qmes-prod-process #${ID} .qpp-summary-grid{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:700px){.qmes-prod-process #${ID} .qpp-summary-grid{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function getLot(root) {
    return clean(root.querySelector(".qpp-select")?.value);
  }

  function getPlan(root) {
    const cells = Array.from(root.querySelectorAll(".qpp-info > div"));
    const cell = cells.find(el => clean(el.querySelector("small")?.textContent).includes("계획수량"));
    return num(cell?.querySelector("strong")?.textContent);
  }

  function getActual(lot, plan) {
    const batches = Array.isArray(window.DB?.batches) ? window.DB.batches : [];
    const batch = batches.find(row => clean(row?.no || row?.lot || row?.lotNo) === lot);
    const lotRow = window.DB?.lots && window.DB.lots[lot] ? window.DB.lots[lot] : null;
    const candidates = [
      batch?.done, batch?.prodQty, batch?.resultQty, batch?.actualQty, batch?.qty,
      lotRow?.done, lotRow?.prodQty, lotRow?.resultQty, lotRow?.actualQty, lotRow?.qty,
    ];
    for (const value of candidates) {
      const n = num(value);
      if (n > 0) return n;
    }
    const status = clean(batch?.status || lotRow?.productionStatus || lotRow?.status);
    return /완료/.test(status) ? plan : 0;
  }

  function getPqc(lot) {
    const rows = Array.isArray(window.DB?.insp?.PQC) ? window.DB.insp.PQC.filter(row => clean(row?.lot) === lot) : [];
    if (!rows.length) return { text: "검사대기", cls: "warn" };
    if (rows.some(row => clean(row?.judge) === "불합격")) return { text: "불합격", cls: "bad" };
    if (rows.every(row => clean(row?.judge) === "합격")) return { text: "합격", cls: "good" };
    return { text: "검사대기", cls: "warn" };
  }

  function getAbnormal(root) {
    const defectCells = Array.from(root.querySelectorAll(".qpp-table tbody tr td:nth-child(6)"));
    const defect = defectCells.reduce((sum, el) => sum + num(el.textContent), 0);
    const sideBoxes = Array.from(root.querySelectorAll(".qpp-sidebox"));
    const downtimeBox = sideBoxes.find(el => clean(el.querySelector("small")?.textContent).includes("비가동 이력"));
    const downtime = num(downtimeBox?.querySelector("strong")?.textContent);
    return { defect, downtime, total: defect + downtime };
  }

  function getTrace(lot) {
    const hasWo = !!(window.DB?.woDocs && window.DB.woDocs[lot]);
    const hasLot = !!(window.DB?.lots && window.DB.lots[lot]);
    const hasBatch = Array.isArray(window.DB?.batches) && window.DB.batches.some(row => clean(row?.no || row?.lot || row?.lotNo) === lot);
    return (hasWo && (hasLot || hasBatch)) ? { text: "연동됨", cls: "good" } : hasWo ? { text: "작업지시 연동", cls: "warn" } : { text: "확인 필요", cls: "warn" };
  }

  function cell(label, value, cls) {
    return `<div class="qpp-summary-cell"><small>${label}</small><strong class="${cls || ""}">${value}</strong></div>`;
  }

  function render() {
    const root = productionRoot();
    if (!root) return;
    stabilizeProductionLayout();
    const lot = getLot(root);
    if (!lot) {
      document.getElementById(ID)?.remove();
      return;
    }
    ensureStyle();
    const plan = getPlan(root);
    const actual = getActual(lot, plan);
    const gap = actual - plan;
    const yieldRate = plan > 0 ? (actual / plan) * 100 : 0;
    const pqc = getPqc(lot);
    const trace = getTrace(lot);
    const abnormal = getAbnormal(root);
    const actionText = abnormal.total > 0 ? `불량 ${fmt(abnormal.defect)} / 비가동 ${fmt(abnormal.downtime, "건")}` : "특이사항 없음";
    const actionCls = abnormal.total > 0 ? "warn" : "good";
    const html = `
      <div class="qpp-summary-head"><b>생산실적 / 품질 연동 요약</b><span>기존 데이터 자동표시 · 직접입력 없음</span></div>
      <div class="qpp-summary-grid">
        ${cell("작업지시 대비 실적", `${fmt(actual, " kg")} / ${fmt(plan, " kg")}`)}
        ${cell("계획 대비 차이", `${gap > 0 ? "+" : ""}${fmt(gap, " kg")}`, gap < 0 ? "warn" : "good")}
        ${cell("생산수율", `${yieldRate.toFixed(1)} %`, yieldRate >= 100 ? "good" : "warn")}
        ${cell("PQC 검사상태", pqc.text, pqc.cls)}
        ${cell("LOT 추적", trace.text, trace.cls)}
        ${cell("이상 / 조치 요약", actionText, actionCls)}
      </div>`;

    let panel = document.getElementById(ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = ID;
      const firstCard = root.querySelector(".qpp-card");
      if (!firstCard) return;
      firstCard.insertAdjacentElement("afterend", panel);
    }
    if (panel.innerHTML !== html) panel.innerHTML = html;
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; render(); });
  }

  const observer = new MutationObserver(mutations => {
    let shouldRender = false;
    let shouldLockLayout = false;
    for (const mutation of mutations) {
      if (mutation.type === "childList" || mutation.type === "characterData") shouldRender = true;
      if (mutation.type === "attributes" && (mutation.attributeName === "style" || mutation.attributeName === "class")) shouldLockLayout = true;
    }
    if (shouldLockLayout) stabilizeProductionLayout();
    if (shouldRender) schedule();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["style", "class"] });

  document.addEventListener("change", event => { if (event.target?.closest?.(".qmes-prod-process")) schedule(); });
  window.addEventListener("qmes:production-process-updated", schedule);
  window.addEventListener("resize", stabilizeProductionLayout);
  window.addEventListener("load", () => { render(); stabilizeProductionLayout(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { render(); stabilizeProductionLayout(); }, { once: true });
  else { render(); stabilizeProductionLayout(); }
})();
