/* NAMO QMES - New Sales Order V8 - uploaded Enterprise layout replacement
 * 2026-08-31
 * UI basis: NAMO Enterprise ERP + MES demo orderForm().
 * Live behavior is retained: automatic order no., inventory/production calculation,
 * local QMES sales master storage and public DB sync bridge.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V8__) return;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V8__=true;

  /* This file owns the visible New Sales Order dialog. */
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V7__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V6__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260828_V5__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V4__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V3__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V2__=true;
  window.__QMES_SALES_NEW_ORDER_ENTERPRISE_20260828_V1__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const REMARK="qmes-sales-remarks-v1";
  const DRAFT="qmes-sales-new-order-modal-draft-v8";
  const ID="qmes-sales-new-order-modal-v8";
  const STYLE="qmes-sales-new-order-modal-v8-style";
  const CATEGORY="절연 슬러리";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const readMap=k=>{const v=read(k,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
  const rows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const user=()=>clean(window.__QMES_USER__?.name||window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__||window.__QMES_CURRENT_USER__)||"로그인 사용자";

  function dateMinusOne(v){
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(clean(v))) return today();
    const d=new Date(v+"T12:00:00");
    if(Number.isNaN(d.getTime())) return today();
    d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function usedIds(){
    const meta=readMap(META),set=new Set();
    rows().forEach(r=>{
      const id=clean(r?.id),key=clean(r?.workOrder)||id,m=meta[key]||meta[id]||r?.orderMeta||{};
      set.add(clean(m.salesOrderIdOverride)||id);
    });
    return set;
  }

  function nextId(due){
    const stamp=dateMinusOne(due).replace(/-/g,""),used=usedIds();let seq=1,id="";
    do{id=`SO-${stamp}-${String(seq++).padStart(3,"0")}`}while(used.has(id));
    return id;
  }

  function distinct(field){return [...new Set(rows().map(r=>clean(r?.[field])).filter(Boolean))].slice(0,50)}

  function availableStock(product){
    const p=clean(product).toLowerCase();
    if(!p) return 0;
    let current=0,reserved=0,explicitAvailable=0,hasExplicitAvailable=false;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||"";
      if(!/(finished|fg|product.*stock|stock.*product|완제품)/i.test(key)) continue;
      let data;try{data=JSON.parse(localStorage.getItem(key)||"null")}catch(_){continue}
      const list=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:[];
      list.forEach(x=>{
        const name=clean(x?.product||x?.productName||x?.item||x?.itemName||x?.name).toLowerCase();
        if(name!==p) return;
        const av=x?.availableQty??x?.available;
        if(av!==undefined&&av!==null&&av!==""){
          hasExplicitAvailable=true;
          explicitAvailable+=Math.max(0,num(av));
        }
        current+=Math.max(0,num(x?.stockQty??x?.currentQty??x?.qty??x?.quantity??x?.onHandQty));
        reserved+=Math.max(0,num(x?.reservedQty??x?.allocatedQty??x?.reservationQty));
      });
    }
    return hasExplicitAvailable?Math.max(0,explicitAvailable):Math.max(0,current-reserved);
  }

  function ensureDatePicker(){
    try{
      if(window.__QMES_DATE_PICKER_STABLE_20260831_V2__||document.querySelector('script[data-qmes-date-picker-stable="1"]')) return;
      const s=document.createElement("script");
      s.src="./js/qmes-date-picker-stable-20260831-v1.js?v=20260831-calendar3";
      s.async=false;s.dataset.qmesDatePickerStable="1";document.head.appendChild(s);
    }catch(_){ }
  }

  function style(){
    if(document.getElementById(STYLE)) return;
    const s=document.createElement("style");s.id=STYLE;s.textContent=`
      #${ID}{position:fixed!important;inset:0!important;z-index:2147483700!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(15,23,42,.34)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;color:#172033!important}
      #${ID} *{box-sizing:border-box!important}
      #${ID} .n8-modal{width:min(980px,96vw)!important;max-height:90vh!important;background:#fff!important;border:1px solid #e6ebf2!important;border-radius:18px!important;box-shadow:0 28px 80px rgba(15,23,42,.26)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}
      #${ID} .n8-head{min-height:68px!important;padding:0 20px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-bottom:1px solid #e6ebf2!important;gap:16px!important}
      #${ID} .n8-head h3{margin:0!important;font-size:16px!important;color:#172033!important;font-weight:900!important}
      #${ID} .n8-head p{margin:3px 0 0!important;color:#667085!important;font-size:10.5px!important}
      #${ID} .n8-close{border:0!important;background:#f3f5f8!important;border-radius:8px!important;width:34px!important;height:34px!important;color:#334155!important;font-size:18px!important;cursor:pointer!important}
      #${ID} .n8-body{padding:18px 20px 22px!important;overflow:auto!important}
      #${ID} .n8-note{font-size:10px!important;color:#748095!important;background:#f8fafc!important;border:1px dashed #d9e0ea!important;border-radius:9px!important;padding:9px 10px!important;margin-bottom:12px!important}
      #${ID} .n8-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}
      #${ID} .n8-field{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:0!important}
      #${ID} .n8-field.span-2{grid-column:span 2!important}
      #${ID} .n8-field.span-4{grid-column:1/-1!important}
      #${ID} .n8-field label{font-size:10px!important;color:#667085!important;font-weight:800!important}
      #${ID} .n8-field input,#${ID} .n8-field select,#${ID} .n8-field textarea{width:100%!important;border:1px solid #d7dee8!important;border-radius:9px!important;background:#fff!important;padding:9px 10px!important;font:inherit!important;font-size:11px!important;color:#334155!important;-webkit-text-fill-color:#334155!important;outline:none!important}
      #${ID} .n8-field input,#${ID} .n8-field select{height:37px!important}
      #${ID} .n8-field textarea{min-height:74px!important;resize:vertical!important}
      #${ID} .n8-field input[readonly]{background:#f8fafc!important;color:#667085!important;-webkit-text-fill-color:#667085!important}
      #${ID} .n8-field input:focus,#${ID} .n8-field select:focus,#${ID} .n8-field textarea:focus{border-color:#9db9fb!important;box-shadow:0 0 0 3px #edf3ff!important}
      #${ID} .n8-section{border:1px solid #e6ebf2!important;border-radius:12px!important;margin-top:14px!important;overflow:hidden!important}
      #${ID} .n8-section-title{padding:10px 12px!important;background:#fafbfd!important;border-bottom:1px solid #e6ebf2!important;font-size:11px!important;font-weight:850!important}
      #${ID} .n8-table-wrap{overflow:auto!important;padding:0 12px 4px!important}
      #${ID} table{width:100%!important;border-collapse:collapse!important;font-size:11.3px!important}
      #${ID} th,#${ID} td{padding:10px 9px!important;border-bottom:1px solid #edf0f4!important;text-align:left!important;white-space:nowrap!important}
      #${ID} th{background:#fafbfd!important;color:#6e788b!important;font-size:10.5px!important;font-weight:800!important}
      #${ID} .n8-status{padding:4px 7px!important;border-radius:999px!important;font-size:9.8px!important;font-weight:850!important;display:inline-block!important;background:#edf3ff!important;color:#2457d6!important}
      #${ID} .n8-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:16px!important;flex-wrap:wrap!important}
      #${ID} .n8-btn{border:1px solid #d7dee8!important;background:#fff!important;color:#334155!important;padding:9px 12px!important;border-radius:9px!important;font:inherit!important;font-size:12px!important;font-weight:750!important;cursor:pointer!important}
      #${ID} .n8-btn.soft{background:#edf3ff!important;border-color:#dce8ff!important;color:#2457d6!important}
      #${ID} .n8-btn.primary{background:#2457d6!important;border-color:#2457d6!important;color:#fff!important}
      #${ID} .n8-error{display:none!important;margin-top:12px!important;padding:9px 10px!important;border-radius:9px!important;background:#fff0ee!important;color:#b83930!important;font-size:10px!important;font-weight:800!important}
      #${ID} .n8-error.show{display:block!important}
      @media(max-width:900px){#${ID} .n8-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#${ID} .n8-field.span-4{grid-column:1/-1!important}}
      @media(max-width:560px){#${ID}{padding:8px!important}#${ID} .n8-modal{max-height:96vh!important;border-radius:12px!important}#${ID} .n8-grid{grid-template-columns:1fr!important}#${ID} .n8-field.span-2,#${ID} .n8-field.span-4{grid-column:1!important}#${ID} .n8-head{padding:0 14px!important}#${ID} .n8-body{padding:14px!important}}
    `;document.head.appendChild(s);
  }

  function removeLegacy(){
    ["qmes-sales-new-order-modal-v7","qmes-sales-new-order-modal-v6","qmes-sales-new-order-modal-v5","qmes-sales-new-order-namo-20260828-v4","qmes-sales-new-order-namo-20260828-v3","qmes-sales-new-order-namo-20260828-v2","qmes-sales-new-order-enterprise-20260828-v1"].forEach(id=>document.getElementById(id)?.remove());
    Array.from(document.querySelectorAll('[role="dialog"][aria-label="신규 수주 등록"]')).forEach(d=>{if(d.closest(`#${ID}`))return;try{d.parentElement?.remove()}catch(_){try{d.remove()}catch(__){}}});
  }

  function close(){document.getElementById(ID)?.remove();document.documentElement.style.overflow="";}

  function formData(form){
    const fd=new FormData(form),g=n=>clean(fd.get(n));
    return {orderDate:g("orderDate"),orderType:g("orderType")||"양산",priority:g("priority")||"일반",customer:g("customer"),due:g("due"),product:g("product"),qty:g("qty"),unitPrice:g("unitPrice"),po:g("po"),deliveryPlace:g("deliveryPlace"),remarks:g("remarks")};
  }

  function restore(form,d){
    if(!d||typeof d!=="object") return;
    Object.entries(d).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??""});
  }

  function refresh(modal){
    const f=modal.querySelector("form"),g=n=>clean(f.elements[n]?.value),qty=num(g("qty")),stock=availableStock(g("product")),need=Math.max(0,qty-stock);
    if(g("due")) f.elements.salesOrderId.value=nextId(g("due"));
    const set=(k,v)=>modal.querySelectorAll(`[data-n8="${k}"]`).forEach(el=>el.textContent=v);
    set("product",g("product")||"-");
    set("qty",qty?qty.toLocaleString("ko-KR")+" kg":"-");
    set("stock",stock.toLocaleString("ko-KR")+" kg");
    set("need",qty?need.toLocaleString("ko-KR")+" kg":"-");
    set("equipment","생산계획에서 지정");
    set("status",qty>0?(need>0?"계획 생성":"재고 출하 검토"):"계획 검토");
  }

  function open(){
    style();ensureDatePicker();removeLegacy();close();
    const d=read(DRAFT,{}),customers=distinct("customer"),products=distinct("product"),modal=document.createElement("div");
    modal.id=ID;
    modal.innerHTML=`<section class="n8-modal" role="dialog" aria-modal="true" aria-label="신규 수주 등록"><div class="n8-head"><div><h3>신규 수주 등록</h3><p>수주 → 생산계획 → 작업지시까지 동일 수주번호로 연결</p></div><button type="button" class="n8-close" data-n8-close>✕</button></div><form><div class="n8-body">
      <datalist id="n8-customers">${customers.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>
      <datalist id="n8-products">${products.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>
      <div class="n8-note">나모케미칼 수주 Master 입력화면입니다. 실제 등록 데이터는 생산계획·재고·출하 연계의 기준정보로 사용됩니다.</div>
      <div class="n8-grid">
        <div class="n8-field"><label>수주번호</label><input name="salesOrderId" readonly placeholder="납기 입력 시 자동생성"></div>
        <div class="n8-field"><label>수주일자</label><input type="date" name="orderDate" value="${today()}"></div>
        <div class="n8-field"><label>수주구분</label><select name="orderType"><option value="양산">양산</option><option value="샘플">샘플</option><option value="개발·평가">개발·평가</option></select></div>
        <div class="n8-field"><label>우선순위</label><select name="priority"><option value="일반">일반</option><option value="긴급">긴급</option></select></div>

        <div class="n8-field"><label>고객사 *</label><input name="customer" list="n8-customers" placeholder="고객사 입력"></div>
        <div class="n8-field"><label>납기일 *</label><input type="date" name="due"></div>
        <div class="n8-field span-2"><label>제품 *</label><input name="product" list="n8-products" placeholder="제품 / Grade · 절연 슬러리"></div>

        <div class="n8-field"><label>수주수량 (kg) *</label><input type="number" min="0" step="0.001" name="qty" placeholder="0"></div>
        <div class="n8-field"><label>단가 (원/kg)</label><input type="number" min="0" step="1" name="unitPrice" placeholder="선택 입력"></div>
        <div class="n8-field span-2"><label>고객 PO</label><input name="po" placeholder="고객 발주번호"></div>

        <div class="n8-field span-2"><label>납품처</label><input name="deliveryPlace" placeholder="고객 지정 납품처"></div>
        <div class="n8-field span-4"><label>비고 / 고객 요구사항</label><textarea name="remarks" placeholder="포장, 라벨, CoA, 납기 특이사항"></textarea></div>
      </div>

      <div class="n8-section"><div class="n8-section-title">생산 연계 예상</div><div class="n8-table-wrap"><table><thead><tr><th>제품</th><th>수주량</th><th>가용재고</th><th>생산필요</th><th>예정 설비</th><th>상태</th></tr></thead><tbody><tr><td data-n8="product">-</td><td data-n8="qty">-</td><td data-n8="stock">0 kg</td><td data-n8="need">-</td><td data-n8="equipment">생산계획에서 지정</td><td><span class="n8-status" data-n8="status">계획 검토</span></td></tr></tbody></table></div></div>
      <div class="n8-error" data-n8-error></div>
      <div class="n8-actions"><button type="button" class="n8-btn" data-n8-close>취소</button><button type="button" class="n8-btn soft" data-n8-draft>임시저장</button><button type="button" class="n8-btn primary" data-n8-save>수주 등록</button></div>
    </div></form></section>`;

    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
    const form=modal.querySelector("form");restore(form,d);refresh(modal);
    form.addEventListener("input",()=>refresh(modal));
    form.addEventListener("change",()=>refresh(modal));
    modal.querySelectorAll("[data-n8-close]").forEach(b=>b.addEventListener("click",close));
    modal.querySelector("[data-n8-draft]")?.addEventListener("click",()=>{localStorage.setItem(DRAFT,JSON.stringify(formData(form)));alert("임시저장했습니다.")});
    modal.querySelector("[data-n8-save]")?.addEventListener("click",()=>save(form,modal));
    form.elements.customer?.focus();
  }

  function fail(modal,msg){const e=modal.querySelector("[data-n8-error]");if(e){e.textContent=msg;e.classList.add("show")}return false}

  async function save(form,modal){
    const d=formData(form),qty=num(d.qty),price=num(d.unitPrice),id=clean(form.elements.salesOrderId.value)||nextId(d.due),now=new Date().toISOString();
    modal.querySelector("[data-n8-error]")?.classList.remove("show");
    if(!d.customer||!d.product||qty<=0||!d.due) return fail(modal,"고객사·제품·수주수량·납기일을 확인하세요.");
    if(!["양산","샘플","개발·평가"].includes(d.orderType)) return fail(modal,"수주구분을 확인하세요.");
    if(usedIds().has(id)) return fail(modal,"이미 사용 중인 수주번호입니다.");

    const meta={salesOrderIdOverride:id,salesOrderIdAutoRule:"DUE_MINUS_1",orderDate:d.orderDate||today(),orderType:d.orderType,priority:d.priority,customerOverride:d.customer,customerPO:d.po,requestedDue:d.due,deliveryPlace:d.deliveryPlace,productCategory:CATEGORY,productOverride:d.product,itemCode:d.product,qtyOverride:qty,unitPrice:price||0,productionPlanStatus:"계획대기",salesStatus:"확정",salesManager:user(),masterDataOwner:"SALES",source:"NAMO_NEW_ORDER_MODAL_V8_ENTERPRISE",savedAt:now,savedBy:user()};
    const row={id,customer:d.customer,po:d.po||"-",product:d.product,itemCode:d.product,productCategory:CATEGORY,orderType:d.orderType,priority:d.priority,qty,due:d.due,plan:"계획대기",shipping:"-",deliveryPlace:d.deliveryPlace,unitPrice:price||0,remarks:d.remarks,orderDate:meta.orderDate,salesStatus:"확정",source:"MANUAL",orderMeta:meta};
    const next=[row,...rows()];
    const btn=modal.querySelector("[data-n8-save]");if(btn){btn.disabled=true;btn.textContent="등록 중..."}
    try{
      localStorage.setItem(SALES,JSON.stringify(next));
      const mm=readMap(META);mm[id]=meta;localStorage.setItem(META,JSON.stringify(mm));
      if(d.remarks){const rm=readMap(REMARK);rm[id]=d.remarks;localStorage.setItem(REMARK,JSON.stringify(rm));}
      if(typeof window.qmesSyncUpsert==="function") await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:now,savedBy:user(),source:"NAMO_NEW_ORDER_MODAL_V8_ENTERPRISE"});
      localStorage.removeItem(DRAFT);
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"new-order",id,orderType:d.orderType}}));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales",id,orderType:d.orderType}}));
      close();
    }catch(err){console.error("[NAMO New Order V8 Enterprise]",err);fail(modal,"수주 저장 중 오류가 발생했습니다. "+clean(err?.message));if(btn){btn.disabled=false;btn.textContent="수주 등록"}}
  }

  document.addEventListener("click",e=>{
    const t=e.target;if(!(t instanceof Element)) return;
    if(t.closest(`#${ID} [data-n8-close]`)){e.preventDefault();close();return;}
    const b=t.closest("button");if(!b) return;
    const text=clean(b.textContent).replace(/^\+\s*/,"");
    if(text!=="신규 수주") return;
    const page=document.querySelector(".qmes-sales-stable")||document.querySelector('[class*="qmes-sales"]');if(!page) return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();
  },true);

  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById(ID))close()},true);

  const api={open,close};
  window.qmesSalesNewOrderNamoV8=api;
  window.qmesSalesNewOrderNamoV7=api;
  window.qmesSalesNewOrderNamoV6=api;
  window.qmesSalesNewOrderNamoV5=api;
  window.qmesSalesNewOrderNamoV4=api;
  window.qmesSalesNewOrderNamoV3=api;
  window.qmesSalesNewOrderNamo=api;
  window.qmesSalesNewOrderEnterprise=api;
})();
