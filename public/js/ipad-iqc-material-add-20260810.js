(function () {
  const STYLE_ID = "qmes-ipad-iqc-material-add-style";
  const BUTTON_CLASS = "qmes-ipad-material-add-btn";
  const SPIN_CLASS = "qmes-ipad-number-stepper";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .qmes-ipad-material-field{position:relative!important;}
      .qmes-ipad-material-field>input{padding-right:72px!important;}
      .${BUTTON_CLASS}{
        position:absolute;right:7px;bottom:7px;z-index:3;
        min-width:56px;height:32px;padding:0 9px;
        border:1px solid #a8b6c3;border-radius:8px;
        background:linear-gradient(180deg,#f8fafc 0%,#e8edf2 100%);
        color:#263746;font:inherit;font-size:12px;font-weight:850;
        cursor:pointer;box-shadow:0 1px 4px rgba(15,23,42,.08);
      }
      .${BUTTON_CLASS}:hover,.${BUTTON_CLASS}:focus-visible{
        background:linear-gradient(180deg,#ffffff 0%,#dfe6ec 100%);
        border-color:#7f93a6;outline:none;
      }
      .qmes-ipad-number-field{position:relative!important;}
      .qmes-ipad-number-field>input{padding-right:38px!important;}
      .${SPIN_CLASS}{
        position:absolute;right:5px;bottom:5px;z-index:3;
        width:29px;height:38px;display:grid;grid-template-rows:1fr 1fr;
        overflow:hidden;border:1px solid #b8c4cf;border-radius:7px;
        background:#f4f6f8;box-shadow:0 1px 3px rgba(15,23,42,.06);
      }
      .${SPIN_CLASS} button{
        min-width:0!important;width:100%!important;height:19px!important;min-height:0!important;
        padding:0!important;margin:0!important;border:0!important;border-radius:0!important;
        background:transparent!important;color:#536273!important;font-size:9px!important;
        line-height:18px!important;cursor:pointer!important;box-shadow:none!important;
      }
      .${SPIN_CLASS} button:first-child{border-bottom:1px solid #cbd3da!important;}
      .${SPIN_CLASS} button:hover,.${SPIN_CLASS} button:focus-visible{background:#e5eaf0!important;color:#17212b!important;outline:none!important;}
    `;
    document.head.appendChild(style);
  }

  function setReactInputValue(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (descriptor && descriptor.set) descriptor.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles:true }));
    input.dispatchEvent(new Event("change", { bubbles:true }));
  }

  function addMaterial(input) {
    const raw = window.prompt("추가할 원자재명을 입력하세요.");
    if (raw === null) return;
    const name = String(raw).trim();
    if (!name) {
      window.alert("원자재명을 입력하세요.");
      return;
    }

    const defaults = typeof window.IQC_MATERIALS !== "undefined" && Array.isArray(window.IQC_MATERIALS)
      ? window.IQC_MATERIALS
      : (typeof IQC_MATERIALS !== "undefined" && Array.isArray(IQC_MATERIALS) ? IQC_MATERIALS : []);
    const saved = Array.isArray(window.DB?.iqcMaterials) ? window.DB.iqcMaterials : [];
    const all = [...defaults, ...saved];
    const existing = all.find((item) => String(item).trim().toLowerCase() === name.toLowerCase());
    const selected = existing || name;

    if (!existing) {
      window.DB.iqcMaterials = [...saved, name];
      if (typeof window.dbSave === "function") window.dbSave();
      else if (typeof dbSave === "function") dbSave();
    }

    const list = document.getElementById("qmes-ipad-materials");
    if (list && !Array.from(list.options).some((option) => option.value.toLowerCase() === selected.toLowerCase())) {
      const option = document.createElement("option");
      option.value = selected;
      list.appendChild(option);
    }

    setReactInputValue(input, selected);
    input.focus();
  }

  function numberStepFor(labelText) {
    if (/입고중량|출하량|출하수량/.test(labelText)) return 1;
    if (/검사수량|불량수량/.test(labelText)) return 1;
    return null;
  }

  function stepNumber(input, delta, labelText) {
    const step = numberStepFor(labelText) || 1;
    const current = Number(String(input.value || "").replace(/,/g, ""));
    let next = (Number.isFinite(current) ? current : 0) + delta * step;
    if (next < 0) next = 0;
    if (/검사수량/.test(labelText) && next < 1) next = 1;
    setReactInputValue(input, String(next));
    input.focus();
  }

  function enhanceMaterial() {
    const input = document.querySelector('.qmes-ipad-pop input[list="qmes-ipad-materials"]');
    if (!input) return;
    const label = input.closest("label");
    if (!label || label.querySelector(`.${BUTTON_CLASS}`)) return;

    label.classList.add("qmes-ipad-material-field");
    const button = document.createElement("button");
    button.type = "button";
    button.className = BUTTON_CLASS;
    button.textContent = "+ 추가";
    button.setAttribute("aria-label", "원자재명 추가");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      addMaterial(input);
    });
    label.appendChild(button);
  }

  function enhanceNumbers() {
    document.querySelectorAll(".qmes-ipad-form-grid label").forEach((label) => {
      if (label.querySelector(`.${SPIN_CLASS}`)) return;
      const title = String(label.querySelector("span")?.textContent || "").replace(/\s+/g, " ").trim();
      if (!/입고중량|검사수량|불량수량|출하량|출하수량/.test(title)) return;
      const input = label.querySelector("input");
      if (!input || input.type === "date") return;

      label.classList.add("qmes-ipad-number-field");
      const stepper = document.createElement("span");
      stepper.className = SPIN_CLASS;
      stepper.setAttribute("aria-hidden", "false");

      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "▲";
      up.setAttribute("aria-label", `${title} 증가`);
      up.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        stepNumber(input, 1, title);
      });

      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "▼";
      down.setAttribute("aria-label", `${title} 감소`);
      down.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        stepNumber(input, -1, title);
      });

      stepper.append(up, down);
      label.appendChild(stepper);
    });
  }

  function enhance() {
    ensureStyle();
    enhanceMaterial();
    enhanceNumbers();
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhance, { once:true });
  else enhance();
})();