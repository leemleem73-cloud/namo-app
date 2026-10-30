(()=>{'use strict';
const form=document.getElementById('search-form');if(!form)return;
const month=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'numeric'}).format(new Date()));
const previewSeason=new URLSearchParams(location.search).get('previewSeason');
const season=['spring','summer','autumn','winter'].includes(previewSeason)?previewSeason:month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
const scene=document.createElement('div');scene.className='portal-season-scene '+season;scene.setAttribute('aria-hidden','true');
const leaf='<path d="M0 0C-19-24-6-37 9-40C20-22 18-6 0 0Z" fill="currentColor"/><path d="M0 0L8-33" stroke="#fff" stroke-opacity=".45" fill="none"/>';
const mapleLeaf='<path d="M0 3L-3-9L-15-7L-11-16L-23-22L-15-26L-18-36L-8-31L0-44L7-31L18-36L15-26L23-22L11-16L15-7L3-9Z" fill="currentColor"/><path d="M0 10V-34M0-10L-13-23M0-10L13-23" stroke="#78462a" stroke-opacity=".4" stroke-width="1.2" fill="none"/>';
const ginkgoLeaf='<path d="M0 1C-5-8-23-12-23-27C-23-37-10-44-3-40L0-33L3-40C12-44 24-36 23-27C22-12 5-8 0 1Z" fill="currentColor"/><path d="M0 10V0M0 0L-16-28M0 0L-8-34M0 0L8-34M0 0L16-28" stroke="#9f702b" stroke-opacity=".35" fill="none" stroke-width="1"/>';
const autumnColors=['#d95a38','#e99b37','#e4bd43','#bd4d32','#f0cf57','#c87b35','#a94736','#dbab42'];
const flower='<g fill="currentColor">'+[0,72,144,216,288].map(a=>'<ellipse cy="-8" rx="5" ry="8" transform="rotate('+a+')"/>').join('')+'</g><circle r="4" fill="#ffe7a0"/>';
const snow='<path d="M0-13V13M-11-6L11 6M-11 6L11-6" stroke="currentColor" stroke-width="2" fill="none"/>';
scene.innerHTML='<svg viewBox="0 0 850 50" preserveAspectRatio="none">'+(season==='winter'?'<path d="M0 46Q90 23 180 39T380 38T610 36T850 40V50H0Z" fill="#f4faff" opacity=".9"/>':'<path d="M0 48Q210 39 425 46T850 44" fill="none" stroke="currentColor" stroke-opacity=".3"/>')+Array.from({length:season==='autumn'?24:16},(_,i)=>{const x=14+(i*53)%825,y=season==='autumn'?46-(i%3)*3:season==='winter'?15+(i%3)*10:46;return '<g transform="translate('+x+' '+y+') rotate('+((i%5)*23-40)+') scale('+(season==='winter'?'.55':season==='spring'?'.65':'.6')+')" opacity="'+(.65+(i%3)*.1)+'">'+(season==='winter'?snow:season==='spring'?flower:leaf)+'</g>';}).join('')+'</svg>';
const weather=document.createElement('div');weather.className='portal-chungju-weather';weather.setAttribute('aria-live','polite');weather.innerHTML='<span class="portal-weather-icon" aria-hidden="true">⛅</span><b>충주</b><span class="portal-weather-current">날씨 불러오는 중</span><span class="portal-weather-range"></span><button type="button" class="portal-weather-open" aria-haspopup="dialog">상세</button>';
const wrap=document.createElement('div');wrap.className='portal-season-weather';wrap.append(scene,weather);form.before(wrap);
if(['spring','summer','autumn','winter'].includes(previewSeason)){
 const nav=document.createElement('nav');nav.setAttribute('aria-label','계절 미리보기');nav.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;gap:8px;padding:10px;border:1px solid #cbdce9;border-radius:10px;background:white;font:13px Malgun Gothic,sans-serif';
 [['spring','봄'],['summer','여름'],['autumn','가을'],['winter','겨울']].forEach(([value,label])=>{const a=document.createElement('a');const url=new URL(location.href);url.searchParams.set('previewSeason',value);a.href=url.href;a.textContent=label;a.style.cssText='padding:6px 14px;border-radius:6px;text-decoration:none;color:'+(value===season?'white;background:#1686b3':'#28475e;background:#edf5fb');nav.append(a);});document.body.append(nav);
}


