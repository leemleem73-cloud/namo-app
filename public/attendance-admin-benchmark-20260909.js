(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unwrap=j=>j&&typeof j==='object'&&'data' in j?j.data:j;
async function getJson(url){
  const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});
  const j=await r.json().catch(()=>null);
  if(!r.ok)throw new Error((j&&j.message)||`HTTP ${r.status}`);
  return unwrap(j)||{};
}
const today=()=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date());
const time=v=>{if(!v)return'--:--';const d=new Date(v);return Number.isNaN(d.getTime())?'--:--':d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false});};
function go(page){const b=$(`.nav-btn[data-page-target="${page}"]`);if(b)b.click();}
function statusMeta(u){
  const s=String(u?.attendanceStatus||'ABSENT');
  if(s==='WORKING')return['근무중','working'];
  if(s==='DONE')return['퇴근완료','done'];
  if(s==='LEAVE'||s==='STATUTORY')return['휴가','leave'];
  return['미출근','absent'];
}
async function render(){
  const root=$('#namoAdminHome');
  if(!root||root.querySelector('.namo-kakao-admin-home'))return;
  try{
    const me=await getJson('/api/attendance/me');
    if(String(me?.user?.role||'').toLowerCase()!=='admin')return;
    const dateKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const [overview,reviews]=await Promise.all([
      getJson(`/api/attendance/admin/overview?date=${encodeURIComponent(dateKey)}&month=${encodeURIComponent(dateKey.slice(0,7))}`),
      getJson('/api/attendance/reviews-v2').catch(()=>[])
    ]);
    const s=overview.summary||{};
    const people=Array.isArray(overview.employees)?overview.employees:[];
    const reviewList=Array.isArray(reviews)?reviews:[];
    const pending=reviewList.filter(x=>!['APPROVED','REJECTED','DONE','COMPLETED'].includes(String(x.status||'').toUpperCase())).length||reviewList.length;
    const working=Number(s.working||0),done=Number(s.done||0),absent=Number(s.absent||0);
    const recent=people.filter(x=>['WORKING','DONE','LEAVE','STATUTORY'].includes(String(x.attendanceStatus||''))).slice(0,5);
    root.innerHTML=`
      <div class="namo-kakao-admin-home">
        <section class="ka-admin-head">
          <div><div class="ka-admin-eyebrow">근태관리 · 관리자</div><div class="ka-admin-title">오늘의 근무 현황</div><div class="ka-admin-date">${esc(today())}</div></div>
          <span class="ka-admin-chip">ADMIN</span>
        </section>
        <section class="ka-summary-grid">
          <button class="ka-summary" data-go="records"><span>재직 인원</span><strong>${Number(s.total||0)}</strong><small>대표이사 제외</small></button>
          <button class="ka-summary" data-go="records"><span>오늘 출근</span><strong>${Number(s.checkedIn||0)}</strong><small>근무중 + 퇴근완료</small></button>
          <button class="ka-summary" data-go="leave"><span>오늘 휴가</span><strong>${Number((s.onLeave||0)+(s.statutory||0))}</strong><small>승인 기준</small></button>
          <button class="ka-summary ka-summary-alert" data-go="requests"><span>검토 대기</span><strong>${pending}</strong><small>처리 필요</small></button>
        </section>
        <section class="ka-card">
          <div class="ka-card-head"><div><strong>빠른 업무</strong><span>자주 사용하는 관리자 메뉴</span></div></div>
          <div class="ka-quick-grid">
            <button class="primary" data-go="records"><b>전체 근태</b><span>월별 집계 · 엑셀</span></button>
            <button data-go="requests"><b>검토함</b><span>${pending}건 대기</span></button>
            <button data-go="leave"><b>휴가 현황</b><span>전 직원 조회</span></button>
            <button data-go="more"><b>직원 관리</b><span>권한 · 이메일</span></button>
          </div>
        </section>
        <section class="ka-card">
          <div class="ka-card-head"><div><strong>오늘 근무</strong><span>출근부터 퇴근까지 한눈에 확인</span></div><button data-go="records">전체보기</button></div>
          <div class="ka-work-strip">
            <div><span>근무중</span><b>${working}</b></div>
            <div><span>퇴근완료</span><b>${done}</b></div>
            <div class="warn"><span>미출근</span><b>${absent}</b></div>
          </div>
          <div class="ka-person-list">${recent.length?recent.map(u=>{const [label,cls]=statusMeta(u);return `<div class="ka-person"><div class="ka-avatar">${esc((u.name||'?').slice(0,1))}</div><div class="ka-person-main"><b>${esc(u.name||'-')}</b><span>${esc(u.department||'-')} · ${esc(u.title||'-')}</span><small>출근 ${time(u.clockIn)} · 퇴근 ${time(u.clockOut)}</small></div><em class="${cls}">${label}</em></div>`;}).join(''):'<div class="ka-empty">오늘 등록된 근무 데이터가 없습니다.</div>'}</div>
        </section>
        <section class="ka-card ka-attention">
          <div class="ka-card-head"><div><strong>확인 필요</strong><span>오늘 관리자 확인이 필요한 항목</span></div></div>
          <button data-go="requests"><span>검토 대기 요청</span><b>${pending}건</b><i>›</i></button>
          <button data-go="records"><span>미출근 직원</span><b>${absent}명</b><i>›</i></button>
        </section>
      </div>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  }catch(e){console.warn('[Attendance admin benchmark]',e);}
}
let timer=0;
function schedule(){clearTimeout(timer);timer=setTimeout(render,80);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
