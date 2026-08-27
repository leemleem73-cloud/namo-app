/* NAMO QMES - Sales V14 - restore Work Order derived sales rows, safe PO hide */
(function(){
  "use strict";
  if(window.__QMES_SALES_V14__)return;
  window.__QMES_SALES_V14__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const MODAL_ID="qmes-sales-edit-v14";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v;}catch(_){return f;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(_){}};
  const map=k=>{const v=read(k,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const rowKey=r=>clean(r?.workOrder)||clean(r?.id);
  const metaFor=r=>{const m=map(META_KEY),key=rowKey(r),id=clean(r?.id);return m[key]||m[id]||r?.orderMeta||{};};
  const effectiveId=r=>clean(metaFor(r).salesOrderIdOverride)||clean(r?.id);

  function ensureStyle(){
    if(document.getElementById("qmes-sales-v14-style"))return;
    const style=document.createElement("style");
    style.id="qmes-sales-v14-style";
    style.textContent=`
      .qmes-sales-stable .qerp-table th:nth-child(3),.qmes-sales-stable .qerp-table td:nth-child(3){display:none!important}
      .qmes-sales-stable .qerp-table{min-width:1230px!important}
      .qmes-sales-stable .qerp-sales-compact-form .qmes-sales-po-field-v14{display:none!important}
      .qmes-sales-stable .qerp-sub{max-width:none!important}
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483640!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.45)!important}
      #${MODAL_ID} .card{width:min(1120px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border-radius:16px!important;box-shadow:0 28px 90px rgba(15,23,42,.3)!important}
      #${MODAL_ID} .head{display:flex!important;justify-content:space-between!important;align-items:center!important;padding:18px 20px!important;border-bottom:1px solid #e2e8f0!important}
      #${MODAL_ID} h2{margin:0!important;font-size:20px!important;font-weight:950!important;color:#0f172a!important}
      #${MODAL_ID} .sub{margin-top:4px!important;color:#64748b!important;font-size:11px!important}
      #${MODAL_ID} .body{padding:18px 20px 22px!important}
      #${MODAL_ID} .status,#${MODAL_ID} .grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px 12px!important;margin-bottom:16px!important}
      #${MODAL_ID} .status>div{padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:9px!important;background:#f8fafc!important}
      #${MODAL_ID} .status b{display:block!important;font-size:9px!important;color:#64748b!important;margin-bottom:5px!important}
      #${MODAL_ID} .status span{font-size:12px!important;font-weight:850!important;color:#0f172a!important}
      #${MODAL_ID} label{display:block!important;margin-bottom:5px!important;font-size:10px!important;font-weight:900!important;color:#475569!important}
      #${MODAL_ID} input,#${MODAL_ID} select{width:100%!important;height:38px!important;box-sizing:border-box!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;font-size:12px!important}
      #${MODAL_ID} .wide{grid-column:1/-1!important}
      #${MODAL_ID} .actions{display:flex!important;justify-content:flex-end!important;gap:8px!important}
      #${MODAL_ID} button{height:38px!important;padding:0 14px!important;border-radius:8px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .save{background:#2563eb!important;color:#fff!important;border:1px solid #2563eb!important}
      #${MODAL_ID} .close,#${MODAL_ID} .cancel{background:#fff!important;border:1px solid #cbd5e1!important}
      @media(max-width:900px){#${MODAL_ID} .status,#${MODAL_ID} .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    `;
    document.head.appendChild(style);
  }

  function tagUi(){
    document.querySelectorAll('.qmes-sales-stable .qerp-sales-compact-form .qerp-field').forEach(field=>{
      if(clean(field.querySelector('label')?.textContent)==='고객 PO 번호')field.classList.add('qmes-sales-po-field-v14');
    });
    document.querySelectorAll('.qmes-sales-stable .qerp-sub').forEach(el=>{
      if(/고객 PO/.test(el.textContent||''))el.textContent='수주를 생산계획 및 출하계획의 시작점으로 관리';
    });
  }

  let refreshing=false;
  async function refreshFromWorkOrders(){
    if(refreshing)return;
    refreshing=true;
    try{
      if(typeof window.qmesSyncPullWorkOrders==='function'){
        try{await window.qmesSyncPullWorkOrders();}catch(error){console.warn('[QMES Sales V14] workorder pull skipped',error?.message||error);}
      }
      if(typeof window.qmesSalesFromWorkOrderApply==='function'){
        try{await window.qmesSalesFromWorkOrderApply();}catch(error){console.warn('[QMES Sales V14] sales derive failed',error?.message||error);}
      }
      window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'sales',source:'SALES_V14_RESTORE'}}));
    }finally{refreshing=false;tagUi();}
  }

  function isSalesTable(table){const h=Array.from(table?.querySelectorAll('thead th')||[]).map(th=>clean(th.textContent));return h.includes('수주번호')&&h.includes('고객사')&&h.includes('비고');}
  function editButton(target){if(!(target instanceof Element))return null;const b=target.closest('button');if(!b||(!b.classList.contains('qmes-sales-edit-btn')&&clean(b.textContent)!=='수정'))return null;return isSalesTable(b.closest('table'))?b:null;}
  function rowFromButton(button){const tr=button.closest('tr');if(!tr)return null;const id=clean(tr.querySelector('[data-qso-id]')?.getAttribute('data-qso-id')||tr.children?.[0]?.textContent);const stored=rows().find(r=>clean(r.id)===id||effectiveId(r)===id);return stored?{...stored,id:effectiveId(stored)}:null;}
  function close(){document.getElementById(MODAL_ID)?.remove();}

  function open(row){
    if(!row)return false;
    ensureStyle();close();
    const id=effectiveId(row),key=rowKey(row),meta=metaFor(row),pm=map(PACK_KEY),rm=map(REMARK_KEY),pack=pm[key]||pm[id]||row.packaging||{},remarks=clean(rm[key]??rm[id]??row.remarks);
    const modal=document.createElement('div');modal.id=MODAL_ID;
    modal.innerHTML=`<div class="card"><div class="head"><div><h2>수주 전체 수정</h2><div class="sub">${esc(id)} · 작업지시/LOT ${esc(key||'-')}</div></div><button type="button" class="close" data-close="1">닫기</button></div><form class="body" data-form="1"><div class="status"><div><b>현재 수주번호</b><span>${esc(id)}</span></div><div><b>작업지시 / 생산 LOT</b><span>${esc(key||'-')}</span></div><div><b>생산계획</b><span>${esc(row.plan||'-')}</span></div><div><b>출하상태</b><span>${esc(row.shipping||'-')}</span></div></div><div class="grid"><div><label>수주번호</label><input name="salesOrderId" value="${esc(id)}"></div><div><label>고객사</label><input name="customer" value="${esc(row.customer||'')}"></div><div><label>고객 품목코드</label><input name="customerItemCode" value="${esc(meta.customerItemCode||row.customerItemCode||'')}"></div><div><label>수주구분</label><select name="orderType"><option>양산</option><option>개발</option><option>샘플</option><option>긴급</option></select></div><div><label>제품</label><input name="product" value="${esc(row.product||'')}"></div><div><label>수량 (kg)</label><input name="qty" value="${esc(row.qty||'')}"></div><div><label>요청 납기일</label><input type="date" name="due" value="${esc(clean(meta.requestedDue)||clean(row.due))}"></div><div><label>납품처</label><input name="deliveryPlace" value="${esc(meta.deliveryPlace||row.deliveryPlace||'')}"></div><div><label>포장형태</label><select name="packagingType"><option value="">선택</option><option>CAN</option><option>DRUM</option><option>IBC</option><option>기타</option></select></div><div><label>단위 포장량 (kg)</label><input type="number" name="unitWeight" value="${esc(pack.unitWeight??'')}"></div><div><label>포장수량 (EA)</label><input type="number" name="packageQty" value="${esc(pack.packageQty??'')}"></div><div class="wide"><label>비고</label><input name="remarks" value="${esc(remarks)}"></div></div><div class="actions"><button type="button" class="cancel" data-close="1">취소</button><button type="submit" class="save">수정 저장</button></div></form></div>`;
    modal.__row={...row,id,key};document.body.appendChild(modal);return true;
  }

  async function saveEdit(form){
    const modal=document.getElementById(MODAL_ID),row=modal?.__row;if(!row)return;
    const fd=new FormData(form),get=n=>clean(fd.get(n)),qty=num(get('qty')),unit=num(get('unitWeight')),count=num(get('packageQty')),type=get('packagingType');
    const oldId=clean(row.id),newId=get('salesOrderId'),key=clean(row.key)||rowKey(row),product=get('product');
    if(!newId||!get('customer')||!product||qty<=0){alert('수주번호·고객사·제품·수량을 확인하세요.');return;}
    const mm=map(META_KEY),pm=map(PACK_KEY),rm=map(REMARK_KEY),now=new Date().toISOString(),prev=mm[key]||mm[oldId]||row.orderMeta||{};
    const meta={...prev,salesOrderIdOverride:newId,customerOverride:get('customer'),productOverride:product,qtyOverride:qty,requestedDue:get('due'),customerItemCode:get('customerItemCode'),deliveryPlace:get('deliveryPlace'),orderType:get('orderType')||'양산',savedAt:now};
    delete meta.poOverride;mm[key]=meta;if(oldId!==key)delete mm[oldId];write(META_KEY,mm);
    if(type||unit||count){if(!type||unit<=0||count<=0){alert('포장정보를 모두 입력하세요.');return;}pm[key]={type,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now};}else delete pm[key];write(PACK_KEY,pm);
    const remarks=get('remarks');if(remarks)rm[key]=remarks;else delete rm[key];write(REMARK_KEY,rm);
    if(typeof window.qmesSalesSyncProductToWorkOrder==='function'){try{await window.qmesSalesSyncProductToWorkOrder(key,product);}catch(_){}}
    await refreshFromWorkOrders();close();setTimeout(()=>location.reload(),120);
  }

  document.addEventListener('pointerdown',event=>{const button=editButton(event.target);if(!button)return;const row=rowFromButton(button);if(!row)return;event.preventDefault();event.stopImmediatePropagation();open(row);},true);
  document.addEventListener('click',event=>{const target=event.target;if(!(target instanceof Element))return;if(target.closest('[data-close]')){event.preventDefault();close();return;}if(target===document.getElementById(MODAL_ID))close();},true);
  document.addEventListener('submit',event=>{const form=event.target instanceof Element?event.target.closest('[data-form="1"]'):null;if(!form)return;event.preventDefault();event.stopImmediatePropagation();saveEdit(form);},true);
  window.addEventListener('qmes:workorder-saved',refreshFromWorkOrders);
  window.addEventListener('qmes:workorder-synced',refreshFromWorkOrders);
  window.addEventListener('qmes:mes-master-ready',refreshFromWorkOrders,{once:true});

  ensureStyle();tagUi();
  let tries=0;const timer=setInterval(()=>{tries++;tagUi();if(typeof window.qmesSalesFromWorkOrderApply==='function'){clearInterval(timer);refreshFromWorkOrders();}else if(tries>=30)clearInterval(timer);},200);
  window.qmesSalesEditV14={open,close,refreshFromWorkOrders};
})();
