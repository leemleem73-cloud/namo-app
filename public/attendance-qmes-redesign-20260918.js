(()=>{
'use strict';
if(window.__QMES_ATTENDANCE_REDESIGN_20260918__)return;
window.__QMES_ATTENDANCE_REDESIGN_20260918__=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const pad=n=>String(n).padStart(2,'0');
const api=async(url,opt={})=>{
  const init={credentials:'same-origin',cache:'no-store',...opt};
  if(opt.body!=null)init.headers={'Content-Type':'application/json',...(opt.headers||{})};
  const res=await fetch(url,init);
  const payload=await res.json().catch(()=>({success:false,message:'서버 응답을 확인할 수 없습니다.'}));
  if(!res.ok||payload?.success===false){const e=new Error(payload?.message||('HTTP '+res.status));e.status=res.status;throw e}
  return payload?.data??payload;
};
const state={me:null,today:null,logs:[],schedule:{startTime:'08:00',endTime:'17:00'},timer:null};

function toast(msg){
  let t=$('#namoLiveToast');
  if(!t){t=document.createElement('div');t.id='namoLiveToast';Object.assign(t.style,{position:'fixed',left:'50%',bottom:'92px',transform:'translateX(-50%)',zIndex:'9999',background:'#12233f',color:'#fff',padding:'11px 15px',borderRadius:'12px',fontSize:'12px',fontWeight:'850',maxWidth:'calc(100% - 34px)',boxShadow:'0 10px 30px rgba(0,0,0,.18)',opacity:'0',transition:'.18s',pointerEvents:'none'});document.body.appendChild(t)}
  t.textContent=msg;t.style.opacity='1';clearTimeout(t._timer);t._timer=setTimeout(()=>t.style.opacity='0',2300);
}
function kp(d=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d);
  const o={};parts.forEach(p=>o[p.type]=p.value);return o;
}
function todayKey(){const p=kp();return p.year+'-'+p.month+'-'+p.day}
function liveClock(){const p=kp();return p.hour+':'+p.minute}
function displayDate(key){
  const m=String(key||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return String(key||'');
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));const days=['일','월','화','수','목','금','토'];
  return m[1]+'년 '+Number(m[2])+'월 '+Number(m[3])+'일 ('+days[d.getDay()]+')';
}
function shortDate(key){const m=String(key||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?(Number(m[2])+'/'+Number(m[3])):'-'}
function time(v){if(!v)return'-';const d=new Date(v);return Number.isNaN(d.getTime())?'-':d.toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false})}
function minsFromTime(s){const m=String(s||'').match(/^(\d{2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):0}
function logKey(r){return String(r?.workDate||'').slice(0,10)}
function weekKeys(){
  const p=kp();const now=new Date(Number(p.year),Number(p.month)-1,Number(p.day));
  const diff=(now.getDay()+6)%7;const mon=new Date(now);mon.setDate(now.getDate()-diff);
  const out=[];for(let i=0;i<6;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);out.push(d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()))}
  return out;
}
function statusFor(key,row){
  const today=todayKey();
  if(row?.clockIn&&row?.clockOut)return{label:'완료',cls:'done'};
  if(row?.clockIn&&!row?.clockOut)return key===today?{label:'근무 중',cls:'working'}:{label:'퇴근누락',cls:'missing'};
  if(key>today)return{label:'예정',cls:'future'};
  const d=new Date(key+'T00:00:00');if(d.getDay()===6||d.getDay()===0)return{label:'휴무',cls:'future'};
  if(key===today)return{label:'출근 전',cls:'future'};
  return{label:'미출근',cls:'missing'};
}
function durationMinutes(row,key){
  if(!row?.clockIn)return 0;
  const a=new Date(row.clockIn),b=row.clockOut?new Date(row.clockOut):(key===todayKey()?new Date():null);
  if(!b||Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))return 0;
  return Math.max(0,Math.floor((b-a)/60000));
}
function durationText(m){const h=Math.floor(m/60),mm=m%60;return h?(h+'시간 '+mm+'분'):(mm+'분')}
function meLabel(){const u=state.me?.user||{};return [u.name,u.title].filter(Boolean).join(' ')||'사용자'}
function workplace(row){return row?.workplaceName||state.today?.workplaceName||'충주 1공장'}
function gpsAccuracy(row){const a=Number(row?.gpsIn?.accuracy);return Number.isFinite(a)&&a>0?Math.round(a):null}

