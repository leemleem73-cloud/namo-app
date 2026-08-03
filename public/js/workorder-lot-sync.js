/* QMES work-order LOT helpers */
(function(){
"use strict";
const PASS=new Set(["OK","PASS","합격","적합"]);
const BYK="BYK180 (분산제)",PRODUCT="NBA20-HM05",SITE="D";
const OLD=[" NBA20-HM01","NBA20-HM01","NMA20-HM01"];
const SUP=[
 {company:"코오롱",material:"PAI",lot:"PAI#27-2(2)",status:"거래중"},
 {company:"푸양광명화학",material:"NMP",lot:"20251031063",status:"거래중"},
 {company:"모리로쿠케미칼즈",material:"NMP",lot:"2026011101",status:"거래중"},
 {company:"강신산업",material:"Boehmite",lot:"006-8-25",status:"거래중"},
 {company:"LG화학",material:"SBR",lot:"C3026B26A(1)",status:"거래중"},
 {company:"SOLVAY",material:"PVDF",lot:"CSE23202TA",status:"거래중"},
 {company:"금호석유화학",material:"SBS",lot:"W251016",status:"거래중"},
 {company:"유니소재",material:BYK,lot:"2708935",status:"거래중"}
];
let applying=false,again=false,activeEdit="",pending=null;

function db(){try{return typeof DB!=="undefined"&&DB?DB:(window.DB||{});}catch(_){return window.DB||{};}}
function bom(){try{return typeof BOM!=="undefined"&&BOM?BOM:null;}catch(_){return null;}}
function clone(v){return v?{...v,tanks:[...(v.tanks||[])],items:(v.items||[]).map(x=>({...x}))}:null;}
function normMat(v){
 const s=String(v||"").toUpperCase().replace(/\s+/g,"");
 if(s.includes("BYK180")||s.includes("BYK-180")||s.includes("분산제"))return"BYK180";
 if(s.includes("AOH30")||s.includes("BOEHMITE"))return"BOEHMITE";
 for(const k of["PVDF","PAI","NMP","SBR","SBS"])if(s.includes(k))return k;
 return s;
}
function normLot(v){return String(v||"").trim().toUpperCase().replace(/\s+/g,"");}
function first(r,ks){for(const k of ks){const v=r&&r[k];if(v!==undefined&&v!==null&&String(v).trim()!=="")return v;}return"";}
function dateText(v){const m=String(v||"").match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";}
function field(root,label){return [...(root||document).querySelectorAll(".qmes-wo-form-field")].find(x=>String(x.querySelector("span")?.textContent||"").replace(/\s+/g," ").includes(label));}
function reactInput(el,v){
 if(!el||el.value===v)return false;
 const old=el.value,set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
 set.call(el,v);if(el._valueTracker)el._valueTracker.setValue(old);
 el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return true;
}
function reactSelect(el,v){
 if(!el||el.value===v)return false;
 const old=el.value,set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set;
 set.call(el,v);if(el._valueTracker)el._valueTracker.setValue(old);
 el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return true;
}

function ensureProduct(){
 const b=bom();if(!b)return;
 if(!b[PRODUCT]){
  const k=OLD.find(x=>b[x])||Object.keys(b).find(x=>b[x]?.workType==="완제품");
  if(k)b[PRODUCT]=clone(b[k]);
 }
 OLD.forEach(x=>{if(x!==PRODUCT&&b[x])delete b[x];});
}
function ensureProductName(name,source){
 const b=bom();if(!b||!name)return false;if(b[name])return true;
 const src=b[source]||b[PRODUCT]||Object.values(b).find(x=>x?.workType==="완제품")||Object.values(b)[0];
 if(!src)return false;b[name]=clone(src);return true;
}
function standardizeByk(){
 const d=db();let changed=false;
 if(Array.isArray(d.iqc))d.iqc=d.iqc.map(r=>normMat(r?.name)==="BYK180"&&r.name!==BYK?(changed=true,{...r,name:BYK}):r);
 if(Array.isArray(d.partnerSuppliers))d.partnerSuppliers=d.partnerSuppliers.map(r=>normMat(r?.material)==="BYK180"&&r.material!==BYK?(changed=true,{...r,material:BYK}):r);
 document.querySelectorAll("select option").forEach(o=>{if(normMat(o.textContent)==="BYK180")o.textContent=BYK;});
 if(changed&&typeof window.dbSave==="function")window.dbSave();
}
function iqcRows(){const d=db(),a=[d.iqc,d.insp?.IQC,d.iqcRecords,d.inspections?.IQC].find(Array.isArray);return a||[];}
function supplierRows(){
 const d=db(),raw=Object.values(d.rawMaterialLots||{}).map(r=>({company:r.supplier||r.company||"",material:r.material||r.name||"",lot:r.lot||r.lotNo||"",status:r.status||"거래중"}));
 const seen=new Set();
 return [...(d.partnerSuppliers||[]),...raw,...SUP].filter(r=>{
  const k=`${normMat(r.material)}|${normLot(r.lot)}`;if(!normLot(r.lot)||seen.has(k)||String(r.status||"거래중")==="거래중지")return false;seen.add(k);return true;
 });
}
function candidates(name,prodDate){
 const key=normMat(name),cut=dateText(prodDate),out=[];
 iqcRows().forEach(r=>{
  const mat=first(r,["name","material","materialName","rawMaterial","item","product"]);
  const lot=String(first(r,["lot","lotNo","lotNumber","materialLot"])).trim();
  const recv=dateText(first(r,["recv","receiveDate","receivedDate","inDate","date","inspectionDate"]));
  const judge=String(first(r,["judge","judgment","result","inspectionResult","status"])).trim().toUpperCase();
  if(!lot||normMat(mat)!==key||!PASS.has(judge)||(cut&&recv&&recv>cut))return;
  out.push({lot,date:recv||"0000-00-00",supplier:first(r,["supplier","company","vendor"]),source:"IQC"});
 });
 supplierRows().forEach(r=>{if(normMat(r.material)===key&&normLot(r.lot)&&!out.some(x=>x.lot===r.lot))out.push({lot:r.lot,date:"0000-00-00",supplier:r.company||"",source:"거래처 현황"});});
 out.sort((a,b)=>a.source!==b.source?(a.source==="IQC"?-1:1):b.date.localeCompare(a.date));
 return out.filter((x,i,a)=>a.findIndex(y=>y.lot===x.lot)===i);
}
function productionDate(shell){return [...shell.querySelectorAll('.qmes-wo-form-field input[type="date"]')].find(x=>x.value)?.value||"";}
function materialRows(shell){return [...shell.querySelectorAll("table.qmes-material-table tbody tr")];}
function prepareRow(row,date){
 const sel=row?.querySelector("td:nth-child(2) select"),input=row?.querySelector('td:nth-child(3) input[placeholder="원재료 LOT"]');
 if(!sel||!input)return null;
 const name=sel.value||sel.options[sel.selectedIndex]?.textContent||"",opts=candidates(name,date),id=`qmes-lot-${normMat(name)}-${row.rowIndex||0}`;
 let list=row.querySelector(`datalist[data-qmes-lot-list="${normMat(name)}"]`);
 if(!list){list=document.createElement("datalist");list.dataset.qmesLotList=normMat(name);input.after(list);}
 list.id=id;list.innerHTML=opts.map(x=>`<option value="${String(x.lot).replace(/"/g,"&quot;")}">${x.source}${x.date!=="0000-00-00"?` · ${x.date}`:""}${x.supplier?` · ${x.supplier}`:""}</option>`).join("");
 input.setAttribute("list",id);input.title=opts.length?`사용 가능 LOT ${opts.length}건 · IQC 우선 · 직접 입력 가능`:"사용 가능 LOT 없음 · 직접 입력 가능";
 return{input,opts};
}
async function applyLots(blankOnly=true){
 if(applying){again=true;return;}const shell=document.querySelector(".qmes-wo-issue-shell");if(!shell)return;
 const date=productionDate(shell);if(!date)return;applying=true;
 try{
  for(let i=0;i<materialRows(shell).length;i++){
   const s=document.querySelector(".qmes-wo-issue-shell");if(!s)break;
   const p=prepareRow(materialRows(s)[i],productionDate(s));if(!p||!p.opts.length||(blankOnly&&normLot(p.input.value)))continue;
   if(reactInput(p.input,p.opts[0].lot))await new Promise(r=>setTimeout(r,80));
  }
 }finally{applying=false;if(again){again=false;setTimeout(()=>applyLots(true),100);}}
}
function editableProduct(){
 ensureProduct();const f=field(document,"공정 / 품목"),sel=f?.querySelector("select");if(!sel||sel.dataset.qmesEditableProduct)return;
 sel.dataset.qmesEditableProduct="1";sel.style.display="none";
 const input=document.createElement("input");input.type="text";input.value=String(sel.value||PRODUCT).trim()||PRODUCT;input.placeholder="공정 / 품목 직접 입력";input.className=sel.className;f.append(input);
 const commit=()=>{const next=String(input.value||"").trim().toUpperCase().replace(/\s+/g,""),cur=String(sel.value||PRODUCT).trim();if(!next){input.value=cur;return;}if(!ensureProductName(next,cur))return;if(![...sel.options].some(o=>o.value===next))sel.add(new Option(next,next));reactSelect(sel,next);};
 input.addEventListener("change",commit);input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();commit();input.blur();}});
}
function defaultSite(){
 const shell=document.querySelector(".qmes-wo-issue-shell"),sel=field(shell,"생산 구분")?.querySelector("select");
 if(editShell(shell)||!sel||sel.dataset.qmesDefaultSiteApplied)return;sel.dataset.qmesDefaultSiteApplied="1";
 if(sel.value==="C"&&[...sel.options].some(o=>o.value===SITE))reactSelect(sel,SITE);
}
function styles(){
 if(document.getElementById("qmes-wo-helper-style"))return;
 const s=document.createElement("style");s.id="qmes-wo-helper-style";s.textContent=`
 #root .qmes-issued-table-wrap{width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch}
 #root .qmes-issued-table-v2{width:100%!important;min-width:1390px!important;table-layout:fixed!important;border-collapse:collapse!important}
 #root .qmes-issued-table-v2 th,#root .qmes-issued-table-v2 td{box-sizing:border-box!important;padding:8px 7px!important;vertical-align:middle!important}
 #root .qmes-issued-table-v2 th:nth-child(1),#root .qmes-issued-table-v2 td:nth-child(1){width:105px!important}
 #root .qmes-issued-table-v2 th:nth-child(2),#root .qmes-issued-table-v2 td:nth-child(2){width:145px!important}
 #root .qmes-issued-table-v2 th:nth-child(3),#root .qmes-issued-table-v2 td:nth-child(3){width:95px!important}
 #root .qmes-issued-table-v2 th:nth-child(4),#root .qmes-issued-table-v2 td:nth-child(4){width:100px!important}
 #root .qmes-issued-table-v2 th:nth-child(5),#root .qmes-issued-table-v2 td:nth-child(5){width:130px!important;white-space:normal!important;overflow:visible!important}
 #root .qmes-issued-table-v2 th:nth-child(6),#root .qmes-issued-table-v2 td:nth-child(6){width:170px!important;white-space:normal!important;overflow:visible!important}
 #root .qmes-issued-table-v2 th:nth-child(7),#root .qmes-issued-table-v2 td:nth-child(7){width:90px!important}
 #root .qmes-issued-table-v2 th:nth-child(8),#root .qmes-issued-table-v2 td:nth-child(8){width:105px!important}
 #root .qmes-issued-table-v2 th:nth-child(9),#root .qmes-issued-table-v2 td:nth-child(9){width:90px!important}
 #root .qmes-issued-table-v2 th:nth-child(10),#root .qmes-issued-table-v2 td:nth-child(10){width:110px!important}
 #root .qmes-issued-table-v2 th:nth-child(11),#root .qmes-issued-table-v2 td:nth-child(11){width:250px!important;white-space:nowrap!important}
 #root .qmes-issued-table-v2 .qmes-manage-btn{width:auto!important;min-width:48px!important;height:28px!important;margin:0 2px!important;padding:0 7px!important;font-size:10px!important}
 `;document.head.append(s);
}

