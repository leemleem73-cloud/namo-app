(function(){
'use strict';
if(window.__qmesWoMailComposer)return;window.__qmesWoMailComposer=true;
function scan(){
 const root=document.getElementById('work'),bar=root?.querySelector('.wo-bulk-controls');
 if(!bar)return;
 let button=bar.querySelector('.wo-bulk-mail');
 if(!button){
  button=document.createElement('button');button.type='button';button.className='btn wo-bulk-mail';button.textContent='선택 메일 전송';
  bar.insertBefore(button,bar.querySelector('.wo-bulk-delete'));
  button.addEventListener('click',()=>{
   const ids=Array.from(root.querySelectorAll('tr[data-work-saved]')).filter(r=>r.querySelector('.wo-bulk-check')?.checked).map(r=>r.dataset.workSaved);
   const data=typeof window.qmesGetWorkOrders==='function'?window.qmesGetWorkOrders():[];
   const orders=ids.map(id=>data.find(r=>String(r?.id)===id)).filter(Boolean);
   if(!orders.length)return alert('메일로 전송할 작업지시서를 선택해 주세요.');
   const subject='[나모케미칼 QMES] 작업지시서 '+orders.length+'건 전달';
   const body='안녕하세요.\n\n나모케미칼 작업지시서 '+orders.length+'건을 전달드립니다.\n\n'+orders.map((r,i)=>{
    const f=r.fields||{};return [String(i+1)+'. 작업지시번호: '+r.id,'고객사: '+(f['고객사']||'-'),'제품명: '+(f['제품명']||'-'),'생산 LOT NO: '+(f['생산 LOT NO']||'-'),'계획수량: '+(f['계획수량']||'-'),'작업기간: '+(f['작업기간']||'-'),'작업자: '+(f['작업자']||'-'),'진행상태: '+(f['진행상태']||'-')].join('\n')
   }).join('\n\n')+'\n\n확인 부탁드립니다.\n감사합니다.\n나모케미칼(주)';
   window.location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  });
 }
 const count=root.querySelectorAll('tr[data-work-saved] .wo-bulk-check:checked').length;
 button.textContent='선택 메일 전송 ('+count+')';button.disabled=count===0;
}
const style=document.createElement('style');style.textContent='.wo-bulk-controls .wo-bulk-mail{background:#ecf6f1;color:#21634b;border:1px solid #c9e1d6}';document.head.appendChild(style);
let queued=false;
new MutationObserver(ms=>{if(queued||!ms.some(m=>m.target.closest?.('#work')||Array.from(m.addedNodes).some(n=>n.nodeType===1&&n.querySelector?.('#work'))))return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}).observe(document.body,{subtree:true,childList:true});
document.addEventListener('change',e=>{if(e.target.matches?.('.wo-bulk-check,.wo-bulk-all'))queueMicrotask(scan)},true);
scan();
})();
;(function(){if(document.querySelector('script[data-qmes-customer-picker]'))return;const t=document.createElement('script');t.dataset.qmesCustomerPicker='1';t.src='./js/qmes-customer-picker-20261015.js?v=7';document.head.appendChild(t)})();

;(function(){if(document.querySelector('script[data-qmes-auto-lot]'))return;const t=document.createElement('script');t.dataset.qmesAutoLot='1';t.src='./js/qmes-auto-production-lot-20261015.js?v=2';document.head.appendChild(t)})();

;(function(){if(document.querySelector('script[data-qmes-purchase-layout]'))return;const t=document.createElement('script');t.dataset.qmesPurchaseLayout='1';t.src='./js/qmes-purchase-layout-20261015.js?v=9';document.head.appendChild(t)})();

;(function(){if(document.querySelector('script[data-qmes-purchase-calendar]'))return;const t=document.createElement('script');t.dataset.qmesPurchaseCalendar='1';t.src='./js/qmes-purchase-calendar-20261015.js?v=2';document.head.appendChild(t)})();
