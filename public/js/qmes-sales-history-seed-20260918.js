/* NAMO QMES - Sales/Due historical content seed from provided Sales Status
 * 2026-09-18
 * ADD-ONLY / IDEMPOTENT.
 * - Adds historical sales rows without overwriting existing real sales rows.
 * - Requested due dates are intentionally left blank because the source Sales Status did not provide them.
 * - Historical rows are marked shipped/completed so they do not appear as false overdue orders.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_HISTORY_SEED_20260918_V1__) return;
  window.__QMES_SALES_HISTORY_SEED_20260918_V1__ = true;

  const SALES_KEY = 'qmes-erp-sales-v1';
  const META_KEY = 'qmes-sales-order-meta-v1';
  const SEED_VERSION = 'sales-status-20260918-v1';
  const ERP_SYNC_TYPE = 'inventory';
  const ERP_SYNC_KEY = 'erp:sales';

  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  const read = (key,fallback) => {
    try{
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    }catch(_error){
      return fallback;
    }
  };
  const write = (key,value) => {
    try{ localStorage.setItem(key,JSON.stringify(value)); }catch(_error){}
  };
  const parsePayload = value => {
    if(value && typeof value === 'object') return value;
    if(typeof value === 'string'){
      try{return JSON.parse(value);}catch(_error){return {};}
    }
    return {};
  };

  const sourceRows = [
    {id:'SO-250526-01',date:'2025-05-26',customer:'현대자동차',product:'NBA15-HM01',qty:1.48,sourceUnit:'g',sourceQty:1480},
    {id:'SO-250526-02',date:'2025-05-26',customer:'현대자동차',product:'NBA20-HM01',qty:1.64,sourceUnit:'g',sourceQty:1640},
    {id:'SO-250630-01',date:'2025-06-30',customer:'현대자동차',product:'NBA15-HM01',qty:0.55,sourceUnit:'g',sourceQty:550},
    {id:'SO-250630-02',date:'2025-06-30',customer:'현대자동차',product:'NBA20-HM01',qty:0.55,sourceUnit:'g',sourceQty:550},
    {id:'SO-250714-01',date:'2025-07-14',customer:'현대자동차',product:'NBA20-HM01',qty:1,sourceUnit:'g',sourceQty:1000},
    {id:'SO-250806-01',date:'2025-08-06',customer:'현대자동차',product:'NBA20-P4S6-HM01',qty:0.1,sourceUnit:'g',sourceQty:100},
    {id:'SO-250806-02',date:'2025-08-06',customer:'현대자동차',product:'NBA20-S5V5-HM01',qty:0.1,sourceUnit:'g',sourceQty:100},
    {id:'SO-250905-01',date:'2025-09-05',customer:'(주)제이에스케미칼',product:'OZE33-JS01',qty:20,sourceUnit:'kg',sourceQty:20},
    {id:'SO-251204-01',date:'2025-12-04',customer:'현대자동차',product:'절연슬러리',qty:150,sourceUnit:'kg',sourceQty:150},
    {id:'SO-251205-01',date:'2025-12-05',customer:'(주)제이에스케미칼',product:'OZE33-JS01',qty:25,sourceUnit:'kg',sourceQty:25},
    {id:'SO-260202-01',date:'2026-02-02',customer:'현대자동차',product:'ADC30G(SBR)',qty:64,sourceUnit:'kg',sourceQty:64},
    {id:'SO-260202-02',date:'2026-02-02',customer:'현대자동차',product:'AOH30(Boehmite)',qty:12,sourceUnit:'kg',sourceQty:12},
    {id:'SO-260202-03',date:'2026-02-02',customer:'현대자동차',product:'NMP(SNET)',qty:1219,sourceUnit:'kg',sourceQty:1219},
    {id:'SO-260202-04',date:'2026-02-02',customer:'현대자동차',product:'절연슬러리',qty:273,sourceUnit:'kg',sourceQty:273},
    {id:'SO-260202-05',date:'2026-02-02',customer:'현대자동차',product:'스피롤탄(a부, b부)',qty:100,sourceUnit:'kg',sourceQty:100}
  ];

  function seededRow(item){
    const now = new Date().toISOString();
    const meta = {
      orderDate:item.date,
      customerOverride:item.customer,
      productOverride:item.product,
      qtyOverride:item.qty,
      requestedDue:'',
      confirmedDue:'',
      deliveryPlace:'',
      orderType:'양산',
      productionPlanStatus:'생산완료',
      shippingStatus:'출하완료',
      actualShipment:true,
      actualShipDate:item.date,
      source:'SALES_STATUS_IMPORT',
      sourceUnit:item.sourceUnit,
      sourceQty:item.sourceQty,
      seedVersion:SEED_VERSION,
      savedAt:now
    };
    return {
      id:item.id,
      workOrder:'',
      customer:item.customer,
      po:'-',
      product:item.product,
      qty:item.qty,
      due:'',
      plan:'생산완료',
      shipping:'출하완료',
      deliveryPlace:'',
      actualShipment:true,
      actualShipDate:item.date,
      source:'SALES_STATUS_IMPORT',
      seedVersion:SEED_VERSION,
      orderMeta:meta,
      remarks:'기존 판매현황 이관자료'
    };
  }

  function composite(row){
    const meta = row && row.orderMeta && typeof row.orderMeta === 'object' ? row.orderMeta : {};
    const date = clean(meta.orderDate || row.orderDate || row.date);
    const customer = clean(meta.customerOverride || row.customer);
    const product = clean(meta.productOverride || row.product).replace(/\s*\[(?:kg|g)\]\s*$/i,'');
    const qty = Number(meta.qtyOverride != null ? meta.qtyOverride : row.qty);
    return [date,customer,product,Number.isFinite(qty)?qty:''].join('|');
  }

  function mergeRows(existing){
    const list = Array.isArray(existing) ? existing.slice() : [];
    const ids = new Set(list.map(row => clean(row && row.id)).filter(Boolean));
    const keys = new Set(list.map(composite));
    let added = 0;

    sourceRows.forEach(item => {
      const row = seededRow(item);
      const key = composite(row);
      if(ids.has(row.id) || keys.has(key)) return;
      list.push(row);
      ids.add(row.id);
      keys.add(key);
      added += 1;
    });

    list.sort((a,b) => {
      const am = a && a.orderMeta || {};
      const bm = b && b.orderMeta || {};
      const ad = clean(am.orderDate || a.orderDate || a.date);
      const bd = clean(bm.orderDate || b.orderDate || b.date);
      return bd.localeCompare(ad) || clean(b.id).localeCompare(clean(a.id),undefined,{numeric:true});
    });

    return {rows:list,added};
  }

  function syncMeta(rows){
    const map = read(META_KEY,{});
    const next = map && typeof map === 'object' && !Array.isArray(map) ? {...map} : {};
    rows.forEach(row => {
      if(row && row.seedVersion === SEED_VERSION && row.orderMeta){
        next[clean(row.id)] = {...row.orderMeta};
      }
    });
    write(META_KEY,next);
  }

  async function loadSharedRows(){
    if(typeof window.qmesSyncList !== 'function') return null;
    try{
      const records = await window.qmesSyncList(ERP_SYNC_TYPE);
      const found = (Array.isArray(records)?records:[]).find(record => clean(record && record.record_key) === ERP_SYNC_KEY);
      if(!found) return [];
      const payload = parsePayload(found.payload);
      return payload && Array.isArray(payload.rows) ? payload.rows : [];
    }catch(_error){
      return null;
    }
  }

  async function pushShared(rows){
    if(typeof window.qmesSyncUpsert !== 'function') return false;
    try{
      await window.qmesSyncUpsert(ERP_SYNC_TYPE,ERP_SYNC_KEY,{
        module:'erp',
        schema:1,
        kind:'sales',
        rows,
        updatedAt:new Date().toISOString(),
        updatedBy:clean(window.__QMES_CURRENT_USER__ && window.__QMES_CURRENT_USER__.name) || 'QMES',
        source:SEED_VERSION
      });
      return true;
    }catch(error){
      console.warn('[QMES sales seed] shared save failed:',error && error.message ? error.message : error);
      return false;
    }
  }

  async function seed(){
    const shared = await loadSharedRows();
    const local = read(SALES_KEY,[]);
    const base = Array.isArray(shared) && shared.length ? shared : (Array.isArray(local)?local:[]);
    const merged = mergeRows(base);

    if(!merged.added){
      syncMeta(merged.rows);
      return true;
    }

    write(SALES_KEY,merged.rows);
    syncMeta(merged.rows);
    await pushShared(merged.rows);

    window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'sales',source:SEED_VERSION,added:merged.added}}));
    window.dispatchEvent(new CustomEvent('qmes:data-updated',{detail:{kind:'sales',source:SEED_VERSION}}));
    return true;
  }

  function start(){
    let tries=0;
    const run=async()=>{
      tries += 1;
      const authenticated = !!(window.__QMES_CURRENT_USER__ && typeof window.__QMES_CURRENT_USER__ === 'object');
      if(!authenticated && tries < 20){ setTimeout(run,300); return; }
      const ok = await seed();
      if(!ok && tries < 20) setTimeout(run,500);
    };
    setTimeout(run,700);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();

  window.qmesSalesHistorySeed20260918={seed};
})();
