(()=>{
'use strict';
if(window.__NAMO_CORPORATE_ATTENDANCE_HOME_20260917__)return;
window.__NAMO_CORPORATE_ATTENDANCE_HOME_20260917__=true;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const pad=n=>String(n).padStart(2,'0');
const root=document.documentElement;
let todayState=null;
let weekTimer=null;
let clockTimer=null;
let syncTimer=null;

function svgClock(){return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="5"/><path d="M32 18v16l11 7" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
function svgOut(){return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M49 22A21 21 0 1 0 51 40" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M48 12v13H35" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 20v14l10 5" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
function navIcon(kind){
  const map={home:'<path d="M8 27 32 8l24 19v27H39V38H25v16H8z" fill="currentColor"/>',records:'<circle cx="32" cy="32" r="23" fill="none" stroke="currentColor" stroke-width="5"/><path d="M32 17v17l12 7" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',requests:'<rect x="15" y="10" width="34" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="5"/><path d="M23 22h18M23 32h18M23 42h13" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',more:'<circle cx="32" cy="22" r="10" fill="none" stroke="currentColor" stroke-width="5"/><path d="M13 55c2-13 9-19 19-19s17 6 19 19" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>'};
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${map[kind]||map.home}</svg>`;
}
function injectStyle(){
  if($('#namoCorporateAttendanceStyle'))return;
  const s=document.createElement('style');
  s.id='namoCorporateAttendanceStyle';
  s.textContent=`
html[data-namo-corporate-home="1"] body{background:#edf3f8!important;color:#0f1d3b!important}
html[data-namo-corporate-home="1"] .app-shell{max-width:430px!important;margin:0 auto!important;background:#edf3f8!important;min-height:100vh!important;box-shadow:0 0 32px rgba(37,71,108,.08)!important}
html[data-namo-corporate-home="1"] .safe-top{background:#1264c8!important}
html[data-namo-corporate-home="1"] .topbar{position:relative!important;z-index:30!important;background:linear-gradient(115deg,#0b57b7 0%,#1376dc 62%,#1694ed 100%)!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important}
html[data-namo-corporate-home="1"] .topbar:after{display:none!important;content:none!important}
html[data-namo-corporate-home="1"] .topbar-row{height:74px!important;min-height:74px!important;padding:0 16px!important;display:grid!important;grid-template-columns:44px 1fr 44px!important;align-items:center!important;gap:8px!important}
html[data-namo-corporate-home="1"] .brand{display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;min-width:0!important}
html[data-namo-corporate-home="1"] .brand img{width:64px!important;height:40px!important;flex:0 0 64px!important;object-fit:contain!important;filter:none!important}
html[data-namo-corporate-home="1"] .brand-copy{display:block!important;min-width:0!important}
html[data-namo-corporate-home="1"] .brand-copy b{display:block!important;color:#fff!important;font-size:22px!important;line-height:1!important;font-weight:950!important;letter-spacing:-.9px!important;white-space:nowrap!important}
html[data-namo-corporate-home="1"] .brand-copy small{display:none!important}
html[data-namo-corporate-home="1"] #namoMenuBtn,html[data-namo-corporate-home="1"] #noticeBtn{display:grid!important;place-items:center!important;width:40px!important;height:40px!important;border:0!important;border-radius:12px!important;background:rgba(255,255,255,.16)!important;color:#fff!important;font-size:25px!important;box-shadow:none!important;padding:0!important}
html[data-namo-corporate-home="1"] #namoRefreshBtn{display:none!important}
html[data-namo-corporate-home="1"] main{padding:0 0 86px!important;background:#edf3f8!important}
html[data-namo-corporate-home="1"] .page[data-page="home"]{padding:0 14px 18px!important;background:#edf3f8!important}
html[data-namo-corporate-home="1"] .page[data-page="home"]>*:not(#namoCorporateHome){display:none!important}
html[data-namo-corporate-home="1"] .app-shell>.bottom-nav{display:none!important}
#namoCorporateHome{display:block!important;margin:0!important;padding:0!important}
.namo-corp-hello{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;margin:0 -14px 14px;padding:18px 18px;background:#fff;border-bottom:1px solid #e5ebf2}
.namo-corp-name{font-size:18px;font-weight:950;letter-spacing:-.55px;color:#111c36}
.namo-corp-sub{margin-top:5px;font-size:13px;font-weight:650;color:#607088}
.namo-corp-datetime{text-align:right;padding-left:14px;border-left:1px solid #dbe4ee;font-variant-numeric:tabular-nums}
.namo-corp-date{font-size:11px;font-weight:800;color:#65748a;white-space:nowrap}
.namo-corp-time{margin-top:3px;font-size:24px;font-weight:950;letter-spacing:-.6px;color:#101b35;white-space:nowrap}
.namo-corp-card{background:#fff;border:1px solid #e3eaf1;border-radius:20px;box-shadow:0 7px 22px rgba(33,67,102,.055);overflow:hidden;margin-bottom:12px}
.namo-corp-status{padding:18px 16px 14px;text-align:center;background:linear-gradient(180deg,#f8fbfe 0%,#eef4f8 100%);font-size:21px;font-weight:950;letter-spacing:-.7px;color:#102040}
.namo-corp-clock-actions{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px 28px 20px}
.namo-corp-clock{border:0;border-radius:22px;min-height:146px;background:linear-gradient(150deg,#1678ef 0%,#2688f4 100%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;font:inherit;box-shadow:0 8px 18px rgba(31,116,223,.15);cursor:pointer}
.namo-corp-clock svg{width:56px;height:56px;color:#fff}
.namo-corp-clock strong{font-size:23px;font-weight:950;letter-spacing:-.8px}
.namo-corp-clock[disabled]{opacity:.48!important;cursor:not-allowed!important;filter:none!important}
.namo-corp-gps{padding:15px}
.namo-corp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.namo-corp-title{font-size:18px;font-weight:950;letter-spacing:-.55px;color:#12203d}
.namo-corp-desc{margin-top:4px;font-size:10.5px;line-height:1.45;color:#748196}
.namo-corp-mode{font-size:11px;font-weight:900;color:#1774d6;white-space:nowrap;padding-top:3px}
.namo-corp-workplace-line{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:11px 12px;border:1px solid #e2e9f1;border-radius:14px;background:#f9fbfd}
.namo-corp-workplace-name{font-size:15px;font-weight:950;color:#12203d}
.namo-corp-workplace-address{margin-top:3px;font-size:10px;color:#7d899a;line-height:1.35}
.namo-corp-location-actions{display:flex;gap:7px;flex:0 0 auto}
.namo-corp-mini-btn{height:34px;padding:0 10px;border:1px solid #cfe0f4;border-radius:10px;background:#fff;color:#146cc7;font-size:10.5px;font-weight:900;white-space:nowrap;cursor:pointer}
.namo-corp-mini-btn.primary{background:#e9f4ff}
.namo-corp-map{position:relative;overflow:hidden;border:1px solid #dbe6ef;border-radius:15px;background:#eef4f8;aspect-ratio:720/300}
.namo-corp-map img{display:block;width:100%;height:100%;object-fit:cover}
.namo-corp-gps-status{display:flex;justify-content:space-between;gap:10px;margin-top:9px;font-size:10px;color:#718096}
.namo-corp-gps-status strong{color:#1672d2;font-size:10.5px}
.namo-corp-week{padding:0}
.namo-corp-week-head{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;border-bottom:1px solid #e6ecf2}
.namo-corp-week-head strong{font-size:18px;font-weight:950;color:#12203d}
.namo-corp-week-total{font-size:12px;font-weight:900;color:#65748a;white-space:nowrap}
.namo-corp-week-grid{display:grid;grid-template-columns:repeat(6,1fr)}
.namo-corp-day{min-height:106px;padding:10px 3px 8px;border-right:1px solid #e8edf3;text-align:center;background:#fff;box-sizing:border-box}
.namo-corp-day:last-child{border-right:0}
.namo-corp-day.today{background:#eef6ff}
.namo-corp-day-name{font-size:11px;font-weight:900;color:#5e6f84}
.namo-corp-day-date{margin-top:3px;font-size:9px;color:#8794a5}
.namo-corp-day-in{margin-top:12px;font-size:12px;font-weight:950;color:#17223a}
.namo-corp-day-out{margin-top:3px;font-size:11px;color:#728096}
.namo-corp-day-status{margin-top:7px;font-size:10px;font-weight:900;color:#1971d2}
.namo-corp-day-status.muted{color:#9aa5b2}
#namoCorporateBottomNav{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:800;width:min(430px,100vw);display:grid;grid-template-columns:repeat(4,1fr);background:rgba(255,255,255,.98);border-top:1px solid #dfe6ee;box-shadow:0 -6px 20px rgba(34,64,94,.07);padding:7px 5px calc(7px + env(safe-area-inset-bottom));box-sizing:border-box}
.namo-corp-nav{border:0;background:transparent;color:#66778d;display:flex;flex-direction:column;align-items:center;gap:3px;padding:3px 0;font:inherit;cursor:pointer}
.namo-corp-nav svg{width:24px;height:24px}
.namo-corp-nav span{font-size:10px;font-weight:850;white-space:nowrap}
.namo-corp-nav.active{color:#1477df}
html[data-namo-corporate-home="1"] .overlay{z-index:1800!important}
@media(max-width:380px){html[data-namo-corporate-home="1"] .brand img{width:54px!important;height:36px!important;flex-basis:54px!important}html[data-namo-corporate-home="1"] .brand-copy b{font-size:19px!important}.namo-corp-clock-actions{gap:12px;padding-left:20px;padding-right:20px}.namo-corp-clock{min-height:132px}.namo-corp-clock strong{font-size:20px}.namo-corp-workplace-line{display:block}.namo-corp-location-actions{margin-top:9px}.namo-corp-week-grid{font-size:90%}}
`;
  document.head.appendChild(s);
}
function ensureHeader(){
  const row=$('.topbar-row');if(!row)return;
  if(!$('#namoMenuBtn')){const b=document.createElement('button');b.id='namoMenuBtn';b.type='button';b.textContent='☰';b.setAttribute('aria-label','메뉴');row.insertBefore(b,row.firstChild);b.onclick=()=>document.querySelector('.bottom-nav .nav-btn[data-page-target="more"]')?.click()}
  const n=$('#noticeBtn');if(n){n.textContent='🔔';n.setAttribute('aria-label','알림')}
}
function build(){
  const home=$('.page[data-page="home"]');const shell=$('.app-shell');if(!home||!shell)return false;
  injectStyle();ensureHeader();
  if(!$('#namoCorporateHome')){
    const wrap=document.createElement('div');wrap.id='namoCorporateHome';
    wrap.innerHTML=`
      <section class="namo-corp-hello"><div><div class="namo-corp-name" id="namoCorpName">사용자님,</div><div class="namo-corp-sub">오늘도 좋은 하루 되세요!</div></div><div class="namo-corp-datetime"><div class="namo-corp-date" id="namoCorpDate"></div><div class="namo-corp-time" id="namoCorpTime"></div></div></section>
      <section class="namo-corp-card"><div class="namo-corp-status" id="namoCorpStatus">근무 상태 확인 중입니다.</div><div class="namo-corp-clock-actions"><button type="button" class="namo-corp-clock" id="namoCorpClockIn">${svgClock()}<strong>출근</strong></button><button type="button" class="namo-corp-clock" id="namoCorpClockOut">${svgOut()}<strong>퇴근</strong></button></div></section>
      <section class="namo-corp-card namo-corp-gps"><div class="namo-corp-head"><div><div class="namo-corp-title">📍 근무지 위치</div><div class="namo-corp-desc">지정된 근무지 범위 안에서 GPS 위치를 확인해 출퇴근합니다.</div></div><div class="namo-corp-mode">출퇴근 방식 · GPS</div></div><div class="namo-corp-workplace-line"><div><div class="namo-corp-workplace-name" id="namoCorpWorkplace">충주 1공장</div><div class="namo-corp-workplace-address" id="namoCorpAddress">충청북도 주덕읍 중원산업로 309</div></div><div class="namo-corp-location-actions"><button type="button" class="namo-corp-mini-btn" id="namoCorpChangeWorkplace">근무지 변경</button><button type="button" class="namo-corp-mini-btn primary" id="namoCorpGpsCheck">내 위치 확인</button></div></div><div class="namo-corp-map"><img src="/attendance-enterprise-map-20260909.svg?v=20260917-corp1" alt="근무지 GPS 지도"></div><div class="namo-corp-gps-status"><span id="namoCorpGpsStatus">GPS 위치 확인 전</span><strong id="namoCorpGpsWorkplace">충주 1공장</strong></div></section>
      <section class="namo-corp-card namo-corp-week"><div class="namo-corp-week-head"><strong>이번 주 근무</strong><span class="namo-corp-week-total" id="namoCorpWeekTotal">-</span></div><div class="namo-corp-week-grid" id="namoCorpWeekGrid"></div></section>`;
    home.insertBefore(wrap,home.firstChild);
  }
  if(!$('#namoCorporateBottomNav')){
    const nav=document.createElement('nav');nav.id='namoCorporateBottomNav';
    nav.innerHTML=`<button class="namo-corp-nav active" data-corp-page="home">${navIcon('home')}<span>홈</span></button><button class="namo-corp-nav" data-corp-page="records">${navIcon('records')}<span>출퇴근기록</span></button><button class="namo-corp-nav" data-corp-page="requests">${navIcon('requests')}<span>근태신청</span></button><button class="namo-corp-nav" data-corp-page="more">${navIcon('more')}<span>마이페이지</span></button>`;
    shell.appendChild(nav);
  }
  bind();
  root.setAttribute('data-namo-corporate-home','1');
  return true;
}
function bind(){
  const cin=$('#namoCorpClockIn'),cout=$('#namoCorpClockOut');
  if(cin&&!cin.dataset.bound){cin.dataset.bound='1';cin.onclick=()=>{$('#clockInBtn')?.click();setTimeout(refreshToday,600);setTimeout(refreshToday,1800)}}
  if(cout&&!cout.dataset.bound){cout.dataset.bound='1';cout.onclick=()=>{$('#clockOutBtn')?.click();setTimeout(refreshToday,600);setTimeout(refreshToday,1800)}}
  const change=$('#namoCorpChangeWorkplace');if(change&&!change.dataset.bound){change.dataset.bound='1';change.onclick=()=>{const ov=$('#workplaceOverlay');if(ov)ov.classList.add('open')}}
  const gps=$('#namoCorpGpsCheck');if(gps&&!gps.dataset.bound){gps.dataset.bound='1';gps.onclick=checkGps}
  $$('.workplace-choice').forEach(b=>{if(!b.dataset.corpBound){b.dataset.corpBound='1';b.addEventListener('click',()=>setTimeout(syncWorkplace,60))}});
  $$('#namoCorporateBottomNav [data-corp-page]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=()=>{const page=b.dataset.corpPage;const target=document.querySelector(`.bottom-nav .nav-btn[data-page-target="${page}"]`);if(target)target.click();else{$$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page))}syncNav()}})
}
function updateClock(){
  const d=new Date(),days=['일','월','화','수','목','금','토'];
  const date=$('#namoCorpDate'),time=$('#namoCorpTime');
  if(date)date.textContent=`${d.getFullYear()}. ${pad(d.getMonth()+1)}. ${pad(d.getDate())} (${days[d.getDay()]})`;
  let h=d.getHours(),ampm=h>=12?'PM':'AM';h=h%12||12;
  if(time)time.textContent=`${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}
async function json(url){try{const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;const j=await r.json();return j&&typeof j==='object'&&'data'in j?j.data:j}catch(_e){return null}}
function fmtTime(v){if(!v)return'-';const d=new Date(v);if(Number.isNaN(d.getTime()))return'-';return`${pad(d.getHours())}:${pad(d.getMinutes())}`}
async function refreshMe(){
  const me=await json('/api/attendance/me');
  const u=me?.user||me||{};const name=String(u.name||u.userName||u.username||'').trim();
  if(name&&$('#namoCorpName'))$('#namoCorpName').textContent=`${name}님,`;
  else{const base=$('.greeting .name')?.textContent;if(base&&$('#namoCorpName'))$('#namoCorpName').textContent=base}
}
async function refreshToday(){
  const t=await json('/api/attendance/today-v2')||await json('/api/attendance/today');if(t)todayState=t;
  const c=todayState||{};const status=$('#namoCorpStatus');
  if(status)status.textContent=!c.clockIn?'출근 전입니다.':!c.clockOut?'출근 중 입니다.':'퇴근 완료되었습니다.';
  const cin=$('#namoCorpClockIn'),cout=$('#namoCorpClockOut');
  if(cin)cin.disabled=!!c.clockIn;
  if(cout)cout.disabled=!c.clockIn||!!c.clockOut;
  syncWorkplace();
}
function syncWorkplace(){
  const name=(todayState?.workplaceName||$('#workplaceName')?.textContent||'충주 1공장').trim();
  const addr=(todayState?.workplaceAddress||$('#placeDetail')?.textContent||'').trim();
  if($('#namoCorpWorkplace'))$('#namoCorpWorkplace').textContent=name;
  if($('#namoCorpGpsWorkplace'))$('#namoCorpGpsWorkplace').textContent=name;
  if($('#namoCorpAddress'))$('#namoCorpAddress').textContent=addr||'근무지 주소 확인 중';
}
function checkGps(){
  const out=$('#namoCorpGpsStatus');if(!navigator.geolocation){if(out)out.textContent='GPS를 사용할 수 없습니다.';return}
  if(out)out.textContent='현재 위치를 확인하는 중입니다...';
  navigator.geolocation.getCurrentPosition(p=>{if(out)out.textContent=`위치 확인 완료 · 정확도 약 ${Math.round(p.coords.accuracy||0)}m`;},e=>{if(out)out.textContent=e.code===1?'위치 권한을 허용해 주세요.':'현재 위치를 확인하지 못했습니다.';},{enableHighAccuracy:true,timeout:10000,maximumAge:10000});
}
function localDateKey(d){return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function minutesBetween(a,b){if(!a||!b)return 0;const x=new Date(a),y=new Date(b);if(Number.isNaN(x.getTime())||Number.isNaN(y.getTime()))return 0;return Math.max(0,Math.round((y-x)/60000))}
function durationText(min){const h=Math.floor(min/60),m=min%60;if(h&&m)return`${h}h ${m}m`;if(h)return`${h}h`;return`${m}m`}
function readSchedule(){try{const v=JSON.parse(localStorage.getItem('namo-attendance-work-schedule-v1')||'null');if(v?.start&&v?.end)return v}catch(_e){}return{start:'08:00',end:'17:00'}}
async function refreshWeek(){
  const now=new Date();const month=`${now.getFullYear()}-${pad(now.getMonth()+1)}`;const rows=await json(`/api/attendance/logs?month=${encodeURIComponent(month)}`)||[];
  const map=new Map((Array.isArray(rows)?rows:[]).map(r=>[String(r.workDate||'').slice(0,10),r]));
  const monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(now.getDate()-((now.getDay()+6)%7));
  const schedule=readSchedule();let total=0;const cells=[];
  for(let i=0;i<6;i++){
    const d=new Date(monday);d.setDate(monday.getDate()+i);const key=localDateKey(d),r=map.get(key),isToday=key===localDateKey(now),future=d>now;
    let inText='-',outText='-',status='-',muted=true;
    if(r?.clockIn){inText=fmtTime(r.clockIn);outText=r.clockOut?fmtTime(r.clockOut):'-';const end=r.clockOut||((isToday)?new Date().toISOString():null);const mins=end?minutesBetween(r.clockIn,end):0;total+=mins;status=r.clockOut?durationText(mins):'근무 중';muted=false}
    else if(future||isToday){inText=i<5?schedule.start:'-';outText=i<5?schedule.end:'-';status='예정';muted=true}
    cells.push(`<div class="namo-corp-day${isToday?' today':''}"><div class="namo-corp-day-name">${['월','화','수','목','금','토'][i]}</div><div class="namo-corp-day-date">${d.getMonth()+1}/${d.getDate()}</div><div class="namo-corp-day-in">${inText}</div><div class="namo-corp-day-out">${outText}</div><div class="namo-corp-day-status${muted?' muted':''}">${status}</div></div>`)
  }
  if($('#namoCorpWeekGrid'))$('#namoCorpWeekGrid').innerHTML=cells.join('');
  if($('#namoCorpWeekTotal'))$('#namoCorpWeekTotal').textContent=total?durationText(total):'-';
}
function syncNav(){
  const active=$('.page.active')?.dataset.page||'home';
  $$('#namoCorporateBottomNav .namo-corp-nav').forEach(b=>b.classList.toggle('active',b.dataset.corpPage===active));
}
function reveal(){
  root.setAttribute('data-namo-corp-ready','1');
  root.setAttribute('data-namo-final-ready','1');
  root.setAttribute('data-attendance-boot','ready');
}
async function init(){
  let tries=0;while(!build()&&tries<40){await new Promise(r=>setTimeout(r,50));tries++}
  if(!$('#namoCorporateHome')){reveal();return}
  updateClock();syncWorkplace();syncNav();
  await Promise.all([refreshMe(),refreshToday(),refreshWeek()]);
  bind();syncNav();reveal();
  clockTimer=setInterval(updateClock,15000);
  weekTimer=setInterval(()=>{refreshToday();refreshWeek()},60000);
  syncTimer=setInterval(()=>{syncWorkplace();syncNav();bind()},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
setTimeout(reveal,4000);
})();
