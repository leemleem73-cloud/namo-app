/* QMES header structure adapter — match uploaded NAMO ONE reference without touching page modules */
(function(){
  "use strict";
  if(window.__QMES_HEADER_REFERENCE_STRUCTURE_V1__) return;
  window.__QMES_HEADER_REFERENCE_STRUCTURE_V1__=true;

  function ensureHeader(){
    const header=document.querySelector('#root > div > header');
    if(!header) return false;
    const row=header.firstElementChild;
    const brand=row?.querySelector(':scope > button:first-child');
    if(!row||!brand) return false;

    header.classList.add('qmes-ref-topbar');
    row.classList.add('qmes-ref-toprow');
    brand.classList.add('qmes-ref-brand');

    let brandCopy=brand.querySelector('.qmes-ref-brand-copy');
    if(!brandCopy){
      brandCopy=document.createElement('span');
      brandCopy.className='qmes-ref-brand-copy';
      brandCopy.innerHTML='<span class="qmes-ref-brand-mark">N</span><span class="qmes-ref-brand-text"><strong>NAMO ONE</strong><small>ERP · MES INTEGRATED</small></span>';
      brand.appendChild(brandCopy);
    }

    let search=document.getElementById('qmes-ref-global-search');
    if(!search){
      search=document.createElement('div');
      search.id='qmes-ref-global-search';
      search.className='qmes-ref-global-search';
      search.innerHTML='<input type="search" placeholder="메뉴, 발주번호, LOT, 거래처 통합검색" aria-label="통합검색"><span class="qmes-ref-search-icon">⌕</span>';
      brand.insertAdjacentElement('afterend',search);
      const input=search.querySelector('input');
      const runSearch=()=>{
        const q=String(input.value||'').trim();
        if(!q) return;
        document.getElementById('qmes-sync-hamburger')?.click();
        setTimeout(()=>{
          const sideInput=document.querySelector('#qmes-sync-sidebar .qmes-side-search-input');
          if(sideInput){sideInput.value=q;sideInput.dispatchEvent(new Event('input',{bubbles:true}));sideInput.focus();}
        },80);
      };
      input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();runSearch();}});
      search.querySelector('.qmes-ref-search-icon')?.addEventListener('click',runSearch);
    }else if(search.previousElementSibling!==brand){
      brand.insertAdjacentElement('afterend',search);
    }

    return true;
  }

  let runs=0;
  const install=()=>{
    runs++;
    ensureHeader();
    if(runs<160) setTimeout(install,runs<20?50:250);
  };
  install();

  const observer=new MutationObserver(()=>ensureHeader());
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();