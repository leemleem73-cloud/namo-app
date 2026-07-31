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

/* LOT 추적 → 부적합 자동 입력 및 LOT 홀드 연동 */
(function installNcrLotHoldLink(){
  const DRAFT_KEY="qmes-ncr-draft-v1";

  const readDraft=()=>{
    try{return JSON.parse(sessionStorage.getItem(DRAFT_KEY)||"null");}
    catch(error){return null;}
  };

  const writeDraft=(draft)=>{
    try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}
    catch(error){/* 무시 */}
  };

  const clearDraft=()=>{
    try{sessionStorage.removeItem(DRAFT_KEY);}
    catch(error){/* 무시 */}
  };

  const currentUserName=()=>{
    const raw=window.__QMES_USER__||window.__QMES_CURRENT_USER__;
    return raw&&typeof raw==="object"?String(raw.name||raw.uid||"현재 사용자"):String(raw||"현재 사용자");
  };

  document.addEventListener("click",(event)=>{
    const button=event.target.closest("button");
    if(!button||button.textContent.trim()!=="부적합 관리 열기")return;
    const pageText=document.body.innerText||"";
    const rawMatch=pageText.match(/원료 LOT 역추적\s*[—-]\s*([^\s]+)/);
    const rawLot=rawMatch?rawMatch[1].trim():"";
    const affected=[];
    const panels=Array.from(document.querySelectorAll("div.bg-slate-900.border.border-slate-800.rounded-lg"));
    const affectedPanel=panels.find(panel=>panel.textContent.includes("영향받는 완제품 LOT"));
    if(affectedPanel){
      affectedPanel.querySelectorAll("tbody tr").forEach(row=>{
        const lot=String(row.querySelector("td")?.textContent||"").trim();
        if(lot&&!affected.includes(lot))affected.push(lot);
      });
    }
    const firstLot=affected[0]||"";
    const firstData=DB.lots?.[firstLot]||{};
    writeDraft({
      source:"LOT 역추적",
      sourceType:"원료",
      sourceLot:rawLot,
      affectedLots:affected,
      itemName:firstData.itemName||"",
      issue:"원료 LOT 이상 영향 확인",
      createdAt:new Date().toISOString()
    });
  },true);

  const initialForm=()=>{
    const draft=readDraft()||{};
    return {
      sourceType:draft.sourceType||"공정",
      sourceLot:draft.sourceLot||"",
      affectedLots:Array.isArray(draft.affectedLots)?draft.affectedLots.join(", "):"",
      itemName:draft.itemName||"",
      issue:draft.issue||"",
      grade:"중결점",
      owner:currentUserName(),
      rack:"R-03",
      temporaryAction:"해당 LOT 사용·출하 중지 및 현장 격리",
      rootCause:"",
      correctiveAction:"",
      dueDate:""
    };
  };

  NcrTab=function NcrTab(){
    const [items,setItems]=useState(()=>Array.isArray(DB.ncrs)?DB.ncrs:[]);
    const [form,setForm]=useState(initialForm);
    const [message,setMessage]=useState("");
    const [showForm,setShowForm]=useState(()=>!!readDraft());
    const activeHolds=(DB.holds||[]).filter(row=>String(row.status||"").includes("차단중"));
    const openCount=items.filter(row=>row.status!=="완료").length;
    const inputClass="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none";

    const resetForm=()=>{
      clearDraft();
      setForm({
        sourceType:"공정",sourceLot:"",affectedLots:"",itemName:"",issue:"",grade:"중결점",
        owner:currentUserName(),rack:"R-03",temporaryAction:"해당 LOT 사용·출하 중지 및 현장 격리",
        rootCause:"",correctiveAction:"",dueDate:""
      });
      setShowForm(false);
    };

    const parseLots=()=>Array.from(new Set(
      [form.sourceLot,...String(form.affectedLots||"").split(/[,\s·]+/)]
        .map(value=>String(value||"").trim().toUpperCase()).filter(Boolean)
    ));

    const saveNcr=()=>{
      const lots=parseLots();
      if(!form.issue.trim()){setMessage("발생 내용을 입력해 주세요.");return;}
      if(!lots.length){setMessage("원인 LOT 또는 영향 LOT을 한 건 이상 입력해 주세요.");return;}
      const now=new Date();
      const seq=Math.max(0,...items.map(row=>Number(String(row.no||"").replace(/\D/g,""))||0))+1;
      const no=`NCR-${String(seq).padStart(4,"0")}`;
      const record={
        no,
        date:now.toLocaleDateString("ko-KR"),
        createdAt:now.toISOString(),
        sourceType:form.sourceType,
        sourceLot:form.sourceLot.trim().toUpperCase(),
        affectedLots:lots,
        lot:lots.join(" · "),
        item:form.issue.trim(),
        itemName:form.itemName.trim(),
        grade:form.grade,
        owner:form.owner.trim()||currentUserName(),
        rack:form.rack,
        temporaryAction:form.temporaryAction.trim(),
        rootCause:form.rootCause.trim(),
        correctiveAction:form.correctiveAction.trim(),
        dueDate:form.dueDate,
        status:"진행중",
        d:3,
        action:form.temporaryAction.trim()||"LOT 홀드 및 격리"
      };

      const nextItems=[record,...items];
      const nextHolds=[...(DB.holds||[])];
      lots.forEach((lot,index)=>{
        const duplicate=nextHolds.some(row=>String(row.target||"").trim()===lot&&!String(row.status||"").includes("해제 완료"));
        if(!duplicate){
          nextHolds.unshift({
            id:`HOLD-${now.getTime()}-${String(index+1).padStart(2,"0")}`,
            target:lot,
            type:form.sourceType,
            gate:form.sourceType==="원료"?"IQC·투입 게이트":"공정·출하 게이트",
            status:"차단중",
            ncr:no,
            since:now.toLocaleString("ko-KR",{hour12:false}),
            reason:form.issue.trim(),
            cond:"원인·시정조치 완료 및 품질 승인",
            rack:form.rack,
            release:""
          });
        }
        if(DB.lots?.[lot])DB.lots[lot]={...DB.lots[lot],status:"홀드",holdNo:no};
      });
      DB.ncrs=nextItems;
      DB.holds=nextHolds;
      if(typeof auditLog==="function")auditLog("부적합관리","등록·자동홀드",no,`${lots.join(", ")} / ${form.issue.trim()}`);
      dbSave();
      setItems(nextItems);
      setMessage(`${no} 등록 완료 · 관련 LOT ${lots.length}건이 자동 홀드되었습니다.`);
      resetForm();
    };

    const requestClose=(record)=>{
      const nextItems=items.map(row=>row.no===record.no?{...row,status:"유효성 확인",d:7}:row);
      DB.ncrs=nextItems;
      DB.holds=(DB.holds||[]).map(hold=>hold.ncr===record.no&&hold.status==="차단중"?{...hold,status:"해제 요청중 (승인 대기)"}:hold);
      if(typeof auditLog==="function")auditLog("부적합관리","홀드 해제 요청",record.no,record.lot);
      dbSave();
      setItems(nextItems);
      setMessage(`${record.no} 조치 완료 처리 · 품질 인터락에서 홀드 해제 승인이 필요합니다.`);
    };

    return <div className="flex flex-col gap-4">
      {message&&<div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-300">{message}</div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={ShieldAlert} label="전체 부적합" value={items.length} unit="건" tone="text-red-400" />
        <Kpi icon={Activity} label="진행중" value={openCount} unit="건" tone="text-amber-400" />
        <Kpi icon={Lock} label="차단중 LOT" value={activeHolds.length} unit="건" tone="text-red-400" />
        <Kpi icon={CheckCircle2} label="완료" value={items.length-openCount} unit="건" tone="text-emerald-400" />
      </div>

      {!showForm&&<button onClick={()=>setShowForm(true)} className="self-start rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500"><Plus size={14} className="mr-1 inline"/>부적합 신규 등록</button>}

      {showForm&&<Panel title="부적합 신규 등록" right={<span className="text-xs text-amber-300">등록 시 관련 LOT 자동 홀드</span>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-400">발생 구분<select className={`${inputClass} mt-1`} value={form.sourceType} onChange={event=>setForm({...form,sourceType:event.target.value})}><option>수입</option><option>원료</option><option>공정</option><option>출하</option><option>설비</option><option>고객불만</option></select></label>
          <label className="text-xs text-slate-400">원인 LOT<input className={`${inputClass} mt-1 font-mono`} value={form.sourceLot} onChange={event=>setForm({...form,sourceLot:event.target.value.toUpperCase()})} placeholder="원료 또는 완제품 LOT"/></label>
          <label className="text-xs text-slate-400 lg:col-span-2">영향 LOT<input className={`${inputClass} mt-1 font-mono`} value={form.affectedLots} onChange={event=>setForm({...form,affectedLots:event.target.value.toUpperCase()})} placeholder="여러 건은 쉼표로 구분"/></label>
          <label className="text-xs text-slate-400">품명<input className={`${inputClass} mt-1`} value={form.itemName} onChange={event=>setForm({...form,itemName:event.target.value})} placeholder="품명"/></label>
          <label className="text-xs text-slate-400 lg:col-span-2">발생 내용<input className={`${inputClass} mt-1`} value={form.issue} onChange={event=>setForm({...form,issue:event.target.value})} placeholder="부적합 또는 이상 내용"/></label>
          <label className="text-xs text-slate-400">결점 등급<select className={`${inputClass} mt-1`} value={form.grade} onChange={event=>setForm({...form,grade:event.target.value})}><option>경결점</option><option>중결점</option><option>치명결점</option></select></label>
          <label className="text-xs text-slate-400">담당자<input className={`${inputClass} mt-1`} value={form.owner} onChange={event=>setForm({...form,owner:event.target.value})}/></label>
          <label className="text-xs text-slate-400">격리 위치<select className={`${inputClass} mt-1`} value={form.rack} onChange={event=>setForm({...form,rack:event.target.value})}><option>R-01</option><option>R-02</option><option>R-03</option><option>R-04</option></select></label>
          <label className="text-xs text-slate-400">완료 예정일<input type="date" className={`${inputClass} mt-1`} value={form.dueDate} onChange={event=>setForm({...form,dueDate:event.target.value})}/></label>
          <label className="text-xs text-slate-400 lg:col-span-2">임시조치<textarea className={`${inputClass} mt-1 min-h-[78px]`} value={form.temporaryAction} onChange={event=>setForm({...form,temporaryAction:event.target.value})}/></label>
          <label className="text-xs text-slate-400 lg:col-span-2">원인 및 시정조치<textarea className={`${inputClass} mt-1 min-h-[78px]`} value={`${form.rootCause}${form.rootCause&&form.correctiveAction?"\n":""}${form.correctiveAction}`} onChange={event=>setForm({...form,rootCause:event.target.value,correctiveAction:""})} placeholder="원인분석 및 시정조치 계획"/></label>
        </div>
        <div className="mt-4 flex justify-end gap-2"><button onClick={resetForm} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">취소</button><button onClick={saveNcr} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-500">등록 및 LOT 홀드</button></div>
      </Panel>}

      {items.length===0&&<Panel title="부적합 현황"><p className="text-sm text-slate-500">등록된 부적합이 없습니다.</p></Panel>}
      {items.map(record=><Panel key={record.no} title={`${record.no} — ${record.item}`} right={<Badge tone={record.status==="완료"?"green":record.status.includes("유효성")?"blue":"amber"}>{record.status}</Badge>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div><div className="text-xs text-slate-500">발생일</div><div className="mt-1 text-sm text-slate-100">{record.date}</div></div>
          <div><div className="text-xs text-slate-500">발생 구분</div><div className="mt-1 text-sm text-slate-100">{record.sourceType||"-"}</div></div>
          <div><div className="text-xs text-slate-500">관련 LOT</div><div className="mt-1 break-words font-mono text-xs text-sky-300">{record.lot}</div></div>
          <div><div className="text-xs text-slate-500">격리 위치</div><div className="mt-1 text-sm text-amber-300">{record.rack||"-"}</div></div>
          <div><div className="text-xs text-slate-500">담당·기한</div><div className="mt-1 text-sm text-slate-100">{record.owner||"-"} · {record.dueDate||"미지정"}</div></div>
        </div>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-xs leading-relaxed text-slate-300"><span className="text-slate-500">임시조치: </span>{record.temporaryAction||record.action||"-"}</div>
        {record.status==="진행중"&&<div className="mt-3 text-right"><button onClick={()=>requestClose(record)} className="rounded-lg border border-emerald-500/50 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10">조치 완료·홀드 해제 요청</button></div>}
      </Panel>)}
      <p className="text-[11px] text-slate-500">부적합 등록 시 LOT는 품질 인터락의 차단 현황에 자동 추가됩니다. 홀드 해제는 조치 완료 후 승인 절차를 거쳐야 합니다.</p>
    </div>;
  };
})();