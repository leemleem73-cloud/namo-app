/* NAMO QMES - Live MRP product lock - 2026-08-31
 * Current product: 절연슬러리(NBA20-HM01)
 * Keeps Production Plan / MRP product aligned with the actual NAMO product.
 */
(function(){
  'use strict';
  if(window.__QMES_MRP_PRODUCT_NBA20_HM01_20260831_V1__) return;
  window.__QMES_MRP_PRODUCT_NBA20_HM01_20260831_V1__=true;

  const PRODUCT='절연슬러리(NBA20-HM01)';
  const HOST='#qmes-live-production-mrp-v2';

  function setNativeValue(input,value){
    if(!input) return false;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(!setter) return false;
    if(String(input.value||'')===value) return false;
    setter.call(input,value);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  function apply(){
    const host=document.querySelector(HOST);
    if(!host) return false;
    const input=host.querySelector('[data-product]');
    if(!input) return false;

    setNativeValue(input,PRODUCT);
    input.readOnly=true;
    input.setAttribute('aria-readonly','true');
    input.title='현재 나모케미칼 생산 제품: '+PRODUCT;
    input.placeholder=PRODUCT;

    const label=input.closest('.field')?.querySelector('label');
    if(label) label.textContent='제품명';

    let list=host.querySelector('#mrp-live-products');
    if(list&&!Array.from(list.options||[]).some(o=>String(o.value||'')===PRODUCT)){
      const option=document.createElement('option');
      option.value=PRODUCT;
      list.appendChild(option);
    }
    return true;
  }

  let queued=false;
  function scan(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  const observer=new MutationObserver(scan);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('qmes:erp-runtime-loaded',scan);
  window.addEventListener('qmes:inventory-reconciled',scan);
  document.addEventListener('click',e=>{
    const text=String(e.target?.closest?.('button,a,[role="button"]')?.textContent||'').replace(/\s+/g,'');
    if(text==='생산계획·MRP'||text==='생산계획MRP') setTimeout(scan,30);
  },true);
  [0,100,400,1000,2500].forEach(ms=>setTimeout(scan,ms));
})();
