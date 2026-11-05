/* Home-screen grid placement across the full stage, with stable non-overlapping slots. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.mount(root);})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const names=['memo','work','guide'];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function decode(value){let data;try{data=JSON.parse(value);}catch(_){return {};}if(data?.version!==3)return {};const result={};for(const name of names){const p=data.cards?.[name];if(p&&Number.isInteger(p.col)&&Number.isInteger(p.row)&&p.col>=0&&p.col<3&&p.row>=0&&p.row<100)result[name]={col:p.col,row:p.row};}return result;}
const span=(sizes,name,rows)=>clamp(Math.ceil(sizes[name]||1),1,rows);
const overlap=(a,sa,b,sb)=>a.col===b.col&&a.row<b.row+sb&&b.row<a.row+sa;
function free(pos,name,layout,sizes,rows){const s=span(sizes,name,rows);return pos.col>=0&&pos.col<3&&pos.row>=0&&pos.row+s<=rows&&Object.entries(layout).every(([other,p])=>other===name||!overlap(pos,s,p,span(sizes,other,rows)));}
function nearest(desired,name,layout,sizes,rows){let best=null,cost=Infinity;for(let col=0;col<3;col++)for(let row=0;row<=rows-span(sizes,name,rows);row++){const p={col,row},d=Math.abs(col-desired.col)*4+Math.abs(row-desired.row);if(d<cost&&free(p,name,layout,sizes,rows)){best=p;cost=d;}}return best;}
function pack(layout,sizes,rows){rows=Math.max(1,rows);const placed={},defaults={memo:{col:0,row:0},work:{col:2,row:0},guide:{col:2,row:span(sizes,'work',rows)+1}};for(const name of names){placed[name]=nearest(layout[name]||defaults[name],name,placed,sizes,rows);}return placed;}
function move(layout,sizes,name,desired,rows){
 const target={col:clamp(Math.round(desired.col),0,2),row:clamp(Math.round(desired.row),0,rows-span(sizes,name,rows))},others=Object.fromEntries(Object.entries(layout).filter(([id])=>id!==name)),blocked=Object.keys(others).filter(id=>overlap(target,span(sizes,name,rows),others[id],span(sizes,id,rows)));
 if(blocked.length===1){const other=blocked[0],rest=Object.fromEntries(Object.entries(others).filter(([id])=>id!==other)),source=layout[name];if(free(target,name,rest,sizes,rows)&&free(source,other,{...rest,[name]:target},sizes,rows))return {...layout,[name]:target,[other]:{...source}};}
 const dest=nearest(target,name,others,sizes,rows);return dest?{...layout,[name]:dest}:layout;
}
function mount(root){
 const document=root.document,stage=document.getElementById('stage'),side=document.querySelector('.right-side');if(!stage||!side)return;
 const found=[['memo',document.getElementById('personal-memo-card'),'.pm-head','개인 메모'],['work',side.querySelector('.side-card'),'.card-heading','나의 업무 현황'],['guide',side.querySelector('.notice-card'),'.head','QMES 이용가이드']].filter(v=>v[1]);
 const cards=found.map(([name,card,selector,label])=>({name,card,handle:card.querySelector(selector),label,css:card.style.cssText}));
 let key='',layout={},sizes={},config=null,editing=false,drag=null,frame=0;
 const toolbar=document.createElement('div');toolbar.className='portal-grid-toolbar';
 const button=document.createElement('button');button.type='button';button.textContent='카드 배열';button.setAttribute('aria-pressed','false');
 const hint=document.createElement('span');hint.textContent='왼쪽·가운데·오른쪽 빈자리에 놓으세요';hint.hidden=true;toolbar.append(hint,button);stage.append(toolbar);
 const grid=document.createElement('div');grid.className='portal-home-grid';grid.hidden=true;grid.setAttribute('aria-hidden','true');stage.append(grid);
 const placeholder=document.createElement('div');placeholder.className='portal-home-target';placeholder.hidden=true;stage.append(placeholder);
 const enabled=()=>root.innerWidth>1080;
 function point(p){return {left:config.margin+p.col*config.lane+(config.lane-config.width)/2,top:config.top+p.row*config.unit};}
 function draw(proposal=layout){
  if(!config)return;
  for(const item of cards){if(drag?.item===item)continue;const p=point(proposal[item.name]);Object.assign(item.card.style,{position:'absolute',left:Math.round(p.left)+'px',top:Math.round(p.top)+'px',width:config.width+'px',margin:'0',zIndex:'4'});}
 }
 function build(){
  if(drag)return;
  if(!enabled()){side.classList.remove('portal-full-layout');for(const item of cards)item.card.style.cssText=item.css;config=null;mode(false);return;}
  side.classList.add('portal-full-layout');const rect=stage.getBoundingClientRect(),width=root.innerWidth>=1750?312:root.innerWidth<=1350?245:287;
  config={margin:16,top:86,unit:40,width:Math.min(width,(rect.width-32)/3-16),lane:(rect.width-32)/3,rows:Math.max(1,Math.floor((rect.height-86-56)/40))};
  sizes={};for(const item of cards){Object.assign(item.card.style,{width:config.width+'px',maxHeight:config.rows*40-8+'px',overflowY:'auto',position:'absolute'});sizes[item.name]=Math.ceil((item.card.getBoundingClientRect().height+10)/40);}
  layout=pack(layout,sizes,config.rows);draw();
  grid.replaceChildren();Object.assign(grid.style,{left:'16px',right:'16px',top:config.top+'px',height:config.rows*40+'px',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gridTemplateRows:'repeat('+config.rows+',40px)'});
  for(let i=0;i<config.rows*3;i++){const cell=document.createElement('div');cell.className='portal-home-cell';grid.append(cell);}
 }
 function save(){if(key)try{root.localStorage.setItem(key,JSON.stringify({version:3,cards:layout}));}catch(_){}}
 function mode(value){editing=value&&enabled();side.classList.toggle('portal-grid-editing',editing);button.textContent=editing?'완료':'카드 배열';button.setAttribute('aria-pressed',String(editing));hint.hidden=!editing;grid.hidden=!editing;for(const item of cards)if(item.handle){item.handle.tabIndex=editing?0:-1;item.handle.title=editing?'드래그 또는 방향키로 화면 전체에 배치':'';}}
 function stop(commit){
  if(!drag)return;const current=drag;drag=null;layout=commit?current.proposal:current.before;placeholder.hidden=true;current.item.card.classList.remove('portal-grid-lifted');draw();
  if(current.item.handle.hasPointerCapture(current.id))current.item.handle.releasePointerCapture(current.id);if(commit)save();
 }
 function account(id){const next=id?'namo-portal-card-grid-v3:'+String(id):'';if(next===key)return;stop(false);key=next;layout={};if(key)try{layout=decode(root.localStorage.getItem(key));}catch(_){}build();}
 button.onclick=()=>{stop(true);mode(!editing);};
 for(const item of cards){
  item.card.classList.add('portal-grid-card');const handle=item.handle;if(!handle)continue;handle.classList.add('portal-grid-handle');handle.setAttribute('aria-label',item.label+' 카드. 배열 모드에서 방향키 또는 드래그로 왼쪽·가운데·오른쪽에 배치합니다.');
  handle.addEventListener('pointerdown',event=>{
   if(!editing||!config||drag||event.button!==0||event.target.closest('button,a,input,textarea,select,[contenteditable="true"]'))return;
   event.preventDefault();const rect=item.card.getBoundingClientRect();drag={item,id:event.pointerId,before:JSON.parse(JSON.stringify(layout)),proposal:layout,dx:event.clientX-rect.left,dy:event.clientY-rect.top};item.card.classList.add('portal-grid-lifted');item.card.style.zIndex='30';handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove',event=>{
   if(!drag||drag.item!==item||drag.id!==event.pointerId)return;event.preventDefault();
   const rect=stage.getBoundingClientRect(),left=event.clientX-drag.dx-rect.left,top=event.clientY-drag.dy-rect.top;
   item.card.style.left=clamp(left,4,rect.width-config.width-4)+'px';item.card.style.top=clamp(top,4,rect.height-40)+'px';
   const desired={col:Math.round((left+config.width/2-config.margin-config.lane/2)/config.lane),row:Math.round((top-config.top)/config.unit)};
   drag.proposal=move(drag.before,sizes,item.name,desired,config.rows);draw(drag.proposal);
   const p=point(drag.proposal[item.name]);placeholder.hidden=false;Object.assign(placeholder.style,{left:p.left+'px',top:p.top+'px',width:config.width+'px',height:span(sizes,item.name,config.rows)*40-10+'px'});
  });
  handle.addEventListener('pointerup',event=>{if(drag?.item===item&&drag.id===event.pointerId)stop(true);});
  for(const type of ['pointercancel','lostpointercapture'])handle.addEventListener(type,event=>{if(drag?.item===item&&drag.id===event.pointerId)stop(false);});
  handle.addEventListener('keydown',event=>{
   if(!editing||!config||event.target!==handle)return;
   const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=deltas[event.key];if(!d)return;event.preventDefault();const p=layout[item.name];layout=move(layout,sizes,item.name,{col:p.col+d[0],row:p.row+d[1]},config.rows);draw();save();handle.focus();
  });
 }
 const schedule=()=>{if(!frame)frame=root.requestAnimationFrame(()=>{frame=0;build();});};
 root.addEventListener('resize',()=>{stop(false);schedule();});
 if(root.ResizeObserver){const observer=new root.ResizeObserver(schedule);observer.observe(stage);for(const item of cards)observer.observe(item.card);}
 root.addEventListener('message',event=>{if(event.origin!==root.location.origin||event.source!==root.parent||event.data?.channel!=='NAMO_QMES_PORTAL_20261014'||event.data.type!=='profile')return;account(event.data.userId||'');});
 try{account(root.parent.__QMES_CURRENT_USER__?.id||'');}catch(_){}
 build();mode(false);root.parent.postMessage({channel:'NAMO_QMES_PORTAL_20261014',type:'ready'},root.location.origin);
 const style=document.createElement('style');style.textContent='.right-side.portal-full-layout{position:static!important;display:contents!important}.portal-grid-toolbar{position:absolute;right:30px;top:18px;z-index:7;display:flex;gap:10px;align-items:center}.portal-grid-toolbar button{border:1px solid #d5e1ed;border-radius:7px;background:rgba(255,255,255,.95);padding:6px 12px;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif;cursor:pointer}.portal-grid-toolbar button[aria-pressed="true"]{background:#2f8de4;border-color:#2f8de4;color:#fff}.portal-grid-toolbar span{color:#fff;font:11px Pretendard,"Malgun Gothic",sans-serif;text-shadow:0 1px 3px #173b61}.portal-grid-toolbar span[hidden],.portal-home-grid[hidden],.portal-home-target[hidden]{display:none!important}.portal-home-grid{position:absolute;z-index:3;display:grid;pointer-events:none;border-radius:10px;background:#173b6122}.portal-home-cell{border:1px dashed #d9ecfa55;border-radius:7px;margin:2px 6px}.portal-home-target{position:absolute;z-index:3;border:2px dashed #5bb1ff;border-radius:13px;background:#e9f5ff77;pointer-events:none;box-sizing:border-box}.portal-grid-editing .portal-grid-handle{cursor:grab;touch-action:none;user-select:none}.portal-grid-editing .portal-grid-card{outline:1px dashed #8cc6fa;outline-offset:3px}.portal-grid-lifted{opacity:.92;box-shadow:0 16px 40px #173b6166!important;transform:scale(1.015);pointer-events:none}.portal-grid-handle:focus-visible{outline:2px solid #2f8de4;outline-offset:3px}@media(max-width:1080px){.right-side.portal-full-layout{display:none!important}.portal-grid-toolbar,.portal-home-grid,.portal-home-target{display:none!important}}';document.head.append(style);
}
return {decode,pack,move,overlap,mount};
});
