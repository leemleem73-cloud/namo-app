/* NAMO QMES - Sales detail consistency V1 - 2026-08-28
 * ADD-ONLY PATCH. Existing Sales detail/edit/runtime sources are not replaced.
 * Keeps '수주 상세 · 진행현황' aligned with the visible Sales row and edit modal.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DETAIL_CONSISTENCY_20260828_V1__)return;
  window.__QMES_SALES_DETAIL_CONSISTENCY_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PANEL_ID="qmes-sales-order-detail-panel-20260826";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const salesRows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const metaMap=()=>{const v=read(META_KEY,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=(row,map=metaMap())=>map[rowKey(row)]||map[clean(row?.id)]||row?.orderMeta||{};
  const visibleId=(row,map=metaMap())=>clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);

  function findRow(id){
    const wanted=clean(id);if(!wanted)return null;
    const map=metaMap();
    const mappedKey=Object.keys(map).find(key=>clean(map[key]?.salesOrderIdOverride)===wanted)||"";
    return salesRows().find(row=>{
      const rid=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      return rid===wanted||key===wanted||shown===wanted||(mappedKey&&(rid===mappedKey||key===mappedKey));
    })||null;
  }

  function salesRoot(){
    return Array.from(document.querySelectorAll(".qerp,.qmes-sales-stable")).find(node=>{
      const title=clean(node.querySelector?.(".qerp-title")?.textContent);
      return title==="수주 · 납기관리"||node.classList?.contains("qmes-sales-stable");
    })||null;
  }

  function visibleTableInfo(id){
    const root=salesRoot();if(!root)return null;
    const table=Array.from(root.querySelectorAll("table")).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)));
    if(!table)return null;
    const heads=Array.from(table.querySelectorAll("thead th")).map(th=>clean(th.textContent));
    const idx=name=>heads.findIndex(v=>v===name||v.includes(name));
    const oi=idx("수주번호");
    const tr=Array.from(table.querySelectorAll("tbody tr")).find(row=>{
      const cell=row.children?.[oi>=0?oi:0];
      const link=cell?.querySelector?.("[data-qso-id],.qmes-sales-order-link,a,b,strong");
      return [link?.textContent,link?.getAttribute?.("data-qso-id"),link?.getAttribute?.("data-qso-visible-id"),cell?.textContent].some(v=>clean(v)===clean(id));
    });
    if(!tr)return null;
    const cell=name=>{const i=idx(name);return i>=0?clean(tr.children?.[i]?.textContent):"";};
    return {
      id:cell("수주번호"),customer:cell("고객사"),product:cell("제품"),qty:cell("수량"),
      due:cell("납기일"),dueState:cell("납기상태"),plan:cell("생산계획"),shipping:cell("출하상태"),
      deliveryPlace:cell("납품처"),packaging:cell("포장정보")
    };
  }

  function currentVisibleId(){
    const root=salesRoot();
    const link=root?.querySelector("table tbody [data-qso-visible-id],table tbody .qmes-sales-order-link,table tbody [data-qso-id]");
    return clean(link?.getAttribute?.("data-qso-visible-id"))||clean(link?.textContent)||clean(link?.getAttribute?.("data-qso-id"));
  }

  function itemMap(panel){
    const out={};
    panel.querySelectorAll(".qso-item").forEach(item=>{
      const label=clean(item.querySelector("b")?.textContent);
      const value=item.querySelector("span");
      if(label&&value)out[label]=value;
    });
    return out;
  }

  function setFlow(panel,name,label,tone){
    const step=Array.from(panel.querySelectorAll(".qso-step")).find(node=>clean(node.querySelector("strong")?.textContent)===name);
    const badge=step?.querySelector(".qso-badge");
    if(!badge)return;
    badge.textContent=label;
    badge.classList.remove("good","wait","progress","bad");
    badge.classList.add(tone);
  }

  function patchPanel(){
    const panel=document.getElementById(PANEL_ID);if(!panel)return;
    const items=itemMap(panel);
    const rawFromPanel=clean(items["수주번호"]?.textContent)||clean(panel.querySelector(".qso-sub")?.textContent?.split("·")[0]);
    const row=findRow(panel.dataset.qsoCanonicalId||rawFromPanel||currentVisibleId());
    if(!row)return;

    const map=metaMap(),meta=metaFor(row,map),shown=visibleId(row,map)||clean(row.id);
    const screen=visibleTableInfo(shown)||visibleTableInfo(clean(row.id))||{};
    panel.dataset.qsoCanonicalId=shown;
    panel.dataset.qsoStoredId=clean(row.id);

    const values={
      "수주번호":shown,
      "고객사":screen.customer||clean(row.customer),
      "고객 PO":clean(row.po)||clean(meta.customerPO)||"-",
      "고객 품목코드":clean(meta.customerItemCode)||"-",
      "제품":screen.product||clean(row.product),
      "수주수량":screen.qty||((Number(row.qty)||0).toLocaleString("ko-KR")+" kg"),
      "수주구분":clean(meta.orderType)||clean(items["수주구분"]?.textContent)||"양산",
      "납품처":screen.deliveryPlace||clean(meta.deliveryPlace)||clean(row.deliveryPlace),
      "포장정보":screen.packaging||clean(items["포장정보"]?.textContent),
      "생산계획":screen.plan||clean(meta.productionPlanStatus)||clean(row.plan),
      "출하상태":screen.shipping||clean(meta.shippingStatus)||clean(row.shipping)
    };

    Object.entries(values).forEach(([label,value])=>{if(items[label]&&clean(value))items[label].textContent=clean(value);});

    const sub=panel.querySelector(".qso-sub");
    if(sub){
      const parts=clean(sub.textContent).split("·").map(clean);
      parts[0]=shown;
      sub.textContent=parts.filter(Boolean).join(" · ");
    }

    const plan=clean(values["생산계획"]),shipping=clean(values["출하상태"]);
    if(/생산완료|완료/.test(plan))setFlow(panel,"작업지시 · 생산","완료","good");
    if(/출하완료|납품완료|배송완료|출고완료/.test(shipping))setFlow(panel,"출하","출하완료","good");

    panel.querySelectorAll("[data-qso-refresh]").forEach(button=>button.setAttribute("data-qso-refresh",clean(row.id)||shown));
  }

  function openConsistent(requested){
    const wanted=clean(requested)||currentVisibleId();
    const row=findRow(wanted);
    const stored=clean(row?.id)||wanted;
    const opener=window.qmesSalesOrderDetail?.open;
    if(typeof opener!=="function"){setTimeout(()=>openConsistent(wanted),80);return;}
    try{
      const result=opener(stored);
      Promise.resolve(result).finally(()=>{queueMicrotask(patchPanel);setTimeout(patchPanel,30);setTimeout(patchPanel,150);});
    }catch(_error){setTimeout(patchPanel,0);}
  }

  /* Registered before the MES master dynamically installs older detail handlers. */
  window.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    const progress=target.closest("#qmes-sales-progress-button-20260826");
    const link=target.closest(".qmes-sales-order-link,[data-qso-id]");
    const refresh=target.closest("[data-qso-refresh]");
    if(progress){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      openConsistent(currentVisibleId());
      return;
    }
    if(link&&link.closest(".qmes-sales-stable,.qerp")){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      openConsistent(clean(link.getAttribute("data-qso-visible-id"))||clean(link.textContent)||clean(link.getAttribute("data-qso-id")));
      return;
    }
    if(refresh&&refresh.closest("#"+PANEL_ID)){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      openConsistent(refresh.closest("#"+PANEL_ID)?.dataset.qsoCanonicalId||refresh.getAttribute("data-qso-refresh"));
    }
  },true);

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>Array.from(m.addedNodes||[]).some(node=>node.nodeType===1&&(node.id===PANEL_ID||node.querySelector?.("#"+PANEL_ID)))))queueMicrotask(patchPanel);
  });
  const start=()=>{observer.observe(document.body,{childList:true,subtree:true});patchPanel();};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed"].forEach(name=>window.addEventListener(name,()=>setTimeout(patchPanel,0)));

  window.qmesSalesDetailConsistency={patchPanel,open:openConsistent};
})();

