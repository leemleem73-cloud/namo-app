/* Inventory sidebar + dedicated pages — 2026-08-13 */
(function(){
  "use strict";
  if(window.__QMES_INVENTORY_DEDICATED_PAGES__)return;
  window.__QMES_INVENTORY_DEDICATED_PAGES__=true;

  const ReactRef=window.React;
  if(!ReactRef)return;
  const h=ReactRef.createElement;
  const items=[
    {label:"원재료·부자재 재고",view:"raw"},
    {label:"완제품 재고 현황",view:"fg"},
    {label:"완제품 출고관리",view:"ship"},
    {label:"완제품 출고내역",view:"history"}
  ];
  let active="raw";
  const clean=v=>String(v||"").replace(/[›〉]/g,"").replace(/\s+/g," ").trim();
  const fmt=v=>{const n=Number(String(v??0).replace(/,/g,""));return Number.isFinite(n)?n.toLocaleString("ko-KR",{maximumFractionDigits:3}):"0";};
  const num=v=>{const n=Number(String(v??"").replace(/,/g,"").replace(/\s*kg$/i,"").trim());return Number.isFinite(n)?n:0;};
  const today=()=>new Date().toISOString().slice(0,10);
  const currentUser=()=>{const u=window.__QMES_CURRENT_USER__||window.__QMES_USER__;return String(u?.name||u||"").trim();};
  const cardStyle={background:"#fff",border:"1px solid #dbe3ec",borderRadius:"10px",padding:"16px 18px",boxShadow:"0 1px 2px rgba(15,23,42,.04)"};
  const titleStyle={fontSize:"20px",fontWeight:800,color:"#0f172a",margin:"0 0 4px"};
  const subStyle={fontSize:"13px",color:"#64748b",margin:0};
  const thStyle={padding:"11px 12px",fontSize:"12px",fontWeight:800,color:"#475569",background:"#f8fafc",borderBottom:"1px solid #dbe3ec",whiteSpace:"nowrap",textAlign:"center"};
  const tdStyle={padding:"12px",fontSize:"13px",color:"#334155",borderBottom:"1px solid #eef2f7",textAlign:"center",verticalAlign:"middle"};
  const inputStyle={width:"100%",height:"38px",border:"1px solid #cbd5e1",borderRadius:"7px",background:"#fff",color:"#0f172a",padding:"0 10px",fontSize:"13px",outline:"none",boxSizing:"border-box"};

  function PageHeader({title,desc}){
    return h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:"16px",marginBottom:"14px"}},
      h("div",null,h("h2",{style:titleStyle},title),h("p",{style:subStyle},desc))
    );
  }
  function Stat({label,value,accent}){
    return h("div",{style:{...cardStyle,padding:"14px 16px"}},h("div",{style:{fontSize:"12px",fontWeight:700,color:"#64748b",marginBottom:"6px"}},label),h("div",{style:{fontSize:"22px",fontWeight:900,color:accent||"#0f172a"}},value));
  }
  function TableShell({children}){
    return h("div",{style:{...cardStyle,padding:0,overflow:"hidden"}},h("div",{style:{overflowX:"auto"}},children));
  }
  function Empty({colSpan,text}){return h("tr",null,h("td",{colSpan,style:{...tdStyle,padding:"34px 12px",color:"#94a3b8"}},text));}

  function DedicatedInventoryPages(){
    const [view,setView]=ReactRef.useState(active||"raw");
    const [version,setVersion]=ReactRef.useState(0);
    const [shipments,setShipments]=ReactRef.useState([]);
    const [form,setForm]=ReactRef.useState({shipDate:today(),lotNo:"",customer:"",qty:""});
    const [saving,setSaving]=ReactRef.useState(false);

    const rawRows=typeof window.qmesBuildInventoryRows==="function"?window.qmesBuildInventoryRows():[];
    const fgRows=typeof window.qmesBuildFinishedGoodsRows==="function"?window.qmesBuildFinishedGoodsRows():[];

    const loadShipments=ReactRef.useCallback(async()=>{
      if(typeof window.qmesSyncList!=="function"){setShipments([]);return;}
      try{
        const records=await window.qmesSyncList("inventory");
        const rows=(records||[]).filter(r=>String(r.record_key||"").startsWith("shipment:")).map(r=>{
          let payload=r?.payload;
          if(!payload||typeof payload!=="object"){try{payload=JSON.parse(payload||"{}");}catch(_e){payload={};}}
          return {key:r.record_key,...payload};
        }).filter(r=>!r.deleted).sort((a,b)=>String(b.shipDate||"").localeCompare(String(a.shipDate||""))||String(b.shipNo||"").localeCompare(String(a.shipNo||"")));
        setShipments(rows);
      }catch(e){console.warn("[QMES] shipment load failed",e);}
    },[]);

    ReactRef.useEffect(()=>{
      const onView=e=>{const next=String(e?.detail?.view||e?.detail||"");if(items.some(x=>x.view===next)){active=next;setView(next);try{sessionStorage.setItem("qmes_inventory_view",next);}catch(_e){}}};
      const refresh=()=>setVersion(v=>v+1);
      try{const saved=sessionStorage.getItem("qmes_inventory_view");if(items.some(x=>x.view===saved)){active=saved;setView(saved);}}catch(_e){}
      window.addEventListener("qmes:inventory-view",onView);
      ["qmes:data-updated","qmes:inventory-stage2-ready","qmes:inventory-stage3-ready","qmes:finished-goods-inventory-ready","storage","focus"].forEach(name=>window.addEventListener(name,refresh));
      loadShipments();
      return()=>{
        window.removeEventListener("qmes:inventory-view",onView);
        ["qmes:data-updated","qmes:inventory-stage2-ready","qmes:inventory-stage3-ready","qmes:finished-goods-inventory-ready","storage","focus"].forEach(name=>window.removeEventListener(name,refresh));
      };
    },[loadShipments]);

    ReactRef.useEffect(()=>{installSidebar();},[view,version]);

    const shippedForLot=lot=>shipments.filter(r=>String(r.lotNo)===String(lot)).reduce((sum,r)=>sum+num(r.qty),0);
    const remaining=row=>Math.max(0,num(row?.produced)-shippedForLot(row?.lot));
    const oqcPass=lot=>{
      const rows=(window.DB?.insp?.OQC||[]).filter(r=>String(r?.lot||"").trim()===String(lot||"").trim());
      if(!rows.length)return false;
      const latest={};rows.forEach(r=>{latest[String(r.check||r.item||r.id||"")]=r;});
      const vals=Object.values(latest);return vals.length>0&&vals.every(r=>String(r.judge||"").trim()==="합격");
    };
    const nextShipNo=()=>{
      const base=`SHP-${today().replace(/-/g,"")}-`;
      const max=shipments.filter(r=>String(r.shipNo||"").startsWith(base)).reduce((m,r)=>Math.max(m,Number(String(r.shipNo).slice(-3))||0),0);
      return `${base}${String(max+1).padStart(3,"0")}`;
    };

    async function saveShipment(){
      const lotNo=String(form.lotNo||"").trim(),customer=String(form.customer||"").trim(),qty=num(form.qty);
      const row=fgRows.find(r=>String(r.lot)===lotNo);
      if(!lotNo)return alert("완제품 LOT를 선택하세요.");
      if(!customer)return alert("고객사 / 납품처를 입력하세요.");
      if(!(qty>0))return alert("출고수량을 입력하세요.");
      if(!row)return alert("완제품 재고 LOT를 찾을 수 없습니다.");
      if(!oqcPass(lotNo))return alert("OQC 전 항목 합격 LOT만 출고할 수 있습니다.");
      if(qty>remaining(row)+0.000001)return alert(`현재고 ${fmt(remaining(row))} kg를 초과하여 출고할 수 없습니다.`);
      if(typeof window.qmesSyncUpsert!=="function")return alert("공용 DB 동기화 기능을 사용할 수 없습니다.");
      const shipNo=nextShipNo();
      if(!confirm(`${lotNo} / ${customer} / ${fmt(qty)} kg\n출고를 확정하시겠습니까?`))return;
      setSaving(true);
      try{
        const payload={kind:"finished-product-shipment",shipNo,shipDate:form.shipDate||today(),lotNo,product:row.item||"",customer,qty,by:currentUser(),savedAt:new Date().toISOString()};
        await window.qmesSyncUpsert("inventory",`shipment:${shipNo}`,payload);
        await loadShipments();setForm({shipDate:today(),lotNo:"",customer:"",qty:""});window.dispatchEvent(new CustomEvent("qmes:data-updated"));alert("완제품 출고가 등록되었습니다.");
      }catch(e){alert(`출고 저장 실패: ${e.message||e}`);}finally{setSaving(false);}
    }
    async function deleteShipment(row){
      if(typeof window.qmesSyncUpsert!=="function")return;
      if(!confirm(`${row.shipNo} 출고내역을 삭제하시겠습니까?`))return;
      try{await window.qmesSyncUpsert("inventory",row.key||`shipment:${row.shipNo}`,{...row,deleted:true,deletedAt:new Date().toISOString(),deletedBy:currentUser()});await loadShipments();window.dispatchEvent(new CustomEvent("qmes:data-updated"));}catch(e){alert(`삭제 실패: ${e.message||e}`);}
    }

    if(view==="raw"){
      const shortage=rawRows.filter(r=>num(r.availableStock)<num(r.safety));
      const totalAvailable=rawRows.reduce((s,r)=>s+num(r.availableStock),0);
      return h("section",{"data-inventory-page":"raw"},h(PageHeader,{title:"원재료·부자재 재고",desc:"수입검사 및 생산 투입 내역과 연동된 원재료·부자재 현재고를 확인합니다."}),
        h("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"12px",marginBottom:"14px"}},h(Stat,{label:"관리 품목",value:`${rawRows.length} 품목`}),h(Stat,{label:"가용재고 합계",value:`${fmt(totalAvailable)} kg`,accent:"#0369a1"}),h(Stat,{label:"안전재고 부족",value:`${shortage.length} 품목`,accent:shortage.length?"#dc2626":"#059669"})),
        h(TableShell,null,h("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:"900px"}},h("thead",null,h("tr",null,["자재코드","품명","현재고","홀드","가용재고","안전재고","LOT","상태"].map(x=>h("th",{key:x,style:thStyle},x)))),h("tbody",null,rawRows.length?rawRows.map(r=>h("tr",{key:r.code||r.name},h("td",{style:{...tdStyle,fontWeight:800,color:"#0369a1"}},r.code||"-"),h("td",{style:{...tdStyle,textAlign:"left",fontWeight:700}},r.name||"-"),h("td",{style:tdStyle},`${fmt(r.stock)} ${r.unit||"kg"}`),h("td",{style:tdStyle},`${fmt(r.holdStock)} ${r.unit||"kg"}`),h("td",{style:{...tdStyle,fontWeight:800,color:"#059669"}},`${fmt(r.availableStock)} ${r.unit||"kg"}`),h("td",{style:tdStyle},fmt(r.safety)),h("td",{style:tdStyle},r.linked?`${r.lotCount||0} LOT`:"-"),h("td",{style:{...tdStyle,fontWeight:800,color:r.status==="부족"?"#dc2626":"#059669"}},r.status||"정상"))):h(Empty,{colSpan:8,text:"등록된 원재료·부자재 재고가 없습니다."})))));
    }

    if(view==="fg"){
      const availableRows=fgRows.filter(r=>remaining(r)>0),total=availableRows.reduce((s,r)=>s+remaining(r),0),passRows=availableRows.filter(r=>oqcPass(r.lot));
      return h("section",{"data-inventory-page":"fg"},h(PageHeader,{title:"완제품 재고 현황",desc:"생산 완료 LOT별 생산량·출고량·잔여재고와 OQC 상태를 확인합니다."}),
        h("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"12px",marginBottom:"14px"}},h(Stat,{label:"재고 LOT",value:`${availableRows.length} LOT`}),h(Stat,{label:"완제품 총 현재고",value:`${fmt(total)} kg`,accent:"#0369a1"}),h(Stat,{label:"출고 가능 LOT",value:`${passRows.length} LOT`,accent:"#059669"})),
        h(TableShell,null,h("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:"1000px"}},h("thead",null,h("tr",null,["완제품 LOT","품목","생산량","누적출고량","현재고","보관구역","보관조건","OQC","상태"].map(x=>h("th",{key:x,style:thStyle},x)))),h("tbody",null,fgRows.length?fgRows.map(r=>{const remain=remaining(r),pass=oqcPass(r.lot),lot=window.DB?.lots?.[r.lot]||{};return h("tr",{key:r.lot},h("td",{style:{...tdStyle,fontWeight:800,color:"#0369a1"}},r.lot),h("td",{style:{...tdStyle,textAlign:"left",fontWeight:700}},r.item||"-"),h("td",{style:tdStyle},`${fmt(r.produced)} ${r.unit||"kg"}`),h("td",{style:tdStyle},`${fmt(shippedForLot(r.lot))} ${r.unit||"kg"}`),h("td",{style:{...tdStyle,fontWeight:900,color:"#059669"}},`${fmt(remain)} ${r.unit||"kg"}`),h("td",{style:tdStyle},lot.storage||lot.location||"B구역"),h("td",{style:tdStyle},lot.storageCondition||"25±5℃ · 습도 50%↓"),h("td",{style:{...tdStyle,fontWeight:800,color:pass?"#059669":"#d97706"}},pass?"합격":"미검사/미합격"),h("td",{style:{...tdStyle,fontWeight:800}},remain<=0?"출고완료":pass?"출고가능":"출고보류"));}):h(Empty,{colSpan:9,text:"생산 완료된 완제품 재고가 없습니다."})))));
    }

    if(view==="ship"){
      const selected=fgRows.find(r=>String(r.lot)===String(form.lotNo));
      return h("section",{"data-inventory-page":"ship"},h(PageHeader,{title:"완제품 출고관리",desc:"OQC 합격 LOT에 한해 현재고 범위 내에서 출고를 등록합니다."}),
        h("div",{style:{...cardStyle,marginBottom:"14px"}},h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1.35fr 1.35fr 1fr 120px",gap:"10px",alignItems:"end"}},
          [["출고일자","date","shipDate"],["완제품 LOT","select","lotNo"],["고객사 / 납품처","text","customer"],["출고수량 (kg)","number","qty"]].map(([label,type,key])=>h("label",{key,style:{fontSize:"12px",fontWeight:800,color:"#475569"}},label,type==="select"?h("select",{value:form.lotNo,onChange:e=>setForm({...form,lotNo:e.target.value}),style:{...inputStyle,marginTop:"6px"}},h("option",{value:""},"LOT 선택"),fgRows.filter(r=>remaining(r)>0).map(r=>h("option",{key:r.lot,value:r.lot},`${r.lot} · ${r.item||""}`))):h("input",{type,value:form[key],step:type==="number"?"0.001":undefined,min:type==="number"?"0":undefined,onChange:e=>setForm({...form,[key]:e.target.value}),style:{...inputStyle,marginTop:"6px"}}))),
          h("button",{type:"button",disabled:saving,onClick:saveShipment,style:{height:"38px",border:0,borderRadius:"7px",background:saving?"#94a3b8":"#2563eb",color:"#fff",fontWeight:800,cursor:saving?"default":"pointer"}},saving?"저장 중":"출고 확정")),
          h("div",{style:{marginTop:"12px",padding:"10px 12px",borderRadius:"7px",background:"#f8fafc",fontSize:"12px",color:"#64748b"}},selected?`제품 ${selected.item||"-"} · 생산량 ${fmt(selected.produced)} kg · 누적출고 ${fmt(shippedForLot(selected.lot))} kg · 현재고 ${fmt(remaining(selected))} kg · OQC ${oqcPass(selected.lot)?"합격":"미검사/미합격"}`:"LOT를 선택하면 생산량·현재고·OQC 상태가 표시됩니다.")),
        h("h3",{style:{fontSize:"15px",fontWeight:800,color:"#0f172a",margin:"0 0 10px"}},"출고 가능 완제품 LOT"),
        h(TableShell,null,h("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:"860px"}},h("thead",null,h("tr",null,["완제품 LOT","제품명","생산량","누적출고","현재고","OQC","출고상태"].map(x=>h("th",{key:x,style:thStyle},x)))),h("tbody",null,fgRows.length?fgRows.map(r=>{const remain=remaining(r),pass=oqcPass(r.lot);return h("tr",{key:r.lot},h("td",{style:{...tdStyle,fontWeight:800,color:"#0369a1"}},r.lot),h("td",{style:tdStyle},r.item||"-"),h("td",{style:tdStyle},`${fmt(r.produced)} kg`),h("td",{style:tdStyle},`${fmt(shippedForLot(r.lot))} kg`),h("td",{style:{...tdStyle,fontWeight:900,color:"#059669"}},`${fmt(remain)} kg`),h("td",{style:{...tdStyle,fontWeight:800,color:pass?"#059669":"#d97706"}},pass?"합격":"미검사/미합격"),h("td",{style:tdStyle},remain<=0?"출고완료":pass?"출고가능":"출고보류"));}):h(Empty,{colSpan:7,text:"출고 가능한 완제품 LOT가 없습니다."})))));
    }

    return h("section",{"data-inventory-page":"history"},h(PageHeader,{title:"완제품 출고내역",desc:"등록된 완제품 출고 이력을 날짜·LOT·고객사 기준으로 확인합니다."}),
      h("div",{style:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"12px",marginBottom:"14px"}},h(Stat,{label:"출고 건수",value:`${shipments.length} 건`}),h(Stat,{label:"누적 출고량",value:`${fmt(shipments.reduce((s,r)=>s+num(r.qty),0))} kg`,accent:"#0369a1"})),
      h(TableShell,null,h("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:"900px"}},h("thead",null,h("tr",null,["출고일","출고번호","LOT","제품명","고객사","출고량","처리자","관리"].map(x=>h("th",{key:x,style:thStyle},x)))),h("tbody",null,shipments.length?shipments.map(r=>h("tr",{key:r.key||r.shipNo},h("td",{style:tdStyle},r.shipDate||"-"),h("td",{style:{...tdStyle,fontWeight:700}},r.shipNo||"-"),h("td",{style:{...tdStyle,fontWeight:800,color:"#0369a1"}},r.lotNo||"-"),h("td",{style:tdStyle},r.product||"-"),h("td",{style:tdStyle},r.customer||"-"),h("td",{style:{...tdStyle,fontWeight:800}},`${fmt(r.qty)} kg`),h("td",{style:tdStyle},r.by||r.savedBy||"-"),h("td",{style:tdStyle},h("button",{type:"button",onClick:()=>deleteShipment(r),style:{border:"1px solid #fecaca",borderRadius:"6px",background:"#fff",color:"#dc2626",fontSize:"12px",fontWeight:800,padding:"5px 9px",cursor:"pointer"}},"삭제")))):h(Empty,{colSpan:8,text:"등록된 완제품 출고내역이 없습니다."})))));
  }

  function activate(view){
    active=view;
    try{sessionStorage.setItem("qmes_inventory_view",view);}catch(_e){}
    window.dispatchEvent(new CustomEvent("qmes:inventory-view",{detail:{view}}));
    document.querySelectorAll("#qmes-sync-sidebar [data-inventory-view]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.inventoryView===view));
  }

  function installSidebar(){
    if(window.__QMES_UNIFIED_INVENTORY_V2__)return;
    const side=document.getElementById("qmes-sync-sidebar");
    if(!side||clean(side.querySelector(".qmes-side-title")?.textContent)!=="재고관리")return;
    const wrap=side.querySelector(".qmes-side-items");if(!wrap)return;
    const current=Array.from(wrap.querySelectorAll(".qmes-side-item"));
    const complete=items.every(item=>current.some(btn=>btn.dataset.inventoryView===item.view));
    if(!complete){wrap.replaceChildren();items.forEach(item=>{const btn=document.createElement("button");btn.type="button";btn.className="qmes-side-item"+(item.view===active?" is-active":"");btn.dataset.inventoryView=item.view;btn.textContent=item.label;wrap.appendChild(btn);});}
    else current.forEach(btn=>btn.classList.toggle("is-active",btn.dataset.inventoryView===active));
  }

  function installRouterPage(){
    if(window.__QMES_UNIFIED_INVENTORY_V2__)return;
    try{
      if(typeof TABS!=="undefined"&&Array.isArray(TABS)){
        const inv=TABS.find(x=>x&&x.id==="inv");
        if(inv&&inv.comp!==DedicatedInventoryPages){inv.comp=DedicatedInventoryPages;inv.label="재고관리";}
      }
    }catch(e){console.warn("[QMES] inventory page router patch failed",e);}
  }

  function removeLegacyInventoryHover(){document.getElementById("qmes-inventory-hover-menu")?.remove();document.getElementById("qmes-inventory-hover-style")?.remove();}

  document.addEventListener("click",event=>{
    const inv=event.target.closest?.("#qmes-sync-sidebar [data-inventory-view]");
    if(inv){event.preventDefault();event.stopPropagation();activate(inv.dataset.inventoryView);installSidebar();return;}
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top&&clean(top.textContent)==="재고관리"){try{const saved=sessionStorage.getItem("qmes_inventory_view");active=items.some(x=>x.view===saved)?saved:"raw";}catch(_e){active="raw";}setTimeout(installSidebar,0);setTimeout(installSidebar,60);setTimeout(installSidebar,180);}
  },true);

  installRouterPage();
  removeLegacyInventoryHover();
  const observer=new MutationObserver(()=>{removeLegacyInventoryHover();installRouterPage();installSidebar();});
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener("load",()=>{installRouterPage();removeLegacyInventoryHover();installSidebar();});
  setTimeout(()=>{installRouterPage();removeLegacyInventoryHover();installSidebar();},200);
})();
