/* NAMO QMES TEST dashboard layout patch - 2026-09-11
 * TEST only. Keeps production main untouched.
 * Goal: approved full-screen layout
 *   KPI row
 *   full-width integrated workflow
 *   bottom 3-column row: purchase | monthly shipping | notices
 */
(function(){
  'use strict';
  if(window.__QMES_TEST_APPROVED_DASHBOARD_LAYOUT__) return;
  window.__QMES_TEST_APPROVED_DASHBOARD_LAYOUT__ = true;

  var STYLE_ID = 'qmes-test-approved-dashboard-layout-20260911';
  var busy = false;

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .namo-enterprise-dashboard.qmes-test-approved-layout{
        min-height:calc(100vh - 58px)!important;
        padding-bottom:18px!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-layout{
        display:block!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-left{
        display:block!important;
        width:100%!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-left>.ned-panel{
        width:100%!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split{
        display:grid!important;
        grid-template-columns:minmax(0,1.18fr) minmax(0,1.05fr) minmax(285px,.72fr)!important;
        gap:14px!important;
        margin-top:14px!important;
        align-items:stretch!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split>.ned-panel{
        min-width:0!important;
        min-height:272px!important;
        height:272px!important;
        display:flex!important;
        flex-direction:column!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split>.ned-panel>header{
        flex:0 0 auto!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split>.ned-panel .ned-table-wrap{
        flex:1 1 auto!important;
        overflow:auto!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split>.ned-panel .ned-chart{
        flex:1 1 auto!important;
        height:auto!important;
        min-height:205px!important;
        padding:14px 12px 18px!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split>.ned-task-panel{
        min-height:272px!important;
        height:272px!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-task-panel .ned-tasks{
        flex:1 1 auto!important;
        overflow:auto!important;
        min-height:0!important;
        padding:10px!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-task-panel .ned-task{
        padding:10px!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-right{
        display:none!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-flow{
        padding-top:15px!important;
        padding-bottom:18px!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-bar-col{
        min-width:0!important;
      }
      .namo-enterprise-dashboard.qmes-test-approved-layout .ned-bar-col>b{
        white-space:nowrap!important;
      }
      @media (max-width:1380px){
        .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split{
          grid-template-columns:minmax(0,1.12fr) minmax(0,1fr) minmax(250px,.78fr)!important;
        }
      }
      @media (max-width:1100px){
        .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split{
          grid-template-columns:1fr!important;
        }
        .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split>.ned-panel,
        .namo-enterprise-dashboard.qmes-test-approved-layout .ned-split>.ned-task-panel{
          height:auto!important;
          min-height:250px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function clean(v){ return String(v == null ? '' : v).trim(); }
  function num(v){
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var m = clean(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : 0;
  }
  function dateOnly(v){ return clean(v).slice(0,10); }
  function monthKey(y,m){ return y + '-' + String(m).padStart(2,'0'); }

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

  function buildYearMonths(){
    var now = new Date();
    var year = now.getFullYear();
    var months = [];
    var byKey = {};
    for(var m=1;m<=12;m+=1){
      var item = {key:monthKey(year,m),label:m+'월',value:0};
      months.push(item);
      byKey[item.key] = item;
    }
    shippingRows().forEach(function(row){
      var key = shippingDate(row).slice(0,7);
      if(byKey[key]) byKey[key].value += shippingQty(row);
    });
    return months;
  }

  function fmtTon(kg){
    var ton = num(kg) / 1000;
    return ton.toLocaleString('ko-KR',{maximumFractionDigits:2});
  }

  function rebuildYearChart(root){
    var chart = root.querySelector('.ned-chart');
    if(!chart) return;
    var months = buildYearMonths();
    var max = Math.max.apply(null,[1].concat(months.map(function(x){return x.value;})));
    var signature = months.map(function(x){return x.key+':'+x.value;}).join('|');
    if(chart.dataset.qmesYearSignature === signature && chart.children.length === 12) return;

    chart.innerHTML = months.map(function(item){
      var height = Math.max(3,Math.round(item.value / max * 140));
      return '<div class="ned-bar-col"><span>'+fmtTon(item.value)+'</span><div class="ned-bar" style="height:'+height+'px"></div><b>'+item.label+'</b></div>';
    }).join('');
    chart.dataset.qmesYearSignature = signature;
  }

  function apply(){
    if(busy) return;
    busy = true;
    try{
      injectStyle();
      var root = document.querySelector('.namo-enterprise-dashboard');
      if(!root) return;
      root.classList.add('qmes-test-approved-layout');

      var headings = root.querySelectorAll('.ned-panel h2');
      headings.forEach(function(h2){
        var text = clean(h2.textContent);
        if(text === 'ERP → MES 통합 업무 흐름' || text === 'ERP·MES 통합 업무 흐름' || text.indexOf('통합 업무 흐름') >= 0){
          h2.textContent = '통합업무 흐름';
        }
      });

      var layout = root.querySelector('.ned-layout');
      var left = layout && layout.querySelector('.ned-left');
      var split = left && left.querySelector('.ned-split');
      var right = layout && layout.querySelector('.ned-right');
      var notice = right && right.querySelector('.ned-task-panel');
      if(split && notice && notice.parentElement !== split){
        split.appendChild(notice);
      }
      if(right) right.style.display = 'none';

      rebuildYearChart(root);
    } finally {
      busy = false;
    }
  }

  var queued = false;
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
  window.addEventListener('qmes:navigate-tab',function(){ setTimeout(queueApply,30); setTimeout(queueApply,250); });

  var observer = new MutationObserver(queueApply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(queueApply,300);
  setTimeout(queueApply,1000);
  setTimeout(queueApply,2200);
})();
