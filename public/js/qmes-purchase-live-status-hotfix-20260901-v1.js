/* NAMO QMES - live purchase order cleanup/status hotfix - 2026-09-01
 * Removes the Supplier A/B demonstration purchase orders from local/shared data.
 * Uses real purchase rows and derives delivery/IQC status from dates and inspection data.
 */
(function installLivePurchaseModule(global){
  "use strict";
  if(global.__QMES_PURCHASE_LIVE_STATUS_20260901_V1__) return;
  global.__QMES_PURCHASE_LIVE_STATUS_20260901_V1__=true;

  let installed=false;

  function compileAndInstall(){
    if(installed||!global.React||!global.Babel) return;
    installed=true;

    const source=String.raw`
window.QMESErpPurchaseTab=function QMESErpPurchaseTab(){
  const {useEffect,useMemo,useState}=React;
  const [rows,setRows]=useState([]);
  const [remoteIqc,setRemoteIqc]=useState([]);
  const [syncStatus,setSyncStatus]=useState("loading");
  const [open,setOpen]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState({supplier:"",material:"",qty:"",due:"",expected:""});

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const num=value=>{const parsed=Number(clean(value).replace(/,/g,""));return Number.isFinite(parsed)?parsed:0;};
  const today=()=>{const date=new Date();return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");};
  const validDate=value=>/^20\d{2}-\d{2}-\d{2}$/.test(clean(value));
  const shortDate=value=>{const text=clean(value);return text.length>=10?text.slice(5,10).replace("-","/"):"-";};
  const fmtQty=value=>Number(value||0).toLocaleString("ko-KR",{maximumFractionDigits:3})+" kg";
  const currentUser=()=>{const user=globalThis.__QMES_CURRENT_USER__||globalThis.__QMES_USER__||{};return clean(user?.name||user?.uid||user);};
  const isDemo=row=>(clean(row?.id)==="PO-260824-01"&&/^Supplier A$/i.test(clean(row?.supplier)))||(clean(row?.id)==="PO-260824-02"&&/^Supplier B$/i.test(clean(row?.supplier)));
  const parsePayload=record=>{const value=record?.payload;if(value&&typeof value==="object")return value;if(typeof value==="string"){try{return JSON.parse(value);}catch(_error){}}return {};};
  const pass=value=>/^(합격|적합|PASS|OK|APPROVED)$/i.test(clean(value));
  const fail=value=>/불합격|부적합|FAIL|NG|REJECT/i.test(clean(value));

  const writeLocal=next=>{try{localStorage.setItem("qmes-erp-purchase-v1",JSON.stringify(next));}catch(_error){}};
  const readLocal=()=>{try{const value=JSON.parse(localStorage.getItem("qmes-erp-purchase-v1")||"[]");return Array.isArray(value)?value:[];}catch(_error){return [];}};

  const persist=async next=>{
    const normalized=(Array.isArray(next)?next:[]).filter(row=>!isDemo(row));
    setRows(normalized);writeLocal(normalized);setSyncStatus("saving");
    if(typeof globalThis.qmesSyncUpsert!=="function"){setSyncStatus("local");return;}
    try{
      await globalThis.qmesSyncUpsert("inventory","erp:purchase",{module:"erp",schema:2,kind:"purchase",rows:normalized,updatedAt:new Date().toISOString(),updatedBy:currentUser()});
      setSyncStatus("shared");
      globalThis.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"purchase"}}));
    }catch(syncError){console.warn("[QMES Purchase] shared save failed",syncError);setSyncStatus("local");}
  };

  useEffect(()=>{
    let active=true;
    (async()=>{
      let purchaseRows=readLocal(),status="local",iqcRows=[];
      if(typeof globalThis.qmesSyncList==="function"){
        try{
          const [inventoryRecords,iqcRecords]=await Promise.all([globalThis.qmesSyncList("inventory"),globalThis.qmesSyncList("iqc")]);
          const purchaseRecord=(Array.isArray(inventoryRecords)?inventoryRecords:[]).find(record=>clean(record?.record_key)==="erp:purchase");
          const purchasePayload=parsePayload(purchaseRecord);
          if(Array.isArray(purchasePayload.rows))purchaseRows=purchasePayload.rows;
          (Array.isArray(iqcRecords)?iqcRecords:[]).forEach(record=>{const payload=parsePayload(record);if(!payload.deleted&&Array.isArray(payload.rows))payload.rows.forEach(row=>iqcRows.push(row));});
          status="shared";
        }catch(loadError){console.warn("[QMES Purchase] shared load failed",loadError);}
      }
      if(!active)return;
      const cleaned=(Array.isArray(purchaseRows)?purchaseRows:[]).filter(row=>!isDemo(row));
      setRows(cleaned);setRemoteIqc(iqcRows);writeLocal(cleaned);setSyncStatus(status);
      if(cleaned.length!==(Array.isArray(purchaseRows)?purchaseRows.length:0))await persist(cleaned);
    })();
    return()=>{active=false;};
  },[]);

  const visibleRows=useMemo(()=>rows.filter(row=>!isDemo(row)),[rows]);
  const localIqc=[...(Array.isArray(globalThis.DB?.insp?.IQC)?globalThis.DB.insp.IQC:[]),...(Array.isArray(globalThis.DB?.iqc)?globalThis.DB.iqc:[]),...(Array.isArray(globalThis.DB?.iqcRecords)?globalThis.DB.iqcRecords:[])];
  const allIqc=[...localIqc,...remoteIqc];
  const linkedIqc=row=>{const id=clean(row?.id);return allIqc.filter(record=>[record?.purchaseOrder,record?.purchaseOrderNo,record?.po,record?.poNo,record?.orderNo,record?.referenceNo,record?.sourceNo].map(clean).includes(id));};
  const daysFromToday=value=>{if(!validDate(value))return null;const base=new Date(today()+"T00:00:00").getTime(),target=new Date(clean(value)+"T00:00:00").getTime();return Math.round((target-base)/86400000);};
  const stateFor=row=>{
    const manual=clean(row?.status),linked=linkedIqc(row),judges=linked.map(record=>clean(record?.judge||record?.judgment||record?.result||record?.status)).filter(Boolean);
    if(/취소/.test(manual))return {iqc:"-",status:"발주취소"};
    if(judges.some(fail))return {iqc:"불합격",status:"IQC 부적합"};
    if(judges.some(pass))return {iqc:"합격",status:"IQC 완료"};
    if(linked.length)return {iqc:"검사중",status:"IQC 진행"};
    const received=Boolean(row?.receivedAt||row?.receiptDate||row?.arrivalDate||/입고완료|입고확정/.test(manual));
    if(received)return {iqc:"검사대기",status:"입고완료 · IQC 대기"};
    const expectedDays=daysFromToday(row?.expected||row?.expectedDate);
    if(expectedDays!=null&&expectedDays<0)return {iqc:"입고대기",status:"입고지연 "+Math.abs(expectedDays)+"일"};
    const dueDays=daysFromToday(row?.due||row?.dueDate);
    if(dueDays!=null&&dueDays<0)return {iqc:"입고대기",status:"납기초과 "+Math.abs(dueDays)+"일"};
    if(expectedDays===0)return {iqc:"입고대기",status:"입고예정 오늘"};
    if(expectedDays!=null&&expectedDays>0)return {iqc:"입고대기",status:"입고예정"};
    return {iqc:"입고대기",status:"발주완료"};
  };
  const toneFor=value=>/불합격|부적합|지연|초과/.test(clean(value))?"red":/완료|합격/.test(clean(value))?"green":/예정|진행/.test(clean(value))?"blue":/대기/.test(clean(value))?"orange":"slate";
  const Status=({children})=><span className={"qerp-status "+toneFor(children)}>{children}</span>;
  const syncLabel=syncStatus==="shared"?"공용 DB 연동":syncStatus==="saving"?"저장 중":syncStatus==="loading"?"불러오는 중":"로컬 임시";

  const resetForm=()=>setForm({supplier:"",material:"",qty:"",due:"",expected:""});
  const submit=async event=>{
    event.preventDefault();setError("");const quantity=num(form.qty);
    if(!clean(form.supplier)||!clean(form.material)||!validDate(form.due)||quantity<=0){setError("실제 협력사명·원료명·발주량·요청납기를 확인하세요.");return;}
    if(clean(form.expected)&&!validDate(form.expected)){setError("입고예정일을 확인하세요.");return;}
    const stamp=today().replace(/-/g,""),prefix="PO-"+stamp+"-";let sequence=1;
    while(visibleRows.some(row=>clean(row.id)===prefix+String(sequence).padStart(3,"0")))sequence++;
    const nextRow={id:prefix+String(sequence).padStart(3,"0"),supplier:clean(form.supplier),material:clean(form.material),qty:quantity,orderDate:today(),due:clean(form.due),expected:clean(form.expected),iqc:"입고대기",status:"발주완료",source:"MANUAL",createdAt:new Date().toISOString(),createdBy:currentUser()};
    await persist([nextRow,...visibleRows]);resetForm();setOpen(false);
  };
  const openDetail=row=>{const state=stateFor(row);alert("발주번호: "+clean(row.id)+"\n협력사: "+clean(row.supplier)+"\n원료: "+clean(row.material)+"\n발주량: "+fmtQty(row.qty)+"\n요청납기: "+clean(row.due||"-")+"\n입고예정: "+clean(row.expected||"-")+"\nIQC: "+state.iqc+"\n상태: "+state.status);};
  const editPurchase=async row=>{
    const supplier=prompt("협력사",clean(row.supplier));if(supplier===null)return;const material=prompt("원료명",clean(row.material));if(material===null)return;const qtyText=prompt("발주량 (kg)",String(row.qty||""));if(qtyText===null)return;const due=prompt("요청납기 (YYYY-MM-DD)",clean(row.due));if(due===null)return;const expected=prompt("입고예정 (YYYY-MM-DD, 미정이면 빈칸)",clean(row.expected));if(expected===null)return;const quantity=num(qtyText);
    if(!supplier.trim()||!material.trim()||quantity<=0||!validDate(due)||(expected.trim()&&!validDate(expected))){alert("협력사·원료·수량·날짜를 확인하세요.");return;}
    await persist(visibleRows.map(item=>clean(item.id)===clean(row.id)?{...item,supplier:supplier.trim(),material:material.trim(),qty:quantity,due:due.trim(),expected:expected.trim(),updatedAt:new Date().toISOString(),updatedBy:currentUser()}:item));
  };
  const cancelPurchase=async row=>{if(!confirm(clean(row.id)+" 발주를 취소하시겠습니까?"))return;await persist(visibleRows.map(item=>clean(item.id)===clean(row.id)?{...item,status:"발주취소",cancelledAt:new Date().toISOString(),cancelledBy:currentUser()}:item));};

  return <div className="qerp qmes-purchase-live">
    <div className="qerp-head"><div><h1 className="qerp-title">구매 · 발주관리</h1><div className="qerp-sub">MRP 부족 원료를 실제 협력사 발주 → 입고 → IQC까지 연결</div></div><div className="qerp-head-actions"><span className={"qerp-sync "+syncStatus}>{syncLabel}</span><button type="button" className="qerp-btn" onClick={()=>setOpen(value=>!value)}>{open?"입력 닫기":"+ 발주서 생성"}</button></div></div>
    <div className="qerp-card">
      {open&&<form className="qerp-form" onSubmit={submit}><div className="qerp-field"><label>협력사</label><input value={form.supplier} onChange={event=>setForm({...form,supplier:event.target.value})} placeholder="실제 협력사명 입력" autoComplete="off"/></div><div className="qerp-field"><label>원료</label><input value={form.material} onChange={event=>setForm({...form,material:event.target.value})} placeholder="실제 원료명 또는 코드" autoComplete="off"/></div><div className="qerp-field"><label>발주량 (kg)</label><input inputMode="decimal" value={form.qty} onChange={event=>setForm({...form,qty:event.target.value})} placeholder="0"/></div><div className="qerp-field"><label>요청납기</label><input type="date" value={form.due} onChange={event=>setForm({...form,due:event.target.value})}/></div><div className="qerp-field"><label>입고예정</label><input type="date" value={form.expected} onChange={event=>setForm({...form,expected:event.target.value})}/></div>{error&&<div className="qerp-error">{error}</div>}<div className="qerp-form-actions"><button type="button" className="qerp-btn ghost" onClick={()=>{resetForm();setOpen(false);setError("");}}>취소</button><button type="submit" className="qerp-btn">발주 저장</button></div></form>}
      <div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>발주번호</th><th>협력사</th><th>원료</th><th>발주량</th><th>발주일</th><th>요청납기</th><th>입고예정</th><th>IQC 연계</th><th>상태</th><th>관리</th></tr></thead><tbody>{visibleRows.map(row=>{const state=stateFor(row);return <tr key={row.id}><td><button type="button" className="qmes-purchase-order-link" onClick={()=>openDetail(row)}>{row.id}</button></td><td>{row.supplier||"-"}</td><td>{row.material||"-"}</td><td>{fmtQty(row.qty)}</td><td>{shortDate(row.orderDate||row.createdAt)}</td><td>{shortDate(row.due)}</td><td>{shortDate(row.expected)}</td><td><Status>{state.iqc}</Status></td><td><Status>{state.status}</Status></td><td><div className="qmes-purchase-actions"><button type="button" className="qmes-purchase-edit" onClick={()=>editPurchase(row)}>수정</button><button type="button" className="qmes-purchase-cancel" onClick={()=>cancelPurchase(row)}>취소</button></div></td></tr>;})}{visibleRows.length===0&&<tr><td colSpan="10" className="qmes-purchase-empty">등록된 실제 발주가 없습니다. MRP 부족 원료를 확인한 후 발주서를 생성하세요.</td></tr>}</tbody></table></div>
    </div>
  </div>;
};
`;

    try{
      const compiled=global.Babel.transform(source,{presets:["react"],sourceType:"script",filename:"qmes-purchase-live-status-hotfix-20260901-v1.js"}).code;
      (0,eval)(compiled);
      ensureStyle();
      global.dispatchEvent(new CustomEvent("qmes:erp-integrated-ready"));
    }catch(error){
      installed=false;
      console.error("[QMES Purchase] live purchase module installation failed",error);
    }
  }

  function ensureStyle(){
    if(document.getElementById("qmes-purchase-live-20260901-style")) return;
    const style=document.createElement("style");
    style.id="qmes-purchase-live-20260901-style";
    style.textContent=`
      .qmes-purchase-live .qmes-purchase-order-link{border:0;background:transparent;color:#1d4ed8;font:inherit;font-weight:950;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
      .qmes-purchase-live .qmes-purchase-actions{display:flex;align-items:center;justify-content:center;gap:6px}
      .qmes-purchase-live .qmes-purchase-edit,.qmes-purchase-live .qmes-purchase-cancel{height:28px;padding:0 8px;border-radius:6px;font-size:10px;font-weight:900;cursor:pointer;background:#fff}
      .qmes-purchase-live .qmes-purchase-edit{border:1px solid #bfdbfe;color:#1d4ed8;background:#eff6ff}.qmes-purchase-live .qmes-purchase-cancel{border:1px solid #fecaca;color:#b91c1c}
      .qmes-purchase-live .qmes-purchase-empty{text-align:center!important;color:#94a3b8!important;padding:28px 10px!important}
      .qmes-purchase-live .qerp-table th,.qmes-purchase-live .qerp-table td{text-align:center}.qmes-purchase-live .qerp-table th:nth-child(2),.qmes-purchase-live .qerp-table td:nth-child(2),.qmes-purchase-live .qerp-table th:nth-child(3),.qmes-purchase-live .qerp-table td:nth-child(3){text-align:left}
    `;
    document.head.appendChild(style);
  }

  global.addEventListener("qmes:erp-integrated-ready",compileAndInstall);
  if(typeof global.QMESErpPurchaseTab==="function") queueMicrotask(compileAndInstall);
})(window);
