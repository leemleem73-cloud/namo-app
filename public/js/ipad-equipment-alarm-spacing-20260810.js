(function qmesIpadEquipmentAlarmSpacing(){
  "use strict";
  if(window.__QMES_IPAD_EQUIPMENT_ALARM_SPACING_20260810__) return;
  window.__QMES_IPAD_EQUIPMENT_ALARM_SPACING_20260810__=true;

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
        width:100%!important;
        max-width:none!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        column-gap:28px!important;
      }
      .qmes-ipad-equipment .qmes-em-alarm-history-line>*{
        margin-left:0!important;
        margin-right:0!important;
      }
    `;
  }

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}

  function leafCandidates(root){
    return Array.from(root.querySelectorAll('div,span,p,strong,small,label')).filter(function(el){
      return el.children.length===0 && clean(el.textContent);
    });
  }

  function lowestCommonAncestor(nodes, boundary){
    if(!nodes.length) return null;
    var node=nodes[0].parentElement;
    while(node && node!==boundary.parentElement){
      if(nodes.every(function(target){return node.contains(target);})) return node;
      node=node.parentElement;
    }
    return null;
  }

  function mark(panel){
    var leaves=leafCandidates(panel);
    var warning=leaves.find(function(el){return clean(el.textContent)==='경고';});
    var dr=leaves.find(function(el){return /^DR[-· ]/i.test(clean(el.textContent)) || clean(el.textContent)==='DR-HVAC';});
    var detail=leaves.find(function(el){var text=clean(el.textContent);return text.includes('관리기준')&&text.includes('조치 필요');});
    var time=leaves.find(function(el){return /^\d{1,2}:\d{2}$/.test(clean(el.textContent));});
    if(!warning || !dr || !detail) return;

    var nodes=[warning,dr,detail];
    if(time) nodes.splice(1,0,time);
    var row=lowestCommonAncestor(nodes,panel);
    if(!row || row===panel) return;

    var rect=row.getBoundingClientRect();
    if(rect.height>120) return;
    row.classList.add('qmes-em-alarm-history-line');
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
