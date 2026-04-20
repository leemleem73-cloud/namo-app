export function buildPqcPayload() {
  return {
    date: document.getElementById('pqcDate')?.value || '',
    product: document.getElementById('pqcProduct')?.value || '',
    lot: document.getElementById('pqcLot')?.value || '',
    visual: document.getElementById('pqcVisual')?.value || '',
    viscosity: document.getElementById('pqcViscosity')?.value || '',
    solid: document.getElementById('pqcSolid')?.value || '',
    particle: document.getElementById('pqcParticle')?.value || '',
    qty: Number(document.getElementById('pqcQty')?.value || 0),
    fail: Number(document.getElementById('pqcFail')?.value || 0),
    judge: document.getElementById('pqcJudge')?.value || ''
  };
}

export function renderPqcRows(rows) {
  if (!rows?.length) return '등록된 공정검사 데이터가 없습니다.';
  return JSON.stringify(rows, null, 2);
}
