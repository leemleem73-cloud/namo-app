/* Incoming inspection only: compact date picker; original date inputs remain the source of truth. */
(()=>{'use strict';
const css=`
.inspection-premium.iqc-date-font-only .iqc-mini-wrap{position:relative}
.inspection-premium.iqc-date-font-only .iqc-mini-trigger{width:100%;height:100%;min-height:32px;background:transparent;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:0 5px}
.iqc-mini-calendar{position:fixed;z-index:2147483000;width:190px;box-sizing:border-box;background:#fff;border:1px solid #cbd5e1;border-radius:7px;box-shadow:0 6px 18px #0002;padding:7px;color:#334155;font:11px Arial,sans-serif}
.iqc-mini-calendar *{box-sizing:border-box}
.iqc-mini-calendar .iqc-mini-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-weight:700}
.iqc-mini-calendar button{font:inherit;cursor:pointer;border:0;background:transparent;color:inherit;border-radius:4px}
.iqc-mini-calendar .iqc-mini-nav{padding:4px 7px}
.iqc-mini-calendar .iqc-mini-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}
.iqc-mini-calendar .iqc-mini-grid>*{min-width:0;height:23px;text-align:center;padding:0}
.iqc-mini-calendar .iqc-mini-week{height:19px;color:#64748b;line-height:19px}
.iqc-mini-calendar .iqc-mini-grid button:hover,.iqc-mini-calendar .iqc-mini-grid button[aria-selected=true]{background:#dbeafe;color:#1d4ed8}
.iqc-mini-calendar .iqc-mini-foot{display:flex;justify-content:space-between;margin-top:5px;border-top:1px solid #e2e8f0;padding-top:5px}
`;
const style=document.createElement('style');style.id='iqc-mini-calendar-style';style.textContent=css;document.head.append(style);
let pop=null,active=null,month=null;
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function close(){pop?.remove();pop=null;active=null}
function draw(){if(!pop||!active)return;const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),count=new Date(y,m+1,0).getDate();
pop.innerHTML='<div class="iqc-mini-head"><button type="button" class="iqc-mini-nav" data-shift="-1" aria-label="이전 달">‹</button><span>'+y+'년 '+(m+1)+'월</span><button type="button" class="iqc-mini-nav" data-shift="1" aria-label="다음 달">›</button></div><div class="iqc-mini-grid">'+['일','월','화','수','목','금','토'].map(x=>'<span class="iqc-mini-week">'+x+'</span>').join('')+Array.from({length:first},()=>'<span></span>').join('')+Array.from({length:count},(_,i)=>{const d=fmt(new Date(y,m,i+1));return '<button type="button" data-date="'+d+'" aria-selected="'+(active.value===d)+'">'+(i+1)+'</button>'}).join('')+'</div><div class="iqc-mini-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button></div>';
const rect=active.parentElement.getBoundingClientRect();const left=Math.max(5,Math.min(rect.left,innerWidth-195));const top=rect.bottom+4+205>innerHeight?Math.max(5,rect.top-212):rect.bottom+4;pop.style.left=left+'px';pop.style.top=top+'px';
}
function choose(value){if(!active)return;active.value=value;active.dispatchEvent(new Event('change',{bubbles:true}));const btn=active.parentElement.querySelector('.iqc-mini-trigger');if(btn)btn.textContent=value||'연도-월-일';close()}
function open(input){if(active===input){close();return}close();active=input;month=input.value?new Date(input.value+'T12:00:00'):new Date();if(Number.isNaN(month.getTime()))month=new Date();pop=document.createElement('div');pop.className='iqc-mini-calendar';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','날짜 선택');document.body.append(pop);draw()}
function install(section){if(!section||section.dataset.iqcMiniReady)return;section.dataset.iqcMiniReady='1';for(const input of section.querySelectorAll('.ip-start-date,.ip-end-date')){if(input.type!=='date')continue;const wrap=document.createElement('div');wrap.className='iqc-mini-wrap';input.parentNode.insertBefore(wrap,input);wrap.append(input);input.style.position='absolute';input.style.opacity='0';input.style.pointerEvents='none';input.style.width='1px';input.style.height='1px';const btn=document.createElement('button');btn.type='button';btn.className='iqc-mini-trigger input';btn.textContent=input.value||'연도-월-일';btn.setAttribute('aria-label',input.classList.contains('ip-start-date')?'시작일 달력 열기':'종료일 달력 열기');wrap.append(btn);btn.addEventListener('click',()=>open(input));input.addEventListener('change',()=>{btn.textContent=input.value||'연도-월-일'})}}
document.addEventListener('click',e=>{const b=e.target.closest?.('.iqc-mini-calendar button');if(b&&pop){if(b.dataset.shift){month.setMonth(month.getMonth()+Number(b.dataset.shift));draw()}else if(b.dataset.date)choose(b.dataset.date);else if(b.hasAttribute('data-today'))choose(fmt(new Date()));else if(b.hasAttribute('data-clear'))choose('');return}if(pop&&!e.target.closest?.('.iqc-mini-calendar,.iqc-mini-trigger'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});window.addEventListener('resize',close);window.addEventListener('scroll',close,true);
const observer=new MutationObserver(()=>{document.querySelectorAll('#incoming .inspection-premium.iqc-date-font-only,section#incoming').forEach(install)});observer.observe(document.body,{childList:true,subtree:true});document.querySelectorAll('#incoming').forEach(install);
})();
