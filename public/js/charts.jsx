/* QMES module: charts — extracted from index.html without logic changes. */

function cpkGrade(cpk) {
  if (cpk >= 1.67) return { label: "우수 (≥1.67)", tone: "green" };
  if (cpk >= 1.33) return { label: "적합 (≥1.33)", tone: "blue" };
  if (cpk >= 1.0) return { label: "개선 필요 (<1.33)", tone: "amber" };
  return { label: "부적합 (<1.00)", tone: "red" };
}

const ALL_SPC_CONFIG = {
  "입도": { data: PARTICLE_SPC, lsl: null, usl: 10, target: null, unit: "µm", domain: [0, 11], spec: "Dmax ≤ 10 µm", color: "#0284c7" },
  "점도": SPC_CONFIG["점도"],
  "고형분": SPC_CONFIG["고형분"],
  "접착력": { data: [], lsl: 0.4, usl: null, target: null, unit: "kgf", domain: [0, "auto"], spec: "≥ 0.4 kgf", color: "#0f766e" },
  "수분율": { data: [], lsl: null, usl: 2000, target: null, unit: "ppm", domain: [0, 2200], spec: "< 2,000 ppm", color: "#2563eb" },
  "절연저항": { data: [], lsl: 200, usl: null, target: null, unit: "MΩ", domain: [0, "auto"], spec: "≥ 200 MΩ", color: "#7c3aed" },
  "전해액 팽윤성": { data: [], lsl: null, usl: 120, target: null, unit: "%", domain: [0, 130], spec: "< 120%", color: "#c2410c" },
};

