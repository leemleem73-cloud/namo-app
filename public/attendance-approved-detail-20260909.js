(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(url,opt={})=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opt});const p=await r.json().catch(()=>({success:false,message:'서버 응답 오류'}));if(!r.ok||p?.success===false)throw new Error(p?.message||`HTTP ${r.status}`);return p?.data??p};
const state={me:null,directory:[],requests:[],current:null,department:'',selectedIds:[]};

function toast(msg){let t=$('#namoApprovedDetailToast');if(!t){t=document.createElement('div');t.id='namoApprovedDetailToast';Object.assign(t.style,{position:'fixed',left:'50%',bottom:'90px',transform:'translateX(-50%)',zIndex:'10020',background:'#17263b',color:'#fff',padding:'10px 14px',borderRadius:'12px',fontSize:'12px',fontWeight:'800',maxWidth:'calc(100% - 36px)',boxShadow:'0 8px 24px rgba(0,0,0,.18)'});document.body.appendChild(t)}t.textContent=msg;t.hidden=false;clearTimeout(t._timer);t._timer=setTimeout(()=>t.hidden=true,2200)}
function activeUser(u){return !!(u&&u.email&&!['REJECTED','INACTIVE','DISABLED','DELETED','WITHDRAWN'].includes(String(u.status||'APPROVED').toUpperCase()))}
function dateOnly(v){return v?String(v).slice(0,10):'-'}
function leaveName(v){return({annual:'연차',am_half:'오전반차',pm_half:'오후반차',statutory:'법정휴가',half:'반차',quarter:'반반차',bereavement:'경조휴가',sick:'병가',holiday_sub:'휴일대체',overtime:'연장근무',outside:'외근/출장'})[String(v||'')]||String(v||'휴가')}
function reviewerFor(item){return state.directory.find(u=>String(u.id)===String(item?.approver1_user_id||item?.reviewer_id||''))||null}
function reviewedAt(item){return item?.reviewed_at||item?.approved_at||item?.updated_at||item?.review_completed_at||''}
function fmtDateTime(v){if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('ko-KR')}
function currentUser(){return state.me?.user||state.me||{}}

function injectStyle(){if($('#namoApprovedDetailStyle'))return;const s=document.createElement('style');s.id='namoApprovedDetailStyle';s.textContent=`
#leaveSelfView .record.namo-approved-openable{cursor:pointer;position:relative;padding-right:12px;transition:background .15s ease}
#leaveSelfView .record.namo-approved-openable:active{background:#f5f9ff}
#leaveSelfView .record .namo-approved-link{margin-top:5px;font-size:10px;font-weight:900;color:#2378d6}
#leaveSelfView .record.namo-approved-openable>.badge.green:after{content:' ›';font-weight:900}
#postApprovalOverlay .dept-mail-box{margin-top:12px}
`;document.head.appendChild(s)}

async function loadData(){
  try{
    const [me,leave,directory]=await Promise.all([
      api('/api/attendance/me').catch(()=>null),
      api('/api/attendance/leave').catch(()=>({requests:[]})),
      api('/api/attendance/directory').catch(()=>api('/api/admin/users').catch(()=>[]))
    ]);
    state.me=me;
    state.requests=Array.isArray(leave)?leave:(leave?.requests||[]);
    state.directory=Array.isArray(directory)?directory:[];
    bindApprovedRows();
  }catch(e){console.warn('[NAMO approved detail]',e)}
}

function bindApprovedRows(){
  const root=$('#leaveSelfView .records');
  if(!root)return;
  const rows=$$('.record',root);
  rows.forEach((row,index)=>{
    const item=state.requests[index];
    if(!item||String(item.status)!=='APPROVED')return;
    row.classList.add('namo-approved-openable');
    row.dataset.approvedRequestId=String(item.id||index);
    const middle=row.children[1];
    if(middle&&!$('.namo-approved-link',middle)){
      const hint=document.createElement('div');
      hint.className='namo-approved-link';
      hint.textContent='승인 상세 · PDF / 부서원 메일';
      middle.appendChild(hint);
    }
    row.onclick=()=>openApprovedDetail(item);
  });
}

function departmentUsers(){return state.directory.filter(u=>activeUser(u)&&String(u.department||'')===String(state.department||''));}
function selectedUsers(){return state.selectedIds.map(id=>state.directory.find(u=>String(u.id)===String(id))).filter(Boolean);}

function renderRecipients(){
  const root=$('#postMemberCheckList');
  if(!root)return;
  const members=departmentUsers();
  root.innerHTML=members.length?members.map(u=>`<label class="check-person"><input type="checkbox" class="namo-approved-member-check" value="${esc(u.id)}" ${state.selectedIds.includes(String(u.id))?'checked':''}><span class="check-person-main"><span class="check-person-name">${esc(u.name||'-')}</span><span class="check-person-meta">${esc(u.title||'-')} · ${esc(u.email||'')}</span></span></label>`).join(''):'<div class="notice">선택한 부서에 이메일이 등록된 직원이 없습니다.</div>';
  $$('.namo-approved-member-check',root).forEach(ch=>ch.onchange=()=>{state.selectedIds=$$('.namo-approved-member-check',root).filter(x=>x.checked).map(x=>x.value);renderRecipientPreview()});
  renderRecipientPreview();
}

function renderRecipientPreview(){
  const users=selectedUsers(),el=$('#postMailTargets');
  if(!el)return;
  el.innerHTML=users.length?`선택 부서: <b>${esc(state.department)}</b><br>수신자 ${users.length}명: <b>${esc(users.map(u=>u.name).join(', '))}</b><br>${esc(users.map(u=>u.email).join(', '))}`:`선택 부서: <b>${esc(state.department||'-')}</b><br>메일 받을 부서원을 체크해 주세요.`;
}

