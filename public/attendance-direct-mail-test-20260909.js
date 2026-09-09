(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let currentRequestId='';

function toast(message,kind='info'){
  let el=$('#namoDirectMailToast');
  if(!el){
    el=document.createElement('div');
    el.id='namoDirectMailToast';
    Object.assign(el.style,{
      position:'fixed',left:'50%',bottom:'92px',transform:'translateX(-50%)',
      zIndex:'10050',maxWidth:'calc(100% - 34px)',padding:'11px 15px',
      borderRadius:'13px',fontSize:'12px',fontWeight:'900',color:'#fff',
      boxShadow:'0 10px 28px rgba(15,31,55,.22)',textAlign:'center'
    });
    document.body.appendChild(el);
  }
  el.style.background=kind==='error'?'#b42318':kind==='success'?'#147a52':'#17263b';
  el.textContent=message;
  el.hidden=false;
  clearTimeout(el._timer);
  el._timer=setTimeout(()=>{el.hidden=true},3200);
}

async function api(url,opt={}){
  const init={credentials:'same-origin',cache:'no-store',...opt};
  if(init.body!=null&&!init.headers)init.headers={'Content-Type':'application/json'};
  const response=await fetch(url,init);
  const payload=await response.json().catch(()=>({success:false,message:'서버 응답을 확인할 수 없습니다.'}));
  if(!response.ok||payload?.success===false){
    const error=new Error(payload?.message||`HTTP ${response.status}`);
    error.status=response.status;
    error.code=payload?.code||'';
    throw error;
  }
  return payload?.data??payload;
}

function requestList(payload){
  if(Array.isArray(payload))return payload;
  if(Array.isArray(payload?.requests))return payload.requests;
  if(Array.isArray(payload?.data?.requests))return payload.data.requests;
  return [];
}

function dateOnly(value){return value?String(value).slice(0,10):'-';}
function leaveName(value){
  const map={annual:'연차',am_half:'오전반차',pm_half:'오후반차',statutory:'법정휴가',half:'반차',quarter:'반반차',bereavement:'경조휴가',sick:'병가',holiday_sub:'휴일대체',overtime:'연장근무',outside:'외근/출장'};
  return map[String(value||'')]||String(value||'휴가');
}

async function selectedRecipientUsers(){
  const checked=$$('.namo-approved-member-check:checked');
  if(!checked.length)return [];
  const ids=new Set(checked.map(x=>String(x.value)));
  const directory=await api('/api/attendance/directory').catch(()=>api('/api/admin/users').catch(()=>[]));
  const list=Array.isArray(directory)?directory:(directory?.data||[]);
  const found=list.filter(u=>ids.has(String(u.id))&&u.email);
  if(found.length===checked.length)return found;

  return checked.map(ch=>{
    const label=ch.closest('.check-person');
    const name=label?.querySelector('.check-person-name')?.textContent?.trim()||'-';
    const meta=label?.querySelector('.check-person-meta')?.textContent?.trim()||'';
    const email=(meta.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'';
    const title=meta.split('·')[0]?.trim()||'';
    return {id:ch.value,name,email,title,department:$('#postDepartmentSelect')?.value||''};
  }).filter(u=>u.email);
}

async function currentApprovedRequest(){
  const leave=await api('/api/attendance/leave');
  const rows=requestList(leave);
  if(currentRequestId){
    const hit=rows.find(x=>String(x.id)===String(currentRequestId));
    if(hit)return hit;
  }
  return rows.filter(x=>String(x.status)==='APPROVED').sort((a,b)=>new Date(b.updated_at||b.approved_at||0)-new Date(a.updated_at||a.approved_at||0))[0]||null;
}

async function sendDirectMail(button){
  const users=await selectedRecipientUsers();
  if(!users.length){toast('메일을 받을 부서원을 먼저 체크해 주세요.','error');return;}

  const [item,meData]=await Promise.all([
    currentApprovedRequest(),
    api('/api/attendance/me').catch(()=>null)
  ]);
  if(!item){toast('승인완료 휴가 정보를 찾지 못했습니다.','error');return;}

  const me=meData?.user||meData||{};
  const department=$('#postDepartmentSelect')?.value||item.employee_department||me.department||'-';
  const reviewerText=$('#postReviewer')?.textContent?.trim()||item.reviewer_name||'-';
  const recipients=users.map(u=>({
    id:u.id,
    name:u.name||'-',
    email:u.email,
    department:u.department||department,
    title:u.title||''
  }));

  const payload={
    request:{
      id:item.id,
      leaveType:item.leave_type,
      leaveName:leaveName(item.leave_type),
      employeeName:item.employee_name||me.name||'-',
      employeeDepartment:item.employee_department||me.department||'-',
      startDate:dateOnly(item.start_date),
      endDate:dateOnly(item.end_date),
      days:Number(item.days||0),
      reason:item.reason||'-',
      reviewerName:item.reviewer_name||reviewerText.split('·')[0]?.trim()||'-',
      reviewerText,
      status:'APPROVED',
      recipientDepartment:department
    },
    recipients
  };

  const original=button.textContent;
  button.disabled=true;
  button.textContent='메일 보내는 중...';
  try{
    const result=await api('/api/attendance/test-direct-mail',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });

    await api(`/api/attendance/leave/${encodeURIComponent(item.id)}/mail-log`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recipients})
    }).catch(()=>null);

    const count=Number(result?.sent||recipients.length);
    button.textContent=`발송 완료 ✓ (${count}명)`;
    toast(`${count}명에게 승인완료 메일을 앱에서 바로 발송했습니다.`,'success');
    setTimeout(()=>{button.disabled=false;button.textContent=original},2600);
  }catch(error){
    button.disabled=false;
    button.textContent=original;
    if(error.code==='SMTP_NOT_CONFIGURED'||error.status===503){
      toast('메일 서버 설정이 필요합니다. SMTP 설정 후 바로 발송됩니다.','error');
    }else{
      toast(`메일 발송 실패: ${error.message}`,'error');
    }
  }
}

function prepareButton(){
  const button=$('#emailBtn');
  if(!button||button.dataset.directMail==='1')return;
  button.dataset.directMail='1';
  button.textContent='2. 선택 부서원에게 앱에서 바로 메일 보내기';
}

document.addEventListener('click',event=>{
  const row=event.target.closest?.('#leaveSelfView .record.namo-approved-openable');
  if(row?.dataset?.approvedRequestId)currentRequestId=String(row.dataset.approvedRequestId);
},true);

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#emailBtn');
  if(!button||!$('#postApprovalOverlay')?.classList.contains('open'))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  sendDirectMail(button).catch(error=>toast(`메일 발송 실패: ${error.message}`,'error'));
},true);

function init(){
  prepareButton();
  let pending=false;
  new MutationObserver(()=>{
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;prepareButton();});
  }).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
