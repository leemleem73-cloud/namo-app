/* QMES header structure adapter — stable reference version */
(function(){
  "use strict";
  if(window.__QMES_HEADER_REFERENCE_STRUCTURE_V9_COMPANY_LOGO__) return;
  window.__QMES_HEADER_REFERENCE_STRUCTURE_V9_COMPANY_LOGO__=true;

  function ensureHeader(){
    const header=document.querySelector('#root > div > header');
    if(!header) return false;
    const row=header.firstElementChild;
    const brand=row?.querySelector(':scope > button:first-child');
    if(!row||!brand) return false;

    header.classList.add('qmes-ref-topbar');
    row.classList.add('qmes-ref-toprow');
    brand.classList.add('qmes-ref-brand');
    document.getElementById('qmes-header-authority-v4')?.remove();

    /* The React-rendered logo remains the source element only; visible branding below is controlled here. */
    const originalLogo=brand.querySelector(':scope > img[alt="NAMO Chemical"]');
    if(originalLogo){
      originalLogo.classList.add('qmes-ref-original-logo');
      originalLogo.style.setProperty('display','none','important');
      originalLogo.style.setProperty('visibility','hidden','important');
    }

    /* Single controlled brand block: N mark + official NAMO Chemical logo only. */
    let brandCopy=brand.querySelector('.qmes-ref-brand-copy');
    if(!brandCopy){
      brandCopy=document.createElement('span');
      brandCopy.className='qmes-ref-brand-copy';
      brand.appendChild(brandCopy);
    }
    brandCopy.innerHTML='<span class="qmes-ref-brand-mark">N</span><span class="qmes-ref-brand-text"><span class="qmes-ref-logo-slot"><img class="qmes-ref-brand-logo qmes-ref-company-logo" src="./assets/namo-header-logo.svg" alt="나모케미칼(주)" /></span></span>';

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
        if(!document.body.classList.contains('qmes-side-open')) document.getElementById('qmes-sync-hamburger')?.click();
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
  const install=()=>{runs++;ensureHeader();if(runs<40)setTimeout(install,runs<12?80:500);};
  install();
  let raf=0;
  const observer=new MutationObserver(()=>{
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;ensureHeader();});
  });
  observer.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
})();