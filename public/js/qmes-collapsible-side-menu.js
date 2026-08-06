(function(){
  "use strict";
  if(window.__QMES_COLLAPSIBLE_SIDE_MENU_V3__) return;
  window.__QMES_COLLAPSIBLE_SIDE_MENU_V3__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const groups=[
    {title:"대시보드",items:[
      {label:"종합 대시보드",top:"대시보드"},
      {label:"SPC 대시보드",top:"대시보드",sub:"SPC (Cpk)"}
    ]},
    {title:"생산관리",items:[
      {label:"작업지시서",top:"생산관리",sub:"작업지시서"},
      {label:"생산실적",top:"생산관리",sub:"생산 (배치)"},
      {label:"중간배치",top:"생산관리",sub:"생산 (배치)"}
    ]},
    {title:"품질검사",items:[
      {label:"수입검사",top:"품질검사",sub:"수입검사 (IQC)"},
      {label:"공정검사",top:"품질검사",sub:"공정검사 (PQC)"},
      {label:"출하검사",top:"품질검사",sub:"출하검사 (OQC)"},
      {label:"출하성적서",top:"품질검사",sub:"출하성적서"}
    ]},
    {title:"재고관리",items:[{label:"재고관리",top:"재고관리"}]},
    {title:"거래처현황",items:[{label:"거래처 현황",top:"거래처 현황"}]},
    {title:"설비관리",items:[{label:"설비관리",top:"설비관리"}]},
    {title:"LOT 추적",items:[{label:"LOT 추적",top:"LOT 추적"}]},
    {title:"부적합관리",items:[
      {label:"부적합",top:"부적합관리",sub:"부적합 (8D)"},
      {label:"고객불만",top:"부적합관리",sub:"고객불만 (GQMS)"},
      {label:"4M 변경관리",top:"부적합관리",sub:"4M 변경관리"}
    ]}
  ];

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu"].forEach(id=>document.getElementById(id)?.remove());
  document.getElementById("qmes-side-menu-v3-style")?.remove();

  const style=document.createElement("style");
  style.id="qmes-side-menu-v3-style";
  style.textContent=`
    #qmes-side-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;flex:0 0 42px!important;width:42px!important;height:42px!important;margin:0 4px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#e2e8f0!important;font-size:21px!important;font-weight:900!important;line-height:1!important;cursor:pointer!important;position:relative!important;z-index:21020!important}
    #qmes-side-toggle:hover{background:#1e293b!important;color:#fff!important}
    #qmes-side-overlay{position:fixed!important;inset:0!important;z-index:21000!important;background:rgba(2,6,23,.46)!important;display:none!important}
    #qmes-side-overlay.is-open{display:block!important}
    #qmes-side-menu{position:fixed!important;left:0!important;top:0!important;bottom:0!important;z-index:21010!important;width:292px!important;max-width:88vw!important;display:block!important;transform:translateX(-105%)!important;transition:transform .2s ease!important;background:#0b1728!important;border-right:1px solid #334155!important;box-shadow:22px 0 60px rgba(0,0,0,.55)!important;overflow-y:auto!important;padding:18px 14px 26px!important;color:#e2e8f0!important}
    #qmes-side-menu.is-open{transform:translateX(0)!important}
    #qmes-side-menu .qmes-side-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:2px 4px 14px!important;border-bottom:1px solid #263b54!important;margin-bottom:12px!important}
    #qmes-side-menu .qmes-side-head strong{font-size:17px!important;font-weight:900!important;color:#fff!important}
    #qmes-side-menu .qmes-side-close{display:flex!important;align-items:center!important;justify-content:center!important;width:34px!important;height:34px!important;border:1px solid #475569!important;border-radius:8px!important;background:#132238!important;color:#fff!important;font-size:20px!important;cursor:pointer!important}
    #qmes-side-menu .qmes-side-group{padding:8px 0 10px!important;border-bottom:1px solid rgba(51,65,85,.55)!important}
    #qmes-side-menu .qmes-side-group:last-child{border-bottom:0!important}
    #qmes-side-menu .qmes-side-group-title{padding:8px 10px 6px!important;color:#f8fafc!important;font-size:14px!important;font-weight:900!important}
    #qmes-side-menu .qmes-side-item{display:flex!important;width:100%!important;min-height:38px!important;align-items:center!important;gap:8px!important;padding:8px 12px 8px 20px!important;margin:2px 0!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#cbd5e1!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important}
    #qmes-side-menu .qmes-side-item:before{content:"├";color:#64748b;font-weight:400}
    #qmes-side-menu .qmes-side-item:last-child:before{content:"└"}
    #qmes-side-menu .qmes-side-item:hover{background:#20354f!important;color:#fff!important}
  `;
  document.head.appendChild(style);

  const toggle=document.createElement("button");
  toggle.id="qmes-side-toggle";
  toggle.type="button";
  toggle.textContent="☰";
  toggle.setAttribute("aria-label","왼쪽 메뉴 열기");

  const overlay=document.createElement("div");
  overlay.id="qmes-side-overlay";

  const menu=document.createElement("aside");
  menu.id="qmes-side-menu";
  menu.innerHTML='<div class="qmes-side-head"><strong>QMES 메뉴</strong><button type="button" class="qmes-side-close" aria-label="닫기">×</button></div><div class="qmes-side-body"></div>';
  document.body.append(overlay,menu);

  const body=menu.querySelector(".qmes-side-body");
  groups.forEach(group=>{
    const section=document.createElement("section");
    section.className="qmes-side-group";
    const title=document.createElement("div");
    title.className="qmes-side-group-title";
    title.textContent=group.title;
    section.appendChild(title);
    group.items.forEach(item=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="qmes-side-item";
      button.textContent=item.label;
      button.dataset.top=item.top;
      if(item.sub) button.dataset.sub=item.sub;
      section.appendChild(button);
    });
    body.appendChild(section);
  });

  const mountToggle=()=>{
    const nav=document.querySelector(".qmes-top-menu");
    if(nav&&toggle.parentElement!==nav) nav.insertBefore(toggle,nav.firstChild);
  };
  mountToggle();

  const open=()=>{menu.classList.add("is-open");overlay.classList.add("is-open");};
  const close=()=>{menu.classList.remove("is-open");overlay.classList.remove("is-open");};
  toggle.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();open();});
  overlay.addEventListener("click",close);
  menu.querySelector(".qmes-side-close").addEventListener("click",close);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});

  const allButtons=()=>Array.from(document.querySelectorAll("button"));
  const findExact=text=>allButtons().find(button=>clean(button.textContent)===text&&!button.closest("#qmes-side-menu"));
  function activate(topLabel,subLabel){
    const top=findExact(topLabel);
    if(!top) return;
    top.click();
    if(subLabel){
      setTimeout(()=>{
        const sub=allButtons().find(button=>!button.closest("#qmes-side-menu")&&(clean(button.textContent)===subLabel||clean(button.textContent).includes(subLabel)));
        if(sub) sub.click();
      },120);
    }
    close();
  }

  body.addEventListener("click",event=>{
    const button=event.target.closest(".qmes-side-item");
    if(!button) return;
    activate(button.dataset.top,button.dataset.sub||"");
  });

  new MutationObserver(mountToggle).observe(document.documentElement,{childList:true,subtree:true});
})();
