/* QMES module: iqc — extracted from index.html without logic changes. */

function IqcTab() {
  const [rows, setRows] = useState(DB.iqc);
  const today = localISODate();

  useEffect(() => {
    let active = true;
    if (typeof qmesSyncPullInspection !== "function") return () => { active = false; };
    qmesSyncPullInspection("iqc", DB.iqc || [])
      .then((next) => {
        if (!active) return;
        DB.iqc = next;
        setRows(next);
      })
      .catch((error) => console.warn("IQC 공용 동기화 실패:", error.message));
    return () => { active = false; };
  }, []);
  const currentMonth = today.slice(0, 7);
  const emptyForm = () => ({
    recvDate: today,
    inspectDate: today,
    inNoMode: "auto",
    manualInNo: "",
    lot: "",
    name: "NMP",
    supplier: "",
    qty: "",
    inspectQty: "",
    defectQty: "0",
    visual: "합격",
    label: "합격",
    weight: "합격",
    coa: "합격",
    inspector: "",
    remarks: ""
  });
  const [form, setForm] = useState(emptyForm);
  const [tried, setTried] = useState(false);
  const [editingInNo, setEditingInNo] = useState(null);
  const [iqcModalOpen, setIqcModalOpen] = useState(false);
  const [viewingIqc, setViewingIqc] = useState(null);
  const [viewingLabel, setViewingLabel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("전체");
  const [selectedSupplier, setSelectedSupplier] = useState("전체");
  const [selectedJudge, setSelectedJudge] = useState("전체");
  const [selectedMaterial, setSelectedMaterial] = useState("전체");
  const [materialOptions, setMaterialOptions] = useState(() => [...new Set([...IQC_MATERIALS, ...(DB.iqcMaterials || [])])]);

  const addMaterialOption = () => {
    const value = window.prompt("추가할 원재료명을 입력하세요.");
    if (value === null) return;
    const name = value.trim();
    if (!name) { window.alert("원재료명을 입력하세요."); return; }
    if (materialOptions.some((m) => m.toLowerCase() === name.toLowerCase())) {
      window.alert("이미 등록된 원재료명입니다.");
      setForm((prev) => ({ ...prev, name: materialOptions.find((m) => m.toLowerCase() === name.toLowerCase()) || prev.name }));
      return;
    }
    const next = [...materialOptions, name];
    setMaterialOptions(next);
    DB.iqcMaterials = [...(DB.iqcMaterials || []), name];
    dbSave();
    setForm((prev) => ({ ...prev, name }));
  };

  const monthRows = rows.filter((r) => String(r.recv || "").slice(0, 7) === currentMonth);
  const todayRows = rows.filter((r) => String(r.recv || "").slice(0, 10) === today);
  const done = monthRows.filter((r) => r.judge !== "검사중");
  const pass = done.filter((r) => r.judge === "합격").length;
  const failed = monthRows.filter((r) => [r.visual, r.label, r.weight, r.coa].includes("불합격"));
  const returned = monthRows.filter((r) => r.judge === "불합격");

  const availableYears = [...new Set([
    "2025",
    String(new Date().getFullYear()),
    ...rows.map((r) => String(r.recv || r.inspectedAt || "").slice(0,4)).filter((y) => /^\d{4}$/.test(y))
  ])].sort((a,b)=>Number(b)-Number(a));

  const yearRows = rows.filter((r) => String(r.recv || r.inspectedAt || "").slice(0,4) === selectedYear);

  const supplierOptions = [...new Set(yearRows.map((r)=>String(r.supplier || "").trim()).filter((v)=>v && v !== "-"))].sort();
  const materialFilterOptions = [...new Set(yearRows.map((r)=>String(r.name || "").trim()).filter(Boolean))].sort();

  const filteredRows = yearRows.filter((r) => {
    const recv = String(r.recv || r.inspectedAt || "");
    const monthMatch = selectedMonth === "전체" || recv.slice(5,7) === selectedMonth;
    const supplierMatch = selectedSupplier === "전체" || String(r.supplier || "") === selectedSupplier;
    const judgeMatch = selectedJudge === "전체" || String(r.judge || "") === selectedJudge;
    const materialMatch = selectedMaterial === "전체" || String(r.name || "") === selectedMaterial;
    const q = searchTerm.trim().toLowerCase();
    const searchMatch = !q || [
      r.inNo, r.recv, r.inspectedAt, r.lot, r.name, r.supplier,
      r.inspector, r.by, r.judge, r.remarks, r.note
    ].some((v)=>String(v || "").toLowerCase().includes(q));
    return monthMatch && supplierMatch && judgeMatch && materialMatch && searchMatch;
  });

  const resetIqcFilters = () => {
    setSearchTerm("");
    setSelectedMonth("전체");
    setSelectedSupplier("전체");
    setSelectedJudge("전체");
    setSelectedMaterial("전체");
  };

  const exportFilteredIqcCsv = () => {
    if (filteredRows.length === 0) {
      window.alert("다운로드할 수입검사 데이터가 없습니다.");
      return;
    }
    const headers = ["입고번호","입고일자","검사일자","LOT No.","원재료명","업체명","입고수량","검사수량","불량수량","외관","라벨","중량","COA","검사자","종합판정","특이사항"];
    const csvRows = filteredRows.map((r)=>[
      r.inNo, r.recv, r.inspectedAt, r.lot, r.name, r.supplier,
      r.qty, r.inspectQty, r.defectQty, r.visual, r.label, r.weight,
      r.coa, r.inspector || r.by, r.judge, r.remarks || r.note || ""
    ]);
    const escapeCsv = (v) => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const csv = "\uFEFF" + [headers, ...csvRows].map((row)=>row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `수입검사관리대장_${selectedYear}년_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const supplierRate = Object.values(yearRows.reduce((acc, r) => {
    const supplier = String(r.supplier || "").trim();
    if (!supplier || supplier === "-") return acc;
    if (!acc[supplier]) acc[supplier] = { name:supplier, total:0, pass:0, rate:0 };
    acc[supplier].total += 1;
    if (r.judge === "합격") acc[supplier].pass += 1;
    acc[supplier].rate = (acc[supplier].pass / acc[supplier].total) * 100;
    return acc;
  }, {}));

  const overall = (f) => {
    const vals = [f.visual, f.label, f.weight, f.coa];
    if (vals.includes("불합격") || vals.includes("불합격")) return "불합격";
    return "합격";
  };

  const generatedInNo = nextInspectionNo("IQC", form.recvDate, rows, "inNo");
  const displayedInNo = editingInNo || (form.inNoMode === "auto" ? generatedInNo : form.manualInNo);
  const inNoOk = editingInNo || (form.inNoMode === "auto"
    ? /^IQC-\d{6}-\d{4}$/.test(generatedInNo)
    : form.manualInNo.trim().length >= 2);
  const duplicateInNo = !editingInNo && rows.some((r) => String(r.inNo || "").toUpperCase() === String(displayedInNo || "").trim().toUpperCase());
  const lotOk = form.lot.trim().length >= 2;
  const qtyPattern = /^\d+(\.\d+)?(?:\s?(kg|g|t|EA|L|매|장|캔))?$/i;
  const qtyOk = qtyPattern.test(form.qty.trim());
  const inspectQtyOk = qtyPattern.test(form.inspectQty.trim());
  const defectQtyOk = qtyPattern.test(form.defectQty.trim());
  const inspectNum = parseFloat(form.inspectQty);
  const defectNum = parseFloat(form.defectQty);
  const defectRangeOk = Number.isFinite(inspectNum) && Number.isFinite(defectNum) ? defectNum <= inspectNum : false;
  const inspectorOk = form.inspector.trim().length >= 1;
  const iqcErrors = [];
  if (tried && !inNoOk) iqcErrors.push(form.inNoMode === "auto" ? "입고번호를 생성할 수 없습니다 — 입고일자를 확인하세요" : "직접 입력할 입고번호를 2자 이상 입력하세요");
  if (tried && duplicateInNo) iqcErrors.push("이미 등록된 입고번호입니다 — 다른 번호를 입력하세요");
  if (form.lot.trim() !== "" && !lotOk) iqcErrors.push("LOT No.가 너무 짧습니다 — 2자 이상 입력");
  if (form.qty.trim() !== "" && !qtyOk) iqcErrors.push("입고수량은 숫자만 입력하세요 (단위 kg 자동 표시)");
  if (form.inspectQty.trim() !== "" && !inspectQtyOk) iqcErrors.push("검사수량은 숫자만 입력하세요 (단위 EA 자동 표시)");
  if (form.defectQty.trim() !== "" && !defectQtyOk) iqcErrors.push("불량수량은 숫자만 입력하세요 (단위 EA 자동 표시)");
  if (inspectQtyOk && defectQtyOk && !defectRangeOk) iqcErrors.push("불량수량은 검사수량보다 클 수 없습니다");
  if (tried && form.lot.trim() === "") iqcErrors.push("LOT No.를 입력하세요");
  if (tried && form.qty.trim() === "") iqcErrors.push("입고수량을 입력하세요");
  if (tried && form.inspectQty.trim() === "") iqcErrors.push("검사수량을 입력하세요");
  if (tried && form.defectQty.trim() === "") iqcErrors.push("불량수량을 입력하세요");
  if (tried && !form.recvDate) iqcErrors.push("입고일자를 선택하세요");
  if (tried && !form.inspectDate) iqcErrors.push("검사일자를 선택하세요");
  if (tried && !inspectorOk) iqcErrors.push("검사자를 입력하세요");
  const iqcReady = Boolean(form.recvDate) && Boolean(form.inspectDate) && inNoOk && !duplicateInNo && lotOk && qtyOk && inspectQtyOk && defectQtyOk && defectRangeOk && inspectorOk;

  const addRow = () => {
    if (!iqcReady) { setTried(true); return; }
    const recv = form.recvDate;
    const inNo = String(displayedInNo).trim();
    const rowData = {
      inNo, recv, inspectedAt: form.inspectDate, lot: form.lot.trim(), code: "-", name: form.name,
      supplier: form.supplier.trim() || "-", qty: qmesQuantityWithUnit(form.qty, "kg"),
      inspectQty: qmesQuantityWithUnit(form.inspectQty, "EA"), defectQty: qmesQuantityWithUnit(form.defectQty, "EA"),
      visual: form.visual, label: form.label, weight: form.weight, coa: form.coa,
      remarks: form.remarks.trim(),
      judge: overall(form),
      note: overall(form) === "불합격" ? "즉시 격리 → 사용차단 → 업체 통보" : "",
      inspector: form.inspector.trim(), by: form.inspector.trim()
    };
    const nr = editingInNo ? rows.map((r) => r.inNo === editingInNo ? rowData : r) : [rowData, ...rows];
    setRows(nr);
    DB.iqc = nr;
    if (overall(form) !== "합격") {
      DB.holds = [{ id: `HLD-${String(Date.now()).slice(-6)}`, target: `${form.lot.trim()} (${inNo})`, type: "원재료 Lot", gate: "IQC 게이트", reason: `수입검사 ${overall(form)} — 판정·승인 완료 전 생산 불출 차단`, since: recv, cond: "격리 후 불합격 처리 확정", status: "차단중", ncr: "-" }, ...DB.holds];
    }
    auditLog("IQC", editingInNo ? "수정" : "등록", rowData.inNo, `${rowData.lot} / ${rowData.judge}`);
    dbSave();
    setEditingInNo(null);
    setForm(emptyForm());
    setTried(false);
    setIqcModalOpen(false);
  };

  const editIqc = (r) => {
    setEditingInNo(r.inNo);
    setForm({
      recvDate:(r.recv || today).slice(0,10), inspectDate:(r.inspectedAt || r.recv || today).slice(0,10), inNoMode:"auto", manualInNo:"",
      lot:r.lot, name:r.name, supplier:r.supplier === "-" ? "" : (r.supplier || ""),
      qty:qmesStripQuantityUnit(r.qty || ""), inspectQty:qmesStripQuantityUnit(r.inspectQty || ""), defectQty:qmesStripQuantityUnit(r.defectQty || "0"),
      visual:r.visual, label:r.label, weight:r.weight, coa:r.coa,
      inspector:r.inspector || r.by || "",
      remarks:r.remarks || ""
    });
    setTried(false);
    setIqcModalOpen(true);
  };
  const deleteIqc = async (r) => {
    const reason = askDeleteReason(`수입검사 ${r.inNo}`);
    if (reason === null) return;
    const next = rows.filter((x) => x.inNo !== r.inNo);
    setRows(next);
    DB.iqc = next;
    auditLog("IQC", "삭제", r.inNo, reason);
    dbSave();
    try {
      if (typeof qmesSyncTombstoneInspection === "function") {
        await qmesSyncTombstoneInspection("iqc", r.inNo, [r], reason);
      }
    } catch (error) {
      window.alert(`이 PC에서는 삭제됐지만 공용 DB 삭제 표시에 실패했습니다.\n${error.message}`);
    }
  };

  const judgeSelect = (key, label) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-500">{label}</span>
      <select
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={`qmes-iqc-judge-select bg-slate-800 border rounded px-2 py-2 text-sm focus:outline-none focus:border-sky-500 ${
          form[key] === "합격"
            ? "qmes-label-result-pass border-emerald-500/40 text-emerald-400"
            : "qmes-label-result-fail border-red-500/40 text-red-400"
        }`}
      >
        <option value="합격">합격</option>
        <option value="불합격">불합격</option>
      </select>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <InspectionSummary
        items={[
          { label: "당월 입고", value: monthRows.length, unit: "건", tone: "violet" },
          { label: "금일 입고", value: todayRows.length, unit: "건", tone: "sky" },
          { label: "합격률", value: done.length ? ((pass / done.length) * 100).toFixed(1) : "—", unit: "%", tone: "green" },
          { label: "부적합", value: failed.length, unit: "건", tone: "red" },
          { label: "반품", value: returned.length, unit: "건", tone: "amber" }
        ]}
      />

      <div className="qmes-iqc-quickbar">
        <div className="qmes-management-heading">
          <span className="qmes-iqc-quickbar-kicker">INCOMING QUALITY CONTROL</span>
          <div className="qmes-management-title-row">
            <strong>수입검사 관리</strong>
            <button type="button" className="qmes-iqc-new-btn" onClick={()=>{ setEditingInNo(null); setForm(emptyForm()); setTried(false); setIqcModalOpen(true); }}>
              <Plus size={16} /> 신규등록
            </button>
          </div>
        </div>
      </div>

      <div className="qmes-iqc-ledger-section">
        <Panel title="수입검사 관리대장" className="qmes-iqc-ledger-panel">
          <div className="qmes-inspection-record-filter qmes-iqc-record-filter">
            <div className="flex flex-col gap-1 w-72">
              <span className="text-[10px] text-slate-500">입고번호 / LOT / 검사자 검색</span>
              <div className="qmes-inspection-search-box">
                <Search size={15} className="qmes-inspection-search-icon" />
                <input
                  value={searchTerm}
                  onChange={(e)=>setSearchTerm(e.target.value)}
                  placeholder="검색어 입력"
                  className="h-9 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                {searchTerm && (
                  <button type="button" onClick={()=>setSearchTerm("")} title="검색어 지우기">
                    <XCircle size={13} />
                  </button>
                )}
              </div>
            </div>
            <div className="qmes-oqc-record-filter-field">
              <span>연도</span>
              <select value={selectedYear} onChange={(e)=>setSelectedYear(e.target.value)}>
                {availableYears.map((year)=><option key={year} value={year}>{year}년</option>)}
              </select>
            </div>
            <div className="qmes-oqc-record-filter-field">
              <span>월</span>
              <select value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)}>
                <option value="전체">전체 월</option>
                {Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0")).map((m)=><option key={m} value={m}>{Number(m)}월</option>)}
              </select>
            </div>
            <button type="button" onClick={resetIqcFilters}
              className="h-9 px-3 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800">
              초기화
            </button>
          </div>
          <div className="qmes-iqc-ledger-container">
            <table className="qmes-iqc-ledger-table qmes-iqc-ledger-compact w-full text-sm">
              <colgroup>
                <col style={{width:"12%"}} /><col style={{width:"17%"}} /><col style={{width:"14%"}} />
                <col style={{width:"15%"}} /><col style={{width:"9%"}} /><col style={{width:"10%"}} /><col style={{width:"23%"}} />
              </colgroup>
              <thead><tr className="text-xs text-slate-400 border-b border-slate-800">
                <th>검사일</th><th>LOT No.</th><th>업체명</th><th>원재료명</th><th>판정</th><th>검사자</th><th className="text-center">관리</th>
              </tr></thead>
              <tbody>
                {filteredRows.length === 0 && <tr><td colSpan={7} className="qmes-iqc-empty-row">검색 조건에 맞는 수입출하검사 검사 기록이 없습니다.</td></tr>}
                {filteredRows.map((r) => (
                  <tr key={r.inNo || r.lot}>
                    <td className="qmes-date-cell">{(r.inspectedAt || r.recv || "-").slice(0,10)}</td>
                    <td className="qmes-lot-cell" title={r.lot}>{r.lot || "-"}</td>
                    <td title={r.supplier}>{r.supplier || "-"}</td>
                    <td title={r.name}>{r.name || "-"}</td>
                    <td><Badge tone={iqcTone(r.judge)}>{r.judge}</Badge></td>
                    <td>{r.inspector || r.by || "-"}</td>
                    <td className="qmes-iqc-manage-cell">
                      <div className="qmes-iqc-manage-inline">
                        <button onClick={()=>setViewingIqc(r)} title="성적서 미리보기 및 출력" className="qmes-iqc-action-btn qmes-iqc-action-print"><Printer size={12} /> 출력</button>
                        <button onClick={()=>setViewingLabel(r)} title="라벨" className="qmes-iqc-action-btn qmes-iqc-action-label">라벨</button>
                        <button onClick={()=>editIqc(r)} title="수정" className="qmes-iqc-action-btn qmes-iqc-action-edit">수정</button>
                        <button onClick={()=>deleteIqc(r)} title="삭제" className="qmes-iqc-action-btn qmes-iqc-action-delete">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        
      </div>
      <div className="qmes-iqc-chart-only">
        <div className="qmes-iqc-chart-panel qmes-iqc-rank-panel"><Panel title={`업체별 IQC 합격률 (${selectedYear}년)`}>
          <div className="qmes-iqc-rank-head">
            <div>
              <span className="qmes-iqc-rank-kicker">SUPPLIER QUALITY</span>
              <strong>업체별 품질 순위</strong>
            </div>
            <div className="qmes-iqc-rank-standard"><span></span>관리기준 98%</div>
          </div>

          <div className="qmes-iqc-donut-list">
            {supplierRate.length === 0 && (
              <div className="qmes-iqc-rank-empty">
                <Package size={22} />
                <strong>{selectedYear}년 업체별 검사 데이터가 없습니다.</strong>
                <span>수입검사 관리대장에 업체명이 포함된 기록을 등록하면 자동 집계됩니다.</span>
              </div>
            )}
            {[...supplierRate].sort((a,b)=>b.rate-a.rate || b.total-a.total).map((item,index)=>{
              const rate = Math.max(0,Math.min(100,Number(item.rate) || 0));
              const below = rate < 98;
              const ringColor = below ? "#f59e0b" : "#10b981";
              return (
                <div key={item.name} className={`qmes-iqc-donut-card ${below ? "is-warning" : "is-good"}`}>
                  <div className="qmes-iqc-donut-rank">{index+1}</div>
                  <div className="qmes-iqc-donut-ring" style={{background:`conic-gradient(${ringColor} ${rate}%, #20344c ${rate}% 100%)`}}>
                    <div className="qmes-iqc-donut-center">
                      <strong>{rate.toFixed(1)}</strong><span>%</span>
                    </div>
                  </div>
                  <strong className="qmes-iqc-donut-name" title={item.name}>{item.name}</strong>
                  <span className="qmes-iqc-donut-count">합격 {item.pass} / 전체 {item.total}</span>
                  <span className={`qmes-iqc-rank-grade ${below ? "warn" : "good"}`}>{below ? "관리대상" : "정상"}</span>
                </div>
              );
            })}
          </div>

          <div className="qmes-iqc-rank-footer">
            <AlertTriangle size={13} />
            <span>98% 미만 업체는 CAR 발행 및 수입검사 강화 대상입니다.</span>
          </div>
        </Panel></div>
      </div>


      {iqcModalOpen && (
        <div className="qmes-modal-backdrop qmes-iqc-modal-backdrop" onMouseDown={(e)=>{ if(e.target===e.currentTarget){ setIqcModalOpen(false); setEditingInNo(null); setTried(false); } }}>
          <div className="qmes-iqc-modal" role="dialog" aria-modal="true" aria-label="수입검사 등록">
            <div className="qmes-iqc-modal-head">
              <div><span>INCOMING INSPECTION</span><strong>{editingInNo ? "수입검사 수정" : "수입검사 신규등록"}</strong></div>
              <button type="button" className="qmes-modal-close" onClick={()=>{setIqcModalOpen(false);setEditingInNo(null);setTried(false);}}>×</button>
            </div>
            <div className="qmes-iqc-modal-body">
              <div className="qmes-iqc-modal-section">
                <h4>기본정보</h4>
                <div className="qmes-iqc-modal-grid">
                  <div className="qmes-iqc-field"><span>입고번호</span><div className="qmes-iqc-inno-row"><select value={form.inNoMode} disabled={Boolean(editingInNo)} onChange={(e)=>setForm({...form,inNoMode:e.target.value,manualInNo:""})}><option value="auto">자동</option><option value="manual">직접</option></select><input value={displayedInNo} readOnly={Boolean(editingInNo)||form.inNoMode==="auto"} onChange={(e)=>setForm({...form,manualInNo:e.target.value})}/></div></div>
                  <div className="qmes-iqc-field"><span>입고일자</span><input type="date" value={form.recvDate} onChange={(e)=>setForm({...form,recvDate:e.target.value})}/></div>
                  <div className="qmes-iqc-field"><span>검사일자</span><input type="date" value={form.inspectDate} onChange={(e)=>setForm({...form,inspectDate:e.target.value})}/></div>
                  <div className="qmes-iqc-field"><span>LOT No.</span><input value={form.lot} onChange={(e)=>setForm({...form,lot:e.target.value})} placeholder="LOT No. 입력"/></div>
                  <div className="qmes-iqc-field"><span>원재료명</span><div className="qmes-material-select-wrap"><select value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}>{materialOptions.map((m)=><option key={m}>{m}</option>)}</select><button type="button" onClick={addMaterialOption} className="qmes-material-add">+ 추가</button></div></div>
                  <div className="qmes-iqc-field"><span>업체명</span><input value={form.supplier} onChange={(e)=>setForm({...form,supplier:e.target.value})} placeholder="업체명 입력"/></div>
                </div>
              </div>
              <div className="qmes-iqc-modal-section">
                <h4>수량</h4>
                <div className="qmes-iqc-modal-grid qmes-iqc-modal-grid-qty">
                  <div className="qmes-iqc-field"><span>입고수량</span><input inputMode="decimal" value={form.qty} onFocus={(e)=>setForm({...form,qty:qmesStripQuantityUnit(e.target.value)})} onChange={(e)=>setForm({...form,qty:e.target.value.replace(/[^0-9.]/g,"")})} onBlur={(e)=>setForm((prev)=>({...prev,qty:qmesQuantityWithUnit(e.target.value,"kg")}))} placeholder="kg"/></div>
                  <div className="qmes-iqc-field"><span>검사수량</span><input inputMode="decimal" value={form.inspectQty} onFocus={(e)=>setForm({...form,inspectQty:qmesStripQuantityUnit(e.target.value)})} onChange={(e)=>setForm({...form,inspectQty:e.target.value.replace(/[^0-9.]/g,"")})} onBlur={(e)=>setForm((prev)=>({...prev,inspectQty:qmesQuantityWithUnit(e.target.value,"EA")}))} placeholder="EA"/></div>
                  <div className="qmes-iqc-field"><span>불량수량</span><input inputMode="decimal" value={form.defectQty} onFocus={(e)=>setForm({...form,defectQty:qmesStripQuantityUnit(e.target.value)})} onChange={(e)=>setForm({...form,defectQty:e.target.value.replace(/[^0-9.]/g,"")})} onBlur={(e)=>setForm((prev)=>({...prev,defectQty:qmesQuantityWithUnit(e.target.value,"EA")}))} placeholder="EA"/></div>
                </div>
              </div>
              <div className="qmes-iqc-modal-section">
                <h4>검사정보</h4>
                <div className="qmes-iqc-modal-grid qmes-iqc-modal-grid-inspection">
                  <div className="qmes-iqc-field">{judgeSelect("visual","외관")}</div>
                  <div className="qmes-iqc-field">{judgeSelect("label","라벨")}</div>
                  <div className="qmes-iqc-field">{judgeSelect("weight","중량")}</div>
                  <div className="qmes-iqc-field">{judgeSelect("coa","COA")}</div>
                  <div className="qmes-iqc-field"><span>검사자</span><input value={form.inspector} onChange={(e)=>setForm({...form,inspector:e.target.value})} placeholder="검사자 입력"/></div>
                </div>
              </div>
              <div className="qmes-iqc-modal-section">
                <h4>특이사항</h4>
                <div className="qmes-iqc-modal-grid">
                  <div className="qmes-iqc-field qmes-iqc-modal-remarks-full"><textarea value={form.remarks} onChange={(e)=>setForm({...form,remarks:e.target.value})} rows={3} placeholder="특이사항 입력"/></div>
                </div>
              </div>
              {iqcErrors.length>0 && <div className="qmes-iqc-modal-errors">{iqcErrors.map((e,i)=><div key={i}>• {e}</div>)}</div>}
            </div>
            <div className="qmes-iqc-modal-foot">
              <div>종합판정 <Badge tone={iqcTone(overall(form))}>{overall(form)}</Badge></div>
              <div><button type="button" className="qmes-iqc-modal-cancel" onClick={()=>{setIqcModalOpen(false);setEditingInNo(null);setTried(false);}}>취소</button><button type="button" className="qmes-iqc-modal-save" onClick={addRow}>{editingInNo ? "수정 저장" : "저장"}</button></div>
            </div>
          </div>
        </div>
      )}
      {viewingIqc && <QualityInspectionViewer type="IQC" record={viewingIqc} records={rows} onClose={()=>setViewingIqc(null)} />}
      {viewingLabel && <IqcLabelViewer record={viewingLabel} onClose={()=>setViewingLabel(null)} />}
    </div>
  );
}

/* ────────────────────────────  탭 ──────────────────────────── */

