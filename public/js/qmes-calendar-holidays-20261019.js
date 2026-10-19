/* Korean holidays 2025-2027: KASI calendarData, KASA 2027 announcement and 2026 amendment. */
(()=>{
'use strict';
const holidays=new Map(),add=(year,rows)=>rows.forEach(([d,n])=>holidays.set(year+'-'+d,n));
for(const y of [2025,2026,2027])add(y,[['01-01','신정'],['03-01','삼일절'],['05-05','어린이날'],['06-06','현충일'],['08-15','광복절'],['10-03','개천절'],['10-09','한글날'],['12-25','성탄절']]);
add(2025,[['01-27','임시공휴일'],['01-28','설날 연휴'],['01-29','설날'],['01-30','설날 연휴'],['03-03','삼일절 대체공휴일'],['05-05','어린이날·부처님오신날'],['05-06','대체공휴일'],['06-03','대통령선거일'],['10-05','추석 연휴'],['10-06','추석'],['10-07','추석 연휴'],['10-08','추석 대체공휴일']]);
add(2026,[['02-16','설날 연휴'],['02-17','설날'],['02-18','설날 연휴'],['03-02','삼일절 대체공휴일'],['05-01','노동절'],['05-24','부처님오신날'],['05-25','부처님오신날 대체공휴일'],['06-03','전국동시지방선거일'],['07-17','제헌절'],['08-17','광복절 대체공휴일'],['09-24','추석 연휴'],['09-25','추석'],['09-26','추석 연휴'],['10-05','개천절 대체공휴일']]);
add(2027,[['02-06','설날 연휴'],['02-07','설날'],['02-08','설날 연휴'],['02-09','설날 대체공휴일'],['05-01','노동절'],['05-03','노동절 대체공휴일'],['05-13','부처님오신날'],['07-17','제헌절'],['07-19','제헌절 대체공휴일'],['08-16','광복절 대체공휴일'],['09-14','추석 연휴'],['09-15','추석'],['09-16','추석 연휴'],['10-04','개천절 대체공휴일'],['10-11','한글날 대체공휴일'],['12-27','성탄절 대체공휴일']]);
const pad=v=>String(v).padStart(2,'0'),fmt=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const selector=':is(.namo-orders-mini-calendar,.namo-purchase-mini-calendar,.namo-work-mini-calendar,.namo-inventory-mini-calendar,.namo-incoming-mini-calendar,.namo-process-mini-calendar,.namo-outgoing-mini-calendar,.eq-date-popup,.namo-unified-date-calendar)';
const style=document.createElement('style');style.textContent=selector+' .nwm-days>.qmes-red-day,'+selector+' .nwm-days>span:nth-child(1),'+selector+' .nwm-days>span:nth-child(7){color:#e14d4d!important}'+selector+' .nwm-days>.qmes-red-day.chosen{color:#c53939!important;background:#fee2e2!important;box-shadow:inset 0 0 0 1px #e8a5a5!important}'+[
'.namo-unified-date-calendar{position:fixed;z-index:2147483000;box-sizing:border-box;padding:8px;max-width:calc(100vw - 12px);background:#fff;border:1px solid #b8c4d0;border-radius:3px;box-shadow:0 4px 14px #0002;color:#344254;font:12px Arial,"Malgun Gothic",sans-serif}',
'.namo-unified-date-calendar *{box-sizing:border-box}',
'.namo-unified-date-calendar button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:2px;padding:0;min-width:0;box-shadow:none}',
'.namo-unified-date-calendar button:focus-visible{outline:2px solid #499cef;outline-offset:-2px}',
'.namo-unified-date-calendar .nwm-head{display:flex;align-items:center;justify-content:space-between;height:29px;margin-bottom:7px;border-bottom:1px solid #e1e6eb}',
'.namo-unified-date-calendar .nwm-head strong{font-size:12px;color:#172b40;white-space:nowrap}',
'.namo-unified-date-calendar .nwm-head button{width:20px;height:25px;font-size:16px;color:#83909c}',
'.namo-unified-date-calendar .nwm-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}',
'.namo-unified-date-calendar .nwm-days>*{height:25px;line-height:25px;text-align:center;font-size:11px}',
'.namo-unified-date-calendar .nwm-week{color:#89939e}',
'.namo-unified-date-calendar .nwm-days button:hover{background:#e4f0ff}',
'.namo-unified-date-calendar .nwm-days .chosen{background:#2689ef;color:#fff}',
'.namo-unified-date-calendar .nwm-days button:disabled{opacity:.35;cursor:not-allowed}',
'.namo-unified-date-calendar .nwm-foot{display:flex;flex-wrap:nowrap;gap:3px;margin-top:7px;padding-top:7px;border-top:1px solid #e1e6eb}',
'.namo-unified-date-calendar .nwm-foot [data-clear]{flex-grow:1.4}.namo-unified-date-calendar .nwm-foot button{flex:1 1 0;min-width:0;height:23px;padding:0 3px;border:1px solid #d3d9df;background:#fff;font-size:10px;line-height:21px;white-space:nowrap;word-break:keep-all}'
].join('');document.head.append(style);
let popup=null,input=null,month=null;
function position(){if(!popup||!input)return;const r=input.getBoundingClientRect();popup.style.width=r.width+'px';const b=popup.getBoundingClientRect();popup.style.left=Math.max(6,Math.min(r.left,innerWidth-b.width-6))+'px';popup.style.top=(r.bottom+b.height+5<innerHeight?r.bottom+4:Math.max(6,r.top-b.height-4))+'px';}
function close(focus=false){const previous=input;popup?.remove();popup=null;input=null;previous?.setAttribute('aria-expanded','false');if(focus)previous?.focus();}
function apply(value){const target=input;if(!target)return;if(value&&((target.min&&value<target.min)||(target.max&&value>target.max)))return;close(true);target.value=value;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}
function paint(){document.querySelectorAll(selector+' .nwm-days [data-day]').forEach(el=>{const value=el.dataset.day;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return;const day=new Date(value+'T12:00:00').getDay(),name=holidays.get(value);el.classList.toggle('qmes-red-day',day===0||day===6||!!name);if(name){el.title=name;el.setAttribute('aria-label',value+' '+name);}});}
function draw(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let cells='';for(let n=0;n<first;n++)cells+='<span aria-hidden="true"></span>';for(let n=1;n<=days;n++){const value=fmt(new Date(y,m,n)),disabled=(input.min&&value<input.min)||(input.max&&value>input.max);cells+='<button type="button" data-day="'+value+'" aria-label="'+value+'" aria-pressed="'+(value===input.value)+'" class="'+(value===input.value?'chosen':'')+'"'+(disabled?' disabled':'')+'>'+n+'</button>';}
popup.innerHTML='<div class="nwm-head"><button type="button" data-month="-12" aria-label="이전 해">«</button><button type="button" data-month="-1" aria-label="이전 달">‹</button><strong>'+y+'.'+pad(m+1)+'</strong><button type="button" data-month="1" aria-label="다음 달">›</button><button type="button" data-month="12" aria-label="다음 해">»</button></div><div class="nwm-days">'+['일','월','화','수','목','금','토'].map(v=>'<span class="nwm-week">'+v+'</span>').join('')+cells+'</div><div class="nwm-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button><button type="button" data-close>닫기</button></div>';paint();position();}
function open(target){if(input===target&&popup){close(true);return;}close();input=target;const value=target.value||new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});month=new Date(value+'T12:00:00');month=new Date(month.getFullYear(),month.getMonth(),1);popup=document.createElement('div');popup.className='namo-unified-date-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',target.getAttribute('aria-label')||'날짜 선택');document.body.append(popup);target.setAttribute('aria-expanded','true');draw();}
const nativeSelector=':is(#quality,#standard) .module-toolbar input[type="date"]',wired=new WeakSet();
function wire(){document.querySelectorAll(nativeSelector).forEach(el=>{if(wired.has(el))return;wired.add(el);el.readOnly=true;el.setAttribute('aria-haspopup','dialog');el.setAttribute('aria-expanded','false');if(!el.getAttribute('aria-label')){const list=[...el.closest('.module-toolbar').querySelectorAll('input[type=date]')];el.setAttribute('aria-label',list.indexOf(el)===0?'시작일 선택':'종료일 선택');}el.addEventListener('click',e=>{e.preventDefault();open(el);});el.addEventListener('keydown',e=>{if(['Enter',' ','ArrowDown'].includes(e.key)){e.preventDefault();open(el);}});});}
document.addEventListener('click',e=>{const action=e.target.closest?.('.namo-unified-date-calendar button');if(!action||!popup)return;if(action.hasAttribute('data-month')){month=new Date(month.getFullYear(),month.getMonth()+Number(action.dataset.month),1);draw();}else if(action.dataset.day)apply(action.dataset.day);else if(action.hasAttribute('data-today'))apply(new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}));else if(action.hasAttribute('data-clear'))apply('');else close(true);});
document.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&e.target!==input)close();},true);
document.addEventListener('keydown',e=>{if(popup&&e.key==='Escape'){e.preventDefault();close(true);}},true);
window.addEventListener('resize',position);window.addEventListener('scroll',()=>{if(popup)close();},true);
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;wire();paint();position();});}).observe(document.body,{childList:true,subtree:true});wire();paint();
})();
