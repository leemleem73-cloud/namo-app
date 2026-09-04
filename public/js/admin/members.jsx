/* QMES 관리자 모듈: 회원등록 현황 - PostgreSQL 연동 */
function MembersManagementTab() {
  const departments = ["대표", "관리부", "경영지원부", "연구소", "생산부", "영업부", "품질부"];
  const emptyCreate = { name: "", email: "", department: departments[0], title: "", phone: "" };
  const [users, setUsers] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(null);

  const knownUid = {
    "관리자": "U-0001", "김종혁": "U-0002", "김세희": "U-0003", "정영기": "U-0004",
    "박지헌": "U-0005", "박도훈": "U-0006", "문지훈": "U-0007", "김현진": "U-0008",
    "임흥배": "U-0009", "박현아": "U-0010"
  };

  const localUsers = () => {
    try { return typeof loadUsers === "function" ? loadUsers() : []; }
    catch (_error) { return []; }
  };

  const localByName = () => new Map(localUsers().map((u) => [String(u.name || u.id || "").trim(), u]));

  const mergeLocalExtras = (rows) => {
    const local = localByName();
    return (Array.isArray(rows) ? rows : []).map((u) => {
      const extra = local.get(String(u.name || "").trim()) || {};
      return {
        ...u,
        uid: u.uid || extra.uid || knownUid[u.name] || "-",
        phone: u.phone || extra.phone || ""
      };
    });
  };

  const api = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const response = await fetch(url, { credentials: "same-origin", ...options, headers });
    const payload = await response.json().catch(() => ({ success: false, message: `HTTP ${response.status}` }));
    if (!response.ok || !payload?.success) throw new Error(payload?.message || "요청 처리에 실패했습니다.");
    return payload;
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

  const saveLocalExtra = (beforeName, next) => {
    try {
      if (typeof loadUsers !== "function" || typeof saveUsers !== "function") return;
      const current = loadUsers();
      let found = false;
      const updated = current.map((u) => {
        const uname = String(u.name || u.id || "").trim();
        if (uname !== beforeName) return u;
        found = true;
        return {
          ...u,
          id: next.name,
          name: next.name,
          dept: next.department,
          position: next.title,
          phone: next.phone || "",
          email: next.email
        };
      });
      if (!found) {
        updated.push({
          id: next.name,
          uid: knownUid[next.name] || (typeof nextUid === "function" ? nextUid(updated) : ""),
          name: next.name,
          dept: next.department,
          position: next.title,
          phone: next.phone || "",
          email: next.email,
          role: next.role || "user"
        });
      }
      saveUsers(updated);
    } catch (_error) {}
  };

  const openEdit = (event, user) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setInfo(null);
    setEditForm({
      id: user.id,
      originalName: user.name || "",
      uid: user.uid || knownUid[user.name] || "-",
      name: user.name || "",
      email: user.email || "",
      department: user.department || departments[0],
      title: user.title || "",
      phone: user.phone || "",
      role: user.role || "user",
      status: user.status || "APPROVED"
    });
  };

  const saveEdit = async () => {
    if (!editForm) return;
    const name = editForm.name.trim();
    const email = editForm.email.trim().toLowerCase();
    if (!name) return setInfo({ tone: "red", text: "이름을 입력해 주세요." });
    if (!email) return setInfo({ tone: "red", text: "이메일을 입력해 주세요. 로그인 계정 DB에서 필수 항목입니다." });

    setSaving(true);
    try {
      const body = {
        name,
        email,
        department: editForm.department,
        title: editForm.title.trim(),
        role: editForm.role,
        status: editForm.status
      };
      await api(`/api/admin/users/${encodeURIComponent(editForm.id)}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });
      saveLocalExtra(editForm.originalName, { ...editForm, ...body, name, email });
      setEditForm(null);
      await loadMembers(true);
      setInfo({ tone: "green", text: `${name} 회원 정보가 DB에 수정되었습니다.` });
    } catch (error) {
      setInfo({ tone: "red", text: error.message || "회원 수정에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const addMember = async () => {
    const name = createForm.name.trim();
    const email = createForm.email.trim().toLowerCase();
    if (!name) return setInfo({ tone: "red", text: "이름을 입력해 주세요." });
    if (!email) return setInfo({ tone: "red", text: "이메일을 입력해 주세요." });

    setSaving(true);
    try {
      const body = {
        name,
        email,
        department: createForm.department,
        title: createForm.title.trim(),
        role: "user",
        status: "APPROVED",
        password: "1234"
      };
      await api("/api/admin/users", { method: "POST", body: JSON.stringify(body) });
      saveLocalExtra(name, { ...body, name, phone: createForm.phone.trim() });
      setCreateForm(emptyCreate);
      await loadMembers(true);
      setInfo({ tone: "green", text: `${name} 회원을 등록했습니다. 초기 비밀번호는 1234입니다.` });
    } catch (error) {
      setInfo({ tone: "red", text: error.message || "회원 등록에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (event, user) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!window.confirm(`${user.name}님의 비밀번호를 1234로 초기화하시겠습니까?`)) return;
    setSaving(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          department: user.department,
          newPassword: "1234"
        })
      });
      setInfo({ tone: "green", text: `${user.name} 비밀번호를 1234로 초기화했습니다.` });
    } catch (error) {
      setInfo({ tone: "red", text: error.message || "비밀번호 초기화에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (event, user) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (user.role === "admin") return setInfo({ tone: "red", text: "시스템 관리자 계정은 삭제할 수 없습니다." });
    if (!window.confirm(`${user.name} 회원을 삭제하시겠습니까?`)) return;
    setSaving(true);
    try {
      await api(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
      await loadMembers(true);
      setInfo({ tone: "green", text: `${user.name} 회원을 삭제했습니다.` });
    } catch (error) {
      setInfo({ tone: "red", text: error.message || "회원 삭제에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const field = (title, control) => <label className="qmes-db-member-field"><span>{title}</span>{control}</label>;

  return (
    <div className="qmes-db-members">
      <style>{`
        .qmes-db-members{--mf:'Pretendard','Noto Sans KR','Malgun Gothic',Arial,sans-serif;width:100%;font-family:var(--mf)!important;color:#243746;font-size:14px}
        .qmes-db-members *{box-sizing:border-box;font-family:var(--mf)!important}
        .qmes-db-member-notice{margin:0 0 14px;padding:12px 14px;border:1px solid #9fd7bd;border-radius:8px;background:#f3fbf7;color:#17663a;font-size:14px;font-weight:800}
        .qmes-db-member-notice.error{border-color:#f0aaaa;background:#fff5f5;color:#b42318}
        .qmes-db-member-card{margin-bottom:16px;border:1px solid #d3dfe7;border-radius:9px;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(31,65,89,.06)}
        .qmes-db-member-head{min-height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid #dce5eb;background:#fbfcfd}
        .qmes-db-member-head h2{margin:0;color:#203746;font-size:16px;font-weight:900}
        .qmes-db-member-count{color:#5d7180;font-size:13px;font-weight:750}
        .qmes-db-member-body{padding:16px}
        .qmes-db-member-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:end}
        .qmes-db-member-field{display:block;min-width:0}
        .qmes-db-member-field>span{display:block;margin-bottom:6px;color:#4f6474;font-size:13px;font-weight:850}
        .qmes-db-member-input{width:100%;height:42px;padding:0 11px!important;border:1px solid #b8c7d2!important;border-radius:7px!important;background:#fff!important;color:#243746!important;font-size:14px!important;font-weight:650!important;outline:none!important;box-shadow:none!important}
        .qmes-db-member-input:focus{border-color:#1b8dc5!important;box-shadow:0 0 0 3px rgba(27,141,197,.12)!important}
        .qmes-db-member-actions-top{display:flex;justify-content:flex-end;margin-top:12px}
        .qmes-db-member-btn{height:34px;min-width:48px;padding:0 11px!important;border-radius:6px!important;font-size:12px!important;font-weight:850!important;line-height:1!important;cursor:pointer!important;white-space:nowrap!important;opacity:1!important;visibility:visible!important}
        .qmes-db-member-btn:disabled{opacity:.55!important;cursor:not-allowed!important}
        .qmes-db-member-btn.primary{border:1px solid #0b8fc7!important;background:#0b8fc7!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
        .qmes-db-member-btn.edit{border:1px solid #5ebee2!important;background:#eef9fd!important;color:#0b729d!important;-webkit-text-fill-color:#0b729d!important}
        .qmes-db-member-btn.reset{border:1px solid #b7c5cf!important;background:#fff!important;color:#344b5a!important;-webkit-text-fill-color:#344b5a!important}
        .qmes-db-member-btn.delete{border:1px solid #efaaaa!important;background:#fff!important;color:#c43c3c!important;-webkit-text-fill-color:#c43c3c!important}
        .qmes-db-member-btn.cancel{border:1px solid #b7c5cf!important;background:#fff!important;color:#344b5a!important;-webkit-text-fill-color:#344b5a!important}
        .qmes-db-member-help{margin:9px 0 0;color:#667987;font-size:12.5px;font-weight:600}
        .qmes-db-member-table-wrap{width:100%;overflow:auto}
        .qmes-db-member-table{width:100%;min-width:1180px;border-collapse:collapse;background:#fff;table-layout:auto}
        .qmes-db-member-table th{height:42px;padding:9px 10px!important;border-bottom:1px solid #cad7df!important;background:#f7f9fb!important;color:#4c6272!important;text-align:left!important;font-size:13px!important;font-weight:850!important;white-space:nowrap}
        .qmes-db-member-table td{height:48px;padding:10px!important;border-bottom:1px solid #dbe4ea!important;background:#fff!important;color:#293f4e!important;font-size:14px!important;font-weight:600!important;vertical-align:middle!important;white-space:nowrap}
        .qmes-db-member-table tbody tr:hover td{background:#f5f9fb!important}
        .qmes-db-member-uid{color:#1587b7!important;font-size:13px!important;font-weight:850!important;font-variant-numeric:tabular-nums}
        .qmes-db-member-name{color:#1e3443!important;font-weight:850!important}
        .qmes-db-member-phone{font-variant-numeric:tabular-nums;letter-spacing:0!important}
        .qmes-db-member-row-actions{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}
        .qmes-db-member-badge{display:inline-flex;align-items:center;justify-content:center;min-height:25px;padding:3px 8px;border:1px solid #ccd7de;border-radius:6px;background:#f4f7f9;color:#526575;font-size:12px;font-weight:850}
        .qmes-db-member-badge.admin{border-color:#c7b8ff;background:#f2efff;color:#6546c7}
        .qmes-db-member-badge.approved{border-color:#a8d9bf;background:#effaf4;color:#197247}
        .qmes-db-member-loading{padding:28px;text-align:center;color:#607483;font-weight:700}
        .qmes-db-member-modal-bg{position:fixed!important;inset:0!important;z-index:2147483600!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(15,23,42,.38)!important}
        .qmes-db-member-modal{width:min(780px,calc(100vw - 32px));max-height:calc(100vh - 48px);overflow:auto;border:1px solid #c7d4de;border-radius:12px;background:#fff;box-shadow:0 25px 80px rgba(15,23,42,.28)}
        .qmes-db-member-modal-head{min-height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #dce5eb;background:#fafcfd}
        .qmes-db-member-modal-head strong{color:#203746;font-size:17px;font-weight:900}
        .qmes-db-member-modal-close{width:34px;height:34px;border:1px solid #c5d2db;border-radius:7px;background:#fff;color:#405766;font-size:21px;cursor:pointer}
        .qmes-db-member-modal-body{padding:18px}
        .qmes-db-member-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
        .qmes-db-member-readonly{height:42px;display:flex;align-items:center;padding:0 11px;border:1px solid #d2dce4;border-radius:7px;background:#f7f9fb;color:#536877;font-size:14px;font-weight:700}
        .qmes-db-member-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
        .qmes-db-member-modal-actions .qmes-db-member-btn{height:40px;padding:0 16px!important;font-size:13px!important}
        @media(max-width:1100px){.qmes-db-member-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:700px){.qmes-db-member-grid,.qmes-db-member-modal-grid{grid-template-columns:1fr}}
      `}</style>

      {info && <div className={`qmes-db-member-notice ${info.tone === "red" ? "error" : ""}`}>{info.text}</div>}

      <section className="qmes-db-member-card">
        <div className="qmes-db-member-head"><h2>회원 추가</h2></div>
        <div className="qmes-db-member-body">
          <div className="qmes-db-member-grid">
            {field("이름 · 로그인 ID", <input className="qmes-db-member-input" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="이름" />)}
            {field("부서", <select className="qmes-db-member-input" value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}>{departments.map((d) => <option key={d}>{d}</option>)}</select>)}
            {field("직급", <input className="qmes-db-member-input" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} placeholder="예: 부장" />)}
            {field("연락처", <input type="tel" className="qmes-db-member-input qmes-db-member-phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="010-0000-0000" />)}
            {field("이메일 (필수)", <input type="email" className="qmes-db-member-input" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="name@company.com" />)}
          </div>
          <div className="qmes-db-member-actions-top"><button type="button" className="qmes-db-member-btn primary" disabled={saving} onClick={addMember}>회원 추가</button></div>
          <p className="qmes-db-member-help">회원정보는 PostgreSQL 사용자 DB에 저장됩니다. 신규 회원 초기 비밀번호는 1234입니다.</p>
        </div>
      </section>

      <section className="qmes-db-member-card">
        <div className="qmes-db-member-head">
          <h2>회원등록 현황</h2>
          <span className="qmes-db-member-count">관리자 {users.filter((u) => u.role === "admin").length}명 · 일반 사용자 {users.filter((u) => u.role !== "admin").length}명</span>
        </div>
        {loading ? <div className="qmes-db-member-loading">회원 정보를 불러오는 중입니다.</div> : (
          <div className="qmes-db-member-table-wrap">
            <table className="qmes-db-member-table">
              <thead><tr>{["고유번호", "로그인 ID·이름", "부서", "직급", "연락처", "이메일", "권한", "상태", "관리"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u.id}>
                  <td className="qmes-db-member-uid">{u.uid || "-"}</td>
                  <td className="qmes-db-member-name">{u.name}</td>
                  <td>{u.department || "-"}</td>
                  <td>{u.title || "-"}</td>
                  <td className="qmes-db-member-phone">{u.phone || "-"}</td>
                  <td>{u.email || "-"}</td>
                  <td><span className={`qmes-db-member-badge ${u.role === "admin" ? "admin" : ""}`}>{u.role === "admin" ? "관리자" : "일반"}</span></td>
                  <td><span className={`qmes-db-member-badge ${u.status === "APPROVED" ? "approved" : ""}`}>{u.status === "APPROVED" ? "승인" : "반려"}</span></td>
                  <td><div className="qmes-db-member-row-actions">
                    <button type="button" data-qmes-member-edit="1" className="qmes-db-member-btn edit" disabled={saving} onClick={(e) => openEdit(e, u)}>수정</button>
                    <button type="button" className="qmes-db-member-btn reset" disabled={saving} onClick={(e) => resetPassword(e, u)}>비밀번호 초기화</button>
                    {u.role !== "admin" && <button type="button" className="qmes-db-member-btn delete" disabled={saving} onClick={(e) => removeMember(e, u)}>삭제</button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {editForm && <div className="qmes-db-member-modal-bg" role="dialog" aria-modal="true" aria-label="회원 정보 수정" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setEditForm(null); }}>
        <div className="qmes-db-member-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="qmes-db-member-modal-head">
            <strong>회원 정보 수정</strong>
            <button type="button" className="qmes-db-member-modal-close" disabled={saving} onClick={() => setEditForm(null)} aria-label="닫기">×</button>
          </div>
          <div className="qmes-db-member-modal-body">
            <div className="qmes-db-member-modal-grid">
              {field("고유번호", <div className="qmes-db-member-readonly">{editForm.uid || "-"}</div>)}
              {field("이름 · 로그인 ID", <input className="qmes-db-member-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />)}
              {field("부서", <select className="qmes-db-member-input" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>{departments.map((d) => <option key={d}>{d}</option>)}</select>)}
              {field("직급", <input className="qmes-db-member-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />)}
              {field("연락처", <input type="tel" className="qmes-db-member-input qmes-db-member-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="010-0000-0000" />)}
              {field("이메일 (필수)", <input type="email" className="qmes-db-member-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />)}
              {field("권한", <select className="qmes-db-member-input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} disabled={editForm.originalName === "관리자"}><option value="user">일반</option><option value="admin">관리자</option></select>)}
              {field("계정 상태", <select className="qmes-db-member-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} disabled={editForm.originalName === "관리자"}><option value="APPROVED">승인</option><option value="REJECTED">반려</option></select>)}
            </div>
            <div className="qmes-db-member-modal-actions">
              <button type="button" className="qmes-db-member-btn cancel" disabled={saving} onClick={() => setEditForm(null)}>취소</button>
              <button type="button" className="qmes-db-member-btn primary" disabled={saving} onClick={saveEdit}>{saving ? "저장 중..." : "수정 저장"}</button>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}

function MembersTab() {
  return <MembersManagementTab />;
}
