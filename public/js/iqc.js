export function buildIqcPayload() {
  return {
    date: document.getElementById('iqcDate')?.value || '',
    lot: document.getElementById('iqcLot')?.value || '',
    supplier: document.getElementById('iqcSupplier')?.value || '',
    item: document.getElementById('iqcItem')?.value || '',
    inspector: document.getElementById('iqcInspector')?.value || '',
    qty: Number(document.getElementById('iqcQty')?.value || 0),
    fail: Number(document.getElementById('iqcFail')?.value || 0)
  };
}

export function renderIqcRows(rows) {
  if (!rows?.length) return '등록된 수입검사 데이터가 없습니다.';
  return JSON.stringify(rows, null, 2);
}
