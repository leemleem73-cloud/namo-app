/* QMES 2026-08-13: Work-order raw-material LOT must come from passed IQC rows matching the material name. */
(function(){
  "use strict";
  const PASS=new Set(["OK","PASS","합격","적합"]);
  let busy=false,timer=null;

  function db(){try{return (typeof DB!=="undefined"&&DB)||window.DB||{};}catch(_){return window.DB||{};}}
  function normMaterial(v){
    const s=String(v||"").toUpperCase().replace(/\s+/g,"");
    if(s.includes("BYK180")||s.includes("BYK-180")||s.includes("분산제"))return "BYK180";
    if(s.includes("AOH30")||s.includes("BOEHMITE"))return "BOEHMITE";
    for(const k of ["PVDF","PAI","NMP","SBR","SBS"])if(s.includes(k))return k;
    return s;
  }
  function normLot(v){return String(v||"").trim().toUpperCase().replace(/\s+/g,"");}
  function first(row,keys){for(const k of keys){const v=row&&row[k];if(v!==undefined&&v!==null&&String(v).trim()!=="")return v;}return "";}
  function date(v){const m=String(v||"").match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";}
  function iqcRows(){const d=db();return [d.iqc,d.insp&&d.insp.IQC,d.iqcRecords,d.inspections&&d.inspections.IQC].find(Array.isArray)||[];}
  function candidates(material,prodDate){
    const key=normMaterial(material),cut=date(prodDate),out=[];
    iqcRows().forEach(r=>{
      const mat=first(r,["name","material","materialName","rawMaterial","item","product"]);
      const lot=String(first(r,["lot","lotNo","lotNumber","materialLot"])).trim();
      const judged=String(first(r,["judge","judgment","result","inspectionResult","status"])).trim().toUpperCase();
      const received=date(first(r,["recv","receiveDate","receivedDate","inDate","date","inspectionDate"]));
      if(!lot||normMaterial(mat)!==key||!PASS.has(judged))return;
      if(cut&&received&&received>cut)return;
      out.push({lot,date:received||"0000-00-00"});
    });
    out.sort((a,b)=>b.date.localeCompare(a.date));
    return out.filter((x,i,a)=>a.findIndex(y=>normLot(y.lot)===normLot(x.lot))===i);
  }
  function setInput(input,value){
    if(!input||input.value===value)return;
    const old=input.value,setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
    if(!setter)return;
    setter.call(input,value);
    if(input._valueTracker)input._valueTracker.setValue(old);
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }
  function productionDate(shell){return Array.from(shell.querySelectorAll('.qmes-wo-form-field input[type="date"]')).find(x=>x.value)?.value||"";}
  function apply(){
    if(busy)return;busy=true;
    try{
      const shell=document.querySelector(".qmes-wo-issue-shell");if(!shell)return;
      const prod=productionDate(shell);
      shell.querySelectorAll("table.qmes-material-table tbody tr").forEach((row,index)=>{
        const sel=row.querySelector("td:nth-child(2) select");
        const input=row.querySelector('td:nth-child(3) input[placeholder="원재료 LOT"]');
        if(!sel||!input)return;
        const material=sel.value||sel.options[sel.selectedIndex]?.textContent||"";
        const list=candidates(material,prod);
        const allowed=new Set(list.map(x=>normLot(x.lot)));
        const current=normLot(input.value);
        if(current&&!allowed.has(current))setInput(input,"");
        if(!normLot(input.value)&&list.length)setInput(input,list[0].lot);
        let dl=row.querySelector("datalist[data-qmes-lot-list]");
        if(!dl){dl=document.createElement("datalist");input.insertAdjacentElement("afterend",dl);}
        dl.dataset.qmesLotList=normMaterial(material);
        dl.id=`qmes-iqc-lot-${normMaterial(material)}-${index}`;
        dl.innerHTML=list.map(x=>`<option value="${String(x.lot).replace(/"/g,"&quot;")}">IQC 합격${x.date!=="0000-00-00"?` · ${x.date}`:""}</option>`).join("");
        input.setAttribute("list",dl.id);
        input.title=list.length?`IQC 합격 · 원료명 일치 LOT ${list.length}건`:"IQC 합격 및 원료명 일치 LOT 없음";
        input.dataset.qmesIqcStrict="1";
      });
    }finally{busy=false;}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(apply,140);}
  document.addEventListener("change",e=>{if(e.target.closest?.(".qmes-wo-issue-shell"))schedule();},true);
  document.addEventListener("focusin",e=>{if(e.target.matches?.('input[placeholder="원재료 LOT"]'))schedule();},true);
  new MutationObserver(m=>{if(m.some(x=>Array.from(x.addedNodes||[]).some(n=>n.nodeType===1&&(n.matches?.(".qmes-wo-issue-shell")||n.querySelector?.(".qmes-wo-issue-shell")||n.closest?.(".qmes-wo-issue-shell")))))schedule();}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(apply,500);
})();
