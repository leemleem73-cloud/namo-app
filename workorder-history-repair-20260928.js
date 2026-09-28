'use strict';
const {Pool}=require('pg');
require('dotenv').config();
const SRC='HIST_WO_20260506';
const R=[["2026-05-06","DBE0401","DBE0401",125.001,null,[["NMP","",23.974,null],["BYK180","",0.503,null],["AOH30","",17.588,null],["SBS","",21.557,null],["PVdF","",31.438,null],["SBR","",29.941,null]]],["2026-05-08","DBE0801","DBE0801",125.001,null,[["NMP","",23.974,null],["BYK180","",0.503,null],["AOH30","",17.588,null],["SBS","",21.557,null],["PVdF","",31.438,null],["SBR","",29.941,null]]],["2026-05-12","DBE1201","DBE1201",130,null,[["NMP","",24.933,null],["BYK180","",0.523,null],["AOH30","",18.291,null],["SBS","",22.42,null],["PVdF","",32.695,null],["SBR","",31.138,null]]],["2026-05-20","DBE2001","DBE2001",130,null,[["NMP","",24.933,null],["BYK180","",0.523,null],["AOH30","",18.291,null],["SBS","",22.42,null],["PVdF","",32.695,null],["SBR","",31.138,null]]],["2026-05-21","HIST-20260521-DBE2001","DBE2001",30.001,null,[["NMP","",5.754,null],["BYK180","",0.121,null],["AOH30","",4.221,null],["SBS","",5.174,null],["PVdF","",7.545,null],["SBR","",7.186,null]]],["2026-05-22","DBE2201","DBE2201",30.001,null,[["NMP","",5.754,null],["BYK180","",0.121,null],["AOH30","",4.221,null],["SBS","",5.174,null],["PVdF","",7.545,null],["SBR","",7.186,null]]],["2026-05-26","DBE2601","DBE2601",30.001,null,[["NMP","",5.754,null],["BYK180","",0.121,null],["AOH30","",4.221,null],["SBS","",5.174,null],["PVdF","",7.545,null],["SBR","",7.186,null]]],["2026-06-24","DBF2401","DBF2401",119.998,68,[["NMP","20251031063",21.87,21.4],["BYK180","002708935",0.168,0.167],["AOH30","006-8-25",16.8,16.8],["SBS+PVdf","20260617PS",51.86,51.9],["SBR","C3026B26A(1)",29.3,29.3]]],["2026-06-25","DBF2501","DBF2501",119.998,80,[["NMP","20251031063",21.87,20.2],["BYK180","002708935",0.168,0.173],["AOH30","006-8-25",16.8,16.8],["SBS+PVdf","20260617PS",51.86,51.9],["SBR","C3026B26A(1)",29.3,29.3]]]];
function payload(r){
  const d=r[0],key=r[1],lot=r[2],plan=r[3],prod=r[4];
  const inputs=r[5].map((x,i)=>{const p=x[2],a=x[3];return {seq:i+1,name:x[0],lot:x[1],materialLot:x[1],materialType:'일반원료',containerNo:'',inputStatus:'신규',availableQty:p,remaining:a==null?null:Number(Math.max(0,p-a).toFixed(3)),unit:'kg',note:'',base:'',std:p,plan:p,act:a,ratio:p>0&&a!=null?Number((a/p*100).toFixed(2)):null,error:p>0&&a!=null?Number(((a-p)/p*100).toFixed(2)):null,ok:null,by:''};});
  const has=inputs.some(x=>x.act!=null),status=has?'생산중':'발행';
  const worker=d>='2026-06-24'?'대리 박도훈, 사원 문지훈':'';
  const time=d>='2026-06-24'?'09:00~15:00':'';
  const hours=d>='2026-06-24'?'6h':'';
  const remarks=d==='2026-06-24'||d==='2026-06-25'?'특이사항: 필터청소 10Kg, 샘플 10Kg':'';
  return {lotNo:key,source:SRC,sourceLotNo:lot,doc:{source:SRC,historicalImport:true,sourceLotNo:lot,woNo:lot,item:'NBA20HM05',workType:'완제품',procName:'절연슬러리 제조',tank:'HSM(high shear mixer)',plan,date:d,hours,timeRange:time,shiftType:d>='2026-06-24'?'':'일반',workers:worker,status,packaging:[],inputs,productionActual:prod,remarks,conds:[]},batch:{no:key,displayLotNo:lot,item:'NBA20HM05',workType:'완제품',tank:'HSM(high shear mixer)',plan,done:Number(prod||0),unit:'kg',due:d,status:has?'진행중':'발행',shift:[d>='2026-06-24'?'':'일반',time].filter(Boolean).join(' · '),worker,time:''},lotRecord:{item:'NBA20HM05',itemName:'NBA20HM05',workType:'완제품',qty:prod!=null?(String(prod)+' kg / 계획 '+String(plan)+' kg'):(String(plan)+' kg (계획)'),wo:lot,status:has?'생산중':'발행 — 생산 대기',stage:'생산',sourceLotNo:lot,materials:[],binderLot:'',containers:[],steps:[],ship:null},intermediateLot:null,containers:{},remainders:{}};
}
async function run(){
 if(!process.env.DATABASE_URL)return;
 const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:2});
 for(let attempt=1;attempt<=20;attempt++){
  try{
   const c=await pool.connect();
   try{
    await c.query('BEGIN');
    let n=0;
    for(const r of R){
      const p=payload(r);
      const q=await c.query("INSERT INTO qmes_sync_records(record_type,record_key,payload,updated_by,updated_at) VALUES('workorder',$1,$2::jsonb,'SYSTEM',$3::timestamptz) ON CONFLICT(record_type,record_key) DO UPDATE SET payload=EXCLUDED.payload,updated_by='SYSTEM',updated_at=EXCLUDED.updated_at WHERE qmes_sync_records.updated_by='SYSTEM' AND COALESCE(qmes_sync_records.payload->>'source','')=$4 RETURNING record_key",[r[1],JSON.stringify(p),r[0]+'T12:00:00+09:00',SRC]);
      n+=q.rowCount||0;
    }
    await c.query('COMMIT');
    console.log('[workorder-history-repair] ensured '+R.length+' rows ('+n+' inserted/updated)');
    break;
   }finally{c.release();}
  }catch(e){
   if(attempt===20){console.error('[workorder-history-repair] failed',e);break;}
   await new Promise(res=>setTimeout(res,1500+attempt*500));
  }
 }
}
setTimeout(run,1600);
module.exports={R,payload};
