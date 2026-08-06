/* QMES login entry point - restored for attendance testing */

/* Enterprise chemical inventory screen override.
   Keeps the existing inventory master data and presents chemical-manufacturing
   status separately from future IQC / transaction integration. */
window.InventoryTab = function InventoryTab() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [locationFilter, setLocationFilter] = useState("전체 창고");
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  const materials = (Array.isArray(INVENTORY) ? INVENTORY : []).map((item) => {
    const stock = Number(item.stock || 0);
    const safety = Number(item.safety || 0);
    const connected = Boolean(item.connected || stock > 0);
    const ratio = safety > 0 ? stock / safety : 0;
    const status = !connected ? "미연동" : stock <= 0 ? "부족" : ratio < 0.5 ? "부족" : ratio < 1 ? "주의" : "정상";
    return {
      ...item,
      stock,
      safety,
      available: stock,
      inspectionPending: Number(item.inspectionPending || 0),
      lotCount: Number(item.lotCount || 0),
      lastReceivedAt: item.lastReceivedAt || "-",
      status,
      connected,
      ratio: safety > 0 ? Math.min((stock / safety) * 100, 100) : 0,
    };
  });

  const locations = ["전체 창고", ...Array.from(new Set(materials.map((item) => item.loc).filter(Boolean)))];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = materials.filter((item) => {
    const matchesQuery = !normalizedQuery || [item.code, item.name, item.loc, item.cond]
      .some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === "전체 상태" || item.status === statusFilter;
    const matchesLocation = locationFilter === "전체 창고" || item.loc === locationFilter;
    return matchesQuery && matchesStatus && matchesLocation;
  });

  const normalCount = materials.filter((item) => item.status === "정상").length;
  const warningCount = materials.filter((item) => item.status === "주의").length;
  const shortageCount = materials.filter((item) => item.status === "부족").length;
  const unlinkedCount = materials.filter((item) => item.status === "미연동").length;
  const totalAvailable = materials.reduce((sum, item) => sum + item.available, 0);

  const kpis = [
    { label: "전체 자재", value: materials.length, unit: "품목", icon: Package, tone: "sky", detail: "원재료 · 첨가제 마스터" },
    { label: "사용가능 재고", value: totalAvailable.toLocaleString(), unit: "kg", icon: Warehouse, tone: "emerald", detail: "IQC 합격 재고 기준" },
    { label: "정상 재고", value: normalCount, unit: "품목", icon: CheckCircle2, tone: "emerald", detail: "안전재고 이상" },
    { label: "주의 · 부족", value: warningCount + shortageCount, unit: "품목", icon: AlertTriangle, tone: "amber", detail: "구매 검토 대상" },
    { label: "데이터 미연동", value: unlinkedCount, unit: "품목", icon: CircleDot, tone: "slate", detail: "IQC 연동 전 테스트 상태" },
  ];

  const toneClasses = {
    sky: "border-sky-500/25 bg-sky-500/[0.06] text-sky-300",
    emerald: "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/[0.06] text-amber-300",
    slate: "border-slate-600/70 bg-slate-800/50 text-slate-300",
  };

  const statusBadge = (status) => {
    if (status === "정상") return <Badge tone="green">사용 가능</Badge>;
    if (status === "주의") return <Badge tone="amber">안전재고 주의</Badge>;
    if (status === "부족") return <Badge tone="red">재고 부족</Badge>;
    return <Badge tone="slate">데이터 미연동</Badge>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-sky-400 uppercase">
            <Warehouse size={14} /> Chemical Inventory Control
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">원재료 재고관리</h2>
          <p className="text-xs text-slate-500 mt-1">케미칼 원재료의 사용가능 재고, 안전재고, 보관조건 및 LOT 연계 상태를 관리합니다.</p>
        </div>
        <div className="text-[11px] text-slate-500 text-right">
          <div>기준 시각 {refreshedAt.toLocaleString("ko-KR")}</div>
          <div className="mt-0.5">현재 화면은 MES 구조 검증용이며 IQC 연동 전 품목은 ‘미연동’으로 표시됩니다.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-xl border p-4 ${toneClasses[item.tone]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-400">{item.label}</div>
                  <div className="mt-2 flex items-end gap-1.5">
                    <span className="text-2xl font-black text-slate-100 tabular-nums">{item.value}</span>
                    <span className="text-[11px] text-slate-500 mb-1">{item.unit}</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg border border-current/20 flex items-center justify-center bg-black/10">
                  <Icon size={17} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500">{item.detail}</div>
            </div>
          );
        })}
      </div>

      {(warningCount + shortageCount) > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
          <AlertTriangle size={17} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-bold text-amber-200">안전재고 검토 대상 {warningCount + shortageCount}품목</div>
            <div className="text-xs text-amber-200/60 mt-1">실제 발주 판단은 IQC 입고와 작업지시 실투입 데이터 연동 후 확정합니다.</div>
          </div>
        </div>
      )}

      <Panel
        title="원재료 · 부자재 재고 현황"
        right={<span className="text-xs text-slate-400">조회 {filtered.length} / 전체 {materials.length}품목</span>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_190px_220px_auto] gap-2 mb-4">
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="자재코드, 품명, 창고, 보관조건 검색"
              className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950/60 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-sky-500"
            />
          </label>
          <label className="relative block">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full h-10 appearance-none rounded-lg border border-slate-700 bg-slate-950/60 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-sky-500"
            >
              {["전체 상태", "정상", "주의", "부족", "미연동"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-200 outline-none focus:border-sky-500"
          >
            {locations.map((value) => <option key={value}>{value}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setRefreshedAt(new Date())}
            className="h-10 px-4 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-xs font-bold text-slate-200 inline-flex items-center justify-center gap-2"
          >
            <RotateCw size={14} /> 새로고침
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[1180px]">
            <thead>
              <tr className="text-[11px] text-slate-400 border-y border-slate-800 bg-slate-950/40">
                <th className="text-left py-3 px-3 font-semibold">자재코드</th>
                <th className="text-left py-3 px-3 font-semibold">품명</th>
                <th className="text-right py-3 px-3 font-semibold">사용가능 재고</th>
                <th className="text-right py-3 px-3 font-semibold">IQC 대기</th>
                <th className="text-right py-3 px-3 font-semibold">안전재고</th>
                <th className="text-left py-3 px-3 font-semibold w-40">재고 수준</th>
                <th className="text-center py-3 px-3 font-semibold">LOT</th>
                <th className="text-left py-3 px-3 font-semibold">최근 입고</th>
                <th className="text-left py-3 px-3 font-semibold">보관위치</th>
                <th className="text-left py-3 px-3 font-semibold">보관조건</th>
                <th className="text-left py-3 px-3 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.code} className="border-b border-slate-800/70 hover:bg-sky-500/[0.035] transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-bold text-sky-300">{item.code}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-100">{item.name}</div>
                    <div className="text-[10px] text-slate-600 mt-1">원재료 마스터</div>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    <div className="font-bold text-slate-100">{item.available.toLocaleString()} <span className="text-[10px] text-slate-500">{item.unit}</span></div>
                    {!item.connected && <div className="text-[10px] text-slate-600 mt-1">실적 연동 전</div>}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-400">{item.inspectionPending.toLocaleString()} <span className="text-[10px] text-slate-600">{item.unit}</span></td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-300">{item.safety.toLocaleString()} <span className="text-[10px] text-slate-600">{item.unit}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="text-slate-500">안전재고 대비</span>
                      <span className="text-slate-400">{item.connected ? `${Math.round(item.ratio)}%` : "-"}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.status === "정상" ? "bg-emerald-400" : item.status === "주의" ? "bg-amber-400" : item.status === "부족" ? "bg-rose-400" : "bg-slate-700"}`}
                        style={{ width: `${item.connected ? Math.max(item.ratio, 3) : 0}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums text-slate-300">{item.lotCount || "-"}</td>
                  <td className="py-3 px-3 text-xs text-slate-400">{item.lastReceivedAt}</td>
                  <td className="py-3 px-3 text-xs text-slate-300">{item.loc}</td>
                  <td className="py-3 px-3 text-xs text-slate-400">{item.cond}</td>
                  <td className="py-3 px-3">{statusBadge(item.status)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="11" className="py-14 text-center">
                    <Boxes size={28} className="mx-auto text-slate-700" />
                    <div className="text-sm font-semibold text-slate-400 mt-3">조건에 맞는 재고가 없습니다.</div>
                    <div className="text-xs text-slate-600 mt-1">검색어 또는 필터 조건을 변경해 주세요.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3 text-[11px]">
          <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3 text-slate-500">
            <span className="font-bold text-slate-300">재고 상태 기준</span>
            <span className="ml-3">정상: 안전재고 이상 · 주의: 안전재고 50~100% · 부족: 50% 미만 · 미연동: 실제 입고 데이터 없음</span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3 text-slate-500">
            <span className="font-bold text-slate-300">케미칼 보관 기준</span>
            <span className="ml-3">창고 25±5℃ · 습도 50% 이하 · 드라이룸 RH 0.54% 이하 / DP -40℃ · FIFO 관리</span>
          </div>
        </div>
      </Panel>
    </div>
  );
};

const QMES_LOGIN_SESSION_KEY = "qmes-current-user-v1";

function loadLoginUsers() {
  try {
    const users = typeof loadUsers === "function" ? loadUsers() : [];
    return Array.isArray(users) ? users.filter((user) => user && user.name) : [];
  } catch (error) {
    console.warn("[QMES] 사용자 목록을 불러오지 못했습니다.", error);
    return [];
  }
}

function loadLoginSession() {
  try {
    return JSON.parse(sessionStorage.getItem(QMES_LOGIN_SESSION_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveLoginSession(user) {
  sessionStorage.setItem(QMES_LOGIN_SESSION_KEY, JSON.stringify(user));
}

function clearLoginSession() {
  sessionStorage.removeItem(QMES_LOGIN_SESSION_KEY);
}

function QMESLogin({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const id = userId.trim();
    const pw = password.trim();

    if (!id || !pw) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: id, password: pw }),
      });
      const payload = await response.json().catch(() => ({
        success: false,
        message: "서버 로그인 응답을 확인할 수 없습니다.",
      }));

      if (!response.ok || !payload.success || !payload.data?.user) {
        setError(payload.message || "로그인에 실패했습니다.");
        return;
      }

      const authenticated = payload.data.user;
      const normalized = {
        id: authenticated.id,
        uid: authenticated.uid || "",
        name: authenticated.name,
        email: authenticated.email || "",
        dept: authenticated.department || "",
        position: authenticated.title || "",
        role: authenticated.role || "user",
        mustChangePassword: Boolean(authenticated.mustChangePassword),
      };

      saveLoginSession(normalized);
      onLogin(normalized);
    } catch (error) {
      console.error("[QMES] 서버 로그인 실패", error);
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#07162b,#0c3156)",
        fontFamily: "'Pretendard','Noto Sans KR',sans-serif",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "min(420px,100%)",
          background: "white",
          borderRadius: 22,
          padding: "36px 32px",
          boxShadow: "0 24px 70px rgba(0,0,0,.32)",
        }}
      >
        <div
          style={{
            fontSize: 25,
            fontWeight: 950,
            color: "#0f2740",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          나모케미칼 QMES
        </div>

        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 800,
            color: "#334155",
            marginBottom: 6,
          }}
        >
          아이디 또는 사번
        </label>

        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="예: 임흥배 또는 U-0009"
          autoComplete="username"
          style={{
            width: "100%",
            height: 46,
            border: "1px solid #cbd5e1",
            borderRadius: 11,
            padding: "0 13px",
            fontSize: 14,
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 800,
            color: "#334155",
            marginTop: 15,
            marginBottom: 6,
          }}
        >
          비밀번호
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="초기 비밀번호 1234"
          autoComplete="current-password"
          style={{
            width: "100%",
            height: 46,
            border: "1px solid #cbd5e1",
            borderRadius: 11,
            padding: "0 13px",
            fontSize: 14,
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "#dc2626",
              fontWeight: 700,
              marginTop: 10,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            height: 48,
            border: 0,
            borderRadius: 11,
            background: "#0f5d8f",
            color: "white",
            fontSize: 15,
            fontWeight: 900,
            marginTop: 20,
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "로그인 확인 중..." : "로그인"}
        </button>

        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          초기 비밀번호 : 1234
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 10,
          }}
        >
          <a
            href="https://namochemical.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#0f5d8f",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🌐 나모케미칼 홈페이지
          </a>
        </div>
      </form>
    </div>
  );
}

