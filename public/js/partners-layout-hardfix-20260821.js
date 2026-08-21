(function(){
  'use strict';
  if(window.__QMES_PARTNERS_LAYOUT_HARDFIX_20260821__) return;
  window.__QMES_PARTNERS_LAYOUT_HARDFIX_20260821__=true;

  const style=document.createElement('style');
  style.id='qmes-partners-layout-hardfix-20260821';
  style.textContent=`
    html body #qmes-sync-sidebar{
      border-right:0!important;
      border-inline-end:0!important;
      box-shadow:none!important;
      outline:0!important;
      background-image:none!important;
    }
    html body #qmes-sync-sidebar::before,
    html body #qmes-sync-sidebar::after{
      content:none!important;
      display:none!important;
      border:0!important;
      box-shadow:none!important;
    }
    html body .qmes-partners-page{
      display:block!important;
      justify-content:initial!important;
      align-content:initial!important;
      gap:0!important;
      row-gap:0!important;
      column-gap:0!important;
    }
    html body .qmes-partners-page>.qmes-partners-title,
    html body .qmes-partners-page>.qmes-partners-toolbar,
    html body .qmes-partners-page>.qmes-partners-list-card{
      position:static!important;
      inset:auto!important;
      transform:none!important;
      float:none!important;
    }
    html body .qmes-partners-page>.qmes-partners-title{margin:0!important;padding:6px 10px 8px!important}
    html body .qmes-partners-page>.qmes-partners-toolbar{margin:0!important;padding:0 10px 6px!important}
    html body .qmes-partners-page>.qmes-partners-list-card{margin:8px 0 0!important;min-height:0!important;height:auto!important}
    html body .qmes-partners-list-head{margin:0!important;padding:8px 10px!important}
    html body .qmes-partners-table-wrap{margin-top:4px!important}
  `;
  document.head.appendChild(style);

  function enforce(){
    const side=document.getElementById('qmes-sync-sidebar');
    if(side){
      side.style.setProperty('border-right','0','important');
      side.style.setProperty('border-inline-end','0','important');
      side.style.setProperty('box-shadow','none','important');
      side.style.setProperty('outline','0','important');
    }
    const page=document.querySelector('.qmes-partners-page');
    if(page){
      page.style.setProperty('display','block','important');
      page.style.setProperty('gap','0','important');
      page.style.setProperty('row-gap','0','important');
      const card=page.querySelector('.qmes-partners-list-card');
      if(card){
        card.style.setProperty('position','static','important');
        card.style.setProperty('margin-top','8px','important');
        card.style.setProperty('height','auto','important');
        card.style.setProperty('min-height','0','important');
        card.style.setProperty('transform','none','important');
      }
    }
  }

  enforce();
  new MutationObserver(enforce).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  window.addEventListener('load',enforce);
  window.addEventListener('resize',enforce);
  setTimeout(enforce,100);
  setTimeout(enforce,500);
})();