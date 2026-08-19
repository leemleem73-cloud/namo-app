/* QMES OQC iPad LOT dropdown v2 - 2026-08-19
 * Purpose: replace the OQC production LOT free-text field with a visible select.
 * Display format: LOT | product name
 */
(function installOqcIpadLotDropdownV2(global){
  'use strict';
  if (global.__QMES_OQC_IPAD_LOT_DROPDOWN_V2__) return;
  global.__QMES_OQC_IPAD_LOT_DROPDOWN_V2__ = true;

  const text = (v) => String(v == null ? '' : v).trim();
  const upper = (v) => text(v).toUpperCase();

  function setInputValue(input, value) {
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    try { setter ? setter.call(input, value) : (input.value = value); }
    catch (_err) { input.value = value; }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fieldByLabel(root, labelText) {
    const labels = Array.from(root.querySelectorAll('label'));
    const label = labels.find((node) => {
      const span = node.querySelector('span');
      return text(span?.textContent).replace(/\*/g, '').trim() === labelText;
    });
    return label?.querySelector('input,select,textarea') || null;
  }

  function currentMode(root) {
    const head = text(root.querySelector('.qmes-ipad-work-head')?.textContent);
    if (/OQC\s*출하검사/i.test(head)) return 'OQC';
    if (/PQC\s*공정검사/i.test(head)) return 'PQC';
    if (/IQC\s*수입검사/i.test(head)) return 'IQC';

    const full = text(root.textContent);
    if (/OQC\s*출하검사\s*IPAD\s*입력/i.test(full)) return 'OQC';
    return '';
  }

  function productForLot(lotNo) {
    const lot = upper(lotNo);
    if (!lot) return '';

    const batches = Array.isArray(global.DB?.batches) ? global.DB.batches : [];
    const batch = batches.find((row) => [row?.no, row?.lot, row?.lotNo, row?.workOrder].some((v) => upper(v) === lot));
    if (batch) return text(batch.itemName || batch.item || batch.product || batch.productName);

    const lots = global.DB?.lots && typeof global.DB.lots === 'object' ? global.DB.lots : {};
    const row = lots[lot] || Object.values(lots).find((x) => upper(x?.lot || x?.lotNo || x?.no) === lot);
    if (row) return text(row.itemName || row.item || row.product || row.productName);

    const pqc = Array.isArray(global.DB?.insp?.PQC) ? global.DB.insp.PQC : [];
    const pqcRow = pqc.find((row2) => upper(row2?.lot) === lot);
    return text(pqcRow?.product || pqcRow?.itemName || pqcRow?.item);
  }

  function pqcPassLots() {
    const rows = Array.isArray(global.DB?.insp?.PQC) ? global.DB.insp.PQC : [];
    const required = ['외관', '입도(Dmax)', '점도', '고형분'];
    const grouped = new Map();

    rows.forEach((row) => {
      const lot = upper(row?.lot);
      const check = text(row?.check);
      if (!lot || !check) return;
      if (!grouped.has(lot)) grouped.set(lot, new Map());
      const map = grouped.get(lot);
      const prev = map.get(check);
      const prevKey = prev ? `${text(prev.date)} ${text(prev.time)} ${text(prev.id)}` : '';
      const nextKey = `${text(row.date)} ${text(row.time)} ${text(row.id)}`;
      if (!prev || nextKey >= prevKey) map.set(check, row);
    });

    const lots = [];
    grouped.forEach((checks, lot) => {
      if (required.every((name) => checks.get(name) && text(checks.get(name).judge) === '합격')) lots.push(lot);
    });
    return lots;
  }

  function candidates() {
    const map = new Map();

    const lotsObj = global.DB?.lots && typeof global.DB.lots === 'object' ? global.DB.lots : {};
    Object.entries(lotsObj).forEach(([key, row]) => {
      const lot = upper(row?.lot || row?.lotNo || row?.no || key);
      if (!lot) return;
      map.set(lot, { lot, product: text(row?.itemName || row?.item || row?.product || row?.productName) });
    });

    (Array.isArray(global.DB?.batches) ? global.DB.batches : []).forEach((row) => {
      const lot = upper(row?.no || row?.lot || row?.lotNo || row?.workOrder);
      if (!lot) return;
      map.set(lot, { lot, product: text(row?.itemName || row?.item || row?.product || row?.productName) || productForLot(lot) });
    });

    pqcPassLots().forEach((lot) => {
      if (!map.has(lot)) map.set(lot, { lot, product: productForLot(lot) });
    });

    const oqcRows = Array.isArray(global.DB?.insp?.OQC) ? global.DB.insp.OQC : [];
    const completed = new Set(oqcRows.filter((row) => text(row?.judge) === '합격').map((row) => upper(row?.lot)).filter(Boolean));
    completed.forEach((lot) => map.delete(lot));

    return Array.from(map.values()).sort((a, b) => b.lot.localeCompare(a.lot));
  }

  function cleanup(root) {
    root.querySelectorAll('#qmes-oqc-lot-select-v2').forEach((node) => node.remove());
    root.querySelectorAll('input[data-qmes-oqc-v2="1"]').forEach((input) => {
      input.style.display = input.dataset.qmesOldDisplay || '';
      delete input.dataset.qmesOqcV2;
      delete input.dataset.qmesOldDisplay;
    });
  }

  function install(root) {
    if (!root) return;
    if (currentMode(root) !== 'OQC') {
      cleanup(root);
      return;
    }

    const input = fieldByLabel(root, '생산 LOT');
    if (!input || input.tagName !== 'INPUT') return;
    const label = input.closest('label');
    if (!label) return;

    let select = label.querySelector('#qmes-oqc-lot-select-v2');
    if (!select) {
      input.dataset.qmesOqcV2 = '1';
      input.dataset.qmesOldDisplay = input.style.display || '';
      input.style.display = 'none';

      select = document.createElement('select');
      select.id = 'qmes-oqc-lot-select-v2';
      select.setAttribute('aria-label', '출하검사 생산 LOT 선택');
      select.style.cssText = 'width:100%;height:100%;min-height:48px;padding:0 44px 0 16px;border:1px solid #b8c8dc;border-radius:10px;background:#fff;color:#0f172a;font:inherit;font-weight:700;box-sizing:border-box;';
      input.insertAdjacentElement('afterend', select);

      select.addEventListener('change', () => {
        const lot = upper(select.value);
        setInputValue(input, lot);
      });
    }

    const rows = candidates();
    const signature = rows.map((row) => `${row.lot}|${row.product}`).join(';;');
    if (select.dataset.signature !== signature) {
      const current = upper(input.value || select.value);
      select.innerHTML = '';

      const first = document.createElement('option');
      first.value = '';
      first.textContent = rows.length ? '생산 LOT 선택' : '출하검사 대상 LOT 없음';
      select.appendChild(first);

      rows.forEach((row) => {
        const option = document.createElement('option');
        option.value = row.lot;
        option.textContent = row.product ? `${row.lot} | ${row.product}` : row.lot;
        select.appendChild(option);
      });

      if (current && rows.some((row) => row.lot === current)) select.value = current;
      select.dataset.signature = signature;
    }
  }

  let timer = 0;
  function sync() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const root = document.querySelector('.qmes-ipad-pop');
      if (root) install(root);
    }, 30);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, { once: true });
  else sync();

  document.addEventListener('click', sync, true);
  document.addEventListener('qmes:data-updated', sync);
  document.addEventListener('qmes:data-changed', sync);
  global.addEventListener('storage', sync);
  new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });

  setInterval(sync, 1500);
})(window);
