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
    var now=new Date(),y=now.getFullYear(),rows=shippingRows(),monthly=new Array(12).fill(0);
    rows.forEach(function(r){
      var d=dateOnly(r&&(r.shipDate||r.deliveryDate||r.date||r.completedAt));
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;
      var dt=new Date(d+"T00:00:00");
      if(dt.getFullYear()===y)monthly[dt.getMonth()]+=shippingQty(r);
    });
    var buckets=monthly.map(function(qty,index){return {label:(index+1)+"월",qty:qty};});
    return {year:y,buckets:buckets,total:monthly.reduce(function(a,b){return a+b;},0)};
  }
  function icon(type){
    var paths={order:'<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h4"/>',plan:'<path d="M3 21V9l6 3V8l6 3V3h6v18H3Z"/><path d="M7 17h2m4 0h2m3 0h1"/>',material:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9m-4-14 8 4.5"/>',progress:'<path d="M4 20h16M7 16v-4m5 4V8m5 8V4"/>',shipping:'<path d="M3 5h11v12H3V5Zm11 5h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9M10 21h4"/>',arrow:'<path d="m9 6 6 6-6 6"/>'};
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(paths[type]||paths.bell)+'</svg>';
  }
  function dashboardTodayLabel(){
    var d=new Date(),days=["일","월","화","수","목","금","토"];
    return d.getFullYear()+"년 "+String(d.getMonth()+1).padStart(2,"0")+"월 "+String(d.getDate()).padStart(2,"0")+"일 ("+days[d.getDay()]+")";
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
    var peakIndex=0;ms.buckets.forEach(function(x,index){if(x.qty>ms.buckets[peakIndex].qty)peakIndex=index;});
    var shipBars=ms.buckets.map(function(x,index){var bh=Math.max(5,Math.round(x.qty/maxShip*82)),peak=index===peakIndex&&x.qty>0;return '<div class="ned-month-col'+(peak?' peak':'')+'"><div class="ned-month-bars"><i class="done" style="height:'+bh+'px"></i></div><span>'+esc(x.label)+'</span><small>'+esc(fmt(x.qty,1))+'</small></div>';}).join("");
    var qualityRate=(q.rate||0).toFixed(1);
    var qualityBlock='<div class="ned-quality-body"><div class="ned-quality-ring" style="--rate:'+qualityRate+'"><div><strong>'+qualityRate+'%</strong><span>OQC 합격률</span></div></div><div class="ned-quality-list"><p><i class="green"></i><span>OQC 합격</span><b>'+q.oqcPass+'건</b></p><p><i class="red"></i><span>OQC 불합격</span><b>'+q.oqcFail+'건</b></p><p><i class="blue"></i><span>PQC 완료</span><b>'+q.pqcDone+'건</b></p><p><i class="orange"></i><span>PQC 대기</span><b>'+q.pqcPending+'건</b></p></div></div>';
    var monthlyBlock='<div class="ned-monthly-body"><div class="ned-month-summary"><span class="ned-year-badge">'+esc(ms.year+' YEAR')+'</span><strong>'+esc(fmt(ms.total,1))+' <small>kg</small></strong><span>'+esc(ms.year+'년 누적 출하량')+'</span><em>월별 출하 실적</em></div><div class="ned-month-chart-wrap"><div class="ned-chart-grid"><i></i><i></i><i></i></div><div class="ned-month-chart">'+shipBars+'</div></div></div>';
    return '<div class="ned-page-head"><div><h1>종합 대시보드</h1><p>QMES 수주·생산·구매·품질·출하 통합 현황</p></div><div class="ned-page-date"><span>'+esc(dashboardTodayLabel())+'</span><button type="button" aria-label="오늘">오늘</button></div></div>'+
      '<section class="ned-kpis" aria-label="주요 현황">'+cards+'</section>'+
      '<section class="ned-bottom"><div class="ned-panel"><header><h2>금주 생산계획 / 진행현황</h2><button type="button" data-tab="erpPlan">전체보기 '+icon("arrow")+'</button></header><div class="ned-table-wrap"><table><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th class="ned-quantity">계획량</th><th>진행상태</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div></div><div class="ned-panel ned-alert-panel"><header><h2>즉시 처리 업무</h2><span>'+esc(data.notices.length)+'건</span></header><div class="ned-tasks">'+noticeHtml+'</div></div></section>'+
      '<section class="ned-insight-row"><div class="ned-panel ned-quality-panel"><header><h2>품질 현황</h2><button type="button" data-tab="oqc" data-menu="qualityMenu">전체보기 '+icon("arrow")+'</button></header>'+qualityBlock+'</div><div class="ned-panel ned-monthly-panel"><header><h2>1~12월 출하 현황</h2><button type="button" data-tab="erpShipping">전체보기 '+icon("arrow")+'</button></header>'+monthlyBlock+'</div></section>';
  }
  var dashboardCss=`
  .namo-enterprise-dashboard{--ink:#17304f;--muted:#7b8aa0;--line:#dfe7f0;--bg:#f3f6fa;min-height:0;margin:-22px -24px 0;padding:8px 16px 14px;background:linear-gradient(180deg,#f7f9fc 0%,#eef3f8 100%);color:var(--ink);font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}
  .namo-enterprise-dashboard *{box-sizing:border-box}
  .namo-enterprise-dashboard button{font-family:inherit}
  .namo-enterprise-dashboard svg{width:17px;height:17px;flex:none}
  .namo-enterprise-dashboard .ned-page-head{height:54px;min-height:54px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-radius:10px;background:linear-gradient(105deg,#0f4f8c 0%,#1768ad 58%,#2d7dbc 100%);box-shadow:0 7px 20px rgba(20,79,133,.18);color:#fff;position:relative;overflow:hidden}
  .namo-enterprise-dashboard .ned-page-head:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;right:-70px;top:-110px;background:rgba(255,255,255,.07)}
  .namo-enterprise-dashboard .ned-page-head>div{position:relative;z-index:1}
  .namo-enterprise-dashboard .ned-page-head h1{margin:0;font-size:19px;line-height:1.1;font-weight:760;letter-spacing:-.55px;color:#fff}
  .namo-enterprise-dashboard .ned-page-head p{margin:3px 0 0;font-size:9.5px;color:rgba(255,255,255,.78);font-weight:500}
  .namo-enterprise-dashboard .ned-page-date{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.9);font-size:9.5px;white-space:nowrap}
  .namo-enterprise-dashboard .ned-page-date button{height:26px;padding:0 9px;border:1px solid rgba(255,255,255,.35);border-radius:6px;background:rgba(255,255,255,.12);color:#fff;font-size:9px;font-weight:650;cursor:default}
  .namo-enterprise-dashboard .ned-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:9px 0}
  .namo-enterprise-dashboard .ned-kpis article{--accent:#2b73b7;--tint:#eef5fc;position:relative;min-width:0;height:88px;padding:10px 13px;border:1px solid var(--line);border-radius:9px;background:#fff;box-shadow:0 4px 12px rgba(24,52,86,.05);overflow:hidden}
  .namo-enterprise-dashboard .ned-kpis article:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--accent)}
  .namo-enterprise-dashboard .ned-kpis article.orange{--accent:#c48937;--tint:#fff6e8}
  .namo-enterprise-dashboard .ned-kpis article.red{--accent:#cf5b68;--tint:#fff0f2}
  .namo-enterprise-dashboard .ned-kpis article.green{--accent:#329077;--tint:#ebf7f2}
  .namo-enterprise-dashboard .ned-kpis article.slate{--accent:#526781;--tint:#eef2f6}
  .namo-enterprise-dashboard .ned-metric-head{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:24px}
  .namo-enterprise-dashboard .ned-metric-head>span{font-size:10.5px;font-weight:650;letter-spacing:-.15px;color:#65758b}
  .namo-enterprise-dashboard .ned-metric-icon{width:27px;height:27px;border-radius:7px;display:grid;place-items:center;background:var(--tint);color:var(--accent)}
  .namo-enterprise-dashboard .ned-metric-icon svg{width:16px;height:16px}
  .namo-enterprise-dashboard .ned-kpis strong{display:block;margin-top:1px;font-size:23px;line-height:1.08;font-weight:780;letter-spacing:-.7px;color:#17304f;font-variant-numeric:tabular-nums;white-space:nowrap}
  .namo-enterprise-dashboard .ned-kpis strong small{font-size:9.5px;letter-spacing:0;font-weight:600;color:#8996a8;margin-left:3px}
  .namo-enterprise-dashboard .ned-kpis p{margin:4px 0 0;color:#8b98aa;font-size:8.7px;line-height:1.2;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .namo-enterprise-dashboard .ned-panel{min-width:0;background:#fff;border:1px solid var(--line);border-radius:9px;box-shadow:0 4px 13px rgba(24,52,86,.045);overflow:hidden}
  .namo-enterprise-dashboard .ned-panel>header{position:static!important;height:38px!important;min-height:38px!important;padding:0 12px;display:flex!important;align-items:center;gap:10px;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)!important;border:0;border-bottom:1px solid #e9eff5;box-shadow:none!important}
  .namo-enterprise-dashboard .ned-panel h2{margin:0;font-size:12px;font-weight:740;letter-spacing:-.2px;color:#1c3859}
  .namo-enterprise-dashboard .ned-panel header>span,.namo-enterprise-dashboard .ned-panel header>button{margin-left:auto}
  .namo-enterprise-dashboard .ned-panel header>span{font-size:8.7px;font-weight:700;color:#1c5f99;background:#edf5fc;border-radius:999px;padding:4px 7px}
  .namo-enterprise-dashboard .ned-panel header button{height:25px;padding:0 7px;border:1px solid #dce6f0;border-radius:6px;background:#fff;color:#58708c;font-size:9px;font-weight:600;display:inline-flex;align-items:center;gap:3px;cursor:pointer}
  .namo-enterprise-dashboard .ned-panel header button svg{width:10px;height:10px}
  .namo-enterprise-dashboard .ned-bottom{display:grid;grid-template-columns:minmax(0,1.82fr) minmax(290px,.95fr);gap:9px;align-items:stretch}
  .namo-enterprise-dashboard .ned-table-wrap{height:181px;overflow:hidden;scrollbar-width:none}
  .namo-enterprise-dashboard .ned-panel table{width:100%;border-collapse:collapse;font-size:10px}
  .namo-enterprise-dashboard .ned-panel th{height:29px;padding:5px 9px;background:#f7f9fc;color:#78869a;text-align:left;font-size:9.1px;font-weight:650;white-space:nowrap;border-bottom:1px solid #e8eef5}
  .namo-enterprise-dashboard .ned-panel td{height:37px;padding:5px 9px;border-top:1px solid #eef3f7;color:#425774;font-weight:500;white-space:nowrap}
  .namo-enterprise-dashboard .ned-panel tbody tr:hover{background:#f8fbff}
  .namo-enterprise-dashboard .ned-panel .ned-quantity{text-align:right;font-variant-numeric:tabular-nums}
  .namo-enterprise-dashboard .ned-quantity small{font-size:8px;color:#8996a8}
  .namo-enterprise-dashboard .ned-link{border:0;background:transparent;color:#286aa6;font:inherit;font-weight:650;cursor:pointer;padding:0}
  .namo-enterprise-dashboard .ned-status{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:54px;height:21px;padding:0 8px;border-radius:999px;font-size:8.3px;font-weight:700;background:#f1f4f8;color:#67768c}
  .namo-enterprise-dashboard .ned-status:before{content:"";width:4px;height:4px;border-radius:50%;background:currentColor}
  .namo-enterprise-dashboard .ned-status.blue{color:#3772ad;background:#edf5fc}.namo-enterprise-dashboard .ned-status.green{color:#31856c;background:#ebf7f2}.namo-enterprise-dashboard .ned-status.orange{color:#a06f2d;background:#fff7e9}.namo-enterprise-dashboard .ned-status.red{color:#c24e5d;background:#fff0f2}
  .namo-enterprise-dashboard .ned-empty{padding:50px 14px!important;text-align:center!important;color:#8190a3!important}
  .namo-enterprise-dashboard .ned-tasks{height:181px;display:grid;grid-template-rows:repeat(4,1fr);gap:0;padding:3px 10px}
  .namo-enterprise-dashboard .ned-task{--accent:#4179ad;--tint:#edf5fc;width:100%;display:flex;align-items:center;gap:7px;padding:4px 0;border:0;border-bottom:1px solid #edf2f6;border-radius:0;text-align:left;cursor:pointer;background:#fff;color:#1c3859;min-width:0}
  .namo-enterprise-dashboard .ned-task:last-child{border-bottom:0}
  .namo-enterprise-dashboard .ned-task.red{--accent:#c85461;--tint:#fff0f2}.namo-enterprise-dashboard .ned-task.orange{--accent:#a87832;--tint:#fff7e9}.namo-enterprise-dashboard .ned-task.green{--accent:#33836d;--tint:#ecf7f2}.namo-enterprise-dashboard .ned-task.purple{--accent:#7566a0;--tint:#f2eff9}
  .namo-enterprise-dashboard .ned-task-icon{display:grid;place-items:center;flex:none;width:25px;height:25px;border-radius:7px;background:var(--tint);color:var(--accent)}
  .namo-enterprise-dashboard .ned-task-icon svg{width:13px;height:13px}
  .namo-enterprise-dashboard .ned-task>span{min-width:0;flex:1}
  .namo-enterprise-dashboard .ned-task b{display:block;font-size:9.3px;line-height:1.2;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .namo-enterprise-dashboard .ned-task small{display:block;margin-top:2px;font-size:7.8px;color:#8a97a9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .namo-enterprise-dashboard .ned-task em{font-size:7.8px;font-style:normal;font-weight:700;white-space:nowrap;color:var(--accent)}
  .namo-enterprise-dashboard .ned-task-empty{height:181px;display:grid;place-items:center;text-align:center;color:#8290a2;font-size:9.5px}
  .namo-enterprise-dashboard .ned-insight-row{display:grid;grid-template-columns:minmax(260px,.74fr) minmax(0,1.56fr);gap:9px;margin-top:9px}
  .namo-enterprise-dashboard .ned-quality-body{height:132px;min-height:132px;padding:8px 13px;display:grid;grid-template-columns:110px 1fr;align-items:center;gap:10px}
  .namo-enterprise-dashboard .ned-quality-ring{--rate:0;width:91px;height:91px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#2d8d75 calc(var(--rate)*1%),#e7edf4 0);position:relative}
  .namo-enterprise-dashboard .ned-quality-ring:after{content:"";position:absolute;inset:9px;border-radius:50%;background:#fff}
  .namo-enterprise-dashboard .ned-quality-ring>div{position:relative;z-index:1;text-align:center}.namo-enterprise-dashboard .ned-quality-ring strong{display:block;font-size:19px;font-weight:780;color:#1c3859}.namo-enterprise-dashboard .ned-quality-ring span{display:block;margin-top:2px;font-size:7.8px;color:#8492a4}
  .namo-enterprise-dashboard .ned-quality-list{display:grid;gap:7px}.namo-enterprise-dashboard .ned-quality-list p{margin:0;display:grid;grid-template-columns:7px 1fr auto;align-items:center;gap:6px;font-size:8.7px;color:#718096}.namo-enterprise-dashboard .ned-quality-list p>i{width:6px;height:6px;border-radius:50%}.namo-enterprise-dashboard .ned-quality-list p>i.green{background:#2fa36b}.namo-enterprise-dashboard .ned-quality-list p>i.red{background:#e04455}.namo-enterprise-dashboard .ned-quality-list p>i.blue{background:#347fd5}.namo-enterprise-dashboard .ned-quality-list p>i.orange{background:#e19a32}.namo-enterprise-dashboard .ned-quality-list b{font-size:9.5px;color:#314a69}
  .namo-enterprise-dashboard .ned-monthly-panel{background:#fff}
  .namo-enterprise-dashboard .ned-monthly-body{height:132px;min-height:132px;padding:8px 13px 10px;display:grid;grid-template-columns:135px minmax(0,1fr);gap:12px;align-items:center}
  .namo-enterprise-dashboard .ned-month-summary{align-self:center;padding:2px 0}
  .namo-enterprise-dashboard .ned-year-badge{display:inline-flex!important;width:max-content;margin:0 0 5px!important;padding:3px 6px;border:1px solid #dce7f3;border-radius:999px;background:#f5f8fc;color:#6f8097!important;font-size:7px!important;font-weight:700!important;letter-spacing:.6px}
  .namo-enterprise-dashboard .ned-month-summary strong{display:block;font-size:20px;font-weight:780;color:#1c3859;font-variant-numeric:tabular-nums;letter-spacing:-.5px}
  .namo-enterprise-dashboard .ned-month-summary strong small{font-size:8px;font-weight:600;color:#8794a6}
  .namo-enterprise-dashboard .ned-month-summary>span:not(.ned-year-badge){display:block;margin-top:3px;font-size:8px;color:#7a899c}
  .namo-enterprise-dashboard .ned-month-summary em{display:block;margin-top:6px;font-size:7.5px;font-style:normal;color:#9ba7b7}
  .namo-enterprise-dashboard .ned-month-chart-wrap{position:relative;height:95px;border-left:1px solid #e9eef4;padding-left:8px}
  .namo-enterprise-dashboard .ned-chart-grid{position:absolute;inset:5px 2px 20px 8px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
  .namo-enterprise-dashboard .ned-chart-grid i{display:block;border-top:1px dashed #e8edf3}
  .namo-enterprise-dashboard .ned-month-chart{position:relative;z-index:1;height:95px;display:grid;grid-template-columns:repeat(12,minmax(18px,1fr));gap:5px;align-items:end;padding:0 1px 4px}
  .namo-enterprise-dashboard .ned-month-col{height:90px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px}
  .namo-enterprise-dashboard .ned-month-bars{height:70px;display:flex;align-items:flex-end;justify-content:center;width:100%}
  .namo-enterprise-dashboard .ned-month-bars i.done{display:block;width:13px;min-height:4px;border-radius:4px 4px 1px 1px;background:linear-gradient(180deg,#61a5df 0%,#1f6eae 100%);box-shadow:0 2px 5px rgba(30,104,166,.14)}
  .namo-enterprise-dashboard .ned-month-col.peak .ned-month-bars i.done{background:linear-gradient(180deg,#3f8fd0 0%,#0f5792 100%)}
  .namo-enterprise-dashboard .ned-month-col span{font-size:7.3px;font-weight:600;color:#78879a;white-space:nowrap}
  .namo-enterprise-dashboard .ned-month-col small{font-size:6.5px;color:#9da9b8;white-space:nowrap}
  .namo-enterprise-dashboard button:focus-visible{outline:2px solid #4b83bb;outline-offset:2px}
  html:has(.namo-enterprise-dashboard),body:has(.namo-enterprise-dashboard),#root:has(.namo-enterprise-dashboard),#root>div:has(.namo-enterprise-dashboard),#root>div>main:has(.namo-enterprise-dashboard),.namo-enterprise-dashboard{scrollbar-width:none!important;-ms-overflow-style:none!important;scrollbar-gutter:auto!important}
  html:has(.namo-enterprise-dashboard)::-webkit-scrollbar,body:has(.namo-enterprise-dashboard)::-webkit-scrollbar,#root:has(.namo-enterprise-dashboard)::-webkit-scrollbar,#root>div:has(.namo-enterprise-dashboard)::-webkit-scrollbar,#root>div>main:has(.namo-enterprise-dashboard)::-webkit-scrollbar,.namo-enterprise-dashboard::-webkit-scrollbar,.namo-enterprise-dashboard .ned-table-wrap::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
  @media(max-width:1250px){.namo-enterprise-dashboard .ned-kpis{gap:7px}.namo-enterprise-dashboard .ned-kpis article{padding-left:10px;padding-right:10px}.namo-enterprise-dashboard .ned-bottom{grid-template-columns:minmax(0,1.6fr) minmax(270px,1fr)}}
  @media(max-width:960px){.namo-enterprise-dashboard{margin:-20px -16px 0;padding:8px 10px 14px}.namo-enterprise-dashboard .ned-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.namo-enterprise-dashboard .ned-bottom{grid-template-columns:1fr}.namo-enterprise-dashboard .ned-insight-row{grid-template-columns:1fr}.namo-enterprise-dashboard .ned-monthly-body{grid-template-columns:1fr;height:auto}.namo-enterprise-dashboard .ned-month-summary{text-align:left}}
  @media(max-width:620px){.namo-enterprise-dashboard .ned-page-head{height:50px;min-height:50px;padding:0 11px}.namo-enterprise-dashboard .ned-page-head h1{font-size:17px}.namo-enterprise-dashboard .ned-page-date{display:none}.namo-enterprise-dashboard .ned-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.namo-enterprise-dashboard .ned-kpis article:last-child{grid-column:span 2}}
  `;
  function DashboardTab(){
    var rootRef=React.useRef(null),state=React.useState([]),purchases=state[0],setPurchases=state[1],revState=React.useState(0),revision=revState[0],setRevision=revState[1];
    var loadPurchases=React.useCallback(function(){return fetch("/api/purchase-orders",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():Promise.reject(new Error("purchase api"));}).then(function(p){if(p&&p.success&&Array.isArray(p.data))setPurchases(p.data);}).catch(function(){var fallback=storageRows("qmes-erp-purchase-v1");if(!fallback.length)fallback=storageRows("erp:purchase");setPurchases(fallback);});},[]);
    React.useEffect(function(){loadPurchases();var refresh=function(){setRevision(function(v){return v+1;});loadPurchases();},events=["qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete","qmes:mes-master-ready"];events.forEach(function(n){window.addEventListener(n,refresh);});var timer=window.setInterval(refresh,30000);return function(){events.forEach(function(n){window.removeEventListener(n,refresh);});window.clearInterval(timer);};},[loadPurchases]);
    var data=React.useMemo(function(){return dashboardData(purchases);},[purchases,revision]),html=React.useMemo(function(){return markup(data);},[data]);
    React.useEffect(function(){var root=rootRef.current;if(!root)return;var click=function(event){var target=event.target.closest("[data-tab]");if(!target)return;event.preventDefault();navigate(target.getAttribute("data-tab"),target.getAttribute("data-menu"));};root.addEventListener("click",click);return function(){root.removeEventListener("click",click);};},[html]);
    return h("div",{className:"namo-enterprise-dashboard","data-dashboard-version":"20261006-premium1",ref:rootRef},h("style",{dangerouslySetInnerHTML:{__html:dashboardCss}}),h("div",{dangerouslySetInnerHTML:{__html:html}}));
  }
  window.DashboardTab=DashboardTab;
})();