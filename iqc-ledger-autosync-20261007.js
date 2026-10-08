'use strict';

// Import only through an explicit maintenance invocation. A UI deployment
// must never refresh ledger rows over user-edited inspection results.
if (!process.argv.includes('--import-approved-ledger')) {
  console.log('[QMES-IQC-AUTO] explicit ledger import not requested; skipped');
} else {

require('dotenv').config();
const { Pool } = require('pg');

const connectionString=String(process.env.DATABASE_URL||'').trim();
if(!connectionString){
  console.warn('[QMES-IQC-AUTO] DATABASE_URL missing; skipped');
  process.exit(0);
}

const rows=[
  {date:'2025-09-12',item:'분산제 (BYK-180)',supplier:'유니소재',qty:25,lot:'2708935',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'BYK (독일사)',inspector:'임흥배',sheet:'25년'},
  {date:'2025-09-16',item:'SBR (ADC30G)',supplier:'LG Chemical',qty:400,lot:'3025F26A(1)',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'임흥배',sheet:'25년'},
  {date:'2025-09-30',item:'NMP',supplier:'모리로쿠케미칼즈',qty:1000,lot:'2025090101',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'임흥배',sheet:'25년'},
  {date:'2025-11-10',item:'NMP',supplier:'모리로쿠케미칼즈',qty:1000,lot:'2025102001',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'임흥배',sheet:'25년'},
  {date:'2025-11-11',item:'Boehmite (AOH30)',supplier:'강신산업',qty:100,lot:'004-8-25',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'Nabaltec (강신산업)',inspector:'임흥배',sheet:'25년'},
  {date:'2025-11-11',item:'바인더 (PAI)',supplier:'코오롱',qty:90,lot:'PAI#27-2(1)',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'임흥배',sheet:'25년'},
  {date:'2026-01-12',item:'바인더 (PAI)',supplier:'코오롱',qty:124,lot:'PAI#27-2(2)',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-01-13',item:'NMP',supplier:'푸양광명화학',qty:3000,lot:'20251031063',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-01-23',item:'NMP',supplier:'모리로쿠케미칼즈',qty:2000,lot:'2026011101',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-02-02',item:'Boehmite (AOH30)',supplier:'강신산업',qty:300,lot:'006-8-25',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-03-30',item:'SBR (ADC30-G)',supplier:'LG화학',qty:300,lot:'C3026A29A(1)',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-04-13',item:'PVdF (Solef5130)',supplier:'SOLVAY',qty:40,lot:'CSE23129DA',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'제품상이',inspector:'박현아',sheet:'26년'},
  {date:'2026-05-14',item:'PVdF (Solef5140)',supplier:'SOLVAY',qty:20,lot:'CSE23202TA',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-06-08',item:'SBR (ADC30-G)',supplier:'LG화학',qty:300,lot:'C3026B26A(1)',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-06-09',item:'PVdF (Solef5140)',supplier:'SOLVAY',qty:20,lot:'CSE23202TA',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'},
  {date:'2026-06-27',item:'SBS (KTR201)',supplier:'금호석유화학',qty:50,lot:'W251016',packaging:'이상없음',appearance:'이상없음',judge:'합격',remark:'',inspector:'박현아',sheet:'26년'}
];

const pool=new Pool({
  connectionString,
  ssl:{rejectUnauthorized:false},
  max:2,
  idleTimeoutMillis:5000,
  connectionTimeoutMillis:10000,
});

(async()=>{
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS iqc (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        lot TEXT NOT NULL,
        supplier TEXT NOT NULL,
        item TEXT NOT NULL,
        inspector TEXT NOT NULL,
        incoming_qty NUMERIC,
        qty NUMERIC,
        fail NUMERIC DEFAULT 0,
        packaging_type TEXT DEFAULT '',
        packaging_type_other TEXT DEFAULT '',
        package_qty INTEGER,
        unit_weight NUMERIC,
        calculated_weight NUMERIC,
        barcode_qty INTEGER,
        items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        sign_writer JSONB DEFAULT '{}'::jsonb,
        sign_reviewer JSONB DEFAULT '{}'::jsonb,
        sign_approver JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    let inserted=0,updated=0;
    for(const row of rows){
      const items=[
        {name:'포장상태',value:row.packaging,judge:row.packaging==='이상없음'?'합격':'확인필요'},
        {name:'외관',value:row.appearance,judge:row.appearance==='이상없음'?'합격':'확인필요'},
        {name:'관리대장 판정',value:row.judge,judge:row.judge},
        {name:'비고',value:row.remark||'',judge:''},
        {name:'원본시트',value:row.sheet,judge:''}
      ];
      const existing=await client.query(
        `SELECT id FROM iqc
          WHERE date=$1 AND lot=$2 AND supplier=$3 AND item=$4
          ORDER BY created_at ASC LIMIT 1`,
        [row.date,row.lot,row.supplier,row.item]
      );
      if(existing.rowCount){
        await client.query(
          `UPDATE iqc SET inspector=$1,incoming_qty=$2,fail=0,items_json=$3::jsonb
            WHERE id=$4`,
          [row.inspector,row.qty,JSON.stringify(items),existing.rows[0].id]
        );
        updated++;
      }else{
        await client.query(
          `INSERT INTO iqc
            (date,lot,supplier,item,inspector,incoming_qty,qty,fail,items_json)
           VALUES ($1,$2,$3,$4,$5,$6,NULL,0,$7::jsonb)`,
          [row.date,row.lot,row.supplier,row.item,row.inspector,row.qty,JSON.stringify(items)]
        );
        inserted++;
      }
    }
    await client.query('COMMIT');
    console.log(`[QMES-IQC-AUTO] ledger sync complete total=${rows.length} inserted=${inserted} updated=${updated}`);
  }catch(error){
    await client.query('ROLLBACK').catch(()=>{});
    console.error('[QMES-IQC-AUTO] sync failed:',error&&error.message?error.message:error);
    process.exitCode=1;
  }finally{
    client.release();
    await pool.end().catch(()=>{});
  }
})().catch(error=>{
  console.error('[QMES-IQC-AUTO] fatal:',error);
  process.exitCode=1;
});

}
