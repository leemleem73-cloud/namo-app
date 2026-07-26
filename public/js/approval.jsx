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

      {/* 게이트 규칙 */}
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

      {/* 부적합 격리 Rack 현황 — 개선요청 6번: 실물 격리와 시스템 홀드 1:1 연결 */}
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

      {/* 홀드 목록 */}
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

