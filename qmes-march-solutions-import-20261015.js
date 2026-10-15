'use strict';
const {Pool}=require('pg');
const docs=[
['2026-03-27','SBS 용액제조',180,'SBS',20,'10'],
['2026-03-30','PVdF 용액제조',184,'PVdF 5140',16,'8']];
async function run(){
 const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
 try{
  for(const [date,product,nmp,second,amount,solid] of docs){
   const id='WO-'+date.replace(/-/g,'')+'-001';
   const record={id,workDate:date,fields:{'작업지시번호':id,'고객사':'','제품명':product,'생산 LOT NO':'','설비명':'mixer','작업자':'','계획수량':'200','작업기간':date+' ~ '+date,'진행상태':'대기'},materials:[{name:'NMP',lot:'',plan:String(nmp),actual:''},{name:second,lot:'',plan:String(amount),actual:''}],note:'원본 고형분 '+solid+'%, 원본에 생산 LOT와 작업자 미기재'};
   await pool.query("INSERT INTO qmes_work_order_documents(id,document) SELECT $1,$2::jsonb WHERE NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions WHERE id=$1) AND NOT EXISTS(SELECT 1 FROM qmes_work_order_documents WHERE document->>'workDate'=$3 AND document->'fields'->>'제품명'=$4) ON CONFLICT(id) DO NOTHING",[id,JSON.stringify(record),date,product]);
  }
 }catch(e){console.error('March workorder import:',e.message)}finally{await pool.end()}
}
setTimeout(run,6000);
