/* QMES ERP runtime loader */
(function(){
  if(window.__QMES_ERP_RUNTIME_LOADER_20260826__) return;
  window.__QMES_ERP_RUNTIME_LOADER_20260826__=true;

  async function load(){
    if(window.__QMES_ERP_INTEGRATED_20260826__) return;
    if(!window.Babel){
      console.error('[QMES ERP] Babel runtime is not available.');
      return;
    }
    try{
      const response=await fetch('./js/qmes-erp-integrated-20260826.jsx?v=20260826-1',{cache:'no-store'});
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
