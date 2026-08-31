(function restoreQmesUserDropdown(){
  const DROPDOWN_ID = "qmes-user-dropdown";
  const PROFILE_BUTTON_SELECTOR = 'button[aria-label="계정 설정 열기"]';
  let closeTimer = null;
  let allowNativeProfileClick = false;
  let boundButton = null;
  let observer = null;
  let started = false;

  function currentUserReady(){
    const user = window.__QMES_CURRENT_USER__;
    return Boolean(user && typeof user === "object" && (user.id || user.uid || user.name));
  }

  function getProfileButton(){
    return document.querySelector(PROFILE_BUTTON_SELECTOR);
  }

  function ensureDropdown(){
    let dropdown = document.getElementById(DROPDOWN_ID);
    if(dropdown) return dropdown;

    dropdown = document.createElement("div");
    dropdown.id = DROPDOWN_ID;
    dropdown.setAttribute("role", "menu");
    dropdown.setAttribute("aria-label", "사용자 메뉴");
    dropdown.innerHTML = [
      '<button type="button" class="qmes-dropdown-password" role="menuitem">비밀번호 변경</button>',
      '<button type="button" class="qmes-dropdown-logout" role="menuitem">로그아웃</button>'
    ].join("");
    document.body.appendChild(dropdown);

    dropdown.addEventListener("mouseenter", cancelClose);
    dropdown.addEventListener("mouseleave", scheduleClose);

    dropdown.querySelector(".qmes-dropdown-password")?.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();
      openHiddenAccountAction("비밀번호 변경");
    });

    dropdown.querySelector(".qmes-dropdown-logout")?.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();
      openHiddenAccountAction("로그아웃");
    });

    return dropdown;
  }

  function positionDropdown(){
    const button = getProfileButton();
    const dropdown = document.getElementById(DROPDOWN_ID);
    if(!button || !dropdown) return;

    const rect = button.getBoundingClientRect();
    const width = Math.max(190, dropdown.offsetWidth || 190);
    const left = Math.min(
      Math.max(8, rect.right - width),
      Math.max(8, window.innerWidth - width - 8)
    );

    dropdown.style.left = left + "px";
    dropdown.style.top = Math.min(window.innerHeight - 8, rect.bottom + 6) + "px";
  }

  function openDropdown(){
    cancelClose();
    const dropdown = ensureDropdown();
    positionDropdown();
    dropdown.classList.add("is-open");
    getProfileButton()?.setAttribute("aria-expanded", "true");
  }

  function closeDropdown(){
    const dropdown = document.getElementById(DROPDOWN_ID);
    dropdown?.classList.remove("is-open");
    getProfileButton()?.setAttribute("aria-expanded", "false");
  }

  function cancelClose(){
    if(closeTimer){
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function scheduleClose(){
    cancelClose();
    closeTimer = setTimeout(closeDropdown, 220);
  }

  function clickNativeProfileButton(){
    const button = getProfileButton();
    if(!button) return false;
    allowNativeProfileClick = true;
    try{
      button.click();
    }finally{
      allowNativeProfileClick = false;
    }
    return true;
  }

  function openHiddenAccountAction(actionText){
    closeDropdown();
    if(!clickNativeProfileButton()) return;

    let attempts = 0;
    const tryAction = function(){
      attempts += 1;
      const dialog = document.querySelector('[role="dialog"][aria-label="계정 설정"]');
      if(dialog){
        const target = Array.from(dialog.querySelectorAll("button")).find(function(button){
          return String(button.textContent || "").includes(actionText);
        });
        if(target){
          target.click();
          return;
        }
      }
      if(attempts < 12) setTimeout(tryAction, 25);
    };
    setTimeout(tryAction, 0);
  }

  function bindProfileButton(){
    const button = getProfileButton();
    if(!button || button === boundButton) return;
    boundButton = button;

    button.addEventListener("mouseenter", openDropdown);
    button.addEventListener("mouseleave", scheduleClose);
    button.addEventListener("focus", openDropdown);
    button.addEventListener("blur", scheduleClose);
    button.addEventListener("click", function(event){
      if(allowNativeProfileClick) return;
      event.preventDefault();
      event.stopPropagation();
      if(document.getElementById(DROPDOWN_ID)?.classList.contains("is-open")) closeDropdown();
      else openDropdown();
    }, true);
  }

  function startAuthenticatedRuntime(){
    if(started || !currentUserReady()) return false;
    started = true;

    document.addEventListener("mousedown", function(event){
      const dropdown = document.getElementById(DROPDOWN_ID);
      const button = getProfileButton();
      if(!dropdown?.classList.contains("is-open")) return;
      if(dropdown.contains(event.target) || button?.contains(event.target)) return;
      closeDropdown();
    });

    document.addEventListener("keydown", function(event){
      if(event.key === "Escape") closeDropdown();
    });

    window.addEventListener("resize", function(){
      if(document.getElementById(DROPDOWN_ID)?.classList.contains("is-open")) positionDropdown();
    });
    window.addEventListener("scroll", function(){
      if(document.getElementById(DROPDOWN_ID)?.classList.contains("is-open")) positionDropdown();
    }, true);

    observer = new MutationObserver(bindProfileButton);
    observer.observe(document.documentElement, { childList:true, subtree:true });
    bindProfileButton();
    return true;
  }

  function waitForAuthenticatedRuntime(){
    if(startAuthenticatedRuntime()) return;
    let attempts = 0;
    const retry = function(){
      if(startAuthenticatedRuntime()) return;
      attempts += 1;
      if(attempts < 120) setTimeout(retry, 50);
    };
    setTimeout(retry, 0);
  }

  if(currentUserReady()) startAuthenticatedRuntime();
  else window.addEventListener("qmes:auth-bootstrap-settled", function(event){
    if(event?.detail?.state === "authenticated") waitForAuthenticatedRuntime();
  });
})();
