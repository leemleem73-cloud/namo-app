(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const pad=n=>String(n).padStart(2,'0');
const api=async(url,opt={})=>{
  const init={credentials:'same-origin',cache:'no-store',...opt};
  if(opt.body!=null)init.headers={'Content-Type':'application/json',...(opt.headers||{})};
  const r=await fetch(url,init);
  const p=await r.json().catch(()=>({success:false,message:'서버 응답 오류'}));
  if(!r.ok||p?.success===false){const e=new Error(p?.message||('HTTP '+r.status));e.status=r.status;throw e}
  return p?.data??p;
};
const state={
  me:null,today:null,logs:[],schedule:{startTime:'08:00',endTime:'17:00'},
  leave:{balance:{},requests:[]},notifications:[],recordsMonth:'',
  workplaces:[],workplaceCode:localStorage.getItem('namo_workplace_v4_live')||'chungju',
  workplaceName:'충주 1공장',detailKey:'',timer:null
};
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2300)}
function kstParts(d=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(d);
  const o={};parts.forEach(p=>o[p.type]=p.value);return o;
}
function todayKey(){const p=kstParts();return p.year+'-'+p.month+'-'+p.day}
function liveClock(){const p=kstParts();return p.hour+':'+p.minute}
function fmtTime(v){if(!v)return'-';const d=new Date(v);return Number.isNaN(d.getTime())?'-':d.toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false})}
function fmtDate(key){
  const m=String(key||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return String(key||'');
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])),days=['일','월','화','수','목','금','토'];
  return m[1]+'년 '+Number(m[2])+'월 '+Number(m[3])+'일 ('+days[d.getDay()]+')';
}
function shortDate(key){const m=String(key||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?Number(m[2])+'/'+Number(m[3]):'-'}
function isoKstDate(v){
  if(!v)return'';
  const d=new Date(v);if(Number.isNaN(d.getTime()))return'';
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const o={};p.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day;
}
function logKey(r){
  const raw=String(r?.workDate||'').slice(0,10);
  const byClock=isoKstDate(r?.clockIn||r?.clockOut);
  if(byClock&&raw&&byClock!==raw)return byClock;
  return byClock||raw;
}
function minsOf(t){const m=String(t||'').match(/^(\d{2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):0}
function durationMinutes(r,key){
  if(!r?.clockIn)return 0;
  const a=new Date(r.clockIn),b=r.clockOut?new Date(r.clockOut):(key===todayKey()?new Date():null);
  if(!b||Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))return 0;
  return Math.max(0,Math.floor((b-a)/60000));
}
function durationText(m){const h=Math.floor(m/60),mm=m%60;return h?(h+'시간 '+mm+'분'):(mm+'분')}
function statusFor(key,r){
  const today=todayKey();
  if(r?.clockIn&&r?.clockOut){
    const late=minsOf(fmtTime(r.clockIn))>minsOf(state.schedule.startTime)+5;
    return late?{label:'지각',cls:'late'}:{label:'완료',cls:'done'};
  }
  if(r?.clockIn&&!r?.clockOut)return key===today?{label:'근무 중',cls:'working'}:{label:'퇴근누락',cls:'missing'};
  if(key>today)return{label:'예정',cls:'future'};
  const d=new Date(key+'T00:00:00');if(d.getDay()===0||d.getDay()===6)return{label:'휴무',cls:'future'};
  if(key===today)return{label:'출근 전',cls:'future'};
  return{label:'미출근',cls:'missing'};
}
function weekKeys(){
  const p=kstParts(),now=new Date(Number(p.year),Number(p.month)-1,Number(p.day));
  const mon=new Date(now);mon.setDate(now.getDate()-((now.getDay()+6)%7));
  const a=[];for(let i=0;i<6;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);a.push(d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()))}return a;
}
function employeeLabel(){const u=state.me?.user||{};return [u.name,u.title].filter(Boolean).join(' ')||'사용자'}
function selectedWorkplace(){
  return state.workplaces.find(w=>String(w.code)===String(state.workplaceCode))||null;
}
function workplace(r){
  if(r?.workplaceName)return r.workplaceName;
  if(state.today?.clockIn&&state.today?.workplaceName)return state.today.workplaceName;
  return selectedWorkplace()?.name||state.workplaceName;
}
function gpsAccuracy(r){const a=Number(r?.gpsIn?.accuracy);return Number.isFinite(a)&&a>0?Math.round(a):null}
function showView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  if(name==='records')renderRecords();
  if(name==='requests')renderRequests();
  if(name==='profile')renderProfile();
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderHome(){
  const root=$('#homeRoot');if(!root)return;
  const t=state.today||{},key=todayKey(),st=statusFor(key,t),acc=gpsAccuracy(t),wk=weekKeys(),names=['월','화','수','목','금','토']; if(t?.clockIn&&!state.logs.some(x=>logKey(x)===key))state.logs=[...state.logs,t];
  let workDays=0,total=0,late=0,missing=0;
  const cells=wk.map((k,i)=>{
    const r=state.logs.find(x=>logKey(x)===k),s=statusFor(k,r),mins=durationMinutes(r,k);
    if(r?.clockIn){workDays++;total+=mins;if(s.cls==='late')late++}
    if(s.cls==='missing'&&r?.clockIn)missing++;
    return '<div class="week-day '+(k===key?'today':'')+'"><div class="dow">'+names[i]+'</div><div class="date">'+shortDate(k)+'</div><div class="in">'+(r?.clockIn?fmtTime(r.clockIn):'-')+'</div><div class="out">'+(r?.clockOut?fmtTime(r.clockOut):'-')+'</div><span class="badge '+s.cls+'">'+s.label+'</span></div>';
  }).join('');
  root.innerHTML=
    '<section class="hero">'+
      '<div class="hero-top"><div class="hero-date">'+fmtDate(key)+'</div><div class="hero-place">⌖ '+workplace(t)+'</div></div>'+
      '<div class="hero-clock" id="liveClock">'+liveClock()+'</div><div class="hero-sub">좋은 하루 되세요!</div>'+
      '<div class="hero-bottom"><div class="employee-pill">👤 <span>출근자</span><b>'+employeeLabel()+'</b></div><div class="status-pill '+(st.cls==='future'?'before':st.cls==='missing'?'alert':st.cls==='done'?'done':'')+'">'+st.label+'</div></div>'+
    '</section>'+
    '<section class="clock-actions">'+
      '<button class="clock-action" id="clockInBtn" '+(t.clockIn?'disabled':'')+'><div><div class="ico">⇥</div><strong>출근하기</strong><span>'+(t.clockIn?fmtTime(t.clockIn):state.schedule.startTime)+'</span></div></button>'+
      '<button class="clock-action" id="clockOutBtn" '+(!t.clockIn||t.clockOut?'disabled':'')+'><div><div class="ico">⇤</div><strong>퇴근하기</strong><span>'+(t.clockOut?fmtTime(t.clockOut):'-')+'</span></div></button>'+
    '</section>'+
    '<section class="home-action-stack">'+
      '<button type="button" class="home-action-card workplace-action" id="workplaceChangeBtn">'+
        '<span class="home-action-icon workplace-icon">◉</span>'+
        '<span class="home-action-copy"><b>근무지 변경</b><small>'+workplace(t)+'</small></span>'+
        '<span class="home-action-arrow">›</span>'+
      '</button>'+
      '<button type="button" class="home-action-card detail-action" id="todayDetailBtn">'+
        '<span class="home-action-icon detail-icon">▤</span>'+
        '<span class="home-action-copy"><b>근무 상세내역</b><small>오늘의 출근·퇴근 · 근무지 · GPS 기록 확인</small></span>'+
        '<span class="home-action-arrow">›</span>'+
      '</button>'+
    '</section>'+
    '<section class="card"><div class="card-head"><h2>이번 주 근무 현황</h2><button class="link-btn" id="viewAllBtn">전체보기 ›</button></div><div class="week-grid">'+cells+'</div></section>'+
    '<section class="card"><div class="card-head"><h2>이번 주 근무 요약</h2></div><div class="summary-grid">'+
      '<div class="summary-item"><div class="icon">▣</div><div class="label">근무일수</div><div class="value">'+workDays+'일</div></div>'+
      '<div class="summary-item"><div class="icon">◷</div><div class="label">총 근무시간</div><div class="value">'+durationText(total)+'</div></div>'+
      '<div class="summary-item '+(late?'alert':'')+'"><div class="icon">⚠</div><div class="label">지각</div><div class="value">'+late+'회</div></div>'+
      '<div class="summary-item '+(missing?'alert':'')+'"><div class="icon">!</div><div class="label">퇴근누락</div><div class="value">'+missing+'회</div></div>'+
    '</div></section>';
  $('#clockInBtn').onclick=clockIn;$('#clockOutBtn').onclick=clockOut;$('#viewAllBtn').onclick=()=>showView('records');$('#workplaceChangeBtn').onclick=openWorkplaceSelector;$('#todayDetailBtn').onclick=()=>openDetail(key);
}
function renderRecords(){
  const root=$('#recordsRoot');if(!root)return;
  const month=$('#recordsMonth').value||todayKey().slice(0,7);
  const rows=state.logs.filter(r=>logKey(r).startsWith(month)).slice().sort((a,b)=>logKey(b).localeCompare(logKey(a)));
  let normal=0,late=0,missing=0;
  rows.forEach(r=>{const s=statusFor(logKey(r),r);if(s.cls==='done')normal++;else if(s.cls==='late')late++;else if(s.cls==='missing')missing++});
  const list=rows.length?rows.map(r=>{const k=logKey(r),s=statusFor(k,r),m=durationMinutes(r,k);return '<button class="record-row" type="button" data-record="'+k+'"><span class="record-dot '+s.cls+'"></span><span class="record-main"><b>'+fmtDate(k)+'</b><span>출근 '+fmtTime(r.clockIn)+' · 퇴근 '+fmtTime(r.clockOut)+'</span></span><span class="record-side"><span class="badge '+s.cls+'">'+s.label+'</span><small>'+(m?durationText(m):'-')+'</small></span></button>'}).join(''):'<div class="empty">등록된 근무 기록이 없습니다.</div>';
  root.innerHTML='<div class="records-summary"><div><span>정상근무</span><b>'+normal+'</b></div><div><span>지각</span><b>'+late+'</b></div><div><span>퇴근누락</span><b>'+missing+'</b></div></div><div class="record-list">'+list+'</div>';
  $$('[data-record]').forEach(b=>b.onclick=()=>openDetail(b.dataset.record));
}
function leaveTypeName(v){return({annual:'연차',am_half:'오전 반차',pm_half:'오후 반차',sick:'병가',bereavement:'경조휴가',outside:'외근/출장',overtime:'연장근무'})[String(v||'')]||String(v||'요청')}
function requestStatus(v){return({PENDING_1:'검토대기',PENDING_2:'검토대기',APPROVED:'승인완료',REJECTED:'반려'})[String(v||'')]||String(v||'')}
function renderRequests(){
  const root=$('#requestsRoot');if(!root)return;
  const rows=state.leave?.requests||[],b=state.leave?.balance||{};
  root.innerHTML='<div class="request-card"><div class="quick-grid"><button class="quick-btn" data-open-request="annual"><strong>연차/반차 신청</strong><span>휴가 신청서를 작성합니다.</span></button><button class="quick-btn" data-open-request="outside"><strong>외근/출장 신청</strong><span>근태 요청을 등록합니다.</span></button></div><div class="profile-list" style="margin-top:12px"><div class="profile-row"><span>연차 부여</span><span>'+Number(b.granted||0)+'일</span></div><div class="profile-row"><span>사용</span><span>'+Number(b.used||0)+'일</span></div><div class="profile-row"><span>잔여</span><span>'+Number(b.remaining||0)+'일</span></div></div></div><div class="request-list">'+(rows.length?rows.map(r=>'<div class="request-item"><div class="request-top"><div class="request-title">'+leaveTypeName(r.leave_type)+'</div><span class="badge '+(r.status==='APPROVED'?'done':r.status==='REJECTED'?'missing':'future')+'">'+requestStatus(r.status)+'</span></div><div class="request-meta">'+String(r.start_date||'').slice(0,10)+(String(r.end_date||'').slice(0,10)!==String(r.start_date||'').slice(0,10)?' ~ '+String(r.end_date||'').slice(0,10):'')+' · '+Number(r.days||0)+'일<br>사유: '+(r.reason||'-')+'</div></div>').join(''):'<div class="empty">등록된 신청 내역이 없습니다.</div>')+'</div>';
  $$('[data-open-request]').forEach(b=>b.onclick=()=>openRequest(b.dataset.openRequest));
}
function renderProfile(){
  const root=$('#profileRoot');if(!root)return;const u=state.me?.user||{},b=state.me?.balance||{};
  root.innerHTML='<div class="profile-hero"><div class="name">'+(u.name||'사용자')+'</div><div class="meta">'+(u.department||'-')+' · '+(u.title||'-')+'</div></div><div class="profile-list"><div class="profile-row"><span>이메일</span><span>'+(u.email||'-')+'</span></div><div class="profile-row"><span>권한</span><span>'+(String(u.role||'').toLowerCase()==='admin'?'관리자':'직원')+'</span></div><div class="profile-row"><span>근무지</span><span>'+workplace(state.today)+'</span></div><div class="profile-row"><span>기본 근무시간</span><span>'+state.schedule.startTime+' ~ '+state.schedule.endTime+'</span></div><div class="profile-row"><span>잔여 연차</span><span>'+Number(b.remaining||0)+'일</span></div></div>';
}
function openDetail(key){
  state.detailKey=key;
  const r=state.logs.find(x=>logKey(x)===key)||(key===todayKey()?state.today:null)||null,s=statusFor(key,r),m=durationMinutes(r,key),acc=gpsAccuracy(r),gpsOk=Boolean(r?.gpsIn&&Object.keys(r.gpsIn).length),place=workplace(r),canChange=key===todayKey();
  $('#detailRoot').innerHTML='<div class="detail-body"><div class="detail-date"><strong>'+fmtDate(key)+'</strong><span class="detail-status">'+s.label+'</span></div><div class="detail-card">'+
    '<div class="detail-row"><span>👤</span><span class="k">출근자</span><span class="v">'+employeeLabel()+'</span></div>'+
    '<div class="detail-row"><span>▣</span><span class="k">근무계획</span><span class="v">'+state.schedule.startTime+' ~ '+state.schedule.endTime+'</span></div>'+
    '<div class="detail-row"><span>▶</span><span class="k">실제 출근</span><span class="v">'+(r?.clockIn?fmtTime(r.clockIn):'-')+'</span></div>'+
    '<div class="detail-row"><span>⇥</span><span class="k">실제 퇴근</span><span class="v">'+(r?.clockOut?fmtTime(r.clockOut):'-')+'</span></div>'+
    '<div class="detail-row"><span>◷</span><span class="k">근무시간</span><span class="v">'+(m?durationText(m):(s.cls==='working'?'진행 중':'-'))+'</span></div>'+
    '<div class="detail-row"><span>⌖</span><span class="k">근무장소</span><span class="detail-place-actions"><span class="v">'+place+'</span>'+(canChange?'<button type="button" class="detail-change-btn" id="detailWorkplaceBtn">근무지 변경</button>':'')+'</span></div>'+
    '<button type="button" class="detail-row detail-click-row" id="gpsDetailBtn"><span>◎</span><span class="k">GPS 상태</span><span class="v '+(gpsOk?'ok':'')+'">'+(gpsOk?'정상 (위치 기록)':'-')+' ›</span></button>'+
    '<div class="detail-row"><span>▤</span><span class="k">비고</span><span class="v">-</span></div></div>'+
    '<button type="button" class="map-box map-box-button" id="detailMap"><div class="map-radius"></div><div class="map-pin"></div><div class="map-label">⌂ '+place+'</div><span class="map-expand">↗</span></button>'+
    '<div class="info-box">'+(gpsOk?(acc?('GPS 위치 기록이 저장되었습니다. 정확도 약 '+acc+'m입니다.'):'GPS 위치 기록이 저장되었습니다.'):'해당 날짜의 GPS 위치 기록이 없습니다.')+'</div>'+
    '<button class="back-list" id="backListBtn">목록으로 돌아가기</button></div>';
  openSheet('detailSheet');$('#backListBtn').onclick=()=>closeSheet('detailSheet');const wb=$('#detailWorkplaceBtn');if(wb)wb.onclick=openWorkplaceSelector;const gm=$('#detailMap');if(gm)gm.onclick=()=>openMapDetail(r,place);const gb=$('#gpsDetailBtn');if(gb)gb.onclick=()=>openMapDetail(r,place);
}
function renderWorkplaces(){
  const root=$('#workplaceRoot');if(!root)return;
  const currentRecorded=state.today?.clockIn?String(state.today?.workplaceCode||''):'';
  const selected=String(state.workplaceCode||'');
  const rows=state.workplaces.length?state.workplaces:[{code:'chungju',name:'충주 1공장',address:'충청북도 주덕읍 중원산업로 309'},{code:'pangyo',name:'판교사무소',address:'경기도 성남시 분당구 대왕판교로 606번지 39 판교럭스타워 11층'}];
  root.innerHTML=rows.map(w=>{
    const on=String(w.code)===selected;
    const recorded=currentRecorded&&String(w.code)===currentRecorded;
    return '<button type="button" class="workplace-option '+(on?'selected':'')+'" data-workplace-code="'+String(w.code||'')+'"><span class="workplace-radio">'+(on?'✓':'')+'</span><span class="workplace-info"><b>'+String(w.name||'-')+'</b><small>'+String(w.address||'')+'</small>'+(recorded?'<em>오늘 출근 기록</em>':'')+'</span><span class="workplace-arrow">›</span></button>';
  }).join('');
  root.onclick=e=>{
    const btn=e.target.closest('[data-workplace-code]');
    if(btn&&root.contains(btn))selectWorkplace(btn.dataset.workplaceCode);
  };
}
function openWorkplaceSelector(){
  const note=$('#workplaceNote');
  if(note)note.textContent=state.today?.clockIn?'선택한 근무지로 오늘 근무 기록의 근무장소가 변경됩니다.':'출근 전에 근무지를 선택해 주세요.';
  renderWorkplaces();openSheet('workplaceSheet');
}
async function selectWorkplace(code){
  const w=state.workplaces.find(x=>String(x.code)===String(code))||[{code:'chungju',name:'충주 1공장'},{code:'pangyo',name:'판교사무소'}].find(x=>x.code===code);
  if(!w)return;
  try{
    const result=await api('/api/attendance/workplace-v2',{method:'PUT',body:JSON.stringify({workplaceCode:String(w.code)})});
    state.workplaceCode=String(w.code);state.workplaceName=String(w.name||state.workplaceName);
    localStorage.setItem('namo_workplace_v4_live',state.workplaceCode);
    if(state.today?.clockIn&&result?.workplaceName){
      state.today={...state.today,workplaceCode:result.workplaceCode||w.code,workplaceName:result.workplaceName||w.name,workplaceAddress:result.workplaceAddress||w.address};
    }
    renderWorkplaces();renderHome();renderProfile();
    toast(result?.workplaceName?(result.workplaceName+'으로 근무지를 변경했습니다.'):(state.workplaceName+'으로 근무지를 변경했습니다.'));
    setTimeout(()=>{
      closeSheet('workplaceSheet');
      if($('#detailSheet')?.classList.contains('open')&&state.detailKey)openDetail(state.detailKey);
    },250);
  }catch(e){toast(e.message)}
}
function openMapDetail(r,place){
  let s=$('#mapDetailSheet');
  if(!s){
    s=document.createElement('div');s.id='mapDetailSheet';s.className='sheet';s.setAttribute('aria-hidden','true');
    s.innerHTML='<div class="sheet-panel detail-panel"><header class="detail-header"><button class="detail-back" id="mapDetailBack" aria-label="뒤로">←</button><div>GPS 상세 지도</div><div></div></header><div class="detail-body" id="mapDetailRoot"></div></div>';
    document.body.appendChild(s);
    $('#mapDetailBack').onclick=()=>closeSheet('mapDetailSheet');
    s.addEventListener('click',e=>{if(e.target.id==='mapDetailSheet')closeSheet('mapDetailSheet')});
  }
  const lat=Number(r?.gpsIn?.lat),lng=Number(r?.gpsIn?.lng),acc=gpsAccuracy(r);
  const has=Number.isFinite(lat)&&Number.isFinite(lng);
  let mapHtml='<div class="full-map empty-real-map"><div class="full-map-grid"></div><div class="full-map-label">저장된 GPS 위치 없음</div></div>';
  if(has){
    const dx=0.004,dy=0.0027;
    const bbox=[lng-dx,lat-dy,lng+dx,lat+dy].join(',');
    const mapUrl='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+encodeURIComponent(lat+','+lng);
    const openUrl='https://www.openstreetmap.org/?mlat='+encodeURIComponent(lat)+'&mlon='+encodeURIComponent(lng)+'#map=17/'+encodeURIComponent(lat)+'/'+encodeURIComponent(lng);
    mapHtml='<div class="real-map-wrap"><iframe class="real-map-frame" src="'+mapUrl+'" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="GPS 상세 지도"></iframe><a class="real-map-open" href="'+openUrl+'" target="_blank" rel="noopener">지도에서 크게 보기 ↗</a><div class="real-map-accuracy">정확도 약 '+(acc||'-')+'m</div></div>';
  }
  $('#mapDetailRoot').innerHTML='<div class="detail-date"><strong>'+place+'</strong><span class="detail-status">'+(has?'GPS 기록':'위치 없음')+'</span></div>'+
    mapHtml+
    '<div class="detail-card" style="margin-top:14px">'+
      '<div class="detail-row"><span>⌖</span><span class="k">근무지</span><span class="v">'+place+'</span></div>'+
      '<div class="detail-row"><span>◎</span><span class="k">위도</span><span class="v">'+(has?lat.toFixed(6):'-')+'</span></div>'+
      '<div class="detail-row"><span>◎</span><span class="k">경도</span><span class="v">'+(has?lng.toFixed(6):'-')+'</span></div>'+
      '<div class="detail-row"><span>◷</span><span class="k">정확도</span><span class="v">'+(acc?('약 '+acc+'m'):'-')+'</span></div>'+
    '</div>'+
    '<div class="info-box">'+(has?'출근 시 저장된 실제 GPS 좌표를 지도에 표시합니다.':'저장된 GPS 좌표가 없습니다.')+'</div>';
  openSheet('mapDetailSheet');
}
function openSheet(id){const s=$('#'+id);if(s){s.classList.add('open');s.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}}
function closeSheet(id){const s=$('#'+id);if(s){s.classList.remove('open');s.setAttribute('aria-hidden','true');document.body.style.overflow=''}}
function getGps(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('GPS를 사용할 수 없습니다.'));navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,capturedAt:new Date().toISOString()}),e=>reject(new Error(e.code===1?'위치 권한을 허용해주세요.':'현재 위치를 확인할 수 없습니다.')),{enableHighAccuracy:true,timeout:10000,maximumAge:10000})})}
async function clockIn(){
  try{toast('GPS 위치를 확인하는 중입니다.');const g=await getGps();await api('/api/attendance/clock-in-v2',{method:'POST',body:JSON.stringify({gps:g,device:navigator.userAgent,workplaceCode:state.workplaceCode})});toast('출근 등록이 완료되었습니다.');await loadCore()}catch(e){toast(e.message)}
}
async function clockOut(){
  try{toast('GPS 위치를 확인하는 중입니다.');const g=await getGps();await api('/api/attendance/clock-out-v2',{method:'POST',body:JSON.stringify({gps:g})});toast('퇴근 등록이 완료되었습니다.');await loadCore()}catch(e){toast(e.message)}
}
function openRequest(type){
  $('#requestType').value=type||'annual';const t=todayKey();$('#requestStart').value=t;$('#requestEnd').value=t;$('#requestReason').value='';openSheet('requestSheet');
}
function requestDays(start,end,type){
  if(['am_half','pm_half'].includes(type))return .5;
  if(type==='overtime')return 1;
  const a=new Date(start+'T00:00:00'),b=new Date(end+'T00:00:00');return Math.max(1,Math.floor((b-a)/86400000)+1);
}
async function submitRequest(e){
  e.preventDefault();const type=$('#requestType').value,start=$('#requestStart').value,end=$('#requestEnd').value,reason=$('#requestReason').value.trim();
  if(!start||!end)return toast('날짜를 선택해주세요.');if(end<start)return toast('종료일을 확인해주세요.');
  try{await api('/api/attendance/leave-v2',{method:'POST',body:JSON.stringify({leaveType:type,startDate:start,endDate:end,days:requestDays(start,end,type),reason})});closeSheet('requestSheet');toast('신청이 등록되었습니다.');await loadLeave();renderRequests()}catch(err){toast(err.message)}
}
async function loadNotifications(){
  try{state.notifications=await api('/api/attendance/notifications');const dot=$('#noticeDot');if(dot)dot.style.display=state.notifications.some(n=>!n.read_at)?'block':'none'}catch(_){}
}
function showNotifications(){
  const rows=state.notifications||[];$('#noticeRoot').innerHTML=rows.length?rows.slice(0,20).map(n=>'<div class="request-item"><div class="request-title">'+(n.title||'알림')+'</div><div class="request-meta">'+(n.message||'')+'</div></div>').join(''):'<div class="empty">새 알림이 없습니다.</div>';openSheet('noticeSheet');api('/api/attendance/notifications/read-all',{method:'POST',body:'{}'}).catch(()=>{});const dot=$('#noticeDot');if(dot)dot.style.display='none';
}
async function loadLeave(){try{state.leave=await api('/api/attendance/leave')}catch(_){state.leave={balance:{},requests:[]}}}
async function loadCore(){
  const month=state.recordsMonth||todayKey().slice(0,7);
  const values=await Promise.all([
    api('/api/attendance/me'),
    api('/api/attendance/today-v2').catch(()=>null),
    api('/api/attendance/logs?month='+encodeURIComponent(month)).catch(()=>[]),
    api('/api/attendance/work-schedule').catch(()=>({startTime:'08:00',endTime:'17:00'})),
    api('/api/attendance/workplaces').catch(()=>[])
  ]);
  state.me=values[0];state.today=values[1];state.logs=Array.isArray(values[2])?values[2]:[];state.schedule=values[3]||state.schedule;state.workplaces=Array.isArray(values[4])?values[4]:[];
  const saved=selectedWorkplace();if(saved)state.workplaceName=saved.name||state.workplaceName;
  if(state.today?.workplaceCode&&!localStorage.getItem('namo_workplace_v4_live'))state.workplaceCode=state.today.workplaceCode;
  if(state.today?.workplaceName&&state.today?.clockIn)state.workplaceName=state.today.workplaceName;
  renderHome();renderRecords();renderProfile();
}
async function reloadMonth(){
  state.recordsMonth=$('#recordsMonth').value||todayKey().slice(0,7);
  state.logs=await api('/api/attendance/logs?month='+encodeURIComponent(state.recordsMonth)).catch(()=>[]);
  renderRecords();
}
function bind(){
  $$('.nav-btn').forEach(b=>b.onclick=()=>showView(b.dataset.nav));
  $('#menuBtn').onclick=()=>showView('profile');$('#noticeBtn').onclick=showNotifications;
  $('#detailBack').onclick=()=>closeSheet('detailSheet');$('#noticeClose').onclick=()=>closeSheet('noticeSheet');$('#workplaceClose').onclick=()=>closeSheet('workplaceSheet');$('#requestClose').onclick=()=>closeSheet('requestSheet');
  $('#requestForm').onsubmit=submitRequest;$('#recordsMonth').onchange=reloadMonth;
  ['detailSheet','noticeSheet','workplaceSheet','requestSheet'].forEach(id=>$('#'+id).addEventListener('click',e=>{if(e.target.id===id)closeSheet(id)}));
}
async function init(){
  bind();state.recordsMonth=todayKey().slice(0,7);$('#recordsMonth').value=state.recordsMonth;
  try{await Promise.all([loadCore(),loadLeave(),loadNotifications()]);renderRequests()}catch(e){if(e.status===401){location.replace('/mobile-login.html?mobile=1&next=%2Fattendance.html');return}toast(e.message)}
  clearInterval(state.timer);state.timer=setInterval(()=>{const c=$('#liveClock');if(c)c.textContent=liveClock()},15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();