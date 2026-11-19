(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.qmesSemiStockCore=factory();})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const PREFIX='semi-stock:v1:',text=v=>String(v??'').trim(),key=v=>text(v).normalize('NFKC').toUpperCase().replace(/\s+/g,''),lot=v=>key(v).replace(/^MB-/,'MB');
const material=v=>{const s=key(v).replace(/[^A-Z0-9가-힣]/g,'');if(/PVDF/.test(s))return 'PVDF';if(/SBS/.test(s))return 'SBS';if(/SBR/.test(s))return 'SBR';return s;};
function number(v){const s=text(v).replace(/,/g,'');if(!s||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
const micro=v=>Math.round(v*1e6),kg=v=>v/1e6;
const labels={use:'사용',sample:'샘플 사용',loss:'폐기·손실',adjustmentIn:'재고 증가 조정',adjustmentOut:'재고 차감 조정'};
function readEntries(records){const out=new Map();for(const row of records||[]){if(!text(row.record_key).startsWith(PREFIX))continue;let p=row.payload;if(typeof p==='string')try{p=JSON.parse(p)}catch(_){continue}const e=p?.entry;if(p?.module==='semiStock'&&e?.id&&row.record_key===PREFIX+e.id&&!out.has(e.id))out.set(e.id,e);}return [...out.values()];}
function validate(e){if(!text(e.id)||!text(e.stockKey)||!text(e.product))return '반제품을 선택해 주세요.';if(!labels[e.type])return '사용 구분을 확인해 주세요.';if(!['confirmed','cancelled'].includes(e.status))return '기록 상태를 확인해 주세요.';if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date+'T00:00:00Z'))||new Date(e.date+'T00:00:00Z').toISOString().slice(0,10)!==e.date)return '올바른 일자를 입력해 주세요.';if(!(number(e.quantity)>0))return '0보다 큰 수량을 입력해 주세요.';if(!text(e.note))return '사용 사유를 입력해 주세요.';return '';}
function build({orders=[],entries=[],sourceErrors=[]}={}){
 const groups=new Map(),warnings=[...sourceErrors],unallocated=[],seen=new Set();
 const all=[...new Map(orders.filter(o=>o&&!o.deleted&&!/취소/.test(text(o.fields?.['진행상태']))).map(o=>[text(o.id),o])).values()];
 for(const o of all){
  if(!['용액제조','중간배치'].includes(text(o.productionType)))continue;
  const id=text(o.id);if(!id||seen.has(id))continue;seen.add(id);
  const f=o.fields||{},product=text(f['제품명']||o.product||o.intermediateBatch?.kind)||'반제품명 확인 필요',batch=text(f['생산 LOT NO'])||'-';
  const assigned=!!batch&&batch!=='-';
  const groupKey=assigned?'lot:'+JSON.stringify([key(product),lot(batch)]):'work:'+id;
  if(!groups.has(groupKey))groups.set(groupKey,{key:groupKey,product,lot:batch,assigned,date:'',produced:0,used:0,manual:0,balance:null,sourceIds:[],ledger:[],entries:[],issues:[],notices:[]});
  const r=groups.get(groupKey);r.sourceIds.push(id);
  const date=text(o.workDate||f['작업일자']).slice(0,10);if(date>r.date)r.date=date;
  const actual=number(o.intermediateBatch?.actualQty??o.productionActual?.actualQty??o.productionActual?.quantity??o.actualProducedQty),plan=number(f['계획수량']);
  const amount=actual!==null?actual:plan,source=actual!==null?'제조량':'계획수량 기준';
  if(amount===null||amount<0)r.issues.push('제조수량 확인 필요');else r.produced+=micro(amount);
  if(actual===null)r.notices.push('계획수량 기준');
  if(!assigned)r.notices.push('LOT 미부여 · 사용 기록으로 차감');
  r.ledger.push({date,type:'생산',quantity:amount,direction:1,document:text(f['작업지시번호'])||id,note:source,sourceId:id});
 }
 const rows=[...groups.values()];
 for(const o of all){
  for(const m of o.materials||[]){
   const batch=text(m.lot);if(!batch||batch==='-')continue;
   const names=m.name==='중간배치'?[m.batchType]:[m.name,m.sourceName].filter(Boolean);
   const candidates=rows.filter(r=>r.assigned&&!r.sourceIds.includes(text(o.id))&&lot(r.lot)===lot(batch)&&names.some(name=>key(r.product)===key(name)||material(r.product)===material(name)));
   if(candidates.length!==1){if(candidates.length>1)unallocated.push({lot:batch,reason:'반제품명·LOT가 여러 제조 기록과 일치합니다.'});continue;}
   const r=candidates[0],amount=number(m.actual),plan=number(m.plan);
   if(amount===null){if(/완료/.test(text(o.fields?.['진행상태']))&&plan>0)r.issues.push('사용 작업지시서 실투입량 미입력');continue;}
   if(amount<0){r.issues.push('실투입량 음수 확인 필요');continue;}
   r.used+=micro(amount);
   if(amount>0)r.ledger.push({date:text(o.workDate).slice(0,10),type:'작업지시 사용',quantity:amount,direction:-1,document:text(o.fields?.['작업지시번호'])||text(o.id),note:text(o.fields?.['제품명']),sourceId:text(o.id)});
  }
 }
 const entryIds=new Set();
 for(const e of entries){
  if(entryIds.has(e.id)||e.status==='cancelled')continue;entryIds.add(e.id);
  const r=groups.get(e.stockKey);if(!r){unallocated.push({lot:e.lot,reason:'사용 기록의 원본 반제품 제조 작업지시서를 확인해 주세요.'});continue;}
  const error=validate(e);if(error){r.issues.push(error);continue;}
  const amount=number(e.quantity),direction=e.type==='adjustmentIn'?1:-1;r.manual+=direction*micro(amount);r.entries.push(e);
  r.ledger.push({date:e.date,type:labels[e.type],quantity:amount,direction,document:'사용 기록',note:e.note,id:e.id});
 }
 for(const r of rows){r.produced=kg(r.produced);r.used=kg(r.used);r.manual=kg(r.manual);r.manualUsed=r.entries.filter(e=>['use','sample','loss'].includes(e.type)).reduce((total,e)=>total+micro(number(e.quantity)),0)/1e6;r.adjustment=r.entries.filter(e=>['adjustmentIn','adjustmentOut'].includes(e.type)).reduce((total,e)=>total+(e.type==='adjustmentIn'?1:-1)*micro(number(e.quantity)),0)/1e6;if(r.adjustment)r.notices.push('재고 조정 '+r.adjustment+' kg');r.issues=[...new Set([...r.issues,...sourceErrors])];r.notices=[...new Set(r.notices)];
  const balance=kg(micro(r.produced)-micro(r.used)+micro(r.manual));r.balance=r.issues.length?null:balance;if(balance<0)r.issues.push('사용량이 생산량을 초과합니다.');
  r.ledger.sort((a,b)=>text(b.date).localeCompare(text(a.date)));
 }
 return {rows:rows.sort((a,b)=>b.date.localeCompare(a.date)||b.sourceIds[0].localeCompare(a.sourceIds[0])),warnings,unallocated};
}
return {PREFIX,text,key,lot,material,number,labels,readEntries,validate,build};
});
