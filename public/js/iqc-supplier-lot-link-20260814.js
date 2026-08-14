/* IQC supplier / material LOT linkage patch - 2026-08-14
 * 공급업체 목록(DB.partnerSuppliers)을 기준으로 수입검사 신규등록의 업체명과 LOT No.를 연동한다.
 * 기존 iqc.jsx 원본은 수정하지 않는다.
 */
(function () {
  'use strict';

  const normalizeMaterial = (name) => {
    const value = String(name || '').toUpperCase().replace(/\s+/g, '');
    if (value.includes('BYK180') || value.includes('BYK-180') || value.includes('분산제')) return 'BYK180';
    if (value.includes('AOH30') || value.includes('BOEHMITE')) return 'BOEHMITE';
    if (value.includes('PVDF')) return 'PVDF';
    if (value.includes('PAI')) return 'PAI';
    if (value.includes('NMP')) return 'NMP';
    if (value.includes('SBR')) return 'SBR';
    if (value.includes('SBS')) return 'SBS';
    return value;
  };

  const getSuppliers = () => {
    try {
      return Array.isArray(window.DB?.partnerSuppliers) ? window.DB.partnerSuppliers : [];
    } catch (_error) {
      return [];
    }
  };

  const setReactValue = (element, value) => {
    if (!element) return;
    const next = String(value ?? '');
    const proto = element.tagName === 'SELECT'
      ? window.HTMLSelectElement.prototype
      : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor?.set) descriptor.set.call(element, next);
    else element.value = next;
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };

  const findFieldControl = (modal, labelText) => {
    const fields = Array.from(modal.querySelectorAll('.qmes-iqc-field'));
    const field = fields.find((node) => {
      const label = node.querySelector(':scope > span');
      return String(label?.textContent || '').trim() === labelText;
    });
    return field?.querySelector('input,select') || null;
  };

  const ensureDatalist = (supplierInput) => {
    if (!supplierInput) return null;
    let list = document.getElementById('qmes-iqc-supplier-master-list');
    if (!list) {
      list = document.createElement('datalist');
      list.id = 'qmes-iqc-supplier-master-list';
      document.body.appendChild(list);
    }
    supplierInput.setAttribute('list', list.id);
    supplierInput.setAttribute('autocomplete', 'off');
    supplierInput.placeholder = '공급업체 목록에서 선택';
    return list;
  };

  const refreshDatalist = (list, material) => {
    if (!list) return [];
    const key = normalizeMaterial(material);
    const rows = getSuppliers().filter((row) =>
      String(row?.status || '거래중') !== '중단' && normalizeMaterial(row?.material) === key
    );
    list.innerHTML = '';
    rows.forEach((row) => {
      const option = document.createElement('option');
      option.value = String(row.company || '').trim();
      option.label = row.lot ? `최신 LOT: ${row.lot}` : '';
      list.appendChild(option);
    });
    return rows;
  };

  const linkModal = (modal) => {
    if (!modal || modal.dataset.supplierLotLinked === '1') return;
    modal.dataset.supplierLotLinked = '1';

    const materialSelect = findFieldControl(modal, '원재료명');
    const supplierInput = findFieldControl(modal, '업체명');
    const lotInput = findFieldControl(modal, 'LOT No.');
    if (!materialSelect || !supplierInput || !lotInput) return;

    const list = ensureDatalist(supplierInput);

    const applySupplierLot = (forceSupplier) => {
      const matches = refreshDatalist(list, materialSelect.value);
      const currentSupplier = String(supplierInput.value || '').trim();
      let matched = matches.find((row) => String(row.company || '').trim() === currentSupplier);

      if (!matched && (forceSupplier || !currentSupplier) && matches.length === 1) {
        matched = matches[0];
        setReactValue(supplierInput, matched.company || '');
      }

      if (matched && String(matched.lot || '').trim()) {
        setReactValue(lotInput, String(matched.lot).trim());
        lotInput.dataset.qmesLotSource = 'supplier-master';
        lotInput.title = `공급업체 목록 최신 LOT 자동연동: ${matched.company}`;
      }
    };

    const onMaterialChange = () => {
      const matches = refreshDatalist(list, materialSelect.value);
      const currentSupplier = String(supplierInput.value || '').trim();
      const currentStillValid = matches.some((row) => String(row.company || '').trim() === currentSupplier);
      if (!currentStillValid) setReactValue(supplierInput, '');
      if (matches.length === 1) {
        setReactValue(supplierInput, matches[0].company || '');
        if (String(matches[0].lot || '').trim()) setReactValue(lotInput, String(matches[0].lot).trim());
      } else if (!currentStillValid) {
        setReactValue(lotInput, '');
      } else {
        applySupplierLot(false);
      }
    };

    const onSupplierChange = () => applySupplierLot(false);

    materialSelect.addEventListener('change', onMaterialChange);
    supplierInput.addEventListener('input', onSupplierChange);
    supplierInput.addEventListener('change', onSupplierChange);
    supplierInput.addEventListener('focus', () => refreshDatalist(list, materialSelect.value));

    // 신규등록 모달이 열릴 때 현재 공급업체 마스터의 최신 LOT를 즉시 반영한다.
    setTimeout(() => applySupplierLot(true), 0);
  };

  const scan = () => {
    document.querySelectorAll('.qmes-iqc-modal[aria-label="수입검사 등록"]').forEach(linkModal);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scan);
  scan();
})();
