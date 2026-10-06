/* NAMO QMES - approved V40 shell bridge, 2026-10-06 */
(function(){
  "use strict";
  if(window.__NAMO_QMES_V40_LIVE_20261006__) return;
  window.__NAMO_QMES_V40_LIVE_20261006__=true;
  if(!/^\/(?:index\.html)?$/.test(location.pathname)) return;

  const PROTECTED=new Set(["iqc","pqc","oqc","eq"]);
  const MENU=[
    {label:"종합 대시보드",icon:"▦",tab:"dash"},
    {label:"작업지시서",icon:"▤",tab:"woIssue",openMenu:"productionMenu"},
    {label:"생산 진행",icon:"▥",tab:"prod",openMenu:"productionMenu"},
    {label:"재고현황",icon:"▣",tab:"inv"},
    {label:"수입검사",icon:"✓",tab:"iqc",openMenu:"qualityMenu"},
    {label:"공정검사",icon:"△",tab:"pqc",openMenu:"qualityMenu"},
    {label:"출하검사",icon:"□",tab:"oqc",openMenu:"qualityMenu"},
    {label:"LOT 추적",icon:"◇",tab:"trace"},
    {label:"설비관리",icon:"⚙",tab:"eq"},
    {label:"거래처 현황",icon:"◎",tab:"partners"},
    {label:"부적합관리",icon:"!",tab:"ncr",openMenu:"nonconformityMenu"},
    {label:"기준서 관리",icon:"▧",tab:"standards",openMenu:"qualityMenu"},
    {label:"회원 관리",icon:"●",tab:"members",adminOnly:true}
  ];

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const readUser=()=>{
    if(window.__QMES_CURRENT_USER__&&typeof window.__QMES_CURRENT_USER__==="object") return window.__QMES_CURRENT_USER__;
    try{return JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null")||{};}catch(_){return {};}
  };
  const currentTab=()=>{try{return clean(sessionStorage.getItem("qmes_current_tab"))||"dash";}catch(_){return "dash";}};
  const navigate=item=>window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab:item.tab,openMenu:item.openMenu||null}}));
  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function toast(text){
    let el=document.getElementById("qv40Toast");
    if(!el){el=document.createElement("div");el.id="qv40Toast";el.className="qv40-toast";document.body.appendChild(el);}
    el.textContent=text;el.classList.add("show");clearTimeout(el.__timer);el.__timer=setTimeout(()=>el.classList.remove("show"),1800);
  }

  function removeLegacyShell(){
    document.querySelectorAll("#qmes-erp-header:not(.qv40-topbar),#qmes-erp-sidebar:not(.qv40-sidebar)").forEach(el=>el.remove());
  }

  function build(){
    if(!document.getElementById("root")) return;
    removeLegacyShell();
    document.getElementById("qmes-erp-header")?.remove();
    document.getElementById("qmes-erp-sidebar")?.remove();

    const user=readUser();
    const isAdmin=clean(user.role).toLowerCase()==="admin"||clean(user.role)==="관리자";
    const name=clean(user.name)||"사용자";
    const dept=clean(user.dept||user.department)||"QMES";
    const position=clean(user.position||user.title);

    const header=document.createElement("header");
    header.id="qmes-erp-header";header.className="qv40-topbar";
    header.innerHTML=`
      <div class="qv40-brand" role="button" tabindex="0" aria-label="대시보드로 이동">
        <div class="qv40-brand-logo">N</div>
        <div class="qv40-brand-name">NAMO <span>QMES</span></div>
      </div>
      <div class="qv40-top-actions">
        <button class="qv40-top-chip hide-sm" type="button" data-act="company">🏭 나모케미칼</button>
        <button class="qv40-top-chip hide-sm" type="button" data-act="notify">🔔 알림</button>
        <div class="qv40-user">
          <button class="qv40-user-button" type="button" aria-haspopup="menu" aria-expanded="false">
            <div class="qv40-avatar">${esc(name.slice(0,1)||"U")}</div>
            <div class="qv40-user-meta"><b>${esc(name)}${position?" "+esc(position):""}</b><br><small>${esc(dept)}</small></div>
          </button>
          <div class="qv40-account-menu" role="menu">
            <button type="button" data-account="password">비밀번호 변경</button>
            <button type="button" class="danger" data-account="logout">로그아웃</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(header);

    const sidebar=document.createElement("aside");
    sidebar.id="qmes-erp-sidebar";sidebar.className="qv40-sidebar";
    const items=MENU.filter(x=>!x.adminOnly||isAdmin).map(x=>`<button class="qv40-menu" type="button" data-tab="${esc(x.tab)}"><span class="qv40-menu-ico">${esc(x.icon)}</span><span class="qv40-menu-label">${esc(x.label)}</span></button>`).join("");
    sidebar.innerHTML=`<div class="qv40-nav-wrap"><div class="qv40-menu-title">QMES MENU</div>${items}</div><button class="qv40-nav-toggle" type="button" aria-label="메뉴 펼치기">☰</button>`;
    document.body.appendChild(sidebar);

    const savedOpen=(()=>{try{return localStorage.getItem("qmes-v40-nav-open")==="1";}catch(_){return false;}})();
    document.body.classList.toggle("qv40-nav-open",savedOpen);

    sidebar.querySelectorAll(".qv40-menu").forEach(btn=>btn.addEventListener("click",()=>{
      const item=MENU.find(x=>x.tab===btn.dataset.tab);if(!item)return;navigate(item);sync(btn.dataset.tab);window.scrollTo({top:0,left:0,behavior:"auto"});
    }));
    sidebar.querySelector(".qv40-nav-toggle").addEventListener("click",()=>{
      const open=!document.body.classList.contains("qv40-nav-open");document.body.classList.toggle("qv40-nav-open",open);
      try{localStorage.setItem("qmes-v40-nav-open",open?"1":"0");}catch(_){}
      requestAnimationFrame(()=>window.dispatchEvent(new Event("resize")));
    });

    const goDash=()=>{const item=MENU[0];navigate(item);sync(item.tab);};
    header.querySelector(".qv40-brand").addEventListener("click",goDash);
    header.querySelector(".qv40-brand").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")goDash();});
    header.querySelector('[data-act="company"]').addEventListener("click",()=>toast("나모케미칼 QMES"));
    header.querySelector('[data-act="notify"]').addEventListener("click",()=>{
      const hidden=[...document.querySelectorAll("#root button")].find(b=>/알림/.test(clean(b.getAttribute("aria-label")||b.textContent)));
      if(hidden){hidden.click();return;}toast("새 알림을 확인했습니다.");
    });

    const userWrap=header.querySelector(".qv40-user");
    const userBtn=header.querySelector(".qv40-user-button");
    const setAccount=open=>{userWrap.classList.toggle("open",open);userBtn.setAttribute("aria-expanded",String(open));};
    userBtn.addEventListener("click",e=>{e.stopPropagation();setAccount(!userWrap.classList.contains("open"));});
    document.addEventListener("click",e=>{if(!userWrap.contains(e.target))setAccount(false);});
    header.querySelector('[data-account="password"]').addEventListener("click",()=>{
      setAccount(false);
      const rootAccount=document.querySelector("#root .qauth-account-button");
      if(rootAccount){rootAccount.click();requestAnimationFrame(()=>{const b=[...document.querySelectorAll("#root .qauth-account-menu button")].find(x=>/비밀번호 변경/.test(clean(x.textContent)));if(b)b.click();});}
      else toast("비밀번호 변경 메뉴를 불러올 수 없습니다.");
    });
    header.querySelector('[data-account="logout"]').addEventListener("click",async()=>{
      setAccount(false);
      try{await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin"});}catch(_){}
      try{sessionStorage.removeItem("qmes-current-user-v1");}catch(_){}
      location.reload();
    });

    sync(currentTab());
    requestAnimationFrame(()=>window.dispatchEvent(new Event("resize")));
  }

  function sync(tab){
    const t=clean(tab)||currentTab();
    document.body.classList.add("qv40-shell-active");
    document.body.classList.toggle("qv40-protected",PROTECTED.has(t));
    document.body.classList.toggle("qv40-restyle",!PROTECTED.has(t));
    document.querySelectorAll("#qmes-erp-sidebar.qv40-sidebar .qv40-menu").forEach(b=>b.classList.toggle("active",b.dataset.tab===t));
  }

  window.addEventListener("qmes:navigate-tab",e=>sync(e?.detail?.tab));
  window.addEventListener("storage",()=>sync(currentTab()));
  let last="";
  setInterval(()=>{const now=currentTab();if(now!==last){last=now;sync(now);}removeLegacyShell();},500);

  const boot=()=>setTimeout(build,0);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
