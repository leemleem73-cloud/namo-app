(function(){
  "use strict";
  if(window.__QMES_LEFT_NAV_20260903_V2__) return;
  window.__QMES_LEFT_NAV_20260903_V2__=true;

  const clean=v=>String(v||"").replace(/[›〉▣]/g,"").replace(/\s+/g," ").trim();
  const sections=[
    {label:'WORKSPACE',items:[{label:'통합 대시보드',icon:'D',direct:'대시보드'},{label:'SPC 대시보드',icon:'C',group:'품질검사',sub:'SPC (Cpk)'}]},
    {label:'ERP',items:[{label:'수주 · 납기관리',icon:'S',tab:'erpSales'},{label:'생산계획 · MRP',icon:'P',tab:'erpPlan'},{label:'구매 · 발주관리',icon:'B',tab:'erpPurchase'},{label:'재고현황',icon:'I',inventory:'overview'},{label:'입출고 관리',icon:'↔',inventory:'movement'},{label:'LOT별 재고',icon:'L',inventory:'lot'},{label:'생산투입/완료',icon:'R',inventory:'production'},{label:'재고실사',icon:'C',inventory:'count'},{label:'거래처 현황',icon:'V',direct:'거래처 현황'}]},
    {label:'MES · QMS',items:[{label:'생산 진행',icon:'M',group:'생산관리',sub:'생산 (배치)'},{label:'작업지시서',icon:'W',group:'생산관리',sub:'작업지시서'},{label:'생산공정 관리',icon:'P',tab:'prodProcess',openMenu:'productionMenu'},{label:'수입검사 (IQC)',icon:'Q',group:'품질검사',sub:'수입검사 (IQC)'},{label:'공정검사 (PQC)',icon:'Q',group:'품질검사',sub:'공정검사 (PQC)'},{label:'출하검사 (OQC)',icon:'Q',group:'품질검사',sub:'출하검사 (OQC)'},{label:'SPC (Cpk)',icon:'C',group:'품질검사',sub:'SPC (Cpk)'},{label:'품질 인터락',icon:'!',group:'품질검사',sub:'품질 인터락 (차단)'},{label:'출하성적서',icon:'R',group:'품질검사',sub:'출하성적서'},{label:'LOT 통합추적',icon:'L',direct:'LOT 추적'},{label:'출하 · 납품관리',icon:'O',tab:'erpShipping'},{label:'부적합 (8D)',icon:'8',group:'부적합관리',sub:'부적합 (8D)'},{label:'고객불만 (GQMS)',icon:'G',group:'부적합관리',sub:'고객불만 (GQMS)'},{label:'4M 변경관리',icon:'4',group:'부적합관리',sub:'4M 변경관리'},{label:'현장 입력 (iPad)',icon:'T',direct:'현장입력'},{label:'설비 모니터링',icon:'E',direct:'설비관리'}]}
  ];

  document.getElementById('qmes-sync-sidebar')?.remove();
  document.getElementById('qmes-sync-hamburger')?.remove();
  document.getElementById('qmes-left-nav-runtime-style')?.remove();

  const style=document.createElement('style');
  style.id='qmes-left-nav-runtime-style';
  style.textContent=`
    #qmes-sync-sidebar{position:fixed;left:0;top:64px;bottom:0;width:248px;box-sizing:border-box;padding:8px 8px 24px;overflow-y:auto;overflow-x:hidden;background:linear-gradient(180deg,#f8fafb 0%,#edf2f6 100%);border-right:1px solid #bfcdd8;box-shadow:2px 0 5px rgba(51,82,103,.08);z-index:12050;color:#344d60;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;pointer-events:auto!important}
    #qmes-sync-sidebar .qmes-side-section-label{margin:8px 0 3px;padding:7px 10px;background:#dfeaf2;border-radius:2px;color:#2f6f9f;font-size:10px;line-height:14px;font-weight:800;letter-spacing:.8px}
    #qmes-sync-sidebar .qmes-side-item{appearance:none;width:100%;min-height:36px;margin:1px 0;padding:6px 9px;display:flex;align-items:center;gap:9px;border:1px solid transparent;border-radius:2px;background:transparent;color:#3d5264;font:650 12.5px/18px Pretendard,"Noto Sans KR",Arial,sans-serif;text-align:left;box-shadow:none;cursor:pointer}
    #qmes-sync-sidebar .qmes-side-item:hover{background:#e2edf5;color:#1d5681}
    #qmes-sync-sidebar .qmes-side-item.is-active{background:linear-gradient(180deg,#3d8ac0 0%,#2f76ad 100%);border-color:#286b9e;color:#fff;font-weight:800}
    #qmes-sync-sidebar .qmes-side-icon{width:22px;height:22px;min-width:22px;display:grid;place-items:center;border:1px solid #c5d4df;border-radius:2px;background:#dfe9f0;color:#356f99;font-size:10px;font-weight:900}
    #qmes-sync-sidebar .qmes-side-item.is-active .qmes-side-icon{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff}
    #qmes-sync-sidebar .qmes-side-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #qmes-sync-hamburger{position:fixed;left:260px;top:16px;z-index:12070;width:32px;height:32px;padding:0;border:0;border-radius:3px;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;cursor:pointer}
    #qmes-sync-hamburger:hover{background:rgba(255,255,255,.10)}
    body.qmes-left-nav-ready #root>div>main{margin-left:248px!important;width:calc(100% - 248px)!important;box-sizing:border-box!important}
    @media(max-width:1180px){#qmes-sync-sidebar{width:220px}#qmes-sync-hamburger{left:232px}body.qmes-left-nav-ready #root>div>main{margin-left:220px!important;width:calc(100% - 220px)!important}}
    @media print{#qmes-sync-sidebar,#qmes-sync-hamburger{display:none!important}body.qmes-left-nav-ready #root>div>main{margin-left:0!important;width:100%!important}}
  `;
  document.head.appendChild(style);

  const side=document.createElement('aside');side.id='qmes-sync-sidebar';side.innerHTML='<div class="qmes-side-groups"></div>';document.body.appendChild(side);
  const hamburger=document.createElement('button');hamburger.id='qmes-sync-hamburger';hamburger.type='button';hamburger.setAttribute('aria-label','왼쪽 메뉴');hamburger.textContent='☰';document.body.appendChild(hamburger);
  document.body.classList.add('qmes-left-nav-ready','qmes-side-open');
  const wrap=side.querySelector('.qmes-side-groups');let activeLabel='통합 대시보드';

  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=b=>clean(b?.querySelector(':scope > span')?.textContent||b?.querySelector('span')?.textContent||b?.textContent);
  const findTop=label=>topButtons().find(b=>topLabel(b)===clean(label));
  const findSub=label=>Array.from(document.querySelectorAll('.qmes-submenu-button')).find(b=>clean(b.textContent)===clean(label));

  function render(){wrap.replaceChildren();sections.forEach((section,si)=>{const h=document.createElement('div');h.className='qmes-side-section-label';h.textContent=section.label;wrap.appendChild(h);section.items.forEach((item,ii)=>{const b=document.createElement('button');b.type='button';b.className='qmes-side-item'+(activeLabel===item.label?' is-active':'');b.dataset.s=si;b.dataset.i=ii;b.innerHTML='<span class="qmes-side-icon"></span><span class="qmes-side-text"></span>';b.querySelector('.qmes-side-icon').textContent=item.icon;b.querySelector('.qmes-side-text').textContent=item.label;wrap.appendChild(b);});});}
  function navigate(item){if(!item)return;activeLabel=item.label;render();if(item.inventory){try{sessionStorage.setItem('qmes_inventory_section',item.inventory)}catch(e){}window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'inv',openMenu:null}}));window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:item.inventory}}));return}if(item.tab){window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:item.tab,openMenu:item.openMenu||null}}));return}if(item.direct){findTop(item.direct)?.click();return}if(item.sub){const sub=findSub(item.sub);if(sub){sub.click();return}findTop(item.group)?.click();requestAnimationFrame(()=>requestAnimationFrame(()=>findSub(item.sub)?.click()))}}
  side.addEventListener('click',e=>{const b=e.target.closest('.qmes-side-item');if(!b)return;navigate(sections[+b.dataset.s]?.items?.[+b.dataset.i])});
  hamburger.addEventListener('click',()=>{side.scrollTo({top:0,behavior:'smooth'})});
  render();
})();