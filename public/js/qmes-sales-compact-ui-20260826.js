/* NAMO QMES - Sales direct stable controller V18 - 2026-08-27
 * Single directly-loaded owner for Sales edit modal.
 * No secondary loader, no MutationObserver, no DOM column deletion.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DIRECT_STABLE_V18__)return;
  window.__QMES_SALES_DIRECT_STABLE_V18__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const MODAL_ID="qmes-sales-edit-direct-v18";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);

  function metaFor(row){
    const map=readMap(META_KEY),key=rowKey(row),id=clean(row?.id);
    return map[key]||map[id]||row?.orderMeta||{};
  }
  function visibleId(row){return clean(metaFor(row).salesOrderIdOverride)||clean(row?.id);}
  function findRow(id){
    const target=clean(id);
    if(!target)return null;
    return rows().find(row=>clean(row?.id)===target||rowKey(row)===target||visibleId(row)===target)||null;
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-direct-v18-style"))return;
    const style=document.createElement("style");
    style.id="qmes-sales-direct-v18-style";
    style.textContent=`
      .qmes-sales-stable .qerp-sales-compact-form .qmes-sales-po-field-v18{display:none!important}
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(15,23,42,.46)!important}
      #${MODAL_ID} .card{width:min(1120px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border:1px solid #d9e1ea!important;border-radius:16px!important;box-shadow:0 28px 90px rgba(15,23,42,.32)!important}
      #${MODAL_ID} .head{position:sticky!important;top:0!important;z-index:2!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;padding:18px 20px!important;border-bottom:1px solid #e2e8f0!important;background:#fff!important}
      #${MODAL_ID} h2{margin:0!important;font-size:20px!important;font-weight:950!important;color:#0f172a!important}
      #${MODAL_ID} .sub{margin-top:4px!important;color:#64748b!important;font-size:11px!important;font-weight:700!important}
      #${MODAL_ID} .body{padding:18px 20px 22px!important}
      #${MODAL_ID} .status,#${MODAL_ID} .grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px 12px!important;margin-bottom:16px!important}
      #${MODAL_ID} .status>div{padding:10px 12px!important;border:1px solid #e2e8f0!important;border-radius:9px!important;background:#f8fafc!important;min-height:58px!important}
      #${MODAL_ID} .status b{display:block!important;margin-bottom:5px!important;font-size:9px!important;font-weight:900!important;color:#64748b!important}
      #${MODAL_ID} .status span{display:block!important;font-size:12px!important;font-weight:850!important;color:#0f172a!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #${MODAL_ID} label{display:block!important;margin-bottom:5px!important;font-size:10px!important;font-weight:900!important;color:#475569!important}
      #${MODAL_ID} input,#${MODAL_ID} select{box-sizing:border-box!important;width:100%!important;height:38px!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:12px!important}
      #${MODAL_ID} .sales-id{font-weight:900!important;color:#1d4ed8!important;background:#f8fbff!important;border-color:#93c5fd!important}
      #${MODAL_ID} .wide{grid-column:1/-1!important}
      #${MODAL_ID} .error{display:none!important;margin:0 0 12px!important;padding:9px 11px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:11px!important;font-weight:850!important}
      #${MODAL_ID} .error.show{display:block!important}
      #${MODAL_ID} .actions{display:flex!important;justify-content:flex-end!important;gap:8px!important}
      #${MODAL_ID} button{height:38px!important;padding:0 14px!important;border-radius:8px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
      #${MODAL_ID} .close,#${MODAL_ID} .cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}
      @media(max-width:900px){#${MODAL_ID} .status,#${MODAL_ID} .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:620px){#${MODAL_ID}{padding:8px!important;align-items:flex-start!important}#${MODAL_ID} .status,#${MODAL_ID} .grid{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function tagLegacyPoField(){
    document.querySelectorAll('.qmes-sales-stable .qerp-sales-compact-form .qerp-field').forEach(field=>{
      const label=clean(field.querySelector('label')?.textContent);
      if(label==='고객 PO'||label==='고객 PO 번호')field.classList.add('qmes-sales-po-field-v18');
    });
  }

  function isSalesTable(table){
    if(!table)return false;
    const headers=Array.from(table.querySelectorAll('thead th')).map(th=>clean(th.textContent));
    return headers[0]==='수주번호'&&headers.includes('고객사')&&headers.includes('제품')&&headers.includes('비고');
  }

  function fallbackRow(tr){
    const c=i=>clean(tr?.children?.[i]?.textContent);
    const link=tr?.querySelector('[data-qso-id],.qmes-sales-order-link');
    const stableId=clean(link?.getAttribute('data-qso-id')||tr?.querySelector('.qmes-sales-edit-btn')?.dataset?.qmesSalesEdit||c(0));
    return {
      id:stableId||c(0),
      workOrder:stableId||c(0),
      customer:c(1),
      product:c(2),
      qty:num(c(3)),
      due:'',
      plan:c(7),
      shipping:c(8),
      deliveryPlace:c(9),
      source:'SCREEN'
    };
  }

  function rowFromButton(button){
    const tr=button?.closest('tr');if(!tr)return null;
    const link=tr.querySelector('[data-qso-id],.qmes-sales-order-link');
    const candidates=[
      button.dataset.qmesSalesEdit,
      button.dataset.salesId,
      link?.getAttribute('data-qso-id'),
      link?.textContent,
      tr.children?.[0]?.textContent
    ].map(clean).filter(Boolean);
    for(const id of candidates){const row=findRow(id);if(row)return row;}
    return fallbackRow(tr);
  }

  function syncVisibleIds(){
    tagLegacyPoField();
    document.querySelectorAll('table.qerp-table').forEach(table=>{
      if(!isSalesTable(table))return;
      table.querySelectorAll('tbody tr').forEach(tr=>{
        const link=tr.querySelector('[data-qso-id],.qmes-sales-order-link');if(!link)return;
        const stable=clean(link.getAttribute('data-qso-id'));
        const shown=clean(link.textContent);
        const row=findRow(stable)||findRow(shown);if(!row)return;
        const next=visibleId(row);
        if(next&&shown!==next)link.textContent=next;
        /* Never rewrite data-qso-id; React uses it as stable identity. */
      });
    });
  }

  function close(){document.getElementById(MODAL_ID)?.remove();}

  function open(row){
    if(!row)return false;
    ensureStyle();close();
    const id=visibleId(row)||clean(row.id),key=rowKey(row),meta=metaFor(row);
    const packMap=readMap(PACK_KEY),remarkMap=readMap(REMARK_KEY);
    const pack=packMap[key]||packMap[clean(row.id)]||row.packaging||{};
    const remarks=clean(remarkMap[key]??remarkMap[clean(row.id)]??row.remarks);
    const modal=document.createElement('div');modal.id=MODAL_ID;
    modal.innerHTML=`<div class="card" role="dialog" aria-modal="true" aria-label="수주 전체 수정"><div class="head"><div><h2>수주 전체 수정</h2><div class="sub">${esc(id)} · 작업지시/LOT ${esc(key||'-')}</div></div><button type="button" class="close" data-sales-v18-close="1">닫기</button></div><form class="body" data-sales-v18-form="1"><div class="status"><div><b>현재 수주번호</b><span>${esc(id)}</span></div><div><b>작업지시 / 생산 LOT</b><span>${esc(key||'-')}</span></div><div><b>생산계획</b><span>${esc(row.plan||'-')}</span></div><div><b>출하상태</b><span>${esc(row.shipping||'-')}</span></div></div><div class="grid"><div><label>수주번호</label><input class="sales-id" name="salesOrderId" value="${esc(id)}" autocomplete="off"></div><div><label>고객사</label><input name="customer" value="${esc(row.customer||'')}"></div><div><label>고객 품목코드</label><input name="customerItemCode" value="${esc(meta.customerItemCode||row.customerItemCode||'')}"></div><div><label>수주구분</label><select name="orderType"><option ${clean(meta.orderType||row.orderType)==='양산'?'selected':''}>양산</option><option ${clean(meta.orderType||row.orderType)==='개발'?'selected':''}>개발</option><option ${clean(meta.orderType||row.orderType)==='샘플'?'selected':''}>샘플</option><option ${clean(meta.orderType||row.orderType)==='긴급'?'selected':''}>긴급</option></select></div><div><label>제품</label><input name="product" value="${esc(row.product||'')}"></div><div><label>수량 (kg)</label><input name="qty" value="${esc(row.qty||'')}"></div><div><label>요청 납기일</label><input type="date" name="due" value="${esc(clean(meta.requestedDue)||clean(row.due))}"></div><div><label>납품처</label><input name="deliveryPlace" value="${esc(meta.deliveryPlace||row.deliveryPlace||'')}"></div><div><label>포장형태</label><select name="packagingType"><option value="">선택</option><option ${clean(pack.type)==='CAN'?'selected':''}>CAN</option><option ${clean(pack.type)==='DRUM'?'selected':''}>DRUM</option><option ${clean(pack.type)==='IBC'?'selected':''}>IBC</option><option ${clean(pack.type)==='기타'?'selected':''}>기타</option></select></div><div><label>단위 포장량 (kg)</label><input type="number" step="0.001" name="unitWeight" value="${esc(pack.unitWeight??pack.unitPackQty??'')}"></div><div><label>포장수량 (EA)</label><input type="number" step="1" name="packageQty" value="${esc(pack.packageQty??'')}"></div><div class="wide"><label>비고</label><input name="remarks" value="${esc(remarks)}"></div></div><div class="error" data-sales-v18-error="1"></div><div class="actions"><button type="button" class="cancel" data-sales-v18-close="1">취소</button><button type="submit" class="save">수정 저장</button></div></form></div>`;
    modal.__salesRow={...row,key};
    document.body.appendChild(modal);
    modal.querySelector('[name="salesOrderId"]')?.focus();
    return true;
  }

  async function saveForm(form){
    const modal=document.getElementById(MODAL_ID),row=modal?.__salesRow;if(!row)return;
    const fd=new FormData(form),get=name=>clean(fd.get(name));
    const qty=num(get('qty')),unit=num(get('unitWeight')),count=num(get('packageQty')),type=get('packagingType');
    const key=clean(row.key)||rowKey(row),originId=clean(row.id),newId=get('salesOrderId'),product=get('product');
    const error=form.querySelector('[data-sales-v18-error]');
    const fail=message=>{if(error){error.textContent=message;error.classList.add('show');}return false;};
    if(!newId||!get('customer')||!product||qty<=0)return fail('수주번호·고객사·제품·수량을 확인하세요.');
    if(rows().some(other=>rowKey(other)!==key&&visibleId(other)===newId))return fail('이미 다른 수주에서 사용 중인 수주번호입니다.');

    const metaMap=readMap(META_KEY),packMap=readMap(PACK_KEY),remarkMap=readMap(REMARK_KEY),now=new Date().toISOString();
    const prev=metaMap[key]||metaMap[originId]||row.orderMeta||{};
    const meta={...prev,salesOrderIdOverride:newId,customerOverride:get('customer'),productOverride:product,qtyOverride:qty,requestedDue:get('due'),customerItemCode:get('customerItemCode'),deliveryPlace:get('deliveryPlace'),orderType:get('orderType')||'양산',savedAt:now};
    delete meta.poOverride;
    metaMap[key]=meta;
    if(originId&&originId!==key)delete metaMap[originId];
    write(META_KEY,metaMap);

    if(type||unit||count){
      if(!type||unit<=0||count<=0)return fail('포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.');
      packMap[key]={type,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now};
    }else delete packMap[key];
    write(PACK_KEY,packMap);

    const remarks=get('remarks');
    if(remarks)remarkMap[key]=remarks;else delete remarkMap[key];
    write(REMARK_KEY,remarkMap);

    const list=rows(),index=list.findIndex(item=>rowKey(item)===key||clean(item.id)===originId);
    const updated={...row,workOrder:key,customer:get('customer'),product,qty,due:get('due'),customerItemCode:meta.customerItemCode,deliveryPlace:meta.deliveryPlace,orderType:meta.orderType,orderMeta:meta,remarks};
    if(index>=0)list[index]=updated;else list.unshift(updated);
    write(SALES_KEY,list);

    if(typeof window.qmesSalesSyncProductToWorkOrder==='function'&&key){try{await window.qmesSalesSyncProductToWorkOrder(key,product);}catch(_){}}
    if(typeof window.qmesSalesFromWorkOrderApply==='function'){try{await window.qmesSalesFromWorkOrderApply();}catch(_){}}
    window.dispatchEvent(new CustomEvent('qmes:erp-data-changed',{detail:{kind:'sales',source:'SALES_DIRECT_V18'}}));
    close();
    syncVisibleIds();
    setTimeout(syncVisibleIds,120);
  }

  document.addEventListener('click',event=>{
    const target=event.target;if(!(target instanceof Element))return;
    const button=target.closest('button');
    if(button&&(button.classList.contains('qmes-sales-edit-btn')||clean(button.textContent)==='수정')){
      const tr=button.closest('tr'),table=button.closest('table');
      if(tr&&isSalesTable(table)){
        const row=rowFromButton(button);
        event.preventDefault();
        event.stopImmediatePropagation();
        open(row);
        return;
      }
    }
    if(target.closest('[data-sales-v18-close]')){event.preventDefault();close();return;}
    if(target===document.getElementById(MODAL_ID))close();
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target instanceof Element?event.target.closest('[data-sales-v18-form="1"]'):null;if(!form)return;
    event.preventDefault();event.stopImmediatePropagation();saveForm(form);
  },true);

  window.addEventListener('qmes:erp-data-changed',()=>setTimeout(syncVisibleIds,0));
  window.addEventListener('qmes:mes-master-ready',()=>setTimeout(syncVisibleIds,0),{once:true});

  ensureStyle();syncVisibleIds();
  let tries=0;const timer=setInterval(()=>{tries+=1;syncVisibleIds();if(tries>=10)clearInterval(timer);},300);
  window.qmesSalesEditDirectV18={open,close,syncVisibleIds};
})();
