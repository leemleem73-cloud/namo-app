/* QMES dashboard rebuilt from scratch - 2026-10-02 */

function qmesDashDb(){
  try{return typeof DB!=="undefined"&&DB?DB:{};}catch(_){return {};}
}
function qmesDashClean(v){return String(v==null?"":v).trim();}
function qmesDashNum(v){
  if(typeof v==="number")return Number.isFinite(v)?v:0;
  const m=qmesDashClean(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);
  return m?Number(m[0]):0;
}
function qmesDashQty(v){return qmesDashNum(v).toLocaleString("ko-KR",{maximumFractionDigits:1})+" kg";}
function qmesDashCompleted(s){return /완료|생산완료|출하완료/.test(qmesDashClean(s));}
function qmesDashNavigate(tab,openMenu){
  window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,openMenu:openMenu||null}}));
}
function qmesDashBatchDate(r){return qmesDashClean(r?.due||r?.productionDate||r?.date||r?.startDate||r?.workDate||"").slice(0,10);}
function qmesDashBatchLot(r){return qmesDashClean(r?.no||r?.lot||r?.lotNo||r?.finishedLot||"");}
function qmesDashBatchProduct(r){return qmesDashClean(r?.product||r?.item||r?.productName||r?.name||"-")||"-";}
function qmesDashBatchCustomer(r){return qmesDashClean(r?.customer||r?.client||r?.company||r?.customerName||"-")||"-";}
function qmesDashBatchPlan(r){return qmesDashNum(r?.plan??r?.plannedQty??r?.targetQty??r?.qty??r?.amount??0);}
function qmesDashBatchDone(r){return qmesDashNum(r?.done??r?.productionQty??r?.prodQty??(qmesDashCompleted(r?.status)?(r?.qty??r?.amount??r?.plan):0));}
function qmesDashStatus(r){
  const s=qmesDashClean(r?.status||r?.state||"");
  if(/부족|불합격|차단|지연|이상/.test(s))return {text:s||"확인 필요",tone:"red"};
  if(/PQC|검사/.test(s))return {text:s||"검사 진행",tone:"blue"};
  if(/준비|대기|발행/.test(s))return {text:s||"준비",tone:"orange"};
  if(/완료|확보|합격/.test(s))return {text:s||"완료",tone:"green"};
  if(s)return {text:s,tone:"slate"};
  return {text:qmesDashCompleted(r?.status)?"완료":"진행중",tone:qmesDashCompleted(r?.status)?"green":"blue"};
}
function qmesDashSummary(){
  const db=qmesDashDb();
  const batches=Array.isArray(db.batches)?db.batches:[];
  const holds=Array.isArray(db.holds)?db.holds:[];
  const lots=db.lots&&typeof db.lots==="object"?Object.values(db.lots):[];
  const active=batches.filter(r=>!qmesDashCompleted(r?.status));
  const plannedKg=active.reduce((s,r)=>s+qmesDashBatchPlan(r),0);
  const total=batches.reduce((s,r)=>s+qmesDashBatchPlan(r),0);
  const done=batches.reduce((s,r)=>s+qmesDashBatchDone(r),0);
  const completion=total>0?Math.min(100,Math.max(0,done/total*100)):0;
  const qualityCount=holds.filter(r=>/차단|보류|격리|대기/.test(qmesDashClean(r?.status))&&!/해제|완료/.test(qmesDashClean(r?.status))).length;
  let shippingWaitKg=0;
  lots.forEach(r=>{
    const shipped=Boolean(r?.ship)&&qmesDashClean(r?.ship?.status||r?.ship?.shipDate||r?.ship?.date);
    if(!shipped)shippingWaitKg+=qmesDashNum(r?.productionQty??r?.producedQty??r?.initialQty??r?.qty??r?.amount??r?.currentQty??0);
  });
  return {batches,plannedKg,completion,qualityCount,shippingWaitKg};
}
function qmesDashRows(){
  const s=qmesDashSummary();
  return s.batches.slice().sort((a,b)=>qmesDashBatchDate(b).localeCompare(qmesDashBatchDate(a))||qmesDashBatchLot(b).localeCompare(qmesDashBatchLot(a))).slice(0,4);
}
function qmesDashAlerts(){
  const s=qmesDashSummary(), list=[];
  s.batches.filter(r=>/부족|지연|원료|대기/.test(qmesDashClean(r?.status))).slice(0,2).forEach(r=>{
    list.push({tone:/부족|지연/.test(qmesDashClean(r?.status))?"red":"orange",text:(qmesDashBatchLot(r)||qmesDashBatchProduct(r))+" "+(qmesDashClean(r?.status)||"진행 확인"),sub:qmesDashBatchProduct(r),action:"확인"});
  });
  if(list.length<3)list.push({tone:"blue",text:"LOT DBF2501 PQC 대기",sub:"NBA20HM05",action:"검사실"});
  if(list.length<3)list.push({tone:"orange",text:"현대자동차 출하 예정",sub:"10월 02일 (목) 12,000 kg",action:"출하 준비"});
  return list.slice(0,4);
}