if(season==='autumn'){
 scene.innerHTML='';scene.classList.add('is-falling');
 for(let i=0;i<12;i++){const item=document.createElement('span');item.className='portal-falling-leaf';item.style.cssText='left:'+((i*83+17)%96)+'%;width:'+(15+i%6*3)+'px;height:'+(19+i%6*3)+'px;--duration:'+(8+i%5*1.7)+'s;--delay:'+(.05+i*.18)+'s;--drift:'+(i%2?40:-35)+'px;color:'+autumnColors[i%autumnColors.length];item.dataset.leafKind=i%2?'ginkgo':'maple';item.innerHTML='<svg viewBox="-25 -45 55 55">'+(i%2?ginkgoLeaf:mapleLeaf)+'</svg>';scene.append(item);}
}

if(season==='autumn'){
 const pile=document.createElement('div');pile.className='portal-leaf-pile';scene.append(pile);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let count=0;
 function settle(falling){
  if(document.hidden)return;
  const item=document.createElement('span');item.className='portal-settled-leaf';
  const n=count++,drift=falling.style.getPropertyValue('--drift')||'0px';
  item.style.cssText='left:clamp(2%,calc('+falling.style.left+' + '+drift+'),96%);bottom:'+(n%4*2)+'px;--rest-angle:'+((n*47)%140-70)+'deg;color:'+falling.style.color+';width:'+(17+n%5)+'px';
  item.innerHTML='<svg viewBox="-25 -45 55 55">'+(falling.dataset.leafKind==='ginkgo'?ginkgoLeaf:mapleLeaf)+'</svg>';pile.append(item);
  if(pile.children.length>36)pile.firstElementChild.remove();
 }
 scene.querySelectorAll('.portal-falling-leaf').forEach(falling=>falling.addEventListener('animationiteration',event=>{if(event.animationName==='portal-leaf-fall')settle(falling);}));
 if(reduced)[...scene.querySelectorAll('.portal-falling-leaf')].slice(0,6).forEach(settle);
}

