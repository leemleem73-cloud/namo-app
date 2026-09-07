(()=>{
'use strict';
const byId=id=>document.getElementById(id);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
let currentUserId='';
async function request(url,opt={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opt});const p=await r.json().catch(()=>({success:false,message:'서버 응답 오류'}));if(!r.ok||p?.success===false)throw new Error(p?.message||'직원 정보를 불러오지 못했습니다.');return p?.data??p}
function addEmail(){if(byId('memberEmail')||!byId('memberName'))return;const box=document.createElement('div');box.innerHTML='<label>이메일</label><input id="memberEmail" type="email" placeholder="PC 회원정보 이메일">';byId('memberName').insertAdjacentElement('afterend',box)}
async function loadCurrentUser(){if(currentUserId)return currentUserId;try{const me=await request('/api/attendance/me');currentUserId=String(me?.user?.id||'')}catch(_e){}return currentUserId}
async function load(){const box=byId('memberList');if(!box)return;box.innerHTML='<div class="empty">PC 회원정보 연동 중...</div>';try{const [rows]=await Promise.all([request('/api/admin/users'),loadCurrentUser()]);window.__namoPcMembers=rows;byId('memberCount').textContent=rows.length+'명';box.innerHTML=rows.length?rows.map(u=>{const self=String(u.id)===String(currentUserId);return '<div class="item"><div class="item-top"><b>'+escapeHtml(u.name||'-')+' '+escapeHtml(u.title||'')+'</b><span class="pill '+(u.role==='admin'?'green':'')+'">'+(u.role==='admin'?'관리자':'직원')+'</span></div><p>'+escapeHtml(u.department||'부서 미지정')+' · '+escapeHtml(u.email||'이메일 없음')+'</p><div class="approve-actions"><button class="approve" data-pc-member="'+escapeHtml(u.id)+'">수정</button>'+(self?'<button class="reject" type="button" disabled title="현재 로그인 계정은 삭제할 수 없습니다.">본인</button>':'<button class="reject" type="button" data-pc-member-delete="'+escapeHtml(u.id)+'">삭제</button>')+'</div></div>'}).join(''):'<div class="empty">등록된 직원이 없습니다.</div>';box.querySelectorAll('[data-pc-member]').forEach(b=>b.onclick=()=>edit(rows.find(x=>String(x.id)===String(b.dataset.pcMember))));box.querySelectorAll('[data-pc-member-delete]').forEach(b=>b.onclick=()=>removeMember(rows.find(x=>String(x.id)===String(b.dataset.pcMemberDelete)),b))}catch(e){box.innerHTML='<div class="empty">'+escapeHtml(e.message)+'</div>'}}
function edit(u){if(!u)return;addEmail();byId('memberId').value=u.id||'';byId('memberName').value=u.name||'';byId('memberEmail').value=u.email||'';byId('memberDept').value=u.department||'';byId('memberTitle').value=u.title||'';byId('memberRole').value=u.role||'user';byId('memberModalTitle').textContent='직원 수정';byId('memberModal').classList.remove('hidden')}
async function removeMember(u,button){if(!u)return;if(String(u.id)===String(currentUserId)){alert('현재 로그인한 본인 계정은 삭제할 수 없습니다.');return}const label=[u.name,u.title].filter(Boolean).join(' ');if(!confirm((label||'선택한 직원')+'을(를) 삭제하시겠습니까?\n삭제하면 해당 계정으로 더 이상 로그인할 수 없습니다.'))return;const old=button?.textContent||'삭제';if(button){button.disabled=true;button.textContent='삭제 중...'}try{await request('/api/admin/users/'+encodeURIComponent(u.id),{method:'DELETE'});await load();alert((u.name||'직원')+' 계정이 삭제되었습니다.')}catch(e){if(button){button.disabled=false;button.textContent=old}alert(e.message||'직원 삭제에 실패했습니다.')}}
function goAdminV2(){location.assign('/attendance-admin-v2-20260907.html?v=20260907-v2-hotfix2')}
function installAdminV2Bridge(){
  const oldPage=byId('pageAdminOverview');
  if(oldPage&&!oldPage.classList.contains('hidden')){goAdminV2();return}
  const old=byId('adminOverviewOpen');
  if(old){
    old.textContent='전사 근태 · 연차 현황 V2';
    old.onclick=goAdminV2;
    old.dataset.namoV2='1';
  }
  const card=byId('adminCard');
  if(card&&!byId('adminOverviewV2Open')&&!old){
    const b=document.createElement('button');
    b.id='adminOverviewV2Open';
    b.type='button';
    b.className='soft full';
    b.style.marginTop='10px';
    b.style.background='linear-gradient(135deg,#0f3550,#174f72)';
    b.style.color='#fff';
    b.style.fontWeight='900';
    b.textContent='전사 근태 · 연차 현황 V2';
    b.onclick=goAdminV2;
    card.appendChild(b);
  }
}
function install(){addEmail();installAdminV2Bridge();const open=byId('adminOpen');if(open&&!open.dataset.pcSync){open.dataset.pcSync='1';open.addEventListener('click',()=>setTimeout(load,80),true)}}
let count=0;const timer=setInterval(()=>{install();if(++count>120)clearInterval(timer)},200);
window.addEventListener('pageshow',installAdminV2Bridge);
})();
