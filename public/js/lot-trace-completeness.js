(function(){
  "use strict";
  if(window.__QMES_LOT_TRACE_COMPLETENESS__) return;
  window.__QMES_LOT_TRACE_COMPLETENESS__=true;

  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const findTextElement=(text)=>Array.from(document.querySelectorAll("h1,h2,h3,h4,div,span"))
    .find(element=>clean(element.textContent)===text);

  const panelOf=element=>{
    let node=element;
    while(node&&node!==document.body){
      const cls=String(node.className||"");
      if(/rounded/.test(cls)&&/border/.test(cls)&&node.querySelector("h1,h2,h3,h4")) return node;
      node=node.parentElement;
    }
    return element?.parentElement||null;
  };

  const toneMeta={
    complete:{label:"완료",dot:"#34d399",bg:"rgba(16,185,129,.10)",border:"rgba(16,185,129,.35)",text:"#6ee7b7"},
    review:{label:"확인 필요",dot:"#fbbf24",bg:"rgba(245,158,11,.10)",border:"rgba(245,158,11,.35)",text:"#fcd34d"},
    pending:{label:"대기",dot:"#94a3b8",bg:"rgba(100,116,139,.10)",border:"rgba(100,116,139,.35)",text:"#cbd5e1"}
  };

  function statusItem(label,state,detail){
    const meta=toneMeta[state];
    return `<div style="box-sizing:border-box;border:1px solid ${meta.border};background:${meta.bg};border-radius:8px;padding:10px 12px;min-height:72px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:12px;font-weight:700;color:#e2e8f0">${label}</span>
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${meta.text};white-space:nowrap"><i style="display:block;width:7px;height:7px;border-radius:999px;background:${meta.dot}"></i>${meta.label}</span>
      </div>
      <div style="margin-top:7px;font-size:11px;line-height:1.45;color:#94a3b8">${detail}</div>
    </div>`;
  }

  function assess(root,backwardPanel,forwardPanel){
    const pageText=clean(root.textContent);
    const backwardText=clean(backwardPanel?.textContent);
    const forwardText=clean(forwardPanel?.textContent);
    const materialRows=backwardPanel?.querySelectorAll("tbody tr").length||0;
    const iqcReview=/미검사|검사중|불합격/.test(backwardText);
    const hasProduction=/생산실적 상세|실투입량|양품수량|불량률/.test(pageText);
    const productionReview=/공정기록 확인 필요|생산실적 없음|실적 미등록/.test(pageText);
    const hasPqc=/공정검사\s*\(PQC\)|PQC 판정|최근 공정검사/.test(pageText);
    const pqcReview=/PQC[^\n]{0,30}(미검사|미등록|불합격)|공정검사[^\n]{0,30}(없음|미등록)/.test(pageText);
    const hasOqc=/출하검사\s*\(OQC\)|OQC 판정|성적서 확인·출력/.test(pageText);
    const oqcReview=/OQC[^\n]{0,30}(미검사|미등록|불합격)|출하검사[^\n]{0,30}(없음|미등록)/.test(pageText);
    const shipped=forwardText&&!/아직 출하되지 않은|출하대기|미출하/.test(forwardText);

    return [
      {label:"원재료·IQC",state:materialRows===0?"pending":iqcReview?"review":"complete",detail:materialRows===0?"투입 원재료 기록이 없습니다.":iqcReview?"미검사·검사중·불합격 원료를 확인하세요.":`${materialRows}개 원재료의 수입검사 연결 완료`},
      {label:"생산실적",state:!hasProduction?"pending":productionReview?"review":"complete",detail:!hasProduction?"생산량·실투입량 기록을 입력하세요.":productionReview?"미완료 공정기록을 확인하세요.":"생산량·작업자·설비·불량 현황 연결 완료"},
      {label:"공정검사(PQC)",state:!hasPqc?"pending":pqcReview?"review":"complete",detail:!hasPqc?"공정검사 기록이 없습니다.":pqcReview?"미검사 또는 불합격 항목을 확인하세요.":"공정검사 측정값과 판정 연결 완료"},
      {label:"출하검사(OQC)",state:!hasOqc?"pending":oqcReview?"review":"complete",detail:!hasOqc?"출하검사 기록이 없습니다.":oqcReview?"미검사 또는 불합격 항목을 확인하세요.":"출하검사 결과와 성적서 연결 완료"},
      {label:"출하정보",state:shipped?"complete":"pending",detail:shipped?"고객사·출하일·출하번호 연결 완료":"OQC 합격 후 출하정보가 표시됩니다."}
    ];
  }

  function render(){
    const backwardTitle=findTextElement("투입 원재료 역추적 (Backward Trace)");
    const forwardTitle=findTextElement("출하 정보 (Forward Trace)");
    if(!backwardTitle||!forwardTitle){
      document.getElementById("qmes-lot-completeness-panel")?.remove();
      return;
    }
    const backwardPanel=panelOf(backwardTitle);
    const forwardPanel=panelOf(forwardTitle);
    const root=backwardPanel?.parentElement;
    if(!root||!forwardPanel) return;

    const lotTitle=Array.from(root.querySelectorAll("h1,h2,h3,h4"))
      .map(element=>clean(element.textContent)).find(text=>/^Lot 이력 — /i.test(text))||"";
    const lotNo=lotTitle.replace(/^Lot 이력 — /i,"")||"선택 LOT";
    const items=assess(root,backwardPanel,forwardPanel);
    const completeCount=items.filter(item=>item.state==="complete").length;
    const signature=JSON.stringify([lotNo,...items.map(item=>`${item.label}:${item.state}:${item.detail}`)]);

    let panel=document.getElementById("qmes-lot-completeness-panel");
    if(!panel){
      panel=document.createElement("section");
      panel.id="qmes-lot-completeness-panel";
      forwardPanel.parentElement.insertBefore(panel,forwardPanel);
    }
    if(panel.dataset.signature===signature) return;
    panel.dataset.signature=signature;
    panel.style.cssText="box-sizing:border-box;border:1px solid rgba(56,189,248,.28);background:rgba(15,23,42,.72);border-radius:10px;padding:16px";
    panel.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div>
          <div style="font-size:14px;font-weight:800;color:#f1f5f9">LOT 이력 완결성 점검</div>
          <div style="margin-top:3px;font-size:11px;color:#64748b">${lotNo} · 원재료부터 출하까지 누락 기록 자동 확인</div>
        </div>
        <div style="font-size:12px;font-weight:800;color:${completeCount===items.length?'#6ee7b7':'#7dd3fc'}">${completeCount} / ${items.length} 완료</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">${items.map(item=>statusItem(item.label,item.state,item.detail)).join("")}</div>
      <div style="margin-top:10px;font-size:11px;color:#64748b">‘확인 필요’ 또는 ‘대기’ 항목을 먼저 보완하면 LOT 이력을 원재료 입고부터 고객 출하까지 완성할 수 있습니다.</div>`;
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      render();
    });
  };

  document.addEventListener("click",schedule,true);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  schedule();
})();
