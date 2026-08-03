/* QMES module: production — extracted from index.html without logic changes. */

function ProductionTab() {
  const list = DB.batches;
  const stTone = { 발행: "violet", 진행중: "blue", 완료: "green", 대기: "amber", 계획: "gray" };

  return (
    <Panel title="배치 작업지시 현황" right={<span className="text-xs text-slate-400">총 {list.length}건</span>}>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="qmes-production-table w-full table-fixed text-sm min-w-[760px]">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-800">
              <th className="text-left py-2 px-3 font-medium">배치번호</th>
              <th className="text-left py-2 px-3 font-medium">품목</th>
              <th className="text-left py-2 px-3 font-medium">탱크</th>
              <th className="text-right py-2 px-3 font-medium">계획</th>
              <th className="text-right py-2 px-3 font-medium">실적</th>
              <th className="text-left py-2 px-3 font-medium">진척률</th>
              <th className="text-left py-2 px-3 font-medium">납기</th>
              <th className="text-left py-2 px-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={8} className="py-6 px-3 text-center text-sm text-slate-500">배치 실적이 없습니다 — [작업지시 발행]에서 배치를 발행하세요.</td></tr>
            )}
            {list.map((w) => {
              const pct = Number(w.plan || 0) > 0 ? Math.round((Number(w.done || 0) / Number(w.plan)) * 100) : 0;
              return (
                <tr key={w.no} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-mono text-xs text-sky-300 whitespace-nowrap">{w.no}</td>
                  <td className="py-2.5 px-3 text-slate-100 truncate">{w.item}</td>
                  <td className="py-2.5 px-3 text-xs font-mono text-slate-400 whitespace-nowrap">{w.tank}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-300 whitespace-nowrap">{w.plan.toLocaleString()} {w.unit}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-100 font-semibold whitespace-nowrap">
                    {Number(w.done || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">{w.unit}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded overflow-hidden">
                        <div className={`h-full rounded ${pct >= 100 ? "bg-emerald-400" : "bg-sky-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-slate-400 w-9 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-300 whitespace-nowrap">{w.due}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap"><Badge tone={stTone[w.status]}>{w.status}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ──────────────────────────── 품질 관리 ──────────────────────────── */




function WoDocTab() {
  const [, setSharedVersion] = useState(0);
  useEffect(() => {
    let active = true;
    if (typeof qmesSyncPullWorkOrders !== "function") return () => { active = false; };
    qmesSyncPullWorkOrders()
      .then(() => { if (active) setSharedVersion((value) => value + 1); })
      .catch((error) => console.warn("작업지시서 공용 동기화 실패:", error.message));
    return () => { active = false; };
  }, []);
  const ids = Object.keys(DB.woDocs);
  const [sel, setSel] = useState(ids[0]);
  const [edit, setEdit] = useState(false);
  const [vals, setVals] = useState({});       // 실투입량 입력
  const [lotVals, setLotVals] = useState({}); // 원재료 공급사 Lot 입력
  const [condVals, setCondVals] = useState({});
  const [errs, setErrs] = useState([]);
  const [woPage, setWoPage] = useState(1);
  const woPageSize = 10;
  const woPageCount = Math.max(1, Math.ceil(ids.length / woPageSize));
  const safeWoPage = Math.min(woPage, woPageCount);
  const pagedIds = ids.slice((safeWoPage - 1) * woPageSize, safeWoPage * woPageSize);
  const w = DB.woDocs[sel];

  if (!w) {
    return (
      <Panel title="">
        <p className="text-sm text-slate-500">조회할 가 없습니다. [작업지시 발행]에서 발행하면 이 화면에서 조회하고 인쇄할 수 있습니다.</p>
      </Panel>
    );
  }

  const num = (v) => { const n = parseFloat(String(v ?? "").replace(/,/g, "")); return isNaN(n) ? null : n; };
  const totalStd = w.inputs.reduce((a, r) => a + (num(r.std) || 0), 0);
  const totalAct = w.inputs.reduce((a, r) => a + (num(r.act) || 0), 0);
  const allDone = w.inputs.every((r) => r.act != null) && w.conds.every((c) => c.act && c.act !== "—");

  const startEdit = () => {
    setVals(Object.fromEntries(w.inputs.map((r, i) => [i, r.act != null ? String(r.act) : ""])));
    setLotVals(Object.fromEntries(w.inputs.map((r, i) => [i, r.lot && r.lot !== "—" ? r.lot : ""])));
    setCondVals(Object.fromEntries(w.conds.map((c, j) => [j, c.act && c.act !== "—" ? c.act : ""])));
    setErrs([]);
    setEdit(true);
  };

  const saveActs = async () => {
    const e2 = [];
    const user = window.__QMES_USER__ || "-";

    /* 원재료 LOT는 IQC 합격 + 홀드 없음 조건을 통과해야 실제 투입 저장 가능 */
    w.inputs.forEach((row, i) => {
      const intendedAct = String(vals[i] ?? row.act ?? "").trim();
      if (!intendedAct || Number(intendedAct) <= 0) return;
      const materialLot = String(lotVals[i] ?? row.lot ?? "").trim();
      const isIntermediate = qmesMaterialType(row.name) === "중간재";
      const selectedContainer = row.containerNo ? DB.intermediateContainers?.[row.containerNo] : null;
      if (selectedContainer && materialLot && selectedContainer.lot !== materialLot) {
        e2.push(`${row.name}: LOT ${materialLot}과 포장번호 ${row.containerNo}의 등록 LOT(${selectedContainer.lot})가 다릅니다`);
        return;
      }
      const gate = isIntermediate
        ? (materialLot
            ? (qmesActiveHold(materialLot)
                ? { ok:false, reason:"격리·홀드된 중간 배치 LOT" }
                : { ok:true, reason:"중간 배치 LOT 확인" })
            : { ok:false, reason:"중간 배치 LOT 미입력" })
        : qmesMaterialGate(materialLot);
      if (!gate.ok) e2.push(`${row.name}: ${materialLot || "LOT 미입력"} — ${gate.reason}`);
    });
    if (e2.length) {
      e2.forEach((msg) => qmesRecordGateBlock("원재료 투입 게이트", sel, msg));
      dbSave();
      setErrs(e2);
      return;
    }

    const newInputs = w.inputs.map((r, i) => {
      const v = String(vals[i] ?? "").trim();
      const lotv = String(lotVals[i] ?? "").trim();
      if (v === "") return { ...r, lot: lotv || r.lot || "" };
      if (!/^\d+(\.\d+)?$/.test(v)) { e2.push(`${r.name}: 실투입량 숫자 형식 오류 — 저장 진입 금지`); return r; }
      const act = parseFloat(v);
      const std = num(r.std) || 0;
      const tol = Math.max(0.1, std * 0.01); // 계량 공차: ±0.1kg 또는 기준량의 1% 중 큰 값
      const availableQty = Number(r.availableQty ?? qmesMaterialContainer(r)?.remainingQty ?? std);
      const remaining = Number(Math.max(0, availableQty - act).toFixed(3));
      return {
        ...r, lot:lotv, materialLot:lotv, act, availableQty, remaining,
        error:std > 0 ? Number((((act - std) / std) * 100).toFixed(2)) : null,
        ratio:std > 0 ? Number(((act / std) * 100).toFixed(2)) : null,
        ok:Math.abs(act - std) <= tol, by:user
      };
    });
    if (e2.length) { setErrs(e2); return; }
    const newConds = w.conds.map((c, j) => {
      const v = String(condVals[j] ?? "").trim();
      return v === "" ? c : { ...c, act: v, ok: true, by: user };
    });
    const done = newInputs.every((r) => r.act != null) && newConds.every((c) => c.act && c.act !== "—");
    const overTol = newInputs.some((r) => r.ok === false);
    DB.woDocs[sel] = { ...w, inputs: newInputs, conds: newConds, status: done ? "완료" : "실적 기록중" };

    /* 모든 원료의 잔량을 LOT·용기 단위로 보존하고 중간재 용기 재고를 즉시 동기화 */
    newInputs.filter((row) => row.act != null && String(row.lot || "").trim()).forEach((row) => {
      const containerNo = String(row.containerNo || "").trim().toUpperCase();
      const remainderKey = `${String(row.lot).trim().toUpperCase()}|${containerNo || "BULK"}`;
      DB.materialRemainders[remainderKey] = {
        key:remainderKey, name:row.name, materialType:row.materialType || qmesMaterialType(row.name),
        lot:String(row.lot).trim().toUpperCase(), containerNo,
        inputStatus:row.inputStatus || "신규", availableQty:Number(row.availableQty || 0),
        usedQty:Number(row.act || 0), remainingQty:Number(row.remaining || 0),
        status:Number(row.remaining || 0) > 0 ? "잔량" : "소진",
        workOrder:sel, updatedAt:new Date().toISOString(), by:user
      };
      if (containerNo && DB.intermediateContainers?.[containerNo]) {
        DB.intermediateContainers[containerNo] = {
          ...DB.intermediateContainers[containerNo],
          remainingQty:Number(row.remaining || 0),
          status:Number(row.remaining || 0) > 0 ? "잔량" : "소진",
          lastWorkOrder:sel, updatedAt:new Date().toISOString()
        };
      }
    });

    const b = DB.batches.find((x) => x.no === sel);
    if (b) { if (done) { b.status = "완료"; b.done = b.plan; } else if (b.status === "발행") b.status = "진행중"; }

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const L = DB.lots[sel];
    if (L) {
      /* 완제품↔중간배치↔원재료 양방향 계보 저장 */
      L.materials = newInputs
        .filter((row) => String(row.lot || "").trim())
        .map((row) => {
          const isIntermediate = qmesMaterialType(row.name) === "중간재";
          const iqc = isIntermediate ? null : qmesLatestIqc(row.lot);
          return {
            lot:String(row.lot).trim(), code:row.code || "-", name:row.name,
            materialType:row.materialType || qmesMaterialType(row.name),
            containerNo:row.containerNo || "", inputStatus:row.inputStatus || "신규",
            remainingQty:Number(row.remaining || 0),
            supplier:isIntermediate ? "사내 중간배치" : (iqc?.supplier || "-"),
            qty:`${Number(row.act ?? row.std ?? 0).toLocaleString()} ${row.unit || "kg"}`,
            recv:isIntermediate ? (w.date || "-") : (iqc?.recv || "-"),
            iqc:isIntermediate ? "중간배치 추적" : (iqc?.judge || "미검사")
          };
        });
      const intermediateInputs = newInputs.filter((row) => qmesMaterialType(row.name) === "중간재" && String(row.lot || "").trim());
      const binderInput = intermediateInputs[0];
      const binderLot = String(binderInput?.lot || L.binderLot || "").trim();
      L.binderLot = binderLot;
      intermediateInputs.forEach((row) => {
        const sourceLot = String(row.lot).trim();
        const previous = DB.intermediateLots[sourceLot] || {};
        DB.intermediateLots[sourceLot] = {
          ...previous, lot:sourceLot, type:row.name,
          childLots:Array.from(new Set([...(previous.childLots || []), sel])),
          status:previous.status === "생산대기" ? "사용가능" : (previous.status || "사용가능"),
          updatedAt:new Date().toISOString(), by:user
        };
      });

      if (w.workType === "바인더 솔루션(중간재)") {
        const output = DB.intermediateLots[sel] || {};
        const outputContainers = (w.packaging || []).map((row) => row.containerNo).filter(Boolean);
        DB.intermediateLots[sel] = {
          ...output, lot:sel, type:w.item, workType:w.workType,
          parentLots:L.materials.map((material) => material.lot),
          childLots:output.childLots || [], containers:outputContainers,
          qty:Number(w.plan || 0), status:done ? "사용가능" : "생산중",
          workOrder:sel, updatedAt:new Date().toISOString(), by:user
        };
        outputContainers.forEach((containerNo) => {
          if (!DB.intermediateContainers?.[containerNo]) return;
          DB.intermediateContainers[containerNo] = {
            ...DB.intermediateContainers[containerNo],
            status:done ? "사용가능" : "포장진행",
            updatedAt:new Date().toISOString()
          };
        });
      }
      if (done && !L.steps.some((st) => st.name === "생산 실적 기록 완료")) {
        L.steps = [...L.steps, { stage: "생산", name: "생산 실적 기록 완료", time, detail: `실투입 합계 ${newInputs.reduce((a, r) => a + (num(r.act) || 0), 0).toFixed(2)}kg / 계획 ${totalStd.toFixed(2)}kg · 공정조건 전 항목 기록${overTol ? " · 계량 공차 이탈 항목 있음" : ""}`, result: overTol ? "완료 (공차 이탈 확인 필요)" : "완료", by: user }];
        L.stage = "생산";
        if (!L.status.includes("홀드")) L.status = "생산완료 — 검사 대기";
      } else if (!done) {
        L.stage = "생산";
        if (!L.status.includes("홀드")) L.status = "생산중 (실적 기록)";
      }
    }
    dbSave();
    let sharedError = "";
    try {
      if (typeof qmesSyncWorkOrder === "function") await qmesSyncWorkOrder(sel);
    } catch (error) {
      sharedError = `PC 공용 DB 저장 실패 — ${error.message}`;
    }
    setErrs(sharedError ? [sharedError] : []);
    setEdit(false);
  };

  const okMark = (ok) =>
    ok === true ? <span className="font-semibold text-emerald-600">적합</span>
    : ok == null ? <span className="font-medium text-sky-600">—</span>
    : <span className="font-semibold text-red-600">공차 이탈</span>;
  const editCls = "w-full bg-white border border-stone-300 rounded px-2 py-1 text-sm tabular-nums text-stone-900 focus:outline-none focus:border-sky-600";

  return (
    <div className="flex flex-col gap-4">
      <Panel title=" 조회 · 인쇄" right={
        <button onClick={() => printDoc()} className="flex items-center gap-1.5 rounded border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium transition-colors">
          <Printer size={13} /> 선택  인쇄
        </button>
      }>
        <div className="text-xs text-slate-500 mb-3">
          발행된 작업지시 목록에서 LOT No. 또는 품목을 누르거나, 관리의 보기 버튼을 눌러 를 선택하세요.
        </div>
        <div className="qmes-iqc-ledger-wrap overflow-x-auto">
          <table className="qmes-wo-list-table w-full text-sm min-w-[900px]">
            <colgroup>
              <col style={{ width: "150px" }} />
              <col style={{ width: "250px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "125px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "110px" }} />
            </colgroup>
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 px-3 font-medium">LOT No.</th>
                <th className="text-left py-2 px-3 font-medium">품목</th>
                <th className="text-left py-2 px-3 font-medium">설비</th>
                <th className="text-right py-2 px-3 font-medium">계획량</th>
                <th className="text-center py-2 px-3 font-medium">생산일자</th>
                <th className="text-center py-2 px-3 font-medium">상태</th>
                <th className="text-center py-2 px-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedIds.map((id) => {
                const doc = DB.woDocs[id] || {};
                const batch = DB.batches.find((b) => b.no === id) || {};
                return (
                  <tr key={id} className={`border-b border-slate-800/70 ${sel === id ? "bg-sky-500/10" : "hover:bg-slate-800/30"}`}>
                    <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                      <button onClick={() => { setSel(id); setEdit(false); setErrs([]); }} className="text-sky-300 hover:text-sky-200 hover:underline">
                        {id}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 truncate" title={doc.item || batch.item || ""}>
                      <button onClick={() => { setSel(id); setEdit(false); setErrs([]); }} className="text-slate-100 hover:text-white hover:underline text-left">
                        {doc.item || batch.item || "-"}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-400 truncate" title={doc.tank || batch.tank || ""}>{doc.tank || batch.tank || "-"}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-100 whitespace-nowrap">{Number(doc.plan ?? batch.plan ?? 0).toLocaleString()} kg</td>
                    <td className="py-2.5 px-3 text-center text-xs tabular-nums text-slate-300 whitespace-nowrap">{doc.date || batch.due || "-"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={getAutoWoStatus(id)}
                        onChange={(e) => {
                          saveWoManualStatus(id, e.target.value);
                          setSel(id);
                          setStatusVersion((v) => v + 1);
                        }}
                        className={`qmes-status-select status-${getAutoWoStatus(id)}`}
                        title="상태 직접 변경"
                      >
                        <option value="발행">발행</option>
                        <option value="생산중">생산중</option>
                        <option value="검사중">검사중</option>
                        <option value="완료">완료</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => { setSel(id); setEdit(false); setErrs([]); }}
                        className={`px-2.5 py-1 rounded border text-xs ${sel === id ? "border-sky-500/60 text-sky-300 bg-sky-500/10" : "border-slate-600 text-slate-300 hover:bg-slate-800"}`}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ids.length > woPageSize && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button onClick={() => setWoPage((p) => Math.max(1, p - 1))}
              disabled={safeWoPage === 1}
              className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 disabled:opacity-40">이전</button>
            <span className="text-xs text-slate-400">{safeWoPage} / {woPageCount}</span>
            <button onClick={() => setWoPage((p) => Math.min(woPageCount, p + 1))}
              disabled={safeWoPage === woPageCount}
              className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 disabled:opacity-40">다음</button>
          </div>
        )}
      </Panel>

      {/*  — 수입검사 성적서와 동일한 문서 틀 */}
      <div className="doc-paper qmes-iqc-doc qmes-wo-cert bg-white text-slate-900 rounded-lg p-6 md:p-8 shadow-xl max-w-4xl mx-auto w-full">
        <div className="qmes-iqc-centered-header qmes-wo-header border-b-2 border-slate-900 pb-4">
          <div className="qmes-iqc-header-logo-wrap qmes-wo-header-logo-wrap">
            <img className="qmes-iqc-header-logo qmes-wo-header-logo" src="data:image/png;base64,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" alt="나모케미칼(주) 로고" />
          </div>
          <div className="qmes-iqc-centered-title">
            <div className="text-xl font-bold tracking-wide">작업지시서</div>
            <div className="text-xs text-slate-500 mt-0.5">WORK ORDER</div>
          </div>
          <div className="qmes-iqc-header-meta text-right text-xs text-slate-600">
            <div>작업지시번호 : <span className="qmes-wo-number-match">{doc.woNo || viewingWo || "-"}</span></div>
            <div>생산일자 : {doc.date || batch.due || "-"}</div>
          </div>
        </div>

        <div className="qmes-iqc2-sec qmes-iqc2-first">
          <div className="qmes-iqc2-sec-title">기본정보</div>
          <table className="qmes-iqc2-table qmes-wo-basic-info-table">
            <thead><tr><th>LOT No.</th><th>제품명</th><th>설비명</th><th>작업자</th></tr></thead>
            <tbody><tr>
              <td>{sel || doc.woNo || viewingWo || "-"}</td>
              <td>{w.item || "-"}</td>
              <td>{w.tank || "-"}</td>
              <td>{w.workers || w.worker || "-"}</td>
            </tr></tbody>
          </table>
        </div>

        <div className="qmes-iqc2-sec">
          <div className="qmes-iqc2-sec-title">생산정보</div>
          <table className="qmes-iqc2-table">
            <thead><tr><th>작업구분</th><th>공정명</th><th>생산계획량</th><th>작업시간</th><th>생산시간</th><th>근무유형</th></tr></thead>
            <tbody><tr>
              <td>{w.workType || "완제품"}</td>
              <td>{w.procName || "절연슬러리 제조"}</td>
              <td>{typeof w.plan === "number" ? `${w.plan.toLocaleString()} kg` : (w.plan || "-")}</td>
              <td>{w.hours || "-"}</td>
              <td>{w.timeRange || "-"}</td>
              <td>{w.shiftType || "일반"}</td>
            </tr></tbody>
          </table>
        </div>

        <div className="qmes-iqc2-sec">
          <div className="qmes-iqc2-sec-title">원재료 투입</div>
          <table className="qmes-iqc2-table qmes-wo-cert-material-table">
            <thead><tr>
              <th>No</th><th>원재료명</th><th>원재료 LOT</th><th>상태</th><th>계획량</th><th>실투입량</th><th>사용 후 잔량</th><th>판정</th><th>비고</th>
            </tr></thead>
            <tbody>
              {w.inputs.map((r, i) => (
                <tr key={i}>
                  <td>{r.seq ?? i + 1}</td>
                  <td className="qmes-iqc2-item-cell">{r.name}<small className="block text-slate-500">{r.materialType || qmesMaterialType(r.name)}</small></td>
                  <td className="font-mono">
                    {edit ? <input value={lotVals[i] ?? ""} onChange={(e) => setLotVals({ ...lotVals, [i]: e.target.value })} placeholder="공급사 LOT" className={editCls} />
                      : ((r.materialLot || r.lot) && (r.materialLot || r.lot) !== "—" ? (r.materialLot || r.lot) : "-")}
                  </td>
                  <td>{r.inputStatus || "신규"}</td>
                  <td>{num(r.std) != null ? `${num(r.std)} ${r.unit || "kg"}` : (r.std || "-")}</td>
                  <td>{edit ? <input inputMode="decimal" value={vals[i] ?? ""} onChange={(e) => setVals({ ...vals, [i]: e.target.value })} placeholder="실측" className={editCls + " text-right"} /> : (r.act != null ? `${r.act} ${r.unit || "kg"}` : "-")}</td>
                  <td>{r.remaining == null ? "-" : `${Number(r.remaining).toFixed(3)} ${r.unit || "kg"}`}</td>
                  <td>{okMark(r.ok)}</td>
                  <td>{r.note || "-"}</td>
                </tr>
              ))}
              <tr className="qmes-wo-cert-total-row">
                <td></td><td className="font-semibold">합계</td><td></td><td></td>
                <td className="font-semibold">{totalStd.toFixed(2)} kg</td>
                <td className="font-semibold">{totalAct > 0 ? `${totalAct.toFixed(2)} kg` : "-"}</td>
                <td className="font-semibold">{w.inputs.some((r) => r.remaining != null) ? `${w.inputs.reduce((sum, r) => sum + Number(r.remaining || 0), 0).toFixed(3)} kg` : "-"}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {(w.packaging || []).length > 0 && (
          <div className="qmes-iqc2-sec">
            <div className="qmes-iqc2-sec-title">중간재 포장정보</div>
            <table className="qmes-iqc2-table">
              <thead><tr><th>No</th><th>중간재 LOT</th><th>포장번호</th><th>포장중량</th><th>포장일자</th><th>보관위치</th><th>현재 잔량</th><th>상태</th></tr></thead>
              <tbody>
                {w.packaging.map((row, index) => {
                  const current = DB.intermediateContainers?.[row.containerNo] || row;
                  return <tr key={`wo-pack-${row.containerNo || index}`}>
                    <td>{index + 1}</td><td className="font-mono">{sel}</td><td className="font-mono">{row.containerNo}</td>
                    <td>{Number(row.packWeight || 0).toFixed(3)} kg</td><td>{row.packDate || "-"}</td>
                    <td>{row.storageLocation || "-"}</td><td>{Number(current.remainingQty || 0).toFixed(3)} kg</td><td>{current.status || row.status || "-"}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="qmes-iqc2-sec">
          <div className="qmes-iqc2-sec-title">특이사항</div>
          <div className="qmes-iqc2-remarks">{w.remarks || "-"}</div>
        </div>

        {errs.length > 0 && <div className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">{errs.map((x,i)=><div key={i}>• {x}</div>)}</div>}

        <div className="qmes-iqc2-auth-row">
          <div className="qmes-iqc2-code-box"><IqcBarcodeQr record={{ inNo: w.woNo || sel, lot: sel, name: w.item, supplier: w.tank, recv: w.date }} /></div>
          <table className="qmes-iqc2-sign-table">
            <tbody>
              <tr><th>작성</th><th>검토</th><th>승인</th></tr>
              <tr><td>{(w.workers || w.worker || "").split(",")[0]}</td><td>{allDone ? ((window.__QMES_USER__ || "-").split(" ")[1] || window.__QMES_USER__ || "-") : ""}</td><td></td></tr>
            </tbody>
          </table>
        </div>

        <div className="qmes-iqc2-doc-footer">본 문서는 QMES에서 발행된 관리문서입니다.</div>
      </div>
    </div>
  );
}

/* ──────────────────────────── 작업지시 발행 탭 ──────────────────────────── */

const BOM = {
  " NBA20-HM01": {
    prefix: "SL", baseQty: 230, procName: "절연슬러리 제조", workType: "완제품",
    tanks: ["HSM #1 (High Shear Mixer)", "HSM #2 (High Shear Mixer)"],
    items: [
      { seq: 1, name: "NMP", base: 17.09, unit: "kg", note: "" },
      { seq: 2, name: "BYK180 (분산제)", base: 0.789, unit: "kg", note: "" },
      { seq: 3, name: "AOH30 (Boehmite)", base: 27.6, unit: "kg", note: "투입 후 20min 순환" },
      { seq: 4, name: "SBS", base: 0, unit: "kg", note: "" },
      { seq: 5, name: "PVdF", base: 0, unit: "kg", note: "" },
      { seq: 6, name: "SBR", base: 106.24, unit: "kg", note: "" },
      { seq: 7, name: "중간배치 선택", base: 0, unit: "kg", note: "" },
    ],
  },
  "중간배치(바인더)": {
    prefix: "CBG", baseQty: 230, procName: "바인더 솔루션 제조", workType: "바인더 솔루션(중간재)", legacy: true,
    tanks: ["HSM #1 (High Shear Mixer)", "HSM #2 (High Shear Mixer)"],
    items: [
      { seq: 1, name: "NMP", base: 0, unit: "kg", note: "" },
      { seq: 2, name: "BYK180 (분산제)", base: 0, unit: "kg", note: "" },
      { seq: 3, name: "AOH30 (Boehmite)", base: 0, unit: "kg", note: "" },
      { seq: 4, name: "SBS", base: 0, unit: "kg", note: "" },
      { seq: 5, name: "PVdF", base: 0, unit: "kg", note: "" },
      { seq: 6, name: "SBR", base: 0, unit: "kg", note: "" },
    ],
  },
  "중간배치(SBR 바인더)": {
    prefix: "CBG", baseQty: 230, procName: "SBR 바인더 솔루션 제조", workType: "바인더 솔루션(중간재)",
    tanks: ["HSM #1 (High Shear Mixer)", "HSM #2 (High Shear Mixer)"],
    items: [
      { seq: 1, name: "NMP", base: 0, unit: "kg", note: "" },
      { seq: 2, name: "SBR", base: 0, unit: "kg", note: "" },
    ],
  },
  "중간배치(PVDF 바인더)": {
    prefix: "CBG", baseQty: 230, procName: "PVDF 바인더 솔루션 제조", workType: "바인더 솔루션(중간재)",
    tanks: ["HSM #1 (High Shear Mixer)", "HSM #2 (High Shear Mixer)"],
    items: [
      { seq: 1, name: "NMP", base: 0, unit: "kg", note: "" },
      { seq: 2, name: "PVdF", base: 0, unit: "kg", note: "" },
    ],
  },
  "중간배치(SBS 바인더)": {
    prefix: "CBG", baseQty: 230, procName: "SBS 바인더 솔루션 제조", workType: "바인더 솔루션(중간재)",
    tanks: ["HSM #1 (High Shear Mixer)", "HSM #2 (High Shear Mixer)"],
    items: [
      { seq: 1, name: "NMP", base: 0, unit: "kg", note: "" },
      { seq: 2, name: "SBS", base: 0, unit: "kg", note: "" },
    ],
  },
};

const INTERMEDIATE_MATERIAL_OPTIONS = [
  "중간배치(SBR 바인더)",
  "중간배치(PVDF 바인더)",
  "중간배치(SBS 바인더)",
];

const WORK_TYPE_OPTIONS = ["바인더 솔루션(중간재)", "완제품"];

const MATERIAL_OPTIONS = [
  "NMP",
  "BYK180 (분산제)",
  "AOH30 (Boehmite)",
  "SBS",
  "PVdF",
  "SBR",
  "중간배치 선택",
  ...INTERMEDIATE_MATERIAL_OPTIONS,
];

function qmesMaterialType(name) {
  return INTERMEDIATE_MATERIAL_OPTIONS.includes(String(name || "")) || String(name || "").includes("중간배치")
    ? "중간재"
    : "일반원료";
}

function qmesMaterialContainer(row) {
  const id = String(row?.containerNo || "").trim();
  return id ? DB.intermediateContainers?.[id] || null : null;
}

function qmesInputAvailableQty(row) {
  const container = qmesMaterialContainer(row);
  const value = container?.remainingQty ?? row?.availableQty ?? row?.plan;
  const qty = Number(value);
  return Number.isFinite(qty) && qty >= 0 ? qty : 0;
}

function qmesInputRemainingQty(row, actualOverride) {
  const actualValue = actualOverride ?? row?.actual ?? row?.act;
  if (actualValue === "" || actualValue == null || Number.isNaN(Number(actualValue))) return null;
  return Number(Math.max(0, qmesInputAvailableQty(row) - Number(actualValue)).toFixed(3));
}

function getAutoWoStatus(lotNo) {
  const doc = DB.woDocs[lotNo] || {};
  if (doc.manualStatus) return doc.manualStatus;

  const inputs = doc.inputs || [];
  const pqc = (DB.insp?.PQC || []).filter((r) => r.lot === lotNo);
  const oqc = (DB.insp?.OQC || []).filter((r) => r.lot === lotNo);

  const isPass = (v) => ["OK", "합격", "적합", "PASS"].includes(String(v || "").toUpperCase());
  if (oqc.some((r) => isPass(r.judge))) return "완료";
  if (pqc.length > 0 || oqc.length > 0) return "검사중";
  if (inputs.some((it) => Number(it.act) > 0)) return "생산중";
  return "발행";
}

function saveWoManualStatus(lotNo, status) {
  const current = DB.woDocs[lotNo] || {};
  const prev = current.manualStatus || getAutoWoStatus(lotNo);
  const batch = (DB.batches || []).find((b) => b.no === lotNo);
  const plan = Math.max(0, Number(current.plan ?? batch?.plan ?? 0));

  let actual = Math.max(0, Number(current.productionActual ?? batch?.done ?? 0));
  let progress = plan > 0 ? Math.min(100, Math.round((actual / plan) * 100)) : 0;

  // 상태 직접 변경 시 생산현황·대시보드까지 같은 값으로 즉시 동기화
  if (status === "완료") {
    actual = plan;
    progress = 100;
  } else if (status === "발행") {
    actual = 0;
    progress = 0;
  }

  DB.woDocs[lotNo] = {
    ...current,
    manualStatus: status,
    status: status,
    productionActual: actual,
    productionProgress: progress,
    statusHistory: [
      ...(current.statusHistory || []),
      {
        from: prev,
        to: status,
        changedAt: new Date().toISOString(),
      },
    ],
  };

  if (batch) {
    batch.status = status === "생산중" ? "진행중" : status;
    batch.done = actual;
    batch.updatedAt = new Date().toISOString();
  }

  const lot = DB.lots?.[lotNo];
  if (lot && !String(lot.status || "").includes("홀드")) {
    lot.stage = "생산";
    lot.qty = `${actual.toLocaleString()} kg / 계획 ${plan.toLocaleString()} kg`;
    lot.status = status === "완료"
      ? "생산완료 — 검사 대기"
      : status === "검사중"
        ? "검사중"
        : status === "생산중"
          ? "생산중"
          : "발행 — 생산 대기";
  }

  dbSave();
  if (typeof qmesSyncWorkOrder === "function") {
    qmesSyncWorkOrder(lotNo).catch((error) => console.warn("작업지시 상태 공용 동기화 실패:", error.message));
  }
}

function woStatusTone(status) {
  if (status === "완료") return "ok";
  if (status === "검사중") return "violet";
  if (status === "생산중") return "info";
  return "warn";
}

function IssueWoTab() {
  const products = Object.keys(BOM).filter((name) => !BOM[name].legacy);
  const firstProduct = products.find((name) => BOM[name].workType === "완제품") || products[0];
  const [form, setForm] = useState({
    workType: BOM[firstProduct].workType, product: firstProduct, tank: BOM[firstProduct].tanks[0], qty: "",
    prodDate: "", lotNo: "", site: "C", hours: "7h", timeRange: "08:30~16:30",
    shiftType: "일반", worker: "",
  });
  const [issued, setIssued] = useState(DB.batches);
  const [editingWo, setEditingWo] = useState(null);
  const [viewingWo, setViewingWo] = useState(null);
  const [woPreviewMode, setWoPreviewMode] = useState("detail");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueSearch, setIssueSearch] = useState({ lot: "", item: "", date: "" });
  const [statusVersion, setStatusVersion] = useState(0);
  const issueFormRef = React.useRef(null);

  const openWorkOrderPreview = (lotNo, mode = "detail") => {
    setWoPreviewMode(mode);
    setViewingWo(lotNo);
  };

  const printIssuedWorkOrder = (lotNo) => {
    window.setTimeout(() => {
      const cert = document.getElementById(`qmes-issued-cert-${lotNo}`);
      if (!cert) {
        alert("출력할 작업지시서를 찾을 수 없습니다.");
        return;
      }
      /* 수입·공정·출하 성적서와 동일한 공통 미리보기 인쇄 방식 */
      printDoc(cert);
    }, 60);
  };
  const [issuePage, setIssuePage] = useState(1);
  const issuePageSize = 10;
  const blankPlanItems = (product) => {
    const safeProduct = Array.isArray(BOM[product]?.items) ? product : firstProduct;
    return (BOM[safeProduct]?.items || []).map((it) => ({
      ...it, materialLot: "", containerNo: "", inputStatus: "신규",
      availableQty: "", base: "", plan: "", actual: "", remaining: null, note: ""
    }));
  };
  const blankPackRow = () => ({
    containerNo: "", packWeight: "", packDate: "", storageLocation: "", status: "포장계획"
  });
  const [planItems, setPlanItems] = useState(blankPlanItems(firstProduct));
  const [packRows, setPackRows] = useState([blankPackRow()]);

  const openNewIssueForm = () => {
    const product = Array.isArray(BOM[form.product]?.items) ? form.product : firstProduct;
    const productBom = BOM[product] || BOM[firstProduct];
    setEditingWo(null);
    setForm((current) => ({
      ...current,
      workType:productBom.workType,
      product,
      tank:productBom.tanks[0],
      prodDate:"",
      lotNo:"",
      qty:""
    }));
    setPlanItems(blankPlanItems(product));
    setPackRows([blankPackRow()]);
    setShowIssueForm(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        issueFormRef.current?.scrollIntoView({ behavior:"auto", block:"start" });
      });
    });
  };

  useEffect(() => {
    let active = true;
    if (typeof qmesSyncPullWorkOrders !== "function") return () => { active = false; };
    qmesSyncPullWorkOrders()
      .then(() => { if (active) setIssued([...DB.batches]); })
      .catch((error) => console.warn("작업지시서 공용 동기화 실패:", error.message));
    return () => { active = false; };
  }, []);

  const bom = BOM[form.product] || BOM[firstProduct];
  const isBinderWorkOrder = bom.workType === "바인더 솔루션(중간재)";
  const isIntermediateWorkOrder = isBinderWorkOrder;
  const availableProducts = products.filter((name) => BOM[name].workType === form.workType);
  const productOptions = availableProducts.includes(form.product)
    ? availableProducts
    : [form.product, ...availableProducts];
  const allowedIntermediateMaterials = isBinderWorkOrder ? [] : INTERMEDIATE_MATERIAL_OPTIONS;
  const availableMaterialOptions = MATERIAL_OPTIONS.filter((name) =>
    !String(name).includes("중간배치")
  ).concat(allowedIntermediateMaterials.length ? ["중간배치 선택", ...allowedIntermediateMaterials] : []);
  const plannedTotal = planItems.reduce((sum, it) => sum + (Number(it.plan) || 0), 0);
  const qtyNum = Number(plannedTotal.toFixed(3));

  /* 생산일자·생산구분 기반 자동 채번 — [사이트][년][월][일][당일 순번] */
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(form.prodDate);
  const nextNo = (() => {
    if (!dateOk) return "—";
    const [yy, mm, dd] = form.prodDate.split("-");
    const yearChar = String.fromCharCode(65 + (parseInt(yy, 10) - 2025));
    const monthChar = String.fromCharCode(64 + parseInt(mm, 10));
    const seq = DB.seqs[`wo-${form.prodDate}-${form.site}`] || 1;
    return `${form.site}${yearChar}${monthChar}${dd}${String(seq).padStart(2, "0")}`;
  })();

  const requestedLotNo = (form.lotNo || nextNo || "").trim();

  const issue = async () => {
    if (!dateOk) { window.alert("생산일자를 선택하세요."); return; }
    if (!requestedLotNo || requestedLotNo === "—") { window.alert("LOT No.를 확인하세요."); return; }
    if (!editingWo && DB.batches.some((b) => b.no === requestedLotNo)) { window.alert("이미 사용 중인 LOT No.입니다."); return; }
    const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
    const seqKey = `wo-${form.prodDate}-${form.site}`;
    if (!editingWo) DB.seqs[seqKey] = (DB.seqs[seqKey] || 1) + 1;

    const woNo = editingWo || requestedLotNo;
    const batch = { no: woNo, item: form.product, workType: bom.workType || "완제품", tank: form.tank, plan: qtyNum, done: editingWo ? (DB.batches.find(b=>b.no===editingWo)?.done || 0) : 0, unit: "kg", due: form.prodDate, status: "발행", shift: `${form.shiftType} · ${form.timeRange}`, worker: form.worker.trim(), time };
    DB.batches = editingWo ? DB.batches.map((b)=>b.no===editingWo?batch:b) : [batch, ...DB.batches];

    const normalizedPackaging = isBinderWorkOrder
      ? packRows
          .filter((row) => String(row.containerNo || row.packWeight || row.packDate || row.storageLocation).trim())
          .map((row, index) => ({
            containerNo: String(row.containerNo || `${woNo}-P${String(index + 1).padStart(2, "0")}`).trim().toUpperCase(),
            packWeight: Number(Number(row.packWeight || 0).toFixed(3)),
            packDate: row.packDate || form.prodDate,
            storageLocation: String(row.storageLocation || "").trim(),
            remainingQty: Number(Number(row.packWeight || 0).toFixed(3)),
            status: row.status || "포장계획",
          }))
      : [];

    DB.woDocs[woNo] = {
      item: form.product, workType: bom.workType || "완제품", procName: bom.procName, tank: form.tank, plan: qtyNum,
      date: form.prodDate, hours: form.hours, timeRange: form.timeRange, shiftType: form.shiftType,
      workers: form.worker.trim(), status: "발행", packaging: normalizedPackaging,
      inputs: planItems.map((it, index) => {
        const planned = String(it.plan ?? "").trim() === "" ? null : Number(Number(it.plan).toFixed(3));
        const actual = it.actual === "" || it.actual == null ? null : Number(it.actual);
        const inputRatio = planned > 0 && actual != null
          ? Number(((actual / planned) * 100).toFixed(2))
          : null;
        const materialType = qmesMaterialType(it.name);
        const container = qmesMaterialContainer(it);
        const availableQty = materialType === "중간재"
          ? Number(container?.remainingQty ?? it.availableQty ?? planned ?? 0)
          : Number(it.availableQty || planned || 0);
        const remaining = actual == null
          ? null
          : Number(Math.max(0, availableQty - actual).toFixed(3));
        return {
          seq: index + 1, name: it.name,
          lot: it.materialLot || "", materialLot: it.materialLot || "",
          materialType, containerNo: String(it.containerNo || "").trim().toUpperCase(),
          inputStatus: it.inputStatus || "신규", availableQty, remaining,
          unit: it.unit, note: it.note,
          base: String(it.base ?? "").trim() === "" ? "" : Number(it.base), std: planned, plan: planned,
          act: actual,
          ratio: inputRatio,
          error: planned != null && planned > 0 && actual != null
            ? Number((((actual - planned) / planned) * 100).toFixed(2))
            : null,
          ok: null, by: "",
        };
      }),
      conds: [
        { proc: "HSM 용해", item: "시간", std: "≤ 80 min", method: "PLC 패널", act: "", ok: null, by: "" },
        { proc: "HSM 용해", item: "온도", std: "< 70 ℃", method: "PLC 패널", act: "", ok: null, by: "" },
        { proc: "HSM 용해", item: "RPM", std: "3,540±500 rpm", method: "PLC 패널", act: "", ok: null, by: "" },
        { proc: "HSM 용해", item: "최대압력", std: "≤ 6 bar", method: "PLC 패널", act: "", ok: null, by: "" },
        { proc: "HSM 용해", item: "유량", std: "< 20 L/min", method: "PLC 패널", act: "", ok: null, by: "" },
        { proc: "순환", item: "시간", std: "60 min", method: "PLC 패널", act: "", ok: null, by: "" },
        { proc: "순환", item: "온도", std: "< 70 ℃", method: "PLC 패널", act: "", ok: null, by: "" },
      ],
    };

    normalizedPackaging.forEach((row) => {
      DB.intermediateContainers[row.containerNo] = {
        ...row, lot:woNo, materialName:form.product, workOrder:woNo,
        initialQty:row.packWeight, updatedAt:new Date().toISOString(),
      };
    });

    const savedInputs = DB.woDocs[woNo].inputs;
    const binderInput = savedInputs.find((it) => qmesMaterialType(it.name) === "중간재");
    const binderLot = String(binderInput?.materialLot || "").trim().toUpperCase();

    DB.lots[woNo] = {
      item: form.product.trim(), itemName: form.product,
      workType:bom.workType, qty: `${qtyNum.toLocaleString()} kg (계획)`,
      wo: woNo, status: "발행 — 생산 대기", stage: "수입",
      materials: savedInputs
        .filter((it) => String(it.materialLot || "").trim())
        .map((it) => ({
          lot:it.materialLot, code:"-", name:it.name, materialType:it.materialType,
          containerNo:it.containerNo || "", inputStatus:it.inputStatus || "신규",
          qty:`${Number(it.act ?? it.plan ?? 0).toLocaleString()} ${it.unit || "kg"}`,
          remainingQty:it.remaining, supplier:it.materialType === "중간재" ? "사내 중간재" : "-",
          recv:form.prodDate, iqc:it.materialType === "중간재" ? "중간재 추적" : "투입 전 검사 확인"
        })),
      binderLot, containers:normalizedPackaging.map((row) => row.containerNo),
      steps: [{ stage: "수입", name: "작업지시 발행", time, detail: `${bom.workType} · ${bom.procName} · ${form.tank} · 계획 ${qtyNum.toLocaleString()}kg`, result: "발행", by: window.__QMES_USER__ || "-" }],
      ship: null,
    };

    if (binderLot) {
      const previousMid = DB.intermediateLots[binderLot] || {};
      DB.intermediateLots[binderLot] = {
        ...previousMid, lot:binderLot, type:binderInput?.name || previousMid.type || "중간재",
        childLots:Array.from(new Set([...(previousMid.childLots || []), woNo])),
        status:previousMid.status || "투입대기", updatedAt:new Date().toISOString(),
        by:window.__QMES_USER__ || "-"
      };
    }

    if (isIntermediateWorkOrder) {
      DB.intermediateLots[woNo] = {
        ...(DB.intermediateLots[woNo] || {}),
        lot:woNo, type:form.product, workType:bom.workType,
        parentLots:savedInputs.map((it) => String(it.materialLot || "").trim()).filter(Boolean),
        childLots:DB.intermediateLots[woNo]?.childLots || [],
        containers:normalizedPackaging.map((row) => row.containerNo),
        qty:qtyNum, status:"생산대기", workOrder:woNo,
        updatedAt:new Date().toISOString(), by:window.__QMES_USER__ || "-"
      };
    }
    auditLog("작업지시", editingWo ? "수정" : "발행", woNo, `${form.product} / ${qtyNum}kg / ${form.prodDate}`);
    dbSave();
    try {
      if (typeof qmesSyncWorkOrder === "function") await qmesSyncWorkOrder(woNo);
    } catch (error) {
      window.alert(`작업지시서는 이 기기에 저장됐지만 PC 공용 DB 저장에 실패했습니다.\n${error.message}`);
    }
    setEditingWo(null);
    setIssued([...DB.batches]);
    setShowIssueForm(false);
  };

  const editWo = (r) => {
    const d = DB.woDocs[r.no] || {};
    const productBom = BOM[r.item] || BOM[firstProduct];
    const workType = d.workType || r.workType || productBom.workType || "완제품";
    setShowIssueForm(true);
    setEditingWo(r.no);
    setForm({ workType, product:r.item, tank:r.tank, qty:"", prodDate:r.due, lotNo:r.no, site:r.no?.[0]||"C", hours:d.hours||"7h", timeRange:d.timeRange||(r.shift?.split(" · ")[1]||""), shiftType:d.shiftType||(r.shift?.split(" · ")[0]||"일반"), worker:r.worker||"" });
    setPlanItems((d.inputs?.length ? d.inputs : productBom.items).map((it, i) => ({
      seq:i+1, name:it.name, materialLot:it.materialLot || it.lot || "",
      containerNo:it.containerNo || "", inputStatus:it.inputStatus || "신규",
      availableQty:it.availableQty ?? "",
      base:it.base ?? "", plan:it.plan ?? it.std ?? "", actual:it.act ?? "",
      remaining:it.remaining ?? null, unit:it.unit||"kg", note:it.note||""
    })));
    setPackRows(d.packaging?.length ? d.packaging : [blankPackRow()]);
    window.scrollTo({top:0,behavior:"smooth"});
  };
  const deleteWo = async (r) => {
    const reason=askDeleteReason(`작업지시 ${r.no}`);
    if(reason===null)return;
    const packaging = DB.woDocs[r.no]?.packaging || [];
    packaging.forEach((row) => { if (row.containerNo) delete DB.intermediateContainers[row.containerNo]; });
    DB.batches=DB.batches.filter(x=>x.no!==r.no);
    delete DB.woDocs[r.no];
    delete DB.lots[r.no];
    delete DB.intermediateLots[r.no];
    DB.insp.PQC=DB.insp.PQC.filter(x=>x.lot!==r.no);
    DB.insp.OQC=DB.insp.OQC.filter(x=>x.lot!==r.no);
    DB.popEntries=DB.popEntries.filter(x=>x.lot!==r.no);
    auditLog("작업지시","삭제",r.no,reason);
    dbSave();
    try {
      if (typeof qmesSyncDeleteWorkOrder === "function") await qmesSyncDeleteWorkOrder(r.no);
    } catch (error) {
      window.alert(`이 기기에서는 삭제됐지만 PC 공용 DB 삭제에 실패했습니다.\n${error.message}`);
    }
    setIssued([...DB.batches]);
  };

  const inputCls = "bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500";
  const label = (t) => <span className="text-[10px] text-slate-500">{t}</span>;
  const filteredIssued = issued.filter((r) => {
    const lotOk = !issueSearch.lot || String(r.no || "").toLowerCase().includes(issueSearch.lot.toLowerCase());
    const itemOk = !issueSearch.item || String(r.item || "").toLowerCase().includes(issueSearch.item.toLowerCase());
    const dateOk = !issueSearch.date || String(r.due || "") === issueSearch.date;
    return lotOk && itemOk && dateOk;
  });
  const issuePageCount = Math.max(1, Math.ceil(filteredIssued.length / issuePageSize));
  const safeIssuePage = Math.min(issuePage, issuePageCount);
  const pagedIssued = filteredIssued.slice((safeIssuePage - 1) * issuePageSize, safeIssuePage * issuePageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 py-1">
        <h2 className="text-[22px] font-bold text-slate-100">작업지시 관리</h2>
        <button
          type="button"
          onClick={openNewIssueForm}
          className="qmes-iqc-new-btn"
        >
          <Plus size={16} /> 신규 발행
        </button>
      </div>

      {showIssueForm && (
      <div ref={issueFormRef} className="qmes-wo-issue-shell">
      <Panel title={editingWo ? "작업지시 수정" : "신규 작업지시 발행"} right={
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">LOT No. 자동 채번: <span className="font-mono text-sky-300">{nextNo}</span></span>
          <button
            type="button"
            onClick={() => { setEditingWo(null); setShowIssueForm(false); }}
            className="inline-flex w-7 h-7 p-0 items-center justify-center rounded-md border border-slate-600 bg-slate-800 text-lg leading-none text-slate-300 hover:bg-slate-700 hover:text-white"
            aria-label="작업지시 발행 화면 닫기"
            title="닫기"
          >
            ×
          </button>
        </div>
      }>
        <div className="qmes-wo-form-grid">
          <div className="qmes-wo-form-field">
            {label("작업구분")}
            <select
              value={form.workType}
              onChange={(e) => {
                const nextType = e.target.value;
                const nextProduct = products.find((name) => BOM[name].workType === nextType);
                setForm({ ...form, workType:nextType, product:nextProduct, tank:BOM[nextProduct].tanks[0], qty:"" });
                setPlanItems(blankPlanItems(nextProduct));
                setPackRows([blankPackRow()]);
              }}
              className={inputCls}
            >
              {WORK_TYPE_OPTIONS.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="qmes-wo-form-field">
            {label("공정 / 품목 (Grd.)")}
            <select value={form.product} onChange={(e) => { const next = e.target.value; setForm({ ...form, product: next, workType:BOM[next].workType, tank: BOM[next].tanks[0], qty: "" }); setPlanItems(blankPlanItems(next)); setPackRows([blankPackRow()]); }} className={inputCls}>
              {productOptions.map((pd) => (
                <option key={pd} value={pd}>
                  {BOM[pd]?.workType === "완제품" ? pd : `[${BOM[pd]?.workType || "기존"}] ${pd}`}
                </option>
              ))}
            </select>
          </div>
          <div className="qmes-wo-form-field">
            {label("설비명")}
            <select value={form.tank} onChange={(e) => setForm({ ...form, tank: e.target.value })} className={inputCls}>
              {bom.tanks.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="qmes-wo-form-field">
            {label("생산일자")}
            <input
              type="date"
              value={form.prodDate}
              onChange={(e) => setForm({ ...form, prodDate: e.target.value, lotNo: editingWo ? form.lotNo : "" })}
              className={inputCls}
            />
          </div>
          <div className="qmes-wo-form-field">
            {label("LOT No.")}
            <input
              value={form.lotNo || nextNo}
              onChange={(e) => setForm({ ...form, lotNo: e.target.value.toUpperCase().replace(/\s/g, "") })}
              placeholder="LOT No."
              readOnly={!!editingWo}
              className={`${inputCls} font-mono ${editingWo ? "bg-slate-800/60 text-slate-400 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="qmes-wo-form-field">
            {label("생산구분")}
            <select value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value, lotNo: editingWo ? form.lotNo : "" })} className={inputCls}>
              <option value="C">C — Pilot</option>
              <option value="D">D — 양산</option>
              <option value="B">B — Lab</option>
            </select>
          </div>
          <div className="qmes-wo-form-field">
            {label("생산계획량 (kg)")}
            <input
              type="text"
              value={qtyNum > 0 ? qtyNum.toFixed(3) : ""}
              readOnly
              placeholder="원료 계획량 합계"
              className={`${inputCls} bg-slate-800/60 text-sky-300 font-semibold cursor-not-allowed`}
            />
          </div>
          <div className="qmes-wo-form-field">
            {label("작업시간")}
            <input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="예: 7h" className={inputCls} />
          </div>
          <div className="qmes-wo-form-field">
            {label("생산시간")}
            <input value={form.timeRange} onChange={(e) => setForm({ ...form, timeRange: e.target.value })} placeholder="예: 08:30~16:30" className={inputCls} />
          </div>
          <div className="qmes-wo-form-field">
            {label("근무유형")}
            <select value={form.shiftType} onChange={(e) => setForm({ ...form, shiftType: e.target.value })} className={inputCls}>
              <option>일반</option><option>잔업</option><option>특근</option>
            </select>
          </div>
          <div className="qmes-wo-form-field">
            {label("작업자")}
            <input value={form.worker} onChange={(e) => setForm({ ...form, worker: e.target.value })} className={inputCls} />
          </div>
        </div>

        {/* 원재료 투입 계획 — LOT·신규/잔량·잔량까지 작업지시에서 일괄 관리 */}
        <div className="mt-4 bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
          <div className="text-xs font-medium text-slate-300 mb-2">
            ① 원재료 투입 계획 <span className="text-slate-500">(계획량 합계 → 생산계획량 자동 계산 · 실투입량 입력 시 잔량·오차·투입비율 자동 계산)</span>
              <span className="ml-2 text-[10px] text-slate-500">오차 기준: ±0.5% 이내 정상 · ±1.0% 이내 주의 · 초과 이탈</span>
          </div>
          <div className="overflow-x-auto">
            <table className="qmes-material-table qmes-material-balanced qmes-wo-material-compact w-full text-sm min-w-[1400px]">
              <colgroup>
                <col style={{ width: "52px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "145px" }} />
                <col style={{ width: "95px" }} />
                <col style={{ width: "125px" }} />
                <col style={{ width: "135px" }} />
                <col style={{ width: "115px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "185px" }} />
              </colgroup>
              <thead>
                <tr className="text-[11px] text-slate-500 border-b border-slate-700/60">
                  <th className="text-left py-1.5 pr-3 font-medium w-14">순서</th>
                  <th className="text-left py-1.5 pr-3 font-medium">원재료명</th>
                  <th className="text-left py-1.5 px-2 font-medium">LOT No.</th>
                  <th className="text-center py-1.5 px-2 font-medium">투입상태</th>
                  <th className="text-center py-1.5 px-2 font-medium">계획량</th>
                  <th className="text-center py-1.5 px-2 font-medium">실투입량</th>
                  <th className="text-center py-1.5 px-2 font-medium">사용 후 잔량</th>
                  <th className="text-center py-1.5 pr-3 font-medium">오차(%)</th>
                  <th className="text-center py-1.5 pr-3 font-medium">투입비율</th>
                  <th className="text-left py-1.5 font-medium">비고</th>
                </tr>
              </thead>
              <tbody>
                {planItems.map((it, idx) => {
                  const materialType = qmesMaterialType(it.name);
                  const isIntermediateMaterial = materialType === "중간재";
                  const remaining = qmesInputRemainingQty(it);
                  return (
                  <tr key={`${idx}-${it.name}`} className="border-b border-slate-800/60 align-top">
                    <td className="py-1.5 pr-3 text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="py-1.5 pr-3">
                      <select value={it.name} onChange={(e) => setPlanItems(planItems.map((row, i) => i === idx ? {
                        ...row, name: e.target.value, materialLot: "", containerNo: "", availableQty: "", inputStatus: "신규"
                      } : row))} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
                        {it.name === "중간배치(바인더)" && (
                          <option value="중간배치(바인더)" disabled>중간배치 원료명 선택 필요</option>
                        )}
                        {availableMaterialOptions.map((name) => (
                          <option key={name} disabled={name === "중간배치 선택"}>{name}</option>
                        ))}
                      </select>
                      <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] ${isIntermediateMaterial ? "bg-violet-500/15 text-violet-300" : "bg-slate-700/70 text-slate-400"}`}>
                        {materialType}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        value={it.materialLot || ""}
                        onChange={(e) => {
                          const lot = e.target.value.toUpperCase();
                          const remainder = Object.values(DB.materialRemainders || {}).find((record) =>
                            record.lot === lot && record.name === it.name && Number(record.remainingQty || 0) > 0
                          );
                          setPlanItems(planItems.map((row, i) => i === idx ? {
                            ...row, materialLot: lot,
                            availableQty: remainder?.remainingQty ?? row.availableQty,
                            inputStatus: remainder ? "잔량" : row.inputStatus
                          } : row));
                        }}
                        placeholder="원재료 LOT"
                        className="w-full h-[34px] bg-slate-800 border border-slate-700 rounded px-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      />
                      {Number(qmesInputAvailableQty(it)) > 0 && <div className="mt-1 text-[10px] text-slate-500">가용 {Number(qmesInputAvailableQty(it)).toFixed(3)}kg</div>}
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={it.inputStatus || "신규"}
                        onChange={(e) => setPlanItems(planItems.map((row, i) => i === idx ? { ...row, inputStatus:e.target.value } : row))}
                        className={`w-full h-[34px] rounded border px-2 text-xs font-medium focus:outline-none focus:border-sky-500 ${it.inputStatus === "잔량" ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-slate-700 bg-slate-800 text-slate-200"}`}
                      >
                        <option value="신규">신규</option>
                        <option value="잔량">잔량</option>
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="qmes-qty-wrap">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={it.plan ?? ""}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, "");
                            setPlanItems(planItems.map((row, i) => i === idx ? { ...row, plan: v } : row));
                          }}
                          className="qmes-qty-input bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-right text-sm text-sky-300 font-medium focus:outline-none focus:border-sky-500"
                        />
                        <span className="qmes-qty-unit text-xs text-slate-400">{it.unit}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="qmes-qty-wrap">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={it.actual ?? ""}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, "");
                            setPlanItems(planItems.map((row, i) => i === idx ? { ...row, actual: v } : row));
                          }}
                          placeholder="실투입"
                          className="qmes-qty-input bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-right text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                        />
                        <span className="qmes-qty-unit text-xs text-slate-400">{it.unit}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {remaining == null
                        ? <span className="text-slate-500">—</span>
                        : <span className={remaining > 0 ? "text-amber-300" : "text-slate-400"}>{remaining.toFixed(3)} kg</span>}
                    </td>
                    <td className="py-1.5 pr-3 text-center tabular-nums">
                      {(() => {
                        const planned = Number(it.plan) || 0;
                        const actual = parseFloat(it.actual);
                        if (!(planned > 0) || Number.isNaN(actual)) return <span className="text-slate-500">—</span>;
                        const err = (actual - planned) / planned * 100;
                        const absErr = Math.abs(err);
                        const tone = absErr <= 0.5
                          ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                          : absErr <= 1
                            ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                            : "text-red-300 bg-red-500/10 border-red-500/30";
                        const sign = err > 0 ? "+" : "";
                        return <span className={`inline-flex min-w-[66px] justify-center rounded border px-2 py-1 text-xs font-medium ${tone}`}>{sign}{err.toFixed(2)}%</span>;
                      })()}
                    </td>
                    <td className="py-1.5 pr-3 text-center tabular-nums">
                      {(() => {
                        const planned = Number(it.plan) || 0;
                        const actual = parseFloat(it.actual);
                        if (!(planned > 0) || Number.isNaN(actual)) return <span className="text-slate-500">—</span>;
                        const pct = actual / planned * 100;
                        const tone = Math.abs(pct - 100) <= 0.5
                          ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                          : Math.abs(pct - 100) <= 1
                            ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                            : "text-red-300 bg-red-500/10 border-red-500/30";
                        return <span className={`inline-flex min-w-[66px] justify-center rounded border px-2 py-1 text-xs font-medium ${tone}`}>{pct.toFixed(2)}%</span>;
                      })()}
                    </td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-2">
                        <input value={it.note} onChange={(e) => setPlanItems(planItems.map((row, i) => i === idx ? { ...row, note: e.target.value } : row))} placeholder="비고" className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500" />
                        <button onClick={() => setPlanItems(planItems.filter((_, i) => i !== idx))} className="text-[11px] text-red-300 border border-red-500/30 rounded px-2 py-1.5 hover:bg-red-500/10">삭제</button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                <tr>
                  <td className="py-1.5 pr-3" />
                  <td className="py-1.5 pr-3 font-medium text-slate-200">계</td>
                  <td className="py-1.5 px-2" />
                  <td className="py-1.5 px-2" />
                  <td className="py-1.5 pr-3 text-right tabular-nums font-medium text-sky-300">{planItems.some((it) => String(it.plan ?? "").trim() !== "") ? `${plannedTotal.toFixed(3)} kg` : ""}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums font-medium text-emerald-300">
                    {planItems.some((it) => String(it.actual ?? "").trim() !== "") ? `${planItems.reduce((a, it) => a + (parseFloat(it.actual) || 0), 0).toFixed(3)} kg` : ""}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums font-medium text-amber-300">
                    {planItems.some((it) => qmesInputRemainingQty(it) != null) ? `${planItems.reduce((sum, it) => sum + (qmesInputRemainingQty(it) || 0), 0).toFixed(3)} kg` : ""}
                  </td>
                  <td className="py-1.5 pr-3 text-center tabular-nums">
                    {(() => {
                      const plannedTotal = planItems.reduce((a, it) => a + (Number(it.plan) || 0), 0);
                      const actualTotal = planItems.reduce((a, it) => a + (parseFloat(it.actual) || 0), 0);
                      if (!(plannedTotal > 0) || !(actualTotal > 0)) return <span className="text-slate-500">—</span>;
                      const err = (actualTotal - plannedTotal) / plannedTotal * 100;
                      const sign = err > 0 ? "+" : "";
                      const tone = Math.abs(err) <= 0.5 ? "text-emerald-300" : Math.abs(err) <= 1 ? "text-amber-300" : "text-red-300";
                      return <span className={tone}>{sign}{err.toFixed(2)}%</span>;
                    })()}
                  </td>
                  <td className="py-1.5 pr-3 text-center tabular-nums">
                    {(() => {
                      const plannedTotal = planItems.reduce((a, it) => a + (Number(it.plan) || 0), 0);
                      const actualTotal = planItems.reduce((a, it) => a + (parseFloat(it.actual) || 0), 0);
                      return plannedTotal > 0 && actualTotal > 0
                        ? <span className="text-slate-300">{(actualTotal / plannedTotal * 100).toFixed(2)}%</span>
                        : <span className="text-slate-500">—</span>;
                    })()}
                  </td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => setPlanItems([...planItems, {
                      seq:planItems.length + 1, name:availableMaterialOptions[0], materialLot:"", containerNo:"",
                      inputStatus:"신규", availableQty:"", base:"", plan:"", actual:"", remaining:null, unit:"kg", note:""
                    }])} className="inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-500/20"><Plus size={13} /> 행 추가</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {isBinderWorkOrder && (
          <div className="mt-4 bg-violet-500/5 border border-violet-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs font-medium text-violet-200">
                ② 바인더 솔루션 포장정보
                <span className="ml-2 text-[10px] text-slate-500">중간재 LOT는 작업지시 LOT로 자동 연결됩니다.</span>
              </div>
              <button onClick={() => setPackRows([...packRows, blankPackRow()])} className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20">
                <Plus size={13} /> 포장 추가
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-500 border-b border-slate-700/60">
                    <th className="py-1.5 px-2 text-center">No</th>
                    <th className="py-1.5 px-2 text-left">포장번호(선택)</th>
                    <th className="py-1.5 px-2 text-right">포장중량</th>
                    <th className="py-1.5 px-2 text-center">포장일자</th>
                    <th className="py-1.5 px-2 text-left">보관위치</th>
                    <th className="py-1.5 px-2 text-center">상태</th>
                    <th className="py-1.5 px-2 text-right">현재 잔량</th>
                    <th className="py-1.5 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {packRows.map((row, index) => (
                    <tr key={`pack-${index}`} className="border-b border-slate-800/60">
                      <td className="py-1.5 px-2 text-center text-slate-500">{index + 1}</td>
                      <td className="py-1.5 px-2"><input value={row.containerNo} onChange={(e) => setPackRows(packRows.map((item, i) => i === index ? { ...item, containerNo:e.target.value.toUpperCase() } : item))} placeholder="미입력 시 자동 채번" className="w-full h-[34px] bg-slate-800 border border-slate-700 rounded px-2 font-mono text-xs text-slate-100 focus:outline-none focus:border-violet-500" /></td>
                      <td className="py-1.5 px-2">
                        <div className="qmes-qty-wrap">
                          <input inputMode="decimal" value={row.packWeight} onChange={(e) => setPackRows(packRows.map((item, i) => i === index ? { ...item, packWeight:e.target.value.replace(/[^0-9.]/g, "") } : item))} className="qmes-qty-input bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-right text-sm text-violet-200 focus:outline-none focus:border-violet-500" />
                          <span className="qmes-qty-unit text-xs text-slate-400">kg</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2"><input type="date" value={row.packDate || form.prodDate} onChange={(e) => setPackRows(packRows.map((item, i) => i === index ? { ...item, packDate:e.target.value } : item))} className="w-full h-[34px] bg-slate-800 border border-slate-700 rounded px-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500" /></td>
                      <td className="py-1.5 px-2"><input value={row.storageLocation} onChange={(e) => setPackRows(packRows.map((item, i) => i === index ? { ...item, storageLocation:e.target.value } : item))} placeholder="예: 중간재 Rack A-01" className="w-full h-[34px] bg-slate-800 border border-slate-700 rounded px-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500" /></td>
                      <td className="py-1.5 px-2">
                        <select value={row.status || "포장계획"} onChange={(e) => setPackRows(packRows.map((item, i) => i === index ? { ...item, status:e.target.value } : item))} className="w-full h-[34px] bg-slate-800 border border-slate-700 rounded px-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500">
                          <option>포장계획</option><option>포장완료</option><option>사용가능</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-violet-200">{Number(row.packWeight || 0).toFixed(3)} kg</td>
                      <td className="py-1.5 px-2 text-right"><button onClick={() => setPackRows(packRows.filter((_, i) => i !== index))} className="text-[11px] text-red-300 border border-red-500/30 rounded px-2 py-1.5 hover:bg-red-500/10">삭제</button></td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <td></td><td className="py-2 px-2 text-slate-200">포장 합계</td>
                    <td className="py-2 px-2 text-right tabular-nums text-violet-200">{packRows.reduce((sum, row) => sum + Number(row.packWeight || 0), 0).toFixed(3)} kg</td>
                    <td colSpan={5}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] text-slate-500">발행 시 실제 양식의 가 생성되며, [] 화면에서 LOT별로 조회하고 인쇄할 수 있습니다.</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditingWo(null); setShowIssueForm(false); }}
              className="qmes-inspection-cancel-btn">
              취소
            </button>
            <button type="button" onClick={issue} className="qmes-inspection-save-btn">
              저장
            </button>
          </div>
        </div>
      </Panel>
      </div>
      )}

      {!showIssueForm && (
      <Panel title="발행 내역" right={<span className="text-xs text-slate-400">{filteredIssued.length}건</span>}>
        <div className="qmes-status-guide">
          <span><i className="status-dot issue"></i>발행</span>
          <span><i className="status-dot production"></i>생산중</span>
          <span><i className="status-dot inspection"></i>검사중</span>
          <span><i className="status-dot complete"></i>완료</span>
          <em>자동 표시되며 필요 시 직접 선택 가능</em>
        </div>
        <div className="qmes-issued-filter">
          <div>
            <span>LOT No.</span>
            <input value={issueSearch.lot} onChange={(e) => { setIssueSearch({ ...issueSearch, lot: e.target.value }); setIssuePage(1); }} placeholder="LOT 검색" />
          </div>
          <div>
            <span>품목</span>
            <input value={issueSearch.item} onChange={(e) => { setIssueSearch({ ...issueSearch, item: e.target.value }); setIssuePage(1); }} placeholder="품목 검색" />
          </div>
          <div>
            <span>생산일자</span>
            <input type="date" value={issueSearch.date} onChange={(e) => { setIssueSearch({ ...issueSearch, date: e.target.value }); setIssuePage(1); }} />
          </div>
          <button onClick={() => { setIssueSearch({ lot: "", item: "", date: "" }); setIssuePage(1); }}>초기화</button>
        </div>

        <div className="qmes-issued-table-wrap">
          <table className="qmes-issued-table-v2 w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th>LOT No.</th>
                <th>품목</th>
                <th>설비</th>
                <th className="num">계획량</th>
                <th className="num">실투입량</th>
                <th className="center">생산일자</th>
                <th className="center">생산시간</th>
                <th className="center">근무유형</th>
                <th>작업자</th>
                <th className="center">상태</th>
                <th className="center">관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedIssued.map((r) => {
                const doc = DB.woDocs[r.no] || {};
                const inputActualTotal = (doc.inputs || []).reduce((sum, it) => sum + (Number(it.act) || 0), 0);
                const actualTotal = Number(doc.productionActual ?? (inputActualTotal > 0 ? inputActualTotal : r.done) ?? 0);
                const prodTime = doc.timeRange || (r.shift ? String(r.shift).split(" · ")[1] : "-");
                const shiftType = doc.shiftType || (r.shift ? String(r.shift).split(" · ")[0] : "-");
                return (
                  <tr key={r.no} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="font-mono whitespace-nowrap">
                      <button onClick={() => openWorkOrderPreview(r.no, "detail")} className="text-sky-300 hover:text-sky-200 hover:underline">{r.no}</button>
                    </td>
                    <td className="truncate" title={r.item}>
                      <button onClick={() => openWorkOrderPreview(r.no, "detail")} className="text-slate-100 hover:text-white hover:underline text-left">{r.item}</button>
                    </td>
                    <td className="truncate text-slate-400" title={r.tank}>{r.tank}</td>
                    <td className="num text-slate-100">{Number(r.plan || 0).toLocaleString()} kg</td>
                    <td className="num text-emerald-300">{actualTotal > 0 ? `${actualTotal.toFixed(3)} kg` : "—"}</td>
                    <td className="center text-slate-300 whitespace-nowrap">{r.due || "-"}</td>
                    <td className="center text-slate-400 whitespace-nowrap">{prodTime || "-"}</td>
                    <td className="center text-slate-300 whitespace-nowrap">{shiftType || "-"}</td>
                    <td className="truncate text-slate-300" title={doc.workers || r.worker || ""}>{doc.workers || r.worker || "-"}</td>
                    <td className="center whitespace-nowrap">
                      <select
                        value={getAutoWoStatus(r.no)}
                        onChange={(e) => {
                          saveWoManualStatus(r.no, e.target.value);
                          setStatusVersion((v) => v + 1);
                        }}
                        className={`qmes-status-select status-${getAutoWoStatus(r.no)}`}
                        title="상태 직접 변경"
                      >
                        <option value="발행">발행</option>
                        <option value="생산중">생산중</option>
                        <option value="검사중">검사중</option>
                        <option value="완료">완료</option>
                      </select>
                    </td>
                    <td className="center whitespace-nowrap">
                      <button onClick={() => openWorkOrderPreview(r.no, "detail")} className="qmes-manage-btn view">미리보기</button>
                      <button onClick={() => openWorkOrderPreview(r.no, "print")} className="qmes-manage-btn print">출력</button>
                      <button onClick={() => editWo(r)} className="qmes-manage-btn edit">수정</button>
                      <button onClick={() => deleteWo(r)} className="qmes-manage-btn delete">삭제</button>
                    </td>
                  </tr>
                );
              })}
              {filteredIssued.length === 0 && (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-500">검색 조건에 맞는 발행 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredIssued.length > issuePageSize && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button onClick={() => setIssuePage((p) => Math.max(1, p - 1))}
              disabled={safeIssuePage === 1}
              className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 disabled:opacity-40">이전</button>
            <span className="text-xs text-slate-400">{safeIssuePage} / {issuePageCount}</span>
            <button onClick={() => setIssuePage((p) => Math.min(issuePageCount, p + 1))}
              disabled={safeIssuePage === issuePageCount}
              className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 disabled:opacity-40">다음</button>
          </div>
        )}
      </Panel>
      )}

      {viewingWo && (() => {
        const batch = issued.find((r) => r.no === viewingWo) || DB.batches.find((r) => r.no === viewingWo);
        const doc = DB.woDocs[viewingWo] || {};
        if (!batch) return null;

        const inputs = doc.inputs || [];
        const plannedTotal = inputs.reduce((sum, it) => sum + Number(it.plan ?? it.std ?? 0), 0);
        const actualTotal = inputs.reduce((sum, it) => sum + (Number(it.act) || 0), 0);

        return (
          <div className="qmes-modal-backdrop" onClick={() => setViewingWo(null)}>
            <div className={`qmes-wo-viewer ${woPreviewMode === "detail" ? "qmes-wo-detail-preview" : "qmes-wo-output-preview"}`} onClick={(e) => e.stopPropagation()}>
              <div className="qmes-wo-viewer-head">
                <div style={{ transform: "translateX(20px)" }}>
                  <div className="text-sm font-semibold text-slate-100">작업지시서 미리보기</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    작업지시번호 : <span className="font-mono">{doc.woNo || viewingWo || "-"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2" style={{ transform: "translateX(-20px)" }}>
                  {woPreviewMode === "print" && (
                    <button onClick={() => printIssuedWorkOrder(viewingWo)}
                      className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs text-white inline-flex items-center gap-1.5">
                      <Printer size={13} /> 인쇄
                    </button>
                  )}
                  <button onClick={() => setViewingWo(null)} className="qmes-modal-close">×</button>
                </div>
              </div>

              <div id={`qmes-issued-cert-${viewingWo}`} className={`doc-paper qmes-iqc-doc qmes-wo-cert qmes-issued-preview-cert ${woPreviewMode === "detail" ? "qmes-issued-print-only" : ""} bg-white max-w-4xl mx-auto mt-4 p-6 rounded text-stone-900`}>
                <div className="qmes-iqc-centered-header qmes-wo-header border-b-2 border-slate-900 pb-4">
          <div className="qmes-iqc-header-logo-wrap qmes-wo-header-logo-wrap">
            <img className="qmes-iqc-header-logo qmes-wo-header-logo" src="data:image/png;base64,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" alt="나모케미칼(주) 로고" />
          </div>
          <div className="qmes-iqc-centered-title">
            <div className="text-xl font-bold tracking-wide">작업지시서</div>
            <div className="text-xs text-slate-500 mt-0.5">WORK ORDER</div>
          </div>
          <div className="qmes-iqc-header-meta text-right text-xs text-slate-600">
            <div>작업지시번호 : <span className="qmes-wo-number-match">{doc.woNo || viewingWo || "-"}</span></div>
            <div>생산일자 : {doc.date || batch.due || "-"}</div>
          </div>
        </div>

                <div className="qmes-iqc2-sec qmes-iqc2-first">
                  <div className="qmes-iqc2-sec-title">기본정보</div>
                  <table className="qmes-iqc2-table qmes-wo-basic-info-table">
                    <thead><tr><th>LOT No.</th><th>제품명</th><th>설비명</th><th>작업자</th></tr></thead>
                    <tbody><tr>
                      <td>{viewingWo || "-"}</td>
                      <td>{doc.item || batch.item || "-"}</td>
                      <td>{doc.tank || batch.tank || "-"}</td>
                      <td>{doc.workers || batch.worker || "-"}</td>
                    </tr></tbody>
                  </table>
                </div>

                <div className="qmes-iqc2-sec">
                  <div className="qmes-iqc2-sec-title">생산정보</div>
                  <table className="qmes-iqc2-table">
                    <thead><tr><th>작업구분</th><th>공정명</th><th>생산계획량</th><th>작업시간</th><th>생산시간</th><th>근무유형</th></tr></thead>
                    <tbody><tr>
                      <td>{doc.workType || batch.workType || "완제품"}</td>
                      <td>{doc.procName || "절연슬러리 제조"}</td>
                      <td>{Number(doc.plan ?? batch.plan ?? 0).toLocaleString()} kg</td>
                      <td>{doc.hours || "-"}</td>
                      <td>{doc.timeRange || "-"}</td>
                      <td>{doc.shiftType || batch.shift || "일반"}</td>
                    </tr></tbody>
                  </table>
                </div>

                <div className="qmes-iqc2-sec">
                  <div className="qmes-iqc2-sec-title">원재료 투입</div>
                  <table className="qmes-iqc2-table qmes-wo-cert-material-table">
                    <thead><tr><th>No</th><th>원재료명</th><th>원재료 LOT</th><th>상태</th><th>계획량</th><th>실투입량</th><th>사용 후 잔량</th><th>판정</th><th>비고</th></tr></thead>
                    <tbody>
                      {inputs.map((it, i) => (
                        <tr key={`issued-cert-${viewingWo}-${i}`}>
                          <td>{it.seq || i + 1}</td>
                          <td>{it.name || "-"}</td>
                          <td className="font-mono">{it.materialLot || it.lot || "-"}</td>
                          <td>{it.inputStatus || "신규"}</td>
                          <td>{Number(it.plan ?? it.std ?? 0).toFixed(3)} {it.unit || "kg"}</td>
                          <td>{it.act == null ? "-" : `${Number(it.act).toFixed(3)} ${it.unit || "kg"}`}</td>
                          <td>{it.remaining == null ? "-" : `${Number(it.remaining).toFixed(3)} ${it.unit || "kg"}`}</td>
                          <td>{it.ok === true ? "적합" : it.ok === false ? "공차 이탈" : "-"}</td>
                          <td>{it.note || "-"}</td>
                        </tr>
                      ))}
                      <tr className="qmes-wo-cert-total-row">
                        <td></td><td className="font-semibold">합계</td><td></td><td></td>
                        <td className="font-semibold">{plannedTotal.toFixed(3)} kg</td>
                        <td className="font-semibold">{actualTotal > 0 ? `${actualTotal.toFixed(3)} kg` : "-"}</td>
                        <td className="font-semibold">{inputs.some((it) => it.remaining != null) ? `${inputs.reduce((sum, it) => sum + Number(it.remaining || 0), 0).toFixed(3)} kg` : "-"}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {(doc.packaging || []).length > 0 && (
                  <div className="qmes-iqc2-sec">
                    <div className="qmes-iqc2-sec-title">중간재 포장정보</div>
                    <table className="qmes-iqc2-table">
                      <thead><tr><th>No</th><th>중간재 LOT</th><th>포장번호</th><th>포장중량</th><th>포장일자</th><th>보관위치</th><th>현재 잔량</th><th>상태</th></tr></thead>
                      <tbody>
                        {doc.packaging.map((row, index) => {
                          const current = DB.intermediateContainers?.[row.containerNo] || row;
                          return <tr key={`issued-pack-${row.containerNo || index}`}>
                            <td>{index + 1}</td><td className="font-mono">{viewingWo}</td><td className="font-mono">{row.containerNo}</td>
                            <td>{Number(row.packWeight || 0).toFixed(3)} kg</td><td>{row.packDate || "-"}</td>
                            <td>{row.storageLocation || "-"}</td><td>{Number(current.remainingQty || 0).toFixed(3)} kg</td><td>{current.status || row.status || "-"}</td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="qmes-iqc2-sec">
                  <div className="qmes-iqc2-sec-title">특이사항</div>
                  <div className="qmes-iqc2-remarks">{doc.remarks || "-"}</div>
                </div>

                <div className="qmes-iqc2-auth-row">
                  <div className="qmes-iqc2-code-box"><IqcBarcodeQr record={{ inNo: doc.woNo || viewingWo, lot: viewingWo, name: doc.item || batch.item, supplier: doc.tank || batch.tank, recv: doc.date || batch.due }} /></div>
                  <table className="qmes-iqc2-sign-table"><tbody>
                    <tr><th>작성</th><th>검토</th><th>승인</th></tr>
                    <tr><td>{(doc.workers || batch.worker || "").split(",")[0]}</td><td></td><td></td></tr>
                  </tbody></table>
                </div>
                <div className="qmes-iqc2-doc-footer">본 문서는 QMES에서 발행된 관리문서입니다.</div>
              </div>

              <div className="qmes-wo-summary qmes-issued-extra-summary qmes-detail-only">
                <div><span>품목</span><strong>{batch.item}</strong></div>
                <div><span>작업구분</span><strong>{doc.workType || batch.workType || "완제품"}</strong></div>
                <div><span>설비</span><strong>{batch.tank}</strong></div>
                <div><span>생산일자</span><strong>{batch.due}</strong></div>
                <div><span>계획량</span><strong>{Number(batch.plan || 0).toLocaleString()} kg</strong></div>
                <div><span>근무유형</span><strong>{doc.shiftType || batch.shift || "-"}</strong></div>
                <div><span>생산시간</span><strong>{doc.timeRange || "-"}</strong></div>
                <div><span>작업시간</span><strong>{doc.hours || "-"}</strong></div>
                <div><span>작업자</span><strong>{doc.workers || batch.worker || "-"}</strong></div>
                <div><span>상태</span><strong>{getAutoWoStatus(viewingWo)}</strong></div>
              </div>

              <div className="mt-4 qmes-detail-only">
                <div className="text-sm font-semibold text-slate-200 mb-2">원재료 투입 계획</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1160px]">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-700">
                        <th className="text-center py-2 px-2">순서</th>
                        <th className="text-left py-2 px-2">원재료명</th>
                        <th className="text-left py-2 px-2">LOT No.</th>
                        <th className="text-center py-2 px-2">투입상태</th>
                        <th className="text-right py-2 px-2">계획량</th>
                        <th className="text-right py-2 px-2">실투입량</th>
                        <th className="text-right py-2 px-2">사용 후 잔량</th>
                        <th className="text-center py-2 px-2">오차</th>
                        <th className="text-center py-2 px-2">투입비율</th>
                        <th className="text-left py-2 px-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inputs.map((it, i) => (
                        <tr key={`${viewingWo}-${i}`} className="border-b border-slate-800/70">
                          <td className="text-center py-2 px-2 text-slate-400">{it.seq || i + 1}</td>
                          <td className="py-2 px-2 text-slate-100">{it.name}</td>
                          <td className="py-2 px-2 font-mono text-xs text-slate-300">{it.materialLot || it.lot || "-"}</td>
                          <td className="text-center py-2 px-2">{it.inputStatus || "신규"}</td>
                          <td className="text-right py-2 px-2 tabular-nums text-sky-300">{Number(it.plan ?? it.std ?? 0).toFixed(3)} {it.unit || "kg"}</td>
                          <td className="text-right py-2 px-2 tabular-nums text-emerald-300">{it.act == null ? "—" : `${Number(it.act).toFixed(3)} ${it.unit || "kg"}`}</td>
                          <td className="text-right py-2 px-2 tabular-nums text-amber-300">{it.remaining == null ? "—" : `${Number(it.remaining).toFixed(3)} ${it.unit || "kg"}`}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{it.error == null ? "—" : `${it.error > 0 ? "+" : ""}${Number(it.error).toFixed(2)}%`}</td>
                          <td className="text-center py-2 px-2 tabular-nums">{it.ratio == null ? "—" : `${Number(it.ratio).toFixed(2)}%`}</td>
                          <td className="py-2 px-2 text-xs text-slate-400">{it.note || "-"}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-800/40 font-medium">
                        <td className="py-2 px-2" />
                        <td className="py-2 px-2 text-slate-200">합계</td>
                        <td className="py-2 px-2" />
                        <td className="py-2 px-2" />
                        <td className="text-right py-2 px-2 text-sky-300">{plannedTotal.toFixed(3)} kg</td>
                        <td className="text-right py-2 px-2 text-emerald-300">{actualTotal > 0 ? `${actualTotal.toFixed(3)} kg` : "—"}</td>
                        <td className="text-right py-2 px-2 text-amber-300">{inputs.some((it) => it.remaining != null) ? `${inputs.reduce((sum, it) => sum + Number(it.remaining || 0), 0).toFixed(3)} kg` : "—"}</td>
                        <td className="text-center py-2 px-2">
                          {plannedTotal > 0 && actualTotal > 0 ? `${(((actualTotal - plannedTotal) / plannedTotal) * 100).toFixed(2)}%` : "—"}
                        </td>
                        <td className="text-center py-2 px-2">
                          {plannedTotal > 0 && actualTotal > 0 ? `${((actualTotal / plannedTotal) * 100).toFixed(2)}%` : "—"}
                        </td>
                        <td className="py-2 px-2" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {(doc.packaging || []).length > 0 && (
                <div className="mt-4 qmes-detail-only">
                  <div className="text-sm font-semibold text-violet-200 mb-2">중간재 포장정보</div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead><tr className="text-xs text-slate-400 border-b border-slate-700"><th className="py-2 px-2">중간재 LOT</th><th className="py-2 px-2">포장번호</th><th className="py-2 px-2 text-right">포장중량</th><th className="py-2 px-2">포장일자</th><th className="py-2 px-2">보관위치</th><th className="py-2 px-2 text-right">현재 잔량</th><th className="py-2 px-2">상태</th></tr></thead>
                      <tbody>{doc.packaging.map((row, index) => {
                        const current = DB.intermediateContainers?.[row.containerNo] || row;
                        return <tr key={`detail-pack-${row.containerNo || index}`} className="border-b border-slate-800/70">
                          <td className="py-2 px-2 font-mono text-slate-300">{viewingWo}</td><td className="py-2 px-2 font-mono text-violet-200">{row.containerNo}</td>
                          <td className="py-2 px-2 text-right">{Number(row.packWeight || 0).toFixed(3)} kg</td><td className="py-2 px-2">{row.packDate || "-"}</td>
                          <td className="py-2 px-2">{row.storageLocation || "-"}</td><td className="py-2 px-2 text-right text-amber-300">{Number(current.remainingQty || 0).toFixed(3)} kg</td><td className="py-2 px-2">{current.status || row.status || "-"}</td>
                        </tr>;
                      })}</tbody>
                    </table>
                  </div>
                </div>
              )}


              {woPreviewMode === "detail" && (
                <div className="qmes-wo-detail-footer">
                  <button onClick={() => setViewingWo(null)} className="qmes-wo-footer-close">닫기</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ──────────────────────────── 공정검사(PQC) · 출하검사(OQC) 분리 ──────────────────────────── */


function FieldInputTab() {
  const [lot, setLot] = useState("");
  const [check, setCheck] = useState("점도");
  const [value, setValue] = useState("");
  const [visualOk, setVisualOk] = useState(null);
  const [entries, setEntries] = useState(DB.popEntries);
  const [seq, setSeq] = useState(DB.seqs.POP || 1);
  const [tried, setTried] = useState(false);
  const [editingPop, setEditingPop] = useState(null);

  const spec = QC_ITEMS[check];
  const isVisual = spec.lo == null && spec.hi == null;
  const trimmed = value.trim();
  const lotFormatOk = /^[A-D][A-Z][A-L]\d{4}$/.test(lot.trim());

  let inputError = null;
  if (!isVisual && trimmed !== "") {
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      inputError = "숫자만 입력할 수 있습니다 — 문자·기호 포함 시 저장이 금지됩니다";
    } else {
      const num = parseFloat(trimmed);
      const lo = spec.lo, hi = spec.hi;
      const span = lo != null && hi != null ? hi - lo : (hi ?? lo);
      const min = lo != null ? Math.max(0, lo - span) : 0;
      const max = hi != null ? hi + span * 2 : lo * 10;
      if (!(num > min && num < max)) {
        inputError = `입력값 ${trimmed}이(가) 통상 측정 범위를 벗어났습니다 — 오타(자릿수) 확인 후 재입력 전까지 진입 금지`;
      }
    }
  }

  const judged = isVisual
    ? (visualOk == null ? null : visualOk ? "합격" : "불합격")
    : (trimmed === "" || inputError ? null : autoJudge(check, trimmed));

  const triedErrors = [];
  if (tried && !lotFormatOk) triedErrors.push(lot.trim() === "" ? "배치 Lot 번호를 입력하세요 (예: CBG1001)" : "Lot 형식 오류 — 예: CBG1001");
  if (tried && !inputError && judged == null) triedErrors.push(isVisual ? "적합 / 부적합 중 하나를 선택하세요" : "측정값을 입력하세요");

  const save = () => {
    if (judged == null || inputError || !lotFormatOk) { setTried(true); return; }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const recId = editingPop || `POP-${String(seq).padStart(4, "0")}`;
    const lotNo = lot.trim();
    const display = isVisual ? (visualOk ? "적합" : "부적합") : trimmed;
    /* 공정검사 성적서 자동 기록 */
    const pqcRec = { id: recId, time, lot: lotNo, check, value: display, judge: judged, note: "현장 입력", inspector: window.__QMES_USER__ || "-" };
    DB.insp.PQC = editingPop ? DB.insp.PQC.map((r)=>r.id===recId?pqcRec:r) : [pqcRec, ...DB.insp.PQC];
    if (!editingPop) DB.seqs.POP = seq + 1;
    /* Lot 이력 자동 반영 */
    const L = DB.lots[lotNo];
    if (L) {
      L.steps = [...L.steps, { stage: "생산", name: `현장 검사 — ${check}`, time, detail: `측정값 ${display} · 규격 ${spec.spec}`, result: judged, by: window.__QMES_USER__ || "-" }];
      L.stage = "생산";
      if (judged === "불합격") L.status = "홀드 — 부적합 발생 (게이트 차단)";
      else if (!L.status.includes("홀드")) L.status = "생산중";
    }
    /* 불합격 → 자동 홀드 */
    if (judged === "불합격") {
      DB.holds = [{ id: `HLD-${String(Date.now()).slice(-6)}`, target: lotNo, type: "제품 Lot", gate: "공정 게이트", reason: `${check} ${display} — 규격(${spec.spec}) 부적합 (현장 입력)`, since: time, cond: "재검사 합격 + 품질부장 승인", status: "차단중", ncr: "-" }, ...DB.holds];
    }
    const entry = {
      id: recId, time, lot: lotNo, check, value: display, judge: judged,
      auto: judged === "합격" ? [`규격(${spec.spec}) 자동판정 → 합격`, `${recId} 공정검사 성적서 자동 기록`, L ? `Lot ${lotNo} 이력 반영 완료` : `Lot ${lotNo} 미등록 — 작업지시 발행 시 이력 연결`]
        : [`규격(${spec.spec}) 자동판정 → 불합격`, `${recId} 성적서 자동 기록`, `자동 홀드 생성 — 공정 게이트 차단`, `품질부 알람 · 격리 Rack 지정 대기`, `NCR 발행 대기 (8D 착수)`],
    };
    const nextEntries = editingPop ? entries.map((e)=>e.id===editingPop?entry:e) : [entry, ...entries];
    setEntries(nextEntries);
    DB.popEntries = nextEntries;
    auditLog("현장입력", editingPop ? "수정" : "등록", recId, `${lotNo} / ${check} / ${display} / ${judged}`);
    dbSave();
    if (!editingPop) setSeq(seq + 1);
    setEditingPop(null);
    setValue("");
    setVisualOk(null);
    setTried(false);
  };

  const editPop = (e) => { setEditingPop(e.id); setLot(e.lot); setCheck(e.check); const numeric=QC_ITEMS[e.check]?.lo!=null||QC_ITEMS[e.check]?.hi!=null; if(numeric){setValue(String(e.value));setVisualOk(null);}else{setValue("");setVisualOk(e.judge==="합격");} window.scrollTo({top:0,behavior:"smooth"}); };
  const deletePop = (e) => { const reason=askDeleteReason(`현장 입력 ${e.id}`); if(reason===null)return; const next=entries.filter(x=>x.id!==e.id); setEntries(next); DB.popEntries=next; DB.insp.PQC=DB.insp.PQC.filter(x=>x.id!==e.id); auditLog("현장입력","삭제",e.id,reason); dbSave(); };

  const bigBtn = (active) =>
    `rounded-xl border px-4 py-3.5 text-base font-medium transition-colors ${
      active ? "bg-sky-500/20 border-sky-500/60 text-sky-200" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
    }`;

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
        <Tablet size={18} className="text-sky-400" />
        <div>
          <div className="text-sm font-semibold text-slate-100">현장 검사 입력 (POP)</div>
          <div className="text-[11px] text-slate-500">측정값 입력 즉시 자동 판정·기록됩니다 — 판정을 직접 고를 수 없습니다 (데이터 무결성)</div>
        </div>
      </div>

      <Panel title="1. 배치 (Lot) 입력" right={<span className="text-xs text-slate-400">채번: 사이트·년·월·일·순번 (예: CBG1001)</span>}>
        <input value={lot} onChange={(e) => setLot(e.target.value.toUpperCase())}
          placeholder="배치 Lot 번호 입력 (바코드 스캔 대체)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-lg text-center font-mono text-slate-100 placeholder-slate-600 placeholder:text-sm focus:outline-none focus:border-sky-500" />
        {lot !== "" && !lotFormatOk && (
          <p className="text-xs text-red-300 mt-2">Lot 형식 오류 — 형식 불일치 시 저장(다음 단계) 진입 금지</p>
        )}
      </Panel>

      <Panel title="2. 검사 항목" right={<span className="text-xs text-slate-400">규격: <span className="text-sky-300">{spec.spec}</span> · {spec.method}</span>}>
        <div className="grid grid-cols-3 gap-2">
          {FIELD_ITEMS.map((k) => (
            <button key={k} onClick={() => { setCheck(k); setValue(""); setVisualOk(null); }} className={bigBtn(check === k)}>{k}</button>
          ))}
        </div>
      </Panel>

      <Panel title="3. 측정값 입력">
        {isVisual ? (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setVisualOk(true)}
              className={`rounded-xl border px-4 py-6 text-lg font-bold transition-colors ${visualOk === true ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}>
              적합 (이상 없음)
            </button>
            <button onClick={() => setVisualOk(false)}
              className={`rounded-xl border px-4 py-6 text-lg font-bold transition-colors ${visualOk === false ? "bg-red-500/20 border-red-500/60 text-red-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}>
              부적합 발견
            </button>
          </div>
        ) : (
          <input
            inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder={`측정값 입력 (${spec.spec})`}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-2xl text-center tabular-nums text-slate-100 placeholder-slate-600 placeholder:text-base focus:outline-none focus:border-sky-500"
          />
        )}

        {(inputError || triedErrors.length > 0) && (
          <div className="mt-3 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2.5">
            {[inputError, ...triedErrors].filter(Boolean).map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-300"><XCircle size={14} className="shrink-0" /> {e}</div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">자동 판정:</span>
            {inputError ? <Badge tone="red">진입 금지 — 재입력 필요</Badge>
              : judged == null ? <Badge tone="gray">입력 대기</Badge>
              : judged === "합격" ? <Badge tone="green">합격</Badge> : <Badge tone="red">불합격 — 저장 시 자동 홀드</Badge>}
          </div>
          <button onClick={save}
            className={`rounded-xl px-6 py-3 text-base font-bold transition-colors text-white ${judged === "불합격" ? "bg-red-600 hover:bg-red-500" : judged === "합격" ? "bg-emerald-600 hover : bg-emerald-500" : "bg-sky-600 hover:bg-sky-500"}`}>
            {editingPop ? "수정 저장 (자동 처리)" : "저장 (자동 처리)"}
          </button>
        </div>
      </Panel>

      {entries.length > 0 && (
        <Panel title="입력 이력 · 자동 처리 내역" right={<span className="text-xs text-slate-400">{entries.length}건</span>}>
          <div className="flex flex-col divide-y divide-slate-800/60">
            {entries.map((e) => (
              <div key={e.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-sky-300">{e.id}</span>
                  <span className="text-xs font-mono text-slate-500">{e.time}</span>
                  <span className="font-mono text-xs text-slate-300">{e.lot}</span>
                  <span className="text-sm text-slate-100">{e.check}</span>
                  <span className="text-sm tabular-nums text-slate-200">{e.value}</span>
                  <Badge tone={e.judge === "합격" ? "green" : "red"}>{e.judge}</Badge>
                  <span className="ml-auto whitespace-nowrap">
                    <button onClick={() => editPop(e)} className="qmes-iqc-action-btn qmes-iqc-action-edit mr-1">수정</button>
                    <button onClick={() => deletePop(e)} className="qmes-iqc-action-btn qmes-iqc-action-delete">삭제</button>
                  </span>
                </div>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {e.auto.map((a, i) => (
                    <li key={i} className={`text-[11px] flex items-center gap-1.5 ${e.judge === "합격" ? "text-slate-400" : i === 0 ? "text-slate-400" : "text-amber-300/80"}`}>
                      <ChevronRight size={10} className="shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ──────────────────────────── 고객불만 관리 (GQMS) 탭 ──────────────────────────── */
