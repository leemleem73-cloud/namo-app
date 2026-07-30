const state = {
  config: { serverUrl: 'http://localhost:3000', autoStart: true },
  page: 'home',
  organization: [],
  events: [],
  attendance: [],
  fieldworks: [],
  leaves: [],
  messages: [],
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pageNames = {
  home: '홈', chat: '채팅', organization: '조직도', calendar: '일정',
  attendance: '출퇴근', fieldwork: '외근', leave: '연차·반차', settings: '설정',
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function toast(message, type = 'normal') {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.className = 'toast'; }, 2600);
}

function baseUrl() {
  return String(state.config.serverUrl || 'http://localhost:3000').replace(/\/$/, '');
}

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let payload;
  try { payload = await response.json(); }
  catch (_) { payload = { success: false, message: `서버 응답 오류 (${response.status})` }; }
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || `요청 실패 (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

function setConnection(ok, message) {
  const badge = $('#connectionBadge');
  badge.textContent = message;
  badge.classList.toggle('online', ok);
  badge.classList.toggle('offline', !ok);
}

function showPage(name) {
  state.page = name;
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.page === name));
  $$('.page').forEach((page) => page.classList.toggle('active', page.id === `page-${name}`));
  $('#pageTitle').textContent = pageNames[name] || name;
  if (name === 'organization') loadOrganization();
  if (name === 'calendar') loadCalendar();
  if (name === 'attendance') loadAttendance();
  if (name === 'fieldwork') loadFieldworks();
  if (name === 'leave') loadLeaves();
  if (name === 'chat') loadMessages();
}

async function checkServer() {
  try {
    await api('/api/namo-groupware/organization');
    setConnection(true, '서버 연결됨');
    return true;
  } catch (error) {
    if (error.status === 401) setConnection(false, 'QMES 로그인 필요');
    else setConnection(false, '서버 연결 안 됨');
    return false;
  }
}

async function loadOrganization() {
  const target = $('#organizationTree');
  target.innerHTML = '<div class="empty">조직도를 불러오는 중입니다.</div>';
  try {
    state.organization = await api('/api/namo-groupware/organization');
    target.innerHTML = state.organization.length ? state.organization.map((dept) => `
      <section class="dept-card">
        <h4>${escapeHtml(dept.name)} <span>${dept.members.length}명</span></h4>
        ${dept.members.map((member) => `
          <div class="member-row">
            <span class="avatar">${escapeHtml(member.name.slice(0, 1))}</span>
            <span><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.title || '직급 미지정')}</small></span>
            <span class="member-email">${escapeHtml(member.email || '')}</span>
          </div>`).join('')}
      </section>`).join('') : '<div class="empty">등록된 직원이 없습니다.</div>';
    setConnection(true, '서버 연결됨');
  } catch (error) {
    target.innerHTML = `<div class="empty error-text">${escapeHtml(error.message)}</div>`;
    setConnection(false, error.status === 401 ? 'QMES 로그인 필요' : '서버 연결 안 됨');
  }
}

async function loadCalendar() {
  const target = $('#calendarList');
  try {
    state.events = await api('/api/namo-groupware/calendar');
    target.innerHTML = state.events.length ? state.events.map((event) => `
      <div class="list-row">
        <div><strong>${escapeHtml(event.title)}</strong><small>${formatDateTime(event.start)} · ${escapeHtml(event.scope)}</small><small>${escapeHtml(event.location || '')}</small></div>
        <button class="icon-button delete-event" data-id="${event.id}">삭제</button>
      </div>`).join('') : '<div class="empty">등록된 일정이 없습니다.</div>';
    renderHome();
  } catch (error) { target.innerHTML = `<div class="empty error-text">${escapeHtml(error.message)}</div>`; }
}

async function createCalendar(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const scopeMap = { personal: '개인', department: '부서', company: '전사' };
  await api('/api/namo-groupware/calendar', {
    method: 'POST', body: JSON.stringify({
      title: form.get('title'), start: new Date(form.get('startAt')).toISOString(),
      end: new Date(form.get('endAt')).toISOString(), scope: scopeMap[form.get('scope')] || '개인',
      location: form.get('location'), description: form.get('description'), allDay: false,
    }),
  });
  event.currentTarget.reset();
  toast('일정이 등록되었습니다.', 'success');
  await loadCalendar();
}

async function deleteCalendar(id) {
  await api(`/api/namo-groupware/calendar/${encodeURIComponent(id)}`, { method: 'DELETE' });
  toast('일정이 삭제되었습니다.');
  await loadCalendar();
}

function renderAttendance() {
  const today = state.attendance.find((item) => item.date === todayKey());
  $('#attendanceStatus').textContent = !today ? '미출근' : today.clockOut ? '퇴근완료' : '근무중';
  $('#clockInTime').textContent = today?.clockIn || '-';
  $('#clockOutTime').textContent = today?.clockOut || '-';
  $('#attendanceList').innerHTML = state.attendance.length ? state.attendance.slice(0, 20).map((item) => `
    <div class="list-row"><div><strong>${escapeHtml(item.date)} · ${escapeHtml(item.name)}</strong><small>${escapeHtml(item.dept)} ${escapeHtml(item.position)}</small></div><span class="record-time">${escapeHtml(item.clockIn || '-')} → ${escapeHtml(item.clockOut || '-')}</span></div>
  `).join('') : '<div class="empty">기록이 없습니다.</div>';
}

async function loadAttendance() {
  try { state.attendance = await api('/api/namo-work/attendance'); renderAttendance(); }
  catch (error) { $('#attendanceList').innerHTML = `<div class="empty error-text">${escapeHtml(error.message)}</div>`; }
}

async function attendanceAction(action) {
  try {
    await api(`/api/namo-work/attendance/${action}`, { method: 'POST', body: '{}' });
    toast(action === 'clock-in' ? '출근 처리되었습니다.' : '퇴근 처리되었습니다.', 'success');
    await loadAttendance();
  } catch (error) { toast(error.message, 'error'); }
}

async function loadFieldworks() {
  try {
    state.fieldworks = await api('/api/namo-work/fieldworks');
    $('#fieldworkList').innerHTML = state.fieldworks.length ? state.fieldworks.map((item) => `
      <div class="list-row"><div><strong>${escapeHtml(item.place)}</strong><small>${escapeHtml(item.date)} · ${escapeHtml(item.purpose)}</small><small>${escapeHtml(item.startTime)} ${item.returnTime ? `→ ${escapeHtml(item.returnTime)}` : ''}</small></div>${item.status === '외근중' ? `<button class="small return-fieldwork" data-id="${item.id}">복귀</button>` : `<span class="status-pill">${escapeHtml(item.status)}</span>`}</div>
    `).join('') : '<div class="empty">외근 내역이 없습니다.</div>';
  } catch (error) { $('#fieldworkList').innerHTML = `<div class="empty error-text">${escapeHtml(error.message)}</div>`; }
}

async function createFieldwork(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await api('/api/namo-work/fieldworks', { method: 'POST', body: JSON.stringify({ place: form.get('destination'), purpose: form.get('purpose') }) });
    event.currentTarget.reset(); toast('외근을 시작했습니다.', 'success'); await loadFieldworks();
  } catch (error) { toast(error.message, 'error'); }
}

async function returnFieldwork(id) {
  try { await api(`/api/namo-work/fieldworks/${encodeURIComponent(id)}/return`, { method: 'POST', body: '{}' }); toast('외근 복귀 처리되었습니다.', 'success'); await loadFieldworks(); }
  catch (error) { toast(error.message, 'error'); }
}

function renderLeaves() {
  $('#leaveList').innerHTML = state.leaves.length ? state.leaves.map((item) => `
    <div class="list-row"><div><strong>${escapeHtml(item.type)} · ${escapeHtml(item.date)}</strong><small>${escapeHtml(item.name)} / ${escapeHtml(item.reason)}</small><small>${escapeHtml(item.documentNo)}</small></div><span class="status-pill status-${item.status === '승인완료' ? 'approved' : item.status === '반려' ? 'rejected' : 'pending'}">${escapeHtml(item.status)}</span></div>
  `).join('') : '<div class="empty">휴가 신청 내역이 없습니다.</div>';
  $('#pendingLeaveCount').textContent = `${state.leaves.filter((item) => item.status === '검토대기').length}건`;
  $('#approvedLeaveCount').textContent = `${state.leaves.filter((item) => item.status === '승인완료').length}건`;
}

async function loadLeaves() {
  try { state.leaves = await api('/api/namo-work/leaves'); renderLeaves(); }
  catch (error) { $('#leaveList').innerHTML = `<div class="empty error-text">${escapeHtml(error.message)}</div>`; }
}

async function createLeave(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await api('/api/namo-work/leaves', { method: 'POST', body: JSON.stringify({ type: form.get('leaveType'), date: form.get('leaveDate'), reason: form.get('reason') }) });
    event.currentTarget.reset(); toast('휴가 신청이 등록되었습니다.', 'success'); await loadLeaves();
  } catch (error) { toast(error.message, 'error'); }
}

async function loadMessages() {
  try {
    state.messages = await api('/api/namo-talk/messages?roomId=department-quality');
    $('#messages').innerHTML = state.messages.length ? state.messages.map((message) => `<div class="message"><strong>${escapeHtml(message.sender)}</strong><p>${escapeHtml(message.text)}</p><small>${escapeHtml(message.time)}</small></div>`).join('') : '<div class="message system">NAMO Talk 대화가 시작되었습니다.</div>';
    $('#messages').scrollTop = $('#messages').scrollHeight;
  } catch (error) { $('#messages').innerHTML = `<div class="message system error-text">${escapeHtml(error.message)}</div>`; }
}

async function sendMessage(event) {
  event.preventDefault();
  const input = $('#messageInput');
  const text = input.value.trim();
  if (!text) return;
  try {
    await api('/api/namo-talk/messages', { method: 'POST', body: JSON.stringify({ roomId: 'department-quality', kind: 'text', text }) });
    input.value = ''; await loadMessages();
  } catch (error) { toast(error.message, 'error'); }
}

function renderHome() {
  const todays = state.events.filter((event) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(event.start)) === todayKey());
  $('#todayEvents').innerHTML = todays.length ? todays.map((event) => `<div class="home-event"><strong>${escapeHtml(event.title)}</strong><span>${formatDateTime(event.start)}</span></div>`).join('') : '등록된 일정이 없습니다.';
}

function printLeaves() {
  const rows = state.leaves.map((item) => `<tr><td>${escapeHtml(item.documentNo)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.date)}</td><td>${escapeHtml(item.reason)}</td><td>${escapeHtml(item.status)}</td></tr>`).join('');
  const popup = window.open('', '_blank', 'width=1000,height=760');
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>휴가 신청 현황</title><style>body{font-family:Arial,sans-serif;padding:32px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:8px;font-size:12px}@media print{button{display:none}}</style></head><body><h1>휴가 신청 현황</h1><p>출력일: ${new Date().toLocaleString('ko-KR')}</p><table><thead><tr><th>문서번호</th><th>신청자</th><th>구분</th><th>사용일</th><th>사유</th><th>상태</th></tr></thead><tbody>${rows}</tbody></table><button onclick="window.print()">PDF로 인쇄</button></body></html>`);
  popup.document.close();
}

