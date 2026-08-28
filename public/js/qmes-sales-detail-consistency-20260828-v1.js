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
