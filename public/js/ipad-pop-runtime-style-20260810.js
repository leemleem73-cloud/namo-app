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
.qmes-ipad-equipment .qmes-equipment-tour-complete-title{font-size:18px!important;line-height:1.35!important;font-weight:800!important;margin-top:8px!important;}
.qmes-ipad-equipment .qmes-equipment-tour-complete-badge{font-size:12px!important;line-height:1.2!important;font-weight:700!important;}
.qmes-ipad-equipment .qmes-equipment-tour-complete-button{font-size:12px!important;line-height:1.2!important;font-weight:700!important;}
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
 .qmes-ipad-equipment .qmes-equipment-tour-complete-title{font-size:18px!important;}
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
        }
        if(el.children.length===0 && /^오늘 순회점검\s*\d+\/\d+\s*완료$/.test(text)) el.classList.add('qmes-equipment-tour-complete-badge');
      });
      panel.querySelectorAll('button').forEach(function(button){
        var compact=button.textContent.replace(/\s+/g,'');
        if(compact.includes('신규등록')) button.classList.add('qmes-equipment-new-register');
        if(compact==='오늘순회점검완료') button.classList.add('qmes-equipment-tour-complete-button');
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
