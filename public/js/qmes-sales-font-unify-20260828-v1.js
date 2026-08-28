/* NAMO QMES - Sales font + forced query modal V3 - 2026-08-28
 * Visual/query patch only.
 * Critical fix: intercepts 조회 on WINDOW capture before Enterprise Sales can rerender/move the page.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FONT_UNIFY_20260828_V1__)return;
  window.__QMES_SALES_FONT_UNIFY_20260828_V1__=true;

  const HOST="qmes-sales-enterprise-module-v2";
  const STYLE_ID="qmes-sales-font-unify-style-20260828-v1";
  const MODAL_ID="qmes-sales-query-result-modal-20260828-v3";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function install(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${HOST},#${HOST} table,#${HOST} thead,#${HOST} tbody,#${HOST} tr,#${HOST} th,#${HOST} td,#${HOST} th *,#${HOST} td *{
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        font-style:normal!important;letter-spacing:-.01em!important;font-variant-numeric:tabular-nums!important;
      }
      #${HOST} th,#${HOST} th *{font-size:10.5px!important;font-weight:800!important;line-height:1.2!important}
      #${HOST} td,#${HOST} td *,#${HOST} .order,#${HOST} .nse-prod-wrap{font-size:11.5px!important;font-weight:700!important;line-height:1.25!important}
      #${HOST} .st{font-size:10.5px!important;font-weight:700!important}

      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483640!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(15,23,42,.36)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${MODAL_ID} *{box-sizing:border-box!important}
      #${MODAL_ID} .qm-card{width:min(1080px,95vw)!important;max-height:88vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dfe5ed!important;border-radius:16px!important;box-shadow:0 28px 80px rgba(15,23,42,.28)!important;overflow:hidden!important}
      #${MODAL_ID} .qm-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:14px!important;padding:18px 20px 14px!important;border-bottom:1px solid #e8edf3!important}
      #${MODAL_ID} .qm-title{font-size:19px!important;font-weight:950!important;color:#182238!important}.qm-sub{margin-top:4px!important;font-size:10px!important;color:#8a96a8!important;font-weight:700!important}
      #${MODAL_ID} .qm-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f4f6f9!important;color:#334155!important;font-size:22px!important;cursor:pointer!important}
      #${MODAL_ID} .qm-body{overflow:auto!important;padding:16px 20px 18px!important}.qm-note{margin-bottom:12px!important;padding:9px 11px!important;border:1px dashed #d4deeb!important;border-radius:8px!important;background:#f9fbfd!important;color:#7a8798!important;font-size:9.5px!important;font-weight:700!important}
      #${MODAL_ID} .qm-meta{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin-bottom:12px!important}.qm-chip{display:inline-flex!important;align-items:center!important;min-height:28px!important;padding:0 9px!important;border-radius:7px!important;background:#f1f5f9!important;color:#526072!important;font-size:9.5px!important;font-weight:800!important}
      #${MODAL_ID} .qm-wrap{overflow:auto!important;border:1px solid #e1e7ef!important;border-radius:11px!important}#${MODAL_ID} table{width:100%!important;min-width:900px!important;border-collapse:collapse!important;table-layout:fixed!important}
      #${MODAL_ID} th,#${MODAL_ID} td{height:46px!important;padding:0 11px!important;border-bottom:1px solid #edf1f5!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #${MODAL_ID} th{background:#fafbfd!important;color:#697589!important;font-size:10px!important;font-weight:800!important}#${MODAL_ID} td{background:#fff!important;color:#253047!important;font-size:11px!important;font-weight:700!important}#${MODAL_ID} tbody tr:last-child td{border-bottom:0!important}
      #${MODAL_ID} .qm-order{border:0!important;background:transparent!important;color:#2457d6!important;font:inherit!important;font-weight:700!important;text-decoration:underline!important;text-underline-offset:3px!important;cursor:pointer!important}.qm-status{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:60px!important;height:24px!important;padding:0 8px!important;border-radius:999px!important;background:#eaf7ef!important;color:#187b43!important;font-size:9.5px!important;font-weight:700!important}.qm-empty{padding:34px!important;text-align:center!important;color:#94a3b8!important;font-size:11px!important}
      #${MODAL_ID} .qm-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 20px 16px!important;border-top:1px solid #e8edf3!important;background:#fff!important}.qm-btn{height:39px!important;padding:0 14px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-family:inherit!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}.qm-btn.soft{background:#eef4ff!important;border-color:#d7e4ff!important;color:#2853cc!important}.qm-btn.primary{background:#285bd8!important;border-color:#285bd8!important;color:#fff!important}
      @media(max-width:720px){#${MODAL_ID}{padding:8px!important;align-items:flex-start!important}#${MODAL_ID} .qm-card{max-height:98vh!important}}
    `;
    document.head.appendChild(s);
  }

  function tableRows(){
    const host=document.getElementById(HOST);
    if(!host)return [];
    return Array.from(host.querySelectorAll("tbody tr")).map(tr=>{
      const c=Array.from(tr.children);
      if(c.length<8)return null;
      return {id:clean(c[0]?.textContent),customer:clean(c[1]?.textContent),product:clean(c[2]?.textContent),qty:clean(c[3]?.textContent),due:clean(c[4]?.textContent),production:clean(c[5]?.textContent),shipment:clean(c[6]?.textContent),status:clean(c[7]?.textContent)};
    }).filter(Boolean);
  }

  function filteredRows(){
    const host=document.getElementById(HOST);
    const q=clean(host?.querySelector("[data-nse-q]")?.value).toLowerCase();
    const status=clean(host?.querySelector("[data-nse-status]")?.value)||"전체 상태";
    return tableRows().filter(row=>{
      const qok=!q||[row.id,row.customer,row.product,row.qty,row.due,row.production,row.shipment,row.status].join(" ").toLowerCase().includes(q);
      const sok=status==="전체 상태"||row.status===status;
      return qok&&sok;
    });
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove();document.documentElement.style.overflow="";}

  function openModal(){
    install();closeModal();
    const host=document.getElementById(HOST);if(!host)return false;
    const q=clean(host.querySelector("[data-nse-q]")?.value)||"전체";
    const status=clean(host.querySelector("[data-nse-status]")?.value)||"전체 상태";
    const data=filteredRows();
    const modal=document.createElement("div");modal.id=MODAL_ID;
    modal.innerHTML=`<section class="qm-card" role="dialog" aria-modal="true" aria-label="조회 결과"><div class="qm-head"><div><div class="qm-title">조회 결과</div><div class="qm-sub">검색 조건에 따른 실제 수주 데이터 조회</div></div><button type="button" class="qm-close" data-qm-close>×</button></div><div class="qm-body"><div class="qm-note">수주 Master와 연결된 생산계획·출하 상태를 조회합니다. 조회 시 기존 목록 위치는 변경하지 않습니다.</div><div class="qm-meta"><span class="qm-chip">검색: ${esc(q)}</span><span class="qm-chip">상태: ${esc(status)}</span><span class="qm-chip">결과: ${data.length.toLocaleString("ko-KR")}건</span></div><div class="qm-wrap"><table><thead><tr><th>수주번호</th><th>고객사</th><th>제품</th><th>수량</th><th>납기</th><th>생산계획</th><th>출하</th><th>상태</th></tr></thead><tbody>${data.length?data.map(x=>`<tr><td><button type="button" class="qm-order" data-qm-order="${esc(x.id)}">${esc(x.id)}</button></td><td>${esc(x.customer)}</td><td>${esc(x.product)}</td><td>${esc(x.qty)}</td><td>${esc(x.due)}</td><td>${esc(x.production)}</td><td>${esc(x.shipment)}</td><td><span class="qm-status">${esc(x.status)}</span></td></tr>`).join(""):`<tr><td colspan="8"><div class="qm-empty">조회 조건에 해당하는 수주가 없습니다.</div></td></tr>`}</tbody></table></div></div><div class="qm-actions"><button type="button" class="qm-btn" data-qm-close>닫기</button><button type="button" class="qm-btn soft" data-qm-export>엑셀</button><button type="button" class="qm-btn primary" data-qm-ok>확인</button></div></section>`;
    document.body.appendChild(modal);document.documentElement.style.overflow="hidden";return true;
  }

  /* WINDOW capture executes before the older document capture handler.
     This prevents render(true), which was moving the Sales table/menu on 조회. */
  window.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const query=target.closest(`#${HOST} [data-nse-query]`);
    if(!query)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openModal();
  },true);

  document.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    if(target.closest(`#${MODAL_ID} [data-qm-close]`)||target.closest(`#${MODAL_ID} [data-qm-ok]`)){event.preventDefault();closeModal();return;}
    const order=target.closest(`#${MODAL_ID} [data-qm-order]`);
    if(order){event.preventDefault();const id=clean(order.getAttribute("data-qm-order"));closeModal();window.qmesSalesOrderDetail?.open?.(id);return;}
    if(target.closest(`#${MODAL_ID} [data-qm-export]`)){event.preventDefault();document.querySelector(`#${HOST} [data-nse-export]`)?.click();}
  },true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.getElementById(MODAL_ID))closeModal();},true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  [100,300,800,1600].forEach(ms=>setTimeout(install,ms));
  window.addEventListener("qmes:enterprise-ui-ready",install);
  window.addEventListener("qmes:erp-data-changed",install);
  window.qmesSalesQueryResultModal={open:openModal,close:closeModal};
})();