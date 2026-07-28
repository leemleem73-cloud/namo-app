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

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500";
  const label = (text) => <div className="text-[11px] text-slate-500 mb-1">{text}</div>;

  return (
    <div className="flex flex-col gap-4">
      {info && <div className={`rounded-lg px-4 py-3 text-sm border ${info.tone === "red" ? "bg-red-500/10 border-red-500/40 text-red-300" : "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"}`}>{info.text}</div>}

      <Panel title={editingId ? "회원 정보 수정" : "회원 추가"}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>{label("이름 · 로그인 ID")}<input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름" /></div>
          <div>{label("부서")}<select className={inputCls} value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>{departments.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div>{label("직급")}<input className={inputCls} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="예: 부장" /></div>
          <div>{label("연락처")}<input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" /></div>
          <div>{label("이메일")}<input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {editingId && <button onClick={clearForm} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm">취소</button>}
          <button onClick={saveMember} className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold">{editingId ? "수정 저장" : "회원 추가"}</button>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">로그인 ID는 이름이며 신규 회원은 일반 사용자로 등록됩니다. 초기 비밀번호는 1234입니다.</p>
      </Panel>

      <Panel title="회원등록 현황" right={<span className="text-xs text-slate-400">관리자 1명 · 일반 사용자 {users.filter((u) => u.role !== "admin").length}명</span>}>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[1050px]">
            <thead><tr className="text-xs text-slate-400 border-b border-slate-800">
              {['고유번호','로그인 ID·이름','부서','직급','연락처','이메일','권한','비밀번호','관리'].map((h) => <th key={h} className="text-left py-2 pr-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                <td className="py-2.5 pr-3 font-mono text-xs text-sky-300">{u.uid || "-"}</td>
                <td className="py-2.5 pr-3 text-slate-100">{u.name}</td>
                <td className="py-2.5 pr-3 text-xs text-slate-300">{u.dept || "-"}</td>
                <td className="py-2.5 pr-3 text-xs text-slate-300">{u.position || "-"}</td>
                <td className="py-2.5 pr-3 text-xs text-slate-400">{u.phone || "-"}</td>
                <td className="py-2.5 pr-3 text-xs text-slate-400">{u.email || "-"}</td>
                <td className="py-2.5 pr-3">{u.role === "admin" ? <Badge tone="violet">관리자</Badge> : <Badge tone="gray">일반</Badge>}</td>
                <td className="py-2.5 pr-3">{u.passwordChanged ? <Badge tone="green">변경완료</Badge> : <Badge tone="amber">초기 1234</Badge>}</td>
                <td className="py-2.5"><div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => editMember(u)} className="text-[11px] px-2 py-1 rounded border border-sky-500/40 text-sky-300 hover:bg-sky-500/10">수정</button>
                  <button onClick={() => resetPw(u)} className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-800">비밀번호 초기화</button>
                  {u.role !== "admin" && <button onClick={() => removeMember(u)} className="text-[11px] px-2 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10">삭제</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* 기존 라우터의 MembersTab 이름을 새 회원관리 화면에 연결 */
function MembersTab() {
  return <MembersManagementTab />;
}
