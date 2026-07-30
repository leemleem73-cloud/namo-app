/* QMES module: 거래처 현황 */
function PartnersTab() {
  const defaultCustomers = [
    { code:"CUS001", name:"현대자동차", status:"거래중" },
    { code:"CUS002", name:"삼성SDI", status:"거래중" },
    { code:"CUS003", name:"LG에너지솔루션", status:"거래중" },
    { code:"CUS004", name:"SK온", status:"거래중" },
  ];
  const defaultSuppliers = [
    { code:"SUP001", company:"코오롱", material:"PAI", lot:"PAI#27-2(2)", status:"거래중" },
    { code:"SUP002", company:"푸양광명화학", material:"NMP", lot:"20251031063", status:"거래중" },
    { code:"SUP003", company:"모리로쿠케미칼즈", material:"NMP", lot:"2026011101", status:"거래중" },
    { code:"SUP004", company:"강신산업", material:"Boehmite", lot:"006-8-25", status:"거래중" },
    { code:"SUP005", company:"LG화학", material:"SBR", lot:"C3026B26A(1)", status:"거래중" },
    { code:"SUP006", company:"SOLVAY", material:"PVDF", lot:"CSE23202TA", status:"거래중" },
    { code:"SUP007", company:"금호석유화학", material:"SBS", lot:"W251016", status:"거래중" },
    { code:"SUP008", company:"유니소재", material:"BYK180 (분산제)", lot:"2708935", status:"거래중" },
  ];

  const normalizeMaterial = (name) => {
    const value = String(name || "").toUpperCase().replace(/\s+/g, "");
    if (value.includes("BYK180") || value.includes("BYK-180") || value.includes("분산제")) return "BYK180";
    if (value.includes("AOH30") || value.includes("BOEHMITE")) return "BOEHMITE";
    if (value.includes("PVDF")) return "PVDF";
    if (value.includes("PAI")) return "PAI";
    if (value.includes("NMP")) return "NMP";
    if (value.includes("SBR")) return "SBR";
    if (value.includes("SBS")) return "SBS";
    return value;
  };
  const standardMaterialName = (name) => normalizeMaterial(name) === "BYK180" ? "BYK180 (분산제)" : String(name || "").trim();
  const nextCode = (prefix, rows) => `${prefix}${String(Math.max(0, ...rows.map((r)=>Number(String(r.code||"").replace(/\D/g,""))||0)) + 1).padStart(3,"0")}`;

  const [activeType, setActiveType] = React.useState("customer");
  const [searchText, setSearchText] = React.useState("");
  const [saveMessage, setSaveMessage] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editCode, setEditCode] = React.useState(null);
  const [customerForm, setCustomerForm] = React.useState({ name:"", status:"거래중" });
  const [supplierForm, setSupplierForm] = React.useState({ company:"", material:"", lot:"", status:"거래중" });

  const [customers, setCustomers] = React.useState(() => {
    const saved = Array.isArray(DB?.partnerCustomers) ? DB.partnerCustomers : [];
    return saved.length ? saved : defaultCustomers;
  });
  const [suppliers, setSuppliers] = React.useState(() => {
    const saved = Array.isArray(DB?.partnerSuppliers) ? DB.partnerSuppliers : [];
    if (!saved.length) return defaultSuppliers;
    const merged = defaultSuppliers.map((item) => {
      const old = saved.find((row) => row.code === item.code);
      return old ? { ...item, ...old, material:standardMaterialName(old.material || item.material) } : item;
    });
    saved.filter((row)=>!merged.some((item)=>item.code===row.code)).forEach((row)=>merged.push({ ...row, material:standardMaterialName(row.material) }));
    return merged;
  });

  const persist = (nextCustomers = customers, nextSuppliers = suppliers) => {
    DB.partnerCustomers = nextCustomers.map((row)=>({ ...row }));
    DB.partnerSuppliers = nextSuppliers.map((row)=>({ ...row, material:standardMaterialName(row.material) }));
    DB.rawMaterialLots = nextSuppliers.reduce((acc,row)=>{
      acc[`${normalizeMaterial(row.material)}|${row.company}`] = {
        material:standardMaterialName(row.material), supplier:row.company,
        lot:String(row.lot||"").trim(), status:row.status,
        updatedAt:new Date().toISOString(), by:window.__QMES_USER__ || "-"
      };
      return acc;
    },{});
    dbSave();
  };

  const syncLotsToWorkOrders = (supplierRows) => {
    let linkedCount = 0;
    const latest = {};
    supplierRows.forEach((row)=>{
      const key = normalizeMaterial(row.material);
      if (String(row.lot||"").trim() && !latest[key]) latest[key] = row;
    });
    Object.entries(DB?.woDocs || {}).forEach(([woNo,doc])=>{
      if (!Array.isArray(doc.inputs)) return;
      let changed = false;
      const inputs = doc.inputs.map((input)=>{
        const master = latest[normalizeMaterial(input.name)];
        const currentLot = String(input.materialLot || input.lot || "").trim();
        if (!master || currentLot) return input;
        changed = true; linkedCount += 1;
        return { ...input, lot:master.lot, materialLot:master.lot, supplier:master.company, lotSource:"거래처 현황" };
      });
      if (changed) DB.woDocs[woNo] = { ...doc, inputs };
    });
    return linkedCount;
  };

  const resetForm = () => {
    setEditCode(null);
    setCustomerForm({ name:"", status:"거래중" });
    setSupplierForm({ company:"", material:"", lot:"", status:"거래중" });
    setShowForm(false);
  };
  const switchType = (type) => {
    setActiveType(type);
    setSearchText("");
    setSaveMessage("");
    resetForm();
  };
  const openNewFor = (type) => {
    switchType(type);
    setShowForm(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };
  const openCustomerEdit = (row) => { setActiveType("customer"); setEditCode(row.code); setCustomerForm({ name:row.name, status:row.status }); setShowForm(true); window.scrollTo({top:0,behavior:"smooth"}); };
  const openSupplierEdit = (row) => { setActiveType("supplier"); setEditCode(row.code); setSupplierForm({ company:row.company, material:row.material, lot:row.lot, status:row.status }); setShowForm(true); window.scrollTo({top:0,behavior:"smooth"}); };

  const saveCustomer = () => {
    const name = customerForm.name.trim();
    if (!name) return window.alert("고객사명을 입력하세요.");
    if (customers.some((row)=>row.code!==editCode && row.name.toLowerCase()===name.toLowerCase())) return window.alert("이미 등록된 고객사입니다.");
    const next = editCode ? customers.map((row)=>row.code===editCode ? { ...row, name, status:customerForm.status } : row) : [...customers, { code:nextCode("CUS",customers), name, status:customerForm.status }];
    setCustomers(next); persist(next,suppliers); setSaveMessage(editCode ? `${name} 고객사 정보를 수정했습니다.` : `${name} 고객사를 등록했습니다.`); resetForm();
  };
  const saveSupplier = () => {
    const company = supplierForm.company.trim();
    const material = standardMaterialName(supplierForm.material);
    if (!company || !material) return window.alert("공급업체명과 원료명을 입력하세요.");
    const next = editCode ? suppliers.map((row)=>row.code===editCode ? { ...row, company, material, lot:supplierForm.lot.trim().toUpperCase(), status:supplierForm.status } : row) : [...suppliers, { code:nextCode("SUP",suppliers), company, material, lot:supplierForm.lot.trim().toUpperCase(), status:supplierForm.status }];
    setSuppliers(next); persist(customers,next); setSaveMessage(editCode ? `${company} 공급업체 정보를 수정했습니다.` : `${company} 공급업체를 등록했습니다.`); resetForm();
  };
  const saveSupplierLots = () => {
    try {
      persist();
      const linkedCount = syncLotsToWorkOrders(suppliers);
      dbSave();
      setSaveMessage(`원료 LOT 저장 완료 · 빈 작업지시서 원료 LOT ${linkedCount}건 자동 반영`);
    } catch (error) {
      console.warn(error);
      setSaveMessage("저장 중 오류가 발생했습니다.");
    }
  };
  const updateSupplierLot = (code,lot) => setSuppliers((prev)=>prev.map((row)=>row.code===code ? { ...row, lot } : row));

  const keyword = searchText.trim().toLowerCase();
  const filteredCustomers = customers.filter((item)=>[item.code,item.name,item.status].some((v)=>String(v||"").toLowerCase().includes(keyword)));
  const filteredSuppliers = suppliers.filter((item)=>[item.code,item.company,item.material,item.lot,item.status].some((v)=>String(v||"").toLowerCase().includes(keyword))).sort((a,b)=>a.company.localeCompare(b.company,"ko-KR",{numeric:true,sensitivity:"base"}));
  const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500";
  const btnEdit = "rounded-md border border-sky-500/50 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/10";
  const activeTab = "border-cyan-400 bg-cyan-500/15 text-cyan-300";
  const idleTab = "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-200";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">거래처 현황</h2>
          <p className="mt-1 text-sm text-slate-400">고객사와 원료 공급업체를 구분하여 관리합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={()=>openNewFor("customer")} className="rounded-lg border border-sky-400/70 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">+ 고객사 등록</button>
          <button type="button" onClick={()=>openNewFor("supplier")} className="rounded-lg border border-cyan-400/70 bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600">+ 공급업체 등록</button>
        </div>
      </div>

      {!showForm && <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={()=>switchType("customer")} aria-pressed={activeType==="customer"} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${activeType==="customer"?activeTab:idleTab}`}>고객사 목록</button>
          <button type="button" onClick={()=>switchType("supplier")} aria-pressed={activeType==="supplier"} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${activeType==="supplier"?activeTab:idleTab}`}>공급업체 목록</button>
        </div>
        <div className="min-w-0 flex-1">
          <input type="search" value={searchText} onChange={(e)=>setSearchText(e.target.value)} placeholder={activeType==="customer"?"고객사명 또는 고객사 코드 검색":"공급업체명 / 원료명 / LOT 검색"} className={inputClass}/>
        </div>
      </div>}

      {showForm && <div className={`mx-auto w-[92%] rounded-xl border border-cyan-500/40 bg-slate-900 p-5 ${activeType==="customer" ? "max-w-[760px]" : "max-w-[1120px]"}`}>
        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-cyan-300">{editCode ? "등록 정보 수정" : activeType === "customer" ? "신규 고객사 등록" : "신규 공급업체 등록"}</h3><button onClick={resetForm} className="text-sm text-slate-400">닫기</button></div>
        {activeType === "customer" ? <div className="grid items-end gap-2 md:grid-cols-[minmax(0,1fr)_140px_110px]">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-300"><span>고객사명</span><input value={customerForm.name} onChange={(e)=>setCustomerForm({ ...customerForm, name:e.target.value })} placeholder="고객사명" className={inputClass}/></label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-300"><span>거래상태</span><select value={customerForm.status} onChange={(e)=>setCustomerForm({ ...customerForm, status:e.target.value })} className={inputClass}><option>거래중</option><option>거래중지</option></select></label>
          <button onClick={saveCustomer} className="h-[38px] rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white">{editCode ? "수정 저장" : "등록"}</button>
        </div> : <div className="grid items-end gap-2 md:grid-cols-[minmax(0,1fr)_170px_220px_130px_110px]">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-300"><span>공급업체명</span><input value={supplierForm.company} onChange={(e)=>setSupplierForm({ ...supplierForm, company:e.target.value })} placeholder="공급업체명" className={inputClass}/></label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-300"><span>원료명</span><input value={supplierForm.material} onChange={(e)=>setSupplierForm({ ...supplierForm, material:e.target.value })} placeholder="원료명" className={inputClass}/></label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-300"><span>최근 원료 LOT No.</span><input value={supplierForm.lot} onChange={(e)=>setSupplierForm({ ...supplierForm, lot:e.target.value })} placeholder="최근 원료 LOT No." className={`${inputClass} font-mono`}/></label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-300"><span>거래상태</span><select value={supplierForm.status} onChange={(e)=>setSupplierForm({ ...supplierForm, status:e.target.value })} className={inputClass}><option>거래중</option><option>거래중지</option></select></label>
          <button onClick={saveSupplier} className="h-[38px] rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white">{editCode ? "수정 저장" : "등록"}</button>
        </div>}
      </div>}

      {saveMessage && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{saveMessage}</div>}

      {!showForm && <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div><h3 className="font-semibold text-cyan-300">{activeType==="customer"?"고객사 목록":"공급업체 목록"}</h3><p className="mt-1 text-xs text-slate-500">{activeType==="customer"?`등록 고객사 ${filteredCustomers.length}건`:`등록 공급업체 ${filteredSuppliers.length}건 · 원료 LOT 작업지시서 연동`}</p></div>
          {activeType === "supplier" && <button type="button" onClick={saveSupplierLots} className="rounded-md border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10">LOT 저장 · 작업지시서 반영</button>}
        </div>
        <div className="overflow-x-auto"><table className={`${activeType==="customer" ? "w-[720px] min-w-[720px]" : "w-full min-w-[980px]"} table-fixed text-sm`}>
          {activeType === "customer" ? <>
            <colgroup><col style={{width:"60px"}}/><col style={{width:"150px"}}/><col style={{width:"280px"}}/><col style={{width:"120px"}}/><col style={{width:"110px"}}/></colgroup>
            <thead className="bg-slate-800 text-slate-300"><tr><th className="px-2 py-3">No</th><th className="px-2 py-3">고객사 코드</th><th className="px-3 py-3 text-left">고객사명</th><th className="px-2 py-3">상태</th><th className="px-2 py-3">관리</th></tr></thead>
            <tbody>{filteredCustomers.map((item,index)=><tr key={item.code} className="border-t border-slate-800"><td className="px-2 py-3 text-center text-slate-400">{index+1}</td><td className="px-2 py-3 text-center font-mono text-sky-300">{item.code}</td><td className="px-3 py-3 font-semibold text-white">{item.name}</td><td className="px-2 py-3 text-center text-emerald-300">{item.status}</td><td className="px-2 py-3 text-center"><button onClick={()=>openCustomerEdit(item)} className={btnEdit}>수정</button></td></tr>)}</tbody>
          </> : <>
            <colgroup><col style={{width:"55px"}}/><col style={{width:"135px"}}/><col style={{width:"190px"}}/><col style={{width:"175px"}}/><col style={{width:"245px"}}/><col style={{width:"90px"}}/><col style={{width:"90px"}}/></colgroup>
            <thead className="bg-slate-800 text-slate-300"><tr><th className="px-2 py-3">No</th><th className="px-2 py-3">공급업체 코드</th><th className="px-3 py-3 text-left">공급업체명</th><th className="px-3 py-3 text-left">원료명</th><th className="px-3 py-3 text-left">최근 원료 LOT No.</th><th className="px-2 py-3">상태</th><th className="px-2 py-3">관리</th></tr></thead>
            <tbody>{filteredSuppliers.map((item,index)=><tr key={item.code} className="border-t border-slate-800"><td className="px-2 py-3 text-center text-slate-400">{index+1}</td><td className="px-2 py-3 text-center font-mono text-sky-300">{item.code}</td><td className="px-3 py-3 font-semibold text-white">{item.company}</td><td className="px-3 py-3 text-white">{item.material}</td><td className="px-3 py-2"><input value={item.lot} onChange={(e)=>updateSupplierLot(item.code,e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-cyan-300"/></td><td className="px-2 py-3 text-center text-emerald-300">{item.status}</td><td className="px-2 py-3 text-center"><button onClick={()=>openSupplierEdit(item)} className={btnEdit}>수정</button></td></tr>)}</tbody>
          </>}
        </table></div>
      </div>}
    </div>
  );
}
