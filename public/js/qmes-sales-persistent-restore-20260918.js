/* NAMO QMES - Sales/Due persistent row restore
 * 2026-09-18
 * ADD-ONLY.
 * Keeps the ledger populated by merging local + shared + historical seed rows.
 * Never deletes existing sales data.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_PERSISTENT_RESTORE_20260918__) return;
  window.__QMES_SALES_PERSISTENT_RESTORE_20260918__=true;

  const SALES='qmes-erp-sales-v1';
  const META='qmes-sales-order-meta-v1';
  const TYPE='inventory';
  const KEY='erp:sales';

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const parse=v=>{if(v&&typeof v==='object')return v;if(typeof v==='string'){try{return JSON.parse(v)}catch(_){}}return {}};

  const source=[
    ['SO-250526-01','2025-05-26','현대자동차','NBA15-HM01',1.48],
    ['SO-250526-02','2025-05-26','현대자동차','NBA20-HM01',1.64],
    ['SO-250630-01','2025-06-30','현대자동차','NBA15-HM01',0.55],
    ['SO-250630-02','2025-06-30','현대자동차','NBA20-HM01',0.55],
    ['SO-250714-01','2025-07-14','현대자동차','NBA20-HM01',1],
    ['SO-250806-01','2025-08-06','현대자동차','NBA20-P4S6-HM01',0.1],
    ['SO-250806-02','2025-08-06','현대자동차','NBA20-S5V5-HM01',0.1],
    ['SO-250905-01','2025-09-05','(주)제이에스케미칼','OZE33-JS01',20],
    ['SO-251204-01','2025-12-04','현대자동차','절연슬러리',150],
    ['SO-251205-01','2025-12-05','(주)제이에스케미칼','OZE33-JS01',25],
    ['SO-260202-01','2026-02-02','현대자동차','ADC30G(SBR)',64],
    ['SO-260202-02','2026-02-02','현대자동차','AOH30(Boehmite)',12],
    ['SO-260202-03','2026-02-02','현대자동차','NMP(SNET)',1219],
    ['SO-260202-04','2026-02-02','현대자동차','절연슬러리',273],
    ['SO-260202-05','2026-02-02','현대자동차','스피롤탄(a부, b부)',100]
  ].map(([id,date,customer,product,qty])=>({
    id,customer,product,qty,due:'',plan:'생산완료',shipping:'출하완료',
    actualShipment:true,actualShipDate:date,source:'SALES_STATUS_IMPORT',
    orderMeta:{orderDate:date,customerOverride:customer,productOverride:product,qtyOverride:qty,requestedDue:'',productionPlanStatus:'생산완료',shippingStatus:'출하완료',actualShipment:true,actualShipDate:date}
  }));

  function rowKeys(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==='object'?row.orderMeta:{};
    const id=clean(row&&row.id);
    const date=clean(m.orderDate||row&&row.orderDate||row&&row.productionDate||row&&row.date);
    const customer=clean(m.customerOverride||row&&row.customer);
    const product=clean(m.productOverride||row&&row.product);
    const qty=Number(m.qtyOverride!=null?m.qtyOverride:row&&row.qty);
    return [id,[date,customer,product,Number.isFinite(qty)?qty:''].join('|')].filter(Boolean);
  }

  function merge(){
    const lists=[...arguments].filter(Array.isArray);
    const out=[],used=new Set();
    for(const list of lists){
      for(const row of list){
        if(!row||typeof row!=='object')continue;
        const keys=rowKeys(row);
        if(keys.some(k=>used.has(k)))continue;
        out.push(row);
        keys.forEach(k=>used.add(k));
      }
    }
    return out;
  }

  async function shared(){
    if(typeof window.qmesSyncList!=='function') return [];
    try{
      const records=await window.qmesSyncList(TYPE);
      const rec=(Array.isArray(records)?records:[]).find(x=>clean(x&&x.record_key)===KEY);
      const payload=parse(rec&&rec.payload);
      return Array.isArray(payload.rows)?payload.rows:[];
    }catch(_){return []}
  }

  function syncMeta(rows){
    const current=read(META,{});
    const next=current&&typeof current==='object'&&!Array.isArray(current)?{...current}:{};
    rows.forEach(row=>{
      const id=clean(row&&row.id),m=row&&row.orderMeta;
      if(id&&m&&typeof m==='object')next[id]={...(next[id]||{}),...m};
    });
    write(META,next);
  }

  async function restore(){
    const local=read(SALES,[]);
    const remote=await shared();
    const merged=merge(Array.isArray(local)?local:[],remote,source);
    if(!merged.length) return false;

    write(SALES,merged);
    syncMeta(merged);

    if(typeof window.qmesSyncUpsert==='function'){
      try{
        await window.qmesSyncUpsert(TYPE,KEY,{
          module:'erp',schema:1,kind:'sales',rows:merged,
          updatedAt:new Date().toISOString(),
          updatedBy:clean(window.__QMES_CURRENT_USER__&&window.__QMES_CURRENT_USER__.name)||'QMES',
          source:'SALES_PERSISTENT_RESTORE_20260918'
        });
      }catch(_){}
    }

    window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'sales',source:'PERSISTENT_RESTORE',rows:merged.length}}));
    window.dispatchEvent(new CustomEvent('qmes:data-updated',{detail:{kind:'sales',source:'PERSISTENT_RESTORE'}}));
    return true;
  }

  const start=()=>{
    let n=0;
    const run=async()=>{
      n++;
      const ok=await restore();
      if(!ok&&n<12)setTimeout(run,400);
    };
    setTimeout(run,150);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  ['qmes:erp-runtime-loaded','qmes:mes-master-ready','qmes:enterprise-ui-ready'].forEach(name=>window.addEventListener(name,()=>setTimeout(restore,50)));
  window.qmesSalesPersistentRestore20260918={restore};
})();