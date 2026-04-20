window.QMS = window.QMS || {
  state: {
    user: null,
    iqc: [],
    pqc: [],
    oqc: [],
    suppliers: [],
    nonconform: [],
    worklog: [],
    users: [],
  },
};

window.QMS.utils = {
  $(id) {
    return document.getElementById(id);
  },

  $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  },

  today() {
    return new Date().toISOString().slice(0, 10);
  },

  text(v) {
    return (v ?? '').toString();
  },

  showMessage(el, text, type = 'error') {
    if (!el) return;
    el.className = `message show ${type}`;
    el.textContent = text;
  },

  clearMessage(el) {
    if (!el) return;
    el.className = 'message';
    el.textContent = '';
  },

  switchAuthTab(tab) {
    const loginPanel = this.$('loginPanel');
    const signupPanel = this.$('signupPanel');
    const loginBtn = this.$('loginTabBtn');
    const signupBtn = this.$('signupTabBtn');

    if (loginPanel) loginPanel.classList.toggle('hidden', tab !== 'login');
    if (signupPanel) signupPanel.classList.toggle('hidden', tab !== 'signup');
    if (loginBtn) loginBtn.classList.toggle('active', tab === 'login');
    if (signupBtn) signupBtn.classList.toggle('active', tab === 'signup');
  },

  switchMainTab(tab) {
    this.$all('.main-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    this.$all('.tab-panel').forEach((panel) => {
      panel.classList.add('hidden');
    });

    const target = this.$(`tab-${tab}`);
    if (target) target.classList.remove('hidden');
  },

  setDefaultDates() {
    [
      'iqcDate',
      'pqcDate',
      'oqcDate',
      'workDate',
      'ncDate',
    ].forEach((id) => {
      const el = this.$(id);
      if (el) el.value = this.today();
    });
  },

  initFilters() {
    const year = this.$('filterYear');
    const month = this.$('filterMonth');
    const day = this.$('filterDay');

    if (!year || !month || !day) return;

    year.innerHTML = '<option value="">전체 연도</option>';

    const now = new Date();
    const currentYear = now.getFullYear();

    for (let y = currentYear - 2; y <= currentYear + 2; y += 1) {
      const option = document.createElement('option');
      option.value = String(y);
      option.textContent = `${y}년`;
      if (y === currentYear) option.selected = true;
      year.appendChild(option);
    }

    month.innerHTML = '<option value="">전체 월</option>';
    for (let i = 1; i <= 12; i += 1) {
      const option = document.createElement('option');
      option.value = String(i).padStart(2, '0');
      option.textContent = `${i}월`;
      month.appendChild(option);
    }

    day.innerHTML = '<option value="">전체 일</option>';
    for (let i = 1; i <= 31; i += 1) {
      const option = document.createElement('option');
      option.value = String(i).padStart(2, '0');
      option.textContent = `${i}일`;
      day.appendChild(option);
    }

    this.updateRangeLabel();
  },

  updateRangeLabel() {
    const year = this.$('filterYear')?.value || '';
    const month = this.$('filterMonth')?.value || '';
    const day = this.$('filterDay')?.value || '';
    const rangeLabel = this.$('rangeLabel');

    if (!rangeLabel) return;

    let label = '전체 조회';
    if (year) label = `${year}년`;
    if (month) label += ` ${month}월`;
    if (day) label += ` ${day}일`;

    rangeLabel.textContent = label;
  },

  getKeyword() {
    return (this.$('keywordInput')?.value || '').trim().toLowerCase();
  },

  applyFilters(rows, dateKeys = ['date']) {
    const year = this.$('filterYear')?.value || '';
    const month = this.$('filterMonth')?.value || '';
    const day = this.$('filterDay')?.value || '';
    const keyword = this.getKeyword();

    return (rows || []).filter((row) => {
      const dateVal = dateKeys.map((k) => row[k]).find(Boolean) || '';
      const dateStr = String(dateVal || '');

      if (year && !dateStr.startsWith(year)) return false;
      if (month && dateStr.slice(5, 7) !== month) return false;
      if (day && dateStr.slice(8, 10) !== day) return false;

      if (keyword) {
        const joined = Object.values(row || {}).join(' ').toLowerCase();
        if (!joined.includes(keyword)) return false;
      }

      return true;
    });
  },

  openModal(id) {
    const el = this.$(id);
    if (el) el.classList.add('show');
  },

  closeModal(id) {
    const el = this.$(id);
    if (el) el.classList.remove('show');
  },
};

