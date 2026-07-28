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
