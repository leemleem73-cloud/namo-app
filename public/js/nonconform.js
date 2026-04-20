// ===============================
// nonconform.js
// 부적합 관리 CRUD
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  bindNcEvents();
  loadNc();
});

// ===============================
function bindNcEvents() {
  const saveBtn = document.getElementById("ncSaveBtn");
  const refreshBtn = document.getElementById("ncRefreshBtn");

  if (saveBtn) saveBtn.onclick = saveNc;
  if (refreshBtn) refreshBtn.onclick = loadNc;
}

// ===============================
// 조회
// ===============================
async function loadNc() {
  const tbody = document.getElementById("ncTable");
  if (!tbody) return;

  try {
    const rows = await api("/api/nonconform");
    tbody.innerHTML = "";

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7">데이터 없음</td></tr>`;
      return;
    }

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date || ""}</td>
        <td>${r.type || ""}</td>
        <td>${r.item || ""}</td>
        <td>${r.content || ""}</td>
        <td>${r.action || ""}</td>
        <td>${r.status || ""}</td>
        <td>
          <button onclick="editNc('${r.id}')">수정</button>
          <button onclick="deleteNc('${r.id}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
  }
}

// ===============================
// 저장
// ===============================
async function saveNc() {
  const payload = {
    date: document.getElementById("ncDate").value,
    type: document.getElementById("ncType").value,
    item: document.getElementById("ncItem").value,
    content: document.getElementById("ncContent").value,
    action: document.getElementById("ncAction").value,
    status: document.getElementById("ncStatus").value,
  };

  try {
    await api("/api/nonconform", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    alert("저장 완료");
    loadNc();
  } catch (err) {
    alert(err.message);
  }
}

// ===============================
// 수정
// ===============================
async function editNc(id) {
  const rows = await api("/api/nonconform");
  const r = rows.find((x) => x.id === id);

  if (!r) return;

  document.getElementById("ncDate").value = r.date;
  document.getElementById("ncType").value = r.type;
  document.getElementById("ncItem").value = r.item;
  document.getElementById("ncContent").value = r.content;
  document.getElementById("ncAction").value = r.action;
  document.getElementById("ncStatus").value = r.status;

  document.getElementById("ncEditId").value = id;
}

// ===============================
// 삭제
// ===============================
async function deleteNc(id) {
  if (!confirm("삭제?")) return;

  await api(`/api/nonconform/${id}`, { method: "DELETE" });
  loadNc();
}