function SpcTab() {
  const [item, setItem] = useState("입도");
  const cfg = ALL_SPC_CONFIG[item];
  const values = cfg.data.map((d) => d.v);
  const s = values.length >= 2 ? spcStats(values, cfg.lsl, cfg.usl) : null;
  const grade = s ? cpkGrade(s.cpk) : { label: "데이터 없음 (검사 2건 이상 필요)", tone: "gray" };
  const fmt = (v, d = 2) => (v == null ? "—" : v.toFixed(d));
  const averageDigits = item === "점도" || item === "수분율" || item === "절연저항" ? 0 : 2;
  const standardDeviationDigits = item === "점도" || item === "수분율" || item === "절연저항" ? 1 : 3;
  const metricCards = [
    { label: "평균 (x̄)", value: s ? fmt(s.mean, averageDigits) : "—", unit: cfg.unit },
    { label: "표준편차 (σ)", value: s ? fmt(s.sd, standardDeviationDigits) : "—", unit: cfg.unit },
    { label: "Cp", value: s ? fmt(s.cp) : "—", unit: s && s.cp == null ? "단측규격" : "" },
    { label: "Cpk", value: s ? fmt(s.cpk) : "—", unit: "" },
  ];

  return (
    <div className="qmes-spc-simple">
      <style>{`
        .qmes-spc-simple { display:flex; flex-direction:column; gap:16px; color:#e2e8f0; }
        .qmes-spc-selector { display:flex; flex-wrap:wrap; gap:8px; padding:14px; background:#0f1e32; border:1px solid #243d58; border-radius:10px; }
        .qmes-spc-item { min-height:42px; padding:7px 12px; border:1px solid #334155; border-radius:7px; background:#1e293b; color:#cbd5e1; text-align:left; cursor:pointer; }
        .qmes-spc-item strong { display:block; font-size:13px; line-height:1.25; }
        .qmes-spc-item small { display:block; margin-top:2px; color:#64748b; font-size:10px; line-height:1.2; }
        .qmes-spc-item.is-active { border-color:#38bdf8; background:rgba(14,165,233,.15); color:#7dd3fc; box-shadow:inset 0 0 0 1px rgba(56,189,248,.3); }
        .qmes-spc-metrics { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; }
        .qmes-spc-metric { min-height:92px; padding:15px; background:#0f1e32; border:1px solid #243d58; border-radius:9px; }
        .qmes-spc-metric-label { display:block; color:#94a3b8; font-size:12px; font-weight:700; }
        .qmes-spc-metric-value { display:flex; align-items:baseline; gap:5px; margin-top:10px; color:#f8fafc; }
        .qmes-spc-metric-value strong { font-size:25px; line-height:1; }
        .qmes-spc-metric-value small { color:#64748b; font-size:11px; }
        .qmes-spc-judgment { display:flex; flex-direction:column; justify-content:center; gap:7px; }
        .qmes-spc-judgment p { margin:0; color:#64748b; font-size:10px; }
        .qmes-spc-chart { padding:16px; background:#0f1e32; border:1px solid #243d58; border-radius:10px; }
        .qmes-spc-chart-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .qmes-spc-chart-head h3 { margin:0; color:#e2e8f0; font-size:14px; font-weight:800; }
        .qmes-spc-chart-note { margin:8px 0 0; color:#64748b; font-size:11px; line-height:1.55; }
        @media (max-width:1024px) { .qmes-spc-metrics { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:640px) { .qmes-spc-item { flex:1 1 calc(50% - 8px); } .qmes-spc-metrics { grid-template-columns:1fr; } }
      `}</style>

      <div className="qmes-spc-selector" aria-label="SPC 검사 항목">
        {Object.keys(ALL_SPC_CONFIG).map((k) => (
          <button key={k} onClick={() => setItem(k)}
            className={`qmes-spc-item${item === k ? " is-active" : ""}`}
            aria-pressed={item === k}>
            <strong>{k}</strong>
            <small>{ALL_SPC_CONFIG[k].spec}</small>
          </button>
        ))}
      </div>

      <div className="qmes-spc-metrics">
        {metricCards.map((metric) => (
          <div className="qmes-spc-metric" key={metric.label}>
            <span className="qmes-spc-metric-label">{metric.label}</span>
            <div className="qmes-spc-metric-value">
              <strong>{metric.value}</strong>
              {metric.unit && <small>{metric.unit}</small>}
            </div>
          </div>
        ))}
        <div className="qmes-spc-metric qmes-spc-judgment">
          <span className="qmes-spc-metric-label">공정능력 판정</span>
          <Badge tone={grade.tone}>{grade.label}</Badge>
          <p>특별특성(CTQ) 목표 Cpk ≥ 1.67</p>
        </div>
      </div>

      <section className="qmes-spc-chart">
        <div className="qmes-spc-chart-head">
          <h3>{item} 관리도 — 최근 {values.length}배치</h3>
          <Badge tone="gray">CTQ</Badge>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={cfg.data}>
            <CartesianGrid stroke="#16283e" strokeDasharray="3 3" />
            <XAxis dataKey="b" stroke="#8aa3c0" fontSize={11} />
            <YAxis stroke="#8aa3c0" fontSize={11} domain={cfg.domain} />
            <Tooltip {...chartTooltip} />
            {cfg.usl != null && <ReferenceLine y={cfg.usl} stroke="#0284c7" strokeDasharray="4 4" label={{ value: `USL ${cfg.usl.toLocaleString()}`, fill: "#0369a1", fontSize: 10, position: "insideTopRight" }} />}
            {cfg.target != null && <ReferenceLine y={cfg.target} stroke="#64748b" strokeDasharray="2 4" label={{ value: `CL ${cfg.target.toLocaleString()}`, fill: "#475569", fontSize: 10, position: "insideRight" }} />}
            {cfg.lsl != null && <ReferenceLine y={cfg.lsl} stroke="#0284c7" strokeDasharray="4 4" label={{ value: `LSL ${cfg.lsl.toLocaleString()}`, fill: "#0369a1", fontSize: 10, position: "insideBottomRight" }} />}
            {s && <ReferenceLine y={s.mean} stroke="#d97706" strokeDasharray="6 3" label={{ value: "x̄", fill: "#b45309", fontSize: 10, position: "insideLeft" }} />}
            <Line isAnimationActive={false} type="linear" dataKey="v" name={`${item} (${cfg.unit})`} stroke={cfg.color} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="qmes-spc-chart-note">
          관리이탈(규격 초과, 연속 상승/하강 경향 등) 발생 시 알람 및 배치 홀드 — 실제 운영 시 점도계·입도분석기 측정값 자동 수집으로 수기 입력을 제거해야 데이터 무결성 요건을 충족합니다.
        </p>
      </section>
    </div>
  );
}

/* ──────────────────────────── 4M 변경관리 탭 ──────────────────────────── */

