/* NAMO QMES - New Sales Order Enterprise V7 - 2026-08-31
 * ADD-ONLY owner. Existing historical sales-order files are preserved.
 * Namo Chemical business structure:
 *   - Product category fixed: 절연 슬러리
 *   - Product code / Grade is the actual sales item
 *   - Order type: 양산 / 샘플 / 개발
 *   - Urgent is an independent flag
 *   - Customer PO and unit price are intentionally removed from this QMES screen
 *   - Packaging / CoA / production-link information is captured with the sales order
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V7__) return;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V7__=true;

  /* V7 is the visible owner. Older implementations stay in source control but skip runtime ownership. */
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
  const DRAFT="qmes-sales-new-order-modal-draft-v7";
  const ID="qmes-sales-new-order-modal-v7";
  const STYLE="qmes-sales-new-order-modal-v7-style";
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
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(clean(v)))return today();
    const d=new Date(v+"T12:00:00");
    if(Number.isNaN(d.getTime()))return today();
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
  function distinct(field){return [...new Set(rows().map(r=>clean(r?.[field])).filter(Boolean))].slice(0,40)}

  function stockFor(product){
    const p=clean(product).toLowerCase();if(!p)return 0;let total=0;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||"";
      if(!/(finished|fg|product.*stock|stock.*product|완제품)/i.test(key))continue;
      let data;try{data=JSON.parse(localStorage.getItem(key)||"null")}catch(_){continue}
      const list=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:[];
      list.forEach(x=>{
        const name=clean(x?.product||x?.productName||x?.item||x?.itemName||x?.name).toLowerCase();
        if(name!==p)return;
        total+=num(x?.availableQty??x?.available??x?.stockQty??x?.qty??x?.quantity);
      });
    }
    return Math.max(0,total);
  }

  function ensureDatePicker(){
    try{
      if(window.__QMES_DATE_PICKER_STABLE_20260831_V2__||document.querySelector('script[data-qmes-date-picker-stable="1"]'))return;
      const s=document.createElement("script");
      s.src="./js/qmes-date-picker-stable-20260831-v1.js?v=20260831-calendar3";
      s.async=false;s.dataset.qmesDatePickerStable="1";document.head.appendChild(s);
    }catch(_){ }
  }

  function style(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement("style");s.id=STYLE;s.textContent=`
      #${ID}{position:fixed!important;inset:0!important;z-index:2147483600!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.38)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;color:#172033!important}
      #${ID} *{box-sizing:border-box!important}
      #${ID} .n7-card{width:min(1180px,97vw)!important;max-height:92vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dde4ed!important;border-radius:16px!important;box-shadow:0 28px 80px rgba(15,23,42,.24)!important;overflow:hidden!important}
      #${ID} .n7-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:14px!important;padding:18px 22px 15px!important;border-bottom:1px solid #e8edf3!important;background:#fff!important}
      #${ID} .n7-title{font-size:21px!important;line-height:1.2!important;font-weight:950!important;letter-spacing:-.02em!important;color:#152238!important}
      #${ID} .n7-sub{margin-top:5px!important;font-size:10px!important;font-weight:700!important;color:#8290a3!important}
      #${ID} .n7-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f3f6f9!important;color:#334155!important;font-size:21px!important;cursor:pointer!important}
      #${ID} .n7-body{overflow:auto!important;padding:16px 22px 18px!important;background:#fff!important}
      #${ID} .n7-guide{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin-bottom:13px!important;padding:9px 11px!important;border:1px solid #dbe4ef!important;border-radius:9px!important;background:#f8fbff!important;color:#5f6f83!important;font-size:9.5px!important;font-weight:700!important}
      #${ID} .n7-guide b{color:#2859c7!important}
      #${ID} .n7-section{margin-top:13px!important;border:1px solid #e1e7ef!important;border-radius:11px!important;background:#fff!important;overflow:hidden!important}
      #${ID} .n7-section:first-of-type{margin-top:0!important}
      #${ID} .n7-section-head{height:39px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 12px!important;border-bottom:1px solid #e9edf2!important;background:#fafbfd!important;color:#26364c!important;font-size:10.5px!important;font-weight:950!important}
      #${ID} .n7-section-head small{color:#8b98aa!important;font-size:9px!important;font-weight:700!important}
      #${ID} .n7-section-body{padding:12px!important}
      #${ID} .n7-grid4{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:11px 12px!important}
      #${ID} .n7-grid3{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:11px 12px!important}
      #${ID} .n7-field.full{grid-column:1/-1!important}
      #${ID} .n7-field.w2{grid-column:span 2!important}
      #${ID} .n7-field label{display:block!important;margin:0 0 5px!important;color:#5d6979!important;font-size:9.5px!important;font-weight:900!important}
      #${ID} .n7-field input,#${ID} .n7-field select,#${ID} .n7-field textarea{width:100%!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#172033!important;-webkit-text-fill-color:#172033!important;font:inherit!important;font-size:11px!important;outline:none!important}
      #${ID} .n7-field input,#${ID} .n7-field select{height:38px!important;padding:0 10px!important}
      #${ID} .n7-field textarea{height:68px!important;padding:9px 10px!important;resize:vertical!important}
      #${ID} .n7-field input[readonly]{background:#f6f8fb!important;color:#536174!important;-webkit-text-fill-color:#536174!important;font-weight:850!important}
      #${ID} .n7-field input:focus,#${ID} .n7-field select:focus,#${ID} .n7-field textarea:focus{border-color:#85a5ef!important;box-shadow:0 0 0 3px rgba(49,91,221,.07)!important}
      #${ID} .n7-type{font-weight:900!important;color:#17418f!important;background:#f7faff!important;border-color:#b8cbee!important}
      #${ID} .n7-category{background:#eef5ff!important;color:#234e9e!important;-webkit-text-fill-color:#234e9e!important}
      #${ID} .n7-urgent{height:38px!important;display:flex!important;align-items:center!important;gap:9px!important;padding:0 11px!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:11px!important;font-weight:850!important}
      #${ID} .n7-urgent input{appearance:auto!important;-webkit-appearance:checkbox!important;width:15px!important;height:15px!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}
      #${ID} .n7-urgent.on{border-color:#f1b5b5!important;background:#fff6f6!important;color:#b42318!important}
      #${ID} .n7-sample{display:none!important;margin-top:13px!important;border:1px solid #cfdbf2!important;border-radius:10px!important;background:#fbfdff!important;overflow:hidden!important}
      #${ID} .n7-sample.show{display:block!important}
      #${ID} .n7-sample-head{height:38px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 12px!important;background:#f4f8ff!important;border-bottom:1px solid #e2eaf8!important;color:#2f579b!important;font-size:10px!important;font-weight:950!important}
      #${ID} .n7-sample-body{padding:12px!important}
      #${ID} .n7-table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important}
      #${ID} .n7-table th,#${ID} .n7-table td{height:41px!important;padding:0 10px!important;border-bottom:1px solid #edf1f5!important;text-align:left!important;vertical-align:middle!important;font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #${ID} .n7-table th{background:#fafbfd!important;color:#6d798b!important;font-size:9px!important;font-weight:900!important}
      #${ID} .n7-table tr:last-child td{border-bottom:0!important}
      #${ID} .n7-badge{display:inline-flex!important;align-items:center!important;height:23px!important;padding:0 8px!important;border-radius:999px!important;background:#eaf1ff!important;color:#2858c5!important;font-size:8.5px!important;font-weight:950!important}
      #${ID} .n7-error{display:none!important;margin-top:12px!important;padding:10px 11px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:10px!important;font-weight:850!important}
      #${ID} .n7-error.show{display:block!important}
      #${ID} .n7-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 22px 16px!important;border-top:1px solid #e8edf3!important;background:#fff!important}
      #${ID} .n7-btn{height:39px!important;padding:0 15px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font:inherit!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}
      #${ID} .n7-btn.soft{background:#eef4ff!important;border-color:#d7e4ff!important;color:#2853cc!important}
      #${ID} .n7-btn.primary{background:#285bd8!important;border-color:#285bd8!important;color:#fff!important}
      #${ID} .n7-btn:disabled{opacity:.55!important;cursor:wait!important}
      @media(max-width:900px){#${ID}{padding:8px!important;align-items:flex-start!important}#${ID} .n7-card{max-height:98vh!important}#${ID} .n7-grid4,#${ID} .n7-grid3{grid-template-columns:1fr 1fr!important}#${ID} .n7-field.w2{grid-column:span 1!important}}
      @media(max-width:560px){#${ID} .n7-grid4,#${ID} .n7-grid3{grid-template-columns:1fr!important}}
    `;document.head.appendChild(s);
  }

  function removeLegacy(){
    ["qmes-sales-new-order-modal-v6","qmes-sales-new-order-modal-v5","qmes-sales-new-order-namo-20260828-v4","qmes-sales-new-order-namo-20260828-v3","qmes-sales-new-order-namo-20260828-v2","qmes-sales-new-order-enterprise-20260828-v1"].forEach(id=>document.getElementById(id)?.remove());
    Array.from(document.querySelectorAll('[role="dialog"][aria-label="신규 수주 등록"]')).forEach(d=>{if(d.closest(`#${ID}`))return;try{d.parentElement?.remove()}catch(_){try{d.remove()}catch(__){}}});
  }
  function close(){document.getElementById(ID)?.remove();document.documentElement.style.overflow="";}

  function draft(form){
    const fd=new FormData(form),g=n=>clean(fd.get(n));
    return {
      orderDate:g("orderDate"),orderType:g("orderType")||"양산",urgent:form.elements.urgent?.checked===true,
      customer:g("customer"),due:g("due"),deliveryPlace:g("deliveryPlace"),product:g("product"),qty:g("qty"),
      packagingType:g("packagingType"),unitPackQty:g("unitPackQty"),packageQty:g("packageQty"),coaRequired:g("coaRequired")||"필요",
      remarks:g("remarks"),samplePurpose:g("samplePurpose"),evaluationDate:g("evaluationDate"),massProductionLink:g("massProductionLink")
    };
  }
  function restore(form,d){
    if(!d||typeof d!=="object")return;
    Object.entries(d).forEach(([k,v])=>{if(k==="urgent")return;if(form.elements[k])form.elements[k].value=v??""});
    if(form.elements.urgent)form.elements.urgent.checked=Boolean(d.urgent);
    if(form.elements.orderType&&!clean(form.elements.orderType.value))form.elements.orderType.value="양산";
  }
  function packagingText(d){
    const type=clean(d.packagingType)||"기타",unit=num(d.unitPackQty),count=Math.max(0,Math.trunc(num(d.packageQty)));
    if(unit>0&&count>0)return `${type} · ${unit}kg × ${count}EA`;
    if(unit>0)return `${type} · ${unit}kg`;
    return type;
  }
  function statusLabel(orderType){return orderType==="샘플"?"샘플 계획 검토":orderType==="개발"?"개발 계획 검토":"계획 검토"}

  function refresh(modal){
    const f=modal.querySelector("form"),g=n=>clean(f.elements[n]?.value),qty=num(g("qty")),stock=stockFor(g("product")),need=Math.max(0,qty-stock),orderType=g("orderType")||"양산";
    if(g("due"))f.elements.salesOrderId.value=nextId(g("due"));
    const sample=modal.querySelector("[data-n7-sample]");if(sample)sample.classList.toggle("show",orderType!=="양산");
    const urgent=modal.querySelector(".n7-urgent");if(urgent)urgent.classList.toggle("on",f.elements.urgent?.checked===true);
    const set=(k,v)=>modal.querySelectorAll(`[data-n7="${k}"]`).forEach(el=>el.textContent=v);
    set("product",g("product")||"-");set("qty",qty?qty.toLocaleString("ko-KR")+" kg":"-");set("stock",stock?stock.toLocaleString("ko-KR")+" kg":"0 kg");set("need",qty?need.toLocaleString("ko-KR")+" kg":"-");set("status",statusLabel(orderType));
  }

  function open(){
    style();ensureDatePicker();removeLegacy();close();
    const d=read(DRAFT,{}),customers=distinct("customer"),products=distinct("product"),modal=document.createElement("div");
    modal.id=ID;
    modal.innerHTML=`<div class="n7-card" role="dialog" aria-modal="true" aria-label="신규 수주 등록"><div class="n7-head"><div><div class="n7-title">신규 수주 등록</div><div class="n7-sub">나모케미칼 절연 슬러리 수주 → 생산계획 → 작업지시 → 품질 → 출하 연계</div></div><button type="button" class="n7-close" data-n7-close>×</button></div><form><div class="n7-body">
      <datalist id="n7-customers">${customers.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>
      <datalist id="n7-products">${products.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>
      <div class="n7-guide"><span><b>제품군은 절연 슬러리로 고정</b>하고 실제 품목은 제품코드 / Grade로 관리합니다.</span><span>고객 PO · 단가는 QMES 수주등록에서 제외</span></div>

      <section class="n7-section"><div class="n7-section-head"><span>01. 수주 기본정보</span><small>수주 성격과 기준일 관리</small></div><div class="n7-section-body"><div class="n7-grid4">
        <div class="n7-field"><label>수주번호</label><input name="salesOrderId" readonly placeholder="요청 납기 입력 시 자동생성"></div>
        <div class="n7-field"><label>수주일자</label><input type="date" name="orderDate" value="${today()}"></div>
        <div class="n7-field"><label>수주구분 *</label><select class="n7-type" name="orderType"><option value="양산">양산</option><option value="샘플">샘플</option><option value="개발">개발</option></select></div>
        <div class="n7-field"><label>긴급 여부</label><label class="n7-urgent"><input type="checkbox" name="urgent"> 긴급 수주</label></div>
      </div></div></section>

      <section class="n7-section"><div class="n7-section-head"><span>02. 고객 · 납기</span><small>고객사와 요청 납기 기준</small></div><div class="n7-section-body"><div class="n7-grid3">
        <div class="n7-field"><label>고객사 *</label><input name="customer" list="n7-customers" placeholder="고객사 입력"></div>
        <div class="n7-field"><label>요청 납기일 *</label><input type="date" name="due"></div>
        <div class="n7-field"><label>납품처</label><input name="deliveryPlace" placeholder="고객 지정 납품처"></div>
      </div></div></section>

      <section class="n7-section"><div class="n7-section-head"><span>03. 제품 · 수량</span><small>나모케미칼 판매 품목 기준</small></div><div class="n7-section-body"><div class="n7-grid3">
        <div class="n7-field"><label>제품군</label><input class="n7-category" value="${CATEGORY}" readonly></div>
        <div class="n7-field"><label>제품코드 / Grade *</label><input name="product" list="n7-products" placeholder="예: DBA1501"></div>
        <div class="n7-field"><label>수주수량 (kg) *</label><input type="number" min="0" step="0.001" name="qty" placeholder="0"></div>
      </div></div></section>

      <section class="n7-section"><div class="n7-section-head"><span>04. 포장 · 품질조건</span><small>출하와 CoA 기준</small></div><div class="n7-section-body"><div class="n7-grid4">
        <div class="n7-field"><label>포장형태</label><select name="packagingType"><option value="기타">기타</option><option value="Drum">Drum</option><option value="Pail">Pail</option><option value="말통">말통</option></select></div>
        <div class="n7-field"><label>단위포장량 (kg)</label><input type="number" min="0" step="0.001" name="unitPackQty" placeholder="예: 20"></div>
        <div class="n7-field"><label>포장수량 (EA)</label><input type="number" min="0" step="1" name="packageQty" placeholder="예: 10"></div>
        <div class="n7-field"><label>CoA</label><select name="coaRequired"><option value="필요">필요</option><option value="불필요">불필요</option></select></div>
      </div></div></section>

      <div class="n7-sample" data-n7-sample><div class="n7-sample-head"><span>샘플 / 개발 추가정보</span><span>양산 수주는 표시하지 않음</span></div><div class="n7-sample-body"><div class="n7-grid3">
        <div class="n7-field"><label>샘플 / 개발 목적</label><input name="samplePurpose" placeholder="고객 평가 목적 또는 개발 목적"></div>
        <div class="n7-field"><label>평가 예정일</label><input type="date" name="evaluationDate"></div>
        <div class="n7-field"><label>양산 연계 예상</label><select name="massProductionLink"><option value="미정">미정</option><option value="있음">있음</option><option value="없음">없음</option></select></div>
      </div></div></div>

      <section class="n7-section"><div class="n7-section-head"><span>05. 고객 요구사항</span><small>라벨 · 운송 · 검사 · 기타 특이사항</small></div><div class="n7-section-body"><div class="n7-field full"><label>비고 / 고객 요구사항</label><textarea name="remarks" placeholder="라벨, 포장, CoA, 운송, 검사, 기타 고객 요구사항을 입력하세요."></textarea></div></div></section>

      <section class="n7-section"><div class="n7-section-head"><span>생산 연계 예상</span><small>수주 등록 후 생산계획에서 확정</small></div><table class="n7-table"><thead><tr><th>제품</th><th>수주량</th><th>가용 완제품재고</th><th>생산 필요량</th><th>예상 설비</th><th>상태</th></tr></thead><tbody><tr><td data-n7="product">-</td><td data-n7="qty">-</td><td data-n7="stock">0 kg</td><td data-n7="need">-</td><td>생산계획에서 지정</td><td><span class="n7-badge" data-n7="status">계획 검토</span></td></tr></tbody></table></section>
      <div class="n7-error" data-n7-error></div>
    </div><div class="n7-actions"><button type="button" class="n7-btn" data-n7-close>취소</button><button type="button" class="n7-btn soft" data-n7-draft>임시저장</button><button type="button" class="n7-btn primary" data-n7-save>수주 등록</button></div></form></div>`;

    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
    const form=modal.querySelector("form");restore(form,d);refresh(modal);
    form.addEventListener("input",()=>refresh(modal));form.addEventListener("change",()=>refresh(modal));
    modal.querySelectorAll("[data-n7-close]").forEach(b=>b.addEventListener("click",close));
    modal.querySelector("[data-n7-draft]")?.addEventListener("click",()=>{localStorage.setItem(DRAFT,JSON.stringify(draft(form)));alert("임시저장했습니다.")});
    modal.querySelector("[data-n7-save]")?.addEventListener("click",()=>save(form,modal));
    form.elements.customer?.focus();
  }

  function fail(modal,msg){const e=modal.querySelector("[data-n7-error]");if(e){e.textContent=msg;e.classList.add("show")}return false}

  async function save(form,modal){
    const d=draft(form),qty=num(d.qty),id=clean(form.elements.salesOrderId.value)||nextId(d.due),now=new Date().toISOString(),orderType=d.orderType||"양산";
    modal.querySelector("[data-n7-error]")?.classList.remove("show");
    if(!d.customer||!d.product||qty<=0||!d.due)return fail(modal,"고객사·제품코드/Grade·수주수량·요청 납기일을 확인하세요.");
    if(!["양산","샘플","개발"].includes(orderType))return fail(modal,"수주구분을 확인하세요.");
    if(usedIds().has(id))return fail(modal,"이미 사용 중인 수주번호입니다.");

    const unitPackQty=num(d.unitPackQty),packageQty=Math.max(0,Math.trunc(num(d.packageQty))),packagingSpec=packagingText(d);
    const sampleInfo=orderType==="양산"?null:{purpose:d.samplePurpose,evaluationDate:d.evaluationDate,massProductionLink:d.massProductionLink||"미정"};
    const meta={
      salesOrderIdOverride:id,salesOrderIdAutoRule:"DUE_MINUS_1",orderDate:d.orderDate||today(),orderType,urgent:Boolean(d.urgent),requestedDue:d.due,
      customerOverride:d.customer,productCategory:CATEGORY,productOverride:d.product,itemCode:d.product,qtyOverride:qty,deliveryPlace:d.deliveryPlace,
      packaging:packagingSpec,packagingSpec,packagingType:d.packagingType||"기타",unitPackQty,packageQty,coaRequired:d.coaRequired||"필요",sampleInfo,
      productionPlanStatus:"계획대기",salesStatus:"확정",salesManager:user(),masterDataOwner:"SALES",source:"NAMO_NEW_ORDER_MODAL_V7",savedAt:now,savedBy:user()
    };
    const row={
      id,customer:d.customer,po:"-",product:d.product,itemCode:d.product,productCategory:CATEGORY,orderType,urgent:Boolean(d.urgent),qty,due:d.due,
      plan:"계획대기",shipping:"-",deliveryPlace:d.deliveryPlace,packagingSpec,packagingType:d.packagingType||"기타",unitPackQty,packageQty,
      coaRequired:d.coaRequired||"필요",sampleInfo,remarks:d.remarks,orderDate:meta.orderDate,salesStatus:"확정",source:"MANUAL",orderMeta:meta
    };
    const next=[row,...rows()];
    const saveButton=modal.querySelector("[data-n7-save]");if(saveButton){saveButton.disabled=true;saveButton.textContent="등록 중..."}
    try{
      localStorage.setItem(SALES,JSON.stringify(next));
      const mm=readMap(META);mm[id]=meta;localStorage.setItem(META,JSON.stringify(mm));
      const pm=readMap(PACK);pm[id]={type:d.packagingType||"기타",unitWeight:unitPackQty,packageQty,total:qty,packagingSpec,savedAt:now};localStorage.setItem(PACK,JSON.stringify(pm));
      if(d.remarks){const rm=readMap(REMARK);rm[id]=d.remarks;localStorage.setItem(REMARK,JSON.stringify(rm))}
      if(typeof window.qmesSyncUpsert==="function")await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:now,savedBy:user(),source:"NAMO_NEW_ORDER_MODAL_V7"});
      localStorage.removeItem(DRAFT);
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"new-order",id,orderType,urgent:Boolean(d.urgent)}}));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales",id,orderType}}));
      close();
    }catch(err){
      console.error("[NAMO New Order Modal V7]",err);
      fail(modal,"수주 저장 중 오류가 발생했습니다. "+clean(err?.message));
      if(saveButton){saveButton.disabled=false;saveButton.textContent="수주 등록"}
    }
  }

  function isNewOrderButton(button){
    if(!button||button.closest('[role="dialog"]'))return false;
    return clean(button.textContent).replace(/^\+\s*/,"")==="신규 수주";
  }

  window.addEventListener("click",e=>{
    const t=e.target;if(!(t instanceof Element))return;
    const b=t.closest("button");if(!isNewOrderButton(b))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();
  },true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById(ID))close()},true);

  /* If a legacy owner still injects a modal, replace it immediately. */
  let queued=false;
  const observer=new MutationObserver(records=>{
    if(queued||document.getElementById(ID))return;
    const legacy=records.some(r=>Array.from(r.addedNodes||[]).some(n=>n instanceof Element&&(/신규\s*수주\s*등록/.test(clean(n.textContent))&&n.querySelector?.("form"))));
    if(!legacy)return;queued=true;
    queueMicrotask(()=>{queued=false;const old=Array.from(document.querySelectorAll('[role="dialog"][aria-label="신규 수주 등록"]')).some(d=>!d.closest(`#${ID}`));if(old)open()});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  const api={open,close};
  window.qmesSalesNewOrderNamoV7=api;
  window.qmesSalesNewOrderNamoV6=api;
  window.qmesSalesNewOrderNamoV5=api;
  window.qmesSalesNewOrderNamoV4=api;
  window.qmesSalesNewOrderNamoV3=api;
  window.qmesSalesNewOrderNamo=api;
  window.qmesSalesNewOrderEnterprise=api;
})();
