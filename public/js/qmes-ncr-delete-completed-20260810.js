/* QMES NCR stable actions.
   Prevents the NCR close action from colliding with React rerender, and provides delete for completed rows. */
(function installNcrStableActions(){
  "use strict";
  if(window.__QMES_NCR_STABLE_ACTIONS__) return;
  window.__QMES_NCR_STABLE_ACTIONS__ = true;

  const DB_KEY = "qmes-local-shipment-dashboard-v8-clean";
  const clean = value => String(value || "").replace(/\s+/g," ").trim();

  const style = document.createElement("style");
  style.id = "qmes-ncr-stable-actions-style";
  style.textContent = `
    .qmes-ncr-delete-button{
      display:inline-flex!important;
      min-width:54px!important;
      height:34px!important;
      align-items:center!important;
      justify-content:center!important;
      padding:0 10px!important;
      border:1px solid rgba(239,68,68,.55)!important;
      border-radius:8px!important;
      background:rgba(239,68,68,.08)!important;
      color:#fca5a5!important;
      font-size:12px!important;
      font-weight:900!important;
      line-height:1!important;
      white-space:nowrap!important;
      cursor:pointer!important;
    }
    .qmes-ncr-delete-button:hover{
      background:rgba(239,68,68,.18)!important;
      border-color:rgba(239,68,68,.8)!important;
      color:#fecaca!important;
    }
    .qmes-ncr-row-removing{
      opacity:0!important;
      transform:translateY(-4px)!important;
      transition:opacity .12s ease,transform .12s ease!important;
    }
  `;
  document.head.appendChild(style);

  function readDb(){
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(error) {
      console.error("[QMES] NCR DB 읽기 실패", error);
      return null;
    }
  }

  function saveDb(db){
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function ncrNumberFromRow(row){
    if(!row) return "";
    const cells = Array.from(row.querySelectorAll("td"));
    const first = clean(cells[0]?.textContent);
    if(/^NCR-/i.test(first)) return first;
    const found = cells.map(cell => clean(cell.textContent)).find(value => /^NCR-/i.test(value));
    return found || "";
  }

  function stableClose(no){
    const db = readDb();
    if(!db || !Array.isArray(db.ncrs)) return false;
    let changed = false;
    db.ncrs = db.ncrs.map(row => {
      if(clean(row?.no) !== no) return row;
      changed = true;
      return {...row,status:"유효성 확인",d:7};
    });
    if(!changed) return false;
    db.holds = Array.isArray(db.holds)
      ? db.holds.map(hold => clean(hold?.ncr) === no && clean(hold?.status) === "차단중"
          ? {...hold,status:"해제 요청중 (승인 대기)"}
          : hold)
      : [];
    saveDb(db);
    try {
      sessionStorage.setItem("qmes-ncr-flash", `${no} 조치 완료 처리 · 품질 인터락에서 홀드 해제 승인이 필요합니다.`);
    } catch(error) {}
    return true;
  }

  function updateVisibleTotal(table){
    if(!table) return;
    const panel = table.closest("section,div");
    if(!panel) return;
    const count = table.querySelectorAll("tbody tr").length;
    Array.from(panel.querySelectorAll("span")).forEach(node => {
      if(/^총\s*\d+건$/.test(clean(node.textContent))) node.textContent = `총 ${count}건`;
    });
  }

  function deleteNcr(no,row){
    const db = readDb();
    if(!db || !Array.isArray(db.ncrs)) {
      alert("부적합 저장 데이터를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    const record = db.ncrs.find(item => clean(item?.no) === no);
    if(!record) {
      alert("이미 삭제되었거나 저장 데이터를 찾지 못했습니다.");
      return;
    }
    const ok = confirm(`${no} 부적합 기록을 삭제할까요?\n잘못 저장한 기록을 되돌리는 용도이며, 연결된 홀드 기록도 함께 정리됩니다.`);
    if(!ok) return;

    db.ncrs = db.ncrs.filter(item => clean(item?.no) !== no);
    db.holds = Array.isArray(db.holds) ? db.holds.filter(hold => clean(hold?.ncr) !== no) : [];

    if(db.lots && typeof db.lots === "object") {
      Object.keys(db.lots).forEach(lotNo => {
        const lot = db.lots[lotNo];
        if(!lot || clean(lot.holdNo) !== no) return;
        const stillHeld = (db.holds || []).some(hold => clean(hold?.target) === clean(lotNo) && !clean(hold?.status).includes("해제 완료"));
        if(stillHeld) return;
        const next = {...lot};
        delete next.holdNo;
        if(clean(next.status).includes("홀드")) {
          next.status = clean(next.stage) === "출하" ? "출하완료" : "생산중";
        }
        db.lots[lotNo] = next;
      });
    }

    saveDb(db);

    /* Do not reload the whole QMES app after delete.
       The persisted record is already gone, so remove only the visible row immediately.
       Navigating away/back naturally remounts the React list from the updated DB. */
    const table = row?.closest?.("table") || null;
    if(row && row.isConnected) {
      row.classList.add("qmes-ncr-row-removing");
      window.setTimeout(() => {
        if(row.isConnected) row.remove();
        updateVisibleTotal(table);
      },120);
    }
  }

  /* Capture the native React click before it changes component state.
     We persist the same state change, then reload cleanly so React never reconciles against externally decorated cells. */
  document.addEventListener("click", event => {
    const button = event.target?.closest?.("button");
    if(!button || clean(button.textContent) !== "조치 완료") return;
    const row = button.closest("tr");
    const no = ncrNumberFromRow(row);
    if(!no) return;
    const tableText = clean(button.closest("table")?.textContent);
    if(!tableText.includes("부적합") && !tableText.includes("관련 LOT")) return;

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    if(stableClose(no)) {
      location.reload();
    }
  }, true);

  function decorate(){
    document.querySelectorAll("table").forEach(table => {
      const headers = Array.from(table.querySelectorAll("thead th")).map(th => clean(th.textContent));
      const managementIndex = headers.indexOf("관리");
      const numberIndex = headers.indexOf("번호");
      if(managementIndex < 0 || numberIndex < 0) return;

      table.querySelectorAll("tbody tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        if(!cells.length || !cells[managementIndex] || !cells[numberIndex]) return;
        const no = clean(cells[numberIndex].textContent);
        if(!/^NCR-/i.test(no)) return;
        const actionCell = cells[managementIndex];
        if(actionCell.querySelector(".qmes-ncr-delete-button")) return;
        if(clean(actionCell.textContent) !== "-") return;

        actionCell.textContent = "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "qmes-ncr-delete-button";
        button.textContent = "삭제";
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          deleteNcr(no,row);
        });
        actionCell.appendChild(button);
      });
    });
  }

  let scheduled = false;
  const schedule = () => {
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("qmes:data-updated", schedule);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, {once:true});
  else schedule();
})();
