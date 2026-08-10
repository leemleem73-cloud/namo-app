(function () {
  function labelTitle(label) {
    return String(label?.querySelector("span")?.textContent || "").replace(/\s+/g, " ").replace(/\*/g, "").trim();
  }

  function isPqcActive() {
    const active = document.querySelector(".qmes-ipad-pop .qmes-ipad-mode-tabs button.is-active");
    return !!active && /PQC|공정검사/.test(String(active.textContent || ""));
  }

  function applyPqcOrder() {
    if (!isPqcActive()) return;
    const grid = document.querySelector(".qmes-ipad-pop .qmes-ipad-mode-tabs + .qmes-ipad-section .qmes-ipad-form-grid")
      || document.querySelector(".qmes-ipad-pop .qmes-ipad-section .qmes-ipad-form-grid");
    if (!grid) return;

    const labels = Array.from(grid.querySelectorAll(":scope > label"));
    const find = (pattern) => labels.find((label) => pattern.test(labelTitle(label)));

    const inspectDate = find(/^검사일자$/);
    const lot = find(/^생산 LOT$/i);
    const product = find(/^제품명$/);
    const inspector = find(/^검사자$/);
    const remarks = find(/^비고$/);
    if (!inspectDate || !lot || !product || !inspector || !remarks) return;

    lot.classList.remove("wide");
    inspectDate.classList.remove("wide");
    product.classList.remove("wide");
    inspector.classList.remove("wide");
    remarks.classList.add("wide");

    [inspectDate, lot, product, inspector, remarks].forEach((node) => grid.appendChild(node));
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyPqcOrder();
    });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:["class"] });
  document.addEventListener("click", schedule, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once:true });
  else schedule();
})();