function buildHome(){
  const page=$('.page[data-page="home"]');if(!page)return;
  let host=$('#qmesAttendanceHome20260918');
  if(!host){host=document.createElement('div');host.id='qmesAttendanceHome20260918';host.className='qmes-att-home';page.appendChild(host)}
  const t=state.today||{},tk=todayKey(),todayStatus=statusFor(tk,t),acc=gpsAccuracy(t),week=weekKeys();
  const rows=week.map(k=>state.logs.find(r=>logKey(r)===k));
  const names=['월','화','수','목','금','토'];
  const weekHtml=week.map((k,i)=>{
    const r=rows[i],st=statusFor(k,r);
    return '<button type="button" class="qmes-att-day '+(k===tk?'today':'')+'" data-att-date="'+k+'" style="border-top:0;border-bottom:0;border-left:0">'+
      '<div class="dow">'+names[i]+'</div><div class="date">'+shortDate(k)+'</div>'+
      '<div class="tin">'+(r?.clockIn?time(r.clockIn):'-')+'</div><div class="tout">'+(r?.clockOut?time(r.clockOut):'-')+'</div>'+
      '<span class="qmes-att-badge '+st.cls+'">'+st.label+'</span></button>';
  }).join('');
  let workDays=0,total=0,late=0,missing=0;
  rows.forEach((r,i)=>{
    const key=week[i];if(r?.clockIn){workDays++;total+=durationMinutes(r,key);if(minsFromTime(time(r.clockIn))>minsFromTime(state.schedule.startTime)+5)late++}
    if(statusFor(key,r).cls==='missing'&&r?.clockIn)missing++;
  });
  host.innerHTML=
    '<section class="qmes-att-hero">'+
      '<div class="qmes-att-hero-top"><div class="qmes-att-date">'+displayDate(tk)+'</div><div class="qmes-att-place">⌖ '+workplace(t)+'</div></div>'+
      '<div class="qmes-att-clock" id="qmesAttLiveClock">'+liveClock()+'</div>'+
      '<div class="qmes-att-hero-sub">좋은 하루 되세요!</div>'+
      '<div class="qmes-att-hero-bottom"><div class="qmes-att-user">👤 <span>출근자</span> <b>'+meLabel()+'</b></div><div class="qmes-att-status '+(todayStatus.cls==='future'?'before':todayStatus.cls==='done'?'done':'')+'">'+todayStatus.label+'</div></div>'+
    '</section>'+
    '<section class="qmes-att-actions">'+
      '<button type="button" class="qmes-att-action" id="qmesAttClockIn" '+(t.clockIn?'disabled':'')+'><div><div class="ico">⇥</div><strong>출근하기</strong><span>'+(t.clockIn?time(t.clockIn):state.schedule.startTime)+'</span></div></button>'+
      '<button type="button" class="qmes-att-action" id="qmesAttClockOut" '+(!t.clockIn||t.clockOut?'disabled':'')+'><div><div class="ico">⇤</div><strong>퇴근하기</strong><span>'+(t.clockOut?time(t.clockOut):'-')+'</span></div></button>'+
    '</section>'+
    '<section class="qmes-att-gps">'+
      '<div class="qmes-att-gps-item"><div class="qmes-att-gps-ico">⌖</div><div class="qmes-att-gps-text"><b>'+(t.clockIn?'GPS 위치 확인 완료':'GPS 위치 확인')+'</b><span>'+(acc?('정확도 약 '+acc+'m'):'출근 시 위치를 확인합니다.')+'</span></div></div>'+
      '<div class="qmes-att-gps-item"><div class="qmes-att-gps-ico">⌁</div><div class="qmes-att-gps-text"><b>'+workplace(t)+'</b><span>'+(t.clockIn?'출근 위치 기록이 저장되었습니다.':'선택된 근무지')+'</span></div></div>'+
    '</section>'+
    '<section class="qmes-att-card"><div class="qmes-att-card-head"><h3>이번 주 근무 현황</h3><button type="button" id="qmesAttViewAll">전체보기 ›</button></div><div class="qmes-att-week">'+weekHtml+'</div></section>'+
    '<section class="qmes-att-card"><div class="qmes-att-card-head"><h3>이번 주 근무 요약</h3></div><div class="qmes-att-summary">'+
      '<div class="qmes-att-sum"><div class="icon">▣</div><div class="label">근무일수</div><div class="value">'+workDays+'일</div></div>'+
      '<div class="qmes-att-sum"><div class="icon">◷</div><div class="label">총 근무시간</div><div class="value">'+durationText(total)+'</div></div>'+
      '<div class="qmes-att-sum '+(late?'alert':'')+'"><div class="icon">⚠</div><div class="label">지각</div><div class="value">'+late+'회</div></div>'+
      '<div class="qmes-att-sum '+(missing?'alert':'')+'"><div class="icon">!</div><div class="label">퇴근누락</div><div class="value">'+missing+'회</div></div>'+
    '</div></section>';
  bindHome();
}
function ensureDetail(){
  let el=$('#qmesAttendanceDetail20260918');if(el)return el;
  el=document.createElement('div');el.id='qmesAttendanceDetail20260918';el.className='qmes-att-detail';
  el.innerHTML='<div class="qmes-att-detail-shell"><div class="qmes-att-detail-head"><button type="button" id="qmesAttDetailBack">‹</button><h2>근무 상세내역</h2><span></span></div><div class="qmes-att-detail-body" id="qmesAttDetailBody"></div></div>';
  document.body.appendChild(el);$('#qmesAttDetailBack',el).onclick=closeDetail;return el;
}
function openDetail(key){
  const row=state.logs.find(r=>logKey(r)===key)||(key===todayKey()?state.today:null)||null;
  const st=statusFor(key,row),acc=gpsAccuracy(row),work=durationMinutes(row,key),place=workplace(row),gpsOk=Boolean(row?.gpsIn&&Object.keys(row.gpsIn).length);
  const body=$('#qmesAttDetailBody',ensureDetail());
  body.innerHTML=
    '<div class="qmes-att-detail-date"><strong>'+displayDate(key)+'</strong><span class="qmes-att-detail-status">'+st.label+'</span></div>'+
    '<div class="qmes-att-detail-card">'+
      '<div class="qmes-att-detail-row"><span class="ri">👤</span><span class="rk">출근자</span><span class="rv">'+meLabel()+'</span></div>'+
      '<div class="qmes-att-detail-row"><span class="ri">▣</span><span class="rk">근무계획</span><span class="rv">'+state.schedule.startTime+' ~ '+state.schedule.endTime+'</span></div>'+
      '<div class="qmes-att-detail-row"><span class="ri">▶</span><span class="rk">실제 출근</span><span class="rv">'+(row?.clockIn?time(row.clockIn):'-')+'</span></div>'+
      '<div class="qmes-att-detail-row"><span class="ri">⇥</span><span class="rk">실제 퇴근</span><span class="rv">'+(row?.clockOut?time(row.clockOut):'-')+'</span></div>'+
      '<div class="qmes-att-detail-row"><span class="ri">◷</span><span class="rk">근무시간</span><span class="rv">'+(work?durationText(work):(st.cls==='working'?'진행 중':'-'))+'</span></div>'+
      '<div class="qmes-att-detail-row"><span class="ri">⌖</span><span class="rk">근무장소</span><span class="rv">'+place+'</span></div>'+
      '<div class="qmes-att-detail-row"><span class="ri">◎</span><span class="rk">GPS 상태</span><span class="rv '+(gpsOk?'ok':'')+'">'+(gpsOk?'위치 기록 완료':'-')+'</span></div>'+
    '</div>'+
    '<div class="qmes-att-map"><div class="qmes-att-map-radius"></div><div class="qmes-att-map-pin"></div><div class="qmes-att-map-label">⌂ '+place+'</div></div>'+
    '<div class="qmes-att-info">'+(gpsOk?(acc?('GPS 위치 기록이 저장되었습니다. 측정 정확도는 약 '+acc+'m입니다.'):'GPS 위치 기록이 저장되었습니다.'):'해당 날짜의 GPS 위치 기록이 없습니다.')+'</div>'+
    '<button type="button" class="qmes-att-back-list" id="qmesAttBackList">목록으로 돌아가기</button>';
  $('#qmesAttBackList').onclick=closeDetail;ensureDetail().classList.add('open');document.body.style.overflow='hidden';
}
function closeDetail(){const el=$('#qmesAttendanceDetail20260918');if(el)el.classList.remove('open');document.body.style.overflow=''}

