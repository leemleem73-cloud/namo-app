/* 부적합·설비관리 화면 정리
   품질검사 신규등록과 같은 목록 + 중앙 팝업 구조로 통일합니다. */
(function installCleanManagementModals(){
  const LegacyEquipmentManagementTab = typeof EquipmentTab === "function" ? EquipmentTab : null;
  const NCR_DRAFT_KEY = "qmes-ncr-draft-v1";

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
  const uniqueValues = values => Array.from(new Set((values||[]).map(value=>String(value||"").trim()).filter(Boolean)));
  const currentUserName = () => {
    const raw = window.__QMES_CURRENT_USER__ || window.__QMES_USER__;
    return raw && typeof raw === "object" ? String(raw.name || raw.uid || "") : String(raw || "");
  };
  const readNcrDraft = () => {
    try{return JSON.parse(sessionStorage.getItem(NCR_DRAFT_KEY)||"null");}
    catch(error){return null;}
  };
  const clearNcrDraft = () => {
    try{sessionStorage.removeItem(NCR_DRAFT_KEY);}
    catch(error){/* 무시 */}
  };

  const fieldClass = "mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";
  const areaClass = "mt-1 min-h-[92px] w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";
  const smallButton = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-black transition";
  const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-black text-white transition hover:bg-sky-500";

  function CleanModal({title,kicker,onClose,children,footer,maxWidth="max-w-5xl"}){
    return <div className="fixed inset-0 z-[22000] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
      <div className={`flex max-h-[94vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            {kicker&&<div className="text-[10px] font-black tracking-[0.18em] text-sky-400">{kicker}</div>}
            <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-xl text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="닫기">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer&&<div className="flex items-center justify-end gap-2 border-t border-slate-700 bg-slate-950/50 px-5 py-4">{footer}</div>}
      </div>
    </div>;
  }

  function SectionTitle({title,description,right}){
    return <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-white">{title}</h2>
        {description&&<p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      {right}
    </div>;
  }

  /* ───────────────────────── 부적합관리 ───────────────────────── */
  const ncrEmptyForm = () => {
    const draft = readNcrDraft() || {};
    return {
      sourceType:draft.sourceType||"공정",
      sourceLot:draft.sourceLot||"",
      affectedLots:Array.isArray(draft.affectedLots)?draft.affectedLots.join(", "):"",
      itemName:draft.itemName||"",
      issue:draft.issue||"",
      grade:"중결점",
      owner:"",
      rack:"",
      temporaryAction:"해당 LOT 사용·출하 중지 및 현장 격리",
      rootCause:"",
      correctiveAction:"",
      dueDate:""
    };
  };

  NcrTab = function CleanNcrTab(){
    const [items,setItems] = useState(()=>Array.isArray(DB.ncrs)?DB.ncrs:[]);
    const [form,setForm] = useState(ncrEmptyForm);
    const [modalOpen,setModalOpen] = useState(()=>!!readNcrDraft());
    const [message,setMessage] = useState("");
    const activeHolds = (DB.holds||[]).filter(row=>String(row.status||"").includes("차단중"));
    const openCount = items.filter(row=>row.status!=="완료").length;

    const closeModal = () => {
      clearNcrDraft();
      setForm(ncrEmptyForm());
      setModalOpen(false);
    };
    const openModal = () => {
      setForm(ncrEmptyForm());
      setMessage("");
      setModalOpen(true);
    };
    const parseLots = () => uniqueValues([
      form.sourceLot,
      ...String(form.affectedLots||"").split(/[,\s·]+/)
    ].map(value=>String(value||"").trim().toUpperCase()));

    const saveNcr = () => {
      const lots = parseLots();
      if(!form.issue.trim()){setMessage("발생 내용을 입력해 주세요.");return;}
      if(!lots.length){setMessage("원인 LOT 또는 영향 LOT을 한 건 이상 입력해 주세요.");return;}
      const now = new Date();
      const seq = Math.max(0,...items.map(row=>Number(String(row.no||"").replace(/\D/g,""))||0))+1;
      const no = `NCR-${String(seq).padStart(4,"0")}`;
      const record = {
        no,date:now.toLocaleDateString("ko-KR"),createdAt:now.toISOString(),
        sourceType:form.sourceType,sourceLot:form.sourceLot.trim().toUpperCase(),affectedLots:lots,
        lot:lots.join(" · "),item:form.issue.trim(),itemName:form.itemName.trim(),grade:form.grade,
        owner:form.owner.trim(),rack:form.rack.trim(),temporaryAction:form.temporaryAction.trim(),
        rootCause:form.rootCause.trim(),correctiveAction:form.correctiveAction.trim(),dueDate:form.dueDate,
        status:"진행중",d:3,action:form.temporaryAction.trim()||"LOT 홀드 및 격리"
      };
      const nextItems = [record,...items];
      const nextHolds = [...(DB.holds||[])];
      lots.forEach((lot,index)=>{
        const duplicate = nextHolds.some(row=>String(row.target||"").trim()===lot&&!String(row.status||"").includes("해제 완료"));
        if(!duplicate){
          nextHolds.unshift({
            id:`HOLD-${now.getTime()}-${String(index+1).padStart(2,"0")}`,target:lot,type:form.sourceType,
            gate:form.sourceType==="원료"?"IQC·투입 게이트":"공정·출하 게이트",status:"차단중",ncr:no,
            since:now.toLocaleString("ko-KR",{hour12:false}),reason:form.issue.trim(),
            cond:"원인·시정조치 완료 및 품질 승인",rack:form.rack.trim(),release:""
          });
        }
        if(DB.lots?.[lot]) DB.lots[lot] = {...DB.lots[lot],status:"홀드",holdNo:no};
      });
      DB.ncrs = nextItems;
      DB.holds = nextHolds;
      if(typeof auditLog==="function") auditLog("부적합관리","등록·자동홀드",no,`${lots.join(", ")} / ${form.issue.trim()}`);
      dbSave();
      setItems(nextItems);
      clearNcrDraft();
      setForm(ncrEmptyForm());
      setModalOpen(false);
      setMessage(`${no} 등록 완료 · 관련 LOT ${lots.length}건이 자동 홀드되었습니다.`);
    };

    const requestClose = record => {
      const nextItems = items.map(row=>row.no===record.no?{...row,status:"유효성 확인",d:7}:row);
      DB.ncrs = nextItems;
      DB.holds = (DB.holds||[]).map(hold=>hold.ncr===record.no&&hold.status==="차단중"?{...hold,status:"해제 요청중 (승인 대기)"}:hold);
      if(typeof auditLog==="function") auditLog("부적합관리","홀드 해제 요청",record.no,record.lot);
      dbSave();
      setItems(nextItems);
      setMessage(`${record.no} 조치 완료 처리 · 품질 인터락에서 홀드 해제 승인이 필요합니다.`);
    };

    return <div className="flex flex-col gap-5">
      <SectionTitle title="부적합 관리" description="발생 내용, 관련 LOT, 조치 상태를 한 화면에서 관리합니다."
        right={<button type="button" onClick={openModal} className={primaryButton}><Plus size={15}/>신규등록</button>}/>

      {message&&<div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300">{message}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={ShieldAlert} label="전체 부적합" value={items.length} unit="건" tone="text-red-400" />
        <Kpi icon={Activity} label="진행중" value={openCount} unit="건" tone="text-amber-400" />
        <Kpi icon={Lock} label="차단중 LOT" value={activeHolds.length} unit="건" tone="text-red-400" />
        <Kpi icon={CheckCircle2} label="완료" value={items.length-openCount} unit="건" tone="text-emerald-400" />
      </div>

      <Panel title="부적합 현황" right={<span className="text-xs text-slate-500">총 {items.length}건</span>}>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
              {['번호','발생일','구분','발생 내용','관련 LOT','담당자','격리 위치','상태','관리'].map(label=><th key={label} className="py-2 pr-3 text-left font-medium">{label}</th>)}
            </tr></thead>
            <tbody>
              {items.map(record=><tr key={record.no} className="border-b border-slate-800/80 hover:bg-slate-800/30">
                <td className="py-3 pr-3 font-mono text-xs font-black text-sky-300">{record.no}</td>
                <td className="py-3 pr-3 text-slate-300">{record.date}</td>
                <td className="py-3 pr-3">{record.sourceType||"-"}</td>
                <td className="max-w-[240px] py-3 pr-3 font-bold text-slate-100">{record.item}</td>
                <td className="max-w-[220px] break-words py-3 pr-3 font-mono text-xs text-slate-300">{record.lot}</td>
                <td className="py-3 pr-3">{record.owner||"-"}</td>
                <td className="py-3 pr-3">{record.rack||"-"}</td>
                <td className="py-3 pr-3"><Badge tone={record.status==="완료"?"green":String(record.status).includes("유효성")?"blue":"amber"}>{record.status}</Badge></td>
                <td className="py-3">{record.status==="진행중"?<button onClick={()=>requestClose(record)} className={`${smallButton} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`}>조치 완료</button>:<span className="text-xs text-slate-500">-</span>}</td>
              </tr>)}
              {items.length===0&&<tr><td colSpan="9" className="py-12 text-center text-slate-500">등록된 부적합이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {modalOpen&&<CleanModal title="부적합 신규등록" kicker="NONCONFORMITY REGISTRATION" onClose={closeModal}
        footer={<><button type="button" onClick={closeModal} className={`${smallButton} border-slate-600 text-slate-300 hover:bg-slate-800`}>취소</button><button type="button" onClick={saveNcr} className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-black text-white hover:bg-red-500">등록 및 LOT 홀드</button></>}>
        {message&&<div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{message}</div>}
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
            <h4 className="mb-3 text-sm font-black text-white">기본정보</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold text-slate-400">발생 구분<select className={fieldClass} value={form.sourceType} onChange={event=>setForm({...form,sourceType:event.target.value})}><option>수입</option><option>원료</option><option>공정</option><option>출하</option><option>설비</option><option>고객불만</option></select></label>
              <label className="text-xs font-bold text-slate-400">결점 등급<select className={fieldClass} value={form.grade} onChange={event=>setForm({...form,grade:event.target.value})}><option>경결점</option><option>중결점</option><option>치명결점</option></select></label>
              <label className="text-xs font-bold text-slate-400">담당자<input className={fieldClass} value={form.owner} onChange={event=>setForm({...form,owner:event.target.value})} placeholder="직접 입력"/></label>
              <label className="text-xs font-bold text-slate-400">완료 예정일<input type="date" className={fieldClass} value={form.dueDate} onChange={event=>setForm({...form,dueDate:event.target.value})}/></label>
              <label className="text-xs font-bold text-slate-400">원인 LOT<input className={`${fieldClass} font-mono`} value={form.sourceLot} onChange={event=>setForm({...form,sourceLot:event.target.value.toUpperCase()})} placeholder="원료 또는 완제품 LOT"/></label>
              <label className="text-xs font-bold text-slate-400 lg:col-span-2">영향 LOT<input className={`${fieldClass} font-mono`} value={form.affectedLots} onChange={event=>setForm({...form,affectedLots:event.target.value.toUpperCase()})} placeholder="여러 건은 쉼표로 구분"/></label>
              <label className="text-xs font-bold text-slate-400">격리 위치<input className={fieldClass} value={form.rack} onChange={event=>setForm({...form,rack:event.target.value})} placeholder="실제 격리 위치 입력"/></label>
              <label className="text-xs font-bold text-slate-400">품명<input className={fieldClass} value={form.itemName} onChange={event=>setForm({...form,itemName:event.target.value})} placeholder="품명"/></label>
              <label className="text-xs font-bold text-slate-400 md:col-span-2 lg:col-span-3">발생 내용<input className={fieldClass} value={form.issue} onChange={event=>setForm({...form,issue:event.target.value})} placeholder="부적합 또는 이상 내용을 입력하세요"/></label>
            </div>
          </section>
          <section className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
            <h4 className="mb-3 text-sm font-black text-white">조치내용</h4>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <label className="text-xs font-bold text-slate-400">임시조치<textarea className={areaClass} value={form.temporaryAction} onChange={event=>setForm({...form,temporaryAction:event.target.value})}/></label>
              <label className="text-xs font-bold text-slate-400">원인 및 시정조치<textarea className={areaClass} value={form.rootCause} onChange={event=>setForm({...form,rootCause:event.target.value,correctiveAction:""})} placeholder="원인분석 및 시정조치 계획"/></label>
            </div>
          </section>
        </div>
      </CleanModal>}
    </div>;
  };

  /* ───────────────────────── 설비관리 ───────────────────────── */
  const equipmentSeed = () => (typeof EQUIPMENT!=="undefined"?EQUIPMENT:[]).map((equipment,index)=>({
    id:String(equipment.id||`EQ-${String(index+1).padStart(3,"0")}`),
    managementNo:String(equipment.id||`EQ-${String(index+1).padStart(3,"0")}`),
    name:String(equipment.name||`설비 ${index+1}`),
    location:"",owner:"",maker:"",model:"",installDate:"",status:"미등록",note:""
  }));
  const loadEquipmentMaster = () => {
    const defaults = equipmentSeed();
    const saved = Array.isArray(DB.equipmentMaster)?DB.equipmentMaster:[];
    const merged = defaults.map(item=>({...item,...(saved.find(row=>row.id===item.id)||{})}));
    saved.filter(row=>!merged.some(item=>item.id===row.id)).forEach(row=>merged.push({...row}));
    return merged;
  };
  const emptyMasterForm = () => ({id:"",managementNo:"",name:"",location:"",owner:"",maker:"",model:"",installDate:"",status:"미등록",note:""});
  const emptyScheduleForm = master => ({equipmentId:master[0]?.id||"",type:"정기점검",cycleDays:"30",lastDate:"",nextDate:"",owner:"",note:""});
  const emptyRepairForm = master => ({equipmentId:master[0]?.id||"",occurredAt:todayText(),issue:"",action:"",downtime:"0",owner:"",status:"조치중"});

  EquipmentTab = function CleanEquipmentTab(){
    const [section,setSection] = useState("daily");
    const [master,setMaster] = useState(loadEquipmentMaster);
    const [schedules,setSchedules] = useState(()=>Array.isArray(DB.equipmentSchedules)?DB.equipmentSchedules:[]);
    const [repairs,setRepairs] = useState(()=>Array.isArray(DB.equipmentRepairs)?DB.equipmentRepairs:[]);
    const [notice,setNotice] = useState("");
    const [modal,setModal] = useState(null);
    const [masterForm,setMasterForm] = useState(emptyMasterForm);
    const [scheduleForm,setScheduleForm] = useState(()=>emptyScheduleForm(loadEquipmentMaster()));
    const [repairForm,setRepairForm] = useState(()=>emptyRepairForm(loadEquipmentMaster()));

    const flash = text => {setNotice(text);window.setTimeout(()=>setNotice(""),2600);};
    const persistMaster = rows => {DB.equipmentMaster=rows;dbSave();setMaster([...rows]);};
    const persistSchedules = rows => {DB.equipmentSchedules=rows;dbSave();setSchedules([...rows]);};
    const persistRepairs = rows => {DB.equipmentRepairs=rows;dbSave();setRepairs([...rows]);};
    const masterById = id => master.find(item=>item.id===id)||{id,name:id};

    const openNewMaster = () => {setMasterForm(emptyMasterForm());setModal("master");};
    const openEditMaster = row => {setMasterForm({...row});setModal("master");};
    const saveMaster = () => {
      if(!masterForm.name.trim()){flash("설비명을 입력해 주세요.");return;}
      const id = masterForm.id || `EQM-${Date.now()}`;
      const row = {...masterForm,id,managementNo:masterForm.managementNo.trim()||id,name:masterForm.name.trim(),location:masterForm.location.trim(),owner:masterForm.owner.trim(),maker:masterForm.maker.trim(),model:masterForm.model.trim(),note:masterForm.note.trim()};
      const next = master.some(item=>item.id===id)?master.map(item=>item.id===id?row:item):[row,...master];
      persistMaster(next);
      if(typeof auditLog==="function")auditLog("설비관리",masterForm.id?"설비대장 수정":"설비대장 등록",id,row.name);
      setModal(null);flash("설비대장을 저장했습니다.");
    };

    const openSchedule = () => {setScheduleForm(emptyScheduleForm(master));setModal("schedule");};
    const saveSchedule = () => {
      const cycle = Math.max(1,Number(scheduleForm.cycleDays)||1);
      const nextDate = scheduleForm.nextDate || addDays(scheduleForm.lastDate,cycle);
      if(!scheduleForm.equipmentId||!nextDate){flash("설비와 다음 예정일을 확인해 주세요.");return;}
      const now = new Date();
      const row = {id:`PM-${now.getTime()}`,equipmentId:scheduleForm.equipmentId,type:scheduleForm.type,cycleDays:cycle,lastDate:scheduleForm.lastDate,nextDate,owner:scheduleForm.owner.trim(),note:scheduleForm.note.trim(),status:"예정",createdAt:now.toISOString(),createdBy:currentUserName()};
      persistSchedules([row,...schedules]);
      if(typeof auditLog==="function")auditLog("설비관리","정기점검·교정 등록",row.id,`${row.equipmentId} / ${row.type}`);
      setModal(null);flash("정기점검·교정 일정을 등록했습니다.");
    };
    const completeSchedule = row => {
      const done = todayText();
      const next = schedules.map(item=>item.id===row.id?{...item,lastDate:done,nextDate:addDays(done,item.cycleDays),status:"예정",completedAt:new Date().toISOString(),completedBy:currentUserName()}:item);
      persistSchedules(next);flash("완료 처리 후 다음 예정일을 계산했습니다.");
    };
    const removeSchedule = row => {
      if(!window.confirm(`${row.type} 일정을 삭제하시겠습니까?`))return;
      persistSchedules(schedules.filter(item=>item.id!==row.id));
    };

    const openRepair = () => {setRepairForm(emptyRepairForm(master));setModal("repair");};
    const saveRepair = () => {
      if(!repairForm.equipmentId||!repairForm.issue.trim()){flash("설비와 이상 내용을 입력해 주세요.");return;}
      const now = new Date();
      const row = {id:`ER-${now.getTime()}`,equipmentId:repairForm.equipmentId,occurredAt:repairForm.occurredAt||todayText(),issue:repairForm.issue.trim(),action:repairForm.action.trim(),downtime:Math.max(0,Number(repairForm.downtime)||0),owner:repairForm.owner.trim(),status:repairForm.status,createdAt:now.toISOString(),createdBy:currentUserName()};
      persistRepairs([row,...repairs]);
      if(row.status!=="완료") persistMaster(master.map(item=>item.id===row.equipmentId?{...item,status:row.status==="사용중지"?"사용중지":"점검중"}:item));
      if(typeof auditLog==="function")auditLog("설비관리","고장·수리 등록",row.id,`${row.equipmentId} / ${row.issue}`);
      setModal(null);flash("고장·수리 이력을 등록했습니다.");
    };
    const completeRepair = row => {
      const next = repairs.map(item=>item.id===row.id?{...item,status:"완료",completedAt:new Date().toISOString(),completedBy:currentUserName()}:item);
      persistRepairs(next);
      const stillOpen = next.some(item=>item.equipmentId===row.equipmentId&&item.status!=="완료");
      if(!stillOpen) persistMaster(master.map(item=>item.id===row.equipmentId?{...item,status:"가동"}:item));
      flash("수리 완료 처리했습니다.");
    };

    const scheduleRows = [...schedules].sort((a,b)=>String(a.nextDate).localeCompare(String(b.nextDate)));
    const overdueCount = scheduleRows.filter(row=>daysBetween(row.nextDate)<0).length;
    const soonCount = scheduleRows.filter(row=>{const days=daysBetween(row.nextDate);return days!=null&&days>=0&&days<=30;}).length;
    const openRepairs = repairs.filter(row=>row.status!=="완료").length;
    const stoppedCount = master.filter(row=>row.status==="사용중지").length;
    const nav = [["daily","일일점검"],["master","설비대장"],["schedule","정기점검·교정"],["repair","고장·수리 이력"]];

    return <div className="flex flex-col gap-5">
      <style>{`
        .qmes-clean-daily-wrapper > div > .grid.grid-cols-2.gap-3,
        .qmes-clean-daily-wrapper > div > .flex.flex-wrap.gap-2.rounded-xl { display:none !important; }
        .qmes-clean-daily-wrapper > div { gap:0 !important; }
      `}</style>
      <SectionTitle title="설비 관리" description="일일점검, 설비 기본정보, 정기점검·교정, 고장·수리 이력을 구분해 관리합니다."/>
      {notice&&<div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300">{notice}</div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["등록 설비",master.length,"대"],["30일 이내 일정",soonCount,"건"],["기한 초과",overdueCount,"건"],["미완료 수리",openRepairs,"건"]].map(([label,value,unit],index)=><div key={label} className={`rounded-xl border p-4 ${index===2&&value>0?"border-red-500/50 bg-red-500/10":index===3&&value>0?"border-amber-500/50 bg-amber-500/10":"border-slate-800 bg-slate-900"}`}><div className="text-xs font-bold text-slate-400">{label}</div><div className="mt-2 text-2xl font-black text-white">{value}<span className="ml-1 text-xs font-medium text-slate-500">{unit}</span></div></div>)}
      </div>
      {stoppedCount>0&&<div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">사용중지 설비 {stoppedCount}대 — 조치 완료 전 사용 여부를 확인하세요.</div>}

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
        {nav.map(([id,label])=><button key={id} type="button" onClick={()=>setSection(id)} className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-black transition ${section===id?"border-sky-400 bg-sky-500/15 text-white":"border-slate-700 bg-slate-950 text-slate-400 hover:text-white"}`}>{label}</button>)}
      </div>

      {section==="daily"&&<div className="qmes-clean-daily-wrapper">{LegacyEquipmentManagementTab?<LegacyEquipmentManagementTab/>:<Panel title="일일점검"><p className="text-sm text-slate-500">일일점검 화면을 불러오지 못했습니다.</p></Panel>}</div>}

      {section==="master"&&<>
        <SectionTitle title="설비대장" description="기존 일일점검 설비명은 불러오되, 위치·담당부서·제조사·모델은 실제 정보 입력 전까지 빈칸으로 표시합니다."
          right={<button type="button" onClick={openNewMaster} className={primaryButton}><Plus size={15}/>신규등록</button>}/>
        <Panel title="설비대장 현황" right={<span className="text-xs text-slate-500">총 {master.length}대</span>}>
          <div className="overflow-x-auto -mx-4 px-4"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400">{['관리번호','설비명','설치위치','담당부서','제조사·모델','설치일','상태','관리'].map(label=><th key={label} className="py-2 pr-3 text-left font-medium">{label}</th>)}</tr></thead><tbody>{master.map(row=><tr key={row.id} className="border-b border-slate-800/80 hover:bg-slate-800/30"><td className="py-3 pr-3 font-mono text-xs text-sky-300">{row.managementNo||"-"}</td><td className="py-3 pr-3 font-bold text-white">{row.name}</td><td className="py-3 pr-3">{row.location||"-"}</td><td className="py-3 pr-3">{row.owner||"-"}</td><td className="py-3 pr-3">{[row.maker,row.model].filter(Boolean).join(" · ")||"-"}</td><td className="py-3 pr-3">{row.installDate||"-"}</td><td className="py-3 pr-3"><Badge tone={row.status==="가동"?"green":row.status==="사용중지"?"red":row.status==="점검중"?"amber":"gray"}>{row.status||"미등록"}</Badge></td><td className="py-3"><button type="button" onClick={()=>openEditMaster(row)} className={`${smallButton} border-sky-500/50 text-sky-300 hover:bg-sky-500/10`}>수정</button></td></tr>)}</tbody></table></div>
        </Panel>
      </>}

      {section==="schedule"&&<>
        <SectionTitle title="정기점검·교정" description="고장 전에 미리 점검·청소·부품교체를 하거나 측정장비 교정일정을 관리합니다."
          right={<button type="button" onClick={openSchedule} className={primaryButton}><Plus size={15}/>신규등록</button>}/>
        <Panel title="정기점검·교정 현황" right={<span className="text-xs text-slate-500">총 {scheduleRows.length}건</span>}>
          <div className="overflow-x-auto -mx-4 px-4"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400">{['설비','구분','주기','마지막 실시일','다음 예정일','담당','상태','관리'].map(label=><th key={label} className="py-2 pr-3 text-left font-medium">{label}</th>)}</tr></thead><tbody>{scheduleRows.map(row=>{const days=daysBetween(row.nextDate);const tone=days<0?"red":days<=30?"amber":"green";const label=days<0?`${Math.abs(days)}일 초과`:days===0?"오늘 예정":`${days}일 남음`;return <tr key={row.id} className="border-b border-slate-800/80 hover:bg-slate-800/30"><td className="py-3 pr-3 font-bold text-white">{masterById(row.equipmentId).name}</td><td className="py-3 pr-3">{row.type}</td><td className="py-3 pr-3">{row.cycleDays}일</td><td className="py-3 pr-3">{row.lastDate||"-"}</td><td className="py-3 pr-3 font-mono text-sky-300">{row.nextDate}</td><td className="py-3 pr-3">{row.owner||"-"}</td><td className="py-3 pr-3"><Badge tone={tone}>{label}</Badge></td><td className="py-3"><div className="flex gap-1.5"><button type="button" onClick={()=>completeSchedule(row)} className={`${smallButton} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`}>완료</button><button type="button" onClick={()=>removeSchedule(row)} className={`${smallButton} border-red-500/40 text-red-400 hover:bg-red-500/10`}>삭제</button></div></td></tr>})}{scheduleRows.length===0&&<tr><td colSpan="8" className="py-12 text-center text-slate-500">등록된 일정이 없습니다.</td></tr>}</tbody></table></div>
        </Panel>
      </>}

      {section==="repair"&&<>
        <SectionTitle title="고장·수리 이력" description="설비 이상, 조치 내용, 비가동 시간과 완료 상태를 기록합니다."
          right={<button type="button" onClick={openRepair} className={primaryButton}><Plus size={15}/>신규등록</button>}/>
        <Panel title="고장·수리 현황" right={<span className="text-xs text-slate-500">총 {repairs.length}건</span>}>
          <div className="overflow-x-auto -mx-4 px-4"><table className="w-full min-w-[960px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400">{['발생일','설비','이상 내용','조치 내용','비가동','담당자','상태','관리'].map(label=><th key={label} className="py-2 pr-3 text-left font-medium">{label}</th>)}</tr></thead><tbody>{repairs.map(row=><tr key={row.id} className="border-b border-slate-800/80 hover:bg-slate-800/30"><td className="py-3 pr-3">{row.occurredAt}</td><td className="py-3 pr-3 font-bold text-white">{masterById(row.equipmentId).name}</td><td className="max-w-[220px] py-3 pr-3 text-slate-200">{row.issue}</td><td className="max-w-[250px] py-3 pr-3 text-slate-400">{row.action||"-"}</td><td className="py-3 pr-3">{row.downtime||0}분</td><td className="py-3 pr-3">{row.owner||"-"}</td><td className="py-3 pr-3"><Badge tone={row.status==="완료"?"green":row.status==="사용중지"?"red":"amber"}>{row.status}</Badge></td><td className="py-3">{row.status!=="완료"?<button type="button" onClick={()=>completeRepair(row)} className={`${smallButton} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`}>수리 완료</button>:<span className="text-xs text-slate-500">완료</span>}</td></tr>)}{repairs.length===0&&<tr><td colSpan="8" className="py-12 text-center text-slate-500">등록된 고장·수리 이력이 없습니다.</td></tr>}</tbody></table></div>
        </Panel>
      </>}

      {modal==="master"&&<CleanModal title={masterForm.id?"설비대장 수정":"설비대장 신규등록"} kicker="EQUIPMENT MASTER" onClose={()=>setModal(null)} maxWidth="max-w-4xl"
        footer={<><button type="button" onClick={()=>setModal(null)} className={`${smallButton} border-slate-600 text-slate-300 hover:bg-slate-800`}>취소</button><button type="button" onClick={saveMaster} className={primaryButton}>저장</button></>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-bold text-slate-400">관리번호<input className={`${fieldClass} font-mono`} value={masterForm.managementNo} onChange={event=>setMasterForm({...masterForm,managementNo:event.target.value})} placeholder="설비 관리번호"/></label>
          <label className="text-xs font-bold text-slate-400 md:col-span-1 lg:col-span-2">설비명<input className={fieldClass} value={masterForm.name} onChange={event=>setMasterForm({...masterForm,name:event.target.value})} placeholder="설비명"/></label>
          <label className="text-xs font-bold text-slate-400">설치위치<input className={fieldClass} value={masterForm.location} onChange={event=>setMasterForm({...masterForm,location:event.target.value})} placeholder="실제 설치위치"/></label>
          <label className="text-xs font-bold text-slate-400">담당부서<input className={fieldClass} value={masterForm.owner} onChange={event=>setMasterForm({...masterForm,owner:event.target.value})} placeholder="담당부서"/></label>
          <label className="text-xs font-bold text-slate-400">상태<select className={fieldClass} value={masterForm.status} onChange={event=>setMasterForm({...masterForm,status:event.target.value})}><option>미등록</option><option>가동</option><option>점검중</option><option>사용중지</option><option>폐기</option></select></label>
          <label className="text-xs font-bold text-slate-400">제조사<input className={fieldClass} value={masterForm.maker} onChange={event=>setMasterForm({...masterForm,maker:event.target.value})} placeholder="제조사"/></label>
          <label className="text-xs font-bold text-slate-400">모델<input className={fieldClass} value={masterForm.model} onChange={event=>setMasterForm({...masterForm,model:event.target.value})} placeholder="모델명"/></label>
          <label className="text-xs font-bold text-slate-400">설치일<input type="date" className={fieldClass} value={masterForm.installDate} onChange={event=>setMasterForm({...masterForm,installDate:event.target.value})}/></label>
          <label className="text-xs font-bold text-slate-400 md:col-span-2 lg:col-span-3">비고<textarea className={areaClass} value={masterForm.note} onChange={event=>setMasterForm({...masterForm,note:event.target.value})} placeholder="설비 관련 메모"/></label>
        </div>
      </CleanModal>}

      {modal==="schedule"&&<CleanModal title="정기점검·교정 신규등록" kicker="MAINTENANCE & CALIBRATION" onClose={()=>setModal(null)} maxWidth="max-w-4xl"
        footer={<><button type="button" onClick={()=>setModal(null)} className={`${smallButton} border-slate-600 text-slate-300 hover:bg-slate-800`}>취소</button><button type="button" onClick={saveSchedule} className={primaryButton}>일정 등록</button></>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-bold text-slate-400">설비<select className={fieldClass} value={scheduleForm.equipmentId} onChange={event=>setScheduleForm({...scheduleForm,equipmentId:event.target.value})}>{master.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-400">구분<select className={fieldClass} value={scheduleForm.type} onChange={event=>setScheduleForm({...scheduleForm,type:event.target.value})}><option>정기점검</option><option>교정</option><option>청소</option><option>윤활</option><option>부품교체</option></select></label>
          <label className="text-xs font-bold text-slate-400">주기(일)<input type="number" min="1" className={fieldClass} value={scheduleForm.cycleDays} onChange={event=>setScheduleForm({...scheduleForm,cycleDays:event.target.value,nextDate:scheduleForm.lastDate?addDays(scheduleForm.lastDate,event.target.value):scheduleForm.nextDate})}/></label>
          <label className="text-xs font-bold text-slate-400">마지막 실시일<input type="date" className={fieldClass} value={scheduleForm.lastDate} onChange={event=>setScheduleForm({...scheduleForm,lastDate:event.target.value,nextDate:addDays(event.target.value,scheduleForm.cycleDays)})}/></label>
          <label className="text-xs font-bold text-slate-400">다음 예정일<input type="date" className={fieldClass} value={scheduleForm.nextDate} onChange={event=>setScheduleForm({...scheduleForm,nextDate:event.target.value})}/></label>
          <label className="text-xs font-bold text-slate-400">담당부서·담당자<input className={fieldClass} value={scheduleForm.owner} onChange={event=>setScheduleForm({...scheduleForm,owner:event.target.value})} placeholder="직접 입력"/></label>
          <label className="text-xs font-bold text-slate-400 md:col-span-2 lg:col-span-3">점검내용·메모<textarea className={areaClass} value={scheduleForm.note} onChange={event=>setScheduleForm({...scheduleForm,note:event.target.value})} placeholder="점검 내용 또는 교체 대상 부품"/></label>
        </div>
      </CleanModal>}

      {modal==="repair"&&<CleanModal title="고장·수리 이력 신규등록" kicker="BREAKDOWN & REPAIR" onClose={()=>setModal(null)} maxWidth="max-w-4xl"
        footer={<><button type="button" onClick={()=>setModal(null)} className={`${smallButton} border-slate-600 text-slate-300 hover:bg-slate-800`}>취소</button><button type="button" onClick={saveRepair} className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-600 px-5 text-sm font-black text-white hover:bg-amber-500">이력 등록</button></>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-bold text-slate-400">설비<select className={fieldClass} value={repairForm.equipmentId} onChange={event=>setRepairForm({...repairForm,equipmentId:event.target.value})}>{master.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-400">발생일<input type="date" className={fieldClass} value={repairForm.occurredAt} onChange={event=>setRepairForm({...repairForm,occurredAt:event.target.value})}/></label>
          <label className="text-xs font-bold text-slate-400">상태<select className={fieldClass} value={repairForm.status} onChange={event=>setRepairForm({...repairForm,status:event.target.value})}><option>조치중</option><option>사용중지</option><option>완료</option></select></label>
          <label className="text-xs font-bold text-slate-400 md:col-span-2">이상 내용<input className={fieldClass} value={repairForm.issue} onChange={event=>setRepairForm({...repairForm,issue:event.target.value})} placeholder="고장 또는 이상 현상"/></label>
          <label className="text-xs font-bold text-slate-400">비가동 시간(분)<input type="number" min="0" className={fieldClass} value={repairForm.downtime} onChange={event=>setRepairForm({...repairForm,downtime:event.target.value})}/></label>
          <label className="text-xs font-bold text-slate-400 md:col-span-2">조치 내용<textarea className={areaClass} value={repairForm.action} onChange={event=>setRepairForm({...repairForm,action:event.target.value})} placeholder="점검·수리·부품교체 내용"/></label>
          <label className="text-xs font-bold text-slate-400">담당자<input className={fieldClass} value={repairForm.owner} onChange={event=>setRepairForm({...repairForm,owner:event.target.value})} placeholder="직접 입력"/></label>
        </div>
      </CleanModal>}
    </div>;
  };
})();
