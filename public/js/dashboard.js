window.QMS = window.QMS || {};

window.QMS.dashboard = {
  chart: null,

  renderCounts(state) {
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const iqcRows = QMS.utils.applyFilters(state.iqc || [], ['date']);
    const pqcRows = QMS.utils.applyFilters(state.pqc || [], ['date']);
    const oqcRows = QMS.utils.applyFilters(state.oqc || [], ['date']);
    const ncRows = QMS.utils.applyFilters(state.nonconform || [], ['date']);
    const workRows = QMS.utils.applyFilters(state.worklog || [], ['workDate']);

    setText('iqcCount', iqcRows.length);
    setText('pqcCount', pqcRows.length);
    setText('oqcCount', oqcRows.length);
    setText('ncCount', ncRows.length);
    setText('worklogCount', workRows.length);

    this.renderIqcChart(iqcRows, pqcRows, oqcRows);
  },

  buildMonthlySeries(rows, dateKey) {
    const bucket = {};

    (rows || []).forEach((row) => {
      const raw = row?.[dateKey];
      if (!raw) return;
      const month = String(raw).slice(0, 7);
      if (!bucket[month]) bucket[month] = 0;
      bucket[month] += 1;
    });

    const labels = Object.keys(bucket).sort();
    return {
      labels,
      values: labels.map((label) => bucket[label]),
    };
  },

  mergeLabels(...seriesList) {
    const set = new Set();
    seriesList.forEach((series) => {
      (series.labels || []).forEach((label) => set.add(label));
    });
    return Array.from(set).sort();
  },

  mapValues(labels, series) {
    const map = {};
    (series.labels || []).forEach((label, index) => {
      map[label] = series.values[index];
    });
    return labels.map((label) => map[label] || 0);
  },

  renderIqcChart(iqcRows, pqcRows, oqcRows) {
    const canvas = document.getElementById('iqcChart');
    if (!canvas) return;

    const iqcSeries = this.buildMonthlySeries(iqcRows, 'date');
    const pqcSeries = this.buildMonthlySeries(pqcRows, 'date');
    const oqcSeries = this.buildMonthlySeries(oqcRows, 'date');

    const labels = this.mergeLabels(iqcSeries, pqcSeries, oqcSeries);

    if (!labels.length) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width = canvas.offsetWidth || 800;
      const height = canvas.height = 260;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('표시할 데이터가 없습니다.', width / 2, height / 2);
      return;
    }

    if (typeof Chart === 'undefined') {
      const ctx = canvas.getContext('2d');
      const width = canvas.width = canvas.offsetWidth || 800;
      const height = canvas.height = 260;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('Chart.js가 로드되지 않았습니다.', width / 2, height / 2);
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '수입검사',
            data: this.mapValues(labels, iqcSeries),
            backgroundColor: '#2563eb',
            borderRadius: 6,
          },
          {
            label: '공정검사',
            data: this.mapValues(labels, pqcSeries),
            backgroundColor: '#8b5cf6',
            borderRadius: 6,
          },
          {
            label: '출하검사',
            data: this.mapValues(labels, oqcSeries),
            backgroundColor: '#f59e0b',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#fff',
            bodyColor: '#fff',
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#475569',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5edf8',
            },
            ticks: {
              stepSize: 1,
              color: '#475569',
            },
          },
        },
      },
    });
  },
};
