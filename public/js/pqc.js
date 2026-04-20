// ===============================
// pqc.js
// 공정검사 CRUD
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  bindPqcEvents();
  loadPqc();
});

// ===============================
// 이벤트 연결
// ===============================
function bindPqcEvents() {
  const saveBtn = document.getElementById("pqcSaveBtn");
  const refreshBtn = document.getElementById("pqcRefreshBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", savePqc);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadPqc);
  }
}

// ===============================
// 목록 조회
// ===============================
async function loadPqc() {
  const tbody = document.getElementById("pqcTable");
  if (!tbody) return;

  try {
    const rows = await api("/api/pqc");
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty">데이터가 없습니다.</td></tr>`;
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.date || ""}</td>
        <td>${row.product || ""}</td>
        <td>${row.lot || ""}</td>
        <td>${row.visual || ""}</td>
        <td>${row.judge || ""}</td>
        <td>${row.incoming_qty ?? ""}</td>
        <td>${row.qty ?? ""}</td>
        <td>${row.fail ?? ""}</td>
        <td>
          <button class="btn btn-sm btn-light" onclick="editPqc('${row.id}')">수정</button>
          <button class="btn btn-sm btn-danger" onclick="deletePqc('${row.id}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("loadPqc error:", err);
    tbody.innerHTML = `<tr><td colspan="9" class="empty">조회 실패</td></tr>`;
  }
}

// ===============================
// 저장 / 수정
// ===============================
async function savePqc() {
  const payload = {
    date: document.getElementById("pqcDate")?.value || "",
    product: document.getElementById("pqcProduct")?.value || "",
    lot: document.getElementById("pqcLot")?.value || "",
    visual: document.getElementById("pqcVisual")?.value || "",
    viscosity: document.getElementById("pqcViscosity")?.value || "",
    solid: document.getElementById("pqcSolid")?.value || "",
    particle: document.getElementById("pqcParticle")?.value || "",
    judge: document.getElementById("pqcJudge")?.value || "",
    incomingQty: document.getElementById("pqcIncomingQty")?.value || "",
    qty: document.getElementById("pqcQty")?.value || "",
    fail: document.getElementById("pqcFail")?.value || "",
  };

  const editId = document.getElementById("pqcEditId")?.value || "";

  try {
    if (editId) {
      await api(`/api/pqc/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      alert("수정되었습니다.");
    } else {
      await api("/api/pqc", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert("저장되었습니다.");
    }

    clearPqcForm();
    loadPqc();
    if (typeof loadDashboardSummary === "function") loadDashboardSummary();
  } catch (err) {
    console.error("savePqc error:", err);
    alert(err.message || "저장 실패");
  }
}

// ===============================
// 수정 폼 채우기
// ===============================
async function editPqc(id) {
  try {
    const rows = await api("/api/pqc");
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    document.getElementById("pqcDate").value = row.date || "";
    document.getElementById("pqcProduct").value = row.product || "";
    document.getElementById("pqcLot").value = row.lot || "";
    document.getElementById("pqcVisual").value = row.visual || "";
    document.getElementById("pqcViscosity").value = row.viscosity || "";
    document.getElementById("pqcSolid").value = row.solid || "";
    document.getElementById("pqcParticle").value = row.particle || "";
    document.getElementById("pqcJudge").value = row.judge || "";
    document.getElementById("pqcIncomingQty").value = row.incoming_qty ?? "";
    document.getElementById("pqcQty").value = row.qty ?? "";
    document.getElementById("pqcFail").value = row.fail ?? "";
    document.getElementById("pqcEditId").value = row.id || "";
  } catch (err) {
    console.error("editPqc error:", err);
    alert("수정 데이터 불러오기 실패");
  }
}

// ===============================
// 삭제
// ===============================
async function deletePqc(id) {
  if (!confirm("삭제하시겠습니까?")) return;

  try {
    await api(`/api/pqc/${id}`, {
      method: "DELETE",
    });

    alert("삭제되었습니다.");
    loadPqc();
    if (typeof loadDashboardSummary === "function") loadDashboardSummary();
  } catch (err) {
    console.error("deletePqc error:", err);
    alert("삭제 실패");
  }
}

// ===============================
// 폼 초기화
// ===============================
function clearPqcForm() {
  document.getElementById("pqcDate").value = "";
  document.getElementById("pqcProduct").value = "";
  document.getElementById("pqcLot").value = "";
  document.getElementById("pqcVisual").value = "";
  document.getElementById("pqcViscosity").value = "";
  document.getElementById("pqcSolid").value = "";
  document.getElementById("pqcParticle").value = "";
  document.getElementById("pqcJudge").value = "";
  document.getElementById("pqcIncomingQty").value = "";
  document.getElementById("pqcQty").value = "";
  document.getElementById("pqcFail").value = "";
  document.getElementById("pqcEditId").value = "";
}
