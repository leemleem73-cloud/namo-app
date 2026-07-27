/* QMES work-order LOT auto sync
 * - 생산일자 이하의 IQC 합격 LOT만 후보로 사용
 * - 최신 합격 LOT 자동 선택
 * - 거래처 현황 LOT를 보조 후보로 사용
 * - LOT 입력은 계속 수기 수정 가능
 */
(function () {
  "use strict";

  const PASS_VALUES = new Set(["OK", "PASS", "합격", "적합"]);

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
    const candidates = [
      db.insp && db.insp.IQC,
      db.iqc,
      db.iqcRecords,
      db.inspections && db.inspections.IQC,
    ];
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

    const partnerRows = Array.isArray(window.DB && window.DB.partnerSuppliers)
      ? window.DB.partnerSuppliers
      : [];
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

  function productionDate(shell) {
    return shell && shell.querySelector('input[type="date"]')?.value || "";
  }

  function materialRows(shell) {
    return Array.from(shell.querySelectorAll("table.qmes-material-table tbody tr"));
  }

  function applyRow(row, prodDate, overwriteBlankOnly) {
    const materialSelect = row.querySelector("td:nth-child(2) select");
    const lotInput = row.querySelector('td:nth-child(3) input[type="text"], td:nth-child(3) input:not([type])');
    if (!materialSelect || !lotInput) return;

    const options = lotCandidates(materialSelect.value, prodDate);
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

    if (options.length && (!overwriteBlankOnly || !String(lotInput.value || "").trim())) {
      setReactInputValue(lotInput, options[0].lot);
    }
  }

  function applyAll(shell, overwriteBlankOnly) {
    const date = productionDate(shell);
    if (!date) return;
    window.setTimeout(() => {
      materialRows(shell).forEach((row) => applyRow(row, date, overwriteBlankOnly));
    }, 50);
  }

  document.addEventListener("change", function (event) {
    const shell = event.target.closest && event.target.closest(".qmes-wo-issue-shell");
    if (!shell) return;

    if (event.target.matches('input[type="date"]')) {
      applyAll(shell, false);
      return;
    }

    if (event.target.matches("table.qmes-material-table tbody td:nth-child(2) select")) {
      window.setTimeout(() => applyRow(event.target.closest("tr"), productionDate(shell), false), 30);
    }
  });

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".qmes-wo-issue-shell").forEach((shell) => applyAll(shell, true));
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
