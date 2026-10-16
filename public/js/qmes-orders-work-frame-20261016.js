/* Orders inquiry frame: additive UI patch; native forms and data owners remain intact. */
(()=>{'use strict';
const root=document.querySelector('#orders'),shell=root?.querySelector('.module-shell');if(!shell)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
root.classList.add('orders-work-frame');
const toolbar=shell.querySelector('.module-toolbar'),filters=toolbar.querySelector('.filters'),tools=toolbar.querySelector('.table-tools'),header=root.querySelector('.page-head');header.classList.add('qpf-header');header.querySelector('h1').textContent='수주납기 등록 및 조회';header.querySelector('p')?.remove();header.querySelector('.date-badge')?.remove();header.append(tools);shell.prepend(header);tools.querySelector('.export-btn').textContent='CSV 내보내기';tools.querySelector('.new-btn').textContent='+ 신규 수주 등록';
const search=filters.querySelector('.search-input'),dates=[...filters.querySelectorAll('input[type=date]')];search.placeholder='전체';
function field(title,input){const box=document.createElement('label');box.className='qpf-field';const span=document.createElement('span');span.textContent=title;box.append(span,input);return box;}
function input(cls){const el=document.createElement('input');el.className='input '+cls;el.placeholder='전체';return el;}
const customer=input('qof-customer'),product=input('qof-product'),status=document.createElement('select');status.className='input qof-status';status.innerHTML=['전체','대기','진행','생산진행','완료','취소'].map(v=>'<option>'+v+'</option>').join('');
const range=document.createElement('div');range.className='qof-range';dates[0].setAttribute('aria-label','수주 시작일');dates[1].setAttribute('aria-label','수주 종료일');range.append(dates[0],document.createTextNode('~'),dates[1]);
const grid=document.createElement('div');grid.className='qpf-grid';grid.append(field('고객사',customer),field('제품명',product),field('진행상태',status),field('통합검색',search),field('수주기간',range));filters.replaceChildren(grid);range.parentElement.classList.add('qof-range-field');
const actions=document.createElement('div');actions.className='qpf-actions';actions.innerHTML='<span class="qpf-count">조회 0건</span><div class="qpf-buttons"><button type="button" class="btn qpf-print" hidden>선택 인쇄 (0)</button><button type="button" class="btn qpf-mail" hidden>선택 메일 전송 (0)</button><button type="button" class="btn qpf-delete" hidden>선택 삭제 (0)</button><button type="button" class="btn qof-clear">조건 지우기</button><button type="button" class="btn qof-search">조회</button></div>';toolbar.append(actions);
const wrap=shell.querySelector('.module-body'),table=wrap.querySelector('table'),body=table.tBodies[0],listHead=document.createElement('div');listHead.className='qpf-list-head';listHead.innerHTML='<span>▸ 수주납기 현황</span><span class="qpf-total">총 0건</span>';wrap.before(listHead);const pager=document.createElement('div');pager.className='qof-pager';shell.append(pager);
let rows=[...body.querySelectorAll('tr.data-row')],page=1;const selected=new Set();
const all=document.createElement('input');all.type='checkbox';all.className='qpf-check-all';all.setAttribute('aria-label','조회된 수주 전체 선택');const label=document.createElement('label');label.className='qpf-select';const no=document.createElement('span');no.textContent='No.';label.append(all,no);table.tHead.rows[0].cells[0].replaceChildren(label);
const text=(row,n)=>row.cells[n]?.textContent.trim()||'';
function matching(){const q=search.value.trim().toLowerCase();return rows.filter(row=>(!customer.value||text(row,2).toLowerCase().includes(customer.value.trim().toLowerCase()))&&(!product.value||text(row,3).toLowerCase().includes(product.value.trim().toLowerCase()))&&(status.value==='전체'||text(row,7)===status.value)&&(!dates[0].value||text(row,1)>=dates[0].value)&&(!dates[1].value||text(row,1)<=dates[1].value)&&(!q||row.textContent.toLowerCase().includes(q)));}
function update(){const matches=matching(),count=matches.filter(row=>selected.has(row)).length;all.checked=!!matches.length&&count===matches.length;all.indeterminate=count>0&&count<matches.length;for(const [cls,title] of [['print','선택 인쇄'],['mail','선택 메일 전송'],['delete','선택 삭제']]){const button=actions.querySelector('.qpf-'+cls);button.hidden=!selected.size;button.textContent=title+' ('+selected.size+')';if(cls==='delete'){button.disabled=true;button.title='기존 수주 저장소의 삭제 기능 연결이 필요합니다.';}}body.querySelectorAll('.qpf-check').forEach(box=>box.checked=selected.has(box.closest('tr')));}
function render(){observer.disconnect();for(const row of rows){row.style.display='';if(!row.querySelector('.qpf-check')){const cell=row.cells[0],label=document.createElement('label');label.className='qpf-select';const box=document.createElement('input');box.type='checkbox';box.className='qpf-check';box.setAttribute('aria-label','수주 선택');const number=document.createElement('span');number.textContent=cell.textContent.trim();label.append(box,number);cell.replaceChildren(label);box.onchange=()=>{box.checked?selected.add(row):selected.delete(row);update();};}}
const matches=matching(),pages=Math.max(1,Math.ceil(matches.length/10));page=Math.min(Math.max(1,page),pages);const start=(page-1)*10;body.replaceChildren(...matches.slice(start,start+10));[...body.rows].forEach((row,i)=>row.querySelector('.qpf-select span').textContent=String(start+i+1));if(!body.rows.length){const row=body.insertRow(),cell=row.insertCell();cell.colSpan=table.tHead.rows[0].cells.length;cell.textContent='조회된 수주납기 내역이 없습니다.';cell.style.padding='28px';}
actions.querySelector('.qpf-count').textContent='조회 '+matches.length+'건';listHead.querySelector('.qpf-total').textContent='총 '+matches.length+'건';pager.replaceChildren();function button(title,n,disabled){const b=document.createElement('button');b.type='button';b.className='btn'+(n===page?' active':'');b.textContent=title;b.disabled=disabled;b.onclick=()=>{page=n;render();};pager.append(b);}button('‹',page-1,page===1);for(let n=1;n<=pages;n++)button(String(n),n,false);button('›',page+1,page===pages);update();observer.observe(body,{childList:true});}
const observer=new MutationObserver(()=>{const fresh=[...body.querySelectorAll('tr.data-row')];if(fresh.some(row=>!rows.includes(row))){rows=fresh;for(const row of selected)if(!rows.includes(row))selected.delete(row);render();}});
// Block checkbox clicks before native row-detail handlers, while keeping their change events.
wrap.addEventListener('click',event=>{if(event.target.closest('.qpf-select'))event.stopPropagation();},true);
all.onchange=()=>{matching().forEach(row=>all.checked?selected.add(row):selected.delete(row));update();};
const query=()=>{page=1;render();};[customer,product,search].forEach(el=>el.addEventListener('input',query));[...dates,status].forEach(el=>el.addEventListener('change',query));actions.querySelector('.qof-search').onclick=query;actions.querySelector('.qof-clear').onclick=()=>{[customer,product,search,...dates].forEach(el=>el.value='');status.value='전체';query();};
actions.querySelector('.qpf-mail').onclick=()=>{const records=rows.filter(row=>selected.has(row));location.href='mailto:?subject='+encodeURIComponent('[나모케미칼 QMES] 수주납기 '+records.length+'건 전달')+'&body='+encodeURIComponent('안녕하세요.\n\n수주납기 내역을 전달드립니다.\n\n'+records.map((row,i)=>(i+1)+'. '+[1,2,3,4,5,6,7].map(n=>text(row,n)).join(' / ')).join('\n')+'\n\n감사합니다.');};
actions.querySelector('.qpf-print').onclick=()=>{const records=rows.filter(row=>selected.has(row)),win=window.open('','_blank');if(!win){alert('팝업을 허용한 후 다시 인쇄해 주세요.');return;}win.addEventListener('load',()=>win.print(),{once:true});win.document.write('<!doctype html><html lang="ko"><meta charset="utf-8"><title>수주납기 선택 인쇄</title><style>@page{size:A4 landscape;margin:12mm}body{font:12px Arial;color:#172033}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #c5d2e1;padding:8px;text-align:center}th{background:#e8f0f8}tr{break-inside:avoid}</style><h1>나모케미칼 수주납기 현황</h1><p>선택 '+records.length+'건</p><table><thead><tr>'+[...table.tHead.rows[0].cells].map((cell,i)=>'<th>'+esc(i?cell.textContent:'No.')+'</th>').join('')+'</tr></thead><tbody>'+records.map((row,i)=>'<tr>'+[...row.cells].map((cell,n)=>'<td>'+esc(n?cell.textContent:i+1)+'</td>').join('')+'</tr>').join('')+'</tbody></table></html>');win.document.close();};
tools.querySelector('.export-btn').addEventListener('click',event=>{event.stopImmediatePropagation();const holder=document.createElement('div'),copy=table.cloneNode(true);copy.tBodies[0].replaceChildren(...matching().map(row=>row.cloneNode(true)));holder.append(copy);exportTable(holder,'수주납기 관리');},true);
window.qmesOrdersInquiry={refresh(){rows=[...body.querySelectorAll('tr.data-row')];selected.clear();render();}};
render();
const style=document.createElement("style");style.textContent=`
#orders.orders-work-frame .module-shell{border:1px solid #d2dfed!important;border-radius:10px!important;overflow:visible!important;background:#fff!important;box-shadow:0 8px 24px #18335313!important}
#orders.orders-work-frame .qpf-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:64px!important;margin:0!important;padding:14px 22px!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:10px 10px 0 0!important;background:#fff!important}
#orders.orders-work-frame .qpf-header h1{display:flex;align-items:center;gap:10px;font-size:18px!important;margin:0!important;color:#173b61!important}
#orders.orders-work-frame .qpf-header h1:before{content:'';width:3px;height:24px;border-radius:2px;background:#166fbb}
#orders.orders-work-frame .qpf-header .table-tools{display:flex;gap:6px;margin-left:auto}
#orders.orders-work-frame .module-toolbar{display:block!important;padding:20px 22px 18px!important;border:0!important;border-bottom:1px solid #dae5ef!important;border-radius:0!important;background:#f3f7fb!important}
#orders.orders-work-frame .module-toolbar .filters{display:block!important;max-width:none!important;width:100%!important}
#orders.orders-work-frame .qpf-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px 20px}
#orders.orders-work-frame .qpf-field{display:flex;align-items:center;gap:8px;min-width:0}
#orders.orders-work-frame .qpf-field>span{flex:0 0 78px;text-align:right;font-size:12.5px;font-weight:700;color:#334e6b}
#orders.orders-work-frame .qpf-field input,#orders.orders-work-frame .qpf-field select{height:38px!important;min-width:0!important;width:100%!important;padding:0 11px!important;font-size:13px!important;font-weight:400!important;border:1px solid #c7d6e5!important;border-radius:7px!important;background:#fff!important;color:#243e5d!important}
#orders.orders-work-frame .qpf-field .pcal-root{flex:1;max-width:none!important;width:100%!important;grid-column:auto!important;grid-row:auto!important}
#orders.orders-work-frame .qpf-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px}
#orders.orders-work-frame .qpf-count{font-size:12.5px;font-weight:700;color:#526a83}
#orders.orders-work-frame .qpf-buttons{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
#orders.orders-work-frame .qpf-header .btn,#orders.orders-work-frame .qpf-buttons .btn{display:inline-flex!important;align-items:center;justify-content:center;height:38px!important;padding:8px 15px!important;border-radius:7px!important;font-size:12.5px!important;font-weight:700!important;margin:0!important}
#orders.orders-work-frame .qpf-header .primary,#orders.orders-work-frame .qpf-buttons .qof-search{background:#166fbb!important;color:#fff!important;border-color:#166fbb!important}
#orders.orders-work-frame .qpf-buttons .btn[hidden]{display:none!important}
#orders.orders-work-frame .qpf-buttons .qpf-print{background:#eaf3ff;color:#245482;border:1px solid #c8daed}
#orders.orders-work-frame .qpf-buttons .qpf-mail{background:#ecf6f1;color:#21634b;border:1px solid #c9e1d6}
#orders.orders-work-frame .qpf-buttons .qpf-delete{background:#fff1f1;color:#b23535;border:1px solid #e9cccc;margin-right:10px!important}
#orders.orders-work-frame .qpf-list-head{display:flex;justify-content:space-between;padding:17px 22px 14px;color:#1e3f64;font-size:13.5px;font-weight:800}
#orders.orders-work-frame .qpu-db-message{display:none!important}
#orders.orders-work-frame .module-shell>.module-body{margin:0 16px 16px!important;border:1px solid #d5dce5!important;border-radius:0!important;overflow:auto!important}
#orders.orders-work-frame .module-shell>.module-body table{width:100%!important;min-width:1000px;table-layout:fixed!important;border-collapse:separate!important;border-spacing:0!important;border:0!important}
#orders.orders-work-frame .module-shell>.module-body table th{height:34px!important;padding:6px 12px!important;font-size:12px!important;font-weight:600!important;background:#e8f0f8!important;color:#244260!important;border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;text-align:center!important}
#orders.orders-work-frame .module-shell>.module-body table td{height:36px!important;padding:4px 12px!important;font-size:12px!important;line-height:1.2!important;font-weight:400!important;background:#fff!important;color:#344054!important;border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;text-align:center!important}
#orders.orders-work-frame .module-shell>.module-body table tbody tr:nth-child(even)>td{background:#fcfdff!important}
#orders.orders-work-frame .module-shell>.module-body table tbody tr:hover>td{background:#eef6ff!important}
#orders.orders-work-frame .module-shell>.module-body table th:first-child,#orders.orders-work-frame .module-shell>.module-body table td:first-child{position:relative;width:86px!important;min-width:86px!important;max-width:86px!important;padding:0!important;color:#000!important;text-decoration:none!important}
#orders.orders-work-frame .module-shell>.module-body table col:first-child{width:86px!important}
#orders.orders-work-frame .module-shell>.module-body table th:first-child:before,#orders.orders-work-frame .module-shell>.module-body table tr.data-row>td:first-child:before{content:'';position:absolute;left:34px;top:0;bottom:0;width:1px;background:#d5dce5;pointer-events:none}
#orders.orders-work-frame .qpf-select{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;min-height:34px;width:100%;margin:0}
#orders.orders-work-frame .qpf-select input{position:static!important;width:13px!important;height:13px!important;min-width:13px!important;margin:auto!important;accent-color:#2563eb}
#orders.orders-work-frame .qpf-select span{color:#000!important;font-weight:400!important;text-decoration:none!important;cursor:default}
#orders.orders-work-frame .module-shell>.module-body tbody td.qpu-order-number{color:#1689ed!important;text-decoration:underline!important;font-weight:600!important;cursor:pointer!important}
#orders.orders-work-frame .qof-pager{border:0!important;background:#fff!important;padding:10px 16px 20px!important;border-radius:0 0 10px 10px}
#orders.orders-work-frame .qof-pager>span{display:none}
@media(max-width:1100px){#orders.orders-work-frame .qpf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){#orders.orders-work-frame .qpf-grid{grid-template-columns:minmax(0,1fr)}#orders.orders-work-frame .qpf-actions{align-items:flex-start;flex-direction:column}}

#orders.orders-work-frame .qof-range-field{grid-column:span 2}#orders.orders-work-frame .qof-range{width:100%;flex:1;display:flex;align-items:center;gap:5px;min-width:0}#orders.orders-work-frame .qof-range input{min-width:0;width:100%}#orders.orders-work-frame .qof-pager{display:flex;justify-content:center;gap:5px}#orders.orders-work-frame .qof-pager button{min-width:25px;height:25px;padding:2px 8px}#orders.orders-work-frame .qof-pager .active{background:#166fbb;color:white}#orders.orders-work-frame .qpf-select span{text-align:center}@media(max-width:650px){#orders.orders-work-frame .qof-range-field{grid-column:auto}}

/* Compact inquiry and result tools, matching the current work-order screen. */
#orders.orders-work-frame,#orders.orders-work-frame .module-shell,#orders.orders-work-frame .module-toolbar,#orders.orders-work-frame .module-toolbar .filters,#orders.orders-work-frame .qpf-grid{min-width:0!important;box-sizing:border-box!important;max-width:100%!important}
#orders.orders-work-frame .module-shell{width:100%!important}
#orders.orders-work-frame .module-shell>.module-body{min-width:0!important;max-width:calc(100% - 32px)!important}
#orders.orders-work-frame .module-toolbar{padding:12px 16px!important}
#orders.orders-work-frame .qpf-grid{display:flex!important;flex-wrap:wrap;align-items:center;gap:10px 20px}
#orders.orders-work-frame .qpf-field{flex:0 0 auto;gap:8px;margin:0}
#orders.orders-work-frame .qpf-field>span{flex:0 0 auto;text-align:left;font-size:11.5px;line-height:30px;white-space:nowrap}
#orders.orders-work-frame .qpf-field input,#orders.orders-work-frame .qpf-field select{width:144px!important;flex:0 0 144px;height:30px!important;border-radius:4px!important;font-size:12px!important;box-sizing:border-box}
#orders.orders-work-frame .qof-range{width:208px!important;flex:0 0 208px}
#orders.orders-work-frame .qof-range>input{display:none!important}
#orders.orders-work-frame .qof-period-trigger{display:flex;align-items:center;justify-content:space-between;width:208px;height:30px;padding:0 8px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#243e5d;font:600 12px Arial,sans-serif;cursor:pointer}
#orders.orders-work-frame .qof-period-value{white-space:nowrap}
#orders.orders-work-frame .qpf-count,#orders.orders-work-frame .qpf-total{display:none!important}
#orders.orders-work-frame .qpf-actions:not(:has(.btn:not([hidden]))){display:none!important}
#orders.orders-work-frame .qpf-buttons .btn{height:30px!important;padding:4px 10px!important;border-radius:4px!important;font-size:11.5px!important}
#orders.orders-work-frame .qpf-list-head{min-height:52px;box-sizing:border-box;padding:11px 16px!important;align-items:center;gap:10px;flex-wrap:wrap}
#orders.orders-work-frame .qow-head-tools{display:flex;gap:8px;align-items:center;margin-left:auto}
#orders.orders-work-frame .qow-head-tools .btn{position:relative;display:inline-flex;align-items:center;justify-content:center;height:30px;min-height:30px;padding:4px 10px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#40566d;font:600 11.5px/20px Arial,sans-serif;cursor:pointer;overflow:visible}
#orders.orders-work-frame .qow-head-tools .qof-search,#orders.orders-work-frame .qow-head-tools .qof-toggle{width:30px;min-width:30px;padding:0}
#orders.orders-work-frame .qow-head-tools .btn:hover{background:#edf5fc}
#orders.orders-work-frame .qow-head-tools .btn:focus-visible{outline:2px solid #247bd1;outline-offset:2px}
#orders.orders-work-frame .qof-toggle[aria-expanded="true"] svg{transform:rotate(180deg)}
#orders.orders-work-frame .qow-head-tools [data-work-tooltip]::after{content:attr(data-work-tooltip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);display:block;padding:6px 10px;min-width:max-content;background:#fff;color:#25384a;border:1px solid #aebdca;border-radius:3px;box-shadow:0 2px 6px #192d4124;font:600 12px/18px Arial,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;visibility:hidden;z-index:20}
#orders.orders-work-frame .qow-head-tools [data-work-tooltip]:hover::after,#orders.orders-work-frame .qow-head-tools [data-work-tooltip]:focus-visible::after{opacity:1;visibility:visible}
#orders.orders-work-frame .module-shell.qof-list-folded>.module-body,#orders.orders-work-frame .module-shell.qof-list-folded>.qof-pager{display:none!important}
`;document.head.append(style);

// Reuse native query and reset buttons; only their presentation and placement change.
const queryButton=actions.querySelector('.qof-search'),clearButton=actions.querySelector('.qof-clear'),headTools=document.createElement('div');headTools.className='qow-head-tools';
queryButton.textContent='';queryButton.setAttribute('aria-label','조회');queryButton.dataset.workTooltip='조회';queryButton.innerHTML='<svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.75"/><path d="m13 13 4 4"/></svg>';
const toggle=document.createElement('button');toggle.type='button';toggle.className='btn qof-toggle';wrap.id='qof-result-list';pager.id='qof-result-pages';toggle.setAttribute('aria-controls',wrap.id+' '+pager.id);toggle.innerHTML='<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
function toggleState(){const expanded=!shell.classList.contains('qof-list-folded');toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'수주납기 현황 접기':'수주납기 현황 펼침');toggle.dataset.workTooltip=expanded?'접기':'펼침';}
toggle.onclick=()=>{shell.classList.toggle('qof-list-folded');toggleState();};queryButton.addEventListener('click',()=>{shell.classList.remove('qof-list-folded');toggleState();});toggleState();headTools.append(clearButton,queryButton,toggle);listHead.append(headTools);
dates[0].dataset.ordersPeriod='start';dates[1].dataset.ordersPeriod='end';
// Keep native date inputs as filter owners, using one compact range-picker trigger.
[...range.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());
const period=document.createElement('button');period.type='button';period.className='qof-period-trigger';period.setAttribute('aria-label','수주기간 선택');period.setAttribute('aria-expanded','false');period.setAttribute('aria-haspopup','dialog');period.innerHTML='<span class="qof-period-value">기간 선택</span><span aria-hidden="true" style="font-size:18px">▦</span>';range.append(period);
function periodValue(){period.querySelector('.qof-period-value').textContent=dates[0].value&&dates[1].value?dates[0].value+' ~ '+dates[1].value:'기간 선택';}periodValue();dates.forEach(d=>d.addEventListener('change',periodValue));clearButton.addEventListener('click',periodValue);
})();

