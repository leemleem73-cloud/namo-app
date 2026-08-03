/* QMES work-order LOT auto sync
 * - 생산일자 이하의 IQC 합격 LOT만 후보로 사용
 * - 최신 합격 LOT 자동 선택
 * - 거래처 현황 LOT를 보조 후보로 사용
 * - LOT 입력은 계속 수기 수정 가능
 * - 작업지시 공정/품목 기본값과 직접 수정 지원
 * - 신규 작업지시는 양산(D) Prefix를 기본으로 사용하되 날짜·순번 자동채번 유지
 * - 발행 내역은 작은 화면에서 가로 스크롤과 열 너비를 보장
 */
(function () {
  "use strict";

  const PASS_VALUES = new Set(["OK", "PASS", "합격", "적합"]);
  const BYK_DISPLAY_NAME = "BYK180 (분산제)";
  const DEFAULT_PRODUCT = "NBA20-HM05";
  const DEFAULT_SITE = "D";
  const OLD_PRODUCTS = [" NBA20-HM01", "NBA20-HM01", "NMA20-HM01"];
  const DEFAULT_SUPPLIERS = [
    { company:"코오롱", material:"PAI", lot:"PAI#27-2(2)", status:"거래중" },
    { company:"푸양광명화학", material:"NMP", lot:"20251031063", status:"거래중" },
    { company:"모리로쿠케미칼즈", material:"NMP", lot:"2026011101", status:"거래중" },
    { company:"강신산업", material:"Boehmite", lot:"006-8-25", status:"거래중" },
    { company:"LG화학", material:"SBR", lot:"C3026B26A(1)", status:"거래중" },
    { company:"SOLVAY", material:"PVDF", lot:"CSE23202TA", status:"거래중" },
    { company:"금호석유화학", material:"SBS", lot:"W251016", status:"거래중" },
    { company:"유니소재", material:BYK_DISPLAY_NAME, lot:"2708935", status:"거래중" },
  ];

  let applying = false;
  let applyRequested = false;

  function getDb() {
    try {
      if (typeof DB !== "undefined" && DB) return DB;
    } catch (error) {}
    return window.DB || {};
  }

  function getBom() {
    try {
      return typeof BOM !== "undefined" && BOM ? BOM : null;
    } catch (error) {
      return null;
    }
  }

  function cloneBomEntry(source) {
    if (!source) return null;
    return {
      ...source,
      tanks: Array.isArray(source.tanks) ? [...source.tanks] : [],
      items: Array.isArray(source.items) ? source.items.map((item) => ({ ...item })) : [],
    };
  }

  function installDefaultProduct() {
    const bom = getBom();
    if (!bom) return false;
    if (!bom[DEFAULT_PRODUCT]) {
      const sourceKey = OLD_PRODUCTS.find((name) => bom[name])
        || Object.keys(bom).find((name) => bom[name] && bom[name].workType === "완제품");
      const source = sourceKey ? bom[sourceKey] : null;
      if (source) bom[DEFAULT_PRODUCT] = cloneBomEntry(source);
    }
    OLD_PRODUCTS.forEach((name) => {
      if (name !== DEFAULT_PRODUCT && bom[name]) delete bom[name];
    });
    return Boolean(bom[DEFAULT_PRODUCT]);
  }

  function ensureEditableProduct(productName, sourceName) {
    const bom = getBom();
    if (!bom || !productName) return false;
    if (bom[productName]) return true;
    const source = bom[sourceName] || bom[DEFAULT_PRODUCT]
      || Object.values(bom).find((entry) => entry && entry.workType === "완제품")
      || Object.values(bom)[0];
    if (!source) return false;
    bom[productName] = cloneBomEntry(source);
    return true;
  }

  function normalizeMaterial(value) {
    const text = String(value || "").toUpperCase().replace(/\s+/g, "");
    if (text.includes("BYK180") || text.includes("BYK-180") || text.includes("분산제")) return "BYK180";
    if (text.includes("AOH30") || text.includes("BOEHMITE")) return "BOEHMITE";
    if (text.includes("PVDF")) return "PVDF";
    if (text.includes("PAI") || text.includes("바인더(PAI)")) return "PAI";
    if (text.includes("NMP")) return "NMP";
    if (text.includes("SBR")) return "SBR";
    if (text.includes("SBS")) return "SBS";
    return text;
  }

  function standardizeBykData() {
    const db = getDb();
    let changed = false;
    if (Array.isArray(db.iqc)) {
      db.iqc = db.iqc.map((row) => {
        if (normalizeMaterial(row && row.name) !== "BYK180" || row.name === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, name:BYK_DISPLAY_NAME };
      });
    }
    if (Array.isArray(db.partnerSuppliers)) {
      db.partnerSuppliers = db.partnerSuppliers.map((row) => {
        if (normalizeMaterial(row && row.material) !== "BYK180" || row.material === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, material:BYK_DISPLAY_NAME };
      });
    }
    if (changed && typeof window.dbSave === "function") {
      try { window.dbSave(); } catch (error) { console.warn("BYK180 명칭 저장 실패", error); }
    }
  }

  function standardizeBykOptions(root) {
    (root || document).querySelectorAll("select option").forEach((option) => {
      if (normalizeMaterial(option.textContent) === "BYK180") option.textContent = BYK_DISPLAY_NAME;
    });
  }

  function firstValue(record, keys) {
    for (const key of keys) {
      const value = record && record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function toDateText(value) {
    const raw = String(value || "").trim();
    const match = raw.match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    if (!match) return "";
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  }

  function isPass(record) {
    const value = firstValue(record, ["judge", "judgment", "result", "inspectionResult", "status"]);
    return PASS_VALUES.has(String(value || "").trim().toUpperCase());
  }

  function iqcRecords() {
    const db = getDb();
    const candidates = [db.iqc, db.insp && db.insp.IQC, db.iqcRecords, db.inspections && db.inspections.IQC];
    const rows = candidates.find(Array.isArray);
    return Array.isArray(rows) ? rows : [];
  }

  function supplierRecords() {
    const db = getDb();
    const saved = Array.isArray(db.partnerSuppliers) ? db.partnerSuppliers : [];
    const rawLots = Object.values(db.rawMaterialLots || {}).map((row) => ({
      company:row.supplier || row.company || "",
      material:row.material || row.name || "",
      lot:row.lot || row.lotNo || "",
      status:row.status || "거래중",
    }));
    const merged = [...saved, ...rawLots, ...DEFAULT_SUPPLIERS];
    const seen = new Set();
    return merged.filter((row) => {
      const key = `${normalizeMaterial(row.material)}|${String(row.lot || "").trim().toUpperCase()}`;
      if (!String(row.lot || "").trim() || seen.has(key)) return false;
      seen.add(key);
      return String(row.status || "거래중") !== "거래중지";
    });
  }

  function lotCandidates(materialName, productionDate) {
    const key = normalizeMaterial(materialName);
    const cutoff = toDateText(productionDate);
    const candidates = [];
    iqcRecords().forEach((record) => {
      const material = firstValue(record, ["name", "material", "materialName", "rawMaterial", "item", "product"]);
      const lot = String(firstValue(record, ["lot", "lotNo", "lotNumber", "materialLot"])).trim();
      const received = toDateText(firstValue(record, ["recv", "receiveDate", "receivedDate", "inDate", "date", "inspectionDate"]));
      if (!lot || normalizeMaterial(material) !== key || !isPass(record)) return;
      if (cutoff && received && received > cutoff) return;
      candidates.push({
        lot,
        date:received || "0000-00-00",
        supplier:firstValue(record, ["supplier", "company", "vendor"]),
        source:"IQC",
      });
    });
    supplierRecords().forEach((record) => {
      if (normalizeMaterial(record.material) !== key) return;
      const lot = String(record.lot || "").trim();
      if (lot && !candidates.some((item) => item.lot === lot)) {
        candidates.push({ lot, date:"0000-00-00", supplier:record.company || "", source:"거래처 현황" });
      }
    });
    candidates.sort((a, b) => a.source !== b.source
      ? (a.source === "IQC" ? -1 : 1)
      : b.date.localeCompare(a.date));
    return candidates.filter((item, index, all) => all.findIndex((row) => row.lot === item.lot) === index);
  }

  function setReactInputValue(input, value) {
    if (!input || input.value === value) return false;
    const lastValue = input.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    if (input._valueTracker) input._valueTracker.setValue(lastValue);
    input.dispatchEvent(new Event("input", { bubbles:true }));
    input.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  }

  function setReactSelectValue(select, value) {
    if (!select || select.value === value) return false;
    const lastValue = select.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    setter.call(select, value);
    if (select._valueTracker) select._valueTracker.setValue(lastValue);
    select.dispatchEvent(new Event("input", { bubbles:true }));
    select.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  }

  function fieldByLabel(root, label) {
    return Array.from((root || document).querySelectorAll(".qmes-wo-form-field")).find((field) =>
      String(field.querySelector("span")?.textContent || "").replace(/\s+/g, " ").includes(label)
    );
  }

  function productionDate(root) {
    const dates = Array.from((root || document).querySelectorAll('.qmes-wo-form-field input[type="date"]'));
    return dates.find((input) => input.value)?.value || "";
  }

  function materialRows(root) {
    return Array.from((root || document).querySelectorAll("table.qmes-material-table tbody tr"));
  }

  function prepareRow(row, prodDate) {
    if (!row) return null;
    const materialSelect = row.querySelector("td:nth-child(2) select");
    const lotInput = row.querySelector('td:nth-child(3) input[placeholder="원재료 LOT"]');
    if (!materialSelect || !lotInput) return null;
    const materialName = materialSelect.value || materialSelect.options[materialSelect.selectedIndex]?.textContent || "";
    const options = lotCandidates(materialName, prodDate);
    const listId = `qmes-lot-${normalizeMaterial(materialName)}-${row.rowIndex || 0}`;
    let datalist = row.querySelector(`datalist[data-qmes-lot-list="${normalizeMaterial(materialName)}"]`);
    if (!datalist) {
      datalist = document.createElement("datalist");
      datalist.dataset.qmesLotList = normalizeMaterial(materialName);
      lotInput.insertAdjacentElement("afterend", datalist);
    }
    datalist.id = listId;
    datalist.innerHTML = options.map((item) =>
      `<option value="${String(item.lot).replace(/"/g, "&quot;")}">${item.source}${item.date !== "0000-00-00" ? ` · ${item.date}` : ""}${item.supplier ? ` · ${item.supplier}` : ""}</option>`
    ).join("");
    lotInput.setAttribute("list", listId);
    lotInput.title = options.length
      ? `사용 가능 LOT ${options.length}건 · IQC 우선 · 직접 입력 가능`
      : "사용 가능 LOT 없음 · 직접 입력 가능";
    return { lotInput, options };
  }

  async function applyAll(overwriteBlankOnly) {
    if (applying) {
      applyRequested = true;
      return;
    }
    const shell = document.querySelector(".qmes-wo-issue-shell");
    if (!shell) return;
    const date = productionDate(shell);
    if (!date) return;
    applying = true;
    try {
      const rowCount = materialRows(shell).length;
      for (let index = 0; index < rowCount; index += 1) {
        const currentShell = document.querySelector(".qmes-wo-issue-shell");
        if (!currentShell) break;
        const prepared = prepareRow(materialRows(currentShell)[index], productionDate(currentShell));
        if (!prepared || !prepared.options.length) continue;
        if (overwriteBlankOnly && String(prepared.lotInput.value || "").trim()) continue;
        const changed = setReactInputValue(prepared.lotInput, prepared.options[0].lot);
        if (changed) await new Promise((resolve) => window.setTimeout(resolve, 90));
      }
    } finally {
      applying = false;
      if (applyRequested) {
        applyRequested = false;
        window.setTimeout(() => applyAll(true), 120);
      }
    }
  }

  function commitEditableProduct(input, select) {
    const next = String(input.value || "").trim().toUpperCase().replace(/\s+/g, "");
    const current = String(select.value || DEFAULT_PRODUCT).trim();
    if (!next) {
      input.value = current || DEFAULT_PRODUCT;
      return;
    }
    if (!ensureEditableProduct(next, current)) return;
    if (!Array.from(select.options).some((option) => option.value === next)) {
      select.add(new Option(next, next));
    }
    setReactSelectValue(select, next);
  }

  function installEditableProductField(root) {
    installDefaultProduct();
    const field = fieldByLabel(root, "공정 / 품목");
    if (!field) return;
    const select = field.querySelector("select");
    if (!select || select.dataset.qmesEditableProduct === "1") return;
    select.dataset.qmesEditableProduct = "1";
    select.style.display = "none";

    const input = document.createElement("input");
    input.type = "text";
    input.value = String(select.value || DEFAULT_PRODUCT).trim() || DEFAULT_PRODUCT;
    input.placeholder = "공정 / 품목 직접 입력";
    input.autocomplete = "off";
    input.className = select.className;
    input.dataset.qmesProductInput = "1";
    input.title = "품목코드를 직접 입력한 뒤 Enter 또는 다른 곳을 클릭하면 반영됩니다.";
    field.appendChild(input);

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commitEditableProduct(input, select);
      input.blur();
    });
    input.addEventListener("change", () => commitEditableProduct(input, select));
    select.addEventListener("change", () => {
      const value = String(select.value || "").trim();
      if (document.activeElement !== input && value) input.value = value;
    });
  }

  function installDefaultProductionSite(root) {
    const shell = (root || document).querySelector?.(".qmes-wo-issue-shell")
      || document.querySelector(".qmes-wo-issue-shell");
    if (!shell) return;
    const field = fieldByLabel(shell, "생산 구분");
    const select = field && field.querySelector("select");
    if (!select || select.dataset.qmesDefaultSiteApplied === "1") return;
    select.dataset.qmesDefaultSiteApplied = "1";
    if (select.value === "C" && Array.from(select.options).some((option) => option.value === DEFAULT_SITE)) {
      setReactSelectValue(select, DEFAULT_SITE);
    }
  }

  function installResponsiveIssuedTableStyles() {
    if (document.getElementById("qmes-issued-table-responsive-style")) return;
    const style = document.createElement("style");
    style.id = "qmes-issued-table-responsive-style";
    style.textContent = `
      #root .qmes-issued-table-wrap{
        width:100%!important;
        overflow-x:auto!important;
        overflow-y:hidden!important;
        scrollbar-gutter:stable!important;
        -webkit-overflow-scrolling:touch;
      }
      #root .qmes-issued-table-v2{
        width:100%!important;
        min-width:1390px!important;
        table-layout:fixed!important;
        border-collapse:collapse!important;
      }
      #root .qmes-issued-table-v2 colgroup{display:table-column-group!important;}
      #root .qmes-issued-table-v2 th,
      #root .qmes-issued-table-v2 td{
        box-sizing:border-box!important;
        padding:8px 7px!important;
        vertical-align:middle!important;
        letter-spacing:0!important;
      }
      #root .qmes-issued-table-v2 th:nth-child(1),#root .qmes-issued-table-v2 td:nth-child(1){width:105px!important;}
      #root .qmes-issued-table-v2 th:nth-child(2),#root .qmes-issued-table-v2 td:nth-child(2){width:145px!important;}
      #root .qmes-issued-table-v2 th:nth-child(3),#root .qmes-issued-table-v2 td:nth-child(3){width:95px!important;}
      #root .qmes-issued-table-v2 th:nth-child(4),#root .qmes-issued-table-v2 td:nth-child(4){width:100px!important;}
      #root .qmes-issued-table-v2 th:nth-child(5),#root .qmes-issued-table-v2 td:nth-child(5){width:130px!important;}
      #root .qmes-issued-table-v2 th:nth-child(6),#root .qmes-issued-table-v2 td:nth-child(6){width:170px!important;}
      #root .qmes-issued-table-v2 th:nth-child(7),#root .qmes-issued-table-v2 td:nth-child(7){width:90px!important;}
      #root .qmes-issued-table-v2 th:nth-child(8),#root .qmes-issued-table-v2 td:nth-child(8){width:105px!important;}
      #root .qmes-issued-table-v2 th:nth-child(9),#root .qmes-issued-table-v2 td:nth-child(9){width:90px!important;}
      #root .qmes-issued-table-v2 th:nth-child(10),#root .qmes-issued-table-v2 td:nth-child(10){width:110px!important;}
      #root .qmes-issued-table-v2 th:nth-child(11),#root .qmes-issued-table-v2 td:nth-child(11){width:250px!important;}
      #root .qmes-issued-table-v2 th:nth-child(5),
      #root .qmes-issued-table-v2 td:nth-child(5),
      #root .qmes-issued-table-v2 th:nth-child(6),
      #root .qmes-issued-table-v2 td:nth-child(6){
        white-space:normal!important;
        overflow:visible!important;
        text-overflow:clip!important;
        word-break:keep-all!important;
        line-height:1.3!important;
      }
      #root .qmes-issued-table-v2 tbody tr{height:auto!important;min-height:48px!important;}
      #root .qmes-issued-table-v2 td:nth-child(11){overflow:visible!important;white-space:nowrap!important;}
      #root .qmes-issued-table-v2 td:nth-child(11) .qmes-manage-btn{
        width:auto!important;
        min-width:48px!important;
        height:28px!important;
        margin:0 2px!important;
        padding:0 7px!important;
        font-size:10px!important;
      }
      #root .qmes-issued-table-v2 td:nth-child(11) .qmes-manage-btn.view{min-width:58px!important;}
      @media(max-width:1180px){
        #root .qmes-issued-table-v2{min-width:1320px!important;font-size:11px!important;}
        #root .qmes-issued-table-v2 th,#root .qmes-issued-table-v2 td{padding-left:6px!important;padding-right:6px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("change", function (event) {
    const shell = event.target.closest && event.target.closest(".qmes-wo-issue-shell");
    if (!shell) return;
    if (event.target.matches('input[type="date"]')) {
      window.setTimeout(() => applyAll(false), 60);
      return;
    }
    if (event.target.matches("table.qmes-material-table tbody td:nth-child(2) select")) {
      window.setTimeout(() => applyAll(false), 60);
    }
  });

  installDefaultProduct();
  standardizeBykData();
  standardizeBykOptions(document);
  installResponsiveIssuedTableStyles();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) standardizeBykOptions(node);
    }));
    installDefaultProduct();
    installEditableProductField(document);
    installDefaultProductionSite(document);
    installResponsiveIssuedTableStyles();
    window.setTimeout(() => applyAll(true), 120);
  });

  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.setInterval(() => {
    installDefaultProduct();
    installEditableProductField(document);
    installDefaultProductionSite(document);
    installResponsiveIssuedTableStyles();
    applyAll(true);
  }, 1500);
})();
