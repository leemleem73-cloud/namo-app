(function(){
  "use strict";
  if(window.__QMES_COLLAPSIBLE_SIDE_MENU_V2__) return;
  window.__QMES_COLLAPSIBLE_SIDE_MENU_V2__=true;

  if(!document.querySelector('script[data-qmes-lot-iqc-nav-fix]')){
    const script=document.createElement("script");
    script.src="./js/qmes-lot-iqc-navigation-fix.js?v=20260806-3";
    script.async=false;
    script.dataset.qmesLotIqcNavFix="true";
    document.head.appendChild(script);
  }

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const items=[
    ["종합 대시보드","대시보드",null],
    ["SPC 대시보드","대시보드","SPC (Cpk)"],
    ["생산실적","생산관리","생산 (배치)"],
    ["작업지시서","생산관리","작업지시서"],
    ["수입검사","품질검사","수입검사 (IQC)"],
    ["공정검사","품질검사","공정검사 (PQC)"],
    ["출하검사","품질검사","출하검사 (OQC)"],
    ["출하성적서","품질검사","출하성적서"],
    ["재고관리","재고관리",null],
    ["거래처 현황","거래처 현황",null],
    ["설비관리","설비관리",null],
    ["LOT 추적","LOT 추적",null],
    ["부적합","부적합관리","부적합 (8D)"],
    ["고객불만","부적합관리","고객불만 (GQMS)"]
  ];

  document.getElementById("qmes-side-toggle")?.remove();
  document.getElementById("qmes-side-overlay")?.remove();
  document.getElementById("qmes-side-menu")?.remove();

  const style=document.createElement("style");
  style.textContent=`
    #qmes-side-toggle{display:inline-flex;flex:0 0 auto;width:36px;height:36px;align-items:center;justify-content:center;margin-right:2px;border:1px solid #475569;border-radius:8px;background:#132238;color:#e2e8f0;font-size:19px;font-weight:900;cursor:pointer;position:relative;z-index:2}
    #qmes-side-overlay{position:fixed;inset:0;z-index:20000;background:rgba(2,6,23,.42);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease}
    #qmes-side-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto}
    #qmes-side-menu{position:fixed;left:0;top:0;bottom:0;z-index:20010;width:280px;max-width:86vw;transform:translateX(-101%);transition:transform .18s ease;background:#0b1728;border-right:1px solid #334155;box-shadow:20px 0 55px rgba(0,0,0,.5);overflow-y:auto;padding:18px 14px 24px}
    #qmes-side-menu.is-open{transform:translateX(0)}
    #qmes-side-menu .head{display:flex;align-items:center;justify-content:space-between;padding:2px 4px 14px;border-bottom:1px solid #263b54;margin-bottom:10px}
    #qmes-side-menu .head strong{font-size:16px;color:#fff}#qmes-side-menu .head button{width:34px;height:34px;border:1px solid #475569;border-radius:8px;background:#132238;color:#fff;font-size:20px;cursor:pointer}
    #qmes-side-menu .item{display:flex;width:100%;min-height:42px;align-items:center;padding:10px 13px;margin:3px 0;border:0;border-radius:8px;background:transparent;color:#cbd5e1;font-size:13px;font-weight:750;text-align:left;cursor:pointer}
    #qmes-side-menu .item:hover{background:#20354f;color:#fff}
  `;
  document.head.appendChild(style);

  const toggle=document.createElement("button");
  toggle.id="qmes-side-toggle";toggle.type="button";toggle.textContent="☰";toggle.title="왼쪽 메뉴";
  const overlay=document.createElement("div");overlay.id="qmes-side-overlay";
  const menu=document.createElement("aside");menu.id="qmes-side-menu";
  menu.innerHTML='<div class="head"><strong>QMES 메뉴</strong><button type="button" data-close>×</button></div><div class="body"></div>';
  document.body.append(overlay,menu);

  const mountToggle=()=>{
    const nav=document.querySelector(".qmes-top-menu");
    if(nav&&toggle.parentElement!==nav) nav.insertBefore(toggle,nav.firstChild);
  };
  mountToggle();

  const open=()=>{menu.classList.add("is-open");overlay.classList.add("is-open")};
  const close=()=>{menu.classList.remove("is-open");overlay.classList.remove("is-open")};
  toggle.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();open();});
  overlay.addEventListener("click",close);menu.querySelector("[data-close]").addEventListener("click",close);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close()});

  const buttons=()=>Array.from(document.querySelectorAll("button"));
  const exact=text=>buttons().find(button=>clean(button.textContent)===text);
  function activate(topLabel,subLabel){
    const top=exact(topLabel);
    if(!top) return;
    top.click();
    if(subLabel){
      setTimeout(()=>{
        const sub=buttons().find(button=>clean(button.textContent)===subLabel || clean(button.textContent).includes(subLabel));
        if(sub) sub.click();
      },80);
    }
    close();
  }

  const body=menu.querySelector(".body");
  items.forEach(([label,top,sub])=>{
    const button=document.createElement("button");button.type="button";button.className="item";button.textContent=label;
    button.addEventListener("click",()=>activate(top,sub));body.appendChild(button);
  });

  new MutationObserver(mountToggle).observe(document.documentElement,{childList:true,subtree:true});
})();
