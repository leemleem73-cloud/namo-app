export function buildWorklogPayload() {
  return {
    workDate: document.getElementById('workDate')?.value || '',
    finishedLot: document.getElementById('finishedLot')?.value || '',
    seq: document.getElementById('workSeq')?.value || '',
    material: document.getElementById('workMaterial')?.value || '',
    supName: document.getElementById('workSupName')?.value || '',
    inputQty: document.getElementById('workInputQty')?.value || '',
    inputRatio: document.getElementById('workInputRatio')?.value || '',
    lotNo: document.getElementById('workLotNo')?.value || '',
    inputTime: document.getElementById('workInputTime')?.value || '',
    worker: document.getElementById('workWorker')?.value || '',
    note: document.getElementById('workNote')?.value || ''
  };
}
