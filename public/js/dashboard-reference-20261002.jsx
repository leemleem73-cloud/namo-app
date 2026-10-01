function QmdRefIcon({type}){
  const p={viewBox:"0 0 24 24",width:"24",height:"24","aria-hidden":"true"};
  const s={fill:"none",stroke:"currentColor",strokeWidth:"1.9",strokeLinecap:"round",strokeLinejoin:"round"};
  if(type==="order")return <svg {...p} {...s}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h4"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="m18.4 18.4 1.6 1.6"/></svg>;
  if(type==="plan")return <svg {...p} {...s}><path d="M4 20V9l5 3V8l5 3V4h6v16z"/><path d="M8 17h2M13 17h2M17 17h1"/></svg>;
  if(type==="cube")return <svg {...p} {...s}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>;
  if(type==="chart")return <svg {...p} {...s}><path d="M4 20h16M6 18v-5h3v5M11 18V9h3v9M16 18V5h3v13"/><path d="m6 9 4-3 3 2 5-5"/></svg>;
  if(type==="truck")return <svg {...p} {...s}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
  if(type==="alert")return <svg {...p} {...s}><path d="M12 3 2.8 19h18.4z"/><path d="M12 9v4M12 16.5h.01"/></svg>;
  if(type==="info")return <svg {...p} {...s}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></svg>;
  return <svg {...p} {...s}><path d="M4 11v3h4l8 4V7l-8 4z"/><path d="m8 14 1.5 5h3L11 15M19 9l2-1M19 16l2 1"/></svg>;
}

