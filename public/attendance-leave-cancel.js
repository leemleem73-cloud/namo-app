(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateOnly=v=>String(v||'').slice(0,10);
const label=s=>({PENDING_1:'1차 승인대기',PENDING_2:'최종 승인대기',APPROVED:'최종승인',REJECTED:'반려',CANCELLED:'신청취소'}[s]||s||'-');
async function api(url,opt={}){const init={credentials:'same-origin',cache:'no-store',...opt};if(opt.body!=null)init.headers={'Content-Type':'application/json',...(opt.headers||{})};const r=await fetch(url,init);const p=await r.json().catch(()=>({success:false,message:'서버 응답을 확인할 수 없습니다.'}));if(!r.ok||p?.success===false)throw new Error(p?.message||'처리하지 못했습니다.');return p?.data??p}
function toast(msg){const e=document.getElementById('toast');if(!e){alert(msg);return}e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}
let busy=false,timer=null;
async function render(){if(busy)return;const box=document.getElementById('leaveList');if(!box)return;busy=true;try{const d=await api('/api/attendance/leave');const rows=d.requests||[];const count=document.getElementById('leaveCount');if(count)count.textContent=`${rows.length}건`;box.innerHTML=rows.length?rows.map(r=>{const pending=r.status==='PENDING_1'||r.status==='PENDING_2';const cls=r.status==='APPROVED'?'green':r.status==='REJECTED'||r.status==='CANCELLED'?'red':'amber';return `<div class="item"><div class="item-top"><b>${esc(dateOnly(r.start_date))}</b><span class="pill ${cls}">${esc(label(r.status))}</span></div><p>${Number(r.days)}일${r.reason?' · '+esc(r.reason):''}${r.reject_reason?'<br>반려사유: '+esc(r.reject_reason):''}</p>${pending?`<div class="approve-actions"><button class="reject" data-leave-cancel="${esc(r.id)}">신청 취소</button></div>`:''}</div>`}).join(''):'<div class="empty">연차 신청내역이 없습니다.</div>';box.querySelectorAll('[data-leave-cancel]').forEach(b=>b.onclick=()=>cancelLeave(b.dataset.leaveCancel));}catch(_e){}finally{busy=false}}
async function cancelLeave(id){if(!confirm('이 연차 신청을 취소하시겠습니까?'))return;try{await api('/api/attendance/leave/'+encodeURIComponent(id)+'/cancel',{method:'POST',body:'{}'});toast('연차 신청이 취소되었습니다.');await render()}catch(e){toast(e.message)}}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>{const page=document.getElementById('pageLeave');if(page&&!page.classList.contains('hidden'))render()},80)}
function init(){document.addEventListener('click',e=>{if(e.target.closest('[data-page="leave"],[data-go="leave"]'))setTimeout(render,120)});const box=document.getElementById('leaveList');if(box)new MutationObserver(schedule).observe(box,{childList:true,subtree:false});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
