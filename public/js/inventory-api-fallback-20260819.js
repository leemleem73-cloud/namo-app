/* QMES inventory API fallback - fast shared DB mode */
(function(){
  'use strict';
  if(window.__QMES_INVENTORY_API_FALLBACK_FAST__) return;
  window.__QMES_INVENTORY_API_FALLBACK_FAST__=true;

  const nativeFetch=window.fetch.bind(window);
  const locations=[
    {location_code:'IQC',location_name:'IQC 검사대기',location_type:'QUALITY'},
    {location_code:'RM-WH',location_name:'원료창고',location_type:'STORAGE'},
    {location_code:'PM-WH',location_name:'부자재창고',location_type:'STORAGE'},
    {location_code:'PROD',location_name:'생산현장',location_type:'PRODUCTION'},
    {location_code:'WIP',location_name:'재공품 보관',location_type:'WIP'},
    {location_code:'OQC',location_name:'OQC 검사대기',location_type:'QUALITY'},
    {location_code:'FG-WH',location_name:'완제품창고',location_type:'STORAGE'},
    {location_code:'SHIP',location_name:'출하대기',location_type:'SHIPPING'},
    {location_code:'HOLD',location_name:'보류/격리구역',location_type:'QUARANTINE'}
  ];

  const ok=data=>new Response(JSON.stringify({success:true,message:'OK',data}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
  const fail=(status,message)=>new Response(JSON.stringify({success:false,message,data:null}),{status,headers:{'Content-Type':'application/json; charset=utf-8'}});
  const parsePayload=record=>{const p=record?.payload;if(p&&typeof p==='object')return p;if(typeof p==='string'){try{return JSON.parse(p)}catch(_e){}}return{};};

  let cache=[];
  let cacheAt=0;
  let inFlight=null;
  const CACHE_MS=3000;

  async function sharedList(force=false){
    if(!force&&cacheAt&&Date.now()-cacheAt<CACHE_MS) return cache;
    if(inFlight) return inFlight;
    inFlight=(async()=>{
      const r=await nativeFetch('/api/qmes-sync/inventory',{credentials:'same-origin'});
      const p=await r.json().catch(()=>({}));
      if(!r.ok||p.success===false)throw new Error(p.message||'공용 재고 DB 조회 실패');
      cache=p.data||[];cacheAt=Date.now();return cache;
    })().finally(()=>{inFlight=null;});
    return inFlight;
  }

  async function sharedUpsert(key,payload){
    const r=await nativeFetch('/api/qmes-sync/inventory',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,payload})});
    const p=await r.json().catch(()=>({}));
    if(!r.ok||p.success===false)throw new Error(p.message||'공용 재고 DB 저장 실패');
    cacheAt=0;
    return p.data;
  }

  function rows(records){return(records||[]).map(r=>({record:r,payload:parsePayload(r)})).filter(x=>!x.payload.deleted);}
  function txRows(records){return rows(records).filter(x=>x.payload.kind==='transaction').map(x=>({id:x.record.record_key,created_at:x.payload.createdAt||x.record.updated_at,operator_name:x.payload.operatorName||'',...x.payload.transaction})).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));}
  function countRows(records){return rows(records).filter(x=>x.payload.kind==='count').map(x=>({id:x.record.record_key,created_at:x.payload.createdAt||x.record.updated_at,...x.payload.count})).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));}
  function reservationRows(records){return rows(records).filter(x=>x.payload.kind==='reservation').map(x=>({id:x.record.record_key,created_at:x.payload.createdAt||x.record.updated_at,...x.payload.reservation})).filter(r=>r.status!=='RELEASED').sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));}
  function itemRows(records){const map=new Map();rows(records).forEach(x=>{if(x.payload.kind==='item'&&x.payload.item?.item_code)map.set(x.payload.item.item_code,x.payload.item);if(x.payload.kind==='transaction'){const t=x.payload.transaction||{};if(t.item_code)map.set(t.item_code,{item_code:t.item_code,item_name:t.item_name||t.item_code,category:t.category||'RM',unit:t.unit||'kg',safety_stock:0,active:true});}});return Array.from(map.values()).sort((a,b)=>String(a.item_name).localeCompare(String(b.item_name),'ko'));}

  function stockRows(records){
    const tx=txRows(records),reservations=reservationRows(records),map=new Map();
    function add(item,lot,loc,status,delta,meta={}){if(!loc||!status||!delta)return;const k=[item,lot,loc,status].join('|');const prev=map.get(k)||{item_code:item,item_name:meta.item_name||item,category:meta.category||'RM',unit:meta.unit||'kg',lot_no:lot,location_code:loc,quality_status:status,quantity:0,supplier:meta.supplier||'',received_at:meta.received_at||null,expiry_date:meta.expiry_date||null,reserved_qty:0};prev.quantity=Number(prev.quantity)+Number(delta);if(meta.item_name)prev.item_name=meta.item_name;if(meta.category)prev.category=meta.category;if(meta.unit)prev.unit=meta.unit;if(meta.supplier)prev.supplier=meta.supplier;if(meta.received_at)prev.received_at=meta.received_at;if(meta.expiry_date)prev.expiry_date=meta.expiry_date;map.set(k,prev);}
    tx.slice().reverse().forEach(t=>{const meta={item_name:t.item_name,category:t.category,unit:t.unit,supplier:t.supplier,received_at:t.received_at,expiry_date:t.expiry_date};const q=Number(t.quantity)||0;if(t.from_location)add(t.item_code,t.lot_no,t.from_location,t.from_status||'AVAILABLE',-q,meta);if(t.to_location)add(t.item_code,t.lot_no,t.to_location,t.to_status||'AVAILABLE',q,meta);});
    reservations.forEach(r=>{map.forEach(row=>{if(row.item_code!==r.item_code)return;if(r.lot_no&&row.lot_no!==r.lot_no)return;if(r.location_code&&row.location_code!==r.location_code)return;row.reserved_qty+=Number(r.quantity)||0;});});
    return Array.from(map.values()).filter(r=>Math.abs(Number(r.quantity))>.000001).map(r=>({...r,available_qty:Math.max(0,Number(r.quantity)-Number(r.reserved_qty||0))}));
  }

  function summary(records){const stock=stockRows(records),cats={};stock.forEach(r=>{const c=r.category||'RM';cats[c]=cats[c]||{category:c,total_qty:0,available_qty:0,pending_qty:0,hold_qty:0};cats[c].total_qty+=Number(r.quantity)||0;if(r.quality_status==='AVAILABLE')cats[c].available_qty+=Number(r.available_qty)||0;if(['IQC_PENDING','OQC_PENDING'].includes(r.quality_status))cats[c].pending_qty+=Number(r.quantity)||0;if(['HOLD','NONCONFORM'].includes(r.quality_status))cats[c].hold_qty+=Number(r.quantity)||0;});return{totals:Object.values(cats),safetyAlerts:[],expiryAlerts:stock.filter(r=>r.expiry_date&&new Date(r.expiry_date)<=new Date(Date.now()+30*86400000)),pendingLots:new Set(stock.filter(r=>['IQC_PENDING','OQC_PENDING'].includes(r.quality_status)).map(r=>r.item_code+'|'+r.lot_no)).size};}

  async function fallback(path,init={}){
    if(path==='/locations') return ok(locations);
    if(path==='/health') return ok({database:'qmes-sync',module:'inventory-fast-fallback'});
    const records=await sharedList();
    if(path==='/items')return ok(itemRows(records));
    if(path==='/stock')return ok(stockRows(records));
    if(path==='/summary')return ok(summary(records));
    if(path.startsWith('/transactions')&&(!init.method||init.method==='GET'))return ok(txRows(records));
    if(path==='/counts'&&(!init.method||init.method==='GET'))return ok(countRows(records));
    if(path==='/reservations'&&(!init.method||init.method==='GET'))return ok(reservationRows(records));

    if(path==='/transactions'&&String(init.method||'GET').toUpperCase()==='POST'){
      const b=JSON.parse(init.body||'{}'),q=Number(b.quantity);if(!b.itemCode||!b.lotNo||!Number.isFinite(q)||q<=0)return fail(400,'품목, LOT, 0보다 큰 수량은 필수입니다.');
      const transaction={transaction_type:String(b.transactionType||'RECEIPT').toUpperCase(),item_code:String(b.itemCode||'').trim().toUpperCase(),item_name:String(b.itemName||b.itemCode||'').trim(),category:String(b.category||'RM').toUpperCase(),lot_no:String(b.lotNo||'').trim().toUpperCase(),quantity:q,unit:String(b.unit||'kg'),from_location:String(b.fromLocation||'').trim().toUpperCase(),to_location:String(b.toLocation||'').trim().toUpperCase(),from_status:String(b.fromStatus||'').trim().toUpperCase(),to_status:String(b.toStatus||'').trim().toUpperCase(),work_order_no:String(b.workOrderNo||''),production_lot:String(b.productionLot||''),reference_no:String(b.referenceNo||''),supplier:String(b.supplier||''),received_at:b.receivedAt||null,expiry_date:b.expiryDate||null,reason:String(b.reason||''),remark:String(b.remark||'')};
      const key='tx:'+Date.now()+':'+Math.random().toString(36).slice(2,8);await sharedUpsert(key,{kind:'transaction',transaction,createdAt:new Date().toISOString(),operatorName:String(window.__QMES_USER__?.name||window.__QMES_USER__||'')});return ok({id:key,...transaction,created_at:new Date().toISOString()});
    }

    if(path==='/counts'&&String(init.method||'GET').toUpperCase()==='POST'){
      const b=JSON.parse(init.body||'{}'),stock=stockRows(records),row=stock.find(r=>r.item_code===String(b.itemCode||'').toUpperCase()&&r.lot_no===String(b.lotNo||'').toUpperCase()&&r.location_code===String(b.locationCode||'').toUpperCase()&&r.quality_status===String(b.qualityStatus||'AVAILABLE').toUpperCase());const book=Number(row?.quantity||0),actual=Number(b.actualQty);if(!Number.isFinite(actual)||actual<0)return fail(400,'실사수량을 확인하세요.');const diff=actual-book,key='count:'+Date.now()+':'+Math.random().toString(36).slice(2,8);const count={count_date:new Date().toISOString().slice(0,10),item_code:String(b.itemCode||'').toUpperCase(),lot_no:String(b.lotNo||'').toUpperCase(),location_code:String(b.locationCode||'').toUpperCase(),quality_status:String(b.qualityStatus||'AVAILABLE').toUpperCase(),book_qty:book,actual_qty:actual,difference_qty:diff,reason:String(b.reason||''),counted_by:String(window.__QMES_USER__?.name||window.__QMES_USER__||'')};await sharedUpsert(key,{kind:'count',count,createdAt:new Date().toISOString()});if(Math.abs(diff)>.000001){const txKey='tx:'+Date.now()+':adj';await sharedUpsert(txKey,{kind:'transaction',createdAt:new Date().toISOString(),operatorName:count.counted_by,transaction:{transaction_type:'ADJUSTMENT',item_code:count.item_code,item_name:row?.item_name||count.item_code,category:row?.category||'RM',lot_no:count.lot_no,quantity:Math.abs(diff),unit:row?.unit||'kg',from_location:diff<0?count.location_code:'',to_location:diff>0?count.location_code:'',from_status:diff<0?count.quality_status:'',to_status:diff>0?count.quality_status:'',reason:count.reason||'재고실사 조정'}});}return ok({bookQty:book,actualQty:actual,differenceQty:diff});
    }
    return fail(404,'지원하지 않는 재고 요청입니다.');
  }

  window.fetch=function(input,init={}){
    const url=typeof input==='string'?input:(input?.url||'');
    if(!url.startsWith('/api/inventory'))return nativeFetch(input,init);
    const path=url.slice('/api/inventory'.length).split('?')[0]||'/';
    return fallback(path,init);
  };
})();
