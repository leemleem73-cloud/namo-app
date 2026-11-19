'use strict';
const {randomUUID,createHash}=require('node:crypto');
const core=require('./public/js/qmes-material-stock-core-20261103.js');
const semi=require('./public/js/qmes-semi-stock-core-20261119.js');
const text=value=>String(value??'').trim();
const identity=row=>{const values=[core.material(row.name),core.lot(row.lot)];const source=text(row.semiWorkOrderId||row.sourceSemiOrderId);if(source)values.push(source);if(text(row.batchType))values.push('batch:'+text(row.batchType));return createHash('sha256').update(JSON.stringify(values)).digest('hex');};
const uuid=value=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(text(value));
function summarize({row,iqc,orders,actuals,inventory,holds,errors=[]}){
 const lot=text(row.lot),expectedName=text(row.name);
 const receipts=iqc.filter(item=>!item.deleted&&core.lot(item.lot)===core.lot(lot)&&core.material(item.item)===core.material(expectedName));
 const names=[...new Set(receipts.map(item=>text(item.item)).filter(Boolean))];
 const data={name:names.length===1?names[0]:expectedName,lot,code:'-',zone:'-',iqc:'확인 필요',available:null,kind:'warn',title:'확인 필요',reason:'원료 정보를 확인해 주세요.'};
 const semiErrors=errors.filter(message=>/^(작업지시서|수불기록)/.test(message));
 const semiModel=semi.build({orders,entries:semi.readEntries(inventory),sourceErrors:semiErrors});
 const sourceId=text(row.semiWorkOrderId||row.sourceSemiOrderId);
 const name=row.name==='중간배치'?row.batchType:expectedName;
 const semiFamily=semiModel.rows.filter(item=>semi.material(item.product)===semi.material(name));
 const semiMatches=sourceId?semiFamily.filter(item=>item.sourceIds.includes(sourceId)):
  lot&&lot!=='-'?semiFamily.filter(item=>item.assigned&&semi.lot(item.lot)===semi.lot(lot)):[];
 if(sourceId||semiMatches.length){
  const value={...data,name:expectedName,stockKind:'semi',iqc:'자체제조 · 수입검사 비대상'};
  if(semiMatches.length!==1)return {...value,title:'반제품 연결 확인',reason:'반제품 제조 기록을 한 건으로 확인할 수 없습니다.'};
  if(receipts.length&&!sourceId)return {...value,title:'재고 구분 확인',reason:'같은 원료명·LOT에 원료와 반제품 기록이 함께 있습니다. 사용한 제조 기록을 확인해 주세요.'};
  const entry=semiMatches[0];
  if(sourceId&&lot&&lot!=='-'&&entry.assigned&&semi.lot(entry.lot)!==semi.lot(lot))return {...value,kind:'bad',title:'투입 차단',reason:'선택한 반제품 제조 LOT와 작업지시 원료 LOT가 일치하지 않습니다.'};
  value.name=entry.product;value.available=entry.balance;value.sourceKey=entry.key;
  if(entry.issues.length||entry.balance===null)return {...value,available:null,title:'반제품 재고 확인',reason:entry.issues.join(' / ')||'반제품 재고 수량을 확인해 주세요.'};
  if(!(entry.balance>0))return {...value,kind:'bad',title:'투입 차단',reason:'반제품 사용가능량이 없습니다.'};
  const planned=core.number(row.plan);
  if(planned!==null&&planned>entry.balance+1e-6)return {...value,title:'투입량 확인 필요',reason:'계획 투입량이 반제품 재고를 초과합니다.'};
  return {...value,kind:'ok',title:'투입 가능',reason:'반제품 재고 연동 · '+entry.notices.join(' / ')};
 }
 if(!lot||lot==='-')return {...data,lot:lot||'-',stockKind:semiFamily.length?'semi':'unassigned',iqc:semiFamily.length?'자체제조 · 수입검사 비대상':'LOT 미부여',title:'사용 기록 연결 필요',reason:semiFamily.length?'LOT가 없어 사용한 반제품 제조 건을 특정할 수 없습니다. 반제품 재고에서 해당 제조 건의 사용 기록을 확인해 주세요.':'LOT 미부여 원료입니다. 연결 가능한 재고 수량이 없어 사용량 확인이 필요합니다.'};
 data.stockKind='raw';
 const states=receipts.map(core.judgment);
 data.iqc=!receipts.length?'기록 없음':states.includes('불합격')?'불합격':states.every(state=>state==='합격')?'합격':'확인 필요';
 const model=core.build({iqc,orders,actuals,entries:core.readEntries(inventory),holds,sourceErrors:errors});
 const matches=model.rows.filter(item=>core.lot(item.lot)===core.lot(lot)&&core.material(item.material)===core.material(expectedName));
 const entry=matches.length===1?matches[0]:null;
 if(entry&&!entry.uncertain&&Number.isFinite(entry.available))data.available=entry.available;
 if(data.iqc==='불합격')return {...data,kind:'bad',title:'투입 차단',reason:'수입검사 불합격입니다. 원료를 재확인하세요.'};
 if(!receipts.length)return {...data,reason:'작업지시 원료 LOT와 일치하는 수입검사 기록이 없습니다.'};
 if(data.iqc!=='합격')return {...data,reason:'수입검사 합격 여부를 확인해 주세요.'};
 if(errors.length)return {...data,reason:errors.join(' / ')};
 if(!entry)return {...data,reason:matches.length?'동일 원료 LOT에 여러 공급업체가 있습니다. 재고 내역을 확인하세요.':'재고관리에서 해당 원료 LOT의 재고를 찾지 못했습니다.'};
 if(entry.quality==='품질보류')return {...data,kind:'bad',title:'투입 차단',reason:'해당 LOT는 품질보류 상태입니다.'};
 if(entry.uncertain||entry.quality!=='사용가능')return {...data,reason:'재고관리의 수량·연결 상태를 확인해 주세요.'};
 if(!(entry.available>0))return {...data,kind:'bad',title:'투입 차단',reason:'재고관리의 사용가능량이 없습니다.'};
 const planned=core.number(row.plan);
 if(planned!==null&&planned>entry.available+1e-6)return {...data,reason:'계획 투입량이 재고 사용가능량을 초과합니다.'};
 return {...data,kind:'ok',title:'투입 가능',reason:'작업지시 원료 LOT 일치 · 수입검사 합격 · 재고 사용가능량 확인'};
}
function install(app,{pool,requireLogin}){
 let ready=null;
 const ensure=()=>ready||(ready=pool.query(`CREATE TABLE IF NOT EXISTS qmes_work_material_links(
 token uuid PRIMARY KEY,work_id text NOT NULL,line_no integer NOT NULL,identity_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(work_id,line_no,identity_hash))`).catch(error=>{ready=null;throw error;}));
 app.post('/api/qmes/work-material-links',requireLogin,async(req,res)=>{
  res.set('Cache-Control','no-store');
  const id=text(req.body?.workId);
  if(!/^WO-[A-Za-z0-9_-]{6,60}$/.test(id))return res.status(400).json({success:false,message:'작업지시서를 확인해 주세요.'});
  try{
   const found=await pool.query(`SELECT document FROM qmes_work_order_documents WHERE id=$1 AND NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions WHERE id=$1)`,[id]);
   const work=found.rows[0]?.document;
   if(!work||!Array.isArray(work.materials))return res.status(404).json({success:false,message:'저장된 작업지시서가 없습니다.'});
   await ensure();
   const links=[];
   for(const [index,row]of work.materials.entries()){
    if(!text(row.name)||!text(row.lot))continue;
    const result=await pool.query(`INSERT INTO qmes_work_material_links(token,work_id,line_no,identity_hash) VALUES($1,$2,$3,$4)
     ON CONFLICT(work_id,line_no,identity_hash) DO UPDATE SET identity_hash=EXCLUDED.identity_hash RETURNING token`,[randomUUID(),id,index,identity(row)]);
    links.push({line:index,token:result.rows[0].token,name:text(row.name),lot:text(row.lot)});
   }
   res.json({success:true,data:links});
  }catch(error){console.error('[Work material QR issue]',error);res.status(500).json({success:false,message:'원료 QR 연결을 발행하지 못했습니다. 다시 시도해 주세요.'});}
 });
 // A random, issued capability reveals only this printed material's six display fields.
 // Full IQC, inventory and work-order APIs remain authenticated.
 app.get('/api/qmes/work-material-links/:token',async(req,res)=>{
  res.set('Cache-Control','no-store');res.set('Referrer-Policy','no-referrer');
  if(!uuid(req.params.token))return res.status(404).json({success:false,message:'원료 QR 링크를 확인해 주세요.'});
  try{
   await ensure();
   const found=await pool.query(`SELECT l.line_no,l.identity_hash,d.document FROM qmes_work_material_links l
    JOIN qmes_work_order_documents d ON d.id=l.work_id
    WHERE l.token=$1 AND NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions WHERE id=l.work_id)`,[req.params.token]);
   const link=found.rows[0],row=link?.document?.materials?.[link?.line_no];
   if(!link||!row)return res.status(404).json({success:false,message:'연결된 작업지시 원료가 없습니다. 다시 인쇄해 주세요.'});
   if(identity(row)!==link.identity_hash)return res.status(409).json({success:false,message:'인쇄 후 원료 또는 LOT가 변경됐습니다. 최신 작업지시서를 확인해 주세요.'});
   const queries=[
    ['수입검사','SELECT * FROM iqc ORDER BY created_at DESC'],
    ['작업지시서',`SELECT d.document FROM qmes_work_order_documents d WHERE NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions x WHERE x.id=d.id) ORDER BY d.created_at DESC`],
    ['작업실적',`SELECT w.work_date AS "workDate",w.finished_lot AS "finishedLot",m.seq,m.material,m.sup_name AS "supName",m.lot_no AS "lotNo",m.input_qty AS "inputQty",m.input_time AS "inputTime" FROM worklog w LEFT JOIN worklog_materials m ON w.id=m.worklog_id ORDER BY w.work_date DESC,m.seq ASC`],
    ['수불기록',`SELECT record_key,payload,updated_by,updated_at FROM qmes_sync_records WHERE record_type='inventory' ORDER BY updated_at DESC`],
    ['품질보류',`SELECT h.* FROM qmes_lot_holds h WHERE NOT EXISTS(SELECT 1 FROM qmes_lot_gate_events e WHERE e.lot=h.lot AND e.action='HIDE_RELEASED_HOLD' AND e.detail->>'holdId'=h.id::text) ORDER BY (h.released_at IS NULL) DESC,h.id DESC LIMIT 300`]
   ];
   const result=await Promise.all(queries.map(async([label,sql])=>{try{const value=await pool.query({text:sql,query_timeout:12000});return {rows:value.rows};}catch(error){console.error('[Work material QR read]',label,error);return {rows:[],error:label+' 조회를 완료하지 못했습니다.'};}}));
   const data=summarize({row,iqc:result[0].rows,orders:result[1].rows.map(item=>item.document),actuals:result[2].rows,inventory:result[3].rows,holds:result[4].rows,errors:result.filter(item=>item.error).map(item=>item.error)});
   res.json({success:true,data});
  }catch(error){console.error('[Work material QR]',error);res.status(500).json({success:false,message:'원료 정보를 불러오지 못했습니다. 다시 조회해 주세요.'});}
 });
}
module.exports={install,summarize,identity};
