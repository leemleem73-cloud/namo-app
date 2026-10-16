/* LOT presentation: reuse the work-order inquiry structure and existing trace controls. */
(()=>{'use strict';const root=document.querySelector('#lotTrace'),shell=root?.querySelector('.lot-shell');if(!shell||shell.dataset.workFrame)return;shell.dataset.workFrame='1';
const tabs=shell.querySelector('.lot-mode-tabs'),grid=shell.querySelector('.lot-search-grid'),search=shell.querySelector('.lot-search-card'),summary=shell.querySelector('#lotSummary');
const label=document.createElement('label');label.className='lot-field lot-work-mode';label.innerHTML='<span>조회구분</span><select class="lot-mode-native" aria-label="LOT 조회구분"><option value="raw">원자재 LOT</option><option value="intermediate">중간재 배치</option><option value="finished">완제품 LOT</option></select>';grid.prepend(label);tabs.hidden=true;
const select=label.querySelector('select'),ids={raw:'lotRawMode',intermediate:'lotIntermediateMode',finished:'lotFinishedMode'};select.onchange=()=>root.querySelector('#'+ids[select.value]).click();
const actions=document.createElement('div');actions.className='lot-work-actions';const buttons=document.createElement('div');buttons.className='lot-work-buttons';const clear=root.querySelector('#lotResetBtn'),query=root.querySelector('#lotSearchBtn');clear.textContent='조건 지우기';query.textContent='조회';buttons.append(clear,query);actions.append(summary,buttons);search.append(actions);
root.querySelector('.lot-hero-copy h1').textContent='LOT 추적 조회';root.querySelector('#lotResultTitle').before(document.createTextNode('▸ '));
})();
