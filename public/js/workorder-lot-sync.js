/* QMES work-order helpers
 * - IQC passed LOT suggestions for material rows
 * - editable product code and production-site default
 * - responsive issued-history table
 * - editable work-order LOT number with related-data migration
 *
 * Important: DOM enhancement is event-driven and debounced. Do not add polling or
 * rewrite unchanged option text, because that can cause a MutationObserver loop.
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

  let applyingLots = false;
  let applyLotsAgain = false;
  let activeEditLot = "";
  let pendingRename = null;
  let installTimer = null;
  let bykDataStandardized = false;

  function getDb() {
    try {
      if (typeof DB !== "undefined" && DB) return DB;
    } catch (_error) {}
    return window.DB || {};
  }

  function getBom() {
    try {
      return typeof BOM !== "undefined" && BOM ? BOM : null;
    } catch (_error) {
      return null;
    }
  }

  function cloneBomEntry(entry) {
    if (!entry) return null;
    return {
      ...entry,
      tanks:Array.isArray(entry.tanks) ? [...entry.tanks] : [],
      items:Array.isArray(entry.items) ? entry.items.map((item) => ({ ...item })) : [],
    };
  }

  function normalizeMaterial(value) {
    const text = String(value || "").toUpperCase().replace(/\s+/g, "");
    if (text.includes("BYK180") || text.includes("BYK-180") || text.includes("분산제")) return "BYK180";
    if (text.includes("AOH30") || text.includes("BOEHMITE")) return "BOEHMITE";
    for (const key of ["PVDF", "PAI", "NMP", "SBR", "SBS"]) {
      if (text.includes(key)) return key;
    }
    return text;
  }

  function normalizeLot(value) {
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function firstValue(record, keys) {
    for (const key of keys) {
      const value = record && record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function dateText(value) {
    const match = String(value || "").match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    if (!match) return "";
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  }

  function fieldByLabel(root, label) {
    const target = String(label || "").replace(/\s+/g, "");
    return Array.from((root || document).querySelectorAll(".qmes-wo-form-field")).find((field) => {
      const text = String(field.querySelector("span")?.textContent || "").replace(/\s+/g, "");
      return text.includes(target);
    });
  }

  function setReactInputValue(input, value) {
    if (!input || input.value === value) return false;
    const previous = input.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (!setter) return false;
    setter.call(input, value);
    if (input._valueTracker) input._valueTracker.setValue(previous);
    input.dispatchEvent(new Event("input", { bubbles:true }));
    input.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  }

  function setReactSelectValue(select, value) {
    if (!select || select.value === value) return false;
    const previous = select.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
    if (!setter) return false;
    setter.call(select, value);
    if (select._valueTracker) select._valueTracker.setValue(previous);
    select.dispatchEvent(new Event("input", { bubbles:true }));
    select.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  }

  function ensureDefaultProduct() {
    const bom = getBom();
    if (!bom) return false;
    if (!bom[DEFAULT_PRODUCT]) {
      const sourceKey = OLD_PRODUCTS.find((name) => bom[name])
        || Object.keys(bom).find((name) => bom[name]?.workType === "완제품");
      if (sourceKey) bom[DEFAULT_PRODUCT] = cloneBomEntry(bom[sourceKey]);
    }
    OLD_PRODUCTS.forEach((name) => {
      if (name !== DEFAULT_PRODUCT && bom[name]) delete bom[name];
    });
    return Boolean(bom[DEFAULT_PRODUCT]);
  }

  function ensureProductName(productName, sourceName) {
    const bom = getBom();
    if (!bom || !productName) return false;
    if (bom[productName]) return true;
    const source = bom[sourceName] || bom[DEFAULT_PRODUCT]
      || Object.values(bom).find((entry) => entry?.workType === "완제품")
      || Object.values(bom)[0];
    if (!source) return false;
    bom[productName] = cloneBomEntry(source);
    return true;
  }

  function standardizeBykDataOnce() {
    if (bykDataStandardized) return;
    const db = getDb();
    let changed = false;

    if (Array.isArray(db.iqc)) {
      db.iqc = db.iqc.map((row) => {
        if (normalizeMaterial(row?.name) !== "BYK180" || row.name === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, name:BYK_DISPLAY_NAME };
      });
    }
    if (Array.isArray(db.partnerSuppliers)) {
      db.partnerSuppliers = db.partnerSuppliers.map((row) => {
        if (normalizeMaterial(row?.material) !== "BYK180" || row.material === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, material:BYK_DISPLAY_NAME };
      });
    }

    bykDataStandardized = true;
    if (changed && typeof window.dbSave === "function") {
      try { window.dbSave(); } catch (error) { console.warn("BYK180 명칭 저장 실패", error); }
    }
  }

  function standardizeBykOptions(root) {
    (root || document).querySelectorAll?.("select option").forEach((option) => {
      if (normalizeMaterial(option.textContent) === "BYK180" && option.textContent !== BYK_DISPLAY_NAME) {
        option.textContent = BYK_DISPLAY_NAME;
      }
    });
  }

  function iqcRows() {
    const db = getDb();
    return [db.iqc, db.insp?.IQC, db.iqcRecords, db.inspections?.IQC].find(Array.isArray) || [];
  }

  function supplierRows() {
    const db = getDb();
    const rawLots = Object.values(db.rawMaterialLots || {}).map((row) => ({
      company:row.supplier || row.company || "",
      material:row.material || row.name || "",
      lot:row.lot || row.lotNo || "",
      status:row.status || "거래중",
    }));
    const seen = new Set();
    return [...(db.partnerSuppliers || []), ...rawLots, ...DEFAULT_SUPPLIERS].filter((row) => {
      const lot = normalizeLot(row.lot);
      const key = `${normalizeMaterial(row.material)}|${lot}`;
      if (!lot || seen.has(key) || String(row.status || "거래중") === "거래중지") return false;
      seen.add(key);
      return true;
    });
  }

  function lotCandidates(materialName, productionDate) {
    const materialKey = normalizeMaterial(materialName);
    const cutoff = dateText(productionDate);
    const result = [];

    iqcRows().forEach((row) => {
      const material = firstValue(row, ["name", "material", "materialName", "rawMaterial", "item", "product"]);
      const lot = String(firstValue(row, ["lot", "lotNo", "lotNumber", "materialLot"])).trim();
      const received = dateText(firstValue(row, ["recv", "receiveDate", "receivedDate", "inDate", "date", "inspectionDate"]));
      const judgment = String(firstValue(row, ["judge", "judgment", "result", "inspectionResult", "status"])).trim().toUpperCase();
      if (!lot || normalizeMaterial(material) !== materialKey || !PASS_VALUES.has(judgment)) return;
      if (cutoff && received && received > cutoff) return;
      result.push({ lot, date:received || "0000-00-00", supplier:firstValue(row, ["supplier", "company", "vendor"]), source:"IQC" });
    });

    supplierRows().forEach((row) => {
      if (normalizeMaterial(row.material) !== materialKey) return;
      const lot = String(row.lot || "").trim();
      if (lot && !result.some((item) => normalizeLot(item.lot) === normalizeLot(lot))) {
        result.push({ lot, date:"0000-00-00", supplier:row.company || "", source:"거래처 현황" });
      }
    });

    result.sort((left, right) => left.source !== right.source
      ? (left.source === "IQC" ? -1 : 1)
      : right.date.localeCompare(left.date));
    return result.filter((item, index, rows) => rows.findIndex((row) => normalizeLot(row.lot) === normalizeLot(item.lot)) === index);
  }

  function productionDate(shell) {
    return Array.from(shell.querySelectorAll('.qmes-wo-form-field input[type="date"]')).find((input) => input.value)?.value || "";
  }

  function materialRows(shell) {
    return Array.from(shell.querySelectorAll("table.qmes-material-table tbody tr"));
  }

  function prepareMaterialRow(row, date) {
    const materialSelect = row?.querySelector("td:nth-child(2) select");
    const lotInput = row?.querySelector('td:nth-child(3) input[placeholder="원재료 LOT"]');
    if (!materialSelect || !lotInput) return null;

    const materialName = materialSelect.value || materialSelect.options[materialSelect.selectedIndex]?.textContent || "";
    const options = lotCandidates(materialName, date);
    const listId = `qmes-lot-${normalizeMaterial(materialName)}-${row.rowIndex || 0}`;
    let datalist = row.querySelector(`datalist[data-qmes-lot-list="${normalizeMaterial(materialName)}"]`);
    if (!datalist) {
      datalist = document.createElement("datalist");
      datalist.dataset.qmesLotList = normalizeMaterial(materialName);
      lotInput.insertAdjacentElement("afterend", datalist);
    }

    const html = options.map((item) =>
      `<option value="${String(item.lot).replace(/"/g, "&quot;")}">${item.source}${item.date !== "0000-00-00" ? ` · ${item.date}` : ""}${item.supplier ? ` · ${item.supplier}` : ""}</option>`
    ).join("");
    if (datalist.id !== listId) datalist.id = listId;
    if (datalist.innerHTML !== html) datalist.innerHTML = html;
    if (lotInput.getAttribute("list") !== listId) lotInput.setAttribute("list", listId);
    lotInput.title = options.length
      ? `사용 가능 LOT ${options.length}건 · IQC 우선 · 직접 입력 가능`
      : "사용 가능 LOT 없음 · 직접 입력 가능";
    return { lotInput, options };
  }

  async function applyMaterialLots(blankOnly = true) {
    if (applyingLots) {
      applyLotsAgain = true;
      return;
    }
    const shell = document.querySelector(".qmes-wo-issue-shell");
    if (!shell) return;
    const date = productionDate(shell);
    if (!date) return;

    applyingLots = true;
    try {
      const rows = materialRows(shell);
      for (let index = 0; index < rows.length; index += 1) {
        const currentShell = document.querySelector(".qmes-wo-issue-shell");
        if (!currentShell) break;
        const currentRows = materialRows(currentShell);
        const prepared = prepareMaterialRow(currentRows[index], productionDate(currentShell));
        if (!prepared || !prepared.options.length) continue;
        if (blankOnly && normalizeLot(prepared.lotInput.value)) continue;
        if (setReactInputValue(prepared.lotInput, prepared.options[0].lot)) {
          await new Promise((resolve) => window.setTimeout(resolve, 60));
        }
      }
    } finally {
      applyingLots = false;
      if (applyLotsAgain) {
        applyLotsAgain = false;
        window.setTimeout(() => applyMaterialLots(true), 80);
      }
    }
  }

  function installEditableProduct(shell) {
    if (!shell) return;
    ensureDefaultProduct();
    const field = fieldByLabel(shell, "공정/품목");
    const select = field?.querySelector("select");
    if (!select || field.querySelector('input[data-qmes-product-input="1"]')) return;

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

    const commit = () => {
      const next = String(input.value || "").trim().toUpperCase().replace(/\s+/g, "");
      const current = String(select.value || DEFAULT_PRODUCT).trim();
      if (!next) {
        input.value = current || DEFAULT_PRODUCT;
        return;
      }
      if (!ensureProductName(next, current)) return;
      if (!Array.from(select.options).some((option) => option.value === next)) {
        select.add(new Option(next, next));
      }
      setReactSelectValue(select, next);
    };

    input.addEventListener("change", commit);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commit();
      input.blur();
    });
  }

  function isEditShell(shell) {
    return Boolean(shell && String(shell.textContent || "").includes("작업지시 수정"));
  }

  function installDefaultSite(shell) {
    if (!shell || isEditShell(shell)) return;
    const select = fieldByLabel(shell, "생산구분")?.querySelector("select");
    if (!select || select.dataset.qmesDefaultSiteApplied === "1") return;
    select.dataset.qmesDefaultSiteApplied = "1";
    if (select.value === "C" && Array.from(select.options).some((option) => option.value === DEFAULT_SITE)) {
      setReactSelectValue(select, DEFAULT_SITE);
    }
  }

  function installResponsiveStyles() {
    if (document.getElementById("qmes-wo-helper-style")) return;
    const style = document.createElement("style");
    style.id = "qmes-wo-helper-style";
    style.textContent = `
      #root .qmes-issued-table-wrap{width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch}
      #root .qmes-issued-table-v2{width:100%!important;min-width:1390px!important;table-layout:fixed!important;border-collapse:collapse!important}
      #root .qmes-issued-table-v2 th,#root .qmes-issued-table-v2 td{box-sizing:border-box!important;padding:8px 7px!important;vertical-align:middle!important}
      #root .qmes-issued-table-v2 th:nth-child(1),#root .qmes-issued-table-v2 td:nth-child(1){width:105px!important}
      #root .qmes-issued-table-v2 th:nth-child(2),#root .qmes-issued-table-v2 td:nth-child(2){width:145px!important}
      #root .qmes-issued-table-v2 th:nth-child(3),#root .qmes-issued-table-v2 td:nth-child(3){width:95px!important}
      #root .qmes-issued-table-v2 th:nth-child(4),#root .qmes-issued-table-v2 td:nth-child(4){width:100px!important}
      #root .qmes-issued-table-v2 th:nth-child(5),#root .qmes-issued-table-v2 td:nth-child(5){width:130px!important;white-space:normal!important;overflow:visible!important}
      #root .qmes-issued-table-v2 th:nth-child(6),#root .qmes-issued-table-v2 td:nth-child(6){width:170px!important;white-space:normal!important;overflow:visible!important}
      #root .qmes-issued-table-v2 th:nth-child(7),#root .qmes-issued-table-v2 td:nth-child(7){width:90px!important}
      #root .qmes-issued-table-v2 th:nth-child(8),#root .qmes-issued-table-v2 td:nth-child(8){width:105px!important}
      #root .qmes-issued-table-v2 th:nth-child(9),#root .qmes-issued-table-v2 td:nth-child(9){width:90px!important}
      #root .qmes-issued-table-v2 th:nth-child(10),#root .qmes-issued-table-v2 td:nth-child(10){width:110px!important}
      #root .qmes-issued-table-v2 th:nth-child(11),#root .qmes-issued-table-v2 td:nth-child(11){width:250px!important;white-space:nowrap!important}
      #root .qmes-issued-table-v2 .qmes-manage-btn{width:auto!important;min-width:48px!important;height:28px!important;margin:0 2px!important;padding:0 7px!important;font-size:10px!important}
    `;
    document.head.appendChild(style);
  }

  function workOrderLotInput(shell) {
    return fieldByLabel(shell, "LOTNo.")?.querySelector('input[placeholder="LOT No."]')
      || fieldByLabel(shell, "LOTNo")?.querySelector('input[placeholder="LOT No."]');
  }

  function objectKeyByLot(object, normalizedLot) {
    if (!object || !normalizedLot) return "";
    return Object.keys(object).find((key) => normalizeLot(key) === normalizedLot) || "";
  }

  function lotExists(nextValue, oldValue) {
    const db = getDb();
    const next = normalizeLot(nextValue);
    const old = normalizeLot(oldValue);
    if (!next) return false;
    if ((db.batches || []).some((row) => normalizeLot(row?.no) === next && normalizeLot(row?.no) !== old)) return true;
    return [db.woDocs, db.lots, db.intermediateLots].some((object) =>
      object && Object.keys(object).some((key) => normalizeLot(key) === next && normalizeLot(key) !== old)
    );
  }

  function installEditableLot(shell) {
    if (!isEditShell(shell)) {
      if (!shell && !pendingRename) activeEditLot = "";
      return;
    }
    const input = workOrderLotInput(shell);
    if (!input) return;

    const current = normalizeLot(input.value);
    const currentExists = (getDb().batches || []).some((row) => normalizeLot(row?.no) === current);
    if (!activeEditLot || (!pendingRename && current !== activeEditLot && currentExists)) activeEditLot = current;

    input.dataset.qmesOriginalLot = activeEditLot;
    if (input.readOnly) input.readOnly = false;
    input.removeAttribute("readonly");
    input.classList.remove("bg-slate-800/60", "text-slate-400", "cursor-not-allowed");
    input.classList.add("text-slate-100");
    input.title = "LOT No. 직접 수정 가능 · 저장 시 LOT 추적과 검사 연결도 함께 변경됩니다.";
  }

  function replaceLotInList(values, oldLot, newLot) {
    if (!Array.isArray(values)) return values;
    return Array.from(new Set(values.map((value) => normalizeLot(value) === oldLot ? newLot : value)));
  }

  function updateRows(rows, oldLot, newLot, fields) {
    (rows || []).forEach((row) => {
      if (!row) return;
      fields.forEach((field) => {
        if (normalizeLot(row[field]) === oldLot) row[field] = newLot;
      });
    });
  }

  function moveObjectKey(object, oldLot, newLot, patch) {
    const oldKey = objectKeyByLot(object, oldLot);
    if (!oldKey) return;
    object[newLot] = { ...object[oldKey], ...patch };
    if (oldKey !== newLot) delete object[oldKey];
  }

  function migrateLotReferences(oldValue, newValue) {
    const db = getDb();
    const oldLot = normalizeLot(oldValue);
    const newLot = normalizeLot(newValue);
    if (!oldLot || !newLot || oldLot === newLot) return false;
    if (lotExists(newLot, oldLot)) throw new Error(`이미 사용 중인 LOT No.입니다: ${newLot}`);

    db.batches = (db.batches || []).map((row) => normalizeLot(row?.no) === oldLot ? { ...row, no:newLot } : row);
    moveObjectKey(db.woDocs, oldLot, newLot, { lotNo:newLot, no:newLot, wo:newLot });
    moveObjectKey(db.lots, oldLot, newLot, { lot:newLot, lotNo:newLot, wo:newLot });
    moveObjectKey(db.intermediateLots, oldLot, newLot, { lot:newLot, workOrder:newLot });

    Object.values(db.woDocs || {}).forEach((doc) => {
      if (!doc) return;
      ["lotNo", "no", "wo"].forEach((field) => { if (normalizeLot(doc[field]) === oldLot) doc[field] = newLot; });
      (doc.inputs || []).forEach((row) => {
        if (normalizeLot(row?.lot) === oldLot) row.lot = newLot;
        if (normalizeLot(row?.materialLot) === oldLot) row.materialLot = newLot;
      });
    });

    Object.values(db.lots || {}).forEach((lot) => {
      if (!lot) return;
      if (normalizeLot(lot.wo) === oldLot) lot.wo = newLot;
      if (normalizeLot(lot.binderLot) === oldLot) lot.binderLot = newLot;
      (lot.materials || []).forEach((row) => { if (normalizeLot(row?.lot) === oldLot) row.lot = newLot; });
      if (lot.ship) updateRows([lot.ship], oldLot, newLot, ["lot", "lotNo", "finishedLot", "workOrder"]);
    });

    Object.values(db.intermediateLots || {}).forEach((lot) => {
      if (!lot) return;
      if (normalizeLot(lot.lot) === oldLot) lot.lot = newLot;
      if (normalizeLot(lot.workOrder) === oldLot) lot.workOrder = newLot;
      lot.parentLots = replaceLotInList(lot.parentLots, oldLot, newLot);
      lot.childLots = replaceLotInList(lot.childLots, oldLot, newLot);
    });

    Object.values(db.intermediateContainers || {}).forEach((row) => updateRows([row], oldLot, newLot, ["lot", "workOrder", "lastWorkOrder"]));
    Object.values(db.materialRemainders || {}).forEach((row) => updateRows([row], oldLot, newLot, ["workOrder"]));
    updateRows(db.insp?.PQC, oldLot, newLot, ["lot", "lotNo", "workOrder"]);
    updateRows(db.insp?.OQC, oldLot, newLot, ["lot", "lotNo", "workOrder"]);

    [
      ["popEntries", ["lot", "lotNo", "workOrder"]],
      ["shipments", ["lot", "lotNo", "finishedLot", "workOrder"]],
      ["ncrs", ["lot", "lotNo", "targetLot", "workOrder"]],
      ["nonconformities", ["lot", "lotNo", "targetLot", "workOrder"]],
      ["audit", ["lot", "lotNo", "target", "ref", "key"]],
      ["auditLogs", ["lot", "lotNo", "target", "ref", "key"]],
    ].forEach(([key, fields]) => updateRows(db[key], oldLot, newLot, fields));

    (db.holds || []).forEach((row) => {
      updateRows([row], oldLot, newLot, ["lot", "lotNo", "targetLot", "workOrder"]);
      if (typeof row.target === "string") row.target = row.target.split(oldLot).join(newLot);
    });
    return true;
  }

  async function syncInspectionGroups(newLot) {
    if (typeof window.qmesSyncUpsert !== "function") return;
    const db = getDb();
    for (const mode of ["PQC", "OQC"]) {
      const groups = new Map();
      (db.insp?.[mode] || [])
        .filter((row) => normalizeLot(row?.lot || row?.lotNo) === newLot)
        .forEach((row) => {
          const key = String(row.groupId || row.id || "").trim();
          if (!key) return;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(row);
        });

      for (const [key, rows] of groups) {
        await window.qmesSyncUpsert(mode.toLowerCase(), key, {
          mode,
          lotNo:newLot,
          rows,
          lotRecord:db.lots?.[newLot] || null,
          holds:(db.holds || []).filter((row) => String(row.target || "").includes(newLot)),
          savedAt:new Date().toISOString(),
          savedBy:String(window.__QMES_USER__?.name || window.__QMES_USER__ || ""),
        });
      }
    }
  }

  function installSaveBridges() {
    if (typeof window.dbSave === "function" && !window.dbSave.__qmesLotRename) {
      const originalSave = window.dbSave;
      const wrappedSave = function (...args) {
        if (pendingRename && !pendingRename.applied) {
          migrateLotReferences(pendingRename.oldLot, pendingRename.newLot);
          pendingRename.applied = true;
        }
        return originalSave.apply(this, args);
      };
      wrappedSave.__qmesLotRename = true;
      window.dbSave = wrappedSave;
      try { dbSave = wrappedSave; } catch (_error) {}
    }

    if (typeof window.qmesSyncWorkOrder === "function" && !window.qmesSyncWorkOrder.__qmesLotRename) {
      const originalSync = window.qmesSyncWorkOrder;
      const wrappedSync = async function (lotNo) {
        const rename = pendingRename?.applied && normalizeLot(lotNo) === pendingRename.oldLot
          ? { ...pendingRename }
          : null;
        if (!rename) return originalSync.apply(this, arguments);

        try {
          const result = await originalSync.call(this, rename.newLot);
          await syncInspectionGroups(rename.newLot);
          if (typeof window.qmesSyncUpsert === "function") {
            await window.qmesSyncUpsert("workorder", rename.oldLot, {
              lotNo:rename.oldLot,
              deleted:true,
              renamedTo:rename.newLot,
              deletedAt:new Date().toISOString(),
              deletedBy:String(window.__QMES_USER__?.name || window.__QMES_USER__ || ""),
            });
          }
          return result;
        } finally {
          pendingRename = null;
          activeEditLot = "";
        }
      };
      wrappedSync.__qmesLotRename = true;
      window.qmesSyncWorkOrder = wrappedSync;
      try { qmesSyncWorkOrder = wrappedSync; } catch (_error) {}
    }
  }

  function installCurrentShell() {
    ensureDefaultProduct();
    standardizeBykDataOnce();
    installResponsiveStyles();
    installSaveBridges();

    const shell = document.querySelector(".qmes-wo-issue-shell");
    if (!shell) {
      if (!pendingRename) activeEditLot = "";
      return;
    }

    standardizeBykOptions(shell);
    installEditableProduct(shell);
    installDefaultSite(shell);
    installEditableLot(shell);

    if (shell.dataset.qmesMaterialLotsInitialized !== "1") {
      shell.dataset.qmesMaterialLotsInitialized = "1";
      window.setTimeout(() => applyMaterialLots(true), 80);
    }
  }

  function scheduleInstall() {
    if (installTimer) return;
    installTimer = window.setTimeout(() => {
      installTimer = null;
      installCurrentShell();
    }, 20);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("button");
    const shell = event.target.closest?.(".qmes-wo-issue-shell");
    if (!button || !isEditShell(shell)) return;

    if (button.classList.contains("qmes-inspection-cancel-btn")) {
      pendingRename = null;
      activeEditLot = "";
      return;
    }
    if (!button.classList.contains("qmes-inspection-save-btn")) return;

    installEditableLot(shell);
    const input = workOrderLotInput(shell);
    const oldLot = normalizeLot(input?.dataset.qmesOriginalLot || activeEditLot);
    const newLot = normalizeLot(input?.value);
    if (!oldLot || !newLot || (newLot !== oldLot && lotExists(newLot, oldLot))) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.alert(!newLot ? "LOT No.를 확인하세요." : `이미 사용 중인 LOT No.입니다.\n${newLot}`);
      return;
    }
    pendingRename = newLot === oldLot ? null : { oldLot, newLot, applied:false };
  }, true);

  document.addEventListener("change", (event) => {
    const shell = event.target.closest?.(".qmes-wo-issue-shell");
    if (!shell) return;
    if (event.target.matches('input[type="date"]')
      || event.target.matches("table.qmes-material-table tbody td:nth-child(2) select")) {
      window.setTimeout(() => applyMaterialLots(false), 50);
    }
  });

  document.addEventListener("focusin", (event) => {
    if (!event.target.matches?.('input[placeholder="LOT No."]')) return;
    const shell = event.target.closest?.(".qmes-wo-issue-shell");
    installEditableLot(shell);
  }, true);

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => {
      if (node.nodeType !== 1) return false;
      return node.matches?.(".qmes-wo-issue-shell")
        || node.closest?.(".qmes-wo-issue-shell")
        || node.querySelector?.(".qmes-wo-issue-shell");
    }));
    if (relevant) scheduleInstall();
  });

  installCurrentShell();
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();
