/* Work inquiry only: preserve native query/reset handlers and toggle the result list. */
(()=>{'use strict';
function init(){
 const panel=document.querySelector('#work #namo-work-inquiry'),actions=panel?.querySelector('.nwi-actions'),grid=panel?.querySelector('.nwi-grid');
 const shell=panel?.closest('.module-shell'),list=shell?.querySelector(':scope>.module-body'),pager=shell?.querySelector('.nwi-pagination');
 if(!actions||!grid||!list||!pager)return false;
 if(actions.querySelector('.nwi-filter-toggle'))return true;
 list.id='nwi-work-list';pager.id='nwi-work-list-pagination';
 const search=actions.querySelector('#nwi-search');if(search){search.removeAttribute('title');search.dataset.workTooltip='조회';search.setAttribute('aria-label','조회');}
 const button=document.createElement('button');button.type='button';button.className='btn nwi-filter-toggle';button.setAttribute('aria-controls',list.id+' '+pager.id);
 const update=()=>{const expanded=!shell.classList.contains('nwi-list-folded');button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'작업지시 현황 접기':'작업지시 현황 펼침');button.dataset.workTooltip=expanded?'접기':'펼침';};
 button.innerHTML='<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
 button.onclick=()=>{shell.classList.toggle('nwi-list-folded');update();};update();actions.append(button);
 search?.addEventListener('click',()=>{shell.classList.remove('nwi-list-folded');update();});
 const style=document.createElement('style');style.textContent=`
 #work #namo-work-inquiry #nwi-search{right:54px!important}
 #work #namo-work-inquiry #nwi-clear{right:92px!important}
 #work #namo-work-inquiry .nwi-filter-toggle{position:absolute!important;right:16px!important;top:calc(100% + 11px)!important;width:30px!important;min-width:30px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#fff!important;border:1px solid #c7d6e5!important;color:#40566d!important;z-index:2}
 #work #namo-work-inquiry .nwi-filter-toggle[aria-expanded="true"] svg{transform:rotate(180deg)}
 #work #namo-work-inquiry .nwi-filter-toggle:focus-visible{outline:2px solid #247bd1!important;outline-offset:2px!important}
 #work #namo-work-inquiry [data-work-tooltip]{cursor:pointer!important;overflow:visible!important}
 #work #namo-work-inquiry [data-work-tooltip]::after{content:attr(data-work-tooltip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);display:block;padding:6px 10px;min-width:max-content;background:#fff;color:#25384a;border:1px solid #aebdca;border-radius:3px;box-shadow:0 2px 6px rgba(25,45,65,.14);font:600 12px/18px Arial,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;visibility:hidden;z-index:20}
 #work #namo-work-inquiry [data-work-tooltip]:hover::after,#work #namo-work-inquiry [data-work-tooltip]:focus-visible::after{opacity:1;visibility:visible}
 #work .module-shell.nwi-list-folded>#nwi-work-list,#work .module-shell.nwi-list-folded>#nwi-work-list-pagination{display:none!important}
 /* Work-order inquiry row only: align field sizes with purchase-order search controls. */
 #work #namo-work-inquiry .nwi-grid{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-start!important;justify-items:start!important;gap:10px 16px!important;width:100%!important;grid-template-columns:none!important}
 #work #namo-work-inquiry .nwi-grid>label:not([hidden]){display:flex!important;align-items:center!important;gap:7px!important;justify-content:flex-start!important;width:auto!important;max-width:none!important;min-width:0!important;flex:0 0 auto!important;margin:0!important;padding:0!important;grid-template-columns:none!important}
 #work #namo-work-inquiry .nwi-grid>label:not([hidden])>span{flex:0 0 auto!important;width:auto!important;min-width:0!important;margin:0!important;padding:0!important;white-space:nowrap!important;text-align:left!important;}
 #work #namo-work-inquiry .nwi-grid>label:not([hidden])>input,#work #namo-work-inquiry .nwi-grid>label:not([hidden])>select{width:195px!important;min-width:195px!important;max-width:195px!important;height:30px!important;box-sizing:border-box!important;flex:0 0 195px!important}
 #work #namo-work-inquiry .nwi-period-label .nwi-period-trigger{width:215px!important;min-width:215px!important;max-width:215px!important;height:30px!important;box-sizing:border-box!important}
  #work .module-shell>.nwi-list-head{padding-right:228px!important}
 @media(max-width:650px){#work #namo-work-inquiry .nwi-filter-toggle{top:calc(100% + 43px)!important}#work .module-shell>.nwi-list-head{padding-right:12px!important}}
 `;document.head.append(style);return true;
}
if(!init()){const observer=new MutationObserver(()=>{if(init())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});}
})();

/* Search layout is independent of whether the result folding control has mounted. */
(function(){const style=document.createElement('style');style.id='qmes-work-filter-compact-20261102';style.textContent=`
html body #work #namo-work-inquiry .nwi-grid.nwi-single-row-six,html body #work #namo-work-inquiry .nwi-grid{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-start!important;gap:8px 14px!important;grid-template-columns:none!important;width:100%!important}
html body #work #namo-work-inquiry .nwi-grid>label:not([hidden]){display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:6px!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important}
html body #work #namo-work-inquiry .nwi-grid>label:not([hidden])>span{flex:0 0 auto!important;width:auto!important;white-space:nowrap!important;margin:0!important;padding:0!important}
html body #work #namo-work-inquiry .nwi-grid>label:not([hidden])>:is(input,select,button.nwi-period-trigger){width:195px!important;min-width:195px!important;max-width:195px!important;flex:0 0 195px!important;height:30px!important;min-height:30px!important;box-sizing:border-box!important;padding:0 9px!important;margin:0!important;border:1px solid #cbdced!important;border-radius:4px!important;background:#fff!important}
html body #work #namo-work-inquiry .nwi-period-trigger{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important}
html body #work #namo-work-inquiry .nwi-period-trigger .nwi-period-icon{flex:0 0 16px!important;width:16px!important;min-width:16px!important;font-size:16px!important}
html body #work #namo-work-inquiry .nwi-hidden-filter-state{display:none!important}
`;document.head.append(style);})();
