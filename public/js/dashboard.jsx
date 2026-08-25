/* QMES dashboard main only - integrated operations view 2026-08-26
 * Keeps the existing QMES header, top navigation, left sidebar and all other modules intact.
 */

function qmesDashDb(){
  try{return typeof DB!=="undefined"&&DB?DB:{};}catch(_error){return {};}
}

function qmesDashClean(value){return String(value==null?"":value).trim();}
function qmesDashNum(value){
  if(typeof value==="number") return Number.isFinite(value)?value:0;
  const match=qmesDashClean(value).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);
  return match?Number(match[0]):0;
}
function qmesDashDate(value){
  const text=qmesDashClean(value);
  if(!text)return "-";
  const normalized=text.slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized)?normalized.slice(5).replace("-","-"):normalized;
}
function qmesDashQty(value){return `${qmesDashNum(value).toLocaleString("ko-KR",{maximumFractionDigits:3})} kg`;}
function qmesDashCompleted(status){return /완료|생산완료|출하완료/.test(qmesDashClean(status));}
function qmesDashNavigate(tab,openMenu){
  window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,openMenu:openMenu||null}}));
}

function qmesDashBatchDate(row){return qmesDashClean(row?.due||row?.productionDate||row?.date||row?.startDate||row?.workDate||"").slice(0,10);}
function qmesDashBatchLot(row){return qmesDashClean(row?.no||row?.lot||row?.lotNo||row?.finishedLot||"");}
function qmesDashBatchProduct(row){return qmesDashClean(row?.product||row?.item||row?.productName||row?.name||"-")||"-";}
function qmesDashBatchCustomer(row){return qmesDashClean(row?.customer||row?.client||row?.company||row?.customerName||"-")||"-";}
function qmesDashBatchPlan(row){return qmesDashNum(row?.plan??row?.plannedQty??row?.targetQty??row?.qty??row?.amount??0);}
function qmesDashBatchDone(row){return qmesDashNum(row?.done??row?.productionQty??row?.prodQty??(qmesDashCompleted(row?.status)?(row?.qty??row?.amount??row?.plan):0));}

function qmesDashOqcGroups(){
  const db=qmesDashDb();
  const rows=Array.isArray(db.insp?.OQC)?db.insp.OQC:[];
  const groups=new Map();
  rows.forEach(row=>{
    const key=qmesDashClean(row?.groupId)||[qmesDashClean(row?.lot),qmesDashClean(row?.date||row?.shipDate)].filter(Boolean).join("|")||qmesDashClean(row?.id).replace(/-\d+$/,"");
    if(!key)return;
    const prev=groups.get(key)||{};
    groups.set(key,{...prev,...row,lot:qmesDashClean(row?.lot)||qmesDashClean(prev?.lot),judge:qmesDashClean(row?.judge)||qmesDashClean(prev?.judge),customer:qmesDashClean(row?.customer)||qmesDashClean(prev?.customer),shipQty:qmesDashNum(row?.shipQty??prev?.shipQty??0)});
  });
  return Array.from(groups.values());
}

function qmesDashProductionRows(){
  const db=qmesDashDb();
  const batches=Array.isArray(db.batches)?db.batches:[];
  return batches.slice().sort((a,b)=>qmesDashBatchDate(b).localeCompare(qmesDashBatchDate(a))||qmesDashBatchLot(b).localeCompare(qmesDashBatchLot(a))).slice(0,4);
}

