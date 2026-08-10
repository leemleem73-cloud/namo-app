(function qmesEquipmentSidebarLayout(){
  'use strict';
  if(window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260810_V2__) return;
  window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260810_V2__=true;

  var STYLE_ID='qmes-equipment-sidebar-layout-20260810-style';
  var MENU_GROUPS=[
    {key:'daily',label:'일일점검',aliases:['일일점검']},
    {key:'registry',label:'설비대장',aliases:['설비대장']},
    {key:'schedule',label:'정기점검·교정',aliases:['정기점검·교정','정기점검 교정']},
    {key:'repair',label:'고장·수리 이력',aliases:['고장·수리 이력','고장수리 이력']}
  ];

  function normalize(text){return String(text||'').replace(/\s+/g,' ').trim();}
  function groupForText(text){
    var value=normalize(text);
    return MENU_GROUPS.find(function(group){return group.aliases.includes(value);})||null;
  }

  function ensureStyle(){
    var style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      .qmes-ipad-equipment.qmes-em-sidebar-ready{
        position:relative!important;box-sizing:border-box!important;
        padding-left:214px!important;min-height:720px!important;
      }
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block.qmes-em-original-nav{
        position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;
        opacity:0!important;pointer-events:none!important;margin:0!important;padding:0!important;
        border:0!important;clip-path:inset(50%)!important;
      }
      .qmes-em-real-sidebar{
        position:absolute!important;left:18px!important;top:22px!important;width:176px!important;
        display:flex!important;flex-direction:column!important;gap:9px!important;padding:10px!important;
        border-radius:14px!important;background:linear-gradient(180deg,#172c40 0%,#263949 100%)!important;
        border:1px solid #405466!important;box-shadow:none!important;box-sizing:border-box!important;z-index:5!important;
      }
      .qmes-em-real-sidebar::before{
        content:'설비 관리'!important;display:block!important;padding:6px 8px 9px!important;
        color:#f8fafc!important;font-size:15px!important;font-weight:900!important;letter-spacing:-.02em!important;
      }
      .qmes-em-real-sidebar>button{
        width:100%!important;min-height:58px!important;padding:0 15px!important;margin:0!important;
        display:flex!important;align-items:center!important;justify-content:flex-start!important;text-align:left!important;
        border-radius:10px!important;border:1px solid #94a3b1!important;background:#f7f9fb!important;
        color:#2d4052!important;font-size:16px!important;font-weight:900!important;line-height:1.2!important;
        box-shadow:none!important;cursor:pointer!important;white-space:normal!important;word-break:keep-all!important;
      }
      .qmes-em-real-sidebar>button:hover,.qmes-em-real-sidebar>button:focus-visible{
        background:#edf2f5!important;border-color:#6f8497!important;color:#142c40!important;outline:none!important;
      }
      .qmes-em-real-sidebar>button.is-selected{
        background:#dce5eb!important;color:#102a40!important;border:2px solid #496d89!important;
        box-shadow:inset 5px 0 0 #173c59!important;
      }
      .qmes-em-real-sidebar>button span{color:inherit!important;font:inherit!important;}
      @media(max-width:900px){
        .qmes-ipad-equipment.qmes-em-sidebar-ready{padding-left:0!important;padding-top:154px!important;}
        .qmes-em-real-sidebar{left:16px!important;right:16px!important;top:12px!important;width:auto!important;
          display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;}
        .qmes-em-real-sidebar::before{grid-column:1/-1!important;padding-bottom:2px!important;}
        .qmes-em-real-sidebar>button{min-height:48px!important;justify-content:center!important;text-align:center!important;font-size:14px!important;}
      }
    `;
  }

  function getOriginalButtons(panel){
    return Array.from(panel.querySelectorAll('button')).filter(function(button){
      if(button.closest('.qmes-em-real-sidebar')) return false;
      return !!groupForText(button.textContent);
    });
  }

  function findOriginalButton(panel,group){
    return getOriginalButtons(panel).find(function(button){
      var match=groupForText(button.textContent);
      return match&&match.key===group.key;
    })||null;
  }

  function currentGroup(panel,buttons){
    var active=buttons.find(function(button){
      return button.classList.contains('qmes-equipment-nav-selected')||
        button.classList.contains('is-active')||button.getAttribute('aria-selected')==='true';
    });
    return active?groupForText(active.textContent):null;
  }

  function ensureSidebar(panel,buttons){
    var nav=buttons[0]&&buttons[0].parentElement;
    if(!nav) return;
    nav.classList.add('qmes-equipment-nav-block','qmes-em-original-nav');
    panel.classList.add('qmes-em-sidebar-ready');

    var sidebar=panel.querySelector(':scope > .qmes-em-real-sidebar');
    if(!sidebar){
      sidebar=document.createElement('nav');
      sidebar.className='qmes-em-real-sidebar';
      sidebar.setAttribute('aria-label','설비점검 메뉴');
      MENU_GROUPS.forEach(function(group){
        var original=findOriginalButton(panel,group);
        if(!original) return;
        var button=document.createElement('button');
        button.type='button';
        button.dataset.emMenu=group.key;
        var span=document.createElement('span');
        span.textContent=group.label;
        button.appendChild(span);
        button.addEventListener('click',function(){
          var target=findOriginalButton(panel,group);
          if(target){
            target.click();
            requestAnimationFrame(function(){syncSelection(panel);});
          }
        });
        sidebar.appendChild(button);
      });
      panel.insertBefore(sidebar,panel.firstChild);
    }
    syncSelection(panel);
  }

  function syncSelection(panel){
    var sidebar=panel.querySelector(':scope > .qmes-em-real-sidebar');
    if(!sidebar) return;
    var originals=getOriginalButtons(panel);
    var active=currentGroup(panel,originals);
    if(!active){
      active=MENU_GROUPS.find(function(group){return !!findOriginalButton(panel,group);})||null;
    }
    sidebar.querySelectorAll('button[data-em-menu]').forEach(function(button){
      button.classList.toggle('is-selected',!!active&&button.dataset.emMenu===active.key);
    });
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      var buttons=getOriginalButtons(panel);
      if(buttons.length>=3) ensureSidebar(panel,buttons);
    });
  }

  apply();
  var scheduled=false;
  new MutationObserver(function(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;apply();});
  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-selected']});
})();
