/* Work inquiry only: preserve native query/reset handlers and toggle filter visibility. */
(()=>{'use strict';
function init(){
 const panel=document.querySelector('#work #namo-work-inquiry'),actions=panel?.querySelector('.nwi-actions'),grid=panel?.querySelector('.nwi-grid');
 if(!actions||!grid)return false;
 if(actions.querySelector('.nwi-filter-toggle'))return true;
 grid.id='nwi-filter-fields';
 const search=actions.querySelector('#nwi-search');if(search)search.title='조회';
 const button=document.createElement('button');button.type='button';button.className='btn nwi-filter-toggle';button.setAttribute('aria-controls',grid.id);
 const update=()=>{const expanded=!panel.classList.contains('nwi-filters-folded');button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'검색조건 접기':'검색조건 펼침');button.title=expanded?'접기':'펼침';};
 button.innerHTML='<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
 button.onclick=()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));panel.classList.toggle('nwi-filters-folded');update();};update();actions.append(button);
 const style=document.createElement('style');style.textContent=`
 #work #namo-work-inquiry #nwi-search{right:54px!important}
 #work #namo-work-inquiry #nwi-clear{right:92px!important}
 #work #namo-work-inquiry .nwi-filter-toggle{position:absolute!important;right:16px!important;top:calc(100% + 11px)!important;width:30px!important;min-width:30px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#fff!important;border:1px solid #c7d6e5!important;color:#40566d!important;z-index:2}
 #work #namo-work-inquiry .nwi-filter-toggle[aria-expanded="true"] svg{transform:rotate(180deg)}
 #work #namo-work-inquiry .nwi-filter-toggle:focus-visible{outline:2px solid #247bd1!important;outline-offset:2px!important}
 #work #namo-work-inquiry.nwi-filters-folded .nwi-grid{display:none!important}
 #work #namo-work-inquiry.nwi-filters-folded{padding:0 16px!important;min-height:0!important;gap:0!important;border-bottom:0!important}
 #work #namo-work-inquiry.nwi-filters-folded:has(.wo-bulk-controls:not([hidden])){padding:10px 16px!important}
 #work .module-shell>.nwi-list-head{padding-right:228px!important}
 @media(max-width:650px){#work #namo-work-inquiry .nwi-filter-toggle{top:calc(100% + 43px)!important}#work .module-shell>.nwi-list-head{padding-right:12px!important}}
 `;document.head.append(style);return true;
}
if(!init()){const observer=new MutationObserver(()=>{if(init())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});}
})();
