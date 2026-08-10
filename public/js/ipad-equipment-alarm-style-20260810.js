(function qmesIpadEquipmentAlarmStyle(){
  "use strict";
  if(window.__QMES_IPAD_EQUIPMENT_ALARM_STYLE_20260810__) return;
  window.__QMES_IPAD_EQUIPMENT_ALARM_STYLE_20260810__=true;

  var STYLE_ID='qmes-ipad-equipment-alarm-style-20260810';
  var ORANGE='#f59e0b';
  var ORANGE_SOFT='#fff7ed';
  var ORANGE_TEXT='#b45309';

  function ensureStyle(){
    var style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      .qmes-ipad-equipment .qmes-em-orange-accent{
        border-color:${ORANGE}!important;
        color:${ORANGE_TEXT}!important;
      }
      .qmes-ipad-equipment .qmes-em-orange-accent-fill{
        background:${ORANGE_SOFT}!important;
        border-color:${ORANGE}!important;
        color:${ORANGE_TEXT}!important;
      }
      .qmes-ipad-equipment .qmes-em-orange-accent svg,
      .qmes-ipad-equipment .qmes-em-orange-accent-fill svg{
        color:${ORANGE}!important;
        stroke:${ORANGE}!important;
      }
      .qmes-ipad-equipment .qmes-em-alarm-scope{
        --qmes-em-alarm-gap:10px;
      }
      .qmes-ipad-equipment .qmes-em-alarm-row{
        display:grid!important;
        grid-auto-flow:column!important;
        grid-auto-columns:minmax(86px,1fr)!important;
        align-items:stretch!important;
        gap:var(--qmes-em-alarm-gap)!important;
      }
      .qmes-ipad-equipment .qmes-em-alarm-cell{
        box-sizing:border-box!important;
        min-height:42px!important;
        padding:9px 12px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        line-height:1.25!important;
        font-size:13px!important;
        font-weight:700!important;
        letter-spacing:0!important;
        word-spacing:0!important;
        white-space:nowrap!important;
      }
      .qmes-ipad-equipment .qmes-em-alarm-cell *{
        margin:0!important;
        padding:0!important;
        font-size:inherit!important;
        line-height:inherit!important;
        font-weight:inherit!important;
        letter-spacing:0!important;
        word-spacing:0!important;
        white-space:nowrap!important;
      }
      @media(max-width:900px){
        .qmes-ipad-equipment .qmes-em-alarm-row{grid-auto-columns:minmax(78px,1fr)!important;gap:8px!important;}
        .qmes-ipad-equipment .qmes-em-alarm-cell{font-size:12px!important;padding:8px 9px!important;}
      }
    `;
  }

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}

  function findAlarmScope(panel){
    var candidates=Array.from(panel.querySelectorAll('h1,h2,h3,h4,h5,strong,p,span,div'));
    var title=candidates.find(function(el){
      var text=clean(el.textContent);
      return text.includes('알람')&&text.includes('이력')&&(text.includes('설비')||text.includes('공정'));
    });
    if(!title) return null;
    var scope=title.parentElement;
    for(var i=0;scope&&scope!==panel&&i<7;i+=1,scope=scope.parentElement){
      if(scope.querySelectorAll('input,select,button,textarea').length>=3 || scope.querySelectorAll('div,span').length>=8){
        scope.classList.add('qmes-em-alarm-scope');
        return scope;
      }
    }
    return title.parentElement;
  }

  function markAlarmCells(scope){
    if(!scope) return;
    var labels=['경고','시간','DR','조치 필요','조치필요'];
    var matched=Array.from(scope.querySelectorAll('button,input,select,textarea,span,strong,p,div,label')).filter(function(el){
      if(el.children.length>2) return false;
      var text=clean(el.value!=null&&el.value!==''?el.value:el.textContent);
      return labels.some(function(label){return text===label||text.includes(label);});
    });
    matched.forEach(function(el){el.classList.add('qmes-em-alarm-cell');});

    var parents=new Map();
    matched.forEach(function(el){
      var parent=el.parentElement;
      if(!parent) return;
      parents.set(parent,(parents.get(parent)||0)+1);
    });
    var row=Array.from(parents.entries()).sort(function(a,b){return b[1]-a[1];})[0];
    if(row&&row[1]>=2) row[0].classList.add('qmes-em-alarm-row');
  }

  function unifyOrange(panel){
    var textTargets=['EM','경고','주의','알람','기한 초과','30일 이내 일정'];
    Array.from(panel.querySelectorAll('button,span,strong,small,div')).forEach(function(el){
      var text=clean(el.textContent);
      if(!text||text.length>40) return;
      if(!textTargets.some(function(label){return text===label||text.includes(label);})) return;
      var css=getComputedStyle(el);
      var bg=css.backgroundColor;
      var border=css.borderTopColor;
      var color=css.color;
      var looksOrange=/rgb\((?:245|251|249|217),\s*(?:158|191|115|119),\s*(?:11|36|22|6)\)/.test(bg+' '+border+' '+color) || /orange|amber/i.test(String(el.className||''));
      if(looksOrange){
        el.classList.add('qmes-em-orange-accent-fill');
        el.querySelectorAll('svg').forEach(function(svg){svg.classList.add('qmes-em-orange-accent');});
      }
    });
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      unifyOrange(panel);
      var scope=findAlarmScope(panel);
      markAlarmCells(scope);
    });
  }

  var scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;apply();});}
  apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',schedule,true);
})();
