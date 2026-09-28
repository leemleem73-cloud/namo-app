'use strict';
const {Pool}=require('pg');
require('dotenv').config();

/*
 * Workorder history repair V2 - 2026-09-28
 * Source of truth: user supplied 260506/08/12/20/21/22/26 and 260624/25 작업지시서(6).xlsx.
 * Internal record keys may stay unique, but all visible workorder/production LOT values use the Excel LOT No.
 */
const SRC='HIST_WO_EXCEL_20260928_V2';
const ROWS=[
  {
    date:'2026-05-06',key:'DBE0401',lot:'DBE0401',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:125.001,productionActual:null,worker:'',hours:'',timeRange:'',shiftType:'일반',solidContent:20.1,
    materials:[['NMP','',23.974,null],['BYK180','',0.503,null],['AOH30','',17.588,null],['SBS','',21.557,null],['PVdF','',31.438,null],['SBR','',29.941,null]],
    conditions:[['유량 (L/min.)','< 20',''],['온도 (℃)','< 70',''],['점도 (mPa·s)','',''],['여과 압력차 (ΔP ≤10)','',''],['작업시간 (시작/종료)','','']],
    checks:[['외관 (색상/이물)','목시검사','', ''],['점도','1500 ±300 cps','', ''],['입도','D99 : <10.0um','', ''],['고형분','20±0.5%','', '']]
  },
  {
    date:'2026-05-08',key:'DBE0801',lot:'DBE0801',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:125.001,productionActual:null,worker:'',hours:'',timeRange:'',shiftType:'일반',solidContent:20.1,
    materials:[['NMP','',23.974,null],['BYK180','',0.503,null],['AOH30','',17.588,null],['SBS','',21.557,null],['PVdF','',31.438,null],['SBR','',29.941,null]],
    conditions:[['유량 (L/min.)','< 20',''],['온도 (℃)','< 70',''],['점도 (mPa·s)','',''],['여과 압력차 (ΔP ≤10)','',''],['작업시간 (시작/종료)','','']],
    checks:[['외관 (색상/이물)','목시검사','', ''],['점도','1500 ±300 cps','', ''],['입도','D99 : <10.0um','', ''],['고형분','20±0.5%','', '']]
  },
  {
    date:'2026-05-12',key:'DBE1201',lot:'DBE1201',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:130,productionActual:null,worker:'',hours:'',timeRange:'',shiftType:'일반',solidContent:20.1,
    materials:[['NMP','',24.933,null],['BYK180','',0.523,null],['AOH30','',18.291,null],['SBS','',22.42,null],['PVdF','',32.695,null],['SBR','',31.138,null]],
    conditions:[['유량 (L/min.)','< 20',''],['온도 (℃)','< 70',''],['점도 (mPa·s)','',''],['여과 압력차 (ΔP ≤10)','',''],['작업시간 (시작/종료)','','']],
    checks:[['외관 (색상/이물)','목시검사','', ''],['점도','1500 ±300 cps','', ''],['입도','D99 : <10.0um','', ''],['고형분','20±0.5%','', '']]
  },
  {
    date:'2026-05-20',key:'DBE2001',lot:'DBE2001',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:130,productionActual:null,worker:'',hours:'',timeRange:'',shiftType:'일반',solidContent:20.1,
    materials:[['NMP','',24.933,null],['BYK180','',0.523,null],['AOH30','',18.291,null],['SBS','',22.42,null],['PVdF','',32.695,null],['SBR','',31.138,null]],
    conditions:[['유량 (L/min.)','< 20',''],['온도 (℃)','< 70',''],['점도 (mPa·s)','',''],['여과 압력차 (ΔP ≤10)','',''],['작업시간 (시작/종료)','','']],
    checks:[['외관 (색상/이물)','목시검사','', ''],['점도','1500 ±300 cps','', ''],['입도','D99 : <10.0um','', ''],['고형분','20±0.5%','', '']]
  },
  {
    date:'2026-05-21',key:'HIST-20260521-DBE2001',lot:'DBE2001',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:30.001,productionActual:null,worker:'',hours:'',timeRange:'',shiftType:'일반',solidContent:20.1,
    materials:[['NMP','',5.754,null],['BYK180','',0.121,null],['AOH30','',4.221,null],['SBS','',5.174,null],['PVdF','',7.545,null],['SBR','',7.186,null]],
    conditions:[['유량 (L/min.)','< 20',''],['온도 (℃)','< 70',''],['점도 (mPa·s)','',''],['여과 압력차 (ΔP ≤10)','',''],['작업시간 (시작/종료)','','']],
    checks:[['외관 (색상/이물)','목시검사','', ''],['점도','1500 ±300 cps','', ''],['입도','D99 : <10.0um','', ''],['고형분','20±0.5%','', '']]
  },
  {
    date:'2026-05-22',key:'DBE2201',lot:'DBE2201',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:30.001,productionActual:null,worker:'',hours:'',timeRange:'',shiftType:'일반',solidContent:20.1,
    materials:[['NMP','',5.754,null],['BYK180','',0.121,null],['AOH30','',4.221,null],['SBS','',5.174,null],['PVdF','',7.545,null],['SBR','',7.186,null]],
    conditions:[['유량 (L/min.)','< 20',''],['온도 (℃)','< 70',''],['점도 (mPa·s)','',''],['여과 압력차 (ΔP ≤10)','',''],['작업시간 (시작/종료)','','']],
    checks:[['외관 (색상/이물)','목시검사','', ''],['점도','1500 ±300 cps','', ''],['입도','D99 : <10.0um','', ''],['고형분','20±0.5%','', '']]
  },
  {
    date:'2026-05-26',key:'DBE2601',lot:'DBE2601',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:30.001,productionActual:null,worker:'',hours:'',timeRange:'',shiftType:'일반',solidContent:20.1,
    materials:[['NMP','',5.754,null],['BYK180','',0.121,null],['AOH30','',4.221,null],['SBS','',5.174,null],['PVdF','',7.545,null],['SBR','',7.186,null]],
    conditions:[['유량 (L/min.)','< 20',''],['온도 (℃)','< 70',''],['점도 (mPa·s)','',''],['여과 압력차 (ΔP ≤10)','',''],['작업시간 (시작/종료)','','']],
    checks:[['외관 (색상/이물)','목시검사','', ''],['점도','1500 ±300 cps','', ''],['입도','D99 : <10.0um','', ''],['고형분','20±0.5%','', '']]
  },
  {
    date:'2026-06-24',key:'DBF2401',lot:'DBF2401',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:120,productionActual:68,worker:'대리 박도훈, 사원 문지훈',hours:'6h',timeRange:'09:00~15:00',shiftType:'',solidContent:20.12,
    materials:[['NMP','20251031063',21.87,21.4],['BYK180','002708935',0.168,0.167],['AOH30','006-8-25',16.8,16.8],['SBS+PVdf','20260617PS',51.86,51.9],['SBR','C3026B26A(1)',29.3,29.3]],
    conditions:[['유량 (L/min.)','20','13'],['온도 (℃)','≤70℃','38~45'],['점도 (mPa·s)','1500±300cps','1038'],['여과 압력차(bar)','≤6','작동상태 검증 중'],['작업시간 (시작/종료)','08:30~16:30','09:00~15:00']],
    checks:[['외관 (색상/이물)','목시검사','옅은 아이보리 색상, 이물 안보임','OK'],['점도','1500±300cps','1038','NG'],['입도','Dmax : <10um','7.366','OK'],['고형분','20±1.0%','20.12','OK'],['수분율','<2000ppm','999','OK']],
    remarks:'특이사항: 필터청소 10Kg, 샘플 10Kg'
  },
  {
    date:'2026-06-25',key:'DBF2501',lot:'DBF2501',item:'NBA20HM05',process:'절연슬러리 제조',equipment:'HSM',
    planQty:120,productionActual:80,worker:'대리 박도훈, 사원 문지훈',hours:'6h',timeRange:'09:00~15:00',shiftType:'',solidContent:20.12,
    materials:[['NMP','20251031063',21.87,20.2],['BYK180','002708935',0.168,0.173],['AOH30','006-8-25',16.8,16.8],['SBS+PVdf','20260617PS',51.86,51.9],['SBR','C3026B26A(1)',29.3,29.3]],
    conditions:[['유량 (L/min.)','20','13'],['온도 (℃)','≤70℃','38~45'],['점도 (mPa·s)','1500±300cps','1318'],['여과 압력차(bar)','≤6','작동상태 검증 중'],['작업시간 (시작/종료)','08:30~16:30','09:00~15:00']],
    checks:[['외관 (색상/이물)','목시검사','옅은 아이보리 색상, 이물 안보임','OK'],['점도','1500±300cps','1318','OK'],['입도','Dmax : <10um','7.366','OK'],['고형분','20±1.0%','20.12','OK'],['수분율','<2000ppm','999','OK']],
    remarks:'특이사항: 필터청소 10Kg, 샘플 10Kg'
  }
];

