(function(factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else window.qmesMaterialStockCore=api;})(function(){'use strict';
const PREFIX='material-stock:v1:';
const text=v=>String(v??'').trim(),lot=v=>text(v).toUpperCase().replace(/\s+/g,''),day=v=>text(v).slice(0,10);
function number(v){const s=text(v).replace(/,/g,'');if(!s||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
const micro=v=>Math.round(v*1e6),kg=v=>v/1e6;
function material(v){const s=text(v).toUpperCase().replace(/[^A-Z0-9가-힣]/g,'');if(/BYK180/.test(s))return 'BYK180';if(/BOEHMITE|AOH30/.test(s))return 'AOH30';if(/NMP/.test(s))return 'NMP';if(/ADC30|SBR/.test(s))return 'SBR';if(/PVDF/.test(s)&&!/SBS/.test(s))return 'PVDF';if(/SBS/.test(s))return 'SBS';return s;}
function items(row){try{const x=typeof row.items_json==='string'?JSON.parse(row.items_json):row.items_json;return Array.isArray(x)?x:[];}catch(_){return [];}}
function judgment(row){const checks=items(row),values=checks.flatMap(x=>[x?.judge,x?.value,...(Array.isArray(x?.values)?x.values:[]),...(Array.isArray(x?.measurements)?x.measurements:[])]).map(text);if(values.some(v=>/불합격|부적합|미확인|이상있음/.test(v)))return '불합격';if(values.includes('확인중'))return '대기';return text(row.judge)||'대기';}
function readEntries(records){const map=new Map();for(const r of records||[]){if(!text(r.record_key).startsWith(PREFIX))continue;let p=r.payload;if(typeof p==='string')try{p=JSON.parse(p);}catch(_){continue;}const e=p?.entry;if(e?.id&&!map.has(e.id))map.set(e.id,{...e,updatedBy:r.updated_by||e.updatedBy||'',updatedAt:r.updated_at||e.updatedAt||''});}return [...map.values()];}
function validateEntry(input){
 const e={...input,id:text(input.id),material:text(input.material),lot:lot(input.lot),supplier:text(input.supplier),date:day(input.date),note:text(input.note),type:text(input.type),status:text(input.status)};
 if(!e.id||!e.material||!e.lot)throw Error('원료명과 LOT를 입력해 주세요.');
 if(!['retest','sample','loss','adjustment','opening'].includes(e.type)||!['pending','confirmed','cancelled'].includes(e.status))throw Error('수불 구분과 상태를 확인해 주세요.');
 const raw=number(input.quantity);e.quantity=raw;
 if(e.status==='confirmed'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date+'T00:00:00Z'))||new Date(e.date+'T00:00:00Z').toISOString().slice(0,10)!==e.date)throw Error('확인된 사용일 또는 기준일을 입력해 주세요.');
  if(raw===null||(e.type==='opening'?raw<0:raw<=0))throw Error('확인한 수량을 입력해 주세요. 기초재고는 0도 입력할 수 있습니다.');
 }
 if(raw!==null&&raw<0)throw Error('수량은 음수로 입력할 수 없습니다.');
 if(!e.note)throw Error('사용 사유 또는 확인 내용을 입력해 주세요.');
 e.direction=e.type==='adjustment'&&input.direction==='in'?'in':'out';return e;
}
function build({iqc=[],orders=[],actuals=[],entries=[],holds=[],sourceErrors=[]}={}){
 const groups=new Map(),warnings=[...sourceErrors],unallocated=[];
 function group(name,rawLot,supplier=''){
  const key=JSON.stringify([material(name),lot(rawLot),text(supplier)]);
  if(!groups.has(key))groups.set(key,{key,material:text(name)||'원료 미입력',lot:lot(rawLot),supplier:text(supplier),receipts:[],uses:[],manual:[],issues:[],pending:0});
  return groups.get(key);
 }
 const receipts=new Map();
 for(const row of iqc){if(row.deleted)continue;const name=row.item||row.material||row.name,code=row.lot;
  if(!name||!code){warnings.push('원료명 또는 LOT가 없는 수입검사 '+text(row.id));continue;}
  const g=group(name,code,row.supplier),date=day(row.receipt_date||row.receiptDate||row.date);
  const receiptId=row.purchase_receipt_id||row.receipt_id||row.receiptNo||row.receipt_no;
  const key=JSON.stringify([g.key,receiptId||date]);
  if(!receipts.has(key))receipts.set(key,{g,date,rows:[]});receipts.get(key).rows.push(row);
 }
 for(const {g,date,rows} of receipts.values()){
  const ordered=[...rows].sort((a,b)=>text(b.updated_at||b.created_at||b.id).localeCompare(text(a.updated_at||a.created_at||a.id),undefined,{numeric:true}));
  const masses=[...new Set(rows.map(r=>number(r.incoming_qty??r.incomingQty)).filter(n=>n!==null&&n>=0).map(micro))];
  const ambiguous=masses.length!==1;
  const event={kind:'입고',date,qty:ambiguous?null:masses[0],source:'수입검사',id:text(ordered[0].id),judge:judgment(ordered[0]),note:rows.length>1?'동일 입고일 검사 '+rows.length+'건 · 중복 입고 제외':''};
  if(ambiguous)g.issues.push('입고 중량 미확정/검사별 불일치');
  if(rows.length>1)g.issues.push('동일 입고일 중복검사/분할입고 확인 필요');
  g.receipts.push(event);
 }
 function resolve(name,rawLot,supplier=''){
  const code=lot(rawLot),all=[...groups.values()].filter(g=>g.lot===code),matching=all.filter(g=>material(g.material)===material(name));
  const candidates=matching.length?matching:all;
  const scoped=supplier?candidates.filter(g=>g.supplier===text(supplier)):candidates;
  if(scoped.length===1)return scoped[0];
  if(!scoped.length&&!candidates.length)return group(name,code,supplier);
  return null;
 }
 const tracedKeys=new Set(),plans=[];
 const seenOrders=new Set();
 for(const order of orders){if(order.deleted||/취소/.test(text(order.fields?.['진행상태'])))continue;const id=text(order.id||order.fields?.['작업지시번호']);if(!id||seenOrders.has(id))continue;seenOrders.add(id);
  const output=lot(order.fields?.['생산 LOT NO']),date=day(order.workDate||order.fields?.['작업일자']);
  for(const [index,m] of (order.materials||[]).entries()){
   if(m.name==='중간배치')continue;
   const name=m.sourceName||m.name,code=lot(m.lot),actual=number(m.actual),plan=number(m.plan);
   if(!code){if((actual||plan)>0)unallocated.push({source:'작업지시',id,material:name,note:'원료 LOT 미입력 · 수량 미차감'});continue;}
   const g=resolve(name,code);if(!g){unallocated.push({source:'작업지시',id,material:name,lot:code,note:'여러 원료/공급업체와 일치 · 수량 미차감'});continue;}
   if(actual!==null&&actual<0){g.issues.push('실투입량 음수 확인 필요');continue;}
   const key=JSON.stringify([output,code]);
   if(actual!==null){g.uses.push({kind:'생산 투입',date,qty:micro(actual),source:'작업지시',id,output,index});tracedKeys.add(key);}
   if(plan!==null&&plan>0&&!/완료/.test(text(order.fields?.['진행상태'])))plans.push({g,date,qty:micro(Math.max(0,plan-(actual??0))),key});
   if(actual===null&&plan>0&&/완료/.test(text(order.fields?.['진행상태'])))g.issues.push('완료 작업지시 실투입량 미입력');
  }
 }
 const seenActuals=new Set();
 for(const row of actuals){if(row.deleted)continue;const code=lot(row.lotNo),output=lot(row.finishedLot),key=JSON.stringify([output,code]);if(tracedKeys.has(key))continue;
  const identity=text(row.id)||JSON.stringify([day(row.workDate),code,output,row.material,row.inputQty,row.seq,row.inputTime]);if(seenActuals.has(identity))continue;seenActuals.add(identity);
  const qty=number(row.inputQty);if(qty===null||qty<0||!code)continue;
  const g=resolve(row.material,code,row.supName);if(!g){unallocated.push({source:'작업실적',id:identity,lot:code,note:'입고 원료 연결 확인 필요 · 미차감'});continue;}
  g.uses.push({kind:'생산 투입',date:day(row.workDate),qty:micro(qty),source:'작업실적',id:identity,output});
  let applied=micro(qty);for(const planned of plans.filter(p=>p.g===g&&p.key===key)){const amount=Math.min(planned.qty,applied);planned.qty-=amount;applied-=amount;if(!applied)break;}
 }
 for(const e of entries){if(e.status==='cancelled')continue;const g=resolve(e.material,e.lot,e.supplier);if(!g){unallocated.push({source:'수불기록',id:e.id,lot:e.lot,note:'원료 연결 확인 필요'});continue;}g.manual.push(e);}
 const blocked=new Set(holds.filter(h=>!h.released_at&&!h.releasedAt).map(h=>lot(h.lot)));
 const results=[];
 for(const g of groups.values()){
  const openings=g.manual.filter(e=>e.type==='opening'&&e.status==='confirmed'&&number(e.quantity)!==null).sort((a,b)=>day(b.date).localeCompare(day(a.date))||text(b.updatedAt).localeCompare(text(a.updatedAt)));
  const baseline=openings[0],start=baseline?day(baseline.date):'';
  const included=e=>!start||!e.date||e.date>=start;
  const rs=g.receipts.filter(included),uses=g.uses.filter(included),manual=g.manual.filter(e=>e.type!=='opening'&&included(e));
  let balance=baseline?micro(number(baseline.quantity)):0,incoming=0,used=0,sample=0,adjust=0;
  g.pending=g.manual.filter(e=>e.status==='pending'&&included(e)).length;
  const ledger=[];if(baseline)ledger.push({kind:'기초재고',date:start,qty:micro(number(baseline.quantity)),delta:micro(number(baseline.quantity)),source:'수불기록',id:baseline.id,note:baseline.note});
  for(const r of rs){if(r.qty!==null){balance+=r.qty;incoming+=r.qty;}ledger.push({...r,delta:r.qty});}
  for(const r of uses){balance-=r.qty;used+=r.qty;ledger.push({...r,delta:-r.qty});if(!r.date)g.issues.push('투입일 확인 필요');}
  for(const e of manual){const amount=number(e.quantity),pending=e.status!=='confirmed'||amount===null;
   const delta=pending?0:micro(amount)*(e.type==='adjustment'&&e.direction==='in'?1:-1);
   if(!pending){balance+=delta;if(e.type==='adjustment')adjust+=delta;else sample-=delta;}
   ledger.push({kind:{retest:'재검사 사용',sample:'샘플 사용',loss:'손실/폐기',adjustment:'재고 조정'}[e.type]||e.type,date:day(e.date),qty:amount===null?null:micro(amount),delta:pending?null:delta,source:'수불기록',id:e.id,note:e.note,pending});
  }
  const reserved=plans.filter(p=>p.g===g&&included(p)).reduce((s,p)=>s+p.qty,0);
  const quality=rs.some(r=>r.judge!=='합격')?'검사대기/불합격':blocked.has(g.lot)?'품질보류':'사용가능';
  if(!g.receipts.length&&!baseline)g.issues.push('입고 또는 기초재고 미연결');
  if(balance<0)g.issues.push('장부재고 음수 · 입고/사용량 대조 필요');
  const uncertain=g.pending>0||g.issues.length>0||sourceErrors.length>0||unallocated.some(e=>lot(e.lot)===g.lot);
  results.push({...g,opening:baseline?kg(micro(number(baseline.quantity))):0,start,incoming:kg(incoming),used:kg(used),sample:kg(sample),adjust:kg(adjust),balance:kg(balance),reserved:kg(reserved),available:quality==='사용가능'&&!uncertain?kg(Math.max(0,balance)):0,quality,uncertain,issues:[...new Set(g.issues)],ledger:ledger.sort((a,b)=>text(a.date).localeCompare(text(b.date)))});
 }
 return {rows:results.sort((a,b)=>a.material.localeCompare(b.material)||a.lot.localeCompare(b.lot)),warnings:[...new Set(warnings)],unallocated};
}
return {PREFIX,text,lot,day,number,material,readEntries,validateEntry,build};
});
