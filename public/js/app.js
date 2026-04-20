// ===============================
// 공통 초기화 및 전역 관리
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  console.log("QMS APP INIT");

  setupGlobalHandlers();
  setupMenuNavigation();
});

// ===============================
// 전역 에러 핸들링
// ===============================
window.addEventListener("error", (e) => {
  console.error("GLOBAL ERROR:", e.message);
  alert("시스템 오류가 발생했습니다.");
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("PROMISE ERROR:", e.reason);
  alert("서버 요청 오류가 발생했습니다.");
});

// ===============================
// 공통 API 래퍼
// ===============================
async function safeApi(url, options) {
  try {
    return await api(url, options);
  } catch (err) {
    console.error("API ERROR:", err.message);
    alert(err.message);
    throw err;
  }
}

// ===============================
// 공통 버튼 이벤트
// ===============================
function setupGlobalHandlers() {
  // DB 연결 테스트 버튼
  const dbBtn = document.getElementById("btnDbTest");
  if (dbBtn) {
    dbBtn.onclick = async () => {
      try {
        const res = await safeApi("/api/health");
        alert("DB 연결 정상");
      } catch {
        alert("DB 연결 실패");
      }
    };
  }

  // 서버 동기화
  const syncBtn = document.getElementById("btnSync");
  if (syncBtn) {
    syncBtn.onclick = () => {
      location.reload();
    };
  }
}

// ===============================
// 메뉴 이동
// ===============================
function setupMenuNavigation() {
  const menus = document.querySelectorAll("[data-menu]");
  menus.forEach((menu) => {
    menu.addEventListener("click", () => {
      const target = menu.dataset.menu;
      console.log("MENU:", target);

      // 메뉴 이동 처리
      if (target === "iqc") {
        location.href = "report_worklog.html?mode=certificate&type=iqc";
      }
      if (target === "pqc") {
        location.href = "report_worklog.html?mode=certificate&type=pqc";
      }
      if (target === "oqc") {
        location.href = "report_worklog.html?mode=certificate&type=oqc";
      }
      if (target === "worklog") {
        location.href = "report_worklog.html?mode=worklog";
      }
      if (target === "suppliers") {
        loadSuppliers();
      }
      if (target === "trace") {
        loadTrace();
      }
    });
  });
}

// ===============================
// 유틸 함수
// ===============================
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function numberFormat(num) {
  if (!num) return "0";
  return Number(num).toLocaleString();
}

// ===============================
// 공통 메시지 UI
// ===============================
function showMessage(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerText = msg;
  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 3000);
}

// ===============================
// 외부 모듈 연결
// ===============================
window.QMS = {
  api: safeApi,
};
