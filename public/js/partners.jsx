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
      <style>{`
        .qmes-partner-form-shell {
          width: 92%;
          margin: 0 auto;
          padding: 16px;
          border: 1px solid rgba(34,211,238,.4);
          border-radius: 10px;
          background: #0f1e32;
        }
        .qmes-partner-form-shell.is-customer { max-width: 740px; }
        .qmes-partner-form-shell.is-supplier { max-width: 1080px; }
        .qmes-partner-form-title {
          font-size: 17px;
          line-height: 24px;
        }
        .qmes-partner-form-grid {
          display: grid;
          gap: 7px 8px;
          align-items: end;
        }
        .qmes-partner-form-grid.is-customer { grid-template-columns: minmax(0, 1fr) 150px; }
        .qmes-partner-form-grid.is-supplier { grid-template-columns: minmax(0, 1fr) 170px 220px 140px; }
        .qmes-partner-form-field {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 2px;
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 600;
          line-height: 18px;
        }
        .qmes-partner-form-field > span {
          min-height: 18px;
          overflow: visible;
          color: #cbd5e1;
          line-height: 18px;
          white-space: nowrap;
        }
        .qmes-partner-form-field input,
        .qmes-partner-form-field select {
          width: 100% !important;
          min-width: 0 !important;
          height: 34px !important;
          min-height: 34px !important;
          padding: 5px 9px !important;
          box-sizing: border-box !important;
          border: 1px solid #334155 !important;
          border-radius: 6px !important;
          background: #1e293b !important;
          color: #f1f5f9 !important;
          font-size: 13px !important;
          line-height: 22px !important;
          outline: none !important;
        }
        .qmes-partner-form-field input::placeholder { color: #64748b !important; }
        .qmes-partner-form-field input:focus,
        .qmes-partner-form-field select:focus { border-color: #06b6d4 !important; }
        .qmes-partner-form-actions button {
          min-width: 72px;
          min-height: 36px;
          font-size: 13px !important;
        }
        @media (max-width: 850px) {
          .qmes-partner-form-grid.is-supplier { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .qmes-partner-form-grid.is-customer,
          .qmes-partner-form-grid.is-supplier { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">거래처 현황</h2>
          <p className="mt-1 text-sm text-slate-400">고객사와 원료 공급업체를 구분하여 관리합니다.</p>
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

      {showForm && <div className={`qmes-partner-form-shell ${activeType==="customer" ? "is-customer" : "is-supplier"}`}>
        <div className="mb-4"><h3 className="qmes-partner-form-title font-semibold text-cyan-300">{editCode ? "등록 정보 수정" : activeType === "customer" ? "신규 고객사 등록" : "신규 공급업체 등록"}</h3></div>
        {activeType === "customer" ? <div className="qmes-partner-form-grid is-customer">
          <label className="qmes-partner-form-field"><span>고객사명</span><input value={customerForm.name} onChange={(e)=>setCustomerForm({ ...customerForm, name:e.target.value })} placeholder="고객사명"/></label>
          <label className="qmes-partner-form-field"><span>거래상태</span><select value={customerForm.status} onChange={(e)=>setCustomerForm({ ...customerForm, status:e.target.value })}><option>거래중</option><option>거래중지</option></select></label>
        </div> : <div className="qmes-partner-form-grid is-supplier">
          <label className="qmes-partner-form-field"><span>공급업체명</span><input value={supplierForm.company} onChange={(e)=>setSupplierForm({ ...supplierForm, company:e.target.value })} placeholder="공급업체명"/></label>
          <label className="qmes-partner-form-field"><span>원료명</span><input value={supplierForm.material} onChange={(e)=>setSupplierForm({ ...supplierForm, material:e.target.value })} placeholder="원료명"/></label>
          <label className="qmes-partner-form-field"><span>최근 원료 LOT No.</span><input value={supplierForm.lot} onChange={(e)=>setSupplierForm({ ...supplierForm, lot:e.target.value })} placeholder="최근 원료 LOT No." className="font-mono"/></label>
          <label className="qmes-partner-form-field"><span>거래상태</span><select value={supplierForm.status} onChange={(e)=>setSupplierForm({ ...supplierForm, status:e.target.value })}><option>거래중</option><option>거래중지</option></select></label>
        </div>}
        <div className="qmes-partner-form-actions mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={resetForm} className="qmes-inspection-cancel-btn">닫기</button>
          <button type="button" onClick={activeType === "customer" ? saveCustomer : saveSupplier} className="qmes-inspection-save-btn">{editCode ? "수정 저장" : "등록"}</button>
        </div>
      </div>}

      {saveMessage && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{saveMessage}</div>}

      {!showForm && <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-cyan-300">{activeType==="customer"?"고객사 목록":"공급업체 목록"}</h3>
              <button type="button" onClick={()=>openNewFor(activeType)} className="qmes-iqc-new-btn">
                <Plus size={16} /> {activeType === "customer" ? "고객사 등록" : "공급업체 등록"}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">{activeType==="customer"?`등록 고객사 ${filteredCustomers.length}건`:`등록 공급업체 ${filteredSuppliers.length}건 · 원료 LOT 작업지시서 연동`}</p>
          </div>
          {activeType === "supplier" && <div className="flex items-center gap-2">
            <button type="button" onClick={saveSupplierLots} className="rounded-md border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10">LOT 저장 · 작업지시서 반영</button>
          </div>}
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
          {activeType === "customer" ? <>
            <thead className="bg-slate-800 text-slate-300"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3 text-left">고객사 코드</th><th className="px-4 py-3 text-left">고객사명</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">관리</th></tr></thead>
            <tbody>{filteredCustomers.map((item,index)=><tr key={item.code} className="border-t border-slate-800"><td className="px-4 py-3 text-center text-slate-400">{index+1}</td><td className="px-4 py-3 font-mono text-sky-300">{item.code}</td><td className="px-4 py-3 font-semibold text-white">{item.name}</td><td className="px-4 py-3 text-center text-emerald-300">{item.status}</td><td className="px-4 py-3 text-center"><button onClick={()=>openCustomerEdit(item)} className={btnEdit}>수정</button></td></tr>)}</tbody>
          </> : <>
            <thead className="bg-slate-800 text-slate-300"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3 text-left">공급업체 코드</th><th className="px-4 py-3 text-left">공급업체명</th><th className="px-4 py-3 text-left">원료명</th><th className="px-4 py-3 text-left">최근 원료 LOT No.</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">관리</th></tr></thead>
            <tbody>{filteredSuppliers.map((item,index)=><tr key={item.code} className="border-t border-slate-800"><td className="px-4 py-3 text-center text-slate-400">{index+1}</td><td className="px-4 py-3 font-mono text-sky-300">{item.code}</td><td className="px-4 py-3 font-semibold text-white">{item.company}</td><td className="px-4 py-3 text-white">{item.material}</td><td className="px-4 py-2"><input value={item.lot} onChange={(e)=>updateSupplierLot(item.code,e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-cyan-300"/></td><td className="px-4 py-3 text-center text-emerald-300">{item.status}</td><td className="px-4 py-3 text-center"><button onClick={()=>openSupplierEdit(item)} className={btnEdit}>수정</button></td></tr>)}</tbody>
          </>}
        </table></div>
      </div>}
    </div>
  );
}
