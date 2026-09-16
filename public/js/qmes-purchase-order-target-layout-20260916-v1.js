/* NAMO QMES - approved purchase-order modal target layout (additive only)
 * 2026-09-16
 * Scope: purchase modal only. Existing purchase logic and data are preserved.
 * No background POST/PUT/DELETE and no dashboard/global-layout changes.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_ORDER_TARGET_LAYOUT_20260916_V1__) return;
  window.__QMES_PURCHASE_ORDER_TARGET_LAYOUT_20260916_V1__=true;

  const STYLE_ID='qpdz-target-layout-style-20260916-v1';
  const READY='qpdzTargetReady';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;};
  const won=v=>Math.round(num(v)).toLocaleString('ko-KR');
  let queued=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
.qmes-purchase-live .qpx-form-card.qpdz-target-modal{width:min(1500px,96vw)!important;max-height:94vh!important;padding:0 18px 0!important;overflow:auto!important;background:#fff!important}
.qmes-purchase-live .qpx-form-card.qpdz-target-modal .qpx-modal-head{margin:0 -18px 10px!important;padding:13px 20px!important;min-height:70px!important;background:linear-gradient(135deg,#0d6da9,#07609a)!important}
.qmes-purchase-live .qpdz-title-left{display:flex!important;align-items:center!important;gap:13px!important}
.qmes-purchase-live .qpdz-cart{width:38px;height:38px;display:grid;place-items:center;flex:none;color:#bfe1f6}
.qmes-purchase-live .qpdz-cart svg{width:31px;height:31px;display:block;fill:none;stroke:currentColor;stroke-width:1.8}
.qmes-purchase-live .qpx-modal-head h3{font-size:21px!important;line-height:1.15!important;margin:0!important}
.qmes-purchase-live .qpx-modal-head p{font-size:11px!important;margin:4px 0 0!important;opacity:.92!important}
.qmes-purchase-live .qpx-modal-head .qpx-steps{gap:10px!important}
.qmes-purchase-live .qpx-modal-head .qpx-step{font-size:10px!important;opacity:.96!important;white-space:nowrap!important}
.qmes-purchase-live .qpx-modal-head .qpx-step b{width:25px!important;height:25px!important}
.qmes-purchase-live .qpx-modal-head .qpx-step:first-child b{background:#0787df!important;color:#fff!important;box-shadow:0 0 0 2px rgba(255,255,255,.18)}
.qmes-purchase-live .qpx-form-card .qerp-form.qpdz-target-form{display:block!important;position:relative!important;padding:4px 2px 68px!important;margin:0!important;min-height:0!important}
.qmes-purchase-live .qpdz-original-hidden{position:absolute!important;left:-200vw!important;top:0!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;margin:0!important;padding:0!important}
.qmes-purchase-live .qpdz-target-ui{display:flex;flex-direction:column;gap:10px;color:#18344f}
.qmes-purchase-live .qpdz-section{border:1px solid #dce6ef;border-radius:8px;overflow:hidden;background:#fff}
.qmes-purchase-live .qpdz-section-head{height:38px;display:flex;align-items:center;gap:10px;padding:0 12px;background:linear-gradient(90deg,#f4f8fb,#edf4f9);border-bottom:1px solid #e0e8ef}
.qmes-purchase-live .qpdz-section-num{width:29px;height:29px;border-radius:50%;display:grid;place-items:center;background:#0c6eaa;color:#fff;font-size:15px;font-weight:950;flex:none}
.qmes-purchase-live .qpdz-section-title{font-size:14px;font-weight:950;color:#18344f;white-space:nowrap}
.qmes-purchase-live .qpdz-section-help{font-size:10px;color:#73879b;font-weight:650;margin-left:4px}
.qmes-purchase-live .qpdz-section-body{padding:10px 11px 11px}
.qmes-purchase-live .qpdz-basic-grid{display:grid;grid-template-columns:1.1fr 1.1fr 1fr 1.15fr 1fr;gap:10px 18px;align-items:end}
.qmes-purchase-live .qpdz-field{min-width:0}
.qmes-purchase-live .qpdz-field label{display:block;margin:0 0 5px;font-size:10px;font-weight:850;color:#3c5871}
.qmes-purchase-live .qpdz-field label .req{color:#e43939;margin-left:2px}
.qmes-purchase-live .qpdz-field input,.qmes-purchase-live .qpdz-field select,.qmes-purchase-live .qpdz-field textarea{width:100%;height:35px;box-sizing:border-box;border:1px solid #cbd9e6;border-radius:5px;background:#fff;padding:0 9px;color:#263f58;font-size:11px;outline:none}
.qmes-purchase-live .qpdz-field textarea{height:58px;padding-top:8px;resize:vertical}
.qmes-purchase-live .qpdz-field input:focus,.qmes-purchase-live .qpdz-field select:focus,.qmes-purchase-live .qpdz-field textarea:focus{border-color:#2d91cf;box-shadow:0 0 0 2px rgba(45,145,207,.10)}
.qmes-purchase-live .qpdz-field input[readonly]{background:#eef2f5;color:#65798c}
.qmes-purchase-live .qpdz-inline{display:flex;gap:6px;align-items:center}
.qmes-purchase-live .qpdz-inline>input,.qmes-purchase-live .qpdz-inline>select{min-width:0;flex:1}
.qmes-purchase-live .qpdz-check-inline{display:flex;align-items:center;gap:6px;font-size:10px;color:#48627a;font-weight:750;white-space:nowrap}
.qmes-purchase-live .qpdz-check-inline input{width:15px!important;height:15px!important;margin:0!important;accent-color:#1286d3}
.qmes-purchase-live .qpdz-icon-btn,.qmes-purchase-live .qpdz-soft-btn,.qmes-purchase-live .qpdz-blue-btn,.qmes-purchase-live .qpdz-red-btn{height:35px;border-radius:5px;padding:0 11px;border:1px solid #c7d8e6;background:#fff;color:#34526b;font-size:10px;font-weight:850;cursor:pointer;white-space:nowrap}
.qmes-purchase-live .qpdz-icon-btn{width:39px;padding:0;color:#0e75ba;font-size:16px}
.qmes-purchase-live .qpdz-blue-btn{background:#1688cf;border-color:#1688cf;color:#fff}
.qmes-purchase-live .qpdz-red-btn{border-color:#f0c8c8;color:#d74848;background:#fffafa}
.qmes-purchase-live .qpdz-items-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.qmes-purchase-live .qpdz-items-actions{display:flex;gap:7px;align-items:center;margin-left:auto}
.qmes-purchase-live .qpdz-table-wrap{overflow:auto}
.qmes-purchase-live .qpdz-target-table{width:100%;min-width:1290px;border-collapse:collapse;table-layout:fixed}
.qmes-purchase-live .qpdz-target-table th{height:34px;background:#edf4f9;border-right:1px solid #dce6ef;border-bottom:1px solid #d7e2eb;padding:0 6px;color:#38536c;font-size:10px;font-weight:900;text-align:center;white-space:nowrap}
.qmes-purchase-live .qpdz-target-table td{height:39px;border-right:1px solid #e5edf3;border-bottom:1px solid #e5edf3;padding:4px 5px;color:#29445d;font-size:10px;text-align:center;background:#fff}
.qmes-purchase-live .qpdz-target-table input,.qmes-purchase-live .qpdz-target-table select{width:100%;height:29px;box-sizing:border-box;border:1px solid #cfdce7;border-radius:4px;background:#fff;padding:0 6px;font-size:10px;color:#29445d;outline:none}
.qmes-purchase-live .qpdz-target-table input:focus,.qmes-purchase-live .qpdz-target-table select:focus{border-color:#3296d3}
.qmes-purchase-live .qpdz-target-table .money{text-align:right;font-variant-numeric:tabular-nums;font-weight:750;white-space:nowrap}
.qmes-purchase-live .qpdz-grid-hint{height:30px;display:grid;place-items:center;background:#f6f9fb;border-bottom:1px solid #e3ebf1;font-size:10px;color:#8091a1}
.qmes-purchase-live .qpdz-totalbar{display:flex;align-items:stretch;border-top:0;background:#fff}
.qmes-purchase-live .qpdz-total-count{display:flex;align-items:center;padding:0 12px;font-size:10px;font-weight:850;color:#425d75;flex:1}
.qmes-purchase-live .qpdz-totalbox{width:165px;padding:7px 12px;border-left:1px solid #d8e3ec;text-align:center;background:#f8fbfd}
.qmes-purchase-live .qpdz-totalbox span{display:block;font-size:9px;font-weight:800;color:#60778d;margin-bottom:2px}
.qmes-purchase-live .qpdz-totalbox b{font-size:14px;color:#173b5c;font-variant-numeric:tabular-nums}
.qmes-purchase-live .qpdz-totalbox.grand{background:#123e64}
.qmes-purchase-live .qpdz-totalbox.grand span,.qmes-purchase-live .qpdz-totalbox.grand b{color:#fff}
.qmes-purchase-live .qpdz-quality-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 18px;align-items:end}
.qmes-purchase-live .qpdz-quality-check{display:grid;grid-template-columns:23px 1fr;gap:7px;align-items:center;min-height:48px}
.qmes-purchase-live .qpdz-quality-check input{width:18px;height:18px;accent-color:#1389d6}
.qmes-purchase-live .qpdz-quality-check strong{display:block;font-size:11px;color:#304c65}
.qmes-purchase-live .qpdz-quality-check small{display:block;margin-top:2px;font-size:9px;color:#7a8fa2}
.qmes-purchase-live .qpdz-quality-lower{display:grid;grid-template-columns:1fr 1fr 1fr 1.7fr;gap:12px;margin-top:8px}
.qmes-purchase-live .qpdz-quality-lower input,.qmes-purchase-live .qpdz-quality-lower select{width:100%;height:32px;box-sizing:border-box;border:1px solid #cedbe6;border-radius:5px;background:#fff;padding:0 8px;font-size:10px;color:#36516a}
.qmes-purchase-live .qpdz-approval-row{display:grid;grid-template-columns:1fr 1.25fr 1.4fr;gap:16px;align-items:center}
.qmes-purchase-live .qpdz-file-line{display:flex;align-items:center;gap:7px;min-width:0}
.qmes-purchase-live .qpdz-file-name{font-size:10px;color:#8191a0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qmes-purchase-live .qpdz-footer{position:sticky;bottom:-1px;z-index:8;margin:0 -20px -1px;padding:9px 18px;background:#fff;border-top:1px solid #dce6ef;display:flex;justify-content:flex-end;gap:8px;box-shadow:0 -3px 10px rgba(23,53,78,.05)}
.qmes-purchase-live .qpdz-footer button{height:38px;min-width:90px;padding:0 16px;border-radius:6px;border:1px solid #c4d3df;background:#fff;color:#344f68;font-size:11px;font-weight:900;cursor:pointer}
.qmes-purchase-live .qpdz-footer .draft{background:#f8fafc}
.qmes-purchase-live .qpdz-footer .submit{background:#0c8be1;border-color:#0c8be1;color:#fff;min-width:110px}
.qmes-purchase-live .qpdz-toast{position:fixed;right:26px;bottom:26px;z-index:100200;background:#173e5e;color:#fff;border-radius:7px;padding:10px 14px;font-size:10px;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.18)}
@media(max-width:1200px){.qmes-purchase-live .qpdz-basic-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.qmes-purchase-live .qpdz-quality-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.qmes-purchase-live .qpdz-quality-lower{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.qmes-purchase-live .qpdz-basic-grid,.qmes-purchase-live .qpdz-quality-grid,.qmes-purchase-live .qpdz-quality-lower,.qmes-purchase-live .qpdz-approval-row{grid-template-columns:1fr}.qmes-purchase-live .qpx-modal-head .qpx-steps{display:none!important}}
`;
    document.head.appendChild(s);
  }

  function findModal(){
    return document.querySelector('.qmes-purchase-live .qpx-form-card') || null;
  }

  function findControl(form,names,preferCheckbox){
    const controls=[...form.querySelectorAll('input,select,textarea')].filter(el=>!el.closest('.qpdz-target-ui'));
    let best=null,bestScore=0;
    controls.forEach(el=>{
      if(preferCheckbox && el.type!=='checkbox') return;
      if(!preferCheckbox && el.type==='checkbox') return;
      const box=el.closest('.qerp-field,.form-group,label,div');
      const text=clean((box&&box.textContent)||'')+' '+clean(el.name)+' '+clean(el.id)+' '+clean(el.placeholder)+' '+clean(el.getAttribute('aria-label'));
      names.forEach(name=>{
        const n=clean(name);
        let score=0;
        if(text===n) score=10;
        else if(text.includes(n)) score=Math.max(3,n.length);
        if(score>bestScore){bestScore=score;best=el;}
      });
    });
    return best;
  }

  function setNative(el,value){
    if(!el) return;
    if(el.type==='checkbox'){
      const d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'checked');
      d&&d.set?d.set.call(el,!!value):(el.checked=!!value);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      return;
    }
    let proto=HTMLInputElement.prototype;
    if(el instanceof HTMLSelectElement) proto=HTMLSelectElement.prototype;
    else if(el instanceof HTMLTextAreaElement) proto=HTMLTextAreaElement.prototype;
    const d=Object.getOwnPropertyDescriptor(proto,'value');
    d&&d.set?d.set.call(el,String(value??'')):(el.value=String(value??''));
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function bind(proxy,original){
    if(!proxy||!original) return;
    proxy._qpdzOriginal=original;
    if(proxy instanceof HTMLSelectElement && original instanceof HTMLSelectElement && original.options.length){
      proxy.innerHTML='';
      [...original.options].forEach(o=>proxy.add(new Option(o.text,o.value,o.defaultSelected,o.selected)));
    }
    if(original.type==='checkbox') proxy.checked=!!original.checked;
    else if(original.value!=null){
      if(proxy instanceof HTMLSelectElement && ![...proxy.options].some(o=>o.value===String(original.value))){proxy.add(new Option(String(original.value),String(original.value)));}
      proxy.value=original.value;
    }
    const push=()=>{
      setNative(original,proxy.type==='checkbox'?proxy.checked:proxy.value);
      document.querySelectorAll('.qpdz-target-ui input,.qpdz-target-ui select,.qpdz-target-ui textarea').forEach(peer=>{
        if(peer!==proxy && peer._qpdzOriginal===original){peer.type==='checkbox'?(peer.checked=original.checked):(peer.value=original.value);}
      });
    };
    proxy.addEventListener('input',push);
    proxy.addEventListener('change',push);
  }

  function toast(msg){
    document.querySelectorAll('.qpdz-toast').forEach(n=>n.remove());
    const t=document.createElement('div');t.className='qpdz-toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800);
  }

  function decorateHeader(modal){
    const head=modal.querySelector('.qpx-modal-head');
    if(!head) return;
    const left=head.firstElementChild;
    if(left){
      left.classList.add('qpdz-title-left');
      const h=left.querySelector('h3'); if(h) h.textContent='신규 구매 발주 등록';
      const p=left.querySelector('p'); if(p) p.textContent='MRP·작업지시·협력사·IQC를 하나의 발주번호로 연결합니다.';
      if(!left.querySelector('.qpdz-cart')) left.insertAdjacentHTML('afterbegin','<span class="qpdz-cart" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M3 5h4l3.2 14.2h13.9l3-10.2H9"/><circle cx="13" cy="25.5" r="1.7"/><circle cx="23" cy="25.5" r="1.7"/></svg></span>');
    }
    const steps=[...head.querySelectorAll('.qpx-step')];
    ['기본정보','품목등록','품질요구사항','결재상신'].forEach((txt,i)=>{if(steps[i]){const b=steps[i].querySelector('b');steps[i].childNodes.forEach(n=>{if(n.nodeType===3)n.textContent=' '+txt;});if(b)b.textContent=String(i+1);}});
  }

  function buildUI(modal,form){
    const originalSubmit=[...form.querySelectorAll('button')].find(b=>b.type==='submit'||/저장|등록|결재\s*상신/.test(clean(b.textContent)));
    const originalCancel=[...form.querySelectorAll('button')].find(b=>/취소|닫기/.test(clean(b.textContent)));
    const originals={
      poNo:findControl(form,['발주번호','PO 번호']), purchaseType:findControl(form,['구매 구분','구매구분','발주 구분']), productionType:findControl(form,['생산 구분','생산구분']), supplier:findControl(form,['협력사','거래처','공급사']),
      orderDate:findControl(form,['발주일','주문일']), due:findControl(form,['요청납기','요청 납기','납기일']), confirmedDue:findControl(form,['협력사 확정 납기','확정 납기','확정납기']), priority:findControl(form,['납기 우선순위','우선순위']), payment:findControl(form,['결제 조건','결제조건']),
      mrp:findControl(form,['연결 MRP','구매요청','MRP']), wo:findControl(form,['연결 작업지시서','작업지시','WO']), warehouse:findControl(form,['입고 창고','입고창고','창고']), buyer:findControl(form,['구매 담당자','담당자']), dept:findControl(form,['구매 부서','부서']),
      code:findControl(form,['품목코드','자재코드']), item:findControl(form,['품목명','품목','자재명']), spec:findControl(form,['규격']), qty:findControl(form,['발주수량','수량']), unit:findControl(form,['단위']), price:findControl(form,['단가']), remark:findControl(form,['비고','특기사항']),
      iqc:findControl(form,['IQC 필수','수입검사'],true), coa:findControl(form,['CoA 동봉','CoA','성적서'],true), msds:findControl(form,['MSDS 동봉','MSDS'],true), lot:findControl(form,['제조 LOT','유효기한','LOT'],true)
    };

    [...form.children].forEach(el=>{if(!el.classList.contains('qpdz-target-ui')) el.classList.add('qpdz-original-hidden');});
    form.classList.add('qpdz-target-form');
    modal.classList.add('qpdz-target-modal');

    const ui=document.createElement('div');
    ui.className='qpdz-target-ui';
    ui.innerHTML=`
      <section class="qpdz-section"><div class="qpdz-section-head"><span class="qpdz-section-num">1</span><span class="qpdz-section-title">발주 기본 정보</span></div><div class="qpdz-section-body"><div class="qpdz-basic-grid">
        <div class="qpdz-field"><label>발주번호</label><div class="qpdz-inline"><input data-bind="poNo" readonly placeholder="자동 채번"><span class="qpdz-check-inline"><input type="checkbox" checked>자동 채번</span></div></div>
        <div class="qpdz-field"><label>구매 구분<span class="req">*</span></label><select data-bind="purchaseType"><option>MRP 자동발주</option><option>일반 구매</option><option>긴급 구매</option></select></div>
        <div class="qpdz-field"><label>생산 구분</label><select data-bind="productionType"><option>D-양산</option><option>개발/샘플</option><option>기타</option></select></div>
        <div class="qpdz-field" style="grid-column:span 2"><label>협력사<span class="req">*</span></label><div class="qpdz-inline"><input data-bind="supplier" placeholder="협력사 검색"><button type="button" class="qpdz-icon-btn" data-action="supplier-search">⌕</button><button type="button" class="qpdz-soft-btn" data-action="new-supplier">＋ 신규 협력사</button></div></div>
        <div class="qpdz-field"><label>발주일<span class="req">*</span></label><input type="date" data-bind="orderDate"></div>
        <div class="qpdz-field"><label>요청납기<span class="req">*</span></label><input type="date" data-bind="due"></div>
        <div class="qpdz-field"><label>협력사 확정 납기</label><input type="date" data-bind="confirmedDue"></div>
        <div class="qpdz-field"><label>납기 우선순위</label><select data-bind="priority"><option>일반</option><option>긴급</option><option>최우선</option></select></div>
        <div class="qpdz-field"><label>결제 조건</label><select data-bind="payment"><option>월 마감 후 30일</option><option>익월 말일</option><option>현금</option></select></div>
        <div class="qpdz-field"><label>연결 MRP / 구매요청</label><div class="qpdz-inline"><input data-bind="mrp" placeholder="MRP- 또는 PR- 검색"><button type="button" class="qpdz-icon-btn" data-action="mrp-search">⌕</button></div></div>
        <div class="qpdz-field"><label>연결 작업지시서</label><div class="qpdz-inline"><input data-bind="wo" placeholder="WO- 검색"><button type="button" class="qpdz-icon-btn" data-action="wo-search">⌕</button></div></div>
        <div class="qpdz-field"><label>입고 창고</label><select data-bind="warehouse"><option>원자재 창고</option><option>완제품 창고</option></select></div>
        <div class="qpdz-field"><label>구매 담당자</label><input data-bind="buyer" readonly></div>
        <div class="qpdz-field"><label>구매 부서</label><input data-bind="dept" readonly></div>
      </div></div></section>

      <section class="qpdz-section"><div class="qpdz-section-head qpdz-items-head"><span class="qpdz-section-num">2</span><span class="qpdz-section-title">발주 품목 및 금액</span><span class="qpdz-section-help">여러 품목을 등록할 수 있습니다. (더존 ERP 방식)</span><div class="qpdz-items-actions"><button type="button" class="qpdz-blue-btn" data-action="add-row">＋ 품목 추가</button><button type="button" class="qpdz-red-btn" data-action="delete-row">× 선택 삭제</button><button type="button" class="qpdz-soft-btn" data-action="upload">⇩ 엑셀 업로드</button><button type="button" class="qpdz-soft-btn" data-action="download">⇩ 엑셀 다운로드</button></div></div>
        <div class="qpdz-table-wrap"><table class="qpdz-target-table"><thead><tr><th style="width:35px"><input type="checkbox" data-grid-all></th><th style="width:45px">No.</th><th style="width:110px">품목코드</th><th style="width:150px">품목명 *</th><th style="width:85px">규격</th><th style="width:85px">발주수량 *</th><th style="width:70px">단위</th><th style="width:95px">단가 (원)</th><th style="width:105px">공급가액 (원)</th><th style="width:95px">부가세 10% (원)</th><th style="width:105px">합계금액 (원)</th><th style="width:115px">요청납기</th><th style="width:110px">비고</th></tr></thead><tbody data-grid-body></tbody></table></div>
        <div class="qpdz-grid-hint">품목을 추가하려면 ‘품목 추가’ 버튼을 클릭하세요.</div>
        <div class="qpdz-totalbar"><div class="qpdz-total-count" data-total-count>총 1건</div><div class="qpdz-totalbox"><span>공급가액 합계</span><b data-total-supply>0</b></div><div class="qpdz-totalbox"><span>부가세 합계</span><b data-total-vat>0</b></div><div class="qpdz-totalbox grand"><span>총 합계금액</span><b data-total-grand>0</b></div></div>
      </section>

      <section class="qpdz-section"><div class="qpdz-section-head"><span class="qpdz-section-num">3</span><span class="qpdz-section-title">입고 · 품질 요구사항</span><span class="qpdz-section-help">발주 시 설정한 품질 요구사항은 입고·IQC 단계에 자동으로 반영됩니다.</span></div><div class="qpdz-section-body">
        <div class="qpdz-quality-grid">
          <label class="qpdz-quality-check"><input type="checkbox" data-check="iqc" checked><span><strong>IQC 필수</strong><small>수입검사 필수 진행</small></span></label>
          <label class="qpdz-quality-check"><input type="checkbox" data-check="coa" checked><span><strong>CoA 동봉</strong><small>분석성적서 필수</small></span></label>
          <label class="qpdz-quality-check"><input type="checkbox" data-check="msds" checked><span><strong>MSDS 동봉</strong><small>물질안전보건자료</small></span></label>
          <label class="qpdz-quality-check"><input type="checkbox" data-check="lot" checked><span><strong>제조 LOT·유효기한 표시</strong><small>LOT 및 유효기한 필수</small></span></label>
        </div>
        <div class="qpdz-quality-lower"><select data-quality-local="warehouse"><option>남자재 창고</option><option>원자재 창고</option></select><select data-quality-local="spec"><option>핵기사양</option><option>일반사양</option></select><select data-quality-local="grade"><option>특/중급</option><option>일반</option></select><input data-quality-local="note" placeholder="CoA 사전 송부, 포장 상태 확인, 납품 전 연락 요망 등"></div>
      </div></section>

      <section class="qpdz-section"><div class="qpdz-section-head"><span class="qpdz-section-num">4</span><span class="qpdz-section-title">결재 및 첨부</span></div><div class="qpdz-section-body"><div class="qpdz-approval-row"><div class="qpdz-field"><label>결재 조건</label><input readonly value="금액별 결재선 적용"></div><div class="qpdz-field"><label>첨부 파일</label><div class="qpdz-file-line"><input type="file" data-target-file hidden><button type="button" class="qpdz-soft-btn" data-action="file">파일 선택</button><span class="qpdz-file-name" data-file-name>선택된 파일 없음</span></div></div><div class="qpdz-section-help">발주서, 견적서, 규격서 등 (최대 10MB)</div></div></div></section>

      <div class="qpdz-footer"><button type="button" data-action="cancel">취소</button><button type="button" class="draft" data-action="draft">임시저장</button><button type="button" class="submit" data-action="submit">✓ 결재상신</button></div>
    `;
    form.appendChild(ui);

    const bindMap={poNo:'poNo',purchaseType:'purchaseType',productionType:'productionType',supplier:'supplier',orderDate:'orderDate',due:'due',confirmedDue:'confirmedDue',priority:'priority',payment:'payment',mrp:'mrp',wo:'wo',warehouse:'warehouse',buyer:'buyer',dept:'dept'};
    Object.keys(bindMap).forEach(k=>bind(ui.querySelector('[data-bind="'+k+'"]'),originals[bindMap[k]]));
    ['iqc','coa','msds','lot'].forEach(k=>bind(ui.querySelector('[data-check="'+k+'"]'),originals[k]));

    const body=ui.querySelector('[data-grid-body]');
    function calc(){
      let supply=0,vat=0,total=0;
      [...body.querySelectorAll('tr')].forEach(tr=>{
        const q=num(tr.querySelector('[data-col="qty"]')?.value),p=num(tr.querySelector('[data-col="price"]')?.value),s=q*p,v=Math.round(s*.1),t=s+v;
        tr.querySelector('[data-cell="supply"]').textContent=won(s);tr.querySelector('[data-cell="vat"]').textContent=won(v);tr.querySelector('[data-cell="total"]').textContent=won(t);supply+=s;vat+=v;total+=t;
      });
      ui.querySelector('[data-total-count]').textContent='총 '+body.querySelectorAll('tr').length+'건';ui.querySelector('[data-total-supply]').textContent=won(supply);ui.querySelector('[data-total-vat]').textContent=won(vat);ui.querySelector('[data-total-grand]').textContent=won(total);
    }
    function addRow(seed,first){
      const tr=document.createElement('tr');
      const n=body.querySelectorAll('tr').length+1;
      tr.innerHTML='<td><input type="checkbox" data-row-check></td><td data-row-no>'+n+'</td><td><input data-col="code"></td><td><input data-col="item"></td><td><input data-col="spec"></td><td><input data-col="qty" inputmode="decimal"></td><td><select data-col="unit"><option>kg</option><option>g</option><option>EA</option><option>L</option><option>Drum</option></select></td><td><input data-col="price" inputmode="numeric"></td><td class="money" data-cell="supply">0</td><td class="money" data-cell="vat">0</td><td class="money" data-cell="total">0</td><td><input type="date" data-col="due"></td><td><input data-col="remark"></td>';
      body.appendChild(tr);
      if(seed) Object.keys(seed).forEach(k=>{const e=tr.querySelector('[data-col="'+k+'"]');if(e&&seed[k]!=null)e.value=seed[k];});
      if(first){bind(tr.querySelector('[data-col="code"]'),originals.code);bind(tr.querySelector('[data-col="item"]'),originals.item);bind(tr.querySelector('[data-col="spec"]'),originals.spec);bind(tr.querySelector('[data-col="qty"]'),originals.qty);bind(tr.querySelector('[data-col="unit"]'),originals.unit);bind(tr.querySelector('[data-col="price"]'),originals.price);bind(tr.querySelector('[data-col="due"]'),originals.due);bind(tr.querySelector('[data-col="remark"]'),originals.remark);}
      tr.addEventListener('input',calc);tr.addEventListener('change',calc);calc();
    }
    addRow({unit:'kg',due:originals.due?.value||''},true);

    ui.querySelector('[data-grid-all]').addEventListener('change',e=>body.querySelectorAll('[data-row-check]').forEach(c=>c.checked=e.target.checked));
    ui.querySelector('[data-action="add-row"]').addEventListener('click',()=>addRow({unit:'kg',due:ui.querySelector('[data-bind="due"]')?.value||''},false));
    ui.querySelector('[data-action="delete-row"]').addEventListener('click',()=>{[...body.querySelectorAll('tr')].filter(r=>r.querySelector('[data-row-check]')?.checked).forEach(r=>r.remove());if(!body.querySelector('tr'))addRow({unit:'kg'},false);[...body.querySelectorAll('tr')].forEach((r,i)=>r.querySelector('[data-row-no]').textContent=i+1);calc();});
    ui.querySelector('[data-action="download"]').addEventListener('click',()=>{const rows=[['품목코드','품목명','규격','발주수량','단위','단가','요청납기','비고']];body.querySelectorAll('tr').forEach(r=>rows.push(['code','item','spec','qty','unit','price','due','remark'].map(k=>r.querySelector('[data-col="'+k+'"]')?.value||'')));const blob=new Blob(['\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='구매발주_품목.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
    const upload=document.createElement('input');upload.type='file';upload.accept='.csv,.xlsx,.xls';upload.hidden=true;ui.appendChild(upload);ui.querySelector('[data-action="upload"]').addEventListener('click',()=>upload.click());upload.addEventListener('change',()=>toast(upload.files?.[0]?.name?'파일 선택: '+upload.files[0].name:'파일을 선택해 주세요.'));
    const targetFile=ui.querySelector('[data-target-file]');ui.querySelector('[data-action="file"]').addEventListener('click',()=>targetFile.click());targetFile.addEventListener('change',()=>ui.querySelector('[data-file-name]').textContent=targetFile.files?.[0]?.name||'선택된 파일 없음');
    ['supplier-search','mrp-search','wo-search'].forEach(a=>ui.querySelector('[data-action="'+a+'"]')?.addEventListener('click',()=>{const key=a==='supplier-search'?'supplier':a==='mrp-search'?'mrp':'wo';ui.querySelector('[data-bind="'+key+'"]')?.focus();}));
    ui.querySelector('[data-action="new-supplier"]').addEventListener('click',()=>{const b=[...form.querySelectorAll('button')].find(x=>!x.closest('.qpdz-target-ui')&&/신규\s*협력사/.test(clean(x.textContent)));b?b.click():toast('신규 협력사 기능은 기존 협력사 등록과 연결됩니다.');});
    ui.querySelector('[data-action="cancel"]').addEventListener('click',()=>{const close=modal.querySelector('.qpx-modal-close');close?close.click():originalCancel?.click();});
    ui.querySelector('[data-action="draft"]').addEventListener('click',()=>{const snapshot={};ui.querySelectorAll('input,select,textarea').forEach((e,i)=>snapshot[e.dataset.bind||e.dataset.col||e.dataset.check||('field'+i)]=e.type==='checkbox'?e.checked:e.value);try{localStorage.setItem('qmes-purchase-draft-approved-layout-20260916',JSON.stringify({savedAt:new Date().toISOString(),snapshot}));}catch(_){}toast('임시저장 완료');});
    ui.querySelector('[data-action="submit"]').addEventListener('click',()=>{if(originalSubmit){originalSubmit.click();}else toast('기존 구매 발주 저장 버튼을 찾지 못했습니다.');});
    form.dataset[READY]='1';
  }

  function apply(){
    queued=false;
    const modal=findModal();if(!modal) return;
    const form=modal.querySelector('.qerp-form');if(!form) return;
    ensureStyle();decorateHeader(modal);
    if(form.dataset[READY]==='1'&&form.querySelector('.qpdz-target-ui')) return;
    buildUI(modal,form);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}
  function start(){schedule();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('[data-qpx-create]')){setTimeout(schedule,0);setTimeout(schedule,80);setTimeout(schedule,220);}},true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
