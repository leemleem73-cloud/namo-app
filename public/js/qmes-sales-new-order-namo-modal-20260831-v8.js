/* NAMO QMES - New Sales Order Final V8 - 2026-08-31
 * Namo Chemical optimized order entry.
 * Product family is fixed to insulation slurry while Grade/item/spec/customer data remain traceable.
 * Supports mass production, sample, development/evaluation, packaging, CoA and production linkage.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V8__) return;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V8__=true;

  /* V8 owns the visible New Sales Order dialog. */
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V7__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V6__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260828_V5__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V4__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V3__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V2__=true;
  window.__QMES_SALES_NEW_ORDER_ENTERPRISE_20260828_V1__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const PACK="qmes-sales-packaging-v1";
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
    const m=readMap(META),set=new Set();
    rows().forEach(r=>{const id=clean(r?.id),key=clean(r?.workOrder)||id,mm=m[key]||m[id]||r?.orderMeta||{};set.add(clean(mm.salesOrderIdOverride)||id)});
    return set;
  }
  function nextId(due){
    const stamp=dateMinusOne(due).replace(/-/g,""),used=usedIds();let seq=1,id="";
    do{id=`SO-${stamp}-${String(seq++).padStart(3,"0")}`}while(used.has(id));
    return id;
  }
  function distinct(field){return [...new Set(rows().map(r=>clean(r?.[field])).filter(Boolean))].slice(0,50)}

  function inventoryInfo(product){
    const p=clean(product).toLowerCase();
    if(!p) return {current:0,reserved:0,available:0};
    let current=0,reserved=0,found=false;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||"";
      if(!/(finished|fg|product.*stock|stock.*product|완제품)/i.test(key)) continue;
      let data;try{data=JSON.parse(localStorage.getItem(key)||"null")}catch(_){continue}
      const list=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:[];
      list.forEach(x=>{
        const name=clean(x?.product||x?.productName||x?.item||x?.itemName||x?.name).toLowerCase();
        if(name!==p) return;
        found=true;
        const explicitCurrent=num(x?.stockQty??x?.currentQty??x?.qty??x?.quantity??x?.onHandQty);
        const explicitReserved=num(x?.reservedQty??x?.allocatedQty??x?.reservationQty);
        const explicitAvailable=num(x?.availableQty??x?.available);
        if(explicitCurrent>0) current+=explicitCurrent;
        else if(explicitAvailable>0) current+=explicitAvailable+Math.max(0,explicitReserved);
        reserved+=Math.max(0,explicitReserved);
      });
    }
    if(!found) return {current:0,reserved:0,available:0};
    return {current:Math.max(0,current),reserved:Math.max(0,reserved),available:Math.max(0,current-reserved)};
  }

  function ensureDatePicker(){
    try{
      if(window.__QMES_DATE_PICKER_STABLE_20260831_V2__||document.querySelector('script[data-qmes-date-picker-stable="1"]')) return;
      const s=document.createElement("script");s.src="./js/qmes-date-picker-stable-20260831-v1.js?v=20260831-calendar3";s.async=false;s.dataset.qmesDatePickerStable="1";document.head.appendChild(s);
    }catch(_){ }
  }

  function style(){
    if(document.getElementById(STYLE)) return;
    const s=document.createElement("style");s.id=STYLE;s.textContent=`
      #${ID}{position:fixed!important;inset:0!important;z-index:2147483700!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.40)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;color:#172033!important}
      #${ID} *{box-sizing:border-box!important}
      #${ID} .n8-card{width:min(1240px,98vw)!important;max-height:94vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dce4ee!important;border-radius:16px!important;box-shadow:0 30px 90px rgba(15,23,42,.25)!important;overflow:hidden!important}
      #${ID} .n8-head{display:flex!important;justify-content:space-between!important;align-items:flex-start!important;gap:14px!important;padding:18px 22px 15px!important;border-bottom:1px solid #e8edf3!important}
      #${ID} .n8-title{font-size:21px!important;line-height:1.2!important;font-weight:950!important;letter-spacing:-.02em!important;color:#152238!important}
      #${ID} .n8-sub{margin-top:5px!important;font-size:10px!important;font-weight:700!important;color:#8390a2!important}
      #${ID} .n8-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f3f6f9!important;color:#334155!important;font-size:21px!important;cursor:pointer!important}
      #${ID} .n8-body{overflow:auto!important;padding:15px 22px 18px!important;background:#fff!important}
      #${ID} .n8-guide{margin-bottom:12px!important;padding:9px 11px!important;border:1px solid #d8e3f2!important;border-radius:9px!important;background:#f8fbff!important;color:#617086!important;font-size:9.5px!important;font-weight:750!important}
      #${ID} .n8-guide b{color:#2859c7!important}
      #${ID} .n8-section{margin-top:12px!important;border:1px solid #e1e7ef!important;border-radius:11px!important;background:#fff!important;overflow:hidden!important}
      #${ID} .n8-section:first-of-type{margin-top:0!important}
      #${ID} .n8-section-head{height:38px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 12px!important;border-bottom:1px solid #e9edf2!important;background:#fafbfd!important;color:#26364c!important;font-size:10.5px!important;font-weight:950!important}
      #${ID} .n8-section-head small{color:#8b98aa!important;font-size:9px!important;font-weight:700!important}
      #${ID} .n8-section-body{padding:12px!important}
      #${ID} .n8-grid4{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px 12px!important}
      #${ID} .n8-grid3{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px 12px!important}
      #${ID} .n8-field.full{grid-column:1/-1!important}
      #${ID} .n8-field.w2{grid-column:span 2!important}
      #${ID} .n8-field label{display:block!important;margin:0 0 5px!important;color:#5d6979!important;font-size:9.5px!important;font-weight:900!important}
      #${ID} .n8-field input,#${ID} .n8-field select,#${ID} .n8-field textarea{width:100%!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#172033!important;-webkit-text-fill-color:#172033!important;font:inherit!important;font-size:11px!important;outline:none!important}
      #${ID} .n8-field input,#${ID} .n8-field select{height:38px!important;padding:0 10px!important}
      #${ID} .n8-field textarea{height:66px!important;padding:9px 10px!important;resize:vertical!important}
      #${ID} .n8-field input[readonly]{background:#f5f8fc!important;color:#526176!important;-webkit-text-fill-color:#526176!important;font-weight:850!important}
      #${ID} .n8-field input:focus,#${ID} .n8-field select:focus,#${ID} .n8-field textarea:focus{border-color:#85a5ef!important;box-shadow:0 0 0 3px rgba(49,91,221,.07)!important}
      #${ID} .n8-type{font-weight:900!important;color:#17418f!important;background:#f7faff!important;border-color:#b8cbee!important}
      #${ID} .n8-category{background:#eef5ff!important;color:#234e9e!important;-webkit-text-fill-color:#234e9e!important}
      #${ID} .n8-sample{display:none!important;margin-top:12px!important;border:1px solid #cfdbf2!important;border-radius:10px!important;background:#fbfdff!important;overflow:hidden!important}
      #${ID} .n8-sample.show{display:block!important}
      #${ID} .n8-sample-head{height:38px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 12px!important;background:#f4f8ff!important;border-bottom:1px solid #e2eaf8!important;color:#2f579b!important;font-size:10px!important;font-weight:950!important}
      #${ID} .n8-sample-body{padding:12px!important}
      #${ID} .n8-table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important}
      #${ID} .n8-table th,#${ID} .n8-table td{height:41px!important;padding:0 9px!important;border-bottom:1px solid #edf1f5!important;text-align:left!important;vertical-align:middle!important;font-size:9.5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #${ID} .n8-table th{background:#fafbfd!important;color:#6d798b!important;font-size:8.7px!important;font-weight:900!important}
      #${ID} .n8-table tr:last-child td{border-bottom:0!important}
      #${ID} .n8-badge{display:inline-flex!important;align-items:center!important;height:23px!important;padding:0 8px!important;border-radius:999px!important;background:#eaf1ff!important;color:#2858c5!important;font-size:8.5px!important;font-weight:950!important}
      #${ID} .n8-error{display:none!important;margin-top:12px!important;padding:10px 11px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:10px!important;font-weight:850!important}
      #${ID} .n8-error.show{display:block!important}
      #${ID} .n8-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 22px 16px!important;border-top:1px solid #e8edf3!important;background:#fff!important}
      #${ID} .n8-btn{height:39px!important;padding:0 15px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font:inherit!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}
      #${ID} .n8-btn.soft{background:#eef4ff!important;border-color:#d7e4ff!important;color:#2853cc!important}
      #${ID} .n8-btn.primary{background:#285bd8!important;border-color:#285bd8!important;color:#fff!important}
      #${ID} .n8-btn:disabled{opacity:.55!important;cursor:wait!important}
      @media(max-width:980px){#${ID}{padding:8px!important;align-items:flex-start!important}#${ID} .n8-card{max-height:98vh!important}#${ID} .n8-grid4,#${ID} .n8-grid3{grid-template-columns:1fr 1fr!important}#${ID} .n8-field.w2{grid-column:span 1!important}}
      @media(max-width:560px){#${ID} .n8-grid4,#${ID} .n8-grid3{grid-template-columns:1fr!important}#${ID} .n8-field.w2{grid-column:span 1!important}}
    `;document.head.appendChild(s);
  }

  function removeLegacy(){
    ["qmes-sales-new-order-modal-v7","qmes-sales-new-order-modal-v6","qmes-sales-new-order-modal-v5","qmes-sales-new-order-namo-20260828-v4","qmes-sales-new-order-namo-20260828-v3","qmes-sales-new-order-namo-20260828-v2","qmes-sales-new-order-enterprise-20260828-v1"].forEach(id=>document.getElementById(id)?.remove());
    Array.from(document.querySelectorAll('[role="dialog"][aria-label="신규 수주 등록"]')).forEach(d=>{if(d.closest(`#${ID}`))return;try{d.parentElement?.remove()}catch(_){try{d.remove()}catch(__){}}});
  }
  function close(){document.getElementById(ID)?.remove();document.documentElement.style.overflow="";}

  function draft(form){
    const fd=new FormData(form),g=n=>clean(fd.get(n));
    return {
      orderDate:g("orderDate"),orderType:g("orderType")||"양산",customer:g("customer"),po:g("po"),due:g("due"),deliveryPlace:g("deliveryPlace"),priority:g("priority")||"일반",
      product:g("product"),itemCode:g("itemCode"),customerItemCode:g("customerItemCode"),specRevision:g("specRevision"),qty:g("qty"),unitPrice:g("unitPrice"),
      packagingSpec:g("packagingSpec"),deliveryType:g("deliveryType")||"일괄납품",coaRequired:g("coaRequired")||"필요",remarks:g("remarks"),
      sampleCharge:g("sampleCharge"),samplePurpose:g("samplePurpose"),customerProject:g("customerProject"),evaluationItems:g("evaluationItems"),customerContact:g("customerContact"),evaluationDate:g("evaluationDate"),massProductionLink:g("massProductionLink")
    };
  }
  function restore(form,d){if(!d||typeof d!=="object")return;Object.entries(d).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??""});if(form.elements.orderType&&!clean(form.elements.orderType.value))form.elements.orderType.value="양산";}
  function statusLabel(orderType){return orderType==="샘플"?"샘플 생산 검토":orderType==="개발·평가"?"개발 생산 검토":"생산계획 필요"}

  function refresh(modal){
    const f=modal.querySelector("form"),g=n=>clean(f.elements[n]?.value),qty=num(g("qty")),inv=inventoryInfo(g("product")),need=Math.max(0,qty-inv.available),orderType=g("orderType")||"양산";
    if(g("due")) f.elements.salesOrderId.value=nextId(g("due"));
    const sample=modal.querySelector("[data-n8-sample]");if(sample)sample.classList.toggle("show",orderType!=="양산");
    const set=(k,v)=>modal.querySelectorAll(`[data-n8="${k}"]`).forEach(el=>el.textContent=v);
    set("product",g("product")||"-");set("qty",qty?qty.toLocaleString("ko-KR")+" kg":"-");set("current",inv.current.toLocaleString("ko-KR")+" kg");set("reserved",inv.reserved.toLocaleString("ko-KR")+" kg");set("available",inv.available.toLocaleString("ko-KR")+" kg");set("need",qty?need.toLocaleString("ko-KR")+" kg":"-");set("material","MRP 확인");set("status",statusLabel(orderType));
  }

  function open(){
    style();ensureDatePicker();removeLegacy();close();
    const d=read(DRAFT,{}),customers=distinct("customer"),products=distinct("product"),modal=document.createElement("div");modal.id=ID;
    modal.innerHTML=`<div class="n8-card" role="dialog" aria-modal="true" aria-label="신규 수주 등록"><div class="n8-head"><div><div class="n8-title">신규 수주 등록</div><div class="n8-sub">나모케미칼 절연 슬러리 수주 → 생산계획 → 작업지시 → PQC/OQC → 출하 → LOT 추적</div></div><button type="button" class="n8-close" data-n8-close>×</button></div><form><div class="n8-body">
      <datalist id="n8-customers">${customers.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist><datalist id="n8-products">${products.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>
      <div class="n8-guide"><b>제품군은 절연 슬러리로 고정</b>하고 실제 판매·생산 품목은 제품/Grade, 사내 품목코드, 고객 품번, Spec/Rev.로 추적합니다.</div>

      <section class="n8-section"><div class="n8-section-head"><span>01. 수주 기본정보</span><small>수주 성격·고객·납기</small></div><div class="n8-section-body"><div class="n8-grid4">
        <div class="n8-field"><label>수주번호</label><input name="salesOrderId" readonly placeholder="요청 납기 입력 시 자동생성"></div>
        <div class="n8-field"><label>수주일자</label><input type="date" name="orderDate" value="${today()}"></div>
        <div class="n8-field"><label>수주구분 *</label><select class="n8-type" name="orderType"><option value="양산">양산</option><option value="샘플">샘플</option><option value="개발·평가">개발·평가</option></select></div>
        <div class="n8-field"><label>요청 납기일 *</label><input type="date" name="due"></div>
        <div class="n8-field"><label>고객사 *</label><input name="customer" list="n8-customers" placeholder="고객사 입력"></div>
        <div class="n8-field"><label>고객 PO</label><input name="po" placeholder="고객 발주번호"></div>
        <div class="n8-field"><label>납품처</label><input name="deliveryPlace" placeholder="고객 지정 납품처"></div>
        <div class="n8-field"><label>우선순위</label><select name="priority"><option value="일반">일반</option><option value="긴급">긴급</option></select></div>
      </div></div></section>

      <section class="n8-section"><div class="n8-section-head"><span>02. 제품 · 규격 · 수량</span><small>절연 슬러리 Grade 기준</small></div><div class="n8-section-body"><div class="n8-grid4">
        <div class="n8-field"><label>제품군</label><input class="n8-category" value="${CATEGORY}" readonly></div>
        <div class="n8-field"><label>제품 / Grade *</label><input name="product" list="n8-products" placeholder="예: DBA1501"></div>
        <div class="n8-field"><label>사내 품목코드</label><input name="itemCode" placeholder="예: NM-IS-001"></div>
        <div class="n8-field"><label>고객 품번</label><input name="customerItemCode" placeholder="고객 지정 품번"></div>
        <div class="n8-field"><label>Spec / Rev.</label><input name="specRevision" placeholder="예: Rev.03"></div>
        <div class="n8-field"><label>수주수량 (kg) *</label><input type="number" min="0" step="0.001" name="qty" placeholder="0"></div>
        <div class="n8-field"><label>단가 (원/kg)</label><input type="number" min="0" step="1" name="unitPrice" placeholder="선택 입력"></div>
        <div class="n8-field"><label>포장규격</label><input name="packagingSpec" placeholder="예: 20kg × 10EA"></div>
      </div></div></section>

      <section class="n8-section"><div class="n8-section-head"><span>03. 납품 · 품질조건</span><small>출하 조건과 고객 요구</small></div><div class="n8-section-body"><div class="n8-grid3">
        <div class="n8-field"><label>납품방식</label><select name="deliveryType"><option value="일괄납품">일괄납품</option><option value="분할납품">분할납품</option></select></div>
        <div class="n8-field"><label>CoA</label><select name="coaRequired"><option value="필요">필요</option><option value="불필요">불필요</option></select></div>
        <div class="n8-field"><label>원료 확인</label><input value="생산계획/MRP에서 자동 확인" readonly></div>
        <div class="n8-field full"><label>비고 / 고객 요구사항</label><textarea name="remarks" placeholder="라벨, 포장, CoA, 운송, 특별검사, 기타 고객 요구사항을 입력하세요."></textarea></div>
      </div></div></section>

      <div class="n8-sample" data-n8-sample><div class="n8-sample-head"><span>샘플 / 개발·평가 추가정보</span><span>양산 선택 시 자동 숨김</span></div><div class="n8-sample-body"><div class="n8-grid4">
        <div class="n8-field"><label>샘플 구분</label><select name="sampleCharge"><option value="무상">무상</option><option value="유상">유상</option></select></div>
        <div class="n8-field"><label>고객 프로젝트</label><input name="customerProject" placeholder="프로젝트 / 차종 / 개발코드"></div>
        <div class="n8-field"><label>고객 담당자</label><input name="customerContact" placeholder="담당자 / 부서"></div>
        <div class="n8-field"><label>평가 예정일</label><input type="date" name="evaluationDate"></div>
        <div class="n8-field w2"><label>샘플 / 평가 목적</label><input name="samplePurpose" placeholder="예: 고객 공정 적용성 평가"></div>
        <div class="n8-field"><label>평가 항목</label><input name="evaluationItems" placeholder="접착력, 절연성, 도포성 등"></div>
        <div class="n8-field"><label>양산 연계 예상</label><select name="massProductionLink"><option value="미정">미정</option><option value="있음">있음</option><option value="없음">없음</option></select></div>
      </div></div></div>

      <section class="n8-section"><div class="n8-section-head"><span>04. 생산 연계 예상</span><small>설비는 생산계획 단계에서 지정</small></div><table class="n8-table"><thead><tr><th>제품/Grade</th><th>수주량</th><th>현재재고</th><th>예약재고</th><th>출하가능</th><th>생산필요량</th><th>원료상태</th><th>상태</th></tr></thead><tbody><tr><td data-n8="product">-</td><td data-n8="qty">-</td><td data-n8="current">0 kg</td><td data-n8="reserved">0 kg</td><td data-n8="available">0 kg</td><td data-n8="need">-</td><td data-n8="material">MRP 확인</td><td><span class="n8-badge" data-n8="status">생산계획 필요</span></td></tr></tbody></table></section>
      <div class="n8-error" data-n8-error></div>
    </div><div class="n8-actions"><button type="button" class="n8-btn" data-n8-close>취소</button><button type="button" class="n8-btn soft" data-n8-draft>임시저장</button><button type="button" class="n8-btn primary" data-n8-save>수주 등록</button></div></form></div>`;

    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
    const form=modal.querySelector("form");restore(form,d);refresh(modal);
    form.addEventListener("input",()=>refresh(modal));form.addEventListener("change",()=>refresh(modal));
    modal.querySelectorAll("[data-n8-close]").forEach(b=>b.addEventListener("click",close));
    modal.querySelector("[data-n8-draft]")?.addEventListener("click",()=>{localStorage.setItem(DRAFT,JSON.stringify(draft(form)));alert("임시저장했습니다.")});
    modal.querySelector("[data-n8-save]")?.addEventListener("click",()=>save(form,modal));
    form.elements.customer?.focus();
  }

  function fail(modal,msg){const e=modal.querySelector("[data-n8-error]");if(e){e.textContent=msg;e.classList.add("show")}return false}

  async function save(form,modal){
    const d=draft(form),qty=num(d.qty),price=num(d.unitPrice),id=clean(form.elements.salesOrderId.value)||nextId(d.due),now=new Date().toISOString(),orderType=d.orderType||"양산";
    modal.querySelector("[data-n8-error]")?.classList.remove("show");
    if(!d.customer||!d.product||qty<=0||!d.due) return fail(modal,"고객사·제품/Grade·수주수량·요청 납기일을 확인하세요.");
    if(!["양산","샘플","개발·평가"].includes(orderType)) return fail(modal,"수주구분을 확인하세요.");
    if(usedIds().has(id)) return fail(modal,"이미 사용 중인 수주번호입니다.");

    const sampleInfo=orderType==="양산"?null:{chargeType:d.sampleCharge||"무상",purpose:d.samplePurpose,customerProject:d.customerProject,evaluationItems:d.evaluationItems,customerContact:d.customerContact,evaluationDate:d.evaluationDate,massProductionLink:d.massProductionLink||"미정"};
    const meta={salesOrderIdOverride:id,salesOrderIdAutoRule:"DUE_MINUS_1",orderDate:d.orderDate||today(),orderType,priority:d.priority||"일반",requestedDue:d.due,customerOverride:d.customer,customerPO:d.po,deliveryPlace:d.deliveryPlace,productCategory:CATEGORY,productOverride:d.product,itemCode:d.itemCode||d.product,customerItemCode:d.customerItemCode,specRevision:d.specRevision,qtyOverride:qty,unitPrice:price||0,packaging:d.packagingSpec,packagingSpec:d.packagingSpec,deliveryType:d.deliveryType||"일괄납품",coaRequired:d.coaRequired||"필요",sampleInfo,productionPlanStatus:"계획대기",salesStatus:"확정",salesManager:user(),masterDataOwner:"SALES",source:"NAMO_NEW_ORDER_MODAL_V8",savedAt:now,savedBy:user()};
    const row={id,customer:d.customer,po:d.po||"-",product:d.product,itemCode:d.itemCode||d.product,customerItemCode:d.customerItemCode,specRevision:d.specRevision,productCategory:CATEGORY,orderType,priority:d.priority||"일반",qty,due:d.due,plan:"계획대기",shipping:"-",deliveryPlace:d.deliveryPlace,unitPrice:price||0,packagingSpec:d.packagingSpec,deliveryType:d.deliveryType||"일괄납품",coaRequired:d.coaRequired||"필요",sampleInfo,remarks:d.remarks,orderDate:meta.orderDate,salesStatus:"확정",source:"MANUAL",orderMeta:meta};
    const next=[row,...rows()];
    const btn=modal.querySelector("[data-n8-save]");if(btn){btn.disabled=true;btn.textContent="등록 중..."}
    try{
      localStorage.setItem(SALES,JSON.stringify(next));
      const mm=readMap(META);mm[id]=meta;localStorage.setItem(META,JSON.stringify(mm));
      const pm=readMap(PACK);pm[id]={packagingSpec:d.packagingSpec,total:qty,savedAt:now};localStorage.setItem(PACK,JSON.stringify(pm));
      if(d.remarks){const rm=readMap(REMARK);rm[id]=d.remarks;localStorage.setItem(REMARK,JSON.stringify(rm));}
      if(typeof window.qmesSyncUpsert==="function") await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:now,savedBy:user(),source:"NAMO_NEW_ORDER_MODAL_V8"});
      localStorage.removeItem(DRAFT);
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"new-order",id,orderType}}));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales",id,orderType}}));
      close();
    }catch(err){console.error("[NAMO New Order V8]",err);fail(modal,"수주 저장 중 오류가 발생했습니다. "+clean(err?.message));if(btn){btn.disabled=false;btn.textContent="수주 등록"}}
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
  window.qmesSalesNewOrderNamoV8=api;window.qmesSalesNewOrderNamoV7=api;window.qmesSalesNewOrderNamoV6=api;window.qmesSalesNewOrderNamoV5=api;window.qmesSalesNewOrderNamoV4=api;window.qmesSalesNewOrderNamoV3=api;window.qmesSalesNewOrderNamo=api;window.qmesSalesNewOrderEnterprise=api;
})();
