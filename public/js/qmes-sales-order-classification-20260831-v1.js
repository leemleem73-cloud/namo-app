/* NAMO QMES - Sales order classification patch - 2026-08-31
 * ADD-ONLY patch.
 * Business rule:
 *   product category = 절연 슬러리
 *   order type       = 양산 / 샘플 / 개발
 *   urgent           = independent checkbox
 * Existing product field remains the actual product code/item (e.g. DBA1501).
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ORDER_CLASSIFICATION_20260831_V1__) return;
  window.__QMES_SALES_ORDER_CLASSIFICATION_20260831_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const DRAFT_KEY="qmes-sales-order-classification-draft-v1";
  const STYLE_ID="qmes-sales-order-classification-style-20260831-v1";
  const CATEGORY="절연 슬러리";
  const TYPES=["양산","샘플","개발"];
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const readMap=key=>{const value=read(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-sales-classification-field .qsc-fixed{background:#f7f9fc!important;color:#334155!important;font-weight:800!important}
      .qmes-sales-classification-field .qsc-urgent-wrap{height:38px!important;display:flex!important;align-items:center!important;gap:8px!important;padding:0 10px!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important}
      .qmes-sales-classification-field .qsc-urgent-wrap input[type="checkbox"]{appearance:auto!important;-webkit-appearance:checkbox!important;width:15px!important;height:15px!important;min-width:15px!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;background:none!important}
      #qmes-sales-new-order-namo-20260828-v4 .qmes-sales-classification-field .qsc-urgent-wrap{height:38px!important;border-color:#d5dde8!important;font-size:11.5px!important}
    `;
    document.head.appendChild(style);
  }

  function optionHtml(selected){
    return TYPES.map(type=>`<option value="${type}"${type===selected?' selected':''}>${type}</option>`).join("");
  }

  function restoreValues(form){
    const saved=read(DRAFT_KEY,{});
    if(form.elements.productCategory) form.elements.productCategory.value=CATEGORY;
    const type=clean(saved.orderType);
    if(form.elements.orderType) form.elements.orderType.value=TYPES.includes(type)?type:(TYPES.includes(clean(form.elements.orderType.value))?form.elements.orderType.value:"양산");
    if(form.elements.urgent) form.elements.urgent.checked=Boolean(saved.urgent);
  }

  function patchV5(modal){
    if(!modal||modal.dataset.qmesSalesClassification==="1") return;
    const form=modal.querySelector("form");
    if(!form) return;
    const productInput=form.elements.product;
    const productField=productInput?.closest(".nm-field");
    if(productField){
      const label=productField.querySelector("label");
      if(label) label.textContent="제품코드 *";
      const categoryField=document.createElement("div");
      categoryField.className="nm-field qmes-sales-classification-field";
      categoryField.innerHTML=`<label>제품군</label><input class="qsc-fixed" name="productCategory" value="${CATEGORY}" readonly>`;
      productField.parentNode?.insertBefore(categoryField,productField);
    }

    const firstGrid=form.querySelector(".nm-grid4");
    if(firstGrid){
      const typeField=document.createElement("div");
      typeField.className="nm-field qmes-sales-classification-field";
      typeField.innerHTML=`<label>수주구분 *</label><select name="orderType">${optionHtml("양산")}</select>`;
      const urgentField=document.createElement("div");
      urgentField.className="nm-field qmes-sales-classification-field";
      urgentField.innerHTML=`<label>긴급 여부</label><label class="qsc-urgent-wrap"><input type="checkbox" name="urgent"> 긴급 수주</label>`;
      firstGrid.append(typeField,urgentField);
    }
    modal.dataset.qmesSalesClassification="1";
    restoreValues(form);
  }

  function patchV4(modal){
    if(!modal||modal.dataset.qmesSalesClassification==="1") return;
    const form=modal.querySelector("form");
    if(!form) return;
    const productInput=form.elements.product;
    const productField=productInput?.closest(".nv4-field");
    if(productField){
      const label=productField.querySelector("label");
      if(label) label.innerHTML='제품코드 <span class="nv4-req">*</span>';
      const categoryField=document.createElement("div");
      categoryField.className="nv4-field qmes-sales-classification-field";
      categoryField.innerHTML=`<label>제품군</label><input class="qsc-fixed" name="productCategory" value="${CATEGORY}" readonly>`;
      productField.parentNode?.insertBefore(categoryField,productField);
    }

    let orderType=form.elements.orderType;
    if(orderType){
      orderType.innerHTML=optionHtml(TYPES.includes(clean(orderType.value))?clean(orderType.value):"양산");
      const wrapper=orderType.closest(".nv4-field");
      const urgentField=document.createElement("div");
      urgentField.className="nv4-field qmes-sales-classification-field";
      urgentField.innerHTML=`<label>긴급 여부</label><label class="qsc-urgent-wrap"><input type="checkbox" name="urgent"> 긴급 수주</label>`;
      wrapper?.parentNode?.insertBefore(urgentField,wrapper.nextSibling);
    }
    modal.dataset.qmesSalesClassification="1";
    restoreValues(form);
  }

  function scan(root=document){
    ensureStyle();
    const v5=root.querySelector?.("#qmes-sales-new-order-modal-v5")||document.getElementById("qmes-sales-new-order-modal-v5");
    if(v5) patchV5(v5);
    const v4=root.querySelector?.("#qmes-sales-new-order-namo-20260828-v4")||document.getElementById("qmes-sales-new-order-namo-20260828-v4");
    if(v4) patchV4(v4);
  }

  function formFromButton(button){
    return button?.closest?.("#qmes-sales-new-order-modal-v5,#qmes-sales-new-order-namo-20260828-v4")?.querySelector("form")||null;
  }

  function snapshot(form){
    if(!form) return null;
    return {
      id:clean(form.elements.salesOrderId?.value),
      customer:clean(form.elements.customer?.value),
      product:clean(form.elements.product?.value),
      productCategory:CATEGORY,
      orderType:TYPES.includes(clean(form.elements.orderType?.value))?clean(form.elements.orderType.value):"양산",
      urgent:Boolean(form.elements.urgent?.checked),
      capturedAt:new Date().toISOString()
    };
  }

  let pending=null;
  function remember(form,isDraft){
    const data=snapshot(form);
    if(!data) return;
    write(DRAFT_KEY,{orderType:data.orderType,urgent:data.urgent});
    if(!isDraft) pending=data;
  }

  async function persistPending(){
    const data=pending;
    if(!data||!data.id) return;
    pending=null;
    const rows=read(SALES_KEY,[]);
    if(!Array.isArray(rows)) return;
    const metaMap=readMap(META_KEY);
    let changed=false;
    const next=rows.map(row=>{
      const raw=clean(row?.id),key=clean(row?.workOrder)||raw,meta=metaMap[key]||metaMap[raw]||row?.orderMeta||{};
      const shown=clean(meta.salesOrderIdOverride)||raw;
      if(data.id!==raw&&data.id!==shown&&data.id!==key) return row;
      const nextMeta={...meta,productCategory:CATEGORY,orderType:data.orderType,urgent:data.urgent,savedAt:new Date().toISOString(),classificationSource:"NAMO_SALES_CLASSIFICATION_V1"};
      if(key) metaMap[key]=nextMeta;
      if(raw) metaMap[raw]=nextMeta;
      if(shown) metaMap[shown]=nextMeta;
      changed=true;
      return {...row,productCategory:CATEGORY,orderType:data.orderType,urgent:data.urgent,orderMeta:nextMeta};
    });
    if(!changed) return;
    write(SALES_KEY,next);
    write(META_KEY,metaMap);
    if(typeof window.qmesSyncUpsert==="function"){
      try{
        await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:new Date().toISOString(),source:"NAMO_SALES_CLASSIFICATION_V1"});
      }catch(error){console.warn("[Sales Classification] shared save failed",error?.message||error);}
    }
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",source:"NAMO_SALES_CLASSIFICATION_V1",id:data.id}}));
  }

  document.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element)) return;
    const save=target.closest("[data-nm-save],[data-nv4-submit]");
    if(save){remember(formFromButton(save),false);setTimeout(persistPending,120);setTimeout(persistPending,500);return;}
    const draft=target.closest("[data-nm-draft],[data-nv4-draft]");
    if(draft) remember(formFromButton(draft),true);
  },true);

  window.addEventListener("qmes:erp-data-changed",event=>{
    if(event?.detail?.source==="NAMO_SALES_CLASSIFICATION_V1") return;
    if(pending){setTimeout(persistPending,0);setTimeout(persistPending,180);}
  });

  ensureStyle();scan();
  const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType!==1)return;
    if(node.matches?.("#qmes-sales-new-order-modal-v5"))patchV5(node);
    if(node.matches?.("#qmes-sales-new-order-namo-20260828-v4"))patchV4(node);
    scan(node);
  })));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.qmesSalesOrderClassification={scan};
})();
