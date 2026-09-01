/* QMES ERP integrated modules — sales / MRP / purchase / Recipe-BOM / shipping */
(function(){
  if(window.__QMES_ERP_INTEGRATED_20260826__) return;
  window.__QMES_ERP_INTEGRATED_20260826__=true;

  const ERP_SYNC_TYPE="inventory";
  const ERP_PREFIX="erp:";
  const ReactRef=window.React;
  if(!ReactRef) return;

  const {useEffect,useMemo,useState}=ReactRef;

  function currentUserName(){
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return String(user?.name||user?.uid||user||"").trim();
  }

  function recordPayload(record){
    const value=record?.payload;
    if(value&&typeof value==="object") return value;
    if(typeof value==="string"){
      try{return JSON.parse(value);}catch(_error){return {};}
    }
    return {};
  }

  function clone(value){
    try{return JSON.parse(JSON.stringify(value));}catch(_error){return value;}
  }

  function localKey(kind){return `qmes-erp-${kind}-v1`;}

  function readLocal(kind,fallback){
    try{
      const saved=JSON.parse(localStorage.getItem(localKey(kind))||"null");
      return Array.isArray(saved)?saved:clone(fallback);
    }catch(_error){return clone(fallback);}
  }

  function writeLocal(kind,rows){
    try{localStorage.setItem(localKey(kind),JSON.stringify(rows));}catch(_error){}
  }

  async function loadShared(kind,fallback){
    const localRows=readLocal(kind,fallback);
    if(typeof window.qmesSyncList!=="function") return {rows:localRows,status:"local"};
    try{
      const records=await window.qmesSyncList(ERP_SYNC_TYPE);
      const key=ERP_PREFIX+kind;
      const found=(Array.isArray(records)?records:[]).find(row=>String(row?.record_key||"")===key);
      if(!found) return {rows:localRows,status:"shared"};
      const payload=recordPayload(found);
      if(payload?.module!=="erp"||!Array.isArray(payload.rows)) return {rows:localRows,status:"shared"};
      writeLocal(kind,payload.rows);
      return {rows:payload.rows,status:"shared"};
    }catch(error){
      console.warn("[QMES ERP] shared load failed",kind,error);
      return {rows:localRows,status:"local"};
    }
  }

  async function saveShared(kind,rows){
    writeLocal(kind,rows);
    if(typeof window.qmesSyncUpsert!=="function") return "local";
    try{
      await window.qmesSyncUpsert(ERP_SYNC_TYPE,ERP_PREFIX+kind,{
        module:"erp",
        schema:1,
        kind,
        rows,
        updatedAt:new Date().toISOString(),
        updatedBy:currentUserName()
      });
      return "shared";
    }catch(error){
      console.warn("[QMES ERP] shared save failed",kind,error);
      return "local";
    }
  }

  function useSharedRows(kind,defaults){
    const [rows,setRows]=useState(()=>readLocal(kind,defaults));
    const [syncStatus,setSyncStatus]=useState("loading");
    useEffect(()=>{
      let live=true;
      loadShared(kind,defaults).then(result=>{
        if(!live) return;
        setRows(clone(result.rows));
        setSyncStatus(result.status);
      });
      return()=>{live=false;};
    },[kind]);
    const save=async next=>{
      const normalized=clone(typeof next==="function"?next(rows):next);
      setRows(normalized);
      setSyncStatus("saving");
      const status=await saveShared(kind,normalized);
      setSyncStatus(status);
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind}}));
      return status;
    };
    return {rows,save,syncStatus};
  }

  function injectStyle(){
    if(document.getElementById("qmes-erp-integrated-style-20260826")) return;
    const style=document.createElement("style");
    style.id="qmes-erp-integrated-style-20260826";
    style.textContent=`
      .qmes-top-menu{overflow-x:auto!important;overflow-y:hidden!important;flex-wrap:nowrap!important;scrollbar-width:thin!important}.qmes-top-menu-item{flex:0 0 auto!important}
      .qerp{color:#111827;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}.qerp *{box-sizing:border-box}.qerp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin:0 0 14px}.qerp-title{margin:0;font-size:23px;font-weight:900;letter-spacing:-.5px;color:#111827}.qerp-sub{margin-top:5px;color:#64748b;font-size:13px;font-weight:600}.qerp-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.qerp-btn{border:0;border-radius:8px;background:#2563eb;color:#fff;padding:9px 13px;font-size:12px;font-weight:900;cursor:pointer}.qerp-btn:hover{background:#1d4ed8}.qerp-btn.ghost{background:#fff;color:#334155;border:1px solid #cbd5e1}.qerp-sync{display:inline-flex;align-items:center;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900;border:1px solid #dbe3ec;background:#fff;color:#475569}.qerp-sync.shared{background:#ecfdf3;border-color:#bbf7d0;color:#15803d}.qerp-sync.saving,.qerp-sync.loading{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}.qerp-sync.local{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
      .qerp-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:13px}.qerp-kpi{position:relative;background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:13px 14px;box-shadow:0 8px 24px rgba(15,23,42,.06);overflow:hidden}.qerp-kpi:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#2563eb}.qerp-kpi.orange:before{background:#f59e0b}.qerp-kpi.green:before{background:#16a34a}.qerp-kpi.red:before{background:#ef4444}.qerp-kpi.slate:before{background:#64748b}.qerp-kpi span{display:block;color:#64748b;font-size:11px;font-weight:800}.qerp-kpi b{display:block;margin-top:6px;font-size:23px;color:#111827}.qerp-kpi small{display:block;margin-top:3px;color:#94a3b8;font-size:10px}
      .qerp-grid2{display:grid;grid-template-columns:1.35fr .85fr;gap:13px}.qerp-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:15px;box-shadow:0 8px 24px rgba(15,23,42,.06);margin-bottom:13px}.qerp-card h2{margin:0 0 11px;font-size:15px;font-weight:900;color:#111827}.qerp-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.qerp-card-head h2{margin:0}.qerp-muted{color:#64748b;font-size:11px;font-weight:700}.qerp-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:12px}.qerp-field label{display:block;margin-bottom:5px;color:#475569;font-size:10px;font-weight:850}.qerp-field input,.qerp-field select{width:100%;height:36px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#111827;padding:0 8px;font-size:12px;outline:none}.qerp-field input:focus,.qerp-field select:focus{border-color:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.15)}.qerp-form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:7px}.qerp-error{grid-column:1/-1;padding:8px 10px;border-radius:7px;background:#fff1f2;color:#b91c1c;font-size:11px;font-weight:800}
      .qerp-table-wrap{overflow:auto}.qerp-table{width:100%;border-collapse:collapse;font-size:12px}.qerp-table th{background:#f8fafc;color:#475569;text-align:left;padding:8px;border-bottom:1px solid #dbe3ec;font-size:10px;font-weight:900;white-space:nowrap}.qerp-table td{padding:9px 8px;border-bottom:1px solid #edf2f7;white-space:nowrap;color:#334155;line-height:1.5}.qerp-table tr:last-child td{border-bottom:0}.qerp-status{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900}.qerp-status.green{background:#dcfce7;color:#15803d}.qerp-status.orange{background:#ffedd5;color:#c2410c}.qerp-status.blue{background:#dbeafe;color:#1d4ed8}.qerp-status.red{background:#fee2e2;color:#b91c1c}.qerp-status.slate{background:#f1f5f9;color:#475569}.qerp-alerts{display:grid;gap:8px}.qerp-alert{display:flex;justify-content:space-between;gap:10px;padding:10px;border-radius:8px;font-size:11px;font-weight:800}.qerp-alert.blue{background:#eff6ff;color:#1e40af}.qerp-alert.orange{background:#fff7ed;color:#9a3412}.qerp-alert.red{background:#fff1f2;color:#9f1239}.qerp-alert.green{background:#ecfdf3;color:#166534}.qerp-box{border:1px solid #dbe3ec;border-radius:9px;background:#fbfdff;padding:11px;margin-top:9px}.qerp-box h3{margin:0 0 7px;color:#111827;font-size:13px;font-weight:900}.qerp-note{color:#64748b;font-size:11px;line-height:1.75}.qerp-linkbtn{border:0;background:transparent;color:#2563eb;font-size:10px;font-weight:900;cursor:pointer;padding:2px 4px}.qerp-delete{border:0;background:#fff1f2;color:#b91c1c;border-radius:6px;padding:5px 7px;font-size:10px;font-weight:900;cursor:pointer}
      @media(max-width:1200px){.qerp-kpis{grid-template-columns:repeat(3,1fr)}.qerp-grid2{grid-template-columns:1fr}.qerp-form{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.qerp-head{flex-direction:column}.qerp-head-actions{justify-content:flex-start}.qerp-kpis{grid-template-columns:1fr 1fr}.qerp-form{grid-template-columns:1fr}}@media(max-width:480px){.qerp-kpis{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }
  injectStyle();

  const SALES_DEFAULT=[
    {id:"SO-260824-01",customer:"현대자동차",po:"HM-2026-0824-01",product:"전도 슬러리 A",qty:3000,due:"2026-08-30",plan:"반영완료",shipping:"생산중"},
    {id:"SO-260823-02",customer:"삼성SDI",po:"SDI-2026-0823-02",product:"Binder Solution",qty:2000,due:"2026-08-29",plan:"계획대기",shipping:"-"}
  ];
  const PURCHASE_DEFAULT=[
    {id:"PO-260824-01",supplier:"Supplier A",material:"NMP",qty:500,due:"2026-08-26",expected:"2026-08-25",iqc:"예정",status:"공급사 출고"},
    {id:"PO-260824-02",supplier:"Supplier B",material:"첨가제",qty:100,due:"2026-08-27",expected:"",iqc:"-",status:"납기확인"}
  ];
  const MASTER_DEFAULT=[{
    revision:"Rev.03",effectiveDate:"2026-08-20",customer:"현대자동차 / 공용",baseQty:1000,status:"승인",
    items:[
      {material:"NMP",ratio:80,qty:800,seq:1,control:"-"},
      {material:"PVDF",ratio:5,qty:50,seq:2,control:"점도"},
      {material:"SBR",ratio:6,qty:60,seq:3,control:"고형분"},
      {material:"첨가제",ratio:9,qty:90,seq:4,control:"입도"}
    ],
    note:"NMP 79% → 80%"
  },{
    revision:"Rev.02",effectiveDate:"2026-08-01",customer:"현대자동차 / 공용",baseQty:1000,status:"이력",
    items:[
      {material:"NMP",ratio:79,qty:790,seq:1,control:"-"},
      {material:"PVDF",ratio:5,qty:50,seq:2,control:"점도"},
      {material:"SBR",ratio:6,qty:60,seq:3,control:"고형분"},
      {material:"첨가제",ratio:10,qty:100,seq:4,control:"입도"}
    ],
    note:"첨가제 B 추가"
  }];
  const SHIPPING_DEFAULT=[
    {date:"2026-08-26",sales:"SO-260824-01",customer:"현대자동차",product:"전도 슬러리 A",lot:"FG-260824-01",qty:2000,oqc:"합격",coa:"발행",delivery:"배차완료"},
    {date:"2026-08-27",sales:"SO-260823-02",customer:"삼성SDI",product:"Binder Solution",lot:"FG-260825-01",qty:1500,oqc:"검사대기",coa:"-",delivery:"-"}
  ];
  const PLAN_DEFAULT=[{date:"2026-08-27",product:"Binder Solution",qty:2500,revision:"Rev.03"}];

  function fmtQty(value){return `${Number(value||0).toLocaleString("ko-KR")} kg`;}
  function shortDate(value){if(!value)return "-";const s=String(value);return s.length>=10?s.slice(5,10).replace("-","/"):s;}
  function statusClass(value){
    const text=String(value||"");
    if(/합격|완료|반영|충족|승인|발행/.test(text)) return "green";
    if(/생산중|배차|출고|예정/.test(text)) return "blue";
    if(/대기|확인/.test(text)) return "orange";
    if(/위험|부족|지연|불합격/.test(text)) return "red";
    return "slate";
  }

  function SyncBadge({status}){
    const label=status==="shared"?"공용 DB 연동":status==="saving"?"저장 중":status==="loading"?"불러오는 중":"로컬 임시";
    return <span className={`qerp-sync ${status}`}>{label}</span>;
  }

  function Header({title,subtitle,status,actionLabel,onAction}){
    return <div className="qerp-head"><div><h1 className="qerp-title">{title}</h1><div className="qerp-sub">{subtitle}</div></div><div className="qerp-head-actions"><SyncBadge status={status}/>{actionLabel&&<button type="button" className="qerp-btn" onClick={onAction}>{actionLabel}</button>}</div></div>;
  }

  function Status({children}){return <span className={`qerp-status ${statusClass(children)}`}>{children}</span>;}
  function Kpi({label,value,kind="",small}){return <div className={`qerp-kpi ${kind}`}><span>{label}</span><b>{value}</b>{small&&<small>{small}</small>}</div>;}

  function QMESErpSalesTab(){
    const {rows,save,syncStatus}=useSharedRows("sales",SALES_DEFAULT);
    const [open,setOpen]=useState(false);
    const [form,setForm]=useState({customer:"현대자동차",po:"",due:"2026-08-30",product:"전도 슬러리 A",qty:"1000"});
    const [error,setError]=useState("");
    const total=rows.reduce((sum,row)=>sum+Number(row.qty||0),0);
    const dueSoon=rows.filter(row=>{const time=new Date(row.due+"T23:59:59").getTime()-Date.now();return time>=0&&time<=7*86400000;}).length;
    const risk=rows.filter(row=>/위험|지연/.test(String(row.shipping||""))).length;
    const submit=async e=>{
      e.preventDefault();setError("");
      const qty=Number(String(form.qty).replace(/,/g,""));
      if(!form.customer||!form.product||!form.due||!Number.isFinite(qty)||qty<=0){setError("고객사·제품·납기일·수량을 확인하세요.");return;}
      const d=new Date();const stamp=`${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
      let seq=1;while(rows.some(row=>row.id===`SO-${stamp}-${String(seq).padStart(2,"0")}`))seq++;
      const next=[{id:`SO-${stamp}-${String(seq).padStart(2,"0")}`,customer:form.customer,po:form.po||"-",product:form.product,qty,due:form.due,plan:"계획대기",shipping:"-"},...rows];
      await save(next);setOpen(false);
    };
    return <div className="qerp"><Header title="수주 · 납기관리" subtitle="고객 PO를 생산계획 및 출하계획의 시작점으로 관리" status={syncStatus} actionLabel={open?"입력 닫기":"+ 신규 수주"} onAction={()=>setOpen(v=>!v)}/>
      <div className="qerp-kpis"><Kpi label="진행 수주" value={`${rows.length}건`}/><Kpi label="7일 이내 납기" value={`${dueSoon}건`} kind="orange"/><Kpi label="납기 준수율" value="96.8%" kind="green"/><Kpi label="지연 위험" value={`${risk}건`} kind="red"/><Kpi label="수주량 합계" value={`${(total/1000).toFixed(1)}t`} kind="slate"/></div>
      <div className="qerp-card">
        {open&&<form className="qerp-form" onSubmit={submit}><div className="qerp-field"><label>고객사</label><select value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}><option>현대자동차</option><option>삼성SDI</option><option>SK</option><option>기타</option></select></div><div className="qerp-field"><label>고객 PO 번호</label><input value={form.po} onChange={e=>setForm({...form,po:e.target.value})} placeholder="고객 PO 번호"/></div><div className="qerp-field"><label>요청 납기일</label><input type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></div><div className="qerp-field"><label>제품</label><select value={form.product} onChange={e=>setForm({...form,product:e.target.value})}><option>전도 슬러리 A</option><option>전도 슬러리 B</option><option>Binder Solution</option></select></div><div className="qerp-field"><label>수량 (kg)</label><input inputMode="numeric" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></div>{error&&<div className="qerp-error">{error}</div>}<div className="qerp-form-actions"><button type="button" className="qerp-btn ghost" onClick={()=>setOpen(false)}>취소</button><button type="submit" className="qerp-btn">수주 저장</button></div></form>}
        <div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>수주번호</th><th>고객사</th><th>고객 PO</th><th>제품</th><th>수량</th><th>납기일</th><th>생산계획</th><th>출하상태</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><b>{row.id}</b></td><td>{row.customer}</td><td>{row.po||"-"}</td><td>{row.product}</td><td>{fmtQty(row.qty)}</td><td>{shortDate(row.due)}</td><td><Status>{row.plan}</Status></td><td>{row.shipping==="-"?"-":<Status>{row.shipping}</Status>}</td></tr>)}</tbody></table></div>
      </div>
    </div>;
  }

  function QMESErpPlanTab(){
    const {rows,save,syncStatus}=useSharedRows("plan",PLAN_DEFAULT);
    const plan=rows[0]||PLAN_DEFAULT[0];
    const [form,setForm]=useState(()=>({...plan,qty:String(plan.qty||2500)}));
    useEffect(()=>{const next=rows[0];if(next)setForm({...next,qty:String(next.qty||2500)});},[rows]);
    const recipe=[
      {material:"NMP",ratio:80,available:1550,reserved:200,incoming:400},
      {material:"PVDF",ratio:5,available:80,reserved:0,incoming:50},
      {material:"SBR",ratio:6,available:210,reserved:20,incoming:0},
      {material:"첨가제",ratio:9,available:190,reserved:0,incoming:0}
    ];
    const qty=Math.max(0,Number(String(form.qty||0).replace(/,/g,""))||0);
    const mrp=useMemo(()=>recipe.map(item=>{const need=qty*item.ratio/100;const usable=item.available-item.reserved+item.incoming;return {...item,need,shortage:Math.max(0,need-usable)};}),[qty]);
    const totalShort=mrp.reduce((s,r)=>s+r.shortage,0);const shortageCount=mrp.filter(r=>r.shortage>0).length;const possible=qty?Math.max(0,(qty-totalShort)/qty*100):0;
    const recalc=async()=>{await save([{date:form.date,product:form.product,qty,revision:form.revision}]);};
    return <div className="qerp"><Header title="생산계획 · MRP" subtitle="수주와 Recipe를 기준으로 원료 필요량·가용재고·부족량 자동 계산" status={syncStatus} actionLabel="MRP 재계산" onAction={recalc}/>
      <div className="qerp-grid2"><div className="qerp-card"><h2>생산계획 입력</h2><div className="qerp-form" style={{marginBottom:0}}><div className="qerp-field"><label>생산일</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="qerp-field"><label>제품</label><select value={form.product} onChange={e=>setForm({...form,product:e.target.value})}><option>Binder Solution</option><option>전도 슬러리 A</option><option>전도 슬러리 B</option></select></div><div className="qerp-field"><label>계획량 (kg)</label><input value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></div><div className="qerp-field"><label>Recipe Revision</label><select value={form.revision} onChange={e=>setForm({...form,revision:e.target.value})}><option>Rev.03</option><option>Rev.02</option><option>Rev.01</option></select></div></div></div><div className="qerp-card"><h2>계획 판단</h2><div className="qerp-alerts"><div className="qerp-alert blue"><span>현재 생산 가능률</span><b>{possible.toFixed(1)}%</b></div><div className="qerp-alert red"><span>부족 원료</span><b>{shortageCount} 품목</b></div><div className="qerp-alert orange"><span>입고예정 반영</span><b>{mrp.filter(r=>r.incoming>0).length}건</b></div></div></div></div>
      <div className="qerp-card"><div className="qerp-card-head"><h2>MRP 소요량 계산</h2><span className="qerp-muted">계획 {fmtQty(qty)} · {form.revision}</span></div><div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>원료</th><th>배합비</th><th>필요량</th><th>가용재고</th><th>예약재고</th><th>입고예정</th><th>부족량</th><th>조치</th></tr></thead><tbody>{mrp.map(row=><tr key={row.material}><td><b>{row.material}</b></td><td>{row.ratio.toFixed(1)}%</td><td>{fmtQty(row.need)}</td><td>{fmtQty(row.available)}</td><td>{fmtQty(row.reserved)}</td><td>{fmtQty(row.incoming)}</td><td>{row.shortage>0?<b style={{color:"#dc2626"}}>{fmtQty(row.shortage)}</b>:"0 kg"}</td><td><Status>{row.shortage>0?"발주 필요":"충족"}</Status></td></tr>)}</tbody></table></div></div>
    </div>;
  }

  function QMESErpPurchaseTab(){
    const {rows:sharedRows,save,syncStatus}=useSharedRows("purchase",PURCHASE_DEFAULT);
    const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
    const emptyForm=()=>({
      purchaseType:"MRP 자동발주",productionType:"D-양산",supplier:"",supplierGrade:"",
      orderDate:today(),due:"",expected:"",priority:"일반",mrp:"",workOrderNo:"",
      warehouse:"시화공장 · 원료창고",terms:"월 마감 후 30일",requester:"",
      item:"",itemCode:"",spec:"",qty:"",unit:"kg",price:"",
      iqcRequired:true,coaRequired:true,msdsRequired:false,lotRequired:true,
      deliveryAddress:"나모케미칼 시화공장 원료 입고장",notes:""
    });
    const [rows,setRows]=useState([]);
    const [open,setOpen]=useState(false);
    const [selected,setSelected]=useState(null);
    const [error,setError]=useState("");
    const [query,setQuery]=useState("");
    const [statusFilter,setStatusFilter]=useState("all");
    const [form,setForm]=useState(emptyForm);
    const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
    const number=value=>{const parsed=Number(clean(value).replace(/,/g,""));return Number.isFinite(parsed)?parsed:0;};
    const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(clean(value));
    const isDemo=row=>(clean(row?.id)==="PO-260824-01"&&/^Supplier A$/i.test(clean(row?.supplier)))||(clean(row?.id)==="PO-260824-02"&&/^Supplier B$/i.test(clean(row?.supplier)));
    const esc=value=>clean(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    const fmtWon=value=>Number(value||0).toLocaleString("ko-KR")+"원";
    const rowNo=row=>clean(row?.purchaseNo||row?.no||row?.id);
    const rowItem=row=>clean(row?.item||row?.material);
    const rowDue=row=>clean(row?.requestedDueDate||row?.due||row?.dueDate);
    const rowExpected=row=>clean(row?.confirmedDueDate||row?.expected||row?.expectedDate);
    const rowReceived=row=>number(row?.receivedQty??row?.received);
    const rowAmount=row=>number(row?.amount)||number(row?.qty)*number(row?.unitPrice??row?.price);
    const pass=value=>/합격|적합|PASS|OK/i.test(clean(value));
    const fail=value=>/불합격|부적합|FAIL|NG|REJECT/i.test(clean(value));
    const stateFor=row=>{
      const manual=clean(row?.status),approval=clean(row?.approvalStatus||row?.approval),iqc=clean(row?.iqcStatus||row?.iqc);
      const qty=number(row?.qty),received=rowReceived(row);
      if(/취소/.test(manual))return "발주취소";
      if(fail(iqc))return "IQC 부적합";
      if(received>0&&received<qty)return "부분입고";
      if(qty>0&&received>=qty)return row?.iqcRequired!==false&&!pass(iqc)?"IQC대기":"입고완료";
      if(/검토|대기|미승인/.test(approval)&&!/승인완료|발주확정/.test(approval))return "결재대기";
      const due=rowExpected(row)||rowDue(row);
      if(validDate(due)){
        const base=new Date(today()+"T00:00:00").getTime(),target=new Date(due+"T00:00:00").getTime();
        const days=Math.round((target-base)/86400000);
        if(days<0)return "입고지연";
        if(days<=2||/긴급|최우선/.test(clean(row?.priority)))return "납기임박";
      }
      return manual&&manual!=="발주완료"?manual:"발주확정";
    };
    const toneFor=value=>/부적합|지연|임박|취소/.test(value)?"red":/발주확정/.test(value)?"teal":/완료|합격|승인완료/.test(value)?"green":/부분/.test(value)?"blue":/대기|검토/.test(value)?"orange":"slate";
    const StatusPill=({value})=><span className={"qerp-status "+toneFor(value)}>{value}</span>;

    useEffect(()=>{
      const source=Array.isArray(sharedRows)?sharedRows:[];
      const cleaned=source.filter(row=>!isDemo(row));
      setRows(cleaned);
      if(syncStatus!=="loading"&&cleaned.length!==source.length)save(cleaned);
    },[sharedRows,syncStatus]);

    useEffect(()=>{
      if(document.getElementById("qmes-purchase-premium-style"))return;
      const style=document.createElement("style");
      style.id="qmes-purchase-premium-style";
      style.textContent=".qp-flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin:0 0 13px;padding:18px 24px;background:#fff;border:1px solid #dbe3ec;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,.07)}.qp-stage{position:relative;display:flex;align-items:center;gap:9px;min-width:0}.qp-stage:not(:last-child):after{content:'';position:absolute;left:30px;right:5px;top:14px;height:2px;background:#24b8ae}.qp-stage:nth-child(4):after{background:#e2e8f0}.qp-dot{position:relative;z-index:1;width:30px;height:30px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;background:#e8fbf9;color:#0f8a83;border:1.5px solid #24b8ae;font-size:10px;font-weight:900}.qp-stage.active .qp-dot{background:#fffaf0;color:#a16207;border:2px solid #f2b84b;box-shadow:0 0 0 4px rgba(242,184,75,.16)}.qp-stage.wait .qp-dot{background:#fff;color:#64748b;border:1.5px solid #d5dee9}.qp-copy{position:relative;z-index:2;background:#fff;padding-right:9px}.qp-copy b{display:block;color:#0f172a;font-size:11px;white-space:nowrap}.qp-copy small{display:block;color:#64748b;font-size:9px;white-space:nowrap;margin-top:2px}.qp-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:13px}.qp-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;box-shadow:0 6px 18px rgba(15,23,42,.05)}.qp-kpi span{display:block;color:#64748b;font-size:10px;font-weight:800}.qp-kpi b{display:block;margin-top:5px;color:#0f172a;font-size:20px}.qp-kpi.red b,.qp-kpi.orange b,.qp-kpi.green b{color:#0f172a}.qp-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:10px}.qp-toolbar input,.qp-toolbar select{height:35px;border:1px solid #cbd5e1;border-radius:7px;padding:0 10px;background:#fff;color:#1e293b;font-size:11px}.qp-toolbar input{min-width:260px}.qp-count{margin-left:auto;color:#64748b;font-size:10px;font-weight:800}.qp-po-link{border:0;background:transparent;color:#1d4ed8;font:inherit;font-weight:900;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}.qp-actions{display:flex;gap:5px}.qp-mini{height:27px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#334155;padding:0 7px;font-size:9px;font-weight:900;cursor:pointer}.qp-mini.primary{border-color:#99f6e4;background:#f0fdfa;color:#0f766e}.qp-modal-bg{position:fixed;inset:0;z-index:10080;background:rgba(15,23,42,.62);display:grid;place-items:center;padding:18px}.qp-modal{width:min(1100px,calc(100vw - 30px));max-height:calc(100vh - 36px);overflow:auto;background:#f8fafc;border:1px solid #dbe3ec;border-radius:15px;box-shadow:0 28px 80px rgba(15,23,42,.3)}.qp-modal-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;padding:17px 20px;background:#fff;border-bottom:1px solid #e2e8f0}.qp-modal-head h2{margin:0;color:#0f172a;font-size:18px}.qp-modal-head p{margin:4px 0 0;color:#64748b;font-size:10px}.qp-close{width:32px;height:32px;border:0;border-radius:8px;background:#f1f5f9;color:#475569;font-size:18px;cursor:pointer}.qp-body{padding:17px 20px}.qp-section{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:11px}.qp-section-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:11px}.qp-section-title h3{margin:0;font-size:13px;color:#172033}.qp-section-title span{font-size:9px;color:#94a3b8}.qp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.qp-grid.items{grid-template-columns:1.35fr .75fr .75fr .7fr .65fr .8fr}.qp-field label{display:block;margin-bottom:5px;color:#475569;font-size:9px;font-weight:900}.qp-field input,.qp-field select,.qp-field textarea{width:100%;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#111827;padding:0 9px;font-size:11px;outline:none}.qp-field input,.qp-field select{height:35px}.qp-field textarea{min-height:62px;padding-top:8px;resize:vertical}.qp-field input:focus,.qp-field select:focus,.qp-field textarea:focus{border-color:#14b8a6;box-shadow:0 0 0 2px rgba(20,184,166,.12)}.qp-checks{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}.qp-checks label{display:flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:999px;color:#334155;font-size:9px;font-weight:800;background:#fff}.qp-summary{display:grid;grid-template-columns:repeat(3,1fr);margin-top:11px;border:1px solid #dbe3ec;border-radius:8px;overflow:hidden}.qp-summary div{padding:10px 12px;background:#f8fafc;border-right:1px solid #dbe3ec}.qp-summary div:last-child{border:0;background:#0f1d32;color:#fff}.qp-summary small{display:block;color:#64748b;font-size:8px}.qp-summary b{display:block;margin-top:3px;font-size:12px}.qp-modal-foot{position:sticky;bottom:0;display:flex;justify-content:flex-end;gap:7px;padding:12px 20px;background:#fff;border-top:1px solid #e2e8f0}.qp-drawer-bg{position:fixed;inset:0;z-index:10070;background:rgba(15,23,42,.3)}.qp-drawer{position:absolute;right:0;top:0;bottom:0;width:min(470px,95vw);overflow:auto;background:#fff;box-shadow:-20px 0 55px rgba(15,23,42,.2);padding:20px}.qp-drawer h2{margin:0 0 5px;font-size:17px}.qp-detail{margin-top:14px;border:1px solid #e2e8f0;border-radius:9px;overflow:hidden}.qp-detail div{display:flex;justify-content:space-between;gap:15px;padding:9px 11px;border-bottom:1px solid #edf2f7;font-size:10px}.qp-detail div:last-child{border:0}.qp-detail span{color:#64748b}.qp-detail b{text-align:right;color:#1e293b}.qp-drawer-buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:13px}.qp-root .qerp-status.teal{background:#dff8f4;color:#0f766e}.qp-root .qerp-btn:not(.ghost){background:#0f8a83}.qp-root .qerp-btn:not(.ghost):hover{background:#0b746f}.qp-root .qerp-btn.ghost{background:#fff;color:#334155}.qp-root .qp-modal-foot .qerp-btn:not(.ghost),.qp-root .qp-drawer-buttons .qerp-btn:not(.ghost){background:#0f8a83}@media(max-width:1050px){.qp-kpis{grid-template-columns:1fr 1fr}.qp-grid,.qp-grid.items{grid-template-columns:1fr 1fr}.qp-flow{overflow:auto}.qp-stage{min-width:150px}}@media(max-width:650px){.qp-kpis,.qp-grid,.qp-grid.items{grid-template-columns:1fr}.qp-toolbar{flex-wrap:wrap}.qp-toolbar input{min-width:100%;width:100%}.qp-modal-bg{padding:6px}.qp-modal{width:100%;max-height:calc(100vh - 12px)}}";
      document.head.appendChild(style);
    },[]);

    const amount=number(form.qty)*number(form.price);
    const persist=async next=>{setRows(next);return save(next);};
    const nextPurchaseNo=()=>{
      const stamp=today().slice(2,7).replace("-","");
      const prefix="PUR-"+stamp+"-";
      const max=rows.reduce((value,row)=>{const id=rowNo(row);const seq=id.startsWith(prefix)?Number(id.slice(prefix.length)):0;return Number.isFinite(seq)?Math.max(value,seq):value;},0);
      return prefix+String(max+1).padStart(3,"0");
    };
    const reset=()=>{setForm(emptyForm());setError("");};
    const openCreate=()=>{reset();setOpen(true);};
    const submit=async event=>{
      event.preventDefault();
      setError("");
      const qty=number(form.qty),price=number(form.price);
      if(!clean(form.supplier)||!clean(form.item)||qty<=0||price<0||!validDate(form.orderDate)||!validDate(form.due)){
        setError("협력사·품목·발주수량·발주일·요청납기를 확인하세요.");return;
      }
      if(form.due<form.orderDate){setError("요청납기일은 발주일보다 빠를 수 없습니다.");return;}
      if(clean(form.expected)&&!validDate(form.expected)){setError("협력사 확정 납기일을 확인하세요.");return;}
      const no=nextPurchaseNo();
      const nextRow={
        id:no,purchaseNo:no,purchaseType:form.purchaseType,productionType:form.productionType,
        supplier:clean(form.supplier),supplierGrade:clean(form.supplierGrade),
        item:clean(form.item),material:clean(form.item),itemCode:clean(form.itemCode),spec:clean(form.spec),
        qty:qty,unit:form.unit,unitPrice:price,price:price,amount:qty*price,
        orderDate:form.orderDate,requestedDueDate:form.due,due:form.due,
        confirmedDueDate:form.expected,expected:form.expected,priority:form.priority,
        mrpNo:clean(form.mrp),mrp:clean(form.mrp),workOrderNo:clean(form.workOrderNo),
        warehouse:form.warehouse,paymentTerms:form.terms,terms:form.terms,
        approvalStatus:"구매검토",approval:"구매검토",receiptStatus:"미입고",receiving:"미입고",
        receivedQty:0,received:0,iqcRequired:form.iqcRequired,iqcStatus:"계획 대기",iqc:"계획 대기",
        coaRequired:form.coaRequired,msdsRequired:form.msdsRequired,lotRequired:form.lotRequired,
        deliveryAddress:clean(form.deliveryAddress),requester:clean(form.requester),owner:clean(form.requester),
        notes:clean(form.notes),status:"결재대기",createdAt:new Date().toISOString(),createdBy:currentUserName()
      };
      await persist([nextRow,...rows]);setOpen(false);reset();
    };
    const cancelOrder=async row=>{
      if(!window.confirm(rowNo(row)+" 발주를 취소하시겠습니까?"))return;
      try{
        const response=await fetch("/api/purchase-orders/"+encodeURIComponent(rowNo(row))+"/cancel",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"});
        const result=await response.json();
        if(!response.ok||!result.success)throw new Error(result.message||"발주 취소 실패");
        const changed=result.data||{...row,status:"발주취소"};
        setRows(rows.map(item=>rowNo(item)===rowNo(row)?{...item,...changed}:item));
        setSelected(null);
      }catch(apiError){
        const next=rows.map(item=>rowNo(item)===rowNo(row)?{...item,status:"발주취소",updatedAt:new Date().toISOString(),updatedBy:currentUserName()}:item);
        await persist(next);setSelected(null);
      }
    };
    const registerReceipt=async row=>{
      const qtyText=window.prompt("입고수량 ("+(row.unit||"kg")+")",String(Math.max(0,number(row.qty)-rowReceived(row))));
      if(qtyText===null)return;
      const qty=number(qtyText);if(qty<=0){window.alert("입고수량을 확인하세요.");return;}
      const lot=window.prompt("원료 LOT를 입력하세요.","");if(lot===null)return;
      if(row.lotRequired!==false&&!clean(lot)){window.alert("원료 LOT를 입력하세요.");return;}
      try{
        const response=await fetch("/api/purchase-orders/"+encodeURIComponent(rowNo(row))+"/receipts",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({qty:qty,materialLot:clean(lot),receiptDate:today()})});
        const result=await response.json();
        if(!response.ok||!result.success)throw new Error(result.message||"입고 등록 실패");
        const changed=result.data?.purchaseOrder;
        if(changed){
          const next=rows.map(item=>rowNo(item)===rowNo(row)?{...item,...changed}:item);
          setRows(next);setSelected({...row,...changed});
          try{localStorage.setItem("qmes-erp-purchase-v1",JSON.stringify(next));}catch(_error){}
        }
      }catch(apiError){window.alert(apiError.message);}
    };
    const printOrder=row=>{
      const win=window.open("","_blank","width=980,height=780");
      if(!win){window.alert("팝업 차단을 해제해 주세요.");return;}
      const supply=rowAmount(row),vat=Math.round(supply*.1),total=supply+vat;
      const quality=[row.iqcRequired!==false?"IQC 필수":"IQC 비대상",row.coaRequired!==false?"CoA 동봉":"",row.msdsRequired?"MSDS 동봉":"",row.lotRequired!==false?"제조 LOT·유효기한 표시":""].filter(Boolean).join(" · ");
      const html=["<!doctype html><html lang='ko'><head><meta charset='utf-8'><title>"+esc(rowNo(row))+" 구매 발주서</title><style>body{font-family:Arial,'Malgun Gothic',sans-serif;color:#111;padding:28px}h1{text-align:center;letter-spacing:.25em;margin:0 0 24px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #555;padding:9px;font-size:12px}th{background:#f1f5f9;text-align:center}.meta{display:flex;justify-content:space-between;font-size:12px}.total{text-align:right;margin-top:12px;font-size:14px;font-weight:800}.note{border:1px solid #777;min-height:70px;padding:10px;margin-top:16px;font-size:11px}.sign{display:grid;grid-template-columns:repeat(3,1fr);width:330px;margin:25px 0 0 auto}.sign div{border:1px solid #777;min-height:58px;padding:7px;text-align:center;font-size:10px}@media print{button{display:none}}</style></head><body><h1>구매 발주서</h1><div class='meta'><b>발주번호 "+esc(rowNo(row))+"</b><span>발주일 "+esc(row.orderDate||"-")+"</span></div><table><tr><th>협력사</th><td>"+esc(row.supplier)+"</td><th>구매구분</th><td>"+esc(row.purchaseType||row.type||"-")+"</td></tr><tr><th>생산구분</th><td>"+esc(row.productionType||"D-양산")+"</td><th>MRP/작업지시</th><td>"+esc((row.mrpNo||row.mrp||"-")+" / "+(row.workOrderNo||"-"))+"</td></tr><tr><th>품목</th><td>"+esc(rowItem(row))+"</td><th>품목코드/규격</th><td>"+esc((row.itemCode||"-")+" / "+(row.spec||"-"))+"</td></tr><tr><th>수량</th><td>"+esc(Number(row.qty||0).toLocaleString("ko-KR")+" "+(row.unit||"kg"))+"</td><th>단가</th><td>"+esc(fmtWon(row.unitPrice??row.price))+"</td></tr><tr><th>요청납기</th><td>"+esc(rowDue(row)||"-")+"</td><th>입고장소</th><td>"+esc(row.warehouse||"-")+"</td></tr><tr><th>결제조건</th><td>"+esc(row.paymentTerms||row.terms||"-")+"</td><th>품질요구</th><td>"+esc(quality)+"</td></tr></table><div class='total'>공급가액 "+fmtWon(supply)+" · VAT "+fmtWon(vat)+" · 합계 "+fmtWon(total)+"</div><div class='note'><b>특기사항</b><br><br>"+esc(row.notes||"")+"</div><div class='sign'><div>작성<br><br>"+esc(row.requester||row.owner||"")+"</div><div>검토</div><div>승인</div></div><script>setTimeout(function(){window.print()},250)<\/script></body></html>"].join("");
      win.document.open();win.document.write(html);win.document.close();
    };

    const visible=useMemo(()=>rows.filter(row=>{
      const matches=!query||[rowNo(row),row.supplier,rowItem(row),row.itemCode,row.spec,row.mrpNo,row.mrp].some(value=>clean(value).toLowerCase().includes(query.toLowerCase()));
      return matches&&(statusFilter==="all"||stateFor(row)===statusFilter);
    }),[rows,query,statusFilter]);
    const month=today().slice(0,7);
    const monthAmount=rows.filter(row=>clean(row.orderDate).startsWith(month)).reduce((sum,row)=>sum+rowAmount(row),0);
    const approvalCount=rows.filter(row=>stateFor(row)==="결재대기").length;
    const riskCount=rows.filter(row=>/납기임박|입고지연/.test(stateFor(row))).length;
    const incoming=rows.reduce((sum,row)=>sum+Math.max(0,number(row.qty)-rowReceived(row)),0);

    return <div className="qerp qp-root">
      <Header title="구매 · 발주관리" subtitle="MRP 부족수량 → 구매검토·결재 → 협력사 발주 → 입고·IQC까지 연결" status={syncStatus} actionLabel="+ 신규 구매 발주" onAction={openCreate}/>
      <div className="qp-flow" aria-label="구매 발주 표준 흐름">
        <div className="qp-stage"><span className="qp-dot">✓</span><div className="qp-copy"><b>구매요청 · MRP</b><small>부족수량·소요 확인</small></div></div>
        <div className="qp-stage"><span className="qp-dot">✓</span><div className="qp-copy"><b>견적 · 협력사</b><small>단가·공급능력 검토</small></div></div>
        <div className="qp-stage"><span className="qp-dot">✓</span><div className="qp-copy"><b>전자결재</b><small>구매 검토·승인</small></div></div>
        <div className="qp-stage active"><span className="qp-dot">4</span><div className="qp-copy"><b>발주 · 납기</b><small>발주서 송부·추적</small></div></div>
        <div className="qp-stage wait"><span className="qp-dot">5</span><div className="qp-copy"><b>입고 · IQC</b><small>LOT 검사·재고 반영</small></div></div>
      </div>
      <div className="qp-kpis">
        <div className="qp-kpi green"><span>이번 달 발주금액</span><b>{fmtWon(monthAmount)}</b></div>
        <div className="qp-kpi orange"><span>결재 대기</span><b>{approvalCount}건</b></div>
        <div className="qp-kpi red"><span>납기 위험</span><b>{riskCount}건</b></div>
        <div className="qp-kpi"><span>미입고 수량</span><b>{Number(incoming).toLocaleString("ko-KR")} kg</b></div>
      </div>
      <div className="qerp-card">
        <div className="qerp-card-head"><div><h2>구매 발주 현황</h2><div className="qerp-muted">실제 발주번호 기준 결재·납기·입고·IQC 상태</div></div></div>
        <div className="qp-toolbar"><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="발주번호, 협력사, 품목, MRP 검색"/><select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">전체 상태</option><option>결재대기</option><option>발주확정</option><option>납기임박</option><option>입고지연</option><option>부분입고</option><option>IQC대기</option><option>입고완료</option><option>IQC 부적합</option><option>발주취소</option></select><button type="button" className="qerp-btn ghost" onClick={()=>{setQuery("");setStatusFilter("all");}}>초기화</button><span className="qp-count">총 {visible.length}건</span></div>
        <div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>발주번호 / 생산구분</th><th>협력사</th><th>품목 / 규격</th><th>발주수량</th><th>발주금액</th><th>발주일 / 요청납기</th><th>결재</th><th>입고 · IQC</th><th>상태</th><th>관리</th></tr></thead><tbody>
          {visible.map(row=>{const state=stateFor(row);return <tr key={rowNo(row)}><td><button type="button" className="qp-po-link" onClick={()=>setSelected(row)}>{rowNo(row)}</button><div className="qerp-muted">{row.productionType||"D-양산"} · {row.purchaseType||row.type||"정기발주"}</div></td><td><b>{row.supplier||"-"}</b><div className="qerp-muted">{row.supplierGrade||row.grade||"-"}</div></td><td><b>{rowItem(row)||"-"}</b><div className="qerp-muted">{row.itemCode||row.spec||"-"}</div></td><td><b>{Number(row.qty||0).toLocaleString("ko-KR")} {row.unit||"kg"}</b></td><td>{fmtWon(rowAmount(row))}</td><td>{row.orderDate||"-"}<div className="qerp-muted">납기 {rowDue(row)||"-"}</div></td><td><StatusPill value={row.approvalStatus||row.approval||"구매검토"}/></td><td>{Number(rowReceived(row)).toLocaleString("ko-KR")} / {Number(row.qty||0).toLocaleString("ko-KR")} {row.unit||"kg"}<div className="qerp-muted">IQC · {row.iqcStatus||row.iqc||"계획 대기"}</div></td><td><StatusPill value={state}/></td><td><div className="qp-actions"><button type="button" className="qp-mini primary" onClick={()=>setSelected(row)}>상세</button><button type="button" className="qp-mini" onClick={()=>printOrder(row)}>인쇄</button></div></td></tr>;})}
          {!visible.length&&<tr><td colSpan="10" style={{textAlign:"center",padding:"30px",color:"#94a3b8"}}>등록된 실제 구매 발주가 없습니다. 신규 구매 발주를 등록하세요.</td></tr>}
        </tbody></table></div>
      </div>

      {open&&<div className="qp-modal-bg" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}><form className="qp-modal" onSubmit={submit}>
        <div className="qp-modal-head"><div><h2>신규 구매 발주 등록</h2><p>나모케미칼 MRP·작업지시·협력사·IQC를 하나의 발주번호로 연결합니다.</p></div><button type="button" className="qp-close" onClick={()=>setOpen(false)}>×</button></div>
        <div className="qp-body">
          <section className="qp-section"><div className="qp-section-title"><h3>1. 발주 기본 정보</h3><span>* 필수 입력</span></div><div className="qp-grid">
            <div className="qp-field"><label>발주번호</label><input value={nextPurchaseNo()} readOnly/></div>
            <div className="qp-field"><label>구매 구분</label><select value={form.purchaseType} onChange={event=>setForm({...form,purchaseType:event.target.value})}><option>MRP 자동발주</option><option>정기발주</option><option>긴급발주</option><option>설비·소모품</option></select></div>
            <div className="qp-field"><label>생산 구분</label><select value={form.productionType} onChange={event=>setForm({...form,productionType:event.target.value})}><option>D-양산</option><option>C-Pilot</option><option>B-Lab</option></select></div>
            <div className="qp-field"><label>협력사 *</label><input value={form.supplier} onChange={event=>setForm({...form,supplier:event.target.value})} placeholder="실제 협력사명 직접 입력"/></div>
            <div className="qp-field"><label>발주일 *</label><input type="date" value={form.orderDate} onChange={event=>setForm({...form,orderDate:event.target.value})}/></div>
            <div className="qp-field"><label>요청납기 *</label><input type="date" value={form.due} onChange={event=>setForm({...form,due:event.target.value})}/></div>
            <div className="qp-field"><label>협력사 확정 납기</label><input type="date" value={form.expected} onChange={event=>setForm({...form,expected:event.target.value})}/></div>
            <div className="qp-field"><label>납기 우선순위</label><select value={form.priority} onChange={event=>setForm({...form,priority:event.target.value})}><option>일반</option><option>긴급</option><option>최우선</option></select></div>
            <div className="qp-field"><label>연결 MRP / 구매요청</label><input value={form.mrp} onChange={event=>setForm({...form,mrp:event.target.value})} placeholder="MRP- 또는 PR-"/></div>
            <div className="qp-field"><label>연결 작업지시</label><input value={form.workOrderNo} onChange={event=>setForm({...form,workOrderNo:event.target.value})} placeholder="WO-"/></div>
            <div className="qp-field"><label>입고 창고</label><select value={form.warehouse} onChange={event=>setForm({...form,warehouse:event.target.value})}><option>시화공장 · 원료창고</option><option>시화공장 · 포장자재창고</option><option>검사대기 구역</option></select></div>
            <div className="qp-field"><label>결제 조건</label><select value={form.terms} onChange={event=>setForm({...form,terms:event.target.value})}><option>월 마감 후 30일</option><option>입고 후 30일</option><option>검수 후 60일</option><option>선급 30% · 잔금 70%</option></select></div>
          </div></section>
          <section className="qp-section"><div className="qp-section-title"><h3>2. 발주 품목 및 금액</h3><span>실제 품목 기준</span></div><div className="qp-grid items">
            <div className="qp-field"><label>품목 *</label><input value={form.item} onChange={event=>setForm({...form,item:event.target.value})} placeholder="실제 원료·포장재명"/></div>
            <div className="qp-field"><label>품목코드</label><input value={form.itemCode} onChange={event=>setForm({...form,itemCode:event.target.value})} placeholder="RM- / PK-"/></div>
            <div className="qp-field"><label>규격</label><input value={form.spec} onChange={event=>setForm({...form,spec:event.target.value})}/></div>
            <div className="qp-field"><label>발주수량 *</label><input inputMode="decimal" value={form.qty} onChange={event=>setForm({...form,qty:event.target.value})} placeholder="0"/></div>
            <div className="qp-field"><label>단위</label><select value={form.unit} onChange={event=>setForm({...form,unit:event.target.value})}><option>kg</option><option>EA</option><option>Drum</option><option>LOT</option></select></div>
            <div className="qp-field"><label>단가 (원)</label><input inputMode="numeric" value={form.price} onChange={event=>setForm({...form,price:event.target.value})} placeholder="0"/></div>
          </div><div className="qp-summary"><div><small>공급가액</small><b>{fmtWon(amount)}</b></div><div><small>부가세 10%</small><b>{fmtWon(Math.round(amount*.1))}</b></div><div><small>합계금액</small><b>{fmtWon(Math.round(amount*1.1))}</b></div></div></section>
          <section className="qp-section"><div className="qp-section-title"><h3>3. 입고 · 품질 요구사항</h3><span>발주서 및 IQC 계획에 반영</span></div><div className="qp-checks">
            <label><input type="checkbox" checked={form.iqcRequired} onChange={event=>setForm({...form,iqcRequired:event.target.checked})}/>IQC 필수</label>
            <label><input type="checkbox" checked={form.coaRequired} onChange={event=>setForm({...form,coaRequired:event.target.checked})}/>CoA 동봉</label>
            <label><input type="checkbox" checked={form.msdsRequired} onChange={event=>setForm({...form,msdsRequired:event.target.checked})}/>MSDS 동봉</label>
            <label><input type="checkbox" checked={form.lotRequired} onChange={event=>setForm({...form,lotRequired:event.target.checked})}/>제조 LOT·유효기한 표시</label>
          </div><div className="qp-grid">
            <div className="qp-field"><label>납품 장소</label><input value={form.deliveryAddress} onChange={event=>setForm({...form,deliveryAddress:event.target.value})}/></div>
            <div className="qp-field"><label>협력사 등급</label><input value={form.supplierGrade} onChange={event=>setForm({...form,supplierGrade:event.target.value})} placeholder="예: A등급"/></div>
            <div className="qp-field"><label>구매 담당 / 원가부서</label><input value={form.requester} onChange={event=>setForm({...form,requester:event.target.value})} placeholder="담당자 · 부서"/></div>
            <div className="qp-field"><label>특기사항</label><textarea value={form.notes} onChange={event=>setForm({...form,notes:event.target.value})} placeholder="CoA 사전 송부, 포장·납품 조건 등"/></div>
          </div></section>
          {error&&<div className="qerp-error">{error}</div>}
        </div><div className="qp-modal-foot"><button type="button" className="qerp-btn ghost" onClick={()=>setOpen(false)}>취소</button><button type="submit" className="qerp-btn">결재 상신 및 저장</button></div>
      </form></div>}

      {selected&&<div className="qp-drawer-bg" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null);}}><aside className="qp-drawer">
        <div style={{display:"flex",justifyContent:"space-between",gap:"10px"}}><div><div className="qerp-muted">PURCHASE ORDER DETAIL</div><h2>{rowNo(selected)} · {selected.supplier}</h2><div className="qerp-muted">{rowItem(selected)} · {Number(selected.qty||0).toLocaleString("ko-KR")} {selected.unit||"kg"} · 납기 {rowDue(selected)||"-"}</div></div><button type="button" className="qp-close" onClick={()=>setSelected(null)}>×</button></div>
        <div style={{marginTop:"13px"}}><StatusPill value={stateFor(selected)}/></div>
        <div className="qp-detail"><div><span>구매 / 생산 구분</span><b>{selected.purchaseType||selected.type||"-"} · {selected.productionType||"D-양산"}</b></div><div><span>MRP / 작업지시</span><b>{selected.mrpNo||selected.mrp||"-"} · {selected.workOrderNo||"-"}</b></div><div><span>품목 / 규격</span><b>{rowItem(selected)} · {selected.itemCode||selected.spec||"-"}</b></div><div><span>발주금액</span><b>{fmtWon(rowAmount(selected))}</b></div><div><span>요청 / 확정 납기</span><b>{rowDue(selected)||"-"} · {rowExpected(selected)||"미확정"}</b></div><div><span>입고수량</span><b>{rowReceived(selected).toLocaleString("ko-KR")} / {Number(selected.qty||0).toLocaleString("ko-KR")} {selected.unit||"kg"}</b></div><div><span>원료 LOT</span><b>{selected.materialLot||selected.lot||"입고 시 생성"}</b></div><div><span>IQC</span><b>{selected.iqcStatus||selected.iqc||"계획 대기"}</b></div><div><span>결제조건</span><b>{selected.paymentTerms||selected.terms||"-"}</b></div><div><span>담당</span><b>{selected.requester||selected.owner||"-"}</b></div></div>
        <div className="qp-drawer-buttons"><button type="button" className="qerp-btn ghost" onClick={()=>printOrder(selected)}>구매 발주서 인쇄</button><button type="button" className="qerp-btn" onClick={()=>registerReceipt(selected)}>입고 등록</button><button type="button" className="qerp-btn ghost" style={{gridColumn:"1/-1",color:"#b91c1c"}} onClick={()=>cancelOrder(selected)}>발주 취소</button></div>
      </aside></div>}
    </div>;
  }

  function QMESErpMasterTab(){
    const {rows,save,syncStatus}=useSharedRows("master",MASTER_DEFAULT);
    const current=rows[0]||MASTER_DEFAULT[0];const [open,setOpen]=useState(false);const [error,setError]=useState("");
    const [ratios,setRatios]=useState({NMP:"80",PVDF:"5",SBR:"6",첨가제:"9"});
    useEffect(()=>{const map={};(current.items||[]).forEach(i=>{map[i.material]=String(i.ratio)});setRatios({NMP:map.NMP||"80",PVDF:map.PVDF||"5",SBR:map.SBR||"6",첨가제:map.첨가제||"9"});},[current.revision]);
    const createRevision=async e=>{e.preventDefault();setError("");const values=["NMP","PVDF","SBR","첨가제"].map(k=>Number(ratios[k]));const total=values.reduce((s,v)=>s+v,0);if(values.some(v=>!Number.isFinite(v)||v<0)||Math.abs(total-100)>.001){setError(`배합비 합계가 100%가 되도록 입력하세요. 현재 ${total.toFixed(1)}%입니다.`);return;}const revNo=Math.max(0,...rows.map(r=>Number(String(r.revision||"").replace(/\D/g,""))||0))+1;const base=1000;const items=["NMP","PVDF","SBR","첨가제"].map((material,index)=>({material,ratio:values[index],qty:base*values[index]/100,seq:index+1,control:["-","점도","고형분","입도"][index]}));const next={revision:`Rev.${String(revNo).padStart(2,"0")}`,effectiveDate:new Date().toISOString().slice(0,10),customer:current.customer||"공용",baseQty:base,status:"승인",items,note:`${current.revision}에서 신규 개정`};await save([next,...rows]);setOpen(false);};
    return <div className="qerp"><Header title="Recipe / BOM Master" subtitle="제품별 표준 배합비·표준투입량·Revision·적용일·승인이력 관리" status={syncStatus} actionLabel={open?"입력 닫기":"+ 신규 Revision"} onAction={()=>setOpen(v=>!v)}/>{open&&<div className="qerp-card"><form className="qerp-form" onSubmit={createRevision}>{["NMP","PVDF","SBR","첨가제"].map(k=><div className="qerp-field" key={k}><label>{k} 배합비 (%)</label><input inputMode="decimal" value={ratios[k]} onChange={e=>setRatios({...ratios,[k]:e.target.value})}/></div>)}{error&&<div className="qerp-error">{error}</div>}<div className="qerp-form-actions"><button type="button" className="qerp-btn ghost" onClick={()=>setOpen(false)}>취소</button><button type="submit" className="qerp-btn">Revision 저장</button></div></form></div>}<div className="qerp-grid2"><div className="qerp-card"><h2>제품 Recipe</h2><div className="qerp-box"><h3>Binder Solution · {current.revision}</h3><div className="qerp-note">적용일: <b>{current.effectiveDate}</b><br/>고객사: {current.customer}<br/>기준 생산량: <b>{fmtQty(current.baseQty)}</b><br/>상태: <Status>{current.status}</Status><br/>작성/검토/승인 이력 관리</div></div><div className="qerp-box"><h3>개정 이력</h3><div className="qerp-note">{rows.map((r,i)=><div key={r.revision}>{r.revision} — {r.note||"개정"}{i===0?" (현재)":""}</div>)}</div></div></div><div className="qerp-card"><h2>표준 배합표</h2><div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>No</th><th>원료</th><th>배합비</th><th>{Number(current.baseQty||1000).toLocaleString("ko-KR")}kg 기준</th><th>투입순서</th><th>관리항목</th></tr></thead><tbody>{(current.items||[]).map((row,index)=><tr key={row.material}><td>{index+1}</td><td><b>{row.material}</b></td><td>{Number(row.ratio).toFixed(1)}%</td><td>{fmtQty(row.qty)}</td><td>{row.seq}</td><td>{row.control}</td></tr>)}</tbody></table></div></div></div></div>;
  }

  function QMESErpShippingTab(){
    const {rows,save,syncStatus}=useSharedRows("shipping",SHIPPING_DEFAULT);const [open,setOpen]=useState(false);const [error,setError]=useState("");
    const [form,setForm]=useState({date:"2026-08-28",sales:"",customer:"현대자동차",product:"전도 슬러리 A",lot:"",qty:"1000"});
    const submit=async e=>{e.preventDefault();setError("");const qty=Number(String(form.qty).replace(/,/g,""));if(!form.date||!form.customer||!form.product||!form.lot||!Number.isFinite(qty)||qty<=0){setError("출하일·고객사·제품·완제품 LOT·수량을 확인하세요.");return;}await save([{...form,qty,oqc:"검사대기",coa:"-",delivery:"-"},...rows]);setOpen(false);};
    const oqcPass=rows.filter(r=>r.oqc==="합격").length;const coaWait=rows.filter(r=>r.oqc==="합격"&&r.coa!=="발행").length;const total=rows.reduce((s,r)=>s+Number(r.qty||0),0);
    return <div className="qerp"><Header title="출하 · 납품관리" subtitle="OQC 합격 → CoA 발행 → 출하계획 → 배차/배송 → 고객 납품완료" status={syncStatus} actionLabel={open?"입력 닫기":"+ 출하계획"} onAction={()=>setOpen(v=>!v)}/><div className="qerp-kpis"><Kpi label="출하 예정" value={`${rows.length}건`}/><Kpi label="OQC 합격" value={`${oqcPass}건`} kind="green"/><Kpi label="CoA 발행대기" value={`${coaWait}건`} kind="orange"/><Kpi label="출하계획 수량" value={`${(total/1000).toFixed(1)}t`} kind="slate"/><Kpi label="납기 위험" value="0건" kind="red"/></div><div className="qerp-card">{open&&<form className="qerp-form" onSubmit={submit}><div className="qerp-field"><label>출하일</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="qerp-field"><label>수주번호</label><input value={form.sales} onChange={e=>setForm({...form,sales:e.target.value})} placeholder="SO-..."/></div><div className="qerp-field"><label>고객사</label><select value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}><option>현대자동차</option><option>삼성SDI</option><option>SK</option></select></div><div className="qerp-field"><label>제품</label><select value={form.product} onChange={e=>setForm({...form,product:e.target.value})}><option>전도 슬러리 A</option><option>전도 슬러리 B</option><option>Binder Solution</option></select></div><div className="qerp-field"><label>완제품 LOT</label><input value={form.lot} onChange={e=>setForm({...form,lot:e.target.value})} placeholder="FG-YYMMDD-01"/></div><div className="qerp-field"><label>수량 (kg)</label><input value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></div>{error&&<div className="qerp-error">{error}</div>}<div className="qerp-form-actions"><button type="button" className="qerp-btn ghost" onClick={()=>setOpen(false)}>취소</button><button type="submit" className="qerp-btn">출하계획 저장</button></div></form>}<div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>출하일</th><th>수주번호</th><th>고객사</th><th>제품</th><th>완제품 LOT</th><th>수량</th><th>OQC</th><th>CoA</th><th>배송</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${row.lot}-${index}`}><td>{shortDate(row.date)}</td><td>{row.sales||"-"}</td><td>{row.customer}</td><td>{row.product}</td><td><b>{row.lot}</b></td><td>{fmtQty(row.qty)}</td><td><Status>{row.oqc}</Status></td><td>{row.coa==="-"?"-":<Status>{row.coa}</Status>}</td><td>{row.delivery==="-"?"-":<Status>{row.delivery}</Status>}</td></tr>)}</tbody></table></div></div></div>;
  }

  window.QMESErpSalesTab=QMESErpSalesTab;
  window.QMESErpPlanTab=QMESErpPlanTab;
  window.QMESErpPurchaseTab=QMESErpPurchaseTab;
  window.QMESErpMasterTab=QMESErpMasterTab;
  window.QMESErpShippingTab=QMESErpShippingTab;

  try{
    if(typeof TABS!=="undefined"&&Array.isArray(TABS)){
      const additions=[
        {id:"erpSales",label:"수주 · 납기관리",icon:ClipboardList,comp:QMESErpSalesTab},
        {id:"erpPlan",label:"생산계획 · MRP",icon:BarChart3,comp:QMESErpPlanTab},
        {id:"erpPurchase",label:"구매 · 발주관리",icon:ArrowDownToLine,comp:QMESErpPurchaseTab},
        {id:"erpMaster",label:"Recipe / BOM",icon:FlaskConical,comp:QMESErpMasterTab},
        {id:"erpShipping",label:"출하 · 납품관리",icon:ArrowUpFromLine,comp:QMESErpShippingTab}
      ];
      additions.forEach(item=>{if(!TABS.some(existing=>existing.id===item.id))TABS.push(item);});
    }
    if(typeof TOP_MENUS!=="undefined"&&Array.isArray(TOP_MENUS)){
      const additions=[
        {id:"erpSales",label:"수주·납기",icon:ClipboardList},
        {id:"erpPlan",label:"생산계획·MRP",icon:BarChart3},
        {id:"erpPurchase",label:"구매·발주",icon:ArrowDownToLine},
        {id:"erpMaster",label:"Recipe/BOM",icon:FlaskConical},
        {id:"erpShipping",label:"출하·납품",icon:ArrowUpFromLine}
      ];
      additions.forEach(item=>{if(!TOP_MENUS.some(existing=>existing.id===item.id))TOP_MENUS.push(item);});
    }
  }catch(error){console.error("[QMES ERP] router registration failed",error);}

  window.dispatchEvent(new CustomEvent("qmes:erp-integrated-ready"));
})();
