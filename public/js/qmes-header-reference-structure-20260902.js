/* QMES header structure adapter — stable reference version */
(function(){
  "use strict";
  if(window.__QMES_HEADER_REFERENCE_STRUCTURE_V7_SINGLE_LOGO__) return;
  window.__QMES_HEADER_REFERENCE_STRUCTURE_V7_SINGLE_LOGO__=true;

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

    /* Single logo authority: keep only the original React-rendered NAMO Chemical logo. */
    const originalLogo=brand.querySelector(':scope > img[alt="NAMO Chemical"]');
    if(originalLogo){
      originalLogo.classList.add('qmes-ref-original-logo');
      originalLogo.style.removeProperty('display');
      originalLogo.style.removeProperty('visibility');
      originalLogo.style.removeProperty('opacity');
    }

    /* Remove legacy injected copies so MutationObservers cannot stack logos. */
    brand.querySelectorAll('.qmes-ref-brand-copy').forEach(node=>node.remove());

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