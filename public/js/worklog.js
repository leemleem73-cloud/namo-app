window.QMS = window.QMS || {};

window.QMS.worklog = {
  async list() {
    QMS.state.worklog = await api('/api/worklog');
    this.render();
  },

  render() {
    const tbody = document.getElementById('worklogTable');
    if (!tbody) return;

    const rows = QMS.utils.applyFilters(QMS.state.worklog || [], ['workDate']);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">데이터가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const firstMaterial = Array.isArray(row.materials) && row.materials.length
        ? row.materials[0]
        : {};

      return `
        <tr>
          <td>${row.workDate || ''}</td>
          <td>${row.finishedLot || ''}</td>
          <td>${firstMaterial.seq ?? ''}</td>
          <td>${firstMaterial.material || ''}</td>
          <td>${firstMaterial.lotNo || ''}</td>
          <td>${row.worker || ''}</td>
          <td>${row.prodQty || ''}</td>
          <td>
            <div class="inline-actions">
              <button class="btn btn-light btn-sm" onclick="QMS.worklog.edit('${row.id}')">수정</button>
              <button class="btn btn-danger btn-sm" onclick="QMS.worklog.remove('${row.id}')">삭제</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  getFormData() {
    const material = {
      seq: document.getElementById('workSeq')?.value || '1',
      material: document.getElementById('workMaterial')?.value || '',
      supName: document.getElementById('workSupName')?.value || '',
      lotNo: document.getElementById('workLotNo')?.value || '',
      inputQty: document.getElementById('workInputQty')?.value || '',
      inputTime: document.getElementById('workInputTime')?.value || '',
    };

    return {
      workDate: document.getElementById('workDate')?.value || '',
      finishedLot: document.getElementById('finishedLot')?.value || '',
      worker: document.getElementById('workWorker')?.value || '',
      planQty: document.getElementById('workPlanQty')?.value || '',
      prodQty: document.getElementById('workProdQty')?.value || '',
      failQty: document.getElementById('workFailQty')?.value || '',
      remark: document.getElementById('workNote')?.value || '',
      flowSet: document.getElementById('flowSet')?.value || '',
      flowActual: document.getElementById('flowReal')?.value || '',
      tempSet: document.getElementById('tempSet')?.value || '',
      tempActual: document.getElementById('tempReal')?.value || '',
      pressSet: document.getElementById('pressSet')?.value || '',
      pressActual: document.getElementById('pressReal')?.value || '',
      materials: [material],
    };
  },

  fillForm(row) {
    const firstMaterial = Array.isArray(row.materials) && row.materials.length
      ? row.materials[0]
      : {};

    if (document.getElementById('workDate')) document.getElementById('workDate').value = row.workDate || '';
    if (document.getElementById('finishedLot')) document.getElementById('finishedLot').value = row.finishedLot || '';
    if (document.getElementById('workSeq')) document.getElementById('workSeq').value = firstMaterial.seq || '';
    if (document.getElementById('workMaterial')) document.getElementById('workMaterial').value = firstMaterial.material || '';
    if (document.getElementById('workLotNo')) document.getElementById('workLotNo').value = firstMaterial.lotNo || '';
    if (document.getElementById('workInputTime')) document.getElementById('workInputTime').value = firstMaterial.inputTime || '';
    if (document.getElementById('workWorker')) document.getElementById('workWorker').value = row.worker || '';
    if (document.getElementById('workPlanQty')) document.getElementById('workPlanQty').value = row.planQty || '';
    if (document.getElementById('workProdQty')) document.getElementById('workProdQty').value = row.prodQty || '';
    if (document.getElementById('workFailQty')) document.getElementById('workFailQty').value = row.failQty || '';
    if (document.getElementById('workSupName')) document.getElementById('workSupName').value = firstMaterial.supName || '';
    if (document.getElementById('workInputQty')) document.getElementById('workInputQty').value = firstMaterial.inputQty || '';
    if (document.getElementById('workNote')) document.getElementById('workNote').value = row.remark || '';
    if (document.getElementById('flowSet')) document.getElementById('flowSet').value = row.flowSet || '';
    if (document.getElementById('flowReal')) document.getElementById('flowReal').value = row.flowActual || '';
    if (document.getElementById('tempSet')) document.getElementById('tempSet').value = row.tempSet || '';
    if (document.getElementById('tempReal')) document.getElementById('tempReal').value = row.tempActual || '';
    if (document.getElementById('pressSet')) document.getElementById('pressSet').value = row.pressSet || '';
    if (document.getElementById('pressReal')) document.getElementById('pressReal').value = row.pressActual || '';
    if (document.getElementById('workEditId')) document.getElementById('workEditId').value = row.id || '';
  },

  clearForm() {
    if (document.getElementById('workDate')) document.getElementById('workDate').value = QMS.utils.today();
    if (document.getElementById('finishedLot')) document.getElementById('finishedLot').value = '';
    if (document.getElementById('workSeq')) document.getElementById('workSeq').value = '';
    if (document.getElementById('workMaterial')) document.getElementById('workMaterial').value = '';
    if (document.getElementById('workLotNo')) document.getElementById('workLotNo').value = '';
    if (document.getElementById('workInputTime')) document.getElementById('workInputTime').value = '';
    if (document.getElementById('workWorker')) document.getElementById('workWorker').value = '';
    if (document.getElementById('workPlanQty')) document.getElementById('workPlanQty').value = '';
    if (document.getElementById('workProdQty')) document.getElementById('workProdQty').value = '';
    if (document.getElementById('workFailQty')) document.getElementById('workFailQty').value = '';
    if (document.getElementById('workSupName')) document.getElementById('workSupName').value = '';
    if (document.getElementById('workInputQty')) document.getElementById('workInputQty').value = '';
    if (document.getElementById('workNote')) document.getElementById('workNote').value = '';
    if (document.getElementById('flowSet')) document.getElementById('flowSet').value = '';
    if (document.getElementById('flowReal')) document.getElementById('flowReal').value = '';
    if (document.getElementById('tempSet')) document.getElementById('tempSet').value = '';
    if (document.getElementById('tempReal')) document.getElementById('tempReal').value = '';
    if (document.getElementById('pressSet')) document.getElementById('pressSet').value = '';
    if (document.getElementById('pressReal')) document.getElementById('pressReal').value = '';
    if (document.getElementById('workEditId')) document.getElementById('workEditId').value = '';
  },

  fillSample() {
    if (document.getElementById('workDate')) document.getElementById('workDate').value = QMS.utils.today();
    if (document.getElementById('finishedLot')) document.getElementById('finishedLot').value = 'FIN-LOT-001';
    if (document.getElementById('workSeq')) document.getElementById('workSeq').value = '1';
    if (document.getElementById('workMaterial')) document.getElementById('workMaterial').value = '원료A';
    if (document.getElementById('workLotNo')) document.getElementById('workLotNo').value = 'MAT-001';
    if (document.getElementById('workInputTime')) document.getElementById('workInputTime').value = '09:00';
    if (document.getElementById('workWorker')) document.getElementById('workWorker').value = '김생산';
    if (document.getElementById('workPlanQty')) document.getElementById('workPlanQty').value = '1000';
    if (document.getElementById('workProdQty')) document.getElementById('workProdQty').value = '980';
    if (document.getElementById('workFailQty')) document.getElementById('workFailQty').value = '20';
    if (document.getElementById('workSupName')) document.getElementById('workSupName').value = '협력업체A';
    if (document.getElementById('workInputQty')) document.getElementById('workInputQty').value = '300kg';
    if (document.getElementById('workNote')) document.getElementById('workNote').value = '특이사항 없음';
    if (document.getElementById('flowSet')) document.getElementById('flowSet').value = '25';
    if (document.getElementById('flowReal')) document.getElementById('flowReal').value = '24.8';
    if (document.getElementById('tempSet')) document.getElementById('tempSet').value = '60';
    if (document.getElementById('tempReal')) document.getElementById('tempReal').value = '59.5';
    if (document.getElementById('pressSet')) document.getElementById('pressSet').value = '1.5';
    if (document.getElementById('pressReal')) document.getElementById('pressReal').value = '1.4';
  },

  async save() {
    const editId = document.getElementById('workEditId')?.value || '';
    const payload = this.getFormData();

    if (!payload.workDate || !payload.finishedLot || !payload.worker) {
      alert('생산일자, 완제품 LOT, 작업자는 필수입니다.');
      return;
    }

    try {
      if (editId) {
        await api(`/api/worklog/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('생산작업일지가 수정되었습니다.');
      } else {
        await api('/api/worklog', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('생산작업일지가 저장되었습니다.');
      }

      this.clearForm();
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  },

  edit(id) {
    const row = (QMS.state.worklog || []).find((item) => item.id === id);
    if (!row) return;
    this.fillForm(row);
    QMS.utils.switchMainTab('worklog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async remove(id) {
    if (!confirm('삭제하시겠습니까?')) return;

    try {
      await api(`/api/worklog/${id}`, { method: 'DELETE' });
      alert('삭제되었습니다.');
      await this.list();
      QMS.app.renderAll();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  },

  bind() {
    const saveBtn = document.getElementById('worklogSaveBtn');
    const refreshBtn = document.getElementById('worklogRefreshBtn');
    const sampleBtn = document.getElementById('worklogSampleBtn');

    if (saveBtn) saveBtn.onclick = () => this.save();
    if (refreshBtn) refreshBtn.onclick = () => this.list();
    if (sampleBtn) sampleBtn.onclick = () => this.fillSample();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.QMS?.worklog) {
    window.QMS.worklog.bind();
  }
});
