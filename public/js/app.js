import { api } from './api.js';
import { renderDashboardSummary, drawDashboardChart } from './dashboard.js';
import { buildIqcPayload, renderIqcRows } from './iqc.js';
import { buildPqcPayload, renderPqcRows } from './pqc.js';
import { buildOqcPayload, renderOqcRows } from './oqc.js';
import { buildSupplierPayload } from './suppliers.js';
import { buildWorklogPayload } from './worklog.js';
import { searchTraceRows } from './trace.js';

const state = {
  user: null,
  iqc: [],
  pqc: [],
  oqc: [],
  suppliers: [],
  worklog: [],
  nonconform: []
};

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

function formatClock(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}년 ${mm}월 ${dd}일 ${hh}:${mi}:${ss} (${WEEK[date.getDay()]})`;
}

function showTab(tab) {
  document.querySelectorAll('.tab-panel').forEach((el) => {
    el.classList.toggle('hidden', el.dataset.tab !== tab);
  });

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  if (tab === 'dashboard') {
    renderDashboardArea();
  }
}

window.showTab = showTab;

function topbarHtml() {
  const initial = (state.user?.name || 'A').trim().charAt(0) || 'A';
  return `
    <header class="topbar">
      <div class="brand">
        <img src="/logo.png" alt="나모케미칼 로고" />
        <div>
          <div class="brand-title">QMS 품질관리시스템</div>
          <div class="brand-sub">NAMO Chemical Co., Ltd.</div>
        </div>
      </div>

      <div class="topbar-center">
        <label class="search-box">
          <span>🔍</span>
          <input placeholder="검색어를 입력하세요..." />
        </label>
      </div>

      <div class="topbar-right">
        <div class="clock-chip" id="clockText">${formatClock()}</div>
        <div class="icon-btn">🔔</div>
        <div class="user-chip" onclick="logout()">
          <div class="avatar">${initial}</div>
          <div class="user-meta">
            <strong>${state.user?.name || '관리자'}</strong>
            <span>${state.user?.role || 'user'}</span>
          </div>
        </div>
      </div>
    </header>
  `;
}

function sidebarHtml() {
  return `
    <aside class="sidebar">
      <div class="sidebar-card">
        <button class="nav-btn active" data-tab="dashboard" onclick="showTab('dashboard')"><span class="nav-icon">🏠</span>대시보드</button>
        <button class="nav-btn" data-tab="iqc" onclick="showTab('iqc')"><span class="nav-icon">📋</span>수입검사 (IQC)</button>
        <button class="nav-btn" data-tab="pqc" onclick="showTab('pqc')"><span class="nav-icon">🧪</span>공정검사 (PQC)</button>
        <button class="nav-btn" data-tab="oqc" onclick="showTab('oqc')"><span class="nav-icon">📦</span>출하검사 (OQC)</button>
        <button class="nav-btn" data-tab="suppliers" onclick="showTab('suppliers')"><span class="nav-icon">🏢</span>협력업체 관리</button>
        <button class="nav-btn" data-tab="worklog" onclick="showTab('worklog')"><span class="nav-icon">📝</span>생산작업일지</button>
        <button class="nav-btn" data-tab="trace" onclick="showTab('trace')"><span class="nav-icon">🔎</span>추적성 조회</button>
        <button class="nav-btn" data-tab="nonconform" onclick="showTab('nonconform')"><span class="nav-icon">⚠️</span>부적합관리</button>
      </div>
    </aside>
  `;
}

function dashboardHtml() {
  return `
    <section class="tab-panel" data-tab="dashboard">
      <div class="page-head">
        <div class="page-title">
          <h1>대시보드</h1>
          <p>실시간 품질 현황을 한눈에 확인하세요.</p>
        </div>
        <div class="page-actions">
          <select class="select-mini">
            <option>2026년</option>
          </select>
          <button class="btn btn-primary" onclick="renderDashboardArea()">조회</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="card kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon kpi-blue">📋</div>
            <div style="flex:1">
              <div class="kpi-label">수입검사(IQC)</div>
              <div class="kpi-value" id="iqcCnt">0</div>
              <div class="kpi-meta"><span>이번 달</span><span class="kpi-up">+12.5%</span></div>
            </div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon kpi-purple">🧪</div>
            <div style="flex:1">
              <div class="kpi-label">공정검사(PQC)</div>
              <div class="kpi-value" id="pqcCnt">0</div>
              <div class="kpi-meta"><span>이번 달</span><span class="kpi-up">+8.3%</span></div>
            </div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon kpi-orange">📦</div>
            <div style="flex:1">
              <div class="kpi-label">출하검사(OQC)</div>
              <div class="kpi-value" id="oqcCnt">0</div>
              <div class="kpi-meta"><span>이번 달</span><span class="kpi-up">+5.1%</span></div>
            </div>
          </div>
        </div>

        <div class="card side-stat">
          <h3>부적합 항목</h3>
          <div class="side-item"><span>미조치</span><span id="ncOpenCnt">0건</span></div>
          <div class="side-item"><span>재발</span><span>2건</span></div>
        </div>
      </div>

      <div class="layout-grid">
        <section class="card chart-card">
          <div class="card-head">
            <div>
              <h3>검사 현황 추이</h3>
              <div class="card-desc">IQC / PQC / OQC 추세</div>
            </div>
            <button class="btn btn-light">품질관리</button>
          </div>
          <div class="chart-area">
            <canvas id="chart"></canvas>
          </div>
        </section>

        <aside class="card notice-card">
          <div class="card-head">
            <div>
              <h3>공지사항</h3>
              <div class="card-desc">NOTICE</div>
            </div>
            <button class="btn btn-light">더보기</button>
          </div>
          <div class="notice-list">
            <div class="notice-item"><strong>QMS 시스템 정기 점검 안내</strong><span>2026-04-18</span></div>
            <div class="notice-item"><strong>검사 기준서 업데이트 (v2.3)</strong><span>2026-04-15</span></div>
            <div class="notice-item"><strong>신규 협력업체 등록 절차 안내</strong><span>2026-04-10</span></div>
            <div class="notice-item"><strong>6월 품질 교육 일정 안내</strong><span>2026-04-08</span></div>
            <div class="notice-item"><strong>데이터 백업 정책 변경 안내</strong><span>2026-04-05</span></div>
          </div>
        </aside>
      </div>

      <div class="tiles">
        <div class="tile tile-blue"><div class="tile-icon">📋</div><div class="tile-title">입고검사 (IQC)</div><div class="tile-desc">수입검사 내역과 기준 관리</div></div>
        <div class="tile tile-green"><div class="tile-icon">🧪</div><div class="tile-title">공정검사 (PQC)</div><div class="tile-desc">공정검사 내역과 기준 관리</div></div>
        <div class="tile tile-orange"><div class="tile-icon">📦</div><div class="tile-title">출하검사 (OQC)</div><div class="tile-desc">출하검사 내역과 기준 관리</div></div>
        <div class="tile tile-teal"><div class="tile-icon">🏢</div><div class="tile-title">협력업체</div><div class="tile-desc">협력업체 정보 및 평가 관리</div></div>
        <div class="tile tile-pink"><div class="tile-icon">📝</div><div class="tile-title">생산작업일지</div><div class="tile-desc">추적성 기록 및 조회 관리</div></div>
      </div>
    </section>
  `;
}

function iqcHtml() {
  return `
    <section class="tab-panel hidden" data-tab="iqc">
      <div class="page-head">
        <div class="page-title">
          <h1>입고검사 등록</h1>
          <p>수입검사 내역과 성적서를 동시에 관리합니다.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-light" onclick="resetIqcForm()">초기화</button>
          <button class="btn btn-primary" onclick="saveIqc()">저장</button>
        </div>
      </div>

      <div class="iqc-layout">
        <div>
          <section class="card form-card">
            <div class="form-grid">
              <div class="field"><label>일자</label><input id="iqcDate" type="date" /></div>
              <div class="field"><label>LOT</label><input id="iqcLot" /></div>
              <div class="field"><label>협력업체</label><input id="iqcSupplier" /></div>
              <div class="field"><label>품목</label><input id="iqcItem" /></div>
              <div class="field"><label>검사자</label><input id="iqcInspector" /></div>
              <div class="field"><label>입고수량</label><input id="iqcQty" type="number" /></div>
              <div class="field"><label>검사수량</label><input value="100" /></div>
              <div class="field"><label>불량수량</label><input id="iqcFail" type="number" /></div>
            </div>
          </section>

          <section class="card table-card" style="margin-top:16px;">
            <div class="card-head">
              <div>
                <h3>검사항목 및 판정</h3>
                <div class="card-desc">수입검사 기준 반영</div>
              </div>
            </div>

            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>검사 기준</th>
                    <th>측정값/확인</th>
                    <th>판정</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>외관</td>
                    <td>이물질, 파손 없을 것</td>
                    <td><span class="badge badge-ok">이상 없음</span></td>
                    <td><span class="badge badge-ok">합격</span></td>
                  </tr>
                  <tr>
                    <td>CoA</td>
                    <td>누락 없을 것</td>
                    <td><span class="badge badge-ok">첨부 확인</span></td>
                    <td><span class="badge badge-ok">합격</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="card table-card" style="margin-top:16px;">
            <div class="card-head">
              <div>
                <h3>입고검사 목록</h3>
                <div class="card-desc">최근 등록 데이터</div>
              </div>
              <div class="actions">
                <button class="btn btn-light" onclick="openIqcReport()">성적서 출력</button>
              </div>
            </div>
            <pre class="raw-box" id="iqcList"></pre>
          </section>
        </div>

        <aside class="card preview-card">
          <div class="actions" style="justify-content:flex-end; margin-bottom:12px;">
            <button class="btn btn-primary" onclick="openIqcReport()">PDF 다운로드</button>
            <button class="btn btn-light" onclick="openIqcReport()">인쇄</button>
          </div>

          <div class="preview-sheet">
            <div class="preview-head">
              <h2>입고검사 성적서 (IQC Report)</h2>
              <img src="/logo.png" alt="로고" />
            </div>

            <div class="preview-grid">
              <div class="preview-label">문서번호</div><div>IQC-2026-0001</div>
              <div class="preview-label">일자</div><div id="pvIqcDate">2026-04-20</div>
              <div class="preview-label">LOT</div><div id="pvIqcLot">111</div>
              <div class="preview-label">협력업체</div><div id="pvIqcSupplier">나노소재(주)</div>
              <div class="preview-label">품목</div><div id="pvIqcItem">Polymer A</div>
              <div class="preview-label">검사자</div><div id="pvIqcInspector">홍길동</div>
              <div class="preview-label">입고수량</div><div id="pvIqcQty">1000</div>
              <div class="preview-label">불량수량</div><div id="pvIqcFail">0</div>
            </div>

            <table class="preview-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>검사항목</th>
                  <th>검사 기준</th>
                  <th>측정값/확인</th>
                  <th>판정</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>외관</td>
                  <td>이물질, 파손 없을 것</td>
                  <td>이상 없음</td>
                  <td><span class="badge badge-ok">합격</span></td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>CoA</td>
                  <td>누락 없을 것</td>
                  <td>첨부 확인</td>
                  <td><span class="badge badge-ok">합격</span></td>
                </tr>
              </tbody>
            </table>

            <div class="final-box">
              <div style="font-weight:900; font-size:22px;">최종 판정</div>
              <div class="final-pass" id="pvIqcJudge">합격</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function simplePanel(tab, title, desc, bodyHtml) {
  return `
    <section class="tab-panel hidden" data-tab="${tab}">
      <div class="page-head">
        <div class="page-title">
          <h1>${title}</h1>
          <p>${desc}</p>
        </div>
      </div>
      ${bodyHtml}
    </section>
  `;
}

