/* QMES dashboard/inventory unified synchronization - 2026-08-07
 * Read-only aggregation layer.
 * Source flow: IQC passed receipts -> material stock -> work-order completion -> finished goods -> shipment.
 * Dashboard KPI rendering is owned by React (dashboard.jsx). This module must not mutate dashboard KPI DOM/text.
 */
(function(global){
  'use strict';
  if(global.__QMES_DASHBOARD_INVENTORY_UNIFIED_SYNC__) return;
  global.__QMES_DASHBOARD_INVENTORY_UNIFIED_SYNC__=true;

  const text=v=>String(v??'').trim();
  const qty=v=>{const m=text(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0};
  const date10=v=>text(v).slice(0,10);
  const localDate=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  const completed=v=>/완료|생산완료|출하완료/.test(text(v));

  function productionRecords(){
    const db=global.DB||{};
    const batches=Array.isArray(db.batches)?db.batches:[];
    const docs=db.woDocs&&typeof db.woDocs==='object'?db.woDocs:{};
    const lots=db.lots&&typeof db.lots==='object'?db.lots:{};
    const keys=new Set();
    const out=[];
    function add(lot,batch,wo,lotRec){
      const key=text(lot).toUpperCase();
      if(!key||keys.has(key)) return;
      const status=text(batch?.status||wo?.status||lotRec?.status);
      if(!completed(status)) return;
      const amount=qty(batch?.done??wo?.actualQty??wo?.prodQty??wo?.actual??wo?.done??wo?.plan??batch?.plan??lotRec?.qty);
      if(!(amount>0)) return;
      const date=date10(batch?.productionDate||batch?.date||batch?.due||batch?.startDate||wo?.productionDate||wo?.workDate||wo?.date||wo?.due||lotRec?.productionDate||lotRec?.date);
      out.push({lot:text(lot),qty:amount,date,status});
      keys.add(key);
    }
    batches.forEach(b=>{const lot=text(b?.no||b?.lot||b?.lotNo);add(lot,b,docs[lot]||{},lots[lot]||{})});
    Object.entries(docs).forEach(([lot,wo])=>add(lot,{},wo,lots[lot]||{}));
    return out;
  }

  function summary(){
    const records=productionRecords();
    const today=localDate();
    const month=today.slice(0,7);
    const todayRows=records.filter(r=>r.date===today);
    const monthRows=records.filter(r=>r.date.slice(0,7)===month);
    const fg=typeof global.qmesFinishedGoodsInventorySummary==='function'?global.qmesFinishedGoodsInventorySummary():null;
    const material=typeof global.qmesBuildInventoryRows==='function'?global.qmesBuildInventoryRows():[];
    return {
      todayKg:todayRows.reduce((s,r)=>s+r.qty,0),
      todayLots:todayRows.length,
      monthKg:monthRows.reduce((s,r)=>s+r.qty,0),
      monthLots:monthRows.length,
      materialCurrent:material.reduce((s,r)=>s+qty(r.stock),0),
      materialAvailable:material.reduce((s,r)=>s+qty(r.availableStock),0),
      materialHold:material.reduce((s,r)=>s+qty(r.holdStock),0),
      materialLots:material.reduce((s,r)=>s+qty(r.lotCount),0),
      fgProduced:qty(fg?.totalProduced),
      fgShipped:qty(fg?.totalShipped),
      fgRemaining:qty(fg?.totalRemaining),
      fgLots:qty(fg?.lotCount),
      records
    };
  }

  function patchInventorySummary(){
    const box=document.getElementById('qmes-inventory-final-safe');
    if(!box) return false;
    const s=summary();
    const cards=[...box.querySelectorAll('.qf-card')];
    const set=(label,value)=>{
      const card=cards.find(c=>text(c.textContent).includes(label));
      if(!card) return;
      const valueNode=card.querySelector('.qf-value');
      if(valueNode) valueNode.textContent=value;
    };
    set('현재고 합계',`${s.materialCurrent.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`);
    set('가용재고',`${s.materialAvailable.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`);
    set('홀드재고',`${s.materialHold.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`);
    set('재고 LOT 수',`${s.materialLots} LOT`);
    return true;
  }

  async function refreshSharedIqc(){
    try{
      if(typeof global.qmesSyncPullInspection==='function'){
        const next=await global.qmesSyncPullInspection('iqc',Array.isArray(global.DB?.iqc)?global.DB.iqc:[]);
        if(Array.isArray(next)){
          global.DB.iqc=next;
          if(typeof global.dbSave==='function') global.dbSave();
        }
      }
    }catch(e){
      console.warn('[QMES] 통합 재고 IQC 동기화 실패:',e?.message||e);
    }
  }

  let timer=null;
  function renderInventory(){
    clearTimeout(timer);
    timer=setTimeout(patchInventorySummary,120);
  }
  async function refresh(){
    await refreshSharedIqc();
    renderInventory();
  }

  ['qmes:inventory-stage3-ready','qmes:inventory-live-ready','qmes:finished-goods-inventory-ready','qmes:data-updated','qmes:data-changed','focus'].forEach(eventName=>global.addEventListener(eventName,refresh));
  new MutationObserver(renderInventory).observe(document.documentElement,{childList:true,subtree:true});

  global.qmesUnifiedInventorySummary=summary;
  global.qmesRefreshUnifiedInventory=refresh;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  console.info('[QMES] 재고 통합 기준 활성화 · 대시보드 KPI는 React 원본 표시');
})(window);
