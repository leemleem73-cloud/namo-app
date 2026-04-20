// ================= 성적서 이동 =================

window.openIqcReport = function () {
  if (!state.iqc.length) {
    alert('데이터 없음');
    return;
  }
  const id = state.iqc[0].id;
  window.open(`/report_iqc.html?id=${id}`, '_blank');
};

window.openPqcReport = function () {
  if (!state.pqc.length) {
    alert('데이터 없음');
    return;
  }
  const id = state.pqc[0].id;
  window.open(`/report_pqc.html?id=${id}`, '_blank');
};

window.openOqcReport = function () {
  if (!state.oqc.length) {
    alert('데이터 없음');
    return;
  }
  const id = state.oqc[0].id;
  window.open(`/report_oqc.html?id=${id}`, '_blank');
};

window.openWorklogReport = function () {
  if (!state.worklog.length) {
    alert('데이터 없음');
    return;
  }
  const lot = state.worklog[0].finishedLot || state.worklog[0].finishedlot;
  window.open(`/report_worklog.html?lot=${lot}`, '_blank');
};
