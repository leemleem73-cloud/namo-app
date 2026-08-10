(function qmesIpadEquipmentEm(){
  function loadRuntimeStyle(){
    var existing=document.querySelector('script[data-qmes-ipad-runtime-style]');
    if(existing){
      if(!/v=20260810-2/.test(existing.src||'')) existing.src='./js/ipad-pop-runtime-style-20260810.js?v=20260810-2';
      return;
    }
    var script=document.createElement('script');
    script.src='./js/ipad-pop-runtime-style-20260810.js?v=20260810-2';
    script.defer=true;
    script.setAttribute('data-qmes-ipad-runtime-style','1');
    document.head.appendChild(script);
  }

  function stabilizeDailyTourHeader(panel){
    var marker=Array.from(panel.querySelectorAll('p')).find(function(p){
      return p.textContent.includes('관리계획서 기준 5개 설비 일일 순회점검');
    });
    if(!marker) return;

    var left=marker.parentElement;
    var row=left&&left.parentElement;
    if(!row) return;
    var right=left.nextElementSibling;

    row.classList.add('qmes-equipment-tour-status-row');
    row.style.setProperty('display','flex','important');
    row.style.setProperty('flex-wrap','nowrap','important');
    row.style.setProperty('align-items','center','important');
    row.style.setProperty('justify-content','space-between','important');
    row.style.setProperty('gap','12px','important');

    left.style.setProperty('flex','1 1 auto','important');
    left.style.setProperty('min-width','0','important');
    marker.style.setProperty('min-width','0','important');
    marker.style.setProperty('margin','0','important');

    if(right){
      right.classList.add('qmes-equipment-tour-status-actions');
      right.style.setProperty('display','flex','important');
      right.style.setProperty('flex-wrap','nowrap','important');
      right.style.setProperty('align-items','center','important');
      right.style.setProperty('gap','8px','important');
      right.style.setProperty('flex','0 0 auto','important');
      right.style.setProperty('white-space','nowrap','important');
      Array.from(right.children).forEach(function(child){
        child.style.setProperty('flex','0 0 auto','important');
        child.style.setProperty('white-space','nowrap','important');
      });
    }
  }

  function apply(){
    document.querySelectorAll('.qmes-ipad-home-card.is-equipment .qmes-ipad-home-code').forEach(function(el){
      if(el.textContent.trim()==='EQ') el.textContent='EM';
    });
    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      var root=panel.closest('.qmes-ipad-pop');
      var code=root && root.querySelector('.qmes-ipad-work-head > div:nth-child(2) > span');
      if(code && code.textContent.trim()==='EQ') code.textContent='EM';

      stabilizeDailyTourHeader(panel);

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
  }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
