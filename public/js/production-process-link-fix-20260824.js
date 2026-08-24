/* QMES production-process linkage fix, 2026-08-24
 * - Read real work-order details from qmes-sync payload.doc / payload.batch.
 * - Hide deleted work orders from the production-process LOT selector.
 * - Align executable production steps with MES process numbers 30~80.
 * - Migrate previously saved 1~7 process steps without deleting progress.
 * - Add Production Process Management to the unified Production top menu.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_PROCESS_LINK_FIX_20260824__) return;
  window.__QMES_PRODUCTION_PROCESS_LINK_FIX_20260824__=true;

  const clean=value=>String(value==null?"":value).trim();
  const keyPrefix="process:";
  const workerPrefix="worker:";

  function mesSteps(workOrder){
    const equipment=clean(workOrder?.tank||workOrder?.equipment||workOrder?.equipmentName||workOrder?.machine||workOrder?.eq)||"생산설비";
    return [
      {no:30,name:"원재료 준비 / 계량 · 투입",equipment:"원재료 창고 · 드라이룸",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:40,name:"바인더 제조",equipment:"TK 501",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:50,name:"절연 슬러리 제조",equipment:equipment&&equipment!=="생산설비"?equipment:"TK 501A ↔ B",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:60,name:"검사 (PQC / OQC)",equipment:"검사실",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:70,name:"충진",equipment:"충진기",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]},
      {no:80,name:"완제품 보관",equipment:"제품보관",status:"대기",startAt:"",endAt:"",resultQty:"",defectQty:"0",workers:[]}
    ];
  }

  function statusRank(status){
    if(status==="완료") return 2;
    if(status==="진행중") return 1;
    return 0;
  }
  function mergeThirty(first,second,base){
    if(!first&&!second) return base;
    const firstRank=statusRank(first?.status),secondRank=statusRank(second?.status);
    let status="대기";
    if(firstRank===2&&secondRank===2) status="완료";
    else if(firstRank>0||secondRank>0) status="진행중";
    return {
      ...base,
      status,
      startAt:first?.startAt||second?.startAt||"",
      endAt:status==="완료"?(second?.endAt||first?.endAt||""):"",
      resultQty:second?.resultQty||first?.resultQty||"",
      defectQty:String((Number(first?.defectQty)||0)+(Number(second?.defectQty)||0)),
      workers:Array.from(new Set([...(first?.workers||[]),...(second?.workers||[])]))
    };
  }
  function migrateSteps(steps,workOrder){
    const defaults=mesSteps(workOrder);
    if(!Array.isArray(steps)||!steps.length) return defaults;
    const hasMesNo=steps.some(step=>[30,40,50,60,70,80].includes(Number(step?.no)));
    if(hasMesNo){
      const byNo=new Map(steps.map(step=>[Number(step?.no),step]));
      return defaults.map(base=>({...base,...(byNo.get(base.no)||{}),no:base.no,name:base.name,equipment:(byNo.get(base.no)?.equipment||base.equipment)}));
    }
    const byOldNo=new Map(steps.map(step=>[Number(step?.no),step]));
    return [
      mergeThirty(byOldNo.get(1),byOldNo.get(2),defaults[0]),
      {...defaults[1],...(byOldNo.get(3)||{}),no:40,name:defaults[1].name,equipment:byOldNo.get(3)?.equipment||defaults[1].equipment},
      {...defaults[2],...(byOldNo.get(4)||{}),no:50,name:defaults[2].name,equipment:byOldNo.get(4)?.equipment||defaults[2].equipment},
      {...defaults[3],...(byOldNo.get(5)||{}),no:60,name:defaults[3].name,equipment:byOldNo.get(5)?.equipment||defaults[3].equipment},
      {...defaults[4],...(byOldNo.get(6)||{}),no:70,name:defaults[4].name,equipment:byOldNo.get(6)?.equipment||defaults[4].equipment},
      {...defaults[5],...(byOldNo.get(7)||{}),no:80,name:defaults[5].name,equipment:byOldNo.get(7)?.equipment||defaults[5].equipment}
    ];
  }

  // Existing component calls this global function whenever a new LOT is opened.
  try{window.qmesProcessDefaultSteps=mesSteps;}catch(_error){}
  try{if(typeof qmesProcessDefaultSteps!=="undefined")qmesProcessDefaultSteps=mesSteps;}catch(_error){}

  // Replace only the Production Process screen's work-order reader. Other QMES sync consumers
  // still receive tombstones, so delete synchronization remains untouched.
  const fixedFetchRows=async function(){
    const response=await fetch("/api/qmes-sync/workorder",{credentials:"same-origin"});
    const payload=await response.json().catch(()=>({success:false,data:[]}));
    if(!response.ok||!payload.success)throw new Error(payload.message||"생산공정 공용 DB 조회에 실패했습니다.");
    const rows=Array.isArray(payload.data)?payload.data:[];
    return rows.reduce((result,row)=>{
      const key=clean(row?.record_key);
      const source=row?.payload&&typeof row.payload==="object"?row.payload:{};
      if(key.startsWith(workerPrefix)){
        result.push(row);
        return result;
      }
      if(key.startsWith(keyPrefix)){
        const lot=clean(source.lot||key.slice(keyPrefix.length));
        const localDoc=(window.DB?.woDocs&&lot)?window.DB.woDocs[lot]:null;
        const nextPayload={...source,lot,steps:migrateSteps(source.steps,localDoc||source)};
        result.push({...row,payload:nextPayload});
        return result;
      }
      // A real synced work order is a snapshot {lotNo, doc, batch, ...}.
      if(source.deleted||!source.doc) return result;
      const doc=source.doc||{};
      const batch=source.batch||{};
      const lot=clean(source.lotNo||key);
      const flat={
        ...source,
        ...batch,
        ...doc,
        lotNo:lot,
        lot,
        item:clean(doc.item||doc.product||batch.item||source.item),
        product:clean(doc.product||doc.item||batch.item||source.product),
        tank:clean(doc.tank||batch.tank||source.tank),
        equipment:clean(doc.equipment||doc.equipmentName||doc.tank||batch.tank||source.equipment),
        plan:doc.plan??doc.planQty??batch.plan??source.plan??0,
        planQty:doc.planQty??doc.plan??batch.plan??source.planQty??0,
        date:clean(doc.date||doc.prodDate||batch.due||batch.date||source.date),
        productionDate:clean(doc.productionDate||doc.date||batch.due||source.productionDate),
        deleted:false
      };
      result.push({...row,payload:flat});
      return result;
    },[]);
  };
  try{window.qmesProcessFetchSyncRows=fixedFetchRows;}catch(_error){}
  try{if(typeof qmesProcessFetchSyncRows!=="undefined")qmesProcessFetchSyncRows=fixedFetchRows;}catch(_error){}

  // Keep local MES/dashboard data aware of the latest shared production-process state.
  async function primeProcessState(){
    try{
      const rows=await fixedFetchRows();
      if(!window.DB) return;
      DB.productionProcesses=DB.productionProcesses||{};
      rows.forEach(row=>{
        const key=clean(row?.record_key);
        if(!key.startsWith(keyPrefix)) return;
        const lot=clean(row?.payload?.lot||key.slice(keyPrefix.length));
        if(lot) DB.productionProcesses[lot]=row.payload;
      });
      if(typeof window.dbSave==="function")window.dbSave();
      else if(typeof dbSave==="function")dbSave();
      window.dispatchEvent(new CustomEvent("qmes:production-process-updated",{detail:{source:"shared-sync"}}));
    }catch(error){console.warn("[QMES 생산공정] MES 상태 사전 동기화 실패",error?.message||error);}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",primeProcessState,{once:true});else primeProcessState();

  // Unified hover dropdown is built by a separate legacy script. Add the missing row every time it renders.
  const topText=element=>clean(element?.textContent).replace(/[›〉▣]/g,"").trim();
  function navigateProductionProcess(){
    const top=Array.from(document.querySelectorAll(".qmes-top-menu-button")).find(button=>topText(button)==="생산관리");
    if(!top) return;
    top.click();
    const select=()=>{
      const sub=Array.from(document.querySelectorAll(".qmes-submenu-button")).find(button=>topText(button)==="생산공정 관리");
      if(sub){sub.click();document.getElementById("qmes-all-menu-dropdown")?.classList.remove("is-open");return true;}
      return false;
    };
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!select())setTimeout(select,60);}));
  }
  function ensureTopMenuRow(){
    const menu=document.getElementById("qmes-all-menu-dropdown");
    if(!menu||!menu.classList.contains("is-open")) return;
    const title=menu.querySelector(".qmes-hover-title");
    if(topText(title)!=="생산관리") return;
    if(Array.from(menu.querySelectorAll("button")).some(button=>topText(button)==="생산공정 관리")) return;
    const button=document.createElement("button");
    button.type="button";
    button.textContent="생산공정 관리";
    button.dataset.qmesProductionProcess="true";
    button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();navigateProductionProcess();});
    menu.appendChild(button);
  }
  const observer=new MutationObserver(()=>ensureTopMenuRow());
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
  document.addEventListener("pointerover",event=>{if(event.target.closest?.(".qmes-top-menu-button"))setTimeout(ensureTopMenuRow,0);},true);
  document.addEventListener("click",event=>{if(event.target.closest?.(".qmes-top-menu-button"))setTimeout(ensureTopMenuRow,0);},true);
})();
