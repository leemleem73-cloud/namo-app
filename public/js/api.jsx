/* QMES module: api — extracted from index.html without logic changes. */

function InventoryTab() {
  const short = INVENTORY.filter((i) => i.stock < i.safety);
  return (
    <div className="flex flex-col gap-4">
      {short.length > 0 && INVENTORY.some((i) => i.stock > 0) && (
        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">
            안전재고 미달 {short.length}건 — {short.map((s) => s.name).join(", ")}. 구매 발주 검토가 필요합니다.
          </p>
        </div>
      )}
      <Panel title="원재료 · 부자재 재고 현황" right={<span className="text-xs text-slate-400">총 {INVENTORY.length}개 품목</span>}>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="text-left py-2 pr-3 font-medium">자재코드</th>
                <th className="text-left py-2 pr-3 font-medium whitespace-nowrap">품명</th>
                <th className="text-right py-2 pr-3 font-medium">현재고</th>
                <th className="text-right py-2 pr-3 font-medium">안전재고</th>
                <th className="text-left py-2 pr-3 font-medium w-36">재고 수준</th>
                <th className="text-left py-2 pr-3 font-medium">보관위치</th>
                <th className="text-left py-2 pr-3 font-medium">보관조건</th>
                <th className="text-left py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.map((i) => {
                const ratio = Math.min((i.stock / (i.safety * 2)) * 100, 100);
                const low = i.stock < i.safety;
                return (
                  <tr key={i.code} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2.5 pr-3 font-mono text-xs text-sky-300">{i.code}</td>
                    <td className="py-2.5 pr-3 text-slate-100">{i.name}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-100 font-medium">
                      {i.stock.toLocaleString()} <span className="text-xs text-slate-500">{i.unit}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-400">{i.safety.toLocaleString()}</td>
                    <td className="py-2.5 pr-3">
                      <div className="h-1.5 bg-slate-800 rounded overflow-hidden">
                        <div className={`h-full rounded ${low ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${ratio}%` }} />
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-400">{i.loc}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-400">{i.cond}</td>
                    <td className="py-2.5">{low ? <Badge tone="amber">부족</Badge> : <Badge tone="green">정상</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          창고 25±5℃ · 습도 50% 이하, 드라이룸 RH 0.54% 이하 / DP -40℃ · 선입선출(FIFO) 관리 — 관리계획서 공정 30 기준.
        </p>
      </Panel>
    </div>
  );
}

/* ──────────────────────────── 설비 모니터링 ──────────────────────────── */

function EquipmentTab() {
  const TODAY = new Date().toISOString().slice(0, 10);
  if (DB.eqDate !== TODAY) { DB.eqDate = TODAY; DB.eqReadings = {}; dbSave(); } // 일일 점검표 — 날짜가 바뀌면 점검현황 초기화 (기록·알람 이력은 유지)

  const [eqId, setEqId] = useState(EQUIPMENT[0].id);
  const [pk, setPk] = useState(EQUIPMENT[0].params[0].k);
  const [val, setVal] = useState("");
  const [visOk, setVisOk] = useState(null);
  const [tried, setTried] = useState(false);
  const [readings, setReadings] = useState(DB.eqReadings);
  const [logs, setLogs] = useState(DB.eqLogs);
  const [alarms, setAlarms] = useState(DB.eqAlarms);
  const [mode, setMode] = useState("single");
  const [tourIdx, setTourIdx] = useState(0);
  const [tourVals, setTourVals] = useState({});
  const [tourTried, setTourTried] = useState(false);

  const eq = EQUIPMENT.find((e) => e.id === eqId);
  const param = eq.params.find((x) => x.k === pk) || eq.params[0];
  const isVisual = !!param.visual;
  const trimmed = val.trim();
  const numOk = /^-?\d+(\.\d+)?$/.test(trimmed);
  const inputError = !isVisual && trimmed !== "" && !numOk ? "숫자만 입력할 수 있습니다 — 저장 진입 금지" : null;
  const num = parseFloat(trimmed);
  const judge = isVisual
    ? (visOk == null ? null : visOk ? "정상" : "이탈")
    : (trimmed === "" || !numOk ? null : ((param.lo == null || num >= param.lo) && (param.hi == null || num <= param.hi)) ? "정상" : "이탈");
  const triedErrors = [];
  if (tried && judge == null && !inputError) triedErrors.push(isVisual ? "이상 없음 / 이상 발견 중 하나를 선택하세요" : "판독값을 입력하세요");

  const selectParam = (id, k) => { setEqId(id); setPk(k); setVal(""); setVisOk(null); setTried(false); };

  const save = () => {
    if (judge == null || inputError) { setTried(true); return; }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const display = isVisual ? (visOk ? "이상 없음" : "이상 발견") : `${trimmed} ${param.unit || ""}`.trim();
    const nextReadings = { ...readings, [`${eq.id}:${param.k}`]: { v: display, ok: judge === "정상", time } };
    const nextLogs = [{ time, eqName: eq.name, item: param.label, v: display, judge, by: window.__QMES_USER__ || "-" }, ...logs];
    setReadings(nextReadings); setLogs(nextLogs);
    DB.eqReadings = nextReadings; DB.eqLogs = nextLogs;
    if (judge === "이탈") {
      const nextAlarms = [{ time, eq: eq.id, msg: `${param.label} ${display} — 관리기준(${param.spec}) 이탈, 점검·조치 필요`, level: "경고" }, ...alarms];
      setAlarms(nextAlarms); DB.eqAlarms = nextAlarms;
    }
    dbSave();
    setVal(""); setVisOk(null); setTried(false);
  };

  /* ── 순회 점검 (설비 앞에서 PLC 육안 확인 → 전 항목 기록 → 다음 설비) ── */
  const tourEq = EQUIPMENT[tourIdx];
  const tourJudge = (x, raw) => {
    if (x.visual) return raw === true ? "정상" : raw === false ? "이탈" : null;
    const t = String(raw ?? "").trim();
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    const n = parseFloat(t);
    return ((x.lo == null || n >= x.lo) && (x.hi == null || n <= x.hi)) ? "정상" : "이탈";
  };
  const tourSave = () => {
    if (tourEq.params.some((x) => tourJudge(x, tourVals[x.k]) == null)) { setTourTried(true); return; }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    let nr = { ...readings }; let nl = [...logs]; let na = [...alarms];
    tourEq.params.forEach((x) => {
      const raw = tourVals[x.k];
      const j = tourJudge(x, raw);
      const display = x.visual ? (raw ? "이상 없음" : "이상 발견") : `${String(raw).trim()} ${x.unit || ""}`.trim();
      nr[`${tourEq.id}:${x.k}`] = { v: display, ok: j === "정상", time };
      nl = [{ time, eqName: tourEq.name, item: x.label, v: display, judge: j, by: window.__QMES_USER__ || "-" }, ...nl];
      if (j === "이탈") na = [{ time, eq: tourEq.id, msg: `${x.label} ${display} — 관리기준(${x.spec}) 이탈, 점검·조치 필요`, level: "경고" }, ...na];
    });
    setReadings(nr); setLogs(nl); setAlarms(na);
    DB.eqReadings = nr; DB.eqLogs = nl; DB.eqAlarms = na;
    dbSave();
    setTourVals({}); setTourTried(false);
    if (tourIdx < EQUIPMENT.length - 1) setTourIdx(tourIdx + 1);
    else { setMode("single"); setTourIdx(0); }
  };
  const totalParams = EQUIPMENT.reduce((a, e) => a + e.params.length, 0);
  const doneParams = EQUIPMENT.reduce((a, e) => a + e.params.filter((x) => readings[`${e.id}:${x.k}`]).length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ClipboardList size={15} className="text-amber-400 shrink-0" />
          <p className="text-sm text-slate-300">
            <span className="text-amber-400 font-medium">PLC·계측기 육안 확인 → iPad 기록</span> 체제 — 판정은 시스템 자동, 이탈 시 즉시 알람. 판독값 항목은 향후 PLC 자동 수집 전환 대상입니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doneParams < totalParams
            ? <Badge tone="amber">금일 점검 {doneParams}/{totalParams} — 미완료</Badge>
            : <Badge tone="green">금일 점검 완료 {doneParams}/{totalParams}</Badge>}
          {mode === "single" && (
            <button onClick={() => { setMode("tour"); setTourIdx(0); setTourVals({}); setTourTried(false); }}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors">
              <RotateCw size={13} /> 순회 점검 시작
            </button>
          )}
        </div>
      </div>

      {/* 순회 점검 모드 */}
      {mode === "tour" && (
      <Panel title={`순회 점검 ${tourIdx + 1} / ${EQUIPMENT.length} — ${tourEq.name}`}
        right={<button onClick={() => setMode("single")} className="text-[11px] px-2.5 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">순회 종료</button>}>
        <p className="text-xs text-slate-400 mb-3">설비 앞에서 PLC 패널·계측기를 육안 확인한 뒤 항목을 순서대로 기록하세요. 전 항목 기록 전에는 다음 설비로 진입할 수 없습니다.</p>
        <div className="flex flex-col gap-2.5">
          {tourEq.params.map((x) => {
            const raw = tourVals[x.k];
            const j = tourJudge(x, raw);
            return (
              <div key={x.k} className="flex flex-col md:flex-row md:items-center gap-2 bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2.5">
                <div className="md:w-64 shrink-0">
                  <div className="text-sm text-slate-100">{x.label}</div>
                  <div className="text-[11px] text-slate-500">기준 {x.spec} · {x.src}</div>
                </div>
                {x.visual ? (
                  <div className="flex gap-2 flex-1">
                    <button onClick={() => setTourVals({ ...tourVals, [x.k]: true })}
                      className={`flex-1 rounded border px-3 py-2.5 text-sm font-medium transition-colors ${raw === true ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}>이상 없음</button>
                    <button onClick={() => setTourVals({ ...tourVals, [x.k]: false })}
                      className={`flex-1 rounded border px-3 py-2.5 text-sm font-medium transition-colors ${raw === false ? "bg-red-500/20 border-red-500/60 text-red-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}>이상 발견</button>
                  </div>
                ) : (
                  <input inputMode="decimal" value={raw ?? ""} onChange={(e) => setTourVals({ ...tourVals, [x.k]: e.target.value })}
                    placeholder={`판독값 입력 ${x.unit ? `(${x.unit})` : ""}`}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-base text-center tabular-nums text-slate-100 placeholder-slate-500 placeholder:text-sm focus:outline-none focus:border-sky-500" />
                )}
                <div className="md:w-16 text-center shrink-0">
                  {j == null ? <Badge tone="gray">대기</Badge> : j === "정상" ? <Badge tone="green">정상</Badge> : <Badge tone="red">이탈</Badge>}
                </div>
              </div>
            );
          })}
        </div>
        {tourTried && tourEq.params.some((x) => tourJudge(x, tourVals[x.k]) == null) && (
          <div className="mt-2 bg-red-500/10 border border-red-500/40 rounded px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-red-300"><XCircle size={13} className="shrink-0" /> 미기록 또는 형식 오류 항목이 있습니다 — 전 항목 기록 전 다음 설비 진입 금지</div>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => { if (tourIdx > 0) { setTourIdx(tourIdx - 1); setTourVals({}); setTourTried(false); } }}
            className={`px-4 py-2.5 rounded-lg border text-sm transition-colors ${tourIdx === 0 ? "border-slate-800 text-slate-600" : "border-slate-600 text-slate-300 hover:bg-slate-800"}`}>
            ← 이전 설비
          </button>
          <button onClick={tourSave}
            className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold transition-colors">
            {tourIdx < EQUIPMENT.length - 1 ? "이 설비 기록 저장 → 다음 설비" : "이 설비 기록 저장 · 순회 완료"}
          </button>
        </div>
      </Panel>
      )}

      {/* 개별 점검 입력 (단일 모드) */}
      {mode === "single" && (
      <Panel title="설비 점검 입력 (개별)" right={<span className="text-xs text-slate-400">관리기준: <span className="text-sky-300">{param.spec}</span> · {param.src}</span>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
            <span className="text-[10px] text-slate-500">설비</span>
            <select value={eqId} onChange={(e) => { const ne = EQUIPMENT.find((x) => x.id === e.target.value); setEqId(ne.id); setPk(ne.params[0].k); setVal(""); setVisOk(null); }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
              {EQUIPMENT.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">관리항목</span>
            <select value={param.k} onChange={(e) => { setPk(e.target.value); setVal(""); setVisOk(null); }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
              {eq.params.map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}
            </select>
          </div>
          {isVisual ? (
            <div className="flex gap-2 col-span-2">
              <button onClick={() => setVisOk(true)}
                className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${visOk === true ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}>
                이상 없음
              </button>
              <button onClick={() => setVisOk(false)}
                className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${visOk === false ? "bg-red-500/20 border-red-500/60 text-red-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}>
                이상 발견
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-[10px] text-slate-500">판독값 {param.unit && `(${param.unit})`}</span>
              <input inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)}
                placeholder={`판독값 입력 — 기준 ${param.spec}`}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm tabular-nums text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            </div>
          )}
          <div className="flex items-center gap-2">
            {judge == null ? <Badge tone="gray">대기</Badge> : judge === "정상" ? <Badge tone="green">정상</Badge> : <Badge tone="red">이탈</Badge>}
            <button onClick={save}
              className="flex-1 flex items-center justify-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors bg-sky-600 hover:bg-sky-500 text-white">
              <Plus size={14} /> 기록
            </button>
          </div>
        </div>
        {(inputError || triedErrors.length > 0) && (
          <div className="mt-2 bg-red-500/10 border border-red-500/40 rounded px-3 py-2">
            {[inputError, ...triedErrors].filter(Boolean).map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-300"><XCircle size={13} className="shrink-0" /> {e}</div>
            ))}
          </div>
        )}
      </Panel>
      )}

      {/* 설비 카드 — 기록값 실시간 반영, 항목 클릭 시 입력으로 연결 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {EQUIPMENT.map((e) => {
          const rs = e.params.map((x) => readings[`${e.id}:${x.k}`]);
          const bad = rs.some((r) => r && !r.ok);
          const done = rs.filter(Boolean).length;
          const st = bad ? "alarm" : done > 0 ? "run" : "idle";
          const m = statusMeta[st];
          return (
            <div key={e.id} className={`bg-slate-900 border ${m.ring} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu size={16} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-100 truncate">{e.name}</span>
                </div>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${m.dot} ${st === "run" ? "animate-pulse" : ""}`} />
                  <span className={`text-xs font-medium ${m.text}`}>{st === "run" ? "점검중" : m.label}</span>
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{e.id}</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">금일 점검</span>
                  <span className="tabular-nums text-slate-200">{done} / {e.params.length}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded overflow-hidden">
                  <div className={`h-full rounded ${bad ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${(done / e.params.length) * 100}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-3">
                {e.params.map((x, i) => {
                  const r = readings[`${e.id}:${x.k}`];
                  return (
                    <button key={x.k} onClick={() => selectParam(e.id, x.k)}
                      className="flex items-center justify-between bg-slate-800/60 hover:bg-slate-800 rounded px-2.5 py-2 gap-2 text-left transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        {i === 0 ? <Thermometer size={13} className="text-amber-400 shrink-0" /> : <Gauge size={13} className="text-sky-400 shrink-0" />}
                        <span className="text-[11px] text-slate-400 truncate">{x.label} ({x.spec})</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs tabular-nums ${r ? (r.ok ? "text-slate-200" : "text-red-400 font-medium") : "text-slate-500"}`}>{r ? r.v : "—"}</span>
                        {r && <span className="text-[9px] text-slate-500 font-mono">{r.time}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 점검 기록 */}
      <Panel title="설비 점검 기록" right={<span className="text-xs text-slate-400">{logs.length}건 · 기록자 자동 저장</span>}>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">점검 기록이 없습니다 — 위 [설비 점검 입력]에서 판독값을 기록하세요. 설비 카드의 항목을 클릭해도 바로 입력으로 연결됩니다.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-800">
                  <th className="text-left py-2 pr-3 font-medium">시각</th>
                  <th className="text-left py-2 px-3 font-medium">설비</th>
                  <th className="text-left py-2 pr-3 font-medium">관리항목</th>
                  <th className="text-left py-2 pr-3 font-medium">판독값</th>
                  <th className="text-left py-2 pr-3 font-medium">판정</th>
                  <th className="text-left py-2 font-medium">기록자</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2.5 pr-3 text-xs font-mono text-slate-400">{l.time}</td>
                    <td className="py-2.5 pr-3 text-slate-100 text-xs">{l.eqName}</td>
                    <td className="py-2.5 pr-3 text-slate-300 text-xs">{l.item}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-200">{l.v}</td>
                    <td className="py-2.5 pr-3"><Badge tone={l.judge === "정상" ? "green" : "red"}>{l.judge}</Badge></td>
                    <td className="py-2.5 text-xs text-slate-400">{l.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* 알람 이력 */}
      <Panel title="설비 · 공정 알람 이력" right={<Badge tone="red">{alarms.length}건</Badge>}>
        <ul className="flex flex-col divide-y divide-slate-800/60">
          {alarms.length === 0 && <li className="py-1 text-sm text-slate-500">알람 이력이 없습니다 — 관리기준 이탈 기록 시 자동 발생합니다.</li>}
          {alarms.map((a, i) => (
            <li key={i} className="flex items-start gap-3 py-2.5">
              <Badge tone="amber">{a.level}</Badge>
              <span className="text-xs font-mono text-slate-500 w-12 shrink-0 pt-0.5">{a.time}</span>
              <span className="text-xs text-slate-400 w-24 shrink-0 pt-0.5 font-mono">{a.eq}</span>
              <span className="text-sm text-slate-200">{a.msg}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ──────────────────────────── Lot 추적 탭 ──────────────────────────── */

