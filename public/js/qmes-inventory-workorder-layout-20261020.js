(function(){'use strict';
function install(){
const root=document.querySelector('#inventory .namo-new-stock');if(!root||root.dataset.woTheme)return;
root.dataset.woTheme='1';
const header=root.querySelector('header'),list=root.querySelector('.stockTable'),pager=root.querySelector('#stockPager'),h3=root.querySelector('h3');
if(!header||!list||!h3)return;
header.querySelector('h1').textContent='재고현황 등록 및 조회';header.querySelector('p')?.remove();
const controls=document.createElement('div');controls.className='stock-wo-tools';controls.innerHTML='<strong>▸ 재고현황</strong><div><button id="stock-wo-clear" type="button">조건 지우기</button><button id="stock-wo-search" type="button" title="조회">⌕</button><button id="stock-wo-fold" type="button" title="접기">⌃</button></div>';
h3.replaceWith(controls);
controls.querySelector('#stock-wo-clear').onclick=()=>root.querySelector('#stockClear')?.click();
controls.querySelector('#stock-wo-search').onclick=()=>{list.hidden=false;pager.hidden=false;root.querySelector('#stockReload')?.click();};
controls.querySelector('#stock-wo-fold').onclick=e=>{list.hidden=!list.hidden;pager.hidden=list.hidden;e.currentTarget.textContent=list.hidden?'⌄':'⌃';};
const th=list.querySelector('thead tr');if(th&&!th.querySelector('.stock-select-all')){const cell=document.createElement('th');cell.innerHTML='<input class="stock-select-all" type="checkbox">';th.prepend(cell);}
const body=list.querySelector('tbody');
if(body){const sync=()=>{for(const tr of body.rows){if(!tr.querySelector('.stock-row-check')){const td=document.createElement('td');td.innerHTML='<input class="stock-row-check" type="checkbox">';tr.prepend(td);}}};new MutationObserver(sync).observe(body,{childList:true});sync();th.querySelector('.stock-select-all').onchange=e=>{body.querySelectorAll('.stock-row-check').forEach(c=>c.checked=e.target.checked);};}
const buttons=header.querySelectorAll('button');let imported=false;for(const b of buttons){if(b.textContent.trim()==='엑셀 불러오기'){if(imported)b.remove();imported=true;}if(b.id==='stockCsv')b.textContent='엑셀 내보내기';}
const style=document.createElement('style');style.textContent=[
'#inventory .namo-new-stock{border:1px solid #d4e0ed!important;border-radius:8px!important;box-shadow:0 4px 18px #1233!important}',
'#inventory .namo-new-stock>header{min-height:55px!important;padding:12px 16px!important;border-bottom:1px solid #dce5ee!important;gap:12px!important}',
'#inventory .namo-new-stock header h1{font-size:17px!important;border-left:3px solid #1675bd!important;padding-left:9px!important}',
'#inventory .namo-new-stock button{font-size:11px!important;border-radius:4px!important;padding:7px 11px!important;margin:0 2px!important}',
'#inventory .stockFilters{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:12px!important;padding:9px 14px!important;background:#f2f6fb!important}',
'#inventory .stockFilters label{display:flex!important;flex-direction:row!important;align-items:center!important;gap:7px!important;font-size:11px!important}',
'#inventory .stockFilters input,#inventory .stockFilters select{height:29px!important;padding:3px 8px!important;font-size:11px!important}',
'#inventory .stockFilters #stockClear{display:none!important}',
'#inventory .stockCards{padding:12px 15px!important}',
'#inventory .stockCard{padding:10px 12px!important}',
'#inventory .stockCard strong{font-size:15px!important}',
'#inventory .stock-wo-tools{display:flex;justify-content:space-between;align-items:center;padding:10px 13px!important;font-size:12px;color:#214565}',
'#inventory .stock-wo-tools>div{display:flex;gap:5px}',
'#inventory .stockTable{padding:0 12px!important}',
'#inventory .stockTable th{background:#e7f0f9!important;color:#29496c!important;font-size:11px!important}',
'#inventory .stockTable td,#inventory .stockTable th{border:1px solid #d8e3ed!important;padding:9px 7px!important;font-size:11px!important}',
'#inventory .stockTable table{border-collapse:collapse!important}',
'#inventory .stockLot{border:0!important;color:#096bc0!important;text-decoration:underline!important;font-weight:bold!important}',
'#inventory #stockPager{padding:14px!important}'
].join('\n');document.head.append(style);
}
let n=0;const timer=setInterval(()=>{install();if(document.querySelector('#inventory .namo-new-stock')?.dataset.woTheme||++n>60)clearInterval(timer);},250);
})();