function payload(r){
  const inputs=r.materials.map((m,i)=>{
    const plan=Number(m[2]||0),act=m[3]==null?null:Number(m[3]);
    return {
      seq:i+1,name:m[0],lot:String(m[1]||''),materialLot:String(m[1]||''),materialType:'일반원료',
      containerNo:'',inputStatus:'신규',availableQty:plan,
      remaining:act==null?null:Number(Math.max(0,plan-act).toFixed(3)),
      unit:'kg',note:'',base:'',std:plan,plan,act,
      ratio:plan>0&&act!=null?Number((act/plan*100).toFixed(2)):null,
      error:plan>0&&act!=null?Number(((act-plan)/plan*100).toFixed(2)):null,ok:null,by:''
    };
  });
  const hasActual=inputs.some(x=>x.act!=null)||r.productionActual!=null;
  const status=hasActual?'생산중':'발행';
  const materialRefs=inputs.map(x=>({name:x.name,lot:x.materialLot,plannedQty:x.plan,actualQty:x.act,unit:'kg'}));
  return {
    lotNo:r.key,source:SRC,sourceLotNo:r.lot,displayWorkOrderNo:r.lot,productionLotNo:r.lot,
    doc:{
      source:SRC,historicalImport:true,sourceLotNo:r.lot,displayWorkOrderNo:r.lot,productionLotNo:r.lot,
      woNo:r.lot,item:r.item,workType:'완제품',procName:r.process,tank:r.equipment,
      plan:r.planQty,date:r.date,productionDate:r.date,hours:r.hours,timeRange:r.timeRange,shiftType:r.shiftType,
      workers:r.worker,status,packaging:[],inputs,productionActual:r.productionActual,solidContent:r.solidContent,
      remarks:r.remarks||'',conds:(r.conditions||[]).map((x,i)=>({seq:i+1,name:x[0],set:x[1],act:x[2]})),
      processChecks:(r.checks||[]).map((x,i)=>({seq:i+1,name:x[0],spec:x[1],value:x[2],judge:x[3]}))
    },
    batch:{
      no:r.key,displayLotNo:r.lot,productionLotNo:r.lot,workOrderNo:r.lot,item:r.item,itemName:r.item,
      workType:'완제품',tank:r.equipment,plan:r.planQty,done:Number(r.productionActual||0),unit:'kg',
      due:r.date,productionDate:r.date,status:hasActual?'진행중':'발행',
      shift:[r.shiftType,r.timeRange].filter(Boolean).join(' · '),worker:r.worker,time:r.timeRange
    },
    lotRecord:{
      item:r.item,itemName:r.item,workType:'완제품',
      qty:r.productionActual!=null?(String(r.productionActual)+' kg / 계획 '+String(r.planQty)+' kg'):(String(r.planQty)+' kg (계획)'),
      wo:r.lot,workOrderNo:r.lot,productionLotNo:r.lot,status:hasActual?'생산중':'발행 — 생산 대기',stage:'생산',
      sourceLotNo:r.lot,materials:materialRefs,binderLot:'',containers:[],
      steps:[{stage:'작업지시',name:'작업지시 발행',time:r.date,detail:r.process+' · '+r.equipment+' · 계획 '+r.planQty+'kg',result:status,by:r.worker||''}],
      ship:null
    },
    intermediateLot:null,containers:{},remainders:{}
  };
}

