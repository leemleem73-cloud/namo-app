(function removeLegacyEquipmentSummary(){
  var LABELS=['등록 설비','30일 이내 일정','기한 초과','미완료 수리'];

  function text(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}

  function findLegacySummary(panel){
    var nodes=Array.from(panel.querySelectorAll('div,section,article'));
    var candidates=nodes.filter(function(node){
      if(node.closest('.qmes-equipment-management-content')) return false;
      var value=text(node);
      return LABELS.every(function(label){return value.includes(label);});
    });
    candidates.sort(function(a,b){
      return a.querySelectorAll('*').length-b.querySelectorAll('*').length;
    });
    return candidates[0]||null;
  }

  function apply(){
    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      var legacy=findLegacySummary(panel);
      if(!legacy) return;
      legacy.setAttribute('data-qmes-legacy-equipment-summary','1');
      legacy.remove();
    });
  }

  apply();
  var scheduled=false;
  new MutationObserver(function(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;apply();});
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
