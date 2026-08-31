/* NAMO QMES - Live Production Plan / MRP V2 - 2026-08-31
 * Production types: Sample / Development / Mass Production.
 * No demo quantities. Uses live work-order, IQC, inventory, purchase and Recipe/BOM data.
 * Mass Production requires a current active Recipe/BOM; Sample/Development may fall back
 * to the latest real work-order material plan when an active Recipe/BOM is not yet registered.
 */
(function(){
  'use strict';
  if(window.__QMES_LIVE_PRODUCTION_MRP_20260831_V2__)return;
  window.__QMES_LIVE_PRODUCTION_MRP_20260831_V2__=true;

  const HOST='qmes-live-production-mrp-v2';
  const STYLE='qmes-live-production-mrp-v2-style';
  const PLAN_KEY='qmes-erp-plan-v1';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/,/g,''));return Number.isFinite(n)?n:0};
  const norm=v=>clean(v).toUpperCase().replace(/[^A-Z0-9가-힣]/g,'');
  const today=()=>new Date().toISOString().slice(0,10);
  const fmt=v=>`${Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:3})} kg`;
  const first=(o,keys)=>{for(const k of keys){const v=o?.[k];if(v!==undefined&&v!==null&&clean(v)!=='')return v}return ''};
  const payload=rec=>{const p=rec?.payload;if(p&&typeof p==='object')return p;if(typeof p==='string'){try{return JSON.parse(p)}catch(_){}}return {}};
  const complete=v=>/완료|생산완료|COMPLETED|COMPLETE|DONE|취소|CANCEL|폐기/i.test(clean(v));
  const pass=v=>/^(합격|적합|PASS|OK|APPROVED|완료)$/i.test(clean(v));
  const fail=v=>/불합격|부적합|FAIL|NG|REJECT/i.test(clean(v));
  const generic=v=>/^(첨가제|원료|기타|ADDITIVE)$/i.test(clean(v));

  let host=null,hidden=[],opened=false,loading=false;
  let state={productionType:'샘플',date:today(),product:'',qty:'',products:[],workorders:[],iqcRecords:[],inventoryRecords:[],purchases:[],mrp:[],revision:'-',recipeSource:'-',recipeOfficial:false,error:'',currentPossible:0,currentShortage:0,afterIncomingShortage:0,pendingIqc:0,activeWoCount:0};

  function main(){return document.querySelector('#root main')||document.querySelector('main')}
  function readLocal(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v}catch(_){return fallback}}
  function writeLocal(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(_){}}
  async function syncList(type){try{return typeof window.qmesSyncList==='function'?(await window.qmesSyncList(type)||[]):[]}catch(e){console.warn('[QMES MRP]',type,e);return []}}

  function ensureStyle(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      #${HOST}{color:#172033;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif;padding-bottom:22px}#${HOST} *{box-sizing:border-box}
      #${HOST} .mrp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}#${HOST} h1{margin:0;font-size:23px;font-weight:950;letter-spacing:-.4px}#${HOST} .mrp-sub{margin-top:5px;color:#64748b;font-size:12px;font-weight:650}
      #${HOST} .mrp-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}#${HOST} .sync{display:inline-flex;border:1px solid #bbf7d0;background:#ecfdf3;color:#15803d;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900}
      #${HOST} button{border:0;border-radius:8px;background:#2563eb;color:#fff;padding:9px 13px;font-size:11px;font-weight:900;cursor:pointer}#${HOST} button:disabled{opacity:.55;cursor:wait}
      #${HOST} .info{margin-bottom:12px;padding:9px 10px;border:1px dashed #cbd5e1;border-radius:8px;background:#f8fafc;color:#64748b;font-size:10.5px;font-weight:700;line-height:1.65}
      #${HOST} .error{margin-bottom:12px;padding:10px;border-radius:8px;background:#fff1f2;color:#b91c1c;font-size:11px;font-weight:850}
      #${HOST} .grid2{display:grid;grid-template-columns:1.38fr .76fr;gap:13px;margin-bottom:13px}#${HOST} .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:15px;box-shadow:0 8px 24px rgba(15,23,42,.045)}#${HOST} .card h2{margin:0 0 11px;font-size:15px;font-weight:950}
      #${HOST} .form{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}#${HOST} .field label{display:block;margin-bottom:5px;color:#475569;font-size:10px;font-weight:850}#${HOST} input,#${HOST} select{width:100%;height:36px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#111827;padding:0 8px;font-size:12px;outline:none}#${HOST} input[readonly]{background:#f8fafc;color:#475569;font-weight:800}#${HOST} input:focus,#${HOST} select:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.14)}
      #${HOST} .alerts{display:grid;gap:8px}#${HOST} .alert{display:flex;justify-content:space-between;gap:12px;padding:9px 10px;border-radius:8px;font-size:10.5px;font-weight:850}#${HOST} .blue{background:#eff6ff;color:#1e40af}#${HOST} .red{background:#fff1f2;color:#9f1239}#${HOST} .orange{background:#fff7ed;color:#9a3412}#${HOST} .green{background:#ecfdf3;color:#166534}#${HOST} .slate{background:#f1f5f9;color:#475569}
      #${HOST} .table-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,.045);overflow:hidden}#${HOST} .table-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px 9px}#${HOST} .table-head h2{margin:0;font-size:15px;font-weight:950}#${HOST} .muted{font-size:10px;color:#64748b;font-weight:800}#${HOST} .table-wrap{overflow:auto;padding:0 12px 8px}
      #${HOST} table{width:100%;border-collapse:collapse;font-size:11px}#${HOST} th{background:#f8fafc;color:#475569;text-align:left;padding:8px;border-bottom:1px solid #dbe3ec;font-size:9.5px;font-weight:900;white-space:nowrap}#${HOST} td{padding:9px 8px;border-bottom:1px solid #edf2f7;white-space:nowrap;color:#334155}#${HOST} tr:last-child td{border-bottom:0}
      #${HOST} .status{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900}#${HOST} .status.green{background:#dcfce7;color:#15803d}#${HOST} .status.orange{background:#ffedd5;color:#c2410c}#${HOST} .status.red{background:#fee2e2;color:#b91c1c}#${HOST} .status.slate{background:#f1f5f9;color:#475569}
      @media(max-width:1250px){#${HOST} .grid2{grid-template-columns:1fr}#${HOST} .form{grid-template-columns:repeat(3,1fr)}}@media(max-width:760px){#${HOST} .form{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){#${HOST} .mrp-head{flex-direction:column}#${HOST} .mrp-actions{justify-content:flex-start}#${HOST} .form{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function materialRows(doc){for(const p of [doc?.materials,doc?.materialRows,doc?.recipeMaterials,doc?.rawMaterials,doc?.ingredients,doc?.inputs])if(Array.isArray(p))return p;return []}
  function allWorkorders(records){
    const out=[];
    (records||[]).forEach(rec=>{const p=payload(rec),doc=p.doc||{},batch=p.batch||{};out.push({recordKey:rec.record_key,doc,batch,wo:clean(p.lotNo||batch.lot||batch.workOrder||doc.workOrder||rec.record_key),state:first(batch,['status','state','progress'])||first(doc,['status','state','progress']),date:first(batch,['date','prodDate','productionDate'])||first(doc,['date','prodDate','productionDate'])})});
    try{Object.entries(window.DB?.woDocs||{}).forEach(([wo,doc])=>{if(!out.some(x=>x.wo===wo))out.push({recordKey:wo,doc:doc||{},batch:{},wo,state:first(doc,['status','state','progress']),date:first(doc,['date','prodDate','productionDate'])})})}catch(_){ }
    return out;
  }
  const activeWorkorders=records=>allWorkorders(records).filter(w=>!complete(w.state));
  const workorderProduct=w=>clean(first(w.batch,['item','product','itemName','productName'])||first(w.doc,['item','product','itemName','productName']));

  function productsFromLive(workorders){
    const set=new Set();
    workorders.forEach(w=>{const p=workorderProduct(w);if(p)set.add(p)});
    try{(window.DB?.batches||[]).forEach(b=>{const p=clean(b?.item||b?.product||b?.productName);if(p)set.add(p)})}catch(_){ }
    try{window.qmesItemMaster?.list?.({type:'제품'})?.forEach(x=>{if(clean(x?.name))set.add(clean(x.name))})}catch(_){ }
    try{window.qmesItemMaster?.list?.({type:'중간재'})?.forEach(x=>{if(clean(x?.name))set.add(clean(x.name))})}catch(_){ }
    return [...set].sort((a,b)=>a.localeCompare(b,'ko'));
  }

  function officialRecipe(product){
    try{const r=window.qmesRecipeMaster?.getActive?.(product);if(r&&r.active!==false&&Array.isArray(r.materials)&&r.materials.length)return {official:true,revision:clean(r.version||r.revision)||'현재 승인',source:'현재 승인 Recipe/BOM',materials:r.materials.map(m=>({code:clean(m.code),name:clean(m.name),ratio:num(m.ratio),unit:clean(m.unit)||'kg'})).filter(m=>m.name&&m.ratio>0)}}catch(_){ }
    try{const list=Object.values(window.DB?.recipeMaster||{}).filter(r=>r&&r.active!==false&&(norm(r.productName)===norm(product)||norm(r.productCode)===norm(product))).sort((a,b)=>clean(b.version).localeCompare(clean(a.version),undefined,{numeric:true}));const r=list[0];if(r&&Array.isArray(r.materials)&&r.materials.length)return {official:true,revision:clean(r.version||r.revision)||'현재 승인',source:'현재 승인 Recipe/BOM',materials:r.materials.map(m=>({code:clean(m.code),name:clean(m.name),ratio:num(m.ratio),unit:clean(m.unit)||'kg'})).filter(m=>m.name&&m.ratio>0)}}catch(_){ }
    return null;
  }

  function workorderRecipe(product,workorders){
    const matches=workorders.filter(w=>norm(workorderProduct(w))===norm(product)&&materialRows(w.doc).length).sort((a,b)=>clean(b.date).localeCompare(clean(a.date)));
    const w=matches[0];if(!w)return null;
    const mats=materialRows(w.doc).map(r=>({code:clean(first(r,['code','itemCode','materialCode'])),name:clean(first(r,['name','material','materialName','item','itemName'])),qty:num(first(r,['planQty','plannedQty','requiredQty','qty','quantity','std','소요량','계획량'])),unit:clean(first(r,['unit','uom']))||'kg'})).filter(r=>r.name&&r.qty>0);
    const sum=mats.reduce((s,r)=>s+r.qty,0);if(!(sum>0))return null;
    return {official:false,revision:clean(first(w.doc,['recipeRevision','recipeRev','revision','recipeVersion']))||clean(first(w.batch,['recipeRevision','recipeRev','revision','recipeVersion']))||`WO ${w.wo}`,source:`최근 작업지시 ${w.wo} 기준`,materials:mats.map(m=>({...m,ratio:m.qty/sum*100}))};
  }

  function recipeFor(product,workorders,type){
    const official=officialRecipe(product);if(official)return official;
    if(type==='양산')return null;
    return workorderRecipe(product,workorders);
  }

  function materialMatch(row,mat){
    const keys=[mat.code,mat.name].map(norm).filter(Boolean),vals=[first(row,['item_code','itemCode','materialCode','code']),first(row,['item_name','itemName','materialName','material','name','원료명'])].map(norm).filter(Boolean);
    return keys.some(k=>vals.includes(k));
  }

  function onHand(records,mat){
    let total=0;
    (records||[]).forEach(rec=>{const p=payload(rec);if(p?.kind!=='transaction')return;const tx=p.transaction||{};if(!materialMatch(tx,mat))return;const cat=clean(tx.category).toUpperCase();if(cat&&cat!=='RM'&&cat!=='PM')return;const q=Math.max(0,num(tx.quantity)),type=clean(tx.transaction_type).toUpperCase();if(/RECEIPT|RETURN|ADJUSTMENT_IN/.test(type))total+=q;else if(/PRODUCTION_ISSUE|ISSUE|SCRAP|ADJUSTMENT_OUT/.test(type))total-=q});
    return Math.max(0,total);
  }

  function reserved(workorders,mat){
    let total=0;
    workorders.forEach(w=>materialRows(w.doc).forEach(r=>{const probe={itemCode:first(r,['code','itemCode','materialCode']),itemName:first(r,['name','material','materialName','item','itemName'])};if(materialMatch(probe,mat))total+=Math.max(0,num(first(r,['planQty','plannedQty','requiredQty','qty','quantity','std','소요량','계획량'])))}));
    return total;
  }

  function iqcRows(records){const out=[];(records||[]).forEach(rec=>{const p=payload(rec);(Array.isArray(p.rows)?p.rows:[]).forEach(r=>out.push(r))});try{for(const pool of [window.DB?.iqc,window.DB?.insp?.IQC,window.DB?.iqcRecords])if(Array.isArray(pool))pool.forEach(r=>out.push(r))}catch(_){ }return out}
  function pendingIqc(rows,mat){return rows.filter(r=>materialMatch({itemCode:first(r,['itemCode','code','materialCode']),itemName:first(r,['name','material','materialName','item','itemName'])},mat)).filter(r=>{const j=first(r,['judge','judgment','result','inspectionResult','status']);return !pass(j)&&!fail(j)}).length}

  function purchaseRows(records){
    let rows=[];(records||[]).forEach(rec=>{if(clean(rec?.record_key)!=='erp:purchase')return;const p=payload(rec);if(Array.isArray(p.rows))rows=p.rows});
    if(!rows.length){const local=readLocal('qmes-erp-purchase-v1',[]);if(Array.isArray(local))rows=local}
    return rows.filter(r=>!(clean(r?.id)==='PO-260824-01'&&/Supplier A/i.test(clean(r?.supplier)))&&!(clean(r?.id)==='PO-260824-02'&&/Supplier B/i.test(clean(r?.supplier))));
  }
  function incomingBefore(rows,mat,date){
    let qty=0,count=0;rows.forEach(r=>{if(!materialMatch({itemCode:first(r,['itemCode','code','materialCode']),itemName:first(r,['material','materialName','item','itemName'])},mat))return;const status=clean(r?.status),iqc=clean(r?.iqc);if(/취소|완료|입고완료/i.test(status)||pass(iqc)||fail(iqc))return;const d=clean(r?.expected||r?.expectedDate||r?.due||r?.dueDate);if(date&&d&&d>date)return;const q=Math.max(0,num(r?.qty??r?.quantity));if(q>0){qty+=q;count++}});return {qty,count};
  }

  function calculate(){
    const qty=Math.max(0,num(state.qty)),all=allWorkorders(state.workorders),active=activeWorkorders(state.workorders),recipe=recipeFor(state.product,all,state.productionType),iqc=iqcRows(state.iqcRecords);
    if(!state.product||qty<=0){state={...state,mrp:[],revision:recipe?.revision||'-',recipeSource:recipe?.source||'-',recipeOfficial:!!recipe?.official,error:'',currentPossible:0,currentShortage:0,afterIncomingShortage:0,pendingIqc:0,activeWoCount:active.length};render();return}
    if(!recipe){
      const msg=state.productionType==='양산'?'양산 생산계획은 현재 승인된 Recipe/BOM이 반드시 필요합니다. Recipe/BOM 승인 후 다시 계산하세요.':'선택 제품의 Recipe/BOM 또는 실제 작업지시 원료계획을 찾을 수 없습니다.';
      state={...state,mrp:[],revision:'미등록',recipeSource:'-',recipeOfficial:false,error:msg,currentPossible:0,currentShortage:0,afterIncomingShortage:0,pendingIqc:0,activeWoCount:active.length};render();return;
    }
    const totalRatio=recipe.materials.reduce((s,m)=>s+Math.max(0,num(m.ratio)),0)||100;let pendingTotal=0;
    const mrp=recipe.materials.map(mat=>{
      const need=qty*Math.max(0,num(mat.ratio))/totalRatio,stock=onHand(state.inventoryRecords,mat),hold=reserved(active,mat),usable=Math.max(0,stock-hold),inc=incomingBefore(state.purchases,mat,state.date),curShort=Math.max(0,need-usable),afterShort=Math.max(0,need-usable-inc.qty),pending=pendingIqc(iqc,mat);pendingTotal+=pending;
      let status='충족',tone='green';if(generic(mat.name)){status='실제 원료명 확인';tone='orange'}else if(afterShort>0){status='부족 / 발주 검토';tone='red'}else if(curShort>0){status='입고 조건부';tone='orange'}else if(pending>0){status='IQC 대기 확인';tone='orange'}
      return {...mat,need,stock,reserved:hold,usable,incoming:inc.qty,currentShort:curShort,afterShort,pending,status,tone};
    });
    const totalNeed=mrp.reduce((s,r)=>s+r.need,0),totalCurShort=mrp.reduce((s,r)=>s+r.currentShort,0),possible=totalNeed?Math.max(0,Math.min(100,(totalNeed-totalCurShort)/totalNeed*100)):0;
    state={...state,mrp,revision:recipe.revision||'-',recipeSource:recipe.source||'-',recipeOfficial:!!recipe.official,error:'',currentPossible:possible,currentShortage:mrp.filter(r=>r.currentShort>0).length,afterIncomingShortage:mrp.filter(r=>r.afterShort>0).length,pendingIqc:pendingTotal,activeWoCount:active.length};render();
  }

  async function loadData(){
    if(loading)return;loading=true;render();
    try{if(typeof window.qmesReconcileInventory==='function')await window.qmesReconcileInventory()}catch(_){ }
    const [workorders,iqc,inventory]=await Promise.all([syncList('workorder'),syncList('iqc'),syncList('inventory')]);
    const products=productsFromLive(allWorkorders(workorders)),purchases=purchaseRows(inventory);let product=state.product;if(!product||!products.includes(product))product=products[0]||'';
    state={...state,workorders,iqcRecords:iqc,inventoryRecords:inventory,purchases,products,product};loading=false;calculate();
  }

  async function savePlan(){
    const qty=Math.max(0,num(state.qty));if(!state.product||qty<=0){window.alert('제품명과 생산계획량을 입력하세요.');return}if(!state.mrp.length){window.alert('Recipe/BOM 확인 후 MRP를 계산하세요.');return}if(state.productionType==='양산'&&!state.recipeOfficial){window.alert('양산은 승인된 현재 Recipe/BOM으로만 저장할 수 있습니다.');return}
    const row={date:state.date,product:state.product,qty,revision:state.revision,productionType:state.productionType,source:'LIVE_PRODUCTION_MRP_V2',savedAt:new Date().toISOString()};
    writeLocal(PLAN_KEY,[row]);
    try{if(typeof window.qmesSyncUpsert==='function')await window.qmesSyncUpsert('inventory','erp:plan',{module:'erp',schema:3,kind:'plan',stage:state.productionType,rows:[row],updatedAt:new Date().toISOString()})}catch(e){console.warn('[QMES MRP] plan sync',e)}
    window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'plan',stage:state.productionType}}));window.alert(`${state.productionType} 생산계획을 저장했습니다.`);
  }

  function esc(v){return clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function render(){
    if(!host)return;const options=state.products.map(p=>`<option value="${esc(p)}"></option>`).join('');
    const rows=state.mrp.length?state.mrp.map(r=>`<tr><td><b>${esc(r.code)||'-'}</b></td><td><b>${esc(r.name)}</b>${generic(r.name)?'<div style="margin-top:2px;color:#c2410c;font-size:9px">실제 원료명 등록 필요</div>':''}</td><td>${num(r.ratio).toFixed(3)}%</td><td>${fmt(r.need)}</td><td>${fmt(r.stock)}</td><td>${fmt(r.reserved)}</td><td>${fmt(r.usable)}</td><td>${fmt(r.incoming)}</td><td>${r.currentShort>0?`<b style="color:#dc2626">${fmt(r.currentShort)}</b>`:'0 kg'}</td><td>${r.afterShort>0?`<b style="color:#dc2626">${fmt(r.afterShort)}</b>`:'0 kg'}</td><td>${r.pending}건</td><td><span class="status ${r.tone}">${esc(r.status)}</span></td></tr>`).join(''):`<tr><td colspan="12" style="text-align:center;color:#94a3b8;padding:28px">${loading?'실제 작업지시·IQC·재고 데이터를 불러오는 중입니다.':'생산구분·제품명·생산계획량을 입력하면 실제 현황 기준으로 계산합니다.'}</td></tr>`;
    host.innerHTML=`<div class="mrp-head"><div><h1>생산계획 · MRP</h1><div class="mrp-sub">생산구분: <b>샘플 · 개발 · 양산</b> / 실제 작업지시·IQC·재고·입고예정·Recipe/BOM 연계</div></div><div class="mrp-actions"><span class="sync">공용 DB 실제현황</span><button data-refresh ${loading?'disabled':''}>${loading?'불러오는 중':'MRP 재계산'}</button><button data-save>계획 저장</button></div></div>${state.error?`<div class="error">${esc(state.error)}</div>`:''}<div class="info">현재 가용재고는 <b>IQC 합격 후 재고원장에 입고된 원료</b>에서 <b>전체 미완료 작업지시 예약량</b>을 차감해 계산합니다. 입고예정은 현재재고에 포함하지 않고 생산예정일까지의 조건부 수급으로 별도 표시합니다. <b>양산은 현재 승인 Recipe/BOM이 없으면 계획 저장을 차단합니다.</b></div>
      <div class="grid2"><section class="card"><h2>생산계획 입력</h2><div class="form"><div class="field"><label>생산구분</label><select data-type><option value="샘플" ${state.productionType==='샘플'?'selected':''}>샘플</option><option value="개발" ${state.productionType==='개발'?'selected':''}>개발</option><option value="양산" ${state.productionType==='양산'?'selected':''}>양산</option></select></div><div class="field"><label>생산예정일</label><input type="date" data-date value="${esc(state.date)}"></div><div class="field"><label>제품명</label><input data-product list="mrp-live-products" value="${esc(state.product)}" placeholder="절연슬러리 실제 제품명"><datalist id="mrp-live-products">${options}</datalist></div><div class="field"><label>생산계획량 (kg)</label><input inputmode="decimal" data-qty value="${esc(state.qty)}" placeholder="0"></div><div class="field"><label>적용 Recipe Rev.</label><input readonly value="${esc(state.revision)}" title="${esc(state.recipeSource)}"></div></div></section>
      <section class="card"><h2>계획 판단</h2><div class="alerts"><div class="alert blue"><span>현재 생산 가능률</span><b>${state.currentPossible.toFixed(1)}%</b></div><div class="alert red"><span>현재 부족 원료</span><b>${state.currentShortage} 품목</b></div><div class="alert orange"><span>입고 반영 후 부족</span><b>${state.afterIncomingShortage} 품목</b></div><div class="alert orange"><span>관련 IQC 검사대기</span><b>${state.pendingIqc} 건</b></div><div class="alert slate"><span>미완료 작업지시</span><b>${state.activeWoCount} 건</b></div></div></section></div>
      <section class="table-card"><div class="table-head"><h2>MRP 소요량 계산</h2><span class="muted">${esc(state.productionType)} · ${esc(state.product)||'-'} · 계획 ${fmt(num(state.qty))} · ${esc(state.revision)} · ${esc(state.recipeSource)}</span></div><div class="table-wrap"><table><thead><tr><th>원료코드</th><th>실제 원료명</th><th>배합비</th><th>필요량</th><th>IQC 합격 재고</th><th>기존 작업지시 예약</th><th>현재 순가용</th><th>입고예정</th><th>현재 부족</th><th>입고 후 부족</th><th>IQC 대기</th><th>판단</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
    host.querySelector('[data-type]')?.addEventListener('change',e=>{state.productionType=e.target.value;calculate()});host.querySelector('[data-date]')?.addEventListener('change',e=>{state.date=e.target.value||today();calculate()});host.querySelector('[data-product]')?.addEventListener('change',e=>{state.product=clean(e.target.value);calculate()});host.querySelector('[data-qty]')?.addEventListener('input',e=>{state.qty=e.target.value;calculate()});host.querySelector('[data-refresh]')?.addEventListener('click',loadData);host.querySelector('[data-save]')?.addEventListener('click',savePlan);
  }

  function hideBase(m){hidden=[];[...m.children].forEach(c=>{if(c===host)return;c.dataset.qmesMrpHidden='1';c.style.setProperty('display','none','important');hidden.push(c)})}
  function open(){const m=main();if(!m)return;ensureStyle();opened=true;if(!host||!host.isConnected){host=document.createElement('div');host.id=HOST;m.prepend(host)}hideBase(m);render();loadData()}
  function close(){opened=false;if(host?.isConnected)host.remove();host=null;hidden.forEach(c=>{if(c?.dataset?.qmesMrpHidden==='1'){c.style.removeProperty('display');delete c.dataset.qmesMrpHidden}});hidden=[]}
  const label=el=>clean(el?.textContent).replace(/\s+/g,'');
  const isPlan=t=>t==='생산계획·MRP'||t==='생산계획MRP';
  document.addEventListener('click',e=>{if(e.target.closest('#'+HOST))return;const ctl=e.target.closest('button,a,[role="button"]');if(!ctl)return;if(isPlan(label(ctl))){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();return}if(opened&&(ctl.closest('.qmes-top-menu')||ctl.closest('nav')||ctl.closest('aside')))close()},true);
  function basePlanVisible(){const m=main();if(!m||host?.isConnected)return false;return [...m.querySelectorAll('h1,h2,.qerp-title')].some(el=>isPlan(label(el)))}
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(basePlanVisible())open();else if(opened&&host?.isConnected){const m=main();if(m)hideBase(m)}})});observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('qmes:erp-runtime-loaded',()=>setTimeout(()=>{if(basePlanVisible())open()},80));window.addEventListener('qmes:inventory-reconciled',()=>{if(opened)loadData()});setTimeout(()=>{if(basePlanVisible())open()},500);
})();
