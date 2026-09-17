(()=>{
'use strict';
if(window.__NAMO_ATTENDANCE_FINAL_POLISH_20260917__)return;
window.__NAMO_ATTENDANCE_FINAL_POLISH_20260917__=true;
const root=document.documentElement;
const IN_SRC='/attendance-card-clockin-20260917.svg?v=20260917-final4';
const OUT_SRC='/attendance-card-clockout-20260917.svg?v=20260917-final4';
const $=(s,r=document)=>r.querySelector(s);
let clockTimer=null,queued=false,revealed=false;
function injectStyle(){
  if($('#namoAttendanceFinalPolishStyle'))return;
  const style=document.createElement('style');
  style.id='namoAttendanceFinalPolishStyle';
  style.textContent=`
html[data-namo-attendance-full-ui="v4"] .topbar{padding:0 12px!important;min-height:0!important;background:linear-gradient(125deg,#0750ad 0%,#0763ce 55%,#0b8bea 100%)!important;box-shadow:0 7px 20px rgba(7,72,155,.16)!important}
html[data-namo-attendance-full-ui="v4"] .topbar:after{right:42px!important;top:-22px!important;width:72px!important;height:102px!important;opacity:.72!important}
html[data-namo-attendance-full-ui="v4"] .topbar-row{min-height:74px!important;height:74px!important;padding:0 6px!important;grid-template-columns:42px minmax(0,1fr) 42px!important;gap:5px!important}
html[data-namo-attendance-full-ui="v4"] .brand{gap:9px!important;justify-self:center!important;justify-content:center!important;max-width:290px!important;overflow:visible!important}
html[data-namo-attendance-full-ui="v4"] .brand img{display:block!important;width:72px!important;height:44px!important;max-height:44px!important;flex:0 0 72px!important;object-fit:contain!important;filter:brightness(0) invert(1)!important;opacity:1!important}
html[data-namo-attendance-full-ui="v4"] .brand-copy{display:block!important;overflow:visible!important;min-width:0!important}
html[data-namo-attendance-full-ui="v4"] .brand-copy b{display:block!important;font-size:23px!important;line-height:1!important;letter-spacing:-.85px!important;color:#fff!important;font-weight:900!important;white-space:nowrap!important}
html[data-namo-attendance-full-ui="v4"] .brand-copy small{display:none!important}
html[data-namo-attendance-full-ui="v4"] #namoMenuBtn,html[data-namo-attendance-full-ui="v4"] #namoRefreshBtn{width:38px!important;height:38px!important;font-size:27px!important;color:#fff!important}
html[data-namo-attendance-full-ui="v4"] .namo-panel-title{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;column-gap:14px!important;margin:0 -14px 14px!important;padding:18px 18px!important;min-height:102px!important;background:linear-gradient(135deg,#fff 0%,#f4f9ff 70%,#eaf4ff 100%)!important;overflow:hidden!important}
html[data-namo-attendance-full-ui="v4"] .namo-panel-title:after{content:none!important;display:none!important}
html[data-namo-attendance-full-ui="v4"] .namo-panel-title strong{gap:5px!important;line-height:1.12!important}
html[data-namo-attendance-full-ui="v4"] .namo-greet-name{font-size:20px!important;font-weight:800!important;letter-spacing:-.45px!important;color:#31415b!important}
html[data-namo-attendance-full-ui="v4"] .namo-greet-main{font-size:27px!important;font-weight:950!important;letter-spacing:-1.15px!important;color:#101c36!important;white-space:nowrap!important}
html[data-namo-attendance-full-ui="v4"] #namoTodayDate{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;width:154px!important;min-width:154px!important;padding:10px 0 10px 14px!important;border-left:1px solid #cbd9e8!important;color:#263a5b!important;white-space:normal!important;font-variant-numeric:tabular-nums!important}
html[data-namo-attendance-full-ui="v4"] #namoTodayDate:before{display:none!important;content:none!important}
html[data-namo-attendance-full-ui="v4"] .namo-analog-clock{position:relative!important;width:27px!important;height:27px!important;flex:0 0 27px!important;border:2px solid #1386eb!important;border-radius:50%!important;background:#fff!important;box-sizing:border-box!important}
html[data-namo-attendance-full-ui="v4"] .namo-analog-clock:after{content:''!important;position:absolute!important;left:50%!important;top:50%!important;width:4px!important;height:4px!important;border-radius:50%!important;background:#1386eb!important;transform:translate(-50%,-50%)!important;z-index:4!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-hand{position:absolute!important;left:50%!important;bottom:50%!important;transform-origin:50% 100%!important;border-radius:4px!important;background:#1386eb!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-hand.hour{width:2px!important;height:7px!important;margin-left:-1px!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-hand.minute{width:2px!important;height:9px!important;margin-left:-1px!important;background:#0f5cb9!important}
html[data-namo-attendance-full-ui="v4"] .namo-date-copy{display:flex!important;flex-direction:column!important;gap:2px!important;line-height:1.18!important;min-width:0!important}
html[data-namo-attendance-full-ui="v4"] .namo-date-day{font-size:11px!important;font-weight:850!important;color:#2b3f5d!important;white-space:nowrap!important}
html[data-namo-attendance-full-ui="v4"] .namo-date-time{font-size:15px!important;font-weight:950!important;color:#0f69c7!important;letter-spacing:.15px!important}
html[data-namo-attendance-full-ui="v4"] .clock-btn{position:relative!important;overflow:hidden!important;background:#fff!important;background-image:none!important;border:0!important;box-shadow:none!important;transform:none!important;filter:none!important;isolation:isolate!important}
html[data-namo-attendance-full-ui="v4"] .clock-btn:before,html[data-namo-attendance-full-ui="v4"] .clock-btn:after{display:none!important;content:none!important;background:none!important;background-image:none!important;filter:none!important;transform:none!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-photo{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;filter:none!important;transform:none!important;opacity:1!important;image-rendering:auto!important;backface-visibility:visible!important;z-index:1!important}
html[data-namo-attendance-full-ui="v4"] .namo-clock-card-label{z-index:5!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(31,60,91,.72)!important;box-shadow:none!important}
html[data-namo-attendance-full-ui="v4"] .clock-btn.out{border-right:0!important;outline:0!important;box-shadow:none!important}
html[data-namo-attendance-full-ui="v4"] .progress,html[data-namo-attendance-full-ui="v4"] .progress span,html[data-namo-attendance-full-ui="v4"] #workProgress{transition:none!important;animation:none!important}
@media(max-width:390px){html[data-namo-attendance-full-ui="v4"] .topbar-row{height:70px!important;min-height:70px!important}html[data-namo-attendance-full-ui="v4"] .brand img{width:64px!important;height:40px!important;flex-basis:64px!important}html[data-namo-attendance-full-ui="v4"] .brand-copy b{font-size:20px!important}html[data-namo-attendance-full-ui="v4"] .namo-panel-title{padding:16px 14px!important;column-gap:8px!important}html[data-namo-attendance-full-ui="v4"] .namo-greet-name{font-size:18px!important}html[data-namo-attendance-full-ui="v4"] .namo-greet-main{font-size:23px!important}html[data-namo-attendance-full-ui="v4"] #namoTodayDate{width:132px!important;min-width:132px!important;padding-left:9px!important;gap:6px!important}html[data-namo-attendance-full-ui="v4"] .namo-analog-clock{width:24px!important;height:24px!important;flex-basis:24px!important}html[data-namo-attendance-full-ui="v4"] .namo-date-day{font-size:9.5px!important}html[data-namo-attendance-full-ui="v4"] .namo-date-time{font-size:13px!important}}
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
function ensureDateClock(){
  const holder=$('#namoTodayDate');
  if(!holder)return false;
  if(!holder.querySelector('.namo-analog-clock')){
    holder.textContent='';
    const analog=document.createElement('span');analog.className='namo-analog-clock';
    const hour=document.createElement('i');hour.className='namo-clock-hand hour';
    const minute=document.createElement('i');minute.className='namo-clock-hand minute';
    analog.append(hour,minute);
    const copy=document.createElement('span');copy.className='namo-date-copy';
    const date=document.createElement('span');date.className='namo-date-day';
    const time=document.createElement('span');time.className='namo-date-time';
    copy.append(date,time);holder.append(analog,copy);
  }
  updateDateClock();return true;
}
function updateDateClock(){
  const holder=$('#namoTodayDate');if(!holder)return;
  if(!holder.querySelector('.namo-analog-clock')){ensureDateClock();return}
  const now=new Date(),days=['일','월','화','수','목','금','토'];
  const hh=String(now.getHours()).padStart(2,'0'),mm=String(now.getMinutes()).padStart(2,'0');
  const date=holder.querySelector('.namo-date-day'),time=holder.querySelector('.namo-date-time');
  if(date)date.textContent=`${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
  if(time)time.textContent=`${hh}:${mm}`;
  const h=holder.querySelector('.namo-clock-hand.hour'),m=holder.querySelector('.namo-clock-hand.minute');
  const hourDeg=(now.getHours()%12)*30+now.getMinutes()*.5,minuteDeg=now.getMinutes()*6;
  if(h)h.style.transform=`rotate(${hourDeg}deg)`;
  if(m)m.style.transform=`rotate(${minuteDeg}deg)`;
}
function patch(){
  injectStyle();
  const images=patchImages();
  ensureDateClock();
  return Boolean($('.namo-panel-title')&&$('#clockInBtn')&&$('#clockOutBtn')&&images.length===2);
}
function reveal(){
  if(revealed)return;revealed=true;
  root.setAttribute('data-namo-final-ready','1');
  root.setAttribute('data-attendance-boot','ready');
}
function waitImages(images){
  const waits=images.map(img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise(resolve=>{const done=()=>resolve();img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});setTimeout(done,900)}));
  return Promise.all(waits);
}
function run(){
  queued=false;
  const ready=patch();
  if(ready&&!revealed)waitImages(patchImages()).then(()=>requestAnimationFrame(reveal));
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
clockTimer=setInterval(updateDateClock,30000);
window.addEventListener('pageshow',schedule);
setTimeout(()=>{patch();reveal()},2600);
})();