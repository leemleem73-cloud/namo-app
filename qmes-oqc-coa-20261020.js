
'use strict';
const crypto=require('crypto');
module.exports=function({app,pool,requireLogin,ok,fail,auditLog}){
 const rules=require('./public/js/qmes-oqc-rules-20261019.js');
 const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
 const specifications=[['이물질 혼입 없을 것','육안'],['<10 μm','입도분석기'],['1,500±300 cP','점도계'],['<2,000 ppm','수분측정기'],['20.0±1.0 wt%','Drying Oven'],['≥400 gf/12.7mm','인장시험기'],['≥200 MΩ (Overflow)','절연저항계'],['미탈리','육안']];
 const hash=v=>crypto.createHash('sha256').update(stable(v)).digest('hex');
 const payload=v=>typeof v==='string'?JSON.parse(v):v||{};
 const error=(message,status=400)=>Object.assign(Error(message),{status});
 let schema;
 async function ensure(){if(!schema)schema=pool.query(`CREATE TABLE IF NOT EXISTS qmes_oqc_coa_issues (
 id BIGSERIAL PRIMARY KEY, group_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
 issue_number TEXT NOT NULL UNIQUE, issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 issued_by TEXT NOT NULL, snapshot JSONB NOT NULL)`).then(()=>pool.query("ALTER TABLE qmes_oqc_coa_issues ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS canceled_by TEXT")).then(()=>pool.query("CREATE TABLE IF NOT EXISTS qmes_oqc_coa_state(group_key TEXT PRIMARY KEY,current_issue_id BIGINT)")).then(()=>pool.query("INSERT INTO qmes_oqc_coa_state(group_key,current_issue_id) SELECT DISTINCT ON (group_key) group_key,CASE WHEN canceled_at IS NULL THEN id ELSE NULL END FROM qmes_oqc_coa_issues ORDER BY group_key,id DESC ON CONFLICT(group_key) DO NOTHING")).catch(e=>{schema=null;throw e;});return schema;}
 function targetsOf(req){
  const targets=req.body?.targets;
  if(!Array.isArray(targets)||targets.length!==8||targets.some(t=>!t||typeof t.recordKey!=='string'||!t.recordKey||t.recordKey.length>500||typeof t.rowId!=='string'||!t.rowId||t.rowId.length>500))throw error('8개 검사 항목의 원본 기록을 확인해 주세요.');
  if(new Set(targets.map(t=>t.recordKey+'|'+t.rowId)).size!==targets.length)throw error('원본 식별자가 중복되었습니다.');
  return targets;
 }
 async function read(client,targets,lock=false,checkExpected=false){
  const records=await client.query("SELECT record_key,payload FROM qmes_sync_records WHERE record_type='oqc' ORDER BY record_key"+(lock?' FOR UPDATE':''));
  const all=records.rows.flatMap(record=>{const p=payload(record.payload);return p.deleted?[]:(Array.isArray(p.rows)?p.rows:[]).map(row=>({recordKey:String(record.record_key),row}));});
  const first=all.find(x=>x.recordKey===targets[0].recordKey&&String(x.row.id)===targets[0].rowId);
  if(!first)throw error('원본 기록이 변경되었습니다. 목록에서 다시 열어 주세요.',409);
  const date=String(first.row.date||first.row.shipDate||'').slice(0,10),lot=String(first.row.lot||'').trim();
  const group=all.filter(x=>String(x.row.date||x.row.shipDate||'').slice(0,10)===date&&String(x.row.lot||'').trim()===lot);
  if(!date||!lot||group.length!==8)throw error('동일 검사일자·LOT의 8개 검사 항목을 확인해 주세요.',409);
  for(const entry of group){
    const target=targets.find(t=>t.recordKey===entry.recordKey&&t.rowId===String(entry.row.id));
    if(!target||checkExpected&&(!target.expected||stable(target.expected)!==stable(entry.row)))throw error('검사 기록이 변경되었습니다. 목록을 다시 조회한 뒤 발행해 주세요.',409);
  }
  const names=group.map(x=>rules.canonical(x.row.check));
  if(rules.items.some(name=>names.filter(x=>x===name).length!==1))throw error('8개 검사 항목이 모두 있어야 합니다.');
  const source=rules.items.map(name=>group.find(x=>rules.canonical(x.row.check)===name));
  const fieldNames=['date','customer','product','lot','inspector','remarks'];
  const fields={};
  for(const name of fieldNames){
    const values=source.map(x=>String(x.row[name]??'').trim()).filter(v=>v&&v!=='-');
    if(new Set(values).size>1)throw error('항목별 '+name+' 정보가 다릅니다. 수정 화면에서 확인해 주세요.');
    fields[name]=values[0]||'';
  }
  const items=source.map((entry,i)=>{const row=entry.row;const raw=Array.isArray(row.measurements)&&row.measurements.length?row.measurements:String(row.value||'').split(/\s*\/\s*/);const values=[0,1,2].map(n=>String(raw[n]??'').trim());return{name:rules.items[i],spec:specifications[i][0],method:specifications[i][1],values,judge:rules.evaluateItem(rules.items[i],values)};});
  const overall=source.some(x=>x.row.inspectionDecision==='불합격')||items.some(x=>x.judge==='불합격')?'불합격':items.every(x=>x.judge==='합격')?'합격':'대기';
  const sources=source.map(x=>({recordKey:x.recordKey,rowId:String(x.row.id)})).sort((a,b)=>(a.recordKey+'|'+a.rowId).localeCompare(b.recordKey+'|'+b.rowId));
  const snapshot={version:1,fields,items,overall,sources};
  return{snapshot,fingerprint:hash(snapshot),groupKey:hash(sources)};
 }
 const publicIssue=row=>({id:String(row.id),number:row.issue_number,issuedAt:row.issued_at,issuedBy:row.issued_by,canceledAt:row.canceled_at||null,canceledBy:row.canceled_by||null,fingerprint:row.fingerprint,snapshot:payload(row.snapshot)});
 app.post('/api/qmes/oqc/coa/status',requireLogin,async(req,res)=>{
  try{const targets=targetsOf(req);await ensure();const current=await read(pool,targets);
   const history=await pool.query('SELECT * FROM qmes_oqc_coa_issues WHERE group_key=$1 ORDER BY id DESC',[current.groupKey]);
   const active=await pool.query('SELECT current_issue_id FROM qmes_oqc_coa_state WHERE group_key=$1',[current.groupKey]);
   const latest=history.rows.find(row=>String(row.id)===String(active.rows[0]?.current_issue_id));return ok(res,{status:!latest||latest.canceled_at?'미발행':latest.fingerprint===current.fingerprint?'발행완료':'재발행 필요',canIssue:current.snapshot.overall==='합격'&&['inspector','product','customer'].every(name=>Boolean(current.snapshot.fields[name])),history:history.rows.map(publicIssue)});
  }catch(e){return fail(res,e.status||500,e.status?e.message:'CoA 발행 상태를 조회하지 못했습니다.');}
 });
 app.post('/api/qmes/oqc/coa/issue',requireLogin,async(req,res)=>{
  let client,committed=false;
  try{
   const targets=targetsOf(req);await ensure();client=await pool.connect();await client.query('BEGIN');
   await client.query("SET LOCAL lock_timeout = '5s'");await client.query("SET LOCAL statement_timeout = '10s'");
   const current=await read(client,targets,true,true),snapshot=current.snapshot;
   if(snapshot.overall!=='합격')throw error('모든 측정값이 합격인 경우에만 CoA를 발행할 수 있습니다.');
   if(!snapshot.fields.inspector||!snapshot.fields.product||!snapshot.fields.customer)throw error('검사자·제품명·고객사를 저장한 뒤 발행해 주세요.');
   const issuer=String(req.session.user?.name||'').trim();if(!issuer)throw error('발행자 정보를 확인해 주세요.',401);
   await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[current.groupKey]);
   const existing=await client.query('SELECT i.* FROM qmes_oqc_coa_issues i JOIN qmes_oqc_coa_state s ON s.current_issue_id=i.id WHERE s.group_key=$1',[current.groupKey]);
   let issued=existing.rows[0]&&!existing.rows[0].canceled_at&&existing.rows[0].fingerprint===current.fingerprint?existing.rows[0]:null;
   const reused=Boolean(issued);
   if(!issued){
    const seq=await client.query("SELECT nextval(pg_get_serial_sequence('qmes_oqc_coa_issues','id')) AS id");
    const number='COA-'+new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}).replace(/-/g,'')+'-'+String(seq.rows[0].id).padStart(6,'0');
    const result=await client.query('INSERT INTO qmes_oqc_coa_issues(id,group_key,fingerprint,issue_number,issued_by,snapshot) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING *',[seq.rows[0].id,current.groupKey,current.fingerprint,number,issuer,JSON.stringify(snapshot)]);
    issued=result.rows[0];
   }
   await client.query('INSERT INTO qmes_oqc_coa_state(group_key,current_issue_id) VALUES($1,$2) ON CONFLICT(group_key) DO UPDATE SET current_issue_id=EXCLUDED.current_issue_id',[current.groupKey,issued.id]);
   await client.query('COMMIT');committed=true;
   if(!reused)await auditLog(req,'CREATE','qmes_oqc_coa_issues',String(issued.id),null,{number:issued.issue_number,groupKey:current.groupKey}).catch(e=>console.warn('CoA audit',e.message));
   return ok(res,publicIssue(issued),'CoA 발행 완료');
  }catch(e){if(client&&!committed)await client.query('ROLLBACK').catch(()=>{});return fail(res,e.status||500,e.status?e.message:'CoA 발행에 실패했습니다. 다시 확인해 주세요.');}
  finally{client?.release();}
 });

 app.post('/api/qmes/oqc/coa/record',requireLogin,async(req,res)=>{
  try{const id=String(req.body?.issueId||'');if(!/^\d{1,20}$/.test(id))throw error('발행번호를 확인해 주세요.');
   await ensure();const result=await pool.query('SELECT * FROM qmes_oqc_coa_issues WHERE id=$1',[id]);
   if(!result.rows.length)throw error('발행본이 없습니다.',404);return ok(res,publicIssue(result.rows[0]));
  }catch(e){return fail(res,e.status||500,e.status?e.message:'발행본을 조회하지 못했습니다.');}
 });
 app.post('/api/qmes/oqc/coa/cancel',requireLogin,async(req,res)=>{
  let client,committed=false;
  try{
   const id=String(req.body?.issueId||'');if(!/^\d{1,20}$/.test(id))throw error('취소할 발행번호를 확인해 주세요.');
   const name=String(req.session.user?.name||'').trim();if(!name)throw error('로그인 정보를 확인해 주세요.',401);
   await ensure();client=await pool.connect();await client.query('BEGIN');
   await client.query("SET LOCAL lock_timeout = '5s'");
   const found=await client.query('SELECT * FROM qmes_oqc_coa_issues WHERE id=$1',[id]);
   if(!found.rows.length)throw error('발행본이 없습니다.',404);
   await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[found.rows[0].group_key]);
   const state=await client.query('SELECT current_issue_id FROM qmes_oqc_coa_state WHERE group_key=$1 FOR UPDATE',[found.rows[0].group_key]);
   if(String(state.rows[0]?.current_issue_id)!==id)throw error('현재 발행본만 취소할 수 있습니다. 현재 검사기록에서 확인해 주세요.',409);
   await client.query('DELETE FROM qmes_oqc_coa_issues WHERE id=$1',[id]);
   await client.query('UPDATE qmes_oqc_coa_state SET current_issue_id=NULL WHERE group_key=$1',[found.rows[0].group_key]);
   await client.query('COMMIT');committed=true;
   return ok(res,{id,status:'미발행'},'발행본을 제거하고 미발행으로 되돌렸습니다.');
  }catch(e){if(client&&!committed)await client.query('ROLLBACK').catch(()=>{});return fail(res,e.status||500,e.status?e.message:'발행 취소에 실패했습니다.');}
  finally{client?.release();}
 });

};
