/* QMES ERP runtime loader — stable first paint 2026-08-27 */
(function(){
  if(window.__QMES_ERP_RUNTIME_LOADER_20260826__) return;
  window.__QMES_ERP_RUNTIME_LOADER_20260826__=true;

  function loadScript(src,id){
    return new Promise((resolve,reject)=>{
      if(id&&document.getElementById(id)){resolve();return;}
      const script=document.createElement('script');
      if(id) script.id=id;
      script.src=src;
      script.async=false;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error('Script load failed: '+src));
      document.head.appendChild(script);
    });
  }

  function ensureStableSalesStyle(){
    if(document.getElementById('qmes-sales-stable-firstpaint-20260827')) return;
    const style=document.createElement('style');
    style.id='qmes-sales-stable-firstpaint-20260827';
    style.textContent=`
      .qmes-sales-stable .qmes-sales-plain-status{display:inline-block!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;font-size:11px!important;font-weight:850!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-plain-status.good{color:#15803d!important}.qmes-sales-stable .qmes-sales-plain-status.warn{color:#c2410c!important}.qmes-sales-stable .qmes-sales-plain-status.bad{color:#b91c1c!important}.qmes-sales-stable .qmes-sales-plain-status.neutral{color:#64748b!important}
      .qmes-sales-stable .qmes-sales-packaging-missing{display:inline-block!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#c2410c!important;font-size:11px!important;font-weight:850!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-packaging-text{font-size:11px!important;font-weight:850!important;color:#334155!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-subtext{display:block!important;margin-top:2px!important;color:#64748b!important;font-size:9px!important;font-weight:700!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-action-head,.qmes-sales-stable .qmes-sales-action-cell{width:108px!important;min-width:108px!important;text-align:center!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-action-wrap{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;white-space:nowrap!important}
      .qmes-sales-stable .qmes-sales-edit-btn,.qmes-sales-stable .qmes-sales-delete-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;height:30px!important;padding:0 8px!important;border-radius:6px!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important;background:#fff!important}
      .qmes-sales-stable .qmes-sales-edit-btn{border:1px solid #bfdbfe!important;color:#1d4ed8!important;background:#eff6ff!important}.qmes-sales-stable .qmes-sales-delete-btn{border:1px solid #fecaca!important;color:#b91c1c!important}
      .qmes-sales-stable .qmes-sales-order-link{border:0!important;background:transparent!important;color:#1d4ed8!important;font:inherit!important;font-weight:950!important;cursor:pointer!important;padding:0!important;text-decoration:underline!important;text-underline-offset:3px!important}
      .qmes-sales-stable #qmes-sales-progress-button-20260826{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important;border-radius:8px!important;padding:9px 12px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}
      .qmes-sales-stable .qerp-sales-compact-form{visibility:visible!important;opacity:1!important}
    `;
    document.head.appendChild(style);
  }


  function patchStableSales(source){
    const start=source.indexOf('  function QMESErpSalesTab(){');
    const end=source.indexOf('\n\n  function QMESErpPlanTab(){',start);
    if(start<0||end<0) throw new Error('Sales component markers not found');
    const currentProxy=[
      '  function QMESErpSalesTab(){',
      '    const Current=window.__QMES_CURRENT_SALES_LEDGER_COMPONENT__||window.QMESErpSalesTab;',
      '    if(!Current||Current===QMESErpSalesTab) return null;',
      '    return React.createElement(Current);',
      '  }'
    ].join('\n');
    return source.slice(0,start)+currentProxy+source.slice(end);
  }

  async function load(){
    if(window.__QMES_ERP_INTEGRATED_20260826__) return;
    if(!window.Babel){console.error('[QMES ERP] Babel runtime is not available.');return;}
    try{
      ensureStableSalesStyle();
      await loadScript('./js/qmes-sales-demo-reset-20260826.js?v=20260827-manual-product2','qmes-sales-from-workorder-20260826');
      if(window.__QMES_SALES_FROM_WORKORDER_READY__){try{await window.__QMES_SALES_FROM_WORKORDER_READY__;}catch(_error){}}
      const response=await fetch('./js/qmes-erp-integrated-20260826.jsx?v=20260827-manual-product2',{cache:'no-store'});
      if(!response.ok) throw new Error('ERP module fetch failed: '+response.status);
      const originalSource=await response.text();
      const source=patchStableSales(originalSource);
      const compiled=window.Babel.transform(source,{presets:['react'],sourceType:'script',filename:'qmes-erp-integrated-20260826.jsx'}).code;
      (0,eval)(compiled);
      window.dispatchEvent(new CustomEvent('qmes:erp-runtime-loaded'));
    }catch(error){console.error('[QMES ERP] runtime load failed',error);}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