function editShell(shell){return !!shell&&String(shell.textContent||"").includes("작업지시 수정");}
function lotInput(shell){return field(shell,"LOT No.")?.querySelector('input[placeholder="LOT No."]');}
function lotExists(next,old){
 const d=db(),n=normLot(next),o=normLot(old);
 return(d.batches||[]).some(r=>normLot(r?.no)===n&&normLot(r?.no)!==o)||[d.woDocs,d.lots,d.intermediateLots].some(x=>x&&Object.keys(x).some(k=>normLot(k)===n&&normLot(k)!==o));
}
function editableEditLot(){
 const shell=document.querySelector(".qmes-wo-issue-shell");if(!editShell(shell)){if(!shell&&!pending)activeEdit="";return;}
 const input=lotInput(shell);if(!input)return;const current=normLot(input.value),exists=(db().batches||[]).some(r=>normLot(r?.no)===current);
 if(!activeEdit||(!pending&&current!==activeEdit&&exists))activeEdit=current;
 input.dataset.qmesOriginalLot=activeEdit;input.readOnly=false;input.removeAttribute("readonly");
 input.classList.remove("bg-slate-800/60","text-slate-400","cursor-not-allowed");input.classList.add("text-slate-100");
 input.title="LOT No. 직접 수정 가능 · 저장 시 LOT 추적과 검사 연결도 함께 변경됩니다.";
}
function replaceList(a,o,n){return Array.isArray(a)?[...new Set(a.map(v=>normLot(v)===o?n:v))]:a;}
function updateRows(a,o,n,fs){(a||[]).forEach(r=>{if(!r)return;fs.forEach(f=>{if(normLot(r[f])===o)r[f]=n;});});}
function migrate(oldValue,newValue){
 const d=db(),o=normLot(oldValue),n=normLot(newValue);if(!o||!n||o===n)return false;if(lotExists(n,o))throw new Error(`이미 사용 중인 LOT No.입니다: ${n}`);
 d.batches=(d.batches||[]).map(r=>normLot(r?.no)===o?{...r,no:n}:r);
 if(d.woDocs?.[o]){d.woDocs[n]={...d.woDocs[o],lotNo:n,no:n,wo:n};delete d.woDocs[o];}
 if(d.lots?.[o]){d.lots[n]={...d.lots[o],lot:n,lotNo:n,wo:n};delete d.lots[o];}
 if(d.intermediateLots?.[o]){d.intermediateLots[n]={...d.intermediateLots[o],lot:n,workOrder:n};delete d.intermediateLots[o];}
 Object.values(d.woDocs||{}).forEach(x=>{if(!x)return;["lotNo","no","wo"].forEach(f=>{if(normLot(x[f])===o)x[f]=n;});(x.inputs||[]).forEach(r=>{if(normLot(r?.lot)===o)r.lot=n;if(normLot(r?.materialLot)===o)r.materialLot=n;});});
 Object.values(d.lots||{}).forEach(x=>{if(!x)return;if(normLot(x.wo)===o)x.wo=n;if(normLot(x.binderLot)===o)x.binderLot=n;(x.materials||[]).forEach(r=>{if(normLot(r?.lot)===o)r.lot=n;});if(x.ship)updateRows([x.ship],o,n,["lot","lotNo","finishedLot","workOrder"]);});
 Object.values(d.intermediateLots||{}).forEach(x=>{if(!x)return;if(normLot(x.lot)===o)x.lot=n;if(normLot(x.workOrder)===o)x.workOrder=n;x.parentLots=replaceList(x.parentLots,o,n);x.childLots=replaceList(x.childLots,o,n);});
 Object.values(d.intermediateContainers||{}).forEach(x=>updateRows([x],o,n,["lot","workOrder","lastWorkOrder"]));
 Object.values(d.materialRemainders||{}).forEach(x=>updateRows([x],o,n,["workOrder"]));
 updateRows(d.insp?.PQC,o,n,["lot","lotNo","workOrder"]);updateRows(d.insp?.OQC,o,n,["lot","lotNo","workOrder"]);
 [["popEntries",["lot","lotNo","workOrder"]],["shipments",["lot","lotNo","finishedLot","workOrder"]],["ncrs",["lot","lotNo","targetLot","workOrder"]],["nonconformities",["lot","lotNo","targetLot","workOrder"]],["audit",["lot","lotNo","target","ref","key"]],["auditLogs",["lot","lotNo","target","ref","key"]]].forEach(([k,f])=>updateRows(d[k],o,n,f));
 (d.holds||[]).forEach(r=>{updateRows([r],o,n,["lot","lotNo","targetLot","workOrder"]);if(typeof r.target==="string")r.target=r.target.split(o).join(n);});
 return true;
}
async function syncInspections(n){
 if(typeof window.qmesSyncUpsert!=="function")return;const d=db();
 for(const mode of["PQC","OQC"]){
  const groups=new Map();(d.insp?.[mode]||[]).filter(r=>normLot(r?.lot||r?.lotNo)===n).forEach(r=>{const k=String(r.groupId||r.id||"").trim();if(!k)return;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});
  for(const[k,rows]of groups)await window.qmesSyncUpsert(mode.toLowerCase(),k,{mode,lotNo:n,rows,lotRecord:d.lots?.[n]||null,holds:(d.holds||[]).filter(r=>String(r.target||"").includes(n)),savedAt:new Date().toISOString(),savedBy:String(window.__QMES_USER__?.name||window.__QMES_USER__||"")});
 }
}
function bridges(){
 if(typeof window.dbSave==="function"&&!window.dbSave.__lotRename){
  const original=window.dbSave,wrapped=function(...a){if(pending&&!pending.applied){migrate(pending.oldLot,pending.newLot);pending.applied=true;}return original.apply(this,a);};
  wrapped.__lotRename=true;window.dbSave=wrapped;try{dbSave=wrapped;}catch(_){}
 }
 if(typeof window.qmesSyncWorkOrder==="function"&&!window.qmesSyncWorkOrder.__lotRename){
  const original=window.qmesSyncWorkOrder,wrapped=async function(lot){
   const p=pending?.applied&&normLot(lot)===pending.oldLot?{...pending}:null;if(!p)return original.apply(this,arguments);
   try{
    const result=await original.call(this,p.newLot);await syncInspections(p.newLot);
    if(typeof window.qmesSyncUpsert==="function")await window.qmesSyncUpsert("workorder",p.oldLot,{lotNo:p.oldLot,deleted:true,renamedTo:p.newLot,deletedAt:new Date().toISOString(),deletedBy:String(window.__QMES_USER__?.name||window.__QMES_USER__||"")});
    return result;
   }finally{pending=null;activeEdit="";}
  };wrapped.__lotRename=true;window.qmesSyncWorkOrder=wrapped;try{qmesSyncWorkOrder=wrapped;}catch(_){}
 }
}

