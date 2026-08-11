/* QMES module: api — extracted from index.html without logic changes. */

function InventoryRealtimeSummary() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    const events = [
      "qmes:data-updated",
      "qmes:data-changed",
      "qmes:inventory-stage3-ready",
      "qmes:inventory-lot-validation-ready",
      "focus",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, refresh));
  }, []);

  const number = (value) => {
    const parsed = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const format = (value) => number(value).toLocaleString("ko-KR", { maximumFractionDigits: 3 });
  const lotRows = typeof window.qmesBuildInventoryLotRows === "function"
    ? (window.qmesBuildInventoryLotRows() || [])
    : [];
  const current = lotRows.reduce((sum, row) => sum + number(row?.remaining), 0);
  const hold = lotRows.filter((row) => row?.hold).reduce((sum, row) => sum + number(row?.remaining), 0);
  const available = Math.max(0, current - hold);
  const lots = lotRows.filter((row) => number(row?.remaining) > 0).length;
  const validation = typeof window.qmesValidateInventoryLotFlow === "function"
    ? window.qmesValidateInventoryLotFlow()
    : null;
  const errors = number(validation?.counts?.errors);
  const warnings = number(validation?.counts?.warnings);
  const cards = [
    ["현재고 합계", `${format(current)} kg`],
    ["가용재고", `${format(available)} kg`],
    ["홀드재고", `${format(hold)} kg`],
    ["재고 LOT 수", `${lots} LOT`],
  ];

  return (
    <section data-version={version} className="rounded-xl border border-sky-900/70 bg-sky-950/30 p-4">
      <div className="text-sm font-black text-sky-300 mb-3">실시간 재고 요약 · QMES 연동</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-lg font-black mt-1">{value}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 text-xs text-slate-400">
        <span>LOT 수불 자동검증</span>
        <b className={errors ? "text-amber-300" : "text-emerald-300"}>오류 {errors}건</b>
        <span>경고 {warnings}건</span>
      </div>
    </section>
  );
}

