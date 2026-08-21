/* QMES inventory auto-link v8 - guard invalid stock writes and use transaction metadata as source of truth, 2026-08-21 */
(function(){
  'use strict';
  if(window.__QMES_INV_AUTO_LINK_ALL_V8__)return;
  window.__QMES_INV_AUTO_LINK_ALL_V8__=true;

  const map=window.qmesInventoryPhysicalLocations;
  if(!map)return;
  const text=v=>String(v??'').trim();
  const upper=v=>text(v).toUpperCase();
  const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0;};
  const db=()=>{try{return(typeof DB!=='undefined'&&DB)||window.DB||{};}catch(_e){return window.DB||{};}};
  const refOf=tx=>upper(tx?.reference_no||tx?.referenceNo);
  const inv=(path,options={})=>window.invApi(path,options);

  function iqcRows(){const d=db();return [d.iqc,d.insp?.IQC,d.iqcRecords,d.inspections?.IQC].find(Array.isArray)||[];}
  function workOrders(){
    const d=db(),out=new Map();
    (Array.isArray(d.batches)?d.batches:[]).forEach(r=>{const lot=upper(r?.no||r?.lot||r?.lotNo);if(lot)out.set(lot,{...r,lot});});
    Object.entries(d.woDocs||{}).forEach(([k,r])=>{const lot=upper(k||r?.lot||r?.lotNo||r?.no);if(lot)out.set(lot,{...(out.get(lot)||{}),...r,lot});});
    return [...out.values()];
  }
  function stockQty(rows,lot,location){
    return rows.filter(r=>upper(r?.lot_no||r?.lotNo)===upper(lot)&&upper(r?.location_code||r?.locationCode)===upper(location)&&upper(r?.quality_status||r?.qualityStatus)==='AVAILABLE')
      .reduce((sum,r)=>sum+num(r?.available_qty??r?.quantity),0);
  }
  function packagingOf(row){
    const type=text(row?.packagingType||row?.packaging_type||row?.packageType||row?.package_type||row?.packType||row?.packingType||row?.containerType);
    const other=text(row?.packagingTypeOther||row?.packaging_type_other||row?.packageTypeOther);
    const packageQty=Math.max(1,Math.trunc(num(row?.packageQty??row?.package_qty)||1));
    const unitWeight=num(row?.unitWeight??row?.unit_weight)||null;
    const calculatedWeight=num(row?.calculatedWeight??row?.calculated_weight)||(unitWeight?packageQty*unitWeight:null);
    const barcodeQty=Math.max(1,Math.trunc(num(row?.barcodeQty??row?.barcode_qty)||packageQty));
    return {packagingType:type,packagingTypeOther:other,packageQty,unitWeight,calculatedWeight,barcodeQty};
  }
  async function safePost(form){return inv('/transactions',{method:'POST',body:JSON.stringify(form)});}
  async function safePatch(id,form){return inv(`/transactions/${encodeURIComponent(id)}/packaging`,{method:'PATCH',body:JSON.stringify(form)});}

  let running=false,lastRun=0;
  async function sync(){
    if(running||Date.now()-lastRun<5000||typeof window.invApi!=='function')return;
    running=true;
    try{
      const [txsRaw,stockRaw]=await Promise.all([inv('/transactions?limit=1000').catch(()=>[]),inv('/stock').catch(()=>[])]);
      const txs=Array.isArray(txsRaw)?txsRaw:[],stock=Array.isArray(stockRaw)?stockRaw:[];
      const refs=new Set(txs.map(refOf).filter(Boolean));
      const txByRef=new Map(txs.map(t=>[refOf(t),t]).filter(x=>x[0]));

      for(const row of iqcRows()){
        if(text(row?.judge)!=='합격')continue;
        const lot=upper(row?.lot||row?.lotNo),qty=num(row?.qty||row?.incomingQty||row?.incoming_qty),itemName=text(row?.name||row?.material||row?.item);
        if(!lot||qty<=0)continue;
        const ref=`IQC:${upper(row?.inNo||row?.in_no||lot)}`;
        const pack=packagingOf(row),existing=txByRef.get(ref);
        if(existing){
          if(pack.packagingType&&(!text(existing.packaging_type)||Number(existing.package_qty||0)!==pack.packageQty)){
            try{Object.assign(existing,await safePatch(existing.id,pack)||{});}catch(_e){}
          }
          continue;
        }
        const toLocation=map.chooseRawReceiptLocation(`${text(row?.code)} ${itemName}`,stock);
        if(!toLocation||toLocation==='UNASSIGNED')continue;
        const itemCode=text(row?.code&&row.code!=='-'?row.code:row?.name)||'RM';
        try{
          const inserted=await safePost({transactionType:'RECEIPT',itemCode,itemName,category:'RM',lotNo:lot,quantity:qty,unit:'kg',fromLocation:'',toLocation,fromStatus:'AVAILABLE',toStatus:'AVAILABLE',workOrderNo:'',productionLot:'',referenceNo:ref,supplier:text(row?.supplier&&row.supplier!=='-'?row.supplier:''),receivedAt:text(row?.recv||row?.inspectedAt||row?.date).slice(0,10),expiryDate:'',...pack,reason:`수입검사 합격 자동입고 (${toLocation})`,remark:'IQC 자동연동'});
          refs.add(ref);txByRef.set(ref,inserted||{});
          stock.push({item_code:itemCode,item_name:itemName,lot_no:lot,location_code:toLocation,quality_status:'AVAILABLE',quantity:qty,available_qty:qty});
        }catch(e){console.warn('[QMES inventory] IQC 자동입고 보류',lot,e?.message||e);}
      }

      for(const wo of workOrders()){
        const productionLot=upper(wo?.lot||wo?.no||wo?.lotNo);if(!productionLot)continue;
        const inputs=Array.isArray(wo?.inputs)?wo.inputs:[];
        for(let i=0;i<inputs.length;i++){
          const input=inputs[i]||{},materialLot=upper(input?.lot||input?.materialLot),used=num(input?.act||input?.actualQty||input?.usedQty),itemName=text(input?.name||input?.itemName);
          if(!materialLot||used<=0)continue;
          const ref=`WOISSUE:${productionLot}:${i+1}:${materialLot}`;if(refs.has(ref))continue;
          const fromLocation=map.chooseRawIssueLocation(`${text(input?.code||input?.itemCode)} ${itemName}`,materialLot,used,stock);
          if(!fromLocation)continue;
          const available=stockQty(stock,materialLot,fromLocation);
          if(available+0.000001<used){console.info('[QMES inventory] 원료 자동차감 보류',productionLot,materialLot,`현재고 ${available}, 요청 ${used}`);continue;}
          try{
            await safePost({transactionType:'PRODUCTION_ISSUE',itemCode:text(input?.code||input?.itemCode||input?.name)||'RM',itemName,category:'RM',lotNo:materialLot,quantity:used,unit:text(input?.unit)||'kg',fromLocation,toLocation:'',fromStatus:'AVAILABLE',toStatus:'AVAILABLE',workOrderNo:productionLot,productionLot,referenceNo:ref,supplier:'',receivedAt:'',expiryDate:'',reason:`작업지시 실투입 자동차감 (${fromLocation} → 생산사용)`,remark:'작업지시서 실투입량 자동연동'});
            refs.add(ref);
            const s=stock.find(r=>upper(r?.lot_no||r?.lotNo)===materialLot&&upper(r?.location_code||r?.locationCode)===upper(fromLocation)&&upper(r?.quality_status||r?.qualityStatus)==='AVAILABLE');
            if(s){s.quantity=Math.max(0,num(s.quantity)-used);s.available_qty=Math.max(0,num(s.available_qty??s.quantity)-used);}
          }catch(e){console.warn('[QMES inventory] 원료 자동차감 보류',productionLot,materialLot,e?.message||e);}
        }

        const plan=num(wo?.plan||wo?.planQty),done=num(wo?.done||wo?.prodQty||wo?.productionQty||wo?.actualQty||plan);
        const completed=text(wo?.status)==='완료'||wo?.completed===true||(done>0&&plan>0&&done>=plan);
        if(!completed||done<=0)continue;
        const ref=`WO:${productionLot}`;if(refs.has(ref))continue;
        const itemCode=text(wo?.itemCode||wo?.code||wo?.item)||'FG',itemName=text(wo?.itemName||wo?.item||wo?.product),toLocation=map.chooseFinishedLocation(`${itemCode} ${itemName}`,stock);
        if(!toLocation)continue;
        const pack=packagingOf(wo);if(!pack.packagingType)pack.packagingType='드럼';
        try{
          await safePost({transactionType:'PRODUCTION_RECEIPT',itemCode,itemName,category:'FG',lotNo:productionLot,quantity:done,unit:text(wo?.unit)||'kg',fromLocation:'',toLocation,fromStatus:'AVAILABLE',toStatus:'OQC_PENDING',workOrderNo:productionLot,productionLot,referenceNo:ref,supplier:'',receivedAt:text(wo?.date||wo?.due).slice(0,10),expiryDate:'',...pack,reason:`작업지시 완료 자동입고 (생산완료 → ${toLocation})`,remark:'작업지시서 완료 자동연동'});
          refs.add(ref);
        }catch(e){console.warn('[QMES inventory] 완제품 자동입고 보류',productionLot,e?.message||e);}
      }
      lastRun=Date.now();
      document.dispatchEvent(new CustomEvent('qmes:inventory-auto-linked'));
    }finally{running=false;}
  }

  const trigger=()=>setTimeout(sync,250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,900),{once:true});else setTimeout(sync,900);
  document.addEventListener('qmes:data-updated',trigger);
  document.addEventListener('qmes:data-changed',trigger);
  window.addEventListener('storage',trigger);
  window.setInterval(sync,30000);
})();