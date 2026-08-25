/* QMES latest integrated dashboard — live data only, no sample business figures. */
function qmesDashboardNavigate(tab){
  if(!tab) return;
  window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab}}));
}

function QMESDashboardFlowStep({tone='now',title,sub,tab}){
  return <button type="button" className={`qpd-flow-step ${tone}`} onClick={()=>tab&&qmesDashboardNavigate(tab)} disabled={!tab}>
    <strong>{title}</strong><small>{sub}</small>
  </button>;
}

function qmesDashboardText(value){
  return String(value ?? '').trim();
}

function qmesDashboardNumber(value){
  if(typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const match=qmesDashboardText(value).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function qmesDashboardDate(value){
  const raw=qmesDashboardText(value).slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(5);
  return raw || '-';
}

function qmesDashboardWorkOrders(){
  const docs=(typeof DB!=='undefined' && DB && DB.woDocs && typeof DB.woDocs==='object') ? DB.woDocs : {};
  const batches=(typeof DB!=='undefined' && DB && Array.isArray(DB.batches)) ? DB.batches : [];
  const lots=(typeof DB!=='undefined' && DB && DB.lots && typeof DB.lots==='object') ? DB.lots : {};

  return Object.entries(docs).map(([key,docRaw])=>{
    const doc=docRaw || {};
    const lot=qmesDashboardText(doc.lot || doc.lotNo || doc.no || key);
    const batch=batches.find(row=>{
      const batchLot=qmesDashboardText(row?.no || row?.lot || row?.lotNo);
      return batchLot && batchLot===lot;
    }) || {};
    const lotInfo=lots[lot] || {};
    const plan=qmesDashboardNumber(
      doc.plan ?? doc.planQty ?? doc.plannedQty ?? doc.targetQty ?? doc.qty ?? doc.amount ??
      batch.plan ?? batch.plannedQty ?? batch.targetQty ?? batch.qty ?? 0
    );
    const done=qmesDashboardNumber(
      doc.done ?? doc.prodQty ?? doc.productionQty ?? doc.producedQty ??
      batch.done ?? batch.productionQty ?? batch.producedQty ?? 0
    );
    const status=qmesDashboardText(doc.status || batch.status || '발행');
    return {
      lot,
      date:qmesDashboardText(doc.date || doc.productionDate || batch.due || batch.date || batch.productionDate),
      customer:qmesDashboardText(doc.customer || doc.customerName || doc.client || batch.customer || batch.customerName) || '-',
      item:qmesDashboardText(doc.item || doc.product || doc.productName || batch.item || batch.product || lotInfo.itemName || lotInfo.item) || '-',
      plan,
      done,
      status
    };
  }).sort((a,b)=>qmesDashboardText(b.date).localeCompare(qmesDashboardText(a.date)) || b.lot.localeCompare(a.lot));
}

function qmesDashboardStatus(row){
  const status=qmesDashboardText(row?.status);
  if(/완료|생산완료|출하완료/.test(status)) return {label:status || '완료',tone:'green'};
  if(/진행|실적|PQC|검사/.test(status)) return {label:status || '진행중',tone:'blue'};
  if(/부족|차단|불합격|보류/.test(status)) return {label:status || '확인 필요',tone:'red'};
  return {label:status || '발행',tone:'orange'};
}

function DashboardTab(){
  const workOrders=qmesDashboardWorkOrders();
  const totalPlan=workOrders.reduce((sum,row)=>sum+qmesDashboardNumber(row.plan),0);
  const totalDone=workOrders.reduce((sum,row)=>sum+qmesDashboardNumber(row.done),0);
  const completed=workOrders.filter(row=>/완료|생산완료|출하완료/.test(qmesDashboardText(row.status)));
  const completionRate=workOrders.length ? Number(((completed.length/workOrders.length)*100).toFixed(1)) : 0;

  const pqcRows=(typeof DB!=='undefined' && DB && Array.isArray(DB.insp?.PQC)) ? DB.insp.PQC : [];
  const workOrderLots=new Set(workOrders.map(row=>row.lot));
  const pqcPendingLots=new Set(
    pqcRows
      .filter(row=>workOrderLots.has(qmesDashboardText(row?.lot)) && /대기|검사대기|진행/.test(qmesDashboardText(row?.judge || row?.status)))
      .map(row=>qmesDashboardText(row?.lot))
      .filter(Boolean)
  );

  const alerts=[];
  workOrders.forEach(row=>{
    const status=qmesDashboardStatus(row);
    if(status.tone==='red') alerts.push({tone:'red',text:`LOT ${row.lot} ${status.label}`,action:'확인 필요'});
  });
  pqcPendingLots.forEach(lot=>alerts.push({tone:'blue',text:`LOT ${lot} PQC 대기`,action:'검사 확인'}));

  return <div className="qmes-preview-dashboard">
    <style>{`
      .qmes-preview-dashboard{width:100%;max-width:none;min-width:0;min-height:calc(100vh - 118px);margin:0;padding:20px 22px 34px;color:#111827;background:#f5f7fb;border:0;border-radius:0;box-shadow:none;box-sizing:border-box;font-family:Pretendard,'Noto Sans KR',sans-serif}
      .qpd-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.qpd-title-row h1{font-size:25px;letter-spacing:-.5px;margin:0;font-weight:900;line-height:1.25}.qpd-title-row p{color:#64748b;font-size:13px;margin:6px 0 0;line-height:1.5}
      .qpd-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}.qpd-kpi{position:relative;min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 15px;box-shadow:0 6px 18px rgba(15,23,42,.05);overflow:hidden}.qpd-kpi:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#2563eb}.qpd-kpi.orange:before{background:#f59e0b}.qpd-kpi.green:before{background:#16a34a}.qpd-kpi.red:before{background:#ef4444}.qpd-kpi.slate:before{background:#64748b}.qpd-kpi span{font-size:11px;color:#64748b;font-weight:800}.qpd-kpi b{display:block;font-size:24px;margin-top:7px;line-height:1.2}.qpd-kpi small{display:block;margin-top:4px;color:#94a3b8;font-size:10px}
      .qpd-card{min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;box-shadow:0 6px 18px rgba(15,23,42,.05);margin-bottom:14px}.qpd-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.qpd-card-head h2{margin:0;font-size:16px}.qpd-card-head span,.qpd-card-head button{font-size:11px;color:#2563eb;font-weight:850;border:0;background:transparent}
      .qpd-flow{display:flex;align-items:stretch;gap:6px;overflow-x:auto;padding:3px 0 7px}.qpd-flow-step{min-width:102px;flex:1;background:#f8fafc;border:1px solid #dfe7f0;border-radius:10px;padding:11px 8px;text-align:center;color:#111827;cursor:pointer}.qpd-flow-step.now{background:#edf6ff;border-color:#bfdbfe}.qpd-flow-step.add{background:#fff7e6;border-color:#f3d49a}.qpd-flow-step:disabled{cursor:default;opacity:.82}.qpd-flow-step strong{display:block;font-size:12px}.qpd-flow-step small{font-size:9px;color:#64748b;line-height:1.35;display:block;margin-top:5px}.qpd-flow i{display:grid;place-items:center;color:#2563eb;font-weight:950;font-style:normal}
      .qpd-grid2{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,.85fr);gap:14px}.qpd-table-wrap{overflow:auto}.qpd-card table{width:100%;border-collapse:collapse;font-size:12px}.qpd-card th{background:#f8fafc;color:#475569;text-align:left;padding:9px;border-bottom:1px solid #dbe3ec;font-size:11px;white-space:nowrap}.qpd-card td{padding:10px 9px;border-bottom:1px solid #edf2f7;white-space:nowrap}.qpd-status{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:950}.qpd-status.green{background:#dcfce7;color:#15803d}.qpd-status.orange{background:#ffedd5;color:#c2410c}.qpd-status.blue{background:#dbeafe;color:#1d4ed8}.qpd-status.red{background:#fee2e2;color:#b91c1c}
      .qpd-alerts{display:grid;gap:8px}.qpd-alerts>div{display:flex;justify-content:space-between;gap:10px;padding:10px 11px;border-radius:9px;font-size:12px;font-weight:800}.qpd-alerts .red{background:#fff1f2;color:#9f1239}.qpd-alerts .orange{background:#fff7e6;color:#92400e}.qpd-alerts .blue{background:#eff6ff;color:#1e40af}.qpd-alert-empty{padding:14px 10px;color:#64748b;font-size:12px;text-align:center;background:#f8fafc;border-radius:9px}
      @media(max-width:1100px){.qpd-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.qpd-grid2{grid-template-columns:1fr}}@media(max-width:720px){.qmes-preview-dashboard{padding:16px}.qpd-kpis{grid-template-columns:1fr 1fr}.qpd-title-row{display:block}}
    `}</style>
    <div className="qpd-title-row"><div><h1>종합 대시보드</h1><p>QMES 실제 작업지시·생산·품질 현황을 기준으로 표시합니다.</p></div></div>
    <div className="qpd-kpis">
      <div className="qpd-kpi"><span>작업지시</span><b>{workOrders.length.toLocaleString()} 건</b><small>현재 등록된 작업지시</small></div>
      <div className="qpd-kpi orange"><span>생산 계획</span><b>{Number(totalPlan.toFixed(3)).toLocaleString()} kg</b><small>작업지시 계획량 합계</small></div>
      <div className="qpd-kpi"><span>생산 실적</span><b>{Number(totalDone.toFixed(3)).toLocaleString()} kg</b><small>작업지시 생산실적 합계</small></div>
      <div className="qpd-kpi green"><span>생산 완료율</span><b>{completionRate}%</b><small>{completed.length} / {workOrders.length} 건 완료</small></div>
      <div className="qpd-kpi slate"><span>PQC 대기</span><b>{pqcPendingLots.size} LOT</b><small>현재 작업지시 LOT 기준</small></div>
    </div>
    <section className="qpd-card"><div className="qpd-card-head"><h2>QMES 통합 업무 흐름</h2><span>실제 등록 데이터 기준</span></div><div className="qpd-flow">
      <QMESDashboardFlowStep tone="add" title="수주" sub="고객 PO / 납기"/><i>›</i>
      <QMESDashboardFlowStep tone="add" title="생산계획" sub="월·주·일 계획"/><i>›</i>
      <QMESDashboardFlowStep tone="add" title="MRP" sub="소요량 확인"/><i>›</i>
      <QMESDashboardFlowStep tone="add" title="구매/발주" sub="부족원료 확보"/><i>›</i>
      <QMESDashboardFlowStep title="IQC" sub="수입검사" tab="iqc"/><i>›</i>
      <QMESDashboardFlowStep title="원재료 재고" sub="RM / 위치 / LOT" tab="inv"/><i>›</i>
      <QMESDashboardFlowStep title="작업지시" sub="생산 LOT" tab="woIssue"/><i>›</i>
      <QMESDashboardFlowStep title="생산공정" sub="계량/배합/충진" tab="prodProcess"/><i>›</i>
      <QMESDashboardFlowStep title="PQC" sub="공정검사" tab="pqc"/><i>›</i>
      <QMESDashboardFlowStep title="OQC / CoA" sub="출하검사" tab="oqc"/><i>›</i>
      <QMESDashboardFlowStep tone="add" title="출하/납품" sub="납품완료"/>
    </div></section>
    <div className="qpd-grid2">
      <section className="qpd-card"><div className="qpd-card-head"><h2>작업지시 / 진행현황</h2><span>{workOrders.length}건</span></div><div className="qpd-table-wrap"><table><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>
        {workOrders.length===0 ? <tr><td colSpan="6" style={{textAlign:'center',color:'#64748b'}}>등록된 작업지시가 없습니다.</td></tr> : workOrders.map(row=>{
          const status=qmesDashboardStatus(row);
          return <tr key={row.lot}><td>{qmesDashboardDate(row.date)}</td><td>{row.customer}</td><td>{row.item}</td><td>{row.lot}</td><td>{Number(row.plan.toFixed(3)).toLocaleString()} kg</td><td><span className={`qpd-status ${status.tone}`}>{status.label}</span></td></tr>;
        })}
      </tbody></table></div></section>
      <section className="qpd-card"><div className="qpd-card-head"><h2>실행 필요 알림</h2><span>{alerts.length}건</span></div><div className="qpd-alerts">
        {alerts.length ? alerts.map((alert,index)=><div key={`${alert.text}-${index}`} className={alert.tone}><span>{alert.text}</span><b>{alert.action}</b></div>) : <div className="qpd-alert-empty">현재 실행 필요 알림이 없습니다.</div>}
      </div></section>
    </div>
  </div>;
}
