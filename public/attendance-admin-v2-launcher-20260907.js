(()=>{
'use strict';
function install(){
  const card=document.getElementById('adminCard');
  if(!card)return;
  const old=document.getElementById('adminOverviewOpen');
  if(old)old.remove();
  let button=document.getElementById('adminOverviewV2Open');
  if(!button){
    button=document.createElement('button');
    button.id='adminOverviewV2Open';
    button.type='button';
    button.className='soft full';
    button.style.marginTop='10px';
    button.style.border='1px solid #b8ccd9';
    button.style.background='linear-gradient(135deg,#0f3550,#174f72)';
    button.style.color='#fff';
    button.style.fontWeight='900';
    button.textContent='전사 근태 · 연차 현황 V2';
    card.appendChild(button);
  }
  button.onclick=()=>location.assign('/attendance-admin-v2-20260907.html?v=20260907-v2-1');
}
function cleanupOld(){
  document.getElementById('pageAdminOverview')?.remove();
  document.getElementById('adminOverviewOpen')?.remove();
}
function boot(){
  cleanupOld();
  install();
  let count=0;
  const timer=setInterval(()=>{
    cleanupOld();
    install();
    if(++count>80)clearInterval(timer);
  },250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
