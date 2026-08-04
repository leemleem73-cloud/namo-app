/* 회원등록 현황: 추가 · 수정 · 삭제 기능 패치 */

function MembersTab() {
  const emptyForm = { name: "", dept: (typeof DEPTS !== "undefined" && DEPTS[0]) || "대표", position: "", role: "user" };
  const [users, setUsers] = useState(loadUsers);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [info, setInfo] = useState(null);

  const update = (next) => {
    setUsers(next);
    saveUsers(next);
  };

  const clearForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveMember = async () => {
    const name = form.name.trim();
    if (!name) {
      setInfo("이름을 입력해 주세요.");
      return;
    }

    const duplicate = users.some((u) => u.name === name && u.id !== editingId);
    if (duplicate) {
      setInfo("이미 등록된 이름입니다.");
      return;
    }

    if (editingId) {
      const next = users.map((u) => u.id === editingId ? {
        ...u,
        id: name,
        name,
        dept: form.dept,
        position: form.position.trim(),
        role: form.role,
      } : u);
      update(next);
      setInfo(`${name} 회원 정보를 수정했습니다.`);
    } else {
      const pwHash = await hashText("1234");
      const nu = {
        id: name,
        uid: nextUid(users),
        pwHash,
        name,
        dept: form.dept,
        position: form.position.trim(),
        role: form.role,
        passwordChanged: false,
        joined: new Date().toLocaleString("ko-KR", { hour12: false }),
      };
      update([...users, nu]);
      setInfo(`${name} 회원을 추가했습니다. 초기 비밀번호는 1234입니다.`);
    }
    clearForm();
  };

  const editMember = (u) => {
    setEditingId(u.id);
    setForm({ name: u.name || "", dept: u.dept || emptyForm.dept, position: u.position || "", role: u.role || "user" });
    setInfo(null);
  };

  const removeMember = (u) => {
    if (u.id === "admin") return;
    if (!window.confirm(`${u.name} 회원을 삭제하시겠습니까?`)) return;
    update(users.filter((x) => x.id !== u.id));
    if (editingId === u.id) clearForm();
    setInfo(`${u.name} 회원을 삭제했습니다.`);
  };

  const resetPw = async (u) => {
    const pwHash = await hashText("1234");
    update(users.map((x) => x.id === u.id ? { ...x, pwHash, pw: undefined, passwordChanged: false } : x));
    setInfo(`${u.name} 비밀번호를 1234로 초기화했습니다.`);
  };

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500";

  return (
    <div className="flex flex-col gap-4">
      {info && <div className="rounded-lg px-4 py-3 text-sm border bg-sky-500/10 border-sky-500/40 text-sky-300">{info}</div>}

      <Panel title={editingId ? "회원 정보 수정" : "회원 추가"}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <div className="text-[11px] text-slate-500 mb-1">이름 · 로그인 ID</div>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름 입력" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1">부서</div>
            <select className={inputCls} value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
              {(typeof DEPTS !== "undefined" ? DEPTS : ["대표", "경영지원부", "연구소", "생산부", "영업부", "품질부"]).map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1">직급</div>
            <input className={inputCls} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="예: 부장" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1">권한</div>
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">일반</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={saveMember} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg py-2 text-sm font-bold">{editingId ? "수정 저장" : "추가"}</button>
            {editingId && <button onClick={clearForm} className="px-3 border border-slate-600 text-slate-300 rounded-lg text-sm">취소</button>}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">신규 회원의 로그인 ID는 이름이며 초기 비밀번호는 1234입니다. 로그인 후 비밀번호를 변경해 주세요.</p>
      </Panel>

      <Panel title="회원등록 현황">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[850px]">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="text-left py-2 pr-3 font-medium">고유번호</th>
                <th className="text-left py-2 pr-3 font-medium">로그인 ID</th>
                <th className="text-left py-2 pr-3 font-medium">부서</th>
                <th className="text-left py-2 pr-3 font-medium">직급</th>
                <th className="text-left py-2 pr-3 font-medium">권한</th>
                <th className="text-left py-2 pr-3 font-medium">비밀번호</th>
                <th className="text-left py-2 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3 font-mono text-xs text-sky-300">{u.uid || "-"}</td>
                  <td className="py-2.5 pr-3 text-slate-100">{u.name}</td>
                  <td className="py-2.5 pr-3 text-slate-300 text-xs">{u.dept || "-"}</td>
                  <td className="py-2.5 pr-3 text-slate-300 text-xs">{u.position || "-"}</td>
                  <td className="py-2.5 pr-3">{u.role === "admin" ? <Badge tone="violet">관리자</Badge> : <Badge tone="gray">일반</Badge>}</td>
                  <td className="py-2.5 pr-3 text-xs">{u.passwordChanged ? <Badge tone="green">변경완료</Badge> : <Badge tone="amber">초기 1234</Badge>}</td>
                  <td className="py-2.5">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => editMember(u)} className="text-[11px] px-2 py-1 rounded border border-sky-500/40 text-sky-300 hover:bg-sky-500/10">수정</button>
                      <button onClick={() => resetPw(u)} className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-800">비밀번호 초기화</button>
                      {u.id !== "admin" && <button onClick={() => removeMember(u)} className="text-[11px] px-2 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10">삭제</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* LOT 추적 부적합·홀드 상태 및 처리이력 연동 */
(function installLotQualityHoldTrace(){
  if(window.__QMES_LOT_QUALITY_HOLD_TRACE_INSTALLED__) return;
  const LinkedTraceTab = typeof TraceTab === "function" ? TraceTab : null;
  if(!LinkedTraceTab) return;
  window.__QMES_LOT_QUALITY_HOLD_TRACE_INSTALLED__ = true;

  const DRAFT_KEY = "qmes-ncr-draft-v1";
  const HOLD_TEXT = /홀드|격리|차단/;
  let syncing = false;

  const normalizeLot = value => String(value || "").trim().toUpperCase();
  const currentUserName = () => {
    const raw = window.__QMES_CURRENT_USER__ || window.__QMES_USER__;
    return raw && typeof raw === "object" ? String(raw.name || raw.uid || "현재 사용자") : String(raw || "현재 사용자");
  };
  const writeDraft = draft => {
    try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}
    catch(error){/* 무시 */}
  };
  const ncrLots = record => Array.from(new Set([
    record?.sourceLot,
    ...(Array.isArray(record?.affectedLots) ? record.affectedLots : []),
    ...String(record?.lot || "").split(/[,\s·]+/)
  ].map(normalizeLot).filter(Boolean)));
  const released = hold => String(hold?.status || "").includes("해제 완료");
  const activeHold = hold => !released(hold);
  const holdTone = value => {
    const text = String(value || "");
    if(text.includes("차단중")) return "red";
    if(text.includes("요청")) return "amber";
    if(text.includes("해제 완료")) return "green";
    return "gray";
  };
  const ncrTone = value => {
    const text = String(value || "");
    if(text === "완료") return "green";
    if(text.includes("유효성")) return "blue";
    return "amber";
  };
  const inferNormalStatus = lot => {
    const stored = String(lot?.statusBeforeHold || lot?.previousStatus || "").trim();
    if(stored && !HOLD_TEXT.test(stored)) return stored;
    if(lot?.ship) return "출하완료";
    if(lot?.stage === "출하") return "출하대기";
    if(lot?.stage === "생산") {
      const latestPqc = [...(lot.steps || [])].reverse().find(step => /공정검사|PQC/.test(`${step?.name || ""} ${step?.detail || ""}`));
      return String(latestPqc?.result || "").includes("합격") ? "생산완료" : "생산중";
    }
    if(lot?.stage === "수입") return "수입검사";
    return "정상";
  };
  const ensureHistory = (lot,event) => {
    const history = Array.isArray(lot.holdHistory) ? [...lot.holdHistory] : [];
    if(history.some(row => row.key === event.key)) return false;
    history.push(event);
    lot.holdHistory = history;
    return true;
  };
  const nowText = () => new Date().toLocaleString("ko-KR",{hour12:false});

  const syncQualityLifecycle = () => {
    if(syncing || typeof DB === "undefined" || !DB) return false;
    syncing = true;
    try{
      const lots = DB.lots || {};
      const holds = Array.isArray(DB.holds) ? DB.holds : [];
      const ncrs = Array.isArray(DB.ncrs) ? DB.ncrs : [];
      const ncrMap = Object.fromEntries(ncrs.map(record => [record.no,record]));
      const grouped = {};
      let changed = false;

      holds.forEach(hold => {
        const lotId = normalizeLot(hold.target);
        const lot = lots[lotId];
        if(!lotId || !lot) return;
        (grouped[lotId] ||= []).push(hold);
        const normalStatus = inferNormalStatus(lot);
        if(!lot.statusBeforeHold || HOLD_TEXT.test(String(lot.statusBeforeHold))){
          lot.statusBeforeHold = String(hold.previousStatus || normalStatus || "정상");
          changed = true;
        }
        if(!hold.previousStatus){
          hold.previousStatus = lot.statusBeforeHold;
          changed = true;
        }
        const ncr = ncrMap[hold.ncr] || {};
        const baseEvent = {
          holdId:hold.id,
          ncr:hold.ncr || "-",
          rack:hold.rack || ncr.rack || "-",
          by:ncr.owner || currentUserName(),
          detail:hold.reason || ncr.item || "LOT 품질 차단"
        };
        changed = ensureHistory(lot,{
          ...baseEvent,
          key:`${hold.id}:registered`,
          title:"LOT 홀드 등록",
          status:"차단중",
          time:hold.since || nowText()
        }) || changed;

        if(String(hold.status || "").includes("요청") || released(hold)){
          if(!hold.releaseRequestedAt){
            hold.releaseRequestedAt = released(hold) ? (hold.releasedAt || hold.release || nowText()) : nowText();
            changed = true;
          }
          changed = ensureHistory(lot,{
            ...baseEvent,
            key:`${hold.id}:requested`,
            title:"홀드 해제 요청",
            status:"승인 대기",
            time:hold.releaseRequestedAt,
            detail:`${hold.ncr || "부적합"} 조치 완료 후 품질 승인 요청`
          }) || changed;
        }

        if(released(hold)){
          if(!hold.releasedAt){
            hold.releasedAt = hold.release || nowText();
            changed = true;
          }
          changed = ensureHistory(lot,{
            ...baseEvent,
            key:`${hold.id}:released`,
            title:"홀드 해제 승인",
            status:"해제 완료",
            time:hold.releasedAt,
            by:String(hold.release || "").replace(/^.*승인\s*/,"") || currentUserName(),
            detail:"품질 승인 완료 · LOT 사용 및 후속 공정 진행 가능"
          }) || changed;
        }
      });

      Object.entries(grouped).forEach(([lotId,lotHolds]) => {
        const lot = lots[lotId];
        const openHolds = lotHolds.filter(activeHold);
        if(openHolds.length){
          if(String(lot.status || "") !== "홀드"){
            if(!HOLD_TEXT.test(String(lot.status || ""))) lot.statusBeforeHold = String(lot.status || inferNormalStatus(lot));
            lot.status = "홀드";
            changed = true;
          }
          const holdNo = openHolds[0].ncr || openHolds[0].id;
          if(lot.holdNo !== holdNo){lot.holdNo = holdNo;changed = true;}
        }else{
          const restored = lot.statusBeforeHold || inferNormalStatus(lot);
          if(HOLD_TEXT.test(String(lot.status || "")) || String(lot.status || "") === "홀드"){
            lot.status = restored;
            changed = true;
          }
          if(lot.holdNo){lot.holdNo = "";changed = true;}
        }
      });

      ncrs.forEach(record => {
        const linked = holds.filter(hold => String(hold.ncr || "") === String(record.no || ""));
        if(linked.length && linked.every(released) && record.status !== "완료"){
          record.status = "완료";
          record.d = 8;
          record.closedAt = record.closedAt || new Date().toISOString();
          changed = true;
        }
      });

      if(changed && typeof dbSave === "function") dbSave();
      return changed;
    }finally{
      syncing = false;
    }
  };

  const notifyDataUpdated = () => {
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated"));}
    catch(error){/* 무시 */}
  };
  const syncAndNotify = () => {
    const changed = syncQualityLifecycle();
    if(changed) notifyDataUpdated();
  };

  document.addEventListener("click",event => {
    const button = event.target.closest?.("button");
    if(!button) return;
    const text = String(button.textContent || "").replace(/\s+/g," ").trim();

    if(text === "부적합 관리 열기"){
      const pageText = document.body.innerText || "";
      const rawMatch = pageText.match(/원료 LOT 역추적\s*[—-]\s*([^\s]+)/);
      const rawLot = rawMatch ? normalizeLot(rawMatch[1]) : "";
      const affected = [];
      Array.from(document.querySelectorAll("tbody tr")).forEach(row => {
        const candidate = normalizeLot(row.querySelector("td")?.textContent);
        if(candidate && DB.lots?.[candidate] && !affected.includes(candidate)) affected.push(candidate);
      });
      const firstData = DB.lots?.[affected[0]] || {};
      writeDraft({
        source:"LOT 역추적",
        sourceType:"원료",
        sourceLot:rawLot,
        affectedLots:affected,
        itemName:firstData.itemName || "",
        issue:"원료 LOT 이상 영향 확인",
        createdAt:new Date().toISOString()
      });
    }

    if(["등록 및 LOT 홀드","조치 완료","조치 완료·홀드 해제 요청","해제 요청","승인 (품질부장)"].includes(text)){
      setTimeout(syncAndNotify,0);
    }
  },true);
  window.addEventListener("storage",syncAndNotify);
  document.addEventListener("qmes:data-updated",syncQualityLifecycle);
  queueMicrotask(syncAndNotify);

  function LotQualityHoldPanel(){
    const lotIds = Object.keys(DB.lots || {});
    const [selectedLot,setSelectedLot] = useState(lotIds[0] || "");
    const [mode,setMode] = useState("finished");
    const [,setVersion] = useState(0);

    useEffect(() => {
      const handleClick = event => {
        const button = event.target.closest?.("button");
        if(!button) return;
        const text = String(button.textContent || "").replace(/\s+/g," ").trim();
        if(text === "원료 LOT 역추적"){setMode("raw");return;}
        if(text === "완제품 LOT 조회"){setMode("finished");return;}
        const scope = `${button.closest("tr")?.textContent || ""} ${button.textContent || ""}`;
        const matched = [...lotIds].sort((a,b)=>b.length-a.length).find(id => scope.includes(id));
        if(matched){
          setSelectedLot(matched);
          if(text === "LOT 보기") setMode("finished");
        }
      };
      const refresh = () => setVersion(value => value + 1);
      document.addEventListener("click",handleClick,true);
      document.addEventListener("qmes:data-updated",refresh);
      window.addEventListener("storage",refresh);
      return () => {
        document.removeEventListener("click",handleClick,true);
        document.removeEventListener("qmes:data-updated",refresh);
        window.removeEventListener("storage",refresh);
      };
    },[lotIds.join("|")]);

    if(mode !== "finished") return null;
    const activeLotId = DB.lots?.[selectedLot] ? selectedLot : lotIds[0];
    const lot = DB.lots?.[activeLotId];
    if(!lot) return null;

    const relatedNcrs = (DB.ncrs || []).filter(record => ncrLots(record).includes(activeLotId));
    const relatedHolds = (DB.holds || []).filter(hold => normalizeLot(hold.target) === activeLotId);
    const openHolds = relatedHolds.filter(activeHold);
    const latestHold = openHolds[0] || relatedHolds[0] || null;
    const history = Array.isArray(lot.holdHistory) ? [...lot.holdHistory].reverse() : [];
    const status = openHolds.length ? latestHold.status : relatedHolds.length ? "해제 완료" : "정상";
    const tone = openHolds.length ? holdTone(status) : relatedHolds.length ? "green" : "blue";
    const rack = latestHold?.rack || relatedNcrs.find(record => record.rack)?.rack || "-";

    const openNcr = () => {
      writeDraft({
        source:"완제품 LOT 추적",
        sourceType:"공정",
        sourceLot:activeLotId,
        affectedLots:[activeLotId],
        itemName:lot.itemName || "",
        issue:"완제품 LOT 이상 확인",
        createdAt:new Date().toISOString()
      });
      try{sessionStorage.setItem("qmes_current_tab","ncr");}
      catch(error){/* 무시 */}
      window.location.reload();
    };

    return <div className="mt-4" data-qmes-lot-quality-hold={activeLotId}>
      <Panel title={`품질 상태·부적합 이력 — ${activeLotId}`} right={<div className="flex items-center gap-2"><Badge tone={tone}>{status}</Badge><button type="button" onClick={openNcr} className="rounded-lg border border-red-500/50 px-3 py-1.5 text-xs font-black text-red-300 hover:bg-red-500/10">이 LOT으로 부적합 등록</button></div>}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="text-[11px] font-bold text-slate-500">현재 LOT 상태</div><div className="mt-1 text-sm font-black text-white">{lot.status || "-"}</div><div className="mt-1 text-[10px] text-slate-600">홀드 해제 시 이전 상태로 자동 복구</div></div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="text-[11px] font-bold text-slate-500">연결 부적합</div><div className="mt-1 text-sm font-black text-white">{relatedNcrs.length}건</div><div className="mt-1 text-[10px] text-slate-600">NCR 번호 및 조치상태</div></div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="text-[11px] font-bold text-slate-500">홀드 상태</div><div className="mt-1"><Badge tone={tone}>{status}</Badge></div><div className="mt-1 text-[10px] text-slate-600">차단·승인대기·해제 완료</div></div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="text-[11px] font-bold text-slate-500">격리 위치</div><div className="mt-1 text-sm font-black text-amber-300">{rack}</div><div className="mt-1 text-[10px] text-slate-600">부적합 격리 Rack</div></div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/25 p-3">
            <div className="mb-2 text-xs font-black text-slate-300">연결된 부적합</div>
            {relatedNcrs.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-xs"><thead><tr className="border-b border-slate-700 text-slate-500"><th className="py-2 pr-3 text-left">번호</th><th className="py-2 pr-3 text-left">상태</th><th className="py-2 pr-3 text-left">발생 내용</th><th className="py-2 pr-3 text-left">담당자</th><th className="py-2 text-left">완료 예정일</th></tr></thead><tbody>{relatedNcrs.map(record => <tr key={record.no} className="border-b border-slate-800"><td className="py-2.5 pr-3 font-mono font-black text-sky-300">{record.no}</td><td className="py-2.5 pr-3"><Badge tone={ncrTone(record.status)}>{record.status || "진행중"}</Badge></td><td className="max-w-[240px] py-2.5 pr-3 text-slate-300">{record.item || "-"}</td><td className="py-2.5 pr-3 text-slate-300">{record.owner || "-"}</td><td className="py-2.5 text-slate-400">{record.dueDate || "미지정"}</td></tr>)}</tbody></table></div> : <p className="py-5 text-center text-xs text-slate-500">연결된 부적합 기록이 없습니다.</p>}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/25 p-3">
            <div className="mb-2 text-xs font-black text-slate-300">홀드 처리 이력</div>
            {history.length ? <div className="divide-y divide-slate-800">{history.map(event => <div key={event.key} className="py-2.5"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black text-white">{event.title}</span><Badge tone={holdTone(event.status)}>{event.status}</Badge><span className="font-mono text-[10px] text-slate-500">{event.ncr}</span></div><div className="mt-1 text-[11px] text-slate-400">{event.time} · 담당 {event.by || "-"}</div><div className="mt-1 text-[11px] leading-relaxed text-slate-500">{event.detail}{event.rack && event.rack !== "-" ? ` · 격리 ${event.rack}` : ""}</div></div>)}</div> : <p className="py-5 text-center text-xs text-slate-500">홀드 등록 또는 해제 이력이 없습니다.</p>}
          </div>
        </div>
      </Panel>
    </div>;
  }

  TraceTab = function TraceTabWithQualityHold(){
    return <><LinkedTraceTab/><LotQualityHoldPanel/></>;
  };
})();
