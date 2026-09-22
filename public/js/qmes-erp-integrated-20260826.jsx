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

  function currentUserIsAdmin(){
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return String(user?.role||"").toLowerCase()==="admin";
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

  /* Legacy Sales visual renderer removed 2026-09-22.
   * This route can render ONLY the current stable Sales ledger owner.
   */
  function QMESErpSalesTab(){
    const Current=window.__QMES_CURRENT_SALES_LEDGER_COMPONENT__||window.QMESErpSalesTab;
    if(!Current||Current===QMESErpSalesTab) return null;
    return React.createElement(Current);
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
    return <div className="qerp qmes-erp-plan-page"><Header title="생산계획 · MRP" subtitle="수주와 Recipe를 기준으로 원료 필요량·가용재고·부족량 자동 계산" status={syncStatus} actionLabel="MRP 재계산" onAction={recalc}/>
      <div className="qerp-grid2"><div className="qerp-card"><h2>생산계획 입력</h2><div className="qerp-form" style={{marginBottom:0}}><div className="qerp-field"><label>생산일</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="qerp-field"><label>제품</label><select value={form.product} onChange={e=>setForm({...form,product:e.target.value})}><option>Binder Solution</option><option>전도 슬러리 A</option><option>전도 슬러리 B</option></select></div><div className="qerp-field"><label>계획량 (kg)</label><input value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></div><div className="qerp-field"><label>Recipe Revision</label><select value={form.revision} onChange={e=>setForm({...form,revision:e.target.value})}><option>Rev.03</option><option>Rev.02</option><option>Rev.01</option></select></div></div></div><div className="qerp-card"><h2>계획 판단</h2><div className="qerp-alerts"><div className="qerp-alert blue"><span>현재 생산 가능률</span><b>{possible.toFixed(1)}%</b></div><div className="qerp-alert red"><span>부족 원료</span><b>{shortageCount} 품목</b></div><div className="qerp-alert orange"><span>입고예정 반영</span><b>{mrp.filter(r=>r.incoming>0).length}건</b></div></div></div></div>
      <div className="qerp-card"><div className="qerp-card-head"><h2>MRP 소요량 계산</h2><span className="qerp-muted">계획 {fmtQty(qty)} · {form.revision}</span></div><div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>원료</th><th>배합비</th><th>필요량</th><th>가용재고</th><th>예약재고</th><th>입고예정</th><th>부족량</th><th>조치</th></tr></thead><tbody>{mrp.map(row=><tr key={row.material}><td><b>{row.material}</b></td><td>{row.ratio.toFixed(1)}%</td><td>{fmtQty(row.need)}</td><td>{fmtQty(row.available)}</td><td>{fmtQty(row.reserved)}</td><td>{fmtQty(row.incoming)}</td><td>{row.shortage>0?<b style={{color:"#dc2626"}}>{fmtQty(row.shortage)}</b>:"0 kg"}</td><td><Status>{row.shortage>0?"발주 필요":"충족"}</Status></td></tr>)}</tbody></table></div></div>
    </div>;
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
  window.QMESErpShippingTab=QMESErpShippingTab;

  try{
    if(typeof TABS!=="undefined"&&Array.isArray(TABS)){
      const additions=[
        {id:"erpSales",label:"수주 · 납기관리",icon:ClipboardList,comp:QMESErpSalesTab},
        {id:"erpPlan",label:"생산계획 · MRP",icon:BarChart3,comp:QMESErpPlanTab},
        {id:"erpShipping",label:"출하 · 납품관리",icon:ArrowUpFromLine,comp:QMESErpShippingTab}
      ];
      additions.forEach(item=>{if(!TABS.some(existing=>existing.id===item.id))TABS.push(item);});
    }
    if(typeof TOP_MENUS!=="undefined"&&Array.isArray(TOP_MENUS)){
      const additions=[
        {id:"erpSales",label:"수주·납기",icon:ClipboardList},
        {id:"erpPlan",label:"생산계획·MRP",icon:BarChart3},
        {id:"erpPurchase",label:"구매·발주",icon:ArrowDownToLine},
        {id:"erpShipping",label:"출하·납품",icon:ArrowUpFromLine}
      ];
      additions.forEach(item=>{if(!TOP_MENUS.some(existing=>existing.id===item.id))TOP_MENUS.push(item);});
    }
  }catch(error){console.error("[QMES ERP] router registration failed",error);}

  window.dispatchEvent(new CustomEvent("qmes:erp-integrated-ready"));
})();
