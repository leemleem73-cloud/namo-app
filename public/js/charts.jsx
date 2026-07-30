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
        .qmes-spc-simple { display:flex; flex-direction:column; gap:16px; color:#111827; }
        .qmes-spc-selector { display:flex; flex-wrap:wrap; gap:8px; padding:14px; background:#fff; border:1px solid #dbe3ec; border-radius:10px; }
        .qmes-spc-item { min-height:42px; padding:7px 12px; border:1px solid #cbd5e1; border-radius:7px; background:#fff; color:#334155; text-align:left; cursor:pointer; }
        .qmes-spc-item strong { display:block; font-size:13px; line-height:1.25; }
        .qmes-spc-item small { display:block; margin-top:2px; color:#64748b; font-size:10px; line-height:1.2; }
        .qmes-spc-item.is-active { border-color:#1d4ed8; background:#eff6ff; color:#1d4ed8; box-shadow:inset 0 0 0 1px #1d4ed8; }
        .qmes-spc-metrics { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; }
        .qmes-spc-metric { min-height:92px; padding:15px; background:#fff; border:1px solid #dbe3ec; border-radius:9px; }
        .qmes-spc-metric-label { display:block; color:#64748b; font-size:12px; font-weight:700; }
        .qmes-spc-metric-value { display:flex; align-items:baseline; gap:5px; margin-top:10px; color:#0f172a; }
        .qmes-spc-metric-value strong { font-size:25px; line-height:1; }
        .qmes-spc-metric-value small { color:#64748b; font-size:11px; }
        .qmes-spc-judgment { display:flex; flex-direction:column; justify-content:center; gap:7px; }
        .qmes-spc-judgment p { margin:0; color:#64748b; font-size:10px; }
        .qmes-spc-chart { padding:16px; background:#fff; border:1px solid #dbe3ec; border-radius:10px; }
        .qmes-spc-chart-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .qmes-spc-chart-head h3 { margin:0; color:#0f172a; font-size:14px; font-weight:800; }
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
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="b" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} domain={cfg.domain} />
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
