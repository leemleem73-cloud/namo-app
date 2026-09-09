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

function askWebmailPassword(me){
  return new Promise(resolve=>{
    $('#namoWebmailPasswordOverlay')?.remove();
    const overlay=document.createElement('div');
    overlay.id='namoWebmailPasswordOverlay';
    Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'10080',background:'rgba(15,31,55,.42)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'});
    overlay.innerHTML=`<div style="width:min(420px,100%);background:#fff;border-radius:18px;padding:20px;box-shadow:0 18px 50px rgba(15,31,55,.28)">
      <div style="font-size:17px;font-weight:900;color:#15243a">로그인 본인 메일로 발송</div>
      <div style="margin-top:8px;font-size:12px;line-height:1.6;color:#64748b">발송자: <b style="color:#1f2937">${String(me?.name||'로그인 사용자')}</b><br>${String(me?.email||'')}</div>
      <label style="display:block;margin-top:16px;font-size:12px;font-weight:800;color:#344054">이카운트 웹메일 비밀번호</label>
      <input id="namoWebmailPasswordInput" type="password" autocomplete="off" style="box-sizing:border-box;width:100%;margin-top:7px;height:44px;border:1px solid #cfd8e3;border-radius:12px;padding:0 12px;font-size:14px" placeholder="비밀번호 입력">
      <div style="margin-top:8px;font-size:11px;color:#7b8798">비밀번호는 저장하지 않고 이번 발송에만 사용합니다.</div>
      <div style="display:flex;gap:8px;margin-top:18px">
        <button id="namoWebmailCancel" type="button" style="flex:1;height:42px;border:1px solid #d7dee8;background:#fff;border-radius:11px;font-weight:800">취소</button>
        <button id="namoWebmailSend" type="button" style="flex:1;height:42px;border:0;background:#176dd0;color:#fff;border-radius:11px;font-weight:900">발송 계속</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const input=$('#namoWebmailPasswordInput',overlay);
    const finish=value=>{if(input)input.value='';overlay.remove();resolve(value)};
    $('#namoWebmailCancel',overlay).onclick=()=>finish('');
    $('#namoWebmailSend',overlay).onclick=()=>finish(input?.value||'');
    overlay.addEventListener('click',e=>{if(e.target===overlay)finish('')});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();finish(input.value||'')}else if(e.key==='Escape'){finish('')}});
    setTimeout(()=>input?.focus(),50);
  });
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
  if(!me.email){toast('직원등록현황에 로그인 사용자의 회사메일을 먼저 등록해 주세요.','error');return;}

  const smtpPassword=await askWebmailPassword(me);
  if(!smtpPassword)return;

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
    smtpPassword,
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
  button.textContent=`${me.name||'본인'} 메일로 보내는 중...`;
  try{
    const result=await api('/api/attendance/test-direct-mail',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    payload.smtpPassword='';

    await api(`/api/attendance/leave/${encodeURIComponent(item.id)}/mail-log`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recipients})
    }).catch(()=>null);

    const count=Number(result?.sent||recipients.length);
    const senderName=result?.sender?.name||me.name||'로그인 사용자';
    button.textContent=`발송 완료 ✓ (${count}명)`;
    toast(`${senderName}님 계정으로 ${count}명에게 발송했습니다.`,'success');
    setTimeout(()=>{button.disabled=false;button.textContent=original},2600);
  }catch(error){
    payload.smtpPassword='';
    button.disabled=false;
    button.textContent=original;
    if(error.code==='SMTP_PASSWORD_REQUIRED'){
      toast('로그인 당사자의 웹메일 비밀번호를 입력해 주세요.','error');
    }else if(error.code==='SMTP_AUTH_FAILED'){
      toast('로그인 당사자의 이카운트 웹메일 비밀번호를 확인해 주세요.','error');
    }else if(error.code==='LOGIN_SENDER_NOT_FOUND'){
      toast(error.message,'error');
    }else{
      toast(`메일 발송 실패: ${error.message}`,'error');
    }
  }
}

function prepareButton(){
  const button=$('#emailBtn');
  if(!button||button.dataset.directMail==='2')return;
  button.dataset.directMail='2';
  button.textContent='2. 로그인 본인 메일로 선택 부서원에게 보내기';
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
