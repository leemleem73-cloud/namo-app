(function(){
"use strict";

const STYLE_ID="qmes-shell-capture-20261002";
const HEADER_ID="qmes-erp-header";
const SIDEBAR_ID="qmes-erp-sidebar";
const MOBILE_URL="/mobile.html?v=20260903-mobile-dedicated1";

const clean=v=>String(v||"").replace(/\s+/g," ").trim();
const currentUser=()=>window.__QMES_CURRENT_USER__||(()=>{try{return JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");}catch(_){return null;}})()||{};
const navigate=(tab,openMenu)=>window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,openMenu:openMenu||null}}));

const menu=[
  {label:"종합 대시보드",icon:"⌂",tab:"dash"},
  {label:"작업지시서",icon:"▤",tab:"woIssue",openMenu:"productionMenu"},
  {label:"수입검사",icon:"✓",tab:"iqc",openMenu:"qualityMenu"},
  {label:"생산 진행",icon:"▥",tab:"prod",openMenu:"productionMenu"},
  {label:"공정검사",icon:"△",tab:"pqc",openMenu:"qualityMenu"},
  {label:"출하검사",icon:"▣",tab:"oqc",openMenu:"qualityMenu"},
  {label:"LOT 추적",icon:"◇",tab:"trace"},
  {label:"현장 입력",icon:"▶",tab:"pop"},
  {label:"설비관리",icon:"▧",tab:"eq"},
  {label:"기준서",icon:"⚙",tab:"standards",openMenu:"qualityMenu"},
  {label:"회원관리",icon:"●",tab:"members"}
];

function ensureStyle(){
  document.getElementById(STYLE_ID)?.remove();
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
    html body #root>div>header{display:none!important}
    html body #${HEADER_ID}{
      position:fixed!important;left:0!important;right:0!important;top:0!important;height:132px!important;z-index:15000!important;
      display:flex!important;align-items:flex-start!important;gap:12px!important;padding:12px 30px 0 66px!important;box-sizing:border-box!important;
      background:url("/assets/qmes-header-factory-20261002.webp?v=20261002-sharp1") center center/100% 100% no-repeat!important;image-rendering:-webkit-optimize-contrast!important;filter:contrast(1.07) saturate(1.08) brightness(1.02)!important;
      color:#fff!important;border:0!important;box-shadow:0 4px 15px rgba(19,41,68,.18)!important;
      font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important
    }
    html body #${HEADER_ID} .qh-brand{position:absolute!important;left:74px!important;top:16px!important;width:150px!important;height:40px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;padding:0!important;border:0!important;background:transparent!important;cursor:pointer!important;z-index:2!important}
    html body #${HEADER_ID} .qh-logo{width:150px!important;height:auto!important;max-height:38px!important;object-fit:contain!important;object-position:left center!important;filter:brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.30))!important}
    html body #${HEADER_ID} .qh-spacer{flex:1 1 auto!important;min-width:10px!important}
    html body #${HEADER_ID} .qh-tools{display:flex!important;align-items:center!important;gap:12px!important;height:48px!important;flex:0 0 auto!important}
    html body #${HEADER_ID} .qh-btn{height:40px!important;min-width:40px!important;margin:0!important;padding:0 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;border:1px solid transparent!important;border-radius:10px!important;background:transparent!important;color:#fff!important;font-family:inherit!important;font-size:12.5px!important;font-weight:600!important;cursor:pointer!important;text-shadow:0 1px 3px rgba(0,0,0,.24)!important;transition:background .15s ease,border-color .15s ease!important}
    html body #${HEADER_ID} .qh-btn:hover,html body #${HEADER_ID} .qh-account-btn:hover{background:rgba(255,255,255,.11)!important;border-color:rgba(255,255,255,.2)!important}
    html body #${HEADER_ID} :is(.qh-btn,.qh-account-btn,.qh-menu button):focus-visible{outline:2px solid #fff!important;outline-offset:3px!important}
    html body #${HEADER_ID} .qh-btn svg,html body #${HEADER_ID} .qh-avatar svg,html body #${HEADER_ID} .qh-caret svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.65!important;stroke-linecap:round!important;stroke-linejoin:round!important;flex:none!important}
    html body #${HEADER_ID} .qh-mobile{min-width:86px!important}
    html body #${HEADER_ID} .qh-notice{position:relative!important;width:40px!important;padding:0!important}
    html body #${HEADER_ID} .qh-notice-dot{position:absolute!important;top:5px!important;right:6px!important;width:6px!important;height:6px!important;border:1.5px solid #fff!important;border-radius:999px!important;background:#ef5966!important;box-sizing:content-box!important}
    html body #${HEADER_ID} .qh-account{position:relative!important;min-width:170px!important;max-width:360px!important;height:48px!important;flex:0 0 auto!important;margin:0!important}
    html body #${HEADER_ID} .qh-account-btn{width:100%!important;height:48px!important;padding:3px 9px 3px 5px!important;display:grid!important;grid-template-columns:36px minmax(92px,1fr) 12px!important;grid-template-rows:40px!important;column-gap:10px!important;align-items:center!important;border:1px solid transparent!important;border-radius:12px!important;background:transparent!important;color:#fff!important;font-family:inherit!important;text-align:left!important;cursor:pointer!important;transition:background .15s ease,border-color .15s ease!important}
    html body #${HEADER_ID} .qh-avatar{grid-column:1!important;grid-row:1!important;width:36px!important;height:36px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,rgba(255,255,255,.22),rgba(255,255,255,.07))!important;color:#fff!important;border:1px solid rgba(255,255,255,.52)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 6px rgba(12,27,45,.12)!important}
    html body #${HEADER_ID} .qh-name{grid-column:2!important;grid-row:1!important;min-width:0!important;font-size:13.5px!important;font-weight:650!important;line-height:20px!important;letter-spacing:-.15px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-shadow:0 1px 3px rgba(0,0,0,.24)!important}
    html body #${HEADER_ID} .qh-caret{grid-column:3!important;grid-row:1!important;display:flex!important;align-items:center!important;color:rgba(255,255,255,.72)!important}
    html body #${HEADER_ID} .qh-caret svg{width:12px!important;height:12px!important}
    html body #${HEADER_ID} .qh-menu{position:absolute!important;top:54px!important;right:0!important;min-width:178px!important;display:none!important;padding:6px!important;border:1px solid rgba(255,255,255,.15)!important;border-radius:12px!important;background:rgba(16,39,62,.97)!important;box-shadow:0 14px 34px rgba(8,22,38,.25)!important}
    html body #${HEADER_ID} .qh-account.open .qh-menu{display:block!important}
    html body #${HEADER_ID} .qh-menu button{width:100%!important;height:36px!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#fff!important;text-align:left!important;padding:0 11px!important;font-family:inherit!important;font-size:12px!important;font-weight:550!important;cursor:pointer!important}
    html body #${HEADER_ID} .qh-menu button:hover{background:rgba(255,255,255,.12)!important}
    html body #${SIDEBAR_ID}{
      position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:54px!important;z-index:15100!important;
      background:#2e3a4b!important;border-right:0!important;box-shadow:2px 0 8px rgba(21,36,53,.15)!important;overflow:hidden!important;
      transition:width .16s ease!important
    }
    html body #${SIDEBAR_ID}:hover{width:182px!important}
    html body #${SIDEBAR_ID} .qside-nav{padding:10px 0!important;display:flex!important;flex-direction:column!important;gap:5px!important}
    html body #${SIDEBAR_ID} .qside-item{width:42px!important;height:40px!important;margin:0 6px!important;padding:0 10px!important;display:flex!important;align-items:center!important;gap:10px!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#c8d2dc!important;cursor:pointer!important;white-space:nowrap!important;overflow:hidden!important}
    html body #${SIDEBAR_ID}:hover .qside-item{width:170px!important}
    html body #${SIDEBAR_ID} .qside-item:hover{background:#3d4c60!important;color:#fff!important}
    html body #${SIDEBAR_ID} .qside-item.active{background:#2581cf!important;color:#fff!important}
    html body #${SIDEBAR_ID} .qside-icon{width:22px!important;min-width:22px!important;height:22px!important;display:grid!important;place-items:center!important;font-size:14px!important;font-weight:900!important}
    html body #${SIDEBAR_ID} .qside-text{opacity:0!important;font-size:12px!important;font-weight:750!important;transition:opacity .12s ease!important}
    html body #${SIDEBAR_ID}:hover .qside-text{opacity:1!important}
    html body #root>div>main{margin-left:54px!important;width:calc(100% - 54px)!important;padding-top:132px!important;background:#eef3f8!important}

    /* 2026-10-02 PC = PAD hard parity / obsolete flow hard block */
    html body .qmd-shell{padding:22px 24px 28px!important}
    html body .qmd-kpis{gap:12px!important}
    html body .qmd-kpi{padding:14px!important}
    html body .qmd-kpi-label{font-size:14px!important}
    html body .qmd-kpi-value{font-size:27px!important}
    html body .qmd-flow-card{display:none!important}
    @media(max-width:1280px){
      html body #${HEADER_ID}{padding-left:66px!important;gap:12px!important}
      html body #${HEADER_ID} .qh-brand{width:150px!important}
      html body #${HEADER_ID} .qh-symbol{width:62px!important}
      html body #${HEADER_ID} .qh-ko{font-size:18px!important}
      html body #${HEADER_ID} .qh-account{min-width:170px!important}
    }
  `;
  document.head.appendChild(style);
}

function nativeHeader(){return document.querySelector("#root header");}
function nativeButtons(){const h=nativeHeader();return h?Array.from(h.querySelectorAll("button")):[];}
function triggerAccount(label){
  const buttons=nativeButtons();
  const account=nativeHeader()?.querySelector(".qauth-account-button")||buttons.find(b=>/사용자|계정/.test(String(b.getAttribute("aria-label")||""))||/\(.+\)/.test(clean(b.textContent)));
  if(account&&account.getAttribute("aria-expanded")!=="true")account.click();
  setTimeout(()=>{
    const target=Array.from(document.querySelectorAll("#root [role=menuitem],#root button")).find(b=>clean(b.textContent)===label);
    if(target)target.click();
  },80);
}

function syncIdentity(header){
  const user=currentUser();
  const name=clean(user.name)||"사용자";
  const dept=clean(user.dept)||clean(user.department);
  const position=clean(user.position)||clean(user.title)||clean(user.rank)||clean(user.jobTitle);
  const details=[dept,position].filter(Boolean).join(",");
  const label=details?name+"("+details+")":name;
  const nameNode=header.querySelector(".qh-name");
  if(nameNode.textContent!==label)nameNode.textContent=label;
  const button=header.querySelector(".qh-account-btn");
  if(button.getAttribute("title")!==label){button.setAttribute("title",label);button.setAttribute("aria-label",label+" 사용자 메뉴");}
}

function build(){
  ensureStyle();
  document.getElementById(HEADER_ID)?.remove();
  document.getElementById(SIDEBAR_ID)?.remove();
  document.getElementById("qmes-sync-sidebar")?.remove();
  document.getElementById("qmes-sync-hamburger")?.remove();

  const header=document.createElement("header");
  header.id=HEADER_ID;
  header.dataset.qmesHeaderVersion="20261002-account-dept-position1";
  header.innerHTML=`
    <button type="button" class="qh-brand" aria-label="통합 대시보드">
      <img class="qh-logo" src="https://www.namochemical.com/img/svg/img_logo.svg" alt="나모케미칼 로고">
    </button>
    <div class="qh-spacer"></div>
    <div class="qh-tools" role="group" aria-label="사용자 및 바로가기">
      <div class="qh-account">
        <button type="button" class="qh-account-btn" aria-label="사용자 메뉴" aria-haspopup="menu" aria-expanded="false" aria-controls="qh-account-menu">
          <span class="qh-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="8" r="3.25"></circle><path d="M5.25 20v-1.75a6.75 6.75 0 0 1 13.5 0V20"></path></svg></span>
          <span class="qh-name"></span>
          <span class="qh-caret" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path d="m4.5 6.5 3.5 3.5 3.5-3.5"></path></svg></span>
        </button>
        <div class="qh-menu" id="qh-account-menu" role="menu"><button type="button" role="menuitem" data-act="pw">비밀번호 변경</button><button type="button" role="menuitem" data-act="logout">로그아웃</button></div>
      </div>
      <button type="button" class="qh-btn qh-notice" aria-label="알림" title="알림">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 8.5a6 6 0 0 0-12 0c0 7-2.25 7-2.25 8.5h16.5c0-1.5-2.25-1.5-2.25-8.5"></path><path d="M9.5 20a2.75 2.75 0 0 0 5 0"></path></svg>
        <span class="qh-notice-dot" aria-hidden="true"></span>
      </button>
      <button type="button" class="qh-btn qh-mobile" aria-label="모바일" title="모바일">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6.5" y="2.5" width="11" height="19" rx="2.75"></rect><path d="M10 5h4M11 18.5h2"></path></svg><span>모바일</span>
      </button>
    </div>
  `;
  syncIdentity(header);
  document.body.appendChild(header);

  const side=document.createElement("aside");
  side.id=SIDEBAR_ID;
  side.innerHTML='<nav class="qside-nav"></nav>';
  document.body.appendChild(side);
  const nav=side.querySelector(".qside-nav");
  menu.forEach((item,index)=>{
    const b=document.createElement("button");
    b.type="button";
    b.className="qside-item"+(index===0?" active":"");
    b.innerHTML='<span class="qside-icon">'+item.icon+'</span><span class="qside-text">'+item.label+'</span>';
    b.addEventListener("click",()=>{
      side.querySelectorAll(".qside-item").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      navigate(item.tab,item.openMenu);
    });
    nav.appendChild(b);
  });

  header.querySelector(".qh-brand").onclick=()=>navigate("dash");
  header.querySelector(".qh-mobile").onclick=()=>window.location.assign(MOBILE_URL);
  header.querySelector(".qh-notice").onclick=()=>{
    const btn=nativeButtons().find(b=>String(b.getAttribute("aria-label")||"").includes("알림"));
    if(btn)btn.click();
  };
  const acc=header.querySelector(".qh-account");
  const accountButton=header.querySelector(".qh-account-btn");
  const setAccountOpen=open=>{acc.classList.toggle("open",open);accountButton.setAttribute("aria-expanded",String(open));};
  accountButton.onclick=e=>{e.stopPropagation();setAccountOpen(!acc.classList.contains("open"));};
  header.querySelector('[data-act="pw"]').onclick=()=>{setAccountOpen(false);triggerAccount("비밀번호 변경");};
  header.querySelector('[data-act="logout"]').onclick=()=>{setAccountOpen(false);triggerAccount("로그아웃");};
  document.addEventListener("click",e=>{if(!acc.contains(e.target))setAccountOpen(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&acc.classList.contains("open")){setAccountOpen(false);accountButton.focus();}});

  const syncUser=()=>syncIdentity(header);
  const root=document.getElementById("root");
  if(root)new MutationObserver(syncUser).observe(root,{childList:true,subtree:true,characterData:true});
  window.addEventListener("storage",syncUser);
  window.addEventListener("pageshow",syncUser);

  const purgeObsoleteFlow=()=>{
    document.querySelectorAll(".qmd-flow-card").forEach(el=>el.remove());
    document.querySelectorAll("h1,h2,h3").forEach(h=>{
      if(String(h.textContent||"").trim()==="QMES 통합 업무 흐름"){
        const card=h.closest("section,.qmd-card");
        if(card) card.remove();
      }
    });
  };
  purgeObsoleteFlow();
  setTimeout(purgeObsoleteFlow,100);
  setTimeout(purgeObsoleteFlow,500);
  new MutationObserver(purgeObsoleteFlow).observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build,{once:true});else build();
})();