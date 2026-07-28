/* QMES work-order LOT auto sync
 * - 생산일자 이하의 IQC 합격 LOT만 후보로 사용
 * - 최신 합격 LOT 자동 선택
 * - 거래처 현황 LOT를 보조 후보로 사용
 * - LOT 입력은 계속 수기 수정 가능
 * - BYK 원료 표시명: BYK180 (분산제)
 */
(function () {
  "use strict";

  const PASS_VALUES = new Set(["OK", "PASS", "합격", "적합"]);
  const BYK_DISPLAY_NAME = "BYK180 (분산제)";

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
    const db = window.DB || {};
    let changed = false;

    if (Array.isArray(db.iqc)) {
      db.iqc = db.iqc.map((row) => {
        if (normalizeMaterial(row && row.name) !== "BYK180" || row.name === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, name: BYK_DISPLAY_NAME };
      });
    }

    if (Array.isArray(db.partnerSuppliers)) {
      db.partnerSuppliers = db.partnerSuppliers.map((row) => {
        if (normalizeMaterial(row && row.material) !== "BYK180" || row.material === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, material: BYK_DISPLAY_NAME };
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
    const db = window.DB || {};
    const candidates = [db.iqc, db.insp && db.insp.IQC, db.iqcRecords, db.inspections && db.inspections.IQC];
    const rows = candidates.find(Array.isArray);
    return Array.isArray(rows) ? rows : [];
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
      candidates.push({ lot, date: received || "0000-00-00", supplier: firstValue(record, ["supplier", "company", "vendor"]) });
    });

    const partnerRows = Array.isArray(window.DB && window.DB.partnerSuppliers) ? window.DB.partnerSuppliers : [];
    partnerRows.forEach((record) => {
      if (normalizeMaterial(record.material) !== key) return;
      const lot = String(record.lot || "").trim();
      if (lot && !candidates.some((item) => item.lot === lot)) {
        candidates.push({ lot, date: "0000-00-00", supplier: record.company || "" });
      }
    });

    candidates.sort((a, b) => b.date.localeCompare(a.date));
    return candidates.filter((item, index, all) => all.findIndex((x) => x.lot === item.lot) === index);
  }

  function setReactInputValue(input, value) {
    if (!input || input.value === value) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findWorkOrderRoot(node) {
    if (!node || !node.closest) return null;
    return node.closest(".qmes-wo-issue-shell") || node.closest("section") || node.closest("main") || document;
  }

  function productionDate(root) {
    const dates = Array.from((root || document).querySelectorAll('input[type="date"]'));
    return dates.find((input) => input.value)?.value || "";
  }

  function materialRows(root) {
    const rows = Array.from((root || document).querySelectorAll("tbody tr"));
    return rows.filter((row) => {
      const select = row.querySelector("select");
      const inputs = row.querySelectorAll("input");
      return select && inputs.length >= 1 && Array.from(select.options || []).some((option) => normalizeMaterial(option.textContent) === "BYK180");
    });
  }

  function applyRow(row, prodDate, overwriteBlankOnly) {
    const selects = row.querySelectorAll("select");
    const materialSelect = Array.from(selects).find((select) => Array.from(select.options || []).some((option) => normalizeMaterial(option.textContent) === "BYK180"));
    const textInputs = Array.from(row.querySelectorAll('input[type="text"], input:not([type])'));
    const lotInput = textInputs.find((input) => /LOT/i.test(input.placeholder || "")) || textInputs[0];
    if (!materialSelect || !lotInput) return;

    standardizeBykOptions(row);
    const options = lotCandidates(materialSelect.value || materialSelect.options[materialSelect.selectedIndex]?.textContent, prodDate);
    const listId = `qmes-lot-${normalizeMaterial(materialSelect.value)}-${Math.random().toString(36).slice(2, 8)}`;
    let datalist = lotInput.nextElementSibling;
    if (!datalist || datalist.tagName !== "DATALIST") {
      datalist = document.createElement("datalist");
      lotInput.insertAdjacentElement("afterend", datalist);
    }
    datalist.id = listId;
    datalist.innerHTML = options.map((item) => `<option value="${String(item.lot).replace(/"/g, "&quot;")}">${item.date !== "0000-00-00" ? item.date : "거래처 LOT"}${item.supplier ? ` · ${item.supplier}` : ""}</option>`).join("");
    lotInput.setAttribute("list", listId);
    lotInput.title = options.length ? `사용 가능 LOT ${options.length}건 · 직접 입력 가능` : "사용 가능 합격 LOT 없음 · 직접 입력 가능";

    if (options.length && (!overwriteBlankOnly || !String(lotInput.value || "").trim())) setReactInputValue(lotInput, options[0].lot);
  }

  function applyAll(root, overwriteBlankOnly) {
    const date = productionDate(root);
    if (!date) return;
    window.setTimeout(() => materialRows(root).forEach((row) => applyRow(row, date, overwriteBlankOnly)), 50);
  }

  document.addEventListener("change", function (event) {
    const root = findWorkOrderRoot(event.target);
    if (event.target.matches('input[type="date"]')) {
      applyAll(root, false);
      return;
    }
    if (event.target.matches("select")) {
      window.setTimeout(() => applyRow(event.target.closest("tr"), productionDate(root), false), 30);
    }
  });

  standardizeBykData();
  standardizeBykOptions(document);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) standardizeBykOptions(node);
    }));
    applyAll(document, true);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
