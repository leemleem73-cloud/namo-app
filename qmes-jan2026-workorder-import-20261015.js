'use strict';
const {Pool}=require('pg');
const id='WO-20260114-001',date='2026-01-14',lot='DBA1501';
const materials=[
{name:'NMP',lot:'2025102001',plan:'17.09',actual:'17.1'},
{name:'BYK180',lot:'0002708935',plan:'0.789',actual:'0.792'},
{name:'AOH30',lot:'004-8-25',plan:'27.6',actual:'27.6'},
{name:'PAI',lot:'PAI#27-2(2)',plan:'78.28',actual:'78.3'},
{name:'SBR',lot:'3025F26A(1)',plan:'106.24',actual:'106.2'}];
const doc={id,workDate:date,productionType:'일반',fields:{'작업지시번호':id,'고객사':'','제품명':'','생산 LOT NO':lot,'설비명':'HSM','작업자':'대리 박도훈, 대리 김동준','계획수량':'230','작업기간':date+' ~ '+date,'진행상태':'완료'},materials,note:'2026년 1월 14일 원본 작업지시서 등록 · 작업시간 08:30~16:30 · 실적수량 167kg(포장+잔량 5kg) · 혼합 중 안전밸브 작동, 포장 후 잔량 5kg 폐기'};
async function run(){
 if(!process.env.DATABASE_URL)return;
 const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:1});let c;
 try{
  c=await pool.connect();await c.query('BEGIN');
  await c.query('CREATE TABLE IF NOT EXISTS qmes_work_order_documents(id TEXT PRIMARY KEY,document JSONB NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW())');
  await c.query('CREATE TABLE IF NOT EXISTS qmes_work_order_deletions(id TEXT PRIMARY KEY,deleted_at TIMESTAMPTZ DEFAULT NOW())');
  const result=await c.query("INSERT INTO qmes_work_order_documents(id,document) SELECT $1,$2::jsonb WHERE NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions WHERE id=$1) AND NOT EXISTS(SELECT 1 FROM qmes_work_order_documents WHERE document->'fields'->>'생산 LOT NO'=$3 AND document->>'workDate'=$4) ON CONFLICT(id) DO NOTHING",[id,JSON.stringify(doc),lot,date]);
  await c.query('COMMIT');console.log('[QMES JAN14 IMPORT] inserted='+result.rowCount);
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});console.error('[QMES JAN14 IMPORT]',e.message)}
 finally{if(c)c.release();await pool.end().catch(()=>{})}
}
setTimeout(run,5500);
