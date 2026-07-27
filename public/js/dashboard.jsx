/* QMES module: dashboard — extracted from index.html without logic changes. */

function qmesProcessStatus() {
  const iqc = Array.isArray(DB.iqc) ? DB.iqc : [];
  const batches = Array.isArray(DB.batches) ? DB.batches : [];
  const oqc = Array.isArray(DB.insp?.OQC) ? DB.insp.OQC : [];
  const holds = Array.isArray(DB.holds) ? DB.holds : [];
  const activeHolds = holds.filter((h) => String(h.status || "").includes("차단"));
  const latestIqc = iqc[0];
  const latestBatch = batches[0];
  const activeBatch = batches.find((b) => !["완료", "생산완료", "출하완료"].some((x) => String(b.status || "").includes(x)));
  const displayBatch = activeBatch || latestBatch;
  const batchLot = displayBatch?.no || "";
  const lotOqc = batchLot ? oqc.filter((r) => r.lot === batchLot) : [];
  const latestOqc = lotOqc[0] || oqc[0];
  const hasIqcAlarm = iqc.some((r) => r.judge && r.judge !== "합격") || activeHolds.some((h) => String(h.gate || "").includes("IQC"));
  const hasOqcAlarm = oqc.some((r) => r.judge === "불합격") || activeHolds.some((h) => String(h.gate || "").includes("출하"));
  const passedIqc = iqc.filter((r) => r.judge === "합격");
  const batchStatus = String(displayBatch?.status || "");
  const isIssued = Boolean(displayBatch) && batchStatus.includes("발행");
  const isBatchComplete = Boolean(displayBatch) && ["완료", "생산완료", "출하완료"].some((x) => batchStatus.includes(x));
  const isProductionRunning = Boolean(displayBatch) && !isIssued && !isBatchComplete;
  const oqcAllPass = lotOqc.length > 0 && lotOqc.every((r) => r.judge === "합격");
  const lotInfo = batchLot ? DB.lots?.[batchLot] : null;
  const shipped = Boolean(lotInfo?.ship) || batchStatus.includes("출하완료");

  return [
    {
      ...PROCESSES[0],
      status: hasIqcAlarm ? "alarm" : latestIqc ? (latestIqc.judge === "합격" ? "done" : "inspect") : "idle",
      key: latestIqc ? `${latestIqc.lot || latestIqc.inNo || "-"} · ${latestIqc.judge || "검사중"}` : "검사 등록 대기"
    },
    {
      ...PROCESSES[1],
      status: hasIqcAlarm ? "alarm" : passedIqc.length ? "done" : "idle",
      key: passedIqc.length ? `합격 원료 ${passedIqc.length} LOT · 불출 가능` : "IQC 합격 원료 없음"
    },
    {
      ...PROCESSES[2],
      status: isBatchComplete ? "done" : (isProductionRunning ? "run" : "idle"),
      key: displayBatch ? `${displayBatch.no} · ${isBatchComplete ? "바인더 제조 완료" : isIssued ? "작업지시 발행 · 대기" : "바인더 제조중"}` : "작업지시 없음"
    },
    {
      ...PROCESSES[3],
      status: isBatchComplete ? "done" : (isProductionRunning ? "run" : "idle"),
      key: displayBatch ? `${displayBatch.no} · ${isBatchComplete ? "슬러리 제조 완료" : isIssued ? "생산 대기" : (displayBatch.tank || "TK 501A/B")}` : "생산 진행 LOT 없음"
    },
    {
      ...PROCESSES[4],
      status: hasOqcAlarm ? "alarm" : lotOqc.length ? (oqcAllPass ? "done" : "inspect") : (isBatchComplete ? "inspect" : "idle"),
      key: latestOqc ? `${latestOqc.lot} · OQC ${latestOqc.judge || "검사중"}` : (isBatchComplete ? "OQC 등록 대기" : "생산 완료 후 검사")
    },
    {
      ...PROCESSES[5],
      status: isBatchComplete ? "done" : (oqcAllPass ? "run" : "idle"),
      key: isBatchComplete ? `${batchLot || "-"} · 충진 완료` : (oqcAllPass ? `${batchLot} · 충진 진행` : "OQC 합격 후 충진")
    },
    {
      ...PROCESSES[6],
      status: isBatchComplete ? "done" : "idle",
      key: isBatchComplete ? `${batchLot || "-"} · 완제품 보관` : "충진 완료 후 보관"
    },
    {
      ...PROCESSES[7],
      status: shipped ? "done" : (isBatchComplete ? "idle" : "idle"),
      key: shipped ? `${batchLot || "-"} · 출하 완료` : "출하 등록 대기"
    }
  ];
}

