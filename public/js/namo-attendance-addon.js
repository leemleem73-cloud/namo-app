/* NAMO Talk attendance add-on: clock-in/out, admin filters, Excel-compatible CSV export */
(function () {
  const STORAGE_KEY = 'qmes-namo-attendance-v1';
  let panelOpen = false;

  const pad = (n) => String(n).padStart(2, '0');
  const dateText = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeText = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveRecords(rows) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); }
  function users() {
    try { return typeof loadUsers === 'function' ? loadUsers() : []; }
    catch (e) { return []; }
  }
  function currentUser() {
    const base = window.__QMES_CURRENT_USER__ || { name: '관리자', dept: '관리부', role: 'admin', uid: 'U-0001' };
    const found = users().find((u) => u.name === base.name || u.id === base.id);
    return { ...base, ...(found || {}) };
  }
  function mins(t) {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
  function workHours(row) {
    if (!row.clockIn || !row.clockOut) return '-';
    const v = Math.max(0, mins(row.clockOut) - mins(row.clockIn));
    return `${Math.floor(v / 60)}시간 ${v % 60}분`;
  }
  function attendanceStatus(row) {
    if (!row.clockIn) return '미출근';
    if (mins(row.clockIn) > 9 * 60) return '지각';
    if (row.clockOut && mins(row.clockOut) < 18 * 60) return '조퇴';
    return '정상';
  }
  function gpsText(pos) {
    if (!pos) return '미확인';
    return `${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`;
  }
  function getGps() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
      );
    });
  }
  function escapeCsv(v) {
    const s = String(v == null ? '' : v).replace(/"/g, '""');
    return `"${s}"`;
  }
  function downloadCsv(rows) {
    const header = ['날짜','사번','이름','부서','직급','출근시간','퇴근시간','총 근무시간','근태상태','근무상태','출근 위치','퇴근 위치','비고'];
    const lines = [header, ...rows.map((r) => [
      r.date, r.uid || '', r.name, r.dept || '', r.position || '', r.clockIn || '', r.clockOut || '', workHours(r), attendanceStatus(r), r.workStatus || '근무', gpsText(r.clockInGps), gpsText(r.clockOutGps), r.note || ''
    ])].map((row) => row.map(escapeCsv).join(','));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NAMO_근태관리_${dateText()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function style(el, css) { Object.assign(el.style, css); return el; }
  function make(tag, text, css) {
    const el = document.createElement(tag);
    if (text != null) el.textContent = text;
    if (css) style(el, css);
    return el;
  }

  function renderPanel(section) {
    section.querySelector('#namo-attendance-panel')?.remove();
    if (!panelOpen) return;

    const me = currentUser();
    const admin = me.role === 'admin';
    const records = loadRecords();
    const today = dateText();
    const mineToday = records.find((r) => r.date === today && r.name === me.name);

    const panel = make('div', null, {
      position: 'absolute', inset: '58px 0 0 0', zIndex: '20', background: '#f8fafc', color: '#172033', display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard','Noto Sans KR',sans-serif"
    });
    panel.id = 'namo-attendance-panel';

    const head = make('div', null, { padding: '14px', background: '#fff', borderBottom: '1px solid #dbe3ea' });
    const title = make('div', '근태관리', { fontSize: '17px', fontWeight: '900' });
    const sub = make('div', `${me.name} · ${me.dept || '부서 미지정'}`, { fontSize: '11px', color: '#64748b', marginTop: '3px' });
    head.append(title, sub);

    const action = make('div', null, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' });
    const inBtn = make('button', mineToday?.clockIn ? `출근 ${mineToday.clockIn}` : '출근하기', {
      border: '0', borderRadius: '10px', padding: '11px', background: mineToday?.clockIn ? '#d1fae5' : '#059669', color: mineToday?.clockIn ? '#065f46' : '#fff', fontWeight: '900', cursor: mineToday?.clockIn ? 'default' : 'pointer'
    });
    const outBtn = make('button', mineToday?.clockOut ? `퇴근 ${mineToday.clockOut}` : '퇴근하기', {
      border: '0', borderRadius: '10px', padding: '11px', background: mineToday?.clockOut ? '#fee2e2' : '#dc2626', color: mineToday?.clockOut ? '#991b1b' : '#fff', fontWeight: '900', cursor: (!mineToday?.clockIn || mineToday?.clockOut) ? 'default' : 'pointer'
    });
    inBtn.disabled = !!mineToday?.clockIn;
    outBtn.disabled = !mineToday?.clockIn || !!mineToday?.clockOut;
    inBtn.onclick = async () => {
      const gps = await getGps();
      const rows = loadRecords();
      const u = currentUser();
      rows.push({ date: today, uid: u.uid || '', name: u.name, dept: u.dept || '', position: u.position || '', clockIn: timeText(), clockOut: '', clockInGps: gps, clockOutGps: null, workStatus: '근무', note: '' });
      saveRecords(rows); renderPanel(section);
    };
    outBtn.onclick = async () => {
      const gps = await getGps();
      const rows = loadRecords();
      const idx = rows.findIndex((r) => r.date === today && r.name === me.name);
      if (idx >= 0) rows[idx] = { ...rows[idx], clockOut: timeText(), clockOutGps: gps };
      saveRecords(rows); renderPanel(section);
    };
    action.append(inBtn, outBtn);
    head.append(action);
    panel.append(head);

    const body = make('div', null, { flex: '1', overflow: 'auto', padding: '12px' });
    if (!admin) {
      const own = records.filter((r) => r.name === me.name).sort((a,b) => b.date.localeCompare(a.date));
      body.append(make('div', `내 근태기록 ${own.length}건`, { fontSize: '13px', fontWeight: '900', marginBottom: '8px' }));
      body.append(buildTable(own));
      panel.append(body); section.append(panel); return;
    }

    const first = `${today.slice(0,7)}-01`;
    const filters = make('div', null, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '9px' });
    const start = document.createElement('input'); start.type='date'; start.value=first;
    const end = document.createElement('input'); end.type='date'; end.value=today;
    [start,end].forEach((el)=>style(el,{height:'34px',border:'1px solid #cbd5e1',borderRadius:'8px',padding:'0 7px',fontSize:'11px'}));
    filters.append(start,end);

    const filters2 = make('div', null, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '10px' });
    const dept = document.createElement('select');
    const person = document.createElement('select');
    [dept,person].forEach((el)=>style(el,{height:'34px',border:'1px solid #cbd5e1',borderRadius:'8px',padding:'0 7px',fontSize:'11px',background:'#fff'}));
    dept.innerHTML = '<option value="">전체 부서</option>' + [...new Set(users().map(u=>u.dept).filter(Boolean))].map(d=>`<option>${d}</option>`).join('');
    person.innerHTML = '<option value="">전체 직원</option>' + users().map(u=>`<option>${u.name}</option>`).join('');
    filters2.append(dept,person);

    const toolbar = make('div', null, { display: 'flex', gap: '7px', marginBottom: '10px' });
    const count = make('div', '', { flex: '1', fontSize: '11px', color: '#64748b', alignSelf: 'center' });
    const exportBtn = make('button', '엑셀 다운로드', { border:'1px solid #d4a017', borderRadius:'8px', padding:'8px 10px', background:'#fff8dc', color:'#7c5c00', fontSize:'11px', fontWeight:'900', cursor:'pointer', whiteSpace:'nowrap' });
    toolbar.append(count, exportBtn);

    const tableWrap = make('div');
    const refresh = () => {
      const filtered = loadRecords().filter((r) => (!start.value || r.date >= start.value) && (!end.value || r.date <= end.value) && (!dept.value || r.dept === dept.value) && (!person.value || r.name === person.value)).sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name,'ko'));
      count.textContent = `조회 ${filtered.length}건 · 등록 직원 ${users().length}명`;
      tableWrap.innerHTML = '';
      tableWrap.append(buildTable(filtered));
      exportBtn.onclick = () => downloadCsv(filtered);
    };
    [start,end,dept,person].forEach((el)=>el.onchange=refresh);
    refresh();

    body.append(filters, filters2, toolbar, tableWrap);
    panel.append(body);
    section.append(panel);
  }

  function buildTable(rows) {
    const wrap = make('div', null, { overflowX: 'auto', background:'#fff', border:'1px solid #dbe3ea', borderRadius:'10px' });
    const table = make('table', null, { width:'100%', borderCollapse:'collapse', minWidth:'680px', fontSize:'10px' });
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    ['날짜','이름','부서','출근','퇴근','근무시간','상태','위치'].forEach((h)=>{ const th=make('th',h,{padding:'8px',textAlign:'left',background:'#f1f5f9',borderBottom:'1px solid #dbe3ea',whiteSpace:'nowrap'}); trh.append(th); });
    thead.append(trh); table.append(thead);
    const tbody=document.createElement('tbody');
    if (!rows.length) {
      const tr=document.createElement('tr'); const td=make('td','근태 기록이 없습니다.',{padding:'18px',textAlign:'center',color:'#94a3b8'}); td.colSpan=8; tr.append(td); tbody.append(tr);
    } else rows.forEach((r)=>{
      const tr=document.createElement('tr');
      [r.date,r.name,r.dept||'-',r.clockIn||'-',r.clockOut||'-',workHours(r),attendanceStatus(r),r.clockInGps?'GPS 확인':'미확인'].forEach((v)=>tr.append(make('td',v,{padding:'8px',borderBottom:'1px solid #eef2f6',whiteSpace:'nowrap'})));
      tbody.append(tr);
    });
    table.append(tbody); wrap.append(table); return wrap;
  }

  function install(section) {
    if (section.dataset.attendanceInstalled === '1') return;
    section.dataset.attendanceInstalled = '1';
    section.style.borderLeft = '2px solid #d4a017';
    section.style.borderTop = '2px solid #d4a017';
    const header = section.querySelector('header');
    if (!header) return;
    const btn = make('button', '근태', { height:'30px', padding:'0 10px', border:'1px solid rgba(255,215,0,.65)', borderRadius:'8px', background:'rgba(212,160,23,.15)', color:'#ffe69a', fontSize:'11px', fontWeight:'900', cursor:'pointer', marginRight:'6px', whiteSpace:'nowrap' });
    btn.type='button';
    btn.onclick=()=>{ panelOpen=!panelOpen; renderPanel(section); };
    const close = header.querySelector('button[aria-label="닫기"]');
    header.insertBefore(btn, close || null);
  }

  const observer = new MutationObserver(() => {
    const section = document.querySelector('section[aria-label="NAMO Talk"]');
    if (section) install(section);
    else panelOpen = false;
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
  const initial = document.querySelector('section[aria-label="NAMO Talk"]');
  if (initial) install(initial);
})();