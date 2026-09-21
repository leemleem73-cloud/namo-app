/* NAMO QMES - Sales edit modal FORCE V2 - 2026-08-27
 * Window-capture owner for Sales edit modal.
 * KPI sync is event-driven only to prevent visible flicker.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_MODAL_FORCE_V2__) return;
  window.__QMES_SALES_EDIT_MODAL_FORCE_V2__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const MODAL_ID="qmes-sales-edit-force-v2";

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const number=value=>{const parsed=Number(String(value==null?"":value).replace(/[^0-9.+-]/g,""));return Number.isFinite(parsed)?parsed:0;};
  const escapeHtml=value=>String(value==null?"":value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_error){}};
  const readMap=key=>{const value=read(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};
  const salesRows=()=>{const value=read(SALES_KEY,[]);return Array.isArray(value)?value:[];};
  const shippingRows=()=>{const value=read(SHIPPING_KEY,[]);return Array.isArray(value)?value:[];};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=row=>{const map=readMap(META_KEY),id=clean(row?.id),key=rowKey(row);return map[key]||map[id]||row?.orderMeta||{};};
  const dueFor=row=>clean(metaFor(row).requestedDue)||clean(row?.due);
  const visibleId=row=>clean(metaFor(row).salesOrderIdOverride)||clean(row?.id);

  function tableHeaderMap(table){const headers=Array.from(table?.querySelectorAll("thead th")||[]).map(th=>clean(th.textContent));const map={};headers.forEach((name,index)=>{if(name)map[name]=index;});return map;}
  function cellText(tr,map,names){for(const name of names){const index=map[name];if(Number.isInteger(index))return clean(tr?.children?.[index]?.textContent);}return "";}
  function findStoredRow(id){const target=clean(id);if(!target)return null;return salesRows().find(row=>clean(row?.id)===target||rowKey(row)===target||visibleId(row)===target)||null;}

  function rowFromButton(button){
    const tr=button?.closest("tr"),table=button?.closest("table");if(!tr||!table)return null;
    const link=tr.querySelector("[data-qso-id],.qmes-sales-order-link");
    const candidates=[link?.getAttribute("data-qso-id"),link?.textContent,button.dataset.qmesSalesEdit,button.dataset.salesId,tr.children?.[0]?.textContent].map(clean).filter(Boolean);
    for(const candidate of candidates){const row=findStoredRow(candidate);if(row)return row;}
    const map=tableHeaderMap(table),id=candidates[0]||cellText(tr,map,["수주번호"]);
    return {id,workOrder:id,customer:cellText(tr,map,["고객사"]),po:cellText(tr,map,["고객 PO","고객PO"]),product:cellText(tr,map,["제품"]),qty:number(cellText(tr,map,["수량"])),due:"",plan:cellText(tr,map,["생산계획"]),shipping:cellText(tr,map,["출하상태"]),deliveryPlace:cellText(tr,map,["납품처"]),source:"SCREEN_FALLBACK"};
  }

  function isSalesEditButton(button){if(!button)return false;const root=button.closest(".qmes-sales-stable");if(!root)return false;return button.classList.contains("qmes-sales-edit-btn")||clean(button.textContent)==="수정";}

  function ensureStyle(){
    if(document.getElementById("qmes-sales-edit-force-v2-style"))return;
    const style=document.createElement("style");style.id="qmes-sales-edit-force-v2-style";style.textContent=`
      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.52)!important}
      #${MODAL_ID},#${MODAL_ID} *{box-sizing:border-box!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${MODAL_ID} .qsef-card{width:min(1120px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border:1px solid #d8e0e9!important;border-radius:16px!important;box-shadow:0 28px 90px rgba(15,23,42,.35)!important;color:#111827!important}
      #${MODAL_ID} .qsef-head{position:sticky!important;top:0!important;z-index:5!important;display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:16px!important;padding:18px 20px!important;border-bottom:1px solid #e2e8f0!important;background:#fff!important}
      #${MODAL_ID} h2{margin:0!important;font-size:20px!important;font-weight:950!important;color:#0f172a!important}
      #${MODAL_ID} .qsef-sub{margin-top:5px!important;font-size:11px!important;font-weight:750!important;color:#64748b!important}
      #${MODAL_ID} .qsef-body{padding:18px 20px 20px!important}
      #${MODAL_ID} .qsef-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important}
      #${MODAL_ID} .qsef-field.wide{grid-column:span 2!important}
      #${MODAL_ID} label{display:block!important;margin:0 0 5px!important;color:#475569!important;font-size:10px!important;font-weight:900!important}
      #${MODAL_ID} input,#${MODAL_ID} select{display:block!important;width:100%!important;height:39px!important;padding:0 10px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#111827!important;font-size:12px!important;font-weight:700!important}
      #${MODAL_ID} input[name="salesOrderId"]{border-color:#93c5fd!important;background:#f8fbff!important;color:#1d4ed8!important;font-weight:900!important}
      #${MODAL_ID} .qsef-error{display:none!important;margin-top:12px!important;padding:10px 12px!important;border-radius:8px!important;background:#fff1f2!important;color:#b91c1c!important;font-size:11px!important;font-weight:850!important}
      #${MODAL_ID} .qsef-error.show{display:block!important}
      #${MODAL_ID} .qsef-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:16px!important;padding-top:14px!important;border-top:1px solid #eef2f7!important}
      #${MODAL_ID} button{height:38px!important;padding:0 15px!important;border-radius:8px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .qsef-close,#${MODAL_ID} .qsef-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}
      #${MODAL_ID} .qsef-save{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important}
      @media(max-width:900px){#${MODAL_ID} .qsef-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:620px){#${MODAL_ID}{padding:7px!important;align-items:flex-start!important}#${MODAL_ID} .qsef-grid{grid-template-columns:1fr!important}#${MODAL_ID} .qsef-field.wide{grid-column:span 1!important}}
    `;document.head.appendChild(style);
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove();}
  function openModal(row){
    if(!row)return;ensureStyle();closeModal();
    const id=clean(row.id)||visibleId(row),key=rowKey(row)||id,meta=metaFor(row),packMap=readMap(PACK_KEY),remarkMap=readMap(REMARK_KEY),pack=packMap[key]||packMap[id]||row.packaging||{},remarks=clean(remarkMap[key]??remarkMap[id]??row.remarks);
    const modal=document.createElement("div");modal.id=MODAL_ID;modal.innerHTML=`<div class="qsef-card" role="dialog" aria-modal="true" aria-label="수주 수정"><div class="qsef-head"><div><h2>수주 수정</h2><div class="qsef-sub">${escapeHtml(visibleId(row)||id)} · 수주번호 포함 전체 수정 가능</div></div><button type="button" class="qsef-close">닫기</button></div><form class="qsef-body"><div class="qsef-grid"><div class="qsef-field"><label>수주번호</label><input name="salesOrderId" value="${escapeHtml(visibleId(row)||id)}" autocomplete="off"></div><div class="qsef-field"><label>고객사</label><input name="customer" value="${escapeHtml(meta.customerOverride||row.customer||"")}"></div><div class="qsef-field"><label>고객 PO</label><input name="po" value="${escapeHtml(meta.poOverride||row.po||"")}"></div><div class="qsef-field"><label>수주구분</label><select name="orderType"><option${clean(meta.orderType||row.orderType)==="양산"?" selected":""}>양산</option><option${clean(meta.orderType||row.orderType)==="개발"?" selected":""}>개발</option><option${clean(meta.orderType||row.orderType)==="샘플"?" selected":""}>샘플</option><option${clean(meta.orderType||row.orderType)==="긴급"?" selected":""}>긴급</option></select></div><div class="qsef-field"><label>제품</label><input name="product" value="${escapeHtml(meta.productOverride||row.product||"")}"></div><div class="qsef-field"><label>수량 (kg)</label><input name="qty" inputmode="decimal" value="${escapeHtml(row.qty||"")}"></div><div class="qsef-field"><label>요청 납기일</label><input type="date" name="due" value="${escapeHtml(dueFor(row))}"></div><div class="qsef-field"><label>고객 품목코드</label><input name="customerItemCode" value="${escapeHtml(meta.customerItemCode||row.customerItemCode||"")}"></div><div class="qsef-field wide"><label>납품처</label><input name="deliveryPlace" value="${escapeHtml(meta.deliveryPlace||row.deliveryPlace||"")}"></div><div class="qsef-field"><label>포장형태</label><select name="packagingType"><option value="">선택</option><option${clean(pack.type)==="CAN"?" selected":""}>CAN</option><option${clean(pack.type)==="DRUM"?" selected":""}>DRUM</option><option${clean(pack.type)==="IBC"?" selected":""}>IBC</option><option${clean(pack.type)==="기타"?" selected":""}>기타</option></select></div><div class="qsef-field"><label>단위 포장량 (kg)</label><input type="number" step="0.001" name="unitWeight" value="${escapeHtml(pack.unitWeight??pack.unitPackQty??"")}"></div><div class="qsef-field"><label>포장수량 (EA)</label><input type="number" step="1" name="packageQty" value="${escapeHtml(pack.packageQty??"")}"></div><div class="qsef-field wide"><label>비고</label><input name="remarks" value="${escapeHtml(remarks)}"></div></div><div class="qsef-error"></div><div class="qsef-actions"><button type="button" class="qsef-cancel">취소</button><button type="submit" class="qsef-save">수정 저장</button></div></form></div>`;
    modal.__salesRow={...row,__stableId:id,__stableKey:key};modal.addEventListener("click",event=>{if(event.target===modal||event.target.closest(".qsef-close,.qsef-cancel"))closeModal();});modal.querySelector("form").addEventListener("submit",saveModal);document.body.appendChild(modal);setTimeout(()=>modal.querySelector('[name="salesOrderId"]')?.focus(),0);
  }

  async function saveModal(event){
    event.preventDefault();const form=event.currentTarget,modal=document.getElementById(MODAL_ID),row=modal?.__salesRow;if(!row)return;
    const data=new FormData(form),get=name=>clean(data.get(name)),salesOrderId=get("salesOrderId"),qty=number(get("qty")),unit=number(get("unitWeight")),count=number(get("packageQty")),packType=get("packagingType"),error=form.querySelector(".qsef-error"),fail=message=>{if(error){error.textContent=message;error.classList.add("show");}return false;};
    if(!salesOrderId||!get("customer")||!get("product")||qty<=0)return fail("수주번호·고객사·제품·수량을 확인하세요.");
    const id=clean(row.__stableId)||clean(row.id),key=clean(row.__stableKey)||rowKey(row)||id;
    const duplicate=salesRows().some(item=>rowKey(item)!==key&&(clean(item.id)===salesOrderId||visibleId(item)===salesOrderId));
    if(duplicate)return fail("이미 사용 중인 수주번호입니다. 다른 번호를 입력하세요.");
    const packTouched=Boolean(packType||unit||count);if(packTouched&&(!packType||unit<=0||count<=0))return fail("포장정보는 포장형태·단위 포장량·포장수량을 모두 입력하세요.");
    const now=new Date().toISOString(),metaMap=readMap(META_KEY),packMap=readMap(PACK_KEY),remarkMap=readMap(REMARK_KEY),previous=metaMap[key]||metaMap[id]||row.orderMeta||{},nextMeta={...previous,salesOrderIdOverride:salesOrderId,customerOverride:get("customer"),poOverride:get("po")||"-",productOverride:get("product"),qtyOverride:qty,requestedDue:get("due"),customerItemCode:get("customerItemCode"),deliveryPlace:get("deliveryPlace"),orderType:get("orderType")||"양산",savedAt:now};
    if(id&&id!==key&&id!==salesOrderId)delete metaMap[id];metaMap[key]=nextMeta;metaMap[salesOrderId]=nextMeta;write(META_KEY,metaMap);
    if(packTouched){const packaging={type:packType,unitWeight:unit,packageQty:count,total:Number((unit*count).toFixed(3)),savedAt:now};packMap[key]=packaging;packMap[salesOrderId]=packaging;if(id&&id!==key&&id!==salesOrderId)delete packMap[id];}else{delete packMap[key];delete packMap[id];delete packMap[salesOrderId];}write(PACK_KEY,packMap);
    const remarks=get("remarks");if(remarks){remarkMap[key]=remarks;remarkMap[salesOrderId]=remarks;if(id&&id!==key&&id!==salesOrderId)delete remarkMap[id];}else{delete remarkMap[key];delete remarkMap[id];delete remarkMap[salesOrderId];}write(REMARK_KEY,remarkMap);
    const list=salesRows(),index=list.findIndex(item=>rowKey(item)===key||clean(item.id)===id),packaging=packTouched?packMap[key]:null,updated={...(index>=0?list[index]:row),id:salesOrderId,workOrder:key,customer:get("customer"),po:get("po")||"-",product:get("product"),qty,due:get("due"),customerItemCode:nextMeta.customerItemCode,deliveryPlace:nextMeta.deliveryPlace,orderType:nextMeta.orderType,orderMeta:nextMeta,packaging,packagingType:packaging?.type||"",unitPackQty:packaging?.unitWeight||0,packageQty:packaging?.packageQty||0,remarks};
    if(index>=0)list[index]=updated;else list.unshift(updated);write(SALES_KEY,list);
    if(typeof window.qmesSyncUpsert==="function"){try{await window.qmesSyncUpsert("inventory","erp:sales",{module:"erp",schema:1,kind:"sales",rows:list,updatedAt:now,updatedBy:clean(window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__?.name||"")});}catch(error){console.warn("[QMES Sales Edit Force V2] shared save failed",error);}}
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_EDIT_FORCE_V2"}}));closeModal();setTimeout(()=>location.reload(),120);
  }

  function dueTime(row){const due=dueFor(row);if(!/^20\d{2}-\d{2}-\d{2}$/.test(due))return null;const time=new Date(due+"T00:00:00").getTime();return Number.isFinite(time)?time:null;}
  function dueCompliance(){
    const sales=salesRows(),ship=shippingRows(),samples=[];
    sales.forEach(order=>{const due=dueTime(order);if(due===null)return;const id=clean(order.id),shown=visibleId(order),matched=ship.find(item=>clean(item.sales)===id||clean(item.sales)===shown),delivery=clean(matched?.delivery||matched?.status||"");if(!/출하완료|납품완료|배송완료|출고완료/.test(delivery))return;const actual=clean(matched?.actualDate||matched?.shipDate||matched?.date);if(!/^20\d{2}-\d{2}-\d{2}$/.test(actual))return;samples.push(new Date(actual+"T00:00:00").getTime()<=due);});
    if(!samples.length)return null;return samples.filter(Boolean).length/samples.length*100;
  }

  function syncKpis(){
    const root=document.querySelector(".qmes-sales-stable");if(!root)return;
    const compliance=dueCompliance();
    root.querySelectorAll(".qerp-kpi").forEach(card=>{const label=clean(card.querySelector("span")?.textContent),value=card.querySelector("b");if(!value)return;if(label==="납기 준수율"){const next=compliance==null?"-":compliance.toFixed(1)+"%";if(clean(value.textContent)!==next)value.textContent=next;card.title=compliance==null?"출하완료 실적이 없어 납기 준수율을 산정하지 않습니다.":"출하완료 실적의 실제 출하일과 요청 납기일을 비교해 산정합니다.";}});
  }

  window.addEventListener("click",event=>{const target=event.target;if(!(target instanceof Element))return;const button=target.closest("button");if(!isSalesEditButton(button))return;const row=rowFromButton(button);event.preventDefault();event.stopImmediatePropagation();if(row)openModal(row);else window.alert("수주 데이터를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.");},true);
  const start=()=>{ensureStyle();syncKpis();};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.addEventListener("qmes:erp-runtime-loaded",()=>setTimeout(syncKpis,0));
  window.addEventListener("qmes:erp-data-changed",()=>setTimeout(syncKpis,0));
  window.addEventListener("storage",event=>{if([SALES_KEY,SHIPPING_KEY,META_KEY].includes(event.key))setTimeout(syncKpis,0);});
  setTimeout(syncKpis,500);
})();