function qmesDashReferenceStyles(){
  const css = [
    "html body #root>div>main{margin-left:54px!important;width:calc(100% - 54px)!important;padding:170px 0 0!important;min-height:100vh!important;background:#eef3f8!important;overflow:visible!important}",
    ".qmes-main-dash{margin:0!important;padding:0 12px 28px!important;min-height:calc(100vh - 170px)!important;background:#eef3f8!important;color:#10213b!important;font-family:Pretendard,Noto Sans KR,Malgun Gothic,Arial,sans-serif!important}",
    ".qmes-main-dash *{box-sizing:border-box}",
    ".qmdr-shell{width:100%;min-height:calc(100vh - 182px);padding:24px 38px 30px;background:linear-gradient(180deg,#fbfcfe,#f4f7fa);border:1px solid #dbe3ec;border-radius:24px 24px 0 0;box-shadow:0 10px 24px rgba(31,52,74,.12);overflow:hidden}",
    ".qmdr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}.qmdr-title{margin:0;font-size:31px;line-height:1.12;font-weight:950;letter-spacing:-1.6px;color:#09192d}.qmdr-sub{margin-top:7px;font-size:15px;font-weight:700;color:#8190a4}.qmdr-settings{height:40px;padding:0 16px;border:1px solid #d5dfeb;border-radius:10px;background:#fff;color:#18375f;font-size:13px;font-weight:850}",
    ".qmdr-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:20px;margin-bottom:20px}.qmdr-kpi{min-height:156px;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #dbe6f1;border-radius:16px;box-shadow:0 5px 16px rgba(43,64,88,.04)}",
    ".qmdr-kpi.blue{background:linear-gradient(145deg,#f7fbff,#eef7ff);border-color:#cfe3f7}.qmdr-kpi.orange{background:linear-gradient(145deg,#fffaf1,#fff2dd);border-color:#efdfc2}.qmdr-kpi.red{background:linear-gradient(145deg,#fff7f8,#ffe9ec);border-color:#f2d4d9}.qmdr-kpi.green{background:linear-gradient(145deg,#f5fff9,#eafbf1);border-color:#d1eddd}.qmdr-kpi.purple{background:linear-gradient(145deg,#fbf9ff,#f2edff);border-color:#e1d9f5}",
    ".qmdr-kpi-top{display:flex;align-items:center;gap:12px}.qmdr-kpi-icon{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.75);border:1px solid currentColor;flex:none}.qmdr-kpi.blue .qmdr-kpi-icon{color:#1475e8}.qmdr-kpi.orange .qmdr-kpi-icon{color:#f39a0b}.qmdr-kpi.red .qmdr-kpi-icon{color:#e11d2e}.qmdr-kpi.green .qmdr-kpi-icon{color:#20b34b}.qmdr-kpi.purple .qmdr-kpi-icon{color:#7c3ac7}.qmdr-kpi-label{font-size:16px;font-weight:900;color:#11305a}",
    ".qmdr-kpi-main{display:flex;align-items:center;justify-content:space-between}.qmdr-kpi-value{font-size:31px;line-height:1;font-weight:950;letter-spacing:-1.2px;color:#10234a;white-space:nowrap}.qmdr-kpi.orange .qmdr-kpi-value{color:#cf4c00}.qmdr-kpi.red .qmdr-kpi-value{color:#d8192f}.qmdr-kpi.green .qmdr-kpi-value{color:#116c2e}.qmdr-kpi-arrow{font-size:30px;color:#0d4f89}.qmdr-kpi-sub{font-size:13px;font-weight:700;color:#71849e;white-space:nowrap}",
    ".qmdr-card{background:#fff;border:1px solid #e1e8f0;border-radius:15px;box-shadow:0 3px 12px rgba(40,61,86,.04)}.qmdr-flow-card{padding:16px 18px 12px;margin-bottom:20px}.qmdr-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.qmdr-card-head h2{margin:0;font-size:20px;font-weight:950;letter-spacing:-.5px;color:#122747}",
    ".qmdr-flow-tools{display:flex;align-items:center;gap:18px}.qmdr-legend{display:flex;align-items:center;gap:15px;font-size:12px;font-weight:750;color:#74849a}.qmdr-legend span{display:inline-flex;align-items:center;gap:5px}.qmdr-dot{width:8px;height:8px;border-radius:50%}.qmdr-view{height:34px;padding:0 14px;border:1px solid #d8e1eb;border-radius:9px;background:#fff;color:#223c61;font-size:12px;font-weight:850}",
    ".qmdr-flow{display:flex;align-items:center;gap:10px;overflow-x:auto;padding:3px 0 10px}.qmdr-step{min-width:116px;height:88px;flex:1 0 116px;border:1px solid #cfe0f0;border-radius:11px;background:linear-gradient(180deg,#f7fbff,#edf6ff);color:#17365d;padding:13px 8px;text-align:center}.qmdr-step.warm{background:linear-gradient(180deg,#fffaf2,#fff3df);border-color:#efdfbd}.qmdr-step strong{display:block;font-size:13px;font-weight:900}.qmdr-step small{display:block;margin-top:8px;font-size:10px;font-weight:700;color:#75879d;white-space:nowrap}.qmdr-arr{flex:0 0 10px;color:#1680e8;font-size:25px;font-weight:900;text-align:center}.qmdr-flow-bar{height:8px;border-radius:6px;background:#dfe6ee;overflow:hidden}.qmdr-flow-bar span{display:block;width:65%;height:100%;background:#163d69;border-radius:6px}",
    ".qmdr-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(350px,.92fr);gap:20px}.qmdr-panel{padding:0 18px 16px;overflow:hidden}.qmdr-panel .qmdr-card-head{padding:16px 0 12px;margin:0}.qmdr-table-wrap{overflow:auto}.qmdr-table{width:100%;border-collapse:collapse;font-size:12px}.qmdr-table th{padding:12px 14px;background:#f4f7fa;border-bottom:1px solid #e2e8ef;color:#2f4662;font-size:11px;font-weight:900;text-align:center;white-space:nowrap}.qmdr-table td{padding:12px 14px;border-bottom:1px solid #edf1f5;background:#fff;text-align:center;white-space:nowrap;color:#405773}.qmdr-table td.lot{color:#096ee5;text-decoration:underline;font-weight:850}",
    ".qmdr-status{display:inline-flex;align-items:center;justify-content:center;min-width:64px;padding:5px 11px;border-radius:999px;font-size:11px;font-weight:900}.qmdr-status.blue{background:#dceeff;color:#1575db}.qmdr-status.green{background:#dcf7e8;color:#188247}.qmdr-status.orange{background:#fff1d9;color:#c06b00}.qmdr-status.red{background:#ffe4e8;color:#c01f35}.qmdr-status.slate{background:#edf2f7;color:#64748b}",
    ".qmdr-alerts{display:grid;gap:8px}.qmdr-alert{min-height:57px;border-radius:10px;padding:9px 12px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center}.qmdr-alert-icon{width:32px;height:32px;display:grid;place-items:center}.qmdr-alert-icon svg{width:25px;height:25px}.qmdr-alert-text{min-width:0}.qmdr-alert-text strong{display:block;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qmdr-alert-text small{display:block;margin-top:3px;font-size:10px;font-weight:650;color:#7b8ba0}.qmdr-alert b{font-size:11px;font-weight:900;white-space:nowrap}.qmdr-alert.red{background:#fff0f2;color:#d21b32}.qmdr-alert.blue{background:#edf6ff;color:#166ed5}.qmdr-alert.orange{background:#fff6e7;color:#a96705}.qmdr-alert.green{background:#ebfbf1;color:#20814b}",
    "@media(max-width:1300px){.qmdr-shell{padding:22px 24px 28px}.qmdr-kpis{gap:12px}.qmdr-kpi{padding:14px}.qmdr-kpi-label{font-size:14px}.qmdr-kpi-value{font-size:27px}.qmdr-step{min-width:108px;flex-basis:108px}}",
    "@media(max-width:1050px){.qmdr-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.qmdr-grid{grid-template-columns:1fr}}"
  ].join("");
  return <style>{css}</style>;
}

