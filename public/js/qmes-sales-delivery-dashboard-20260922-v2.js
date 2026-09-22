/* QMES Sales/Delivery integrated dashboard V2 - FINAL SCREEN - 2026-09-22
 * ADD-ONLY new React owner.
 * Existing Sales components remain preserved.
 * Final layout: title/actions -> filters -> KPI -> auto judgment -> integrated ledger.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DELIVERY_DASHBOARD_20260922_V2__) return;
  window.__QMES_SALES_DELIVERY_DASHBOARD_20260922_V2__=true;

  const ReactRef=window.React;
  if(!ReactRef) return;
  const h=ReactRef.createElement;
  const {useEffect,useMemo,useState}=ReactRef;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const SHIPPING="qmes-erp-shipping-v1";
  const DELETED="qmes-sales-deleted-v1";
  const PAGE_SIZE=10;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const compact=v=>clean(v).replace(/\s+/g,"").replace(/^\(주\)/,"").toLowerCase();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:null};
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const metaMap=()=>{const v=read(META,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
  const shipRows=()=>{const v=read(SHIPPING,[]);return Array.isArray(v)?v:[]};
  const delRows=()=>{const v=read(DELETED,[]);return Array.isArray(v)?v:[]};
  const localRows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?m[1]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[3]).padStart(2,"0"):""};
  const dateValue=v=>{const s=iso(v);return s?new Date(s+"T00:00:00").getTime():NaN};
  const dayDiff=(a,b)=>{const x=dateValue(a),y=dateValue(b);return Number.isFinite(x)&&Number.isFinite(y)?Math.round((x-y)/86400000):null};
  const fmt=v=>v==null||!Number.isFinite(Number(v))?"-":Number(v).toLocaleString("ko-KR",{maximumFractionDigits:3});
  const key=r=>clean(r&&(r.workOrder||r.id));
  const meta=(r,m)=>m[key(r)]||m[clean(r&&r.id)]||(r&&r.orderMeta)||{};
  const shownId=(r,m)=>clean(meta(r,m).salesOrderIdOverride)||clean(r&&r.id);
  const orderDateFromId=id=>{let a=clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);if(a)return a[1]+"-"+a[2]+"-"+a[3];a=clean(id).match(/^SO-(\d{2})(\d{2})(\d{2})-/i);return a?"20"+a[1]+"-"+a[2]+"-"+a[3]:""};

  function isDeleted(r,m){
    const id=clean(r&&r.id),wo=key(r),shown=shownId(r,m);
    return delRows().some(x=>{
      const did=clean(x&&x.id),dwo=clean(x&&x.workOrder);
      return (did&&(did===id||did===shown))||(dwo&&wo&&dwo===wo);
    });
  }

  function findShipment(r,m,ships){
    const mm=meta(r,m),id=shownId(r,m),raw=clean(r&&r.id),wo=key(r);
    return (ships||[]).find(s=>{
      const sid=clean(s&&(s.sales||s.salesOrder||s.salesOrderId||s.orderNo));
      const swo=clean(s&&(s.workOrder||s.work_order_no||s.lot));
      return (sid&&(sid===id||sid===raw))||(wo&&swo===wo);
    })||null;
  }

  function batchFor(r,m){
    const db=window.DB||{};
    const mm=meta(r,m),wo=clean(mm.workOrder||r&&r.workOrder);
    const list=Array.isArray(db.batches)?db.batches:[];
    return list.find(b=>wo&&clean(b&&b.no)===wo)||null;
  }

  function docFor(r,m){
    const db=window.DB||{};
    const mm=meta(r,m),wo=clean(mm.workOrder||r&&r.workOrder);
    return wo&&db.woDocs&&db.woDocs[wo]?db.woDocs[wo]:null;
  }

  function inspectionFor(r,m,shipmentDone){
    if(shipmentDone) return "합격";
    const db=window.DB||{},mm=meta(r,m),wo=clean(mm.workOrder||r&&r.workOrder);
    const explicit=clean(mm.inspectionStatus||r&&r.inspectionStatus||r&&r.oqc);
    if(explicit) return explicit;
    const rows=Array.isArray(db.insp&&db.insp.OQC)?db.insp.OQC:[];
    const oqc=rows.filter(x=>wo&&clean(x&&x.lot)===wo);
    if(!oqc.length) return "대기";
    if(oqc.some(x=>/불합격|NG/i.test(clean(x&&x.judge)))) return "불합격";
    if(oqc.every(x=>/합격|OK/i.test(clean(x&&x.judge)))) return "합격";
    return "검사중";
  }

  function currentStock(product,inventory,r,mm){
    const direct=num(mm.currentStock!=null?mm.currentStock:r&&r.currentStock);
    if(direct!=null) return direct;
    const target=compact(product);
    if(!target||target==="-") return null;
    const matches=(inventory||[]).filter(s=>{
      const name=compact(s&&(s.item_name||s.itemName||s.product||s.item_code));
      const cat=clean(s&&s.category).toUpperCase();
      return name===target&&(!cat||cat==="FG"||cat==="WIP");
    });
    if(!matches.length) return null;
    return matches.reduce((sum,s)=>{
      const value=num(s.available_qty!=null?s.available_qty:s.quantity);
      return sum+(value==null?0:value);
    },0);
  }

  function productionState(r,m,shipmentDone){
    if(shipmentDone) return {status:"생산완료",date:""};
    const mm=meta(r,m),batch=batchFor(r,m),doc=docFor(r,m);
    const plan=num(batch&&batch.plan),done=num(batch&&batch.done);
    let status=clean(mm.productionPlanStatus||r&&r.productionStatus||r&&r.plan||doc&&doc.status||batch&&batch.status);
    if(/완료/.test(status)||(plan!=null&&plan>0&&done!=null&&done>=plan)) status="생산완료";
    else if(done!=null&&done>0&&plan!=null&&plan>0) status="생산 "+Math.min(100,Math.round(done/plan*100))+"%";
    else if(/진행|생산중|실적/.test(status)) status="생산진행";
    else if(!status||status==="-") status=(batch||doc)?"생산대기":"생산대기";

    const completed=iso(mm.productionCompletedDate||r&&r.productionCompletedDate||doc&&doc.completedAt);
    const planned=iso(mm.plannedProductionDate||mm.productionPlanDate||r&&r.plannedProductionDate||batch&&batch.due||r&&r.productionDate);
    return {status,date:completed||planned||""};
  }

  function dueInfo(confirmed,actualShipDate,shipmentDone){
    if(!confirmed) return {dday:"-",ddayTone:"gray",delivery:"미확정",deliveryTone:"gray",difference:"-",differenceTone:"gray"};
    const today=new Date().toLocaleDateString("sv-SE");
    if(shipmentDone&&actualShipDate){
      const delta=dayDiff(actualShipDate,confirmed);
      return {
        dday:"완료",ddayTone:"good",
        delivery:delta!=null&&delta<=0?"완료":"지연",
        deliveryTone:delta!=null&&delta<=0?"good":"bad",
        difference:delta==null?"-":(delta>0?"+"+delta+"일":delta+"일"),
        differenceTone:delta!=null&&delta>0?"bad":"good"
      };
    }
    const remain=dayDiff(confirmed,today);
    if(remain==null) return {dday:"-",ddayTone:"gray",delivery:"미확정",deliveryTone:"gray",difference:"-",differenceTone:"gray"};
    if(remain<0) return {dday:"+"+Math.abs(remain)+"일",ddayTone:"bad",delivery:"지연",deliveryTone:"bad",difference:"+"+Math.abs(remain)+"일",differenceTone:"bad"};
    if(remain<=3) return {dday:remain===0?"D-Day":"D-"+remain,ddayTone:"warn",delivery:"주의",deliveryTone:"warn",difference:"0일",differenceTone:"gray"};
    return {dday:"D-"+remain,ddayTone:"good",delivery:"정상",deliveryTone:"good",difference:"0일",differenceTone:"gray"};
  }

  function riskReason(x){
    if(x.delivery==="지연"){
      if(x.shortage!=null&&x.shortage>0) return "원료 부족 · 생산계획 지연";
      if(!/생산완료/.test(x.productionStatus)) return "생산 미완료 · 납기 초과";
      if(!/합격/.test(x.inspectionStatus)) return "검사 미완료 · 출하 지연";
      if(!/출하완료/.test(x.shippingStatus)) return "출하 미완료 · 납기 초과";
      return "납기 초과";
    }
    if(x.delivery==="주의"){
      if(x.shortage!=null&&x.shortage>0) return "재고 부족 · 생산 필요";
      if(!/생산완료/.test(x.productionStatus)) return "생산 진행중 · 납기 임박";
      if(!/합격/.test(x.inspectionStatus)) return "검사 미완료";
      if(!/출하완료/.test(x.shippingStatus)) return "출하 준비 필요";
    }
    return "-";
  }

  function buildRows(rows,inventory){
    const m=metaMap(),ships=shipRows();
    return (Array.isArray(rows)?rows:[]).filter(r=>r&&!isDeleted(r,m)).map(r=>{
      const mm=meta(r,m);
      const id=shownId(r,m);
      const date=iso(mm.orderDate||r&&r.orderDate||r&&r.createdAt)||orderDateFromId(id);
      const customer=clean(mm.customerOverride||r&&r.customer)||"-";
      const product=clean(mm.productOverride||r&&r.product)||"-";
      const quantity=num(mm.qtyOverride!=null?mm.qtyOverride:r&&r.qty)||0;
      const requestedDue=iso(mm.requestedDue||r&&r.due);
      const confirmedDue=iso(mm.confirmedDue||mm.fixedDue||r&&r.confirmedDue||r&&r.fixedDue)||requestedDue;
      const ship=findShipment(r,m,ships);
      const shipStatusRaw=[r&&r.shipping,mm.shippingStatus,ship&&ship.shipping,ship&&ship.delivery,ship&&ship.status].map(clean).join(" ");
      const actualShipDate=iso(mm.actualShipmentDate||r&&r.actualShipmentDate||ship&&ship.actualShipmentDate||ship&&ship.shipDate||ship&&ship.date);
      const shipmentDone=Boolean(actualShipDate)||r&&r.actualShipment===true||mm.actualShipment===true||/출하완료|납품완료|배송완료|출고완료/.test(shipStatusRaw);
      const prod=productionState(r,m,shipmentDone);
      const inspection=inspectionFor(r,m,shipmentDone);
      const shippingStatus=shipmentDone?"출하완료":(clean(mm.shippingStatus||r&&r.shipping||ship&&ship.status||ship&&ship.delivery)||"출하대기").replace(/^[-]$/,"출하대기");
      const stock=currentStock(product,inventory,r,mm);
      const shortage=stock==null?null:Math.max(0,quantity-stock);
      const due=dueInfo(confirmedDue,actualShipDate,shipmentDone);
      const out={
        row:r,id,date,customer,product,quantity,unit:clean(r&&r.unit)||"kg",
        requestedDue,confirmedDue,dday:due.dday,ddayTone:due.ddayTone,
        stock,shortage,productionDate:prod.date,productionStatus:prod.status,
        inspectionStatus:inspection,actualShipDate,shippingStatus,
        delivery:due.delivery,deliveryTone:due.deliveryTone,
        difference:due.difference,differenceTone:due.differenceTone,
        shipQty:num(ship&&(ship.qty!=null?ship.qty:ship.quantity))
      };
      out.reason=riskReason(out);
      out.otif=shipmentDone&&actualShipDate&&confirmedDue&&dayDiff(actualShipDate,confirmedDue)<=0&&(out.shipQty==null||out.shipQty>=quantity);
      out.shipmentDone=shipmentDone;
      return out;
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id),undefined,{numeric:true}));
  }

  function toneForStatus(v){
    const s=clean(v);
    if(/불합격|지연|차단|위험/.test(s)) return "bad";
    if(/주의|대기|미착수|미완료/.test(s)) return "warn";
    if(/진행|계획|예정|생산 \d+%/.test(s)) return "blue";
    if(/합격|완료|정상/.test(s)) return "good";
    return "gray";
  }

  function Badge({text,tone}){return h("span",{className:"qsd-badge "+(tone||toneForStatus(text))},text||"-")}

  function Kpi({label,value,sub,tone}){
    return h("div",{className:"qsd-kpi "+(tone||"")},
      h("span",null,label),
      h("strong",null,value),
      h("small",null,sub)
    );
  }

  function SalesDeliveryDashboard(){
    const [rows,setRows]=useState(()=>localRows());
    const [inventory,setInventory]=useState([]);
    const yearEnd=String(new Date().getFullYear())+"-12-31";
    const [from,setFrom]=useState("2025-01-01");
    const [to,setTo]=useState(yearEnd);
    const [customerFilter,setCustomerFilter]=useState("");
    const [productFilter,setProductFilter]=useState("");
    const [progressFilter,setProgressFilter]=useState("전체");
    const [dueFilter,setDueFilter]=useState("전체");
    const [q,setQ]=useState("");
    const [applied,setApplied]=useState({
      from:"2025-01-01",to:yearEnd,customer:"",product:"",progress:"전체",due:"전체",q:""
    });
    const [page,setPage]=useState(1);

    const refresh=async()=>{
      let next=localRows();
      if(typeof window.qmesSyncList==="function"){
        try{
          const records=await window.qmesSyncList("inventory");
          const found=(Array.isArray(records)?records:[]).find(r=>clean(r&&r.record_key)==="erp:sales");
          let payload=found&&found.payload;
          if(typeof payload==="string"){try{payload=JSON.parse(payload)}catch(_){payload=null}}
          if(payload&&Array.isArray(payload.rows)&&payload.rows.length) next=payload.rows;
        }catch(_){}
      }
      setRows(next);
      try{
        const response=await fetch("/api/inventory/stock",{credentials:"same-origin",cache:"no-store"});
        const payload=await response.json();
        if(response.ok&&payload&&payload.success&&Array.isArray(payload.data)) setInventory(payload.data);
        else if(response.ok&&Array.isArray(payload)) setInventory(payload);
      }catch(_){}
    };

    useEffect(()=>{
      refresh();
      const onData=()=>refresh();
      const onStorage=e=>{if([SALES,META,SHIPPING,DELETED].includes(e.key))refresh()};
      window.addEventListener("qmes:erp-data-changed",onData);
      window.addEventListener("qmes:data-updated",onData);
      window.addEventListener("qmes:shared-sync-complete",onData);
      window.addEventListener("storage",onStorage);
      return()=>{
        window.removeEventListener("qmes:erp-data-changed",onData);
        window.removeEventListener("qmes:data-updated",onData);
        window.removeEventListener("qmes:shared-sync-complete",onData);
        window.removeEventListener("storage",onStorage);
      };
    },[]);

    const all=useMemo(()=>buildRows(rows,inventory),[rows,inventory]);
    const progressOf=x=>{
      if(/출하완료/.test(x.shippingStatus)) return "출하완료";
      if(/출하/.test(x.shippingStatus)&&!/대기|미계획/.test(x.shippingStatus)) return "출하진행";
      if(/생산완료/.test(x.productionStatus)) return "생산완료";
      if(/진행|생산\s*\d+%/.test(x.productionStatus)) return "생산진행";
      return "생산대기";
    };
    const customers=useMemo(()=>[...new Set(all.map(x=>x.customer).filter(v=>v&&v!=="-"))].sort((a,b)=>a.localeCompare(b,"ko")),[all]);
    const data=useMemo(()=>{
      const qq=clean(applied.q).toLowerCase();
      const pq=clean(applied.product).toLowerCase();
      return all.filter(x=>{
        if(applied.from&&x.date&&x.date<applied.from) return false;
        if(applied.to&&x.date&&x.date>applied.to) return false;
        if(applied.customer&&x.customer!==applied.customer) return false;
        if(pq&&!x.product.toLowerCase().includes(pq)) return false;
        if(applied.progress!=="전체"&&progressOf(x)!==applied.progress) return false;
        if(applied.due!=="전체"&&x.delivery!==applied.due) return false;
        if(qq&&!([
          x.id,x.date,x.customer,x.product,x.requestedDue,x.confirmedDue,
          x.productionStatus,x.inspectionStatus,x.shippingStatus,x.delivery,x.reason
        ].join(" ").toLowerCase().includes(qq))) return false;
        return true;
      });
    },[all,applied]);
    const pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));
    const activePage=Math.min(page,pages);
    const shown=data.slice((activePage-1)*PAGE_SIZE,activePage*PAGE_SIZE);

    useEffect(()=>{if(page>pages)setPage(pages)},[pages]);

    const normal=data.filter(x=>x.delivery==="정상"||x.delivery==="완료").length;
    const caution=data.filter(x=>x.delivery==="주의").length;
    const risk=data.filter(x=>x.delivery==="지연").length;
    const unconfirmed=data.filter(x=>!x.confirmedDue).length;
    const completed=data.filter(x=>x.shipmentDone&&x.actualShipDate&&x.confirmedDue);
    const ontime=completed.filter(x=>x.otif).length;
    const otif=completed.length?((ontime/completed.length)*100).toFixed(1)+"%":"-";

    const openDetail=id=>{
      if(window.qmesSalesDetailConsistency&&typeof window.qmesSalesDetailConsistency.open==="function") window.qmesSalesDetailConsistency.open(id);
      else if(window.qmesSalesOrderDetail&&typeof window.qmesSalesOrderDetail.open==="function") window.qmesSalesOrderDetail.open(id);
    };
    const openEdit=x=>window.qmesSalesEditDirectV18?.open?.(x.row);
    const openNew=()=>window.qmesSalesNewOrderIntegratedV11?.open?.();

    const applyFilters=()=>{
      setApplied({from,to,customer:customerFilter,product:productFilter,progress:progressFilter,due:dueFilter,q});
      setPage(1);
    };
    const resetFilters=()=>{
      const y=String(new Date().getFullYear())+"-12-31";
      setFrom("2025-01-01");setTo(y);setCustomerFilter("");setProductFilter("");
      setProgressFilter("전체");setDueFilter("전체");setQ("");
      setApplied({from:"2025-01-01",to:y,customer:"",product:"",progress:"전체",due:"전체",q:""});
      setPage(1);
    };
    const customerOptions=[h("option",{key:"all",value:""},"전체")].concat(customers.map(v=>h("option",{key:v,value:v},v)));
    const progressOptions=["전체","생산대기","생산진행","생산완료","출하진행","출하완료"].map(v=>h("option",{key:v,value:v},v));
    const dueOptions=["전체","정상","주의","지연","미확정","완료"].map(v=>h("option",{key:v,value:v},v));

    const body=shown.length?shown.map((x,i)=>h("tr",{key:x.id},
      h("td",null,String((activePage-1)*PAGE_SIZE+i+1)),
      h("td",null,h("button",{className:"qrl-link",type:"button",onClick:()=>openDetail(x.id)},x.date||"-")),
      h("td",null,h("button",{className:"qrl-link",type:"button",onClick:()=>openDetail(x.id)},x.id||"-")),
      h("td",{title:x.customer},x.customer),
      h("td",{className:"left",title:x.product},x.product),
      h("td",{className:"num"},fmt(x.quantity)),
      h("td",null,x.unit),
      h("td",null,x.requestedDue||"-"),
      h("td",null,x.confirmedDue||"-"),
      h("td",{className:"qsd-dday "+x.ddayTone},x.dday),
      h("td",{className:"num"},fmt(x.stock)),
      h("td",{className:x.shortage!=null&&x.shortage>0?"num qsd-shortage":"num"},fmt(x.shortage)),
      h("td",null,x.productionDate||"-"),
      h("td",null,h(Badge,{text:x.productionStatus})),
      h("td",null,h(Badge,{text:x.inspectionStatus})),
      h("td",null,x.actualShipDate||"-"),
      h("td",null,h(Badge,{text:x.shippingStatus})),
      h("td",null,h(Badge,{text:x.delivery,tone:x.deliveryTone})),
      h("td",{className:"qsd-delay "+x.differenceTone},x.difference),
      h("td",{className:"left",title:x.reason},x.reason),
      h("td",null,h("span",{className:"qrl-actions"},
        h("button",{type:"button",onClick:()=>openDetail(x.id)},"상세"),
        h("button",{type:"button",onClick:()=>openEdit(x)},"수정")
      ))
    )):[h("tr",{key:"empty"},h("td",{colSpan:21,className:"qsd-empty"},"등록된 수주 데이터가 없습니다."))];

    return h("div",{className:"qmes-sales-ledger-v4 qmes-sales-delivery-dashboard-v1 qmes-sales-delivery-dashboard-v2"},
      h("div",{className:"qslv4-head"},
        h("div",null,
          h("h1",{className:"qslv4-title"},"수주·납기 관리대장")
        ),
        h("div",{className:"qslv4-head-actions"},
          h("span",{className:"qslv4-sync"},"공용 DB 연동"),
          h("button",{id:"qmes-sales-progress-button-20260826",type:"button",onClick:()=>data[0]&&openDetail(data[0].id)},"수주 진행현황"),
          h("button",{type:"button",className:"qslv4-new-btn",onClick:openNew},"+ 신규 수주")
        )
      ),

      h("div",{className:"qrl-filter"},
        h("div",{className:"qrl-grid"},
          h("label",{className:"qrl-field"},
            h("span",null,"기간"),
            h("span",{className:"qrl-date"},
              h("input",{type:"date",value:from,onChange:e=>setFrom(e.target.value)}),
              h("b",null,"~"),
              h("input",{type:"date",value:to,onChange:e=>setTo(e.target.value)})
            )
          ),
          h("label",{className:"qrl-field"},h("span",null,"거래처"),h("select",{value:customerFilter,onChange:e=>setCustomerFilter(e.target.value)},customerOptions)),
          h("label",{className:"qrl-field"},h("span",null,"품목명"),h("input",{value:productFilter,onChange:e=>setProductFilter(e.target.value),placeholder:"품목명 또는 규격 입력"})),
          h("label",{className:"qrl-field"},h("span",null,"진행상태"),h("select",{value:progressFilter,onChange:e=>setProgressFilter(e.target.value)},progressOptions)),
          h("label",{className:"qrl-field"},h("span",null,"납기상태"),h("select",{value:dueFilter,onChange:e=>setDueFilter(e.target.value)},dueOptions)),
          h("label",{className:"qrl-field"},h("span",null,"통합검색"),h("input",{value:q,onChange:e=>setQ(e.target.value),onKeyDown:e=>{if(e.key==="Enter")applyFilters()},placeholder:"수주번호, 거래처명, 품목명 등 검색"})),
          h("button",{type:"button",className:"primary",onClick:applyFilters},"조회"),
          h("button",{type:"button",onClick:resetFilters},"초기화")
        )
      ),

      h("div",{className:"qsd-kpis"},
        h(Kpi,{label:"전체 수주",value:String(data.length),sub:"조회기간 기준"}),
        h(Kpi,{label:"정상 납기",value:String(normal),sub:"요청납기 내 가능",tone:"good"}),
        h(Kpi,{label:"주의",value:String(caution),sub:"D-3 / 생산·검사 미완료",tone:"warn"}),
        h(Kpi,{label:"지연 위험",value:String(risk),sub:"확정납기 > 요청납기",tone:"bad"}),
        h(Kpi,{label:"납기 미확정",value:String(unconfirmed),sub:"확정납기 산출 필요",tone:"dark"}),
        h(Kpi,{label:"OTIF (On Time In Full)",value:otif,sub:"정시·정량 출하율",tone:"good"})
      ),

      h("div",{className:"qsd-legend"},
        h("div",null,h("b",null,"납기 자동판정 기준")," · 정상: 확정납기 ≤ 요청납기 · 주의: D-3 이내 생산/검사 미완료 · 지연: 납기 초과"),
        h("div",{className:"qsd-note"},"※ 완료 수주는 실제출하일 기준으로 지연여부 확인")
      ),

      h("div",{className:"qsd-table-shell"},
        h("table",{className:"qsd-table"},
          h("thead",null,h("tr",null,
            ["No","수주일 ↓","수주번호","거래처명","품목명 (규격)","수주수량","단위","요청납기","확정납기","D-Day","현재고","부족수량","생산예정/완료일","생산상태","검사상태","실제출하일","출하상태","납기상태","납기차이","지연/위험 사유","관리"].map(v=>h("th",{key:v},v))
          )),
          h("tbody",null,body)
        ),
        h("div",{className:"qrl-foot"},
          Array.from({length:pages},(_,i)=>h("button",{key:i+1,type:"button",className:"qrl-page "+(i+1===activePage?"active":""),onClick:()=>setPage(i+1)},String(i+1)))
        )
      )
    );
  }

  window.__QMES_CURRENT_SALES_LEDGER_COMPONENT__=SalesDeliveryDashboard;
  window.QMESErpSalesTab=SalesDeliveryDashboard;
  window.dispatchEvent(new CustomEvent("qmes:erp-integrated-ready"));
})();