function QMESInitialPasswordChange({ user, onComplete, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (newPassword.length < 4) {
      setError("새 비밀번호는 4자 이상 입력해 주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => ({
        success: false,
        message: "서버 응답을 확인할 수 없습니다.",
      }));
      if (!response.ok || !payload.success) {
        setError(payload.message || "비밀번호 변경에 실패했습니다.");
        return;
      }

      const nextUser = { ...user, mustChangePassword: false };
      saveLoginSession(nextUser);
      onComplete(nextUser);
    } catch (error) {
      console.error("[QMES] 초기 비밀번호 변경 실패", error);
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#07162b,#0c3156)",fontFamily:"'Pretendard','Noto Sans KR',sans-serif",padding:20}}>
      <form onSubmit={submit} style={{width:"min(420px,100%)",background:"white",borderRadius:22,padding:"34px 32px",boxShadow:"0 24px 70px rgba(0,0,0,.32)"}}>
        <div style={{fontSize:23,fontWeight:950,color:"#0f2740",textAlign:"center"}}>초기 비밀번호 변경</div>
        <p style={{fontSize:13,lineHeight:1.6,color:"#64748b",textAlign:"center",margin:"12px 0 22px"}}>{user.name}님, 안전한 사용을 위해 새 비밀번호를 설정해 주세요.</p>
        {[
          ["현재 비밀번호",currentPassword,setCurrentPassword,"current-password"],
          ["새 비밀번호",newPassword,setNewPassword,"new-password"],
          ["새 비밀번호 확인",confirmPassword,setConfirmPassword,"new-password"],
        ].map(([label,value,setValue,autoComplete])=><label key={label} style={{display:"block",fontSize:12,fontWeight:800,color:"#334155",marginTop:13}}>{label}<input type="password" value={value} onChange={e=>setValue(e.target.value)} autoComplete={autoComplete} style={{display:"block",width:"100%",height:44,boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:10,padding:"0 12px",marginTop:6,fontSize:14}}/></label>)}
        {error&&<div style={{fontSize:12,color:"#dc2626",fontWeight:700,marginTop:11}}>{error}</div>}
        <button type="submit" disabled={submitting} style={{width:"100%",height:47,border:0,borderRadius:11,background:"#0f5d8f",color:"white",fontSize:15,fontWeight:900,marginTop:20,cursor:submitting?"wait":"pointer",opacity:submitting ? 0.7 : 1}}>{submitting?"변경 중...":"비밀번호 변경"}</button>
        <button type="button" onClick={onLogout} style={{width:"100%",height:40,border:0,background:"transparent",color:"#64748b",fontSize:13,fontWeight:700,marginTop:8,cursor:"pointer"}}>로그아웃</button>
      </form>
    </div>
  );
}

