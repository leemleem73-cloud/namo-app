/* QMES module: lot — extracted from index.html without logic changes. */

const STAGE_META = {
  수입: { icon: ArrowDownToLine, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/40", line: "bg-violet-500/40" },
  생산: { icon: FlaskConical, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/40", line: "bg-sky-500/40" },
  출하: { icon: Truck, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/40", line: "bg-emerald-500/40" },
};

function resultTone(r) {
  if (r.includes("불합격")) return "red";
  if (r.includes("진행중")) return "blue";
  if (r.includes("조건부")) return "amber";
  return "green";
}

function TraceTab() {
  const lotIds = Object.keys(DB.lots);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(lotIds[0]);
  const lot = DB.lots[selected];
  const dec = decodeLot(selected);

  if (!lot) {
    return (
      <Panel title="Lot 추적">
        <p className="text-sm text-slate-500">등록된 Lot이 없습니다 — 작업지시 발행 후 생산·검사 실적이 기록되면 Lot 이력이 자동 생성됩니다.</p>
      </Panel>
    );
  }

  const filtered = lotIds.filter(
    (id) => id.toLowerCase().includes(query.toLowerCase()) || DB.lots[id].itemName.includes(query)
  );

  const stageDone = (s) => {
    if (lot.stage === "출하") return true;
    if (lot.stage === "생산") return s !== "출하";
    return s === "수입";
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Lot 검색">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-3 py-2 focus-within:border-sky-500">
          <Search size={15} className="text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Lot 번호 또는 품명 검색 (예: CBG0701)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {filtered.length === 0 && <p className="text-sm text-slate-500">일치하는 Lot이 없습니다. 번호를 다시 확인해 주세요.</p>}
          {filtered.map((id) => (
            <button key={id} onClick={() => setSelected(id)}
              className={`px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                selected === id ? "bg-sky-500/15 border-sky-500/50 text-sky-300" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
              }`}>
              {id} <span className="text-slate-500 ml-1">{DB.lots[id].itemName}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Lot 채번 체계: [생산사이트 A외부(OEM)/B Lab/C Pilot/D 양산][년도 A=2025, B=2026…][월 A=1월…G=7월][일 2자리][당일 일련번호] — 예: <span className="font-mono text-slate-400">CBG0701</span> = Pilot · 2026년 7월 1일 · 01호
        </p>
      </Panel>

      <Panel
        title={`Lot 이력 — ${selected}`}
        right={<Badge tone={lot.status.includes("출하완료") ? "green" : lot.status.includes("근접") || lot.status.includes("격리") ? "amber" : "blue"}>{lot.status}</Badge>}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div><div className="text-xs text-slate-500">품목</div><div className="text-sm text-slate-100 mt-0.5">{lot.itemName}</div></div>
          <div><div className="text-xs text-slate-500">수량</div><div className="text-sm text-slate-100 mt-0.5 tabular-nums">{lot.qty}</div></div>
          <div><div className="text-xs text-slate-500">배치번호</div><div className="text-xs text-sky-300 mt-1 font-mono">{lot.wo}</div></div>
          <div><div className="text-xs text-slate-500">현재 단계</div><div className="text-sm text-slate-100 mt-0.5">{lot.stage}</div></div>
        </div>

        {dec && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded px-3 py-2 mb-4">
            <span className="text-[11px] text-slate-500">Lot 해석:</span>
            <span className="font-mono text-xs text-sky-300">{selected}</span>
            <ChevronRight size={12} className="text-slate-600" />
            <Badge tone="blue">{dec.site}</Badge>
            <Badge tone="gray">{dec.year}년 {dec.month}월 {String(dec.day).padStart(2, "0")}일</Badge>
            <Badge tone="gray">당일 순번 {String(dec.seq).padStart(2, "0")}</Badge>
            {lot.item === "NBA20-HM01" && (
              <span className="text-[11px] text-slate-400">
                · Grd <span className="font-mono text-violet-300">NBA20-HM01</span> = N(NMP) · B(Boehmite) · A(PVdF/SBR) · 20(TSC 20%) · HM(Hyundai Motor) 시리즈
              </span>
            )}
          </div>
        )}

        {lot.binderLot && (
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded px-3 py-2 mb-4">
            <Beaker size={14} className="text-violet-400 shrink-0" />
            <span className="text-xs text-slate-300">중간 Lot (바인더): <span className="font-mono text-violet-300">{lot.binderLot}</span></span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {["수입", "생산", "출하"].map((s, i) => {
            const m = STAGE_META[s];
            const done = stageDone(s);
            const current = lot.stage === s;
            return (
              <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 justify-center ${done ? m.bg : "bg-slate-800/50 border-slate-700/60"}`}>
                  <m.icon size={15} className={done ? m.color : "text-slate-600"} />
                  <span className={`text-sm font-medium ${done ? "text-slate-100" : "text-slate-600"}`}>{s}</span>
                  {current && <CircleDot size={13} className={`${m.color} animate-pulse`} />}
                </div>
                {i < 2 && <ChevronRight size={16} className="text-slate-600 shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="mt-5 relative">
          {lot.steps.map((st, i) => {
            const m = STAGE_META[st.stage];
            const last = i === lot.steps.length - 1;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${m.bg}`}>
                    <m.icon size={13} className={m.color} />
                  </div>
                  {!last && <div className={`w-px flex-1 ${m.line}`} />}
                </div>
                <div className={`min-w-0 flex-1 ${last ? "pb-1" : "pb-5"}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-slate-100">{st.name}</span>
                    <Badge tone={resultTone(st.result)}>{st.result}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{st.time}</div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{st.detail}</p>
                  <div className="text-[11px] text-slate-500 mt-0.5">담당: {st.by}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="투입 원재료 역추적 (Backward Trace)"
        right={<span className="flex items-center gap-1 text-xs text-slate-400"><GitBranch size={13} /> 원료 Lot {lot.materials.length}건</span>}
      >
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="text-left py-2 pr-3 font-medium">원료 Lot</th>
                <th className="text-left py-2 pr-3 font-medium">자재코드</th>
                <th className="text-left py-2 pr-3 font-medium">품명</th>
                <th className="text-left py-2 pr-3 font-medium whitespace-nowrap">공급사</th>
                <th className="text-right py-2 pr-3 font-medium">투입량</th>
                <th className="text-left py-2 pr-3 font-medium">입고일시</th>
                <th className="text-left py-2 font-medium">수입검사</th>
              </tr>
            </thead>
            <tbody>
              {lot.materials.map((mat) => (
                <tr key={mat.lot} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3 font-mono text-xs text-violet-300">{mat.lot}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-slate-400">{mat.code}</td>
                  <td className="py-2.5 pr-3 text-slate-100">{mat.name}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{mat.supplier}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{mat.qty}</td>
                  <td className="py-2.5 pr-3 text-xs font-mono text-slate-400">{mat.recv}</td>
                  <td className="py-2.5"><Badge tone={mat.iqc.includes("합격") ? "green" : "amber"}>{mat.iqc}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          원료 부적합 발견 시 해당 원료 Lot이 투입된 바인더·슬러리 Lot을 역조회하여 격리 범위를 확정합니다 (즉시 격리 → 사용차단 → 협력사 통보 → 원인분석 → 재검사/불합격).
        </p>
      </Panel>

      <Panel title="출하 정보 (Forward Trace)" right={<ArrowUpFromLine size={14} className="text-emerald-400" />}>
        {lot.ship ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><div className="text-xs text-slate-500">고객사</div><div className="text-sm text-slate-100 mt-0.5">{lot.ship.customer}</div></div>
            <div><div className="text-xs text-slate-500">출하번호</div><div className="text-xs text-emerald-300 font-mono mt-1">{lot.ship.no}</div></div>
            <div><div className="text-xs text-slate-500">출하일</div><div className="text-sm text-slate-100 mt-0.5 tabular-nums">{lot.ship.date}</div></div>
            <div><div className="text-xs text-slate-500">납품처</div><div className="text-sm text-slate-100 mt-0.5">{lot.ship.dest}</div></div>
            <div><div className="text-xs text-slate-500">송장번호</div><div className="text-xs text-slate-300 font-mono mt-1">{lot.ship.invoice}</div></div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <Boxes size={16} className="text-slate-500" />
            아직 출하되지 않은 Lot입니다. OQC 합격 및 포장 완료 후 출하 정보가 기록됩니다. 파손 용기는 교체 후 수분/고형분/점도 재검사 → 적합 시에만 출하합니다.
          </div>
        )}
      </Panel>

      {lot.item === "NBA20-HM01" && dec && (
        <Panel title="제품 라벨 미리보기 (라벨 예시 양식)">
          <div className="doc-paper bg-white text-slate-900 rounded border border-slate-300 max-w-sm overflow-hidden">
            {[
              ["제품명 (Grd.)", "NBA20-HM01"],
              ["제조번호 (Lot. No)", selected],
              ["수량 (Qty)", lot.qty],
              ["제조일 (Mfg. Date)", `${dec.year}.${String(dec.month).padStart(2, "0")}.${String(dec.day).padStart(2, "0")}`],
            ].map(([k, v], i) => (
              <div key={i} className={`grid grid-cols-2 text-sm ${i > 0 ? "border-t border-slate-300" : ""}`}>
                <div className="px-3 py-2 bg-slate-50 text-slate-500 text-xs flex items-center">{k}</div>
                <div className="px-3 py-2 font-medium border-l border-slate-300 font-mono text-xs flex items-center">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">GHS 경고 그림문자(경고·건강유해성·수생환경유해성) 및 취급주의 문구는 실제 라벨 출력 시 포함됩니다.</p>
        </Panel>
      )}
    </div>
  );
}

/* ──────────────────────────── SPC / 공정능력 (Cpk) 탭 ──────────────────────────── */