async function saveSettings(event) {
  event.preventDefault();
  state.config = await window.namoDesktop.setConfig({ serverUrl: $('#serverUrl').value.trim(), autoStart: $('#autoStart').checked });
  toast('설정이 저장되었습니다.', 'success');
  await checkServer();
}

function bindEvents() {
  $('#mainNav').addEventListener('click', (event) => { const button = event.target.closest('[data-page]'); if (button) showPage(button.dataset.page); });
  document.addEventListener('click', (event) => {
    const go = event.target.closest('[data-go]'); if (go) showPage(go.dataset.go);
    const del = event.target.closest('.delete-event'); if (del) deleteCalendar(del.dataset.id).catch((error) => toast(error.message, 'error'));
    const back = event.target.closest('.return-fieldwork'); if (back) returnFieldwork(back.dataset.id);
  });
  $('#hideBtn').addEventListener('click', () => window.namoDesktop.hideWindow());
  $('#refreshOrg').addEventListener('click', loadOrganization);
  $('#refreshCalendar').addEventListener('click', loadCalendar);
  $('#calendarForm').addEventListener('submit', (event) => createCalendar(event).catch((error) => toast(error.message, 'error')));
  $('#clockInBtn').addEventListener('click', () => attendanceAction('clock-in'));
  $('#clockOutBtn').addEventListener('click', () => attendanceAction('clock-out'));
  $('#fieldworkForm').addEventListener('submit', createFieldwork);
  $('#leaveForm').addEventListener('submit', createLeave);
  $('#messageForm').addEventListener('submit', sendMessage);
  $('#printLeaveBtn').addEventListener('click', printLeaves);
  $('#settingsForm').addEventListener('submit', saveSettings);
}

async function init() {
  state.config = await window.namoDesktop.getConfig();
  $('#serverUrl').value = state.config.serverUrl || 'http://localhost:3000';
  $('#autoStart').checked = state.config.autoStart !== false;
  $('#todayText').textContent = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const updateClock = () => { $('#liveClock').textContent = new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }); };
  updateClock(); setInterval(updateClock, 1000);
  bindEvents();
  const connected = await checkServer();
  if (connected) await Promise.allSettled([loadCalendar(), loadAttendance(), loadLeaves()]);
  renderHome();
}

document.addEventListener('DOMContentLoaded', init);
