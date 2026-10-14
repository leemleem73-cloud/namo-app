(function(){
 'use strict';
 if(window.__namoWorkDispatchUi20261014)return;
 window.__namoWorkDispatchUi20261014=true;
 const base='/api/qmes-work-dispatch';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const api=async(path,options={})=>{
   const r=await fetch(base+path,{credentials:'same-origin',cache:'no-store',...options});
   const value=await r.json().catch(()=>({}));
   if(!r.ok||!value.success)throw Error(value.message||'서버 연결 실패');
   return value.data;
 };
 let inboxBusy=false;
 async function loadInbox(){
   if(inboxBusy)return;
   const list=document.getElementById('notifyList');
   if(!list)return;
   inboxBusy=true;
   try{
     const rows=await api('/inbox');
     list.querySelectorAll('.notify-item[data-source="work-dispatch"]').forEach(n=>n.remove());
     (rows||[]).forEach(n=>{
       const div=document.createElement('div');
       div.className='notify-item';
       div.dataset.source='work-dispatch';
       div.dataset.kind='work';
       div.dataset.page='work';
       div.dataset.dispatchId=String(n.id);
       const isNew=!n.read_at;
       div.innerHTML='<div class="notify-dot">'+(isNew?'지':'✓')+'</div><div class="notify-copy"><b>작업지시 '+esc(n.work_order_id)+'</b><span>'+esc(n.department)+' · '+esc(n.product||'-')+' · LOT '+esc(n.lot||'-')+'<br>발송: '+esc(n.sender_name||'-')+'</span></div><div class="notify-time">'+(isNew?'미확인':'확인')+'</div>';
       list.appendChild(div);
     });
     const blank=document.getElementById('notifyEmpty');
     if(blank)blank.style.display=list.querySelector('.notify-item')?'none':'block';
   }catch(e){console.warn('[work dispatch] inbox',e);}
   finally{inboxBusy=false;}
 }
 document.addEventListener('click',e=>{
   const row=e.target.closest?.('.notify-item[data-source="work-dispatch"]');
   if(!row)return;
   const id=row.dataset.dispatchId;
   if(id)api('/inbox/'+encodeURIComponent(id)+'/read',{method:'POST'}).then(()=>{row.querySelector('.notify-time').textContent='확인';}).catch(console.warn);
 },true);
 document.getElementById('notifyBtn')?.addEventListener('click',()=>setTimeout(loadInbox,10));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.getElementById('notifyPanel')?.classList.contains('open'))loadInbox();});
 window.namoWorkDispatchInit=async function(editId){
   const form=document.querySelector('.work-form'),list=form?.querySelector('#namoWorkDepartments');
   const button=form?.querySelector('#namoWorkSend'),status=form?.querySelector('#namoWorkSendStatus');
   const count=form?.querySelector('#namoWorkSendCount'),reset=form?.querySelector('#namoWorkSendReset');
   const employees=form?.querySelector('#namoWorkEmployees');
   if(!list||!button||!status||!count)return;
   let sending=false,departments=[];
   // Department and employee checkboxes stay together inside the department card.
   if(employees)employees.hidden=true;
   const checkedPeople=()=>[...list.querySelectorAll('input[data-employee]:checked')];
   const recipientIds=()=>checkedPeople().map(el=>el.value);
   const checkedDepartments=()=>[...list.querySelectorAll('.namo-dept-group')].filter(group=>group.querySelector('input[data-employee]:checked')).map(group=>group.dataset.department);
   function update(){
     let countDepartments=checkedDepartments().length,people=recipientIds().length;
     count.textContent='선택 부서 '+countDepartments+'개 · 예상 수신자 '+people+'명';
     button.disabled=sending||!people;
     list.querySelectorAll('.namo-dept-group').forEach(group=>{
       const head=group.querySelector('input[data-department]');
       const checks=[...group.querySelectorAll('input[data-employee]')];
       head.checked=checks.length>0&&checks.every(x=>x.checked);
       head.indeterminate=checks.some(x=>x.checked)&&!head.checked;
       group.classList.toggle('namo-selected',checks.some(x=>x.checked));
     });
   }
   try{
     departments=(await api('/departments')).filter(d=>!['GUEST','대표'].includes(String(d.name||'').trim().toUpperCase()));
     if(!form.isConnected)return;
     list.replaceChildren();
     if(!departments.length){list.textContent='발송 가능한 승인 직원이 없습니다.';return;}
     departments.forEach(dept=>{
       const group=document.createElement('div');group.className='namo-dept-group';group.dataset.department=dept.name;
       const head=document.createElement('label');head.className='namo-dept-head';
       const all=document.createElement('input');all.type='checkbox';all.dataset.department=dept.name;
       const title=document.createElement('strong');title.textContent=dept.name+' 전체 선택';
       head.append(all,title);group.append(head);
       const people=document.createElement('div');people.className='namo-dept-people';
       for(const person of dept.staff||[]){
         const label=document.createElement('label');label.className='namo-person-check';
         const input=document.createElement('input');input.type='checkbox';input.dataset.employee='1';input.value=person.id;
         const name=document.createElement('span');name.textContent=person.name+(person.title?' · '+person.title:'');
         label.append(input,name);people.append(label);
       }
       if(!people.children.length){const empty=document.createElement('small');empty.textContent='등록 직원 없음';people.append(empty);}
       group.append(people);list.append(group);
       all.addEventListener('change',()=>{people.querySelectorAll('input[data-employee]').forEach(x=>x.checked=all.checked);update();});
       people.addEventListener('change',update);
     });
     // Keep the old mode inputs functional: the actual recipients are always the checked employees.
     form.querySelectorAll('input[name="namoWorkSendMode"]').forEach(radio=>radio.addEventListener('change',update));
     reset?.addEventListener('click',()=>{
       list.querySelectorAll('input').forEach(x=>{x.checked=false;x.indeterminate=false;});
       status.textContent='';update();
     });
     update();
   }catch(err){list.textContent='직원등록현황 조회 실패: '+err.message;return;}
   button.addEventListener('click',async()=>{
     if(sending)return;
     const departmentsSelected=checkedDepartments(),ids=recipientIds();
     if(!ids.length){status.textContent='부서의 해당자를 체크해 주세요.';return;}
     if(!editId){status.textContent='작업지시서를 먼저 저장한 후 수정 화면에서 발송할 수 있습니다.';return;}
     if(!window.confirm(departmentsSelected.join(', ')+'의 선택된 '+ids.length+'명에게 발송하시겠습니까?'))return;
     sending=true;update();status.textContent='작업지시서 발송 중...';
     try{
       const key='wd-'+editId.replace(/[^A-Za-z0-9_-]/g,'')+'-'+Date.now();
       const result=await api('/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({documentId:editId,departments:departmentsSelected,sendMode:'staff',recipientUserIds:ids,requestKey:key,note:''})});
       status.textContent='발송 완료: '+result.recipientTotal+'명 · QMES 내부 알림';
     }catch(err){status.textContent='발송 실패: '+err.message;}
     finally{sending=false;update();}
   });
 };
})();