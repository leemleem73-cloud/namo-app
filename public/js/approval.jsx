/* QMES module: approval — extracted from index.html without logic changes. */

function holdTone(s) {
  if (s === "차단중") return "red";
  if (s.includes("조건부")) return "amber";
  if (s.includes("요청")) return "blue";
  return "green";
}

function InterlockTab() {
  const [holds, setHolds] = useState(DB.holds);
  const active = holds.filter((h) => h.status === "차단중").length;
  const cond = holds.filter((h) => h.status.includes("조건부") || h.status.includes("요청")).length;

  const requestRelease = (id) => {
    const next = holds.map((h) => (h.id === id && h.status === "차단중" ? { ...h, status: "해제 요청중 (승인 대기)" } : h));
    setHolds(next); DB.holds = next; dbSave();
  };
  const approve = (id) => {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const next = holds.map((h) => (h.id === id && h.status.includes("요청") ? { ...h, status: "해제 완료", release: `${t} · 승인 ${window.__QMES_USER__ || "품질부장"}` } : h));
    setHolds(next); DB.holds = next; dbSave();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi icon={Lock} label="차단중 (Hold)" value={active} unit="건" tone="text-red-400" />
        <Kpi icon={ShieldAlert} label="조건부 · 승인 대기" value={cond} unit="건" tone="text-amber-400" />
        <Kpi icon={Unlock} label="해제 완료" value={holds.length - active - cond} unit="건" tone="text-emerald-400" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {GATES.map((g, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <g.icon size={15} className="text-sky-400 shrink-0" />
              <span className="text-sm font-medium text-slate-100 leading-tight">{g.name}</span>
            </div>
            <div className="mt-2"><Badge tone="red">{g.target}</Badge></div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{g.rule}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
              <ShieldCheck size={12} className="text-slate-500" /> {g.sys}
            </div>
          </div>
        ))}
      </div>

      <Panel title="현장 부적합 격리 Rack 현황" right={<span className="text-xs text-slate-400">Rack 입고/출고는 홀드 등록·해제와 연동 (임의 반출 시 스캔 거부)</span>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RACKS.map((r) => (
            <div key={r.id} className={`rounded-lg border p-3 ${r.state === "사용중" ? "bg-amber-500/5 border-amber-500/40" : "bg-slate-800/40 border-slate-700/60"}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-slate-100">{r.id}</span>
                <Badge tone={r.state === "사용중" ? "amber" : "gray"}>{r.state}</Badge>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{r.zone}</div>
              <div className="text-xs text-slate-200 mt-2 leading-snug min-h-[32px]">{r.item}</div>
              {r.hold !== "-" && <div className="text-[10px] font-mono text-sky-300 mt-1">{r.hold} 연계</div>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="차단(Hold) 현황 및 해제 관리" right={<span className="text-xs text-slate-400">해제는 조건 충족 + 승인권자 승인 시에만 가능 (이력 보존)</span>}>
        <div className="flex flex-col divide-y divide-slate-800/60">
          {holds.length === 0 && <p className="py-2 text-sm text-slate-500">현재 차단(Hold) 건이 없습니다 — 부적합 발생 시 자동 등록됩니다.</p>}
          {holds.map((h) => (
            <div key={h.id} className="py-3.5 flex flex-col md:flex-row md:items-start gap-3">
              <div className="flex items-center gap-2 md:w-52 shrink-0">
                {h.status === "차단중" ? <Lock size={15} className="text-red-400 shrink-0" />
                  : h.status === "해제 완료" ? <Unlock size={15} className="text-emerald-400 shrink-0" />
                  : <ShieldAlert size={15} className="text-amber-400 shrink-0" />}
                <div>
                  <div className="font-mono text-xs text-sky-300">{h.id}</div>
                  <div className="font-mono text-xs text-slate-200 mt-0.5">{h.target}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{h.type} · {h.gate}</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={holdTone(h.status)}>{h.status}</Badge>
                  {h.ncr !== "-" && <span className="text-[11px] font-mono text-slate-500">{h.ncr} 연계</span>}
                  <span className="text-[11px] text-slate-500 font-mono">차단 {h.since}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{h.reason}</p>
                <p className="text-[11px] text-slate-500 mt-1">해제 조건: {h.cond}{h.release && <span className="text-emerald-400 ml-2">✓ {h.release}</span>}</p>
                {h.rack && <p className="text-[11px] text-amber-300/80 mt-0.5">격리 위치: {h.rack}</p>}
              </div>
              <div className="shrink-0 flex md:flex-col gap-1.5">
                {h.status === "차단중" && (
                  <button onClick={() => requestRelease(h.id)}
                    className="px-3 py-1.5 rounded border border-slate-600 text-xs text-slate-200 hover:bg-slate-800 transition-colors">
                    해제 요청
                  </button>
                )}
                {h.status.includes("요청") && (
                  <button onClick={() => approve(h.id)}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium transition-colors">
                    승인 (품질부장)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          차단중인 Lot은 해당 게이트에서 시스템이 진행을 물리적으로 막습니다 — CBG0803은 재측정 합격 전까지 OQC 등록·CoA 발행·출하지시가 비활성화되고, RML-BOEH-260708은 IQC 판정 전까지 불출 스캔이 거부됩니다. 실제 구축 시 PLC·바코드·전자저울 연동으로 강제됩니다 (NMCOP3-SP05 부적합 프로세스).
        </p>
      </Panel>
    </div>
  );
}

/* ──────────────────────────── 현장 입력 (iPad · POP) 탭 ──────────────────────────── */
/* 현장 작업자가 태블릿으로 측정값만 입력하면: 규격 자동판정 → 성적서 자동기록 → Lot 이력 반영 → 불합격 시 자동 홀드·알람 */

/* ──────────────────────────── 현장 입력 (iPad · POP) 탭 ──────────────────────────── */
/* 측정값 입력 즉시: 규격 자동판정 → 성적서 자동기록 → Lot 이력 반영 → 불합격 시 자동 홀드·알람 */

/* ──────────────────────────── LOT 추적 원료 입고·IQC 정보 자동 연동 ──────────────────────────── */
(function installLotTraceIqcReceivingLink(){
  if (window.__QMES_LOT_IQC_LINK_INSTALLED__) return;
  const LegacyTraceTab = typeof TraceTab === "function" ? TraceTab : null;
  if (!LegacyTraceTab) return;
  window.__QMES_LOT_IQC_LINK_INSTALLED__ = true;

  const EMPTY_VALUES = new Set(["", "-", "미등록", "미검사", "확인 필요"]);
  const PASS_VALUES = new Set(["OK", "PASS", "합격", "적합", "승인"]);
  const FAIL_VALUES = new Set(["NG", "FAIL", "FAILED", "불합격", "부적합", "반품"]);

  const firstValue = (record, keys) => {
    for (const key of keys) {
      const value = record && record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  };

  const usableValue = (value) => {
    const text = String(value == null ? "" : value).trim();
    return EMPTY_VALUES.has(text) ? "" : text;
  };

  const normalizeLot = (value) => String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[‐‑‒–—―]/g, "-");

  const normalizeDate = (value) => {
    const text = String(value || "").trim();
    const match = text.match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    if (!match) return text;
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  };

  const inspectionRows = () => {
    const db = typeof DB !== "undefined" && DB ? DB : {};
    const sources = [
      db.iqc,
      db.insp && db.insp.IQC,
      db.iqcRecords,
      db.inspections && db.inspections.IQC,
      db.receipts,
      db.receiving,
      db.rawMaterialReceipts,
      db.inboundMaterials,
    ];
    const rows = sources.filter(Array.isArray).flat();
    const seen = new Set();
    return rows.filter((row) => {
      const lot = normalizeLot(firstValue(row, ["lot", "lotNo", "lotNumber", "materialLot", "rawLot", "supplierLot"]));
      const key = `${firstValue(row, ["inNo", "receiptNo", "id"])}|${lot}|${firstValue(row, ["recv", "receivedAt", "recvDate", "inspectedAt", "date"])}`;
      if (!lot || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const partnerRows = () => {
    const db = typeof DB !== "undefined" && DB ? DB : {};
    return [
      ...(Array.isArray(db.partnerSuppliers) ? db.partnerSuppliers : []),
      ...Object.values(db.rawMaterialLots || {}),
    ];
  };

  const judgeText = (row, fallback) => {
    const direct = usableValue(firstValue(row, ["judge", "judgment", "iqc", "iqcResult", "inspectionResult", "result"]));
    const normalized = direct.toUpperCase();
    if (PASS_VALUES.has(normalized)) return "합격";
    if (FAIL_VALUES.has(normalized)) return "불합격";
    if (/검사중|진행중|대기/.test(direct)) return "검사중";
    if (direct) return direct;

    const checks = ["visual", "label", "weight", "coa"]
      .map((key) => usableValue(row && row[key]))
      .filter(Boolean);
    if (checks.some((value) => FAIL_VALUES.has(value.toUpperCase()) || value.includes("불합격"))) return "불합격";
    if (checks.length && checks.every((value) => PASS_VALUES.has(value.toUpperCase()) || value.includes("합격"))) return "합격";
    return usableValue(fallback) || "미검사";
  };

  const findLatestInspection = (material, rows) => {
    const materialLot = normalizeLot(firstValue(material, ["lot", "lotNo", "lotNumber", "materialLot", "rawLot"]));
    const containerNo = normalizeLot(firstValue(material, ["containerNo", "container", "containerId"]));
    if (!materialLot && !containerNo) return null;
    const matches = rows.filter((row) => {
      const rowLot = normalizeLot(firstValue(row, ["lot", "lotNo", "lotNumber", "materialLot", "rawLot", "supplierLot"]));
      const rowContainer = normalizeLot(firstValue(row, ["containerNo", "container", "containerId"]));
      return (materialLot && rowLot === materialLot) || (containerNo && rowContainer === containerNo);
    });
    return matches.sort((a, b) => {
      const dateA = normalizeDate(firstValue(a, ["inspectedAt", "inspectionDate", "recv", "receivedAt", "recvDate", "date"]));
      const dateB = normalizeDate(firstValue(b, ["inspectedAt", "inspectionDate", "recv", "receivedAt", "recvDate", "date"]));
      return String(dateB).localeCompare(String(dateA));
    })[0] || null;
  };

  const findPartner = (material, rows) => {
    const materialLot = normalizeLot(firstValue(material, ["lot", "lotNo", "lotNumber", "materialLot", "rawLot"]));
    if (!materialLot) return null;
    return rows.find((row) => normalizeLot(firstValue(row, ["lot", "lotNo", "lotNumber", "materialLot", "rawLot"])) === materialLot) || null;
  };

  const enrichLotTraceMaterials = () => {
    const db = typeof DB !== "undefined" && DB ? DB : null;
    if (!db || !db.lots) return 0;
    const iqcRows = inspectionRows();
    const suppliers = partnerRows();
    let changedCount = 0;

    Object.values(db.lots).forEach((lot) => {
      if (!Array.isArray(lot && lot.materials)) return;
      lot.materials = lot.materials.map((material) => {
        const iqc = findLatestInspection(material, iqcRows);
        const partner = findPartner(material, suppliers);
        const supplier = usableValue(firstValue(material, ["supplier", "supplierName", "vendor", "company"]))
          || usableValue(firstValue(iqc, ["supplier", "supplierName", "vendor", "company", "partnerName"]))
          || usableValue(firstValue(partner, ["supplier", "supplierName", "vendor", "company", "partnerName"]));
        const recv = usableValue(firstValue(material, ["recv", "receivedAt", "recvDate", "receivedDate", "receiveDate", "inDate", "receiptDate"]))
          || usableValue(firstValue(iqc, ["recv", "receivedAt", "recvDate", "receivedDate", "receiveDate", "inDate", "receiptDate", "date"]));
        const inspection = judgeText(iqc, firstValue(material, ["iqc", "iqcResult", "inspectionResult"]));
        const next = {
          ...material,
          supplier: supplier || "-",
          recv: normalizeDate(recv) || "-",
          iqc: inspection,
          iqcNo: usableValue(firstValue(iqc, ["inNo", "inspectionNo", "receiptNo", "id"])) || material.iqcNo || "",
          inspectedAt: normalizeDate(firstValue(iqc, ["inspectedAt", "inspectionDate", "recv", "receivedAt", "date"])) || material.inspectedAt || "",
        };
        if (next.supplier !== material.supplier || next.recv !== material.recv || next.iqc !== material.iqc || next.iqcNo !== material.iqcNo || next.inspectedAt !== material.inspectedAt) changedCount += 1;
        return next;
      });
    });
    return changedCount;
  };

  window.qmesEnrichLotTraceMaterials = enrichLotTraceMaterials;
  enrichLotTraceMaterials();

  TraceTab = function TraceTabWithIqcReceivingLink(){
    enrichLotTraceMaterials();
    return <LegacyTraceTab />;
  };

  window.addEventListener("storage", enrichLotTraceMaterials);
  document.addEventListener("qmes:data-updated", enrichLotTraceMaterials);
})();

/* ──────────────────────────── LOT 추적 생산실적·공정검사 상세 연동 ──────────────────────────── */
(function installLotProductionDetailLink(){
  if (window.__QMES_LOT_PRODUCTION_DETAIL_INSTALLED__) return;
  const LinkedTraceTab = typeof TraceTab === "function" ? TraceTab : null;
  if (!LinkedTraceTab) return;
  window.__QMES_LOT_PRODUCTION_DETAIL_INSTALLED__ = true;

  const firstValue = (record, keys) => {
    for (const key of keys) {
      const value = record && record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  };
  const toNumber = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const matched = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return matched ? Number(matched[0]) : null;
  };
  const displayValue = (value, fallback = "-") => {
    const text = String(value ?? "").trim();
    return text && text !== "—" ? text : fallback;
  };
  const dateTimeText = (value, fallbackDate, fallbackTime) => {
    const text = String(value || "").trim();
    if (text) {
      const parsed = new Date(text);
      if (!Number.isNaN(parsed.getTime()) && /T|\d{2}:\d{2}/.test(text)) {
        return parsed.toLocaleString("ko-KR", {year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
      }
      return text;
    }
    return [fallbackDate, fallbackTime].filter(Boolean).join(" ") || "-";
  };
  const unique = (values) => Array.from(new Set(values.map((value)=>String(value || "").trim()).filter(Boolean)));
  const toneForJudge = (value) => {
    const text = String(value || "");
    if (/불합격|이탈|NG|FAIL/i.test(text)) return "red";
    if (/합격|적합|완료|OK|PASS/i.test(text)) return "green";
    if (/검사|진행|대기|미입력/.test(text)) return "amber";
    return "gray";
  };

  function LotProductionTracePanel(){
    const lotIds = Object.keys(DB.lots || {});
    const [selectedLot, setSelectedLot] = useState(lotIds[0] || "");
    const [traceMode, setTraceMode] = useState("finished");
    const [, setVersion] = useState(0);

    useEffect(() => {
      const handleClick = (event) => {
        const button = event.target.closest && event.target.closest("button");
        if (!button) return;
        const buttonText = String(button.textContent || "").trim();
        if (buttonText === "원료 LOT 역추적") { setTraceMode("raw"); return; }
        if (buttonText === "완제품 LOT 조회") { setTraceMode("finished"); return; }
        const scopeText = String(button.closest("tr")?.textContent || button.textContent || "");
        const matchedLot = lotIds.find((lotId) => scopeText.includes(lotId));
        if (matchedLot) {
          setSelectedLot(matchedLot);
          if (buttonText === "LOT 보기") setTraceMode("finished");
        }
      };
      const refresh = () => setVersion((value) => value + 1);
      document.addEventListener("click", handleClick, true);
      document.addEventListener("qmes:data-updated", refresh);
      window.addEventListener("storage", refresh);
      return () => {
        document.removeEventListener("click", handleClick, true);
        document.removeEventListener("qmes:data-updated", refresh);
        window.removeEventListener("storage", refresh);
      };
    }, [lotIds.join("|")]);

    if (traceMode !== "finished") return null;
    const activeLotId = DB.lots?.[selectedLot] ? selectedLot : lotIds[0];
    const lot = DB.lots?.[activeLotId];
    if (!lot) return null;

    const workOrder = DB.woDocs?.[activeLotId] || Object.values(DB.woDocs || {}).find((row) =>
      [row?.no,row?.lot,row?.lotNo,row?.workOrder].some((value)=>String(value || "").trim() === activeLotId)
    ) || {};
    const batch = (DB.batches || []).find((row) =>
      [row?.no,row?.lot,row?.lotNo,row?.workOrder].some((value)=>String(value || "").trim() === activeLotId)
    ) || {};
    const productionStep = [...(lot.steps || [])].reverse().find((step)=>step.stage === "생산") || {};
    const productionDate = displayValue(firstValue(workOrder,["date","productionDate","startDate","workDate"])
      || firstValue(batch,["productionDate","startDate","date","due"])
      || firstValue(lot,["productionDate","mfgDate"]));
    const equipment = displayValue(firstValue(workOrder,["tank","equipment","equipmentName","machine"])
      || firstValue(batch,["tank","equipment","equipmentName","machine"]));
    const sourceInputs = Array.isArray(workOrder.inputs) && workOrder.inputs.length ? workOrder.inputs : (lot.materials || []);
    const lotMaterials = lot.materials || [];
    const materialRows = sourceInputs.map((input,index) => {
      const inputLot = displayValue(firstValue(input,["lot","materialLot","lotNo"]), "");
      const matched = lotMaterials.find((material) => inputLot && String(material.lot || "").trim() === inputLot)
        || lotMaterials[index] || {};
      const standard = toNumber(firstValue(input,["std","standardQty","planQty","targetQty"]));
      const actual = toNumber(firstValue(input,["act","actualQty","usedQty","inputQty"])) ?? toNumber(matched.qty);
      const remaining = toNumber(firstValue(input,["remaining","remainingQty","balanceQty"])) ?? toNumber(matched.remainingQty);
      const worker = displayValue(firstValue(input,["by","worker","operator","inputBy"])
        || firstValue(workOrder,["by","worker","operator","owner"])
        || productionStep.by);
      const usedAt = dateTimeText(firstValue(input,["inputAt","usedAt","weighedAt","updatedAt","createdAt"]),productionDate,productionStep.time);
      const rowEquipment = displayValue(firstValue(input,["tank","equipment","equipmentName","machine"]) || equipment);
      const judge = input.ok === false ? "공차 이탈" : input.ok === true ? "적합" : actual != null ? "기록" : "미입력";
      return {
        sequence:index + 1,
        name:displayValue(input.name || matched.name),
        lot:displayValue(inputLot || matched.lot),
        usedAt,
        standard,
        actual,
        remaining,
        worker,
        equipment:rowEquipment,
        judge,
        unit:displayValue(input.unit || "kg","kg")
      };
    });

    const workers = unique([
      ...materialRows.map((row)=>row.worker === "-" ? "" : row.worker),
      ...(workOrder.conds || []).map((row)=>row.by),
      productionStep.by,
      firstValue(batch,["worker","operator","by"])
    ]);
    const pqcRows = (DB.insp?.PQC || []).filter((row)=>String(row.lot || "").trim() === activeLotId);
    const groupKeys = unique(pqcRows.map((row)=>row.groupId || `${row.lot}|${row.date}`));
    const latestGroupKey = groupKeys.sort((a,b) => {
      const rowA = pqcRows.find((row)=>(row.groupId || `${row.lot}|${row.date}`) === a) || {};
      const rowB = pqcRows.find((row)=>(row.groupId || `${row.lot}|${row.date}`) === b) || {};
      return `${rowB.date || ""} ${rowB.time || ""}`.localeCompare(`${rowA.date || ""} ${rowA.time || ""}`);
    })[0];
    const latestPqcRows = latestGroupKey ? pqcRows.filter((row)=>(row.groupId || `${row.lot}|${row.date}`) === latestGroupKey) : [];
    const pqcJudge = latestPqcRows.length
      ? (latestPqcRows.every((row)=>row.judge === "합격") ? "합격" : "불합격")
      : "미검사";
    const pqcInspector = unique(latestPqcRows.map((row)=>row.inspector || row.by)).join(" · ") || "-";
    const goodQty = toNumber(firstValue(batch,["done","actualQty","goodQty","productionQty"])) ?? toNumber(firstValue(lot,["qty","goodQty","productionQty"]));
    const defectQty = toNumber(firstValue(batch,["defectQty","badQty","ngQty","scrapQty"]))
      ?? toNumber(firstValue(workOrder,["defectQty","badQty","ngQty","scrapQty"]))
      ?? toNumber(firstValue(lot,["defectQty","badQty","ngQty","scrapQty"]));
    const explicitRate = toNumber(firstValue(batch,["defectRate","badRate","ngRate","scrapRate"])
      || firstValue(workOrder,["defectRate","badRate","ngRate","scrapRate"])
      || firstValue(lot,["defectRate","badRate","ngRate","scrapRate"]));
    const defectRate = explicitRate != null ? explicitRate
      : (defectQty != null && goodQty != null && goodQty + defectQty > 0 ? (defectQty / (goodQty + defectQty)) * 100 : null);
    const summaryCards = [
      ["생산일자",productionDate,"작업지시 기준"],
      ["작업자",workers.join(" · ") || "-",`${workers.length}명`],
      ["사용 설비",equipment,"탱크·설비"],
      ["공정검사",pqcJudge,pqcInspector],
      ["불량수량",defectQty == null ? "-" : `${defectQty.toLocaleString()} kg`,"생산실적 등록값"],
      ["불량률",defectRate == null ? "-" : `${defectRate.toFixed(2)}%`,"불량수량 기준"]
    ];

    return <div className="mt-4 flex flex-col gap-4" data-qmes-lot-production-detail={activeLotId}>
      <Panel title={`생산실적 상세 — ${activeLotId}`} right={<Badge tone={pqcJudge === "합격" ? "green" : pqcJudge === "불합격" ? "red" : "amber"}>{pqcJudge === "미검사" ? "PQC 미검사" : `PQC ${pqcJudge}`}</Badge>}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {summaryCards.map(([label,value,detail])=><div key={label} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-[11px] font-bold text-slate-500">{label}</div>
            <div className="mt-1 break-words text-sm font-black text-slate-100">{value}</div>
            <div className="mt-1 text-[10px] text-slate-600">{detail}</div>
          </div>)}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
              {['순서','원재료','원료 LOT','투입일시','기준량','실투입량','사용 후 잔량','작업자','사용 설비','판정'].map((label)=><th key={label} className={`py-2 pr-3 font-medium ${['기준량','실투입량','사용 후 잔량'].includes(label)?'text-right':'text-left'}`}>{label}</th>)}
            </tr></thead>
            <tbody>
              {materialRows.map((row)=><tr key={`${row.sequence}-${row.lot}`} className="border-b border-slate-800/70 hover:bg-slate-800/30">
                <td className="py-3 pr-3 text-center font-black text-sky-300">{row.sequence}</td>
                <td className="py-3 pr-3 font-bold text-white">{row.name}</td>
                <td className="py-3 pr-3 font-mono text-xs text-violet-300">{row.lot}</td>
                <td className="py-3 pr-3 text-xs text-slate-400">{row.usedAt}</td>
                <td className="py-3 pr-3 text-right tabular-nums">{row.standard == null ? '-' : `${row.standard.toLocaleString()} ${row.unit}`}</td>
                <td className="py-3 pr-3 text-right font-bold tabular-nums text-slate-100">{row.actual == null ? '-' : `${row.actual.toLocaleString()} ${row.unit}`}</td>
                <td className="py-3 pr-3 text-right tabular-nums text-amber-300">{row.remaining == null ? '-' : `${row.remaining.toLocaleString()} ${row.unit}`}</td>
                <td className="py-3 pr-3">{row.worker}</td>
                <td className="py-3 pr-3">{row.equipment}</td>
                <td className="py-3"><Badge tone={toneForJudge(row.judge)}>{row.judge}</Badge></td>
              </tr>)}
              {materialRows.length === 0&&<tr><td colSpan="10" className="py-10 text-center text-slate-500">작업지시의 원료 투입실적을 기록하면 순서와 상세정보가 자동 표시됩니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="공정검사(PQC) 결과" right={<span className="text-xs text-slate-500">최근 검사 {latestPqcRows.length ? `${latestPqcRows[0].date || '-'} ${latestPqcRows[0].time || ''}` : '미등록'}</span>}>
        {latestPqcRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-slate-700 text-xs text-slate-400"><th className="py-2 text-left">검사항목</th><th className="py-2 text-left">측정값</th><th className="py-2 text-left">판정</th><th className="py-2 text-left">검사자</th><th className="py-2 text-left">검사일시</th></tr></thead>
          <tbody>{latestPqcRows.map((row)=><tr key={row.id} className="border-b border-slate-800"><td className="py-3 font-bold text-white">{row.check}</td><td className="py-3 text-slate-300">{row.value || '-'}</td><td className="py-3"><Badge tone={toneForJudge(row.judge)}>{row.judge || '-'}</Badge></td><td className="py-3">{row.inspector || row.by || '-'}</td><td className="py-3 text-xs text-slate-400">{[row.date,row.time].filter(Boolean).join(' ') || '-'}</td></tr>)}</tbody>
        </table></div> : <p className="py-6 text-center text-sm text-slate-500">이 LOT의 공정검사 기록이 아직 없습니다. 생산실적 완료 후 공정검사를 등록하면 자동 연결됩니다.</p>}
      </Panel>
    </div>;
  }

  TraceTab = function TraceTabWithProductionDetail(){
    return <><LinkedTraceTab/><LotProductionTracePanel/></>;
  };
})();
