/* Preview-style integrated QMES dashboard. UI is connected to existing navigation; summary values are presentation placeholders until API integration. */
function QMESPreviewDashboard(){
  const go=tab=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab}}));
  const Step=({tone='now',title,sub,tab})=><button type="button" className={`qpd-flow-step ${tone}`} onClick={()=>tab&&go(tab)}><strong>{title}</strong><small>{sub}</small></button>;
  return <div className="qmes-preview-dashboard">
    <div className="qpd-title-row"><div><h1>종합 대시보드</h1><p>기존 QMES에 수주·MRP·구매·Recipe·납품 흐름을 합친 통합 화면</p></div><button type="button" className="qpd-primary" onClick={()=>go('plan')}>+ 생산계획 등록</button></div>
    <div className="qpd-kpis">
      <div className="qpd-kpi"><span>금월 수주</span><b>12,500 kg</b><small>5건 / 고객사 3개</small></div>
      <div className="qpd-kpi orange"><span>생산 예정</span><b>8,400 kg</b><small>금주 작업지시 6건</small></div>
      <div className="qpd-kpi red"><span>MRP 부족 원료</span><b>3 품목</b><small>NMP · PVDF · 첨가제</small></div>
      <div className="qpd-kpi green"><span>생산 완료율</span><b>92.4%</b><small>계획 대비 실적</small></div>
      <div className="qpd-kpi slate"><span>출하 대기</span><b>2,150 kg</b><small>OQC 합격 기준</small></div>
    </div>
    <section className="qpd-card"><div className="qpd-card-head"><h2>QMES 통합 업무 흐름</h2><span>파랑 = 기존 / 주황 = 추가</span></div><div className="qpd-flow">
      <Step tone="add" title="수주" sub="고객 PO / 납기" tab="sales"/><i>›</i>
      <Step tone="add" title="생산계획" sub="월·주·일 계획" tab="plan"/><i>›</i>
      <Step tone="add" title="MRP" sub="Recipe 소요량" tab="plan"/><i>›</i>
      <Step tone="add" title="구매/발주" sub="부족원료 확보" tab="purchase"/><i>›</i>
      <Step title="IQC" sub="수입검사" tab="iqc"/><i>›</i>
      <Step title="원재료 재고" sub="RM / 위치 / LOT" tab="inv"/><i>›</i>
      <Step title="작업지시" sub="생산 LOT" tab="woIssue"/><i>›</i>
      <Step title="생산공정" sub="계량/배합/충진" tab="prodProcess"/><i>›</i>
      <Step title="PQC" sub="공정검사" tab="pqc"/><i>›</i>
      <Step title="OQC / CoA" sub="출하검사" tab="oqc"/><i>›</i>
      <Step tone="add" title="출하/납품" sub="납품완료" tab="shipping"/>
    </div></section>
    <div className="qpd-grid2">
      <section className="qpd-card"><div className="qpd-card-head"><h2>금주 생산계획 / 진행현황</h2><button type="button" onClick={()=>go('plan')}>전체보기</button></div><div className="qpd-table-wrap"><table><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>
        <tr><td>08-24</td><td>현대자동차</td><td>전도 슬러리 A</td><td>240824-01</td><td>2,000 kg</td><td><span className="qpd-status blue">PQC 진행</span></td></tr>
        <tr><td>08-25</td><td>삼성SDI</td><td>Binder Solution</td><td>250825-01</td><td>1,500 kg</td><td><span className="qpd-status orange">원료 준비</span></td></tr>
        <tr><td>08-26</td><td>SK</td><td>전도 슬러리 B</td><td>260826-01</td><td>2,400 kg</td><td><span className="qpd-status green">자재 확보</span></td></tr>
        <tr><td>08-27</td><td>현대자동차</td><td>Binder Solution</td><td>270827-01</td><td>2,500 kg</td><td><span className="qpd-status red">NMP 부족</span></td></tr>
      </tbody></table></div></section>
      <section className="qpd-card"><div className="qpd-card-head"><h2>실행 필요 알림</h2><span>4건</span></div><div className="qpd-alerts"><div className="red"><span>NMP 재고 250kg 부족</span><b>발주 필요</b></div><div className="orange"><span>PVDF 입고예정일 임박</span><b>08/25</b></div><div className="blue"><span>LOT 240824-01 PQC 대기</span><b>검사실</b></div><div className="orange"><span>현대자동차 출하 예정</span><b>08/26</b></div></div></section>
    </div>
  </div>;
}
window.QMESPreviewDashboard=QMESPreviewDashboard;
