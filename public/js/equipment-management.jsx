/* QMES 설비 종합관리 — 현장입력 설비 전용 React 구성 */
(function installEquipmentManagement(){
  if(typeof EquipmentTab !== "function" || typeof EQUIPMENT === "undefined") return;
  if(window.__QMES_EQUIPMENT_MANAGEMENT_INSTALLED__) return;
  window.__QMES_EQUIPMENT_MANAGEMENT_INSTALLED__ = true;

  const DailyEquipmentCheckTab = window.__QMES_BASE_EQUIPMENT_TAB__ || EquipmentTab;
  window.__QMES_BASE_EQUIPMENT_TAB__ = DailyEquipmentCheckTab;
  const todayText = () => {
    const date = new Date();
    const pad = value => String(value).padStart(2,"0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1,"0")}-${pad(date.getDate(),"0")}`;
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
  const masterSeed = () => (EQUIPMENT || []).map((equipment,index)=>({id:String(equipment.id||`EQ-${String(index+1).padStart(3,"0")}`),managementNo:String(equipment.id||`EQ-${String(index+1).padStart(3,"0")}`),name:String(equipment.name||`설비 ${index+1}`),location:"생산라인",owner:"생산부",maker:"",model:"",installDate:"",status:"가동",note:""}));
  const loadMaster = () => {
    const defaults=masterSeed(); const saved=Array.isArray(DB.equipmentMaster)?DB.equipmentMaster:[];
    const merged=defaults.map(item=>({...item,...(saved.find(row=>row.id===item.id)||{})}));
    saved.filter(row=>!merged.some(item=>item.id===row.id)).forEach(row=>merged.push({...row})); return merged;
  };
  const inputClass="qmes-equipment-field w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-sky-500";
  const smallButton="qmes-equipment-small-button rounded-md border px-3 py-1.5 text-xs font-bold transition";

  function EquipmentSummaryNumber({value}){
    const [visible,setVisible]=React.useState(true);
    React.useEffect(()=>{
      const timer=window.setInterval(()=>setVisible(current=>!current),500);
      return ()=>window.clearInterval(timer);
    },[]);
    return <strong
      className="qmes-equipment-summary-number"
      data-qmes-react-blink="1"
      style={{visibility:visible?"visible":"hidden"}}
    >{value}</strong>;
  }

  function EquipmentManagementTab(){
    const [section,setSection]=useState("daily");
    const [master,setMaster]=useState(loadMaster);
    const [schedules,setSchedules]=useState(()=>Array.isArray(DB.equipmentSchedules)?DB.equipmentSchedules:[]);
    const [repairs,setRepairs]=useState(()=>Array.isArray(DB.equipmentRepairs)?DB.equipmentRepairs:[]);
    const [notice,setNotice]=useState("");
    const [scheduleForm,setScheduleForm]=useState(()=>({equipmentId:EQUIPMENT[0]?.id||"",type:"정기점검",cycleDays:"30",lastDate:"",nextDate:"",owner:"생산부",note:""}));
    const [repairForm,setRepairForm]=useState(()=>({equipmentId:EQUIPMENT[0]?.id||"",occurredAt:todayText(),issue:"",action:"",downtime:"0",owner:currentUserName(),status:"조치중"}));
    const flash=text=>{setNotice(text);window.setTimeout(()=>setNotice(""),2400);};
    const persistMaster=rows=>{DB.equipmentMaster=rows;dbSave();setMaster([...rows]);};
    const persistSchedules=rows=>{DB.equipmentSchedules=rows;dbSave();setSchedules([...rows]);};
    const persistRepairs=rows=>{DB.equipmentRepairs=rows;dbSave();setRepairs([...rows]);};
    const updateMaster=(id,key,value)=>setMaster(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));
    const saveMaster=()=>{persistMaster(master);if(typeof auditLog==="function")auditLog("설비관리","설비대장 저장","전체",`${master.length}건`);flash("설비대장을 저장했습니다.");};
    const addSchedule=()=>{const cycle=Math.max(1,Number(scheduleForm.cycleDays)||1);const nextDate=scheduleForm.nextDate||addDays(scheduleForm.lastDate,cycle);if(!scheduleForm.equipmentId||!nextDate){flash("설비와 다음 예정일을 확인해 주세요.");return;}const now=new Date();const row={id:`PM-${now.getTime()}`,equipmentId:scheduleForm.equipmentId,type:scheduleForm.type,cycleDays:cycle,lastDate:scheduleForm.lastDate,nextDate,owner:scheduleForm.owner.trim()||"생산부",note:scheduleForm.note.trim(),status:"예정",createdAt:now.toISOString(),createdBy:currentUserName()};persistSchedules([row,...schedules]);setScheduleForm({...scheduleForm,lastDate:"",nextDate:"",note:""});flash("정기점검·교정 일정을 등록했습니다.");};
    const completeSchedule=row=>{const done=todayText();persistSchedules(schedules.map(item=>item.id===row.id?{...item,lastDate:done,nextDate:addDays(done,item.cycleDays),status:"완료",completedAt:new Date().toISOString(),completedBy:currentUserName()}:item));flash("완료 처리하고 다음 예정일을 자동 계산했습니다.");};
    const removeSchedule=row=>{if(window.confirm(`${row.type} 일정을 삭제하시겠습니까?`))persistSchedules(schedules.filter(item=>item.id!==row.id));};
    const addRepair=()=>{if(!repairForm.equipmentId||!repairForm.issue.trim()){flash("설비와 이상 내용을 입력해 주세요.");return;}const now=new Date();const row={id:`ER-${now.getTime()}`,equipmentId:repairForm.equipmentId,occurredAt:repairForm.occurredAt||todayText(),issue:repairForm.issue.trim(),action:repairForm.action.trim(),downtime:Math.max(0,Number(repairForm.downtime)||0),owner:repairForm.owner.trim()||currentUserName(),status:repairForm.status,createdAt:now.toISOString(),createdBy:currentUserName()};persistRepairs([row,...repairs]);if(row.status!=="완료")persistMaster(master.map(item=>item.id===row.equipmentId?{...item,status:row.status==="사용중지"?"사용중지":"점검중"}:item));setRepairForm({...repairForm,occurredAt:todayText(),issue:"",action:"",downtime:"0",status:"조치중"});flash("고장·수리 이력을 등록했습니다.");};
    const completeRepair=row=>{const next=repairs.map(item=>item.id===row.id?{...item,status:"완료",completedAt:new Date().toISOString(),completedBy:currentUserName()}:item);persistRepairs(next);if(!next.some(item=>item.equipmentId===row.equipmentId&&item.status!=="완료"))persistMaster(master.map(item=>item.id===row.equipmentId?{...item,status:"가동"}:item));flash("수리 완료 처리했습니다.");};
    const masterById=id=>master.find(item=>item.id===id)||{id,name:id};
    const scheduleRows=[...schedules].sort((a,b)=>String(a.nextDate).localeCompare(String(b.nextDate)));
    const overdueCount=scheduleRows.filter(row=>daysBetween(row.nextDate)<0).length;
    const soonCount=scheduleRows.filter(row=>{const days=daysBetween(row.nextDate);return days!=null&&days>=0&&days<=30;}).length;
    const openRepairs=repairs.filter(row=>row.status!=="완료").length;
    const stoppedCount=master.filter(row=>row.status==="사용중지").length;
    const nav=[["daily","일일점검"],["master","설비대장"],["schedule","정기점검·교정"],["repair","고장·수리 이력"]];

    return <div className="qmes-equipment-management-layout">
      <aside className="qmes-equipment-management-sidebar qmes-equipment-nav-block" aria-label="설비 관리 메뉴">
        {nav.map(([id,label])=><button key={id} type="button" onClick={()=>setSection(id)} aria-selected={section===id?"true":"false"} className={section===id?"is-active":""}>{label}</button>)}
      </aside>
      <main className="qmes-equipment-management-content">
        {notice&&<div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-300">{notice}</div>}
        <div className="qmes-equipment-management-summary grid grid-cols-2 gap-3 lg:grid-cols-4">{[["등록 설비",master.length,"대"],["30일 이내 일정",soonCount,"건"],["기한 초과",overdueCount,"건"],["미완료 수리",openRepairs,"건"]].map(([label,value,unit],index)=><div key={label} className={`qmes-equipment-summary-card rounded-xl border p-4 ${index===2&&value>0?"border-red-500/50 bg-red-500/10":index===3&&value>0?"border-amber-500/50 bg-amber-500/10":"border-slate-800 bg-slate-900"}`}><div className="qmes-equipment-summary-label text-xs font-bold text-slate-400">{label}</div><div className="qmes-equipment-summary-value mt-2 text-2xl font-black text-white"><EquipmentSummaryNumber value={value} /><span className="qmes-equipment-summary-unit ml-1 text-xs font-medium text-slate-500">{unit}</span></div></div>)}</div>
        {stoppedCount>0&&<div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">사용중지 설비 {stoppedCount}대 — 조치 완료 전 사용 여부를 확인하세요.</div>}
        {section==="daily"&&<DailyEquipmentCheckTab/>}
        {section==="master"&&<Panel title="설비대장" right={<button onClick={saveMaster} className={`${smallButton} border-sky-500/50 bg-sky-500/10 text-sky-300`}>전체 저장</button>}><div className="overflow-x-auto -mx-4 px-4"><table className="qmes-equipment-master-table w-full min-w-[1050px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400">{["관리번호","설비명","설치위치","담당부서","제조사","모델","설치일","상태","비고"].map(label=><th key={label} className="px-1 py-2 text-left font-medium">{label}</th>)}</tr></thead><tbody>{master.map(row=><tr key={row.id} className="border-b border-slate-800">{[["managementNo",true],["name"],["location"],["owner"],["maker"],["model"]].map(([key,mono])=><td key={key} className="px-1 py-2"><input className={`${inputClass}${mono?" font-mono":""}`} value={row[key]||""} onChange={e=>updateMaster(row.id,key,e.target.value)}/></td>)}<td className="px-1 py-2"><input type="date" className={inputClass} value={row.installDate||""} onChange={e=>updateMaster(row.id,"installDate",e.target.value)}/></td><td className="px-1 py-2"><select className={inputClass} value={row.status||"가동"} onChange={e=>updateMaster(row.id,"status",e.target.value)}><option>가동</option><option>점검중</option><option>사용중지</option><option>폐기</option></select></td><td className="px-1 py-2"><input className={inputClass} value={row.note||""} onChange={e=>updateMaster(row.id,"note",e.target.value)}/></td></tr>)}</tbody></table></div></Panel>}
        {section==="schedule"&&<><Panel title="정기점검·교정 일정 등록"><div className="qmes-equipment-schedule-form grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-7"><label className="text-xs text-slate-400">설비<select className={`${inputClass} mt-1`} value={scheduleForm.equipmentId} onChange={e=>setScheduleForm({...scheduleForm,equipmentId:e.target.value})}>{master.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label className="text-xs text-slate-400">구분<select className={`${inputClass} mt-1`} value={scheduleForm.type} onChange={e=>setScheduleForm({...scheduleForm,type:e.target.value})}><option>정기점검</option><option>교정</option><option>예방보전</option></select></label><label className="text-xs text-slate-400">주기(일)<input className={`${inputClass} mt-1`} value={scheduleForm.cycleDays} onChange={e=>setScheduleForm({...scheduleForm,cycleDays:e.target.value})}/></label><label className="text-xs text-slate-400">마지막 실시일<input type="date" className={`${inputClass} mt-1`} value={scheduleForm.lastDate} onChange={e=>setScheduleForm({...scheduleForm,lastDate:e.target.value})}/></label><label className="text-xs text-slate-400">다음 예정일<input type="date" className={`${inputClass} mt-1`} value={scheduleForm.nextDate} onChange={e=>setScheduleForm({...scheduleForm,nextDate:e.target.value})}/></label><label className="text-xs text-slate-400">담당<input className={`${inputClass} mt-1`} value={scheduleForm.owner} onChange={e=>setScheduleForm({...scheduleForm,owner:e.target.value})}/></label><button onClick={addSchedule} className={`${smallButton} self-end border-sky-500/50 bg-sky-500/10 text-sky-300`}>일정 등록</button></div></Panel><Panel title="정기점검·교정 일정"><div className="qmes-equipment-schedule-list space-y-2">{scheduleRows.map(row=><div key={row.id} className="qmes-equipment-schedule-row flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs"><b>{masterById(row.equipmentId).name}</b><span>{row.type}</span><span>{row.nextDate}</span><span>{row.owner}</span><button onClick={()=>completeSchedule(row)} className={`${smallButton} ml-auto border-emerald-500/50 text-emerald-300`}>완료</button><button onClick={()=>removeSchedule(row)} className={`${smallButton} border-red-500/40 text-red-300`}>삭제</button></div>)}</div></Panel></>}
        {section==="repair"&&<><Panel title="고장·수리 등록"><div className="qmes-equipment-repair-form grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6"><label className="text-xs text-slate-400">설비<select className={`${inputClass} mt-1`} value={repairForm.equipmentId} onChange={e=>setRepairForm({...repairForm,equipmentId:e.target.value})}>{master.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label className="text-xs text-slate-400">발생일<input type="date" className={`${inputClass} mt-1`} value={repairForm.occurredAt} onChange={e=>setRepairForm({...repairForm,occurredAt:e.target.value})}/></label><label className="text-xs text-slate-400">이상 내용<input className={`${inputClass} mt-1`} value={repairForm.issue} onChange={e=>setRepairForm({...repairForm,issue:e.target.value})}/></label><label className="text-xs text-slate-400">조치 내용<input className={`${inputClass} mt-1`} value={repairForm.action} onChange={e=>setRepairForm({...repairForm,action:e.target.value})}/></label><label className="text-xs text-slate-400">상태<select className={`${inputClass} mt-1`} value={repairForm.status} onChange={e=>setRepairForm({...repairForm,status:e.target.value})}><option>조치중</option><option>사용중지</option><option>완료</option></select></label><button onClick={addRepair} className={`${smallButton} self-end border-sky-500/50 bg-sky-500/10 text-sky-300`}>이력 등록</button></div></Panel><Panel title="고장·수리 이력"><div className="qmes-equipment-repair-list space-y-2">{repairs.map(row=><div key={row.id} className="qmes-equipment-repair-row flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs"><b>{masterById(row.equipmentId).name}</b><span>{row.occurredAt}</span><span>{row.issue}</span><span>{row.action||"-"}</span><span>{row.status}</span>{row.status!=="완료"&&<button onClick={()=>completeRepair(row)} className={`${smallButton} ml-auto border-emerald-500/50 text-emerald-300`}>수리 완료</button>}</div>)}</div></Panel></>}
      </main>
    </div>;
  }
  EquipmentTab=EquipmentManagementTab;
})();
