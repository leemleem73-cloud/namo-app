(()=>{'use strict';
const panel=document.getElementById('notifyPanel'),button=document.getElementById('notifyBtn'),list=document.getElementById('notifyList'),tabs=document.getElementById('notifyTabs');
if(!panel||!button||!list)return;document.body.append(panel);
const modules={dashboard:'종합',orders:'수주납기',purchase:'구매발주',work:'작업지시',incoming:'수입검사',process:'공정검사',outgoing:'출하검사',ncr:'부적합',spcTrend:'SPC',changeControl:'변경관리',lotTrace:'LOT 추적',equipment:'설비관리',instrumentMgmt:'계측기',calibrationMgmt:'검교정',standard:'문서관리',approval:'전자결재'};
const kinds={orders:'delivery',work:'work',incoming:'iqc',process:'pqc',outgoing:'oqc'};
for(const [page,title]of Object.entries(modules)){
 const kind=kinds[page]||page;if(tabs.querySelector('[data-filter="'+kind+'"]'))continue;
 const tab=document.createElement('button');tab.type='button';tab.className='notify-tab';tab.dataset.filter=kind;tab.textContent=title;tabs.append(tab);
}
let badge=button.querySelector('.qmes-unread-badge');if(!badge){badge=document.createElement('span');badge.className='qmes-unread-badge';button.append(badge);}
const pager=document.createElement('div');pager.className='qmes-notify-pager';pager.setAttribute('aria-label','알림 페이지');panel.querySelector('.notify-footer').before(pager);
let page=1,pages=1,total=0,unread=0,request=0,timer=0,rows=[],allBusy=false;
const actions=new Set();
function badgeState(){
 badge.textContent=unread>99?'99+':String(unread);badge.hidden=!unread;button.classList.toggle('qmes-has-unread',unread>0);
 button.setAttribute('aria-label','통합알림'+(unread?' · 읽지 않은 알림 '+unread+'건':''));button.setAttribute('aria-controls','notifyPanel');
}
function position(){
 const open=panel.classList.contains('open');button.setAttribute('aria-expanded',String(open));if(!open)return;
 const r=button.getBoundingClientRect(),width=Math.min(520,innerWidth-16),top=Math.max(8,Math.min(r.bottom+8,innerHeight-120)),left=Math.max(8,Math.min(r.right-width,innerWidth-width-8));
 Object.entries({position:'fixed',width:width+'px',left:left+'px',right:'auto',top:top+'px',height:'min(700px, calc(100dvh - '+(top+10)+'px))'}).forEach(([key,value])=>{if(panel.style.getPropertyValue(key)!==value)panel.style.setProperty(key,value,'important');});
}
async function api(path='',options={}){
 const response=await fetch('/api/qmes/notification-history'+path,{credentials:'same-origin',cache:'no-store',...options}),body=await response.json();
 if(!response.ok||body.success===false)throw Error(body.message||'알림 처리 실패');return body;
}
function render(){
 list.replaceChildren();
 if(!rows.length){const empty=document.createElement('div');empty.className='notify-empty';empty.style.display='block';empty.textContent='선택한 기간에 해당하는 알림이 없습니다.';list.append(empty);}
 rows.forEach(n=>{
  const row=document.createElement('div');row.className='notify-item qmes-history-item'+(n.read_at?' is-read':'');row.dataset.source=n.source;row.dataset.id=n.id;row.dataset.page=n.page;row.dataset.createdAt=n.created_at;row.dataset.kind=kinds[n.page]||n.page;row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',n.title+(n.read_at?' · 읽음':' · 읽지 않음'));row.title='알림을 누르면 읽음 처리됩니다.';
  const dot=document.createElement('span');dot.className='qmes-history-dot';dot.setAttribute('aria-hidden','true');
  const copy=document.createElement('div');copy.className='notify-copy';
  const title=document.createElement('b');title.textContent=n.title;const message=document.createElement('span');message.textContent=n.message||'';copy.append(title,message);
  const side=document.createElement('div');side.className='qmes-history-side';
  const date=document.createElement('time');date.dateTime=n.created_at;date.textContent=new Date(n.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
  const controls=document.createElement('div');controls.className='qmes-history-controls';
  const view=document.createElement('button');view.type='button';view.dataset.historyAction='view';view.textContent='화면 보기';view.setAttribute('aria-label',(modules[n.page]||'해당 메뉴')+' 화면 보기');
  const remove=document.createElement('button');remove.type='button';remove.dataset.historyAction='delete';remove.textContent='삭제';remove.setAttribute('aria-label',n.title+' 알림 삭제');
  controls.append(view,remove);side.append(date,controls);row.append(dot,copy,side);list.append(row);
 });
 pager.replaceChildren();
 const previous=document.createElement('button');previous.type='button';previous.textContent='‹';previous.setAttribute('aria-label','이전 알림 페이지');previous.disabled=page<=1;previous.onclick=()=>refresh({page:page-1});
 const current=document.createElement('span');current.textContent=page+' / '+pages+' · 총 '+total+'건';current.setAttribute('aria-live','polite');
 const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','다음 알림 페이지');next.disabled=page>=pages;next.onclick=()=>refresh({page:page+1});
 pager.append(previous,current,next);badgeState();
}
function filter(){return tabs.querySelector('.notify-tab.active')?.dataset.filter||'all';}
async function refresh(options={}){
 if(document.hidden)return;if(options.reset)page=1;else if(options.page)page=options.page;
 const version=++request;
 try{
  await window.qmesAuthDataReady?.wait();
  const query=new URLSearchParams((window.qmesNotificationDates?.query()||'').replace(/^\?/,''));
  query.set('kind',filter());query.set('page',String(page));
  const result=await api('?'+query);
  if(version!==request)return;
  rows=result.data||[];page=result.page;pages=result.pages;total=result.total;unread=Number(result.unread||0);render();
 }catch(error){if(version===request){console.warn('[QMES notification history]',error.message);if(panel.classList.contains('open'))window.toast?.(error.message);}}
}
window.qmesNotificationHistory={refresh};
window.loadQualityNotifications=()=>refresh();window.qmesReloadDispatchNotifications=()=>refresh();
function schedule(){clearTimeout(timer);timer=setTimeout(()=>refresh(),500);}
async function act(row,action){
 const source=row.dataset.source,id=row.dataset.id,key=source+':'+id;if(actions.has(key))return;actions.add(key);
 try{
  const item=rows.find(n=>n.source===source&&String(n.id)===id);
  if(action==='delete'||!item?.read_at){
   await api('/'+encodeURIComponent(source)+'/'+encodeURIComponent(id)+'/'+(action==='delete'?'delete':'read'),{method:'POST'});
   if(item&&!item.read_at)unread=Math.max(0,unread-1);
   if(action==='delete')rows=rows.filter(n=>n!==item);else if(item)item.read_at=new Date().toISOString();
   render();
  }
  if(action==='view'){panel.classList.remove('open');button.classList.remove('notify-active');document.querySelector('.menu[data-page="'+row.dataset.page+'"]')?.click();position();}
  if(action==='delete')await refresh();else badgeState();
 }catch(error){window.toast?.(error.message);}finally{actions.delete(key);}
}
window.addEventListener('click',async event=>{
 const tab=event.target.closest('#notifyTabs .notify-tab');
 if(tab){event.preventDefault();event.stopImmediatePropagation();tabs.querySelectorAll('.notify-tab').forEach(el=>el.classList.toggle('active',el===tab));refresh({reset:true});return;}
 const all=event.target.closest('#notifyReadAll');
 if(all){event.preventDefault();event.stopImmediatePropagation();if(allBusy)return;allBusy=true;all.disabled=true;try{await api('/read-all',{method:'POST'});unread=0;rows.forEach(n=>n.read_at=n.read_at||new Date().toISOString());render();}catch(error){window.toast?.(error.message);}finally{allBusy=false;all.disabled=false;}return;}
 const row=event.target.closest('#notifyList .qmes-history-item');if(!row)return;
 event.preventDefault();event.stopImmediatePropagation();act(row,event.target.closest('[data-history-action]')?.dataset.historyAction||'read');
},true);
list.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('.qmes-history-item')){event.preventDefault();act(event.target,'read');}});
button.addEventListener('click',()=>{requestAnimationFrame(position);refresh();});
new MutationObserver(position).observe(panel,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',position);document.addEventListener('scroll',()=>{if(panel.classList.contains('open'))position();},true);
window.addEventListener('focus',()=>refresh());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
const originalFetch=window.fetch;
window.fetch=async function(input,options){
 const response=await originalFetch.apply(this,arguments),url=String(input?.url||input||''),method=String(options?.method||input?.method||'GET').toUpperCase();
 if(['POST','PUT','PATCH'].includes(method)&&url.includes('/api/')&&!/notification|\/auth\/|\/inbox\/.*\/read/.test(url)&&response.ok)response.clone().json().then(body=>{if(body.success===true)schedule();}).catch(()=>{});
 return response;
};
const style=document.createElement('style');style.textContent=
'#notifyPanel{z-index:2147480000!important;box-sizing:border-box!important;max-width:calc(100vw - 16px)!important;border-radius:8px!important;overflow:hidden!important}#notifyPanel:before{display:none!important}#notifyPanel .notify-head,#notifyPanel .notify-tools,#notifyPanel .notify-date,#notifyPanel .notify-footer{flex-shrink:0!important}#notifyPanel .notify-tabs{display:flex!important;flex-wrap:wrap!important;gap:5px!important;white-space:normal!important;overflow:visible!important}#notifyPanel .notify-tab{flex:0 0 auto!important;margin:0!important}#notifyPanel .notify-list{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow:auto!important}#notifyPanel .qmes-history-item{display:grid!important;grid-template-columns:8px minmax(0,1fr) 118px!important;gap:9px!important;align-items:start!important;padding:13px 14px!important;cursor:pointer;opacity:1!important}#notifyPanel .qmes-history-dot{display:block;width:6px;height:6px;background:#e53935;border-radius:50%;margin-top:7px;flex-shrink:0}#notifyPanel .is-read .qmes-history-dot{visibility:hidden}#notifyPanel .notify-copy{min-width:0!important;overflow-wrap:anywhere!important}#notifyPanel .qmes-history-side time{display:block;font-size:10px;line-height:1.45;color:#8898ad;white-space:normal}#notifyPanel .qmes-history-controls{display:flex;justify-content:flex-end;gap:4px;margin-top:7px}#notifyPanel .qmes-history-controls>button{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:25px!important;height:auto!important;width:auto!important;min-width:0!important;padding:3px 6px!important;border:1px solid #cbd8e6!important;border-radius:4px!important;background:#fff!important;color:#27618e!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif!important;font-size:11px!important;font-weight:600!important;font-style:normal!important;line-height:1.4!important;letter-spacing:0!important;word-break:keep-all!important;white-space:nowrap!important;text-shadow:none!important;transform:none!important;text-indent:0!important;cursor:pointer}#notifyPanel .qmes-history-controls>[data-history-action=delete]{color:#c43a3a!important;border-color:#efd0d0!important}.qmes-notify-pager{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:12px;padding:9px;border-top:1px solid #e1e8f0;background:#fff;color:#64788e;font-size:11px}.qmes-notify-pager button{width:25px;height:25px;background:#fff;border:1px solid #d2deec;border-radius:4px;color:#345b80;cursor:pointer}.qmes-notify-pager button:disabled{opacity:.35;cursor:default}#notifyBtn{position:relative!important;overflow:visible!important}#notifyBtn:after,#notifyBtn:before,#notifyBtn .namo-work-dispatch-badge{display:none!important}#notifyBtn .qmes-unread-badge{position:absolute;right:-4px;top:-4px;min-width:17px;height:17px;box-sizing:border-box;padding:0 4px;border-radius:10px;background:#e53935;color:#fff;font:700 10px/17px Arial,sans-serif;text-align:center;border:1px solid #fff;pointer-events:none}#notifyBtn .qmes-unread-badge[hidden]{display:none!important}';
document.head.append(style);refresh();setInterval(()=>refresh(),20000);
})();