function ProcessStrip() {
  const processes = qmesProcessStatus();
  return (
    <div className="qmes-dashboard-process-grid grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
      {processes.map((p, i) => {
        const m = statusMeta[p.status] || statusMeta.idle;
        return (
          <div key={i} className={`qmes-process-card bg-slate-900 border ${m.ring} rounded-lg px-3 py-2.5`} title={`${p.name}: ${p.key}`}>
            <div className="flex items-center justify-between">
              <span className="qmes-process-card-text qmes-process-no text-[11px] text-slate-500 font-mono">공정 {p.no}</span>
              <span className="qmes-process-status-wrap flex items-center gap-1.5">
                <span className={`qmes-process-status-dot rounded-full ${m.dot}`} />
                <span className={`qmes-process-card-text qmes-process-status-label text-[18px] font-bold leading-none ${m.text}`}>{m.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <p.icon size={13} className="text-slate-400 shrink-0" />
              <span className="qmes-process-card-text qmes-process-name text-[13px] text-slate-100 font-medium leading-tight">{p.name}</span>
            </div>
            <div className="qmes-process-card-text qmes-process-key text-[11px] text-slate-400 mt-1.5 tabular-nums truncate">{p.key}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────── 대시보드 ──────────────────────────── */

function DashboardTab() {
  const todayKey = localISODate();
  const todayBatches = (DB.batches || []).filter((b) => String(b.due || b.date || b.productionDate || b.startDate || "").slice(0, 10) === todayKey);
  const todayPlanKg = todayBatches.reduce((sum, b) => sum + (Number(b.plan || b.plannedQty || b.targetQty || 0) || 0), 0);
  const todayKg = todayBatches.reduce((sum, b) => sum + (Number(b.qty || b.amount || b.productionQty || b.done || 0) || 0), 0);
  const achievementRate = todayPlanKg > 0 ? ((todayKg / todayPlanKg) * 100).toFixed(1) : "—";
  const activeNonconforming = (DB.holds || []).filter((h) => {
    const status = String(h?.status || "");
    return !["해제", "종결", "완료"].some((closed) => status.includes(closed));
  });
  const currentMonthKey = localISODate().slice(0, 7);
  const monthShipmentLots = Object.values(DB.lots || {}).filter((lot) => String(lot?.ship?.shipDate || lot?.ship?.date || "").slice(0, 7) === currentMonthKey);
  const shipmentMap = {};
  monthShipmentLots.forEach((lot) => {
    const ship = lot && lot.ship;
    if (!ship) return;
    const customer = ship.customer || "미지정";
    const qty = Number(ship.qty || ship.shipQty || ship.amount || 0) || 0;
    shipmentMap[customer] = (shipmentMap[customer] || 0) + qty;
  });
  const customerShipments = Object.entries(shipmentMap).map(([customer, qty]) => ({ customer, qty })).sort((a,b) => b.qty - a.qty).slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <ProcessStrip />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi textOnly label="금일 생산량" value={todayKg.toLocaleString()} unit={`kg · ${todayBatches.length} LOT`} tone="text-sky-400" caption="오늘 등록된 생산 실적" />
        <Kpi textOnly label="목표 달성률" value={achievementRate} unit="%" tone="text-emerald-400" caption={todayPlanKg > 0 ? `계획 ${todayPlanKg.toLocaleString()} kg 대비` : "오늘 생산계획 등록 필요"} />
        <Kpi textOnly label="미처리 부적합" value={activeNonconforming.length} unit="건" tone="text-red-400" caption="해제·종결·완료되지 않은 보류" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="입도 관리도 (SPC) — 규격 < 10 μm · CTQ" right={<Badge tone="gray">CTQ</Badge>}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={PARTICLE_SPC}>
              <CartesianGrid stroke="#16283E" strokeDasharray="3 3" />
              <XAxis dataKey="b" stroke="#8AA3C0" fontSize={11} />
              <YAxis stroke="#8AA3C0" fontSize={11} domain={[0, 11]} />
              <Tooltip {...chartTooltip} />
              <ReferenceLine y={10} stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 4" label={{ value: "USL 10", fill: "#7dd3fc", fontSize: 11, fontWeight: 700, position: "insideTopRight" }} />
              <Line type="monotone" dataKey="v" name="입도 규격(μm)" stroke="#34d399" strokeWidth={2} dot={(props) => <SpecDot {...props} hi={10} />} activeDot={(props) => <SpecDot {...props} hi={10} />} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="점도 관리도 (SPC) — 규격 1,500±300 cP · CTQ" right={<Badge tone="gray">CTQ</Badge>}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={VISCO_SPC}>
              <CartesianGrid stroke="#16283E" strokeDasharray="3 3" />
              <XAxis dataKey="b" stroke="#8AA3C0" fontSize={11} />
              <YAxis stroke="#8AA3C0" fontSize={11} domain={[1100, 1900]} />
              <Tooltip {...chartTooltip} />
              <ReferenceLine y={1800} stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 4" label={{ value: "USL 1,800", fill: "#7dd3fc", fontSize: 11, fontWeight: 700, position: "insideTopRight" }} />
              <ReferenceLine y={1500} stroke="#8AA3C0" strokeDasharray="2 4" label={{ value: "CL 1,500", fill: "#C5D5E8", fontSize: 10, position: "insideRight" }} />
              <ReferenceLine y={1200} stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 4" label={{ value: "LSL 1,200", fill: "#7dd3fc", fontSize: 11, fontWeight: 700, position: "insideBottomRight" }} />
              <Line type="monotone" dataKey="v" name="점도(cP)" stroke="#33C1E8" strokeWidth={2} dot={(props) => <SpecDot {...props} lo={1200} hi={1800} />} activeDot={(props) => <SpecDot {...props} lo={1200} hi={1800} />} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="고형분 관리도 (SPC) — 규격 20.0±1.0 wt% · CTQ" right={<Badge tone="gray">CTQ</Badge>}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={SOLID_SPC}>
              <CartesianGrid stroke="#16283E" strokeDasharray="3 3" />
              <XAxis dataKey="b" stroke="#8AA3C0" fontSize={11} />
              <YAxis stroke="#8AA3C0" fontSize={11} domain={[18.5, 21.5]} />
              <Tooltip {...chartTooltip} />
              <ReferenceLine y={21.0} stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 4" label={{ value: "USL 21", fill: "#7dd3fc", fontSize: 11, fontWeight: 700, position: "insideTopRight" }} />
              <ReferenceLine y={20.0} stroke="#8AA3C0" strokeDasharray="2 4" label={{ value: "CL 20.0", fill: "#C5D5E8", fontSize: 10, position: "insideRight" }} />
              <ReferenceLine y={19.0} stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 4" label={{ value: "LSL 19", fill: "#7dd3fc", fontSize: 11, fontWeight: 700, position: "insideBottomRight" }} />
              <Line type="monotone" dataKey="v" name="고형분(wt%)" stroke="#a78bfa" strokeWidth={2} dot={(props) => <SpecDot {...props} lo={19} hi={21} />} activeDot={(props) => <SpecDot {...props} lo={19} hi={21} />} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="고객사별 당월 출하량 (출하확정 kg)" right={<span className="text-xs text-slate-400">OQC 합격 저장 시 자동 반영</span>}>
          {customerShipments.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={customerShipments} layout="vertical" margin={{ left: 8, right: 18 }}>
                <CartesianGrid stroke="#16283E" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#8AA3C0" fontSize={11} />
                <YAxis type="category" dataKey="customer" stroke="#8AA3C0" fontSize={11} width={92} />
                <Tooltip {...chartTooltip} formatter={(value) => [`${Number(value).toLocaleString()} kg`, "출하량"]} />
                <Bar dataKey="qty" name="출하량(kg)" fill="#33C1E8" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="qmes-dashboard-empty">등록된 고객사별 출하 실적이 없습니다.</div>
          )}
        </Panel>

        <Panel title="부적합 파레토 (당월)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PARETO}>
              <CartesianGrid stroke="#16283E" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#8AA3C0" fontSize={10} interval={0} />
              <YAxis stroke="#8AA3C0" fontSize={11} allowDecimals={false} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="count" name="건수" fill="#f87171" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="실시간 알람" right={<Badge tone="red">{ALARMS.length}건</Badge>}>
          <ul className="flex flex-col gap-3">
            {ALARMS.length === 0 && <li className="qmes-dashboard-empty qmes-dashboard-empty-success">현재 이상 알람이 없습니다.</li>}
            {ALARMS.map((a, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${a.level === "심각" ? "text-red-400" : a.level === "경고" ? "text-amber-400" : "text-slate-400"}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{a.time}</span>
                    <span className="text-xs text-slate-400">{a.eq}</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{a.msg}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* ──────────────────────────── 생산 관리 (배치) ──────────────────────────── */

