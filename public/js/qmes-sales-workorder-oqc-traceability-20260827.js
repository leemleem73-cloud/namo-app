/* NAMO QMES - Sales -> Work Order -> OQC traceability hardening - 2026-08-27
 * Goals
 * 1. Keep one real Sales Order number linked 1:1 to one Work Order / finished LOT.
 * 2. Never let the shipping linkage replace the real Sales Order number with a generated SO number.
 * 3. Use requested due date + 1 calendar day as the allowed delivery window.
 * 4. Carry Sales customer / product / quantity / destination into the linked Work Order and OQC form.
 * 5. Migrate existing records safely when a legacy generated SO number exactly matches an existing Sales Order.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_WO_OQC_TRACEABILITY_20260827__) return;
  window.__QMES_SALES_WO_OQC_TRACEABILITY_20260827__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const LINK_KEY="qmes-sales-workorder-link-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const DAY=86400000;
  const originalStringify=JSON.stringify.bind(JSON);

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const num=value=>{const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const norm=value=>clean(value).toUpperCase().replace(/\s+/g,"");
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,originalStringify(value));return true;}catch(_error){return false;}};
  const readMap=key=>{const value=read(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};
  const salesRows=()=>{const value=read(SALES_KEY,[]);return Array.isArray(value)?value:[];};
  const shippingRows=()=>{const value=read(SHIPPING_KEY,[]);return Array.isArray(value)?value:[];};
  const db=()=>{try{return window.DB&&typeof window.DB==="object"?window.DB:null;}catch(_error){return null;}};

  function linkMap(){
    const value=read(LINK_KEY,{});
    return {
      bySales:value&&typeof value.bySales==="object"?value.bySales:{},
      byWorkOrder:value&&typeof value.byWorkOrder==="object"?value.byWorkOrder:{},
      updatedAt:clean(value?.updatedAt)
    };
  }

  function saveLinkMap(map){
    map.updatedAt=new Date().toISOString();
    write(LINK_KEY,map);
  }

  function metaFor(row){
    const map=readMap(META_KEY),id=clean(row?.id),workOrder=clean(row?.workOrder);
    return map[id]||map[workOrder]||row?.orderMeta||{};
  }

  function salesId(row){return clean(metaFor(row).salesOrderIdOverride)||clean(row?.id);}
  function salesProduct(row){return clean(metaFor(row).productOverride)||clean(row?.product);}
  function salesDue(row){return clean(metaFor(row).requestedDue)||clean(row?.due);}
  function salesCustomer(row){return clean(metaFor(row).customerOverride)||clean(row?.customer);}
  function salesDestination(row){return clean(metaFor(row).deliveryPlace)||clean(row?.deliveryPlace);}
  function salesQty(row){const meta=metaFor(row);return num(meta.qtyOverride??row?.qty);}

  function salesById(id){
    const key=clean(id);
    if(!key)return null;
    return salesRows().find(row=>clean(row?.id)===key||salesId(row)===key)||null;
  }

  function saleForWorkOrder(workOrder){
    const wo=clean(workOrder);if(!wo)return null;
    const rows=salesRows();
    let row=rows.find(item=>clean(item?.workOrder)===wo||clean(metaFor(item).workOrder)===wo);
    if(row)return row;
    const D=db(),doc=D?.woDocs?.[wo]||{},batch=(D?.batches||[]).find(item=>clean(item?.no)===wo)||{};
    const explicit=clean(doc.salesOrderId||batch.salesOrderId||D?.lots?.[wo]?.salesOrderId);
    if(explicit){row=rows.find(item=>salesId(item)===explicit||clean(item?.id)===explicit);if(row)return row;}
    const map=linkMap(),mapped=clean(map.byWorkOrder[wo]);
    if(mapped)return rows.find(item=>salesId(item)===mapped||clean(item?.id)===mapped)||null;
    return null;
  }

  function actualSalesIdForWorkOrder(workOrder){const row=saleForWorkOrder(workOrder);return row?salesId(row):"";}

  /* The legacy quality linkage serializes shipping rows after generating its own SO number.
   * Rewrite ONLY those shipping payloads during serialization so local/shared shipping data stores
   * the real Sales Order number. Because the transformed string is also used for equality checks,
   * this does not create a 2-second write loop.
   */
  function rewriteShippingSerialization(value){
    const mapRow=row=>{
      if(!row||typeof row!=="object"||clean(row.source)!=="WORK_ORDER_QUALITY"||!clean(row.workOrder))return row;
      const real=actualSalesIdForWorkOrder(row.workOrder);
      return real&&clean(row.sales)!==real?{...row,sales:real,salesOrderId:real}:row;
    };
    if(Array.isArray(value)&&value.some(row=>clean(row?.source)==="WORK_ORDER_QUALITY"&&clean(row?.workOrder))){
      return value.map(mapRow);
    }
    if(value&&typeof value==="object"&&String(value.kind||"").toLowerCase()==="shipping"&&Array.isArray(value.rows)){
      return {...value,rows:value.rows.map(mapRow)};
    }
    return value;
  }
  JSON.stringify=function(value,replacer,space){return originalStringify(rewriteShippingSerialization(value),replacer,space);};

  function isoDate(value){
    const match=clean(value).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    return match?`${match[1]}-${String(match[2]).padStart(2,"0")}-${String(match[3]).padStart(2,"0")}`:"";
  }
  function dateMs(value){const date=isoDate(value);if(!date)return null;const time=new Date(date+"T00:00:00").getTime();return Number.isFinite(time)?time:null;}
  function todayMs(){const date=new Date();date.setHours(0,0,0,0);return date.getTime();}
  function allowedDueMs(row){const due=dateMs(salesDue(row));return due==null?null:due+DAY;}

  function shipmentForSale(row){
    const sid=salesId(row),rawId=clean(row?.id),wo=clean(row?.workOrder)||clean(metaFor(row).workOrder);
    return shippingRows().find(ship=>{
      const shipSales=clean(ship?.sales||ship?.salesOrderId),shipWo=clean(ship?.workOrder);
      return (sid&&shipSales===sid)||(rawId&&shipSales===rawId)||(wo&&shipWo===wo);
    })||null;
  }
  function isComplete(row){
    if(/출하완료|납품완료|배송완료|출고완료/.test(clean(row?.shipping)))return true;
    const ship=shipmentForSale(row);
    return /출하완료|납품완료|배송완료|출고완료/.test(clean(ship?.delivery||ship?.status));
  }

  function dueStatus(row){
    if(isComplete(row))return {label:"완료",tone:"good"};
    const due=dateMs(salesDue(row));if(due==null)return {label:"-",tone:"neutral"};
    const today=todayMs(),allowed=due+DAY;
    if(today>allowed)return {label:`지연 ${Math.floor((today-allowed)/DAY)}일`,tone:"bad"};
    if(today===allowed)return {label:"허용 +1일",tone:"warn"};
    const days=Math.round((due-today)/DAY);
    if(days===0)return {label:"금일 납기",tone:"warn"};
    if(days>0&&days<=7)return {label:`임박 D-${days}`,tone:"warn"};
    return {label:"정상",tone:"good"};
  }

  function riskCount(){
    const today=todayMs();
    return salesRows().filter(row=>{
      if(isComplete(row))return false;
      const allowed=allowedDueMs(row);
      return (allowed!=null&&today>allowed)||/위험|지연|차단/.test(clean(row?.shipping));
    }).length;
  }

  function complianceRate(){
    const samples=[];
    salesRows().forEach(row=>{
      const due=allowedDueMs(row),ship=shipmentForSale(row);
      if(due==null||!ship||!/출하완료|납품완료|배송완료|출고완료/.test(clean(ship.delivery||ship.status)))return;
      const actual=dateMs(ship.date||ship.shipDate||ship.actualDate);
      if(actual==null)return;
      samples.push(actual<=due);
    });
    return samples.length?samples.filter(Boolean).length/samples.length*100:null;
  }

  function setNodeText(node,value){
    if(!node)return;
    if(node.childNodes.length===1&&node.firstChild?.nodeType===Node.TEXT_NODE){if(node.firstChild.nodeValue!==value)node.firstChild.nodeValue=value;return;}
    if(clean(node.textContent)!==value)node.textContent=value;
  }

  function syncSalesUi(){
    const root=document.querySelector(".qmes-sales-stable");if(!root)return;
    const compliance=complianceRate(),risk=riskCount();
    root.querySelectorAll(".qerp-kpi").forEach(card=>{
      const label=clean(card.querySelector("span")?.textContent),value=card.querySelector("b");if(!value)return;
      if(label==="납기 준수율"){
        const text=compliance==null?"-":compliance.toFixed(1)+"%";
        setNodeText(value,text);
        card.title=compliance==null?"출하완료 실적이 없어 납기 준수율을 산정하지 않습니다.":"요청 납기일 +1일까지 준수로 산정합니다.";
      }else if(label==="지연 위험"){
        setNodeText(value,risk+"건");
        card.title="요청 납기일 +1일을 초과한 미출하 수주";
      }
    });

    const table=root.querySelector("table");if(!table)return;
    const headers=Array.from(table.querySelectorAll("thead th")).map(th=>clean(th.textContent));
    const idIndex=headers.findIndex(value=>value==="수주번호"),statusIndex=headers.findIndex(value=>value==="납기상태");
    if(idIndex<0||statusIndex<0)return;
    table.querySelectorAll("tbody tr").forEach(tr=>{
      const cells=tr.children;if(!cells[idIndex]||!cells[statusIndex])return;
      const id=clean(cells[idIndex].textContent),row=salesById(id);if(!row)return;
      const state=dueStatus(row),cell=cells[statusIndex],target=cell.querySelector(".qmes-sales-plain-status")||cell.firstElementChild||cell;
      setNodeText(target,state.label);
      if(target.classList?.contains("qmes-sales-plain-status")){
        target.classList.remove("good","warn","bad","neutral");target.classList.add(state.tone);
      }
    });
  }

  function legacyGeneratedMap(){
    const D=db();if(!D)return {};
    const docs=D.woDocs&&typeof D.woDocs==="object"?D.woDocs:{};
    const batches=Array.isArray(D.batches)?D.batches:[];
    const ids=[];
    Object.keys(docs).forEach(id=>{const key=clean(id);if(key&&!ids.includes(key))ids.push(key);});
    batches.forEach(row=>{const key=clean(row?.no);if(key&&!ids.includes(key))ids.push(key);});
    const list=ids.map(wo=>{
      const doc=docs[wo]||{},batch=batches.find(row=>clean(row?.no)===wo)||{},lot=D.lots?.[wo]||{};
      const production=isoDate(doc.date||doc.productionDate||batch.date||batch.productionDate||lot.date);
      const due=isoDate(doc.due||doc.deliveryDate||batch.due||batch.deliveryDate);
      return {wo,production,due};
    }).sort((a,b)=>String(a.production||a.due||"").localeCompare(String(b.production||b.due||""))||a.wo.localeCompare(b.wo));
    const counters={},result={};
    list.forEach(item=>{
      const dateKey=(item.production||item.due||new Date().toISOString().slice(0,10)).replace(/-/g,"");
      counters[dateKey]=(counters[dateKey]||0)+1;
      result[item.wo]=`SO-${dateKey}-${String(counters[dateKey]).padStart(3,"0")}`;
    });
    return result;
  }

  function currentUser(){const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};return clean(user?.name||user?.uid||user)||"SYSTEM";}

  async function syncSalesShared(rows){
    if(typeof window.qmesSyncUpsert!=="function")return;
    try{
      await window.qmesSyncUpsert("inventory","erp:sales",{module:"erp",schema:1,kind:"sales",rows,updatedAt:new Date().toISOString(),updatedBy:currentUser()});
    }catch(error){console.warn("[QMES] sales-workorder shared sync failed",error);}
  }

  async function linkSaleToWorkOrder(row,workOrder,options={}){
    const D=db(),wo=clean(workOrder),sid=salesId(row);if(!D||!wo||!sid)return false;
    const map=linkMap(),existingWo=clean(map.bySales[sid]),existingSale=clean(map.byWorkOrder[wo]);
    if(existingWo&&existingWo!==wo)return false;
    if(existingSale&&existingSale!==sid)return false;

    map.bySales[sid]=wo;map.byWorkOrder[wo]=sid;saveLinkMap(map);

    const list=salesRows();
    const index=list.findIndex(item=>clean(item?.id)===clean(row?.id)||salesId(item)===sid);
    const customer=salesCustomer(row),product=salesProduct(row),due=salesDue(row),destination=salesDestination(row),qty=salesQty(row),now=new Date().toISOString();
    let nextRow=row;
    if(index>=0){
      nextRow={...list[index],workOrder:wo,plan:"작업지시 발행",linkedAt:now};
      list[index]=nextRow;write(SALES_KEY,list);
    }

    const metaMap=readMap(META_KEY),rawId=clean(row?.id),previous=metaMap[rawId]||metaMap[sid]||metaFor(row)||{};
    const nextMeta={...previous,workOrder:wo,salesOrderIdOverride:sid,savedAt:now};
    if(rawId)metaMap[rawId]=nextMeta;metaMap[sid]=nextMeta;write(META_KEY,metaMap);

    D.woDocs=D.woDocs&&typeof D.woDocs==="object"?D.woDocs:{};
    const doc=D.woDocs[wo]||{};
    D.woDocs[wo]={...doc,salesOrderId:sid,customer,customerName:customer,deliveryPlace:destination,requestedDue:due,due:due||doc.due,item:product||doc.item,orderQty:qty,salesQty:qty};

    const batch=(Array.isArray(D.batches)?D.batches:[]).find(item=>clean(item?.no)===wo);
    if(batch){
      batch.salesOrderId=sid;batch.customer=customer;batch.customerName=customer;batch.deliveryPlace=destination;
      if(due)batch.due=due;if(product){batch.item=product;batch.itemName=product;}batch.orderQty=qty;batch.salesQty=qty;
    }
    D.lots=D.lots&&typeof D.lots==="object"?D.lots:{};
    const lot=D.lots[wo]||{};
    D.lots[wo]={...lot,salesOrderId:sid,workOrder:wo,customer,deliveryPlace:destination,orderQty:qty,itemName:product||lot.itemName||lot.item};

    try{if(typeof window.dbSave==="function")window.dbSave();}catch(error){console.warn("[QMES] sales-workorder dbSave failed",error);}
    if(options.sync!==false){
      if(typeof window.qmesSyncWorkOrder==="function"){try{await window.qmesSyncWorkOrder(wo);}catch(error){console.warn("[QMES] linked work-order sync failed",error);}}
      await syncSalesShared(list);
    }
    window.dispatchEvent(new CustomEvent("qmes:sales-workorder-linked",{detail:{salesOrderId:sid,workOrder:wo}}));
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_WO_LINK",id:sid,workOrder:wo}}));
    document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"SALES_WO_LINK",workOrder:wo}}));
    return true;
  }

  function woInfo(wo){
    const D=db(),doc=D?.woDocs?.[wo]||{},batch=(D?.batches||[]).find(item=>clean(item?.no)===wo)||{},lot=D?.lots?.[wo]||{};
    return {product:clean(doc.item||batch.item||batch.itemName||lot.itemName||lot.item),qty:num(doc.plan??doc.qty??batch.plan??batch.qty??lot.qty),due:isoDate(doc.due||doc.deliveryDate||batch.due||batch.deliveryDate)};
  }

  function candidateScore(sale,wo){
    const info=woInfo(wo),product=salesProduct(sale),qty=salesQty(sale),due=isoDate(salesDue(sale));let score=0;
    if(product&&info.product&&norm(product)===norm(info.product))score+=4;
    if(qty>0&&info.qty>0&&Math.abs(qty-info.qty)<0.001)score+=3;
    if(due&&info.due&&due===info.due)score+=2;
    return score;
  }

  let reconciling=false;
  async function reconcileExistingLinks(){
    if(reconciling)return;reconciling=true;
    try{
      const D=db();if(!D)return;
      const rows=salesRows(),legacy=legacyGeneratedMap(),workOrders=Array.from(new Set([...Object.keys(D.woDocs||{}),...(D.batches||[]).map(row=>clean(row?.no)).filter(Boolean)]));
      const map=linkMap();

      /* Existing explicit relationship wins. */
      for(const wo of workOrders){
        if(clean(map.byWorkOrder[wo]))continue;
        const explicit=clean(D.woDocs?.[wo]?.salesOrderId||(D.batches||[]).find(row=>clean(row?.no)===wo)?.salesOrderId||D.lots?.[wo]?.salesOrderId);
        const sale=explicit?salesById(explicit):null;
        if(sale)await linkSaleToWorkOrder(sale,wo,{sync:false});
      }

      /* Safe migration: legacy generated SO number must exactly equal a real Sales Order number. */
      for(const wo of workOrders){
        const current=linkMap();if(clean(current.byWorkOrder[wo]))continue;
        const legacyId=legacy[wo],sale=legacyId?salesById(legacyId):null;
        if(sale&&!clean(current.bySales[salesId(sale)]))await linkSaleToWorkOrder(sale,wo,{sync:false});
      }

      /* Otherwise require a unique strong product/quantity match. */
      for(const wo of workOrders){
        const current=linkMap();if(clean(current.byWorkOrder[wo]))continue;
        const candidates=rows.filter(sale=>!clean(current.bySales[salesId(sale)])).map(sale=>({sale,score:candidateScore(sale,wo)})).filter(item=>item.score>=5).sort((a,b)=>b.score-a.score);
        if(candidates.length&&(!candidates[1]||candidates[0].score>candidates[1].score))await linkSaleToWorkOrder(candidates[0].sale,wo,{sync:false});
      }
    }finally{reconciling=false;syncSalesUi();}
  }

  function fieldByLabel(root,labels){
    const targets=(Array.isArray(labels)?labels:[labels]).map(value=>norm(value));
    return Array.from(root?.querySelectorAll?.(".qmes-wo-form-field")||[]).find(field=>{
      const label=norm(field.querySelector("span,label")?.textContent);return targets.some(target=>label.includes(target));
    })||null;
  }

  function setReactInput(control,value){
    if(!control)return false;const next=String(value??"");if(control.value===next)return false;
    const proto=control instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;if(!setter)return false;
    const previous=control.value;setter.call(control,next);if(control._valueTracker)control._valueTracker.setValue(previous);
    control.dispatchEvent(new Event("input",{bubbles:true}));control.dispatchEvent(new Event("change",{bubbles:true}));return true;
  }

  function prefillIssueFromSale(shell,row){
    if(!shell||!row)return;
    const product=salesProduct(row),due=salesDue(row),qty=salesQty(row),customer=salesCustomer(row),destination=salesDestination(row);
    const productField=fieldByLabel(shell,["품목","제품명","제품"]),productControl=productField?.querySelector("input,select");
    if(productControl&&product){if(productControl instanceof HTMLSelectElement&&!Array.from(productControl.options).some(option=>option.value===product)){const option=document.createElement("option");option.value=product;option.textContent=product;productControl.appendChild(option);}setReactInput(productControl,product);}
    const dueControl=fieldByLabel(shell,["납기일","납기"])?.querySelector("input");if(dueControl&&due)setReactInput(dueControl,due);
    const qtyControl=fieldByLabel(shell,["생산계획량","계획량","생산량"])?.querySelector("input");if(qtyControl&&qty>0&&!clean(qtyControl.value))setReactInput(qtyControl,String(qty));
    const customerControl=fieldByLabel(shell,["고객사"])?.querySelector("input,select");if(customerControl&&customer)setReactInput(customerControl,customer);
    const destinationControl=fieldByLabel(shell,["납품처"])?.querySelector("input");if(destinationControl&&destination)setReactInput(destinationControl,destination);
  }

  function openSalesForIssue(){
    const map=linkMap();
    return salesRows().filter(row=>{
      const sid=salesId(row);if(!sid||clean(map.bySales[sid])||clean(row?.workOrder)||clean(metaFor(row).workOrder))return false;
      return !isComplete(row);
    });
  }

  function ensureIssueSelector(){
    const shell=document.querySelector(".qmes-wo-issue-shell");if(!shell)return;
    let bar=shell.querySelector("#qmes-wo-sales-link-20260827");
    if(!bar){
      bar=document.createElement("div");bar.id="qmes-wo-sales-link-20260827";
      bar.style.cssText="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;border:1px solid #bae6fd;border-left:4px solid #0ea5e9;border-radius:9px;background:#f0f9ff;color:#0f172a";
      bar.innerHTML='<strong style="font-size:12px">연결 수주번호</strong><select data-qmes-sales-link-select style="min-width:210px;height:34px;padding:0 9px;border:1px solid #7dd3fc;border-radius:7px;background:#fff;color:#0f172a;font-size:12px;font-weight:800"><option value="">수주 선택</option></select><span data-qmes-sales-link-info style="font-size:10px;font-weight:700;color:#475569">수주 → 작업지시 → OQC 자동승계</span>';
      const anchor=shell.firstElementChild;anchor?shell.insertBefore(bar,anchor):shell.appendChild(bar);
      bar.querySelector("select")?.addEventListener("change",event=>{const row=salesById(event.target.value);if(row)prefillIssueFromSale(shell,row);});
    }
    const select=bar.querySelector("select"),current=clean(select?.value),options=openSalesForIssue();if(!select)return;
    const html=['<option value="">수주 선택</option>',...options.map(row=>`<option value="${salesId(row).replace(/"/g,"&quot;")}">${salesId(row)} · ${salesCustomer(row)||"-"} · ${salesProduct(row)||"-"} · ${salesQty(row).toLocaleString()}kg</option>`)];
    const nextHtml=html.join("");if(select.innerHTML!==nextHtml)select.innerHTML=nextHtml;
    if(current&&options.some(row=>salesId(row)===current))select.value=current;
    else if(options.length===1){select.value=salesId(options[0]);prefillIssueFromSale(shell,options[0]);}
    const info=bar.querySelector("[data-qmes-sales-link-info]");if(info)setNodeText(info,options.length?"수주 고객사·제품·수량·납기·납품처를 작업지시/OQC로 연결":"연결 가능한 미발행 수주 없음");
  }

  function guessedWorkOrder(shell){
    const field=fieldByLabel(shell,["생산 LOT","생산LOT","작업지시번호","작업지시 번호","LOT No.","LOT NO"]);
    return clean(field?.querySelector("input")?.value||field?.querySelector("select")?.value);
  }

  let pendingIssue=null;
  async function finishPendingIssue(){
    if(!pendingIssue||Date.now()>pendingIssue.expires)return;
    const D=db();if(!D)return;
    const keys=Object.keys(D.woDocs||{}),created=keys.filter(key=>!pendingIssue.before.has(key));
    const wo=(pendingIssue.expected&&D.woDocs?.[pendingIssue.expected]?pendingIssue.expected:"")||(created.length===1?created[0]:"");
    if(!wo)return;
    const sale=salesById(pendingIssue.salesId);pendingIssue=null;
    if(sale){await linkSaleToWorkOrder(sale,wo);ensureIssueSelector();}
  }

  function installIssueCapture(){
    document.addEventListener("click",event=>{
      const button=event.target?.closest?.("button");if(!button)return;
      const shell=button.closest?.(".qmes-wo-issue-shell");if(!shell)return;
      const label=clean(button.textContent);
      if(!(/작업지시.*발행|^발행$/.test(label)||(button.type==="submit"&&!/원료|삭제|취소|인쇄|수정/.test(label))))return;
      const select=shell.querySelector("[data-qmes-sales-link-select]"),available=openSalesForIssue();
      const sid=clean(select?.value);
      if(available.length&&!sid){event.preventDefault();event.stopImmediatePropagation();window.alert("작업지시와 연결할 수주번호를 선택하세요.");return;}
      if(!sid)return;
      const D=db();pendingIssue={salesId:sid,before:new Set(Object.keys(D?.woDocs||{})),expected:guessedWorkOrder(shell),expires:Date.now()+7000};
      [0,80,250,600,1200,2500,5000].forEach(delay=>setTimeout(finishPendingIssue,delay));
    },true);
  }

  function labelControl(root,labelText){
    const target=norm(labelText);
    const label=Array.from(root?.querySelectorAll?.("label")||[]).find(node=>norm(node.textContent)===target||norm(node.textContent).includes(target));
    return label?.parentElement?.querySelector("input,select,textarea")||null;
  }

  function applyOqcSalesLink(){
    const root=document.querySelector(".qmes-oqc-page");if(!root)return;
    const lotControl=labelControl(root,"LOT No.");const wo=clean(lotControl?.value);if(!wo)return;
    const sale=saleForWorkOrder(wo);if(!sale)return;
    const sid=salesId(sale),customer=salesCustomer(sale),product=salesProduct(sale),qty=salesQty(sale),destination=salesDestination(sale),D=db();
    if(D){
      const doc=D.woDocs?.[wo];if(doc){doc.salesOrderId=sid;if(product)doc.item=product;doc.customer=customer;doc.customerName=customer;doc.deliveryPlace=destination;doc.orderQty=qty;}
      const batch=(D.batches||[]).find(item=>clean(item?.no)===wo);if(batch){batch.salesOrderId=sid;if(product){batch.item=product;batch.itemName=product;}batch.customer=customer;batch.customerName=customer;batch.deliveryPlace=destination;batch.orderQty=qty;}
      if(D.lots?.[wo]){D.lots[wo].salesOrderId=sid;if(product)D.lots[wo].itemName=product;D.lots[wo].customer=customer;D.lots[wo].deliveryPlace=destination;D.lots[wo].orderQty=qty;}
    }
    const customerControl=labelControl(root,"고객사"),qtyControl=labelControl(root,"출하수량 (kg)"),destinationControl=labelControl(root,"납품처");
    setTimeout(()=>{if(customerControl&&customer)setReactInput(customerControl,customer);},0);
    setTimeout(()=>{const control=labelControl(root,"출하수량 (kg)");if(control&&qty>0)setReactInput(control,String(qty));},60);
    setTimeout(()=>{const control=labelControl(root,"납품처");if(control)setReactInput(control,destination);},120);
    const note=root.querySelector(".qmes-oqc-linkage-note span");if(note)setNodeText(note,`연결 수주 ${sid} · 고객사/제품/수량/납품처 자동승계 · OQC 합격 후 출하단계로 연결됩니다.`);
  }

  function installOqcCapture(){
    document.addEventListener("change",event=>{
      const target=event.target;if(!(target instanceof Element)||!target.closest(".qmes-oqc-page"))return;
      const parent=target.closest("div");if(target.tagName==="SELECT"&&/LOT\s*NO/i.test(clean(parent?.querySelector("label")?.textContent)))setTimeout(applyOqcSalesLink,0);
    },false);
  }

  let uiQueued=false;
  function scheduleUi(){if(uiQueued)return;uiQueued=true;requestAnimationFrame(()=>{uiQueued=false;ensureIssueSelector();syncSalesUi();applyOqcSalesLink();});}

  function boot(){
    installIssueCapture();installOqcCapture();
    reconcileExistingLinks().catch(error=>console.warn("[QMES] sales-workorder reconciliation failed",error));
    scheduleUi();
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(mutation=>Array.from(mutation.addedNodes||[]).some(node=>node.nodeType===1&&(node.matches?.(".qmes-sales-stable,.qmes-wo-issue-shell,.qmes-oqc-page")||node.querySelector?.(".qmes-sales-stable,.qmes-wo-issue-shell,.qmes-oqc-page")))))scheduleUi();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    ["qmes:erp-data-changed","qmes:data-updated","qmes:workorder-saved","qmes:workorder-synced","qmes:mes-master-ready","qmes:sales-workorder-linked"].forEach(name=>window.addEventListener(name,()=>{setTimeout(()=>{finishPendingIssue();reconcileExistingLinks();scheduleUi();},0);}));
    window.addEventListener("storage",event=>{if([SALES_KEY,META_KEY,LINK_KEY,SHIPPING_KEY].includes(event.key))setTimeout(()=>{reconcileExistingLinks();scheduleUi();},0);});
    setTimeout(scheduleUi,300);setTimeout(scheduleUi,800);setTimeout(syncSalesUi,1200);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesWorkOrderTraceability={linkSaleToWorkOrder,reconcileExistingLinks,saleForWorkOrder,actualSalesIdForWorkOrder,applyOqcSalesLink,syncSalesUi};
})();
