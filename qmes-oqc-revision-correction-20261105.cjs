'use strict';
// User-requested correction of two legacy revision counters. Inspection evidence stays intact.
const completedPools=new WeakSet();
const corrections=[
 {key:'20261105-DBJ1501-rev1',lot:'DBJ1501',date:'2026-10-15',revision:1,clearModified:false},
 {key:'20261105-DBJ2101-rev0',lot:'DBJ2101',date:'2026-10-21',revision:0,clearModified:true}
];
function patch(row,rule){
 const product=String(row?.product||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(String(row?.lot||'').trim().toUpperCase()!==rule.lot||String(row?.date||row?.shipDate||'').slice(0,10)!==rule.date||product!=='NBA20HM05')return null;
 return {...row,revision:rule.revision,...(rule.clearModified?{modifiedAt:null,modifiedBy:'',revisionDay:'2026-11-05'}:{})};
}
async function ensure(pool,req,auditLog){
 if(completedPools.has(pool))return 0;
 const client=await pool.connect();let committed=false,resolved=0;const audits=[];
 try{
  await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='5s'");
  await client.query('SELECT pg_advisory_xact_lock(20261021,731)');
  await client.query('SELECT pg_advisory_xact_lock(20261105,1521)');
  await client.query('CREATE TABLE IF NOT EXISTS qmes_oqc_revision_corrections (correction_key text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now(),applied_by text NOT NULL,before_data jsonb NOT NULL,after_data jsonb NOT NULL)');
  for(const rule of corrections){
   const done=await client.query('SELECT 1 FROM qmes_oqc_revision_corrections WHERE correction_key=$1',[rule.key]);if(done.rows.length){resolved++;continue;}
   const records=await client.query("SELECT record_key,payload FROM qmes_sync_records WHERE record_type='oqc' AND payload::text LIKE $1 ORDER BY record_key FOR UPDATE",['%'+rule.lot+'%']);
   const before=[],after=[];
   for(const record of records.rows){
    const payload=record.payload;if(!payload||payload.deleted||!Array.isArray(payload.rows))continue;
    const rows=payload.rows.map(row=>{const next=patch(row,rule);if(!next)return row;before.push({recordKey:record.record_key,row});after.push({recordKey:record.record_key,row:next});return next;});
    if(rows.some((row,i)=>row!==payload.rows[i]))await client.query("UPDATE qmes_sync_records SET payload=$2::jsonb WHERE record_type='oqc' AND record_key=$1",[record.record_key,JSON.stringify({...payload,rows})]);
   }
   if(!before.length)continue;
   const actor=String(req?.session?.user?.name||'');
   await client.query('INSERT INTO qmes_oqc_revision_corrections(correction_key,applied_by,before_data,after_data) VALUES($1,$2,$3::jsonb,$4::jsonb)',[rule.key,actor,JSON.stringify(before),JSON.stringify(after)]);
   audits.push({key:rule.key,before,after});resolved++;
  }
  await client.query('COMMIT');committed=true;if(resolved===corrections.length)completedPools.add(pool);
 }catch(error){if(!committed)await client.query('ROLLBACK').catch(()=>{});throw error;}
 finally{client.release();}
 if(typeof auditLog==='function')for(const a of audits)await auditLog(req,'UPDATE','qmes_sync_records','oqc:revision-correction:'+a.key,{rows:a.before},{rows:a.after}).catch(()=>{});
 return audits.length;
}
module.exports={corrections,patch,ensure};