function qmesDashSummary(){
  const db=qmesDashDb();
  const batches=Array.isArray(db.batches)?db.batches:[];
  const holds=Array.isArray(db.holds)?db.holds:[];
  const lots=db.lots&&typeof db.lots==="object"?Object.values(db.lots):[];
  const oqc=qmesDashOqcGroups();

  const activeBatches=batches.filter(row=>!qmesDashCompleted(row?.status));
  const plannedKg=activeBatches.reduce((sum,row)=>sum+qmesDashBatchPlan(row),0);
  const planTotal=batches.reduce((sum,row)=>sum+qmesDashBatchPlan(row),0);
  const doneTotal=batches.reduce((sum,row)=>sum+qmesDashBatchDone(row),0);
  const completion=planTotal>0?Math.min(100,Math.max(0,doneTotal/planTotal*100)):0;

  const activeHolds=holds.filter(row=>/차단|보류|격리|대기/.test(qmesDashClean(row?.status))&&!/해제|완료/.test(qmesDashClean(row?.status)));
  const badIqc=(Array.isArray(db.iqc)?db.iqc:[]).filter(row=>qmesDashClean(row?.judge)&&qmesDashClean(row?.judge)!=="합격");
  const qualityCount=activeHolds.length+badIqc.length;

  let shippingWaitKg=0;
  lots.forEach(row=>{
    const shipped=Boolean(row?.ship)&&qmesDashClean(row?.ship?.status||row?.ship?.shipDate||row?.ship?.date);
    if(shipped)return;
    const qty=qmesDashNum(row?.productionQty??row?.producedQty??row?.initialQty??row?.qty??row?.amount??row?.currentQty??0);
    shippingWaitKg+=qty;
  });
  if(shippingWaitKg<=0){
    oqc.filter(row=>row.judge==="합격").forEach(row=>{shippingWaitKg+=qmesDashNum(row.shipQty);});
  }

  return {plannedKg,completion,qualityCount,shippingWaitKg,activeHolds,oqc,batches};
}

function qmesDashStatus(row){
  const status=qmesDashClean(row?.status||row?.state||"");
  if(/부족|불합격|차단|지연|이상/.test(status))return {text:status||"확인 필요",tone:"red"};
  if(/PQC|검사/.test(status))return {text:status||"검사 진행",tone:"blue"};
  if(/준비|대기|발행/.test(status))return {text:status||"준비",tone:"orange"};
  if(/완료|확보|합격/.test(status))return {text:status||"완료",tone:"green"};
  if(status)return {text:status,tone:"slate"};
  return {text:qmesDashCompleted(row?.status)?"완료":"진행 대기",tone:qmesDashCompleted(row?.status)?"green":"slate"};
}

function qmesDashAlerts(){
  const db=qmesDashDb();
  const summary=qmesDashSummary();
  const alerts=[];

  summary.activeHolds.slice(0,2).forEach(row=>{
    alerts.push({tone:"red",text:qmesDashClean(row?.reason||row?.issue||row?.target||"품질 차단 건 확인 필요"),action:qmesDashClean(row?.gate||"조치 필요")||"조치 필요"});
  });

  summary.batches.filter(row=>/부족|지연|원료|대기/.test(qmesDashClean(row?.status))).slice(0,2).forEach(row=>{
    alerts.push({tone:/부족|지연/.test(qmesDashClean(row?.status))?"red":"orange",text:`${qmesDashBatchLot(row)||qmesDashBatchProduct(row)} ${qmesDashClean(row?.status)||"진행 확인"}`,action:"생산관리"});
  });

  const oqcByLot=new Map(summary.oqc.map(row=>[qmesDashClean(row.lot),row]));
  summary.batches.filter(row=>qmesDashCompleted(row?.status)&&qmesDashBatchLot(row)&&!oqcByLot.has(qmesDashBatchLot(row))).slice(0,2).forEach(row=>{
    alerts.push({tone:"blue",text:`LOT ${qmesDashBatchLot(row)} OQC 대기`,action:"검사실"});
  });

  const today=(()=>{const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,"0");const day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;})();
  const iqc=Array.isArray(db.iqc)?db.iqc:[];
  iqc.filter(row=>qmesDashClean(row?.date).slice(0,10)>=today&&qmesDashClean(row?.judge)!=="합격").slice(0,1).forEach(row=>{
    alerts.push({tone:"orange",text:`${qmesDashClean(row?.item)||"원료"} 입고검사 확인`,action:qmesDashClean(row?.date).slice(5)||"IQC"});
  });

  return alerts.slice(0,4);
}

