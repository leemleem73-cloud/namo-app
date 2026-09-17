(()=>{
'use strict';
if(window.__NAMO_ATTENDANCE_WEEK_FOOTER_HIDE_20260917__)return;
window.__NAMO_ATTENDANCE_WEEK_FOOTER_HIDE_20260917__=true;
let queued=false;
function apply(){
  queued=false;
  document.querySelectorAll('.namo-week-total > span').forEach(el=>{
    if((el.textContent||'').trim()==='주간 근무 현황'){
      el.textContent='';
      el.style.display='none';
    }
  });
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(apply);
}
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
