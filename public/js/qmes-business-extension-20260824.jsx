/* NAMO QMES business extension screens */
function QBEStatus({tone="blue",children}){return <span className={`qbe-status ${tone}`}>{children}</span>}
function QBEKpi({label,value,sub="",tone=""}){return <div className={`qbe-kpi ${tone}`}><span className="qbe-kpi-label">{label}</span><b className="qbe-kpi-value">{value}</b>{sub&&<small className="qbe-kpi-sub">{sub}</small>}</div>}
function QBEHeader({title,subtitle,action}){return <div className="qbe-title-row"><div><h1 className="qbe-title">{title}</h1><div className="qbe-subtitle">{subtitle}</div></div>{action&&<button type="button" className="qbe-primary">{action}</button>}</div>}
function QBESalesTab(){return <div className="qmes-business-extension"><QBEHeader title="수주 · 납기관리" subtitle="고객 PO를 생산계획 및 출하계획의 시작점으로 관리합니다." action="+ 신규 수주"/><div className="qbe-kpis"><QBEKpi label="진행 수주" value="0건"/><QBEKpi label="7일 이내 납기" value="0건" tone="orange"/><QBEKpi label="납기 준수율" value="-" tone="green"/><QBEKpi label="지연 위험" value="0건" tone="red"/><QBEKpi label="금월 수주량" value="0" tone="slate"/></div><div className="qbe-card"><div className="qbe-form-grid" style={{marginBottom:14}}><div className="qbe-field"><label>고객사</label><select defaultValue=""><option value="">선택</option></select></div><div className="qbe-field"><label>고객 PO 번호</label><input defaultValue=""/></div><div className="qbe-field"><label>요청 납기일</label><input type="date" defaultValue=""/></div><div className="qbe-field"><label>제품</label><select defaultValue=""><option value="">선택</option></select></div></div><div className="qbe-table-wrap"><table><thead><tr><th>수주번호</th><th>고객사</th><th>제품</th><th>수량</th><th>납기일</th><th>생산계획</th><th>출하상태</th></tr></thead><tbody></tbody></table></div></div></div>}
function QBEPlanTab(){return <div className="qmes-business-extension"><QBEHeader title="생산계획 · MRP" subtitle="수주와 Recipe를 기준으로 원료 필요량, 가용재고 및 부족량을 계산합니다." action="MRP 재계산"/><div className="qbe-grid2"><div className="qbe-card"><h2>생산계획 입력</h2><div className="qbe-form-grid"><div className="qbe-field"><label>생산일</label><input type="date" defaultValue=""/></div><div className="qbe-field"><label>제품</label><select defaultValue=""><option value="">선택</option></select></div><div className="qbe-field"><label>계획량</label><input defaultValue=""/></div><div className="qbe-field"><label>Recipe Revision</label><select defaultValue=""><option value="">선택</option></select></div></div></div><div className="qbe-card"><h2>계획 판단</h2><div className="qbe-alerts"><div className="qbe-alert blue"><span>현재 생산 가능률</span><b>-</b></div><div className="qbe-alert red"><span>부족 원료</span><b>0 품목</b></div><div className="qbe-alert orange"><span>입고예정 반영 필요</span><b>0건</b></div></div></div></div><div className="qbe-card"><div className="qbe-card-head"><h2>MRP 소요량 계산</h2><span className="qbe-hint"></span></div><div className="qbe-table-wrap"><table><thead><tr><th>원료</th><th>배합비</th><th>필요량</th><th>가용재고</th><th>예약재고</th><th>입고예정</th><th>부족량</th><th>조치</th></tr></thead><tbody></tbody></table></div></div></div>}
function QBEPurchaseTab(){return <div className="qmes-business-extension"><QBEHeader title="구매 · 발주관리" subtitle="MRP 부족분을 구매요청 → 발주 → 입고예정 → IQC로 연결합니다." action="+ 발주서 생성"/><div className="qbe-kpis"><QBEKpi label="발주 진행" value="0건"/><QBEKpi label="입고 예정" value="0건" tone="orange"/><QBEKpi label="납기 정상" value="0건" tone="green"/><QBEKpi label="납기 확인" value="0건" tone="red"/><QBEKpi label="금월 발주" value="0" tone="slate"/></div><div className="qbe-card"><div className="qbe-table-wrap"><table><thead><tr><th>발주번호</th><th>협력사</th><th>원료</th><th>발주량</th><th>요청납기</th><th>입고예정</th><th>IQC 연계</th><th>상태</th></tr></thead><tbody></tbody></table></div></div></div>}
function QBERecipeTab(){return <div className="qmes-business-extension"><QBEHeader title="Recipe / BOM Master" subtitle="제품별 표준 배합비, 표준투입량, Revision, 적용일 및 승인이력을 관리합니다." action="+ 신규 Revision"/><div className="qbe-split"><div className="qbe-card"><h2>제품 Recipe</h2><div className="qbe-box"><h3>등록된 Recipe 없음</h3><div className="qbe-note">신규 Revision을 등록하면 이곳에 표시됩니다.</div></div><div className="qbe-box"><h3>개정 이력</h3><div className="qbe-note">등록된 이력이 없습니다.</div></div></div><div className="qbe-card"><h2>표준 배합표</h2><div className="qbe-table-wrap"><table><thead><tr><th>No</th><th>원료</th><th>배합비</th><th>기준 투입량</th><th>투입순서</th><th>CTQ</th></tr></thead><tbody></tbody></table></div></div></div></div>}
function QBEShippingTab(){return <div className="qmes-business-extension"><QBEHeader title="출하 · 납품관리" subtitle="OQC 합격 → CoA 발행 → 출하계획 → 배송 → 고객 납품완료를 연결합니다." action="+ 출하계획"/><div className="qbe-kpis"><QBEKpi label="출하 예정" value="0건"/><QBEKpi label="OQC 합격" value="0건" tone="green"/><QBEKpi label="CoA 발행대기" value="0건" tone="orange"/><QBEKpi label="출하가능 재고" value="0" tone="slate"/><QBEKpi label="납기 위험" value="0건" tone="red"/></div><div className="qbe-card"><div className="qbe-table-wrap"><table><thead><tr><th>출하일</th><th>수주번호</th><th>고객사</th><th>제품</th><th>완제품 LOT</th><th>수량</th><th>OQC</th><th>CoA</th><th>배송</th></tr></thead><tbody></tbody></table></div></div></div>}
window.QBESalesTab=QBESalesTab;window.QBEPlanTab=QBEPlanTab;window.QBEPurchaseTab=QBEPurchaseTab;window.QBERecipeTab=QBERecipeTab;window.QBEShippingTab=QBEShippingTab;