if(season!=='autumn'){
 scene.innerHTML='';scene.classList.add('is-animated');
 const ground=document.createElement('div');ground.className='portal-season-ground';scene.append(ground);
 const blossom='<g fill="currentColor"><ellipse cy="-6" rx="4.5" ry="6"/><ellipse cy="-6" rx="4.5" ry="6" transform="rotate(72)"/><ellipse cy="-6" rx="4.5" ry="6" transform="rotate(144)"/><ellipse cy="-6" rx="4.5" ry="6" transform="rotate(216)"/><ellipse cy="-6" rx="4.5" ry="6" transform="rotate(288)"/></g><circle r="2.5" fill="#ffe6a6"/>';
 if(season==='spring'){
  ground.innerHTML='<svg viewBox="0 0 850 90" preserveAspectRatio="xMidYMax meet"><path d="M5 88Q100 56 196 77T393 73T600 70T845 76M75 75L48 39M180 75L210 37M370 75L345 34M570 72L600 36M750 74L779 36" fill="none" stroke="#8a6658" stroke-width="3" stroke-linecap="round"/>'+Array.from({length:24},(_,i)=>'<g class="portal-bloom" style="--bloom-delay:'+(i*.09)+'s;color:'+['#ffc4d9','#fff7fb','#f5a8c6','#ffe2ed'][i%4]+'" transform="translate('+(25+i*34)+' '+(i%3===0?44:65)+')"><g style="--flower-size:'+(0.55+(i%5)*.16)+'">'+blossom+'</g></g>').join('')+'</svg>';
 }else if(season==='summer'){
  ground.innerHTML='<svg viewBox="0 0 850 110" preserveAspectRatio="xMidYMax meet">'+Array.from({length:9},(_,i)=>'<g transform="translate('+(38+i*96)+' 110)"><g class="portal-growing-tree" style="--tree-delay:'+i*.16+'s"><path d="M0 0V-65M0-26L-18-44M0-40L18-57" fill="none" stroke="#806145" stroke-width="4" stroke-linecap="round"/><g class="portal-tree-crown" style="animation-delay:'+(-i*.5)+'s"><ellipse cx="-17" cy="-58" rx="22" ry="24" fill="#4f9a64"/><ellipse cx="17" cy="-63" rx="23" ry="25" fill="#69ad69"/><ellipse cy="-80" rx="24" ry="25" fill="#84be77"/><path d="M-18-67L-8-75M9-87L18-80" stroke="#b3d99a" stroke-width="3" stroke-linecap="round"/></g></g></g>').join('')+'</svg>';
 }else{
  ground.innerHTML='<svg viewBox="0 0 850 100" preserveAspectRatio="none"><path class="portal-snow-bank" d="M0 98C25 98 38 94 65 94S108 83 145 86S190 96 224 94S265 73 306 77S350 91 390 90S428 84 462 87S501 96 540 93S586 78 625 81S665 91 701 88S746 78 779 84S821 96 850 97V100H0Z" fill="#f4fbff"/><g class="portal-snowman" transform="translate(724 96)"><g class="portal-snow-body"><ellipse cy="-15" rx="19" ry="18" fill="#f4fbff" stroke="#d2e4ef"/></g><g class="portal-snow-head"><circle cy="-40" r="13" fill="#fff" stroke="#d2e4ef"/></g><g class="portal-snow-details"><circle cx="-4" cy="-43" r="1.5"/><circle cx="4" cy="-43" r="1.5"/><path d="M1-39L11-36L1-35Z" fill="#e8a34e"/><circle cy="-17" r="1.8" fill="#456176"/><circle cy="-9" r="1.8" fill="#456176"/><path d="M-17-18L-32-30M17-18L30-29" stroke="#8b7362" stroke-width="2" stroke-linecap="round"/></g><path class="portal-snow-scarf" d="M-11-29Q0-24 12-29M7-28V-13" fill="none" stroke="#d35d62" stroke-width="5"/><path class="portal-snow-hat" d="M-14-49H14M-9-49V-62H9V-49" fill="#345267" stroke="#345267" stroke-width="3"/></g></svg>';
 }
 if(season==='winter'){
  const small=ground.querySelector('.portal-snowman'),large=small.cloneNode(true);
  large.classList.add('portal-snowman-large');large.setAttribute('transform','translate(646 96) scale(1.3)');small.before(large);
  ground.querySelectorAll('.portal-snow-body ellipse').forEach(body=>body.setAttribute('stroke','none'));
  const frontSnow=ground.querySelector('.portal-snow-bank').cloneNode(true);
  frontSnow.classList.add('portal-snow-bank-front');ground.querySelector('svg').append(frontSnow);

 }
 const total=season==='winter'?30:season==='spring'?19:12;
 for(let i=0;i<total;i++){
  const particle=document.createElement('span');particle.className='portal-season-particle '+season;
  particle.style.cssText='left:'+((i*47+9)%97)+'%;--fall-duration:'+(season==='winter'?9+i%6:season==='spring'?8+i%5:10+i%5)+'s;--fall-delay:'+(season==='spring'?.8+i*.14:season==='winter'?1.5+i*.38:-i*1.37)+'s;--fall-drift:'+(i%2?28:-24)+'px;--particle-size:'+(season==='winter'?4+i%4:season==='spring'?7+i%7:12+i%4)+'px';
  particle.style.color=['#ffc4d9','#fff7fb','#f5a8c6','#ffe2ed'][i%4];
  particle.innerHTML=season==='winter'?'':season==='spring'?'<svg viewBox="0 0 20 24"><path d="M10 22C-3 13 1 1 8 2L10 5L13 1C24 1 21 14 10 22Z" fill="currentColor"/><path d="M10 19L10 7" stroke="#eda6bf" stroke-width=".7"/></svg>':'<svg viewBox="-25 -45 55 55" style="color:#94cb7e">'+leaf+'</svg>';scene.append(particle);
 }
}
const seasonalAnimationStyle=document.createElement('style');seasonalAnimationStyle.textContent=`
.portal-season-scene.is-animated{height:170px;bottom:-6px;overflow:hidden;pointer-events:none;mask-image:linear-gradient(transparent,#000 12%,#000)}
.portal-season-ground{position:absolute;left:0;right:0;bottom:0;height:95px}
.portal-season-scene.winter.is-animated{bottom:0;height:150px;overflow:hidden;clip-path:inset(0);contain:paint;mask-image:linear-gradient(transparent,#000 12%,#000)}
.portal-season-scene.winter .portal-season-ground{bottom:0;overflow:hidden}
.portal-season-scene.summer .portal-season-ground{height:52px}
.portal-season-scene.spring .portal-season-ground,.portal-season-scene.winter .portal-season-ground{height:64px}
.portal-season-ground>svg{display:block;width:100%;height:100%;overflow:visible}
.portal-bloom>g{transform-box:fill-box;transform-origin:center;animation:portal-blossom-open 9s ease-in-out var(--bloom-delay) infinite both}
@keyframes portal-blossom-open{0%,2%,100%{transform:scale(0);opacity:0}18%,65%{transform:scale(var(--flower-size,1));opacity:1}84%{transform:scale(calc(var(--flower-size,1) * .85));opacity:.35}98%{transform:scale(.15);opacity:0}}
.portal-growing-tree{transform-origin:0 0;animation:portal-tree-grow 5s cubic-bezier(.2,.7,.3,1) var(--tree-delay) both}
@keyframes portal-tree-grow{from{transform:scale(.15,.05);opacity:0}to{transform:scale(1);opacity:1}}
.portal-tree-crown{transform-box:fill-box;transform-origin:center bottom;animation:portal-crown-wind 7.5s ease-in-out infinite}
@keyframes portal-crown-wind{0%,100%{transform:translate(0,0) rotate(-1deg)}20%{transform:translate(1.5px,-1px) rotate(1.5deg)}40%{transform:translate(-1px,.7px) rotate(-1.3deg)}60%{transform:translate(1px,-.8px) rotate(1.2deg)}80%{transform:translate(-1.2px,.5px) rotate(-1.5deg)}}
.portal-season-particle{position:absolute;top:-22px;width:var(--particle-size);height:calc(var(--particle-size) * 1.2);opacity:0;animation:portal-season-float var(--fall-duration) linear var(--fall-delay) infinite}
.portal-season-particle svg{width:100%;height:100%;animation:portal-petal-flutter 3s ease-in-out infinite alternate}
.portal-season-particle.winter{height:var(--particle-size);border-radius:50%;background:#f5fbff;box-shadow:0 0 3px #fff8}
@keyframes portal-season-float{0%{transform:translate(0,-12px) rotate(0);opacity:0}12%{opacity:.9}86%{opacity:.85}100%{transform:translate(var(--fall-drift),190px) rotate(160deg);opacity:0}}
@keyframes portal-petal-flutter{from{transform:translateX(-6px) rotate(-25deg) rotateY(0)}to{transform:translateX(6px) rotate(30deg) rotateY(50deg)}}
.portal-snow-bank{transform-box:fill-box;transform-origin:center bottom;animation:portal-snow-build 18s ease-out both}
@keyframes portal-snow-build{0%,12%{transform:scaleY(0);opacity:0}30%{opacity:.5}100%{transform:scaleY(1);opacity:1}}
.portal-snowman{opacity:1}
.portal-snowman-large .portal-snow-body{animation-delay:16s}
.portal-snowman-large .portal-snow-head{animation-delay:27s}
.portal-snowman-large .portal-snow-details{animation-delay:36s}
.portal-snowman-large .portal-snow-scarf{animation-delay:40s}
.portal-snowman-large .portal-snow-hat{animation-delay:44s}
.portal-snow-body,.portal-snow-head{transform-box:fill-box;transform-origin:center;opacity:0}
.portal-snow-body{animation:portal-snow-roll 10s cubic-bezier(.25,.65,.3,1) 13s both}
.portal-snow-head{animation:portal-snow-head-roll 9s cubic-bezier(.25,.65,.3,1) 24s both}
.portal-snow-details{animation:portal-snow-detail 4s ease 33s both}
.portal-snow-scarf{animation:portal-snow-accessory 4s ease-out 37s both}
.portal-snow-hat{animation:portal-snow-accessory 5s ease-out 41s both}
@keyframes portal-snow-roll{0%{opacity:0;transform:translateX(-95px) rotate(-240deg) scale(.25)}15%{opacity:1}80%{transform:translateX(-3px) rotate(-12deg) scale(.98)}100%{opacity:1;transform:translateX(0) rotate(0) scale(1)}}
@keyframes portal-snow-head-roll{0%{opacity:0;transform:translate(-75px,35px) rotate(-180deg) scale(.35)}15%{opacity:1}65%{transform:translate(-15px,28px) rotate(-35deg) scale(.9)}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
@keyframes portal-snow-detail{from{opacity:0}to{opacity:1}}
@keyframes portal-snow-accessory{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.portal-snow-body,.portal-snow-head,.portal-snow-details,.portal-snow-scarf,.portal-snow-hat{animation:none;opacity:1;transform:none}}

@media(prefers-reduced-motion:reduce){.portal-bloom>g,.portal-growing-tree,.portal-tree-crown,.portal-season-particle,.portal-season-particle svg,.portal-snow-bank,.portal-snowman{animation:none}.portal-season-particle{display:none}.portal-snowman{opacity:1}}
`;document.head.append(seasonalAnimationStyle);

