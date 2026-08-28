/* NAMO QMES - New Sales Order centered modal V5 - 2026-08-28
 * ADD-ONLY owner. Matches the requested compact enterprise modal.
 * One Sales Order = one product. Sales Master stays the source of customer/product/qty/due.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260828_V5__)return;
  window.__QMES_SALES_NEW_ORDER_NAMO_MODAL_20260828_V5__=true;
  /* Loaded before older owners: skip their full-page forms. */
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V4__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V3__=true;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V2__=true;
  window.__QMES_SALES_NEW_ORDER_ENTERPRISE_20260828_V1__=true;

  const SALES="qmes-erp-sales-v1",META="qmes-sales-order-meta-v1",REMARK="qmes-sales-remarks-v1",DRAFT="qmes-sales-new-order-modal-draft-v5";
  const ID="qmes-sales-new-order-modal-v5",STYLE="qmes-sales-new-order-modal-v5-style";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const map=()=>{const v=read(META,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}};
  const rows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const user=()=>clean(window.__QMES_USER__?.name||window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__||window.__QMES_CURRENT_USER__)||"로그인 사용자";

  function dateMinusOne(v){if(!/^20\d{2}-\d{2}-\d{2}$/.test(clean(v)))return today();const d=new Date(v+"T00:00:00");d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function used(){const m=map(),s=new Set();rows().forEach(r=>{const id=clean(r?.id),key=clean(r?.workOrder)||id,mm=m[key]||m[id]||r?.orderMeta||{};s.add(clean(mm.salesOrderIdOverride)||id)});return s}
  function nextId(due){const stamp=dateMinusOne(due).replace(/-/g,""),s=used();let n=1,id="";do{id=`SO-${stamp}-${String(n++).padStart(3,"0")}`}while(s.has(id));return id}
  function distinct(field){return [...new Set(rows().map(r=>clean(r?.[field])).filter(Boolean))].slice(0,30)}

  function stockFor(product){
    const p=clean(product).toLowerCase();if(!p)return 0;let total=0;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||"";
      if(!/(finished|fg|product.*stock|stock.*product|완제품)/i.test(key))continue;
      let data;try{data=JSON.parse(localStorage.getItem(key)||"null")}catch(_){continue}
      const list=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:[];
      list.forEach(x=>{const name=clean(x?.product||x?.productName||x?.item||x?.itemName||x?.name).toLowerCase();if(name!==p)return;total+=num(x?.availableQty??x?.available??x?.stockQty??x?.qty??x?.quantity)});
    }
    return Math.max(0,total);
  }

  function style(){
    if(document.getElementById(STYLE))return;const s=document.createElement("style");s.id=STYLE;s.textContent=`
      #${ID}{position:fixed!important;inset:0!important;z-index:2147483500!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(15,23,42,.34)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${ID} *{box-sizing:border-box!important}#${ID} .nm-card{width:min(1030px,96vw)!important;max-height:90vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dfe5ed!important;border-radius:16px!important;box-shadow:0 28px 80px rgba(15,23,42,.24)!important;overflow:hidden!important}
      #${ID} .nm-head{display:flex!important;justify-content:space-between!important;align-items:flex-start!important;padding:18px 20px 14px!important;border-bottom:1px solid #e8edf3!important}.nm-title{font-size:20px!important;font-weight:950!important;color:#182238!important}.nm-sub{margin-top:4px!important;font-size:10px!important;color:#8a96a8!important}.nm-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f4f6f9!important;font-size:22px!important;color:#334155!important;cursor:pointer!important}
      #${ID} .nm-body{overflow:auto!important;padding:16px 20px 18px!important}.nm-note{margin-bottom:13px!important;padding:9px 11px!important;border:1px dashed #d4deeb!important;border-radius:8px!important;background:#f9fbfd!important;color:#7a8798!important;font-size:9.5px!important}
      #${ID} .nm-grid4{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:11px 12px!important}.nm-grid3{display:grid!important;grid-template-columns:2fr 1fr 1fr!important;gap:11px 12px!important}.nm-grid2{display:grid!important;grid-template-columns:1fr 1fr!important;gap:11px 12px!important}.nm-field.full{grid-column:1/-1!important}.nm-field.w2{grid-column:span 2!important}.nm-field label{display:block!important;margin-bottom:5px!important;color:#59667a!important;font-size:9.5px!important;font-weight:900!important}.nm-field input,.nm-field select,.nm-field textarea{width:100%!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font:inherit!important;font-size:11px!important;outline:none!important}.nm-field input,.nm-field select{height:38px!important;padding:0 10px!important}.nm-field textarea{height:78px!important;padding:9px 10px!important;resize:vertical!important}.nm-field input[readonly]{background:#f7f9fc!important;color:#59667a!important}.nm-field input:focus,.nm-field select:focus,.nm-field textarea:focus{border-color:#8baaf4!important;box-shadow:0 0 0 3px rgba(49,91,221,.07)!important}
      #${ID} .nm-section{margin-top:14px!important;border:1px solid #e1e7ef!important;border-radius:11px!important;overflow:hidden!important}.nm-section-head{height:39px!important;display:flex!important;align-items:center!important;padding:0 12px!important;border-bottom:1px solid #e9edf2!important;background:#fbfcfe!important;color:#334155!important;font-size:10.5px!important;font-weight:950!important}.nm-table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important}.nm-table th,.nm-table td{height:42px!important;padding:0 10px!important;border-bottom:1px solid #edf1f5!important;text-align:left!important;vertical-align:middle!important;font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.nm-table th{background:#fafbfd!important;color:#697589!important;font-size:9px!important;font-weight:900!important}.nm-table tr:last-child td{border-bottom:0!important}.nm-badge{display:inline-flex!important;align-items:center!important;height:23px!important;padding:0 8px!important;border-radius:99px!important;background:#eaf1ff!important;color:#2657c8!important;font-size:8.5px!important;font-weight:950!important}
      #${ID} .nm-error{display:none!important;margin-top:11px!important;padding:9px 10px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:10px!important;font-weight:850!important}.nm-error.show{display:block!important}.nm-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 20px 16px!important;border-top:1px solid #e8edf3!important;background:#fff!important}.nm-btn{height:39px!important;padding:0 14px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font:inherit!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}.nm-btn.soft{background:#eef4ff!important;border-color:#d7e4ff!important;color:#2853cc!important}.nm-btn.primary{background:#285bd8!important;border-color:#285bd8!important;color:#fff!important}.nm-btn:disabled{opacity:.55!important;cursor:wait!important}
      @media(max-width:820px){#${ID}{padding:8px!important;align-items:flex-start!important}#${ID} .nm-card{max-height:98vh!important}.nm-grid4,.nm-grid3,.nm-grid2{grid-template-columns:1fr 1fr!important}.nm-field.w2{grid-column:span 1!important}}
      @media(max-width:560px){#${ID} .nm-grid4,#${ID} .nm-grid3,#${ID} .nm-grid2{grid-template-columns:1fr!important}}
    `;document.head.appendChild(s)
  }

  function close(){document.getElementById(ID)?.remove();document.documentElement.style.overflow=""}
  function draft(form){const fd=new FormData(form),g=n=>clean(fd.get(n));return {orderDate:g("orderDate"),customer:g("customer"),due:g("due"),product:g("product"),qty:g("qty"),unitPrice:g("unitPrice"),po:g("po"),deliveryPlace:g("deliveryPlace"),remarks:g("remarks")}}
  function restore(form,d){if(!d||typeof d!=="object")return;Object.entries(d).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??""})}
  function refresh(modal){const f=modal.querySelector("form"),g=n=>clean(f.elements[n]?.value),qty=num(g("qty")),stock=stockFor(g("product")),need=Math.max(0,qty-stock);if(g("due"))f.elements.salesOrderId.value=nextId(g("due"));const set=(k,v)=>modal.querySelectorAll(`[data-nm="${k}"]`).forEach(el=>el.textContent=v);set("product",g("product")||"-");set("qty",qty?qty.toLocaleString("ko-KR")+" kg":"-");set("stock",stock?stock.toLocaleString("ko-KR")+" kg":"0 kg");set("need",qty?need.toLocaleString("ko-KR")+" kg":"-")}

  function open(){
    style();close();const d=read(DRAFT,{}),customers=distinct("customer"),products=distinct("product"),modal=document.createElement("div");modal.id=ID;
    modal.innerHTML=`<div class="nm-card" role="dialog" aria-modal="true" aria-label="신규 수주 등록"><div class="nm-head"><div><div class="nm-title">신규 수주 등록</div><div class="nm-sub">수주 → 생산계획 → 작업지시까지 동일 수주번호로 연결</div></div><button type="button" class="nm-close" data-nm-close>×</button></div><form><div class="nm-body"><datalist id="nm-v5-customers">${customers.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist><datalist id="nm-v5-products">${products.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist><div class="nm-note">나모케미칼 수주 Master 입력화면입니다. 생산·품질·출하 실적은 수주 확정 후 연결되며 수주 기본값을 덮어쓰지 않습니다.</div><div class="nm-grid4"><div class="nm-field"><label>수주번호</label><input name="salesOrderId" readonly placeholder="납기 입력 시 자동생성"></div><div class="nm-field"><label>수주일자</label><input type="date" name="orderDate" value="${today()}"></div><div class="nm-field"><label>고객사 *</label><input name="customer" list="nm-v5-customers" placeholder="고객사 입력"></div><div class="nm-field"><label>요청 납기일 *</label><input type="date" name="due"></div></div><div style="height:11px"></div><div class="nm-grid3"><div class="nm-field"><label>제품 *</label><input name="product" list="nm-v5-products" placeholder="절연 슬러리 제품명 / 품목코드"></div><div class="nm-field"><label>수주수량 (kg) *</label><input type="number" min="0" step="0.001" name="qty"></div><div class="nm-field"><label>단가 (원/kg)</label><input type="number" min="0" step="1" name="unitPrice" placeholder="선택 입력"></div></div><div style="height:11px"></div><div class="nm-grid2"><div class="nm-field"><label>고객 PO</label><input name="po" placeholder="고객 발주번호"></div><div class="nm-field"><label>납품처</label><input name="deliveryPlace" placeholder="고객 지정 납품처"></div><div class="nm-field full"><label>비고 / 고객 요구사항</label><textarea name="remarks" placeholder="포장, 라벨, CoA, 납기, 운송 등 고객 요구사항"></textarea></div></div><section class="nm-section"><div class="nm-section-head">생산 연계 예상</div><table class="nm-table"><thead><tr><th>제품</th><th>수주량</th><th>가용 완제품재고</th><th>생산 필요량</th><th>예정 설비</th><th>상태</th></tr></thead><tbody><tr><td data-nm="product">-</td><td data-nm="qty">-</td><td data-nm="stock">0 kg</td><td data-nm="need">-</td><td>생산계획에서 지정</td><td><span class="nm-badge">계획 검토</span></td></tr></tbody></table></section><div class="nm-error" data-nm-error></div></div><div class="nm-actions"><button type="button" class="nm-btn" data-nm-close>취소</button><button type="button" class="nm-btn soft" data-nm-draft>임시저장</button><button type="button" class="nm-btn primary" data-nm-save>수주 등록</button></div></form></div>`;
    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";const form=modal.querySelector("form");restore(form,d);refresh(modal);form.addEventListener("input",()=>refresh(modal));form.addEventListener("change",()=>refresh(modal));modal.querySelectorAll("[data-nm-draft]").forEach(b=>b.addEventListener("click",()=>{localStorage.setItem(DRAFT,JSON.stringify(draft(form)));alert("임시저장했습니다.")}));modal.querySelectorAll("[data-nm-save]").forEach(b=>b.addEventListener("click",()=>save(form,modal)));form.elements.customer?.focus();
  }

  function fail(modal,msg){const e=modal.querySelector("[data-nm-error]");if(e){e.textContent=msg;e.classList.add("show")}return false}
  async function save(form,modal){
    const d=draft(form),qty=num(d.qty),price=num(d.unitPrice),id=clean(form.elements.salesOrderId.value)||nextId(d.due),now=new Date().toISOString();modal.querySelector("[data-nm-error]")?.classList.remove("show");if(!d.customer||!d.product||qty<=0||!d.due)return fail(modal,"고객사·제품·수주수량·요청 납기일을 확인하세요.");if(used().has(id))return fail(modal,"이미 사용 중인 수주번호입니다.");
    const meta={salesOrderIdOverride:id,orderDate:d.orderDate||today(),requestedDue:d.due,customerOverride:d.customer,productOverride:d.product,qtyOverride:qty,deliveryPlace:d.deliveryPlace,unitPrice:price||0,productionPlanStatus:"계획대기",salesStatus:"확정",salesManager:user(),masterDataOwner:"SALES",source:"NAMO_NEW_ORDER_MODAL_V5",savedAt:now,savedBy:user()};
    const row={id,customer:d.customer,po:d.po||"-",product:d.product,qty,due:d.due,plan:"계획대기",shipping:"-",deliveryPlace:d.deliveryPlace,unitPrice:price||0,remarks:d.remarks,orderDate:meta.orderDate,salesStatus:"확정",source:"MANUAL",orderMeta:meta};const next=[row,...rows()];modal.querySelectorAll("[data-nm-save]").forEach(b=>{b.disabled=true;b.textContent="등록 중..."});
    try{localStorage.setItem(SALES,JSON.stringify(next));const mm=map();mm[id]=meta;localStorage.setItem(META,JSON.stringify(mm));if(d.remarks){const rm=read(REMARK,{});rm[id]=d.remarks;localStorage.setItem(REMARK,JSON.stringify(rm))}if(typeof window.qmesSyncUpsert==="function")await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:now,savedBy:user(),source:"NAMO_NEW_ORDER_MODAL_V5"});localStorage.removeItem(DRAFT);window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"new-order",id}}));window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales",id}}));close()}catch(err){console.error("[NAMO New Order Modal V5]",err);fail(modal,"수주 저장 중 오류가 발생했습니다. "+clean(err?.message));modal.querySelectorAll("[data-nm-save]").forEach(b=>{b.disabled=false;b.textContent="수주 등록"})}
  }

  document.addEventListener("click",e=>{const t=e.target;if(!(t instanceof Element))return;if(t.closest(`#${ID} [data-nm-close]`)){e.preventDefault();close();return}const root=t.closest(".qmes-sales-stable");if(!root)return;const b=t.closest("button");if(!b)return;const text=clean(b.textContent).replace(/^\+\s*/,"");if(text!=="신규 수주")return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()},true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById(ID))close()},true);
  window.qmesSalesNewOrderNamoV5={open,close};
})();
