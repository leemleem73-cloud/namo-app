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

function qmesDashRead(key,fallback){
  try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}
}
function qmesDashSalesOrders(){
  const db=qmesDashDb();
  const stored=qmesDashRead("qmes-erp-sales-v1",[]);
  const meta=qmesDashRead("qmes-sales-order-meta-v1",{});
  const shipping=qmesDashRead("qmes-erp-shipping-v1",[]);
  const rows=Array.isArray(stored)?stored.slice():[];
  const known=new Set();
  (Array.isArray(db.batches)?db.batches:[]).forEach(batch=>{
    const id=qmesDashClean(batch?.salesOrderId);
    if(id&&!rows.some(row=>qmesDashClean(row?.id)===id||qmesDashClean(row?.salesOrderId)===id))rows.push({id,workOrder:batch?.no,customer:batch?.customer,product:batch?.item||batch?.productName,qty:batch?.orderQty||batch?.plan,due:batch?.due,status:batch?.status});
  });
  return rows.map(row=>{
    const raw=qmesDashClean(row?.id||row?.salesOrderId||row?.orderNo);
    const workOrder=qmesDashClean(row?.workOrder);
    const orderMeta=(meta&&typeof meta==="object"&&!Array.isArray(meta)?meta[workOrder]||meta[raw]:null)||row?.orderMeta||{};
    const id=qmesDashClean(orderMeta?.salesOrderIdOverride)||raw;
    if(!id||known.has(id))return null;known.add(id);
    const shipment=(Array.isArray(shipping)?shipping:[]).find(item=>qmesDashClean(item?.sales||item?.salesOrderId)===id||qmesDashClean(item?.workOrder)===workOrder)||{};
    return {
      id,
      workOrder:qmesDashClean(orderMeta?.workOrder)||workOrder,
      customer:qmesDashClean(orderMeta?.customerOverride||row?.customer||row?.customerName)||"고객사 미지정",
      product:qmesDashClean(orderMeta?.productOverride||orderMeta?.productCategory||row?.product||row?.productCategory||row?.item)||"제품 미지정",
      qty:qmesDashNum(orderMeta?.qtyOverride??row?.qty??row?.orderQty),
      due:qmesDashClean(orderMeta?.requestedDue||row?.due||row?.dueDate).slice(0,10),
      priority:qmesDashClean(orderMeta?.priority||row?.priority),
      plan:qmesDashClean(orderMeta?.productionPlanStatus||row?.plan),
      status:qmesDashClean(orderMeta?.salesStatus||row?.salesStatus||row?.status),
      shipping:qmesDashClean(row?.shipping||row?.shipStatus||shipment?.delivery||shipment?.status)
    };
  }).filter(Boolean);
}
function qmesDashDueTime(value){const time=new Date(`${qmesDashClean(value)}T00:00:00`).getTime();return Number.isFinite(time)?time:Number.MAX_SAFE_INTEGER;}
function qmesDashDueLabel(value){
  const due=qmesDashDueTime(value);if(due===Number.MAX_SAFE_INTEGER)return "납기 미정";
  const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();const days=Math.round((due-today)/86400000);
  return days===0?"납기 D-DAY":days>0?`납기 D-${days}`:`납기 D+${Math.abs(days)}`;
}
function qmesDashPreferredOrder(orders){
  const db=qmesDashDb(),batches=Array.isArray(db.batches)?db.batches:[];
  const active=orders.filter(order=>!/출하완료|납품완료/.test(order.shipping));
  return (active.length?active:orders).slice().sort((a,b)=>{
    const score=order=>{
      const linked=batches.filter(row=>qmesDashClean(row?.salesOrderId)===order.id||qmesDashClean(row?.no)===order.workOrder);
      const producing=linked.some(row=>qmesDashNum(row?.done??row?.productionQty)>0||/진행|생산중|투입/.test(qmesDashClean(row?.status)));
      return (producing?0:10000000000000)+(order.priority==="긴급"?-1000000000000:0)+qmesDashDueTime(order.due);
    };
    return score(a)-score(b);
  })[0]||null;
}
function qmesDashFocusProgress(order){
  if(!order)return {actual:0,target:0,rate:0,current:0,completedThrough:-1};
  const db=qmesDashDb(),batches=(Array.isArray(db.batches)?db.batches:[]).filter(row=>qmesDashClean(row?.salesOrderId)===order?.id||qmesDashClean(row?.no)===order?.workOrder),lots=Object.entries(db.lots||{}).filter(([key,row])=>qmesDashClean(row?.salesOrderId)===order?.id||qmesDashClean(row?.workOrder||row?.wo||key)===order?.workOrder),plans=qmesDashRead("qmes-erp-plan-v1",[]);
  const linkedPlans=(Array.isArray(plans)?plans:[]).filter(row=>qmesDashClean(row?.salesOrderId)===order?.id||qmesDashClean(row?.workOrder)===order?.workOrder);
  const batchDone=batches.reduce((sum,row)=>sum+qmesDashNum(row?.done??row?.productionQty??row?.prodQty??row?.actualQty),0);
  const lotDone=lots.reduce((sum,[,row])=>sum+qmesDashNum(row?.productionQty??row?.producedQty??row?.qty??row?.currentQty),0);
  const actual=Math.max(batchDone,lotDone),target=order?.qty||batches.reduce((sum,row)=>sum+qmesDashNum(row?.plan??row?.plannedQty),0)||linkedPlans.reduce((sum,row)=>sum+qmesDashNum(row?.qty),0);
  const lotKeys=new Set([order?.workOrder,...batches.map(row=>qmesDashClean(row?.no)),...lots.map(([key,row])=>qmesDashClean(row?.lot||row?.lotNo||key))].filter(Boolean));
  const oqc=qmesDashOqcGroups().filter(row=>qmesDashClean(row?.salesOrderId)===order?.id||lotKeys.has(qmesDashClean(row?.lot)));
  const oqcPassed=oqc.some(row=>qmesDashClean(row?.judge)==="합격");
  const shipped=/출하완료|납품완료/.test(order?.shipping)||lots.some(([,row])=>/출하완료|납품완료/.test(qmesDashClean(row?.ship?.status||row?.shipping||row?.status)));
  const hasWorkOrder=batches.length>0||Boolean(order?.workOrder)||lots.length>0;
  const issued=batches.some(row=>!/발행대기|초안|계획대기/.test(qmesDashClean(row?.status)))||actual>0;
  const productionFinished=(target>0&&actual>=target)||batches.some(row=>/생산완료|완료/.test(qmesDashClean(row?.status)));
  let current=1,completedThrough=0;
  if(linkedPlans.length||hasWorkOrder){current=2;completedThrough=1;}
  if(issued){current=3;completedThrough=2;}
  if(productionFinished){current=4;completedThrough=3;}
  if(oqcPassed){current=5;completedThrough=4;}
  if(shipped){current=5;completedThrough=5;}
  return {actual,target,rate:target>0?Math.min(100,Math.max(0,actual/target*100)):0,current,completedThrough};
}
function qmesDashAmount(value){return qmesDashNum(value).toLocaleString("ko-KR",{maximumFractionDigits:3});}

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
    #root>div>main{background:#f5f7fb!important;color:#111827!important}
    .qmes-main-dash{color:#111827!important;background:#f5f7fb!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif;display:flex;flex-direction:column;gap:14px;margin:-20px -24px;padding:18px 22px 34px;min-height:calc(100vh - 150px)}
    .qmes-main-dash *{box-sizing:border-box}
    .qmd-title-row{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:2px 0 1px}.qmd-title{margin:0;font-size:25px;font-weight:950;letter-spacing:-.5px;color:#111827!important}.qmd-subtitle{font-size:11px;font-weight:850;color:#64748b!important;white-space:nowrap}
    .qmd-card{background:#ffffff!important;border:1px solid #e2e8f0!important;border-radius:13px;box-shadow:0 10px 28px rgba(15,23,42,.07)!important;color:#111827!important}
    .qmd-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}.qmd-card-head h2{margin:0;font-size:16px;font-weight:900;color:#111827!important}.qmd-link{border:0!important;background:transparent!important;color:#2563eb!important;font-size:11px;font-weight:900;cursor:pointer;padding:3px 0}
    html body #root#root#root main .qmes-main-dash .qmd-card.qmd-focus-card{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(300px,.95fr) minmax(560px,2fr) minmax(215px,.68fr);align-items:center;gap:24px;min-height:136px;padding:22px 28px;background:#091625!important;background-color:#091625!important;background-image:linear-gradient(122deg,#071321 0%,#0a1a2c 48%,#0d2238 100%)!important;border:1px solid rgba(73,104,139,.48)!important;border-radius:15px!important;box-shadow:0 16px 36px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.05)!important;color:#fff!important;overflow:hidden}.qmd-focus-card:before{content:"";position:absolute;z-index:-1;inset:0 0 auto;height:2px;background:linear-gradient(90deg,transparent,#21c7b7 34%,#4e87c7 70%,transparent);opacity:.72}.qmd-focus-card:after{content:"";position:absolute;z-index:-1;right:-80px;top:-130px;width:310px;height:310px;border-radius:50%;background:radial-gradient(circle,rgba(35,125,162,.13),transparent 68%);pointer-events:none}.qmd-focus-order{display:grid;grid-template-columns:50px minmax(0,1fr);align-items:center;gap:16px;min-width:0}.qmd-focus-icon{width:50px;height:50px;display:grid;place-items:center;border:1px solid rgba(45,212,191,.2)!important;border-radius:13px;background:linear-gradient(145deg,#063d4c,#062c3d)!important;color:#5eead4!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 8px 20px rgba(0,0,0,.18)!important}.qmd-focus-icon svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.qmd-focus-copy{min-width:0}.qmd-focus-copy small{display:block;margin-bottom:7px;color:#8fa7c1!important;-webkit-text-fill-color:#8fa7c1!important;font-size:11px;font-weight:850;letter-spacing:.045em}.qmd-focus-copy strong{display:block;overflow:hidden;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;font-size:15px;font-weight:950;line-height:1.4;letter-spacing:-.015em;text-overflow:ellipsis;white-space:nowrap}.qmd-focus-select{max-width:100%;margin-top:8px;border:1px solid rgba(91,126,164,.55)!important;border-radius:7px;background:#10243a!important;color:#e2e8f0!important;-webkit-text-fill-color:#e2e8f0!important;padding:5px 9px;font-size:10px;font-weight:800;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)!important}
    .qmd-focus-track{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));align-items:start;min-width:0}.qmd-focus-stage{position:relative;min-width:0;border:0!important;background:transparent!important;background-color:transparent!important;color:#64748b!important;padding:0 2px!important;text-align:center;cursor:pointer}.qmd-focus-stage:after{content:"";position:absolute;z-index:0;top:15px;left:50%;width:100%;height:3px;background:#29374b}.qmd-focus-stage:last-child:after{display:none}.qmd-focus-stage.done:after{background:#15b8a6}.qmd-focus-dot{position:relative;z-index:1;width:32px;height:32px;display:grid;margin:0 auto 9px;place-items:center;border:3px solid #33445d;border-radius:50%;background:#0b1728!important;color:#71849e!important;-webkit-text-fill-color:#71849e!important;font-size:12px;font-weight:950}.qmd-focus-stage.done .qmd-focus-dot{border-color:#15b8a6;background:#15b8a6!important;color:#fff!important;-webkit-text-fill-color:#fff!important}.qmd-focus-stage.current .qmd-focus-dot{border-color:#d99516;background:#142035!important;color:#f5b323!important;-webkit-text-fill-color:#f5b323!important;box-shadow:0 0 0 4px rgba(217,149,22,.15)}.qmd-focus-stage span:last-child{display:block;color:#7f94ad!important;-webkit-text-fill-color:#7f94ad!important;font-size:11px;font-weight:850;white-space:nowrap}.qmd-focus-stage.done span:last-child{color:#d7e2ee!important;-webkit-text-fill-color:#d7e2ee!important}.qmd-focus-stage.current span:last-child{color:#fff!important;-webkit-text-fill-color:#fff!important}.qmd-focus-stage:hover span:last-child{color:#fff!important;-webkit-text-fill-color:#fff!important}
    .qmd-focus-output{align-self:stretch;display:flex;flex-direction:column;justify-content:center;padding-left:25px;border-left:1px solid rgba(83,112,145,.42)}.qmd-focus-output small{color:#91a8c1!important;-webkit-text-fill-color:#91a8c1!important;font-size:10px;font-weight:850;letter-spacing:.025em}.qmd-focus-output strong{margin-top:8px;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:22px;font-weight:950;font-variant-numeric:tabular-nums;letter-spacing:-.025em;white-space:nowrap}.qmd-focus-output b{margin-top:8px;color:#f6ad2f!important;-webkit-text-fill-color:#f6ad2f!important;font-size:11px;font-weight:900}
    .qmd-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden;background:#fff!important}.qmd-summary-item{min-height:58px;padding:12px 16px;border-right:1px solid #edf2f7!important;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff!important}.qmd-summary-item:last-child{border-right:0!important}.qmd-summary-item span{font-size:11px;color:#64748b!important;font-weight:850;white-space:nowrap}.qmd-summary-item b{font-size:18px;color:#111827!important;white-space:nowrap}.qmd-summary-item.orange b{color:#c2410c!important}.qmd-summary-item.green b{color:#15803d!important}.qmd-summary-item.red b{color:#b91c1c!important}
    .qmd-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(330px,.85fr);gap:14px}.qmd-panel{padding:16px;min-width:0;background:#fff!important}.qmd-table-wrap{overflow:auto}.qmd-table{width:100%;border-collapse:collapse;font-size:12px;background:#fff!important;color:#334155!important}.qmd-table th{background:#f8fafc!important;color:#475569!important;text-align:left;padding:9px;border-bottom:1px solid #dbe3ec!important;font-size:11px;font-weight:900;white-space:nowrap}.qmd-table td{padding:10px 9px;border-bottom:1px solid #edf2f7!important;white-space:nowrap;color:#334155!important;line-height:1.65;background:#fff!important}.qmd-table tbody tr:hover td{background:#fbfdff!important}.qmd-table tbody tr:last-child td{border-bottom:0!important}.qmd-table-empty{text-align:center!important;color:#94a3b8!important;padding:34px 10px!important}.qmd-status{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:950}.qmd-status.green{background:#dcfce7!important;color:#15803d!important}.qmd-status.orange{background:#ffedd5!important;color:#c2410c!important}.qmd-status.blue{background:#dbeafe!important;color:#1d4ed8!important}.qmd-status.red{background:#fee2e2!important;color:#b91c1c!important}.qmd-status.slate{background:#f1f5f9!important;color:#475569!important}
    .qmd-alerts{display:grid;gap:8px}.qmd-alert{min-height:42px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border-radius:9px;font-size:12px;font-weight:800}.qmd-alert span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qmd-alert b{white-space:nowrap}.qmd-alert.red{background:#fff1f2!important;color:#9f1239!important}.qmd-alert.orange{background:#fff7e6!important;color:#92400e!important}.qmd-alert.blue{background:#eff6ff!important;color:#1e40af!important}.qmd-alert.green{background:#ecfdf3!important;color:#166534!important}.qmd-alert-empty{padding:30px 12px;text-align:center;border-radius:9px;background:#f8fafc!important;color:#64748b!important;font-size:12px;font-weight:800}
    @media(max-width:1200px){.qmes-main-dash{margin:-20px -16px;padding:18px 16px 30px}html body #root#root#root main .qmes-main-dash .qmd-card.qmd-focus-card{grid-template-columns:minmax(240px,.8fr) minmax(480px,1.8fr);gap:18px}.qmd-focus-output{grid-column:1/-1;min-height:54px;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:14px;padding:10px 0 0;border-left:0;border-top:1px solid #203148}.qmd-focus-output strong,.qmd-focus-output b{margin-top:0}.qmd-summary{grid-template-columns:repeat(2,1fr)}.qmd-summary-item:nth-child(2){border-right:0!important}.qmd-summary-item:nth-child(-n+2){border-bottom:1px solid #edf2f7!important}.qmd-grid{grid-template-columns:1fr}}
    @media(max-width:820px){html body #root#root#root main .qmes-main-dash .qmd-card.qmd-focus-card{grid-template-columns:1fr;min-height:0;padding:17px;gap:17px}.qmd-focus-track{width:100%}.qmd-focus-output{grid-column:auto}.qmd-focus-stage span:last-child{font-size:8px}.qmd-focus-dot{width:25px;height:25px;border-width:2px;font-size:9px}.qmd-focus-stage:after{top:12px}}
    @media(max-width:720px){.qmes-main-dash{margin:-20px -16px;padding:14px}.qmd-title-row{align-items:flex-start;flex-direction:column}.qmd-summary{grid-template-columns:1fr}.qmd-summary-item{border-right:0!important;border-bottom:1px solid #edf2f7!important}.qmd-summary-item:last-child{border-bottom:0!important}html body #root#root#root main .qmes-main-dash .qmd-card.qmd-focus-card{border-radius:11px!important}.qmd-focus-copy strong{font-size:12px}.qmd-focus-output{grid-template-columns:1fr}.qmd-focus-output strong{font-size:17px}.qmd-focus-stage{padding:0!important}.qmd-focus-stage span:last-child{font-size:7px;letter-spacing:-.05em}}
  `}</style>;
}

function DashboardTab(){
  const summary=qmesDashSummary();
  const rows=qmesDashProductionRows();
  const alerts=qmesDashAlerts();
  const completion=summary.completion;
  const orders=qmesDashSalesOrders();
  const preferred=qmesDashPreferredOrder(orders);
  const [selectedOrderId,setSelectedOrderId]=React.useState(()=>{try{return localStorage.getItem("qmes-dashboard-focus-order-v1")||"";}catch(_error){return "";}});
  const focusOrder=orders.find(order=>order.id===selectedOrderId)||preferred;
  const focus=qmesDashFocusProgress(focusOrder);
  const workflow=[
    {title:"수주확정",tab:"erpSales"},
    {title:"자재확보",tab:"erpPlan"},
    {title:"작업지시",tab:"woIssue",openMenu:"productionMenu"},
    {title:"생산진행",tab:"prodProcess",openMenu:"productionMenu"},
    {title:"OQC",tab:"oqc",openMenu:"qualityMenu"},
    {title:"출하",tab:"erpShipping"}
  ];

  return <div className="qmes-main-dash">
    {qmesDashStyles()}
    <div className="qmd-title-row"><h1 className="qmd-title">종합 대시보드</h1><div className="qmd-subtitle">나모케미칼 운영 현황</div></div>

    <section className="qmd-card qmd-focus-card">
      <div className="qmd-focus-order">
        <div className="qmd-focus-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/></svg></div>
        <div className="qmd-focus-copy">
          <small>FOCUS ORDER · {focusOrder?qmesDashDueLabel(focusOrder.due):"등록 대기"}</small>
          <strong>{focusOrder?`${focusOrder.id} · ${focusOrder.customer} · ${focusOrder.product}`:"진행 중인 수주가 없습니다."}</strong>
          {orders.length>1&&<select className="qmd-focus-select" value={focusOrder?.id||""} onChange={event=>{const id=event.target.value;setSelectedOrderId(id);try{localStorage.setItem("qmes-dashboard-focus-order-v1",id);}catch(_error){}}} aria-label="집중 수주 선택">{orders.map(order=><option key={order.id} value={order.id}>{order.id} · {order.customer} · {order.product}</option>)}</select>}
        </div>
      </div>
      <div className="qmd-focus-track" aria-label="수주 진행 단계">
        {workflow.map((item,index)=>{const state=index===focus.current?"current":index<focus.current?"done":"pending";return <button type="button" key={item.title} className={`qmd-focus-stage ${state}`} onClick={()=>qmesDashNavigate(item.tab,item.openMenu)}><span className="qmd-focus-dot">{state==="done"?"✓":index+1}</span><span>{item.title}</span></button>;})}
      </div>
      <div className="qmd-focus-output">
        <small>현재 생산량</small>
        <strong>{qmesDashAmount(focus.actual)} / {qmesDashAmount(focus.target)} kg</strong>
        <b>계획 대비 {focus.rate.toFixed(1)}%</b>
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
