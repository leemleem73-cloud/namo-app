(()=>{'use strict';
const panel=document.getElementById('notifyPanel'),button=document.getElementById('notifyBtn'),list=document.getElementById('notifyList');if(!panel||!button||!list)return;
document.body.append(panel);button.setAttribute('aria-controls','notifyPanel');button.setAttribute('aria-expanded','false');
const badge=document.createElement('span');badge.className='qmes-unread-badge';badge.hidden=true;button.append(badge);
const modules={dashboard:'종합',orders:'수주납기',purchase:'구매발주',work:'작업지시',incoming:'수입검사',process:'공정검사',outgoing:'출하검사',ncr:'부적합',spcTrend:'SPC',changeControl:'변경관리',lotTrace:'LOT 추적',equipment:'설비관리',instrumentMgmt:'계측기',calibrationMgmt:'검교정',standard:'문서관리',approval:'전자결재'};
const kinds={work:'work',incoming:'iqc',process:'pqc',outgoing:'oqc',orders:'delivery'};
for(const [page,title]of Object.entries(modules)){const filter=kinds[page]||page;if(document.querySelector('#notifyTabs [data-filter="'+filter+'"]'))continue;const tab=document.createElement('button');tab.type='button';tab.className='notify-tab';tab.dataset.filter=filter;tab.textContent=title;document.getElementById('notifyTabs').append(tab);}
let unread=0,qualityUnread=0,busy=false,refreshTimer=0;
function reflect(){
 const count=unread+qualityUnread+Number(button.dataset.workDispatchUnread||0);
 const label=count>99?'99+':String(count);
 if(badge.textContent!==label)badge.textContent=label;
 if(badge.hidden!==(count===0))badge.hidden=count===0;
 button.classList.toggle('qmes-has-unread',count>0);
 const aria='통합알림'+(count?' · 읽지 않은 알림 '+count+'건':'');
 if(button.getAttribute('aria-label')!==aria)button.setAttribute('aria-label',aria);
}
function position(){
 if(!panel.classList.contains('open')){button.setAttribute('aria-expanded','false');return;}
 const r=button.getBoundingClientRect(),width=Math.min(520,innerWidth-16),left=Math.max(8,Math.min(r.right-width,innerWidth-width-8)),top=Math.min(r.bottom+8,innerHeight-120);
 Object.entries({position:'fixed',width:width+'px',left:left+'px',right:'auto',top:Math.max(8,top)+'px',height:'min(680px, calc(100dvh - '+(Math.max(8,top)+10)+'px))'}).forEach(([name,value])=>{if(panel.style.getPropertyValue(name)!==value)panel.style.setProperty(name,value,'important');});
 button.setAttribute('aria-expanded','true');
}
async function json(url,options={}){
 const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const data=await response.json();
 if(!response.ok||data.success===false)throw Error(data.message||'알림 처리 실패');return data;
}
function apply(){window.qmesNotificationDates?.apply();reflect();}
async function refresh(){
 if(busy||document.hidden)return;busy=true;
 try{
  await window.qmesAuthDataReady?.wait();
  const [updates,quality]=await Promise.all([json('/api/qmes/module-notifications'),json('/api/qmes-quality/notifications')]);
  unread=Number(updates.unread||0);qualityUnread=(quality.data||[]).filter(n=>!n.read_at).length;
  list.querySelectorAll('[data-source="module-update"]').forEach(el=>el.remove());
  for(const n of updates.data||[]){
   const row=document.createElement('div');row.className='notify-item qmes-unread-item';row.dataset.source='module-update';row.dataset.updateId=n.id;row.dataset.createdAt=n.created_at;row.dataset.kind=kinds[n.page]||n.page;row.dataset.page=n.page;row.setAttribute('role','button');row.tabIndex=0;
   const dot=document.createElement('div');dot.className='notify-dot';dot.textContent='새';
   const copy=document.createElement('div');copy.className='notify-copy';const title=document.createElement('b');title.textContent=n.title;const text=document.createElement('span');text.textContent='저장된 변경 사항을 확인해 주세요.';copy.append(title,text);
   const date=document.createElement('div');date.className='notify-time';date.textContent=new Date(n.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});row.append(dot,copy,date);list.append(row);
  }
  // Sort all sources by event time without replacing their event handlers.
  [...list.querySelectorAll('.notify-item')].sort((a,b)=>String(b.dataset.createdAt).localeCompare(String(a.dataset.createdAt))).forEach(row=>list.append(row));
  apply();
 }catch(error){console.warn('[QMES update alerts]',error.message);}finally{busy=false;}
}
function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{refresh();window.loadQualityNotifications?.();},500);}
window.addEventListener('click',async event=>{
 const all=event.target.closest('#notifyReadAll'),row=event.target.closest('#notifyList .notify-item');
 if(all){
  event.preventDefault();event.stopImmediatePropagation();all.disabled=true;
  try{
   const dispatch=[...list.querySelectorAll('[data-dispatch-id]')].map(el=>json('/api/qmes-work-dispatch/inbox/'+encodeURIComponent(el.dataset.dispatchId)+'/read',{method:'POST'}));
   await Promise.all([json('/api/qmes/module-notifications/read-all',{method:'POST'}),json('/api/qmes-quality/notifications/read-all',{method:'POST'}),...dispatch]);
   list.querySelectorAll('.notify-item').forEach(el=>el.remove());unread=0;qualityUnread=0;button.dataset.workDispatchUnread='0';apply();window.qmesReloadDispatchNotifications?.();
  }catch(error){window.toast?.(error.message);}finally{all.disabled=false;}return;
 }
 if(!row||!['module-update','quality','work-dispatch'].includes(row.dataset.source))return;
 event.preventDefault();event.stopImmediatePropagation();
 const source=row.dataset.source,id=source==='module-update'?row.dataset.updateId:source==='quality'?row.dataset.notificationId:row.dataset.dispatchId;
 if(!id)return;
 try{
  const url=source==='module-update'?'/api/qmes/module-notifications/'+id+'/read':source==='quality'?'/api/qmes-quality/notifications/'+id+'/read':'/api/qmes-work-dispatch/inbox/'+encodeURIComponent(id)+'/read';
  await json(url,{method:'POST'});
  if(source==='module-update')unread=Math.max(0,unread-1);else if(source==='quality')qualityUnread=Math.max(0,qualityUnread-1);else button.dataset.workDispatchUnread=Math.max(0,Number(button.dataset.workDispatchUnread||0)-1);
  row.remove();apply();panel.classList.remove('open');button.classList.remove('notify-active');
  document.querySelector('.menu[data-page="'+row.dataset.page+'"]')?.click();position();schedule();
 }catch(error){window.toast?.(error.message);}
},true);
list.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('.notify-item')){event.preventDefault();event.target.click();}});
button.addEventListener('click',()=>{requestAnimationFrame(position);refresh();});
new MutationObserver(position).observe(panel,{attributes:true,attributeFilter:['class']});
new MutationObserver(reflect).observe(button,{attributes:true,attributeFilter:['data-work-dispatch-unread']});
window.addEventListener('resize',position);document.addEventListener('scroll',()=>{if(panel.classList.contains('open'))position();},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('focus',refresh);
const originalFetch=window.fetch;
window.fetch=async function(input,options){
 const response=await originalFetch.apply(this,arguments);
 const url=String(input?.url||input||''),method=String(options?.method||input?.method||'GET').toUpperCase();
 if(['POST','PUT','PATCH'].includes(method)&&url.includes('/api/')&&!/notifications|\/auth\/|\/inbox\/.*\/read/.test(url)&&response.ok)response.clone().json().then(result=>{if(result.success===true)schedule();}).catch(()=>{});
 return response;
};
const style=document.createElement('style');style.textContent=
'#notifyPanel{z-index:2147480000!important;max-width:calc(100vw - 16px)!important;box-sizing:border-box!important;overflow:hidden!important;border-radius:8px!important}#notifyPanel:before{display:none!important}#notifyPanel .notify-head,#notifyPanel .notify-tools,#notifyPanel .notify-date,#notifyPanel .notify-footer{flex-shrink:0!important}#notifyPanel .notify-tabs{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;gap:5px!important;white-space:normal!important}#notifyPanel .notify-tab{flex:0 0 auto!important;margin:0!important}#notifyPanel .notify-list{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important}#notifyPanel .notify-item{grid-template-columns:30px minmax(0,1fr) 98px!important;box-sizing:border-box!important;cursor:pointer}#notifyPanel .notify-copy{min-width:0!important;overflow-wrap:anywhere!important}#notifyPanel .notify-time{white-space:normal!important;font-size:10px!important}#notifyPanel .qmes-unread-item .notify-dot{background:#fff0f0;color:#d92d20}#notifyBtn{position:relative!important;overflow:visible!important}#notifyBtn:after,#notifyBtn:before,#notifyBtn .namo-work-dispatch-badge{display:none!important}#notifyBtn .qmes-unread-badge{position:absolute;right:-4px;top:-4px;min-width:17px;height:17px;box-sizing:border-box;padding:0 4px;border-radius:10px;background:#e53935;color:#fff;font:700 10px/17px Arial,sans-serif;text-align:center;border:1px solid #fff;pointer-events:none}#notifyBtn .qmes-unread-badge[hidden]{display:none!important}#notifyBtn.qmes-has-unread svg{stroke:#d92d20!important}';
document.head.append(style);refresh();setInterval(refresh,20000);
})();
