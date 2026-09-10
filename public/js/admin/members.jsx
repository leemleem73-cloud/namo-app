/* QMES 관리자 모듈: 회원등록 현황 - 직원별 메뉴 접근권한 */
function MembersManagementTab() {
  const departments = ["대표", "관리부", "경영지원부", "연구소", "생산부", "영업부", "품질부"];
  const emptyForm = { name: "", email: "", department: departments[0], title: "", phone: "", role: "user", status: "APPROVED" };
  const PERMISSION_KEY = "qmes-user-menu-permissions-v1";
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingOriginalName, setEditingOriginalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(null);
  const [permissionUser, setPermissionUser] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState([]);

  const knownUid = {
    "관리자": "U-0001", "김종혁": "U-0002", "김세희": "U-0003", "정영기": "U-0004",
    "박지헌": "U-0005", "박도훈": "U-0006", "문지훈": "U-0007", "김현진": "U-0008",
    "임흥배": "U-0009", "박현아": "U-0010"
  };

  const permissionGroups = [
    { title: "ERP", items: [
      ["erpSales", "수주 · 납기관리"], ["erpPlan", "생산계획 · MRP"], ["erpPurchase", "구매 · 발주관리"],
      ["invOverview", "재고현황"], ["invMovement", "입출고 관리"], ["invLot", "LOT별 재고"],
      ["invProduction", "생산투입/완료"], ["invCount", "재고실사"], ["partners", "거래처 현황"], ["erpShipping", "출하 · 납품관리"]
    ]},
    { title: "MES · QMS", items: [
      ["prod", "생산 진행"], ["woIssue", "작업지시서"], ["prodProcess", "생산공정 관리"],
      ["iqc", "수입검사 (IQC)"], ["pqc", "공정검사 (PQC)"], ["oqc", "출하검사 (OQC)"],
      ["spc", "SPC (Cpk)"], ["lock", "품질 인터락"], ["coa", "출하성적서"], ["trace", "LOT 통합추적"],
      ["ncr", "부적합 (8D)"], ["cc", "고객불만 (GQMS)"], ["4m", "4M 변경관리"],
      ["pop", "현장 입력 (iPad)"], ["eq", "설비 모니터링"]
    ]}
  ];
  const allPermissionKeys = permissionGroups.flatMap(group => group.items.map(item => item[0]));

  const departmentDefaults = {
    "대표": allPermissionKeys,
    "관리부": ["erpPlan", "erpPurchase", "invOverview", "invMovement", "invLot", "invCount", "partners", "trace"],
    "경영지원부": ["erpPlan", "erpPurchase", "invOverview", "invMovement", "invLot", "invCount", "partners", "trace"],
    "연구소": ["iqc", "pqc", "oqc", "spc", "trace"],
    "생산부": ["prod", "woIssue", "prodProcess", "invOverview", "invMovement", "invLot", "invProduction", "invCount", "trace", "pop", "eq"],
    "영업부": ["erpSales", "erpShipping", "partners", "trace", "invOverview"],
    "품질부": ["iqc", "pqc", "oqc", "spc", "lock", "coa", "trace", "ncr", "cc", "4m", "partners"]
  };

  const api = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options, headers });
    const payload = await response.json().catch(() => ({ success: false, message: `HTTP ${response.status}` }));
    if (!response.ok || !payload?.success) throw new Error(payload?.message || "요청 처리에 실패했습니다.");
    return payload;
  };

  const readLocalUsers = () => {
    try {
      if (typeof loadUsers === "function") return loadUsers();
      const parsed = JSON.parse(localStorage.getItem("qmes-users-v3") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) { return []; }
  };

  const writeLocalUsers = (rows) => {
    try {
      if (typeof saveUsers === "function") saveUsers(rows);
      else localStorage.setItem("qmes-users-v3", JSON.stringify(rows));
    } catch (_error) {}
  };

  const readPermissionMap = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PERMISSION_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_error) { return {}; }
  };

  const permissionIdentity = (user) => String(user?.name || user?.uid || user?.id || "").replace(/\s+/g, "").trim();

  const savedPermissionEntry = (user) => {
    const map = readPermissionMap();
    return map[permissionIdentity(user)] || null;
  };

  const writePermissions = (user, allowed) => {
    const map = readPermissionMap();
    const key = permissionIdentity(user);
    map[key] = {
      name: user.name || key,
      uid: user.uid || knownUid[user.name] || "",
      department: user.department || "",
      allowed: Array.from(new Set(allowed.filter(value => allPermissionKeys.includes(value)))),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PERMISSION_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("qmes:menu-permissions-changed", { detail: { user: key } }));
  };

  const localByName = () => new Map(readLocalUsers().map((u) => [String(u.name || u.id || "").trim(), u]));

  const mergeLocalExtras = (rows) => {
    const local = localByName();
    return (Array.isArray(rows) ? rows : []).map((u) => {
      const extra = local.get(String(u.name || "").trim()) || {};
      return { ...u, uid: u.uid || extra.uid || knownUid[u.name] || "-", phone: u.phone || extra.phone || "" };
    });
  };

  const saveLocalExtra = (beforeName, next) => {
    const current = readLocalUsers();
    let found = false;
    const updated = current.map((u) => {
      const uname = String(u.name || u.id || "").trim();
      if (uname !== beforeName) return u;
      found = true;
      return { ...u, id: next.name, name: next.name, dept: next.department, position: next.title, phone: next.phone || "", email: next.email, role: next.role || u.role || "user" };
    });
    if (!found) updated.push({ id: next.name, uid: knownUid[next.name] || "", name: next.name, dept: next.department, position: next.title, phone: next.phone || "", email: next.email, role: next.role || "user" });
    writeLocalUsers(updated);
  };

  const loadMembers = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const payload = await api("/api/admin/users");
      setUsers(mergeLocalExtras(payload.data));
      if (!quiet) setInfo(null);
    } catch (error) {
      setInfo({ tone: "red", text: error.message || "회원 정보를 불러오지 못했습니다." });
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  React.useEffect(() => { loadMembers(); }, []);

  const clearEdit = () => { setEditingId(null); setEditingOriginalName(""); setForm(emptyForm); };

  const beginEdit = (user) => {
    setEditingId(user.id);
    setEditingOriginalName(user.name || "");
    setForm({ name: user.name || "", email: user.email || "", department: user.department || departments[0], title: user.title || "", phone: user.phone || "", role: user.role || "user", status: user.status || "APPROVED" });
    setInfo({ tone: "blue", text: `${user.name} 회원 수정 화면입니다. 상단에서 내용을 변경한 뒤 '수정 저장'을 눌러 주세요.` });
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("qmes-member-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })));
  };

  const saveMember = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name) return setInfo({ tone: "red", text: "이름을 입력해 주세요." });
    if (!email) return setInfo({ tone: "red", text: "이메일을 입력해 주세요." });
    setSaving(true);
    try {
      if (editingId) {
        const isSystemAdmin = editingOriginalName === "관리자";
        const body = { name, email, department: form.department, title: form.title.trim(), role: isSystemAdmin ? "admin" : "user", status: isSystemAdmin ? "APPROVED" : form.status };
        await api(`/api/admin/users/${encodeURIComponent(editingId)}`, { method: "PUT", body: JSON.stringify(body) });
        saveLocalExtra(editingOriginalName, { ...body, phone: form.phone.trim() });
        await loadMembers(true);
        setInfo({ tone: "green", text: `${name} 회원 정보가 수정되었습니다.` });
        clearEdit();
      } else {
        const body = { name, email, department: form.department, title: form.title.trim(), role: "user", status: "APPROVED", password: "1234" };
        await api("/api/admin/users", { method: "POST", body: JSON.stringify(body) });
        saveLocalExtra(name, { ...body, phone: form.phone.trim() });
        await loadMembers(true);
        setInfo({ tone: "green", text: `${name} 회원을 등록했습니다. 초기 비밀번호는 1234입니다.` });
        clearEdit();
      }
    } catch (error) {
      setInfo({ tone: "red", text: error.message || (editingId ? "회원 수정에 실패했습니다." : "회원 등록에 실패했습니다.") });
    } finally { setSaving(false); }
  };

  const resetPassword = async (user) => {
    if (!window.confirm(`${user.name}님의 비밀번호를 1234로 초기화하시겠습니까?`)) return;
    setSaving(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ name: user.name, email: user.email, department: user.department, newPassword: "1234" }) });
      setInfo({ tone: "green", text: `${user.name} 비밀번호를 1234로 초기화했습니다.` });
    } catch (error) {
      setInfo({ tone: "red", text: error.message || "비밀번호 초기화에 실패했습니다." });
    } finally { setSaving(false); }
  };

  const openPermissionEditor = (user) => {
    if (user.name === "관리자") {
      setInfo({ tone: "blue", text: "시스템 관리자는 모든 메뉴 접근 권한이 고정으로 허용됩니다." });
      return;
    }
    const saved = savedPermissionEntry(user);
    setPermissionUser(user);
    setPermissionDraft(saved?.allowed?.length ? saved.allowed : (departmentDefaults[user.department] || []));
  };

  const togglePermission = (key) => {
    setPermissionDraft(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]);
  };

  const savePermissionEditor = () => {
    if (!permissionUser) return;
    writePermissions(permissionUser, permissionDraft);
    setInfo({ tone: "green", text: `${permissionUser.name}님의 메뉴 접근 권한 ${permissionDraft.length}개를 저장했습니다. 해당 직원은 다시 로그인하거나 새로고침하면 적용됩니다.` });
    setPermissionUser(null);
    setPermissionDraft([]);
  };

  const applyDepartmentDefault = () => {
    if (!permissionUser) return;
    setPermissionDraft([...(departmentDefaults[permissionUser.department] || [])]);
  };

  const field = (title, control) => <label className="qmes-db-member-field"><span>{title}</span>{control}</label>;

  return (
    <div className="qmes-db-members">
      <style>{`
        .qmes-db-members{--mf:'Pretendard','Noto Sans KR','Malgun Gothic',Arial,sans-serif;width:100%;font-family:var(--mf)!important;color:#243746;font-size:14px}.qmes-db-members *{box-sizing:border-box;font-family:var(--mf)!important}
        .qmes-db-member-notice{margin:0 0 14px;padding:12px 14px;border:1px solid #9fd7bd;border-radius:8px;background:#f3fbf7;color:#17663a;font-size:14px;font-weight:800}.qmes-db-member-notice.error{border-color:#f0aaaa;background:#fff5f5;color:#b42318}.qmes-db-member-notice.editing{border-color:#5bb6df;background:#eaf7fd;color:#075f89}
        .qmes-db-member-card{margin-bottom:16px;border:1px solid #d3dfe7;border-radius:9px;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(31,65,89,.06)}.qmes-db-member-card.is-edit-mode{border:2px solid #2b9fd0}.qmes-db-member-head{min-height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid #dce5eb;background:#fbfcfd}.qmes-db-member-head h2{margin:0;color:#203746;font-size:16px;font-weight:900}.qmes-db-member-count{color:#5d7180;font-size:13px;font-weight:750}
        .qmes-db-member-body{padding:16px}.qmes-db-member-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:end}.qmes-db-member-field>span{display:block;margin-bottom:6px;color:#4f6474;font-size:13px;font-weight:850}.qmes-db-member-input{width:100%;height:42px;padding:0 11px!important;border:1px solid #b8c7d2!important;border-radius:7px!important;background:#fff!important;color:#243746!important;font-size:14px!important;font-weight:650!important;outline:none!important}
        .qmes-db-member-actions-top{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.qmes-db-member-btn{height:34px;min-width:48px;padding:0 11px!important;border-radius:6px!important;font-size:12px!important;font-weight:850!important;line-height:1!important;cursor:pointer!important;white-space:nowrap!important}.qmes-db-member-btn:disabled{opacity:.55!important;cursor:not-allowed!important}.qmes-db-member-btn.primary{border:1px solid #0b8fc7!important;background:#0b8fc7!important;color:#fff!important}.qmes-db-member-btn.cancel,.qmes-db-member-btn.reset{border:1px solid #b7c5cf!important;background:#fff!important;color:#344b5a!important}.qmes-db-member-btn.edit{border:1px solid #39a9d8!important;background:#eaf8fd!important;color:#056b96!important}.qmes-db-member-btn.permission{border:1px solid #7867c9!important;background:#f2efff!important;color:#5d43bb!important}
        .qmes-db-member-help{margin:9px 0 0;color:#667987;font-size:12.5px;font-weight:600}.qmes-db-member-table-wrap{width:100%;overflow:auto}.qmes-db-member-table{width:100%;min-width:1280px;border-collapse:collapse;background:#fff}.qmes-db-member-table th{height:42px;padding:9px 10px!important;border-bottom:1px solid #cad7df!important;background:#f7f9fb!important;color:#4c6272!important;text-align:left!important;font-size:13px!important;font-weight:850!important;white-space:nowrap}.qmes-db-member-table td{height:48px;padding:10px!important;border-bottom:1px solid #dbe4ea!important;background:#fff!important;color:#293f4e!important;font-size:14px!important;font-weight:600!important;vertical-align:middle!important;white-space:nowrap}.qmes-db-member-row-actions{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}.qmes-db-member-badge{display:inline-flex;align-items:center;justify-content:center;min-height:25px;padding:3px 8px;border:1px solid #ccd7de;border-radius:6px;background:#f4f7f9;color:#526575;font-size:12px;font-weight:850}.qmes-db-member-badge.admin{border-color:#c7b8ff;background:#f2efff;color:#6546c7}.qmes-db-member-badge.approved{border-color:#a8d9bf;background:#effaf4;color:#197247}.qmes-db-member-loading{padding:28px;text-align:center;color:#607483;font-weight:700}
        .qmes-permission-overlay{position:fixed;inset:0;z-index:22000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,35,52,.5)}.qmes-permission-card{width:min(900px,calc(100vw - 32px));max-height:calc(100vh - 48px);display:flex;flex-direction:column;border:1px solid #cbd8e2;border-radius:14px;background:#fff;box-shadow:0 24px 70px rgba(26,59,82,.28);overflow:hidden}.qmes-permission-head{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #dde7ed;background:#f8fbfd}.qmes-permission-head h3{margin:0;color:#193b55;font-size:18px;font-weight:900}.qmes-permission-head p{margin:5px 0 0;color:#6d8190;font-size:12px;font-weight:650}.qmes-permission-close{width:32px;height:32px;border:1px solid #d4dfe7;border-radius:7px;background:#fff;color:#5d7485;font-size:20px;cursor:pointer}.qmes-permission-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid #e6edf2;background:#fff}.qmes-permission-toolbar button{height:32px;padding:0 11px;border:1px solid #c7d5df;border-radius:6px;background:#fff;color:#38556a;font-size:12px;font-weight:800;cursor:pointer}.qmes-permission-body{overflow-y:auto;padding:16px 20px 20px}.qmes-permission-group{margin-bottom:14px;border:1px solid #dce6ec;border-radius:9px;overflow:hidden}.qmes-permission-group-title{padding:9px 12px;background:#f5f8fa;color:#29485f;font-size:12px;font-weight:900}.qmes-permission-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}.qmes-permission-option{display:flex;align-items:center;gap:8px;min-height:42px;padding:8px 12px;border-top:1px solid #edf2f5;color:#3d5567;font-size:12px;font-weight:750;cursor:pointer}.qmes-permission-option input{width:16px;height:16px;accent-color:#397ead}.qmes-permission-system-note{padding:11px 12px;border:1px solid #f0d9a3;border-radius:8px;background:#fff9eb;color:#785e25;font-size:12px;font-weight:750;line-height:1.55}.qmes-permission-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 20px;border-top:1px solid #dde7ed;background:#f8fbfd}.qmes-permission-foot span{color:#526b7d;font-size:12px;font-weight:800}.qmes-permission-foot div{display:flex;gap:8px}.qmes-permission-foot button{height:36px;min-width:88px;padding:0 13px;border-radius:7px;font-size:12px;font-weight:850;cursor:pointer}.qmes-permission-save{border:1px solid #2f78b7;background:#2f78b7;color:#fff}.qmes-permission-cancel{border:1px solid #cbd8e2;background:#fff;color:#4a6274}
        @media(max-width:1100px){.qmes-db-member-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.qmes-permission-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.qmes-db-member-grid,.qmes-permission-grid{grid-template-columns:1fr}}
      `}</style>

      {info && <div className={`qmes-db-member-notice ${info.tone === "red" ? "error" : info.tone === "blue" ? "editing" : ""}`}>{info.text}</div>}

      <section id="qmes-member-editor" className={`qmes-db-member-card ${editingId ? "is-edit-mode" : ""}`}>
        <div className="qmes-db-member-head"><h2>{editingId ? `회원 정보 수정 · ${editingOriginalName}` : "회원 추가"}</h2></div>
        <div className="qmes-db-member-body">
          <div className="qmes-db-member-grid">
            {field("이름 · 로그인 ID", <input className="qmes-db-member-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름" />)}
            {field("부서", <select className="qmes-db-member-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>{departments.map((d) => <option key={d}>{d}</option>)}</select>)}
            {field("직급", <input className="qmes-db-member-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 부장" />)}
            {field("연락처", <input type="tel" className="qmes-db-member-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />)}
            {field("이메일 (필수)", <input type="email" className="qmes-db-member-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" />)}
          </div>
          {editingId && editingOriginalName !== "관리자" && <div className="qmes-db-member-grid" style={{marginTop:12}}>{field("계정 상태", <select className="qmes-db-member-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="APPROVED">승인</option><option value="REJECTED">반려</option></select>)}</div>}
          <div className="qmes-db-member-actions-top">{editingId && <button type="button" className="qmes-db-member-btn cancel" disabled={saving} onClick={clearEdit}>수정 취소</button>}<button type="button" className="qmes-db-member-btn primary" disabled={saving} onClick={saveMember}>{saving ? "저장 중..." : editingId ? "수정 저장" : "회원 추가"}</button></div>
          <p className="qmes-db-member-help">관리자 전체권한은 시스템 관리자만 사용합니다. 직원별 업무 접근은 아래의 '접근권한 설정'에서 메뉴 단위로 지정합니다.</p>
        </div>
      </section>

      <section className="qmes-db-member-card">
        <div className="qmes-db-member-head"><h2>회원등록 현황</h2><span className="qmes-db-member-count">시스템 관리자 {users.filter((u) => u.name === "관리자" || u.role === "admin").length}명 · 직원 {users.filter((u) => u.name !== "관리자" && u.role !== "admin").length}명</span></div>
        {loading ? <div className="qmes-db-member-loading">회원 정보를 불러오는 중입니다.</div> : <div className="qmes-db-member-table-wrap"><table className="qmes-db-member-table"><thead><tr>{["고유번호", "로그인 ID·이름", "부서", "직급", "연락처", "이메일", "권한", "상태", "관리"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{users.map((u) => <tr key={u.id}>
          <td style={{color:'#1587b7',fontWeight:850}}>{u.uid || "-"}</td><td style={{fontWeight:850}}>{u.name}</td><td>{u.department || "-"}</td><td>{u.title || "-"}</td><td>{u.phone || "-"}</td><td>{u.email || "-"}</td>
          <td><span className={`qmes-db-member-badge ${u.role === "admin" ? "admin" : ""}`}>{u.name === "관리자" || u.role === "admin" ? "시스템 관리자" : savedPermissionEntry(u) ? `개별 ${savedPermissionEntry(u).allowed?.length || 0}` : "일반"}</span></td><td><span className={`qmes-db-member-badge ${u.status === "APPROVED" ? "approved" : ""}`}>{u.status === "APPROVED" ? "승인" : "반려"}</span></td>
          <td><div className="qmes-db-member-row-actions"><button type="button" className="qmes-db-member-btn edit" disabled={saving} onClick={() => beginEdit(u)}>회원정보 수정</button><button type="button" className="qmes-db-member-btn reset" disabled={saving} onClick={() => resetPassword(u)}>비밀번호 초기화</button><button type="button" className="qmes-db-member-btn permission" disabled={saving || u.name === "관리자"} onClick={() => openPermissionEditor(u)}>{u.name === "관리자" ? "전체권한 고정" : "접근권한 설정"}</button></div></td>
        </tr>)}</tbody></table></div>}
      </section>

      {permissionUser && <div className="qmes-permission-overlay" role="dialog" aria-modal="true" aria-label="직원 접근권한 설정" onMouseDown={(e) => { if(e.target === e.currentTarget) setPermissionUser(null); }}>
        <div className="qmes-permission-card">
          <div className="qmes-permission-head"><div><h3>접근권한 설정 · {permissionUser.name}</h3><p>{permissionUser.department || "부서 미지정"} · 필요한 업무 메뉴만 선택합니다.</p></div><button type="button" className="qmes-permission-close" onClick={() => setPermissionUser(null)}>×</button></div>
          <div className="qmes-permission-toolbar"><button type="button" onClick={applyDepartmentDefault}>부서 기본권한</button><button type="button" onClick={() => setPermissionDraft([...allPermissionKeys])}>업무메뉴 전체 선택</button><button type="button" onClick={() => setPermissionDraft([])}>전체 해제</button></div>
          <div className="qmes-permission-body">
            {permissionGroups.map(group => <section className="qmes-permission-group" key={group.title}><div className="qmes-permission-group-title">{group.title}</div><div className="qmes-permission-grid">{group.items.map(([key,label]) => <label className="qmes-permission-option" key={key}><input type="checkbox" checked={permissionDraft.includes(key)} onChange={() => togglePermission(key)} /><span>{label}</span></label>)}</div></section>)}
            <div className="qmes-permission-system-note">SYSTEM 영역의 회원등록 현황·직원 권한관리·비밀번호 초기화는 직원 메뉴권한에 포함되지 않습니다. 이 기능은 시스템 관리자만 사용할 수 있습니다.</div>
          </div>
          <div className="qmes-permission-foot"><span>선택 {permissionDraft.length}개 / 전체 {allPermissionKeys.length}개</span><div><button type="button" className="qmes-permission-cancel" onClick={() => setPermissionUser(null)}>취소</button><button type="button" className="qmes-permission-save" onClick={savePermissionEditor}>권한 저장</button></div></div>
        </div>
      </div>}
    </div>
  );
}

function MembersTab() {
  return <MembersManagementTab />;
}
