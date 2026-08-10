(function qmesIpadEquipmentAlarmSpacing(){
  "use strict";
  if(window.__QMES_IPAD_EQUIPMENT_ALARM_SPACING_20260810_V3__) return;
  window.__QMES_IPAD_EQUIPMENT_ALARM_SPACING_20260810_V3__=true;

  var STYLE_ID='qmes-ipad-equipment-alarm-spacing-20260810-style';

  function ensureStyle(){
    var style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=`
      .qmes-ipad-equipment .qmes-em-alarm-history-line{
        width:88%!important;
        max-width:none!important;
        margin-left:auto!important;
        margin-right:auto!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:0!important;
      }
      .qmes-ipad-equipment .qmes-em-alarm-history-line>*{
        margin-left:0!important;
        margin-right:0!important;
        flex:0 0 auto!important;
      }
      .qmes-ipad-equipment .qmes-em-alarm-history-line>*:last-child{
        min-width:0!important;
      }
    `;
  }

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}

  function leafCandidates(root){
    return Array.from(root.querySelectorAll('div,span,p,strong,small,label')).filter(function(el){
      return el.children.length===0 && clean(el.textContent);
    });
  }

  function findRowFromWarning(warning,panel){
    var node=warning.parentElement;
    while(node && node!==panel){
      var text=clean(node.textContent);
      var rect=node.getBoundingClientRect();
      var hasTime=/\b\d{1,2}:\d{2}\b/.test(text);
      var hasDetail=text.includes('관리기준') && text.includes('조치 필요');
      if(hasTime && hasDetail && rect.height>20 && rect.height<100){
        return node;
      }
      node=node.parentElement;
    }
    return null;
  }

  function mark(panel){
    var warnings=leafCandidates(panel).filter(function(el){
      return clean(el.textContent)==='경고';
    });

    warnings.forEach(function(warning){
      var row=findRowFromWarning(warning,panel);
      if(row) row.classList.add('qmes-em-alarm-history-line');
    });
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll('.qmes-ipad-equipment').forEach(mark);
  }

  var scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;apply();});
  }

  apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',schedule,true);
})();
