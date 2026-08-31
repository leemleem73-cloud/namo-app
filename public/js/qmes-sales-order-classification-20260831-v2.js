/* NAMO QMES - Sales order classification visible owner V2 - 2026-08-31
 * ADD-ONLY patch. Does not replace existing sales-order implementations.
 * Applies to every visible "신규 수주 등록" modal, including legacy/simple owners.
 * Business rule:
 *   제품군 = 절연 슬러리 (fixed)
 *   제품   = actual product code / grade (e.g. DBA1501)
 *   수주구분 = 양산 / 샘플 / 개발
 *   긴급 여부 = independent checkbox
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ORDER_CLASSIFICATION_20260831_V2__) return;
  window.__QMES_SALES_ORDER_CLASSIFICATION_20260831_V2__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const DRAFT_KEY="qmes-sales-order-classification-draft-v2";
  const CATEGORY="절연 슬러리";
  const STYLE_ID="qmes-sales-order-classification-visible-style-20260831-v2";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-sales-classification-v2{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:12px!important;margin:0 0 13px!important;padding:12px!important;border:1px solid #dbe4ef!important;border-radius:10px!important;background:#f8fbff!important}
      .qmes-sales-classification-v2 .qsc2-field{min-width:0!important}
      .qmes-sales-classification-v2 .qsc2-label{display:block!important;margin:0 0 5px!important;color:#59667a!important;font-size:10px!important;font-weight:900!important}
      .qmes-sales-classification-v2 input,.qmes-sales-classification-v2 select{width:100%!important;height:38px!important;padding:0 10px!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#172033!important;-webkit-text-fill-color:#172033!important;font:inherit!important;font-size:11px!important;box-sizing:border-box!important;outline:none!important}
      .qmes-sales-classification-v2 input[readonly]{background:#eef4fb!important;color:#24446b!important;-webkit-text-fill-color:#24446b!important;font-weight:900!important}
      .qmes-sales-classification-v2 .qsc2-urgent{height:38px!important;display:flex!important;align-items:center!important;gap:9px!important;padding:0 11px!important;border:1px solid #d4dce7!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:11px!important;font-weight:850!important;box-sizing:border-box!important}
      .qmes-sales-classification-v2 .qsc2-urgent input{appearance:auto!important;-webkit-appearance:checkbox!important;width:15px!important;height:15px!important;min-width:15px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important}
      @media(max-width:760px){.qmes-sales-classification-v2{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function candidateModal(node){
    if(!(node instanceof Element))return null;
    const direct=node.matches('[role="dialog"][aria-label="신규 수주 등록"]')?node:null;
    if(direct)return direct;
    const nested=node.querySelector?.('[role="dialog"][aria-label="신규 수주 등록"]');
    if(nested)return nested;
    const roots=[node,...Array.from(node.querySelectorAll?.("div")||[])];
    return roots.find(el=>/신규\s*수주\s*등록/.test(clean(el.textContent))&&el.querySelector?.("form")&&el.querySelectorAll?.("input").length>=4)||null;
  }

  function modalRoot(dialog){
    if(!dialog)return null;
    if(dialog.id&&/qmes-sales-new-order/.test(dialog.id))return dialog;
    let p=dialog;
    for(let i=0;i<4&&p?.parentElement;i++,p=p.parentElement){
      if(p.id&&/qmes-sales-new-order/.test(p.id))return p;
      if(p.querySelector?.("form")&&/신규\s*수주\s*등록/.test(clean(p.textContent)))return p;
    }
    return dialog;
  }

  function findLabelFor(input,form){
    if(!input)return null;
    const id=input.id;
    if(id){const byFor=form.querySelector(`label[for="${CSS.escape(id)}"]`);if(byFor)return byFor;}
    const field=input.closest(".nm-field,.nv4-field,.qerp-field,.field,.form-field,[class*='field']");
    return field?.querySelector("label")||null;
  }

  function renameProduct(form){
    const input=form.elements.product||form.elements.itemCode||form.querySelector('input[placeholder*="절연 슬러리"],input[placeholder*="제품명"],input[placeholder*="품목코드"]');
    if(!input)return;
    const label=findLabelFor(input,form);
    if(label&&/^제품\s*\*?$/.test(clean(label.textContent)))label.textContent="제품코드 *";
    if(!clean(input.placeholder)||/절연\s*슬러리|제품명|품목코드/.test(input.placeholder))input.placeholder="예: DBA1501";
  }

  function normalizeOrderTypeSelect(select,isV6){
    if(!select)return;
    const old=clean(select.value);
    select.innerHTML=isV6
      ? '<option value="양산">양산</option><option value="샘플">샘플</option><option value="개발·평가">개발</option>'
      : '<option value="양산">양산</option><option value="샘플">샘플</option><option value="개발">개발</option>';
    if(old==="샘플")select.value="샘플";
    else if(old==="개발"||old==="개발·평가")select.value=isV6?"개발·평가":"개발";
    else select.value="양산";
  }

  function insertStrip(root,form){
    let strip=root.querySelector(".qmes-sales-classification-v2");
    const isV6=Boolean(root.id==="qmes-sales-new-order-modal-v6"||root.querySelector("#qmes-sales-new-order-modal-v6"));
    let orderType=form.elements.orderType;

    if(!strip){
      strip=document.createElement("div");
      strip.className="qmes-sales-classification-v2";
      strip.innerHTML=`
        <div class="qsc2-field"><span class="qsc2-label">제품군</span><input name="productCategory" value="${CATEGORY}" readonly></div>
        <div class="qsc2-field" data-qsc2-order-wrap><span class="qsc2-label">수주구분 *</span><select name="qmesOrderType"><option value="양산">양산</option><option value="샘플">샘플</option><option value="개발">개발</option></select></div>
        <div class="qsc2-field"><span class="qsc2-label">긴급 여부</span><label class="qsc2-urgent"><input type="checkbox" name="qmesUrgent"> 긴급 수주</label></div>`;

      const body=root.querySelector(".nm-body,.nv4-body,.qerp-modal-body,.modal-body")||form;
      const note=body.querySelector(".nm-note,.nv4-note,[class*='note']");
      if(note?.nextSibling)note.parentNode.insertBefore(strip,note.nextSibling);
      else body.insertBefore(strip,body.firstChild);
    }

    const fixed=strip.querySelector('input[name="productCategory"]');if(fixed)fixed.value=CATEGORY;
    const custom=strip.querySelector('select[name="qmesOrderType"]');
    const urgent=strip.querySelector('input[name="qmesUrgent"]');
    const saved=read(DRAFT_KEY,{});

    if(orderType){
      normalizeOrderTypeSelect(orderType,isV6);
      const wrapper=strip.querySelector("[data-qsc2-order-wrap]");
      if(wrapper)wrapper.style.display="none";
      if(saved.orderType){
        if(saved.orderType==="개발")orderType.value=isV6?"개발·평가":"개발";
        else if(saved.orderType==="샘플")orderType.value="샘플";
        else orderType.value="양산";
      }
    }else if(custom){
      custom.value=["양산","샘플","개발"].includes(clean(saved.orderType))?clean(saved.orderType):"양산";
    }
    if(urgent)urgent.checked=Boolean(saved.urgent);

    renameProduct(form);
    root.dataset.qmesSalesClassificationV2="1";
  }

  function patch(root){
    ensureStyle();
    const dialog=candidateModal(root)||candidateModal(document.body);
    const modal=modalRoot(dialog);
    const form=modal?.querySelector("form");
    if(!modal||!form)return;
    insertStrip(modal,form);
  }

  function snapshot(form,root){
    const isV6=Boolean(root?.id==="qmes-sales-new-order-modal-v6");
    const rawType=clean(form.elements.orderType?.value||form.elements.qmesOrderType?.value||"양산");
    const orderType=rawType==="개발·평가"?"개발":(["양산","샘플","개발"].includes(rawType)?rawType:"양산");
    const urgent=Boolean(form.elements.qmesUrgent?.checked||form.elements.urgent?.checked);
    const data={
      id:clean(form.elements.salesOrderId?.value),
      customer:clean(form.elements.customer?.value),
      product:clean(form.elements.product?.value||form.elements.itemCode?.value),
      due:clean(form.elements.due?.value||form.elements.requestedDue?.value),
      qty:num(form.elements.qty?.value),
      productCategory:CATEGORY,orderType,urgent,capturedAt:new Date().toISOString(),isV6
    };
    write(DRAFT_KEY,{orderType,urgent});
    return data;
  }

  let pending=null;
  function matchRow(row,data,metaMap){
    const raw=clean(row?.id),key=clean(row?.workOrder)||raw,meta=metaMap[key]||metaMap[raw]||row?.orderMeta||{},shown=clean(meta.salesOrderIdOverride)||raw;
    if(data.id&&[raw,key,shown].includes(data.id))return true;
    const customer=clean(meta.customerOverride||row?.customer),product=clean(meta.productOverride||row?.product||row?.itemCode),due=clean(meta.requestedDue||row?.due),qty=num(meta.qtyOverride??row?.qty);
    return Boolean(data.customer&&data.product&&data.due&&customer===data.customer&&product===data.product&&due===data.due&&Math.abs(qty-data.qty)<0.001);
  }

  async function persist(){
    const data=pending;if(!data)return;
    const rows=read(SALES_KEY,[]);if(!Array.isArray(rows)||!rows.length)return;
    const metaMap=readMap(META_KEY);let matchedId="",changed=false;
    const next=rows.map(row=>{
      if(!matchRow(row,data,metaMap))return row;
      const raw=clean(row?.id),key=clean(row?.workOrder)||raw,meta=metaMap[key]||metaMap[raw]||row?.orderMeta||{},shown=clean(meta.salesOrderIdOverride)||raw;
      const nextMeta={...meta,productCategory:CATEGORY,orderType:data.orderType,urgent:data.urgent,savedAt:new Date().toISOString(),classificationSource:"NAMO_SALES_CLASSIFICATION_V2"};
      [key,raw,shown].filter(Boolean).forEach(k=>metaMap[k]=nextMeta);
      matchedId=shown||raw;changed=true;
      return {...row,productCategory:CATEGORY,orderType:data.orderType,urgent:data.urgent,orderMeta:nextMeta};
    });
    if(!changed)return;
    pending=null;write(SALES_KEY,next);write(META_KEY,metaMap);
    if(typeof window.qmesSyncUpsert==="function"){
      try{await window.qmesSyncUpsert("inventory","erp:sales",{module:"sales",rows:next,savedAt:new Date().toISOString(),source:"NAMO_SALES_CLASSIFICATION_V2"});}
      catch(error){console.warn("[Sales Classification V2] shared save failed",error?.message||error);}
    }
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{module:"sales",source:"NAMO_SALES_CLASSIFICATION_V2",id:matchedId}}));
  }

  document.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    const button=target.closest("button");if(!button)return;
    const root=modalRoot(button.closest('[role="dialog"][aria-label="신규 수주 등록"]')||button.closest("[id*='qmes-sales-new-order']"));
    const form=root?.querySelector("form");if(!form)return;
    const text=clean(button.textContent);
    if(button.matches("[data-nm-draft],[data-nv4-draft]")||/임시저장/.test(text)){snapshot(form,root);return;}
    if(button.matches("[data-nm-save],[data-nv4-submit]")||/수주\s*(등록|확정)/.test(text)){
      pending=snapshot(form,root);
      setTimeout(persist,120);setTimeout(persist,450);setTimeout(persist,1000);
    }
  },true);

  window.addEventListener("qmes:erp-data-changed",event=>{
    if(event?.detail?.source==="NAMO_SALES_CLASSIFICATION_V2")return;
    if(pending){setTimeout(persist,0);setTimeout(persist,250);}
  });

  ensureStyle();patch(document.body);
  let queued=false;
  const observer=new MutationObserver(records=>{
    if(queued)return;
    if(!records.some(r=>r.addedNodes.length))return;
    queued=true;requestAnimationFrame(()=>{queued=false;patch(document.body);});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.qmesSalesOrderClassificationV2={scan:()=>patch(document.body)};
})();
