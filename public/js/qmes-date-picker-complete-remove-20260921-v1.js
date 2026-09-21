/* QMES DATE PICKER COMPLETE REMOVE - 2026-09-21
 * CURRENT UI ONLY.
 * Removes ALL calendar popup behavior while keeping date text fields and values.
 */
(function(){
  "use strict";
  if(window.__QMES_DATE_PICKER_COMPLETE_REMOVE_20260921_V1__) return;
  window.__QMES_DATE_PICKER_COMPLETE_REMOVE_20260921_V1__=true;

  const STYLE_ID="qmes-date-picker-complete-remove-20260921-v1-style";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Remove any custom/legacy calendar popup if it exists. */
      [id*="date-picker"],
      [id*="datepicker"],
      [id*="calendar"][role="dialog"],
      .qmes-date-picker,
      .qmes-calendar,
      .qcdp-calendar,
      #qmes-current-date-picker-20260921-v3,
      [id^="qmes-date-picker-stable-pop"]{
        display:none!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }

      /* Date fields remain normal text inputs; no calendar icon. */
      input[data-qmes-no-calendar="1"]{
        appearance:none!important;
        -webkit-appearance:none!important;
        background-image:none!important;
        cursor:text!important;
        padding-right:10px!important;
      }

      input[data-qmes-no-calendar="1"]::-webkit-calendar-picker-indicator{
        display:none!important;
        opacity:0!important;
        pointer-events:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  function patchInput(input){
    if(!(input instanceof HTMLInputElement)) return;
    const isDate=input.type==="date" || input.name==="due" || input.dataset.qmesCurrentDate==="1";
    if(!isDate) return;

    const value=input.value;
    input.dataset.qmesNoCalendar="1";
    delete input.dataset.qmesCurrentDate;

    try{
      input.type="text";
    }catch(_){
      input.setAttribute("type","text");
    }

    if(value && !input.value) input.value=value;
    input.setAttribute("autocomplete","off");
    input.setAttribute("inputmode","numeric");
    input.placeholder="YYYY-MM-DD";

    try{ input.showPicker=undefined; }catch(_){}
  }

  function removePopups(){
    document.querySelectorAll(
      '#qmes-current-date-picker-20260921-v3,[id^="qmes-date-picker-stable-pop"],.qmes-date-picker,.qmes-calendar,[id*="datepicker"]'
    ).forEach(el=>el.remove());
  }

  function scan(root=document){
    if(root instanceof HTMLInputElement) patchInput(root);
    root.querySelectorAll?.('input[type="date"],input[name="due"],input[data-qmes-current-date="1"]').forEach(patchInput);
    removePopups();
  }

  ensureStyle();
  scan();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==="attributes" && record.target instanceof HTMLInputElement){
        patchInput(record.target);
      }
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1) continue;
        scan(node);
      }
    }
    removePopups();
  });

  observer.observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:["type","class","data-qmes-current-date"]
  });

  // Block any remaining browser/custom calendar open gestures on date fields.
  window.addEventListener("pointerdown",event=>{
    const target=event.target;
    if(!(target instanceof HTMLInputElement)) return;
    if(target.dataset.qmesNoCalendar!=="1") return;
    patchInput(target);
  },true);

  window.addEventListener("focusin",event=>{
    const target=event.target;
    if(target instanceof HTMLInputElement) patchInput(target);
  },true);

  [0,100,300,700,1500,3000].forEach(ms=>setTimeout(()=>scan(),ms));

  // Remove public picker handles so no other current script can open a calendar.
  try{window.qmesCurrentDatePicker=undefined;}catch(_){}
  try{window.qmesDatePickerStable=undefined;}catch(_){}
})();