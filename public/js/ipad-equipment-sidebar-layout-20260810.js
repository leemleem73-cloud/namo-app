(function qmesEquipmentSidebarLayout(){
  'use strict';
  if(window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260811_V2__) return;
  window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260811_V2__=true;

  var STYLE_ID='qmes-equipment-sidebar-layout-20260811-v2-style';
  var MENU_GROUPS=[
    {key:'daily',label:'일일점검',aliases:['일일점검']},
    {key:'registry',label:'설비대장',aliases:['설비대장']},
    {key:'schedule',label:'정기점검·교정',aliases:['정기점검·교정','정기점검 교정']},
    {key:'repair',label:'고장·수리 이력',aliases:['고장·수리 이력','고장수리 이력']}
  ];

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function groupForText(value){
    var text=clean(value);
    return MENU_GROUPS.find(function(group){return group.aliases.indexOf(text)!==-1;})||null;
  }

  function ensureStyle(){
    var style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      .qmes-ipad-equipment.qmes-em-management-root{
        position:relative!important;
        box-sizing:border-box!important;
        padding-left:220px!important;
        min-height:720px!important;
      }
      .qmes-em-fixed-sidebar{
        position:absolute!important;
        left:14px!important;
        top:14px!important;
        width:188px!important;
        display:flex!important;
        flex-direction:column!important;
        gap:8px!important;
        padding:12px!important;
        box-sizing:border-box!important;
        z-index:100!important;
        border:1px solid #405466!important;
        border-radius:14px!important;
        background:linear-gradient(180deg,#172c40 0%,#23384a 100%)!important;
        box-shadow:none!important;
      }
      .qmes-em-fixed-sidebar-title{
        display:block!important;
        padding:5px 8px 9px!important;
        margin:0!important;
        color:#f8fafc!important;
        font-size:16px!important;
        font-weight:900!important;
        line-height:1.2!important;
      }
      .qmes-em-fixed-sidebar>button.qmes-em-sidebar-button{
        position:relative!important;
        inset:auto!important;
        float:none!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        flex:0 0 auto!important;
        width:100%!important;
        max-width:none!important;
        min-width:0!important;
        min-height:54px!important;
        height:auto!important;
        margin:0!important;
        padding:0 14px!important;
        box-sizing:border-box!important;
        border:1px solid #8295a5!important;
        border-radius:9px!important;
        background:#f7f9fb!important;
        color:#2c4052!important;
        font-family:Pretendard,system-ui,sans-serif!important;
        font-size:15px!important;
        font-weight:900!important;
        line-height:1.2!important;
        text-align:left!important;
        white-space:normal!important;
        word-break:keep-all!important;
        box-shadow:none!important;
        transform:none!important;
      }
      .qmes-em-fixed-sidebar>button.qmes-em-sidebar-button:hover,
      .qmes-em-fixed-sidebar>button.qmes-em-sidebar-button:focus-visible{
        background:#edf2f5!important;
        color:#132d42!important;
        border-color:#617b90!important;
        outline:none!important;
      }
      .qmes-em-fixed-sidebar>button.qmes-em-sidebar-button.qmes-equipment-nav-selected,
      .qmes-em-fixed-sidebar>button.qmes-em-sidebar-button.is-active,
      .qmes-em-fixed-sidebar>button.qmes-em-sidebar-button[aria-selected="true"]{
        background:#dce5eb!important;
        color:#0f2b42!important;
        border:2px solid #496d89!important;
        box-shadow:inset 5px 0 0 #173c59!important;
      }
      .qmes-em-vacated-menu-shell{
        display:none!important;
        width:0!important;
        height:0!important;
        min-width:0!important;
        min-height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        overflow:hidden!important;
      }
      @media(max-width:900px){
        .qmes-ipad-equipment.qmes-em-management-root{
          padding-left:0!important;
          padding-top:280px!important;
        }
        .qmes-em-fixed-sidebar{
          left:10px!important;
          right:10px!important;
          top:10px!important;
          width:auto!important;
        }
      }
    `;
  }

  function getAllMenuButtons(root){
    return Array.from(root.querySelectorAll('button')).filter(function(button){
      return !!groupForText(button.textContent);
    });
  }

  function ensureSidebar(root){
    var sidebar=root.querySelector(':scope > .qmes-em-fixed-sidebar');
    if(sidebar) return sidebar;

    sidebar=document.createElement('nav');
    sidebar.className='qmes-em-fixed-sidebar';
    sidebar.setAttribute('aria-label','설비점검 메뉴');

    var title=document.createElement('div');
    title.className='qmes-em-fixed-sidebar-title';
    title.textContent='설비 관리';
    sidebar.appendChild(title);

    root.insertBefore(sidebar,root.firstChild);
    return sidebar;
  }

  function hideVacatedShell(shell,root){
    if(!shell||shell===root||shell.classList.contains('qmes-em-fixed-sidebar')) return;
    var remaining=Array.from(shell.children).filter(function(child){
      return !(child.classList&&child.classList.contains('qmes-em-fixed-sidebar'));
    });
    var interactive=shell.querySelector('button,input,select,textarea,a');
    var text=clean(shell.textContent);
    if(!interactive && !text && remaining.length===0){
      shell.classList.add('qmes-em-vacated-menu-shell');
      return;
    }
    if(!interactive && !text){
      shell.classList.add('qmes-em-vacated-menu-shell');
    }
  }

  function moveButtonsIntoSidebar(root,sidebar){
    var all=getAllMenuButtons(root);
    var byKey={};

    all.forEach(function(button){
      var group=groupForText(button.textContent);
      if(!group) return;
      if(!byKey[group.key] || !byKey[group.key].closest('.qmes-em-fixed-sidebar')){
        byKey[group.key]=button;
      }
    });

    MENU_GROUPS.forEach(function(group){
      var button=byKey[group.key];
      if(!button) return;

      if(button.parentElement!==sidebar){
        var oldParent=button.parentElement;
        button.classList.remove('qmes-em-original-menu-button');
        button.classList.add('qmes-em-sidebar-button');
        button.dataset.emMenu=group.key;
        sidebar.appendChild(button);
        hideVacatedShell(oldParent,root);
      } else {
        button.classList.add('qmes-em-sidebar-button');
        button.dataset.emMenu=group.key;
      }
    });

    var sidebarButtons=Array.from(sidebar.querySelectorAll(':scope > button.qmes-em-sidebar-button'));
    var seen={};
    sidebarButtons.forEach(function(button){
      var group=groupForText(button.textContent);
      if(!group) return;
      if(seen[group.key]){
        button.remove();
      } else {
        seen[group.key]=true;
      }
    });

    MENU_GROUPS.forEach(function(group){
      var button=Array.from(sidebar.querySelectorAll(':scope > button.qmes-em-sidebar-button')).find(function(item){
        var matched=groupForText(item.textContent);
        return matched&&matched.key===group.key;
      });
      if(button) sidebar.appendChild(button);
    });
  }

  function applyToPanel(root){
    var menuButtons=getAllMenuButtons(root);
    if(!menuButtons.length) return;

    root.classList.add('qmes-em-management-root');
    var sidebar=ensureSidebar(root);
    moveButtonsIntoSidebar(root,sidebar);
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll('.qmes-ipad-equipment').forEach(applyToPanel);
  }

  apply();
  var scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;apply();});
  }

  new MutationObserver(schedule).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','aria-selected']
  });
  document.addEventListener('click',schedule,true);
  window.addEventListener('load',schedule);
})();
