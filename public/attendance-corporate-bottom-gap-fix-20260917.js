(()=>{
'use strict';
if(window.__NAMO_ATTENDANCE_BOTTOM_GAP_FIX_20260917__)return;
window.__NAMO_ATTENDANCE_BOTTOM_GAP_FIX_20260917__=true;
const id='namo-attendance-bottom-gap-style-20260917';
if(!document.getElementById(id)){
  const s=document.createElement('style');
  s.id=id;
  s.textContent=`
html[data-namo-corporate-home="1"] body{min-height:0!important;height:auto!important}
html[data-namo-corporate-home="1"] .app-shell{min-height:100vh!important;height:auto!important}
html[data-namo-corporate-home="1"] main{min-height:0!important;height:auto!important;padding-bottom:76px!important}
html[data-namo-corporate-home="1"] .page[data-page="home"]{min-height:0!important;height:auto!important;padding-bottom:10px!important}
html[data-namo-corporate-home="1"] #namoCorporateHome{min-height:0!important;height:auto!important;margin-bottom:0!important;padding-bottom:0!important}
html[data-namo-corporate-home="1"] #namoCorporateHome .namo-corp-week{margin-bottom:0!important}
html[data-namo-corporate-home="1"] #namoCorporateBottomNav{bottom:0!important}
`;
  document.head.appendChild(s);
}
})();
