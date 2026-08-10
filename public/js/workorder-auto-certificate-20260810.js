(function () {
  "use strict";

  const PQC_ITEMS = ["점도", "고형분", "입도(Dmax)", "외관"];
  let scanQueued = false;

  function store() {
    try { return typeof DB !== "undefined" ? DB : null; } catch (_) { return null; }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function specFor(item) {
    try {
      if (typeof QC_ITEMS !== "undefined" && QC_ITEMS[item]) return QC_ITEMS[item].spec || "-";
    } catch (_) {}
    return "-";
  }

  function workOrder(lot) {
    const db = store();
    const doc = db && db.woDocs && db.woDocs[lot];
    const batch = db && Array.isArray(db.batches) && db.batches.find((row) => row.no === lot);
    return db && doc && batch ? { db, doc, batch } : null;
  }

  function groupKey(row) {
    const explicit = String(row && row.groupId || "").trim();
    if (explicit) return explicit;
    return String(row && row.id || "").replace(/-\d+$/, "");
  }

  function latestPqcGroup(db, lot) {
    const rows = (db.insp && Array.isArray(db.insp.PQC) ? db.insp.PQC : [])
      .filter((row) => String(row.lot || "").trim() === lot);
    if (!rows.length) return [];
    const groups = new Map();
    rows.forEach((row) => {
      const key = groupKey(row) || (String(row.date || "") + "|" + lot);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.values()).sort((a, b) => {
      const av = String(a[0] && (a[0].date || "") || "") + String(a[0] && (a[0].time || "") || "");
      const bv = String(b[0] && (b[0].date || "") || "") + String(b[0] && (b[0].time || "") || "");
      return bv.localeCompare(av);
    })[0] || [];
  }

  function valuesOf(row) {
    if (!row) return [];
    if (Array.isArray(row.measurements)) return row.measurements.map(String);
    return String(row.value || "").split("/").map((value) => value.trim()).filter(Boolean);
  }

  function overall(rows) {
    if (!rows.length || !PQC_ITEMS.every((item) => rows.some((row) => row.check === item))) return "검사대기";
    return rows.every((row) => row.judge === "합격") ? "합격" : "불합격";
  }

  function resultRows(rows) {
    return PQC_ITEMS.map((item, index) => {
      const row = rows.find((entry) => entry.check === item);
      const values = valuesOf(row);
      const qualitative = item === "외관";
      const judge = row && row.judge ? row.judge : "대기";
      const judgeClass = judge === "합격" ? "ok" : judge === "불합격" ? "ng" : "pending";
      const cells = qualitative
        ? '<td colspan="3">' + (row ? esc(row.value || (judge === "합격" ? "이상없음" : "-")) : '<span class="pending">미실시</span>') + '</td>'
        : [0, 1, 2].map((i) => '<td>' + (values[i] ? esc(values[i]) : '<span class="pending">-</span>') + '</td>').join("");
      return '<tr><td>' + (index + 1) + '</td><td class="left">' + esc(item === "입도(Dmax)" ? "입도(Dmax)" : item) + '</td>' +
        '<td class="left">' + esc(specFor(item)) + '</td>' + cells +
        '<td><span class="judge ' + judgeClass + '">' + esc(judge) + '</span></td></tr>';
    }).join("");
  }

  function modalHtml(lot) {
    const data = workOrder(lot);
    if (!data) return "";
    const { db, doc, batch } = data;
    const rows = latestPqcGroup(db, lot);
    const representative = rows[0] || {};
    const status = overall(rows);
    const certNo = groupKey(representative) || ("PQC-" + lot);
    const statusClass = status === "합격" ? "ok" : status === "불합격" ? "ng" : "pending";
    return '<div class="qmes-auto-cert-backdrop" role="dialog" aria-modal="true" aria-label="공정검사 성적서">' +
      '<section class="qmes-auto-cert-sheet">' +
        '<header><div><strong>나모케미칼(주)</strong><small>NAMO Chemical Co., Ltd.</small></div>' +
        '<div class="title"><h2>공정검사 성적서</h2><span>PROCESS QUALITY INSPECTION REPORT</span></div>' +
        '<button type="button" data-cert-close aria-label="닫기">×</button></header>' +
        '<div class="qmes-auto-cert-state"><b>작업지시 발행 시 LOT 자동생성</b><span class="' + statusClass + '">' + esc(status) + '</span></div>' +
        '<table class="qmes-auto-cert-meta"><tbody>' +
          '<tr><th>공정번호</th><td>' + esc(certNo) + '</td><th>작업지시/LOT</th><td>' + esc(lot) + '</td></tr>' +
          '<tr><th>제품명</th><td>' + esc(doc.item || batch.item || "-") + '</td><th>생산계획량</th><td>' + Number(doc.plan != null ? doc.plan : batch.plan || 0).toLocaleString() + ' ' + esc(batch.unit || "kg") + '</td></tr>' +
          '<tr><th>검사일자</th><td>' + esc(representative.date || "검사 전") + '</td><th>검사자</th><td>' + esc(representative.inspector || "미입력") + '</td></tr>' +
          '<tr><th>생산일자</th><td>' + esc(doc.date || batch.due || "-") + '</td><th>설비</th><td>' + esc(doc.tank || batch.tank || "-") + '</td></tr>' +
        '</tbody></table>' +
        '<h3>공정검사 결과</h3><table class="qmes-auto-cert-data"><thead><tr><th>No.</th><th>검사항목</th><th>관리기준</th><th>1차</th><th>2차</th><th>3차</th><th>판정</th></tr></thead><tbody>' + resultRows(rows) + '</tbody></table>' +
        '<div class="qmes-auto-cert-overall"><b>종합판정</b><span class="' + statusClass + '">' + esc(status) + '</span><em>' + (status === "합격" ? "공정 진행" : status === "불합격" ? "공정 보류" : "검사 진행 전") + '</em></div>' +
        '<div class="qmes-auto-cert-sign"><div><b>작성</b><span>' + esc(representative.inspector || "") + '</span></div><div><b>검토</b><span></span></div><div><b>승인</b><span></span></div></div>' +
        '<p class="qmes-auto-cert-note">※ 작업지시 발행 시 해당 LOT의 공정검사 성적서가 자동 구성되며, PQC 등록 후 측정값과 판정이 자동 반영됩니다.</p>' +
        '<footer><button type="button" data-cert-print>인쇄</button><button type="button" data-cert-close>닫기</button></footer>' +
      '</section></div>';
  }

  function openCertificate(lot) {
    document.querySelector(".qmes-auto-cert-backdrop")?.remove();
    const holder = document.createElement("div");
    holder.innerHTML = modalHtml(lot);
    if (holder.firstElementChild) document.body.appendChild(holder.firstElementChild);
  }

  function addButtons() {
    document.querySelectorAll(".qmes-issued-table-v2 tbody tr").forEach((row) => {
      const lot = String(row.cells && row.cells[0] && row.cells[0].textContent || "").trim();
      if (!lot || !workOrder(lot)) return;
      const manageCell = row.cells[row.cells.length - 1];
      if (!manageCell) return;
      let button = row.querySelector("[data-qmes-auto-cert]");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "qmes-manage-btn qmes-auto-cert-btn";
        button.dataset.qmesAutoCert = lot;
        manageCell.insertBefore(button, manageCell.firstChild);
      }
      button.textContent = "공정성적서";
      button.title = "작업지시 발행 시 자동 생성된 공정검사 성적서";
    });
  }

  function scheduleScan() {
    if (scanQueued) return;
    scanQueued = true;
    window.requestAnimationFrame(() => { scanQueued = false; addButtons(); });
  }

  document.addEventListener("click", (event) => {
    const certButton = event.target.closest("[data-qmes-auto-cert]");
    if (certButton) {
      event.preventDefault();
      event.stopPropagation();
      openCertificate(certButton.dataset.qmesAutoCert);
      return;
    }
    if (event.target.closest("[data-cert-close]")) {
      event.target.closest(".qmes-auto-cert-backdrop")?.remove();
      return;
    }
    if (event.target.closest("[data-cert-print]")) window.print();
    if (event.target.closest(".qmes-inspection-save-btn")) {
      [0, 120, 450, 1000].forEach((delay) => window.setTimeout(scheduleScan, delay));
    }
  }, true);

  window.addEventListener("qmes:data-updated", scheduleScan);
  window.addEventListener("qmes:workorders-updated", scheduleScan);
  window.addEventListener("focus", scheduleScan);

  const style = document.createElement("style");
  style.textContent = `
    .qmes-auto-cert-btn{border-color:rgba(56,189,248,.65)!important;color:#7dd3fc!important;background:rgba(3,105,161,.16)!important}
    .qmes-auto-cert-btn:hover{background:rgba(3,105,161,.35)!important;color:#e0f2fe!important}
    .qmes-auto-cert-backdrop{position:fixed;inset:0;z-index:20000;padding:24px;background:rgba(2,6,23,.82);overflow:auto;display:flex;align-items:flex-start;justify-content:center}
    .qmes-auto-cert-sheet{width:min(1040px,100%);min-height:680px;background:#fff;color:#0f172a;border-radius:14px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.45);font-family:Pretendard,Arial,sans-serif}
    .qmes-auto-cert-sheet header{display:grid;grid-template-columns:1fr 2fr 1fr;align-items:center;border-bottom:3px solid #0f172a;padding-bottom:16px}
    .qmes-auto-cert-sheet header strong{display:block;font-size:18px}.qmes-auto-cert-sheet header small{display:block;color:#475569;margin-top:3px}
    .qmes-auto-cert-sheet .title{text-align:center}.qmes-auto-cert-sheet h2{font-size:26px;margin:0}.qmes-auto-cert-sheet .title span{font-size:11px;letter-spacing:.12em;color:#64748b}
    .qmes-auto-cert-sheet header>button{justify-self:end;width:36px;height:36px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;font-size:24px;cursor:pointer}
    .qmes-auto-cert-state{display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px;padding:10px 13px;border-radius:9px;background:#eff6ff;color:#1e3a8a}
    .qmes-auto-cert-state span,.qmes-auto-cert-overall span{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:900}.qmes-auto-cert-state .pending,.qmes-auto-cert-overall .pending{background:#fffbeb;color:#92400e;border:1px solid #f59e0b}.qmes-auto-cert-state .ok,.qmes-auto-cert-overall .ok{background:#ecfdf5;color:#047857;border:1px solid #10b981}.qmes-auto-cert-state .ng,.qmes-auto-cert-overall .ng{background:#fef2f2;color:#dc2626;border:1px solid #ef4444}
    .qmes-auto-cert-sheet table{width:100%;border-collapse:collapse}.qmes-auto-cert-sheet th,.qmes-auto-cert-sheet td{border:1px solid #cbd5e1;padding:9px;text-align:center;font-size:12px}
    .qmes-auto-cert-meta th{width:15%;background:#e2e8f0;font-weight:800}.qmes-auto-cert-meta td{width:35%;text-align:left}
    .qmes-auto-cert-sheet h3{margin:18px 0 7px;font-size:14px}.qmes-auto-cert-data thead th{background:#0f2744;color:#fff}.qmes-auto-cert-data th:nth-child(3){width:28%}
    .qmes-auto-cert-data .left{text-align:left}.qmes-auto-cert-data .pending{color:#b45309}.qmes-auto-cert-data .judge{font-weight:800}.qmes-auto-cert-data .judge.ok{color:#047857}.qmes-auto-cert-data .judge.ng{color:#dc2626}.qmes-auto-cert-data .judge.pending{color:#b45309}
    .qmes-auto-cert-overall{display:grid;grid-template-columns:120px 120px 1fr;align-items:center;margin-top:14px;border:1px solid #cbd5e1}.qmes-auto-cert-overall>*{padding:11px;text-align:center}.qmes-auto-cert-overall b{background:#e2e8f0}.qmes-auto-cert-overall em{font-style:normal;font-weight:700}
    .qmes-auto-cert-sign{display:flex;justify-content:flex-end;margin-top:18px}.qmes-auto-cert-sign div{width:100px;border:1px solid #cbd5e1;text-align:center}.qmes-auto-cert-sign b,.qmes-auto-cert-sign span{display:block;min-height:34px;padding:8px}.qmes-auto-cert-sign b{background:#e2e8f0;border-bottom:1px solid #cbd5e1}
    .qmes-auto-cert-note{margin:15px 0 0;color:#64748b;font-size:11px}.qmes-auto-cert-sheet footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.qmes-auto-cert-sheet footer button{min-width:78px;padding:9px 14px;border:1px solid #94a3b8;border-radius:8px;background:#fff;font-weight:800;cursor:pointer}.qmes-auto-cert-sheet footer button:first-child{background:#0369a1;border-color:#0369a1;color:#fff}
    @media print{body>*:not(.qmes-auto-cert-backdrop){display:none!important}.qmes-auto-cert-backdrop{position:static!important;display:block!important;padding:0!important;background:#fff!important}.qmes-auto-cert-sheet{width:100%!important;min-height:0!important;padding:8mm!important;box-shadow:none!important;border-radius:0!important}.qmes-auto-cert-sheet header>button,.qmes-auto-cert-sheet footer{display:none!important}}
  `;
  document.head.appendChild(style);

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  scheduleScan();
})();