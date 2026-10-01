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
      position:fixed!important;left:0!important;right:0!important;top:0!important;height:172px!important;z-index:15000!important;
      display:flex!important;align-items:flex-start!important;gap:22px!important;padding:20px 32px 0 74px!important;box-sizing:border-box!important;
      background:
        linear-gradient(90deg,rgba(13,48,79,.48),rgba(26,56,92,.18) 48%,rgba(15,31,58,.48)),
        linear-gradient(180deg,rgba(10,35,61,.16),rgba(11,29,50,.10)),
        url("/qmes-login.jpg") center 49%/cover no-repeat!important;
      color:#fff!important;border:0!important;box-shadow:0 4px 15px rgba(19,41,68,.18)!important;
      font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important
    }
    html body #${HEADER_ID} .qh-brand{width:260px!important;height:58px!important;display:flex!important;align-items:center!important;gap:10px!important;padding:0!important;border:0!important;background:transparent!important;color:#fff!important;cursor:pointer!important}
    html body #${HEADER_ID} .qh-symbol{width:74px!important;height:52px!important;object-fit:contain!important;filter:drop-shadow(0 1px 2px rgba(0,0,0,.28))!important}
    html body #${HEADER_ID} .qh-brand-text{display:flex!important;flex-direction:column!important;align-items:flex-start!important}
    html body #${HEADER_ID} .qh-ko{font-size:21px!important;line-height:25px!important;font-weight:950!important;letter-spacing:-1.2px!important;text-shadow:0 1px 2px rgba(0,0,0,.28)!important}
    html body #${HEADER_ID} .qh-en{font-size:9.5px!important;line-height:14px!important;font-weight:750!important;color:rgba(255,255,255,.95)!important}
    html body #${HEADER_ID} .qh-search{width:310px!important;height:46px!important;margin-top:2px!important;display:flex!important;align-items:center!important;gap:10px!important;padding:0 16px!important;border:1px solid rgba(255,255,255,.34)!important;border-radius:24px!important;background:rgba(255,255,255,.66)!important;backdrop-filter:blur(10px)!important;box-shadow:0 3px 10px rgba(19,39,62,.10)!important}
    html body #${HEADER_ID} .qh-search span{font-size:21px!important;color:#fff!important}
    html body #${HEADER_ID} .qh-search input{width:100%!important;border:0!important;outline:0!important;background:transparent!important;color:#fff!important;font-size:14px!important;font-weight:800!important}
    html body #${HEADER_ID} .qh-search input::placeholder{color:rgba(255,255,255,.95)!important}
    html body #${HEADER_ID} .qh-spacer{flex:1 1 auto!important}
    html body #${HEADER_ID} .qh-clock{min-width:205px!important;height:44px!important;margin-top:1px!important;padding-right:18px!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;border-right:1px solid rgba(255,255,255,.45)!important;font-size:14px!important;font-weight:850!important;text-shadow:0 1px 2px rgba(0,0,0,.28)!important;white-space:nowrap!important}
    html body #${HEADER_ID} .qh-btn{height:44px!important;margin-top:1px!important;padding:0 8px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#fff!important;font-size:13px!important;font-weight:850!important;cursor:pointer!important;text-shadow:0 1px 2px rgba(0,0,0,.26)!important}
    html body #${HEADER_ID} .qh-btn:hover{background:rgba(255,255,255,.12)!important}
    html body #${HEADER_ID} .qh-account{position:relative!important;min-width:205px!important;height:48px!important}
    html body #${HEADER_ID} .qh-account-btn{width:100%!important;height:48px!important;padding:0 6px!important;display:grid!important;grid-template-columns:40px 1fr 14px!important;grid-template-rows:25px 19px!important;column-gap:9px!important;align-items:center!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#fff!important;text-align:left!important;cursor:pointer!important}
    html body #${HEADER_ID} .qh-account-btn:hover{background:rgba(255,255,255,.12)!important}
    html body #${HEADER_ID} .qh-avatar{grid-column:1!important;grid-row:1 / span 2!important;width:40px!important;height:40px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.94)!important;color:#506a82!important;font-weight:950!important;text-shadow:none!important}
    html body #${HEADER_ID} .qh-name{grid-column:2!important;grid-row:1!important;font-size:14px!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    html body #${HEADER_ID} .qh-role{grid-column:2!important;grid-row:2!important;font-size:10.5px!important;font-weight:700!important;color:rgba(255,255,255,.87)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    html body #${HEADER_ID} .qh-caret{grid-column:3!important;grid-row:1 / span 2!important}
    html body #${HEADER_ID} .qh-menu{position:absolute!important;top:52px!important;right:0!important;min-width:170px!important;display:none!important;padding:6px!important;border-radius:10px!important;background:rgba(16,39,62,.96)!important;box-shadow:0 14px 34px rgba(8,22,38,.30)!important}
    html body #${HEADER_ID} .qh-account.open .qh-menu{display:block!important}
    html body #${HEADER_ID} .qh-menu button{width:100%!important;height:36px!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#fff!important;text-align:left!important;padding:0 11px!important;font-size:12px!important;font-weight:750!important}
    html body #${HEADER_ID} .qh-menu button:hover{background:rgba(255,255,255,.12)!important}
    html body #${SIDEBAR_ID}{
      position:fixed!important;left:0!important;top:172px!important;bottom:0!important;width:54px!important;z-index:14900!important;
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
    html body #root>div>main{margin-left:54px!important;width:calc(100% - 54px)!important;padding-top:172px!important;background:#eef3f8!important}
    @media(max-width:1280px){
      html body #${HEADER_ID}{padding-left:66px!important;gap:12px!important}
      html body #${HEADER_ID} .qh-brand{width:220px!important}
      html body #${HEADER_ID} .qh-symbol{width:62px!important}
      html body #${HEADER_ID} .qh-ko{font-size:18px!important}
      html body #${HEADER_ID} .qh-search{width:260px!important}
      html body #${HEADER_ID} .qh-clock{min-width:175px!important;font-size:12.5px!important}
      html body #${HEADER_ID} .qh-account{min-width:170px!important}
    }
  `;
  document.head.appendChild(style);
}

function nativeHeader(){return document.querySelector("#root header");}
function nativeButtons(){const h=nativeHeader();return h?Array.from(h.querySelectorAll("button")):[];}
function triggerAccount(label){
  const buttons=nativeButtons();
  const account=buttons.find(b=>/사용자|계정/.test(String(b.getAttribute("aria-label")||""))||/\(.+\)/.test(clean(b.textContent)));
  if(account) account.click();
  setTimeout(()=>{
    const target=Array.from(document.querySelectorAll("#root [role=menuitem],#root button")).find(b=>clean(b.textContent)===label);
    if(target)target.click();
  },80);
}

function build(){
  ensureStyle();
  document.getElementById(HEADER_ID)?.remove();
  document.getElementById(SIDEBAR_ID)?.remove();
  document.getElementById("qmes-sync-sidebar")?.remove();
  document.getElementById("qmes-sync-hamburger")?.remove();

  const user=currentUser();
  const name=clean(user.name)||"사용자";
  const role=[clean(user.dept||user.department),clean(user.position||user.title),String(user.role||"").toLowerCase()==="admin"?"관리자":""].filter(Boolean).join(" · ")||"QMES 사용자";

  const header=document.createElement("header");
  header.id=HEADER_ID;
  header.innerHTML=`
    <button type="button" class="qh-brand" aria-label="통합 대시보드">
      <img class="qh-symbol" src="/assets/namo-symbol-official.png?v=20261002" alt="">
      <span class="qh-brand-text"><span class="qh-ko">나모케미칼(주)</span><span class="qh-en">NAMO Chemical Co., Ltd.</span></span>
    </button>
    <label class="qh-search"><span>⌕</span><input type="search" placeholder="메뉴 찾기" autocomplete="off"></label>
    <div class="qh-spacer"></div>
    <div class="qh-clock"></div>
    <button type="button" class="qh-btn qh-mobile">▯ <span>모바일</span></button>
    <button type="button" class="qh-btn qh-notice">♧</button>
    <div class="qh-account">
      <button type="button" class="qh-account-btn"><span class="qh-avatar">${name.charAt(0)||"사"}</span><span class="qh-name">${name}</span><span class="qh-role">${role}</span><span class="qh-caret">⌄</span></button>
      <div class="qh-menu"><button type="button" data-act="pw">비밀번호 변경</button><button type="button" data-act="logout">로그아웃</button></div>
    </div>
    <button type="button" class="qh-btn qh-settings">⚙</button>
    <button type="button" class="qh-btn qh-all">⠿</button>
  `;
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
  header.querySelector(".qh-account-btn").onclick=e=>{e.stopPropagation();acc.classList.toggle("open");};
  header.querySelector('[data-act="pw"]').onclick=()=>triggerAccount("비밀번호 변경");
  header.querySelector('[data-act="logout"]').onclick=()=>triggerAccount("로그아웃");
  document.addEventListener("click",e=>{if(!acc.contains(e.target))acc.classList.remove("open");});

  const search=header.querySelector(".qh-search input");
  search.addEventListener("keydown",e=>{
    if(e.key!=="Enter")return;
    const q=clean(search.value).toLowerCase();
    const idx=menu.findIndex(m=>m.label.toLowerCase().includes(q));
    if(idx>=0){nav.children[idx].click();search.blur();}
  });

  header.querySelector(".qh-settings").onclick=()=>navigate("members");
  header.querySelector(".qh-all").onclick=()=>{side.dispatchEvent(new MouseEvent("mouseenter",{bubbles:false}));};

  function tick(){
    const now=new Date(),d=["일","월","화","수","목","금","토"];
    const date=String(now.getMonth()+1).padStart(2,"0")+"월 "+String(now.getDate()).padStart(2,"0")+"일 ("+d[now.getDay()]+")";
    const time=now.toLocaleTimeString("ko-KR",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
    header.querySelector(".qh-clock").textContent=date+"   "+time;
  }
  tick();setInterval(tick,1000);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build,{once:true});else build();
})();