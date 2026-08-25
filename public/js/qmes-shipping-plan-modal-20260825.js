(function(){
  if(window.__QMES_SHIPPING_PLAN_MODAL__) return;
  window.__QMES_SHIPPING_PLAN_MODAL__=true;

  function ensureStyle(){
    if(document.getElementById('qmes-shipping-plan-modal-style')) return;
    const style=document.createElement('style');
    style.id='qmes-shipping-plan-modal-style';
    style.textContent=`
      .qsp-overlay{position:fixed;inset:0;z-index:15000;background:rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;padding:18px}
      .qsp-modal{width:min(650px,94vw);background:#fff;border:1px solid #dbe3ec;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.25);padding:24px 28px 28px;color:#111827;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif}
      .qsp-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.qsp-head h2{margin:0;font-size:20px;font-weight:900;letter-spacing:-.4px}.qsp-close{width:32px;height:32px;border:0;background:transparent;color:#64748b;font-size:24px;line-height:1;border-radius:8px;cursor:pointer}.qsp-close:hover{background:#f1f5f9}
      .qsp-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px 18px}.qsp-field{display:flex;flex-direction:column;gap:7px}.qsp-field.full{grid-column:1/-1}.qsp-field label{font-size:13px;font-weight:800;color:#334155}.qsp-field input,.qsp-field select,.qsp-field textarea{width:100%;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#111827;font-size:13px;padding:0 10px;outline:none}.qsp-field input,.qsp-field select{height:38px}.qsp-field textarea{min-height:68px;padding-top:9px;resize:vertical}.qsp-field input:focus,.qsp-field select:focus,.qsp-field textarea:focus{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.08)}
      .qsp-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.qsp-cancel,.qsp-save{min-width:78px;height:38px;border-radius:8px;font-size:13px;font-weight:900;cursor:pointer}.qsp-cancel{border:1px solid #cbd5e1;background:#fff;color:#334155}.qsp-save{border:1px solid #1d4ed8;background:#2563eb;color:#fff}.qsp-save:hover{background:#1d4ed8}
      @media(max-width:640px){.qsp-grid{grid-template-columns:1fr}.qsp-field.full{grid-column:auto}.qsp-modal{padding:20px}}
    `;
    document.head.appendChild(style);
  }

  function closeModal(){document.querySelector('.qsp-overlay')?.remove();}

  function openModal(){
    ensureStyle();
    closeModal();
    const overlay=document.createElement('div');
    overlay.className='qsp-overlay';
    overlay.innerHTML=`<div class="qsp-modal" role="dialog" aria-modal="true" aria-label="출하계획 등록">
      <div class="qsp-head"><h2>출하계획 등록</h2><button type="button" class="qsp-close" aria-label="닫기">×</button></div>
      <form id="qsp-form">
        <div class="qsp-grid">
          <div class="qsp-field"><label>출하 예정일</label><input name="shipDate" type="date" required></div>
          <div class="qsp-field"><label>수주번호</label><input name="salesOrder" placeholder="예: SO-260825-01"></div>
          <div class="qsp-field"><label>고객사</label><select name="customer"><option value="">선택</option><option>현대자동차</option><option>삼성SDI</option><option>SK</option><option>기타</option></select></div>
          <div class="qsp-field"><label>Grd 제품명</label><input name="grdProductName" placeholder="Grd 제품명을 입력하세요"></div>
          <div class="qsp-field"><label>완제품 LOT</label><input name="lot" placeholder="예: FG-260825-01"></div>
          <div class="qsp-field"><label>출하 수량 (kg)</label><input name="qty" inputmode="decimal" placeholder="예: 2000"></div>
          <div class="qsp-field full"><label>배송 / 배차 정보</label><input name="delivery" placeholder="차량번호, 운송사, 기사 연락처 등"></div>
          <div class="qsp-field full"><label>비고</label><textarea name="note" placeholder="특이사항을 입력하세요."></textarea></div>
        </div>
        <div class="qsp-actions"><button type="button" class="qsp-cancel">취소</button><button type="submit" class="qsp-save">등록</button></div>
      </form>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal();});
    overlay.querySelector('.qsp-close').addEventListener('click',closeModal);
    overlay.querySelector('.qsp-cancel').addEventListener('click',closeModal);
    overlay.querySelector('#qsp-form').addEventListener('submit',e=>{
      e.preventDefault();
      const form=new FormData(e.currentTarget);
      const row=Object.fromEntries(form.entries());
      try{
        const saved=JSON.parse(localStorage.getItem('qmes-shipping-plans-v1')||'[]');
        const list=Array.isArray(saved)?saved:[];
        list.unshift({...row,id:'SHIP-'+Date.now(),createdAt:new Date().toISOString(),status:'출하예정'});
        localStorage.setItem('qmes-shipping-plans-v1',JSON.stringify(list));
      }catch(err){console.warn('[QMES] shipping plan local save failed',err);}
      closeModal();
      alert('출하계획이 등록되었습니다.');
      window.dispatchEvent(new CustomEvent('qmes:shipping-plan-saved'));
    });
    setTimeout(()=>overlay.querySelector('input[name="shipDate"]')?.focus(),0);
  }

  document.addEventListener('click',function(e){
    const btn=e.target.closest('button');
    if(!btn) return;
    const text=(btn.textContent||'').replace(/\s+/g,' ').trim();
    if(text!=='+ 출하계획'&&text!=='출하계획') return;
    const host=btn.closest('.qmes-business-extension')||btn.closest('#qmes-business-extension-host');
    const title=host?.querySelector('.qbe-title,h1')?.textContent||'';
    if(!title.includes('출하')&&!document.body.textContent.includes('출하 · 납품관리')) return;
    e.preventDefault();
    e.stopPropagation();
    openModal();
  },true);

  window.qmesOpenShippingPlanModal=openModal;
})();

/* Restore the latest integrated dashboard only. Do not restore the old preview shell/sidebar. */
(function(){
  if(window.__QMES_LATEST_DASHBOARD_RESTORE__) return;
  window.__QMES_LATEST_DASHBOARD_RESTORE__=true;

  const style=document.createElement('style');
  style.id='qmes-latest-dashboard-restore-style';
  style.textContent=`
    /* New business top menus use exactly the same states as native top menus. */
    body>#root header .qmes-top-menu-button.is-extension{background:#fff!important;color:#111!important;border-radius:0!important}
    body>#root header .qmes-top-menu-button.is-extension:hover{background:#f1f5f9!important;color:#111!important}
    body>#root header .qmes-top-menu-button.is-extension.is-active{background:#eef6ff!important;color:#111!important}
    body>#root header .qmes-top-menu-button.is-extension:after,.qmes-extension-badge{display:none!important;content:none!important}
    #qmes-latest-dashboard-host{width:100%;box-sizing:border-box}
  `;
  document.head.appendChild(style);

  function mainEl(){return document.querySelector('#root>div>main');}
  function textOf(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim();}
  function dashboardButton(){return [...document.querySelectorAll('.qmes-top-menu-button')].find(b=>textOf(b).includes('대시보드'));}

  function restoreNative(){
    const host=document.getElementById('qmes-latest-dashboard-host');
    host?.remove();
    const main=mainEl();
    if(!main)return;
    [...main.children].forEach(child=>{if(child.dataset.qmesLatestDashHidden==='1'){child.style.removeProperty('display');delete child.dataset.qmesLatestDashHidden;}});
  }

  function go(tab){
    if(['sales','plan','purchase','recipe','shipping'].includes(tab)){
      document.querySelector(`[data-qbe-menu="${tab}"] .qmes-top-menu-button`)?.click();
      return;
    }
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab}}));
  }

  function dashboardHtml(){return `<div class="qmes-preview-dashboard">
    <div class="qpd-title-row"><div><h1>종합 대시보드</h1><p>기존 QMES에 수주·MRP·구매·Recipe·납품 흐름을 합친 통합 화면</p></div><button type="button" class="qpd-primary" data-qpd-go="plan">+ 생산계획 등록</button></div>
    <div class="qpd-kpis">
      <div class="qpd-kpi"><span>금월 수주</span><b>12,500 kg</b><small>5건 / 고객사 3개</small></div>
      <div class="qpd-kpi orange"><span>생산 예정</span><b>8,400 kg</b><small>금주 작업지시 6건</small></div>
      <div class="qpd-kpi red"><span>MRP 부족 원료</span><b>3 품목</b><small>NMP · PVDF · 첨가제</small></div>
      <div class="qpd-kpi green"><span>생산 완료율</span><b>92.4%</b><small>계획 대비 실적</small></div>
      <div class="qpd-kpi slate"><span>출하 대기</span><b>2,150 kg</b><small>OQC 합격 기준</small></div>
    </div>
    <section class="qpd-card"><div class="qpd-card-head"><h2>QMES 통합 업무 흐름</h2><span>파랑 = 기존 / 주황 = 추가</span></div><div class="qpd-flow">
      <button class="qpd-flow-step add" data-qpd-go="sales"><strong>수주</strong><small>고객 PO / 납기</small></button><i>›</i>
      <button class="qpd-flow-step add" data-qpd-go="plan"><strong>생산계획</strong><small>월·주·일 계획</small></button><i>›</i>
      <button class="qpd-flow-step add" data-qpd-go="plan"><strong>MRP</strong><small>Recipe 소요량</small></button><i>›</i>
      <button class="qpd-flow-step add" data-qpd-go="purchase"><strong>구매/발주</strong><small>부족원료 확보</small></button><i>›</i>
      <button class="qpd-flow-step now" data-qpd-go="iqc"><strong>IQC</strong><small>수입검사</small></button><i>›</i>
      <button class="qpd-flow-step now" data-qpd-go="inv"><strong>원재료 재고</strong><small>RM / 위치 / LOT</small></button><i>›</i>
      <button class="qpd-flow-step now" data-qpd-go="woIssue"><strong>작업지시</strong><small>생산 LOT</small></button><i>›</i>
      <button class="qpd-flow-step now" data-qpd-go="prodProcess"><strong>생산공정</strong><small>계량/배합/충진</small></button><i>›</i>
      <button class="qpd-flow-step now" data-qpd-go="pqc"><strong>PQC</strong><small>공정검사</small></button><i>›</i>
      <button class="qpd-flow-step now" data-qpd-go="oqc"><strong>OQC / CoA</strong><small>출하검사</small></button><i>›</i>
      <button class="qpd-flow-step add" data-qpd-go="shipping"><strong>출하/납품</strong><small>납품완료</small></button>
    </div></section>
    <div class="qpd-grid2">
      <section class="qpd-card"><div class="qpd-card-head"><h2>금주 생산계획 / 진행현황</h2><button type="button" data-qpd-go="plan">전체보기</button></div><div class="qpd-table-wrap"><table><thead><tr><th>생산일</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>계획량</th><th>진행상태</th></tr></thead><tbody>
        <tr><td>08-24</td><td>현대자동차</td><td>전도 슬러리 A</td><td>240824-01</td><td>2,000 kg</td><td><span class="qpd-status blue">PQC 진행</span></td></tr>
        <tr><td>08-25</td><td>삼성SDI</td><td>Binder Solution</td><td>250825-01</td><td>1,500 kg</td><td><span class="qpd-status orange">원료 준비</span></td></tr>
        <tr><td>08-26</td><td>SK</td><td>전도 슬러리 B</td><td>260826-01</td><td>2,400 kg</td><td><span class="qpd-status green">자재 확보</span></td></tr>
        <tr><td>08-27</td><td>현대자동차</td><td>Binder Solution</td><td>270827-01</td><td>2,500 kg</td><td><span class="qpd-status red">NMP 부족</span></td></tr>
      </tbody></table></div></section>
      <section class="qpd-card"><div class="qpd-card-head"><h2>실행 필요 알림</h2><span>4건</span></div><div class="qpd-alerts"><div class="red"><span>NMP 재고 250kg 부족</span><b>발주 필요</b></div><div class="orange"><span>PVDF 입고예정일 임박</span><b>08/25</b></div><div class="blue"><span>LOT 240824-01 PQC 대기</span><b>검사실</b></div><div class="orange"><span>현대자동차 출하 예정</span><b>08/26</b></div></div></section>
    </div>
  </div>`;}

  function openDashboard(){
    const main=mainEl();
    if(!main)return false;
    restoreNative();
    const host=document.createElement('div');host.id='qmes-latest-dashboard-host';host.innerHTML=dashboardHtml();
    [...main.children].forEach(child=>{child.dataset.qmesLatestDashHidden='1';child.style.display='none';});
    main.prepend(host);
    host.addEventListener('click',e=>{const b=e.target.closest('[data-qpd-go]');if(!b)return;go(b.dataset.qpdGo);});
    return true;
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('.qmes-top-menu-button');
    if(!b)return;
    if(textOf(b).includes('대시보드')) setTimeout(openDashboard,80);
    else restoreNative();
  },false);

  function initial(){
    const btn=dashboardButton();
    if(!btn)return false;
    const active=btn.classList.contains('is-active');
    let ext='';try{ext=sessionStorage.getItem('qmes_business_extension_tab')||'';}catch(e){}
    if(active&&!ext)openDashboard();
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(initial()||tries>30)clearInterval(timer);},120);
})();