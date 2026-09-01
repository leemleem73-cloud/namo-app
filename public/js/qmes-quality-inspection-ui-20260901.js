/* NAMO QMES - quality inspection UI stability - 2026-09-01 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";
  const MENU_ID="qmes-quality-date-menu-20260901";
  let activeSelect=null;
  let activeMenu=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-iqc-record-filter .qmes-oqc-record-filter-field select,
      .qmes-pqc-record-filter .qmes-oqc-record-filter-field select,
      .qmes-oqc-record-filter .qmes-oqc-record-filter-field select{color-scheme:light!important;}
      #${MENU_ID}{position:fixed;z-index:2147483600;box-sizing:border-box;max-height:250px;overflow-y:auto;padding:3px;background:#fff;color:#111827;border:1px solid #cbd5e1;border-radius:7px;box-shadow:0 4px 12px rgba(15,23,42,.12);font-family:inherit;color-scheme:light;}
      #${MENU_ID} button{display:block;width:100%;height:32px;padding:0 9px;border:0;border-radius:4px;background:#fff;color:#111827;text-align:left;font:inherit;font-size:13px;white-space:nowrap;cursor:pointer;}
      #${MENU_ID} button:hover,#${MENU_ID} button:focus-visible{background:#f1f5f9;outline:0;}
      #${MENU_ID} button[aria-selected="true"]{background:#eaf3ff;color:#111827;font-weight:700;}
      .qmes-inspection-modal-head,.qmes-iqc-modal-head{flex:0 0 auto;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;}
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  function isQualityDateSelect(select){
    if(!(select instanceof HTMLSelectElement)) return false;
    const filter=select.closest(".qmes-iqc-record-filter,.qmes-pqc-record-filter,.qmes-oqc-record-filter");
    if(!filter) return false;
    const field=select.closest(".qmes-oqc-record-filter-field");
    const label=String(field?.querySelector("span")?.textContent||"").trim();
    return label==="연도"||label==="월";
  }

  function closeMenu(){
    activeMenu?.remove();
    activeMenu=null;
    activeSelect=null;
  }

  function positionMenu(){
    if(!activeMenu||!activeSelect||!document.contains(activeSelect)){ closeMenu(); return; }
    const r=activeSelect.getBoundingClientRect();
    const width=Math.max(80,Math.round(r.width));
    activeMenu.style.width=`${width}px`;
    activeMenu.style.left=`${Math.max(4,Math.min(r.left,global.innerWidth-width-4))}px`;
    const menuHeight=Math.min(activeMenu.scrollHeight,250);
    const below=global.innerHeight-r.bottom;
    activeMenu.style.top=below>=menuHeight+4?`${Math.round(r.bottom+2)}px`:`${Math.max(4,Math.round(r.top-menuHeight-2))}px`;
  }

  function setSelectValue(select,value){
    const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value")?.set;
    if(setter) setter.call(select,value); else select.value=value;
    select.dispatchEvent(new Event("input",{bubbles:true}));
    select.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function openMenu(select){
    if(activeSelect===select&&activeMenu){ closeMenu(); return; }
    closeMenu();
    activeSelect=select;
    const menu=document.createElement("div");
    menu.id=MENU_ID;
    menu.setAttribute("role","listbox");
    Array.from(select.options).forEach(option=>{
      const button=document.createElement("button");
      button.type="button";
      button.dataset.value=option.value;
      button.textContent=option.textContent||option.value;
      button.setAttribute("aria-selected",option.value===select.value?"true":"false");
      menu.appendChild(button);
    });
    document.body.appendChild(menu);
    activeMenu=menu;
    positionMenu();
    menu.querySelector('[aria-selected="true"]')?.scrollIntoView({block:"nearest"});
  }

  document.addEventListener("pointerdown",event=>{
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateSelect(select)&&!select.disabled){
      event.preventDefault();
      event.stopPropagation();
      openMenu(select);
      return;
    }
    if(activeMenu&&event.target instanceof Element&&activeMenu.contains(event.target)) return;
    if(activeMenu) closeMenu();
  },true);

  document.addEventListener("click",event=>{
    const button=event.target instanceof Element?event.target.closest(`#${MENU_ID} button[data-value]`):null;
    if(!button||!activeSelect) return;
    event.preventDefault();
    event.stopPropagation();
    const select=activeSelect;
    const value=button.dataset.value||"";
    closeMenu();
    setSelectValue(select,value);
    try{select.focus({preventScroll:true});}catch(_error){select.focus();}
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeMenu){event.preventDefault();closeMenu();}
  },true);

  /* Do not close on scroll/resize. Keep the white list attached to its select. */
  global.addEventListener("resize",()=>{if(activeMenu) positionMenu();});
  global.addEventListener("scroll",()=>{if(activeMenu) positionMenu();},true);

  ensureStyle();
})(window);
