/* QMES 관리자 모듈: 회원등록 현황 */
function MembersManagementTab() {
  const departments = ["대표", "경영지원부", "연구소", "생산부", "영업부", "품질부"];
  const emptyForm = { name: "", dept: departments[0], position: "", phone: "", email: "" };
  const [users, setUsers] = useState(loadUsers);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [info, setInfo] = useState(null);

  const persist = (next) => { setUsers(next); saveUsers(next); };
  const clearForm = () => { setForm(emptyForm); setEditingId(null); };

  const saveMember = async () => {
    const name = form.name.trim();
    if (!name) return setInfo({ tone: "red", text: "이름을 입력해 주세요." });
    if (users.some((u) => u.name === name && u.id !== editingId)) {
      return setInfo({ tone: "red", text: "이미 등록된 이름입니다." });
    }

    if (editingId) {
      const target = users.find((u) => u.id === editingId);
      const isSystemAdmin = target && target.role === "admin";
      persist(users.map((u) => u.id === editingId ? {
        ...u,
        id: name,
        name,
        dept: form.dept,
        position: form.position.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        role: isSystemAdmin ? "admin" : "user",
      } : u));
      setInfo({ tone: "green", text: `${name} 회원 정보를 수정했습니다.` });
    } else {
      const pwHash = await hashText("1234");
      persist([...users, {
        id: name,
        uid: nextUid(users),
        pwHash,
        name,
        dept: form.dept,
        position: form.position.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        role: "user",
        passwordChanged: false,
        joined: new Date().toLocaleString("ko-KR", { hour12: false }),
      }]);
      setInfo({ tone: "green", text: `${name} 회원을 추가했습니다. 초기 비밀번호는 1234입니다.` });
    }
    clearForm();
  };

  const editMember = (u) => {
    setEditingId(u.id);
    setForm({
      name: u.name || "",
      dept: u.dept || departments[0],
      position: u.position || "",
      phone: u.phone || "",
      email: u.email || "",
    });
    setInfo(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeMember = (u) => {
    if (u.role === "admin") return setInfo({ tone: "red", text: "시스템 관리자 계정은 삭제할 수 없습니다." });
    if (!window.confirm(`${u.name} 회원을 삭제하시겠습니까?`)) return;
    persist(users.filter((x) => x.id !== u.id));
    if (editingId === u.id) clearForm();
    setInfo({ tone: "green", text: `${u.name} 회원을 삭제했습니다.` });
  };

  const resetPw = async (u) => {
    const pwHash = await hashText("1234");
    persist(users.map((x) => x.id === u.id ? { ...x, pwHash, pw: undefined, passwordChanged: false } : x));
    setInfo({ tone: "green", text: `${u.name} 비밀번호를 1234로 초기화했습니다.` });
  };

  const label = (text) => <div className="qmes-member-label">{text}</div>;

  return (
    <div className="qmes-members-management">
      <style>{`
        .qmes-members-management{
          --member-font:'Pretendard','Noto Sans KR','Malgun Gothic',Arial,sans-serif;
          width:100%;
          color:#263746;
          font-family:var(--member-font)!important;
          font-size:14px!important;
          line-height:1.5!important;
        }
        .qmes-members-management *,
        .qmes-members-management input,
        .qmes-members-management select,
        .qmes-members-management button,
        .qmes-members-management table,
        .qmes-members-management th,
        .qmes-members-management td{
          font-family:var(--member-font)!important;
          box-sizing:border-box;
        }
        .qmes-member-notice{
          margin-bottom:14px;
          padding:12px 15px;
          border:1px solid #cbd8e2;
          border-radius:8px;
          background:#fff;
          color:#263746;
          font-size:14px!important;
          font-weight:700!important;
        }
        .qmes-member-notice.is-error{border-color:#f4b4b4;background:#fff6f6;color:#b42318;}
        .qmes-member-notice.is-success{border-color:#9fd7bd;background:#f3fbf7;color:#17663a;}
        .qmes-member-card{
          margin-bottom:18px;
          overflow:hidden;
          border:1px solid #d5e0e8;
          border-radius:9px;
          background:#fff;
          box-shadow:0 2px 8px rgba(40,72,94,.06);
        }
        .qmes-member-card-head{
          min-height:48px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          padding:0 16px;
          border-bottom:1px solid #dde6ed;
          background:#fbfcfd;
        }
        .qmes-member-card-title{
          margin:0;
          color:#243746!important;
          font-size:16px!important;
          font-weight:900!important;
          letter-spacing:-.2px;
        }
        .qmes-member-count{
          color:#5c6f7f!important;
          font-size:13px!important;
          font-weight:700!important;
          white-space:nowrap;
        }
        .qmes-member-card-body{padding:16px;}
        .qmes-member-form-grid{
          display:grid;
          grid-template-columns:repeat(5,minmax(0,1fr));
          gap:12px;
          align-items:end;
        }
        .qmes-member-label{
          margin-bottom:6px;
          color:#526574!important;
          font-size:13px!important;
          font-weight:800!important;
          line-height:1.3!important;
        }
        .qmes-member-input{
          width:100%;
          height:42px;
          padding:0 12px!important;
          border:1px solid #b8c7d2!important;
          border-radius:7px!important;
          background:#fff!important;
          color:#243746!important;
          font-size:14px!important;
          font-weight:650!important;
          line-height:42px!important;
          outline:none!important;
          box-shadow:none!important;
        }
        select.qmes-member-input{line-height:normal!important;}
        .qmes-member-input:focus{border-color:#248bc1!important;box-shadow:0 0 0 3px rgba(36,139,193,.12)!important;}
        .qmes-member-input::placeholder{color:#94a3ad!important;opacity:1!important;font-weight:500!important;}
        .qmes-member-phone,
        .qmes-member-phone::placeholder{
          font-family:var(--member-font)!important;
          font-style:normal!important;
          letter-spacing:0!important;
          font-variant-numeric:tabular-nums;
        }
        .qmes-member-form-actions{
          display:flex;
          justify-content:flex-end;
          gap:8px;
          margin-top:14px;
        }
        .qmes-member-btn{
          min-height:38px;
          padding:0 14px!important;
          border-radius:7px!important;
          font-size:13px!important;
          font-weight:800!important;
          line-height:1!important;
          cursor:pointer;
        }
        .qmes-member-btn-primary{border:1px solid #0c8fc6!important;background:#0c8fc6!important;color:#fff!important;}
        .qmes-member-btn-primary:hover{background:#087cac!important;}
        .qmes-member-btn-secondary{border:1px solid #bac8d2!important;background:#fff!important;color:#334a5a!important;}
        .qmes-member-help{
          margin:10px 0 0;
          color:#667887!important;
          font-size:12.5px!important;
          font-weight:600!important;
        }
        .qmes-member-table-wrap{width:100%;overflow-x:auto;}
        .qmes-member-table{
          width:100%;
          min-width:1120px;
          border-collapse:collapse;
          table-layout:auto;
          color:#263746!important;
          font-size:14px!important;
        }
        .qmes-member-table thead th{
          height:42px;
          padding:9px 10px!important;
          border-bottom:1px solid #cdd9e2!important;
          background:#f7f9fb!important;
          color:#4d6272!important;
          font-size:13px!important;
          font-weight:850!important;
          line-height:1.25!important;
          text-align:left!important;
          white-space:nowrap;
        }
        .qmes-member-table tbody td{
          min-height:46px;
          padding:11px 10px!important;
          border-bottom:1px solid #dbe4ea!important;
          background:#fff;
          color:#2b3f4e!important;
          font-size:14px!important;
          font-weight:600!important;
          line-height:1.45!important;
          vertical-align:middle!important;
          white-space:nowrap;
        }
        .qmes-member-table tbody tr:hover td{background:#f4f8fb!important;}
        .qmes-member-uid{
          color:#1587b7!important;
          font-size:13px!important;
          font-weight:800!important;
          font-variant-numeric:tabular-nums;
        }
        .qmes-member-name{color:#1f3443!important;font-weight:800!important;}
        .qmes-member-phone-cell{
          color:#344b5a!important;
          font-family:var(--member-font)!important;
          font-variant-numeric:tabular-nums;
          letter-spacing:0!important;
        }
        .qmes-member-email{color:#4b6171!important;}
        .qmes-member-badge{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:25px;
          padding:3px 9px;
          border-radius:6px;
          font-size:12px!important;
          font-weight:800!important;
          line-height:1!important;
          white-space:nowrap;
        }
        .qmes-member-badge-admin{border:1px solid #c7b8ff;background:#f2efff;color:#6546c7!important;}
        .qmes-member-badge-user{border:1px solid #cbd5dc;background:#f3f6f8;color:#526575!important;}
        .qmes-member-badge-changed{border:1px solid #9ed7ba;background:#effaf4;color:#197247!important;}
        .qmes-member-badge-initial{border:1px solid #f2cc86;background:#fff7e8;color:#b26a00!important;}
        .qmes-member-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
        .qmes-member-action{
          min-height:30px;
          padding:0 9px!important;
          border-radius:6px!important;
          background:#fff!important;
          font-size:12px!important;
          font-weight:800!important;
          line-height:1!important;
          cursor:pointer;
          white-space:nowrap;
        }
        .qmes-member-action-edit{border:1px solid #7cc4e2!important;color:#1679a2!important;}
        .qmes-member-action-reset{border:1px solid #b8c6d0!important;color:#344b5a!important;}
        .qmes-member-action-delete{border:1px solid #f2aaaa!important;color:#c83d3d!important;}
        @media(max-width:1280px){.qmes-member-form-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
        @media(max-width:760px){
          .qmes-member-form-grid{grid-template-columns:1fr;}
          .qmes-member-card-head{align-items:flex-start;flex-direction:column;padding:12px 14px;}
          .qmes-member-card-body{padding:14px;}
          .qmes-member-count{white-space:normal;}
        }
      `}</style>

      {info && <div className={`qmes-member-notice ${info.tone === "red" ? "is-error" : "is-success"}`}>{info.text}</div>}

      <section className="qmes-member-card">
        <div className="qmes-member-card-head">
          <h2 className="qmes-member-card-title">{editingId ? "회원 정보 수정" : "회원 추가"}</h2>
        </div>
        <div className="qmes-member-card-body">
          <div className="qmes-member-form-grid">
            <div>{label("이름 · 로그인 ID")}<input className="qmes-member-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름" /></div>
            <div>{label("부서")}<select className="qmes-member-input" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>{departments.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div>{label("직급")}<input className="qmes-member-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="예: 부장" /></div>
            <div>{label("연락처")}<input type="tel" className="qmes-member-input qmes-member-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" /></div>
            <div>{label("이메일")}<input type="email" className="qmes-member-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" /></div>
          </div>
          <div className="qmes-member-form-actions">
            {editingId && <button onClick={clearForm} className="qmes-member-btn qmes-member-btn-secondary">취소</button>}
            <button onClick={saveMember} className="qmes-member-btn qmes-member-btn-primary">{editingId ? "수정 저장" : "회원 추가"}</button>
          </div>
          <p className="qmes-member-help">로그인 ID는 이름이며 신규 회원은 일반 사용자로 등록됩니다. 초기 비밀번호는 1234입니다.</p>
        </div>
      </section>

      <section className="qmes-member-card">
        <div className="qmes-member-card-head">
          <h2 className="qmes-member-card-title">회원등록 현황</h2>
          <span className="qmes-member-count">관리자 1명 · 일반 사용자 {users.filter((u) => u.role !== "admin").length}명</span>
        </div>
        <div className="qmes-member-table-wrap">
          <table className="qmes-member-table">
            <thead>
              <tr>
                {['고유번호','로그인 ID · 이름','부서','직급','연락처','이메일','권한','비밀번호','관리'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>{users.map((u) => (
              <tr key={u.id}>
                <td className="qmes-member-uid">{u.uid || "-"}</td>
                <td className="qmes-member-name">{u.name}</td>
                <td>{u.dept || "-"}</td>
                <td>{u.position || "-"}</td>
                <td className="qmes-member-phone-cell">{u.phone || "-"}</td>
                <td className="qmes-member-email">{u.email || "-"}</td>
                <td>{u.role === "admin" ? <span className="qmes-member-badge qmes-member-badge-admin">관리자</span> : <span className="qmes-member-badge qmes-member-badge-user">일반</span>}</td>
                <td>{u.passwordChanged ? <span className="qmes-member-badge qmes-member-badge-changed">변경완료</span> : <span className="qmes-member-badge qmes-member-badge-initial">초기 1234</span>}</td>
                <td>
                  <div className="qmes-member-actions">
                    <button onClick={() => editMember(u)} className="qmes-member-action qmes-member-action-edit">수정</button>
                    <button onClick={() => resetPw(u)} className="qmes-member-action qmes-member-action-reset">비밀번호 초기화</button>
                    {u.role !== "admin" && <button onClick={() => removeMember(u)} className="qmes-member-action qmes-member-action-delete">삭제</button>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* 기존 라우터의 MembersTab 이름을 새 회원관리 화면에 연결 */
function MembersTab() {
  return <MembersManagementTab />;
}
