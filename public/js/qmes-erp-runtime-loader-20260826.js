/* QMES ERP runtime loader */
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

  async function load(){
    if(window.__QMES_ERP_INTEGRATED_20260826__) return;
    if(!window.Babel){
      console.error('[QMES ERP] Babel runtime is not available.');
      return;
    }
    try{
      /* Sales/Delivery must be derived from the actual work-order DB before the ERP
         React module reads its local/shared rows. This prevents old demo SO rows from
         flashing or being restored after F5. */
      await loadScript('./js/qmes-sales-demo-reset-20260826.js?v=20260826-workorder2','qmes-sales-from-workorder-20260826');
      if(window.__QMES_SALES_FROM_WORKORDER_READY__){
        try{await window.__QMES_SALES_FROM_WORKORDER_READY__;}catch(_error){}
      }

      const response=await fetch('./js/qmes-erp-integrated-20260826.jsx?v=20260826-workorder2',{cache:'no-store'});
      if(!response.ok) throw new Error('ERP module fetch failed: '+response.status);
      const source=await response.text();
      const compiled=window.Babel.transform(source,{presets:['react'],sourceType:'script',filename:'qmes-erp-integrated-20260826.jsx'}).code;
      (0,eval)(compiled);
      window.dispatchEvent(new CustomEvent('qmes:erp-runtime-loaded'));
    }catch(error){
      console.error('[QMES ERP] runtime load failed',error);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
