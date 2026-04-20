export function buildNonconformPayload() {
  return {
    id: document.getElementById('ncId')?.value || '',
    date: document.getElementById('ncDate')?.value || '',
    type: document.getElementById('ncType')?.value || '',
    lot: document.getElementById('ncLot')?.value || '',
    item: document.getElementById('ncItem')?.value || '',
    issue: document.getElementById('ncIssue')?.value || '',
    cause: document.getElementById('ncCause')?.value || '',
    action: document.getElementById('ncAction')?.value || '',
    owner: document.getElementById('ncOwner')?.value || '',
    status: document.getElementById('ncStatus')?.value || ''
  };
}

export function renderNonconformRows(rows) {
  if (!rows?.length) return '등록된 부적합 데이터가 없습니다.';
  return JSON.stringify(rows, null, 2);
}
