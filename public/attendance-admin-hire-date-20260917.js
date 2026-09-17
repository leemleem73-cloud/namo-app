(()=>{
'use strict';
if(window.__NAMO_ADMIN_HIRE_DATE_20260917__)return;
window.__NAMO_ADMIN_HIRE_DATE_20260917__=true;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let busy=false,timer=null,lastKey='',cached=null;
const pending=new Map();
function isAdmin(){return document.documentElement.dataset.attendanceRole==='admin'}
function kstToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function currentQuery(){const month=$('#namoAdminDate')?.value||kstToday().slice(0,7);const today=kstToday();const date=today.startsWith(month)?today:`${month}-01`;return{month,date,department:$('#namoAdminDept')?.value||''}}
async function api(url,opt={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opt});const p=await r.json().catch(()=>({success:false,message:'서버 응답 오류'}));if(!r.ok||p?.success===false)throw new Error(p?.message||`HTTP ${r.status}`);return p?.data??p}
function injectStyle(){if($('#namoHireDateStyle'))return;const s=document.createElement('style');s.id='namoHireDateStyle';s.textContent=`
html[data-attendance-role="admin"] .namo-att-table{min-width:890px!important}
html[data-attendance-role="admin"] .namo-att-table th[data-namo-hire-head]{width:108px!important}
html[data-attendance-role="admin"] .namo-hire-cell{padding:5px 4px!important;overflow:visible!important}
html[data-attendance-role="admin"] .namo-hire-input{width:100px;height:29px;border:1px solid #d8e1ea;border-radius:7px;background:#fff;padding:0 5px;color:#26364d;font-size:9.5px;font-weight:700;box-sizing:border-box}
html[data-attendance-role="admin"] .namo-hire-input:focus{outline:2px solid #dbeafe;border-color:#3b82f6}
html[data-attendance-role="admin"] .namo-hire-input.saving{opacity:.55}
html[data-attendance-role="admin"] .namo-auto-leave{font-weight:900!important;color:#176dd0!important}
html[data-attendance-role="admin"] .namo-hire-note{margin:0 0 9px;padding:8px 10px;border-radius:10px;background:#f5f9ff;color:#5b6b7e;font-size:9.5px;line-height:1.45;border:1px solid #e0ebf7}
html[data-attendance-role="admin"] .namo-hire-note b{color:#176dd0}
`;document.head.appendChild(s)}
async function loadOverview(force=false){const q=currentQuery();const key=`${q.date}|${q.month}`;if(!force&&cached&&key===lastKey)return cached;cached=await api(`/api/attendance/admin/overview?date=${encodeURIComponent(q.date)}&month=${encodeURIComponent(q.month)}&_=${Date.now()}`);lastKey=key;return cached}
function targetProfiles(overview){const q=currentQuery();return(overview?.employees||[]).filter(u=>!q.department||u.department===q.department)}
function ensureNote(table){const wrap=table.closest('.namo-att-table-wrap');if(!wrap||wrap.previousElementSibling?.classList?.contains('namo-hire-note'))return;const note=document.createElement('div');note.className='namo-hire-note';note.innerHTML='<b>입사일 기준 연차 자동</b> · 입사일을 입력하면 저장 후에도 유지되며 부여/잔여 연차가 자동 계산됩니다.';wrap.parentNode.insertBefore(note,wrap)}
function ensureHeader(table){const row=table.tHead?.rows?.[0];if(!row||row.querySelector('[data-namo-hire-head]'))return;const th=document.createElement('th');th.dataset.namoHireHead='1';th.textContent='입사일';if(row.cells[0]?.nextSibling)row.insertBefore(th,row.cells[0].nextSibling);else row.appendChild(th)}
function applyComputed(tr,u){const cells=Array.from(tr.cells);if(cells.length<11)return;const granted=cells[8],used=cells[9],remain=cells[10];if(granted){granted.textContent=`${Number(u.leaveGranted||0)}일`;granted.classList.add('namo-auto-leave');granted.title=u.hireDate?`입사일 ${u.hireDate} 기준 자동 산정`:'입사일 미등록 · 기존 15일 기준'}if(used)used.textContent=`${Number(u.leaveUsed||0)}일`;if(remain)remain.textContent=`${Number(u.leaveRemaining||0)}일`}
function addHireCell(tr,u,overview){let td=tr.querySelector('[data-namo-hire-cell]');let input=td?.querySelector('.namo-hire-input');if(!td){td=document.createElement('td');td.dataset.namoHireCell='1';td.className='namo-hire-cell';input=document.createElement('input');input.type='date';input.className='namo-hire-input';td.appendChild(input);if(tr.cells[0]?.nextSibling)tr.insertBefore(td,tr.cells[0].nextSibling);else tr.appendChild(td)}
input.dataset.userId=u.id||'';input.setAttribute('aria-label',`${u.name||'직원'} 입사일`);const pendingValue=pending.get(String(u.id));const serverValue=u.hireDate||'';const effective=pendingValue??serverValue;if(document.activeElement!==input&&!input.classList.contains('saving')&&input.value!==effective)input.value=effective;input.title=effective?'입사일 수정':'입사일 입력';if(!input.dataset.bound){input.dataset.bound='1';input.addEventListener('change',async()=>{const userId=String(input.dataset.userId||'');const value=input.value;const old=pending.get(userId)??serverValue;pending.set(userId,value);input.classList.add('saving');input.disabled=true;try{const saved=await api(`/api/attendance/admin/users/${encodeURIComponent(userId)}/hire-date`,{method:'PUT',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({hireDate:value,asOfDate:overview.date||currentQuery().date})});const confirmed=saved?.hireDate??value;pending.set(userId,confirmed);input.value=confirmed;cached=null;lastKey='';const fresh=await loadOverview(true);const freshUser=(fresh.employees||[]).find(x=>String(x.id)===userId);if(freshUser){pending.delete(userId);input.value=freshUser.hireDate||confirmed;u.hireDate=freshUser.hireDate||confirmed;u.leaveGranted=freshUser.leaveGranted;u.leaveUsed=freshUser.leaveUsed;u.leaveRemaining=freshUser.leaveRemaining;applyComputed(tr,freshUser)}else{input.value=confirmed}}catch(e){pending.delete(userId);input.value=old||'';alert(e.message||'입사일 저장에 실패했습니다.')}finally{input.disabled=false;input.classList.remove('saving')}})}applyComputed(tr,u)}
async function patch(force=false){if(busy||!isAdmin())return;const table=$('.namo-att-table');if(!table)return;busy=true;try{injectStyle();ensureHeader(table);ensureNote(table);const overview=await loadOverview(force);const profiles=targetProfiles(overview);const rows=$$('tbody tr',table).filter(tr=>!tr.querySelector('.namo-admin-empty'));rows.forEach((tr,i)=>{const u=profiles[i];if(u)addHireCell(tr,u,overview)});const empty=table.querySelector('tbody tr .namo-admin-empty');if(empty&&empty.parentElement)empty.colSpan=11}catch(e){console.warn('[NAMO hire date patch]',e)}finally{busy=false}}
function schedule(force=false){clearTimeout(timer);timer=setTimeout(()=>patch(force),120)}
document.addEventListener('change',e=>{if(e.target?.id==='namoAdminDate'||e.target?.id==='namoAdminDept'){cached=null;lastKey='';schedule(true)}},true);
const observer=new MutationObserver(muts=>{if(muts.some(m=>Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(n.matches?.('.namo-att-table')||n.querySelector?.('.namo-att-table')))))schedule(false)});
observer.observe(document.documentElement,{subtree:true,childList:true});
setInterval(()=>{if(isAdmin()&&$('.page[data-page="records"]')?.classList.contains('active'))schedule(false)},5000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(true));else schedule(true);
})();