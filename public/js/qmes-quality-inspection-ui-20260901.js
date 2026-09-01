/* NAMO QMES - quality inspection UI stability - 2026-09-01
 * Root fixes for quality inspection only:
 * 1) Year/month filters keep the existing closed select appearance, but do not
 *    open the Windows/Chromium native picker that causes a one-frame black flash.
 * 2) Inspection/viewer headers are non-shrinking/sticky so title and actions
 *    remain in the visible header instead of being lost inside the scroll area.
 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const MENU_ID="qmes-quality-filter-menu-20260901";
  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";
  let activeSelect=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${MENU_ID}{
        position:fixed;z-index:2147483600;min-width:112px;max-height:280px;
        overflow:auto;padding:5px;border:1px solid #cbd5e1;border-radius:8px;
        background:#fff;color:#111827;box-shadow:0 10px 26px rgba(15,23,42,.14);
        box-sizing:border-box;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif;
        color-scheme:light;
      }
      #${MENU_ID} button{
        display:block;width:100%;height:34px;padding:0 10px;border:0;border-radius:6px;
        background:#fff;color:#111827;text-align:left;font:inherit;font-size:13px;
        white-space:nowrap;cursor:pointer;
      }
      #${MENU_ID} button:hover,#${MENU_ID} button:focus-visible{background:#eef4ff;color:#174ea6;outline:0;}
      #${MENU_ID} button[aria-selected="true"]{background:#eaf3ff;color:#174ea6;font-weight:700;}

      /* The header and body are separate flex regions. The previous modal CSS
         allowed the header to shrink with a tall form, and viewer headers lived
         inside the scroll container. Keep the header as the fixed chrome. */
      .qmes-inspection-modal-head,.qmes-iqc-modal-head{flex:0 0 auto;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;}
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  function fieldLabel(select){
    const field=select?.closest?.(".qmes-oqc-record-filter-field");
    return String(field?.querySelector("span")?.textContent||"").replace(/\s+/g," ").trim();
  }

  function isQualityDateFilter(select){
    if(!(select instanceof HTMLSelectElement)) return false;
    const filter=select.closest(".qmes-iqc-record-filter,.qmes-pqc-record-filter,.qmes-oqc-record-filter");
    if(!filter) return false;
    const label=fieldLabel(select);
    return label==="연도"||label==="월";
  }

  function closeMenu(){
    document.getElementById(MENU_ID)?.remove();
    activeSelect=null;
  }

  function setReactSelectValue(select,value){
    const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value")?.set;
    try{setter?setter.call(select,value):(select.value=value);}catch(_error){select.value=value;}
    select.dispatchEvent(new Event("input",{bubbles:true}));
    select.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function positionMenu(menu,select){
    const r=select.getBoundingClientRect();
    const width=Math.max(112,Math.round(r.width));
    menu.style.width=`${width}px`;
    let left=Math.min(Math.max(8,r.left),Math.max(8,global.innerWidth-width-8));
    menu.style.left=`${left}px`;
    menu.style.top=`${Math.min(r.bottom+4,global.innerHeight-8)}px`;
    const mr=menu.getBoundingClientRect();
    if(mr.bottom>global.innerHeight-8){
      menu.style.top=`${Math.max(8,r.top-mr.height-4)}px`;
    }
  }

  function openMenu(select){
    if(!isQualityDateFilter(select)||select.disabled) return;
    closeMenu();
    activeSelect=select;
    const menu=document.createElement("div");
    menu.id=MENU_ID;
    menu.setAttribute("role","listbox");
    menu.setAttribute("aria-label",`${fieldLabel(select)} 선택`);
    Array.from(select.options).forEach((option,index)=>{
      const button=document.createElement("button");
      button.type="button";
      button.setAttribute("role","option");
      button.dataset.value=option.value;
      button.dataset.index=String(index);
      button.setAttribute("aria-selected",option.value===select.value?"true":"false");
      button.textContent=option.textContent||option.value;
      menu.appendChild(button);
    });
    document.body.appendChild(menu);
    positionMenu(menu,select);
    const selected=menu.querySelector('[aria-selected="true"]')||menu.querySelector("button");
    selected?.focus({preventScroll:true});
  }

  document.addEventListener("pointerdown",event=>{
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateFilter(select)){
      /* Capture before Chromium hands the click to the OS native picker. */
      event.preventDefault();
      event.stopPropagation();
      openMenu(select);
      return;
    }
    const inside=event.target instanceof Element&&event.target.closest(`#${MENU_ID}`);
    if(!inside&&activeSelect) closeMenu();
  },true);

  document.addEventListener("click",event=>{
    const button=event.target instanceof Element?event.target.closest(`#${MENU_ID} button[data-value]`):null;
    if(!button||!activeSelect) return;
    event.preventDefault();
    event.stopPropagation();
    const select=activeSelect;
    const value=button.dataset.value||"";
    closeMenu();
    setReactSelectValue(select,value);
    try{select.focus({preventScroll:true});}catch(_error){select.focus();}
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeSelect){event.preventDefault();closeMenu();return;}
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateFilter(select)&&(event.key==="Enter"||event.key===" "||event.key==="ArrowDown")){
      event.preventDefault();openMenu(select);
    }
  },true);

  global.addEventListener("resize",closeMenu);
  global.addEventListener("scroll",()=>{if(activeSelect)closeMenu();},true);
  ensureStyle();
})(window);
