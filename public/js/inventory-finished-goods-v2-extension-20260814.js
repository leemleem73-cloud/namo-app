/* Inventory v2 finished-goods extension and unified sidebar — 2026-08-14 */
(function bootstrapInventoryFinishedGoodsExtension(global){
  "use strict";

  let attempts=0;
  function start(){
    if(global.__QMES_INVENTORY_FINISHED_GOODS_V2_EXTENSION__)return;
    const ReactRef=global.React;
    const BaseInventory=global.InventoryManagementV2;
    if(!ReactRef||!BaseInventory){
      attempts+=1;
      if(attempts<80)setTimeout(start,50);
      else console.warn("[QMES] 재고관리 v2 완제품 확장 모듈을 시작하지 못했습니다.");
      return;
    }
    global.__QMES_INVENTORY_FINISHED_GOODS_V2_EXTENSION__=true;

    const h=ReactRef.createElement;
    const VIEW_KEY="qmes_inventory_v2_view";
    const PAGES=[
      {view:"overview",label:"재고현황"},
      {view:"receipts",label:"입고 / LOT"},
      {view:"usage",label:"생산투입"},
      {view:"adjustments",label:"반납 / 조정"},
      {view:"ledger",label:"수불이력"},
      {view:"stocktake",label:"재고실사"},
      {view:"shortage",label:"부족재고"},
      {view:"trace",label:"LOT 추적"},
      {view:"finished",label:"완제품 재고 현황"},
      {view:"finished-ship",label:"완제품 출고관리"},
      {view:"finished-history",label:"완제품 출고내역"}
    ];
    const FINISHED_VIEWS=new Set(["finished","finished-ship","finished-history"]);
    const LEGACY_VIEW_MAP={raw:"overview",fg:"finished",ship:"finished-ship",history:"finished-history"};
    const LABEL_VIEW_MAP=Object.fromEntries(PAGES.map(page=>[page.label,page.view]));

    const text=value=>String(value??"").trim();
    const clean=value=>text(value).replace(/[›〉]/g,"").replace(/\s+/g," ");
    const num=value=>{const parsed=Number(String(value??0).replace(/,/g,"").replace(/\s*(kg|ea|roll|box)$/i,"").trim());return Number.isFinite(parsed)?parsed:0;};
    const fmt=value=>num(value).toLocaleString("ko-KR",{maximumFractionDigits:3});
    const today=()=>new Date().toLocaleDateString("sv-SE");
    const dateTime=value=>{if(!value)return "-";const date=new Date(value);return Number.isNaN(date.getTime())?text(value):date.toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});};
    const currentUser=()=>{const user=global.__QMES_CURRENT_USER__||global.__QMES_USER__;return text(user?.name||user||"관리자");};
    const readView=()=>{
      try{const saved=sessionStorage.getItem(VIEW_KEY);return PAGES.some(page=>page.view===saved)?saved:"overview";}
      catch(_error){return "overview";}
    };
    const writeView=view=>{try{sessionStorage.setItem(VIEW_KEY,view);}catch(_error){}};
    const payloadOf=record=>{
      let payload=record?.payload;
      if(!payload||typeof payload!=="object"){
        try{payload=JSON.parse(payload||"{}");}catch(_error){payload={};}
      }
      return {key:record?.record_key||payload.key,...payload};
    };

    function emitView(view){
      if(!PAGES.some(page=>page.view===view))return;
      writeView(view);
      global.dispatchEvent(new CustomEvent("qmes:inventory-v2-view",{detail:{view}}));
      setTimeout(installRouterAndSidebar,0);
    }

    function Intro({title,description,actions}){
      return h("div",{className:"qmes-inv2-page-intro"},h("div",null,h("h2",null,title),h("p",null,description)),actions?h("div",{className:"qmes-inv2-actions"},actions):null);
    }
    function Button({children,onClick,tone="primary",disabled=false,type="button"}){
      return h("button",{type,onClick,disabled,className:`qmes-inv2-btn is-${tone}`},children);
    }
    function Summary({label,value,tone="default",hint}){
      return h("div",{className:`qmes-inv2-summary is-${tone}`},h("div",{className:"qmes-inv2-summary-label"},label),h("strong",null,value),hint?h("small",null,hint):null);
    }
    function Chip({kind="normal",children}){return h("span",{className:`qmes-inv2-chip is-${kind}`},children);}
    function Table({headers,children,minWidth="980px"}){
      return h("div",{className:"qmes-inv2-table-wrap"},h("table",{className:"qmes-inv2-table",style:{minWidth}},h("thead",null,h("tr",null,headers.map(header=>h("th",{key:header},header)))),h("tbody",null,children)));
    }
    function Empty({colSpan,text:message}){return h("tr",null,h("td",{colSpan,className:"qmes-inv2-empty"},message));}

    function FinishedGoodsPages({view}){
      const [shipments,setShipments]=ReactRef.useState([]);
      const [version,setVersion]=ReactRef.useState(0);
      const [loading,setLoading]=ReactRef.useState(true);
      const [saving,setSaving]=ReactRef.useState(false);
      const [error,setError]=ReactRef.useState("");
      const [form,setForm]=ReactRef.useState({shipDate:today(),lotNo:"",customer:"",qty:""});
      const finishedRows=ReactRef.useMemo(()=>typeof global.qmesBuildFinishedGoodsRows==="function"?(global.qmesBuildFinishedGoodsRows()||[]):[],[version]);

      const load=ReactRef.useCallback(async(showLoading=false)=>{
        if(showLoading)setLoading(true);
        setError("");
        try{
          if(typeof global.qmesSyncList!=="function")throw new Error("공용 재고 DB 연결 모듈을 불러오지 못했습니다.");
          const records=await global.qmesSyncList("inventory");
          const rows=(records||[]).map(payloadOf).filter(row=>!row.deleted&&(row.kind==="finished-product-shipment"||String(row.key||"").startsWith("shipment:"))).sort((a,b)=>String(b.shipDate||b.savedAt||"").localeCompare(String(a.shipDate||a.savedAt||"")));
          setShipments(rows);setVersion(value=>value+1);
        }catch(loadError){setError(text(loadError?.message||loadError));}
        finally{setLoading(false);}
      },[]);

      ReactRef.useEffect(()=>{
        load(true);
        const refresh=()=>load(false);
        global.addEventListener("qmes:data-updated",refresh);
        global.addEventListener("qmes:finished-goods-inventory-ready",refresh);
        global.addEventListener("focus",refresh);
        return()=>{
          global.removeEventListener("qmes:data-updated",refresh);
          global.removeEventListener("qmes:finished-goods-inventory-ready",refresh);
          global.removeEventListener("focus",refresh);
        };
      },[load]);

      const shippedForLot=lot=>shipments.filter(row=>text(row.lotNo)===text(lot)).reduce((sum,row)=>sum+num(row.qty),0);
      const remaining=row=>Math.max(0,num(row?.produced)-shippedForLot(row?.lot));
      const unitOf=row=>text(row?.unit)||"kg";
      const oqcPass=lot=>{
        const rows=(global.DB?.insp?.OQC||[]).filter(row=>text(row?.lot)===text(lot));
        if(!rows.length)return false;
        const latest=new Map();
        rows.forEach(row=>latest.set(text(row.check||row.item||row.id),row));
        return latest.size>0&&Array.from(latest.values()).every(row=>text(row.judge)==="합격");
      };
      const nextShipNo=()=>{
        const prefix=`SHP-${today().replace(/-/g,"")}-`;
        const maximum=shipments.filter(row=>text(row.shipNo).startsWith(prefix)).reduce((max,row)=>Math.max(max,Number(text(row.shipNo).slice(-3))||0),0);
        return `${prefix}${String(maximum+1).padStart(3,"0")}`;
      };
      const selected=finishedRows.find(row=>text(row.lot)===text(form.lotNo));

      async function saveShipment(){
        const lotNo=text(form.lotNo),customer=text(form.customer),quantity=num(form.qty);
        const row=finishedRows.find(item=>text(item.lot)===lotNo);
        if(!lotNo)return alert("완제품 LOT를 선택하세요.");
        if(!customer)return alert("고객사 / 납품처를 입력하세요.");
        if(!(quantity>0))return alert("출고수량을 입력하세요.");
        if(!row)return alert("완제품 재고 LOT를 찾을 수 없습니다.");
        if(!oqcPass(lotNo))return alert("OQC 전 항목 합격 LOT만 출고할 수 있습니다.");
        if(quantity>remaining(row)+0.000001)return alert(`현재고 ${fmt(remaining(row))} ${unitOf(row)}를 초과하여 출고할 수 없습니다.`);
        if(typeof global.qmesSyncUpsert!=="function")return alert("공용 DB 동기화 기능을 사용할 수 없습니다.");
        const shipNo=nextShipNo();
        if(!confirm(`${lotNo} / ${customer} / ${fmt(quantity)} ${unitOf(row)}\n출고를 확정하시겠습니까?`))return;
        setSaving(true);setError("");
        try{
          await global.qmesSyncUpsert("inventory",`shipment:${shipNo}`,{kind:"finished-product-shipment",shipNo,shipDate:form.shipDate||today(),lotNo,product:row.item||row.product||"",customer,qty:quantity,unit:unitOf(row),by:currentUser(),savedAt:new Date().toISOString()});
          setForm({shipDate:today(),lotNo:"",customer:"",qty:""});
          await load(false);global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"finished-product-shipment"}}));
          alert("완제품 출고가 등록되었습니다.");
        }catch(saveError){setError(text(saveError?.message||saveError));alert(`출고 저장 실패: ${text(saveError?.message||saveError)}`);}
        finally{setSaving(false);}
      }

      async function deleteShipment(row){
        if(typeof global.qmesSyncUpsert!=="function")return;
        if(!confirm(`${row.shipNo} 출고내역을 삭제하시겠습니까?`))return;
        setSaving(true);setError("");
        try{
          await global.qmesSyncUpsert("inventory",row.key||`shipment:${row.shipNo}`,{...row,deleted:true,deletedAt:new Date().toISOString(),deletedBy:currentUser()});
          await load(false);global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"finished-product-shipment-delete"}}));
        }catch(deleteError){setError(text(deleteError?.message||deleteError));alert(`삭제 실패: ${text(deleteError?.message||deleteError)}`);}
        finally{setSaving(false);}
      }

      const pageHeader=loading?h("div",{className:"qmes-inv2-loading"},"완제품 재고 데이터를 동기화하고 있습니다…"):null;
      const errorBox=error?h("div",{className:"qmes-inv2-error"},error,h("button",{type:"button",onClick:()=>load(true)},"다시 시도")):null;

      if(view==="finished"){
        const available=finishedRows.filter(row=>remaining(row)>0);
        const passed=available.filter(row=>oqcPass(row.lot));
        return h("section",{className:"qmes-inventory-v2 qmes-inv2-finished","data-inventory-v2":view},pageHeader,errorBox,
          h(Intro,{title:"완제품 재고 현황",description:"생산 완료 LOT별 생산량·출고량·현재고와 OQC 상태를 확인합니다.",actions:h(Button,{tone:"secondary",onClick:()=>load(false)},"새로고침")}),
          h("div",{className:"qmes-inv2-summary-grid qmes-inv2-finished-summary"},
            h(Summary,{label:"완제품 품목",value:`${new Set(finishedRows.map(row=>row.item||row.product).filter(Boolean)).size} 품목`}),
            h(Summary,{label:"재고 LOT",value:`${available.length} LOT`}),
            h(Summary,{label:"출고 가능 LOT",value:`${passed.length} LOT`,tone:"success"}),
            h(Summary,{label:"출고 보류 LOT",value:`${available.length-passed.length} LOT`,tone:available.length-passed.length?"warning":"success"})
          ),
          h(Table,{headers:["완제품 LOT","제품명","생산량","누적출고","현재고","단위","보관위치","OQC","상태"],minWidth:"1060px"},finishedRows.length?finishedRows.map(row=>{
            const remain=remaining(row),pass=oqcPass(row.lot),lot=global.DB?.lots?.[row.lot]||{};
            return h("tr",{key:row.lot},h("td",{className:"is-code"},row.lot),h("td",{className:"is-name"},row.item||row.product||"-"),h("td",{className:"is-number"},fmt(row.produced)),h("td",{className:"is-number"},fmt(shippedForLot(row.lot))),h("td",{className:"is-number is-available"},fmt(remain)),h("td",null,unitOf(row)),h("td",null,lot.storage||lot.location||"미지정"),h("td",null,h(Chip,{kind:pass?"normal":"warning"},pass?"합격":"미검사/미합격")),h("td",null,h(Chip,{kind:remain<=0?"default":pass?"normal":"hold"},remain<=0?"출고완료":pass?"출고가능":"출고보류")));
          }):h(Empty,{colSpan:9,text:"생산 완료된 완제품 재고가 없습니다."}))
        );
      }

      if(view==="finished-ship"){
        return h("section",{className:"qmes-inventory-v2 qmes-inv2-finished","data-inventory-v2":view},pageHeader,errorBox,
          h(Intro,{title:"완제품 출고관리",description:"OQC 합격 LOT에 한해 현재고 범위에서 완제품 출고를 등록합니다.",actions:h(Button,{tone:"secondary",onClick:()=>emitView("finished-history")},"출고내역 조회")}),
          h("div",{className:"qmes-inv2-finished-form"},
            h("label",null,h("span",null,"출고일자"),h("input",{type:"date",value:form.shipDate,onChange:event=>setForm({...form,shipDate:event.target.value})})),
            h("label",null,h("span",null,"완제품 LOT"),h("select",{value:form.lotNo,onChange:event=>setForm({...form,lotNo:event.target.value})},h("option",{value:""},"LOT 선택"),finishedRows.filter(row=>remaining(row)>0).map(row=>h("option",{key:row.lot,value:row.lot},`${row.lot} · ${row.item||row.product||""}`)))),
            h("label",null,h("span",null,"고객사 / 납품처"),h("input",{value:form.customer,onChange:event=>setForm({...form,customer:event.target.value}),placeholder:"고객사 입력"})),
            h("label",null,h("span",null,`출고수량${selected?` (${unitOf(selected)})`:""}`),h("input",{type:"number",min:"0",step:"0.001",value:form.qty,onChange:event=>setForm({...form,qty:event.target.value}),placeholder:"0"})),
            h(Button,{onClick:saveShipment,disabled:saving},saving?"저장 중":"출고 확정")
          ),
          selected?h("div",{className:"qmes-inv2-callout is-info"},h("strong",null,selected.item||selected.product||"완제품"),h("span",null,`생산 ${fmt(selected.produced)} ${unitOf(selected)} · 누적출고 ${fmt(shippedForLot(selected.lot))} ${unitOf(selected)} · 현재고 ${fmt(remaining(selected))} ${unitOf(selected)} · OQC ${oqcPass(selected.lot)?"합격":"미검사/미합격"}`)):null,
          h(Table,{headers:["완제품 LOT","제품명","생산량","누적출고","현재고","단위","OQC","출고상태"],minWidth:"930px"},finishedRows.length?finishedRows.map(row=>{const remain=remaining(row),pass=oqcPass(row.lot);return h("tr",{key:row.lot},h("td",{className:"is-code"},row.lot),h("td",{className:"is-name"},row.item||row.product||"-"),h("td",{className:"is-number"},fmt(row.produced)),h("td",{className:"is-number"},fmt(shippedForLot(row.lot))),h("td",{className:"is-number is-available"},fmt(remain)),h("td",null,unitOf(row)),h("td",null,h(Chip,{kind:pass?"normal":"warning"},pass?"합격":"미검사/미합격")),h("td",null,remain<=0?"출고완료":pass?"출고가능":"출고보류"));}):h(Empty,{colSpan:8,text:"출고 가능한 완제품 LOT가 없습니다."}))
        );
      }

      return h("section",{className:"qmes-inventory-v2 qmes-inv2-finished","data-inventory-v2":view},pageHeader,errorBox,
        h(Intro,{title:"완제품 출고내역",description:"등록된 완제품 출고 이력을 날짜·LOT·고객사 기준으로 확인합니다.",actions:h(Button,{tone:"secondary",onClick:()=>load(false)},"새로고침")}),
        h("div",{className:"qmes-inv2-summary-grid qmes-inv2-finished-summary"},h(Summary,{label:"출고 건수",value:`${shipments.length} 건`}),h(Summary,{label:"출고 LOT",value:`${new Set(shipments.map(row=>row.lotNo)).size} LOT`}),h(Summary,{label:"고객사",value:`${new Set(shipments.map(row=>row.customer).filter(Boolean)).size} 곳`})),
        h(Table,{headers:["일시","출고일","출고번호","완제품 LOT","제품명","고객사","출고량","단위","처리자","관리"],minWidth:"1120px"},shipments.length?shipments.map(row=>h("tr",{key:row.key||row.shipNo},h("td",null,dateTime(row.savedAt)),h("td",null,row.shipDate||"-"),h("td",{className:"is-code"},row.shipNo||"-"),h("td",{className:"is-code"},row.lotNo||"-"),h("td",{className:"is-name"},row.product||"-"),h("td",null,row.customer||"-"),h("td",{className:"is-number"},fmt(row.qty)),h("td",null,row.unit||"kg"),h("td",null,row.by||row.savedBy||"-"),h("td",null,h(Button,{tone:"danger",disabled:saving,onClick:()=>deleteShipment(row)},"삭제")))):h(Empty,{colSpan:10,text:"등록된 완제품 출고내역이 없습니다."}))
      );
    }

    function CompleteInventory(){
      const [view,setView]=ReactRef.useState(readView);
      ReactRef.useEffect(()=>{
        const onV2=event=>{
          const next=text(event?.detail?.view||event?.detail);
          if(PAGES.some(page=>page.view===next)){writeView(next);setView(next);}
        };
        const onLegacy=event=>{
          const legacy=text(event?.detail?.view||event?.detail);
          const mapped=LEGACY_VIEW_MAP[legacy];
          if(mapped)emitView(mapped);
        };
        global.addEventListener("qmes:inventory-v2-view",onV2);
        global.addEventListener("qmes:inventory-view",onLegacy);
        return()=>{
          global.removeEventListener("qmes:inventory-v2-view",onV2);
          global.removeEventListener("qmes:inventory-view",onLegacy);
        };
      },[]);
      return FINISHED_VIEWS.has(view)?h(FinishedGoodsPages,{view}):h(BaseInventory);
    }

    function patchRouter(){
      try{
        if(typeof TABS!=="undefined"&&Array.isArray(TABS)){
          const inventory=TABS.find(tab=>tab?.id==="inv");
          if(inventory){inventory.comp=CompleteInventory;inventory.label="재고관리";}
        }
      }catch(error){console.warn("[QMES] 완제품 통합 재고 라우터 패치 실패",error);}
    }

    function installRouterAndSidebar(){
      patchRouter();
      const side=document.getElementById("qmes-sync-sidebar");
      if(!side||clean(side.querySelector(".qmes-side-title")?.textContent)!=="재고관리")return;
      const wrap=side.querySelector(".qmes-side-items");
      if(!wrap)return;
      const current=Array.from(wrap.querySelectorAll(".qmes-side-item"));
      const complete=current.length===PAGES.length&&PAGES.every(page=>current.some(button=>button.dataset.inventoryV2View===page.view));
      if(!complete){
        wrap.replaceChildren();
        PAGES.forEach(page=>{
          const button=document.createElement("button");
          button.type="button";button.className="qmes-side-item";button.dataset.inventoryV2View=page.view;button.textContent=page.label;wrap.appendChild(button);
        });
      }
      wrap.dataset.inventoryV2="true";
      wrap.dataset.inventoryV2Complete="true";
      const active=readView();
      wrap.querySelectorAll("[data-inventory-v2-view]").forEach(button=>button.classList.toggle("is-active",button.dataset.inventoryV2View===active));
    }

    document.addEventListener("click",event=>{
      const top=event.target.closest?.(".qmes-top-menu-button");
      if(top&&clean(top.textContent)==="재고관리"){
        setTimeout(installRouterAndSidebar,0);setTimeout(installRouterAndSidebar,80);setTimeout(installRouterAndSidebar,220);
      }
      const oldButton=event.target.closest?.("#qmes-sync-sidebar [data-inventory-view],#qmes-top-hover-bar button[data-label]");
      if(!oldButton)return;
      const legacy=oldButton.dataset.inventoryView;
      const mapped=LEGACY_VIEW_MAP[legacy]||LABEL_VIEW_MAP[clean(oldButton.dataset.label||oldButton.textContent)];
      if(mapped){event.preventDefault();event.stopPropagation();emitView(mapped);}
    },true);

    const style=document.createElement("style");
    style.id="qmes-inventory-finished-v2-extension-style";
    style.textContent=`
      .qmes-inv2-finished-summary{grid-template-columns:repeat(4,minmax(0,1fr))}
      .qmes-inv2-finished-form{display:grid;grid-template-columns:150px minmax(230px,1.4fr) minmax(210px,1.2fr) 150px 120px;gap:10px;align-items:end;margin-bottom:14px;padding:14px;border:1px solid #29445e;border-radius:10px;background:#0d2237}
      .qmes-inv2-finished-form label{display:grid;gap:6px;color:#9fb4c8;font-size:12px;font-weight:800}
      .qmes-inv2-finished-form input,.qmes-inv2-finished-form select{width:100%;height:38px;box-sizing:border-box;border:1px solid #334b65;border-radius:7px;background:#12263c;color:#e2e8f0;padding:0 10px;font:700 12px Pretendard,sans-serif;outline:none}
      @media(max-width:1100px){.qmes-inv2-finished-form{grid-template-columns:1fr 1fr}.qmes-inv2-finished-form>.qmes-inv2-btn{grid-column:1/-1}.qmes-inv2-finished-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:640px){.qmes-inv2-finished-form,.qmes-inv2-finished-summary{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    global.InventoryManagementV2Complete=CompleteInventory;
    global.qmesInventoryV2CompletePages=PAGES.map(page=>({...page}));
    global.qmesOpenInventoryV2View=emitView;
    global.addEventListener("qmes:inventory-stage3-view-ready",installRouterAndSidebar);
    global.addEventListener("qmes:inventory-stage3-ready",installRouterAndSidebar);
    global.addEventListener("qmes:auth-ready",()=>setTimeout(installRouterAndSidebar,0));
    new MutationObserver(installRouterAndSidebar).observe(document.documentElement,{childList:true,subtree:true});
    installRouterAndSidebar();setTimeout(installRouterAndSidebar,250);setTimeout(installRouterAndSidebar,1000);
    console.info("[QMES] 재고관리 v2 완제품 3개 문서 통합 활성화");
  }

  start();
})(window);
