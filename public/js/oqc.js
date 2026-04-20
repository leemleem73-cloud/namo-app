// ===============================
// oqc.js
// 출하검사 CRUD
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  bindOqcEvents();
  loadOqc();
});

// ===============================
// 이벤트 연결
// ===============================
function bindOqcEvents() {
  const saveBtn = document.getElementById("oqcSaveBtn");
  const refreshBtn = document.getElementById("oqcRefreshBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveOqc);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadOqc);
  }
}

// ===============================
// 목록 조회
// ===============================
async function loadOqc() {
  const tbody = document.getElementById("oqcTable");
  if (!tbody) return;

  try {
    const rows = await api("/api/oqc");
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty">데이터가 없습니다.</td></tr>`;
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.date || ""}</td>
        <td>${row.customer || ""}</td>
        <td>${row.product || ""}</td>
        <td>${row.lot || ""}</td>
        <td>${row.judge || ""}</td>
        <td>${row.qty ?? ""}</td>
        <td>${row.fail ?? ""}</td>
        <td>
          <button class="btn btn-sm btn-light" onclick="editOqc('${row.id}')">수정</button>
          <button class="btn btn-sm btn-danger" onclick="deleteOqc('${row.id}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("loadOqc error:", err);
    tbody.innerHTML = `<tr><td colspan="8" class="empty">조회 실패</td></tr>`;
  }
}

// ===============================
// 저장 / 수정
// ===============================
async function saveOqc() {
  const payload = {
    date: document.getElementById("oqcDate")?.value || "",
    customer: document.getElementById("oqcCustomer")?.value || "",
    product: document.getElementById("oqcProduct")?.value || "",
    lot: document.getElementById("oqcLot")?.value || "",
    visual: document.getElementById("oqcVisual")?.value || "",
    viscosity: document.getElementById("oqcViscosity")?.value || "",
    solid: document.getElementById("oqcSolid")?.value || "",
    particle: document.getElementById("oqcParticle")?.value || "",
    adhesion: document.getElementById("oqcAdhesion")?.value || "",
    resistance: document.getElementById("oqcResistance")?.value || "",
    swelling: document.getElementById("oqcSwelling")?.value || "",
    moisture: document.getElementById("oqcMoisture")?.value || "",
    qty: document.getElementById("oqcQty")?.value || "",
    fail: document.getElementById("oqcFail")?.value || "",
    judge: document.getElementById("oqcJudge")?.value || "",
  };

  const editId = document.getElementById("oqcEditId")?.value || "";

  try {
    if (editId) {
      await api(`/api/oqc/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      alert("수정되었습니다.");
    } else {
      await api("/api/oqc", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert("저장되었습니다.");
    }

    clearOqcForm();
    loadOqc();
    if (typeof loadDashboardSummary === "function") loadDashboardSummary();
  } catch (err) {
    console.error("saveOqc error:", err);
    alert(err.message || "저장 실패");
  }
}

// ===============================
// 수정 폼 채우기
// ===============================
async function editOqc(id) {
  try {
    const rows = await api("/api/oqc");
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    document.getElementById("oqcDate").value = row.date || "";
    document.getElementById("oqcCustomer").value = row.customer || "";
    document.getElementById("oqcProduct").value = row.product || "";
    document.getElementById("oqcLot").value = row.lot || "";
    document.getElementById("oqcVisual").value = row.visual || "";
    document.getElementById("oqcViscosity").value = row.viscosity || "";
    document.getElementById("oqcSolid").value = row.solid || "";
    document.getElementById("oqcParticle").value = row.particle || "";
    document.getElementById("oqcAdhesion").value = row.adhesion || "";
    document.getElementById("oqcResistance").value = row.resistance || "";
    document.getElementById("oqcSwelling").value = row.swelling || "";
    document.getElementById("oqcMoisture").value = row.moisture || "";
    document.getElementById("oqcQty").value = row.qty ?? "";
    document.getElementById("oqcFail").value = row.fail ?? "";
    document.getElementById("oqcJudge").value = row.judge || "";
    document.getElementById("oqcEditId").value = row.id || "";
  } catch (err) {
    console.error("editOqc error:", err);
    alert("수정 데이터 불러오기 실패");
  }
}

// ===============================
// 삭제
// ===============================
async function deleteOqc(id) {
  if (!confirm("삭제하시겠습니까?")) return;

  try {
    await api(`/api/oqc/${id}`, {
      method: "DELETE",
    });

    alert("삭제되었습니다.");
    loadOqc();
    if (typeof loadDashboardSummary === "function") loadDashboardSummary();
  } catch (err) {
    console.error("deleteOqc error:", err);
    alert("삭제 실패");
  }
}

// ===============================
// 폼 초기화
// ===============================
function clearOqcForm() {
  document.getElementById("oqcDate").value = "";
  document.getElementById("oqcCustomer").value = "";
  document.getElementById("oqcProduct").value = "";
  document.getElementById("oqcLot").value = "";
  document.getElementById("oqcVisual").value = "";
  document.getElementById("oqcViscosity").value = "";
  document.getElementById("oqcSolid").value = "";
  document.getElementById("oqcParticle").value = "";
  document.getElementById("oqcAdhesion").value = "";
  document.getElementById("oqcResistance").value = "";
  document.getElementById("oqcSwelling").value = "";
  document.getElementById("oqcMoisture").value = "";
  document.getElementById("oqcQty").value = "";
  document.getElementById("oqcFail").value = "";
  document.getElementById("oqcJudge").value = "";
  document.getElementById("oqcEditId").value = "";
}