const uiStyle=document.createElement('style');uiStyle.textContent=`
.portal-season-scene.is-falling{height:170px;bottom:-6px;overflow:hidden;left:4%;right:4%;mask-image:linear-gradient(transparent,#000 18%,#000 92%,transparent)}
.portal-falling-leaf{position:absolute;top:0;width:20px;height:26px;animation:portal-leaf-fall var(--duration) linear var(--delay) infinite;opacity:0}
.portal-falling-leaf svg{width:100%;height:100%;animation:portal-leaf-sway 3.8s ease-in-out infinite alternate}
@keyframes portal-leaf-fall{0%{transform:translate(0,22px) rotate(0deg);opacity:0}3%{opacity:.85}85%{opacity:.8}100%{transform:translate(var(--drift),170px) rotate(145deg);opacity:0}}
@keyframes portal-leaf-sway{from{transform:rotate(-25deg) rotateY(0)}to{transform:rotate(30deg) rotateY(45deg)}}
.portal-leaf-pile{position:absolute;bottom:0;left:0;right:0;height:20px;pointer-events:none}
.portal-settled-leaf{position:absolute;height:20px;opacity:.92;transform:rotate(var(--rest-angle));transform-origin:center 80%;animation:portal-leaf-settle .9s ease-out both}
.portal-settled-leaf svg{width:100%;height:100%;filter:drop-shadow(0 1px 1px #4b2b2220)}
@keyframes portal-leaf-settle{from{opacity:.2;transform:translateY(-10px) rotate(calc(var(--rest-angle) - 18deg))}to{opacity:.92;transform:translateY(0) rotate(var(--rest-angle))}}
@media(prefers-reduced-motion:reduce){.portal-settled-leaf{animation:none}}
.portal-weather-open{border:0;border-left:1px solid #ffffff40;padding:0 0 0 8px;background:transparent;color:#e0edf6;font:inherit;cursor:pointer}
.portal-weather-dialog{width:min(410px,calc(100vw - 32px));box-sizing:border-box;padding:22px;border:1px solid #d7e4ee;border-radius:16px;background:#fff;color:#28475e;box-shadow:0 18px 60px #0c233f40;font:13px/1.6 "Malgun Gothic",sans-serif;text-align:left}
.portal-weather-dialog::backdrop{background:#122b4655}.portal-weather-dialog header{display:flex;justify-content:space-between;align-items:center}.portal-weather-dialog h2{font-size:17px;margin:0}.portal-weather-dialog button{border:1px solid #cbdce9;border-radius:5px;padding:4px 10px;background:white;color:#375b76;cursor:pointer}.portal-weather-big{font-size:28px;font-weight:700;margin:18px 0 4px}.portal-weather-metrics{display:flex;gap:18px;padding:10px 0;color:#647c8f}.portal-weather-day{display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid #e2eaf1}.portal-weather-dialog footer{font-size:10px;color:#8093a2;margin-top:14px}
@media(prefers-reduced-motion:reduce){.portal-falling-leaf,.portal-falling-leaf svg{animation:none}.portal-falling-leaf{top:auto;bottom:4px;opacity:.7}}
`;document.head.append(uiStyle);
weather.querySelector('.portal-weather-open').addEventListener('click',()=>{
 const existing=document.querySelector('.portal-weather-dialog');if(existing){existing.close();return;}
 const dialog=document.createElement('dialog');dialog.className='portal-weather-dialog';dialog.setAttribute('aria-label','충주 날씨 상세');
 const header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');title.textContent='충주 날씨';close.type='button';close.textContent='닫기';header.append(title,close);dialog.append(header);close.onclick=()=>dialog.close();
 const data=saved?.data,c=data?.current_condition?.[0];const big=document.createElement('div');big.className='portal-weather-big';big.textContent=c?weather.querySelector('.portal-weather-icon').textContent+' '+weather.querySelector('.portal-weather-current').textContent:'날씨 연결 대기';dialog.append(big);
 if(c){const metrics=document.createElement('div');metrics.className='portal-weather-metrics';metrics.textContent='습도 '+c.humidity+'% · 바람 '+c.windspeedKmph+' km/h';dialog.append(metrics);
 (data.weather||[]).slice(0,3).forEach((day,i)=>{const row=document.createElement('div');row.className='portal-weather-day';const name=document.createElement('b'),range=document.createElement('span');name.textContent=(i===0?'오늘':new Intl.DateTimeFormat('ko-KR',{weekday:'short',timeZone:'Asia/Seoul'}).format(new Date(day.date+'T12:00:00+09:00')))+' · '+day.date;range.textContent=day.mintempC+'° / '+day.maxtempC+'°';row.append(name,range);dialog.append(row);});}
 const foot=document.createElement('footer');foot.textContent='제공 wttr.in · '+(c?.localObsDateTime||'현재 날씨를 확인 중입니다.');dialog.append(foot);
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
 function centerWeatherDialog(){
  if(!dialog.open)return;
  const bounds=form.getBoundingClientRect();
  [['position','fixed'],['margin','0'],['right','auto'],['bottom','auto'],['transform','none'],['translate','none'],['animation','none'],['transition','none']].forEach(([key,value])=>dialog.style.setProperty(key,value,'important'));
  const box=dialog.getBoundingClientRect(),left=Math.max(12,Math.min(bounds.left+bounds.width/2-box.width/2,innerWidth-box.width-12)),top=Math.max(12,(innerHeight-box.height)/2);
  dialog.style.setProperty('left',left+'px','important');dialog.style.setProperty('top',top+'px','important');
 }

 centerWeatherDialog();requestAnimationFrame(centerWeatherDialog);window.addEventListener('resize',centerWeatherDialog);window.addEventListener('scroll',centerWeatherDialog,true);const centerObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(centerWeatherDialog):null;centerObserver?.observe(form);dialog.addEventListener('close',()=>{window.removeEventListener('resize',centerWeatherDialog);window.removeEventListener('scroll',centerWeatherDialog,true);centerObserver?.disconnect();},{once:true});
});
function fitSeasonToSearch(){
 const bounds=form.getBoundingClientRect(),parent=wrap.getBoundingClientRect();
 const inset=season==='winter'?18:0;
 scene.style.left=(bounds.left-parent.left+inset)+'px';scene.style.right='auto';scene.style.width=Math.max(0,bounds.width-inset*2)+'px';
 if(season==='winter'){scene.style.setProperty('top','auto','important');scene.style.setProperty('bottom','auto','important');scene.style.setProperty('height','150px','important');scene.style.setProperty('top',(bounds.top-parent.top-148)+'px','important');}
scene.style.boxSizing='border-box';scene.style.overflow='hidden';
}
requestAnimationFrame(fitSeasonToSearch);window.addEventListener('resize',fitSeasonToSearch);if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitSeasonToSearch).observe(form);
const key='qmes-chungju-weather-v1';
function paint(data,cached=false){const c=data.current_condition?.[0],d=data.weather?.[0];if(!c||!Number.isFinite(Number(c.temp_C)))throw Error('날씨 정보 없음');
 const code=Number(c.weatherCode),snowing=[179,182,185,227,230,281,284,311,314,317,320,323,326,329,332,335,338,350,362,365,368,371,374,377,392,395].includes(code),rain=[176,263,266,293,296,299,302,305,308,353,356,359].includes(code);
 const label=code===113?'맑음':code===116?'구름 조금':[119,122].includes(code)?'흐림':[143,248,260].includes(code)?'안개':snowing?'눈':rain?'비':[200,386,389].includes(code)?'뇌우':'구름';
 weather.querySelector('.portal-weather-icon').textContent=snowing?'❄️':rain?'🌧️':code===113?'☀️':'⛅';
 weather.querySelector('.portal-weather-current').textContent=Math.round(Number(c.temp_C))+'° · '+label;
 weather.querySelector('.portal-weather-range').textContent=d?'최저 '+d.mintempC+'° / 최고 '+d.maxtempC+'°':'';
 weather.title='충주 · '+(cached?'최근 조회 정보':'최근 제공 날씨')+' · '+String(c.localObsDateTime||c.observation_time||'');
}
let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&Date.now()-saved.at<3600000)paint(saved.data,true);}catch(_){}
async function refresh(){if(document.hidden)return;if(saved&&Date.now()-saved.at<1200000)return;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const r=await fetch('https://wttr.in/36.991,127.926?format=j1',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('날씨 조회 실패');const data=await r.json();paint(data);saved={at:Date.now(),data};try{localStorage.setItem(key,JSON.stringify(saved));}catch(_){}}
 catch(_){if(!saved||Date.now()-saved.at>=3600000){weather.querySelector('.portal-weather-current').textContent='날씨 연결 대기';weather.querySelector('.portal-weather-range').textContent='';}}
 finally{clearTimeout(timer);}
}
refresh();setInterval(refresh,1200000);document.addEventListener('visibilitychange',refresh);
})();