(function qmesEquipmentSidebarLayout(){
  'use strict';
  if(window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260811_V1__) return;
  window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260811_V1__=true;

  var STYLE_ID='qmes-equipment-sidebar-layout-20260811-style';
  var selectedKey='daily';
  var MENU_GROUPS=[
    {key:'daily',label:'일일점검',aliases:['일일점검']},
    {key:'registry',label:'설비대장',aliases:['설비대장']},
    {key:'schedule',label:'정기점검·교정',aliases:['정기점검·교정','정기점검 교정']},
    {key:'repair',label:'고장·수리 이력',aliases:['고장·수리 이력','고장수리 이력']}
  ];

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function groupForText(value){
    var text=clean(value);
    return MENU_GROUPS.find(function(group){return group.aliases.includes(text);})||null;
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
      .qmes-em-original-menu-button,
      .qmes-em-original-menu-shell{
        display:none!important;
        visibility:hidden!important;
        width:0!important;height:0!important;
        min-width:0!important;min-height:0!important;
        max-width:0!important;max-height:0!important;
        margin:0!important;padding:0!important;border:0!important;
        overflow:hidden!important;opacity:0!important;pointer-events:none!important;
      }
      .qmes-em-fixed-sidebar{
        position:absolute!important;
        left:14px!important;top:14px!important;width:188px!important;
        display:flex!important;flex-direction:column!important;gap:8px!important;
        padding:12px!important;box-sizing:border-box!important;z-index:50!important;
        border:1px solid #405466!important;border-radius:14px!important;
        background:linear-gradient(180deg,#172c40 0%,#23384a 100%)!important;
        box-shadow:none!important;
      }
      .qmes-em-fixed-sidebar-title{
        padding:5px 8px 9px!important;color:#f8fafc!important;
        font-size:16px!important;font-weight:900!important;line-height:1.2!important;
      }
      .qmes-em-fixed-sidebar>button{
        display:flex!important;align-items:center!important;justify-content:flex-start!important;
        width:100%!important;min-height:58px!important;margin:0!important;padding:0 14px!important;
        border:1px solid #8295a5!important;border-radius:9px!important;background:#f7f9fb!important;
        color:#2c4052!important;font-family:Pretendard,system-ui,sans-serif!important;
        font-size:16px!important;font-weight:900!important;line-height:1.2!important;
        text-align:left!important;white-space:normal!important;word-break:keep-all!important;box-shadow:none!important;
      }
      .qmes-em-fixed-sidebar>button:hover,
      .qmes-em-fixed-sidebar>button:focus-visible{
        background:#edf2f5!important;color:#132d42!important;border-color:#617b90!important;outline:none!important;
      }
      .qmes-em-fixed-sidebar>button.is-selected{
        background:#dce5eb!important;color:#0f2b42!important;border:2px solid #496d89!important;
        box-shadow:inset 5px 0 0 #173c59!important;
      }
      @media(max-width:900px){
        .qmes-ipad-equipment.qmes-em-management-root{padding-left:0!important;padding-top:172px!important;}
        .qmes-em-fixed-sidebar{
          left:10px!important;right:10px!important;top:10px!important;width:auto!important;
          display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        }
        .qmes-em-fixed-sidebar-title{grid-column:1/-1!important;padding-bottom:2px!important;}
        .qmes-em-fixed-sidebar>button{
          min-height:48px!important;justify-content:center!important;text-align:center!important;font-size:14px!important;
        }
      }
    `;
  }

  function originalButtons(root){
    return Array.from(root.querySelectorAll('button')).filter(function(button){
      return !button.closest('.qmes-em-fixed-sidebar') && !!groupForText(button.textContent);
    });
  }

  function originalFor(root,key){
    return originalButtons(root).find(function(button){
      var group=groupForText(button.textContent);
      return group&&group.key===key;
    })||null;
  }

  function markOriginalHidden(button,root){
    button.classList.add('qmes-em-original-menu-button');
    var shell=button.parentElement;
    if(!shell||shell===root) return;

    var interactive=Array.from(shell.querySelectorAll('button,input,select,textarea,a'));
    var text=clean(shell.textContent);
    if(interactive.length===1 && interactive[0]===button && groupForText(text)){
      shell.classList.add('qmes-em-original-menu-shell');
    }
  }

  function detectSelected(root){
    var active=originalButtons(root).find(function(button){
      return button.classList.contains('qmes-equipment-nav-selected') ||
        button.classList.contains('is-active') ||
        button.getAttribute('aria-selected')==='true';
    });
    var group=active&&groupForText(active.textContent);
    if(group) selectedKey=group.key;
  }

  function syncSidebar(root){
    var sidebar=root.querySelector(':scope > .qmes-em-fixed-sidebar');
    if(!sidebar) return;
    detectSelected(root);
    sidebar.querySelectorAll('button[data-em-menu]').forEach(function(button){
      button.classList.toggle('is-selected',button.dataset.emMenu===selectedKey);
    });
  }

  function buildSidebar(root){
    var sidebar=root.querySelector(':scope > .qmes-em-fixed-sidebar');
    if(!sidebar){
      sidebar=document.createElement('nav');
      sidebar.className='qmes-em-fixed-sidebar';
      sidebar.setAttribute('aria-label','설비점검 메뉴');

      var title=document.createElement('div');
      title.className='qmes-em-fixed-sidebar-title';
      title.textContent='설비 관리';
      sidebar.appendChild(title);

      MENU_GROUPS.forEach(function(group){
        var button=document.createElement('button');
        button.type='button';
        button.dataset.emMenu=group.key;
        button.textContent=group.label;
        button.addEventListener('click',function(){
          selectedKey=group.key;
          syncSidebar(root);
          var original=originalFor(root,group.key);
          if(original){
            original.click();
            window.setTimeout(apply,30);
          }
        });
        sidebar.appendChild(button);
      });
      root.insertBefore(sidebar,root.firstChild);
    }
    syncSidebar(root);
  }

  function applyToPanel(root){
    var buttons=originalButtons(root);
    if(!buttons.length) return;

    root.classList.add('qmes-em-management-root');
    detectSelected(root);
    buttons.forEach(function(button){markOriginalHidden(button,root);});
    buildSidebar(root);
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
    childList:true,subtree:true,attributes:true,
    attributeFilter:['class','aria-selected']
  });
  document.addEventListener('click',schedule,true);
  window.addEventListener('load',schedule);
})();