function appHtml() {
  return `
    <div class="qms-shell">
      ${topbarHtml()}
      ${sidebarHtml()}
      <main class="main">
        ${dashboardHtml()}
        ${iqcHtml()}
        ${simplePanel('pqc', '공정검사', '공정검사 등록 및 조회', `
          <section class="card form-card">
            <div class="form-grid">
              <div class="field"><label>일자</label><input id="pqcDate" type="date" /></div>
              <div class="field"><label>제품명</label><input id="pqcProduct" /></div>
              <div class="field"><label>LOT</label><input id="pqcLot" /></div>
              <div class="field"><label>외관</label><input id="pqcVisual" value="이상 없음" /></div>
              <div class="field"><label>점도</label><input id="pqcViscosity" /></div>
              <div class="field"><label>고형분</label><input id="pqcSolid" /></div>
              <div class="field"><label>입자</label><input id="pqcParticle" /></div>
              <div class="field"><label>판정</label><input id="pqcJudge" value="합격" /></div>
              <div class="field"><label>수량</label><input id="pqcQty" type="number" /></div>
              <div class="field"><label>불량수량</label><input id="pqcFail" type="number" /></div>
            </div>
            <div class="actions" style="margin-top:14px;">
              <button class="btn btn-primary" onclick="savePqc()">저장</button>
              <button class="btn btn-light" onclick="openPqcReport()">성적서 출력</button>
            </div>
          </section>
          <section class="card table-card" style="margin-top:16px;">
            <pre class="raw-box" id="pqcList"></pre>
          </section>
        `)}
        ${simplePanel('oqc', '출하검사', '출하검사 등록 및 조회', `
          <section class="card form-card">
            <div class="form-grid">
              <div class="field"><label>일자</label><input id="oqcDate" type="date" /></div>
              <div class="field"><label>고객사</label><input id="oqcCustomer" /></div>
              <div class="field"><label>제품명</label><input id="oqcProduct" /></div>
              <div class="field"><label>LOT</label><input id="oqcLot" /></div>
              <div class="field"><label>외관</label><input id="oqcVisual" value="이상 없음" /></div>
              <div class="field"><label>점도</label><input id="oqcViscosity" /></div>
              <div class="field"><label>고형분</label><input id="oqcSolid" /></div>
              <div class="field"><label>입자</label><input id="oqcParticle" /></div>
              <div class="field"><label>접착력</label><input id="oqcAdhesion" /></div>
              <div class="field"><label>절연저항</label><input id="oqcResistance" /></div>
              <div class="field"><label>전해액 팽윤성</label><input id="oqcSwelling" /></div>
              <div class="field"><label>수분</label><input id="oqcMoisture" /></div>
              <div class="field"><label>수량</label><input id="oqcQty" type="number" /></div>
              <div class="field"><label>불량수량</label><input id="oqcFail" type="number" /></div>
              <div class="field"><label>판정</label><input id="oqcJudge" value="합격" /></div>
            </div>
            <div class="actions" style="margin-top:14px;">
              <button class="btn btn-primary" onclick="saveOqc()">저장</button>
              <button class="btn btn-light" onclick="openOqcReport()">성적서 출력</button>
            </div>
          </section>
          <section class="card table-card" style="margin-top:16px;">
            <pre class="raw-box" id="oqcList"></pre>
          </section>
        `)}
        ${simplePanel('suppliers', '협력업체', '협력업체 등록 및 관리', `
          <section class="card form-card">
            <div class="form-grid">
              <div class="field"><label>업체명</label><input id="supName" /></div>
              <div class="field"><label>담당자</label><input id="supManager" /></div>
              <div class="field"><label>전화번호</label><input id="supPhone" /></div>
              <div class="field"><label>분류</label><input id="supCategory" /></div>
              <div class="field"><label>상태</label><input id="supStatus" /></div>
            </div>
            <div class="actions" style="margin-top:14px;">
              <button class="btn btn-primary" onclick="saveSupplier()">저장</button>
            </div>
          </section>
        `)}
        ${simplePanel('worklog', '생산작업일지', '생산 투입 이력 및 추적성 관리', `
          <section class="card form-card">
            <div class="form-grid">
              <div class="field"><label>작업일자</label><input id="workDate" type="date" /></div>
              <div class="field"><label>완제품 LOT</label><input id="finishedLot" /></div>
              <div class="field"><label>순번</label><input id="workSeq" /></div>
              <div class="field"><label>원료</label><input id="workMaterial" /></div>
              <div class="field"><label>업체명</label><input id="workSupName" /></div>
              <div class="field"><label>투입량</label><input id="workInputQty" /></div>
              <div class="field"><label>투입비율</label><input id="workInputRatio" /></div>
              <div class="field"><label>원료 LOT</label><input id="workLotNo" /></div>
              <div class="field"><label>투입시간</label><input id="workInputTime" /></div>
              <div class="field"><label>작업자</label><input id="workWorker" /></div>
              <div class="field full"><label>비고</label><textarea id="workNote"></textarea></div>
            </div>
            <div class="actions" style="margin-top:14px;">
              <button class="btn btn-primary" onclick="saveWorklog()">저장</button>
              <button class="btn btn-light" onclick="openWorklogReport()">작업일지 성적서</button>
            </div>
          </section>
        `)}
        ${simplePanel('trace', '추적성 조회', '완제품 LOT 또는 원료 LOT 기준 조회', `
          <section class="card form-card">
            <div class="actions">
              <input class="input-mini" id="traceKeyword" placeholder="LOT 번호 입력" style="width:320px;" />
              <button class="btn btn-primary" onclick="searchTrace()">조회</button>
            </div>
            <pre class="raw-box" id="traceResult" style="margin-top:16px;"></pre>
          </section>
        `)}
        ${simplePanel('nonconform', '부적합관리', '부적합 등록 및 조치 관리', `
          <section class="card table-card">
            <pre class="raw-box" id="nonconformList"></pre>
          </section>
        `)}
      </main>
    </div>
  `;
}

