/* Phone-style card ordering: stable slots, account-scoped browser preferences. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.mount(root);})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const names=['memo','work','guide'];
function decode(value){let data;try{data=JSON.parse(value);}catch(_){return names.slice();}const order=data?.version===2&&Array.isArray(data.order)?data.order:[];return [...new Set(order.filter(name=>names.includes(name))),...names.filter(name=>!order.includes(name))];}
function reorder(order,name,target){const next=order.filter(v=>v!==name),index=next.indexOf(target);next.splice(index<0?next.length:index,0,name);return next;}
function mount(root){
 const document=root.document,side=document.querySelector('.right-side');if(!side)return;
 const found=[['memo',document.getElementById('personal-memo-card'),'.pm-head','개인 메모'],['work',side.querySelector('.side-card'),'.card-heading','나의 업무 현황'],['guide',side.querySelector('.notice-card'),'.head','QMES 이용가이드']].filter(row=>row[1]);
 const cards=found.map(([name,card,selector,label])=>({name,card,handle:card.querySelector(selector),label}));
 let key='',order=names.slice(),editing=false,drag=null;
 const bar=document.createElement('div');bar.className='portal-arrange-bar';
 const button=document.createElement('button');button.type='button';button.textContent='카드 배열';button.setAttribute('aria-pressed','false');
 const hint=document.createElement('span');hint.textContent='제목을 끌어 순서 변경';hint.hidden=true;bar.append(hint,button);side.append(bar);
 function apply(){for(const name of order){const item=cards.find(v=>v.name===name);if(item)side.append(item.card);}}
 function save(){if(key)try{root.localStorage.setItem(key,JSON.stringify({version:2,order}));}catch(_){}}
 function mode(value){editing=value;side.classList.toggle('portal-arranging',editing);button.textContent=editing?'완료':'카드 배열';button.setAttribute('aria-pressed',String(editing));hint.hidden=!editing;for(const item of cards)if(item.handle){item.handle.tabIndex=editing?0:-1;item.handle.title=editing?'드래그 또는 위·아래 방향키로 순서 변경':'';}}
 function stop(commit){
  if(!drag)return;
  const current=drag;drag=null;
  if(commit){side.insertBefore(current.item.card,current.placeholder);order=[...side.children].map(node=>cards.find(v=>v.card===node)?.name).filter(Boolean);}else order=current.before;
  current.placeholder.remove();current.item.card.style.cssText=current.css;current.item.card.classList.remove('portal-card-lifted');apply();
  if(current.item.handle.hasPointerCapture(current.id))current.item.handle.releasePointerCapture(current.id);
  if(commit)save();
 }
 function account(id){const next=id?'namo-portal-card-order-v2:'+String(id):'';if(next===key)return;stop(false);key=next;order=names.slice();if(key)try{order=decode(root.localStorage.getItem(key));}catch(_){}apply();}
 button.onclick=()=>{stop(true);mode(!editing);};
 for(const item of cards){
  item.card.classList.add('portal-order-card');const handle=item.handle;if(!handle)continue;
  handle.classList.add('portal-order-handle');handle.setAttribute('aria-label',item.label+' 카드. 배열 모드에서 위아래 방향키 또는 드래그로 순서를 변경합니다.');
  handle.addEventListener('pointerdown',event=>{
   if(!editing||root.innerWidth<=1080||drag||event.button!==0||event.target.closest('button,a,input,textarea,select,[contenteditable="true"]'))return;
   event.preventDefault();const rect=item.card.getBoundingClientRect(),placeholder=document.createElement('div');placeholder.className='portal-card-slot';placeholder.style.height=rect.height+'px';placeholder.setAttribute('aria-label','카드를 놓을 자리');side.insertBefore(placeholder,item.card);
   drag={item,id:event.pointerId,before:order.slice(),placeholder,css:item.card.style.cssText,dx:event.clientX-rect.left,dy:event.clientY-rect.top,width:rect.width,height:rect.height};
   Object.assign(item.card.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',margin:'0',zIndex:'30',pointerEvents:'none'});item.card.classList.add('portal-card-lifted');handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove',event=>{
   if(!drag||drag.item!==item||drag.id!==event.pointerId)return;event.preventDefault();
   item.card.style.left=Math.max(4,Math.min(root.innerWidth-drag.width-4,event.clientX-drag.dx))+'px';item.card.style.top=Math.max(4,Math.min(root.innerHeight-40,event.clientY-drag.dy))+'px';
   const others=[...side.children].map(node=>cards.find(v=>v.card===node)).filter(v=>v&&v!==item);
   const target=others.find(v=>{const r=v.card.getBoundingClientRect();return event.clientY<r.top+r.height/2;});
   let next=drag.placeholder.nextElementSibling;while(next===item.card)next=next.nextElementSibling;
   if(target){if(next!==target.card)side.insertBefore(drag.placeholder,target.card);}else if(next)side.append(drag.placeholder);
  });
  handle.addEventListener('pointerup',event=>{if(drag?.item===item&&drag.id===event.pointerId)stop(true);});
  for(const type of ['pointercancel','lostpointercapture'])handle.addEventListener(type,event=>{if(drag?.item===item&&drag.id===event.pointerId)stop(false);});
  handle.addEventListener('keydown',event=>{
   if(!editing||event.target!==handle||!['ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();const index=order.indexOf(item.name),next=index+(event.key==='ArrowUp'?-1:1);if(next<0||next>=order.length)return;[order[index],order[next]]=[order[next],order[index]];apply();save();handle.focus();
  });
 }
 root.addEventListener('resize',()=>{stop(false);if(root.innerWidth<=1080)mode(false);});
 root.addEventListener('message',event=>{if(event.origin!==root.location.origin||event.source!==root.parent||event.data?.channel!=='NAMO_QMES_PORTAL_20261014'||event.data.type!=='profile')return;account(event.data.userId||'');});
 try{account(root.parent.__QMES_CURRENT_USER__?.id||'');}catch(_){}
 apply();mode(false);root.parent.postMessage({channel:'NAMO_QMES_PORTAL_20261014',type:'ready'},root.location.origin);
 const style=document.createElement('style');style.textContent='.portal-arrange-bar{position:absolute;right:0;top:-32px;display:flex;align-items:center;gap:8px;white-space:nowrap}.portal-arrange-bar span{color:#fff;font:11px Pretendard,"Malgun Gothic",sans-serif;text-shadow:0 1px 2px #173b61}.portal-arrange-bar span[hidden]{display:none}.portal-arrange-bar button{border:1px solid #cbd9e7;border-radius:5px;background:rgba(255,255,255,.95);padding:5px 10px;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif;cursor:pointer}.portal-arrange-bar button[aria-pressed="true"]{background:#2f8de4;border-color:#2f8de4;color:#fff}.portal-arranging .portal-order-handle{cursor:grab;touch-action:none;user-select:none}.portal-arranging .portal-order-card{outline:1px dashed #75b1ed;outline-offset:3px;animation:portal-card-wiggle .7s ease-in-out infinite alternate}.portal-card-lifted{animation:none!important;box-shadow:0 12px 35px #173b6155!important;opacity:.94;transform:scale(1.015)}.portal-card-slot{flex:none;border:2px dashed #2f8de4;border-radius:9px;background:rgba(224,242,255,.65);box-sizing:border-box}.portal-order-handle:focus-visible{outline:2px solid #2f8de4;outline-offset:3px}@keyframes portal-card-wiggle{from{transform:rotate(-.35deg)}to{transform:rotate(.35deg)}}@media(prefers-reduced-motion:reduce){.portal-arranging .portal-order-card{animation:none}}@media(max-width:1080px){.portal-arrange-bar{display:none}}';document.head.append(style);
}
return {decode,reorder,mount};
});
