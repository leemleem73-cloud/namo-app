window.QMS = window.QMS || {};

window.QMS.iqc = {
  async list() {
    QMS.state.iqc = await api('/api/iqc');
    this.render();
  },

  render() {
    const tbody = document.getElementById('iqcTable');
    if (!tbody) return;

    const rows = QMS.utils.applyFilters(QMS.state.iqc || [], ['date']);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty">데이터가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.date || ''}</td>
        <td>${row.lot || ''}</td>
        <td>${row.supplier || ''}</td>
        <td>${row.item || ''}</td>
        <td>${row.inspector || ''}</td>
        <td>${row.incoming_qty ?? ''}</td>
        <td>${row.qty ?? ''}</td>
        <td>${row.fail ?? ''}</td>
        <td>
          <div class="inline-actions">
            <button class="btn btn-light btn-sm" onclick="QMS.iqc.edit('${row.id}')">수정</button>
            <button class="btn btn-danger btn-sm" onclick="QMS.iqc.remove('${row.id}')">삭제</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  getFormData() {
    return {
      date: document.getElementById('iqcDate')?.value || '',
      lot: document.getElementById('iqcLot')?.value || '',
      supplier: document.getElementById('iqcSupplier')?.value || '',
      item: document.getElementById('iqcItem')?.value || '',
      inspector: document.getElementById('iqcInspector')?.value || '',
      incomingQty: document.getElementById('iqcIncomingQty')?.value || '',
      qty: document.getElementById('iqcQty')?.value || '',
      fail: document.getElementById('iqcFail')?.value || '',
    };
  },

  fillForm(row) {
    if (document.getElementById('iqcDate')) document.getElementById('iqcDate').value = row.date || '';
    if (document.getElementById('iqcLot')) document.getElementById('iqcLot').value = row.lot || '';
    if (document.getElementById('iqcSupplier')) document.getElementById('iqcSupplier').value = row.supplier || '';
    if (document.getElementById('iqcItem')) document.getElementById('iqcItem').value = row.item || '';
    if (document.getElementById('iqcInspector')) document.getElementById('iqcInspector').value = row.inspector || '';
    if (document.getElementById('iqcIncomingQty')) document.getElementById('iqcIncomingQty').value = row.incoming_qty ?? '';
    if (document.getElementById('iqcQty')) document.getElementById('iqcQty').value = row.qty ?? '';
    if (document.getElementById('iqcFail')) document.getElementById('iqcFail').value = row.fail ?? '';
    if (document.getElementById('iqcEditId')) document.getElementById('iqcEditId').value = row.id || '';
  },

  clearForm() {
    if (document.getElementById('iqcDate')) document.getElementById('iqcDate').value = QMS.utils.today();
    if (document.getElementById('iqcLot')) document.getElementById('iqcLot').value = '';
    if (document.getElementById('iqcSupplier')) document.getElementById('iqcSupplier').value = '';
    if (document.getElementById('iqcItem')) document.getElementById('iqcItem').value = '';
    if (document.getElementById('iqcInspector')) document.getElementById('iqcInspector').value = '';
    if (document.getElementById('iqcIncomingQty')) document.getElementById('iqcIncomingQty').value = '';
    if (document.getElementById('iqcQty')) document.getElementById('iqcQty').value = '';
    if (document.getElementById('iqcFail')) document.getElementById('iqcFail').value = '';
    if (document.getElementById('iqcEditId')) document.getElementById('iqcEditId').value = '';
  },

  fillSample() {
    if (document.getElementById('iqcDate')) document.getElementById('iqcDate').value = QMS.utils.today();
    if (document.getElementById('iqcLot')) document.getElementById('iqcLot').value = 'IQC-LOT-001';
    if (document.getElementById('iqcSupplier')) document.getElementById('iqcSupplier').value = '협력업체A';
    if (document.getElementById('iqcItem')) document.getElementById('iqcItem').value = '원료A';
    if (document.getElementById('iqcInspector')) document.getElementById('iqcInspector').value = '홍길동';
    if (document.getElementById('iqcIncomingQty')) document.getElementById('iqcIncomingQty').value = '1000';
    if (document.getElementById('iqcQty')) document.getElementById('iqcQty').value = '100';
    if (document.getElementById('iqcFail')) document.getElementById('iqcFail').value = '0';
  },

  async save() {
    const editId = document.getElementById('iqcEditId')?.value || '';
    const payload = this.getFormData();

    if (!payload.date || !payload.lot || !payload.supplier || !payload.item || !payload.inspector) {
      alert('일자, LOT, 협력업체, 품목, 검사자는 필수입니다.');
      return;
    }

    try {
      if (editId) {
        await api(`/api/iqc/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('수입검사가 수정되었습니다.');
      } else {
        await api('/api/iqc', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('수입검사가 저장되었습니다.');
      }

      this.clearForm();
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  },

  edit(id) {
    const row = (QMS.state.iqc || []).find((item) => item.id === id);
    if (!row) return;
    this.fillForm(row);
    QMS.utils.switchMainTab('iqc');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async remove(id) {
    if (!confirm('삭제하시겠습니까?')) return;

    try {
      await api(`/api/iqc/${id}`, { method: 'DELETE' });
      alert('삭제되었습니다.');
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  },

  bind() {
    const saveBtn = document.getElementById('iqcSaveBtn');
    const refreshBtn = document.getElementById('iqcRefreshBtn');
    const sampleBtn = document.getElementById('iqcSampleBtn');

    if (saveBtn) saveBtn.onclick = () => this.save();
    if (refreshBtn) refreshBtn.onclick = () => this.list();
    if (sampleBtn) sampleBtn.onclick = () => this.fillSample();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.QMS?.iqc) {
    window.QMS.iqc.bind();
  }
});
