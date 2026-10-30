(()=>{'use strict';
const form=document.getElementById('search-form');if(!form)return;
const month=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'numeric'}).format(new Date()));
const previewSeason=new URLSearchParams(location.search).get('previewSeason');
const season=['spring','summer','autumn','winter'].includes(previewSeason)?previewSeason:month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
const scene=document.createElement('div');scene.className='portal-season-scene '+season;scene.setAttribute('aria-hidden','true');
const leaf='<path d="M0 0C-19-24-6-37 9-40C20-22 18-6 0 0Z" fill="currentColor"/><path d="M0 0L8-33" stroke="#fff" stroke-opacity=".45" fill="none"/>';
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
 for(let i=0;i<12;i++){const item=document.createElement('span');item.className='portal-falling-leaf';item.style.cssText='left:'+((i*83+17)%96)+'%;--duration:'+(8+i%5*1.7)+'s;--delay:'+(-i*2.1)+'s;--drift:'+(i%2?40:-35)+'px;color:'+['#d99a40','#b96a33','#e0b75a','#b98a46'][i%4];item.innerHTML='<svg viewBox="-25 -45 55 55">'+leaf+'</svg>';scene.append(item);}
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
  item.innerHTML='<svg viewBox="-25 -45 55 55">'+leaf+'</svg>';pile.append(item);
  if(pile.children.length>36)pile.firstElementChild.remove();
 }
 scene.querySelectorAll('.portal-falling-leaf').forEach(falling=>falling.addEventListener('animationiteration',event=>{if(event.animationName==='portal-leaf-fall')settle(falling);}));
 if(reduced)[...scene.querySelectorAll('.portal-falling-leaf')].slice(0,6).forEach(settle);
}
const uiStyle=document.createElement('style');uiStyle.textContent=`
.portal-season-scene.is-falling{height:170px;bottom:-6px;overflow:hidden;left:4%;right:4%;mask-image:linear-gradient(transparent,#000 18%,#000 92%,transparent)}
.portal-falling-leaf{position:absolute;top:-35px;width:20px;height:26px;animation:portal-leaf-fall var(--duration) linear var(--delay) infinite;opacity:0}
.portal-falling-leaf svg{width:100%;height:100%;animation:portal-leaf-sway 3.8s ease-in-out infinite alternate}
@keyframes portal-leaf-fall{0%{transform:translate(0,-15px) rotate(0deg);opacity:0}12%{opacity:.85}85%{opacity:.8}100%{transform:translate(var(--drift),195px) rotate(145deg);opacity:0}}
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
 scene.style.left=(bounds.left-parent.left)+'px';scene.style.right='auto';scene.style.width=bounds.width+'px';scene.style.boxSizing='border-box';scene.style.overflow='hidden';
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