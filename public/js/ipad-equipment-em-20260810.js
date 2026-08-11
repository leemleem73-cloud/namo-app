(function qmesIpadEquipmentEm(){
  var selectedEquipmentMenu='일일점검';
  var EQUIPMENT_MENU_LABELS=['일일점검','설비대장','정기점검·교정','정기점검 교정','고장·수리 이력','고장수리 이력'];
  function normalizeEquipmentMenu(text){var value=String(text||'').replace(/\s+/g,' ').trim();if(value==='정기점검 교정')return '정기점검·교정';if(value==='고장수리 이력')return '고장·수리 이력';return value;}
  function ensureEquipmentFixStyle(){
    var id='qmes-equipment-em-direct-fix',style=document.getElementById(id);
    if(!style){style=document.createElement('style');style.id=id;document.head.appendChild(style);}
    style.textContent=`
      .qmes-ipad-equipment .qmes-equipment-subcaption-hidden{display:none!important;}
      .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button,
      .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.qmes-equipment-nav-selected{
        background:transparent!important;background-color:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;outline:0!important;
      }
      .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button.qmes-equipment-nav-selected{color:#1265d8!important;-webkit-text-fill-color:#1265d8!important;}
      .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button::before,
      .qmes-ipad-equipment .qmes-equipment-management-sidebar.qmes-equipment-nav-block>button::after{content:none!important;display:none!important;}
      .qmes-ipad-equipment .qmes-equipment-complete-status{background:#fff!important;border:1.5px solid #22c55e!important;color:#16a34a!important;box-shadow:none!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-panel{overflow:hidden!important;border:1px solid #d7e0e8!important;border-radius:12px!important;background:#fff!important;box-shadow:none!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-title{color:#0f2f63!important;font-size:20px!important;font-weight:900!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-table-head,.qmes-ipad-equipment .qmes-equipment-alarm-row{display:grid!important;grid-template-columns:150px 140px 160px minmax(0,1fr)!important;align-items:center!important;padding-left:26px!important;padding-right:26px!important;box-sizing:border-box!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-table-head{min-height:56px!important;margin:0 14px!important;border:1px solid #d7e0e8!important;border-radius:7px!important;background:#f8fafc!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-table-head>span{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;font-size:15px!important;font-weight:850!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-list{display:flex!important;flex-direction:column!important;width:100%!important;margin:0!important;padding:0 14px!important;background:#fff!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-row{min-height:82px!important;border:0!important;border-bottom:1px solid #d7e0e8!important;background:#fff!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-row:last-child{border-bottom:0!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-level{display:inline-flex!important;align-items:center!important;justify-content:center!important;justify-self:center!important;width:88px!important;height:42px!important;border:1.5px solid #ff8a1f!important;border-radius:6px!important;background:#fff!important;color:#ff6b00!important;font-size:16px!important;font-weight:900!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-time,.qmes-ipad-equipment .qmes-equipment-alarm-eq{justify-self:center!important;text-align:center!important;font-size:15px!important;color:#111827!important;}
      .qmes-ipad-equipment .qmes-equipment-alarm-message{justify-self:stretch!important;padding-left:8px!important;font-size:15px!important;color:#111827!important;font-weight:600!important;}
    `;
  }
  function markEquipmentMenu(panel){
    var buttons=Array.from(panel.querySelectorAll('button')).filter(function(button){return EQUIPMENT_MENU_LABELS.includes(button.textContent.replace(/\s+/g,' ').trim());});
    if(!buttons.length)return;
    var nav=buttons[0].parentElement;if(nav)nav.classList.add('qmes-equipment-nav-block');
    buttons.forEach(function(button){var label=normalizeEquipmentMenu(button.textContent);button.classList.toggle('qmes-equipment-nav-selected',label===selectedEquipmentMenu);if(button.dataset.qmesEquipmentMenuBound==='1')return;button.dataset.qmesEquipmentMenuBound='1';button.addEventListener('click',function(){selectedEquipmentMenu=normalizeEquipmentMenu(button.textContent);requestAnimationFrame(apply);});});
  }
  function cleanSummary(panel){
    var labels=['등록 설비','30일 이내 일정','기한 초과','미완료 수리'];
    labels.forEach(function(label){panel.querySelectorAll('div,span,p,strong').forEach(function(el){if(el.children.length!==0||el.textContent.trim()!==label)return;var card=el.parentElement;if(card&&!card.closest('.qmes-equipment-management-summary'))card.classList.add('qmes-equipment-summary-card');});});
  }
  function markAlarmPanel(panel){
    var title=Array.from(panel.querySelectorAll('h1,h2,h3,h4,h5,strong,div,span')).find(function(el){return el.children.length===0&&el.textContent.replace(/\s+/g,' ').trim()==='설비 · 공정 알람 이력';});
    if(!title)return;var alarmPanel=title.closest('section,article')||title.parentElement;if(!alarmPanel)return;alarmPanel.classList.add('qmes-equipment-alarm-panel');title.classList.add('qmes-equipment-alarm-title');
    var list=alarmPanel.querySelector('ul');if(!list)return;list.classList.add('qmes-equipment-alarm-list');
    if(!alarmPanel.querySelector('.qmes-equipment-alarm-table-head')){var head=document.createElement('div');head.className='qmes-equipment-alarm-table-head';['경고','시간','DR','조치 필요'].forEach(function(label){var span=document.createElement('span');span.textContent=label;head.appendChild(span);});list.parentNode.insertBefore(head,list);}
    Array.from(list.children).forEach(function(row){row.classList.add('qmes-equipment-alarm-row');var parts=Array.from(row.querySelectorAll('span'));if(parts[0])parts[0].classList.add('qmes-equipment-alarm-level');if(parts[1])parts[1].classList.add('qmes-equipment-alarm-time');if(parts[2])parts[2].classList.add('qmes-equipment-alarm-eq');if(parts[3])parts[3].classList.add('qmes-equipment-alarm-message');});
  }
  function apply(){ensureEquipmentFixStyle();document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){markEquipmentMenu(panel);cleanSummary(panel);markAlarmPanel(panel);});}
  var scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;apply();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
