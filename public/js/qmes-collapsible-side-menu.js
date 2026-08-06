(function(){
  "use strict";
  if(window.__QMES_COLLAPSIBLE_SIDE_MENU__) return;
  window.__QMES_COLLAPSIBLE_SIDE_MENU__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const groups=[
    ["대시보드",["대시보드","SPC (Cpk)"]],
    ["생산관리",["생산관리","작업지시서"]],
    ["품질검사",["수입검사","공정검사","출하검사","SPC","품질 인터락","출하성적서"]],
    ["현장입력",["현장입력"]],
    ["재고관리",["재고관리"]],
    ["거래처 현황",["거래처 현황"]],
    ["설비관리",["설비관리"]],
    ["LOT 추적",["LOT 추적"]],
    ["부적합관리",["부적합","고객불만","4M"]]
  ];

  const style=document.createElement("style");
  style.textContent=`
    #qmes-side-toggle{position:fixed;left:10px;top:92px;z-index:19980;width:38px;height:38px;border:1px solid #475569;border-radius:10px;background:#132238;color:#e2e8f0;font-size:20px;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.35);cursor:pointer}
    #qmes-side-overlay{position:fixed;inset:0;z-index:19988;background:rgba(2,6,23,.38);opacity:0;visibility:hidden;transition:.18s}
    #qmes-side-overlay.is-open{opacity:1;visibility:visible}
    #qmes-side-menu{position:fixed;left:0;top:0;bottom:0;z-index:19990;width:270px;max-width:86vw;transform:translateX(-102%);transition:transform .2s ease;background:#0b1728;border-right:1px solid #334155;box-shadow:20px 0 60px rgba(0,0,0,.45);overflow-y:auto;padding:18px 14px 24px}
    #qmes-side-menu.is-open{transform:translateX(0)}
    #qmes-side-menu .head{display:flex;align-items:center;justify-content:space-between;padding:2px 4px 14px;border-bottom:1px solid #263b54;margin-bottom:12px}
    #qmes-side-menu .head strong{font-size:16px;color:#fff}#qmes-side-menu .head button{width:34px;height:34px;border:1px solid #475569;border-radius:8px;background:#132238;color:#fff;font-size:20px;cursor:pointer}
    #qmes-side-menu .group{margin:8px 0}#qmes-side-menu .group-title{padding:9px 10px;color:#7dd3fc;font-size:12px;font-weight:900}
    #qmes-side-menu .item{display:flex;width:100%;min-height:39px;align-items:center;padding:9px 13px;border:0;border-radius:8px;background:transparent;color:#cbd5e1;font-size:13px;font-weight:700;text-align:left;cursor:pointer}
    #qmes-side-menu .item:hover{background:#20354f;color:#fff}
    @media(max-width:700px){#qmes-side-toggle{top:82px}}
  `;
  document.head.appendChild(style);

  const toggle=document.createElement("button");
  toggle.id="qmes-side-toggle";toggle.type="button";toggle.textContent="☰";toggle.title="왼쪽 메뉴 열기";
  const overlay=document.createElement("div");overlay.id="qmes-side-overlay";
  const menu=document.createElement("aside");menu.id="qmes-side-menu";
  menu.innerHTML='<div class="head"><strong>QMES 메뉴</strong><button type="button" data-close>×</button></div><div class="body"></div>';
  document.body.append(toggle,overlay,menu);

  const open=()=>{menu.classList.add("is-open");overlay.classList.add("is-open")};
  const close=()=>{menu.classList.remove("is-open");overlay.classList.remove("is-open")};
  toggle.onclick=open;overlay.onclick=close;menu.querySelector("[data-close]").onclick=close;
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close()});

  function findTop(label){
    return Array.from(document.querySelectorAll(".qmes-top-menu-button,nav button"))
      .find(button=>clean(button.textContent).replace(/[›▶▼]/g,"").trim()===label);
  }
  function findAny(label){
    const exact=Array.from(document.querySelectorAll("button")).find(button=>clean(button.textContent)===label);
    if(exact)return exact;
    return Array.from(document.querySelectorAll("button")).find(button=>clean(button.textContent).includes(label));
  }
  function activate(group,item){
    const top=findTop(group);
    if(top)top.click();
    if(item!==group){
      setTimeout(()=>{
        const target=findAny(item);
        if(target)target.click();
      },40);
    }
    close();
  }

  const body=menu.querySelector(".body");
  groups.forEach(([group,items])=>{
    const section=document.createElement("section");section.className="group";
    const title=document.createElement("div");title.className="group-title";title.textContent=group;section.appendChild(title);
    items.forEach(item=>{
      const button=document.createElement("button");button.type="button";button.className="item";
      button.textContent=item;button.onclick=()=>activate(group,item);section.appendChild(button);
    });
    body.appendChild(section);
  });
})();
