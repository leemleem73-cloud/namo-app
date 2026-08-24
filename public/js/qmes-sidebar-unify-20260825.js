/* Unify legacy hamburger sidebar with new business extension menus. */
(function(){
  'use strict';
  if(window.__QMES_SIDEBAR_UNIFY_20260825__) return;
  window.__QMES_SIDEBAR_UNIFY_20260825__=true;

  const businessMenus=[
    ['sales','수주 · 납기관리'],
    ['plan','생산계획 · MRP'],
    ['purchase','구매 · 발주관리'],
    ['recipe','Recipe / BOM'],
    ['shipping','출하 · 납품관리']
  ];

  const style=document.createElement('style');
  style.id='qmes-sidebar-unify-style';
  style.textContent=`
    #qps-sidebar,#qmes-preview-sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;}
    body:not(.qmes-side-open) #root>div>main{margin-left:0!important;width:100%!important;}
    #qmes-sync-sidebar{border-right:1px solid #d7dee8!important;}
    #qmes-sync-sidebar .qmes-business-section{margin:12px -10px 0!important;padding:10px 10px 0!important;border-top:1px solid #e4e8ee!important;}
    #qmes-sync-sidebar .qmes-business-title{padding:0 10px 7px!important;color:#94a3b8!important;font-size:10px!important;font-weight:900!important;letter-spacing:.7px!important;}
    #qmes-sync-sidebar .qmes-business-item{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:40px!important;padding:9px 10px 9px 14px!important;margin:2px 0!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#475569!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;}
    #qmes-sync-sidebar .qmes-business-item:hover{background:#f4f7fa!important;color:#172033!important;}
    #qmes-sync-sidebar .qmes-business-item.is-active{background:#edf4ff!important;color:#175cd3!important;}
    #qmes-sync-sidebar .qmes-business-item.is-active:before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;background:#2563eb;}
  `;
  document.head.appendChild(style);

  function removeDuplicateSidebar(){
    document.querySelectorAll('#qps-sidebar,#qmes-preview-sidebar').forEach(el=>el.remove());
  }

  function currentBusinessTab(){
    try{return sessionStorage.getItem('qmes_business_extension_tab')||'';}catch(e){return'';}
  }

  function clickBusiness(id){
    const button=document.querySelector(`[data-qbe-menu="${id}"] .qmes-top-menu-button`);
    if(button) button.click();
  }

  function ensureBusinessSection(){
    const side=document.getElementById('qmes-sync-sidebar');
    if(!side) return;
    let section=side.querySelector('.qmes-business-section');
    if(!section){
      section=document.createElement('div');
      section.className='qmes-business-section';
      const title=document.createElement('div');
      title.className='qmes-business-title';
      title.textContent='업무 관리';
      section.appendChild(title);
      businessMenus.forEach(([id,label])=>{
        const button=document.createElement('button');
        button.type='button';
        button.className='qmes-business-item';
        button.dataset.qmesBusiness=id;
        button.textContent=label;
        button.addEventListener('click',()=>clickBusiness(id));
        section.appendChild(button);
      });
      side.appendChild(section);
    }
    const active=currentBusinessTab();
    section.querySelectorAll('.qmes-business-item').forEach(button=>button.classList.toggle('is-active',button.dataset.qmesBusiness===active));
  }

  function normalizeLayout(){
    removeDuplicateSidebar();
    const main=document.querySelector('#root>div>main');
    if(main&&!document.body.classList.contains('qmes-side-open')){
      main.style.setProperty('margin-left','0','important');
      main.style.setProperty('width','100%','important');
    }
    ensureBusinessSection();
  }

  const observer=new MutationObserver(normalizeLayout);
  function start(){
    normalizeLayout();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('click',()=>setTimeout(normalizeLayout,40),true);
    setInterval(normalizeLayout,700);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
