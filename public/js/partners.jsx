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

  const [activeType, setActiveType] = React.useState("customer");
  const [searchText, setSearchText] = React.useState("");
  const [saveMessage, setSaveMessage] = React.useState("");
  const [customers] = React.useState(() => { const saved=Array.isArray(DB?.partnerCustomers)?DB.partnerCustomers:[]; return saved.length?saved:defaultCustomers; });
  const [suppliers,setSuppliers] = React.useState(() => {
    const saved=Array.isArray(DB?.partnerSuppliers)?DB.partnerSuppliers:[];
    if(!saved.length)return defaultSuppliers;
    const merged=defaultSuppliers.map(item=>{const old=saved.find(row=>row.code===item.code);return old?{...item,...old,material:standardMaterialName(old.material||item.material)}:item;});
    saved.filter(row=>!merged.some(item=>item.code===row.code)).forEach(row=>merged.push({...row,material:standardMaterialName(row.material)}));return merged;
  });
  const persist=(nextCustomers=customers,nextSuppliers=suppliers)=>{DB.partnerCustomers=nextCustomers.map(row=>({...row}));DB.partnerSuppliers=nextSuppliers.map(row=>({...row,material:standardMaterialName(row.material)}));DB.rawMaterialLots=nextSuppliers.reduce((acc,row)=>{acc[`${normalizeMaterial(row.material)}|${row.company}`]={material:standardMaterialName(row.material),supplier:row.company,lot:String(row.lot||"").trim(),status:row.status,updatedAt:new Date().toISOString(),by:window.__QMES_USER__||"-"};return acc;},{});dbSave();};
  const syncLotsToWorkOrders=(supplierRows)=>{let linkedCount=0;const latest={};supplierRows.forEach(row=>{const key=normalizeMaterial(row.material);if(String(row.lot||"").trim()&&!latest[key])latest[key]=row;});Object.entries(DB?.woDocs||{}).forEach(([woNo,doc])=>{if(!Array.isArray(doc.inputs))return;let changed=false;const inputs=doc.inputs.map(input=>{const master=latest[normalizeMaterial(input.name)];const currentLot=String(input.materialLot||input.lot||"").trim();if(!master||currentLot)return input;changed=true;linkedCount+=1;return{...input,lot:master.lot,materialLot:master.lot,supplier:master.company,lotSource:"거래처 현황"};});if(changed)DB.woDocs[woNo]={...doc,inputs};});return linkedCount;};
  const switchType=type=>{setActiveType(type);setSearchText("");setSaveMessage("");};
  const saveSupplierLots=()=>{try{persist();const linkedCount=syncLotsToWorkOrders(suppliers);dbSave();setSaveMessage(`원료 LOT 저장 완료 · 빈 작업지시서 원료 LOT ${linkedCount}건 자동 반영`);}catch(error){console.warn(error);setSaveMessage("저장 중 오류가 발생했습니다.");}};
  const updateSupplierLot=(code,lot)=>setSuppliers(prev=>prev.map(row=>row.code===code?{...row,lot}:row));
  const keyword=searchText.trim().toLowerCase();
  const filteredCustomers=customers.filter(item=>[item.code,item.name,item.status].some(v=>String(v||"").toLowerCase().includes(keyword)));
  const filteredSuppliers=suppliers.filter(item=>[item.code,item.company,item.material,item.lot,item.status].some(v=>String(v||"").toLowerCase().includes(keyword))).sort((a,b)=>a.company.localeCompare(b.company,"ko-KR",{numeric:true,sensitivity:"base"}));
  const inputClass="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const btnEdit="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50";
  const activeTab="border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm";
  const idleTab="border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50";

  return <div className="space-y-5 qmes-partners-page rounded-xl bg-slate-50 p-5 text-slate-800">
    <style>{`.qmes-partner-register-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:7px 12px;border:1px solid #0891b2;border-radius:7px;background:#0891b2;color:#fff;font-size:13px;font-weight:800;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(8,145,178,.15)}.qmes-partner-register-btn:hover{background:#0e7490}.qmes-partners-page table tbody tr:hover{background:#f8fafc}`}</style>
    <div><h2 className="text-2xl font-bold text-slate-900">거래처 현황</h2><p className="mt-1 text-sm text-slate-500">고객사와 원료 공급업체를 구분하여 관리합니다.</p></div>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex shrink-0 gap-2"><button type="button" onClick={()=>switchType("customer")} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${activeType==="customer"?activeTab:idleTab}`}>고객사 목록</button><button type="button" onClick={()=>switchType("supplier")} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${activeType==="supplier"?activeTab:idleTab}`}>공급업체 목록</button></div><div className="min-w-0 flex-1"><input type="search" value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder={activeType==="customer"?"고객사명 또는 고객사 코드 검색":"공급업체명 / 원료명 / LOT 검색"} className={inputClass}/></div></div>
    {saveMessage&&<div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveMessage}</div>}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><div className="flex items-center gap-3"><h3 className="font-semibold text-slate-800">{activeType==="customer"?"고객사 목록":"공급업체 목록"}</h3><button type="button" className="qmes-partner-register-btn" data-qmes-partner-register="true"><Plus size={16}/>{activeType==="customer"?"고객사 등록":"공급업체 등록"}</button></div><p className="mt-1 text-xs text-slate-500">{activeType==="customer"?`등록 고객사 ${filteredCustomers.length}건`:`등록 공급업체 ${filteredSuppliers.length}건 · 원료 LOT 작업지시서 연동`}</p></div>{activeType==="supplier"&&<button type="button" onClick={saveSupplierLots} className="rounded-md border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100">LOT 저장 · 작업지시서 반영</button>}</div>
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">{activeType==="customer"?<><thead className="bg-slate-100 text-slate-700"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3 text-left">고객사 코드</th><th className="px-4 py-3 text-left">고객사명</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">관리</th></tr></thead><tbody>{filteredCustomers.map((item,index)=><tr key={item.code} className="border-t border-slate-200 bg-white"><td className="px-4 py-3 text-center text-slate-500">{index+1}</td><td className="px-4 py-3 font-mono text-sky-700">{item.code}</td><td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td><td className="px-4 py-3 text-center font-medium text-emerald-700">{item.status}</td><td className="px-4 py-3 text-center"><button type="button" className={btnEdit}>수정</button></td></tr>)}</tbody></>:<><thead className="bg-slate-100 text-slate-700"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3 text-left">공급업체 코드</th><th className="px-4 py-3 text-left">공급업체명</th><th className="px-4 py-3 text-left">원료명</th><th className="px-4 py-3 text-left">최근 원료 LOT No.</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">관리</th></tr></thead><tbody>{filteredSuppliers.map((item,index)=><tr key={item.code} className="border-t border-slate-200 bg-white"><td className="px-4 py-3 text-center text-slate-500">{index+1}</td><td className="px-4 py-3 font-mono text-sky-700">{item.code}</td><td className="px-4 py-3 font-semibold text-slate-800">{item.company}</td><td className="px-4 py-3 text-slate-700">{item.material}</td><td className="px-4 py-2"><input value={item.lot} onChange={e=>updateSupplierLot(item.code,e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-slate-800 outline-none focus:border-cyan-500"/></td><td className="px-4 py-3 text-center font-medium text-emerald-700">{item.status}</td><td className="px-4 py-3 text-center"><button type="button" className={btnEdit}>수정</button></td></tr>)}</tbody></>}</table></div></div>
  </div>;
}