/* LOT 통합 추적 화면 — 기존 LOT 데이터는 유지하고 표시 화면만 단순화 */
(function () {
  const statusTone = (value) => {
    const text = String(value || "");
    if (/불합격|격리|홀드|차단|반품|이탈/.test(text)) return "red";
    if (/대기|검사|진행|근접|확인/.test(text)) return "amber";
    if (/합격|완료|정상|사용가능/.test(text)) return "green";
    return "blue";
  };

  const uniqueValues = (values) => Array.from(new Set(
    (values || []).map((value) => String(value || "").trim()).filter(Boolean)
  ));

  const CARD_STYLES = {
    sky: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    violet: "border-violet-500/40 bg-violet-500/10 text-violet-300",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  };

  const TraceSummaryCard = ({ title, value, detail, color = "sky" }) => (
    <div className={`rounded-xl border p-4 ${CARD_STYLES[color] || CARD_STYLES.sky}`}>
      <div className="text-xs font-black">{title}</div>
      <div className="mt-2 break-words text-xl font-black text-white">{value || "-"}</div>
      {detail && <div className="mt-1 break-words text-xs text-slate-400">{detail}</div>}
    </div>
  );

  TraceTab = function TraceTab() {
    const lots = DB.lots || {};
    const intermediateLots = DB.intermediateLots || {};
    const lotIds = Object.keys(lots);
    const [mode, setMode] = useState("finished");
    const [query, setQuery] = useState("");
    const [selectedLot, setSelectedLot] = useState(lotIds[0] || "");
    const [selectedRawLot, setSelectedRawLot] = useState("");

    if (!lotIds.length) {
      return <Panel title="LOT 추적"><p className="text-sm text-slate-500">등록된 LOT이 없습니다.</p></Panel>;
    }

    const normalizedQuery = query.trim().toLowerCase();
    const activeLotId = lots[selectedLot] ? selectedLot : lotIds[0];
    const activeLot = lots[activeLotId];
    const finishedMatches = lotIds.filter((lotId) => {
      const row = lots[lotId] || {};
      const searchable = [lotId, row.itemName, row.item, row.wo, row.status]
        .concat((row.materials || []).flatMap((material) => [material.lot, material.name, material.supplier]))
        .join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });

    const rawLotMap = {};
    const addRawLink = (rawLot, finishedLotId, name, supplier, intermediateLotId) => {
      const rawLotId = String(rawLot || "").trim();
      if (!rawLotId) return;
      const row = rawLotMap[rawLotId] || (rawLotMap[rawLotId] = {
        lot: rawLotId,
        names: [], suppliers: [], finishedLots: [], intermediateLots: []
      });
      row.names.push(name || "원재료");
      row.suppliers.push(supplier || "");
      row.finishedLots.push(finishedLotId || "");
      row.intermediateLots.push(intermediateLotId || "");
    };

    Object.entries(lots).forEach(([lotId, row]) => {
      (row.materials || []).forEach((material) => {
        addRawLink(material.lot, lotId, material.name, material.supplier, "");
      });
    });

    Object.entries(intermediateLots).forEach(([intermediateLotId, row]) => {
      (row.parentLots || []).forEach((rawLotId) => {
        (row.childLots || []).forEach((childLotId) => {
          addRawLink(rawLotId, childLotId, "", "", intermediateLotId);
        });
        Object.entries(lots).forEach(([lotId, lot]) => {
          if (lot.binderLot === intermediateLotId) {
            addRawLink(rawLotId, lotId, "", "", intermediateLotId);
          }
        });
      });
    });

    const rawLotRows = Object.values(rawLotMap).map((row) => ({
      ...row,
      names: uniqueValues(row.names),
      suppliers: uniqueValues(row.suppliers),
      finishedLots: uniqueValues(row.finishedLots).filter((lotId) => lots[lotId]),
      intermediateLots: uniqueValues(row.intermediateLots),
    })).filter((row) => [
      row.lot, ...row.names, ...row.suppliers, ...row.finishedLots, ...row.intermediateLots
    ].join(" ").toLowerCase().includes(normalizedQuery));

    const selectedRaw = rawLotRows.find((row) => row.lot === selectedRawLot) || rawLotRows[0] || null;
    const affectedLots = selectedRaw
      ? selectedRaw.finishedLots.map((lotId) => ({ id: lotId, ...lots[lotId] }))
      : [];
    const shippedLots = affectedLots.filter((row) => row.ship);
    const affectedCustomers = uniqueValues(shippedLots.flatMap((row) => [row.ship?.customer, row.ship?.dest]));
    const riskLots = affectedLots.filter((row) => /불합격|격리|홀드|차단|반품|이탈/.test(String(row.status || "")));
    const materials = activeLot.materials || [];
    const intermediateLotId = activeLot.binderLot || (intermediateLots[activeLotId] ? activeLotId : "");
    const intermediateLot = intermediateLotId ? intermediateLots[intermediateLotId] : null;

    const openNcr = () => {
      try { sessionStorage.setItem("qmes_current_tab", "ncr"); } catch (error) { /* 무시 */ }
      window.location.reload();
    };

    return (
      <div className="flex flex-col gap-4">
        <Panel title="LOT 통합 추적" right={<span className="text-xs font-black text-sky-300">검색 → 영향 범위 → 조치</span>}>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button onClick={() => { setMode("finished"); setQuery(""); }}
              className={`rounded-lg border px-4 py-3 text-sm font-black ${mode === "finished" ? "border-sky-400 bg-sky-500/15 text-white" : "border-slate-700 bg-slate-800 text-slate-400"}`}>
              완제품 LOT 조회
            </button>
            <button onClick={() => { setMode("raw"); setQuery(""); }}
              className={`rounded-lg border px-4 py-3 text-sm font-black ${mode === "raw" ? "border-violet-400 bg-violet-500/15 text-white" : "border-slate-700 bg-slate-800 text-slate-400"}`}>
              원료 LOT 역추적
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3">
            <Search size={18} className="text-sky-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder={mode === "finished" ? "완제품 LOT, 품명, 작업지시 번호 검색" : "문제가 발생한 원료 LOT 번호 검색"}
              className="min-w-0 flex-1 bg-transparent text-base font-bold text-white placeholder-slate-500 focus:outline-none" />
          </div>

          <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-800 p-2">
            {mode === "finished" ? finishedMatches.slice(0, 30).map((lotId) => (
              <button key={lotId} onClick={() => setSelectedLot(lotId)}
                className={`rounded-lg border px-3 py-2 text-left ${activeLotId === lotId ? "border-sky-400 bg-sky-500/15" : "border-slate-700 bg-slate-800"}`}>
                <div className="font-mono text-sm font-black text-white">{lotId}</div>
                <div className="text-xs text-slate-400">{lots[lotId].itemName || "품명 미등록"}</div>
              </button>
            )) : rawLotRows.slice(0, 30).map((row) => (
              <button key={row.lot} onClick={() => setSelectedRawLot(row.lot)}
                className={`rounded-lg border px-3 py-2 text-left ${selectedRaw?.lot === row.lot ? "border-violet-400 bg-violet-500/15" : "border-slate-700 bg-slate-800"}`}>
                <div className="font-mono text-sm font-black text-white">{row.lot}</div>
                <div className="text-xs text-slate-400">영향 완제품 {row.finishedLots.length}건</div>
              </button>
            ))}
            {mode === "finished" && finishedMatches.length === 0 && <span className="p-2 text-sm text-slate-500">일치하는 완제품 LOT이 없습니다.</span>}
            {mode === "raw" && rawLotRows.length === 0 && <span className="p-2 text-sm text-slate-500">일치하는 원료 LOT이 없습니다.</span>}
          </div>
        </Panel>

        {mode === "raw" && selectedRaw && (
          <>
            <Panel title={`원료 LOT 역추적 — ${selectedRaw.lot}`}
              right={<Badge tone={riskLots.length ? "red" : shippedLots.length ? "amber" : "green"}>{riskLots.length ? "즉시 확인" : shippedLots.length ? "출하 영향 확인" : "확인 완료"}</Badge>}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <TraceSummaryCard title="1. 원료 LOT" value={selectedRaw.lot} detail={selectedRaw.names.join(" · ")} color="violet" />
                <TraceSummaryCard title="2. 중간재" value={`${selectedRaw.intermediateLots.length}건`} detail={selectedRaw.intermediateLots.join(" · ") || "직접 투입"} />
                <TraceSummaryCard title="3. 영향 완제품" value={`${affectedLots.length}건`} detail={affectedLots.map((row) => row.id).join(" · ")} color={riskLots.length ? "rose" : "amber"} />
                <TraceSummaryCard title="4. 출하처" value={`${affectedCustomers.length}곳`} detail={affectedCustomers.join(" · ") || "미출하"} color={affectedCustomers.length ? "amber" : "emerald"} />
              </div>

              {(riskLots.length > 0 || shippedLots.length > 0) && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-black text-rose-300">
                      {riskLots.length ? `홀드·격리 상태 LOT ${riskLots.length}건 확인 필요` : `이미 출하된 LOT ${shippedLots.length}건 — 고객 영향 확인 필요`}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">영향 LOT 확인 후 부적합 등록 및 조치를 진행하세요.</div>
                  </div>
                  <button onClick={openNcr} className="rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-black text-white">부적합 관리 열기</button>
                </div>
              )}
            </Panel>

            <Panel title="영향받는 완제품 LOT" right={<span className="text-xs text-slate-400">총 {affectedLots.length}건</span>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead><tr className="border-b border-slate-700 text-xs text-slate-400"><th className="py-2 text-left">완제품 LOT</th><th className="py-2 text-left">품명</th><th className="py-2 text-left">상태</th><th className="py-2 text-left">출하처</th><th></th></tr></thead>
                  <tbody>{affectedLots.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800">
                      <td className="py-3 font-mono font-black text-sky-300">{row.id}</td>
                      <td>{row.itemName || "-"}</td>
                      <td><Badge tone={statusTone(row.status)}>{row.status || "미등록"}</Badge></td>
                      <td>{row.ship?.customer || row.ship?.dest || "미출하"}</td>
                      <td className="text-right"><button onClick={() => { setSelectedLot(row.id); setMode("finished"); setQuery(row.id); }} className="rounded border border-sky-500/50 px-3 py-1.5 text-xs font-bold text-sky-300">LOT 보기</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Panel>
          </>
        )}

        {mode === "finished" && (
          <>
            <Panel title={`완제품 LOT — ${activeLotId}`} right={<Badge tone={statusTone(activeLot.status)}>{activeLot.status || "상태 미등록"}</Badge>}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <TraceSummaryCard title="품명" value={activeLot.itemName} detail={activeLot.item} />
                <TraceSummaryCard title="작업지시" value={activeLot.wo} color="violet" />
                <TraceSummaryCard title="생산 수량" value={activeLot.qty} detail={`현재 단계: ${activeLot.stage || "-"}`} color="amber" />
                <TraceSummaryCard title="출하 상태" value={activeLot.ship ? "출하 완료" : "미출하"} detail={activeLot.ship?.customer || "출하 정보 없음"} color={activeLot.ship ? "emerald" : "sky"} />
              </div>
            </Panel>

            <Panel title="투입 원료" right={<span className="text-xs text-slate-400">총 {materials.length}건</span>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead><tr className="border-b border-slate-700 text-xs text-slate-400"><th className="py-2 text-left">원료 LOT</th><th className="py-2 text-left">품명</th><th className="py-2 text-left">공급사</th><th className="py-2 text-right">투입량</th><th className="py-2 text-left">수입검사</th></tr></thead>
                  <tbody>{materials.map((material, index) => (
                    <tr key={`${material.lot}-${index}`} className="border-b border-slate-800">
                      <td className="py-3 font-mono font-black text-violet-300">{material.lot || "-"}</td>
                      <td>{material.name || "-"}</td>
                      <td>{material.supplier || "-"}</td>
                      <td className="text-right">{material.qty || "-"}</td>
                      <td><Badge tone={String(material.iqc || "").includes("합격") ? "green" : "amber"}>{material.iqc || "미검사"}</Badge></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Panel>

            {intermediateLotId && (
              <Panel title="중간재 연결">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <TraceSummaryCard title="중간재 LOT" value={intermediateLotId} detail={intermediateLot?.type || "중간재"} color="violet" />
                  <TraceSummaryCard title="상위 원료" value={`${intermediateLot?.parentLots?.length || 0}건`} detail={(intermediateLot?.parentLots || []).join(" · ")} />
                  <TraceSummaryCard title="하위 완제품" value={`${intermediateLot?.childLots?.length || 0}건`} detail={(intermediateLot?.childLots || []).join(" · ") || activeLotId} color="emerald" />
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    );
  };
})();
