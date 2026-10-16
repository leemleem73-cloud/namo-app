/* Work inquiry only: preserve native query/reset handlers and toggle the result list. */
(()=>{'use strict';
function init(){
 const panel=document.querySelector('#work #namo-work-inquiry'),actions=panel?.querySelector('.nwi-actions'),grid=panel?.querySelector('.nwi-grid');
 const shell=panel?.closest('.module-shell'),list=shell?.querySelector(':scope>.module-body'),pager=shell?.querySelector('.nwi-pagination');
 if(!actions||!grid||!list||!pager)return false;
 if(actions.querySelector('.nwi-filter-toggle'))return true;
 list.id='nwi-work-list';pager.id='nwi-work-list-pagination';
 const search=actions.querySelector('#nwi-search');if(search)search.title='조회';
 const button=document.createElement('button');button.type='button';button.className='btn nwi-filter-toggle';button.setAttribute('aria-controls',list.id+' '+pager.id);
 const update=()=>{const expanded=!shell.classList.contains('nwi-list-folded');button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'작업지시 현황 접기':'작업지시 현황 펼침');button.title=expanded?'접기':'펼침';};
 button.innerHTML='<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
 button.onclick=()=>{shell.classList.toggle('nwi-list-folded');update();};update();actions.append(button);
 search?.addEventListener('click',()=>{shell.classList.remove('nwi-list-folded');update();});
 const style=document.createElement('style');style.textContent=`
 #work #namo-work-inquiry #nwi-search{right:54px!important}
 #work #namo-work-inquiry #nwi-clear{right:92px!important}
 #work #namo-work-inquiry .nwi-filter-toggle{position:absolute!important;right:16px!important;top:calc(100% + 11px)!important;width:30px!important;min-width:30px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#fff!important;border:1px solid #c7d6e5!important;color:#40566d!important;z-index:2}
 #work #namo-work-inquiry .nwi-filter-toggle[aria-expanded="true"] svg{transform:rotate(180deg)}
 #work #namo-work-inquiry .nwi-filter-toggle:focus-visible{outline:2px solid #247bd1!important;outline-offset:2px!important}
 #work .module-shell.nwi-list-folded>#nwi-work-list,#work .module-shell.nwi-list-folded>#nwi-work-list-pagination{display:none!important}
 #work .module-shell>.nwi-list-head{padding-right:228px!important}
 @media(max-width:650px){#work #namo-work-inquiry .nwi-filter-toggle{top:calc(100% + 43px)!important}#work .module-shell>.nwi-list-head{padding-right:12px!important}}
 `;document.head.append(style);return true;
}
if(!init()){const observer=new MutationObserver(()=>{if(init())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});}
})();
