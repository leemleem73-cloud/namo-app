window.QMS = window.QMS || {};

window.QMS.suppliers = {
  async list() {
    QMS.state.suppliers = await api('/api/suppliers');
    this.render();
  },

  render() {
    const tbody = document.getElementById('supplierTable');
    if (!tbody) return;

    const rows = QMS.utils.applyFilters(QMS.state.suppliers || [], ['created_at']);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">데이터가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.name || ''}</td>
        <td>${row.manager || ''}</td>
        <td>${row.phone || ''}</td>
        <td>${row.category || ''}</td>
        <td>${row.status || ''}</td>
        <td>
          <div class="inline-actions">
            <button class="btn btn-light btn-sm" onclick="QMS.suppliers.edit('${row.id}')">수정</button>
            <button class="btn btn-danger btn-sm" onclick="QMS.suppliers.remove('${row.id}')">삭제</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  getFormData() {
    return {
      name: document.getElementById('supName')?.value || '',
      manager: document.getElementById('supManager')?.value || '',
      phone: document.getElementById('supPhone')?.value || '',
      category: document.getElementById('supCategory')?.value || '',
      status: document.getElementById('supStatus')?.value || '',
    };
  },

  fillForm(row) {
    if (document.getElementById('supName')) document.getElementById('supName').value = row.name || '';
    if (document.getElementById('supManager')) document.getElementById('supManager').value = row.manager || '';
    if (document.getElementById('supPhone')) document.getElementById('supPhone').value = row.phone || '';
    if (document.getElementById('supCategory')) document.getElementById('supCategory').value = row.category || '';
    if (document.getElementById('supStatus')) document.getElementById('supStatus').value = row.status || '';
    if (document.getElementById('supEditId')) document.getElementById('supEditId').value = row.id || '';
  },

  clearForm() {
    if (document.getElementById('supName')) document.getElementById('supName').value = '';
    if (document.getElementById('supManager')) document.getElementById('supManager').value = '';
    if (document.getElementById('supPhone')) document.getElementById('supPhone').value = '';
    if (document.getElementById('supCategory')) document.getElementById('supCategory').value = '';
    if (document.getElementById('supStatus')) document.getElementById('supStatus').value = '';
    if (document.getElementById('supEditId')) document.getElementById('supEditId').value = '';
  },

  fillSample() {
    if (document.getElementById('supName')) document.getElementById('supName').value = '협력업체A';
    if (document.getElementById('supManager')) document.getElementById('supManager').value = '이담당';
    if (document.getElementById('supPhone')) document.getElementById('supPhone').value = '010-1234-5678';
    if (document.getElementById('supCategory')) document.getElementById('supCategory').value = '원료';
    if (document.getElementById('supStatus')) document.getElementById('supStatus').value = '거래중';
  },

  async save() {
    const editId = document.getElementById('supEditId')?.value || '';
    const payload = this.getFormData();

    if (!payload.name) {
      alert('업체명은 필수입니다.');
      return;
    }

    try {
      if (editId) {
        await api(`/api/suppliers/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('협력업체 정보가 수정되었습니다.');
      } else {
        await api('/api/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('협력업체 정보가 저장되었습니다.');
      }

      this.clearForm();
      await this.list();
    } catch (err) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  },

  edit(id) {
    const row = (QMS.state.suppliers || []).find((item) => item.id === id);
    if (!row) return;
    this.fillForm(row);
    QMS.utils.switchMainTab('suppliers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async remove(id) {
    if (!confirm('삭제하시겠습니까?')) return;

    try {
      await api(`/api/suppliers/${id}`, { method: 'DELETE' });
      alert('삭제되었습니다.');
      await this.list();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  },

  bind() {
    const saveBtn = document.getElementById('supplierSaveBtn');
    const refreshBtn = document.getElementById('supplierRefreshBtn');
    const sampleBtn = document.getElementById('supplierSampleBtn');

    if (saveBtn) saveBtn.onclick = () => this.save();
    if (refreshBtn) refreshBtn.onclick = () => this.list();
    if (sampleBtn) sampleBtn.onclick = () => this.fillSample();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.QMS?.suppliers) {
    window.QMS.suppliers.bind();
  }
});
