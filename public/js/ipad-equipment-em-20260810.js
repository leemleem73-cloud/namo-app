(function qmesIpadEquipmentEm(){
  function loadRuntimeStyle(){
    var version='20260810-5';
    var existing=document.querySelector('script[data-qmes-ipad-runtime-style]');
    if(existing){
      if(!existing.src.includes('v='+version)) existing.src='./js/ipad-pop-runtime-style-20260810.js?v='+version;
      return;
    }
    var script=document.createElement('script');
    script.src='./js/ipad-pop-runtime-style-20260810.js?v='+version;
    script.defer=true;
    script.setAttribute('data-qmes-ipad-runtime-style','1');
    document.head.appendChild(script);
  }

  function ensureEquipmentFixStyle(){
    var id='qmes-equipment-em-direct-fix';
    var style=document.getElementById(id);
    if(!style){
      style=document.createElement('style');
      style.id=id;
      document.head.appendChild(style);
    }
    style.textContent=`
      .qmes-ipad-equipment .qmes-equipment-subcaption-hidden{display:none!important;}
      .qmes-ipad-equipment .qmes-equipment-summary-card,
      .qmes-ipad-equipment .qmes-equipment-summary-card *{box-shadow:none!important;}
      .qmes-ipad-equipment .qmes-equipment-summary-value,
      .qmes-ipad-equipment .qmes-equipment-summary-number,
      .qmes-ipad-equipment .qmes-equipment-summary-unit{
        background:transparent!important;background-color:transparent!important;
        border:0!important;outline:0!important;box-shadow:none!important;
        border-radius:0!important;padding:0!important;
      }
      .qmes-ipad-equipment .qmes-equipment-summary-value{
        display:inline-flex!important;align-items:baseline!important;
        justify-content:center!important;gap:5px!important;
      }
      .qmes-ipad-equipment .qmes-equipment-summary-number{
        font-size:30px!important;font-weight:950!important;color:#111827!important;line-height:1!important;
      }
      .qmes-ipad-equipment .qmes-equipment-summary-unit{
        font-size:16px!important;font-weight:800!important;color:#475569!important;line-height:1!important;
      }
      .qmes-ipad-equipment .qmes-equipment-nav-block>button{
        font-size:17px!important;font-weight:900!important;
      }
      .qmes-ipad-equipment .qmes-equipment-nav-block>button.is-active,
      .qmes-ipad-equipment .qmes-equipment-nav-block>button[aria-selected="true"],
      .qmes-ipad-equipment .qmes-equipment-nav-block>button.qmes-equipment-nav-selected{
        background:#e0f2fe!important;border-color:#38bdf8!important;color:#0f172a!important;
        box-shadow:0 0 0 1px rgba(56,189,248,.18)!important;
      }
      .qmes-ipad-equipment .qmes-equipment-complete-status{
        background:#fff!important;border:1.5px solid #22c55e!important;
        color:#16a34a!important;box-shadow:none!important;
      }
      .qmes-ipad-equipment .qmes-equipment-complete-status *,
      .qmes-ipad-equipment .qmes-equipment-complete-status svg{
        color:#16a34a!important;stroke:#16a34a!important;
      }
    `;
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

    if(!right) return;

    right.classList.add('qmes-equipment-tour-status-actions','qmes-equipment-tour-statuses');
    right.style.setProperty('display','grid','important');
    right.style.setProperty('grid-template-columns','repeat(3,132px)','important');
    right.style.setProperty('gap','10px','important');
    right.style.setProperty('flex','0 0 auto','important');
    right.style.setProperty('white-space','nowrap','important');

    Array.from(right.children).forEach(function(child,index){
      child.style.setProperty('width','132px','important');
      child.style.setProperty('min-width','132px','important');
      child.style.setProperty('max-width','132px','important');
      child.style.setProperty('height','38px','important');
      child.style.setProperty('min-height','38px','important');
      child.style.setProperty('max-height','38px','important');
      child.style.setProperty('font-size','12px','important');
      child.style.setProperty('line-height','1','important');
      child.style.setProperty('font-weight','700','important');
      child.style.setProperty('white-space','nowrap','important');
      child.style.setProperty('box-shadow','none','important');
      child.style.setProperty('background','#fff','important');
      child.style.setProperty('display','flex','important');
      child.style.setProperty('align-items','center','important');
      child.style.setProperty('justify-content','center','important');

      child.querySelectorAll('*').forEach(function(inner){
        inner.style.setProperty('font-size','12px','important');
        inner.style.setProperty('line-height','1','important');
        inner.style.setProperty('font-weight','700','important');
        inner.style.setProperty('white-space','nowrap','important');
      });

      if(index===1){
        child.classList.add('qmes-equipment-sync-status');
        var textNodes=[];
        var walker=document.createTreeWalker(child,NodeFilter.SHOW_TEXT);
        var node;
        while((node=walker.nextNode())) textNodes.push(node);
        var target=textNodes.find(function(n){return n.nodeValue&&n.nodeValue.trim().length>0;});
        if(target&&target.nodeValue.trim()!=='PC·모바일 동기화') target.nodeValue='PC·모바일 동기화';
        var svg=child.querySelector('svg');
        if(svg){
          svg.style.setProperty('color','#22c55e','important');
          svg.style.setProperty('stroke','#22c55e','important');
        }
      }

      if(index===2){
        child.classList.add('qmes-equipment-complete-status');
        child.style.setProperty('border','1.5px solid #22c55e','important');
        child.style.setProperty('color','#16a34a','important');
        child.querySelectorAll('*').forEach(function(inner){
          inner.style.setProperty('color','#16a34a','important');
          inner.style.setProperty('stroke','#16a34a','important');
        });
        var completeSvg=child.querySelector('svg');
        if(completeSvg){
          completeSvg.style.setProperty('color','#16a34a','important');
          completeSvg.style.setProperty('stroke','#16a34a','important');
        }
      }
    });
  }

  function cleanSummary(panel){
    panel.querySelectorAll('div,span,p,small,strong').forEach(function(el){
      if(el.children.length!==0) return;
      var text=el.textContent.replace(/\s+/g,'').trim();
      if(text==='일일점검'||text==='설비기본정보'){
        el.classList.add('qmes-equipment-subcaption-hidden');
      }
    });

    ['등록 설비','30일 이내 일정','기한 초과','미완료 수리'].forEach(function(label){
      panel.querySelectorAll('div,span,p,strong').forEach(function(el){
        if(el.children.length!==0||el.textContent.trim()!==label) return;
        var card=el.parentElement;
        if(!card) return;

        card.classList.add('qmes-equipment-summary-card');
        card.style.setProperty('text-align','center','important');
        card.querySelectorAll('*').forEach(function(x){
          x.style.setProperty('box-shadow','none','important');
        });

        Array.from(card.children||[]).forEach(function(child){
          var t=child.textContent.replace(/\s+/g,'').trim();
          if(!/^\d+(대|건)$/.test(t)) return;
          child.classList.add('qmes-equipment-summary-value');
          child.style.setProperty('background','transparent','important');
          child.style.setProperty('border','0','important');
          child.style.setProperty('box-shadow','none','important');
          child.style.setProperty('padding','0','important');
          child.querySelectorAll('*').forEach(function(x){
            x.style.setProperty('background','transparent','important');
            x.style.setProperty('border','0','important');
            x.style.setProperty('box-shadow','none','important');
            x.style.setProperty('padding','0','important');
          });
        });
      });
    });
  }

  function apply(){
    ensureEquipmentFixStyle();
    document.querySelectorAll('.qmes-ipad-home-card.is-equipment .qmes-ipad-home-code').forEach(function(el){
      if(el.textContent.trim()==='EQ') el.textContent='EM';
    });

    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      var root=panel.closest('.qmes-ipad-pop');
      var code=root&&root.querySelector('.qmes-ipad-work-head > div:nth-child(2) > span');
      if(code&&code.textContent.trim()==='EQ') code.textContent='EM';

      stabilizeDailyTourHeader(panel);
      cleanSummary(panel);

      panel.querySelectorAll('h1,h2,h3,h4,h5,strong,span,p,div').forEach(function(el){
        if(el.children.length===0&&el.textContent.trim()==='설비대장'){
          el.classList.add('qmes-equipment-registry-title');
        }
      });
      panel.querySelectorAll('button').forEach(function(button){
        if(button.textContent.replace(/\s+/g,'').includes('신규등록')){
          button.classList.add('qmes-equipment-new-register');
        }
      });
    });
  }

  loadRuntimeStyle();
  apply();
  var scheduled=false;
  new MutationObserver(function(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      apply();
    });
  }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
