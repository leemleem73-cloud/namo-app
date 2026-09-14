/* NAMO QMES guest demo mode - 2026-09-14
 * Login: guest / 1234 (server-side auth hook)
 * Guest sees the normal QMES screens with isolated Jan-Dec example data.
 * Production/local user data is never exposed, overwritten, deleted, or changed.
 * All UI controls remain visible, but write actions are blocked (read-only demo).
 */
(function installQmesGuestDemo(global){
  "use strict";
  if(global.__QMES_GUEST_DEMO_20260914__)return;
  global.__QMES_GUEST_DEMO_20260914__=true;

  const USER_KEY="qmes-current-user-v1";
  const DB_KEY="qmes-local-shipment-dashboard-v8-clean";
  const DEMO_YEAR=new Date().getFullYear();
  const DEMO_YY=String(DEMO_YEAR).slice(-2);
  const CURRENT_MONTH=new Date().getMonth()+1;
  const MONTHLY_SHIPMENT_KG=[1680,1920,2250,2140,2680,2410,2950,3180,2760,3320,3050,3540];
  const PRODUCTS=["DEMO 절연 슬러리 A","DEMO 절연 슬러리 B","DEMO Binder Solution"];
  const CUSTOMERS=["DEMO 고객사 A","DEMO 고객사 B","DEMO 고객사 C"];
  const SUPPLIERS=["DEMO 공급사 A","DEMO 공급사 B","DEMO 공급사 C"];
  const MATERIALS=["NMP","PVDF","SBR"];

  const SESSION_ALLOW=new Set([
    USER_KEY,
    "qmes_current_tab",
    "qmes_open_menu",
    "qmes_inventory_section",
    "qmes_field_shortcut_mode"
  ]);
  const LOCAL_UI_ALLOW=new Set([
    "qmes_current_tab",
    "qmes_open_menu",
    "qmes_inventory_section",
    "qmes_field_shortcut_mode",
    "qmes_selected_wo"
  ]);

  const pad2=value=>String(value).padStart(2,"0");
  const dateOf=(month,day)=>`${DEMO_YEAR}-${pad2(month)}-${pad2(day)}`;
  const isoOf=(month,day,time="09:00:00")=>`${dateOf(month,day)}T${time}+09:00`;

  const DEMO_DB={
    batches:[],
    woDocs:{},
    iqc:[],
    iqcMaterials:[
      {id:"MAT-DEMO-NMP",material:"NMP",name:"NMP",supplier:"DEMO 공급사 A",unit:"kg",status:"사용"},
      {id:"MAT-DEMO-PVDF",material:"PVDF",name:"PVDF",supplier:"DEMO 공급사 B",unit:"kg",status:"사용"},
      {id:"MAT-DEMO-SBR",material:"SBR",name:"SBR",supplier:"DEMO 공급사 C",unit:"kg",status:"사용"}
    ],
    insp:{PQC:[],OQC:[]},
    holds:[],
    gateEvents:[],
    intermediateLots:{},
    intermediateContainers:{},
    materialRemainders:{},
    eqReadings:{
      "교반기 1호":{equipment:"교반기 1호",item:"회전상태",value:"정상",judge:"정상",date:dateOf(12,15)},
      "필터 시스템":{equipment:"필터 시스템",item:"압력",value:"0.18 MPa",judge:"정상",date:dateOf(12,15)}
    },
    eqLogs:[],
    eqAlarms:[],
    complaints:[],
    lots:{},
    coa:{},
    popEntries:[],
    auditLogs:[],
    ncr:[],
    change4m:[],
    trainings:[],
    seqs:{iqc:24,pqc:48,oqc:24,workorder:24}
  };

  const DEMO_ERP={sales:[],plan:[],purchase:[],shipping:[]};

  for(let month=1;month<=12;month+=1){
    const mm=pad2(month);
    const monthlyShip=MONTHLY_SHIPMENT_KG[month-1];
    const shipA=Math.round(monthlyShip*0.58);
    const shipB=monthlyShip-shipA;

    for(let index=1;index<=2;index+=1){
      const seq=pad2((month-1)*2+index);
      const product=PRODUCTS[(month+index-2)%PRODUCTS.length];
      const customer=CUSTOMERS[(month+index-2)%CUSTOMERS.length];
      const supplier=SUPPLIERS[(month+index-2)%SUPPLIERS.length];
      const material=MATERIALS[(month+index-2)%MATERIALS.length];
      const workOrder=`WO-DEMO-${DEMO_YY}${mm}-${index}`;
      const finishedLot=`FG-DEMO-${DEMO_YY}${mm}${index===1?"12":"22"}-0${index}`;
      const rawLot=`RM-DEMO-${material.replace(/\s+/g,"")}-${DEMO_YY}${mm}-0${index}`;
      const planQty=900+(month*35)+(index*140);
      const isCurrentActive=month===CURRENT_MONTH&&index===2;
      const prodQty=isCurrentActive?Math.round(planQty*0.69):Math.round(planQty*0.97);
      const productionStatus=isCurrentActive?"생산중":"완료";
      const productionDate=dateOf(month,index===1?12:22);
      const orderDate=dateOf(month,index===1?2:6);
      const dueDate=dateOf(month,index===1?18:26);
      const incomingDate=dateOf(month,index===1?7:10);
      const iqcPending=month===CURRENT_MONTH&&index===2;
      const iqcJudge=iqcPending?"검사대기":"합격";
      const purchaseStatus=iqcPending?"부분입고":"입고완료";
      const purchaseNo=`PUR-DEMO-${DEMO_YY}${mm}-${index}`;
      const salesNo=`SO-DEMO-${DEMO_YY}${mm}-${index}`;
      const shipNo=`SHIP-DEMO-${DEMO_YY}${mm}-${index}`;
      const shipQty=index===1?shipA:shipB;
      const shipDate=dateOf(month,index===1?15:25);
      const pqcGroup=`PQC-DEMO-${DEMO_YY}${mm}-${index}`;
      const oqcGroup=`OQC-DEMO-${DEMO_YY}${mm}-${index}`;
      const iqcNo=`IQC-DEMO-${DEMO_YY}${mm}-${index}`;

      DEMO_ERP.sales.push({
        id:salesNo,salesNo:salesNo,orderNo:salesNo,orderDate:orderDate,date:orderDate,
        customer:customer,po:`PO-DEMO-${DEMO_YY}${mm}-${index}`,product:product,item:product,
        qty:planQty,unit:"kg",due:dueDate,requestedDueDate:dueDate,
        plan:"반영완료",shipping:"출하완료",status:"수주확정"
      });

      DEMO_ERP.purchase.push({
        id:purchaseNo,purchaseNo:purchaseNo,poNo:purchaseNo,supplier:supplier,
        material:material,item:material,qty:1200+(month*45)+(index*180),unit:"kg",
        orderDate:orderDate,date:orderDate,due:dueDate,requestedDueDate:dueDate,
        expected:incomingDate,confirmedDueDate:incomingDate,received:iqcPending?650:1200+(month*45)+(index*180),
        iqc:iqcJudge,iqcStatus:iqcJudge,status:purchaseStatus,receiptStatus:purchaseStatus,
        productionType:index===1?"D-양산":"C-Pilot",iqcRequired:true
      });

      DEMO_ERP.shipping.push({
        id:shipNo,shipNo:shipNo,shippingNo:shipNo,date:shipDate,actualShipDate:shipDate,
        shipDate:shipDate,due:dueDate,requestedDueDate:dueDate,sales:salesNo,customer:customer,
        product:product,item:product,lot:finishedLot,finishedLot:finishedLot,workOrder:workOrder,
        qty:shipQty,shipQty:shipQty,unit:"kg",oqc:"합격",coa:"발행",delivery:"출하완료",status:"출하완료"
      });

      const batch={
        id:workOrder,no:workOrder,workOrderNo:workOrder,workOrder:workOrder,
        lot:finishedLot,lotNo:finishedLot,finishedLot:finishedLot,product:product,item:product,
        customer:customer,date:productionDate,plan:planQty,planQty:planQty,qty:planQty,
        prodQty:prodQty,productionQty:prodQty,actualQty:prodQty,status:productionStatus,
        progress:isCurrentActive?69:100,worker:"데모 작업자"
      };
      DEMO_DB.batches.push(batch);

      const woDoc={
        id:workOrder,workOrderNo:workOrder,workOrder:workOrder,lot:finishedLot,lotNo:finishedLot,
        product:product,customer:customer,planQty:planQty,qty:planQty,prodQty:prodQty,
        productionActual:prodQty,actualQty:prodQty,status:productionStatus,manualStatus:productionStatus,
        date:productionDate,worker:"데모 작업자",materials:[
          {material:"NMP",lot:`RM-DEMO-NMP-${DEMO_YY}${mm}-01`,qty:Math.round(planQty*0.70),act:Math.round(planQty*0.70)},
          {material:material,lot:rawLot,qty:Math.round(planQty*0.18),act:Math.round(planQty*0.18)},
          {material:"첨가제",lot:`RM-DEMO-ADD-${DEMO_YY}${mm}-0${index}`,qty:Math.round(planQty*0.04),act:Math.round(planQty*0.04)}
        ],inputs:[
          {material:"NMP",lot:`RM-DEMO-NMP-${DEMO_YY}${mm}-01`,actual:Math.round(prodQty*0.70),act:Math.round(prodQty*0.70)},
          {material:material,lot:rawLot,actual:Math.round(prodQty*0.18),act:Math.round(prodQty*0.18)}
        ]
      };
      DEMO_DB.woDocs[workOrder]=woDoc;
      DEMO_DB.woDocs[finishedLot]=woDoc;

      DEMO_DB.iqc.push({
        id:iqcNo,inNo:iqcNo,serverId:iqcNo,inspectionNo:iqcNo,material:material,item:material,
        lot:rawLot,lotNo:rawLot,supplier:supplier,recv:incomingDate,receivedAt:incomingDate,
        inspectedAt:incomingDate,date:incomingDate,qty:1200+(month*45)+(index*180),
        incomingQty:1200+(month*45)+(index*180),judge:iqcJudge,status:iqcJudge,
        inspector:"데모 검사자",remark:"DEMO 예시 데이터"
      });

      DEMO_DB.insp.PQC.push(
        {id:`${pqcGroup}-V`,groupId:pqcGroup,lot:finishedLot,product:product,item:"점도",check:"점도",value:String(1460+month*8+index*12),spec:"1400~1650",judge:"합격",date:productionDate,inspector:"데모 검사자"},
        {id:`${pqcGroup}-S`,groupId:pqcGroup,lot:finishedLot,product:product,item:"고형분",check:"고형분",value:(41.2+(month%4)*0.3+index*0.1).toFixed(1),spec:"41.0~43.0",judge:"합격",date:productionDate,inspector:"데모 검사자"}
      );

      DEMO_DB.insp.OQC.push({
        id:oqcGroup,groupId:oqcGroup,lot:finishedLot,product:product,item:"최종검사",check:"최종검사",
        judge:isCurrentActive?"검사대기":"합격",status:isCurrentActive?"검사대기":"합격",
        date:productionDate,inspector:"데모 검사자",customer:customer
      });

      DEMO_DB.lots[finishedLot]={
        id:finishedLot,lot:finishedLot,lotNo:finishedLot,product:product,item:product,
        qty:prodQty,currentQty:Math.max(0,prodQty-shipQty),amount:Math.max(0,prodQty-shipQty),
        status:productionStatus,date:productionDate,productionDate:productionDate,customer:customer,
        workOrder:workOrder
      };

      DEMO_DB.coa[finishedLot]={
        id:`COA-DEMO-${DEMO_YY}${mm}-${index}`,no:`COA-DEMO-${DEMO_YY}${mm}-${index}`,
        lot:finishedLot,product:product,customer:customer,status:"발행",date:productionDate,
        issuedAt:productionDate
      };

      DEMO_DB.popEntries.push({
        id:`POP-DEMO-${DEMO_YY}${mm}-${index}`,workOrderNo:workOrder,lot:finishedLot,
        product:product,qty:prodQty,date:productionDate,worker:"데모 작업자",status:productionStatus
      });

      DEMO_DB.eqLogs.push({
        id:`EQ-DEMO-${DEMO_YY}${mm}-${index}`,equipment:index===1?"교반기 1호":"필터 시스템",
        name:index===1?"교반기 1호":"필터 시스템",date:productionDate,
        item:index===1?"회전상태":"압력",value:index===1?"정상":`${(0.15+(month%4)*0.01).toFixed(2)} MPa`,
        judge:"정상",inspector:"데모 작업자",by:"데모 작업자"
      });

      DEMO_DB.auditLogs.push(
        {id:`AUD-IQC-${DEMO_YY}${mm}-${index}`,module:"IQC",action:"검사 완료",target:rawLot,reason:iqcJudge,by:"데모 검사자",at:isoOf(month,index===1?7:10,"10:30:00")},
        {id:`AUD-WO-${DEMO_YY}${mm}-${index}`,module:"생산",action:productionStatus==="완료"?"실적 완료":"생산 진행",target:finishedLot,reason:"DEMO 예시 데이터",by:"데모 작업자",at:isoOf(month,index===1?12:22,"16:20:00")}
      );
    }

    DEMO_ERP.plan.push({
      id:`PLAN-DEMO-${DEMO_YY}${mm}`,date:dateOf(month,5),month:`${DEMO_YEAR}-${mm}`,
      product:PRODUCTS[(month-1)%PRODUCTS.length],qty:1800+month*110,unit:"kg",revision:`Rev.DEMO-${mm}`,status:"확정"
    });

    DEMO_DB.complaints.push({
      id:`CC-DEMO-${DEMO_YY}${mm}`,no:`CC-DEMO-${DEMO_YY}${mm}`,customer:CUSTOMERS[(month-1)%CUSTOMERS.length],
      product:PRODUCTS[(month-1)%PRODUCTS.length],lot:`FG-DEMO-${DEMO_YY}${mm}12-01`,date:dateOf(month,8),
      title:month%2===0?"포장 라벨 확인 요청":"납품 문서 확인 요청",status:"완료",
      action:"DEMO 기준 확인 완료",owner:"데모 담당자"
    });

    DEMO_DB.intermediateLots[`INT-DEMO-${DEMO_YY}${mm}`]={
      id:`INT-DEMO-${DEMO_YY}${mm}`,lot:`INT-DEMO-${DEMO_YY}${mm}`,
      product:PRODUCTS[(month-1)%PRODUCTS.length],qty:420+month*15,date:dateOf(month,11),status:"사용완료"
    };
    DEMO_DB.intermediateContainers[`CONT-DEMO-${DEMO_YY}${mm}`]={
      id:`CONT-DEMO-${DEMO_YY}${mm}`,lot:`INT-DEMO-${DEMO_YY}${mm}`,container:`DEMO-C-${mm}`,
      qty:210+month*8,date:dateOf(month,11),status:"정상"
    };
    DEMO_DB.materialRemainders[`REM-DEMO-${DEMO_YY}${mm}`]={
      id:`REM-DEMO-${DEMO_YY}${mm}`,material:MATERIALS[(month-1)%MATERIALS.length],
      lot:`RM-DEMO-${MATERIALS[(month-1)%MATERIALS.length]}-${DEMO_YY}${mm}-01`,qty:80+month*5,
      date:dateOf(month,27),status:"보관"
    };

    if(month%3===0){
      DEMO_DB.holds.push({
        id:`HOLD-DEMO-${DEMO_YY}${mm}`,target:`RM-DEMO-ADD-${DEMO_YY}${mm}-02`,reason:"외관 확인 필요",
        gate:"IQC",status:"격리",by:"데모 검사자",at:isoOf(month,13,"09:10:00")
      });
      DEMO_DB.gateEvents.push({
        id:`GATE-DEMO-${DEMO_YY}${mm}`,gate:"원재료 투입",lot:`RM-DEMO-ADD-${DEMO_YY}${mm}-02`,
        reason:"IQC 판정 확인",status:"차단",by:"데모 검사자",at:isoOf(month,13,"09:12:00")
      });
    }

    if(month%4===0){
      DEMO_DB.eqAlarms.push({
        id:`EQ-ALARM-DEMO-${DEMO_YY}${mm}`,equipment:"필터 시스템",date:dateOf(month,18),
        title:"점검 주기 확인",status:"조치완료",owner:"데모 작업자"
      });
    }

    DEMO_DB.ncr.push({
      id:`NCR-DEMO-${DEMO_YY}${mm}`,no:`NCR-DEMO-${DEMO_YY}${mm}`,date:dateOf(month,19),
      product:PRODUCTS[(month-1)%PRODUCTS.length],lot:`FG-DEMO-${DEMO_YY}${mm}12-01`,
      title:"DEMO 경미 이탈 확인",status:"완료",owner:"데모 품질담당"
    });
    DEMO_DB.change4m.push({
      id:`4M-DEMO-${DEMO_YY}${mm}`,date:dateOf(month,21),category:["Man","Machine","Material","Method"][(month-1)%4],
      title:"DEMO 4M 변경 검토",status:"승인완료",owner:"데모 담당자"
    });
    DEMO_DB.trainings.push({
      id:`TR-DEMO-${DEMO_YY}${mm}`,date:dateOf(month,24),title:`${month}월 QMES 교육`,attendees:6+(month%4),status:"완료",trainer:"데모 교육자"
    });
  }

  const DEMO_STORAGE={
    [DB_KEY]:JSON.stringify(DEMO_DB),
    "qmes-erp-sales-v1":JSON.stringify(DEMO_ERP.sales),
    "qmes-erp-plan-v1":JSON.stringify(DEMO_ERP.plan),
    "qmes-erp-purchase-v1":JSON.stringify(DEMO_ERP.purchase),
    "qmes-erp-shipping-v1":JSON.stringify(DEMO_ERP.shipping)
  };

  const storageProto=global.Storage&&global.Storage.prototype;
  if(!storageProto)return;
  const rawGet=storageProto.getItem;
  const rawSet=storageProto.setItem;
  const rawRemove=storageProto.removeItem;
  const rawClear=storageProto.clear;
  const inheritedFetch=global.fetch.bind(global);
  let reloadQueued=false;

  function parse(value){try{return JSON.parse(String(value||""));}catch(_error){return null;}}
  function rawCurrentUser(){try{return parse(rawGet.call(global.sessionStorage,USER_KEY));}catch(_error){return null;}}
  function isGuestUser(user){
    return Boolean(user&&(
      String(user.role||"").toLowerCase()==="guest"||
      String(user.id||"").toLowerCase()==="guest"||
      String(user.uid||"").toUpperCase()==="GUEST"
    ));
  }
  function guestActive(){return isGuestUser(rawCurrentUser());}
  function queueReload(){if(reloadQueued)return;reloadQueued=true;setTimeout(function(){global.location.reload();},100);}

  storageProto.getItem=function(key){
    const name=String(key==null?"":key);
    if(guestActive()){
      if(this===global.localStorage){
        if(Object.prototype.hasOwnProperty.call(DEMO_STORAGE,name))return DEMO_STORAGE[name];
        if(LOCAL_UI_ALLOW.has(name))return rawGet.call(this,key);
        return null;
      }
      if(this===global.sessionStorage&&!SESSION_ALLOW.has(name))return null;
    }
    return rawGet.call(this,key);
  };

  storageProto.setItem=function(key,value){
    const name=String(key==null?"":key);
    const wasGuest=guestActive();
    if(wasGuest){
      if(this===global.localStorage){
        if(!LOCAL_UI_ALLOW.has(name))return;
        return rawSet.call(this,key,value);
      }
      if(this===global.sessionStorage&&!SESSION_ALLOW.has(name))return;
    }
    const result=rawSet.call(this,key,value);
    if(this===global.sessionStorage&&name===USER_KEY&&!wasGuest&&isGuestUser(parse(value)))queueReload();
    return result;
  };

  storageProto.removeItem=function(key){
    const name=String(key==null?"":key);
    if(guestActive()){
      if(this===global.localStorage&&!LOCAL_UI_ALLOW.has(name))return;
      if(this===global.sessionStorage&&!SESSION_ALLOW.has(name))return;
    }
    return rawRemove.call(this,key);
  };

  storageProto.clear=function(){
    if(guestActive()&&(this===global.localStorage||this===global.sessionStorage))return;
    return rawClear.call(this);
  };

  function apiResponse(data,message="OK",status=200){
    return new Response(JSON.stringify({success:status>=200&&status<300,message:message,data:data}),{
      status:status,
      headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
    });
  }
  function urlOf(input){
    try{
      if(typeof input==="string")return new URL(input,global.location.href);
      if(input&&input.url)return new URL(input.url,global.location.href);
    }catch(_error){}
    return null;
  }
  function qmesSyncRecords(type){
    const updatedAt=`${DEMO_YEAR}-12-31T17:00:00+09:00`;
    if(type==="iqc")return DEMO_DB.iqc.map(row=>({record_key:row.inNo||row.id,payload:{mode:"IQC",lotNo:row.lot,rows:[row],savedAt:updatedAt,savedBy:"데모 검사자"},updated_at:updatedAt}));
    if(type==="pqc"||type==="oqc"){
      const source=type==="pqc"?DEMO_DB.insp.PQC:DEMO_DB.insp.OQC;
      const grouped=new Map();
      source.forEach(row=>{const key=String(row.groupId||row.id);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);});
      return Array.from(grouped,function(entry){const key=entry[0],rows=entry[1];return {record_key:key,payload:{mode:type.toUpperCase(),lotNo:rows[0]?.lot||"",rows:rows,savedAt:updatedAt,savedBy:"데모 검사자"},updated_at:updatedAt};});
    }
    if(type==="workorder")return DEMO_DB.batches.map(row=>({record_key:row.workOrderNo,payload:{workOrder:row,document:DEMO_DB.woDocs[row.workOrderNo]||null,savedAt:updatedAt},updated_at:updatedAt}));
    if(type==="equipment")return DEMO_DB.eqLogs.map(row=>({record_key:row.id,payload:{entry:row,savedAt:updatedAt},updated_at:updatedAt}));
    if(type==="inventory")return Object.values(DEMO_DB.lots).map(row=>({record_key:row.lot,payload:{lotNo:row.lot,lotRecord:row,savedAt:updatedAt},updated_at:updatedAt}));
    return [];
  }

  global.fetch=async function qmesGuestDemoFetch(input,init){
    const url=urlOf(input);
    const method=String((init&&init.method)||(input&&input.method)||"GET").toUpperCase();
    if(!guestActive()||!url||url.origin!==global.location.origin)return inheritedFetch(input,init);

    if(url.pathname==="/api/purchase-orders"&&(method==="GET"||method==="HEAD")){
      return apiResponse(DEMO_ERP.purchase,"DEMO 구매발주");
    }
    const syncMatch=url.pathname.match(/^\/api\/qmes-sync\/(iqc|pqc|oqc|workorder|equipment|inventory)$/i);
    if(syncMatch&&(method==="GET"||method==="HEAD")){
      return apiResponse(qmesSyncRecords(syncMatch[1].toLowerCase()),"DEMO 공용 데이터");
    }
    if(url.pathname.startsWith("/api/")&&method!=="GET"&&method!=="HEAD"&&url.pathname!=="/api/auth/logout"){
      return apiResponse(null,"DEMO 계정은 읽기 전용입니다.",403);
    }
    return inheritedFetch(input,init);
  };

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function ensureStyle(){
    if(document.getElementById("qmes-guest-demo-style-20260914"))return;
    const style=document.createElement("style");
    style.id="qmes-guest-demo-style-20260914";
    style.textContent=`
      #qmes-guest-demo-badge{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #b9cfdd;border-radius:999px;background:rgba(248,252,254,.97);box-shadow:0 8px 24px rgba(24,58,82,.14);color:#36566d;font:850 11px Pretendard,'Noto Sans KR',sans-serif;pointer-events:none}
      #qmes-guest-demo-badge b{color:#087ca8}
    `;
    document.head.appendChild(style);
  }
  function syncDemoUi(){
    ensureStyle();
    const active=guestActive();
    document.documentElement.toggleAttribute("data-qmes-demo",active);
    global.__QMES_DEMO_MODE__=active;
    global.__QMES_DEMO_DATA__=active?{year:DEMO_YEAR,monthlyShipmentKg:MONTHLY_SHIPMENT_KG.slice(),db:DEMO_DB,erp:DEMO_ERP}:null;
    const existing=document.getElementById("qmes-guest-demo-badge");
    if(!active){existing?.remove();return;}
    if(existing)return;
    const badge=document.createElement("div");
    badge.id="qmes-guest-demo-badge";
    badge.innerHTML="<b>DEMO</b><span>게스트 · 1~12월 예시 데이터 · 읽기 전용</span>";
    document.body.appendChild(badge);
  }

  function isWriteControl(control){
    const text=clean(control?.textContent||control?.value||control?.getAttribute?.("aria-label")||control?.getAttribute?.("title"));
    return /(저장|등록|추가|수정|삭제|승인|반려|발행|차단|해제|초기화|복원|신규|확정|완료처리|비밀번호 변경|입고처리|출고처리|재고조정|발주|수주등록|작업지시 생성)/.test(text);
  }
  function readonlyAlert(){alert("DEMO 계정은 1~12월 예시 데이터를 읽기만 할 수 있습니다. 저장·수정·삭제 등 쓰기 기능은 사용할 수 없습니다.");}

  document.addEventListener("click",function(event){
    if(!guestActive())return;
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const control=target.closest('button,input[type="button"],input[type="submit"],a');
    if(!control||!isWriteControl(control))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    readonlyAlert();
  },true);

  document.addEventListener("submit",function(event){
    if(!guestActive())return;
    event.preventDefault();
    event.stopImmediatePropagation();
    readonlyAlert();
  },true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncDemoUi,{once:true});
  else syncDemoUi();
  global.addEventListener("load",syncDemoUi,{once:true});
})(window);
