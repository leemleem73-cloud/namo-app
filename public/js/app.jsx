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
  sessionStorage.setItem(QMES_LOGIN_SESSION_KEY, JSON.stringify(user));
}

function clearLoginSession() {
  sessionStorage.removeItem(QMES_LOGIN_SESSION_KEY);
}

function QMESLogin({ onLogin }) {
  const [users] = useState(loadLoginUsers);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();

    const id = userId.trim();
    const pw = password.trim();

    const user = users.find((item) =>
      String(item.id || item.name || "").trim() === id ||
      String(item.uid || "").trim() === id ||
      String(item.name || "").trim() === id
    );

    if (!user) {
      setError("등록된 사용자를 찾을 수 없습니다.");
      return;
    }

    const savedPassword = String(user.pw || user.password || "1234");

    if (pw !== savedPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    const normalized = {
      ...user,
      id: user.id || user.name,
      uid: user.uid || "",
      name: user.name || user.id,
      dept: user.dept || user.department || "",
      position: user.position || user.rank || user.title || "",
      role: user.role || "user",
    };

    saveLoginSession(normalized);
    onLogin(normalized);
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
            cursor: "pointer",
          }}
        >
          로그인
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

function QMESApp() {
  const [currentUser, setCurrentUser] = useState(loadLoginSession);

  const handleLogin = (user) => {
    window.__QMES_CURRENT_USER__ = user;
    window.__QMES_USER__ = `${user.dept || ""} ${user.name} (${user.uid || ""})`;
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearLoginSession();
    delete window.__QMES_CURRENT_USER__;
    delete window.__QMES_USER__;
    setCurrentUser(null);
  };

  if (!currentUser) return <QMESLogin onLogin={handleLogin} />;

  window.__QMES_CURRENT_USER__ = currentUser;
  window.__QMES_USER__ = `${currentUser.dept || ""} ${currentUser.name} (${currentUser.uid || ""})`;

  return <QMESChemical user={currentUser} onLogout={handleLogout} />;
}

qmesStart();
