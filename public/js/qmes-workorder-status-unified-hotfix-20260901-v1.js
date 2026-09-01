/* NAMO QMES - unified work-order completion/status hotfix - 2026-09-01
 * Keeps Work Order Management and Production MRP on one completion rule.
 * Completion evidence: production result, completed quantity, or OQC pass.
 * Does not invent production quantities when no production result exists.
 */
(function installUnifiedWorkOrderStatus(global){
  "use strict";
  if(global.__QMES_WORKORDER_STATUS_UNIFIED_20260901_V1__) return;
  global.__QMES_WORKORDER_STATUS_UNIFIED_20260901_V1__=true;

  const clean=value=>String(value==null?"":value).trim();
  const norm=value=>clean(value).toUpperCase().replace(/[^A-Z0-9가-힣]/g,"");
  const number=value=>{
    if(value==null||clean(value)==="") return null;
    const parsed=Number(clean(value).replace(/,/g,""));
    return Number.isFinite(parsed)&&parsed>=0?parsed:null;
  };
  const isPass=value=>/^(합격|적합|PASS|OK|APPROVED|완료)$/i.test(clean(value));
  const isComplete=value=>/완료|생산완료|COMPLETED|COMPLETE|DONE/i.test(clean(value));
  const first=(object,keys)=>{
    for(const key of keys){
      const value=object?.[key];
      if(value!==undefined&&value!==null&&clean(value)!=="") return value;
    }
    return null;
  };
  const parsePayload=record=>{
    const value=record?.payload;
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){
      try{return JSON.parse(value);}catch(_){return {};}
    }
    return {};
  };

  let remoteOqcRows=[];
  let remoteLoading=false;
  let reconciling=false;
  let scheduled=false;
  let syncTimer=null;

  function batchFor(lotNo){
    const key=norm(lotNo);
    return (global.DB?.batches||[]).find(row=>norm(row?.no||row?.lot||row?.workOrder)===key)||{};
  }

  function lotFor(lotNo){
    const key=clean(lotNo);
    if(global.DB?.lots?.[key]) return global.DB.lots[key];
    const wanted=norm(key);
    const found=Object.keys(global.DB?.lots||{}).find(id=>norm(id)===wanted);
    return found?global.DB.lots[found]:{};
  }

  function docFor(lotNo){
    const key=clean(lotNo);
    if(global.DB?.woDocs?.[key]) return global.DB.woDocs[key];
    const wanted=norm(key);
    const found=Object.keys(global.DB?.woDocs||{}).find(id=>norm(id)===wanted);
    return found?global.DB.woDocs[found]:{};
  }

  function inspectionLot(row){
    return first(row,["lot","lotNo","productionLot","workOrderNo","workOrder","woNo"]);
  }

  function rowsFor(kind,lotNo){
    const key=norm(lotNo);
    const local=Array.isArray(global.DB?.insp?.[kind])?global.DB.insp[kind]:[];
    const remote=kind==="OQC"?remoteOqcRows:[];
    return [...local,...remote].filter(row=>norm(inspectionLot(row))===key);
  }

  function productionResult(lotNo){
    const doc=docFor(lotNo);
    const batch=batchFor(lotNo);
    const lot=lotFor(lotNo);
    return doc.productionResult||batch.productionResult||lot.productionResult||{};
  }

  function actualQuantity(lotNo){
    const doc=docFor(lotNo);
    const batch=batchFor(lotNo);
    const lot=lotFor(lotNo);
    const result=productionResult(lotNo);
    const candidates=[
      first(result,["totalQty","productionQty","actualQty","goodQty"]),
      first(doc,["productionActual","totalQty","productionQty","actualQty","done"]),
      first(batch,["done","productionQty","totalQty","actualQty"]),
      first(lot,["productionQty","totalQty","actualQty","qty"])
    ];
    for(const candidate of candidates){
      const value=number(candidate);
      if(value!=null&&value>0) return value;
    }
    return null;
  }

  function hasCompletionEvidence(lotNo){
    const doc=docFor(lotNo);
    const batch=batchFor(lotNo);
    const lot=lotFor(lotNo);
    const result=productionResult(lotNo);
    const statuses=[doc.status,batch.status,lot.status,lot.productionStatus];
    if(statuses.some(isComplete)) return true;
    if(first(result,["completedAt","completeAt","finishedAt"])||first(doc,["completedAt","completeAt","finishedAt"])||first(batch,["completedAt","completeAt","finishedAt"])) return true;
    const plan=number(first(batch,["plan","planQty","plannedQty"])??first(doc,["plan","planQty","plannedQty"]));
    const actual=actualQuantity(lotNo);
    if(plan!=null&&plan>0&&actual!=null&&actual>=plan) return true;
    return rowsFor("OQC",lotNo).some(row=>isPass(first(row,["judge","judgment","result","inspectionResult","status"])));
  }

  function unifiedStatus(lotNo){
    const doc=docFor(lotNo);
    if(hasCompletionEvidence(lotNo)) return "완료";
    const manual=clean(doc.manualStatus);
    if(["발행","생산중","검사중","완료"].includes(manual)) return manual;
    if(rowsFor("PQC",lotNo).length||rowsFor("OQC",lotNo).length) return "검사중";
    return actualQuantity(lotNo)>0?"생산중":"발행";
  }

  global.qmesUnifiedWorkOrderStatus=unifiedStatus;
  global.getAutoWoStatus=unifiedStatus;
  global.qmesWorkOrderActualQuantity=actualQuantity;

  function lotNumbers(){
    const values=new Set(Object.keys(global.DB?.woDocs||{}));
    (global.DB?.batches||[]).forEach(row=>{
      const value=clean(row?.no||row?.lot||row?.workOrder);
      if(value) values.add(value);
    });
    return [...values];
  }

  function reconcileOne(lotNo){
    if(!global.DB) return false;
    const key=clean(lotNo);
    const doc=docFor(key);
    const batch=batchFor(key);
    const lot=lotFor(key);
    const status=unifiedStatus(key);
    const actual=actualQuantity(key);
    const completed=status==="완료";
    let changed=false;

    if(doc&&Object.keys(doc).length){
      if(clean(doc.status)!==status){doc.status=status;changed=true;}
      /* OQC/production completion must outrank an old manual '발행' value. */
      if(completed&&clean(doc.manualStatus)!=="완료"){doc.manualStatus="완료";changed=true;}
      if(actual!=null&&number(doc.productionActual)!==actual){doc.productionActual=actual;changed=true;}
    }
    if(batch&&Object.keys(batch).length){
      const batchStatus=status==="생산중"||status==="검사중"?"진행중":status;
      if(clean(batch.status)!==batchStatus){batch.status=batchStatus;changed=true;}
      if(actual!=null&&number(batch.done)!==actual){batch.done=actual;changed=true;}
    }
    if(lot&&Object.keys(lot).length){
      if(clean(lot.productionStatus)!==status){lot.productionStatus=status;changed=true;}
      if(actual!=null&&number(lot.productionQty)!==actual){lot.productionQty=actual;changed=true;}
    }
    return changed;
  }

  function syncChangedLots(lots){
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>{
      if(typeof global.qmesSyncWorkOrder!=="function") return;
      lots.forEach(lotNo=>{
        Promise.resolve(global.qmesSyncWorkOrder(lotNo)).catch(error=>console.warn("작업지시 완료상태 공용 동기화 실패:",lotNo,error?.message||error));
      });
    },400);
  }

  function reconcileAll(){
    if(reconciling||!global.DB) return;
    reconciling=true;
    try{
      const changedLots=[];
      lotNumbers().forEach(lotNo=>{if(reconcileOne(lotNo)) changedLots.push(lotNo);});
      if(changedLots.length){
        if(typeof global.dbSave==="function") global.dbSave();
        syncChangedLots(changedLots);
      }
      refreshIssuedTable();
    }finally{reconciling=false;}
  }

  async function pullOqc(){
    if(remoteLoading||typeof global.qmesSyncList!=="function") return;
    remoteLoading=true;
    try{
      const records=await global.qmesSyncList("oqc")||[];
      const rows=[];
      records.forEach(record=>{
        const payload=parsePayload(record);
        if(payload.deleted) return;
        if(Array.isArray(payload.rows)) payload.rows.forEach(row=>rows.push(row));
      });
      remoteOqcRows=rows;
    }catch(error){
      console.warn("작업지시 OQC 완료상태 조회 실패:",error?.message||error);
    }finally{
      remoteLoading=false;
      reconcileAll();
    }
  }

  const PRODUCT_LABELS={
    DBA1501:"절연슬러리(NBA20-HM01) / DBA1501"
  };

  function refreshIssuedTable(){
    document.querySelectorAll(".qmes-issued-table-v2 tbody tr").forEach(row=>{
      const cells=row.querySelectorAll("td");
      if(cells.length<10) return;
      const lotButton=cells[0].querySelector("button");
      const itemButton=cells[1].querySelector("button");
      const lotNo=clean(lotButton?.textContent);
      if(!lotNo) return;
      const status=unifiedStatus(lotNo);
      const select=cells[9].querySelector("select");
      if(select){
        if(select.value!==status) select.value=status;
        select.classList.remove("status-발행","status-생산중","status-검사중","status-완료");
        select.classList.add(`status-${status}`);
      }
      const actual=actualQuantity(lotNo);
      if(actual!=null){
        const text=`${actual.toLocaleString("ko-KR",{minimumFractionDigits:3,maximumFractionDigits:3})} kg`;
        if(clean(cells[4].textContent)!==text) cells[4].textContent=text;
      }else if(status==="완료"&&clean(cells[4].textContent)==="—"){
        cells[4].textContent="실적 미입력";
        cells[4].title="OQC 완료 상태이나 생산실적 수량이 입력되지 않았습니다.";
      }

      const sourceProduct=clean(itemButton?.dataset.qmesSourceProduct||itemButton?.textContent);
      const displayProduct=PRODUCT_LABELS[sourceProduct];
      if(itemButton&&displayProduct){
        itemButton.dataset.qmesSourceProduct=sourceProduct;
        if(clean(itemButton.textContent)!==displayProduct) itemButton.textContent=displayProduct;
        itemButton.title=displayProduct;
      }
      if(norm(lotNo)===norm(sourceProduct)){
        row.classList.add("qmes-lot-product-conflict");
        lotButton.title="기존 데이터: 제품코드와 LOT 번호가 동일합니다. 신규 발행부터 별도 LOT를 사용하세요.";
      }
    });
  }

  function blockProductAsLot(event){
    const button=event.target?.closest?.("button");
    const shell=button?.closest?.(".qmes-wo-issue-shell");
    if(!shell||clean(button.textContent)!=="저장") return;
    const lotInput=shell.querySelector('input[placeholder="LOT No."]');
    const fields=[...shell.querySelectorAll(".qmes-wo-form-field")];
    const productField=fields.find(field=>clean(field.textContent).includes("공정 / 품목"));
    const product=clean(productField?.querySelector("select")?.value);
    const lotNo=clean(lotInput?.value);
    if(!product||!lotNo||norm(product)!==norm(lotNo)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    global.alert("LOT No.에는 제품코드와 다른 고유 LOT 번호를 입력해 주세요. 자동 채번 번호 사용을 권장합니다.");
    lotInput?.focus();
  }

  function schedule(options={}){
    if(scheduled) return;
    scheduled=true;
    setTimeout(()=>{
      scheduled=false;
      reconcileAll();
      if(options.pullOqc) pullOqc();
    },80);
  }

  function wrapWorkOrderPull(){
    if(typeof global.qmesSyncPullWorkOrders!=="function"||global.qmesSyncPullWorkOrders.__qmesUnifiedStatusV1) return;
    const original=global.qmesSyncPullWorkOrders;
    const wrapped=async function(){
      const result=await original.apply(this,arguments);
      reconcileAll();
      return result;
    };
    wrapped.__qmesUnifiedStatusV1=true;
    global.qmesSyncPullWorkOrders=wrapped;
  }

  function start(){
    wrapWorkOrderPull();
    document.addEventListener("click",blockProductAsLot,true);
    new MutationObserver(()=>schedule()).observe(document.body,{childList:true,subtree:true});
    global.addEventListener("focus",()=>schedule({pullOqc:true}));
    global.addEventListener("qmes:data-updated",()=>setTimeout(()=>schedule({pullOqc:true}),0));
    document.addEventListener("qmes:data-updated",()=>setTimeout(()=>schedule({pullOqc:true}),0));
    schedule({pullOqc:true});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(window);
