/* QMES ERP runtime loader — stable first paint 2026-08-27 */
(function(){
  if(window.__QMES_ERP_RUNTIME_LOADER_20260826__) return;
  window.__QMES_ERP_RUNTIME_LOADER_20260826__=true;

  function loadScript(src,id){
    return new Promise((resolve,reject)=>{
      if(id&&document.getElementById(id)){resolve();return;}
      const script=document.createElement('script');
      if(id) script.id=id;
      script.src=src;
      script.async=false;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error('Script load failed: '+src));
      document.head.appendChild(script);
    });
  }

  function ensureStableSalesStyle(){
    if(document.getElementById('qmes-sales-stable-firstpaint-20260827')) return;
    const style=document.createElement('style');
    style.id='qmes-sales-stable-firstpaint-20260827';
    style.textContent=`
      .qmes-sales-stable .qmes-sales-plain-status{display:inline-block!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;font-size:11px!important;font-weight:850!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-plain-status.good{color:#15803d!important}.qmes-sales-stable .qmes-sales-plain-status.warn{color:#c2410c!important}.qmes-sales-stable .qmes-sales-plain-status.bad{color:#b91c1c!important}.qmes-sales-stable .qmes-sales-plain-status.neutral{color:#64748b!important}
      .qmes-sales-stable .qmes-sales-packaging-missing{display:inline-block!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#c2410c!important;font-size:11px!important;font-weight:850!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-packaging-text{font-size:11px!important;font-weight:850!important;color:#334155!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-subtext{display:block!important;margin-top:2px!important;color:#64748b!important;font-size:9px!important;font-weight:700!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-action-head,.qmes-sales-stable .qmes-sales-action-cell{width:108px!important;min-width:108px!important;text-align:center!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-action-wrap{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-edit-btn,.qmes-sales-stable .qmes-sales-delete-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;height:30px!important;padding:0 8px!important;border-radius:6px!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important;background:#fff!important}
      .qmes-sales-stable .qmes-sales-edit-btn{border:1px solid #bfdbfe!important;color:#1d4ed8!important;background:#eff6ff!important}.qmes-sales-stable .qmes-sales-delete-btn{border:1px solid #fecaca!important;color:#b91c1c!important}
      .qmes-sales-stable .qmes-sales-order-link{border:0!important;background:transparent!important;color:#1d4ed8!important;font:inherit!important;font-weight:950!important;cursor:pointer!important;padding:0!important;text-decoration:underline!important;text-underline-offset:3px!important}
      .qmes-sales-stable #qmes-sales-progress-button-20260826{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important;border-radius:8px!important;padding:9px 12px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      .qmes-sales-stable .qerp-sales-compact-form{visibility:visible!important;opacity:1!important}
    `;
    document.head.appendChild(style);
  }

  function stableSalesComponentSource(){
    return String.raw`
  function QMESErpSalesTab(){
    const PACK_KEY="qmes-sales-packaging-v1";
    const REMARK_KEY="qmes-sales-remarks-v1";
    const META_KEY="qmes-sales-order-meta-v1";
    const DELETED_KEY="qmes-sales-deleted-v1";
    const {rows,save,syncStatus}=useSharedRows("sales",SALES_DEFAULT);
    const [open,setOpen]=useState(false);
    const [error,setError]=useState("");
    const [form,setForm]=useState({customer:"현대자동차",po:"",due:"",product:"",qty:"",customerItemCode:"",deliveryPlace:"",orderType:"양산",packagingType:"",unitWeight:"",packageQty:"",remarks:""});

    const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
    const num=value=>{const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;};
    const readMap=key=>{try{const value=JSON.parse(localStorage.getItem(key)||"{}");return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}catch(_error){return {};}};
    const writeMap=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_error){}};
    const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
    const metaFor=row=>{const map=readMap(META_KEY);return map[clean(row?.id)]||map[rowKey(row)]||row?.orderMeta||{};};
    const packFor=row=>{const map=readMap(PACK_KEY);return map[clean(row?.id)]||map[rowKey(row)]||row?.packaging||(row?.packagingType||row?.unitPackQty||row?.packageQty?{type:row.packagingType,unitWeight:row.unitPackQty,packageQty:row.packageQty}:null);};
    const packText=row=>{const p=packFor(row);if(!p)return "";const type=clean(p.type||p.packagingType),unit=num(p.unitWeight??p.unitPackQty),count=num(p.packageQty);const parts=[];if(type)parts.push(type);if(unit&&count)parts.push(unit.toLocaleString("ko-KR",{maximumFractionDigits:3})+"kg × "+count.toLocaleString("ko-KR")+"EA");else if(unit)parts.push(unit.toLocaleString("ko-KR",{maximumFractionDigits:3})+"kg/EA");else if(count)parts.push(count.toLocaleString("ko-KR")+"EA");return parts.join(" · ");};
    const dueState=row=>{const shipping=clean(row?.shipping);if(/출하완료/.test(shipping))return {label:"완료",tone:"good"};const due=clean(row?.due);if(!/^20\d{2}-\d{2}-\d{2}$/.test(due))return {label:"-",tone:"neutral"};const today=new Date();today.setHours(0,0,0,0);const dueTime=new Date(due+"T00:00:00").getTime();const days=Math.round((dueTime-today.getTime())/86400000);if(days<0)return {label:"지연 "+Math.abs(days)+"일",tone:"bad"};if(days<=7)return {label:"임박 D-"+days,tone:"warn"};return {label:"정상",tone:"good"};};
    const statusTone=value=>/차단|불합격|지연|위험/.test(clean(value))?"bad":/대기|미입력|임박/.test(clean(value))?"warn":/완료|반영|정상|합격/.test(clean(value))?"good":"neutral";

    const total=rows.reduce((sum,row)=>sum+Number(row.qty||0),0);
    const dueSoon=rows.filter(row=>{if(!row.due)return false;const time=new Date(row.due+"T23:59:59").getTime()-Date.now();return time>=0&&time<=7*86400000;}).length;
    const risk=rows.filter(row=>/위험|지연|차단/.test(String(row.shipping||""))).length;

    const resetForm=()=>setForm({customer:"현대자동차",po:"",due:"",product:"",qty:"",customerItemCode:"",deliveryPlace:"",orderType:"양산",packagingType:"",unitWeight:"",packageQty:"",remarks:""});

    const submit=async event=>{
      event.preventDefault();setError("");
      const qty=num(form.qty),unit=num(form.unitWeight),count=num(form.packageQty),packTouched=Boolean(clean(form.packagingType)||unit||count);
      if(!clean(form.customer)||!clean(form.product)||!clean(form.due)||qty<=0){setError("고객사·제품·납기일·수량을 확인하세요.");return;}
      if(packTouched&&(!clean(form.packagingType)||unit<=0||count<=0)){setError("포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");return;}
      const d=new Date(),stamp=String(d.getFullYear())+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0");
      let seq=1;while(rows.some(row=>clean(row.id)===("SO-"+stamp+"-"+String(seq).padStart(3,"0"))))seq++;
      const id="SO-"+stamp+"-"+String(seq).padStart(3,"0"),now=new Date().toISOString();
      const packaging=packTouched?{type:clean(form.packagingType),unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now}:null;
      const meta={customerItemCode:clean(form.customerItemCode),deliveryPlace:clean(form.deliveryPlace),orderType:clean(form.orderType)||"양산",orderDate:now.slice(0,10),productOverride:clean(form.product),savedAt:now,savedBy:currentUserName()};
      if(packaging){const map=readMap(PACK_KEY);map[id]=packaging;writeMap(PACK_KEY,map);}
      if(clean(form.remarks)){const map=readMap(REMARK_KEY);map[id]=clean(form.remarks);writeMap(REMARK_KEY,map);}
      {const map=readMap(META_KEY);map[id]=meta;writeMap(META_KEY,map);}
      const nextRow={id,customer:clean(form.customer),po:clean(form.po)||"-",product:clean(form.product),qty,due:clean(form.due),plan:"계획대기",shipping:"-",source:"MANUAL",packaging,packagingType:packaging?.type||"",unitPackQty:packaging?.unitWeight||0,packageQty:packaging?.packageQty||0,remarks:clean(form.remarks),orderMeta:meta,customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,orderDate:meta.orderDate};
      await save([nextRow,...rows]);resetForm();setOpen(false);
    };

    const editSales=async row=>{
      const meta=metaFor(row);
      const customer=window.prompt("고객사",clean(row.customer));if(customer===null)return;
      const po=window.prompt("고객 PO",clean(row.po));if(po===null)return;
      const due=window.prompt("요청 납기일 (YYYY-MM-DD)",clean(row.due));if(due===null)return;
      const product=window.prompt("제품",clean(meta.productOverride)||clean(row.product));if(product===null)return;
      const qtyText=window.prompt("수량 (kg)",String(row.qty||""));if(qtyText===null)return;
      const deliveryPlace=window.prompt("납품처",clean(meta.deliveryPlace)||clean(row.deliveryPlace));if(deliveryPlace===null)return;
      const qty=num(qtyText);
      if(!customer.trim()||!product.trim()||qty<=0){window.alert("고객사·제품·수량을 확인하세요.");return;}
      if(due.trim()&&!/^20\d{2}-\d{2}-\d{2}$/.test(due.trim())){window.alert("요청 납기일은 YYYY-MM-DD 형식으로 입력하세요.");return;}
      const id=clean(row.id),key=rowKey(row),metaMap=readMap(META_KEY),nextMeta={...meta,customerOverride:customer.trim(),poOverride:po.trim()||"-",productOverride:product.trim(),qtyOverride:qty,requestedDue:due.trim(),deliveryPlace:deliveryPlace.trim(),savedAt:new Date().toISOString(),savedBy:currentUserName()};
      metaMap[id]=nextMeta;if(key&&key!==id)metaMap[key]=nextMeta;writeMap(META_KEY,metaMap);
      if(key&&key!==id&&typeof window.qmesSalesSyncProductToWorkOrder==="function"){try{await window.qmesSalesSyncProductToWorkOrder(key,product.trim());}catch(_error){}}
      const next=rows.map(item=>clean(item.id)===id?{...item,customer:customer.trim(),po:po.trim()||"-",product:product.trim(),qty,due:due.trim(),deliveryPlace:deliveryPlace.trim(),orderMeta:nextMeta}:item);
      await save(next);
    };

    const deleteSales=async row=>{
      const id=clean(row.id);if(!id)return;
      if(!window.confirm(id+" 수주를 목록에서 삭제하시겠습니까?\n작업지시·검사 원본 데이터는 삭제되지 않습니다."))return;
      const key=rowKey(row),deleted=(()=>{try{const value=JSON.parse(localStorage.getItem(DELETED_KEY)||"[]");return Array.isArray(value)?value:[];}catch(_error){return [];}})().filter(item=>clean(item?.id)!==id&&(!key||clean(item?.workOrder)!==key));
      deleted.push({id,workOrder:key,deletedAt:new Date().toISOString(),deletedBy:currentUserName()});
      try{localStorage.setItem(DELETED_KEY,JSON.stringify(deleted.slice(-500)));}catch(_error){}
      [PACK_KEY,REMARK_KEY,META_KEY].forEach(storageKey=>{const map=readMap(storageKey);delete map[id];if(key)delete map[key];writeMap(storageKey,map);});
      await save(rows.filter(item=>clean(item.id)!==id));
    };

    const openProgress=()=>{const first=rows[0];if(!first){window.alert("수주 데이터가 없습니다.");return;}if(window.qmesSalesOrderDetail?.open)window.qmesSalesOrderDetail.open(first.id);};

    return <div className="qerp qmes-sales-stable">
      <div className="qerp-head"><div><h1 className="qerp-title">수주 · 납기관리</h1><div className="qerp-sub">고객 PO를 생산계획 및 출하계획의 시작점으로 관리</div></div><div className="qerp-head-actions"><SyncBadge status={syncStatus}/><button id="qmes-sales-progress-button-20260826" type="button" onClick={openProgress}>수주 진행현황</button><button type="button" className="qerp-btn" onClick={()=>setOpen(value=>!value)}>{open?"입력 닫기":"+ 신규 수주"}</button></div></div>
      <div className="qerp-kpis"><Kpi label="진행 수주" value={rows.length+"건"}/><Kpi label="7일 이내 납기" value={dueSoon+"건"} kind="orange"/><Kpi label="납기 준수율" value="96.8%" kind="green"/><Kpi label="지연 위험" value={risk+"건"} kind="red"/><Kpi label="수주량 합계" value={(total/1000).toFixed(1)+"t"} kind="slate"/></div>
      <div className="qerp-card">
        {open&&<form className="qerp-form qerp-sales-compact-form" onSubmit={submit}>
          <div className="qerp-field"><label>고객사</label><select value={form.customer} onChange={event=>setForm({...form,customer:event.target.value})}><option>현대자동차</option><option>삼성SDI</option><option>SK</option><option>기타</option></select></div>
          <div className="qerp-field"><label>고객 PO 번호</label><input value={form.po} onChange={event=>setForm({...form,po:event.target.value})} placeholder="고객 PO 번호"/></div>
          <div className="qerp-field"><label>요청 납기일</label><input type="date" value={form.due} onChange={event=>setForm({...form,due:event.target.value})}/></div>
          <div className="qerp-field"><label>제품</label><input value={form.product} onChange={event=>setForm({...form,product:event.target.value})} placeholder="제품명 직접 입력" autoComplete="off"/></div>
          <div className="qerp-field"><label>수량 (kg)</label><input inputMode="decimal" value={form.qty} onChange={event=>setForm({...form,qty:event.target.value})}/></div>
          <div className="qerp-field qmes-sales-extra-field" data-qmes-sales-meta="customerItemCode"><label>고객 품목코드</label><input value={form.customerItemCode} onChange={event=>setForm({...form,customerItemCode:event.target.value})} placeholder="고객 품목코드"/></div>
          <div className="qerp-field qmes-sales-extra-field" data-qmes-sales-meta="deliveryPlace"><label>납품처</label><input value={form.deliveryPlace} onChange={event=>setForm({...form,deliveryPlace:event.target.value})} placeholder="납품처 / 공장"/></div>
          <div className="qerp-field qmes-sales-extra-field" data-qmes-sales-meta="orderType"><label>수주구분</label><select value={form.orderType} onChange={event=>setForm({...form,orderType:event.target.value})}><option>양산</option><option>개발</option><option>샘플</option><option>긴급</option></select></div>
          <div className="qerp-field qmes-sales-pack-field" data-qmes-sales-meta="type"><label>포장형태</label><select value={form.packagingType} onChange={event=>setForm({...form,packagingType:event.target.value})}><option value="">선택</option><option>CAN</option><option>DRUM</option><option>IBC</option><option>기타</option></select></div>
          <div className="qerp-field qmes-sales-pack-field" data-qmes-sales-meta="unitWeight"><label>단위 포장량(kg)</label><input type="number" min="0" step="0.001" value={form.unitWeight} onChange={event=>setForm({...form,unitWeight:event.target.value})} placeholder="kg/EA"/></div>
          <div className="qerp-field qmes-sales-pack-field" data-qmes-sales-meta="packageQty"><label>포장수량(EA)</label><input type="number" min="0" step="1" value={form.packageQty} onChange={event=>setForm({...form,packageQty:event.target.value})} placeholder="EA"/></div>
          <div className="qerp-field qmes-sales-remark-field" data-qmes-sales-meta="remarks"><label>비고</label><input value={form.remarks} onChange={event=>setForm({...form,remarks:event.target.value})} placeholder="비고 입력"/></div>
          {error&&<div className="qerp-error">{error}</div>}
          <div className="qerp-form-actions"><button type="button" className="qerp-btn ghost" onClick={()=>{resetForm();setOpen(false);setError("");}}>취소</button><button type="submit" className="qerp-btn">수주 저장</button></div>
        </form>}
        <div className="qerp-table-wrap"><table className="qerp-table"><thead><tr><th>수주번호</th><th>고객사</th><th>고객 PO</th><th>제품</th><th>수량</th><th>포장정보</th><th>납기일</th><th>납기상태</th><th>생산계획</th><th>출하상태</th><th>납품처</th><th className="qmes-sales-action-head">비고</th></tr></thead><tbody>{rows.map(row=>{const meta=metaFor(row),pack=packText(row),due=dueState(row),code=clean(meta.customerItemCode)||clean(row.customerItemCode),delivery=clean(meta.deliveryPlace)||clean(row.deliveryPlace)||"-";return <tr key={row.id}><td><button type="button" className="qmes-sales-order-link" data-qso-id={row.id} onClick={()=>window.qmesSalesOrderDetail?.open?.(row.id)}>{row.id}</button></td><td>{row.customer}</td><td>{row.po||"-"}</td><td>{row.product||"-"}{code&&<span className="qmes-sales-subtext">고객품번 {code}</span>}</td><td>{fmtQty(row.qty)}</td><td>{pack?<span className="qmes-sales-packaging-text">{pack}</span>:<span className="qmes-sales-packaging-missing">포장정보 미입력</span>}</td><td>{shortDate(row.due)}</td><td><span className={"qmes-sales-plain-status "+due.tone}>{due.label}</span></td><td><span className={"qmes-sales-plain-status "+statusTone(row.plan)}>{row.plan||"-"}</span></td><td><span className={"qmes-sales-plain-status "+statusTone(row.shipping)}>{row.shipping||"-"}</span></td><td>{delivery}</td><td className="qmes-sales-action-cell"><div className="qmes-sales-action-wrap"><button type="button" className="qmes-sales-edit-btn" onClick={()=>editSales(row)}>수정</button><button type="button" className="qmes-sales-delete-btn" onClick={()=>deleteSales(row)}>삭제</button></div></td></tr>;})}</tbody></table></div>
      </div>
    </div>;
  }
`;
  }

  function patchStableSales(source){
    const start=source.indexOf('  function QMESErpSalesTab(){');
    const end=source.indexOf('\n\n  function QMESErpPlanTab(){',start);
    if(start<0||end<0) throw new Error('Sales component markers not found');
    return source.slice(0,start)+stableSalesComponentSource()+source.slice(end);
  }

  async function load(){
    if(window.__QMES_ERP_INTEGRATED_20260826__) return;
    if(!window.Babel){console.error('[QMES ERP] Babel runtime is not available.');return;}
    try{
      ensureStableSalesStyle();
      await loadScript('./js/qmes-sales-demo-reset-20260826.js?v=20260827-manual-product2','qmes-sales-from-workorder-20260826');
      if(window.__QMES_SALES_FROM_WORKORDER_READY__){try{await window.__QMES_SALES_FROM_WORKORDER_READY__;}catch(_error){}}
      const response=await fetch('./js/qmes-erp-integrated-20260826.jsx?v=20260827-manual-product2',{cache:'no-store'});
      if(!response.ok) throw new Error('ERP module fetch failed: '+response.status);
      const originalSource=await response.text();
      const source=patchStableSales(originalSource);
      const compiled=window.Babel.transform(source,{presets:['react'],sourceType:'script',filename:'qmes-erp-integrated-20260826.jsx'}).code;
      (0,eval)(compiled);
      window.dispatchEvent(new CustomEvent('qmes:erp-runtime-loaded'));
    }catch(error){console.error('[QMES ERP] runtime load failed',error);}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
