/* NAMO QMES - production process screen stability patch - 2026-08-27
 * ADD-ONLY patch.
 * Fixes the race where production-process data briefly appears and then disappears
 * after the linkage helper/initial-sync refresh replaces the work-order list.
 */
(function(){
  "use strict";
  if(window.__QMES_PROCESS_SCREEN_STABILITY_20260827_V1__) return;
  window.__QMES_PROCESS_SCREEN_STABILITY_20260827_V1__=true;

  /* Disable the older auto-refresh owner. This patch performs one stable refresh itself. */
  window.__QMES_PRODUCTION_PROCESS_INITIAL_SYNC_20260824_V2__=true;

  const clean=v=>String(v==null?"":v).trim();
  const PROCESS_PREFIX="process:";
  const WORKER_PREFIX="worker:";
  const MES_NOS=[30,40,50,60,70,80];
  const nativeFetch=window.fetch.bind(window);

  function payloadOf(record){
    const value=record?.payload;
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){try{return JSON.parse(value);}catch(_){return {};}}
    return {};
  }

  function defaults(workOrder){
    const equipment=clean(workOrder?.tank||workOrder?.equipment||workOrder?.equipmentName||workOrder?.machine||workOrder?.eq)||"생산설비";
    return [
      {no:30,name:"원재료 준비 / 계량 · 투입",equipment:"원재료 창고 · 드라이룸",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:40,name:"바인더 제조",equipment:"TK 501",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:50,name:"절연 슬러리 제조",equipment:equipment!=="생산설비"?equipment:"TK 501A ↔ B",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:60,name:"검사 (PQC / OQC)",equipment:"검사실",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:70,name:"충진",equipment:"충진기",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:80,name:"완제품 보관",equipment:"제품보관",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]}
    ];
  }

  function rank(status){return status==="완료"?2:status==="진행중"?1:0;}
  function merge30(first,second,base){
    if(!first&&!second) return base;
    const a=rank(first?.status),b=rank(second?.status);
    const status=a===2&&b===2?"완료":(a>0||b>0?"진행중":"대기");
    return {...base,status,startAt:first?.startAt||second?.startAt||"",endAt:status==="완료"?(second?.endAt||first?.endAt||""):"",resultQty:second?.resultQty||first?.resultQty||"",defectQty:String((Number(first?.defectQty)||0)+(Number(second?.defectQty)||0)),workers:Array.from(new Set([...(first?.workers||[]),...(second?.workers||[])])),remark:clean(second?.remark||first?.remark)};
  }
  function normalizeSteps(steps,workOrder){
    const base=defaults(workOrder);
    if(!Array.isArray(steps)||!steps.length) return base;
    if(steps.some(step=>MES_NOS.includes(Number(step?.no)))){
      const byNo=new Map(steps.map(step=>[Number(step?.no),step]));
      return base.map(row=>({...row,...(byNo.get(row.no)||{}),no:row.no,name:row.name,equipment:byNo.get(row.no)?.equipment||row.equipment}));
    }
    const old=new Map(steps.map(step=>[Number(step?.no),step]));
    return [
      merge30(old.get(1),old.get(2),base[0]),
      {...base[1],...(old.get(3)||{}),no:40,name:base[1].name,equipment:old.get(3)?.equipment||base[1].equipment},
      {...base[2],...(old.get(4)||{}),no:50,name:base[2].name,equipment:old.get(4)?.equipment||base[2].equipment},
      {...base[3],...(old.get(5)||{}),no:60,name:base[3].name,equipment:old.get(5)?.equipment||base[3].equipment},
      {...base[4],...(old.get(6)||{}),no:70,name:base[4].name,equipment:old.get(6)?.equipment||base[4].equipment},
      {...base[5],...(old.get(7)||{}),no:80,name:base[5].name,equipment:old.get(7)?.equipment||base[5].equipment}
    ];
  }

  function flattenWorkOrder(source,key){
    const doc=source?.doc&&typeof source.doc==="object"?source.doc:null;
    const batch=source?.batch&&typeof source.batch==="object"?source.batch:{};
    const flat=doc?{...source,...batch,...doc}:source;
    const lot=clean(source?.lotNo||flat?.lotNo||flat?.lot||flat?.productionLot||key);
    if(!lot) return null;
    return {
      ...flat,
      lotNo:lot,
      lot,
      item:clean(flat?.item||flat?.product||batch?.item||source?.item),
      product:clean(flat?.product||flat?.item||batch?.item||source?.product),
      tank:clean(flat?.tank||batch?.tank||source?.tank),
      equipment:clean(flat?.equipment||flat?.equipmentName||flat?.tank||batch?.tank||source?.equipment),
      plan:flat?.plan??flat?.planQty??batch?.plan??source?.plan??0,
      planQty:flat?.planQty??flat?.plan??batch?.plan??source?.planQty??0,
      date:clean(flat?.date||flat?.prodDate||batch?.due||batch?.date||source?.date),
      productionDate:clean(flat?.productionDate||flat?.date||batch?.due||source?.productionDate),
      deleted:false
    };
  }

  async function stableFetchRows(){
    const response=await nativeFetch("/api/qmes-sync/workorder",{credentials:"same-origin"});
    const data=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||data.success===false) throw new Error(data.message||"생산공정 공용 DB 조회에 실패했습니다.");
    const rows=Array.isArray(data.data)?data.data:[];
    const out=[];
    const processRows=[];
    const workLots=new Set();
    const deletedLots=new Set();

    rows.forEach(record=>{
      const key=clean(record?.record_key),source=payloadOf(record);
      if(key.startsWith(WORKER_PREFIX)){out.push({...record,payload:source});return;}
      if(key.startsWith(PROCESS_PREFIX)){
        const lot=clean(source?.lot||key.slice(PROCESS_PREFIX.length));
        const localDoc=window.DB?.woDocs?.[lot]||source;
        const normalized={...source,lot,steps:normalizeSteps(source?.steps,localDoc)};
        const next={...record,payload:normalized};
        out.push(next);processRows.push(next);return;
      }
      const lot=clean(source?.lotNo||source?.lot||source?.productionLot||key);
      if(source?.deleted){if(lot)deletedLots.add(lot);return;}
      const flat=flattenWorkOrder(source,key);
      if(!flat) return;
      workLots.add(flat.lot);
      out.push({...record,payload:flat});
    });

    /* Keep an already-started process visible even when the work-order snapshot is temporarily absent. */
    processRows.forEach(record=>{
      const process=record.payload||{};
      const lot=clean(process.lot);
      if(!lot||workLots.has(lot)||deletedLots.has(lot)) return;
      const local=window.DB?.woDocs?.[lot]||{};
      const fallback={
        ...local,
        lotNo:lot,lot,
        item:clean(local?.item||local?.product||process?.item||process?.product),
        product:clean(local?.product||local?.item||process?.product||process?.item),
        equipment:clean(local?.equipment||local?.equipmentName||local?.tank||process?.equipment),
        tank:clean(local?.tank||process?.equipment),
        planQty:Number(local?.planQty??local?.plan??process?.planQty??process?.plan??0)||0,
        plan:Number(local?.plan??local?.planQty??process?.plan??process?.planQty??0)||0,
        date:clean(local?.date||process?.productionDate||process?.date),
        productionDate:clean(process?.productionDate||local?.date||process?.date),
        status:clean(local?.status||process?.status||"진행중"),
        __processFallback:true
      };
      out.push({record_key:`process-fallback:${lot}`,payload:fallback,updated_at:record.updated_at||""});
      workLots.add(lot);
    });
    return out;
  }

  function installFetcher(){
    try{window.qmesProcessFetchSyncRows=stableFetchRows;}catch(_){ }
    try{if(typeof qmesProcessFetchSyncRows!=="undefined")qmesProcessFetchSyncRows=stableFetchRows;}catch(_){ }
  }
  installFetcher();

  function refreshButton(root){return Array.from(root?.querySelectorAll(".qpp-toolbar button")||[]).find(button=>clean(button.textContent)==="새로고침")||null;}
  function lotSelect(root){return root?.querySelector(".qpp-toolbar .qpp-select")||null;}
  const refreshed=new WeakSet();
  function stabilize(root){
    if(!root||refreshed.has(root)) return;
    refreshed.add(root);
    root.setAttribute("data-qmes-process-stabilizing","1");
    installFetcher();
    const run=()=>{
      if(!document.documentElement.contains(root)) return;
      const button=refreshButton(root);
      if(!button||button.disabled){setTimeout(run,40);return;}
      button.click();
      let count=0;
      const settle=()=>{
        if(!document.documentElement.contains(root)) return;
        const current=refreshButton(root);
        if(current?.disabled&&count++<150){setTimeout(settle,40);return;}
        const select=lotSelect(root);
        if(select&&select.options.length>1){
          root.removeAttribute("data-qmes-process-stabilizing");
          return;
        }
        if(count++<40){setTimeout(settle,50);return;}
        root.removeAttribute("data-qmes-process-stabilizing");
      };
      setTimeout(settle,20);
    };
    setTimeout(run,20);
  }

  function style(){
    if(document.getElementById("qmes-process-screen-stability-style-20260827-v1")) return;
    const el=document.createElement("style");
    el.id="qmes-process-screen-stability-style-20260827-v1";
    el.textContent='.qmes-prod-process[data-qmes-process-stabilizing="1"] .qpp-message.err{display:none!important;}';
    document.head.appendChild(el);
  }
  function scan(){style();installFetcher();document.querySelectorAll(".qmes-prod-process").forEach(stabilize);}
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan();});}

  const start=()=>{
    scan();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener("qmes:production-process-ready",schedule);
    window.addEventListener("qmes:mes-master-ready",()=>{installFetcher();schedule();});
    window.addEventListener("focus",installFetcher);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
