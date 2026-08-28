/* NAMO QMES - New Sales Order NAMO V2 - 2026-08-28
 * ADD-ONLY PATCH. Loaded before V1 and owns '+ 신규 수주'.
 * Requested layout: remove former #03 ERP->MES section; tailor remaining sections to NAMO Chemical.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V2__)return;
  window.__QMES_SALES_NEW_ORDER_NAMO_20260828_V2__=true;
  /* Prevent previous new-order owner from installing after this module. */
  window.__QMES_SALES_NEW_ORDER_ENTERPRISE_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const DRAFT_KEY="qmes-sales-new-order-draft-v2";
  const MODAL_ID="qmes-sales-new-order-namo-20260828-v2";
  const STYLE_ID="qmes-sales-new-order-namo-style-20260828-v2";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const currentUser=()=>clean(window.__QMES_USER__?.name||window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__||window.__QMES_CURRENT_USER__)||"관리자";
  const todayIso=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;
    s.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483000!important;background:#f3f6fb!important;overflow:auto!important;font-family:inherit!important;color:#162033!important}
      #${MODAL_ID} *{box-sizing:border-box!important}
      #${MODAL_ID} .qno-shell{width:min(1440px,100%)!important;margin:0 auto!important;padding:18px 24px 34px!important}
      #${MODAL_ID} .qno-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;margin-bottom:14px!important}
      #${MODAL_ID} .qno-breadcrumb{font-size:9px!important;color:#8591a4!important;font-weight:750!important;margin-bottom:5px!important}
      #${MODAL_ID} .qno-title{margin:0!important;font-size:22px!important;font-weight:950!important;letter-spacing:-.03em!important;color:#10203b!important}
      #${MODAL_ID} .qno-top-actions{display:flex!important;gap:8px!important;align-items:center!important}
      #${MODAL_ID} button{font-family:inherit!important;cursor:pointer!important}
      #${MODAL_ID} .qno-btn{height:36px!important;padding:0 13px!important;border-radius:8px!important;border:1px solid #d6deea!important;background:#fff!important;color:#334155!important;font-size:10.5px!important;font-weight:900!important}
      #${MODAL_ID} .qno-btn.soft{background:#eef4ff!important;border-color:#d5e4ff!important;color:#215fcf!important}.qno-btn.primary{background:#1859d1!important;border-color:#1859d1!important;color:#fff!important}
      #${MODAL_ID} .qno-layout{display:grid!important;grid-template-columns:minmax(0,1fr) 310px!important;gap:14px!important;align-items:start!important}
      #${MODAL_ID} .qno-main{display:grid!important;gap:12px!important}
      #${MODAL_ID} .qno-card{background:#fff!important;border:1px solid #dfe6ef!important;border-radius:13px!important;box-shadow:0 4px 14px rgba(20,32,55,.03)!important;overflow:hidden!important}
      #${MODAL_ID} .qno-card-head{height:47px!important;padding:0 15px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-bottom:1px solid #edf0f4!important}
      #${MODAL_ID} .qno-card-head b{font-size:11.5px!important;font-weight:950!important;color:#1f2d44!important}.qno-card-head span{font-size:8.5px!important;color:#9aa5b5!important;font-weight:750!important}
      #${MODAL_ID} .qno-card-body{padding:14px 15px 15px!important}
      #${MODAL_ID} .qno-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:11px 12px!important}
      #${MODAL_ID} .qno-field{min-width:0!important}.qno-field.w2{grid-column:span 2!important}.qno-field.full{grid-column:1/-1!important}
      #${MODAL_ID} label{display:block!important;margin:0 0 5px!important;color:#59667b!important;font-size:8.8px!important;font-weight:900!important}.qno-required{color:#e11d48!important;margin-left:2px!important}
      #${MODAL_ID} input,#${MODAL_ID} select,#${MODAL_ID} textarea{width:100%!important;border:1px solid #d3dce8!important;border-radius:7px!important;background:#fff!important;color:#172033!important;font-family:inherit!important;font-size:10.5px!important;font-weight:700!important;outline:none!important}
      #${MODAL_ID} input,#${MODAL_ID} select{height:36px!important;padding:0 9px!important}#${MODAL_ID} textarea{min-height:72px!important;padding:9px!important;resize:vertical!important}
      #${MODAL_ID} input:focus,#${MODAL_ID} select:focus,#${MODAL_ID} textarea:focus{border-color:#78a6f3!important;box-shadow:0 0 0 3px rgba(37,99,235,.07)!important}
      #${MODAL_ID} input[readonly]{background:#f8fafc!important;color:#64748b!important}
      #${MODAL_ID} .qno-idbox{display:grid!important;grid-template-columns:1fr auto!important;gap:6px!important}.qno-auto{height:36px!important;padding:0 9px!important;border:1px solid #d5deea!important;border-radius:7px!important;background:#f8fafc!important;color:#445166!important;font-size:9.5px!important;font-weight:900!important}
      #${MODAL_ID} .qno-line{display:grid!important;grid-template-columns:1.2fr 1.15fr .75fr .5fr .9fr .9fr .8fr!important;gap:8px!important;align-items:end!important}
      #${MODAL_ID} .qno-line-head{display:grid!important;grid-template-columns:1.2fr 1.15fr .75fr .5fr .9fr .9fr .8fr!important;gap:8px!important;padding:0 1px 6px!important;color:#8a96a8!important;font-size:8px!important;font-weight:900!important}.qno-line-head span{text-align:left!important}
      #${MODAL_ID} .qno-unit{height:36px!important;display:flex!important;align-items:center!important;justify-content:center!important;border:1px solid #d9e1eb!important;border-radius:7px!important;background:#f8fafc!important;color:#637086!important;font-size:10px!important;font-weight:900!important}
      #${MODAL_ID} .qno-metrics{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:8px!important;margin-top:12px!important}.qno-metric{padding:10px 11px!important;border:1px solid #e1e7ef!important;border-radius:9px!important;background:#fbfcfe!important}.qno-metric small{display:block!important;color:#8b97a9!important;font-size:8px!important;font-weight:800!important;margin-bottom:4px!important}.qno-metric b{display:block!important;color:#24324a!important;font-size:13px!important;font-weight:950!important}
      #${MODAL_ID} .qno-checks{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:8px!important;margin-bottom:12px!important}.qno-check{height:38px!important;display:flex!important;align-items:center!important;gap:7px!important;padding:0 10px!important;border:1px solid #dce4ed!important;border-radius:8px!important;background:#fbfcfe!important;color:#445166!important;font-size:9px!important;font-weight:850!important}.qno-check input{width:14px!important;height:14px!important;margin:0!important;padding:0!important}
      #${MODAL_ID} .qno-drop{min-height:86px!important;border:1.5px dashed #b9c8dc!important;border-radius:10px!important;background:#fbfdff!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:13px!important}.qno-drop input{display:none!important}.qno-drop b{display:block!important;font-size:10px!important;color:#475569!important}.qno-drop span{display:block!important;margin-top:5px!important;font-size:8.5px!important;color:#94a3b8!important}.qno-file-btn{display:inline-flex!important;align-items:center!important;height:30px!important;padding:0 10px!important;margin-left:6px!important;border:1px solid #d8e4f6!important;border-radius:7px!important;background:#eef4ff!important;color:#2563eb!important;font-size:9px!important;font-weight:900!important;cursor:pointer!important}.qno-files{margin-top:8px!important;font-size:8.5px!important;color:#64748b!important}
      #${MODAL_ID} .qno-side{position:sticky!important;top:14px!important;display:grid!important;gap:12px!important}.qno-side-card{background:#fff!important;border:1px solid #dfe6ef!important;border-radius:13px!important;overflow:hidden!important;box-shadow:0 4px 14px rgba(20,32,55,.03)!important}.qno-side-head{height:45px!important;padding:0 13px!important;display:flex!important;align-items:center!important;border-bottom:1px solid #edf0f4!important;font-size:10.5px!important;font-weight:950!important}.qno-side-body{padding:12px 13px!important}.qno-summary-row{display:flex!important;justify-content:space-between!important;gap:10px!important;padding:6px 0!important;border-bottom:1px solid #f0f3f7!important;font-size:8.8px!important}.qno-summary-row:last-child{border-bottom:0!important}.qno-summary-row span{color:#8390a2!important}.qno-summary-row b{color:#1f2c41!important;text-align:right!important;max-width:60%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #${MODAL_ID} .qno-check-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:7px 0!important;border-bottom:1px solid #f0f3f7!important;font-size:8.7px!important}.qno-check-row:last-child{border-bottom:0!important}.qno-ok{display:inline-flex!important;align-items:center!important;padding:3px 6px!important;border-radius:99px!important;background:#eaf7f0!important;color:#157a47!important;font-size:7.8px!important;font-weight:950!important}.qno-wait{background:#fff4e7!important;color:#b86400!important}
      #${MODAL_ID} .qno-flow{position:relative!important;padding-left:15px!important}.qno-flow:before{content:"";position:absolute;left:4px!important;top:7px!important;bottom:7px!important;width:2px!important;background:#e2e8f0!important}.qno-flow-item{position:relative!important;padding:0 0 13px 5px!important}.qno-flow-item:last-child{padding-bottom:0!important}.qno-flow-item:before{content:"";position:absolute;left:-15px!important;top:3px!important;width:8px!important;height:8px!important;border-radius:50%!important;background:#3b82f6!important;border:2px solid #fff!important;box-shadow:0 0 0 1px #9fc0fb!important}.qno-flow-item b{display:block!important;font-size:8.8px!important;color:#334155!important}.qno-flow-item span{display:block!important;margin-top:3px!important;font-size:7.8px!important;color:#98a3b3!important}
      #${MODAL_ID} .qno-note{margin-top:10px!important;padding:9px!important;border-left:3px solid #e7a53d!important;border-radius:0 7px 7px 0!important;background:#fff8ec!important;color:#7a5a27!important;font-size:8.3px!important;line-height:1.45!important}
      #${MODAL_ID} .qno-error{display:none!important;margin-top:10px!important;padding:9px 10px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:9.5px!important;font-weight:850!important}.qno-error.show{display:block!important}
      .qmes-sales-stable .qerp-sales-compact-form{display:none!important}
      @media(max-width:1050px){#${MODAL_ID} .qno-layout{grid-template-columns:1fr!important}#${MODAL_ID} .qno-side{position:static!important;grid-template-columns:repeat(2,1fr)!important}#${MODAL_ID} .qno-line,#${MODAL_ID} .qno-line-head{grid-template-columns:repeat(4,1fr)!important}}
      @media(max-width:720px){#${MODAL_ID} .qno-shell{padding:12px!important}#${MODAL_ID} .qno-grid,#${MODAL_ID} .qno-checks,#${MODAL_ID} .qno-metrics,#${MODAL_ID} .qno-side{grid-template-columns:1fr 1fr!important}#${MODAL_ID} .qno-field.w2{grid-column:span 1!important}#${MODAL_ID} .qno-line,#${MODAL_ID} .qno-line-head{grid-template-columns:1fr 1fr!important}}
    `;document.head.appendChild(s);
  }

  function dateMinusOne(value){
    const text=clean(value);if(!/^20\d{2}-\d{2}-\d{2}$/.test(text))return "";
    const d=new Date(text+"T00:00:00");if(Number.isNaN(d.getTime()))return "";d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function usedIds(){const map=readMap(META_KEY),set=new Set();rows().forEach(row=>{const id=clean(row?.id),key=clean(row?.workOrder)||id,meta=map[key]||map[id]||row?.orderMeta||{};set.add(clean(meta.salesOrderIdOverride)||id);});return set;}
  function nextId(due){const orderDate=dateMinusOne(due)||todayIso(),stamp=orderDate.replace(/-/g,""),used=usedIds();let n=1,id="";do{id=`SO-${stamp}-${String(n++).padStart(3,"0")}`;}while(used.has(id));return id;}
  function close(){document.getElementById(MODAL_ID)?.remove();document.documentElement.style.overflow="";}

  function draftFromForm(form){
    const fd=new FormData(form),get=n=>clean(fd.get(n));
    return {salesOrderId:get("salesOrderId"),orderDate:get("orderDate"),customer:get("customer"),salesManager:get("salesManager"),po:get("po"),deliveryPlace:get("deliveryPlace"),orderType:get("orderType"),salesStatus:get("salesStatus"),product:get("product"),customerItemCode:get("customerItemCode"),qty:get("qty"),due:get("due"),confirmedDue:get("confirmedDue"),packagingType:get("packagingType"),unitWeight:get("unitWeight"),packageQty:get("packageQty"),customerSpecRevision:get("customerSpecRevision"),shippingType:get("shippingType"),lotFormat:get("lotFormat"),customerRequirement:get("customerRequirement"),coaRequired:!!form.elements.coaRequired?.checked,inspectionReportRequired:!!form.elements.inspectionReportRequired?.checked,customerLabelRequired:!!form.elements.customerLabelRequired?.checked,specialPackagingRequired:!!form.elements.specialPackagingRequired?.checked};
  }

  function restoreDraft(form,draft){
    if(!draft||typeof draft!=="object")return;
    Object.entries(draft).forEach(([k,v])=>{const el=form.elements[k];if(!el)return;if(el.type==="checkbox")el.checked=!!v;else el.value=v??"";});
  }

  function riskText(due){
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(clean(due)))return "미확정";
    const today=new Date(todayIso()+"T00:00:00"),target=new Date(due+"T00:00:00"),days=Math.round((target-today)/86400000);
    if(days<0)return `지연 ${Math.abs(days)}일`;if(days===0)return "금일";if(days<=7)return `임박 D-${days}`;return "정상";
  }

  function refresh(modal){
    const f=modal?.querySelector("form");if(!f)return;const v=n=>clean(f.elements[n]?.value),qty=num(v("qty")),unit=num(v("unitWeight")),count=num(v("packageQty")),packTotal=unit*count;
    const set=(key,value)=>{modal.querySelectorAll(`[data-qno="${key}"]`).forEach(el=>el.textContent=value||"-");};
    set("id",v("salesOrderId"));set("customer",v("customer"));set("product",v("product"));set("qty",qty?qty.toLocaleString("ko-KR")+" kg":"-");set("due",v("due"));set("pack",packTotal?Number(packTotal.toFixed(3)).toLocaleString("ko-KR")+" kg":"-");set("risk",riskText(v("due")));
    const packTotalInput=f.elements.packTotal;if(packTotalInput)packTotalInput.value=packTotal?Number(packTotal.toFixed(3)).toLocaleString("ko-KR")+" kg":"";
    const checks={customer:!!v("customer"),product:!!v("product"),qty:qty>0,due:!!v("due"),pack:!v("packagingType")||(unit>0&&count>0)};
    Object.entries(checks).forEach(([key,ok])=>{const el=modal.querySelector(`[data-qno-check="${key}"]`);if(el){el.textContent=ok?"정상":"확인";el.className=`${ok?"qno-ok":"qno-ok qno-wait"}`;}});
  }

  function open(){
    ensureStyle();close();
    const draft=read(DRAFT_KEY,{}),today=todayIso(),modal=document.createElement("div");modal.id=MODAL_ID;
    modal.innerHTML=`<div class="qno-shell"><div class="qno-top"><div><div class="qno-breadcrumb">영업 / 수주 · 납기관리 / 신규 수주</div><h2 class="qno-title">신규 수주 등록</h2></div><div class="qno-top-actions"><button type="button" class="qno-btn" data-qno-close>취소</button><button type="button" class="qno-btn soft" data-qno-draft>임시저장</button><button type="button" class="qno-btn primary" data-qno-submit>수주 확정</button></div></div><form class="qno-layout" data-qno-form><main class="qno-main">
      <section class="qno-card"><div class="qno-card-head"><b>01. 수주 기본정보</b><span>Sales Order Master</span></div><div class="qno-card-body"><div class="qno-grid">
        <div class="qno-field"><label>수주번호<span class="qno-required">*</span></label><div class="qno-idbox"><input name="salesOrderId" placeholder="납기 입력 시 자동생성"><button type="button" class="qno-auto" data-qno-auto>자동</button></div></div>
        <div class="qno-field"><label>수주일자<span class="qno-required">*</span></label><input type="date" name="orderDate" value="${today}"></div>
        <div class="qno-field"><label>고객사<span class="qno-required">*</span></label><input name="customer" value="현대자동차" autocomplete="off"></div>
        <div class="qno-field"><label>영업 담당자</label><input name="salesManager" value="${esc(currentUser())}" readonly></div>
        <div class="qno-field"><label>고객 PO 번호</label><input name="po" autocomplete="off"></div>
        <div class="qno-field"><label>납품처</label><input name="deliveryPlace" value="현대자동차" autocomplete="off"></div>
        <div class="qno-field"><label>수주구분</label><select name="orderType"><option>양산</option><option>샘플</option><option>개발</option><option>긴급</option></select></div>
        <div class="qno-field"><label>수주상태</label><select name="salesStatus"><option>작성중</option><option>확정</option></select></div>
      </div></div></section>
      <section class="qno-card"><div class="qno-card-head"><b>02. 수주 품목 / 납기</b><span>NAMO Chemical · 1 수주 = 1 제품 기준</span></div><div class="qno-card-body"><div class="qno-line-head"><span>제품</span><span>고객 품목코드</span><span>수주수량</span><span>단위</span><span>요청 납기</span><span>확정 납기</span><span>포장형태</span></div><div class="qno-line">
        <div><input name="product" placeholder="제품명 / 품목코드"></div><div><input name="customerItemCode" placeholder="고객 품목코드"></div><div><input type="number" step="0.001" min="0" name="qty"></div><div class="qno-unit">kg</div><div><input type="date" name="due"></div><div><input type="date" name="confirmedDue"></div><div><select name="packagingType"><option value="">선택</option><option>CAN</option><option>DRUM</option><option>IBC</option><option>기타</option></select></div>
      </div><div class="qno-grid" style="margin-top:11px"><div class="qno-field"><label>단위 포장량 (kg)</label><input type="number" step="0.001" min="0" name="unitWeight"></div><div class="qno-field"><label>포장수량 (EA)</label><input type="number" step="1" min="0" name="packageQty"></div><div class="qno-field"><label>포장 총량</label><input name="packTotal" readonly></div></div><div class="qno-metrics"><div class="qno-metric"><small>수주수량</small><b data-qno="qty">-</b></div><div class="qno-metric"><small>포장 총량</small><b data-qno="pack">-</b></div><div class="qno-metric"><small>수주 제품</small><b data-qno="product">-</b></div><div class="qno-metric"><small>납기 상태</small><b data-qno="risk">미확정</b></div></div></div></section>
      <section class="qno-card"><div class="qno-card-head"><b>03. 고객 요구사항 / 출하조건</b><span>Customer & Quality Requirements</span></div><div class="qno-card-body"><div class="qno-checks"><label class="qno-check"><input type="checkbox" name="coaRequired" checked>CoA 발행</label><label class="qno-check"><input type="checkbox" name="inspectionReportRequired" checked>검사성적서 첨부</label><label class="qno-check"><input type="checkbox" name="customerLabelRequired">고객 지정 라벨</label><label class="qno-check"><input type="checkbox" name="specialPackagingRequired">특수 포장</label></div><div class="qno-grid"><div class="qno-field"><label>고객 규격 Revision</label><input name="customerSpecRevision" placeholder="예: SPEC-12"></div><div class="qno-field"><label>출하 형태</label><select name="shippingType"><option>고객사 납품</option><option>택배/화물</option><option>고객 직접수령</option><option>기타</option></select></div><div class="qno-field"><label>LOT 표기방식</label><select name="lotFormat"><option>NAMO LOT</option><option>고객사 LOT 병기</option><option>고객 지정 LOT</option></select></div><div class="qno-field full"><label>특별 요구사항 / 비고</label><textarea name="customerRequirement" placeholder="고객 요청사항, 라벨, 포장, 출하, 검사 관련 특이사항을 입력하세요."></textarea></div></div></div></section>
      <section class="qno-card"><div class="qno-card-head"><b>04. 첨부문서</b><span>Customer Documents</span></div><div class="qno-card-body"><label class="qno-drop"><input type="file" name="attachments" multiple accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"><div><b>고객 PO · 사양서 · 라벨 양식 등 첨부 <span class="qno-file-btn">파일 선택</span></b><span>파일명과 기본정보를 수주 기록에 연결합니다.</span><div class="qno-files" data-qno-files>선택된 파일 없음</div></div></label></div></section>
      <div class="qno-error" data-qno-error></div>
      </main><aside class="qno-side">
      <section class="qno-side-card"><div class="qno-side-head">수주 요약</div><div class="qno-side-body"><div class="qno-summary-row"><span>수주번호</span><b data-qno="id">-</b></div><div class="qno-summary-row"><span>고객사</span><b data-qno="customer">현대자동차</b></div><div class="qno-summary-row"><span>제품</span><b data-qno="product">-</b></div><div class="qno-summary-row"><span>수주수량</span><b data-qno="qty">-</b></div><div class="qno-summary-row"><span>요청 납기</span><b data-qno="due">-</b></div><div class="qno-summary-row"><span>납기 상태</span><b data-qno="risk">미확정</b></div></div></section>
      <section class="qno-side-card"><div class="qno-side-head">시스템 자동 점검</div><div class="qno-side-body"><div class="qno-check-row"><span>고객사</span><em data-qno-check="customer" class="qno-ok">정상</em></div><div class="qno-check-row"><span>제품</span><em data-qno-check="product" class="qno-ok qno-wait">확인</em></div><div class="qno-check-row"><span>수주수량</span><em data-qno-check="qty" class="qno-ok qno-wait">확인</em></div><div class="qno-check-row"><span>요청 납기</span><em data-qno-check="due" class="qno-ok qno-wait">확인</em></div><div class="qno-check-row"><span>포장정보</span><em data-qno-check="pack" class="qno-ok">정상</em></div><div class="qno-note">수주 확정 후 생산계획 → 작업지시 → 품질검사 → 출하 단계에서 동일 수주번호로 추적합니다.</div></div></section>
      <section class="qno-side-card"><div class="qno-side-head">수주 진행 후</div><div class="qno-side-body"><div class="qno-flow"><div class="qno-flow-item"><b>수주 확정</b><span>Sales Order Master</span></div><div class="qno-flow-item"><b>생산계획 반영</b><span>MRP / 생산계획</span></div><div class="qno-flow-item"><b>작업지시 발행</b><span>Work Order / 생산 LOT</span></div><div class="qno-flow-item"><b>IQC → 생산 → PQC/OQC</b><span>품질 및 생산 진행</span></div><div class="qno-flow-item"><b>CoA → 출하 → 납품완료</b><span>출하 및 고객 납품</span></div></div></div></section>
      </aside></form></div>`;
    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
    const form=modal.querySelector("form");restoreDraft(form,draft);
    let manualId=!!clean(form.elements.salesOrderId?.value);
    form.elements.salesOrderId?.addEventListener("input",()=>{manualId=true;});
    form.elements.due?.addEventListener("change",()=>{if(!manualId||!clean(form.elements.salesOrderId.value)){form.elements.salesOrderId.value=nextId(form.elements.due.value);manualId=false;}refresh(modal);});
    modal.querySelector("[data-qno-auto]")?.addEventListener("click",()=>{form.elements.salesOrderId.value=nextId(form.elements.due.value);manualId=false;refresh(modal);});
    form.addEventListener("input",()=>refresh(modal));form.addEventListener("change",()=>refresh(modal));
    form.elements.attachments?.addEventListener("change",()=>{const files=Array.from(form.elements.attachments.files||[]);const box=modal.querySelector("[data-qno-files]");if(box)box.textContent=files.length?files.map(f=>f.name).join(" · "):"선택된 파일 없음";});
    modal.querySelector("[data-qno-draft]")?.addEventListener("click",()=>{write(DRAFT_KEY,draftFromForm(form));window.alert("신규 수주 입력내용을 임시저장했습니다.");});
    modal.querySelector("[data-qno-submit]")?.addEventListener("click",()=>submit(form,modal));
    refresh(modal);form.elements.customer?.focus();
  }

  function fail(modal,message){const el=modal.querySelector("[data-qno-error]");if(el){el.textContent=message;el.classList.add("show");el.scrollIntoView({behavior:"smooth",block:"center"});}return false;}

  async function submit(form,modal){
    const fd=new FormData(form),get=n=>clean(fd.get(n)),qty=num(get("qty")),unit=num(get("unitWeight")),count=num(get("packageQty")),packType=get("packagingType"),due=get("due"),id=get("salesOrderId")||nextId(due),now=new Date().toISOString();
    modal.querySelector("[data-qno-error]")?.classList.remove("show");
    if(!get("customer")||!get("product")||!due||qty<=0)return fail(modal,"고객사·제품·수주수량·요청 납기일을 확인하세요.");
    if(!/^SO-20\d{6}-\d{3}$/.test(id))return fail(modal,"수주번호 형식을 확인하세요. 예: SO-20260114-001");
    if(usedIds().has(id))return fail(modal,"이미 사용 중인 수주번호입니다.");
    const packTouched=Boolean(packType||unit||count);if(packTouched&&(!packType||unit<=0||count<=0))return fail(modal,"포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");
    const attachments=Array.from(form.elements.attachments?.files||[]).map(file=>({name:file.name,size:file.size,type:file.type,lastModified:file.lastModified}));
    const packaging=packTouched?{type:packType,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now}:null;
    const requirement={coaRequired:!!form.elements.coaRequired?.checked,inspectionReportRequired:!!form.elements.inspectionReportRequired?.checked,customerLabelRequired:!!form.elements.customerLabelRequired?.checked,specialPackagingRequired:!!form.elements.specialPackagingRequired?.checked,customerSpecRevision:get("customerSpecRevision"),shippingType:get("shippingType"),lotFormat:get("lotFormat"),customerRequirement:get("customerRequirement")};
    const meta={salesOrderIdOverride:id,orderDate:get("orderDate")||todayIso(),requestedDue:due,confirmedDue:get("confirmedDue"),customerItemCode:get("customerItemCode"),deliveryPlace:get("deliveryPlace"),orderType:get("orderType")||"양산",salesStatus:"확정",salesManager:get("salesManager")||currentUser(),customerOverride:get("customer"),productOverride:get("product"),qtyOverride:qty,requirements:requirement,attachments,savedAt:now,savedBy:currentUser(),masterDataOwner:"SALES",source:"NAMO_NEW_ORDER_V2"};
    const row={id,customer:get("customer"),po:get("po")||"-",product:get("product"),qty,due,plan:"계획대기",shipping:"-",source:"MANUAL",packaging,packagingType:packaging?.type||"",unitPackQty:packaging?.unitWeight||0,packageQty:packaging?.packageQty||0,remarks:get("customerRequirement"),orderMeta:meta,customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,orderDate:meta.orderDate,salesStatus:"확정",salesManager:meta.salesManager};
    const next=[row,...rows()];const button=modal.querySelector("[data-qno-submit]");if(button){button.disabled=true;button.textContent="저장 중...";}
    try{
      write(SALES_KEY,next);const mm=readMap(META_KEY);mm[id]=meta;write(META_KEY,mm);if(packaging){const pm=readMap(PACK_KEY);pm[id]=packaging;write(PACK_KEY,pm);}if(get("customerRequirement")){const rm=readMap(REMARK_KEY);rm[id]=get("customerRequirement");write(REMARK_KEY,rm);}if(typeof window.qmesSyncUpsert==="function")await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:now,savedBy:currentUser(),source:"NAMO_NEW_ORDER_V2"});
      try{localStorage.removeItem(DRAFT_KEY);}catch(_){}window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",reason:"new-order",id}}));window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"sales",id}}));close();
    }catch(error){console.error("[NAMO New Order V2] save failed",error);fail(modal,"수주 저장 중 오류가 발생했습니다. "+clean(error?.message));if(button){button.disabled=false;button.textContent="수주 확정";}}
  }

  document.addEventListener("click",event=>{
    const t=event.target;if(!(t instanceof Element))return;
    if(t.closest(`#${MODAL_ID} [data-qno-close]`)){event.preventDefault();close();return;}
    const btn=t.closest(".qmes-sales-stable .qerp-head-actions button");if(!btn)return;const text=clean(btn.textContent);if(text!=="+ 신규 수주"&&text!=="신규 수주"&&text!=="입력 닫기")return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();open();
  },true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.getElementById(MODAL_ID))close();},true);

  window.qmesSalesNewOrderNamo={open,close};
})();