function qmesDashStyles(){
  return <style>{`
    .qmes-main-dash{color:#111827;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif;display:flex;flex-direction:column;gap:14px}
    .qmes-main-dash *{box-sizing:border-box}
    .qmd-title-row{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 1px}.qmd-title{margin:0;font-size:26px;font-weight:950;letter-spacing:-.7px;color:#111827}.qmd-subtitle{font-size:12px;font-weight:850;color:#64748b;white-space:nowrap}
    .qmd-card{background:#fff;border:1px solid #e2e8f0;border-radius:13px;box-shadow:0 8px 24px rgba(15,23,42,.055)}
    .qmd-flow-card{padding:14px 15px 16px}.qmd-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.qmd-card-head h2{margin:0;font-size:17px;font-weight:900;color:#111827}.qmd-link{border:0;background:transparent;color:#2563eb;font-size:11px;font-weight:900;cursor:pointer;padding:3px 0}
    .qmd-flow{display:flex;align-items:stretch;gap:7px;overflow-x:auto;padding:0 0 2px}.qmd-flow-step{min-width:150px;flex:1;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;padding:13px 10px;text-align:center;cursor:pointer;transition:.15s}.qmd-flow-step:hover{background:#e0f2fe;border-color:#93c5fd;transform:translateY(-1px)}.qmd-flow-step strong{display:block;color:#111827;font-size:13px;font-weight:900}.qmd-flow-step small{display:block;margin-top:5px;color:#64748b;font-size:10px;font-weight:650}.qmd-arr{display:grid;place-items:center;color:#2563eb;font-weight:950;font-size:20px;min-width:8px}
    .qmd-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}.qmd-summary-item{min-height:58px;padding:11px 17px;border-right:1px solid #edf2f7;display:flex;align-items:center;justify-content:space-between;gap:12px}.qmd-summary-item:last-child{border-right:0}.qmd-summary-item span{font-size:11px;color:#64748b;font-weight:850;white-space:nowrap}.qmd-summary-item b{font-size:21px;color:#111827;white-space:nowrap}.qmd-summary-item.orange b{color:#c2410c}.qmd-summary-item.green b{color:#15803d}.qmd-summary-item.red b{color:#b91c1c}
    .qmd-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(330px,.95fr);gap:14px}.qmd-panel{padding:15px 17px;min-width:0}.qmd-table-wrap{overflow:auto}.qmd-table{width:100%;border-collapse:collapse;font-size:12px}.qmd-table th{background:#f8fafc;color:#475569;text-align:left;padding:10px 9px;border-bottom:1px solid #dbe3ec;font-size:10px;font-weight:900;white-space:nowrap}.qmd-table td{padding:11px 9px;border-bottom:1px solid #edf2f7;white-space:nowrap;color:#334155;line-height:1.5}.qmd-table tbody tr:last-child td{border-bottom:0}.qmd-table-empty{text-align:center!important;color:#94a3b8!important;padding:34px 10px!important}.qmd-status{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:900}.qmd-status.green{background:#dcfce7;color:#15803d}.qmd-status.orange{background:#ffedd5;color:#c2410c}.qmd-status.blue{background:#dbeafe;color:#1d4ed8}.qmd-status.red{background:#fee2e2;color:#b91c1c}.qmd-status.slate{background:#f1f5f9;color:#475569}
    .qmd-alerts{display:grid;gap:8px}.qmd-alert{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:9px;font-size:11px;font-weight:850}.qmd-alert span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qmd-alert b{white-space:nowrap}.qmd-alert.red{background:#fff1f2;color:#9f1239}.qmd-alert.orange{background:#fff7e6;color:#92400e}.qmd-alert.blue{background:#eff6ff;color:#1e40af}.qmd-alert.green{background:#ecfdf3;color:#166534}.qmd-alert-empty{padding:30px 12px;text-align:center;border-radius:9px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:800}
    @media(max-width:1200px){.qmd-flow-step{min-width:135px}.qmd-summary{grid-template-columns:repeat(2,1fr)}.qmd-summary-item:nth-child(2){border-right:0}.qmd-summary-item:nth-child(-n+2){border-bottom:1px solid #edf2f7}.qmd-grid{grid-template-columns:1fr}}
    @media(max-width:720px){.qmd-title-row{align-items:flex-start;flex-direction:column}.qmd-summary{grid-template-columns:1fr}.qmd-summary-item{border-right:0;border-bottom:1px solid #edf2f7}.qmd-summary-item:last-child{border-bottom:0}.qmd-flow-step{min-width:145px}}
  `}</style>;
}

