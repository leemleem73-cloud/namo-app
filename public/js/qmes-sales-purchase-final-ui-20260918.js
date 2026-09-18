/* NAMO QMES - Sales/Due final purchase-order UI mirror
 * 2026-09-18
 * ADD-ONLY FINAL VISUAL PATCH.
 * Does not overwrite legacy Sales/ERP source or data logic.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_PURCHASE_FINAL_UI_20260918__) return;
  window.__QMES_SALES_PURCHASE_FINAL_UI_20260918__ = true;

  const HOST_ID='qmes-sales-purchase-ui-match-20260918';
  const STYLE_ID='qmes-sales-purchase-final-ui-20260918-style';
  const ROOT_CLASS='qmes-sales-purchase-final-ui';
  const PAGE_SIZE=10;
  let currentPage=1;
  let lastSignature='';
  let queued=false;

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS}{
  width:100%!important;
  max-width:none!important;
  margin:0!important;
  padding:0!important;
  color:#22384a!important;
  background:transparent!important;
  font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS}>.qerp-head{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} .qerp-title{
  margin:0!important;
  color:#13283e!important;
  font-size:18px!important;
  line-height:1.25!important;
  font-weight:900!important;
  letter-spacing:-.35px!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} .qerp-sub{
  display:block!important;
  margin:4px 0 0!important;
  padding:0!important;
  color:#6f8191!important;
  font-size:10px!important;
  line-height:1.2!important;
  font-weight:800!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} .qerp-head-actions{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:6px!important;
  flex-wrap:wrap!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} .qerp-head-actions button,
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} .qerp-head-actions .nse-import{
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
  line-height:32px!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} .qerp-head-actions .qerp-btn{
  border-color:#2187c7!important;
  background:#2187c7!important;
  color:#fff!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID}{
  margin:0!important;
  padding:0!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter{
  margin:0!important;
  padding:12px 0 14px!important;
  border:0!important;
  border-radius:0!important;
  background:#fff!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-title{
  display:none!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-grid{
  display:grid!important;
  grid-template-columns:350px 155px 250px 145px 145px minmax(270px,1fr) 78px 78px!important;
  gap:0 10px!important;
  align-items:end!important;
  width:100%!important;
  min-width:0!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-field{
  display:flex!important;
  flex-direction:column!important;
  gap:6px!important;
  min-width:0!important;
  margin:0!important;
  padding:0!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-field>span:first-child{
  display:block!important;
  margin:0!important;
  padding:0!important;
  color:#68758a!important;
  font-size:10px!important;
  font-weight:800!important;
  line-height:12px!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-date{
  display:grid!important;
  grid-template-columns:minmax(0,1fr) 14px minmax(0,1fr)!important;
  gap:4px!important;
  align-items:center!important;
  width:100%!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-date>b{
  display:block!important;
  text-align:center!important;
  color:#7c8c9a!important;
  font-size:11px!important;
  font-weight:800!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} input,
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} select{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} input::placeholder{
  color:#7c8b99!important;
  opacity:1!important;
  font-size:12px!important;
  font-weight:600!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} input:focus,
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} select:focus{
  border-color:#4d91c2!important;
  box-shadow:0 0 0 2px rgba(47,120,183,.10)!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-grid>button{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-grid>button.primary{
  border-color:#1786c7!important;
  background:#1786c7!important;
  color:#fff!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-list{
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
  border:1px solid #d3dfe7!important;
  border-radius:0!important;
  background:#fff!important;
  box-shadow:none!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-table-wrap{
  width:100%!important;
  min-height:0!important;
  max-height:none!important;
  overflow:auto!important;
  border:0!important;
  background:#fff!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} table{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} thead th{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} thead th:last-child{
  border-right:0!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} tbody td{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} tbody tr:nth-child(even) td{
  background:#f7fafc!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} tbody tr:hover td{
  background:#eaf4fb!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} td.left{
  text-align:left!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} td.num{
  text-align:right!important;
  font-variant-numeric:tabular-nums!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-link{
  color:#126ca8!important;
  font-size:10px!important;
  font-weight:850!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-badge{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-manage{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:5px!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-manage button{
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
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-manage button:first-child{
  border-color:#1786c7!important;
  background:#1786c7!important;
  color:#fff!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-foot{
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
  color:transparent!important;
  font-size:0!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-pages{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:4px!important;
  margin:0!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-page{
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
  line-height:32px!important;
  box-shadow:none!important;
  cursor:pointer!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-page.active{
  border-color:#0d659e!important;
  background:#0d659e!important;
  color:#fff!important;
}
html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-page:disabled{
  opacity:.45!important;
  cursor:default!important;
}
@media(max-width:1650px){
  html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-grid{
    grid-template-columns:300px 145px 220px 135px 135px minmax(240px,1fr) 76px 76px!important;
  }
}
@media(max-width:1350px){
  html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-grid{
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:10px!important;
  }
  html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-grid>button{
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
  }
}
@media(max-width:850px){
  html body #root>div>main .qmes-sales-stable.${ROOT_CLASS}>.qerp-head{
    align-items:flex-start!important;
    flex-direction:column!important;
  }
  html body #root>div>main .qmes-sales-stable.${ROOT_CLASS} #${HOST_ID} .qsp-filter-grid{
    grid-template-columns:1fr!important;
  }
}
`;
    document.head.appendChild(s);
  }

  function sourceRows(host){
    const tbody=host&&host.querySelector('tbody');
    if(!tbody) return [];
    return Array.from(tbody.children).filter(row=>row.tagName==='TR'&&!row.querySelector('.qsp-empty'));
  }

  function signature(rows){
    return rows.map(row=>clean(row.textContent)).join('|');
  }

  function renderPager(host){
    if(!host) return;
    const rows=sourceRows(host);
    const sig=signature(rows);
    if(sig!==lastSignature){
      lastSignature=sig;
      currentPage=1;
    }

    const pageCount=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    if(currentPage>pageCount) currentPage=pageCount;

    rows.forEach((row,index)=>{
      const page=Math.floor(index/PAGE_SIZE)+1;
      row.style.setProperty('display',page===currentPage?'table-row':'none','important');
    });

    const foot=host.querySelector('.qsp-foot');
    if(!foot) return;

    let pages=foot.querySelector('.qsp-pages');
    if(!pages){
      foot.textContent='';
      pages=document.createElement('div');
      pages.className='qsp-pages';
      foot.appendChild(pages);
    }

    const pageButtons=[];
    pageButtons.push('<button type="button" class="qsp-page" data-qsp-page="first" '+(currentPage===1?'disabled':'')+'>«</button>');
    pageButtons.push('<button type="button" class="qsp-page" data-qsp-page="prev" '+(currentPage===1?'disabled':'')+'>‹</button>');

    const start=Math.max(1,Math.min(currentPage-2,pageCount-4));
    const end=Math.min(pageCount,start+4);
    for(let p=start;p<=end;p++){
      pageButtons.push('<button type="button" class="qsp-page '+(p===currentPage?'active':'')+'" data-qsp-page="'+p+'">'+p+'</button>');
    }

    pageButtons.push('<button type="button" class="qsp-page" data-qsp-page="next" '+(currentPage===pageCount?'disabled':'')+'>›</button>');
    pageButtons.push('<button type="button" class="qsp-page" data-qsp-page="last" '+(currentPage===pageCount?'disabled':'')+'>»</button>');
    pages.innerHTML=pageButtons.join('');
  }

  function decorate(){
    queued=false;
    installStyle();

    const root=document.querySelector('.qmes-sales-stable');
    if(!root) return;

    const baseApi=window.qmesSalesPurchaseUiMatch20260918;
    if(baseApi&&typeof baseApi.ensure==='function'){
      try{baseApi.ensure();}catch(_error){}
    }

    root.classList.add(ROOT_CLASS);

    const title=root.querySelector(':scope > .qerp-head .qerp-title');
    if(title) title.textContent='수주·납기 관리대장';

    const host=document.getElementById(HOST_ID);
    if(!host) return;

    renderPager(host);

    const count=sourceRows(host).length;
    const sub=root.querySelector(':scope > .qerp-head .qerp-sub');
    if(sub) sub.textContent='총 '+count+'건';
  }

  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(decorate);
  }

  function pageAction(value){
    const host=document.getElementById(HOST_ID);
    if(!host) return;
    const rows=sourceRows(host);
    const pageCount=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    if(value==='first') currentPage=1;
    else if(value==='prev') currentPage=Math.max(1,currentPage-1);
    else if(value==='next') currentPage=Math.min(pageCount,currentPage+1);
    else if(value==='last') currentPage=pageCount;
    else {
      const n=Number(value);
      if(Number.isInteger(n)&&n>=1&&n<=pageCount) currentPage=n;
    }
    renderPager(host);
  }

  function start(){
    installStyle();
    schedule();

    document.addEventListener('click',event=>{
      const target=event.target instanceof Element?event.target:null;
      if(!target) return;
      const page=target.closest('[data-qsp-page]');
      if(page){
        event.preventDefault();
        pageAction(clean(page.getAttribute('data-qsp-page')));
      }
    },true);

    ['qmes:erp-runtime-loaded','qmes:mes-master-ready','qmes:enterprise-ui-ready','qmes:erp-data-changed','qmes:data-updated','qmes:shared-sync-complete','qmes:navigate-tab'].forEach(name=>window.addEventListener(name,schedule));
    window.addEventListener('hashchange',schedule);
    window.addEventListener('popstate',schedule);
    window.addEventListener('resize',schedule);

    new MutationObserver(mutations=>{
      const relevant=mutations.some(mutation=>{
        const target=mutation.target&&mutation.target.nodeType===1?mutation.target:mutation.target&&mutation.target.parentElement;
        return !(target&&target.closest&&target.closest('.qsp-pages'));
      });
      if(relevant) schedule();
    }).observe(document.body,{childList:true,subtree:true,characterData:true});

    [80,180,350,700,1200,2200,4000,6500].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
