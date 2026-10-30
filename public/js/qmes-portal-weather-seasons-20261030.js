(()=>{'use strict';
const form=document.getElementById('search-form');if(!form)return;
const month=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'numeric'}).format(new Date()));
const season=month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
const scene=document.createElement('div');scene.className='portal-season-scene '+season;scene.setAttribute('aria-hidden','true');
const leaf='<path d="M0 0C-19-24-6-37 9-40C20-22 18-6 0 0Z" fill="currentColor"/><path d="M0 0L8-33" stroke="#fff" stroke-opacity=".45" fill="none"/>';
const flower='<g fill="currentColor">'+[0,72,144,216,288].map(a=>'<ellipse cy="-8" rx="5" ry="8" transform="rotate('+a+')"/>').join('')+'</g><circle r="4" fill="#ffe7a0"/>';
const snow='<path d="M0-13V13M-11-6L11 6M-11 6L11-6" stroke="currentColor" stroke-width="2" fill="none"/>';
scene.innerHTML='<svg viewBox="0 0 850 50" preserveAspectRatio="none">'+(season==='winter'?'<path d="M0 46Q90 23 180 39T380 38T610 36T850 40V50H0Z" fill="#f4faff" opacity=".9"/>':'<path d="M0 48Q210 39 425 46T850 44" fill="none" stroke="currentColor" stroke-opacity=".3"/>')+Array.from({length:season==='autumn'?24:16},(_,i)=>{const x=14+(i*53)%825,y=season==='autumn'?46-(i%3)*3:season==='winter'?15+(i%3)*10:46;return '<g transform="translate('+x+' '+y+') rotate('+((i%5)*23-40)+') scale('+(season==='winter'?'.55':season==='spring'?'.65':'.6')+')" opacity="'+(.65+(i%3)*.1)+'">'+(season==='winter'?snow:season==='spring'?flower:leaf)+'</g>';}).join('')+'</svg>';
const weather=document.createElement('div');weather.className='portal-chungju-weather';weather.setAttribute('aria-live','polite');weather.innerHTML='<span class="portal-weather-icon" aria-hidden="true">⛅</span><b>충주</b><span class="portal-weather-current">날씨 불러오는 중</span><span class="portal-weather-range"></span><a href="https://wttr.in/Chungju" target="_blank" rel="noopener noreferrer" title="날씨 제공 wttr.in">날씨</a>';
const wrap=document.createElement('div');wrap.className='portal-season-weather';wrap.append(scene,weather);form.before(wrap);
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