document.addEventListener("click",e=>{
 const b=e.target.closest?.("button"),shell=e.target.closest?.(".qmes-wo-issue-shell");if(!b||!editShell(shell))return;
 if(b.classList.contains("qmes-inspection-cancel-btn")){pending=null;activeEdit="";return;}
 if(!b.classList.contains("qmes-inspection-save-btn"))return;
 editableEditLot();const input=lotInput(shell),oldLot=normLot(input?.dataset.qmesOriginalLot||activeEdit),newLot=normLot(input?.value);
 if(!oldLot||!newLot||newLot!==oldLot&&lotExists(newLot,oldLot)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();alert(!newLot?"LOT No.를 확인하세요.":`이미 사용 중인 LOT No.입니다.\n${newLot}`);return;}
 pending=newLot===oldLot?null:{oldLot,newLot,applied:false};
},true);
document.addEventListener("change",e=>{
 const shell=e.target.closest?.(".qmes-wo-issue-shell");if(!shell)return;
 if(e.target.matches('input[type="date"]')||e.target.matches("table.qmes-material-table tbody td:nth-child(2) select"))setTimeout(()=>applyLots(false),60);
});
document.addEventListener("focusin",e=>{if(e.target.matches?.('input[placeholder="LOT No."]'))editableEditLot();},true);

function install(){ensureProduct();standardizeByk();editableProduct();defaultSite();styles();bridges();editableEditLot();}
install();
new MutationObserver(()=>{install();setTimeout(()=>applyLots(true),100);}).observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{install();applyLots(true);},1500);
})();
