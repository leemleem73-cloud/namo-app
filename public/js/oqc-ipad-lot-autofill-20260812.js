/* QMES OQC iPad LOT autofill - 2026-08-12
 * When a production LOT is entered in the OQC iPad screen, reuse all known
 * OQC/shipment/work-order LOT data so basic shipment fields are not omitted.
 */
(function installOqcIpadLotAutofill(global){
  "use strict";
  if(global.__QMES_OQC_IPAD_LOT_AUTOFILL_20260812__) return;
  global.__QMES_OQC_IPAD_LOT_AUTOFILL_20260812__=true;

  const text=(v)=>String(v??"").trim();
  const upper=(v)=>text(v).toUpperCase();
  const numberText=(v)=>{
    if(v==null||v==="") return "";
    const m=text(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);
    return m?m[0]:"";
  };

  function nativeSet(input,value){
    if(!input || value==null || text(value)==="") return false;
    const next=String(value);
    if(text(input.value)) return false;
    const proto=input.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
    try{setter?setter.call(input,next):(input.value=next);}catch(_error){input.value=next;}
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    return true;
  }

  function forceSet(input,value){
    if(!input || value==null || text(value)==="") return false;
    const next=String(value);
    if(input.value===next) return false;
    const proto=input.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
    try{setter?setter.call(input,next):(input.value=next);}catch(_error){input.value=next;}
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    return true;
  }

  function fieldByLabel(root,labelText){
    const labels=Array.from(root.querySelectorAll("label"));
    const label=labels.find((node)=>text(node.querySelector("span")?.textContent).replace(/\*/g,"").trim()===labelText);
    return label?.querySelector("input,textarea,select")||null;
  }

  function latestOqcRow(lotNo){
    const rows=Array.isArray(global.DB?.insp?.OQC)?global.DB.insp.OQC:[];
    return rows
      .filter((row)=>upper(row?.lot)===upper(lotNo))
      .sort((a,b)=>`${text(b?.date)} ${text(b?.time)} ${text(b?.shipDate)}`.localeCompare(`${text(a?.date)} ${text(a?.time)} ${text(a?.shipDate)}`))[0]||null;
  }

  function lotData(lotNo){
    const key=text(lotNo);
    const lot=global.DB?.lots?.[key]||global.DB?.lots?.[upper(key)]||null;
    const batch=(global.DB?.batches||[]).find((row)=>[row?.no,row?.lot,row?.lotNo,row?.workOrder].some((v)=>upper(v)===upper(key)))||null;
    const oqc=latestOqcRow(key);
    const shipment=lot?.ship||batch?.ship||{};
    return {
      product:text(oqc?.product||batch?.itemName||batch?.item||lot?.itemName||lot?.item||lot?.product),
      customer:text(shipment?.customer||oqc?.customer),
      shipQty:numberText(shipment?.shipQty??shipment?.qty??oqc?.shipQty??lot?.qty??batch?.qty),
      shipDate:text(shipment?.shipDate||shipment?.date||oqc?.shipDate),
      destination:text(shipment?.destination||oqc?.destination),
      remarks:text(oqc?.remarks),
      hasOqc:Boolean(oqc)
    };
  }

  function isOqcScreen(root){
    return /OQC\s*출하검사/i.test(text(root.querySelector(".qmes-ipad-work-head")?.textContent));
  }

  function apply(root,lotNo){
    if(!root || !isOqcScreen(root) || !text(lotNo)) return;
    const data=lotData(lotNo);
    nativeSet(fieldByLabel(root,"제품명"),data.product);
    nativeSet(fieldByLabel(root,"고객사"),data.customer);
    nativeSet(fieldByLabel(root,"출하수량 (kg)"),data.shipQty);
    if(data.shipDate) forceSet(fieldByLabel(root,"출하일자"),data.shipDate);
    nativeSet(fieldByLabel(root,"납품처"),data.destination);
    nativeSet(fieldByLabel(root,"비고"),data.remarks);

    const lotInput=fieldByLabel(root,"생산 LOT");
    if(lotInput){
      lotInput.dataset.oqcAutofill=data.hasOqc?"registered":"lot-linked";
      lotInput.title=data.hasOqc?"기존 출하검사 LOT 정보가 자동 반영되었습니다.":"생산 LOT 정보가 자동 반영되었습니다.";
    }
  }

  let timer=0;
  function schedule(input){
    global.clearTimeout(timer);
    timer=global.setTimeout(()=>{
      const root=input?.closest?.(".qmes-ipad-pop")||document.querySelector(".qmes-ipad-pop");
      if(!root||!isOqcScreen(root)) return;
      apply(root,input?.value||fieldByLabel(root,"생산 LOT")?.value||"");
    },80);
  }

  document.addEventListener("input",(event)=>{
    const target=event.target;
    if(!(target instanceof HTMLInputElement)) return;
    const label=target.closest("label");
    if(text(label?.querySelector("span")?.textContent).replace(/\*/g,"").trim()==="생산 LOT") schedule(target);
  },true);
  document.addEventListener("change",(event)=>{
    const target=event.target;
    if(!(target instanceof HTMLInputElement)) return;
    const label=target.closest("label");
    if(text(label?.querySelector("span")?.textContent).replace(/\*/g,"").trim()==="생산 LOT") schedule(target);
  },true);

  const observer=new MutationObserver(()=>{
    const root=document.querySelector(".qmes-ipad-pop");
    if(!root||!isOqcScreen(root)) return;
    const input=fieldByLabel(root,"생산 LOT");
    if(input&&text(input.value)) schedule(input);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})(window);
