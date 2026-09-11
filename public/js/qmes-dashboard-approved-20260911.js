/* NAMO Chemical QMES approved dashboard behavior - 2026-09-11
 * Lightweight bounded patch. No MutationObserver and no permanent interval.
 */
(function(){
  'use strict';
  if(window.__QMES_DASHBOARD_APPROVED_20260911__) return;
  window.__QMES_DASHBOARD_APPROVED_20260911__ = true;

  var clean=function(v){return String(v==null?'':v).trim();};
  var num=function(v){if(typeof v==='number')return Number.isFinite(v)?v:0;var m=clean(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0;};
  var dateOnly=function(v){return clean(v).slice(0,10);};

  function shippingRows(){
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
        h2.textContent='통합업무 흐름';
      }
    });
  }

  function patchChart(root){
    var chart=root.querySelector('.ned-chart');
    if(!chart)return;
    var months=buildMonths();
    var max=Math.max.apply(null,[1].concat(months.map(function(x){return x.value;})));
    var signature=months.map(function(x){return x.key+':'+x.value;}).join('|');
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
    patchChart(root);
    return true;
  }

  function boundedApply(){
    [0,120,350,800,1500].forEach(function(delay){setTimeout(apply,delay);});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boundedApply,{once:true});
  else boundedApply();
  window.addEventListener('load',boundedApply,{once:true});
  window.addEventListener('qmes:navigate-tab',boundedApply);
  window.addEventListener('storage',function(event){if(event.key==='qmes-erp-shipping-v1')boundedApply();});
})();