function populateDepartment(item){
  const users=state.directory.filter(activeUser);
  const departments=[...new Set(users.map(u=>u.department).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ko'));
  const me=currentUser();
  const preferred=item?.employee_department||me.department||departments[0]||'';
  state.department=departments.includes(preferred)?preferred:(departments[0]||'');
  state.selectedIds=[];
  const sel=$('#postDepartmentSelect');
  if(sel){
    sel.innerHTML=departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')||'<option value="">등록 부서 없음</option>';
    sel.value=state.department;
    sel.onchange=()=>{state.department=sel.value;state.selectedIds=[];renderRecipients()};
  }
  renderRecipients();
  const allBtn=$('#postSelectAllBtn');
  if(allBtn)allBtn.onclick=()=>{
    const checks=$$('.namo-approved-member-check',$('#postMemberCheckList'));
    const all=checks.length&&checks.every(x=>x.checked);
    checks.forEach(x=>x.checked=!all);
    state.selectedIds=checks.filter(x=>x.checked).map(x=>x.value);
    allBtn.textContent=all?'전체 선택':'전체 해제';
    renderRecipientPreview();
  };
}

function normalizedItem(item){
  const me=currentUser(),reviewer=reviewerFor(item);
  return {...item,employee_name:item?.employee_name||me.name||'-',employee_department:item?.employee_department||me.department||'-',reviewer_name:item?.reviewer_name||reviewer?.name||'-',reviewer_email:item?.reviewer_email||reviewer?.email||''};
}

function openApprovedDetail(raw){
  const item=normalizedItem(raw);
  state.current=item;
  populateDepartment(item);
  const reviewerText=$('#postReviewer');
  if(reviewerText){const when=fmtDateTime(reviewedAt(item));reviewerText.textContent=`${item.reviewer_name||'검토자'}${when?` · ${when}`:''}`;}
  const overlay=$('#postApprovalOverlay');
  if(overlay)overlay.classList.add('open');
  const pdf=$('#pdfBtn'),email=$('#emailBtn');
  if(pdf)pdf.onclick=()=>printApproved(item);
  if(email)email.onclick=()=>composeEmail(item);
}

function printApproved(item){
  const users=selectedUsers();
  const w=window.open('','_blank','width=900,height=720');
  if(!w)return toast('팝업을 허용해 주세요.');
  const title=`${leaveName(item.leave_type)} 생성 · ${item.employee_name||''}`;
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,'Noto Sans KR',sans-serif;padding:40px;color:#111}h1{font-size:24px;border-bottom:2px solid #173896;padding-bottom:12px}.row{display:grid;grid-template-columns:145px 1fr;padding:10px 0;border-bottom:1px solid #ddd}.k{font-weight:700;color:#555}.stamp{margin-top:30px;padding:16px;border:2px solid #16a34a;color:#0f7a3a;font-weight:800;text-align:center}@media print{body{padding:18px}}</style></head><body><h1>나모케미칼 근태 요청 승인서</h1><div class="row"><div class="k">신청자</div><div>${esc(item.employee_name||'-')} / ${esc(item.employee_department||'-')}</div></div><div class="row"><div class="k">요청</div><div>${esc(title)}</div></div><div class="row"><div class="k">일정</div><div>${esc(dateOnly(item.start_date))} ~ ${esc(dateOnly(item.end_date))} · ${Number(item.days||0)}일</div></div><div class="row"><div class="k">사유</div><div>${esc(item.reason||'-')}</div></div><div class="row"><div class="k">검토(임원/부장)</div><div>${esc(item.reviewer_name||'-')} / ${esc(item.reviewer_email||'-')}</div></div><div class="row"><div class="k">상태</div><div>검토완료 → 자동 승인완료</div></div><div class="row"><div class="k">승인 알림 부서</div><div>${esc(state.department||'-')}</div></div><div class="row"><div class="k">메일 수신자</div><div>${esc(users.map(u=>u.email).join(', ')||'미선택')}</div></div><div class="stamp">검토 완료와 동시에 자동 승인된 문서입니다.</div><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
  w.document.close();
}

async function composeEmail(item){
  const users=selectedUsers();
  if(!users.length)return toast('메일을 받을 해당 부서원을 체크해 주세요.');
  const recipients=users.map(u=>({id:u.id,name:u.name,email:u.email,department:u.department,title:u.title}));
  try{await api(`/api/attendance/leave/${encodeURIComponent(item.id)}/mail-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recipients})}).catch(()=>null)}catch(_e){}
  const to=users.map(u=>u.email).join(',');
  const subject=encodeURIComponent(`[나모케미칼] ${leaveName(item.leave_type)} 승인 완료`);
  const body=encodeURIComponent(`검토 완료 후 자동 승인된 근태 요청입니다.\n\n신청자: ${item.employee_name||'-'}\n일정: ${dateOnly(item.start_date)} ~ ${dateOnly(item.end_date)}\n검토자: ${item.reviewer_name||'-'}\n상태: 승인완료\n수신부서: ${state.department||'-'}\n수신자: ${users.map(u=>u.name).join(', ')}\n\nPDF 변환 문서를 첨부하여 발송해 주세요.`);
  location.href=`mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
}

function observeLeave(){
  const root=$('#leaveSelfView .records');
  if(!root)return setTimeout(observeLeave,400);
  let timer=null;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(loadData,120)}).observe(root,{childList:true,subtree:true});
}

injectStyle();
observeLeave();
setTimeout(loadData,500);
})();
