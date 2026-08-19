/* QMES OQC iPad LOT auto-select fix - 2026-08-19
 * OQC candidates = existing finished lots + PQC completed/pass lots.
 * Also pulls shared PQC/OQC records so iPad sees inspections created on other PCs.
 */
(function installOqcIpadLotAutofill(global){
  "use strict";
  if(global.__QMES_OQC_IPAD_LOT_AUTOFILL_20260819__) return;
  global.__QMES_OQC_IPAD_LOT_AUTOFILL_20260819__=true;

  const text=(v)=>String(v??"").trim();
  const upper=(v)=>text(v).toUpperCase();
  const numberText=(v)=>{const m=text(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);return m?m[0]:"";};
  let pulling=false;
  let lastPull=0;

  function setValue(input,value,force){
    if(!input||value==null||text(value)==="") return false;
    if(!force&&text(input.value)) return false;
    const next=String(value);
    const proto=input.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
    try{setter?setter.call(input,next):(input.value=next);}catch(_){input.value=next;}
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
    return true;
  }

  function fieldByLabel(root,labelText){
    const labels=Array.from(root.querySelectorAll("label"));
    const label=labels.find(n=>text(n.querySelector("span")?.textContent).replace(/\*/g,"").trim()===labelText);
    return label?.querySelector("input,textarea,select")||null;
  }

  function mode(root){
    const title=text(root?.querySelector(".qmes-ipad-work-head")?.textContent);
    if(/OQC\s*출하검사/i.test(title)) return "OQC";
    if(/PQC\s*공정검사/i.test(title)) return "PQC";
    if(/IQC\s*수입검사/i.test(title)) return "IQC";
    return "";
  }

  async function pullSharedInspections(force=false){
    const now=Date.now();
    if(pulling||(!force&&now-lastPull<3000)) return;
    if(typeof global.qmesSyncPullInspection!=="function"||!global.DB) return;
    pulling=true;
    try{
      global.DB.insp=global.DB.insp||{PQC:[],OQC:[]};
      const [pqc,oqc]=await Promise.all([
        global.qmesSyncPullInspection("pqc",global.DB.insp.PQC||[]),
        global.qmesSyncPullInspection("oqc",global.DB.insp.OQC||[])
      ]);
      global.DB.insp.PQC=Array.isArray(pqc)?pqc:global.DB.insp.PQC||[];
      global.DB.insp.OQC=Array.isArray(oqc)?oqc:global.DB.insp.OQC||[];
      if(typeof global.dbSave==="function") global.dbSave();
      lastPull=Date.now();
      document.dispatchEvent(new CustomEvent("qmes:oqc-shared-pqc-ready"));
    }catch(error){
      console.warn("OQC 대상 LOT용 PQC 공용 DB 조회 실패:",error?.message||error);
    }finally{
      pulling=false;
    }
  }

  function latestOqcRow(lotNo){
    const rows=Array.isArray(global.DB?.insp?.OQC)?global.DB.insp.OQC:[];
    return rows.filter(r=>upper(r?.lot)===upper(lotNo))
      .sort((a,b)=>`${text(b?.date)} ${text(b?.time)} ${text(b?.shipDate)}`.localeCompare(`${text(a?.date)} ${text(a?.time)} ${text(a?.shipDate)}`))[0]||null;
  }

  function latestPqcGroup(lotNo){
    const rows=(Array.isArray(global.DB?.insp?.PQC)?global.DB.insp.PQC:[]).filter(r=>upper(r?.lot)===upper(lotNo));
    if(!rows.length) return [];
    const groupKeys=[...new Set(rows.map(r=>text(r?.groupId)||text(r?.id).replace(/-\d+$/,"" )).filter(Boolean))];
    if(!groupKeys.length) return rows;
    groupKeys.sort((a,b)=>{
      const ar=rows.find(r=>(text(r?.groupId)||text(r?.id).replace(/-\d+$/,""))===a)||{};
      const br=rows.find(r=>(text(r?.groupId)||text(r?.id).replace(/-\d+$/,""))===b)||{};
      return `${text(br.date)} ${text(br.time)} ${b}`.localeCompare(`${text(ar.date)} ${text(ar.time)} ${a}`);
    });
    const latest=groupKeys[0];
    return rows.filter(r=>(text(r?.groupId)||text(r?.id).replace(/-\d+$/,""))===latest);
  }

  function pqcPassed(lotNo){
    const rows=latestPqcGroup(lotNo);
    if(!rows.length) return false;
    const required=["외관","입도(Dmax)","점도","고형분"];
    return required.every(check=>rows.some(r=>text(r?.check)===check&&text(r?.judge)==="합격"));
  }

  function pqcProduct(lotNo){
    return text(latestPqcGroup(lotNo).find(r=>text(r?.product))?.product);
  }

  function lotData(lotNo){
    const key=text(lotNo);
    const lot=global.DB?.lots?.[key]||global.DB?.lots?.[upper(key)]||null;
    const batch=(global.DB?.batches||[]).find(r=>[r?.no,r?.lot,r?.lotNo,r?.workOrder].some(v=>upper(v)===upper(key)))||null;
    const oqc=latestOqcRow(key);
    const ship=lot?.ship||batch?.ship||{};
    return {
      product:text(oqc?.product||pqcProduct(key)||batch?.itemName||batch?.item||lot?.itemName||lot?.item||lot?.product),
      customer:text(ship?.customer||oqc?.customer),
      shipQty:numberText(ship?.shipQty??ship?.qty??oqc?.shipQty??lot?.qty??batch?.qty),
      shipDate:text(ship?.shipDate||ship?.date||oqc?.shipDate),
      destination:text(ship?.destination||oqc?.destination),
      remarks:text(oqc?.remarks)
    };
  }

  function candidates(){
    const map=new Map();
    const lots=global.DB?.lots&&typeof global.DB.lots==="object"?Object.entries(global.DB.lots):[];
    lots.forEach(([key,row])=>{
      const no=text(row?.lot||row?.lotNo||row?.no||key);
      if(!no) return;
      const qty=Number(numberText(row?.qty??row?.currentQty??row?.stock??row?.productionQty)||0);
      if(qty>0||row?.status==="완료"||row?.completed||/PQC\s*합격/.test(text(row?.status))){
        map.set(upper(no),{lot:no,product:text(row?.itemName||row?.item||row?.product),qty});
      }
    });
    (global.DB?.batches||[]).forEach(row=>{
      const no=text(row?.lot||row?.lotNo||row?.no||row?.workOrder);
      if(!no) return;
      const qty=Number(numberText(row?.qty??row?.actualQty??row?.productionQty)||0);
      if(qty>0||row?.status==="완료"||row?.completed){
        map.set(upper(no),{lot:no,product:text(row?.itemName||row?.item),qty});
      }
    });

    const pqcRows=Array.isArray(global.DB?.insp?.PQC)?global.DB.insp.PQC:[];
    [...new Set(pqcRows.map(r=>upper(r?.lot)).filter(Boolean))].forEach(no=>{
      if(!pqcPassed(no)) return;
      const existing=map.get(no)||{};
      map.set(no,{lot:existing.lot||no,product:existing.product||pqcProduct(no),qty:existing.qty||0});
    });

    return Array.from(map.values())
      .filter(c=>!latestOqcRow(c.lot)||text(latestOqcRow(c.lot)?.judge)!=="합격")
      .sort((a,b)=>b.lot.localeCompare(a.lot));
  }

  function apply(root,lotNo){
    if(!root||mode(root)!=="OQC"||!text(lotNo)) return;
    const d=lotData(lotNo);
    setValue(fieldByLabel(root,"제품명"),d.product,true);
    setValue(fieldByLabel(root,"고객사"),d.customer,false);
    setValue(fieldByLabel(root,"출하수량 (kg)"),d.shipQty,false);
    if(d.shipDate) setValue(fieldByLabel(root,"출하일자"),d.shipDate,true);
    setValue(fieldByLabel(root,"납품처"),d.destination,false);
    setValue(fieldByLabel(root,"비고"),d.remarks,false);
  }

  function cleanup(root){
    if(!root) return;
    root.querySelectorAll("#qmes-oqc-lot-select").forEach(node=>node.remove());
    root.querySelectorAll('input[data-qmes-oqc-original="1"]').forEach(input=>{
      input.style.display=input.dataset.qmesOqcDisplay||"";
      input.readOnly=false;
      if(input.dataset.qmesOqcPlaceholder!==undefined) input.placeholder=input.dataset.qmesOqcPlaceholder;
      delete input.dataset.qmesOqcOriginal;
      delete input.dataset.qmesOqcDisplay;
      delete input.dataset.qmesOqcPlaceholder;
    });
  }

  function installSelector(root){
    if(!root) return;
    if(mode(root)!=="OQC"){cleanup(root);return;}
    const input=fieldByLabel(root,"생산 LOT");
    if(!input||input.tagName!=="INPUT") return;

    const old=root.querySelector("#qmes-oqc-lot-select");
    const currentOptions=old?Array.from(old.options).slice(1).map(o=>upper(o.value)).join("|"):"";
    const nextCandidates=candidates();
    const nextOptions=nextCandidates.map(c=>upper(c.lot)).join("|");
    if(old&&currentOptions===nextOptions) return;
    if(old) old.remove();

    input.dataset.qmesOqcOriginal="1";
    input.dataset.qmesOqcDisplay=input.dataset.qmesOqcDisplay??input.style.display??"";
    input.dataset.qmesOqcPlaceholder=input.dataset.qmesOqcPlaceholder??input.placeholder??"";
    input.readOnly=true;
    input.style.display="none";

    const label=input.closest("label");
    if(!label) return;
    const select=document.createElement("select");
    select.id="qmes-oqc-lot-select";
    select.setAttribute("aria-label","출하검사 대상 LOT 선택");
    select.style.cssText="width:100%;min-height:48px;margin:0;padding:0 14px;border:2px solid #0ea5e9;border-radius:10px;background:#fff;color:#0f172a;font:inherit;font-weight:800;";
    select.innerHTML='<option value="">출하검사 대상 LOT를 선택하세요</option>';
    nextCandidates.forEach(c=>{
      const o=document.createElement("option");
      o.value=c.lot;
      o.textContent=c.lot;
      select.appendChild(o);
    });
    if(text(input.value)) select.value=input.value;
    label.insertBefore(select,input);
    select.addEventListener("change",()=>{
      if(!select.value) return;
      setValue(input,select.value,true);
      apply(root,select.value);
    });
  }

  function sync(){
    const root=document.querySelector(".qmes-ipad-pop");
    if(!root) return;
    if(mode(root)==="OQC") pullSharedInspections(false).then(()=>installSelector(root));
    installSelector(root);
  }

  const observer=new MutationObserver(()=>sync());
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener("click",()=>setTimeout(sync,0),true);
  document.addEventListener("qmes:data-updated",()=>{pullSharedInspections(true).then(()=>setTimeout(sync,0));});
  document.addEventListener("qmes:data-changed",()=>{pullSharedInspections(true).then(()=>setTimeout(sync,0));});
  document.addEventListener("qmes:oqc-shared-pqc-ready",()=>setTimeout(sync,0));
  global.addEventListener("storage",()=>setTimeout(sync,0));
  setTimeout(()=>{pullSharedInspections(true).then(sync);},250);
})(window);
