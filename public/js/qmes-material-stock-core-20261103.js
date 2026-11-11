(function(factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else window.qmesMaterialStockCore=api;})(function(){'use strict';
const PREFIX='material-stock:v1:';
const text=v=>String(v??'').trim(),lot=v=>{const s=text(v).toUpperCase().replace(/\s+/g,'');return /^0*2708935$/.test(s)?'2708935':s;},day=v=>text(v).slice(0,10);
function number(v){const s=text(v).replace(/,/g,'');if(!s||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
const micro=v=>Math.round(v*1e6),kg=v=>v/1e6;
function material(v){const s=text(v).toUpperCase().replace(/[^A-Z0-9가-힣]/g,'');if(/[+＋]/.test(text(v)))return 'MIX:'+s;if(s==='분산제'||/BYK180/.test(s))return 'BYK180';if(/BOEHMITE|AOH30/.test(s))return 'AOH30';if(/NMP/.test(s))return 'NMP';if(/ADC30|SBR/.test(s))return 'SBR';if(/PVDF/.test(s)&&!/SBS/.test(s))return 'PVDF';if(/SBS/.test(s))return 'SBS';return s;}
const supplierKey=v=>text(v).toUpperCase().replace(/주식회사|\(주\)|㈜|\s|[.,-]/g,'');
const displayMaterial=v=>material(v)==='BYK180'?'BYK180 (분산제)':text(v);
function items(row){try{const x=typeof row.items_json==='string'?JSON.parse(row.items_json):row.items_json;return Array.isArray(x)?x:[];}catch(_){return [];}}
function judgment(row){
 const checks=items(row);
 const values=checks.flatMap(x=>[x?.judge,x?.result,x?.status,x?.value,...(Array.isArray(x?.values)?x.values:[]),...(Array.isArray(x?.measurements)?x.measurements:[])]).map(v=>text(v).toUpperCase());
 if(values.some(v=>v.includes('불합격')||v.includes('부적합')||v.includes('미확인')||v==='NG'||v==='FAIL'))return '불합격';
 if(values.includes('확인중'))return '대기';
 if(checks.length&&checks.every(x=>text(x?.judge)==='합격'))return '합격';
 const explicit=text(row.judge);if(explicit)return explicit;
 const master=checks.find(x=>text(x?.name).includes('판정'));
 return text(master?.judge||master?.value)||'대기';
}
function readEntries(records){const map=new Map();for(const r of records||[]){if(!text(r.record_key).startsWith(PREFIX))continue;let p=r.payload;if(typeof p==='string')try{p=JSON.parse(p);}catch(_){continue;}const e=p?.entry;if(e?.id&&!e.deletedAt&&!map.has(e.id))map.set(e.id,{...e,updatedBy:r.updated_by||e.updatedBy||'',updatedAt:r.updated_at||e.updatedAt||''});}return [...map.values()];}
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
  const key=JSON.stringify([material(name),lot(rawLot),supplierKey(supplier)]);
  if(!groups.has(key))groups.set(key,{key,material:displayMaterial(name)||'원료 미입력',lot:lot(rawLot),supplier:text(supplier),receipts:[],uses:[],manual:[],issues:[],notices:[],pending:0});
  return groups.get(key);
 }
 const receipts=new Map(),knownSuppliers=new Map();
 for(const row of iqc){if(row.deleted||!row.item||!row.lot||!text(row.supplier)||/^(미확인|확인필요|알수없음|-|UNKNOWN)$/i.test(text(row.supplier).replace(/\s/g,'')))continue;const key=JSON.stringify([material(row.item),lot(row.lot),text(row.purchase_receipt_id||row.receipt_id||row.receiptNo||row.receipt_no)||day(row.receipt_date||row.receiptDate||row.date)]);if(!knownSuppliers.has(key))knownSuppliers.set(key,new Map());knownSuppliers.get(key).set(supplierKey(row.supplier),text(row.supplier));}
 function supplierFor(row){
  const original=text(row.supplier);if(original&&!/^(미확인|확인필요|알수없음|-|UNKNOWN)$/i.test(original.replace(/\s/g,'')))return {name:original,note:''};
  const known=knownSuppliers.get(JSON.stringify([material(row.item),lot(row.lot),text(row.purchase_receipt_id||row.receipt_id||row.receiptNo||row.receipt_no)||day(row.receipt_date||row.receiptDate||row.date)]));
  if(known?.size===1)return {name:[...known.values()][0],note:'공급업체 원본 미입력 · 동일 원료/LOT/입고일 기록의 공급업체 후보'};
  return {name:'',note:known?.size>1?'공급업체 후보 여러 곳 · 원본 확인 필요':'공급업체 원본 미입력 · 연결 근거 없음'};
 }
 for(const row of iqc){if(row.deleted)continue;const name=row.item||row.material||row.name,code=row.lot;
  if(!name||!code){warnings.push('원료명 또는 LOT가 없는 수입검사 '+text(row.id));continue;}
  const supplier=supplierFor(row),g=group(name,code,supplier.name),date=day(row.receipt_date||row.receiptDate||row.date);
  if(supplier.note){g.notices.push(supplier.note);g.issues.push('공급업체 원본 확인 필요');}
  if(!supplier.name)g.issues.push(supplier.note);
  if(text(name)!==g.material)g.notices.push('원료명 표준화: '+text(name)+' → '+g.material);
  if(text(code)!==g.lot)g.notices.push('LOT 표준화: '+text(code)+' → '+g.lot);
  const receiptId=row.purchase_receipt_id||row.receipt_id||row.receiptNo||row.receipt_no;
  const inspectionId=text(row.id);
  const identity=receiptId?['receipt',text(receiptId)]:inspectionId?['inspection',inspectionId]:['legacy-date',date];
  const key=JSON.stringify([g.key,...identity]);
  if(!receipts.has(key))receipts.set(key,{g,date,rows:[]});receipts.get(key).rows.push(row);
 }
 for(const {g,date,rows} of receipts.values()){
  const ordered=[...rows].sort((a,b)=>{
   const at=Date.parse(a.updated_at||a.updatedAt||a.created_at||a.createdAt||''),bt=Date.parse(b.updated_at||b.updatedAt||b.created_at||b.createdAt||'');
   return Number.isFinite(at)&&Number.isFinite(bt)?bt-at:0;
  });
  const masses=[...new Set(rows.map(r=>number(r.incoming_qty??r.incomingQty)).filter(n=>n!==null&&n>0).map(micro))];
  const ambiguous=masses.length!==1;
  const event={kind:'입고',date,qty:ambiguous?null:masses[0],source:'수입검사',id:text(ordered[0].id),judge:judgment(ordered[0]),note:rows.length>1?'같은 입고 기록 '+rows.length+'건 · 수량 중복 합산 제외':'',originals:rows.map(r=>({id:text(r.id),material:text(r.item||r.material),lot:text(r.lot),supplier:text(r.supplier)||'미입력',quantity:r.incoming_qty??r.incomingQty??null,warehouse:text(r.warehouse_code)}))};
  if(ambiguous)g.issues.push('입고 중량 미확정/검사별 불일치');
  if(rows.length>1&&ambiguous)g.issues.push('같은 입고 기록의 수량 확인 필요');
  g.receipts.push(event);
 }
 const lotFamilies=new Map();for(const g of groups.values()){if(!lotFamilies.has(g.lot))lotFamilies.set(g.lot,new Set());lotFamilies.get(g.lot).add(material(g.material));}
 for(const g of groups.values())if(lotFamilies.get(g.lot)?.size>1)g.issues.push('같은 LOT에 여러 원료명 존재 · 입고 원본 대조 필요');
 function resolve(name,rawLot,supplier=''){
  const code=lot(rawLot),all=[...groups.values()].filter(g=>g.lot===code),matching=all.filter(g=>material(g.material)===material(name));
  if(all.length&&!matching.length){for(const g of all)g.issues.push('동일 LOT의 다른 원료명 연결 거부: '+text(name));return null;}
  const candidates=matching;
  if(candidates.length===1){if(supplier&&supplierKey(candidates[0].supplier)!==supplierKey(supplier))candidates[0].notices.push('투입/수불 업체 표기 '+text(supplier)+' · 공급업체는 수입검사 원본 기준');return candidates[0];}
  const scoped=supplier?candidates.filter(g=>supplierKey(g.supplier)===supplierKey(supplier)):candidates;
  if(scoped.length===1)return scoped[0];
  if(!scoped.length&&!candidates.length)return null;
  return null;
 }
 const tracedKeys=new Set(),plans=[];
 const seenOrders=new Set();
 for(const order of orders){if(order.deleted||/취소/.test(text(order.fields?.['진행상태'])))continue;const id=text(order.id||order.fields?.['작업지시번호']);if(!id||seenOrders.has(id))continue;seenOrders.add(id);
  const output=lot(order.fields?.['생산 LOT NO']),date=day(order.workDate||order.fields?.['작업일자']);
  for(const [index,m] of (order.materials||[]).entries()){
   if(m.name==='중간배치')continue;
   const name=m.sourceName||m.name,code=lot(m.lot),actual=number(m.actual),plan=number(m.plan);
   if(code==='-'){if(actual>0||actual===null&&plan>0)unallocated.push({source:'작업지시',id,material:name,lot:'-',date,output,quantity:actual,note:'LOT 미부여 연구 샘플 · 생산 LOT '+output+' · 실투입 '+(actual===null?'미입력':actual+' kg')+' · 수입검사 입고 근거 없음 · 일반 원료 재고 미차감'});continue;}
   if(!code){if((actual||plan)>0)unallocated.push({source:'작업지시',id,material:name,note:'원료 LOT 미입력 · 수량 미차감'});continue;}
   const g=resolve(name,code);if(!g){unallocated.push({source:'작업지시',id,material:name,lot:code,note:'여러 원료/공급업체와 일치 · 수량 미차감'});continue;}
   if(actual!==null&&actual<0){g.issues.push('실투입량 음수 확인 필요');continue;}
   const key=JSON.stringify([output,code]);
   if(actual!==null){g.uses.push({kind:'생산 투입',date,qty:micro(actual),source:'작업지시',id,documentNo:text(order.fields?.['작업지시번호'])||id,product:text(order.fields?.['제품명']),output,index});tracedKeys.add(key);}
   if(plan!==null&&plan>0&&!/완료/.test(text(order.fields?.['진행상태'])))plans.push({g,date,qty:micro(Math.max(0,plan-(actual??0))),key});
   if(actual===null&&plan>0&&/완료/.test(text(order.fields?.['진행상태'])))g.issues.push('완료 작업지시 실투입량 미입력');
  }
 }
 const seenActuals=new Set();
 for(const row of actuals){if(row.deleted)continue;const code=lot(row.lotNo),output=lot(row.finishedLot),key=JSON.stringify([output,code]);if(tracedKeys.has(key))continue;
  const identity=text(row.id)||JSON.stringify([day(row.workDate),code,output,row.material,row.inputQty,row.seq,row.inputTime]);if(seenActuals.has(identity))continue;seenActuals.add(identity);
  const qty=number(row.inputQty);if(qty===null||qty<0||!code)continue;
  if(code==='-'){if(qty>0)unallocated.push({source:'작업실적',id:identity,material:row.material,lot:'-',output,quantity:qty,note:'LOT 미부여 연구 샘플 · 실투입 '+qty+' kg · 일반 원료 재고 미차감'});continue;}
  const g=resolve(row.material,code,row.supName);if(!g){unallocated.push({source:'작업실적',id:identity,lot:code,note:'입고 원료 연결 확인 필요 · 미차감'});continue;}
  g.uses.push({kind:'생산 투입',date:day(row.workDate),qty:micro(qty),source:'작업실적',id:identity,output});
  let applied=micro(qty);for(const planned of plans.filter(p=>p.g===g&&p.key===key)){const amount=Math.min(planned.qty,applied);planned.qty-=amount;applied-=amount;if(!applied)break;}
 }
 for(const e of entries){if(e.status==='cancelled'||e.deletedAt)continue;const g=resolve(e.material,e.lot,e.supplier);if(!g){unallocated.push({source:'수불기록',id:e.id,lot:e.lot,note:'원료 연결 확인 필요'});continue;}g.manual.push(e);}
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
  if(balance<0)g.issues.push('재고 음수 · 입고/사용량 대조 필요');
  const uncertain=g.pending>0||g.issues.length>0||sourceErrors.length>0||unallocated.some(e=>lot(e.lot)===g.lot);
  results.push({...g,opening:baseline?kg(micro(number(baseline.quantity))):0,start,incoming:kg(incoming),used:kg(used),sample:kg(sample),adjust:kg(adjust),balance:kg(balance),reserved:kg(reserved),available:quality==='사용가능'&&!uncertain?kg(Math.max(0,balance)):0,quality,uncertain,issues:[...new Set(g.issues)],notices:[...new Set(g.notices)],ledger:ledger.sort((a,b)=>text(a.date).localeCompare(text(b.date)))});
 }
 return {rows:results.sort((a,b)=>a.material.localeCompare(b.material)||a.lot.localeCompare(b.lot)),warnings:[...new Set(warnings)],unallocated};
}
function warehouseInfo(row){
 const originals=(row.receipts||[]).flatMap(receipt=>receipt.originals||[]);
 const receipts=row.receipts||[];
 const codes=new Set(),unassigned=[];
 for(const receipt of receipts){
  const reported=new Set((receipt.originals||[]).map(record=>text(record.warehouse).toUpperCase()).filter(Boolean));
  if(reported.size!==1)unassigned.push(receipt.date||'입고일 미확인');
  for(const code of reported)codes.add(code);
 }
 const names=new Set(originals.map(receipt=>text(receipt.material).toUpperCase().replace(/\s+/g,' ')));
 const dates=(row.receipts||[]).map(receipt=>receipt.date).sort();
 return {
  unassigned,
  conflicting:codes.size>1,
  code:!unassigned.length&&codes.size===1&&/^[A-Z0-9][A-Z0-9_-]{0,29}$/.test([...codes][0])?[...codes][0]:'',
  item:names.size===1?[...names][0]:'',
  first:dates.length&&dates.every(date=>/^\d{4}-\d{2}-\d{2}$/.test(date))?dates[0]:'',
  last:dates.at(-1)||''
 };
}
function fifoCheck(model, scannedLot, warehouse){
 const code=text(warehouse).toUpperCase(), target=lot(scannedLot);
 if(!target||target==='-'||!code)return {state:'unavailable',reason:'창고코드와 원료 LOT를 입력해 주세요.'};
 if(model.warnings.length)return {state:'unavailable',reason:'재고 조회 실패 · '+model.warnings.slice(0,2).join(' / ')};
 const matches=model.rows.filter(row=>lot(row.lot)===target);
 if(matches.length!==1)return {state:'unavailable',reason:matches.length?'같은 LOT의 원료 또는 공급업체가 여러 건입니다.':'재고에서 원료 LOT를 찾지 못했습니다.'};
 const selected=matches[0],info=warehouseInfo(selected);
 const missing=(row,location)=>[
  !location.code?(location.conflicting?'입고 기록의 창고코드가 서로 다름':location.unassigned.length?'창고 미지정 입고일 '+[...new Set(location.unassigned)].slice(0,3).join(', '):'입고 창고 확인'):location.code!==code?'등록 창고 '+location.code:null,
  !location.item?'원료 규격 확인':null,
  !location.first?'입고일 확인':null,
  row.start?'기초재고의 입고 이력 확인':null,
  row.uncertain?'잔량 확인':null
 ].filter(Boolean);
 const selectedIssues=missing(selected,info);
 if(selectedIssues.length)return {state:'unavailable',reason:selected.lot+' · '+selectedIssues.join(', ')};
 const candidates=model.rows.filter(row=>row!==selected&&lot(row.lot)!==target&&material(row.material)===material(selected.material));
 const alternatives=[];
 const unresolved=[];
 for(const row of candidates){
  const candidate=warehouseInfo(row);
  if(candidate.code&&candidate.code!==code)continue;
  if(row.available>0&&candidate.code===code&&candidate.item===info.item&&candidate.first&&candidate.last<info.first&&!row.start){
   alternatives.push({lot:row.lot,supplier:row.supplier,available:row.available,received:candidate.last});
  }else if((row.available>0||row.uncertain)&&(!candidate.item||candidate.item===info.item)&&(!candidate.first||candidate.first<info.first)&&(!candidate.code||!candidate.first||row.start||row.uncertain)){
   unresolved.push(row.lot+' · '+missing(row,candidate).join(', '));
  }
 }
 alternatives.sort((a,b)=>a.received.localeCompare(b.received)||a.lot.localeCompare(b.lot));
 if(alternatives.length)return {state:'warning',alternatives};
 return unresolved.length?{state:'unavailable',reason:'확인할 LOT '+unresolved.slice(0,3).join(' / ')+(unresolved.length>3?' 외 '+(unresolved.length-3)+'건':'')}:{state:'clear'};
}
function fifoMaterial(value){
 const name=text(value).toUpperCase();
 if(/^PAI(?=$|[\s#(0-9-])|^바인더\s*\(\s*PAI\s*\)/.test(name))return 'PAI';
 return material(value);
}
function isFifoReceipt(row){
 return text(row.warehouse_code).toUpperCase()!=='TEST-1';
}
function materialFifoCheck(model, scannedLot, rawMaterial){
 const target=lot(scannedLot), selectedMaterial=fifoMaterial(rawMaterial);
 if(!target||target==='-'||!selectedMaterial)return {state:'unavailable',reason:'원재료명과 원료 LOT를 선택해 주세요.'};
 if(model.warnings.length)return {state:'unavailable',reason:'재고 조회 실패 · '+model.warnings.slice(0,2).join(' / ')};
 const rows=model.rows.filter(row=>fifoMaterial(row.material)===selectedMaterial);
 const matches=rows.filter(row=>lot(row.lot)===target);
 if(matches.length!==1)return {state:'unavailable',reason:matches.length?'같은 원료 LOT에 공급업체가 여러 곳입니다.':'선택한 원료에서 LOT를 찾지 못했습니다.'};
 const selected=matches[0], info=warehouseInfo(selected);
 if(!info.item||!info.first||selected.start||selected.uncertain)return {state:'unavailable',reason:selected.lot+' · 원료 규격, 입고일 또는 재고 이력을 확인해 주세요.'};
 const alternatives=[], unresolved=[];
 for(const row of rows){
  if(row===selected)continue;
  const candidate=warehouseInfo(row);
  if(candidate.item&&candidate.item!==info.item)continue;
  if(candidate.first&&candidate.first>=info.first)continue;
  if(row.available>0&&candidate.item===info.item&&candidate.last<info.first&&!row.start){
   alternatives.push({lot:row.lot,supplier:row.supplier,available:row.available,received:candidate.last});
  }else if((row.available>0||row.uncertain)&&(!candidate.item||!candidate.first||row.start||row.uncertain||candidate.last>=info.first)){
   unresolved.push(row.lot);
  }
 }
 alternatives.sort((a,b)=>a.received.localeCompare(b.received)||a.lot.localeCompare(b.lot));
 if(alternatives.length)return {state:'warning',alternatives};
 return unresolved.length?{state:'unavailable',reason:'입고일 또는 재고 이력을 확인할 LOT '+unresolved.slice(0,3).join(' / ')+(unresolved.length>3?' 외 '+(unresolved.length-3)+'건':'')}:{state:'clear'};
}
return {PREFIX,text,lot,day,number,material,supplierKey,judgment,readEntries,validateEntry,build,warehouseInfo,fifoCheck,materialFifoCheck,fifoMaterial,isFifoReceipt};
});
