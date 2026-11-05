/* Movable home cards; only layout coordinates are stored per account in this browser. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.mount(root);})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const names=['memo','work','guide'];
function bounded(base,stage,size,offset){
 const clamp=(v,low,high)=>Math.max(low,Math.min(Math.max(low,high),v));
 return {x:clamp(offset.x,8-base.left,stage.width-size.width-8-base.left),y:clamp(offset.y,8-base.top,stage.height-size.height-8-base.top)};
}
function decode(value){
 let data;try{data=JSON.parse(value);}catch(_){return {};}
 if(data?.version!==1||!data.cards||typeof data.cards!=='object')return {};
 const result={};for(const name of names){const p=data.cards[name];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))result[name]={x:Math.max(-1,Math.min(1,p.x)),y:Math.max(-1,Math.min(1,p.y))};}return result;
}
function mount(root){
 const document=root.document,stage=document.getElementById('stage'),side=document.querySelector('.right-side');
 if(!stage||!side)return;
 const selected=[
 ['memo',document.getElementById('personal-memo-card'),'.pm-head','개인 메모'],
 ['work',side.querySelector('.side-card'),'.card-heading','나의 업무 현황'],
 ['guide',side.querySelector('.notice-card'),'.head','QMES 이용가이드']
 ].filter(row=>row[1]);
 let key='',saved={},drag=null,z=10,resizeFrame=0;
 const items=selected.map(([name,card,selector,label])=>{
  const handle=card.querySelector(selector),meta={name,card,handle,label,offset:{x:0,y:0},originalTransform:card.style.transform,originalPosition:card.style.position,originalZ:card.style.zIndex};
  card.classList.add('portal-movable-card');
  if(handle){handle.classList.add('portal-card-handle');handle.tabIndex=0;handle.setAttribute('aria-label',label+' 위치 이동. 방향키로 이동, Home 키 또는 더블클릭으로 기본 위치.');handle.title='제목을 잡고 이동 · 더블클릭하면 기본 위치';}
  return meta;
 });
 const reset=document.createElement('button');reset.type='button';reset.className='portal-layout-reset';reset.textContent='카드 배치 초기화';reset.title='개인 메모 · 나의 업무 현황 · 이용가이드의 기본 위치로 되돌립니다.';stage.append(reset);
 const enabled=()=>root.innerWidth>1080;
 function paint(meta,offset){meta.offset=offset;meta.card.style.position='relative';meta.card.style.transform='translate('+Math.round(offset.x)+'px,'+Math.round(offset.y)+'px)';}
 function geometry(meta){
  const sr=stage.getBoundingClientRect(),cr=meta.card.getBoundingClientRect();
  return {base:{left:cr.left-sr.left-meta.offset.x,top:cr.top-sr.top-meta.offset.y},stage:{width:sr.width,height:sr.height},size:{width:cr.width,height:cr.height}};
 }
 function apply(meta,wanted){const g=geometry(meta);paint(meta,bounded(g.base,g.stage,g.size,wanted));}
 function restore(){
  for(const meta of items){
   meta.card.style.transform=meta.originalTransform;meta.card.style.position=meta.originalPosition;meta.card.style.zIndex=meta.originalZ;meta.offset={x:0,y:0};
  }
 }
 function layout(){
  if(!enabled()){restore();return;}
  restore();const r=stage.getBoundingClientRect();
  for(const meta of items){const pos=saved[meta.name]||{x:0,y:0};apply(meta,{x:pos.x*r.width,y:pos.y*r.height});}
 }
 function persist(meta){
  const r=stage.getBoundingClientRect();saved[meta.name]={x:meta.offset.x/Math.max(1,r.width),y:meta.offset.y/Math.max(1,r.height)};
  if(key)try{root.localStorage.setItem(key,JSON.stringify({version:1,cards:saved}));}catch(_){}
 }
 function account(userId){
  const next=userId?'namo-portal-card-layout-v1:'+String(userId):'';
  if(next===key)return;key=next;saved={};
  if(key)try{saved=decode(root.localStorage.getItem(key));}catch(_){}
  layout();
 }
 function resetOne(meta){delete saved[meta.name];meta.card.style.transform=meta.originalTransform;meta.offset={x:0,y:0};apply(meta,{x:0,y:0});persist(meta);}
 reset.onclick=()=>{saved={};if(key)try{root.localStorage.removeItem(key);}catch(_){}layout();};
 for(const meta of items){
  const handle=meta.handle;if(!handle)continue;
  handle.addEventListener('pointerdown',event=>{
   if(!enabled()||event.button!==0||drag||event.target.closest('button,a,input,textarea,select,[contenteditable="true"]'))return;
   event.preventDefault();const g=geometry(meta);drag={meta,id:event.pointerId,x:event.clientX,y:event.clientY,offset:{...meta.offset},g};
   meta.card.style.zIndex=String(++z);handle.classList.add('moving');handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove',event=>{
   if(!drag||drag.meta!==meta||drag.id!==event.pointerId)return;event.preventDefault();
   paint(meta,bounded(drag.g.base,drag.g.stage,drag.g.size,{x:drag.offset.x+event.clientX-drag.x,y:drag.offset.y+event.clientY-drag.y}));
  });
  const finish=event=>{
   if(!drag||drag.meta!==meta||drag.id!==event.pointerId)return;drag=null;handle.classList.remove('moving');persist(meta);
   if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
  };
  for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,finish);
  handle.addEventListener('dblclick',event=>{if(!enabled()||event.target.closest('button,a,input,textarea,select'))return;event.preventDefault();resetOne(meta);});
  handle.addEventListener('keydown',event=>{
   if(!enabled()||event.target!==handle)return;
   if(event.key==='Home'){event.preventDefault();resetOne(meta);return;}
   const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},direction=directions[event.key];if(!direction)return;
   event.preventDefault();const step=event.shiftKey?30:10;apply(meta,{x:meta.offset.x+direction[0]*step,y:meta.offset.y+direction[1]*step});persist(meta);
  });
 }
 root.addEventListener('resize',()=>{if(!resizeFrame)resizeFrame=root.requestAnimationFrame(()=>{resizeFrame=0;layout();});});
 root.addEventListener('message',event=>{if(event.origin!==root.location.origin||event.source!==root.parent||event.data?.channel!=='NAMO_QMES_PORTAL_20261014'||event.data.type!=='profile')return;account(event.data.userId||'');});
 try{account(root.parent.__QMES_CURRENT_USER__?.id||'');}catch(_){}
 layout();root.parent.postMessage({channel:'NAMO_QMES_PORTAL_20261014',type:'ready'},root.location.origin);
 const style=document.createElement('style');style.textContent='.right-side{overflow:visible!important}.portal-card-handle{cursor:grab;touch-action:none;user-select:none}.portal-card-handle:focus-visible{outline:2px solid #2f8de4;outline-offset:4px;border-radius:4px}.portal-card-handle.moving{cursor:grabbing}.portal-movable-card{will-change:auto}.portal-layout-reset{position:absolute;right:30px;top:18px;z-index:6;padding:6px 10px;border:1px solid #d5e1ed;border-radius:5px;background:rgba(255,255,255,.94);color:#31516f;font:11px Pretendard,"Malgun Gothic",sans-serif;cursor:pointer}@media(max-width:1080px){.portal-layout-reset{display:none}.portal-card-handle{cursor:default;touch-action:auto}}';document.head.append(style);
}
return {bounded,decode,mount};
});
