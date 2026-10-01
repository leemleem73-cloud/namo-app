(function(){
  "use strict";

  const STYLE_ID="qmes-header-reference-style-20261002-v2";
  const HEADER_ID="qmes-reference-header";
  const MOBILE_URL="/mobile.html?v=20260903-mobile-dedicated1";

  const clean=(v)=>String(v||"").replace(/\s+/g," ").trim();
  const currentUser=()=>{
    if(window.__QMES_CURRENT_USER__) return window.__QMES_CURRENT_USER__;
    try{return JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null")||{};}catch(_){return {};}
  };

  const iconSearch='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.2"/><path d="m16 16 4 4"/></svg>';
  const iconPhone='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/></svg>';
  const iconBell='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
  const iconGear='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.1"/><path d="M19 13.5v-3l-2-.7-.7-1.6 1-1.9-2.1-2.1-1.9 1-1.6-.7-.7-2h-3l-.7 2-1.6.7-1.9-1-2.1 2.1 1 1.9-.7 1.6-2 .7v3l2 .7.7 1.6-1 1.9 2.1 2.1 1.9-1 1.6.7.7 2h3l.7-2 1.6-.7 1.9 1 2.1-2.1-1-1.9.7-1.6z"/></svg>';
  const iconGrid='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/></svg>';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      html body #qmes-erp-header,
      html body #qmes-sync-header,
      html body #qmes-sync-hamburger,
      html body #root header[data-qmes-native-header],
      html body #root>div>header{display:none!important;}

      html body #${HEADER_ID}{
        position:fixed!important;
        inset:0 0 auto 0!important;
        height:170px!important;
        z-index:15000!important;
        display:flex!important;
        align-items:flex-start!important;
        gap:18px!important;
        padding:18px 30px 0 82px!important;
        box-sizing:border-box!important;
        overflow:visible!important;
        border:0!important;
        background:
          linear-gradient(90deg,rgba(11,44,76,.62),rgba(18,45,79,.30) 48%,rgba(16,31,57,.56)),
          linear-gradient(180deg,rgba(10,42,70,.18),rgba(10,31,51,.05) 60%,rgba(10,27,47,.26)),
          url("/qmes-login.jpg") center 48%/cover no-repeat!important;
        box-shadow:0 3px 12px rgba(10,31,52,.18)!important;
        color:#fff!important;
        font-family:"Pretendard","Noto Sans KR",sans-serif!important;
      }

      html body #${HEADER_ID} .qh-brand{
        width:255px!important;
        height:58px!important;
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        flex:0 0 255px!important;
        padding:0!important;
        margin:0!important;
        border:0!important;
        background:transparent!important;
        color:#fff!important;
        cursor:pointer!important;
      }
      html body #${HEADER_ID} .qh-symbol{
        width:72px!important;height:52px!important;object-fit:contain!important;flex:none!important;
        filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))!important;
      }
      html body #${HEADER_ID} .qh-brand-text{display:flex!important;flex-direction:column!important;align-items:flex-start!important;min-width:0!important}
      html body #${HEADER_ID} .qh-brand-ko{font-size:21px!important;line-height:24px!important;font-weight:950!important;letter-spacing:-1.2px!important;white-space:nowrap!important;text-shadow:0 1px 2px rgba(0,0,0,.26)!important}
      html body #${HEADER_ID} .qh-brand-en{font-size:9.5px!important;line-height:14px!important;font-weight:750!important;letter-spacing:-.15px!important;color:rgba(255,255,255,.94)!important;white-space:nowrap!important;text-shadow:0 1px 2px rgba(0,0,0,.24)!important}

      html body #${HEADER_ID} .qh-search{
        width:310px!important;
        height:46px!important;
        flex:0 0 310px!important;
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        margin-top:2px!important;
        padding:0 16px!important;
        box-sizing:border-box!important;
        border:1px solid rgba(255,255,255,.35)!important;
        border-radius:24px!important;
        background:rgba(255,255,255,.66)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 3px 10px rgba(16,43,68,.12)!important;
        backdrop-filter:blur(9px)!important;
        -webkit-backdrop-filter:blur(9px)!important;
      }
      html body #${HEADER_ID} .qh-search svg{width:22px!important;height:22px!important;fill:none!important;stroke:#fff!important;stroke-width:2.4!important;flex:none!important;filter:drop-shadow(0 1px 1px rgba(33,58,80,.25))!important}
      html body #${HEADER_ID} .qh-search input{
        width:100%!important;height:100%!important;border:0!important;outline:0!important;background:transparent!important;
        color:#fff!important;font-size:14px!important;font-weight:800!important;padding:0!important;
      }
      html body #${HEADER_ID} .qh-search input::placeholder{color:rgba(255,255,255,.92)!important}

      html body #${HEADER_ID} .qh-spacer{flex:1 1 auto!important;min-width:12px!important}
      html body #${HEADER_ID} .qh-clock{
        min-width:196px!important;height:44px!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;
        margin-top:1px!important;padding-right:18px!important;border-right:1px solid rgba(255,255,255,.46)!important;
        font-size:14px!important;font-weight:850!important;letter-spacing:-.2px!important;color:#fff!important;white-space:nowrap!important;
        text-shadow:0 1px 2px rgba(0,0,0,.30)!important;
      }

      html body #${HEADER_ID} .qh-btn{
        height:44px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;
        margin-top:1px!important;padding:0 8px!important;border:0!important;border-radius:10px!important;
        background:transparent!important;color:#fff!important;box-shadow:none!important;cursor:pointer!important;
        font-size:13px!important;font-weight:850!important;white-space:nowrap!important;text-shadow:0 1px 2px rgba(0,0,0,.24)!important;
      }
      html body #${HEADER_ID} .qh-btn:hover{background:rgba(255,255,255,.13)!important}
      html body #${HEADER_ID} .qh-btn svg{width:21px!important;height:21px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;flex:none!important}
      html body #${HEADER_ID} .qh-icon{width:44px!important;padding:0!important}
      html body #${HEADER_ID} .qh-grid svg circle{fill:currentColor!important;stroke:none!important}

      html body #${HEADER_ID} .qh-notice{position:relative!important;width:44px!important;padding:0!important}
      html body #${HEADER_ID} .qh-notice-dot{
        position:absolute!important;top:5px!important;right:5px!important;width:9px!important;height:9px!important;
        border:2px solid #fff!important;border-radius:999px!important;background:#ef3038!important;box-sizing:content-box!important;
      }

      html body #${HEADER_ID} .qh-account{
        position:relative!important;min-width:205px!important;height:48px!important;flex:0 0 auto!important;margin-top:-1px!important;
      }
      html body #${HEADER_ID} .qh-account-btn{
        width:100%!important;height:48px!important;display:grid!important;grid-template-columns:40px minmax(108px,1fr) 15px!important;
        grid-template-rows:25px 19px!important;column-gap:9px!important;align-items:center!important;
        padding:0 7px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#fff!important;
        box-shadow:none!important;text-align:left!important;cursor:pointer!important;
      }
      html body #${HEADER_ID} .qh-account-btn:hover{background:rgba(255,255,255,.13)!important}
      html body #${HEADER_ID} .qh-avatar{
        grid-column:1!important;grid-row:1 / span 2!important;width:40px!important;height:40px!important;border-radius:50%!important;
        display:grid!important;place-items:center!important;background:rgba(255,255,255,.94)!important;color:#4f6880!important;
        border:1px solid rgba(255,255,255,.72)!important;font-size:15px!important;font-weight:950!important;text-shadow:none!important;
      }
      html body #${HEADER_ID} .qh-user-name{
        grid-column:2!important;grid-row:1!important;font-size:14px!important;line-height:25px!important;font-weight:950!important;
        color:#fff!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-shadow:0 1px 2px rgba(0,0,0,.28)!important;
      }
      html body #${HEADER_ID} .qh-user-role{
        grid-column:2!important;grid-row:2!important;font-size:10.5px!important;line-height:19px!important;font-weight:700!important;
        color:rgba(255,255,255,.88)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-shadow:0 1px 2px rgba(0,0,0,.24)!important;
      }
      html body #${HEADER_ID} .qh-caret{grid-column:3!important;grid-row:1 / span 2!important;font-size:11px!important;color:rgba(255,255,255,.90)!important}
      html body #${HEADER_ID} .qh-account-menu{
        position:absolute!important;top:51px!important;right:0!important;min-width:165px!important;padding:6px!important;
        display:none!important;border:1px solid rgba(255,255,255,.24)!important;border-radius:10px!important;
        background:rgba(17,42,67,.96)!important;box-shadow:0 14px 34px rgba(6,24,40,.28)!important;backdrop-filter:blur(10px)!important;
      }
      html body #${HEADER_ID} .qh-account.is-open .qh-account-menu{display:block!important}
      html body #${HEADER_ID} .qh-account-menu button{
        width:100%!important;height:36px!important;padding:0 11px!important;border:0!important;border-radius:7px!important;background:transparent!important;
        color:#fff!important;font-size:12px!important;font-weight:750!important;text-align:left!important;cursor:pointer!important;
      }
      html body #${HEADER_ID} .qh-account-menu button:hover{background:rgba(255,255,255,.13)!important}

      html body #qmes-erp-sidebar{top:170px!important;height:calc(100vh - 170px)!important}
      html body #root>div>main{padding-top:170px!important}
      html body #root>div>main>div:first-child{margin-top:0!important}

      @media(max-width:1450px){
        html body #${HEADER_ID}{padding-left:68px!important;gap:10px!important}
        html body #${HEADER_ID} .qh-brand{width:220px!important;flex-basis:220px!important}
        html body #${HEADER_ID} .qh-symbol{width:60px!important}
        html body #${HEADER_ID} .qh-brand-ko{font-size:18px!important}
        html body #${HEADER_ID} .qh-brand-en{font-size:8.5px!important}
        html body #${HEADER_ID} .qh-search{width:260px!important;flex-basis:260px!important}
        html body #${HEADER_ID} .qh-clock{min-width:180px!important;font-size:12.5px!important}
        html body #${HEADER_ID} .qh-account{min-width:175px!important}
      }
      @media(max-width:1180px){
        html body #${HEADER_ID} .qh-search{display:none!important}
        html body #${HEADER_ID} .qh-account{min-width:150px!important}
        html body #${HEADER_ID} .qh-clock{min-width:155px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function nativeHeader(){
    return document.querySelector("#root header:not(#"+HEADER_ID+")");
  }
  function nativeButtons(){
    const h=nativeHeader();
    return h?Array.from(h.querySelectorAll("button")):[];
  }
  function findNativeByText(text){
    return nativeButtons().find(b=>clean(b.textContent).includes(text));
  }
  function triggerNativeAccountAction(label){
    const buttons=nativeButtons();
    const account=buttons.find(b=>String(b.getAttribute("aria-label")||"").includes("사용자")||/\(.+\)/.test(clean(b.textContent)));
    if(account) account.click();
    setTimeout(()=>{
      const candidates=Array.from(document.querySelectorAll("#root [role=menuitem],#root button"));
      const target=candidates.find(b=>clean(b.textContent)===label);
      if(target) target.click();
    },60);
  }

  function createHeader(){
    ensureStyle();
    document.getElementById(HEADER_ID)?.remove();

    const header=document.createElement("header");
    header.id=HEADER_ID;
    header.setAttribute("aria-label","나모케미칼 상단 헤더");
    header.innerHTML=`
      <button type="button" class="qh-brand" aria-label="통합 대시보드">
        <img class="qh-symbol" src="/assets/namo-symbol-official.png?v=20261002" alt="">
        <span class="qh-brand-text"><span class="qh-brand-ko">나모케미칼(주)</span><span class="qh-brand-en">NAMO Chemical Co., Ltd.</span></span>
      </button>
      <label class="qh-search" aria-label="메뉴 찾기">${iconSearch}<input type="search" placeholder="메뉴 찾기" autocomplete="off" spellcheck="false"></label>
      <div class="qh-spacer"></div>
      <div class="qh-clock" aria-label="현재 날짜와 시각"></div>
      <button type="button" class="qh-btn qh-mobile" aria-label="모바일 화면">${iconPhone}<span>모바일</span></button>
      <button type="button" class="qh-btn qh-notice" aria-label="알림">${iconBell}<span class="qh-notice-dot" aria-hidden="true"></span></button>
      <div class="qh-account">
        <button type="button" class="qh-account-btn" aria-label="사용자 메뉴" aria-haspopup="menu" aria-expanded="false">
          <span class="qh-avatar"></span><span class="qh-user-name"></span><span class="qh-user-role"></span><span class="qh-caret">⌄</span>
        </button>
        <div class="qh-account-menu" role="menu">
          <button type="button" data-action="password">비밀번호 변경</button>
          <button type="button" data-action="logout">로그아웃</button>
        </div>
      </div>
      <button type="button" class="qh-btn qh-icon qh-settings" aria-label="설정" title="설정">${iconGear}</button>
      <button type="button" class="qh-btn qh-icon qh-grid" aria-label="전체 메뉴" title="전체 메뉴">${iconGrid}</button>
    `;
    document.body.appendChild(header);

    const user=currentUser();
    const name=clean(user.name)||"사용자";
    const dept=clean(user.dept||user.department);
    const pos=clean(user.position||user.title);
    const isAdmin=String(user.role||"").toLowerCase()==="admin";
    const role=[dept,pos,isAdmin?"관리자":""].filter(Boolean).join(" · ")||"QMES 사용자";
    header.querySelector(".qh-user-name").textContent=name;
    header.querySelector(".qh-user-role").textContent=role;
    header.querySelector(".qh-avatar").textContent=name.charAt(0)||"사";

    header.querySelector(".qh-brand").addEventListener("click",()=>{
      const buttons=nativeButtons();
      if(buttons[0]) buttons[0].click();
    });
    header.querySelector(".qh-mobile").addEventListener("click",()=>window.location.assign(MOBILE_URL));
    header.querySelector(".qh-notice").addEventListener("click",()=>{
      const btn=nativeButtons().find(b=>String(b.getAttribute("aria-label")||"").includes("알림"));
      if(btn) btn.click();
    });

    const account=header.querySelector(".qh-account");
    const accountBtn=header.querySelector(".qh-account-btn");
    const setOpen=(open)=>{
      account.classList.toggle("is-open",Boolean(open));
      accountBtn.setAttribute("aria-expanded",String(Boolean(open)));
    };
    accountBtn.addEventListener("click",(e)=>{e.stopPropagation();setOpen(!account.classList.contains("is-open"));});
    header.querySelector('[data-action="password"]').addEventListener("click",()=>triggerNativeAccountAction("비밀번호 변경"));
    header.querySelector('[data-action="logout"]').addEventListener("click",()=>triggerNativeAccountAction("로그아웃"));
    document.addEventListener("click",(e)=>{if(!account.contains(e.target))setOpen(false);});

    const search=header.querySelector(".qh-search input");
    search.addEventListener("keydown",(e)=>{
      if(e.key!=="Enter") return;
      const q=clean(search.value).toLowerCase();
      if(!q) return;
      const side=document.getElementById("qmes-erp-sidebar");
      const item=side&&Array.from(side.querySelectorAll(".qmes-erp-item")).find(b=>clean(b.textContent).toLowerCase().includes(q));
      if(item){e.preventDefault();item.click();search.blur();}
    });

    header.querySelector(".qh-settings").addEventListener("click",()=>{
      const side=document.getElementById("qmes-erp-sidebar");
      const item=side&&Array.from(side.querySelectorAll(".qmes-erp-item")).find(b=>clean(b.textContent)==="회원등록 현황");
      if(item) item.click();
    });
    header.querySelector(".qh-grid").addEventListener("click",()=>{
      const side=document.getElementById("qmes-erp-sidebar");
      if(side){side.classList.remove("qmes-force-collapsed");side.dispatchEvent(new MouseEvent("mouseenter",{bubbles:false}));}
    });

    function tick(){
      const now=new Date();
      const d=["일","월","화","수","목","금","토"];
      const date=`${String(now.getMonth()+1).padStart(2,"0")}월 ${String(now.getDate()).padStart(2,"0")}일 (${d[now.getDay()]})`;
      const time=now.toLocaleTimeString("ko-KR",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
      const clock=header.querySelector(".qh-clock");
      if(clock) clock.textContent=`${date}   ${time}`;
    }
    tick();
    setInterval(tick,1000);
  }

  function start(){
    createHeader();
    const observer=new MutationObserver(()=>{
      if(!document.getElementById(HEADER_ID)) createHeader();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();