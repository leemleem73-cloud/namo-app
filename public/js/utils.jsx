/* QMES module: utils — extracted from index.html without logic changes. */

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextInspectionNo(prefix, dateValue, rows, fieldName) {
  const fullDate = String(dateValue || "").replaceAll("-", "").slice(0, 8);
  const dateKey = fullDate.length === 8 ? fullDate.slice(2) : fullDate;
  const base = `${prefix}-${dateKey}-`;
  const maxSeq = (rows || []).reduce((max, row) => {
    // 출하·공정검사는 한 검사번호 아래 여러 항목이 저장되므로 groupId를 우선 사용한다.
    // 과거 데이터처럼 groupId가 없는 경우에는 id 끝의 항목 순번(-1, -2...)을 허용한다.
    const value = String(row?.groupId || row?.[fieldName] || "");
    if (!value.startsWith(base)) return max;
    const rest = value.slice(base.length);
    const match = rest.match(/^(\d+)(?:-\d+)?$/);
    if (!match) return max;
    const seq = Number(match[1]);
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `${base}${String(maxSeq + 1).padStart(4, "0")}`;
}


function iqcTone(v) {
  if (v === "합격") return "green";
  if (v === "검사중") return "blue";
  if (v.includes("조건부")) return "amber";
  return "red"; // 불합격 / 불합격
}

function qmesStripQuantityUnit(value) {
  return String(value ?? "").replace(/\s*(kg|g|t|EA|L|매|장|캔)\s*$/i, "").trim();
}

function qmesQuantityWithUnit(value, unit) {
  const raw = qmesStripQuantityUnit(value).replace(/[^0-9.]/g, "");
  if (!raw) return "";
  const parts = raw.split(".");
  const normalized = parts.length > 1
    ? `${parts.shift()}.${parts.join("")}`
    : raw;
  return `${normalized} ${unit}`;
}


const FIELD_ITEMS = ["점도", "고형분", "입도(Dmax)", "수분", "접착력", "절연저항", "Gauss(필터)", "외관", "전해액 안정성"];

function autoJudge(check, raw) {
  const spec = QC_ITEMS[check];
  const num = parseFloat(String(raw).replace(/[^0-9.\-]/g, ""));
  if (isNaN(num)) return null;
  if (spec.lo != null && num < spec.lo) return "불합격";
  if (spec.hi != null && num > spec.hi) return "불합격";
  return "합격";
}

/* 수입검사 신규등록은 입고일자·검사일자를 각각 저장하고,
   관리대장 목록의 대표 날짜는 입고일자를 우선 표시합니다. */
(function installIqcReceiveDateLedgerPatch() {
  if (window.__QMES_IQC_RECEIVE_DATE_LEDGER_PATCH__) return;
  window.__QMES_IQC_RECEIVE_DATE_LEDGER_PATCH__ = true;

  const text = (value) => String(value ?? "").trim();
  const dateOnly = (value) => text(value).slice(0, 10);
  const normalize = (value) => text(value).toUpperCase();

  const findRecordForRow = (cells) => {
    const lot = normalize(cells[1]?.textContent);
    if (!lot) return null;
    const supplier = text(cells[2]?.textContent);
    const material = text(cells[3]?.textContent);
    const judge = text(cells[4]?.textContent);
    const inspector = text(cells[5]?.textContent);
    const shownDate = dateOnly(cells[0]?.textContent);
    const database = typeof DB !== "undefined" && DB ? DB : {};
    const source = Array.isArray(database.iqc) ? database.iqc : [];

    const candidates = source.filter((record) => {
      if (normalize(record?.lot) !== lot) return false;
      if (supplier && supplier !== "-" && text(record?.supplier) !== supplier) return false;
      if (material && material !== "-" && text(record?.name) !== material) return false;
      if (judge && text(record?.judge) !== judge) return false;
      const recordInspector = text(record?.inspector || record?.by);
      if (inspector && inspector !== "-" && recordInspector !== inspector) return false;
      return true;
    });

    return candidates.find((record) =>
      dateOnly(record?.recv) === shownDate || dateOnly(record?.inspectedAt) === shownDate
    ) || candidates[0] || source.find((record) => normalize(record?.lot) === lot) || null;
  };

  const applyReceiveDateLedger = () => {
    const table = document.querySelector(".qmes-iqc-ledger-table");
    if (!table) return;

    const firstHeader = table.querySelector("thead th:first-child");
    if (firstHeader && text(firstHeader.textContent) !== "입고일자") {
      firstHeader.textContent = "입고일자";
    }

    table.querySelectorAll("tbody tr").forEach((row) => {
      if (row.querySelector(".qmes-iqc-empty-row")) return;
      const cells = row.querySelectorAll("td");
      if (cells.length < 6) return;
      const record = findRecordForRow(cells);
      const receiveDate = dateOnly(record?.recv || record?.inspectedAt || "-") || "-";
      if (text(cells[0].textContent) !== receiveDate) cells[0].textContent = receiveDate;
      cells[0].title = record?.inspectedAt && dateOnly(record.inspectedAt) !== receiveDate
        ? `검사일자 ${dateOnly(record.inspectedAt)}`
        : "입고일자";
    });
  };

  let animationFrame = 0;
  const scheduleApply = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      applyReceiveDateLedger();
    });
  };

  const startObserver = () => {
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    scheduleApply();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
  document.addEventListener("qmes:data-updated", scheduleApply);
  window.addEventListener("storage", scheduleApply);
})();

/* 수입검사에서 kg로 관리되는 입고값의 명칭을 '입고중량'으로 통일합니다.
   저장 필드(qty)는 유지하여 기존 데이터·연동에는 영향을 주지 않습니다. */
(function installIqcReceivingWeightTerminologyPatch() {
  if (window.__QMES_IQC_RECEIVING_WEIGHT_TERMINOLOGY_PATCH__) return;
  window.__QMES_IQC_RECEIVING_WEIGHT_TERMINOLOGY_PATCH__ = true;

  const sourceTerm = "입고수량";
  const targetTerm = "입고중량";

  const replaceText = (value) => String(value ?? "").replaceAll(sourceTerm, targetTerm);

  const applyTerminology = (root = document.body) => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeValue && node.nodeValue.includes(sourceTerm)) {
        node.nodeValue = replaceText(node.nodeValue);
      }
      node = walker.nextNode();
    }

    root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach((element) => {
      ["placeholder", "title", "aria-label"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value && value.includes(sourceTerm)) element.setAttribute(attribute, replaceText(value));
      });
    });
  };

  const NativeBlob = window.Blob;
  if (NativeBlob && !NativeBlob.__QMES_IQC_WEIGHT_PATCH__) {
    function QmesBlob(parts, options) {
      const isCsv = String(options?.type || "").toLowerCase().includes("text/csv");
      const nextParts = isCsv
        ? (parts || []).map((part) => typeof part === "string" ? replaceText(part) : part)
        : parts;
      return new NativeBlob(nextParts, options);
    }
    QmesBlob.prototype = NativeBlob.prototype;
    Object.setPrototypeOf(QmesBlob, NativeBlob);
    QmesBlob.__QMES_IQC_WEIGHT_PATCH__ = true;
    window.Blob = QmesBlob;
  }

  let frame = 0;
  const scheduleApply = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      applyTerminology();
    });
  };

  const start = () => {
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"]
    });
    scheduleApply();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
