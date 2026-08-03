/* QMES module: OQC extensions, inspection layout, production result entry. */

const QMES_OQC_ORDER = ["외관", "입도(Dmax)", "점도", "고형분", "접착력", "절연저항", "수분", "전해액 안정성"];

function OqcTab() {
  return (
    <InspectionTab
      docName="출하검사 성적서"
      itemKeys={QMES_OQC_ORDER}
      initial={OQC_INIT}
      lotOptions={["CBG0802", "CBG0701"]}
      idPrefix="OQC-" idStart={1} storeKey="OQC" traceStage="출하"
      notice=""
    />
  );
}

/* 공정·출하검사 항목 표시 순서 */
(function installInspectionRowOrder(){
  if (window.__QMES_INSPECTION_ROW_ORDER_INSTALLED__) return;
  window.__QMES_INSPECTION_ROW_ORDER_INSTALLED__ = true;

  const orders = {
    pqc: ["외관", "입도", "점도", "고형분"],
    oqc: ["외관", "입도", "점도", "고형분", "접착력", "절연저항", "수분", "전해액 안정성"]
  };
  let scheduled = false;
  let arranging = false;

  const labelOf = (row) => String(row?.querySelector("td")?.textContent || "").replace(/\s+/g, " ").trim();
  const reorder = () => {
    scheduled = false;
    if (arranging) return;
    arranging = true;
    try {
      document.querySelectorAll(".qmes-pqc-item-table tbody").forEach((body) => {
        const table = body.closest("table");
        const mode = table?.closest(".qmes-oqc-page") ? "oqc" : table?.closest(".qmes-pqc-page") ? "pqc" : "";
        if (!mode) return;
        const rows = Array.from(body.querySelectorAll(":scope > tr"));
        const desired = orders[mode];
        const current = rows.map(labelOf);
        const expected = desired.filter((label) => current.includes(label));
        if (expected.length < 2 || expected.every((label, index) => current[index] === label)) return;
        expected.forEach((label) => {
          const row = rows.find((item) => labelOf(item) === label);
          if (row) body.appendChild(row);
        });
      });
    } finally {
      arranging = false;
    }
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(reorder);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once:true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
})();

/* LOT 추적 OQC·출하정보 자동 연동 */
(function installLotOqcShipmentLinkWhenReady(){
  if (window.__QMES_LOT_OQC_SHIPMENT_LINK_INSTALLED__) return;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (typeof TraceTab !== "function" || !window.__QMES_LOT_PRODUCTION_DETAIL_INSTALLED__) {
      if (attempts >= 400) window.clearInterval(timer);
      return;
    }
    window.clearInterval(timer);
    installLotOqcShipmentLink(TraceTab);
  }, 50);

  function installLotOqcShipmentLink(LinkedTraceTab){
    if (window.__QMES_LOT_OQC_SHIPMENT_LINK_INSTALLED__) return;
    window.__QMES_LOT_OQC_SHIPMENT_LINK_INSTALLED__ = true;

    const text = (value) => String(value ?? "").trim();
    const display = (value, fallback = "-") => text(value) || fallback;
    const groupKey = (row) => text(row?.groupId)
      || (text(row?.lot) || text(row?.date) ? `${text(row?.lot)}|${text(row?.date || row?.shipDate)}` : text(row?.id).replace(/-\d+$/, ""));
    const toneFor = (value) => {
      const normalized = text(value);
      if (/불합격|차단|홀드|NG|FAIL/i.test(normalized)) return "red";
      if (/합격|완료|PASS|OK/i.test(normalized)) return "green";
      if (/대기|검사|미출하|미등록/.test(normalized)) return "amber";
      return "gray";
    };
    const dateTimeKey = (row) => [row?.date, row?.time, row?.shipDate].map(text).join(" ");
    const numberValue = (value) => {
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
      const matched = text(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
      return matched ? Number(matched[0]) : null;
    };

    function LotOqcShipmentPanel(){
      const lotIds = Object.keys(DB.lots || {});
      const [selectedLot, setSelectedLot] = useState(lotIds[0] || "");
      const [traceMode, setTraceMode] = useState("finished");
      const [viewingRecord, setViewingRecord] = useState(null);
      const [, setVersion] = useState(0);

      useEffect(() => {
        const handleClick = (event) => {
          const button = event.target?.closest?.("button");
          if (!button) return;
          const buttonText = text(button.textContent);
          if (buttonText === "원료 LOT 역추적") {
            setTraceMode("raw");
            setViewingRecord(null);
            return;
          }
          if (buttonText === "완제품 LOT 조회") {
            setTraceMode("finished");
            return;
          }
          const scopeText = text(button.closest("tr")?.textContent || button.textContent);
          const matchedLot = lotIds.find((lotId) => scopeText.includes(lotId));
          if (matchedLot) {
            setSelectedLot(matchedLot);
            setViewingRecord(null);
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

      const batch = (DB.batches || []).find((row) =>
        [row?.no, row?.lot, row?.lotNo, row?.workOrder].some((value) => text(value) === activeLotId)
      ) || {};
      const allOqcRows = Array.isArray(DB.insp?.OQC) ? DB.insp.OQC : [];
      const lotOqcRows = allOqcRows.filter((row) => text(row?.lot) === activeLotId);
      const shipment = lot.ship || batch.ship || {};
      const coa = DB.coa?.[activeLotId] || {};
      const preferredGroup = text(shipment.shipNo || coa.shipNo);
      const groupKeys = Array.from(new Set(lotOqcRows.map(groupKey).filter(Boolean)));
      const latestGroup = preferredGroup && groupKeys.includes(preferredGroup)
        ? preferredGroup
        : groupKeys.sort((a, b) => {
            const rowA = lotOqcRows.find((row) => groupKey(row) === a) || {};
            const rowB = lotOqcRows.find((row) => groupKey(row) === b) || {};
            return dateTimeKey(rowB).localeCompare(dateTimeKey(rowA));
          })[0];
      const latestOqcRows = latestGroup ? lotOqcRows.filter((row) => groupKey(row) === latestGroup) : [];
      const representative = latestOqcRows[0] || null;
      const oqcJudge = latestOqcRows.length
        ? (latestOqcRows.every((row) => row.judge === "합격") ? "합격" : "불합격")
        : "미검사";
      const hasShipment = Boolean(text(shipment.shipNo || shipment.customer || shipment.shipDate || coa.shipNo || coa.customer || coa.ship));
      const shipmentStatus = hasShipment
        ? "출하완료"
        : oqcJudge === "불합격" ? "출하차단" : oqcJudge === "합격" ? "출하대기" : "미출하";

      const shipNo = display(shipment.shipNo || coa.shipNo || latestGroup);
      const inspectionDate = display(representative?.date);
      const inspector = display(representative?.inspector || representative?.by || shipment.inspector);
      const shipDate = display(shipment.shipDate || shipment.date || representative?.shipDate || coa.ship);
      const customer = display(shipment.customer || representative?.customer || coa.customer);
      const shipQty = numberValue(shipment.shipQty ?? shipment.qty ?? representative?.shipQty ?? coa.qty);
      const coaNo = display(coa.no);
      const summaryCards = [
        ["출하검사", oqcJudge, latestOqcRows.length ? `${latestOqcRows.length}개 항목` : "OQC 미등록"],
        ["출하상태", shipmentStatus, display(lot.status, "LOT 상태 미등록")],
        ["출하번호", shipNo, "OQC 검사번호"],
        ["검사일자", inspectionDate, "출하검사 실시일"],
        ["검사자", inspector, "OQC 담당자"],
        ["출하일자", shipDate, "제품 출고일"],
        ["고객사", customer, "납품 고객"],
        ["출하수량", shipQty == null ? "-" : `${shipQty.toLocaleString()} kg`, "출하확정 수량"],
        ["성적서번호", coaNo, "출하성적서"]
      ];

      return <div className="mt-4" data-qmes-lot-oqc-shipment={activeLotId}>
        <Panel title={`출하검사(OQC)·출하정보 — ${activeLotId}`} right={
          <div className="flex items-center gap-2">
            <Badge tone={toneFor(oqcJudge)}>{oqcJudge === "미검사" ? "OQC 미검사" : `OQC ${oqcJudge}`}</Badge>
            {representative && <button type="button" onClick={() => setViewingRecord(representative)}
              className="qmes-iqc-action-btn qmes-iqc-action-print" title="출하검사 성적서 미리보기 및 출력">
              <Printer size={12} /> 성적서 확인·출력
            </button>}
          </div>
        }>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {summaryCards.map(([label, value, detail]) => <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-[11px] font-bold text-slate-500">{label}</div>
              <div className="mt-1 break-words text-sm font-black text-slate-100">{value}</div>
              <div className="mt-1 text-[10px] text-slate-600">{detail}</div>
            </div>)}
          </div>
          <div className="mt-4 overflow-x-auto">
            {latestOqcRows.length ? <table className="w-full min-w-[900px] text-sm">
              <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
                <th className="py-2 pr-3 text-left font-medium">검사항목</th>
                <th className="py-2 pr-3 text-left font-medium">관리기준</th>
                <th className="py-2 pr-3 text-left font-medium">측정값</th>
                <th className="py-2 pr-3 text-left font-medium">판정</th>
                <th className="py-2 pr-3 text-left font-medium">검사자</th>
                <th className="py-2 text-left font-medium">검사일시</th>
              </tr></thead>
              <tbody>{latestOqcRows.map((row) => <tr key={row.id} className="border-b border-slate-800/70 hover:bg-slate-800/30">
                <td className="py-3 pr-3 font-bold text-white">{row.check === "입도(Dmax)" ? "입도" : display(row.check)}</td>
                <td className="py-3 pr-3 text-slate-400">{QC_ITEMS[row.check]?.spec || "-"}</td>
                <td className="py-3 pr-3 text-slate-300">{display(row.value)}</td>
                <td className="py-3 pr-3"><Badge tone={toneFor(row.judge)}>{display(row.judge)}</Badge></td>
                <td className="py-3 pr-3">{display(row.inspector || row.by)}</td>
                <td className="py-3 text-xs text-slate-400">{[row.date, row.time].filter(Boolean).join(" ") || "-"}</td>
              </tr>)}</tbody>
            </table> : <div className="py-8 text-center text-sm text-slate-500">
              이 LOT의 출하검사 기록이 아직 없습니다. OQC에서 검사 결과와 출하정보를 등록하면 자동 연결됩니다.
            </div>}
          </div>
        </Panel>
        {viewingRecord && <QualityInspectionViewer type="OQC" record={viewingRecord} records={allOqcRows} onClose={() => setViewingRecord(null)} />}
      </div>;
    }

    TraceTab = function TraceTabWithOqcShipmentLink(){
      return <><LinkedTraceTab/><LotOqcShipmentPanel/></>;
    };
    document.dispatchEvent(new CustomEvent("qmes:data-updated"));
  }
})();

/* 생산실적 입력·완료 */
(function installProductionResultsWhenReady(){
  if (window.__QMES_PRODUCTION_RESULTS_INSTALLING__) return;
  window.__QMES_PRODUCTION_RESULTS_INSTALLING__ = true;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (typeof ProductionTab !== "function" || typeof WoDocTab !== "function") {
      if (attempts >= 400) window.clearInterval(timer);
      return;
    }
    window.clearInterval(timer);
    installProductionResults();
  }, 50);

  function installProductionResults(){
    if (window.__QMES_PRODUCTION_RESULTS_INSTALLED__) return;
    window.__QMES_PRODUCTION_RESULTS_INSTALLED__ = true;
    const LegacyProductionTab = ProductionTab;
    const LegacyWoDocTab = WoDocTab;

    const cleanText = (value) => String(value ?? "").trim();
    const toNumber = (value) => {
      const number = Number(cleanText(value).replace(/,/g, ""));
      return Number.isFinite(number) ? number : null;
    };
    const currentUser = () => {
      const raw = window.__QMES_CURRENT_USER__ || window.__QMES_USER__;
      const value = raw && typeof raw === "object" ? raw.name || raw.uid || "" : raw || "";
      return cleanText(value).replace(/\s*\(U-\d+\)\s*$/i, "");
    };
    const toLocalInput = (value) => {
      const date = value ? new Date(value) : new Date();
      if (Number.isNaN(date.getTime())) return "";
      const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return shifted.toISOString().slice(0, 16);
    };
    const resultFor = (lot) => {
      const wo = DB.woDocs?.[lot] || {};
      const batch = (DB.batches || []).find((row) => row.no === lot) || {};
      const lotData = DB.lots?.[lot] || {};
      return wo.productionResult || batch.productionResult || lotData.productionResult || {};
    };
    const batchFor = (lot) => (DB.batches || []).find((row) => row.no === lot) || {};
    const workOrderFor = (lot) => DB.woDocs?.[lot] || {};

    function ProductionResultModal({lot, onClose, onSaved}){
      const existing = resultFor(lot);
      const wo = workOrderFor(lot);
      const batch = batchFor(lot);
      const initialTotal = Number(existing.totalQty ?? existing.productionQty ?? batch.done ?? batch.plan ?? wo.plan ?? 0);
      const initialDefect = Number(existing.defectQty ?? batch.defectQty ?? wo.defectQty ?? 0);
      const [form, setForm] = useState({
        totalQty: String(initialTotal || ""),
        defectQty: String(initialDefect || 0),
        defectType: cleanText(existing.defectType || existing.defectNote || batch.defectType || wo.defectType),
        completedAt: toLocalInput(existing.completedAt || batch.completedAt || wo.completedAt),
        worker: cleanText(existing.worker || existing.finalWorker || batch.worker || wo.worker || currentUser()),
        remarks: cleanText(existing.remarks || existing.productionRemarks || batch.productionRemarks || wo.productionRemarks)
      });
      const [message, setMessage] = useState("");
      const [saving, setSaving] = useState(false);
      const totalQty = Math.max(0, toNumber(form.totalQty) ?? 0);
      const defectQty = Math.max(0, toNumber(form.defectQty) ?? 0);
      const goodQty = Math.max(0, totalQty - defectQty);
      const defectRate = totalQty > 0 ? Number(((defectQty / totalQty) * 100).toFixed(2)) : 0;
      const inputs = Array.isArray(wo.inputs) ? wo.inputs : [];
      const conds = Array.isArray(wo.conds) ? wo.conds : [];
      const inputsDone = inputs.length === 0 || inputs.every((row) => row.act != null && cleanText(row.act) !== "");
      const condsDone = conds.length === 0 || conds.every((row) => cleanText(row.act) && cleanText(row.act) !== "—");
      const processReady = inputsDone && condsDone;

      const save = async () => {
        if (!processReady) { setMessage("원재료 실투입량과 공정조건을 먼저 모두 기록해 주세요."); return; }
        if (!(totalQty > 0)) { setMessage("총 생산량을 0보다 크게 입력해 주세요."); return; }
        if (defectQty > totalQty) { setMessage("불량수량은 총 생산량보다 클 수 없습니다."); return; }
        if (defectQty > 0 && !cleanText(form.defectType)) { setMessage("불량이 있으면 불량유형 또는 불량내용을 입력해 주세요."); return; }
        if (!cleanText(form.completedAt)) { setMessage("생산 완료일시를 입력해 주세요."); return; }
        if (!cleanText(form.worker)) { setMessage("최종 작업자를 입력해 주세요."); return; }

        setSaving(true);
        setMessage("");
        try {
          const completedDate = new Date(form.completedAt);
          const completedAt = Number.isNaN(completedDate.getTime()) ? form.completedAt : completedDate.toISOString();
          const result = {
            lot, totalQty, productionQty:totalQty, goodQty, defectQty, defectRate,
            defectType:cleanText(form.defectType), defectNote:cleanText(form.defectType),
            completedAt, worker:cleanText(form.worker), finalWorker:cleanText(form.worker),
            remarks:cleanText(form.remarks), productionRemarks:cleanText(form.remarks),
            updatedAt:new Date().toISOString(), updatedBy:currentUser()
          };
          const nextWo = {
            ...wo, productionResult:result, productionQty:totalQty, totalQty, goodQty, defectQty, defectRate,
            defectType:result.defectType, completedAt, worker:result.worker, finalWorker:result.worker,
            productionRemarks:result.remarks, done:totalQty, status:"완료"
          };
          DB.woDocs[lot] = nextWo;

          const batchIndex = (DB.batches || []).findIndex((row) => row.no === lot);
          if (batchIndex >= 0) {
            DB.batches[batchIndex] = {
              ...DB.batches[batchIndex], productionResult:result, done:totalQty, productionQty:totalQty,
              goodQty, defectQty, defectRate, defectType:result.defectType, completedAt,
              worker:result.worker, productionRemarks:result.remarks, status:"완료"
            };
          }

          const lotData = DB.lots?.[lot];
          if (lotData) {
            const step = {
              stage:"생산", name:"생산실적 입력 완료", time:toLocalInput(completedAt).replace("T", " "),
              detail:`총 ${totalQty.toLocaleString()}kg · 양품 ${goodQty.toLocaleString()}kg · 불량 ${defectQty.toLocaleString()}kg · 불량률 ${defectRate.toFixed(2)}%${result.defectType ? ` · ${result.defectType}` : ""}`,
              result:defectQty > 0 ? "완료 (불량 확인 필요)" : "완료", by:result.worker
            };
            lotData.productionResult = result;
            lotData.productionQty = totalQty;
            lotData.goodQty = goodQty;
            lotData.defectQty = defectQty;
            lotData.defectRate = defectRate;
            lotData.qty = goodQty;
            lotData.steps = [...(lotData.steps || []).filter((row) => row.name !== "생산실적 입력 완료"), step];
            lotData.stage = "생산";
            if (!cleanText(lotData.status).includes("홀드")) {
              lotData.status = defectQty > 0 ? "생산완료 — 불량 확인 필요" : "생산완료 — 검사 대기";
            }
          }

          if (typeof auditLog === "function") {
            auditLog("생산실적", existing.totalQty != null ? "수정" : "등록", lot,
              `총 ${totalQty}kg / 양품 ${goodQty}kg / 불량 ${defectQty}kg / ${defectRate.toFixed(2)}%`);
          }
          if (typeof dbSave === "function") dbSave();
          if (typeof qmesSyncWorkOrder === "function") await qmesSyncWorkOrder(lot);
          document.dispatchEvent(new CustomEvent("qmes:data-updated", {detail:{lot,type:"production-result"}}));
          onSaved?.();
          onClose();
        } catch (error) {
          setMessage(`생산실적 저장에 실패했습니다. ${error.message}`);
        } finally {
          setSaving(false);
        }
      };

      return <div className="fixed inset-0 z-[23000] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm"
        onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
        <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-label="생산실적 입력">
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
            <div><div className="text-[10px] font-black tracking-[0.18em] text-sky-400">PRODUCTION RESULT</div>
              <h3 className="mt-1 text-lg font-black text-white">생산실적 입력 · {lot}</h3></div>
            <button type="button" onClick={onClose} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-xl text-slate-400 hover:bg-slate-800 hover:text-white">×</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {!processReady && <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300">
              원재료 실투입량과 공정조건 기록이 완료된 후 생산실적을 저장할 수 있습니다.
            </div>}
            {message && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{message}</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold text-slate-400">총 생산량 (kg)
                <input type="number" min="0" step="0.1" value={form.totalQty} onChange={(event) => setForm({...form,totalQty:event.target.value})}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-bold text-slate-400">양품수량 (kg)
                <input value={goodQty.toFixed(2)} readOnly className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-black text-emerald-300" />
              </label>
              <label className="text-xs font-bold text-slate-400">불량수량 (kg)
                <input type="number" min="0" step="0.1" value={form.defectQty} onChange={(event) => setForm({...form,defectQty:event.target.value})}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-bold text-slate-400">불량률
                <input value={`${defectRate.toFixed(2)} %`} readOnly className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-black text-sky-300" />
              </label>
              <label className="text-xs font-bold text-slate-400 lg:col-span-2">불량유형 · 불량내용
                <input value={form.defectType} onChange={(event) => setForm({...form,defectType:event.target.value})} placeholder="불량이 없으면 비워도 됩니다"
                  className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-bold text-slate-400">생산 완료일시
                <input type="datetime-local" value={form.completedAt} onChange={(event) => setForm({...form,completedAt:event.target.value})}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-bold text-slate-400">최종 작업자
                <input value={form.worker} onChange={(event) => setForm({...form,worker:event.target.value})}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-bold text-slate-400 md:col-span-2 lg:col-span-4">비고
                <textarea value={form.remarks} onChange={(event) => setForm({...form,remarks:event.target.value})} placeholder="생산 중 특이사항을 입력하세요"
                  className="mt-1 min-h-[100px] w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-700 bg-slate-950/50 px-5 py-4">
            <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-lg border border-slate-600 px-4 text-sm font-black text-slate-300 hover:bg-slate-800">취소</button>
            <button type="button" onClick={save} disabled={saving || !processReady} className="h-10 rounded-lg bg-sky-600 px-5 text-sm font-black text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? "저장 중" : "생산실적 저장 · 완료"}
            </button>
          </div>
        </div>
      </div>;
    }

    function ProductionResultController(){
      const [lot, setLot] = useState("");
      const [, setVersion] = useState(0);
      useEffect(() => {
        const open = (event) => setLot(cleanText(event.detail?.lot));
        document.addEventListener("qmes:open-production-result", open);
        return () => document.removeEventListener("qmes:open-production-result", open);
      }, []);
      return lot ? <ProductionResultModal lot={lot} onClose={() => setLot("")} onSaved={() => setVersion((value) => value + 1)} /> : null;
    }

    function ProductionResultWorkspace(){
      const batches = DB.batches || [];
      const [selected, setSelected] = useState(batches[0]?.no || "");
      const [, setVersion] = useState(0);
      useEffect(() => {
        const refresh = () => setVersion((value) => value + 1);
        document.addEventListener("qmes:data-updated", refresh);
        return () => document.removeEventListener("qmes:data-updated", refresh);
      }, []);
      const active = batches.find((row) => row.no === selected) || batches[0];
      if (!active) return null;
      const lot = active.no;
      const result = resultFor(lot);
      const total = Number(result.totalQty ?? active.done ?? 0);
      const good = Number(result.goodQty ?? Math.max(0, total - Number(result.defectQty || 0)));
      const defect = Number(result.defectQty ?? active.defectQty ?? 0);
      const rate = Number(result.defectRate ?? (total > 0 ? defect / total * 100 : 0));

      return <Panel title="생산실적 입력" right={<span className="text-xs text-slate-500">실제 생산 완료 후 입력</span>}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <label className="text-xs font-bold text-slate-400">생산 LOT
              <select value={lot} onChange={(event) => setSelected(event.target.value)}
                className="mt-1 h-10 min-w-[240px] rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white">
                {batches.map((row) => <option key={row.no} value={row.no}>{row.no} · {row.item || "-"}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => document.dispatchEvent(new CustomEvent("qmes:open-production-result",{detail:{lot}}))}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-black text-white hover:bg-sky-500">
              {result.totalQty != null ? "생산실적 수정" : "생산실적 입력"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ["계획량", `${Number(active.plan || 0).toLocaleString()} kg`],
              ["총 생산량", result.totalQty != null ? `${total.toLocaleString()} kg` : "-"],
              ["양품수량", result.totalQty != null ? `${good.toLocaleString()} kg` : "-"],
              ["불량수량", result.totalQty != null ? `${defect.toLocaleString()} kg` : "-"],
              ["불량률", result.totalQty != null ? `${rate.toFixed(2)} %` : "-"]
            ].map(([label,value]) => <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-[11px] font-bold text-slate-500">{label}</div>
              <div className="mt-1 text-sm font-black text-white">{value}</div>
            </div>)}
          </div>
        </div>
      </Panel>;
    }

    function WorkOrderResultBridge(){
      useEffect(() => {
        let scheduled = false;
        const enhance = () => {
          scheduled = false;
          document.querySelectorAll(".qmes-wo-list-table tbody tr").forEach((row) => {
            const lot = cleanText(row.querySelector("td")?.textContent);
            const cell = row.querySelector("td:last-child");
            if (!lot || !cell || cell.querySelector("[data-qmes-production-result]")) return;
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.qmesProductionResult = lot;
            button.textContent = "실적입력";
            button.className = "ml-1 rounded border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-[11px] font-black text-emerald-300 hover:bg-emerald-500/20";
            button.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              document.dispatchEvent(new CustomEvent("qmes:open-production-result", {detail:{lot}}));
            });
            cell.appendChild(button);
          });
        };
        const schedule = () => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(enhance);
        };
        schedule();
        const observer = new MutationObserver(schedule);
        observer.observe(document.documentElement, {childList:true, subtree:true});
        return () => observer.disconnect();
      }, []);
      return null;
    }

    ProductionTab = function ProductionTabWithResults(){
      return <div className="flex flex-col gap-4"><LegacyProductionTab/><ProductionResultWorkspace/><ProductionResultController/></div>;
    };
    WoDocTab = function WoDocTabWithResults(){
      return <><LegacyWoDocTab/><WorkOrderResultBridge/><ProductionResultController/></>;
    };
  }
})();
