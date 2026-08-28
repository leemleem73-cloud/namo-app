/* NAMO QMES - Shipping HTML Match V2 - 2026-08-28
 * ADD-ONLY visual polish over qmes-shipping-enterprise-module-20260828-v1.js.
 * Matches the provided Enterprise 출하 / 물류 reference while preserving current data/actions.
 */
(function(){
  "use strict";
  if(window.__QMES_SHIPPING_HTML_MATCH_20260828_V2__)return;
  window.__QMES_SHIPPING_HTML_MATCH_20260828_V2__=true;

  const HOST="qmes-shipping-enterprise-module-20260828-v1";
  const STYLE="qmes-shipping-html-match-style-20260828-v2";
  let queued=false;
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

  function ensureStyle(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement("style");
    s.id=STYLE;
    s.textContent=`
      #${HOST}{font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;color:#172033!important}
      #${HOST} .nsh-page-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:18px!important;margin:0 0 18px!important;padding:0!important}
      #${HOST} .nsh-page-title-wrap{display:flex!important;align-items:flex-start!important;gap:24px!important;min-width:0!important}
      #${HOST} .nsh-page-title h1{margin:0!important;font-size:20px!important;font-weight:950!important;letter-spacing:-.025em!important;color:#172033!important}
      #${HOST} .nsh-page-title p{margin:5px 0 0!important;font-size:11px!important;color:#6b7280!important;font-weight:650!important}
      #${HOST} .nsh-search{position:relative!important;width:360px!important;max-width:38vw!important}
      #${HOST} .nsh-search:before{content:"⌕";position:absolute!important;left:12px!important;top:50%!important;transform:translateY(-50%)!important;color:#91a0b5!important;font-size:14px!important;pointer-events:none!important}
      #${HOST} .nsh-search input{width:100%!important;height:40px!important;padding:0 12px 0 34px!important;border:1px solid #d8e0eb!important;border-radius:10px!important;background:#fff!important;color:#334155!important;font-family:inherit!important;font-size:11px!important;outline:none!important}
      #${HOST} .nsh-search input:focus{border-color:#9cb8fb!important;box-shadow:0 0 0 3px rgba(49,91,221,.07)!important}

      #${HOST} .nsh-hero{min-height:94px!important;padding:18px 20px!important;margin-bottom:16px!important;border:1px solid #dde6f1!important;border-radius:14px!important;background:#fff!important;box-shadow:none!important}
      #${HOST} .nsh-hero h1{font-size:18px!important;font-weight:950!important;margin:0 0 7px!important;letter-spacing:-.02em!important}
      #${HOST} .nsh-hero p{font-size:11px!important;color:#697386!important;font-weight:650!important;margin:0!important}
      #${HOST} .nsh-actions{align-self:center!important}
      #${HOST} .nsh-btn{height:39px!important;padding:0 14px!important;border-radius:9px!important;font-size:11px!important;font-weight:850!important}
      #${HOST} .nsh-btn.primary{background:#2d5ed7!important;border-color:#2d5ed7!important}

      #${HOST} .nsh-card{border:1px solid #e1e7ef!important;border-radius:14px!important;box-shadow:none!important;background:#fff!important}
      #${HOST} .nsh-wrap{overflow:auto!important}
      #${HOST} table{min-width:1040px!important;table-layout:fixed!important;border-collapse:collapse!important}
      #${HOST} th,#${HOST} td{height:49px!important;padding:0 16px!important;border-bottom:1px solid #edf1f5!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-family:inherit!important;text-align:left!important}
      #${HOST} th{background:#fafbfd!important;color:#687386!important;font-size:10.5px!important;font-weight:800!important}
      #${HOST} td{background:#fff!important;color:#263247!important;font-size:11.5px!important;font-weight:700!important}
      #${HOST} th:nth-child(6),#${HOST} td:nth-child(6),#${HOST} th:nth-child(8),#${HOST} td:nth-child(8){text-align:center!important}
      #${HOST} .nsh-link{font-size:11.5px!important;font-weight:750!important;color:#2457d6!important}
      #${HOST} .nsh-status{font-size:9.5px!important;font-weight:800!important;min-width:58px!important;height:24px!important}
      #${HOST} .nsh-count{display:none!important}

      @media(max-width:900px){
        #${HOST} .nsh-page-title-wrap{flex-direction:column!important;gap:12px!important}
        #${HOST} .nsh-search{width:100%!important;max-width:none!important}
      }
      @media(max-width:760px){#${HOST} .nsh-page-head{flex-direction:column!important}}
    `;
    document.head.appendChild(s);
  }

  function filterRows(host,value){
    const q=clean(value).toLowerCase();
    host.querySelectorAll("tbody tr").forEach(tr=>{
      if(tr.querySelector(".nsh-empty"))return;
      tr.style.display=!q||clean(tr.textContent).toLowerCase().includes(q)?"":"none";
    });
  }

  function apply(){
    ensureStyle();
    const host=document.getElementById(HOST);
    if(!host)return;

    let pageHead=host.querySelector(":scope > .nsh-page-head");
    if(!pageHead){
      pageHead=document.createElement("section");
      pageHead.className="nsh-page-head";
      pageHead.innerHTML=`<div class="nsh-page-title-wrap"><div class="nsh-page-title"><h1>출하 / 물류</h1><p>OQC 합격 LOT 기반 출하 및 물류를 관리합니다.</p></div><label class="nsh-search"><input type="search" data-nsh-search placeholder="수주번호, LOT, 품목, 고객사 통합검색" autocomplete="off"></label></div>`;
      host.insertBefore(pageHead,host.firstChild);
      const input=pageHead.querySelector("[data-nsh-search]");
      input?.addEventListener("input",()=>filterRows(host,input.value));
    }

    const hero=host.querySelector(".nsh-hero");
    if(hero){
      const title=hero.querySelector("h1");
      const sub=hero.querySelector("p");
      if(title&&clean(title.textContent)!=="출하 / 물류")title.textContent="출하 / 물류";
      if(sub&&clean(sub.textContent)!=="OQC 합격 LOT만 출하 가능하도록 제어하고, 수주·매출과 연계합니다.")sub.textContent="OQC 합격 LOT만 출하 가능하도록 제어하고, 수주·매출과 연계합니다.";
    }

    const input=host.querySelector("[data-nsh-search]");
    if(input&&input.value)filterRows(host,input.value);
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  function boot(){apply();[80,180,350,700,1200,2200,4000].forEach(ms=>setTimeout(apply,ms));new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});}

  ["qmes:enterprise-ui-ready","qmes:mes-master-ready","qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener("hashchange",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesShippingHtmlMatch={apply};
})();
