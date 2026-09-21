/* QMES Sales current edit interaction stable V4 - 2026-09-21
 * CURRENT UI ONLY.
 * 1) Current Sales ledger Edit opens on the first pointer/click.
 * 2) Current Sales edit Requested Due Date always opens the current common calendar.
 * 3) Does not load or restore retired sidebar/calendar implementations.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_CURRENT_STABLE_20260921_V4__) return;
  window.__QMES_SALES_EDIT_CURRENT_STABLE_20260921_V4__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const MODAL_ID="qmes-sales-edit-force-v2";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v;}catch(_){return f;}};

  function visibleId(row,map){
    const key=clean(row&&row.workOrder)||clean(row&&row.id);
    const m=map&&typeof map==="object"&&!Array.isArray(map)
      ? (map[key]||map[clean(row&&row.id)]||row&&row.orderMeta||{})
      : (row&&row.orderMeta||{});
    return clean(m&&m.salesOrderIdOverride)||clean(row&&row.id);
  }

  function rowFromButton(button){
    const tr=button&&button.closest("tr");
    if(!tr) return null;

    const links=[...tr.querySelectorAll(".qrl-link")];
    const id=clean(links[1]?.textContent||links[0]?.textContent);
    if(!id) return null;

    const list=read(SALES_KEY,[]);
    const map=read(META_KEY,{});
    return (Array.isArray(list)?list:[]).find(row=>
      clean(row&&row.id)===id ||
      clean(row&&row.workOrder)===id ||
      visibleId(row,map)===id
    )||null;
  }

  function isCurrentEditButton(target){
    if(!(target instanceof Element)) return null;
    const button=target.closest(".qmes-sales-ledger-v4 .qrl-actions button");
    return button&&clean(button.textContent)==="수정"?button:null;
  }

  function openViaCurrentOwner(row){
    if(!row) return false;

    // Current owner API first.
    if(window.qmesSalesEditDirectV18&&typeof window.qmesSalesEditDirectV18.open==="function"){
      window.qmesSalesEditDirectV18.open(row);
      return true;
    }

    // If bridge has not initialized yet, wait briefly in the SAME first user action flow.
    let tries=0;
    const retry=()=>{
      if(document.getElementById(MODAL_ID)) return;
      if(window.qmesSalesEditDirectV18&&typeof window.qmesSalesEditDirectV18.open==="function"){
        window.qmesSalesEditDirectV18.open(row);
        return;
      }
      if(++tries<30) setTimeout(retry,50);
    };
    retry();
    return true;
  }

  function handleEdit(event){
    const button=isCurrentEditButton(event.target);
    if(!button) return;

    const row=rowFromButton(button);
    if(!row) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if(document.getElementById(MODAL_ID)) return;
    openViaCurrentOwner(row);
  }

  // pointerdown fixes the "2~3 clicks" symptom before React/other handlers compete.
  window.addEventListener("pointerdown",handleEdit,true);
  window.addEventListener("click",handleEdit,true);

  function patchDue(){
    const modal=document.getElementById(MODAL_ID);
    const input=modal&&modal.querySelector('input[name="due"]');
    if(!input) return;

    const picker=window.qmesCurrentDatePicker;
    if(picker&&typeof picker.patch==="function"){
      picker.patch(input);
    }
  }

  // Due field: explicitly open the CURRENT common picker.
  window.addEventListener("pointerdown",event=>{
    const target=event.target;
    if(!(target instanceof HTMLInputElement)) return;
    if(!target.matches('#'+MODAL_ID+' input[name="due"]')) return;

    const picker=window.qmesCurrentDatePicker;
    if(!picker||typeof picker.open!=="function") return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    picker.patch?.(target);
    picker.open(target);
  },true);

  window.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof HTMLInputElement)) return;
    if(!target.matches('#'+MODAL_ID+' input[name="due"]')) return;

    const picker=window.qmesCurrentDatePicker;
    if(!picker||typeof picker.open!=="function") return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    picker.patch?.(target);
    picker.open(target);
  },true);

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes||[]){
        if(node.nodeType!==1) continue;
        if(node.id===MODAL_ID||node.querySelector?.("#"+MODAL_ID)){
          queueMicrotask(patchDue);
          setTimeout(patchDue,0);
          setTimeout(patchDue,60);
        }
      }
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  patchDue();
})();