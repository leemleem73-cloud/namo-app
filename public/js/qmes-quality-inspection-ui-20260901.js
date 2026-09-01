/* NAMO QMES - quality inspection UI stability - 2026-09-01
 * Quality inspection only.
 * - Year/month filters keep their original closed-control appearance.
 * - The Windows/Chromium native select popup is never opened, avoiding its
 *   one-frame dark flash. A compact QMES list is attached directly below the
 *   original field instead of appearing as a separate floating popup.
 * - Inspection/viewer headers remain visible while their body scrolls.
 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const MENU_ID="qmes-quality-filter-menu-20260901";
  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";
  const OPEN_CLASS="qmes-quality-date-select-open";
  let activeSelect=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${MENU_ID}{
        position:fixed!important;
        z-index:2147483600!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        max-height:244px!important;
        padding:3px!important;
        border:1px solid #cbd5e1!important;
        border-top-color:#d7dee8!important;
        border-radius:0 0 8px 8px!important;
        background:#fff!important;
        color:#111827!important;
        box-shadow:0 4px 10px rgba(15,23,42,.08)!important;
        box-sizing:border-box!important;
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif!important;
        color-scheme:light!important;
      }
      #${MENU_ID} button{
        display:flex!important;
        align-items:center!important;
        width:100%!important;
        min-width:0!important;
        height:32px!important;
        margin:0!important;
        padding:0 9px!important;
        border:0!important;
        border-radius:5px!important;
        background:#fff!important;
        background-image:none!important;
        color:#111827!important;
        -webkit-text-fill-color:#111827!important;
        box-shadow:none!important;
        text-shadow:none!important;
        text-align:left!important;
        font:inherit!important;
        font-size:13px!important;
        font-weight:500!important;
        line-height:32px!important;
        white-space:nowrap!important;
        cursor:pointer!important;
      }
      #${MENU_ID} button:hover,
      #${MENU_ID} button:focus-visible{
        background:#f3f6fa!important;
        color:#111827!important;
        -webkit-text-fill-color:#111827!important;
        outline:0!important;
      }
      #${MENU_ID} button[aria-selected="true"]{
        background:#eef5ff!important;
        color:#174ea6!important;
        -webkit-text-fill-color:#174ea6!important;
        font-weight:700!important;
      }
      html body #root select.${OPEN_CLASS}{
        border-color:#94a3b8!important;
        border-bottom-left-radius:0!important;
        border-bottom-right-radius:0!important;
        box-shadow:none!important;
        outline:none!important;
      }

      /* Header/body are separate flex regions. Keep the real header visible;
         only the form/document body is allowed to scroll. */
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
    activeSelect?.classList.remove(OPEN_CLASS);
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
    const width=Math.max(80,Math.round(r.width));
    menu.style.width=`${width}px`;
    const left=Math.min(Math.max(6,r.left),Math.max(6,global.innerWidth-width-6));
    menu.style.left=`${left}px`;
    menu.style.top=`${Math.round(r.bottom-1)}px`;

    const mr=menu.getBoundingClientRect();
    if(mr.bottom>global.innerHeight-6){
      menu.style.top=`${Math.max(6,Math.round(r.top-mr.height+1))}px`;
      menu.style.borderRadius="8px 8px 0 0";
      select.style.setProperty("border-top-left-radius","0","important");
      select.style.setProperty("border-top-right-radius","0","important");
      select.style.removeProperty("border-bottom-left-radius");
      select.style.removeProperty("border-bottom-right-radius");
    }
  }

  function restoreSelectRadius(select){
    if(!select) return;
    select.style.removeProperty("border-top-left-radius");
    select.style.removeProperty("border-top-right-radius");
    select.style.removeProperty("border-bottom-left-radius");
    select.style.removeProperty("border-bottom-right-radius");
  }

  function openMenu(select){
    if(!isQualityDateFilter(select)||select.disabled) return;
    if(activeSelect===select&&document.getElementById(MENU_ID)){
      closeMenu();
      restoreSelectRadius(select);
      return;
    }

    closeMenu();
    activeSelect=select;
    select.classList.add(OPEN_CLASS);

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

    const selected=menu.querySelector('[aria-selected="true"]');
    if(selected) selected.scrollIntoView({block:"nearest"});
  }

  function blockNativeSelectActivation(event){
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(!select||!isQualityDateFilter(select)) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  document.addEventListener("pointerdown",event=>{
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateFilter(select)){
      /* Capture before Chromium delegates the click to the Windows native picker. */
      blockNativeSelectActivation(event);
      openMenu(select);
      return;
    }
    const inside=event.target instanceof Element&&event.target.closest(`#${MENU_ID}`);
    if(!inside&&activeSelect){
      const previous=activeSelect;
      closeMenu();
      restoreSelectRadius(previous);
    }
  },true);

  document.addEventListener("mousedown",event=>{
    blockNativeSelectActivation(event);
  },true);

  document.addEventListener("click",event=>{
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateFilter(select)){
      blockNativeSelectActivation(event);
      return;
    }

    const button=event.target instanceof Element?event.target.closest(`#${MENU_ID} button[data-value]`):null;
    if(!button||!activeSelect) return;
    event.preventDefault();
    event.stopPropagation();

    const targetSelect=activeSelect;
    const value=button.dataset.value||"";
    closeMenu();
    restoreSelectRadius(targetSelect);
    setReactSelectValue(targetSelect,value);
    try{targetSelect.focus({preventScroll:true});}catch(_error){targetSelect.focus();}
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&activeSelect){
      event.preventDefault();
      const previous=activeSelect;
      closeMenu();
      restoreSelectRadius(previous);
      return;
    }

    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateFilter(select)&&(event.key==="Enter"||event.key===" "||event.key==="ArrowDown")){
      event.preventDefault();
      event.stopPropagation();
      openMenu(select);
      return;
    }

    const option=event.target instanceof Element?event.target.closest(`#${MENU_ID} button`):null;
    if(!option) return;
    const buttons=Array.from(document.querySelectorAll(`#${MENU_ID} button`));
    const index=buttons.indexOf(option);
    if(event.key==="ArrowDown"&&index< buttons.length-1){event.preventDefault();buttons[index+1]?.focus();}
    else if(event.key==="ArrowUp"&&index>0){event.preventDefault();buttons[index-1]?.focus();}
    else if(event.key==="Enter"||event.key===" "){event.preventDefault();option.click();}
  },true);

  global.addEventListener("resize",()=>{
    if(!activeSelect) return;
    const previous=activeSelect;
    closeMenu();
    restoreSelectRadius(previous);
  });
  global.addEventListener("scroll",()=>{
    if(!activeSelect) return;
    const previous=activeSelect;
    closeMenu();
    restoreSelectRadius(previous);
  },true);

  ensureStyle();
})(window);