function updateClock() {
  const el = document.getElementById('clockText');
  if (el) el.textContent = formatClock();
}

function renderDashboardArea() {
  const summary = renderDashboardSummary(state);
  const iqcCnt = document.getElementById('iqcCnt');
  const pqcCnt = document.getElementById('pqcCnt');
  const oqcCnt = document.getElementById('oqcCnt');
  const ncOpenCnt = document.getElementById('ncOpenCnt');

  if (iqcCnt) iqcCnt.textContent = summary.iqcCount;
  if (pqcCnt) pqcCnt.textContent = summary.pqcCount;
  if (oqcCnt) oqcCnt.textContent = summary.oqcCount;
  if (ncOpenCnt) {
    ncOpenCnt.textContent = `${state.nonconform.filter((r) => String(r.status || '').includes('미')).length}건`;
  }

  drawDashboardChart('chart', state);
}

function renderIqcPreview() {
  const last = state.iqc[0];
  if (!last) return;

  const map = {
    pvIqcDate: last.date || '',
    pvIqcLot: last.lot || '',
    pvIqcSupplier: last.supplier || '',
    pvIqcItem: last.item || '',
    pvIqcInspector: last.inspector || '',
    pvIqcQty: last.qty || 0,
    pvIqcFail: last.fail || 0,
    pvIqcJudge: Number(last.fail || 0) > 0 ? '불합격' : '합격'
  };

  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function renderLists() {
  const iqcList = document.getElementById('iqcList');
  const pqcList = document.getElementById('pqcList');
  const oqcList = document.getElementById('oqcList');
  const nonconformList = document.getElementById('nonconformList');

  if (iqcList) iqcList.textContent = renderIqcRows(state.iqc);
  if (pqcList) pqcList.textContent = renderPqcRows(state.pqc);
  if (oqcList) oqcList.textContent = renderOqcRows(state.oqc);
  if (nonconformList) {
    nonconformList.textContent = state.nonconform.length
      ? JSON.stringify(state.nonconform, null, 2)
      : '등록된 부적합 데이터가 없습니다.';
  }

  renderIqcPreview();
}

async function loadAll() {
  const [iqc, pqc, oqc, suppliers, worklog, nonconform] = await Promise.all([
    api('/api/iqc'),
    api('/api/pqc'),
    api('/api/oqc'),
    api('/api/suppliers'),
    api('/api/worklog'),
    api('/api/nonconform')
  ]);

  state.iqc = iqc;
  state.pqc = pqc;
  state.oqc = oqc;
  state.suppliers = suppliers;
  state.worklog = worklog;
  state.nonconform = nonconform;

  renderDashboardArea();
  renderLists();
}

window.logout = async function () {
  await api('/api/auth/logout', { method: 'POST' });
  location.reload();
};

window.saveIqc = async function () {
  await api('/api/iqc', {
    method: 'POST',
    body: JSON.stringify(buildIqcPayload())
  });
  await loadAll();
  showTab('iqc');
  alert('수입검사 저장 완료');
};

window.savePqc = async function () {
  await api('/api/pqc', {
    method: 'POST',
    body: JSON.stringify(buildPqcPayload())
  });
  await loadAll();
  showTab('pqc');
  alert('공정검사 저장 완료');
};

window.saveOqc = async function () {
  await api('/api/oqc', {
    method: 'POST',
    body: JSON.stringify(buildOqcPayload())
  });
  await loadAll();
  showTab('oqc');
  alert('출하검사 저장 완료');
};

window.saveSupplier = async function () {
  await api('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(buildSupplierPayload())
  });
  await loadAll();
  showTab('suppliers');
  alert('협력업체 저장 완료');
};

