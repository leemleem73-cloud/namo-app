(function(){
  "use strict";
  if(window.__QMES_LOT_IQC_LINK_V24__) return;
  window.__QMES_LOT_IQC_LINK_V24__ = true;

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const getStore = (key) => { try { return sessionStorage.getItem(key) || ""; } catch (_) { return ""; } };
  const setStore = (key, value) => { try { sessionStorage.setItem(key, String(value || "")); } catch (_) {} };
  const clearLinkStore = () => {
    ["qmes_lot_link_tab","qmes_lot_link_query","qmes_lot_link_material_lot","qmes_lot_link_material_name","qmes_lot_link_supplier"].forEach((key) => {
      try { sessionStorage.removeItem(key); } catch (_) {}
    });
  };

  const style = document.createElement("style");
  style.id = "qmes-lot-iqc-link-v24-style";
  style.textContent = `
    .qmes-lot-iqc-cell-inner{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:7px!important;white-space:nowrap!important}
    .qmes-lot-iqc-link-btn{flex:0 0 auto!important;min-width:58px!important;height:25px!important;padding:2px 8px!important;border:1px solid #475569!important;border-radius:6px!important;background:#172033!important;color:#dbe7f3!important;font-size:10px!important;font-weight:800!important;line-height:19px!important;cursor:pointer!important}
    .qmes-lot-iqc-link-btn:hover{border-color:#94a3b8!important;background:#1e293b!important;color:#fff!important}
    .qmes-lot-linked-badge{display:none!important}
    .qmes-iqc-inno-row{display:grid!important;grid-template-columns:86px minmax(0,1fr)!important;gap:8px!important}
    .qmes-iqc-inno-row select{width:86px!important;min-width:86px!important;padding-left:10px!important;padding-right:25px!important;text-overflow:clip!important;white-space:nowrap!important}
    .qmes-linked-material-context{display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;flex-wrap:wrap!important;margin:0 0 14px!important;padding:11px 16px!important;border:1px solid #334155!important;border-radius:10px!important;background:#0f172a!important;color:#e2e8f0!important}
    .qmes-linked-material-context strong{color:#7dd3fc!important;font-weight:800!important}
    .qmes-linked-material-actions{display:inline-flex!important;gap:7px!important}
    .qmes-linked-material-actions button{height:30px!important;padding:4px 11px!important;border:1px solid #475569!important;border-radius:7px!important;background:#1e293b!important;color:#fff!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
    .qmes-lot-production-hidden{display:none!important}
    .qmes-lot-production-panel .qmes-lot-detail-row{display:grid!important;grid-template-columns:120px minmax(0,1fr) 128px!important;align-items:center!important;gap:12px!important;padding:11px 12px!important;box-sizing:border-box!important}
    .qmes-lot-production-panel .qmes-lot-detail-row>*{min-width:0!important;text-align:center!important;justify-self:center!important}
    .qmes-workorder-issue-cell{grid-column:3!important;width:118px!important;max-width:118px!important;justify-self:end!important;white-space:nowrap!important}
  `;
  document.head.appendChild(style);

  function panelOf(element) {
    let node = element;
    while (node && node !== document.body) {
      const classes = String(node.className || "");
      const rect = node.getBoundingClientRect();
      if ((/rounded/.test(classes) && /border/.test(classes)) || (rect.width > 400 && node.querySelector("h1,h2,h3,h4,h5"))) return node;
      node = node.parentElement;
    }
    return null;
  }

  function renameMaterialHeaders(panel) {
    Array.from(panel.querySelectorAll("thead th")).forEach((th) => {
      const text = clean(th.textContent);
      if (/원료\s*Lot/i.test(text) || text === "원료 LOT") th.textContent = "LOT No.";
      else if (text === "품명") th.textContent = "원재료명";
      else if (text === "공급사") th.textContent = "업체명";
    });
  }

  function columnIndexes(row) {
    const headers = Array.from(row.closest("table")?.querySelectorAll("thead th") || []).map((th) => clean(th.textContent));
    const find = (pattern, fallback) => {
      const index = headers.findIndex((text) => pattern.test(text));
      return index >= 0 ? index : fallback;
    };
    return {
      lot: find(/LOT No\.|원료\s*LOT/i, 0),
      name: find(/원재료명|^품명$/, 1),
      supplier: find(/업체명|공급사/, 5),
      iqc: find(/수입검사/, row.cells.length - 1)
    };
  }

  function openIqc(lot, name, supplier) {
    setStore("qmes_current_tab", "iqc");
    setStore("qmes_lot_link_tab", "iqc");
    setStore("qmes_lot_link_query", lot);
    setStore("qmes_lot_link_material_lot", lot);
    setStore("qmes_lot_link_material_name", name);
    setStore("qmes_lot_link_supplier", supplier);
    window.location.reload();
  }

  function applyMaterialLinks() {
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span")).filter((node) => /투입 원재료|Backward Trace|투입원료/.test(clean(node.textContent)));
    headings.forEach((heading) => {
      const panel = panelOf(heading);
      if (!panel) return;
      renameMaterialHeaders(panel);
      Array.from(panel.querySelectorAll("tbody tr")).forEach((row) => {
        const cells = Array.from(row.cells || []);
        if (!cells.length) return;
        const indexes = columnIndexes(row);
        const lot = clean(cells[indexes.lot]?.textContent);
        const name = clean(cells[indexes.name]?.textContent);
        const supplier = clean(cells[indexes.supplier]?.textContent);
        const iqcCell = cells[indexes.iqc] || cells[cells.length - 1];
        if (!iqcCell || !lot) return;

        iqcCell.querySelectorAll(".qmes-lot-iqc-link-btn").forEach((button) => button.remove());
        let inner = iqcCell.querySelector(":scope > .qmes-lot-iqc-cell-inner");
        if (!inner) {
          inner = document.createElement("div");
          inner.className = "qmes-lot-iqc-cell-inner";
          while (iqcCell.firstChild) inner.appendChild(iqcCell.firstChild);
          iqcCell.appendChild(inner);
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "qmes-lot-iqc-link-btn";
        button.textContent = "바로가기";
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          openIqc(lot, name, supplier);
        });
        inner.appendChild(button);
      });
    });
  }

  function applyProductionLayout() {
    Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span")).filter((node) => clean(node.textContent) === "생산실적").forEach((heading) => {
      const panel = panelOf(heading);
      if (!panel) return;
      panel.classList.add("qmes-lot-production-panel");
      Array.from(panel.querySelectorAll("div.grid")).forEach((row) => {
        if (row.children.length < 2) return;
        row.classList.add("qmes-lot-detail-row");
        Array.from(row.querySelectorAll("div,span,p,small,strong")).filter((node) => !node.children.length).forEach((node) => {
          const text = clean(node.textContent);
          if (/^(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}\s*)?\d{1,2}:\d{2}(?::\d{2})?$/.test(text)) node.classList.add("qmes-lot-production-hidden");
          if (/품질부\s*박현아(?:\s*\(U-0010\))?/i.test(text)) node.classList.add("qmes-lot-production-hidden");
        });
        const issue = Array.from(row.children).find((child) => /작업지시/.test(clean(child.textContent)) && /발행/.test(clean(child.textContent)));
        if (issue) {
          issue.classList.add("qmes-workorder-issue-cell");
          row.appendChild(issue);
        }
      });
    });
  }

  function sortIqcLatest() {
    if (getStore("qmes_current_tab") !== "iqc") return;
    const body = document.querySelector(".qmes-iqc-ledger-table tbody");
    if (!body) return;
    const rows = Array.from(body.rows).filter((row) => row.cells.length > 1 && !row.querySelector(".qmes-iqc-empty-row"));
    const date = (row) => clean(row.cells[0]?.textContent).replace(/\./g, "-");
    rows.sort((a, b) => date(b).localeCompare(date(a)) || clean(b.cells[1]?.textContent).localeCompare(clean(a.cells[1]?.textContent), "ko", { numeric: true }));
    rows.forEach((row) => body.appendChild(row));
  }

  function findIqcRow(lot) {
    return Array.from(document.querySelectorAll(".qmes-iqc-ledger-table tbody tr")).find((row) => clean(row.cells[1]?.textContent) === lot || clean(row.textContent).includes(lot));
  }

  function clickIqcAction(lot, label) {
    const row = findIqcRow(lot);
    const button = Array.from(row?.querySelectorAll("button") || []).find((item) => clean(item.textContent).includes(label));
    if (button) button.click();
    else window.alert(`${label} 버튼을 찾을 수 없습니다.`);
  }

  function showLinkedContext() {
    if (getStore("qmes_current_tab") !== "iqc") return false;
    const lot = getStore("qmes_lot_link_material_lot");
    const name = getStore("qmes_lot_link_material_name");
    const supplier = getStore("qmes_lot_link_supplier");
    if (!lot) return false;
    const input = Array.from(document.querySelectorAll("input[type='text'],input[type='search'],input:not([type])")).find((item) => /검색/.test(String(item.placeholder || "")));
    if (!input) return false;
    if (document.getElementById("qmes-linked-material-context")) return true;

    let anchor = input.parentElement;
    while (anchor?.parentElement && anchor.getBoundingClientRect().width < 450) anchor = anchor.parentElement;
    const box = document.createElement("div");
    box.id = "qmes-linked-material-context";
    box.className = "qmes-linked-material-context";
    box.innerHTML = `<span>LOT No. <strong>${lot}</strong></span><span>원재료명 <strong>${name || "-"}</strong></span><span>업체명 <strong>${supplier || "-"}</strong></span><span class="qmes-linked-material-actions"><button type="button" data-action="출력">출력</button><button type="button" data-action="라벨">라벨</button></span>`;
    box.querySelector('[data-action="출력"]').addEventListener("click", () => clickIqcAction(lot, "출력"));
    box.querySelector('[data-action="라벨"]').addEventListener("click", () => clickIqcAction(lot, "라벨"));
    anchor.parentElement?.insertBefore(box, anchor);
    clearLinkStore();
    return true;
  }

  function applyLinkedSearch() {
    const tab = getStore("qmes_lot_link_tab");
    const query = getStore("qmes_lot_link_query");
    if (tab !== "iqc" || !query || getStore("qmes_current_tab") !== "iqc") return;
    const input = Array.from(document.querySelectorAll("input[type='text'],input[type='search'],input:not([type])")).find((item) => /검색/.test(String(item.placeholder || "")));
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, query); else input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    showLinkedContext();
  }

  let queued = false;
  function apply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      queued = false;
      applyMaterialLinks();
      applyProductionLayout();
      sortIqcLatest();
      applyLinkedSearch();
    }));
  }

  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener("click", apply, true);
  window.addEventListener("load", apply);
  apply();
})();