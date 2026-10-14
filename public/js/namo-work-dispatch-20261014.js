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
   const form=document.querySelector('.work-form'), list=form?.querySelector('#namoWorkDepartments');
   const button=form?.querySelector('#namoWorkSend'), status=form?.querySelector('#namoWorkSendStatus');
   const employees=form?.querySelector('#namoWorkEmployees'),count=form?.querySelector('#namoWorkSendCount');
   const reset=form?.querySelector('#namoWorkSendReset');
   if(!list||!button||!status||!employees)return;
   let savedId=editId||'',sending=false,departments=[];
   const mode=()=>form.querySelector('input[name="namoWorkSendMode"]:checked')?.value||'department';
   const chosen=()=>[...list.querySelectorAll('input:checked')].map(x=>x.value);
   const staff=()=>[...employees.querySelectorAll('input:checked')].map(x=>x.value);
   function render(){
     const selected=new Set(chosen()),staffMode=mode()==='staff';
     employees.hidden=!staffMode;
     employees.replaceChildren();
     if(staffMode){
       for(const group of departments.filter(x=>selected.has(x.name))){
         for(const person of group.staff||[]){
           const label=document.createElement('label'),check=document.createElement('input');
           check.type='checkbox';check.value=person.id;check.name='namoWorkEmployee';
           label.append(check,document.createTextNode(person.name+(person.title?' · '+person.title:'')));
           employees.append(label);
         }
       }
       if(!employees.children.length)employees.textContent='먼저 수신부서를 선택해 주세요.';
     }
     updateCount();
   }
   function updateCount(){
     const selected=new Set(chosen());
     const people=mode()==='staff'?staff().length:departments.filter(x=>selected.has(x.name)).reduce((n,x)=>n+Number(x.members||0),0);
     count.textContent='선택 부서 '+selected.size+'개 · 예상 수신자 '+people+'명';
     button.disabled=sending||!selected.size||!people;
   }
   try{
     departments=await api('/departments');
     if(!form.isConnected)return;
     list.replaceChildren();
     if(!departments?.length){list.textContent='승인된 부서가 없습니다.';return;}
     departments.forEach(dept=>{
       const label=document.createElement('label'),check=document.createElement('input');
       check.type='checkbox';check.value=dept.name;check.name='namoDispatchDepartment';
       label.append(check,document.createTextNode(dept.name+' · '+dept.members+'명'));
       list.append(label);
     });
     list.addEventListener('change',render);
     form.querySelectorAll('input[name="namoWorkSendMode"]').forEach(x=>x.addEventListener('change',render));
     employees.addEventListener('change',updateCount);
     reset?.addEventListener('click',()=>{list.querySelectorAll('input').forEach(x=>x.checked=false);render();status.textContent='';});
     render();
   }catch(e){list.textContent='직원등록현황 조회 실패: '+e.message;return;}
   button.addEventListener('click',async()=>{
     if(sending)return;
     const names=chosen(),sendMode=mode(),ids=staff();
     if(!names.length||(sendMode==='staff'&&!ids.length)){status.textContent='수신부서 및 수신 직원을 선택해 주세요.';return;}
     if(!window.confirm(names.join(', ')+'에 작업지시서를 발송하시겠습니까?'))return;
     if(!savedId){status.textContent='먼저 작업지시서를 저장한 뒤 수정 화면에서 발송해 주세요.';return;}
     sending=true;updateCount();status.textContent='선택한 부서에 발송 중...';
     try{
       const key='wd-'+savedId.replace(/[^A-Za-z0-9_-]/g,'')+'-'+Date.now();
       const payload={documentId:savedId,departments:names,sendMode,recipientUserIds:ids,requestKey:key,note:''};
       const result=await api('/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
       status.textContent='발송 완료: '+result.departments.join(', ')+' / 수신 '+result.recipientTotal+'명';
     }catch(e){status.textContent='발송 실패: '+e.message;}
     finally{sending=false;updateCount();}
   });
 };
})();