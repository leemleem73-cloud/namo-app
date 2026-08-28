/* NAMO QMES - Sales table font unify + query result modal V2 - 2026-08-28
 * Visual/query patch only.
 * - Unifies typography across Sales table cells.
 * - Makes the Sales '조회' button open a centered actual-data result modal.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FONT_UNIFY_20260828_V1__)return;
  window.__QMES_SALES_FONT_UNIFY_20260828_V1__=true;

  const HOST="qmes-sales-enterprise-module-v2";
  const STYLE_ID="qmes-sales-font-unify-style-20260828-v1";
  const MODAL_ID="qmes-sales-query-result-modal-20260828-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function install(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${HOST},
      #${HOST} table,
      #${HOST} thead,
      #${HOST} tbody,
      #${HOST} tr,
      #${HOST} th,
      #${HOST} td,
      #${HOST} th *,
      #${HOST} td *{
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        font-style:normal!important;
        letter-spacing:-.01em!important;
        font-variant-numeric:tabular-nums!important;
      }
      #${HOST} th,#${HOST} th *{font-size:10.5px!important;font-weight:800!important;line-height:1.2!important}
      #${HOST} td,#${HOST} td *{font-size:11.5px!important;font-weight:700!important;line-height:1.25!important}
      #${HOST} .order{font-size:11.5px!important;font-weight:700!important}
      #${HOST} .nse-prod-wrap{font-size:11.5px!important;font-weight:700!important}
      #${HOST} .st{font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;font-size:10.5px!important;font-weight:700!important;letter-spacing:-.01em!important}
      #${HOST} td:nth-child(6),#${HOST} td:nth-child(6) *,#${HOST} td:nth-child(7),#${HOST} td:nth-child(7) *,#${HOST} td:nth-child(8),#${HOST} td:nth-child(8) *{font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;font-weight:700!important}

      #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483600!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(15,23,42,.34)!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${MODAL_ID} *{box-sizing:border-box!important}
      #${MODAL_ID} .nsq-card{width:min(1060px,95vw)!important;max-height:88vh!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dfe5ed!important;border-radius:16px!important;box-shadow:0 28px 80px rgba(15,23,42,.25)!important;overflow:hidden!important}
      #${MODAL_ID} .nsq-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:14px!important;padding:18px 20px 14px!important;border-bottom:1px solid #e8edf3!important}
      #${MODAL_ID} .nsq-title{font-size:19px!important;font-weight:950!important;color:#182238!important;letter-spacing:-.02em!important}
      #${MODAL_ID} .nsq-sub{margin-top:4px!important;font-size:10px!important;color:#8a96a8!important;font-weight:700!important}
      #${MODAL_ID} .nsq-close{width:36px!important;height:36px!important;border:0!important;border-radius:9px!important;background:#f4f6f9!important;color:#334155!important;font-size:22px!important;cursor:pointer!important}
      #${MODAL_ID} .nsq-body{overflow:auto!important;padding:16px 20px 18px!important}
      #${MODAL_ID} .nsq-note{margin-bottom:12px!important;padding:9px 11px!important;border:1px dashed #d4deeb!important;border-radius:8px!important;background:#f9fbfd!important;color:#7a8798!important;font-size:9.5px!important;font-weight:700!important}
      #${MODAL_ID} .nsq-meta{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin-bottom:12px!important}
      #${MODAL_ID} .nsq-chip{display:inline-flex!important;align-items:center!important;min-height:28px!important;padding:0 9px!important;border-radius:7px!important;background:#f1f5f9!important;color:#526072!important;font-size:9.5px!important;font-weight:800!important}
      #${MODAL_ID} .nsq-table-wrap{overflow:auto!important;border:1px solid #e1e7ef!important;border-radius:11px!important}
      #${MODAL_ID} table{width:100%!important;min-width:900px!important;border-collapse:collapse!important;table-layout:fixed!important}
      #${MODAL_ID} th,#${MODAL_ID} td{height:46px!important;padding:0 11px!important;border-bottom:1px solid #edf1f5!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}
      #${MODAL_ID} th{background:#fafbfd!important;color:#697589!important;font-size:10px!important;font-weight:800!important}
      #${MODAL_ID} td{background:#fff!important;color:#253047!important;font-size:11px!important;font-weight:700!important}
      #${MODAL_ID} tbody tr:last-child td{border-bottom:0!important}
      #${MODAL_ID} .nsq-order{border:0!important;background:transparent!important;color:#2457d6!important;font:inherit!important;font-weight:700!important;text-decoration:underline!important;text-underline-offset:3px!important;cursor:pointer!important}
      #${MODAL_ID} .nsq-status{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:60px!important;height:24px!important;padding:0 8px!important;border-radius:999px!important;background:#eaf7ef!important;color:#187b43!important;font-size:9.5px!important;font-weight:700!important}
      #${MODAL_ID} .nsq-empty{padding:34px!important;text-align:center!important;color:#94a3b8!important;font-size:11px!important}
      #${MODAL_ID} .nsq-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 20px 16px!important;border-top:1px solid #e8edf3!important;background:#fff!important}
      #${MODAL_ID} .nsq-btn{height:39px!important;padding:0 14px!important;border:1px solid #d7dee8!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-family:inherit!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer!important}
      #${MODAL_ID} .nsq-btn.soft{background:#eef4ff!important;border-color:#d7e4ff!important;color:#2853cc!important}
      #${MODAL_ID} .nsq-btn.primary{background:#285bd8!important;border-color:#285bd8!important;color:#fff!important}
      @media(max-width:720px){#${MODAL_ID}{padding:8px!important;align-items:flex-start!important}#${MODAL_ID} .nsq-card{max-height:98vh!important}}
    `;
    document.head.appendChild(s);
  }

  function readVisibleRows(){
    const host=document.getElementById(HOST);
    if(!host)return [];
    return Array.from(host.querySelectorAll("tbody tr")).map(tr=>{
      const cells=Array.from(tr.children);
      if(cells.length<8)return null;
      return {
        id:clean(cells[0]?.textContent),
        customer:clean(cells[1]?.textContent),
        product:clean(cells[2]?.textContent),
        qty:clean(cells[3]?.textContent),
        due:clean(cells[4]?.textContent),
        production:clean(cells[5]?.textContent),
        shipment:clean(cells[6]?.textContent),
        status:clean(cells[7]?.textContent)
      };
    }).filter(Boolean);
  }

  function closeModal(){
    document.getElementById(MODAL_ID)?.remove();
    document.documentElement.style.overflow="";
  }

  function openModal(){
    install();
    closeModal();
    const host=document.getElementById(HOST);
    if(!host)return;
    const q=clean(host.querySelector("[data-nse-q]")?.value)||"전체";
    const status=clean(host.querySelector("[data-nse-status]")?.value)||"전체 상태";
    const data=readVisibleRows();
    const modal=document.createElement("div");
    modal.id=MODAL_ID;
    modal.innerHTML=`<section class="nsq-card" role="dialog" aria-modal="true" aria-label="조회 결과"><div class="nsq-head"><div><div class="nsq-title">조회 결과</div><div class="nsq-sub">검색 조건에 따른 수주 데이터 조회</div></div><button type="button" class="nsq-close" data-nsq-close aria-label="닫기">×</button></div><div class="nsq-body"><div class="nsq-note">현재 수주 Master와 연결된 생산계획·출하 상태를 기준으로 조회한 결과입니다.</div><div class="nsq-meta"><span class="nsq-chip">검색: ${esc(q)}</span><span class="nsq-chip">상태: ${esc(status)}</span><span class="nsq-chip">결과: ${data.length.toLocaleString("ko-KR")}건</span></div><div class="nsq-table-wrap"><table><thead><tr><th>수주번호</th><th>고객사</th><th>제품</th><th>수량</th><th>납기</th><th>생산계획</th><th>출하</th><th>상태</th></tr></thead><tbody>${data.length?data.map(x=>`<tr><td><button type="button" class="nsq-order" data-nsq-order="${esc(x.id)}">${esc(x.id)}</button></td><td>${esc(x.customer)}</td><td>${esc(x.product)}</td><td>${esc(x.qty)}</td><td>${esc(x.due)}</td><td>${esc(x.production)}</td><td>${esc(x.shipment)}</td><td><span class="nsq-status">${esc(x.status)}</span></td></tr>`).join(""):`<tr><td colspan="8"><div class="nsq-empty">조회 조건에 해당하는 수주가 없습니다.</div></td></tr>`}</tbody></table></div></div><div class="nsq-actions"><button type="button" class="nsq-btn" data-nsq-close>닫기</button><button type="button" class="nsq-btn soft" data-nsq-export>엑셀</button><button type="button" class="nsq-btn primary" data-nsq-ok>확인</button></div></section>`;
    document.body.appendChild(modal);
    document.documentElement.style.overflow="hidden";
  }

  document.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element))return;

    if(target.closest(`#${MODAL_ID} [data-nsq-close]`)||target.closest(`#${MODAL_ID} [data-nsq-ok]`)){
      event.preventDefault();
      closeModal();
      return;
    }
    const order=target.closest(`#${MODAL_ID} [data-nsq-order]`);
    if(order){
      event.preventDefault();
      const id=clean(order.getAttribute("data-nsq-order"));
      closeModal();
      window.qmesSalesOrderDetail?.open?.(id);
      return;
    }
    if(target.closest(`#${MODAL_ID} [data-nsq-export]`)){
      event.preventDefault();
      document.querySelector(`#${HOST} [data-nse-export]`)?.click();
      return;
    }

    if(target.closest(`#${HOST} [data-nse-query]`)){
      /* Enterprise V2's earlier capture listener first applies the filter synchronously. */
      setTimeout(openModal,0);
    }
  },true);

  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.getElementById(MODAL_ID))closeModal();},true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  [100,300,800,1600].forEach(ms=>setTimeout(install,ms));
  window.addEventListener("qmes:enterprise-ui-ready",install);
  window.addEventListener("qmes:erp-data-changed",install);
  window.qmesSalesQueryResultModal={open:openModal,close:closeModal};
})();