/* QMES NCR completed-row delete action.
   Replaces the management-cell dash with a real delete button and removes the saved NCR + linked hold data. */
(function installNcrCompletedDelete(){
  "use strict";
  if(window.__QMES_NCR_COMPLETED_DELETE__) return;
  window.__QMES_NCR_COMPLETED_DELETE__ = true;

  const DB_KEY = "qmes-local-shipment-dashboard-v8-clean";
  const clean = value => String(value || "").replace(/\s+/g," ").trim();

  const style = document.createElement("style");
  style.id = "qmes-ncr-completed-delete-style";
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

  function deleteNcr(no){
    const db = readDb();
    if(!db || !Array.isArray(db.ncrs)) {
      alert("부적합 저장 데이터를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    const record = db.ncrs.find(row => clean(row?.no) === no);
    if(!record) {
      alert("이미 삭제되었거나 저장 데이터를 찾지 못했습니다.");
      location.reload();
      return;
    }
    const ok = confirm(`${no} 부적합 기록을 삭제할까요?\n잘못 저장한 기록을 되돌리는 용도이며, 연결된 홀드 기록도 함께 정리됩니다.`);
    if(!ok) return;

    db.ncrs = db.ncrs.filter(row => clean(row?.no) !== no);
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
    try {
      window.dispatchEvent(new CustomEvent("qmes:data-updated", {detail:{source:"ncr-delete",no}}));
    } catch(error) {}
    location.reload();
  }

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
          deleteNcr(no);
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
  document.addEventListener("click", schedule, true);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, {once:true});
  else schedule();
})();
