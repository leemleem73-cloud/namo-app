/* NAMO QMES - Sales V17 - reliable edit button + persistent sales number */
(function(){
  "use strict";
  if(window.__QMES_SALES_V17__)return;
  window.__QMES_SALES_V17__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const MODAL_ID="qmes-sales-edit-v17";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v;}catch(_){return f;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(_){}};
  const readMap=k=>{const v=read(k,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const rowKey=r=>clean(r?.workOrder)||clean(r?.id);

  function metaFor(row){const m=readMap(META_KEY),key=rowKey(row),id=clean(row?.id);return m[key]||m[id]||row?.orderMeta||{};}
  function visibleId(row){return clean(metaFor(row).salesOrderIdOverride)||clean(row?.id);}
  function findRow(id){const t=clean(id);return rows().find(r=>clean(r?.id)===t||rowKey(r)===t||visibleId(r)===t)||null;}

  function isSalesTable(table){
    if(!table)return false;
    const headers=Array.from(table.querySelectorAll("thead th")).map(th=>clean(th.textContent));
    return headers[0]==="수주번호"&&headers.includes("고객사")&&headers.includes("비고");
  }

  function fallbackRow(tr){
    const c=i=>clean(tr?.children?.[i]?.textContent);
    const link=tr?.querySelector('[data-qso-id],.qmes-sales-order-link');
    const id=clean(link?.getAttribute('data-qso-id')||link?.textContent||c(0));
    return {
      id,
      workOrder:id,
      customer:c(1),
      product:c(3),
      qty:num(c(4)),
      due:"",
      plan:c(8),
      shipping:c(9),
      deliveryPlace:c(10),
      source:"SCREEN"
    };
  }

  function rowFromButton(button){
    const tr=button?.closest("tr");if(!tr)return null;
    const link=tr.querySelector('[data-qso-id],.qmes-sales-order-link');
    const stableId=clean(link?.getAttribute('data-qso-id'));
    const shownId=clean(link?.textContent);
    return findRow(stableId)||findRow(shownId)||fallbackRow(tr);
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-v17-style"))return;
    const s=document.createElement("style");s.id="qmes-sales-v17-style";
    s.textContent=`
      .qmes-sales-stable .qerp-table th:nth-child(3),.qmes-sales-stable .qerp-table td:nth-child(3){display:none!important}
      .qmes-sales-stable .qerp-sales-compact-form .qmes-sales-po-field-v17{display:none!important}
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.46)!important}
      #${MODAL_ID} .card{width:min(1120px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border-radius:16px!important;box-shadow:0 28px 90px rgba(15,23,42,.32)!important}
      #${MODAL_ID} .head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:18px 20px!important;border-bottom:1px solid #e2e8f0!important;background:#fff!important}
      #${MODAL_ID} h2{margin:0!important;font-size:20px!important;font-weight:950!important;color:#0f172a!important}
      #${MODAL_ID} .sub{margin-top:4px!important;color:#64748b!important;font-size:11px!important;font-weight:700!important}
      #${MODAL_ID} .body{padding:18px 20px 22px!important}
      #${MODAL_ID} .status,#${MODAL_ID} .grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px 12px!important;margin-bottom:16px!important}
      #${MODAL_ID} .status>div{padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:9px!important;background:#f8fafc!important}
      #${MODAL_ID} .status b{display:block!important;font-size:9px!important;color:#64748b!important;margin-bottom:5px!important}
      #${MODAL_ID} .status span{font-size:12px!important;font-weight:850!important;color:#0f172a!important}
      #${MODAL_ID} label{display:block!important;margin-bottom:5px!important;font-size:10px!important;font-weight:900!important;color:#475569!important}
      #${MODAL_ID} input,#${MODAL_ID} select{box-sizing:border-box!important;width:100%!important;height:38px!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:12px!important}
      #${MODAL_ID} .wide{grid-column:1/-1!important}
      #${MODAL_ID} .actions{display:flex!important;justify-content:flex-end!important;gap:8px!important}
      #${MODAL_ID} button{height:38px!important;padding:0 14px!important;border-radius:8px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
      #${MODAL_ID} .close,#${MODAL_ID} .cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}
      @media(max-width:900px){#${MODAL_ID} .status,#${MODAL_ID} .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    `;
    document.head.appendChild(s);
  }

  function syncUi(){
    document.querySelectorAll('.qmes-sales-stable .qerp-sales-compact-form .qerp-field').forEach(field=>{
      if(clean(field.querySelector('label')?.textContent)==='고객 PO 번호')field.classList.add('qmes-sales-po-field-v17');
    });
    document.querySelectorAll('.qmes-sales-stable table.qerp-table tbody tr').forEach(tr=>{
      const link=tr.querySelector('[data-qso-id],.qmes-sales-order-link');if(!link)return;
      const raw=clean(link.getAttribute('data-qso-id')||link.textContent);
      const row=findRow(raw)||findRow(clean(link.textContent));if(!row)return;
      const next=visibleId(row);if(next)link.textContent=next;
    });
  }

  function close(){document.getElementById(MODAL_ID)?.remove();}

  function open(row){
    if(!row)return false;
    ensureStyle();close();
    const id=visibleId(row)||clean(row.id),key=rowKey(row),meta=metaFor(row),pm=readMap(PACK_KEY),rm=readMap(REMARK_KEY),pack=pm[key]||pm[clean(row.id)]||row.packaging||{},remarks=clean(rm[key]??rm[clean(row.id)]??row.remarks);
    const m=document.createElement("div");m.id=MODAL_ID;
    m.innerHTML=`<div class="card"><div class="head"><div><h2>수주 전체 수정</h2><div class="sub">${esc(id)} · 작업지시/LOT ${esc(key||'-')}</div></div><button type="button" class="close" data-v17-close="1">닫기</button></div><form class="body" data-v17-form="1"><div class="status"><div><b>현재 수주번호</b><span>${esc(id)}</span></div><div><b>작업지시 / 생산 LOT</b><span>${esc(key||'-')}</span></div><div><b>생산계획</b><span>${esc(row.plan||'-')}</span></div><div><b>출하상태</b><span>${esc(row.shipping||'-')}</span></div></div><div class="grid"><div><label>수주번호</label><input name="salesOrderId" value="${esc(id)}"></div><div><label>고객사</label><input name="customer" value="${esc(row.customer||'')}"></div><div><label>고객 품목코드</label><input name="customerItemCode" value="${esc(meta.customerItemCode||row.customerItemCode||'')}"></div><div><label>수주구분</label><select name="orderType"><option ${clean(meta.orderType||row.orderType)==='양산'?'selected':''}>양산</option><option ${clean(meta.orderType||row.orderType)==='개발'?'selected':''}>개발</option><option ${clean(meta.orderType||row.orderType)==='샘플'?'selected':''}>샘플</option><option ${clean(meta.orderType||row.orderType)==='긴급'?'selected':''}>긴급</option></select></div><div><label>제품</label><input name="product" value="${esc(row.product||'')}"></div><div><label>수량 (kg)</label><input name="qty" value="${esc(row.qty||'')}"></div><div><label>요청 납기일</label><input type="date" name="due" value="${esc(clean(meta.requestedDue)||clean(row.due))}"></div><div><label>납품처</label><input name="deliveryPlace" value="${esc(meta.deliveryPlace||row.deliveryPlace||'')}"></div><div><label>포장형태</label><select name="packagingType"><option value="">선택</option><option ${clean(pack.type)==='CAN'?'selected':''}>CAN</option><option ${clean(pack.type)==='DRUM'?'selected':''}>DRUM</option><option ${clean(pack.type)==='IBC'?'selected':''}>IBC</option><option ${clean(pack.type)==='기타'?'selected':''}>기타</option></select></div><div><label>단위 포장량 (kg)</label><input type="number" name="unitWeight" value="${esc(pack.unitWeight??'')}"></div><div><label>포장수량 (EA)</label><input type="number" name="packageQty" value="${esc(pack.packageQty??'')}"></div><div class="wide"><label>비고</label><input name="remarks" value="${esc(remarks)}"></div></div><div class="actions"><button type="button" class="cancel" data-v17-close="1">취소</button><button type="submit" class="save">수정 저장</button></div></form></div>`;
    m.__salesRow={...row,key};document.body.appendChild(m);return true;
  }

  async function saveForm(form){
    const modal=document.getElementById(MODAL_ID),row=modal?.__salesRow;if(!row)return;
    const fd=new FormData(form),get=n=>clean(fd.get(n)),qty=num(get('qty')),unit=num(get('unitWeight')),count=num(get('packageQty')),type=get('packagingType');
    const key=clean(row.key)||rowKey(row),originId=clean(row.id),newId=get('salesOrderId'),product=get('product');
    if(!newId||!get('customer')||!product||qty<=0){alert('수주번호·고객사·제품·수량을 확인하세요.');return;}
    if(rows().some(other=>rowKey(other)!==key&&visibleId(other)===newId)){alert('이미 다른 수주에서 사용 중인 수주번호입니다.');return;}

    const mm=readMap(META_KEY),pm=readMap(PACK_KEY),rm=readMap(REMARK_KEY),now=new Date().toISOString(),prev=mm[key]||mm[originId]||row.orderMeta||{};
    const meta={...prev,salesOrderIdOverride:newId,customerOverride:get('customer'),productOverride:product,qtyOverride:qty,requestedDue:get('due'),customerItemCode:get('customerItemCode'),deliveryPlace:get('deliveryPlace'),orderType:get('orderType')||'양산',savedAt:now};
    delete meta.poOverride;mm[key]=meta;if(originId&&originId!==key)delete mm[originId];write(META_KEY,mm);

    if(type||unit||count){if(!type||unit<=0||count<=0){alert('포장정보를 모두 입력하세요.');return;}pm[key]={type,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now};}else delete pm[key];write(PACK_KEY,pm);
    const remarks=get('remarks');if(remarks)rm[key]=remarks;else delete rm[key];write(REMARK_KEY,rm);

    const list=rows(),idx=list.findIndex(r=>rowKey(r)===key||clean(r.id)===originId);
    if(idx>=0){list[idx]={...list[idx],customer:get('customer'),product,qty,due:get('due'),customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,orderMeta:meta};write(SALES_KEY,list);}
    if(typeof window.qmesSalesSyncProductToWorkOrder==='function'){try{await window.qmesSalesSyncProductToWorkOrder(key,product);}catch(_){}}
    if(typeof window.qmesSalesFromWorkOrderApply==='function'){try{await window.qmesSalesFromWorkOrderApply();}catch(_){}}
    close();syncUi();setTimeout(syncUi,120);
  }

  function handleClick(event){
    const target=event.target;if(!(target instanceof Element))return;
    const button=target.closest('button');
    if(button&&clean(button.textContent)==='수정'){
      const table=button.closest('table');
      if(isSalesTable(table)){
        const row=rowFromButton(button);
        event.preventDefault();event.stopImmediatePropagation();
        if(row)open(row);
        return;
      }
    }
    if(target.closest('[data-v17-close]')){event.preventDefault();close();return;}
    if(target===document.getElementById(MODAL_ID))close();
  }

  document.addEventListener('click',handleClick,true);
  document.addEventListener('submit',event=>{const form=event.target instanceof Element?event.target.closest('[data-v17-form="1"]'):null;if(!form)return;event.preventDefault();event.stopImmediatePropagation();saveForm(form);},true);
  window.addEventListener('qmes:erp-data-changed',()=>setTimeout(syncUi,0));
  ensureStyle();syncUi();
  window.qmesSalesEditV17={open,close,syncUi};
})();