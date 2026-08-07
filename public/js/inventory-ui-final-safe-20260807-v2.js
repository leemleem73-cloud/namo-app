/* QMES inventory UI final safe overlay - 2026-08-07
 * Additive only: does not modify existing inventory React source.
 * Shows results from the already-installed inventory integration APIs.
 */
(function(global){
  'use strict';
  if(global.__QMES_INVENTORY_UI_FINAL_SAFE__) return;
  global.__QMES_INVENTORY_UI_FINAL_SAFE__=true;
  const id='qmes-inventory-final-safe';
  const txt=v=>String(v??'').trim();
  const n=v=>{const x=Number(txt(v).replace(/,/g,''));return Number.isFinite(x)?x:0};
  const fmt=v=>n(v).toLocaleString('ko-KR',{maximumFractionDigits:3});
  const today=()=>new Date().toISOString().slice(0,10);
  const db=()=>global.DB||{};
  function raw(){return typeof global.qmesBuildInventoryLotRows==='function'?(global.qmesBuildInventoryLotRows()||[]):[]}
  function validation(){return typeof global.qmesValidateInventoryLotFlow==='function'?global.qmesValidateInventoryLotFlow():global.qmesInventoryLotValidation||null}
  function dateOf(r){return txt(r?.date||r?.receiptDate||r?.inspDate||r?.createdAt).slice(0,10)}
  function iqcToday(){return (Array.isArray(db().insp?.IQC)?db().insp.IQC:[]).filter(r=>dateOf(r)===today()&&/합격|PASS|OK/i.test(txt(r?.result||r?.status))).reduce((s,r)=>s+n(r?.qty||r?.receiptQty||r?.amount),0)}
  function usageToday(){let sum=0;Object.values(db().woDocs||{}).forEach(w=>(Array.isArray(w?.inputs)?w.inputs:[]).forEach(i=>{const d=txt(i?.date||i?.inputDate||w?.date||w?.workDate).slice(0,10);if((!d||d===today()))sum+=n(i?.act)}));return sum}
  function stats(){const rows=raw(), current=rows.reduce((s,r)=>s+n(r.remaining),0), hold=rows.filter(r=>r.hold).reduce((s,r)=>s+n(r.remaining),0), available=Math.max(0,current-hold);return {rows,current,hold,available,lots:rows.filter(r=>n(r.remaining)>0).length,iqc:iqcToday(),used:usageToday()}}
  function style(){if(document.getElementById(id+'-style'))return;const s=document.createElement('style');s.id=id+'-style';s.textContent=`#${id}{margin:0 0 14px;padding:12px;border:1px solid #1e3a5f;border-radius:9px;background:#10243a;color:#dbeafe;font-family:inherit}#${id} .qf-title{font-size:13px;font-weight:800;margin-bottom:10px;color:#7dd3fc}#${id} .qf-grid{display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:8px}#${id} .qf-card{background:#152d47;border:1px solid #244765;border-radius:7px;padding:9px 10px}#${id} .qf-label{font-size:10px;color:#7f9fbd;margin-bottom:4px}#${id} .qf-value{font-size:16px;font-weight:800;color:#e5f2ff}#${id} .qf-value.hold{color:#fbbf24}#${id} .qf-foot{display:flex;gap:10px;align-items:center;margin-top:9px;font-size:10px;color:#7f9fbd}#${id} .qf-ok{color:#86efac}#${id} .qf-warn{color:#fde68a}@media(max-width:1100px){#${id} .qf-grid{grid-template-columns:repeat(3,1fr)}}`;document.head.appendChild(s)}
  function host(){const headings=[...document.querySelectorAll('h1,h2,h3,h4,div')].filter(e=>/원재료\s*[-·/]?\s*부자재\s*재고\s*현황/.test(txt(e.textContent)));const h=headings.find(e=>e.getBoundingClientRect().width>200);if(!h)return null;let p=h.parentElement;for(let i=0;i<5&&p;i++,p=p.parentElement){if(p.querySelector('table')||p.children.length>2)return p}return h.parentElement}
  function render(){style();const h=host();if(!h)return;let box=document.getElementById(id);if(!box){box=document.createElement('section');box.id=id;h.insertBefore(box,h.children[1]||h.firstChild)}const x=stats(),v=validation(),errors=n(v?.counts?.errors),warnings=n(v?.counts?.warnings);box.innerHTML=`<div class="qf-title">실시간 재고 요약 · QMES 연동</div><div class="qf-grid"><div class="qf-card"><div class="qf-label">현재고 합계</div><div class="qf-value">${fmt(x.current)} kg</div></div><div class="qf-card"><div class="qf-label">가용재고</div><div class="qf-value">${fmt(x.available)} kg</div></div><div class="qf-card"><div class="qf-label">홀드재고</div><div class="qf-value hold">${fmt(x.hold)} kg</div></div><div class="qf-card"><div class="qf-label">재고 LOT 수</div><div class="qf-value">${x.lots} LOT</div></div><div class="qf-card"><div class="qf-label">금일 IQC 합격 입고</div><div class="qf-value">${fmt(x.iqc)} kg</div></div><div class="qf-card"><div class="qf-label">금일 작업지시 실투입</div><div class="qf-value">${fmt(x.used)} kg</div></div></div><div class="qf-foot"><span>LOT 수불 자동검증</span><b class="${errors?'qf-warn':'qf-ok'}">오류 ${errors}건</b><span>경고 ${warnings}건</span><span>· 기존 재고 화면은 유지하고 MES 연동 결과만 추가 표시</span></div>`}
  let timer=null;function schedule(){clearTimeout(timer);timer=setTimeout(render,120)}
  ['qmes:inventory-lot-validation-ready','qmes:finished-goods-inventory-ready','qmes:inventory-live-ready','qmes:data-changed'].forEach(e=>global.addEventListener(e,schedule));
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  console.info('[QMES] 재고관리 MES 결과 UI 준비');
})(window);
