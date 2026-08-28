/* NAMO QMES - New Sales Order enterprise modal V1 - 2026-08-28
 * ADD-ONLY PATCH. Existing Sales runtime remains intact.
 * Replaces only the '+ 신규 수주' entry UX with a clean enterprise modal.
 * ERP-only concepts (ATP / revenue / accounting / cost / ERP labels) are intentionally excluded.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_ENTERPRISE_20260828_V1__)return;
  window.__QMES_SALES_NEW_ORDER_ENTERPRISE_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const MODAL_ID="qmes-sales-new-order-enterprise-20260828-v1";
  const STYLE_ID="qmes-sales-new-order-enterprise-style-20260828-v1";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const currentUser=()=>clean(window.__QMES_USER__?.name||window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__||window.__QMES_CURRENT_USER__)||"관리자";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147482500!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(15,23,42,.38)!important;font-family:inherit!important}
      #${MODAL_ID} .qsn-card{width:min(1040px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border:1px solid #dfe5ec!important;border-radius:15px!important;box-shadow:0 28px 90px rgba(15,23,42,.28)!important}
      #${MODAL_ID} .qsn-head{position:sticky!important;top:0!important;z-index:2!important;display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:16px!important;padding:20px 22px 16px!important;background:#fff!important;border-bottom:1px solid #e8edf3!important}
      #${MODAL_ID} .qsn-title{margin:0!important;color:#111827!important;font-size:20px!important;font-weight:950!important;letter-spacing:-.02em!important}
      #${MODAL_ID} .qsn-sub{margin-top:5px!important;color:#7b8798!important;font-size:10px!important;font-weight:700!important}
      #${MODAL_ID} .qsn-close{width:36px!important;height:36px!important;border:1px solid #dce3eb!important;border-radius:9px!important;background:#fff!important;color:#475569!important;font-size:20px!important;cursor:pointer!important}
      #${MODAL_ID} .qsn-body{padding:18px 22px 22px!important}
      #${MODAL_ID} .qsn-section{margin-bottom:18px!important}
      #${MODAL_ID} .qsn-section-title{display:flex!important;align-items:center!important;gap:8px!important;margin:0 0 10px!important;color:#263247!important;font-size:11px!important;font-weight:950!important}
      #${MODAL_ID} .qsn-section-title:before{content:"";width:3px;height:14px;border-radius:99px;background:#2563eb}
      #${MODAL_ID} .qsn-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:11px 12px!important}
      #${MODAL_ID} .qsn-field{min-width:0!important}
      #${MODAL_ID} .qsn-field.w2{grid-column:span 2!important}
      #${MODAL_ID} .qsn-field.full{grid-column:1/-1!important}
      #${MODAL_ID} label{display:block!important;margin:0 0 5px!important;color:#596579!important;font-size:9.5px!important;font-weight:900!important}
      #${MODAL_ID} label em{color:#dc2626!important;font-style:normal!important;margin-left:2px!important}
      #${MODAL_ID} input,#${MODAL_ID} select,#${MODAL_ID} textarea{box-sizing:border-box!important;width:100%!important;border:1px solid #d5dde7!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font-family:inherit!important;font-size:11px!important;font-weight:700!important;outline:none!important}
      #${MODAL_ID} input,#${MODAL_ID} select{height:39px!important;padding:0 10px!important}
      #${MODAL_ID} textarea{min-height:72px!important;padding:10px!important;resize:vertical!important}
      #${MODAL_ID} input:focus,#${MODAL_ID} select:focus,#${MODAL_ID} textarea:focus{border-color:#7aa8f8!important;box-shadow:0 0 0 3px rgba(37,99,235,.08)!important}
      #${MODAL_ID} .qsn-id-wrap{display:grid!important;grid-template-columns:1fr auto!important;gap:7px!important}
      #${MODAL_ID} .qsn-auto{height:39px!important;padding:0 11px!important;border:1px solid #cdd8e7!important;border-radius:8px!important;background:#f8fafc!important;color:#334155!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important;white-space:nowrap!important}
      #${MODAL_ID} .qsn-help{margin-top:4px!important;color:#94a3b8!important;font-size:8.5px!important;font-weight:700!important}
      #${MODAL_ID} .qsn-summary{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin:4px 0 18px!important;padding:11px!important;border:1px solid #e5eaf0!important;border-radius:10px!important;background:#f8fafc!important}
      #${MODAL_ID} .qsn-summary div{min-width:0!important}.qsn-summary small{display:block!important;margin-bottom:4px!important;color:#94a3b8!important;font-size:8px!important;font-weight:800!important}.qsn-summary b{display:block!important;color:#263247!important;font-size:10.5px!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #${MODAL_ID} .qsn-error{display:none!important;margin-bottom:12px!important;padding:10px 11px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:10.5px!important;font-weight:850!important}.qsn-error.show{display:block!important}
      #${MODAL_ID} .qsn-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding-top:4px!important}
      #${MODAL_ID} .qsn-actions button{height:39px!important;padding:0 15px!important;border-radius:8px!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .qsn-cancel{border:1px solid #d7dee7!important;background:#fff!important;color:#475569!important}
      #${MODAL_ID} .qsn-save{border:1px solid #1859d1!important;background:#1859d1!important;color:#fff!important;min-width:100px!important}
      #${MODAL_ID} .qsn-save[disabled]{opacity:.55!important;cursor:wait!important}
      .qmes-sales-stable .qerp-sales-compact-form{display:none!important}
      @media(max-width:900px){#${MODAL_ID} .qsn-grid,#${MODAL_ID} .qsn-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:620px){#${MODAL_ID}{padding:8px!important;align-items:flex-start!important}#${MODAL_ID} .qsn-grid,#${MODAL_ID} .qsn-summary{grid-template-columns:1fr!important}#${MODAL_ID} .qsn-field.w2{grid-column:span 1!important}}
    `;
    document.head.appendChild(style);
  }

  function dateMinusOne(dateText){
    const value=clean(dateText);if(!/^20\d{2}-\d{2}-\d{2}$/.test(value))return "";
    const d=new Date(value+"T00:00:00");if(Number.isNaN(d.getTime()))return "";
    d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function visibleIds(){
    const map=readMap(META_KEY),set=new Set();
    rows().forEach(row=>{const id=clean(row?.id),key=clean(row?.workOrder)||id,meta=map[key]||map[id]||row?.orderMeta||{};set.add(clean(meta.salesOrderIdOverride)||id);});
    return set;
  }

  function nextId(due){
    const orderDate=dateMinusOne(due)||new Date().toISOString().slice(0,10);
    const stamp=orderDate.replace(/-/g,"");
    const used=visibleIds();
    let seq=1,id="";
    do{id=`SO-${stamp}-${String(seq++).padStart(3,"0")}`;}while(used.has(id));
    return id;
  }

  function close(){document.getElementById(MODAL_ID)?.remove();document.documentElement.style.overflow="";}

  function updateSummary(modal){
    if(!modal)return;
    const form=modal.querySelector("form"),get=name=>clean(form?.elements?.[name]?.value);
    const qty=num(get("qty")),unit=num(get("unitWeight")),count=num(get("packageQty"));
    const set=(name,value)=>{const el=modal.querySelector(`[data-qsn-summary="${name}"]`);if(el)el.textContent=value||"-";};
    set("customer",get("customer"));set("product",get("product"));set("qty",qty?qty.toLocaleString("ko-KR")+" kg":"-");set("due",get("due"));
    set("pack",get("packagingType")&&unit&&count?`${get("packagingType")} · ${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg × ${count.toLocaleString("ko-KR")}EA`:"-");
  }

  function open(){
    ensureStyle();close();
    const modal=document.createElement("div");modal.id=MODAL_ID;
    const today=new Date().toISOString().slice(0,10);
    modal.innerHTML=`<div class="qsn-card" role="dialog" aria-modal="true" aria-label="신규 수주 등록"><div class="qsn-head"><div><h2 class="qsn-title">신규 수주 등록</h2><div class="qsn-sub">고객 주문부터 납기·생산·출하까지 연결되는 수주 Master를 등록합니다.</div></div><button type="button" class="qsn-close" data-qsn-close>×</button></div><form class="qsn-body" data-qsn-form><section class="qsn-section"><h3 class="qsn-section-title">수주 기본정보</h3><div class="qsn-grid"><div class="qsn-field w2"><label>수주번호 <em>*</em></label><div class="qsn-id-wrap"><input name="salesOrderId" placeholder="납기일 입력 시 자동생성"><button type="button" class="qsn-auto" data-qsn-auto>자동생성</button></div><div class="qsn-help">기본 규칙: 요청 납기일 전일 기준 SO-YYYYMMDD-NNN</div></div><div class="qsn-field"><label>수주일자</label><input type="date" name="orderDate" value="${today}"></div><div class="qsn-field"><label>수주구분</label><select name="orderType"><option>양산</option><option>샘플</option><option>개발</option><option>긴급</option></select></div><div class="qsn-field"><label>고객사 <em>*</em></label><input name="customer" value="현대자동차" autocomplete="off"></div><div class="qsn-field"><label>고객 PO</label><input name="po" autocomplete="off"></div><div class="qsn-field"><label>고객 품목코드</label><input name="customerItemCode" autocomplete="off"></div><div class="qsn-field"><label>제품 <em>*</em></label><input name="product" autocomplete="off"></div><div class="qsn-field"><label>수주수량 (kg) <em>*</em></label><input type="number" step="0.001" min="0" name="qty"></div></div></section><section class="qsn-section"><h3 class="qsn-section-title">납기 및 납품</h3><div class="qsn-grid"><div class="qsn-field"><label>요청 납기일 <em>*</em></label><input type="date" name="due"></div><div class="qsn-field"><label>확정 납기일</label><input type="date" name="confirmedDue"></div><div class="qsn-field w2"><label>납품처</label><input name="deliveryPlace" autocomplete="off"></div></div></section><section class="qsn-section"><h3 class="qsn-section-title">포장정보</h3><div class="qsn-grid"><div class="qsn-field"><label>포장형태</label><select name="packagingType"><option value="">선택</option><option>CAN</option><option>DRUM</option><option>IBC</option><option>기타</option></select></div><div class="qsn-field"><label>단위 포장량 (kg)</label><input type="number" step="0.001" min="0" name="unitWeight"></div><div class="qsn-field"><label>포장수량 (EA)</label><input type="number" step="1" min="0" name="packageQty"></div><div class="qsn-field"><label>포장 총량</label><input name="packTotal" readonly placeholder="자동계산"></div></div></section><div class="qsn-summary"><div><small>고객사</small><b data-qsn-summary="customer">현대자동차</b></div><div><small>제품</small><b data-qsn-summary="product">-</b></div><div><small>수주수량</small><b data-qsn-summary="qty">-</b></div><div><small>요청 납기</small><b data-qsn-summary="due">-</b></div></div><section class="qsn-section"><h3 class="qsn-section-title">비고</h3><div class="qsn-grid"><div class="qsn-field full"><textarea name="remarks" placeholder="수주 관련 특이사항을 입력하세요."></textarea></div></div></section><div class="qsn-error" data-qsn-error></div><div class="qsn-actions"><button type="button" class="qsn-cancel" data-qsn-close>취소</button><button type="submit" class="qsn-save">수주 등록</button></div></form></div>`;
    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
    const form=modal.querySelector("form"),due=form.elements.due,id=form.elements.salesOrderId,unit=form.elements.unitWeight,count=form.elements.packageQty,total=form.elements.packTotal;
    let manualId=false;
    id.addEventListener("input",()=>{manualId=true;});
    due.addEventListener("change",()=>{if(!manualId||!clean(id.value))id.value=nextId(due.value);updateSummary(modal);});
    modal.querySelector("[data-qsn-auto]")?.addEventListener("click",()=>{id.value=nextId(due.value);manualId=false;});
    const calc=()=>{const value=num(unit.value)*num(count.value);total.value=value?Number(value.toFixed(3)).toLocaleString("ko-KR",{maximumFractionDigits:3})+" kg":"";updateSummary(modal);};
    ["input","change"].forEach(evt=>form.addEventListener(evt,calc));
    form.addEventListener("submit",saveForm);
    modal.querySelector("[name=customer]")?.focus();
  }

  function showError(form,message){const el=form.querySelector("[data-qsn-error]");if(el){el.textContent=message;el.classList.add("show");}return false;}

  async function saveForm(event){
    event.preventDefault();
    const form=event.currentTarget,fd=new FormData(form),get=name=>clean(fd.get(name));
    const qty=num(get("qty")),unit=num(get("unitWeight")),count=num(get("packageQty")),packType=get("packagingType"),due=get("due"),id=get("salesOrderId")||nextId(due),now=new Date().toISOString();
    form.querySelector("[data-qsn-error]")?.classList.remove("show");
    if(!get("customer")||!get("product")||!due||qty<=0)return showError(form,"고객사·제품·수주수량·요청 납기일을 확인하세요.");
    if(!/^SO-20\d{6}-\d{3}$/.test(id))return showError(form,"수주번호 형식을 확인하세요. 예: SO-20260114-001");
    if(visibleIds().has(id))return showError(form,"이미 사용 중인 수주번호입니다.");
    const packTouched=Boolean(packType||unit||count);
    if(packTouched&&(!packType||unit<=0||count<=0))return showError(form,"포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");

    const saveBtn=form.querySelector(".qsn-save");if(saveBtn){saveBtn.disabled=true;saveBtn.textContent="등록 중...";}
    const packaging=packTouched?{type:packType,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now}:null;
    const meta={salesOrderIdOverride:id,orderDate:get("orderDate")||todayIso(),requestedDue:due,confirmedDue:get("confirmedDue"),customerItemCode:get("customerItemCode"),deliveryPlace:get("deliveryPlace"),orderType:get("orderType")||"양산",customerOverride:get("customer"),productOverride:get("product"),qtyOverride:qty,savedAt:now,savedBy:currentUser(),masterDataOwner:"SALES"};
    const row={id,customer:get("customer"),po:get("po")||"-",product:get("product"),qty,due,plan:"계획대기",shipping:"-",source:"MANUAL",packaging,packagingType:packaging?.type||"",unitPackQty:packaging?.unitWeight||0,packageQty:packaging?.packageQty||0,remarks:get("remarks"),orderMeta:meta,customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,orderDate:meta.orderDate};
    const next=[row,...rows()];

    try{
      write(SALES_KEY,next);
      const metaMap=readMap(META_KEY);metaMap[id]=meta;write(META_KEY,metaMap);
      if(packaging){const map=readMap(PACK_KEY);map[id]=packaging;write(PACK_KEY,map);}
      if(get("remarks")){const map=readMap(REMARK_KEY);map[id]=get("remarks");write(REMARK_KEY,map);}
      if(typeof window.qmesSyncUpsert==="function"){
        await window.qmesSyncUpsert("inventory","erp:sales",{module:"erp",rows:next,savedAt:now,savedBy:currentUser(),source:"SALES_NEW_ORDER_ENTERPRISE_V1"});
      }
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"new-order",id}}));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales",id}}));
      close();
    }catch(error){
      console.error("[QMES New Sales Order] save failed",error);
      showError(form,"수주 저장 중 오류가 발생했습니다. "+clean(error?.message));
      if(saveBtn){saveBtn.disabled=false;saveBtn.textContent="수주 등록";}
    }
  }

  function todayIso(){return new Date().toISOString().slice(0,10);}

  document.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    if(target.closest(`#${MODAL_ID} [data-qsn-close]`)){event.preventDefault();close();return;}
    if(target.id===MODAL_ID){close();return;}
    const button=target.closest(".qmes-sales-stable .qerp-head-actions button");
    if(!button)return;
    const text=clean(button.textContent);
    if(text!=="+ 신규 수주"&&text!=="신규 수주"&&text!=="입력 닫기")return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();open();
  },true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.getElementById(MODAL_ID))close();},true);

  window.qmesSalesNewOrderEnterprise={open,close};
})();
