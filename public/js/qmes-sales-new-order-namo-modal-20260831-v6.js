/* NAMO QMES - New Sales Order centered modal V6 - 2026-08-31
 * ADD-ONLY owner. Separates product/grade from order purpose.
 * Order type: mass production / sample / development-evaluation.
 * Keeps one Sales Order = one product for downstream QMES compatibility.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V6__)return;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260831_V6__=true;

  /* V6 owns the new-order modal. Skip older owners without deleting them. */
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260828_V5__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V4__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V3__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V2__=true;
  window.__QMES_SALES_NEW_ORDER_ENTERPRISE_20260828_V1__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const REMARK="qmes-sales-remarks-v1";
  const DRAFT="qmes-sales-new-order-modal-draft-v6";
  const LEGACY_DRAFT="qmes-sales-new-order-modal-draft-v5";
  const ID="qmes-sales-new-order-modal-v6";
  const STYLE="qmes-sales-new-order-modal-v6-style";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const map=()=>{const v=read(META,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
  const rows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const user=()=>clean(window.__QMES_USER__?.name||window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__||window.__QMES_CURRENT_USER__)||"로그인 사용자";

  function dateMinusOne(v){
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(clean(v)))return today();
    const d=new Date(v+"T00:00:00");
    d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function used(){
    const m=map(),s=new Set();
    rows().forEach(r=>{const id=clean(r?.id),key=clean(r?.workOrder)||id,mm=m[key]||m[id]||r?.orderMeta||{};s.add(clean(mm.salesOrderIdOverride)||id)});
    return s;
  }
  function nextId(due){
    const stamp=dateMinusOne(due).replace(/-/g,""),s=used();let n=1,id="";
    do{id=`SO-${stamp}-${String(n++).padStart(3,"0")}`}while(s.has(id));
    return id;
  }
  function distinct(field){return [...new Set(rows().map(r=>clean(r?.[field])).filter(Boolean))].slice(0,30)}

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

  function style(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement("style");s.id=STYLE;s.textContent=`
      #${ID}{position:fixed!important;inset:0!important;z-index:2147483500!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(15,23,42,.34)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${ID} *{box-sizing:border-box!important}
      #${ID} .nm-card{width:min(1120px,97vw)!important;max-height:92vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dfe5ed!important;border-radius:16px!important;box-shadow:0 28px 80px rgba(15,23,42,.24)!important;overflow:hidden!important}
      #${ID} .nm-head{display:flex!important;justify-content:space-between!important;align-items:flex-start!important;padding:18px 20px 14px!important;border-bottom:1px solid #e8edf3!important}
      #${ID} .nm-title{font-size:20px!important;font-weight:950!important;color:#182238!important}
      #${ID} .nm-sub{margin-top:4px!important;font-size:10px!important;color:#8a96a8!important}
      #${ID} .nm-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f4f6f9!important;font-size:22px!important;color:#334155!important;cursor:pointer!important}
      #${ID} .nm-body{overflow:auto!important;padding:16px 20px 18px!important}
      #${ID} .nm-note{margin-bottom:13px!important;padding:9px 11px!important;border:1px dashed #d4deeb!important;border-radius:8px!important;background:#f9fbfd!important;color:#65748a!important;font-size:9.5px!important}
      #${ID} .nm-grid4{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:11px 12px!important}
      #${ID} .nm-grid3{display:grid!important;grid-template-columns:2fr 1fr 1fr!important;gap:11px 12px!important}
      #${ID} .nm-grid2{display:grid!important;grid-template-columns:1fr 1fr!important;gap:11px 12px!important}
      #${ID} .nm-field.full{grid-column:1/-1!important}
      #${ID} .nm-field.w2{grid-column:span 2!important}
      #${ID} .nm-field label{display:block!important;margin-bottom:5px!important;color:#59667a!important;font-size:9.5px!important;font-weight:900!important}
      #${ID} .nm-field input,#${ID} .nm-field select,#${ID} .nm-field textarea{width:100%!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font:inherit!important;font-size:11px!important;outline:none!important}
      #${ID} .nm-field input,#${ID} .nm-field select{height:38px!important;padding:0 10px!important}
      #${ID} .nm-field textarea{height:72px!important;padding:9px 10px!important;resize:vertical!important}
      #${ID} .nm-field input[readonly]{background:#f7f9fc!important;color:#59667a!important}
      #${ID} .nm-field input:focus,#${ID} .nm-field select:focus,#${ID} .nm-field textarea:focus{border-color:#8baaf4!important;box-shadow:0 0 0 3px rgba(49,91,221,.07)!important}
      #${ID} .nm-type{font-weight:900!important;color:#173e8c!important;background:#f7faff!important;border-color:#b9caee!important}
      #${ID} .nm-sample-box{margin-top:14px!important;border:1px solid #cfdcf5!important;border-radius:11px!important;overflow:hidden!important;background:#fbfdff!important}
      #${ID} .nm-sample-head{display:flex!important;align-items:center!important;justify-content:space-between!important;height:40px!important;padding:0 12px!important;border-bottom:1px solid #e1e9f7!important;background:#f4f8ff!important;color:#274a91!important;font-size:10.5px!important;font-weight:950!important}
      #${ID} .nm-sample-help{font-size:9px!important;font-weight:750!important;color:#7890bd!important}
      #${ID} .nm-sample-body{padding:12px!important}
      #${ID} .nm-section{margin-top:14px!important;border:1px solid #e1e7ef!important;border-radius:11px!important;overflow:hidden!important}
      #${ID} .nm-section-head{height:39px!important;display:flex!important;align-items:center!important;padding:0 12px!important;border-bottom:1px solid #e9edf2!important;background:#fbfcfe!important;color:#334155!important;font-size:10.5px!important;font-weight:950!important}
      #${ID} .nm-table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important}
      #${ID} .nm-table th,#${ID} .nm-table td{height:42px!important;padding:0 10px!important;border-bottom:1px solid #edf1f5!important;text-align:left!important;vertical-align:middle!important;font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #${ID} .nm-table th{background:#fafbfd!important;color:#697589!important;font-size:9px!important;font-weight:900!important}
      #${ID} .nm-table tr:last-child td{border-bottom:0!important}
      #${ID} .nm-badge{display:inline-flex!important;align-items:center!important;height:23px!important;padding:0 8px!important;border-radius:99px!important;background:#eaf1ff!important;color:#2657c8!important;font-size:8.5px!important;font-weight:950!important}
      #${ID} .nm-error{display:none!important;margin-top:11px!important;padding:9px 10px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:10px!important;font-weight:850!important}
      #${ID} .nm-error.show{display:block!important}
      #${ID} .nm-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 20px 16px!important;border-top:1px solid #e8edf3!important;background:#fff!important}
      #${ID} .nm-btn{height:39px!important;padding:0 14px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font:inherit!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}
      #${ID} .nm-btn.soft{background:#eef4ff!important;border-color:#d7e4ff!important;color:#2853cc!important}
      #${ID} .nm-btn.primary{background:#285bd8!important;border-color:#285bd8!important;color:#fff!important}
      #${ID} .nm-btn:disabled{opacity:.55!important;cursor:wait!important}
      @media(max-width:900px){#${ID}{padding:8px!important;align-items:flex-start!important}#${ID} .nm-card{max-height:98vh!important}#${ID} .nm-grid4,#${ID} .nm-grid3,#${ID} .nm-grid2{grid-template-columns:1fr 1fr!important}#${ID} .nm-field.w2{grid-column:span 1!important}}
      @media(max-width:560px){#${ID} .nm-grid4,#${ID} .nm-grid3,#${ID} .nm-grid2{grid-template-columns:1fr!important}#${ID} .nm-field.w2{grid-column:span 1!important}}
    `;
    document.head.appendChild(s);
  }

  function close(){
    document.getElementById(ID)?.remove();
    document.getElementById("qmes-sales-new-order-modal-v5")?.remove();
    document.documentElement.style.overflow="";
  }

  function draft(form){
    const fd=new FormData(form),g=n=>clean(fd.get(n));
    return {
      orderDate:g("orderDate"),orderType:g("orderType")||"양산",customer:g("customer"),due:g("due"),
      product:g("product"),itemCode:g("itemCode"),customerItemCode:g("customerItemCode"),specRevision:g("specRevision"),
      qty:g("qty"),unitPrice:g("unitPrice"),po:g("po"),deliveryPlace:g("deliveryPlace"),packagingSpec:g("packagingSpec"),
      splitDelivery:g("splitDelivery"),coaRequired:g("coaRequired"),remarks:g("remarks"),samplePurpose:g("samplePurpose"),
      sampleCharge:g("sampleCharge"),customerProject:g("customerProject"),evaluationItems:g("evaluationItems"),
      customerContact:g("customerContact"),evaluationDate:g("evaluationDate"),massProductionLink:g("massProductionLink")
    };
  }
  function restore(form,d){
    if(!d||typeof d!=="object")return;
    Object.entries(d).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??""});
    if(form.elements.orderType&&!clean(form.elements.orderType.value))form.elements.orderType.value="양산";
  }
  function statusLabel(orderType){
    if(orderType==="샘플")return "샘플 생산 검토";
    if(orderType==="개발·평가")return "개발 생산 검토";
    return "계획 검토";
  }
  function refresh(modal){
    const f=modal.querySelector("form"),g=n=>clean(f.elements[n]?.value),qty=num(g("qty")),stock=stockFor(g("product")),need=Math.max(0,qty-stock),orderType=g("orderType")||"양산";
    if(g("due"))f.elements.salesOrderId.value=nextId(g("due"));
    const sample=modal.querySelector("[data-nm-sample]");if(sample)sample.style.display=orderType==="양산"?"none":"block";
    const set=(k,v)=>modal.querySelectorAll(`[data-nm="${k}"]`).forEach(el=>el.textContent=v);
    set("orderType",orderType);set("product",g("product")||"-");set("qty",qty?qty.toLocaleString("ko-KR")+" kg":"-");set("stock",stock?stock.toLocaleString("ko-KR")+" kg":"0 kg");set("need",qty?need.toLocaleString("ko-KR")+" kg":"-");set("status",statusLabel(orderType));
  }

  function open(){
    style();close();
    const d=read(DRAFT,read(LEGACY_DRAFT,{})),customers=distinct("customer"),products=distinct("product"),modal=document.createElement("div");
    modal.id=ID;
    modal.innerHTML=`<div class="nm-card" role="dialog" aria-modal="true" aria-label="신규 수주 등록"><div class="nm-head"><div><div class="nm-title">신규 수주 등록</div><div class="nm-sub">수주구분과 절연슬러리 제품/Grade를 분리하여 생산·품질·출하 이력을 연결합니다.</div></div><button type="button" class="nm-close" data-nm-close>×</button></div><form><div class="nm-body">
      <datalist id="nm-v6-customers">${customers.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>
      <datalist id="nm-v6-products">${products.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>
      <div class="nm-note">제품은 실제 절연슬러리 제품명/Grade로 관리하고, 공급 목적은 <b>수주구분(양산·샘플·개발·평가)</b>으로 별도 관리합니다. 기존 수주·생산 데이터는 덮어쓰지 않습니다.</div>

      <div class="nm-grid4">
        <div class="nm-field"><label>수주번호</label><input name="salesOrderId" readonly placeholder="납기 입력 시 자동생성"></div>
        <div class="nm-field"><label>수주일자</label><input type="date" name="orderDate" value="${today()}"></div>
        <div class="nm-field"><label>수주구분 *</label><select class="nm-type" name="orderType"><option value="양산">양산</option><option value="샘플">샘플</option><option value="개발·평가">개발·평가</option></select></div>
        <div class="nm-field"><label>요청 납기일 *</label><input type="date" name="due"></div>
      </div>

      <div style="height:11px"></div>
      <div class="nm-grid4">
        <div class="nm-field w2"><label>고객사 *</label><input name="customer" list="nm-v6-customers" placeholder="고객사 입력"></div>
        <div class="nm-field"><label>고객 PO</label><input name="po" placeholder="고객 발주번호"></div>
        <div class="nm-field"><label>납품처</label><input name="deliveryPlace" placeholder="고객 지정 납품처"></div>
      </div>

      <div style="height:11px"></div>
      <div class="nm-grid4">
        <div class="nm-field w2"><label>제품 / Grade *</label><input name="product" list="nm-v6-products" placeholder="절연슬러리 제품명 / Grade"></div>
        <div class="nm-field"><label>사내 품목코드</label><input name="itemCode" placeholder="예: NM-IS-001"></div>
        <div class="nm-field"><label>고객 품번</label><input name="customerItemCode" placeholder="고객 지정 품번"></div>
      </div>

      <div style="height:11px"></div>
      <div class="nm-grid4">
        <div class="nm-field"><label>Spec / Rev.</label><input name="specRevision" placeholder="예: Rev.03"></div>
        <div class="nm-field"><label>수주수량 (kg) *</label><input type="number" min="0" step="0.001" name="qty"></div>
        <div class="nm-field"><label>단가 (원/kg)</label><input type="number" min="0" step="1" name="unitPrice" placeholder="선택 입력"></div>
        <div class="nm-field"><label>포장규격</label><input name="packagingSpec" placeholder="예: 20kg × 10EA"></div>
      </div>

      <div style="height:11px"></div>
      <div class="nm-grid4">
        <div class="nm-field"><label>납품 방식</label><select name="splitDelivery"><option value="일괄납품">일괄납품</option><option value="분할납품">분할납품</option></select></div>
        <div class="nm-field"><label>CoA</label><select name="coaRequired"><option value="필요">필요</option><option value="불필요">불필요</option></select></div>
        <div class="nm-field w2"><label>비고 / 고객 요구사항</label><input name="remarks" placeholder="라벨, CoA, 운송, 포장, 기타 고객 요구사항"></div>
      </div>

      <section class="nm-sample-box" data-nm-sample style="display:none"><div class="nm-sample-head"><span>샘플 / 개발·평가 정보</span><span class="nm-sample-help">수주구분이 샘플 또는 개발·평가일 때만 사용</span></div><div class="nm-sample-body">
        <div class="nm-grid4">
          <div class="nm-field w2"><label>샘플 / 평가 목적</label><input name="samplePurpose" placeholder="예: 고객 공정 적용성 평가"></div>
          <div class="nm-field"><label>샘플 구분</label><select name="sampleCharge"><option value="무상">무상</option><option value="유상">유상</option></select></div>
          <div class="nm-field"><label>양산 연계 예상</label><select name="massProductionLink"><option value="미정">미정</option><option value="있음">있음</option><option value="없음">없음</option></select></div>
        </div>
        <div style="height:11px"></div>
        <div class="nm-grid4">
          <div class="nm-field"><label>고객 프로젝트</label><input name="customerProject" placeholder="프로젝트명 / 차종 / 개발코드"></div>
          <div class="nm-field"><label>고객 담당자</label><input name="customerContact" placeholder="담당자명 / 부서"></div>
          <div class="nm-field"><label>평가 예정일</label><input type="date" name="evaluationDate"></div>
          <div class="nm-field"><label>평가 항목</label><input name="evaluationItems" placeholder="접착력, 절연성, 도포성 등"></div>
        </div>
      </div></section>

      <section class="nm-section"><div class="nm-section-head">생산 연계 예상</div><table class="nm-table"><thead><tr><th>수주구분</th><th>제품 / Grade</th><th>수주량</th><th>가용 완제품재고</th><th>생산 필요량</th><th>상태</th></tr></thead><tbody><tr><td data-nm="orderType">양산</td><td data-nm="product">-</td><td data-nm="qty">-</td><td data-nm="stock">0 kg</td><td data-nm="need">-</td><td><span class="nm-badge" data-nm="status">계획 검토</span></td></tr></tbody></table></section>
      <div class="nm-error" data-nm-error></div>
    </div><div class="nm-actions"><button type="button" class="nm-btn" data-nm-close>취소</button><button type="button" class="nm-btn soft" data-nm-draft>임시저장</button><button type="button" class="nm-btn primary" data-nm-save>수주 등록</button></div></form></div>`;

    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
    const form=modal.querySelector("form");restore(form,d);refresh(modal);
    form.addEventListener("input",()=>refresh(modal));form.addEventListener("change",()=>refresh(modal));
    modal.querySelectorAll("[data-nm-draft]").forEach(b=>b.addEventListener("click",()=>{localStorage.setItem(DRAFT,JSON.stringify(draft(form)));alert("임시저장했습니다.")}));
    modal.querySelectorAll("[data-nm-save]").forEach(b=>b.addEventListener("click",()=>save(form,modal)));
    form.elements.customer?.focus();
  }

  function fail(modal,msg){const e=modal.querySelector("[data-nm-error]");if(e){e.textContent=msg;e.classList.add("show")}return false}

  async function save(form,modal){
    const d=draft(form),qty=num(d.qty),price=num(d.unitPrice),id=clean(form.elements.salesOrderId.value)||nextId(d.due),now=new Date().toISOString(),orderType=d.orderType||"양산";
    modal.querySelector("[data-nm-error]")?.classList.remove("show");
    if(!d.customer||!d.product||qty<=0||!d.due)return fail(modal,"고객사·제품/Grade·수주수량·요청 납기일을 확인하세요.");
    if(!["양산","샘플","개발·평가"].includes(orderType))return fail(modal,"수주구분을 확인하세요.");
    if(used().has(id))return fail(modal,"이미 사용 중인 수주번호입니다.");

    const sampleInfo=orderType==="양산"?null:{purpose:d.samplePurpose,chargeType:d.sampleCharge||"무상",customerProject:d.customerProject,evaluationItems:d.evaluationItems,customerContact:d.customerContact,evaluationDate:d.evaluationDate,massProductionLink:d.massProductionLink||"미정"};
    const meta={
      salesOrderIdOverride:id,orderDate:d.orderDate||today(),orderType,requestedDue:d.due,customerOverride:d.customer,
      productOverride:d.product,itemCode:d.itemCode,customerItemCode:d.customerItemCode,specRevision:d.specRevision,qtyOverride:qty,
      deliveryPlace:d.deliveryPlace,unitPrice:price||0,packaging:d.packagingSpec,packagingSpec:d.packagingSpec,splitDelivery:d.splitDelivery||"일괄납품",
      coaRequired:d.coaRequired||"필요",sampleInfo,productionPlanStatus:"계획대기",salesStatus:"확정",salesManager:user(),
      masterDataOwner:"SALES",source:"NAMO_NEW_ORDER_MODAL_V6",savedAt:now,savedBy:user()
    };
    const row={
      id,customer:d.customer,po:d.po||"-",product:d.product,itemCode:d.itemCode,customerItemCode:d.customerItemCode,specRevision:d.specRevision,
      orderType,qty,due:d.due,plan:"계획대기",shipping:"-",deliveryPlace:d.deliveryPlace,unitPrice:price||0,packagingSpec:d.packagingSpec,
      splitDelivery:d.splitDelivery||"일괄납품",coaRequired:d.coaRequired||"필요",sampleInfo,remarks:d.remarks,orderDate:meta.orderDate,
      salesStatus:"확정",source:"MANUAL",orderMeta:meta
    };
    const next=[row,...rows()];
    modal.querySelectorAll("[data-nm-save]").forEach(b=>{b.disabled=true;b.textContent="등록 중..."});
    try{
      localStorage.setItem(SALES,JSON.stringify(next));
      const mm=map();mm[id]=meta;localStorage.setItem(META,JSON.stringify(mm));
      if(d.remarks){const rm=read(REMARK,{});rm[id]=d.remarks;localStorage.setItem(REMARK,JSON.stringify(rm))}
      if(typeof window.qmesSyncUpsert==="function")await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:now,savedBy:user(),source:"NAMO_NEW_ORDER_MODAL_V6"});
      localStorage.removeItem(DRAFT);localStorage.removeItem(LEGACY_DRAFT);
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"new-order",id,orderType}}));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales",id,orderType}}));
      close();
    }catch(err){
      console.error("[NAMO New Order Modal V6]",err);
      fail(modal,"수주 저장 중 오류가 발생했습니다. "+clean(err?.message));
      modal.querySelectorAll("[data-nm-save]").forEach(b=>{b.disabled=false;b.textContent="수주 등록"});
    }
  }

  document.addEventListener("click",e=>{
    const t=e.target;if(!(t instanceof Element))return;
    if(t.closest(`#${ID} [data-nm-close]`)){e.preventDefault();close();return}
    const root=t.closest(".qmes-sales-stable");if(!root)return;
    const b=t.closest("button");if(!b)return;
    const text=clean(b.textContent).replace(/^\+\s*/,"");if(text!=="신규 수주")return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();
  },true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById(ID))close()},true);

  const api={open,close};
  window.qmesSalesNewOrderNamoV6=api;
  window.qmesSalesNewOrderNamoV5=api;
  window.qmesSalesNewOrderNamoV4=api;
  window.qmesSalesNewOrderNamoV3=api;
  window.qmesSalesNewOrderNamo=api;
  window.qmesSalesNewOrderEnterprise=api;
})();
