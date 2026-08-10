(function qmesIpadRuntimeStyle(){
  var STYLE_ID='qmes-ipad-runtime-final-style';
  var css=`
body > #root > div:has(.qmes-ipad-pop){
  background:
    radial-gradient(ellipse at 8% 14%,rgba(31,52,70,.42) 0%,rgba(31,52,70,.16) 20%,transparent 43%),
    radial-gradient(ellipse at 19% 45%,rgba(146,155,163,.42) 0%,rgba(146,155,163,.16) 23%,transparent 48%),
    radial-gradient(ellipse at 10% 82%,rgba(62,80,95,.31) 0%,rgba(62,80,95,.11) 21%,transparent 45%),
    radial-gradient(ellipse at 36% 25%,rgba(130,140,149,.29) 0%,rgba(130,140,149,.10) 24%,transparent 49%),
    radial-gradient(ellipse at 57% 61%,rgba(91,104,116,.23) 0%,rgba(91,104,116,.08) 25%,transparent 50%),
    radial-gradient(ellipse at 79% 17%,rgba(207,211,214,.38) 0%,rgba(207,211,214,.14) 24%,transparent 49%),
    radial-gradient(ellipse at 94% 46%,rgba(82,101,117,.16) 0%,rgba(82,101,117,.06) 22%,transparent 46%),
    radial-gradient(ellipse at 88% 84%,rgba(220,223,226,.34) 0%,rgba(220,223,226,.12) 24%,transparent 48%),
    linear-gradient(160deg,#304655 0%,#4e606c 20%,#707c84 43%,#969da2 66%,#b8bdc1 83%,#d0d3d5 100%)!important;
  background-color:#737f87!important;
  background-attachment:fixed!important;
}
.qmes-ipad-pop .qmes-ipad-hero h1{font-size:34px!important;font-weight:900!important;}
.qmes-ipad-pop .qmes-ipad-home-code{font-size:58px!important;font-weight:950!important;letter-spacing:-.08em!important;}
.qmes-ipad-pop .qmes-ipad-home-card>strong{font-size:28px!important;font-weight:900!important;}
.qmes-ipad-pop .qmes-ipad-work-head>div:nth-child(2)>span{display:inline-block!important;white-space:nowrap!important;font-family:Arial,Helvetica,sans-serif!important;font-size:24px!important;font-weight:900!important;letter-spacing:-.06em!important;word-spacing:0!important;line-height:1!important;color:#5f7182!important;}
.qmes-ipad-pop .qmes-ipad-work-head h1{font-size:24px!important;font-weight:900!important;}
.qmes-ipad-pop .qmes-ipad-mode-tabs small,.qmes-ipad-pop .qmes-ipad-mode-tabs button>small{font-family:Arial,Helvetica,sans-serif!important;font-size:22px!important;font-weight:900!important;letter-spacing:-.06em!important;word-spacing:0!important;white-space:nowrap!important;}
.qmes-ipad-pop .qmes-ipad-mode-tabs strong{font-size:19px!important;font-weight:900!important;}
.qmes-ipad-pop .qmes-ipad-mode-tabs + .qmes-ipad-section .qmes-ipad-section-title h2{font-size:25px!important;font-weight:950!important;line-height:44px!important;}
.qmes-ipad-pop .qmes-ipad-section:nth-of-type(2) .qmes-ipad-section-title h2{font-size:21px!important;font-weight:900!important;line-height:44px!important;}
.qmes-ipad-pop .qmes-ipad-form-grid label>span{font-size:16px!important;font-weight:900!important;line-height:1.35!important;color:#17212b!important;}
.qmes-ipad-pop .qmes-ipad-item-tabs button strong{font-size:18px!important;font-weight:900!important;}
.qmes-ipad-pop .qmes-ipad-item-tabs button:nth-child(4) strong::after{font-size:18px!important;font-weight:900!important;}
.qmes-ipad-equipment .qmes-equipment-registry-title{color:#111!important;font-weight:900!important;}
.qmes-ipad-equipment button.qmes-equipment-new-register{background:#fff!important;color:#111!important;border:1.5px solid #111!important;font-weight:900!important;box-shadow:0 2px 7px rgba(15,23,42,.08)!important;}
.qmes-ipad-equipment button.qmes-equipment-new-register *{color:#111!important;}

/* EM 상단 순회점검 안내: 한 줄 유지 + 살짝 작은 글씨 */
.qmes-ipad-equipment .qmes-equipment-tour-topbar{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex-wrap:nowrap!important;}
.qmes-ipad-equipment .qmes-equipment-tour-guide{display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important;flex:1 1 auto!important;}
.qmes-ipad-equipment .qmes-equipment-tour-guide p{font-size:13px!important;line-height:1.35!important;white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;margin:0!important;}
.qmes-ipad-equipment .qmes-equipment-tour-guide p span{font-size:13px!important;white-space:nowrap!important;}
.qmes-ipad-equipment .qmes-equipment-tour-statuses{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important;flex:0 0 auto!important;}
.qmes-ipad-equipment .qmes-equipment-tour-statuses>*{white-space:nowrap!important;box-shadow:none!important;filter:none!important;}
.qmes-ipad-equipment .qmes-equipment-tour-statuses button{box-shadow:none!important;}
.qmes-ipad-equipment .qmes-equipment-tour-statuses button:hover,.qmes-ipad-equipment .qmes-equipment-tour-statuses button:focus-visible{box-shadow:none!important;}

/* 완료 상태 텍스트 크기/줄바꿈 고정 */
.qmes-ipad-equipment .qmes-equipment-tour-complete-wrap{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:nowrap!important;min-width:0!important;}
.qmes-ipad-equipment .qmes-equipment-tour-complete-title{font-size:18px!important;line-height:1.35!important;font-weight:800!important;margin-top:8px!important;white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;flex:0 0 auto!important;}
.qmes-ipad-equipment .qmes-equipment-tour-complete-badge{font-size:12px!important;line-height:1.2!important;font-weight:700!important;white-space:nowrap!important;word-break:keep-all!important;flex:0 0 auto!important;}
.qmes-ipad-equipment .qmes-equipment-tour-complete-button{font-size:12px!important;line-height:1.2!important;font-weight:700!important;white-space:nowrap!important;word-break:keep-all!important;flex:0 0 auto!important;box-shadow:none!important;}

/* 바로 아래 '오늘 순회점검 완료 / 5개 설비...' 카드: 가운데 정렬 */
.qmes-ipad-equipment .qmes-equipment-complete-card{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;width:100%!important;}
.qmes-ipad-equipment .qmes-equipment-complete-card>svg{margin-left:auto!important;margin-right:auto!important;}
.qmes-ipad-equipment .qmes-equipment-complete-card h3,.qmes-ipad-equipment .qmes-equipment-complete-card p{width:100%!important;text-align:center!important;margin-left:auto!important;margin-right:auto!important;}

@media(max-width:980px){
 .qmes-ipad-equipment .qmes-equipment-tour-guide p,.qmes-ipad-equipment .qmes-equipment-tour-guide p span{font-size:12px!important;}
}
@media(max-width:620px){
 .qmes-ipad-pop .qmes-ipad-hero h1{font-size:28px!important;}
 .qmes-ipad-pop .qmes-ipad-home-code{font-size:48px!important;}
 .qmes-ipad-pop .qmes-ipad-home-card>strong{font-size:24px!important;}
 .qmes-ipad-pop .qmes-ipad-work-head>div:nth-child(2)>span{font-size:21px!important;}
 .qmes-ipad-pop .qmes-ipad-mode-tabs small,.qmes-ipad-pop .qmes-ipad-mode-tabs button>small{font-size:19px!important;}
 .qmes-ipad-pop .qmes-ipad-mode-tabs strong{font-size:17px!important;}
 .qmes-ipad-pop .qmes-ipad-mode-tabs + .qmes-ipad-section .qmes-ipad-section-title h2{font-size:22px!important;}
 .qmes-ipad-pop .qmes-ipad-form-grid label>span{font-size:15px!important;}
 .qmes-ipad-pop .qmes-ipad-item-tabs button strong,.qmes-ipad-pop .qmes-ipad-item-tabs button:nth-child(4) strong::after{font-size:16px!important;}
 .qmes-ipad-equipment .qmes-equipment-tour-complete-title{font-size:17px!important;}
 .qmes-ipad-equipment .qmes-equipment-tour-guide p,.qmes-ipad-equipment .qmes-equipment-tour-guide p span{font-size:11px!important;}
}`;
  function ensureStyle(){
    var style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    if(style.textContent!==css) style.textContent=css;
  }
  function markEquipment(){
    document.querySelectorAll('.qmes-ipad-equipment').forEach(function(panel){
      panel.querySelectorAll('h1,h2,h3,h4,h5,strong,span,p,div').forEach(function(el){
        var text=el.textContent.trim();
        if(el.children.length===0 && text==='설비대장') el.classList.add('qmes-equipment-registry-title');
        if(el.children.length===0 && text==='오늘 순회점검 완료'){
          if(el.tagName==='H3') el.classList.add('qmes-equipment-tour-complete-title');
          else el.classList.add('qmes-equipment-tour-complete-badge');
          if(el.parentElement) el.parentElement.classList.add('qmes-equipment-tour-complete-wrap');
        }
        if(el.children.length===0 && /^오늘 순회점검\s*\d+\/\d+\s*완료$/.test(text)){
          el.classList.add('qmes-equipment-tour-complete-badge');
          if(el.parentElement) el.parentElement.classList.add('qmes-equipment-tour-complete-wrap');
        }
      });

      /* 상단 안내 바 구조를 텍스트 기준으로 정확히 표시 */
      panel.querySelectorAll('p').forEach(function(p){
        var text=p.textContent.replace(/\s+/g,' ').trim();
        if(text.includes('관리계획서 기준 5개 설비 일일 순회점검')){
          var guide=p.parentElement;
          var topbar=guide&&guide.parentElement;
          if(guide) guide.classList.add('qmes-equipment-tour-guide');
          if(topbar){
            topbar.classList.add('qmes-equipment-tour-topbar');
            if(topbar.children&&topbar.children[1]) topbar.children[1].classList.add('qmes-equipment-tour-statuses');
          }
        }
      });

      panel.querySelectorAll('button').forEach(function(button){
        var compact=button.textContent.replace(/\s+/g,'');
        if(compact.includes('신규등록')) button.classList.add('qmes-equipment-new-register');
        if(compact==='오늘순회점검완료'){
          button.classList.add('qmes-equipment-tour-complete-button');
          if(button.parentElement) button.parentElement.classList.add('qmes-equipment-tour-complete-wrap');
        }
      });

      /* 바로 아래 완료 카드 식별 */
      panel.querySelectorAll('div').forEach(function(div){
        var title=Array.from(div.children||[]).find(function(child){return child.tagName==='H3'&&child.textContent.trim()==='오늘 순회점검 완료';});
        var desc=Array.from(div.children||[]).find(function(child){return child.tagName==='P'&&child.textContent.includes('5개 설비의 필수 세부항목');});
        if(title&&desc) div.classList.add('qmes-equipment-complete-card');
      });
    });
  }
  function apply(){ensureStyle();markEquipment();}
  apply();
  var scheduled=false;
  new MutationObserver(function(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(function(){scheduled=false;apply();});
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
