/* NAMO QMES - Enterprise Shipping / Logistics V1 - 2026-08-28
 * ADD-ONLY view + action patch.
 * Replaces the visible '출하 · 납품관리' ERP tab with the uploaded HTML-style '출하 / 물류' screen.
 * Existing shipping shared data remains qmes-erp-shipping-v1 / erp:shipping.
 */
(function(){
  "use strict";
  if(window.__QMES_SHIPPING_ENTERPRISE_MODULE_20260828_V1__)return;
  window.__QMES_SHIPPING_ENTERPRISE_MODULE_20260828_V1__=true;

  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const SALES_KEY="qmes-erp-sales-v1";
  const SALES_META_KEY="qmes-sales-order-meta-v1";
  const HOST_ID="qmes-shipping-enterprise-module-20260828-v1";
  const STYLE_ID="qmes-shipping-enterprise-style-20260828-v1";
  const MODAL_ID="qmes-shipping-enterprise-modal-20260828-v1";
  let lastSignature="";
  let queued=false;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};
  const shippingRows=()=>{const v=read(SHIPPING_KEY,[]);return Array.isArray(v)?v:[];};
  const salesRows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const salesMeta=()=>readMap(SALES_META_KEY);
  const currentUser=()=>clean(window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__?.name||window.__QMES_CURRENT_USER__||window.__QMES_USER__)||"SYSTEM";

  function salesId(row,map=salesMeta()){
    const id=clean(row?.id),key=clean(row?.workOrder)||id,meta=map[key]||map[id]||row?.orderMeta||{};
    return clean(meta.salesOrderIdOverride)||id;
  }
  function salesMetaFor(row,map=salesMeta()){
    const id=clean(row?.id),key=clean(row?.workOrder)||id;
    return map[key]||map[id]||row?.orderMeta||{};
  }
  function completedText(v){return /출하완료|납품완료|배송완료|출고완료/.test(clean(v));}

  function displayRows(){
    const base=shippingRows().map((row,index)=>({
      raw:row,
      shipNo:clean(row?.shipNo||row?.shippingNo||row?.no||row?.deliveryNo||row?.invoice)||"-",
      sales:clean(row?.sales||row?.salesOrder||row?.salesOrderId)||"-",
      customer:clean(row?.customer)||"-",
      product:clean(row?.product)||"-",
      lot:clean(row?.lot||row?.workOrder)||"-",
      qty:num(row?.shipQty??row?.qty??row?.actualQty),
      oqc:clean(row?.oqc)||"-",
      coa:clean(row?.coa)||"-",
      date:iso(row?.actualShipDate||row?.shipDate||row?.date)||"-",
      delivery:clean(row?.delivery||row?.status||row?.shipping)||"-",
      vehicle:clean(row?.vehicle||row?.carNo),
      driver:clean(row?.driver||row?.driverName),
      sourceIndex:index
    }));

    const existing=new Set(base.map(x=>x.sales).filter(v=>v&&v!=="-"));
    const map=salesMeta();
    salesRows().forEach(row=>{
      const meta=salesMetaFor(row,map),sid=salesId(row,map);
      if(!sid||existing.has(sid))return;
      const state=[row?.shipping,row?.delivery,meta?.shippingStatus,meta?.deliveryStatus].map(clean).join(" ");
      if(!(row?.actualShipment===true||meta?.actualShipment===true||completedText(state)))return;
      const lot=clean(row?.workOrder||meta?.workOrder||meta?.productionLot)||"-";
      let oqc="-",coa="-";
      try{
        const quality=lot!=="-"?window.DB?.lots?.[lot]?.qualityLink:null;
        oqc=clean(quality?.oqc?.status)||"-";
        coa=clean(quality?.coa?.status)||"-";
      }catch(_){ }
      base.push({
        raw:row,
        shipNo:clean(meta?.shippingNo)||"-",
        sales:sid,
        customer:clean(meta?.customerOverride)||clean(row?.customer)||"-",
        product:clean(meta?.productOverride)||clean(row?.product)||"-",
        lot,
        qty:num(meta?.actualShipQty??row?.actualShipQty??meta?.qtyOverride??row?.qty),
        oqc,coa,
        date:iso(meta?.actualShipDate||row?.actualShipDate||row?.shipDate)||"-",
        delivery:"출하완료",
        vehicle:"",driver:"",sourceIndex:-1
      });
    });

    return base.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.shipNo).localeCompare(String(a.shipNo)));
  }

  function tone(value){
    const v=clean(value);
    if(/불합격|차단|HOLD|지연/.test(v))return "red";
    if(/합격|완료|발행|납품완료|출하완료/.test(v))return "green";
    if(/배차|예정|대기/.test(v))return "blue";
    return "gray";
  }

  function findShippingRoot(){
    return Array.from(document.querySelectorAll(".qerp")).find(root=>{
      const title=clean(root.querySelector(".qerp-title")?.textContent);
      return /출하/.test(title)&&/납품|물류/.test(title);
    })||null;
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;
    s.textContent=`
      .qmes-shipping-enterprise-active > *:not(#${HOST_ID}){display:none!important}
      #${HOST_ID}{font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;color:#172033!important}
      #${HOST_ID} *{box-sizing:border-box!important}
      #${HOST_ID} .nsh-hero{border:1px solid #dbe4f4!important;background:linear-gradient(135deg,#fff 0%,#f5f8ff 100%)!important;border-radius:14px!important;padding:17px 19px!important;margin-bottom:14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important}
      #${HOST_ID} .nsh-hero h1{margin:0 0 5px!important;font-size:20px!important;font-weight:950!important;letter-spacing:-.025em!important;color:#172033!important}
      #${HOST_ID} .nsh-hero p{margin:0!important;font-size:11px!important;color:#667085!important;font-weight:650!important}
      #${HOST_ID} .nsh-actions{display:flex!important;gap:8px!important;flex-wrap:wrap!important}
      #${HOST_ID} .nsh-btn{height:37px!important;padding:0 12px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-family:inherit!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important}
      #${HOST_ID} .nsh-btn.primary{background:#2457d6!important;border-color:#2457d6!important;color:#fff!important}
      #${HOST_ID} .nsh-card{background:#fff!important;border:1px solid #e3e8ef!important;border-radius:14px!important;overflow:hidden!important;box-shadow:0 5px 18px rgba(15,23,42,.025)!important}
      #${HOST_ID} .nsh-wrap{overflow:auto!important}
      #${HOST_ID} table{width:100%!important;min-width:980px!important;border-collapse:collapse!important;table-layout:fixed!important;font-family:inherit!important}
      #${HOST_ID} th,#${HOST_ID} td{height:48px!important;padding:0 11px!important;border-bottom:1px solid #edf0f4!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #${HOST_ID} th{background:#fafbfd!important;color:#6e788b!important;font-size:10.5px!important;font-weight:800!important}
      #${HOST_ID} td{background:#fff!important;color:#253047!important;font-size:11.5px!important;font-weight:700!important}
      #${HOST_ID} tbody tr:last-child td{border-bottom:0!important}#${HOST_ID} tbody tr:hover td{background:#fbfdff!important}
      #${HOST_ID} .nsh-link{border:0!important;background:transparent!important;color:#2457d6!important;font:inherit!important;font-weight:750!important;text-decoration:underline!important;text-underline-offset:3px!important;cursor:pointer!important}
      #${HOST_ID} .nsh-status{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:58px!important;height:24px!important;padding:0 8px!important;border-radius:999px!important;font-size:9.5px!important;font-weight:800!important}
      #${HOST_ID} .green{background:#eaf7ef!important;color:#187b43!important}#${HOST_ID} .blue{background:#edf3ff!important;color:#2457d6!important}#${HOST_ID} .red{background:#fff0ee!important;color:#b83930!important}#${HOST_ID} .gray{background:#eef1f5!important;color:#657085!important}
      #${HOST_ID} .nsh-empty{padding:38px!important;text-align:center!important;color:#94a3b8!important;font-size:11px!important}
      #${HOST_ID} .nsh-count{padding:9px 12px!important;border-top:1px solid #edf0f4!important;color:#8a94a6!important;font-size:9.5px!important;text-align:right!important}

      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483550!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(15,23,42,.34)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${MODAL_ID} *{box-sizing:border-box!important}.nshm-card{width:min(980px,95vw)!important;max-height:90vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dfe5ed!important;border-radius:16px!important;box-shadow:0 28px 80px rgba(15,23,42,.26)!important;overflow:hidden!important}.nshm-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;padding:18px 20px 14px!important;border-bottom:1px solid #e8edf3!important}.nshm-title{font-size:18px!important;font-weight:950!important;color:#182238!important}.nshm-sub{margin-top:4px!important;font-size:10px!important;color:#8a96a8!important}.nshm-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f4f6f9!important;color:#334155!important;font-size:22px!important;cursor:pointer!important}.nshm-body{overflow:auto!important;padding:16px 20px 18px!important}.nshm-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:11px 12px!important}.nshm-field.w2{grid-column:span 2!important}.nshm-field.full{grid-column:1/-1!important}.nshm-field label{display:block!important;margin-bottom:5px!important;color:#59667a!important;font-size:9.5px!important;font-weight:900!important}.nshm-field input,.nshm-field select,.nshm-field textarea{width:100%!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font-family:inherit!important;font-size:11px!important;outline:none!important}.nshm-field input,.nshm-field select{height:38px!important;padding:0 10px!important}.nshm-field textarea{height:70px!important;padding:9px 10px!important;resize:vertical!important}.nshm-field input[readonly]{background:#f7f9fc!important;color:#59667a!important}.nshm-error{display:none!important;margin-top:11px!important;padding:9px 10px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:10px!important;font-weight:850!important}.nshm-error.show{display:block!important}.nshm-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 20px 16px!important;border-top:1px solid #e8edf3!important}.nshm-btn{height:39px!important;padding:0 14px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-family:inherit!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}.nshm-btn.primary{background:#285bd8!important;border-color:#285bd8!important;color:#fff!important}.nshm-table{width:100%!important;border-collapse:collapse!important}.nshm-table th,.nshm-table td{height:43px!important;padding:0 9px!important;border-bottom:1px solid #edf1f5!important;text-align:center!important;font-size:10px!important}.nshm-table th{background:#fafbfd!important;color:#697589!important}.nshm-note{padding:9px 10px!important;margin-bottom:12px!important;border:1px dashed #d4deeb!important;border-radius:8px!important;background:#f9fbfd!important;color:#778497!important;font-size:9.5px!important}
      @media(max-width:760px){#${HOST_ID} .nsh-hero{align-items:flex-start!important;flex-direction:column!important}#${MODAL_ID}{padding:8px!important;align-items:flex-start!important}.nshm-grid{grid-template-columns:1fr 1fr!important}}
      @media(max-width:520px){.nshm-grid{grid-template-columns:1fr!important}.nshm-field.w2{grid-column:span 1!important}}
    `;document.head.appendChild(s);
  }

  function renameMenus(){
    document.querySelectorAll(".qmes-top-menu-item,.qmes-menu-item,.qmes-nav-item,button,a").forEach(node=>{
      const raw=clean(node.textContent),key=raw.replace(/\s+/g,"");
      if(key!=="출하·납품"&&key!=="출하·납품관리")return;
      const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;
      while((text=walker.nextNode())){
        if(/출하\s*·\s*납품(?:관리)?/.test(text.nodeValue||"")){
          text.nodeValue=(text.nodeValue||"").replace(/출하\s*·\s*납품(?:관리)?/,"출하 · 물류");break;
        }
      }
    });
  }

  function signature(){return JSON.stringify(displayRows().map(x=>[x.shipNo,x.sales,x.customer,x.lot,x.qty,x.oqc,x.date,x.delivery]));}

  function render(force=false){
    const host=document.getElementById(HOST_ID);if(!host)return;
    const sig=signature();if(!force&&sig===lastSignature&&host.childElementCount)return;lastSignature=sig;
    const list=displayRows();
    host.innerHTML=`<section class="nsh-hero"><div><h1>출하 / 물류</h1><p>OQC 합격 LOT만 출하 가능하도록 제어하고, 수주·납품 이력을 연결합니다.</p></div><div class="nsh-actions"><button type="button" class="nsh-btn" data-nsh-dispatch>배차 현황</button><button type="button" class="nsh-btn primary" data-nsh-register>+ 출하등록</button></div></section><section class="nsh-card"><div class="nsh-wrap"><table><colgroup><col style="width:14%"><col style="width:16%"><col style="width:15%"><col style="width:16%"><col style="width:12%"><col style="width:9%"><col style="width:10%"><col style="width:8%"></colgroup><thead><tr><th>출하번호</th><th>수주번호</th><th>고객사</th><th>완제품 LOT</th><th>출하량</th><th>OQC</th><th>출하일</th><th>상태</th></tr></thead><tbody>${list.length?list.map(x=>`<tr><td>${esc(x.shipNo)}</td><td>${x.sales!=="-"?`<button type="button" class="nsh-link" data-nsh-sales="${esc(x.sales)}">${esc(x.sales)}</button>`:"-"}</td><td>${esc(x.customer)}</td><td>${x.lot!=="-"?`<button type="button" class="nsh-link" data-nsh-lot="${esc(x.lot)}">${esc(x.lot)}</button>`:"-"}</td><td>${x.qty?esc(x.qty.toLocaleString("ko-KR",{maximumFractionDigits:3}))+" kg":"-"}</td><td>${x.oqc!=="-"?`<span class="nsh-status ${tone(x.oqc)}">${esc(x.oqc)}</span>`:"-"}</td><td>${esc(x.date)}</td><td>${x.delivery!=="-"?`<span class="nsh-status ${tone(x.delivery)}">${esc(x.delivery)}</span>`:"-"}</td></tr>`).join(""):`<tr><td colspan="8"><div class="nsh-empty">등록된 출하 / 물류 데이터가 없습니다.</div></td></tr>`}</tbody></table></div><div class="nsh-count">${list.length.toLocaleString("ko-KR")}건</div></section>`;
  }

  function ensure(){
    ensureStyle();renameMenus();
    const root=findShippingRoot();
    const old=document.getElementById(HOST_ID);
    if(!root){old?.remove();return;}
    root.classList.add("qmes-shipping-enterprise-active");
    let host=old;
    if(!host){host=document.createElement("div");host.id=HOST_ID;root.appendChild(host);}
    render();
  }

  function salesById(id){
    const wanted=clean(id),map=salesMeta();
    return salesRows().find(row=>salesId(row,map)===wanted||clean(row?.id)===wanted)||null;
  }

  function qualityForLot(lot){
    let oqc="-",coa="-",available=0;
    try{
      const lotRow=window.DB?.lots?.[lot]||{};
      oqc=clean(lotRow?.qualityLink?.oqc?.status)||"-";
      coa=clean(lotRow?.qualityLink?.coa?.status)||clean(window.DB?.coa?.[lot]?"발행":"-")||"-";
      available=num(lotRow?.availableQty??lotRow?.qty);
    }catch(_){ }
    const existing=shippingRows().find(row=>clean(row?.lot||row?.workOrder)===clean(lot));
    if(oqc==="-"&&existing)oqc=clean(existing.oqc)||"-";
    if(coa==="-"&&existing)coa=clean(existing.coa)||"-";
    return {oqc,coa,available};
  }

  function nextShipNo(date){
    const stamp=(iso(date)||new Date().toISOString().slice(0,10)).slice(2).replace(/-/g,"");
    const all=shippingRows();let n=1,id="";
    do{id=`SH-${stamp}-${String(n++).padStart(2,"0")}`;}while(all.some(row=>clean(row?.shipNo||row?.shippingNo||row?.no)===id));
    return id;
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove();document.documentElement.style.overflow="";}

  function openRegister(){
    ensureStyle();closeModal();
    const modal=document.createElement("div");modal.id=MODAL_ID;
    const today=new Date().toISOString().slice(0,10),salesIds=salesRows().map(row=>salesId(row)).filter(Boolean);
    modal.innerHTML=`<section class="nshm-card" role="dialog" aria-modal="true" aria-label="출하 등록"><div class="nshm-head"><div><div class="nshm-title">출하 등록</div><div class="nshm-sub">OQC 합격 · CoA 발행 LOT 기준 출하 / 물류 등록</div></div><button type="button" class="nshm-close" data-nshm-close>×</button></div><form><div class="nshm-body"><datalist id="nshm-sales-list">${salesIds.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist><div class="nshm-note">수주번호와 완제품 LOT을 입력하면 고객사·제품·OQC·CoA 정보를 확인합니다.</div><div class="nshm-grid"><div class="nshm-field"><label>출하번호</label><input name="shipNo" value="${nextShipNo(today)}" readonly></div><div class="nshm-field"><label>수주번호 *</label><input name="sales" list="nshm-sales-list" placeholder="SO-..."></div><div class="nshm-field"><label>고객사</label><input name="customer" readonly></div><div class="nshm-field"><label>출하일 *</label><input type="date" name="date" value="${today}"></div><div class="nshm-field"><label>완제품 LOT *</label><input name="lot" placeholder="생산 LOT / 작업지시"></div><div class="nshm-field"><label>가용수량</label><input name="available" readonly></div><div class="nshm-field"><label>출하량 (kg) *</label><input type="number" min="0" step="0.001" name="qty"></div><div class="nshm-field"><label>상태</label><select name="delivery"><option>배차완료</option><option>출하완료</option><option>납품완료</option></select></div><div class="nshm-field"><label>OQC</label><input name="oqc" readonly></div><div class="nshm-field"><label>CoA</label><input name="coa" readonly></div><div class="nshm-field w2"><label>차량 / 기사</label><input name="vehicleDriver" placeholder="차량번호 / 기사명"></div><div class="nshm-field w2"><label>납품처</label><input name="destination" placeholder="고객 지정 납품처"></div><div class="nshm-field w2"><label>제품</label><input name="product" readonly></div><div class="nshm-field full"><label>비고</label><textarea name="remark" placeholder="납품 특이사항"></textarea></div></div><div class="nshm-error" data-nshm-error></div></div><div class="nshm-actions"><button type="button" class="nshm-btn" data-nshm-close>취소</button><button type="submit" class="nshm-btn primary">출하 등록</button></div></form></section>`;
    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
    const form=modal.querySelector("form");
    const syncSales=()=>{
      const row=salesById(form.elements.sales.value),meta=row?salesMetaFor(row):{};
      form.elements.customer.value=row?(clean(meta.customerOverride)||clean(row.customer)):"";
      form.elements.product.value=row?(clean(meta.productOverride)||clean(row.product)):"";
      form.elements.destination.value=row?(clean(meta.deliveryPlace)||clean(row.deliveryPlace)):form.elements.destination.value;
      if(row&&!clean(form.elements.lot.value))form.elements.lot.value=clean(row.workOrder||meta.workOrder);
      syncLot();
    };
    const syncLot=()=>{
      const q=qualityForLot(clean(form.elements.lot.value));
      form.elements.oqc.value=q.oqc;
      form.elements.coa.value=q.coa;
      form.elements.available.value=q.available?`${q.available.toLocaleString("ko-KR",{maximumFractionDigits:3})} kg`:"-";
    };
    form.elements.sales.addEventListener("change",syncSales);form.elements.sales.addEventListener("input",syncSales);
    form.elements.lot.addEventListener("change",syncLot);form.elements.lot.addEventListener("input",syncLot);
    form.elements.date.addEventListener("change",()=>{form.elements.shipNo.value=nextShipNo(form.elements.date.value);});
    form.addEventListener("submit",saveRegister);
    form.elements.sales.focus();
  }

  function showModalError(form,message){const box=form.querySelector("[data-nshm-error]");if(box){box.textContent=message;box.classList.add("show");}return false;}

  async function saveRegister(event){
    event.preventDefault();
    const form=event.currentTarget,get=n=>clean(form.elements[n]?.value),qty=num(get("qty")),lot=get("lot"),quality=qualityForLot(lot),available=quality.available;
    form.querySelector("[data-nshm-error]")?.classList.remove("show");
    if(!get("sales")||!get("customer")||!get("product")||!get("date")||!lot||qty<=0)return showModalError(form,"수주번호·완제품 LOT·출하일·출하량을 확인하세요.");
    if(!/합격|PASS|OK/i.test(quality.oqc))return showModalError(form,"OQC 합격 LOT만 출하 등록할 수 있습니다.");
    if(!/발행|완료/.test(quality.coa))return showModalError(form,"CoA 발행 완료 후 출하 등록할 수 있습니다.");
    if(available>0&&qty>available+0.0001)return showModalError(form,"출하량이 가용수량을 초과합니다.");
    const vd=get("vehicleDriver"),parts=vd.split("/").map(clean),delivery=get("delivery")||"배차완료",now=new Date().toISOString();
    const row={shipNo:get("shipNo"),date:get("date"),sales:get("sales"),customer:get("customer"),product:get("product"),lot,qty,oqc:quality.oqc,coa:quality.coa,delivery,vehicle:parts[0]||vd,driver:parts[1]||"",destination:get("destination"),remark:get("remark"),actualShipment:/출하완료|납품완료/.test(delivery),source:/출하완료|납품완료/.test(delivery)?"ERP_SHIPPING":"SHIPPING_PLAN",savedAt:now,savedBy:currentUser()};
    const next=[row,...shippingRows().filter(x=>clean(x?.shipNo||x?.shippingNo||x?.no)!==row.shipNo)];
    const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=true;submit.textContent="등록 중...";}
    try{
      write(SHIPPING_KEY,next);
      try{
        if(window.DB?.lots?.[lot]){
          window.DB.lots[lot].ship={...(window.DB.lots[lot].ship||{}),shipNo:row.shipNo,shipDate:row.date,shipQty:row.qty,customer:row.customer,destination:row.destination,vehicle:row.vehicle,driver:row.driver,delivery:row.delivery,actualShipment:row.actualShipment,source:row.source,confirmedAt:now};
        }
      }catch(_){ }
      if(typeof window.qmesSyncUpsert==="function")await window.qmesSyncUpsert("inventory","erp:shipping",{module:"erp",schema:1,kind:"shipping",rows:next,updatedAt:now,updatedBy:currentUser(),source:"NAMO_SHIPPING_ENTERPRISE_V1"});
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"shipping",reason:"shipping-register"}}));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{module:"shipping"}}));
      closeModal();lastSignature="";ensure();
    }catch(error){console.error("[NAMO Shipping Enterprise] save failed",error);showModalError(form,"출하 등록 중 오류가 발생했습니다. "+clean(error?.message));if(submit){submit.disabled=false;submit.textContent="출하 등록";}}
  }

  function openDispatch(){
    ensureStyle();closeModal();const list=displayRows().filter(x=>x.delivery!=="-");const modal=document.createElement("div");modal.id=MODAL_ID;
    modal.innerHTML=`<section class="nshm-card" role="dialog" aria-modal="true" aria-label="배차 현황"><div class="nshm-head"><div><div class="nshm-title">배차 현황</div><div class="nshm-sub">출하 일정 · 차량 · 기사 · 배송상태</div></div><button type="button" class="nshm-close" data-nshm-close>×</button></div><div class="nshm-body"><div class="nshm-table-wrap"><table class="nshm-table"><thead><tr><th>출하번호</th><th>고객사</th><th>LOT</th><th>출하량</th><th>출하일</th><th>차량 / 기사</th><th>상태</th></tr></thead><tbody>${list.length?list.map(x=>`<tr><td>${esc(x.shipNo)}</td><td>${esc(x.customer)}</td><td>${esc(x.lot)}</td><td>${x.qty?esc(x.qty.toLocaleString("ko-KR"))+" kg":"-"}</td><td>${esc(x.date)}</td><td>${esc([x.vehicle,x.driver].filter(Boolean).join(" / ")||"-")}</td><td><span class="nsh-status ${tone(x.delivery)}">${esc(x.delivery)}</span></td></tr>`).join(""):`<tr><td colspan="7">등록된 배차 정보가 없습니다.</td></tr>`}</tbody></table></div></div><div class="nshm-actions"><button type="button" class="nshm-btn primary" data-nshm-close>확인</button></div></section>`;
    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";
  }

  document.addEventListener("click",event=>{
    const t=event.target;if(!(t instanceof Element))return;
    if(t.closest(`#${MODAL_ID} [data-nshm-close]`)){event.preventDefault();closeModal();return;}
    if(t.closest(`#${HOST_ID} [data-nsh-register]`)){event.preventDefault();openRegister();return;}
    if(t.closest(`#${HOST_ID} [data-nsh-dispatch]`)){event.preventDefault();openDispatch();return;}
    const sales=t.closest(`#${HOST_ID} [data-nsh-sales]`);if(sales){event.preventDefault();window.qmesSalesOrderDetail?.open?.(sales.getAttribute("data-nsh-sales"));return;}
    const lot=t.closest(`#${HOST_ID} [data-nsh-lot]`);if(lot){event.preventDefault();try{localStorage.setItem("qmes-focus-lot",clean(lot.getAttribute("data-nsh-lot")));}catch(_){}location.hash="#page-lot-trace";}
  },true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.getElementById(MODAL_ID))closeModal();},true);

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensure();});}
  function boot(){ensure();[80,180,350,700,1200,2200,4000].forEach(ms=>setTimeout(ensure,ms));const app=document.getElementById("root")||document.body;new MutationObserver(schedule).observe(app,{childList:true,subtree:true});}
  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener("storage",event=>{if([SHIPPING_KEY,SALES_KEY,SALES_META_KEY].includes(event.key))schedule();});window.addEventListener("hashchange",schedule);window.addEventListener("popstate",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesShippingEnterprise={ensure,render,openRegister,openDispatch};
})();
