export function renderDashboardSummary(state) {
  return {
    iqcCount: state.iqc?.length || 0,
    pqcCount: state.pqc?.length || 0,
    oqcCount: state.oqc?.length || 0
  };
}

export function drawDashboardChart(canvasId, state) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  if (window.__dashboardChart) {
    window.__dashboardChart.destroy();
  }

  window.__dashboardChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['IQC', 'PQC', 'OQC'],
      datasets: [
        {
          label: '등록 건수',
          data: [
            state.iqc?.length || 0,
            state.pqc?.length || 0,
            state.oqc?.length || 0
          ]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
