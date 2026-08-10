(function () {
  const STYLE_ID = "qmes-ipad-iqc-material-add-style";
  const BUTTON_CLASS = "qmes-ipad-material-add-btn";
  const SPIN_CLASS = "qmes-ipad-number-stepper";
  const DROPDOWN_CLASS = "qmes-ipad-custom-dropdown";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .qmes-ipad-material-field{position:relative!important;}
      .qmes-ipad-material-field>input{padding-right:72px!important;}
      .${BUTTON_CLASS}{
        position:absolute;right:7px;bottom:11px;z-index:3;
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
        position:absolute;right:5px;bottom:8px;z-index:3;
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
      .qmes-ipad-pop input[data-qmes-list-id]{
        color-scheme:light!important;
        background:#fff!important;
        color:#111827!important;
      }
      .qmes-ipad-pop input[data-qmes-list-id]::placeholder,
      .qmes-ipad-pop input.lot::placeholder{
        font-family:Pretendard,system-ui,sans-serif!important;
        font-size:16px!important;
        font-weight:400!important;
        letter-spacing:0!important;
        color:#94a3b8!important;
      }
      .qmes-ipad-custom-list-field{position:relative!important;}
      .${DROPDOWN_CLASS}{
        position:absolute;left:0;right:0;top:100%;z-index:1000;
        display:none;max-height:230px;overflow-y:auto;margin-top:5px;
        padding:5px;background:#fff!important;color:#111827!important;
        border:1px solid #cbd5e1;border-radius:10px;
        box-shadow:0 10px 26px rgba(15,23,42,.18);
      }
      .${DROPDOWN_CLASS}.is-open{display:block!important;}
      .${DROPDOWN_CLASS} button{
        display:block!important;width:100%!important;min-height:38px!important;
        padding:8px 10px!important;margin:0!important;border:0!important;border-radius:7px!important;
        background:#fff!important;color:#111827!important;
        font-family:Pretendard,system-ui,sans-serif!important;font-size:14px!important;font-weight:600!important;
        text-align:left!important;cursor:pointer!important;box-shadow:none!important;
      }
      .${DROPDOWN_CLASS} button:hover,.${DROPDOWN_CLASS} button:focus-visible{
        background:#f1f5f9!important;color:#000!important;outline:none!important;
      }
      .${DROPDOWN_CLASS} .qmes-ipad-empty-option{
        padding:10px;color:#64748b;background:#fff;font-size:13px;text-align:left;
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
    input.dispatchEvent(new Event("focus", { bubbles:true }));
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
    const input = document.querySelector('.qmes-ipad-pop input[list="qmes-ipad-materials"], .qmes-ipad-pop input[data-qmes-list-id="qmes-ipad-materials"]');
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

  function getListValues(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    return Array.from(list.querySelectorAll("option"))
      .map((option) => String(option.value || option.textContent || "").trim())
      .filter(Boolean);
  }

  function renderDropdown(input, dropdown) {
    const listId = input.dataset.qmesListId;
    const query = String(input.value || "").trim().toLowerCase();
    const values = [...new Set(getListValues(listId))]
      .filter((value) => !query || value.toLowerCase().includes(query))
      .slice(0, 40);

    dropdown.innerHTML = "";
    if (!values.length) {
      const empty = document.createElement("div");
      empty.className = "qmes-ipad-empty-option";
      empty.textContent = "일치하는 목록이 없습니다.";
      dropdown.appendChild(empty);
      return;
    }

    values.forEach((value) => {
      const option = document.createElement("button");
      option.type = "button";
      option.textContent = value;
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setReactInputValue(input, value);
        dropdown.classList.remove("is-open");
        input.focus();
      });
      dropdown.appendChild(option);
    });
  }

  function enhanceCustomListInput(input) {
    if (!input || input.dataset.qmesCustomList === "1") return;
    const listId = input.getAttribute("list");
    if (!listId || !/^(qmes-ipad-materials|qmes-ipad-lots)$/.test(listId)) return;

    input.dataset.qmesCustomList = "1";
    input.dataset.qmesListId = listId;
    input.removeAttribute("list");

    const label = input.closest("label");
    if (!label) return;
    label.classList.add("qmes-ipad-custom-list-field");

    const dropdown = document.createElement("div");
    dropdown.className = DROPDOWN_CLASS;
    dropdown.setAttribute("role", "listbox");
    label.appendChild(dropdown);

    const open = () => {
      renderDropdown(input, dropdown);
      dropdown.classList.add("is-open");
    };
    input.addEventListener("focus", open);
    input.addEventListener("click", open);
    input.addEventListener("input", open);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dropdown.classList.remove("is-open");
    });
  }

  function enhanceCustomLists() {
    document.querySelectorAll('.qmes-ipad-pop input[list="qmes-ipad-materials"], .qmes-ipad-pop input[list="qmes-ipad-lots"]').forEach(enhanceCustomListInput);
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
    enhanceCustomLists();
    enhanceNumbers();
  }

  document.addEventListener("pointerdown", (event) => {
    document.querySelectorAll(`.${DROPDOWN_CLASS}.is-open`).forEach((dropdown) => {
      if (!dropdown.parentElement?.contains(event.target)) dropdown.classList.remove("is-open");
    });
  });

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhance, { once:true });
  else enhance();
})();