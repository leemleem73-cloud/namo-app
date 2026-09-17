/* NAMO QMES - sales/due simple ledger view
 * 2026-09-18
 * ADD-ONLY PATCH.
 * Existing Sales data, create/edit/detail, sync and runtime modules are preserved.
 * This file only adds an alternative ledger-style view for the Sales/Due screen.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_DUE_LEDGER_20260918__) return;
  window.__QMES_SALES_DUE_LEDGER_20260918__ = true;

  const SALES_KEY = 'qmes-erp-sales-v1';
  const META_KEY = 'qmes-sales-order-meta-v1';
  const SHIPPING_KEY = 'qmes-erp-shipping-v1';
  const HOST_ID = 'qmes-sales-due-ledger-20260918';
  const STYLE_ID = 'qmes-sales-due-ledger-20260918-style';
  const ACTIVE_CLASS = 'qmes-sales-due-ledger-active';
  const DAY = 86400000;

  const state = { q:'', year:'전체', month:'전체', due:'전체' };
  let queued = false;

  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  const num = v => {
    const n = Number(String(v == null ? '' : v).replace(/[^0-9.+-]/g,''));
    return Number.isFinite(n) ? n : 0;
  };
  const esc = v => String(v == null ? '' : v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const read = (key,fallback) => {
    try{
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    }catch(_error){
      return fallback;
    }
  };
  const salesRows = () => {
    const value = read(SALES_KEY,[]);
    return Array.isArray(value) ? value : [];
  };
  const metaMap = () => {
    const value = read(META_KEY,{});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  };
  const shippingRows = () => {
    const value = read(SHIPPING_KEY,[]);
    return Array.isArray(value) ? value : [];
  };
  const rowKey = row => clean(row && (row.workOrder || row.id));
  const metaFor = (row,map) => {
    map = map || metaMap();
    return map[rowKey(row)] || map[clean(row && row.id)] || (row && row.orderMeta) || {};
  };
  const visibleId = (row,map) => {
    const meta = metaFor(row,map);
    return clean(meta.salesOrderIdOverride) || clean(row && row.id);
  };
  const iso = v => {
    const m = clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    return m ? m[1] + '-' + String(m[2]).padStart(2,'0') + '-' + String(m[3]).padStart(2,'0') : '';
  };
  const dateMs = v => {
    const d = iso(v);
    if(!d) return null;
    const t = new Date(d + 'T00:00:00').getTime();
    return Number.isFinite(t) ? t : null;
  };
  const todayMs = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.getTime();
  };

  function orderDateFromId(id){
    const m = clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-(\d+)/i);
    return m ? m[1] + '-' + m[2] + '-' + m[3] : '';
  }

  function orderDate(row,map){
    const meta = metaFor(row,map);
    return iso(
      row && (row.orderDate || row.order_date || row.createdAt || row.created_at) ||
      meta.orderDate || meta.order_date || meta.createdAt || meta.created_at
    ) || orderDateFromId(visibleId(row,map));
  }

  function salesDateNo(row,map){
    const id = visibleId(row,map);
    const m = id.match(/^SO-(20\d{2})(\d{2})(\d{2})-(\d+)/i);
    if(m) return m[1] + '/' + m[2] + '/' + m[3] + ' - ' + m[4];
    const d = orderDate(row,map);
    return (d ? d.replace(/-/g,'/') + ' - ' : '') + (id || '-');
  }

  function customerOf(row,map){
    const meta = metaFor(row,map);
    return clean(meta.customerOverride) || clean(row && row.customer) || '-';
  }

  function productOf(row,map){
    const meta = metaFor(row,map);
    const product = clean(meta.productOverride) || clean(row && row.product) || '-';
    const spec = clean(meta.spec || meta.specification || (row && (row.spec || row.specification)));
    return spec && product.indexOf(spec) < 0 ? product + ' (' + spec + ')' : product;
  }

  function qtyOf(row,map){
    const meta = metaFor(row,map);
    return num(meta.qtyOverride != null ? meta.qtyOverride : row && row.qty);
  }

  function dueOf(row,map){
    const meta = metaFor(row,map);
    return iso(meta.requestedDue || (row && row.due));
  }

  function deliveryPlaceOf(row,map){
    const meta = metaFor(row,map);
    return clean(meta.deliveryPlace) || clean(row && row.deliveryPlace) || '-';
  }

  function completedText(value){
    return /출하완료|납품완료|배송완료|출고완료/.test(clean(value));
  }

  function shipmentFor(row,map,ships){
    const meta = metaFor(row,map);
    const id = visibleId(row,map);
    const rawId = clean(row && row.id);
    const wo = rowKey(row);
    const localState = [
      row && row.shipping,row && row.delivery,
      meta.shippingStatus,meta.deliveryStatus
    ].map(clean).join(' ');

    if((row && row.actualShipment === true) || meta.actualShipment === true || completedText(localState)){
      return {
        complete:true,
        date:iso((row && (row.actualShipDate || row.shipDate)) || meta.actualShipDate || meta.shipDate),
        status:'출하완료'
      };
    }

    const matches = (ships || []).filter(ship => {
      const sid = clean(ship && (ship.sales || ship.salesOrder || ship.salesOrderId));
      const swo = clean(ship && (ship.workOrder || ship.lot));
      const status = [
        ship && ship.shipping,ship && ship.delivery,ship && ship.status
      ].map(clean).join(' ');
      const linked = (sid && (sid === id || sid === rawId)) || (wo && swo === wo);
      return linked && ((ship && ship.actualShipment === true) || completedText(status));
    });

    matches.sort((a,b) => String(
      iso(b && (b.actualShipDate || b.shipDate || b.actualDate || b.date || b.completedAt))
    ).localeCompare(String(
      iso(a && (a.actualShipDate || a.shipDate || a.actualDate || a.date || a.completedAt))
    )));

    const ship = matches[0];
    if(ship){
      return {
        complete:true,
        date:iso(ship.actualShipDate || ship.shipDate || ship.actualDate || ship.date || ship.completedAt),
        status:'출하완료'
      };
    }
    return null;
  }

  function dueState(row,map,ships){
    const due = dueOf(row,map);
    const ship = shipmentFor(row,map,ships);

    if(ship && ship.complete){
      const actual = iso(ship.date);
      if(!due || !actual) return {label:'납기완료',tone:'good',bucket:'완료'};
      const diff = Math.round((dateMs(actual) - dateMs(due)) / DAY);
      return diff <= 0
        ? {label:'납기완료',tone:'good',bucket:'완료'}
        : {label:'지연완료 ' + diff + '일',tone:'bad',bucket:'완료'};
    }

    if(!due) return {label:'-',tone:'neutral',bucket:'기타'};
    const diff = Math.round((dateMs(due) - todayMs()) / DAY);
    if(diff < 0) return {label:'지연 ' + Math.abs(diff) + '일',tone:'bad',bucket:'지연'};
    if(diff <= 7) return {label:'임박 D-' + diff,tone:'warn',bucket:'임박'};
    return {label:'정상',tone:'good',bucket:'정상'};
  }

  function productionState(row,map,ship){
    const meta = metaFor(row,map);
    if(ship && ship.complete) return '생산완료';
    const raw = clean(meta.productionPlanStatus) || clean(row && row.plan);
    if(/생산완료|완료/.test(raw)) return '생산완료';
    if(/생산중|진행/.test(raw)) return '생산중';
    if(raw && !/계획대기|대기|미반영/.test(raw)) return raw;
    if(clean(row && row.workOrder) || clean(meta.workOrder)) return '생산진행';
    return raw || '생산대기';
  }

  function shippingState(row,map,ship){
    const meta = metaFor(row,map);
    if(ship && ship.complete) return '출하완료';
    const raw = clean(meta.shippingStatus) || clean(row && row.shipping);
    if(raw && raw !== '-') return raw;
    return '출하대기';
  }

  function viewRows(){
    const map = metaMap();
    const ships = shippingRows();
    return salesRows().filter(Boolean).map(row => {
      const id = visibleId(row,map);
      const ship = shipmentFor(row,map,ships);
      const due = dueState(row,map,ships);
      const date = orderDate(row,map);
      const customer = customerOf(row,map);
      const product = productOf(row,map);
      return {
        row:row,
        id:id,
        date:date,
        dateNo:salesDateNo(row,map),
        customer:customer,
        product:product,
        qty:qtyOf(row,map),
        requestedDue:dueOf(row,map),
        dueState:due,
        production:productionState(row,map,ship),
        shipping:shippingState(row,map,ship),
        deliveryPlace:deliveryPlaceOf(row,map)
      };
    }).sort((a,b) => {
      const d = String(b.date).localeCompare(String(a.date));
      return d || String(b.id).localeCompare(String(a.id),undefined,{numeric:true});
    });
  }

  function filteredRows(rows){
    const q = clean(state.q).toLowerCase();
    return rows.filter(item => {
      const d = item.date || '';
      if(state.year !== '전체' && d.slice(0,4) !== state.year) return false;
      if(state.month !== '전체' && d.slice(5,7) !== state.month) return false;
      if(state.due !== '전체' && item.dueState.bucket !== state.due) return false;
      if(q){
        const hay = [
          item.id,item.dateNo,item.customer,item.product,item.requestedDue,
          item.dueState.label,item.production,item.shipping,item.deliveryPlace
        ].join(' ').toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function years(rows){
    return Array.from(new Set(rows.map(x => (x.date || '').slice(0,4)).filter(Boolean))).sort().reverse();
  }

  function fmtQty(value){
    return Number(value || 0).toLocaleString('ko-KR',{maximumFractionDigits:3});
  }

  function toneClass(tone){
    return tone === 'good' ? 'good' : tone === 'warn' ? 'warn' : tone === 'bad' ? 'bad' : 'neutral';
  }

  function monthLabel(key){
    if(!/^20\d{2}-\d{2}$/.test(key)) return '일자 미지정';
    return key.slice(0,4) + '/' + key.slice(5,7) + ' 계';
  }

  function renderBody(rows){
    if(!rows.length){
      return '<tr><td colspan="10" class="qsld-empty">조회 조건에 해당하는 수주가 없습니다.</td></tr>';
    }

    const groups = new Map();
    rows.forEach(item => {
      const key = item.date ? item.date.slice(0,7) : '미지정';
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(item);
    });

    let html = '';
    groups.forEach((items,key) => {
      items.forEach(item => {
        html += '<tr>' +
          '<td><button type="button" class="qsld-order" data-qsld-detail="' + esc(item.id) + '" title="' + esc(item.id) + '">' + esc(item.dateNo) + '</button></td>' +
          '<td class="left" title="' + esc(item.product) + '">' + esc(item.product) + '</td>' +
          '<td class="num">' + fmtQty(item.qty) + '</td>' +
          '<td>' + esc(item.requestedDue || '-') + '</td>' +
          '<td><span class="qsld-badge ' + toneClass(item.dueState.tone) + '">' + esc(item.dueState.label) + '</span></td>' +
          '<td><span class="qsld-status">' + esc(item.production) + '</span></td>' +
          '<td><span class="qsld-status">' + esc(item.shipping) + '</span></td>' +
          '<td class="left" title="' + esc(item.deliveryPlace) + '">' + esc(item.deliveryPlace) + '</td>' +
          '<td class="left" title="' + esc(item.customer) + '">' + esc(item.customer) + '</td>' +
          '<td><span class="qsld-manage"><button type="button" data-qsld-detail="' + esc(item.id) + '">상세</button><button type="button" data-qsld-edit="' + esc(item.id) + '">수정</button></span></td>' +
        '</tr>';
      });

      const totalQty = items.reduce((sum,item) => sum + num(item.qty),0);
      const complete = items.filter(item => item.dueState.bucket === '완료').length;
      const delayed = items.filter(item => item.dueState.bucket === '지연').length;
      const urgent = items.filter(item => item.dueState.bucket === '임박').length;
      html += '<tr class="qsld-subtotal">' +
        '<td colspan="2">' + esc(monthLabel(key)) + '</td>' +
        '<td class="num">' + fmtQty(totalQty) + '</td>' +
        '<td></td>' +
        '<td colspan="3">납기완료 ' + complete + '건 · 임박 ' + urgent + '건 · 지연 ' + delayed + '건</td>' +
        '<td></td><td></td><td></td>' +
      '</tr>';
    });
    return html;
  }

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.qmes-sales-stable.' + ACTIVE_CLASS + '>.qerp-kpis,.qmes-sales-stable.' + ACTIVE_CLASS + '>.qerp-card{display:none!important}',
      '.qmes-sales-stable.' + ACTIVE_CLASS + ' #qmes-sales-enterprise-module-v2{display:none!important}',
      '.qmes-sales-stable.' + ACTIVE_CLASS + ' .qerp-sub{display:none!important}',
      '.qmes-sales-stable.' + ACTIVE_CLASS + ' .qerp-head{min-height:54px!important;margin:0!important;padding:0 0 12px!important;border-bottom:1px solid #d9e3ea!important;align-items:center!important}',
      '.qmes-sales-stable.' + ACTIVE_CLASS + ' .qerp-title{margin:0!important;color:#13283e!important;font-size:18px!important;line-height:1.25!important;font-weight:900!important;letter-spacing:-.35px!important}',
      '.qmes-sales-stable.' + ACTIVE_CLASS + ' .qerp-head-actions{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:wrap!important}',
      '.qmes-sales-stable.' + ACTIVE_CLASS + ' .qerp-head-actions button{height:34px!important;padding:0 12px!important;border:1px solid #b9c9d5!important;border-radius:6px!important;background:#fff!important;color:#365269!important;font-size:11px!important;font-weight:800!important;box-shadow:none!important}',
      '#' + HOST_ID + '{margin:0!important;padding:12px 0 0!important;color:#22384a!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}',
      '#' + HOST_ID + ' .qsld-filter{display:grid!important;grid-template-columns:minmax(300px,1.5fr) 150px 150px 150px 84px 84px!important;gap:10px!important;align-items:end!important;margin:0 0 14px!important;padding:0!important}',
      '#' + HOST_ID + ' .qsld-field{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:0!important}',
      '#' + HOST_ID + ' .qsld-field>span{color:#68758a!important;font-size:10px!important;font-weight:800!important;line-height:12px!important}',
      '#' + HOST_ID + ' input,#' + HOST_ID + ' select{width:100%!important;height:42px!important;box-sizing:border-box!important;border:1px solid #b9c9d5!important;border-radius:10px!important;background:#fff!important;color:#26394b!important;padding:0 11px!important;font-size:12px!important;font-weight:650!important;outline:none!important;box-shadow:none!important}',
      '#' + HOST_ID + ' input:focus,#' + HOST_ID + ' select:focus{border-color:#4d91c2!important;box-shadow:0 0 0 2px rgba(47,120,183,.10)!important}',
      '#' + HOST_ID + ' .qsld-filter>button{height:42px!important;border:1px solid #b9c9d5!important;border-radius:10px!important;background:linear-gradient(180deg,#fff 0%,#e8eef3 100%)!important;color:#25384a!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important}',
      '#' + HOST_ID + ' .qsld-filter>button.primary{border-color:#1786c7!important;background:#1786c7!important;color:#fff!important}',
      '#' + HOST_ID + ' .qsld-card{overflow:hidden!important;border:1px solid #d3dfe7!important;background:#fff!important}',
      '#' + HOST_ID + ' .qsld-table-wrap{width:100%!important;overflow:auto!important}',
      '#' + HOST_ID + ' table{width:100%!important;min-width:1350px!important;border-collapse:collapse!important;table-layout:fixed!important;background:#fff!important;color:#405569!important;font-size:10px!important}',
      '#' + HOST_ID + ' th{height:46px!important;padding:8px 7px!important;background:linear-gradient(180deg,#7fb4d6 0%,#619bc2 100%)!important;color:#fff!important;border:0!important;border-right:1px solid rgba(255,255,255,.32)!important;border-bottom:1px solid #4f8ab2!important;font-size:10px!important;font-weight:900!important;text-align:center!important;white-space:nowrap!important}',
      '#' + HOST_ID + ' td{height:44px!important;padding:8px 7px!important;background:#fff!important;color:#405569!important;border:0!important;border-bottom:1px solid #dce5eb!important;font-size:10px!important;font-weight:600!important;line-height:1.25!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}',
      '#' + HOST_ID + ' tbody tr:nth-child(even):not(.qsld-subtotal) td{background:#f7fafc!important}',
      '#' + HOST_ID + ' tbody tr:not(.qsld-subtotal):hover td{background:#eaf4fb!important}',
      '#' + HOST_ID + ' td.left{text-align:left!important}',
      '#' + HOST_ID + ' td.num{text-align:right!important;font-variant-numeric:tabular-nums!important}',
      '#' + HOST_ID + ' th:nth-child(1){width:12%!important}#' + HOST_ID + ' th:nth-child(2){width:17%!important}#' + HOST_ID + ' th:nth-child(3){width:7%!important}#' + HOST_ID + ' th:nth-child(4){width:9%!important}#' + HOST_ID + ' th:nth-child(5){width:9%!important}#' + HOST_ID + ' th:nth-child(6){width:9%!important}#' + HOST_ID + ' th:nth-child(7){width:9%!important}#' + HOST_ID + ' th:nth-child(8){width:10%!important}#' + HOST_ID + ' th:nth-child(9){width:11%!important}#' + HOST_ID + ' th:nth-child(10){width:7%!important}',
      '#' + HOST_ID + ' .qsld-order{border:0!important;background:transparent!important;color:#126ca8!important;font-size:10px!important;font-weight:850!important;cursor:pointer!important;padding:0!important}',
      '#' + HOST_ID + ' .qsld-order:hover{text-decoration:underline!important}',
      '#' + HOST_ID + ' .qsld-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important;height:24px!important;padding:0 8px!important;border-radius:6px!important;font-size:9px!important;font-weight:850!important}',
      '#' + HOST_ID + ' .qsld-badge.good{background:#e7f8ed!important;color:#18864b!important}#' + HOST_ID + ' .qsld-badge.warn{background:#fff1df!important;color:#d87b15!important}#' + HOST_ID + ' .qsld-badge.bad{background:#ffeaea!important;color:#c94444!important}#' + HOST_ID + ' .qsld-badge.neutral{background:#eef1f4!important;color:#647485!important}',
      '#' + HOST_ID + ' .qsld-status{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important;height:24px!important;padding:0 8px!important;border-radius:6px!important;background:#eef5fa!important;color:#41627c!important;font-size:9px!important;font-weight:850!important}',
      '#' + HOST_ID + ' .qsld-manage{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important}',
      '#' + HOST_ID + ' .qsld-manage button{height:28px!important;min-width:38px!important;padding:0 8px!important;border:1px solid #b9cbd8!important;border-radius:5px!important;background:#fff!important;color:#365269!important;font-size:9px!important;font-weight:850!important;cursor:pointer!important}',
      '#' + HOST_ID + ' .qsld-manage button:first-child{border-color:#1786c7!important;background:#1786c7!important;color:#fff!important}',
      '#' + HOST_ID + ' .qsld-subtotal td{height:34px!important;background:#f4f6f8!important;color:#172033!important;font-weight:900!important;border-bottom:1px solid #cfd9e2!important}',
      '#' + HOST_ID + ' .qsld-empty{height:180px!important;text-align:center!important;color:#8797a6!important;font-size:11px!important}',
      '#' + HOST_ID + ' .qsld-summary{display:flex!important;justify-content:flex-end!important;padding:8px 10px!important;border-top:1px solid #dce5eb!important;background:#fff!important;color:#6c7f91!important;font-size:10px!important;font-weight:800!important}',
      '@media(max-width:1200px){#' + HOST_ID + ' .qsld-filter{grid-template-columns:repeat(3,minmax(0,1fr))!important}}',
      '@media(max-width:760px){#' + HOST_ID + ' .qsld-filter{grid-template-columns:1fr!important}.qmes-sales-stable.' + ACTIVE_CLASS + ' .qerp-head{align-items:flex-start!important;flex-direction:column!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function render(){
    const host = document.getElementById(HOST_ID);
    if(!host) return;
    const all = viewRows();
    const filtered = filteredRows(all);
    const yearList = years(all);
    const yearOptions = ['전체'].concat(yearList).map(v =>
      '<option value="' + esc(v) + '"' + (state.year === v ? ' selected' : '') + '>' + (v === '전체' ? '전체 연도' : esc(v + '년')) + '</option>'
    ).join('');
    const monthOptions = ['전체'].concat(Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'))).map(v =>
      '<option value="' + esc(v) + '"' + (state.month === v ? ' selected' : '') + '>' + (v === '전체' ? '전체 월' : esc(Number(v) + '월')) + '</option>'
    ).join('');
    const dueOptions = ['전체','정상','임박','지연','완료'].map(v =>
      '<option value="' + esc(v) + '"' + (state.due === v ? ' selected' : '') + '>' + (v === '전체' ? '전체 납기상태' : esc(v)) + '</option>'
    ).join('');
    const totalQty = filtered.reduce((sum,item)=>sum+num(item.qty),0);

    host.innerHTML =
      '<div class="qsld-filter">' +
        '<label class="qsld-field"><span>수주 / 고객사 / 제품 검색</span><input type="search" data-qsld-q value="' + esc(state.q) + '" placeholder="수주번호, 고객사, 제품명 검색"></label>' +
        '<label class="qsld-field"><span>연도</span><select data-qsld-year>' + yearOptions + '</select></label>' +
        '<label class="qsld-field"><span>월</span><select data-qsld-month>' + monthOptions + '</select></label>' +
        '<label class="qsld-field"><span>납기상태</span><select data-qsld-due>' + dueOptions + '</select></label>' +
        '<button type="button" class="primary" data-qsld-search>조회</button>' +
        '<button type="button" data-qsld-reset>초기화</button>' +
      '</div>' +
      '<div class="qsld-card"><div class="qsld-table-wrap"><table>' +
        '<thead><tr><th>수주일자-No.</th><th>품목명(규격)</th><th>수량</th><th>요청납기</th><th>납기상태</th><th>생산상태</th><th>출하상태</th><th>납품처</th><th>거래처명</th><th>관리</th></tr></thead>' +
        '<tbody>' + renderBody(filtered) + '</tbody>' +
      '</table></div><div class="qsld-summary">총 ' + filtered.length + '건 · 수주량 ' + fmtQty(totalQty) + ' kg</div></div>';
  }

  function root(){
    return document.querySelector('.qmes-sales-stable');
  }

  function ensure(){
    queued = false;
    installStyle();
    const salesRoot = root();
    if(!salesRoot) return;

    salesRoot.classList.add(ACTIVE_CLASS);
    const title = salesRoot.querySelector('.qerp-title');
    if(title && clean(title.textContent) !== '수주·납기 관리대장') title.textContent = '수주·납기 관리대장';

    let host = document.getElementById(HOST_ID);
    if(!host){
      host = document.createElement('section');
      host.id = HOST_ID;
      const head = salesRoot.querySelector(':scope > .qerp-head');
      if(head && head.nextSibling) salesRoot.insertBefore(host,head.nextSibling);
      else salesRoot.insertBefore(host,salesRoot.firstChild);
    }
    render();
  }

  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(ensure);
  }

  function setFiltersFromHost(){
    const host = document.getElementById(HOST_ID);
    if(!host) return;
    state.q = clean(host.querySelector('[data-qsld-q]') && host.querySelector('[data-qsld-q]').value);
    state.year = clean(host.querySelector('[data-qsld-year]') && host.querySelector('[data-qsld-year]').value) || '전체';
    state.month = clean(host.querySelector('[data-qsld-month]') && host.querySelector('[data-qsld-month]').value) || '전체';
    state.due = clean(host.querySelector('[data-qsld-due]') && host.querySelector('[data-qsld-due]').value) || '전체';
  }

  function findRowById(id){
    const wanted = clean(id);
    const map = metaMap();
    return salesRows().find(row => {
      const raw = clean(row && row.id);
      const key = rowKey(row);
      const shown = visibleId(row,map);
      return wanted && (wanted === raw || wanted === key || wanted === shown);
    }) || null;
  }

  function openDetail(id){
    if(window.qmesSalesDetailConsistency && typeof window.qmesSalesDetailConsistency.open === 'function'){
      window.qmesSalesDetailConsistency.open(id);
      return;
    }
    if(window.qmesSalesOrderDetail && typeof window.qmesSalesOrderDetail.open === 'function'){
      window.qmesSalesOrderDetail.open(id);
    }
  }

  function openEdit(id){
    const row = findRowById(id);
    if(!row) return;
    if(window.qmesSalesEditDirectV18 && typeof window.qmesSalesEditDirectV18.open === 'function'){
      window.qmesSalesEditDirectV18.open(row);
    }
  }

  function exportCsv(){
    const rows = filteredRows(viewRows());
    const header = ['수주일자-No.','수주번호','품목명(규격)','수량(kg)','요청납기','납기상태','생산상태','출하상태','납품처','거래처명'];
    const body = rows.map(item => [
      item.dateNo,item.id,item.product,item.qty,item.requestedDue,
      item.dueState.label,item.production,item.shipping,item.deliveryPlace,item.customer
    ]);
    const csv = '\uFEFF' + [header].concat(body).map(cols =>
      cols.map(v => '"' + String(v == null ? '' : v).replace(/"/g,'""') + '"').join(',')
    ).join('\r\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'QMES_수주납기_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),800);
  }

  function start(){
    installStyle();
    schedule();

    document.addEventListener('click',event => {
      const target = event.target instanceof Element ? event.target : null;
      if(!target) return;

      const detail = target.closest('[data-qsld-detail]');
      if(detail){
        event.preventDefault();
        openDetail(clean(detail.getAttribute('data-qsld-detail')));
        return;
      }

      const edit = target.closest('[data-qsld-edit]');
      if(edit){
        event.preventDefault();
        openEdit(clean(edit.getAttribute('data-qsld-edit')));
        return;
      }

      if(target.closest('[data-qsld-search]')){
        setFiltersFromHost();
        render();
        return;
      }

      if(target.closest('[data-qsld-reset]')){
        state.q=''; state.year='전체'; state.month='전체'; state.due='전체';
        render();
        return;
      }

      if(target.closest('[data-qsld-export]')){
        exportCsv();
      }
    },true);

    document.addEventListener('change',event => {
      const target = event.target instanceof Element ? event.target : null;
      if(!target || !target.closest('#' + HOST_ID)) return;
      if(target.matches('[data-qsld-year],[data-qsld-month],[data-qsld-due]')){
        setFiltersFromHost();
        render();
      }
    },true);

    document.addEventListener('keydown',event => {
      const target = event.target instanceof Element ? event.target : null;
      if(event.key === 'Enter' && target && target.matches('#' + HOST_ID + ' [data-qsld-q]')){
        event.preventDefault();
        setFiltersFromHost();
        render();
      }
    },true);

    [
      'qmes:mes-master-ready','qmes:enterprise-ui-ready','qmes:erp-data-changed',
      'qmes:data-updated','qmes:shared-sync-complete','qmes:sales-workorder-linked'
    ].forEach(name => window.addEventListener(name,schedule));

    window.addEventListener('storage',event => {
      if([SALES_KEY,META_KEY,SHIPPING_KEY].includes(event.key)) schedule();
    });

    const observer = new MutationObserver(mutations => {
      const relevant = mutations.some(mutation => {
        const target = mutation.target && mutation.target.nodeType === 1 ? mutation.target : mutation.target && mutation.target.parentElement;
        if(target && target.closest && target.closest('#' + HOST_ID)) return false;
        return true;
      });
      if(relevant) schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});

    [100,250,600,1200,2500].forEach(ms => setTimeout(schedule,ms));
    window.qmesSalesDueLedger20260918 = {ensure:ensure,render:render,exportCsv:exportCsv};
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
