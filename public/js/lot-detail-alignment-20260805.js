(function(){
  "use strict";
  if(window.__QMES_LOT_IQC_LINK_V26__) return;
  window.__QMES_LOT_IQC_LINK_V26__ = true;

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const getStore = (key) => { try { return sessionStorage.getItem(key) || ""; } catch (_) { return ""; } };
  const setStore = (key, value) => { try { sessionStorage.setItem(key, String(value || "")); } catch (_) {} };
  const removeStore = (key) => { try { sessionStorage.removeItem(key); } catch (_) {} };
  const clearLinkStore = () => ["qmes_lot_link_pending","qmes_lot_link_material_lot","qmes_lot_link_material_name","qmes_lot_link_supplier"].forEach(removeStore);

  const style = document.createElement("style");
  style.id = "qmes-lot-iqc-link-v26-style";
  style.textContent = `
    .qmes-lot-iqc-cell-inner{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;gap:7px!important;white-space:nowrap!important}
    .qmes-lot-iqc-link-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important;height:26px!important;padding:0 9px!important;border:1px solid #475569!important;border-radius:7px!important;background:#172033!important;color:#dbe7f3!important;font-size:10px!important;font-weight:800!important;cursor:pointer!important}
    .qmes-lot-iqc-link-btn:hover{border-color:#94a3b8!important;background:#1e293b!important;color:#fff!important}
    .qmes-lot-linked-badge{display:none!important}
    .qmes-iqc-inno-row{display:grid!important;grid-template-columns:92px minmax(0,1fr)!important;gap:8px!important}
    .qmes-iqc-inno-row select{width:92px!important;min-width:92px!important;padding-left:10px!important;padding-right:28px!important;text-overflow:clip!important;white-space:nowrap!important;overflow:visible!important}
    .qmes-linked-material-context{display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;flex-wrap:wrap!important;margin:0 0 14px!important;padding:11px 16px!important;border:1px solid #334155!important;border-radius:10px!important;background:#0f172a!important;color:#e2e8f0!important}
    .qmes-linked-material-context strong{color:#7dd3fc!important;font-weight:800!important}
    .qmes-linked-material-actions{display:inline-flex!important;gap:7px!important}
    .qmes-linked-material-actions button{height:30px!important;padding:4px 11px!important;border:1px solid #475569!important;border-radius:7px!important;background:#1e293b!important;color:#fff!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}
  `;
  document.head.appendChild(style);

  function panelOf(element){
    let node = element;
    while(node && node !== document.body){
      const classes = String(node.className || "");
      const rect = node.getBoundingClientRect();
      if((/rounded/.test(classes) && /border/.test(classes)) || (rect.width > 400 && node.querySelector("h1,h2,h3,h4,h5"))) return node;
      node = node.parentElement;
    }
    return null;
  }

  function renameHeaders(panel){
    Array.from(panel.querySelectorAll("thead th")).forEach((th) => {
      const text = clean(th.textContent);
      if(/원료\s*Lot/i.test(text) || text === "원료 LOT") th.textContent = "LOT No.";
      else if(text === "품명") th.textContent = "원재료명";
      else if(text === "공급사") th.textContent = "업체명";
      else if(text === "입고일시") th.textContent = "입고일자";
    });
  }

  function columnIndexes(row){
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

  function switchToIqc(){
    const qualityMenu = Array.from(document.querySelectorAll("button"))
      .find((node) => clean(node.textContent).replace(/[›▶▼]/g, "").trim() === "품질검사");
    if(qualityMenu){
      qualityMenu.click();
      return true;
    }
    const iqcMenu = Array.from(document.querySelectorAll("button,[role='button'],a"))
      .find((node) => /수입검사/.test(clean(node.textContent)) && !/바로가기/.test(clean(node.textContent)));
    if(iqcMenu){
      iqcMenu.click();
      return true;
    }
    setStore("qmes_current_tab", "iqc");
    window.location.reload();
    return false;
  }

  function addMaterialLinks(){
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,div,span"))
      .filter((node) => /투입 원재료|Backward Trace|투입원료/.test(clean(node.textContent)));
    headings.forEach((heading) => {
      const panel = panelOf(heading);
      if(!panel) return;
      renameHeaders(panel);
      Array.from(panel.querySelectorAll("tbody tr")).forEach((row) => {
        const cells = Array.from(row.cells || []);
        if(!cells.length) return;
        const indexes = columnIndexes(row);
        const lot = clean(cells[indexes.lot]?.textContent);
        const name = clean(cells[indexes.name]?.textContent);
        const supplier = clean(cells[indexes.supplier]?.textContent);
        const iqcCell = cells[indexes.iqc] || cells[cells.length - 1];
        if(!lot || !iqcCell) return;
        iqcCell.querySelectorAll(".qmes-lot-linked-badge,.qmes-lot-iqc-link-btn").forEach((node) => node.remove());
        iqcCell.classList.remove("qmes-lot-linked-target");
        iqcCell.removeAttribute("role");
        iqcCell.removeAttribute("tabindex");
        delete iqcCell.dataset.qmesLotLinked;
        let inner = iqcCell.querySelector(":scope > .qmes-lot-iqc-cell-inner");
        if(!inner){
          inner = document.createElement("span");
          inner.className = "qmes-lot-iqc-cell-inner";
          while(iqcCell.firstChild) inner.appendChild(iqcCell.firstChild);
          iqcCell.appendChild(inner);
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "qmes-lot-iqc-link-btn";
        button.textContent = "바로가기";
        button.dataset.lot = lot;
        button.dataset.name = name;
        button.dataset.supplier = supplier;
        inner.appendChild(button);
      });
    });
  }

  function setSearch(lot){
    const input = Array.from(document.querySelectorAll("input[type='search'],input[type='text'],input:not([type])"))
      .find((node) => /검색/.test(String(node.placeholder || "")));
    if(!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if(setter) setter.call(input, lot); else input.value = lot;
    input.dispatchEvent(new Event("input", { bubbles:true }));
    input.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  }

  function findIqcRow(lot){
    return Array.from(document.querySelectorAll(".qmes-iqc-ledger-table tbody tr"))
      .find((row) => clean(row.cells?.[1]?.textContent) === lot || clean(row.textContent).includes(lot));
  }

  function clickIqcAction(lot, label){
    const row = findIqcRow(lot);
    const button = Array.from(row?.querySelectorAll("button") || []).find((item) => clean(item.textContent).includes(label));
    if(button) button.click();
  }

  function showContext(){
    if(getStore("qmes_lot_link_pending") !== "1") return false;
    const lot = getStore("qmes_lot_link_material_lot");
    if(!lot) return false;
    const input = Array.from(document.querySelectorAll("input[type='search'],input[type='text'],input:not([type])"))
      .find((node) => /검색/.test(String(node.placeholder || "")));
    if(!input) return false;
    setSearch(lot);
    document.getElementById("qmes-linked-material-context")?.remove();
    let anchor = input.parentElement;
    while(anchor?.parentElement && anchor.getBoundingClientRect().width < 450) anchor = anchor.parentElement;
    const name = getStore("qmes_lot_link_material_name");
    const supplier = getStore("qmes_lot_link_supplier");
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

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".qmes-lot-iqc-link-btn");
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    setStore("qmes_lot_link_pending", "1");
    setStore("qmes_lot_link_material_lot", button.dataset.lot);
    setStore("qmes_lot_link_material_name", button.dataset.name);
    setStore("qmes_lot_link_supplier", button.dataset.supplier);
    switchToIqc();
    [80,180,350,650,1000].forEach((delay) => setTimeout(showContext, delay));
  }, true);

  let queued = false;
  function apply(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      queued = false;
      addMaterialLinks();
      showContext();
    }));
  }
  new MutationObserver(apply).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener("load", apply);
  document.addEventListener("qmes:data-updated", apply);
  apply();
})();