window.QMS.auth = {
  async login() {
    const { $, showMessage, clearMessage } = QMS.utils;
    clearMessage($('loginMsg'));

    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: $('loginEmail')?.value || '',
          password: $('loginPassword')?.value || '',
        }),
      });

      QMS.state.user = result.user;
      await QMS.app.onLoggedIn();
    } catch (err) {
      showMessage($('loginMsg'), err.message, 'error');
    }
  },

  async signup() {
    const { $, showMessage, clearMessage, switchAuthTab } = QMS.utils;
    clearMessage($('signupMsg'));

    const pw = $('signupPassword')?.value || '';
    const pw2 = $('signupPassword2')?.value || '';

    if (pw !== pw2) {
      showMessage($('signupMsg'), '비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }

    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: $('signupName')?.value || '',
          email: $('signupEmail')?.value || '',
          password: pw,
          department: $('signupDepartment')?.value || '',
        }),
      });

      showMessage($('signupMsg'), '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.', 'success');
      switchAuthTab('login');
    } catch (err) {
      showMessage($('signupMsg'), err.message, 'error');
    }
  },

  async logout() {
    await api('/api/auth/logout', { method: 'POST' });
    location.reload();
  },

  async checkMe() {
    try {
      QMS.state.user = await api('/api/auth/me');
      await QMS.app.onLoggedIn();
    } catch (_err) {
      QMS.app.onLoggedOut();
    }
  },

  async resetPassword() {
    const { $, showMessage, clearMessage } = QMS.utils;
    clearMessage($('resetMsg'));

    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          name: $('resetName')?.value || '',
          email: $('resetEmail')?.value || '',
          department: $('resetDepartment')?.value || '',
          newPassword: $('resetNewPassword')?.value || '',
        }),
      });

      showMessage($('resetMsg'), '비밀번호가 초기화되었습니다.', 'success');
    } catch (err) {
      showMessage($('resetMsg'), err.message, 'error');
    }
  },

  async changePassword() {
    const { $, showMessage, clearMessage } = QMS.utils;
    clearMessage($('pwMsg'));

    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: $('pwCurrent')?.value || '',
          newPassword: $('pwNew')?.value || '',
        }),
      });

      showMessage($('pwMsg'), '비밀번호가 변경되었습니다.', 'success');
    } catch (err) {
      showMessage($('pwMsg'), err.message, 'error');
    }
  },
};