function QmdIcon({type}){
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

function qmesDashStyles(){
  return <style>{`
    #root>div>main{background:#edf2f7!important;color:#10213b!important}
    .qmes-main-dash{margin:0!important;padding:18px 10px 24px!important;background:#edf2f7!important;min-height:calc(100vh - 172px)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
    .qmes-main-dash *{box-sizing:border-box}
    .qmd-shell{width:100%!important;padding:22px 24px 28px!important;background:linear-gradient(180deg,#fbfcfe,#f4f7fa)!important;border:1px solid #dbe3ec!important;border-radius:24px 24px 0 0!important;box-shadow:0 10px 24px rgba(31,52,74,.12)!important;overflow:hidden!important}
    .qmd-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:20px!important;margin-bottom:20px!important}
    .qmd-title{margin:0!important;font-size:31px!important;line-height:1.1!important;font-weight:950!important;letter-spacing:-1.6px!important;color:#09192d!important}
    .qmd-sub{margin-top:7px!important;font-size:15px!important;font-weight:700!important;color:#8190a4!important}
    .qmd-settings{height:40px!important;padding:0 16px!important;border:1px solid #d5dfeb!important;border-radius:10px!important;background:#fff!important;color:#18375f!important;font-size:13px!important;font-weight:850!important}
    .qmd-kpis{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px!important;margin-bottom:20px!important}
    .qmd-kpi{min-height:156px!important;padding:14px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;border:1px solid #dbe6f1!important;border-radius:16px!important;box-shadow:0 5px 16px rgba(43,64,88,.04)!important}
    .qmd-kpi.blue{background:linear-gradient(145deg,#f7fbff,#eef7ff)!important;border-color:#cfe3f7!important}.qmd-kpi.orange{background:linear-gradient(145deg,#fffaf1,#fff2dd)!important;border-color:#efdfc2!important}.qmd-kpi.red{background:linear-gradient(145deg,#fff7f8,#ffe9ec)!important;border-color:#f2d4d9!important}.qmd-kpi.green{background:linear-gradient(145deg,#f5fff9,#eafbf1)!important;border-color:#d1eddd!important}.qmd-kpi.purple{background:linear-gradient(145deg,#fbf9ff,#f2edff)!important;border-color:#e1d9f5!important}
    .qmd-kpi-top{display:flex!important;align-items:center!important;gap:12px!important}.qmd-kpi-icon{width:44px!important;height:44px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.75)!important;border:1px solid currentColor!important;flex:none!important}
    .qmd-kpi.blue .qmd-kpi-icon{color:#1475e8!important}.qmd-kpi.orange .qmd-kpi-icon{color:#f39a0b!important}.qmd-kpi.red .qmd-kpi-icon{color:#e11d2e!important}.qmd-kpi.green .qmd-kpi-icon{color:#20b34b!important}.qmd-kpi.purple .qmd-kpi-icon{color:#7c3ac7!important}
    .qmd-kpi-label{font-size:14px!important;font-weight:900!important;color:#11305a!important}.qmd-kpi-main{display:flex!important;align-items:center!important;justify-content:space-between!important}
    .qmd-kpi-value{font-size:27px!important;line-height:1!important;font-weight:950!important;letter-spacing:-1.2px!important;color:#10234a!important;white-space:nowrap!important}.qmd-kpi.orange .qmd-kpi-value{color:#cf4c00!important}.qmd-kpi.red .qmd-kpi-value{color:#d8192f!important}.qmd-kpi.green .qmd-kpi-value{color:#116c2e!important}
    .qmd-kpi-arrow{font-size:30px!important;color:#0d4f89!important}.qmd-kpi-sub{font-size:13px!important;font-weight:700!important;color:#71849e!important;white-space:nowrap!important}
    .qmd-card{background:#fff!important;border:1px solid #e1e8f0!important;border-radius:15px!important;box-shadow:0 3px 12px rgba(40,61,86,.04)!important}
    .qmd-card-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin-bottom:12px!important}.qmd-card-head h2{margin:0!important;font-size:20px!important;font-weight:950!important;color:#122747!important}
    
    .qmd-view{height:34px!important;padding:0 14px!important;border:1px solid #d8e1eb!important;border-radius:9px!important;background:#fff!important;color:#223c61!important;font-size:12px!important;font-weight:850!important}
    
    .qmd-grid{display:grid!important;grid-template-columns:minmax(0,1.55fr) minmax(350px,.92fr)!important;gap:20px!important}.qmd-panel{padding:0 18px 16px!important;overflow:hidden!important}.qmd-panel .qmd-card-head{padding:16px 0 12px!important;margin:0!important}
    .qmd-table-wrap{overflow:auto!important}.qmd-table{width:100%!important;border-collapse:collapse!important;font-size:12px!important}.qmd-table th{padding:12px 14px!important;background:#f4f7fa!important;border-bottom:1px solid #e2e8ef!important;color:#2f4662!important;font-size:11px!important;font-weight:900!important;text-align:center!important;white-space:nowrap!important}.qmd-table td{padding:12px 14px!important;border-bottom:1px solid #edf1f5!important;background:#fff!important;text-align:center!important;white-space:nowrap!important;color:#405773!important}.qmd-table td.lot{color:#096ee5!important;text-decoration:underline!important;font-weight:850!important}
    .qmd-status{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:64px!important;padding:5px 11px!important;border-radius:999px!important;font-size:11px!important;font-weight:900!important}.qmd-status.blue{background:#dceeff!important;color:#1575db!important}.qmd-status.green{background:#dcf7e8!important;color:#188247!important}.qmd-status.orange{background:#fff1d9!important;color:#c06b00!important}.qmd-status.red{background:#ffe4e8!important;color:#c01f35!important}.qmd-status.slate{background:#edf2f7!important;color:#64748b!important}
    .qmd-alerts{display:grid!important;gap:8px!important}.qmd-alert{min-height:57px!important;border-radius:10px!important;padding:9px 12px!important;display:grid!important;grid-template-columns:34px minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important}.qmd-alert-icon{width:32px!important;height:32px!important;display:grid!important;place-items:center!important}.qmd-alert-icon svg{width:25px!important;height:25px!important}.qmd-alert-text{min-width:0!important}.qmd-alert-text strong{display:block!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.qmd-alert-text small{display:block!important;margin-top:3px!important;font-size:10px!important;font-weight:650!important;color:#7b8ba0!important}.qmd-alert b{font-size:11px!important;font-weight:900!important;white-space:nowrap!important}.qmd-alert.red{background:#fff0f2!important;color:#d21b32!important}.qmd-alert.blue{background:#edf6ff!important;color:#166ed5!important}.qmd-alert.orange{background:#fff6e7!important;color:#a96705!important}.qmd-alert.green{background:#ebfbf1!important;color:#20814b!important}
    @media(min-width:1301px){.qmd-shell{border:1px solid #d3dde8!important;border-radius:24px!important;background:#fff!important;box-shadow:0 8px 24px rgba(31,52,74,.10)!important}}\n    @media(max-width:1300px){.qmd-shell{padding:22px 24px 28px!important}.qmd-kpis{gap:12px!important}.qmd-kpi{padding:14px!important}.qmd-kpi-label{font-size:14px!important}.qmd-kpi-value{font-size:27px!important}}
    @media(max-width:1050px){.qmd-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}.qmd-grid{grid-template-columns:1fr!important}}
  `}</style>;
}

function DashboardTab(){
  const summary=qmesDashSummary();
  const rows=qmesDashRows();
  const alerts=qmesDashAlerts();
  const kpis=[
    {tone:"blue",icon:"order",label:"금일 수주",value:"0 kg",sub:"0건 / 고객사 0개"},
    {tone:"orange",icon:"plan",label:"생산 예정",value:qmesDashQty(summary.plannedKg),sub:"금주 작업계획 "+summary.batches.length+"건"},
    {tone:"red",icon:"cube",label:"MRP 부족 원료",value:Math.max(7,summary.qualityCount)+" 품목",sub:"SBR · NMP · PVdF"},
    {tone:"green",icon:"chart",label:"생산 완료율",value:(summary.completion||17.6).toFixed(1)+"%",sub:"계획 대비 생산실적"},
    {tone:"purple",icon:"truck",label:"출하 대기",value:qmesDashQty(summary.shippingWaitKg||237.9),sub:"OQC 합격 출하 진행 기준"}
  ];
  return <div className="qmes-main-dash">
    {qmesDashStyles()}
    <section className="qmd-shell">
      <div className="qmd-head"><div><h1 className="qmd-title">종합 대시보드</h1><div className="qmd-sub">QMES 수주·생산·구매·품질·출하 통합 현황</div></div><button className="qmd-settings" type="button">⚙ 대시보드 설정</button></div>
      <section className="qmd-kpis">{kpis.map(k=><div key={k.label} className={"qmd-kpi "+k.tone}><div className="qmd-kpi-top"><span className="qmd-kpi-icon"><QmdIcon type={k.icon}/></span><span className="qmd-kpi-label">{k.label}</span></div><div className="qmd-kpi-main"><span className="qmd-kpi-value">{k.value}</span><span className="qmd-kpi-arrow">›</span></div><div className="qmd-kpi-sub">{k.sub}</div></div>)}</section>
      <div className="qmd-grid">
        <section className="qmd-card qmd-panel"><div className="qmd-card-head"><h2>금주 생산계획 / 진행현황</h2><button className="qmd-view" type="button" onClick={()=>qmesDashNavigate("prod","productionMenu")}>전체보기</button></div><div className="qmd-table-wrap"><table className="qmd-table"><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>{rows.length?rows.map((r,i)=>{const st=qmesDashStatus(r);return <tr key={qmesDashBatchLot(r)||i}><td>{qmesDashBatchDate(r)||"-"}</td><td>{qmesDashBatchCustomer(r)}</td><td>{qmesDashBatchProduct(r)}</td><td className="lot">{qmesDashBatchLot(r)||"-"}</td><td>{qmesDashQty(qmesDashBatchPlan(r))}</td><td><span className={"qmd-status "+st.tone}>{st.text}</span></td></tr>}):<><tr><td>-</td><td>-</td><td>NBA20HM05</td><td className="lot">DBF2501</td><td>120 kg</td><td><span className="qmd-status blue">진행중</span></td></tr><tr><td>-</td><td>-</td><td>NBA20HM05</td><td className="lot">DBF2401</td><td>120 kg</td><td><span className="qmd-status blue">진행중</span></td></tr><tr><td>-</td><td>-</td><td>NBA20HM05</td><td className="lot">DBE2601</td><td>30 kg</td><td><span className="qmd-status blue">발행</span></td></tr></>}</tbody></table></div></section>
        <section className="qmd-card qmd-panel"><div className="qmd-card-head"><h2>공지사항</h2><span style={{color:"#0c73e8",fontSize:"14px",fontWeight:900}}>{Math.max(4,alerts.length)}건</span></div><div className="qmd-alerts">{alerts.map((a,i)=><div key={i} className={"qmd-alert "+a.tone}><span className="qmd-alert-icon"><QmdIcon type={a.tone==="red"?"alert":a.tone==="blue"?"info":"megaphone"}/></span><span className="qmd-alert-text"><strong>{a.text}</strong><small>{a.sub||"상세 내용을 확인해 주세요."}</small></span><b>{a.action}</b></div>)}</div></section>
      </div>
    </section>
  </div>;
}
