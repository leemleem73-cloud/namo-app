/* Remove legacy inventory menu and visible inventory screen. Preserve inventory records/APIs. */
(()=>{'use strict';
  const css=document.createElement('style');
  css.textContent='.menu[data-page="inventory"],#inventory{display:none!important}';
  document.head.appendChild(css);
  function removeInventoryUi(){
    document.querySelectorAll('.menu[data-page="inventory"]').forEach(el=>el.remove());
    const panel=document.getElementById('inventory');
    if(panel){panel.replaceChildren();panel.style.display='none';panel.setAttribute('aria-hidden','true');}
    if(document.querySelector('.menu[data-page="work"]')){
      const active=document.querySelector('.menu[data-page="inventory"].active');
      if(active)document.querySelector('.menu[data-page="work"]').click();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeInventoryUi,{once:true});
  else removeInventoryUi();
})();
