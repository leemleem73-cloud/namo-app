/* QMES Grd. -> customer auto display patch.
 * Keeps the work-order React module unchanged and adds a read-only customer card
 * beside the Grd. selector. Customer is inferred from the registered Grd. code.
 */
(function () {
  "use strict";

  const CUSTOMER_RULES = [
    { pattern: /(?:^|-)HM\d{2}(?:$|[^0-9])/i, name: "현대자동차", series: "HM (Hyundai Motor) series" },
    { pattern: /(?:^|-)SH\d{2}(?:$|[^0-9])/i, name: "삼성SDI", series: "SH (Samsung SDI) series" },
    { pattern: /(?:^|-)LG\d{2}(?:$|[^0-9])/i, name: "LG에너지솔루션", series: "LG series" },
    { pattern: /(?:^|-)SK\d{2}(?:$|[^0-9])/i, name: "SK온", series: "SK series" },
  ];

  function analyzeGrade(rawGrade) {
    const grade = String(rawGrade || "").trim().toUpperCase();
    const rule = CUSTOMER_RULES.find((item) => item.pattern.test(grade));
    const compact = grade.split("-")[0] || "";
    const solvent = compact[0] === "N" ? "NMP" : "-";
    const filler = compact[1] === "B" ? "Boehmite" : "-";
    const binderCode = compact[2] || "";
    const binder = binderCode === "A" ? "PVdF/SBR" : binderCode === "C" ? "PAI Type" : "-";
    const tscMatch = compact.match(/(15|20)$/);

    return {
      grade,
      customer: rule ? rule.name : "미지정",
      series: rule ? rule.series : "고객사 코드 확인 필요",
      solvent,
      filler,
      binder,
      tsc: tscMatch ? `${tscMatch[1]}%` : "-",
    };
  }

  function createCustomerField() {
    const field = document.createElement("div");
    field.className = "qmes-wo-form-field qmes-grade-customer-field";
    field.setAttribute("data-qmes-grade-customer", "true");
    field.innerHTML = `
      <span class="text-[10px] text-slate-500">고객사 (Grd. 자동 판별)</span>
      <div class="qmes-grade-customer-box" style="min-height:38px;border:1px solid rgb(51 65 85);border-radius:6px;background:rgba(30,41,59,.6);padding:7px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <strong data-qmes-customer-name style="font-size:14px;color:rgb(125 211 252);">미지정</strong>
        <span data-qmes-customer-series style="font-size:10px;color:rgb(148 163 184);text-align:right;">고객사 코드 확인 필요</span>
      </div>
      <div data-qmes-grade-detail style="margin-top:4px;font-size:10px;color:rgb(100 116 139);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
    `;
    return field;
  }

  function updateCustomerField(grid, productSelect) {
    let field = grid.querySelector('[data-qmes-grade-customer="true"]');
    if (!field) {
      field = createCustomerField();
      const productField = productSelect.closest(".qmes-wo-form-field");
      if (productField && productField.parentNode === grid) productField.insertAdjacentElement("afterend", field);
      else grid.appendChild(field);
    }

    const info = analyzeGrade(productSelect.value);
    field.querySelector("[data-qmes-customer-name]").textContent = info.customer;
    field.querySelector("[data-qmes-customer-series]").textContent = info.series;
    field.querySelector("[data-qmes-grade-detail]").textContent =
      `Grd. ${info.grade || "-"} · 용제 ${info.solvent} · 필러 ${info.filler} · 바인더 ${info.binder} · TSC ${info.tsc}`;
    field.dataset.customer = info.customer;
    field.dataset.grade = info.grade;
  }

  function bindWorkOrderForm() {
    document.querySelectorAll(".qmes-wo-form-grid").forEach((grid) => {
      const fields = Array.from(grid.querySelectorAll(":scope > .qmes-wo-form-field"));
      const productField = fields.find((field) => /공정\s*\/\s*품목\s*\(Grd\.\)/i.test(field.textContent || ""));
      const productSelect = productField && productField.querySelector("select");
      if (!productSelect) return;

      if (!productSelect.dataset.qmesCustomerBound) {
        productSelect.dataset.qmesCustomerBound = "true";
        productSelect.addEventListener("change", function () {
          window.setTimeout(() => updateCustomerField(grid, productSelect), 0);
        });
      }
      updateCustomerField(grid, productSelect);
    });
  }

  let scheduled = false;
  const scheduleBind = function () {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      bindWorkOrderForm();
    });
  };

  document.addEventListener("DOMContentLoaded", scheduleBind);
  new MutationObserver(scheduleBind).observe(document.documentElement, { childList: true, subtree: true });
  scheduleBind();
})();
