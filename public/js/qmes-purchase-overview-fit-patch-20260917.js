/* NAMO QMES - purchase overview fit patch
 * 2026-09-17
 * Additive patch only. Keeps original purchase UI logic untouched.
 * Purpose: prevent the rightmost '전체 현황' status card from being clipped.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_OVERVIEW_FIT_PATCH_20260917__) return;
  window.__QMES_PURCHASE_OVERVIEW_FIT_PATCH_20260917__=true;

  const STYLE_ID='qmes-purchase-overview-fit-patch-20260917-style';
  let timer=0;

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      [data-qmes-purchase-status-fit="1"]{
        display:grid!important;
        grid-template-columns:repeat(var(--qmes-status-columns,5),minmax(0,1fr))!important;
        gap:12px!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        margin-left:0!important;
        margin-right:0!important;
        box-sizing:border-box!important;
        overflow:visible!important;
      }
      [data-qmes-purchase-status-fit="1"] > *{
        width:auto!important;
        min-width:0!important;
        max-width:none!important;
        margin-left:0!important;
        margin-right:0!important;
        box-sizing:border-box!important;
      }
      [data-qmes-purchase-status-fit="1"] > * *{
        max-width:100%!important;
        box-sizing:border-box!important;
      }
      [data-qmes-purchase-page-fit="1"]{
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
      }
      @media(max-width:1280px){
        [data-qmes-purchase-status-fit="1"]{gap:9px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function clean(v){return String(v||'').replace(/\s+/g,' ').trim();}
  function isVisible(el){
    if(!(el instanceof Element)||!el.isConnected) return false;
    const s=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
  }
  function leafByText(text){
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,span,div,p')).find(el=>{
      if(!isVisible(el)) return false;
      if(clean(el.textContent)!==text) return false;
      return Array.from(el.children).every(child=>clean(child.textContent)!==text);
    })||null;
  }
  function purchaseRoot(){
    const roots=Array.from(document.querySelectorAll('.qmes-purchase-live,main,[role="main"],.main-content,.content-area,.page-content'));
    return roots.find(el=>{
      const text=clean(el.textContent).slice(0,3500);
      return /구매\s*[·ㆍ]?\s*발주관리/.test(text)&&(/신규 구매 발주|구매 DB 연동|발주번호/.test(text));
    })||null;
  }
  function scoreRow(el){
    if(!(el instanceof HTMLElement)||!isVisible(el)) return -1;
    const children=Array.from(el.children).filter(isVisible);
    if(children.length<3||children.length>7) return -1;
    const text=clean(el.textContent);
    let score=0;
    ['발주','결재','입고','완료','미입고','부분'].forEach(word=>{if(text.includes(word)) score+=1;});
    const r=el.getBoundingClientRect();
    if(r.width>500) score+=2;
    if(children.every(child=>child.getBoundingClientRect().height>45)) score+=1;
    return score;
  }
  function findStatusRow(root){
    const title=leafByText('전체 현황');
    const scope=title&&root.contains(title)?root:(title?title.closest('section,article,div'):root);
    if(!scope) return null;
    const candidates=[];
    const all=Array.from(scope.querySelectorAll('div,section,ul'));
    for(const el of all){
      const s=scoreRow(el);
      if(s>=5) candidates.push({el,s,area:el.getBoundingClientRect().width*el.getBoundingClientRect().height});
    }
    candidates.sort((a,b)=>b.s-a.s||a.area-b.area);
    return candidates[0]?.el||null;
  }
  function apply(){
    timer=0;
    addStyle();
    const root=purchaseRoot();
    if(!root) return;
    root.setAttribute('data-qmes-purchase-page-fit','1');
    const row=findStatusRow(root);
    if(!row) return;
    const children=Array.from(row.children).filter(isVisible);
    row.setAttribute('data-qmes-purchase-status-fit','1');
    row.style.setProperty('--qmes-status-columns',String(Math.max(3,Math.min(7,children.length))));
  }
  function schedule(delay=0){
    if(delay){setTimeout(schedule,delay);return;}
    clearTimeout(timer);
    timer=setTimeout(apply,40);
  }
  function start(){
    schedule();
    setTimeout(apply,200);
    setTimeout(apply,800);
    window.addEventListener('resize',()=>schedule());
    window.addEventListener('qmes:navigate-tab',()=>schedule(80));
    new MutationObserver(mutations=>{
      if(mutations.some(m=>m.addedNodes&&m.addedNodes.length)) schedule();
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
