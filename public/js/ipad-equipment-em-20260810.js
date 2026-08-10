(function qmesIpadEquipmentEm(){
  function loadRuntimeStyle(){
    if(document.querySelector('script[data-qmes-ipad-runtime-style]')) return;
    var script=document.createElement('script');
    script.src='./js/ipad-pop-runtime-style-20260810.js?v=20260810-1';
    script.defer=true;
    script.setAttribute('data-qmes-ipad-runtime-style','1');
    document.head.appendChild(script);
  }
  function apply(){
    document.querySelectorAll('.qmes-ipad-home-card.is-equipment .qmes-ipad-home-code').forEach(function(el){
      if(el.textContent.trim()==='EQ') el.textContent='EM';
    });
    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      var root=panel.closest('.qmes-ipad-pop');
      var code=root && root.querySelector('.qmes-ipad-work-head > div:nth-child(2) > span');
      if(code && code.textContent.trim()==='EQ') code.textContent='EM';

      panel.querySelectorAll('h1,h2,h3,h4,h5,strong,span,p,div').forEach(function(el){
        if(el.children.length===0 && el.textContent.trim()==='설비대장') el.classList.add('qmes-equipment-registry-title');
      });
      panel.querySelectorAll('button').forEach(function(button){
        if(button.textContent.replace(/\s+/g,'').includes('신규등록')) button.classList.add('qmes-equipment-new-register');
      });
    });
  }
  loadRuntimeStyle();
  apply();
  var scheduled=false;
  new MutationObserver(function(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){ scheduled=false; apply(); });
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
