/* QMES dashboard live KPI/OQC linkage - 2026-08-12
 * Keeps the original dashboard module intact and patches only displayed KPI data.
 * - cumulative production: finished LOT / completed batch fallback
 * - customer shipment: unique OQC certificate groups, so one 8-row OQC report counts once
 */
(function installDashboardKpiOqcLivePatch(){
  "use strict";
  if (window.__QMES_DASHBOARD_KPI_OQC_LIVE_20260812__) return;
  window.__QMES_DASHBOARD_KPI_OQC_LIVE_20260812__ = true;
  if (typeof DashboardTab !== "function") return;

  const LegacyDashboardTab = DashboardTab;
  const clean = (v) => String(v ?? "").trim();
  const num = (v) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const m = clean(v).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : 0;
  };
  const groupKey = (row) => clean(row?.groupId) || [clean(row?.lot), clean(row?.date || row?.shipDate)].filter(Boolean).join("|") || clean(row?.id).replace(/-\d+$/, "");

  function productionSummary(){
    const lots = Object.entries(DB.lots || {}).map(([key,row]) => ({ key, row:row || {} }));
    const lotRows = lots.map(({key,row}) => {
      const qty = num(row.productionQty ?? row.producedQty ?? row.initialQty ?? row.qty ?? row.amount ?? row.currentQty ?? row.stock);
      return { key:clean(row.lot || row.lotNo || row.no || key), qty };
    }).filter(x => x.key && x.qty > 0);

    if (lotRows.length) {
      const seen = new Map();
      lotRows.forEach(x => { if (!seen.has(x.key)) seen.set(x.key, x.qty); });
      return { kg:Array.from(seen.values()).reduce((a,b)=>a+b,0), lots:seen.size };
    }

    const batches = Array.isArray(DB.batches) ? DB.batches : [];
    const completed = batches.filter(b => /완료|생산완료|출하완료/.test(clean(b.status)) || num(b.done) > 0);
    return {
      kg:completed.reduce((s,b)=>s+num(b.done ?? b.qty ?? b.amount ?? b.productionQty ?? b.plan),0),
      lots:new Set(completed.map(b=>clean(b.no || b.lot || b.lotNo)).filter(Boolean)).size
    };
  }

  function cumulativePlan(){
    return (Array.isArray(DB.batches) ? DB.batches : []).reduce((s,b)=>s+num(b.plan ?? b.plannedQty ?? b.targetQty),0);
  }

  function customerShipments(){
    const rows = Array.isArray(DB.insp?.OQC) ? DB.insp.OQC : [];
    const groups = new Map();
    rows.forEach(row => {
      const key = groupKey(row);
      if (!key) return;
      const current = groups.get(key) || {};
      groups.set(key, {
        ...current,
        ...row,
        customer:clean(row.customer) || clean(current.customer),
        shipQty:num(row.shipQty ?? current.shipQty),
        judge:clean(row.judge) || clean(current.judge)
      });
    });
    const map = {};
    groups.forEach(row => {
      const customer = clean(row.customer);
      const qty = num(row.shipQty);
      if (!customer || qty <= 0) return;
      if (row.judge && row.judge !== "합격") return;
      map[customer] = (map[customer] || 0) + qty;
    });
    return Object.entries(map).map(([customer,qty])=>({customer,qty})).sort((a,b)=>b.qty-a.qty).slice(0,8);
  }

  function patchTree(node, summary, planKg, customers){
    if (!React.isValidElement(node)) return node;
    let props = node.props || {};
    let replacement = null;

    if (typeof Kpi !== "undefined" && node.type === Kpi) {
      if (props.label === "당월 누적 생산량") {
        replacement = {
          ...props,
          label:"누적 생산량",
          value:Number(summary.kg.toFixed(3)).toLocaleString(),
          unit:`kg · ${summary.lots} LOT`,
          caption:"완제품 LOT 기준 누적 생산 실적"
        };
      } else if (props.label === "목표 달성률") {
        const rate = planKg > 0 ? Number(((summary.kg / planKg) * 100).toFixed(1)) : null;
        replacement = {
          ...props,
          progressValue:rate == null ? 0 : rate,
          value:rate == null ? "—" : String(rate),
          caption:planKg > 0 ? `누적 계획 ${planKg.toLocaleString()} kg 대비` : "생산계획 등록 필요"
        };
      }
    }

    if (typeof Panel !== "undefined" && node.type === Panel && clean(props.title).startsWith("고객사별 당월 출하량")) {
      const body = customers.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={customers} layout="vertical" margin={{left:8,right:18}}>
            <CartesianGrid stroke="#16283E" strokeDasharray="3 3" horizontal={false}/>
            <XAxis type="number" stroke="#8AA3C0" fontSize={11}/>
            <YAxis type="category" dataKey="customer" stroke="#8AA3C0" fontSize={11} width={92}/>
            <Tooltip {...chartTooltip} formatter={value=>[`${Number(value).toLocaleString()} kg`,"출하량"]}/>
            <Bar dataKey="qty" name="출하량(kg)" fill="#33C1E8" radius={[0,4,4,0]} barSize={18}/>
          </BarChart>
        </ResponsiveContainer>
      ) : <div className="qmes-dashboard-empty">등록된 고객사별 출하 실적이 없습니다.</div>;
      replacement = {
        ...props,
        title:"고객사별 누적 출하량 (OQC 합격 kg)",
        right:<span className="text-xs text-slate-400">출하검사 성적서 자동 연동</span>,
        children:body
      };
    }

    const baseProps = replacement || props;
    if (replacement && Object.prototype.hasOwnProperty.call(replacement,"children")) {
      return React.cloneElement(node, replacement);
    }
    const children = React.Children.map(baseProps.children, child => patchTree(child, summary, planKg, customers));
    return React.cloneElement(node, replacement || {}, children);
  }

  DashboardTab = function DashboardTabWithLiveKpiOqc(){
    const summary = productionSummary();
    const planKg = cumulativePlan();
    const customers = customerShipments();
    return patchTree(LegacyDashboardTab(), summary, planKg, customers);
  };
})();
