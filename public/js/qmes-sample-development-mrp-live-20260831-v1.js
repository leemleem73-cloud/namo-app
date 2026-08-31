/* NAMO QMES - Sample / Development live MRP V1 - 2026-08-31
 * Scope: current NAMO stage only. NO mass-production planning.
 * Sources:
 *  - all incomplete work orders -> existing material commitments/reservations
 *  - IQC -> inspection status reference
 *  - inventory transaction ledger -> IQC-approved on-hand raw material stock
 *  - ERP purchase rows -> inbound quantities due before the sample/development production date
 *  - active Recipe/BOM or latest real work-order material plan -> material requirements
 *
 * This module replaces only the visible Production Plan/MRP view. It does not alter
 * sales order screens or original work-order / IQC records.
 */
(function(){
  'use strict';
  if(window.__QMES_SAMPLE_DEVELOPMENT_MRP_LIVE_20260831_V1__) return;
  window.__QMES_SAMPLE_DEVELOPMENT_MRP_LIVE_20260831_V1__=true;

  const HOST='qmes-sample-development-mrp-live-v1';
  const STYLE='qmes-sample-development-mrp-live-v1-style';
  const PLAN_KEY='qmes-erp-plan-v1';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/,/g,''));return Number.isFinite(n)?n:0};
  const norm=v=>clean(v).toUpperCase().replace(/[^A-Z0-9가-힣]/g,'');
  const today=()=>new Date().toISOString().slice(0,10);
  const fmt=v=>`${Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`;
  const parsePayload=rec=>{const p=rec?.payload;if(p&&typeof p==='object')return p;if(typeof p==='string'){try{return JSON.parse(p)}catch(_){}}return {}};
  const first=(obj,keys)=>{for(const k of keys){const v=obj?.[k];if(v!==undefined&&v!==null&&clean(v)!=='')return v}return ''};
  const complete=v=>/완료|생산완료|COMPLETED|COMPLETE|DONE|취소|CANCEL|폐기/i.test(clean(v));
  const pass=v=>/^(합격|적합|PASS|OK|APPROVED|완료)$/i.test(clean(v));
  const fail=v=>/불합격|부적합|FAIL|NG|REJECT/i.test(clean(v));
  const genericMaterial=v=>/^(첨가제|원료|기타|ADDITIVE)$/i.test(clean(v));

  let host=null;
  let hidden=[];
  let opened=false;
  let state={date:today(),product:'',qty:'',loading:true,error:'',products:[],workorders:[],iqc:[],inventory:[],purchases:[],mrp:[],revision:'-',recipeSource:'-',currentPossible:0,shortageCount:0,expectedShortageCount:0,pendingIqc:0,activeWoCount:0,incomingCount:0};

  function main(){return document.querySelector('#root main')||document.querySelector('main')}
  async function syncList(type){
    try{return typeof window.qmesSyncList==='function'?(await window.qmesSyncList(type)||[]):[]}catch(error){console.warn('[QMES Sample/Dev MRP] sync list failed',type,error);return []}
  }
  function readLocal(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v}catch(_){return fallback}}
  function writeLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}

  function ensureStyle(){
    if(document.getElementById(STYLE)) return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      #${HOST}{color:#172033;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif;padding:0 0 22px}
      #${HOST} *{box-sizing:border-box}
      #${HOST} .smrp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin:0 0 14px}
      #${HOST} h1{margin:0;font-size:23px;font-weight:950;letter-spacing:-.4px;color:#172033}
      #${HOST} .smrp-sub{margin-top:5px;color:#64748b;font-size:12px;font-weight:650}
      #${HOST} .smrp-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      #${HOST} .smrp-sync{display:inline-flex;align-items:center;border:1px solid #bbf7d0;background:#ecfdf3;color:#15803d;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900}
      #${HOST} button{border:0;border-radius:8px;background:#2563eb;color:#fff;padding:9px 13px;font-size:11px;font-weight:900;cursor:pointer}
      #${HOST} button:disabled{opacity:.55;cursor:wait}
      #${HOST} .smrp-grid2{display:grid;grid-template-columns:1.35fr .78fr;gap:13px;margin-bottom:13px}
      #${HOST} .smrp-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:15px;box-shadow:0 8px 24px rgba(15,23,42,.045)}
      #${HOST} .smrp-card h2{margin:0 0 11px;font-size:15px;font-weight:950;color:#172033}
      #${HOST} .smrp-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
      #${HOST} .smrp-field label{display:block;margin-bottom:5px;color:#475569;font-size:10px;font-weight:850}
      #${HOST} input,#${HOST} select{width:100%;height:36px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#111827;padding:0 8px;font-size:12px;outline:none}
      #${HOST} input[readonly]{background:#f8fafc;color:#475569;font-weight:800}
      #${HOST} input:focus,#${HOST} select:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.14)}
      #${HOST} .smrp-alerts{display:grid;gap:8px}
      #${HOST} .smrp-alert{display:flex;justify-content:space-between;gap:12px;padding:9px 10px;border-radius:8px;font-size:10.5px;font-weight:850}
      #${HOST} .smrp-alert.blue{background:#eff6ff;color:#1e40af}#${HOST} .smrp-alert.red{background:#fff1f2;color:#9f1239}#${HOST} .smrp-alert.orange{background:#fff7ed;color:#9a3412}#${HOST} .smrp-alert.green{background:#ecfdf3;color:#166534}#${HOST} .smrp-alert.slate{background:#f1f5f9;color:#475569}
      #${HOST} .smrp-table-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,.045);overflow:hidden}
      #${HOST} .smrp-table-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px 9px}
      #${HOST} .smrp-table-head h2{margin:0;font-size:15px;font-weight:950}#${HOST} .smrp-muted{font-size:10px;color:#64748b;font-weight:800}
      #${HOST} .smrp-table-wrap{overflow:auto;padding:0 12px 8px}
      #${HOST} table{width:100%;border-collapse:collapse;font-size:11px}
      #${HOST} th{background:#f8fafc;color:#475569;text-align:left;padding:8px;border-bottom:1px solid #dbe3ec;font-size:9.5px;font-weight:900;white-space:nowrap}
      #${HOST} td{padding:9px 8px;border-bottom:1px solid #edf2f7;white-space:nowrap;color:#334155}
      #${HOST} tr:last-child td{border-bottom:0}
      #${HOST} .smrp-status{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900}
      #${HOST} .smrp-status.green{background:#dcfce7;color:#15803d}#${HOST} .smrp-status.orange{background:#ffedd5;color:#c2410c}#${HOST} .smrp-status.red{background:#fee2e2;color:#b91c1c}#${HOST} .smrp-status.slate{background:#f1f5f9;color:#475569}
      #${HOST} .smrp-error{margin-bottom:12px;padding:10px;border-radius:8px;background:#fff1f2;color:#b91c1c;font-size:11px;font-weight:850}
      #${HOST} .smrp-info{margin-bottom:12px;padding:9px 10px;border-radius:8px;border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;font-size:10.5px;font-weight:700;line-height:1.6}
      @media(max-width:1150px){#${HOST} .smrp-grid2{grid-template-columns:1fr}#${HOST} .smrp-form{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){#${HOST} .smrp-head{flex-direction:column}#${HOST} .smrp-actions{justify-content:flex-start}#${HOST} .smrp-form{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function materialRows(doc){
    const pools=[doc?.materials,doc?.materialRows,doc?.recipeMaterials,doc?.rawMaterials,doc?.ingredients,doc?.inputs];
    for(const p of pools) if(Array.isArray(p)) return p;
    return [];
  }
  function workorderDocs(records){
    const out=[];
    (records||[]).forEach(rec=>{const p=parsePayload(rec),doc=p.doc||{},batch=p.batch||{};out.push({recordKey:rec.record_key,doc,batch,wo:clean(p.lotNo||batch.lot||batch.workOrder||doc.workOrder||rec.record_key),state:first(batch,['status','state','progress'])||first(doc,['status','state','progress']),date:first(batch,['date','prodDate','productionDate'])||first(doc,['date','prodDate','productionDate'])})});
    const globalDocs=window.DB?.woDocs||{};
    Object.entries(globalDocs).forEach(([key,doc])=>{if(out.some(x=>x.wo===key))return;out.push({recordKey:key,doc:doc||{},batch:{},wo:key,state:first(doc,['status','state','progress']),date:first(doc,['date','prodDate','productionDate'])})});
    return out;
  }
  function activeWorkorders(records){return workorderDocs(records).filter(x=>!complete(x.state))}
  function workorderProduct(w){return clean(first(w.batch,['item','product','itemName','productName'])||first(w.doc,['item','product','itemName','productName']))}

  function productList(workorders){
    const set=new Set();
    workorders.forEach(w=>{const p=workorderProduct(w);if(p)set.add(p)});
    try{(window.DB?.batches||[]).forEach(b=>{const p=clean(b?.item||b?.product||b?.productName);if(p)set.add(p)})}catch(_){ }
    try{window.qmesItemMaster?.list?.({type:'제품'})?.forEach(x=>{if(clean(x?.name))set.add(clean(x.name))})}catch(_){ }
    try{window.qmesItemMaster?.list?.({type:'중간재'})?.forEach(x=>{if(clean(x?.name))set.add(clean(x.name))})}catch(_){ }
    return [...set].sort((a,b)=>a.localeCompare(b,'ko'));
  }

  function latestWorkorderRecipe(product,workorders){
    const pkey=norm(product);
    const matches=workorders.filter(w=>norm(workorderProduct(w))===pkey&&materialRows(w.doc).length).sort((a,b)=>clean(b.date).localeCompare(clean(a.date)));
    const w=matches[0];if(!w)return null;
    const rows=materialRows(w.doc).map(r=>({code:clean(first(r,['code','itemCode','materialCode'])),name:clean(first(r,['name','material','materialName','item','itemName'])),qty:num(first(r,['planQty','plannedQty','requiredQty','qty','quantity','std','소요량','계획량'])),unit:clean(first(r,['unit','uom']))||'kg'})).filter(r=>r.name&&r.qty>0);
    if(!rows.length)return null;
    const sum=rows.reduce((s,r)=>s+r.qty,0);if(!(sum>0))return null;
    return {revision:clean(first(w.doc,['recipeRevision','recipeRev','revision','recipeVersion']))||clean(first(w.batch,['recipeRevision','recipeRev','revision','recipeVersion']))||`WO ${w.wo}`,source:`작업지시 ${w.wo}`,materials:rows.map(r=>({...r,ratio:r.qty/sum*100}))};
  }

  function recipeFor(product,workorders){
    try{
      const r=window.qmesRecipeMaster?.getActive?.(product);
      if(r&&Array.isArray(r.materials)&&r.materials.length){return {revision:clean(r.version||r.revision)||'현재 승인',source:'현재 승인 Recipe/BOM',materials:r.materials.map(m=>({code:clean(m.code),name:clean(m.name),ratio:num(m.ratio),unit:clean(m.unit)||'kg'})).filter(m=>m.name&&m.ratio>0)}}
    }catch(_){ }
    try{
      const list=Object.values(window.DB?.recipeMaster||{}).filter(r=>r&&r.active!==false&&(norm(r.productName)===norm(product)||norm(r.productCode)===norm(product))).sort((a,b)=>clean(b.version).localeCompare(clean(a.version),undefined,{numeric:true}));
      const r=list[0];if(r&&Array.isArray(r.materials)&&r.materials.length)return {revision:clean(r.version||r.revision)||'현재 승인',source:'Recipe/BOM Master',materials:r.materials.map(m=>({code:clean(m.code),name:clean(m.name),ratio:num(m.ratio),unit:clean(m.unit)||'kg'})).filter(m=>m.name&&m.ratio>0)};
    }catch(_){ }
    return latestWorkorderRecipe(product,workorders);
  }

  function materialMatch(row,mat){
    const keys=[mat.code,mat.name].map(norm).filter(Boolean);if(!keys.length)return false;
    const vals=[first(row,['item_code','itemCode','materialCode','code']),first(row,['item_name','itemName','materialName','material','name','원료명'])].map(norm).filter(Boolean);
    return keys.some(k=>vals.includes(k));
  }

  function onHandFromInventory(records,mat){
    let total=0;
    (records||[]).forEach(rec=>{const p=parsePayload(rec);if(p?.kind!=='transaction')return;const tx=p.transaction||{};if(!materialMatch(tx,mat))return;const cat=clean(tx.category).toUpperCase();if(cat&&cat!=='RM'&&cat!=='PM')return;const q=Math.max(0,num(tx.quantity));const type=clean(tx.transaction_type).toUpperCase();if(/RECEIPT|RETURN|ADJUSTMENT_IN/.test(type))total+=q;else if(/PRODUCTION_ISSUE|ISSUE|SCRAP|ADJUSTMENT_OUT/.test(type))total-=q});
    return Math.max(0,total);
  }

  function reservedFromActiveWorkorders(workorders,mat){
    let total=0;
    workorders.forEach(w=>materialRows(w.doc).forEach(r=>{if(!materialMatch({itemCode:first(r,['code','itemCode','materialCode']),itemName:first(r,['name','material','materialName','item','itemName'])},mat))return;total+=Math.max(0,num(first(r,['planQty','plannedQty','requiredQty','qty','quantity','std','소요량','계획량']))) }));
    return total;
  }

  function iqcRows(records){const out=[];(records||[]).forEach(rec=>{const p=parsePayload(rec);(Array.isArray(p.rows)?p.rows:[]).forEach(row=>out.push(row))});try{const pools=[window.DB?.iqc,window.DB?.insp?.IQC,window.DB?.iqcRecords];for(const pool of pools)if(Array.isArray(pool))pool.forEach(row=>out.push(row))}catch(_){ }return out}
  function pendingIqcFor(rows,mat){return rows.filter(r=>materialMatch({itemCode:first(r,['itemCode','code','materialCode']),itemName:first(r,['name','material','materialName','item','itemName'])},mat)).filter(r=>{const j=first(r,['judge','judgment','result','inspectionResult','status']);return !pass(j)&&!fail(j)}).length}

  function purchaseRows(inventoryRecords){
    let rows=[];
    (inventoryRecords||[]).forEach(rec=>{if(clean(rec?.record_key)!=='erp:purchase')return;const p=parsePayload(rec);if(Array.isArray(p.rows))rows=p.rows});
    if(!rows.length){const local=readLocal('qmes-erp-purchase-v1',[]);if(Array.isArray(local))rows=local}
    return rows.filter(r=>!(clean(r?.id)==='PO-260824-01'&&/Supplier A/i.test(clean(r?.supplier)))&&!(clean(r?.id)==='PO-260824-02'&&/Supplier B/i.test(clean(r?.supplier))));
  }
  function incomingBefore(rows,mat,date){
    const cutoff=clean(date);let total=0,count=0;
    rows.forEach(r=>{if(!materialMatch({itemCode:first(r,['itemCode','code','materialCode']),itemName:first(r,['material','materialName','item','itemName'])},mat))return;const status=clean(r?.status),iqc=clean(r?.iqc);if(/취소|완료|입고완료/i.test(status)||pass(iqc)||fail(iqc))return;const d=clean(r?.expected||r?.expectedDate||r?.due||r?.dueDate);if(cutoff&&d&&d>cutoff)return;const q=Math.max(0,num(r?.qty??r?.quantity));if(q>0){total+=q;count++}});
    return {qty:total,count};
  }

  function calc(){
    const qty=Math.max(0,num(state.qty));
    const active=activeWorkorders(state.workorders);
    const recipe=recipeFor(state.product,workorderDocs(state.workorders));
    const iqc=iqcRows(state.iqc),purchases=state.purchases;
    if(!state.product||qty<=0){state={...state,mrp:[],revision:recipe?.revision||'-',recipeSource:recipe?.source||'-',currentPossible:0,shortageCount:0,expectedShortageCount:0,pendingIqc:0,activeWoCount:active.length,incomingCount:0};render();return}
    if(!recipe||!recipe.materials.length){state={...state,error:'선택 제품의 현재 승인 Recipe/BOM 또는 실제 작업지시 원료계획을 찾을 수 없습니다.',mrp:[],revision:'미등록',recipeSource:'-',currentPossible:0,shortageCount:0,expectedShortageCount:0,pendingIqc:0,activeWoCount:active.length,incomingCount:0};render();return}
    const ratioTotal=recipe.materials.reduce((s,m)=>s+Math.max(0,num(m.ratio)),0)||100;
    let pendingTotal=0,incomingCount=0;
    const mrp=recipe.materials.map(mat=>{
      const need=qty*Math.max(0,num(mat.ratio))/ratioTotal;
      const onHand=onHandFromInventory(state.inventory,mat);
      const reserved=reservedFromActiveWorkorders(active,mat);
      const usable=Math.max(0,onHand-reserved);
      const incoming=incomingBefore(purchases,mat,state.date);incomingCount+=incoming.count;
      const currentShort=Math.max(0,need-usable);
      const expectedShort=Math.max(0,need-usable-incoming.qty);
      const pending=pendingIqcFor(iqc,mat);pendingTotal+=pending;
      const generic=genericMaterial(mat.name);
      let status='충족',tone='green';
      if(generic){status='Recipe 원료명 확인';tone='orange'}
      else if(currentShort>0&&expectedShort===0){status='입고 조건부';tone='orange'}
      else if(expectedShort>0){status='부족 / 발주 검토';tone='red'}
      else if(pending>0){status='IQC 대기 확인';tone='orange'}
      return {...mat,need,onHand,reserved,usable,incoming:incoming.qty,currentShort,expectedShort,pending,status,tone,generic};
    });
    const totalNeed=mrp.reduce((s,r)=>s+r.need,0),totalCurrentShort=mrp.reduce((s,r)=>s+r.currentShort,0);
    const possible=totalNeed>0?Math.max(0,Math.min(100,(totalNeed-totalCurrentShort)/totalNeed*100)):0;
    state={...state,error:'',mrp,revision:recipe.revision||'-',recipeSource:recipe.source||'-',currentPossible:possible,shortageCount:mrp.filter(r=>r.currentShort>0).length,expectedShortageCount:mrp.filter(r=>r.expectedShort>0).length,pendingIqc:pendingTotal,activeWoCount:active.length,incomingCount};
    render();
  }

  async function loadData(){
    state={...state,loading:true,error:''};render();
    try{if(typeof window.qmesReconcileInventory==='function')await window.qmesReconcileInventory()}catch(_){ }
    const [workorders,iqc,inventory]=await Promise.all([syncList('workorder'),syncList('iqc'),syncList('inventory')]);
    const docs=workorderDocs(workorders),products=productList(docs),purchases=purchaseRows(inventory);
    let product=state.product;if(!product||!products.includes(product))product=products[0]||'';
    state={...state,loading:false,workorders,iqc,inventory,purchases,products,product};
    calc();
  }

  async function savePlan(){
    const qty=Math.max(0,num(state.qty));if(!state.product||qty<=0){window.alert('제품명과 샘플/개발 생산계획량을 입력하세요.');return}
    if(!state.mrp.length){window.alert('Recipe/BOM 확인 후 MRP를 계산하세요.');return}
    const row={date:state.date,product:state.product,qty,revision:state.revision,productionType:'샘플·개발',source:'SAMPLE_DEVELOPMENT_LIVE_MRP',savedAt:new Date().toISOString()};
    writeLocal(PLAN_KEY,[row]);
    try{if(typeof window.qmesSyncUpsert==='function')await window.qmesSyncUpsert('inventory','erp:plan',{module:'erp',schema:2,kind:'plan',stage:'샘플·개발',rows:[row],updatedAt:new Date().toISOString()})}catch(error){console.warn('[QMES Sample/Dev MRP] plan sync failed',error)}
    window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'plan',stage:'샘플·개발'}}));
    window.alert('샘플/개발 생산계획을 저장했습니다.');
  }

  function statusHtml(r){return `<span class="smrp-status ${r.tone}">${clean(r.status)}</span>`}
  function render(){
    if(!host)return;
    const options=state.products.map(p=>`<option value="${p.replace(/"/g,'&quot;')}"></option>`).join('');
    const rows=state.mrp.length?state.mrp.map(r=>`<tr><td><b>${clean(r.code)||'-'}</b></td><td><b>${clean(r.name)}</b>${r.generic?'<div style="margin-top:2px;color:#c2410c;font-size:9px">실제 원료명 등록 필요</div>':''}</td><td>${r.ratio.toFixed(3)}%</td><td>${fmt(r.need)}</td><td>${fmt(r.onHand)}</td><td>${fmt(r.reserved)}</td><td>${fmt(r.usable)}</td><td>${fmt(r.incoming)}</td><td>${r.currentShort>0?`<b style="color:#dc2626">${fmt(r.currentShort)}</b>`:'0 kg'}</td><td>${r.expectedShort>0?`<b style="color:#dc2626">${fmt(r.expectedShort)}</b>`:'0 kg'}</td><td>${r.pending||0}건</td><td>${statusHtml(r)}</td></tr>`).join(''):`<tr><td colspan="12" style="text-align:center;color:#94a3b8;padding:28px">${state.loading?'실제 작업지시·IQC·재고 데이터를 불러오는 중입니다.':'제품명과 생산계획량을 입력하면 실제 현황 기준으로 계산합니다.'}</td></tr>`;
    host.innerHTML=`<div class="smrp-head"><div><h1>생산계획 · MRP</h1><div class="smrp-sub">현재 운영단계: <b>샘플 생산 · 개발 진행</b> 전용 · 양산계획은 적용하지 않습니다.</div></div><div class="smrp-actions"><span class="smrp-sync">공용 DB 실제현황</span><button type="button" data-smrp-refresh ${state.loading?'disabled':''}>${state.loading?'불러오는 중':'MRP 재계산'}</button><button type="button" data-smrp-save>계획 저장</button></div></div>
      ${state.error?`<div class="smrp-error">${state.error}</div>`:''}
      <div class="smrp-info">계산 기준: <b>전체 미완료 작업지시 원료계획</b> + <b>IQC 합격 후 재고원장에 입고된 실제 원료재고</b> + <b>생산예정일 이전 구매 입고예정</b> + <b>현재 승인 Recipe/BOM</b>. IQC 검사 전 입고예정은 현재 가용재고로 보지 않고 조건부 수급으로만 표시합니다.</div>
      <div class="smrp-grid2"><section class="smrp-card"><h2>샘플 / 개발 생산계획 입력</h2><div class="smrp-form"><div class="smrp-field"><label>생산예정일</label><input type="date" data-smrp-date value="${state.date}"></div><div class="smrp-field"><label>제품명</label><input data-smrp-product list="smrp-products" value="${clean(state.product).replace(/"/g,'&quot;')}" placeholder="절연슬러리 실제 제품명"><datalist id="smrp-products">${options}</datalist></div><div class="smrp-field"><label>샘플/개발 생산계획량 (kg)</label><input inputmode="decimal" data-smrp-qty value="${clean(state.qty)}" placeholder="0"></div><div class="smrp-field"><label>적용 Recipe Rev.</label><input readonly value="${clean(state.revision)}" title="${clean(state.recipeSource)}"></div></div></section>
      <section class="smrp-card"><h2>계획 판단</h2><div class="smrp-alerts"><div class="smrp-alert blue"><span>현재 생산 가능률</span><b>${state.currentPossible.toFixed(1)}%</b></div><div class="smrp-alert red"><span>현재 부족 원료</span><b>${state.shortageCount} 품목</b></div><div class="smrp-alert orange"><span>입고 반영 후 부족</span><b>${state.expectedShortageCount} 품목</b></div><div class="smrp-alert orange"><span>관련 IQC 검사대기</span><b>${state.pendingIqc} 건</b></div><div class="smrp-alert slate"><span>미완료 작업지시</span><b>${state.activeWoCount} 건</b></div></div></section></div>
      <section class="smrp-table-card"><div class="smrp-table-head"><h2>MRP 소요량 계산</h2><span class="smrp-muted">${state.product||'-'} · 계획 ${fmt(num(state.qty))} · ${state.revision} · ${state.recipeSource}</span></div><div class="smrp-table-wrap"><table><thead><tr><th>원료코드</th><th>실제 원료명</th><th>배합비</th><th>필요량</th><th>IQC 합격 재고</th><th>기존 작업지시 예약</th><th>현재 순가용</th><th>입고예정</th><th>현재 부족</th><th>입고 후 부족</th><th>IQC 대기</th><th>판단</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;

    host.querySelector('[data-smrp-date]')?.addEventListener('change',e=>{state.date=e.target.value||today();calc()});
    host.querySelector('[data-smrp-product]')?.addEventListener('change',e=>{state.product=clean(e.target.value);calc()});
    host.querySelector('[data-smrp-qty]')?.addEventListener('input',e=>{state.qty=e.target.value;calc()});
    host.querySelector('[data-smrp-refresh]')?.addEventListener('click',loadData);
    host.querySelector('[data-smrp-save]')?.addEventListener('click',savePlan);
  }

  function hideUnderlying(m){
    hidden=[];[...m.children].forEach(c=>{if(c===host)return;c.dataset.qmesSampleMrpHidden='1';c.style.setProperty('display','none','important');hidden.push(c)});
  }
  function open(){
    const m=main();if(!m)return;ensureStyle();opened=true;
    if(!host||!host.isConnected){host=document.createElement('div');host.id=HOST;m.prepend(host)}
    hideUnderlying(m);render();loadData();
  }
  function close(){
    opened=false;if(host?.isConnected)host.remove();host=null;
    hidden.forEach(c=>{if(c?.dataset?.qmesSampleMrpHidden==='1'){c.style.removeProperty('display');delete c.dataset.qmesSampleMrpHidden}});hidden=[];
  }
  function labelOf(el){return clean(el?.textContent).replace(/\s+/g,'').replace(/·/g,'·')}
  function isPlanLabel(text){return text==='생산계획·MRP'||text==='생산계획MRP'}

  document.addEventListener('click',e=>{
    if(e.target.closest('#'+HOST))return;
    const ctl=e.target.closest('button,a,[role="button"]');if(!ctl)return;
    const label=labelOf(ctl);
    if(isPlanLabel(label)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();return}
    if(opened&&(ctl.closest('.qmes-top-menu')||ctl.closest('nav')||ctl.closest('aside')))close();
  },true);

  function originalPlanVisible(){
    const m=main();if(!m||host?.isConnected)return false;
    return [...m.querySelectorAll('h1,h2,.qerp-title')].some(el=>isPlanLabel(labelOf(el)));
  }
  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(originalPlanVisible())open();else if(opened&&host?.isConnected){const m=main();if(m)hideUnderlying(m)}})});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('qmes:erp-runtime-loaded',()=>setTimeout(()=>{if(originalPlanVisible())open()},80));
  window.addEventListener('qmes:inventory-reconciled',()=>{if(opened)loadData()});
  setTimeout(()=>{if(originalPlanVisible())open()},500);
})();