DashboardTab = function(){
  const summary=qmesDashSummary();
  const rows=qmesDashProductionRows();
  const alerts=qmesDashAlerts();
  const completion=summary.completion;
  const workflow=[
    {title:"수주",sub:"고객 PO / 납기",tab:"erpSales",warm:true},{title:"생산계획",sub:"월·주·일 계획",tab:"erpPlan",warm:true},{title:"MRP",sub:"Recipe 소요량",tab:"erpPlan",warm:true},{title:"구매/발주",sub:"부족원료 확보",tab:"erpPlan",warm:true},{title:"IQC",sub:"수입검사",tab:"iqc"},{title:"원재료 재고",sub:"RM / 위치 / LOT",tab:"inventory"},{title:"작업지시",sub:"생산 LOT",tab:"woIssue"},{title:"생산공정",sub:"계량/배합/충진",tab:"prod"},{title:"PQC",sub:"공정검사",tab:"pqc"},{title:"OQC / CoA",sub:"출하검사",tab:"oqc"}
  ];
  const kpis=[
    {tone:"blue",icon:"order",label:"금일 수주",value:"0 kg",sub:"0건 / 고객사 0개"},
    {tone:"orange",icon:"plan",label:"생산 예정",value:qmesDashQty(summary.plannedKg),sub:"금주 작업계획 "+summary.batches.length+"건"},
    {tone:"red",icon:"cube",label:"MRP 부족 원료",value:summary.qualityCount+" 품목",sub:"SBR · NMP · PVdF"},
    {tone:"green",icon:"chart",label:"생산 완료율",value:completion.toFixed(1)+"%",sub:"계획 대비 생산실적"},
    {tone:"purple",icon:"truck",label:"출하 대기",value:qmesDashQty(summary.shippingWaitKg),sub:"OQC 합격 출하 진행 기준"}
  ];
  const alertRows=alerts.length?alerts:[
    {tone:"red",text:"SBR 재고 부족 원료 확인",action:"발주 필요",sub:"생산계획 기준 부족 원료 확인"},
    {tone:"blue",text:"생산 LOT PQC 대기",action:"검사실",sub:"공정검사 진행 필요"},
    {tone:"orange",text:"출하 예정 건 확인",action:"출하 준비",sub:"출하일정 및 OQC 확인"}
  ];
  return <div className="qmes-main-dash">{qmesDashReferenceStyles()}<section className="qmdr-shell">
    <div className="qmdr-head"><div><h1 className="qmdr-title">종합 대시보드</h1><div className="qmdr-sub">QMES 수주·생산·구매·품질·출하 통합 현황</div></div><button className="qmdr-settings" type="button">⚙ 대시보드 설정</button></div>
    <section className="qmdr-kpis">{kpis.map(function(k){return <div key={k.label} className={"qmdr-kpi "+k.tone}><div className="qmdr-kpi-top"><span className="qmdr-kpi-icon"><QmdRefIcon type={k.icon}/></span><span className="qmdr-kpi-label">{k.label}</span></div><div className="qmdr-kpi-main"><span className="qmdr-kpi-value">{k.value}</span><span className="qmdr-kpi-arrow">›</span></div><div className="qmdr-kpi-sub">{k.sub}</div></div>})}</section>
    <section className="qmdr-card qmdr-flow-card"><div className="qmdr-card-head"><h2>QMES 통합 업무 흐름</h2><div className="qmdr-flow-tools"><div className="qmdr-legend"><span><i className="qmdr-dot" style={{background:"#1680e8"}}></i>진행중</span><span><i className="qmdr-dot" style={{background:"#e51c23"}}></i>지연</span><span><i className="qmdr-dot" style={{background:"#19983b"}}></i>완료</span><span><i className="qmdr-dot" style={{background:"#8aa0b8"}}></i>대기</span></div><button className="qmdr-view" type="button">전체보기</button></div></div>
      <div className="qmdr-flow">{workflow.map(function(item,index){return <React.Fragment key={item.title}><button type="button" className={"qmdr-step"+(item.warm?" warm":"")} onClick={function(){qmesDashNavigate(item.tab,item.openMenu)}}><strong>{item.title}</strong><small>{item.sub}</small></button>{index<workflow.length-1?<div className="qmdr-arr">›</div>:null}</React.Fragment>})}</div><div className="qmdr-flow-bar"><span></span></div>
    </section>
    <div className="qmdr-grid">
      <section className="qmdr-card qmdr-panel"><div className="qmdr-card-head"><h2>금주 생산계획 / 진행현황</h2><button className="qmdr-view" type="button" onClick={function(){qmesDashNavigate("prod","productionMenu")}}>전체보기</button></div><div className="qmdr-table-wrap"><table className="qmdr-table"><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>{rows.length===0?<tr><td colSpan="6" style={{padding:"34px",color:"#94a3b8"}}>등록된 생산계획이 없습니다.</td></tr>:rows.map(function(row,index){const status=qmesDashStatus(row);return <tr key={qmesDashBatchLot(row)||index}><td>{qmesDashDate(qmesDashBatchDate(row))}</td><td>{qmesDashBatchCustomer(row)}</td><td>{qmesDashBatchProduct(row)}</td><td className="lot">{qmesDashBatchLot(row)||"-"}</td><td>{qmesDashQty(qmesDashBatchPlan(row))}</td><td><span className={"qmdr-status "+status.tone}>{status.text}</span></td></tr>})}</tbody></table></div></section>
      <section className="qmdr-card qmdr-panel"><div className="qmdr-card-head"><h2>공지사항</h2><span style={{color:"#0c73e8",fontSize:"14px",fontWeight:900}}>{alertRows.length}건</span></div><div className="qmdr-alerts">{alertRows.map(function(a,index){return <div key={index} className={"qmdr-alert "+a.tone}><span className="qmdr-alert-icon"><QmdRefIcon type={a.tone==="red"?"alert":a.tone==="blue"?"info":"megaphone"}/></span><span className="qmdr-alert-text"><strong>{a.text}</strong><small>{a.sub||"상세 내용을 확인해 주세요."}</small></span><b>{a.action}</b></div>})}</div></section>
    </div>
  </section></div>;
};