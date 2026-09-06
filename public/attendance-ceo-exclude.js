(()=>{
'use strict';

// Mobile attendance only: representative directors are excluded from clock-in/out management.
// This patch is loaded only by public/attendance.html and does not modify the PC QMES UI.
const CEO_TITLE_RE=/(대표\s*이사|대표이사|^대표$|\bCEO\b|Chief\s+Executive\s+Officer)/i;
let excluded=false;
let checking=false;

const byId=id=>document.getElementById(id);
const isRepresentativeDirector=user=>{
  if(!user||typeof user!=='object')return false;
  return CEO_TITLE_RE.test(String(user.title||'').trim());
};

function installStyle(){
  if(byId('namoCeoAttendanceExcludeStyle'))return;
  const style=document.createElement('style');
  style.id='namoCeoAttendanceExcludeStyle';
  style.textContent=`
    body.namo-ceo-attendance-excluded #attendanceBtn{
      pointer-events:none!important;
      cursor:default!important;
      opacity:.78!important;
      font-size:0!important;
    }
    body.namo-ceo-attendance-excluded #attendanceBtn::after{
      content:'근태관리 대상 제외';
      font-size:18px;
      font-weight:800;
    }
    body.namo-ceo-attendance-excluded #todayStatus{
      font-size:0!important;
    }
    body.namo-ceo-attendance-excluded #todayStatus::after{
      content:'근태관리 제외';
      font-size:12px;
    }
    body.namo-ceo-attendance-excluded .nav[data-page="records"],
    body.namo-ceo-attendance-excluded #pageRecords{
      display:none!important;
    }
    body.namo-ceo-attendance-excluded #clockInText,
    body.namo-ceo-attendance-excluded #clockOutText,
    body.namo-ceo-attendance-excluded #kpiDays,
    body.namo-ceo-attendance-excluded #kpiHours{
      font-size:0!important;
    }
    body.namo-ceo-attendance-excluded #clockInText::after,
    body.namo-ceo-attendance-excluded #clockOutText::after,
    body.namo-ceo-attendance-excluded #kpiDays::after,
    body.namo-ceo-attendance-excluded #kpiHours::after{
      content:'-';
      font-size:inherit;
    }
  `;
  document.head.appendChild(style);
}

function applyExcludedUi(){
  if(!excluded)return;
  document.body.classList.add('namo-ceo-attendance-excluded');
  installStyle();

  const button=byId('attendanceBtn');
  if(button){
    button.disabled=true;
    button.setAttribute('aria-disabled','true');
    button.setAttribute('title','대표이사는 모바일 출퇴근 관리 대상에서 제외됩니다.');
  }

  const gpsText=byId('gpsText');
  if(gpsText)gpsText.textContent='대표이사는 모바일 출퇴근 관리 대상에서 제외됩니다.';
  const gpsState=byId('gpsState');
  if(gpsState)gpsState.textContent='제외';

  if(!byId('ceoAttendanceNotice')&&button){
    const notice=document.createElement('div');
    notice.id='ceoAttendanceNotice';
    notice.className='notice topgap';
    notice.textContent='대표이사는 출근·퇴근 기록 및 월간 근태기록 관리 대상에서 제외됩니다.';
    button.insertAdjacentElement('afterend',notice);
  }
}

async function checkRepresentativeDirector(){
  if(excluded||checking)return;
  const app=byId('mainApp');
  if(!app||app.classList.contains('hidden'))return;
  checking=true;
  try{
    const response=await fetch('/api/attendance/me',{credentials:'same-origin',cache:'no-store'});
    const payload=await response.json().catch(()=>null);
    if(!response.ok||payload?.success===false)return;
    const data=payload?.data??payload;
    if(!isRepresentativeDirector(data?.user))return;
    excluded=true;
    applyExcludedUi();
    setTimeout(applyExcludedUi,250);
    setTimeout(applyExcludedUi,1000);
  }catch(_error){}finally{
    checking=false;
  }
}

document.addEventListener('click',event=>{
  if(!excluded)return;
  const target=event.target?.closest?.('#attendanceBtn,.nav[data-page="records"],#recordSearch,#excelBtn');
  if(!target)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  applyExcludedUi();
},true);

const mainApp=byId('mainApp');
if(mainApp){
  new MutationObserver(()=>checkRepresentativeDirector()).observe(mainApp,{attributes:true,attributeFilter:['class']});
}

window.addEventListener('pageshow',()=>{
  checkRepresentativeDirector();
  if(excluded)applyExcludedUi();
});
setTimeout(checkRepresentativeDirector,300);
})();