window.QMS.admin = {
  async loadUsers() {
    QMS.state.users = await api('/api/admin/users');
    this.renderUsers();
  },

  renderUsers() {
    const tbody = QMS.utils.$('usersTable');
    if (!tbody) return;

    const rows = QMS.state.users || [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">데이터가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((u) => `
      <tr>
        <td>${u.name || ''}</td>
        <td>${u.email || ''}</td>
        <td>${u.department || ''}</td>
        <td>${u.title || ''}</td>
        <td>${u.role || ''}</td>
        <td>
          <span class="status-badge ${
            u.status === 'APPROVED'
              ? 'status-approved'
              : u.status === 'REJECTED'
                ? 'status-rejected'
                : 'status-pending'
          }">${u.status || ''}</span>
        </td>
        <td>${String(u.created_at || '').slice(0, 10)}</td>
        <td>
          <div class="inline-actions">
            <button class="btn btn-light btn-sm" onclick="QMS.admin.approve('${u.id}')">승인</button>
            <button class="btn btn-light btn-sm" onclick="QMS.admin.reject('${u.id}')">반려</button>
            <button class="btn btn-danger btn-sm" onclick="QMS.admin.remove('${u.id}')">삭제</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  async approve(id) {
    await api(`/api/admin/users/${id}/approve`, { method: 'POST' });
    await this.loadUsers();
  },

  async reject(id) {
    await api(`/api/admin/users/${id}/reject`, { method: 'POST' });
    await this.loadUsers();
  },

  async remove(id) {
    if (!confirm('회원 삭제하시겠습니까?')) return;
    await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    await this.loadUsers();
  },

  async deleteAll() {
    if (QMS.state.user?.role !== 'admin') {
      alert('관리자만 가능합니다.');
      return;
    }

    const confirmText = prompt('전체 삭제를 실행하려면 DELETE 를 입력하세요.');
    if (confirmText !== 'DELETE') return;

    await api('/api/admin/delete-all', {
      method: 'POST',
      body: JSON.stringify({ confirm: 'DELETE' }),
    });

    await QMS.app.loadAll();
    alert('전체 데이터 삭제 완료');
  },
};

window.QMS.common = {
  renderUserChip() {
    const chip = QMS.utils.$('currentUserChip');
    if (!chip || !QMS.state.user) return;

    chip.textContent = `${QMS.state.user.name || ''} · ${QMS.state.user.role || ''}`;

    QMS.utils.$all('.admin-only').forEach((el) => {
      el.classList.toggle('hidden', QMS.state.user.role !== 'admin');
    });
  },

  bindGlobalEvents() {
    const { $, $all, switchAuthTab, switchMainTab, openModal, closeModal, updateRangeLabel } = QMS.utils;

    if ($('loginTabBtn')) $('loginTabBtn').onclick = () => switchAuthTab('login');
    if ($('signupTabBtn')) $('signupTabBtn').onclick = () => switchAuthTab('signup');

    if ($('loginBtn')) $('loginBtn').onclick = () => QMS.auth.login();
    if ($('signupBtn')) $('signupBtn').onclick = () => QMS.auth.signup();
    if ($('logoutBtn')) $('logoutBtn').onclick = () => QMS.auth.logout();

    if ($('openResetBtn')) $('openResetBtn').onclick = () => openModal('resetModal');
    if ($('openPasswordBtn')) $('openPasswordBtn').onclick = () => openModal('passwordModal');

    if ($('resetPasswordBtn')) $('resetPasswordBtn').onclick = () => QMS.auth.resetPassword();
    if ($('changePasswordBtn')) $('changePasswordBtn').onclick = () => QMS.auth.changePassword();

    $all('[data-close]').forEach((btn) => {
      btn.onclick = () => closeModal(btn.dataset.close);
    });

    $all('.main-tab').forEach((btn) => {
      btn.onclick = () => switchMainTab(btn.dataset.tab);
    });

    if ($('filterYear')) $('filterYear').onchange = updateRangeLabel.bind(QMS.utils);
    if ($('filterMonth')) $('filterMonth').onchange = updateRangeLabel.bind(QMS.utils);
    if ($('filterDay')) $('filterDay').onchange = updateRangeLabel.bind(QMS.utils);

    if ($('searchBtn')) {
      $('searchBtn').onclick = () => {
        updateRangeLabel.call(QMS.utils);
        QMS.app.renderAll();
      };
    }

    if ($('rangeRefreshBtn')) {
      $('rangeRefreshBtn').onclick = () => {
        updateRangeLabel.call(QMS.utils);
        QMS.app.renderAll();
      };
    }

    if ($('monthQuickBtn')) {
      $('monthQuickBtn').onclick = () => {
        const now = new Date();
        const y = $('filterYear');
        const m = $('filterMonth');
        const d = $('filterDay');
        if (y) y.value = String(now.getFullYear());
        if (m) m.value = String(now.getMonth() + 1).padStart(2, '0');
        if (d) d.value = '';
        updateRangeLabel.call(QMS.utils);
        QMS.app.renderAll();
      };
    }

    if ($('testDbBtn')) {
      $('testDbBtn').onclick = async () => {
        try {
          const data = await api('/api/test-db');
          console.log(data);
          alert('DB 연결 성공');
        } catch (err) {
          alert(`DB 연결 실패: ${err.message}`);
        }
      };
    }

    if ($('backupBtn')) {
      $('backupBtn').onclick = () => {
        window.location.href = '/api/backup';
      };
    }

    if ($('syncBtn')) {
      $('syncBtn').onclick = () => QMS.app.loadAll();
    }

    if ($('deleteAllBtn')) {
      $('deleteAllBtn').onclick = () => QMS.admin.deleteAll();
    }

    if ($('usersRefreshBtn')) {
      $('usersRefreshBtn').onclick = () => QMS.admin.loadUsers();
    }
  },
};

window.QMS.app = {
  async loadAll() {
    const jobs = [];

    if (QMS.iqc?.list) jobs.push(QMS.iqc.list());
    if (QMS.pqc?.list) jobs.push(QMS.pqc.list());
    if (QMS.oqc?.list) jobs.push(QMS.oqc.list());
    if (QMS.suppliers?.list) jobs.push(QMS.suppliers.list());
    if (QMS.nonconform?.list) jobs.push(QMS.nonconform.list());
    if (QMS.worklog?.list) jobs.push(QMS.worklog.list());

    await Promise.all(jobs);

    if (QMS.state.user?.role === 'admin') {
      await QMS.admin.loadUsers();
    }

    this.renderAll();
  },

  renderAll() {
    if (QMS.dashboard?.renderCounts) {
      QMS.dashboard.renderCounts(QMS.state);
    }

    if (QMS.iqc?.render) QMS.iqc.render();
    if (QMS.pqc?.render) QMS.pqc.render();
    if (QMS.oqc?.render) QMS.oqc.render();
    if (QMS.suppliers?.render) QMS.suppliers.render();
    if (QMS.nonconform?.render) QMS.nonconform.render();
    if (QMS.worklog?.render) QMS.worklog.render();
  },

  async onLoggedIn() {
    const authPage = QMS.utils.$('authPage');
    const dashboardPage = QMS.utils.$('dashboardPage');

    if (authPage) authPage.classList.add('hidden');
    if (dashboardPage) dashboardPage.classList.remove('hidden');

    QMS.common.renderUserChip();
    QMS.utils.switchMainTab('dashboard');

    await this.loadAll();
  },

  onLoggedOut() {
    const authPage = QMS.utils.$('authPage');
    const dashboardPage = QMS.utils.$('dashboardPage');

    if (authPage) authPage.classList.remove('hidden');
    if (dashboardPage) dashboardPage.classList.add('hidden');
  },

  boot() {
    QMS.utils.initFilters();
    QMS.utils.setDefaultDates();
    QMS.common.bindGlobalEvents();
    QMS.utils.switchAuthTab('login');
    QMS.auth.checkMe();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  QMS.app.boot();
});
