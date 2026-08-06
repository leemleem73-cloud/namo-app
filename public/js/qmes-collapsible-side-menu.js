(function(){
  "use strict";
  if(window.__QMES_COLLAPSIBLE_SIDE_MENU_V5__) return;
  window.__QMES_COLLAPSIBLE_SIDE_MENU_V5__=true;

  const groups=[
    ["대시보드",["종합 대시보드","SPC 대시보드"]],
    ["생산관리",["생산실적","작업지시서","중간배치"]],
    ["품질검사",["수입검사","공정검사","출하검사","출하성적서"]],
    ["재고관리",["재고관리"]],
    ["거래처 현황",["거래처 현황"]],
    ["설비관리",["설비관리"]],
    ["LOT 추적",["LOT 추적"]],
    ["부적합관리",["부적합","고객불만","4M 변경관리"]]
  ];
  const parentByItem={
    "종합 대시보드":"대시보드","SPC 대시보드":"대시보드",
    "생산실적":"생산관리","작업지시서":"생산관리","중간배치":"생산관리",
    "수입검사":"품질검사","공정검사":"품질검사","출하검사":"품질검사","출하성적서":"품질검사",
    "부적합":"부적합관리","고객불만":"부적합관리","4M 변경관리":"부적합관리"
  };
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const visible=node=>!!(node&&node.getClientRects().length&&getComputedStyle(node).visibility!=="hidden");
  const buttons=()=>Array.from(document.querySelectorAll("button,a,[role='button']")).filter(visible);
  const findButton=label=>buttons().find(node=>clean(node.textContent)===label)||buttons().find(node=>clean(node.textContent).includes(label));

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu"].forEach(id=>document.getElementById(id)?.remove());
  document.getElementById("qmes-side-menu-v4-style")?.remove();
  document.getElementById("qmes-side-menu-v5-style")?.remove();

  const style=document.createElement("style");
  style.id="qmes-side-menu-v5-style";
  style.textContent=`
    #qmes-side-toggle{display:flex!important;align-items:center!important;justify-content:center!important;align-self:stretch!important;flex:0 0 46px!important;width:46px!important;min-height:44px!important;margin:0!important;padding:0!important;border:0!important;border-right:1px solid rgba(255,255,255,.08)!important;background:transparent!important;color:#e2e8f0!important;font-size:21px!important;font-weight:900!important;line-height:1!important;cursor:pointer!important;position:relative!important;z-index:30020!important}
    #qmes-side-toggle:hover{background:#1e293b!important;color:#fff!important}
    #qmes-side-overlay{position:fixed!important;inset:0!important;z-index:30000!important;display:none!important;background:rgba(2,6,23,.55)!important}
    #qmes-side-overlay.is-open{display:block!important}
    #qmes-side-menu{position:fixed!important;left:0!important;top:0!important;bottom:0!important;z-index:30010!important;width:300px!important;max-width:88vw!important;display:none!important;background:#0b1728!important;border-right:1px solid #475569!important;box-shadow:24px 0 70px rgba(0,0,0,.65)!important;overflow-y:auto!important;padding:18px 14px 26px!important;color:#e2e8f0!important}
    #qmes-side-menu.is-open{display:block!important}
    #qmes-side-menu .head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:2px 4px 14px!important;border-bottom:1px solid #334155!important;margin-bottom:10px!important}
    #qmes-side-menu .head strong{font-size:17px!important;font-weight:900!important;color:#fff!important}
    #qmes-side-menu .close{display:flex!important;align-items:center!important;justify-content:center!important;width:34px!important;height:34px!important;border:1px solid #475569!important;border-radius:8px!important;background:#132238!important;color:#fff!important;font-size:20px!important;cursor:pointer!important}
    #qmes-side-menu .group{padding:8px 0 10px!important;border-bottom:1px solid rgba(51,65,85,.6)!important}
    #qmes-side-menu .title{padding:8px 10px 6px!important;color:#7dd3fc!important;font-size:13px!important;font-weight:900!important}
    #qmes-side-menu .item{display:flex!important;width:100%!important;min-height:40px!important;align-items:center!important;padding:9px 13px 9px 22px!important;margin:2px 0!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#cbd5e1!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important}
    #qmes-side-menu .item:hover{background:#20354f!important;color:#fff!important}
  `;
  document.head.appendChild(style);

  const toggle=document.createElement("button");
  toggle.id="qmes-side-toggle";toggle.type="button";toggle.textContent="☰";toggle.setAttribute("aria-label","왼쪽 메뉴 열기");
  const overlay=document.createElement("div");overlay.id="qmes-side-overlay";
  const menu=document.createElement("aside");menu.id="qmes-side-menu";
  menu.innerHTML='<div class="head"><strong>QMES 메뉴</strong><button type="button" class="close">×</button></div><div class="body"></div>';
  document.body.append(overlay,menu);

  const body=menu.querySelector(".body");
  groups.forEach(([title,items])=>{
    const section=document.createElement("section");section.className="group";
    const heading=document.createElement("div");heading.className="title";heading.textContent=title;section.appendChild(heading);
    items.forEach(label=>{const button=document.createElement("button");button.type="button";button.className="item";button.textContent=label;section.appendChild(button);});
    body.appendChild(section);
  });

  const mount=()=>{const nav=document.querySelector(".qmes-top-menu");if(nav&&toggle.parentElement!==nav)nav.insertBefore(toggle,nav.firstChild);};
  const open=()=>{menu.classList.add("is-open");overlay.classList.add("is-open");};
  const close=()=>{menu.classList.remove("is-open");overlay.classList.remove("is-open");};
  const navigate=label=>{
    const parent=parentByItem[label];
    if(parent){
      const top=findButton(parent);
      if(top)top.click();
      window.setTimeout(()=>{const target=findButton(label);if(target)target.click();},80);
      return;
    }
    const target=findButton(label);
    if(target)target.click();
  };

  toggle.onclick=event=>{event.preventDefault();event.stopPropagation();open();};
  overlay.onclick=close;menu.querySelector(".close").onclick=close;
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
  body.onclick=event=>{
    const button=event.target.closest(".item");if(!button)return;
    const label=clean(button.textContent);close();
    window.setTimeout(()=>navigate(label),0);
  };

  mount();
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
})();