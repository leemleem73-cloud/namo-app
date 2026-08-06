(function(){
  "use strict";
  if(window.__QMES_LEFT_NATIVE_MENU_V1__) return;
  window.__QMES_LEFT_NATIVE_MENU_V1__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const TOP_LABELS=["대시보드","생산관리","품질검사","현장입력","재고관리","거래처 현황","설비관리","LOT 추적","부적합관리"];

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu","qmes-stable-sidebar","qmes-safe-sidebar","qmes-left-native-menu"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style","qmes-stable-sidebar-style","qmes-safe-sidebar-style","qmes-left-native-menu-style"].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove("qmes-context-side-enabled","qmes-stable-sidebar-open","qmes-safe-sidebar-open");
  document.querySelectorAll("[data-qmes-left-native-source]").forEach(node=>node.removeAttribute("data-qmes-left-native-source"));

  const style=document.createElement("style");
  style.id="qmes-left-native-menu-style";
  style.textContent=`
    #qmes-left-native-menu{
      position:fixed!important;
      left:18px!important;
      top:var(--qmes-left-native-top,92px)!important;
      width:190px!important;
      max-height:calc(100vh - var(--qmes-left-native-top,92px) - 18px)!important;
      overflow-y:auto!important;
      z-index:99980!important;
      padding:14px 10px 16px!important;
      box-sizing:border-box!important;
      border:1px solid #e1e6ec!important;
      border-radius:10px!important;
      background:#fff!important;
      box-shadow:0 3px 12px rgba(15,23,42,.06)!important;
      display:none!important;
    }
    #qmes-left-native-menu.is-open{display:block!important}
    #qmes-left-native-menu .qmes-left-native-title{
      padding:2px 8px 11px!important;
      margin:0 0 6px!important;
      border-bottom:1px solid #e7ebf0!important;
      color:#172033!important;
      font-size:14px!important;
      font-weight:800!important;
      line-height:20px!important;
    }
    #qmes-left-native-menu .qmes-left-native-item{
      position:relative!important;
      display:flex!important;
      align-items:center!important;
      width:100%!important;
      min-height:39px!important;
      margin:2px 0!important;
      padding:9px 10px 9px 13px!important;
      border:0!important;
      border-radius:7px!important;
      background:transparent!important;
      color:#475569!important;
      font-size:13px!important;
      font-weight:700!important;
      text-align:left!important;
      cursor:pointer!important;
      box-sizing:border-box!important;
    }
    #qmes-left-native-menu .qmes-left-native-item:hover{background:#f3f6f9!important;color:#172033!important}
    #qmes-left-native-menu .qmes-left-native-item.is-active{background:#edf4ff!important;color:#175cd3!important}
    #qmes-left-native-menu .qmes-left-native-item.is-active:before{
      content:""!important;
      position:absolute!important;
      left:0!important;
      top:8px!important;
      bottom:8px!important;
      width:3px!important;
      border-radius:3px!important;
      background:#2563eb!important;
    }
    [data-qmes-left-native-source='true']{
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important;
    }
    @media(max-width:1050px){#qmes-left-native-menu{left:8px!important;width:172px!important}}
  `;
  document.head.appendChild(style);

  const side=document.createElement("aside");
  side.id="qmes-left-native-menu";
  side.setAttribute("aria-label","하위 메뉴");
  side.innerHTML='<div class="qmes-left-native-title"></div><div class="qmes-left-native-items"></div>';
  document.body.appendChild(side);

  let currentTop="";
  let locked=false;
  let activeItem="";
  let snapshot=[];
  let lastSource=null;
  let captureSeq=0;

  function navBottom(){
    const nav=document.querySelector(".qmes-top-menu")||Array.from(document.querySelectorAll("nav,header")).find(node=>TOP_LABELS.filter(label=>clean(node.textContent).includes(label)).length>=3);
    return nav?Math.max(0,Math.round(nav.getBoundingClientRect().bottom)+10):92;
  }

  function allControls(){
    return Array.from(document.querySelectorAll("button,a,[role='button'],[role='menuitem']")).filter(node=>!side.contains(node));
  }

  function findTop(label){
    return allControls().find(node=>clean(node.textContent)===label)||null;
  }

  function fireHover(node){
    if(!node)return;
    try{node.dispatchEvent(new PointerEvent("pointerenter",{bubbles:false,cancelable:true,pointerType:"mouse"}));}catch(_){ }
    try{node.dispatchEvent(new PointerEvent("pointerover",{bubbles:true,cancelable:true,pointerType:"mouse"}));}catch(_){ }
    node.dispatchEvent(new MouseEvent("mouseenter",{bubbles:false,cancelable:true,view:window}));
    node.dispatchEvent(new MouseEvent("mouseover",{bubbles:true,cancelable:true,view:window}));
  }

  function visibleMenuCandidates(){
    const topY=navBottom()-12;
    return Array.from(document.querySelectorAll("body *")).filter(node=>{
      if(!(node instanceof HTMLElement)||side.contains(node))return false;
      if(node.matches("dialog,[role='dialog']")||node.closest("dialog,[role='dialog']"))return false;
      const css=getComputedStyle(node);
      if(css.display==="none"||css.visibility==="hidden"||Number(css.opacity)===0)return false;
      if(!["absolute","fixed"].includes(css.position))return false;
      const rect=node.getBoundingClientRect();
      if(rect.width<80||rect.width>620||rect.height<22||rect.height>700||rect.bottom<topY)return false;
      const controls=Array.from(node.querySelectorAll("button,a,[role='button'],[role='menuitem']")).filter(c=>clean(c.textContent));
      return controls.length>0;
    });
  }

  function chooseSource(){
    const candidates=visibleMenuCandidates();
    if(!candidates.length)return null;
    candidates.sort((a,b)=>{
      const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
      const ac=a.querySelectorAll("button,a,[role='button'],[role='menuitem']").length;
      const bc=b.querySelectorAll("button,a,[role='button'],[role='menuitem']").length;
      if(ac!==bc)return bc-ac;
      return (ar.width*ar.height)-(br.width*br.height);
    });
    return candidates[0]||null;
  }

  function extract(source){
    const seen=new Set();
    const rows=[];
    Array.from(source.querySelectorAll("button,a,[role='button'],[role='menuitem']")).forEach((node,index)=>{
      const label=clean(node.textContent);
      if(!label||TOP_LABELS.includes(label)||seen.has(label))return;
      const rect=node.getBoundingClientRect();
      if(rect.width===0&&rect.height===0)return;
      seen.add(label);
      rows.push({label,index});
    });
    return rows;
  }

  function render(){
    if(!currentTop||!snapshot.length)return;
    side.querySelector(".qmes-left-native-title").textContent=currentTop;
    const wrap=side.querySelector(".qmes-left-native-items");
    wrap.replaceChildren();
    snapshot.forEach((item,i)=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="qmes-left-native-item"+(item.label===activeItem?" is-active":"");
      btn.textContent=item.label;
      btn.dataset.index=String(i);
      wrap.appendChild(btn);
    });
    document.documentElement.style.setProperty("--qmes-left-native-top",`${navBottom()}px`);
    side.classList.add("is-open");
  }

  function hideSource(source){
    document.querySelectorAll("[data-qmes-left-native-source='true']").forEach(node=>node.removeAttribute("data-qmes-left-native-source"));
    if(source){
      source.dataset.qmesLeftNativeSource="true";
      lastSource=source;
    }
  }

  function captureTop(label,{lock=false}={}){
    if(lock)locked=true;
    if(!lock&&locked&&label!==currentTop)return;
    currentTop=label;
    const seq=++captureSeq;
    const top=findTop(label);
    fireHover(top);
    const tryCapture=attempt=>{
      if(seq!==captureSeq)return;
      const source=chooseSource();
      if(source){
        const items=extract(source);
        if(items.length){
          snapshot=items;
          hideSource(source);
          render();
          return;
        }
      }
      if(attempt<8)setTimeout(()=>tryCapture(attempt+1),35);
    };
    setTimeout(()=>tryCapture(0),12);
  }

  function dispatchOriginal(target){
    if(!target)return false;
    try{target.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",button:0}));}catch(_){ }
    target.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,cancelable:true,view:window,button:0}));
    try{target.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerType:"mouse",button:0}));}catch(_){ }
    target.dispatchEvent(new MouseEvent("mouseup",{bubbles:true,cancelable:true,view:window,button:0}));
    target.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window,button:0}));
    return true;
  }

  function activate(index,attempt=0){
    const wanted=snapshot[index];
    if(!wanted||!currentTop)return;
    const top=findTop(currentTop);
    fireHover(top);
    setTimeout(()=>{
      const source=chooseSource()||lastSource;
      if(source){
        const controls=Array.from(source.querySelectorAll("button,a,[role='button'],[role='menuitem']")).filter(node=>clean(node.textContent));
        const target=controls.find(node=>clean(node.textContent)===wanted.label)||controls[wanted.index]||null;
        if(target){
          activeItem=wanted.label;
          render();
          hideSource(source);
          dispatchOriginal(target);
          return;
        }
      }
      if(attempt<6)setTimeout(()=>activate(index,attempt+1),45);
    },28);
  }

  side.addEventListener("click",event=>{
    const btn=event.target.closest(".qmes-left-native-item");
    if(!btn)return;
    event.preventDefault();
    activate(Number(btn.dataset.index)||0,0);
  });

  document.addEventListener("mouseover",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(!control||side.contains(control))return;
    const label=clean(control.textContent);
    if(!TOP_LABELS.includes(label))return;
    captureTop(label,{lock:false});
  },true);

  document.addEventListener("click",event=>{
    const control=event.target.closest("button,a,[role='button']");
    if(!control||side.contains(control))return;
    const label=clean(control.textContent);
    if(!TOP_LABELS.includes(label))return;
    locked=true;
    setTimeout(()=>captureTop(label,{lock:true}),0);
  },false);

  window.addEventListener("resize",()=>document.documentElement.style.setProperty("--qmes-left-native-top",`${navBottom()}px`));
})();