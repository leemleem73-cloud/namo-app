// ===============================
// iqc.js
// 수입검사 CRUD
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  bindIqcEvents();
  loadIqc();
});

// ===============================
// 이벤트 연결
// ===============================
function bindIqcEvents() {
  const saveBtn = document.getElementById("iqcSaveBtn");
  const refreshBtn = document.getElementById("iqcRefreshBtn");
  const sampleBtn = document.getElementById("iqcSampleBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveIqc);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadIqc);
  }

  if (sampleBtn) {
    sampleBtn.addEventListener("click", fillIqcSample);
  }
}

// ===============================
// 목록 조회
// ===============================
async function loadIqc() {
  const tbody = document.getElementById("iqcTable");
  if (!tbody) return;

  try {
    const rows = await api("/api/iqc");
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty">데이터가 없습니다.</td></tr>`;
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.date || ""}</td>
        <td>${row.lot || ""}</td>
        <td>${row.supplier || ""}</td>
        <td>${row.item || ""}</td>
        <td>${row.inspector || ""}</td>
        <td>${row.incoming_qty ?? ""}</td>
        <td>${row.qty ?? ""}</td>
        <td>${row.fail ?? ""}</td>
        <td>
          <button class="btn btn-sm btn-light" onclick="editIqc('${row.id}')">수정</button>
          <button class="btn btn-sm btn-danger" onclick="deleteIqc('${row.id}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("loadIqc error:", err);
    tbody.innerHTML = `<tr><td colspan="9" class="empty">조회 실패</td></tr>`;
  }
}

// ===============================
// 저장 / 수정
// ===============================
async function saveIqc() {
  const payload = {
    date: document.getElementById("iqcDate")?.value || "",
    lot: document.getElementById("iqcLot")?.value || "",
    supplier: document.getElementById("iqcSupplier")?.value || "",
    item: document.getElementById("iqcItem")?.value || "",
    inspector: document.getElementById("iqcInspector")?.value || "",
    incomingQty: document.getElementById("iqcIncomingQty")?.value || "",
    qty: document.getElementById("iqcQty")?.value || "",
    fail: document.getElementById("iqcFail")?.value || "",
  };

  const editId = document.getElementById("iqcEditId")?.value || "";

  try {
    if (editId) {
      await api(`/api/iqc/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      alert("수정되었습니다.");
    } else {
      await api("/api/iqc", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert("저장되었습니다.");
    }

    clearIqcForm();
    loadIqc();
    if (typeof loadDashboardSummary === "function") loadDashboardSummary();
  } catch (err) {
    console.error("saveIqc error:", err);
    alert(err.message || "저장 실패");
  }
}

// ===============================
// 수정 폼 채우기
// ===============================
async function editIqc(id) {
  try {
    const rows = await api("/api/iqc");
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    document.getElementById("iqcDate").value = row.date || "";
    document.getElementById("iqcLot").value = row.lot || "";
    document.getElementById("iqcSupplier").value = row.supplier || "";
    document.getElementById("iqcItem").value = row.item || "";
    document.getElementById("iqcInspector").value = row.inspector || "";
    document.getElementById("iqcIncomingQty").value = row.incoming_qty ?? "";
    document.getElementById("iqcQty").value = row.qty ?? "";
    document.getElementById("iqcFail").value = row.fail ?? "";
    document.getElementById("iqcEditId").value = row.id || "";
  } catch (err) {
    console.error("editIqc error:", err);
    alert("수정 데이터 불러오기 실패");
  }
}

// ===============================
// 삭제
// ===============================
async function deleteIqc(id) {
  if (!confirm("삭제하시겠습니까?")) return;

  try {
    await api(`/api/iqc/${id}`, {
      method: "DELETE",
    });

    alert("삭제되었습니다.");
    loadIqc();
    if (typeof loadDashboardSummary === "function") loadDashboardSummary();
  } catch (err) {
    console.error("deleteIqc error:", err);
    alert("삭제 실패");
  }
}

// ===============================
// 샘플값
// ===============================
function fillIqcSample() {
  document.getElementById("iqcDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("iqcLot").value = "IQC-LOT-001";
  document.getElementById("iqcSupplier").value = "협력업체A";
  document.getElementById("iqcItem").value = "원료A";
  document.getElementById("iqcInspector").value = "홍길동";
  document.getElementById("iqcIncomingQty").value = "1000";
  document.getElementById("iqcQty").value = "100";
  document.getElementById("iqcFail").value = "0";
}

// ===============================
// 폼 초기화
// ===============================
function clearIqcForm() {
  document.getElementById("iqcDate").value = "";
  document.getElementById("iqcLot").value = "";
  document.getElementById("iqcSupplier").value = "";
  document.getElementById("iqcItem").value = "";
  document.getElementById("iqcInspector").value = "";
  document.getElementById("iqcIncomingQty").value = "";
  document.getElementById("iqcQty").value = "";
  document.getElementById("iqcFail").value = "";
  document.getElementById("iqcEditId").value = "";
}
