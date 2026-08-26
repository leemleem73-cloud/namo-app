/* QMES unified top submenu v3 — stable hover mapping for enterprise UI. */
(function(){
  "use strict";
  if(window.__QMES_TOP_SUBMENU_RESTORE_V3__)return;
  window.__QMES_TOP_SUBMENU_RESTORE_V3__=true;
  window.__QMES_TOP_SUBMENU_RESTORE__=true;

  const menuMap={
    "대시보드":[
      {label:"종합 대시보드",direct:"대시보드"},
      {label:"SPC 대시보드",group:"품질검사",sub:"SPC (Cpk)"}
    ],
    "생산관리":[
      {label:"생산 진행",group:"생산관리",sub:"생산 (배치)"},
      {label:"작업지시서",group:"생산관리",sub:"작업지시서"},
      {label:"생산공정 관리",tab:"prodProcess",openMenu:"productionMenu"}
    ],
    "품질검사":[
      {label:"수입검사 (IQC)",group:"품질검사",sub:"수입검사 (IQC)"},
      {label:"공정검사 (PQC)",group:"품질검사",sub:"공정검사 (PQC)"},
      {label:"출하검사 (OQC)",group:"품질검사",sub:"출하검사 (OQC)"},
      {label:"SPC (Cpk)",group:"품질검사",sub:"SPC (Cpk)"},
      {label:"품질 인터락",group:"품질검사",sub:"품질 인터락 (차단)"},
      {label:"출하성적서",group:"품질검사",sub:"출하성적서"}
    ],
    "현장입력":[{label:"현장 입력 (iPad)",direct:"현장입력"}],
    "재고관리":[
      {label:"재고현황",inventorySection:"overview"},
      {label:"입출고 관리",inventorySection:"movement"},
      {label:"LOT별 재고",inventorySection:"lot"},
      {label:"생산투입/완료",inventorySection:"production"},
      {label:"재고실사",inventorySection:"count"}
    ],
    "거래처 현황":[{label:"거래처 현황",direct:"거래처 현황"}],
    "설비관리":[{label:"설비 모니터링",direct:"설비관리"}],
    "LOT 추적":[{label:"LOT 추적",direct:"LOT 추적"}],
    "부적합관리":[
      {label:"부적합 (8D)",group:"부적합관리",sub:"부적합 (8D)"},
      {label:"고객불만 (GQMS)",group:"부적합관리",sub:"고객불만 (GQMS)"},
      {label:"4M 변경관리",group:"부적합관리",sub:"4M 변경관리"}
    ]
  };

  const clean=value=>String(value||"").replace(/[›〉▣]/g,"").replace(/\s+/g," ").trim();
  const topButtons=()=>Array.from(document.querySelectorAll(".qmes-top-menu-button"));
  const buttonLabel=button=>{
    if(!button)return "";
    if(button.closest("[data-qmes-inventory-menu]"))return "재고관리";
    const span=button.querySelector(":scope > span")||button.querySelector("span");
    return clean(span?.textContent||button.textContent);
  };
  const findTopButton=label=>topButtons().find(button=>buttonLabel(button)===label);
  const findSub=label=>Array.from(document.querySelectorAll(".qmes-submenu-button")).find(button=>clean(button.textContent)===clean(label));

  let activeButton=null;
  let activeLabel="";
  let closeTimer=null;

  function ensureMenu(){
    let menu=document.getElementById("qmes-all-menu-dropdown");
    if(!menu){
      menu=document.createElement("div");
      menu.id="qmes-all-menu-dropdown";
      menu.setAttribute("role","menu");
      document.body.appendChild(menu);
    }
    if(!menu.dataset.enterpriseBound){
      menu.dataset.enterpriseBound="1";
      menu.addEventListener("mouseenter",cancelClose);
      menu.addEventListener("mouseleave",scheduleClose);
    }
    return menu;
  }
  function cancelClose(){if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}}
  function closeMenu(){cancelClose();const menu=document.getElementById("qmes-all-menu-dropdown");menu?.classList.remove("is-open");activeButton=null;activeLabel="";}
  function scheduleClose(){cancelClose();closeTimer=setTimeout(closeMenu,150);}

  function positionMenu(button,menu){
    if(!button||!menu)return;
    const rect=button.getBoundingClientRect();
    const width=Math.max(220,Math.min(270,menu.offsetWidth||230));
    const left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left));
    menu.style.left=`${Math.round(left)}px`;
    menu.style.top=`${Math.round(rect.bottom)}px`;
  }

  function navigateItem(item){
    closeMenu();
    if(item.inventorySection){
      try{sessionStorage.setItem("qmes_inventory_section",item.inventorySection);}catch(_error){}
      window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab:"inv"}}));
      window.dispatchEvent(new CustomEvent("qmes:inventory-section",{detail:{section:item.inventorySection}}));
      return;
    }
    if(item.tab){
      window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab:item.tab,openMenu:item.openMenu||null}}));
      return;
    }
    if(item.direct){
      const direct=findTopButton(item.direct);
      if(direct){direct.click();return;}
    }
    const existing=findSub(item.sub);
    if(existing){existing.click();return;}
    const group=findTopButton(item.group);
    if(!group)return;
    group.click();
    requestAnimationFrame(()=>requestAnimationFrame(()=>findSub(item.sub)?.click()));
  }

  function renderFor(button){
    const label=buttonLabel(button);
    const items=menuMap[label];
    if(!items?.length){closeMenu();return;}
    cancelClose();
    const menu=ensureMenu();
    activeButton=button;
    activeLabel=label;
    menu.replaceChildren();
    const title=document.createElement("div");
    title.className="qmes-hover-title";
    title.textContent=label;
    menu.appendChild(title);
    items.forEach(item=>{
      const row=document.createElement("button");
      row.type="button";
      row.textContent=item.label;
      row.setAttribute("role","menuitem");
      row.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();navigateItem(item);});
      menu.appendChild(row);
    });
    menu.classList.add("is-open");
    positionMenu(button,menu);
  }

  function handlePointerOver(event){
    const button=event.target.closest?.(".qmes-top-menu-button");
    if(!button)return;
    const label=buttonLabel(button);
    if(!menuMap[label]){closeMenu();return;}
    if(button!==activeButton||label!==activeLabel)renderFor(button);
    else{cancelClose();positionMenu(button,ensureMenu());}
  }
  function handlePointerOut(event){
    const button=event.target.closest?.(".qmes-top-menu-button");
    if(!button)return;
    const next=event.relatedTarget;
    if(next?.closest?.("#qmes-all-menu-dropdown")||next?.closest?.(".qmes-top-menu-button"))return;
    scheduleClose();
  }

  document.addEventListener("pointerover",handlePointerOver,true);
  document.addEventListener("pointerout",handlePointerOut,true);
  document.addEventListener("click",event=>{
    const menu=document.getElementById("qmes-all-menu-dropdown");
    if(menu&&!menu.contains(event.target)&&!event.target.closest?.(".qmes-top-menu-button"))closeMenu();
  },true);
  window.addEventListener("resize",()=>{if(activeButton&&document.getElementById("qmes-all-menu-dropdown")?.classList.contains("is-open"))positionMenu(activeButton,ensureMenu());});
  window.addEventListener("scroll",()=>{if(activeButton&&document.getElementById("qmes-all-menu-dropdown")?.classList.contains("is-open"))positionMenu(activeButton,ensureMenu());},true);
})();
