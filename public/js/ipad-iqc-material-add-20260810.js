(function () {
  const STYLE_ID = "qmes-ipad-iqc-material-add-style";
  const BUTTON_CLASS = "qmes-ipad-material-add-btn";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .qmes-ipad-material-field{position:relative!important;}
      .qmes-ipad-material-field>span{padding-right:72px!important;}
      .${BUTTON_CLASS}{
        position:absolute;right:8px;top:7px;z-index:2;
        min-width:58px;height:28px;padding:0 10px;
        border:1px solid #a8b6c3;border-radius:8px;
        background:linear-gradient(180deg,#f8fafc 0%,#e8edf2 100%);
        color:#263746;font:inherit;font-size:12px;font-weight:850;
        cursor:pointer;box-shadow:0 2px 6px rgba(15,23,42,.08);
      }
      .${BUTTON_CLASS}:hover,.${BUTTON_CLASS}:focus-visible{
        background:linear-gradient(180deg,#ffffff 0%,#dfe6ec 100%);
        border-color:#7f93a6;outline:none;
      }
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

  function enhance() {
    ensureStyle();
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

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhance, { once:true });
  else enhance();
})();