function gps(){return new Promise((resolve,reject)=>{
  if(!navigator.geolocation)return reject(new Error('GPS를 사용할 수 없습니다.'));
  navigator.geolocation.getCurrentPosition(
    p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,capturedAt:new Date().toISOString()}),
    e=>reject(new Error(e.code===1?'위치 권한을 허용해주세요.':'현재 위치를 확인할 수 없습니다.')),
    {enableHighAccuracy:true,timeout:10000,maximumAge:10000}
  );
})}
async function clockIn(){
  const btn=$('#qmesAttClockIn');if(btn)btn.disabled=true;
  try{
    toast('현재 위치를 확인하는 중입니다.');const g=await gps();
    const workplaceCode=localStorage.getItem('namo_workplace_v4_live')||state.today?.workplaceCode||'chungju';
    await api('/api/attendance/clock-in-v2',{method:'POST',body:JSON.stringify({gps:g,device:navigator.userAgent,workplaceCode})});
    toast('출근 등록이 완료되었습니다.');await loadAll();
  }catch(e){toast(e.message);if(btn)btn.disabled=false}
}
async function clockOut(){
  const btn=$('#qmesAttClockOut');if(btn)btn.disabled=true;
  try{
    if(!state.today?.clockIn)throw new Error('먼저 출근을 등록해 주세요.');
    toast('현재 위치를 확인하는 중입니다.');const g=await gps();
    await api('/api/attendance/clock-out-v2',{method:'POST',body:JSON.stringify({gps:g})});
    toast('퇴근 등록이 완료되었습니다.');await loadAll();
  }catch(e){toast(e.message);if(btn)btn.disabled=false}
}
function bindHome(){
  const a=$('#qmesAttClockIn');if(a)a.onclick=clockIn;
  const b=$('#qmesAttClockOut');if(b)b.onclick=clockOut;
  $$('.qmes-att-day').forEach(x=>x.onclick=()=>openDetail(x.dataset.attDate));
  const all=$('#qmesAttViewAll');if(all)all.onclick=()=>$('.nav-btn[data-page-target="records"]')?.click();
}
function restyleOtherPages(){
  const page=$('.page[data-page="records"]');if(page){const t=$('.page-title',page),s=$('.page-sub',page);if(t)t.textContent='근무내역';if(s)s.textContent='실제 출퇴근 기록과 상태를 확인합니다.'}
  const requests=$('.page[data-page="requests"] .page-title');if(requests)requests.textContent='근태신청';
  const leave=$('.page[data-page="leave"] .page-title');if(leave)leave.textContent='휴가관리';
}
async function loadAll(){
  try{
    const month=todayKey().slice(0,7);
    const values=await Promise.all([
      api('/api/attendance/me'),
      api('/api/attendance/today-v2').catch(()=>null),
      api('/api/attendance/logs?month='+encodeURIComponent(month)).catch(()=>[]),
      api('/api/attendance/work-schedule').catch(()=>({startTime:'08:00',endTime:'17:00'}))
    ]);
    state.me=values[0];state.today=values[1];state.logs=Array.isArray(values[2])?values[2]:[];state.schedule=values[3]||state.schedule;
    buildHome();restyleOtherPages();
    document.documentElement.setAttribute('data-namo-final-ready','1');
    document.documentElement.setAttribute('data-attendance-boot','ready');
  }catch(e){
    if(e.status===401){location.replace('/mobile-login.html?mobile=1&next=%2Fattendance.html');return}
    toast(e.message);document.documentElement.setAttribute('data-namo-final-ready','1');document.documentElement.setAttribute('data-attendance-boot','ready');
  }
}
function tick(){const el=$('#qmesAttLiveClock');if(el)el.textContent=liveClock()}
function init(){
  ensureDetail();loadAll();clearInterval(state.timer);state.timer=setInterval(tick,15000);
  window.addEventListener('pageshow',loadAll);document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadAll()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();