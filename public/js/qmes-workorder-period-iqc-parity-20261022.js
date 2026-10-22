/* NAMO QMES Work Order period picker = IQC calendar parity
 * 2026-10-22 / ADD-ONLY / #work scoped
 */
(()=>{'use strict';
if(window.__QMES_WORKORDER_PERIOD_IQC_PARITY_20261022__)return;
window.__QMES_WORKORDER_PERIOD_IQC_PARITY_20261022__=true;

let popup=null,trigger=null,start='',end='',picking=false,month=null;
const root=()=>document.querySelector('#work');
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});

function syncTriggerValue(){
  const panel=root()?.querySelector('#namo-work-inquiry');
  const from=panel?.querySelector('[data-filter="4"]');
  const to=panel?.querySelector('[data-filter="5"]');
  const value=panel?.querySelector('.nwi-period-value');
  if(!from||!to||!value)return false;
  value.textContent=from.value&&to.value?from.value+' ~ '+to.value:'기간 선택';
  return true;
}

function close(focus=false){
  popup?.remove(); popup=null;
  trigger?.setAttribute('aria-expanded','false');
  if(focus)trigger?.focus();
}
function position(){
  if(!popup||!trigger)return;
  const r=trigger.getBoundingClientRect();
  popup.style.width=Math.max(220,Math.min(r.width,260))+'px';
  const box=popup.getBoundingClientRect();
  popup.style.left=Math.max(6,Math.min(r.left,innerWidth-box.width-6))+'px';
  popup.style.top=(r.bottom+box.height+5<innerHeight?r.bottom+4:Math.max(6,r.top-box.height-4))+'px';
}
function draw(){
  if(!popup||!month)return;
  const y=month.getFullYear(),m=month.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  let cells='';
  for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';
  for(let n=1;n<=days;n++){
    const value=fmt(new Date(y,m,n)),weekday=(first+n-1)%7;
    const cls=(weekday===0||weekday===6?'weekend ':'')+
      (value===start||value===end?'chosen ':start&&end&&value>start&&value<end?'between ':'');
    cells+='<button type="button" data-day="'+value+'" class="'+cls+'" aria-label="'+value+'" aria-pressed="'+(value===start||value===end)+'"'+(value===today()?' aria-current="date"':'')+'>'+n+'</button>';
  }
  popup.innerHTML=
    '<div class="qww-head">'+
      '<button type="button" data-month="-12" aria-label="이전 해">«</button>'+
      '<button type="button" data-month="-1" aria-label="이전 달">‹</button>'+
      '<strong>'+y+'.'+String(m+1).padStart(2,'0')+'</strong>'+
      '<button type="button" data-month="1" aria-label="다음 달">›</button>'+
      '<button type="button" data-month="12" aria-label="다음 해">»</button>'+
    '</div>'+
    '<div class="qww-days">'+['일','월','화','수','목','금','토'].map(v=>'<span class="qww-week">'+v+'</span>').join('')+cells+'</div>'+
    '<div class="qww-hint" aria-live="polite">'+(picking?start+' ~ 종료일 선택':'시작일 → 종료일 순서로 선택')+'</div>'+
    '<div class="qww-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button><button type="button" data-close>닫기</button></div>';
  position();
}
function nativeInputs(){
  const panel=root()?.querySelector('#namo-work-inquiry');
  return {
    panel,
    from:panel?.querySelector('[data-filter="4"]'),
    to:panel?.querySelector('[data-filter="5"]'),
    value:panel?.querySelector('.nwi-period-value')
  };
}
function apply(a,b){
  const {panel,from,to,value}=nativeInputs();
  if(!panel||!from||!to||!value)return;
  from.value=a; to.value=b;
  value.textContent=a&&b?a+' ~ '+b:'기간 선택';
  close(true);
  panel.querySelector('#nwi-search')?.click();
}
function open(button){
  if(popup){close(true);return;}
  const {panel,from,to}=nativeInputs();
  if(!panel||!from||!to)return;
  trigger=button;
  panel.querySelectorAll('.nwi-period-popup').forEach(p=>p.hidden=true);
  start=from.value||''; end=to.value||'';
  picking=false;
  month=new Date((start||today())+'T12:00:00');
  month=new Date(month.getFullYear(),month.getMonth(),1);
  popup=document.createElement('div');
  popup.className='namo-work-iqc-calendar';
  popup.setAttribute('role','dialog');
  popup.setAttribute('aria-label','작업기간 선택');
  document.body.append(popup);
  trigger.setAttribute('aria-expanded','true');
  draw();
  popup.querySelector('[data-day="'+(start||today())+'"]')?.focus();
}
window.addEventListener('click',event=>{
  const button=event.target.closest?.('#work .nwi-period-trigger');
  if(button){
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    open(button);return;
  }
  const action=event.target.closest?.('.namo-work-iqc-calendar button');
  if(!action||!popup)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  if(action.hasAttribute('data-month')){
    month=new Date(month.getFullYear(),month.getMonth()+Number(action.dataset.month),1);draw();
  }else if(action.dataset.day){
    if(!picking){start=action.dataset.day;end='';picking=true;draw();}
    else{end=action.dataset.day;if(end<start)[start,end]=[end,start];apply(start,end);}
  }else if(action.hasAttribute('data-today'))apply(today(),today());
  else if(action.hasAttribute('data-clear'))apply('','');
  else close(true);
},true);
document.addEventListener('pointerdown',event=>{
  if(popup&&!event.target.closest('.namo-work-iqc-calendar,#work .nwi-period-trigger'))close();
},true);
window.addEventListener('keydown',event=>{
  if(popup&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}
},true);
window.addEventListener('resize',position);
window.addEventListener('scroll',()=>{if(popup)close();},true);
function ensureInitial(){if(!syncTriggerValue())setTimeout(syncTriggerValue,120);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureInitial,{once:true});else ensureInitial();
[200,600,1200,2500].forEach(ms=>setTimeout(syncTriggerValue,ms));


function alignWorkOrderFilterRow(){
  const panel=root()?.querySelector('#namo-work-inquiry');
  const grid=panel?.querySelector('.nwi-grid');
  const period=panel?.querySelector('.nwi-period-label');
  const lot=panel?.querySelector('[data-filter="2"]')?.closest('label');
  const workNo=panel?.querySelector('[data-filter="6"]')?.closest('label');
  if(!grid||!period||!lot||!workNo)return false;
  // Visible order: 고객사 → 제품명 → 작업지시번호 → 진행상태 → 작업기간 → 생산 LOT.
  const status=panel?.querySelector('[data-filter="3"]')?.closest('label');
  if(status&&workNo.nextElementSibling!==status)status.insertAdjacentElement('beforebegin',workNo);
  if(period.nextElementSibling!==lot)period.insertAdjacentElement('afterend',lot);
  grid.classList.add('nwi-single-row-six');
  return true;
}
function ensureWorkOrderFilterRow(){
  if(!alignWorkOrderFilterRow())setTimeout(alignWorkOrderFilterRow,120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureWorkOrderFilterRow,{once:true});else ensureWorkOrderFilterRow();
[200,600,1200,2500].forEach(ms=>setTimeout(alignWorkOrderFilterRow,ms));

})();
