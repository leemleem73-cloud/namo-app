/* QMES OQC LOT fix — include PQC-completed LOTs in iPad OQC selector without overwriting existing modules. */
(function installOqcPqcLotFix(){
  if (window.__QMES_OQC_PQC_LOT_FIX_20260819__) return;
  window.__QMES_OQC_PQC_LOT_FIX_20260819__ = true;

  const text = (value) => String(value ?? '').trim();
  const normalize = (value) => text(value).toUpperCase();

  function groupPqcByLot() {
    const rows = Array.isArray(window.DB?.insp?.PQC) ? window.DB.insp.PQC : [];
    const map = new Map();
    rows.forEach((row) => {
      const lot = normalize(row?.lot);
      if (!lot) return;
      if (!map.has(lot)) map.set(lot, []);
      map.get(lot).push(row);
    });
    return map;
  }

  function isPqcCompletedPass(rows) {
    if (!Array.isArray(rows) || !rows.length) return false;
    const required = ['외관', '입도(Dmax)', '점도', '고형분'];
    const latestByCheck = new Map();
    rows.forEach((row) => {
      const check = text(row?.check);
      if (!check) return;
      const current = latestByCheck.get(check);
      const key = `${text(row?.date)} ${text(row?.time)} ${text(row?.id)}`;
      const currentKey = current ? `${text(current?.date)} ${text(current?.time)} ${text(current?.id)}` : '';
      if (!current || key >= currentKey) latestByCheck.set(check, row);
    });
    return required.every((check) => {
      const row = latestByCheck.get(check);
      return row && text(row.judge) === '합격';
    });
  }

  window.qmesGetOqcEligibleLots = function qmesGetOqcEligibleLots() {
    const lots = new Set();

    // Existing production/work-order LOTs remain available when the shipment gate allows them.
    (Array.isArray(window.DB?.batches) ? window.DB.batches : []).forEach((row) => {
      const lot = normalize(row?.no || row?.lot || row?.lotNo || row?.workOrder);
      if (!lot) return;
      try {
        if (typeof window.qmesShipmentGate !== 'function' || window.qmesShipmentGate(lot)?.ok) lots.add(lot);
      } catch (_err) {}
    });

    // Critical fix: PQC-completed/pass LOTs are added even when they are not present in DB.batches
    // (for example records synced from the shared DB / another PC).
    groupPqcByLot().forEach((rows, lot) => {
      if (isPqcCompletedPass(rows)) lots.add(lot);
    });

    // Do not offer LOTs that already have a completed OQC group.
    const oqcRows = Array.isArray(window.DB?.insp?.OQC) ? window.DB.insp.OQC : [];
    const completedOqcLots = new Set(oqcRows.filter((row) => text(row?.judge) === '합격').map((row) => normalize(row?.lot)).filter(Boolean));
    completedOqcLots.forEach((lot) => lots.delete(lot));

    return Array.from(lots).sort();
  };

  function refreshOqcLotSelects() {
    const eligible = window.qmesGetOqcEligibleLots();
    if (!eligible.length) return;

    // iPad OQC screen can be rendered either as SELECT (new UI) or INPUT+DATALIST (legacy UI).
    document.querySelectorAll('.qmes-oqc-page select, .qmes-ipad-pop select').forEach((select) => {
      const labelText = text(select.closest('label')?.textContent || select.parentElement?.textContent);
      if (!/생산\s*LOT|대상\s*LOT/.test(labelText)) return;
      const current = normalize(select.value);
      const first = select.options?.[0]?.cloneNode(true);
      select.innerHTML = '';
      if (first && !normalize(first.value)) select.appendChild(first);
      eligible.forEach((lot) => {
        const option = document.createElement('option');
        option.value = lot;
        option.textContent = lot;
        select.appendChild(option);
      });
      if (current && eligible.includes(current)) select.value = current;
    });

    document.querySelectorAll('datalist#qmes-ipad-lots').forEach((list) => {
      list.innerHTML = '';
      eligible.forEach((lot) => {
        const option = document.createElement('option');
        option.value = lot;
        list.appendChild(option);
      });
    });
  }

  const schedule = () => window.setTimeout(refreshOqcLotSelects, 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
  document.addEventListener('qmes:data-updated', schedule);
  document.addEventListener('qmes:data-changed', schedule);
  window.addEventListener('storage', schedule);
  new MutationObserver(schedule).observe(document.documentElement, {childList:true, subtree:true});
})();
