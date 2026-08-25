(function(){
  if(window.__QMES_BUSINESS_EXTENSION_RUNTIME__) return;
  window.__QMES_BUSINESS_EXTENSION_RUNTIME__=true;
  const defs=[
    ['sales','수주·납기','수주 · 납기관리','고객 수주와 요청 납기를 생산계획 및 출하계획과 연결합니다.'],
    ['plan','생산계획·MRP','생산계획 · MRP','수주와 현재 적용 Recipe/BOM 기준으로 원료 소요량과 부족량을 계산합니다.'],
    ['purchase','구매·발주','구매 · 발주관리','MRP 부족분을 구매요청 → 발주 → 입고예정 → IQC로 연결합니다.'],
    ['recipe','Recipe/BOM','Recipe / BOM Master','제품별 Formula, Revision, 공정조건 및 적용이력을 관리합니다.'],
    ['shipping','출하·납품','출하 · 납품관리','OQC 합격 → CoA → 출하계획 → 배송 → 납품완료를 연결합니다.']
  ];
  let host=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function main(){return document.querySelector('#root>div>main')}
  function close(){
    if(host){host.remove();host=null}
    const m=main();if(m)[...m.children].forEach(c=>{if(c.dataset.qbeHidden==='1'){c.style.removeProperty('display');delete c.dataset.qbeHidden}});
    document.querySelectorAll('.qmes-top-menu-button.is-extension').forEach(b=>b.classList.remove('is-active'));
  }
  function generic(title,sub,id){
    let body='';
    if(id==='sales') body='<div class="qbe-kpis"><div class="qbe-kpi"><span class="qbe-kpi-label">진행 수주</span><b class="qbe-kpi-value">0건</b></div><div class="qbe-kpi orange"><span class="qbe-kpi-label">7일 이내 납기</span><b class="qbe-kpi-value">0건</b></div><div class="qbe-kpi green"><span class="qbe-kpi-label">납기 준수율</span><b class="qbe-kpi-value">-</b></div></div>';
    else if(id==='plan') body='<div class="qbe-kpis"><div class="qbe-kpi"><span class="qbe-kpi-label">생산계획</span><b class="qbe-kpi-value">0건</b></div><div class="qbe-kpi red"><span class="qbe-kpi-label">MRP 부족 원료</span><b class="qbe-kpi-value">0품목</b></div><div class="qbe-kpi green"><span class="qbe-kpi-label">생산 가능</span><b class="qbe-kpi-value">-</b></div></div>';
    else if(id==='purchase') body='<div class="qbe-kpis"><div class="qbe-kpi"><span class="qbe-kpi-label">발주 진행</span><b class="qbe-kpi-value">0건</b></div><div class="qbe-kpi orange"><span class="qbe-kpi-label">입고 예정</span><b class="qbe-kpi-value">0건</b></div></div>';
    else if(id==='shipping') body='<div class="qbe-kpis"><div class="qbe-kpi"><span class="qbe-kpi-label">출하 예정</span><b class="qbe-kpi-value">0건</b></div><div class="qbe-kpi green"><span class="qbe-kpi-label">OQC 합격</span><b class="qbe-kpi-value">0건</b></div><div class="qbe-kpi orange"><span class="qbe-kpi-label">CoA 발행대기</span><b class="qbe-kpi-value">0건</b></div></div>';
    return `<div class="qmes-business-extension"><div class="qbe-title-row"><div><h1 class="qbe-title">${esc(title)}</h1><div class="qbe-subtitle">${esc(sub)}</div></div>${id==='shipping'?'<button type="button" class="qbe-primary">+ 출하계획</button>':''}</div>${body}<div class="qbe-card"><div class="qbe-table-wrap"><table><thead><tr><th>상태</th><th>내용</th><th>비고</th></tr></thead><tbody><tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:24px">등록된 데이터가 없습니다.</td></tr></tbody></table></div></div></div>`;
  }
  function open(id,button){
    const def=defs.find(x=>x[0]===id);if(!def)return;const m=main();if(!m)return;
    close();host=document.createElement('div');host.id='qmes-business-extension-host';
    host.innerHTML=id==='recipe'?`<div class="qmes-business-extension"><div class="qbe-title-row"><div><h1 class="qbe-title">Recipe / BOM Master</h1><div class="qbe-subtitle">제품별 Formula, Revision, 공정조건 및 적용이력을 관리합니다.</div></div></div></div>`:generic(def[2],def[3],id);
    m.prepend(host);[...m.children].forEach(c=>{if(c!==host){c.dataset.qbeHidden='1';c.style.display='none'}});
    document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.remove('is-active'));button?.classList.add('is-active');
    try{sessionStorage.setItem('qmes_business_extension_tab',id)}catch(e){}
    window.scrollTo(0,0);
  }
  function ensure(){
    const nav=document.querySelector('.qmes-top-menu');if(!nav)return false;
    defs.forEach(([id,label])=>{
      if(nav.querySelector(`[data-qbe-menu="${id}"]`))return;
      const item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qbeMenu=id;
      const b=document.createElement('button');b.type='button';b.className='qmes-top-menu-button is-extension';b.textContent=label;
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(id,b)});item.appendChild(b);nav.appendChild(item);
    });return true;
  }
  document.addEventListener('click',e=>{const b=e.target.closest('.qmes-top-menu-button');if(!b||b.classList.contains('is-extension'))return;close();try{sessionStorage.removeItem('qmes_business_extension_tab')}catch(err){}},true);
  function boot(){if(!ensure()){setTimeout(boot,250);return}let saved='';try{saved=sessionStorage.getItem('qmes_business_extension_tab')||''}catch(e){}if(saved){const b=document.querySelector(`[data-qbe-menu="${saved}"] button`);if(b)setTimeout(()=>open(saved,b),80)}}
  setInterval(ensure,1200);setTimeout(boot,250);
})();