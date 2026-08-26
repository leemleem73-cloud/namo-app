/* QMES auth session fast-check - 2026-08-12
 * Keeps /api/auth/me from blocking startup and installs critical first-paint UI
 * before React/Babel modules render.
 */
(function installAuthSessionFastCheck(global){
  "use strict";
  if(global.__QMES_AUTH_FASTCHECK_20260812__) return;
  global.__QMES_AUTH_FASTCHECK_20260812__=true;

  const nativeFetch=global.fetch.bind(global);
  global.fetch=function(input,init){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    if(!/\/api\/auth\/me(?:\?|$)/.test(url)) return nativeFetch(input,init);
    const options={...(init||{})};
    if(options.signal) return nativeFetch(input,options);
    const controller=new AbortController();
    const timer=global.setTimeout(()=>controller.abort(),5000);
    options.signal=controller.signal;
    return nativeFetch(input,options).finally(()=>global.clearTimeout(timer));
  };
})(window);

/* Load the final corporate styles before the application components are evaluated.
 * The links are also re-ordered later by the master loader, but loading them here
 * prevents a dark/legacy first paint on F5.
 */
(function installEnterpriseUiBeforeRender(){
  const styles=[
    ["qmes-enterprise-ui-20260826","./css/qmes-enterprise-ui-20260826.css?v=20260826-enterprise2"],
    ["qmes-shell-offset-fix-20260826","./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1"],
    ["qmes-enterprise-readable-size-20260826","./css/qmes-enterprise-readable-size-20260826.css?v=20260826-readable1"],
    ["qmes-modern-corporate-ui-20260826","./css/qmes-modern-corporate-ui-20260826.css?v=20260826-modern1"],
    ["qmes-production-process-corporate-fix-20260826","./css/qmes-production-process-corporate-fix-20260826.css?v=20260826-process2"],
    ["qmes-sidebar-line-align-20260826","./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2"],
    ["qmes-workorder-preview-light-20260826","./css/qmes-workorder-preview-light-20260826.css?v=20260826-workorderpreview1"],
    ["qmes-workorder-print-outline-20260826","./css/qmes-workorder-print-outline-20260826.css?v=20260826-outline1"],
    ["qmes-workorder-print-final-20260826","./css/qmes-workorder-print-final-20260826.css?v=20260826-printfinal1"]
  ];
  styles.forEach(([id,href])=>{
    let link=document.getElementById(id);
    if(!link){
      link=document.createElement("link");
      link.id=id;
      link.rel="stylesheet";
      link.href=href;
      document.head.appendChild(link);
    }else if(String(link.getAttribute("href")||"")!==href){
      link.href=href;
    }
  });
  document.documentElement.style.setProperty("color-scheme","light");
})();

/* Synchronous critical CSS for the production-process page.
 * React's component contains legacy navy CSS inline. These !important rules exist
 * before React renders, so users never see the old dark design while external CSS
 * files are still downloading/reordering.
 */
