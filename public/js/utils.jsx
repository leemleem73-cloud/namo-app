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