window.saveWorklog = async function () {
  await api('/api/worklog', {
    method: 'POST',
    body: JSON.stringify(buildWorklogPayload())
  });
  await loadAll();
  showTab('worklog');
  alert('작업일지 저장 완료');
};

window.searchTrace = function () {
  const keyword = document.getElementById('traceKeyword')?.value || '';
  const resultEl = document.getElementById('traceResult');
  if (!resultEl) return;

  const rows = searchTraceRows(state.worklog, keyword);
  resultEl.textContent = rows.length
    ? JSON.stringify(rows, null, 2)
    : '조회 결과가 없습니다.';
};

window.resetIqcForm = function () {
  ['iqcDate', 'iqcLot', 'iqcSupplier', 'iqcItem', 'iqcInspector', 'iqcQty', 'iqcFail'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
};

window.openIqcReport = function () {
  if (!state.iqc.length) return alert('데이터 없음');
  window.open(`/report_iqc.html?id=${state.iqc[0].id}`, '_blank');
};

window.openPqcReport = function () {
  if (!state.pqc.length) return alert('데이터 없음');
  window.open(`/report_pqc.html?id=${state.pqc[0].id}`, '_blank');
};

window.openOqcReport = function () {
  if (!state.oqc.length) return alert('데이터 없음');
  window.open(`/report_oqc.html?id=${state.oqc[0].id}`, '_blank');
};

window.openWorklogReport = function () {
  if (!state.worklog.length) return alert('데이터 없음');
  const lot = state.worklog[0].finishedLot || state.worklog[0].finishedlot;
  window.open(`/report_worklog.html?lot=${lot}`, '_blank');
};

async function init() {
  try {
    state.user = await api('/api/auth/me');
  } catch (e) {
    document.getElementById('app').innerHTML = '<div style="padding:40px;">로그인이 필요합니다.</div>';
    return;
  }

  document.getElementById('app').innerHTML = appHtml();

  updateClock();
  setInterval(updateClock, 1000);

  showTab('dashboard');
  await loadAll();
}

init();
