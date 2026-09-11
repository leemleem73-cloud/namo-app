/* NAMO QMES TEST dashboard layout patch - 2026-09-11
 * TEST only. Production main remains untouched.
 * Approved layout:
 *   KPI row
 *   full-width integrated workflow
 *   purchase | monthly shipping | notices
 */
(function(){
  'use strict';
  if(window.__QMES_TEST_APPROVED_DASHBOARD_LAYOUT_V2__) return;
  window.__QMES_TEST_APPROVED_DASHBOARD_LAYOUT_V2__ = true;

  var busy = false;
  var queued = false;

  function clean(v){ return String(v == null ? '' : v).trim(); }
  function num(v){
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var m = clean(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : 0;
  }
  function dateOnly(v){ return clean(v).slice(0,10); }
  function setImp(el,key,value){ if(el) el.style.setProperty(key,value,'important'); }

  function shippingRows(){
    try{
      var saved = JSON.parse(localStorage.getItem('qmes-erp-shipping-v1') || '[]');
      if(Array.isArray(saved) && saved.length) return saved;
      if(saved && Array.isArray(saved.rows) && saved.rows.length) return saved.rows;
    }catch(_error){}
    try{
      if(window.DB && Array.isArray(window.DB.shipping)) return window.DB.shipping;
    }catch(_error2){}
    return [];
  }

  function shippingDate(row){
    return dateOnly(row && (row.actualShipDate || row.shipDate || row.deliveredAt || row.deliveryAt || row.date || row.createdAt));
  }

  function shippingQty(row){
    return Math.max(0,num(row && (
      row.shipQty != null ? row.shipQty :
      row.shippingQty != null ? row.shippingQty :
      row.deliveryQty != null ? row.deliveryQty :
      row.deliveredQty != null ? row.deliveredQty :
      row.quantity != null ? row.quantity : row.qty
    )));
  }

  function yearMonths(){
    var year = new Date().getFullYear();
    var months = [];
    var map = {};
    for(var i=1;i<=12;i+=1){
      var key = year + '-' + String(i).padStart(2,'0');
      var item = {key:key,label:i+'월',value:0};
      months.push(item);
      map[key] = item;
    }
    shippingRows().forEach(function(row){
      var key = shippingDate(row).slice(0,7);
      if(map[key]) map[key].value += shippingQty(row);
    });
    return months;
  }

  function fmtTon(kg){
    return (num(kg)/1000).toLocaleString('ko-KR',{maximumFractionDigits:2});
  }

  function rebuildChart(root){
    var chart = root.querySelector('.ned-chart');
    if(!chart) return;
    var months = yearMonths();
    var max = Math.max.apply(null,[1].concat(months.map(function(x){return x.value;})));
    var signature = months.map(function(x){return x.key+':'+x.value;}).join('|');
    if(chart.dataset.qmesYearSignature === signature && chart.children.length === 12) return;
    chart.innerHTML = months.map(function(item){
      var height = Math.max(3,Math.round(item.value/max*145));
      return '<div class="ned-bar-col"><span>'+fmtTon(item.value)+'</span><div class="ned-bar" style="height:'+height+'px"></div><b>'+item.label+'</b></div>';
    }).join('');
    chart.dataset.qmesYearSignature = signature;
  }

  function tagPanels(layout){
    var flow = layout.querySelector('[data-qmes-approved-role="flow"]');
    var purchase = layout.querySelector('[data-qmes-approved-role="purchase"]');
    var chart = layout.querySelector('[data-qmes-approved-role="chart"]');
    var notice = layout.querySelector('[data-qmes-approved-role="notice"]');

    if(flow && purchase && chart && notice) return {flow:flow,purchase:purchase,chart:chart,notice:notice};

    var left = layout.querySelector('.ned-left');
    var split = left && left.querySelector('.ned-split');
    var right = layout.querySelector('.ned-right');

    if(!flow && left){
      var leftPanels = Array.from(left.children).filter(function(el){ return el.classList && el.classList.contains('ned-panel'); });
      flow = leftPanels[0] || left.querySelector('.ned-panel');
    }
    if(split){
      var bottomPanels = Array.from(split.children).filter(function(el){ return el.classList && el.classList.contains('ned-panel'); });
      purchase = purchase || bottomPanels[0] || null;
      chart = chart || bottomPanels[1] || null;
    }
    notice = notice || (right && right.querySelector('.ned-task-panel')) || null;

    if(flow) flow.setAttribute('data-qmes-approved-role','flow');
    if(purchase) purchase.setAttribute('data-qmes-approved-role','purchase');
    if(chart) chart.setAttribute('data-qmes-approved-role','chart');
    if(notice) notice.setAttribute('data-qmes-approved-role','notice');

    return {flow:flow,purchase:purchase,chart:chart,notice:notice,left:left,split:split,right:right};
  }

  function placePanels(root){
    var layout = root.querySelector('.ned-layout');
    if(!layout) return false;

    var p = tagPanels(layout);
    if(!p.flow || !p.purchase || !p.chart || !p.notice) return false;

    [p.flow,p.purchase,p.chart,p.notice].forEach(function(panel){
      if(panel.parentElement !== layout) layout.appendChild(panel);
    });

    var oldLeft = layout.querySelector('.ned-left');
    var oldRight = layout.querySelector('.ned-right');
    var oldSplit = layout.querySelector('.ned-split');
    if(oldLeft) setImp(oldLeft,'display','none');
    if(oldRight) setImp(oldRight,'display','none');
    if(oldSplit) setImp(oldSplit,'display','none');

    setImp(layout,'display','grid');
    setImp(layout,'grid-template-columns','minmax(0,1.18fr) minmax(0,1.05fr) minmax(285px,.72fr)');
    setImp(layout,'gap','14px');
    setImp(layout,'align-items','stretch');
    setImp(layout,'width','100%');

    setImp(p.flow,'grid-column','1 / -1');
    setImp(p.flow,'grid-row','1');
    setImp(p.flow,'width','100%');
    setImp(p.flow,'min-width','0');

    [p.purchase,p.chart,p.notice].forEach(function(panel,index){
      setImp(panel,'grid-column',String(index+1));
      setImp(panel,'grid-row','2');
      setImp(panel,'min-width','0');
      setImp(panel,'height','278px');
      setImp(panel,'min-height','278px');
      setImp(panel,'display','flex');
      setImp(panel,'flex-direction','column');
    });

    var tableWrap = p.purchase.querySelector('.ned-table-wrap');
    if(tableWrap){
      setImp(tableWrap,'flex','1 1 auto');
      setImp(tableWrap,'overflow','auto');
    }

    var noticeTasks = p.notice.querySelector('.ned-tasks');
    if(noticeTasks){
      setImp(noticeTasks,'flex','1 1 auto');
      setImp(noticeTasks,'min-height','0');
      setImp(noticeTasks,'overflow','auto');
    }

    var chartEl = p.chart.querySelector('.ned-chart');
    if(chartEl){
      setImp(chartEl,'flex','1 1 auto');
      setImp(chartEl,'height','auto');
      setImp(chartEl,'min-height','210px');
      setImp(chartEl,'padding','14px 12px 18px');
    }

    var flowTitle = p.flow.querySelector('h2');
    if(flowTitle) flowTitle.textContent = '통합업무 흐름';

    return true;
  }

  function apply(){
    if(busy) return;
    busy = true;
    try{
      var root = document.querySelector('.namo-enterprise-dashboard');
      if(!root) return;
      setImp(root,'min-height','calc(100vh - 58px)');
      setImp(root,'padding-bottom','18px');
      placePanels(root);
      rebuildChart(root);
    } finally {
      busy = false;
    }
  }

  function queueApply(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(function(){
      queued = false;
      apply();
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',queueApply,{once:true});
  else queueApply();

  window.addEventListener('load',queueApply);
  window.addEventListener('resize',queueApply);
  window.addEventListener('qmes:navigate-tab',function(){setTimeout(queueApply,20);setTimeout(queueApply,200);});

  var observer = new MutationObserver(queueApply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(queueApply,1500);
})();
