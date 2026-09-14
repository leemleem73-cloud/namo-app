/* NAMO QMES guest demo mode - 2026-09-14
 * Login: guest / 1234 (server-side auth hook)
 * Guest sees the normal QMES screens with isolated example data.
 * Production/local user data is never exposed, overwritten, deleted, or changed.
 * All UI controls remain visible, but write actions are blocked (read-only demo).
 */
(function installQmesGuestDemo(global){
  "use strict";
  if(global.__QMES_GUEST_DEMO_20260914__)return;
  global.__QMES_GUEST_DEMO_20260914__=true;

  const USER_KEY="qmes-current-user-v1";
  const DB_KEY="qmes-local-shipment-dashboard-v8-clean";
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

  const DEMO_DB={
    batches:[
      {id:"WO-DEMO-001",no:"WO-DEMO-001",workOrderNo:"WO-DEMO-001",lot:"FG-DEMO-260911-01",finishedLot:"FG-DEMO-260911-01",product:"절연 슬러리 A",item:"절연 슬러리 A",customer:"DEMO 고객사 A",date:"2026-09-11",planQty:1200,qty:1200,prodQty:1180,status:"완료",progress:100},
      {id:"WO-DEMO-002",no:"WO-DEMO-002",workOrderNo:"WO-DEMO-002",lot:"FG-DEMO-260912-01",finishedLot:"FG-DEMO-260912-01",product:"절연 슬러리 B",item:"절연 슬러리 B",customer:"DEMO 고객사 B",date:"2026-09-12",planQty:900,qty:900,prodQty:620,status:"생산중",progress:69},
      {id:"WO-DEMO-003",no:"WO-DEMO-003",workOrderNo:"WO-DEMO-003",lot:"FG-DEMO-260914-01",finishedLot:"FG-DEMO-260914-01",product:"Binder Solution",item:"Binder Solution",customer:"DEMO 고객사 C",date:"2026-09-14",planQty:750,qty:750,prodQty:0,status:"대기",progress:0}
    ],
    woDocs:{
      "FG-DEMO-260911-01":{id:"WO-DEMO-001",workOrderNo:"WO-DEMO-001",lot:"FG-DEMO-260911-01",product:"절연 슬러리 A",customer:"DEMO 고객사 A",planQty:1200,prodQty:1180,status:"완료",manualStatus:"완료",date:"2026-09-11",worker:"데모 작업자",materials:[{material:"NMP",lot:"RM-DEMO-NMP-01",qty:850},{material:"PVDF",lot:"RM-DEMO-PVDF-01",qty:120},{material:"첨가제",lot:"RM-DEMO-ADD-01",qty:45}]},
      "FG-DEMO-260912-01":{id:"WO-DEMO-002",workOrderNo:"WO-DEMO-002",lot:"FG-DEMO-260912-01",product:"절연 슬러리 B",customer:"DEMO 고객사 B",planQty:900,prodQty:620,status:"생산중",manualStatus:"생산중",date:"2026-09-12",worker:"데모 작업자",materials:[{material:"NMP",lot:"RM-DEMO-NMP-02",qty:610},{material:"SBR",lot:"RM-DEMO-SBR-01",qty:95}]}
    },
    iqc:[
      {id:"IQC-DEMO-001",inspectionNo:"IQC-DEMO-001",material:"NMP",item:"NMP",lot:"RM-DEMO-NMP-01",supplier:"DEMO 공급사 A",recv:"2026-09-08",inspectedAt:"2026-09-08",qty:2000,incomingQty:2000,judge:"합격",inspector:"데모 검사자",remark:"예시 데이터"},
      {id:"IQC-DEMO-002",inspectionNo:"IQC-DEMO-002",material:"PVDF",item:"PVDF",lot:"RM-DEMO-PVDF-01",supplier:"DEMO 공급사 B",recv:"2026-09-09",inspectedAt:"2026-09-09",qty:500,incomingQty:500,judge:"합격",inspector:"데모 검사자",remark:"예시 데이터"},
      {id:"IQC-DEMO-003",inspectionNo:"IQC-DEMO-003",material:"SBR",item:"SBR",lot:"RM-DEMO-SBR-01",supplier:"DEMO 공급사 C",recv:"2026-09-10",inspectedAt:"2026-09-10",qty:350,incomingQty:350,judge:"합격",inspector:"데모 검사자",remark:"예시 데이터"}
    ],
    iqcMaterials:[],
    insp:{
      PQC:[
        {id:"PQC-DEMO-001-1",groupId:"PQC-DEMO-001",lot:"FG-DEMO-260911-01",product:"절연 슬러리 A",item:"점도",value:"1520",spec:"1400~1650",judge:"합격",date:"2026-09-11",inspector:"데모 검사자"},
        {id:"PQC-DEMO-001-2",groupId:"PQC-DEMO-001",lot:"FG-DEMO-260911-01",product:"절연 슬러리 A",item:"고형분",value:"42.1",spec:"41.0~43.0",judge:"합격",date:"2026-09-11",inspector:"데모 검사자"},
        {id:"PQC-DEMO-002-1",groupId:"PQC-DEMO-002",lot:"FG-DEMO-260912-01",product:"절연 슬러리 B",item:"점도",value:"1495",spec:"1400~1650",judge:"합격",date:"2026-09-12",inspector:"데모 검사자"}
      ],
      OQC:[
        {id:"OQC-DEMO-001",groupId:"OQC-DEMO-001",lot:"FG-DEMO-260911-01",product:"절연 슬러리 A",item:"최종검사",judge:"합격",date:"2026-09-11",inspector:"데모 검사자",customer:"DEMO 고객사 A"},
        {id:"OQC-DEMO-002",groupId:"OQC-DEMO-002",lot:"FG-DEMO-260912-01",product:"절연 슬러리 B",item:"최종검사",judge:"검사대기",date:"2026-09-12",inspector:"데모 검사자",customer:"DEMO 고객사 B"}
      ]
    },
    holds:[
      {id:"HOLD-DEMO-001",target:"RM-DEMO-ADD-02",reason:"외관 확인 필요",gate:"IQC",status:"격리",by:"데모 검사자",at:"2026-09-13T09:10:00+09:00"}
    ],
    gateEvents:[
      {id:"GATE-DEMO-001",gate:"원재료 투입",lot:"RM-DEMO-ADD-02",reason:"IQC 판정 대기",status:"차단",by:"데모 검사자",at:"2026-09-13T09:12:00+09:00"}
    ],
    intermediateLots:{},
    intermediateContainers:{},
    materialRemainders:{},
    eqReadings:{},
    eqLogs:[
      {id:"EQ-DEMO-001",equipment:"교반기 1호",name:"교반기 1호",date:"2026-09-14",item:"회전상태",value:"정상",judge:"정상",inspector:"데모 작업자"},
      {id:"EQ-DEMO-002",equipment:"필터 시스템",name:"필터 시스템",date:"2026-09-14",item:"압력",value:"0.18 MPa",judge:"정상",inspector:"데모 작업자"}
    ],
    eqAlarms:[],
    complaints:[
      {id:"CC-DEMO-001",no:"CC-DEMO-001",customer:"DEMO 고객사 A",product:"절연 슬러리 A",lot:"FG-DEMO-260901-01",date:"2026-09-03",title:"포장 라벨 확인 요청",status:"완료",action:"라벨 표기 기준 재확인",owner:"데모 담당자"}
    ],
    lots:{
      "FG-DEMO-260911-01":{lot:"FG-DEMO-260911-01",product:"절연 슬러리 A",qty:1180,status:"완료",date:"2026-09-11"},
      "FG-DEMO-260912-01":{lot:"FG-DEMO-260912-01",product:"절연 슬러리 B",qty:620,status:"생산중",date:"2026-09-12"}
    },
    coa:{
      "FG-DEMO-260911-01":{lot:"FG-DEMO-260911-01",product:"절연 슬러리 A",customer:"DEMO 고객사 A",status:"발행",date:"2026-09-11",no:"COA-DEMO-001"}
    },
    popEntries:[
      {id:"POP-DEMO-001",lot:"FG-DEMO-260911-01",product:"절연 슬러리 A",qty:1180,date:"2026-09-11",worker:"데모 작업자",status:"완료"},
      {id:"POP-DEMO-002",lot:"FG-DEMO-260912-01",product:"절연 슬러리 B",qty:620,date:"2026-09-12",worker:"데모 작업자",status:"진행중"}
    ],
    auditLogs:[
      {id:"AUD-DEMO-001",module:"IQC",action:"검사 완료",target:"RM-DEMO-NMP-01",reason:"합격",by:"데모 검사자",at:"2026. 9. 8. 10:30:00"},
      {id:"AUD-DEMO-002",module:"생산",action:"실적 완료",target:"FG-DEMO-260911-01",reason:"예시 데이터",by:"데모 작업자",at:"2026. 9. 11. 16:20:00"}
    ],
    seqs:{iqc:3,pqc:2,oqc:2,workorder:3}
  };

  const DEMO_ERP={
    sales:[
      {id:"SO-DEMO-001",customer:"DEMO 고객사 A",po:"PO-DEMO-A01",product:"절연 슬러리 A",qty:1200,due:"2026-09-16",plan:"반영완료",shipping:"출하대기"},
      {id:"SO-DEMO-002",customer:"DEMO 고객사 B",po:"PO-DEMO-B01",product:"절연 슬러리 B",qty:900,due:"2026-09-18",plan:"반영완료",shipping:"생산중"},
      {id:"SO-DEMO-003",customer:"DEMO 고객사 C",po:"PO-DEMO-C01",product:"Binder Solution",qty:750,due:"2026-09-22",plan:"계획대기",shipping:"-"}
    ],
    plan:[
      {date:"2026-09-14",product:"Binder Solution",qty:750,revision:"Rev.DEMO"}
    ],
    purchase:[
      {id:"PUR-DEMO-001",purchaseNo:"PUR-DEMO-001",supplier:"DEMO 공급사 A",material:"NMP",item:"NMP",qty:2000,unit:"kg",orderDate:"2026-09-08",due:"2026-09-15",expected:"2026-09-15",received:1000,iqc:"합격",status:"부분입고",productionType:"D-양산"},
      {id:"PUR-DEMO-002",purchaseNo:"PUR-DEMO-002",supplier:"DEMO 공급사 B",material:"PVDF",item:"PVDF",qty:500,unit:"kg",orderDate:"2026-09-09",due:"2026-09-17",expected:"2026-09-16",received:500,iqc:"합격",status:"입고완료",productionType:"D-양산"},
      {id:"PUR-DEMO-003",purchaseNo:"PUR-DEMO-003",supplier:"DEMO 공급사 C",material:"SBR",item:"SBR",qty:350,unit:"kg",orderDate:"2026-09-10",due:"2026-09-19",expected:"2026-09-18",received:0,iqc:"예정",status:"발주완료",productionType:"C-Pilot"}
    ],
    shipping:[
      {shipNo:"SHIP-DEMO-001",shippingNo:"SHIP-DEMO-001",date:"2026-09-11",actualShipDate:"2026-09-11",sales:"SO-DEMO-001",customer:"DEMO 고객사 A",product:"절연 슬러리 A",lot:"FG-DEMO-260911-01",finishedLot:"FG-DEMO-260911-01",qty:230,shipQty:230,unit:"kg",oqc:"합격",coa:"발행",delivery:"출하완료"},
      {shipNo:"SHIP-DEMO-002",shippingNo:"SHIP-DEMO-002",date:"2026-09-12",actualShipDate:"2026-09-12",sales:"SO-DEMO-002",customer:"DEMO 고객사 B",product:"절연 슬러리 B",lot:"FG-DEMO-260912-01",finishedLot:"FG-DEMO-260912-01",qty:180,shipQty:180,unit:"kg",oqc:"검사대기",coa:"-",delivery:"배차대기"},
      {shipNo:"SHIP-DEMO-003",shippingNo:"SHIP-DEMO-003",date:"2026-09-14",actualShipDate:"2026-09-14",sales:"SO-DEMO-001",customer:"DEMO 고객사 A",product:"절연 슬러리 A",lot:"FG-DEMO-260911-01",finishedLot:"FG-DEMO-260911-01",qty:320,shipQty:320,unit:"kg",oqc:"합격",coa:"발행",delivery:"배차완료"}
    ]
  };

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
    global.__QMES_DEMO_DATA__=active?{db:DEMO_DB,erp:DEMO_ERP}:null;
    const existing=document.getElementById("qmes-guest-demo-badge");
    if(!active){existing?.remove();return;}
    if(existing)return;
    const badge=document.createElement("div");
    badge.id="qmes-guest-demo-badge";
    badge.innerHTML="<b>DEMO</b><span>게스트 · 예시 데이터 · 읽기 전용</span>";
    document.body.appendChild(badge);
  }

  function isWriteControl(control){
    const text=clean(control?.textContent||control?.value||control?.getAttribute?.("aria-label")||control?.getAttribute?.("title"));
    return /(저장|등록|추가|수정|삭제|승인|반려|발행|차단|해제|초기화|복원|신규|확정|완료처리|비밀번호 변경|입고처리|출고처리|재고조정|발주|수주등록|작업지시 생성)/.test(text);
  }
  function readonlyAlert(){alert("DEMO 계정은 예시 데이터를 읽기만 할 수 있습니다. 저장·수정·삭제 등 쓰기 기능은 사용할 수 없습니다.");}

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
