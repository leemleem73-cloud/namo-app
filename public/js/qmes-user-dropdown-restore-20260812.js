(function restoreQmesUserDropdown(){
  "use strict";
  const DROPDOWN_ID="qmes-user-dropdown";
  const PROFILE_BUTTON_SELECTOR='button[aria-label="계정 설정 열기"]';
  let closeTimer=null;
  let allowNativeProfileClick=false;
  let boundButton=null;
  let observer=null;
  let started=false;
  let styleSyncTimer=null;

  function currentUserReady(){
    const user=window.__QMES_CURRENT_USER__;
    return Boolean(user&&typeof user==="object"&&(user.id||user.uid||user.name));
  }

  function getProfileButton(){return document.querySelector(PROFILE_BUTTON_SELECTOR);}

  function getReferenceAction(){
    const buttons=Array.from(document.querySelectorAll(".qmes-header-controls button"));
    return buttons.find(button=>String(button.textContent||"").trim()==="복원")
      ||buttons.find(button=>String(button.textContent||"").trim()==="백업")
      ||buttons.find(button=>button.classList.contains("qmes-header-action"));
  }

  const COPY_PROPERTIES=[
    "display","align-items","justify-content","gap","min-height","height",
    "padding-top","padding-right","padding-bottom","padding-left",
    "border-top-width","border-right-width","border-bottom-width","border-left-width",
    "border-top-style","border-right-style","border-bottom-style","border-left-style",
    "border-top-color","border-right-color","border-bottom-color","border-left-color",
    "border-top-left-radius","border-top-right-radius","border-bottom-right-radius","border-bottom-left-radius",
    "background-color","background-image","background-position","background-size","background-repeat",
    "color","box-shadow","font-size","font-weight","line-height","white-space"
  ];

  function copyReferenceStyle(target,reference){
    if(!target||!reference||target===reference)return;
    const computed=getComputedStyle(reference);
    target.classList.add("qmes-header-action");
    COPY_PROPERTIES.forEach(property=>{
      const value=computed.getPropertyValue(property);
      if(value)target.style.setProperty(property,value,"important");
    });
    const textColor=computed.getPropertyValue("color")||"#fff";
    target.style.setProperty("-webkit-text-fill-color",textColor,"important");
    target.querySelectorAll("span,div,svg").forEach(node=>{
      node.style.setProperty("color",textColor,"important");
      node.style.setProperty("-webkit-text-fill-color",textColor,"important");
      if(node.tagName&&node.tagName.toLowerCase()==="svg"){
        node.style.setProperty("stroke",textColor,"important");
      }
    });
  }

  function syncHeaderActions(){
    const reference=getReferenceAction();
    if(!reference)return false;
    const noticeTargets=Array.from(document.querySelectorAll('button[aria-label^="NAMO Talk 알림"]'))
      .filter(button=>!button.closest("#qmes-erp-header"));
    const targets=[
      ...noticeTargets,
      ...document.querySelectorAll('button[aria-label="NAMO Talk 열기"],button[aria-label="NAMO Talk 닫기"]'),
      ...document.querySelectorAll(PROFILE_BUTTON_SELECTOR)
    ];
    targets.forEach(button=>copyReferenceStyle(button,reference));

    const profile=getProfileButton();
    const avatar=profile?.querySelector("div:first-child");
    if(avatar){
      const color=getComputedStyle(reference).color;
      avatar.style.setProperty("background","transparent","important");
      avatar.style.setProperty("border-color","transparent","important");
      avatar.style.setProperty("color",color,"important");
      avatar.style.setProperty("-webkit-text-fill-color",color,"important");
    }
    return targets.length>0;
  }

  function ensureDropdown(){
    let dropdown=document.getElementById(DROPDOWN_ID);
    if(dropdown)return dropdown;
    dropdown=document.createElement("div");
    dropdown.id=DROPDOWN_ID;
    dropdown.setAttribute("role","menu");
    dropdown.setAttribute("aria-label","사용자 메뉴");
    dropdown.innerHTML='<button type="button" class="qmes-dropdown-password" role="menuitem">비밀번호 변경</button><button type="button" class="qmes-dropdown-logout" role="menuitem">로그아웃</button>';
    document.body.appendChild(dropdown);
    dropdown.addEventListener("mouseenter",cancelClose);
    dropdown.addEventListener("mouseleave",scheduleClose);
    dropdown.querySelector(".qmes-dropdown-password")?.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();openHiddenAccountAction("비밀번호 변경");
    });
    dropdown.querySelector(".qmes-dropdown-logout")?.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();openHiddenAccountAction("로그아웃");
    });
    return dropdown;
  }

  function positionDropdown(){
    const button=getProfileButton();
    const dropdown=document.getElementById(DROPDOWN_ID);
    if(!button||!dropdown)return;
    const rect=button.getBoundingClientRect();
    const width=Math.max(190,dropdown.offsetWidth||190);
    const left=Math.min(Math.max(8,rect.right-width),Math.max(8,window.innerWidth-width-8));
    dropdown.style.setProperty("left",left+"px","important");
    dropdown.style.setProperty("top",Math.round(rect.bottom+6)+"px","important");
  }

  function openDropdown(){
    cancelClose();
    syncHeaderActions();
    const dropdown=ensureDropdown();
    positionDropdown();
    dropdown.classList.add("is-open");
    getProfileButton()?.setAttribute("aria-expanded","true");
  }

  function closeDropdown(){
    document.getElementById(DROPDOWN_ID)?.classList.remove("is-open");
    getProfileButton()?.setAttribute("aria-expanded","false");
  }

  function cancelClose(){if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}}
  function scheduleClose(){cancelClose();closeTimer=setTimeout(closeDropdown,260);}

  function clickNativeProfileButton(){
    const button=getProfileButton();
    if(!button)return false;
    allowNativeProfileClick=true;
    try{button.click();}finally{allowNativeProfileClick=false;}
    return true;
  }

  function openHiddenAccountAction(actionText){
    closeDropdown();
    if(!clickNativeProfileButton())return;
    let attempts=0;
    const tryAction=()=>{
      attempts+=1;
      const dialog=document.querySelector('[role="dialog"][aria-label="계정 설정"]');
      if(dialog){
        const target=Array.from(dialog.querySelectorAll("button")).find(button=>String(button.textContent||"").includes(actionText));
        if(target){target.click();return;}
      }
      if(attempts<30)setTimeout(tryAction,25);
    };
    setTimeout(tryAction,0);
  }

  function bindProfileButton(){
    syncHeaderActions();
    const button=getProfileButton();
    if(!button||button===boundButton)return;
    boundButton=button;
    button.addEventListener("pointerenter",openDropdown,{passive:true});
    button.addEventListener("mouseenter",openDropdown,{passive:true});
    button.addEventListener("mouseleave",scheduleClose,{passive:true});
    button.addEventListener("focus",openDropdown);
    button.addEventListener("blur",scheduleClose);
    button.addEventListener("click",event=>{
      if(allowNativeProfileClick)return;
      event.preventDefault();event.stopPropagation();
      if(document.getElementById(DROPDOWN_ID)?.classList.contains("is-open"))closeDropdown();else openDropdown();
    },true);
  }

  function startAuthenticatedRuntime(){
    if(started||!currentUserReady())return false;
    started=true;
    syncHeaderActions();
    bindProfileButton();

    document.addEventListener("mousedown",event=>{
      const dropdown=document.getElementById(DROPDOWN_ID);
      const button=getProfileButton();
      if(!dropdown?.classList.contains("is-open"))return;
      if(dropdown.contains(event.target)||button?.contains(event.target))return;
      closeDropdown();
    });
    document.addEventListener("keydown",event=>{if(event.key==="Escape")closeDropdown();});
    window.addEventListener("resize",()=>{syncHeaderActions();if(document.getElementById(DROPDOWN_ID)?.classList.contains("is-open"))positionDropdown();});
    window.addEventListener("scroll",()=>{if(document.getElementById(DROPDOWN_ID)?.classList.contains("is-open"))positionDropdown();},true);

    observer=new MutationObserver(()=>{syncHeaderActions();bindProfileButton();});
    observer.observe(document.documentElement,{childList:true,subtree:true});

    let syncCount=0;
    styleSyncTimer=setInterval(()=>{
      syncCount+=1;
      syncHeaderActions();
      bindProfileButton();
      if(syncCount>=40){clearInterval(styleSyncTimer);styleSyncTimer=null;}
    },125);
    return true;
  }

  function waitForAuthenticatedRuntime(){
    if(startAuthenticatedRuntime())return;
    let attempts=0;
    const retry=()=>{
      if(startAuthenticatedRuntime())return;
      attempts+=1;
      if(attempts<400)setTimeout(retry,50);
    };
    retry();
  }

  waitForAuthenticatedRuntime();
  window.addEventListener("qmes:auth-bootstrap-settled",event=>{
    if(event?.detail?.state==="authenticated")waitForAuthenticatedRuntime();
  });
})();