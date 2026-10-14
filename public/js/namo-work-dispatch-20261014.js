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
   const button=form?.querySelector('#namoWorkSend'),status=form?.querySelector('#namoWorkSendStatus');
   if(!list||!button||!status)return;
   let savedId=editId||'',sending=false;
   try{
     const departments=await api('/departments');
     if(!form.isConnected)return;
     list.replaceChildren();
     if(!departments?.length){list.textContent='발송 가능한 승인 부서가 없습니다.';return;}
     departments.forEach(dept=>{
       const l=document.createElement('label'),check=document.createElement('input');
       check.type='checkbox';check.value=dept.name;check.name='namoDispatchDepartment';
       l.append(check,document.createTextNode(dept.name+' ('+dept.members+'명)'));
       list.append(l);
     });
     button.disabled=false;
   }catch(e){list.textContent='부서 조회 실패: '+e.message;return;}
   button.addEventListener('click',async()=>{
     if(sending)return;
     const names=[...list.querySelectorAll('input:checked')].map(x=>x.value);
     if(!names.length){status.textContent='수신부서를 선택해 주세요.';return;}
     if(!window.confirm(names.join(', ')+'에 작업지시서를 발송하시겠습니까?'))return;
     sending=true;button.disabled=true;status.textContent='저장 확인 및 발송 중...';
     try{
       if(!savedId){
         status.textContent='신규 작업지시서는 먼저 저장해 주세요. 저장 후 목록에서 수정으로 열어 발송할 수 있습니다.';
         return;
       }
       const key='wd-'+savedId.replace(/[^A-Za-z0-9_-]/g,'')+'-'+Date.now();
       const payload={documentId:savedId,departments:names,requestKey:key,note:''};
       const result=await api('/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
       status.textContent='발송 완료: '+result.departments.join(', ')+' · '+result.recipientTotal+'명 수신';
     }catch(e){status.textContent='발송 실패: '+e.message;}
     finally{sending=false;button.disabled=false;}
   });
 };
})();