function InventoryTab() {
  const [inventoryVersion, setInventoryVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setInventoryVersion((value) => value + 1);
    const events = ["qmes:data-updated", "qmes:data-changed", "qmes:inventory-stage3-ready", "focus"];
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, refresh));
  }, []);

  const fallbackStorageLocation = (name) => {
    const key = String(name || "").toUpperCase().replace(/[^A-Z0-9가-힣]/g, "");
    if (key.includes("NMP")) return "A-5-1 / A-5-2 / A-6-2";
    if (key.includes("BYK180") || key.includes("분산제")) return "A-3-2 / A-4-1";
    if (key.includes("AOH30") || key.includes("BOEHMITE")) return "A-4-1 / A-4-2";
    if (key.includes("PVDF")) return "A-1-1 / A-3-1";
    if (key.includes("SBS")) return "A-1-1";
    if (key.includes("SBR")) return "A-2-1 / A-2-2";
    if (key.includes("PAI")) return "A-1-2";
    if (key.includes("KTR201")) return "A-6-1";
    if (key.includes("SOLEF5140")) return "A-3-2";
    if (key.includes("NBA20HM05")) return "B-2-1 / B-3-1";
    return "미지정";
  };
  const fallbackInventoryRows = (Array.isArray(INVENTORY) ? INVENTORY : [])
    .filter((row) => {
      const nameKey = String(row?.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      return nameKey !== "CAN20" && String(row?.code || "") !== "PK-CAN20";
    })
    .map((row) => ({
      ...row,
      loc: fallbackStorageLocation(row?.name),
      cond: "25±5℃ · 습도 50%↓",
    }));
  const inventoryRows = typeof window.qmesBuildInventoryRows === "function"
    ? (window.qmesBuildInventoryRows() || [])
    : fallbackInventoryRows;
  const finishedRows = typeof window.qmesBuildFinishedGoodsRows === "function"
    ? (window.qmesBuildFinishedGoodsRows() || [])
    : [];
  const short = inventoryRows.filter((i) => i.stock < i.safety);
  return (
    <div className="flex flex-col gap-4" data-inventory-version={inventoryVersion}>
      <InventoryRealtimeSummary />
      {short.length > 0 && inventoryRows.some((i) => i.stock > 0) && (
        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">
            안전재고 미달 {short.length}건 — {short.map((s) => s.name).join(", ")}. 구매 발주 검토가 필요합니다.
          </p>
        </div>
      )}
      <Panel title="원재료 · 부자재 재고 현황" right={<span className="text-xs text-slate-400">총 {inventoryRows.length}개 품목</span>}>
        <div className="overflow-x-auto px-2">
          <div className="mx-auto max-w-[1480px]">
          <table className="w-full table-fixed text-sm min-w-[1080px]">
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
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
              {inventoryRows.map((i) => {
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
        </div>
        <p className="mx-auto max-w-[1480px] px-2 text-[11px] text-slate-500 mt-3">
          모든 원재료·부자재·완제품 공통 보관기준: 25±5℃ · 습도 50%↓ · 선입선출(FIFO) 관리.
        </p>
      </Panel>
      <Panel
        title="완제품 재고 현황"
        right={<span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">초록색 B구역 · 총 {finishedRows.length} LOT</span>}
      >
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="text-left py-2 pr-3 font-medium">완제품 LOT</th>
                <th className="text-left py-2 pr-3 font-medium">품목</th>
                <th className="text-right py-2 pr-3 font-medium">생산량</th>
                <th className="text-right py-2 pr-3 font-medium">출하량</th>
                <th className="text-right py-2 pr-3 font-medium">현재고</th>
                <th className="text-left py-2 pr-3 font-medium">보관구역</th>
                <th className="text-left py-2 pr-3 font-medium">보관조건</th>
                <th className="text-left py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {finishedRows.length > 0 ? finishedRows.map((row) => (
                <tr key={row.lot} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3 font-mono text-xs text-sky-300">{row.lot}</td>
                  <td className="py-2.5 pr-3 text-slate-100">{row.item}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{Number(row.produced || 0).toLocaleString()} {row.unit || "kg"}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{Number(row.shipped || 0).toLocaleString()} {row.unit || "kg"}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-emerald-300">{Number(row.remaining || 0).toLocaleString()} {row.unit || "kg"}</td>
                  <td className="py-2.5 pr-3 text-xs font-bold text-emerald-300">B구역 (B-1-1~B-3-2)</td>
                  <td className="py-2.5 pr-3 text-xs text-slate-400">25±5℃ · 습도 50%↓</td>
                  <td className="py-2.5"><Badge tone={row.status === "출하완료" ? "green" : "blue"}>{row.status || "재고"}</Badge></td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="py-8 text-center text-slate-500">생산 완료된 완제품 재고가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          완제품은 초록색 B구역(B-1-1~B-3-2)에 보관하며, 현황판 손글씨가 아닌 현장 랙 표찰을 기준으로 관리합니다.
        </p>
      </Panel>
    </div>
  );
}

/* ──────────────────────────── 설비 모니터링 ──────────────────────────── */

function EquipmentTab() {
  const TODAY = typeof localISODate === "function"
    ? localISODate()
    : (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      })();
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
  const [tourNotes, setTourNotes] = useState({});
  const [tourTried, setTourTried] = useState(false);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editVisual, setEditVisual] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState("");
  const [historyDate, setHistoryDate] = useState(TODAY);
  const [saving, setSaving] = useState(false);
  const [syncState, setSyncState] = useState("동기화 중");
  const [syncError, setSyncError] = useState("");
  const rawUser = window.__QMES_USER__ || window.__QMES_CURRENT_USER__;
  const currentUser = rawUser && typeof rawUser === "object"
    ? String(rawUser.name || rawUser.uid || "현재 사용자")
    : String(rawUser || "현재 사용자");

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      if (typeof qmesSyncPullEquipment !== "function") {
        if (mounted) setSyncState("이 기기에만 저장");
        return;
      }
      try {
        if (typeof qmesSyncPushPendingEquipment === "function") await qmesSyncPushPendingEquipment();
        const shared = await qmesSyncPullEquipment();
        if (!mounted) return;
        setReadings({...(shared?.readings || DB.eqReadings || {})});
        setLogs([...(shared?.logs || DB.eqLogs || [])]);
        setAlarms([...(shared?.alarms || DB.eqAlarms || [])]);
        setSyncState("PC·모바일 동기화");
        setSyncError("");
      } catch (error) {
        if (!mounted) return;
        setSyncState("동기화 재시도 중");
        setSyncError(error.message || "공용 DB 연결을 확인하세요.");
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const eq = EQUIPMENT.find((e) => e.id === eqId);
  const param = eq.params.find((x) => x.k === pk) || eq.params[0];
  const isVisual = !!param.visual;
  const trimmed = val.trim();
  const numOk = /^-?\d+(\.\d+)?$/.test(trimmed);
  const inputError = !isVisual && trimmed !== "" && !numOk ? "숫자만 입력할 수 있습니다 — 저장 진입 금지" : null;
  const num = parseFloat(trimmed);
  const judge = isVisual
    ? (visOk == null ? null : visOk ? "정상" : "이탈")
    : (trimmed === "" || !numOk ? null : ((param.lo == null || num >= param.lo) && (param.hi == null || (param.hiExclusive ? num < param.hi : num <= param.hi))) ? "정상" : "이탈");
  const triedErrors = [];
  if (tried && judge == null && !inputError) triedErrors.push(isVisual ? "이상 없음 / 이상 발견 중 하나를 선택하세요" : "판독값을 입력하세요");

  const selectParam = (id, k) => { setEqId(id); setPk(k); setVal(""); setVisOk(null); setNote(""); setTried(false); };

  const makeEntry = (targetEq, targetParam, display, result, now, index = 0, entryNote = "") => {
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return {
      id:`EQ-${now.getTime()}-${String(index).padStart(2, "0")}-${Math.random().toString(36).slice(2, 7)}`,
      date:TODAY,
      time,
      recordedAt:now.toISOString(),
      eqId:targetEq.id,
      eqName:targetEq.name,
      paramKey:targetParam.k,
      item:targetParam.label,
      spec:targetParam.spec,
      source:targetParam.src,
      v:display,
      judge:result,
      ok:result === "정상",
      note:String(entryNote || "").trim(),
      by:currentUser,
      sharedSync:false
    };
  };

  const persistEntries = async (entries) => {
    const nextReadings = {...readings};
    entries.forEach((entry) => {
      nextReadings[`${entry.eqId}:${entry.paramKey}`] = {
        v:entry.v,
        ok:entry.ok,
        time:entry.time,
        by:entry.by
      };
    });
    const nextLogs = [...entries, ...logs].slice(0, 3000);
    const nextAlarms = [
      ...entries.filter((entry) => entry.judge === "이탈").map((entry) => ({
        id:entry.id,
        date:entry.date,
        time:entry.time,
        eq:entry.eqId,
        msg:`${entry.item} ${entry.v} — 관리기준(${entry.spec}) 이탈, 점검·조치 필요${entry.note ? ` · 비고: ${entry.note}` : ""}`,
        level:"경고",
        by:entry.by
      })),
      ...alarms
    ].slice(0, 1000);

    setReadings(nextReadings);
    setLogs(nextLogs);
    setAlarms(nextAlarms);
    DB.eqDate = TODAY;
    DB.eqReadings = nextReadings;
    DB.eqLogs = nextLogs;
    DB.eqAlarms = nextAlarms;
    dbSave();

    if (typeof qmesSyncEquipmentEntry !== "function") {
      setSyncState("이 기기에만 저장");
      setSyncError("공용 DB 동기화 기능을 불러오지 못했습니다.");
      return;
    }

    setSaving(true);
    setSyncState("공용 DB 저장 중");
    try {
      await Promise.all(entries.map((entry) => qmesSyncEquipmentEntry(entry)));
      const ids = new Set(entries.map((entry) => entry.id));
      DB.eqLogs = (DB.eqLogs || []).map((entry) => ids.has(entry.id) ? {...entry, sharedSync:true} : entry);
      dbSave();
      setLogs([...DB.eqLogs]);
      setSyncState("PC·모바일 동기화");
      setSyncError("");
    } catch (error) {
      setSyncState("동기화 재시도 중");
      setSyncError(error.message || "공용 DB 연결을 확인하세요.");
    } finally {
      setSaving(false);
    }
  };


  const rebuildEquipmentFromLogs = (sourceLogs) => {
    const ordered = [...(sourceLogs || [])].sort((a, b) => {
      const left = String(a.recordedAt || `${a.date || ""}T${a.time || ""}`);
      const right = String(b.recordedAt || `${b.date || ""}T${b.time || ""}`);
      return right.localeCompare(left);
    }).slice(0, 3000);
    const nextReadings = {};
    ordered.forEach((entry) => {
      if (String(entry.date || "") !== TODAY) return;
      const key = entry.eqId && entry.paramKey ? `${entry.eqId}:${entry.paramKey}` : "";
      if (!key || nextReadings[key]) return;
      nextReadings[key] = {v:entry.v, ok:entry.judge === "정상", time:entry.time || "", by:entry.by || ""};
    });
    const nextAlarms = ordered
      .filter((entry) => entry.judge === "이탈")
      .map((entry) => ({
        id:entry.id,
        date:entry.date || "",
        time:entry.time || "",
        eq:entry.eqId || "",
        msg:`${entry.item || "관리항목"} ${entry.v || ""} — 관리기준(${entry.spec || "-"}) 이탈, 점검·조치 필요${entry.note ? ` · 비고: ${entry.note}` : ""}`,
        level:"경고",
        by:entry.by || ""
      }))
      .slice(0, 1000);
    DB.eqDate = TODAY;
    DB.eqLogs = ordered;
    DB.eqReadings = nextReadings;
    DB.eqAlarms = nextAlarms;
    dbSave();
    setLogs([...ordered]);
    setReadings({...nextReadings});
    setAlarms([...nextAlarms]);
  };

  const openEdit = (entry) => {
    const targetEq = EQUIPMENT.find((row) => row.id === entry.eqId);
    const targetParam = targetEq?.params.find((row) => row.k === entry.paramKey);
    if (!entry.id || !targetEq || !targetParam) {
      window.alert("이 기록은 이전 형식이라 수정할 수 없습니다.");
      return;
    }
    const parsed = parseFloat(String(entry.v || "").replace(/,/g, ""));
    setEditing(entry);
    setEditValue(targetParam.visual ? "" : (Number.isFinite(parsed) ? String(parsed) : ""));
    setEditVisual(targetParam.visual ? entry.judge === "정상" : null);
    setEditNote(String(entry.note || ""));
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editing || saving) return;
    const targetEq = EQUIPMENT.find((row) => row.id === editing.eqId);
    const targetParam = targetEq?.params.find((row) => row.k === editing.paramKey);
    if (!targetEq || !targetParam) {
      setEditError("설비 또는 관리항목 정보를 찾을 수 없습니다.");
      return;
    }
    const raw = String(editValue || "").trim();
    let result = null;
    let display = "";
    if (targetParam.visual) {
      if (editVisual == null) {
        setEditError("이상 없음 또는 이상 발견을 선택하세요.");
        return;
      }
      result = editVisual ? "정상" : "이탈";
      display = editVisual ? (targetParam.okLabel || "이상 없음") : (targetParam.badLabel || "이상 발견");
    } else {
      if (!/^-?\d+(\.\d+)?$/.test(raw)) {
        setEditError("판독값은 숫자로 입력하세요.");
        return;
      }
      const number = parseFloat(raw);
      result = ((targetParam.lo == null || number >= targetParam.lo) && (targetParam.hi == null || (targetParam.hiExclusive ? number < targetParam.hi : number <= targetParam.hi))) ? "정상" : "이탈";
      display = `${raw} ${targetParam.unit || ""}`.trim();
    }

    const updated = {
      ...editing,
      v:display,
      judge:result,
      ok:result === "정상",
      note:String(editNote || "").trim(),
      editedAt:new Date().toISOString(),
      editedBy:currentUser,
      sharedSync:false
    };
    const nextLogs = (DB.eqLogs || logs || []).map((entry) => entry.id === updated.id ? updated : entry);
    rebuildEquipmentFromLogs(nextLogs);
    setSaving(true);
    setSyncState("수정내용 저장 중");
    try {
      if (typeof qmesSyncEquipmentEntry !== "function") throw new Error("공용 DB 동기화 기능을 불러오지 못했습니다.");
      await qmesSyncEquipmentEntry(updated);
      const syncedLogs = (DB.eqLogs || []).map((entry) => entry.id === updated.id ? {...entry, sharedSync:true} : entry);
      rebuildEquipmentFromLogs(syncedLogs);
      setSyncState("PC·모바일 동기화");
      setSyncError("");
    } catch (error) {
      setSyncState("동기화 재시도 중");
      setSyncError(error.message || "공용 DB 연결을 확인하세요.");
    } finally {
      setSaving(false);
      setEditing(null);
      setEditError("");
    }
  };

  const save = async () => {
    if (judge == null || inputError || saving) { setTried(true); return; }
    const now = new Date();
    const display = isVisual ? (visOk ? (param.okLabel || "이상 없음") : (param.badLabel || "이상 발견")) : `${trimmed} ${param.unit || ""}`.trim();
    await persistEntries([makeEntry(eq, param, display, judge, now, 0, note)]);
    setVal(""); setVisOk(null); setNote(""); setTried(false);
  };

  /* ── 순회 점검 (설비 앞에서 PLC 육안 확인 → 전 항목 기록 → 다음 설비) ── */
  const tourEq = EQUIPMENT[tourIdx];
  const tourJudge = (x, raw) => {
    if (x.visual) return raw === true ? "정상" : raw === false ? "이탈" : null;
    const t = String(raw ?? "").trim();
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    const n = parseFloat(t);
    return ((x.lo == null || n >= x.lo) && (x.hi == null || (x.hiExclusive ? n < x.hi : n <= x.hi))) ? "정상" : "이탈";
  };

  const deleteEntry = async (entry) => {
    if (!entry?.id || saving) return;
    const label = `${entry.eqName || "설비"} · ${entry.item || "관리항목"}`;
    const reason = typeof askDeleteReason === "function"
      ? askDeleteReason(label)
      : window.prompt(`${label} 삭제 사유를 입력하세요.`);
    if (reason === null) return;
    if (!String(reason || "").trim()) {
      window.alert("삭제 사유를 입력해야 합니다.");
      return;
    }
    if (typeof qmesSyncDeleteEquipment !== "function") {
      window.alert("공용 DB 삭제 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setSaving(true);
    setSyncState("삭제내용 저장 중");
    try {
      await qmesSyncDeleteEquipment(entry, String(reason).trim());
      const nextLogs = (DB.eqLogs || logs || []).filter((row) => row.id !== entry.id);
      rebuildEquipmentFromLogs(nextLogs);
      if (typeof auditLog === "function") {
        auditLog("설비관리", "삭제", entry.id, `${label} / ${String(reason).trim()}`);
        dbSave();
      }
      setSyncState("PC·모바일 동기화");
      setSyncError("");
    } catch (error) {
      setSyncState("삭제 실패");
      setSyncError(error.message || "공용 DB 연결을 확인하세요.");
      window.alert(`삭제하지 못했습니다.\n${error.message || "공용 DB 연결을 확인하세요."}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteAllEntries = async () => {
    const currentLogs = [...(DB.eqLogs || logs || [])].filter((entry) => entry?.id);
    if (!currentLogs.length || saving) return;

    const confirmed = window.confirm(
      `설비 점검 기록 ${currentLogs.length}건을 모두 삭제하시겠습니까?\n\n삭제하면 오늘 순회점검이 0/${EQUIPMENT.length}로 초기화됩니다.`
    );
    if (!confirmed) return;
    const reason = window.prompt("전체기록 삭제 사유를 입력하세요.\n예: 시험 입력자료 초기화");
    if (reason === null) return;
    if (!String(reason || "").trim()) {
      window.alert("전체기록 삭제 사유를 입력해야 합니다.");
      return;
    }
    if (typeof qmesSyncDeleteAllEquipment !== "function") {
      window.alert("공용 DB 전체삭제 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setSaving(true);
    setSyncState(`전체 ${currentLogs.length}건 삭제 중`);
    try {
      const deletedCount = await qmesSyncDeleteAllEquipment(currentLogs, String(reason).trim());
      rebuildEquipmentFromLogs([]);
      setMode("single");
      setTourIdx(0);
      setTourVals({});
      setTourNotes({});
      setTourTried(false);
      if (typeof auditLog === "function") {
        auditLog("설비관리", "전체삭제", `${deletedCount}건`, String(reason).trim());
        dbSave();
      }
      setSyncState("PC·모바일 동기화");
      setSyncError("");
      window.alert(`설비 점검 기록 ${deletedCount}건을 삭제했습니다.\n새로고침해도 다시 생성되지 않습니다.`);
    } catch (error) {
      setSyncState("전체삭제 실패");
      setSyncError(error.message || "공용 DB 연결을 확인하세요.");
      window.alert(`전체기록을 삭제하지 못했습니다.\n${error.message || "공용 DB 연결을 확인하세요."}`);
    } finally {
      setSaving(false);
    }
  };


  const printDailyTourReport = () => {
    const equipmentOrder = new Map(EQUIPMENT.map((item, index) => [item.id, index]));
    const parameterOrder = new Map();
    EQUIPMENT.forEach((item) => item.params.forEach((parameter, index) => {
      parameterOrder.set(item.id + ":" + parameter.k, index);
    }));
    const todayLogs = [...(DB.eqLogs || logs || [])]
      .filter((entry) => String(entry.date || "") === TODAY)
      .sort((left, right) => {
        const equipmentDiff = (equipmentOrder.get(left.eqId) ?? 999) - (equipmentOrder.get(right.eqId) ?? 999);
        if (equipmentDiff) return equipmentDiff;
        const parameterDiff = (parameterOrder.get(left.eqId + ":" + left.paramKey) ?? 999)
          - (parameterOrder.get(right.eqId + ":" + right.paramKey) ?? 999);
        return parameterDiff || String(left.time || "").localeCompare(String(right.time || ""));
      });

    if (!todayLogs.length) {
      window.alert("금일 순회점검 기록이 없습니다.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=1200,height=850");
    if (!printWindow) {
      window.alert("인쇄 창이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.");
      return;
    }

    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[character]));
    const authors = [...new Set(todayLogs.map((entry) => String(entry.by || "").trim()).filter(Boolean))];
    const writer = authors.join(", ") || currentUser;
    const normalCount = todayLogs.filter((entry) => entry.judge === "정상").length;
    const deviationCount = todayLogs.filter((entry) => entry.judge === "이탈").length;
    const checkedEquipmentCount = new Set(todayLogs.map((entry) => entry.eqId).filter(Boolean)).size;
    const printedAt = new Date().toLocaleString("ko-KR");
    const rows = todayLogs.map((entry, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(entry.eqName || entry.eqId || "-")}</td>
        <td>${escapeHtml(entry.item || "-")}</td>
        <td>${escapeHtml(entry.spec || "-")}</td>
        <td class="value">${escapeHtml(entry.v || "-")}</td>
        <td class="center ${entry.judge === "정상" ? "ok" : "ng"}">${escapeHtml(entry.judge || "-")}</td>
        <td>${escapeHtml(entry.note || "-")}</td>
        <td>${escapeHtml(entry.by || "-")}</td>
      </tr>`).join("");

    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(TODAY)} 설비 일일 순회점검 기록</title>
  <style>
    @page { size: A4 landscape; margin: 9mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; color: #111827; font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif; font-size: 10px; }
    .toolbar { margin: 0 0 8px; padding: 7px 10px; border-radius: 6px; background: #e0f2fe; color: #075985; font-size: 11px; }
    .report { width: 100%; }
    h1 { margin: 3px 0 10px; text-align: center; font-size: 22px; letter-spacing: 1px; }
    .top { display: grid; grid-template-columns: 1fr 310px; gap: 12px; align-items: stretch; margin-bottom: 8px; }
    .meta, .approval, .summary, .records { width: 100%; border-collapse: collapse; }
    .meta th, .meta td, .approval th, .approval td { border: 1px solid #4b5563; padding: 6px 8px; }
    .meta th, .approval th { background: #d1d5db; font-weight: 700; text-align: center; }
    .meta th { width: 84px; }
    .approval th { width: 33.33%; }
    .approval td { height: 39px; text-align: center; }
    .summary { margin-bottom: 8px; }
    .summary td { width: 25%; border: 1px solid #94a3b8; padding: 7px; text-align: center; background: #f8fafc; }
    .summary strong { display: block; margin-top: 2px; font-size: 14px; }
    .section-title { border: 1px solid #4b5563; padding: 7px; background: #c7c7c7; text-align: center; font-size: 13px; font-weight: 700; }
    .records { table-layout: fixed; }
    .records thead { display: table-header-group; }
    .records th, .records td { border: 1px solid #6b7280; padding: 5px 6px; vertical-align: middle; overflow-wrap: anywhere; }
    .records th { background: #e5e7eb; text-align: center; font-weight: 700; }
    .records tr { break-inside: avoid; page-break-inside: avoid; }
    .records th:nth-child(1) { width: 4%; }
    .records th:nth-child(2) { width: 13%; }
    .records th:nth-child(3) { width: 11%; }
    .records th:nth-child(4) { width: 20%; }
    .records th:nth-child(5) { width: 11%; }
    .records th:nth-child(6) { width: 7%; }
    .records th:nth-child(7) { width: 20%; }
    .records th:nth-child(8) { width: 14%; }
    .center { text-align: center; }
    .value { text-align: center; font-weight: 700; }
    .ok { color: #047857; background: #d1fae5; font-weight: 700; }
    .ng { color: #b91c1c; background: #fee2e2; font-weight: 700; }
    .footer { display: flex; justify-content: space-between; margin-top: 7px; color: #475569; font-size: 9px; }
    @media print { .toolbar { display: none; } }
  </style>
</head>
<body>
  <div class="toolbar">인쇄 창에서 프린터를 선택하거나 [PDF로 저장]을 선택하세요.</div>
  <main class="report">
    <h1>설비 일일 순회점검 기록</h1>
    <div class="top">
      <table class="meta">
        <tr><th>점검일자</th><td>${escapeHtml(TODAY)}</td><th>부서</th><td>품질부</td></tr>
        <tr><th>작성자</th><td>${escapeHtml(writer)}</td><th>점검현황</th><td>${checkedEquipmentCount}/${EQUIPMENT.length} 설비</td></tr>
      </table>
      <table class="approval">
        <thead><tr><th>작성</th><th>검토</th><th>승인</th></tr></thead>
        <tbody><tr><td>${escapeHtml(writer)}</td><td></td><td></td></tr></tbody>
      </table>
    </div>
    <table class="summary">
      <tr>
        <td>점검 설비<strong>${checkedEquipmentCount}/${EQUIPMENT.length}</strong></td>
        <td>전체 기록<strong>${todayLogs.length}건</strong></td>
        <td>정상<strong>${normalCount}건</strong></td>
        <td>이탈<strong>${deviationCount}건</strong></td>
      </tr>
    </table>
    <div class="section-title">■ 금일 설비 순회점검 기록</div>
    <table class="records">
      <thead><tr><th>No.</th><th>설비</th><th>관리항목</th><th>관리기준</th><th>판독값</th><th>판정</th><th>비고</th><th>기록자</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span>QMES · https://qmes.namochemical.com/</span>
      <span>출력일시: ${escapeHtml(printedAt)}</span>
    </div>
  </main>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 500);
    if (typeof auditLog === "function") {
      auditLog("설비관리", "PDF인쇄", TODAY, `${todayLogs.length}건`);
      dbSave();
    }
  };

  const tourSave = async () => {
    if (saving) return;
    if (tourEq.params.some((x) => tourJudge(x, tourVals[x.k]) == null)) { setTourTried(true); return; }
    const now = new Date();
    const entries = tourEq.params.map((x, index) => {
      const raw = tourVals[x.k];
      const result = tourJudge(x, raw);
      const display = x.visual ? (raw ? (x.okLabel || "이상 없음") : (x.badLabel || "이상 발견")) : `${String(raw).trim()} ${x.unit || ""}`.trim();
      return makeEntry(tourEq, x, display, result, now, index, tourNotes[x.k]);
    });
    await persistEntries(entries);
    setTourVals({}); setTourNotes({}); setTourTried(false);
    const nextIdx = EQUIPMENT.findIndex((candidate, index) =>
      index > tourIdx && candidate.params.some((item) => !DB.eqReadings[`${candidate.id}:${item.k}`])
    );
    if (nextIdx >= 0) setTourIdx(nextIdx);
    else { setMode("single"); setTourIdx(0); }
  };
  const totalEquipment = EQUIPMENT.length;
  const doneEquipment = EQUIPMENT.filter((candidate) =>
    candidate.params.every((item) => readings[`${candidate.id}:${item.k}`])
  ).length;
  const remainingEquipment = Math.max(0, totalEquipment - doneEquipment);
  const tourCompletedToday = doneEquipment >= totalEquipment;
  const firstIncompleteEqIndex = EQUIPMENT.findIndex((candidate) =>
    candidate.params.some((item) => !readings[`${candidate.id}:${item.k}`])
  );
  const historyLogs = [...logs]
    .filter((entry) => String(entry.date || "") === historyDate)
    .sort((left, right) => String(right.recordedAt || `${right.date || ""}T${right.time || ""}`).localeCompare(String(left.recordedAt || `${left.date || ""}T${left.time || ""}`)));
  const historyAlarms = [...alarms]
    .filter((entry) => String(entry.date || "") === historyDate)
    .sort((left, right) => String(`${right.date || ""}T${right.time || ""}`).localeCompare(String(`${left.date || ""}T${left.time || ""}`)));
  const openMonthlyHistory = () => {
    setMode("history");
    window.scrollTo({top:0, behavior:"smooth"});
  };
  const startDailyTour = () => {
    if (tourCompletedToday || saving) return;
    setMode("tour");
    setTourIdx(firstIncompleteEqIndex >= 0 ? firstIncompleteEqIndex : 0);
    setTourVals({});
    setTourNotes({});
    setTourTried(false);
    window.scrollTo({top:0, behavior:"smooth"});
  };

  return (
    <div className="qmes-equipment-tab flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ClipboardList size={15} className="text-amber-400 shrink-0" />
          <p className="text-sm text-slate-300">
            <span className="text-amber-400 font-medium">관리계획서 기준 5개 설비 일일 순회점검</span> — 한 설비씩 입력하고 저장하면 다음 미완료 설비로 자동 이동합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tourCompletedToday
            ? <Badge tone="green">오늘 순회점검 {totalEquipment}/{totalEquipment} 완료</Badge>
            : <Badge tone="amber">오늘 순회점검 {doneEquipment}/{totalEquipment} · {remainingEquipment}개 미완료</Badge>}
          <Badge tone={syncError ? "amber" : "green"}>{syncState}</Badge>
          {mode === "single" && (
            <button
              onClick={startDailyTour}
              disabled={saving || tourCompletedToday}
              title={tourCompletedToday ? `오늘 순회점검 ${totalEquipment}개 항목을 모두 완료했습니다.` : "일 1회 필수 순회점검을 시작합니다."}
              className={`flex items-center gap-1.5 rounded px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 text-white transition-colors ${tourCompletedToday ? "bg-emerald-700" : "bg-sky-600 hover:bg-sky-500"}`}>
              {tourCompletedToday ? <CheckCircle2 size={13} /> : <RotateCw size={13} />}
              {tourCompletedToday ? "오늘 순회점검 완료" : doneEquipment > 0 ? "미점검 항목 이어서" : "순회점검 시작"}
            </button>
          )}
        </div>
      </div>

      {/* 순회 점검 모드 */}
      {mode === "tour" && (
      <div className="qmes-equipment-tour-screen">
      <Panel title={`순회 점검 ${tourIdx + 1} / ${EQUIPMENT.length} — ${tourEq.name}`}
        right={<button onClick={() => setMode("single")} className="qmes-equipment-tour-pause text-[11px] px-2.5 py-1.5 rounded border transition-colors">잠시 중단</button>}>
        <p className="text-xs text-slate-400 mb-3"><strong className="text-sky-300">{tourEq.subtitle || "설비 점검"}</strong> · 관리계획서 기준값을 확인한 뒤 모든 세부항목을 입력하세요.</p>
        <div className="flex flex-col gap-2.5">
          {tourEq.params.map((x) => {
            const raw = tourVals[x.k];
            const j = tourJudge(x, raw);
            return (
              <div key={x.k} className="qmes-equipment-tour-item-row flex flex-col md:flex-row md:items-center gap-2 bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2.5">
                <div className="md:w-64 shrink-0">
                  <div className="qmes-equipment-tour-item-label text-sm text-slate-100">{x.label}</div>
                  <div className="qmes-equipment-tour-item-spec text-[11px] text-slate-500">기준 {x.spec} · {x.src}</div>
                </div>
                {x.visual ? (
                  <div className="flex gap-2 flex-1">
                    <button onClick={() => setTourVals({ ...tourVals, [x.k]: true })}
                      aria-pressed={raw === true}
                      className={`qmes-equipment-tour-ok flex-1 rounded border px-3 py-2.5 text-sm font-medium transition-colors ${raw === true ? "is-selected" : ""}`}>{x.okLabel || "이상 없음"}</button>
                    <button onClick={() => setTourVals({ ...tourVals, [x.k]: false })}
                      aria-pressed={raw === false}
                      className={`qmes-equipment-tour-bad flex-1 rounded border px-3 py-2.5 text-sm font-medium transition-colors ${raw === false ? "is-selected" : ""}`}>{x.badLabel || "이상 발견"}</button>
                  </div>
                ) : (
                  <input inputMode="decimal" value={raw ?? ""} onChange={(e) => setTourVals({ ...tourVals, [x.k]: e.target.value })}
                    placeholder={`판독값 입력 ${x.unit ? `(${x.unit})` : ""}`}
                    className="qmes-equipment-tour-reading flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-center tabular-nums text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
                )}
                <input value={tourNotes[x.k] || ""} onChange={(e) => setTourNotes({...tourNotes, [x.k]:e.target.value})}
                  placeholder="비고 (선택)"
                  className="qmes-equipment-tour-note md:w-56 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
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
          <button onClick={() => { if (tourIdx > 0) { setTourIdx(tourIdx - 1); setTourVals({}); setTourNotes({}); setTourTried(false); } }}
            className={`qmes-equipment-tour-prev px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors ${tourIdx === 0 ? "is-disabled" : ""}`}>
            ← 이전 설비
          </button>
          <button onClick={tourSave} disabled={saving}
            className="qmes-equipment-tour-next px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors disabled:opacity-50">
            {saving ? "저장 중..." : tourIdx < EQUIPMENT.length - 1 ? "다음 설비 →" : "순회 완료"}
          </button>
        </div>
      </Panel>
      </div>
      )}

      {mode === "single" && (
        <div className={`rounded-xl border p-5 text-center ${tourCompletedToday ? "border-emerald-500/40 bg-emerald-500/10" : "border-sky-500/30 bg-slate-900"}`}>
          {tourCompletedToday ? (
            <>
              <CheckCircle2 size={34} className="mx-auto text-emerald-400" />
              <h3 className="mt-2 text-lg font-bold text-emerald-200">오늘 순회점검 완료</h3>
              <p className="mt-1 text-sm text-slate-400">5개 설비의 필수 세부항목이 모두 기록되었습니다.</p>
            </>
          ) : (
            <>
              <ClipboardList size={34} className="mx-auto text-sky-400" />
              <h3 className="mt-2 text-lg font-bold text-white">오늘 설비 순회점검</h3>
              <p className="mt-1 text-sm text-slate-400">TK 501 → TK 501A → TK 501B → 필터 유닛 → 드라이룸 순서로 간단히 기록합니다.</p>
            </>
          )}
          <div className="qmes-equipment-home-actions mt-4 flex items-center justify-center gap-2.5">
            <button type="button" onClick={startDailyTour} disabled={saving || tourCompletedToday}
              className="qmes-equipment-tour-start-safe min-h-[40px] rounded-lg px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
              {tourCompletedToday ? "오늘 순회점검 완료" : doneEquipment > 0 ? `미완료 설비 이어서 (${doneEquipment}/${totalEquipment})` : "오늘 순회점검 시작"}
            </button>
            <button type="button" onClick={openMonthlyHistory}
              className="qmes-equipment-history-open min-h-[40px] rounded-lg border border-sky-300 bg-white px-4 text-sm font-bold text-sky-700 hover:bg-sky-50">
              점검 기록
            </button>
          </div>
        </div>
      )}

      {mode === "history" && (
        <div className="qmes-equipment-history-toolbar flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
          <button type="button" onClick={() => setMode("single")}
            className="min-h-[38px] rounded-lg border border-slate-600 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">
            ← 설비점검
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-white">날짜별 점검 기록</div>
            <div className="mt-0.5 text-xs text-slate-400">선택한 날짜의 점검 기록만 표시합니다.</div>
          </div>
          <input aria-label="점검 기록 조회 일자" type="date" value={historyDate}
            onChange={(event) => setHistoryDate(event.target.value || TODAY)}
            className="min-h-[38px] rounded-lg border border-slate-600 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-sky-500" />
          <div className="min-w-[120px] text-right text-xs font-bold text-slate-300">
            점검 {historyLogs.length}건
          </div>
        </div>
      )}
      {mode === "history" && (
        <div>
      {/* 점검 기록 */}
      <Panel title="설비 점검 기록" right={
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{historyLogs.length}건 · 기록자 자동 저장</span>
          <button type="button" onClick={printDailyTourReport}
            disabled={saving || !logs.some((entry) => String(entry.date || "") === TODAY)}
            title="금일 순회점검 기록을 인쇄하거나 PDF로 저장합니다."
            className="min-h-[36px] rounded border border-sky-500/60 px-3 text-xs font-bold text-sky-300 hover:bg-sky-500/10 disabled:opacity-40">
            <span className="inline-flex items-center gap-1"><Printer size={12} /> 금일 PDF 인쇄</span>
          </button>
          {logs.length > 0 && (
            <button type="button" onClick={deleteAllEntries} disabled={saving}
              className="min-h-[36px] rounded border border-red-500/60 px-3 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-40">
              {saving ? "처리 중..." : "전체기록 삭제"}
            </button>
          )}
        </div>
      }>
        {historyLogs.length === 0 ? (
          <p className="text-sm text-slate-500">선택한 날짜의 점검 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[960px]">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-800">
                  <th className="text-left py-2 pr-3 font-medium">일시</th>
                  <th className="text-left py-2 px-3 font-medium">설비</th>
                  <th className="text-left py-2 pr-3 font-medium">관리항목</th>
                  <th className="text-left py-2 pr-3 font-medium">판독값</th>
                  <th className="text-left py-2 pr-3 font-medium">판정</th>
                  <th className="text-left py-2 pr-3 font-medium">기록자</th>
                  <th className="text-left py-2 pr-3 font-medium">비고</th>
                  <th className="text-center py-2 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.map((l, i) => (
                  <tr key={l.id || i} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2.5 pr-3 text-xs font-mono text-slate-400 whitespace-nowrap">{l.date || TODAY} {l.time}</td>
                    <td className="py-2.5 pr-3 text-slate-100 text-xs">{l.eqName}</td>
                    <td className="py-2.5 pr-3 text-slate-300 text-xs">{l.item}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-200">{l.v}</td>
                    <td className="py-2.5 pr-3"><Badge tone={l.judge === "정상" ? "green" : "red"}>{l.judge}</Badge></td>
                    <td className="py-2.5 pr-3 text-xs text-slate-400">
                      <div>{l.by}</div>
                      {l.editedBy && <div className="mt-0.5 text-[10px] text-sky-400">수정: {l.editedBy}</div>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-300 max-w-[260px] break-words">{l.note || "—"}</td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => openEdit(l)} disabled={!l.id || saving}
                          className="min-h-[36px] px-3 rounded border border-sky-500/50 text-sky-300 hover:bg-sky-500/10 disabled:opacity-30 text-xs font-medium">수정</button>
                        <button type="button" onClick={() => deleteEntry(l)} disabled={!l.id || saving}
                          className="min-h-[36px] px-3 rounded border border-red-500/50 text-red-300 hover:bg-red-500/10 disabled:opacity-30 text-xs font-medium">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>



        </div>
      )}

      {mode === "history" && editing && (() => {
        const editEq = EQUIPMENT.find((row) => row.id === editing.eqId);
        const editParam = editEq?.params.find((row) => row.k === editing.paramKey);
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4" style={{zIndex:20000}} role="dialog" aria-modal="true" aria-label="설비 점검 기록 수정">
            <div className="w-full max-w-lg rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-sky-400">설비 점검 기록 수정</div>
                  <h3 className="mt-1 text-lg font-bold text-white">{editing.eqName}</h3>
                  <p className="mt-1 text-sm text-slate-400">{editing.item} · 기준 {editing.spec}</p>
                </div>
                <button type="button" onClick={() => setEditing(null)} disabled={saving}
                  className="min-h-[42px] min-w-[42px] rounded border border-slate-600 text-slate-300">×</button>
              </div>
              <div className="mt-4">
                {editParam?.visual ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => {setEditVisual(true);setEditError("");}}
                      className={`min-h-[54px] rounded-lg border font-bold ${editVisual === true ? "border-emerald-400 bg-emerald-500/20 text-emerald-300" : "border-slate-600 bg-slate-800 text-slate-300"}`}>{editParam.okLabel || "이상 없음"}</button>
                    <button type="button" onClick={() => {setEditVisual(false);setEditError("");}}
                      className={`min-h-[54px] rounded-lg border font-bold ${editVisual === false ? "border-red-400 bg-red-500/20 text-red-300" : "border-slate-600 bg-slate-800 text-slate-300"}`}>{editParam.badLabel || "이상 발견"}</button>
                  </div>
                ) : (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-slate-400">판독값 {editParam?.unit ? `(${editParam.unit})` : ""}</span>
                    <input inputMode="decimal" value={editValue} onChange={(e) => {setEditValue(e.target.value);setEditError("");}}
                      className="min-h-[52px] rounded-lg border border-slate-600 bg-slate-800 px-3 text-base text-white focus:border-sky-500 focus:outline-none" />
                  </label>
                )}
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-400">비고</span>
                  <input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="점검내용·조치사항 등을 입력하세요"
                    className="min-h-[52px] rounded-lg border border-slate-600 bg-slate-800 px-3 text-base text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none" />
                </label>
                {editError && <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{editError}</div>}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setEditing(null)} disabled={saving}
                  className="min-h-[52px] rounded-lg border border-slate-600 bg-slate-800 font-bold text-slate-300">취소</button>
                <button type="button" onClick={saveEdit} disabled={saving}
                  className="min-h-[52px] rounded-lg bg-sky-600 font-bold text-white disabled:opacity-50">{saving ? "저장 중..." : "수정 저장"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {mode === "single" && syncError && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg px-4 py-3 text-sm text-amber-200">
          공용 DB 연결을 자동 재시도하고 있습니다. 현재 입력은 이 기기에 보관됩니다. · {syncError}
        </div>
      )}

      {/* 알람 이력 */}
      {mode === "single" && (
      <Panel title={
        <span className="qmes-equipment-alarm-title-tools">
          <span>설비 · 공정 알람 이력</span>
          <input aria-label="알람 이력 조회 일자" type="date" value={historyDate}
            onChange={(event) => setHistoryDate(event.target.value || TODAY)} />
        </span>
      } right={<span className="qmes-equipment-alarm-count-target qmes-equipment-alarm-count">{historyAlarms.length}건</span>}>
        <ul className="flex flex-col divide-y divide-slate-800/60">
          {historyAlarms.length === 0 && <li className="py-1 text-sm text-slate-500">선택한 날짜의 알람 이력이 없습니다.</li>}
          {historyAlarms.map((a, i) => (
            <li key={i} className="flex items-start gap-3 py-2.5">
              <Badge tone="amber">{a.level}</Badge>
              <span className="text-xs font-mono text-slate-500 w-24 shrink-0 pt-0.5">{String(a.date || "").slice(5)} {a.time}</span>
              <span className="text-xs text-slate-400 w-24 shrink-0 pt-0.5 font-mono">{a.eq}</span>
              <span className="text-sm text-slate-200">{a.msg}</span>
            </li>
          ))}
        </ul>
      </Panel>
      )}
    </div>
  );
}

/* ──────────────────────────── Lot 추적 탭 ──────────────────────────── */