(function installQmesBusinessExtension(){
  if(window.__QMES_BUSINESS_EXTENSION_INSTALLED__)return;window.__QMES_BUSINESS_EXTENSION_INSTALLED__=true;
  const menus=[['sales','수주·납기','수주 · 납기관리',QBESalesTab],['plan','생산계획·MRP','생산계획 · MRP',QBEPlanTab],['purchase','구매·발주','구매 · 발주관리',QBEPurchaseTab],['recipe','Recipe/BOM','Recipe / BOM',QBERecipeTab],['shipping','출하·납품','출하 · 납품관리',QBEShippingTab]];
  const nativeGroups={'대시보드':'대시보드','생산관리':'생산관리','품질검사':'품질검사','현장입력':'현장입력','재고관리':'재고관리','거래처현황':'거래처 현황','거래처 현황':'거래처 현황','설비관리':'설비관리','LOT추적':'LOT 추적','LOT 추적':'LOT 추적','부적합관리':'부적합관리','부적합 관리':'부적합관리'};
  let extensionRoot=null,host=null;
  function resetSidebarLayout(){
    document.body.classList.remove('qmes-side-open');
    const main=document.querySelector('#root>div>main');
    if(main){['margin-left','width','box-sizing','transition'].forEach(p=>main.style.removeProperty(p));delete main.dataset.qmesSidebarShift;}
    const top=document.querySelector('.qmes-top-menu');if(top){top.style.removeProperty('transform');top.style.removeProperty('width');}
  }
  function showBusinessSidebar(label){
    resetSidebarLayout();
    const side=document.getElementById('qmes-sync-sidebar');
    if(!side)return;
    const title=side.querySelector('.qmes-side-title');
    const head=side.querySelector('.qmes-side-head');
    const items=side.querySelector('.qmes-side-items');
    const search=side.querySelector('.qmes-side-search-input');
    if(search)search.value='';
    if(title)title.textContent=label;
    if(head)head.classList.add('is-group-active');
    if(items){
      items.replaceChildren();
      const b=document.createElement('button');b.type='button';b.className='qmes-side-item is-active';b.textContent=label;items.appendChild(b);
    }
    ['display','visibility','opacity','pointer-events','transform'].forEach(p=>side.style.removeProperty(p));
    document.body.classList.add('qmes-side-open');
  }
  function closeExtension(){if(extensionRoot){try{extensionRoot.unmount()}catch(e){}extensionRoot=null}if(host){host.remove();host=null}document.querySelectorAll('.qmes-top-menu-button.is-extension').forEach(b=>b.classList.remove('is-active'));}
  function openExtension(id,label,Component,button){const main=document.querySelector('#root>div>main');if(!main)return;closeExtension();host=document.createElement('div');host.id='qmes-business-extension-host';host.style.width='100%';main.prepend(host);Array.from(main.children).forEach(child=>{if(child!==host){child.dataset.qbeHidden='1';child.style.display='none'}});extensionRoot=ReactDOM.createRoot(host);extensionRoot.render(<Component/>);document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.remove('is-active'));button?.classList.add('is-active');try{sessionStorage.setItem('qmes_business_extension_tab',id)}catch(e){}setTimeout(()=>showBusinessSidebar(label),0);window.scrollTo({top:0,behavior:'smooth'});}
  function restoreNative(){closeExtension();resetSidebarLayout();const main=document.querySelector('#root>div>main');if(main)Array.from(main.children).forEach(child=>{if(child.dataset.qbeHidden==='1'){child.style.removeProperty('display');delete child.dataset.qbeHidden}});try{sessionStorage.removeItem('qmes_business_extension_tab')}catch(e){}}
  function ensureButtons(){const nav=document.querySelector('.qmes-top-menu');if(!nav)return false;menus.forEach(([id,topLabel,sideLabel,Component])=>{let item=nav.querySelector(`[data-qbe-menu="${id}"]`);if(item)return;item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qbeMenu=id;const b=document.createElement('button');b.type='button';b.className='qmes-top-menu-button is-extension';b.innerHTML=`<span>${topLabel}</span>`;b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openExtension(id,sideLabel,Component,b)});item.appendChild(b);nav.appendChild(item)});return true;}
  document.addEventListener('click',event=>{
    const b=event.target.closest?.('.qmes-top-menu-button');
    if(!b||b.classList.contains('is-extension'))return;
    const raw=String(b.querySelector('span')?.textContent||b.textContent||'').replace(/\s+/g,' ').trim();
    const compact=raw.replace(/\s+/g,'');
    const group=nativeGroups[raw]||nativeGroups[compact];
    restoreNative();
    if(group)setTimeout(()=>window.qmesSetGlobalSidebarGroup?.(group),0);
  },true);
  const observer=new MutationObserver(()=>ensureButtons());
  function start(){ensureButtons();observer.observe(document.documentElement,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.qmesCloseBusinessExtension=restoreNative;
})();