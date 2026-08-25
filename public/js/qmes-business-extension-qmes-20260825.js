(function(){
  if(window.__QMES_BUSINESS_EXTENSION_QMES__) return;
  window.__QMES_BUSINESS_EXTENSION_QMES__=true;

  const defs=[
    ['sales','수주·납기'],
    ['plan','생산계획·MRP'],
    ['purchase','구매·발주'],
    ['recipe','Recipe/BOM'],
    ['shipping','출하·납품']
  ];
  let host=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const arr=v=>Array.isArray(v)?v:[];
  function main(){return document.querySelector('#root main')||document.querySelector('main')}
  function db(){return typeof DB==='object'&&DB?DB:{}}
  function orders(){const d=db();return arr(d.salesOrders||d.orders||d.customerOrders)}
  function batches(){return arr(db().batches)}
  function purchases(){const d=db();return arr(d.purchaseOrders||d.po||d.purchase)}
  function boms(){try{const x=JSON.parse(localStorage.getItem('qmes-bom-local-v1')||'[]');return arr(x)}catch(e){return[]}}
  function oqc(){const d=db();return arr(d.insp&&d.insp.OQC)}
  function shipments(){const d=db();return arr(d.shipments||d.shippingPlans)}
  function card(label,value,tone=''){return `<div class="qbe-kpi ${tone}"><span class="qbe-kpi-label">${esc(label)}</span><b class="qbe-kpi-value">${esc(value)}</b></div>`}
  function empty(cols,msg='등록된 데이터가 없습니다.'){return `<tr><td colspan="${cols}" style="text-align:center;color:#94a3b8;padding:24px">${msg}</td></tr>`}
  function title(name,sub,action=''){return `<div class="qbe-title-row"><div><h1 class="qbe-title">${name}</h1><div class="qbe-subtitle">${sub}</div></div>${action?`<button class="qbe-primary">${action}</button>`:''}</div>`}

  function salesView(){
    const rows=orders();
    const tbody=rows.length?rows.map((x,i)=>`<tr><td>${esc(x.no||x.orderNo||x.id||i+1)}</td><td>${esc(x.customer||x.client||'-')}</td><td>${esc(x.item||x.product||'-')}</td><td>${esc(x.qty||x.quantity||'-')}</td><td>${esc(x.due||x.dueDate||'-')}</td><td>${esc(x.status||'-')}</td></tr>`).join(''):empty(6);
    return `<div class="qmes-business-extension">${title('수주 · 납기관리','고객 수주와 요청 납기를 생산계획 및 출하와 연결합니다.')}<div class="qbe-kpis">${card('수주',''+rows.length+'건')}${card('생산계획 연계',''+rows.filter(x=>x.productionPlan||x.planLinked).length+'건','green')}${card('납기 관리',''+rows.filter(x=>x.due||x.dueDate).length+'건','orange')}</div><div class="qbe-card"><div class="qbe-table-wrap"><table><thead><tr><th>수주번호</th><th>고객사</th><th>제품</th><th>수량</th><th>납기일</th><th>상태</th></tr></thead><tbody>${tbody}</tbody></table></div></div></div>`;
  }
  function planView(){
    const rows=batches();
    const tbody=rows.length?rows.map(x=>`<tr><td>${esc(x.due||'-')}</td><td>${esc(x.item||'-')}</td><td>${esc(x.no||'-')}</td><td>${esc(x.plan||0)} ${esc(x.unit||'kg')}</td><td>${esc(x.status||'-')}</td></tr>`).join(''):empty(5);
    return `<div class="qmes-business-extension">${title('생산계획 · MRP','작업지시 계획량과 현재 적용 Recipe/BOM을 기준으로 자재 소요량을 관리합니다.')}<div class="qbe-kpis">${card('생산계획',rows.length+'건')}${card('계획량',rows.reduce((s,x)=>s+Number(x.plan||0),0).toLocaleString()+' kg','orange')}${card('작업지시 연계',Object.keys(db().woDocs||{}).length+'건','green')}</div><div class="qbe-card"><div class="qbe-table-wrap"><table><thead><tr><th>생산일</th><th>품목</th><th>생산 LOT</th><th>계획량</th><th>상태</th></tr></thead><tbody>${tbody}</tbody></table></div></div></div>`;
  }
  function purchaseView(){
    const rows=purchases();
    const tbody=rows.length?rows.map((x,i)=>`<tr><td>${esc(x.no||x.poNo||x.id||i+1)}</td><td>${esc(x.supplier||x.vendor||'-')}</td><td>${esc(x.material||x.item||'-')}</td><td>${esc(x.qty||x.quantity||'-')}</td><td>${esc(x.due||x.expectedDate||'-')}</td><td>${esc(x.status||'-')}</td></tr>`).join(''):empty(6);
    return `<div class="qmes-business-extension">${title('구매 · 발주관리','MRP 부족 자재의 구매요청, 발주, 입고예정, IQC 연계를 관리합니다.')}<div class="qbe-kpis">${card('발주',rows.length+'건')}${card('입고예정',rows.filter(x=>x.expectedDate||x.due).length+'건','orange')}${card('입고완료',rows.filter(x=>String(x.status||'').includes('완료')).length+'건','green')}</div><div class="qbe-card"><div class="qbe-table-wrap"><table><thead><tr><th>발주번호</th><th>협력사</th><th>원료</th><th>발주량</th><th>입고예정</th><th>상태</th></tr></thead><tbody>${tbody}</tbody></table></div></div></div>`;
  }
  function recipeView(){
    const rows=boms();
    const active=rows.filter(x=>x.status==='사용중'||x.status==='현재 적용');
    const tbody=rows.length?rows.map(x=>`<tr><td>${esc(x.productCode||x.productName||'-')}</td><td>${esc(x.recipeNo||'-')}</td><td>${esc(x.revision||'-')}</td><td>${esc(x.batchSize||'-')}</td><td>${esc(x.effectiveDate||'-')}</td><td>${esc(x.status==='사용중'?'현재 적용':x.status||'-')}</td></tr>`).join(''):empty(6);
    return `<div class="qmes-business-extension">${title('Recipe / BOM Master','제품별 표준 배합비, 기준 투입량, Revision, 적용일, 승인상태를 관리합니다.')}<div class="qbe-kpis">${card('등록 BOM',rows.length+'건')}${card('현재 적용',active.length+'건','green')}${card('Revision',new Set(rows.map(x=>x.revision).filter(Boolean)).size+'건','orange')}</div><div class="qbe-card"><div class="qbe-table-wrap"><table><thead><tr><th>제품</th><th>Recipe No.</th><th>Revision</th><th>기준 Batch</th><th>적용일</th><th>상태</th></tr></thead><tbody>${tbody}</tbody></table></div></div></div>`;
  }
  function shippingView(){
    const plans=shipments(), inspections=oqc();
    const passed=inspections.filter(x=>String(x.judge||x.result||'').includes('합격'));
    const tbody=plans.length?plans.map((x,i)=>`<tr><td>${esc(x.date||x.shipDate||'-')}</td><td>${esc(x.orderNo||x.order||'-')}</td><td>${esc(x.customer||x.client||'-')}</td><td>${esc(x.item||x.product||'-')}</td><td>${esc(x.lot||x.finishedLot||'-')}</td><td>${esc(x.qty||x.quantity||'-')}</td><td>${esc(x.status||'-')}</td></tr>`).join(''):empty(7);
    return `<div class="qmes-business-extension">${title('출하 · 납품관리','OQC 합격, CoA, 출하계획, 배송, 납품완료를 연결합니다.')}<div class="qbe-kpis">${card('출하계획',plans.length+'건')}${card('OQC 합격',passed.length+'건','green')}${card('OQC 전체',inspections.length+'건','orange')}</div><div class="qbe-card"><div class="qbe-table-wrap"><table><thead><tr><th>출하일</th><th>수주번호</th><th>고객사</th><th>제품</th><th>완제품 LOT</th><th>수량</th><th>상태</th></tr></thead><tbody>${tbody}</tbody></table></div></div></div>`;
  }
  function view(id){return id==='sales'?salesView():id==='plan'?planView():id==='purchase'?purchaseView():id==='recipe'?recipeView():shippingView()}
  function close(){if(host){host.remove();host=null}const m=main();if(m)[...m.children].forEach(c=>{if(c.dataset.qbeHidden==='1'){c.style.removeProperty('display');delete c.dataset.qbeHidden}});document.querySelectorAll('[data-qbe-menu] button').forEach(b=>b.classList.remove('is-active'))}
  function open(id,button){const m=main();if(!m)return;close();host=document.createElement('div');host.id='qmes-business-extension-host';host.innerHTML=view(id);m.prepend(host);[...m.children].forEach(c=>{if(c!==host){c.dataset.qbeHidden='1';c.style.display='none'}});document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.remove('is-active'));if(button)button.classList.add('is-active');try{sessionStorage.setItem('qmes_business_extension_tab',id)}catch(e){}window.scrollTo(0,0)}
  function ensure(){const nav=document.querySelector('.qmes-top-menu');if(!nav)return false;defs.forEach(([id,label])=>{let item=nav.querySelector(`[data-qbe-menu="${id}"]`);if(!item){item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qbeMenu=id;item.innerHTML=`<button type="button" class="qmes-top-menu-button is-extension">${label}</button>`;nav.appendChild(item)}else{const b=item.querySelector('button');if(b){b.textContent=label;b.classList.add('is-extension')}}});defs.forEach(([id])=>{const item=nav.querySelector(`[data-qbe-menu="${id}"]`);if(item)nav.appendChild(item)});return true}
  document.addEventListener('click',e=>{const ext=e.target.closest('[data-qbe-menu]');if(ext){const id=ext.dataset.qbeMenu;if(defs.some(x=>x[0]===id)){e.preventDefault();e.stopImmediatePropagation();open(id,ext.querySelector('button')||e.target.closest('button'));return}}const normal=e.target.closest('.qmes-top-menu-button');if(normal){close();try{sessionStorage.removeItem('qmes_business_extension_tab')}catch(err){}}},true);
  function boot(){if(!ensure()){setTimeout(boot,250);return}let saved='';try{saved=sessionStorage.getItem('qmes_business_extension_tab')||''}catch(e){}if(saved){const item=document.querySelector(`[data-qbe-menu="${saved}"]`);if(item)setTimeout(()=>open(saved,item.querySelector('button')),100)}}
  new MutationObserver(ensure).observe(document.documentElement,{childList:true,subtree:true});setInterval(ensure,1200);setTimeout(boot,300);
})();