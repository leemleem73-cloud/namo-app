/* QMES current inventory status summary - 2026-08-07
 * Read-only aggregation across IQC receipts, work-order actual usage/completion, holds and shipments.
 * Existing IQC/work-order/shipment source data are not modified.
 */
(function(global){
  'use strict';
  if(global.__QMES_CURRENT_INVENTORY_STATUS__) return;
  global.__QMES_CURRENT_INVENTORY_STATUS__=true;

  const id='qmes-inventory-final-safe';
  const text=v=>String(v??'').trim();
  const num=v=>{const m=text(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0};
  const fmt=v=>num(v).toLocaleString('ko-KR',{maximumFractionDigits:3});
  const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});

  function materialSummary(){
    const rows=typeof global.qmesBuildInventoryRows==='function' ? (global.qmesBuildInventoryRows()||[]) : [];
    return {
      current:rows.reduce((s,r)=>s+num(r.stock),0),
      available:rows.reduce((s,r)=>s+num(r.availableStock),0),
      hold:rows.reduce((s,r)=>s+num(r.holdStock),0),
      lots:rows.reduce((s,r)=>s+num(r.lotCount),0),
      linked:rows.filter(r=>r.linked).length,
      items:rows.length
    };
  }

  function finishedSummary(){
    if(typeof global.qmesFinishedGoodsInventorySummary==='function') return global.qmesFinishedGoodsInventorySummary()||{};
    return {totalProduced:0,totalShipped:0,totalRemaining:0,lotCount:0,rows:[]};
  }

  function iqcToday(){
    return (Array.isArray(global.DB?.iqc)?global.DB.iqc:[])
      .filter(r=>text(r?.recv||r?.receivedAt||r?.inspectedAt).slice(0,10)===today() && /합격|PASS|OK|적합/i.test(text(r?.judge)))
      .reduce((s,r)=>s+num(r?.qty??r?.incomingQty??r?.incoming_qty),0);
  }

  function completedWorkOrders(){
    const docs=Object.entries(global.DB?.woDocs||{});
    const completed=docs.filter(([,w])=>/완료|생산완료|출하완료/.test(text(w?.status)));
    return {
      count:completed.length,
      qty:completed.reduce((s,[,w])=>s+num(w?.actualQty??w?.prodQty??w?.actual??w?.done),0)
    };
  }

  function findInventoryTable(){
    return [...document.querySelectorAll('table')].find(t=>{
      const s=text(t.textContent);
      return s.includes('자재코드')&&s.includes('현재고')&&s.includes('안전재고')&&s.includes('보관위치');
    })||null;
  }

  function mount(){
    const table=findInventoryTable();
    if(!table) return null;
    let p=table.parentElement;
    while(p&&p.parentElement&&p.parentElement!==document.body){
      const s=text(p.textContent);
      if(s.includes('원재료')&&s.includes('재고')&&p.getBoundingClientRect().width>600) return {host:p,anchor:table.parentElement};
      p=p.parentElement;
    }
    return {host:table.parentElement,anchor:table};
  }

  function style(){
    if(document.getElementById(id+'-current-style')) return;
    const s=document.createElement('style');
    s.id=id+'-current-style';
    s.textContent=`#${id}{margin:0 0 14px;padding:12px;border:1px solid #1e3a5f;border-radius:9px;background:#10243a;color:#dbeafe;font-family:inherit}#${id} .qf-title{display:flex;justify-content:space-between;gap:12px;font-size:13px;font-weight:800;margin-bottom:10px;color:#7dd3fc}#${id} .qf-sub{font-size:10px;font-weight:500;color:#7f9fbd}#${id} .qf-grid{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:8px}#${id} .qf-card{background:#152d47;border:1px solid #244765;border-radius:7px;padding:9px 10px}#${id} .qf-label{font-size:10px;color:#7f9fbd;margin-bottom:4px}#${id} .qf-value{font-size:16px;font-weight:800;color:#e5f2ff}#${id} .qf-note{font-size:9px;color:#7893ad;margin-top:3px}#${id} .qf-foot{display:flex;gap:12px;flex-wrap:wrap;margin-top:9px;font-size:10px;color:#7f9fbd}@media(max-width:1100px){#${id} .qf-grid{grid-template-columns:repeat(2,1fr)}}`;
    document.head.appendChild(s);
  }

  function render(){
    const m=mount(); if(!m) return false; style();
    let box=document.getElementById(id);
    if(!box){box=document.createElement('section');box.id=id;if(m.anchor&&m.anchor.parentElement===m.host)m.host.insertBefore(box,m.anchor);else m.host.insertBefore(box,m.host.firstChild)}
    const mat=materialSummary(), fg=finishedSummary(), wo=completedWorkOrders();
    box.innerHTML=`<div class="qf-title"><span>현재 재고 현황 · QMES 통합연동</span><span class="qf-sub">수입검사 → 작업지시 → 생산완료 → 출하 기준</span></div><div class="qf-grid">
      <div class="qf-card"><div class="qf-label">원재료 현재고</div><div class="qf-value">${fmt(mat.current)} kg</div><div class="qf-note">IQC 합격 입고 - 작업지시 실투입</div></div>
      <div class="qf-card"><div class="qf-label">원재료 가용재고</div><div class="qf-value">${fmt(mat.available)} kg</div><div class="qf-note">현재고 - 홀드 ${fmt(mat.hold)} kg</div></div>
      <div class="qf-card"><div class="qf-label">원재료 LOT</div><div class="qf-value">${mat.lots} LOT</div><div class="qf-note">연동 품목 ${mat.linked}/${mat.items}</div></div>
      <div class="qf-card"><div class="qf-label">금일 IQC 합격 입고</div><div class="qf-value">${fmt(iqcToday())} kg</div><div class="qf-note">수입검사 합격 이력 기준</div></div>
      <div class="qf-card"><div class="qf-label">완료 작업지시</div><div class="qf-value">${wo.count} 건</div><div class="qf-note">완료 실적 ${fmt(wo.qty)} kg</div></div>
      <div class="qf-card"><div class="qf-label">완제품 생산 누계</div><div class="qf-value">${fmt(fg.totalProduced||0)} kg</div><div class="qf-note">완료 LOT 생산실적</div></div>
      <div class="qf-card"><div class="qf-label">출하 누계</div><div class="qf-value">${fmt(fg.totalShipped||0)} kg</div><div class="qf-note">OQC/LOT 출하 중복 제거</div></div>
      <div class="qf-card"><div class="qf-label">완제품 현재고</div><div class="qf-value">${fmt(fg.totalRemaining||0)} kg</div><div class="qf-note">생산완료 - 출하 · ${num(fg.lotCount)} LOT</div></div>
    </div><div class="qf-foot"><span>원재료: IQC 합격 LOT 기준</span><span>사용량: 작업지시 실투입 기준</span><span>완제품: 생산완료 - 출하 기준</span></div>`;
    return true;
  }

  async function refresh(){
    try{
      if(typeof global.qmesSyncPullInspection==='function'){
        const next=await global.qmesSyncPullInspection('iqc',Array.isArray(global.DB?.iqc)?global.DB.iqc:[]);
        if(Array.isArray(next)){global.DB.iqc=next;if(typeof global.dbSave==='function')global.dbSave();}
      }
    }catch(e){console.warn('[QMES] 재고 IQC 갱신 실패:',e?.message||e)}
    render();
    global.dispatchEvent(new CustomEvent('qmes:data-updated',{detail:{source:'inventory-current-status'}}));
  }

  let timer=null;const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,120)};
  ['qmes:inventory-stage3-ready','qmes:inventory-live-ready','qmes:finished-goods-inventory-ready','qmes:data-changed','focus'].forEach(e=>global.addEventListener(e,schedule));
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  global.qmesRefreshCurrentInventoryStatus=refresh;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
  console.info('[QMES] 수입·작업지시·출하 통합 재고현황 준비');
})(window);
