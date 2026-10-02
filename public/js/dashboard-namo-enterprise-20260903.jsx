/* Namo Chemical QMES dashboard - refined visual owner 2026-10-02.
 * Existing data calculations and navigation are preserved.
 * Previous dashboard markup/styles are replaced, not layered over.
 */
(function(){
  "use strict";
  var h=React.createElement;
  var clean=function(v){return String(v==null?"":v).trim();};
  var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch];});};
  var num=function(v){if(typeof v==="number")return Number.isFinite(v)?v:0;var m=clean(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0;};
  var fmt=function(v,d){return num(v).toLocaleString("ko-KR",{maximumFractionDigits:d==null?1:d});};
  var dateOnly=function(v){return clean(v).slice(0,10);};
  var isDone=function(v){return /완료|생산완료|출하완료|납품완료|마감|취소/.test(clean(v));};
  var isPass=function(v){return /합격|적합|PASS|OK/i.test(clean(v));};
  var db=function(){try{return typeof DB!=="undefined"&&DB?DB:{}}catch(_e){return {}}};
  var storageRows=function(key){try{var x=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(x))return x;if(Array.isArray(x&&x.rows))return x.rows;}catch(_e){}return [];};
  var localDateKey=function(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  var navigate=function(tab,openMenu){window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab:tab,openMenu:openMenu||null}}));};
  var batchLot=function(r){return clean(r&&(r.no||r.lot||r.lotNo||r.finishedLot||r.productionLot||r.workOrder));};
  var batchProduct=function(r){return clean(r&&(r.product||r.item||r.productName||r.name))||"-";};
  var batchCustomer=function(r){return clean(r&&(r.customer||r.customerName||r.client||r.clientName||r.accountName))||"-";};
  var batchPlan=function(r){return Math.max(0,num(r&&(r.plan!=null?r.plan:r.planQty!=null?r.planQty:r.plannedQty!=null?r.plannedQty:r.targetQty!=null?r.targetQty:r.quantity!=null?r.quantity:r.qty)));};
  var batchActual=function(r){var lot=batchLot(r),s=db(),doc=s.woDocs&&lot?s.woDocs[lot]||{}:{};return Math.max(0,num(r&&r.done),num(r&&r.productionQty),num(r&&r.prodQty),num(r&&r.actualQty),num(doc.productionActual),num(doc.actualQty));};
  var rowDate=function(r){return dateOnly(r&&(r.productionDate||r.planDate||r.scheduledDate||r.startDate||r.date||r.orderDate||r.createdAt));};
  var shippingQty=function(r){return Math.max(0,num(r&&(r.shipQty!=null?r.shipQty:r.shippingQty!=null?r.shippingQty:r.deliveryQty!=null?r.deliveryQty:r.deliveredQty!=null?r.deliveredQty:r.quantity!=null?r.quantity:r.qty)));};
  var salesQty=function(r){return Math.max(0,num(r&&(r.orderQty!=null?r.orderQty:r.totalQty!=null?r.totalQty:r.quantity!=null?r.quantity:r.qty!=null?r.qty:r.weight)));};
  var tone=function(status){var t=clean(status);if(/부족|지연|불합격|부적합|차단|취소|이상/.test(t))return "red";if(/완료|합격|확보|마감|출하가능/.test(t))return "green";if(/준비|대기|예정|부분|검사/.test(t))return "orange";if(/진행|생산|발주|확정|발행/.test(t))return "blue";return "gray";};
  function salesRows(){return storageRows("qmes-erp-sales-v1").length?storageRows("qmes-erp-sales-v1"):storageRows("erp:sales");}
  function shippingRows(){var rows=storageRows("qmes-erp-shipping-v1");if(rows.length)return rows;try{var s=db();if(Array.isArray(s.shipping))return s.shipping;}catch(_e){}return [];}
  function planRows(){
    var keys=["qmes-erp-plan-v1","qmes-production-plan-v1","qmes-erp-production-plan-v1","erp:plan"];
    for(var i=0;i<keys.length;i++){var rows=storageRows(keys[i]);if(rows.length)return rows;}
    var s=db(),candidates=[s.productionPlans,s.plans,s.planRows,s.batches];
    for(var j=0;j<candidates.length;j++)if(Array.isArray(candidates[j])&&candidates[j].length)return candidates[j].slice();
    return [];
  }
  function mrpRows(){
    var keys=["qmes-erp-mrp-v1","qmes-mrp-v1","erp:mrp"];
    for(var i=0;i<keys.length;i++){var rows=storageRows(keys[i]);if(rows.length)return rows;}
    var s=db();return Array.isArray(s.mrp)?s.mrp.slice():Array.isArray(s.mrpRows)?s.mrpRows.slice():[];
  }
  function latestPassedLots(type){
    var s=db(),rows=Array.isArray(s.insp&&s.insp[type])?s.insp[type]:[],map=new Map();
    rows.forEach(function(r){var lot=clean(r&&r.lot);if(!lot)return;var key=dateOnly(r.date||r.shipDate)+" "+clean(r.time)+" "+clean(r.groupId||r.id),prev=map.get(lot);if(!prev||key>=prev.key)map.set(lot,{key:key,pass:isPass(r.judge||r.status)});});
    return new Set(Array.from(map.entries()).filter(function(e){return e[1].pass;}).map(function(e){return e[0];}));
  }
  function weekBounds(){
    var now=new Date(),day=now.getDay()||7,start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-day+1),end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+6);
    return {start:localDateKey(start),end:localDateKey(end)};
  }
  function chooseWeekRows(rows){
    var b=weekBounds(),dated=rows.filter(function(r){return /^\d{4}-\d{2}-\d{2}$/.test(rowDate(r));});
    if(dated.length)return dated.filter(function(r){var d=rowDate(r);return d>=b.start&&d<=b.end;});
    return rows.filter(function(r){return !isDone(r&&r.status);});
  }
  function inventoryMap(){
    var s=db(),lots=s.lots&&typeof s.lots==="object"?Object.values(s.lots):[],map=new Map();
    lots.forEach(function(r){var name=clean(r&&(r.material||r.rawMaterial||r.item||r.product||r.name));if(!name)return;var q=Math.max(0,num(r&&(r.currentQty!=null?r.currentQty:r.qty!=null?r.qty:r.amount)));map.set(name,(map.get(name)||0)+q);});
    return map;
  }
  function mrpShortages(activeBatches){
    var result=new Map();
    function add(name,need,available){name=clean(name);if(!name)return;need=Math.max(0,num(need));available=Math.max(0,num(available));var shortage=Math.max(0,need-available);if(!shortage&&need>0&&available===0)shortage=need;if(!shortage)return;var prev=result.get(name)||{name:name,shortage:0,need:0,available:0};prev.shortage+=shortage;prev.need+=need;prev.available+=available;result.set(name,prev);}
    mrpRows().forEach(function(r){
      if(Array.isArray(r&&r.shortages)){r.shortages.forEach(function(x){add(x.material||x.item||x.name,x.requiredQty||x.needQty||x.required||x.need,x.availableQty||x.stockQty||x.available||x.stock);});return;}
      var status=clean(r&&r.status),need=num(r&&(r.requiredQty!=null?r.requiredQty:r.needQty!=null?r.needQty:r.required!=null?r.required:r.need)),avail=num(r&&(r.availableQty!=null?r.availableQty:r.stockQty!=null?r.stockQty:r.available!=null?r.available:r.stock));
      if(need>avail||/부족/.test(status))add(r.material||r.item||r.name,need||num(r.shortageQty),avail);
    });
    if(!result.size){
      var inv=inventoryMap(),req=new Map(),s=db();
      activeBatches.forEach(function(b){var lot=batchLot(b),doc=s.woDocs&&lot?s.woDocs[lot]||{}:{};if(!Array.isArray(doc.inputs))return;doc.inputs.forEach(function(x){var name=clean(x&&(x.material||x.rawMaterial||x.item||x.name)),need=Math.max(0,num(x&&(x.plan!=null?x.plan:x.plannedQty!=null?x.plannedQty:x.requiredQty!=null?x.requiredQty:x.needQty)));if(name&&need)req.set(name,(req.get(name)||0)+need);});});
      req.forEach(function(need,name){add(name,need,inv.get(name)||0);});
    }
    return Array.from(result.values()).sort(function(a,b){return b.shortage-a.shortage;});
  }
  function productionStatus(r,shortageNames){
    var raw=clean(r&&r.status);if(raw)return raw;
    var product=batchProduct(r),plan=batchPlan(r),actual=batchActual(r);
    if(shortageNames.some(function(n){return product.indexOf(n)>=0;}))return "원료 부족";
    if(plan>0&&actual>=plan)return "생산 완료";
    if(actual>0)return "PQC 진행";
    return "원료 준비";
  }
  function statusBadge(status){return '<span class="ned-status '+tone(status)+'">'+esc(status||"-")+'</span>';}
  function dashboardData(purchases){
    var s=db(),batches=Array.isArray(s.batches)?s.batches.slice():[],plans=planRows(),weekPlans=chooseWeekRows(plans),weekBatches=chooseWeekRows(batches),activeBatches=batches.filter(function(r){return !isDone(r&&r.status);}),sales=salesRows(),ship=shippingRows(),today=localDateKey(new Date()),todaySales=sales.filter(function(r){return !/취소/.test(clean(r.status))&&dateOnly(r.orderDate||r.date||r.createdAt)===today;}),shortages=mrpShortages(activeBatches),pqcPassed=latestPassedLots("PQC"),oqcPassed=latestPassedLots("OQC"),pqcPending=activeBatches.filter(function(r){return batchActual(r)>0&&batchLot(r)&&!pqcPassed.has(batchLot(r));}),oqcPending=activeBatches.filter(function(r){return batchActual(r)>0&&batchLot(r)&&!oqcPassed.has(batchLot(r));}),shipPending=ship.filter(function(r){return !isDone(r.delivery||r.status||r.shipping);}),planBasis=weekPlans.length?weekPlans:weekBatches,progressBasis=weekBatches.length?weekBatches:planBasis,planQty=planBasis.reduce(function(sum,r){return sum+batchPlan(r);},0),actualQty=progressBasis.reduce(function(sum,r){return sum+batchActual(r);},0),completion=planQty>0?Math.min(100,actualQty/planQty*100):0,orderQty=todaySales.reduce(function(sum,r){return sum+salesQty(r);},0),customerCount=new Set(todaySales.map(function(r){return clean(r.customer||r.customerName||r.client||r.accountName);}).filter(Boolean)).size,shipPendingQty=shipPending.reduce(function(sum,r){return sum+shippingQty(r);},0),overdue=purchases.filter(function(r){var due=dateOnly(r.confirmedDueDate||r.expected||r.requestedDueDate||r.due);return due&&due<today&&!/입고완료|마감|취소/.test(clean(r.status));}),notices=[];
    if(shortages[0])notices.push({tone:"red",title:shortages[0].name+" 재고 "+fmt(shortages[0].shortage,1)+"kg 부족",detail:"생산계획 기준 부족 원료 확인",action:"발주 필요",tab:"erpPurchase"});
    if(overdue[0])notices.push({tone:"orange",title:clean(overdue[0].item||overdue[0].material||"원료")+" 입고예정일 확인",detail:[overdue[0].purchaseNo||overdue[0].id,overdue[0].supplier].filter(Boolean).join(" · ")||"구매/발주 납기 확인",action:dateOnly(overdue[0].confirmedDueDate||overdue[0].expected||overdue[0].requestedDueDate||overdue[0].due).slice(5),tab:"erpPurchase"});
    if(pqcPending[0])notices.push({tone:"blue",title:"LOT "+batchLot(pqcPending[0])+" PQC 대기",detail:batchProduct(pqcPending[0]),action:"검사실",tab:"pqc",openMenu:"qualityMenu"});
    if(shipPending[0])notices.push({tone:"orange",title:(clean(shipPending[0].customer)||"고객사")+" 출하 예정",detail:[clean(shipPending[0].lot||shipPending[0].workOrder),clean(shipPending[0].item||shipPending[0].product)].filter(Boolean).join(" · ")||"출하/납품 일정 확인",action:dateOnly(shipPending[0].due||shipPending[0].requestedDueDate||shipPending[0].shipDate).slice(5)||"확인",tab:"erpShipping"});
    if(notices.length<4&&oqcPending[0])notices.push({tone:"purple",title:"LOT "+batchLot(oqcPending[0])+" OQC 대기",detail:batchProduct(oqcPending[0]),action:"검사실",tab:"oqc",openMenu:"qualityMenu"});
    return {batches:batches,plans:plans,weekPlans:weekPlans,weekBatches:weekBatches,tableRows:(weekPlans.length?weekPlans:weekBatches).slice().sort(function(a,b){return rowDate(a).localeCompare(rowDate(b));}).slice(0,5),todaySales:todaySales,todayOrderQty:orderQty,todayCustomerCount:customerCount,planQty:planQty,planCount:planBasis.length,actualQty:actualQty,completion:completion,shortages:shortages,shipPending:shipPending,shipPendingQty:shipPendingQty,pqcPending:pqcPending,oqcPending:oqcPending,notices:notices,purchases:purchases};
  }
  function qualitySummary(){
    var s=db(),insp=s.insp&&typeof s.insp==="object"?s.insp:{};
    var oqc=Array.isArray(insp.OQC)?insp.OQC:[],pqc=Array.isArray(insp.PQC)?insp.PQC:[];
    var oqcPass=oqc.filter(function(r){return isPass(r&&(r.judge||r.status));}).length;
    var oqcFail=oqc.filter(function(r){return /불합격|부적합|FAIL|NG/i.test(clean(r&&(r.judge||r.status)));}).length;
    var pqcDone=pqc.filter(function(r){return isPass(r&&(r.judge||r.status));}).length;
    var pqcPending=pqc.filter(function(r){var v=clean(r&&(r.judge||r.status));return !isPass(v)&&!/불합격|부적합|FAIL|NG/i.test(v);}).length;
    var total=oqcPass+oqcFail,rate=total>0?oqcPass/total*100:0;
    return {oqcPass:oqcPass,oqcFail:oqcFail,pqcDone:pqcDone,pqcPending:pqcPending,rate:rate};
  }
  function monthlyShipping(){
    var now=new Date(),y=now.getFullYear(),m=now.getMonth(),days=new Date(y,m+1,0).getDate();
    var rows=shippingRows(),daily=new Array(days).fill(0);
    rows.forEach(function(r){
      var d=dateOnly(r&&(r.shipDate||r.deliveryDate||r.date||r.completedAt));
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;
      var dt=new Date(d+"T00:00:00");
      if(dt.getFullYear()===y&&dt.getMonth()===m)daily[dt.getDate()-1]+=shippingQty(r);
    });
    var buckets=[],step=Math.ceil(days/7);
    for(var start=1;start<=days;start+=step){
      var end=Math.min(days,start+step-1),qty=0;
      for(var day=start;day<=end;day++)qty+=daily[day-1];
      buckets.push({label:start===end?String(start):start+"-"+end,qty:qty});
    }
    return {month:(m+1)+"월",buckets:buckets,total:daily.reduce(function(a,b){return a+b;},0)};
  }
  function icon(type){
    var paths={order:'<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h4"/>',plan:'<path d="M3 21V9l6 3V8l6 3V3h6v18H3Z"/><path d="M7 17h2m4 0h2m3 0h1"/>',material:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9m-4-14 8 4.5"/>',progress:'<path d="M4 20h16M7 16v-4m5 4V8m5 8V4"/>',shipping:'<path d="M3 5h11v12H3V5Zm11 5h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9M10 21h4"/>',arrow:'<path d="m9 6 6 6-6 6"/>'};
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(paths[type]||paths.bell)+'</svg>';
  }
  function markup(data){
    var shortageNames=data.shortages.map(function(x){return x.name;}),shortageLabel=data.shortages.slice(0,3).map(function(x){return x.name;}).join(" · ")||"부족 원료 없음";
    var rowsHtml=data.tableRows.length?data.tableRows.map(function(r){var d=rowDate(r),status=productionStatus(r,shortageNames);return '<tr><td>'+esc(d?d.slice(5):"-")+'</td><td>'+esc(batchCustomer(r))+'</td><td>'+esc(batchProduct(r))+'</td><td><button type="button" class="ned-link" data-tab="prod" data-menu="productionMenu">'+esc(batchLot(r)||"-")+'</button></td><td class="ned-quantity">'+esc(fmt(batchPlan(r),1))+' <small>kg</small></td><td>'+statusBadge(status)+'</td></tr>';}).join(""):'<tr><td colspan="6" class="ned-empty">이번 주 등록된 생산계획이 없습니다.</td></tr>';
    var noticeHtml=data.notices.length?data.notices.slice(0,4).map(function(n){return '<button type="button" class="ned-task '+esc(n.tone)+'" data-tab="'+esc(n.tab||"dash")+'" data-menu="'+esc(n.openMenu||"")+'"><i class="ned-task-icon">'+icon("bell")+'</i><span><b>'+esc(n.title)+'</b><small>'+esc(n.detail||"확인 필요")+'</small></span><em>'+esc(n.action||"확인")+'</em></button>';}).join(""):'<div class="ned-task-empty">현재 실행이 필요한 알림이 없습니다.</div>';
    var metrics=[
      ["blue","order","금일 수주",fmt(data.todayOrderQty,1),"kg",data.todaySales.length+"건 / 고객사 "+data.todayCustomerCount+"개"],
      ["orange","plan","생산 예정",fmt(data.planQty,1),"kg","금주 작업계획 "+data.planCount+"건"],
      ["red","material","MRP 부족 원료",String(data.shortages.length),"품목",shortageLabel],
      ["green","progress","생산 완료율",data.completion.toFixed(1),"%","계획 대비 생산실적"],
      ["slate","shipping","출하 대기",fmt(data.shipPendingQty,1),"kg","OQC 합격·출하 진행 기준"]
    ];
    var cards=metrics.map(function(m){return '<article class="'+m[0]+'"><div class="ned-metric-head"><span>'+esc(m[2])+'</span><i class="ned-metric-icon">'+icon(m[1])+'</i></div><strong>'+esc(m[3])+' <small>'+esc(m[4])+'</small></strong><p>'+esc(m[5])+'</p></article>';}).join("");
    var q=qualitySummary(),ms=monthlyShipping(),maxShip=Math.max.apply(null,ms.buckets.map(function(x){return x.qty;}).concat([1]));
    var shipBars=ms.buckets.map(function(x){var bh=Math.max(6,Math.round(x.qty/maxShip*96));return '<div class="ned-month-col"><div class="ned-month-bars"><i class="done" style="height:'+bh+'px"></i></div><span>'+esc(x.label)+'</span><small>'+esc(fmt(x.qty,1))+'</small></div>';}).join("");
    var qualityRate=(q.rate||0).toFixed(1);
    var qualityBlock='<div class="ned-quality-body"><div class="ned-quality-ring" style="--rate:'+qualityRate+'"><div><strong>'+qualityRate+'%</strong><span>OQC 합격률</span></div></div><div class="ned-quality-list"><p><i class="green"></i><span>OQC 합격</span><b>'+q.oqcPass+'건</b></p><p><i class="red"></i><span>OQC 불합격</span><b>'+q.oqcFail+'건</b></p><p><i class="blue"></i><span>PQC 완료</span><b>'+q.pqcDone+'건</b></p><p><i class="orange"></i><span>PQC 대기</span><b>'+q.pqcPending+'건</b></p></div></div>';
    var monthlyBlock='<div class="ned-monthly-body"><div class="ned-month-summary"><strong>'+esc(fmt(ms.total,1))+' <small>kg</small></strong><span>'+esc(ms.month)+' 누적 출하량</span></div><div class="ned-month-chart">'+shipBars+'</div></div>';
    return '<div class="ned-page-head"><div><h1>종합 대시보드</h1><p>QMES 수주·생산·구매·품질·출하 통합 현황</p></div></div>'+
      '<section class="ned-kpis" aria-label="주요 현황">'+cards+'</section>'+
      '<section class="ned-bottom"><div class="ned-panel"><header><h2>금주 생산계획 / 진행현황</h2><button type="button" data-tab="erpPlan">전체보기 '+icon("arrow")+'</button></header><div class="ned-table-wrap"><table><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th class="ned-quantity">계획량</th><th>진행상태</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div></div><div class="ned-panel ned-alert-panel"><header><h2>즉시 처리 업무</h2><span>'+esc(data.notices.length)+'건</span></header><div class="ned-tasks">'+noticeHtml+'</div></div></section>'+
      '<section class="ned-insight-row"><div class="ned-panel ned-quality-panel"><header><h2>품질 현황</h2><button type="button" data-tab="oqc" data-menu="qualityMenu">전체보기 '+icon("arrow")+'</button></header>'+qualityBlock+'</div><div class="ned-panel ned-monthly-panel"><header><h2>'+esc(ms.month)+' 월간 출하 현황</h2><button type="button" data-tab="erpShipping">전체보기 '+icon("arrow")+'</button></header>'+monthlyBlock+'</div></section>';
  }
  var dashboardCss=`
  .namo-enterprise-dashboard{--ink:#182b45;--muted:#738197;--line:#e2e8f0;--bg:#f4f6f9;min-height:0;margin:-20px -24px 0;padding:18px 24px 24px;background:var(--bg);color:var(--ink);font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}
  .namo-enterprise-dashboard *{box-sizing:border-box}
  .namo-enterprise-dashboard button{font-family:inherit}
  .namo-enterprise-dashboard svg{width:20px;height:20px;flex:none}
  .namo-enterprise-dashboard .ned-page-head{min-height:66px;display:flex;align-items:center;padding:0 0 16px}
  .namo-enterprise-dashboard .ned-page-head h1{margin:0;font-size:25px;line-height:1.25;font-weight:750;letter-spacing:-.8px;color:var(--ink)}
  .namo-enterprise-dashboard .ned-page-head p{margin:6px 0 0;font-size:12px;color:var(--muted);font-weight:450}
  .namo-enterprise-dashboard .ned-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin:0 0 20px}
  .namo-enterprise-dashboard .ned-kpis article{--accent:#416eac;--tint:#edf3fa;position:relative;min-width:0;height:140px;padding:16px 19px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 3px 12px rgba(24,43,69,.035);overflow:hidden}
  .namo-enterprise-dashboard .ned-kpis article.orange{--accent:#ad7938;--tint:#faf4ea}
  .namo-enterprise-dashboard .ned-kpis article.red{--accent:#b65a64;--tint:#faf0f2}
  .namo-enterprise-dashboard .ned-kpis article.green{--accent:#368773;--tint:#edf6f2}
  .namo-enterprise-dashboard .ned-kpis article.slate{--accent:#66758c;--tint:#f0f3f7}
  .namo-enterprise-dashboard .ned-metric-head{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px}
  .namo-enterprise-dashboard .ned-metric-head>span{font-size:12px;font-weight:600;letter-spacing:-.2px;color:#566880}
  .namo-enterprise-dashboard .ned-metric-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--tint);color:var(--accent)}
  .namo-enterprise-dashboard .ned-metric-icon svg{width:19px;height:19px}
  .namo-enterprise-dashboard .ned-kpis strong{display:block;margin-top:10px;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.8px;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}
  .namo-enterprise-dashboard .ned-kpis strong small{font-size:12px;letter-spacing:0;font-weight:500;color:#7b899c;margin-left:3px}
  .namo-enterprise-dashboard .ned-kpis p{margin:9px 0 0;color:#7b889a;font-size:10.5px;line-height:1.4;font-weight:450;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .namo-enterprise-dashboard .ned-panel{min-width:0;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 3px 14px rgba(24,43,69,.025);overflow:hidden}
  .namo-enterprise-dashboard .ned-panel>header{position:static!important;min-height:60px;height:auto!important;padding:13px 20px;display:flex!important;align-items:center;gap:12px;background:#fff!important;border:0;border-bottom:1px solid #edf1f5;box-shadow:none!important}
  .namo-enterprise-dashboard .ned-panel h2{margin:0;font-size:15px;font-weight:700;letter-spacing:-.3px;color:var(--ink)}
  .namo-enterprise-dashboard .ned-panel header>span,.namo-enterprise-dashboard .ned-panel header>button{margin-left:auto}
  .namo-enterprise-dashboard .ned-panel header>span{font-size:11px;font-weight:600;color:#526b8f;background:#f0f4f9;border-radius:7px;padding:5px 8px}
  .namo-enterprise-dashboard .ned-panel header button{height:32px;padding:0 10px;border:1px solid #e1e7ef;border-radius:7px;background:#fff;color:#5f7390;font-size:11px;font-weight:550;display:inline-flex;align-items:center;gap:4px;cursor:pointer}
  .namo-enterprise-dashboard .ned-panel header button svg{width:13px;height:13px}
  .namo-enterprise-dashboard .ned-bottom{display:grid;grid-template-columns:minmax(0,1.85fr) minmax(310px,1fr);gap:18px;align-items:stretch}
  .namo-enterprise-dashboard .ned-table-wrap{overflow:auto;scrollbar-width:none;-ms-overflow-style:none}
  .namo-enterprise-dashboard .ned-panel table{width:100%;border-collapse:collapse;font-size:12px}
  .namo-enterprise-dashboard .ned-panel th{height:40px;padding:10px 14px;background:#f8fafc;color:#758398;text-align:left;font-size:11px;font-weight:550;white-space:nowrap;border-bottom:1px solid #edf1f5}
  .namo-enterprise-dashboard .ned-panel td{height:48px;padding:10px 14px;border-top:1px solid #f0f3f6;color:#40536d;font-weight:450;white-space:nowrap}
  .namo-enterprise-dashboard .ned-panel tbody tr:hover{background:#f8fafc}
  .namo-enterprise-dashboard .ned-panel .ned-quantity{text-align:right;font-variant-numeric:tabular-nums}
  .namo-enterprise-dashboard .ned-quantity small{font-size:10px;color:#8190a3}
  .namo-enterprise-dashboard .ned-link{border:0;background:transparent;color:#426b9f;font:inherit;font-weight:550;cursor:pointer;padding:0}
  .namo-enterprise-dashboard .ned-link:hover{text-decoration:underline}
  .namo-enterprise-dashboard .ned-status{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:58px;height:25px;padding:0 9px;border-radius:6px;font-size:10px;font-weight:550;background:#f1f4f8;color:#67768c}
  .namo-enterprise-dashboard .ned-status:before{content:"";width:4px;height:4px;border-radius:50%;background:currentColor}
  .namo-enterprise-dashboard .ned-status.blue{color:#4976ad;background:#eef4fb}.namo-enterprise-dashboard .ned-status.green{color:#3f8673;background:#eef6f2}.namo-enterprise-dashboard .ned-status.orange{color:#a47a44;background:#faf5ec}.namo-enterprise-dashboard .ned-status.red{color:#b45c68;background:#fbf0f2}
  .namo-enterprise-dashboard .ned-empty{padding:52px 18px!important;text-align:center!important;color:#7b899c!important}
  .namo-enterprise-dashboard .ned-tasks{display:grid;gap:0;padding:3px 18px 8px}
  .namo-enterprise-dashboard .ned-task{--accent:#587ca9;--tint:#eff4fa;width:100%;min-height:70px;display:flex;align-items:center;gap:10px;padding:12px 0;border:0;border-bottom:1px solid #f0f3f6;border-radius:0;text-align:left;cursor:pointer;background:#fff;color:var(--ink)}
  .namo-enterprise-dashboard .ned-task:last-child{border-bottom:0}
  .namo-enterprise-dashboard .ned-task.red{--accent:#b45e68;--tint:#faf0f2}.namo-enterprise-dashboard .ned-task.orange{--accent:#a67d45;--tint:#faf5ec}.namo-enterprise-dashboard .ned-task.green{--accent:#418573;--tint:#eff6f2}.namo-enterprise-dashboard .ned-task.purple{--accent:#7b70a1;--tint:#f3f1f8}
  .namo-enterprise-dashboard .ned-task-icon{display:grid;place-items:center;flex:none;width:32px;height:32px;border-radius:9px;background:var(--tint);color:var(--accent)}
  .namo-enterprise-dashboard .ned-task-icon svg{width:17px;height:17px}
  .namo-enterprise-dashboard .ned-task>span{min-width:0;flex:1}
  .namo-enterprise-dashboard .ned-task b{display:block;font-size:12px;line-height:1.4;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .namo-enterprise-dashboard .ned-task small{display:block;margin-top:4px;font-size:10px;color:#8793a4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .namo-enterprise-dashboard .ned-task em{font-size:10px;font-style:normal;font-weight:550;white-space:nowrap;color:var(--accent)}
  .namo-enterprise-dashboard .ned-task:hover{background:#fafbfd}
  .namo-enterprise-dashboard .ned-task-empty{padding:52px 12px;text-align:center;color:#7b899c;font-size:12px}
  .namo-enterprise-dashboard .ned-insight-row{display:grid;grid-template-columns:minmax(320px,.8fr) minmax(0,1.5fr);gap:18px;margin-top:18px}
  .namo-enterprise-dashboard .ned-quality-body{min-height:190px;padding:18px 22px;display:grid;grid-template-columns:140px 1fr;align-items:center;gap:18px}
  .namo-enterprise-dashboard .ned-quality-ring{--rate:0;width:126px;height:126px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#2f7be5 calc(var(--rate)*1%),#e9eef5 0);position:relative}
  .namo-enterprise-dashboard .ned-quality-ring:after{content:"";position:absolute;inset:13px;border-radius:50%;background:#fff}
  .namo-enterprise-dashboard .ned-quality-ring>div{position:relative;z-index:1;text-align:center}.namo-enterprise-dashboard .ned-quality-ring strong{display:block;font-size:24px;font-weight:750;color:#203c61}.namo-enterprise-dashboard .ned-quality-ring span{display:block;margin-top:4px;font-size:10px;color:#8290a2}
  .namo-enterprise-dashboard .ned-quality-list{display:grid;gap:11px}.namo-enterprise-dashboard .ned-quality-list p{margin:0;display:grid;grid-template-columns:8px 1fr auto;align-items:center;gap:8px;font-size:11px;color:#617087}.namo-enterprise-dashboard .ned-quality-list p>i{width:7px;height:7px;border-radius:50%}.namo-enterprise-dashboard .ned-quality-list p>i.green{background:#2fa36b}.namo-enterprise-dashboard .ned-quality-list p>i.red{background:#e04455}.namo-enterprise-dashboard .ned-quality-list p>i.blue{background:#347fd5}.namo-enterprise-dashboard .ned-quality-list p>i.orange{background:#e19a32}.namo-enterprise-dashboard .ned-quality-list b{font-size:12px;color:#314a69}
  .namo-enterprise-dashboard .ned-monthly-body{min-height:190px;padding:16px 22px 18px;display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:end}.namo-enterprise-dashboard .ned-month-summary{align-self:center}.namo-enterprise-dashboard .ned-month-summary strong{display:block;font-size:25px;font-weight:750;color:#203c61;font-variant-numeric:tabular-nums}.namo-enterprise-dashboard .ned-month-summary strong small{font-size:11px;font-weight:550;color:#8290a2}.namo-enterprise-dashboard .ned-month-summary span{display:block;margin-top:6px;font-size:10px;color:#8290a2}
  .namo-enterprise-dashboard .ned-month-chart{height:135px;display:grid;grid-template-columns:repeat(7,minmax(28px,1fr));gap:10px;align-items:end;border-bottom:1px solid #e7edf4;padding:0 4px 10px}.namo-enterprise-dashboard .ned-month-col{height:124px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px}.namo-enterprise-dashboard .ned-month-bars{height:98px;display:flex;align-items:flex-end;justify-content:center}.namo-enterprise-dashboard .ned-month-bars i.done{display:block;width:18px;min-height:5px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#70a9ee,#397bd0)}.namo-enterprise-dashboard .ned-month-col span{font-size:9px;color:#74839a;white-space:nowrap}.namo-enterprise-dashboard .ned-month-col small{font-size:8px;color:#9aa5b3;white-space:nowrap}
  @media(max-width:960px){.namo-enterprise-dashboard .ned-insight-row{grid-template-columns:1fr}.namo-enterprise-dashboard .ned-monthly-body{grid-template-columns:1fr}.namo-enterprise-dashboard .ned-month-summary{text-align:left}}
  .namo-enterprise-dashboard button:focus-visible{outline:2px solid #5a83b9;outline-offset:2px}
  /* Hide only dashboard scrollbars; wheel, touch and keyboard scrolling stay usable. */
  html:has(.namo-enterprise-dashboard),body:has(.namo-enterprise-dashboard),#root:has(.namo-enterprise-dashboard),#root>div:has(.namo-enterprise-dashboard),#root>div>main:has(.namo-enterprise-dashboard),.namo-enterprise-dashboard{scrollbar-width:none!important;-ms-overflow-style:none!important;scroll-behavior:auto!important;scrollbar-gutter:auto!important}
  html:has(.namo-enterprise-dashboard)::-webkit-scrollbar,body:has(.namo-enterprise-dashboard)::-webkit-scrollbar,#root:has(.namo-enterprise-dashboard)::-webkit-scrollbar,#root>div:has(.namo-enterprise-dashboard)::-webkit-scrollbar,#root>div>main:has(.namo-enterprise-dashboard)::-webkit-scrollbar,.namo-enterprise-dashboard::-webkit-scrollbar,.namo-enterprise-dashboard .ned-table-wrap::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
  @media(max-width:1250px){.namo-enterprise-dashboard .ned-kpis{gap:10px}.namo-enterprise-dashboard .ned-kpis article{padding:14px;height:134px}.namo-enterprise-dashboard .ned-kpis strong{font-size:25px}.namo-enterprise-dashboard .ned-bottom{grid-template-columns:minmax(0,1.65fr) minmax(285px,1fr);gap:14px}.namo-enterprise-dashboard .ned-panel th,.namo-enterprise-dashboard .ned-panel td{padding-left:10px;padding-right:10px}}
  @media(max-width:960px){.namo-enterprise-dashboard{margin:-20px -16px 0;padding:16px}.namo-enterprise-dashboard .ned-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.namo-enterprise-dashboard .ned-bottom{grid-template-columns:1fr}.namo-enterprise-dashboard .ned-tasks{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:18px}}
  @media(max-width:620px){.namo-enterprise-dashboard{padding:14px 10px}.namo-enterprise-dashboard .ned-page-head h1{font-size:22px}.namo-enterprise-dashboard .ned-page-head p{font-size:10px}.namo-enterprise-dashboard .ned-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.namo-enterprise-dashboard .ned-kpis article:last-child{grid-column:span 2}.namo-enterprise-dashboard .ned-tasks{grid-template-columns:1fr}.namo-enterprise-dashboard .ned-panel>header{padding:12px 14px}.namo-enterprise-dashboard .ned-panel h2{font-size:13px}}
  `;
  function DashboardTab(){
    var rootRef=React.useRef(null),state=React.useState([]),purchases=state[0],setPurchases=state[1],revState=React.useState(0),revision=revState[0],setRevision=revState[1];
    var loadPurchases=React.useCallback(function(){return fetch("/api/purchase-orders",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():Promise.reject(new Error("purchase api"));}).then(function(p){if(p&&p.success&&Array.isArray(p.data))setPurchases(p.data);}).catch(function(){var fallback=storageRows("qmes-erp-purchase-v1");if(!fallback.length)fallback=storageRows("erp:purchase");setPurchases(fallback);});},[]);
    React.useEffect(function(){loadPurchases();var refresh=function(){setRevision(function(v){return v+1;});loadPurchases();},events=["qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete","qmes:mes-master-ready"];events.forEach(function(n){window.addEventListener(n,refresh);});var timer=window.setInterval(refresh,30000);return function(){events.forEach(function(n){window.removeEventListener(n,refresh);});window.clearInterval(timer);};},[loadPurchases]);
    var data=React.useMemo(function(){return dashboardData(purchases);},[purchases,revision]),html=React.useMemo(function(){return markup(data);},[data]);
    React.useEffect(function(){var root=rootRef.current;if(!root)return;var click=function(event){var target=event.target.closest("[data-tab]");if(!target)return;event.preventDefault();navigate(target.getAttribute("data-tab"),target.getAttribute("data-menu"));};root.addEventListener("click",click);return function(){root.removeEventListener("click",click);};},[html]);
    return h("div",{className:"namo-enterprise-dashboard","data-dashboard-version":"20261002-refined1",ref:rootRef},h("style",{dangerouslySetInnerHTML:{__html:dashboardCss}}),h("div",{dangerouslySetInnerHTML:{__html:html}}));
  }
  window.DashboardTab=DashboardTab;
})();