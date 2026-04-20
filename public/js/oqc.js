export function buildOqcPayload() {
  return {
    date: document.getElementById('oqcDate')?.value || '',
    customer: document.getElementById('oqcCustomer')?.value || '',
    product: document.getElementById('oqcProduct')?.value || '',
    lot: document.getElementById('oqcLot')?.value || '',
    visual: document.getElementById('oqcVisual')?.value || '',
    viscosity: document.getElementById('oqcViscosity')?.value || '',
    solid: document.getElementById('oqcSolid')?.value || '',
    particle: document.getElementById('oqcParticle')?.value || '',
    adhesion: document.getElementById('oqcAdhesion')?.value || '',
    resistance: document.getElementById('oqcResistance')?.value || '',
    swelling: document.getElementById('oqcSwelling')?.value || '',
    moisture: document.getElementById('oqcMoisture')?.value || '',
    qty: Number(document.getElementById('oqcQty')?.value || 0),
    fail: Number(document.getElementById('oqcFail')?.value || 0),
    judge: document.getElementById('oqcJudge')?.value || ''
  };
}

export function renderOqcRows(rows) {
  if (!rows?.length) return '등록된 출하검사 데이터가 없습니다.';
  return JSON.stringify(rows, null, 2);
}