function DashboardTab(){
  const summary=qmesDashSummary();
  const rows=qmesDashProductionRows();
  const alerts=qmesDashAlerts();
  const completion=summary.completion;
  const workflow=[
    {title:"수주 · 계획",sub:"PO / 생산계획",tab:"erpSales"},
    {title:"자재 · 구매",sub:"MRP / 발주",tab:"erpPlan"},
    {title:"IQC · 입고",sub:"수입검사 / 재고",tab:"iqc",openMenu:"qualityMenu"},
    {title:"작업지시 · 생산",sub:"투입 / 공정 / 실적",tab:"prod",openMenu:"productionMenu"},
    {title:"PQC",sub:"공정검사",tab:"pqc",openMenu:"qualityMenu"},
    {title:"OQC · CoA",sub:"출하검사",tab:"oqc",openMenu:"qualityMenu"},
    {title:"출하 · 납품",sub:"출고 / 납품완료",tab:"erpShipping"}
  ];

  return <div className="qmes-main-dash">
    {qmesDashStyles()}
    <div className="qmd-title-row"><h1 className="qmd-title">종합 대시보드</h1><div className="qmd-subtitle">나모케미칼 운영 현황</div></div>

    <section className="qmd-card qmd-flow-card">
      <div className="qmd-card-head"><h2>업무 흐름</h2><button type="button" className="qmd-link" onClick={()=>qmesDashNavigate("erpSales")}>수주부터 출하까지</button></div>
      <div className="qmd-flow">
        {workflow.map((item,index)=><React.Fragment key={item.title}><button type="button" className="qmd-flow-step" onClick={()=>qmesDashNavigate(item.tab,item.openMenu)}><strong>{item.title}</strong><small>{item.sub}</small></button>{index<workflow.length-1&&<div className="qmd-arr">›</div>}</React.Fragment>)}
      </div>
    </section>

    <section className="qmd-card qmd-summary">
      <div className="qmd-summary-item orange"><span>생산 예정</span><b>{qmesDashQty(summary.plannedKg)}</b></div>
      <div className="qmd-summary-item green"><span>생산 완료율</span><b>{completion.toFixed(1)}%</b></div>
      <div className="qmd-summary-item red"><span>품질/자재 확인</span><b>{summary.qualityCount}건</b></div>
      <div className="qmd-summary-item"><span>출하 대기</span><b>{qmesDashQty(summary.shippingWaitKg)}</b></div>
    </section>

    <div className="qmd-grid">
      <section className="qmd-card qmd-panel">
        <div className="qmd-card-head"><h2>금주 생산계획 / 진행현황</h2><button type="button" className="qmd-link" onClick={()=>qmesDashNavigate("prod","productionMenu")}>전체보기</button></div>
        <div className="qmd-table-wrap"><table className="qmd-table"><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>
          {rows.length===0?<tr><td colSpan="6" className="qmd-table-empty">등록된 생산계획이 없습니다.</td></tr>:rows.map((row,index)=>{const status=qmesDashStatus(row);return <tr key={qmesDashBatchLot(row)||index}><td>{qmesDashDate(qmesDashBatchDate(row))}</td><td>{qmesDashBatchCustomer(row)}</td><td>{qmesDashBatchProduct(row)}</td><td>{qmesDashBatchLot(row)||"-"}</td><td>{qmesDashQty(qmesDashBatchPlan(row))}</td><td><span className={`qmd-status ${status.tone}`}>{status.text}</span></td></tr>;})}
        </tbody></table></div>
      </section>

      <section className="qmd-card qmd-panel">
        <div className="qmd-card-head"><h2>실행 필요 알림</h2><span className="qmd-link" style={{cursor:"default"}}>{alerts.length}건</span></div>
        <div className="qmd-alerts">{alerts.length===0?<div className="qmd-alert-empty">현재 실행이 필요한 알림이 없습니다.</div>:alerts.map((alert,index)=><div key={index} className={`qmd-alert ${alert.tone}`}><span>{alert.text}</span><b>{alert.action}</b></div>)}</div>
      </section>
    </div>
  </div>;
}