/* NAMO QMES - Sales detail fast sync V2 - 2026-08-28
 * APPEND-ONLY. V1 and all legacy sources above remain unchanged.
 * Goals:
 * 1) Resolve the real Work Order / production LOT before rendering IQC/PQC/OQC/CoA status.
 * 2) Use exact DB qualityLink first; use downstream-completion evidence only when historical links are missing.
 * 3) Reduce F5 churn by preventing the later redundant KPI overlay/font observers from starting.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DETAIL_FAST_SYNC_20260828_V2__)return;
  window.__QMES_SALES_DETAIL_FAST_SYNC_20260828_V2__=true;

  /* Keep the lightweight KPI visual lock, but skip the later duplicate overlay/font observers. */
  window.__QMES_SALES_COMPLIANCE_VISUAL_OWNER_20260828_V2__=true;
  window.__QMES_SALES_KPI_FONT_MATCH_20260828_V1__=true;
  window.__QMES_SALES_COMPLIANCE_OVERLAY_20260828_V2__=true;
  window.__QMES_SALES_COMPLIANCE_MODAL_GUARD_20260828_V3__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const LINK_KEY="qmes-sales-workorder-link-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const PANEL_ID="qmes-sales-order-detail-panel-20260826";
  const DAY=86400000;
  const CONFIRMED_SHIP={"SO-20260114-001":"2026-01-15"};

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const norm=v=>clean(v).toUpperCase().replace(/\s+/g,"");
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const salesRows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const shippingRows=()=>{const v=read(SHIPPING_KEY,[]);return Array.isArray(v)?v:[];};
  const metaMap=()=>readMap(META_KEY);
  const getDb=()=>{try{return window.DB&&typeof window.DB==="object"?window.DB:null;}catch(_){return null;}};
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};
  const dateMs=v=>{const d=iso(v);if(!d)return null;const t=new Date(d+"T00:00:00").getTime();return Number.isFinite(t)?t:null;};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=(row,map=metaMap())=>map[rowKey(row)]||map[clean(row?.id)]||row?.orderMeta||{};
  const visibleId=(row,map=metaMap())=>clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);
  const completeText=v=>/출하완료|납품완료|배송완료|출고완료/.test(clean(v));

  function findRow(id){
    const wanted=clean(id);if(!wanted)return null;
    const map=metaMap();
    const mappedKey=Object.keys(map).find(key=>clean(map[key]?.salesOrderIdOverride)===wanted)||"";
    return salesRows().find(row=>{
      const rid=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      return rid===wanted||key===wanted||shown===wanted||(mappedKey&&(rid===mappedKey||key===mappedKey));
    })||null;
  }

  function itemMap(panel){
    const out={};
    panel.querySelectorAll(".qso-item").forEach(item=>{
      const label=clean(item.querySelector("b")?.textContent),value=item.querySelector("span");
      if(label&&value)out[label]=value;
    });
    return out;
  }

  function orderDateFromId(id){
    const m=clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);
    return m?`${m[1]}-${m[2]}-${m[3]}`:"";
  }

  function woInfo(D,wo){
    const doc=D?.woDocs?.[wo]||{},batch=(Array.isArray(D?.batches)?D.batches:[]).find(x=>clean(x?.no)===wo)||{},lot=D?.lots?.[wo]||{};
    return {
      product:clean(doc.item||batch.item||batch.itemName||lot.itemName||lot.item),
      qty:num(doc.plan??doc.qty??batch.plan??batch.qty??lot.qty),
      due:iso(doc.due||doc.deliveryDate||batch.due||batch.deliveryDate),
      salesId:clean(doc.salesOrderId||batch.salesOrderId||lot.salesOrderId)
    };
  }

  function candidateScore(row,wo,D){
    const meta=metaFor(row),info=woInfo(D,wo),product=clean(meta.productOverride)||clean(row?.product),qty=num(meta.qtyOverride??row?.qty),due=iso(meta.requestedDue||row?.due);let score=0;
    if(product&&info.product&&norm(product)===norm(info.product))score+=4;
    if(qty>0&&info.qty>0&&Math.abs(qty-info.qty)<0.001)score+=3;
    if(due&&info.due&&due===info.due)score+=2;
    return score;
  }

  function shippingFor(row,shown){
    const raw=clean(row?.id),wo=clean(row?.workOrder)||clean(metaFor(row).workOrder);
    const exact=shippingRows().find(ship=>{
      const sid=clean(ship?.sales||ship?.salesOrder||ship?.salesOrderId),swo=clean(ship?.workOrder||ship?.lot);
      return (sid&&(sid===shown||sid===raw))||(wo&&swo===wo);
    });
    if(exact)return exact;

    const product=norm(metaFor(row).productOverride||row?.product),qty=num(metaFor(row).qtyOverride??row?.qty),customer=norm(metaFor(row).customerOverride||row?.customer);
    const candidates=shippingRows().map(ship=>{
      let score=0;
      if(product&&norm(ship?.product)===product)score+=4;
      if(qty>0&&num(ship?.qty)>0&&Math.abs(num(ship.qty)-qty)<0.001)score+=3;
      if(customer&&norm(ship?.customer)===customer)score+=1;
      return {ship,score};
    }).filter(x=>x.score>=7).sort((a,b)=>b.score-a.score);
    return candidates.length&&(!candidates[1]||candidates[0].score>candidates[1].score)?candidates[0].ship:null;
  }

  function resolveWorkOrder(row,shown){
    const meta=metaFor(row),D=getDb(),link=readMap(LINK_KEY);
    const direct=clean(row?.workOrder)||clean(meta?.workOrder)||clean(link?.bySales?.[shown])||clean(link?.bySales?.[clean(row?.id)]);
    if(direct)return direct;

    const ship=shippingFor(row,shown),shipWo=clean(ship?.workOrder||ship?.lot);
    if(shipWo)return shipWo;
    if(!D)return "";

    const workOrders=Array.from(new Set([
      ...Object.keys(D.woDocs||{}),
      ...(Array.isArray(D.batches)?D.batches:[]).map(x=>clean(x?.no)).filter(Boolean),
      ...Object.keys(D.lots||{})
    ]));

    const explicit=workOrders.find(wo=>{
      const sid=woInfo(D,wo).salesId;
      return sid&&(sid===shown||sid===clean(row?.id));
    });
    if(explicit)return explicit;

    const candidates=workOrders.map(wo=>({wo,score:candidateScore(row,wo,D)})).filter(x=>x.score>=5).sort((a,b)=>b.score-a.score);
    return candidates.length&&(!candidates[1]||candidates[0].score>candidates[1].score)?candidates[0].wo:"";
  }

  function actualShipment(row,shown){
    const meta=metaFor(row),ship=shippingFor(row,shown);
    const state=[row?.shipping,row?.delivery,meta?.shippingStatus,meta?.deliveryStatus,ship?.shipping,ship?.delivery,ship?.status].map(clean).join(" ");
    const complete=row?.actualShipment===true||meta?.actualShipment===true||ship?.actualShipment===true||completeText(state)||Boolean(CONFIRMED_SHIP[shown]);
    const date=iso(row?.actualShipDate||row?.shipDate||meta?.actualShipDate||meta?.shipDate||ship?.actualShipDate||ship?.shipDate||ship?.actualDate||ship?.date||CONFIRMED_SHIP[shown]);
    return {complete,date,ship};
  }

  function statusObject(status,goodText="완료"){
    const s=clean(status);
    if(/불합격|NG|FAIL|차단|홀드/i.test(s))return {label:s||"불합격",tone:"bad",source:"실제 검사 이력"};
    if(/합격|완료|발행/.test(s))return {label:goodText,tone:"good",source:"실제 검사 이력"};
    if(/검사중|진행/.test(s))return {label:"진행중",tone:"progress",source:"실제 검사 이력"};
    return null;
  }

  function qualityState(row,shown,wo){
    const D=getDb(),ship=actualShipment(row,shown),productionComplete=/생산완료|완료/.test(clean(row?.plan||metaFor(row).productionPlanStatus));
    const result={iqc:null,pqc:null,oqc:null,coa:null};

    if(D&&wo){
      const lot=D.lots?.[wo]||{},q=lot.qualityLink||{};
      result.iqc=statusObject(q?.iqc?.status);
      result.pqc=statusObject(q?.pqc?.status);
      result.oqc=statusObject(q?.oqc?.status);
      result.coa=statusObject(q?.coa?.status,"발행완료");

      const doc=D.woDocs?.[wo]||{};
      if(!result.iqc){
        const inputs=(Array.isArray(doc.inputs)?doc.inputs:[]).filter(x=>clean(x?.lot||x?.materialLot));
        if(inputs.length){
          const judges=inputs.map(input=>{
            const lotNo=clean(input.lot||input.materialLot);
            const matches=(Array.isArray(D.iqc)?D.iqc:[]).filter(x=>clean(x?.lot)===lotNo);
            if(matches.some(x=>/불합격|NG|FAIL/i.test(clean(x?.judge))))return "fail";
            if(matches.some(x=>/합격|PASS|OK/i.test(clean(x?.judge))))return "pass";
            return "wait";
          });
          if(judges.includes("fail"))result.iqc={label:"불합격",tone:"bad",source:"원료 IQC 이력"};
          else if(judges.every(x=>x==="pass"))result.iqc={label:"완료",tone:"good",source:"원료 IQC 이력"};
        }
      }

      for(const kind of ["PQC","OQC"]){
        const key=kind.toLowerCase();if(result[key])continue;
        const list=Array.isArray(D?.insp?.[kind])?D.insp[kind].filter(x=>clean(x?.lot)===wo):[];
        if(list.some(x=>/불합격|NG|FAIL/i.test(clean(x?.judge))))result[key]={label:"불합격",tone:"bad",source:`${kind} 이력`};
        else if(list.some(x=>/합격|PASS|OK/i.test(clean(x?.judge))))result[key]={label:"완료",tone:"good",source:`${kind} 이력`};
      }
      if(!result.coa&&D.coa?.[wo])result.coa={label:"발행완료",tone:"good",source:"CoA 이력"};
    }

    /* Historical fallback: never override an explicit failure. Downstream completion proves upstream gate passage. */
    if(ship.complete){
      if(!result.iqc)result.iqc={label:"완료",tone:"good",source:"출하완료 이력 기준"};
      if(!result.pqc)result.pqc={label:"완료",tone:"good",source:"출하완료 이력 기준"};
      if(!result.oqc)result.oqc={label:"완료",tone:"good",source:"출하완료 이력 기준"};
      if(!result.coa)result.coa={label:"발행완료",tone:"good",source:"출하완료 이력 기준"};
    }else if(productionComplete){
      if(!result.iqc)result.iqc={label:"완료",tone:"good",source:"생산완료 이력 기준"};
      if(!result.pqc)result.pqc={label:"완료",tone:"good",source:"생산완료 이력 기준"};
    }
    return {...result,ship,productionComplete};
  }

  function setFlow(panel,name,state){
    if(!state)return;
    const step=Array.from(panel.querySelectorAll(".qso-step")).find(node=>clean(node.querySelector("strong")?.textContent)===name),badge=step?.querySelector(".qso-badge");
    if(!badge)return;
    badge.textContent=state.label;
    badge.classList.remove("good","wait","progress","bad");
    badge.classList.add(state.tone||"wait");
    if(state.source)badge.title=state.source;
  }

  function patchPanelV2(){
    const panel=document.getElementById(PANEL_ID);if(!panel)return;
    const items=itemMap(panel),requested=clean(panel.dataset.qsoCanonicalId)||clean(items["수주번호"]?.textContent)||clean(panel.querySelector(".qso-sub")?.textContent?.split("·")[0]);
    const row=findRow(requested);if(!row)return;
    const meta=metaFor(row),shown=visibleId(row)||clean(row.id),ship=actualShipment(row,shown),wo=resolveWorkOrder(row,shown),quality=qualityState(row,shown,wo);
    panel.dataset.qsoCanonicalId=shown;
    if(wo)panel.dataset.qsoResolvedWorkOrder=wo;

    const derivedOrderDate=orderDateFromId(shown);
    const confirmedDue=clean(meta.confirmedDue)||ship.date||(ship.complete?iso(meta.requestedDue||row?.due):"");
    const values={
      "수주번호":shown,
      "수주일자":derivedOrderDate||clean(meta.orderDate)||"-",
      "요청 납기일":iso(meta.requestedDue||row?.due)||"-",
      "확정 납기일":confirmedDue||"미확정",
      "작업지시 / 생산 LOT":wo||"-",
      "생산계획":quality.productionComplete?"생산완료":clean(row?.plan||meta.productionPlanStatus)||"-",
      "출하상태":ship.complete?"출하완료":clean(row?.shipping||meta.shippingStatus)||"-"
    };
    Object.entries(values).forEach(([label,value])=>{if(items[label])items[label].textContent=value;});

    setFlow(panel,"원료 · IQC",quality.iqc);
    setFlow(panel,"PQC",quality.pqc);
    setFlow(panel,"OQC",quality.oqc);
    setFlow(panel,"CoA",quality.coa);
    if(quality.productionComplete)setFlow(panel,"작업지시 · 생산",{label:"완료",tone:"good",source:wo?"생산 LOT 연결 이력":"생산완료 상태"});
    if(ship.complete)setFlow(panel,"출하",{label:"출하완료",tone:"good",source:ship.date?`실제 출하일 ${ship.date}`:"출하완료 이력"});

    const sub=panel.querySelector(".qso-sub");
    if(sub){
      const parts=clean(sub.textContent).split("·").map(clean);parts[0]=shown;sub.textContent=parts.filter(Boolean).join(" · ");
    }
  }

  function disconnectRedundantObservers(){
    [
      "__QMES_SALES_FINAL_UI_OBSERVER_20260828_V8__",
      "__QMES_SALES_KPI_FONT_MATCH_OBSERVER_20260828_V1__",
      "__QMES_SALES_COMPLIANCE_OVERLAY_OBSERVER_20260828_V2__",
      "__QMES_SALES_COMPLIANCE_MODAL_GUARD_OBSERVER_20260828_V3__"
    ].forEach(key=>{try{window[key]?.disconnect?.();}catch(_){}});
  }

  function installOpenWrapper(){
    const api=window.qmesSalesOrderDetail,current=api?.open;
    if(typeof current!=="function"||current.__qmesFastSyncV2)return;
    const original=current;
    const wrapped=function(...args){
      const result=original.apply(this,args);
      Promise.resolve(result).finally(()=>{
        queueMicrotask(patchPanelV2);
        setTimeout(patchPanelV2,50);
        setTimeout(patchPanelV2,250);
      });
      return result;
    };
    wrapped.__qmesFastSyncV2=true;
    wrapped.__qmesOriginal=original;
    api.open=wrapped;
  }

  function lightweightKpiRefresh(){
    const root=document.querySelector(".qmes-sales-stable");if(!root)return;
    const list=salesRows(),now=(()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();})();
    const info=list.map(row=>{const shown=visibleId(row),ship=actualShipment(row,shown),due=dateMs(metaFor(row).requestedDue||row?.due);return {row,ship,due};});
    const incomplete=info.filter(x=>!x.ship.complete);
    const dueSoon=incomplete.filter(x=>x.due!=null&&Math.round((x.due-now)/DAY)>=0&&Math.round((x.due-now)/DAY)<=7).length;
    const risk=incomplete.filter(x=>x.due!=null&&now>x.due).length;
    const samples=info.filter(x=>x.ship.complete&&x.due!=null&&dateMs(x.ship.date)!=null);
    const compliant=samples.filter(x=>dateMs(x.ship.date)<=x.due).length;
    const compliance=samples.length?(compliant/samples.length*100).toFixed(1)+"%":"-";
    const kg=list.reduce((sum,row)=>sum+num(row?.qty),0),tons=(kg/1000).toFixed(2).replace(/0+$/,"" ).replace(/\.$/,"")+"t";
    const values={"진행 수주":incomplete.length+"건","7일 이내 납기":dueSoon+"건","납기 준수율":compliance,"지연 위험":risk+"건","수주량 합계":tons};
    root.querySelectorAll(".qerp-kpi").forEach(card=>{
      const label=clean(card.querySelector("span")?.textContent),b=card.querySelector("b");
      if(b&&Object.prototype.hasOwnProperty.call(values,label))b.textContent=values[label];
    });
  }

  function settle(){
    disconnectRedundantObservers();
    installOpenWrapper();
    patchPanelV2();
    lightweightKpiRefresh();
  }

  const afterEvent=()=>{setTimeout(settle,0);setTimeout(settle,120);};
  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed","qmes:data-updated","qmes:quality-linkage-updated","qmes:shared-sync-complete","qmes:sales-workorder-linked"].forEach(name=>window.addEventListener(name,afterEvent));

  function start(){
    settle();
    [80,300,800,1400,2400].forEach(ms=>setTimeout(settle,ms));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

  window.qmesSalesDetailFastSync={patchPanel:patchPanelV2,resolveWorkOrder,refresh:settle};
})();
