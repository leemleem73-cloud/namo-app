/* QMES latest integrated dashboard — native DashboardTab, no business top-menu extension. */
function qmesDashboardNavigate(tab){
  if(!tab) return;
  window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab}}));
}

function QMESDashboardFlowStep({tone='now',title,sub,tab}){
  return <button type="button" className={`qpd-flow-step ${tone}`} onClick={()=>tab&&qmesDashboardNavigate(tab)} disabled={!tab}>
    <strong>{title}</strong><small>{sub}</small>
  </button>;
}

function DashboardTab(){
  return <div className="qmes-preview-dashboard">
    <style>{`
      .qmes-preview-dashboard{width:100%;max-width:none;min-width:0;min-height:calc(100vh - 118px);margin:0;padding:20px 22px 34px;color:#111827;background:#f5f7fb;border:0;border-radius:0;box-shadow:none;box-sizing:border-box;font-family:Pretendard,'Noto Sans KR',sans-serif}
      .qpd-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.qpd-title-row h1{font-size:25px;letter-spacing:-.5px;margin:0;font-weight:900;line-height:1.25}.qpd-title-row p{color:#64748b;font-size:13px;margin:6px 0 0;line-height:1.5}
      .qpd-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}.qpd-kpi{position:relative;min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 15px;box-shadow:0 6px 18px rgba(15,23,42,.05);overflow:hidden}.qpd-kpi:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#2563eb}.qpd-kpi.orange:before{background:#f59e0b}.qpd-kpi.green:before{background:#16a34a}.qpd-kpi.red:before{background:#ef4444}.qpd-kpi.slate:before{background:#64748b}.qpd-kpi span{font-size:11px;color:#64748b;font-weight:800}.qpd-kpi b{display:block;font-size:24px;margin-top:7px;line-height:1.2}.qpd-kpi small{display:block;margin-top:4px;color:#94a3b8;font-size:10px}
      .qpd-card{min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;box-shadow:0 6px 18px rgba(15,23,42,.05);margin-bottom:14px}.qpd-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.qpd-card-head h2{margin:0;font-size:16px}.qpd-card-head span,.qpd-card-head button{font-size:11px;color:#2563eb;font-weight:850;border:0;background:transparent}
      .qpd-flow{display:flex;align-items:stretch;gap:6px;overflow-x:auto;padding:3px 0 7px}.qpd-flow-step{min-width:102px;flex:1;background:#f8fafc;border:1px solid #dfe7f0;border-radius:10px;padding:11px 8px;text-align:center;color:#111827;cursor:pointer}.qpd-flow-step.now{background:#edf6ff;border-color:#bfdbfe}.qpd-flow-step.add{background:#fff7e6;border-color:#f3d49a}.qpd-flow-step:disabled{cursor:default;opacity:.82}.qpd-flow-step strong{display:block;font-size:12px}.qpd-flow-step small{font-size:9px;color:#64748b;line-height:1.35;display:block;margin-top:5px}.qpd-flow i{display:grid;place-items:center;color:#2563eb;font-weight:950;font-style:normal}
      .qpd-grid2{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,.85fr);gap:14px}.qpd-table-wrap{overflow:auto}.qpd-card table{width:100%;border-collapse:collapse;font-size:12px}.qpd-card th{background:#f8fafc;color:#475569;text-align:left;padding:9px;border-bottom:1px solid #dbe3ec;font-size:11px;white-space:nowrap}.qpd-card td{padding:10px 9px;border-bottom:1px solid #edf2f7;white-space:nowrap}.qpd-status{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:950}.qpd-status.green{background:#dcfce7;color:#15803d}.qpd-status.orange{background:#ffedd5;color:#c2410c}.qpd-status.blue{background:#dbeafe;color:#1d4ed8}.qpd-status.red{background:#fee2e2;color:#b91c1c}
      .qpd-alerts{display:grid;gap:8px}.qpd-alerts>div{display:flex;justify-content:space-between;gap:10px;padding:10px 11px;border-radius:9px;font-size:12px;font-weight:800}.qpd-alerts .red{background:#fff1f2;color:#9f1239}.qpd-alerts .orange{background:#fff7e6;color:#92400e}.qpd-alerts .blue{background:#eff6ff;color:#1e40af}
      @media(max-width:1100px){.qpd-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.qpd-grid2{grid-template-columns:1fr}}@media(max-width:720px){.qmes-preview-dashboard{padding:16px}.qpd-kpis{grid-template-columns:1fr 1fr}.qpd-title-row{display:block}}
    `}</style>
    <div className="qpd-title-row"><div><h1>종합 대시보드</h1><p>QMES 주요 업무 흐름과 생산·품질·재고 현황을 한 화면에서 확인합니다.</p></div></div>
    <div className="qpd-kpis">
      <div className="qpd-kpi"><span>금월 수주</span><b>12,500 kg</b><small>5건 / 고객사 3개</small></div>
      <div className="qpd-kpi orange"><span>생산 예정</span><b>8,400 kg</b><small>금주 작업지시 6건</small></div>
      <div className="qpd-kpi red"><span>MRP 부족 원료</span><b>3 품목</b><small>NMP · PVDF · 첨가제</small></div>
      <div className="qpd-kpi green"><span>생산 완료율</span><b>92.4%</b><small>계획 대비 실적</small></div>
      <div className="qpd-kpi slate"><span>출하 대기</span><b>2,150 kg</b><small>OQC 합격 기준</small></div>
    </div>
    <section className="qpd-card"><div className="qpd-card-head"><h2>QMES 통합 업무 흐름</h2><span>파랑 = 기존 / 주황 = 업무 흐름 참고</span></div><div className="qpd-flow">
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
      <section className="qpd-card"><div className="qpd-card-head"><h2>금주 생산계획 / 진행현황</h2></div><div className="qpd-table-wrap"><table><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>
        <tr><td>08-24</td><td>현대자동차</td><td>전도 슬러리 A</td><td>240824-01</td><td>2,000 kg</td><td><span className="qpd-status blue">PQC 진행</span></td></tr>
        <tr><td>08-25</td><td>삼성SDI</td><td>Binder Solution</td><td>250825-01</td><td>1,500 kg</td><td><span className="qpd-status orange">원료 준비</span></td></tr>
        <tr><td>08-26</td><td>SK</td><td>전도 슬러리 B</td><td>260826-01</td><td>2,400 kg</td><td><span className="qpd-status green">자재 확보</span></td></tr>
        <tr><td>08-27</td><td>현대자동차</td><td>Binder Solution</td><td>270827-01</td><td>2,500 kg</td><td><span className="qpd-status red">NMP 부족</span></td></tr>
      </tbody></table></div></section>
      <section className="qpd-card"><div className="qpd-card-head"><h2>실행 필요 알림</h2><span>4건</span></div><div className="qpd-alerts"><div className="red"><span>NMP 재고 250kg 부족</span><b>발주 필요</b></div><div className="orange"><span>PVDF 입고예정일 임박</span><b>08/25</b></div><div className="blue"><span>LOT 240824-01 PQC 대기</span><b>검사실</b></div><div className="orange"><span>현대자동차 출하 예정</span><b>08/26</b></div></div></section>
    </div>
  </div>;
}
