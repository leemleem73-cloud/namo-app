/* Installs the approved preview shell without replacing backend or native QMES modules. */
(function(){
  if(window.__QMES_PREVIEW_SHELL_INSTALLED__) return;
  window.__QMES_PREVIEW_SHELL_INSTALLED__=true;
  let dashRoot=null,dashHost=null,nativeDash=null;
  const nativeMap={
    '종합 대시보드':'dash','생산관리':'prod','품질검사':'iqc','현장입력':'pop','재고관리':'inv','거래처 현황':'partners','설비관리':'eq','LOT 추적':'trace','부적합관리':'ncr'
  };
  const extMap={
    '수주 · 납기관리':'sales','생산계획 · MRP':'plan','구매 · 발주관리':'purchase','Recipe / BOM':'recipe','출하 · 납품관리':'shipping'
  };
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  function navigateNative(tab){
    window.qmesCloseBusinessExtension?.();
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab}}));
  }
  function clickExtension(id){
    const b=document.querySelector(`[data-qbe-menu="${id}"] .qmes-top-menu-button`);
    if(b) b.click();
  }
  function sidebarButton(label,code,type){
    const b=document.createElement('button');b.type='button';b.className='qps-side-btn';b.dataset.qpsCode=code;
    const ico=document.createElement('span');ico.className='qps-ico';ico.textContent=type==='add'?(code==='plan'?'MRP':code==='purchase'?'PO':code==='sales'?'SO':code==='recipe'?'R':'S'):(code==='dash'?'▦':code==='prod'?'P':code==='iqc'?'Q':code==='pop'?'iP':code==='inv'?'I':code==='partners'?'C':code==='eq'?'E':code==='trace'?'L':'8D');
    const text=document.createElement('span');text.textContent=label;
    const mini=document.createElement('span');mini.className='qps-mini '+(type==='add'?'add':'now');mini.textContent=type==='add'?'추가':'현재';
    b.append(ico,text,mini);
    b.addEventListener('click',()=>{if(type==='add')clickExtension(code);else navigateNative(code);setTimeout(syncActive,40)});
    return b;
  }
  function ensureSidebar(){
    if(document.getElementById('qmes-preview-sidebar')) return;
    const shell=document.querySelector('#root>div');if(!shell)return;
    shell.classList.add('qmes-preview-shell');
    const side=document.createElement('aside');side.id='qmes-preview-sidebar';side.className='qps-sidebar';
    const s=document.createElement('div');s.className='qps-search';s.innerHTML='<input placeholder="메뉴 검색">';side.appendChild(s);
    const g1=document.createElement('div');g1.className='qps-group';g1.textContent='현재 QMES';side.appendChild(g1);
    Object.entries(nativeMap).forEach(([label,code])=>side.appendChild(sidebarButton(label,code,'now')));
    const g2=document.createElement('div');g2.className='qps-group';g2.textContent='추가 권장';side.appendChild(g2);
    Object.entries(extMap).forEach(([label,code])=>side.appendChild(sidebarButton(label,code,'add')));
    document.body.appendChild(side);
    const input=side.querySelector('input');input.addEventListener('input',()=>{const q=clean(input.value).toLowerCase();side.querySelectorAll('.qps-side-btn').forEach(b=>b.style.display=!q||clean(b.textContent).toLowerCase().includes(q)?'flex':'none')});
  }
  function decorateHeader(){
    const shell=document.querySelector('#root>div');if(!shell)return;
    shell.classList.add('qmes-preview-shell');
    const header=shell.querySelector(':scope>header');if(!header)return;
    const main=header.querySelector(':scope>div:first-child');if(main)main.classList.add('qps-header-main');
    const logo=header.querySelector('img[alt="NAMO Chemical"]');if(logo){logo.style.filter='none';logo.closest('button')?.classList.add('qps-brand')}
    const account=header.querySelector('button[aria-label="계정 설정 열기"]');if(account){account.classList.add('qps-user');account.querySelector('div')?.classList.add('qps-avatar');}
    header.querySelectorAll('.qmes-header-action').forEach(b=>b.classList.add('qps-header-chip'));
    const talk=Array.from(header.querySelectorAll('button')).find(b=>/NAMO Talk/.test(clean(b.textContent)));if(talk)talk.classList.add('qps-talk');
  }
  function currentIsDashboard(){
    try{return (sessionStorage.getItem('qmes_current_tab')||'dash')==='dash'&&!sessionStorage.getItem('qmes_business_extension_tab')}catch(e){return false}
  }
  function showPreviewDashboard(){
    const main=document.querySelector('#root>div>main');if(!main||typeof window.QMESPreviewDashboard!=='function')return;
    if(!currentIsDashboard()){hidePreviewDashboard();return}
    if(!dashHost){dashHost=document.createElement('div');dashHost.id='qmes-preview-dashboard-host';main.prepend(dashHost);dashRoot=ReactDOM.createRoot(dashHost);dashRoot.render(React.createElement(window.QMESPreviewDashboard));}
    Array.from(main.children).forEach(child=>{if(child!==dashHost&&child.id!=='qmes-business-extension-host'){if(!child.dataset.qpdHidden){child.dataset.qpdHidden='1';child.dataset.qpdPrevDisplay=child.style.display||'';}child.style.display='none';}});
    dashHost.style.display='block';
  }
  function hidePreviewDashboard(){
    const main=document.querySelector('#root>div>main');if(!main)return;
    if(dashHost)dashHost.style.display='none';
    Array.from(main.children).forEach(child=>{if(child.dataset.qpdHidden==='1'){child.style.display=child.dataset.qpdPrevDisplay||'';delete child.dataset.qpdHidden;delete child.dataset.qpdPrevDisplay;}});
  }
  function syncActive(){
    const current=(()=>{try{return sessionStorage.getItem('qmes_business_extension_tab')||sessionStorage.getItem('qmes_current_tab')||'dash'}catch(e){return'dash'}})();
    document.querySelectorAll('.qps-side-btn').forEach(b=>b.classList.toggle('active',b.dataset.qpsCode===current));
    if(current==='dash')showPreviewDashboard();else hidePreviewDashboard();
  }
  function tick(){decorateHeader();ensureSidebar();syncActive();}
  document.addEventListener('click',e=>{if(e.target.closest('.qmes-top-menu-button'))setTimeout(syncActive,60)},true);
  window.addEventListener('qmes:navigate-tab',()=>setTimeout(syncActive,60));
  const observer=new MutationObserver(()=>{decorateHeader();ensureSidebar();});
  function start(){tick();observer.observe(document.documentElement,{childList:true,subtree:true});setInterval(syncActive,700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
