/* QMES charts + LOT trace — simple separated tabs v20260804 */

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
  const metricCards = [
    { label: "평균 (x̄)", value: s ? fmt(s.mean, item === "점도" || item === "수분율" || item === "절연저항" ? 0 : 2) : "—", unit: cfg.unit },
    { label: "표준편차 (σ)", value: s ? fmt(s.sd, item === "점도" || item === "수분율" || item === "절연저항" ? 1 : 3) : "—", unit: cfg.unit },
    { label: "Cp", value: s ? fmt(s.cp) : "—", unit: s && s.cp == null ? "단측규격" : "" },
    { label: "Cpk", value: s ? fmt(s.cpk) : "—", unit: "" },
  ];
  return (
    <div className="qmes-spc-simple flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700 bg-slate-900 p-3">
        {Object.keys(ALL_SPC_CONFIG).map((key) => (
          <button key={key} onClick={() => setItem(key)} className={`rounded-lg border px-3 py-2 text-left ${item === key ? "border-sky-400 bg-sky-500/15 text-sky-200" : "border-slate-700 bg-slate-800 text-slate-300"}`}>
            <strong className="block text-xs">{key}</strong><small className="text-[10px] text-slate-500">{ALL_SPC_CONFIG[key].spec}</small>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {metricCards.map((metric) => <div key={metric.label} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><div className="text-xs font-bold text-slate-400">{metric.label}</div><div className="mt-2 text-xl font-black text-white">{metric.value} <small className="text-xs text-slate-500">{metric.unit}</small></div></div>)}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4"><div className="text-xs font-bold text-slate-400">공정능력 판정</div><div className="mt-3"><Badge tone={grade.tone}>{grade.label}</Badge></div></div>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <ResponsiveContainer width="100%" height={280}><LineChart data={cfg.data}><CartesianGrid stroke="#16283e" strokeDasharray="3 3"/><XAxis dataKey="b" stroke="#8aa3c0" fontSize={11}/><YAxis stroke="#8aa3c0" fontSize={11} domain={cfg.domain}/><Tooltip {...chartTooltip}/>{cfg.usl != null && <ReferenceLine y={cfg.usl} stroke="#0284c7" strokeDasharray="4 4"/>}{cfg.lsl != null && <ReferenceLine y={cfg.lsl} stroke="#0284c7" strokeDasharray="4 4"/>}{s && <ReferenceLine y={s.mean} stroke="#d97706" strokeDasharray="6 3"/>}<Line isAnimationActive={false} type="linear" dataKey="v" stroke={cfg.color} strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer>
      </div>
    </div>
  );
}

(function () {
  const tone = (value) => {
    const text = String(value || "");
    if (/불합격|NG|격리|홀드|차단|반품|이탈/.test(text)) return "red";
    if (/대기|진행|검사/.test(text)) return "amber";
    if (/합격|완료|정상|OK/.test(text)) return "green";
    return "blue";
  };
  const unique = (values) => Array.from(new Set((values || []).map(v => String(v || "").trim()).filter(Boolean)));
  const isInspection = (step) => /공정검사|PQC|점도|입도|고형분|수분|접착력|검사/.test([step?.name, step?.stage, step?.detail].join(" "));
  const getDate = (row) => String(row?.date || row?.time || row?.recv || row?.createdAt || "");
  const monthKey = (value) => {
    const match = String(value || "").match(/(20\d{2})[-./년\s]+(\d{1,2})/);
    return match ? `${match[1]}-${String(match[2]).padStart(2, "0")}` : "";
  };

  TraceTab = function TraceTab() {
    const lots = DB.lots || {};
    const lotIds = Object.keys(lots);
    const [mode, setMode] = useState("finished");
    const [query, setQuery] = useState("");
    const [selectedLot, setSelectedLot] = useState(lotIds[0] || "");
    const [selectedRawLot, setSelectedRawLot] = useState("");
    const [detailTab, setDetailTab] = useState("materials");
    const [month, setMonth] = useState("all");

    if (!lotIds.length) return <Panel title="LOT 추적"><p className="text-sm text-slate-500">등록된 LOT이 없습니다.</p></Panel>;

    const activeLotId = lots[selectedLot] ? selectedLot : lotIds[0];
    const lot = lots[activeLotId] || {};
    const materials = lot.materials || [];
    const steps = lot.steps || [];
    const inspections = steps.filter(isInspection);
    const productions = steps.filter(step => !isInspection(step));
    const normalizedQuery = query.trim().toLowerCase();
    const finishedMatches = lotIds.filter(id => [id, lots[id]?.itemName, lots[id]?.item, lots[id]?.wo, lots[id]?.status].join(" ").toLowerCase().includes(normalizedQuery));

    const rawMap = {};
    Object.entries(lots).forEach(([finishedId, row]) => (row.materials || []).forEach(mat => {
      const rawId = String(mat.lot || "").trim();
      if (!rawId) return;
      const item = rawMap[rawId] || (rawMap[rawId] = { lot: rawId, names: [], suppliers: [], finishedLots: [] });
      item.names.push(mat.name || "원재료"); item.suppliers.push(mat.supplier || ""); item.finishedLots.push(finishedId);
    }));
    const rawRows = Object.values(rawMap).map(row => ({...row, names: unique(row.names), suppliers: unique(row.suppliers), finishedLots: unique(row.finishedLots)})).filter(row => [row.lot, ...row.names, ...row.suppliers, ...row.finishedLots].join(" ").toLowerCase().includes(normalizedQuery));
    const selectedRaw = rawRows.find(row => row.lot === selectedRawLot) || rawRows[0] || null;

    const monthValues = unique([
      ...materials.map(getDate), ...productions.map(getDate), ...inspections.map(getDate), lot.ship?.date
    ].map(monthKey)).sort().reverse();
    const inMonth = row => month === "all" || monthKey(getDate(row)) === month;
    const filteredMaterials = materials.filter(inMonth);
    const filteredProductions = productions.filter(inMonth);
    const filteredInspections = inspections.filter(inMonth);
    const shipmentVisible = month === "all" || monthKey(lot.ship?.date) === month;

    const tabs = [
      ["materials", "투입원료", filteredMaterials.length],
      ["production", "생산실적", filteredProductions.length],
      ["inspection", "공정검사", filteredInspections.length],
      ["shipment", "출하정보", lot.ship && shipmentVisible ? 1 : 0],
    ];

    const selectFinished = id => { setSelectedLot(id); setDetailTab("materials"); setMonth("all"); };

    return (
      <div className="flex flex-col gap-4">
        <Panel title="LOT 통합 추적">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button onClick={() => { setMode("finished"); setQuery(""); }} className={`rounded-lg border px-4 py-3 text-sm font-black ${mode === "finished" ? "border-sky-400 bg-sky-500/15 text-white" : "border-slate-700 bg-slate-800 text-slate-400"}`}>완제품 LOT 조회</button>
            <button onClick={() => { setMode("raw"); setQuery(""); }} className={`rounded-lg border px-4 py-3 text-sm font-black ${mode === "raw" ? "border-violet-400 bg-violet-500/15 text-white" : "border-slate-700 bg-slate-800 text-slate-400"}`}>원료 LOT 역추적</button>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3"><Search size={18} className="text-sky-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={mode === "finished" ? "완제품 LOT, 품명, 작업지시 번호 검색" : "원료 LOT 번호 검색"} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white focus:outline-none"/></div>
          <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-800 p-2">
            {mode === "finished" ? finishedMatches.map(id => <button key={id} onClick={() => selectFinished(id)} className={`rounded-lg border px-3 py-2 text-left ${activeLotId === id ? "border-sky-400 bg-sky-500/15" : "border-slate-700 bg-slate-800"}`}><div className="font-mono text-sm font-black text-white">{id}</div><div className="text-xs text-slate-400">{lots[id]?.itemName || "품명 미등록"}</div></button>) : rawRows.map(row => <button key={row.lot} onClick={() => setSelectedRawLot(row.lot)} className={`rounded-lg border px-3 py-2 text-left ${selectedRaw?.lot === row.lot ? "border-violet-400 bg-violet-500/15" : "border-slate-700 bg-slate-800"}`}><div className="font-mono text-sm font-black text-white">{row.lot}</div><div className="text-xs text-slate-400">영향 완제품 {row.finishedLots.length}건</div></button>)}
          </div>
        </Panel>

        {mode === "raw" && selectedRaw && <Panel title={`원료 LOT 역추적 — ${selectedRaw.lot}`}><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400"><th className="py-2 text-left">원료 LOT</th><th className="text-left">품명</th><th className="text-left">공급사</th><th className="text-left">사용 완제품 LOT</th></tr></thead><tbody><tr className="border-b border-slate-800"><td className="py-3 font-mono font-black text-violet-300">{selectedRaw.lot}</td><td>{selectedRaw.names.join(" · ") || "-"}</td><td>{selectedRaw.suppliers.join(" · ") || "-"}</td><td>{selectedRaw.finishedLots.map(id => <button key={id} onClick={() => { selectFinished(id); setMode("finished"); }} className="mr-2 font-mono text-sky-300 underline">{id}</button>)}</td></tr></tbody></table></div></Panel>}

        {mode === "finished" && <>
          <Panel title={`완제품 LOT — ${activeLotId}`} right={<Badge tone={tone(lot.status)}>{lot.status || "상태 미등록"}</Badge>}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm"><div><div className="text-xs text-slate-500">품명</div><div className="mt-1 font-bold text-white">{lot.itemName || "-"}</div></div><div><div className="text-xs text-slate-500">작업지시</div><div className="mt-1 font-mono text-violet-300">{lot.wo || "-"}</div></div><div><div className="text-xs text-slate-500">생산수량</div><div className="mt-1 font-bold text-white">{lot.qty || "-"}</div></div><div><div className="text-xs text-slate-500">출하상태</div><div className="mt-1 font-bold text-white">{lot.ship ? "출하완료" : "미출하"}</div></div></div>
          </Panel>

          <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900 p-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs font-black text-slate-300">월별 데이터</div>
            <select value={month} onChange={e => setMonth(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-white"><option value="all">전체 기간</option>{monthValues.map(value => <option key={value} value={value}>{value.replace("-", "년 ")}월</option>)}</select>
          </div>

          <nav className="grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2 md:grid-cols-4">
            {tabs.map(([key, label, count]) => <button key={key} type="button" aria-pressed={detailTab === key} onClick={() => setDetailTab(key)} className={`rounded-lg px-3 py-3 text-sm font-black ${detailTab === key ? "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400" : "bg-slate-800 text-slate-400"}`}>{label} <span className="ml-1 text-xs">({count})</span></button>)}
          </nav>

          {detailTab === "materials" && <Panel title="투입원료" right={<span className="text-xs text-slate-400">총 {filteredMaterials.length}건</span>}><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400"><th className="py-2 text-left">원료 LOT</th><th className="text-left">품명</th><th className="text-left">공급사</th><th className="text-right">투입량</th><th className="text-left">수입검사</th></tr></thead><tbody>{filteredMaterials.map((m,i) => <tr key={`${m.lot}-${i}`} className="border-b border-slate-800"><td className="py-3 font-mono font-black text-violet-300">{m.lot || "-"}</td><td>{m.name || "-"}</td><td>{m.supplier || "-"}</td><td className="text-right">{m.qty || "-"}</td><td><Badge tone={String(m.iqc || "").includes("합격") ? "green" : "amber"}>{m.iqc || "미검사"}</Badge></td></tr>)}</tbody></table>{!filteredMaterials.length && <div className="py-8 text-center text-sm text-slate-500">해당 기간의 투입원료가 없습니다.</div>}</div></Panel>}

          {detailTab === "production" && <Panel title="생산실적" right={<span className="text-xs text-slate-400">총 {filteredProductions.length}건</span>}><div>{filteredProductions.map((s,i) => <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-3 border-b border-slate-800 py-3 text-sm"><span className="font-mono text-xs text-slate-500">{s.time || s.date || "-"}</span><div><div className="font-bold text-white">{s.name || s.stage || "생산"}</div><div className="mt-1 text-xs text-slate-400">{s.detail || ""}</div><div className="mt-1 text-[11px] text-slate-500">담당: {s.by || "-"}</div></div><Badge tone={tone(s.result)}>{s.result || "완료"}</Badge></div>)}{!filteredProductions.length && <div className="py-8 text-center text-sm text-slate-500">해당 기간의 생산실적이 없습니다.</div>}</div></Panel>}

          {detailTab === "inspection" && <Panel title="공정검사(PQC) 결과" right={<span className="text-xs text-slate-400">총 {filteredInspections.length}건</span>}><div>{filteredInspections.map((s,i) => <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-3 border-b border-slate-800 py-3 text-sm"><span className="font-mono text-xs text-slate-500">{s.time || s.date || "-"}</span><div><div className="font-bold text-white">{s.name || "공정검사(PQC)"}</div><div className="mt-1 text-xs text-slate-400">{s.detail || ""}</div><div className="mt-1 text-[11px] text-slate-500">검사자: {s.by || "-"}</div></div><Badge tone={tone(s.result)}>{s.result || "미판정"}</Badge></div>)}{!filteredInspections.length && <div className="py-8 text-center text-sm text-slate-500">해당 기간의 공정검사 결과가 없습니다.</div>}</div></Panel>}

          {detailTab === "shipment" && <Panel title="출하정보">{lot.ship && shipmentVisible ? <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5"><div><div className="text-xs text-slate-500">고객사</div><div className="mt-1 text-white">{lot.ship.customer || "-"}</div></div><div><div className="text-xs text-slate-500">출하번호</div><div className="mt-1 font-mono text-emerald-300">{lot.ship.no || "-"}</div></div><div><div className="text-xs text-slate-500">출하일</div><div className="mt-1 text-white">{lot.ship.date || "-"}</div></div><div><div className="text-xs text-slate-500">납품처</div><div className="mt-1 text-white">{lot.ship.dest || "-"}</div></div><div><div className="text-xs text-slate-500">송장번호</div><div className="mt-1 font-mono text-white">{lot.ship.invoice || "-"}</div></div></div> : <div className="py-8 text-center text-sm text-slate-500">{lot.ship ? "선택한 월의 출하정보가 없습니다." : "아직 출하되지 않은 LOT입니다."}</div>}</Panel>}
        </>}
      </div>
    );
  };
})();
