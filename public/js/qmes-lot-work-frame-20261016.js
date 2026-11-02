/* One compact LOT toolbar, using the existing trace controls and their handlers. */
(()=>{'use strict';
const root=document.querySelector('#lotTrace'),shell=root?.querySelector('.lot-shell');if(!shell||shell.dataset.workFrame)return;shell.dataset.workFrame='1';
const tabs=shell.querySelector('.lot-mode-tabs'),grid=shell.querySelector('.lot-search-grid'),search=shell.querySelector('.lot-search-card'),summary=shell.querySelector('#lotSummary');
if(!grid||!search)return;
const field=document.createElement('label');field.className='lot-field lot-work-mode';
field.innerHTML='<span>조회구분</span><select class="lot-mode-native" aria-label="LOT 조회구분"><option value="raw">원자재 LOT</option><option value="intermediate">중간재 배치</option><option value="finished">완제품 LOT</option></select>';grid.prepend(field);if(tabs)tabs.hidden=true;
const select=field.querySelector('select'),ids={raw:'lotRawMode',intermediate:'lotIntermediateMode',finished:'lotFinishedMode'};
const active=Object.entries(ids).find(([,id])=>root.querySelector('#'+id)?.classList.contains('active'));if(active)select.value=active[0];
select.onchange=()=>root.querySelector('#'+ids[select.value])?.click();
const range=root.querySelector('#lotRange');range?.closest('.lot-field')?.classList.add('lot-range-field');
const buttons=document.createElement('div');buttons.className='lot-work-buttons';
const clear=root.querySelector('#lotResetBtn'),query=root.querySelector('#lotSearchBtn');
clear.textContent='조건 지우기';query.textContent='조회';query.setAttribute('aria-label','LOT 조회');query.title='입력한 LOT 조회';
buttons.append(clear,query);grid.append(buttons);
const actions=document.createElement('div');actions.className='lot-work-actions';if(summary)actions.append(summary);search.append(actions);
root.querySelector('.lot-hero-copy h1').textContent='LOT 추적 조회';root.querySelector('#lotResultTitle').before(document.createTextNode('▸ '));
})();
