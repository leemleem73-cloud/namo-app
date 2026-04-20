// ===============================
// dashboard.js
// 메인 대시보드 집계 / 표시
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

async function initDashboard() {
  try {
    await Promise.all([
      loadDashboardSummary(),
      loadRecentIqc(),
      loadRecentPqc(),
      loadRecentOqc(),
      loadRecentNonconform(),
      loadRecentWorklog(),
    ]);
  } catch (err) {
    console.error("Dashboard init error:", err);
  }
}

// ===============================
// 상단 요약 집계
// ===============================
async function loadDashboardSummary() {
  try {
    const [iqc, pqc, oqc, nc, worklog] = await Promise.all([
      api("/api/iqc"),
      api("/api/pqc"),
      api("/api/oqc"),
      api("/api/nonconform"),
      api("/api/worklog"),
    ]);

    setText("iqcCount", iqc.length || 0);
    setText("pqcCount", pqc.length || 0);
    setText("oqcCount", oqc.length || 0);
    setText("ncCount", nc.length || 0);
    setText("worklogCount", worklog.length || 0);

    renderSimpleChart("iqcChart", iqc.length || 0, "#2563eb");
    renderSimpleChart("pqcChart", pqc.length || 0, "#16a34a");
    renderSimpleChart("oqcChart", oqc.length || 0, "#dc2626");
    renderSimpleChart("ncChart", nc.length || 0, "#f59e0b");
    renderSimpleChart("worklogChart", worklog.length || 0, "#7c3aed");
  } catch (err) {
    console.error("loadDashboardSummary error:", err);
  }
}

// ===============================
// 최근 데이터 불러오기
// ===============================
async function loadRecentIqc() {
  try {
    const rows = await api("/api/iqc");
    window.dashboardIqcRows = rows || [];
  } catch (err) {
    console.error("loadRecentIqc error:", err);
  }
}

async function loadRecentPqc() {
  try {
    const rows = await api("/api/pqc");
    window.dashboardPqcRows = rows || [];
  } catch (err) {
    console.error("loadRecentPqc error:", err);
  }
}

async function loadRecentOqc() {
  try {
    const rows = await api("/api/oqc");
    window.dashboardOqcRows = rows || [];
  } catch (err) {
    console.error("loadRecentOqc error:", err);
  }
}

async function loadRecentNonconform() {
  try {
    const rows = await api("/api/nonconform");
    window.dashboardNcRows = rows || [];
  } catch (err) {
    console.error("loadRecentNonconform error:", err);
  }
}

async function loadRecentWorklog() {
  try {
    const rows = await api("/api/worklog");
    window.dashboardWorklogRows = rows || [];
  } catch (err) {
    console.error("loadRecentWorklog error:", err);
  }
}

// ===============================
// 텍스트 출력
// ===============================
function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

// ===============================
// 간단 막대 그래프
// ===============================
function renderSimpleChart(canvasId, value, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width = canvas.offsetWidth || 300;
  const height = canvas.height = canvas.offsetHeight || 180;

  ctx.clearRect(0, 0, width, height);

  // 배경
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, width, height);

  const maxValue = Math.max(value, 10);
  const barHeight = (value / maxValue) * (height - 40);

  // 막대
  ctx.fillStyle = color;
  ctx.fillRect(width / 2 - 30, height - barHeight - 20, 60, barHeight);

  // 값 텍스트
  ctx.fillStyle = "#111827";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(String(value), width / 2, height - barHeight - 28);

  // 기준선
  ctx.strokeStyle = "#d1d5db";
  ctx.beginPath();
  ctx.moveTo(20, height - 20);
  ctx.lineTo(width - 20, height - 20);
  ctx.stroke();
}
