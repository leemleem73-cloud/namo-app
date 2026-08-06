/* QMES module: inventory — chemical inventory from IQC receipts and work-order consumption. */
(function installEnterpriseInventory(){
  const norm = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, "");
  const num = (v) => {
    const m = String(v ?? "").replace(/,/g, "").trim().match(/^(-?\d+(?:\.\d+)?)\s*(kg|g|t)?$/i);
    if (!m) return 0;
    const n = Number(m[1]);
    const u = String(m[2] || "kg").toLowerCase();
    return u === "g" ? n / 1000 : u === "t" ? n * 1000 : n;
  };

  const buildRows = () => {
    const masters = Array.isArray(INVENTORY) ? INVENTORY : [];
    const iqcRows = Array.isArray(DB?.iqc) ? DB.iqc : [];
    const woDocs = DB?.woDocs && typeof DB.woDocs === "object" ? Object.values(DB.woDocs) : [];
    const receipt = new Map();
    const usage = new Map();

    iqcRows.forEach((r) => {
      const key = norm(r.name);
      if (!key) return;
      const a = receipt.get(key) || { passed:0, pending:0, lots:new Set(), suppliers:new Set(), last:"", name:r.name, code:r.code };
      const qty = num(r.qty);
      const judge = String(r.judge || "").trim();
      if (judge === "합격") { a.passed += qty; if (r.lot) a.lots.add(String(r.lot).trim()); }
      else if (judge === "검사중" || !judge) a.pending += qty;
      if (r.supplier && r.supplier !== "-") a.suppliers.add(String(r.supplier).trim());
      const date = String(r.recv || r.inspectedAt || "").slice(0,10);
      if (date > a.last) a.last = date;
      receipt.set(key, a);
    });

    woDocs.forEach((wo) => {
      (Array.isArray(wo?.inputs) ? wo.inputs : []).forEach((r) => {
        const key = norm(r.name);
        if (!key || r.act == null || r.act === "") return;
        usage.set(key, (usage.get(key) || 0) + num(`${r.act} ${r.unit || "kg"}`));
      });
    });

    const known = new Set(masters.map((m) => norm(m.name)));
    const extras = [];
    receipt.forEach((a, key) => {
      if (!known.has(key)) extras.push({ code:a.code && a.code !== "-" ? a.code : `IQC-${String(extras.length+1).padStart(3,"0")}`, name:a.name || key, stock:0, safety:0, loc:"미지정", cond:"기준정보 등록 필요" });
    });

    return [...masters, ...extras].map((m) => {
      const key = norm(m.name);
      const r = receipt.get(key);
      const received = r ? r.passed : Number(m.stock || 0);
      const used = usage.get(key) || 0;
      const available = Math.max(0, Number((received - used).toFixed(3)));
      const safety = Number(m.safety || 0);
      const connected = Boolean(r || received > 0 || used > 0);
      const ratio = safety > 0 ? Math.min(100, available / safety * 100) : (available > 0 ? 100 : 0);
      const status = !connected ? "미연동" : available <= 0 ? "부족" : safety > 0 && available < safety * .5 ? "부족" : safety > 0 && available < safety ? "주의" : "정상";
      return { ...m, unit:"kg", received, used, available, pending:r?.pending || 0, safety, lotCount:r?.lots.size || 0, suppliers:r ? [...r.suppliers] : [], last:r?.last || "-", connected, ratio, status };
    });
  };

  window.qmesBuildInventoryRows = buildRows;

  window.InventoryTab = function InventoryTab(){
    const [query,setQuery] = useState("");
    const [status,setStatus] = useState("전체 상태");
    const [location,setLocation] = useState("전체 창고");
    const [rev,setRev] = useState(0);
    const [updated,setUpdated] = useState(new Date());
    useEffect(()=>{
      const refresh=()=>{setRev(v=>v+1);setUpdated(new Date());};
      const timer=setInterval(refresh,5000);
      addEventListener("focus",refresh); addEventListener("storage",refresh); addEventListener("qmes:data-updated",refresh);
      return()=>{clearInterval(timer);removeEventListener("focus",refresh);removeEventListener("storage",refresh);removeEventListener("qmes:data-updated",refresh);};
    },[]);

    const rows=React.useMemo(buildRows,[rev]);
    const locations=["전체 창고",...new Set(rows.map(r=>r.loc).filter(Boolean))];
    const q=query.trim().toLowerCase();
    const list=rows.filter(r=>(!q||[r.code,r.name,r.loc,r.cond,...r.suppliers].some(v=>String(v||"").toLowerCase().includes(q)))&&(status==="전체 상태"||r.status===status)&&(location==="전체 창고"||r.loc===location));
    const totalAvailable=rows.reduce((s,r)=>s+r.available,0), totalPending=rows.reduce((s,r)=>s+r.pending,0), totalUsed=rows.reduce((s,r)=>s+r.used,0);
    const risk=rows.filter(r=>r.status==="주의"||r.status==="부족").length, unlinked=rows.filter(r=>r.status==="미연동").length;
    const badge=(s)=>s==="정상"?<Badge tone="green">사용 가능</Badge>:s==="주의"?<Badge tone="amber">안전재고 주의</Badge>:s==="부족"?<Badge tone="red">재고 부족</Badge>:<Badge tone="slate">데이터 미연동</Badge>;
    const cards=[
      ["전체 자재",rows.length,"품목",Package,"원재료 마스터"],
      ["사용가능 재고",totalAvailable.toLocaleString(undefined,{maximumFractionDigits:3}),"kg",Warehouse,"합격 입고 - 실투입"],
      ["누적 실투입",totalUsed.toLocaleString(undefined,{maximumFractionDigits:3}),"kg",Factory,"작업지시 실적 합계"],
      ["IQC 대기",totalPending.toLocaleString(undefined,{maximumFractionDigits:3}),"kg",ClipboardCheck,"검사 완료 전 사용 불가"],
      ["주의 · 부족",risk,"품목",AlertTriangle,unlinked?`미연동 ${unlinked}품목 포함 별도 확인`:"구매 검토 대상"]
    ];

    return <div className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3"><div><div className="flex items-center gap-2 text-[11px] font-semibold tracking-[.18em] text-sky-400 uppercase"><Warehouse size={14}/> Chemical Inventory Control</div><h2 className="text-xl font-black text-slate-100 mt-1">원재료 재고관리</h2><p className="text-xs text-slate-500 mt-1">IQC 합격 입고에서 작업지시 실투입량을 차감하여 사용가능 재고를 계산합니다.</p></div><div className="text-[11px] text-slate-500 text-right">기준 시각 {updated.toLocaleString("ko-KR")}<div className="mt-1">불합격 입고는 제외되며 작업지시 수정 시 현재 실적 기준으로 재계산됩니다.</div></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">{cards.map(([label,value,unit,Icon,detail])=><div key={label} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"><div className="flex justify-between"><div><div className="text-[11px] font-bold text-slate-400">{label}</div><div className="mt-2"><span className="text-2xl font-black text-slate-100 tabular-nums">{value}</span> <span className="text-[11px] text-slate-500">{unit}</span></div></div><Icon size={18} className="text-sky-300"/></div><div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500">{detail}</div></div>)}</div>
      <Panel title="원재료 · 부자재 재고 현황" right={<span className="text-xs text-slate-400">조회 {list.length} / 전체 {rows.length}품목</span>}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_210px_auto] gap-2 mb-4"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="자재코드, 품명, 공급사, 창고 검색" className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-200"/><select value={status} onChange={e=>setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-200">{["전체 상태","정상","주의","부족","미연동"].map(v=><option key={v}>{v}</option>)}</select><select value={location} onChange={e=>setLocation(e.target.value)} className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-200">{locations.map(v=><option key={v}>{v}</option>)}</select><button onClick={()=>{setRev(v=>v+1);setUpdated(new Date());}} className="h-10 px-4 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200">새로고침</button></div>
        <div className="overflow-x-auto -mx-4 px-4"><table className="w-full text-sm min-w-[1250px]"><thead><tr className="text-[11px] text-slate-400 border-y border-slate-800 bg-slate-950/40"><th className="text-left p-3">자재코드</th><th className="text-left p-3">품명</th><th className="text-right p-3">합격 입고</th><th className="text-right p-3">실투입</th><th className="text-right p-3">사용가능</th><th className="text-right p-3">IQC 대기</th><th className="text-right p-3">안전재고</th><th className="text-left p-3 w-36">재고 수준</th><th className="text-center p-3">LOT</th><th className="text-left p-3">최근 입고</th><th className="text-left p-3">공급사</th><th className="text-left p-3">보관위치</th><th className="text-left p-3">상태</th></tr></thead><tbody>{list.map(r=><tr key={`${r.code}-${r.name}`} className="border-b border-slate-800/70 hover:bg-sky-500/[.035]"><td className="p-3 font-mono text-xs font-bold text-sky-300">{r.code}</td><td className="p-3 font-semibold text-slate-100">{r.name}</td><td className="p-3 text-right tabular-nums text-slate-400">{r.received.toLocaleString(undefined,{maximumFractionDigits:3})}</td><td className="p-3 text-right tabular-nums text-rose-300">{r.used.toLocaleString(undefined,{maximumFractionDigits:3})}</td><td className="p-3 text-right tabular-nums font-bold text-slate-100">{r.available.toLocaleString(undefined,{maximumFractionDigits:3})} <span className="text-[10px] text-slate-500">kg</span></td><td className="p-3 text-right text-slate-400">{r.pending.toLocaleString(undefined,{maximumFractionDigits:3})}</td><td className="p-3 text-right text-slate-400">{r.safety.toLocaleString()}</td><td className="p-3"><div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>안전재고 대비</span><span>{r.connected?`${Math.round(r.ratio)}%`:"-"}</span></div><div className="h-1.5 bg-slate-800 rounded overflow-hidden"><div className={`h-full ${r.status==="정상"?"bg-emerald-400":r.status==="주의"?"bg-amber-400":r.status==="부족"?"bg-rose-400":"bg-slate-700"}`} style={{width:`${r.connected?Math.max(r.ratio,3):0}%`}}/></div></td><td className="p-3 text-center">{r.lotCount||"-"}</td><td className="p-3 text-xs text-slate-400">{r.last}</td><td className="p-3 text-xs text-slate-400">{r.suppliers.length?r.suppliers.join(", "):"-"}</td><td className="p-3 text-xs text-slate-300">{r.loc}</td><td className="p-3">{badge(r.status)}</td></tr>)}{!list.length&&<tr><td colSpan="13" className="py-14 text-center text-slate-500">조건에 맞는 재고가 없습니다.</td></tr>}</tbody></table></div>
        <div className="mt-4 text-[11px] text-slate-500 rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3"><b className="text-slate-300">계산 기준</b><span className="ml-3">사용가능 재고 = IQC 합격 입고량 - 전체 작업지시 현재 실투입량 · IQC 검사중 및 불합격 수량은 사용가능 재고에서 제외</span></div>
      </Panel>
    </div>;
  };
})();
