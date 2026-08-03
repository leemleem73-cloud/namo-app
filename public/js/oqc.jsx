/* QMES module: oqc — extracted from index.html without logic changes. */

function OqcTab() {
  return (
    <InspectionTab
      docName="출하검사 성적서"
      itemKeys={OQC_KEYS}
      initial={OQC_INIT}
      lotOptions={["CBG0802", "CBG0701"]}
      idPrefix="OQC-" idStart={1} storeKey="OQC" traceStage="출하"
      notice=""
    />
  );
}

/* ──────────────────────────── LOT 추적 OQC·출하정보 자동 연동 ──────────────────────────── */
(function installLotOqcShipmentLinkWhenReady(){
  if (window.__QMES_LOT_OQC_SHIPMENT_LINK_INSTALLED__) return;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (typeof TraceTab !== "function" || !window.__QMES_LOT_PRODUCTION_DETAIL_INSTALLED__) {
      if (attempts >= 300) window.clearInterval(timer);
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
        : oqcJudge === "불합격"
          ? "출하차단"
          : oqcJudge === "합격"
            ? "출하대기"
            : "미출하";

      const shipNo = display(shipment.shipNo || coa.shipNo || latestGroup);
      const inspectionDate = display(representative?.date);
      const inspector = display(representative?.inspector || representative?.by || shipment.inspector);
      const shipDate = display(shipment.shipDate || shipment.date || representative?.shipDate || coa.ship);
      const customer = display(shipment.customer || representative?.customer || coa.customer);
      const shipQty = numberValue(shipment.shipQty ?? shipment.qty ?? representative?.shipQty ?? coa.qty);
      const destination = display(shipment.destination || representative?.destination || coa.destination);
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
        ["납품처", destination, "도착지"],
        ["성적서번호", coaNo, "출하성적서"],
      ];

      return <div className="mt-4" data-qmes-lot-oqc-shipment={activeLotId}>
        <Panel
          title={`출하검사(OQC)·출하정보 — ${activeLotId}`}
          right={
            <div className="flex items-center gap-2">
              <Badge tone={toneFor(oqcJudge)}>{oqcJudge === "미검사" ? "OQC 미검사" : `OQC ${oqcJudge}`}</Badge>
              {representative && (
                <button
                  type="button"
                  onClick={() => setViewingRecord(representative)}
                  className="qmes-iqc-action-btn qmes-iqc-action-print"
                  title="출하검사 성적서 미리보기 및 출력"
                >
                  <Printer size={12} /> 성적서 확인·출력
                </button>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {summaryCards.map(([label, value, detail]) => (
              <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <div className="text-[11px] font-bold text-slate-500">{label}</div>
                <div className="mt-1 break-words text-sm font-black text-slate-100">{value}</div>
                <div className="mt-1 text-[10px] text-slate-600">{detail}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            {latestOqcRows.length ? (
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-xs text-slate-400">
                    <th className="py-2 pr-3 text-left font-medium">검사항목</th>
                    <th className="py-2 pr-3 text-left font-medium">관리기준</th>
                    <th className="py-2 pr-3 text-left font-medium">측정값</th>
                    <th className="py-2 pr-3 text-left font-medium">판정</th>
                    <th className="py-2 pr-3 text-left font-medium">검사자</th>
                    <th className="py-2 text-left font-medium">검사일시</th>
                  </tr>
                </thead>
                <tbody>
                  {latestOqcRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800/70 hover:bg-slate-800/30">
                      <td className="py-3 pr-3 font-bold text-white">{row.check === "입도(Dmax)" ? "입도" : display(row.check)}</td>
                      <td className="py-3 pr-3 text-slate-400">{QC_ITEMS[row.check]?.spec || "-"}</td>
                      <td className="py-3 pr-3 text-slate-300">{display(row.value)}</td>
                      <td className="py-3 pr-3"><Badge tone={toneFor(row.judge)}>{display(row.judge)}</Badge></td>
                      <td className="py-3 pr-3">{display(row.inspector || row.by)}</td>
                      <td className="py-3 text-xs text-slate-400">{[row.date, row.time].filter(Boolean).join(" ") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                이 LOT의 출하검사 기록이 아직 없습니다. OQC에서 검사 결과와 출하정보를 등록하면 자동 연결됩니다.
              </div>
            )}
          </div>
        </Panel>

        {viewingRecord && (
          <QualityInspectionViewer
            type="OQC"
            record={viewingRecord}
            records={allOqcRows}
            onClose={() => setViewingRecord(null)}
          />
        )}
      </div>;
    }

    TraceTab = function TraceTabWithOqcShipmentLink(){
      return <><LinkedTraceTab/><LotOqcShipmentPanel/></>;
    };
    document.dispatchEvent(new CustomEvent("qmes:data-updated"));
  }
})();

/* ──────────────────────────── 품질 인터락 (차단) 탭 ──────────────────────────── */

