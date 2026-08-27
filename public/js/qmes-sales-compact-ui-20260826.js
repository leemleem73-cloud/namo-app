/* QMES Sales compatibility controller — 2026-08-27
 * Legacy table mutation is retired. This direct-loaded file owns one thing only:
 * the Sales "수정" button and its full edit modal. It is self-contained so the
 * button works even if the master loader or another patch is cached/late.
 */
(function installSalesEditController(){
  "use strict";
  if(window.__QMES_SALES_DIRECT_EDIT_20260827__)return;
  window.__QMES_SALES_DIRECT_EDIT_20260827__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const MODAL_ID="qmes-sales-direct-edit-20260827";
  let activeRow=null;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
  const readMap=key=>{const value=read(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};
  const rows=()=>{const value=read(SALES_KEY,[]);return Array.isArray(value)?value:[];};
  const rowById=id=>rows().find(row=>clean(row?.id)===clean(id))||null;
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);

  function ensureStyle(){
    if(document.getElementById("qmes-sales-direct-edit-style-20260827"))return;
    const style=document.createElement("style");
    style.id="qmes-sales-direct-edit-style-20260827";
    style.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(15,23,42,.42)!important}
      #${MODAL_ID} .qse-card{width:min(1120px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border:1px solid #d9e1ea!important;border-radius:16px!important;box-shadow:0 28px 90px rgba(15,23,42,.30)!important}
      #${MODAL_ID} .qse-head{position:sticky!important;top:0!important;z-index:2!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;padding:18px 20px!important;border-bottom:1px solid #e2e8f0!important;background:#fff!important}
      #${MODAL_ID} .qse-title{margin:0!important;color:#0f172a!important;font-size:20px!important;font-weight:950!important}
      #${MODAL_ID} .qse-sub{margin-top:4px!important;color:#64748b!important;font-size:11px!important;font-weight:700!important}
      #${MODAL_ID} .qse-close{border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#334155!important;padding:8px 12px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .qse-body{padding:18px 20px 22px!important}
      #${MODAL_ID} .qse-status-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin-bottom:18px!important}
      #${MODAL_ID} .qse-status{min-height:64px!important;padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:9px!important;background:#f8fafc!important}
      #${MODAL_ID} .qse-status b{display:block!important;margin-bottom:5px!important;color:#64748b!important;font-size:9px!important;font-weight:900!important}
      #${MODAL_ID} .qse-status span{display:block!important;color:#0f172a!important;font-size:12px!important;font-weight:850!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #${MODAL_ID} .qse-section-title{margin:0 0 9px!important;color:#334155!important;font-size:12px!important;font-weight:950!important}
      #${MODAL_ID} .qse-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px 12px!important;margin-bottom:16px!important}
      #${MODAL_ID} .qse-field{min-width:0!important}#${MODAL_ID} .qse-field.span4{grid-column:1/-1!important}
      #${MODAL_ID} .qse-field label{display:block!important;margin-bottom:5px!important;color:#475569!important;font-size:10px!important;font-weight:900!important}
      #${MODAL_ID} .qse-field input,#${MODAL_ID} .qse-field select{box-sizing:border-box!important;width:100%!important;height:38px!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:12px!important;outline:none!important}
      #${MODAL_ID} .qse-field input:focus,#${MODAL_ID} .qse-field select:focus{border-color:#60a5fa!important;box-shadow:0 0 0 2px rgba(96,165,250,.15)!important}
      #${MODAL_ID} .qse-readonly{background:#f8fafc!important;color:#64748b!important}
      #${MODAL_ID} .qse-error{display:none!important;margin:0 0 12px!important;padding:9px 11px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:11px!important;font-weight:850!important}
      #${MODAL_ID} .qse-error.is-open{display:block!important}
      #${MODAL_ID} .qse-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important}
      #${MODAL_ID} .qse-actions button{height:38px!important;min-width:88px!important;border-radius:8px!important;padding:0 14px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .qse-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}#${MODAL_ID} .qse-save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
      @media(max-width:900px){#${MODAL_ID} .qse-status-grid,#${MODAL_ID} .qse-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:620px){#${MODAL_ID}{padding:10px!important;align-items:flex-start!important}#${MODAL_ID} .qse-status-grid,#${MODAL_ID} .qse-grid{grid-template-columns:1fr!important}#${MODAL_ID} .qse-field.span4{grid-column:1!important}}
    `;
    document.head.appendChild(style);
  }

  function rowFromTable(tr,id){
    const cell=index=>clean(tr?.children?.[index]?.textContent);
    const productNode=tr?.children?.[3]?.childNodes?.[0];
    return {
      id:clean(id)||cell(0),customer:cell(1),po:cell(2),product:clean(productNode?.textContent)||cell(3),qty:num(cell(4)),due:"",
      plan:cell(8),shipping:cell(9),deliveryPlace:cell(10),source:"SCREEN"
    };
  }

  function resolveRow(button){
    const tr=button?.closest("tr");
    const id=clean(button?.dataset?.salesId||button?.dataset?.qmesSalesEdit||tr?.querySelector("[data-qso-id]")?.getAttribute("data-qso-id")||tr?.children?.[0]?.textContent);
    if(!id)return null;
    return rowById(id)||rowFromTable(tr,id);
  }

  function metaFor(row){const map=readMap(META_KEY),key=rowKey(row);return map[clean(row.id)]||map[key]||row.orderMeta||{};}
  function packFor(row){const map=readMap(PACK_KEY),key=rowKey(row);return map[clean(row.id)]||map[key]||row.packaging||{};}
  function remarkFor(row){const map=readMap(REMARK_KEY),key=rowKey(row);return clean(map[clean(row.id)]??map[key]??row.remarks);}

  function close(){document.getElementById(MODAL_ID)?.remove();activeRow=null;}

  function html(row){
    const meta=metaFor(row),pack=packFor(row),key=rowKey(row),due=clean(meta.requestedDue)||clean(row.due);
    return `<div class="qse-card" role="dialog" aria-modal="true" aria-label="수주 전체 수정">
      <div class="qse-head"><div><h2 class="qse-title">수주 전체 수정</h2><div class="qse-sub">${esc(row.id)} · 작업지시/LOT ${esc(key||"-")}</div></div><button type="button" class="qse-close" data-qse-close="1">닫기</button></div>
      <form class="qse-body" data-qse-form="1" data-qse-id="${esc(row.id)}">
        <div class="qse-status-grid">
          <div class="qse-status"><b>수주번호</b><span>${esc(row.id)}</span></div><div class="qse-status"><b>작업지시 / 생산 LOT</b><span>${esc(key||"-")}</span></div>
          <div class="qse-status"><b>생산계획</b><span>${esc(row.plan||"-")}</span></div><div class="qse-status"><b>출하상태</b><span>${esc(row.shipping||"-")}</span></div>
          <div class="qse-status"><b>수주일자</b><span>${esc(meta.orderDate||"-")}</span></div><div class="qse-status"><b>생산일자</b><span>${esc(row.productionDate||"-")}</span></div>
          <div class="qse-status"><b>원본 출처</b><span>${esc(row.source||"-")}</span></div><div class="qse-status"><b>현재 수량</b><span>${esc(Number(row.qty||0).toLocaleString("ko-KR"))} kg</span></div>
        </div>
        <h3 class="qse-section-title">수주 기본정보</h3><div class="qse-grid">
          <div class="qse-field"><label>고객사</label><input name="customer" value="${esc(row.customer||"")}"></div>
          <div class="qse-field"><label>고객 PO</label><input name="po" value="${esc(row.po||"")}"></div>
          <div class="qse-field"><label>고객 품목코드</label><input name="customerItemCode" value="${esc(meta.customerItemCode||row.customerItemCode||"")}"></div>
          <div class="qse-field"><label>수주구분</label><select name="orderType"><option ${clean(meta.orderType||row.orderType)==="양산"?"selected":""}>양산</option><option ${clean(meta.orderType||row.orderType)==="개발"?"selected":""}>개발</option><option ${clean(meta.orderType||row.orderType)==="샘플"?"selected":""}>샘플</option><option ${clean(meta.orderType||row.orderType)==="긴급"?"selected":""}>긴급</option></select></div>
          <div class="qse-field"><label>제품</label><input name="product" value="${esc(row.product||"")}"></div>
          <div class="qse-field"><label>수량 (kg)</label><input name="qty" inputmode="decimal" value="${esc(row.qty||"")}"></div>
          <div class="qse-field"><label>요청 납기일</label><input name="due" type="date" value="${esc(due)}"></div>
          <div class="qse-field"><label>납품처</label><input name="deliveryPlace" value="${esc(meta.deliveryPlace||row.deliveryPlace||"")}"></div>
        </div>
        <h3 class="qse-section-title">포장정보</h3><div class="qse-grid">
          <div class="qse-field"><label>포장형태</label><select name="packagingType"><option value="">선택</option><option ${clean(pack.type||pack.packagingType)==="CAN"?"selected":""}>CAN</option><option ${clean(pack.type||pack.packagingType)==="DRUM"?"selected":""}>DRUM</option><option ${clean(pack.type||pack.packagingType)==="IBC"?"selected":""}>IBC</option><option ${clean(pack.type||pack.packagingType)==="기타"?"selected":""}>기타</option></select></div>
          <div class="qse-field"><label>단위 포장량 (kg)</label><input name="unitWeight" type="number" min="0" step="0.001" value="${esc(pack.unitWeight??pack.unitPackQty??"")}"></div>
          <div class="qse-field"><label>포장수량 (EA)</label><input name="packageQty" type="number" min="0" step="1" value="${esc(pack.packageQty??"")}"></div>
          <div class="qse-field"><label>포장 총량 (kg)</label><input class="qse-readonly" name="packTotal" readonly value="${esc(num(pack.total)||(num(pack.unitWeight??pack.unitPackQty)*num(pack.packageQty))||"")}"></div>
          <div class="qse-field span4"><label>비고</label><input name="remarks" value="${esc(remarkFor(row))}"></div>
        </div><div class="qse-error" data-qse-error="1"></div>
        <div class="qse-actions"><button type="button" class="qse-cancel" data-qse-close="1">취소</button><button type="submit" class="qse-save">수정 저장</button></div>
      </form></div>`;
  }

  function openRow(row){
    if(!row||!clean(row.id))return false;
    ensureStyle();close();activeRow={...row};
    const modal=document.createElement("div");modal.id=MODAL_ID;modal.innerHTML=html(activeRow);document.body.appendChild(modal);
    const unit=modal.querySelector('[name="unitWeight"]'),count=modal.querySelector('[name="packageQty"]'),total=modal.querySelector('[name="packTotal"]');
    const recalc=()=>{const value=num(unit?.value)*num(count?.value);if(total)total.value=value?String(Number(value.toFixed(3))):"";};
    unit?.addEventListener("input",recalc);count?.addEventListener("input",recalc);modal.querySelector('[name="customer"]')?.focus();return true;
  }

  function openFromButton(button){const row=resolveRow(button);return row?openRow(row):false;}
  function open(id,fallbackRow,tr){const row=rowById(id)||(fallbackRow&&typeof fallbackRow==="object"?fallbackRow:null)||rowFromTable(tr,id);return row?openRow({...row,id:clean(row.id||id)}):false;}

  async function saveForm(form){
    const row=rowById(clean(form.dataset.qseId))||activeRow;if(!row)return false;
    const fd=new FormData(form),get=name=>clean(fd.get(name));
    const qty=num(get("qty")),unit=num(get("unitWeight")),count=num(get("packageQty")),type=get("packagingType"),error=form.querySelector('[data-qse-error="1"]');
    const fail=message=>{if(error){error.textContent=message;error.classList.add("is-open");}return false;};
    if(!get("customer")||!get("product")||qty<=0)return fail("고객사·제품·수량을 확인하세요.");
    if(get("due")&&!/^20\d{2}-\d{2}-\d{2}$/.test(get("due")))return fail("요청 납기일은 YYYY-MM-DD 형식으로 입력하세요.");
    const packTouched=Boolean(type||unit||count);if(packTouched&&(!type||unit<=0||count<=0))return fail("포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");
    if(error)error.classList.remove("is-open");

    const id=clean(row.id),key=rowKey(row),now=new Date().toISOString(),metaMap=readMap(META_KEY),packMap=readMap(PACK_KEY),remarkMap=readMap(REMARK_KEY);
    const nextMeta={...(metaFor(row)),customerOverride:get("customer"),poOverride:get("po")||"-",productOverride:get("product"),qtyOverride:qty,requestedDue:get("due"),customerItemCode:get("customerItemCode"),deliveryPlace:get("deliveryPlace"),orderType:get("orderType")||"양산",savedAt:now};
    metaMap[id]=nextMeta;if(key&&key!==id)metaMap[key]=nextMeta;write(META_KEY,metaMap);
    let packaging=null;if(packTouched){packaging={type,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now};packMap[id]=packaging;if(key&&key!==id)packMap[key]=packaging;}else{delete packMap[id];if(key&&key!==id)delete packMap[key];}write(PACK_KEY,packMap);
    const remarks=get("remarks");if(remarks){remarkMap[id]=remarks;if(key&&key!==id)remarkMap[key]=remarks;}else{delete remarkMap[id];if(key&&key!==id)delete remarkMap[key];}write(REMARK_KEY,remarkMap);

    const updated={...row,customer:get("customer"),po:get("po")||"-",product:get("product"),qty,due:get("due"),customerItemCode:nextMeta.customerItemCode,deliveryPlace:nextMeta.deliveryPlace,orderType:nextMeta.orderType,remarks,orderMeta:nextMeta,packaging,packagingType:packaging?.type||"",unitPackQty:packaging?.unitWeight||0,packageQty:packaging?.packageQty||0};
    const current=rows(),exists=current.some(item=>clean(item.id)===id),next=exists?current.map(item=>clean(item.id)===id?updated:item):[updated,...current];write(SALES_KEY,next);
    if(typeof window.qmesSyncUpsert==="function"){try{await window.qmesSyncUpsert("inventory","erp:sales",{module:"erp",schema:1,kind:"sales",rows:next,updatedAt:now});}catch(_){}}
    if(typeof window.qmesSalesFromWorkOrderApply==="function"){try{await window.qmesSalesFromWorkOrderApply();}catch(_){}}
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_DIRECT_EDIT"}}));close();setTimeout(()=>window.location.reload(),80);return true;
  }

  ensureStyle();
  document.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    const edit=target.closest(".qmes-sales-edit-btn");
    if(edit){event.preventDefault();event.stopImmediatePropagation();openFromButton(edit);return;}
    if(target.closest("[data-qse-close]")){event.preventDefault();close();return;}
    if(target===document.getElementById(MODAL_ID))close();
  },true);
  document.addEventListener("submit",event=>{const form=event.target instanceof Element?event.target.closest('[data-qse-form="1"]'):null;if(!form)return;event.preventDefault();event.stopImmediatePropagation();saveForm(form);},true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.getElementById(MODAL_ID))close();});

  window.qmesSalesFullEdit20260827={open,openFromButton,close};
})();
