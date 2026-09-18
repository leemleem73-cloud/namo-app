/* NAMO QMES - Sales/Due purchase-style UI match v2
 * 2026-09-18
 * ADD-ONLY PATCH. No legacy/original Sales source is overwritten.
 * Existing create/edit/detail/sync/import handlers remain authoritative.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_PURCHASE_UI_MATCH_20260918__) return;
  window.__QMES_SALES_PURCHASE_UI_MATCH_20260918__ = true;

  const SALES_KEY='qmes-erp-sales-v1';
  const META_KEY='qmes-sales-order-meta-v1';
  const SHIPPING_KEY='qmes-erp-shipping-v1';
  const DELETED_KEY='qmes-sales-deleted-v1';
  const HOST_ID='qmes-sales-purchase-ui-match-20260918';
  const STYLE_ID='qmes-sales-purchase-ui-match-20260918-style';
  const ROOT_CLASS='qmes-sales-purchase-ui-match';
  const DAY=86400000;

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v;}catch(_){return fallback;}};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const metas=()=>{const v=read(META_KEY,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{};};
  const ships=()=>{const v=read(SHIPPING_KEY,[]);return Array.isArray(v)?v:[];};
  const deleted=()=>{const v=read(DELETED_KEY,[]);return Array.isArray(v)?v:[];};
  const rowKey=row=>clean(row&&(row.workOrder||row.id));
  const metaFor=(row,map)=>{map=map||metas();return map[rowKey(row)]||map[clean(row&&row.id)]||(row&&row.orderMeta)||{};};
  const visibleId=(row,map)=>clean(metaFor(row,map).salesOrderIdOverride)||clean(row&&row.id);
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0'):'';};
  const dateMs=v=>{const d=iso(v);if(!d)return null;const t=new Date(d+'T00:00:00').getTime();return Number.isFinite(t)?t:null;};
  const todayMs=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();};

  const now=new Date();
  const year=now.getFullYear();
  const state={
    from:year+'-01-01',
    to:year+'-12-31',
    customer:'',
    product:'',
    progress:'전체',
    due:'전체',
    q:''
  };
  let queued=false;

  function isDeleted(row,map){
    const id=clean(row&&row.id),shown=visibleId(row,map),wo=rowKey(row);
    return deleted().some(x=>[clean(x&&x.id),clean(x&&x.workOrder)].some(v=>v&&(v===id||v===shown||v===wo)));
  }

  function orderDateFromId(id){
    const m=clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);
    return m?m[1]+'-'+m[2]+'-'+m[3]:'';
  }

  function orderDate(row,map){
    const m=metaFor(row,map);
    return iso((row&&(row.orderDate||row.order_date||row.createdAt||row.created_at))||m.orderDate||m.order_date||m.createdAt||m.created_at)||orderDateFromId(visibleId(row,map));
  }

  function customerOf(row,map){const m=metaFor(row,map);return clean(m.customerOverride)||clean(row&&row.customer)||'-';}
  function productOf(row,map){
    const m=metaFor(row,map);
    const product=clean(m.productOverride)||clean(row&&row.product)||'-';
    const spec=clean(m.spec||m.specification||(row&&(row.spec||row.specification)));
    return spec&&product.indexOf(spec)<0?product+' ('+spec+')':product;
  }
  function qtyOf(row,map){const m=metaFor(row,map);return num(m.qtyOverride!=null?m.qtyOverride:row&&row.qty);}
  function dueOf(row,map){const m=metaFor(row,map);return iso(m.requestedDue||(row&&row.due));}
  function deliveryOf(row,map){const m=metaFor(row,map);return clean(m.deliveryPlace)||clean(row&&row.deliveryPlace)||'-';}

  function completedText(v){return /출하완료|납품완료|배송완료|출고완료/.test(clean(v));}

  function shipmentFor(row,map,shippingRows){
    const m=metaFor(row,map),shown=visibleId(row,map),raw=clean(row&&row.id),wo=rowKey(row);
    const local=[row&&row.shipping,row&&row.delivery,m.shippingStatus,m.deliveryStatus].map(clean).join(' ');
    if((row&&row.actualShipment===true)||m.actualShipment===true||completedText(local)){
      return {complete:true,date:iso((row&&(row.actualShipDate||row.shipDate))||m.actualShipDate||m.shipDate)};
    }
    const match=(shippingRows||[]).filter(ship=>{
      const sid=clean(ship&&(ship.sales||ship.salesOrder||ship.salesOrderId));
      const swo=clean(ship&&(ship.workOrder||ship.lot));
      const status=[ship&&ship.shipping,ship&&ship.delivery,ship&&ship.status].map(clean).join(' ');
      const linked=(sid&&(sid===shown||sid===raw))||(wo&&swo===wo);
      return linked&&((ship&&ship.actualShipment===true)||completedText(status));
    }).sort((a,b)=>String(iso(b&&(b.actualShipDate||b.shipDate||b.actualDate||b.date||b.completedAt))).localeCompare(String(iso(a&&(a.actualShipDate||a.shipDate||a.actualDate||a.date||a.completedAt)))))[0];
    return match?{complete:true,date:iso(match.actualShipDate||match.shipDate||match.actualDate||match.date||match.completedAt)}:null;
  }

  function dueState(row,map,shippingRows){
    const due=dueOf(row,map),ship=shipmentFor(row,map,shippingRows);
    if(ship&&ship.complete){
      const actual=iso(ship.date);
      if(!due||!actual)return {label:'납기완료',tone:'good',bucket:'완료'};
      const diff=Math.round((dateMs(actual)-dateMs(due))/DAY);
      return diff<=0?{label:'납기완료',tone:'good',bucket:'완료'}:{label:'지연완료 '+diff+'일',tone:'bad',bucket:'완료'};
    }
    if(!due)return {label:'-',tone:'neutral',bucket:'기타'};
    const diff=Math.round((dateMs(due)-todayMs())/DAY);
    if(diff<0)return {label:'지연 '+Math.abs(diff)+'일',tone:'bad',bucket:'지연'};
    if(diff<=7)return {label:'임박 D-'+diff,tone:'warn',bucket:'임박'};
    return {label:'정상',tone:'good',bucket:'정상'};
  }

  function productionState(row,map,ship){
    const m=metaFor(row,map);
    if(ship&&ship.complete)return '생산완료';
    const raw=clean(m.productionPlanStatus)||clean(row&&row.plan);
    if(/생산완료|완료/.test(raw))return '생산완료';
    if(/생산중|진행/.test(raw))return '생산중';
    if(raw&&!/계획대기|대기|미반영/.test(raw))return raw;
    if(clean(row&&row.workOrder)||clean(m.workOrder))return '생산진행';
    return raw||'생산대기';
  }

  function shippingState(row,map,ship){
    const m=metaFor(row,map);
    if(ship&&ship.complete)return '출하완료';
    const raw=clean(m.shippingStatus)||clean(row&&row.shipping);
    return raw&&raw!=='-'?raw:'출하대기';
  }

  function progressState(production,shipping){
    if(/출하완료|납품완료/.test(shipping))return '출하완료';
    if(/출하예정|출하대기|OQC|검사/.test(shipping)&&!/출하대기/.test(shipping))return '출하진행';
    if(/생산완료/.test(production))return '생산완료';
    if(/생산중|생산진행/.test(production))return '생산진행';
    return '생산대기';
  }

  function viewRows(){
    const map=metas(),shippingRows=ships();
    return rows().filter(r=>r&&!isDeleted(r,map)).map(row=>{
      const ship=shipmentFor(row,map,shippingRows);
      const production=productionState(row,map,ship);
      const shipping=shippingState(row,map,ship);
      const due=dueState(row,map,shippingRows);
      return {
        row,
        id:visibleId(row,map),
        date:orderDate(row,map),
        customer:customerOf(row,map),
        product:productOf(row,map),
        qty:qtyOf(row,map),
        unit:'kg',
        due:dueOf(row,map),
        dueState:due,
        production,
        shipping,
        progress:progressState(production,shipping),
        delivery:deliveryOf(row,map)
      };
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id),undefined,{numeric:true}));
  }

  function customers(list){return Array.from(new Set(list.map(x=>x.customer).filter(v=>v&&v!=='-'))).sort((a,b)=>a.localeCompare(b,'ko'));}

  function filtered(list){
    const q=clean(state.q).toLowerCase();
    const productQ=clean(state.product).toLowerCase();
    return list.filter(x=>{
      if(state.from&&x.date&&x.date<state.from)return false;
      if(state.to&&x.date&&x.date>state.to)return false;
      if(state.customer&&x.customer!==state.customer)return false;
      if(productQ&&!x.product.toLowerCase().includes(productQ))return false;
      if(state.progress!=='전체'&&x.progress!==state.progress)return false;
      if(state.due!=='전체'&&x.dueState.bucket!==state.due)return false;
      if(q){
        const hay=[x.id,x.date,x.customer,x.product,x.due,x.dueState.label,x.production,x.shipping,x.delivery].join(' ').toLowerCase();
        if(!hay.includes(q))return false;
      }
      return true;
    });
  }

  function fmt(v){return Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:3});}
  function badge(text,tone){return '<span class="qsp-badge '+tone+'">'+esc(text)+'</span>';}

  function rowsHtml(list){
    if(!list.length)return '<tr><td colspan="12" class="qsp-empty">조회 조건에 해당하는 수주가 없습니다.</td></tr>';
    return list.map(x=>'<tr>'+
      '<td><button type="button" class="qsp-link" data-qsp-detail="'+esc(x.id)+'">'+esc(x.date||'-')+'</button></td>'+
      '<td><button type="button" class="qsp-link" data-qsp-detail="'+esc(x.id)+'">'+esc(x.id||'-')+'</button></td>'+
      '<td class="left" title="'+esc(x.customer)+'">'+esc(x.customer)+'</td>'+
      '<td class="left" title="'+esc(x.product)+'">'+esc(x.product)+'</td>'+
      '<td class="num">'+fmt(x.qty)+'</td>'+
      '<td>'+esc(x.unit)+'</td>'+
      '<td>'+esc(x.due||'-')+'</td>'+
      '<td>'+badge(x.dueState.label,x.dueState.tone)+'</td>'+
      '<td>'+badge(x.production,/완료/.test(x.production)?'good':/진행|생산중/.test(x.production)?'blue':'gray')+'</td>'+
      '<td>'+badge(x.shipping,/완료/.test(x.shipping)?'good':/예정|진행/.test(x.shipping)?'blue':'gray')+'</td>'+
      '<td class="left" title="'+esc(x.delivery)+'">'+esc(x.delivery)+'</td>'+
      '<td><span class="qsp-manage"><button type="button" data-qsp-detail="'+esc(x.id)+'">상세</button><button type="button" data-qsp-edit="'+esc(x.id)+'">수정</button></span></td>'+
    '</tr>').join('');
  }

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
.qmes-sales-stable.${ROOT_CLASS}{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;color:#22384a!important;background:transparent!important}
.qmes-sales-stable.${ROOT_CLASS}>.qerp-kpis,.qmes-sales-stable.${ROOT_CLASS}>.qerp-card{display:none!important}
.qmes-sales-stable.${ROOT_CLASS} #qmes-sales-enterprise-module-v2,
.qmes-sales-stable.${ROOT_CLASS} #qmes-sales-due-ledger-20260918{display:none!important}
.qmes-sales-stable.${ROOT_CLASS}>.qerp-head{min-height:54px!important;margin:0!important;padding:0 0 12px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;border:0!important;border-bottom:1px solid #d9e3ea!important;background:#fff!important;box-shadow:none!important}
.qmes-sales-stable.${ROOT_CLASS} .qerp-title{margin:0!important;color:#13283e!important;font-size:18px!important;line-height:1.25!important;font-weight:900!important;letter-spacing:-.35px!important}
.qmes-sales-stable.${ROOT_CLASS} .qerp-sub{display:block!important;margin-top:5px!important;color:#6f8191!important;font-size:10px!important;font-weight:800!important;line-height:1.2!important}
.qmes-sales-stable.${ROOT_CLASS} .qerp-head-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex-wrap:wrap!important}
.qmes-sales-stable.${ROOT_CLASS} .qerp-head-actions button,.qmes-sales-stable.${ROOT_CLASS} .nse-import{height:34px!important;margin:0!important;padding:0 12px!important;border:1px solid #b9c9d5!important;border-radius:6px!important;background:#fff!important;color:#365269!important;font-size:11px!important;font-weight:800!important;box-shadow:none!important}
.qmes-sales-stable.${ROOT_CLASS} .qerp-head-actions .qerp-btn{border-color:#2187c7!important;background:#2187c7!important;color:#fff!important}
#${HOST_ID}{margin:0!important;padding:12px 0 0!important;color:#22384a!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
#${HOST_ID} .qsp-filter{margin:0 0 14px!important;padding:0!important;border:0!important;background:#fff!important;box-shadow:none!important}
#${HOST_ID} .qsp-filter-title{display:flex!important;align-items:center!important;gap:7px!important;margin:0 0 10px!important;color:#203a53!important;font-size:12px!important;font-weight:900!important}
#${HOST_ID} .qsp-filter-grid{display:grid!important;grid-template-columns:350px 155px 250px 145px 145px minmax(270px,1fr) 78px 78px!important;gap:0 10px!important;align-items:end!important;width:100%!important}
#${HOST_ID} .qsp-field{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:0!important}
#${HOST_ID} .qsp-field>span{display:block!important;color:#68758a!important;font-size:10px!important;font-weight:800!important;line-height:12px!important}
#${HOST_ID} .qsp-date{display:grid!important;grid-template-columns:minmax(0,1fr) 14px minmax(0,1fr)!important;gap:4px!important;align-items:center!important}
#${HOST_ID} .qsp-date>b{text-align:center!important;color:#7c8c9a!important;font-size:11px!important}
#${HOST_ID} input,#${HOST_ID} select{display:block!important;width:100%!important;min-width:0!important;height:42px!important;box-sizing:border-box!important;border:1px solid #b9c9d5!important;border-radius:10px!important;background:#fff!important;color:#26394b!important;padding:0 11px!important;font-size:12px!important;font-weight:650!important;outline:none!important;box-shadow:none!important}
#${HOST_ID} input:focus,#${HOST_ID} select:focus{border-color:#4d91c2!important;box-shadow:0 0 0 2px rgba(47,120,183,.10)!important}
#${HOST_ID} .qsp-filter-grid>button{display:flex!important;align-items:center!important;justify-content:center!important;width:78px!important;height:42px!important;margin:0!important;padding:0 8px!important;box-sizing:border-box!important;border:1px solid #b9c9d5!important;border-radius:10px!important;background:linear-gradient(180deg,#fff 0%,#e8eef3 100%)!important;color:#25384a!important;font-size:11px!important;font-weight:850!important;box-shadow:none!important;cursor:pointer!important}
#${HOST_ID} .qsp-filter-grid>button.primary{border-color:#1786c7!important;background:#1786c7!important;color:#fff!important}
#${HOST_ID} .qsp-list{margin:0!important;padding:0!important;overflow:hidden!important;border:1px solid #d3dfe7!important;border-radius:0!important;background:#fff!important;box-shadow:none!important}
#${HOST_ID} .qsp-table-wrap{width:100%!important;overflow:auto!important;background:#fff!important}
#${HOST_ID} table{width:100%!important;min-width:1450px!important;margin:0!important;border-collapse:collapse!important;table-layout:fixed!important;background:#fff!important;color:#405569!important;font-size:10px!important}
#${HOST_ID} thead th{height:46px!important;padding:8px 7px!important;background:linear-gradient(180deg,#7fb4d6 0%,#619bc2 100%)!important;color:#fff!important;border:0!important;border-right:1px solid rgba(255,255,255,.32)!important;border-bottom:1px solid #4f8ab2!important;font-size:10px!important;font-weight:900!important;line-height:1.2!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important}
#${HOST_ID} tbody td{height:46px!important;padding:8px 7px!important;background:#fff!important;color:#405569!important;border:0!important;border-bottom:1px solid #dce5eb!important;font-size:10px!important;font-weight:600!important;line-height:1.25!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#${HOST_ID} tbody tr:nth-child(even) td{background:#f7fafc!important}
#${HOST_ID} tbody tr:hover td{background:#eaf4fb!important}
#${HOST_ID} td.left{text-align:left!important}
#${HOST_ID} td.num{text-align:right!important;font-variant-numeric:tabular-nums!important}
#${HOST_ID} th:nth-child(1){width:7%!important}#${HOST_ID} th:nth-child(2){width:9%!important}#${HOST_ID} th:nth-child(3){width:11%!important}#${HOST_ID} th:nth-child(4){width:16%!important}#${HOST_ID} th:nth-child(5){width:7%!important}#${HOST_ID} th:nth-child(6){width:4%!important}#${HOST_ID} th:nth-child(7){width:8%!important}#${HOST_ID} th:nth-child(8){width:8%!important}#${HOST_ID} th:nth-child(9){width:8%!important}#${HOST_ID} th:nth-child(10){width:8%!important}#${HOST_ID} th:nth-child(11){width:8%!important}#${HOST_ID} th:nth-child(12){width:6%!important}
#${HOST_ID} .qsp-link{border:0!important;background:transparent!important;color:#126ca8!important;font-size:10px!important;font-weight:850!important;padding:0!important;cursor:pointer!important}
#${HOST_ID} .qsp-link:hover{text-decoration:underline!important}
#${HOST_ID} .qsp-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:52px!important;height:23px!important;padding:0 7px!important;border-radius:6px!important;font-size:9px!important;font-weight:850!important;box-sizing:border-box!important}
#${HOST_ID} .qsp-badge.good{background:#e7f8ed!important;color:#18864b!important}#${HOST_ID} .qsp-badge.warn{background:#fff1df!important;color:#d87b15!important}#${HOST_ID} .qsp-badge.bad{background:#ffeaea!important;color:#c94444!important}#${HOST_ID} .qsp-badge.blue{background:#e7f4ff!important;color:#187bc0!important}#${HOST_ID} .qsp-badge.gray,#${HOST_ID} .qsp-badge.neutral{background:#eef1f4!important;color:#647485!important}
#${HOST_ID} .qsp-manage{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important}
#${HOST_ID} .qsp-manage button{height:28px!important;min-width:38px!important;padding:0 8px!important;border:1px solid #b9cbd8!important;border-radius:5px!important;background:#fff!important;color:#365269!important;font-size:9px!important;font-weight:850!important;box-shadow:none!important;cursor:pointer!important}
#${HOST_ID} .qsp-manage button:first-child{border-color:#1786c7!important;background:#1786c7!important;color:#fff!important}
#${HOST_ID} .qsp-empty{height:210px!important;text-align:center!important;color:#8797a6!important;font-size:11px!important}
#${HOST_ID} .qsp-foot{display:flex!important;align-items:center!important;justify-content:flex-end!important;min-height:34px!important;padding:6px 10px!important;border-top:1px solid #dce5eb!important;background:#fff!important;color:#6f8191!important;font-size:10px!important;font-weight:800!important}
@media(max-width:1650px){#${HOST_ID} .qsp-filter-grid{grid-template-columns:300px 145px 220px 135px 135px minmax(240px,1fr) 76px 76px!important}}
@media(max-width:1350px){#${HOST_ID} .qsp-filter-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}#${HOST_ID} .qsp-filter-grid>button{width:100%!important}}
@media(max-width:850px){.qmes-sales-stable.${ROOT_CLASS}>.qerp-head{align-items:flex-start!important;flex-direction:column!important}#${HOST_ID} .qsp-filter-grid{grid-template-columns:1fr!important}}
`;
    document.head.appendChild(s);
  }

  function render(){
    const host=document.getElementById(HOST_ID);if(!host)return;
    const all=viewRows(),data=filtered(all),customerList=customers(all);
    const customerOptions=['<option value="">전체</option>'].concat(customerList.map(v=>'<option value="'+esc(v)+'"'+(state.customer===v?' selected':'')+'>'+esc(v)+'</option>')).join('');
    const progressOptions=['전체','생산대기','생산진행','생산완료','출하진행','출하완료'].map(v=>'<option'+(state.progress===v?' selected':'')+'>'+esc(v)+'</option>').join('');
    const dueOptions=['전체','정상','임박','지연','완료'].map(v=>'<option'+(state.due===v?' selected':'')+'>'+esc(v)+'</option>').join('');
    host.innerHTML=
      '<div class="qsp-filter"><div class="qsp-filter-title">⌕ 검색 조건</div><div class="qsp-filter-grid">'+
        '<label class="qsp-field"><span>기간</span><span class="qsp-date"><input type="date" data-qsp-from value="'+esc(state.from)+'"><b>~</b><input type="date" data-qsp-to value="'+esc(state.to)+'"></span></label>'+
        '<label class="qsp-field"><span>거래처</span><select data-qsp-customer>'+customerOptions+'</select></label>'+
        '<label class="qsp-field"><span>품목명</span><input data-qsp-product value="'+esc(state.product)+'" placeholder="품목명 또는 규격 입력"></label>'+
        '<label class="qsp-field"><span>진행상태</span><select data-qsp-progress>'+progressOptions+'</select></label>'+
        '<label class="qsp-field"><span>납기상태</span><select data-qsp-due>'+dueOptions+'</select></label>'+
        '<label class="qsp-field"><span>통합검색</span><input data-qsp-q value="'+esc(state.q)+'" placeholder="수주번호, 거래처명, 품목명 등 검색"></label>'+
        '<button type="button" class="primary" data-qsp-search>⌕ 조회</button>'+
        '<button type="button" data-qsp-reset>↻ 초기화</button>'+
      '</div></div>'+
      '<div class="qsp-list"><div class="qsp-table-wrap"><table><thead><tr>'+
        '<th>수주일 ↓</th><th>수주번호</th><th>거래처명</th><th>품목명 (규격)</th><th>수주수량</th><th>단위</th><th>요청납기</th><th>납기상태</th><th>생산상태</th><th>출하상태</th><th>납품처</th><th>관리</th>'+
      '</tr></thead><tbody>'+rowsHtml(data)+'</tbody></table></div>'+
      '<div class="qsp-foot">총 '+data.length+'건 · 수주량 '+fmt(data.reduce((s,x)=>s+x.qty,0))+' kg</div></div>';

    const root=document.querySelector('.qmes-sales-stable');
    const sub=root&&root.querySelector('.qerp-sub');
    if(sub)sub.textContent='총 '+data.length+'건';
  }

  function readFilters(){
    const host=document.getElementById(HOST_ID);if(!host)return;
    state.from=clean(host.querySelector('[data-qsp-from]')&&host.querySelector('[data-qsp-from]').value);
    state.to=clean(host.querySelector('[data-qsp-to]')&&host.querySelector('[data-qsp-to]').value);
    state.customer=clean(host.querySelector('[data-qsp-customer]')&&host.querySelector('[data-qsp-customer]').value);
    state.product=clean(host.querySelector('[data-qsp-product]')&&host.querySelector('[data-qsp-product]').value);
    state.progress=clean(host.querySelector('[data-qsp-progress]')&&host.querySelector('[data-qsp-progress]').value)||'전체';
    state.due=clean(host.querySelector('[data-qsp-due]')&&host.querySelector('[data-qsp-due]').value)||'전체';
    state.q=clean(host.querySelector('[data-qsp-q]')&&host.querySelector('[data-qsp-q]').value);
  }

  function reset(){
    const d=new Date(),y=d.getFullYear();
    state.from=y+'-01-01';state.to=y+'-12-31';state.customer='';state.product='';state.progress='전체';state.due='전체';state.q='';
  }

  function findRow(id){
    const wanted=clean(id),map=metas();
    return rows().find(row=>{const raw=clean(row&&row.id),key=rowKey(row),shown=visibleId(row,map);return wanted&&(wanted===raw||wanted===key||wanted===shown);})||null;
  }

  function openDetail(id){
    if(window.qmesSalesDetailConsistency&&typeof window.qmesSalesDetailConsistency.open==='function'){window.qmesSalesDetailConsistency.open(id);return;}
    if(window.qmesSalesOrderDetail&&typeof window.qmesSalesOrderDetail.open==='function')window.qmesSalesOrderDetail.open(id);
  }
  function openEdit(id){
    const row=findRow(id);if(!row)return;
    if(window.qmesSalesEditDirectV18&&typeof window.qmesSalesEditDirectV18.open==='function')window.qmesSalesEditDirectV18.open(row);
  }

  function ensure(){
    queued=false;installStyle();
    const root=document.querySelector('.qmes-sales-stable');if(!root)return;
    root.classList.add(ROOT_CLASS);
    const title=root.querySelector('.qerp-title');if(title)title.textContent='수주·납기 관리대장';
    let host=document.getElementById(HOST_ID);
    if(!host){host=document.createElement('section');host.id=HOST_ID;const head=root.querySelector(':scope > .qerp-head');if(head&&head.nextSibling)root.insertBefore(host,head.nextSibling);else root.insertBefore(host,root.firstChild);}
    render();
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(ensure);}

  function start(){
    installStyle();schedule();
    document.addEventListener('click',e=>{
      const t=e.target instanceof Element?e.target:null;if(!t)return;
      const detail=t.closest('[data-qsp-detail]');if(detail){e.preventDefault();openDetail(clean(detail.getAttribute('data-qsp-detail')));return;}
      const edit=t.closest('[data-qsp-edit]');if(edit){e.preventDefault();openEdit(clean(edit.getAttribute('data-qsp-edit')));return;}
      if(t.closest('[data-qsp-search]')){readFilters();render();return;}
      if(t.closest('[data-qsp-reset]')){reset();render();return;}
    },true);
    document.addEventListener('keydown',e=>{const t=e.target instanceof Element?e.target:null;if(e.key==='Enter'&&t&&t.matches('#'+HOST_ID+' [data-qsp-q],#'+HOST_ID+' [data-qsp-product]')){e.preventDefault();readFilters();render();}},true);
    ['qmes:mes-master-ready','qmes:enterprise-ui-ready','qmes:erp-data-changed','qmes:data-updated','qmes:shared-sync-complete','qmes:sales-workorder-linked'].forEach(n=>window.addEventListener(n,schedule));
    window.addEventListener('storage',e=>{if([SALES_KEY,META_KEY,SHIPPING_KEY,DELETED_KEY].includes(e.key))schedule();});
    const observer=new MutationObserver(ms=>{
      const relevant=ms.some(m=>{const t=m.target&&m.target.nodeType===1?m.target:m.target&&m.target.parentElement;return !(t&&t.closest&&t.closest('#'+HOST_ID));});
      if(relevant)schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    [100,250,600,1200,2500,4000].forEach(ms=>setTimeout(schedule,ms));
    window.qmesSalesPurchaseUiMatch20260918={ensure,render};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
