/* NAMO QMES — full sales edit modal + stable action handler — 2026-08-27 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FULL_EDIT_20260827__) return;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const MODAL_ID="qmes-sales-full-edit-20260827";
  let activeRow=null;
  let lastOpenAt=0;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
  const map=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const rowById=id=>rows().find(row=>clean(row?.id)===clean(id))||null;
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=row=>{const m=map(META_KEY),key=rowKey(row);return m[clean(row?.id)]||m[key]||row?.orderMeta||{};};
  const packFor=row=>{const m=map(PACK_KEY),key=rowKey(row);return m[clean(row?.id)]||m[key]||row?.packaging||{};};
  const remarkFor=row=>{const m=map(REMARK_KEY),key=rowKey(row);return clean(m[clean(row?.id)]??m[key]??row?.remarks);};

  function close(){document.getElementById(MODAL_ID)?.remove();activeRow=null;}

  function rowFromDom(id,tr){
    if(!tr)return null;
    const cell=i=>clean(tr.children?.[i]?.textContent);
    const productCell=tr.children?.[3];
    const product=clean(productCell?.childNodes?.[0]?.textContent)||cell(3);
    return {
      id:clean(id)||cell(0),
      customer:cell(1),
      po:cell(2),
      product,
      qty:num(cell(4)),
      due:"",
      plan:cell(8),
      shipping:cell(9),
      deliveryPlace:cell(10),
      source:"SCREEN"
    };
  }

  function resolveRow(id,fallbackRow,tr){
    return rowById(id)||(fallbackRow&&typeof fallbackRow==="object"?fallbackRow:null)||rowFromDom(id,tr);
  }

  function modalHtml(row){
    const meta=metaFor(row),pack=packFor(row),key=rowKey(row);
    const productionDate=clean(row.productionDate)||"-";
    const orderDate=clean(meta.orderDate)||"-";
    const requestedDue=clean(meta.requestedDue)||clean(row.due);
    return `<div class="qse-card" role="dialog" aria-modal="true" aria-label="수주 전체 수정">
      <div class="qse-head"><div><h2 class="qse-title">수주 전체 수정</h2><div class="qse-sub">${esc(row.id)} · 작업지시/LOT ${esc(key||"-")}</div></div><button type="button" class="qse-close" data-qse-close="1">닫기</button></div>
      <form class="qse-body" data-qse-form="1" data-qse-id="${esc(row.id)}">
        <div class="qse-status-grid">
          <div class="qse-status"><b>수주번호</b><span>${esc(row.id)}</span></div>
          <div class="qse-status"><b>작업지시 / 생산 LOT</b><span>${esc(key||"-")}</span></div>
          <div class="qse-status"><b>생산계획</b><span>${esc(row.plan||"-")}</span></div>
          <div class="qse-status"><b>출하상태</b><span>${esc(row.shipping||"-")}</span></div>
          <div class="qse-status"><b>수주일자</b><span>${esc(orderDate)}</span></div>
          <div class="qse-status"><b>생산일자</b><span>${esc(productionDate)}</span></div>
          <div class="qse-status"><b>원본 출처</b><span>${esc(row.source||"-")}</span></div>
          <div class="qse-status"><b>현재 수량</b><span>${esc(Number(row.qty||0).toLocaleString("ko-KR"))} kg</span></div>
        </div>
        <h3 class="qse-section-title">수주 기본정보</h3>
        <div class="qse-grid">
          <div class="qse-field"><label>고객사</label><input name="customer" value="${esc(row.customer||"")}" /></div>
          <div class="qse-field"><label>고객 PO</label><input name="po" value="${esc(row.po||"")}" /></div>
          <div class="qse-field"><label>고객 품목코드</label><input name="customerItemCode" value="${esc(meta.customerItemCode||row.customerItemCode||"")}" /></div>
          <div class="qse-field"><label>수주구분</label><select name="orderType"><option ${clean(meta.orderType||row.orderType)==="양산"?"selected":""}>양산</option><option ${clean(meta.orderType||row.orderType)==="개발"?"selected":""}>개발</option><option ${clean(meta.orderType||row.orderType)==="샘플"?"selected":""}>샘플</option><option ${clean(meta.orderType||row.orderType)==="긴급"?"selected":""}>긴급</option></select></div>
          <div class="qse-field"><label>제품</label><input name="product" value="${esc(row.product||"")}" /></div>
          <div class="qse-field"><label>수량 (kg)</label><input name="qty" inputmode="decimal" value="${esc(row.qty||"")}" /></div>
          <div class="qse-field"><label>요청 납기일</label><input name="due" type="date" value="${esc(requestedDue)}" /></div>
          <div class="qse-field"><label>납품처</label><input name="deliveryPlace" value="${esc(meta.deliveryPlace||row.deliveryPlace||"")}" /></div>
        </div>
        <h3 class="qse-section-title">포장정보</h3>
        <div class="qse-grid">
          <div class="qse-field"><label>포장형태</label><select name="packagingType"><option value="">선택</option><option ${clean(pack.type||pack.packagingType)==="CAN"?"selected":""}>CAN</option><option ${clean(pack.type||pack.packagingType)==="DRUM"?"selected":""}>DRUM</option><option ${clean(pack.type||pack.packagingType)==="IBC"?"selected":""}>IBC</option><option ${clean(pack.type||pack.packagingType)==="기타"?"selected":""}>기타</option></select></div>
          <div class="qse-field"><label>단위 포장량 (kg)</label><input name="unitWeight" type="number" min="0" step="0.001" value="${esc(pack.unitWeight??pack.unitPackQty??"")}" /></div>
          <div class="qse-field"><label>포장수량 (EA)</label><input name="packageQty" type="number" min="0" step="1" value="${esc(pack.packageQty??"")}" /></div>
          <div class="qse-field"><label>포장 총량 (kg)</label><input class="qse-readonly" name="packTotal" readonly value="${esc(num(pack.total)||(num(pack.unitWeight??pack.unitPackQty)*num(pack.packageQty))||"")}" /></div>
          <div class="qse-field span4"><label>비고</label><input name="remarks" value="${esc(remarkFor(row))}" /></div>
        </div>
        <div class="qse-error" data-qse-error="1"></div>
        <div class="qse-actions"><button type="button" class="qse-cancel" data-qse-close="1">취소</button><button type="submit" class="qse-save">수정 저장</button></div>
      </form>
    </div>`;
  }

  function open(id,fallbackRow,tr){
    const now=Date.now();
    const row=resolveRow(id,fallbackRow,tr);
    if(!row){window.alert("수주 데이터를 찾을 수 없습니다.");return false;}
    if(document.getElementById(MODAL_ID)&&now-lastOpenAt<350)return true;
    lastOpenAt=now;
    close();
    activeRow={...row,id:clean(row.id||id)};
    const modal=document.createElement("div");
    modal.id=MODAL_ID;
    modal.style.position="fixed";
    modal.style.inset="0";
    modal.style.zIndex="19000";
    modal.style.display="flex";
    modal.style.alignItems="center";
    modal.style.justifyContent="center";
    modal.style.padding="22px";
    modal.style.background="rgba(15,23,42,.38)";
    modal.innerHTML=modalHtml(activeRow);
    document.body.appendChild(modal);
    const unit=modal.querySelector('[name="unitWeight"]'),count=modal.querySelector('[name="packageQty"]'),total=modal.querySelector('[name="packTotal"]');
    const recalc=()=>{const value=num(unit?.value)*num(count?.value);if(total)total.value=value?String(Number(value.toFixed(3))):"";};
    unit?.addEventListener("input",recalc);count?.addEventListener("input",recalc);
    modal.querySelector('[name="customer"]')?.focus();
    return true;
  }

  async function syncShared(nextRows){
    write(SALES_KEY,nextRows);
    if(typeof window.qmesSyncUpsert==="function"){
      try{await window.qmesSyncUpsert("inventory","erp:sales",{module:"erp",schema:1,kind:"sales",rows:nextRows,updatedAt:new Date().toISOString(),updatedBy:clean(window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__?.name||"")});}catch(_error){}
    }
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_FULL_EDIT"}}));
  }

  async function saveForm(form){
    const id=clean(form.dataset.qseId),row=rowById(id)||activeRow;
    if(!row){window.alert("수주 데이터를 찾을 수 없습니다.");return false;}
    const fd=new FormData(form),get=name=>clean(fd.get(name));
    const qty=num(get("qty")),unit=num(get("unitWeight")),count=num(get("packageQty")),type=get("packagingType");
    const error=form.querySelector('[data-qse-error="1"]');
    const fail=message=>{if(error){error.textContent=message;error.classList.add("is-open");}return false;};
    if(!get("customer")||!get("product")||qty<=0)return fail("고객사·제품·수량을 확인하세요.");
    if(get("due")&&!/^20\d{2}-\d{2}-\d{2}$/.test(get("due")))return fail("요청 납기일은 YYYY-MM-DD 형식으로 입력하세요.");
    const packTouched=Boolean(type||unit||count);if(packTouched&&(!type||unit<=0||count<=0))return fail("포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");
    if(error)error.classList.remove("is-open");

    const key=rowKey(row),now=new Date().toISOString(),metaMap=map(META_KEY),packMap=map(PACK_KEY),remarkMap=map(REMARK_KEY);
    const previous=metaFor(row),nextMeta={...previous,customerOverride:get("customer"),poOverride:get("po")||"-",productOverride:get("product"),qtyOverride:qty,requestedDue:get("due"),customerItemCode:get("customerItemCode"),deliveryPlace:get("deliveryPlace"),orderType:get("orderType")||"양산",savedAt:now};
    metaMap[id]=nextMeta;if(key&&key!==id)metaMap[key]=nextMeta;write(META_KEY,metaMap);

    if(packTouched){const pack={type,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now};packMap[id]=pack;if(key&&key!==id)packMap[key]=pack;}
    else{delete packMap[id];if(key&&key!==id)delete packMap[key];}
    write(PACK_KEY,packMap);

    const remarks=get("remarks");if(remarks){remarkMap[id]=remarks;if(key&&key!==id)remarkMap[key]=remarks;}else{delete remarkMap[id];if(key&&key!==id)delete remarkMap[key];}write(REMARK_KEY,remarkMap);

    const updated={...row,id,customer:get("customer"),po:get("po")||"-",product:get("product"),qty,due:get("due"),customerItemCode:nextMeta.customerItemCode,deliveryPlace:nextMeta.deliveryPlace,orderType:nextMeta.orderType,remarks,orderMeta:nextMeta,packaging:packTouched?packMap[id]:null,packagingType:packTouched?type:"",unitPackQty:packTouched?unit:0,packageQty:packTouched?count:0};
    const currentRows=rows();
    const hasCurrent=currentRows.some(item=>clean(item.id)===id);
    const nextRows=hasCurrent?currentRows.map(item=>clean(item.id)===id?updated:item):[updated,...currentRows];
    await syncShared(nextRows);
    if(typeof window.qmesSalesFromWorkOrderApply==="function"){try{await window.qmesSalesFromWorkOrderApply();}catch(_error){}}
    close();
    setTimeout(()=>window.location.reload(),80);
    return true;
  }

  function editButtonFromEvent(event){
    const target=event.target;
    if(!(target instanceof Element))return null;
    return target.closest(".qmes-sales-edit-btn");
  }

  function openFromButton(button){
    if(!button)return false;
    const tr=button.closest("tr");
    const id=clean(button.dataset.salesId||button.dataset.qmesSalesEdit||tr?.querySelector("[data-qso-id]")?.getAttribute("data-qso-id")||tr?.children?.[0]?.textContent);
    if(!id)return false;
    return open(id,null,tr);
  }

  document.addEventListener("pointerup",event=>{
    const edit=editButtonFromEvent(event);if(!edit)return;
    if(document.getElementById(MODAL_ID))return;
    event.preventDefault();event.stopPropagation();openFromButton(edit);
  },true);

  document.addEventListener("click",event=>{
    const edit=editButtonFromEvent(event);
    if(edit){
      event.preventDefault();event.stopImmediatePropagation();openFromButton(edit);return;
    }
    const target=event.target;
    if(target instanceof Element&&target.closest("[data-qse-close]")){event.preventDefault();close();return;}
    if(target===document.getElementById(MODAL_ID))close();
  },true);

  document.addEventListener("submit",event=>{
    const target=event.target;
    const form=target instanceof Element?target.closest('[data-qse-form="1"]'):null;if(!form)return;
    event.preventDefault();event.stopImmediatePropagation();saveForm(form);
  },true);

  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.getElementById(MODAL_ID))close();});
  window.qmesSalesFullEdit20260827={open,close,openFromButton};
})();
