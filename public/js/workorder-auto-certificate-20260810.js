(function () {
  "use strict";

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

  function workOrder(lot) {
    const db = store();
    const doc = db && db.woDocs && db.woDocs[lot];
    const batch = db && Array.isArray(db.batches) && db.batches.find((row) => row.no === lot);
    return doc && batch ? { doc, batch } : null;
  }

  function rowsHtml(items, kind) {
    if (!Array.isArray(items) || !items.length) {
      return '<tr><td colspan="6" class="qmes-auto-cert-empty">등록된 항목이 없습니다.</td></tr>';
    }
    return items.map((item, index) => {
      const actual = item.act;
      const hasActual = actual !== "" && actual != null;
      const judged = item.ok === true ? "적합" : item.ok === false ? "부적합" : "대기";
      const std = kind === "input" ? (item.plan != null ? item.plan : item.std) : item.std;
      return '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td class="left">' + esc(kind === "input" ? item.name : ((item.proc ? item.proc + " · " : "") + (item.item || ""))) + '</td>' +
        '<td>' + esc(std == null || std === "" ? "-" : std) + '</td>' +
        '<td>' + esc(kind === "input" ? (item.unit || "kg") : (item.method || "-")) + '</td>' +
        '<td>' + (hasActual ? esc(actual) : '<span class="pending">입력대기</span>') + '</td>' +
        '<td><span class="judge ' + (item.ok === true ? "ok" : item.ok === false ? "ng" : "") + '">' + judged + '</span></td>' +
      '</tr>';
    }).join("");
  }

  function modalHtml(lot) {
    const data = workOrder(lot);
    if (!data) return "";
    const { doc, batch } = data;
    const conditions = Array.isArray(doc.conds) ? doc.conds : [];
    const inputs = Array.isArray(doc.inputs) ? doc.inputs : [];
    const waiting = conditions.length === 0 || conditions.some((item) => item.act === "" || item.act == null || item.ok == null);
    const status = waiting ? "검사결과 입력대기" : conditions.some((item) => item.ok === false) ? "부적합" : "검사완료";
    return '<div class="qmes-auto-cert-backdrop" role="dialog" aria-modal="true" aria-label="작업지시 성적서">' +
      '<section class="qmes-auto-cert-sheet">' +
        '<header><div><strong>나모케미칼(주)</strong><small>NAMO Chemical Co., Ltd.</small></div>' +
        '<div class="title"><h2>제조 성적서</h2><span>MANUFACTURING CERTIFICATE</span></div>' +
        '<button type="button" data-cert-close aria-label="닫기">×</button></header>' +
        '<div class="qmes-auto-cert-state"><b>작업지시 발행 자동생성</b><span>' + esc(status) + '</span></div>' +
        '<table class="qmes-auto-cert-meta"><tbody>' +
          '<tr><th>성적서 번호</th><td>MFG-' + esc(lot) + '</td><th>작업지시/LOT</th><td>' + esc(lot) + '</td></tr>' +
          '<tr><th>품목</th><td>' + esc(doc.item || batch.item) + '</td><th>계획량</th><td>' + Number(doc.plan != null ? doc.plan : batch.plan || 0).toLocaleString() + ' ' + esc(batch.unit || "kg") + '</td></tr>' +
          '<tr><th>생산일자</th><td>' + esc(doc.date || batch.due || "-") + '</td><th>설비</th><td>' + esc(doc.tank || batch.tank || "-") + '</td></tr>' +
          '<tr><th>작업자</th><td>' + esc(doc.workers || batch.worker || "-") + '</td><th>현재상태</th><td>' + esc(status) + '</td></tr>' +
        '</tbody></table>' +
        '<h3>원료 투입 기록</h3><table class="qmes-auto-cert-data"><thead><tr><th>No.</th><th>원료명</th><th>계획량</th><th>단위</th><th>실투입량</th><th>판정</th></tr></thead><tbody>' + rowsHtml(inputs, "input") + '</tbody></table>' +
        '<h3>공정 검사 결과</h3><table class="qmes-auto-cert-data"><thead><tr><th>No.</th><th>검사항목</th><th>기준</th><th>방법</th><th>결과</th><th>판정</th></tr></thead><tbody>' + rowsHtml(conditions, "condition") + '</tbody></table>' +
        '<p class="qmes-auto-cert-note">※ 작업지시 발행과 동시에 LOT 기준으로 자동 구성됩니다. 검사 결과 입력 전에는 최종 합격 성적서로 사용할 수 없습니다.</p>' +
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
      if (!lot || !workOrder(lot) || row.querySelector("[data-qmes-auto-cert]")) return;
      const manageCell = row.cells[row.cells.length - 1];
      if (!manageCell) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "qmes-manage-btn qmes-auto-cert-btn";
      button.dataset.qmesAutoCert = lot;
      button.textContent = "성적서";
      button.title = "작업지시 발행 시 자동 생성된 제조 성적서";
      manageCell.insertBefore(button, manageCell.firstChild);
    });
  }

  function scheduleScan() {
    if (scanQueued) return;
    scanQueued = true;
    window.requestAnimationFrame(() => {
      scanQueued = false;
      addButtons();
    });
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
    .qmes-auto-cert-btn{border-color:rgba(16,185,129,.65)!important;color:#6ee7b7!important;background:rgba(6,78,59,.18)!important}
    .qmes-auto-cert-btn:hover{background:rgba(6,78,59,.38)!important;color:#d1fae5!important}
    .qmes-auto-cert-backdrop{position:fixed;inset:0;z-index:20000;padding:24px;background:rgba(2,6,23,.82);overflow:auto;display:flex;align-items:flex-start;justify-content:center}
    .qmes-auto-cert-sheet{width:min(1040px,100%);min-height:720px;background:#fff;color:#0f172a;border-radius:14px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.45);font-family:Pretendard,Arial,sans-serif}
    .qmes-auto-cert-sheet header{display:grid;grid-template-columns:1fr 2fr 1fr;align-items:center;border-bottom:3px solid #0f172a;padding-bottom:16px}
    .qmes-auto-cert-sheet header strong{display:block;font-size:18px}.qmes-auto-cert-sheet header small{display:block;color:#475569;margin-top:3px}
    .qmes-auto-cert-sheet .title{text-align:center}.qmes-auto-cert-sheet h2{font-size:26px;margin:0}.qmes-auto-cert-sheet .title span{font-size:11px;letter-spacing:.16em;color:#64748b}
    .qmes-auto-cert-sheet header>button{justify-self:end;width:36px;height:36px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;font-size:24px;cursor:pointer}
    .qmes-auto-cert-state{display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px;padding:10px 13px;border-radius:9px;background:#ecfdf5;color:#065f46}
    .qmes-auto-cert-state span{padding:4px 9px;border:1px solid #f59e0b;border-radius:999px;background:#fffbeb;color:#92400e;font-size:12px;font-weight:800}
    .qmes-auto-cert-sheet table{width:100%;border-collapse:collapse}.qmes-auto-cert-sheet th,.qmes-auto-cert-sheet td{border:1px solid #cbd5e1;padding:8px 9px;text-align:center;font-size:12px}
    .qmes-auto-cert-meta th{width:15%;background:#e2e8f0;font-weight:800}.qmes-auto-cert-meta td{width:35%;text-align:left}
    .qmes-auto-cert-sheet h3{margin:18px 0 7px;font-size:14px}.qmes-auto-cert-data thead th{background:#0f2744;color:#fff}
    .qmes-auto-cert-data .left{text-align:left}.qmes-auto-cert-data .pending{color:#b45309;font-weight:700}.qmes-auto-cert-data .judge{color:#b45309}.qmes-auto-cert-data .judge.ok{color:#047857;font-weight:800}.qmes-auto-cert-data .judge.ng{color:#dc2626;font-weight:800}
    .qmes-auto-cert-empty{padding:20px!important;color:#64748b}.qmes-auto-cert-note{margin:16px 0 0;color:#64748b;font-size:11px}
    .qmes-auto-cert-sheet footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.qmes-auto-cert-sheet footer button{min-width:78px;padding:9px 14px;border:1px solid #94a3b8;border-radius:8px;background:#fff;font-weight:800;cursor:pointer}.qmes-auto-cert-sheet footer button:first-child{background:#0f766e;border-color:#0f766e;color:#fff}
    @media print{body>*:not(.qmes-auto-cert-backdrop){display:none!important}.qmes-auto-cert-backdrop{position:static!important;display:block!important;padding:0!important;background:#fff!important}.qmes-auto-cert-sheet{width:100%!important;min-height:0!important;padding:8mm!important;box-shadow:none!important;border-radius:0!important}.qmes-auto-cert-sheet header>button,.qmes-auto-cert-sheet footer{display:none!important}}
  `;
  document.head.appendChild(style);

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  scheduleScan();
})();