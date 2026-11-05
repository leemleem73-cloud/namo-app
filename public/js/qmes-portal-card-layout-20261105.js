/* Full-canvas card placement: no column snapping or reserved edge bands. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.mount(root);})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const names=['memo','work','guide'],clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
function decode(value){let data;try{data=JSON.parse(value);}catch(_){return {};}if(data?.version!==4)return {};const out={};for(const name of names){const p=data.cards?.[name];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1)out[name]={x:p.x,y:p.y};}return out;}
function clampPoint(p,screen,size){return {x:clamp(p.x,0,screen.width-size.width),y:clamp(p.y,0,screen.height-size.height)};}
function toNormalized(p,screen,size){const point=clampPoint(p,screen,size);return {x:point.x/Math.max(1,screen.width-size.width),y:point.y/Math.max(1,screen.height-size.height)};}
function fromNormalized(p,screen,size){return clampPoint({x:p.x*Math.max(0,screen.width-size.width),y:p.y*Math.max(0,screen.height-size.height)},screen,size);}
function snap(point,screen,size,others=[],previous=null,threshold=8){
 const raw=clampPoint(point,screen,size),xs=[],ys=[];
 const add=(list,value,guide,max)=>{if(value>=0&&value<=max)list.push({value,guide});};
 const maxX=Math.max(0,screen.width-size.width),maxY=Math.max(0,screen.height-size.height);
 for(const ratio of [0,.5,1]){add(xs,screen.width*ratio-size.width*ratio,screen.width*ratio,maxX);add(ys,screen.height*ratio-size.height*ratio,screen.height*ratio,maxY);}
 for(const other of others){
  for(const ratio of [0,.5,1]){add(xs,other.x+other.width*ratio-size.width*ratio,other.x+other.width*ratio,maxX);add(ys,other.y+other.height*ratio-size.height*ratio,other.y+other.height*ratio,maxY);}
  add(xs,other.x+other.width+16,other.x+other.width+16,maxX);add(xs,other.x-size.width-16,other.x-16,maxX);
  add(ys,other.y+other.height+16,other.y+other.height+16,maxY);add(ys,other.y-size.height-16,other.y-16,maxY);
 }
 const pick=(value,candidates,old)=>{if(old&&candidates.some(v=>Math.abs(v.value-old.value)<.01&&Math.abs(v.guide-old.guide)<.01)&&Math.abs(value-old.value)<=threshold+6)return old;let best=null,distance=threshold+.001;for(const candidate of candidates){const d=Math.abs(candidate.value-value);if(d<distance){best=candidate;distance=d;}}return best;};
 const x=pick(raw.x,xs,previous?.x),y=pick(raw.y,ys,previous?.y);
 return {point:{x:x?.value??raw.x,y:y?.value??raw.y},x,y};
}
function legacy(value,screen,sizes){let data;try{data=JSON.parse(value);}catch(_){return {};}if(data?.version!==3)return {};const out={};for(const name of names){const p=data.cards?.[name];if(p&&Number.isInteger(p.col)&&p.col>=0&&p.col<=2&&Number.isInteger(p.row)&&p.row>=0&&p.row<100)out[name]={x:p.col/2,y:clamp((86+p.row*40)/Math.max(1,screen.height-(sizes[name]?.height||0)),0,1)};}return out;}
function mount(root){
 const document=root.document,stage=document.getElementById('stage'),side=document.querySelector('.right-side');if(!stage||!side)return;
 const found=[['memo',document.getElementById('personal-memo-card'),'개인 메모'],['work',side.querySelector('.side-card'),'나의 업무 현황'],['guide',side.querySelector('.notice-card'),'QMES 이용가이드']].filter(v=>v[1]);
 const cards=found.map(([name,card,label])=>({name,card,label,css:card.style.cssText,suppressUntil:0}));
 let key='',layout={},sizes={},screen=null,drag=null,frame=0,oldLayout=null;
 const target=document.createElement('div');target.className='portal-free-target';target.hidden=true;stage.append(target);
 const guideX=document.createElement('div'),guideY=document.createElement('div');guideX.className='portal-align-guide portal-align-x';guideY.className='portal-align-guide portal-align-y';guideX.hidden=guideY.hidden=true;guideX.setAttribute('aria-hidden','true');guideY.setAttribute('aria-hidden','true');stage.append(guideX,guideY);
 const enabled=()=>root.innerWidth>1080;
 const defaults=()=>({memo:{x:0,y:.15},work:{x:1,y:.03},guide:{x:1,y:.40}});
 function paint(item,p){Object.assign(item.card.style,{position:'absolute',left:Math.round(p.x)+'px',top:Math.round(p.y)+'px',width:sizes[item.name].width+'px',margin:'0',zIndex:'6'});}
 function draw(){if(!screen)return;for(const item of cards)if(drag?.item!==item)paint(item,fromNormalized(layout[item.name],screen,sizes[item.name]));}
 function build(){
  if(drag)return;
  if(!enabled()){side.classList.remove('portal-full-layout');for(const item of cards){item.card.style.cssText=item.css;item.card.tabIndex=-1;}screen=null;return;}
  side.classList.add('portal-full-layout');const rect=stage.getBoundingClientRect();screen={width:rect.width,height:rect.height};
  const width=Math.min(root.innerWidth>=1750?312:root.innerWidth<=1350?245:287,screen.width);
  sizes={};for(const item of cards){item.card.tabIndex=0;Object.assign(item.card.style,{width:width+'px',maxHeight:screen.height+'px',overflowY:'auto',position:'absolute'});sizes[item.name]={width,height:Math.min(screen.height,item.card.getBoundingClientRect().height)};}
  if(oldLayout){layout={...legacy(oldLayout,screen,sizes),...layout};oldLayout=null;}
  const initial=defaults();for(const name of names)layout[name]=layout[name]||initial[name];draw();
 }
 function save(){if(key)try{root.localStorage.setItem(key,JSON.stringify({version:4,cards:layout}));}catch(_){}}
 function stop(commit){
  if(!drag)return;const current=drag;drag=null;
  if(current.started){if(commit)layout[current.item.name]=toNormalized(current.point,screen,sizes[current.item.name]);else layout=current.before;current.item.suppressUntil=Date.now()+500;}
  target.hidden=true;guideX.hidden=guideY.hidden=true;current.item.card.classList.remove('portal-free-lifted');draw();
  if(current.item.card.hasPointerCapture(current.id))current.item.card.releasePointerCapture(current.id);
  if(commit&&current.started)save();
 }
 function account(id){const next=id?'namo-portal-card-free-v4:'+String(id):'';if(next===key)return;stop(false);key=next;layout={};oldLayout=null;if(key)try{layout=decode(root.localStorage.getItem(key));if(!Object.keys(layout).length)oldLayout=root.localStorage.getItem('namo-portal-card-grid-v3:'+String(id));}catch(_){}build();}
 for(const item of cards){
  const card=item.card;card.classList.add('portal-free-card');card.setAttribute('aria-label',item.label+' 카드. 카드 전체를 끌거나 카드에 초점을 두고 방향키로 이동합니다.');card.title='끌어서 이동 · 가까이 놓으면 정렬 · Alt 키로 자유 이동';
  card.addEventListener('pointerdown',event=>{
   item.suppressUntil=0;
   if(!screen||drag||event.button!==0||event.target.closest('input,textarea,select,[contenteditable="true"],[role="slider"]'))return;
   const rect=card.getBoundingClientRect();drag={item,id:event.pointerId,started:false,startX:event.clientX,startY:event.clientY,before:JSON.parse(JSON.stringify(layout)),point:fromNormalized(layout[item.name],screen,sizes[item.name]),dx:event.clientX-rect.left,dy:event.clientY-rect.top};
  });
  card.addEventListener('click',event=>{if(event.detail!==0&&Date.now()<item.suppressUntil){item.suppressUntil=0;event.preventDefault();event.stopImmediatePropagation();}},true);
  card.addEventListener('lostpointercapture',event=>{if(drag?.item===item&&drag.id===event.pointerId)stop(false);});
  card.addEventListener('keydown',event=>{
   if(!screen||event.target!==card)return;
   const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=deltas[event.key];let p=fromNormalized(layout[item.name],screen,sizes[item.name]);
   if(event.key==='Home')p={x:0,y:0};else if(event.key==='End')p={x:screen.width,y:screen.height};else if(d){const step=event.shiftKey?30:10;p={x:p.x+d[0]*step,y:p.y+d[1]*step};}else return;
   event.preventDefault();layout[item.name]=toNormalized(p,screen,sizes[item.name]);draw();save();card.focus();
  });
 }
 root.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  if(!drag.started){
   if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
   drag.started=true;drag.item.card.classList.add('portal-free-lifted');drag.item.card.style.zIndex='30';drag.item.card.setPointerCapture(event.pointerId);
  }
  event.preventDefault();const item=drag.item,rect=stage.getBoundingClientRect(),raw=clampPoint({x:event.clientX-drag.dx-rect.left,y:event.clientY-drag.dy-rect.top},screen,sizes[item.name]);
  const others=cards.filter(other=>other!==item).map(other=>({...fromNormalized(layout[other.name],screen,sizes[other.name]),...sizes[other.name]}));
  const aligned=event.altKey?{point:raw,x:null,y:null}:snap(raw,screen,sizes[item.name],others,drag.aligned);drag.aligned=aligned;drag.point=aligned.point;
  guideX.hidden=!aligned.x;guideY.hidden=!aligned.y;if(aligned.x)guideX.style.left=aligned.x.guide+'px';if(aligned.y)guideY.style.top=aligned.y.guide+'px';
  Object.assign(item.card.style,{left:drag.point.x+'px',top:drag.point.y+'px'});
  target.hidden=false;Object.assign(target.style,{left:drag.point.x+'px',top:drag.point.y+'px',width:sizes[item.name].width+'px',height:sizes[item.name].height+'px'});
 });
 root.addEventListener('pointerup',event=>{if(drag&&drag.id===event.pointerId)stop(true);});
 root.addEventListener('pointercancel',event=>{if(drag&&drag.id===event.pointerId)stop(false);});
 root.addEventListener('keydown',event=>{if(drag&&event.key==='Escape'){event.preventDefault();stop(false);}});
 const schedule=()=>{if(!frame)frame=root.requestAnimationFrame(()=>{frame=0;build();});};root.addEventListener('resize',()=>{stop(false);schedule();});
 if(root.ResizeObserver){const observer=new root.ResizeObserver(schedule);observer.observe(stage);for(const item of cards)observer.observe(item.card);}
 root.addEventListener('message',event=>{if(event.origin!==root.location.origin||event.source!==root.parent||event.data?.channel!=='NAMO_QMES_PORTAL_20261014'||event.data.type!=='profile')return;account(event.data.userId||'');});
 try{account(root.parent.__QMES_CURRENT_USER__?.id||'');}catch(_){}
 build();root.parent.postMessage({channel:'NAMO_QMES_PORTAL_20261014',type:'ready'},root.location.origin);
 const style=document.createElement('style');style.textContent='.right-side.portal-full-layout{position:static!important;display:contents!important}.portal-free-target[hidden],.portal-align-guide[hidden]{display:none!important}.portal-free-target{position:absolute;z-index:3;border:1px dashed #7bbcf4;border-radius:13px;pointer-events:none;box-sizing:border-box}.portal-free-card{cursor:grab;touch-action:none;user-select:none}.portal-free-card :is(input,textarea,select,[contenteditable="true"]){cursor:auto;touch-action:auto;user-select:text}.portal-free-lifted,.portal-free-lifted *{cursor:grabbing!important}.portal-free-lifted{opacity:.94;box-shadow:0 16px 40px #173b6166!important}.portal-align-guide{position:absolute;z-index:12;pointer-events:none;background:#73b8f0;box-shadow:0 0 0 1px #ffffff55}.portal-align-x{top:0;bottom:0;width:1px}.portal-align-y{left:0;right:0;height:1px}.portal-free-card:focus-visible{outline:2px solid #2f8de4;outline-offset:3px}@media(max-width:1080px){.right-side.portal-full-layout{display:none!important}.portal-free-target{display:none!important}.portal-free-card{touch-action:auto;user-select:auto;cursor:auto}}';document.head.append(style);
}
return {decode,clampPoint,toNormalized,fromNormalized,legacy,snap,mount};
});
