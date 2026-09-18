/* NAMO QMES - Sales/Due content seed V2
 * 2026-09-18
 * ADD-ONLY / IDEMPOTENT.
 * Source: provided existing Sales Status ledger.
 * - Preserves all existing Sales rows.
 * - Adds only missing historical rows.
 * - Pushes merged rows to shared ERP Sales storage.
 * - Re-runs after ERP runtime/master-ready so later shared loads cannot erase the seed.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_CONTENT_SEED_20260918_V2__) return;
  window.__QMES_SALES_CONTENT_SEED_20260918_V2__ = true;

  const SALES='qmes-erp-sales-v1';
  const META='qmes-sales-order-meta-v1';
  const TYPE='inventory';
  const RECORD='erp:sales';
  const SOURCE='SALES_STATUS_LEDGER_20260918_V2';

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
  const parse=v=>{if(v&&typeof v==='object')return v;if(typeof v==='string'){try{return JSON.parse(v)}catch(_){return {}}}return {}};

  const DATA=[
    {id:'SO-250526-001',date:'2025-05-26',customer:'(주)현대자동차',product:'NBA15-HM01',qty:1.48,srcQty:1480,srcUnit:'g'},
    {id:'SO-250526-002',date:'2025-05-26',customer:'(주)현대자동차',product:'NBA20-HM01',qty:1.64,srcQty:1640,srcUnit:'g'},
    {id:'SO-250630-001',date:'2025-06-30',customer:'(주)현대자동차',product:'NBA15-HM01',qty:0.55,srcQty:550,srcUnit:'g'},
    {id:'SO-250630-002',date:'2025-06-30',customer:'(주)현대자동차',product:'NBA20-HM01',qty:0.55,srcQty:550,srcUnit:'g'},
    {id:'SO-250714-001',date:'2025-07-14',customer:'(주)현대자동차',product:'NBA20-HM01',qty:1,srcQty:1000,srcUnit:'g'},
    {id:'SO-250806-001',date:'2025-08-06',customer:'(주)현대자동차',product:'NBA20-P4S6-HM01',qty:0.1,srcQty:100,srcUnit:'g'},
    {id:'SO-250806-002',date:'2025-08-06',customer:'(주)현대자동차',product:'NBA20-S5V5-HM01',qty:0.1,srcQty:100,srcUnit:'g'},
    {id:'SO-250905-001',date:'2025-09-05',customer:'(주)제이에스케미칼',product:'OZE33-JS01',qty:20,srcQty:20,srcUnit:'kg',unitPrice:18000},
    {id:'SO-251204-001',date:'2025-12-04',customer:'(주)현대자동차',product:'절연슬러리',qty:150,srcQty:150,srcUnit:'kg',unitPrice:20000},
    {id:'SO-251205-001',date:'2025-12-05',customer:'(주)제이에스케미칼',product:'OZE33-JS01',qty:25,srcQty:25,srcUnit:'kg',unitPrice:18000},
    {id:'SO-260202-001',date:'2026-02-02',customer:'(주)현대자동차',product:'ADC30G(SBR)',qty:64,srcQty:64,srcUnit:'kg'},
    {id:'SO-260202-002',date:'2026-02-02',customer:'(주)현대자동차',product:'AOH30(Boehmite)',qty:12,srcQty:12,srcUnit:'kg'},
    {id:'SO-260202-003',date:'2026-02-02',customer:'(주)현대자동차',product:'NMP(SNET)',qty:1219,srcQty:1219,srcUnit:'kg'},
    {id:'SO-260202-004',date:'2026-02-02',customer:'(주)현대자동차',product:'절연슬러리',qty:273,srcQty:273,srcUnit:'kg'},
    {id:'SO-260202-005',date:'2026-02-02',customer:'(주)현대자동차',product:'스피롤탄(a부, b부)',qty:100,srcQty:100,srcUnit:'kg'}
  ];

  function makeRow(x){
    const meta={
      salesOrderIdOverride:x.id,
      orderDate:x.date,
      customerOverride:x.customer,
      productOverride:x.product,
      qtyOverride:x.qty,
      requestedDue:'',
      confirmedDue:'',
      deliveryPlace:'',
      orderType:'양산',
      productionPlanStatus:'생산완료',
      shippingStatus:'출하완료',
      actualShipment:true,
      actualShipDate:x.date,
      unitPrice:Number(x.unitPrice||0),
      source:SOURCE,
      sourceQty:x.srcQty,
      sourceUnit:x.srcUnit,
      migratedFrom:'판매현황',
      savedAt:new Date().toISOString()
    };
    return {
      id:x.id,
      customer:x.customer,
      po:'-',
      product:x.product,
      qty:x.qty,
      due:'',
      plan:'생산완료',
      shipping:'출하완료',
      actualShipment:true,
      actualShipDate:x.date,
      orderDate:x.date,
      unitPrice:Number(x.unitPrice||0),
      source:SOURCE,
      orderMeta:meta,
      remarks:'기존 판매현황 이관자료'
    };
  }

  function identity(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==='object'?row.orderMeta:{};
    const date=clean(m.orderDate||row&&row.orderDate||row&&row.date);
    const customer=clean(m.customerOverride||row&&row.customer).replace(/^\(주\)/,'');
    const product=clean(m.productOverride||row&&row.product).replace(/\s*\[(kg|g)\]\s*$/i,'');
    const qty=Number(m.qtyOverride!=null?m.qtyOverride:row&&row.qty);
    return [date,customer,product,Number.isFinite(qty)?qty:''].join('|');
  }

  function merge(base){
    const out=Array.isArray(base)?base.slice():[];
    const ids=new Set(out.map(r=>clean(r&&r.id)).filter(Boolean));
    const keys=new Set(out.map(identity));
    const added=[];
    DATA.forEach(x=>{
      const row=makeRow(x),key=identity(row);
      if(ids.has(row.id)||keys.has(key))return;
      out.push(row);ids.add(row.id);keys.add(key);added.push(row);
    });
    out.sort((a,b)=>{
      const am=a&&a.orderMeta||{},bm=b&&b.orderMeta||{};
      const ad=clean(am.orderDate||a&&a.orderDate||a&&a.date);
      const bd=clean(bm.orderDate||b&&b.orderDate||b&&b.date);
      return bd.localeCompare(ad)||clean(b&&b.id).localeCompare(clean(a&&a.id),undefined,{numeric:true});
    });
    return {rows:out,added};
  }

  function syncMeta(all){
    const raw=read(META,{}),map=raw&&typeof raw==='object'&&!Array.isArray(raw)?{...raw}:{};
    all.forEach(r=>{
      if(r&&r.orderMeta&&clean(r.orderMeta.source)===SOURCE){
        map[clean(r.id)]={...r.orderMeta};
      }
    });
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
    }catch(error){
      console.warn('[QMES Sales content V2] shared load failed',error);
      return null;
    }
  }

  async function saveShared(all){
    if(typeof window.qmesSyncUpsert!=='function')return false;
    try{
      await window.qmesSyncUpsert(TYPE,RECORD,{
        module:'erp',
        schema:1,
        kind:'sales',
        rows:all,
        updatedAt:new Date().toISOString(),
        updatedBy:clean(window.__QMES_CURRENT_USER__&&window.__QMES_CURRENT_USER__.name)||'QMES',
        source:SOURCE
      });
      return true;
    }catch(error){
      console.warn('[QMES Sales content V2] shared save failed',error);
      return false;
    }
  }

  async function run(){
    const remote=await sharedRows();
    const local=read(SALES,[]);
    const base=Array.isArray(remote)&&remote.length?remote:(Array.isArray(local)?local:[]);
    const merged=merge(base);
    write(SALES,merged.rows);
    syncMeta(merged.rows);

    if(merged.added.length){
      await saveShared(merged.rows);
      window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'sales',reason:'sales-content-v2',added:merged.added.length}}));
      window.dispatchEvent(new CustomEvent('qmes:data-updated',{detail:{kind:'sales',reason:'sales-content-v2'}}));
    }
    window.qmesSalesPurchaseStableOwner20260918?.render?.();
    return {added:merged.added.length,total:merged.rows.length};
  }

  function schedule(){
    setTimeout(()=>run(),100);
    setTimeout(()=>run(),900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  ['qmes:erp-runtime-loaded','qmes:mes-master-ready','qmes:enterprise-ui-ready','qmes:shared-sync-complete'].forEach(name=>window.addEventListener(name,schedule));

  window.qmesSalesContentSeed20260918V2={run};
})();
