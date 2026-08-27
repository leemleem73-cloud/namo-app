/* QMES Sales edit controller — direct, stable, no DOM column patching — 2026-08-27 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_DIRECT_V6__) return;
  window.__QMES_SALES_EDIT_DIRECT_V6__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const MODAL_ID="qmes-sales-edit-direct-v6";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v;}catch(_){return f;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(_){}};
  const map=k=>{const v=read(k,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const rowById=id=>rows().find(r=>clean(r?.id)===clean(id))||null;
  const rowKey=r=>clean(r?.workOrder)||clean(r?.id);

  function ensureStyle(){
    if(document.getElementById("qmes-sales-edit-direct-v6-style")) return;
    const s=document.createElement("style");
    s.id="qmes-sales-edit-direct-v6-style";
    s.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483640!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.45)!important}
      #${MODAL_ID} .card{width:min(1120px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border:1px solid #d9e1ea!important;border-radius:16px!important;box-shadow:0 28px 90px rgba(15,23,42,.3)!important}
      #${MODAL_ID} .head{position:sticky!important;top:0!important;z-index:2!important;display:flex!important;justify-content:space-between!important;align-items:center!important;padding:18px 20px!important;border-bottom:1px solid #e2e8f0!important;background:#fff!important}
      #${MODAL_ID} h2{margin:0!important;font-size:20px!important;font-weight:950!important;color:#0f172a!important}#${MODAL_ID} .sub{margin-top:4px!important;font-size:11px!important;font-weight:700!important;color:#64748b!important}
      #${MODAL_ID} .body{padding:18px 20px 22px!important}#${MODAL_ID} .status{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin-bottom:18px!important}
      #${MODAL_ID} .status>div{padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:9px!important;background:#f8fafc!important;min-height:58px!important}#${MODAL_ID} .status b{display:block!important;font-size:9px!important;color:#64748b!important;margin-bottom:5px!important}#${MODAL_ID} .status span{font-size:12px!important;font-weight:850!important;color:#0f172a!important}
      #${MODAL_ID} .grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px 12px!important;margin-bottom:16px!important}#${MODAL_ID} .field{min-width:0!important}#${MODAL_ID} .field.wide{grid-column:1/-1!important}
      #${MODAL_ID} label{display:block!important;margin-bottom:5px!important;font-size:10px!important;font-weight:900!important;color:#475569!important}#${MODAL_ID} input,#${MODAL_ID} select{box-sizing:border-box!important;width:100%!important;height:38px!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:12px!important}
      #${MODAL_ID} .sales-id-input{font-weight:900!important;color:#1d4ed8!important;background:#f8fbff!important;border-color:#93c5fd!important}
      #${MODAL_ID} .section{margin:0 0 9px!important;font-size:12px!important;font-weight:950!important;color:#334155!important}#${MODAL_ID} .actions{display:flex!important;justify-content:flex-end!important;gap:8px!important}#${MODAL_ID} button{height:38px!important;padding:0 14px!important;border-radius:8px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .close,#${MODAL_ID} .cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}#${MODAL_ID} .save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
      #${MODAL_ID} .error{display:none!important;margin-bottom:12px!important;padding:9px 11px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:11px!important;font-weight:850!important}#${MODAL_ID} .error.show{display:block!important}
      @media(max-width:900px){#${MODAL_ID} .status,#${MODAL_ID} .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:620px){#${MODAL_ID}{padding:8px!important;align-items:flex-start!important}#${MODAL_ID} .status,#${MODAL_ID} .grid{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(s);
  }

  function buttonFromTarget(target){
    if(!(target instanceof Element)) return null;
    const direct=target.closest(".qmes-sales-edit-btn");
    if(direct) return direct;
    const button=target.closest("button");
    if(!button || clean(button.textContent)!=="수정") return null;
    const salesRoot=button.closest(".qmes-sales-stable") || button.closest(".qerp");
    const title=clean(salesRoot?.querySelector(".qerp-title")?.textContent);
    return title==="수주 · 납기관리" ? button : null;
  }

  function rowFromButton(button){
    const tr=button.closest("tr");
    if(!tr) return null;
    const cell=i=>clean(tr.children?.[i]?.textContent);
    const id=clean(button.dataset.salesId||button.dataset.qmesSalesEdit||tr.querySelector("[data-qso-id]")?.getAttribute("data-qso-id")||cell(0));
    const stored=rowById(id);
    if(stored) return stored;
    return {id,customer:cell(1),po:cell(2),product:clean(tr.children?.[3]?.childNodes?.[0]?.textContent)||cell(3),qty:num(cell(4)),due:"",plan:cell(8),shipping:cell(9),deliveryPlace:cell(10),source:"SCREEN"};
  }

  function close(){document.getElementById(MODAL_ID)?.remove();}

  function open(row){
    if(!row||!clean(row.id)) return false;
    ensureStyle(); close();
    const metaMap=map(META_KEY),packMap=map(PACK_KEY),remarkMap=map(REMARK_KEY),key=rowKey(row),id=clean(row.id);
    const meta=metaMap[id]||metaMap[key]||row.orderMeta||{};
    const pack=packMap[id]||packMap[key]||row.packaging||{};
    const remarks=clean(remarkMap[id]??remarkMap[key]??row.remarks);
    const modal=document.createElement("div"); modal.id=MODAL_ID;
    modal.innerHTML=`<div class="card" role="dialog" aria-modal="true" aria-label="수주 전체 수정"><div class="head"><div><h2>수주 전체 수정</h2><div class="sub">${esc(id)} · 작업지시/LOT ${esc(key||"-")}</div></div><button type="button" class="close" data-close="1">닫기</button></div><form class="body" data-sales-edit-form="1" data-id="${esc(id)}">
      <div class="status"><div><b>현재 수주번호</b><span>${esc(id)}</span></div><div><b>작업지시 / 생산 LOT</b><span>${esc(key||"-")}</span></div><div><b>생산계획</b><span>${esc(row.plan||"-")}</span></div><div><b>출하상태</b><span>${esc(row.shipping||"-")}</span></div></div>
      <h3 class="section">수주 기본정보</h3><div class="grid">
      <div class="field"><label>수주번호</label><input class="sales-id-input" name="salesOrderId" value="${esc(id)}" maxlength="60" autocomplete="off"></div><div class="field"><label>고객사</label><input name="customer" value="${esc(row.customer||"")}"></div><div class="field"><label>고객 PO</label><input name="po" value="${esc(row.po||"")}"></div><div class="field"><label>고객 품목코드</label><input name="customerItemCode" value="${esc(meta.customerItemCode||row.customerItemCode||"")}"></div>
      <div class="field"><label>수주구분</label><select name="orderType"><option ${clean(meta.orderType||row.orderType)==="양산"?"selected":""}>양산</option><option ${clean(meta.orderType||row.orderType)==="개발"?"selected":""}>개발</option><option ${clean(meta.orderType||row.orderType)==="샘플"?"selected":""}>샘플</option><option ${clean(meta.orderType||row.orderType)==="긴급"?"selected":""}>긴급</option></select></div><div class="field"><label>제품</label><input name="product" value="${esc(row.product||"")}"></div><div class="field"><label>수량 (kg)</label><input name="qty" value="${esc(row.qty||"")}"></div><div class="field"><label>요청 납기일</label><input type="date" name="due" value="${esc(clean(meta.requestedDue)||clean(row.due))}"></div>
      <div class="field"><label>납품처</label><input name="deliveryPlace" value="${esc(meta.deliveryPlace||row.deliveryPlace||"")}"></div></div>
      <h3 class="section">포장정보</h3><div class="grid"><div class="field"><label>포장형태</label><select name="packagingType"><option value="">선택</option><option ${clean(pack.type||pack.packagingType)==="CAN"?"selected":""}>CAN</option><option ${clean(pack.type||pack.packagingType)==="DRUM"?"selected":""}>DRUM</option><option ${clean(pack.type||pack.packagingType)==="IBC"?"selected":""}>IBC</option><option ${clean(pack.type||pack.packagingType)==="기타"?"selected":""}>기타</option></select></div><div class="field"><label>단위 포장량 (kg)</label><input type="number" step="0.001" name="unitWeight" value="${esc(pack.unitWeight??pack.unitPackQty??"")}"></div><div class="field"><label>포장수량 (EA)</label><input type="number" step="1" name="packageQty" value="${esc(pack.packageQty??"")}"></div><div class="field wide"><label>비고</label><input name="remarks" value="${esc(remarks)}"></div></div>
      <div class="error" data-error="1"></div><div class="actions"><button type="button" class="cancel" data-close="1">취소</button><button type="submit" class="save">수정 저장</button></div></form></div>`;
    document.body.appendChild(modal);
    modal.__salesRow=row;
    modal.querySelector('[name="salesOrderId"]')?.focus();
    return true;
  }

  async function save(form){
    const modal=document.getElementById(MODAL_ID),row=modal?.__salesRow;if(!row) return;
    const fd=new FormData(form),get=n=>clean(fd.get(n)),qty=num(get("qty")),unit=num(get("unitWeight")),count=num(get("packageQty")),type=get("packagingType");
    const error=form.querySelector('[data-error="1"]'),fail=m=>{if(error){error.textContent=m;error.classList.add("show");}return false;};
    const originalId=clean(row.id),newId=get("salesOrderId");
    if(!newId) return fail("수주번호를 입력하세요.");
    if(/\s/.test(String(fd.get("salesOrderId")||""))) return fail("수주번호에는 공백을 사용할 수 없습니다.");
    if(rows().some(r=>clean(r.id)===newId&&clean(r.id)!==originalId)) return fail("이미 사용 중인 수주번호입니다.");
    if(!get("customer")||!get("product")||qty<=0) return fail("고객사·제품·수량을 확인하세요.");

    const key=clean(row.workOrder)||originalId;
    const metaMap=map(META_KEY),packMap=map(PACK_KEY),remarkMap=map(REMARK_KEY),now=new Date().toISOString();
    const previousMeta=metaMap[originalId]||metaMap[key]||row.orderMeta||{};
    const meta={...previousMeta,salesOrderIdOverride:newId,customerOverride:get("customer"),poOverride:get("po")||"-",productOverride:get("product"),qtyOverride:qty,requestedDue:get("due"),customerItemCode:get("customerItemCode"),deliveryPlace:get("deliveryPlace"),orderType:get("orderType")||"양산",savedAt:now};
    metaMap[originalId]=meta;
    metaMap[newId]=meta;
    if(key)metaMap[key]=meta;
    write(META_KEY,metaMap);

    let packaging=null;
    const touched=Boolean(type||unit||count);
    if(touched){
      if(!type||unit<=0||count<=0)return fail("포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");
      packaging={type,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now};
      packMap[newId]=packaging;
      packMap[originalId]=packaging;
      if(key)packMap[key]=packaging;
    }else{
      delete packMap[newId];delete packMap[originalId];if(key)delete packMap[key];
    }
    write(PACK_KEY,packMap);

    const remarks=get("remarks");
    if(remarks){remarkMap[newId]=remarks;remarkMap[originalId]=remarks;if(key)remarkMap[key]=remarks;}
    else{delete remarkMap[newId];delete remarkMap[originalId];if(key)delete remarkMap[key];}
    write(REMARK_KEY,remarkMap);

    const updated={...row,id:newId,customer:get("customer"),po:get("po")||"-",product:get("product"),qty,due:get("due"),customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,remarks,orderMeta:meta,packaging,packagingType:packaging?.type||"",unitPackQty:packaging?.unitWeight||0,packageQty:packaging?.packageQty||0};
    const current=rows(),exists=current.some(r=>clean(r.id)===originalId),next=exists?current.map(r=>clean(r.id)===originalId?updated:r):[updated,...current];
    write(SALES_KEY,next);

    if(typeof window.qmesSalesFromWorkOrderApply==="function"){try{await window.qmesSalesFromWorkOrderApply();}catch(_){}}
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"DIRECT_EDIT_V6",oldId:originalId,newId}}));
    close();setTimeout(()=>window.location.reload(),80);
  }

  const handlePress=event=>{
    const button=buttonFromTarget(event.target);if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    const row=rowFromButton(button);if(row)open(row);
  };

  window.addEventListener("pointerdown",handlePress,true);
  window.addEventListener("click",handlePress,true);
  document.addEventListener("click",event=>{const target=event.target;if(!(target instanceof Element))return;if(target.closest("[data-close]")){event.preventDefault();close();return;}if(target===document.getElementById(MODAL_ID))close();},true);
  document.addEventListener("submit",event=>{const form=event.target instanceof Element?event.target.closest('[data-sales-edit-form="1"]'):null;if(!form)return;event.preventDefault();event.stopImmediatePropagation();save(form);},true);
  window.qmesSalesFullEdit20260827={open,openFromButton:button=>{const row=rowFromButton(button);return row?open(row):false;},close};
})();
