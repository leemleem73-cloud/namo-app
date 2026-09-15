/* NAMO QMES - purchase ERP benchmark + create/edit bridge (2026-09-16) */
(function(){
'use strict';
if(window.__QMES_PURCHASE_ORDER_REGISTER_20260915__)return;
window.__QMES_PURCHASE_ORDER_REGISTER_20260915__=true;
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
let queued=false;

function css(){
if(document.getElementById('qmes-purchase-order-register-style-20260915'))return;
const s=document.createElement('style');s.id='qmes-purchase-order-register-style-20260915';s.textContent=`
.qmes-purchase-live.qmes-purchase-erp{background:#f4f6f8!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-kpis{display:none!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-dashboard{gap:7px!important}
.qmes-purchase-live.qmes-purchase-erp .qerp-head,.qmes-purchase-live.qmes-purchase-erp .qmes-purchase-page-head{margin-bottom:7px!important;padding:5px 2px!important}
.qmes-purchase-live.qmes-purchase-erp .qerp-title{font-size:20px!important;font-weight:900!important;color:#21364c!important}
.qmes-purchase-live.qmes-purchase-erp .qerp-sub{font-size:10px!important;color:#728294!important}
.qmes-purchase-live.qmes-purchase-erp .qerp-head-actions button{height:32px!important;border-radius:3px!important;font-size:10px!important;box-shadow:none!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-filter-card{padding:9px 10px!important;border:1px solid #c9d2dc!important;border-radius:4px!important;box-shadow:none!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-filter-grid{gap:7px!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-field>span{margin-bottom:4px!important;font-size:9px!important;color:#53687d!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-field input,.qmes-purchase-live.qmes-purchase-erp .qpc-field select{height:31px!important;border:1px solid #bec9d4!important;border-radius:3px!important;font-size:10px!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-btn{height:31px!important;border-radius:3px!important;font-size:10px!important;box-shadow:none!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-btn.primary{background:#1f5fae!important;border-color:#1f5fae!important}
.qmes-purchase-live .qmes-purchase-erp-tabs{display:flex;gap:2px;height:34px;border-bottom:1px solid #bfc9d3}
.qmes-purchase-live .qmes-purchase-erp-tab{height:33px;min-width:86px;padding:0 12px;border:1px solid #c6d0da;border-bottom:0;border-radius:4px 4px 0 0;background:#f5f7f9;color:#52677c;font-size:10px;font-weight:850;cursor:pointer}
.qmes-purchase-live .qmes-purchase-erp-tab.active{height:34px;background:#33475d;border-color:#33475d;color:#fff}
.qmes-purchase-live.qmes-purchase-erp .qpc-table-card{border:1px solid #c7d1db!important;border-radius:4px!important;box-shadow:none!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table-head{min-height:38px!important;padding:6px 9px!important;border-bottom:1px solid #c7d1db!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table-head strong{font-size:12px!important;color:#253b52!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-scroll{max-height:calc(100vh - 300px)!important;min-height:320px!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table th{height:33px!important;padding:0 7px!important;background:linear-gradient(#f1f4f7,#e6ecf1)!important;border-bottom:1px solid #b9c5d0!important;font-size:10px!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table td{height:31px!important;padding:5px 7px!important;font-size:10px!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table .qpc-detail:nth-child(even) td{background:#fbfcfd!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table .qpc-detail:hover td{background:#eef6ff!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table .qpc-month td{background:#edf2f6!important;color:#294c6d!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-table .qpc-total td{background:#e7edf3!important;font-weight:900!important}
.qmes-purchase-live.qmes-purchase-erp .qpc-date-link{color:#155fa9!important;text-decoration:underline!important;font-size:10px!important}
.qmes-purchase-live .qmes-purchase-register-btn{height:32px!important;border-radius:3px!important;font-size:10px!important;font-weight:900!important}
.qmes-purchase-live .qmes-purchase-register-form{position:relative!important;padding-top:42px!important;border:1px solid #c6d0da!important;border-radius:4px!important;box-shadow:none!important}
.qmes-purchase-live .qmes-purchase-register-title{position:absolute;left:0;right:0;top:0;height:35px;display:flex;align-items:center;padding:0 11px;background:#eef2f6;border-bottom:1px solid #cfd8e2;font-size:12px;font-weight:900}
.qmes-purchase-live .qpc-edit-head,.qmes-purchase-live .qpc-edit-cell{width:62px!important;min-width:62px!important;text-align:center!important}
.qmes-purchase-live .qpc-edit-btn{height:24px;min-width:45px;border:1px solid #9eb3c8;border-radius:3px;background:#fff;color:#34536f;font-size:9px;font-weight:900;cursor:pointer}
.qmes-purchase-live .qpc-edit-btn:hover{background:#1f5fae;border-color:#1f5fae;color:#fff}
.qmes-purchase-live .qmes-purchase-legacy-hide{display:none!important}
`;document.head.appendChild(s);
}
const root=()=>document.querySelector('.qmes-purchase-live');

function setValue(el,v){
if(!el)return;
const p=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
const d=Object.getOwnPropertyDescriptor(p,'value');d?.set?d.set.call(el,v):el.value=v;
el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
}
function header(r){
const a=r.querySelector('.qmes-purchase-page-head .qerp-head-actions,.qerp-head .qerp-head-actions');if(!a)return;
const b=[...a.querySelectorAll('button')].find(x=>/신규\s*발주|발주서\s*생성|구매\s*발주\s*등록|입력\s*닫기|등록\s*닫기/.test(clean(x.textContent)));if(!b)return;
b.classList.add('qmes-purchase-register-btn');b.textContent=r.querySelector('.qerp-card .qerp-form')?'등록 닫기':'+ 구매 발주 등록';
}
function form(r){
const f=r.querySelector('.qerp-card .qerp-form');if(!f)return;f.classList.add('qmes-purchase-register-form');
if(!f.querySelector('.qmes-purchase-register-title')){const t=document.createElement('div');t.className='qmes-purchase-register-title';t.textContent='구매 발주 등록';f.prepend(t);}
const s=f.querySelector('button[type="submit"]');if(s)s.textContent='구매 발주 등록';
}
function tabs(r){
const h=r.querySelector('.qmes-purchase-capture-host'),f=h?.querySelector('.qpc-filter-card'),t=h?.querySelector('.qpc-table-card');if(!h||!f||!t)return;
let x=h.querySelector('.qmes-purchase-erp-tabs');if(!x){x=document.createElement('div');x.className='qmes-purchase-erp-tabs';x.innerHTML=[['','전체'],['미입고','미입고'],['부분입고','부분입고'],['입고완료','입고완료']].map(a=>`<button type="button" class="qmes-purchase-erp-tab" data-ps="${a[0]}">${a[1]}</button>`).join('');t.before(x);}
const v=clean(f.querySelector('[data-qpc-filter="status"]')?.value);x.querySelectorAll('button').forEach(b=>b.classList.toggle('active',clean(b.dataset.ps)===v));
}
function hideOld(r){
const h=r.querySelector('.qmes-purchase-capture-host');if(!h)return;
r.querySelectorAll('.qp-flow,.qp-kpis').forEach(n=>{if(!h.contains(n))n.classList.add('qmes-purchase-legacy-hide');});
r.querySelectorAll('.qerp-card').forEach(n=>{if(h.contains(n)||n.querySelector('.qerp-form'))return;if(/구매\s*발주\s*현황|등록된\s*실제\s*발주|실제\s*발주만/.test(clean(n.textContent)))n.classList.add('qmes-purchase-legacy-hide');});
const m=[...r.querySelectorAll('div,section,p,span,strong,h1,h2,h3,h4')].find(n=>!h.contains(n)&&(/등록된 실제 발주|실제 발주만/.test(clean(n.textContent))));
if(m){const b=m.closest('.qp-root,.qerp-card,section')||m.parentElement;if(b&&!b.contains(h)&&!b.querySelector('.qerp-form'))b.classList.add('qmes-purchase-legacy-hide');}
}
function edits(r){
const t=r.querySelector('.qmes-purchase-capture-host .qpc-table');if(!t)return;
const hr=t.querySelector('thead tr');if(hr&&!hr.querySelector('.qpc-edit-head')){const th=document.createElement('th');th.className='qpc-edit-head';th.textContent='관리';hr.append(th);}
t.querySelectorAll('tbody tr.qpc-detail').forEach(row=>{const l=row.querySelector('.qpc-date-link[data-purchase-no]');if(!l)return;let td=row.querySelector('.qpc-edit-cell');if(!td){td=document.createElement('td');td.className='qpc-edit-cell';row.append(td);}let b=td.querySelector('.qpc-edit-btn');if(!b){b=document.createElement('button');b.type='button';b.className='qpc-edit-btn';b.textContent='수정';td.append(b);}b.dataset.no=clean(l.dataset.purchaseNo);});
t.querySelectorAll('tbody tr.qpc-month,tbody tr.qpc-total').forEach(row=>{if(!row.querySelector('.qpc-edit-cell')){const td=document.createElement('td');td.className='qpc-edit-cell';row.append(td);}});
const n=t.querySelectorAll('thead th').length||9;t.querySelectorAll('tbody .qpc-empty').forEach(td=>td.colSpan=n);
}
function openEdit(r,no){
let a=[...r.querySelectorAll('.qp-po-link')].find(x=>clean(x.textContent)===no);if(a){a.click();return true;}
const q=[...r.querySelectorAll('.qp-toolbar input[type="search"]')].find(x=>/발주번호|협력사|품목|MRP/.test(clean(x.placeholder)))||r.querySelector('.qp-toolbar input[type="search"]');if(!q)return false;setValue(q,no);
let i=0;const tm=setInterval(()=>{i++;a=[...r.querySelectorAll('.qp-po-link')].find(x=>clean(x.textContent)===no);if(a){clearInterval(tm);a.click();}else if(i>=12){clearInterval(tm);alert('수정 화면을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');}},50);return true;
}
function click(e){
const el=e.target instanceof Element?e.target:null;
const eb=el?.closest('.qpc-edit-btn[data-no]');if(eb){const r=eb.closest('.qmes-purchase-live')||root();if(!r)return;e.preventDefault();e.stopPropagation();const no=clean(eb.dataset.no);if(no&&!openEdit(r,no))alert('수정 데이터를 찾지 못했습니다: '+no);return;}
const tb=el?.closest('.qmes-purchase-erp-tab[data-ps]');if(tb){const r=tb.closest('.qmes-purchase-live')||root(),h=r?.querySelector('.qmes-purchase-capture-host'),s=h?.querySelector('[data-qpc-filter="status"]'),b=h?.querySelector('[data-qpc-action="search"]');if(!s||!b)return;e.preventDefault();e.stopPropagation();setValue(s,clean(tb.dataset.ps));b.click();setTimeout(schedule,0);}
}
function apply(){queued=false;css();const r=root();if(!r)return;r.classList.add('qmes-purchase-erp');header(r);form(r);hideOld(r);tabs(r);edits(r);}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{apply();setTimeout(apply,40);});}
function start(){css();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});document.addEventListener('click',click,true);window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));window.addEventListener('qmes:erp-data-changed',()=>setTimeout(schedule,60));schedule();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
