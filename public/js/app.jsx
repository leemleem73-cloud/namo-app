/* QMES login entry point - restored for attendance testing */
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
  try {
    sessionStorage.setItem(QMES_LOGIN_SESSION_KEY, JSON.stringify(user));
    return true;
  } catch (error) {
    console.warn("[QMES] 브라우저 로그인 저장소를 사용할 수 없습니다.", error);
    return false;
  }
}

function clearLoginSession() {
  try {
    sessionStorage.removeItem(QMES_LOGIN_SESSION_KEY);
  } catch (error) {
    console.warn("[QMES] 브라우저 로그인 정보를 정리하지 못했습니다.", error);
  }
}

async function qmesFetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
      const response = await qmesFetchWithTimeout("/api/auth/login", {
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
      if (error?.name === "AbortError") {
        setError("로그인 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }
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
      const response = await qmesFetchWithTimeout("/api/auth/password", {
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
      if (error?.name === "AbortError") setError("서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      else setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
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

    qmesFetchWithTimeout("/api/auth/me", { credentials: "same-origin" }, 10000)
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
    qmesFetchWithTimeout("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }, 5000).catch(() => {});
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
