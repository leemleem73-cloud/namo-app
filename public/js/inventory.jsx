/* QMES module: inventory — enterprise chemical inventory with IQC aggregation. */
(function installEnterpriseInventory(){
  const normalizeName = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");

  const quantityToKg = (value) => {
    const text = String(value ?? "").replace(/,/g, "").trim();
    const match = text.match(/^(-?\d+(?:\.\d+)?)\s*(kg|g|t)?$/i);
    if (!match) return 0;
    const amount = Number(match[1]);
    const unit = String(match[2] || "kg").toLowerCase();
    if (!Number.isFinite(amount)) return 0;
    if (unit === "g") return amount / 1000;
    if (unit === "t") return amount * 1000;
    return amount;
  };

  const buildInventoryRows = () => {
    const masters = Array.isArray(INVENTORY) ? INVENTORY : [];
    const iqcRows = Array.isArray(DB?.iqc) ? DB.iqc : [];
    const aggregate = new Map();

    iqcRows.forEach((row) => {
      const key = normalizeName(row.name);
      if (!key) return;
      const qtyKg = quantityToKg(row.qty);
      const judge = String(row.judge || "").trim();
      const current = aggregate.get(key) || {
        passedKg: 0,
        pendingKg: 0,
        lots: new Set(),
        suppliers: new Set(),
        lastReceivedAt: "",
      };

      if (judge === "합격") {
        current.passedKg += qtyKg;
        if (row.lot) current.lots.add(String(row.lot).trim());
      } else if (judge === "검사중" || !judge) {
        current.pendingKg += qtyKg;
      }

      if (row.supplier && row.supplier !== "-") current.suppliers.add(String(row.supplier).trim());
      const recv = String(row.recv || row.inspectedAt || "").slice(0, 10);
      if (recv && recv > current.lastReceivedAt) current.lastReceivedAt = recv;
      aggregate.set(key, current);
    });

    const masterKeys = new Set(masters.map((item) => normalizeName(item.name)));
    const extraMaterials = [];
    aggregate.forEach((value, key) => {
      if (masterKeys.has(key)) return;
      const source = iqcRows.find((row) => normalizeName(row.name) === key);
      extraMaterials.push({
        code: source?.code && source.code !== "-" ? source.code : `IQC-${String(extraMaterials.length + 1).padStart(3, "0")}`,
        name: source?.name || key,
        stock: 0,
        safety: 0,
        unit: "kg",
        loc: "미지정",
        cond: "기준정보 등록 필요",
      });
    });

    return [...masters, ...extraMaterials].map((item) => {
      const iqc = aggregate.get(normalizeName(item.name));
      const available = iqc ? iqc.passedKg : Number(item.stock || 0);
      const inspectionPending = iqc ? iqc.pendingKg : 0;
      const safety = Number(item.safety || 0);
      const connected = Boolean(iqc || Number(item.stock || 0) > 0);
      const ratio = safety > 0 ? Math.min((available / safety) * 100, 100) : (available > 0 ? 100 : 0);
      const status = !connected
        ? "미연동"
        : available <= 0
          ? "부족"
          : safety <= 0
            ? "정상"
            : available < safety * 0.5
              ? "부족"
              : available < safety
                ? "주의"
                : "정상";
      return {
        ...item,
        unit: "kg",
        available,
        inspectionPending,
        safety,
        lotCount: iqc ? iqc.lots.size : Number(item.lotCount || 0),
        suppliers: iqc ? Array.from(iqc.suppliers) : [],
        lastReceivedAt: iqc?.lastReceivedAt || item.lastReceivedAt || "-",
        connected,
        ratio,
        status,
      };
    });
  };

  window.InventoryTab = function InventoryTab() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("전체 상태");
    const [locationFilter, setLocationFilter] = useState("전체 창고");
    const [revision, setRevision] = useState(0);
    const [refreshedAt, setRefreshedAt] = useState(() => new Date());

    useEffect(() => {
      const refresh = () => {
        setRevision((value) => value + 1);
        setRefreshedAt(new Date());
      };
      const timer = window.setInterval(refresh, 5000);
      window.addEventListener("focus", refresh);
      window.addEventListener("storage", refresh);
      window.addEventListener("qmes:data-updated", refresh);
      return () => {
        window.clearInterval(timer);
        window.removeEventListener("focus", refresh);
        window.removeEventListener("storage", refresh);
        window.removeEventListener("qmes:data-updated", refresh);
      };
    }, []);

    const materials = React.useMemo(buildInventoryRows, [revision]);
    const locations = ["전체 창고", ...Array.from(new Set(materials.map((item) => item.loc).filter(Boolean)))];
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = materials.filter((item) => {
      const searchable = [item.code, item.name, item.loc, item.cond, ...(item.suppliers || [])];
      const matchesQuery = !normalizedQuery || searchable.some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
      return matchesQuery
        && (statusFilter === "전체 상태" || item.status === statusFilter)
        && (locationFilter === "전체 창고" || item.loc === locationFilter);
    });

    const normalCount = materials.filter((item) => item.status === "정상").length;
    const warningCount = materials.filter((item) => item.status === "주의").length;
    const shortageCount = materials.filter((item) => item.status === "부족").length;
    const unlinkedCount = materials.filter((item) => item.status === "미연동").length;
    const totalAvailable = materials.reduce((sum, item) => sum + item.available, 0);
    const totalPending = materials.reduce((sum, item) => sum + item.inspectionPending, 0);

    const kpis = [
      { label:"전체 자재", value:materials.length, unit:"품목", icon:Package, tone:"sky", detail:"원재료 · 첨가제 마스터" },
      { label:"사용가능 재고", value:totalAvailable.toLocaleString(undefined,{maximumFractionDigits:3}), unit:"kg", icon:Warehouse, tone:"emerald", detail:"IQC 합격 입고 합계" },
      { label:"IQC 대기", value:totalPending.toLocaleString(undefined,{maximumFractionDigits:3}), unit:"kg", icon:ClipboardCheck, tone:"sky", detail:"검사 완료 전 사용 불가" },
      { label:"주의 · 부족", value:warningCount + shortageCount, unit:"품목", icon:AlertTriangle, tone:"amber", detail:"구매 검토 대상" },
      { label:"데이터 미연동", value:unlinkedCount, unit:"품목", icon:CircleDot, tone:"slate", detail:"IQC 입고 실적 없음" },
    ];
    const toneClasses = {
      sky:"border-sky-500/25 bg-sky-500/[0.06] text-sky-300",
      emerald:"border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300",
      amber:"border-amber-500/25 bg-amber-500/[0.06] text-amber-300",
      slate:"border-slate-600/70 bg-slate-800/50 text-slate-300",
    };
    const statusBadge = (status) => {
      if (status === "정상") return <Badge tone="green">사용 가능</Badge>;
      if (status === "주의") return <Badge tone="amber">안전재고 주의</Badge>;
      if (status === "부족") return <Badge tone="red">재고 부족</Badge>;
      return <Badge tone="slate">데이터 미연동</Badge>;
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-sky-400 uppercase"><Warehouse size={14}/> Chemical Inventory Control</div>
            <h2 className="text-xl font-black text-slate-100 mt-1">원재료 재고관리</h2>
            <p className="text-xs text-slate-500 mt-1">IQC 판정에 따라 사용가능 재고와 검사대기 재고를 자동 집계합니다.</p>
          </div>
          <div className="text-[11px] text-slate-500 text-right">
            <div>기준 시각 {refreshedAt.toLocaleString("ko-KR")}</div>
            <div className="mt-0.5">현재 사용가능 재고는 IQC 합격 입고 기준이며 작업지시 투입 차감은 다음 연계 단계입니다.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {kpis.map((item) => { const Icon=item.icon; return <div key={item.label} className={`rounded-xl border p-4 ${toneClasses[item.tone]}`}><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold text-slate-400">{item.label}</div><div className="mt-2 flex items-end gap-1.5"><span className="text-2xl font-black text-slate-100 tabular-nums">{item.value}</span><span className="text-[11px] text-slate-500 mb-1">{item.unit}</span></div></div><div className="w-9 h-9 rounded-lg border border-current/20 flex items-center justify-center bg-black/10"><Icon size={17}/></div></div><div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500">{item.detail}</div></div>; })}
        </div>

        {(warningCount + shortageCount) > 0 && <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3"><AlertTriangle size={17} className="text-amber-400 mt-0.5 shrink-0"/><div><div className="text-sm font-bold text-amber-200">안전재고 검토 대상 {warningCount + shortageCount}품목</div><div className="text-xs text-amber-200/60 mt-1">IQC 합격 입고 기준입니다. 작업지시 실투입 차감 연계 후 최종 발주 판단에 사용하세요.</div></div></div>}

        <Panel title="원재료 · 부자재 재고 현황" right={<span className="text-xs text-slate-400">조회 {filtered.length} / 전체 {materials.length}품목</span>}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_190px_220px_auto] gap-2 mb-4">
            <label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="자재코드, 품명, 공급사, 창고 검색" className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950/60 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-sky-500"/></label>
            <label className="relative block"><Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/><select value={statusFilter} onChange={(event)=>setStatusFilter(event.target.value)} className="w-full h-10 appearance-none rounded-lg border border-slate-700 bg-slate-950/60 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-sky-500">{["전체 상태","정상","주의","부족","미연동"].map((value)=><option key={value}>{value}</option>)}</select></label>
            <select value={locationFilter} onChange={(event)=>setLocationFilter(event.target.value)} className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-xs text-slate-200 outline-none focus:border-sky-500">{locations.map((value)=><option key={value}>{value}</option>)}</select>
            <button type="button" onClick={()=>{setRevision((value)=>value+1);setRefreshedAt(new Date());}} className="h-10 px-4 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-xs font-bold text-slate-200 inline-flex items-center justify-center gap-2"><RotateCw size={14}/> 새로고침</button>
          </div>

          <div className="overflow-x-auto -mx-4 px-4"><table className="w-full text-sm min-w-[1220px]"><thead><tr className="text-[11px] text-slate-400 border-y border-slate-800 bg-slate-950/40"><th className="text-left py-3 px-3 font-semibold">자재코드</th><th className="text-left py-3 px-3 font-semibold">품명</th><th className="text-right py-3 px-3 font-semibold">사용가능 재고</th><th className="text-right py-3 px-3 font-semibold">IQC 대기</th><th className="text-right py-3 px-3 font-semibold">안전재고</th><th className="text-left py-3 px-3 font-semibold w-40">재고 수준</th><th className="text-center py-3 px-3 font-semibold">LOT</th><th className="text-left py-3 px-3 font-semibold">최근 입고</th><th className="text-left py-3 px-3 font-semibold">공급사</th><th className="text-left py-3 px-3 font-semibold">보관위치</th><th className="text-left py-3 px-3 font-semibold">보관조건</th><th className="text-left py-3 px-3 font-semibold">상태</th></tr></thead><tbody>
            {filtered.map((item)=><tr key={`${item.code}-${item.name}`} className="border-b border-slate-800/70 hover:bg-sky-500/[0.035] transition-colors"><td className="py-3 px-3 font-mono text-xs font-bold text-sky-300">{item.code}</td><td className="py-3 px-3"><div className="font-semibold text-slate-100">{item.name}</div><div className="text-[10px] text-slate-600 mt-1">원재료 마스터</div></td><td className="py-3 px-3 text-right tabular-nums"><div className="font-bold text-slate-100">{item.available.toLocaleString(undefined,{maximumFractionDigits:3})} <span className="text-[10px] text-slate-500">kg</span></div>{!item.connected&&<div className="text-[10px] text-slate-600 mt-1">실적 연동 전</div>}</td><td className="py-3 px-3 text-right tabular-nums text-slate-400">{item.inspectionPending.toLocaleString(undefined,{maximumFractionDigits:3})} <span className="text-[10px] text-slate-600">kg</span></td><td className="py-3 px-3 text-right tabular-nums text-slate-300">{item.safety.toLocaleString()} <span className="text-[10px] text-slate-600">kg</span></td><td className="py-3 px-3"><div className="flex items-center justify-between text-[10px] mb-1.5"><span className="text-slate-500">안전재고 대비</span><span className="text-slate-400">{item.connected?`${Math.round(item.ratio)}%`:"-"}</span></div><div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${item.status==="정상"?"bg-emerald-400":item.status==="주의"?"bg-amber-400":item.status==="부족"?"bg-rose-400":"bg-slate-700"}`} style={{width:`${item.connected?Math.max(item.ratio,3):0}%`}}/></div></td><td className="py-3 px-3 text-center tabular-nums text-slate-300">{item.lotCount||"-"}</td><td className="py-3 px-3 text-xs text-slate-400">{item.lastReceivedAt}</td><td className="py-3 px-3 text-xs text-slate-400">{item.suppliers?.length?item.suppliers.join(", "):"-"}</td><td className="py-3 px-3 text-xs text-slate-300">{item.loc}</td><td className="py-3 px-3 text-xs text-slate-400">{item.cond}</td><td className="py-3 px-3">{statusBadge(item.status)}</td></tr>)}
            {filtered.length===0&&<tr><td colSpan="12" className="py-14 text-center"><Boxes size={28} className="mx-auto text-slate-700"/><div className="text-sm font-semibold text-slate-400 mt-3">조건에 맞는 재고가 없습니다.</div><div className="text-xs text-slate-600 mt-1">검색어 또는 필터 조건을 변경해 주세요.</div></td></tr>}
          </tbody></table></div>

          <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3 text-[11px]"><div className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3 text-slate-500"><span className="font-bold text-slate-300">재고 계산 기준</span><span className="ml-3">사용가능: IQC 합격 입고 합계 · IQC 대기: 검사중 입고 합계 · 불합격: 재고 제외</span></div><div className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3 text-slate-500"><span className="font-bold text-slate-300">케미칼 보관 기준</span><span className="ml-3">창고 25±5℃ · 습도 50% 이하 · 드라이룸 RH 0.54% 이하 / DP -40℃ · FIFO 관리</span></div></div>
        </Panel>
      </div>
    );
  };
})();
