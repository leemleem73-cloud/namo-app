(function(){
  'use strict';
  if(window.__QMES_DASHBOARD_LAYOUT_20260911__)return;
  window.__QMES_DASHBOARD_LAYOUT_20260911__=true;

  const STYLE_ID='qmes-dashboard-layout-20260911';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const m=clean(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0;};
  const dateOnly=v=>clean(v).slice(0,10);

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .namo-enterprise-dashboard .ned-layout{
        display:grid!important;
        grid-template-columns:minmax(0,1.18fr) minmax(0,1.05fr) minmax(285px,.72fr)!important;
        gap:14px!important;
        align-items:stretch!important;
        width:100%!important;
      }
      .namo-enterprise-dashboard .ned-layout>.ned-left,
      .namo-enterprise-dashboard .ned-layout>.ned-right,
      .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split{
        display:contents!important;
      }
      .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-panel{
        grid-column:1/-1!important;
        grid-row:1!important;
        min-width:0!important;
        width:100%!important;
      }
      .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel:nth-child(1){
        grid-column:1!important;
        grid-row:2!important;
      }
      .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel:nth-child(2){
        grid-column:2!important;
        grid-row:2!important;
      }
      .namo-enterprise-dashboard .ned-layout>.ned-right>.ned-task-panel{
        grid-column:3!important;
        grid-row:2!important;
      }
      .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel,
      .namo-enterprise-dashboard .ned-layout>.ned-right>.ned-task-panel{
        min-width:0!important;
        min-height:250px!important;
        height:clamp(250px,31vh,320px)!important;
        display:flex!important;
        flex-direction:column!important;
        margin-top:0!important;
      }
      .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel>header,
      .namo-enterprise-dashboard .ned-layout>.ned-right>.ned-task-panel>header{
        flex:0 0 auto!important;
      }
      .namo-enterprise-dashboard .ned-table-wrap{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
      }
      .namo-enterprise-dashboard .ned-chart{
        flex:1 1 auto!important;
        height:auto!important;
        min-height:190px!important;
        padding:14px 12px 18px!important;
      }
      .namo-enterprise-dashboard .ned-tasks{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
      }
      .namo-enterprise-dashboard .ned-flow{
        padding-top:15px!important;
        padding-bottom:18px!important;
      }
      .namo-enterprise-dashboard .ned-bar-col{min-width:0!important}
      .namo-enterprise-dashboard .ned-bar-col>b{white-space:nowrap!important}
      @media(max-width:1200px){
        .namo-enterprise-dashboard .ned-layout{grid-template-columns:1fr 1fr!important}
        .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-panel{grid-column:1/-1!important;grid-row:auto!important}
        .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel:nth-child(1),
        .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel:nth-child(2){grid-row:auto!important}
        .namo-enterprise-dashboard .ned-layout>.ned-right>.ned-task-panel{grid-column:1/-1!important;grid-row:auto!important;height:auto!important;min-height:220px!important}
      }
      @media(max-width:760px){
        .namo-enterprise-dashboard .ned-layout{display:grid!important;grid-template-columns:1fr!important}
        .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-panel,
        .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel:nth-child(1),
        .namo-enterprise-dashboard .ned-layout>.ned-left>.ned-split>.ned-panel:nth-child(2),
        .namo-enterprise-dashboard .ned-layout>.ned-right>.ned-task-panel{grid-column:1!important;grid-row:auto!important;height:auto!important;min-height:230px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function shippingRows(){
    try{
      const stored=JSON.parse(localStorage.getItem('qmes-erp-shipping-v1')||'[]');
      if(Array.isArray(stored)&&stored.length)return stored;
      if(stored&&Array.isArray(stored.rows)&&stored.rows.length)return stored.rows;
    }catch(_error){}
    try{if(window.DB&&Array.isArray(window.DB.shipping))return window.DB.shipping;}catch(_error){}
    return [];
  }

  function shippingDate(row){return dateOnly(row&&(row.actualShipDate||row.shipDate||row.deliveredAt||row.deliveryAt||row.date||row.createdAt));}
  function shippingQty(row){return Math.max(0,num(row&&(row.shipQty!=null?row.shipQty:row.shippingQty!=null?row.shippingQty:row.deliveryQty!=null?row.deliveryQty:row.deliveredQty!=null?row.deliveredQty:row.quantity!=null?row.quantity:row.qty)));}
  function fmtTon(kg){return (num(kg)/1000).toLocaleString('ko-KR',{maximumFractionDigits:2});}

  function buildYearMonths(){
    const year=new Date().getFullYear();
    const months=[];
    const map=new Map();
    for(let month=1;month<=12;month+=1){
      const key=year+'-'+String(month).padStart(2,'0');
      const item={key,label:month+'월',value:0};
      months.push(item);map.set(key,item);
    }
    shippingRows().forEach(row=>{const key=shippingDate(row).slice(0,7);if(map.has(key))map.get(key).value+=shippingQty(row);});
    return months;
  }

  function rebuildYearChart(root){
    const chart=root.querySelector('.ned-chart');
    if(!chart)return;
    const months=buildYearMonths();
    const max=Math.max(1,...months.map(item=>item.value));
    const signature=months.map(item=>item.key+':'+item.value).join('|');
    if(chart.dataset.qmesYearSignature===signature&&chart.children.length===12)return;
    chart.innerHTML=months.map(item=>{
      const height=Math.max(3,Math.round(item.value/max*145));
      return '<div class="ned-bar-col"><span>'+fmtTon(item.value)+'</span><div class="ned-bar" style="height:'+height+'px"></div><b>'+item.label+'</b></div>';
    }).join('');
    chart.dataset.qmesYearSignature=signature;
  }

  function apply(){
    ensureStyle();
    const root=document.querySelector('.namo-enterprise-dashboard');
    if(!root)return;
    root.querySelectorAll('.ned-panel h2').forEach(h2=>{
      const text=clean(h2.textContent);
      if(text==='ERP → MES 통합 업무 흐름'||text==='ERP·MES 통합 업무 흐름'||text.includes('통합 업무 흐름'))h2.textContent='통합업무 흐름';
    });
    rebuildYearChart(root);
  }

  let queued=false;
  function queueApply(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueApply,{once:true});else queueApply();
  window.addEventListener('load',queueApply);
  window.addEventListener('resize',queueApply);
  window.addEventListener('qmes:navigate-tab',()=>{setTimeout(queueApply,30);setTimeout(queueApply,250);});
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(queueApply,2000);
})();
