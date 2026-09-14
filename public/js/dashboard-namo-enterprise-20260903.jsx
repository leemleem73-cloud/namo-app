/* Namo Chemical QMES integrated dashboard - MAIN redesign 2026-09-15
 * Dashboard-only visual owner. Global header/sidebar are preserved.
 * KPI and tables use live QMES/local ERP data only; no demo values are hard-coded.
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

  function markup(data){
    var shortageNames=data.shortages.map(function(x){return x.name;}),shortageLabel=data.shortages.slice(0,3).map(function(x){return x.name;}).join(" · ")||"부족 원료 없음",flow=[
      ["수주","고객 PO / 납기","erpSales","","plan"],
      ["생산계획","월·주·일 계획","erpPlan","","plan"],
      ["MRP","Recipe 소요량","erpPlan","","plan"],
      ["구매/발주","부족원료 확보","erpPurchase","","plan"],
      ["IQC","수입검사","iqc","qualityMenu","core"],
      ["원재료 재고","RM / 위치 / LOT","inv","","core"],
      ["작업지시","생산 LOT","woIssue","productionMenu","core"],
      ["생산공정","계량/배합/충진","prodProcess","productionMenu","core"],
      ["PQC","공정검사","pqc","qualityMenu","core"],
      ["OQC / CoA","출하검사","oqc","qualityMenu","core"],
      ["출하/납품","납품완료","erpShipping","","ship"]
    ],flowHtml=flow.map(function(x){return '<button type="button" class="ned-flow-step '+x[4]+'" data-tab="'+esc(x[2])+'" data-menu="'+esc(x[3])+'"><b>'+esc(x[0])+'</b><small>'+esc(x[1])+'</small></button>';}).join(""),rowsHtml=data.tableRows.length?data.tableRows.map(function(r){var d=rowDate(r),status=productionStatus(r,shortageNames);return '<tr><td>'+esc(d?d.slice(5):"-")+'</td><td>'+esc(batchCustomer(r))+'</td><td>'+esc(batchProduct(r))+'</td><td><button type="button" class="ned-link" data-tab="prod" data-menu="productionMenu">'+esc(batchLot(r)||"-")+'</button></td><td>'+esc(fmt(batchPlan(r),1))+' kg</td><td>'+statusBadge(status)+'</td></tr>';}).join(""):'<tr><td colspan="6" class="ned-empty">이번 주 등록된 생산계획이 없습니다.</td></tr>',noticeHtml=data.notices.length?data.notices.slice(0,4).map(function(n){return '<button type="button" class="ned-task '+esc(n.tone)+'" data-tab="'+esc(n.tab||"dash")+'" data-menu="'+esc(n.openMenu||"")+'"><span><b>'+esc(n.title)+'</b><small>'+esc(n.detail||"확인 필요")+'</small></span><em>'+esc(n.action||"확인")+'</em></button>';}).join(""):'<div class="ned-task-empty">현재 실행이 필요한 알림이 없습니다.</div>';
    return '<div class="ned-page-head"><div><h1>종합 대시보드</h1><p>QMES 수주·생산·구매·품질·출하 통합 현황</p></div><div class="ned-head-actions"><button type="button" data-refresh>↻ 새로고침</button><button type="button" class="primary" data-tab="erpPlan">＋ 생산계획 등록</button></div></div>'+
      '<section class="ned-kpis">'+
        '<article class="blue"><span>금일 수주</span><strong>'+esc(fmt(data.todayOrderQty,1))+' <small>kg</small></strong><p>'+esc(data.todaySales.length)+'건 / 고객사 '+esc(data.todayCustomerCount)+'개</p></article>'+
        '<article class="orange"><span>생산 예정</span><strong>'+esc(fmt(data.planQty,1))+' <small>kg</small></strong><p>금주 작업계획 '+esc(data.planCount)+'건</p></article>'+
        '<article class="red"><span>MRP 부족 원료</span><strong>'+esc(data.shortages.length)+' <small>품목</small></strong><p>'+esc(shortageLabel)+'</p></article>'+
        '<article class="green"><span>생산 완료율</span><strong>'+esc(data.completion.toFixed(1))+'<small>%</small></strong><p>계획 대비 생산실적</p></article>'+
        '<article class="slate"><span>출하 대기</span><strong>'+esc(fmt(data.shipPendingQty,1))+' <small>kg</small></strong><p>OQC 합격·출하 진행 기준</p></article>'+
      '</section>'+
      '<section class="ned-panel ned-flow-panel"><header><h2>QMES 통합 업무 흐름</h2><span>파랑 = 기준 / 주황 = 추가</span></header><div class="ned-flow">'+flowHtml+'</div></section>'+
      '<section class="ned-bottom"><div class="ned-panel"><header><h2>금주 생산계획 / 진행현황</h2><button type="button" data-tab="erpPlan">전체보기</button></header><div class="ned-table-wrap"><table><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div></div><div class="ned-panel ned-alert-panel"><header><h2>실행 필요 알림</h2><span>'+esc(data.notices.length)+'건</span></header><div class="ned-tasks">'+noticeHtml+'</div></div></section>';
  }

  var dashboardCss=`
  .namo-enterprise-dashboard{--ink:#12233a;--muted:#708198;--line:#dbe3ec;--bg:#f2f5f9;min-height:calc(100vh - 90px);margin:-20px -24px -34px;padding:0 24px 34px;background:var(--bg);color:var(--ink);font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}
  .namo-enterprise-dashboard *{box-sizing:border-box}.qmes-ref-brand-mark{display:none!important}
  .ned-page-head{min-height:94px;display:flex;align-items:center;gap:18px;padding:18px 0 12px}.ned-page-head h1{margin:0;font-size:27px;line-height:1.15;font-weight:950;letter-spacing:-.7px;color:#10233e}.ned-page-head p{margin:8px 0 0;font-size:12px;color:#6f8097;font-weight:600}.ned-head-actions{margin-left:auto;display:flex;gap:8px;align-self:flex-start;margin-top:8px}.ned-head-actions button,.ned-panel header button{height:36px;padding:0 13px;border:1px solid #c8d4e2;border-radius:7px;background:#fff;color:#37506c;font-size:11px;font-weight:850;cursor:pointer}.ned-head-actions button.primary{height:48px;padding:0 18px;border:0;border-radius:9px;background:#2468e8;color:#fff;font-size:12px;box-shadow:0 4px 12px rgba(36,104,232,.18)}
  .ned-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px;margin:0 0 16px}.ned-kpis article{position:relative;min-width:0;height:122px;padding:22px 18px 16px;border:1px solid #dbe3ec;border-radius:14px;background:#fff;box-shadow:0 6px 18px rgba(15,35,60,.06);overflow:hidden}.ned-kpis article:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:#2f6fed}.ned-kpis article.orange{background:#fff2de}.ned-kpis article.orange:before{background:#f59e0b}.ned-kpis article.red{background:#ffe8e8}.ned-kpis article.red:before{background:#ef4444}.ned-kpis article.green{background:#dcfbe6}.ned-kpis article.green:before{background:#16a34a}.ned-kpis article.slate:before{background:#718096}.ned-kpis article>span{display:block;font-size:12px;font-weight:850;color:#57708e}.ned-kpis strong{display:block;margin-top:14px;font-size:26px;line-height:1;font-weight:950;color:#101d34;white-space:nowrap}.ned-kpis article.orange strong{color:#c45500}.ned-kpis article.red strong{color:#c51f2d}.ned-kpis article.green strong{color:#11813a}.ned-kpis strong small{font-size:16px;font-weight:850}.ned-kpis p{margin:9px 0 0;color:#93a1b4;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ned-panel{background:#fff;border:1px solid #dbe3ec;border-radius:14px;box-shadow:0 5px 16px rgba(15,35,60,.05);overflow:hidden}.ned-panel>header{min-height:54px;padding:12px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #edf1f5}.ned-panel h2{margin:0;font-size:16px;font-weight:950;color:#152238}.ned-panel header>span,.ned-panel header>button{margin-left:auto}.ned-panel header>span{font-size:10.5px;font-weight:850;color:#2468e8}.ned-flow-panel{margin-bottom:16px}.ned-flow{display:grid;grid-template-columns:repeat(11,minmax(90px,1fr));gap:20px;padding:18px 18px 22px;overflow-x:auto}.ned-flow-step{position:relative;min-width:90px;height:74px;padding:10px 7px;border-radius:11px;border:1px solid #b9daf7;background:#eef7ff;color:#10233e;cursor:pointer;text-align:center}.ned-flow-step.plan,.ned-flow-step.ship{border-color:#f2d08d;background:#fff8e9}.ned-flow-step:not(:last-child):after{content:"›";position:absolute;right:-16px;top:22px;color:#2468e8;font-size:23px;font-weight:900}.ned-flow-step b{display:block;font-size:11.5px;font-weight:950;margin-top:2px;white-space:nowrap}.ned-flow-step small{display:block;margin-top:8px;font-size:9px;color:#7c8da2;white-space:nowrap}
  .ned-bottom{display:grid;grid-template-columns:minmax(0,1.72fr) minmax(320px,1fr);gap:16px;align-items:start}.ned-table-wrap{overflow:auto}.ned-panel table{width:100%;border-collapse:collapse;font-size:11px}.ned-panel th{padding:11px 10px;background:#f7f9fb;color:#51657d;text-align:left;font-weight:900;white-space:nowrap}.ned-panel td{padding:11px 10px;border-top:1px solid #edf1f5;color:#293d55;white-space:nowrap}.ned-panel tbody tr:hover{background:#fafcff}.ned-link{border:0;background:transparent;color:#174ea6;font:inherit;font-weight:800;cursor:pointer;padding:0}.ned-status{display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:24px;padding:0 9px;border-radius:13px;font-size:9.5px;font-weight:900}.ned-status.blue{color:#1f5fc7;background:#e4efff}.ned-status.green{color:#16763b;background:#dcf8e6}.ned-status.orange{color:#b45b08;background:#fff0d8}.ned-status.red{color:#bf2437;background:#ffe3e6}.ned-status.gray{color:#65758a;background:#edf1f5}.ned-empty{padding:34px!important;text-align:center!important;color:#8a99aa!important}.ned-alert-panel{min-height:100%}.ned-tasks{display:grid;gap:10px;padding:12px 14px 16px}.ned-task{width:100%;display:flex;align-items:center;gap:10px;padding:12px 13px;border:0;border-radius:10px;text-align:left;cursor:pointer;background:#eef5ff;color:#174ea6}.ned-task.red{background:#ffeded;color:#b61d32}.ned-task.orange{background:#fff3df;color:#a85208}.ned-task.green{background:#e8f8ed;color:#16763b}.ned-task.purple{background:#f0edff;color:#6652b7}.ned-task>span{min-width:0;flex:1}.ned-task b{display:block;font-size:11.5px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ned-task small{display:block;margin-top:4px;font-size:9.5px;color:#6f8097;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ned-task em{font-size:10px;font-style:normal;font-weight:950;white-space:nowrap}.ned-task-empty{padding:36px 12px;text-align:center;color:#8391a3;font-size:11px}
  @media(max-width:1500px){.ned-kpis{gap:10px}.ned-flow{grid-template-columns:repeat(11,100px)}.ned-bottom{grid-template-columns:minmax(0,1.5fr) minmax(300px,.8fr)}}
  @media(max-width:1180px){.namo-enterprise-dashboard{margin:-20px -16px -30px;padding-left:16px;padding-right:16px}.ned-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ned-kpis article:last-child{grid-column:span 2}.ned-bottom{grid-template-columns:1fr}.ned-alert-panel{margin-top:0}}
  @media(max-width:760px){.namo-enterprise-dashboard{padding-left:10px;padding-right:10px}.ned-page-head{align-items:flex-start}.ned-page-head h1{font-size:22px}.ned-page-head p{font-size:10px}.ned-head-actions button:not(.primary){display:none}.ned-head-actions button.primary{height:40px;padding:0 11px;font-size:10px}.ned-kpis{grid-template-columns:1fr}.ned-kpis article:last-child{grid-column:auto}.ned-flow{grid-template-columns:repeat(11,105px);padding-left:12px;padding-right:12px}.ned-bottom{display:block}.ned-alert-panel{margin-top:14px}}
  `;

  function DashboardTab(){
    var rootRef=React.useRef(null),state=React.useState([]),purchases=state[0],setPurchases=state[1],revState=React.useState(0),revision=revState[0],setRevision=revState[1];
    var loadPurchases=React.useCallback(function(){return fetch("/api/purchase-orders",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():Promise.reject(new Error("purchase api"));}).then(function(p){if(p&&p.success&&Array.isArray(p.data))setPurchases(p.data);}).catch(function(){var fallback=storageRows("qmes-erp-purchase-v1");if(!fallback.length)fallback=storageRows("erp:purchase");setPurchases(fallback);});},[]);
    React.useEffect(function(){loadPurchases();var refresh=function(){setRevision(function(v){return v+1;});loadPurchases();},events=["qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete","qmes:mes-master-ready"];events.forEach(function(n){window.addEventListener(n,refresh);});var timer=window.setInterval(refresh,30000);return function(){events.forEach(function(n){window.removeEventListener(n,refresh);});window.clearInterval(timer);};},[loadPurchases]);
    var data=React.useMemo(function(){return dashboardData(purchases);},[purchases,revision]),html=React.useMemo(function(){return markup(data);},[data]);
    React.useEffect(function(){var root=rootRef.current;if(!root)return;var click=function(event){var refresh=event.target.closest("[data-refresh]");if(refresh){event.preventDefault();setRevision(function(v){return v+1;});loadPurchases();return;}var target=event.target.closest("[data-tab]");if(!target)return;event.preventDefault();navigate(target.getAttribute("data-tab"),target.getAttribute("data-menu"));};root.addEventListener("click",click);return function(){root.removeEventListener("click",click);};},[loadPurchases,html]);
    return h("div",{className:"namo-enterprise-dashboard",ref:rootRef},h("style",{dangerouslySetInnerHTML:{__html:dashboardCss}}),h("div",{dangerouslySetInnerHTML:{__html:html}}));
  }
  window.DashboardTab=DashboardTab;
})();