(function installProductionProcessFirstPaintGuard(){
  const id="qmes-production-process-firstpaint-20260826";
  if(document.getElementById(id)) return;
  const style=document.createElement("style");
  style.id=id;
  style.textContent=`
    html body #root#root#root main .qmes-prod-process{color:#344054!important;background:#f6f7f9!important}
    html body #root#root#root main .qmes-prod-process .qpp-card,
    html body #root#root#root main .qmes-prod-process .qpp-card-head,
    html body #root#root#root main .qmes-prod-process .qpp-info,
    html body #root#root#root main .qmes-prod-process .qpp-info>div,
    html body #root#root#root main .qmes-prod-process .qpp-worker,
    html body #root#root#root main .qmes-prod-process .qpp-table,
    html body #root#root#root main .qmes-prod-process .qpp-table tbody tr,
    html body #root#root#root main .qmes-prod-process .qpp-table tbody td{
      background:#fff!important;background-image:none!important;color:#344054!important;
    }
    html body #root#root#root main .qmes-prod-process .qpp-card{border-color:#e2e6ec!important;box-shadow:none!important}
    html body #root#root#root main .qmes-prod-process .qpp-card-head{border-color:#e9edf2!important}
    html body #root#root#root main .qmes-prod-process .qpp-card-head b,
    html body #root#root#root main .qmes-prod-process .qpp-info strong{color:#182230!important}
    html body #root#root#root main .qmes-prod-process .qpp-card-head span,
    html body #root#root#root main .qmes-prod-process .qpp-info small{color:#667085!important}
    html body #root#root#root main .qmes-prod-process .qpp-table thead,
    html body #root#root#root main .qmes-prod-process .qpp-table thead tr,
    html body #root#root#root main .qmes-prod-process .qpp-table th{
      background:#f7f8fa!important;color:#667085!important;border-color:#e2e6ec!important;
    }
    html body #root#root#root main .qmes-prod-process .qpp-table td{border-color:#edf0f3!important}
    html body #root#root#root main .qmes-prod-process .qpp-status{
      background:transparent!important;border:0!important;box-shadow:none!important;
    }
    html body #root#root#root main .qmes-prod-process .qpp-status.done{color:#16794b!important}
    html body #root#root#root main .qmes-prod-process .qpp-status.run{color:#1769e0!important}
    html body #root#root#root main .qmes-prod-process .qpp-status.wait{color:#667085!important}
    html body #root#root#root main .qmes-prod-process .qpp-actionbar{background:transparent!important;border-color:#e6eaf0!important}
    html body #root#root#root main .qmes-prod-process .qpp-actionbar button{
      background:#fff!important;color:#344054!important;border-color:#cfd6df!important;box-shadow:none!important;
    }
    html body #root#root#root main .qmes-prod-process .qpp-actionbar .qpp-btn.primary{
      background:#1769e0!important;color:#fff!important;border-color:#1769e0!important;
    }
  `;
  document.head.appendChild(style);
})();

/* Avoid the false empty-state flash after F5.
 * qmes_sync_records and local work-order data arrive asynchronously. The React
 * component can briefly render "작업지시서가 없습니다" before those rows arrive.
 * Hide only that exact transient message and reveal it after a stabilization window
 * if the page is genuinely still empty. Real API/error messages are never hidden.
 */
(function installProductionProcessEmptyStateGuard(){
  if(window.__QMES_PROCESS_EMPTY_GUARD_20260826__) return;
  window.__QMES_PROCESS_EMPTY_GUARD_20260826__=true;

  const EMPTY_TEXT="작업지시서가 없습니다";
  const pending=new WeakMap();

  function guard(node){
    if(!(node instanceof HTMLElement)) return;
    const candidates=[];
    if(node.matches?.(".qmes-prod-process .qpp-message.err")) candidates.push(node);
    node.querySelectorAll?.(".qmes-prod-process .qpp-message.err").forEach(el=>candidates.push(el));
    candidates.forEach(el=>{
      const text=String(el.textContent||"").trim();
      if(!text.includes(EMPTY_TEXT)) return;
      if(el.dataset.qmesStableEmpty==="1") return;
      el.style.setProperty("display","none","important");
      if(pending.has(el)) return;
      const timer=window.setTimeout(()=>{
        pending.delete(el);
        if(!el.isConnected) return;
        const current=String(el.textContent||"").trim();
        if(!current.includes(EMPTY_TEXT)) return;
        /* If actual process content appeared, keep this stale warning hidden. */
        if(document.querySelector(".qmes-prod-process .qpp-card .qpp-info")) return;
        el.dataset.qmesStableEmpty="1";
        el.style.removeProperty("display");
      },4000);
      pending.set(el,timer);
    });
  }

  const start=()=>{
    guard(document.body);
    const observer=new MutationObserver(mutations=>{
      mutations.forEach(mutation=>{
        mutation.addedNodes.forEach(node=>{
          if(node.nodeType===1) guard(node);
        });
      });
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  };

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
