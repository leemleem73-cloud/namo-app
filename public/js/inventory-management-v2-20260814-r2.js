(function installUnifiedInventoryV2(global){
  "use strict";
  if(global.__QMES_UNIFIED_INVENTORY_V2__) return;
  global.__QMES_UNIFIED_INVENTORY_V2__=true;
  const ReactRef=global.React;
  if(!ReactRef) return;
  const h=ReactRef.createElement;
  const PAGES=[
    {view:"overview",label:"재고현황"},
    {view:"receipts",label:"입고 / LOT"},
    {view:"usage",label:"생산투입"},
    {view:"adjustments",label:"반납 / 조정"},
    {view:"ledger",label:"수불이력"},
    {view:"stocktake",label:"재고실사"},
    {view:"shortage",label:"부족재고"}
  ];
  const DEFAULT_MASTERS=[
    {code:"RM-NMP",name:"NMP",type:"RAW",unit:"kg",safety:2400,location:"A-01",iqcRequired:true},
    {code:"RM-BYK180",name:"BYK180",type:"RAW",unit:"kg",safety:20,location:"A-02",iqcRequired:true},
    {code:"RM-AOH30",name:"AOH30",type:"RAW",unit:"kg",safety:100,location:"A-03",iqcRequired:true},
    {code:"RM-SBS",name:"SBS",type:"RAW",unit:"kg",safety:20,location:"A-04",iqcRequired:true},
    {code:"RM-PVDF",name:"PVdF",type:"RAW",unit:"kg",safety:400,location:"A-05",iqcRequired:true},
    {code:"RM-SBR",name:"SBR",type:"RAW",unit:"kg",safety:300,location:"A-06",iqcRequired:true},
    {code:"PM-DRUM20",name:"20L DRUM",type:"PACK",unit:"EA",safety:300,location:"B-01",iqcRequired:true,inspection:"외관검사"},
    {code:"PM-LABEL01",name:"제품라벨",type:"PACK",unit:"EA",safety:300,location:"B-03",iqcRequired:true,inspection:"인쇄내용/규격검사"},
    {code:"PM-BOX01",name:"포장 BOX",type:"PACK",unit:"EA",safety:100,location:"B-04",iqcRequired:true,inspection:"규격/외관"},
    {code:"PM-FILM01",name:"포장필름",type:"PACK",unit:"ROLL",safety:10,location:"B-05",iqcRequired:false}
  ];
  const DEFAULT_PACKAGING_BOM=[
    {code:"PM-DRUM20",name:"20L DRUM",perProduct:1},
    {code:"PM-LABEL01",name:"제품라벨",perProduct:1},
    {code:"PM-BOX01",name:"포장 BOX",productsPerUnit:5}
  ];
  const PASS=new Set(["합격","정상","PASS","OK","적합"]);
  const VIEW_KEY="qmes_inventory_v2_view";

  function text(value){return String(value??"").trim();}
  function upper(value){return text(value).toUpperCase().replace(/\s+/g,"");}
  function num(value){
    const found=text(value).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);
    const parsed=found?Number(found[0]):0;
    return Number.isFinite(parsed)?parsed:0;
  }
  function round(value){return Number(num(value).toFixed(3));}
  function fmt(value){return num(value).toLocaleString("ko-KR",{maximumFractionDigits:3});}
  function localDate(value){
    const date=value?new Date(value):new Date();
    if(Number.isNaN(date.getTime())) return text(value).slice(0,10);
    return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
  }
  function nowIso(){return new Date().toISOString();}
  function currentUser(){
    const user=global.__QMES_CURRENT_USER__||global.__QMES_USER__;
    return text(user?.name||user?.uid||user||"관리자");
  }
  function id(prefix){return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;}
  function payloadOf(record){
    const payload=record?.payload;
    if(payload&&typeof payload==="object") return payload;
    try{return JSON.parse(payload||"{}");}catch(_error){return {};}
  }
  function normalizeType(value,code){
    const v=upper(value);
    return v==="PACK"||v.includes("부자재")||upper(code).startsWith("PM-")?"PACK":"RAW";
  }
  function materialKey(value){
    const v=upper(value).replace(/[^A-Z0-9가-힣]/g,"");
    if(v.includes("BYK180")||v.includes("분산제")) return "BYK180";
    if(v.includes("AOH30")||v.includes("BOEHMITE")) return "AOH30";
    if(v.includes("NMP")) return "NMP";
    if(v.includes("PVDF")&&!v.includes("SBS")) return "PVDF";
    if(v.includes("SBR")) return "SBR";
    if(v.includes("SBS")) return "SBS";
    if(v.includes("DRUM")||v.includes("20L")||v.includes("20KG캔")) return "DRUM20";
    if(v.includes("LABEL")||v.includes("라벨")) return "LABEL01";
    if(v.includes("BOX")||v.includes("박스")) return "BOX01";
    if(v.includes("FILM")||v.includes("필름")) return "FILM01";
    return v;
  }
  function sameMaterial(master,value){
    const target=materialKey(`${master.code} ${master.name}`);
    return target&&target===materialKey(value);
  }
  function dateTimeLabel(value){
    if(!value) return "-";
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return text(value).replace("T"," ").slice(0,16);
    return new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(date);
  }
  function expiryDays(value){
    if(!value) return null;
    const target=new Date(`${String(value).slice(0,10)}T23:59:59+09:00`);
    return Number.isNaN(target.getTime())?null:Math.ceil((target-Date.now())/86400000);
  }
  function isCompletedWorkOrder(workOrder){
    return /완료|생산완료|실적확정|출하완료/.test(text(workOrder?.status||workOrder?.state||workOrder?.progress));
  }
  function readLegacyRows(){
    try{return typeof global.qmesBuildInventoryRows==="function"?(global.qmesBuildInventoryRows()||[]):[];}catch(_error){return [];}
  }
  function readLegacyLots(){
    try{return typeof global.qmesBuildInventoryLotRows==="function"?(global.qmesBuildInventoryLotRows()||[]):[];}catch(_error){return [];}
  }
  function readWorkOrders(){
    const docs=global.DB?.woDocs&&typeof global.DB.woDocs==="object"?global.DB.woDocs:{};
    return Object.entries(docs).map(([no,doc])=>({no,...(doc||{})}));
  }
  function recommendLots(code,required,lotRows){
    const rows=(lotRows||[]).filter(lot=>{
      const available=num(lot.available??lot.baseBalance??lot.balance);
      return lot.code===code&&available>0&&!lot.hold&&!lot.pending;
    }).sort((a,b)=>{
      const ae=a.expiryDate||"9999-12-31",be=b.expiryDate||"9999-12-31";
      return ae.localeCompare(be)||String(a.receivedAt||"").localeCompare(String(b.receivedAt||""))||a.lotNo.localeCompare(b.lotNo);
    });
    let remain=num(required);
    const lots=[];
    rows.forEach(lot=>{
      if(remain<=0)return;
      const available=num(lot.available??lot.baseBalance??lot.balance);
      const qty=Math.min(remain,available);
      if(qty>0){lots.push({lotNo:lot.lotNo,qty:round(qty)});remain=round(remain-qty);}
    });
    return {lots,shortage:Math.max(remain,0),complete:remain<=0};
  }

  function buildDomain(records){
    const live=(records||[]).filter(record=>!payloadOf(record).deleted);
    const payloads=live.map(record=>({key:text(record.record_key),updatedAt:record.updated_at||"",...payloadOf(record)}));
    const masterMap=new Map(DEFAULT_MASTERS.map(row=>[row.code,{...row}]));
    readLegacyRows().forEach(row=>{
      const known=Array.from(masterMap.values()).find(master=>sameMaterial(master,`${row.code} ${row.name}`));
      if(known){
        known.safety=num(row.safety)||known.safety;
        known.location=text(row.loc)||known.location;
        known.unit=text(row.unit)||known.unit;
      }else if(row.code){
        masterMap.set(row.code,{code:row.code,name:row.name||row.code,type:normalizeType(row.type,row.code),unit:row.unit||"kg",safety:num(row.safety),location:row.loc||"미지정",iqcRequired:true});
      }
    });
    payloads.filter(row=>row.kind==="inventory-v2-master").forEach(row=>masterMap.set(row.code,{...(masterMap.get(row.code)||{}),...row,type:normalizeType(row.type,row.code)}));
    const masters=Array.from(masterMap.values()).sort((a,b)=>a.type.localeCompare(b.type)||a.code.localeCompare(b.code));
    const receipts=payloads.filter(row=>row.kind==="inventory-v2-receipt");
    const manualTransactions=payloads.filter(row=>row.kind==="inventory-v2-transaction");
    const stocktakes=payloads.filter(row=>row.kind==="inventory-v2-stocktake");
    const holdRecords=payloads.filter(row=>row.kind==="inventory-v2-hold");
    const shipments=payloads.filter(row=>row.kind==="finished-product-shipment");
    const holdByLot=new Map(holdRecords.map(row=>[upper(row.lotNo),row]));
    const lotMap=new Map();

    readLegacyLots().forEach((row,index)=>{
      const master=masters.find(item=>sameMaterial(item,`${row.materialKey} ${row.name}`))||{code:`RM-${materialKey(row.name)||index+1}`,name:row.name||row.materialKey||"미지정",type:"RAW",unit:"kg",safety:0,location:"미지정"};
      const lotNo=upper(row.lot)||`LEGACY-${index+1}`;
      const hold=Boolean(row.hold)||text(row.status).includes("홀드")||text(holdByLot.get(lotNo)?.status)==="HOLD";
      lotMap.set(lotNo,{lotNo,code:master.code,name:master.name,type:master.type,unit:master.unit||"kg",supplier:row.supplier||"-",receivedAt:row.receivedAt||"",received:num(row.received),baseBalance:num(row.remaining),iqc:"합격",hold,expiryDate:row.expiryDate||"",location:row.location||master.location||"미지정",source:"legacy",workOrders:Array.isArray(row.workOrders)?row.workOrders:[]});
    });

    receipts.forEach((row,index)=>{
      const master=masters.find(item=>item.code===row.code)||masters.find(item=>sameMaterial(item,row.name))||{code:row.code||`MAT-${index+1}`,name:row.name||"미지정",type:normalizeType(row.type,row.code),unit:row.unit||"EA",safety:0,location:row.location||"미지정"};
      const lotNo=upper(row.internalLot||row.lotNo);
      if(!lotNo)return;
      const holdRecord=holdByLot.get(lotNo);
      const status=text(holdRecord?.status)==="HOLD"?"HOLD":text(row.status||row.iqcStatus||(row.iqcRequired===false?"합격":"검사대기"));
      lotMap.set(lotNo,{lotNo,code:master.code,name:master.name,type:normalizeType(row.type||master.type,master.code),unit:row.unit||master.unit||"EA",supplier:row.supplier||"-",supplierLot:row.supplierLot||"",receivedAt:row.receivedAt||row.date||"",received:num(row.qty),baseBalance:num(row.qty),iqc:status==="HOLD"?"합격":status,hold:status==="HOLD",expiryDate:row.expiryDate||"",location:row.location||master.location||"미지정",source:"v2",receiptKey:row.key,note:row.note||"",workOrders:[]});
    });

    const workOrders=readWorkOrders();
    const productionTransactions=[];
    workOrders.forEach(workOrder=>{
      (Array.isArray(workOrder.inputs)?workOrder.inputs:[]).forEach((input,index)=>{
        const lotNo=upper(input.materialLot||input.lot);
        const quantity=num(input.act??input.actualQty??input.actual);
        if(!lotNo||!(quantity>0))return;
        const existing=lotMap.get(lotNo);
        if(existing&&existing.source==="v2")existing.baseBalance=round(existing.baseBalance-quantity);
        if(existing)existing.workOrders.push({workOrderNo:workOrder.no,used:quantity,item:workOrder.item||workOrder.product||""});
        productionTransactions.push({key:`auto:${workOrder.no}:${lotNo}:${index}`,kind:"inventory-v2-transaction",type:"생산투입",code:existing?.code||"",name:existing?.name||input.name||input.materialName||"",materialType:existing?.type||"RAW",lotNo,qty:-quantity,unit:existing?.unit||input.unit||"kg",occurredAt:workOrder.completedAt||workOrder.updatedAt||workOrder.date||"",documentNo:workOrder.no,by:workOrder.completedBy||workOrder.by||"생산실적",automatic:true,affectsStock:false});
      });
      const batch=(Array.isArray(global.DB?.batches)?global.DB.batches:[]).find(row=>text(row?.no)===text(workOrder.no))||{};
      const outputUnit=upper(workOrder.productionUnit||workOrder.outputUnit||workOrder.unit||batch.unit);
      const explicitPackaging=Array.isArray(workOrder.packagingBOM)?workOrder.packagingBOM:Array.isArray(workOrder.packagingBom)?workOrder.packagingBom:[];
      const packRows=explicitPackaging.length?explicitPackaging:(outputUnit==="EA"?DEFAULT_PACKAGING_BOM:[]);
      const produced=num(workOrder.actualProductionQty??workOrder.actualQty??workOrder.outputQty??workOrder.productionQty??batch.done??(isCompletedWorkOrder(workOrder)?workOrder.plan:0));
      if(isCompletedWorkOrder(workOrder)&&produced>0){
        packRows.forEach((pack,index)=>{
          const master=masters.find(item=>item.type==="PACK"&&sameMaterial(item,`${pack.code} ${pack.name} ${pack.material}`));
          const perProduct=num(pack.perProduct??pack.qtyPerProduct);
          const productsPerUnit=num(pack.productsPerUnit??pack.packSize);
          const required=perProduct>0?produced*perProduct:productsPerUnit>0?Math.ceil(produced/productsPerUnit):num(pack.actualQty??pack.qty);
          if(!master||!(required>0))return;
          const allocations=recommendLots(master.code,required,Array.from(lotMap.values()));
          allocations.lots.forEach((allocation,lotIndex)=>{
            const lot=lotMap.get(allocation.lotNo);
            if(lot)lot.baseBalance=round(lot.baseBalance-allocation.qty);
            productionTransactions.push({key:`auto-pack:${workOrder.no}:${master.code}:${index}:${lotIndex}`,kind:"inventory-v2-transaction",type:"생산투입",code:master.code,name:master.name,materialType:"PACK",lotNo:allocation.lotNo,qty:-allocation.qty,unit:master.unit,occurredAt:workOrder.completedAt||workOrder.updatedAt||workOrder.date||"",documentNo:workOrder.no,by:workOrder.completedBy||workOrder.by||"포장 BOM 자동차감",automatic:true,affectsStock:false});
          });
        });
      }
    });

    manualTransactions.forEach(tx=>{
      if(tx.affectsStock===false)return;
      const lot=lotMap.get(upper(tx.lotNo));
      if(lot)lot.baseBalance=round(lot.baseBalance+num(tx.qty));
    });

    const lots=Array.from(lotMap.values()).map(lot=>{
      const holdRecord=holdByLot.get(upper(lot.lotNo));
      const hold=text(holdRecord?.status)==="HOLD"||(text(holdRecord?.status)!=="NORMAL"&&lot.hold);
      const balance=round(lot.baseBalance);
      const pending=!PASS.has(text(lot.iqc).toUpperCase());
      const available=hold||pending?0:Math.max(balance,0);
      const days=expiryDays(lot.expiryDate);
      const status=balance<0?"재고이상":balance===0?"재고없음":hold?"HOLD":pending?lot.iqc||"검사대기":days!==null&&days<=30?"유효기한 임박":"정상";
      return {...lot,hold,balance,available,pending,expiryDays:days,status};
    });

    const itemRows=masters.map(master=>{
      const matched=lots.filter(lot=>lot.code===master.code||sameMaterial(master,`${lot.code} ${lot.name}`));
      const stock=round(matched.reduce((sum,lot)=>sum+lot.balance,0));
      const hold=round(matched.filter(lot=>lot.hold).reduce((sum,lot)=>sum+Math.max(lot.balance,0),0));
      const pendingQty=round(matched.filter(lot=>lot.pending&&!lot.hold).reduce((sum,lot)=>sum+Math.max(lot.balance,0),0));
      const available=round(matched.reduce((sum,lot)=>sum+lot.available,0));
      const safety=num(master.safety);
      const shortage=Math.max(round(safety-available),0);
      const soon=matched.filter(lot=>lot.expiryDays!==null&&lot.expiryDays>=0&&lot.expiryDays<=30&&lot.balance>0);
      const diffs=stocktakes.filter(take=>take.code===master.code&&take.result==="차이"&&!take.adjusted);
      const statuses=[];
      if(shortage>0)statuses.push({kind:"shortage",label:`부족 ${fmt(shortage)} ${master.unit}`});
      if(hold>0)statuses.push({kind:"hold",label:`HOLD ${fmt(hold)} ${master.unit}`});
      if(pendingQty>0)statuses.push({kind:"warning",label:`검사대기 ${fmt(pendingQty)} ${master.unit}`});
      if(soon.length)statuses.push({kind:"expiry",label:`유효기한 D-${Math.min(...soon.map(lot=>lot.expiryDays))}`});
      if(stock===0)statuses.push({kind:"empty",label:"재고없음"});
      if(diffs.length)statuses.push({kind:"difference",label:"실사차이"});
      if(!statuses.length)statuses.push({kind:"normal",label:"정상"});
      return {...master,stock,hold,pendingQty,available,safety,shortage,lotCount:matched.filter(lot=>lot.balance>0).length,lots:matched,statuses};
    });

    const inbound=lots.map(lot=>({key:`in:${lot.lotNo}`,kind:"inventory-v2-transaction",type:"입고",code:lot.code,name:lot.name,materialType:lot.type,lotNo:lot.lotNo,qty:lot.received,unit:lot.unit,occurredAt:lot.receivedAt,documentNo:lot.source==="legacy"?"IQC":lot.receiptKey||"입고",by:lot.supplier,automatic:true,affectsStock:false}));
    const transactions=[...inbound,...productionTransactions,...manualTransactions].sort((a,b)=>String(b.occurredAt||b.savedAt||b.updatedAt).localeCompare(String(a.occurredAt||a.savedAt||a.updatedAt)));
    return {payloads,masters,lots,itemRows,receipts,transactions,manualTransactions,stocktakes,shipments,workOrders};
  }

  function Chip({kind="normal",children}){return h("span",{className:`qmes-inv2-chip is-${kind}`},children);}
  function Button({tone="primary",onClick,children,disabled=false,type="button"}){return h("button",{type,onClick,disabled,className:`qmes-inv2-btn is-${tone}`},children);}
  function Empty({colSpan=1,text:message}){return h("tr",null,h("td",{colSpan,className:"qmes-inv2-empty"},message));}
  function Table({headers,children,minWidth="980px"}){return h("div",{className:"qmes-inv2-table-wrap"},h("table",{className:"qmes-inv2-table",style:{minWidth}},h("thead",null,h("tr",null,headers.map(label=>h("th",{key:label},label)))),h("tbody",null,children)));}
  function Field({label,required=false,children}){return h("label",{className:"qmes-inv2-field"},h("span",null,label,required?h("b",null," *"):null),children);}
  function Modal({title,description,onClose,children,wide=false}){
    return h("div",{className:"qmes-inv2-modal-backdrop",role:"dialog","aria-modal":"true","aria-label":title,onMouseDown:event=>{if(event.target===event.currentTarget)onClose();}},h("section",{className:`qmes-inv2-modal ${wide?"is-wide":""}`},h("header",null,h("div",null,h("h3",null,title),description?h("p",null,description):null),h("button",{type:"button",onClick:onClose,"aria-label":"닫기"},"×")),h("div",{className:"qmes-inv2-modal-body"},children)));
  }
  function SummaryCard({label,value,tone="default",hint}){return h("div",{className:`qmes-inv2-summary is-${tone}`},h("div",{className:"qmes-inv2-summary-label"},label),h("strong",null,value),hint?h("small",null,hint):null);}
  function PageIntro({title,description,actions}){return h("div",{className:"qmes-inv2-page-intro"},h("div",null,h("h2",null,title),h("p",null,description)),actions?h("div",{className:"qmes-inv2-actions"},actions):null);}

  function UnifiedInventoryV2(){
    const [view,setView]=ReactRef.useState(()=>{
      try{const saved=sessionStorage.getItem(VIEW_KEY);return PAGES.some(page=>page.view===saved)?saved:"overview";}
      catch(_error){return "overview";}
    });
    const [records,setRecords]=ReactRef.useState([]);
    const [loading,setLoading]=ReactRef.useState(true);
    const [saving,setSaving]=ReactRef.useState(false);
    const [error,setError]=ReactRef.useState("");
    const [version,setVersion]=ReactRef.useState(0);
    const [typeFilter,setTypeFilter]=ReactRef.useState("ALL");
    const [query,setQuery]=ReactRef.useState("");
    const [statusFilter,setStatusFilter]=ReactRef.useState("ALL");
    const [locationFilter,setLocationFilter]=ReactRef.useState("");
    const [lotFilter,setLotFilter]=ReactRef.useState("");
    const [modal,setModal]=ReactRef.useState(null);
    const [selected,setSelected]=ReactRef.useState(null);
    const [traceQuery,setTraceQuery]=ReactRef.useState("");
    const domain=ReactRef.useMemo(()=>buildDomain(records),[records,version]);

    const load=ReactRef.useCallback(async(showLoading=false)=>{
      if(showLoading)setLoading(true);
      setError("");
      try{
        if(showLoading){
          try{if(typeof global.qmesSyncInventorySourceData==="function")await global.qmesSyncInventorySourceData();}catch(_error){}
        }
        if(typeof global.qmesSyncList!=="function")throw new Error("공용 재고 DB 연결 모듈을 불러오지 못했습니다.");
        const rows=await global.qmesSyncList("inventory");
        setRecords(Array.isArray(rows)?rows:[]);
        setVersion(value=>value+1);
      }catch(loadError){setError(text(loadError?.message||loadError));}
      finally{setLoading(false);}
    },[]);

    ReactRef.useEffect(()=>{load(true);},[load]);
    ReactRef.useEffect(()=>{
      const refresh=()=>load(false);
      const changeView=event=>{
        const next=text(event?.detail?.view||event?.detail);
        if(PAGES.some(page=>page.view===next)){
          setView(next);
          try{sessionStorage.setItem(VIEW_KEY,next);}catch(_error){}
        }
      };
      global.addEventListener("qmes:inventory-v2-view",changeView);
      global.addEventListener("qmes:data-updated",refresh);
      global.addEventListener("focus",refresh);
      return()=>{
        global.removeEventListener("qmes:inventory-v2-view",changeView);
        global.removeEventListener("qmes:data-updated",refresh);
        global.removeEventListener("focus",refresh);
      };
    },[load]);
    ReactRef.useEffect(()=>{installRouterAndSidebar();},[view,records.length]);

    async function saveRecord(key,payload){
      if(typeof global.qmesSyncUpsert!=="function")throw new Error("공용 DB 저장 기능을 사용할 수 없습니다.");
      return global.qmesSyncUpsert("inventory",key,{...payload,savedAt:payload.savedAt||nowIso(),savedBy:payload.savedBy||currentUser()});
    }
    async function runSave(task,success){
      if(saving)return;
      setSaving(true);setError("");
      try{
        await task();
        setModal(null);setSelected(null);
        await load(false);
        global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"inventory-v2"}}));
        if(success)alert(success);
      }catch(saveError){
        setError(text(saveError?.message||saveError));
        alert(`저장 실패: ${text(saveError?.message||saveError)}`);
      }finally{setSaving(false);}
    }

    const filteredItems=domain.itemRows.filter(row=>{
      if(typeFilter!=="ALL"&&row.type!==typeFilter)return false;
      const q=upper(query);
      if(q&&!upper(`${row.code} ${row.name}`).includes(q))return false;
      if(locationFilter&&!upper(row.location).includes(upper(locationFilter)))return false;
      if(lotFilter&&!row.lots.some(lot=>upper(lot.lotNo).includes(upper(lotFilter))))return false;
      if(statusFilter!=="ALL"&&!row.statuses.some(status=>status.kind===statusFilter))return false;
      return true;
    });
    const filteredLots=domain.lots.filter(lot=>{
      if(typeFilter!=="ALL"&&lot.type!==typeFilter)return false;
      const q=upper(query);
      if(q&&!upper(`${lot.code} ${lot.name}`).includes(q))return false;
      if(locationFilter&&!upper(lot.location).includes(upper(locationFilter)))return false;
      if(lotFilter&&!upper(lot.lotNo).includes(upper(lotFilter)))return false;
      return true;
    });
    const filteredTransactions=domain.transactions.filter(tx=>{
      if(typeFilter!=="ALL"&&normalizeType(tx.materialType,tx.code)!==typeFilter)return false;
      const q=upper(query);
      if(q&&!upper(`${tx.code} ${tx.name}`).includes(q))return false;
      if(lotFilter&&!upper(tx.lotNo).includes(upper(lotFilter)))return false;
      return true;
    });
    const today=localDate();
    const holdLots=domain.lots.filter(lot=>lot.hold&&lot.balance>0);
    const todayInbound=domain.transactions.filter(tx=>tx.type==="입고"&&localDate(tx.occurredAt)===today).length;
    const todayUsage=domain.transactions.filter(tx=>tx.type==="생산투입"&&localDate(tx.occurredAt)===today).length;
    const shortages=domain.itemRows.filter(row=>row.shortage>0);
    const anomalies=domain.lots.filter(lot=>lot.balance<0||lot.pending).length+domain.stocktakes.filter(row=>row.result==="차이"&&!row.adjusted).length;

    function openLot(row){setSelected(row);setModal("lot");}
    function go(next){
      setView(next);
      try{sessionStorage.setItem(VIEW_KEY,next);}catch(_error){}
      setTimeout(installRouterAndSidebar,0);
    }

    const filterBar=h("div",{className:"qmes-inv2-filterbar"},
      h("div",{className:"qmes-inv2-segments"},[["ALL","전체"],["RAW","원재료"],["PACK","부자재"]].map(([key,label])=>h("button",{type:"button",key,onClick:()=>setTypeFilter(key),className:typeFilter===key?"is-active":""},label))),
      h("input",{value:query,onChange:event=>setQuery(event.target.value),placeholder:"품명·자재코드 검색","aria-label":"품명 또는 자재코드 검색"}),
      h("select",{value:statusFilter,onChange:event=>setStatusFilter(event.target.value),"aria-label":"상태"},
        h("option",{value:"ALL"},"전체 상태"),h("option",{value:"normal"},"정상"),h("option",{value:"shortage"},"부족"),h("option",{value:"hold"},"HOLD"),h("option",{value:"expiry"},"유효기한 임박"),h("option",{value:"empty"},"재고없음"),h("option",{value:"difference"},"실사차이")),
      h("input",{value:locationFilter,onChange:event=>setLocationFilter(event.target.value),placeholder:"위치","aria-label":"위치"}),
      h("input",{value:lotFilter,onChange:event=>setLotFilter(event.target.value),placeholder:"LOT","aria-label":"LOT"})
    );

    function Overview(){
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"원재료·부자재 재고관리",description:"원재료 및 부자재의 입고, LOT, IQC, 생산투입 및 현재 재고를 통합 관리합니다.",actions:[
          h(Button,{key:"receipt",onClick:()=>setModal("receipt")},"입고등록"),
          h(Button,{key:"ledger",tone:"secondary",onClick:()=>go("ledger")},"수불이력 조회")
        ]}),
        h("div",{className:"qmes-inv2-summary-grid"},
          h(SummaryCard,{label:"전체 품목",value:`${domain.itemRows.length} 품목`,hint:"원재료 + 부자재"}),
          h(SummaryCard,{label:"가용 정상 품목",value:`${domain.itemRows.filter(row=>row.available>0&&!row.statuses.some(status=>["hold","difference"].includes(status.kind))).length} 품목`,tone:"success"}),
          h(SummaryCard,{label:"HOLD LOT",value:`${holdLots.length} LOT`,tone:holdLots.length?"danger":"default"}),
          h(SummaryCard,{label:"금일 입고",value:`${todayInbound} 건`}),
          h(SummaryCard,{label:"금일 실투입",value:`${todayUsage} 건`}),
          h(SummaryCard,{label:"안전재고 부족",value:`${shortages.length} 품목`,tone:shortages.length?"warning":"success"}),
          h(SummaryCard,{label:"재고 이상",value:`${anomalies} 건`,tone:anomalies?"danger":"success",hint:"음수·미확정·실사차이"})
        ),
        filterBar,
        h(Table,{headers:["구분","자재코드","품명","현재고","HOLD","가용재고","안전재고","부족량","단위","LOT","위치","상태"],minWidth:"1260px"},
          filteredItems.length?filteredItems.map(row=>h("tr",{key:row.code,onClick:()=>openLot(row),className:"is-clickable"},
            h("td",null,h(Chip,{kind:row.type==="RAW"?"raw":"pack"},row.type==="RAW"?"원재료":"부자재")),
            h("td",{className:"is-code"},row.code),h("td",{className:"is-name"},row.name),
            h("td",{className:"is-number"},fmt(row.stock)),h("td",{className:"is-number is-hold"},fmt(row.hold)),
            h("td",{className:"is-number is-available"},fmt(row.available)),h("td",{className:"is-number"},fmt(row.safety)),
            h("td",{className:"is-number is-shortage"},fmt(row.shortage)),h("td",null,row.unit),
            h("td",{className:"is-number"},row.lotCount),h("td",null,row.location||"미지정"),
            h("td",null,h("div",{className:"qmes-inv2-chip-list"},row.statuses.map((status,index)=>h(Chip,{key:`${status.kind}-${index}`,kind:status.kind},status.label))))
          )):h(Empty,{colSpan:12,text:"조건에 맞는 재고 품목이 없습니다."})
        )
      );
    }

    function Receipts(){
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"입고 / LOT",description:"원재료와 부자재를 동일한 절차로 입고하고 IQC 상태별 가용 여부를 관리합니다.",actions:h(Button,{onClick:()=>setModal("receipt")},"입고등록")}),
        filterBar,
        h(Table,{headers:["구분","자재코드","품명","공급업체","입고일","입고량","사내 LOT","공급사 LOT","IQC","유효기한","위치","관리"],minWidth:"1280px"},
          filteredLots.length?filteredLots.sort((a,b)=>String(b.receivedAt).localeCompare(String(a.receivedAt))).map(lot=>h("tr",{key:lot.lotNo},
            h("td",null,lot.type==="RAW"?"원재료":"부자재"),h("td",{className:"is-code"},lot.code),h("td",{className:"is-name"},lot.name),
            h("td",null,lot.supplier),h("td",null,lot.receivedAt||"-"),h("td",{className:"is-number"},`${fmt(lot.received)} ${lot.unit}`),
            h("td",{className:"is-code"},lot.lotNo),h("td",null,lot.supplierLot||"-"),
            h("td",null,h(Chip,{kind:lot.hold?"hold":lot.pending?"warning":"normal"},lot.hold?"HOLD":lot.iqc)),
            h("td",null,lot.expiryDate||"-"),h("td",null,lot.location),
            h("td",null,h("div",{className:"qmes-inv2-row-actions"},
              h(Button,{tone:"secondary",onClick:()=>openLot(lot)},"LOT 상세"),
              lot.source==="v2"?h(Button,{tone:"ghost",onClick:()=>{setSelected(lot);setModal("iqc");}},"IQC 결과"):null,
              h(Button,{tone:lot.hold?"success":"danger",onClick:()=>toggleHold(lot)},lot.hold?"HOLD 해제":"HOLD 설정")
            ))
          )):h(Empty,{colSpan:12,text:"등록된 입고 LOT가 없습니다."})
        )
      );
    }

    function Usage(){
      const orders=[...domain.workOrders].sort((a,b)=>String(b.completedAt||b.updatedAt||b.date||"").localeCompare(String(a.completedAt||a.updatedAt||a.date||"")));
      const rows=[];
      orders.forEach(workOrder=>{
        const rawInputs=Array.isArray(workOrder.inputs)?workOrder.inputs:[];
        const packInputs=domain.transactions.filter(tx=>tx.type==="생산투입"&&tx.materialType==="PACK"&&text(tx.documentNo)===text(workOrder.no)).map(tx=>({name:tx.name,materialLot:tx.lotNo,act:Math.abs(num(tx.qty)),unit:tx.unit,automaticPack:true}));
        const inputs=[...rawInputs,...packInputs];
        if(!inputs.length)inputs.push({});
        inputs.forEach((input,index)=>{
          const lot=domain.lots.find(row=>upper(row.lotNo)===upper(input.materialLot||input.lot));
          const actual=num(input.act??input.actualQty??input.actual);
          rows.push(h("tr",{key:`${workOrder.no}-${index}`},
            index===0?h("td",{rowSpan:inputs.length,className:"is-code"},workOrder.no):null,
            index===0?h("td",{rowSpan:inputs.length,className:"is-name"},workOrder.item||workOrder.product||"-"):null,
            index===0?h("td",{rowSpan:inputs.length},h(Chip,{kind:isCompletedWorkOrder(workOrder)?"normal":"warning"},workOrder.status||"진행중")):null,
            h("td",null,input.name||input.materialName||lot?.name||"-"),
            h("td",{className:"is-number"},input.automaticPack?"포장 BOM":`${fmt(input.plan??input.plannedQty)} ${input.unit||lot?.unit||"kg"}`),
            h("td",{className:"is-number is-available"},`${fmt(actual)} ${input.unit||lot?.unit||"kg"}`),
            h("td",{className:"is-code"},input.materialLot||input.lot||"미선택"),
            h("td",null,lot?h(Chip,{kind:lot.hold?"hold":lot.pending?"warning":"normal"},lot.hold?"HOLD":lot.pending?lot.iqc:"사용가능"):h(Chip,{kind:"danger"},"LOT 미확인")),
            index===0?h("td",{rowSpan:inputs.length},h("div",{className:"qmes-inv2-row-actions"},
              typeof global.qmesApplyRecommendedLots==="function"&&!isCompletedWorkOrder(workOrder)?h(Button,{tone:"secondary",onClick:()=>applyRecommended(workOrder.no)},"추천 LOT 적용"):null,
              h(Button,{tone:"ghost",onClick:()=>openWorkOrder(workOrder.no)},"작업지시 이동")
            )):null
          ));
        });
      });
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"생산투입",description:"작업지시의 실제 투입량 확정 시 LOT 재고를 자동 차감합니다. 별도 출고등록은 하지 않습니다.",actions:h(Button,{tone:"secondary",onClick:()=>load(false)},"실적 새로고침")}),
        filterBar,
        h("div",{className:"qmes-inv2-callout is-info"},h("strong",null,"FIFO / FEFO 자동 추천"),h("span",null,"유효기한이 있는 자재는 FEFO, 그 외 자재는 입고일 기준 FIFO 순서로 추천하며 HOLD·검사대기 LOT는 제외합니다.")),
        h(Table,{headers:["작업지시","제품","상태","자재","계획","실제투입","사용 LOT","LOT 상태","자동처리"],minWidth:"1120px"},rows.length?rows:h(Empty,{colSpan:9,text:"연결된 작업지시가 없습니다."}))
      );
    }

    function Adjustments(){
      const rows=filteredTransactions.filter(tx=>["생산반납","반납","폐기","재고증가 조정","재고감소 조정","실사조정"].includes(tx.type));
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"반납 / 조정",description:"재고 숫자를 직접 덮어쓰지 않고 반납·폐기·증가·감소 트랜잭션으로만 변경합니다.",actions:[
          h(Button,{key:"return",onClick:()=>setModal("return")},"반납등록"),
          h(Button,{key:"adjust",tone:"secondary",onClick:()=>setModal("adjust")},"재고조정")
        ]}),
        filterBar,
        h("div",{className:"qmes-inv2-action-grid"},[
          {title:"생산 반납",desc:"미사용 자재를 기존 LOT로 복귀",tone:"success",action:()=>setModal("return")},
          {title:"폐기",desc:"오염·유효기한 경과·손상 차감",tone:"danger",action:()=>setModal("waste")},
          {title:"재고증가 조정",desc:"실물이 장부보다 많은 경우",tone:"primary",action:()=>{setSelected({adjustType:"increase"});setModal("adjust");}},
          {title:"재고감소 조정",desc:"실물이 장부보다 적은 경우",tone:"warning",action:()=>{setSelected({adjustType:"decrease"});setModal("adjust");}}
        ].map(card=>h("button",{type:"button",key:card.title,className:`qmes-inv2-action-card is-${card.tone}`,onClick:card.action},h("strong",null,card.title),h("span",null,card.desc)))),
        h(Table,{headers:["일시","구분","자재","LOT","변동량","단위","잔량","연결문서","사유","처리자"],minWidth:"1080px"},
          rows.length?rows.map(tx=>{
            const lot=domain.lots.find(item=>item.lotNo===upper(tx.lotNo));
            return h("tr",{key:tx.key},
              h("td",null,dateTimeLabel(tx.occurredAt||tx.savedAt)),h("td",null,h(Chip,{kind:num(tx.qty)<0?"danger":"normal"},tx.type)),
              h("td",null,tx.name||tx.code),h("td",{className:"is-code"},tx.lotNo),
              h("td",{className:`is-number ${num(tx.qty)<0?"is-shortage":"is-available"}`},`${num(tx.qty)>0?"+":""}${fmt(tx.qty)}`),
              h("td",null,tx.unit),h("td",{className:"is-number"},lot?fmt(lot.balance):"-"),
              h("td",null,tx.documentNo||"-"),h("td",null,tx.reason||"-"),h("td",null,tx.by||tx.savedBy||"-")
            );
          }):h(Empty,{colSpan:10,text:"반납·조정 이력이 없습니다."})
        )
      );
    }

    function Ledger(){
      const running=new Map();
      const balanceByKey=new Map();
      [...filteredTransactions].sort((a,b)=>String(a.occurredAt||a.savedAt).localeCompare(String(b.occurredAt||b.savedAt))).forEach(tx=>{
        const key=upper(tx.lotNo);
        const next=round((running.get(key)||0)+num(tx.qty));
        running.set(key,next);balanceByKey.set(tx.key,next);
      });
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"수불이력",description:"모든 입고·생산투입·반납·폐기·조정·실사 이동을 시간순으로 조회합니다."}),
        filterBar,
        h(Table,{headers:["일시","구분","자재","LOT","입고","출고/사용","반납","조정","잔량","연결문서","처리자"],minWidth:"1180px"},
          filteredTransactions.length?filteredTransactions.map(tx=>{
            const quantity=num(tx.qty),type=text(tx.type);
            return h("tr",{key:tx.key},
              h("td",null,dateTimeLabel(tx.occurredAt||tx.savedAt)),
              h("td",null,h(Chip,{kind:type==="입고"?"raw":type==="생산투입"||type==="폐기"?"danger":type.includes("반납")?"normal":"warning"},type)),
              h("td",null,tx.name||tx.code),h("td",{className:"is-code"},tx.lotNo),
              h("td",{className:"is-number is-available"},type==="입고"?`+${fmt(Math.abs(quantity))}`:""),
              h("td",{className:"is-number is-shortage"},type==="생산투입"||type==="폐기"?`-${fmt(Math.abs(quantity))}`:""),
              h("td",{className:"is-number is-available"},type.includes("반납")?`+${fmt(Math.abs(quantity))}`:""),
              h("td",{className:`is-number ${quantity<0?"is-shortage":"is-available"}`},!["입고","생산투입","폐기","생산반납","반납"].includes(type)?`${quantity>0?"+":""}${fmt(quantity)}`:""),
              h("td",{className:"is-number"},fmt(balanceByKey.get(tx.key))),
              h("td",null,tx.documentNo||"-"),h("td",null,tx.by||tx.savedBy||"-")
            );
          }):h(Empty,{colSpan:11,text:"수불이력이 없습니다."})
        )
      );
    }

    function Stocktake(){
      const takes=[...domain.stocktakes].sort((a,b)=>String(b.countedAt||b.savedAt).localeCompare(String(a.countedAt||a.savedAt)));
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"재고실사",description:"장부재고와 실사재고의 차이를 확인하고 승인된 차이만 조정 수불로 반영합니다.",actions:h(Button,{onClick:()=>setModal("stocktake")},"실사등록")}),
        filterBar,
        h(Table,{headers:["실사일","자재","LOT","장부재고","실사재고","차이","차이율","사유","결과","조정처리"],minWidth:"1080px"},
          takes.length?takes.map(take=>h("tr",{key:take.key},
            h("td",null,take.countedAt||localDate(take.savedAt)),h("td",null,take.name||take.code),h("td",{className:"is-code"},take.lotNo),
            h("td",{className:"is-number"},`${fmt(take.bookQty)} ${take.unit}`),h("td",{className:"is-number"},`${fmt(take.actualQty)} ${take.unit}`),
            h("td",{className:`is-number ${num(take.diff)<0?"is-shortage":num(take.diff)>0?"is-available":""}`},`${num(take.diff)>0?"+":""}${fmt(take.diff)} ${take.unit}`),
            h("td",{className:"is-number"},`${fmt(take.diffRate)}%`),h("td",null,take.reason||"-"),
            h("td",null,h(Chip,{kind:num(take.diff)===0?"normal":"difference"},num(take.diff)===0?"일치":"차이")),
            h("td",null,num(take.diff)===0?h(Chip,{kind:"normal"},"조정 불필요"):take.adjusted?h(Chip,{kind:"normal"},"반영완료"):h(Button,{tone:"warning",onClick:()=>applyStocktake(take)},"조정반영"))
          )):h(Empty,{colSpan:10,text:"등록된 실사 기록이 없습니다."})
        )
      );
    }

    function Shortage(){
      const rows=filteredItems.filter(row=>row.shortage>0);
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"부족재고",description:"가용재고 대비 안전재고 부족량을 단위별로 확인합니다. 생산계획 필요량 연결을 고려한 구조입니다."}),
        filterBar,
        h("div",{className:"qmes-inv2-callout is-warning"},h("strong",null,"구매 검토 대상 ",rows.length,"품목"),h("span",null,"구매 필요량은 품목별 단위를 유지하며 kg·EA·ROLL·BOX를 합산하지 않습니다.")),
        h(Table,{headers:["구분","자재코드","품명","가용재고","안전재고","안전재고 부족","생산계획 필요량","예상잔량","구매 검토량","단위","상태"],minWidth:"1160px"},
          rows.length?rows.map(row=>{
            const planned=0,expected=round(row.available-planned),purchase=Math.max(round(row.safety-expected),0);
            return h("tr",{key:row.code,onClick:()=>openLot(row),className:"is-clickable"},
              h("td",null,row.type==="RAW"?"원재료":"부자재"),h("td",{className:"is-code"},row.code),h("td",{className:"is-name"},row.name),
              h("td",{className:"is-number"},fmt(row.available)),h("td",{className:"is-number"},fmt(row.safety)),
              h("td",{className:"is-number is-shortage"},fmt(row.shortage)),h("td",{className:"is-number"},fmt(planned)),
              h("td",{className:"is-number"},fmt(expected)),h("td",{className:"is-number is-shortage"},fmt(purchase)),h("td",null,row.unit),
              h("td",null,h(Chip,{kind:"shortage"},`부족 ${fmt(row.shortage)} ${row.unit}`))
            );
          }):h(Empty,{colSpan:11,text:"현재 안전재고 부족 품목이 없습니다."})
        )
      );
    }

    function Trace(){
      const target=upper(traceQuery||lotFilter);
      const rawLot=domain.lots.find(lot=>upper(lot.lotNo)===target);
      const usedOrders=target?domain.workOrders.filter(workOrder=>upper(workOrder.no)===target||(workOrder.inputs||[]).some(input=>upper(input.materialLot||input.lot)===target)):[];
      const madeOrders=target?domain.workOrders.filter(workOrder=>upper(workOrder.no)===target||upper(workOrder.finishedLot||workOrder.productLot||workOrder.lotNo)===target):[];
      const linked=Array.from(new Map([...usedOrders,...madeOrders].map(row=>[row.no,row])).values());
      const shipments=target?domain.shipments.filter(row=>upper(row.lotNo)===target||linked.some(workOrder=>upper(row.lotNo)===upper(workOrder.finishedLot||workOrder.productLot||workOrder.no))):[];
      return h(ReactRef.Fragment,null,
        h(PageIntro,{title:"LOT 추적",description:"원재료·부자재 LOT에서 작업지시, 완제품 LOT, 출하까지 양방향으로 추적합니다."}),
        h("div",{className:"qmes-inv2-trace-search"},
          h("input",{value:traceQuery,onChange:event=>setTraceQuery(event.target.value),placeholder:"원재료 LOT, 완제품 LOT 또는 작업지시 번호 입력"}),
          h(Button,{onClick:()=>setTraceQuery(traceQuery.trim())},"추적")
        ),
        !target?h("div",{className:"qmes-inv2-empty-panel"},"추적할 LOT 또는 작업지시 번호를 입력하세요."):
        h("div",{className:"qmes-inv2-trace-flow"},
          h("section",null,h("span",null,"원재료 / 부자재 LOT"),h("strong",null,rawLot?rawLot.lotNo:"연결 LOT 조회"),h("p",null,rawLot?`${rawLot.name} · 잔량 ${fmt(rawLot.balance)} ${rawLot.unit} · ${rawLot.hold?"HOLD":rawLot.iqc}`:linked.length?`${linked.reduce((sum,workOrder)=>sum+(workOrder.inputs||[]).length,0)}개 투입 LOT 연결`:"해당 LOT를 찾지 못했습니다."),rawLot?h(Button,{tone:"secondary",onClick:()=>openLot(rawLot)},"LOT 상세"):null),
          h("div",{className:"qmes-inv2-trace-arrow"},"↓"),
          h("section",null,h("span",null,"작업지시"),h("strong",null,linked.length?linked.map(row=>row.no).join(", "):"연결 없음"),h("p",null,linked.length?linked.map(row=>row.item||row.product||"제품").join(" · "):"투입 또는 생산 연결 기록이 없습니다."),linked[0]?h(Button,{tone:"secondary",onClick:()=>openWorkOrder(linked[0].no)},"작업지시 이동"):null),
          h("div",{className:"qmes-inv2-trace-arrow"},"↓"),
          h("section",null,h("span",null,"완제품 LOT"),h("strong",null,linked.length?linked.map(row=>row.finishedLot||row.productLot||row.no).join(", "):"연결 없음"),h("p",null,"생산실적 확정 LOT")),
          h("div",{className:"qmes-inv2-trace-arrow"},"↓"),
          h("section",null,h("span",null,"출하"),h("strong",null,shipments.length?shipments.map(row=>row.shipNo).join(", "):"출하 이력 없음"),h("p",null,shipments.length?shipments.map(row=>`${row.customer||"납품처"} · ${fmt(row.qty)}`).join(" / "):"아직 연결된 출하 기록이 없습니다."))
        )
      );
    }

    async function toggleHold(lot){
      const next=!lot.hold;
      if(!confirm(`${lot.lotNo}를 ${next?"HOLD 설정":"HOLD 해제"}하시겠습니까?`))return;
      await runSave(()=>saveRecord(`v2:hold:${lot.lotNo}`,{kind:"inventory-v2-hold",lotNo:lot.lotNo,status:next?"HOLD":"NORMAL",reason:next?"관리자 HOLD 설정":"HOLD 해제",changedAt:nowIso(),changedBy:currentUser()}),next?"HOLD가 설정되었습니다.":"HOLD가 해제되었습니다.");
    }
    function applyRecommended(workOrderNo){
      try{
        const result=global.qmesApplyRecommendedLots(workOrderNo);
        if(!result?.ok)throw new Error(result?.error||"추천 LOT 적용 실패");
        global.dispatchEvent(new CustomEvent("qmes:data-updated"));
        alert("FEFO/FIFO 추천 LOT를 작업지시에 반영했습니다.");
      }catch(applyError){alert(text(applyError?.message||applyError));}
    }
    function openWorkOrder(workOrderNo){
      try{sessionStorage.setItem("qmes_current_tab","woIssue");sessionStorage.setItem("qmes_selected_workorder",workOrderNo);}catch(_error){}
      global.dispatchEvent(new CustomEvent("qmes:open-workorder",{detail:{workOrderNo}}));
      const button=Array.from(document.querySelectorAll("button")).find(node=>/작업지시서/.test(text(node.textContent)));
      if(button)button.click();else alert(`${workOrderNo} 작업지시로 이동할 수 있도록 선택 정보를 저장했습니다.`);
    }
    async function applyStocktake(take){
      if(!confirm(`${take.lotNo} 실사차이 ${fmt(take.diff)} ${take.unit}를 재고조정으로 반영하시겠습니까?`))return;
      await runSave(async()=>{
        const txId=id("ADJ");
        await saveRecord(`v2:tx:${txId}`,{kind:"inventory-v2-transaction",id:txId,type:"실사조정",code:take.code,name:take.name,materialType:take.materialType,lotNo:take.lotNo,qty:num(take.diff),unit:take.unit,occurredAt:nowIso(),documentNo:take.id||take.key,reason:take.reason||"재고실사 차이 반영",by:currentUser()});
        await saveRecord(take.key,{...take,kind:"inventory-v2-stocktake",adjusted:true,adjustmentId:txId,adjustedAt:nowIso(),adjustedBy:currentUser()});
      },"실사차이가 수불이력에 반영되었습니다.");
    }

    const ActivePage=view==="overview"?Overview:view==="receipts"?Receipts:view==="usage"?Usage:view==="adjustments"?Adjustments:view==="ledger"?Ledger:view==="stocktake"?Stocktake:view==="shortage"?Shortage:Trace;
    const page=h(ActivePage);

    function saveTransaction(data,type,quantity,success){
      const lot=domain.lots.find(row=>row.lotNo===data.lotNo);
      if(!lot){alert("LOT를 선택하세요.");return;}
      if(!(Math.abs(quantity)>0)){alert("수량을 입력하세요.");return;}
      if(quantity<0&&Math.abs(quantity)>Math.max(lot.balance,0)+0.000001){alert(`현재 LOT 잔량 ${fmt(lot.balance)} ${lot.unit}를 초과할 수 없습니다.`);return;}
      if(!text(data.reason)){alert("조정사유를 입력하세요.");return;}
      runSave(()=>{
        const txId=id(type.includes("반납")?"RTN":type==="폐기"?"DSP":"ADJ");
        return saveRecord(`v2:tx:${txId}`,{kind:"inventory-v2-transaction",id:txId,type,code:lot.code,name:lot.name,materialType:lot.type,lotNo:lot.lotNo,qty:round(quantity),unit:lot.unit,occurredAt:nowIso(),documentNo:data.documentNo||txId,reason:data.reason,by:currentUser()});
      },success);
    }

    return h("section",{className:"qmes-inventory-v2","data-inventory-v2":view},
      loading?h("div",{className:"qmes-inv2-loading"},"재고 데이터를 동기화하고 있습니다…"):null,
      error?h("div",{className:"qmes-inv2-error"},error,h("button",{type:"button",onClick:()=>load(true)},"다시 시도")):null,
      page,
      modal==="receipt"?h(ReceiptModal,{masters:domain.masters,lots:domain.lots,saving,onClose:()=>setModal(null),onSave:data=>runSave(async()=>{
        const receiptId=id("GR");
        await saveRecord(`v2:receipt:${data.internalLot}`,{kind:"inventory-v2-receipt",id:receiptId,...data});
      },"입고 및 LOT가 등록되었습니다.")}):null,
      modal==="iqc"&&selected?h(IqcModal,{lot:selected,saving,onClose:()=>{setModal(null);setSelected(null);},onSave:data=>runSave(async()=>{
        const receipt=domain.receipts.find(row=>upper(row.internalLot||row.lotNo)===upper(selected.lotNo));
        if(!receipt)throw new Error("수정할 입고 기록을 찾지 못했습니다.");
        await saveRecord(receipt.key,{...receipt,kind:"inventory-v2-receipt",status:data.status,iqcStatus:data.status,iqcNote:data.note,inspectedAt:nowIso(),inspectedBy:currentUser()});
        await saveRecord(`v2:hold:${selected.lotNo}`,{kind:"inventory-v2-hold",lotNo:selected.lotNo,status:data.status==="HOLD"?"HOLD":"NORMAL",reason:data.note||(data.status==="HOLD"?"IQC HOLD":"IQC 결과에 따른 HOLD 해제"),changedAt:nowIso(),changedBy:currentUser()});
      },"IQC 결과가 등록되었습니다.")}):null,
      modal==="lot"&&selected?h(LotDrawer,{item:selected,domain,onClose:()=>{setModal(null);setSelected(null);},onHold:toggleHold,onReturn:lot=>{setSelected(lot);setModal("return");},onAdjust:lot=>{setSelected(lot);setModal("adjust");},onTrace:lot=>{setTraceQuery(lot.lotNo);go("trace");setModal(null);setSelected(null);}}):null,
      modal==="return"?h(TransactionModal,{mode:"return",lots:domain.lots,selected,saving,onClose:()=>{setModal(null);setSelected(null);},onSave:data=>saveTransaction(data,"생산반납",Math.abs(num(data.qty)),"반납이 등록되었습니다.")}):null,
      modal==="waste"?h(TransactionModal,{mode:"waste",lots:domain.lots,selected,saving,onClose:()=>{setModal(null);setSelected(null);},onSave:data=>saveTransaction(data,"폐기",-Math.abs(num(data.qty)),"폐기가 등록되었습니다.")}):null,
      modal==="adjust"?h(TransactionModal,{mode:selected?.adjustType||"adjust",lots:domain.lots,selected,saving,onClose:()=>{setModal(null);setSelected(null);},onSave:data=>{
        const decrease=data.adjustType==="decrease"||selected?.adjustType==="decrease";
        saveTransaction(data,decrease?"재고감소 조정":"재고증가 조정",decrease?-Math.abs(num(data.qty)):Math.abs(num(data.qty)),"재고조정이 등록되었습니다.");
      }}):null,
      modal==="stocktake"?h(StocktakeModal,{lots:domain.lots,saving,onClose:()=>setModal(null),onSave:data=>runSave(()=>{
        const takeId=id("STK");
        const lot=domain.lots.find(row=>row.lotNo===data.lotNo);
        const diff=round(num(data.actualQty)-num(lot?.balance));
        return saveRecord(`v2:stocktake:${takeId}`,{kind:"inventory-v2-stocktake",id:takeId,code:lot?.code,name:lot?.name,materialType:lot?.type,lotNo:data.lotNo,unit:lot?.unit,bookQty:lot?.balance,actualQty:num(data.actualQty),diff,diffRate:lot?.balance?round(diff/lot.balance*100):0,reason:data.reason,countedAt:data.countedAt,result:diff===0?"일치":"차이",adjusted:false,by:currentUser()});
      },"재고실사가 등록되었습니다.")}):null
    );
  }

  function ReceiptModal({masters,lots,saving,onClose,onSave}){
    const initial=masters[0]||{};
    const [form,setForm]=ReactRef.useState({type:initial.type||"RAW",code:initial.code||"",name:initial.name||"",supplier:"",receivedAt:localDate(),qty:"",unit:initial.unit||"kg",supplierLot:"",internalLot:"",expiryDate:"",location:initial.location||"",iqcRequired:initial.iqcRequired!==false,status:initial.iqcRequired===false?"합격":"검사대기",note:""});
    const availableMasters=masters.filter(master=>master.type===form.type);
    function choose(code){
      const master=masters.find(row=>row.code===code)||{};
      setForm({...form,code:master.code||"",name:master.name||"",unit:master.unit||"",location:master.location||"",iqcRequired:master.iqcRequired!==false,status:master.iqcRequired===false?"합격":"검사대기"});
    }
    function generatedLot(){
      const master=masters.find(row=>row.code===form.code)||{};
      const prefix=(master.code||"LOT").replace(/^(RM|PM)-/,"").replace(/[^A-Z0-9]/gi,"").slice(0,8)||"MAT";
      const day=(form.receivedAt||localDate()).replace(/-/g,"").slice(2);
      const count=lots.filter(lot=>lot.lotNo.startsWith(`LOT-${prefix}-${day}`)).length+1;
      return `LOT-${prefix}-${day}-${String(count).padStart(2,"0")}`;
    }
    function submit(event){
      event.preventDefault();
      const data={...form,internalLot:upper(form.internalLot||generatedLot()),qty:num(form.qty)};
      if(!data.code||!data.supplier||!(data.qty>0)||!data.receivedAt)return alert("자재·공급업체·입고일·입고수량을 입력하세요.");
      if(lots.some(lot=>lot.lotNo===data.internalLot))return alert("이미 등록된 사내 LOT 번호입니다.");
      onSave(data);
    }
    return h(Modal,{title:"입고등록",description:"원재료와 부자재를 동일한 LOT 재고로 등록합니다.",onClose,wide:true},
      h("form",{onSubmit:submit},
        h("div",{className:"qmes-inv2-form-grid cols-3"},
          h(Field,{label:"구분",required:true},h("select",{value:form.type,onChange:event=>{
            const type=event.target.value,master=masters.find(row=>row.type===type)||{};
            setForm({...form,type,code:master.code||"",name:master.name||"",unit:master.unit||"",location:master.location||"",iqcRequired:master.iqcRequired!==false,status:master.iqcRequired===false?"합격":"검사대기"});
          }},h("option",{value:"RAW"},"원재료"),h("option",{value:"PACK"},"부자재"))),
          h(Field,{label:"자재코드 / 품명",required:true},h("select",{value:form.code,onChange:event=>choose(event.target.value)},availableMasters.map(master=>h("option",{key:master.code,value:master.code},`${master.code} · ${master.name}`)))),
          h(Field,{label:"공급업체",required:true},h("input",{value:form.supplier,onChange:event=>setForm({...form,supplier:event.target.value}),placeholder:"공급업체명"})),
          h(Field,{label:"입고일",required:true},h("input",{type:"date",value:form.receivedAt,onChange:event=>setForm({...form,receivedAt:event.target.value})})),
          h(Field,{label:"입고수량",required:true},h("input",{type:"number",min:"0",step:"0.001",value:form.qty,onChange:event=>setForm({...form,qty:event.target.value})})),
          h(Field,{label:"단위"},h("input",{value:form.unit,readOnly:true})),
          h(Field,{label:"공급사 LOT"},h("input",{value:form.supplierLot,onChange:event=>setForm({...form,supplierLot:event.target.value}),placeholder:"공급사 LOT"})),
          h(Field,{label:"사내 LOT"},h("input",{value:form.internalLot,onChange:event=>setForm({...form,internalLot:event.target.value}),placeholder:"비워두면 자동 생성"})),
          h(Field,{label:"유효기한"},h("input",{type:"date",value:form.expiryDate,onChange:event=>setForm({...form,expiryDate:event.target.value})})),
          h(Field,{label:"위치"},h("input",{value:form.location,onChange:event=>setForm({...form,location:event.target.value})})),
          h(Field,{label:"IQC 대상 여부"},h("select",{value:form.iqcRequired?"Y":"N",onChange:event=>{
            const required=event.target.value==="Y";
            setForm({...form,iqcRequired:required,status:required?"검사대기":"합격"});
          }},h("option",{value:"Y"},"대상"),h("option",{value:"N"},"생략"))),
          h(Field,{label:"입고 후 상태"},h("input",{value:form.status,readOnly:true})),
          h(Field,{label:"비고"},h("input",{value:form.note,onChange:event=>setForm({...form,note:event.target.value}),placeholder:"선택 입력"}))
        ),
        h("div",{className:"qmes-inv2-modal-actions"},h(Button,{tone:"ghost",onClick:onClose},"취소"),h(Button,{type:"submit",disabled:saving},saving?"저장 중…":"입고등록"))
      )
    );
  }

  function IqcModal({lot,saving,onClose,onSave}){
    const [status,setStatus]=ReactRef.useState(lot.iqc||"합격");
    const [note,setNote]=ReactRef.useState("");
    return h(Modal,{title:"IQC 결과등록",description:`${lot.lotNo} · ${lot.name}`,onClose},
      h("div",{className:"qmes-inv2-form-grid"},
        h(Field,{label:"검사결과",required:true},h("select",{value:status,onChange:event=>setStatus(event.target.value)},["검사대기","합격","HOLD","부적합"].map(value=>h("option",{key:value,value},value)))),
        h(Field,{label:"검사내용 / 사유"},h("textarea",{value:note,onChange:event=>setNote(event.target.value),placeholder:"검사결과와 사유를 입력하세요."}))
      ),
      h("div",{className:"qmes-inv2-modal-actions"},h(Button,{tone:"ghost",onClick:onClose},"취소"),h(Button,{disabled:saving,onClick:()=>onSave({status,note})},saving?"저장 중…":"결과 저장"))
    );
  }

  function TransactionModal({mode,lots,selected,saving,onClose,onSave}){
    const [form,setForm]=ReactRef.useState({lotNo:selected?.lotNo||"",qty:"",reason:"",documentNo:"",adjustType:selected?.adjustType||mode});
    const labels=mode==="return"?["생산 반납","반납수량"]:mode==="waste"?["폐기","폐기수량"]:mode==="decrease"?["재고감소 조정","감소수량"]:["재고증가 조정","증가수량"];
    const lot=lots.find(row=>row.lotNo===form.lotNo);
    return h(Modal,{title:labels[0],description:"모든 변경은 수불 트랜잭션과 사유를 남깁니다.",onClose},
      h("div",{className:"qmes-inv2-form-grid"},
        h(Field,{label:"LOT",required:true},h("select",{value:form.lotNo,onChange:event=>setForm({...form,lotNo:event.target.value})},h("option",{value:""},"LOT 선택"),lots.filter(row=>row.balance>0).map(row=>h("option",{key:row.lotNo,value:row.lotNo},`${row.lotNo} · ${row.name} · ${fmt(row.balance)} ${row.unit}`)))),
        h(Field,{label:labels[1],required:true},h("input",{type:"number",min:"0",step:"0.001",value:form.qty,onChange:event=>setForm({...form,qty:event.target.value}),placeholder:lot?`현재 ${fmt(lot.balance)} ${lot.unit}`:"수량"})),
        h(Field,{label:"연결문서"},h("input",{value:form.documentNo,onChange:event=>setForm({...form,documentNo:event.target.value}),placeholder:"작업지시 또는 조정문서 번호"})),
        h(Field,{label:"사유",required:true},h("textarea",{value:form.reason,onChange:event=>setForm({...form,reason:event.target.value}),placeholder:"조정사유를 반드시 입력하세요."}))
      ),
      h("div",{className:"qmes-inv2-modal-actions"},h(Button,{tone:"ghost",onClick:onClose},"취소"),h(Button,{tone:mode==="waste"||mode==="decrease"?"danger":"primary",disabled:saving,onClick:()=>onSave(form)},saving?"저장 중…":`${labels[0]} 등록`))
    );
  }

  function StocktakeModal({lots,saving,onClose,onSave}){
    const [form,setForm]=ReactRef.useState({lotNo:"",actualQty:"",reason:"",countedAt:localDate()});
    const lot=lots.find(row=>row.lotNo===form.lotNo);
    const diff=lot?round(num(form.actualQty)-lot.balance):0;
    return h(Modal,{title:"재고실사 등록",description:"실사차이는 검토 후 별도 조정반영합니다.",onClose},
      h("div",{className:"qmes-inv2-form-grid"},
        h(Field,{label:"실사일",required:true},h("input",{type:"date",value:form.countedAt,onChange:event=>setForm({...form,countedAt:event.target.value})})),
        h(Field,{label:"LOT",required:true},h("select",{value:form.lotNo,onChange:event=>setForm({...form,lotNo:event.target.value})},h("option",{value:""},"LOT 선택"),lots.map(row=>h("option",{key:row.lotNo,value:row.lotNo},`${row.lotNo} · ${row.name}`)))),
        h(Field,{label:"장부재고"},h("input",{value:lot?`${fmt(lot.balance)} ${lot.unit}`:"",readOnly:true})),
        h(Field,{label:"실사재고",required:true},h("input",{type:"number",min:"0",step:"0.001",value:form.actualQty,onChange:event=>setForm({...form,actualQty:event.target.value})})),
        h(Field,{label:"차이"},h("input",{value:lot?`${diff>0?"+":""}${fmt(diff)} ${lot.unit}`:"",readOnly:true})),
        h(Field,{label:"차이 사유"},h("textarea",{value:form.reason,onChange:event=>setForm({...form,reason:event.target.value}),placeholder:"차이가 있으면 사유를 입력하세요."}))
      ),
      h("div",{className:"qmes-inv2-modal-actions"},h(Button,{tone:"ghost",onClick:onClose},"취소"),h(Button,{disabled:saving,onClick:()=>{
        if(!form.lotNo||form.actualQty==="")return alert("LOT와 실사재고를 입력하세요.");
        if(diff!==0&&!text(form.reason))return alert("실사차이 사유를 입력하세요.");
        onSave(form);
      }},saving?"저장 중…":"실사등록"))
    );
  }

  function LotDrawer({item,domain,onClose,onHold,onReturn,onAdjust,onTrace}){
    const lots=item.lots||[item];
    const totals=lots.reduce((acc,lot)=>({stock:acc.stock+num(lot.balance),hold:acc.hold+(lot.hold?Math.max(num(lot.balance),0):0),available:acc.available+num(lot.available)}),{stock:0,hold:0,available:0});
    const master=domain.itemRows.find(row=>row.code===(item.code||lots[0]?.code))||item;
    const shortage=Math.max(num(master.safety)-totals.available,0);
    const txs=domain.transactions.filter(tx=>lots.some(lot=>upper(lot.lotNo)===upper(tx.lotNo)));
    return h("div",{className:"qmes-inv2-drawer-backdrop",onMouseDown:event=>{if(event.target===event.currentTarget)onClose();}},
      h("aside",{className:"qmes-inv2-drawer",role:"dialog","aria-modal":"true","aria-label":"LOT 상세"},
        h("header",null,h("div",null,h("span",null,master.code),h("h3",null,`${master.name} 재고 상세`),h("p",null,`현재고 ${fmt(totals.stock)} ${master.unit} · HOLD ${fmt(totals.hold)} ${master.unit} · 가용 ${fmt(totals.available)} ${master.unit} · 안전재고 ${fmt(master.safety)} ${master.unit} · 부족 ${fmt(shortage)} ${master.unit}`)),h("button",{type:"button",onClick:onClose},"×")),
        h("div",{className:"qmes-inv2-drawer-actions"},h(Button,{onClick:()=>onReturn(lots[0])},"반납등록"),h(Button,{tone:"secondary",onClick:()=>onAdjust(lots[0])},"재고조정")),
        h("div",{className:"qmes-inv2-drawer-body"},
          h(Table,{headers:["LOT No.","공급업체","입고일","입고량","사용량","잔량","IQC","HOLD","유효기한","위치","관리"],minWidth:"1040px"},
            lots.length?lots.map(lot=>h("tr",{key:lot.lotNo},
              h("td",{className:"is-code"},lot.lotNo),h("td",null,lot.supplier),h("td",null,lot.receivedAt||"-"),
              h("td",{className:"is-number"},fmt(lot.received)),h("td",{className:"is-number"},fmt(Math.max(num(lot.received)-num(lot.balance),0))),
              h("td",{className:"is-number is-available"},fmt(lot.balance)),h("td",null,lot.iqc),
              h("td",null,h(Chip,{kind:lot.hold?"hold":"normal"},lot.hold?"HOLD":"정상")),
              h("td",null,lot.expiryDate||"-"),h("td",null,lot.location),
              h("td",null,h(Button,{tone:lot.hold?"success":"danger",onClick:()=>onHold(lot)},lot.hold?"해제":"HOLD"))
            )):h(Empty,{colSpan:11,text:"LOT가 없습니다."})
          ),
          h("h4",null,"입고 → IQC → 생산사용 → 반납 → 조정 → 현재잔량"),
          h(Table,{headers:["일시","구분","LOT","변동량","연결문서","사유/처리자"],minWidth:"760px"},
            txs.length?txs.map(tx=>h("tr",{key:tx.key},
              h("td",null,dateTimeLabel(tx.occurredAt||tx.savedAt)),h("td",null,tx.type),h("td",{className:"is-code"},tx.lotNo),
              h("td",{className:`is-number ${num(tx.qty)<0?"is-shortage":"is-available"}`},`${num(tx.qty)>0?"+":""}${fmt(tx.qty)} ${tx.unit}`),
              h("td",null,tx.documentNo||"-"),h("td",null,tx.reason||tx.by||"-")
            )):h(Empty,{colSpan:6,text:"사용 이력이 없습니다."})
          )
        )
      )
    );
  }

  function installRouterAndSidebar(){
    try{
      if(typeof TABS!=="undefined"&&Array.isArray(TABS)){
        const inventory=TABS.find(tab=>tab?.id==="inv");
        if(inventory){inventory.comp=UnifiedInventoryV2;inventory.label="재고관리";}
      }
    }catch(error){console.warn("[QMES] inventory v2 router patch failed",error);}
    const side=document.getElementById("qmes-sync-sidebar");
    const clean=value=>text(value).replace(/[›〉]/g,"").replace(/\s+/g," ");
    if(!side||clean(side.querySelector(".qmes-side-title")?.textContent)!=="재고관리")return;
    const wrap=side.querySelector(".qmes-side-items");
    if(!wrap)return;
    if(wrap.dataset.inventoryV2!=="true"){
      wrap.dataset.inventoryV2="true";wrap.replaceChildren();
      PAGES.forEach(page=>{
        const button=document.createElement("button");
        button.type="button";button.className="qmes-side-item";button.dataset.inventoryV2View=page.view;button.textContent=page.label;wrap.appendChild(button);
      });
    }
    let active="overview";
    try{active=sessionStorage.getItem(VIEW_KEY)||"overview";}catch(_error){}
    wrap.querySelectorAll("[data-inventory-v2-view]").forEach(button=>button.classList.toggle("is-active",button.dataset.inventoryV2View===active));
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("#qmes-sync-sidebar [data-inventory-v2-view]");
    if(button){
      event.preventDefault();event.stopPropagation();
      const view=button.dataset.inventoryV2View;
      try{sessionStorage.setItem(VIEW_KEY,view);}catch(_error){}
      global.dispatchEvent(new CustomEvent("qmes:inventory-v2-view",{detail:{view}}));
      setTimeout(installRouterAndSidebar,0);
      return;
    }
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top&&text(top.textContent).replace(/\s+/g,"")==="재고관리"){
      setTimeout(installRouterAndSidebar,0);setTimeout(installRouterAndSidebar,80);setTimeout(installRouterAndSidebar,220);
    }
  },true);

  const style=document.createElement("style");
  style.id="qmes-inventory-v2-style";
  style.textContent=`
    .qmes-inventory-v2{width:min(1640px,calc(100vw - 28px));margin:0 auto;padding-bottom:32px;color:#dbe8f3;font-family:Pretendard,'Noto Sans KR',system-ui,sans-serif}
    .qmes-inv2-page-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:0 0 16px}
    .qmes-inv2-page-intro h2{margin:0;color:#f8fafc;font-size:24px;font-weight:900;letter-spacing:-.035em}
    .qmes-inv2-page-intro p{margin:6px 0 0;color:#8da6bb;font-size:13px}
    .qmes-inv2-actions,.qmes-inv2-row-actions,.qmes-inv2-modal-actions,.qmes-inv2-drawer-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .qmes-inv2-btn{min-height:36px;padding:0 13px;border:1px solid transparent;border-radius:7px;font:800 12px/1 Pretendard,sans-serif;cursor:pointer;transition:.15s}
    .qmes-inv2-btn:disabled{opacity:.5;cursor:default}
    .qmes-inv2-btn.is-primary{background:#2563eb;color:#fff}.qmes-inv2-btn.is-secondary{border-color:#3b82f6;background:#102a46;color:#93c5fd}
    .qmes-inv2-btn.is-ghost{border-color:#3a526a;background:#13283d;color:#cbd5e1}.qmes-inv2-btn.is-danger{border-color:#9f1239;background:#3a1823;color:#fecdd3}
    .qmes-inv2-btn.is-success{border-color:#047857;background:#102f2a;color:#a7f3d0}.qmes-inv2-btn.is-warning{border-color:#a16207;background:#342913;color:#fde68a}
    .qmes-inv2-summary-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .qmes-inv2-summary{min-height:104px;padding:15px 16px;border:1px solid #29445e;border-radius:10px;background:#0d2237;box-shadow:0 2px 10px rgba(2,8,23,.14)}
    .qmes-inv2-summary-label{color:#8da6bb;font-size:11px;font-weight:800}.qmes-inv2-summary strong{display:block;margin-top:9px;color:#f8fafc;font-size:22px;font-weight:950;white-space:nowrap}
    .qmes-inv2-summary small{display:block;margin-top:5px;color:#607f99;font-size:10px}.qmes-inv2-summary.is-success{border-color:#166b55}.qmes-inv2-summary.is-success strong{color:#6ee7b7}
    .qmes-inv2-summary.is-warning{border-color:#785d1c}.qmes-inv2-summary.is-warning strong{color:#fde68a}.qmes-inv2-summary.is-danger{border-color:#7f1d1d}.qmes-inv2-summary.is-danger strong{color:#fda4af}
    .qmes-inv2-filterbar{display:grid;grid-template-columns:auto minmax(220px,1fr) 160px 130px 150px;gap:9px;margin-bottom:12px;padding:11px;border:1px solid #29445e;border-radius:10px;background:#0d2237}
    .qmes-inv2-filterbar input,.qmes-inv2-filterbar select,.qmes-inv2-trace-search input,.qmes-inv2-field input,.qmes-inv2-field select,.qmes-inv2-field textarea{width:100%;min-height:38px;box-sizing:border-box;border:1px solid #334b65;border-radius:7px;background:#12263c;color:#e2e8f0;padding:0 10px;font:700 12px Pretendard,sans-serif;outline:none}
    .qmes-inv2-field textarea{min-height:80px;padding:10px;resize:vertical}
    .qmes-inv2-filterbar input:focus,.qmes-inv2-filterbar select:focus,.qmes-inv2-field input:focus,.qmes-inv2-field select:focus,.qmes-inv2-field textarea:focus,.qmes-inv2-trace-search input:focus{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.12)}
    .qmes-inv2-segments{display:flex;padding:3px;border:1px solid #334b65;border-radius:7px;background:#091b2d}.qmes-inv2-segments button{min-width:68px;border:0;border-radius:5px;background:transparent;color:#8da6bb;font:800 12px Pretendard;cursor:pointer}
    .qmes-inv2-segments button.is-active{background:#2563eb;color:#fff}
    .qmes-inv2-table-wrap{overflow:auto;border:1px solid #29445e;border-radius:10px;background:#0d2237}.qmes-inv2-table{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
    .qmes-inv2-table th{height:42px;padding:9px 10px;border-bottom:1px solid #29445e;background:#142b42;color:#9ab2c7;font-size:11px;font-weight:800;text-align:center;white-space:nowrap;position:sticky;top:0;z-index:1}
    .qmes-inv2-table td{height:44px;padding:9px 10px;border-bottom:1px solid #173149;color:#dbe8f3;text-align:center;white-space:nowrap}.qmes-inv2-table tbody tr:last-child td{border-bottom:0}
    .qmes-inv2-table tbody tr:hover td{background:#10263c}.qmes-inv2-table tr.is-clickable{cursor:pointer}
    .qmes-inv2-table td.is-code{color:#7dd3fc;font-family:ui-monospace,SFMono-Regular,monospace;font-weight:800}.qmes-inv2-table td.is-name{text-align:left;color:#f1f5f9;font-weight:800}
    .qmes-inv2-table td.is-number{font-variant-numeric:tabular-nums;text-align:right}.qmes-inv2-table td.is-available{color:#6ee7b7;font-weight:850}
    .qmes-inv2-table td.is-hold,.qmes-inv2-table td.is-shortage{color:#fda4af;font-weight:850}.qmes-inv2-empty{height:120px!important;color:#64748b!important;text-align:center!important}
    .qmes-inv2-chip-list{display:flex;justify-content:center;gap:4px;flex-wrap:wrap}.qmes-inv2-chip{display:inline-flex;align-items:center;min-height:23px;padding:0 8px;border:1px solid #365169;border-radius:999px;background:#172d42;color:#cbd5e1;font-size:10px;font-weight:850;white-space:nowrap}
    .qmes-inv2-chip.is-normal{border-color:#166b55;background:#0d2e2a;color:#8ff0cf}.qmes-inv2-chip.is-shortage,.qmes-inv2-chip.is-danger,.qmes-inv2-chip.is-hold{border-color:#7f1d1d;background:#321921;color:#fecdd3}
    .qmes-inv2-chip.is-warning,.qmes-inv2-chip.is-expiry,.qmes-inv2-chip.is-difference{border-color:#785d1c;background:#302812;color:#fde68a}.qmes-inv2-chip.is-raw{border-color:#1d4ed8;background:#132f55;color:#bfdbfe}
    .qmes-inv2-chip.is-pack{border-color:#6d28d9;background:#29184f;color:#ddd6fe}.qmes-inv2-chip.is-empty{color:#94a3b8}
    .qmes-inv2-callout{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:12px 14px;border:1px solid #1d4ed8;border-radius:9px;background:#102a46;color:#bfdbfe;font-size:12px}
    .qmes-inv2-callout.is-warning{border-color:#785d1c;background:#302812;color:#fde68a}.qmes-inv2-callout strong{font-weight:900}.qmes-inv2-callout span{color:inherit;opacity:.8}
    .qmes-inv2-action-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}.qmes-inv2-action-card{display:flex;flex-direction:column;align-items:flex-start;gap:7px;min-height:90px;padding:14px;border:1px solid #29445e;border-radius:10px;background:#0d2237;color:#e2e8f0;text-align:left;cursor:pointer}
    .qmes-inv2-action-card strong{font-size:14px}.qmes-inv2-action-card span{color:#8da6bb;font-size:11px}.qmes-inv2-action-card.is-danger{border-color:#7f1d1d}.qmes-inv2-action-card.is-warning{border-color:#785d1c}.qmes-inv2-action-card.is-success{border-color:#166b55}
    .qmes-inv2-loading,.qmes-inv2-error,.qmes-inv2-empty-panel{margin-bottom:12px;padding:14px;border:1px solid #29445e;border-radius:9px;background:#10263c;color:#9ab2c7;font-size:12px}
    .qmes-inv2-error{display:flex;justify-content:space-between;border-color:#7f1d1d;color:#fecdd3}.qmes-inv2-error button{border:0;background:transparent;color:#fff;font-weight:800;cursor:pointer}
    .qmes-inv2-modal-backdrop,.qmes-inv2-drawer-backdrop{position:fixed;inset:0;z-index:21000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,8,23,.78);backdrop-filter:blur(3px)}
    .qmes-inv2-modal{width:min(620px,100%);max-height:calc(100vh - 36px);overflow:auto;border:1px solid #3a526a;border-radius:14px;background:#0d2237;box-shadow:0 24px 80px rgba(0,0,0,.5)}.qmes-inv2-modal.is-wide{width:min(980px,100%)}
    .qmes-inv2-modal>header,.qmes-inv2-drawer>header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #29445e}
    .qmes-inv2-modal>header h3,.qmes-inv2-drawer>header h3{margin:0;color:#f8fafc;font-size:19px;font-weight:900}.qmes-inv2-modal>header p,.qmes-inv2-drawer>header p{margin:5px 0 0;color:#8da6bb;font-size:12px}
    .qmes-inv2-modal>header>button,.qmes-inv2-drawer>header>button{width:36px;height:36px;border:1px solid #3a526a;border-radius:8px;background:#13283d;color:#cbd5e1;font-size:22px;cursor:pointer}
    .qmes-inv2-modal-body{padding:18px 20px}.qmes-inv2-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.qmes-inv2-form-grid.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
    .qmes-inv2-field{display:flex;flex-direction:column;gap:6px;color:#9ab2c7;font-size:11px;font-weight:800}.qmes-inv2-field b{color:#fda4af}.qmes-inv2-field input[readonly]{background:#0a1d30;color:#7f98ad}
    .qmes-inv2-modal-actions{justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid #29445e}.qmes-inv2-drawer-backdrop{justify-content:flex-end;padding:0}
    .qmes-inv2-drawer{width:min(1180px,94vw);height:100vh;overflow:auto;background:#0b1d30;box-shadow:-24px 0 70px rgba(0,0,0,.4)}.qmes-inv2-drawer>header span{color:#7dd3fc;font:800 11px ui-monospace,monospace}
    .qmes-inv2-drawer-actions{padding:12px 20px;border-bottom:1px solid #29445e}.qmes-inv2-drawer-body{display:flex;flex-direction:column;gap:14px;padding:18px 20px}.qmes-inv2-drawer-body h4{margin:8px 0 -4px;color:#cbd5e1;font-size:13px}
    .qmes-inv2-trace-search{display:grid;grid-template-columns:1fr auto;gap:9px;margin-bottom:14px;padding:14px;border:1px solid #29445e;border-radius:10px;background:#0d2237}
    .qmes-inv2-trace-flow{display:grid;grid-template-columns:1fr 44px 1fr 44px 1fr 44px 1fr;align-items:stretch}.qmes-inv2-trace-flow section{min-height:180px;padding:18px;border:1px solid #29445e;border-radius:11px;background:#0d2237}
    .qmes-inv2-trace-flow section>span{display:block;color:#7dd3fc;font-size:10px;font-weight:900;letter-spacing:.08em}.qmes-inv2-trace-flow section>strong{display:block;margin-top:12px;color:#f8fafc;font-size:16px;line-height:1.45}
    .qmes-inv2-trace-flow section>p{min-height:42px;margin:10px 0 14px;color:#8da6bb;font-size:12px;line-height:1.55}.qmes-inv2-trace-arrow{display:flex;align-items:center;justify-content:center;color:#38bdf8;font-size:22px}
    .qmes-side-item[data-inventory-v2-view]::before{content:'';display:inline-block;width:5px;height:5px;margin-right:8px;border-radius:50%;background:#557089;vertical-align:middle}.qmes-side-item[data-inventory-v2-view].is-active::before{background:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.14)}
    @media(max-width:1450px){.qmes-inv2-summary-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.qmes-inv2-trace-flow{grid-template-columns:1fr}.qmes-inv2-trace-arrow{height:34px}}
    @media(max-width:1000px){.qmes-inventory-v2{width:calc(100vw - 18px)}.qmes-inv2-filterbar{grid-template-columns:1fr 1fr}.qmes-inv2-segments{grid-column:1/-1}.qmes-inv2-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.qmes-inv2-action-grid{grid-template-columns:repeat(2,1fr)}.qmes-inv2-form-grid.cols-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:640px){.qmes-inv2-page-intro{align-items:flex-start;flex-direction:column}.qmes-inv2-page-intro h2{font-size:20px}.qmes-inv2-summary-grid,.qmes-inv2-filterbar,.qmes-inv2-action-grid,.qmes-inv2-form-grid,.qmes-inv2-form-grid.cols-3{grid-template-columns:1fr}.qmes-inv2-segments{grid-column:auto}.qmes-inv2-summary{min-height:88px}.qmes-inv2-drawer{width:100vw}.qmes-inv2-callout{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);

  global.InventoryManagementV2=UnifiedInventoryV2;
  global.qmesBuildInventoryV2Domain=buildDomain;
  global.qmesRecommendInventoryLots=(code,quantity,rows)=>recommendLots(code,quantity,rows||buildDomain([]).lots);
  global.addEventListener("qmes:inventory-stage3-view-ready",installRouterAndSidebar);
  global.addEventListener("qmes:inventory-stage3-ready",installRouterAndSidebar);
  global.addEventListener("qmes:auth-ready",()=>setTimeout(installRouterAndSidebar,0));
  new MutationObserver(installRouterAndSidebar).observe(document.documentElement,{childList:true,subtree:true});
  installRouterAndSidebar();setTimeout(installRouterAndSidebar,250);setTimeout(installRouterAndSidebar,1000);
  console.info("[QMES] 통합 재고관리 v2 활성화");
})(window);

