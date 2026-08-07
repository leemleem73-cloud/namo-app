(function(){
  "use strict";
  if(window.__QMES_TOP_SUBMENU_RESTORE__) return;
  window.__QMES_TOP_SUBMENU_RESTORE__=true;

  const menuMap={
    '대시보드':[
      {label:'종합 대시보드',direct:'대시보드'},
      {label:'SPC 대시보드',group:'품질검사',sub:'SPC (Cpk)'}
    ],
    '생산관리':[
      {label:'생산 진행',group:'생산관리',sub:'생산 (배치)'},
      {label:'작업지시서',group:'생산관리',sub:'작업지시서'}
    ],
    '품질검사':[
      {label:'수입검사 (IQC)',group:'품질검사',sub:'수입검사 (IQC)'},
      {label:'공정검사 (PQC)',group:'품질검사',sub:'공정검사 (PQC)'},
      {label:'출하검사 (OQC)',group:'품질검사',sub:'출하검사 (OQC)'},
      {label:'SPC (Cpk)',group:'품질검사',sub:'SPC (Cpk)'},
      {label:'품질 인터락',group:'품질검사',sub:'품질 인터락 (차단)'},
      {label:'출하성적서',group:'품질검사',sub:'출하성적서'}
    ],
    '현장입력':[{label:'현장 입력 (iPad)',direct:'현장입력'}],
    '재고관리':[{label:'원재료 재고',direct:'재고관리'}],
    '거래처 현황':[{label:'거래처 현황',direct:'거래처 현황'}],
    '설비관리':[{label:'설비 모니터링',direct:'설비관리'}],
    'LOT 추적':[{label:'LOT 추적',direct:'LOT 추적'}],
    '부적합관리':[
      {label:'부적합 (8D)',group:'부적합관리',sub:'부적합 (8D)'},
      {label:'고객불만 (GQMS)',group:'부적합관리',sub:'고객불만 (GQMS)'},
      {label:'4M 변경관리',group:'부적합관리',sub:'4M 변경관리'}
    ]
  };

  const style=document.createElement('style');
  style.id='qmes-top-submenu-restore-style';
  style.textContent=`
    #qmes-all-menu-dropdown{
      position:fixed;
      z-index:9998;
      display:none;
      min-width:210px;
      max-width:280px;
      padding:7px;
      border:1px solid #dbe3ec;
      border-radius:10px;
      background:#fff;
      box-shadow:0 10px 28px rgba(15,23,42,.14);
    }
    #qmes-all-menu-dropdown.is-open{display:block;}
    #qmes-all-menu-dropdown .qmes-hover-title{
      padding:8px 10px 7px;
      margin-bottom:4px;
      border-bottom:1px solid #e8eef5;
      color:#334155;
      font-size:12px;
      font-weight:800;
    }
    #qmes-all-menu-dropdown button{
      width:100%;
      display:block;
      padding:9px 10px;
      border:0;
      border-radius:7px;
      background:transparent;
      color:#334155;
      font-size:12px;
      line-height:18px;
      text-align:left;
      cursor:pointer;
    }
    #qmes-all-menu-dropdown button:hover{background:#eef7ff;color:#0369a1;}
  `;
  document.head.appendChild(style);

  let currentButton=null;
  let closeTimer=null;
  const clean=v=>String(v||'').replace(/[›〉]/g,'').replace(/\s+/g,' ').trim();
  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const findTopButton=label=>topButtons().find(button=>clean(button.textContent)===label);

  function ensureMenu(){
    let menu=document.getElementById('qmes-all-menu-dropdown');
    if(menu) return menu;
    menu=document.createElement('div');
    menu.id='qmes-all-menu-dropdown';
    menu.setAttribute('role','menu');
    document.body.appendChild(menu);
    menu.addEventListener('mouseenter',()=>clearTimeout(closeTimer));
    menu.addEventListener('mouseleave',()=>scheduleClose());
    return menu;
  }

  function closeMenu(){
    clearTimeout(closeTimer);
    document.getElementById('qmes-all-menu-dropdown')?.classList.remove('is-open');
    currentButton=null;
  }

  function scheduleClose(){
    clearTimeout(closeTimer);
    closeTimer=setTimeout(closeMenu,350);
  }

  function clickSub(item){
    const findSub=()=>Array.from(document.querySelectorAll('.qmes-submenu-button')).find(button=>clean(button.textContent)===item.sub);
    if(item.direct){
      closeMenu();
      const direct=findTopButton(item.direct);
      if(direct) direct.click();
      return;
    }
    const existing=findSub();
    if(existing){
      existing.click();
      closeMenu();
      return;
    }
    const group=findTopButton(item.group);
    if(!group) return;
    group.click();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      findSub()?.click();
      closeMenu();
    }));
  }

  function positionMenu(button,menu){
    const rect=button.getBoundingClientRect();
    const width=Math.max(210,Math.min(280,menu.getBoundingClientRect().width||230));
    menu.style.left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left))+'px';
    menu.style.top=(rect.bottom+4)+'px';
  }

  function openFor(button){
    const label=clean(button.textContent);
    const items=menuMap[label];
    if(!items?.length) return;
    clearTimeout(closeTimer);
    currentButton=button;
    const menu=ensureMenu();
    menu.innerHTML='';
    const title=document.createElement('div');
    title.className='qmes-hover-title';
    title.textContent=label;
    menu.appendChild(title);
    items.forEach(item=>{
      const row=document.createElement('button');
      row.type='button';
      row.textContent=item.label;
      row.addEventListener('click',event=>{
        event.stopPropagation();
        clickSub(item);
      });
      menu.appendChild(row);
    });
    menu.classList.add('is-open');
    positionMenu(button,menu);
    requestAnimationFrame(()=>positionMenu(button,menu));
    setTimeout(()=>positionMenu(button,menu),80);
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('.qmes-top-menu-button');
    if(button){
      requestAnimationFrame(()=>openFor(button));
      return;
    }
    const menu=document.getElementById('qmes-all-menu-dropdown');
    if(menu&&!menu.contains(event.target)) closeMenu();
  },false);

  document.addEventListener('mouseover',event=>{
    const button=event.target.closest('.qmes-top-menu-button');
    if(button&&button!==currentButton) openFor(button);
  },true);

  window.addEventListener('resize',()=>{
    const menu=document.getElementById('qmes-all-menu-dropdown');
    if(menu?.classList.contains('is-open')&&currentButton) positionMenu(currentButton,menu);
  });
  window.addEventListener('scroll',()=>{
    const menu=document.getElementById('qmes-all-menu-dropdown');
    if(menu?.classList.contains('is-open')&&currentButton) positionMenu(currentButton,menu);
  },true);
})();
