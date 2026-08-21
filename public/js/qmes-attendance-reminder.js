/* QMES attendance reminder - regular employees only (admin/executives excluded) */
(function () {
  "use strict";

  var ATT_KEY = "qmes-namo-attendance-v1";
  var SESSION_KEY = "qmes-namo-attendance-session-v1";
  var SNOOZE_KEY = "qmes-attendance-reminder-snooze-v1";
  var SHOWN_KEY = "qmes-attendance-reminder-shown-v1";
  var START_MIN = 8 * 60;
  var END_MIN = 17 * 60;
  var PRE_MIN = 10;
  var CHECK_MS = 30000;

  function safeParse(value, fallback) {
    try { return JSON.parse(value || "") || fallback; }
    catch (e) { return fallback; }
  }

  function pad(value) { return String(value).padStart(2, "0"); }
  function dateKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }
  function timeText(date) { return pad(date.getHours()) + ":" + pad(date.getMinutes()); }
  function minuteOfDay(date) { return date.getHours() * 60 + date.getMinutes(); }

  function currentUser() {
    return window.__QMES_CURRENT_USER__ || { name: "관리자", role: "admin", uid: "U-0001" };
  }

  function isExcludedUser(user) {
    var role = String(user.role || user.userRole || "").toLowerCase();
    var position = String(user.position || user.rank || user.jobTitle || user.title || "");
    var name = String(user.name || "");

    if (role === "admin" || role === "administrator" || name === "관리자") return true;
    return /(대표이사|대표|사장|부사장|전무|상무|이사|임원)/.test(position);
  }

  function loadAttendance() {
    var local = safeParse(localStorage.getItem(ATT_KEY), []);
    var session = safeParse(sessionStorage.getItem(SESSION_KEY), []);
    var merged = Array.isArray(local) ? local.slice() : [];

    (Array.isArray(session) ? session : []).forEach(function (row) {
      var index = merged.findIndex(function (item) {
        return item.date === row.date && (
          (item.uid && row.uid && item.uid === row.uid) || item.name === row.name
        );
      });
      if (index >= 0) merged[index] = Object.assign({}, merged[index], row);
      else merged.push(row);
    });
    return merged;
  }

  function saveAttendance(rows) {
    var data = JSON.stringify(rows);
    try {
      localStorage.setItem(ATT_KEY, data);
      sessionStorage.removeItem(SESSION_KEY);
      return true;
    } catch (e) {
      try {
        sessionStorage.setItem(SESSION_KEY, data);
        return true;
      } catch (ignore) {
        return false;
      }
    }
  }

  function findTodayRecord(rows, now) {
    var user = currentUser();
    var today = dateKey(now);
    return rows.find(function (row) {
      return row.date === today && (
        (row.uid && user.uid && row.uid === user.uid) || row.name === user.name
      );
    });
  }

  function snoozeKey(type) { return dateKey(new Date()) + ":" + type; }
  function isSnoozed(type) {
    var map = safeParse(localStorage.getItem(SNOOZE_KEY), {});
    return Number(map[snoozeKey(type)] || 0) > Date.now();
  }
  function snooze(type) {
    var map = safeParse(localStorage.getItem(SNOOZE_KEY), {});
    map[snoozeKey(type)] = Date.now() + 5 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
  }
  function recentlyShown(type) {
    var map = safeParse(sessionStorage.getItem(SHOWN_KEY), {});
    return Date.now() - Number(map[snoozeKey(type)] || 0) < 4 * 60 * 1000;
  }
  function markShown(type) {
    var map = safeParse(sessionStorage.getItem(SHOWN_KEY), {});
    map[snoozeKey(type)] = Date.now();
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify(map));
  }

  var style = document.createElement("style");
  style.textContent =
    "#qmes-att-reminder{position:fixed;top:124px;right:18px;z-index:9999;width:min(370px,calc(100vw - 28px));background:#fff;border:1px solid #cbd5e1;border-left:6px solid #059669;border-radius:15px;box-shadow:0 18px 50px rgba(15,23,42,.28);padding:16px;font-family:Pretendard,'Noto Sans KR',sans-serif;display:none}" +
    "#qmes-att-reminder.show{display:block}" +
    ".qar-title{font-size:16px;font-weight:900;color:#0f172a}" +
    ".qar-text{font-size:13px;color:#475569;margin-top:6px;line-height:1.5}" +
    ".qar-actions{display:flex;gap:8px;margin-top:14px}" +
    ".qar-actions button{height:38px;border-radius:10px;padding:0 14px;font-size:12px;font-weight:900;cursor:pointer}" +
    ".qar-main{border:0;background:#0f766e;color:#fff}" +
    ".qar-later,.qar-close{border:1px solid #cbd5e1;background:#fff;color:#334155}";
  document.head.appendChild(style);

  var popup = document.createElement("div");
  popup.id = "qmes-att-reminder";
  document.body.appendChild(popup);

  function browserNotify(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try { new Notification(title, { body: body, tag: "qmes-attendance-reminder" }); }
      catch (e) {}
    }
  }

  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(function () {});
    }
  }

  function clock(type) {
    var now = new Date();
    var user = currentUser();
    var rows = loadAttendance();
    var record = findTodayRecord(rows, now);

    if (type === "clockIn") {
      if (record && record.clockIn) return;
      var row = {
        date: dateKey(now),
        uid: user.uid || user.id || "",
        name: user.name || "",
        dept: user.dept || user.department || "",
        position: user.position || user.rank || "",
        clockIn: timeText(now),
        clockOut: "",
        workStatus: "근무",
        note: ""
      };
      rows.push(row);
    } else {
      if (!record || !record.clockIn || record.clockOut) return;
      rows = rows.map(function (row) {
        return row === record ? Object.assign({}, row, { clockOut: timeText(now) }) : row;
      });
    }

    saveAttendance(rows);
    popup.classList.remove("show");
    window.dispatchEvent(new Event("storage"));
  }

  function render(item) {
    popup.style.borderLeftColor = item.type === "out" ? "#dc2626" : item.type === "latein" ? "#d97706" : "#059669";
    popup.innerHTML =
      '<div class="qar-title">' + item.title + '</div>' +
      '<div class="qar-text">' + item.text + '</div>' +
      '<div class="qar-actions">' +
      '<button class="qar-main" type="button">' + item.actionLabel + '</button>' +
      '<button class="qar-later" type="button">5분 후</button>' +
      '<button class="qar-close" type="button">닫기</button>' +
      '</div>';

    popup.querySelector(".qar-main").onclick = function () {
      clock(item.type === "out" ? "clockOut" : "clockIn");
    };
    popup.querySelector(".qar-later").onclick = function () {
      snooze(item.type);
      popup.classList.remove("show");
    };
    popup.querySelector(".qar-close").onclick = function () {
      popup.classList.remove("show");
    };

    popup.classList.add("show");
    markShown(item.type);
    browserNotify("나모케미칼 QMES", item.text);
  }

  function getReminder() {
    var now = new Date();
    var minute = minuteOfDay(now);
    var record = findTodayRecord(loadAttendance(), now);

    if (minute >= START_MIN - PRE_MIN && minute < START_MIN && !(record && record.clockIn)) {
      return { type: "prein", title: "🟢 출근 알림", text: "출근시간이 10분 남았습니다. 출근 처리를 해주세요.", actionLabel: "출근하기" };
    }
    if (minute >= START_MIN && minute < 12 * 60 && !(record && record.clockIn)) {
      return { type: "latein", title: "⚠ 출근 미처리", text: "출근시간이 지났습니다. 출근 처리를 확인해 주세요.", actionLabel: "지금 출근" };
    }
    if (minute >= END_MIN && record && record.clockIn && !record.clockOut) {
      return { type: "out", title: "🔴 퇴근 알림", text: "퇴근시간입니다. 오늘도 수고하셨습니다.", actionLabel: "퇴근하기" };
    }
    return null;
  }

  function check() {
    var user = currentUser();
    if (isExcludedUser(user)) {
      popup.classList.remove("show");
      return;
    }

    var item = getReminder();
    if (!item || isSnoozed(item.type) || recentlyShown(item.type)) return;
    render(item);
  }

  requestNotificationPermission();
  setTimeout(check, 1500);
  setInterval(check, CHECK_MS);
})();
