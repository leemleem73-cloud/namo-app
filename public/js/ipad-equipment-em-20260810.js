(function qmesIpadEquipmentEm(){
  function apply(){
    document.querySelectorAll('.qmes-ipad-home-card.is-equipment .qmes-ipad-home-code').forEach(function(el){
      if(el.textContent.trim()==='EQ') el.textContent='EM';
    });
    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      var root=panel.closest('.qmes-ipad-pop');
      var code=root && root.querySelector('.qmes-ipad-work-head > div:nth-child(2) > span');
      if(code && code.textContent.trim()==='EQ') code.textContent='EM';
    });
  }
  apply();
  var scheduled=false;
  new MutationObserver(function(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){ scheduled=false; apply(); });
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