async function run(){
  if(!process.env.DATABASE_URL)return;
  const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:2});
  for(let attempt=1;attempt<=20;attempt++){
    try{
      const c=await pool.connect();
      try{
        await c.query('BEGIN');
        let changed=0;
        for(const r of ROWS){
          const p=payload(r);
          const q=await c.query(
            "INSERT INTO qmes_sync_records(record_type,record_key,payload,updated_by,updated_at) VALUES('workorder',$1,$2::jsonb,'SYSTEM',$3::timestamptz) "+
            "ON CONFLICT(record_type,record_key) DO UPDATE SET payload=EXCLUDED.payload,updated_by='SYSTEM',updated_at=EXCLUDED.updated_at "+
            "WHERE qmes_sync_records.updated_by='SYSTEM' AND COALESCE(qmes_sync_records.payload->>'source','') IN ('HIST_WO_20260506',$4) RETURNING record_key",
            [r.key,JSON.stringify(p),r.date+'T12:00:00+09:00',SRC]
          );
          changed+=q.rowCount||0;
        }
        await c.query('COMMIT');
        console.log('[workorder-history-repair-v2] ensured '+ROWS.length+' Excel workorders ('+changed+' inserted/updated)');
        break;
      }finally{c.release();}
    }catch(e){
      if(attempt===20){console.error('[workorder-history-repair-v2] failed',e);break;}
      await new Promise(res=>setTimeout(res,1500+attempt*500));
    }
  }
}
setTimeout(run,1800);
module.exports={ROWS,payload};
