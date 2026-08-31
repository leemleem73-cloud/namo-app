/* NAMO QMES - New Sales Order operational owner V9 - 2026-08-31
 * Force-owned production modal. Direct layout owner.
 * Desktop layout is fixed to the approved NAMO arrangement.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_NEW_ORDER_OPERATIONAL_OWNER_V9__) return;
  window.__QMES_SALES_NEW_ORDER_OPERATIONAL_OWNER_V9__=true;

  const SALES='qmes-erp-sales-v1';
  const META='qmes-sales-order-meta-v1';
  const REMARK='qmes-sales-remarks-v1';
  const DRAFT='qmes-sales-new-order-modal-draft-v9';
  const ID='qmes-sales-new-order-modal-v9';
  const STYLE='qmes-sales-new-order-modal-v9-style-layout2';
  const CATEGORY='절연 슬러리';
  let replacingDemo=false;

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:0};
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const readMap=k=>{const v=read(k,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};
  const rows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const user=()=>clean(window.__QMES_USER__?.name||window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__||window.__QMES_CURRENT_USER__)||'로그인 사용자';

  function usedIds(){
    const mm=readMap(META),set=new Set();
    rows().forEach(r=>{const id=clean(r?.id),key=clean(r?.workOrder)||id,m=mm[key]||mm[id]||r?.orderMeta||{};set.add(clean(m.salesOrderIdOverride)||id)});
    return set;
  }
  function dateMinusOne(v){
    const s=clean(v);if(!/^20\d{2}-\d{2}-\d{2}$/.test(s))return today();
    const d=new Date(s+'T12:00:00');if(Number.isNaN(d.getTime()))return today();
    d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function nextId(due){
    const stamp=dateMinusOne(due).replace(/-/g,''),used=usedIds();let seq=1,id='';
    do{id=`SO-${stamp}-${String(seq++).padStart(3,'0')}`}while(used.has(id));
    return id;
  }
  function distinct(field){return [...new Set(rows().map(r=>clean(r?.[field])).filter(Boolean))].slice(0,50)}

  function stock(product){
    const p=clean(product).toLowerCase();if(!p)return 0;
    let current=0,reserved=0,available=0,hasAvailable=false;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||'';
      if(!/(finished|fg|product.*stock|stock.*product|완제품)/i.test(key))continue;
      let data;try{data=JSON.parse(localStorage.getItem(key)||'null')}catch(_){continue}
      const list=Array.isArray(data)?data:Array.isArray(data?.rows)?data.rows:[];
      list.forEach(x=>{
        const name=clean(x?.product||x?.productName||x?.item||x?.itemName||x?.name).toLowerCase();
        if(name!==p)return;
        const av=x?.availableQty??x?.available;
        if(av!==undefined&&av!==null&&av!==''){hasAvailable=true;available+=Math.max(0,num(av))}
        current+=Math.max(0,num(x?.stockQty??x?.currentQty??x?.qty??x?.quantity??x?.onHandQty));
        reserved+=Math.max(0,num(x?.reservedQty??x?.allocatedQty??x?.reservationQty));
      });
    }
    return hasAvailable?Math.max(0,available):Math.max(0,current-reserved);
  }

  function ensureStyle(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      #${ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(15,23,42,.36)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;color:#172033!important}
      #${ID} *{box-sizing:border-box!important}
      #${ID} .n9-card{width:min(1050px,97vw)!important;max-height:92vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #e1e7ef!important;border-radius:18px!important;box-shadow:0 28px 80px rgba(15,23,42,.25)!important;overflow:hidden!important}
      #${ID} .n9-head{min-height:70px!important;padding:0 20px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-bottom:1px solid #e8edf3!important}
      #${ID} .n9-head h2{margin:0!important;font-size:20px!important;font-weight:950!important;color:#172033!important}
      #${ID} .n9-head p{margin:4px 0 0!important;font-size:10.5px!important;color:#8190a4!important}
      #${ID} .n9-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f3f6f9!important;color:#334155!important;font-size:20px!important;cursor:pointer!important}
      #${ID} .n9-body{padding:16px 20px 20px!important;overflow:auto!important}
      #${ID} .n9-note{margin-bottom:12px!important;padding:9px 10px!important;border:1px dashed #d8e2ef!important;border-radius:9px!important;background:#f8fbff!important;color:#68778b!important;font-size:10px!important}
      #${ID} .n9-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px 12px!important;grid-auto-flow:row!important}
      #${ID} .n9-field{min-width:0!important}
      #${ID} .n9-internal{display:none!important}
      #${ID} .n9-id{grid-column:1!important;grid-row:1!important}
      #${ID} .n9-date{grid-column:2!important;grid-row:1!important}
      #${ID} .n9-customer{grid-column:3!important;grid-row:1!important}
      #${ID} .n9-due{grid-column:4!important;grid-row:1!important}
      #${ID} .n9-product{grid-column:1 / span 2!important;grid-row:2!important}
      #${ID} .n9-qty{grid-column:3!important;grid-row:2!important}
      #${ID} .n9-price{grid-column:4!important;grid-row:2!important}
      #${ID} .n9-po{grid-column:1 / span 2!important;grid-row:3!important}
      #${ID} .n9-delivery{grid-column:3 / span 2!important;grid-row:3!important}
      #${ID} .n9-remarks{grid-column:1 / -1!important;grid-row:4!important}
      #${ID} .n9-field label{display:block!important;margin:0 0 5px!important;font-size:10px!important;font-weight:850!important;color:#657084!important}
      #${ID} input,#${ID} select,#${ID} textarea{width:100%!important;border:1px solid #d6deea!important;border-radius:9px!important;background:#fff!important;color:#263246!important;-webkit-text-fill-color:#263246!important;font:inherit!important;font-size:11px!important;outline:none!important}
      #${ID} input,#${ID} select{height:38px!important;padding:0 10px!important}
      #${ID} textarea{min-height:76px!important;padding:9px 10px!important;resize:vertical!important}
      #${ID} input[readonly]{background:#f7f9fc!important;color:#657084!important;-webkit-text-fill-color:#657084!important}
      #${ID} input:focus,#${ID} select:focus,#${ID} textarea:focus{border-color:#8baaf4!important;box-shadow:0 0 0 3px rgba(36,87,214,.08)!important}
      #${ID} .n9-section{margin-top:14px!important;border:1px solid #e3e8ef!important;border-radius:12px!important;overflow:hidden!important}
      #${ID} .n9-section-title{padding:10px 12px!important;background:#fafbfd!important;border-bottom:1px solid #e9edf2!important;font-size:11px!important;font-weight:900!important}
      #${ID} .n9-table{overflow:auto!important;padding:0 12px 5px!important}
      #${ID} table{width:100%!important;border-collapse:collapse!important;font-size:10.5px!important}
      #${ID} th,#${ID} td{padding:10px 8px!important;border-bottom:1px solid #edf1f5!important;text-align:left!important;white-space:nowrap!important}
      #${ID} th{background:#fafbfd!important;color:#6e788b!important;font-size:9.5px!important;font-weight:850!important}
      #${ID} .n9-badge{display:inline-block!important;padding:4px 7px!important;border-radius:999px!important;background:#edf3ff!important;color:#2457d6!important;font-size:9px!important;font-weight:900!important}
      #${ID} .n9-error{display:none!important;margin-top:12px!important;padding:9px 10px!important;border-radius:9px!important;background:#fff0ee!important;color:#b83930!important;font-size:10px!important;font-weight:850!important}
      #${ID} .n9-error.show{display:block!important}
      #${ID} .n9-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:16px!important}
      #${ID} .n9-btn{height:39px!important;padding:0 14px!important;border:1px solid #d7dee8!important;border-radius:9px!important;background:#fff!important;color:#334155!important;font:inherit!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important}
      #${ID} .n9-btn.soft{background:#edf3ff!important;border-color:#dce8ff!important;color:#2457d6!important}
      #${ID} .n9-btn.primary{background:#2457d6!important;border-color:#2457d6!important;color:#fff!important}
      @media(max-width:900px){
        #${ID} .n9-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #${ID} .n9-id,#${ID} .n9-date,#${ID} .n9-customer,#${ID} .n9-due,#${ID} .n9-product,#${ID} .n9-qty,#${ID} .n9-price,#${ID} .n9-po,#${ID} .n9-delivery,#${ID} .n9-remarks{grid-row:auto!important;grid-column:auto!important}
        #${ID} .n9-product,#${ID} .n9-po,#${ID} .n9-delivery,#${ID} .n9-remarks{grid-column:1/-1!important}
      }
      @media(max-width:560px){
        #${ID}{padding:8px!important;align-items:flex-start!important}
        #${ID} .n9-grid{grid-template-columns:1fr!important}
        #${ID} .n9-product,#${ID} .n9-po,#${ID} .n9-delivery,#${ID} .n9-remarks{grid-column:1!important}
      }
    `;document.head.appendChild(s);
  }

  function close(){document.getElementById(ID)?.remove();document.documentElement.style.overflow='';}

  function removeOldSalesDialogs(){
    ['qmes-sales-new-order-modal-v8','qmes-sales-new-order-modal-v7','qmes-sales-new-order-modal-v6','qmes-sales-new-order-modal-v5','qmes-sales-new-order-namo-20260828-v4','qmes-sales-new-order-namo-20260828-v3','qmes-sales-new-order-namo-20260828-v2','qmes-sales-new-order-enterprise-20260828-v1'].forEach(id=>document.getElementById(id)?.remove());
    document.querySelectorAll('[role="dialog"][aria-label="신규 수주 등록"]').forEach(el=>{if(!el.closest('#'+ID))el.remove()});
  }

  function findDemo(){
    const nodes=document.querySelectorAll('[role="dialog"],.action-modal,[class*="modal"]');
    return [...nodes].find(el=>{if(el.closest('#'+ID))return false;const t=clean(el.textContent);return t.includes('신규 수주 등록')&&t.includes('데모 화면입니다')});
  }
  function removeDemoHost(el){
    if(!el)return;
    let host=el,p=el.parentElement;
    while(p&&p!==document.body){
      const cls=String(p.className||'');
      const st=getComputedStyle(p);
      if(/overlay|backdrop/i.test(cls)||st.position==='fixed'){host=p;break}
      p=p.parentElement;
    }
    host.remove();
  }
  function takeoverDemo(){
    if(replacingDemo||document.getElementById(ID))return;
    const demo=findDemo();if(!demo)return;
    replacingDemo=true;removeDemoHost(demo);setTimeout(()=>{replacingDemo=false;open()},0);
  }

  function data(form){
    const fd=new FormData(form),g=n=>clean(fd.get(n));
    return {orderDate:g('orderDate'),orderType:g('orderType')||'양산',priority:g('priority')||'일반',customer:g('customer'),due:g('due'),product:g('product'),qty:g('qty'),unitPrice:g('unitPrice'),po:g('po'),deliveryPlace:g('deliveryPlace'),remarks:g('remarks')};
  }
  function restore(form,d){if(!d||typeof d!=='object')return;Object.entries(d).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??''})}

  function refresh(modal){
    const f=modal.querySelector('form'),g=n=>clean(f.elements[n]?.value),qty=num(g('qty')),av=stock(g('product')),need=Math.max(0,qty-av);
    f.elements.salesOrderId.value=g('due')?nextId(g('due')):'';
    const set=(k,v)=>modal.querySelectorAll(`[data-n9="${k}"]`).forEach(el=>el.textContent=v);
    set('product',g('product')||'-');
    set('qty',qty?qty.toLocaleString('ko-KR')+' kg':'-');
    set('stock',av.toLocaleString('ko-KR')+' kg');
    set('need',qty?need.toLocaleString('ko-KR')+' kg':'-');
    set('equipment','생산계획에서 지정');
    set('status',qty?(need>0?'계획 생성':'재고 출하 검토'):'계획 검토');
  }

  function open(){
    ensureStyle();removeOldSalesDialogs();close();
    const d=read(DRAFT,{}),customers=distinct('customer'),products=distinct('product'),modal=document.createElement('div');
    modal.id=ID;
    modal.innerHTML=`<div class="n9-card" role="dialog" aria-modal="true" aria-label="신규 수주 등록"><div class="n9-head"><div><h2>신규 수주 등록</h2><p>수주 → 생산계획 → 작업지시까지 동일 수주번호로 연결</p></div><button type="button" class="n9-close" data-n9-close>×</button></div><form><div class="n9-body"><datalist id="n9-customers">${customers.map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist><datalist id="n9-products">${products.map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist><div class="n9-note">나모케미칼 수주 Master 입력화면입니다. 생산·품질·출하 실적은 수주 확정 후 연결됩니다.</div><div class="n9-grid">
      <div class="n9-field n9-id"><label>수주번호</label><input name="salesOrderId" readonly placeholder="납기 입력 시 자동생성"></div>
      <div class="n9-field n9-date"><label>수주일자</label><input type="date" name="orderDate" value="${today()}"></div>
      <div class="n9-field n9-internal"><label>수주구분</label><select name="orderType"><option value="양산">양산</option><option value="샘플">샘플</option><option value="개발·평가">개발·평가</option></select></div>
      <div class="n9-field n9-internal"><label>우선순위</label><select name="priority"><option value="일반">일반</option><option value="긴급">긴급</option></select></div>
      <div class="n9-field n9-customer"><label>고객사 *</label><input name="customer" list="n9-customers" placeholder="고객사 입력"></div>
      <div class="n9-field n9-due"><label>요청 납기일 *</label><input type="date" name="due"></div>
      <div class="n9-field n9-product"><label>제품 *</label><input name="product" list="n9-products" placeholder="절연 슬러리 제품명 / 품목코드"></div>
      <div class="n9-field n9-qty"><label>수주수량 (kg) *</label><input type="number" min="0" step="0.001" name="qty" placeholder="0"></div>
      <div class="n9-field n9-price"><label>단가 (원/kg)</label><input type="number" min="0" step="1" name="unitPrice" placeholder="선택 입력"></div>
      <div class="n9-field n9-po"><label>고객 PO</label><input name="po" placeholder="고객 발주번호"></div>
      <div class="n9-field n9-delivery"><label>납품처</label><input name="deliveryPlace" placeholder="고객 지정 납품처"></div>
      <div class="n9-field n9-remarks"><label>비고 / 고객 요구사항</label><textarea name="remarks" placeholder="포장, 라벨, CoA, 납기, 운송 등 고객 요구사항"></textarea></div>
      </div><div class="n9-section"><div class="n9-section-title">생산 연계 예상</div><div class="n9-table"><table><thead><tr><th>제품</th><th>수주량</th><th>가용 완제품재고</th><th>생산 필요량</th><th>예정 설비</th><th>상태</th></tr></thead><tbody><tr><td data-n9="product">-</td><td data-n9="qty">-</td><td data-n9="stock">0 kg</td><td data-n9="need">-</td><td data-n9="equipment">생산계획에서 지정</td><td><span class="n9-badge" data-n9="status">계획 검토</span></td></tr></tbody></table></div></div><div class="n9-error" data-n9-error></div><div class="n9-actions"><button type="button" class="n9-btn" data-n9-close>취소</button><button type="button" class="n9-btn soft" data-n9-draft>임시저장</button><button type="button" class="n9-btn primary" data-n9-save>수주 등록</button></div></div></form></div>`;

    document.body.appendChild(modal);document.documentElement.style.overflow='hidden';
    const form=modal.querySelector('form');restore(form,d);
    if(!clean(form.elements.orderType?.value))form.elements.orderType.value='양산';
    if(!clean(form.elements.priority?.value))form.elements.priority.value='일반';
    refresh(modal);
    form.addEventListener('input',()=>refresh(modal));
    form.addEventListener('change',()=>refresh(modal));
    modal.querySelectorAll('[data-n9-close]').forEach(b=>b.addEventListener('click',close));
    modal.querySelector('[data-n9-draft]')?.addEventListener('click',()=>{localStorage.setItem(DRAFT,JSON.stringify(data(form)));alert('임시저장했습니다.')});
    modal.querySelector('[data-n9-save]')?.addEventListener('click',()=>save(form,modal));
    form.elements.customer?.focus();
  }

  function fail(modal,msg){const e=modal.querySelector('[data-n9-error]');if(e){e.textContent=msg;e.classList.add('show')}return false}
  async function save(form,modal){
    const d=data(form),qty=num(d.qty),price=num(d.unitPrice),id=clean(form.elements.salesOrderId.value)||nextId(d.due),now=new Date().toISOString();
    modal.querySelector('[data-n9-error]')?.classList.remove('show');
    if(!d.customer||!d.product||qty<=0||!d.due)return fail(modal,'고객사·제품·수주수량·요청 납기일을 확인하세요.');
    if(usedIds().has(id))return fail(modal,'이미 사용 중인 수주번호입니다.');
    const meta={salesOrderIdOverride:id,salesOrderIdAutoRule:'DUE_MINUS_1',orderDate:d.orderDate||today(),orderType:d.orderType,priority:d.priority,customerOverride:d.customer,customerPO:d.po,requestedDue:d.due,deliveryPlace:d.deliveryPlace,productCategory:CATEGORY,productOverride:d.product,itemCode:d.product,qtyOverride:qty,unitPrice:price||0,productionPlanStatus:'계획대기',salesStatus:'확정',salesManager:user(),masterDataOwner:'SALES',source:'NAMO_NEW_ORDER_MODAL_V9_LAYOUT2',savedAt:now,savedBy:user()};
    const row={id,customer:d.customer,po:d.po||'-',product:d.product,itemCode:d.product,productCategory:CATEGORY,orderType:d.orderType,priority:d.priority,qty,due:d.due,plan:'계획대기',shipping:'-',deliveryPlace:d.deliveryPlace,unitPrice:price||0,remarks:d.remarks,orderDate:meta.orderDate,salesStatus:'확정',source:'MANUAL',orderMeta:meta};
    const next=[row,...rows()],btn=modal.querySelector('[data-n9-save]');if(btn){btn.disabled=true;btn.textContent='등록 중...'}
    try{
      localStorage.setItem(SALES,JSON.stringify(next));
      const mm=readMap(META);mm[id]=meta;localStorage.setItem(META,JSON.stringify(mm));
      if(d.remarks){const rm=readMap(REMARK);rm[id]=d.remarks;localStorage.setItem(REMARK,JSON.stringify(rm))}
      if(typeof window.qmesSyncUpsert==='function')await window.qmesSyncUpsert('inventory','erp:sales',{module:'sales',rows:next,savedAt:now,savedBy:user(),source:'NAMO_NEW_ORDER_MODAL_V9_LAYOUT2'});
      localStorage.removeItem(DRAFT);
      window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{module:'sales',reason:'new-order',id,orderType:d.orderType}}));
      window.dispatchEvent(new CustomEvent('qmes:data-updated',{detail:{module:'sales',id,orderType:d.orderType}}));
      close();
    }catch(err){
      console.error('[NAMO New Order V9]',err);
      fail(modal,'수주 저장 중 오류가 발생했습니다. '+clean(err?.message));
      if(btn){btn.disabled=false;btn.textContent='수주 등록'}
    }
  }

  function clickOwner(e){
    const t=e.target;if(!(t instanceof Element))return;
    if(t.closest(`#${ID} [data-n9-close]`)){e.preventDefault();e.stopPropagation();close();return}
    const b=t.closest('button');if(!b)return;
    if(clean(b.textContent).replace(/^\+\s*/,'')!=='신규 수주')return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();
  }
  window.addEventListener('click',clickOwner,true);
  document.addEventListener('click',clickOwner,true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById(ID))close()},true);

  const observer=new MutationObserver(()=>takeoverDemo());
  const startObserver=()=>{if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});takeoverDemo()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
  [100,400,1000,2500].forEach(ms=>setTimeout(takeoverDemo,ms));

  const api={open,close};
  window.qmesSalesNewOrderNamoV9=api;
  window.qmesSalesNewOrderNamoV8=api;
  window.qmesSalesNewOrderNamoV7=api;
  window.qmesSalesNewOrderNamoV6=api;
  window.qmesSalesNewOrderNamoV5=api;
  window.qmesSalesNewOrderNamo=api;
  window.qmesSalesNewOrderEnterprise=api;
})();
