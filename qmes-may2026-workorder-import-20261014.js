'use strict';
// One-time, idempotent QMES work order import requested 2026-10-14.
// Inserts only missing May 2026 documents; never overwrites existing records.
const {Pool}=require('pg');
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
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:1});
function build(r){const id='WO-'+r.date.replace(/-/g,'')+'-001';return {id,workDate:r.date,productionType:'일반',fields:{'작업지시번호':id,'고객사':'','제품명':r.item,'생산 LOT NO':r.lot,'설비명':r.equipment,'작업자':r.worker||'','계획수량':String(r.planQty),'작업기간':r.date+' ~ '+r.date,'진행상태':'대기'},materials:r.materials.map(m=>({name:m[0],lot:m[1]||'',plan:String(m[2]),actual:m[3]==null?'':String(m[3])})),note:'2026년 5월 원본 작업지시서 이력 등록 · '+r.process};}
async function run(){if(!process.env.DATABASE_URL){console.warn('[QMES MAY IMPORT] DATABASE_URL missing');return;}let client;try{client=await pool.connect();await client.query('BEGIN');await client.query('CREATE TABLE IF NOT EXISTS qmes_work_order_documents (id TEXT PRIMARY KEY,document JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');await client.query('CREATE TABLE IF NOT EXISTS qmes_work_order_deletions (id TEXT PRIMARY KEY,deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');let count=0;for(const r of ROWS.slice(0,7)){const doc=build(r);const result=await client.query(`INSERT INTO qmes_work_order_documents(id,document) SELECT $1,$2::jsonb WHERE NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions WHERE id=$1) AND NOT EXISTS(SELECT 1 FROM qmes_work_order_documents WHERE (document->>'workDate'=$3 OR document->'fields'->>'작업기간' LIKE $4) AND document->'fields'->>'생산 LOT NO'=$5) ON CONFLICT (id) DO NOTHING RETURNING id`,[doc.id,JSON.stringify(doc),r.date,r.date+'%',r.lot]);count+=result.rowCount||0;}await client.query('COMMIT');console.log('[QMES MAY IMPORT] inserted '+count+' of 7; existing rows preserved');}catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('[QMES MAY IMPORT]',e.message);}finally{if(client)client.release();await pool.end().catch(()=>{});}}
setTimeout(run,4000);
