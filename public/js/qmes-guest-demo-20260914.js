/* NAMO QMES customer showcase demo - 2026-09-14
 * Demo/guest only. Every visible business datum is fictional and isolated from production.
 * One scenario links Sales -> MRP -> Purchase -> IQC -> Material Input -> Production ->
 * PQC/OQC -> LOT Inventory -> Movement -> Shipment -> Integrated Dashboard.
 */
(function installQmesCustomerDemo(global){
  'use strict';
  if(global.__QMES_CUSTOMER_SHOWCASE_20260914__)return;
  global.__QMES_CUSTOMER_SHOWCASE_20260914__=true;

  const USER_KEY='qmes-current-user-v1';
  const DB_KEY='qmes-local-shipment-dashboard-v8-clean';
  const RESET_KEY='qmes-shipment-dashboard-clean-reset-v8';
  const YEAR=new Date().getFullYear();
  const YY=String(YEAR).slice(-2);
  const CURRENT_MONTH=new Date().getMonth()+1;
  const pad2=v=>String(v).padStart(2,'0');
  const date=(m,d)=>`${YEAR}-${pad2(m)}-${pad2(d)}`;
  const iso=(m,d,t='09:00:00')=>`${date(m,d)}T${t}+09:00`;
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const clone=v=>JSON.parse(JSON.stringify(v));
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};

  const PRODUCTS=[
    {code:'DEMO-FG-101',name:'DEMO 고내열 절연코팅액 A',recipe:[['DEMO-RM-A01',54],['DEMO-RM-B02',19],['DEMO-RM-C03',20],['DEMO-RM-D04',5],['DEMO-RM-F06',2]]},
    {code:'DEMO-FG-202',name:'DEMO 고접착 코팅액 B',recipe:[['DEMO-RM-A01',50],['DEMO-RM-B02',24],['DEMO-RM-C03',18],['DEMO-RM-D04',4],['DEMO-RM-E05',4]]},
    {code:'DEMO-FG-303',name:'DEMO 기능성 코팅액 C',recipe:[['DEMO-RM-A01',52],['DEMO-RM-B02',20],['DEMO-RM-C03',18],['DEMO-RM-D04',5],['DEMO-RM-E05',3],['DEMO-RM-F06',2]]}
  ];
  const MATERIALS=[
    {code:'DEMO-RM-A01',name:'DEMO 용제 A',supplier:'DEMO 소재솔루션',location:'RM-A01'},
    {code:'DEMO-RM-B02',name:'DEMO 바인더 B',supplier:'DEMO 폴리머텍',location:'RM-B02'},
    {code:'DEMO-RM-C03',name:'DEMO 세라믹 파우더 C',supplier:'DEMO 세라믹스',location:'RM-C03'},
    {code:'DEMO-RM-D04',name:'DEMO 분산제 D',supplier:'DEMO 어드밴스드케미',location:'RM-D04'},
    {code:'DEMO-RM-E05',name:'DEMO 안정화제 E',supplier:'DEMO 스페셜티랩',location:'RM-E05'},
    {code:'DEMO-RM-F06',name:'DEMO 기능성 첨가제 F',supplier:'DEMO 퍼포먼스머티리얼',location:'RM-F06'}
  ];
  const CUSTOMERS=['DEMO Mobility','DEMO Energy','DEMO CellTech','DEMO Advanced'];
  const DEMO_SPECS={
    '점도':{spec:'1,520±120 cP',method:'DEMO Viscometer'},
    '고형분':{spec:'20.0±0.5 wt%',method:'DEMO Drying Oven'},
    '입도(Dmax)':{spec:'<8 µm',method:'DEMO Particle Analyzer'},
    '수분':{spec:'<1,500 ppm',method:'DEMO Moisture Meter'},
    '접착력':{spec:'≥450 gf/12.7mm',method:'DEMO Tensile Tester'},
    '절연저항':{spec:'≥300 MΩ',method:'DEMO IR Meter'},
    '외관':{spec:'응집·이물·변색 없을 것',method:'Visual'},
    '전해액 안정성':{spec:'24 h 박리·침전 없음',method:'Visual'},
    'Gauss(필터)':{spec:'≥12,000 gauss',method:'DEMO Gauss Meter'}
  };
  const materialByCode=code=>MATERIALS.find(m=>m.code===code)||MATERIALS[0];
  const productByIndex=i=>PRODUCTS[i%PRODUCTS.length];

  const DB={
    batches:[],woDocs:{},iqc:[],iqcMaterials:MATERIALS.map(m=>m.name),insp:{PQC:[],OQC:[]},
    holds:[],gateEvents:[],intermediateLots:{},intermediateContainers:{},materialRemainders:{},
    eqReadings:{},eqLogs:[],eqAlarms:[],complaints:[],lots:{},coa:{},popEntries:[],auditLogs:[],
    ncr:[],change4m:[],trainings:[],partnerCustomers:[],partnerSuppliers:[],rawMaterialLots:{},
    itemMaster:{},recipeMaster:{},seqs:{iqc:100,pqc:200,oqc:200,workorder:100}
  };
  const ERP={sales:[],plan:[],purchase:[],shipping:[]};
  const SALES_META={};
  const SALES_REMARKS={};
  const PROCESS_SYNC=[];
  const INVENTORY={stock:[],transactions:[],counts:[],locations:[],items:[],reservations:[]};
  const DEMO_USERS=[
    {id:'DEMO-U01',uid:'DEMO-U01',name:'김데모',department:'생산팀',dept:'생산팀',title:'반장',status:'APPROVED'},
    {id:'DEMO-U02',uid:'DEMO-U02',name:'이시연',department:'품질팀',dept:'품질팀',title:'책임',status:'APPROVED'},
    {id:'DEMO-U03',uid:'DEMO-U03',name:'박가상',department:'생산팀',dept:'생산팀',title:'작업자',status:'APPROVED'},
    {id:'DEMO-U04',uid:'DEMO-U04',name:'최샘플',department:'물류팀',dept:'물류팀',title:'담당',status:'APPROVED'}
  ];

  PRODUCTS.forEach(p=>{
    DB.itemMaster[p.code]={code:p.code,name:p.name,type:'제품',unit:'kg',active:true,spec:'DEMO 고객승인 규격',storage:'FG Zone',updatedAt:iso(1,1)};
    const materials=p.recipe.map(([code,ratio])=>{const m=materialByCode(code);return {code:m.code,name:m.name,type:'원재료',unit:'kg',ratio,qtyPerBatch:ratio};});
    DB.recipeMaster[`${p.code}@DEMO-R3`]={id:`${p.code}@DEMO-R3`,productCode:p.code,productName:p.name,version:'DEMO-R3',active:true,basisQty:100,basisUnit:'kg',materials,totalRatio:100,note:'고객 시연용 가상 BOM',updatedAt:iso(1,1)};
  });
  MATERIALS.forEach(m=>{
    DB.itemMaster[m.code]={code:m.code,name:m.name,type:'원재료',unit:'kg',active:true,spec:'DEMO Incoming Spec',storage:m.location,supplier:m.supplier,updatedAt:iso(1,1)};
    INVENTORY.items.push({item_code:m.code,item_name:m.name,category:'RM',unit:'kg',min_stock:500,active:true});
    INVENTORY.locations.push({code:m.location,location_code:m.location,name:`가상 원료창고 ${m.location}`,location_name:`가상 원료창고 ${m.location}`,category:'RM',active:true});
  });
  PRODUCTS.forEach(p=>INVENTORY.items.push({item_code:p.code,item_name:p.name,category:'FG',unit:'kg',min_stock:300,active:true}));
  INVENTORY.locations.push(
    {code:'WIP-01',location_code:'WIP-01',name:'가상 공정 대기존',location_name:'가상 공정 대기존',category:'WIP',active:true},
    {code:'FG-A01',location_code:'FG-A01',name:'가상 완제품 창고 A',location_name:'가상 완제품 창고 A',category:'FG',active:true},
    {code:'FG-B01',location_code:'FG-B01',name:'가상 완제품 창고 B',location_name:'가상 완제품 창고 B',category:'FG',active:true}
  );

  const rawLotsByMonth={};
  let txId=1000;
  for(let month=1;month<=12;month+=1){
    const mm=pad2(month);
    rawLotsByMonth[month]={};
    MATERIALS.forEach((mat,mi)=>{
      const lot=`RM-DEMO-${String.fromCharCode(65+mi)}-${YY}${mm}-01`;
      const purchaseNo=`PUR-DEMO-${YY}${mm}-${pad2(mi+1)}`;
      const iqcNo=`IQC-DEMO-${YY}${mm}-${pad2(mi+1)}`;
      const qty=3600+month*70+mi*140;
      const recv=date(month,4+(mi%3));
      rawLotsByMonth[month][mat.code]=lot;
      ERP.purchase.push({id:purchaseNo,purchaseNo,poNo:purchaseNo,supplier:mat.supplier,item:mat.name,material:mat.name,itemCode:mat.code,materialCode:mat.code,qty,quantity:qty,unit:'kg',orderDate:date(month,1),date:date(month,1),due:recv,expected:recv,confirmedDueDate:recv,received:qty,receivedQty:qty,iqc:'합격',iqcStatus:'합격',status:'입고완료',receiptStatus:'입고완료',productionType:'D-DEMO',iqcRequired:true,materialLot:lot});
      DB.iqc.push({id:iqcNo,inNo:iqcNo,serverId:iqcNo,inspectionNo:iqcNo,purchaseOrderNo:purchaseNo,purchaseOrder:purchaseNo,recv,recvDate:recv,inspectedAt:recv,inspectDate:recv,date:recv,lot,lotNo:lot,name:mat.name,material:mat.name,item:mat.name,itemCode:mat.code,code:mat.code,supplier:mat.supplier,qty:String(qty),incomingQty:qty,inspectQty:String(qty),defectQty:'0',packagingType:'DEMO Drum',packageQty:18,unitWeight:200,visual:'합격',label:'합격',weight:'합격',coa:'합격',judge:'합격',status:'합격',inspector:'이시연',by:'이시연',remarks:'DEMO 입고기준 확인 완료'});
      DB.rawMaterialLots[`${mat.code}|${mat.supplier}`]={material:mat.name,supplier:mat.supplier,lot,status:'거래중',updatedAt:iso(month,5),by:'DEMO'};
      INVENTORY.transactions.push({id:txId++,transaction_type:'RECEIPT',category:'RM',item_code:mat.code,item_name:mat.name,lot_no:lot,from_location:'',to_location:mat.location,quantity:qty,unit:'kg',reference_no:`IQC:${iqcNo}`,operator_name:'이시연',operator_id:'DEMO-U02',created_at:iso(month,5,'11:10:00'),transaction_date:date(month,5),quality_status:'AVAILABLE'});
      INVENTORY.counts.push({id:`CNT-${YY}${mm}-${mi+1}`,count_date:date(month,26),item_code:mat.code,item_name:mat.name,lot_no:lot,location_code:mat.location,book_qty:Math.round(qty*0.31),actual_qty:Math.round(qty*0.31)+(mi===4&&month%4===0?2:0),difference_qty:(mi===4&&month%4===0?2:0),counted_by:'최샘플',remark:'DEMO 정기 실사'});
    });

    for(let index=1;index<=2;index+=1){
      const seq=pad2((month-1)*2+index);
      const p=productByIndex(month+index-2);
      const customer=CUSTOMERS[(month+index-2)%CUSTOMERS.length];
      const orderDate=date(month,index===1?2:9);
      const prodDate=date(month,index===1?12:21);
      const due=date(month,index===1?18:27);
      const salesNo=`SO-DEMO-${YY}${mm}-${index}`;
      const planNo=`PLAN-DEMO-${YY}${mm}-${index}`;
      const woNo=`WO-DEMO-${YY}${mm}-${index}`;
      const fgLot=`FG-DEMO-${YY}${mm}${index===1?'12':'21'}-${index}`;
      const planQty=1450+month*55+index*180;
      const active=month===CURRENT_MONTH&&index===2;
      const prodQty=active?Math.round(planQty*0.68):Math.round(planQty*0.985);
      const status=active?'생산중':'완료';
      const shipQty=active?0:Math.round(prodQty*0.72);
      const shipNo=`SHIP-DEMO-${YY}${mm}-${index}`;
      const pqcGroup=`PQC-DEMO-${YY}${mm}-${index}`;
      const oqcGroup=`OQC-DEMO-${YY}${mm}-${index}`;
      const inputs=p.recipe.map(([code,ratio],ri)=>{const m=materialByCode(code),std=Number((planQty*ratio/100).toFixed(3)),act=active?Number((std*0.69).toFixed(3)):Number((std*0.985).toFixed(3));return {seq:ri+1,code:m.code,itemCode:m.code,name:m.name,material:m.name,materialType:'원재료',supplier:m.supplier,lot:rawLotsByMonth[month][m.code],materialLot:rawLotsByMonth[month][m.code],std,plan:std,qty:std,act,actual:act,unit:'kg'};});
      const doc={id:woNo,workOrderNo:woNo,workOrder:woNo,lot:fgLot,lotNo:fgLot,finishedLot:fgLot,item:p.name,product:p.name,productName:p.name,itemCode:p.code,productCode:p.code,customer,plan:planQty,planQty,qty:planQty,prodQty,productionActual:prodQty,actualQty:prodQty,status,manualStatus:status,date:prodDate,due,unit:'kg',workType:'완제품',equipment:'DEMO-MIX-01',tank:'DEMO-MIX-01',recipeRevision:'DEMO-R3',inspectionSpec:'DEMO 고객승인 규격',worker:active?'김데모, 박가상':'김데모',workers:active?'김데모, 박가상':'김데모',salesOrderId:salesNo,productionPlanId:planNo,materials:inputs,inputs};
      const batch={id:woNo,no:fgLot,lot:fgLot,lotNo:fgLot,finishedLot:fgLot,workOrderNo:woNo,workOrder:woNo,item:p.name,itemName:p.name,product:p.name,productName:p.name,itemCode:p.code,productCode:p.code,customer,date:prodDate,due,plan:planQty,planQty,qty:planQty,done:prodQty,prodQty,productionQty:prodQty,actualQty:prodQty,status,progress:active?68:100,unit:'kg',worker:doc.worker,salesOrderId:salesNo,productionPlanId:planNo};
      DB.batches.push(batch);DB.woDocs[fgLot]=doc;

      ERP.sales.push({id:salesNo,salesNo,orderNo:salesNo,orderDate,date:orderDate,customer,po:`PO-CUST-DEMO-${YY}${mm}-${index}`,product:p.name,productName:p.name,productCategory:p.name,productCode:p.code,item:p.name,qty:planQty,quantity:planQty,unit:'kg',due,requestedDueDate:due,plan:'반영완료',productionPlanId:planNo,workOrder:woNo,workOrderNo:woNo,lot:fgLot,shipping:active?'출하대기':'출하완료',status:'수주확정',salesStatus:'확정',priority:index===2&&month%3===0?'긴급':'일반',projectName:`DEMO Project ${mm}-${index}`,remarks:'고객 시연용 가상 수주 데이터'});
      ERP.plan.push({id:planNo,planNo,date:prodDate,month:`${YEAR}-${mm}`,product:p.name,productName:p.name,productCode:p.code,qty:planQty,planQty,unit:'kg',revision:'DEMO-R3',status:active?'생산진행':'확정',salesOrderId:salesNo,customer,site:'DEMO Smart Factory',line:index===1?'Demo Line 1 · Mixing':'Demo Line 2 · Mixing',shift:index===1?'A조 · 주간':'B조 · 주간',inspectionSpec:'DEMO 고객승인 규격',oqcDate:due,requestedDue:due,workOrder:woNo,lot:fgLot,mrp:inputs.map(r=>({code:r.code,name:r.name,lot:r.lot,need:r.std,unit:r.unit}))});
      SALES_META[salesNo]=SALES_META[woNo]={salesOrderIdOverride:salesNo,orderDate,customerOverride:customer,productCategory:p.name,productOverride:p.name,qtyOverride:planQty,requestedDue:due,productionPlanId:planNo,workOrder:woNo,productionSite:'DEMO Smart Factory',productionLine:index===1?'Demo Line 1 · Mixing':'Demo Line 2 · Mixing',plannedProductionDate:prodDate,inspectionSpec:'DEMO 고객승인 규격',salesStatus:'확정',source:'CUSTOMER_DEMO',savedAt:iso(month,2),savedBy:'DEMO'};
      SALES_REMARKS[salesNo]='DEMO 라벨·CoA 동봉 / 납기 준수 시나리오';

      const processSteps=[
        ['작업준비 / 원료확인','DEMO 원료준비존'],['원료 계량 / 투입','DOS-101'],['프리믹싱','MIX-101'],['고속 분산','DISP-201'],['공정검사 (PQC)','DEMO QC LAB'],['충진 / 포장','FILL-301'],['생산완료 / 제품보관','FG-A01']
      ].map((r,si)=>({no:si+1,name:r[0],equipment:r[1],status:active?(si<3?'완료':si===3?'진행중':'대기'):'완료',startAt:iso(month,index===1?12:21,`${String(8+si).padStart(2,'0')}:00:00`),endAt:active&&si>=3?'':iso(month,index===1?12:21,`${String(8+si).padStart(2,'0')}:45:00`),resultQty:si===6?String(prodQty):'',defectQty:'0',workers:[{id:'DEMO-U01',name:'김데모'}],remark:si===4?'DEMO 공정 SPEC 확인':''}));
      PROCESS_SYNC.push({record_key:`process:${fgLot}`,payload:{lot:fgLot,lotNo:fgLot,item:p.name,product:p.name,workOrderNo:woNo,productionDate:prodDate,status:active?'진행중':'완료',steps:processSteps,workerIds:active?['DEMO-U01','DEMO-U03']:['DEMO-U01'],completedAt:active?'':iso(month,index===1?12:21,'16:20:00'),savedAt:iso(month,index===1?12:21,'16:20:00')},updated_at:iso(month,index===1?12:21,'16:20:00')});

      inputs.forEach(r=>INVENTORY.transactions.push({id:txId++,transaction_type:'PRODUCTION_ISSUE',category:'RM',item_code:r.code,item_name:r.name,lot_no:r.lot,from_location:materialByCode(r.code).location,to_location:'생산사용',quantity:r.act,unit:'kg',reference_no:`WOISSUE:${woNo}`,work_order_no:woNo,production_lot:fgLot,operator_name:'김데모',operator_id:'DEMO-U01',created_at:iso(month,index===1?12:21,'09:20:00'),transaction_date:prodDate,quality_status:'AVAILABLE'}));
      INVENTORY.transactions.push({id:txId++,transaction_type:'PRODUCTION_RECEIPT',category:'FG',item_code:p.code,item_name:p.name,lot_no:fgLot,from_location:'생산완료',to_location:index===1?'FG-A01':'FG-B01',quantity:prodQty,unit:'kg',reference_no:`WO:${woNo}`,work_order_no:woNo,production_lot:fgLot,operator_name:'김데모',operator_id:'DEMO-U01',created_at:iso(month,index===1?12:21,'16:30:00'),transaction_date:prodDate,quality_status:active?'OQC_PENDING':'AVAILABLE'});

      if(!active){
        const viscosity=[1510+month,1520+index,1505+month%4];
        const solids=[19.9,20.1,20.0];
        const dmax=[5.8+month%3*0.1,6.0,5.9];
        [['점도',viscosity],['고형분',solids],['입도(Dmax)',dmax],['외관',['이상없음']]].forEach(([item,values],ri)=>DB.insp.PQC.push({id:`${pqcGroup}-${ri+1}`,groupId:pqcGroup,lot:fgLot,lotNo:fgLot,workOrderNo:woNo,product:p.name,productCode:p.code,item,check:item,value:values.join(' / '),measurements:values.map(String),spec:DEMO_SPECS[item].spec,method:DEMO_SPECS[item].method,judge:'합격',status:'합격',date:prodDate,inspector:'이시연',by:'이시연'}));
        const oqcValues={
          '외관':['이상없음','이상없음','이상없음'],'입도(Dmax)':['5.9','6.0','5.8'],'점도':['1518','1522','1515'],'고형분':['20.0','20.1','19.9'],
          '접착력':['520','535','528'],'절연저항':['350','370','360'],'수분':['820','790','805'],'전해액 안정성':['미탈리','미탈리','미탈리']
        };
        Object.entries(oqcValues).forEach(([item,values],ri)=>DB.insp.OQC.push({id:`${oqcGroup}-${ri+1}`,groupId:oqcGroup,lot:fgLot,lotNo:fgLot,workOrderNo:woNo,product:p.name,productCode:p.code,item,check:item,value:values.join(' / '),measurements:values,spec:DEMO_SPECS[item].spec,method:DEMO_SPECS[item].method,judge:'합격',status:'합격',date:date(month,index===1?14:23),shipDate:date(month,index===1?16:25),customer,shipQty,inspector:'이시연',by:'이시연'}));
      }

      const remaining=Math.max(0,prodQty-shipQty);
      DB.lots[fgLot]={id:fgLot,lot:fgLot,lotNo:fgLot,finishedLot:fgLot,workOrder:woNo,workOrderNo:woNo,item:p.name,itemName:p.name,product:p.name,productName:p.name,itemCode:p.code,productCode:p.code,qty:prodQty,currentQty:remaining,amount:remaining,unit:'kg',status:active?'생산중':'생산완료',productionStatus:status,date:prodDate,productionDate:prodDate,customer,salesOrderId:salesNo,ship:active?{}:{shipNo,customer,shipDate:date(month,index===1?16:25),shipQty,status:'출하완료'}};
      if(!active){DB.coa[fgLot]={id:`COA-DEMO-${YY}${mm}-${index}`,no:`COA-DEMO-${YY}${mm}-${index}`,lot:fgLot,product:p.name,productCode:p.code,customer,shipNo,status:'발행',date:date(month,index===1?15:24),issuedAt:date(month,index===1?15:24),qty:shipQty};}
      DB.popEntries.push({id:`POP-DEMO-${YY}${mm}-${index}`,workOrderNo:woNo,lot:fgLot,product:p.name,productCode:p.code,qty:prodQty,date:prodDate,worker:'김데모',status});
      DB.auditLogs.push({id:`AUD-WO-${YY}${mm}-${index}`,module:'생산',action:active?'생산 진행':'실적 완료',target:fgLot,reason:'CUSTOMER DEMO',by:'김데모',at:iso(month,index===1?12:21,'16:20:00')});
      DB.eqLogs.push({id:`EQ-DEMO-${YY}${mm}-${index}`,equipment:index===1?'MIX-101':'DISP-201',name:index===1?'MIX-101':'DISP-201',date:prodDate,item:index===1?'RPM 안정성':'분산상태',value:index===1?'정상':'정상',judge:'정상',inspector:'김데모',by:'김데모'});

      ERP.shipping.push({id:shipNo,shipNo,shippingNo:shipNo,date:active?'':date(month,index===1?16:25),actualShipDate:active?'':date(month,index===1?16:25),shipDate:active?'':date(month,index===1?16:25),due,requestedDueDate:due,sales:salesNo,salesOrder:salesNo,customer,product:p.name,productName:p.name,productCode:p.code,item:p.name,lot:fgLot,finishedLot:fgLot,workOrder:woNo,workOrderNo:woNo,qty:shipQty,shipQty,unit:'kg',oqc:active?'검사대기':'합격',oqcStatus:active?'검사대기':'합격',coa:active?'미발행':'발행',coaStatus:active?'미발행':'발행',delivery:active?'출하대기':'출하완료',status:active?'출하대기':'출하완료',destination:`${customer} DEMO 납품처`,carrier:'DEMO Logistics',vehicle:`DEMO-${mm}${index}`,driver:'홍시연'});
      if(!active&&shipQty>0)INVENTORY.transactions.push({id:txId++,transaction_type:'SHIPMENT',category:'FG',item_code:p.code,item_name:p.name,lot_no:fgLot,from_location:index===1?'FG-A01':'FG-B01',to_location:'출하',quantity:shipQty,unit:'kg',reference_no:shipNo,work_order_no:woNo,production_lot:fgLot,operator_name:'최샘플',operator_id:'DEMO-U04',created_at:iso(month,index===1?16:25,'13:40:00'),transaction_date:date(month,index===1?16:25),quality_status:'AVAILABLE'});
    }

    DB.intermediateLots[`WIP-DEMO-${YY}${mm}`]={id:`WIP-DEMO-${YY}${mm}`,lot:`WIP-DEMO-${YY}${mm}`,product:productByIndex(month-1).name,qty:380+month*12,date:date(month,11),status:'사용완료'};
    DB.intermediateContainers[`CONT-DEMO-${YY}${mm}`]={id:`CONT-DEMO-${YY}${mm}`,lot:`WIP-DEMO-${YY}${mm}`,container:`DEMO-C-${mm}`,qty:190+month*6,date:date(month,11),status:'정상'};
    DB.materialRemainders[`REM-DEMO-${YY}${mm}`]={id:`REM-DEMO-${YY}${mm}`,material:MATERIALS[(month-1)%MATERIALS.length].name,lot:rawLotsByMonth[month][MATERIALS[(month-1)%MATERIALS.length].code],qty:70+month*5,date:date(month,27),status:'보관'};
    DB.complaints.push({id:`CC-DEMO-${YY}${mm}`,no:`CC-DEMO-${YY}${mm}`,customer:CUSTOMERS[(month-1)%CUSTOMERS.length],product:productByIndex(month-1).name,lot:`FG-DEMO-${YY}${mm}12-1`,date:date(month,8),title:month%2?'DEMO 납품문서 확인 요청':'DEMO 포장라벨 확인 요청',status:'완료',action:'가상 시나리오 조치 완료',owner:'이시연'});
    DB.ncr.push({id:`NCR-DEMO-${YY}${mm}`,no:`NCR-DEMO-${YY}${mm}`,date:date(month,19),product:productByIndex(month-1).name,lot:`FG-DEMO-${YY}${mm}12-1`,title:'DEMO 공정 이탈 시뮬레이션',status:'완료',owner:'이시연'});
    DB.change4m.push({id:`4M-DEMO-${YY}${mm}`,date:date(month,20),category:['Man','Machine','Material','Method'][(month-1)%4],title:'DEMO 4M 변경 검토',status:'승인완료',owner:'박가상'});
    DB.trainings.push({id:`TR-DEMO-${YY}${mm}`,date:date(month,24),title:`${month}월 DEMO 품질교육`,attendees:8+(month%3),status:'완료',trainer:'이시연'});
  }

  const pendingMaterial=MATERIALS[5];
  const pendingLot=`RM-DEMO-PENDING-${YY}${pad2(CURRENT_MONTH)}-01`;
  const pendingPo=`PUR-DEMO-${YY}${pad2(CURRENT_MONTH)}-P`;
  ERP.purchase.unshift({id:pendingPo,purchaseNo:pendingPo,poNo:pendingPo,supplier:pendingMaterial.supplier,item:pendingMaterial.name,material:pendingMaterial.name,itemCode:pendingMaterial.code,qty:800,quantity:800,unit:'kg',orderDate:date(CURRENT_MONTH,10),date:date(CURRENT_MONTH,10),due:date(CURRENT_MONTH,18),expected:date(CURRENT_MONTH,18),confirmedDueDate:date(CURRENT_MONTH,18),received:800,receivedQty:800,iqc:'검사대기',iqcStatus:'검사대기',status:'부분입고',receiptStatus:'검사대기',productionType:'D-DEMO',iqcRequired:true,materialLot:pendingLot});
  DB.iqc.unshift({id:`IQC-DEMO-${YY}${pad2(CURRENT_MONTH)}-P`,inNo:`IQC-DEMO-${YY}${pad2(CURRENT_MONTH)}-P`,purchaseOrderNo:pendingPo,purchaseOrder:pendingPo,recv:date(CURRENT_MONTH,18),inspectedAt:date(CURRENT_MONTH,18),date:date(CURRENT_MONTH,18),lot:pendingLot,lotNo:pendingLot,name:pendingMaterial.name,material:pendingMaterial.name,item:pendingMaterial.name,itemCode:pendingMaterial.code,code:pendingMaterial.code,supplier:pendingMaterial.supplier,qty:'800',incomingQty:800,inspectQty:'800',defectQty:'0',packagingType:'DEMO Drum',packageQty:4,unitWeight:200,visual:'합격',label:'합격',weight:'합격',coa:'합격',judge:'검사대기',status:'검사대기',inspector:'이시연',remarks:'DEMO 검사대기 시나리오'});

  DB.partnerCustomers=CUSTOMERS.map((name,i)=>({code:`DEMO-CUS-${pad2(i+1)}`,name,status:'거래중'}));
  DB.partnerSuppliers=MATERIALS.map((m,i)=>({code:`DEMO-SUP-${pad2(i+1)}`,company:m.supplier,material:m.name,lot:rawLotsByMonth[CURRENT_MONTH][m.code],status:'거래중'}));
  DB.eqReadings={'MIX-101':{equipment:'MIX-101',item:'운전상태',value:'정상',judge:'정상',date:date(CURRENT_MONTH,15)},'DISP-201':{equipment:'DISP-201',item:'분산상태',value:'정상',judge:'정상',date:date(CURRENT_MONTH,15)},'FILTER-301':{equipment:'FILTER-301',item:'자력',value:'13,200 gauss',judge:'정상',date:date(CURRENT_MONTH,15)}};
  PROCESS_SYNC.push(
    {record_key:'worker:DEMO-U01',payload:{id:'DEMO-U01',uid:'DEMO-U01',name:'김데모',dept:'생산팀',role:'반장',active:true},updated_at:iso(CURRENT_MONTH,1)},
    {record_key:'worker:DEMO-U03',payload:{id:'DEMO-U03',uid:'DEMO-U03',name:'박가상',dept:'생산팀',role:'작업자',active:true},updated_at:iso(CURRENT_MONTH,1)}
  );

  // Current inventory snapshot is derived from the same linked transaction story.
  const issueByLot=new Map();
  INVENTORY.transactions.filter(t=>t.transaction_type==='PRODUCTION_ISSUE').forEach(t=>issueByLot.set(t.lot_no,(issueByLot.get(t.lot_no)||0)+num(t.quantity)));
  MATERIALS.forEach(m=>{
    const lot=rawLotsByMonth[CURRENT_MONTH][m.code];
    const receipt=INVENTORY.transactions.filter(t=>t.transaction_type==='RECEIPT'&&t.lot_no===lot).reduce((s,t)=>s+num(t.quantity),0);
    const used=issueByLot.get(lot)||0;
    const q=Math.max(0,Number((receipt-used).toFixed(3)));
    INVENTORY.stock.push({category:'RM',item_code:m.code,item_name:m.name,lot_no:lot,location_code:m.location,quality_status:'AVAILABLE',quantity:q,reserved_qty:0,available_qty:q,unit:'kg',expiry_date:`${YEAR+1}-${pad2(CURRENT_MONTH)}-28`});
  });
  INVENTORY.stock.push({category:'RM',item_code:pendingMaterial.code,item_name:pendingMaterial.name,lot_no:pendingLot,location_code:pendingMaterial.location,quality_status:'IQC_PENDING',quantity:800,reserved_qty:800,available_qty:0,unit:'kg',expiry_date:`${YEAR+1}-${pad2(CURRENT_MONTH)}-28`});
  Object.values(DB.lots).filter(l=>num(l.currentQty)>0).slice(-12).forEach((l,i)=>INVENTORY.stock.push({category:l.status==='생산중'?'WIP':'FG',item_code:l.productCode,item_name:l.product,lot_no:l.lot,location_code:l.status==='생산중'?'WIP-01':i%2?'FG-A01':'FG-B01',quality_status:l.status==='생산중'?'OQC_PENDING':'AVAILABLE',quantity:l.currentQty,reserved_qty:0,available_qty:l.status==='생산중'?0:l.currentQty,unit:'kg',expiry_date:`${YEAR+1}-12-31`}));
  const activeBatch=DB.batches.find(b=>b.status==='생산중');
  if(activeBatch){const activeDoc=DB.woDocs[activeBatch.lot]||{};(activeDoc.inputs||[]).forEach((r,i)=>INVENTORY.reservations.push({id:`RES-DEMO-${i+1}`,work_order_no:activeDoc.workOrderNo,item_code:r.code,item_name:r.name,lot_no:r.lot,location_code:materialByCode(r.code).location,quantity:Number((r.std-r.act).toFixed(3)),unit:'kg',reserved_by:'김데모',status:'ACTIVE'}));}

  function inventorySummary(){
    const cats=['RM','PM','WIP','FG'];
    const totals=cats.map(category=>{const rows=INVENTORY.stock.filter(r=>r.category===category),total=rows.reduce((s,r)=>s+num(r.quantity),0),available=rows.reduce((s,r)=>s+num(r.available_qty),0),pending=rows.filter(r=>/PENDING/.test(r.quality_status)).reduce((s,r)=>s+num(r.quantity),0),hold=rows.filter(r=>r.quality_status==='HOLD').reduce((s,r)=>s+num(r.quantity),0);return {category,total_qty:Number(total.toFixed(3)),available_qty:Number(available.toFixed(3)),pending_qty:Number(pending.toFixed(3)),hold_qty:Number(hold.toFixed(3))};});
    return {totals,pendingLots:INVENTORY.stock.filter(r=>/PENDING/.test(r.quality_status)).length,safetyAlerts:INVENTORY.stock.filter(r=>r.category==='RM'&&num(r.available_qty)<400).slice(0,2),expiryAlerts:[],updatedAt:new Date().toISOString()};
  }

  const STORAGE_SEED={
    [RESET_KEY]:'1',[DB_KEY]:JSON.stringify(DB),'qmes-erp-sales-v1':JSON.stringify(ERP.sales),'qmes-erp-plan-v1':JSON.stringify(ERP.plan),'qmes-erp-purchase-v1':JSON.stringify(ERP.purchase),'qmes-erp-shipping-v1':JSON.stringify(ERP.shipping),'qmes-sales-order-meta-v1':JSON.stringify(SALES_META),'qmes-sales-remarks-v1':JSON.stringify(SALES_REMARKS)
  };
  const storageProto=global.Storage&&global.Storage.prototype;if(!storageProto)return;
  const rawGet=storageProto.getItem,rawSet=storageProto.setItem,rawRemove=storageProto.removeItem,rawClear=storageProto.clear;
  const previousFetch=global.fetch.bind(global);
  const demoLocal=new Map(Object.entries(STORAGE_SEED));
  const demoSession=new Map([['qmes_current_tab','dash'],['qmes_open_menu','']]);
  let reloadQueued=false;
  const parse=v=>{try{return JSON.parse(String(v||''));}catch(_){return null;}};
  const currentUser=()=>{try{return parse(rawGet.call(global.sessionStorage,USER_KEY));}catch(_){return null;}};
  const isDemoUser=user=>Boolean(user&&(/^(guest|demo)$/i.test(clean(user.role))||/^(guest|demo)$/i.test(clean(user.id))||/^(guest|demo)$/i.test(clean(user.uid))||/데모|demo/i.test(clean(user.name||user.loginId||user.email))));
  const demoActive=()=>isDemoUser(currentUser());
  const queueReload=()=>{if(reloadQueued)return;reloadQueued=true;setTimeout(()=>global.location.reload(),80);};

  const replacements=[
    ['절연슬러리(NBA20-HM01)','DEMO 고내열 절연코팅액 A (DEMO-FG-101)'],['NBA20-HM01','DEMO-FG-101'],['DBA1501','DEMO-FG-101'],
    ['BYK180 (분산제)','DEMO 분산제 D'],['Boehmite','DEMO 세라믹 파우더 C'],['PVdF','DEMO 바인더 B'],['PVDF','DEMO 바인더 B'],['NMP','DEMO 용제 A'],['SBR','DEMO 바인더 C'],['SBS','DEMO 안정화제 E'],
    ['현대자동차','DEMO Mobility'],['삼성SDI','DEMO Energy'],['LG에너지솔루션','DEMO CellTech'],['SK온','DEMO Advanced'],['코오롱','DEMO 소재솔루션'],['푸양광명화학','DEMO 케미텍'],['모리로쿠케미칼즈','DEMO 머티리얼랩'],['강신산업','DEMO 세라믹스'],['LG화학','DEMO 폴리머텍'],['SOLVAY','DEMO 스페셜티랩'],['금호석유화학','DEMO 퍼포먼스머티리얼'],['유니소재','DEMO 어드밴스드케미'],
    ['시화공장','DEMO Smart Factory'],['Line A · 배합/혼합','Demo Line 1 · Mixing'],['TK 501A ↔ B','MIX-201A ↔ MIX-201B'],['TK 501','MIX-101'],
    ['1,500±300 cP',DEMO_SPECS['점도'].spec],['20.0±1.0 wt%',DEMO_SPECS['고형분'].spec],['<10 µm',DEMO_SPECS['입도(Dmax)'].spec],['<2,000 ppm',DEMO_SPECS['수분'].spec],['≥400 gf/12.7mm',DEMO_SPECS['접착력'].spec],['≥200 MΩ (Overflow)',DEMO_SPECS['절연저항'].spec],['이물질 혼입 없을 것',DEMO_SPECS['외관'].spec],['탈리 / 미탈리',DEMO_SPECS['전해액 안정성'].spec],['≥1만 gauss (1단)',DEMO_SPECS['Gauss(필터)'].spec],
    ['공용 DB 실제현황','DEMO 연동 데이터'],['실제 작업지시·IQC·재고','DEMO 작업지시·IQC·재고'],['실제 현황 기준','DEMO 연계 기준'],['실제 원료명','가상 원료명']
  ];
  function sanitizeText(value){let out=String(value==null?'':value);replacements.forEach(([a,b])=>{out=out.split(a).join(b);});return out;}
  function sanitizeStored(name,value){
    if(typeof value!=='string')return value;
    if(!/^[\[{]/.test(value.trim()))return sanitizeText(value);
    try{const walk=v=>{if(typeof v==='string')return sanitizeText(v);if(Array.isArray(v))return v.map(walk);if(v&&typeof v==='object'){const o={};Object.entries(v).forEach(([k,x])=>o[k]=walk(x));return o;}return v;};return JSON.stringify(walk(JSON.parse(value)));}catch(_){return sanitizeText(value);}
  }

  storageProto.getItem=function(key){const name=String(key==null?'':key);if(!demoActive())return rawGet.call(this,key);if(this===global.localStorage)return demoLocal.has(name)?demoLocal.get(name):null;if(this===global.sessionStorage){if(name===USER_KEY)return rawGet.call(this,key);return demoSession.has(name)?demoSession.get(name):null;}return rawGet.call(this,key);};
  storageProto.setItem=function(key,value){const name=String(key==null?'':key),was=demoActive();if(this===global.sessionStorage&&name===USER_KEY){const result=rawSet.call(this,key,value);if(!was&&isDemoUser(parse(value)))queueReload();return result;}if(!was)return rawSet.call(this,key,value);if(this===global.localStorage){demoLocal.set(name,sanitizeStored(name,String(value)));return;}if(this===global.sessionStorage){demoSession.set(name,String(value));return;}return rawSet.call(this,key,value);};
  storageProto.removeItem=function(key){const name=String(key==null?'':key);if(this===global.sessionStorage&&name===USER_KEY)return rawRemove.call(this,key);if(!demoActive())return rawRemove.call(this,key);if(this===global.localStorage){demoLocal.delete(name);return;}if(this===global.sessionStorage){demoSession.delete(name);return;}return rawRemove.call(this,key);};
  storageProto.clear=function(){if(!demoActive())return rawClear.call(this);if(this===global.localStorage){demoLocal.clear();Object.entries(STORAGE_SEED).forEach(([k,v])=>demoLocal.set(k,v));return;}if(this===global.sessionStorage){demoSession.clear();demoSession.set('qmes_current_tab','dash');return;}return rawClear.call(this);};

  function api(data,message='DEMO OK',status=200){return new Response(JSON.stringify({success:status>=200&&status<300,message,data}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
  function urlOf(input){try{if(typeof input==='string')return new URL(input,global.location.href);if(input&&input.url)return new URL(input.url,global.location.href);}catch(_){ }return null;}
  function methodOf(input,init){return String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();}
  async function bodyOf(input,init){try{let b=init&&init.body;if(b==null&&input instanceof Request)b=await input.clone().text();if(typeof b==='string')return parse(b)||b;return b||null;}catch(_){return null;}}
  function syncRecords(type){
    const updated=`${YEAR}-12-31T17:00:00+09:00`;
    if(type==='iqc')return DB.iqc.map(r=>({record_key:r.inNo,payload:{mode:'IQC',lotNo:r.lot,rows:[r],savedAt:updated,savedBy:'이시연'},updated_at:updated}));
    if(type==='pqc'||type==='oqc'){const src=type==='pqc'?DB.insp.PQC:DB.insp.OQC,map=new Map();src.forEach(r=>{const k=r.groupId||r.id;if(!map.has(k))map.set(k,[]);map.get(k).push(r);});return [...map.entries()].map(([k,rows])=>({record_key:k,payload:{mode:type.toUpperCase(),lotNo:rows[0]?.lot||'',rows,savedAt:updated,savedBy:'이시연'},updated_at:updated}));}
    if(type==='workorder'){const base=DB.batches.map(b=>({record_key:b.lot,payload:{lotNo:b.lot,batch:b,doc:DB.woDocs[b.lot]||{},workOrder:DB.woDocs[b.lot]||{},savedAt:updated},updated_at:updated}));return [...base,...PROCESS_SYNC];}
    if(type==='equipment')return DB.eqLogs.map(r=>({record_key:r.id,payload:{entry:r,savedAt:updated},updated_at:updated}));
    if(type==='inventory'){const tx=INVENTORY.transactions.map(r=>({record_key:`tx:${r.id}`,payload:{kind:'transaction',transaction:r,savedAt:updated},updated_at:updated}));tx.push({record_key:'erp:purchase',payload:{module:'erp',kind:'purchase',rows:ERP.purchase,savedAt:updated},updated_at:updated},{record_key:'erp:plan',payload:{module:'erp',kind:'plan',rows:ERP.plan,savedAt:updated},updated_at:updated});return tx;}
    return [];
  }

  global.fetch=async function qmesCustomerDemoFetch(input,init){
    const url=urlOf(input),method=methodOf(input,init);if(!demoActive()||!url||url.origin!==global.location.origin)return previousFetch(input,init);
    if(url.pathname.startsWith('/api/auth/'))return previousFetch(input,init);
    if(method==='GET'||method==='HEAD'){
      if(url.pathname==='/api/purchase-orders')return api(ERP.purchase,'DEMO 구매발주');
      const sm=url.pathname.match(/^\/api\/qmes-sync\/(iqc|pqc|oqc|workorder|equipment|inventory)$/i);if(sm)return api(syncRecords(sm[1].toLowerCase()),'DEMO 공용 연동 데이터');
      if(url.pathname==='/api/users/signable'||url.pathname==='/api/users')return api(DEMO_USERS,'DEMO 사용자');
      if(url.pathname==='/api/inventory/stock')return api(INVENTORY.stock,'DEMO 재고현황');
      if(url.pathname==='/api/inventory/summary')return api(inventorySummary(),'DEMO 재고요약');
      if(url.pathname==='/api/inventory/transactions')return api(INVENTORY.transactions.slice().reverse(),'DEMO 입출고');
      if(url.pathname==='/api/inventory/counts')return api(INVENTORY.counts.slice().reverse(),'DEMO 재고실사');
      if(url.pathname==='/api/inventory/locations')return api(INVENTORY.locations,'DEMO 위치');
      if(url.pathname==='/api/inventory/items')return api(INVENTORY.items,'DEMO 품목');
      if(url.pathname==='/api/inventory/reservations')return api(INVENTORY.reservations,'DEMO 생산예약');
      if(url.pathname==='/api/worklog')return api(DB.popEntries,'DEMO 작업일지');
      if(url.pathname.startsWith('/api/'))return api([],'DEMO 보호 데이터');
    }
    if(url.pathname.startsWith('/api/')){
      const body=await bodyOf(input,init);
      if(url.pathname==='/api/inventory/counts'&&method==='POST'&&body&&typeof body==='object'){const row={id:`CNT-DEMO-${Date.now()}`,count_date:body.count_date||new Date().toISOString().slice(0,10),item_code:body.item_code||body.itemCode||'DEMO-RM-A01',item_name:body.item_name||body.itemName||'DEMO 용제 A',lot_no:body.lot_no||body.lotNo||'DEMO-LOT',location_code:body.location_code||body.locationCode||'RM-A01',book_qty:num(body.book_qty||body.bookQty),actual_qty:num(body.actual_qty||body.actualQty),difference_qty:num(body.actual_qty||body.actualQty)-num(body.book_qty||body.bookQty),counted_by:'DEMO 사용자',remark:'DEMO 샌드박스 실사'};INVENTORY.counts.unshift(row);return api(row,'DEMO 재고실사 저장');}
      return api({demo:true,sandbox:true,method,path:url.pathname,payload:body},'DEMO 샌드박스 저장 완료');
    }
    return previousFetch(input,init);
  };

  function installDemoMasters(){
    if(!demoActive())return;
    const demoItems=[...Object.values(DB.itemMaster)];
    const getItem=value=>{const key=clean(value).toUpperCase();if(/NBA20-HM01|DBA1501|절연슬러리/i.test(key))return DB.itemMaster[PRODUCTS[0].code];return demoItems.find(r=>clean(r.code).toUpperCase()===key||clean(r.name).toUpperCase()===key)||null;};
    const recipeFor=value=>{const item=getItem(value)||DB.itemMaster[PRODUCTS[0].code];return Object.values(DB.recipeMaster).find(r=>r.productCode===item.code&&r.active!==false)||DB.recipeMaster[`${PRODUCTS[0].code}@DEMO-R3`];};
    const calculatePlan=(value,qty)=>{const recipe=recipeFor(value),q=num(qty),total=recipe.totalRatio||100;return {ok:q>0,recipeId:recipe.id,recipeVersion:recipe.version,productCode:recipe.productCode,productName:recipe.productName,planQty:q,unit:'kg',materials:recipe.materials.map(m=>({...m,std:Number((q*m.ratio/total).toFixed(3)),planQty:q,recipeVersion:recipe.version}))};};
    global.qmesItemMaster={...(global.qmesItemMaster||{}),__demoWrapped:true,list:filter=>demoItems.filter(r=>!filter?.type||r.type===filter.type),get:getItem,seed:()=>({before:demoItems.length,after:demoItems.length,added:0})};
    global.qmesRecipeMaster={...(global.qmesRecipeMaster||{}),__demoWrapped:true,getActive:recipeFor,calculatePlan};
  }

  function ensureStyle(){if(document.getElementById('qmes-customer-demo-style'))return;const s=document.createElement('style');s.id='qmes-customer-demo-style';s.textContent=`#qmes-customer-demo-badge{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid #8ed7ca;border-radius:999px;background:rgba(240,253,250,.98);box-shadow:0 12px 34px rgba(13,148,136,.18);color:#315b57;font:850 11px Pretendard,'Noto Sans KR',sans-serif;pointer-events:none}#qmes-customer-demo-badge b{color:#0f8b83;letter-spacing:.5px}.qmes-demo-story{margin:0 0 14px;padding:12px 15px;border:1px solid #bde7df;border-radius:11px;background:linear-gradient(90deg,#effcf9,#f7fbff);box-shadow:0 5px 18px rgba(15,118,110,.07);font-family:Pretendard,'Noto Sans KR',sans-serif}.qmes-demo-story b{display:block;color:#0f766e;font-size:12px;font-weight:950}.qmes-demo-story span{display:block;margin-top:4px;color:#334155;font-size:11px;font-weight:800}.qmes-demo-story em{display:block;margin-top:4px;color:#64748b;font-size:9.5px;font-style:normal;font-weight:700}`;document.head.appendChild(s);}
  let scrubQueued=false;
  function scrubElement(root){if(!demoActive()||!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){const next=sanitizeText(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;}const nodes=root.matches?.('input,textarea,option,select')?[root,...root.querySelectorAll('input,textarea,option,select')]:[...root.querySelectorAll?.('input,textarea,option,select')||[]];nodes.forEach(el=>{if('value'in el&&el.value){const v=sanitizeText(el.value);if(v!==el.value)el.value=v;}['placeholder','title','aria-label'].forEach(a=>{const v=el.getAttribute?.(a);if(v){const x=sanitizeText(v);if(x!==v)el.setAttribute(a,x);}});});}
  function enhance(){
    if(!demoActive())return;ensureStyle();document.documentElement.setAttribute('data-qmes-demo','true');global.__QMES_DEMO_MODE__=true;global.__QMES_DEMO_SPECS__=clone(DEMO_SPECS);global.__QMES_DEMO_DATA__={year:YEAR,products:clone(PRODUCTS),materials:clone(MATERIALS),customers:clone(CUSTOMERS),db:DB,erp:ERP,inventory:INVENTORY};installDemoMasters();
    let badge=document.getElementById('qmes-customer-demo-badge');if(!badge){badge=document.createElement('div');badge.id='qmes-customer-demo-badge';badge.innerHTML='<b>CUSTOMER DEMO</b><span>100% 가상 데이터 · 운영 DB 완전 분리</span>';document.body.appendChild(badge);}
    const dash=document.querySelector('.namo-enterprise-dashboard');if(dash&&!dash.querySelector('.qmes-demo-story')){const banner=document.createElement('div');banner.className='qmes-demo-story';banner.innerHTML='<b>End-to-End QMES Customer Showcase</b><span>수주 → 생산계획/MRP → 구매/수입검사 → 원재료 LOT/투입 → 생산공정 → PQC/OQC → 완제품 LOT/재고 → 출하·납기</span><em>모든 회사명·품명·품번·LOT·SPEC·수량은 고객 시연용 가상 데이터이며 각 단계는 동일 문서번호와 LOT로 연결됩니다.</em>';dash.prepend(banner);}
    scrubElement(document.body);
  }
  function scheduleEnhance(){if(scrubQueued)return;scrubQueued=true;requestAnimationFrame(()=>{scrubQueued=false;enhance();});}
  new MutationObserver(scheduleEnhance).observe(document.documentElement,{childList:true,subtree:true});
  global.addEventListener('qmes:item-recipe-master-ready',()=>setTimeout(installDemoMasters,0));
  global.addEventListener('qmes:enterprise-ui-ready',scheduleEnhance);
  global.addEventListener('qmes:navigate-tab',scheduleEnhance);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
  global.addEventListener('load',enhance,{once:true});
})(window);
