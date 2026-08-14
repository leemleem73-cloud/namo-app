/* Inventory v2 RAW receipt automation from IQC — 2026-08-14
 * RAW receipts are created/updated from IQC records. Manual receipt entry remains PACK-only.
 */
(function inventoryRawIqcAutoReceipt(global){
  "use strict";
  if(global.__QMES_INVENTORY_RAW_IQC_AUTO_RECEIPT_20260814__)return;
  global.__QMES_INVENTORY_RAW_IQC_AUTO_RECEIPT_20260814__=true;

  const text=value=>String(value??"").trim();
  const upper=value=>text(value).toUpperCase();
  const clean=value=>text(value).replace(/\s+/g," ");
  const quantity=value=>{
    const match=text(value).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);
    const parsed=match?Number(match[0]):0;
    return Number.isFinite(parsed)?parsed:0;
  };
  const payloadOf=record=>{
    let payload=record?.payload;
    if(!payload||typeof payload!=="object"){
      try{payload=JSON.parse(payload||"{}");}catch(_error){payload={};}
    }
    return payload;
  };
  const compact=value=>upper(value).replace(/[^0-9A-Z가-힣]/g,"");
  const knownMaterials=[
    {code:"RM-NMP",aliases:["NMP"],location:"A-4-1 / A-4-2"},
    {code:"RM-BYK180",aliases:["BYK180","BYK180(분산제)","분산제"],location:"A-02"},
    {code:"RM-AOH30",aliases:["AOH30","AOH30(BOEHMITE)","BOEHMITE"],location:"A-03"},
    {code:"RM-SBS",aliases:["SBS"],location:"A-04"},
    {code:"RM-PVDF",aliases:["PVDF"],location:"A-05"},
    {code:"RM-SBR",aliases:["SBR"],location:"A-06"}
  ];

  let syncing=false;
  let lastSnapshot="";
  let previousLocalKeys=null;

  function stableHash(value){
    let hash=2166136261;
    for(const char of text(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
    return (hash>>>0).toString(36).toUpperCase().slice(0,7);
  }

  function safeKey(value){
    return upper(value).replace(/[^0-9A-Z_-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||`IQC-${stableHash(value)}`;
  }

  function materialMatch(master,name){
    const target=compact(name);
    if(!target)return false;
    const masterName=compact(`${master?.code||""} ${master?.name||""}`);
    const nameKey=compact(master?.name);
    return masterName===target||masterName.includes(target)||(nameKey&&target.includes(nameKey));
  }

  function knownMaterial(name){
    const target=compact(name);
    return knownMaterials.find(row=>row.aliases.some(alias=>{
      const key=compact(alias);
      return target===key||target.includes(key)||key.includes(target);
    }))||null;
  }

  function generatedCode(name){
    const ascii=upper(name).replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,20);
    return `RM-${ascii||`MAT-${stableHash(name)}`}`;
  }

  function iqcStatus(row){
    const judge=upper(row?.judge||row?.status);
    if(["HOLD","홀드","격리"].some(value=>judge.includes(value)))return "HOLD";
    if(["불합격","부적합","FAIL","NG"].some(value=>judge.includes(value)))return "부적합";
    if(["합격","PASS","OK","적합"].some(value=>judge.includes(value)))return "합격";
    return "검사대기";
  }

  function rowSnapshot(rows){
    return JSON.stringify((rows||[]).map(row=>[
      row?.inNo,row?.recv,row?.inspectedAt,row?.lot,row?.name,row?.supplier,row?.qty,row?.judge,row?.remarks,row?.note
    ]));
  }

  function receiptComparable(payload){
    return JSON.stringify({
      kind:payload.kind,type:payload.type,code:payload.code,name:payload.name,supplier:payload.supplier,
      receivedAt:payload.receivedAt,qty:quantity(payload.qty),unit:payload.unit,supplierLot:payload.supplierLot,
      internalLot:payload.internalLot,expiryDate:payload.expiryDate,location:payload.location,
      iqcRequired:payload.iqcRequired,status:payload.status,iqcStatus:payload.iqcStatus,
      source:payload.source,autoFromIqc:payload.autoFromIqc,iqcInNo:payload.iqcInNo,
      inspectedAt:payload.inspectedAt,inspectedBy:payload.inspectedBy,note:payload.note,deleted:Boolean(payload.deleted)
    });
  }

  async function synchronize(force=false){
    if(syncing||typeof global.qmesSyncUpsert!=="function"||typeof global.qmesSyncList!=="function")return;
    const rows=Array.isArray(global.DB?.iqc)?global.DB.iqc.filter(row=>row&&!row.deleted):[];
    const snapshot=rowSnapshot(rows);
    if(!force&&snapshot===lastSnapshot)return;
    syncing=true;
    try{
      const records=await global.qmesSyncList("inventory");
      const currentByKey=new Map((records||[]).map(record=>[text(record.record_key),{record,payload:payloadOf(record)}]));
      const masters=(records||[]).map(payloadOf).filter(payload=>!payload.deleted&&payload.kind==="inventory-v2-master");
      const activeKeys=new Set();
      let changed=0;

      for(let index=0;index<rows.length;index+=1){
        const row=rows[index]||{};
        const inNo=text(row.inNo||row.serverId||`IQC-${row.recv||"DATE"}-${index+1}`);
        const lotNo=upper(row.lot||row.lotNo);
        const qty=quantity(row.qty);
        const name=clean(row.name||row.material||row.item);
        if(!inNo||!lotNo||!name||!(qty>0))continue;

        const known=knownMaterial(name);
        const sharedMaster=masters.find(master=>upper(master.type)==="RAW"&&materialMatch(master,name));
        const rowCode=row.code&&row.code!=="-"?row.code:"";
        const code=upper(sharedMaster?.code||known?.code||rowCode||generatedCode(name));
        const location=clean(row.location||sharedMaster?.location||known?.location||"미지정");
        const status=iqcStatus(row);
        const key=safeKey(inNo);
        activeKeys.add(key);
        const receipt={
          kind:"inventory-v2-receipt",id:inNo,type:"RAW",code,name,
          supplier:clean(row.supplier)||"-",receivedAt:text(row.recv||row.receivedAt||row.inspectedAt),
          qty,unit:"kg",supplierLot:text(row.supplierLot||row.lot),internalLot:lotNo,
          expiryDate:text(row.expiryDate),location,iqcRequired:true,status,iqcStatus:status,
          source:"IQC_AUTO",autoFromIqc:true,iqcInNo:inNo,inspectedAt:text(row.inspectedAt||row.recv),
          inspectedBy:clean(row.inspector||row.by),note:clean(row.remarks||row.note)
        };
        const existing=currentByKey.get(key)?.payload;
        if(!existing||receiptComparable(existing)!==receiptComparable(receipt)){
          await global.qmesSyncUpsert("inventory",key,{...receipt,savedAt:new Date().toISOString(),savedBy:receipt.inspectedBy||"IQC 자동연동"});
          changed+=1;
        }

        const isDefault=knownMaterials.some(item=>item.code===code);
        if(!isDefault&&!masters.some(master=>upper(master.code)===code)){
          const masterKey=`v2:master:${code}`;
          const masterPayload={kind:"inventory-v2-master",type:"RAW",code,name,unit:"kg",safety:0,location,iqcRequired:true,inspection:"수입검사(IQC) 자동 연동",note:"수입검사 등록 시 자동 생성된 원재료 마스터"};
          const existingMaster=currentByKey.get(masterKey)?.payload;
          if(!existingMaster||existingMaster.deleted){
            await global.qmesSyncUpsert("inventory",masterKey,{...masterPayload,savedAt:new Date().toISOString(),savedBy:receipt.inspectedBy||"IQC 자동연동"});
            masters.push(masterPayload);changed+=1;
          }
        }
      }

      if(previousLocalKeys){
        for(const removedKey of previousLocalKeys){
          if(activeKeys.has(removedKey))continue;
          const existing=currentByKey.get(removedKey)?.payload;
          if(!existing||existing.deleted||!existing.autoFromIqc)continue;
          await global.qmesSyncUpsert("inventory",removedKey,{...existing,deleted:true,deletedAt:new Date().toISOString(),deletedBy:"IQC 자동연동",deleteReason:"연결된 수입검사 기록 삭제 또는 입고번호 변경"});
          changed+=1;
        }
      }

      previousLocalKeys=activeKeys;
      lastSnapshot=snapshot;
      if(changed){
        global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"inventory-raw-iqc-auto",changed}}));
        console.info(`[QMES] IQC 원재료 입고 자동 동기화 ${changed}건`);
      }
    }catch(error){
      console.warn("[QMES] IQC 원재료 입고 자동 동기화 실패",error?.message||error);
    }finally{syncing=false;}
  }

  function receiptModal(){
    return Array.from(document.querySelectorAll(".qmes-inv2-modal")).find(modal=>clean(modal.querySelector("header h3")?.textContent)==="입고등록")||null;
  }

  function fieldByLabel(modal,label){
    return Array.from(modal?.querySelectorAll(".qmes-inv2-field")||[]).find(field=>clean(field.querySelector(":scope > span")?.textContent).startsWith(label))||null;
  }

  function setNativeValue(select,value){
    const setter=Object.getOwnPropertyDescriptor(global.HTMLSelectElement.prototype,"value")?.set;
    if(setter)setter.call(select,value);else select.value=value;
    select.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function goToIqc(){
    const close=receiptModal()?.querySelector("header button[aria-label='닫기']");
    if(close)close.click();
    try{sessionStorage.setItem("qmes_current_tab","iqc");}catch(_error){}
    const findButton=()=>Array.from(document.querySelectorAll("button")).find(button=>/수입검사/.test(clean(button.textContent)));
    const direct=findButton();
    if(direct){direct.click();return;}
    const quality=Array.from(document.querySelectorAll("button")).find(button=>clean(button.textContent).startsWith("품질검사"));
    if(quality){quality.click();setTimeout(()=>{const target=findButton();if(target)target.click();else global.location.reload();},120);return;}
    global.location.reload();
  }

  function decorateReceiptModal(){
    const modal=receiptModal();
    if(!modal)return;
    const description=modal.querySelector("header p");
    const descriptionText="부자재를 LOT 재고로 직접 등록합니다. 원재료 입고는 수입검사 등록 시 자동 생성됩니다.";
    if(description&&description.textContent!==descriptionText)description.textContent=descriptionText;

    const typeSelect=fieldByLabel(modal,"구분")?.querySelector("select");
    if(typeSelect){
      const rawOption=Array.from(typeSelect.options).find(option=>option.value==="RAW");
      if(rawOption){
        rawOption.disabled=true;
        if(rawOption.textContent!=="원재료 (수입검사 자동등록)")rawOption.textContent="원재료 (수입검사 자동등록)";
      }
      if(typeSelect.value!=="PACK")setNativeValue(typeSelect,"PACK");
      typeSelect.setAttribute("aria-description","원재료는 수입검사 등록 시 자동 생성되므로 부자재만 선택할 수 있습니다.");
    }

    const body=modal.querySelector(".qmes-inv2-modal-body");
    if(body&&!body.querySelector(".qmes-iqc-auto-receipt-notice")){
      const notice=document.createElement("div");
      notice.className="qmes-iqc-auto-receipt-notice";
      notice.innerHTML="<div><strong>원재료 입고 자동연동</strong><span>원재료(RAW)는 수입검사 등록 시 입고 LOT가 자동 생성되며, 합격 전에는 가용재고에서 제외됩니다.</span></div><button type='button'>수입검사 등록 화면</button>";
      notice.querySelector("button").addEventListener("click",goToIqc);
      body.insertBefore(notice,body.firstChild);
    }

    const materialAdd=document.getElementById("qmes-material-master-add-backdrop");
    if(materialAdd){
      const addType=materialAdd.querySelector("select[name='type']");
      const rawOption=Array.from(addType?.options||[]).find(option=>option.value==="RAW");
      if(rawOption)rawOption.disabled=true;
      if(addType&&addType.value!=="PACK")setNativeValue(addType,"PACK");
      const title=materialAdd.querySelector("header h3");if(title&&title.textContent!=="부자재 추가")title.textContent="부자재 추가";
      const detailText="수동 입고에 사용할 부자재를 공용 자재 마스터에 등록합니다.";
      const detail=materialAdd.querySelector("header p");if(detail&&detail.textContent!==detailText)detail.textContent=detailText;
    }
  }

  const style=document.createElement("style");
  style.id="qmes-iqc-auto-receipt-style";
  style.textContent=`
    .qmes-iqc-auto-receipt-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 16px;padding:12px 14px;border:1px solid rgba(56,189,248,.55);border-radius:9px;background:rgba(14,116,144,.14);color:#d9f4ff}
    .qmes-iqc-auto-receipt-notice>div{display:grid;gap:4px}.qmes-iqc-auto-receipt-notice strong{font-size:13px}.qmes-iqc-auto-receipt-notice span{color:#9fc9dc;font-size:12px;line-height:1.45}
    .qmes-iqc-auto-receipt-notice button{flex:0 0 auto;min-height:34px;padding:0 11px;border:1px solid #38bdf8;border-radius:7px;background:rgba(2,132,199,.18);color:#bfe9ff;font:800 12px Pretendard,sans-serif;cursor:pointer}.qmes-iqc-auto-receipt-notice button:hover{background:#0284c7;color:#fff}
    @media(max-width:680px){.qmes-iqc-auto-receipt-notice{align-items:flex-start;flex-direction:column}.qmes-iqc-auto-receipt-notice button{width:100%}}
  `;
  document.head.appendChild(style);

  document.addEventListener("submit",event=>{
    const modal=event.target?.closest?.(".qmes-inv2-modal");
    if(!modal||clean(modal.querySelector("header h3")?.textContent)!=="입고등록")return;
    const typeSelect=fieldByLabel(modal,"구분")?.querySelector("select");
    if(typeSelect?.value!=="RAW")return;
    event.preventDefault();event.stopImmediatePropagation();
    alert("원재료 입고는 수입검사 등록 시 자동 생성됩니다. 부자재만 직접 입고등록할 수 있습니다.");
  },true);

  new MutationObserver(decorateReceiptModal).observe(document.documentElement,{childList:true,subtree:true});
  global.addEventListener("qmes:data-updated",event=>{if(event?.detail?.source!=="inventory-raw-iqc-auto")synchronize(false);});
  global.addEventListener("focus",()=>synchronize(false));
  global.addEventListener("qmes:inventory-stage3-ready",()=>synchronize(true));
  global.qmesSyncRawIqcReceipts=()=>synchronize(true);
  setInterval(()=>synchronize(false),1200);
  decorateReceiptModal();
  setTimeout(()=>synchronize(true),300);
  console.info("[QMES] 원재료 IQC 자동입고 및 부자재 수동입고 제한 활성화");
})(window);
