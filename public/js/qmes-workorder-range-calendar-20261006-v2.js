/* Work order instruction-period range calendar — 2026-10-06 V2
 * Applies only to 작업지시 관리 > 지시기간.
 * The benchmark's red-marked shortcut rows are intentionally omitted.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_RANGE_CALENDAR_20261006_V2__) return;
  window.__QMES_WORKORDER_RANGE_CALENDAR_20261006_V1__=true;

  var POP_ID="qmes-workorder-range-calendar-20261006-v2";
  var state={range:null,from:null,to:null,display:null,tempFrom:"",tempTo:"",selectingEnd:false,left:null,right:null};

  function pad(n){return String(n).padStart(2,"0")}
  function iso(y,m,d){return y+"-"+pad(m)+"-"+pad(d)}
  function valid(v){return /^20\d{2}-\d{2}-\d{2}$/.test(String(v||""))}
  function parse(v){
    if(valid(v)){
      var p=v.split("-").map(Number),d=new Date(p[0],p[1]-1,p[2]);
      if(d.getFullYear()===p[0]&&d.getMonth()===p[1]-1&&d.getDate()===p[2]) return d;
    }
    return new Date();
  }
  function ym(v){var d=parse(v);return {y:d.getFullYear(),m:d.getMonth()}}
  function moveMonth(obj,delta){
    var d=new Date(obj.y,obj.m+delta,1);
    return {y:d.getFullYear(),m:d.getMonth()};
  }
  function dateIso(d){return iso(d.getFullYear(),d.getMonth()+1,d.getDate())}
  function mondayOf(d){
    var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    var day=x.getDay();
    var diff=(day===0?-6:1-day);
    x.setDate(x.getDate()+diff);
    return x;
  }
  function presetRange(key){
    var now=new Date();
    var from=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    var to=new Date(from);
    if(key==="today"){
      // today only
    }else if(key==="yesterday"){
      from.setDate(from.getDate()-1);to=new Date(from);
    }else if(key==="week"){
      from=mondayOf(now);to=new Date(from);to.setDate(to.getDate()+6);
    }else if(key==="prevweek"){
      from=mondayOf(now);from.setDate(from.getDate()-7);to=new Date(from);to.setDate(to.getDate()+6);
    }else if(key==="month"){
      from=new Date(now.getFullYear(),now.getMonth(),1);to=new Date(now.getFullYear(),now.getMonth()+1,0);
    }else if(key==="prevmonth"){
      from=new Date(now.getFullYear(),now.getMonth()-1,1);to=new Date(now.getFullYear(),now.getMonth(),0);
    }else return;
    state.tempFrom=dateIso(from);
    state.tempTo=dateIso(to);
    state.left=ym(state.tempFrom);
    state.right=ym(state.tempTo);
    state.selectingEnd=false;
    render();
  }
  function rangeDays(a,b){
    if(!valid(a)||!valid(b)) return 0;
    var da=parse(a),db=parse(b);
    return Math.floor((db.getTime()-da.getTime())/86400000)+1;
  }
  function setNativeValue(input,value){
    if(!input) return;
    try{
      var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
      if(setter&&setter.set) setter.set.call(input,value); else input.value=value;
    }catch(_){input.value=value}
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }
  function syncDisplay(range){
    if(!range) return;
    var from=range.querySelector("#qwf2-from"),to=range.querySelector("#qwf2-to"),display=range.querySelector("[data-qmes-workorder-range-display]");
    if(!from||!to||!display) return;
    var value=display.querySelector(".qmes-range-value");
    if(value) value.textContent=(from.value||"YYYY-MM-DD")+" ~ "+(to.value||"YYYY-MM-DD");
  }
  function calendarIcon(){
    return '<svg class="qmes-range-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1"></rect><path d="M16 3v4M8 3v4M3 10h18"></path></svg>';
  }
  function bindRange(){
    var range=document.querySelector("#qmes-workorder-erp-list-v1 .qerp-date");
    if(!range) return false;
    var from=range.querySelector("#qwf2-from"),to=range.querySelector("#qwf2-to");
    if(!from||!to) return false;

    if(!range.classList.contains("qmes-amaranth-range-bound")){
      range.classList.add("qmes-amaranth-range-bound");
      var btn=document.createElement("button");
      btn.type="button";
      btn.className="qmes-workorder-range-display";
      btn.setAttribute("data-qmes-workorder-range-display","1");
      btn.setAttribute("aria-haspopup","dialog");
      btn.setAttribute("aria-label","지시기간 선택");
      btn.innerHTML='<span class="qmes-range-value"></span>'+calendarIcon();
      range.appendChild(btn);

      btn.addEventListener("click",function(e){
        e.preventDefault();
        e.stopPropagation();
        openRange(range);
      });
      [from,to].forEach(function(input){
        input.addEventListener("input",function(){syncDisplay(range)});
        input.addEventListener("change",function(){syncDisplay(range)});
      });
    }
    syncDisplay(range);
    return true;
  }
  function panelHtml(side,obj){
    var first=new Date(obj.y,obj.m,1);
    var start=new Date(obj.y,obj.m,1-first.getDay());
    var days=[];
    for(var i=0;i<42;i++){
      var d=new Date(start);d.setDate(start.getDate()+i);
      var value=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
      var cls=["qmes-range-day"];
      if(d.getDay()===0) cls.push("sun");
      if(d.getMonth()!==obj.m) cls.push("other");
      if(valid(state.tempFrom)&&valid(state.tempTo)&&value>state.tempFrom&&value<state.tempTo) cls.push("in-range");
      if(value===state.tempFrom||value===state.tempTo) cls.push("selected");
      days.push('<button type="button" class="'+cls.join(" ")+'" data-range-date="'+value+'" data-range-side="'+side+'">'+d.getDate()+'</button>');
    }
    return '<section class="qmes-range-month" data-panel="'+side+'">'+
      '<div class="qmes-range-month-head">'+
        '<button type="button" class="qmes-range-nav" data-range-nav="'+side+'" data-range-delta="-12" aria-label="이전 연도">«</button>'+
        '<button type="button" class="qmes-range-nav" data-range-nav="'+side+'" data-range-delta="-1" aria-label="이전 달">‹</button>'+
        '<div class="qmes-range-month-title">'+obj.y+'.'+pad(obj.m+1)+'</div>'+
        '<button type="button" class="qmes-range-nav" data-range-nav="'+side+'" data-range-delta="1" aria-label="다음 달">›</button>'+
        '<button type="button" class="qmes-range-nav" data-range-nav="'+side+'" data-range-delta="12" aria-label="다음 연도">»</button>'+
      '</div>'+
      '<div class="qmes-range-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'+
      '<div class="qmes-range-days">'+days.join("")+'</div>'+
    '</section>';
  }
  function position(){
    var pop=document.getElementById(POP_ID);
    if(!pop||!state.display) return;
    var r=state.display.getBoundingClientRect();
    var pr=pop.getBoundingClientRect();
    var left=r.left,top=r.bottom+4;
    if(left+pr.width>window.innerWidth-6) left=Math.max(6,window.innerWidth-pr.width-6);
    if(top+pr.height>window.innerHeight-6) top=Math.max(6,r.top-pr.height-4);
    pop.style.left=Math.round(left)+"px";
    pop.style.top=Math.round(top)+"px";
  }
  function render(){
    var pop=document.getElementById(POP_ID);
    if(!pop) return;
    pop.innerHTML=
      '<div class="qmes-range-shortcuts">'+
        '<button type="button" data-range-preset="today">오늘</button>'+
        '<button type="button" data-range-preset="yesterday">전일</button>'+
        '<button type="button" data-range-preset="week">주간</button>'+
        '<button type="button" data-range-preset="prevweek">전주</button>'+
        '<button type="button" data-range-preset="month">당월</button>'+
        '<button type="button" data-range-preset="prevmonth">이전달</button>'+
      '</div>'+
      '<div class="qmes-range-cal-body">'+panelHtml("left",state.left)+panelHtml("right",state.right)+'</div>'+
      '<div class="qmes-range-foot">'+
        '<div class="qmes-range-foot-actions"><button type="button" class="qmes-range-foot-btn" data-range-cancel>취소</button><button type="button" class="qmes-range-foot-btn confirm" data-range-confirm>확인</button></div></div>';
    position();
  }
  function ensurePopup(){
    var old=document.getElementById(POP_ID);
    if(old) old.remove();
    var pop=document.createElement("div");
    pop.id=POP_ID;
    pop.setAttribute("role","dialog");
    pop.setAttribute("aria-label","지시기간 선택");
    document.body.appendChild(pop);
    pop.addEventListener("click",function(e){
      var preset=e.target.closest("[data-range-preset]");
      if(preset){
        e.preventDefault();e.stopPropagation();
        presetRange(preset.getAttribute("data-range-preset")||"");
        return;
      }
      var nav=e.target.closest("[data-range-nav]");
      if(nav){
        e.preventDefault();e.stopPropagation();
        var side=nav.getAttribute("data-range-nav"),delta=Number(nav.getAttribute("data-range-delta"))||0;
        state[side]=moveMonth(state[side],delta);render();return;
      }
      var day=e.target.closest("[data-range-date]");
      if(day){
        e.preventDefault();e.stopPropagation();
        var value=day.getAttribute("data-range-date")||"";
        if(!state.selectingEnd){
          state.tempFrom=value;state.tempTo=value;state.selectingEnd=true;
        }else{
          if(value<state.tempFrom){state.tempTo=state.tempFrom;state.tempFrom=value}else state.tempTo=value;
          state.selectingEnd=false;
        }
        render();return;
      }
      if(e.target.closest("[data-range-cancel]")){e.preventDefault();e.stopPropagation();closeRange();return}
      if(e.target.closest("[data-range-confirm]")){
        e.preventDefault();e.stopPropagation();
        if(!valid(state.tempFrom)||!valid(state.tempTo)) return;
        setNativeValue(state.from,state.tempFrom);
        setNativeValue(state.to,state.tempTo);
        syncDisplay(state.range);
        closeRange();
      }
    });
    return pop;
  }
  function openRange(range){
    var from=range.querySelector("#qwf2-from"),to=range.querySelector("#qwf2-to"),display=range.querySelector("[data-qmes-workorder-range-display]");
    if(!from||!to||!display) return;
    state.range=range;state.from=from;state.to=to;state.display=display;
    var today=iso(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate());
    state.tempFrom=valid(from.value)?from.value:today;
    state.tempTo=valid(to.value)?to.value:state.tempFrom;
    if(state.tempTo<state.tempFrom){var t=state.tempFrom;state.tempFrom=state.tempTo;state.tempTo=t}
    state.left=ym(state.tempFrom);
    state.right=ym(state.tempTo);
    state.selectingEnd=false;
    ensurePopup();
    render();
  }
  function closeRange(){
    var pop=document.getElementById(POP_ID);if(pop) pop.remove();
    state.range=null;state.from=null;state.to=null;state.display=null;
  }
  function schedule(){requestAnimationFrame(function(){try{bindRange()}catch(_){}})}
  document.addEventListener("pointerdown",function(e){
    var pop=document.getElementById(POP_ID);
    if(!pop) return;
    if(e.target.closest&&e.target.closest("#"+POP_ID)) return;
    if(e.target.closest&&e.target.closest("[data-qmes-workorder-range-display]")) return;
    closeRange();
  },true);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&document.getElementById(POP_ID)) closeRange()},true);
  document.addEventListener("click",function(e){
    if(e.target.closest&&e.target.closest('#qmes-workorder-erp-list-v1 [data-top="reset"]')) setTimeout(schedule,0);
  },true);
  window.addEventListener("resize",position,{passive:true});
  window.addEventListener("scroll",position,true);
  ["qmes:navigate-tab","qmes:data-updated","qmes:workorder-saved","qmes:workorder-synced"].forEach(function(name){window.addEventListener(name,schedule)});
  var main=document.querySelector("#root>div>main");
  if(main){
    var observer=new MutationObserver(function(){schedule()});
    observer.observe(main,{childList:true,subtree:true});
  }
  [0,120,500,1200].forEach(function(ms){setTimeout(schedule,ms)});
})();
