window.QMS = window.QMS || {};

window.QMS.nonconform = {
  async list() {
    QMS.state.nonconform = await api('/api/nonconform');
    this.render();
  },

  render() {
    const tbody = document.getElementById('ncTable');
    if (!tbody) return;

    const rows = QMS.utils.applyFilters(QMS.state.nonconform || [], ['date']);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">데이터가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.date || ''}</td>
        <td>${row.type || ''}</td>
        <td>${row.lot || ''}</td>
        <td>${row.item || ''}</td>
        <td>${row.issue || ''}</td>
        <td>${row.owner || ''}</td>
        <td>${row.status || ''}</td>
        <td>
          <div class="inline-actions">
            <button class="btn btn-light btn-sm" onclick="QMS.nonconform.edit('${row.id}')">수정</button>
            <button class="btn btn-danger btn-sm" onclick="QMS.nonconform.remove('${row.id}')">삭제</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  getFormData() {
    return {
      date: document.getElementById('ncDate')?.value || '',
      type: document.getElementById('ncType')?.value || '',
      lot: document.getElementById('ncLot')?.value || '',
      item: document.getElementById('ncItem')?.value || '',
      issue: document.getElementById('ncIssue')?.value || '',
      cause: document.getElementById('ncCause')?.value || '',
      action: document.getElementById('ncAction')?.value || '',
      owner: document.getElementById('ncOwner')?.value || '',
      status: document.getElementById('ncStatus')?.value || '',
    };
  },

  fillForm(row) {
    if (document.getElementById('ncDate')) document.getElementById('ncDate').value = row.date || '';
    if (document.getElementById('ncType')) document.getElementById('ncType').value = row.type || '';
    if (document.getElementById('ncLot')) document.getElementById('ncLot').value = row.lot || '';
    if (document.getElementById('ncItem')) document.getElementById('ncItem').value = row.item || '';
    if (document.getElementById('ncIssue')) document.getElementById('ncIssue').value = row.issue || '';
    if (document.getElementById('ncCause')) document.getElementById('ncCause').value = row.cause || '';
    if (document.getElementById('ncAction')) document.getElementById('ncAction').value = row.action || '';
    if (document.getElementById('ncOwner')) document.getElementById('ncOwner').value = row.owner || '';
    if (document.getElementById('ncStatus')) document.getElementById('ncStatus').value = row.status || '';
    if (document.getElementById('ncEditId')) document.getElementById('ncEditId').value = row.id || '';
  },

  clearForm() {
    if (document.getElementById('ncDate')) document.getElementById('ncDate').value = QMS.utils.today();
    if (document.getElementById('ncType')) document.getElementById('ncType').value = '';
    if (document.getElementById('ncLot')) document.getElementById('ncLot').value = '';
    if (document.getElementById('ncItem')) document.getElementById('ncItem').value = '';
    if (document.getElementById('ncIssue')) document.getElementById('ncIssue').value = '';
    if (document.getElementById('ncCause')) document.getElementById('ncCause').value = '';
    if (document.getElementById('ncAction')) document.getElementById('ncAction').value = '';
    if (document.getElementById('ncOwner')) document.getElementById('ncOwner').value = '';
    if (document.getElementById('ncStatus')) document.getElementById('ncStatus').value = '';
    if (document.getElementById('ncEditId')) document.getElementById('ncEditId').value = '';
  },

  fillSample() {
    if (document.getElementById('ncDate')) document.getElementById('ncDate').value = QMS.utils.today();
    if (document.getElementById('ncType')) document.getElementById('ncType').value = '공정';
    if (document.getElementById('ncLot')) document.getElementById('ncLot').value = 'NC-LOT-001';
    if (document.getElementById('ncItem')) document.getElementById('ncItem').value = '제품A';
    if (document.getElementById('ncIssue')) document.getElementById('ncIssue').value = '외관 이물 발견';
    if (document.getElementById('ncCause')) document.getElementById('ncCause').value = '혼합 공정 중 이물 혼입 추정';
    if (document.getElementById('ncAction')) document.getElementById('ncAction').value = '전량 격리 후 재검사 실시';
    if (document.getElementById('ncOwner')) document.getElementById('ncOwner').value = '김품질';
    if (document.getElementById('ncStatus')) document.getElementById('ncStatus').value = '조치중';
  },

  async save() {
    const editId = document.getElementById('ncEditId')?.value || '';
    const payload = this.getFormData();

    if (!payload.date || !payload.type || !payload.item || !payload.issue) {
      alert('일자, 구분, 품목, 문제내용은 필수입니다.');
      return;
    }

    try {
      if (editId) {
        await api(`/api/nonconform/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('부적합 데이터가 수정되었습니다.');
      } else {
        await api('/api/nonconform', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('부적합 데이터가 저장되었습니다.');
      }

      this.clearForm();
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  },

  edit(id) {
    const row = (QMS.state.nonconform || []).find((item) => item.id === id);
    if (!row) return;
    this.fillForm(row);
    QMS.utils.switchMainTab('nonconform');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async remove(id) {
    if (!confirm('삭제하시겠습니까?')) return;

    try {
      await api(`/api/nonconform/${id}`, { method: 'DELETE' });
      alert('삭제되었습니다.');
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  },

  bind() {
    const saveBtn = document.getElementById('ncSaveBtn');
    const refreshBtn = document.getElementById('ncRefreshBtn');
    const sampleBtn = document.getElementById('ncSampleBtn');

    if (saveBtn) saveBtn.onclick = () => this.save();
    if (refreshBtn) refreshBtn.onclick = () => this.list();
    if (sampleBtn) sampleBtn.onclick = () => this.fillSample();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.QMS?.nonconform) {
    window.QMS.nonconform.bind();
  }
});
