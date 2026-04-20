// ===============================
// suppliers.js
// 협력업체 CRUD
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  bindSuppliersEvents();
  loadSuppliers();
});

// ===============================
// 이벤트 연결
// ===============================
function bindSuppliersEvents() {
  const saveBtn = document.getElementById("supplierSaveBtn");
  const refreshBtn = document.getElementById("supplierRefreshBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveSupplier);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadSuppliers);
  }
}

// ===============================
// 목록 조회
// ===============================
async function loadSuppliers() {
  const tbody = document.getElementById("supplierTable");
  if (!tbody) return;

  try {
    const rows = await api("/api/suppliers");
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty">데이터가 없습니다.</td></tr>`;
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.name || ""}</td>
        <td>${row.manager || ""}</td>
        <td>${row.phone || ""}</td>
        <td>${row.category || ""}</td>
        <td>${row.status || ""}</td>
        <td>
          <button class="btn btn-sm btn-light" onclick="editSupplier('${row.id}')">수정</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSupplier('${row.id}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("loadSuppliers error:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="empty">조회 실패</td></tr>`;
  }
}

// ===============================
// 저장 / 수정
// ===============================
async function saveSupplier() {
  const payload = {
    name: document.getElementById("supName")?.value || "",
    manager: document.getElementById("supManager")?.value || "",
    phone: document.getElementById("supPhone")?.value || "",
    category: document.getElementById("supCategory")?.value || "",
    status: document.getElementById("supStatus")?.value || "",
  };

  const editId = document.getElementById("supEditId")?.value || "";

  try {
    if (editId) {
      await api(`/api/suppliers/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      alert("수정되었습니다.");
    } else {
      await api("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert("저장되었습니다.");
    }

    clearSupplierForm();
    loadSuppliers();
  } catch (err) {
    console.error("saveSupplier error:", err);
    alert(err.message || "저장 실패");
  }
}

// ===============================
// 수정 폼 채우기
// ===============================
async function editSupplier(id) {
  try {
    const rows = await api("/api/suppliers");
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    document.getElementById("supName").value = row.name || "";
    document.getElementById("supManager").value = row.manager || "";
    document.getElementById("supPhone").value = row.phone || "";
    document.getElementById("supCategory").value = row.category || "";
    document.getElementById("supStatus").value = row.status || "";
    document.getElementById("supEditId").value = row.id || "";
  } catch (err) {
    console.error("editSupplier error:", err);
    alert("수정 데이터 불러오기 실패");
  }
}

// ===============================
// 삭제
// ===============================
async function deleteSupplier(id) {
  if (!confirm("삭제하시겠습니까?")) return;

  try {
    await api(`/api/suppliers/${id}`, {
      method: "DELETE",
    });

    alert("삭제되었습니다.");
    loadSuppliers();
  } catch (err) {
    console.error("deleteSupplier error:", err);
    alert("삭제 실패");
  }
}

// ===============================
// 폼 초기화
// ===============================
function clearSupplierForm() {
  document.getElementById("supName").value = "";
  document.getElementById("supManager").value = "";
  document.getElementById("supPhone").value = "";
  document.getElementById("supCategory").value = "";
  document.getElementById("supStatus").value = "";
  document.getElementById("supEditId").value = "";
}
