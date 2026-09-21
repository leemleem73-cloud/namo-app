/* NAMO QMES - Sales/Due stable synchronous React owner V5
 * 2026-09-18
 * ADD-ONLY.
 * Plain JavaScript (no Babel delay). Registers before router/app mount.
 * No MutationObserver, no delayed reinstall, no DOM replacement loop.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_REACT_LEDGER_OWNER_V5_NO3_20260918__) return;
  window.__QMES_SALES_REACT_LEDGER_OWNER_V5_NO3_20260918__=true;

  const ReactRef=window.React;
  if(!ReactRef) return;
  const h=ReactRef.createElement;
  const {useEffect,useMemo,useRef,useState}=ReactRef;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const SHIPPING="qmes-erp-shipping-v1";
  const DELETED="qmes-sales-deleted-v1";
  const PAGE_SIZE=10;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0};
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const metaMap=()=>{const v=read(META,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
  const shipRows=()=>{const v=read(SHIPPING,[]);return Array.isArray(v)?v:[]};
  const delRows=()=>{const v=read(DELETED,[]);return Array.isArray(v)?v:[]};
  const localRows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const key=r=>clean(r&&(r.workOrder||r.id));
  const meta=(r,m=metaMap())=>m[key(r)]||m[clean(r&&r.id)]||(r&&r.orderMeta)||{};
  const shownId=(r,m=metaMap())=>clean(meta(r,m).salesOrderIdOverride)||clean(r&&r.id);
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?m[1]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[3]).padStart(2,"0"):""};
  const orderDateFromId=id=>{const a=clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);if(a)return a[1]+"-"+a[2]+"-"+a[3];const b=clean(id).match(/^SO-(\d{2})(\d{2})(\d{2})-/i);return b?"20"+b[1]+"-"+b[2]+"-"+b[3]:""};
  const fmt=v=>Number(v||0).toLocaleString("ko-KR",{maximumFractionDigits:3});

  function isDeleted(r,m){
    const id=clean(r&&r.id),wo=key(r),shown=shownId(r,m);
    return delRows().some(x=>{
      const did=clean(x&&x.id),dwo=clean(x&&x.workOrder);
      return (did&&(did===id||did===shown))||(dwo&&wo&&dwo===wo);
    });
  }
  function orderDate(r,m){const mm=meta(r,m);return iso(mm.orderDate||r&&r.orderDate||r&&r.productionDate||r&&r.createdAt)||orderDateFromId(shownId(r,m))}
  function customer(r,m){const mm=meta(r,m);return clean(mm.customerOverride)||clean(r&&r.customer)||"-"}
  function product(r,m){const mm=meta(r,m);return clean(mm.productOverride)||clean(r&&r.product)||"-"}
  function qty(r,m){const mm=meta(r,m);return num(mm.qtyOverride!=null?mm.qtyOverride:r&&r.qty)}
  function due(r,m){const mm=meta(r,m);return iso(mm.requestedDue||r&&r.due)}

  function shipped(r,m,ships){
    const mm=meta(r,m),id=shownId(r,m),raw=clean(r&&r.id),wo=key(r);
    const status=[r&&r.shipping,mm.shippingStatus].map(clean).join(" ");
    if((r&&r.actualShipment===true)||mm.actualShipment===true||/출하완료|납품완료|배송완료|출고완료/.test(status)) return true;
    return (ships||[]).some(s=>{
      const sid=clean(s&&(s.sales||s.salesOrder||s.salesOrderId)),swo=clean(s&&(s.workOrder||s.lot));
      const st=[s&&s.shipping,s&&s.delivery,s&&s.status].map(clean).join(" ");
      return ((sid&&(sid===id||sid===raw))||(wo&&swo===wo))&&((s&&s.actualShipment===true)||/출하완료|납품완료|배송완료|출고완료/.test(st));
    });
  }
  function production(r,m,done){
    if(done)return "생산완료";
    const mm=meta(r,m),raw=clean(mm.productionPlanStatus)||clean(r&&r.plan);
    if(/완료/.test(raw))return "생산완료";
    if(/생산중|진행/.test(raw))return "생산진행";
    if(clean(r&&r.workOrder)||clean(mm.workOrder))return "생산진행";
    return raw||"생산대기";
  }
  function shipping(r,m,done){
    if(done)return "출하완료";
    const mm=meta(r,m),raw=clean(mm.shippingStatus)||clean(r&&r.shipping);
    return raw&&raw!=="-"?raw:"출하대기";
  }
  function dueState(r,m,done){
    const d=due(r,m);
    if(done)return {label:"완료",tone:"good",bucket:"완료"};
    if(!d)return {label:"-",tone:"gray",bucket:"기타"};
    const days=Math.ceil((new Date(d+"T23:59:59").getTime()-Date.now())/86400000);
    if(days<0)return {label:"지연 "+Math.abs(days)+"일",tone:"bad",bucket:"지연"};
    if(days<=7)return {label:"임박 D-"+days,tone:"warn",bucket:"임박"};
    return {label:"정상",tone:"good",bucket:"정상"};
  }
  function progress(prod,ship){
    if(/출하완료/.test(ship))return "출하완료";
    if(/출하/.test(ship)&&!/대기/.test(ship))return "출하진행";
    if(/생산완료/.test(prod))return "생산완료";
    if(/진행/.test(prod))return "생산진행";
    return "생산대기";
  }
  function buildRows(rows){
    const m=metaMap(),ships=shipRows();
    return (Array.isArray(rows)?rows:[]).filter(r=>r&&!isDeleted(r,m)).map(r=>{
      const done=shipped(r,m,ships),prod=production(r,m,done),ship=shipping(r,m,done),ds=dueState(r,m,done);
      return {row:r,id:shownId(r,m),date:orderDate(r,m),customer:customer(r,m),product:product(r,m),qty:qty(r,m),unit:"kg",due:due(r,m),dueState:ds,production:prod,shipping:ship,progress:progress(prod,ship)};
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id),undefined,{numeric:true}));
  }

  function Badge(props){
    return h("span",{className:"qrl-badge "+props.tone},props.text);
  }

  const pad2=n=>String(n).padStart(2,"0");
  function qrlDateParts(value){
    const m=clean(value).match(/^(20\\d{2})-(\\d{2})-(\\d{2})$/);
    const now=new Date();
    return m?{y:Number(m[1]),m:Number(m[2]),d:Number(m[3])}:{y:now.getFullYear(),m:now.getMonth()+1,d:now.getDate()};
  }
  function qrlDateValue(y,m,d){
    const max=new Date(y,m,0).getDate();
    return y+"-"+pad2(m)+"-"+pad2(Math.min(Math.max(1,d),max));
  }
  function qrlMonthValue(value){
    const p=qrlDateParts(value);
    return p.y+"-"+pad2(p.m);
  }
  function qrlShiftMonth(value,delta){
    const m=clean(value).match(/^(20\\d{2})-(\\d{2})$/);
    const base=m?new Date(Number(m[1]),Number(m[2])-1,1):new Date();
    base.setMonth(base.getMonth()+delta);
    return base.getFullYear()+"-"+pad2(base.getMonth()+1);
  }
  function qrlMonthParts(value){
    const m=clean(value).match(/^(20\\d{2})-(\\d{2})$/);
    const now=new Date();
    return m?{y:Number(m[1]),m:Number(m[2])}:{y:now.getFullYear(),m:now.getMonth()+1};
  }

  function QrlCalendarPane(props){
    const vm=qrlMonthParts(props.view);
    const first=new Date(vm.y,vm.m-1,1);
    const start=new Date(vm.y,vm.m-1,1-first.getDay());
    const today=(()=>{const d=new Date();return qrlDateValue(d.getFullYear(),d.getMonth()+1,d.getDate())})();
    const years=Array.from({length:16},(_,i)=>2022+i);
    const months=Array.from({length:12},(_,i)=>i+1);

    const cells=Array.from({length:42},(_,i)=>{
      const d=new Date(start);
      d.setDate(start.getDate()+i);
      const value=qrlDateValue(d.getFullYear(),d.getMonth()+1,d.getDate());
      const outside=d.getMonth()+1!==vm.m;
      const dow=d.getDay();
      const inRange=props.from&&props.to&&value>=props.from&&value<=props.to;
      const selected=value===props.from||value===props.to;
      const cls=[
        "qrl-range-day",
        outside?"other":"",
        dow===0?"sun":"",
        dow===6?"sat":"",
        inRange?"in-range":"",
        selected?"selected":"",
        value===today?"today":""
      ].filter(Boolean).join(" ");
      return h("button",{
        key:value+"-"+i,
        type:"button",
        className:cls,
        onClick:()=>{
          if(props.side==="from"){
            props.setFrom(value);
            if(!props.to||value>props.to) props.setTo(value);
          }else{
            props.setTo(value);
            if(!props.from||value<props.from) props.setFrom(value);
          }
          if(outside) props.setView(qrlMonthValue(value));
        }
      },String(d.getDate()));
    });

    return h("div",{className:"qrl-range-pane"},
      h("div",{className:"qrl-range-pane-head"},
        h("button",{type:"button",className:"qrl-range-nav",onClick:()=>props.setView(qrlShiftMonth(props.view,-1))},"‹"),
        h("div",{className:"qrl-range-pane-selects"},
          h("select",{value:String(vm.y),onChange:e=>props.setView(e.target.value+"-"+pad2(vm.m))},
            years.map(y=>h("option",{key:y,value:String(y)},String(y)))
          ),
          h("select",{value:pad2(vm.m),onChange:e=>props.setView(vm.y+"-"+e.target.value)},
            months.map(m=>h("option",{key:m,value:pad2(m)},pad2(m)))
          )
        ),
        h("button",{type:"button",className:"qrl-range-nav",onClick:()=>props.setView(qrlShiftMonth(props.view,1))},"›")
      ),
      h("div",{className:"qrl-range-week"},
        ["일","월","화","수","목","금","토"].map((v,i)=>h("span",{key:v,className:i===0?"sun":i===6?"sat":""},v))
      ),
      h("div",{className:"qrl-range-days"},cells),
      h("button",{type:"button",className:"qrl-range-today",onClick:()=>{
        const d=new Date(),v=qrlDateValue(d.getFullYear(),d.getMonth()+1,d.getDate());
        if(props.side==="from"){props.setFrom(v);if(!props.to||v>props.to)props.setTo(v);}
        else{props.setTo(v);if(!props.from||v<props.from)props.setFrom(v);}
        props.setView(qrlMonthValue(v));
      }},"오늘")
    );
  }

  function QrlFixedRangeField(props){
    const rootRef=useRef(null);
    const [open,setOpen]=useState(false);
    const [leftView,setLeftView]=useState(()=>qrlMonthValue(props.from));
    const [rightView,setRightView]=useState(()=>{
      const a=qrlMonthValue(props.from),b=qrlMonthValue(props.to);
      return b>a?b:qrlShiftMonth(a,1);
    });
    const fp=qrlDateParts(props.from),tp=qrlDateParts(props.to);
    const years=Array.from({length:16},(_,i)=>2022+i);
    const months=Array.from({length:12},(_,i)=>i+1);

    useEffect(()=>{
      if(!open)return;
      const onDown=e=>{
        if(rootRef.current&&!rootRef.current.contains(e.target))setOpen(false);
      };
      document.addEventListener("pointerdown",onDown,true);
      return()=>document.removeEventListener("pointerdown",onDown,true);
    },[open]);

    const updatePart=(side,part,value)=>{
      const src=side==="from"?qrlDateParts(props.from):qrlDateParts(props.to);
      let y=src.y,m=src.m,d=src.d;
      if(part==="y")y=Number(value);
      if(part==="m")m=Number(value);
      if(part==="d")d=Number(value);
      const next=qrlDateValue(y,m,d);
      if(side==="from"){
        props.setFrom(next);
        if(!props.to||next>props.to)props.setTo(next);
        setLeftView(qrlMonthValue(next));
      }else{
        props.setTo(next);
        if(!props.from||next<props.from)props.setFrom(next);
        setRightView(qrlMonthValue(next));
      }
    };

    const dayOptions=p=>Array.from({length:new Date(p.y,p.m,0).getDate()},(_,i)=>i+1);
    const openCalendar=()=>{
      const l=qrlMonthValue(props.from),r=qrlMonthValue(props.to);
      setLeftView(l);
      setRightView(r>l?r:qrlShiftMonth(l,1));
      setOpen(v=>!v);
    };

    return h("label",{className:"qrl-field qrl-period-field",ref:rootRef},
      h("span",null,"기간"),
      h("div",{className:"qrl-fixed-range"},
        h("button",{type:"button",className:"qrl-range-direct",onClick:()=>setOpen(false)},"직접 입력"),
        h("div",{className:"qrl-range-dateparts"},
          h("select",{value:String(fp.y),onChange:e=>updatePart("from","y",e.target.value)},years.map(y=>h("option",{key:y,value:String(y)},String(y)))),
          h("span",{className:"qrl-range-slash"},"/"),
          h("select",{value:pad2(fp.m),onChange:e=>updatePart("from","m",e.target.value)},months.map(m=>h("option",{key:m,value:pad2(m)},pad2(m)))),
          h("span",{className:"qrl-range-slash"},"/"),
          h("select",{value:pad2(fp.d),onChange:e=>updatePart("from","d",e.target.value)},dayOptions(fp).map(d=>h("option",{key:d,value:pad2(d)},pad2(d)))),
          h("span",{className:"qrl-range-tilde"},"~"),
          h("select",{value:String(tp.y),onChange:e=>updatePart("to","y",e.target.value)},years.map(y=>h("option",{key:y,value:String(y)},String(y)))),
          h("span",{className:"qrl-range-slash"},"/"),
          h("select",{value:pad2(tp.m),onChange:e=>updatePart("to","m",e.target.value)},months.map(m=>h("option",{key:m,value:pad2(m)},pad2(m)))),
          h("span",{className:"qrl-range-slash"},"/"),
          h("select",{value:pad2(tp.d),onChange:e=>updatePart("to","d",e.target.value)},dayOptions(tp).map(d=>h("option",{key:d,value:pad2(d)},pad2(d))))
        ),
        h("button",{type:"button",className:"qrl-range-calendar-button","aria-label":"기간 달력 열기",onClick:openCalendar},"▣")
      ),
      open?h("div",{className:"qrl-range-popup",role:"dialog","aria-label":"기간 선택 달력"},
        h(QrlCalendarPane,{side:"from",view:leftView,setView:setLeftView,from:props.from,to:props.to,setFrom:props.setFrom,setTo:props.setTo}),
        h("div",{className:"qrl-range-divider"}),
        h(QrlCalendarPane,{side:"to",view:rightView,setView:setRightView,from:props.from,to:props.to,setFrom:props.setFrom,setTo:props.setTo})
      ):null
    );
  }

  function StableSalesLedgerV5No3(){
    const [rows,setRows]=useState(()=>localRows());
    const [from,setFrom]=useState("2025-01-01");
    const [to,setTo]=useState(String(new Date().getFullYear())+"-12-31");
    const [customerFilter,setCustomerFilter]=useState("");
    const [productFilter,setProductFilter]=useState("");
    const [progressFilter,setProgressFilter]=useState("전체");
    const [dueFilter,setDueFilter]=useState("전체");
    const [q,setQ]=useState("");
    const [applied,setApplied]=useState({from:"2025-01-01",to:String(new Date().getFullYear())+"-12-31",customer:"",product:"",progress:"전체",due:"전체",q:""});
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

    const all=useMemo(()=>buildRows(rows),[rows]);
    const customers=useMemo(()=>[...new Set(all.map(x=>x.customer).filter(v=>v&&v!=="-"))].sort((a,b)=>a.localeCompare(b,"ko")),[all]);
    const data=useMemo(()=>{
      const qq=clean(applied.q).toLowerCase(),pq=clean(applied.product).toLowerCase();
      return all.filter(x=>{
        if(applied.from&&x.date&&x.date<applied.from)return false;
        if(applied.to&&x.date&&x.date>applied.to)return false;
        if(applied.customer&&x.customer!==applied.customer)return false;
        if(pq&&!x.product.toLowerCase().includes(pq))return false;
        if(applied.progress!=="전체"&&x.progress!==applied.progress)return false;
        if(applied.due!=="전체"&&x.dueState.bucket!==applied.due)return false;
        if(qq&&!([x.id,x.date,x.customer,x.product,x.due,x.production,x.shipping].join(" ").toLowerCase().includes(qq)))return false;
        return true;
      });
    },[all,applied]);

    const pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));
    const activePage=Math.min(page,pages);
    const shown=data.slice((activePage-1)*PAGE_SIZE,activePage*PAGE_SIZE);

    const apply=()=>{
      setApplied({from,to,customer:customerFilter,product:productFilter,progress:progressFilter,due:dueFilter,q});
      setPage(1);
    };
    const reset=()=>{
      const y=String(new Date().getFullYear())+"-12-31";
      setFrom("2025-01-01");setTo(y);setCustomerFilter("");setProductFilter("");
      setProgressFilter("전체");setDueFilter("전체");setQ("");
      setApplied({from:"2025-01-01",to:y,customer:"",product:"",progress:"전체",due:"전체",q:""});
      setPage(1);
    };
    const openDetail=id=>{
      if(window.qmesSalesDetailConsistency&&typeof window.qmesSalesDetailConsistency.open==="function") window.qmesSalesDetailConsistency.open(id);
      else if(window.qmesSalesOrderDetail&&typeof window.qmesSalesOrderDetail.open==="function") window.qmesSalesOrderDetail.open(id);
    };
    const openEdit=x=>window.qmesSalesEditDirectV18&&window.qmesSalesEditDirectV18.open&&window.qmesSalesEditDirectV18.open(x.row);
    const openNew=()=>window.qmesSalesNewOrderIntegratedV11&&window.qmesSalesNewOrderIntegratedV11.open&&window.qmesSalesNewOrderIntegratedV11.open();

    const customerOptions=[h("option",{key:"all",value:""},"전체")].concat(customers.map(v=>h("option",{key:v,value:v},v)));
    const progressOptions=["전체","생산대기","생산진행","생산완료","출하진행","출하완료"].map(v=>h("option",{key:v,value:v},v));
    const dueOptions=["전체","정상","임박","지연","완료"].map(v=>h("option",{key:v,value:v},v));

    const rowNodes=shown.length?shown.map((x,i)=>h("tr",{key:x.id},
      h("td",{className:"qrl-no"},String((activePage-1)*PAGE_SIZE+i+1)),
      h("td",null,h("button",{className:"qrl-link",onClick:()=>openDetail(x.id)},x.date||"-")),
      h("td",null,h("button",{className:"qrl-link",onClick:()=>openDetail(x.id)},x.id||"-")),
      h("td",{className:"left",title:x.customer},x.customer),
      h("td",{className:"left",title:x.product},x.product),
      h("td",{className:"num"},fmt(x.qty)),
      h("td",null,x.unit),
      h("td",null,x.due||"-"),
      h("td",null,h(Badge,{text:x.dueState.label,tone:x.dueState.tone})),
      h("td",null,h(Badge,{text:x.production,tone:/완료/.test(x.production)?"good":/진행/.test(x.production)?"blue":"gray"})),
      h("td",null,h(Badge,{text:x.shipping,tone:/완료/.test(x.shipping)?"good":/진행|예정/.test(x.shipping)?"blue":"gray"})),
      h("td",null,h("span",{className:"qrl-actions"},
        h("button",{type:"button",onClick:()=>openDetail(x.id)},"상세"),
        h("button",{type:"button",onClick:()=>openEdit(x)},"수정")
      ))
    )):[h("tr",{key:"empty"},h("td",{colSpan:12,className:"qrl-empty"},"조회 조건에 해당하는 수주가 없습니다."))];

    return h("div",{className:"qmes-sales-ledger-v4"},
      h("div",{className:"qslv4-head"},
        h("div",null,
          h("h1",{className:"qslv4-title"},"수주·납기 관리대장"),
          h("div",{className:"qslv4-sub"},"총 "+data.length+"건")
        ),
        h("div",{className:"qslv4-head-actions"},
          h("span",{className:"qslv4-sync"},"공용 DB 연동"),
          h("button",{id:"qmes-sales-progress-button-20260826",type:"button",onClick:()=>data[0]&&openDetail(data[0].id)},"수주 진행현황"),
          h("button",{type:"button",className:"qslv4-new-btn",onClick:openNew},"+ 신규 수주")
        )
      ),
      h("div",{className:"qrl-filter"},
        h("div",{className:"qrl-grid"},
          h(QrlFixedRangeField,{from,to,setFrom,setTo}),
          h("label",{className:"qrl-field"},h("span",null,"거래처"),h("select",{value:customerFilter,onChange:e=>setCustomerFilter(e.target.value)},customerOptions)),
          h("label",{className:"qrl-field"},h("span",null,"품목명"),h("input",{value:productFilter,onChange:e=>setProductFilter(e.target.value),placeholder:"품목명 또는 규격 입력"})),
          h("label",{className:"qrl-field"},h("span",null,"진행상태"),h("select",{value:progressFilter,onChange:e=>setProgressFilter(e.target.value)},progressOptions)),
          h("label",{className:"qrl-field"},h("span",null,"납기상태"),h("select",{value:dueFilter,onChange:e=>setDueFilter(e.target.value)},dueOptions)),
          h("label",{className:"qrl-field"},h("span",null,"통합검색"),h("input",{value:q,onChange:e=>setQ(e.target.value),onKeyDown:e=>{if(e.key==="Enter")apply()},placeholder:"수주번호, 거래처명, 품목명 등 검색"})),
          h("button",{type:"button",className:"primary",onClick:apply},"⌕ 조회"),
          h("button",{type:"button",onClick:reset},"↻ 초기화")
        )
      ),
      h("div",{className:"qrl-list"},
        h("div",{className:"qrl-wrap"},
          h("table",null,
            h("thead",null,h("tr",null,
              ["No","수주일 ↓","수주번호","거래처명","품목명 (규격)","수주수량","단위","요청납기","납기상태","생산상태","출하상태","관리"].map(v=>h("th",{key:v},v))
            )),
            h("tbody",null,rowNodes)
          )
        ),
        h("div",{className:"qrl-foot"},
          Array.from({length:pages},(_,i)=>h("button",{key:i+1,type:"button",className:"qrl-page "+(i+1===activePage?"active":""),onClick:()=>setPage(i+1)},String(i+1)))
        )
      )
    );
  }

  window.QMESErpSalesTab=StableSalesLedgerV5No3;
  window.dispatchEvent(new CustomEvent("qmes:erp-integrated-ready"));
})();