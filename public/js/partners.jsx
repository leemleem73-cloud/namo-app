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

  const openNew = () => { resetForm(); setShowForm(true); };
  const openCustomerEdit = (row) => { setEditCode(row.code); setCustomerForm({ name:row.name, status:row.status }); setShowForm(true); window.scrollTo({top:0,behavior:"smooth"}); };
  const openSupplierEdit = (row) => { setEditCode(row.code); setSupplierForm({ company:row.company, material:row.material, lot:row.lot, status:row.status }); setShowForm(true); window.scrollTo({top:0,behavior:"smooth"}); };

  const saveCustomer = () => {
    const name = customerForm.name.trim();
    if (!name) return window.alert("고객사명을 입력하세요.");
    const duplicate = customers.some((row)=>row.code!==editCode && row.name.toLowerCase()===name.toLowerCase());
    if (duplicate) return window.alert("이미 등록된 고객사입니다.");
    const next = editCode
      ? customers.map((row)=>row.code===editCode ? { ...row, name, status:customerForm.status } : row)
      : [...customers, { code:nextCode("CUS",customers), name, status:customerForm.status }];
    setCustomers(next); persist(next,suppliers);
    setSaveMessage(editCode ? `${name} 고객사 정보를 수정했습니다.` : `${name} 고객사를 등록했습니다.`);
    resetForm();
  };

  const saveSupplier = () => {
    const company = supplierForm.company.trim();
    const material = standardMaterialName(supplierForm.material);
    if (!company || !material) return window.alert("공급업체명과 원료명을 입력하세요.");
    const next = editCode
      ? suppliers.map((row)=>row.code===editCode ? { ...row, company, material, lot:supplierForm.lot.trim().toUpperCase(), status:supplierForm.status } : row)
      : [...suppliers, { code:nextCode("SUP",suppliers), company, material, lot:supplierForm.lot.trim().toUpperCase(), status:supplierForm.status }];
    setSuppliers(next); persist(customers,next);
    setSaveMessage(editCode ? `${company} 공급업체 정보를 수정했습니다.` : `${company} 공급업체를 등록했습니다.`);
    resetForm();
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><h2 className="text-2xl font-bold text-white">거래처 현황</h2><p className="mt-1 text-sm text-slate-400">고객사 및 원료 공급업체 정보를 등록·수정합니다.</p></div>
        <div className="flex gap-2">
          <button onClick={openNew} className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10">+ {activeType === "customer" ? "고객사 등록" : "공급업체 등록"}</button>
          {activeType === "supplier" && <button onClick={saveSupplierLots} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">LOT 저장 · 작업지시서 반영</button>}
        </div>
      </div>

      {showForm && <div className="rounded-xl border border-cyan-500/40 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-cyan-300">{editCode ? "등록 정보 수정" : "신규 등록"}</h3><button onClick={resetForm} className="text-sm text-slate-400">닫기</button></div>
        {activeType === "customer" ? <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input value={customerForm.name} onChange={(e)=>setCustomerForm({ ...customerForm, name:e.target.value })} placeholder="고객사명" className={inputClass}/>
          <select value={customerForm.status} onChange={(e)=>setCustomerForm({ ...customerForm, status:e.target.value })} className={inputClass}><option>거래중</option><option>거래중지</option></select>
          <button onClick={saveCustomer} className="rounded-lg bg-cyan-600 px-5 py-2 font-semibold text-white">{editCode ? "수정 저장" : "등록"}</button>
        </div> : <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_160px_auto]">
          <input value={supplierForm.company} onChange={(e)=>setSupplierForm({ ...supplierForm, company:e.target.value })} placeholder="공급업체명" className={inputClass}/>
          <input value={supplierForm.material} onChange={(e)=>setSupplierForm({ ...supplierForm, material:e.target.value })} placeholder="원료명" className={inputClass}/>
          <input value={supplierForm.lot} onChange={(e)=>setSupplierForm({ ...supplierForm, lot:e.target.value })} placeholder="최근 원료 LOT No." className={`${inputClass} font-mono`}/>
          <select value={supplierForm.status} onChange={(e)=>setSupplierForm({ ...supplierForm, status:e.target.value })} className={inputClass}><option>거래중</option><option>거래중지</option></select>
          <button onClick={saveSupplier} className="rounded-lg bg-cyan-600 px-5 py-2 font-semibold text-white">{editCode ? "수정 저장" : "등록"}</button>
        </div>}
      </div>}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <button onClick={()=>{setActiveType("customer");resetForm();}} className={`rounded-lg px-5 py-2 text-sm font-semibold ${activeType==="customer"?"bg-cyan-600 text-white":"border border-slate-700 bg-slate-950 text-slate-300"}`}>고객사 <span className="ml-2">{customers.length}</span></button>
          <button onClick={()=>{setActiveType("supplier");resetForm();}} className={`rounded-lg px-5 py-2 text-sm font-semibold ${activeType==="supplier"?"bg-cyan-600 text-white":"border border-slate-700 bg-slate-950 text-slate-300"}`}>공급업체 <span className="ml-2">{suppliers.length}</span></button>
        </div>
        <input type="search" value={searchText} onChange={(e)=>setSearchText(e.target.value)} placeholder={activeType==="customer"?"고객사명 또는 코드 검색":"공급업체, 원료명, LOT 검색"} className={`${inputClass} md:max-w-md`}/>
      </div>

      {saveMessage && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{saveMessage}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        <div className="border-b border-slate-700 px-5 py-4"><h3 className="font-semibold text-cyan-300">{activeType==="customer"?"고객사 목록":"공급업체 목록"}</h3></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
          {activeType === "customer" ? <>
            <thead className="bg-slate-800 text-slate-300"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3 text-left">고객사 코드</th><th className="px-4 py-3 text-left">고객사명</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">관리</th></tr></thead>
            <tbody>{filteredCustomers.map((item,index)=><tr key={item.code} className="border-t border-slate-800"><td className="px-4 py-3 text-center text-slate-400">{index+1}</td><td className="px-4 py-3 font-mono text-sky-300">{item.code}</td><td className="px-4 py-3 font-semibold text-white">{item.name}</td><td className="px-4 py-3 text-center text-emerald-300">{item.status}</td><td className="px-4 py-3 text-center"><button onClick={()=>openCustomerEdit(item)} className={btnEdit}>수정</button></td></tr>)}</tbody>
          </> : <>
            <thead className="bg-slate-800 text-slate-300"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3 text-left">공급업체 코드</th><th className="px-4 py-3 text-left">공급업체명</th><th className="px-4 py-3 text-left">원료명</th><th className="px-4 py-3 text-left">최근 원료 LOT No.</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">관리</th></tr></thead>
            <tbody>{filteredSuppliers.map((item,index)=><tr key={item.code} className="border-t border-slate-800"><td className="px-4 py-3 text-center text-slate-400">{index+1}</td><td className="px-4 py-3 font-mono text-sky-300">{item.code}</td><td className="px-4 py-3 font-semibold text-white">{item.company}</td><td className="px-4 py-3 text-white">{item.material}</td><td className="px-4 py-2"><input value={item.lot} onChange={(e)=>updateSupplierLot(item.code,e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-cyan-300"/></td><td className="px-4 py-3 text-center text-emerald-300">{item.status}</td><td className="px-4 py-3 text-center"><button onClick={()=>openSupplierEdit(item)} className={btnEdit}>수정</button></td></tr>)}</tbody>
          </>}
        </table></div>
      </div>
    </div>
  );
}
