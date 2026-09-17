(()=>{
'use strict';
if(window.__NAMO_ATTENDANCE_FINAL_POLISH_20260917__)return;
window.__NAMO_ATTENDANCE_FINAL_POLISH_20260917__=true;
const root=document.documentElement;
const IN_SRC='/attendance-card-clockin-20260917.svg?v=20260917-premium2';
const OUT_SRC='/attendance-card-clockout-20260917.svg?v=20260917-premium2';
const SCHEDULE_KEY='namo-attendance-work-schedule-v1';
const DEFAULT_SCHEDULE={start:'08:00',end:'17:00'};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let clockTimer=null,progressTimer=null,queued=false,revealed=false,observer=null,reloadQueued=false;
function validTime(v){return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''))}
function schedule(){
  try{const v=JSON.parse(localStorage.getItem(SCHEDULE_KEY)||'null');if(v&&validTime(v.start)&&validTime(v.end)&&v.end>v.start)return v}catch(_e){}
  return DEFAULT_SCHEDULE;
}
function mins(v){if(!validTime(v))return null;const p=v.split(':').map(Number);return p[0]*60+p[1]}
function injectStyle(){
  if($('#namoAttendanceFinalPolishStyle'))return;
  const style=document.createElement('style');
  style.id='namoAttendanceFinalPolishStyle';
  style.textContent=`
html[data-namo-attendance-full-ui="v4"] body{background:#eef2f6!important;color:#172033!important}
html[data-namo-attendance-full-ui="v4"] .app-shell{background:#f3f6f9!important}
html[data-namo-attendance-full-ui="v4"] .safe-top{background:#0e63c7!important}
html[data-namo-attendance-full-ui="v4"] .topbar{padding:0 12px!important;min-height:0!important;background:linear-gradient(120deg,#0b57b7 0%,#116fda 58%,#1592ea 100%)!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.10)!important;box-shadow:0 5px 18px rgba(18,78,146,.16)!important}
html[data-namo-attendance-full-ui="v4"] .topbar:after{display:none!important;content:none!important}
html[data-namo-attendance-full-ui="v4"] .topbar-row{min-height:66px!important;height:66px!important;padding:0 7px!important;grid-template-columns:40px minmax(0,1fr) 40px!important;gap:6px!important}
html[data-namo-attendance-full-ui="v4"] .brand{gap:9px!important;justify-self:center!important;justify-content:center!important;max-width:310px!important;overflow:visible!important}
html[data-namo-attendance-full-ui="v4"] .brand img{display:block!important;width:58px!important;height:38px!important;max-height:38px!important;flex:0 0 58px!important;object-fit:contain!important;filter:none!important;opacity:1!important}
html[data-namo-attendance-full-ui="v4"] .brand-copy{display:block!important;overflow:visible!important;min-width:0!important}
html[data-namo-attendance-full-ui="v4"] .brand-copy b{display:block!important;font-size:23px!important;line-height:1!important;letter-spacing:-.9px!important;color:#fff!important;font-weight:950!important;white-space:nowrap!important}
html[data-namo-attendance-full-ui="v4"] .brand-copy small{display:none!important}
html[data-namo-attendance-full-ui="v4"] #namoMenuBtn,html[data-namo-attendance-full-ui="v4"] #namoRefreshBtn{width:36px!important;height:36px!important;border-radius:11px!important;background:rgba(255,255,255,.16)!important;color:#fff!important;font-size:25px!important;font-weight:900!important;box-shadow:none!important}
html[data-namo-attendance-full-ui="v4"] .page[data-page="home"]{background:#f3f6f9!important;padding-top:0!important}
html[data-namo-attendance-full-ui="v4"] .namo-panel-title{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;column-gap:14px!important;margin:0 -14px 14px!important;padding:20px 20px!important;min-height:96px!important;background:linear-gradient(135deg,#ffffff 0%,#f8fbff 100%)!important;border-bottom:1px solid #e4eaf0!important;overflow:hidden!important}
html[data-namo-attendance-full-ui="v4"] .namo-panel-title:before,html[data-namo-attendance-full-ui="v4"] .namo-panel-title:after{display:none!important;content:none!important}
html[data-namo-attendance-full-ui="v4"] .namo-panel-title strong{gap:4px!important;line-height:1.12!important}
html[data-namo-attendance-full-ui="v4"] .namo-greet-name{font-size:16px!important;font-weight:700!important;letter-spacing:-.35px!important;color:#758196!important}
html[data-namo-attendance-full-ui="v4"] .namo-greet-main{font-size:24px!important;font-weight:950!important;letter-spacing:-1px!important;color:#172033!important;white-space:nowrap!important}
html[data-namo-attendance-full-ui="v4"] #namoTodayDate{display:flex!important;align-items:center!important;justify-content:flex-end!important;width:130px!important;min-width:130px!important;padding:0!important;border:0!important;color:#172033!important;white-space:normal!important;font-variant-numeric:tabular-nums!important}
html[data-namo-attendance-full-ui="v4"] #namoTodayDate:before{display:none!important;content:none!important}
html[data-namo-attendance-full-ui="v4"] .namo-date-copy{display:flex!important;flex-direction:column!important;align-items:flex-end!important;gap:4px!important;line-height:1.12!important;min-width:0!important}
html[data-namo-attendance-full-ui="v4"] .namo-date-day{font-size:10.5px!important;font-weight:750!important;color:#8a96a8!important;white-space:nowrap!important}
html[data-namo-attendance-full-ui="v4"] .namo-digital-clock{display:block!important;background:transparent!important;border:0!important;box-shadow:none!important;color:#1e4f88!important;font-size:23px!important;line-height:1!important;font-weight:950!important;letter-spacing:-.4px!important;padding:0!important;min-width:0!important;height:auto!important}
html[data-namo-attendance-full-ui="v4"] .namo-today-card{border:1px solid #e7edf3!important;border-radius:20px!important;background:#fff!important;box-shadow:0 8px 24px rgba(28,55,90,.07)!important}
html[data-namo-attendance-full-ui="v4"] .namo-today-meta b{color:#172033!important;font-size:18px!important}
html[data-namo-attendance-full-ui="v4"] #namoScheduleEdit{background:#eef6ff!important;border:1px solid #d6e8fb!important;color:#1768bf!important;border-radius:9px!important;font-weight:900!important}
html[data-namo-attendance-full-ui="v4"] .namo-availability{background:#e8f3ff!important;color:#1768bf!important;border:1px solid #d6e8fb!important;border-radius:10px!important;font-weight:900!important}
html[data-namo-attendance-full-ui="v4"] .namo-request-mini{border:1px solid #dbe4ec!important;border-radius:14px!important;background:#fff!important;color:#415168!important;box-shadow:none!important}
html[data-namo-attendance-full-ui="v4"] .clock-btn{position:relative!important;overflow:hidden!important;background:#fff!important;background-image:none!important;border:1px solid #e3eaf0!important;border-radius:16px!important;outline:0!important;box-shadow:none!important;transform:none!important;filter:none!important;isolation:isolate!important}
html[data-namo-attendance-full-ui="v4"] body .page[data-page="home"] .namo-clock-actions .clock-btn:before,html[data-namo-attendance-full-ui="v4"] body .page[data-page="home"] .namo-clock-actions .clock-btn:after{display:none!important;content:none!important;background:none!important;background-image:none!important;filter:none!important;transform:none!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-photo{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;filter:none!important;transform:none!important;opacity:1!important;image-rendering:auto!important;backface-visibility:visible!important;z-index:1!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-card-label{z-index:5!important;left:9px!important;top:9px!important;padding:6px 8px!important;border-radius:10px!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(28,48,70,.76)!important;box-shadow:none!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-card-title{font-size:15px!important;font-weight:950!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-card-time{font-size:11px!important;font-weight:850!important}
html[data-namo-attendance-full-ui="v4"] .clock-btn.out{border-right:1px solid #e3eaf0!important;outline:0!important;box-shadow:none!important}
html[data-namo-attendance-full-ui="v4"] .progress{height:7px!important;border-radius:999px!important;background:#e7edf3!important;overflow:hidden!important}
html[data-namo-attendance-full-ui="v4"] .progress span,html[data-namo-attendance-full-ui="v4"] #workProgress{width:var(--namo-stable-progress,0%)!important;background:linear-gradient(90deg,#1f7fd6 0%,#24a3cf 100%)!important;border-radius:999px!important;transition:none!important;animation:none!important;will-change:auto!important}
html[data-namo-attendance-full-ui="v4"] .progress-labels{font-size:10px!important;color:#8f9aaa!important;font-variant-numeric:tabular-nums!important}
html[data-namo-attendance-full-ui="v4"] .place-card{border:1px solid #e2e9f0!important;border-radius:16px!important;background:#fff!important;box-shadow:none!important}
html[data-namo-attendance-full-ui="v4"] .place-card .place-icon{background:#edf6ff!important;color:#1768bf!important}
html[data-namo-attendance-full-ui="v4"] .bottom-nav .nav-btn.active{color:#1768bf!important}
html[data-namo-attendance-full-ui="v4"] .bottom-nav .nav-btn.active .ni:after,html[data-namo-attendance-full-ui="v4"] .bottom-nav .nav-btn.active .ni:before{border-color:#1768bf!important}
html[data-namo-reloading="1"] body{overflow:hidden!important}
html[data-namo-reloading="1"] body::after{content:''!important;position:fixed!important;inset:0!important;z-index:2147483647!important;background:#eef2f6!important;display:block!important;opacity:1!important;pointer-events:all!important}
@media(max-width:390px){html[data-namo-attendance-full-ui="v4"] .topbar-row{height:62px!important;min-height:62px!important}html[data-namo-attendance-full-ui="v4"] .brand img{width:52px!important;height:34px!important;flex-basis:52px!important}html[data-namo-attendance-full-ui="v4"] .brand-copy b{font-size:20px!important}html[data-namo-attendance-full-ui="v4"] .namo-panel-title{padding:17px 14px!important;column-gap:8px!important}html[data-namo-attendance-full-ui="v4"] .namo-greet-name{font-size:14px!important}html[data-namo-attendance-full-ui="v4"] .namo-greet-main{font-size:20px!important}html[data-namo-attendance-full-ui="v4"] #namoTodayDate{width:108px!important;min-width:108px!important}html[data-namo-attendance-full-ui="v4"] .namo-date-day{font-size:9px!important}html[data-namo-attendance-full-ui="v4"] .namo-digital-clock{font-size:20px!important}}
`;
  document.head.appendChild(style);
}
function ensureClockImage(btn,src,alt){
  if(!btn)return null;
  let img=btn.querySelector('.namo-clock-photo');
  if(!img){
    img=document.createElement('img');
    img.className='namo-clock-photo';
    img.alt=alt;
    img.decoding='sync';
    img.loading='eager';
    img.fetchPriority='high';
    btn.insertBefore(img,btn.firstChild);
  }
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
  return img;
}
function patchImages(){
  const a=ensureClockImage($('#clockInBtn'),IN_SRC,'출근');
  const b=ensureClockImage($('#clockOutBtn'),OUT_SRC,'퇴근');
  return [a,b].filter(Boolean);
}
function ensureDigitalClock(){
  const holder=$('#namoTodayDate');
  if(!holder)return false;
  if(!holder.querySelector('.namo-digital-clock')){
    holder.textContent='';
    const copy=document.createElement('span');copy.className='namo-date-copy';
    const date=document.createElement('span');date.className='namo-date-day';
    const digital=document.createElement('span');digital.className='namo-digital-clock';
    copy.append(date,digital);holder.append(copy);
  }
  updateDigitalClock();return true;
}
function updateDigitalClock(){
  const holder=$('#namoTodayDate');if(!holder)return;
  if(!holder.querySelector('.namo-digital-clock')){ensureDigitalClock();return}
  const now=new Date(),days=['일','월','화','수','목','금','토'];
  const hh=String(now.getHours()).padStart(2,'0'),mm=String(now.getMinutes()).padStart(2,'0');
  const digital=holder.querySelector('.namo-digital-clock'),date=holder.querySelector('.namo-date-day');
  const nextTime=`${hh}:${mm}`;
  const nextDate=`${now.getFullYear()}. ${String(now.getMonth()+1).padStart(2,'0')}. ${String(now.getDate()).padStart(2,'0')} (${days[now.getDay()]})`;
  if(digital&&digital.textContent!==nextTime)digital.textContent=nextTime;
  if(date&&date.textContent!==nextDate)date.textContent=nextDate;
}
function updateStableProgress(){
  const s=schedule();
  const labels=$$('.page[data-page="home"] .progress-labels span');
  if(labels[0]&&labels[0].textContent!==s.start)labels[0].textContent=s.start;
  if(labels[1]&&labels[1].textContent!==s.end)labels[1].textContent=s.end;
  const a=mins(s.start),b=mins(s.end);if(a==null||b==null||b<=a)return;
  const now=new Date(),cur=now.getHours()*60+now.getMinutes();
  const pct=Math.max(0,Math.min(100,((cur-a)/(b-a))*100));
  root.style.setProperty('--namo-stable-progress',pct.toFixed(2)+'%');
}
function patch(){
  injectStyle();
  const images=patchImages();
  ensureDigitalClock();
  updateStableProgress();
  return Boolean($('.namo-panel-title')&&$('#clockInBtn')&&$('#clockOutBtn')&&images.length===2);
}
function reveal(){
  if(revealed)return;revealed=true;
  root.setAttribute('data-namo-final-ready','1');
  root.setAttribute('data-attendance-boot','ready');
  if(observer){observer.disconnect();observer=null;}
}
function waitImages(images){
  const waits=images.map(img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise(resolve=>{const done=()=>resolve();img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});setTimeout(done,900)}));
  return Promise.all(waits);
}
function run(){
  queued=false;
  const ready=patch();
  if(ready&&!revealed)waitImages(patchImages()).then(()=>requestAnimationFrame(()=>requestAnimationFrame(reveal)));
}
function requestPatch(){if(queued||revealed)return;queued=true;requestAnimationFrame(run)}
function showReloadShield(){root.setAttribute('data-namo-reloading','1')}
function reloadWithoutFlash(){
  if(reloadQueued)return;
  reloadQueued=true;
  showReloadShield();
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>location.reload(),30)));
}
document.addEventListener('keydown',e=>{
  const key=String(e.key||'').toLowerCase();
  const isF5=key==='f5'||e.keyCode===116;
  const isShortcut=(e.ctrlKey||e.metaKey)&&key==='r';
  if(!isF5&&!isShortcut)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  reloadWithoutFlash();
},true);
window.addEventListener('beforeunload',showReloadShield,{capture:true});
window.addEventListener('pagehide',showReloadShield,{capture:true});
observer=new MutationObserver(requestPatch);
observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
clockTimer=setInterval(updateDigitalClock,15000);
progressTimer=setInterval(updateStableProgress,60000);
window.addEventListener('pageshow',()=>{root.removeAttribute('data-namo-reloading');reloadQueued=false;if(!revealed)requestPatch();else{updateDigitalClock();updateStableProgress()}});
setTimeout(()=>{if(!revealed){patch();reveal()}},2600);
})();