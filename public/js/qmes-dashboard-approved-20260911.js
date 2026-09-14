/* NAMO Chemical QMES approved dashboard behavior - 2026-09-11
 * Guest demo dashboard stabilizer. Keeps 1~12 month demo chart after dashboard rerenders.
 */
(function(){
  'use strict';
  if(window.__QMES_DASHBOARD_APPROVED_20260911__) return;
  window.__QMES_DASHBOARD_APPROVED_20260911__ = true;

  /* Load the full guest sandbox runtime after the legacy demo seed has loaded.
   * It is inert for normal Namo Chemical accounts and activates only for role=guest. */
  (function loadGuestSandboxRuntime(){
    if(window.__QMES_GUEST_FULL_SANDBOX_RUNTIME_20260914__)return;
    if(document.querySelector('script[data-qmes-guest-sandbox-runtime]'))return;
    var script=document.createElement('script');
    script.src='./js/qmes-guest-sandbox-runtime-20260914.js?v=20260914-fullsandbox3';
    script.async=false;
    script.dataset.qmesGuestSandboxRuntime='true';
    (document.head||document.documentElement).appendChild(script);
  })();

  var clean=function(v){return String(v==null?'':v).trim();};
  var num=function(v){if(typeof v==='number')return Number.isFinite(v)?v:0;var m=clean(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0;};
  var dateOnly=function(v){return clean(v).slice(0,10);};

  function isGuestDemo(){
    try{
      var user=JSON.parse(sessionStorage.getItem('qmes-current-user-v1')||'null');
      return !!(user&&(String(user.role||'').toLowerCase()==='guest'||String(user.id||'').toLowerCase()==='guest'||String(user.uid||'').toUpperCase()==='GUEST'));
    }catch(_error){return window.__QMES_DEMO_MODE__===true;}
  }

  function demoShipmentRows(){
    var year=new Date().getFullYear();
    var yy=String(year).slice(-2);
    var values=[1680,1920,2250,2140,2680,2410,2950,3180,2760,3320,3050,3540];
    var products=['DEMO 절연 슬러리 A','DEMO 절연 슬러리 B','DEMO Binder Solution'];
    var customers=['DEMO 고객사 A','DEMO 고객사 B','DEMO 고객사 C'];
    return values.map(function(value,index){
      var month=String(index+1).padStart(2,'0');
      var day=index%2===0?'15':'20';
      var date=year+'-'+month+'-'+day;
      return {
        shipNo:'SHIP-DEMO-'+yy+month+'-01',
        shippingNo:'SHIP-DEMO-'+yy+month+'-01',
        date:date,
        actualShipDate:date,
        customer:customers[index%customers.length],
        product:products[index%products.length],
        lot:'FG-DEMO-'+yy+month+day+'-01',
        finishedLot:'FG-DEMO-'+yy+month+day+'-01',
        qty:value,
        shipQty:value,
        unit:'kg',
        oqc:'합격',
        coa:'발행',
        delivery:'출하완료'
      };
    });
  }

  function shippingRows(){
    if(isGuestDemo())return demoShipmentRows();
    try{
      var saved=JSON.parse(localStorage.getItem('qmes-erp-shipping-v1')||'[]');
      if(Array.isArray(saved))return saved;
      if(saved&&Array.isArray(saved.rows))return saved.rows;
    }catch(_error){}
    try{if(window.DB&&Array.isArray(window.DB.shipping))return window.DB.shipping;}catch(_error2){}
    return [];
  }
  function shippingDate(row){return dateOnly(row&&(row.actualShipDate||row.shipDate||row.deliveredAt||row.deliveryAt||row.date||row.createdAt));}
  function shippingQty(row){return Math.max(0,num(row&&(row.shipQty!=null?row.shipQty:row.shippingQty!=null?row.shippingQty:row.deliveryQty!=null?row.deliveryQty:row.deliveredQty!=null?row.deliveredQty:row.quantity!=null?row.quantity:row.qty)));}
  function fmtTon(kg){return (num(kg)/1000).toLocaleString('ko-KR',{maximumFractionDigits:2});}

  function buildMonths(){
    var year=new Date().getFullYear(),months=[],map={};
    for(var i=1;i<=12;i+=1){
      var key=year+'-'+String(i).padStart(2,'0');
      var item={key:key,label:i+'월',value:0};
      months.push(item);map[key]=item;
    }
    shippingRows().forEach(function(row){var key=shippingDate(row).slice(0,7);if(map[key])map[key].value+=shippingQty(row);});
    return months;
  }

  function patchTitle(root){
    root.querySelectorAll('.ned-panel h2').forEach(function(h2){
      var text=clean(h2.textContent);
      if(text==='ERP → MES 통합 업무 흐름'||text==='ERP·MES 통합 업무 흐름'||text.indexOf('통합 업무 흐름')>=0){
        if(h2.textContent!=='통합업무 흐름')h2.textContent='통합업무 흐름';
      }
    });
  }

  function patchGuestPurchaseFlow(root){
    if(!isGuestDemo())return;
    var purchaseStep=root.querySelector('.ned-flow-step[data-tab="erpPurchase"]');
    if(!purchaseStep)return;
    var small=purchaseStep.querySelector('small');
    if(small&&clean(small.textContent)!=='0원')small.textContent='0원';
    purchaseStep.setAttribute('title','구매발주 화면 열기');
    purchaseStep.style.cursor='pointer';
  }

  function patchChart(root){
    var chart=root.querySelector('.ned-chart');
    if(!chart)return;
    var months=buildMonths();
    var max=Math.max.apply(null,[1].concat(months.map(function(x){return x.value;})));
    var signature=(isGuestDemo()?'demo-year|':'live|')+months.map(function(x){return x.key+':'+x.value;}).join('|');
    if(chart.dataset.qmesApprovedYear===signature&&chart.children.length===12)return;
    chart.innerHTML=months.map(function(item){
      var height=Math.max(3,Math.round(item.value/max*116));
      return '<div class="ned-bar-col"><span>'+fmtTon(item.value)+'</span><div class="ned-bar" style="height:'+height+'px"></div><b>'+item.label+'</b></div>';
    }).join('');
    chart.dataset.qmesApprovedYear=signature;
  }

  function apply(){
    var root=document.querySelector('.namo-enterprise-dashboard');
    if(!root)return false;
    patchTitle(root);
    patchGuestPurchaseFlow(root);
    patchChart(root);
    return true;
  }

  var applyTimer=0;
  function scheduleApply(){
    clearTimeout(applyTimer);
    applyTimer=setTimeout(apply,30);
  }
  function boundedApply(){
    [0,120,350,800,1500,3000].forEach(function(delay){setTimeout(apply,delay);});
  }
  function installDashboardObserver(){
    if(window.__QMES_DASHBOARD_APPROVED_OBSERVER__)return;
    window.__QMES_DASHBOARD_APPROVED_OBSERVER__=true;
    var start=function(){
      if(!document.body)return;
      var observer=new MutationObserver(function(mutations){
        for(var i=0;i<mutations.length;i+=1){
          var target=mutations[i].target;
          if(target&&target.nodeType===1&&(
            target.classList&&target.classList.contains('namo-enterprise-dashboard')||
            target.closest&&target.closest('.namo-enterprise-dashboard')||
            document.querySelector('.namo-enterprise-dashboard')
          )){
            scheduleApply();
            return;
          }
        }
      });
      observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    };
    if(document.body)start();
    else document.addEventListener('DOMContentLoaded',start,{once:true});
  }

  function boot(){boundedApply();installDashboardObserver();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('load',boundedApply,{once:true});
  window.addEventListener('qmes:navigate-tab',boundedApply);
  window.addEventListener('storage',function(event){if(event.key==='qmes-erp-shipping-v1')boundedApply();});
})();
