/* QMES inventory premium UI — additive visual patch */
(function(){
  'use strict';
  if(window.__QMES_INVENTORY_PREMIUM_UI_20260813__) return;
  window.__QMES_INVENTORY_PREMIUM_UI_20260813__=true;

  const style=document.createElement('style');
  style.id='qmes-inventory-premium-style';
  style.textContent=`
    body.qmes-inventory-premium #root>div>main{background:#071426!important;color:#e8f1fb!important}
    body.qmes-inventory-premium #root>div>main>div{background:transparent!important}
    body.qmes-inventory-premium #root>div>main .bg-white,
    body.qmes-inventory-premium #root>div>main .bg-slate-50,
    body.qmes-inventory-premium #root>div>main .bg-gray-50,
    body.qmes-inventory-premium #root>div>main .bg-gray-100{background:#0d2138!important;color:#e8f1fb!important}
    body.qmes-inventory-premium #root>div>main .border-slate-200,
    body.qmes-inventory-premium #root>div>main .border-gray-200,
    body.qmes-inventory-premium #root>div>main .border-slate-300{border-color:#244866!important}
    body.qmes-inventory-premium #root>div>main .text-slate-900,
    body.qmes-inventory-premium #root>div>main .text-gray-900,
    body.qmes-inventory-premium #root>div>main .text-slate-800,
    body.qmes-inventory-premium #root>div>main .text-gray-800{color:#f3f8fd!important}
    body.qmes-inventory-premium #root>div>main .text-slate-700,
    body.qmes-inventory-premium #root>div>main .text-gray-700,
    body.qmes-inventory-premium #root>div>main .text-slate-600,
    body.qmes-inventory-premium #root>div>main .text-gray-600{color:#b8c9da!important}
    body.qmes-inventory-premium #root>div>main .text-slate-500,
    body.qmes-inventory-premium #root>div>main .text-gray-500,
    body.qmes-inventory-premium #root>div>main .text-slate-400{color:#8ea6bc!important}

    body.qmes-inventory-premium #root>div>main table{border-collapse:separate!important;border-spacing:0!important;background:#0b1c30!important;border:1px solid #234765!important;border-radius:12px!important;overflow:hidden!important;box-shadow:0 10px 24px rgba(0,0,0,.18)!important}
    body.qmes-inventory-premium #root>div>main thead tr{background:linear-gradient(180deg,#173858 0%,#132e49 100%)!important}
    body.qmes-inventory-premium #root>div>main thead th{color:#9fc5e7!important;font-weight:800!important;letter-spacing:.01em!important;border-bottom:1px solid #2a5273!important;padding-top:12px!important;padding-bottom:12px!important}
    body.qmes-inventory-premium #root>div>main tbody tr{background:#0d2138!important;transition:background .15s ease,transform .15s ease!important}
    body.qmes-inventory-premium #root>div>main tbody tr:nth-child(even){background:#10263f!important}
    body.qmes-inventory-premium #root>div>main tbody tr:hover{background:#16324f!important}
    body.qmes-inventory-premium #root>div>main tbody td{color:#dce8f4!important;border-bottom:1px solid rgba(48,84,116,.55)!important;padding-top:13px!important;padding-bottom:13px!important}
    body.qmes-inventory-premium #root>div>main tbody tr:last-child td{border-bottom:0!important}

    body.qmes-inventory-premium #root>div>main .text-sky-300{color:#69c7ff!important;font-weight:800!important}
    body.qmes-inventory-premium #root>div>main .text-emerald-300{color:#52e0b1!important}
    body.qmes-inventory-premium #root>div>main .text-rose-300{color:#fb8ca2!important}
    body.qmes-inventory-premium #root>div>main .text-amber-300{color:#ffd36b!important}

    body.qmes-inventory-premium #root>div>main input,
    body.qmes-inventory-premium #root>div>main select{background:#091a2d!important;border-color:#315c7c!important;color:#eef6ff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.01)!important}
    body.qmes-inventory-premium #root>div>main input:focus,
    body.qmes-inventory-premium #root>div>main select:focus{outline:none!important;border-color:#38bdf8!important;box-shadow:0 0 0 3px rgba(56,189,248,.12)!important}

    body.qmes-inventory-premium #root>div>main button{transition:transform .12s ease,filter .12s ease,background .12s ease!important}
    body.qmes-inventory-premium #root>div>main button:hover{filter:brightness(1.08)!important}

    body.qmes-inventory-premium #root>div>main .rounded-xl,
    body.qmes-inventory-premium #root>div>main .rounded-lg{box-shadow:0 8px 22px rgba(0,0,0,.14)!important}

    body.qmes-inventory-premium #root>div>main [class*="bg-rose-"],
    body.qmes-inventory-premium #root>div>main [class*="bg-red-"]{background:rgba(127,29,29,.28)!important}
    body.qmes-inventory-premium #root>div>main [class*="border-rose-"]{border-color:#9f3650!important}

    body.qmes-inventory-premium #root>div>main::-webkit-scrollbar,
    body.qmes-inventory-premium #root>div>main *::-webkit-scrollbar{height:9px;width:9px}
    body.qmes-inventory-premium #root>div>main::-webkit-scrollbar-thumb,
    body.qmes-inventory-premium #root>div>main *::-webkit-scrollbar-thumb{background:#315674;border-radius:999px}
    body.qmes-inventory-premium #root>div>main::-webkit-scrollbar-track,
    body.qmes-inventory-premium #root>div>main *::-webkit-scrollbar-track{background:#0a1728}
  `;
  document.head.appendChild(style);

  function sync(){
    const title=String(document.querySelector('#qmes-sync-sidebar .qmes-side-title')?.textContent||'').trim();
    const top=Array.from(document.querySelectorAll('.qmes-top-menu-button')).find(b=>String(b.textContent||'').replace(/\s+/g,' ').trim()==='재고관리');
    const active=title==='재고관리' || !!top?.classList.contains('active') || !!top?.classList.contains('is-active');
    document.body.classList.toggle('qmes-inventory-premium',active);
  }

  document.addEventListener('click',()=>setTimeout(sync,0),true);
  window.addEventListener('load',sync);
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  setTimeout(sync,200);
})();
