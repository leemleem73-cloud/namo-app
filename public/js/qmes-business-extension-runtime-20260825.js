(function(){
  if(window.__QMES_BUSINESS_EXTENSION_RUNTIME_V2__) return;
  window.__QMES_BUSINESS_EXTENSION_RUNTIME_V2__=true;
  const defs=[
    ['sales','수주·납기','수주 · 납기관리','고객 수주와 요청 납기를 생산계획 및 출하계획과 연결합니다.'],
    ['plan','생산계획·MRP','생산계획 · MRP','수주와 현재 적용 Recipe/BOM 기준으로 원료 소요량과 부족량을 계산합니다.'],
    ['purchase','구매·발주','구매 · 발주관리','MRP 부족분을 구매요청 → 발주 → 입고예정 → IQC로 연결합니다.'],
    ['recipe','Recipe/BOM','Recipe / BOM Master','제품별 Formula, Revision, 공정조건 및 적용이력을 관리합니다.'],
    ['shipping','출하·납품','출하 · 납품관리','OQC 합격 → CoA → 출하계획 → 배송 → 납품완료를 연결합니다.']
  ];
  let host=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function main(){return document.querySelector('#root main')||document.querySelector('main')||document.querySelector('#root>div')}
  function close(){
    if(host){host.remove();host=null}
    const m=main();if(m)[...m.children].forEach(c=>{if(c.dataset.qbeHidden==='1'){c.style.removeProperty('display');delete c.dataset.qbeHidden}});
    document.querySelectorAll('[data-qbe-menu] .qmes-top-menu-button').forEach(b=>b.classList.remove('is-active'));
  }
  function body(id,title,sub){
    if(id==='recipe') return `<div class="qmes-business-extension"><div class="qbe-title-row"><div><h1 class="qbe-title">Recipe / BOM Master</h1><div class="qbe-subtitle">제품별 Formula, Revision, 공정조건 및 적용이력을 관리합니다.</div></div></div></div>`;
    const cards=id==='sales'?'진행 수주|0건;7일 이내 납기|0건;납기 준수율|-':id==='plan'?'생산계획|0건;MRP 부족 원료|0품목;생산 가능|-':id==='purchase'?'발주 진행|0건;입고 예정|0건':id==='shipping'?'출하 예정|0건;OQC 합격|0건;CoA 발행대기|0건':'';
    return `<div class="qmes-business-extension"><div class="qbe-title-row"><div><h1 class="qbe-title">${esc(title)}</h1><div class="qbe-subtitle">${esc(sub)}</div></div>${id==='shipping'?'<button type="button" class="qbe-primary">+ 출하계획</button>':''}</div><div class="qbe-kpis">${cards.split(';').filter(Boolean).map((x,i)=>{const [a,b]=x.split('|');return `<div class="qbe-kpi ${i===1?'orange':i===2?'green':''}"><span class="qbe-kpi-label">${a}</span><b class="qbe-kpi-value">${b}</b></div>`}).join('')}</div><div class="qbe-card"><div class="qbe-table-wrap"><table><thead><tr><th>상태</th><th>내용</th><th>비고</th></tr></thead><tbody><tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:24px">등록된 데이터가 없습니다.</td></tr></tbody></table></div></div></div>`;
  }
  function open(id,button){
    const def=defs.find(x=>x[0]===id);const m=main();if(!def||!m)return;
    close();host=document.createElement('div');host.id='qmes-business-extension-host';host.innerHTML=body(id,def[2],def[3]);
    m.prepend(host);[...m.children].forEach(c=>{if(c!==host){c.dataset.qbeHidden='1';c.style.display='none'}});
    document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.remove('is-active'));if(button)button.classList.add('is-active');
    try{sessionStorage.setItem('qmes_business_extension_tab',id)}catch(e){}window.scrollTo(0,0);
  }
  function ensure(){
    const nav=document.querySelector('.qmes-top-menu');if(!nav)return false;
    defs.forEach(([id,label])=>{let item=nav.querySelector(`[data-qbe-menu="${id}"]`);if(!item){item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qbeMenu=id;item.innerHTML=`<button type="button" class="qmes-top-menu-button is-extension">${label}</button>`;nav.appendChild(item)}else{const b=item.querySelector('button');if(b){b.classList.add('is-extension');b.textContent=label}}});
    defs.forEach(([id])=>{const item=nav.querySelector(`[data-qbe-menu="${id}"]`);if(item)nav.appendChild(item)});return true;
  }
  document.addEventListener('click',e=>{
    const ext=e.target.closest('[data-qbe-menu]');
    if(ext){const id=ext.dataset.qbeMenu;if(defs.some(x=>x[0]===id)){e.preventDefault();e.stopImmediatePropagation();open(id,ext.querySelector('button')||e.target.closest('button'));return}}
    const normal=e.target.closest('.qmes-top-menu-button');if(normal){close();try{sessionStorage.removeItem('qmes_business_extension_tab')}catch(err){}}
  },true);
  function boot(){if(!ensure()){setTimeout(boot,250);return}let saved='';try{saved=sessionStorage.getItem('qmes_business_extension_tab')||''}catch(e){}if(saved){const item=document.querySelector(`[data-qbe-menu="${saved}"]`);if(item)setTimeout(()=>open(saved,item.querySelector('button')),100)}}
  new MutationObserver(()=>ensure()).observe(document.documentElement,{childList:true,subtree:true});setInterval(ensure,1000);setTimeout(boot,250);
})();