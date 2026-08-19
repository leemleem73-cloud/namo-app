/* QMES -> Inventory integration
 * Central flow: IQC -> inventory -> work order/production -> OQC -> shipment.
 * Uses deterministic qmes-sync/inventory keys so repeated reconciliation never duplicates stock.
 */
(function(){
  'use strict';
  if(window.__QMES_INVENTORY_INTEGRATION_20260819__) return;
  window.__QMES_INVENTORY_INTEGRATION_20260819__=true;

  const txt=v=>String(v??'').trim();
  const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0;};
  const first=(obj,keys)=>{for(const k of keys){const v=obj?.[k];if(v!==undefined&&v!==null&&txt(v)!=='')return v;}return'';};
  const parse=r=>{const p=r?.payload;if(p&&typeof p==='object')return p;if(typeof p==='string'){try{return JSON.parse(p)}catch(_e){}}return{};};
  const pass=v=>['합격','PASS','OK','적합','완료','APPROVED'].includes(txt(v).toUpperCase())||['합격','적합','완료'].includes(txt(v));
  const complete=v=>['완료','COMPLETED','COMPLETE','DONE','생산완료'].includes(txt(v).toUpperCase())||['완료','생산완료'].includes(txt(v));
  const categoryOf=row=>{const raw=txt(first(row,['category','itemCategory','materialType','type','kind','구분'])).toUpperCase();if(['PM','부자재','포장재','PACKAGING'].includes(raw))return'PM';if(['FG','완제품'].includes(raw))return'FG';if(['WIP','재공품','반제품'].includes(raw))return'WIP';return'RM';};
  const itemCode=row=>txt(first(row,['itemCode','item_code','materialCode','code','productCode','제품코드','품목코드']))||txt(first(row,['material','materialName','itemName','name','product','productName','원재료명','원료명','품목명','제품명']));
  const itemName=row=>txt(first(row,['itemName','materialName','material','name','productName','product','원재료명','원료명','품목명','제품명']))||itemCode(row);
  const lotOf=row=>txt(first(row,['lotNo','lot','LOT','lot_no','materialLot','supplierLot','LOT No.','LOT No','로트']));
  const qtyOf=row=>num(first(row,['actualQty','actualQuantity','usedQty','inputQty','receivedQty','inQty','qty','quantity','amount','weight','netWeight','실투입량','입고량','수량','중량']));
  const unitOf=row=>txt(first(row,['unit','uom','단위']))||'kg';
  const dateOf=row=>txt(first(row,['date','receivedAt','inDate','inspectionDate','prodDate','productionDate','shipDate','출하일자','입고일자','검사일자','생산일자']));
  const supplierOf=row=>txt(first(row,['supplier','vendor','company','companyName','업체명','공급사']));
  const judgeOf=row=>first(row,['judge','judgement','result','status','decision','판정']);

  async function request(path,options={}){
    const r=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    const p=await r.json().catch(()=>({}));
    if(!r.ok||p.success===false)throw new Error(p.message||`연동 요청 실패 (${r.status})`);
    return p.data||[];
  }
  const list=type=>request('/api/qmes-sync/'+encodeURIComponent(type));
  const upsert=(key,payload)=>request('/api/qmes-sync/inventory',{method:'POST',body:JSON.stringify({key,payload})});

  function txPayload(transaction,source){return{kind:'transaction',transaction,source,createdAt:source.date||new Date().toISOString(),operatorName:txt(source.operator||source.inspector||source.worker||'자동연동'),integration:true};}
  function reservationPayload(reservation,source){return{kind:'reservation',reservation,source,createdAt:source.date||new Date().toISOString(),integration:true};}

  async function syncIQC(records){
    let n=0;
    for(const rec of records||[]){
      const p=parse(rec);if(p.deleted)continue;
      for(const row of Array.isArray(p.rows)?p.rows:[]){
        if(!pass(judgeOf(row)))continue;
        const lot=lotOf(row)||txt(p.lotNo),code=itemCode(row),q=qtyOf(row);if(!lot||!code||q<=0)continue;
        const cat=categoryOf(row),key='auto:iqc:'+txt(row.inNo||row.serverId||rec.record_key)+':'+code+':'+lot;
        const tx={transaction_type:'RECEIPT',item_code:code.toUpperCase(),item_name:itemName(row),category:cat,lot_no:lot.toUpperCase(),quantity:q,unit:unitOf(row),from_location:'',to_location:cat==='PM'?'PM-WH':'RM-WH',from_status:'',to_status:'AVAILABLE',reference_no:txt(row.inNo||rec.record_key),supplier:supplierOf(row),received_at:dateOf(row)||null,expiry_date:txt(first(row,['expiryDate','expireDate','유효기간']))||null,reason:'IQC 합격 자동입고'};
        await upsert(key,txPayload(tx,{module:'IQC',recordKey:rec.record_key,date:dateOf(row),inspector:first(row,['inspector','checker','검사자'])}));n++;
      }
    }
    return n;
  }

  function materialRows(doc){const pools=[doc?.materials,doc?.materialRows,doc?.recipeMaterials,doc?.rawMaterials,doc?.ingredients,doc?.inputs];for(const p of pools)if(Array.isArray(p))return p;return[];}
  async function syncWorkorders(records){
    let n=0;
    for(const rec of records||[]){const p=parse(rec);if(p.deleted)continue;const doc=p.doc||{},batch=p.batch||{},wo=txt(p.lotNo||rec.record_key);if(!wo)continue;
      for(let i=0;i<materialRows(doc).length;i++){
        const row=materialRows(doc)[i],code=itemCode(row),q=num(first(row,['planQty','plannedQty','requiredQty','qty','quantity','계획량','소요량']));if(!code||q<=0)continue;
        const lot=lotOf(row),cat=categoryOf(row),key='auto:reserve:'+wo+':'+i+':'+code;
        await upsert(key,reservationPayload({item_code:code.toUpperCase(),lot_no:lot.toUpperCase(),location_code:cat==='PM'?'PM-WH':'RM-WH',work_order_no:wo,quantity:q,status:'ACTIVE',reserved_by:'작업지시 자동예약'}, {module:'WORKORDER',recordKey:rec.record_key,date:first(batch,['date','prodDate','productionDate'])}));n++;
        const used=num(first(row,['actualQty','actualQuantity','usedQty','inputQty','실투입량','사용량']));if(lot&&used>0){const tkey='auto:issue:'+wo+':'+i+':'+code+':'+lot;await upsert(tkey,txPayload({transaction_type:'PRODUCTION_ISSUE',item_code:code.toUpperCase(),item_name:itemName(row),category:cat,lot_no:lot.toUpperCase(),quantity:used,unit:unitOf(row),from_location:cat==='PM'?'PM-WH':'RM-WH',to_location:'PROD',from_status:'AVAILABLE',to_status:'AVAILABLE',work_order_no:wo,production_lot:wo,reason:'작업지시 실투입 자동차감'},{module:'WORKORDER',recordKey:rec.record_key,date:first(batch,['date','prodDate','productionDate'])}));n++;}
      }
      const state=first(batch,['status','state','progress'])||first(doc,['status','state']);
      const finishedQty=num(first(batch,['actualQty','actualQuantity','productionQty','resultQty','qty','quantity','실투입량','생산량','완료수량']));
      const productCode=txt(first(batch,['itemCode','productCode','code']))||txt(first(doc,['itemCode','productCode','code']))||txt(first(batch,['item','product','itemName','productName']))||txt(first(doc,['item','product','itemName','productName']));
      const productName=txt(first(batch,['itemName','productName','item','product']))||txt(first(doc,['itemName','productName','item','product']))||productCode;
      if((complete(state)||finishedQty>0)&&finishedQty>0&&productCode){const key='auto:prod-receipt:'+wo;await upsert(key,txPayload({transaction_type:'PRODUCTION_RECEIPT',item_code:productCode.toUpperCase(),item_name:productName,category:'FG',lot_no:wo.toUpperCase(),quantity:finishedQty,unit:txt(first(batch,['unit','uom']))||'kg',from_location:'',to_location:'OQC',from_status:'',to_status:'OQC_PENDING',work_order_no:wo,production_lot:wo,reason:'생산완료 자동입고'},{module:'WORKORDER',recordKey:rec.record_key,date:first(batch,['date','prodDate','productionDate'])}));n++;}
    }
    return n;
  }

  async function syncOQC(records){
    let n=0;
    for(const rec of records||[]){const p=parse(rec);if(p.deleted)continue;const rows=Array.isArray(p.rows)?p.rows:[];if(!rows.length)continue;const firstRow=rows[0];if(!rows.some(r=>pass(judgeOf(r))))continue;const lot=lotOf(firstRow)||txt(p.lotNo),code=itemCode(firstRow),q=qtyOf(firstRow);if(!lot||!code||q<=0)continue;
      const relKey='auto:oqc-release:'+txt(firstRow.groupId||firstRow.id||rec.record_key)+':'+lot;
      await upsert(relKey,txPayload({transaction_type:'MOVE',item_code:code.toUpperCase(),item_name:itemName(firstRow),category:'FG',lot_no:lot.toUpperCase(),quantity:q,unit:unitOf(firstRow),from_location:'OQC',to_location:'FG-WH',from_status:'OQC_PENDING',to_status:'AVAILABLE',reference_no:txt(firstRow.groupId||rec.record_key),reason:'OQC 합격 출하가능 전환'},{module:'OQC',recordKey:rec.record_key,date:dateOf(firstRow),inspector:first(firstRow,['inspector','checker','검사자'])}));n++;
      const shipped=num(first(firstRow,['shippedQty','shipmentQty','outQty','deliveryQty','출하량']));const shipDate=txt(first(firstRow,['shipDate','shipmentDate','출하일자']));if(shipped>0&&shipDate){const skey='auto:shipment:'+txt(firstRow.groupId||firstRow.id||rec.record_key)+':'+lot;await upsert(skey,txPayload({transaction_type:'SHIPMENT',item_code:code.toUpperCase(),item_name:itemName(firstRow),category:'FG',lot_no:lot.toUpperCase(),quantity:shipped,unit:unitOf(firstRow),from_location:'FG-WH',to_location:'',from_status:'AVAILABLE',to_status:'',reference_no:txt(firstRow.shipNo||firstRow.outNo||rec.record_key),reason:'출하 자동차감'},{module:'OQC',recordKey:rec.record_key,date:shipDate}));n++;}
    }
    return n;
  }

  let running=false,lastAt=0;
  async function reconcile(force=false){if(running)return;if(!force&&Date.now()-lastAt<15000)return;running=true;try{const [iqc,wo,oqc]=await Promise.all([list('iqc'),list('workorder'),list('oqc')]);const result={iqc:await syncIQC(iqc),workorder:await syncWorkorders(wo),oqc:await syncOQC(oqc)};lastAt=Date.now();window.__QMES_INVENTORY_LAST_RECONCILE__={at:new Date().toISOString(),...result};window.dispatchEvent(new CustomEvent('qmes:inventory-reconciled',{detail:result}));}catch(e){console.warn('[QMES inventory integration]',e);}finally{running=false;}}
  window.qmesReconcileInventory=()=>reconcile(true);
  window.addEventListener('qmes:mes-master-ready',()=>reconcile(true));
  window.addEventListener('focus',()=>reconcile(false));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconcile(false);});
  setTimeout(()=>reconcile(true),1200);
  setInterval(()=>reconcile(false),30000);
})();
