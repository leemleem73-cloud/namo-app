/* QMES 설비 종합관리 — 현장입력 설비 전용 React 구성 */
(function installEquipmentManagement(){
  if(typeof EquipmentTab !== "function" || typeof EQUIPMENT === "undefined") return;

  const DailyEquipmentCheckTab = EquipmentTab;
  const todayText = () => {
    const date = new Date();
    const pad = value => String(value).padStart(2,"0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  };
  const addDays = (dateText, days) => {
    if(!dateText) return "";
    const date = new Date(`${dateText}T00:00:00`);
    if(Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate()+Math.max(0,Number(days)||0));
    const pad = value => String(value).padStart(2,"0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  };
  const daysBetween = dateText => {
    if(!dateText) return null;
    const target = new Date(`${dateText}T00:00:00`);
    const today = new Date(`${todayText()}T00:00:00`);
    if(Number.isNaN(target.getTime())) return null;
    return Math.ceil((target-today)/86400000);
  };
  const currentUserName = () => {
    const raw = window.__QMES_CURRENT_USER__ || window.__QMES_USER__;
    return raw && typeof raw === "object" ? String(raw.name || raw.uid || "현재 사용자") : String(raw || "현재 사용자");
  };
  const masterSeed = () => (EQUIPMENT || []).map((equipment,index)=>({
    id:String(equipment.id || `EQ-${String(index+1).padStart(3,"0")}`),
    managementNo:String(equipment.id || `EQ-${String(index+1).padStart(3,"0")}`),
    name:String(equipment.name || `설비 ${index+1}`),
    location:"생산라인",
    owner:"생산부",
    maker:"",
    model:"",
    installDate:"",
    status:"가동",
    note:""
  }));
  const loadMaster = () => {
    const defaults = masterSeed();
    const saved = Array.isArray(DB.equipmentMaster) ? DB.equipmentMaster : [];
    const merged = defaults.map(item=>({...item,...(saved.find(row=>row.id===item.id)||{})}));
    saved.filter(row=>!merged.some(item=>item.id===row.id)).forEach(row=>merged.push({...row}));
    return merged;
  };
  const inputClass = "w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-sky-500";
  const smallButton = "rounded-md border px-3 py-1.5 text-xs font-bold transition";

  function EquipmentManagementTab(){
    const [section,setSection] = useState("daily");
    const [master,setMaster] = useState(loadMaster);
    const [schedules,setSchedules] = useState(()=>Array.isArray(DB.equipmentSchedules)?DB.equipmentSchedules:[]);
    const [repairs,setRepairs] = useState(()=>Array.isArray(DB.equipmentRepairs)?DB.equipmentRepairs:[]);
    const [notice,setNotice] = useState("");
    const [scheduleForm,setScheduleForm] = useState(()=>({
      equipmentId:EQUIPMENT[0]?.id || "", type:"정기점검", cycleDays:"30", lastDate:"", nextDate:"", owner:"생산부", note:""
    }));
    const [repairForm,setRepairForm] = useState(()=>({
      equipmentId:EQUIPMENT[0]?.id || "", occurredAt:todayText(), issue:"", action:"", downtime:"0", owner:currentUserName(), status:"조치중"
    }));

    const flash = text => { setNotice(text); window.setTimeout(()=>setNotice(""),2400); };
    const persistMaster = rows => { DB.equipmentMaster=rows; dbSave(); setMaster([...rows]); };
    const persistSchedules = rows => { DB.equipmentSchedules=rows; dbSave(); setSchedules([...rows]); };
    const persistRepairs = rows => { DB.equipmentRepairs=rows; dbSave(); setRepairs([...rows]); };
    const updateMaster = (id,key,value) => setMaster(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));
    const saveMaster = () => {
      persistMaster(master);
      if(typeof auditLog==="function") auditLog("설비관리","설비대장 저장","전체",`${master.length}건`);
      flash("설비대장을 저장했습니다.");
    };

    const addSchedule = () => {
      const cycle=Math.max(1,Number(scheduleForm.cycleDays)||1);
      const nextDate=scheduleForm.nextDate || addDays(scheduleForm.lastDate,cycle);
      if(!scheduleForm.equipmentId || !nextDate){ flash("설비와 다음 예정일을 확인해 주세요."); return; }
      const now=new Date();
      const row={
        id:`PM-${now.getTime()}`, equipmentId:scheduleForm.equipmentId, type:scheduleForm.type,
        cycleDays:cycle, lastDate:scheduleForm.lastDate, nextDate, owner:scheduleForm.owner.trim()||"생산부",
        note:scheduleForm.note.trim(), status:"예정", createdAt:now.toISOString(), createdBy:currentUserName()
      };
      const next=[row,...schedules];
      persistSchedules(next);
      if(typeof auditLog==="function") auditLog("설비관리","정기점검·교정 일정 등록",row.id,`${row.equipmentId} / ${row.type}`);
      setScheduleForm({...scheduleForm,lastDate:"",nextDate:"",note:""});
      flash("정기점검·교정 일정을 등록했습니다.");
    };
    const completeSchedule = row => {
      const done=todayText();
      const next=schedules.map(item=>item.id===row.id?{...item,lastDate:done,nextDate:addDays(done,item.cycleDays),status:"완료",completedAt:new Date().toISOString(),completedBy:currentUserName()}:item);
      persistSchedules(next);
      flash("완료 처리하고 다음 예정일을 자동 계산했습니다.");
    };
    const removeSchedule = row => {
      if(!window.confirm(`${row.type} 일정을 삭제하시겠습니까?`)) return;
      persistSchedules(schedules.filter(item=>item.id!==row.id));
    };

    const addRepair = () => {
      if(!repairForm.equipmentId || !repairForm.issue.trim()){ flash("설비와 이상 내용을 입력해 주세요."); return; }
      const now=new Date();
      const row={
        id:`ER-${now.getTime()}`, equipmentId:repairForm.equipmentId, occurredAt:repairForm.occurredAt||todayText(),
        issue:repairForm.issue.trim(), action:repairForm.action.trim(), downtime:Math.max(0,Number(repairForm.downtime)||0),
        owner:repairForm.owner.trim()||currentUserName(), status:repairForm.status, createdAt:now.toISOString(), createdBy:currentUserName()
      };
      const next=[row,...repairs];
      persistRepairs(next);
      if(row.status!=="완료"){
        const nextMaster=master.map(item=>item.id===row.equipmentId?{...item,status:row.status==="사용중지"?"사용중지":"점검중"}:item);
        persistMaster(nextMaster);
      }
      if(typeof auditLog==="function") auditLog("설비관리","고장·수리 등록",row.id,`${row.equipmentId} / ${row.issue}`);
      setRepairForm({...repairForm,occurredAt:todayText(),issue:"",action:"",downtime:"0",status:"조치중"});
      flash("고장·수리 이력을 등록했습니다.");
    };
    const completeRepair = row => {
      const next=repairs.map(item=>item.id===row.id?{...item,status:"완료",completedAt:new Date().toISOString(),completedBy:currentUserName()}:item);
      persistRepairs(next);
      const stillOpen=next.some(item=>item.equipmentId===row.equipmentId&&item.status!=="완료");
      if(!stillOpen) persistMaster(master.map(item=>item.id===row.equipmentId?{...item,status:"가동"}:item));
      flash("수리 완료 처리했습니다.");
    };

    const masterById = id => master.find(item=>item.id===id) || {id,name:id};
    const scheduleRows=[...schedules].sort((a,b)=>String(a.nextDate).localeCompare(String(b.nextDate)));
    const overdueCount=scheduleRows.filter(row=>daysBetween(row.nextDate)<0).length;
    const soonCount=scheduleRows.filter(row=>{const days=daysBetween(row.nextDate);return days!=null&&days>=0&&days<=30;}).length;
    const openRepairs=repairs.filter(row=>row.status!=="완료").length;
    const stoppedCount=master.filter(row=>row.status==="사용중지").length;
    const nav=[
      ["daily","일일점검"],
      ["master","설비대장"],
      ["schedule","정기점검·교정"],
      ["repair","고장·수리 이력"]
    ];

    return (
      <div className="qmes-equipment-management-layout">
        <aside className="qmes-equipment-management-sidebar qmes-equipment-nav-block" aria-label="설비 관리 메뉴">
          <div className="qmes-equipment-management-sidebar-title">설비 관리</div>
          {nav.map(([id,label])=>(
            <button
              key={id}
              type="button"
              onClick={()=>setSection(id)}
              aria-selected={section===id ? "true" : "false"}
              className={section===id ? "is-active" : ""}
            >{label}</button>
          ))}
        </aside>

        <main className="qmes-equipment-management-content">
          {notice&&<div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-300">{notice}</div>}

          <div className="qmes-equipment-management-summary grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["등록 설비",master.length,"대"],
              ["30일 이내 일정",soonCount,"건"],
              ["기한 초과",overdueCount,"건"],
              ["미완료 수리",openRepairs,"건"]
            ].map(([label,value,unit],index)=>(
              <div key={label} className={`rounded-xl border p-4 ${index===2&&value>0?"border-red-500/50 bg-red-500/10":index===3&&value>0?"border-amber-500/50 bg-amber-500/10":"border-slate-800 bg-slate-900"}`}>
                <div className="text-xs font-bold text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-black text-white">{value}<span className="ml-1 text-xs font-medium text-slate-500">{unit}</span></div>
              </div>
            ))}
          </div>

          {stoppedCount>0&&<div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">사용중지 설비 {stoppedCount}대 — 조치 완료 전 사용 여부를 확인하세요.</div>}

          {section==="daily"&&<DailyEquipmentCheckTab/>}

          {section==="master"&&(
            <Panel title="설비대장" right={<button onClick={saveMaster} className={`${smallButton} border-sky-500/50 bg-sky-500/10 text-sky-300`}>전체 저장</button>}>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead><tr className="border-b border-slate-700 text-xs text-slate-400">{["관리번호","설비명","설치위치","담당부서","제조사","모델","설치일","상태","비고"].map(label=><th key={label} className="px-1 py-2 text-left font-medium">{label}</th>)}</tr></thead>
                  <tbody>{master.map(row=><tr key={row.id} className="border-b border-slate-800">
                    <td className="px-1 py-2"><input className={`${inputClass} font-mono`} value={row.managementNo||""} onChange={event=>updateMaster(row.id,"managementNo",event.target.value)}/></td>
                    <td className="px-1 py-2"><input className={inputClass} value={row.name||""} onChange={event=>updateMaster(row.id,"name",event.target.value)}/></td>
                    <td className="px-1 py-2"><input className={inputClass} value={row.location||""} onChange={event=>updateMaster(row.id,"location",event.target.value)}/></td>
                    <td className="px-1 py-2"><input className={inputClass} value={row.owner||""} onChange={event=>updateMaster(row.id,"owner",event.target.value)}/></td>
                    <td className="px-1 py-2"><input className={inputClass} value={row.maker||""} onChange={event=>updateMaster(row.id,"maker",event.target.value)}/></td>
                    <td className="px-1 py-2"><input className={inputClass} value={row.model||""} onChange={event=>updateMaster(row.id,"model",event.target.value)}/></td>
                    <td className="px-1 py-2"><input type="date" className={inputClass} value={row.installDate||""} onChange={event=>updateMaster(row.id,"installDate",event.target.value)}/></td>
                    <td className="px-1 py-2"><select className={inputClass} value={row.status||"가동"} onChange={event=>updateMaster(row.id,"status",event.target.value)}><option>가동</option><option>점검중</option><option>사용중지</option><option>폐기</option></select></td>
                    <td className="px-1 py-2"><input className={inputClass} value={row.note||""} onChange={event=>updateMaster(row.id,"note",event.target.value)}/></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">설비 기본정보와 현재 상태를 관리합니다. 사용중지 설비는 상단에 경고가 표시됩니다.</p>
            </Panel>
          )}

          {section==="schedule"&&<>
            <Panel title="정기점검·교정 일정 등록" right={<span className="text-xs text-slate-500">마지막 실시일과 주기를 입력하면 다음 예정일이 계산됩니다.</span>}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-7">
                <label className="text-xs text-slate-400">설비<select className={`${inputClass} mt-1`} value={scheduleForm.equipmentId} onChange={event=>setScheduleForm({...scheduleForm,equipmentId:event.target.value})}>{master.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
                <label className="text-xs text-slate-400">구분<select className={`${inputClass} mt-1`} value={scheduleForm.type} onChange={event=>setScheduleForm({...scheduleForm,type:event.target.value})}><option>정기점검</option><option>교정</option><option>예방보전</option><option>부품교체</option></select></label>
                <label className="text-xs text-slate-400">주기(일)<input type="number" min="1" className={`${inputClass} mt-1`} value={scheduleForm.cycleDays} onChange={event=>setScheduleForm({...scheduleForm,cycleDays:event.target.value})}/></label>
                <label className="text-xs text-slate-400">마지막 실시일<input type="date" className={`${inputClass} mt-1`} value={scheduleForm.lastDate} onChange={event=>setScheduleForm({...scheduleForm,lastDate:event.target.value,nextDate:addDays(event.target.value,scheduleForm.cycleDays)})}/></label>
                <label className="text-xs text-slate-400">다음 예정일<input type="date" className={`${inputClass} mt-1`} value={scheduleForm.nextDate} onChange={event=>setScheduleForm({...scheduleForm,nextDate:event.target.value})}/></label>
                <label className="text-xs text-slate-400">담당부서<input className={`${inputClass} mt-1`} value={scheduleForm.owner} onChange={event=>setScheduleForm({...scheduleForm,owner:event.target.value})}/></label>
                <div className="flex items-end"><button onClick={addSchedule} className="h-[34px] w-full rounded-md bg-sky-600 px-3 text-xs font-bold text-white hover:bg-sky-500">일정 등록</button></div>
              </div>
              <input className={`${inputClass} mt-3`} value={scheduleForm.note} onChange={event=>setScheduleForm({...scheduleForm,note:event.target.value})} placeholder="점검 내용 또는 교체 대상 부품 메모"/>
            </Panel>
            <Panel title="정기점검·교정 현황" right={<span className="text-xs text-slate-400">총 {scheduleRows.length}건</span>}>
              <div className="overflow-x-auto -mx-4 px-4"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400">{["설비","구분","주기","마지막 실시일","다음 예정일","담당","상태","관리"].map(label=><th key={label} className="py-2 pr-3 text-left font-medium">{label}</th>)}</tr></thead><tbody>{scheduleRows.map(row=>{const days=daysBetween(row.nextDate);const tone=days<0?"red":days<=30?"amber":"green";const label=days<0?`${Math.abs(days)}일 초과`:days===0?"오늘 예정":`${days}일 남음`;return <tr key={row.id} className="border-b border-slate-800"><td className="py-3 pr-3 font-bold text-slate-100">{masterById(row.equipmentId).name}</td><td className="py-3 pr-3">{row.type}</td><td className="py-3 pr-3">{row.cycleDays}일</td><td className="py-3 pr-3">{row.lastDate||"-"}</td><td className="py-3 pr-3 font-mono text-sky-300">{row.nextDate}</td><td className="py-3 pr-3">{row.owner}</td><td className="py-3 pr-3"><Badge tone={tone}>{label}</Badge></td><td className="py-3"><div className="flex gap-1"><button onClick={()=>completeSchedule(row)} className={`${smallButton} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`}>완료</button><button onClick={()=>removeSchedule(row)} className={`${smallButton} border-red-500/40 text-red-400 hover:bg-red-500/10`}>삭제</button></div></td></tr>})}{scheduleRows.length===0&&<tr><td colSpan="8" className="py-8 text-center text-slate-500">등록된 일정이 없습니다.</td></tr>}</tbody></table></div>
            </Panel>
          </>}

          {section==="repair"&&<>
            <Panel title="고장·수리 이력 등록" right={<span className="text-xs text-amber-300">미완료 등록 시 설비 상태가 점검중 또는 사용중지로 변경됩니다.</span>}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <label className="text-xs text-slate-400">설비<select className={`${inputClass} mt-1`} value={repairForm.equipmentId} onChange={event=>setRepairForm({...repairForm,equipmentId:event.target.value})}>{master.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
                <label className="text-xs text-slate-400">발생일<input type="date" className={`${inputClass} mt-1`} value={repairForm.occurredAt} onChange={event=>setRepairForm({...repairForm,occurredAt:event.target.value})}/></label>
                <label className="text-xs text-slate-400 lg:col-span-2">이상 내용<input className={`${inputClass} mt-1`} value={repairForm.issue} onChange={event=>setRepairForm({...repairForm,issue:event.target.value})} placeholder="고장 또는 이상 현상"/></label>
                <label className="text-xs text-slate-400">상태<select className={`${inputClass} mt-1`} value={repairForm.status} onChange={event=>setRepairForm({...repairForm,status:event.target.value})}><option>조치중</option><option>사용중지</option><option>완료</option></select></label>
                <label className="text-xs text-slate-400">비가동(분)<input type="number" min="0" className={`${inputClass} mt-1`} value={repairForm.downtime} onChange={event=>setRepairForm({...repairForm,downtime:event.target.value})}/></label>
                <label className="text-xs text-slate-400 lg:col-span-4">조치 내용<input className={`${inputClass} mt-1`} value={repairForm.action} onChange={event=>setRepairForm({...repairForm,action:event.target.value})} placeholder="점검·수리·부품 교체 내용"/></label>
                <label className="text-xs text-slate-400">담당자<input className={`${inputClass} mt-1`} value={repairForm.owner} onChange={event=>setRepairForm({...repairForm,owner:event.target.value})}/></label>
                <div className="flex items-end"><button onClick={addRepair} className="h-[34px] w-full rounded-md bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-500">이력 등록</button></div>
              </div>
            </Panel>
            <Panel title="고장·수리 현황" right={<span className="text-xs text-slate-400">총 {repairs.length}건</span>}>
              <div className="overflow-x-auto -mx-4 px-4"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400">{["발생일","설비","이상 내용","조치 내용","비가동","담당자","상태","관리"].map(label=><th key={label} className="py-2 pr-3 text-left font-medium">{label}</th>)}</tr></thead><tbody>{repairs.map(row=><tr key={row.id} className="border-b border-slate-800"><td className="py-3 pr-3">{row.occurredAt}</td><td className="py-3 pr-3 font-bold text-slate-100">{masterById(row.equipmentId).name}</td><td className="max-w-[240px] py-3 pr-3 text-slate-200">{row.issue}</td><td className="max-w-[260px] py-3 pr-3 text-slate-400">{row.action||"-"}</td><td className="py-3 pr-3">{row.downtime||0}분</td><td className="py-3 pr-3">{row.owner}</td><td className="py-3 pr-3"><Badge tone={row.status==="완료"?"green":row.status==="사용중지"?"red":"amber"}>{row.status}</Badge></td><td className="py-3">{row.status!=="완료"?<button onClick={()=>completeRepair(row)} className={`${smallButton} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`}>수리 완료</button>:<span className="text-xs text-slate-500">완료</span>}</td></tr>)}{repairs.length===0&&<tr><td colSpan="8" className="py-8 text-center text-slate-500">등록된 고장·수리 이력이 없습니다.</td></tr>}</tbody></table></div>
              <p className="mt-3 text-[11px] text-slate-500">수리 완료 처리 시 동일 설비의 미완료 건이 없으면 설비 상태가 자동으로 가동으로 변경됩니다.</p>
            </Panel>
          </>}
        </main>
      </div>
    );
  }

  window.QMESEquipmentManagementTab = EquipmentManagementTab;
  EquipmentTab = EquipmentManagementTab;
})();
