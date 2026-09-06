(()=>{
'use strict';

// Mobile attendance only: representative directors are excluded from attendance management.
// Loaded only by public/attendance.html. PC QMES data and screens are not modified.
const CEO_TITLE_RE=/(대표\s*이사|대표이사|^대표$|\bCEO\b|Chief\s+Executive\s+Officer)/i;
let excluded=false;
let checking=false;

const byId=id=>document.getElementById(id);
const titleOf=user=>String(user?.title||user?.position||user?.jobTitle||user?.rank||'').trim();
const isRepresentativeDirector=user=>Boolean(user&&typeof user==='object'&&CEO_TITLE_RE.test(titleOf(user)));
const isRepresentativeLeave=row=>CEO_TITLE_RE.test(String(row?.employee_title||row?.title||'').trim());

function recomputeOverview(data){
  if(!data||typeof data!=='object')return data;
  const employees=Array.isArray(data.employees)?data.employees.filter(x=>!isRepresentativeDirector(x)):[];
  const leaves=Array.isArray(data.leaves)?data.leaves.filter(x=>!isRepresentativeLeave(x)):[];
  const summary={
    total:employees.length,
    working:employees.filter(x=>x.attendanceStatus==='WORKING').length,
    done:employees.filter(x=>x.attendanceStatus==='DONE').length,
    absent:employees.filter(x=>x.attendanceStatus==='ABSENT').length,
    onLeave:employees.filter(x=>x.attendanceStatus==='LEAVE').length,
    checkedIn:employees.filter(x=>x.attendanceStatus==='WORKING'||x.attendanceStatus==='DONE').length
  };
  const departments=[...new Set(employees.map(x=>String(x.department||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  return {...data,employees,leaves,summary,departments};
}

function jsonResponse(response,payload){
  const headers=new Headers(response.headers);
  headers.set('content-type','application/json; charset=utf-8');
  headers.set('cache-control','no-store, no-cache, must-revalidate, max-age=0');
  return new Response(JSON.stringify(payload),{status:response.status,statusText:response.statusText,headers});
}

// Filter only requests made from this mobile attendance page.
const nativeFetch=window.fetch.bind(window);
window.fetch=async function namoMobileAttendanceFetch(input,init){
  const raw=typeof input==='string'?input:String(input?.url||'');
  const url=new URL(raw||location.href,location.href);
  const path=url.pathname;

  if(excluded&&(path==='/api/attendance/clock-in'||path==='/api/attendance/clock-out')){
    return new Response(JSON.stringify({success:false,message:'대표이사는 모바일 출퇴근 관리 대상에서 제외됩니다.',data:null}),{
      status:403,
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
    });
  }

  const response=await nativeFetch(input,init);

  if(path==='/api/attendance/me'&&response.ok){
    try{
      const payload=await response.clone().json();
      const data=payload?.data??payload;
      if(isRepresentativeDirector(data?.user)){
        excluded=true;
        queueMicrotask(applyExcludedUi);
      }
    }catch(_error){}
    return response;
  }

  if(path==='/api/admin/users'&&response.ok){
    try{
      const payload=await response.clone().json();
      if(payload?.success===false)return response;
      const data=payload?.data??payload;
      if(!Array.isArray(data))return response;
      const filtered=data.filter(x=>!isRepresentativeDirector(x));
      const next=payload&&Object.prototype.hasOwnProperty.call(payload,'data')?{...payload,data:filtered}:filtered;
      return jsonResponse(response,next);
    }catch(_error){return response}
  }

  if(path==='/api/attendance/admin/overview'&&response.ok){
    try{
      const payload=await response.clone().json();
      if(payload?.success===false)return response;
      const data=payload?.data??payload;
      const filtered=recomputeOverview(data);
      const next=payload&&Object.prototype.hasOwnProperty.call(payload,'data')?{...payload,data:filtered}:filtered;
      return jsonResponse(response,next);
    }catch(_error){return response}
  }

  return response;
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
    body.namo-ceo-attendance-excluded #todayStatus{font-size:0!important}
    body.namo-ceo-attendance-excluded #todayStatus::after{content:'근태관리 제외';font-size:12px}
    body.namo-ceo-attendance-excluded .nav[data-page="records"],
    body.namo-ceo-attendance-excluded #pageRecords{display:none!important}
    body.namo-ceo-attendance-excluded #clockInText,
    body.namo-ceo-attendance-excluded #clockOutText,
    body.namo-ceo-attendance-excluded #kpiDays,
    body.namo-ceo-attendance-excluded #kpiHours{font-size:0!important}
    body.namo-ceo-attendance-excluded #clockInText::after,
    body.namo-ceo-attendance-excluded #clockOutText::after,
    body.namo-ceo-attendance-excluded #kpiDays::after,
    body.namo-ceo-attendance-excluded #kpiHours::after{content:'-';font-size:16px}
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
  const status=byId('todayStatus');
  if(status)status.textContent='근태관리 제외';
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
    const response=await nativeFetch('/api/attendance/me',{credentials:'same-origin',cache:'no-store'});
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
if(mainApp)new MutationObserver(()=>checkRepresentativeDirector()).observe(mainApp,{attributes:true,attributeFilter:['class']});
window.addEventListener('pageshow',()=>{checkRepresentativeDirector();if(excluded)applyExcludedUi()});
setTimeout(checkRepresentativeDirector,300);
})();