/* Orders inquiry date popup only. Preserve native date filters, row data and query handlers. */
(()=>{'use strict';let popup=null,trigger=null,start='',end='',picking=false,month=null;
const root=()=>document.querySelector('#orders');
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function close(focus=false){popup?.remove();popup=null;trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus();}
function position(){if(!popup||!trigger)return;const r=trigger.getBoundingClientRect(),box=popup.getBoundingClientRect();popup.style.left=Math.max(6,Math.min(r.left,innerWidth-box.width-6))+'px';popup.style.top=(r.bottom+box.height+5<innerHeight?r.bottom+4:Math.max(6,r.top-box.height-4))+'px';}
function draw(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let cells='';for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';for(let n=1;n<=days;n++){const value=fmt(new Date(y,m,n)),weekday=(first+n-1)%7;cells+='<button type="button" data-day="'+value+'" class="'+(weekday===0||weekday===6?'weekend ':'')+(value===start||value===end?'chosen ':start&&end&&value>start&&value<end?'between ':'')+'" aria-label="'+value+'" aria-pressed="'+(value===start||value===end)+'"'+(value===today()?' aria-current="date"':'')+'>'+n+'</button>';}
popup.innerHTML='<div class="nwm-head"><button type="button" data-month="-12" aria-label="이전 해">«</button><button type="button" data-month="-1" aria-label="이전 달">‹</button><strong>'+y+'.'+String(m+1).padStart(2,'0')+'</strong><button type="button" data-month="1" aria-label="다음 달">›</button><button type="button" data-month="12" aria-label="다음 해">»</button></div><div class="nwm-days">'+['일','월','화','수','목','금','토'].map(v=>'<span class="nwm-week">'+v+'</span>').join('')+cells+'</div><div class="nwm-hint" aria-live="polite">'+(picking?start+' ~ 종료일 선택':'시작일 → 종료일 순서로 선택')+'</div><div class="nwm-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button><button type="button" data-close>닫기</button></div>';position();}
function apply(a,b){const panel=root();if(!panel)return;const from=panel.querySelector('[data-orders-period="start"]'),to=panel.querySelector('[data-orders-period="end"]'),value=panel.querySelector('.qof-period-value');if(!from||!to||!value)return;from.value=a;to.value=b;value.textContent=a&&b?a+' ~ '+b:'기간 선택';close(true);panel.querySelector('.qof-search')?.click();}
function open(button){if(popup){close(true);return;}const panel=root();if(!panel)return;trigger=button;panel.querySelectorAll('.nwi-period-popup').forEach(p=>p.hidden=true);start=panel.querySelector('[data-orders-period="start"]')?.value||'';end=panel.querySelector('[data-orders-period="end"]')?.value||'';picking=false;month=new Date((start||today())+'T12:00:00');month=new Date(month.getFullYear(),month.getMonth(),1);popup=document.createElement('div');popup.className='namo-orders-mini-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','수주기간 선택');document.body.append(popup);trigger.setAttribute('aria-expanded','true');draw();popup.querySelector('[data-day="'+(start||today())+'"]')?.focus();}
window.addEventListener('click',event=>{const button=event.target.closest?.('#orders .qof-period-trigger');if(button){event.preventDefault();event.stopImmediatePropagation();open(button);return;}const action=event.target.closest?.('.namo-orders-mini-calendar button');if(!action||!popup)return;event.preventDefault();event.stopImmediatePropagation();if(action.hasAttribute('data-month')){month=new Date(month.getFullYear(),month.getMonth()+Number(action.dataset.month),1);draw();}else if(action.dataset.day){if(!picking){start=action.dataset.day;end='';picking=true;draw();}else{end=action.dataset.day;if(end<start)[start,end]=[end,start];apply(start,end);}}else if(action.hasAttribute('data-today'))apply(today(),today());else if(action.hasAttribute('data-clear'))apply('','');else close(true);},true);
document.addEventListener('pointerdown',event=>{if(popup&&!event.target.closest('.namo-orders-mini-calendar,#orders .qof-period-trigger'))close();},true);
window.addEventListener('keydown',event=>{if(popup&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},true);
window.addEventListener('resize',position);window.addEventListener('scroll',()=>{if(popup)close();},true);
const style=document.createElement('style');style.textContent=`
.namo-orders-mini-calendar{position:fixed;z-index:2147483000;box-sizing:border-box;width:220px;max-width:calc(100vw - 12px);padding:8px;background:#fff;border:1px solid #b8c4d0;border-radius:3px;box-shadow:0 4px 14px #0002;color:#344254;font:12px Arial,"Malgun Gothic",sans-serif}
.namo-orders-mini-calendar *{box-sizing:border-box}
.namo-orders-mini-calendar button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:2px;padding:0;min-width:0;box-shadow:none}
.namo-orders-mini-calendar button:focus-visible{outline:2px solid #499cef;outline-offset:-2px}
.namo-orders-mini-calendar .nwm-head{display:flex;align-items:center;justify-content:space-between;height:29px;margin-bottom:7px;border-bottom:1px solid #e1e6eb}
.namo-orders-mini-calendar .nwm-head strong{font-size:13px;color:#172b40}
.namo-orders-mini-calendar .nwm-head button{width:24px;height:25px;font-size:18px;color:#83909c}
.namo-orders-mini-calendar .nwm-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}
.namo-orders-mini-calendar .nwm-days>*{height:25px;line-height:25px;text-align:center;font-size:11px}
.namo-orders-mini-calendar .nwm-week{color:#89939e;font-weight:400}
.namo-orders-mini-calendar .weekend{color:#e14d4d}
.namo-orders-mini-calendar .nwm-days button:hover{background:#e4f0ff}
.namo-orders-mini-calendar .nwm-days .between{background:#edf5ff}
.namo-orders-mini-calendar .nwm-days .chosen{background:#2689ef;color:#fff}
.namo-orders-mini-calendar .nwm-days [aria-current="date"]:not(.chosen){font-weight:700;box-shadow:inset 0 0 0 1px #8cbcf0}
.namo-orders-mini-calendar .nwm-hint{font-size:10px;min-height:24px;padding-top:7px;color:#61768b;text-align:center}
.namo-orders-mini-calendar .nwm-foot{display:flex;gap:4px;margin-top:5px;padding-top:7px;border-top:1px solid #e1e6eb}
.namo-orders-mini-calendar .nwm-foot button{border:1px solid #d3d9df;background:#fff;height:23px;padding:0 7px;font-size:11px}
.namo-orders-mini-calendar .nwm-foot [data-close]{margin-left:auto}
`;document.head.append(style);
})();
