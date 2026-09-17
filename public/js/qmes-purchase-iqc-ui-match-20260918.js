/* NAMO QMES - purchase page IQC-style UI match
 * 2026-09-18
 * Additive visual patch only.
 * - Keeps existing purchase data / search / save / edit logic unchanged.
 * - Matches purchase list layout to the Incoming Inspection management ledger.
 * - Existing purchase scripts remain untouched.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_IQC_UI_MATCH_20260918__) return;
  window.__QMES_PURCHASE_IQC_UI_MATCH_20260918__ = true;

  const STYLE_ID = 'qmes-purchase-iqc-ui-match-20260918-style';
  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  let queued = false;

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2{
  width:100%!important;
  max-width:none!important;
  margin:0!important;
  padding:0!important;
  color:#22384a!important;
  background:transparent!important;
  font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-shell{
  display:flex!important;
  flex-direction:column!important;
  gap:0!important;
  width:100%!important;
  min-width:0!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-head{
  min-height:54px!important;
  margin:0!important;
  padding:0 0 12px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:16px!important;
  border:0!important;
  border-bottom:1px solid #d9e3ea!important;
  background:#fff!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-title{
  margin:0!important;
  color:#13283e!important;
  font-size:18px!important;
  line-height:1.25!important;
  font-weight:900!important;
  letter-spacing:-.35px!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-sub{
  display:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-actions{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:6px!important;
  flex-wrap:wrap!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-actions .qpx-btn{
  height:34px!important;
  min-width:auto!important;
  margin:0!important;
  padding:0 12px!important;
  border:1px solid #b9c9d5!important;
  border-radius:6px!important;
  background:#fff!important;
  color:#365269!important;
  font-size:11px!important;
  font-weight:800!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-actions .qpx-btn.primary{
  border-color:#2187c7!important;
  background:#2187c7!important;
  color:#fff!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-cards{
  display:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter{
  margin:0!important;
  padding:12px 0 14px!important;
  border:0!important;
  border-radius:0!important;
  background:#fff!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-title{
  display:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-grid{
  display:grid!important;
  grid-template-columns:350px 155px 250px 145px 145px minmax(270px,1fr) 78px 78px!important;
  gap:0 10px!important;
  align-items:end!important;
  width:100%!important;
  min-width:0!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-field{
  display:flex!important;
  flex-direction:column!important;
  gap:6px!important;
  min-width:0!important;
  margin:0!important;
  padding:0!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-field>span:first-child{
  display:block!important;
  margin:0!important;
  padding:0!important;
  color:#68758a!important;
  font-size:10px!important;
  font-weight:800!important;
  line-height:12px!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-date-wrap{
  display:grid!important;
  grid-template-columns:minmax(0,1fr) 14px minmax(0,1fr)!important;
  gap:4px!important;
  align-items:center!important;
  width:100%!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-date-wrap>b{
  display:block!important;
  text-align:center!important;
  color:#7c8c9a!important;
  font-size:11px!important;
  font-weight:800!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-field input,
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-field select{
  display:block!important;
  width:100%!important;
  min-width:0!important;
  height:42px!important;
  min-height:42px!important;
  max-height:42px!important;
  margin:0!important;
  padding:0 11px!important;
  box-sizing:border-box!important;
  border:1px solid #b9c9d5!important;
  border-radius:10px!important;
  background:#fff!important;
  color:#26394b!important;
  font-size:12px!important;
  font-weight:650!important;
  line-height:40px!important;
  outline:none!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-field input::placeholder{
  color:#7c8b99!important;
  opacity:1!important;
  font-size:12px!important;
  font-weight:600!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-field input:focus,
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-field select:focus{
  border-color:#4d91c2!important;
  box-shadow:0 0 0 2px rgba(47,120,183,.10)!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-grid>.qpx-btn{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:78px!important;
  min-width:78px!important;
  max-width:78px!important;
  height:42px!important;
  min-height:42px!important;
  max-height:42px!important;
  margin:0!important;
  padding:0 8px!important;
  box-sizing:border-box!important;
  border:1px solid #b9c9d5!important;
  border-radius:10px!important;
  background:linear-gradient(180deg,#fff 0%,#e8eef3 100%)!important;
  color:#25384a!important;
  font-size:11px!important;
  font-weight:850!important;
  line-height:1!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-grid>.qpx-btn.primary{
  border-color:#1786c7!important;
  background:#1786c7!important;
  color:#fff!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-list-card{
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
  border:1px solid #d3dfe7!important;
  border-radius:0!important;
  background:#fff!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-tabs{
  display:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table-scroll{
  width:100%!important;
  min-height:0!important;
  max-height:none!important;
  overflow:auto!important;
  border:0!important;
  background:#fff!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table{
  width:100%!important;
  min-width:1450px!important;
  margin:0!important;
  border-collapse:collapse!important;
  border-spacing:0!important;
  table-layout:fixed!important;
  background:#fff!important;
  color:#405569!important;
  font-size:10px!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table thead th{
  position:static!important;
  top:auto!important;
  z-index:auto!important;
  height:46px!important;
  padding:8px 7px!important;
  background:linear-gradient(180deg,#7fb4d6 0%,#619bc2 100%)!important;
  color:#fff!important;
  border:0!important;
  border-right:1px solid rgba(255,255,255,.32)!important;
  border-bottom:1px solid #4f8ab2!important;
  font-size:10px!important;
  font-weight:900!important;
  line-height:1.2!important;
  text-align:center!important;
  vertical-align:middle!important;
  white-space:nowrap!important;
  text-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table thead th:last-child{
  border-right:0!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table tbody td{
  height:46px!important;
  padding:8px 7px!important;
  background:#fff!important;
  color:#405569!important;
  border:0!important;
  border-bottom:1px solid #dce5eb!important;
  font-size:10px!important;
  font-weight:600!important;
  line-height:1.25!important;
  text-align:center!important;
  vertical-align:middle!important;
  white-space:nowrap!important;
  text-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table tbody tr:nth-child(even) td{
  background:#f7fafc!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table tbody tr:hover td{
  background:#eaf4fb!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table td.left{
  text-align:left!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table td.num{
  text-align:right!important;
  font-variant-numeric:tabular-nums!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-link{
  color:#126ca8!important;
  font-size:10px!important;
  font-weight:850!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-badge{
  min-width:50px!important;
  height:24px!important;
  padding:0 8px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border-radius:6px!important;
  font-size:9px!important;
  font-weight:850!important;
  box-sizing:border-box!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-manage{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:5px!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-manage button{
  height:28px!important;
  min-width:38px!important;
  margin:0!important;
  padding:0 8px!important;
  border:1px solid #b9cbd8!important;
  border-radius:5px!important;
  background:#fff!important;
  color:#365269!important;
  font-size:9px!important;
  font-weight:850!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-manage button:first-child{
  border-color:#1786c7!important;
  background:#1786c7!important;
  color:#fff!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-table input[type="checkbox"]{
  width:20px!important;
  height:20px!important;
  margin:0!important;
  vertical-align:middle!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-foot{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:4px!important;
  min-height:54px!important;
  margin:0!important;
  padding:8px 12px!important;
  border:0!important;
  border-top:1px solid #dce5eb!important;
  background:#fff!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-page-size,
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-range{
  display:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-pages{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:4px!important;
  margin:0!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-page{
  width:auto!important;
  min-width:34px!important;
  height:34px!important;
  margin:0!important;
  padding:0 9px!important;
  border:1px solid #b8c7d4!important;
  border-radius:4px!important;
  background:#fff!important;
  color:#334b60!important;
  font-size:11px!important;
  font-weight:850!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-page.active{
  border-color:#0d659e!important;
  background:#0d659e!important;
  color:#fff!important;
}
html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-iqc-count{
  display:inline-flex!important;
  align-items:center!important;
  margin-left:10px!important;
  color:#6f8191!important;
  font-size:10px!important;
  font-weight:800!important;
  vertical-align:middle!important;
}
@media(max-width:1650px){
  html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-grid{
    grid-template-columns:300px 145px 220px 135px 135px minmax(240px,1fr) 76px 76px!important;
  }
}
@media(max-width:1350px){
  html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-grid{
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:10px!important;
  }
  html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-grid>.qpx-btn{
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
  }
}
@media(max-width:850px){
  html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-head{
    align-items:flex-start!important;
    flex-direction:column!important;
  }
  html body #root>div>main .qmes-purchase-live.qpx-enterprise-safe-v2 .qpx-filter-grid{
    grid-template-columns:1fr!important;
  }
}
`;
    document.head.appendChild(style);
  }

  function decorate(){
    queued = false;
    installStyle();

    const root = document.querySelector('.qmes-purchase-live.qpx-enterprise-safe-v2');
    if(!root) return;

    const host = root.querySelector('.qpx-enterprise-host');
    if(!host) return;

    const title = host.querySelector('.qpx-title');
    if(title && clean(title.textContent) !== '구매발주 관리대장'){
      title.textContent = '구매발주 관리대장';
    }

    const total = host.querySelector('.qpx-total-right');
    const titleParent = title && title.parentElement;
    if(titleParent){
      let count = titleParent.querySelector('.qpx-iqc-count');
      if(!count){
        count = document.createElement('span');
        count.className = 'qpx-iqc-count';
        title.insertAdjacentElement('afterend',count);
      }
      count.textContent = total ? clean(total.textContent) : '';
    }
  }

  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }

  function start(){
    installStyle();
    schedule();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    window.addEventListener('resize',schedule);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
