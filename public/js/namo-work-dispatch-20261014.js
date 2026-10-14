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
   const form=document.querySelector('.work-form'),list=form?.querySelector('#namoWorkDepartments'),people=form?.querySelector('#namoWorkEmployees');
   const button=form?.querySelector('#namoWorkSend'),status=form?.querySelector('#namoWorkSendStatus'),count=form?.querySelector('#namoWorkSendCount'),reset=form?.querySelector('#namoWorkSendReset');
   if(!list||!people||!button||!count||!status)return;
   let departments=[],sending=false;
   const selected=new Map();
   const groups=()=>departments.filter(d=>selected.has(d.name));
   const ids=()=>groups().flatMap(d=>[...selected.get(d.name)]);
   function render(){
     list.replaceChildren();
     departments.forEach(dept=>{
       const label=document.createElement('label');label.className='namo-dept-chip';
       const input=document.createElement('input');input.type='checkbox';input.checked=selected.has(dept.name);
       const title=document.createElement('span');title.textContent=dept.name;
       label.append(input,title);list.append(label);
       input.addEventListener('change',()=>{
         if(input.checked)selected.set(dept.name,new Set((dept.staff||[]).map(p=>String(p.id))));
         else selected.delete(dept.name);
         render();
       });
     });
     people.replaceChildren();
     if(!selected.size){people.textContent='수신부서를 선택하면 해당 직원이 표시됩니다.';}
     groups().forEach(dept=>{
       const block=document.createElement('div');block.className='namo-staff-group';
       const heading=document.createElement('strong');heading.textContent=dept.name;
       block.append(heading);
       (dept.staff||[]).forEach(person=>{
         const label=document.createElement('label'),input=document.createElement('input');
         input.type='checkbox';input.value=String(person.id);input.checked=selected.get(dept.name).has(String(person.id));
         label.append(input,document.createTextNode(person.name+(person.title?' · '+person.title:'')));
         block.append(label);
         input.addEventListener('change',()=>{
           if(input.checked)selected.get(dept.name).add(input.value);
           else selected.get(dept.name).delete(input.value);
           update();
         });
       });
       people.append(block);
     });
     update();
   }
   function update(){
     const valid=groups().filter(d=>selected.get(d.name).size>0);
     const total=valid.reduce((n,d)=>n+selected.get(d.name).size,0);
     count.textContent='선택 부서 '+valid.length+'개 · 수신자 '+total+'명';
     button.disabled=sending||!total;
   }
   try{
     departments=(await api('/departments')).filter(d=>!['GUEST','대표'].includes(String(d.name||'').trim().toUpperCase()));
     if(!form.isConnected)return;
     if(!departments.length){list.textContent='수신 가능한 승인 직원이 없습니다.';return;}
     render();
   }catch(err){list.textContent='부서 조회 실패: '+err.message;return;}
   reset?.addEventListener('click',()=>{selected.clear();status.textContent='';render();});
   button.addEventListener('click',async()=>{
     if(sending)return;
     const valid=groups().filter(d=>selected.get(d.name).size>0),names=valid.map(d=>d.name),recipients=valid.flatMap(d=>[...selected.get(d.name)]);
     if(!recipients.length){status.textContent='수신부서와 해당자를 선택해 주세요.';return;}
     if(!editId){status.textContent='작업지시서를 저장한 뒤 수정 화면에서 발송해 주세요.';return;}
     if(!window.confirm(names.join(', ')+' · '+recipients.length+'명에게 발송하시겠습니까?'))return;
     sending=true;update();status.textContent='발송 중...';
     try{
       const key='wd-'+editId.replace(/[^A-Za-z0-9_-]/g,'')+'-'+Date.now();
       const result=await api('/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({documentId:editId,departments:names,sendMode:'staff',recipientUserIds:recipients,requestKey:key,note:''})});
       status.textContent='발송 완료 · '+result.recipientTotal+'명 수신';
     }catch(err){status.textContent='발송 실패: '+err.message;}
     finally{sending=false;update();}
   });
 };
})();