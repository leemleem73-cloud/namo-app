/* QMES work-order UI refinement
 * - force production-result entry into a centered viewport modal
 * - simplify production-result form like the partner registration form
 * - improve production readiness guide visibility
 * - align issued-history headers and data cells consistently
 * - remove the issued-history edit action and keep edit inside preview
 */
(function () {
  "use strict";

  if (window.__QMES_WORKORDER_UI_REFINEMENT__) return;
  window.__QMES_WORKORDER_UI_REFINEMENT__ = true;

  const style = document.createElement("style");
  style.id = "qmes-workorder-ui-refinement-style";
  style.textContent = `
    #qmes-production-result-modal-root:empty{display:none!important}
    #qmes-production-result-modal-root:not(:empty){
      position:fixed!important;inset:0!important;z-index:26000!important;
      width:100vw!important;height:100vh!important;overflow:hidden!important;
    }
    #qmes-production-result-modal-root:not(:empty)>div{
      position:absolute!important;inset:0!important;z-index:1!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      width:100%!important;height:100%!important;margin:0!important;padding:16px!important;
      overflow:auto!important;background:rgba(2,6,23,.82)!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]{
      position:relative!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;
      width:min(100%,820px)!important;max-height:calc(100vh - 32px)!important;margin:auto!important;
      transform:none!important;flex:none!important;border:1px solid rgba(34,211,238,.4)!important;
      border-radius:10px!important;background:#0f1e32!important;box-shadow:0 20px 55px rgba(0,0,0,.5)!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:first-child{
      min-height:58px!important;padding:13px 16px!important;border-bottom:1px solid #334155!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:first-child>div:first-child>div:first-child{
      display:none!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:first-child h3{
      margin:0!important;font-size:17px!important;line-height:24px!important;font-weight:700!important;color:#67e8f9!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:nth-child(2){
      padding:16px!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:nth-child(2)>.grid{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:10px 12px!important;align-items:end!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:nth-child(2)>.grid>label{
      display:flex!important;min-width:0!important;flex-direction:column!important;gap:3px!important;
      color:#cbd5e1!important;font-size:13px!important;font-weight:600!important;line-height:18px!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:nth-child(2)>.grid>label:nth-child(5),
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:nth-child(2)>.grid>label:nth-child(8){
      grid-column:1/-1!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"] input,
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"] textarea{
      box-sizing:border-box!important;width:100%!important;min-width:0!important;
      border:1px solid #334155!important;border-radius:6px!important;background:#1e293b!important;
      color:#f1f5f9!important;font-size:13px!important;outline:none!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"] input{
      height:36px!important;min-height:36px!important;padding:5px 9px!important;line-height:24px!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"] input[readonly]{
      background:#162337!important;color:#bae6fd!important;font-weight:700!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"] textarea{
      min-height:96px!important;padding:9px!important;line-height:20px!important;resize:vertical!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"] input:focus,
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"] textarea:focus{
      border-color:#06b6d4!important;
    }
    #qmes-production-result-modal-root .qmes-production-readiness-guide{
      display:flex!important;align-items:center!important;min-height:44px!important;
      margin:0 0 14px!important;padding:10px 12px!important;
      border:1px solid #f59e0b!important;border-left-width:4px!important;border-radius:7px!important;
      background:#3a2508!important;color:#fff7ed!important;
      font-size:14px!important;font-weight:800!important;line-height:21px!important;
      letter-spacing:-.01em!important;text-shadow:0 1px 1px rgba(0,0,0,.35)!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:last-child{
      padding:12px 16px!important;border-top:1px solid #334155!important;background:#0b1728!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:last-child button{
      min-width:72px!important;height:36px!important;border-radius:6px!important;padding:0 16px!important;
      font-size:13px!important;font-weight:700!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:last-child button:last-child{
      background:#0891b2!important;color:#fff!important;
    }

    .qmes-issued-table-wrap{
      overflow-x:auto!important;
      scrollbar-gutter:stable!important;
    }
    .qmes-issued-table-v2{
      width:100%!important;min-width:1500px!important;table-layout:fixed!important;
      border-collapse:collapse!important;
    }
    .qmes-issued-table-v2 th,
    .qmes-issued-table-v2 td{
      box-sizing:border-box!important;
      padding:10px 9px!important;
      vertical-align:middle!important;
    }
    .qmes-issued-table-v2 thead th{
      height:42px!important;
      line-height:18px!important;
      font-size:12px!important;
      font-weight:700!important;
      white-space:nowrap!important;
    }
    .qmes-issued-table-v2 tbody td{
      height:48px!important;
      line-height:20px!important;
      font-size:13px!important;
    }
    .qmes-issued-table-v2 th:nth-child(1),.qmes-issued-table-v2 td:nth-child(1){width:130px!important}
    .qmes-issued-table-v2 th:nth-child(2),.qmes-issued-table-v2 td:nth-child(2){width:180px!important}
    .qmes-issued-table-v2 th:nth-child(3),.qmes-issued-table-v2 td:nth-child(3){width:175px!important}
    .qmes-issued-table-v2 th:nth-child(4),.qmes-issued-table-v2 td:nth-child(4){width:105px!important}
    .qmes-issued-table-v2 th:nth-child(5),.qmes-issued-table-v2 td:nth-child(5){width:105px!important}
    .qmes-issued-table-v2 th:nth-child(6),.qmes-issued-table-v2 td:nth-child(6){width:110px!important}
    .qmes-issued-table-v2 th:nth-child(7),.qmes-issued-table-v2 td:nth-child(7){width:110px!important}
    .qmes-issued-table-v2 th:nth-child(8),.qmes-issued-table-v2 td:nth-child(8){width:90px!important}
    .qmes-issued-table-v2 th:nth-child(9),.qmes-issued-table-v2 td:nth-child(9){width:150px!important}
    .qmes-issued-table-v2 th:nth-child(10),.qmes-issued-table-v2 td:nth-child(10){width:105px!important}
    .qmes-issued-table-v2 th:nth-child(11),.qmes-issued-table-v2 td:nth-child(11){width:240px!important}
    .qmes-issued-table-v2 th.num,.qmes-issued-table-v2 td.num{text-align:right!important}
    .qmes-issued-table-v2 th.center,.qmes-issued-table-v2 td.center{text-align:center!important}
    .qmes-issued-table-v2 td:last-child{
      white-space:nowrap!important;text-align:center!important;
    }
    .qmes-issued-table-v2 td:last-child .qmes-manage-btn,
    .qmes-issued-table-v2 td:last-child .qmes-production-result-shortcut{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      min-height:28px!important;margin:2px!important;vertical-align:middle!important;
    }
    .qmes-issued-table-v2 .qmes-manage-btn.edit,
    .qmes-issued-table-v2 [data-qmes-management-edit-hidden="1"]{display:none!important}

    .qmes-wo-preview-edit-btn{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      height:32px!important;padding:0 13px!important;border:1px solid rgba(14,165,233,.6)!important;
      border-radius:7px!important;background:rgba(14,165,233,.12)!important;color:#7dd3fc!important;
      font-size:12px!important;font-weight:800!important;cursor:pointer!important;
    }
    .qmes-wo-preview-edit-btn:hover{background:rgba(14,165,233,.22)!important;color:#fff!important}
    @media(max-width:640px){
      #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:nth-child(2)>.grid{
        grid-template-columns:1fr!important;
      }
      #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]>div:nth-child(2)>.grid>label{
        grid-column:1!important;
      }
    }
  `;
  document.head.appendChild(style);

  let scheduled = false;
  let bodyLocked = false;
  let previousOverflow = "";

  function rowLot(row) {
    return String(row?.querySelector("td")?.textContent || "").trim();
  }

  function selectedPreviewLot(viewer) {
    const cert = viewer?.querySelector('[id^="qmes-issued-cert-"]');
    return cert ? cert.id.replace(/^qmes-issued-cert-/, "") : "";
  }

  function hideManagementEditButtons() {
    document.querySelectorAll(".qmes-issued-table-v2 tbody td:last-child .qmes-manage-btn.edit").forEach((button) => {
      if (button.dataset.qmesManagementEditHidden === "1") return;
      button.dataset.qmesManagementEditHidden = "1";
      button.hidden = true;
      button.tabIndex = -1;
      button.setAttribute("aria-hidden", "true");
      button.style.setProperty("display", "none", "important");
    });
  }

  function findRowEditButton(lot) {
    const entry = Array.from(document.querySelectorAll(".qmes-issued-table-v2 tbody tr"))
      .map((row) => ({ row, lot:rowLot(row) }))
      .find((item) => item.lot === lot);
    return entry?.row.querySelector(".qmes-manage-btn.edit") || null;
  }

  function lockBodyForResultModal() {
    const open = Boolean(document.querySelector('#qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]'));
    if (open && !bodyLocked) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      bodyLocked = true;
    } else if (!open && bodyLocked) {
      document.body.style.overflow = previousOverflow;
      bodyLocked = false;
    }
  }

  function markReadinessGuide(dialog) {
    const body = dialog?.children?.[1];
    if (!body) return;
    Array.from(body.children).forEach((element) => {
      const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
      if (text.includes("원재료 실투입량과 공정조건 기록이 완료된 후")) {
        element.classList.add("qmes-production-readiness-guide");
      }
    });
  }

  function simplifyResultModal() {
    const dialog = document.querySelector('#qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]');
    if (!dialog) return;
    dialog.dataset.qmesSimpleResultForm = "1";
    markReadinessGuide(dialog);
    const footer = dialog.lastElementChild;
    const saveButton = footer?.querySelector("button:last-child");
    if (saveButton && saveButton.textContent.trim() !== "저장 중" && saveButton.textContent.trim() !== "저장") {
      saveButton.textContent = "저장";
      saveButton.title = "생산실적을 저장합니다";
    }
  }

  function enhancePreview() {
    const viewer = document.querySelector(".qmes-wo-viewer");
    if (!viewer) return;
    const headActions = viewer.querySelector(".qmes-wo-viewer-head > div:last-child");
    const closeButton = headActions?.querySelector(".qmes-modal-close");
    const lot = selectedPreviewLot(viewer);
    if (!headActions || !closeButton || !lot) return;

    let editButton = headActions.querySelector(".qmes-wo-preview-edit-btn");
    if (!editButton) {
      editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "qmes-wo-preview-edit-btn";
      editButton.textContent = "수정";
      editButton.title = "이 작업지시를 수정합니다";
      headActions.insertBefore(editButton, closeButton);
    }
    editButton.dataset.lot = lot;
  }

  function enhance() {
    scheduled = false;
    hideManagementEditButtons();
    lockBodyForResultModal();
    simplifyResultModal();
    enhancePreview();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".qmes-wo-preview-edit-btn");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const lot = String(button.dataset.lot || "").trim();
    const editButton = findRowEditButton(lot);
    if (!editButton) {
      window.alert("수정할 작업지시를 찾을 수 없습니다.");
      return;
    }

    const viewer = button.closest(".qmes-wo-viewer");
    const closeButton = viewer?.querySelector(".qmes-modal-close");
    if (closeButton) closeButton.click();
    window.setTimeout(() => editButton.click(), 0);
  }, true);

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener("qmes:data-updated", schedule);
  schedule();
})();
