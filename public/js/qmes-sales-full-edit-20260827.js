/* NAMO QMES - Sales edit + due KPI hotfix - 2026-08-27
 * Loaded by qmes-mes-master-loader as the compatibility owner.
 * - Restores the Sales edit screen even when an older cached compact controller is present.
 * - Replaces the hard-coded due compliance KPI with live current-order data.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_KPI_HOTFIX_20260827__) return;
  window.__QMES_SALES_EDIT_KPI_HOTFIX_20260827__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const HOTFIX_SCRIPT_ID="qmes-sales-edit-controller-hotfix-20260827";

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{
    try{
      const value=JSON.parse(localStorage.getItem(key)||"null");
      return value==null?fallback:value;
    }catch(_error){return fallback;}
  };
  const readMap=key=>{
    const value=read(key,{});
    return value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  };
  const rows=()=>{
    const value=read(SALES_KEY,[]);
    return Array.isArray(value)?value:[];
  };
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=row=>{
    const map=readMap(META_KEY),key=rowKey(row),id=clean(row?.id);
    return map[key]||map[id]||row?.orderMeta||{};
  };
  const visibleId=row=>clean(metaFor(row).salesOrderIdOverride)||clean(row?.id);
  const dueOf=row=>clean(metaFor(row).requestedDue)||clean(row?.due);

  function findRowById(id){
    const target=clean(id);
    if(!target) return null;
    return rows().find(row=>clean(row?.id)===target||rowKey(row)===target||visibleId(row)===target)||null;
  }

  function rowFromButton(button){
    const tr=button?.closest("tr");
    if(!tr) return null;
    const link=tr.querySelector("[data-qso-id],.qmes-sales-order-link");
    const candidates=[
      button.dataset.qmesSalesEdit,
      button.dataset.salesId,
      link?.getAttribute("data-qso-id"),
      link?.textContent,
      tr.children?.[0]?.textContent
    ].map(clean).filter(Boolean);
    for(const id of candidates){
      const row=findRowById(id);
      if(row) return row;
    }
    return null;
  }

  let controllerLoading=false;
  function loadLatestController(row){
    if(controllerLoading) return;
    controllerLoading=true;
    try{delete window.__QMES_SALES_DIRECT_STABLE_V18__;}catch(_error){}
    document.getElementById(HOTFIX_SCRIPT_ID)?.remove();
    const script=document.createElement("script");
    script.id=HOTFIX_SCRIPT_ID;
    script.async=false;
    script.src="./js/qmes-sales-compact-ui-20260826.js?v=20260827-edit-kpi-fix1&ts="+Date.now();
    script.onload=()=>{
      controllerLoading=false;
      const controller=window.qmesSalesEditDirectV18;
      if(controller&&typeof controller.open==="function"){
        controller.open(row||null);
      }else{
        window.alert("수정 화면 모듈을 불러오지 못했습니다. Ctrl+F5 후 다시 시도해 주세요.");
      }
    };
    script.onerror=()=>{
      controllerLoading=false;
      window.alert("수정 화면 모듈을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.");
    };
    document.head.appendChild(script);
  }

  function openEdit(button){
    const row=rowFromButton(button);
    if(!row){
      window.alert("수주 데이터를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    const controller=window.qmesSalesEditDirectV18;
    if(controller&&typeof controller.open==="function"){
      controller.open(row);
      return;
    }
    loadLatestController(row);
  }

  function isSalesEditButton(button){
    if(!button) return false;
    if(!button.closest(".qmes-sales-stable")) return false;
    return button.classList.contains("qmes-sales-edit-btn")||clean(button.textContent)==="수정";
  }

  document.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element)) return;
    const button=target.closest("button");
    if(!isSalesEditButton(button)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openEdit(button);
  },true);

  function localMidnight(){
    const date=new Date();
    date.setHours(0,0,0,0);
    return date.getTime();
  }

  function validDueTime(row){
    const due=dueOf(row);
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(due)) return null;
    const time=new Date(due+"T00:00:00").getTime();
    return Number.isFinite(time)?time:null;
  }

  function isCompleted(row){
    return /출하완료|납품완료|배송완료/.test(clean(row?.shipping));
  }

  function isOverdueOpen(row,today){
    const dueTime=validDueTime(row);
    return dueTime!==null&&!isCompleted(row)&&dueTime<today;
  }

  function liveKpis(){
    const data=rows();
    const today=localMidnight();
    const eligible=data.filter(row=>validDueTime(row)!==null);
    const overdue=eligible.filter(row=>isOverdueOpen(row,today));
    const risk=data.filter(row=>isOverdueOpen(row,today)||/위험|지연|차단/.test(clean(row?.shipping)));
    const compliance=eligible.length?((eligible.length-overdue.length)/eligible.length*100):null;
    return {compliance,risk:risk.length};
  }

  let kpiFrame=0;
  function syncKpis(){
    if(kpiFrame) cancelAnimationFrame(kpiFrame);
    kpiFrame=requestAnimationFrame(()=>{
      kpiFrame=0;
      const root=document.querySelector(".qmes-sales-stable");
      if(!root) return;
      const values=liveKpis();
      root.querySelectorAll(".qerp-kpi").forEach(card=>{
        const label=clean(card.querySelector("span")?.textContent);
        const value=card.querySelector("b");
        if(!value) return;
        if(label==="납기 준수율"){
          const next=values.compliance===null?"-":values.compliance.toFixed(1)+"%";
          if(clean(value.textContent)!==next) value.textContent=next;
          card.title="현재 등록된 수주의 납기일 기준: 기한 미경과/완료 수주 ÷ 납기일 입력 수주";
        }else if(label==="지연 위험"){
          const next=values.risk+"건";
          if(clean(value.textContent)!==next) value.textContent=next;
        }
      });
    });
  }

  const observer=new MutationObserver(syncKpis);
  const observe=()=>{
    if(!document.body) return;
    observer.observe(document.body,{childList:true,subtree:true});
    syncKpis();
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",observe,{once:true});
  else observe();

  ["qmes:erp-data-changed","qmes:erp-runtime-loaded","qmes:mes-master-ready"].forEach(name=>{
    window.addEventListener(name,syncKpis);
  });
  window.addEventListener("storage",event=>{
    if(event.key===SALES_KEY||event.key===META_KEY) syncKpis();
  });

  setTimeout(syncKpis,0);
  setTimeout(syncKpis,300);
  setTimeout(syncKpis,1000);
})();
