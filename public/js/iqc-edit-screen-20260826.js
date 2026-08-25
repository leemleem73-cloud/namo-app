/* QMES IQC standalone edit screen — 2026-08-26
 * Completely independent from the React 신규등록/iqcModalOpen flow.
 */
(function installStandaloneIqcEditScreen(global){
  'use strict';
  if (global.__QMES_IQC_STANDALONE_EDIT_20260826__) return;
  global.__QMES_IQC_STANDALONE_EDIT_20260826__ = true;

  const STYLE_ID = 'qmes-iqc-standalone-edit-style-20260826';
  const OVERLAY_ID = 'qmes-iqc-standalone-edit-overlay-20260826';
  let currentRecord = null;

  function ensureStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID}{position:fixed!important;inset:0!important;z-index:30000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(2,8,20,.78)!important;box-sizing:border-box!important;}
      #${OVERLAY_ID} .qmes-iqc-edit-screen{width:min(1040px,calc(100vw - 44px))!important;max-height:calc(100vh - 44px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border:1px solid #304b6c!important;border-radius:14px!important;background:#0a1728!important;color:#e8f0f8!important;box-shadow:0 28px 80px rgba(0,0,0,.58)!important;font-family:Pretendard,"Noto Sans KR",system-ui,sans-serif!important;}
      #${OVERLAY_ID} .qmes-iqc-edit-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;border-bottom:1px solid #263b54;background:#0d2038;}
      #${OVERLAY_ID} .qmes-iqc-edit-head span{display:block;color:#38bdf8;font-size:10px;font-weight:900;letter-spacing:.13em;}
      #${OVERLAY_ID} .qmes-iqc-edit-head strong{display:block;margin-top:3px;color:#f8fafc;font-size:19px;font-weight:800;}
      #${OVERLAY_ID} .qmes-iqc-edit-close{width:36px;height:36px;border:1px solid #3b526d;border-radius:8px;color:#cbd5e1;font-size:22px;line-height:1;background:#102138;}
      #${OVERLAY_ID} .qmes-iqc-edit-body{min-height:0;overflow-y:auto;padding:18px 20px 20px;}
      #${OVERLAY_ID} .qmes-iqc-edit-section{padding:14px;border:1px solid #243a55;border-radius:10px;background:rgba(15,32,54,.66);}
      #${OVERLAY_ID} .qmes-iqc-edit-section+.qmes-iqc-edit-section{margin-top:12px;}
      #${OVERLAY_ID} .qmes-iqc-edit-section h4{margin:0 0 10px;color:#9fb2c8;font-size:12px;font-weight:850;}
      #${OVERLAY_ID} .qmes-iqc-edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
      #${OVERLAY_ID} .qmes-iqc-edit-field{display:flex;flex-direction:column;gap:5px;min-width:0;}
      #${OVERLAY_ID} .qmes-iqc-edit-field>span{color:#8ca5c4;font-size:10px;font-weight:700;}
      #${OVERLAY_ID} input,#${OVERLAY_ID} select,#${OVERLAY_ID} textarea{width:100%;box-sizing:border-box;border:1px solid #2b405b;border-radius:7px;background:#102138;color:#edf4fb;outline:none;font:inherit;font-size:13px;}
      #${OVERLAY_ID} input,#${OVERLAY_ID} select{height:39px;padding:0 10px;}
      #${OVERLAY_ID} textarea{min-height:88px;padding:9px 10px;resize:vertical;}
      #${OVERLAY_ID} input:focus,#${OVERLAY_ID} select:focus,#${OVERLAY_ID} textarea:focus{border-color:#38bdf8;}
      #${OVERLAY_ID} input[readonly]{background:#0b1a2d;color:#90a4ba;}
      #${OVERLAY_ID} .qmes-iqc-edit-full{grid-column:1/-1;}
      #${OVERLAY_ID} .qmes-iqc-edit-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 20px;border-top:1px solid #263b54;background:#0c1b2e;}
      #${OVERLAY_ID} .qmes-iqc-edit-judge{font-size:12px;color:#9fb2c8;font-weight:700;}
      #${OVERLAY_ID} .qmes-iqc-edit-actions{display:flex;gap:8px;}
      #${OVERLAY_ID} .qmes-iqc-edit-actions button{height:37px;padding:0 17px;border-radius:7px;font-size:12px;font-weight:800;}
      #${OVERLAY_ID} .qmes-iqc-edit-cancel{border:1px solid #3b526d;color:#cbd5e1;background:transparent;}
      #${OVERLAY_ID} .qmes-iqc-edit-save{border:1px solid #0284c7;color:#fff;background:#0284c7;}
      @media(max-width:760px){#${OVERLAY_ID}{padding:10px!important;}#${OVERLAY_ID} .qmes-iqc-edit-screen{width:calc(100vw - 20px)!important;max-height:calc(100vh - 20px)!important;}#${OVERLAY_ID} .qmes-iqc-edit-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    `;
    document.head.appendChild(style);
  }

  function val(record, key, fallback=''){
    const v = record && record[key];
    return v == null ? fallback : String(v);
  }

  function stripUnit(value){
    return String(value == null ? '' : value).replace(/\s*(kg|g|t|EA|L|매|장|캔)\s*$/i,'').trim();
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function findRecordFromButton(button){
    const tr = button && button.closest('tr');
    if (!tr || !global.DB || !Array.isArray(DB.iqc)) return null;
    const cells = Array.from(tr.querySelectorAll('td'));
    if (cells.length < 6) return null;
    const recv = String(cells[0]?.textContent || '').trim().slice(0,10);
    const name = String(cells[1]?.textContent || '').trim();
    const supplier = String(cells[2]?.textContent || '').trim();
    const lot = String(cells[3]?.textContent || '').trim();
    const inspector = String(cells[4]?.textContent || '').trim();
    const candidates = DB.iqc.filter((r) => String(r.lot || '').trim() === lot);
    return candidates.find((r) => String(r.recv || '').slice(0,10) === recv && String(r.name || '').trim() === name && String(r.supplier || '-').trim() === supplier)
      || candidates.find((r) => String(r.recv || '').slice(0,10) === recv && String(r.inspector || r.by || '-').trim() === inspector)
      || candidates[0]
      || null;
  }

  function field(label, name, value, type='text', attrs=''){
    return `<label class="qmes-iqc-edit-field"><span>${label}</span><input name="${name}" type="${type}" value="${escapeHtml(value)}" ${attrs}></label>`;
  }

  function selectField(label, name, value, options){
    const html = options.map((option) => `<option value="${escapeHtml(option)}" ${String(option)===String(value)?'selected':''}>${escapeHtml(option)}</option>`).join('');
    return `<label class="qmes-iqc-edit-field"><span>${label}</span><select name="${name}">${html}</select></label>`;
  }

  function closeEdit(){
    document.getElementById(OVERLAY_ID)?.remove();
    currentRecord = null;
  }

  function overallFromForm(form){
    return ['visual','label','weight','coa'].some((key) => form.elements[key]?.value === '불합격') ? '불합격' : '합격';
  }

  function updateJudgePreview(form){
    const target = document.querySelector(`#${OVERLAY_ID} .qmes-iqc-edit-judge`);
    if (target) target.textContent = `종합판정: ${overallFromForm(form)}`;
  }

  function saveEdit(form){
    if (!currentRecord || !global.DB || !Array.isArray(DB.iqc)) return;
    const originalInNo = String(currentRecord.inNo || '');
    const data = new FormData(form);
    const packageQty = Number(data.get('packageQty') || 0);
    const unitWeight = Number(data.get('unitWeight') || 0);
    const calculatedWeight = Number.isFinite(packageQty) && Number.isFinite(unitWeight) ? packageQty * unitWeight : 0;
    const judge = overallFromForm(form);
    const nextRecord = {
      ...currentRecord,
      recv:String(data.get('recvDate') || '').trim(),
      inspectedAt:String(data.get('inspectDate') || '').trim(),
      lot:String(data.get('lot') || '').trim(),
      name:String(data.get('name') || '').trim(),
      supplier:String(data.get('supplier') || '').trim() || '-',
      qty:String(data.get('qty') || '').trim() ? `${String(data.get('qty')).trim()} kg` : '',
      inspectQty:String(data.get('inspectQty') || '').trim() ? `${String(data.get('inspectQty')).trim()} EA` : '',
      defectQty:String(data.get('defectQty') || '').trim() ? `${String(data.get('defectQty')).trim()} EA` : '0 EA',
      packagingType:String(data.get('packagingType') || '').trim(),
      packagingTypeOther:String(data.get('packagingTypeOther') || '').trim(),
      packageQty:Number.isFinite(packageQty) ? packageQty : 0,
      unitWeight:Number.isFinite(unitWeight) ? unitWeight : 0,
      calculatedWeight,
      barcodeQty:Number.isFinite(packageQty) ? packageQty : 0,
      visual:String(data.get('visual') || '합격'),
      label:String(data.get('label') || '합격'),
      weight:String(data.get('weight') || '합격'),
      coa:String(data.get('coa') || '합격'),
      inspector:String(data.get('inspector') || '').trim(),
      by:String(data.get('inspector') || '').trim(),
      remarks:String(data.get('remarks') || '').trim(),
      judge,
      note:judge === '불합격' ? '즉시 격리 → 사용차단 → 업체 통보' : ''
    };

    if (!nextRecord.recv || !nextRecord.inspectedAt || !nextRecord.lot || !nextRecord.name || !nextRecord.inspector) {
      global.alert('입고일자, 검사일자, LOT No., 원재료명, 검사자는 반드시 입력하세요.');
      return;
    }

    const index = DB.iqc.findIndex((r) => r === currentRecord || String(r.inNo || '') === originalInNo);
    if (index < 0) {
      global.alert('수정할 수입검사 기록을 찾지 못했습니다.');
      return;
    }
    DB.iqc[index] = nextRecord;
    try { if (typeof global.auditLog === 'function') global.auditLog('IQC','수정',nextRecord.inNo,`${nextRecord.lot} / ${nextRecord.judge}`); } catch (_e) {}
    try { if (typeof global.dbSave === 'function') global.dbSave(); } catch (_e) {}
    try {
      if (typeof global.qmesSyncUpsert === 'function') {
        global.qmesSyncUpsert('iqc', nextRecord.inNo, {
          mode:'IQC', lotNo:nextRecord.lot, rows:[nextRecord],
          lotRecord:DB.lots?.[nextRecord.lot] || null,
          holds:(DB.holds || []).filter((item) => String(item.target || '').includes(nextRecord.lot)),
          savedAt:new Date().toISOString(), savedBy:nextRecord.inspector || ''
        }).catch((error) => console.warn('IQC 수정 공용 DB 저장 실패:', error.message));
      }
    } catch (_e) {}
    try { document.dispatchEvent(new CustomEvent('qmes:data-updated',{detail:{type:'iqc',key:nextRecord.inNo,action:'update'}})); } catch (_e) {}
    closeEdit();
    global.location.reload();
  }

  function openEdit(record){
    if (!record) {
      global.alert('수정할 수입검사 데이터를 찾지 못했습니다.');
      return;
    }
    ensureStyle();
    document.getElementById(OVERLAY_ID)?.remove();
    currentRecord = record;
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
      <form class="qmes-iqc-edit-screen" autocomplete="off">
        <div class="qmes-iqc-edit-head">
          <div><span>INCOMING INSPECTION EDIT</span><strong>수입검사 수정</strong></div>
          <button type="button" class="qmes-iqc-edit-close" aria-label="닫기">×</button>
        </div>
        <div class="qmes-iqc-edit-body">
          <section class="qmes-iqc-edit-section"><h4>기본정보</h4><div class="qmes-iqc-edit-grid">
            ${field('입고번호','inNo',val(record,'inNo'), 'text', 'readonly')}
            ${field('입고일자','recvDate',val(record,'recv').slice(0,10),'date')}
            ${field('검사일자','inspectDate',val(record,'inspectedAt',val(record,'recv')).slice(0,10),'date')}
            ${field('LOT No.','lot',val(record,'lot'))}
            ${field('원재료명','name',val(record,'name'))}
            ${field('업체명','supplier',val(record,'supplier') === '-' ? '' : val(record,'supplier'))}
          </div></section>
          <section class="qmes-iqc-edit-section"><h4>수량</h4><div class="qmes-iqc-edit-grid">
            ${field('입고수량 (kg)','qty',stripUnit(val(record,'qty')),'text','inputmode="decimal"')}
            ${field('검사수량 (EA)','inspectQty',stripUnit(val(record,'inspectQty')),'text','inputmode="decimal"')}
            ${field('불량수량 (EA)','defectQty',stripUnit(val(record,'defectQty','0')),'text','inputmode="decimal"')}
          </div></section>
          <section class="qmes-iqc-edit-section"><h4>포장·바코드 정보</h4><div class="qmes-iqc-edit-grid">
            ${selectField('포장형태','packagingType',val(record,'packagingType'),['','드럼','포대','말통','IBC','박스','벌크','기타'])}
            ${field('기타 포장형태','packagingTypeOther',val(record,'packagingTypeOther'))}
            ${field('입고 포장수량','packageQty',val(record,'packageQty','1'),'number','min="0" step="1"')}
            ${field('용기당 중량 (kg)','unitWeight',val(record,'unitWeight'),'number','min="0" step="0.01"')}
          </div></section>
          <section class="qmes-iqc-edit-section"><h4>검사정보</h4><div class="qmes-iqc-edit-grid">
            ${selectField('외관','visual',val(record,'visual','합격'),['합격','불합격'])}
            ${selectField('라벨','label',val(record,'label','합격'),['합격','불합격'])}
            ${selectField('중량','weight',val(record,'weight','합격'),['합격','불합격'])}
            ${selectField('COA','coa',val(record,'coa','합격'),['합격','불합격'])}
            ${field('검사자','inspector',val(record,'inspector',val(record,'by')))}
          </div></section>
          <section class="qmes-iqc-edit-section"><h4>특이사항</h4><div class="qmes-iqc-edit-grid"><label class="qmes-iqc-edit-field qmes-iqc-edit-full"><span>특이사항</span><textarea name="remarks">${escapeHtml(val(record,'remarks',val(record,'note')))}</textarea></label></div></section>
        </div>
        <div class="qmes-iqc-edit-foot"><div class="qmes-iqc-edit-judge">종합판정: ${escapeHtml(val(record,'judge','합격'))}</div><div class="qmes-iqc-edit-actions"><button type="button" class="qmes-iqc-edit-cancel">취소</button><button type="submit" class="qmes-iqc-edit-save">수정 완료</button></div></div>
      </form>`;
    document.body.appendChild(overlay);
    const form = overlay.querySelector('form');
    overlay.querySelector('.qmes-iqc-edit-close').addEventListener('click', closeEdit);
    overlay.querySelector('.qmes-iqc-edit-cancel').addEventListener('click', closeEdit);
    overlay.addEventListener('mousedown', (event) => { if (event.target === overlay) closeEdit(); });
    form.addEventListener('change', () => updateJudgePreview(form));
    form.addEventListener('submit', (event) => { event.preventDefault(); saveEdit(form); });
  }

  document.addEventListener('click', function interceptIqcEdit(event){
    const button = event.target && event.target.closest ? event.target.closest('.qmes-iqc-action-edit') : null;
    if (!button) return;
    const ledger = button.closest('.qmes-iqc-ledger-table');
    if (!ledger) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    openEdit(findRecordFromButton(button));
  }, true);

  global.qmesOpenStandaloneIqcEdit = openEdit;
})(window);
