window.QMS = window.QMS || {};

window.QMS.pqc = {
  async list() {
    QMS.state.pqc = await api('/api/pqc');
    this.render();
  },

  render() {
    const tbody = document.getElementById('pqcTable');
    if (!tbody) return;

    const rows = QMS.utils.applyFilters(QMS.state.pqc || [], ['date']);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty">데이터가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.date || ''}</td>
        <td>${row.product || ''}</td>
        <td>${row.lot || ''}</td>
        <td>${row.visual || ''}</td>
        <td>${row.judge || ''}</td>
        <td>${row.incoming_qty ?? ''}</td>
        <td>${row.qty ?? ''}</td>
        <td>${row.fail ?? ''}</td>
        <td>
          <div class="inline-actions">
            <button class="btn btn-light btn-sm" onclick="QMS.pqc.edit('${row.id}')">수정</button>
            <button class="btn btn-danger btn-sm" onclick="QMS.pqc.remove('${row.id}')">삭제</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  getFormData() {
    return {
      date: document.getElementById('pqcDate')?.value || '',
      product: document.getElementById('pqcProduct')?.value || '',
      lot: document.getElementById('pqcLot')?.value || '',
      visual: document.getElementById('pqcVisual')?.value || '',
      viscosity: document.getElementById('pqcViscosity')?.value || '',
      solid: document.getElementById('pqcSolid')?.value || '',
      particle: document.getElementById('pqcParticle')?.value || '',
      judge: document.getElementById('pqcJudge')?.value || '',
      incomingQty: document.getElementById('pqcIncomingQty')?.value || '',
      qty: document.getElementById('pqcQty')?.value || '',
      fail: document.getElementById('pqcFail')?.value || '',
    };
  },

  fillForm(row) {
    if (document.getElementById('pqcDate')) document.getElementById('pqcDate').value = row.date || '';
    if (document.getElementById('pqcProduct')) document.getElementById('pqcProduct').value = row.product || '';
    if (document.getElementById('pqcLot')) document.getElementById('pqcLot').value = row.lot || '';
    if (document.getElementById('pqcVisual')) document.getElementById('pqcVisual').value = row.visual || '';
    if (document.getElementById('pqcViscosity')) document.getElementById('pqcViscosity').value = row.viscosity || '';
    if (document.getElementById('pqcSolid')) document.getElementById('pqcSolid').value = row.solid || '';
    if (document.getElementById('pqcParticle')) document.getElementById('pqcParticle').value = row.particle || '';
    if (document.getElementById('pqcJudge')) document.getElementById('pqcJudge').value = row.judge || '';
    if (document.getElementById('pqcIncomingQty')) document.getElementById('pqcIncomingQty').value = row.incoming_qty ?? '';
    if (document.getElementById('pqcQty')) document.getElementById('pqcQty').value = row.qty ?? '';
    if (document.getElementById('pqcFail')) document.getElementById('pqcFail').value = row.fail ?? '';
    if (document.getElementById('pqcEditId')) document.getElementById('pqcEditId').value = row.id || '';
  },

  clearForm() {
    if (document.getElementById('pqcDate')) document.getElementById('pqcDate').value = QMS.utils.today();
    if (document.getElementById('pqcProduct')) document.getElementById('pqcProduct').value = '';
    if (document.getElementById('pqcLot')) document.getElementById('pqcLot').value = '';
    if (document.getElementById('pqcVisual')) document.getElementById('pqcVisual').value = '';
    if (document.getElementById('pqcViscosity')) document.getElementById('pqcViscosity').value = '';
    if (document.getElementById('pqcSolid')) document.getElementById('pqcSolid').value = '';
    if (document.getElementById('pqcParticle')) document.getElementById('pqcParticle').value = '';
    if (document.getElementById('pqcJudge')) document.getElementById('pqcJudge').value = '';
    if (document.getElementById('pqcIncomingQty')) document.getElementById('pqcIncomingQty').value = '';
    if (document.getElementById('pqcQty')) document.getElementById('pqcQty').value = '';
    if (document.getElementById('pqcFail')) document.getElementById('pqcFail').value = '';
    if (document.getElementById('pqcEditId')) document.getElementById('pqcEditId').value = '';
  },

  fillSample() {
    if (document.getElementById('pqcDate')) document.getElementById('pqcDate').value = QMS.utils.today();
    if (document.getElementById('pqcProduct')) document.getElementById('pqcProduct').value = '제품A';
    if (document.getElementById('pqcLot')) document.getElementById('pqcLot').value = 'PQC-LOT-001';
    if (document.getElementById('pqcVisual')) document.getElementById('pqcVisual').value = '이상 없음';
    if (document.getElementById('pqcViscosity')) document.getElementById('pqcViscosity').value = '1,550 cp';
    if (document.getElementById('pqcSolid')) document.getElementById('pqcSolid').value = '20.1 wt.%';
    if (document.getElementById('pqcParticle')) document.getElementById('pqcParticle').value = '적합';
    if (document.getElementById('pqcJudge')) document.getElementById('pqcJudge').value = '합격';
    if (document.getElementById('pqcIncomingQty')) document.getElementById('pqcIncomingQty').value = '800';
    if (document.getElementById('pqcQty')) document.getElementById('pqcQty').value = '80';
    if (document.getElementById('pqcFail')) document.getElementById('pqcFail').value = '0';
  },

  async save() {
    const editId = document.getElementById('pqcEditId')?.value || '';
    const payload = this.getFormData();

    if (!payload.date || !payload.product || !payload.lot) {
      alert('일자, 제품명, LOT는 필수입니다.');
      return;
    }

    try {
      if (editId) {
        await api(`/api/pqc/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('공정검사가 수정되었습니다.');
      } else {
        await api('/api/pqc', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('공정검사가 저장되었습니다.');
      }

      this.clearForm();
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  },

  edit(id) {
    const row = (QMS.state.pqc || []).find((item) => item.id === id);
    if (!row) return;
    this.fillForm(row);
    QMS.utils.switchMainTab('pqc');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async remove(id) {
    if (!confirm('삭제하시겠습니까?')) return;

    try {
      await api(`/api/pqc/${id}`, { method: 'DELETE' });
      alert('삭제되었습니다.');
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  },

  bind() {
    const saveBtn = document.getElementById('pqcSaveBtn');
    const refreshBtn = document.getElementById('pqcRefreshBtn');
    const sampleBtn = document.getElementById('pqcSampleBtn');

    if (saveBtn) saveBtn.onclick = () => this.save();
    if (refreshBtn) refreshBtn.onclick = () => this.list();
    if (sampleBtn) sampleBtn.onclick = () => this.fillSample();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.QMS?.pqc) {
    window.QMS.pqc.bind();
  }
});
