/* NAMO QMES - auth/sync coordinator with read-only guest entry. */
(function installQmesLoginSyncCoordinator(global){
  "use strict";
  if(global.__QMES_LOGIN_SYNC_COORDINATOR_CORE_20260903__) return;
  global.__QMES_LOGIN_SYNC_COORDINATOR_CORE_20260903__=true;

  const SESSION_KEY="qmes-current-user-v1";
  const GUEST_LOGIN_ID="guest";
  const GUEST_LOGIN_PASSWORD="guest";
  const GUEST_CLIENT_USER={
    id:"guest",
    uid:"GUEST",
    name:"게스트",
    email:"",
    dept:"게스트",
    position:"열람 전용",
    role:"guest",
    mustChangePassword:false,
    guest:true
  };
  const GUEST_API_USER={
    id:"guest",
    uid:"GUEST",
    name:"게스트",
    email:"",
    department:"게스트",
    title:"열람 전용",
    role:"guest",
    mustChangePassword:false,
    guest:true
  };

  const nativeFetch=global.fetch.bind(global);
  let hasSavedSession=false;try{hasSavedSession=Boolean(sessionStorage.getItem(SESSION_KEY));}catch(_error){}
  let authState=hasSavedSession?"pending":"anonymous",authCheckPromise=null,authCheckResponse=null;
  let optionalBackendDownUntil=0;
  let guestLoginObserver=null;
  let guestButtonQueued=false;

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function urlOf(input){try{if(typeof input==="string")return new URL(input,global.location.href);if(input&&input.url)return new URL(input.url,global.location.href);}catch(_error){}return null;}
  function isSameOrigin(url){return Boolean(url&&url.origin===global.location.origin);}
  function isAuthMe(url){return isSameOrigin(url)&&url.pathname==="/api/auth/me";}
  function isAuthLogin(url){return isSameOrigin(url)&&url.pathname==="/api/auth/login";}
  function isAuthLogout(url){return isSameOrigin(url)&&url.pathname==="/api/auth/logout";}
  function isAuthPassword(url){return isSameOrigin(url)&&url.pathname==="/api/auth/password";}
  function isQmesSync(url){return isSameOrigin(url)&&url.pathname.startsWith("/api/qmes-sync/");}
  function isPurchaseOrders(url){return isSameOrigin(url)&&url.pathname==="/api/purchase-orders";}
  function isOptionalBackend(url,method){return method==="GET"&&(isPurchaseOrders(url)||isQmesSync(url));}
  function sessionUser(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null")||null;}catch(_error){return null;}}
  function isGuestUser(user){return Boolean(user&&(user.guest===true||String(user.role||"").toLowerCase()==="guest"||String(user.id||"").toLowerCase()==="guest"));}
  function isGuestSession(){return isGuestUser(sessionUser());}
  function saveGuestSession(){
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(GUEST_CLIENT_USER));}catch(_error){}
    try{sessionStorage.setItem("qmes_current_tab","dash");sessionStorage.removeItem("qmes_open_menu");}catch(_error){}
    hasSavedSession=true;
    authState="authenticated";
    authCheckResponse=null;
    global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;
    setGuestMarker(true);
  }
  function clearGuestMarker(){setGuestMarker(false);}
  function canAccessCommercialErp(){const user=sessionUser()||{};if(isGuestUser(user))return false;const name=String(user.name||"").replace(/\s+/g,"").trim();const dept=String(user.department||user.dept||"").replace(/\s+/g,"").trim();return dept==="영업부"||["김종혁","김세희","정영기"].includes(name);}
  function jsonResponse(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
  function emptyJsonResponse(){return jsonResponse({success:true,message:"OK",data:[]});}
  function guestMeResponse(){return jsonResponse({success:true,message:"OK",data:GUEST_API_USER});}
  function guestLoginResponse(){return jsonResponse({success:true,message:"게스트 로그인",data:{user:GUEST_API_USER}});}
  function guestForbiddenResponse(){return jsonResponse({success:false,message:"게스트 계정은 열람 전용입니다."},403);}

  function setGuestMarker(enabled){
    try{
      if(enabled)document.documentElement.setAttribute("data-qmes-guest","true");
      else document.documentElement.removeAttribute("data-qmes-guest");
    }catch(_error){}
  }

  function ensureGuestStyle(){
    if(document.getElementById("qmes-guest-login-style-20260914"))return;
    const style=document.createElement("style");
    style.id="qmes-guest-login-style-20260914";
    style.textContent=`
      #qmes-guest-login-20260914{width:100%;height:46px;border:1px solid #9eb4c4;border-radius:11px;background:#f6f9fb;color:#29485f;font-size:14px;font-weight:900;margin-top:10px;cursor:pointer}
      #qmes-guest-login-20260914:hover{background:#edf4f8;border-color:#6f98b3}
      #qmes-guest-login-note-20260914{font-size:11px;color:#7a8b98;text-align:center;margin-top:7px;line-height:1.45}
      html[data-qmes-guest="true"] .qmes-top-menu-item:not(:first-child){display:none!important}
      html[data-qmes-guest="true"] .qmes-header-action{display:none!important}
      html[data-qmes-guest="true"] #qmes-erp-sidebar .qmes-erp-item:not([data-qmes-guest-allowed="true"]){display:none!important}
      html[data-qmes-guest="true"] [role="dialog"][aria-label="계정 설정"]>div>button:first-of-type{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function loginForm(){
    const root=document.getElementById("root");
    if(!root)return null;
    return Array.from(root.querySelectorAll("form")).find(form=>{
      const text=clean(form.textContent);
      return text.includes("나모케미칼 QMES")&&form.querySelector('input[autocomplete="username"]')&&form.querySelector('input[autocomplete="current-password"]');
    })||null;
  }

  function installGuestButton(){
    if(isGuestSession())return true;
    const form=loginForm();
    if(!form)return false;
    if(form.querySelector("#qmes-guest-login-20260914"))return true;
    const submit=Array.from(form.querySelectorAll('button[type="submit"]')).find(button=>clean(button.textContent).includes("로그인"));
    if(!submit)return false;
    const button=document.createElement("button");
    button.type="button";
    button.id="qmes-guest-login-20260914";
    button.textContent="게스트 로그인";
    button.setAttribute("aria-label","게스트로 대시보드 열람");
    const note=document.createElement("div");
    note.id="qmes-guest-login-note-20260914";
    note.textContent="게스트는 대시보드 열람 전용입니다.";
    button.addEventListener("click",()=>{
      saveGuestSession();
      global.location.reload();
    });
    submit.insertAdjacentElement("afterend",button);
    button.insertAdjacentElement("afterend",note);
    return true;
  }

  function stopGuestButtonWatch(){
    if(guestLoginObserver){try{guestLoginObserver.disconnect();}catch(_error){}guestLoginObserver=null;}
  }

  function queueGuestButton(){
    if(guestButtonQueued)return;
    guestButtonQueued=true;
    setTimeout(()=>{guestButtonQueued=false;installGuestButton();},0);
  }

  function startGuestButtonWatch(force=false){
    if(isGuestSession())return;
    if(!force&&sessionUser())return;
    ensureGuestStyle();
    [0,80,200,450,900,1600].forEach(delay=>setTimeout(installGuestButton,delay));
    if(guestLoginObserver||typeof MutationObserver!=="function")return;
    const begin=()=>{
      const root=document.getElementById("root");
      if(!root)return;
      guestLoginObserver=new MutationObserver(queueGuestButton);
      guestLoginObserver.observe(root,{childList:true,subtree:true});
      queueGuestButton();
    };
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",begin,{once:true});else begin();
  }

  function enforceGuestUi(){
    if(!isGuestSession())return;
    setGuestMarker(true);
    try{sessionStorage.setItem("qmes_current_tab","dash");sessionStorage.removeItem("qmes_open_menu");}catch(_error){}
    const side=document.getElementById("qmes-erp-sidebar");
    if(side){
      side.querySelectorAll(".qmes-erp-item").forEach(button=>{
        const label=clean(button.querySelector(".qmes-erp-text")?.textContent||button.textContent);
        const allowed=/^(통합\s*대시보드|대시보드)$/.test(label);
        button.setAttribute("data-qmes-guest-allowed",allowed?"true":"false");
      });
    }
  }

  function scheduleGuestUi(){[0,100,300,700,1400,2600].forEach(delay=>setTimeout(enforceGuestUi,delay));}

  function parseLoginBody(init){
    try{
      const body=init&&init.body;
      if(typeof body!=="string")return null;
      return JSON.parse(body);
    }catch(_error){return null;}
  }
  function isGuestCredentials(init){
    const body=parseLoginBody(init)||{};
    return String(body.loginId||"").trim().toLowerCase()===GUEST_LOGIN_ID&&String(body.password||"")===GUEST_LOGIN_PASSWORD;
  }

  async function inspectAuthResponse(response){let payload=null;try{payload=await response.clone().json();}catch(_error){}authState=(response.ok&&payload?.success&&payload?.data)?"authenticated":"anonymous";global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;return response;}
  function ensureAuthCheck(){if(isGuestSession()){authState="authenticated";global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;return Promise.resolve(guestMeResponse());}if(authCheckResponse)return Promise.resolve(authCheckResponse.clone());if(!authCheckPromise){authCheckPromise=nativeFetch("/api/auth/me",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}}).then(inspectAuthResponse).then(response=>{authCheckResponse=response.clone();return response;}).finally(()=>{authCheckPromise=null;});}return authCheckPromise.then(response=>response.clone());}

  let purchaseGetInFlight=null,purchaseGetCache=null,purchaseGetCacheAt=0;
  function purchaseGet(input,init){const now=Date.now();if(purchaseGetCache&&now-purchaseGetCacheAt<1500){try{return Promise.resolve(purchaseGetCache.clone());}catch(_error){purchaseGetCache=null;}}if(purchaseGetInFlight)return purchaseGetInFlight.then(response=>response.clone());purchaseGetInFlight=nativeFetch(input,init).then(response=>{try{purchaseGetCache=response.clone();purchaseGetCacheAt=Date.now();}catch(_error){purchaseGetCache=null;}return response;}).finally(()=>{purchaseGetInFlight=null;});return purchaseGetInFlight.then(response=>response.clone());}

  if(isGuestSession()){
    authState="authenticated";
    try{sessionStorage.setItem("qmes_current_tab","dash");sessionStorage.removeItem("qmes_open_menu");}catch(_error){}
    setGuestMarker(true);
    scheduleGuestUi();
  }else{
    clearGuestMarker();
    startGuestButtonWatch(false);
  }
  ensureGuestStyle();
  global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;

  global.addEventListener("qmes:navigate-tab",event=>{
    if(!isGuestSession())return;
    const next=String(event?.detail?.tab||"").trim();
    if(!next||next==="dash")return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    try{sessionStorage.setItem("qmes_current_tab","dash");}catch(_error){}
    alert("게스트 계정은 대시보드만 열람할 수 있습니다.");
  });

  document.addEventListener("click",event=>{
    if(!isGuestSession())return;
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const dataTab=target.closest("[data-tab]");
    if(dataTab){
      const next=String(dataTab.getAttribute("data-tab")||"").trim();
      if(next&&next!=="dash"){
        event.preventDefault();event.stopImmediatePropagation();
        alert("게스트 계정은 대시보드만 열람할 수 있습니다.");
        return;
      }
    }
    const sideButton=target.closest("#qmes-erp-sidebar .qmes-erp-item");
    if(sideButton&&sideButton.getAttribute("data-qmes-guest-allowed")!=="true"){
      event.preventDefault();event.stopImmediatePropagation();
      alert("게스트 계정은 대시보드만 열람할 수 있습니다.");
    }
  },true);

  global.addEventListener("load",()=>{if(isGuestSession())scheduleGuestUi();else startGuestButtonWatch(false);},{once:true});

  global.fetch=async function coordinatedFetch(input,init){
    const url=urlOf(input);
    const method=String((init&&init.method)||(input&&input.method)||"GET").toUpperCase();

    if(isAuthLogin(url)&&method==="POST"&&isGuestCredentials(init)){
      saveGuestSession();
      stopGuestButtonWatch();
      scheduleGuestUi();
      return guestLoginResponse();
    }

    if(isGuestSession()){
      if(isAuthMe(url))return guestMeResponse();
      if(isAuthPassword(url))return guestForbiddenResponse();
      if(isPurchaseOrders(url)&&method==="GET")return emptyJsonResponse();
      if(isQmesSync(url))return method==="GET"?emptyJsonResponse():guestForbiddenResponse();
    }

    if(isAuthMe(url)){
      if(authState==="anonymous"&&!hasSavedSession){
        const response=await nativeFetch(input,{...(init||{}),credentials:(init&&init.credentials)||"same-origin",cache:"no-store"});
        if(!response.ok)startGuestButtonWatch(true);
        return response;
      }
      const response=await ensureAuthCheck();
      if(!response.ok)startGuestButtonWatch(true);
      return response;
    }
    if(isPurchaseOrders(url)&&method==="GET"&&!canAccessCommercialErp())return emptyJsonResponse();
    if(isOptionalBackend(url,method)&&Date.now()<optionalBackendDownUntil)return emptyJsonResponse();
    if(isQmesSync(url)&&authState==="pending"){try{await ensureAuthCheck();}catch(_error){}}

    if(isAuthLogout(url)){
      clearGuestMarker();
      stopGuestButtonWatch();
      setTimeout(()=>startGuestButtonWatch(true),0);
    }

    let response;
    if(isPurchaseOrders(url)&&method==="GET")response=await purchaseGet(input,init);
    else response=await nativeFetch(input,init);

    if(isOptionalBackend(url,method)&&response.status>=500){optionalBackendDownUntil=Date.now()+60000;return emptyJsonResponse();}
    if(isAuthLogin(url)&&response.ok){authState="authenticated";hasSavedSession=true;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;clearGuestMarker();stopGuestButtonWatch();}
    else if(isAuthLogout(url)&&response.ok){authState="anonymous";hasSavedSession=false;authCheckResponse=null;global.__QMES_AUTH_BOOTSTRAP_STATE__=authState;setTimeout(()=>startGuestButtonWatch(true),0);}
    return response;
  };
})(window);
