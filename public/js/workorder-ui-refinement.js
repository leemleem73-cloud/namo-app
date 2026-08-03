/* QMES work-order UI refinement
 * - force production-result entry into a centered viewport modal
 * - simplify issued-history actions by moving edit into preview header
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
      width:100%!important;height:100%!important;margin:0!important;padding:14px!important;
      overflow:auto!important;background:rgba(2,6,23,.82)!important;
    }
    #qmes-production-result-modal-root [role="dialog"][aria-label="생산실적 입력"]{
      position:relative!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;
      width:min(100%,1024px)!important;max-height:calc(100vh - 28px)!important;margin:auto!important;
      transform:none!important;flex:none!important;
    }
    .qmes-issued-table-v2 .qmes-manage-btn.edit{display:none!important}
    .qmes-wo-preview-edit-btn{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      height:32px!important;padding:0 13px!important;border:1px solid rgba(14,165,233,.6)!important;
      border-radius:7px!important;background:rgba(14,165,233,.12)!important;color:#7dd3fc!important;
      font-size:12px!important;font-weight:800!important;cursor:pointer!important;
    }
    .qmes-wo-preview-edit-btn:hover{background:rgba(14,165,233,.22)!important;color:#fff!important}
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
    lockBodyForResultModal();
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
