/* QMES header structure adapter — match uploaded reference without touching page modules */
(function(){
  "use strict";
  if(window.__QMES_HEADER_REFERENCE_STRUCTURE_V4__) return;
  window.__QMES_HEADER_REFERENCE_STRUCTURE_V4__=true;

  function ensureAuthorityStyle(){
    let style=document.getElementById('qmes-header-authority-v4');
    if(!style){style=document.createElement('style');style.id='qmes-header-authority-v4';document.head.appendChild(style);}
    style.textContent=`
      @media screen{
        html body #root>div>header.qmes-ref-topbar,html body #root>div>header{background:linear-gradient(180deg,#65a9d2 0%,#4f96c5 100%)!important;border-bottom-color:#4388b6!important;color:#fff!important;}
        html body #qmes-sync-hamburger{left:254px!important;background:transparent!important;border:0!important;box-shadow:none!important;color:#fff!important;}
        html body #qmes-sync-hamburger:hover,html body #qmes-sync-hamburger:focus-visible{background:transparent!important;border:0!important;box-shadow:none!important;color:#fff!important;outline:none!important;}
        html body #root>div>header .qmes-ref-brand-logo{height:17px!important;max-width:120px!important;filter:grayscale(1) brightness(.12) contrast(1.25)!important;opacity:.96!important;}
        @media(max-width:1180px){html body #qmes-sync-hamburger{left:216px!important;}}
        @media(max-width:820px){html body #qmes-sync-hamburger{left:176px!important;}html body #root>div>header .qmes-ref-brand-logo{height:15px!important;max-width:96px!important;}}
      }
    `;
    /* Keep this header-only authority after sidebar runtime styles so sidebar cannot recolor the header. */
    if(style!==document.head.lastElementChild) document.head.appendChild(style);
  }

  function ensureHeader(){
    const header=document.querySelector('#root > div > header');
    if(!header) return false;
    const row=header.firstElementChild;
    const brand=row?.querySelector(':scope > button:first-child');
    if(!row||!brand) return false;
    header.classList.add('qmes-ref-topbar');row.classList.add('qmes-ref-toprow');brand.classList.add('qmes-ref-brand');
    const originalLogo=brand.querySelector(':scope > img[alt="NAMO Chemical"]');
    let brandCopy=brand.querySelector('.qmes-ref-brand-copy');
    if(!brandCopy){brandCopy=document.createElement('span');brandCopy.className='qmes-ref-brand-copy';brandCopy.innerHTML='<span class="qmes-ref-brand-mark">N</span><span class="qmes-ref-brand-text"><span class="qmes-ref-logo-slot"></span><small>ERP · MES INTEGRATED</small></span>';brand.appendChild(brandCopy);}
    const slot=brandCopy.querySelector('.qmes-ref-logo-slot');
    if(slot&&!slot.querySelector('img')&&originalLogo){const logoClone=originalLogo.cloneNode(true);logoClone.className='qmes-ref-brand-logo';logoClone.removeAttribute('style');slot.appendChild(logoClone);}
    let search=document.getElementById('qmes-ref-global-search');
    if(!search){search=document.createElement('div');search.id='qmes-ref-global-search';search.className='qmes-ref-global-search';search.innerHTML='<input type="search" placeholder="메뉴, 발주번호, LOT, 거래처 통합검색" aria-label="통합검색"><span class="qmes-ref-search-icon">⌕</span>';brand.insertAdjacentElement('afterend',search);const input=search.querySelector('input');const runSearch=()=>{const q=String(input.value||'').trim();if(!q)return;document.getElementById('qmes-sync-hamburger')?.click();setTimeout(()=>{const sideInput=document.querySelector('#qmes-sync-sidebar .qmes-side-search-input');if(sideInput){sideInput.value=q;sideInput.dispatchEvent(new Event('input',{bubbles:true}));sideInput.focus();}},80);};input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();runSearch();}});search.querySelector('.qmes-ref-search-icon')?.addEventListener('click',runSearch);}else if(search.previousElementSibling!==brand){brand.insertAdjacentElement('afterend',search);}
    ensureAuthorityStyle();return true;
  }
  let runs=0;const install=()=>{runs++;ensureHeader();if(runs<160)setTimeout(install,runs<20?50:250);};install();
  const observer=new MutationObserver(()=>ensureHeader());observer.observe(document.documentElement,{childList:true,subtree:true});
})();