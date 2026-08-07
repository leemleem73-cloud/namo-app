/* QMES dashboard/inventory unified synchronization - 2026-08-07
 * Read-only aggregation layer.
 * Source flow: IQC passed receipts -> material stock -> work-order completion -> finished goods -> shipment.
 * Existing source records are not modified except refreshing shared IQC rows into DB.iqc.
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

    batches.forEach(batch=>{
      const lot=text(batch?.no||batch?.lot||batch?.lotNo);
      add(lot,batch,docs[lot]||{},lots[lot]||{});
    });
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

  function replaceKpi(label,value,unit,caption){
    const nodes=[...document.querySelectorAll('div,section')].filter(el=>text(el.textContent).includes(label));
    const card=nodes.find(el=>{
      const s=text(el.textContent);
      return s.startsWith(label)||s.includes(label+' ');
    });
    if(!card) return false;
    const all=[...card.querySelectorAll('*')];
    const labelNode=all.find(el=>text(el.textContent)===label);
    if(!labelNode) return false;
    let root=labelNode;
    for(let i=0;i<4&&root.parentElement;i++){
      root=root.parentElement;
      if(/LOT|오늘 등록된 생산 실적|이번 달 작업지시 생산 실적/.test(text(root.textContent))) break;
    }
    const descendants=[...root.querySelectorAll('*')];
    const valueNode=descendants.find(el=>/^[-—\d,.]+$/.test(text(el.textContent))&&el!==labelNode);
    if(valueNode) valueNode.textContent=Number(value||0).toLocaleString('ko-KR',{maximumFractionDigits:3});
    const unitNode=descendants.find(el=>/kg\s*·\s*\d+\s*LOT/.test(text(el.textContent)));
    if(unitNode) unitNode.textContent=unit;
    const captionNode=descendants.find(el=>/오늘 등록된 생산 실적|이번 달 작업지시 생산 실적/.test(text(el.textContent)));
    if(captionNode&&caption) captionNode.textContent=caption;
    return true;
  }

  function patchDashboard(){
    const s=summary();
    const a=replaceKpi('금일 생산량',s.todayKg,`kg · ${s.todayLots} LOT`,'완료 작업지시/생산실적 기준');
    const b=replaceKpi('당월 누적 생산량',s.monthKg,`kg · ${s.monthLots} LOT`,'이번 달 완료 생산실적 기준');
    if(a||b) global.__QMES_UNIFIED_PRODUCTION_SUMMARY__=s;
    return a||b;
  }

  function patchInventorySummary(){
    const box=document.getElementById('qmes-inventory-final-safe');
    if(!box) return false;
    const s=summary();
    const cards=[...box.querySelectorAll('.qf-card')];
    const set=(label,value,note)=>{
      const card=cards.find(c=>text(c.textContent).includes(label));
      if(!card)return;
      const v=card.querySelector('.qf-value'); if(v)v.textContent=value;
      const n=card.querySelector('.qf-note'); if(n&&note)n.textContent=note;
    };
    set('원재료 현재고',`${s.materialCurrent.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`,'IQC 합격 입고 - 작업지시 실투입');
    set('원재료 가용재고',`${s.materialAvailable.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`,`홀드 ${s.materialHold.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg 제외`);
    set('원재료 LOT',`${s.materialLots} LOT`,'IQC 합격 LOT 기준');
    set('완제품 생산 누계',`${s.fgProduced.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`,'완료 작업지시/생산실적 기준');
    set('출하 누계',`${s.fgShipped.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`,'OQC/LOT 출하 중복 제거');
    set('완제품 현재고',`${s.fgRemaining.toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`,`생산완료 - 출하 · ${s.fgLots} LOT`);
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
    }catch(error){console.warn('[QMES] 통합 재고 IQC 동기화 실패:',error?.message||error)}
  }

  let timer=null;
  function render(){clearTimeout(timer);timer=setTimeout(()=>{patchDashboard();patchInventorySummary();},120)}
  async function refresh(){await refreshSharedIqc();render();}

  ['qmes:inventory-stage3-ready','qmes:inventory-live-ready','qmes:finished-goods-inventory-ready','qmes:data-updated','qmes:data-changed','focus'].forEach(e=>global.addEventListener(e,refresh));
  new MutationObserver(render).observe(document.documentElement,{childList:true,subtree:true});
  global.qmesUnifiedInventorySummary=summary;
  global.qmesRefreshUnifiedInventory=refresh;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
  console.info('[QMES] 대시보드·재고 수입/작업지시/출하 통합 기준 활성화');
})(window);
