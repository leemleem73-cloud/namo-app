/* NAMO QMES - Sales/Due purchase UI + stable seeded content V3
 * 2026-09-18
 * ADD-ONLY FINAL OWNER.
 * - Mirrors Purchase Order ledger layout.
 * - No MutationObserver / no recurring repaint loop.
 * - Preserves existing Sales rows and adds missing historical sales rows.
 * - Default filter shows 2025~current year so historical rows are visible.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_FINAL_OWNER_V3_20260918__) return;
  window.__QMES_SALES_FINAL_OWNER_V3_20260918__ = true;

  const SALES='qmes-erp-sales-v1';
  const META='qmes-sales-order-meta-v1';
  const SHIPPING='qmes-erp-shipping-v1';
  const DELETED='qmes-sales-deleted-v1';
  const TYPE='inventory';
  const RECORD='erp:sales';
  const SOURCE='SALES_STATUS_LEDGER_20260918_V3';
  const HOST='qmes-sales-final-owner-v3-20260918';
  const STYLE='qmes-sales-final-owner-v3-style-20260918';
  const PAGE_SIZE=10;
  const DAY=86400000;

  const currentYear=new Date().getFullYear();
  const state={
    from:'2025-01-01',
    to:currentYear+'-12-31',
    customer:'',
    product:'',
    progress:'전체',
    due:'전체',
    q:''
  };
  let page=1;

  const HISTORY=[
    {id:'SO-250526-001',date:'2025-05-26',customer:'(주)현대자동차',product:'NBA15-HM01',qty:1.48,srcQty:1480,srcUnit:'g'},
    {id:'SO-250526-002',date:'2025-05-26',customer:'(주)현대자동차',product:'NBA20-HM01',qty:1.64,srcQty:1640,srcUnit:'g'},
    {id:'SO-250630-001',date:'2025-06-30',customer:'(주)현대자동차',product:'NBA15-HM01',qty:0.55,srcQty:550,srcUnit:'g'},
    {id:'SO-250630-002',date:'2025-06-30',customer:'(주)현대자동차',product:'NBA20-HM01',qty:0.55,srcQty:550,srcUnit:'g'},
    {id:'SO-250714-001',date:'2025-07-14',customer:'(주)현대자동차',product:'NBA20-HM01',qty:1,srcQty:1000,srcUnit:'g'},
    {id:'SO-250806-001',date:'2025-08-06',customer:'(주)현대자동차',product:'NBA20-P4S6-HM01',qty:0.1,srcQty:100,srcUnit:'g'},
    {id:'SO-250806-002',date:'2025-08-06',customer:'(주)현대자동차',product:'NBA20-S5V5-HM01',qty:0.1,srcQty:100,srcUnit:'g'},
    {id:'SO-250905-001',date:'2025-09-05',customer:'(주)제이에스케미칼',product:'OZE33-JS01',qty:20,srcQty:20,srcUnit:'kg'},
    {id:'SO-251204-001',date:'2025-12-04',customer:'(주)현대자동차',product:'절연슬러리',qty:150,srcQty:150,srcUnit:'kg'},
    {id:'SO-251205-001',date:'2025-12-05',customer:'(주)제이에스케미칼',product:'OZE33-JS01',qty:25,srcQty:25,srcUnit:'kg'},
    {id:'SO-260202-001',date:'2026-02-02',customer:'(주)현대자동차',product:'ADC30G(SBR)',qty:64,srcQty:64,srcUnit:'kg'},
    {id:'SO-260202-002',date:'2026-02-02',customer:'(주)현대자동차',product:'AOH30(Boehmite)',qty:12,srcQty:12,srcUnit:'kg'},
    {id:'SO-260202-003',date:'2026-02-02',customer:'(주)현대자동차',product:'NMP(SNET)',qty:1219,srcQty:1219,srcUnit:'kg'},
    {id:'SO-260202-004',date:'2026-02-02',customer:'(주)현대자동차',product:'절연슬러리',qty:273,srcQty:273,srcUnit:'kg'},
    {id:'SO-260202-005',date:'2026-02-02',customer:'(주)현대자동차',product:'스피롤탄(a부, b부)',qty:100,srcQty:100,srcUnit:'kg'}
  ];

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:0};
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
  const parse=v=>{if(v&&typeof v==='object')return v;if(typeof v==='string'){try{return JSON.parse(v)}catch(_){return {}}}return {}};
  const rows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const metaMap=()=>{const v=read(META,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};
  const shipRows=()=>{const v=read(SHIPPING,[]);return Array.isArray(v)?v:[]};
  const delRows=()=>{const v=read(DELETED,[]);return Array.isArray(v)?v:[]};
  const key=r=>clean(r&&(r.workOrder||r.id));
  const meta=(r,m=metaMap())=>m[key(r)]||m[clean(r&&r.id)]||(r&&r.orderMeta)||{};
  const shownId=(r,m=metaMap())=>clean(meta(r,m).salesOrderIdOverride)||clean(r&&r.id);
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0'):''};
  const dateMs=v=>{const d=iso(v);if(!d)return null;const t=new Date(d+'T00:00:00').getTime();return Number.isFinite(t)?t:null};
  const todayMs=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime()};

  function identity(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==='object'?row.orderMeta:{};
    const d=clean(m.orderDate||row&&row.orderDate||row&&row.date);
    const c=clean(m.customerOverride||row&&row.customer).replace(/^\(주\)/,'');
    const p=clean(m.productOverride||row&&row.product).replace(/\s*\[(kg|g)\]\s*$/i,'');
    const q=Number(m.qtyOverride!=null?m.qtyOverride:row&&row.qty);
    return [d,c,p,Number.isFinite(q)?q:''].join('|');
  }

  function historicalRow(x){
    const orderMeta={
      salesOrderIdOverride:x.id,orderDate:x.date,customerOverride:x.customer,
      productOverride:x.product,qtyOverride:x.qty,requestedDue:'',
      deliveryPlace:'',orderType:'양산',productionPlanStatus:'생산완료',
      shippingStatus:'출하완료',actualShipment:true,actualShipDate:x.date,
      source:SOURCE,sourceQty:x.srcQty,sourceUnit:x.srcUnit
    };
    return {
      id:x.id,orderDate:x.date,customer:x.customer,product:x.product,qty:x.qty,
      due:'',plan:'생산완료',shipping:'출하완료',actualShipment:true,
      actualShipDate:x.date,source:SOURCE,orderMeta,remarks:'기존 판매현황 이관자료'
    };
  }

  function mergeHistory(base){
    const out=Array.isArray(base)?base.slice():[];
    const ids=new Set(out.map(r=>clean(r&&r.id)).filter(Boolean));
    const identities=new Set(out.map(identity));
    let added=0;
    for(const x of HISTORY){
      const row=historicalRow(x), sig=identity(row);
      if(ids.has(row.id)||identities.has(sig)) continue;
      out.push(row); ids.add(row.id); identities.add(sig); added++;
    }
    out.sort((a,b)=>{
      const am=a&&a.orderMeta||{},bm=b&&b.orderMeta||{};
      const ad=clean(am.orderDate||a&&a.orderDate||a&&a.productionDate||a&&a.date);
      const bd=clean(bm.orderDate||b&&b.orderDate||b&&b.productionDate||b&&b.date);
      return bd.localeCompare(ad)||clean(b&&b.id).localeCompare(clean(a&&a.id),undefined,{numeric:true});
    });
    return {rows:out,added};
  }

  function syncMeta(all){
    const raw=read(META,{}),map=raw&&typeof raw==='object'&&!Array.isArray(raw)?{...raw}:{};
    all.forEach(r=>{if(r&&r.orderMeta&&clean(r.orderMeta.source)===SOURCE)map[clean(r.id)]={...r.orderMeta}});
    write(META,map);
  }

  async function sharedRows(){
    if(typeof window.qmesSyncList!=='function')return null;
    try{
      const records=await window.qmesSyncList(TYPE);
      const found=(Array.isArray(records)?records:[]).find(r=>clean(r&&r.record_key)===RECORD);
      if(!found)return [];
      const payload=parse(found.payload);
      return Array.isArray(payload.rows)?payload.rows:[];
    }catch(_){return null}
  }

  async function saveShared(all){
    if(typeof window.qmesSyncUpsert!=='function')return false;
    try{
      await window.qmesSyncUpsert(TYPE,RECORD,{
        module:'erp',schema:1,kind:'sales',rows:all,
        updatedAt:new Date().toISOString(),
        updatedBy:clean(window.__QMES_CURRENT_USER__&&window.__QMES_CURRENT_USER__.name)||'QMES',
        source:SOURCE
      });
      return true;
    }catch(_){return false}
  }

  async function seedOnce(){
    const remote=await sharedRows();
    const local=rows();
    const base=(Array.isArray(remote)&&remote.length)?remote:local;
    const merged=mergeHistory(base);
    write(SALES,merged.rows);
    syncMeta(merged.rows);
    if(merged.added) await saveShared(merged.rows);
    return merged;
  }

  function isDeleted(r,m){
    const id=clean(r&&r.id),wo=key(r),shown=shownId(r,m);
    return delRows().some(x=>{
      const did=clean(x&&x.id),dwo=clean(x&&x.workOrder);
      return (did&&(did===id||did===shown))||(dwo&&wo&&dwo===wo);
    });
  }

  function orderDateFromId(id){
    const a=clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);
    if(a)return a[1]+'-'+a[2]+'-'+a[3];
    const b=clean(id).match(/^SO-(\d{2})(\d{2})(\d{2})-/i);
    return b?'20'+b[1]+'-'+b[2]+'-'+b[3]:'';
  }
  function orderDate(r,m){const mm=meta(r,m);return iso(mm.orderDate||r&&r.orderDate||r&&r.productionDate||r&&r.createdAt)||orderDateFromId(shownId(r,m))}
  function customer(r,m){const mm=meta(r,m);return clean(mm.customerOverride)||clean(r&&r.customer)||'-'}
  function product(r,m){const mm=meta(r,m);return clean(mm.productOverride)||clean(r&&r.product)||'-'}
  function qty(r,m){const mm=meta(r,m);return num(mm.qtyOverride!=null?mm.qtyOverride:r&&r.qty)}
  function due(r,m){const mm=meta(r,m);return iso(mm.requestedDue||r&&r.due)}
  function delivery(r,m){const mm=meta(r,m);return clean(mm.deliveryPlace)||clean(r&&r.deliveryPlace)||'-'}
  function doneText(v){return /출하완료|납품완료|배송완료|출고완료/.test(clean(v))}
  function shipment(r,m,ships){
    const mm=meta(r,m),id=shownId(r,m),raw=clean(r&&r.id),wo=key(r);
    const local=[r&&r.shipping,r&&r.delivery,mm.shippingStatus,mm.deliveryStatus].map(clean).join(' ');
    if((r&&r.actualShipment===true)||mm.actualShipment===true||doneText(local)){
      return {complete:true,date:iso(r&&r.actualShipDate||r&&r.shipDate||mm.actualShipDate||mm.shipDate)};
    }
    const found=(ships||[]).find(s=>{
      const sid=clean(s&&(s.sales||s.salesOrder||s.salesOrderId)),swo=clean(s&&(s.workOrder||s.lot));
      const status=[s&&s.shipping,s&&s.delivery,s&&s.status].map(clean).join(' ');
      return ((sid&&(sid===id||sid===raw))||(wo&&swo===wo))&&((s&&s.actualShipment===true)||doneText(status));
    });
    return found?{complete:true,date:iso(found.actualShipDate||found.shipDate||found.actualDate||found.date||found.completedAt)}:null;
  }
  function dueState(r,m,ships){
    const d=due(r,m),s=shipment(r,m,ships);
    if(s&&s.complete){
      const actual=iso(s.date);
      if(!d||!actual)return {label:'납기완료',tone:'good',bucket:'완료'};
      const diff=Math.round((dateMs(actual)-dateMs(d))/DAY);
      return diff<=0?{label:'납기완료',tone:'good',bucket:'완료'}:{label:'지연완료 '+diff+'일',tone:'bad',bucket:'완료'};
    }
    if(!d)return {label:'-',tone:'gray',bucket:'기타'};
    const diff=Math.round((dateMs(d)-todayMs())/DAY);
    if(diff<0)return {label:'지연 '+Math.abs(diff)+'일',tone:'bad',bucket:'지연'};
    if(diff<=7)return {label:'임박 D-'+diff,tone:'warn',bucket:'임박'};
    return {label:'정상',tone:'good',bucket:'정상'};
  }
  function productionState(r,m,s){
    const mm=meta(r,m); if(s&&s.complete)return '생산완료';
    const raw=clean(mm.productionPlanStatus)||clean(r&&r.plan);
    if(/생산완료|완료/.test(raw))return '생산완료';
    if(/생산중|진행/.test(raw))return '생산진행';
    if(raw&&!/계획대기|대기|미반영/.test(raw))return raw;
    if(clean(r&&r.workOrder)||clean(mm.workOrder))return '생산진행';
    return raw||'생산대기';
  }
  function shippingState(r,m,s){const mm=meta(r,m);if(s&&s.complete)return '출하완료';const raw=clean(mm.shippingStatus)||clean(r&&r.shipping);return raw&&raw!=='-'?raw:'출하대기'}
  function progressState(prod,ship){if(/출하완료|납품완료/.test(ship))return '출하완료';if(/출하예정|출하진행|검사/.test(ship))return '출하진행';if(/생산완료/.test(prod))return '생산완료';if(/생산진행|생산중/.test(prod))return '생산진행';return '생산대기'}

  function viewRows(){
    const m=metaMap(),ships=shipRows();
    return rows().filter(r=>r&&!isDeleted(r,m)).map(r=>{
      const s=shipment(r,m,ships),prod=productionState(r,m,s),ship=shippingState(r,m,s),ds=dueState(r,m,ships);
      return {row:r,id:shownId(r,m),date:orderDate(r,m),customer:customer(r,m),product:product(r,m),qty:qty(r,m),unit:'kg',due:due(r,m),dueState:ds,production:prod,shipping:ship,progress:progressState(prod,ship),delivery:delivery(r,m)};
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id),undefined,{numeric:true}));
  }

  function filtered(all){
    const q=clean(state.q).toLowerCase(),pq=clean(state.product).toLowerCase();
    return all.filter(x=>{
      if(state.from&&x.date&&x.date<state.from)return false;
      if(state.to&&x.date&&x.date>state.to)return false;
      if(state.customer&&x.customer!==state.customer)return false;
      if(pq&&!x.product.toLowerCase().includes(pq))return false;
      if(state.progress!=='전체'&&x.progress!==state.progress)return false;
      if(state.due!=='전체'&&x.dueState.bucket!==state.due)return false;
      if(q&&!([x.id,x.date,x.customer,x.product,x.due,x.dueState.label,x.production,x.shipping,x.delivery].join(' ').toLowerCase().includes(q)))return false;
      return true;
    });
  }

  const fmt=v=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:3});
  const badge=(t,tone)=>'<span class="qsf-badge '+tone+'">'+esc(t)+'</span>';

  function rowHtml(x){
    return '<tr>'+
      '<td><button class="qsf-link" data-qsf-detail="'+esc(x.id)+'">'+esc(x.date||'-')+'</button></td>'+
      '<td><button class="qsf-link" data-qsf-detail="'+esc(x.id)+'">'+esc(x.id||'-')+'</button></td>'+
      '<td class="left">'+esc(x.customer)+'</td>'+
      '<td class="left">'+esc(x.product)+'</td>'+
      '<td class="num">'+fmt(x.qty)+'</td>'+
      '<td>'+esc(x.unit)+'</td>'+
      '<td>'+esc(x.due||'-')+'</td>'+
      '<td>'+badge(x.dueState.label,x.dueState.tone)+'</td>'+
      '<td>'+badge(x.production,/완료/.test(x.production)?'good':/진행/.test(x.production)?'blue':'gray')+'</td>'+
      '<td>'+badge(x.shipping,/완료/.test(x.shipping)?'good':/진행|예정/.test(x.shipping)?'blue':'gray')+'</td>'+
      '<td class="left">'+esc(x.delivery)+'</td>'+
      '<td><span class="qsf-actions"><button data-qsf-detail="'+esc(x.id)+'">상세</button><button data-qsf-edit="'+esc(x.id)+'">수정</button></span></td>'+
    '</tr>';
  }

  function installStyle(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
.qmes-sales-stable.qsf-active{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;color:#22384a!important;background:transparent!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
.qmes-sales-stable.qsf-active>.qerp-kpis,.qmes-sales-stable.qsf-active>.qerp-card{display:none!important}
.qmes-sales-stable.qsf-active #qmes-sales-enterprise-module-v2,.qmes-sales-stable.qsf-active #qmes-sales-due-ledger-20260918,.qmes-sales-stable.qsf-active #qmes-sales-purchase-ui-match-20260918,.qmes-sales-stable.qsf-active #qmes-sales-purchase-stable-owner-20260918{display:none!important}
.qmes-sales-stable.qsf-active>.qerp-head{min-height:54px!important;margin:0!important;padding:0 0 12px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;border:0!important;border-bottom:1px solid #d9e3ea!important;background:#fff!important;box-shadow:none!important}
.qmes-sales-stable.qsf-active .qerp-title{margin:0!important;color:#13283e!important;font-size:18px!important;line-height:1.25!important;font-weight:900!important;letter-spacing:-.35px!important}
.qmes-sales-stable.qsf-active .qerp-sub{display:block!important;margin:4px 0 0!important;color:#6f8191!important;font-size:10px!important;font-weight:800!important}
.qmes-sales-stable.qsf-active .qerp-head-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex-wrap:wrap!important}
.qmes-sales-stable.qsf-active .qerp-head-actions button,.qmes-sales-stable.qsf-active .qerp-head-actions .nse-import{height:34px!important;margin:0!important;padding:0 12px!important;border:1px solid #b9c9d5!important;border-radius:6px!important;background:#fff!important;color:#365269!important;font-size:11px!important;font-weight:800!important;box-shadow:none!important}
.qmes-sales-stable.qsf-active .qerp-head-actions .qerp-btn{border-color:#2187c7!important;background:#2187c7!important;color:#fff!important}
#${HOST}{margin:0!important;padding:0!important}
#${HOST} .qsf-filter{margin:0!important;padding:12px 0 14px!important;background:#fff!important}
#${HOST} .qsf-grid{display:grid!important;grid-template-columns:350px 155px 250px 145px 145px minmax(270px,1fr) 78px 78px!important;gap:0 10px!important;align-items:end!important;width:100%!important;min-width:0!important}
#${HOST} .qsf-field{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:0!important}
#${HOST} .qsf-field>span:first-child{color:#68758a!important;font-size:10px!important;font-weight:800!important;line-height:12px!important}
#${HOST} .qsf-date{display:grid!important;grid-template-columns:minmax(0,1fr) 14px minmax(0,1fr)!important;gap:4px!important;align-items:center!important}
#${HOST} .qsf-date>b{text-align:center!important;color:#7c8c9a!important;font-size:11px!important}
#${HOST} input,#${HOST} select{width:100%!important;min-width:0!important;height:42px!important;box-sizing:border-box!important;border:1px solid #b9c9d5!important;border-radius:10px!important;background:#fff!important;color:#26394b!important;padding:0 11px!important;font-size:12px!important;font-weight:650!important;outline:none!important}
#${HOST} .qsf-grid>button{display:flex!important;align-items:center!important;justify-content:center!important;width:78px!important;height:42px!important;border:1px solid #b9c9d5!important;border-radius:10px!important;background:linear-gradient(180deg,#fff 0%,#e8eef3 100%)!important;color:#25384a!important;font-size:11px!important;font-weight:850!important}
#${HOST} .qsf-grid>button.primary{border-color:#1786c7!important;background:#1786c7!important;color:#fff!important}
#${HOST} .qsf-list{overflow:hidden!important;border:1px solid #d3dfe7!important;background:#fff!important}
#${HOST} .qsf-wrap{width:100%!important;overflow:auto!important}
#${HOST} table{width:100%!important;min-width:1450px!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:10px!important}
#${HOST} thead th{height:46px!important;padding:8px 7px!important;background:linear-gradient(180deg,#7fb4d6 0%,#619bc2 100%)!important;color:#fff!important;border:0!important;border-right:1px solid rgba(255,255,255,.32)!important;border-bottom:1px solid #4f8ab2!important;font-size:10px!important;font-weight:900!important;text-align:center!important;white-space:nowrap!important}
#${HOST} tbody td{height:46px!important;padding:8px 7px!important;background:#fff!important;color:#405569!important;border:0!important;border-bottom:1px solid #dce5eb!important;font-size:10px!important;font-weight:600!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#${HOST} tbody tr:nth-child(even) td{background:#f7fafc!important}
#${HOST} tbody tr:hover td{background:#eaf4fb!important}
#${HOST} td.left{text-align:left!important}#${HOST} td.num{text-align:right!important;font-variant-numeric:tabular-nums!important}
#${HOST} .qsf-link{border:0!important;background:transparent!important;color:#126ca8!important;font-size:10px!important;font-weight:850!important;padding:0!important;cursor:pointer!important}
#${HOST} .qsf-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:50px!important;height:24px!important;padding:0 8px!important;border-radius:6px!important;font-size:9px!important;font-weight:850!important}
#${HOST} .qsf-badge.good{background:#e7f8ed!important;color:#18864b!important}#${HOST} .qsf-badge.warn{background:#fff1df!important;color:#d87b15!important}#${HOST} .qsf-badge.bad{background:#ffeaea!important;color:#c94444!important}#${HOST} .qsf-badge.blue{background:#e7f4ff!important;color:#187bc0!important}#${HOST} .qsf-badge.gray{background:#eef1f4!important;color:#647485!important}
#${HOST} .qsf-actions{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important}
#${HOST} .qsf-actions button{height:28px!important;min-width:38px!important;padding:0 8px!important;border:1px solid #b9cbd8!important;border-radius:5px!important;background:#fff!important;color:#365269!important;font-size:9px!important;font-weight:850!important}
#${HOST} .qsf-actions button:first-child{border-color:#1786c7!important;background:#1786c7!important;color:#fff!important}
#${HOST} .qsf-empty{height:210px!important;text-align:center!important;color:#8797a6!important;font-size:11px!important}
#${HOST} .qsf-foot{display:flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;min-height:54px!important;padding:8px 12px!important;border-top:1px solid #dce5eb!important;background:#fff!important}
#${HOST} .qsf-page{min-width:34px!important;height:34px!important;padding:0 9px!important;border:1px solid #b8c7d4!important;border-radius:4px!important;background:#fff!important;color:#334b60!important;font-size:11px!important;font-weight:850!important}
#${HOST} .qsf-page.active{border-color:#0d659e!important;background:#0d659e!important;color:#fff!important}
@media(max-width:1650px){#${HOST} .qsf-grid{grid-template-columns:300px 145px 220px 135px 135px minmax(240px,1fr) 76px 76px!important}}
@media(max-width:1350px){#${HOST} .qsf-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}#${HOST} .qsf-grid>button{width:100%!important}}
`;document.head.appendChild(s);
  }

  function render(){
    const host=document.getElementById(HOST);if(!host)return;
    const all=viewRows(),data=filtered(all),customers=[...new Set(all.map(x=>x.customer).filter(v=>v&&v!=='-'))].sort((a,b)=>a.localeCompare(b,'ko'));
    const pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));if(page>pages)page=pages;
    const slice=data.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
    host.innerHTML=
      '<div class="qsf-filter"><div class="qsf-grid">'+
      '<label class="qsf-field"><span>기간</span><span class="qsf-date"><input type="date" data-qsf-from value="'+esc(state.from)+'"><b>~</b><input type="date" data-qsf-to value="'+esc(state.to)+'"></span></label>'+
      '<label class="qsf-field"><span>거래처</span><select data-qsf-customer><option value="">전체</option>'+customers.map(v=>'<option value="'+esc(v)+'" '+(state.customer===v?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'+
      '<label class="qsf-field"><span>품목명</span><input data-qsf-product value="'+esc(state.product)+'" placeholder="품목명 또는 규격 입력"></label>'+
      '<label class="qsf-field"><span>진행상태</span><select data-qsf-progress>'+['전체','생산대기','생산진행','생산완료','출하진행','출하완료'].map(v=>'<option '+(state.progress===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
      '<label class="qsf-field"><span>납기상태</span><select data-qsf-due>'+['전체','정상','임박','지연','완료'].map(v=>'<option '+(state.due===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
      '<label class="qsf-field"><span>통합검색</span><input data-qsf-q value="'+esc(state.q)+'" placeholder="수주번호, 거래처명, 품목명 등 검색"></label>'+
      '<button class="primary" data-qsf-search>⌕ 조회</button><button data-qsf-reset>↻ 초기화</button>'+
      '</div></div>'+
      '<div class="qsf-list"><div class="qsf-wrap"><table><thead><tr><th>수주일 ↓</th><th>수주번호</th><th>거래처명</th><th>품목명 (규격)</th><th>수주수량</th><th>단위</th><th>요청납기</th><th>납기상태</th><th>생산상태</th><th>출하상태</th><th>납품처</th><th>관리</th></tr></thead><tbody>'+
      (slice.length?slice.map(rowHtml).join(''):'<tr><td colspan="12" class="qsf-empty">조회 조건에 해당하는 수주가 없습니다.</td></tr>')+
      '</tbody></table></div><div class="qsf-foot">'+Array.from({length:pages},(_,i)=>'<button class="qsf-page '+(i+1===page?'active':'')+'" data-qsf-page="'+(i+1)+'">'+(i+1)+'</button>').join('')+'</div></div>';
    const root=document.querySelector('.qmes-sales-stable');
    const sub=root&&root.querySelector('.qerp-sub'); if(sub)sub.textContent='총 '+data.length+'건';
  }

  function ensure(){
    installStyle();
    const root=document.querySelector('.qmes-sales-stable');if(!root)return;
    root.classList.remove('nse-active','qmes-sales-purchase-ui-match','qmes-sales-purchase-final-ui','qss-active');
    root.classList.add('qsf-active');
    const title=root.querySelector('.qerp-title');if(title)title.textContent='수주·납기 관리대장';
    ['qmes-sales-enterprise-module-v2','qmes-sales-due-ledger-20260918','qmes-sales-purchase-ui-match-20260918','qmes-sales-purchase-stable-owner-20260918'].forEach(id=>document.getElementById(id)?.remove());
    let host=document.getElementById(HOST);
    if(!host){
      host=document.createElement('section');host.id=HOST;
      const head=root.querySelector(':scope > .qerp-head');
      if(head&&head.nextSibling)root.insertBefore(host,head.nextSibling);else root.appendChild(host);
    }
    render();
  }

  function readFilters(){
    const h=document.getElementById(HOST);if(!h)return;
    state.from=clean(h.querySelector('[data-qsf-from]')?.value);
    state.to=clean(h.querySelector('[data-qsf-to]')?.value);
    state.customer=clean(h.querySelector('[data-qsf-customer]')?.value);
    state.product=clean(h.querySelector('[data-qsf-product]')?.value);
    state.progress=clean(h.querySelector('[data-qsf-progress]')?.value)||'전체';
    state.due=clean(h.querySelector('[data-qsf-due]')?.value)||'전체';
    state.q=clean(h.querySelector('[data-qsf-q]')?.value);page=1;
  }
  function reset(){state.from='2025-01-01';state.to=currentYear+'-12-31';state.customer='';state.product='';state.progress='전체';state.due='전체';state.q='';page=1}
  function findRow(id){const wanted=clean(id),m=metaMap();return rows().find(r=>[clean(r&&r.id),key(r),shownId(r,m)].includes(wanted))||null}
  function detail(id){if(window.qmesSalesDetailConsistency?.open)window.qmesSalesDetailConsistency.open(id);else window.qmesSalesOrderDetail?.open?.(id)}
  function edit(id){const r=findRow(id);if(r)window.qmesSalesEditDirectV18?.open?.(r)}

  function start(){
    document.addEventListener('click',e=>{
      const t=e.target;if(!(t instanceof Element))return;
      const d=t.closest('[data-qsf-detail]');if(d){e.preventDefault();detail(clean(d.dataset.qsfDetail));return}
      const ed=t.closest('[data-qsf-edit]');if(ed){e.preventDefault();edit(clean(ed.dataset.qsfEdit));return}
      if(t.closest('[data-qsf-search]')){readFilters();render();return}
      if(t.closest('[data-qsf-reset]')){reset();render();return}
      const p=t.closest('[data-qsf-page]');if(p){page=Math.max(1,Number(p.dataset.qsfPage)||1);render()}
    },true);
    document.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&e.target instanceof Element&&e.target.matches('#'+HOST+' [data-qsf-q],#'+HOST+' [data-qsf-product]')){
        e.preventDefault();readFilters();render();
      }
    },true);
    ['qmes:erp-data-changed','qmes:data-updated','qmes:shared-sync-complete'].forEach(name=>window.addEventListener(name,()=>setTimeout(render,0)));
    window.addEventListener('storage',e=>{if([SALES,META,SHIPPING,DELETED].includes(e.key))render()});

    const boot=async()=>{
      await seedOnce();
      ensure();
    };
    setTimeout(boot,0);
    [250,900,1800].forEach(ms=>setTimeout(async()=>{await seedOnce();ensure();},ms));
    window.qmesSalesFinalOwnerV3={ensure,render,seedOnce};
  }
  start();
})();
