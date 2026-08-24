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
          <div class="qsp-field"><label>제품</label><select name="product"><option value="">선택</option><option>전도 슬러리 A</option><option>전도 슬러리 B</option><option>Binder Solution</option></select></div>
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

/* Keep one left menu only: the existing hamburger sidebar. */
(function(){
  if(window.__QMES_LEFT_MENU_SAFE_RESTORE__) return;
  window.__QMES_LEFT_MENU_SAFE_RESTORE__=true;

  const businessMenus=[
    ['sales','수주 · 납기관리'],
    ['plan','생산계획 · MRP'],
    ['purchase','구매 · 발주관리'],
    ['recipe','Recipe / BOM'],
    ['shipping','출하 · 납품관리']
  ];

  function ensureRestoreStyle(){
    if(document.getElementById('qmes-left-menu-safe-restore-style')) return;
    const style=document.createElement('style');
    style.id='qmes-left-menu-safe-restore-style';
    style.textContent=`
      #qps-sidebar,#qmes-preview-sidebar{display:none!important;visibility:hidden!important;pointer-events:none!important;width:0!important;overflow:hidden!important}
      #qmes-sync-sidebar{border-right:1px solid #e2e8f0!important}
      #qmes-business-side-group{margin:12px 0 4px!important;padding-top:10px!important;border-top:1px solid #e2e8f0!important}
      #qmes-business-side-group .qmes-business-side-title{padding:4px 12px 6px!important;color:#94a3b8!important;font-size:10px!important;font-weight:900!important;letter-spacing:.7px!important}
      #qmes-business-side-group .qmes-side-item{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:40px!important;padding:9px 10px 9px 14px!important;margin:2px 0!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#475569!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important}
      #qmes-business-side-group .qmes-side-item:hover{background:#f4f7fa!important;color:#172033!important}
    `;
    document.head.appendChild(style);
  }

  function removeDuplicateSidebar(){
    document.querySelectorAll('#qps-sidebar,#qmes-preview-sidebar').forEach(el=>el.remove());
  }

  function syncMainWidth(){
    const main=document.querySelector('#root>div>main');
    if(!main) return;
    const open=document.body.classList.contains('qmes-side-open');
    const narrow=window.matchMedia('(max-width:900px)').matches;
    if(open){
      const width=narrow?'190px':'220px';
      main.style.setProperty('margin-left',width,'important');
      main.style.setProperty('width','calc(100% - '+width+')','important');
    }else{
      main.style.setProperty('margin-left','0','important');
      main.style.setProperty('width','100%','important');
    }
  }

  function clickExtension(id){
    const button=document.querySelector(`[data-qbe-menu="${id}"] .qmes-top-menu-button`) || document.querySelector(`[data-qbe-menu="${id}"] button`);
    if(!button) return;
    button.click();
    setTimeout(()=>document.querySelector('#qmes-sync-sidebar .qmes-side-close')?.click(),40);
  }

  function ensureBusinessMenus(){
    const side=document.getElementById('qmes-sync-sidebar');
    if(!side) return;
    let group=document.getElementById('qmes-business-side-group');
    if(!group){
      group=document.createElement('div');
      group.id='qmes-business-side-group';
      const title=document.createElement('div');
      title.className='qmes-business-side-title';
      title.textContent='업무 관리';
      group.appendChild(title);
      businessMenus.forEach(([id,label])=>{
        const button=document.createElement('button');
        button.type='button';
        button.className='qmes-side-item';
        button.dataset.qmesBusiness=id;
        button.textContent=label;
        button.addEventListener('click',()=>clickExtension(id));
        group.appendChild(button);
      });
      side.appendChild(group);
    }
    const input=side.querySelector('.qmes-side-search-input');
    if(input && !input.dataset.qmesBusinessSearchBound){
      input.dataset.qmesBusinessSearchBound='1';
      input.addEventListener('input',()=>{
        const q=(input.value||'').replace(/\s+/g,' ').trim().toLowerCase();
        let visible=0;
        group.querySelectorAll('[data-qmes-business]').forEach(button=>{
          const show=!q || button.textContent.toLowerCase().includes(q);
          button.style.display=show?'flex':'none';
          if(show) visible++;
        });
        group.style.display=!q || visible?'block':'none';
      });
    }
  }

  function reconcile(){
    ensureRestoreStyle();
    removeDuplicateSidebar();
    ensureBusinessMenus();
    syncMainWidth();
  }

  const observer=new MutationObserver(()=>reconcile());
  function start(){
    reconcile();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setInterval(reconcile,500);
    window.addEventListener('resize',syncMainWidth);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
