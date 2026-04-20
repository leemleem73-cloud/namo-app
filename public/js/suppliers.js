export function buildSupplierPayload() {
  return {
    name: document.getElementById('supName')?.value || '',
    manager: document.getElementById('supManager')?.value || '',
    phone: document.getElementById('supPhone')?.value || '',
    category: document.getElementById('supCategory')?.value || '',
    status: document.getElementById('supStatus')?.value || ''
  };
}
