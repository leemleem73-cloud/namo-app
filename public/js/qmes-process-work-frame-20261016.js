/* Process inspection frame only; native records, queries and actions stay owned by existing code. */
(()=>{'use strict';
const root=document.querySelector('#process'),shell=root?.querySelector('.iqc-work-frame');if(!shell)return;
root.classList.add('process-current-work');
const head=shell.querySelector('.iqc-list-head'),query=shell.querySelector('.iqc-query-search'),clear=shell.querySelector('.iqc-query-clear'),range=shell.querySelector('.iqc-date-range'),dates=[...range.querySelectorAll('input')],list=shell.querySelector('.ip-table-wrap'),pager=shell.querySelector('.ip-footnote');
const tools=document.createElement('div');tools.className='qpc-head-tools';query.classList.remove('primary');query.removeAttribute('title');query.setAttribute('aria-label','조회');query.dataset.workTooltip='조회';query.innerHTML='<svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.75"/><path d="m13 13 4 4"/></svg>';
const toggle=document.createElement('button');toggle.type='button';toggle.className='btn qpc-toggle';list.id='qpc-result-list';pager.id='qpc-result-pages';toggle.setAttribute('aria-controls',list.id+' '+pager.id);toggle.innerHTML='<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
function state(){const open=!shell.classList.contains('qpc-list-folded');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'공정검사 현황 접기':'공정검사 현황 펼침');toggle.dataset.workTooltip=open?'접기':'펼침';}
toggle.onclick=()=>{shell.classList.toggle('qpc-list-folded');state();};query.addEventListener('click',()=>{shell.classList.remove('qpc-list-folded');state();});state();tools.append(clear,query,toggle);head.append(tools);
dates[0].dataset.processPeriod='start';dates[1].dataset.processPeriod='end';[...range.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE||n.nodeName==='SPAN').forEach(n=>n.remove());
const period=document.createElement('button');period.type='button';period.className='qpc-period-trigger';period.setAttribute('aria-label','검사기간 선택');period.setAttribute('aria-expanded','false');period.setAttribute('aria-haspopup','dialog');period.innerHTML='<span class="qpc-period-value">기간 선택</span><span aria-hidden="true" style="font-size:18px">▦</span>';range.append(period);
function periodValue(){period.querySelector('.qpc-period-value').textContent=dates[0].value&&dates[1].value?dates[0].value+' ~ '+dates[1].value:'기간 선택';}dates.forEach(d=>d.addEventListener('change',periodValue));clear.addEventListener('click',periodValue);periodValue();
const style=document.createElement('style');style.textContent=`
#process.process-current-work .iqc-work-frame .ip-panel{overflow:visible!important}
#process.process-current-work .iqc-work-frame .ip-toolbar{padding:12px 16px!important}
#process.process-current-work .iqc-work-frame .ip-filter-row{display:flex!important;flex-wrap:wrap;align-items:center;gap:10px 20px!important}
#process.process-current-work .iqc-work-frame .ip-filter{flex:0 0 auto;gap:8px;margin:0;min-width:0}
#process.process-current-work .iqc-work-frame .ip-filter>span{flex:0 0 auto;min-width:0;text-align:left;font-size:11.5px;line-height:30px;white-space:nowrap}
#process.process-current-work .iqc-work-frame .ip-filter .input{box-sizing:border-box;width:144px!important;flex:0 0 144px;height:30px!important;border-radius:4px!important;font-size:12px!important}
#process.process-current-work .iqc-date-range{width:208px!important;flex:0 0 208px;height:30px!important;border:0!important;background:transparent!important;border-radius:0!important}
#process.process-current-work .iqc-work-frame .iqc-date-range>input{display:none!important}
#process.process-current-work .qpc-period-trigger{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;width:208px;height:30px;padding:0 8px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#243e5d;font:600 12px Arial,sans-serif;cursor:pointer}
#process.process-current-work .qpc-period-value{white-space:nowrap}
#process.process-current-work .iqc-query-count,#process.process-current-work .iqc-list-total{display:none!important}
#process.process-current-work .iqc-query-actions{justify-content:flex-end;margin-top:10px}
#process.process-current-work .iqc-query-actions:not(:has(.btn:not([hidden]))){display:none!important}
#process.process-current-work .iqc-work-frame .iqc-query-actions .ip-actions .btn{height:30px!important;padding:4px 10px!important;border-radius:4px!important;font-size:11.5px!important;margin:0!important}
#process.process-current-work .iqc-list-head{min-height:52px;box-sizing:border-box;padding:11px 16px!important;align-items:center;gap:10px;flex-wrap:wrap}
#process.process-current-work .qpc-head-tools{display:flex;gap:8px;align-items:center;margin-left:auto}
#process.process-current-work .iqc-work-frame .qpc-head-tools .btn{position:relative;display:inline-flex;align-items:center;justify-content:center;height:30px!important;min-height:30px;padding:4px 10px!important;border:1px solid #c7d6e5;border-radius:4px!important;background:#fff!important;color:#40566d!important;font:600 11.5px/20px Arial,sans-serif!important;cursor:pointer;overflow:visible;box-shadow:none!important}
#process.process-current-work .iqc-work-frame .qpc-head-tools .iqc-query-search,#process.process-current-work .iqc-work-frame .qpc-head-tools .qpc-toggle{width:30px;min-width:30px;padding:0!important}
#process.process-current-work .qpc-head-tools .btn:hover{background:#edf5fc!important}
#process.process-current-work .qpc-head-tools .btn:focus-visible{outline:2px solid #247bd1;outline-offset:2px}
#process.process-current-work .qpc-toggle[aria-expanded="true"] svg{transform:rotate(180deg)}
#process.process-current-work .qpc-head-tools [data-work-tooltip]::after{content:attr(data-work-tooltip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);display:block;padding:6px 10px;min-width:max-content;background:#fff;color:#25384a;border:1px solid #aebdca;border-radius:3px;box-shadow:0 2px 6px #192d4124;font:600 12px/18px Arial,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;visibility:hidden;z-index:20}
#process.process-current-work .qpc-head-tools [data-work-tooltip]:hover::after,#process.process-current-work .qpc-head-tools [data-work-tooltip]:focus-visible::after{opacity:1;visibility:visible}
#process.process-current-work .qpc-list-folded .ip-table-wrap,#process.process-current-work .qpc-list-folded .ip-footnote{display:none!important}

/* Process list row proportions only: compact blue heading, roomier white rows. */
html body #process .inspection-premium table.ip-table thead tr>th{
 height:34px!important;min-height:34px!important;padding:6px 12px!important;line-height:1.15!important;box-sizing:border-box!important
}
html body #process .inspection-premium table.ip-table tbody tr>td{
 height:44px!important;min-height:44px!important;padding:8px 12px!important;line-height:18px!important;box-sizing:border-box!important
}
html body #process .inspection-premium table.ip-table thead tr>th:first-child,
html body #process .inspection-premium table.ip-table tbody tr>td:first-child{padding-left:6px!important;padding-right:6px!important}

html body #process .inspection-premium table.ip-table th:has(input[type="checkbox"]),
html body #process .inspection-premium table.ip-table td:has(input[type="checkbox"]){
 text-align:center!important;vertical-align:middle!important;padding:0!important
}
html body #process .inspection-premium table.ip-table input[type="checkbox"]{
 display:block!important;margin:0 auto!important;float:none!important;position:static!important;transform:none!important;vertical-align:middle!important
}

/* Checkbox and No. are separate visual subcolumns within the first table cell. */
html body #process .inspection-premium table.ip-table thead tr>th:first-child,
html body #process .inspection-premium table.ip-table tbody tr>td:first-child{
 padding:0!important;text-align:center!important;vertical-align:middle!important
}
html body #process .inspection-premium table.ip-table .iqc-select-head,
html body #process .inspection-premium table.ip-table .iqc-select-number{
 display:grid!important;grid-template-columns:34px minmax(0,1fr)!important;
 align-items:center!important;justify-items:center!important;
 width:100%!important;min-height:0!important;gap:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important
}
html body #process .inspection-premium table.ip-table .iqc-select-head{height:34px!important;color:inherit!important}
html body #process .inspection-premium table.ip-table .iqc-select-number{height:44px!important}
html body #process .inspection-premium table.ip-table .iqc-select-head input[type="checkbox"],
html body #process .inspection-premium table.ip-table .iqc-select-number input[type="checkbox"]{
 margin:0!important;justify-self:center!important;align-self:center!important
}
html body #process .inspection-premium table.ip-table thead .iqc-select-head .iqc-column-label{
 font-weight:600!important;font-family:inherit!important;color:inherit!important
}

/* Match incoming inspection report/edit button colors only. */
#process.process-current-work .inspection-premium .ip-table .pqc-report-view{color:#245b9e!important;border-color:#cbdaf0!important;background:#f5f9ff!important}
#process.process-current-work .inspection-premium .ip-table .pqc-remarks-edit{color:#315f94!important;border-color:#cbd8e7!important;background:#f7faff!important}
`;document.head.append(style);
})();

