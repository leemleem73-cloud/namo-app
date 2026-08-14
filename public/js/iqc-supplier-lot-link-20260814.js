/* IQC supplier / material LOT linkage patch - 2026-08-14
 * 동작:
 * 1) 수입검사에서 원재료명을 선택한다.
 * 2) 거래처 현황 > 공급업체 목록(DB.partnerSuppliers)에서 같은 원료의 업체만 업체명 선택목록에 표시한다.
 * 3) 업체를 선택하면 그 공급업체 목록에 저장된 최신 원료 LOT No.를 수입검사 LOT No.에 반영한다.
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

  const setReactInputValue = (element, value) => {
    if (!element) return;
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (descriptor?.set) descriptor.set.call(element, String(value ?? ''));
    else element.value = String(value ?? '');
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const findField = (modal, labelText) => {
    return Array.from(modal.querySelectorAll('.qmes-iqc-field')).find((node) => {
      const label = node.querySelector(':scope > span');
      return String(label?.textContent || '').trim() === labelText;
    }) || null;
  };

  const supplierRowsFor = (material) => {
    const key = normalizeMaterial(material);
    return getSuppliers()
      .filter((row) => String(row?.status || '거래중') !== '중단' && normalizeMaterial(row?.material) === key)
      .sort((a, b) => String(a.company || '').localeCompare(String(b.company || ''), 'ko-KR', { numeric: true, sensitivity: 'base' }));
  };

  const linkModal = (modal) => {
    if (!modal || modal.dataset.supplierLotLinked === '1') return;

    const materialField = findField(modal, '원재료명');
    const supplierField = findField(modal, '업체명');
    const lotField = findField(modal, 'LOT No.');
    const materialSelect = materialField?.querySelector('select');
    const supplierInput = supplierField?.querySelector('input');
    const lotInput = lotField?.querySelector('input');
    if (!materialSelect || !supplierInput || !lotInput) return;

    modal.dataset.supplierLotLinked = '1';

    const supplierSelect = document.createElement('select');
    supplierSelect.className = supplierInput.className;
    supplierSelect.setAttribute('aria-label', '업체명 선택');
    supplierSelect.style.width = '100%';
    supplierSelect.style.minHeight = '42px';
    supplierSelect.style.borderRadius = '8px';
    supplierSelect.style.border = '1px solid #cbd5e1';
    supplierSelect.style.padding = '0 12px';
    supplierSelect.style.background = '#ffffff';
    supplierSelect.style.color = '#0f172a';
    supplierSelect.style.fontSize = '14px';

    // React가 관리하는 기존 input은 상태 저장용으로 유지하고 화면에서는 선택박스를 사용한다.
    supplierInput.style.display = 'none';
    supplierInput.setAttribute('aria-hidden', 'true');
    supplierInput.insertAdjacentElement('afterend', supplierSelect);

    const renderSupplierOptions = (keepCurrent = true) => {
      const rows = supplierRowsFor(materialSelect.value);
      const current = keepCurrent ? String(supplierInput.value || '').trim() : '';
      supplierSelect.innerHTML = '';

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = rows.length ? '업체명을 선택하세요' : '등록된 공급업체가 없습니다';
      supplierSelect.appendChild(placeholder);

      rows.forEach((row) => {
        const option = document.createElement('option');
        option.value = String(row.company || '').trim();
        option.textContent = String(row.company || '').trim();
        option.dataset.lot = String(row.lot || '').trim();
        supplierSelect.appendChild(option);
      });

      const exists = rows.some((row) => String(row.company || '').trim() === current);
      supplierSelect.value = exists ? current : '';
      supplierSelect.disabled = rows.length === 0;
      return rows;
    };

    const clearSupplierAndLot = () => {
      setReactInputValue(supplierInput, '');
      setReactInputValue(lotInput, '');
      lotInput.removeAttribute('title');
      delete lotInput.dataset.qmesLotSource;
    };

    materialSelect.addEventListener('change', () => {
      clearSupplierAndLot();
      renderSupplierOptions(false);
    });

    supplierSelect.addEventListener('change', () => {
      const company = String(supplierSelect.value || '').trim();
      setReactInputValue(supplierInput, company);

      if (!company) {
        setReactInputValue(lotInput, '');
        return;
      }

      const matched = supplierRowsFor(materialSelect.value).find((row) => String(row.company || '').trim() === company);
      const latestLot = String(matched?.lot || '').trim();
      setReactInputValue(lotInput, latestLot);
      if (latestLot) {
        lotInput.dataset.qmesLotSource = 'supplier-master';
        lotInput.title = `공급업체 목록 최신 LOT 자동연동: ${company}`;
      }
    });

    // 수정 화면은 기존 업체명을 유지하고, 신규등록은 사용자가 업체를 직접 선택한다.
    renderSupplierOptions(true);
  };

  const scan = () => {
    document.querySelectorAll('.qmes-iqc-modal[aria-label="수입검사 등록"]').forEach(linkModal);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scan);
  scan();
})();
