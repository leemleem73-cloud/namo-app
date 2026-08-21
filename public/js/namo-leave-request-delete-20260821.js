/* NAMO Talk leave-request delete action */
(function () {
  "use strict";

  var STORAGE_KEY = "qmes-namo-leave-requests-v1";

  function currentUser() {
    return window.__QMES_CURRENT_USER__ || window.__QMES_USER__ || { name: "관리자", role: "admin" };
  }

  function isAdmin(user) {
    return String(user && user.role || "").toLowerCase() === "admin" || String(user && user.name || "") === "관리자";
  }

  function loadRequests() {
    try {
      var rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }

  function saveRequests(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }

  function text(cell) {
    return String(cell && cell.textContent || "").trim();
  }

  function installDeleteButtons() {
    var panel = document.querySelector('section[aria-label="NAMO Talk"]');
    if (!panel) return;

    var headings = Array.from(panel.querySelectorAll("div"));
    var leaveHeading = headings.find(function (el) { return text(el) === "휴가 신청"; });
    if (!leaveHeading) return;

    var card = leaveHeading.parentElement;
    if (!card) return;
    var table = card.querySelector("table");
    if (!table) return;

    var user = currentUser();
    var admin = isAdmin(user);

    Array.from(table.querySelectorAll("tbody tr")).forEach(function (row) {
      if (row.dataset.namoLeaveDeleteInstalled === "1") return;
      var cells = row.querySelectorAll("td");
      if (cells.length < 6) return;

      var date = text(cells[0]);
      var name = text(cells[1]);
      var type = text(cells[2]);
      var reason = text(cells[3]);
      var status = text(cells[4]);
      if (!date || date === "휴가 신청 내역이 없습니다.") return;
      if (!admin && name !== String(user.name || "")) return;

      row.dataset.namoLeaveDeleteInstalled = "1";
      var manageCell = cells[5];
      var existing = manageCell.querySelector("span");
      var wrap = existing || document.createElement("span");
      if (!existing) {
        wrap.style.display = "flex";
        wrap.style.gap = "4px";
        wrap.style.alignItems = "center";
        manageCell.textContent = "";
        manageCell.appendChild(wrap);
      }

      var button = document.createElement("button");
      button.type = "button";
      button.textContent = "삭제";
      button.className = "namo-leave-delete-button";
      Object.assign(button.style, {
        height: "29px",
        padding: "0 9px",
        border: "1px solid #dc2626",
        borderRadius: "6px",
        background: "#fff1f2",
        color: "#b91c1c",
        fontSize: "12px",
        fontWeight: "900",
        cursor: "pointer"
      });

      button.onclick = function () {
        var ok = window.confirm(date + " · " + type + " 휴가 신청 기록을 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.");
        if (!ok) return;

        var requests = loadRequests();
        var index = requests.findIndex(function (request) {
          var sameReason = String(request.reason || "-").trim() === reason || (!request.reason && reason === "-");
          return String(request.date || "") === date &&
            String(request.name || "") === name &&
            String(request.type || "") === type &&
            String(request.status || "") === status &&
            sameReason;
        });

        if (index < 0) {
          index = requests.findIndex(function (request) {
            return String(request.date || "") === date && String(request.name || "") === name && String(request.type || "") === type;
          });
        }

        if (index < 0) {
          window.alert("삭제할 휴가 신청 기록을 찾지 못했습니다.");
          return;
        }

        requests.splice(index, 1);
        saveRequests(requests);
        window.location.reload();
      };

      wrap.appendChild(button);
    });
  }

  var observer = new MutationObserver(installDeleteButtons);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(installDeleteButtons, 300);
})();
