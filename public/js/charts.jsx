/* QMES module: charts — extracted from index.html without logic changes. */

function cpkGrade(cpk) {
  if (cpk >= 1.67) return { label: "우수 (≥1.67)", tone: "green" };
  if (cpk >= 1.33) return { label: "적합 (≥1.33)", tone: "blue" };
  if (cpk >= 1.0) return { label: "개선 필요 (<1.33)", tone: "amber" };
  return { label: "부적합 (<1.00)", tone: "red" };
}

function SpcTab() {
  const [item, setItem] = useState("점도");
  const cfg = SPC_CONFIG[item];
  const values = cfg.data.map((d) => d.v);
  const s = values.length >= 2 ? spcStats(values, cfg.lsl, cfg.usl) : null;
  const grade = s ? cpkGrade(s.cpk) : { label: "데이터 없음 (검사 2건 이상 필요)", tone: "gray" };
  const fmt = (v, d = 2) => (v == null ? "—" : v.toFixed(d));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(SPC_CONFIG).map((k) => (
          <button key={k} onClick={() => setItem(k)}
            className={`px-3 py-1.5 rounded border text-xs transition-colors ${
              item === k ? "bg-sky-500/15 border-sky-500/50 text-sky-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
            }`}>
            {k} <span className="text-slate-500 ml-1">{SPC_CONFIG[k].spec}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icon={BarChart3} label="평균 (x̄)" value={s ? fmt(s.mean, item === "점도" ? 0 : 2) : "—"} unit={cfg.unit} tone="text-sky-400" />
        <Kpi icon={Activity} label="표준편차 (σ)" value={s ? fmt(s.sd, item === "점도" ? 1 : 3) : "—"} unit={cfg.unit} tone="text-violet-400" />
        <Kpi icon={Gauge} label="Cp" value={s ? fmt(s.cp) : "—"} unit={s && s.cp == null ? "(단측규격)" : ""} tone="text-slate-400" />
        <Kpi icon={Gauge} label="Cpk" value={s ? fmt(s.cpk) : "—"} tone={grade.tone === "green" ? "text-emerald-400" : grade.tone === "blue" ? "text-sky-400" : grade.tone === "amber" ? "text-amber-400" : "text-red-400"} />
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-center gap-2">
          <span className="text-xs text-slate-400">공정능력 판정</span>
          <Badge tone={grade.tone}>{grade.label}</Badge>
          <span className="text-[10px] text-slate-500">특별특성(CTQ) 목표 Cpk ≥ 1.67</span>
        </div>
      </div>

      <Panel title={`${item} 관리도 — 최근 ${values.length}배치`} right={<Badge tone="violet">CTQ</Badge>}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={cfg.data}>
            <CartesianGrid stroke="#16283E" strokeDasharray="3 3" />
            <XAxis dataKey="b" stroke="#8AA3C0" fontSize={11} />
            <YAxis stroke="#8AA3C0" fontSize={11} domain={cfg.domain} />
            <Tooltip {...chartTooltip} />
            {cfg.usl != null && <ReferenceLine y={cfg.usl} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: `USL ${cfg.usl.toLocaleString()}`, fill: "#7dd3fc", fontSize: 10, position: "insideTopRight" }} />}
            {cfg.target != null && <ReferenceLine y={cfg.target} stroke="#8AA3C0" strokeDasharray="2 4" label={{ value: `CL ${cfg.target.toLocaleString()}`, fill: "#C5D5E8", fontSize: 10, position: "insideRight" }} />}
            {cfg.lsl != null && <ReferenceLine y={cfg.lsl} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: `LSL ${cfg.lsl.toLocaleString()}`, fill: "#7dd3fc", fontSize: 10, position: "insideBottomRight" }} />}
            {s && <ReferenceLine y={s.mean} stroke="#fbbf24" strokeDasharray="6 3" label={{ value: "x̄", fill: "#fbbf24", fontSize: 10, position: "insideLeft" }} />}
            <Line type="monotone" dataKey="v" name={`${item} (${cfg.unit})`} stroke={cfg.color} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-slate-500 mt-2">
          관리이탈(규격 초과, 연속 상승/하강 경향 등) 발생 시 알람 및 배치 홀드 — 실제 운영 시 점도계·입도분석기 측정값 자동 수집으로 수기 입력을 제거해야 데이터 무결성 요건을 충족합니다.
        </p>
      </Panel>
    </div>
  );
}

/* ──────────────────────────── 4M 변경관리 탭 ──────────────────────────── */

