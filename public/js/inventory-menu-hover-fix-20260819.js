/* QMES inventory hover submenu fix - keeps inventory bridge intact. */
(function(){
  'use strict';
  if(window.__QMES_INVENTORY_HOVER_FIX_20260819__) return;
  window.__QMES_INVENTORY_HOVER_FIX_20260819__=true;

  const sections=[
    ['overview','재고현황'],
    ['movement','입출고 관리'],
    ['lot','LOT별 재고'],
    ['production','생산투입/완료'],
    ['count','재고실사'],
    ['history','재고이력']
  ];
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  let menu=null,hideTimer=null,currentButton=null;

  function ensureMenu(){
    if(menu&&document.body.contains(menu)) return menu;
    menu=document.createElement('div');
    menu.id='qmes-inventory-hover-menu';
    menu.setAttribute('role','menu');
    menu.style.cssText='position:fixed;z-index:13050;min-width:210px;padding:7px;border:1px solid rgba(71,85,105,.95);border-radius:10px;background:#132238;box-shadow:0 14px 35px rgba(0,0,0,.45);opacity:0;visibility:hidden;transform:translateY(-5px);transition:opacity .12s ease,transform .12s ease,visibility .12s;';
    const title=document.createElement('div');
    title.textContent='재고관리';
    title.style.cssText='padding:8px 11px 7px;color:#7dd3fc;font-size:12px;font-weight:900;border-bottom:1px solid rgba(71,85,105,.7);margin-bottom:4px;';
    menu.appendChild(title);
    sections.forEach(([id,label])=>{
      const b=document.createElement('button');
      b.type='button';b.textContent=label;b.dataset.inventorySection=id;
      b.style.cssText='display:flex;align-items:center;width:100%;min-height:39px;padding:9px 11px;border:0;border-radius:7px;background:transparent;color:#e2e8f0;font:inherit;font-size:13px;font-weight:750;text-align:left;cursor:pointer;';
      b.addEventListener('mouseenter',()=>{b.style.background='#243a57';b.style.color='#fff';});
      b.addEventListener('mouseleave',()=>{b.style.background='transparent';b.style.color='#e2e8f0';});
      b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();hide();if(typeof window.qmesOpenInventorySection==='function')window.qmesOpenInventorySection(id);});
      menu.appendChild(b);
    });
    menu.addEventListener('mouseenter',cancelHide);
    menu.addEventListener('mouseleave',scheduleHide);
    document.body.appendChild(menu);
    return menu;
  }

  function inventoryButton(){
    return Array.from(document.querySelectorAll('.qmes-top-menu-button')).find(b=>clean(b.textContent).startsWith('재고관리'))||null;
  }
  function cancelHide(){if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}}
  function scheduleHide(){cancelHide();hideTimer=setTimeout(hide,180);}
  function show(button){
    cancelHide();const m=ensureMenu();currentButton=button;
    const r=button.getBoundingClientRect();
    m.style.left=Math.max(8,Math.round(r.left))+'px';
    m.style.top=Math.round(r.bottom+4)+'px';
    m.style.opacity='1';m.style.visibility='visible';m.style.transform='translateY(0)';
    button.setAttribute('aria-expanded','true');
  }
  function hide(){
    cancelHide();if(menu){menu.style.opacity='0';menu.style.visibility='hidden';menu.style.transform='translateY(-5px)';}
    if(currentButton)currentButton.setAttribute('aria-expanded','false');currentButton=null;
  }
  function bind(){
    const b=inventoryButton();if(!b||b.dataset.inventoryHoverBound==='1')return false;
    b.dataset.inventoryHoverBound='1';b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');
    b.addEventListener('mouseenter',()=>show(b));
    b.addEventListener('mouseleave',scheduleHide);
    b.addEventListener('focus',()=>show(b));
    b.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();show(b);setTimeout(()=>menu?.querySelector('button')?.focus(),0);}if(event.key==='Escape')hide();});
    return true;
  }
  document.addEventListener('click',event=>{if(menu&&!menu.contains(event.target)&&!event.target.closest('[data-qmes-inventory-menu]'))hide();},true);
  window.addEventListener('resize',hide);
  const timer=setInterval(bind,200);setTimeout(()=>clearInterval(timer),20000);
})();
