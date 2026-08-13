/* QMES inventory stage 3 view - raw materials + finished goods + shipment management */
(function installInventoryStage3View(global){
  "use strict";
  function h(){return global.React.createElement.apply(global.React,arguments);}
  function fmt(value){const n=Number(value||0);return Number.isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:3}):"0";}
  function num(value){const n=Number(String(value??"").replace(/,/g,"").replace(/\s*kg$/i,"").trim());return Number.isFinite(n)?n:0;}
  function today(){return new Date().toISOString().slice(0,10);}
  function currentUser(){const raw=global.__QMES_CURRENT_USER__||global.__QMES_USER__;return String(raw?.name||raw||"").trim();}
  function shipmentPayload(record){const value=record?.payload;if(value&&typeof value==="object")return value;try{return JSON.parse(value||"{}");}catch(_e){return {};}}

  function Stage3InventoryTab(){
    const [tab,setTab]=global.React.useState("raw");
    const [version,setVersion]=global.React.useState(0);
    const [shipments,setShipments]=global.React.useState([]);
    const [shipForm,setShipForm]=global.React.useState({shipDate:today(),lotNo:"",customer:"",qty:""});
    const [saving,setSaving]=global.React.useState(false);

    const rawRows=typeof global.qmesBuildInventoryRows==="function"?global.qmesBuildInventoryRows():[];
    const fgRows=typeof global.qmesBuildFinishedGoodsRows==="function"?global.qmesBuildFinishedGoodsRows():[];
    const validation=typeof global.qmesValidateInventoryLotFlow==="function"?global.qmesValidateInventoryLotFlow():{ok:false,counts:{errors:0,warnings:0},errors:[],warnings:[]};

    const loadShipments=global.React.useCallback(async()=>{
      if(typeof global.qmesSyncList!=="function")return;
      try{
        const records=await global.qmesSyncList("inventory");
        const rows=(records||[])
          .filter(r=>String(r.record_key||"").startsWith("shipment:"))
          .map(r=>({key:r.record_key,...shipmentPayload(r)}))
          .filter(r=>!r.deleted)
          .sort((a,b)=>String(b.shipDate||"").localeCompare(String(a.shipDate||""))||String(b.shipNo||"").localeCompare(String(a.shipNo||"")));
        setShipments(rows);
      }catch(e){console.warn("shipment load failed",e);}
    },[]);

    global.React.useEffect(()=>{
      const refresh=()=>setVersion(v=>v+1);
      const setInventoryView=(event)=>{const key=String(event?.detail?.view||event?.detail||"");if(["raw","fg","ship","history"].includes(key))setTab(key);};
      ["qmes:data-updated","qmes:inventory-stage2-ready","qmes:finished-goods-inventory-ready","qmes:inventory-lot-validation-ready","storage","focus"].forEach(x=>global.addEventListener(x,refresh));
      global.addEventListener("qmes:inventory-view",setInventoryView);
      loadShipments();
      return()=>{
        ["qmes:data-updated","qmes:inventory-stage2-ready","qmes:finished-goods-inventory-ready","qmes:inventory-lot-validation-ready","storage","focus"].forEach(x=>global.removeEventListener(x,refresh));
        global.removeEventListener("qmes:inventory-view",setInventoryView);
      };
    },[loadShipments]);

    const shippedForLot=(lot)=>shipments.filter(r=>String(r.lotNo)===String(lot)).reduce((sum,r)=>sum+num(r.qty),0);
    const remainingForRow=(row)=>Math.max(0,num(row.produced)-shippedForLot(row.lot));
    const oqcPass=(lot)=>{
      const rows=(global.DB?.insp?.OQC||[]).filter(r=>String(r?.lot||"").trim()===String(lot||"").trim());
      if(!rows.length)return false;
      const latest={};rows.forEach(r=>{latest[String(r.check||r.item||r.id||"")]=r;});
      const values=Object.values(latest);return values.length>0&&values.every(r=>String(r.judge||"").trim()==="합격");
    };
    const nextShipNo=()=>{
      const base=`SHP-${today().replace(/-/g,"")}-`;
      const max=shipments.filter(r=>String(r.shipNo||"").startsWith(base)).reduce((m,r)=>Math.max(m,Number(String(r.shipNo).slice(-3))||0),0);
      return `${base}${String(max+1).padStart(3,"0")}`;
    };

    const saveShipment=async()=>{
      const lotNo=String(shipForm.lotNo||"").trim();
      const customer=String(shipForm.customer||"").trim();
      const qty=num(shipForm.qty);
      const row=fgRows.find(r=>String(r.lot)===lotNo);
      if(!lotNo)return alert("완제품 LOT를 선택하세요.");
      if(!customer)return alert("고객사 / 납품처를 입력하세요.");
      if(!(qty>0))return alert("출고수량을 입력하세요.");
      if(!row)return alert("완제품 재고 LOT를 찾을 수 없습니다.");
      if(!oqcPass(lotNo))return alert("OQC 전 항목 합격 LOT만 출고할 수 있습니다.");
      const available=remainingForRow(row);
      if(qty>available+0.000001)return alert(`현재고 ${fmt(available)} kg를 초과하여 출고할 수 없습니다.`);
      if(typeof global.qmesSyncUpsert!=="function")return alert("공용 DB 동기화 기능을 사용할 수 없습니다.");
      const shipNo=nextShipNo();
      if(!confirm(`${lotNo} / ${customer} / ${fmt(qty)} kg\n출고를 확정하시겠습니까?`))return;
      setSaving(true);
      try{
        const payload={kind:"finished-product-shipment",shipNo,shipDate:shipForm.shipDate||today(),lotNo,product:row.item||"",customer,qty,by:currentUser(),savedAt:new Date().toISOString()};
        await global.qmesSyncUpsert("inventory",`shipment:${shipNo}`,payload);
        await loadShipments();
        setShipForm({shipDate:today(),lotNo:"",customer:"",qty:""});
        global.dispatchEvent(new CustomEvent("qmes:data-updated"));
        alert("완제품 출고가 등록되었습니다.");
      }catch(e){alert(`출고 저장 실패: ${e.message||e}`);}finally{setSaving(false);}
    };

    const deleteShipment=async(row)=>{
      if(typeof global.qmesSyncUpsert!=="function")return;
      if(!confirm(`${row.shipNo} 출고내역을 삭제하시겠습니까?`))return;
      try{
        await global.qmesSyncUpsert("inventory",row.key||`shipment:${row.shipNo}`,{...row,deleted:true,deletedAt:new Date().toISOString(),deletedBy:currentUser()});
        await loadShipments();
        global.dispatchEvent(new CustomEvent("qmes:data-updated"));
      }catch(e){alert(`삭제 실패: ${e.message||e}`);}
    };

    const rawShort=rawRows.filter(r=>Number(r.availableStock||0)<Number(r.safety||0));
    const fgRemaining=fgRows.reduce((sum,r)=>sum+remainingForRow(r),0);
    const validationRows=[...(validation.errors||[]),...(validation.warnings||[])];

    const rawTable=h("div",{className:"overflow-x-auto"},h("table",{className:"w-full text-sm min-w-[980px]"},h("thead",null,h("tr",{className:"text-xs text-slate-400 border-b border-slate-800"},["자재코드","품명","현재고","홀드","가용재고","안전재고","LOT","상태"].map((x,i)=>h("th",{key:x,className:`py-2 px-3 ${i>=2&&i<=6?"text-right":"text-left"}`},x)))),h("tbody",null,rawRows.map(row=>h("tr",{key:row.code,className:"border-b border-slate-800/60"},h("td",{className:"py-2.5 px-3 font-mono text-xs text-sky-300"},row.code),h("td",{className:"py-2.5 px-3 text-slate-100"},row.name),h("td",{className:"py-2.5 px-3 text-right"},`${fmt(row.stock)} ${row.unit}`),h("td",{className:"py-2.5 px-3 text-right text-rose-300"},`${fmt(row.holdStock)} ${row.unit}`),h("td",{className:"py-2.5 px-3 text-right font-semibold text-emerald-300"},`${fmt(row.availableStock)} ${row.unit}`),h("td",{className:"py-2.5 px-3 text-right text-slate-400"},fmt(row.safety)),h("td",{className:"py-2.5 px-3 text-right"},row.linked?`${row.lotCount} LOT`:"-"),h("td",{className:"py-2.5 px-3"},typeof Badge!=="undefined"?h(Badge,{tone:row.status==="부족"?"amber":"green"},row.status):row.status))))));

    const fgTable=h("div",{className:"overflow-x-auto"},h("table",{className:"w-full text-sm min-w-[1100px]"},h("thead",null,h("tr",{className:"text-xs text-slate-400 border-b border-slate-800"},["완제품 LOT","품목","생산량","누적출고량","현재고","보관구역","보관조건","OQC","상태"].map((x,i)=>h("th",{key:x,className:`py-2 px-3 ${i>=2&&i<=4?"text-right":"text-left"}`},x)))),h("tbody",null,fgRows.length?fgRows.map(row=>{
      const remaining=remainingForRow(row),pass=oqcPass(row.lot);const lot=global.DB?.lots?.[row.lot]||{};
      return h("tr",{key:row.lot,className:"border-b border-slate-800/60"},h("td",{className:"py-2.5 px-3 font-mono text-xs text-sky-300"},row.lot),h("td",{className:"py-2.5 px-3 text-slate-100"},row.item),h("td",{className:"py-2.5 px-3 text-right"},`${fmt(row.produced)} ${row.unit}`),h("td",{className:"py-2.5 px-3 text-right text-slate-300"},`${fmt(shippedForLot(row.lot))} ${row.unit}`),h("td",{className:"py-2.5 px-3 text-right font-semibold text-emerald-300"},`${fmt(remaining)} ${row.unit}`),h("td",{className:"py-2.5 px-3 text-xs text-slate-300"},lot.storage||lot.location||"B구역"),h("td",{className:"py-2.5 px-3 text-xs text-slate-400"},lot.storageCondition||"25±5℃ · 습도 50%↓"),h("td",{className:pass?"py-2.5 px-3 text-emerald-300 font-bold":"py-2.5 px-3 text-amber-300 font-bold"},pass?"합격":"미검사/미합격"),h("td",{className:"py-2.5 px-3"},typeof Badge!=="undefined"?h(Badge,{tone:remaining<=0?"green":pass?"blue":"amber"},remaining<=0?"출고완료":pass?"출고가능":"출고보류"):remaining<=0?"출고완료":pass?"출고가능":"출고보류"));
    }):h("tr",null,h("td",{colSpan:9,className:"py-8 text-center text-slate-500"},"생산 완료된 완제품 재고가 없습니다.")))));

    const shipLot=fgRows.find(r=>String(r.lot)===String(shipForm.lotNo));
    const shipAvailable=shipLot?remainingForRow(shipLot):0;
    const shipPanel=h("div",{className:"flex flex-col gap-4"},
      h(Panel,{title:"완제품 출고관리",right:h("span",{className:"text-xs text-slate-400"},"OQC 합격 + 현재고 범위 내 출고")},
        h("div",{className:"grid grid-cols-1 md:grid-cols-5 gap-3"},
          h("label",{className:"text-xs text-slate-400"},"출고일자",h("input",{type:"date",value:shipForm.shipDate,onChange:e=>setShipForm({...shipForm,shipDate:e.target.value}),className:"mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"})),
          h("label",{className:"text-xs text-slate-400"},"완제품 LOT",h("select",{value:shipForm.lotNo,onChange:e=>setShipForm({...shipForm,lotNo:e.target.value}),className:"mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"},h("option",{value:""},"LOT 선택"),fgRows.filter(r=>remainingForRow(r)>0).map(r=>h("option",{key:r.lot,value:r.lot},`${r.lot} · ${r.item}`)))),
          h("label",{className:"text-xs text-slate-400"},"고객사 / 납품처",h("input",{value:shipForm.customer,onChange:e=>setShipForm({...shipForm,customer:e.target.value}),placeholder:"예: 현대자동차",className:"mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"})),
          h("label",{className:"text-xs text-slate-400"},"출고수량 (kg)",h("input",{type:"number",step:"0.001",min:"0",value:shipForm.qty,onChange:e=>setShipForm({...shipForm,qty:e.target.value}),className:"mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"})),
          h("div",{className:"flex items-end"},h("button",{type:"button",disabled:saving,onClick:saveShipment,className:"w-full rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-sm font-bold text-white"},saving?"저장 중...":"출고 확정"))
        ),
        h("div",{className:"mt-3 text-xs text-slate-400"},shipLot?`제품 ${shipLot.item} · 생산량 ${fmt(shipLot.produced)} kg · 누적출고 ${fmt(shippedForLot(shipLot.lot))} kg · 현재고 ${fmt(shipAvailable)} kg · OQC ${oqcPass(shipLot.lot)?"합격":"미검사/미합격"}`:"LOT를 선택하면 생산량·현재고·OQC 상태를 확인합니다.")
      ),
      h(Panel,{title:"출고 가능 완제품 LOT",right:h("span",{className:"text-xs text-slate-400"},`${fgRows.filter(r=>remainingForRow(r)>0&&oqcPass(r.lot)).length} LOT`)},fgTable)
    );

    const historyTable=h("div",{className:"overflow-x-auto"},h("table",{className:"w-full text-sm min-w-[1000px]"},h("thead",null,h("tr",{className:"text-xs text-slate-400 border-b border-slate-800"},["출고일","출고번호","LOT","제품명","고객사","출고량","처리자","관리"].map(x=>h("th",{key:x,className:"py-2 px-3 text-left"},x)))),h("tbody",null,shipments.length?shipments.map(row=>h("tr",{key:row.key||row.shipNo,className:"border-b border-slate-800/60"},h("td",{className:"py-2.5 px-3"},row.shipDate||"-"),h("td",{className:"py-2.5 px-3 font-mono"},row.shipNo||"-"),h("td",{className:"py-2.5 px-3 font-mono text-sky-300"},row.lotNo||"-"),h("td",{className:"py-2.5 px-3"},row.product||"-"),h("td",{className:"py-2.5 px-3"},row.customer||"-"),h("td",{className:"py-2.5 px-3"},`${fmt(row.qty)} kg`),h("td",{className:"py-2.5 px-3"},row.by||row.savedBy||"-"),h("td",{className:"py-2.5 px-3"},h("button",{type:"button",onClick:()=>deleteShipment(row),className:"rounded border border-rose-700 px-2.5 py-1 text-xs font-bold text-rose-300"},"삭제")))):h("tr",null,h("td",{colSpan:8,className:"py-8 text-center text-slate-500"},"등록된 완제품 출고내역이 없습니다.")))));

    const validationPanel=h(Panel,{title:"LOT 수불 자동검증",right:h("span",{className:`text-xs font-bold ${validation.ok&&!(validation.counts?.warnings)?"text-emerald-300":validation.counts?.errors?"text-rose-300":"text-amber-300"}`},validation.counts?.errors?`오류 ${validation.counts.errors}건`:validation.counts?.warnings?`경고 ${validation.counts.warnings}건`:"정상")},validationRows.length?h("div",{className:"flex flex-col gap-2"},validationRows.slice(0,10).map((r,i)=>h("div",{key:`${r.code}-${i}`,className:`rounded-lg border px-3 py-2 text-sm ${r.type==="error"?"border-rose-800/70 bg-rose-950/20 text-rose-200":"border-amber-800/70 bg-amber-950/20 text-amber-200"}`},h("div",{className:"font-bold"},r.type==="error"?"오류":"경고"," · ",r.code),h("div",{className:"mt-1 text-xs opacity-90"},r.message)))):h("div",{className:"rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-3 text-sm text-emerald-200"},"원재료 입고 → 실투입 → 생산완료 → 출하 → 잔여재고 수불이 정상입니다."));

    if(tab==="raw")return h("div",{className:"flex flex-col gap-4","data-stage3-version":version},validationPanel,h(Panel,{title:"원재료 · 부자재 재고 현황",right:h("span",{className:"text-xs text-slate-400"},`부족 ${rawShort.length} 품목`)},rawTable));
    if(tab==="fg")return h("div",{className:"flex flex-col gap-4","data-stage3-version":version},h("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3"},h("div",{className:"rounded-xl border border-slate-700 bg-slate-900/50 p-4"},h("div",{className:"text-xs text-slate-400"},"완제품 재고 LOT"),h("div",{className:"text-2xl font-black mt-1"},`${fgRows.filter(r=>remainingForRow(r)>0).length} LOT`)),h("div",{className:"rounded-xl border border-slate-700 bg-slate-900/50 p-4"},h("div",{className:"text-xs text-slate-400"},"완제품 총 현재고"),h("div",{className:"text-2xl font-black mt-1"},`${fmt(fgRemaining)} kg`)),h("div",{className:"rounded-xl border border-slate-700 bg-slate-900/50 p-4"},h("div",{className:"text-xs text-slate-400"},"출고 가능 LOT"),h("div",{className:"text-2xl font-black mt-1 text-emerald-300"},`${fgRows.filter(r=>remainingForRow(r)>0&&oqcPass(r.lot)).length} LOT`))),h(Panel,{title:"완제품 재고 현황",right:h("span",{className:"text-xs text-slate-400"},"조회 전용")},fgTable));
    if(tab==="ship")return h("div",{className:"flex flex-col gap-4","data-stage3-version":version},shipPanel);
    return h("div",{className:"flex flex-col gap-4","data-stage3-version":version},h(Panel,{title:"완제품 출고내역",right:h("span",{className:"text-xs text-slate-400"},`${shipments.length}건`)},historyTable));
  }

  global.InventoryTab=Stage3InventoryTab;
  global.dispatchEvent(new CustomEvent("qmes:inventory-stage3-view-ready"));
})(window);