/* Process inspection date popup only. Preserve native date filters, row data and query handlers. */
(()=>{'use strict';let popup=null,trigger=null,start='',end='',picking=false,month=null;
const root=()=>document.querySelector('#process');
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function close(focus=false){popup?.remove();popup=null;trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus();}
function position(){if(!popup||!trigger)return;const r=trigger.getBoundingClientRect(),box=popup.getBoundingClientRect();popup.style.left=Math.max(6,Math.min(r.left,innerWidth-box.width-6))+'px';popup.style.top=(r.bottom+box.height+5<innerHeight?r.bottom+4:Math.max(6,r.top-box.height-4))+'px';}
function draw(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let cells='';for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';for(let n=1;n<=days;n++){const value=fmt(new Date(y,m,n)),weekday=(first+n-1)%7;cells+='<button type="button" data-day="'+value+'" class="'+(weekday===0||weekday===6?'weekend ':'')+(value===start||value===end?'chosen ':start&&end&&value>start&&value<end?'between ':'')+'" aria-label="'+value+'" aria-pressed="'+(value===start||value===end)+'"'+(value===today()?' aria-current="date"':'')+'>'+n+'</button>';}
popup.innerHTML='<div class="nwm-head"><button type="button" data-month="-12" aria-label="이전 해">«</button><button type="button" data-month="-1" aria-label="이전 달">‹</button><strong>'+y+'.'+String(m+1).padStart(2,'0')+'</strong><button type="button" data-month="1" aria-label="다음 달">›</button><button type="button" data-month="12" aria-label="다음 해">»</button></div><div class="nwm-days">'+['일','월','화','수','목','금','토'].map(v=>'<span class="nwm-week">'+v+'</span>').join('')+cells+'</div><div class="nwm-hint" aria-live="polite">'+(picking?start+' ~ 종료일 선택':'시작일 → 종료일 순서로 선택')+'</div><div class="nwm-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button><button type="button" data-close>닫기</button></div>';position();}
function apply(a,b){const panel=root();if(!panel)return;const from=panel.querySelector('[data-process-period="start"]'),to=panel.querySelector('[data-process-period="end"]'),value=panel.querySelector('.qpc-period-value');if(!from||!to||!value)return;from.value=a;to.value=b;value.textContent=a&&b?a+' ~ '+b:'기간 선택';close(true);panel.querySelector('.iqc-query-search')?.click();}
function open(button){if(popup){close(true);return;}const panel=root();if(!panel)return;trigger=button;panel.querySelectorAll('.nwi-period-popup').forEach(p=>p.hidden=true);start=panel.querySelector('[data-process-period="start"]')?.value||'';end=panel.querySelector('[data-process-period="end"]')?.value||'';picking=false;month=new Date((start||today())+'T12:00:00');month=new Date(month.getFullYear(),month.getMonth(),1);popup=document.createElement('div');popup.className='namo-process-mini-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','검사기간 선택');document.body.append(popup);trigger.setAttribute('aria-expanded','true');draw();popup.querySelector('[data-day="'+(start||today())+'"]')?.focus();}
window.addEventListener('click',event=>{const button=event.target.closest?.('#process .qpc-period-trigger');if(button){event.preventDefault();event.stopImmediatePropagation();open(button);return;}const action=event.target.closest?.('.namo-process-mini-calendar button');if(!action||!popup)return;event.preventDefault();event.stopImmediatePropagation();if(action.hasAttribute('data-month')){month=new Date(month.getFullYear(),month.getMonth()+Number(action.dataset.month),1);draw();}else if(action.dataset.day){if(!picking){start=action.dataset.day;end='';picking=true;draw();}else{end=action.dataset.day;if(end<start)[start,end]=[end,start];apply(start,end);}}else if(action.hasAttribute('data-today'))apply(today(),today());else if(action.hasAttribute('data-clear'))apply('','');else close(true);},true);
document.addEventListener('pointerdown',event=>{if(popup&&!event.target.closest('.namo-process-mini-calendar,#process .qpc-period-trigger'))close();},true);
window.addEventListener('keydown',event=>{if(popup&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},true);
window.addEventListener('resize',position);window.addEventListener('scroll',()=>{if(popup)close();},true);
const style=document.createElement('style');style.textContent=`
.namo-process-mini-calendar{position:fixed;z-index:2147483000;box-sizing:border-box;width:220px;max-width:calc(100vw - 12px);padding:8px;background:#fff;border:1px solid #b8c4d0;border-radius:3px;box-shadow:0 4px 14px #0002;color:#344254;font:12px Arial,"Malgun Gothic",sans-serif}
.namo-process-mini-calendar *{box-sizing:border-box}
.namo-process-mini-calendar button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:2px;padding:0;min-width:0;box-shadow:none}
.namo-process-mini-calendar button:focus-visible{outline:2px solid #499cef;outline-offset:-2px}
.namo-process-mini-calendar .nwm-head{display:flex;align-items:center;justify-content:space-between;height:29px;margin-bottom:7px;border-bottom:1px solid #e1e6eb}
.namo-process-mini-calendar .nwm-head strong{font-size:13px;color:#172b40}
.namo-process-mini-calendar .nwm-head button{width:24px;height:25px;font-size:18px;color:#83909c}
.namo-process-mini-calendar .nwm-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}
.namo-process-mini-calendar .nwm-days>*{height:25px;line-height:25px;text-align:center;font-size:11px}
.namo-process-mini-calendar .nwm-week{color:#89939e;font-weight:400}
.namo-process-mini-calendar .weekend{color:#e14d4d}
.namo-process-mini-calendar .nwm-days button:hover{background:#e4f0ff}
.namo-process-mini-calendar .nwm-days .between{background:#edf5ff}
.namo-process-mini-calendar .nwm-days .chosen{background:#2689ef;color:#fff}
.namo-process-mini-calendar .nwm-days [aria-current="date"]:not(.chosen){font-weight:700;box-shadow:inset 0 0 0 1px #8cbcf0}
.namo-process-mini-calendar .nwm-hint{font-size:10px;min-height:24px;padding-top:7px;color:#61768b;text-align:center}
.namo-process-mini-calendar .nwm-foot{display:flex;gap:4px;margin-top:5px;padding-top:7px;border-top:1px solid #e1e6eb}
.namo-process-mini-calendar .nwm-foot button{border:1px solid #d3d9df;background:#fff;height:23px;padding:0 7px;font-size:11px}
.namo-process-mini-calendar .nwm-foot [data-close]{margin-left:auto}
`;document.head.append(style);
})();
