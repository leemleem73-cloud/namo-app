(function qmesEquipmentSidebarLayout(){
  'use strict';
  if(window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260810__) return;
  window.__QMES_EQUIPMENT_SIDEBAR_LAYOUT_20260810__=true;

  var STYLE_ID='qmes-equipment-sidebar-layout-20260810-style';
  var labels=['일일점검','설비대장','정기점검·교정','정기점검 교정','고장·수리 이력','고장수리 이력'];

  function ensureStyle(){
    var style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      .qmes-ipad-equipment.qmes-em-sidebar-ready{position:relative!important;padding-left:190px!important;min-height:720px!important;box-sizing:border-box!important;}
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block{
        position:absolute!important;left:0!important;top:0!important;width:170px!important;
        display:flex!important;flex-direction:column!important;gap:8px!important;margin:0!important;padding:10px!important;
        background:linear-gradient(180deg,#162b40 0%,#24384b 100%)!important;border:1px solid #334a5f!important;
        border-radius:14px!important;box-sizing:border-box!important;box-shadow:none!important;
      }
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block>button{
        width:100%!important;min-height:58px!important;margin:0!important;padding:0 16px!important;
        display:flex!important;align-items:center!important;justify-content:flex-start!important;text-align:left!important;
        background:#f8fafc!important;color:#26384a!important;border:1px solid #aebdca!important;border-radius:10px!important;
        box-shadow:none!important;font-size:16px!important;font-weight:900!important;white-space:nowrap!important;
      }
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block>button:hover,
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block>button:focus-visible{
        background:#eef2f5!important;border-color:#7f93a5!important;color:#17283a!important;outline:none!important;
      }
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block>button.qmes-equipment-nav-selected,
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block>button.is-active,
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block>button[aria-selected='true']{
        background:#dfe7ed!important;color:#10263b!important;border:2px solid #496b86!important;
        box-shadow:inset 5px 0 0 #183b59!important;
      }
      .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block>button *{color:inherit!important;}
      @media(max-width:900px){
        .qmes-ipad-equipment.qmes-em-sidebar-ready{padding-left:0!important;}
        .qmes-ipad-equipment.qmes-em-sidebar-ready .qmes-equipment-nav-block{position:relative!important;width:100%!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;margin-bottom:14px!important;}
      }
    `;
  }

  function normalize(text){return String(text||'').replace(/\s+/g,' ').trim();}
  function mark(panel){
    var buttons=Array.from(panel.querySelectorAll('button')).filter(function(button){return labels.includes(normalize(button.textContent));});
    if(buttons.length<3) return;
    var nav=buttons[0].parentElement;
    if(!nav || !buttons.every(function(button){return button.parentElement===nav;})) return;
    nav.classList.add('qmes-equipment-nav-block');
    panel.classList.add('qmes-em-sidebar-ready');
  }
  function apply(){ensureStyle();document.querySelectorAll('.qmes-ipad-equipment').forEach(mark);}
  apply();
  var scheduled=false;
  new MutationObserver(function(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;apply();});}).observe(document.documentElement,{childList:true,subtree:true});
})();
