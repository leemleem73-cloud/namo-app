/* Work inquiry date popup only. Preserve native date filters, row data and query handlers. */
(()=>{'use strict';let popup=null,trigger=null,start='',end='',picking=false,month=null;
const root=()=>document.querySelector('#work #namo-work-inquiry');
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function close(focus=false){popup?.remove();popup=null;trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus();}
function position(){if(!popup||!trigger)return;const r=trigger.getBoundingClientRect(),box=popup.getBoundingClientRect();popup.style.left=Math.max(6,Math.min(r.left,innerWidth-box.width-6))+'px';popup.style.top=(r.bottom+box.height+5<innerHeight?r.bottom+4:Math.max(6,r.top-box.height-4))+'px';}
function draw(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let cells='';for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';for(let n=1;n<=days;n++){const value=fmt(new Date(y,m,n)),weekday=(first+n-1)%7;cells+='<button type="button" data-day="'+value+'" class="'+(weekday===0||weekday===6?'weekend ':'')+(value===start||value===end?'chosen ':start&&end&&value>start&&value<end?'between ':'')+'" aria-label="'+value+'" aria-pressed="'+(value===start||value===end)+'"'+(value===today()?' aria-current="date"':'')+'>'+n+'</button>';}
popup.innerHTML='<div class="nwm-head"><button type="button" data-month="-12" aria-label="이전 해">«</button><button type="button" data-month="-1" aria-label="이전 달">‹</button><strong>'+y+'.'+String(m+1).padStart(2,'0')+'</strong><button type="button" data-month="1" aria-label="다음 달">›</button><button type="button" data-month="12" aria-label="다음 해">»</button></div><div class="nwm-days">'+['일','월','화','수','목','금','토'].map(v=>'<span class="nwm-week">'+v+'</span>').join('')+cells+'</div><div class="nwm-hint" aria-live="polite">'+(picking?start+' ~ 종료일 선택':'시작일 → 종료일 순서로 선택')+'</div><div class="nwm-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button><button type="button" data-close>닫기</button></div>';position();}
function apply(a,b){const panel=root();if(!panel)return;const from=panel.querySelector('[data-filter="4"]'),to=panel.querySelector('[data-filter="5"]'),value=panel.querySelector('.nwi-period-value');if(!from||!to||!value)return;from.value=a;to.value=b;value.textContent=a&&b?a+' ~ '+b:'기간 선택';close(true);panel.querySelector('#nwi-search')?.click();}
function open(button){if(popup){close(true);return;}const panel=root();if(!panel)return;trigger=button;panel.querySelectorAll('.nwi-period-popup').forEach(p=>p.hidden=true);start=panel.querySelector('[data-filter="4"]')?.value||'';end=panel.querySelector('[data-filter="5"]')?.value||'';picking=false;month=new Date((start||today())+'T12:00:00');month=new Date(month.getFullYear(),month.getMonth(),1);popup=document.createElement('div');popup.className='namo-work-mini-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','지시기간 선택');document.body.append(popup);trigger.setAttribute('aria-expanded','true');draw();popup.querySelector('[data-day="'+(start||today())+'"]')?.focus();}
window.addEventListener('click',event=>{const button=event.target.closest?.('#work #namo-work-inquiry .nwi-period-trigger');if(button){event.preventDefault();event.stopImmediatePropagation();open(button);return;}const action=event.target.closest?.('.namo-work-mini-calendar button');if(!action||!popup)return;event.preventDefault();event.stopImmediatePropagation();if(action.hasAttribute('data-month')){month=new Date(month.getFullYear(),month.getMonth()+Number(action.dataset.month),1);draw();}else if(action.dataset.day){if(!picking){start=action.dataset.day;end='';picking=true;draw();}else{end=action.dataset.day;if(end<start)[start,end]=[end,start];apply(start,end);}}else if(action.hasAttribute('data-today'))apply(today(),today());else if(action.hasAttribute('data-clear'))apply('','');else close(true);},true);
document.addEventListener('pointerdown',event=>{if(popup&&!event.target.closest('.namo-work-mini-calendar,#work .nwi-period-trigger'))close();},true);
window.addEventListener('keydown',event=>{if(popup&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},true);
window.addEventListener('resize',position);window.addEventListener('scroll',()=>{if(popup)close();},true);
const style=document.createElement('style');style.textContent=`
.namo-work-mini-calendar{position:fixed;z-index:2147483000;box-sizing:border-box;width:220px;max-width:calc(100vw - 12px);padding:8px;background:#fff;border:1px solid #b8c4d0;border-radius:3px;box-shadow:0 4px 14px #0002;color:#344254;font:12px Arial,"Malgun Gothic",sans-serif}
.namo-work-mini-calendar *{box-sizing:border-box}
.namo-work-mini-calendar button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:2px;padding:0;min-width:0;box-shadow:none}
.namo-work-mini-calendar button:focus-visible{outline:2px solid #499cef;outline-offset:-2px}
.namo-work-mini-calendar .nwm-head{display:flex;align-items:center;justify-content:space-between;height:29px;margin-bottom:7px;border-bottom:1px solid #e1e6eb}
.namo-work-mini-calendar .nwm-head strong{font-size:13px;color:#172b40}
.namo-work-mini-calendar .nwm-head button{width:24px;height:25px;font-size:18px;color:#83909c}
.namo-work-mini-calendar .nwm-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}
.namo-work-mini-calendar .nwm-days>*{height:25px;line-height:25px;text-align:center;font-size:11px}
.namo-work-mini-calendar .nwm-week{color:#89939e;font-weight:400}
.namo-work-mini-calendar .weekend{color:#e14d4d}
.namo-work-mini-calendar .nwm-days button:hover{background:#e4f0ff}
.namo-work-mini-calendar .nwm-days .between{background:#edf5ff}
.namo-work-mini-calendar .nwm-days .chosen{background:#2689ef;color:#fff}
.namo-work-mini-calendar .nwm-days [aria-current="date"]:not(.chosen){font-weight:700;box-shadow:inset 0 0 0 1px #8cbcf0}
.namo-work-mini-calendar .nwm-hint{font-size:10px;min-height:24px;padding-top:7px;color:#61768b;text-align:center}
.namo-work-mini-calendar .nwm-foot{display:flex;gap:4px;margin-top:5px;padding-top:7px;border-top:1px solid #e1e6eb}
.namo-work-mini-calendar .nwm-foot button{border:1px solid #d3d9df;background:#fff;height:23px;padding:0 7px;font-size:11px}
.namo-work-mini-calendar .nwm-foot [data-close]{margin-left:auto}
`;document.head.append(style);
})();