function QMESApp() {
  const [currentUser, setCurrentUser] = useState(loadLoginSession);
  const [checkingSession, setCheckingSession] = useState(() => Boolean(loadLoginSession()));

  useEffect(() => {
    let active = true;
    const saved = loadLoginSession();

    if (!saved) {
      setCheckingSession(false);
      return () => { active = false; };
    }

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({ success: false }));
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error("서버 로그인 세션이 만료되었습니다.");
        }
        return payload.data;
      })
      .then((authenticated) => {
        if (!active) return;
        const normalized = {
          id: authenticated.id,
          uid: authenticated.uid || "",
          name: authenticated.name,
          email: authenticated.email || "",
          dept: authenticated.department || "",
          position: authenticated.title || "",
          role: authenticated.role || "user",
          mustChangePassword: Boolean(authenticated.mustChangePassword),
        };
        saveLoginSession(normalized);
        setCurrentUser(normalized);
      })
      .catch(() => {
        if (!active) return;
        clearLoginSession();
        setCurrentUser(null);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => { active = false; };
  }, []);

  const handleLogin = (user) => {
    window.__QMES_CURRENT_USER__ = user;
    window.__QMES_USER__ = `${user.dept || ""} ${user.name} (${user.uid || ""})`;
    setCheckingSession(false);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => {});
    clearLoginSession();
    delete window.__QMES_CURRENT_USER__;
    delete window.__QMES_USER__;
    setCurrentUser(null);
  };

  if (checkingSession) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07162b",color:"white",fontWeight:800}}>
        로그인 상태 확인 중...
      </div>
    );
  }

  if (!currentUser) return <QMESLogin onLogin={handleLogin} />;
  if (currentUser.mustChangePassword) {
    return <QMESInitialPasswordChange user={currentUser} onComplete={handleLogin} onLogout={handleLogout} />;
  }

  window.__QMES_CURRENT_USER__ = currentUser;
  window.__QMES_USER__ = `${currentUser.dept || ""} ${currentUser.name} (${currentUser.uid || ""})`;

  return <QMESChemical user={currentUser} onLogout={handleLogout} />;
}

qmesStart();
