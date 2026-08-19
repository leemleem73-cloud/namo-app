/* QMES OQC iPad LOT selector fix - 2026-08-19
 * Shows production LOT as a dropdown like: DBF2502 | NBA20-HM05
 * Keeps the original React input as the data source and mirrors selection into it.
 */
(function installOqcIpadLotSelect(global) {
  'use strict';

  if (global.__QMES_OQC_IPAD_LOT_SELECT_20260819__) return;
  global.__QMES_OQC_IPAD_LOT_SELECT_20260819__ = true;

  const text = (value) => String(value == null ? '' : value).trim();
  const normalize = (value) => text(value).toUpperCase();

  function productForLot(lotNo) {
    const lot = normalize(lotNo);
    if (!lot) return '';

    try {
      if (typeof global.qmesIpadLotInfo === 'function') {
        const info = global.qmesIpadLotInfo(lot);
        if (info && text(info.product)) return text(info.product);
      }
    } catch (_err) {}

    const batches = Array.isArray(global.DB && global.DB.batches) ? global.DB.batches : [];
    const batch = batches.find((row) => normalize(row && (row.no || row.lot || row.lotNo || row.workOrder)) === lot);
    if (batch) return text(batch.itemName || batch.item || batch.product || batch.productName);

    const lots = global.DB && global.DB.lots ? global.DB.lots : {};
    const row = lots[lot] || lots[lotNo];
    return row ? text(row.itemName || row.item || row.product || row.productName) : '';
  }

  function pqcCompletedLots() {
    const rows = Array.isArray(global.DB && global.DB.insp && global.DB.insp.PQC)
      ? global.DB.insp.PQC
      : [];
    const required = ['외관', '입도(Dmax)', '점도', '고형분'];
    const grouped = new Map();

    rows.forEach((row) => {
      const lot = normalize(row && row.lot);
      const check = text(row && row.check);
      if (!lot || !check) return;
      if (!grouped.has(lot)) grouped.set(lot, new Map());
      const checks = grouped.get(lot);
      const old = checks.get(check);
      const oldKey = old ? `${text(old.date)} ${text(old.time)} ${text(old.id)}` : '';
      const newKey = `${text(row.date)} ${text(row.time)} ${text(row.id)}`;
      if (!old || newKey >= oldKey) checks.set(check, row);
    });

    const result = [];
    grouped.forEach((checks, lot) => {
      if (required.every((name) => checks.get(name) && text(checks.get(name).judge) === '합격')) {
        result.push(lot);
      }
    });
    return result;
  }

  function eligibleLots() {
    const set = new Set();

    try {
      if (typeof global.qmesGetOqcEligibleLots === 'function') {
        (global.qmesGetOqcEligibleLots() || []).forEach((lot) => {
          const value = normalize(lot);
          if (value) set.add(value);
        });
      }
    } catch (_err) {}

    const batches = Array.isArray(global.DB && global.DB.batches) ? global.DB.batches : [];
    batches.forEach((row) => {
      const lot = normalize(row && (row.no || row.lot || row.lotNo || row.workOrder));
      if (!lot) return;
      try {
        if (typeof global.qmesShipmentGate !== 'function' || global.qmesShipmentGate(lot).ok) set.add(lot);
      } catch (_err) {
        set.add(lot);
      }
    });

    pqcCompletedLots().forEach((lot) => set.add(lot));

    const oqcRows = Array.isArray(global.DB && global.DB.insp && global.DB.insp.OQC)
      ? global.DB.insp.OQC
      : [];
    oqcRows.forEach((row) => {
      if (text(row && row.judge) === '합격') set.delete(normalize(row && row.lot));
    });

    return Array.from(set).filter(Boolean).sort();
  }

  function isOqcScreen() {
    const page = document.querySelector('.qmes-ipad-pop') || document.body;
    const bodyText = text(page && page.textContent);
    if (/OQC\s*출하검사|출하검사\s*IPAD/i.test(bodyText)) return true;

    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some((button) => {
      const label = text(button.textContent);
      const active = button.classList.contains('active') || button.getAttribute('aria-selected') === 'true';
      return active && /OQC|출하검사/i.test(label);
    });
  }

  function setReactInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (setter && setter.set) setter.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function syncSelector() {
    if (!isOqcScreen()) return;

    const labels = Array.from(document.querySelectorAll('.qmes-ipad-pop label, label'));
    const label = labels.find((node) => /생산\s*LOT/.test(text(node.textContent)) && node.querySelector('input.lot, input[list="qmes-ipad-lots"]'));
    if (!label) return;

    const input = label.querySelector('input.lot, input[list="qmes-ipad-lots"]');
    if (!input) return;

    const lots = eligibleLots();
    if (!lots.length) return;

    let select = label.querySelector('select.qmes-oqc-lot-select-20260819');
    if (!select) {
      select = document.createElement('select');
      select.className = `${input.className || ''} qmes-oqc-lot-select-20260819`.trim();
      select.setAttribute('aria-label', '생산 LOT 선택');
      select.style.width = '100%';
      select.style.minHeight = getComputedStyle(input).minHeight || '44px';
      select.style.boxSizing = 'border-box';
      input.insertAdjacentElement('afterend', select);
      input.style.display = 'none';

      select.addEventListener('change', function () {
        const lot = normalize(select.value);
        setReactInputValue(input, lot);
      });
    }

    const current = normalize(input.value || select.value);
    const signature = lots.map((lot) => `${lot}|${productForLot(lot)}`).join(';;');
    if (select.dataset.qmesSignature !== signature) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '생산 LOT 선택';
      select.innerHTML = '';
      select.appendChild(placeholder);

      lots.forEach((lot) => {
        const option = document.createElement('option');
        const product = productForLot(lot);
        option.value = lot;
        option.textContent = product ? `${lot} | ${product}` : lot;
        select.appendChild(option);
      });
      select.dataset.qmesSignature = signature;
    }

    if (current && lots.includes(current)) select.value = current;
    else if (!input.value) select.value = '';
  }

  let scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    global.setTimeout(() => {
      scheduled = false;
      syncSelector();
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleSync, { once: true });
  } else {
    scheduleSync();
  }

  document.addEventListener('qmes:data-updated', scheduleSync);
  document.addEventListener('qmes:data-changed', scheduleSync);
  global.addEventListener('storage', scheduleSync);

  new MutationObserver(scheduleSync).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})(window);
