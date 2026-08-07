/* QMES inventory UI final safe overlay v3 - 2026-08-07
 * Additive only. Mounts by the inventory table itself so it is independent of title DOM structure.
 */
(function(global){
  'use strict';
  if(global.__QMES_INVENTORY_UI_FINAL_SAFE_V3__) return;
  global.__QMES_INVENTORY_UI_FINAL_SAFE_V3__=true;
  const id='qmes-inventory-final-safe';
  const txt=v=>String(v??'').trim();
  const n=v=>{const x=Number(txt(v).replace(/,/g,''));return Number.isFinite(x)?x:0};
  const fmt=v=>n(v).toLocaleString('ko-KR',{maximumFractionDigits:3});
  const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  const db=()=>global.DB||{};
  function raw(){return typeof global.qmesBuildInventoryLotRows==='function'?(global.qmesBuildInventoryLotRows()||[]):[]}
  function validation(){return typeof global.qmesValidateInventoryLotFlow==='function'?global.qmesValidateInventoryLotFlow():global.qmesInventoryLotValidation||null}
  function dateOf(r){return txt(r?.date||r?.recv||r?.receivedAt||r?.receiptDate||r?.inspDate||r?.inspectedAt||r?.createdAt).slice(0,10)}
  function iqcToday(){const rows=Array.isArray(db().iqc)?db().iqc:(Array.isArray(db().insp?.IQC)?db().insp.IQC:[]);return rows.filter(r=>dateOf(r)===today()&&/합격|PASS|OK|적합/i.test(txt(r?.judge||r?.result||r?.status))).reduce((s,r)=>s+n(r?.qty??r?.incomingQty??r?.incoming_qty??r?.receiptQty??r?.amount),0)}
  function usageToday(){let sum=0;Object.values(db().woDocs||{}).forEach(w=>(Array.isArray(w?.inputs)?w.inputs:[]).forEach(i=>{const d=txt(i?.date||i?.inputDate||w?.date||w?.workDate).slice(0,10);if(!d||d===today())sum+=n(i?.act)}));return sum}
  function stats(){const rows=raw(),current=rows.reduce((s,r)=>s+n(r.remaining),0),hold=rows.filter(r=>r.hold).reduce((s,r)=>s+n(r.remaining),0),available=Math.max(0,current-hold);return {current,hold,available,lots:rows.filter(r=>n(r.remaining)>0).length,iqc:iqcToday(),used:usageToday()}}
  function ensureStyle(){if(document.getElementById(id+'-style-v3'))return;const s=document.createElement('style');s.id=id+'-style-v3';s.textContent=`#${id}{margin:0 0 14px;padding:12px;border:1px solid #1e3a5f;border-radius:9px;background:#10243a;color:#dbeafe;font-family:inherit}#${id} .qf-title{font-size:13px;font-weight:800;margin-bottom:10px;color:#7dd3fc}#${id} .qf-grid{display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:8px}#${id} .qf-card{background:#152d47;border:1px solid #244765;border-radius:7px;padding:9px 10px}#${id} .qf-label{font-size:10px;color:#7f9fbd;margin-bottom:4px}#${id} .qf-value{font-size:16px;font-weight:800;color:#e5f2ff}#${id} .qf-value.hold{color:#fbbf24}#${id} .qf-foot{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:9px;font-size:10px;color:#7f9fbd}#${id} .qf-ok{color:#86efac}#${id} .qf-warn{color:#fde68a}@media(max-width:1100px){#${id} .qf-grid{grid-template-columns:repeat(3,1fr)}}`;document.head.appendChild(s)}
  function findInventoryTable(){return [...document.querySelectorAll('table')].find(t=>{const s=txt(t.textContent);return s.includes('자재코드')&&s.includes('현재고')&&s.includes('안전재고')&&s.includes('보관위치')})||null}
  function mountPoint(){const table=findInventoryTable();if(!table)return null;let p=table.parentElement;while(p&&p.parentElement&&p.parentElement!==document.body){const ps=txt(p.textContent);if(ps.includes('원재료')&&ps.includes('부자재')&&ps.includes('재고')&&p.getBoundingClientRect().width>600)return {host:p,anchor:table.parentElement};p=p.parentElement}return {host:table.parentElement,anchor:table}}
  function render(){ensureStyle();const m=mountPoint();if(!m)return false;let box=document.getElementById(id);if(!box){box=document.createElement('section');box.id=id;const anchor=m.anchor;if(anchor&&anchor.parentElement===m.host)m.host.insertBefore(box,anchor);else m.host.insertBefore(box,m.host.firstChild)}const x=stats(),v=validation(),errors=n(v?.counts?.errors),warnings=n(v?.counts?.warnings);box.innerHTML=`<div class="qf-title">실시간 재고 요약 · QMES 연동</div><div class="qf-grid"><div class="qf-card"><div class="qf-label">현재고 합계</div><div class="qf-value">${fmt(x.current)} kg</div></div><div class="qf-card"><div class="qf-label">가용재고</div><div class="qf-value">${fmt(x.available)} kg</div></div><div class="qf-card"><div class="qf-label">홀드재고</div><div class="qf-value hold">${fmt(x.hold)} kg</div></div><div class="qf-card"><div class="qf-label">재고 LOT 수</div><div class="qf-value">${x.lots} LOT</div></div><div class="qf-card"><div class="qf-label">금일 IQC 합격 입고</div><div class="qf-value">${fmt(x.iqc)} kg</div></div><div class="qf-card"><div class="qf-label">금일 작업지시 실투입</div><div class="qf-value">${fmt(x.used)} kg</div></div></div><div class="qf-foot"><span>LOT 수불 자동검증</span><b class="${errors?'qf-warn':'qf-ok'}">오류 ${errors}건</b><span>경고 ${warnings}건</span><span>· MES 연동 결과 표시</span></div>`;return true}
  let timer=null;function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(render())console.info('[QMES] 재고관리 MES 결과 UI 표시 완료');},100)}
  ['qmes:inventory-lot-validation-ready','qmes:finished-goods-inventory-ready','qmes:inventory-stage3-ready','qmes:data-updated','qmes:data-changed','focus'].forEach(e=>global.addEventListener(e,schedule));
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  console.info('[QMES] 재고관리 MES 결과 UI v3 준비');
})(window);
