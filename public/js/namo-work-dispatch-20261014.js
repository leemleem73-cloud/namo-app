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
 function refreshDispatchBadge(count){
   const btn=document.getElementById('notifyBtn');
   if(!btn)return;
   btn.dataset.workDispatchUnread=String(count);
   let badge=btn.querySelector('.namo-work-dispatch-badge');
   if(!badge){
     badge=document.createElement('span');
     badge.className='namo-work-dispatch-badge';
     badge.style.cssText='position:absolute;top:2px;right:2px;min-width:15px;height:15px;padding:0 3px;border-radius:10px;background:#d83939;color:#fff;font:700 10px/15px sans-serif;text-align:center;box-sizing:border-box;pointer-events:none;';
     btn.style.position='relative';
     btn.append(badge);
   }
   badge.textContent=count>99?'99+':String(count);
   badge.hidden=!count;
   badge.style.display=count?'block':'none';
 }
 async function loadInbox(){
   if(inboxBusy)return;
   const list=document.getElementById('notifyList');
   if(!list)return;
   inboxBusy=true;
   try{
     const rows=await api('/inbox');
     list.querySelectorAll('.notify-item[data-source="work-dispatch"]').forEach(n=>n.remove());
     refreshDispatchBadge((rows||[]).filter(n=>!n.read_at).length);
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
     const active=document.querySelector('#notifyTabs .notify-tab.active')?.dataset.filter||'all';
     list.querySelectorAll('.notify-item[data-source="work-dispatch"]').forEach(row=>row.classList.toggle('hidden',active!=='all'&&active!=='work'));
     const blank=document.getElementById('notifyEmpty');
     if(blank)blank.style.display=[...list.querySelectorAll('.notify-item')].some(el=>!el.classList.contains('hidden'))?'none':'block';
   }catch(e){console.warn('[work dispatch] inbox',e);}
   finally{inboxBusy=false;}
 }
 document.addEventListener('click',e=>{
   const row=e.target.closest?.('.notify-item[data-source="work-dispatch"]');
   if(!row)return;
   const id=row.dataset.dispatchId;
   if(id)api('/inbox/'+encodeURIComponent(id)+'/read',{method:'POST'}).then(()=>{row.querySelector('.notify-time').textContent='확인';loadInbox();}).catch(console.warn);
 },true);
 document.getElementById('notifyBtn')?.addEventListener('click',()=>setTimeout(loadInbox,80));
 document.querySelector('#notifyTabs .notify-tab[data-filter="work"]')?.addEventListener('click',()=>setTimeout(loadInbox,20));
 window.addEventListener('focus',()=>{if(document.getElementById('notifyPanel')?.classList.contains('open'))loadInbox();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.getElementById('notifyPanel')?.classList.contains('open'))loadInbox();});
 // Refresh the current user's alerts across devices even with the panel closed.
 setInterval(()=>{if(!document.hidden)loadInbox();},30000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>loadInbox(),{once:true});
 else loadInbox();
 window.namoWorkDispatchInit=async function(editId){
   const form=document.querySelector('.work-form'),list=form?.querySelector('#namoWorkDepartments'),people=form?.querySelector('#namoWorkEmployees');
   const button=form?.querySelector('#namoWorkSend'),status=form?.querySelector('#namoWorkSendStatus'),count=form?.querySelector('#namoWorkSendCount'),reset=form?.querySelector('#namoWorkSendReset');
   if(!list||!people||!button||!count||!status)return;
   const staffEmails={'김세희':'shkim@namochemical.com','정영기':'ygjeong@namochemical.com','김현진':'hyunjinkim@namochemical.com','박도훈':'dhbak@namochemical.com','박지헌':'jhp1767@namochemical.com','박현아':'hapark@namochemical.com','문지훈':'jh4ever@namochemical.com'};
   const emailButton=document.createElement('button');
   emailButton.type='button';emailButton.className='btn';emailButton.id='namoWorkEmailCompose';
   emailButton.textContent='이메일 작성';emailButton.disabled=true;emailButton.title='선택한 담당자에게 이메일을 작성합니다. 실제 전송은 메일 프로그램에서 확인 후 진행합니다.';
   button.before(emailButton);
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
     const mailTotal=groups().reduce((n,d)=>n+(d.staff||[]).filter(p=>selected.get(d.name).has(String(p.id))&&staffEmails[String(p.name||'').trim()]).length,0);
     emailButton.disabled=sending||!mailTotal;
     emailButton.title=mailTotal+'명 이메일 작성 (메일 앱에서 직접 발송)';
   }
   try{
     departments=(await api('/departments')).filter(d=>!['GUEST','대표'].includes(String(d.name||'').trim().toUpperCase()));
     if(!form.isConnected)return;
     if(!departments.length){list.textContent='수신 가능한 승인 직원이 없습니다.';return;}
     render();
   }catch(err){list.textContent='부서 조회 실패: '+err.message;return;}
   reset?.addEventListener('click',()=>{selected.clear();status.textContent='';render();});
   emailButton.addEventListener('click',()=>{
     if(sending)return;
     const selectedStaff=groups().flatMap(d=>(d.staff||[]).filter(p=>selected.get(d.name).has(String(p.id))));
     const emails=[...new Set(selectedStaff.map(p=>staffEmails[String(p.name||'').trim()]).filter(Boolean))];
     if(!emails.length){status.textContent='이메일이 등록된 수신 담당자를 선택해 주세요.';return;}
     const missing=selectedStaff.filter(p=>!staffEmails[String(p.name||'').trim()]).map(p=>p.name);
     const orderNumber=form.querySelector('#workOrderNo')?.value?.trim()||editId||'미지정';
     const instructions=form.querySelector('#namoWorkInstructions')?.value?.trim()||'';
     const basic=[...form.querySelectorAll('.work-basic-grid .form-item')];
     const field=name=>basic.find(x=>x.querySelector('label')?.textContent.trim()===name)?.querySelector('input,select')?.value?.trim()||'-';
     const subject='[NAMO QMES] 작업지시서 '+orderNumber;
     const body=['나모케미칼 QMES 작업지시서 전달드립니다.','','작업지시번호: '+orderNumber,'고객사: '+field('고객사명'),'제품명: '+field('제품명'),'생산 LOT NO: '+field('생산 LOT NO'),'','작업지시사항:',instructions||'-','','QMES: https://qmes.namochemical.com/','', '※ 본 메일은 작성 초안입니다. 내용을 확인한 후 발송해 주세요.'].join('\\n');
     if(missing.length&&!window.confirm('이메일이 확인되지 않은 담당자 '+missing.join(', ')+'님은 제외됩니다. '+emails.length+'명에게 이메일을 작성할까요?'))return;
     window.location.href='mailto:'+emails.join(',')+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
     status.textContent='이메일 작성 창을 열었습니다 · '+emails.length+'명 (실제 발송 여부는 메일 앱에서 확인)';
   });
   button.addEventListener('click',async()=>{
     if(sending)return;
     const valid=groups().filter(d=>selected.get(d.name).size>0),names=valid.map(d=>d.name),recipients=valid.flatMap(d=>[...selected.get(d.name)]);
     if(!recipients.length){status.textContent='수신부서와 해당자를 선택해 주세요.';return;}
     let orderId=editId||form.dataset.namoSavedWorkOrderId||'';
     if(!window.namoSaveWorkOrderForDispatch){status.textContent='저장 연동을 불러오지 못했습니다. 화면을 새로고침해 주세요.';return;}
     if(!window.confirm(names.join(', ')+' · '+recipients.length+'명에게 발송하시겠습니까?'))return;
     sending=true;update();status.textContent='작업지시서 저장 중...';
     try{
       orderId=await window.namoSaveWorkOrderForDispatch(orderId);
       if(!orderId){status.textContent='저장에 실패해 발송하지 않았습니다.';return;}
       status.textContent='저장 완료 · 수신 담당자에게 발송 중...';
       const key='wd-'+orderId.replace(/[^A-Za-z0-9_-]/g,'')+'-'+Date.now();
       const result=await api('/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({documentId:orderId,departments:names,sendMode:'staff',recipientUserIds:recipients,requestKey:key,note:''})});
       status.textContent='발송 완료 · '+result.recipientTotal+'명 QMES 알림 전달';
       await loadInbox();
     }catch(err){status.textContent='발송 실패: '+err.message;}
     finally{sending=false;update();}
   });
 };
})();