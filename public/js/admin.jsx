/* QMES module: admin — extracted from index.html without logic changes. */

const CAT_META = {
  Man: { icon: Users, tone: "blue", label: "Man (사람)" },
  Machine: { icon: Wrench, tone: "violet", label: "Machine (설비)" },
  Material: { icon: Package, tone: "amber", label: "Material (자재)" },
  Method: { icon: Repeat, tone: "green", label: "Method (방법)" },
};

function FourMTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(CAT_META).map(([k, m]) => {
          const cnt = FOURM.filter((f) => f.cat === k).length;
          return (
            <div key={k} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-3">
              <m.icon size={18} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-400">{m.label}</div>
                <div className="text-lg font-bold text-slate-100 tabular-nums">{cnt}<span className="text-xs text-slate-500 font-normal ml-1">건</span></div>
              </div>
            </div>
          );
        })}
      </div>

      <Panel title="4M 변경 이력" right={<span className="text-xs text-slate-400">변경점은 해당 Lot에 연결되어 추적됩니다</span>}>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="text-left py-2 pr-3 font-medium">변경번호</th>
                <th className="text-left py-2 pr-3 font-medium">구분</th>
                <th className="text-left py-2 pr-3 font-medium">변경일</th>
                <th className="text-left py-2 pr-3 font-medium">변경 내용</th>
                <th className="text-left py-2 pr-3 font-medium">사유</th>
                <th className="text-left py-2 pr-3 font-medium">적용 Lot</th>
                <th className="text-left py-2 pr-3 font-medium">상태</th>
                <th className="text-left py-2 font-medium">승인자</th>
              </tr>
            </thead>
            <tbody>
              {FOURM.map((f) => {
                const m = CAT_META[f.cat];
                return (
                  <tr key={f.no} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2.5 pr-3 font-mono text-xs text-sky-300">{f.no}</td>
                    <td className="py-2.5 pr-3"><Badge tone={m.tone}>{f.cat}</Badge></td>
                    <td className="py-2.5 pr-3 text-xs tabular-nums text-slate-300">{f.date}</td>
                    <td className="py-2.5 pr-3 text-slate-100 text-xs">{f.item}</td>
                    <td className="py-2.5 pr-3 text-slate-400 text-xs">{f.reason}</td>
                    <td className="py-2.5 pr-3 text-xs font-mono text-slate-400">{f.lots}</td>
                    <td className="py-2.5 pr-3"><Badge tone={f.status === "승인완료" ? "green" : "amber"}>{f.status}</Badge></td>
                    <td className="py-2.5 text-xs text-slate-400">{f.approver}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          고객 통보 대상 4M 변경(공급사·설비·공법 변경 등)은 사전 승인 후 적용하며, 변경 전/후 초물 검사 결과를 첨부합니다. 관리계획서 개정 이력(O-Ring 재질 변경, Gauss 측정기 추가)과 연동됩니다.
        </p>
      </Panel>
    </div>
  );
}

/* ──────────────────────────── 부적합 관리 (8D) 탭 ──────────────────────────── */

function NcrTab() {
  const open = NCRS.filter((n) => n.status !== "완료").length;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi icon={ShieldAlert} label="당월 부적합 발생" value={NCRS.length} unit="건" tone="text-red-400" />
        <Kpi icon={Activity} label="진행중 (Open)" value={open} unit="건" tone="text-amber-400" />
        <Kpi icon={CheckCircle2} label="완료 (8D Close)" value={NCRS.length - open} unit="건" tone="text-emerald-400" />
      </div>

      {NCRS.map((n) => (
        <Panel key={n.no}
          title={`${n.no} — ${n.item}`}
          right={<Badge tone={n.status === "완료" ? "green" : "amber"}>{n.status}</Badge>}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div><div className="text-xs text-slate-500">발생일</div><div className="text-sm text-slate-100 mt-0.5 tabular-nums">{n.date}</div></div>
            <div><div className="text-xs text-slate-500">대상 Lot</div><div className="text-xs text-sky-300 font-mono mt-1">{n.lot}</div></div>
            <div><div className="text-xs text-slate-500">결점 등급</div><div className="mt-1"><Badge tone={n.grade === "중결점" ? "red" : "amber"}>{n.grade}</Badge></div></div>
            <div><div className="text-xs text-slate-500">담당</div><div className="text-sm text-slate-100 mt-0.5">{n.owner}</div></div>
          </div>

          {/* 8D 진행 단계 */}
          <div className="flex gap-1 mb-2">
            {D_STEPS.map((d, i) => (
              <div key={i} className="flex-1 min-w-0">
                <div className={`h-1.5 rounded ${i < n.d ? (n.status === "완료" ? "bg-emerald-400" : "bg-sky-400") : "bg-slate-800"}`} />
                <div className={`text-[9px] mt-1 truncate ${i < n.d ? "text-slate-300" : "text-slate-600"}`}>{d}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            <span className="text-slate-500">조치 내용: </span>{n.action}
          </p>
        </Panel>
      ))}
      <p className="text-[11px] text-slate-500">
        부적합 처리 절차: 격리·식별 → 임시조치 → 원인분석(특성요인도/5Why) → 시정조치 → 유효성 검증 → 재발방지·표준화 (NMCOP3-SP05). 협력사 원인 부적합은 CAR 발행·회신 관리.
      </p>
    </div>
  );
}

/* ──────────────────────────── 검사 성적서 통합 조회 · 인쇄 ──────────────────────────── */


function ComplaintTab() {
  const [items, setItems] = useState(DB.complaints);
  const [form, setForm] = useState({ customer: "K배터리솔루션", channel: "GQMS 시정조치 요구", lot: "", item: "", grade: "경미" });
  const [seq, setSeq] = useState(DB.seqs.cc || 1);
  const [tried, setTried] = useState(false);

  const open = items.filter((c) => c.status !== "완료").length;
  const lotOk = form.lot.trim() === "" || /^[A-D][A-Z][A-L]\d{4}$/.test(form.lot.trim());
  const ccErrors = [];
  if (!lotOk) ccErrors.push("Lot 형식 오류 — 채번 체계(예: CBG1001)에 맞게 입력하거나 비워두세요");
  if (tried && form.item.trim() === "") ccErrors.push("불만 내용을 입력하세요 — 접수 진입 금지");
  const ccReady = lotOk && form.item.trim() !== "";

  const receive = () => {
    if (!ccReady) { setTried(true); return; }
    const now = new Date();
    const t = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const ni = [
      {
        no: `CC-${String(seq).padStart(3, "0")}`, date: new Date().toLocaleDateString("ko-KR"), customer: form.customer, channel: form.channel,
        lot: form.lot.trim() || "-", item: form.item.trim(), grade: form.grade, status: "진행중",
        flow: [`${t} 접수 — ${form.grade === "중대" ? "4시간" : "24시간"} 내 초동 회신 기한 · 담당 ${window.__QMES_USER__ || "미지정"}`, "-", "-", "-", "-", "-"],
      },
      ...items,
    ];
    setItems(ni);
    DB.complaints = ni;
    DB.seqs.cc = seq + 1;
    dbSave();
    setSeq(seq + 1);
    setForm({ ...form, lot: "", item: "" });
    setTried(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={MessageSquareWarning} label="당월 접수" value={items.length} unit="건" tone="text-amber-400" />
        <Kpi icon={Activity} label="진행중 (Open)" value={open} unit="건" tone="text-sky-400" />
        <Kpi icon={CheckCircle2} label="완료 (Close)" value={items.length - open} unit="건" tone="text-emerald-400" />
        <Kpi icon={PhoneCall} label="초동 회신 준수율" value="—" unit="%" tone="text-violet-400" />
      </div>

      <Panel title="고객불만 접수 (GQMS · 품질 협의체 · 유선)" right={<span className="text-xs text-slate-400">중대 4시간 / 경미 24시간 내 초동 회신</span>}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">고객사</span>
            <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
              <option>K배터리솔루션</option><option>기타 고객사</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">접수 채널</span>
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
              <option>GQMS 시정조치 요구</option><option>품질 협의체</option><option>유선/메일</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">대상 Lot (선택)</span>
            <input value={form.lot} onChange={(e) => setForm({ ...form, lot: e.target.value.toUpperCase() })} placeholder="예: CBG1001"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[10px] text-slate-500">불만 내용</span>
            <input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="불만·결함 내용 입력"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
          </div>
          <div className="flex gap-2">
            <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
              <option>경미</option><option>중대</option>
            </select>
            <button onClick={receive}
              className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors bg-sky-600 hover:bg-sky-500 text-white">
              <Plus size={14} /> 접수
            </button>
          </div>
        </div>
        {ccErrors.length > 0 && (
          <div className="mt-2 bg-red-500/10 border border-red-500/40 rounded px-3 py-2">
            {ccErrors.map((e, i) => <div key={i} className="text-[11px] text-red-300">· {e}</div>)}
          </div>
        )}
      </Panel>

      {items.length === 0 && (
        <Panel title="접수 이력">
          <p className="text-sm text-slate-500">접수된 고객불만이 없습니다 — 접수 시 6단계 처리 Flow(접수 → 초동조치 → 원인분석 → 시정조치 → 재발방지 → 고객승인·Close)가 자동 생성됩니다.</p>
        </Panel>
      )}

      {items.map((c) => {
        const doneCount = c.flow.filter((f) => f !== "-").length;
        return (
          <Panel key={c.no}
            title={`${c.no} — ${c.item}`}
            right={<div className="flex items-center gap-2"><Badge tone={c.grade === "중대" ? "red" : "amber"}>{c.grade}</Badge><Badge tone={c.status === "완료" ? "green" : "blue"}>{c.status}</Badge></div>}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div><div className="text-xs text-slate-500">접수일</div><div className="text-sm text-slate-100 mt-0.5 tabular-nums">{c.date}</div></div>
              <div><div className="text-xs text-slate-500">고객사 / 채널</div><div className="text-sm text-slate-100 mt-0.5">{c.customer} <span className="text-xs text-slate-500">· {c.channel}</span></div></div>
              <div><div className="text-xs text-slate-500">대상 Lot</div><div className="text-xs text-sky-300 font-mono mt-1">{c.lot}</div></div>
              <div><div className="text-xs text-slate-500">진행</div><div className="text-sm text-slate-100 mt-0.5 tabular-nums">{doneCount} / 6 단계</div></div>
            </div>

            <div className="flex gap-1 mb-3">
              {COMPLAINT_FLOW_LABELS.map((l, i) => (
                <div key={i} className="flex-1 min-w-0">
                  <div className={`h-1.5 rounded ${c.flow[i] !== "-" ? (c.status === "완료" ? "bg-emerald-400" : "bg-sky-400") : "bg-slate-800"}`} />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {COMPLAINT_FLOW_LABELS.map((l, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className={`text-[11px] w-44 shrink-0 pt-0.5 ${c.flow[i] !== "-" ? "text-slate-300" : "text-slate-600"}`}>{l}</span>
                  <span className={`text-xs leading-relaxed ${c.flow[i] !== "-" ? "text-slate-200" : "text-slate-600"}`}>{c.flow[i]}</span>
                </div>
              ))}
            </div>
          </Panel>
        );
      })}
      <p className="text-[11px] text-slate-500">
        중대 불만은 부적합(8D)·CAR와 연계 처리하며, 재발방지는 인터락 게이트에 반영합니다. GQMS 시정조치는 고객 유효성 승인 후 Close 처리.
      </p>
    </div>
  );
}

/* ──────────────────────────── 메인 앱 ──────────────────────────── */


const AUTH_MEM = { users: null };
const DEFAULT_USERS = [{ id: "admin", uid: "U-0001", pw: "1234", name: "관리자", dept: "관리부", role: "admin" }];
function nextUid(users) {
  const max = users.reduce((m, u) => Math.max(m, parseInt((u.uid || "U-0000").slice(2), 10) || 0), 0);
  return `U-${String(max + 1).padStart(4, "0")}`;
}
const USERS_KEY = "qmes-users-v3";

async function hashText(t) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let h = 0x811c9dc5;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return "f" + h.toString(16);
  }
}

function loadUsers() {
  try {
    window.localStorage.removeItem("qmes-users");
    window.localStorage.removeItem("qmes-users-v2");
    window.localStorage.removeItem("qmes-settings");
    const raw = window.localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 저장소 미지원 — 메모리 사용 */ }
  return AUTH_MEM.users || DEFAULT_USERS.map((u) => ({ ...u }));
}
function saveUsers(users) {
  AUTH_MEM.users = users;
  try { window.localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch (e) { /* 무시 */ }
}

const DEPTS = ["생산부", "품질부", "연구소", "영업부", "관리부"];

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState(null);
  const [lf, setLf] = useState({ name: "", pw: "" });
  const [rf, setRf] = useState({ name: "", dept: DEPTS[0], pw: "", pw2: "" });
  const [lock, setLock] = useState({ fail: 0, until: 0 });

  const users = loadUsers();
  const dup = users.some((u) => u.name === rf.name.trim() || u.id === rf.name.trim());
  const regErrors = [];
  if (rf.name.trim() !== "" && dup) regErrors.push("이미 등록된 이름입니다 — 뒤에 구분자를 붙여주세요 (예: 홍길동B)");
  if (rf.pw !== "" && rf.pw.length < 4) regErrors.push("비밀번호는 4자 이상");
  if (rf.pw2 !== "" && rf.pw !== rf.pw2) regErrors.push("비밀번호가 일치하지 않습니다");
  const regReady = rf.name.trim() !== "" && !dup && rf.pw.length >= 4 && rf.pw === rf.pw2;

  const register = async () => {
    if (!regReady) return;
    const cur = loadUsers();
    const pwHash = await hashText(rf.pw);
    const nu = { id: rf.name.trim(), uid: nextUid(cur), pwHash, name: rf.name.trim(), dept: rf.dept, role: "user", joined: new Date().toLocaleString("ko-KR", { hour12: false }) };
    saveUsers([...cur, nu]);
    onLogin(nu); // 가입 즉시 자동 승인 — 바로 입장
  };

  const login = async () => {
    if (Date.now() < lock.until) {
      setMsg({ tone: "red", text: `로그인 잠금 중 — ${Math.ceil((lock.until - Date.now()) / 1000)}초 후 다시 시도하세요` });
      return;
    }
    const cur = loadUsers();
    const key = lf.name.trim();
    const u = cur.find((x) => x.name === key || x.id === key);
    let ok = false;
    if (u) {
      if (u.pwHash) ok = (await hashText(lf.pw)) === u.pwHash;
      else if (u.pw != null) {
        ok = u.pw === lf.pw;
        if (ok) { u.pwHash = await hashText(lf.pw); delete u.pw; saveUsers(cur); }
      }
    }
    if (!ok) {
      const fail = lock.fail + 1;
      if (fail >= 5) { setLock({ fail: 0, until: Date.now() + 60000 }); setMsg({ tone: "red", text: "5회 실패 — 60초간 로그인이 잠깁니다" }); }
      else { setLock({ ...lock, fail }); setMsg({ tone: "red", text: `이름 또는 비밀번호가 올바르지 않습니다 (${fail}/5)` }); }
      return;
    }
    setLock({ fail: 0, until: 0 });
    setMsg(null);
    onLogin(u);
  };

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500";
  const label = (t) => <div className="text-[11px] text-slate-500 mb-1">{t}</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4" style={{ fontFamily: "'Pretendard', 'Noto Sans KR', system-ui, sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center">
            <FlaskConical size={20} className="text-sky-400" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-widest">QMES</div>
            <div className="text-[11px] text-slate-500 -mt-0.5">나모케미칼㈜  · 품질제조실행시스템</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-1 bg-slate-800/60 rounded-lg p-1 mb-5">
            {[["login", "로그인"], ["register", "회원가입"]].map(([m, t]) => (
              <button key={m} onClick={() => { setMode(m); setMsg(null); }}
                className={`py-2 rounded-md text-sm font-medium transition-colors ${mode === m ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
                {t}
              </button>
            ))}
          </div>

          {msg && (
            <div className={`mb-4 rounded-lg px-3 py-2.5 text-xs border ${msg.tone === "green" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" : "bg-red-500/10 border-red-500/40 text-red-300"}`}>
              {msg.text}
            </div>
          )}

          {mode === "login" ? (
            <div className="flex flex-col gap-3">
              <div>{label("이름")}<input value={lf.name} onChange={(e) => setLf({ ...lf, name: e.target.value })} placeholder="이름 입력" className={inputCls} /></div>
              <div>{label("비밀번호")}
                <input type="password" value={lf.pw} onChange={(e) => setLf({ ...lf, pw: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && login()} placeholder="비밀번호" className={inputCls} />
              </div>
              <button onClick={login}
                className="mt-1 w-full bg-sky-600 hover:bg-sky-500 text-white rounded-lg py-2.5 text-sm font-bold transition-colors">
                로그인
              </button>
              <p className="text-[11px] text-slate-500 text-center">관리자 초기 계정: 관리자 / 1234 · 계정이 없으면 회원가입 (즉시 사용 가능)</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>{label("이름")}<input value={rf.name} onChange={(e) => setRf({ ...rf, name: e.target.value })} placeholder="홍길동" className={inputCls} /></div>
                <div>{label("부서")}
                  <select value={rf.dept} onChange={(e) => setRf({ ...rf, dept: e.target.value })} className={inputCls}>
                    {DEPTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>{label("비밀번호 (4자 이상)")}<input type="password" value={rf.pw} onChange={(e) => setRf({ ...rf, pw: e.target.value })} className={inputCls} /></div>
                <div>{label("비밀번호 확인")}
                  <input type="password" value={rf.pw2} onChange={(e) => setRf({ ...rf, pw2: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && register()} className={inputCls} />
                </div>
              </div>
              {regErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                  {regErrors.map((e, i) => <div key={i} className="text-[11px] text-red-300">· {e}</div>)}
                </div>
              )}
              <button onClick={register} disabled={!regReady}
                className={`mt-1 w-full rounded-lg py-2.5 text-sm font-bold transition-colors ${regReady ? "bg-sky-600 hover:bg-sky-500 text-white" : "bg-slate-800 text-slate-600"}`}>
                가입하고 바로 시작
              </button>
              <p className="text-[11px] text-slate-500 text-center">가입 즉시 자동 승인 · 고유번호(U-xxxx)가 자동 부여되어 이름과 함께 모든 기록에 남습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



/* ──────────────────────────── 회원 관리 (관리자 전용) ──────────────────────────── */

function MembersTab() {
  const [users, setUsers] = useState(loadUsers);
  const [info, setInfo] = useState(null);

  const update = (next) => { setUsers(next); saveUsers(next); };
  const remove = (id) => { if (id === "admin") return; update(users.filter((u) => u.id !== id)); };
  const toggleRole = (id) => {
    if (id === "admin") return;
    update(users.map((u) => (u.id === id ? { ...u, role: u.role === "admin" ? "user" : "admin" } : u)));
  };
  const resetPw = async (id) => {
    const tempHash = await hashText("0000");
    update(users.map((u) => (u.id === id ? { ...u, pwHash: tempHash, pw: undefined } : u)));
    const t = users.find((u) => u.id === id);
    setInfo(`${t ? t.name : id} 비밀번호를 임시번호 0000 으로 초기화했습니다`);
  };
  const resetAll = () => {
    AUTH_MEM.users = null;
    try { window.localStorage.removeItem(USERS_KEY); } catch (e) { /* 무시 */ }
    dbReset();
    setUsers(loadUsers());
    setInfo("모든 회원·업무 기록(배치/검사/Lot/홀드/점검)을 초기화했습니다 — 초기 계정(관리자/1234)만 남습니다");
  };

  return (
    <div className="flex flex-col gap-4">
      {info && (
        <div className="rounded-lg px-4 py-3 text-sm border bg-emerald-500/10 border-emerald-500/40 text-emerald-300">{info}</div>
      )}

      <Panel title="회원 관리" right={
        <button onClick={resetAll}
          className="text-[11px] px-2.5 py-1.5 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors">
          전체 기록 초기화
        </button>
      }>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="text-left py-2 pr-3 font-medium">고유번호</th>
                <th className="text-left py-2 pr-3 font-medium">이름</th>
                <th className="text-left py-2 pr-3 font-medium">부서</th>
                <th className="text-left py-2 pr-3 font-medium">가입일시</th>
                <th className="text-left py-2 pr-3 font-medium">권한</th>
                <th className="text-left py-2 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3 font-mono text-xs text-sky-300">{u.uid || "-"}</td>
                  <td className="py-2.5 pr-3 text-slate-100">{u.name}</td>
                  <td className="py-2.5 pr-3 text-slate-300 text-xs">{u.dept}</td>
                  <td className="py-2.5 pr-3 text-xs text-slate-400 tabular-nums">{u.joined || "-"}</td>
                  <td className="py-2.5 pr-3">{u.role === "admin" ? <Badge tone="violet">관리자</Badge> : <Badge tone="gray">일반</Badge>}</td>
                  <td className="py-2.5">
                    <div className="flex gap-1.5 flex-wrap">
                      {u.id !== "admin" && (
                        <button onClick={() => toggleRole(u.id)}
                          className="text-[11px] px-2 py-1 rounded border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 transition-colors">
                          {u.role === "admin" ? "관리자 해제" : "관리자 지정"}
                        </button>
                      )}
                      <button onClick={() => resetPw(u.id)}
                        className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">
                        비밀번호 초기화
                      </button>
                      {u.id !== "admin" && (
                        <button onClick={() => remove(u.id)}
                          className="text-[11px] px-2 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors">
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          가입은 이름·부서·비밀번호만으로 즉시 승인되며, 관리자 권한은 이 화면에서 지정·해제합니다. 비밀번호는 해시로만 저장되어 원문 조회가 불가하며, 분실 시 초기화(0000)만 가능합니다.
        </p>
      </Panel>
    </div>
  );
}
