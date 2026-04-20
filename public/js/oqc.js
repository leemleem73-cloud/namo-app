window.QMS = window.QMS || {};

window.QMS.oqc = {
  async list() {
    QMS.state.oqc = await api('/api/oqc');
    this.render();
  },

  render() {
    const tbody = document.getElementById('oqcTable');
    if (!tbody) return;

    const rows = QMS.utils.applyFilters(QMS.state.oqc || [], ['date']);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">데이터가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.date || ''}</td>
        <td>${row.customer || ''}</td>
        <td>${row.product || ''}</td>
        <td>${row.lot || ''}</td>
        <td>${row.judge || ''}</td>
        <td>${row.qty || ''}</td>
        <td>${row.fail ?? ''}</td>
        <td>
          <div class="inline-actions">
            <button class="btn btn-light btn-sm" onclick="QMS.oqc.edit('${row.id}')">수정</button>
            <button class="btn btn-danger btn-sm" onclick="QMS.oqc.remove('${row.id}')">삭제</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  getFormData() {
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
      qty: document.getElementById('oqcQty')?.value || '',
      fail: document.getElementById('oqcFail')?.value || '',
      judge: document.getElementById('oqcJudge')?.value || '',
    };
  },

  fillForm(row) {
    if (document.getElementById('oqcDate')) document.getElementById('oqcDate').value = row.date || '';
    if (document.getElementById('oqcCustomer')) document.getElementById('oqcCustomer').value = row.customer || '';
    if (document.getElementById('oqcProduct')) document.getElementById('oqcProduct').value = row.product || '';
    if (document.getElementById('oqcLot')) document.getElementById('oqcLot').value = row.lot || '';
    if (document.getElementById('oqcVisual')) document.getElementById('oqcVisual').value = row.visual || '';
    if (document.getElementById('oqcViscosity')) document.getElementById('oqcViscosity').value = row.viscosity || '';
    if (document.getElementById('oqcSolid')) document.getElementById('oqcSolid').value = row.solid || '';
    if (document.getElementById('oqcParticle')) document.getElementById('oqcParticle').value = row.particle || '';
    if (document.getElementById('oqcAdhesion')) document.getElementById('oqcAdhesion').value = row.adhesion || '';
    if (document.getElementById('oqcResistance')) document.getElementById('oqcResistance').value = row.resistance || '';
    if (document.getElementById('oqcSwelling')) document.getElementById('oqcSwelling').value = row.swelling || '';
    if (document.getElementById('oqcMoisture')) document.getElementById('oqcMoisture').value = row.moisture || '';
    if (document.getElementById('oqcQty')) document.getElementById('oqcQty').value = row.qty || '';
    if (document.getElementById('oqcFail')) document.getElementById('oqcFail').value = row.fail ?? '';
    if (document.getElementById('oqcJudge')) document.getElementById('oqcJudge').value = row.judge || '';
    if (document.getElementById('oqcEditId')) document.getElementById('oqcEditId').value = row.id || '';
  },

  clearForm() {
    if (document.getElementById('oqcDate')) document.getElementById('oqcDate').value = QMS.utils.today();
    if (document.getElementById('oqcCustomer')) document.getElementById('oqcCustomer').value = '';
    if (document.getElementById('oqcProduct')) document.getElementById('oqcProduct').value = '';
    if (document.getElementById('oqcLot')) document.getElementById('oqcLot').value = '';
    if (document.getElementById('oqcVisual')) document.getElementById('oqcVisual').value = '';
    if (document.getElementById('oqcViscosity')) document.getElementById('oqcViscosity').value = '';
    if (document.getElementById('oqcSolid')) document.getElementById('oqcSolid').value = '';
    if (document.getElementById('oqcParticle')) document.getElementById('oqcParticle').value = '';
    if (document.getElementById('oqcAdhesion')) document.getElementById('oqcAdhesion').value = '';
    if (document.getElementById('oqcResistance')) document.getElementById('oqcResistance').value = '';
    if (document.getElementById('oqcSwelling')) document.getElementById('oqcSwelling').value = '';
    if (document.getElementById('oqcMoisture')) document.getElementById('oqcMoisture').value = '';
    if (document.getElementById('oqcQty')) document.getElementById('oqcQty').value = '';
    if (document.getElementById('oqcFail')) document.getElementById('oqcFail').value = '';
    if (document.getElementById('oqcJudge')) document.getElementById('oqcJudge').value = '';
    if (document.getElementById('oqcEditId')) document.getElementById('oqcEditId').value = '';
  },

  fillSample() {
    if (document.getElementById('oqcDate')) document.getElementById('oqcDate').value = QMS.utils.today();
    if (document.getElementById('oqcCustomer')) document.getElementById('oqcCustomer').value = '고객사A';
    if (document.getElementById('oqcProduct')) document.getElementById('oqcProduct').value = '제품A';
    if (document.getElementById('oqcLot')) document.getElementById('oqcLot').value = 'OQC-LOT-001';
    if (document.getElementById('oqcVisual')) document.getElementById('oqcVisual').value = '이상 없음';
    if (document.getElementById('oqcViscosity')) document.getElementById('oqcViscosity').value = '1,520 cp';
    if (document.getElementById('oqcSolid')) document.getElementById('oqcSolid').value = '20.2 wt.%';
    if (document.getElementById('oqcParticle')) document.getElementById('oqcParticle').value = '적합';
    if (document.getElementById('oqcAdhesion')) document.getElementById('oqcAdhesion').value = '합격';
    if (document.getElementById('oqcResistance')) document.getElementById('oqcResistance').value = '합격';
    if (document.getElementById('oqcSwelling')) document.getElementById('oqcSwelling').value = '합격';
    if (document.getElementById('oqcMoisture')) document.getElementById('oqcMoisture').value = '합격';
    if (document.getElementById('oqcQty')) document.getElementById('oqcQty').value = '900 EA';
    if (document.getElementById('oqcFail')) document.getElementById('oqcFail').value = '0';
    if (document.getElementById('oqcJudge')) document.getElementById('oqcJudge').value = '합격';
  },

  async save() {
    const editId = document.getElementById('oqcEditId')?.value || '';
    const payload = this.getFormData();

    if (!payload.date || !payload.customer || !payload.product || !payload.lot) {
      alert('일자, 고객사, 제품명, LOT는 필수입니다.');
      return;
    }

    try {
      if (editId) {
        await api(`/api/oqc/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('출하검사가 수정되었습니다.');
      } else {
        await api('/api/oqc', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('출하검사가 저장되었습니다.');
      }

      this.clearForm();
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  },

  edit(id) {
    const row = (QMS.state.oqc || []).find((item) => item.id === id);
    if (!row) return;
    this.fillForm(row);
    QMS.utils.switchMainTab('oqc');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async remove(id) {
    if (!confirm('삭제하시겠습니까?')) return;

    try {
      await api(`/api/oqc/${id}`, { method: 'DELETE' });
      alert('삭제되었습니다.');
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  },

  bind() {
    const saveBtn = document.getElementById('oqcSaveBtn');
    const refreshBtn = document.getElementById('oqcRefreshBtn');
    const sampleBtn = document.getElementById('oqcSampleBtn');

    if (saveBtn) saveBtn.onclick = () => this.save();
    if (refreshBtn) refreshBtn.onclick = () => this.list();
    if (sampleBtn) sampleBtn.onclick = () => this.fillSample();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.QMS?.oqc) {
    window.QMS.oqc.bind();
  }
});
