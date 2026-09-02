/* QMES header structure adapter — stable reference version */
(function(){
  "use strict";
  if(window.__QMES_HEADER_REFERENCE_STRUCTURE_V6_STABLE__) return;
  window.__QMES_HEADER_REFERENCE_STRUCTURE_V6_STABLE__=true;

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

    const originalLogo=brand.querySelector(':scope > img[alt="NAMO Chemical"]');
    if(originalLogo){
      originalLogo.style.setProperty('display','none','important');
      originalLogo.style.setProperty('visibility','hidden','important');
    }

    let brandCopy=brand.querySelector('.qmes-ref-brand-copy');
    if(!brandCopy){
      brandCopy=document.createElement('span');
      brandCopy.className='qmes-ref-brand-copy';
      brandCopy.innerHTML='<span class="qmes-ref-brand-mark">N</span><span class="qmes-ref-brand-text"><span class="qmes-ref-logo-slot"></span><small>ERP · MES INTEGRATED</small></span>';
      brand.appendChild(brandCopy);
    }
    const slot=brandCopy.querySelector('.qmes-ref-logo-slot');
    let logoClone=slot?.querySelector('img.qmes-ref-brand-logo');
    if(slot && !logoClone && originalLogo){
      logoClone=originalLogo.cloneNode(true);
      logoClone.className='qmes-ref-brand-logo';
      logoClone.removeAttribute('style');
      slot.appendChild(logoClone);
    }
    if(logoClone){
      logoClone.style.setProperty('display','block','important');
      logoClone.style.setProperty('visibility','visible','important');
      logoClone.style.setProperty('width','auto','important');
      logoClone.style.setProperty('height','14px','important');
      logoClone.style.setProperty('max-width','100px','important');
      logoClone.style.setProperty('object-fit','contain','important');
      logoClone.style.setProperty('filter','grayscale(1) brightness(0)','important');
      logoClone.style.setProperty('opacity','1','important');
      logoClone.style.setProperty('margin','0','important');
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
  const install=()=>{runs++;ensureHeader();if(runs<80)setTimeout(install,runs<20?50:300);};
  install();
  let raf=0;
  const observer=new MutationObserver(()=>{
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;ensureHeader();});
  });
  observer.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
})();